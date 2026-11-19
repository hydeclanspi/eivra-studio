import { teamKeyForName } from './matchResults'
import { buildTeamRatings, probabilityFromRatings } from './teamRatings'
import { DEFAULT_LAMBDA_PRIOR, deriveScoreDistribution, fitMarketLambdas } from './readQuality'
import { contentId, copy, immutableUnion, quantStore, uid } from './quantStore'

export const EVIDENCE_KEY = 'eivra.quant_evidence.v1'
const storage = quantStore(EVIDENCE_KEY, ['events', 'quotes', 'results', 'imports'])
export const getEvidenceStore = storage.read
export const emptyEvidenceStore = storage.empty
const text = (value) => String(value ?? '').trim()
const numeric = (value) => value !== '' && value != null && typeof value !== 'boolean' && Number.isFinite(Number(value)) ? Number(value) : null

/** External timestamps must carry an explicit UTC offset. No local timezone guessing. */
export const instant = (value) => {
  if (typeof value !== 'string') return null
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.exec(value)
  if (!match) return null
  const [, year, month, day, hour, minute, second = '0', zone] = match
  if (+month < 1 || +month > 12 || +day < 1 || +hour > 23 || +minute > 59 || +second > 59) return null
  if (new Date(Date.UTC(+year, +month - 1, +day)).toISOString().slice(0, 10) !== `${year}-${month}-${day}`) return null
  if (zone !== 'Z' && (+zone.slice(1, 3) > 14 || +zone.slice(4) > 59 || (+zone.slice(1, 3) === 14 && +zone.slice(4) !== 0))) return null
  const time = Date.parse(value)
  return Number.isFinite(time) ? time : null
}
const iso = (value) => instant(value) === null ? null : new Date(instant(value)).toISOString()
export const officialInstant = (value) => {
  if (instant(value) !== null) return iso(value)
  const normalized = text(value).replace(' ', 'T')
  return iso(`${normalized}+08:00`)
}
export const eventKey = (row) => {
  const kickoff = iso(row?.kickoff)
  const home = text(row?.home) && teamKeyForName(row.home)
  const away = text(row?.away) && teamKeyForName(row.away)
  return kickoff && home && away && home !== away ? `${kickoff}|${home}|${away}` : null
}
const eventFields = (row) => {
  const eventId = eventKey(row)
  if (!eventId) throw new Error('赛事需要明确的主客队及带时区的开赛时间。')
  const source = text(row.source)
  if (!source || source.length > 200) throw new Error('每条证据都需要有效来源。')
  return { eventId, home: text(row.home), away: text(row.away), kickoff: iso(row.kickoff), source }
}
const observedFields = (row, now) => {
  const observedAt = iso(row.observedAt)
  const sourceUpdatedAt = row.sourceUpdatedAt ? iso(row.sourceUpdatedAt) : null
  if (!observedAt || instant(observedAt) > now) throw new Error('采集时间缺失、无时区或晚于当前时间。')
  if (row.sourceUpdatedAt && (!sourceUpdatedAt || instant(sourceUpdatedAt) > instant(observedAt))) throw new Error('来源更新时间不能晚于采集时间。')
  return { observedAt, sourceUpdatedAt, tradable: row.tradable !== false }
}
const identify = (type, row) => ({ id: `${type}_${contentId(row)}`, ...row })

export const normalizeEvidence = (payload, { now = new Date().toISOString() } = {}) => {
  const time = instant(now)
  if (time === null || !payload || payload.schemaVersion !== 1) throw new Error('证据格式应为 schemaVersion: 1。')
  for (const field of ['events', 'quotes', 'results']) if (payload[field] !== undefined && !Array.isArray(payload[field])) throw new Error(`${field} 必须为数组。`)
  const events = (payload.events || []).map((row) => identify('event', { ...eventFields(row), ...observedFields(row, time) }))
  const quotes = (payload.quotes || []).map((row) => {
    const odds = numeric(row.odds)
    const selection = text(row.selection)
    const market = row.market
    if (!odds || odds <= 1 || !(['result', 'score'].includes(market))) throw new Error('报价需要有效市场和大于 1 的十进制赔率。')
    if (market === 'result' ? !['home', 'draw', 'away'].includes(selection) : !/^(?:[0-9]|[12][0-9]|30)-(?:[0-9]|[12][0-9]|30)$/.test(selection)) throw new Error('报价选项无效：胜平负用 home/draw/away，比分用主队-客队进球。')
    return identify('quote', { ...eventFields(row), ...observedFields(row, time), market, selection, odds })
  })
  const results = (payload.results || []).map((row) => {
    const event = eventFields(row)
    const homeGoals = numeric(row.homeGoals); const awayGoals = numeric(row.awayGoals)
    if (![homeGoals, awayGoals].every((value) => Number.isInteger(value) && value >= 0 && value <= 30)) throw new Error('赛果需要 0–30 的整数比分。')
    const availableAt = iso(row.availableAt)
    if (!availableAt || instant(availableAt) < instant(event.kickoff) || instant(availableAt) > time) throw new Error('赛果可知时间必须带时区，晚于开赛且不晚于当前时间。')
    return identify('result', { ...event, homeGoals, awayGoals, availableAt })
  })
  return { schemaVersion: 1, events: immutableUnion([], events), quotes: immutableUnion([], quotes), results: immutableUnion([], results), imports: [] }
}

export const mergeEvidence = (store, payload, options = {}) => {
  const incoming = normalizeEvidence(payload, options)
  const collector = options.collector ? normalizeCollectorStatus(options.collector, options.now) : null
  const next = copy(store)
  let added = 0
  for (const field of ['events', 'quotes', 'results']) {
    next[field] = immutableUnion(next[field], incoming[field])
    added += next[field].length - store[field].length
  }
  if (added || collector) next.imports.push({ id: uid('import'), at: options.now || new Date().toISOString(), label: text(options.label) || '证据导入', added, collector })
  return next
}
export const importEvidence = (payload, options = {}) => storage.write(mergeEvidence(storage.read(), payload, options))

export const normalizeCollectorStatus = (value, now = new Date().toISOString()) => {
  if (!['starting', 'running', 'degraded', 'stopped', 'failed'].includes(value?.state)) throw new Error('采集器状态无效。')
  const result = { state: value.state, message: text(value.message).slice(0, 2000), intervalSeconds: Number(value.intervalSeconds) }
  if (!Number.isFinite(result.intervalSeconds) || result.intervalSeconds < 60 || result.intervalSeconds > 86400) throw new Error('采集器间隔无效。')
  for (const field of ['updatedAt', 'startedAt', 'lastSuccessAt', 'lastResultsSuccessAt']) {
    if (!value[field] && field !== 'updatedAt') { result[field] = null; continue }
    if (instant(value[field]) === null || instant(value[field]) > instant(now)) throw new Error('采集器时间无效或晚于导入时刻。')
    result[field] = iso(value[field])
  }
  return result
}

/** The adapter alone interprets the official site's naive times as China Standard Time. */
export const evidenceFromOfficial = (matches, { now = new Date().toISOString() } = {}) => {
  const quotes = []; const events = []; const excluded = []
  for (const match of matches || []) {
    const base = { home: match.home, away: match.away, kickoff: officialInstant(match.kickoff), source: 'sporttery', observedAt: now, tradable: match.selling === true }
    if (!eventKey(base)) { excluded.push({ matchId: match.matchId, reason: 'invalid_event_time_or_identity' }); continue }
    events.push({ ...base, tradable: match.selling === true || match.sellingByMarket?.score === true })
    for (const selection of ['home', 'draw', 'away']) {
      if (Number.isFinite(match.had?.[selection]) && match.had[selection] > 1) quotes.push({ ...base, market: 'result', selection, odds: match.had[selection], sourceUpdatedAt: officialInstant(match.hadUpdatedAt) })
    }
    for (const score of match.scores || []) {
      if (Number.isFinite(score.odds) && score.odds > 1) quotes.push({ ...base, tradable: match.sellingByMarket?.score === true, market: 'score', selection: `${score.home}-${score.away}`, odds: score.odds, sourceUpdatedAt: officialInstant(match.crsUpdatedAt) })
    }
  }
  return { schemaVersion: 1, events, quotes, results: [], excluded }
}

/** An observed final result gets the collector's first-seen time, never an invented historical timestamp. */
export const evidenceFromObservedResults = (rows, evidence, { now = new Date().toISOString() } = {}) => {
  const known = [...(evidence.events || []), ...(evidence.quotes || [])]
  const results = []; const excluded = []
  for (const row of rows || []) {
    const home = teamKeyForName(row.home); const away = teamKeyForName(row.away)
    const candidates = new Map(known.filter((item) => teamKeyForName(item.home) === home && teamKeyForName(item.away) === away
      && new Date(instant(item.kickoff) + 8 * 3600000).toISOString().slice(0, 10) === row.date)
      .map((item) => [item.eventId, item]))
    if (candidates.size !== 1) { excluded.push({ ...row, reason: 'unmatched_or_ambiguous_event' }); continue }
    const match = [...candidates.values()][0]
    if (instant(match.kickoff) >= instant(now)) { excluded.push({ ...row, reason: 'not_started' }); continue }
    if (evidence.results.some((item) => item.eventId === match.eventId && item.homeGoals === row.homeGoals && item.awayGoals === row.awayGoals && item.source === 'sporttery')) continue
    results.push({ home: match.home, away: match.away, kickoff: match.kickoff, homeGoals: row.homeGoals, awayGoals: row.awayGoals, availableAt: now, source: 'sporttery' })
  }
  return { schemaVersion: 1, quotes: [], results, excluded }
}

export const quoteForSpec = (spec, row) => {
  const key = spec.team ? teamKeyForName(spec.team) : null
  const venue = !key ? (spec.venue === 'away' ? 'away' : 'home') : key === teamKeyForName(row.home) ? 'home' : key === teamKeyForName(row.away) ? 'away' : null
  if (!venue || (spec.venue !== 'all' && spec.venue !== 'any' && spec.venue && spec.venue !== venue)) return null
  if (spec.market === 'score') {
    const h = numeric(spec.score?.for); const a = numeric(spec.score?.against)
    if (![h, a].every((value) => Number.isInteger(value) && value >= 0 && value <= 30)) return null
    return { venue, selection: venue === 'home' ? `${h}-${a}` : `${a}-${h}` }
  }
  if (!['win', 'draw', 'lose'].includes(spec.outcome)) return null
  return { venue, selection: spec.outcome === 'draw' ? 'draw' : (spec.outcome === 'win') === (venue === 'home') ? 'home' : 'away' }
}
export const resultHit = (selection, market, result) => market === 'score'
  ? selection === `${result.homeGoals}-${result.awayGoals}`
  : selection === 'draw' ? result.homeGoals === result.awayGoals : selection === 'home' ? result.homeGoals > result.awayGoals : result.homeGoals < result.awayGoals

export const latestQuote = (quotes, { eventId, market, selection, at, maxAgeMinutes = 60, source } = {}) => {
  const time = instant(at)
  if (time === null) return { quote: null, reason: 'invalid_decision_time' }
  const eligible = quotes.filter((quote) => quote.eventId === eventId && quote.market === market && quote.selection === selection
    && (!source || quote.source === source) && instant(quote.observedAt) !== null && instant(quote.observedAt) <= time && instant(quote.observedAt) < instant(quote.kickoff))
    .sort((a, b) => instant(b.observedAt) - instant(a.observedAt) || a.source.localeCompare(b.source))
  const quote = eligible[0]
  if (!quote) return { quote: null, reason: 'missing_asof_quote' }
  const simultaneous = eligible.filter((item) => item.observedAt === quote.observedAt && item.source === quote.source)
  if (new Set(simultaneous.map((item) => `${item.odds}|${item.tradable}`)).size > 1) return { quote: null, reason: 'conflicting_quote' }
  if (quote.tradable === false) return { quote: null, reason: 'market_closed' }
  if (time - instant(quote.observedAt) > maxAgeMinutes * 60000) return { quote: null, reason: 'stale_quote' }
  return { quote, reason: null }
}

export const resolveForecast = (spec, eventQuotes, { results = [], at, source: requestedSource } = {}) => {
  const time = instant(at)
  const base = { available: false, probability: null, source: null, reason: 'forecast_unavailable', generatedAt: at, trainingCount: 0 }
  const quotes = (eventQuotes || []).filter((row) => time !== null && instant(row.observedAt) !== null && instant(row.observedAt) <= time && instant(row.kickoff) > time
    && row.eventId === eventKey(row) && (!requestedSource || row.source === requestedSource) && Number.isFinite(row.odds) && row.odds > 1)
  const event = quotes[0]
  const target = event && quoteForSpec(spec, event)
  if (!target) return base
  const fromCells = (cells) => cells.reduce((sum, cell) => sum + (resultHit(target.selection, spec.market, { homeGoals: cell.home, awayGoals: cell.away }) ? cell.p : 0), 0)
  let probability = null; let source = spec.probMode; let trainingCount = 0
  let inputs = { engineVersion: 'quant-forecast/1.0.0', requestedMode: spec.probMode }
  if (spec.probMode === 'custom') probability = numeric(spec.customProb)
  else if (spec.probMode === 'base') probability = fromCells(deriveScoreDistribution(DEFAULT_LAMBDA_PRIOR.home, DEFAULT_LAMBDA_PRIOR.away))
  else if (spec.probMode === 'ratings') {
    const grouped = new Map()
    results.filter((row) => row.eventId === eventKey(row) && instant(row.availableAt) !== null && instant(row.availableAt) < time && instant(row.kickoff) < time
      && instant(row.availableAt) >= instant(row.kickoff) && [row.homeGoals, row.awayGoals].every((value) => Number.isInteger(value) && value >= 0 && value <= 30))
      .forEach((row) => grouped.set(row.eventId, [...(grouped.get(row.eventId) || []), row]))
    const training = [...grouped.values()].filter((group) => new Set(group.map((row) => `${row.homeGoals}:${row.awayGoals}`)).size === 1).map((group) => ({ ...group[0], date: group[0].kickoff, teamKeyHome: teamKeyForName(group[0].home), teamKeyAway: teamKeyForName(group[0].away) }))
    trainingCount = training.length
    const model = probabilityFromRatings({ teamKeyHome: teamKeyForName(event.home), teamKeyAway: teamKeyForName(event.away) }, buildTeamRatings(training))
    inputs = { ...inputs, trainingEvidenceIds: training.map((row) => row.id), homeLambda: model.ready ? model.homeLambda : null, awayLambda: model.ready ? model.awayLambda : null }
    if (model.ready) probability = fromCells(model.cells)
    else return { ...base, reason: 'ratings_unavailable', trainingCount }
  } else if (spec.probMode === 'market') {
    const groups = new Map()
    quotes.filter((row) => row.eventId === event.eventId && row.market === 'result').forEach((row) => {
      const key = `${row.source}|${row.observedAt}`
      groups.set(key, [...(groups.get(key) || []), row])
    })
    const latest = [...groups.values()].sort((a, b) => instant(b[0].observedAt) - instant(a[0].observedAt) || a[0].source.localeCompare(b[0].source))[0]
    if (!latest || !['home', 'draw', 'away'].every((key) => new Set(latest.filter((row) => row.selection === key).map((row) => `${row.odds}|${row.tradable}`)).size === 1)) return { ...base, reason: 'incomplete_market_distribution' }
    if (latest.some((row) => row.tradable === false)) return { ...base, reason: 'market_closed' }
    const prices = Object.fromEntries(latest.map((row) => [row.selection, row.odds]))
    const fit = fitMarketLambdas({ oneXTwo: prices })
    inputs = { ...inputs, quoteIds: latest.map((row) => row.id), quoteSource: latest[0].source, observedAt: latest[0].observedAt,
      homeLambda: fit?.ready ? fit.homeLambda : null, awayLambda: fit?.ready ? fit.awayLambda : null }
    if (fit?.ready) { probability = fromCells(deriveScoreDistribution(fit.homeLambda, fit.awayLambda)); source = 'market_poisson' }
    else if (spec.market === 'result') { probability = (1 / prices[target.selection]) / Object.values(prices).reduce((sum, odds) => sum + 1 / odds, 0); source = 'market_devig' }
  }
  return Number.isFinite(probability) && probability >= 0 && probability <= 1
    ? { ...base, available: true, probability, source, reason: null, trainingCount, inputs }
    : { ...base, trainingCount }
}

export const evidenceCoverage = (store) => {
  const events = new Set([...store.events, ...store.quotes, ...store.results].map((row) => row.eventId))
  const priced = new Set(store.quotes.filter((row) => instant(row.observedAt) < instant(row.kickoff)).map((row) => row.eventId))
  const settled = new Set(store.results.map((row) => row.eventId))
  return { events: events.size, quotes: store.quotes.length, results: settled.size, replayable: [...settled].filter((id) => priced.has(id)).length, latest: store.quotes.reduce((last, row) => !last || row.observedAt > last ? row.observedAt : last, null) }
}
