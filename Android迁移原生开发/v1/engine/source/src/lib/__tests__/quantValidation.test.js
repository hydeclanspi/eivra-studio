import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildParameterCandidates, evaluateParameterValidation, evaluatePriceReplay,
  getValidationStore, rerunValidation, runParameterValidation, runPriceReplay,
  summarizeValidationSettlements, VALIDATION_STORAGE_KEY,
} from '../quantValidation'
import { eventKey, normalizeEvidence } from '../quantEvidence'
import { resetPreviewStore } from '../previewStore'

const mode = vi.hoisted(() => ({ preview: false }))
vi.mock('../displayMode', () => ({ isPreviewMode: () => mode.preview }))
const spec = { name: '平局研究', team: '', market: 'result', outcome: 'draw', venue: 'any', stakePerMatch: 10, manualOdds: 3, probMode: 'custom', customProb: 0.3 }
const AS_OF = '2026-10-20T00:00:00.000Z'
const event = (overrides = {}) => ({ home: '切尔西', away: '阿森纳', kickoff: '2026-01-10T12:00:00.000Z', source: 'test-source', ...overrides })
const quote = (base, selection, overrides = {}) => ({ ...base, market: 'result', selection, odds: selection === 'home' ? 2.5 : 2, observedAt: '2026-01-10T10:59:00.000Z', tradable: true, ...overrides })
const outcome = (base, overrides = {}) => ({ ...base, homeGoals: 1, awayGoals: 1, availableAt: '2026-01-10T15:00:00.000Z', ...overrides })
const evidence = ({ events = [], quotes, results } = {}) => {
  const base = event()
  return normalizeEvidence({ schemaVersion: 1, events, quotes: quotes || [quote(base, 'draw'), quote(base, 'home')], results: results || [outcome(base)] }, { now: AS_OF })
}
const replay = (overrides = {}) => evaluatePriceReplay({ spec, evidence: evidence(), asOf: AS_OF, decisionLeadMinutes: 60, maxQuoteAgeMinutes: 60, ...overrides })
const history = () => Array.from({ length: 13 }, (_, index) => ({
  date: `2026-01-${String(index + 1).padStart(2, '0')}`, home: '切尔西', away: '阿森纳',
  homeGoals: 1, awayGoals: index < 4 || index >= 10 ? 0 : 1,
}))
const batchInput = (overrides = {}) => ({ spec, resultsIndex: history(), startDate: '2026-01-01', endDate: '2026-01-13', trainDays: 7, testDays: 3, minTrainingSamples: 2, outcomeOptions: ['win', 'draw'], ...overrides })
let values; let localStorage; let dispatchEvent
beforeEach(() => {
  values = new Map()
  localStorage = {
    getItem: vi.fn((key) => values.has(key) ? values.get(key) : null),
    setItem: vi.fn((key, value) => values.set(key, value)), removeItem: vi.fn((key) => values.delete(key)),
  }
  dispatchEvent = vi.fn()
  vi.stubGlobal('window', { localStorage, dispatchEvent })
  vi.stubGlobal('CustomEvent', class CustomEvent { constructor(type, options) { this.type = type; this.detail = options.detail } })
  mode.preview = false; resetPreviewStore()
})
afterEach(() => { resetPreviewStore(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('predeclared parameter search and rolling evidence', () => {
  it('enumerates only declared rule axes, rejects more than 30 and ignores operational metadata', () => {
    const candidates = buildParameterCandidates({ spec: { ...spec, id: 'old', positions: [{ stake: 99 }] }, venueOptions: ['home', 'away'], outcomeOptions: ['win', 'draw'], assumedOddsOptions: [2, 3] })
    expect(candidates).toHaveLength(8)
    expect(candidates.map((row) => row.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(candidates[0].spec).not.toHaveProperty('positions')
    expect(candidates[0].spec).not.toHaveProperty('id')
    expect(() => buildParameterCandidates({ spec, venueOptions: ['any', 'home', 'away'], outcomeOptions: ['win', 'draw', 'lose'], assumedOddsOptions: [2, 3, 4, 5] })).toThrow('最多 30')
    expect(() => buildParameterCandidates({ spec, assumedOddsOptions: ['not-odds'] })).toThrow('假定赔率')
  })

  it('selects using training outcomes only and freezes rules before each nonoverlapping later window', () => {
    const run = evaluateParameterValidation(batchInput())
    expect(run.folds).toHaveLength(2)
    expect(run.folds[0].selectedSpec.outcome).toBe('win')
    expect(run.folds[0].summary).toMatchObject({ n: 3, hits: 0, roi: -1 })
    expect(run.folds[1].selectedSpec.outcome).toBe('draw')
    expect(run.folds[1].summary).toMatchObject({ n: 3, hits: 0, roi: -1 })
    expect(run.folds[0].testingRange.endExclusive).toBe(run.folds[1].testingRange.start)
    expect(new Set(run.accepted.map((row) => row.eventId)).size).toBe(run.accepted.length)
    expect(run.folds[0].trainingEventIds).toHaveLength(7)
    expect(run.candidates).toHaveLength(2)
    const altered = history().map((row, index) => index >= 7 ? { ...row, homeGoals: 5, awayGoals: 0 } : row)
    const rerun = evaluateParameterValidation(batchInput({ resultsIndex: altered }))
    expect(rerun.folds[0].selectedCandidateId).toBe(run.folds[0].selectedCandidateId)
    expect(rerun.folds[0].trainingResults).toEqual(run.folds[0].trainingResults)
  })


  it('retains every candidate sensitivity in declared order on a common event set', () => {
    const run = evaluateParameterValidation(batchInput({ outcomeOptions: ['draw'], assumedOddsOptions: [2, 3] }))
    expect(run.sensitivity.rows.map((row) => row.order)).toEqual([1, 2])
    expect(run.sensitivity.rows.map((row) => row.commonSummary.n)).toEqual([6, 6])
    expect(run.sensitivity.rows[1].commonSummary.roi).toBeGreaterThan(run.sensitivity.rows[0].commonSummary.roi)
    expect(run.folds.every((fold) => fold.selectedSpec.manualOdds === 2)).toBe(true)
  })
  it('does not select an inflated assumed price and applies the declared tie order', () => {
    const run = evaluateParameterValidation(batchInput({ outcomeOptions: ['draw'], assumedOddsOptions: [2, 100] }))
    expect(run.folds[0].selectedSpec.manualOdds).toBe(2)
    expect(run.folds[0].trainingResults[0].summary.hitRate).toBe(run.folds[0].trainingResults[1].summary.hitRate)
    expect(run.protocol.selectionMetric).toBe('training_hit_rate')
    expect(run.limitations.join(' ')).toContain('不表示价值最优')
  })

  it('keeps missing dates, malformed scores and conflicting duplicate events out of train and later samples', () => {
    const rows = history()
    const run = evaluateParameterValidation(batchInput({ resultsIndex: [
      ...rows, { ...rows[0], date: null }, { ...rows[1], date: '2026-02-30' },
      { ...rows[2], homeGoals: '' }, { ...rows[7] }, { ...rows[8], awayGoals: 3 },
    ] }))
    expect(run.excluded.some((row) => row.reason === 'invalid_date')).toBe(true)
    expect(run.excluded.some((row) => row.reason === 'invalid_score')).toBe(true)
    expect(run.excluded.filter((row) => row.reason === 'conflicting_result')).toHaveLength(2)
    expect(run.excluded.some((row) => row.reason === 'duplicate_result')).toBe(true)
    expect(run.accepted.some((row) => row.date === '2026-01-09')).toBe(false)
  })

  it('returns unavailable returns when no candidate meets the frozen training threshold', () => {
    const run = evaluateParameterValidation(batchInput({ minTrainingSamples: 100 }))
    expect(run.folds.every((fold) => fold.selectedSpec === null)).toBe(true)
    expect(run.summary).toMatchObject({ n: 0, roi: null, totalProfit: null, maxDrawdown: null })
    expect(run.excluded.some((row) => row.reason === 'insufficient_training')).toBe(true)
  })
})

describe('strict temporal price replay', () => {
  it('uses actual selection quotes and a same-event baseline intersection', () => {
    const run = replay()
    expect(run.summary).toMatchObject({ n: 1, hits: 1, totalProfit: 10, roi: 1 })
    expect(run.baseline.summary).toMatchObject({ n: 1, hits: 0, totalProfit: -10 })
    expect(run.accepted[0].decisionAt).toBe('2026-01-10T11:00:00.000Z')
    expect(run.accepted[0].quoteId).toBeTruthy()
    expect(run.forecastCoverage.available).toBe(1)
    expect(run.forecastCoverage.brier).toBeCloseTo(0.49)
  })

  it('excludes a quote observed exactly at the decision, after the decision or without an explicit timezone', () => {
    const base = event()
    for (const observedAt of ['2026-01-10T11:00:00.000Z', '2026-01-10T11:30:00.000Z', '2026-01-10 10:59:00']) {
      const input = { events: [], quotes: [quote(base, 'draw', { observedAt }), quote(base, 'home')], results: [outcome(base)] }
      const run = replay({ evidence: input })
      expect(run.summary.n).toBe(0)
      expect(run.summary.roi).toBeNull()
      expect(run.excluded.some((row) => ['missing_asof_quote', 'invalid_observation_time'].includes(row.reason))).toBe(true)
    }
  })

  it('never falls back to an old price after a later suspension or same-source conflict', () => {
    const base = event()
    const earlier = quote(base, 'draw', { observedAt: '2026-01-10T10:30:00.000Z' })
    const suspended = replay({ evidence: evidence({ quotes: [earlier, quote(base, 'draw', { tradable: false }), quote(base, 'home')] }) })
    expect(suspended.summary.n).toBe(0)
    expect(suspended.excluded.some((row) => row.reason === 'market_closed')).toBe(true)
    const conflicting = replay({ evidence: evidence({ quotes: [earlier, quote(base, 'draw'), quote(base, 'draw', { odds: 7 }), quote(base, 'home')] }) })
    expect(conflicting.summary.n).toBe(0)
    expect(conflicting.excluded.some((row) => row.reason === 'conflicting_quote')).toBe(true)
  })

  it('checks staleness using observedAt and only validates sourceUpdatedAt chronology', () => {
    const base = event()
    const current = replay({ evidence: evidence({ quotes: [quote(base, 'draw', { sourceUpdatedAt: '2025-12-01T00:00:00.000Z' }), quote(base, 'home')] }) })
    expect(current.summary.n).toBe(1)
    const stale = replay({ evidence: evidence({ quotes: [quote(base, 'draw', { observedAt: '2026-01-10T09:00:00.000Z' }), quote(base, 'home')] }) })
    expect(stale.summary.n).toBe(0)
    expect(stale.excluded.some((row) => row.reason === 'stale_quote')).toBe(true)
  })

  it('cannot use a rule quote without matching baseline quote coverage', () => {
    const run = replay({ evidence: evidence({ quotes: [quote(event(), 'draw')] }) })
    expect(run.summary.n).toBe(0)
    expect(run.baseline.summary.n).toBe(0)
    expect(run.excluded.some((row) => row.reason === 'baseline_missing_asof_quote')).toBe(true)
  })


  it('requires baseline coverage from the same quote source', () => {
    const run = replay({ evidence: evidence({ quotes: [quote(event(), 'draw'), quote(event(), 'home', { source: 'other' })] }) })
    expect(run.summary.n).toBe(0)
    expect(run.excluded.some((row) => row.reason === 'baseline_missing_asof_quote')).toBe(true)
  })
  it('requires result availability after kickoff and no later than the declared as-of time', () => {
    const base = event()
    for (const availableAt of ['2026-01-10T11:59:00.000Z', '2027-01-10T15:00:00.000Z', '2026-01-10 15:00:00']) {
      const run = replay({ evidence: { quotes: [quote(base, 'draw'), quote(base, 'home')], results: [outcome(base, { availableAt })] } })
      expect(run.summary.n).toBe(0)
      expect(run.excluded.some((row) => row.reason === 'invalid_result_availability')).toBe(true)
    }
  })

  it('groups simultaneous settlements and uses availability order rather than kickoff or row order', () => {
    const first = event()
    const second = event({ home: '曼联', away: '利物浦', kickoff: '2026-01-10T12:30:00.000Z' })
    const run = replay({ evidence: evidence({
      quotes: [quote(first, 'draw'), quote(first, 'home'), quote(second, 'draw'), quote(second, 'home')],
      results: [outcome(first), outcome(second, { homeGoals: 1, awayGoals: 0 })],
    }) })
    expect(run.summary).toMatchObject({ n: 2, totalProfit: 0, maxDrawdown: 0 })
    expect(run.summary.equityCurve).toHaveLength(1)
    expect(summarizeValidationSettlements([{ eventId: 'a', availableAt: '2026-01-10T15:00:00Z', stake: 10, profit: -10 }, { eventId: 'b', availableAt: '2026-01-10T23:00:00+08:00', stake: 10, profit: 10 }]).maxDrawdown).toBe(0)
    const separated = summarizeValidationSettlements([
      { eventId: 'late-kickoff', availableAt: '2026-01-10T15:00:00Z', stake: 10, profit: -10, hit: false },
      { eventId: 'early-kickoff', availableAt: '2026-01-10T16:00:00Z', stake: 10, profit: 20, hit: true },
    ])
    expect(separated.maxDrawdown).toBe(10)
    expect(separated.equityCurve[0].eventIds).toEqual(['late-kickoff'])
  })

  it('exposes future or unpriced events from metadata as exclusions and keeps probability diagnostics unavailable', () => {
    const base = event()
    const unmatched = event({ home: '曼城', away: '热刺' })
    const data = evidence({ events: [{ ...unmatched, observedAt: '2026-01-10T10:00:00.000Z' }], results: [outcome(base), outcome(unmatched)] })
    const run = replay({ spec: { ...spec, probMode: 'market' }, evidence: data })
    expect(run.summary.n).toBe(1)
    expect(run.excluded.some((row) => row.eventId === eventKey(unmatched) && row.reason === 'missing_asof_quote')).toBe(true)
    expect(run.forecastCoverage).toMatchObject({ available: 0, total: 1, brier: null, logLoss: null })
    expect(run.accepted[0].forecast.probability).toBeNull()
  })
})

describe('immutable records, dataset exposure and preview isolation', () => {
  it('records repeats of the same dataset, freezes snapshots and reproduces with the original cutoff', () => {
    const input = { spec, evidence: evidence(), asOf: AS_OF }
    const first = runPriceReplay(input)
    const second = runPriceReplay({ ...input, decisionLeadMinutes: 45 })
    const repeated = rerunValidation(first.run.id)
    expect(first.run.exposureCount).toBe(1)
    expect(second.run.exposureCount).toBe(2)
    expect(repeated.run.exposureCount).toBe(3)
    expect(repeated.run.protocol.asOf).toBe(AS_OF)
    expect(repeated.run.summary).toEqual(first.run.summary)
    expect(repeated.run.accepted).toEqual(first.run.accepted)
    expect(repeated.run.reproductionOf).toBe(first.run.id)
    expect(getValidationStore().runs[0]).toEqual(first.run)
    input.evidence.quotes[0].odds = 999
    expect(getValidationStore().runs[0].inputSnapshot.evidence.quotes[0].odds).not.toBe(999)
    expect(dispatchEvent.mock.calls.at(-1)[0].detail.key).toBe(VALIDATION_STORAGE_KEY)
  })

  it('commits the exposure and experiment together and propagates write errors without losing old records', () => {
    const first = runParameterValidation(batchInput())
    const before = values.get(VALIDATION_STORAGE_KEY)
    localStorage.setItem.mockImplementation(() => { throw new Error('QuotaExceededError') })
    expect(() => runParameterValidation(batchInput())).toThrow('QuotaExceededError')
    expect(values.get(VALIDATION_STORAGE_KEY)).toBe(before)
    expect(getValidationStore().runs).toEqual([first.run])
    expect(getValidationStore().exposures[0].count).toBe(1)
  })

  it('preserves corrupt storage and keeps preview reads and writes apart from owner records', () => {
    values.set(VALIDATION_STORAGE_KEY, '{broken')
    expect(() => getValidationStore()).toThrow('没有覆盖原数据')
    expect(() => runParameterValidation(batchInput())).toThrow()
    expect(values.get(VALIDATION_STORAGE_KEY)).toBe('{broken')
    values.delete(VALIDATION_STORAGE_KEY)
    const full = runParameterValidation(batchInput())
    const ownerBytes = values.get(VALIDATION_STORAGE_KEY)
    localStorage.getItem.mockClear(); localStorage.setItem.mockClear()
    mode.preview = true
    expect(getValidationStore().runs).toEqual([])
    const preview = runParameterValidation(batchInput())
    expect(preview.run.exposureCount).toBe(1)
    expect(localStorage.getItem).not.toHaveBeenCalled()
    expect(localStorage.setItem).not.toHaveBeenCalled()
    expect(values.get(VALIDATION_STORAGE_KEY)).toBe(ownerBytes)
    resetPreviewStore()
    expect(getValidationStore().runs).toEqual([])
    mode.preview = false
    expect(getValidationStore().runs).toEqual([full.run])
  })
})
