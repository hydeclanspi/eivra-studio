import { brandLocalStorage } from './brandStorage.js'
/**
 * ============================================================================
 *  oddsHistory.js — 市场赔率时间序列（收盘价 / 漂移 / 联赛效率）
 * ============================================================================
 *
 * 每次拿到 marketOdds 快照时按 matchKey + outcomeKey 追加报价。
 * outcomeKey：had:home|draw|away；比分格：crs:<主>-<客>。
 * 只读接口全部纯函数；存储 preview 模式落 previewStore，并广播 data-changed。
 * 赔率是机构原始报价，CLV/漂移分析不能把抓取失败当成"没有市场价"。
 *
 * @module oddsHistory
 */

import { deVigProportional } from './readQuality'
import { marketScorelineProbabilities } from './marketOdds'
import { isPreviewMode } from './displayMode'
import { previewRead, previewWrite } from './previewStore'
import { normalizeMatchDate, normalizeTeamName } from './matchResults'

const ODDS_HISTORY_KEY = 'eivra.odds_history.v1'
const isBrowser = () => typeof window !== 'undefined'
const QUOTE_INTERVAL_MS = 30 * 60 * 1000
const MAX_MATCHES = 500
const MAX_QUOTES_PER_OUTCOME = 200
const MAX_MATCH_AGE_MS = 120 * 24 * 60 * 60 * 1000

const text = (value) => String(value ?? '').trim()
const validOdds = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 1 ? parsed : Number.NaN
}

/** matchId 优先；否则 normalizedHome|normalizedAway|kickoff。 */
export const marketMatchKey = (match) => {
  if (!match || typeof match !== 'object') return ''
  const matchId = text(match.matchId)
  if (matchId) return matchId
  const home = normalizeTeamName(match.home)
  const away = normalizeTeamName(match.away)
  if (!home || !away) return ''
  return `${home}|${away}|${text(match.kickoff)}`
}

const readJSON = (key, fallback) => {
  if (!isBrowser()) return fallback
  if (isPreviewMode()) return previewRead(key, fallback)
  try {
    const raw = brandLocalStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const writeJSON = (key, value) => {
  if (!isBrowser()) return
  if (isPreviewMode()) {
    previewWrite(key, value)
    window.dispatchEvent(new CustomEvent('eivra:data-changed', { detail: { key, preview: true } }))
    return
  }
  brandLocalStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent('eivra:data-changed', { detail: { key } }))
}

const readCache = () => {
  const cache = readJSON(ODDS_HISTORY_KEY, null)
  if (!cache || typeof cache !== 'object' || !cache.matches || typeof cache.matches !== 'object') {
    return { matches: {}, updatedAt: null }
  }
  return cache
}

const latestQuoteTime = (record) => {
  const times = Object.values(record?.quotes || {})
    .flat()
    .map((quote) => Number(quote?.t))
    .filter(Number.isFinite)
  return times.length > 0 ? Math.max(...times) : 0
}

const matchTime = (record) => {
  const parsed = new Date(record?.kickoff || record?.date || 0).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

const appendQuote = (record, outcomeKey, odds, now) => {
  if (!Number.isFinite(odds)) return false
  if (!record.quotes[outcomeKey]) record.quotes[outcomeKey] = []
  const trail = record.quotes[outcomeKey]
  const last = trail[trail.length - 1]
  if (last && Math.abs(last.odds - odds) < 1e-12 && now - last.t < QUOTE_INTERVAL_MS) return false
  trail.push({ t: now, odds })
  return true
}

/**
 * 记录一批市场快照。HAD 三项全记；比分格只记 trackedOutcomes[matchKey]
 * 明确点名的格子（避免比分盘 30+ 格无意义膨胀）。
 * 追加条件：赔率变了，或同价但距上一报价 ≥30 分钟。
 */
export const recordOddsSnapshot = (marketMatches, { trackedOutcomes = {}, now = Date.now() } = {}) => {
  const cache = readCache()
  const matches = { ...cache.matches }
  const timestamp = Number(now) || Date.now()
  let added = 0

  ;(Array.isArray(marketMatches) ? marketMatches : []).forEach((match) => {
    const matchKey = marketMatchKey(match)
    if (!matchKey) return
    const previous = matches[matchKey]
    const record = previous
      ? { ...previous, quotes: Object.fromEntries(Object.entries(previous.quotes || {}).map(([key, trail]) => [key, [...trail]])) }
      : {
          matchId: text(match.matchId) || null,
          date: normalizeMatchDate(match.businessDate || match.kickoff),
          kickoff: text(match.kickoff),
          home: text(match.home),
          away: text(match.away),
          quotes: {},
        }
    record.home = text(match.home) || record.home
    record.away = text(match.away) || record.away
    record.kickoff = text(match.kickoff) || record.kickoff

    ;['home', 'draw', 'away'].forEach((outcome) => {
      if (appendQuote(record, `had:${outcome}`, validOdds(match.had?.[outcome]), timestamp)) added += 1
    })

    const scorelineKeys = Array.isArray(trackedOutcomes[matchKey]) ? trackedOutcomes[matchKey] : []
    scorelineKeys.forEach((outcomeKey) => {
      const parsed = /^crs:(\d{1,2})-(\d{1,2})$/.exec(outcomeKey)
      if (!parsed) return
      const cell = (Array.isArray(match.scores) ? match.scores : []).find(
        (row) => row.home === Number(parsed[1]) && row.away === Number(parsed[2]),
      )
      if (appendQuote(record, outcomeKey, validOdds(cell?.odds), timestamp)) added += 1
    })
    matches[matchKey] = record
  })

  // 120 天前的比赛、单格 200 条报价、总共 500 场——三层上限防止无限增长。
  const cutoff = timestamp - MAX_MATCH_AGE_MS
  let pruned = 0
  Object.entries(matches).forEach(([matchKey, record]) => {
    Object.entries(record.quotes || {}).forEach(([outcomeKey, trail]) => {
      if (trail.length > MAX_QUOTES_PER_OUTCOME) {
        record.quotes[outcomeKey] = trail.slice(-MAX_QUOTES_PER_OUTCOME)
        pruned += trail.length - MAX_QUOTES_PER_OUTCOME
      }
    })
    const fixtureTime = matchTime(record)
    const activity = fixtureTime > 0 ? fixtureTime : latestQuoteTime(record)
    if (activity > 0 && activity < cutoff) {
      delete matches[matchKey]
      pruned += 1
    }
  })

  const ordered = Object.entries(matches)
    .sort((a, b) => {
      const aFixture = matchTime(a[1])
      const bFixture = matchTime(b[1])
      const aActivity = aFixture > 0 ? aFixture : latestQuoteTime(a[1])
      const bActivity = bFixture > 0 ? bFixture : latestQuoteTime(b[1])
      return bActivity - aActivity
    })
    .slice(0, MAX_MATCHES)
  const nextMatches = Object.fromEntries(ordered)
  const updatedAt = new Date(timestamp).toISOString()
  if (added > 0 || pruned > 0) writeJSON(ODDS_HISTORY_KEY, { matches: nextMatches, updatedAt })
  return { ok: true, added, pruned, matches: ordered.length, updatedAt: added > 0 || pruned > 0 ? updatedAt : cache.updatedAt }
}

/** 某个 matchKey + outcomeKey 的完整报价轨迹（按时间升序）。 */
export const getOddsTrail = (matchKey, outcomeKey) => {
  const trail = readCache().matches[matchKey]?.quotes?.[outcomeKey]
  return Array.isArray(trail) ? trail.map((quote) => ({ ...quote })) : []
}

/** 严格取开赛前的最后一条；没有赛前报价时退回最后一条并明确它就是近似。 */
export const getClosingQuote = (matchKey, outcomeKey, kickoff) => {
  const trail = getOddsTrail(matchKey, outcomeKey)
  if (trail.length === 0) return null
  const kickoffTime = new Date(kickoff).getTime()
  if (Number.isNaN(kickoffTime)) return { ...trail[trail.length - 1] }
  const before = trail.filter((quote) => quote.t < kickoffTime)
  return { ...(before.length > 0 ? before[before.length - 1] : trail[trail.length - 1]) }
}

/** 开盘到当前的赔率漂移；赔率走低 = steam，走高 = drift。 */
export const getOddsDrift = (matchKey, outcomeKey) => {
  const trail = getOddsTrail(matchKey, outcomeKey)
  if (trail.length === 0) return { open: null, current: null, changePct: null, direction: 'flat', samples: 0 }
  const open = trail[0].odds
  const current = trail[trail.length - 1].odds
  const changePct = open > 0 ? current / open - 1 : null
  const direction = changePct === null || Math.abs(changePct) < 0.001 ? 'flat' : changePct < 0 ? 'steam' : 'drift'
  return { open, current, changePct, direction, samples: trail.length }
}

/** 各联赛 HAD/比分盘平均抽水，按比分盘抽水降序；无有效 CRS 样本的联赛排最后。 */
export const marketEfficiencyMap = (marketMatches) => {
  const byLeague = new Map()
  ;(Array.isArray(marketMatches) ? marketMatches : []).forEach((match) => {
    const league = text(match?.league) || '未知联赛'
    if (!byLeague.has(league)) byLeague.set(league, { league, matches: 0, hadOverrounds: [], crsOverrounds: [] })
    const bucket = byLeague.get(league)
    bucket.matches += 1
    const had = deVigProportional([match.had?.home, match.had?.draw, match.had?.away])
    if (had.ok) bucket.hadOverrounds.push(had.overround)
    const crs = marketScorelineProbabilities(match)
    if (crs?.ok && Number.isFinite(crs.overround)) bucket.crsOverrounds.push(crs.overround)
  })

  const mean = (values) => (values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : Number.NaN)
  return [...byLeague.values()]
    .map((bucket) => ({
      league: bucket.league,
      matches: bucket.matches,
      avgHadOverround: mean(bucket.hadOverrounds),
      avgCrsOverround: mean(bucket.crsOverrounds),
      crsSamples: bucket.crsOverrounds.length,
    }))
    .sort((a, b) => {
      const aValue = Number.isFinite(a.avgCrsOverround) ? a.avgCrsOverround : Number.NEGATIVE_INFINITY
      const bValue = Number.isFinite(b.avgCrsOverround) ? b.avgCrsOverround : Number.NEGATIVE_INFINITY
      return bValue - aValue || a.league.localeCompare(b.league)
    })
}

/** 存储状态：{ matches, quotes, since, updatedAt }。 */
export const oddsHistoryStatus = () => {
  const cache = readCache()
  const records = Object.values(cache.matches)
  const trails = records.flatMap((record) => Object.values(record.quotes || {}).flat())
  const times = trails.map((quote) => Number(quote?.t)).filter(Number.isFinite)
  return {
    matches: records.length,
    quotes: trails.length,
    since: times.length > 0 ? new Date(Math.min(...times)).toISOString() : null,
    updatedAt: cache.updatedAt || null,
  }
}
