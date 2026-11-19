import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getClosingQuote,
  getOddsDrift,
  getOddsTrail,
  marketEfficiencyMap,
  marketMatchKey,
  oddsHistoryStatus,
  recordOddsSnapshot,
} from '../oddsHistory'

const stubFullModeWindow = () => {
  const store = new Map()
  vi.stubGlobal('window', {
    location: { pathname: '/' },
    sessionStorage: {
      getItem: (key) => (key === 'eivra.full_session_latch.v1' ? '1' : null),
      setItem: () => {},
      removeItem: () => {},
    },
    localStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
    },
    dispatchEvent: () => true,
  })
  if (typeof globalThis.CustomEvent !== 'function') {
    vi.stubGlobal('CustomEvent', class CustomEvent {
      constructor(type, options) {
        this.type = type
        this.detail = options?.detail
      }
    })
  }
}

beforeEach(() => stubFullModeWindow())
afterEach(() => vi.unstubAllGlobals())

const T0 = Date.UTC(2026, 8, 20, 12, 0, 0)
const iso = (offsetMs) => new Date(T0 + offsetMs).toISOString()
const MINUTE = 60 * 1000

const makeScores = () => [
  { home: 1, away: 0, odds: 7.5 },
  { home: 2, away: 0, odds: 11 },
  { home: 2, away: 1, odds: 9 },
  { home: 0, away: 0, odds: 10 },
  { home: 1, away: 1, odds: 6.5 },
  { home: 2, away: 2, odds: 15 },
  { home: 0, away: 1, odds: 8 },
  { home: 0, away: 2, odds: 12 },
  { home: 1, away: 2, odds: 10 },
  { home: 3, away: 0, odds: 21 },
  { home: 3, away: 1, odds: 19 },
  { home: 0, away: 3, odds: 26 },
]

const makeMatch = (overrides = {}) => ({
  matchId: 'm1',
  home: '切尔西',
  away: '阿森纳',
  league: '英超',
  kickoff: iso(4 * 60 * MINUTE),
  businessDate: '2026-09-20',
  had: { home: 2.0, draw: 3.4, away: 4.0 },
  scores: makeScores(),
  other: { win: 30, draw: 15, away: 40 },
  ...overrides,
})

describe('recordOddsSnapshot / closing quote / drift', () => {
  it('records HAD plus only tracked scorelines, throttles duplicates and resolves close', () => {
    expect(marketMatchKey(makeMatch())).toBe('m1')
    const first = recordOddsSnapshot([makeMatch()], { trackedOutcomes: { m1: ['crs:1-1'] }, now: T0 })
    expect(first.added).toBe(4) // HAD 三项 + crs:1-1；其他比分格不记录
    expect(getOddsTrail('m1', 'crs:1-1')).toHaveLength(1)
    expect(getOddsTrail('m1', 'crs:2-1')).toHaveLength(0)

    const unchanged = recordOddsSnapshot([makeMatch()], { trackedOutcomes: { m1: ['crs:1-1'] }, now: T0 + 5 * MINUTE })
    expect(unchanged.added).toBe(0)

    const changed = recordOddsSnapshot(
      [makeMatch({ had: { home: 1.8, draw: 3.4, away: 4.0 } })],
      { trackedOutcomes: { m1: ['crs:1-1'] }, now: T0 + 31 * MINUTE },
    )
    expect(changed.added).toBe(4) // 变价记一条；其余同价报价也均已超过 30 分钟
    expect(getClosingQuote('m1', 'had:home', iso(20 * MINUTE)).odds).toBe(2.0)
    expect(getClosingQuote('m1', 'had:home', iso(40 * MINUTE)).odds).toBe(1.8)

    const drift = getOddsDrift('m1', 'had:home')
    expect(drift).toMatchObject({ open: 2.0, current: 1.8, direction: 'steam', samples: 2 })
    expect(drift.changePct).toBeCloseTo(-0.1, 12)
    expect(oddsHistoryStatus()).toMatchObject({ matches: 1, quotes: 8 })
  })

  it('prunes old matches and caps each outcome trail at 200 quotes', () => {
    for (let i = 0; i < 205; i += 1) {
      recordOddsSnapshot([makeMatch()], { now: T0 + i * 31 * MINUTE })
    }
    expect(getOddsTrail('m1', 'had:home')).toHaveLength(200)

    recordOddsSnapshot([makeMatch({ matchId: 'ancient', kickoff: '2020-01-01 12:00', businessDate: '2020-01-01' })], { now: T0 })
    expect(oddsHistoryStatus().matches).toBe(1)
  })

  it('caps the store at 500 matches', () => {
    const matches = Array.from({ length: 505 }, (_, index) => makeMatch({ matchId: `bulk${index}` }))
    recordOddsSnapshot(matches, { now: T0 })
    expect(oddsHistoryStatus().matches).toBe(500)
  })
})

describe('marketEfficiencyMap', () => {
  it('aggregates HAD and CRS overround per league and sorts by CRS', () => {
    const rows = marketEfficiencyMap([
      makeMatch(),
      makeMatch({ matchId: 'm2', league: '西甲', scores: [], other: null }),
    ])
    expect(rows).toHaveLength(2)
    expect(rows[0].league).toBe('英超')
    expect(rows[0]).toMatchObject({ matches: 1, crsSamples: 1 })
    expect(rows[0].avgCrsOverround).toBeGreaterThan(0)
    expect(rows[1]).toMatchObject({ league: '西甲', crsSamples: 0 })
    expect(Number.isFinite(rows[1].avgCrsOverround)).toBe(false)
    expect(Number.isFinite(rows[1].avgHadOverround)).toBe(true)
  })
})
