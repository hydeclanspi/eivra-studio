import { instant } from './quantEvidence'
import { copy, quantStore } from './quantStore'
import { normalizeEntryRecord } from './entryParsing'

export const CANDIDATE_KEY = 'eivra.quant_candidates.v1'
const storage = quantStore(CANDIDATE_KEY, ['candidates'])
export const getQuantCandidates = () => storage.read().candidates

export const candidateIssue = (candidate, now = Date.now()) => {
  const kickoff = instant(candidate.kickoff)
  const observed = instant(candidate.quote?.observedAt)
  const generated = instant(candidate.forecast?.generatedAt)
  if (kickoff === null || kickoff <= now) return '赛事已开赛或开赛时间缺失'
  if (observed === null || observed > now || now - observed > 60 * 60000) return '报价超过 60 分钟或时间无效，请返回观察区更新证据'
  if (generated === null || generated > now || generated >= kickoff) return '缺少有效的赛前预测快照'
  if (!Number.isFinite(candidate.quote?.odds) || candidate.quote.odds <= 1) return '报价不可用'
  if (!Number.isFinite(candidate.forecast?.probability) || candidate.forecast.probability < 0 || candidate.forecast.probability > 1) return '概率不可用'
  if (!candidate.eventId || !candidate.home || !candidate.away || !candidate.quote.source) return '赛事身份或来源缺失'
  return null
}

export const sendQuantCandidate = ({ orderId, planId, versionId, name, eventId, home, away, kickoff, market, selection, quote, forecast, stake }) => {
  const store = storage.read()
  const candidate = { id: `quant_candidate_${orderId}`, orderId, planId, versionId, name, eventId, home, away, kickoff, market, selection, quote: copy(quote), forecast: copy(forecast), stake, sentAt: new Date().toISOString(), status: 'inbox' }
  const issue = candidateIssue(candidate)
  if (issue) throw new Error(issue)
  const previous = store.candidates.find((item) => item.id === candidate.id)
  if (previous) return previous
  store.candidates.push(candidate)
  storage.write(store)
  return candidate
}

export const setQuantCandidateStatus = (id, status) => {
  if (!['inbox', 'ready', 'dismissed'].includes(status)) throw new Error('候选状态无效。')
  const store = storage.read()
  const candidate = store.candidates.find((item) => item.id === id)
  if (!candidate) throw new Error('候选记录不存在。')
  if (candidate.status === 'adopted') throw new Error('候选已采纳，不能重新加入候选池。')
  if (status === 'ready') {
    const issue = candidateIssue(candidate)
    if (issue) throw new Error(issue)
  }
  candidate.status = status
  candidate.reviewedAt = new Date().toISOString()
  storage.write(store)
}

export const candidateToPortfolioRow = (candidate) => {
  const label = candidate.market === 'score' ? candidate.selection : { home: '主胜', draw: '平', away: '客胜' }[candidate.selection]
  const entry = normalizeEntryRecord({ name: label, odds: candidate.quote.odds })
  return {
    key: candidate.id, researchCandidateId: candidate.id, researchCandidate: copy(candidate),
    sourceInvestmentId: null, sourceMatchId: candidate.eventId, eventId: candidate.eventId, matchId: candidate.eventId,
    matchDate: candidate.kickoff.slice(0, 10), kickoff: candidate.kickoff,
    homeTeam: candidate.home, awayTeam: candidate.away, match: `${candidate.home} vs ${candidate.away}`,
    entry: label, entries: [entry], entryMarketType: candidate.market,
    odds: candidate.quote.odds, conf: candidate.forecast.probability, calibratedP: candidate.forecast.probability,
    roughEvPercent: (candidate.quote.odds * candidate.forecast.probability - 1) * 100,
    missingLegQuote: false, mode: '常规', tysHome: 'M', tysAway: 'M', fid: .5, fseHome: .5, fseAway: .5,
    note: `Quant ${candidate.name} · ${candidate.versionId} · ${candidate.forecast.source} · 概率沿用冻结快照`,
  }
}
export const getActiveQuantCandidateRows = () => {
  // The inbox renders storage errors. Keep the rest of Portfolio usable.
  try { return getQuantCandidates().filter((candidate) => candidate.status === 'ready' && !candidateIssue(candidate)).map(candidateToPortfolioRow) }
  catch { return [] }
}
export const portfolioCandidateIssue = (candidate) => {
  try {
    const current = getQuantCandidates().find((item) => item.id === candidate.id)
    if (!current || current.status !== 'ready') return '候选已撤回或已采纳，请重新生成组合'
    return candidateIssue(current)
  } catch (error) { return error.message }
}
export const recordCandidateAdoption = (ids, investmentIds) => {
  if (!ids.length) return
  const store = storage.read()
  store.candidates.forEach((candidate) => {
    if (ids.includes(candidate.id)) { candidate.status = 'adopted'; candidate.investmentIds = Array.isArray(investmentIds) ? investmentIds : investmentIds[candidate.id] || []; candidate.adoptedAt = new Date().toISOString() }
  })
  storage.write(store)
}
