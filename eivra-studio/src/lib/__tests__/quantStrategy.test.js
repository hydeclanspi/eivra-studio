import { describe, expect, it } from 'vitest'
import {
  aliasesForTeam,
  analyzeStrategy,
  autoRetireStrategy,
  autoVoidStalePositions,
  backtestStrategy,
  baseProbability,
  binomialPmf,
  buildInvestmentFromPosition,
  buildLegs,
  createEmptySpec,
  discoverStrategies,
  exportStrategiesCsv,
  kellyStakeForPool,
  matchVenueForTeam,
  normalizeSpec,
  refreshClosingOdds,
  settleStrategyPositions,
  simulateStrategyPortfolio,
  specFromDiscoveryRow,
  markPositionExecuted,
  strategyPortfolio,
  strategyPositionsCsv,
  strategyQualityScore,
  strategyStats,
  syncStrategyFixtures,
  validateExecution,
  voidStrategyPosition,
  walkForwardStrategy,
  wilsonInterval,
} from '../quantStrategy'
import { DEFAULT_LAMBDA_PRIOR } from '../readQuality'
import { buildTeamRatings, probabilityFromRatings } from '../teamRatings'

// 12 个比分格 + 胜/平/负「其他」打包项，满足 marketScorelineProbabilities 的最低样本数
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

const makeMarketMatch = (overrides = {}) => ({
  matchId: 'm1',
  home: '切尔西',
  away: '阿森纳',
  league: '英超',
  kickoff: '2026-10-04 20:00',
  had: { home: 2.1, draw: 3.4, away: 3.2 },
  scores: makeScores(),
  other: { win: 30, draw: 15, away: 40 },
  ...overrides,
})

const chelseaDrawSpec = (overrides = {}) => ({
  team: '切尔西',
  market: 'score',
  score: { for: 1, against: 1 },
  matchesPlanned: 6,
  stakePerMatch: 20,
  oddsMode: 'market',
  probMode: 'market',
  ...overrides,
})

describe('binomialPmf', () => {
  it('sums to 1 and its mean equals np', () => {
    const n = 10
    const p = 0.3
    let sum = 0
    let mean = 0
    for (let k = 0; k <= n; k += 1) {
      const prob = binomialPmf(k, n, p)
      sum += prob
      mean += k * prob
    }
    expect(sum).toBeCloseTo(1, 10)
    expect(mean).toBeCloseTo(n * p, 10)
  })

  it('handles degenerate probabilities', () => {
    expect(binomialPmf(0, 6, 0)).toBe(1)
    expect(binomialPmf(6, 6, 1)).toBe(1)
    expect(binomialPmf(7, 6, 0.5)).toBe(0)
  })
})

describe('baseProbability', () => {
  it('prices 1-1 from the league prior within a sane band', () => {
    const p = baseProbability(chelseaDrawSpec())
    const expected = (() => {
      // venue 对称：1-1 主客同格
      const pmf = (k, lambda) => Math.exp(-lambda) * lambda ** k
      return pmf(1, DEFAULT_LAMBDA_PRIOR.home) * pmf(1, DEFAULT_LAMBDA_PRIOR.away)
    })()
    expect(p).toBeCloseTo(expected, 10)
    expect(p).toBeGreaterThanOrEqual(0.08)
    expect(p).toBeLessThanOrEqual(0.16)
  })
})

describe('buildLegs with a fabricated market fixture', () => {
  it('resolves venue, market probability and odds for a home team', () => {
    const { legs, degraded } = buildLegs(chelseaDrawSpec({ matchesPlanned: 1 }), [makeMarketMatch()])
    expect(degraded).toBe(false)
    expect(legs).toHaveLength(1)
    const leg = legs[0]
    expect(leg.venue).toBe('home')
    expect(leg.opponent).toBe('阿森纳')
    expect(leg.odds).toBe(6.5)
    expect(leg.estimated).toBe(false)
    expect(Number.isFinite(leg.p)).toBe(true)
    expect(leg.p).toBeGreaterThan(0)
    expect(leg.p).toBeLessThan(1)
    expect(Number.isFinite(leg.pDevig)).toBe(true)
    expect(Number.isFinite(leg.pPoisson)).toBe(true)
  })

  it('maps the score cell from the away side (for/against swapped)', () => {
    const spec = chelseaDrawSpec({ team: '阿森纳', score: { for: 2, against: 1 }, matchesPlanned: 1 })
    const { legs } = buildLegs(spec, [makeMarketMatch()])
    expect(legs[0].venue).toBe('away')
    // 客队进 2 丢 1 → 比分格 (主 1, 客 2) → 赔率 10
    expect(legs[0].odds).toBe(10)
  })

  it('fills missing legs with estimated flags using real-leg means', () => {
    const { legs } = buildLegs(chelseaDrawSpec({ matchesPlanned: 6 }), [makeMarketMatch()])
    expect(legs).toHaveLength(6)
    expect(legs[0].estimated).toBe(false)
    legs.slice(1).forEach((leg) => {
      expect(leg.estimated).toBe(true)
      expect(leg.p).toBeCloseTo(legs[0].p, 12)
      expect(leg.odds).toBeCloseTo(legs[0].odds, 12)
      expect(leg.label).toContain('估计')
    })
  })

  it('degrades to manual defaults with a warning when no fixture matches', () => {
    const { legs, degraded, warning } = buildLegs(chelseaDrawSpec(), [])
    expect(degraded).toBe(true)
    expect(warning).toContain('降级')
    expect(legs).toHaveLength(6)
    legs.forEach((leg) => expect(leg.estimated).toBe(true))
  })

  it('restricts fixtures to the requested venue side', () => {
    const fixtures = [
      makeMarketMatch({ matchId: 'm_home1', home: '切尔西', away: '阿森纳', kickoff: '2026-10-04 20:00' }),
      makeMarketMatch({ matchId: 'm_away1', home: '阿森纳', away: '切尔西', kickoff: '2026-10-11 20:00' }),
      makeMarketMatch({ matchId: 'm_home2', home: '切尔西', away: '利物浦', kickoff: '2026-10-18 20:00' }),
      makeMarketMatch({ matchId: 'm_away2', home: '利物浦', away: '切尔西', kickoff: '2026-10-25 20:00' }),
    ]
    const home = buildLegs(chelseaDrawSpec({ venue: 'home', matchesPlanned: 2 }), fixtures)
    expect(home.legs.map((leg) => leg.venue)).toEqual(['home', 'home'])
    expect(home.legs.map((leg) => leg.label)).toEqual(['切尔西 vs 阿森纳', '切尔西 vs 利物浦'])
    // 主场比分格按本队视角：1-1 仍是 (1,1)，赔率 6.5
    expect(home.legs.every((leg) => leg.odds === 6.5 && leg.estimated === false)).toBe(true)

    const away = buildLegs(chelseaDrawSpec({ venue: 'away', matchesPlanned: 2 }), fixtures)
    expect(away.legs.map((leg) => leg.venue)).toEqual(['away', 'away'])
    expect(away.legs.map((leg) => leg.label)).toEqual(['阿森纳 vs 切尔西', '利物浦 vs 切尔西'])

    const anyVenue = buildLegs(chelseaDrawSpec({ venue: 'any', matchesPlanned: 4 }), fixtures)
    expect(anyVenue.legs).toHaveLength(4)
  })

  it('ignores venue when the team is empty (league-wide)', () => {
    const fixtures = [
      makeMarketMatch({ matchId: 'm1' }),
      makeMarketMatch({ matchId: 'm2', home: '阿森纳', away: '切尔西' }),
    ]
    const { legs } = buildLegs(
      { team: '', venue: 'away', market: 'score', score: { for: 1, against: 1 }, matchesPlanned: 2 },
      fixtures,
    )
    expect(legs).toHaveLength(2)
  })
})

describe('analyzeStrategy closed forms', () => {
  const uniformSpec = {
    team: '',
    market: 'score',
    score: { for: 1, against: 1 },
    matchesPlanned: 6,
    stakePerMatch: 20,
    oddsMode: 'manual',
    manualOdds: 6.5,
    probMode: 'custom',
    customProb: 0.1,
  }

  it('matches EV and breakeven closed forms on uniform manual legs', () => {
    const result = analyzeStrategy(uniformSpec, [])
    expect(result.perBet.evPct).toBeCloseTo(-0.35, 12)
    expect(result.perBet.breakevenP).toBeCloseTo(1 / 6.5, 12)
    expect(result.totalStake).toBe(120)
  })

  it('exact path matches the binomial closed form', () => {
    const result = analyzeStrategy(uniformSpec, [])
    expect(result.exact).not.toBeNull()
    expect(result.exact.meanProfit).toBeCloseTo(20 * (6 * 0.1 * 6.5 - 6), 10)
    expect(result.exact.pRuin).toBeCloseTo(0.9 ** 6, 10)
    expect(result.exact.pProfit).toBeCloseTo(1 - 0.9 ** 6, 10)
  })

  it('monte carlo is deterministic and close to the exact path', () => {
    const first = analyzeStrategy(uniformSpec, [])
    const second = analyzeStrategy(uniformSpec, [])
    expect(first.monteCarlo.meanProfit).toBe(second.monteCarlo.meanProfit)
    expect(first.monteCarlo.pProfit).toBe(second.monteCarlo.pProfit)
    expect(first.monteCarlo.medianProfit).toBe(second.monteCarlo.medianProfit)
    expect(first.monteCarlo.pProfit).toBeCloseTo(first.exact.pProfit, 1)
    expect(Math.abs(first.monteCarlo.pProfit - first.exact.pProfit)).toBeLessThanOrEqual(0.03)
  })

  it('verdict flags the Chelsea-like 1-1 chase as a negative-EV trap', () => {
    const result = analyzeStrategy(uniformSpec, [])
    expect(result.verdict.tone).toBe('negative')
  })

  it('verdict rewards a constructed edge over the devigged market', () => {
    // 主胜实价 3.0 → 去水公平概率约 0.319；自定义估计 0.5 → 明确正边际
    const match = makeMarketMatch({ had: { home: 3.0, draw: 3.4, away: 2.4 } })
    const spec = {
      team: '切尔西',
      market: 'result',
      outcome: 'win',
      matchesPlanned: 6,
      stakePerMatch: 20,
      oddsMode: 'market',
      probMode: 'custom',
      customProb: 0.5,
    }
    const result = analyzeStrategy(spec, [match])
    expect(result.legs[0].odds).toBe(3.0)
    expect(result.perBet.edgeVsFairPP).toBeGreaterThan(0.03)
    expect(result.monteCarlo.pProfit).toBeGreaterThan(0.6)
    expect(result.verdict.tone).toBe('positive')
  })
})

describe('normalizeSpec', () => {
  it('clamps matchesPlanned and drops the unused market payload', () => {
    const spec = normalizeSpec({ matchesPlanned: 99, market: 'result', outcome: 'nonsense', score: { for: 3, against: 3 } })
    expect(spec.matchesPlanned).toBe(20)
    expect(spec.score).toBeNull()
    expect(spec.outcome).toBe('win')
  })

  it('defaults venue to any, preserves home/away and rejects unknown values', () => {
    expect(createEmptySpec().venue).toBe('any')
    expect(normalizeSpec({}).venue).toBe('any')
    expect(normalizeSpec({ venue: 'home' }).venue).toBe('home')
    expect(normalizeSpec({ venue: 'away' }).venue).toBe('away')
    expect(normalizeSpec({ venue: 'neutral' }).venue).toBe('any')
    // round-trip：normalize(normalize(x)) 不丢维度
    expect(normalizeSpec(normalizeSpec({ venue: 'away' })).venue).toBe('away')
  })
})

// ── 虚拟仓位台账（Part 2）────────────────────────────────────────────

const makePosition = (overrides = {}) => ({
  id: 'p1',
  createdAt: '2026-09-19T00:00:00.000Z',
  matchId: 'm1',
  kickoff: '2026-09-20 20:00',
  home: '切尔西',
  away: '阿森纳',
  teamIdHome: 'chelsea',
  teamIdAway: 'arsenal',
  venue: 'home',
  entryOdds: 6.5,
  p: 0.12,
  stake: 20,
  status: 'pending',
  lastSeenOdds: 6.5,
  ...overrides,
})

describe('syncStrategyFixtures', () => {
  it('appends pending positions for the team, priced like buildLegs, capped at matchesPlanned', () => {
    const strategy = { ...chelseaDrawSpec({ matchesPlanned: 2 }), id: 'stg_t', status: 'live' }
    const markets = [
      makeMarketMatch({ matchId: 'm1' }),
      makeMarketMatch({ matchId: 'm2', home: '利物浦', away: '切尔西', kickoff: '2026-10-05 20:00' }),
    ]
    const synced = syncStrategyFixtures(strategy, markets)
    expect(synced.positions).toHaveLength(2)
    expect(synced.positions[0]).toMatchObject({
      matchId: 'm1', home: '切尔西', away: '阿森纳', venue: 'home',
      entryOdds: 6.5, lastSeenOdds: 6.5, stake: 20, status: 'pending',
      teamIdHome: 'chelsea', teamIdAway: 'arsenal',
    })
    expect(synced.positions[1]).toMatchObject({ matchId: 'm2', venue: 'away', entryOdds: 6.5 })
    expect(Number.isFinite(synced.positions[0].p)).toBe(true)

    // 幂等：同一份行情再同步不重复
    const again = syncStrategyFixtures(synced, markets)
    expect(again.positions).toHaveLength(2)
  })

  it('respects the matchesPlanned cap and skips retired strategies', () => {
    const one = syncStrategyFixtures(
      { ...chelseaDrawSpec({ matchesPlanned: 1 }), id: 'stg_1', status: 'shadow' },
      [makeMarketMatch({ matchId: 'm1' }), makeMarketMatch({ matchId: 'm2', home: '利物浦', away: '切尔西' })],
    )
    expect(one.positions).toHaveLength(1)

    const retired = syncStrategyFixtures(
      { ...chelseaDrawSpec({ matchesPlanned: 6 }), id: 'stg_r', status: 'retired' },
      [makeMarketMatch({ matchId: 'm1' })],
    )
    expect(retired.positions).toHaveLength(0)
  })
})

describe('refreshClosingOdds', () => {
  it('updates lastSeenOdds only for pending positions still selling', () => {
    const strategy = {
      ...chelseaDrawSpec(),
      id: 'stg_c',
      status: 'live',
      positions: [
        makePosition({ id: 'p1', lastSeenOdds: 6.5 }),
        makePosition({ id: 'p2', matchId: 'm9', home: '皇马', away: '巴萨', status: 'hit', profit: 110 }),
      ],
    }
    const refreshed = refreshClosingOdds(strategy, [
      makeMarketMatch({ matchId: 'm1', scores: [{ home: 1, away: 1, odds: 7 }] }),
    ])
    expect(refreshed.positions[0].lastSeenOdds).toBe(7)
    // 已结算仓位不动
    expect(refreshed.positions[1].lastSeenOdds).toBe(6.5)

    // 找不到行情的 pending 仓位保持原样
    const untouched = refreshClosingOdds(strategy, [])
    expect(untouched.positions[0].lastSeenOdds).toBe(6.5)
  })
})

describe('settleStrategyPositions', () => {
  const resultsIndex = {
    matches: [
      { date: '2026-09-20', home: '切尔西', away: '阿森纳', homeGoals: 1, awayGoals: 1, teamIdHome: 'chelsea', teamIdAway: 'arsenal', source: 'manual' },
      { date: '2026-09-21', home: '阿森纳', away: '切尔西', homeGoals: 2, awayGoals: 1, teamIdHome: 'arsenal', teamIdAway: 'chelsea', source: 'manual' },
    ],
  }

  it('settles hit/miss with venue mapping, profit, clv sign; never settles twice', () => {
    const strategy = {
      ...chelseaDrawSpec(),
      id: 'stg_s',
      status: 'live',
      positions: [
        // 主队视角 1-1，实际 1-1 → 中；收盘 6.0 < 入场 6.5 → CLV 为正
        makePosition({ id: 'p1', lastSeenOdds: 6.0 }),
        // 客队视角 for=1/against=1，实际 主2-客1 → 未中；收盘 7.5 > 入场 7 → CLV 为负
        makePosition({ id: 'p2', matchId: 'm2', kickoff: '2026-09-21 20:00', home: '阿森纳', away: '切尔西', teamIdHome: 'arsenal', teamIdAway: 'chelsea', venue: 'away', entryOdds: 7, lastSeenOdds: 7.5 }),
        // 无赛果 → 保持 pending
        makePosition({ id: 'p3', matchId: 'm3', kickoff: '2026-09-25 20:00', home: '切尔西', away: '利物浦', teamIdHome: 'chelsea', teamIdAway: 'liverpool' }),
      ],
    }
    const settled = settleStrategyPositions(strategy, resultsIndex)
    const [p1, p2, p3] = settled.positions

    expect(p1.status).toBe('hit')
    expect(p1.profit).toBeCloseTo(20 * 5.5, 10)
    expect(p1.clv).toBeGreaterThan(0)
    expect(p1.clv).toBeCloseTo(6.5 / 6.0 - 1, 10)
    expect(p1.finalScore).toBe('1-1')
    expect(p1.settledAt).toBeTruthy()

    expect(p2.status).toBe('miss')
    expect(p2.profit).toBe(-20)
    expect(p2.clv).toBeLessThan(0)

    expect(p3.status).toBe('pending')

    // 幂等：二次结算不动已结算仓位
    const again = settleStrategyPositions(settled, resultsIndex)
    expect(again.positions[0].settledAt).toBe(p1.settledAt)
    expect(again.positions[0].profit).toBe(p1.profit)
  })

  it('result market derives win/draw/lose from the score in team perspective', () => {
    const resultStrategy = (outcome, venue, positionOverrides = {}) => ({
      team: '切尔西',
      market: 'result',
      outcome,
      matchesPlanned: 6,
      stakePerMatch: 20,
      oddsMode: 'manual',
      manualOdds: 3.0,
      probMode: 'custom',
      customProb: 0.4,
      positions: [makePosition({ venue, ...positionOverrides })],
    })
    // 客场赢球：row 阿森纳 0-2 切尔西 → outcome win venue away → 中
    const awayWin = settleStrategyPositions(resultStrategy('win', 'away', { home: '阿森纳', away: '切尔西', teamIdHome: 'arsenal', teamIdAway: 'chelsea' }), {
      matches: [{ date: '2026-09-20', home: '阿森纳', away: '切尔西', homeGoals: 0, awayGoals: 2, teamIdHome: 'arsenal', teamIdAway: 'chelsea' }],
    })
    expect(awayWin.positions[0].status).toBe('hit')

    // 主场输球：row 切尔西 0-1 阿森纳 → outcome lose venue home → 中
    const homeLose = settleStrategyPositions(resultStrategy('lose', 'home'), {
      matches: [{ date: '2026-09-20', home: '切尔西', away: '阿森纳', homeGoals: 0, awayGoals: 1, teamIdHome: 'chelsea', teamIdAway: 'arsenal' }],
    })
    expect(homeLose.positions[0].status).toBe('hit')

    // 平局：row 1-1 → outcome draw → 中；outcome win → 不中
    const drawRows = { matches: [{ date: '2026-09-20', home: '切尔西', away: '阿森纳', homeGoals: 1, awayGoals: 1, teamIdHome: 'chelsea', teamIdAway: 'arsenal' }] }
    expect(settleStrategyPositions(resultStrategy('draw', 'home'), drawRows).positions[0].status).toBe('hit')
    expect(settleStrategyPositions(resultStrategy('win', 'home'), drawRows).positions[0].status).toBe('miss')
  })

  it('tolerates a ±1 day date gap between kickoff and result date', () => {
    const strategy = { ...chelseaDrawSpec(), positions: [makePosition({ kickoff: '2026-09-19 23:30' })] }
    const settled = settleStrategyPositions(strategy, resultsIndex)
    expect(settled.positions[0].status).toBe('hit')
  })

  it('settles Chinese strategy positions against English full-name result rows', () => {
    const strategy = { ...chelseaDrawSpec(), positions: [makePosition({ id: 'p_en' })] }
    const settled = settleStrategyPositions(strategy, {
      matches: [{ date: '2026-09-20', home: 'Chelsea FC', away: 'Arsenal FC', homeGoals: 1, awayGoals: 1 }],
    })
    expect(settled.positions[0].status).toBe('hit')

    // 结果行没有 teamId 时也不能用 contains 误结：Rayo 不是 Real Madrid。
    const rayo = { ...chelseaDrawSpec(), positions: [makePosition({ id: 'p_rayo', home: 'Rayo Vallecano de Madrid', away: 'Getafe', teamIdHome: null, teamIdAway: null })] }
    const notSettled = settleStrategyPositions(rayo, {
      matches: [{ date: '2026-09-20', home: 'Real Madrid', away: 'Getafe', homeGoals: 1, awayGoals: 1 }],
    })
    expect(notSettled.positions[0].status).toBe('pending')
  })
})

describe('aliasesForTeam / matchVenueForTeam', () => {
  it('drops ambiguous city/generic aliases so same-city clubs never match', () => {
    const psgAliases = aliasesForTeam('巴黎圣日耳曼')
    expect(psgAliases).not.toContain('paris')
    expect(matchVenueForTeam({ home: 'Paris FC', away: 'Lens' }, psgAliases)).toBeNull()
    expect(matchVenueForTeam({ home: 'Paris Saint-Germain', away: 'Lens' }, psgAliases)).toBe('home')

    const madridAliases = aliasesForTeam('皇马')
    expect(madridAliases).not.toContain('madrid')
    expect(matchVenueForTeam({ home: 'Rayo Vallecano de Madrid', away: 'Getafe' }, madridAliases)).toBeNull()
    expect(matchVenueForTeam({ home: 'Club Atlético de Madrid', away: 'Getafe' }, madridAliases)).toBeNull()
    expect(matchVenueForTeam({ home: 'Real Madrid', away: 'Getafe' }, madridAliases)).toBe('home')
  })

  it('keeps the raw name for unknown teams', () => {
    expect(aliasesForTeam('Zebra Rovers')).toEqual(['zebra rovers'])
    expect(matchVenueForTeam({ home: 'Zebra Rovers', away: 'Other' }, aliasesForTeam('Zebra Rovers'))).toBe('home')
  })
})

describe('wilsonInterval', () => {
  it('hits the degenerate bounds exactly', () => {
    expect(wilsonInterval(0, 10).low).toBeCloseTo(0, 12)
    expect(wilsonInterval(10, 10).high).toBeCloseTo(1, 12)
    expect(wilsonInterval(0, 0)).toEqual({ low: 0, high: 1 })
  })

  it('is centered around the sample rate and narrows with n', () => {
    const small = wilsonInterval(3, 10)
    const large = wilsonInterval(30, 100)
    expect(small.low).toBeLessThan(0.3)
    expect(small.high).toBeGreaterThan(0.3)
    expect(large.high - large.low).toBeLessThan(small.high - small.low)
  })
})

describe('strategyStats', () => {
  const makeLedger = (hitsCount, total, { odds = 6.5, stake = 20, clv = 0.05 } = {}) =>
    Array.from({ length: total }, (_, i) => {
      // 均匀撒布的命中（Bresenham 式），避免"命中全堆在前半"污染 recent5
      const hit = ((i * hitsCount) % total) < hitsCount
      return {
        id: `p${i}`,
        status: hit ? 'hit' : 'miss',
        stake,
        entryOdds: odds,
        lastSeenOdds: odds / (1 + clv),
        profit: hit ? stake * (odds - 1) : -stake,
        clv,
        settledAt: new Date(Date.UTC(2026, 0, i + 1)).toISOString(),
      }
    })

  it('promotes a 20-of-25 ledger with positive CLV past all three gates', () => {
    const stats = strategyStats({ positions: makeLedger(20, 25) })
    expect(stats.n).toBe(25)
    expect(stats.hits).toBe(20)
    expect(stats.hitRate).toBeCloseTo(0.8, 12)
    expect(stats.roi).toBeCloseTo((20 * 110 - 5 * 20) / 500, 12)
    expect(stats.avgClv).toBeCloseTo(0.05, 12)
    expect(stats.gateChecks.map((gate) => gate.id)).toEqual(['sample_size', 'edge_significance', 'clv_positive'])
    expect(stats.gateChecks.every((gate) => gate.pass)).toBe(true)
    expect(stats.promotable).toBe(true)
    expect(stats.suggestRetire).toBe(false)
    expect(stats.drift).toBe(false)
  })

  it('suggests retiring a 3-of-25 ledger whose Wilson upper is below breakeven', () => {
    const stats = strategyStats({ positions: makeLedger(3, 25, { odds: 3.0 }) })
    expect(stats.n).toBe(25)
    expect(stats.promotable).toBe(false)
    expect(stats.gateChecks.find((gate) => gate.id === 'edge_significance').pass).toBe(false)
    // 盈亏平衡 1/3.0 ≈ 33.3%，Wilson 上界 ≈ 30% → 统计上救不回来
    expect(stats.hitCI.high).toBeLessThan(1 / 3.0)
    expect(stats.suggestRetire).toBe(true)
  })

  it('flags drift on a collapsing recent-5 window and counts pending', () => {
    const positions = [
      ...makeLedger(20, 25),
      makePosition({ id: 'pending1', status: 'pending' }),
    ]
    // 让最后 5 场全败（覆盖 makeLedger 的间隔命中）
    const collapsed = positions.map((position, index) =>
      index >= 20 && index < 25 ? { ...position, status: 'miss', profit: -20 } : position,
    )
    const stats = strategyStats({ positions: collapsed })
    expect(stats.pending).toBe(1)
    expect(stats.recent5.n).toBe(5)
    expect(stats.recent5.roi).toBe(-1)
    expect(stats.drift).toBe(true)
  })

  it('returns nulls instead of NaN on an empty ledger', () => {
    const stats = strategyStats({ positions: [] })
    expect(stats).toMatchObject({ n: 0, pending: 0, hits: 0, hitRate: null, roi: null, avgClv: null, sharpe: null, promotable: false, suggestRetire: false })
  })
})

describe('backtestStrategy', () => {
  const resultsIndex = {
    matches: [
      { date: '2026-09-01', home: '切尔西', away: '阿森纳', homeGoals: 1, awayGoals: 1 },
      { date: '2026-09-08', home: '阿森纳', away: '切尔西', homeGoals: 2, awayGoals: 0 },
      { date: '2026-09-15', home: '利物浦', away: '切尔西', homeGoals: 1, awayGoals: 1 },
      { date: '2026-09-15', home: '曼联', away: '曼城', homeGoals: 3, awayGoals: 3 },
    ],
  }
  const spec = { team: '切尔西', market: 'score', score: { for: 1, against: 1 }, stakePerMatch: 10, oddsMode: 'manual', manualOdds: 6.5 }

  it('prices each historical match at the flat assumed odds', () => {
    const result = backtestStrategy(spec, resultsIndex)
    expect(result.n).toBe(3)
    expect(result.hits).toBe(2)
    expect(result.hitRate).toBeCloseTo(2 / 3, 12)
    expect(result.assumedOdds).toBe(6.5)
    // +55, −10, +55
    expect(result.equityCurve).toEqual([
      { i: 1, cum: 55 },
      { i: 2, cum: 45 },
      { i: 3, cum: 100 },
    ])
    expect(result.maxDrawdown).toBe(10)
    expect(result.roi).toBeCloseTo(100 / 30, 12)
    expect(result.hitCI.low).toBeLessThan(2 / 3)
    expect(result.disclaimer).toContain('假定赔率')
  })

  it('empty team means league-wide, and an explicit assumedOdds wins over the spec', () => {
    const leagueWide = backtestStrategy({ ...spec, team: '' }, resultsIndex, 10)
    expect(leagueWide.n).toBe(4)
    expect(leagueWide.assumedOdds).toBe(10)
  })
})

describe('venue-scoped backtest and walk-forward', () => {
  // 切尔西 4 主全负 + 4 客全胜：全量 8 场，按场地各 4 场。
  const resultsIndex = {
    matches: [
      ...Array.from({ length: 4 }, (_, i) => ({
        date: `2026-09-0${i + 1}`,
        home: '切尔西',
        away: '阿森纳',
        homeGoals: 0,
        awayGoals: 1,
      })),
      ...Array.from({ length: 4 }, (_, i) => ({
        date: `2026-09-1${i + 1}`,
        home: '阿森纳',
        away: '切尔西',
        homeGoals: 0,
        awayGoals: 1,
      })),
    ],
  }
  const loseSpec = (venue) => ({
    team: '切尔西',
    venue,
    market: 'result',
    outcome: 'lose',
    stakePerMatch: 10,
    oddsMode: 'manual',
    manualOdds: 2.9,
  })

  it('filters the backtest sample to the team side and keeps venue-aware outcomes', () => {
    expect(backtestStrategy(loseSpec('any'), resultsIndex)).toMatchObject({ n: 8, hits: 4 })
    const home = backtestStrategy(loseSpec('home'), resultsIndex)
    expect(home).toMatchObject({ n: 4, hits: 4, hitRate: 1 })
    const away = backtestStrategy(loseSpec('away'), resultsIndex)
    expect(away).toMatchObject({ n: 4, hits: 0, hitRate: 0 })
    // team 为空时忽略 venue：全联赛口径仍是 8 场
    expect(backtestStrategy({ ...loseSpec('home'), team: '' }, resultsIndex).n).toBe(8)
  })

  it('keeps OOS n within the venue-filtered total and splits only that sample', () => {
    const homeTotal = backtestStrategy(loseSpec('home'), resultsIndex).n
    const home = walkForwardStrategy(loseSpec('home'), resultsIndex, { trainRatio: 0.75 })
    expect(home.train.n + home.test.n).toBe(homeTotal)
    expect(home.train.n).toBe(3)
    expect(home.test.n).toBe(1)
    expect(home.test.n).toBeLessThanOrEqual(homeTotal)
    expect(home.test.hits).toBe(1)

    const awayTotal = backtestStrategy(loseSpec('away'), resultsIndex).n
    const away = walkForwardStrategy(loseSpec('away'), resultsIndex, { trainRatio: 0.75 })
    expect(away.train.n + away.test.n).toBe(awayTotal)
    expect(away.test.n).toBeLessThanOrEqual(awayTotal)
    expect(away.test.hits).toBe(0)
  })
})

describe('discoverStrategies', () => {
  const makeRow = (homeId, awayId, homeGoals, awayGoals, day) => ({
    date: `2026-08-${String(day).padStart(2, '0')}`,
    home: homeId,
    away: awayId,
    homeGoals,
    awayGoals,
    teamIdHome: homeId,
    teamIdAway: awayId,
    source: 'manual',
  })

  const buildLeague = () => {
    const rows = []
    let day = 0
    const nextDay = () => {
      day += 1
      return ((day - 1) % 28) + 1
    }
    // planted：20 场全主场，10 场 1-1（50%，盈亏线 1/6.5≈15.4%）+ 10 场 3-1
    for (let i = 0; i < 20; i += 1) {
      rows.push(makeRow('planted', `opp_p${i}`, i < 10 ? 1 : 3, 1, nextDay()))
    }
    // 8 支噪音球队：各 20 场（10 主 10 客），4胜3平3负分布，1-1 各 1 场
    for (let t = 1; t <= 8; t += 1) {
      const team = `noise${t}`
      const homeScores = [[2, 0], [2, 1], [1, 0], [3, 1], [1, 1], [0, 0], [2, 2], [0, 1], [1, 2], [0, 2]]
      const awayScores = [[0, 2], [1, 2], [0, 1], [1, 3], [1, 1], [0, 0], [2, 2], [1, 0], [2, 1], [2, 0]]
      homeScores.forEach(([h, a], i) => rows.push(makeRow(team, `opp_${t}h${i}`, h, a, nextDay())))
      awayScores.forEach(([h, a], i) => rows.push(makeRow(`opp_${t}a${i}`, team, h, a, nextDay())))
    }
    return rows
  }

  it('surfaces a planted 1-1 bias through BH-FDR while noise cells stay out', () => {
    const { rows, totalTested, survivors } = discoverStrategies({ matches: buildLeague() }, { minN: 10 })
    expect(rows.length).toBe(totalTested)
    // planted 全主场（3 比分格 + 3 主场格 = 6）+ 8 支噪音球队 × 9 格 = 78
    expect(totalTested).toBe(78)
    const planted = rows.find((row) => row.teamId === 'planted' && row.templateId === 'score_1_1')
    expect(planted).toBeTruthy()
    expect(planted.teamKey).toBe('planted')
    expect(planted.venue).toBe('any')
    expect(planted.n).toBe(20)
    expect(planted.hits).toBe(10)
    expect(planted.hitRate).toBeCloseTo(0.5, 12)
    expect(planted.roi).toBeCloseTo(0.5 * 6.5 - 1, 12)
    expect(planted.pValue).toBeLessThan(0.01)
    expect(planted.survivesFdr).toBe(true)

    // 唯一的幸存者就是 planted 的 1-1；纯噪音格子一个都不该活下来
    expect(survivors).toHaveLength(1)
    expect(survivors[0]).toBe(planted)
    expect(survivors.every((row) => row.teamId === 'planted')).toBe(true)

    // 按 roi 降序
    for (let i = 1; i < rows.length; i += 1) {
      expect(rows[i - 1].roi).toBeGreaterThanOrEqual(rows[i].roi)
    }
    expect(rows[0]).toBe(planted)
  })

  it('respects minN and caller-overridden assumedOdds', () => {
    const league = buildLeague()
    const strict = discoverStrategies({ matches: league }, { minN: 100 })
    expect(strict.totalTested).toBe(0)

    const repriced = discoverStrategies({ matches: league }, { assumedOdds: { score_1_1: 30 } })
    const planted = repriced.rows.find((row) => row.teamId === 'planted' && row.templateId === 'score_1_1')
    expect(planted.assumedOdds).toBe(30)
  })

  it('keeps two unmatched teams with the same template on distinct teamKeys', () => {
    const matches = [
      { date: '2026-08-01', home: '神秘甲', away: '路人一', homeGoals: 1, awayGoals: 1, teamIdHome: null, teamIdAway: null },
      { date: '2026-08-02', home: '神秘甲', away: '路人二', homeGoals: 1, awayGoals: 1, teamIdHome: null, teamIdAway: null },
      { date: '2026-08-03', home: '神秘乙', away: '路人三', homeGoals: 1, awayGoals: 1, teamIdHome: null, teamIdAway: null },
      { date: '2026-08-04', home: '神秘乙', away: '路人四', homeGoals: 1, awayGoals: 1, teamIdHome: null, teamIdAway: null },
    ]
    const { rows } = discoverStrategies({ matches }, { minN: 2 })
    const cells = rows.filter((row) => row.templateId === 'score_1_1')
    expect(cells).toHaveLength(2)
    expect(cells.every((row) => row.teamId === null)).toBe(true)
    expect(cells.every((row) => typeof row.teamKey === 'string' && row.teamKey.startsWith('name:'))).toBe(true)
    expect(new Set(cells.map((row) => row.teamKey)).size).toBe(2)
    expect(new Set(cells.map((row) => `${row.teamKey}|${row.templateId}`)).size).toBe(2)
    expect(cells.map((row) => row.teamKey)).not.toContain('null')
  })

  it('runs walk-forward for an unmatched team only on its own venue-scoped fixtures', () => {
    const matches = [
      // 神秘甲：4 个主场全负
      ...Array.from({ length: 4 }, (_, i) => ({
        date: `2026-07-0${i + 1}`,
        home: '神秘甲',
        away: `对手甲${i}`,
        homeGoals: 0,
        awayGoals: 1,
        teamIdHome: null,
        teamIdAway: null,
      })),
      // 神秘甲：4 个客场全胜——venue=home 时必须被排除
      ...Array.from({ length: 4 }, (_, i) => ({
        date: `2026-07-1${i + 1}`,
        home: `对手乙${i}`,
        away: '神秘甲',
        homeGoals: 0,
        awayGoals: 1,
        teamIdHome: null,
        teamIdAway: null,
      })),
      // 联赛其他球队的平局，确保"只看该队"不是"只看全联赛"
      ...Array.from({ length: 4 }, (_, i) => ({
        date: `2026-07-2${i + 1}`,
        home: `联赛主${i}`,
        away: `联赛客${i}`,
        homeGoals: 1,
        awayGoals: 1,
        teamIdHome: null,
        teamIdAway: null,
      })),
    ]
    const { rows } = discoverStrategies({ matches }, { minN: 4 })
    const row = rows.find((item) => item.teamName === '神秘甲' && item.templateId === 'result_lose_home')
    expect(row).toBeTruthy()
    expect(row.teamId).toBeNull()
    expect(row.venue).toBe('home')
    expect(row.n).toBe(4)

    const spec = specFromDiscoveryRow(row)
    expect(spec.venue).toBe('home')
    const walkForward = walkForwardStrategy(spec, { matches })
    expect(walkForward.train.n + walkForward.test.n).toBe(4)
    expect(walkForward.test.n).toBeLessThanOrEqual(row.n)
    expect(walkForward.train.hits + walkForward.test.hits).toBe(4)
  })
})

// ── Round 3：样本外 / 组合 / 执行 / 作废 / CSV ─────────────────────────

const round3Ledger = (hitsCount, total, { odds = 3.0, stake = 20, clv = 0.05 } = {}) =>
  Array.from({ length: total }, (_, i) => {
    const hit = ((i * hitsCount) % total) < hitsCount
    return {
      id: `r3_${i}`,
      status: hit ? 'hit' : 'miss',
      stake,
      entryOdds: odds,
      lastSeenOdds: odds / (1 + clv),
      profit: hit ? stake * (odds - 1) : -stake,
      clv,
      settledAt: new Date(Date.UTC(2026, 0, i + 1)).toISOString(),
    }
  })

describe('walkForwardStrategy', () => {
  it('splits chronologically and flags out-of-sample degradation', () => {
    const matches = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-09-${String(i + 1).padStart(2, '0')}`,
      home: '切尔西',
      away: '阿森纳',
      homeGoals: i < 7 ? 1 : 2,
      awayGoals: i < 7 ? 1 : 0,
    }))
    const result = walkForwardStrategy(
      { team: '切尔西', market: 'score', score: { for: 1, against: 1 }, stakePerMatch: 20, oddsMode: 'manual', manualOdds: 6.5 },
      { matches },
      { trainRatio: 0.7 },
    )
    expect(result.train).toMatchObject({ n: 7, hits: 7, hitRate: 1 })
    expect(result.test).toMatchObject({ n: 3, hits: 0, hitRate: 0, roi: -1 })
    expect(result.oosDegraded).toBe(true)
    expect(result.verdict).toContain('退化')
    expect(result.assumedOdds).toBe(6.5)
  })

  it('treats a positive test ROI as the only profitable OOS state', () => {
    const matches = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-09-${String(i + 1).padStart(2, '0')}`,
      home: '切尔西',
      away: '阿森纳',
      homeGoals: 1,
      awayGoals: 1,
    }))
    const result = walkForwardStrategy(
      { team: '切尔西', market: 'score', score: { for: 1, against: 1 }, stakePerMatch: 20, oddsMode: 'manual', manualOdds: 6.5 },
      { matches },
      { trainRatio: 0.7 },
    )
    expect(result.testProfitable).toBe(true)
    expect(result.notDegraded).toBe(true)
    expect(result.oosDegraded).toBe(false)
    expect(result.verdict).toBe('样本外仍为正期望，通过')
  })

  it('does not call a negative test ROI "passing" when degradation is not catastrophic', () => {
    // 6.5 倍赔率的平衡线 = 15.38%；样本外 8 场中 1 场 → 12.5%，
    // ROI = (1×5.5 − 7)/8 = −18.75%：未跌破 −20% 的退化线，但仍是负期望。
    const matches = Array.from({ length: 20 }, (_, i) => ({
      date: `2026-09-${String(i + 1).padStart(2, '0')}`,
      home: '切尔西',
      away: '阿森纳',
      homeGoals: i === 12 ? 1 : 2,
      awayGoals: i === 12 ? 1 : 0,
    }))
    const result = walkForwardStrategy(
      { team: '切尔西', market: 'score', score: { for: 1, against: 1 }, stakePerMatch: 20, oddsMode: 'manual', manualOdds: 6.5 },
      { matches },
      { trainRatio: 0.6 },
    )
    expect(result.test).toMatchObject({ n: 8, hits: 1, hitRate: 0.125 })
    expect(result.test.roi).toBeCloseTo(-0.1875, 10)
    expect(result.testProfitable).toBe(false)
    expect(result.notDegraded).toBe(true)
    expect(result.oosDegraded).toBe(false)
    expect(result.verdict).toBe('样本外未明显退化，但仍为负期望（未通过）')
  })
})

describe('autoRetireStrategy', () => {
  it('retires a failing strategy once and records history', () => {
    const strategy = { id: 'stg_retire', status: 'live', positions: round3Ledger(3, 25) }
    const retired = autoRetireStrategy(strategy)
    expect(retired.status).toBe('retired')
    expect(retired.retiredReason).toBe('monitor_auto')
    expect(retired.statusHistory).toHaveLength(1)
    expect(retired.statusHistory[0]).toMatchObject({ from: 'live', to: 'retired', reason: 'monitor_auto' })
    expect(autoRetireStrategy(retired)).toBe(retired)
    expect(autoRetireStrategy({ id: 'healthy', status: 'shadow', positions: [] })).toMatchObject({ status: 'shadow' })
  })
})

describe('strategyPortfolio', () => {
  it('aggregates exposure and emits cap/team alerts', () => {
    const strategies = Array.from({ length: 3 }, (_, i) => ({
      ...chelseaDrawSpec(),
      id: `stg_p${i}`,
      name: `策略${i}`,
      status: 'live',
      positions: [makePosition({ id: `pos_p${i}`, stake: 100 })],
    }))
    const retired = { ...chelseaDrawSpec(), id: 'retired', status: 'retired', positions: [makePosition({ id: 'retired_p', stake: 500 })] }
    const result = strategyPortfolio([...strategies, retired], { poolBalance: 1000, riskCapRatio: 0.12 })
    expect(result.activeCount).toBe(3)
    expect(result.pendingCount).toBe(3)
    expect(result.pendingStake).toBe(300)
    expect(result.exposurePct).toBeCloseTo(0.3, 12)
    expect(result.concentration.topTeamPct).toBeCloseTo(0.3, 12)
    expect(result.teams[0]).toMatchObject({ teamKey: 'chelsea', teamName: '切尔西', stake: 300 })
    expect(result.teams[0].strategies).toHaveLength(3)
    expect(result.alerts.map((alert) => alert.id)).toEqual(
      expect.arrayContaining(['total_exposure', 'team_exposure:chelsea', 'team_count:chelsea']),
    )
  })
})

describe('simulateStrategyPortfolio', () => {
  const mcStrategy = (positions) => ({
    team: '切尔西',
    market: 'result',
    outcome: 'win',
    matchesPlanned: 6,
    stakePerMatch: 20,
    oddsMode: 'manual',
    manualOdds: 2,
    status: 'live',
    positions,
  })

  it('makes mutually exclusive outcomes on one match unable to hit together', () => {
    const positions = [
      makePosition({ id: 'home', outcomeKey: 'had:home', p: 0.5, entryOdds: 2, stake: 20 }),
      makePosition({ id: 'away', outcomeKey: 'had:away', p: 0.5, entryOdds: 2, stake: 20 }),
    ]
    const result = simulateStrategyPortfolio([mcStrategy(positions)], { iterations: 2000 })
    // Σp=1：每轮必中一个且只中一个，因此两笔一胜一负，组合盈亏恒为 0
    expect(result.nMatches).toBe(1)
    expect(result.nPositions).toBe(2)
    expect(result).toMatchObject({ p5: 0, median: 0, p95: 0, worst: 0, best: 0, pProfit: 0, pRuin: 0 })
  })

  it('settles same-outcome duplicates together and is deterministic', () => {
    const positions = [
      makePosition({ id: 'dup1', outcomeKey: 'had:home', p: 0.4, entryOdds: 2, stake: 20 }),
      makePosition({ id: 'dup2', outcomeKey: 'had:home', p: 0.4, entryOdds: 2, stake: 20 }),
    ]
    const strategies = [mcStrategy(positions)]
    const first = simulateStrategyPortfolio(strategies, { iterations: 2000 })
    const second = simulateStrategyPortfolio(strategies, { iterations: 2000 })
    expect(first).toEqual(second)
    expect(first.worst).toBe(-40)
    expect(first.best).toBe(40)
    expect(first.p5).toBe(-40)
    expect(first.p95).toBe(40)
    expect(first.pProfit).toBeGreaterThan(0.3)
    expect(first.pProfit).toBeLessThan(0.5)
  })
})

describe('strategyQualityScore / kellyStakeForPool', () => {
  it('rewards sample, Wilson edge, CLV and OOS while penalizing drift', () => {
    const base = { n: 40, hitCI: { low: 0.3, high: 0.6 }, breakevenP: 0.2, avgClv: 0.05, drift: false }
    const strong = strategyQualityScore(base)
    expect(strong.score).toBe(85)
    expect(strong.grade).toBe('A')
    expect(strategyQualityScore(base, { oosPassed: true }).score).toBe(90)
    const weak = strategyQualityScore({ n: 10, hitCI: { low: 0, high: 0.2 }, breakevenP: 0.2, avgClv: 0, drift: true })
    expect(weak.score).toBeLessThan(strong.score)
    expect(weak.parts.drift).toBe(-10)
  })

  it('caps Kelly stake at the pool risk cap', () => {
    const uncapped = kellyStakeForPool({ p: 0.6, odds: 2, poolBalance: 1000 })
    expect(uncapped.fraction).toBeCloseTo(0.2, 12)
    expect(uncapped.rawStake).toBeCloseTo(50, 10)
    expect(uncapped.cappedStake).toBeCloseTo(50, 10)
    expect(uncapped.capReason).toBeNull()
    const capped = kellyStakeForPool({ p: 0.9, odds: 2, poolBalance: 1000 })
    expect(capped.fraction).toBeCloseTo(0.8, 12)
    expect(capped.rawStake).toBe(200)
    expect(capped.cappedStake).toBe(120)
    expect(capped.capReason).toBe('risk_cap')
  })
})

describe('buildInvestmentFromPosition / validateExecution', () => {
  it('builds a complete pending single-bet investment with Chinese entries', () => {
    const strategy = { ...chelseaDrawSpec(), id: 'stg_exec', status: 'live' }
    const position = makePosition({ id: 'pos_exec', venue: 'away', home: '阿森纳', away: '切尔西', entryOdds: 6.5, p: 0.12, stake: 20 })
    const investment = buildInvestmentFromPosition(strategy, position, { stake: 30, now: Date.UTC(2026, 9, 17) })
    expect(investment).toMatchObject({
      created_at: '2026-10-17T00:00:00.000Z',
      parlay_size: 1,
      inputs: 30,
      suggested_amount: 30,
      combined_odds: 6.5,
      status: 'pending',
      source: 'quants',
      strategy_id: 'stg_exec',
      strategy_position_id: 'pos_exec',
    })
    expect(investment.matches).toHaveLength(1)
    expect(investment.matches[0]).toMatchObject({
      home_team: '阿森纳',
      away_team: '切尔西',
      entry_text: '1-1',
      odds: 6.5,
      conf: 0.12,
      mode: '常规',
      tys_home: 'M',
      tys_away: 'M',
      fid: 0.4,
      fse_home: 0.5,
      fse_away: 0.5,
      fse_match: 0.5,
    })
    expect(investment.matches[0].entries).toEqual([{ name: '1-1', odds: 6.5 }])
    expect(investment.matches[0].entry_text).toBe(investment.matches[0].entries[0].name)

    const resultInvestment = buildInvestmentFromPosition(
      { team: '切尔西', market: 'result', outcome: 'win', status: 'live' },
      makePosition({ id: 'result_pos', venue: 'away' }),
    )
    expect(resultInvestment.matches[0].entry_text).toBe('胜')
  })

  it('blocks non-live, settled, over-cash and exposure-breaching execution', () => {
    const position = makePosition({ id: 'exec_pos', stake: 20 })
    const live = { ...chelseaDrawSpec(), id: 'stg_exec', status: 'live' }
    expect(validateExecution(live, position, { poolBalance: 1000, existingStrategies: [] }).ok).toBe(true)
    expect(validateExecution({ ...live, status: 'shadow' }, position, { poolBalance: 1000 }).ok).toBe(false)
    expect(validateExecution(live, { ...position, status: 'hit' }, { poolBalance: 1000 }).ok).toBe(false)
    expect(validateExecution(live, { ...position, stake: 200 }, { poolBalance: 1000 }).reasons).toContain('组合总敞口将超过风险上限')
    expect(validateExecution(live, { ...position, stake: 1200 }, { poolBalance: 1000 }).reasons).toContain('注码超过当前可用现金')
  })
})

describe('void positions and CSV exports', () => {
  it('voids stale positions and excludes them from strategyStats', () => {
    const oldPosition = makePosition({ id: 'old', kickoff: '2026-09-01 20:00', stake: 10 })
    const recentPosition = makePosition({ id: 'recent', kickoff: '2026-10-16 20:00', stake: 10 })
    const strategy = {
      ...chelseaDrawSpec(),
      id: 'stg_void',
      status: 'live',
      positions: [
        makePosition({ id: 'hit', status: 'hit', profit: 55, stake: 10, entryOdds: 6.5 }),
        makePosition({ id: 'miss', status: 'miss', profit: -10, stake: 10, entryOdds: 6.5 }),
        oldPosition,
        recentPosition,
      ],
    }
    const voided = autoVoidStalePositions(strategy, { now: Date.UTC(2026, 9, 17), staleDays: 10 })
    expect(voided.positions.find((position) => position.id === 'old')).toMatchObject({ status: 'void', profit: 0, reason: 'stale_no_result' })
    expect(voided.positions.find((position) => position.id === 'recent').status).toBe('pending')
    const stats = strategyStats(voided)
    expect(stats).toMatchObject({ n: 2, hits: 1, voided: 1, pending: 1, roi: 2.25 })

    const manual = voidStrategyPosition(voided, 'recent', 'manual_test')
    expect(manual.positions.find((position) => position.id === 'recent')).toMatchObject({ status: 'void', profit: 0, reason: 'manual_test' })
    expect(strategyStats(manual)).toMatchObject({ n: 2, pending: 0, voided: 2 })
  })

  it('escapes commas, quotes and newlines without a BOM', () => {
    const strategy = {
      ...chelseaDrawSpec(),
      id: 'stg_csv',
      name: '测试, "策略"\n第二行',
      status: 'live',
      positions: [makePosition({ id: 'csv1', home: '切尔西, 青年队', status: 'hit', profit: 55 })],
    }
    const strategiesCsv = exportStrategiesCsv([strategy])
    expect(strategiesCsv.charCodeAt(0)).not.toBe(0xfeff)
    expect(strategiesCsv).toContain('策略ID,名称,状态')
    expect(strategiesCsv).toContain('"测试, ""策略""\n第二行"')

    const positionsCsv = strategyPositionsCsv(strategy)
    expect(positionsCsv).toContain('头寸ID')
    expect(positionsCsv).toContain('"切尔西, 青年队"')
    expect(positionsCsv).toContain('55.00')
  })
})

describe('position match/outcome keys', () => {
  it('adds matchKey and outcomeKey during fixture sync', () => {
    const synced = syncStrategyFixtures({ ...chelseaDrawSpec({ matchesPlanned: 1 }), status: 'live' }, [makeMarketMatch()])
    expect(synced.positions[0]).toMatchObject({ matchKey: 'm1', outcomeKey: 'crs:1-1' })
  })
})

// ── Round 4：ratings 概率 / 执行关联 / 发现行 spec ──────────────────────

describe('ratings probability mode', () => {
  const resultsIndex = {
    matches: [
      { date: '2026-09-01', home: '切尔西', away: '阿森纳', homeGoals: 2, awayGoals: 0, teamIdHome: 'chelsea', teamIdAway: 'arsenal' },
      { date: '2026-09-08', home: '阿森纳', away: '切尔西', homeGoals: 1, awayGoals: 2, teamIdHome: 'arsenal', teamIdAway: 'chelsea' },
      { date: '2026-09-15', home: '切尔西', away: '阿森纳', homeGoals: 1, awayGoals: 1, teamIdHome: 'chelsea', teamIdAway: 'arsenal' },
    ],
  }

  it('uses probabilityFromRatings cells when ratings are supplied', () => {
    const ratings = buildTeamRatings(resultsIndex)
    const spec = chelseaDrawSpec({ probMode: 'ratings', matchesPlanned: 1 })
    const { legs } = buildLegs(spec, [makeMarketMatch()], { ratings })
    const expected = probabilityFromRatings({ teamKeyHome: 'chelsea', teamKeyAway: 'arsenal' }, ratings)
      .cells.find((cell) => cell.home === 1 && cell.away === 1).p
    expect(legs[0].p).toBeCloseTo(expected, 12)
    expect(legs[0].pRatings).toBeCloseTo(expected, 12)

    const analysis = analyzeStrategy(spec, [makeMarketMatch()], { ratings, kellyDivisor: 4 })
    expect(analysis.perBet.avgP).toBeCloseTo(expected, 12)
  })

  it('falls back to the league base when ratings are unavailable', () => {
    const spec = chelseaDrawSpec({ probMode: 'ratings', matchesPlanned: 1 })
    const { legs } = buildLegs(spec, [makeMarketMatch()])
    expect(legs[0].p).toBeCloseTo(baseProbability(spec), 12)
    expect(legs[0].pRatings).toBeNaN()
  })
})

describe('markPositionExecuted', () => {
  it('records investment linkage without changing settlement state', () => {
    const strategy = { ...chelseaDrawSpec(), id: 'stg_mark', positions: [makePosition({ id: 'pos_mark' })] }
    const marked = markPositionExecuted(strategy, 'pos_mark', { investmentId: 'inv_1', stake: 30, at: '2026-10-17T00:00:00.000Z' })
    expect(marked.positions[0]).toMatchObject({
      status: 'pending',
      executedAt: '2026-10-17T00:00:00.000Z',
      executedInvestmentId: 'inv_1',
      executedStake: 30,
    })
    expect(strategy.positions[0].executedInvestmentId).toBeUndefined()
  })
})

describe('specFromDiscoveryRow', () => {
  it('maps score and result rows to complete base-probability specs', () => {
    const scoreSpec = specFromDiscoveryRow({ teamName: '切尔西', templateId: 'score_1_1', assumedOdds: 6.5 })
    expect(scoreSpec).toMatchObject({
      team: '切尔西',
      venue: 'any',
      market: 'score',
      score: { for: 1, against: 1 },
      matchesPlanned: 20,
      oddsMode: 'manual',
      manualOdds: 6.5,
      probMode: 'base',
      status: 'shadow',
    })
    const resultSpec = specFromDiscoveryRow({ teamName: '曼联', templateId: 'result_win_away', assumedOdds: 2.2 })
    expect(resultSpec).toMatchObject({ venue: 'away', market: 'result', outcome: 'win', manualOdds: 2.2, probMode: 'base' })
    expect(resultSpec.score).toBeNull()
  })

  it('preserves the venue of result_lose_home so OOS is scoped to home fixtures', () => {
    const spec = specFromDiscoveryRow({ teamName: '南安普顿', templateId: 'result_lose_home', assumedOdds: 2.9 })
    expect(spec).toMatchObject({ team: '南安普顿', venue: 'home', market: 'result', outcome: 'lose' })
  })
})
