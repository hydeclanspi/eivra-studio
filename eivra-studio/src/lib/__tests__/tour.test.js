import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { initialTourState, stepId, tourReducer } from '../tour/tourMachine'
import { STEPS, TRACKS, trackDuration } from '../tour/tourScript'
import { readTourJSON, shouldAutoOffer, tourEligible, writeTourJSON } from '../tour/tourGate'
import { beamRoute, computeLanes, laserWave, pathClear, sampleLaserSpeed } from '../tour/laneRouting'
import { delay, tourBus } from '../tour/tourBus'

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
    expect(s.status).toBe('paused'); expect(s.index).toBe(4); expect(s.remaining).toBe(STEPS['combo.generate'].duration)
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
    expect(trackDuration('full')).toBeGreaterThanOrEqual(45000); expect(trackDuration('full')).toBeLessThanOrEqual(65000)
    expect(trackDuration('short')).toBeGreaterThanOrEqual(25000); expect(trackDuration('short')).toBeLessThanOrEqual(35000)
    for (const ids of Object.values(TRACKS)) { expect(new Set(ids).size).toBe(ids.length); ids.forEach((id) => expect(STEPS[id]).toBeTruthy()) }
    for (const step of Object.values(STEPS)) expect([...step.body].length).toBeLessThanOrEqual(60)
  })
  it('keeps every route, action and visible anchor attached to the actual product', () => {
    for (const step of Object.values(STEPS)) {
      expect(app, step.route).toContain(`path="${step.route}"`)
      for (const name of [step.anchor, step.preAnchor].filter(Boolean)) expect(sources, name).toContain(`data-tour="${name}"`)
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
  afterEach(() => vi.useRealTimers())
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
