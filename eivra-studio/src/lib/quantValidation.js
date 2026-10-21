import { normalizeSpec } from './quantStrategy'
import { normalizeMatchDate, teamKeyForName } from './matchResults'
import { eventKey, instant, latestQuote, quoteForSpec, resolveForecast, resultHit } from './quantEvidence'
import { contentId, copy, quantStore, stableJSON, uid } from './quantStore'

export const VALIDATION_STORAGE_KEY = 'eivra.quant_validation.v1'
export const VALIDATION_ENGINE_VERSION = 'quant-validation/1.1.0'
const storage = quantStore(VALIDATION_STORAGE_KEY, ['runs', 'exposures'])
export const emptyValidationStore = storage.empty
const DAY = 86400000
const MAX_CANDIDATES = 30
const MAX_FOLDS = 100
const SPEC_FIELDS = ['name', 'team', 'venue', 'market', 'score', 'outcome', 'matchesPlanned', 'stakePerMatch', 'oddsMode', 'manualOdds', 'probMode', 'customProb', 'bankroll']
const text = (value) => String(value ?? '').trim()
const corrupt = () => { throw new Error('研究实验或数据曝光记录损坏，原有数据已保留，没有覆盖原记录。') }
const assertValidationStore = (store) => {
  const runs = new Map(store.runs.map((run) => [run.id, run]))
  for (const run of store.runs) {
    if (!['parameter_walk_forward', 'historical_price_replay'].includes(run.kind)
      || !run.protocol || !run.inputSnapshot || !run.summary || !run.baseline?.summary
      || !['candidates', 'folds', 'accepted', 'excluded', 'limitations', 'priorExperimentIds'].every((field) => Array.isArray(run[field]))
      || !run.dataFingerprint || !Number.isInteger(run.exposureCount) || run.exposureCount < 1
      || !Number.isInteger(run.summary.n) || run.summary.n !== run.accepted.length
      || run.candidates.some((candidate) => !candidate.id || !candidate.spec)
      || run.folds.some((fold) => !fold.id || !fold.trainingRange || !fold.testingRange || !fold.summary || !Array.isArray(fold.trainingResults) || !Array.isArray(fold.excluded))) corrupt()
  }
  const fingerprints = new Set()
  for (const exposure of store.exposures) {
    if (!exposure.dataFingerprint || fingerprints.has(exposure.dataFingerprint) || !Array.isArray(exposure.runIds)
      || !Number.isInteger(exposure.count) || exposure.count < 1 || exposure.count !== exposure.runIds.length
      || new Set(exposure.runIds).size !== exposure.runIds.length) corrupt()
    fingerprints.add(exposure.dataFingerprint)
    exposure.runIds.forEach((id, index) => {
      const run = runs.get(id)
      if (!run || run.dataFingerprint !== exposure.dataFingerprint || run.exposureCount !== index + 1
        || stableJSON(run.priorExperimentIds) !== stableJSON(exposure.runIds.slice(0, index))) corrupt()
    })
  }
  if (store.runs.some((run) => !store.exposures.some((exposure) => exposure.dataFingerprint === run.dataFingerprint && exposure.runIds.includes(run.id)))) corrupt()
  return store
}
export const getValidationStore = () => assertValidationStore(storage.read())
const freezeSpec = (input) => {
  const spec = normalizeSpec(input)
  if (!Number.isFinite(spec.stakePerMatch) || spec.stakePerMatch > 1e12) throw new Error('每场投入需要是 0–1 万亿之间的有限数值。')
  return copy(Object.fromEntries(SPEC_FIELDS.map((key) => [key, spec[key]])))
}
const numeric = (value) => value !== '' && value != null && typeof value !== 'boolean' && Number.isFinite(Number(value)) ? Number(value) : null
const strictDay = (value) => {
  const date = normalizeMatchDate(value)
  const time = date && instant(`${date}T00:00:00Z`)
  return time === null || time === false ? null : date
}
const dayTime = (day) => instant(`${day}T00:00:00Z`)
const isoDay = (time) => new Date(time).toISOString().slice(0, 10)
const canonicalInstant = (value) => instant(value) === null ? value ?? null : new Date(instant(value)).toISOString()
const canonicalSet = (rows, project) => [...new Set(rows.map((row) => stableJSON(project(row))))].sort()
const historyFingerprint = (rows) => `history_${contentId(canonicalSet(rows, (row) => ({
  date: strictDay(row.date) || row.date, home: teamKeyForName(row.home), away: teamKeyForName(row.away),
  homeGoals: numeric(row.homeGoals) ?? row.homeGoals, awayGoals: numeric(row.awayGoals) ?? row.awayGoals, source: text(row.source),
})))}`
const evidenceFingerprint = (evidence) => `evidence_${contentId(Object.fromEntries(Object.entries(evidence).map(([field, rows]) => [field, canonicalSet(rows, (row) => ({
  eventId: eventKey(row) || row.eventId || null, source: text(row.source),
  ...(field === 'results' ? { homeGoals: numeric(row.homeGoals) ?? row.homeGoals, awayGoals: numeric(row.awayGoals) ?? row.awayGoals, availableAt: canonicalInstant(row.availableAt) }
    : { observedAt: canonicalInstant(row.observedAt), sourceUpdatedAt: canonicalInstant(row.sourceUpdatedAt), tradable: row.tradable !== false,
      ...(field === 'quotes' ? { market: row.market, selection: row.selection, odds: numeric(row.odds) ?? row.odds } : {}) }),
}))])))}`
const integer = (value, fallback, min, max, label) => {
  const number = value == null || value === '' ? fallback : numeric(value)
  if (!Number.isInteger(number) || number < min || number > max) throw new Error(`${label}须为 ${min}–${max} 的整数。`)
  return number
}
const dateRange = (startDate, endDate, firstDate, lastDate) => {
  const start = startDate ? strictDay(startDate) : firstDate
  const end = endDate ? strictDay(endDate) : lastDate
  if (!start || !end || start > end) throw new Error('请选择有效的开始、结束日期，且开始日期不得晚于结束日期。')
  return { startDate: start, endDate: end, from: dayTime(start), until: dayTime(end) + DAY }
}
const rowsOf = (results) => Array.isArray(results) ? results : Array.isArray(results?.matches) ? results.matches : []
const historySnapshot = (results) => rowsOf(results).map((row) => ({
  id: text(row?.id || row?.matchId), date: row?.date ?? row?.kickoff ?? null,
  home: text(row?.home), away: text(row?.away), homeGoals: row?.homeGoals ?? null,
  awayGoals: row?.awayGoals ?? null, source: text(row?.source),
}))

const cleanHistory = (input) => {
  const excluded = []; const groups = new Map()
  input.forEach((row, index) => {
    const date = strictDay(row.date)
    const homeGoals = numeric(row.homeGoals); const awayGoals = numeric(row.awayGoals)
    const home = row.home && teamKeyForName(row.home); const away = row.away && teamKeyForName(row.away)
    const reason = !date ? 'invalid_date' : !home || !away || home === away ? 'invalid_identity'
      : ![homeGoals, awayGoals].every((n) => Number.isInteger(n) && n >= 0 && n <= 30) ? 'invalid_score' : null
    const item = { ...row, id: row.id || `row_${index + 1}`, date, homeGoals, awayGoals }
    if (reason) { excluded.push({ ...item, reason }); return }
    const eventId = `${date}|${home}|${away}`
    groups.set(eventId, [...(groups.get(eventId) || []), { ...item, eventId, time: dayTime(date) }])
  })
  const rows = []
  for (const group of groups.values()) {
    if (new Set(group.map((row) => `${row.homeGoals}:${row.awayGoals}`)).size > 1) {
      group.forEach((row) => excluded.push({ ...row, reason: 'conflicting_result' }))
    } else {
      rows.push(group[0])
      group.slice(1).forEach((row) => excluded.push({ ...row, reason: 'duplicate_result' }))
    }
  }
  rows.sort((a, b) => a.time - b.time || a.eventId.localeCompare(b.eventId))
  return { rows, excluded }
}

/** Enumerate the complete declared search space before any outcome is evaluated. */
export const buildParameterCandidates = ({ spec: input, venueOptions, outcomeOptions, assumedOddsOptions } = {}) => {
  const spec = freezeSpec(input)
  const venues = [...new Set(venueOptions?.length ? venueOptions : [spec.venue])]
  const outcomes = spec.market === 'result' ? [...new Set(outcomeOptions?.length ? outcomeOptions : [spec.outcome])] : [null]
  const prices = [...new Set((assumedOddsOptions?.length ? assumedOddsOptions : [spec.manualOdds]).map(numeric))]
  if (venues.some((v) => !['any', 'home', 'away'].includes(v))) throw new Error('主客场候选只能使用不限、主场、客场。')
  if (spec.market === 'result' && outcomes.some((v) => !['win', 'draw', 'lose'].includes(v))) throw new Error('结果候选只能使用胜、平、负。')
  if (prices.some((v) => v === null || v <= 1 || v > 1000)) throw new Error('假定赔率必须大于 1 且不超过 1000。')
  if (venues.length * outcomes.length * prices.length > MAX_CANDIDATES) throw new Error('候选全集最多 30 个，请缩小参数范围。')
  const candidates = []
  for (const venue of venues) for (const outcome of outcomes) for (const manualOdds of prices) {
    const rules = { ...spec, venue, outcome, manualOdds, oddsMode: 'manual' }
    candidates.push({ id: `candidate_${contentId(rules)}`, order: candidates.length + 1, spec: rules })
  }
  return candidates
}

/** All trades with the same known settlement instant settle together. */
export const summarizeValidationSettlements = (rows, { baseline = false } = {}) => {
  const n = rows.length
  if (!n) return { n: 0, hits: 0, hitRate: null, totalStake: 0, totalProfit: null, roi: null, maxDrawdown: null, equityCurve: [] }
  const groups = new Map()
  let totalStake = 0; let hits = 0
  rows.forEach((row) => {
    const time = instant(row.availableAt)
    if (time === null) throw new Error('结算记录缺少有效的带时区可知时间。')
    const at = new Date(time).toISOString()
    const profit = baseline ? row.baselineProfit : row.profit
    const hit = baseline ? row.baselineHit : row.hit
    if (!Number.isFinite(profit) || !Number.isFinite(row.stake) || row.stake < 0) throw new Error('结算记录包含无效投入或收益，无法计算。')
    totalStake += row.stake
    if (hit) hits += 1
    const group = groups.get(at) || { at, profit: 0, count: 0, eventIds: [] }
    group.profit += profit; group.count += 1; group.eventIds.push(row.eventId)
    groups.set(at, group)
  })
  let totalProfit = 0; let peak = 0; let maxDrawdown = 0
  const equityCurve = [...groups.values()].sort((a, b) => instant(a.at) - instant(b.at)).map((group) => {
    totalProfit += group.profit
    peak = Math.max(peak, totalProfit); maxDrawdown = Math.max(maxDrawdown, peak - totalProfit)
    return { ...group, cumulative: totalProfit }
  })
  return { n, hits, hitRate: hits / n, totalStake, totalProfit, roi: totalStake > 0 ? totalProfit / totalStake : null, maxDrawdown, equityCurve }
}

const scenarioRows = (spec, rows) => {
  const accepted = []; const excluded = []
  rows.forEach((row) => {
    const target = quoteForSpec(spec, row)
    if (!target) { excluded.push({ ...row, reason: 'outside_rule' }); return }
    const hit = resultHit(target.selection, spec.market, row)
    accepted.push({
      ...row, selection: target.selection, venue: target.venue, hit, odds: spec.manualOdds,
      stake: spec.stakePerMatch, profit: spec.stakePerMatch * (hit ? spec.manualOdds - 1 : -1),
      // These dated historical rows have no result-availability timestamp. End-of-day
      // grouping is only a declared scenario convention, never an as-of claim.
      availableAt: `${row.date}T23:59:59.999Z`, settlementTiming: 'assumed_date_end',
    })
  })
  return { accepted, excluded, summary: summarizeValidationSettlements(accepted) }
}

export const evaluateParameterValidation = (input = {}) => {
  const results = historySnapshot(input.resultsIndex)
  const cleaned = cleanHistory(results)
  if (!cleaned.rows.length) throw new Error('没有具备有效日期、球队和比分的历史样本，无法开展参数实验。')
  const candidates = buildParameterCandidates(input)
  const range = dateRange(input.startDate, input.endDate, cleaned.rows[0].date, cleaned.rows.at(-1).date)
  const trainDays = integer(input.trainDays, 180, 7, 3650, '训练窗天数')
  const testDays = integer(input.testDays, 30, 1, 365, '后窗天数')
  const minTrainingSamples = integer(input.minTrainingSamples, 20, 1, 10000, '训练样本门槛')
  const possibleFolds = Math.ceil((range.until - range.from - trainDays * DAY) / (testDays * DAY))
  if (possibleFolds < 1) throw new Error('研究区间不足一个训练窗加后窗，请增加区间或缩短训练窗。')
  if (possibleFolds > MAX_FOLDS) throw new Error('滚动窗最多 100 个，请扩大后窗或缩短研究区间。')
  const selectedRows = cleaned.rows.filter((row) => row.time >= range.from && row.time < range.until)
  const excluded = [...cleaned.excluded, ...cleaned.rows.filter((row) => row.time < range.from || row.time >= range.until).map((row) => ({ ...row, reason: 'outside_period' }))]
  const accepted = []; const folds = []
  for (let trainStart = range.from; trainStart + trainDays * DAY < range.until; trainStart += testDays * DAY) {
    const testStart = trainStart + trainDays * DAY; const testEnd = Math.min(testStart + testDays * DAY, range.until)
    const training = selectedRows.filter((row) => row.time >= trainStart && row.time < testStart)
    const testing = selectedRows.filter((row) => row.time >= testStart && row.time < testEnd)
    const trainingResults = candidates.map((candidate) => {
      const evaluated = scenarioRows(candidate.spec, training)
      return { candidateId: candidate.id, order: candidate.order, summary: evaluated.summary, acceptedEventIds: evaluated.accepted.map((row) => row.eventId), excluded: evaluated.excluded.map((row) => ({ eventId: row.eventId, reason: row.reason })) }
    })
    const ranked = trainingResults.filter((row) => row.summary.n >= minTrainingSamples)
      .sort((a, b) => b.summary.hitRate - a.summary.hitRate || a.order - b.order)
    const winner = candidates.find((candidate) => candidate.id === ranked[0]?.candidateId) || null
    const foldIndex = folds.length + 1
    const evaluated = winner ? scenarioRows(winner.spec, testing) : { accepted: [], excluded: testing.map((row) => ({ ...row, reason: 'insufficient_training' })) }
    const paired = []; const foldExcluded = [...evaluated.excluded]
    // Declared candidate 1 is a fixed reference; compare on the event intersection.
    const reference = new Map(scenarioRows(candidates[0].spec, testing).accepted.map((row) => [row.eventId, row]))
    for (const row of evaluated.accepted) {
      const baseline = reference.get(row.eventId)
      if (!baseline) { foldExcluded.push({ ...row, reason: 'outside_baseline_intersection' }); continue }
      paired.push({ ...row, fold: foldIndex, candidateId: winner.id, baselineHit: baseline.hit, baselineProfit: baseline.profit, baselineOdds: baseline.odds })
    }
    accepted.push(...paired)
    excluded.push(...foldExcluded.map((row) => ({ ...row, fold: foldIndex })))
    folds.push({
      id: `fold_${foldIndex}`, number: foldIndex,
      trainingRange: { start: isoDay(trainStart), endExclusive: isoDay(testStart) },
      testingRange: { start: isoDay(testStart), endExclusive: isoDay(testEnd) },
      trainingEventIds: training.map((row) => row.eventId), testingEventIds: testing.map((row) => row.eventId),
      trainingResults, selectedCandidateId: winner?.id || null, selectedSpec: winner ? copy(winner.spec) : null,
      selectionReason: winner ? 'training_hit_rate_then_declared_order' : 'insufficient_training',
      accepted: paired, excluded: foldExcluded, summary: summarizeValidationSettlements(paired),
      baseline: summarizeValidationSettlements(paired, { baseline: true }),
    })
  }
  const protocol = { startDate: range.startDate, endDate: range.endDate, trainDays, testDays, minTrainingSamples, selectionMetric: 'training_hit_rate', tieBreak: 'declared_candidate_order', settlementConvention: 'date_end_UTC', candidateLimit: MAX_CANDIDATES }
  // Evaluate every declared candidate after selection is finished. This display
  // never feeds a winner back into the walk-forward selection path.
  const laterRows = selectedRows.filter((row) => row.time >= range.from + trainDays * DAY)
  const evaluatedCandidates = candidates.map((candidate) => ({ candidate, evaluated: scenarioRows(candidate.spec, laterRows) }))
  let commonIds = new Set(evaluatedCandidates[0].evaluated.accepted.map((row) => row.eventId))
  for (const { evaluated } of evaluatedCandidates.slice(1)) {
    const eligible = new Set(evaluated.accepted.map((row) => row.eventId))
    commonIds = new Set([...commonIds].filter((id) => eligible.has(id)))
  }
  const sensitivity = {
    label: '全部候选的后窗情景敏感性', commonEventIds: [...commonIds],
    note: '按预先声明顺序展示，不按收益重新选优。各自覆盖用于描述；只有共同事件交集可用于对齐比较。所有后窗已被查看，属于探索。',
    rows: evaluatedCandidates.map(({ candidate, evaluated }) => ({
      candidateId: candidate.id, order: candidate.order, ownSummary: evaluated.summary,
      commonSummary: summarizeValidationSettlements(evaluated.accepted.filter((row) => commonIds.has(row.eventId))),
      selectedFoldCount: folds.filter((fold) => fold.selectedCandidateId === candidate.id).length,
      acceptedEventIds: evaluated.accepted.map((row) => row.eventId),
      excluded: evaluated.excluded.map((row) => ({ eventId: row.eventId, reason: row.reason })),
    })),
  }
  return {
    kind: 'parameter_walk_forward', engineVersion: VALIDATION_ENGINE_VERSION, protocol, candidates, folds,
    accepted, excluded, summary: summarizeValidationSettlements(accepted),
    baseline: { label: '候选 1 · 同事件覆盖交集', spec: candidates[0].spec, summary: summarizeValidationSettlements(accepted, { baseline: true }) },
    sensitivity, dataFingerprint: historyFingerprint(results),
    inputSnapshot: { ...copy(input), spec: freezeSpec(input.spec), resultsIndex: results, startDate: range.startDate, endDate: range.endDate, trainDays, testDays, minTrainingSamples },
    limitations: [
      '只在训练窗选择历史命中率最高的规则，不表示价值最优、收益最优或概率已经校准。假定赔率不参与选优。',
      '后窗使用统一假定赔率；赛果没有可知时间，按日期末统一结算只是情景约定，不能还原历史可执行收益或真实日内回撤。',
      '每个后窗不重叠；训练窗口会滚动覆盖过去后窗。所有数据已经可见，结果仍属于探索性历史实验。',
      '基准与策略只在同事件覆盖交集比较；选择、参数调整与重复查看均可能形成过拟合。',
    ],
  }
}

const inspectEvidence = (input, asOf) => {
  const events = new Map(); const observations = []; const quotes = []; const results = []; const excluded = []
  for (const field of ['events', 'quotes', 'results']) for (const raw of input[field] || []) {
    const id = eventKey(raw)
    if (!id || (raw.eventId && raw.eventId !== id)) { excluded.push({ ...raw, reason: 'invalid_event_identity', evidenceType: field }); continue }
    events.set(id, { eventId: id, home: raw.home, away: raw.away, kickoff: new Date(instant(raw.kickoff)).toISOString() })
    let reason = ''
    if (!text(raw.source)) reason = 'missing_source'
    else if (field === 'results') {
      const available = instant(raw.availableAt)
      const homeGoals = numeric(raw.homeGoals); const awayGoals = numeric(raw.awayGoals)
      if (available === null || available < instant(raw.kickoff) || available > asOf) reason = 'invalid_result_availability'
      else if (![homeGoals, awayGoals].every((n) => Number.isInteger(n) && n >= 0 && n <= 30)) reason = 'invalid_score'
      if (!reason) results.push({ ...raw, eventId: id, homeGoals, awayGoals, kickoff: canonicalInstant(raw.kickoff), availableAt: canonicalInstant(raw.availableAt), source: text(raw.source) })
    } else {
      const observed = instant(raw.observedAt)
      if (observed === null || observed > asOf) reason = 'invalid_observation_time'
      else if (raw.sourceUpdatedAt && (instant(raw.sourceUpdatedAt) === null || instant(raw.sourceUpdatedAt) > observed)) reason = 'invalid_source_time'
      else if (field === 'quotes' && (numeric(raw.odds) === null || numeric(raw.odds) <= 1)) reason = 'invalid_odds'
      else if (field === 'quotes' && (!['result', 'score'].includes(raw.market) || (raw.market === 'result' ? !['home', 'draw', 'away'].includes(raw.selection) : !/^(?:[0-9]|[12][0-9]|30)-(?:[0-9]|[12][0-9]|30)$/.test(raw.selection)))) reason = 'invalid_market_selection'
      else {
        const normalized = { ...raw, eventId: id, source: text(raw.source), kickoff: canonicalInstant(raw.kickoff), observedAt: canonicalInstant(raw.observedAt), tradable: raw.tradable !== false }
        if (field === 'quotes') quotes.push({ ...normalized, odds: numeric(raw.odds) })
        else observations.push(normalized)
      }
    }
    if (reason) excluded.push({ ...raw, eventId: id, reason, evidenceType: field })
  }
  return { events: [...events.values()], observations, quotes, results, excluded }
}

export const evaluatePriceReplay = (input = {}) => {
  const spec = freezeSpec(input.spec)
  const asOf = input.asOf || new Date().toISOString()
  const now = instant(asOf)
  if (now === null) throw new Error('回放截止时刻必须是带时区的 ISO 时间。')
  const evidence = copy({ events: input.evidence?.events || [], quotes: input.evidence?.quotes || [], results: input.evidence?.results || [] })
  const inspected = inspectEvidence(evidence, now)
  const eventDays = inspected.events.map((event) => new Date(instant(event.kickoff)).toISOString().slice(0, 10)).sort()
  if (!eventDays.length) throw new Error('没有可识别的带时区赛事，请先导入真实报价及赛果证据。')
  const range = dateRange(input.startDate, input.endDate, eventDays[0], eventDays.at(-1))
  const decisionLeadMinutes = integer(input.decisionLeadMinutes, 60, 1, 43200, '决策提前分钟')
  const maxQuoteAgeMinutes = integer(input.maxQuoteAgeMinutes, 60, 1, 10080, '报价最长期限分钟')
  const source = text(input.source)
  const baselineSpec = { ...spec, name: '同场主队基准', team: '', venue: 'home', outcome: spec.market === 'result' ? 'win' : null }
  const accepted = []; const excluded = [...inspected.excluded]
  for (const event of inspected.events.sort((a, b) => instant(a.kickoff) - instant(b.kickoff) || a.eventId.localeCompare(b.eventId))) {
    const kickoff = instant(event.kickoff)
    const decision = kickoff - decisionLeadMinutes * 60000
    const decisionAt = new Date(decision).toISOString()
    const item = { ...event, decisionAt }
    const reject = (reason, details = {}) => excluded.push({ ...item, reason, ...details })
    if (kickoff < range.from || kickoff >= range.until) { reject('outside_period'); continue }
    const target = quoteForSpec(spec, event)
    if (!target) { reject('outside_rule'); continue }
    if (kickoff >= now) { reject('event_not_started_asof'); continue }
    const outcomes = inspected.results.filter((row) => row.eventId === event.eventId)
    if (!outcomes.length) { reject('missing_available_result'); continue }
    if (new Set(outcomes.map((row) => `${row.homeGoals}:${row.awayGoals}`)).size > 1) { reject('conflicting_result'); continue }
    // Latest matching result availability is conservative when sources agree but
    // record different first-seen instants. No invented kickoff-based settlement.
    const result = [...outcomes].sort((a, b) => instant(b.availableAt) - instant(a.availableAt))[0]
    const baselineTarget = quoteForSpec(baselineSpec, event)
    const eventQuotes = inspected.quotes.filter((row) => row.eventId === event.eventId && instant(row.observedAt) < decision && (!source || row.source === source))
    const quoteOptions = { eventId: event.eventId, market: spec.market, at: decisionAt, maxAgeMinutes: maxQuoteAgeMinutes, source: source || undefined }
    const selectedQuote = latestQuote(eventQuotes, { ...quoteOptions, selection: target.selection })
    if (!selectedQuote.quote) { reject(selectedQuote.reason, { selection: target.selection }); continue }
    const selectedSource = selectedQuote.quote.source
    const sourceOptions = { ...quoteOptions, source: selectedSource }
    const invalidLatestQuote = (selection, chosen) => inspected.excluded.some((row) => row.evidenceType === 'quotes'
      && row.eventId === event.eventId && text(row.source) === selectedSource && row.market === spec.market && row.selection === selection
      && instant(row.observedAt) !== null && instant(row.observedAt) < decision && instant(row.observedAt) >= instant(chosen.observedAt))
    if (invalidLatestQuote(target.selection, selectedQuote.quote)) { reject('invalid_latest_quote'); continue }
    const latestStatus = inspected.observations.filter((row) => row.eventId === event.eventId && row.source === selectedSource && instant(row.observedAt) < decision)
      .sort((a, b) => instant(b.observedAt) - instant(a.observedAt))[0]
    if (latestStatus && instant(latestStatus.observedAt) >= instant(selectedQuote.quote.observedAt)) {
      const statuses = inspected.observations.filter((row) => row.eventId === event.eventId && row.source === selectedSource && row.observedAt === latestStatus.observedAt)
      if (new Set(statuses.map((row) => row.tradable)).size > 1) { reject('conflicting_event_status'); continue }
      if (latestStatus.tradable === false) { reject('market_closed'); continue }
    }
    const baselineQuote = latestQuote(eventQuotes, { ...sourceOptions, selection: baselineTarget.selection })
    if (!baselineQuote.quote) { reject(`baseline_${baselineQuote.reason}`, { selection: target.selection, baselineSelection: baselineTarget.selection }); continue }
    if (invalidLatestQuote(baselineTarget.selection, baselineQuote.quote)) { reject('baseline_invalid_latest_quote'); continue }
    // Only currently eligible observations are passed to probability inference;
    // late quotes, stale quotes and a suspended latest market cannot leak in.
    const forecastQuotes = eventQuotes.filter((row) => {
      if (row.source !== selectedSource) return false
      const latest = latestQuote(eventQuotes, { ...sourceOptions, market: row.market, selection: row.selection })
      return latest.quote && latest.quote.observedAt === row.observedAt && latest.quote.source === row.source
    })
    const forecast = resolveForecast(spec, forecastQuotes, { results: inspected.results, at: decisionAt })
    const forecastUsable = forecast.available === true && Number.isFinite(forecast.probability) && forecast.probability >= 0 && forecast.probability <= 1 && instant(forecast.generatedAt) !== null && instant(forecast.generatedAt) <= decision
    const hit = resultHit(target.selection, spec.market, result)
    const baselineHit = resultHit(baselineTarget.selection, spec.market, result)
    accepted.push({
      ...item, selection: target.selection, venue: target.venue, quoteId: selectedQuote.quote.id,
      quote: copy(selectedQuote.quote), odds: selectedQuote.quote.odds, stake: spec.stakePerMatch,
      hit, profit: spec.stakePerMatch * (hit ? selectedQuote.quote.odds - 1 : -1),
      baselineSelection: baselineTarget.selection, baselineQuote: copy(baselineQuote.quote),
      baselineOdds: baselineQuote.quote.odds, baselineHit, baselineProfit: spec.stakePerMatch * (baselineHit ? baselineQuote.quote.odds - 1 : -1),
      result: copy(result), availableAt: result.availableAt,
      forecast: forecastUsable ? copy(forecast) : { ...copy(forecast), available: false, probability: null, reason: forecast.reason || 'invalid_forecast_time_or_probability' },
    })
  }
  const scored = accepted.filter((row) => row.forecast.available)
  const forecastCoverage = {
    available: scored.length, total: accepted.length, ratio: accepted.length ? scored.length / accepted.length : null,
    brier: scored.length ? scored.reduce((sum, row) => sum + (row.forecast.probability - Number(row.hit)) ** 2, 0) / scored.length : null,
    logLoss: scored.length ? scored.reduce((sum, row) => {
      const probability = Math.max(1e-15, Math.min(1 - 1e-15, row.forecast.probability))
      return sum - Math.log(row.hit ? probability : 1 - probability)
    }, 0) / scored.length : null,
    note: '概率诊断只覆盖有合法预测的入选事件；缺少预测不影响不含概率阈值的固定规则收益回放。LogLoss 将概率截断至 [1e-15, 1−1e-15]。',
  }
  return {
    kind: 'historical_price_replay', engineVersion: VALIDATION_ENGINE_VERSION,
    protocol: { startDate: range.startDate, endDate: range.endDate, asOf, decisionLeadMinutes, maxQuoteAgeMinutes, source, pricePolicy: 'latest_strictly_before_decision', comparisonSourcePolicy: 'same_as_strategy_entry', settlementPolicy: 'availableAt_simultaneous_groups' },
    candidates: [{ id: `candidate_${contentId(spec)}`, order: 1, spec }], folds: [], accepted, excluded,
    summary: summarizeValidationSettlements(accepted), forecastCoverage,
    baseline: { label: spec.market === 'result' ? '同事件 · 主队胜报价基准' : '同事件 · 主队视角比分报价基准', spec: baselineSpec, summary: summarizeValidationSettlements(accepted, { baseline: true }) },
    dataFingerprint: evidenceFingerprint(evidence),
    inputSnapshot: { spec, evidence, startDate: range.startDate, endDate: range.endDate, asOf, decisionLeadMinutes, maxQuoteAgeMinutes, source },
    limitations: [
      '仅接纳 observedAt < decisionAt < kickoff 的真实报价；停盘、冲突、陈旧、缺失和赛果时间不合法均排除。',
      '报价与赛果来自声明的来源；本系统检验数据时间关系，不能证明外部来源的真实性，也不假设历史成交、限额、滑点或佣金。',
      '策略、基准和市场概率使用同一入场报价来源，严格使用同事件及双方报价可用的交集；交集外的候选保留在排除记录。',
      '收益按结果 availableAt 顺序、同时间一起结算。回撤是固定单位账面回撤，没有模拟可用资金与投注执行。',
      '历史数据已经可见；重复研究与筛选可能过拟合，本回放不构成独立、未查看数据上的验证。',
    ],
  }
}

const persistRun = (evaluated, reproductionOf = null) => {
  const store = getValidationStore()
  const createdAt = new Date().toISOString()
  const previous = store.exposures.find((row) => row.dataFingerprint === evaluated.dataFingerprint)
  const run = { ...evaluated, id: uid('validation'), createdAt, exposureCount: (previous?.count || 0) + 1, priorExperimentIds: previous?.runIds || [], reproductionOf }
  const exposure = { id: previous?.id || uid('exposure'), dataFingerprint: evaluated.dataFingerprint, count: run.exposureCount, runIds: [...(previous?.runIds || []), run.id], lastSeenAt: createdAt }
  const next = storage.write(assertValidationStore({ ...store, runs: [...store.runs, run], exposures: [...store.exposures.filter((row) => row.id !== exposure.id), exposure] }))
  return { run: copy(run), store: next }
}
export const runParameterValidation = (input) => persistRun(evaluateParameterValidation(input))
export const runPriceReplay = (input) => persistRun(evaluatePriceReplay(input))
export const rerunValidation = (runId) => {
  const run = getValidationStore().runs.find((item) => item.id === runId)
  if (!run) throw new Error('未找到原实验记录。')
  if (run.engineVersion !== VALIDATION_ENGINE_VERSION) throw new Error('计算版本不同，无法原样复现；原记录已保留。')
  const evaluated = run.kind === 'parameter_walk_forward' ? evaluateParameterValidation(run.inputSnapshot) : evaluatePriceReplay(run.inputSnapshot)
  return persistRun(evaluated, run.id)
}
