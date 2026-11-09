import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  compareResearchRuns, createResearchExperiment, getResearchDataCoverage, getResearchStore,
  RESEARCH_RANDOM_SEED, RESEARCH_STORAGE_KEY, rerunResearchExperiment, saveResearchConclusion,
} from '../quantResearch'
import { resetPreviewStore } from '../previewStore'
import { buildTeamRatings } from '../teamRatings'
import { teamKeyForName } from '../matchResults'

const mode = vi.hoisted(() => ({ preview: false }))
vi.mock('../displayMode', () => ({ isPreviewMode: () => mode.preview }))

let values
let localStorage
let dispatchEvent
const rows = [
  { id: 'a', date: '2026-01-01', home: '切尔西', away: '阿森纳', homeGoals: 1, awayGoals: 1 },
  { id: 'b', date: '2026-02-01', home: '阿森纳', away: '切尔西', homeGoals: 2, awayGoals: 0 },
  { id: 'c', date: '2026-03-01', home: '切尔西', away: '曼联', homeGoals: 0, awayGoals: 0 },
  { id: 'd', date: '2026-04-01', home: '利物浦', away: '曼联', homeGoals: 1, awayGoals: 1 },
]
const spec = {
  name: '切尔西平局研究', team: '切尔西', market: 'result', outcome: 'draw',
  stakePerMatch: 10, manualOdds: 4, oddsMode: 'manual', probMode: 'custom', customProb: 0.3,
}
const create = (input = {}) => createResearchExperiment({ kind: 'frequency', spec, resultsIndex: { matches: rows }, ...input })

beforeEach(() => {
  values = new Map()
  localStorage = {
    getItem: vi.fn((key) => values.has(key) ? values.get(key) : null),
    setItem: vi.fn((key, value) => values.set(key, value)),
    removeItem: vi.fn((key) => values.delete(key)),
  }
  dispatchEvent = vi.fn()
  vi.stubGlobal('window', { localStorage, dispatchEvent })
  vi.stubGlobal('CustomEvent', class CustomEvent {
    constructor(type, options) { this.type = type; this.detail = options.detail }
  })
  mode.preview = false
  resetPreviewStore()
})

afterEach(() => {
  resetPreviewStore()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('frozen research records', () => {
  it('saves a whitelisted version and detached input snapshots in one persistent write', () => {
    const source = structuredClone(rows)
    const { project, version, run } = create({
      spec: { ...spec, id: 'operational_id', status: 'live', positions: [{ stake: 999 }], unknownSecret: 'omit' },
      resultsIndex: source,
      brief: { hypothesis: '平局频率可能偏高', falsifier: '后段频率明显回落' },
    })
    expect(localStorage.setItem).toHaveBeenCalledTimes(1)
    expect(version.number).toBe(1)
    expect(version.spec).not.toHaveProperty('id')
    expect(version.spec).not.toHaveProperty('positions')
    expect(version.spec).not.toHaveProperty('status')
    expect(version.spec).not.toHaveProperty('unknownSecret')
    expect(project.id).not.toBe(version.id)
    expect(run.versionId).toBe(version.id)
    source[0].homeGoals = 9
    version.spec.team = '改动返回值'
    run.inputSnapshot.results[0].homeGoals = 8
    const restored = getResearchStore()
    expect(restored.versions[0].spec.team).toBe('切尔西')
    expect(restored.runs[0].inputSnapshot.results[0].homeGoals).toBe(1)
    expect(JSON.parse(values.get(RESEARCH_STORAGE_KEY))).toEqual(restored)
    expect(dispatchEvent.mock.calls[0][0].detail).toEqual({ key: RESEARCH_STORAGE_KEY, preview: false })
  })

  it('adds new immutable versions and reruns the original version without changing earlier records', () => {
    const first = create()
    const second = create({ projectId: first.project.id, spec: { ...spec, venue: 'home' } })
    const repeated = rerunResearchExperiment(first.run.id)
    const store = getResearchStore()
    expect(store.projects).toHaveLength(1)
    expect(store.versions.map((version) => version.number)).toEqual([1, 2])
    expect(store.versions[0]).toEqual(first.version)
    expect(second.run.versionId).not.toBe(first.run.versionId)
    expect(repeated.run.id).not.toBe(first.run.id)
    expect(repeated.run.versionId).toBe(first.version.id)
    expect(repeated.run.reproductionOf).toBe(first.run.id)
    expect(repeated.run.result).toEqual(first.run.result)
    expect(repeated.run.inputSnapshot).toEqual(first.run.inputSnapshot)
    expect(repeated.run.dataFingerprint).toBe(first.run.dataFingerprint)
    expect(store.runs).toHaveLength(3)
  })

  it('changes only the conclusion when recording a research decision', () => {
    const original = create()
    const saved = saveResearchConclusion(original.run.id, '  继续采集赛前报价  ')
    expect(saved.conclusion).toBe('继续采集赛前报价')
    expect(saved.result).toEqual(original.run.result)
    expect(saved.inputSnapshot).toEqual(original.run.inputSnapshot)
    expect(getResearchStore().versions).toEqual([original.version])
    expect(getResearchStore().runs[0]).toEqual(saved)
  })
})

describe('historical eligibility and evidence boundaries', () => {
  it('deduplicates strict team identities and exposes every exclusion instead of counting bad rows', () => {
    const invalid = [
      ...rows,
      { ...rows[0], id: 'duplicate', home: 'Chelsea FC', away: 'Arsenal FC' },
      { ...rows[0], id: 'no-date', date: null },
      { ...rows[0], id: 'bad-date', date: '2026-02-30' },
      { ...rows[0], id: 'bad-score', date: '2026-05-01', homeGoals: null },
      { ...rows[0], id: 'empty-score', date: '2026-05-02', awayGoals: '' },
      { ...rows[0], id: 'missing-team', date: '2026-05-03', away: '' },
    ]
    const { run } = create({ resultsIndex: invalid })
    expect(run.result.counts).toEqual({ source: 10, valid: 4, selected: 3, excluded: 7 })
    expect(run.result.summary).toMatchObject({ n: 3, hits: 2, hitRate: 2 / 3 })
    expect(run.result.excluded.filter((row) => row.reason === 'duplicate')).toHaveLength(1)
    expect(run.result.excluded.filter((row) => row.reason === 'missing_or_invalid_date')).toHaveLength(2)
    expect(run.result.summary).not.toHaveProperty('roi')
    expect(run.result.summary).not.toHaveProperty('totalProfit')
    expect(run.result.summary).not.toHaveProperty('assumedOdds')
    expect(run.result.included).toHaveLength(3)
    expect(run.result.baseline.summary.n).toBe(4)
  })

  it('excludes all conflicting results for one event and reports coverage gaps', () => {
    const input = [...rows, { ...rows[0], id: 'conflict', homeGoals: 3 }]
    const coverage = getResearchDataCoverage(input, [{ matchId: 'q1' }])
    expect(coverage).toMatchObject({
      source: 5, valid: 3, excluded: 2, reasons: { conflicting_result: 2 }, marketCount: 1,
      capabilities: { historicalPriceReplay: false },
    })
    const { run } = create({ resultsIndex: input })
    expect(run.result.summary.n).toBe(2)
    expect(run.result.included.some((row) => row.date === '2026-01-01')).toBe(false)
  })

  it('filters inclusive dates and applies one declared chronological split with empty segments unavailable', () => {
    const { run } = create({ protocol: { startDate: '2026-02-01', endDate: '2026-03-01', holdoutStart: '2026-03-01' } })
    expect(run.result.summary).toMatchObject({ n: 2, hits: 1, hitRate: 0.5 })
    expect(run.result.split.training).toMatchObject({ n: 1, hits: 0 })
    expect(run.result.split.holdout).toMatchObject({ n: 1, hits: 1 })
    expect(run.result.split.note).toContain('不能据此声明独立验证')
    const empty = create({ protocol: { startDate: '2025-01-01', endDate: '2025-12-31' } }).run
    expect(empty.result.summary).toMatchObject({ n: 0, hitRate: null, hitCI: null })
    expect(() => create({ protocol: { startDate: '2026-04-01', endDate: '2026-01-01' } })).toThrow('开始日期')
    expect(() => create({ protocol: { startDate: '2026-02-30' } })).toThrow('日期无效')
  })

  it('uses the selected team perspective and does not match names by substring', () => {
    const madridRows = [
      { date: '2026-01-01', home: 'Rayo Vallecano de Madrid', away: 'Barcelona', homeGoals: 2, awayGoals: 1 },
      { date: '2026-01-02', home: 'Barcelona', away: 'Real Madrid', homeGoals: 1, awayGoals: 2 },
    ]
    const { run } = create({
      resultsIndex: madridRows,
      spec: { ...spec, team: 'Real Madrid', market: 'score', score: { for: 2, against: 1 }, venue: 'away' },
    })
    expect(run.result.summary).toMatchObject({ n: 1, hits: 1 })
    expect(run.result.included[0].venue).toBe('away')
  })

  it('labels a fixed-odds scenario and calculates its stated stake economics', () => {
    const { run } = create({ kind: 'scenario' })
    expect(run.result.label).toBe('统一假定赔率情景推演')
    expect(run.result.summary).toMatchObject({
      n: 3, hits: 2, assumedOdds: 4, totalStaked: 30, totalProfit: 50, maxDrawdown: 10,
    })
    expect(run.result.summary.roi).toBeCloseTo(50 / 30)
    expect(run.result.disclaimer).toContain('不能还原历史可执行收益')
    expect(run.result.baseline.summary).not.toHaveProperty('roi')
  })
})

describe('simulation reproducibility and comparisons', () => {
  it('preserves market, rating and Kelly context so simulation reruns are identical', () => {
    const ratings = buildTeamRatings({ matches: rows.map((row) => ({
      ...row, teamKeyHome: teamKeyForName(row.home), teamKeyAway: teamKeyForName(row.away),
    })) })
    const marketMatches = [{
      matchId: 'future1', home: '切尔西', away: '阿森纳', kickoff: '2026-10-22 20:00',
      had: { home: 2.1, draw: 3.5, away: 3.2 },
    }]
    const { run } = create({
      kind: 'simulation', spec: { ...spec, probMode: 'ratings', matchesPlanned: 1 },
      marketMatches, ratings, kellyDivisor: 8,
    })
    expect(run.inputSnapshot.ratings).toEqual(ratings)
    expect(run.inputSnapshot.marketMatches).toEqual(marketMatches)
    expect(run.result.analysis.kelly.divisor).toBe(8)
    expect(run.randomSeed).toBe(RESEARCH_RANDOM_SEED)
    expect(run.result.analysis.monteCarlo.seed).toBe(RESEARCH_RANDOM_SEED)
    expect(rerunResearchExperiment(run.id).run.result).toEqual(run.result)
    ratings.teams = {}
    marketMatches[0].had.draw = 99
    expect(getResearchStore().runs[0].inputSnapshot.marketMatches[0].had.draw).toBe(3.5)
  })

  it('allows changed rules on the same snapshot, but blocks deltas across datasets, kinds, protocols and engines', () => {
    const first = create({ kind: 'scenario' }).run
    const changed = create({ kind: 'scenario', spec: { ...spec, venue: 'home' } }).run
    const fair = compareResearchRuns(first, changed)
    expect(fair.comparable).toBe(true)
    expect(fair.changedFields).toEqual([{ field: 'venue', before: 'any', after: 'home' }])
    expect(fair.deltas.totalProfit).toBe(10)
    expect(first.dataFingerprint).toBe(changed.dataFingerprint)
    const alternatives = [
      create({ kind: 'scenario', resultsIndex: rows.slice(1) }).run,
      create().run,
      create({ kind: 'scenario', protocol: { startDate: '2026-02-01' } }).run,
      create({ kind: 'scenario', spec: { ...spec, stakePerMatch: 100 } }).run,
      create({ kind: 'scenario', spec: { ...spec, manualOdds: 8 } }).run,
      { ...changed, engineVersion: 'future' },
      { ...changed, randomSeed: 999 },
    ]
    for (const alternative of alternatives) {
      const comparison = compareResearchRuns(first, alternative)
      expect(comparison.comparable).toBe(false)
      expect(comparison.reasons.length).toBeGreaterThan(0)
      expect(comparison.deltas).toEqual({})
    }
  })

  it('does not silently replay records using a different engine or seed', () => {
    const { run } = create()
    const stored = getResearchStore()
    stored.runs[0].engineVersion = 'older-engine'
    values.set(RESEARCH_STORAGE_KEY, JSON.stringify(stored))
    expect(() => rerunResearchExperiment(run.id)).toThrow('不同的计算引擎')
    expect(getResearchStore().runs).toHaveLength(1)
  })

  it('does not save a rating-based simulation when the chosen model is unavailable', () => {
    expect(() => create({
      kind: 'simulation',
      spec: { ...spec, probMode: 'ratings', matchesPlanned: 1 },
      marketMatches: [{ matchId: 'future', home: '切尔西', away: '阿森纳', had: { home: 2, draw: 3, away: 4 } }],
      ratings: null,
    })).toThrow('评级概率不可用')
    expect(getResearchStore().runs).toHaveLength(0)
    expect(localStorage.setItem).not.toHaveBeenCalled()
  })
})

describe('storage integrity and preview isolation', () => {
  it('fails atomically when persistent storage fails, with no success event or partial project', () => {
    const first = create()
    dispatchEvent.mockClear()
    localStorage.setItem.mockImplementation(() => { throw new Error('QuotaExceededError') })
    expect(() => create({ projectId: first.project.id })).toThrow('QuotaExceededError')
    expect(getResearchStore().runs).toEqual([first.run])
    expect(getResearchStore().versions).toEqual([first.version])
    expect(dispatchEvent).not.toHaveBeenCalled()
  })

  it('keeps malformed and unsupported stored data intact', () => {
    for (const raw of ['{broken', '{"schemaVersion":9,"projects":[],"versions":[],"runs":[]}']) {
      values.set(RESEARCH_STORAGE_KEY, raw)
      expect(() => getResearchStore()).toThrow('原有数据已保留')
      expect(() => create()).toThrow()
      expect(values.get(RESEARCH_STORAGE_KEY)).toBe(raw)
    }
    expect(localStorage.setItem).not.toHaveBeenCalled()
  })

  it('persists preview writes only in memory and never reads owner research data there', () => {
    const owner = create()
    const ownerBytes = values.get(RESEARCH_STORAGE_KEY)
    localStorage.getItem.mockClear()
    localStorage.setItem.mockClear()
    mode.preview = true
    expect(getResearchStore().runs).toEqual([])
    const preview = create({ spec: { ...spec, name: '演示研究' } })
    expect(preview.project.id).not.toBe(owner.project.id)
    expect(getResearchStore().runs).toHaveLength(1)
    expect(localStorage.getItem).not.toHaveBeenCalled()
    expect(localStorage.setItem).not.toHaveBeenCalled()
    expect(values.get(RESEARCH_STORAGE_KEY)).toBe(ownerBytes)
    expect(dispatchEvent.mock.calls.at(-1)[0].detail.preview).toBe(true)
    resetPreviewStore()
    expect(getResearchStore().runs).toEqual([])
    mode.preview = false
    expect(getResearchStore().runs).toEqual([owner.run])
  })
})
