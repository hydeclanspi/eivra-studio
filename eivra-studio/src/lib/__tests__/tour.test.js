import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { initialTourState, stepId, tourReducer } from '../tour/tourMachine'
import { ENTRY_DELAY_MS, DEMO_IMPORT, overviewDuration, routeBudget, STEPS, TRACKS, stepAtProgress, stepOffset, trackDuration } from '../tour/tourScript'
import { readTourJSON, shouldAutoOffer, tourEligible, writeTourJSON } from '../tour/tourGate'
import { beamRoute, computeLanes, laserWave, pathClear, sampleLaserSpeed } from '../tour/laneRouting'
import { delay, tourBus, tourCache } from '../tour/tourBus'
import { clipAnchorRect, sameAnchorRect } from '../tour/anchorGeometry'
import { parseNaturalInputOrders } from '../naturalInputOrders'
import { waitForInitialPage } from '../../components/tour/tourReady'

describe('tour playback lifecycle', () => {
  const reduce = (events, initial = initialTourState) => events.reduce(tourReducer, initial)
  it('pauses with the remaining dwell intact and resumes the same step', () => {
    const paused = reduce([{ type: 'START', track: 'short' }, { type: 'PHASE', phase: 'dwelling', remaining: 4000 }, { type: 'TICK', delta: 1250 }, { type: 'TAKE_OVER' }, { type: 'TICK', delta: 10000 }])
    expect(paused.status).toBe('paused'); expect(paused.remaining).toBe(2750)
    const resumed = tourReducer(paused, { type: 'RESUME' })
    expect(resumed.status).toBe('running'); expect(resumed.remaining).toBe(2750)
    expect(stepId(resumed)).toBe('new.quickInput'); expect(resumed.epoch).toBeGreaterThan(paused.epoch)
  })
  it.each(['PAUSE', 'TAB_HIDDEN', 'ROUTE_EXTERNAL'])('%s transfers control without advancing', (type) => {
    const s = reduce([{ type: 'START' }, { type }]); expect(s.status).toBe('paused'); expect(s.index).toBe(0)
  })
  it('finishes exactly at the end, clamps rewind, and replays from the beginning', () => {
    let s = reduce([{ type: 'START', track: 'short' }, { type: 'PREV' }])
    expect(s.index).toBe(0)
    for (let i = 0; i < TRACKS.short.length; i++) s = tourReducer(s, { type: 'NEXT' })
    expect(s.status).toBe('finale')
    s = tourReducer(s, { type: 'START', track: 'short' }); expect(s.index).toBe(0); expect(s.remaining).toBe(null)
  })
  it.each(['idle', 'offered', 'running', 'paused', 'finale', 'done'])('Esc exits from %s', (status) => {
    expect(tourReducer({ ...initialTourState, status }, { type: 'EXIT' }).status).toBe('done')
  })
  it('restores only known steps, clamps corrupted times, and waits for explicit resume', () => {
    const s = tourReducer(initialTourState, { type: 'RESTORE', record: { track: 'full', stepId: 'combo.generate', remaining: 999999 } })
    expect(s.status).toBe('paused'); expect(stepId(s)).toBe('combo.generate'); expect(s.remaining).toBe(STEPS['combo.generate'].duration)
    expect(tourReducer(initialTourState, { type: 'RESTORE', record: { stepId: 'removed' } })).toEqual(initialTourState)
  })
})

describe('demo eligibility and persistence', () => {
  it.each([
    { pathname: '/arsenal' }, { pathname: '/arsenal/new' }, { pathname: '/design2609' },
    { design: true }, { mode: 'full' }, { param: '0' }, { suppressed: true },
  ])('does not offer a tour in excluded context %j', (overrides) => {
    expect(tourEligible({ pathname: '/', mode: 'preview', ...overrides })).toBe(false)
  })
  it('offers only on first home visit; replay remains eligible elsewhere', () => {
    expect(shouldAutoOffer('/new', null)).toBe(true)
    expect(shouldAutoOffer('/dashboard/report', null)).toBe(false)
    expect(shouldAutoOffer('/', { status: 'dismissed' })).toBe(false)
    expect(tourEligible({ pathname: '/combo', mode: 'preview' })).toBe(true)
  })
  it('tolerates denied storage, malformed JSON and outdated versions', () => {
    const denied = { getItem() { throw Error('denied') }, setItem() { throw Error('denied') } }
    expect(readTourJSON(denied, 'key')).toBe(null)
    expect(() => writeTourJSON(denied, 'key', { status: 'completed' })).not.toThrow()
    expect(readTourJSON({ getItem: () => '{bad' }, 'key')).toBe(null)
    expect(readTourJSON({ getItem: () => '{"version":0}' }, 'key')).toBe(null)
  })
})

describe('script contract and anchor drift guard', () => {
  const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
  const readJSX = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? readJSX(path.join(dir, e.name)) : e.name.endsWith('.jsx') ? [fs.readFileSync(path.join(dir, e.name), 'utf8')] : []).join('\n')
  const sources = readJSX(sourceRoot)
  const app = fs.readFileSync(path.join(sourceRoot, 'App.jsx'), 'utf8')
  it('keeps both tracks within their editorial duration and concise copy budgets', () => {
    expect(trackDuration('full')).toBeGreaterThanOrEqual(120000); expect(trackDuration('full')).toBeLessThanOrEqual(165000)
    expect(trackDuration('short')).toBeGreaterThanOrEqual(60000); expect(trackDuration('short')).toBeLessThanOrEqual(95000)
    for (const ids of Object.values(TRACKS)) { expect(new Set(ids).size).toBe(ids.length); ids.forEach((id) => expect(STEPS[id]).toBeTruthy()) }
    for (const step of Object.values(STEPS)) expect([...step.body].length).toBeLessThanOrEqual(60)
  })
  it('counts every page overview in the timeline and includes all product areas', () => {
    const routes = new Set(TRACKS.full.map((id) => STEPS[id].route))
    for (const route of ['/dashboard', '/dashboard/analysis', '/dashboard/metrics', '/dashboard/report', '/history', '/history/teams']) expect(routes.has(route)).toBe(true)
    expect(TRACKS.short).toContain('new.postImport')
    for (const track of Object.keys(TRACKS)) {
      expect(stepOffset(track, TRACKS[track].length)).toBe(trackDuration(track))
      TRACKS[track].slice(1).forEach((id, index) => {
        const previous = TRACKS[track][index]
        const difference = stepOffset(track, index + 1) - stepOffset(track, index)
        expect(difference).toBe(STEPS[previous].duration + (STEPS[previous].route === STEPS[id].route ? 0 : routeBudget(STEPS[id].route)))
      })
    }
  })
  it('keeps every route, action and visible anchor attached to the actual product', () => {
    for (const step of Object.values(STEPS)) {
      expect(app, step.route).toContain(`path="${step.route}"`)
      for (const name of [step.anchor, step.preAnchor].filter(Boolean)) expect(sources.includes(`data-tour="${name}"`) || new RegExp(`data-tour=\\{[^\\n]*"${name.replaceAll('.', '\\.')}"`).test(sources), name).toBe(true)
      for (const action of [step.action, step.prepare].filter(Boolean)) expect(sources, action).toContain(`useTourAction('${action}'`)
    }
    expect(sources).toContain('data-tour="brand.logo"')
    expect(sources).toContain('data-tour="topbar.tourLauncher"')
  })
})

describe('real-layout light lanes', () => {
  const r = (left, top, right, bottom) => ({ left, top, right, bottom })
  it('uses open gaps >= 12px and removes lanes crossing a third card', () => {
    const cards = [r(0, 0, 100, 100), r(124, 0, 224, 100), r(0, 124, 100, 224), r(124, 124, 224, 224)]
    const lanes = computeLanes(cards)
    expect(lanes.some((l) => l.axis === 'V')).toBe(true); expect(lanes.some((l) => l.axis === 'H')).toBe(true)
    lanes.forEach((l) => expect(pathClear([l.a, l.b], cards)).toBe(true))
    expect(computeLanes([r(0, 0, 100, 100), r(110, 0, 200, 100)])).toHaveLength(0)
    const blocked = [...cards, r(105, 0, 119, 224)]
    computeLanes(blocked).forEach((l) => expect(pathClear([l.a, l.b], blocked)).toBe(true))
  })
  it('routes orthogonally around obstacles within three bends, with a mobile fallback', () => {
    const cards = [r(40, 40, 100, 100), r(124, 40, 224, 100)]
    const route = beamRoute([20, 20], cards[1], computeLanes(cards), cards)
    expect(pathClear(route, cards)).toBe(true); expect(route.length).toBeLessThanOrEqual(5)
    route.slice(1).forEach((p, i) => expect(p[0] === route[i][0] || p[1] === route[i][1]).toBe(true))
    expect(beamRoute([20, 20], cards[1], [], cards, true)).toHaveLength(2)
  })
  it('samples bounded speeds and never selects the same lane twice in a wave', () => {
    const lanes = [{ axis: 'H', a: [0, 0], b: [100, 0] }, { axis: 'V', a: [0, 0], b: [0, 100] }, { axis: 'H', a: [0, 100], b: [100, 100] }]
    for (let i = 0; i < 500; i++) {
      const speed = sampleLaserSpeed(); expect(speed).toBeGreaterThanOrEqual(.4); expect(speed).toBeLessThanOrEqual(1)
      const shots = laserWave(lanes, i === 0)
      expect(new Set(shots.map((s) => s.lane)).size).toBe(shots.length)
      expect(shots.length).toBeGreaterThan(0); expect(shots.length).toBeLessThanOrEqual(3)
    }
    expect(laserWave([], true)).toEqual([])
  })
})

describe('cancellable page actions', () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })
  it('waits three seconds and waits longer for unfinished resources', async () => {
    vi.useFakeTimers(); vi.stubGlobal('document', { readyState: 'loading', fonts: { status: 'loading' } })
    const ready = vi.fn(), ctl = new AbortController()
    const result = waitForInitialPage(ctl.signal, ENTRY_DELAY_MS).then(ready)
    await vi.advanceTimersByTimeAsync(2999); expect(ready).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1001); expect(ready).not.toHaveBeenCalled()
    document.readyState = 'complete'; document.fonts.status = 'loaded'
    await vi.advanceTimersByTimeAsync(100); await result; expect(ready).toHaveBeenCalledOnce()
  })
  it('manual start or unmount cancels a pending automatic welcome', async () => {
    vi.useFakeTimers(); const ctl = new AbortController()
    const waiting = waitForInitialPage(ctl.signal, ENTRY_DELAY_MS).catch((error) => error.name)
    ctl.abort(); expect(await waiting).toBe('AbortError'); expect(vi.getTimerCount()).toBe(0)
  })
  it('resets mounted page state and unmounted caches on replay or completion', () => {
    tourCache.set('new.form', { text: 'temporary tour input' }); tourCache.set('combo.result', { count: 20 })
    const stale = vi.fn(), mounted = vi.fn(() => expect(tourCache.get('new.form')).toBeUndefined())
    const old = tourBus.registerReset('new', stale), current = tourBus.registerReset('new', mounted)
    old(); tourBus.reset()
    expect(stale).not.toHaveBeenCalled(); expect(mounted).toHaveBeenCalledOnce(); expect(tourCache.get('combo.result')).toBeUndefined()
    current(); tourBus.reset(); expect(mounted).toHaveBeenCalledOnce()
  })
  it('cancels pending typing before the next state mutation', async () => {
    vi.useFakeTimers(); const mutate = vi.fn(), ctl = new AbortController()
    const off = tourBus.register('test.typing', async ({ signal }) => { await delay(45, signal); mutate(); return { ok: true } })
    const result = tourBus.run('test.typing', {}, { signal: ctl.signal }).catch((error) => error.name)
    ctl.abort(); await vi.runAllTimersAsync(); expect(await result).toBe('AbortError'); expect(mutate).not.toHaveBeenCalled(); off()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('times out a missing action and safely handles page unmount/re-registration', async () => {
    vi.useFakeTimers()
    const missing = tourBus.run('test.missing', {}, { timeoutMs: 80 })
    await vi.advanceTimersByTimeAsync(90); expect(await missing).toEqual({ ok: false, reason: 'timeout' })
    const old = tourBus.register('test.mount', () => ({ ok: false }))
    const current = tourBus.register('test.mount', () => ({ ok: true }))
    old(); expect(await tourBus.run('test.mount')).toEqual({ ok: true }); current()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('tour navigation and live geometry', () => {
  it('uses three-second page introductions and two-second history introductions', () => {
    expect(ENTRY_DELAY_MS).toBe(3000)
    for (const route of ['/new', '/combo', '/dashboard', '/params']) expect(overviewDuration(route)).toBe(3000)
    for (const route of ['/history', '/history/teams']) expect(overviewDuration(route)).toBe(2000)
  })
  it('seeks across route boundaries and replays an action from a clean phase', () => {
    for (const track of Object.keys(TRACKS)) {
      const ids = TRACKS[track]
      for (let index = 0; index < ids.length; index++) {
        const progress = (stepOffset(track, index) + 10) / trackDuration(track)
        expect(stepAtProgress(track, progress)).toBe(index)
        const moved = tourReducer({ ...initialTourState, status: 'running', track, phase: 'acting', index: ids.length - 1, remaining: 100 }, { type: 'SEEK', index })
        expect(moved).toMatchObject({ index, phase: 'routing', remaining: null, status: 'running' })
        expect(moved.epoch).toBe(1)
      }
      expect(stepAtProgress(track, -1)).toBe(0)
      expect(stepAtProgress(track, 2)).toBe(ids.length - 1)
    }
  })
  it('parses the import demonstration as two distinct orders with their own amounts', () => {
    const result = parseNaturalInputOrders(DEMO_IMPORT)
    expect(result.combos).toHaveLength(2)
    expect(result.combos.map((combo) => combo.actualInput)).toEqual([140, 20])
    expect(result.combos.map((combo) => combo.matches.length)).toEqual([1, 1])
  })
  it('does not split decimal odds or unnumbered multi-match inputs into orders', () => {
    expect(parseNaturalInputOrders('阿森纳2-0利物浦 odds 3.9 conf 0.71 140块').combos).toBeUndefined()
    const result = parseNaturalInputOrders('1. 阿森纳2-0利物浦 odds 3.9 140块\n2. 无法识别')
    expect(result.combos).toHaveLength(2)
    expect(result.diagnostics.some((d) => d.level === 'error' && d.message.startsWith('第 2 单'))).toBe(true)
  })
  it('clips both edges and hides targets outside the visible scroll area', () => {
    const bounds = { left: 8, right: 392, top: 72, bottom: 780 }
    const r = { left: 340, right: 700, top: 60, bottom: 900, width: 360, height: 840, radius: 18 }
    expect(clipAnchorRect(r, bounds)).toEqual({ left: 332, top: 72, width: 60, height: 708, radius: 18 })
    expect(clipAnchorRect({ ...r, top: 900 }, bounds)).toBe(null)
    expect(clipAnchorRect({ ...r, bottom: 60 }, bounds)).toBe(null)
    expect(clipAnchorRect(null, bounds)).toBe(null)
  })
  it('detects position-only motion even when dimensions do not change', () => {
    const r = { left: 10, top: 100, width: 360, height: 300, radius: 18 }
    expect(sameAnchorRect(r, { ...r, top: 150 })).toBe(false)
    expect(sameAnchorRect(r, { ...r, left: 10.1 })).toBe(true)
    expect(sameAnchorRect(r, null)).toBe(false)
  })
})
