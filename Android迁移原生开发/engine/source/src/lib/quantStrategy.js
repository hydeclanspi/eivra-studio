import { brandLocalStorage } from './brandStorage.js'
/**
 * ============================================================================
 *  quantStrategy.js — Quants · 量化策略实验室（策略对象 + 推演引擎）
 * ============================================================================
 *
 * 定位：把一个直觉（"切尔西 1-1 值得追"、"强队主胜稳"）翻译成可定价、
 * 可推演、可复盘的策略对象（spec），并给出诚实的期望与风险读数。
 *
 * ── 概率三视角（每条腿都算，能算几个算几个）──────────────────────────
 *   pPoisson  机构赔率 → fitMarketLambdas 倒推进球分布 → 泊松比分概率
 *   pDevig    比分盘 / 胜平负赔率直接比例去水后的市场公平概率
 *   pBase     联赛基准（DEFAULT_LAMBDA_PRIOR 先验分布，主客场取均值）
 * spec.probMode 决定哪一路进入 EV / 推演；另外两路只用于对照展示。
 *
 * ── 纪律 ────────────────────────────────────────────────────────────
 *   1. 本模块不抓网：marketMatches 一律由调用方提供（marketOdds.js），
 *      抓不到市场价 ≠ 没有市场价——无匹配场次时降级为手动口径并显式标注。
 *   2. 精确路径只在所有腿 p、odds 完全一致时启用（二项分布闭式解）；
 *      蒙特卡洛永远运行，作为非均匀腿的通用读数。
 *   3. 所有数字都是"如果概率估计是对的"的条件结论，不构成投注建议。
 *
 * @module quantStrategy
 */

import {
  DEFAULT_LAMBDA_PRIOR,
  deVigProportional,
  deriveScoreDistribution,
  fitMarketLambdas,
} from './readQuality'
import { marketOddsForFit, marketScorelineProbabilities } from './marketOdds'
import { TEAM_ALIAS_LIBRARY } from './localData'
import { isPreviewMode } from './displayMode'
import { previewRead, previewWrite } from './previewStore'
import { normalizeMatchDate, resolveTeamIdentity, teamKeyForName } from './matchResults'
import { marketMatchKey } from './oddsHistory'
import { probabilityFromRatings } from './teamRatings'

const STRATEGIES_KEY = 'eivra.strategies.v1'
const isBrowser = typeof window !== 'undefined'

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const toNumber = (value, fallback = Number.NaN) => {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toInt = (value, fallback = 0) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

const finiteOr = (value, fallback) => (Number.isFinite(value) ? value : fallback)

const numberIfPresent = (value) =>
  value === null || value === undefined || (typeof value === 'string' && value.trim() === '')
    ? Number.NaN
    : Number(value)

const meanOf = (list) => {
  const valid = (Array.isArray(list) ? list : []).filter(Number.isFinite)
  return valid.length > 0 ? valid.reduce((sum, value) => sum + value, 0) / valid.length : Number.NaN
}

// ── Spec 规范化 ────────────────────────────────────────────────────────

export const STRATEGY_STATUS_LABELS = Object.freeze({
  shadow: '影子盘',
  live: '已转正',
  retired: '已退役',
})

export const createEmptySpec = (defaults = {}) => ({
  id: '',
  name: '',
  created_at: '',
  status: 'shadow',
  team: '',
  venue: 'any',
  market: 'score',
  score: { for: 1, against: 1 },
  outcome: 'win',
  matchesPlanned: 6,
  stakePerMatch: 20,
  oddsMode: 'market',
  manualOdds: 6.5,
  probMode: 'market',
  customProb: 0.12,
  bankroll: 600,
  positions: [],
  ...defaults,
})

/** 把外部输入收拢成合法 spec：场次夹在 1..20，玩法/模式限定枚举值。 */
export const normalizeSpec = (input = {}) => {
  const base = createEmptySpec(input)
  const market = base.market === 'result' ? 'result' : 'score'
  const scoreFor = clamp(toInt(base.score?.for, 1), 0, 9)
  const scoreAgainst = clamp(toInt(base.score?.against, 1), 0, 9)
  return {
    ...base,
    name: String(base.name || '').trim(),
    team: String(base.team || '').trim(),
    venue: ['home', 'away'].includes(base.venue) ? base.venue : 'any',
    market,
    score: market === 'score' ? { for: scoreFor, against: scoreAgainst } : null,
    outcome: market === 'result' && ['win', 'draw', 'lose'].includes(base.outcome) ? base.outcome : market === 'result' ? 'win' : null,
    matchesPlanned: clamp(toInt(base.matchesPlanned, 6), 1, 20),
    stakePerMatch: Math.max(0, toNumber(base.stakePerMatch, 20)),
    oddsMode: base.oddsMode === 'manual' ? 'manual' : 'market',
    manualOdds: Math.max(1.01, toNumber(base.manualOdds, 6.5)),
    probMode: ['market', 'base', 'custom', 'ratings'].includes(base.probMode) ? base.probMode : 'market',
    customProb: clamp(toNumber(base.customProb, 0.12), 0, 1),
    bankroll: Math.max(0, toNumber(base.bankroll, 600)),
    status: ['shadow', 'live', 'retired'].includes(base.status) ? base.status : 'shadow',
    positions: Array.isArray(base.positions) ? base.positions : [],
  }
}

// ── 球队匹配 ───────────────────────────────────────────────────────────

/**
 * spec.team → 别名集合（小写）。别名库里查得到就用整条目，查不到就用原文。
 * 库内条目只保留能通过严格解析的别名：'paris' / 'madrid' / 'fra' / 'afc'
 * 这类城市名或通用缩写会在 contains 匹配时把同城/无关球队卷进来
 * （Paris FC→PSG、Rayo→Real Madrid、France→Frankfurt、Bournemouth→Arsenal）。
 */
export const aliasesForTeam = (team) => {
  const needle = String(team || '').trim().toLowerCase()
  if (!needle) return []
  const entry = TEAM_ALIAS_LIBRARY.find(
    (item) =>
      item.teamName.toLowerCase() === needle ||
      (item.abbreviations || []).some((alias) => String(alias).toLowerCase() === needle),
  )
  const pool = entry ? [entry.teamName, ...(entry.abbreviations || [])] : [team]
  return [
    ...new Set(
      pool
        .map((alias) => String(alias || '').trim().toLowerCase())
        .filter(Boolean)
        .filter((alias) => !entry || resolveTeamIdentity(alias) !== null),
    ),
  ]
}

/** 判断某场在售赛事是否涉及该队；返回 'home' | 'away' | null。 */
export const matchVenueForTeam = (match, aliases) => {
  if (!Array.isArray(aliases) || aliases.length === 0) return null
  const home = String(match?.home || '').toLowerCase()
  const away = String(match?.away || '').toLowerCase()
  const hits = (side) => aliases.some((alias) => side.includes(alias))
  if (hits(home)) return 'home'
  if (hits(away)) return 'away'
  return null
}

/**
 * 场地口径的过滤值：只有指定球队时才生效；全联赛口径（team 为空）忽略 venue，
 * 否则"不限主客"的联赛样本会被悄悄砍掉一半。
 */
const venueFilterFor = (spec) => (String(spec?.team || '').trim() && spec?.venue !== 'any' ? spec.venue : null)

// ── 单场概率三视角 ─────────────────────────────────────────────────────

/** 把"本队进 for、对手丢 against"换算成该场的 (主, 客) 比分坐标。 */
const scoreCellForVenue = (spec, venue) =>
  venue === 'home'
    ? { home: spec.score.for, away: spec.score.against }
    : { home: spec.score.against, away: spec.score.for }

/** 从一份比分分布读出该腿的结果/比分概率（venue 是本队视角）。 */
const probabilityFromCells = (cells, spec, venue) => {
  if (spec.market === 'score') {
    const target = scoreCellForVenue(spec, venue)
    const cell = cells.find((row) => row.home === target.home && row.away === target.away)
    return cell ? cell.p : Number.NaN
  }
  const outcome = spec.outcome || 'win'
  return cells.reduce((sum, cell) => {
    const teamWon = venue === 'home' ? cell.home > cell.away : cell.away > cell.home
    const teamLost = venue === 'home' ? cell.home < cell.away : cell.away < cell.home
    const drawn = cell.home === cell.away
    if (outcome === 'win' && teamWon) return sum + cell.p
    if (outcome === 'draw' && drawn) return sum + cell.p
    if (outcome === 'lose' && teamLost) return sum + cell.p
    return sum
  }, 0)
}

/** 泊松反推：机构 1X2（+让球）赔率倒推进球分布后的概率。拟合不出来 → NaN。 */
const poissonProbability = (match, spec, venue) => {
  const fitInput = marketOddsForFit(match)
  if (!fitInput) return Number.NaN
  const fit = fitMarketLambdas(fitInput)
  if (!fit?.ready) return Number.NaN
  const cells = deriveScoreDistribution(fit.homeLambda, fit.awayLambda)
  return probabilityFromCells(cells, spec, venue)
}

/** 去水概率：比分走比分盘去水，胜平负走 1X2 去水。 */
const devigProbability = (match, spec, venue) => {
  if (spec.market === 'score') {
    const market = marketScorelineProbabilities(match)
    if (!market?.ok) return Number.NaN
    const target = scoreCellForVenue(spec, venue)
    const cell = market.cells.find((row) => row.home === target.home && row.away === target.away)
    return cell ? cell.probability : Number.NaN
  }
  const had = match?.had
  const devig = deVigProportional([had?.home, had?.draw, had?.away])
  if (!devig.ok) return Number.NaN
  const outcome = spec.outcome || 'win'
  if (outcome === 'draw') return devig.fair[1]
  if (venue === 'home') return outcome === 'win' ? devig.fair[0] : devig.fair[2]
  return outcome === 'win' ? devig.fair[2] : devig.fair[0]
}

/** 自建评级：双方 teamKey 都能落到 Elo 表时才启用，否则明确不可用。 */
const ratingsProbability = (match, spec, venue, ratings) => {
  if (!ratings) return Number.NaN
  const teamKeyHome = teamKeyForName(match?.home)
  const teamKeyAway = teamKeyForName(match?.away)
  if (!teamKeyHome || !teamKeyAway) return Number.NaN
  const distribution = probabilityFromRatings({ teamKeyHome, teamKeyAway }, ratings)
  if (!distribution.ready) return Number.NaN
  return probabilityFromCells(distribution.cells, spec, venue)
}

/**
 * 联赛基准：DEFAULT_LAMBDA_PRIOR 先验分布，主客场两个视角各读一遍取均值
 * （venue-agnostic——例如平局比分 x-x 两个方向对称，均值即自身）。
 */
export const baseProbability = (spec) => {
  const cells = deriveScoreDistribution(DEFAULT_LAMBDA_PRIOR.home, DEFAULT_LAMBDA_PRIOR.away)
  const asHome = probabilityFromCells(cells, spec, 'home')
  const asAway = probabilityFromCells(cells, spec, 'away')
  return (asHome + asAway) / 2
}

/** 机构给这条腿挂的实价（比分盘单格 / 1X2 单格）。 */
const marketQuoteForLeg = (match, spec, venue) => {
  if (spec.market === 'score') {
    const target = scoreCellForVenue(spec, venue)
    const cell = (Array.isArray(match?.scores) ? match.scores : []).find(
      (row) => row.home === target.home && row.away === target.away,
    )
    return toNumber(cell?.odds)
  }
  const had = match?.had
  if (!had) return Number.NaN
  const outcome = spec.outcome || 'win'
  if (outcome === 'draw') return toNumber(had.draw)
  if (venue === 'home') return outcome === 'win' ? toNumber(had.home) : toNumber(had.away)
  return outcome === 'win' ? toNumber(had.away) : toNumber(had.home)
}

/** probMode 口径下这条腿采用的 p。 */
const pickLegProbability = (spec, views) => {
  if (spec.probMode === 'custom') return spec.customProb
  if (spec.probMode === 'base') return views.pBase
  if (spec.probMode === 'ratings') return views.pRatings
  // market：优先泊松反推，拟合不出来退到直接去水
  return Number.isFinite(views.pPoisson) ? views.pPoisson : views.pDevig
}

const RATINGS_UNAVAILABLE_MESSAGE = '评级概率不可用：缺少双方球队的有效评级，当前策略不能按评级口径推演或生成新头寸。'

/** 试算与头寸使用同一概率选择器；快照记录实际来源，不把回退伪装成指定模型。 */
const forecastForMatch = (spec, match, venue, context = {}) => {
  const views = {
    pPoisson: poissonProbability(match, spec, venue),
    pDevig: devigProbability(match, spec, venue),
    pBase: baseProbability(spec),
    pRatings: ratingsProbability(match, spec, venue, context.ratings),
  }
  const raw = pickLegProbability(spec, views)
  const unavailable = spec.probMode === 'ratings' && !Number.isFinite(raw)
  const probability = unavailable ? null : finiteOr(raw, views.pBase)
  const source = unavailable
    ? null
    : spec.probMode === 'market'
      ? Number.isFinite(views.pPoisson) ? 'market_poisson' : Number.isFinite(views.pDevig) ? 'market_devig' : 'base'
      : spec.probMode
  const generatedAt = new Date(context.now ?? Date.now()).toISOString()
  return {
    views,
    forecastSnapshot: {
      schemaVersion: 1,
      requestedMode: spec.probMode,
      source,
      probability,
      generatedAt,
      available: !unavailable,
      reason: unavailable ? 'ratings_unavailable' : source === 'base' && spec.probMode !== 'base' ? 'market_probability_unavailable' : null,
    },
  }
}

// ── 腿构建 ────────────────────────────────────────────────────────────

export const DEGRADED_WARNING =
  '未在市场赔率中找到该队的在售赛事，已降级为手动赔率与联赛基准概率——当前读数只是占位口径，不代表市场定价。'

/**
 * 把 spec 解析成 matchesPlanned 条腿。
 * marketMatches 为 marketOdds.fetchOfficialMarketOdds() 的 matches 数组；
 * 在售场次不够时用"未来第 N 场 · 估计"（真实腿的均值）补齐。
 */
export const buildLegs = (specInput, marketMatches = [], context = {}) => {
  const spec = normalizeSpec(specInput)
  const matches = Array.isArray(marketMatches) ? marketMatches : []
  const aliases = aliasesForTeam(spec.team)
  const planned = spec.matchesPlanned
  const venueFilter = venueFilterFor(spec)

  // 未指定球队 = 全联赛口径：所有在售场次都参与；
  // 指定球队 + 场地口径时，只保留该队在该侧的比赛（主客胜平负与比分格仍按该侧解读）。
  const matched = matches
    .map((match) => ({ match, venue: aliases.length ? matchVenueForTeam(match, aliases) : 'home' }))
    .filter((entry) => entry.venue !== null && (!venueFilter || entry.venue === venueFilter))
    .slice(0, planned)

  const legs = matched.map(({ match, venue }, index) => {
    const { views, forecastSnapshot } = forecastForMatch(spec, match, venue, context)
    const oddsRaw = spec.oddsMode === 'manual' ? spec.manualOdds : marketQuoteForLeg(match, spec, venue)
    const opponent = venue === 'home' ? match.away : match.home
    return {
      index,
      label: `${match.home} vs ${match.away}`,
      opponent: opponent || '',
      kickoff: match.kickoff || '',
      league: match.league || '',
      matchKey: marketMatchKey(match),
      outcomeKey: outcomeKeyFor(spec, venue),
      venue,
      p: forecastSnapshot.probability,
      forecastSnapshot,
      odds: finiteOr(oddsRaw, spec.manualOdds),
      estimated: false,
      pPoisson: views.pPoisson,
      pDevig: views.pDevig,
      pBase: views.pBase,
      pRatings: views.pRatings,
      overround: Number.NaN,
      oddsFallback: !Number.isFinite(oddsRaw),
    }
  })

  // 逐腿记录市场抽水率（比分盘去水口径 / 1X2 去水口径）
  legs.forEach((leg, i) => {
    const match = matched[i]?.match
    if (!match) return
    if (spec.market === 'score') {
      leg.overround = toNumber(marketScorelineProbabilities(match)?.overround)
    } else {
      const had = match.had || {}
      leg.overround = toNumber(deVigProportional([had.home, had.draw, had.away]).overround)
    }
  })

  let degraded = false
  let warning = ''
  if (legs.length < planned) {
    const missing = planned - legs.length
    if (legs.length === 0 && spec.oddsMode === 'market') {
      degraded = true
      warning = DEGRADED_WARNING
    } else if (legs.length === 0 && spec.probMode === 'market') {
      degraded = true
      warning = DEGRADED_WARNING
    }
    const fillP = finiteOr(
      meanOf(legs.map((leg) => leg.p)),
      spec.probMode === 'ratings' ? null : spec.probMode === 'custom' ? spec.customProb : baseProbability(spec),
    )
    const fillOdds = finiteOr(meanOf(legs.map((leg) => leg.odds)), spec.manualOdds)
    const fillViews = {
      pPoisson: meanOf(legs.map((leg) => leg.pPoisson)),
      pDevig: meanOf(legs.map((leg) => leg.pDevig)),
      pBase: baseProbability(spec),
      pRatings: meanOf(legs.map((leg) => leg.pRatings)),
    }
    for (let i = 0; i < missing; i += 1) {
      const index = legs.length
      legs.push({
        index,
        label: `未来第 ${index + 1} 场 · 估计`,
        opponent: '',
        kickoff: '',
        league: '',
        venue: null,
        p: fillP,
        odds: fillOdds,
        estimated: true,
        pPoisson: fillViews.pPoisson,
        pDevig: fillViews.pDevig,
        pBase: fillViews.pBase,
        pRatings: fillViews.pRatings,
        overround: Number.NaN,
        oddsFallback: false,
      })
    }
  }

  const available = legs.every((leg) => Number.isFinite(leg.p))
  if (!available) {
    degraded = true
    warning = RATINGS_UNAVAILABLE_MESSAGE
  }
  return { legs, degraded, warning, available, reason: available ? null : 'ratings_unavailable' }
}

// ── 随机数与分布工具 ───────────────────────────────────────────────────

const mulberry32 = (seed) => {
  let a = Number(seed) >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const lnFactorial = (n) => {
  let sum = 0
  for (let i = 2; i <= n; i += 1) sum += Math.log(i)
  return sum
}

/** log-space 二项 pmf：P(K = k)，K ~ Binomial(n, p)。 */
export const binomialPmf = (k, n, p) => {
  const count = Math.round(Number(k))
  const trials = Math.round(Number(n))
  const prob = Number(p)
  if (!Number.isFinite(prob) || trials < 0 || count < 0 || count > trials) return 0
  if (prob <= 0) return count === 0 ? 1 : 0
  if (prob >= 1) return count === trials ? 1 : 0
  const logC = lnFactorial(trials) - lnFactorial(count) - lnFactorial(trials - count)
  return Math.exp(logC + count * Math.log(prob) + (trials - count) * Math.log(1 - prob))
}

const percentileOf = (sorted, p) => {
  if (sorted.length === 0) return Number.NaN
  const rank = (p / 100) * (sorted.length - 1)
  const low = Math.floor(rank)
  const high = Math.ceil(rank)
  if (low === high) return sorted[low]
  return sorted[low] + (sorted[high] - sorted[low]) * (rank - low)
}

const buildHistogram = (values, binCount = 24) => {
  if (!values.length) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (min === max) return [{ x0: min, x1: max, count: values.length }]
  const width = (max - min) / binCount
  const bins = Array.from({ length: binCount }, (_, i) => ({ x0: min + i * width, x1: min + (i + 1) * width, count: 0 }))
  values.forEach((value) => {
    const index = Math.min(binCount - 1, Math.floor((value - min) / width))
    bins[index].count += 1
  })
  return bins
}

// ── 推演 ──────────────────────────────────────────────────────────────

const MC_ITERATIONS = 20000
const MC_SEED = 20260930
const HISTOGRAM_BINS = 24

const runMonteCarlo = (legs, stakePerMatch) => {
  const rng = mulberry32(MC_SEED)
  const profits = []
  let ruinCount = 0
  let profitCount = 0
  let ddSum = 0
  for (let iter = 0; iter < MC_ITERATIONS; iter += 1) {
    let profit = 0
    let peak = 0
    let maxDD = 0
    let hits = 0
    legs.forEach((leg) => {
      const won = rng() < leg.p
      if (won) hits += 1
      profit += won ? stakePerMatch * (leg.odds - 1) : -stakePerMatch
      if (profit > peak) peak = profit
      const dd = peak - profit
      if (dd > maxDD) maxDD = dd
    })
    profits.push(profit)
    if (hits === 0) ruinCount += 1
    if (profit > 0) profitCount += 1
    ddSum += maxDD
  }
  const sorted = [...profits].sort((a, b) => a - b)
  const meanProfit = profits.reduce((sum, value) => sum + value, 0) / MC_ITERATIONS
  const totalStake = stakePerMatch * legs.length
  return {
    iterations: MC_ITERATIONS,
    seed: MC_SEED,
    meanProfit,
    expectedRoiPct: totalStake > 0 ? (meanProfit / totalStake) * 100 : 0,
    medianProfit: percentileOf(sorted, 50),
    p5: percentileOf(sorted, 5),
    p95: percentileOf(sorted, 95),
    pProfit: profitCount / MC_ITERATIONS,
    pRuin: ruinCount / MC_ITERATIONS,
    expectedMaxDD: ddSum / MC_ITERATIONS,
    worst: sorted[0],
    best: sorted[sorted.length - 1],
    histogram: buildHistogram(profits, HISTOGRAM_BINS),
  }
}

/** 所有腿 p、odds 完全一致时走二项闭式解，与蒙特卡洛互为校验。 */
const runExact = (legs, stakePerMatch) => {
  const first = legs[0]
  const uniform = legs.every(
    (leg) => Math.abs(leg.p - first.p) < 1e-12 && Math.abs(leg.odds - first.odds) < 1e-12,
  )
  if (!uniform || legs.length === 0) return null
  const n = legs.length
  const { p, odds } = first
  const hits = Array.from({ length: n + 1 }, (_, k) => ({ k, p: binomialPmf(k, n, p) }))
  const profitOf = (k) => stakePerMatch * (k * odds - n)
  const cdf = []
  let cumulative = 0
  hits.forEach((row) => {
    cumulative += row.p
    cdf.push({ k: row.k, cumulative })
  })
  const quantileHits = (q) => cdf.find((row) => row.cumulative >= q)?.k ?? n
  const meanHits = n * p
  return {
    hits,
    meanProfit: stakePerMatch * (meanHits * odds - n),
    pProfit: hits.reduce((sum, row) => sum + (profitOf(row.k) > 0 ? row.p : 0), 0),
    pRuin: hits[0]?.p ?? 0,
    median: profitOf(quantileHits(0.5)),
    p5: profitOf(quantileHits(0.05)),
    p95: profitOf(quantileHits(0.95)),
  }
}

// ── 判定文案 ───────────────────────────────────────────────────────────

const fmtPct = (value, digits = 1) => (Number.isFinite(value) ? `${(value * 100).toFixed(digits)}%` : '—')
const fmtYuan = (value, digits = 1) => (Number.isFinite(value) ? `¥${value.toFixed(digits)}` : '—')

const buildVerdict = ({ avgEvPct, avgEdgeVsFair, monteCarlo, overround, significance }) => {
  const hasFair = Number.isFinite(avgEdgeVsFair)
  const pProfit = monteCarlo.pProfit
  let tone = 'neutral'
  let headline = '边际不清 — 先观察，不加注'
  if (hasFair && avgEdgeVsFair > 0.03 && pProfit > 0.6) {
    tone = 'positive'
    headline = '正期望候选 — 先入影子盘验证'
  } else if (avgEvPct < -0.02 || (hasFair && avgEdgeVsFair < -0.03)) {
    tone = 'negative'
    headline = '负期望陷阱 — 抽水在吃你的本金'
  }

  const lines = [
    `每场期望 ROI ${fmtPct(avgEvPct)}：每投 ¥100 期望拿回 ${fmtYuan(100 * (1 + avgEvPct))}`,
    `${monteCarlo.iterations / 10000} 万次推演：盈利概率 ${fmtPct(pProfit)}，全亏概率 ${fmtPct(monteCarlo.pRuin)}`,
  ]
  if (Number.isFinite(overround)) {
    lines.push(`市场抽水率约 ${fmtPct(overround)}——永远看去水后的边际，不看牌面赔率`)
  }
  if (significance.nNeeded === Infinity) {
    lines.push('估计命中率与盈亏平衡线几乎重合，多少样本都分不出胜负——这本身就是结论')
  } else {
    lines.push(`要在统计上确认这个边际，约需 ${significance.nNeeded} 场样本（95% 置信）`)
  }
  return { tone, headline, lines }
}

// ── 主入口 ────────────────────────────────────────────────────────────

/**
 * 完整推演一个策略。options.kellyDivisor 由调用方从系统配置读入（保持本模块纯函数）。
 * 返回 { legs, degraded, warning, totalStake, perBet, exact, monteCarlo, kelly,
 *        significance, probViews, verdict }。
 */
export const analyzeStrategy = (specInput, marketMatches = [], context = {}) => {
  const spec = normalizeSpec(specInput)
  const kellyDivisor = Math.max(1, toNumber(context.kellyDivisor, 4))
  const { legs, degraded, warning, available, reason } = buildLegs(spec, marketMatches, context)
  const stake = spec.stakePerMatch
  const totalStake = stake * legs.length
  if (!available) {
    return {
      available: false,
      reason,
      message: warning,
      spec,
      legs,
      degraded,
      warning,
      totalStake,
      perBet: { evPct: null, breakevenP: null, edgePP: null, edgeVsFairPP: null, avgP: null, avgOdds: null },
      exact: null,
      monteCarlo: {
        iterations: 0, meanProfit: null, expectedRoiPct: null, medianProfit: null,
        p5: null, p95: null, pProfit: null, pRuin: null, expectedMaxDD: null,
        worst: null, best: null, histogram: [],
      },
      kelly: { fraction: null, divisor: kellyDivisor, bankroll: spec.bankroll, suggestedStake: null, stakePerMatch: stake },
      significance: { delta: null, nNeeded: null },
      probViews: { devig: null, poisson: null, base: null, ratings: null },
      overround: null,
      verdict: { tone: 'neutral', headline: '评级概率不可用', lines: [warning] },
    }
  }

  const perBet = {
    evPct: meanOf(legs.map((leg) => leg.p * leg.odds - 1)),
    breakevenP: meanOf(legs.map((leg) => 1 / leg.odds)),
    edgePP: meanOf(legs.map((leg) => leg.p - 1 / leg.odds)),
    edgeVsFairPP: meanOf(legs.map((leg) => (Number.isFinite(leg.pDevig) ? leg.p - leg.pDevig : Number.NaN))),
    avgP: meanOf(legs.map((leg) => leg.p)),
    avgOdds: meanOf(legs.map((leg) => leg.odds)),
  }

  const exact = runExact(legs, stake)
  const monteCarlo = runMonteCarlo(legs, stake)

  const b = Math.max(1e-9, perBet.avgOdds - 1)
  const kellyFraction = Math.max(0, (perBet.avgP * perBet.avgOdds - 1) / b)
  const kelly = {
    fraction: kellyFraction,
    divisor: kellyDivisor,
    bankroll: spec.bankroll,
    suggestedStake: (spec.bankroll * kellyFraction) / kellyDivisor,
    stakePerMatch: stake,
  }

  const delta = Math.abs(perBet.avgP - perBet.breakevenP)
  const significance = {
    delta,
    nNeeded:
      delta < 1e-9
        ? Infinity
        : Math.ceil(((1.96 ** 2) * perBet.avgP * (1 - perBet.avgP)) / (delta ** 2)),
  }

  const probViews = {
    devig: meanOf(legs.map((leg) => leg.pDevig)),
    poisson: meanOf(legs.map((leg) => leg.pPoisson)),
    base: meanOf(legs.map((leg) => leg.pBase)),
    ratings: meanOf(legs.map((leg) => leg.pRatings)),
  }

  const overround = meanOf(legs.map((leg) => leg.overround))

  const verdict = buildVerdict({
    avgEvPct: perBet.evPct,
    avgEdgeVsFair: perBet.edgeVsFairPP,
    monteCarlo,
    overround,
    significance,
  })

  return {
    available: true,
    reason: null,
    spec,
    legs,
    degraded,
    warning,
    totalStake,
    perBet,
    exact,
    monteCarlo,
    kelly,
    significance,
    probViews,
    overround,
    verdict,
  }
}

// ── 策略架存储（localStorage，原型阶段不进 git-sync bundle）────────────

const readJSON = (key, fallback) => {
  if (!isBrowser) return fallback
  if (isPreviewMode()) return previewRead(key, fallback)
  try {
    const raw = brandLocalStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const writeJSON = (key, value) => {
  if (!isBrowser) return
  if (isPreviewMode()) {
    previewWrite(key, value)
    window.dispatchEvent(new CustomEvent('eivra:data-changed', { detail: { key, preview: true } }))
    return
  }
  brandLocalStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent('eivra:data-changed', { detail: { key } }))
}

export const getStrategies = () => {
  const list = readJSON(STRATEGIES_KEY, [])
  return Array.isArray(list) ? list : []
}

export const saveStrategy = (specInput) => {
  const spec = normalizeSpec(specInput)
  const saved = {
    ...spec,
    id: spec.id || `stg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    created_at: spec.created_at || new Date().toISOString(),
  }
  const list = getStrategies()
  list.push(saved)
  writeJSON(STRATEGIES_KEY, list)
  return saved
}

export const updateStrategy = (id, patch = {}) => {
  const list = getStrategies()
  const index = list.findIndex((item) => item.id === id)
  if (index === -1) return null
  const next = { ...list[index], ...patch, id }
  list[index] = next
  writeJSON(STRATEGIES_KEY, list)
  return next
}

export const deleteStrategy = (id) => {
  const list = getStrategies()
  const next = list.filter((item) => item.id !== id)
  if (next.length === list.length) return false
  writeJSON(STRATEGIES_KEY, next)
  return true
}

// ── 虚拟仓位台账（positions）：同步赛程 → 追收盘价 → 自动结算 ──────────
//
// 策略对象在 spec 之外多了一个 positions 数组：每条 position 是一场
// "虚拟下单"，记录入场赔率（entryOdds）、最近一次看到的市场价
// （lastSeenOdds，用作收盘价的近似）、命中状态与盈亏。
// 三个动作都是纯函数：传入 strategy + 外部数据，返回更新后的 strategy；
// 是否写回存储由调用方决定（UI 走 updateStrategy）。

const normName = (value) => String(value ?? '').trim().toLowerCase()

/** 仓位/场次的去重键：有 matchId 用 matchId，否则 home|away|kickoff。 */
const positionKeyFor = (match) =>
  match?.matchId
    ? `id:${match.matchId}`
    : `${normName(match?.home)}|${normName(match?.away)}|${String(match?.kickoff || '').trim()}`

/** 策略在一场比赛上对应的真实市场格子：HAD 或 CRS。 */
const outcomeKeyFor = (spec, venue) => {
  if (spec.market === 'score') {
    const target = scoreCellForVenue(spec, venue)
    return `crs:${target.home}-${target.away}`
  }
  const outcome = spec.outcome || 'win'
  if (outcome === 'draw') return 'had:draw'
  if (venue === 'away') return outcome === 'win' ? 'had:away' : 'had:home'
  return outcome === 'win' ? 'had:home' : 'had:away'
}

const positionOutcomeKey = (strategy, position) =>
  position?.outcomeKey || outcomeKeyFor(normalizeSpec(strategy), position?.venue || 'home')

const positionMatchKey = (position) =>
  position?.matchKey || marketMatchKey(position) || `position:${position?.id || 'unknown'}`

/** 单场仓位定价：复用腿构建的同一套三视角概率与市场报价逻辑。 */
const buildPositionForMatch = (spec, match, venue, context = {}) => {
  const { forecastSnapshot } = forecastForMatch(spec, match, venue, context)
  if (!forecastSnapshot.available) return null
  const oddsRaw = spec.oddsMode === 'manual' ? spec.manualOdds : marketQuoteForLeg(match, spec, venue)
  const homeIdentity = resolveTeamIdentity(match.home)
  const awayIdentity = resolveTeamIdentity(match.away)
  return {
    id: `pos_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    matchId: match.matchId || '',
    matchKey: marketMatchKey(match),
    outcomeKey: outcomeKeyFor(spec, venue),
    kickoff: match.kickoff || '',
    home: match.home || '',
    away: match.away || '',
    teamIdHome: homeIdentity?.teamId || null,
    teamIdAway: awayIdentity?.teamId || null,
    venue,
    entryOdds: finiteOr(oddsRaw, spec.manualOdds),
    p: forecastSnapshot.probability,
    forecastSnapshot,
    stake: spec.stakePerMatch,
    status: 'pending',
    lastSeenOdds: finiteOr(oddsRaw, spec.manualOdds),
  }
}

/**
 * 把 marketMatches 里该队的在售赛程追加成 pending 仓位。
 * 已在台账里的场次（matchId 或 home|away|kickoff 命中）不重复添加；
 * 总仓位封顶 matchesPlanned。retired 策略原样返回。
 */
export const syncStrategyFixtures = (strategyInput, marketMatches = [], context = {}) => {
  const spec = normalizeSpec(strategyInput)
  const positions = [...spec.positions]
  if (spec.status === 'retired') return { ...spec, positions }

  const matches = Array.isArray(marketMatches) ? marketMatches : []
  const aliases = aliasesForTeam(spec.team)
  const venueFilter = venueFilterFor(spec)
  const known = new Set(positions.map((position) => positionKeyFor(position)))
  let remaining = Math.max(0, spec.matchesPlanned - positions.length)
  if (remaining === 0) return { ...spec, positions }
  let skippedCount = 0

  for (const match of matches) {
    if (remaining <= 0) break
    const venue = aliases.length ? matchVenueForTeam(match, aliases) : 'home'
    if (!venue || (venueFilter && venue !== venueFilter)) continue
    const key = positionKeyFor(match)
    if (known.has(key)) continue
    const position = buildPositionForMatch(spec, match, venue, context)
    if (!position) {
      skippedCount += 1
      continue
    }
    known.add(key)
    positions.push(position)
    remaining -= 1
  }
  return {
    ...spec,
    positions,
    syncStatus: {
      available: skippedCount === 0,
      reason: skippedCount > 0 ? 'ratings_unavailable' : null,
      message: skippedCount > 0 ? RATINGS_UNAVAILABLE_MESSAGE : '',
      skippedCount,
    },
  }
}

/**
 * 收盘价近似：对仍在售的 pending 仓位，把 lastSeenOdds 刷成当前市场价
 * （同一比分格 / 同一 1X2 结果格）。已结算仓位与找不到行情的仓位不动。
 */
export const refreshClosingOdds = (strategyInput, marketMatches = []) => {
  const spec = normalizeSpec(strategyInput)
  const matches = Array.isArray(marketMatches) ? marketMatches : []
  const positions = spec.positions.map((position) => {
    if (position?.status !== 'pending') return position
    const match = matches.find((item) => positionKeyFor(item) === positionKeyFor(position))
    if (!match) return position
    const quote = marketQuoteForLeg(match, spec, position.venue || 'home')
    if (!Number.isFinite(quote) || quote <= 1) return position
    return { ...position, lastSeenOdds: quote }
  })
  return { ...spec, positions }
}

const resultRowsOf = (resultsIndex) =>
  Array.isArray(resultsIndex) ? resultsIndex : (Array.isArray(resultsIndex?.matches) ? resultsIndex.matches : [])

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * 仓位与赛果行是否同一场：优先 teamId 双中；任一侧缺 teamId 时退化为
 * 严格队名身份比对（中文名与英文全名都会收敛到同一 teamKey，如
 * 切尔西 / Chelsea FC → chelsea），绝不使用 contains。日期容差 ±1 天。
 */
const positionMatchesResult = (position, row) => {
  const idMatch =
    position.teamIdHome && position.teamIdAway && row.teamIdHome && row.teamIdAway
      ? position.teamIdHome === row.teamIdHome && position.teamIdAway === row.teamIdAway
      : null
  // 双方都有 teamId 时以 teamId 为准（含"确定不是同一场"的否决权）；
  // 任一侧缺 teamId 时用 teamKeyForName 严格解析双方队名后比对。
  if (idMatch === false) return false
  if (idMatch === null) {
    const homeA = teamKeyForName(position.home)
    const awayA = teamKeyForName(position.away)
    const homeB = teamKeyForName(row.home)
    const awayB = teamKeyForName(row.away)
    if (!homeA || !awayA || !homeB || !awayB) return false
    if (homeA !== homeB || awayA !== awayB) return false
  }

  const positionDate = normalizeMatchDate(position.kickoff)
  if (!positionDate || !row.date) return true // 任一侧缺日期时只靠队名/teamId 对齐
  return Math.abs(new Date(positionDate).getTime() - new Date(row.date).getTime()) <= DAY_MS
}

/** 该仓位在最终比分 row 下是否命中（venue 是本队视角：for=本队进球）。 */
const positionHitsResult = (spec, venue, row) => {
  const side = venue === 'away' ? 'away' : 'home'
  const teamGoals = side === 'away' ? row.awayGoals : row.homeGoals
  const oppGoals = side === 'away' ? row.homeGoals : row.awayGoals
  if (spec.market === 'score') {
    return teamGoals === spec.score.for && oppGoals === spec.score.against
  }
  const outcome = spec.outcome || 'win'
  if (outcome === 'draw') return teamGoals === oppGoals
  if (outcome === 'win') return teamGoals > oppGoals
  return teamGoals < oppGoals
}

/**
 * 用赛果索引自动结算 pending 仓位。命中判定：
 * 比分盘——最终比分等于 spec.score 的 venue 映射格；
 * 胜平负盘——由最终比分推出该队视角的胜/平/负。
 * 结算写入 status/profit/clv/settledAt/finalScore/resultDate；
 * clv = entryOdds/lastSeenOdds − 1（正 = 跑赢收盘）。已结算仓位绝不动第二次。
 */
export const settleStrategyPositions = (strategyInput, resultsIndex) => {
  const spec = normalizeSpec(strategyInput)
  const rows = resultRowsOf(resultsIndex)
  const positions = spec.positions.map((position) => {
    if (position?.status !== 'pending') return position
    const row = rows.find((candidate) => positionMatchesResult(position, candidate))
    if (!row) return position
    const hit = positionHitsResult(spec, position.venue, row)
    const stake = Number.isFinite(Number(position.stake)) ? Number(position.stake) : spec.stakePerMatch
    const entryOdds = Number.isFinite(Number(position.entryOdds)) ? Number(position.entryOdds) : spec.manualOdds
    const lastSeen = Number(position.lastSeenOdds)
    return {
      ...position,
      status: hit ? 'hit' : 'miss',
      profit: hit ? stake * (entryOdds - 1) : -stake,
      clv: Number.isFinite(lastSeen) && lastSeen > 1 ? entryOdds / lastSeen - 1 : null,
      settledAt: new Date().toISOString(),
      finalScore: `${row.homeGoals}-${row.awayGoals}`,
      resultDate: row.date || null,
    }
  })
  return { ...spec, positions }
}

// ── 统计读数 ──────────────────────────────────────────────────────────

/** Wilson score 区间（二项比例的置信区间，小样本不炸）。n=0 返回全区间。 */
export const wilsonInterval = (hitsInput, nInput, z = 1.96) => {
  const n = Math.max(0, Math.round(Number(nInput) || 0))
  const hits = clamp(Math.round(Number(hitsInput) || 0), 0, n)
  if (n === 0) return { low: 0, high: 1 }
  const p = hits / n
  const z2 = z * z
  const denominator = 1 + z2 / n
  const center = (p + z2 / (2 * n)) / denominator
  const margin = (z / denominator) * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))
  return { low: Math.max(0, center - margin), high: Math.min(1, center + margin) }
}

const settledPositionsOf = (strategy) =>
  (Array.isArray(strategy?.positions) ? strategy.positions : []).filter(
    (position) => position?.status === 'hit' || position?.status === 'miss',
  )

const positionProfit = (position) =>
  Number.isFinite(Number(position?.profit))
    ? Number(position.profit)
    : position?.status === 'hit'
      ? Number(position.stake || 0) * (Number(position.entryOdds || 1) - 1)
      : -Number(position.stake || 0)

const positionTime = (position) => {
  const time = new Date(position?.settledAt || position?.createdAt || 0).getTime()
  return Number.isNaN(time) ? 0 : time
}

/** 按结算时间升序累计盈亏曲线的最大回撤（货币单位，正数）。 */
const maxDrawdownOf = (profits) => {
  let cumulative = 0
  let peak = 0
  let maxDrawdown = 0
  profits.forEach((profit) => {
    cumulative += profit
    if (cumulative > peak) peak = cumulative
    const drawdown = peak - cumulative
    if (drawdown > maxDrawdown) maxDrawdown = drawdown
  })
  return maxDrawdown
}

/** 每笔收益率（profit/stake）的均值 / 样本标准差；n<2 或零方差返回 null。 */
const sharpeOfPositions = (positions) => {
  const returns = positions
    .map((position) => {
      const stake = Number(position?.stake)
      return Number.isFinite(stake) && stake > 0 ? positionProfit(position) / stake : Number.NaN
    })
    .filter(Number.isFinite)
  if (returns.length < 2) return null
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (returns.length - 1)
  const std = Math.sqrt(variance)
  return std > 0 ? mean / std : null
}

const PROMOTION_MIN_SETTLED = 20
const RETIRE_MIN_SETTLED = 10
const RECENT_WINDOW = 5
const DRIFT_ROI_THRESHOLD = -0.3
const DRIFT_HITRATE_DROP = 0.5

/**
 * 一个策略台账的完整读数。
 * 返回 { n, pending, voided, hits, hitRate, hitCI, roi, roiCI, sharpe, maxDrawdown,
 *        avgClv, recent5: { n, roi }, drift, suggestRetire, promotable, gateChecks,
 *        avgEntryOdds, breakevenP }。void 不计入 n/hits/roi，只单列 voided。
 * promotable 三道转正闸门：① 已结算 ≥ 20 场；② 命中率 Wilson 下界仍高于
 * 平均入场赔率隐含的盈亏平衡概率；③ 平均 CLV > 0（持续跑赢收盘）。
 * suggestRetire：n ≥ 10 且 Wilson 上界已低于盈亏平衡——统计上救不回来了。
 * drift：最近 5 场 ROI < −30%，或命中率相对整体腰斩以上。
 */
export const strategyStats = (strategy) => {
  const positions = Array.isArray(strategy?.positions) ? strategy.positions : []
  const settled = settledPositionsOf(strategy)
    .slice()
    .sort((a, b) => positionTime(a) - positionTime(b))
  const pending = positions.filter((position) => position?.status === 'pending').length
  const voided = positions.filter((position) => position?.status === 'void').length

  const n = settled.length
  const hits = settled.filter((position) => position.status === 'hit').length
  const hitRate = n > 0 ? hits / n : null
  const hitCI = wilsonInterval(hits, n)

  const totalStaked = settled.reduce((sum, position) => sum + (Number.isFinite(Number(position.stake)) ? Number(position.stake) : 0), 0)
  const totalProfit = settled.reduce((sum, position) => sum + positionProfit(position), 0)
  const roi = totalStaked > 0 ? totalProfit / totalStaked : null

  const entryOddsList = settled.map((position) => Number(position.entryOdds)).filter((value) => Number.isFinite(value) && value > 1)
  const avgEntryOdds = entryOddsList.length > 0 ? entryOddsList.reduce((sum, value) => sum + value, 0) / entryOddsList.length : Number.NaN
  const breakevenP = Number.isFinite(avgEntryOdds) ? 1 / avgEntryOdds : Number.NaN
  const roiCI = n > 0 && Number.isFinite(avgEntryOdds)
    ? { low: hitCI.low * avgEntryOdds - 1, high: hitCI.high * avgEntryOdds - 1 }
    : null

  const clvList = settled.map((position) => numberIfPresent(position.clv)).filter(Number.isFinite)
  const avgClv = clvList.length > 0 ? clvList.reduce((sum, value) => sum + value, 0) / clvList.length : null

  const recent = settled.slice(-RECENT_WINDOW)
  const recentStaked = recent.reduce((sum, position) => sum + Number(position.stake || 0), 0)
  const recentProfit = recent.reduce((sum, position) => sum + positionProfit(position), 0)
  const recent5 = { n: recent.length, roi: recentStaked > 0 ? recentProfit / recentStaked : null }
  const recentHitRate = recent.length > 0 ? recent.filter((position) => position.status === 'hit').length / recent.length : null

  const drift =
    recent5.n >= RECENT_WINDOW &&
    ((recent5.roi !== null && recent5.roi < DRIFT_ROI_THRESHOLD) ||
      (hitRate !== null && recentHitRate !== null && recentHitRate < hitRate * (1 - DRIFT_HITRATE_DROP)))

  const suggestRetire = n >= RETIRE_MIN_SETTLED && Number.isFinite(breakevenP) && hitCI.high < breakevenP

  const gateChecks = [
    {
      id: 'sample_size',
      label: `样本量：已结算 ${n} 场 / 需 ≥ ${PROMOTION_MIN_SETTLED}`,
      pass: n >= PROMOTION_MIN_SETTLED,
      detail: n >= PROMOTION_MIN_SETTLED ? '样本量达标' : `还差 ${PROMOTION_MIN_SETTLED - n} 场`,
    },
    {
      id: 'edge_significance',
      label: '命中率 Wilson 下界 > 盈亏平衡概率',
      pass: n > 0 && Number.isFinite(breakevenP) && hitCI.low > breakevenP,
      detail:
        n > 0 && Number.isFinite(breakevenP)
          ? `下界 ${(hitCI.low * 100).toFixed(1)}% vs 平衡线 ${(breakevenP * 100).toFixed(1)}%（平均赔率 ${avgEntryOdds.toFixed(2)}）`
          : '样本或赔率不足，无法判定',
    },
    {
      id: 'clv_positive',
      label: '平均 CLV > 0（持续跑赢收盘）',
      pass: avgClv !== null && avgClv > 0,
      detail: avgClv !== null ? `平均 CLV ${(avgClv * 100).toFixed(1)}%` : '尚无 CLV 样本',
    },
  ]
  const promotable = gateChecks.every((gate) => gate.pass)

  return {
    n,
    pending,
    voided,
    hits,
    hitRate,
    hitCI,
    roi,
    roiCI,
    avgEntryOdds,
    breakevenP,
    sharpe: sharpeOfPositions(settled),
    maxDrawdown: maxDrawdownOf(settled.map(positionProfit)),
    avgClv,
    recent5,
    drift,
    suggestRetire,
    promotable,
    gateChecks,
  }
}

// ── 回测与策略发现 ────────────────────────────────────────────────────

const BACKTEST_DISCLAIMER = (assumedOdds) =>
  `回测口径声明：历史真实赔率不可考，以下每一场都按假定赔率 ${assumedOdds} 平价结算。` +
  '它回答的是"这个比分/结果在历史上出现了多少次、按这个价结算盈亏如何"，' +
  '不是对历史可获收益的还原；真实入场价请以仓位台账的 entryOdds 为准。'

/**
 * 历史回测：spec.team 为空 = 全部场次；否则只算该队参与的场次。
 * spec.venue 为 home/away 时再按该队的主客侧筛选（team 为空时忽略 venue）。
 * 每场按 assumedOdds（默认 spec.manualOdds，再缺省 6.5）平价结算。
 * 返回 { n, hits, hitRate, hitCI, roi, maxDrawdown, sharpe, equityCurve, assumedOdds, disclaimer }。
 */
export const backtestStrategy = (specInput, resultsIndex, assumedOddsArg) => {
  const spec = normalizeSpec(specInput)
  const rows = resultRowsOf(resultsIndex)
  const aliases = aliasesForTeam(spec.team)
  const venueFilter = venueFilterFor(spec)
  const parsedOdds = Number(assumedOddsArg)
  const assumedOdds = Number.isFinite(parsedOdds) && parsedOdds > 1 ? parsedOdds : spec.manualOdds > 1 ? spec.manualOdds : 6.5

  const played = rows
    .map((row) => ({ row, venue: aliases.length ? matchVenueForTeam(row, aliases) : 'home' }))
    .filter((entry) => entry.venue !== null && (!venueFilter || entry.venue === venueFilter))
    .sort((a, b) => {
      if (!a.row.date && !b.row.date) return 0
      if (!a.row.date) return 1
      if (!b.row.date) return -1
      return a.row.date < b.row.date ? -1 : a.row.date > b.row.date ? 1 : 0
    })

  const stake = spec.stakePerMatch
  let cumulative = 0
  let hits = 0
  const equityCurve = []
  const profitPositions = []
  played.forEach(({ row, venue }, index) => {
    const hit = positionHitsResult(spec, venue, row)
    if (hit) hits += 1
    const profit = hit ? stake * (assumedOdds - 1) : -stake
    cumulative += profit
    equityCurve.push({ i: index + 1, cum: cumulative })
    profitPositions.push({ stake, profit, status: hit ? 'hit' : 'miss' })
  })

  const n = played.length
  const totalStaked = n * stake
  return {
    n,
    hits,
    hitRate: n > 0 ? hits / n : null,
    hitCI: wilsonInterval(hits, n),
    roi: totalStaked > 0 ? cumulative / totalStaked : null,
    maxDrawdown: maxDrawdownOf(profitPositions.map((position) => position.profit)),
    sharpe: sharpeOfPositions(profitPositions),
    equityCurve,
    assumedOdds,
    disclaimer: BACKTEST_DISCLAIMER(assumedOdds),
  }
}

/** 策略发现的默认模板：平局比分 ×3（不分主客）+ 胜/平/负 × 主/客。 */
export const DEFAULT_DISCOVERY_TEMPLATES = Object.freeze([
  { id: 'score_0_0', kind: 'score', score: { for: 0, against: 0 }, venue: 'any', assumedOdds: 11, label: '比分 0-0（不分主客）' },
  { id: 'score_1_1', kind: 'score', score: { for: 1, against: 1 }, venue: 'any', assumedOdds: 6.5, label: '比分 1-1（不分主客）' },
  { id: 'score_2_2', kind: 'score', score: { for: 2, against: 2 }, venue: 'any', assumedOdds: 13, label: '比分 2-2（不分主客）' },
  { id: 'result_win_home', kind: 'result', outcome: 'win', venue: 'home', assumedOdds: 2.2, label: '主场 · 胜' },
  { id: 'result_win_away', kind: 'result', outcome: 'win', venue: 'away', assumedOdds: 2.2, label: '客场 · 胜' },
  { id: 'result_draw_home', kind: 'result', outcome: 'draw', venue: 'home', assumedOdds: 3.4, label: '主场 · 平' },
  { id: 'result_draw_away', kind: 'result', outcome: 'draw', venue: 'away', assumedOdds: 3.4, label: '客场 · 平' },
  { id: 'result_lose_home', kind: 'result', outcome: 'lose', venue: 'home', assumedOdds: 2.9, label: '主场 · 负' },
  { id: 'result_lose_away', kind: 'result', outcome: 'lose', venue: 'away', assumedOdds: 2.9, label: '客场 · 负' },
])

/** 发现行 → 完整 spec：用于载入试算器 / 存为影子盘 / 样本外复核的同一口径。 */
export const specFromDiscoveryRow = (row, templates = DEFAULT_DISCOVERY_TEMPLATES) => {
  const template = (Array.isArray(templates) ? templates : DEFAULT_DISCOVERY_TEMPLATES)
    .find((item) => item.id === row?.templateId)
  if (!template) return normalizeSpec({})
  return normalizeSpec({
    name: `${row.teamName} ${template.label}`,
    team: row.teamName,
    venue: template.venue || 'any',
    market: template.kind === 'result' ? 'result' : 'score',
    ...(template.kind === 'result' ? { outcome: template.outcome } : { score: { ...template.score } }),
    matchesPlanned: 20,
    oddsMode: 'manual',
    manualOdds: row.assumedOdds || template.assumedOdds,
    probMode: 'base',
    status: 'shadow',
  })
}

const templateHitsGame = (template, game) => {
  const teamGoals = game.venue === 'away' ? game.awayGoals : game.homeGoals
  const oppGoals = game.venue === 'away' ? game.homeGoals : game.awayGoals
  if (template.kind === 'score') {
    return teamGoals === template.score.for && oppGoals === template.score.against
  }
  if (template.outcome === 'draw') return teamGoals === oppGoals
  if (template.outcome === 'win') return teamGoals > oppGoals
  return teamGoals < oppGoals
}

/** P(X ≥ hits)，X ~ Binomial(n, 1/assumedOdds)——"这个命中率超出盈亏平衡线"的单侧 p 值。 */
const binomialUpperTail = (hits, n, p0) => {
  let sum = 0
  for (let k = hits; k <= n; k += 1) sum += binomialPmf(k, n, p0)
  return Math.min(1, sum)
}

/**
 * 策略发现：赛果索引里的每个 teamKey × 每个模板 = 一个候选策略格子
 * （teamKey 有 teamId 用 teamId，未匹配球队用 name:归一化队名，绝不共用 null 键）。
 * 每格算 n / hits / hitRate / roi 与"命中率超出该模板假定赔率盈亏线"的二项
 * 单侧 p 值，再对全部格子做 Benjamini–Hochberg FDR（q ≤ 0.10）——
 * 一次扫几百个格子，不用多重检验校正，挖出来的全是噪音。
 *
 * options: { templates, minN = 15, q = 0.10, assumedOdds: { [templateId]: odds } }
 * 返回 { rows, totalTested, survivors }；rows 按 roi 降序，
 * survivors 是通过 FDR 的子集（同为 row 引用，带 survivesFdr=true）。
 */
export const discoverStrategies = (resultsIndex, options = {}) => {
  const rows = resultRowsOf(resultsIndex)
  const minN = Math.max(1, toInt(options.minN, 15))
  const q = Number.isFinite(Number(options.q)) ? Number(options.q) : 0.1
  const oddsOverrides = options.assumedOdds && typeof options.assumedOdds === 'object' ? options.assumedOdds : {}
  const templates = (Array.isArray(options.templates) && options.templates.length > 0
    ? options.templates
    : DEFAULT_DISCOVERY_TEMPLATES
  ).map((template) => {
    const override = Number(oddsOverrides[template.id])
    return { ...template, assumedOdds: Number.isFinite(override) && override > 1 ? override : template.assumedOdds }
  })

  // teamKey → 参赛记录（venue 是该队视角）。未匹配到别名库的球队也保留，
  // teamKey 退化为 name:归一化队名——否则 null teamId 会让不同球队撞进同一格。
  const byTeam = new Map()
  const pushGame = (teamId, rawName, venue, homeGoals, awayGoals) => {
    const teamKey = teamId || teamKeyForName(rawName)
    if (!teamKey) return
    if (!byTeam.has(teamKey)) {
      const libraryEntry = teamId ? TEAM_ALIAS_LIBRARY.find((entry) => entry.teamId === teamId) : null
      byTeam.set(teamKey, {
        teamId: teamId || null,
        teamKey,
        teamName: libraryEntry?.teamName || String(rawName ?? '').trim() || teamKey,
        games: [],
      })
    }
    byTeam.get(teamKey).games.push({ venue, homeGoals, awayGoals })
  }
  rows.forEach((row) => {
    if (!row || !Number.isFinite(Number(row.homeGoals)) || !Number.isFinite(Number(row.awayGoals))) return
    pushGame(row.teamIdHome, row.home, 'home', Number(row.homeGoals), Number(row.awayGoals))
    pushGame(row.teamIdAway, row.away, 'away', Number(row.homeGoals), Number(row.awayGoals))
  })

  const cells = []
  byTeam.forEach((team) => {
    templates.forEach((template) => {
      const games = template.venue === 'any' ? team.games : team.games.filter((game) => game.venue === template.venue)
      const n = games.length
      if (n < minN) return
      const hits = games.filter((game) => templateHitsGame(template, game)).length
      const hitRate = hits / n
      const breakevenP = 1 / template.assumedOdds
      cells.push({
        teamId: team.teamId,
        teamKey: team.teamKey,
        teamName: team.teamName,
        templateId: template.id,
        label: template.label,
        venue: template.venue || 'any',
        n,
        hits,
        hitRate,
        hitCI: wilsonInterval(hits, n),
        assumedOdds: template.assumedOdds,
        pValue: binomialUpperTail(hits, n, breakevenP),
        qValue: null,
        survivesFdr: false,
        roi: hitRate * template.assumedOdds - 1,
      })
    })
  })

  // Benjamini–Hochberg：按 p 升序排名，qValue = min_{j≥rank}(p_j · m / j)
  const m = cells.length
  const order = cells.map((_, index) => index).sort((a, b) => cells[a].pValue - cells[b].pValue)
  let runningMin = 1
  for (let rank = m; rank >= 1; rank -= 1) {
    const index = order[rank - 1]
    runningMin = Math.min(runningMin, (cells[index].pValue * m) / rank)
    cells[index].qValue = Math.min(1, runningMin)
  }
  cells.forEach((cell) => {
    cell.survivesFdr = cell.qValue !== null && cell.qValue <= q
  })

  const ranked = cells
    .slice()
    .sort((a, b) => b.roi - a.roi || b.hitRate - a.hitRate || b.n - a.n)
  return { rows: ranked, totalTested: m, survivors: ranked.filter((cell) => cell.survivesFdr) }
}

// ── 样本外验证 / 组合风险 / 实盘执行（纯函数扩展）──────────────────────

const assumedOddsFor = (spec, value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 1 ? parsed : spec.manualOdds > 1 ? spec.manualOdds : 6.5
}

const chronologicalTeamResults = (spec, resultsIndex) => {
  const aliases = aliasesForTeam(spec.team)
  const venueFilter = venueFilterFor(spec)
  return resultRowsOf(resultsIndex)
    .map((row) => ({ row, venue: aliases.length ? matchVenueForTeam(row, aliases) : 'home' }))
    .filter((entry) => entry.venue !== null && (!venueFilter || entry.venue === venueFilter))
    .sort((a, b) => {
      if (!a.row.date && !b.row.date) return 0
      if (!a.row.date) return 1
      if (!b.row.date) return -1
      return a.row.date < b.row.date ? -1 : a.row.date > b.row.date ? 1 : 0
    })
}

const evaluateResultWindow = (spec, entries, assumedOdds) => {
  let hits = 0
  let profit = 0
  entries.forEach(({ row, venue }) => {
    const hit = positionHitsResult(spec, venue, row)
    if (hit) hits += 1
    profit += hit ? spec.stakePerMatch * (assumedOdds - 1) : -spec.stakePerMatch
  })
  const n = entries.length
  return {
    n,
    hits,
    hitRate: n > 0 ? hits / n : null,
    hitCI: wilsonInterval(hits, n),
    roi: n > 0 && spec.stakePerMatch > 0 ? profit / (n * spec.stakePerMatch) : null,
  }
}

/**
 * 按时间先后切 train/test，检验策略是否只在训练段“看起来有效”。
 * spec.venue 会先于切分筛选赛程（team 为空时忽略），train/test 的 n 都跟随场地口径。
 * 三个判定彼此独立、绝不美化：
 *   testProfitable —— 样本外 ROI > 0 且命中率 > 盈亏平衡线（1/赔率）
 *   notDegraded    —— 命中率 ≥ 平衡线的 80% 且 ROI ≥ −20%
 *   oosDegraded    —— !notDegraded
 * 未退化 ≠ 盈利：ROI 为负时绝不能显示为“通过”。
 */
export const walkForwardStrategy = (specInput, resultsIndex, { trainRatio = 0.7, assumedOdds } = {}) => {
  const spec = normalizeSpec(specInput)
  const odds = assumedOddsFor(spec, assumedOdds)
  const entries = chronologicalTeamResults(spec, resultsIndex)
  const ratio = clamp(Number(trainRatio) || 0.7, 0.1, 0.9)
  const split = Math.floor(entries.length * ratio)
  const train = evaluateResultWindow(spec, entries.slice(0, split), odds)
  const test = evaluateResultWindow(spec, entries.slice(split), odds)
  const breakeven = 1 / odds
  const testProfitable =
    test.n > 0 &&
    test.hitRate !== null &&
    test.hitRate > breakeven &&
    test.roi !== null &&
    test.roi > 0
  const notDegraded =
    test.n === 0 ||
    ((test.hitRate === null || test.hitRate >= breakeven * 0.8) &&
      (test.roi === null || test.roi >= -0.2))
  const oosDegraded = !notDegraded
  let verdict = '样本外未明显退化，但仍为负期望（未通过）'
  if (test.n === 0) verdict = '没有样本外比赛：当前只能证明训练段拟合，不能证明策略可持续。'
  else if (oosDegraded) verdict = '样本外退化，淘汰'
  else if (testProfitable) verdict = '样本外仍为正期望，通过'
  return { train, test, testProfitable, notDegraded, oosDegraded, verdict, assumedOdds: odds, splitAt: split }
}

/** 监控自动退役：只改状态与历史，不改台账；不满足条件时返回原策略。 */
export const autoRetireStrategy = (strategy) => {
  if (!strategy || strategy.status === 'retired') return strategy
  if (!strategyStats(strategy).suggestRetire) return strategy
  return {
    ...strategy,
    status: 'retired',
    retiredReason: 'monitor_auto',
    statusHistory: [
      ...(Array.isArray(strategy.statusHistory) ? strategy.statusHistory : []),
      { from: strategy.status, to: 'retired', reason: 'monitor_auto', at: new Date().toISOString() },
    ],
  }
}

const pendingPositionsOf = (strategy) =>
  (Array.isArray(strategy?.positions) ? strategy.positions : []).filter((position) => position?.status === 'pending')

/** 组合敞口与球队集中度读数；poolBalance 由 UI 从蓄水池传入，本模块不读 analytics。 */
export const strategyPortfolio = (strategiesInput, { poolBalance = 0, riskCapRatio = 0.12 } = {}) => {
  const strategies = Array.isArray(strategiesInput) ? strategiesInput : []
  const active = strategies.filter((strategy) => strategy?.status !== 'retired')
  const pool = Math.max(0, Number(poolBalance) || 0)
  const teamMap = new Map()
  let pendingCount = 0
  let pendingStake = 0

  active.forEach((strategy) => {
    const positions = pendingPositionsOf(strategy)
    if (positions.length === 0) return
    const stake = positions.reduce((sum, position) => sum + Math.max(0, Number(position.stake) || 0), 0)
    const teamName = String(strategy.team || '').trim() || '全联赛'
    const teamKey = teamKeyForName(strategy.team) || 'all'
    if (!teamMap.has(teamKey)) teamMap.set(teamKey, { teamKey, teamName, stake: 0, strategies: [] })
    const bucket = teamMap.get(teamKey)
    bucket.stake += stake
    bucket.strategies.push(strategy.name || '未命名策略')
    pendingCount += positions.length
    pendingStake += stake
  })

  const teams = [...teamMap.values()]
    .map((team) => ({ ...team, pctOfPool: pool > 0 ? team.stake / pool : null }))
    .sort((a, b) => b.stake - a.stake)
  const exposurePct = pool > 0 ? pendingStake / pool : null
  const topTeamPct = pool > 0 && teams.length > 0 ? teams[0].stake / pool : 0
  const alerts = []
  const cap = Math.max(0, Number(riskCapRatio) || 0.12)

  if (pendingStake > 0 && (pool <= 0 || pendingStake > pool * cap)) {
    alerts.push({
      id: 'total_exposure',
      level: pool > 0 && pendingStake <= pool * cap * 1.5 ? 'warn' : 'danger',
      text: `待执行注码 ¥${pendingStake.toFixed(1)}，${pool > 0 ? `占蓄水池 ${(exposurePct * 100).toFixed(1)}%` : '蓄水池余额未知'}，已超过 ${(cap * 100).toFixed(0)}% 风险上限。`,
    })
  }
  teams.forEach((team) => {
    if (pool > 0 && team.stake / pool > 0.25) {
      alerts.push({ id: `team_exposure:${team.teamKey}`, level: 'danger', text: `${team.teamName} 的待执行敞口占蓄水池 ${((team.stake / pool) * 100).toFixed(1)}%，超过 25%。` })
    }
    if (team.strategies.length >= 3) {
      alerts.push({ id: `team_count:${team.teamKey}`, level: 'warn', text: `${team.teamName} 同时运行 ${team.strategies.length} 个策略，注意同队相关性。` })
    }
  })

  return {
    activeCount: active.length,
    pendingCount,
    pendingStake,
    exposurePct,
    teams,
    alerts,
    concentration: { topTeamPct },
  }
}

const PORTFOLIO_MC_SEED = 20261017

/**
 * 同一盘口内的联合蒙特卡洛：同场比赛只抽一个互斥结果，同结果格子共享命中；
 * 不同比赛独立抽样。跨盘口重叠缺少联合比分分布时明确不可用，不能强行互斥或归一化。
 */
export const simulateStrategyPortfolio = (strategiesInput, { iterations = 10000 } = {}) => {
  const strategies = Array.isArray(strategiesInput) ? strategiesInput : []
  const groups = new Map()
  let nPositions = 0
  strategies.forEach((strategy) => {
    pendingPositionsOf(strategy).forEach((position) => {
      const matchKey = positionMatchKey(position)
      if (!groups.has(matchKey)) groups.set(matchKey, [])
      groups.get(matchKey).push({
        outcomeKey: positionOutcomeKey(strategy, position),
        p: numberIfPresent(position.p),
        stake: Math.max(0, Number(position.stake) || 0),
        entryOdds: numberIfPresent(position.entryOdds),
      })
      nPositions += 1
    })
  })

  const groupList = [...groups.values()]
  const unavailable = (reason, message) => ({
    available: false,
    reason,
    message,
    iterations: 0,
    pProfit: null,
    pRuin: null,
    p5: null,
    median: null,
    p95: null,
    expectedMaxDD: null,
    worst: null,
    best: null,
    histogram: [],
    nMatches: groupList.length,
    nPositions,
  })
  if (groupList.length === 0) {
    return unavailable('no_pending_positions', '尚无待结算头寸，组合推演不可用。')
  }

  const models = []
  for (const positions of groupList) {
    if (positions.some(({ p, entryOdds }) => !Number.isFinite(p) || p < 0 || p > 1 || !Number.isFinite(entryOdds) || entryOdds <= 1)) {
      return unavailable('invalid_position_forecast', '头寸缺少有效概率或入场赔率，不能生成组合风险读数。')
    }
    const markets = new Set()
    const categories = new Map()
    for (const position of positions) {
      const key = position.outcomeKey
      const market = /^had:(home|draw|away)$/.test(key) ? 'had' : /^crs:\d+-\d+$/.test(key) ? 'crs' : null
      if (!market) return unavailable('unsupported_market', '头寸玩法缺少受支持的事件定义，组合推演不可用。')
      markets.add(market)
      if (categories.has(key) && Math.abs(categories.get(key) - position.p) > 1e-9) {
        return unavailable('inconsistent_probabilities', '同场同一结果的概率快照不一致，无法建立可靠的联合分布。')
      }
      categories.set(key, position.p)
    }
    if (markets.size > 1) {
      return unavailable('joint_distribution_unavailable', '同场比分与胜平负头寸可能同时命中，缺少完整一致的联合比分分布，组合推演不可用。')
    }
    const entries = [...categories.entries()].map(([outcomeKey, p]) => ({ outcomeKey, p }))
    const total = entries.reduce((sum, entry) => sum + entry.p, 0)
    if (total > 1 + 1e-9) {
      return unavailable('inconsistent_probabilities', '同场互斥结果的概率合计超过 100%，不能靠归一化修饰不一致的预测。')
    }
    models.push({ positions, entries })
  }

  const count = Math.max(1, Math.round(Number(iterations) || 10000))
  const rng = mulberry32(PORTFOLIO_MC_SEED)
  const profits = []
  let ruinCount = 0
  let profitCount = 0
  let ddSum = 0
  for (let iteration = 0; iteration < count; iteration += 1) {
    let profit = 0
    let hits = 0
    let peak = 0
    let maxDD = 0
    models.forEach(({ positions, entries }) => {
      const roll = rng()
      let cumulative = 0
      let selected = null
      for (const entry of entries) {
        cumulative += entry.p
        if (roll < cumulative) {
          selected = entry.outcomeKey
          break
        }
      }
      positions.forEach((position) => {
        const hit = selected === position.outcomeKey
        if (hit) hits += 1
        profit += hit ? position.stake * (position.entryOdds - 1) : -position.stake
        if (profit > peak) peak = profit
        maxDD = Math.max(maxDD, peak - profit)
      })
    })
    profits.push(profit)
    if (hits === 0) ruinCount += 1
    if (profit > 0) profitCount += 1
    ddSum += maxDD
  }

  const sorted = [...profits].sort((a, b) => a - b)
  return {
    available: true,
    reason: null,
    message: '',
    iterations: count,
    pProfit: profitCount / count,
    pRuin: ruinCount / count,
    p5: percentileOf(sorted, 5),
    median: percentileOf(sorted, 50),
    p95: percentileOf(sorted, 95),
    expectedMaxDD: ddSum / count,
    worst: sorted[0],
    best: sorted[sorted.length - 1],
    histogram: buildHistogram(profits, HISTOGRAM_BINS),
    nMatches: groupList.length,
    nPositions,
  }
}

/** 0–100 策略质量分：样本 30 + Wilson 下界边际 30 + CLV 20 + 样本外 10 − 漂移 10。 */
export const strategyQualityScore = (stats, { oosPassed = null } = {}) => {
  const safe = stats || {}
  const parts = {
    sample: clamp((Number(safe.n) || 0) / 40, 0, 1) * 30,
    wilsonEdge: 0,
    clv: Number.isFinite(safe.avgClv) ? clamp(safe.avgClv / 0.05, 0, 1) * 20 : 0,
    oos: oosPassed === true ? 10 : oosPassed === false ? 0 : 5,
    drift: safe.drift ? -10 : 0,
  }
  let breakevenP = Number(safe.breakevenP)
  if (!Number.isFinite(breakevenP) && safe.hitCI && safe.roiCI) {
    const ratioSource = safe.hitCI.high > 0 ? 'high' : safe.hitCI.low > 0 ? 'low' : null
    if (ratioSource) {
      const avgOdds = (safe.roiCI[ratioSource] + 1) / safe.hitCI[ratioSource]
      if (Number.isFinite(avgOdds) && avgOdds > 1) breakevenP = 1 / avgOdds
    }
  }
  if (safe.hitCI && Number.isFinite(breakevenP)) {
    parts.wilsonEdge = clamp((safe.hitCI.low - breakevenP) / 0.1, 0, 1) * 30
  }
  const score = Math.round(clamp(Object.values(parts).reduce((sum, value) => sum + value, 0), 0, 100))
  return { score, grade: score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : 'D', parts }
}

/** Kelly 注码与组合风险帽；fraction 是全 Kelly 比例，rawStake 已除 kellyDivisor。 */
export const kellyStakeForPool = ({ p, odds, poolBalance, riskCapRatio = 0.12, kellyDivisor = 4 } = {}) => {
  const prob = clamp(Number(p) || 0, 0, 1)
  const price = Number(odds)
  const pool = Math.max(0, Number(poolBalance) || 0)
  const fraction = Number.isFinite(price) && price > 1 ? Math.max(0, (prob * price - 1) / (price - 1)) : 0
  const rawStake = (pool * fraction) / Math.max(1, Number(kellyDivisor) || 4)
  const cap = pool * Math.max(0, Number(riskCapRatio) || 0.12)
  const cappedStake = Math.min(rawStake, cap)
  return { fraction, rawStake, cappedStake, capReason: rawStake > cap + 1e-9 ? 'risk_cap' : null }
}

const EXECUTION_OUTCOME_LABELS = { win: '胜', draw: '平', lose: '负' }

const positionEntryName = (strategy, position) => {
  const spec = normalizeSpec(strategy)
  if (spec.market === 'score') {
    const target = scoreCellForVenue(spec, position?.venue || 'home')
    return `${target.home}-${target.away}`
  }
  return EXECUTION_OUTCOME_LABELS[spec.outcome] || '胜'
}

/** 把策略头寸翻译成主数据层的单场 pending 投资对象（调用方负责校验与 saveInvestment）。 */
export const buildInvestmentFromPosition = (strategy, position, { stake, now = Date.now() } = {}) => {
  const amount = Math.max(0, Number(stake ?? position?.stake ?? strategy?.stakePerMatch) || 0)
  const createdAt = new Date(now).toISOString()
  const entryName = positionEntryName(strategy, position)
  const odds = Math.max(1.01, Number(position?.entryOdds) || 1.01)
  const investmentId = `inv_quants_${strategy?.id || 'strategy'}_${position?.id || Date.now().toString(36)}`
  return {
    id: investmentId,
    created_at: createdAt,
    parlay_size: 1,
    inputs: amount,
    suggested_amount: amount,
    expected_rating: clamp(Number(position?.p) || 0, 0, 1),
    combined_odds: odds,
    status: 'pending',
    source: 'quants',
    strategy_id: strategy?.id || null,
    strategy_position_id: position?.id || null,
    matches: [
      {
        id: `match_${position?.id || investmentId}`,
        home_team: position?.home || '',
        away_team: position?.away || '',
        entries: [{ name: entryName, odds }],
        entry_text: entryName,
        odds,
        conf: clamp(Number(position?.p) || 0, 0, 1),
        mode: '常规',
        tys_home: 'M',
        tys_away: 'M',
        fid: 0.4,
        fse_home: 0.5,
        fse_away: 0.5,
        fse_match: 0.5,
        note: '',
      },
    ],
  }
}

/** 记录一笔已执行投资：只写关联信息，不改变头寸的 pending/hit/miss 结算状态。 */
export const markPositionExecuted = (strategy, positionId, { investmentId, stake, at } = {}) => {
  const positions = (Array.isArray(strategy?.positions) ? strategy.positions : []).map((position) => {
    if (position?.id !== positionId) return position
    return {
      ...position,
      executedAt: at || new Date().toISOString(),
      executedInvestmentId: investmentId || null,
      executedStake: Number.isFinite(Number(stake)) ? Number(stake) : position.stake,
    }
  })
  return { ...strategy, positions }
}

/** 执行前硬闸门；availableCash 用 poolBalance − 现有策略待执行注码近似。 */
export const validateExecution = (strategy, position, { poolBalance = 0, riskCapRatio = 0.12, existingStrategies = [] } = {}) => {
  const reasons = []
  if (strategy?.status !== 'live') reasons.push('策略未转正，禁止进入实盘执行')
  if (position?.status !== 'pending') reasons.push('该头寸已结算或已作废，不能重复执行')
  const stake = Math.max(0, Number(position?.stake ?? strategy?.stakePerMatch) || 0)
  const pool = Math.max(0, Number(poolBalance) || 0)
  const portfolio = strategyPortfolio(existingStrategies, { poolBalance: pool, riskCapRatio })
  const availableCash = Math.max(0, pool - portfolio.pendingStake)
  if (stake > availableCash + 1e-9) reasons.push('注码超过当前可用现金')
  if (pool <= 0 || portfolio.pendingStake + stake > pool * riskCapRatio + 1e-9) {
    reasons.push('组合总敞口将超过风险上限')
  }
  return { ok: reasons.length === 0, reasons }
}

/** 手动作废单个 pending 头寸；已结算/已作废记录不会被二次改写。 */
export const voidStrategyPosition = (strategy, positionId, reason = 'manual') => {
  const positions = (Array.isArray(strategy?.positions) ? strategy.positions : []).map((position) => {
    if (position?.id !== positionId || position.status !== 'pending') return position
    return { ...position, status: 'void', profit: 0, voidedAt: new Date().toISOString(), reason }
  })
  return { ...strategy, positions }
}

/** 超过 staleDays 未开赛且无结果的 pending 头寸自动作废，避免永远悬挂在敞口里。 */
export const autoVoidStalePositions = (strategy, { now = Date.now(), staleDays = 10 } = {}) => {
  const nowMs = Number(now) || Date.now()
  const staleMs = Math.max(0, Number(staleDays) || 10) * DAY_MS
  const positions = (Array.isArray(strategy?.positions) ? strategy.positions : []).map((position) => {
    if (position?.status !== 'pending') return position
    const kickoff = new Date(position.kickoff).getTime()
    if (Number.isNaN(kickoff) || nowMs - kickoff <= staleMs) return position
    return { ...position, status: 'void', profit: 0, voidedAt: new Date(nowMs).toISOString(), reason: 'stale_no_result' }
  })
  return { ...strategy, positions }
}

const csvEscape = (value) => {
  const textValue = String(value ?? '')
  return /[",\n\r]/.test(textValue) ? `"${textValue.replace(/"/g, '""')}"` : textValue
}

const csvNumber = (value, digits = 2) => (Number.isFinite(value) ? Number(value).toFixed(digits) : '')

/** 策略架总览 CSV（UTF-8、无 BOM、中文表头）。 */
export const exportStrategiesCsv = (strategiesInput) => {
  const strategies = Array.isArray(strategiesInput) ? strategiesInput : []
  const headers = ['策略ID', '名称', '状态', '球队', '玩法', '计划场次', '每场注码', '已结算', '命中率', 'ROI', 'Sharpe', '平均CLV', '漂移', '建议退役', '可转正']
  const rows = strategies.map((strategy) => {
    const stats = strategyStats(strategy)
    const market = strategy?.market === 'score'
      ? `比分 ${strategy.score?.for ?? '?'}-${strategy.score?.against ?? '?'}`
      : `胜平负·${EXECUTION_OUTCOME_LABELS[strategy?.outcome] || '?'}`
    return [
      strategy?.id,
      strategy?.name,
      STRATEGY_STATUS_LABELS[strategy?.status] || strategy?.status,
      strategy?.team || '全联赛',
      market,
      strategy?.matchesPlanned,
      strategy?.stakePerMatch,
      stats.n,
      stats.hitRate === null ? '' : (stats.hitRate * 100).toFixed(2) + '%',
      stats.roi === null ? '' : (stats.roi * 100).toFixed(2) + '%',
      csvNumber(stats.sharpe),
      stats.avgClv === null ? '' : (stats.avgClv * 100).toFixed(2) + '%',
      stats.drift ? '是' : '否',
      stats.suggestRetire ? '是' : '否',
      stats.promotable ? '是' : '否',
    ]
  })
  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')
}

const POSITION_CSV_STATUS = { pending: '待结算', hit: '命中', miss: '未中', void: '作废' }

/** 单策略头寸明细 CSV。 */
export const strategyPositionsCsv = (strategy) => {
  const headers = ['策略', '头寸ID', '主队', '客队', '开赛', '主客', '入场赔率', '收盘赔率', 'CLV', '概率p', '状态', '盈亏', '最终比分', '作废原因']
  const positions = Array.isArray(strategy?.positions) ? strategy.positions : []
  const rows = positions.map((position) => [
    strategy?.name,
    position.id,
    position.home,
    position.away,
    position.kickoff,
    position.venue === 'home' ? '主' : position.venue === 'away' ? '客' : '',
    csvNumber(Number(position.entryOdds)),
    csvNumber(Number(position.lastSeenOdds)),
    Number.isFinite(position.clv) ? (position.clv * 100).toFixed(2) + '%' : '',
    Number.isFinite(Number(position.p)) ? (Number(position.p) * 100).toFixed(2) + '%' : '',
    POSITION_CSV_STATUS[position.status] || position.status,
    position.status === 'pending' ? '' : csvNumber(Number(position.profit)),
    position.finalScore || '',
    position.reason || '',
  ])
  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')
}
