import { eventKey, instant, latestQuote, quoteForSpec, resolveForecast, resultHit } from './quantEvidence'
import { contentId, copy, immutableUnion, quantStore, stableJSON, uid } from './quantStore'

export const FORWARD_KEY = 'eivra.quant_forward.v1'
const FIELDS = ['plans', 'batches', 'candidates', 'orders', 'settlements', 'reviews', 'tasks']
const storage = quantStore(FORWARD_KEY, FIELDS)
const withDefaults = (store) => ({ ...store, disputes: store.disputes ?? [] })
const number = (value) => value == null || value === '' || typeof value === 'boolean' ? null : Number.isFinite(Number(value)) ? Number(value) : null
const timeOf = (now) => {
  const time = instant(now)
  if (time === null) throw new Error('前向观察需要带时区的有效时间。')
  return time
}
const canonical = (row) => Boolean(row?.eventId && row.eventId === eventKey(row))
const cloneVersion = (version) => ({ id: version.id, projectId: version.projectId || null, number: version.number || null, createdAt: version.createdAt, spec: copy(version.spec) })

export const emptyForwardStore = () => withDefaults(storage.empty())
export const getForwardStore = () => copy(withDefaults(assertForwardStore(storage.read())))

/** Validate imported collector records without treating an import timestamp as a decision. */
export function assertForwardStore(store, { now = new Date().toISOString() } = {}) {
  const cutoff = timeOf(now)
  storage.assert(store)
  const plans = new Map(store.plans.map((plan) => [plan.id, plan]))
  const versions = new Set()
  for (const plan of store.plans) {
    if (!plan.versionId || versions.has(plan.versionId) || !plan.spec || instant(plan.createdAt) === null || instant(plan.createdAt) > cutoff
      || instant(plan.reviewAt) === null || instant(plan.reviewAt) <= instant(plan.createdAt)
      || !Number.isInteger(plan.minSettled) || plan.minSettled < 1 || !(plan.maxDrawdown > 0)
      || ![plan.stake, plan.maxDrawdown, plan.maxQuoteAgeMinutes, plan.closingWindowMinutes].every((value) => Number.isFinite(value) && value > 0)
      || !Number.isFinite(plan.minExpectedRoi) || !Number.isInteger(plan.driftWindow) || plan.driftWindow < 2
      || plan.versionSnapshot?.id !== plan.versionId || stableJSON(plan.versionSnapshot?.spec) !== stableJSON(plan.spec)
      || instant(plan.versionSnapshot?.createdAt) === null || instant(plan.versionSnapshot.createdAt) > instant(plan.createdAt)
      || plan.stake !== number(plan.spec.stakePerMatch)) {
      throw new Error('观察计划的冻结规则或复盘条件无效，未覆盖原记录。')
    }
    versions.add(plan.versionId)
  }
  const identities = new Set()
  const orders = new Map(store.orders.map((order) => [order.id, order]))
  const candidates = new Map(store.candidates.map((candidate) => [candidate.id, candidate]))
  const batches = new Map(store.batches.map((batch) => [batch.id, batch]))
  for (const order of store.orders) {
    const plan = plans.get(order.planId)
    const identity = `${order.versionId}|${order.eventId}`
    const decision = instant(order.decisionAt)
    const quote = order.entryQuote
    const target = plan && quoteForSpec(plan.spec, order)
    const candidate = candidates.get(order.candidateId)
    if (!plan || order.versionId !== plan.versionId || identities.has(identity) || !canonical(order)
      || !target || order.selection !== target.selection || order.venue !== target.venue || order.market !== plan.spec.market
      || !candidate || candidate.orderId !== order.id || candidate.status !== 'accepted' || candidate.planId !== plan.id
      || candidate.eventId !== order.eventId || instant(candidate.decisionAt) !== decision
      || decision === null || decision > cutoff || decision <= instant(plan.createdAt) || decision >= instant(plan.reviewAt)
      || decision >= instant(order.kickoff) || !quote || !canonical(quote) || quote.eventId !== order.eventId
      || quote.market !== order.market || quote.selection !== order.selection || quote.tradable === false || !String(quote.source || '').trim()
      || instant(quote.observedAt) === null || instant(quote.observedAt) > decision
      || decision - instant(quote.observedAt) > plan.maxQuoteAgeMinutes * 60000
      || (quote.sourceUpdatedAt != null && (instant(quote.sourceUpdatedAt) === null || instant(quote.sourceUpdatedAt) > instant(quote.observedAt)))
      || quote.odds !== order.entryOdds || !Number.isFinite(order.entryOdds) || !(order.entryOdds > 1) || order.stake !== plan.stake
      || !order.forecastSnapshot?.available || !Number.isFinite(order.forecastSnapshot.probability)
      || order.forecastSnapshot.probability < 0 || order.forecastSnapshot.probability > 1
      || instant(order.forecastSnapshot.generatedAt) !== decision
      || order.forecastSnapshot.probability * quote.odds - 1 < plan.minExpectedRoi) {
      throw new Error('纸面订单缺少可验证的赛前计划、报价或概率快照，未覆盖原记录。')
    }
    identities.add(identity)
  }
  const settled = new Set()
  for (const settlement of store.settlements) {
    const order = orders.get(settlement.orderId)
    const plan = order && plans.get(order.planId)
    if (!order || settled.has(order.id) || settlement.planId !== order.planId || !canonical(settlement.result)
      || settlement.result.eventId !== order.eventId || instant(settlement.result.availableAt) === null
      || instant(settlement.settledAt) === null || instant(settlement.settledAt) > cutoff || instant(settlement.result.availableAt) > instant(settlement.settledAt)
      || instant(settlement.result.availableAt) < instant(order.kickoff)
      || ![settlement.result.homeGoals, settlement.result.awayGoals].every((value) => Number.isInteger(value) && value >= 0 && value <= 30)) throw new Error('纸面结算关联或赛果可知时间无效。')
    const hit = resultHit(order.selection, order.market, settlement.result)
    const profit = hit ? order.stake * (order.entryOdds - 1) : -order.stake
    const brier = (order.forecastSnapshot.probability - Number(hit)) ** 2
    const close = settlement.closingQuote
    if (close && (!canonical(close) || close.eventId !== order.eventId || close.market !== order.market || close.selection !== order.selection
      || close.source !== order.entryQuote.source || close.tradable === false || !(close.odds > 1)
      || instant(close.observedAt) === null || instant(close.observedAt) >= instant(order.kickoff)
      || instant(order.kickoff) - instant(close.observedAt) > plan.closingWindowMinutes * 60000
      || (close.sourceUpdatedAt != null && (instant(close.sourceUpdatedAt) === null || instant(close.sourceUpdatedAt) > instant(close.observedAt))))) throw new Error('收盘参考报价不满足同源、同盘口和赛前新鲜窗口。')
    const clv = close ? order.entryOdds / close.odds - 1 : null
    if (settlement.hit !== hit || !Number.isFinite(settlement.profit) || Math.abs(settlement.profit - profit) > 1e-9
      || !Number.isFinite(settlement.brier) || Math.abs(settlement.brier - brier) > 1e-9
      || (clv === null ? settlement.clv !== null : !Number.isFinite(settlement.clv) || Math.abs(settlement.clv - clv) > 1e-9)) {
      throw new Error('导入的盈亏、命中、Brier 或 CLV 与冻结快照不一致，拒绝写入。')
    }
    settled.add(order.id)
  }
  for (const field of ['batches', 'candidates', 'reviews', 'tasks']) {
    if (store[field].some((row) => !plans.has(row.planId))) throw new Error('前向记录关联到不存在的计划，原记录已保留。')
  }
  for (const candidate of store.candidates) {
    const batch = batches.get(candidate.batchId)
    if (!batch || batch.planId !== candidate.planId || instant(candidate.decisionAt) === null || instant(candidate.decisionAt) > cutoff
      || !['accepted', 'rejected'].includes(candidate.status) || !candidate.reason
      || (candidate.status === 'accepted' && !orders.has(candidate.orderId))) throw new Error('候选审计与批次或订单关联不完整。')
  }
  for (const row of [...store.batches, ...store.reviews]) if (instant(row.createdAt) === null || instant(row.createdAt) > cutoff) throw new Error('前向记录包含无效或未来时间。')
  for (const task of store.tasks) if (instant(task.startedAt) === null || instant(task.completedAt) === null
    || instant(task.completedAt) < instant(task.startedAt) || instant(task.completedAt) > cutoff) throw new Error('任务回执时间无效。')
  if (store.disputes !== undefined && !Array.isArray(store.disputes)) throw new Error('结算争议记录格式无效。')
  const disputeIds = new Set()
  for (const dispute of store.disputes || []) {
    const order = orders.get(dispute.orderId)
    if (!dispute.id || disputeIds.has(dispute.id) || !order || dispute.planId !== order.planId
      || instant(dispute.observedAt) === null || instant(dispute.observedAt) > cutoff || !Array.isArray(dispute.resultEvidence)
      || dispute.resultEvidence.some((row) => !canonical(row) || row.eventId !== order.eventId
        || instant(row.availableAt) === null || instant(row.availableAt) > instant(dispute.observedAt)
        || instant(row.availableAt) < instant(order.kickoff)
        || ![row.homeGoals, row.awayGoals].every((value) => Number.isInteger(value) && value >= 0 && value <= 30))
      || new Set(dispute.resultEvidence.map((row) => `${row.homeGoals}-${row.awayGoals}`)).size < 2) {
      throw new Error('结算争议缺少当时可知的冲突赛果证据。')
    }
    disputeIds.add(dispute.id)
  }
  for (const review of store.reviews) {
    const expected = forwardPlanMetrics(store, review.planId, { now: review.createdAt })
    if (review.assessment !== expected.assessment || ['settled', 'profit', 'roi', 'brier', 'clv', 'maxDrawdown']
      .some((key) => review.metrics?.[key] !== expected[key])) throw new Error('复盘结论与该时点可知的纸面证据不一致。')
  }
  return store
}

const commit = (before, next) => {
  assertForwardStore(next)
  if (stableJSON(getForwardStore()) !== stableJSON(before)) throw new Error('其他窗口已更新前向记录，本次未覆盖；请刷新后重试。')
  return storage.write(next)
}

export function createObservationPlan({ version, reviewAt, minSettled = 30, maxDrawdown, minExpectedRoi = 0,
  maxQuoteAgeMinutes = 30, closingWindowMinutes = 30, now = new Date().toISOString() } = {}) {
  const time = timeOf(now)
  if (!version?.id || !version.spec || instant(version.createdAt) === null || instant(version.createdAt) > time) throw new Error('请先保存一份有效研究版本，再开始前向观察。')
  const store = getForwardStore()
  if (store.plans.some((plan) => plan.versionId === version.id)) throw new Error('该版本已有冻结计划；调整条件请创建新的研究版本。')
  const plan = {
    id: uid('forward_plan'), versionId: version.id, versionSnapshot: cloneVersion(version), spec: copy(version.spec),
    name: version.spec.name || `研究版本 ${version.number || ''}`, createdAt: new Date(time).toISOString(), reviewAt,
    minSettled: number(minSettled), maxDrawdown: number(maxDrawdown), minExpectedRoi: number(minExpectedRoi),
    maxQuoteAgeMinutes: number(maxQuoteAgeMinutes), closingWindowMinutes: number(closingWindowMinutes),
    stake: number(version.spec.stakePerMatch), driftWindow: 10,
    quotePolicy: 'latest_observed_then_source_lexical', capturePolicy: 'decision_time_only',
  }
  const next = { ...store, plans: [...store.plans, plan] }
  commit(store, next)
  return copy(plan)
}

export const FORWARD_REASON_LABELS = {
  accepted: '已纳入纸面观察', outside_scope: '不符合版本球队或主客规则', invalid_event: '赛事身份或时间不完整',
  event_not_observed: '该时点尚未观察到赛事', event_started: '比赛已开赛', event_closed: '赛事已停售',
  plan_not_started: '计划冻结时间不早于本次决策', review_window_closed: '已到预定复盘时间，停止新增',
  risk_limit_reached: '达到预定回撤上限，暂停新增', duplicate_order: '同版本同赛事已有纸面订单',
  missing_asof_quote: '缺少当时可用的目标赔率', conflicting_quote: '同源同刻报价冲突', market_closed: '目标盘口已停售',
  stale_quote: '报价已超出新鲜窗口', forecast_unavailable: '概率模型不可用', ratings_unavailable: '评级样本不足',
  incomplete_market_distribution: '市场概率所需的完整报价不足', edge_below_threshold: '预期收益未达到计划门槛',
  invalid_forecast: '概率快照无效', result_not_available: '尚无当时可知赛果', conflicting_result: '赛果来源冲突，暂不结算',
  unresolved_result_conflict: '已有订单赛果存在争议，暂停新增',
  result_already_known: '决策前已知赛果', unknown: '不可用',
}

const appendTask = (store, plan, action, now, counts) => {
  const task = { id: uid('forward_task'), planId: plan.id, action, state: 'completed', startedAt: now, completedAt: now, counts }
  store.tasks.push(task)
  return task
}

const knownResults = (evidence, eventId, now) => (evidence.results || []).filter((row) => canonical(row)
  && row.eventId === eventId && instant(row.availableAt) !== null && instant(row.availableAt) <= now
  && instant(row.availableAt) >= instant(row.kickoff)
  && [row.homeGoals, row.awayGoals].every((value) => Number.isInteger(value) && value >= 0 && value <= 30))

const disputeIdsAt = (store, orders, evidence, time) => {
  const ids = new Set((store.disputes || []).filter((row) => instant(row.observedAt) <= time).map((row) => row.orderId))
  if (evidence) for (const order of orders) {
    const prior = store.settlements.find((row) => row.orderId === order.id && instant(row.settledAt) <= time)
    const results = knownResults(evidence, order.eventId, time)
    if (prior) results.push(prior.result)
    if (new Set(results.map((row) => `${row.homeGoals}-${row.awayGoals}`)).size > 1) ids.add(order.id)
  }
  return ids
}

const candidateEvents = (evidence) => {
  const events = new Map()
  for (const [index, row] of [...(evidence.events || []), ...(evidence.quotes || []), ...(evidence.results || [])].entries()) {
    const key = canonical(row) ? row.eventId : `invalid:${row.id || index}`
    if (!events.has(key)) events.set(key, row)
  }
  return [...events.values()].sort((a, b) => String(a.eventId || a.id).localeCompare(String(b.eventId || b.id)))
}

const captureInto = (store, plan, evidence, now, scopeEventIds = null) => {
  const time = timeOf(now)
  const scope = scopeEventIds === null ? null : new Set(scopeEventIds)
  const batch = { id: uid('forward_batch'), planId: plan.id, createdAt: now, state: 'completed', accepted: 0, rejected: 0, candidates: 0,
    scopeEventIds: scope ? [...scope] : null }
  const metrics = forwardPlanMetrics(store, plan.id, { now, evidence })
  const halted = metrics.maxDrawdown !== null && metrics.maxDrawdown >= plan.maxDrawdown
  for (const event of candidateEvents(evidence)) {
    if (scope && !scope.has(event.eventId)) continue
    const candidate = {
      id: uid('forward_candidate'), batchId: batch.id, planId: plan.id, versionId: plan.versionId,
      eventId: event.eventId || null, home: event.home || '', away: event.away || '', kickoff: event.kickoff || null,
      decisionAt: now, status: 'rejected', reason: null, orderId: null, quoteId: null,
    }
    let reason = null
    const target = quoteForSpec(plan.spec, event)
    const eventQuotes = (evidence.quotes || []).filter((row) => canonical(row) && row.eventId === event.eventId
      && instant(row.observedAt) !== null && instant(row.observedAt) <= time
      && (row.sourceUpdatedAt == null || (instant(row.sourceUpdatedAt) !== null && instant(row.sourceUpdatedAt) <= instant(row.observedAt))))
    const observations = [...(evidence.events || []), ...eventQuotes].filter((row) => canonical(row) && row.eventId === event.eventId
      && instant(row.observedAt) !== null && instant(row.observedAt) <= time)
      .sort((a, b) => instant(b.observedAt) - instant(a.observedAt))
    if (!canonical(event)) reason = 'invalid_event'
    else if (!target) reason = 'outside_scope'
    else if (time <= instant(plan.createdAt)) reason = 'plan_not_started'
    else if (time >= instant(plan.reviewAt)) reason = 'review_window_closed'
    else if (instant(event.kickoff) <= time) reason = 'event_started'
    else if (knownResults(evidence, event.eventId, time).length) reason = 'result_already_known'
    else if (!observations.length) reason = 'event_not_observed'
    else if ((evidence.events || []).filter((row) => row.eventId === event.eventId && instant(row.observedAt) <= time)
      .sort((a, b) => instant(b.observedAt) - instant(a.observedAt))[0]?.tradable === false) reason = 'event_closed'
    else if (metrics.disputed > 0) reason = 'unresolved_result_conflict'
    else if (halted) reason = 'risk_limit_reached'
    else if (store.orders.some((order) => order.versionId === plan.versionId && order.eventId === event.eventId)) reason = 'duplicate_order'
    let quote = null
    let forecast = null
    if (!reason) {
      const picked = latestQuote(eventQuotes, { eventId: event.eventId, market: plan.spec.market, selection: target.selection,
        at: now, maxAgeMinutes: plan.maxQuoteAgeMinutes })
      quote = picked.quote
      if (!quote) reason = picked.reason || 'missing_asof_quote'
      if (quote) candidate.quoteId = quote.id
    }
    if (!reason) {
      // Model inputs share the entry quote's current observation window; stale or future quotes never price a current signal.
      const modelQuotes = eventQuotes.filter((row) => time - instant(row.observedAt) <= plan.maxQuoteAgeMinutes * 60000)
      forecast = resolveForecast(plan.spec, modelQuotes, { results: evidence.results || [], at: now, source: quote.source })
      if (!forecast.available) reason = forecast.reason || 'forecast_unavailable'
      else if (!Number.isFinite(forecast.probability) || forecast.probability < 0 || forecast.probability > 1) reason = 'invalid_forecast'
      else if (forecast.probability * quote.odds - 1 < plan.minExpectedRoi) reason = 'edge_below_threshold'
      candidate.forecastSnapshot = copy(forecast)
    }
    if (!reason) {
      const order = {
        id: uid('paper_order'), planId: plan.id, versionId: plan.versionId, candidateId: candidate.id, eventId: event.eventId,
        home: event.home, away: event.away, kickoff: event.kickoff, market: plan.spec.market, selection: target.selection, venue: target.venue,
        decisionAt: now, createdAt: now, stake: plan.stake, entryOdds: quote.odds, entryQuote: copy(quote), forecastSnapshot: copy(forecast),
      }
      store.orders.push(order)
      candidate.status = 'accepted'
      candidate.orderId = order.id
      batch.accepted += 1
    } else batch.rejected += 1
    candidate.reason = reason || 'accepted'
    store.candidates.push(candidate)
    batch.candidates += 1
  }
  store.batches.push(batch)
  appendTask(store, plan, 'capture', now, { candidates: batch.candidates, accepted: batch.accepted, rejected: batch.rejected })
}

const closingFor = (order, plan, evidence) => {
  const kickoff = instant(order.kickoff)
  const picked = latestQuote((evidence.quotes || []).filter((row) => canonical(row)
    && instant(row.observedAt) < kickoff
    && (!row.sourceUpdatedAt || (instant(row.sourceUpdatedAt) !== null && instant(row.sourceUpdatedAt) <= instant(row.observedAt)))), {
    eventId: order.eventId, market: order.market, selection: order.selection, source: order.entryQuote.source,
    at: order.kickoff, maxAgeMinutes: plan.closingWindowMinutes,
  })
  return { quote: picked.quote ? copy(picked.quote) : null, reason: picked.reason }
}

const settleInto = (store, plan, evidence, now) => {
  const time = timeOf(now)
  let added = 0; let missing = 0; let conflicting = 0
  const issues = []
  for (const order of store.orders.filter((item) => item.planId === plan.id && instant(item.decisionAt) <= time)) {
    const previous = store.settlements.find((item) => item.orderId === order.id)
    const results = knownResults(evidence, order.eventId, time)
    // A later conflicting source must quarantine the old result without rewriting its historical settlement.
    if (previous && !results.some((row) => row.id === previous.result.id)) results.push(previous.result)
    if (!results.length) { missing += 1; issues.push({ orderId: order.id, reason: 'result_not_available' }); continue }
    if (new Set(results.map((row) => `${row.homeGoals}-${row.awayGoals}`)).size !== 1) {
      const id = `paper_dispute_${contentId({ orderId: order.id, resultIds: results.map((row) => row.id).sort() })}`
      if (!store.disputes.some((row) => row.id === id)) store.disputes.push({ id, planId: plan.id, orderId: order.id,
        observedAt: now, priorSettlementId: previous?.id || null, resultEvidence: copy(results), reason: 'conflicting_result' })
      conflicting += 1; issues.push({ orderId: order.id, reason: 'conflicting_result' }); continue
    }
    if (previous) continue
    if (store.disputes.some((row) => row.orderId === order.id)) {
      conflicting += 1; issues.push({ orderId: order.id, reason: 'conflicting_result' }); continue
    }
    results.sort((a, b) => instant(a.availableAt) - instant(b.availableAt) || a.source.localeCompare(b.source))
    const result = results[0]
    const hit = resultHit(order.selection, order.market, result)
    const closing = closingFor(order, plan, evidence)
    const probability = order.forecastSnapshot.probability
    store.settlements.push({
      id: uid('paper_settlement'), planId: plan.id, orderId: order.id, eventId: order.eventId, settledAt: now,
      result: copy(result), resultEvidenceIds: results.map((row) => row.id), hit, profit: hit ? order.stake * (order.entryOdds - 1) : -order.stake,
      brier: Number.isFinite(probability) ? (probability - Number(hit)) ** 2 : null,
      closingQuote: closing.quote, closingReason: closing.reason,
      clv: closing.quote ? order.entryOdds / closing.quote.odds - 1 : null,
    })
    added += 1
  }
  const task = appendTask(store, plan, 'settle', now, { added, missing, conflicting })
  task.issues = issues
}

/** Metrics use the covered, settled subset. No zero is substituted for missing evidence. */
export function forwardPlanMetrics(store, planId, { now = new Date().toISOString(), evidence = null } = {}) {
  const time = timeOf(now)
  const plan = store.plans.find((item) => item.id === planId)
  if (!plan) throw new Error('未找到观察计划。')
  const orders = store.orders.filter((order) => order.planId === planId && instant(order.decisionAt) <= time)
  const byId = new Map(orders.map((order) => [order.id, order]))
  const disputedIds = disputeIdsAt(store, orders, evidence, time)
  const settlements = store.settlements.filter((row) => row.planId === planId && byId.has(row.orderId) && !disputedIds.has(row.orderId)
    && instant(row.settledAt) <= time && instant(row.result.availableAt) <= time)
    .sort((a, b) => instant(a.result.availableAt) - instant(b.result.availableAt) || a.orderId.localeCompare(b.orderId))
  const totalStake = settlements.reduce((sum, row) => sum + byId.get(row.orderId).stake, 0)
  const profit = settlements.reduce((sum, row) => sum + row.profit, 0)
  const brierRows = settlements.filter((row) => Number.isFinite(row.brier))
  const clvRows = settlements.filter((row) => Number.isFinite(row.clv))
  // Realized equity is ordered by result availableAt; results known at the same instant enter together.
  const timeGroups = new Map()
  for (const row of settlements) {
    const at = instant(row.result.availableAt)
    timeGroups.set(at, [...(timeGroups.get(at) || []), row])
  }
  let equity = 0; let peak = 0; let drawdown = 0
  for (const rows of timeGroups.values()) {
    equity += rows.reduce((sum, row) => sum + row.profit, 0)
    peak = Math.max(peak, equity); drawdown = Math.max(drawdown, peak - equity)
  }
  const window = plan.driftWindow
  const remainingGroups = [...timeGroups.values()].reverse()
  const recent = []; const previous = []
  while (remainingGroups.length && recent.length < window) recent.unshift(...remainingGroups.shift())
  while (remainingGroups.length && previous.length < window) previous.unshift(...remainingGroups.shift())
  const roiOf = (rows) => {
    const stake = rows.reduce((sum, row) => sum + byId.get(row.orderId).stake, 0)
    return stake > 0 ? rows.reduce((sum, row) => sum + row.profit, 0) / stake : null
  }
  const driftReady = recent.length >= window && previous.length >= window
  const maxDrawdown = settlements.length ? drawdown : null
  const reviewDue = time >= instant(plan.reviewAt)
  const disputedOrderIds = orders.filter((order) => disputedIds.has(order.id)).map((order) => order.id)
  const assessment = !reviewDue ? 'observing' : disputedOrderIds.length ? 'data_disputed' : settlements.length < plan.minSettled ? 'insufficient_sample'
    : maxDrawdown >= plan.maxDrawdown ? 'risk_limit_reached' : 'review_ready'
  return {
    orders: orders.length, settled: settlements.length, disputed: disputedOrderIds.length, disputedOrderIds,
    pending: orders.length - settlements.length - disputedOrderIds.length,
    coverage: { roi: settlements.length, brier: brierRows.length, clv: clvRows.length, orders: orders.length },
    profit: settlements.length ? profit : null, roi: totalStake > 0 ? profit / totalStake : null, totalStake,
    brier: brierRows.length ? brierRows.reduce((sum, row) => sum + row.brier, 0) / brierRows.length : null,
    clv: clvRows.length ? clvRows.reduce((sum, row) => sum + row.clv, 0) / clvRows.length : null,
    maxDrawdown, equityTimeBasis: 'result_available_at_grouped', reviewDue, assessment, sampleReady: settlements.length >= plan.minSettled,
    riskHalted: maxDrawdown !== null && maxDrawdown >= plan.maxDrawdown,
    drift: { available: driftReady, previousCount: previous.length, recentCount: recent.length, requiredPerWindow: window,
      previousRoi: driftReady ? roiOf(previous) : null, recentRoi: driftReady ? roiOf(recent) : null,
      deltaRoi: driftReady ? roiOf(recent) - roiOf(previous) : null },
  }
}

const reviewInto = (store, plan, now, note = '') => {
  const metrics = forwardPlanMetrics(store, plan.id, { now })
  const fingerprint = contentId({ metrics, note })
  const latest = store.reviews.filter((row) => row.planId === plan.id).at(-1)
  if (latest?.fingerprint === fingerprint) return
  store.reviews.push({ id: uid('forward_review'), planId: plan.id, createdAt: now, assessment: metrics.assessment,
    metrics: copy(metrics), note: String(note || '').trim(), fingerprint,
    boundary: metrics.reviewDue ? '达到复盘时间后仍需人工解释证据；不自动晋级实盘。' : '预定复盘时间前仅描述当前观察，不据此宣告策略通过。' })
  appendTask(store, plan, 'review', now, { settled: metrics.settled, required: plan.minSettled, assessment: metrics.assessment })
}

/** Pure collector entry point. It never reads browser storage or display mode. */
export function processForwardBatch(store, evidence, { now = new Date().toISOString(), planId = null, action = 'all', note = '', scopeEventIds = null } = {}) {
  timeOf(now)
  assertForwardStore(store, { now })
  if (!evidence || !Array.isArray(evidence.quotes) || !Array.isArray(evidence.results)) throw new Error('前向任务缺少证据数据。')
  if (!['all', 'capture', 'settle', 'review'].includes(action)) throw new Error('未知前向任务。')
  if (scopeEventIds !== null && (!Array.isArray(scopeEventIds) || scopeEventIds.some((id) => typeof id !== 'string'))) throw new Error('采集范围必须是事件标识数组。')
  const next = copy(withDefaults(store))
  const plans = next.plans.filter((plan) => !planId || plan.id === planId)
  if (planId && !plans.length) throw new Error('未找到观察计划。')
  for (const plan of plans) {
    // Settle known results first so a risk stop applies before any new candidate is accepted.
    if (action === 'all' || action === 'settle' || action === 'review') settleInto(next, plan, evidence, now)
    if (action === 'all' || action === 'capture') captureInto(next, plan, evidence, now, scopeEventIds)
    if (action === 'all' || action === 'review') reviewInto(next, plan, now, note)
  }
  return copy(assertForwardStore(next, { now }))
}

export function runForwardTask(planId, evidence, options = {}) {
  const before = getForwardStore()
  const next = processForwardBatch(before, evidence, { ...options, planId })
  return commit(before, next)
}

/** Imported files can contribute previously frozen orders, never reconstruct historical decisions. */
export function mergeForwardStores(current, incoming) {
  assertForwardStore(current); assertForwardStore(incoming)
  return copy(assertForwardStore({ schemaVersion: 1, ...Object.fromEntries([...FIELDS, 'disputes']
    .map((field) => [field, immutableUnion(current[field] || [], incoming[field] || [])])) }))
}

export function importForwardSnapshot(payload) {
  const before = getForwardStore()
  const incoming = payload?.forwardStore || payload
  const next = mergeForwardStores(before, incoming)
  return commit(before, next)
}

export const exportForwardSnapshot = (store, evidence) => ({ schemaVersion: 1, exportedAt: new Date().toISOString(), forwardStore: copy(assertForwardStore(store)), evidence: copy(evidence) })
