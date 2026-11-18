import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createObservationPlan, getForwardStore, processForwardBatch, forwardPlanMetrics, assertForwardStore, mergeForwardStores } from '../quantForward'
import { normalizeEvidence, eventKey } from '../quantEvidence'
import { resetPreviewStore } from '../previewStore'

vi.mock('../displayMode', () => ({ isPreviewMode: () => false }))
const event = { home: '阿森纳', away: '切尔西', kickoff: '2026-01-15T12:00:00Z', source: 'test' }
const spec = { name: 'test', team: '阿森纳', venue: 'any', market: 'result', outcome: 'win', probMode: 'custom', customProb: .6, stakePerMatch: 10 }
const quote = { ...event, market: 'result', selection: 'home', odds: 2, observedAt: '2026-01-15T11:00:00Z' }
const result = { ...event, homeGoals: 1, awayGoals: 0, availableAt: '2026-01-15T14:00:00Z' }
const now = '2026-01-15T11:10:00Z'
const data = (quotes = [quote], results = []) => normalizeEvidence({ schemaVersion: 1, quotes, results }, { now: '2026-01-16T00:00:00Z' })
const plan = (patch = {}) => createObservationPlan({ version: { id: 'version1', createdAt: '2026-01-14T00:00:00Z', spec }, reviewAt: '2026-01-16T00:00:00Z', minSettled: 1, maxDrawdown: 10, now: '2026-01-15T10:00:00Z', ...patch })
beforeEach(() => {
  const store = new Map()
  vi.stubGlobal('window', { localStorage: { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) }, dispatchEvent: vi.fn() })
  vi.stubGlobal('CustomEvent', class CustomEvent { constructor(type, options) { this.type = type; this.detail = options.detail } })
  resetPreviewStore()
})
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); resetPreviewStore() })

describe('predeclared forward evidence', () => {
  it('freezes one plan per version and rejects retrospective plans', () => {
    plan()
    expect(() => plan()).toThrow('已有冻结计划')
    expect(() => plan({ version: { id: 'v2', createdAt: '2026-01-14T00:00:00Z', spec }, reviewAt: '2026-01-15T09:00:00Z' })).toThrow()
  })
  it('captures an immutable forecast and price, while retries append only rejected candidates', () => {
    const p = plan()
    const first = processForwardBatch(getForwardStore(), data(), { now, action: 'capture' })
    expect(first.orders).toHaveLength(1)
    expect(first.orders[0]).toMatchObject({ entryOdds: 2, forecastSnapshot: { probability: .6, generatedAt: now } })
    const second = processForwardBatch(first, data(), { now: '2026-01-15T11:11:00Z', action: 'capture' })
    expect(second.orders).toEqual(first.orders)
    expect(second.candidates.at(-1).reason).toBe('duplicate_order')
    expect(forwardPlanMetrics(second, p.id, { now }).profit).toBeNull()
  })
  it('records rejection reasons for stale quotes, closed markets, wrong teams and started events', () => {
    plan()
    const make = (evidence, time = now) => processForwardBatch(getForwardStore(), evidence, { now: time, action: 'capture' }).candidates[0].reason
    expect(make(data(), '2026-01-15T11:50:00Z')).toBe('stale_quote')
    expect(make(data([{ ...quote, tradable: false }]))).toBe('market_closed')
    expect(make(data([{ ...quote, home: '利物浦', away: '曼联' }]))).toBe('outside_scope')
    expect(make(data(), '2026-01-15T12:00:00Z')).toBe('event_started')
  })
  it('leaves unavailable probabilities explicit and does not accept a missing rating model', () => {
    plan({ version: { id: 'v2', createdAt: '2026-01-14T00:00:00Z', spec: { ...spec, probMode: 'ratings' } } })
    const next = processForwardBatch(getForwardStore(), data(), { now })
    expect(next.orders).toEqual([])
    expect(next.candidates[0].reason).toBe('ratings_unavailable')
  })
  it('settles only knowable, non-conflicting results; CLV requires a same-source recent quote', () => {
    const p = plan()
    const captured = processForwardBatch(getForwardStore(), data(), { now, action: 'capture' })
    const late = { ...quote, odds: 1.8, observedAt: '2026-01-15T11:55:00Z' }
    const all = data([quote, late], [result])
    expect(processForwardBatch(captured, all, { now: '2026-01-15T13:00:00Z', action: 'settle' }).settlements).toEqual([])
    const settled = processForwardBatch(captured, all, { now: '2026-01-15T14:01:00Z', action: 'settle' })
    expect(settled.settlements[0].profit).toBe(10)
    expect(settled.settlements[0].clv).toBeCloseTo(2 / 1.8 - 1)
    expect(forwardPlanMetrics(settled, p.id, { now: '2026-01-15T15:00:00Z' })).toMatchObject({ roi: 1, assessment: 'observing', coverage: { clv: 1 } })
    const conflicting = data([quote, late], [result, { ...result, homeGoals: 0, awayGoals: 1, source: 'second' }])
    expect(processForwardBatch(captured, conflicting, { now: '2026-01-15T14:01:00Z', action: 'settle' }).settlements).toEqual([])
    const noClose = processForwardBatch(captured, data([quote, { ...late, source: 'other' }], [result]), { now: '2026-01-15T14:01:00Z', action: 'settle' })
    expect(noClose.settlements[0].clv).toBeNull()
  })
  it('respects explicit collector scope and rejects edited imported returns', () => {
    plan()
    expect(processForwardBatch(getForwardStore(), data(), { now, scopeEventIds: [] }).orders).toEqual([])
    const captured = processForwardBatch(getForwardStore(), data(), { now, scopeEventIds: [eventKey(event)] })
    const settled = processForwardBatch(captured, data([quote], [result]), { now: '2026-01-15T15:00:00Z', action: 'settle' })
    expect(mergeForwardStores(settled, settled)).toEqual(settled)
    settled.settlements[0].profit = 10000
    expect(() => assertForwardStore(settled)).toThrow('冻结快照不一致')
  })
  it('quarantines a later conflicting result without rewriting the original settlement or review', () => {
    const p = plan()
    const captured = processForwardBatch(getForwardStore(), data(), { now, action: 'capture' })
    const settled = processForwardBatch(captured, data([quote], [result]), { now: '2026-01-15T14:01:00Z', action: 'review' })
    const corrected = { ...result, homeGoals: 0, awayGoals: 1, availableAt: '2026-01-15T15:00:00Z', source: 'second' }
    const nextEvent = { ...quote, away: '利物浦', kickoff: '2026-01-15T18:00:00Z', observedAt: '2026-01-15T15:01:00Z' }
    const conflicts = data([quote, nextEvent], [result, corrected])
    expect(forwardPlanMetrics(settled, p.id, { now: '2026-01-15T15:02:00Z', evidence: conflicts })).toMatchObject({ disputed: 1, profit: null })
    const updated = processForwardBatch(settled, conflicts, { now: '2026-01-15T15:02:00Z', action: 'all' })
    expect(updated.settlements).toEqual(settled.settlements)
    expect(updated.reviews[0]).toEqual(settled.reviews[0])
    expect(updated.disputes).toHaveLength(1)
    expect(updated.candidates.at(-1).reason).toBe('unresolved_result_conflict')
    expect(forwardPlanMetrics(updated, p.id, { now: '2026-01-16T00:00:00Z' })).toMatchObject({ settled: 0, disputed: 1, roi: null, assessment: 'data_disputed' })
    expect(mergeForwardStores(updated, updated)).toEqual(updated)
  })
  it('groups equivalent settlement instants before calculating drawdown', () => {
    const p = plan({ version: { id: 'all', createdAt: '2026-01-14T00:00:00Z', spec: { ...spec, team: '' } } })
    const second = { ...quote, home: '曼联', away: '利物浦' }
    const captured = processForwardBatch(getForwardStore(), data([quote, second]), { now, action: 'capture' })
    const settled = processForwardBatch(captured, data([quote, second], [result, { ...second, homeGoals: 0, awayGoals: 1, availableAt: '2026-01-15T22:00:00+08:00' }]), { now: '2026-01-15T14:01:00Z', action: 'settle' })
    expect(forwardPlanMetrics(settled, p.id, { now: '2026-01-15T14:01:00Z' })).toMatchObject({ orders: 2, settled: 2, profit: 0, maxDrawdown: 0 })
  })
  it('does not treat a suspended different market as an event-wide suspension', () => {
    plan()
    const next = processForwardBatch(getForwardStore(), data([{ ...quote, market: 'score', selection: '1-0', tradable: false }, quote]), { now, action: 'capture' })
    expect(next.orders).toHaveLength(1)
  })

})
