import { brandLocalStorage } from './brandStorage'
import { isPreviewMode } from './displayMode'
import { previewRead, previewWrite } from './previewStore'
import { normalizeMatchDate, teamKeyForName } from './matchResults'
import { analyzeStrategy, normalizeSpec, wilsonInterval } from './quantStrategy'

/**
 * Research records are separate from the operational strategy ledger.
 * Every run freezes its rules and inputs; one storage write commits the project,
 * version and result together. Preview isolation belongs at this storage boundary.
 */
export const RESEARCH_STORAGE_KEY = 'eivra.quant_research.v1'
export const RESEARCH_ENGINE_VERSION = 'quant-research/1.0.0;quant-strategy/20261020'
export const RESEARCH_RANDOM_SEED = 20260930
const MAX_STORE_BYTES = 4 * 1024 * 1024
const KINDS = ['frequency', 'scenario', 'simulation']
const SPEC_FIELDS = [
  'name', 'team', 'venue', 'market', 'score', 'outcome', 'matchesPlanned',
  'stakePerMatch', 'oddsMode', 'manualOdds', 'probMode', 'customProb', 'bankroll',
]
const RESULT_FIELDS = [
  'id', 'matchId', 'date', 'kickoff', 'home', 'away', 'homeGoals', 'awayGoals',
  'teamIdHome', 'teamIdAway', 'teamKeyHome', 'teamKeyAway', 'source', 'league',
  'outcome_available_at',
]

const clone = (value) => JSON.parse(JSON.stringify(value))
const emptyStore = () => ({ schemaVersion: 1, projects: [], versions: [], runs: [] })
const text = (value) => String(value ?? '').trim()
const pick = (value, fields) => Object.fromEntries(fields
  .filter((field) => value?.[field] !== undefined)
  .map((field) => [field, value[field]]))
const makeId = (prefix) => `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`}`
const rowsOf = (index) => Array.isArray(index) ? index : Array.isArray(index?.matches) ? index.matches : []

const stableStringify = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

// A deterministic content identifier, not an authentication or security hash.
const fingerprint = (value) => {
  const content = stableStringify(value)
  let a = 2166136261
  let b = 2246822519
  for (let i = 0; i < content.length; i += 1) {
    a = Math.imul(a ^ content.charCodeAt(i), 16777619)
    b = Math.imul(b ^ content.charCodeAt(i), 3266489917)
  }
  return `qr1_${(a >>> 0).toString(16).padStart(8, '0')}${(b >>> 0).toString(16).padStart(8, '0')}`
}

const assertStore = (store) => {
  if (!store || store.schemaVersion !== 1 || !Array.isArray(store.projects)
    || !Array.isArray(store.versions) || !Array.isArray(store.runs)) {
    throw new Error('研究记录格式无法识别；原有数据已保留，请先备份并检查浏览器存储。')
  }
  const allIds = new Set()
  for (const item of [...store.projects, ...store.versions, ...store.runs]) {
    if (!item || typeof item.id !== 'string' || !item.id || allIds.has(item.id)) {
      throw new Error('研究记录存在损坏或重复标识；原有数据已保留。')
    }
    allIds.add(item.id)
  }
  const projectIds = new Set(store.projects.map((project) => project.id))
  const versionIds = new Set(store.versions.map((version) => version.id))
  if (store.versions.some((version) => !projectIds.has(version.projectId) || !version.spec)
    || store.runs.some((run) => !projectIds.has(run.projectId) || !versionIds.has(run.versionId) || !run.inputSnapshot || !run.result)) {
    throw new Error('研究记录关联不完整；原有数据已保留。')
  }
  return store
}

export const getResearchStore = () => {
  if (typeof window === 'undefined') return emptyStore()
  if (isPreviewMode()) return clone(assertStore(previewRead(RESEARCH_STORAGE_KEY, emptyStore())))
  const raw = brandLocalStorage.getItem(RESEARCH_STORAGE_KEY)
  if (raw === null) return emptyStore()
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('研究记录无法解析；原有数据已保留，请先备份并检查浏览器存储。')
  }
  return clone(assertStore(parsed))
}

const writeStore = (store) => {
  if (typeof window === 'undefined') throw new Error('当前环境无法保存研究记录。')
  assertStore(store)
  const serialized = JSON.stringify(store)
  // localStorage typically accounts for UTF-16 storage. Never silently prune history.
  if (serialized.length * 2 > MAX_STORE_BYTES) {
    throw new Error('研究记录已接近本地容量上限，本次未保存；请先备份记录并缩小实验数据范围。')
  }
  const preview = isPreviewMode()
  if (preview) previewWrite(RESEARCH_STORAGE_KEY, store)
  else brandLocalStorage.setItem(RESEARCH_STORAGE_KEY, serialized)
  window.dispatchEvent(new CustomEvent('eivra:data-changed', {
    detail: { key: RESEARCH_STORAGE_KEY, preview },
  }))
}

const strictDate = (input) => {
  const date = normalizeMatchDate(input)
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const timestamp = Date.parse(`${date}T00:00:00Z`)
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === date ? date : null
}

const normalizeProtocol = (protocol = {}) => {
  const normalized = {}
  for (const field of ['startDate', 'endDate', 'holdoutStart']) {
    const raw = text(protocol[field])
    const date = raw ? strictDate(raw) : ''
    if (raw && !date) throw new Error('实验日期无效，请使用真实的年月日。')
    normalized[field] = date
  }
  const { startDate, endDate, holdoutStart } = normalized
  if (startDate && endDate && startDate > endDate) throw new Error('研究开始日期不能晚于结束日期。')
  if (holdoutStart && ((startDate && holdoutStart <= startDate) || (endDate && holdoutStart > endDate))) {
    throw new Error('时间切分点必须晚于开始日期，且不晚于结束日期。')
  }
  return normalized
}

const scoreValue = (value) => {
  if (value == null || typeof value === 'boolean' || text(value) === '') return null
  const number = Number(value)
  return Number.isInteger(number) && number >= 0 && number <= 30 ? number : null
}

const historicalRows = (inputRows) => {
  const excluded = []
  const groups = new Map()
  inputRows.forEach((raw, index) => {
    const row = {
      id: text(raw?.id || raw?.matchId) || `row_${index + 1}`,
      date: strictDate(raw?.date || raw?.kickoff),
      home: text(raw?.home), away: text(raw?.away),
      homeGoals: scoreValue(raw?.homeGoals), awayGoals: scoreValue(raw?.awayGoals),
      source: text(raw?.source), league: text(raw?.league),
    }
    let reason = ''
    if (!row.date) reason = 'missing_or_invalid_date'
    else if (row.homeGoals === null || row.awayGoals === null) reason = 'invalid_score'
    else if (!row.home || !row.away) reason = 'missing_team'
    const homeKey = row.home ? teamKeyForName(row.home) : null
    const awayKey = row.away ? teamKeyForName(row.away) : null
    if (!reason && (!homeKey || !awayKey || homeKey === awayKey)) reason = 'invalid_team_identity'
    if (reason) {
      excluded.push({ ...row, reason })
      return
    }
    const eventKey = `${row.date}|${homeKey}|${awayKey}`
    const enriched = {
      ...row, eventKey, homeKey, awayKey,
      homeScore: row.homeGoals, awayScore: row.awayGoals,
    }
    groups.set(eventKey, [...(groups.get(eventKey) || []), enriched])
  })
  const valid = []
  groups.forEach((group) => {
    const scoreSet = new Set(group.map((row) => `${row.homeGoals}:${row.awayGoals}`))
    if (scoreSet.size > 1) {
      group.forEach((row) => excluded.push({ ...row, reason: 'conflicting_result' }))
      return
    }
    valid.push(group[0])
    group.slice(1).forEach((row) => excluded.push({ ...row, reason: 'duplicate' }))
  })
  valid.sort((a, b) => a.date.localeCompare(b.date) || a.eventKey.localeCompare(b.eventKey))
  return { valid, excluded }
}

const venueFor = (spec, row) => {
  if (!spec.team) return 'home'
  const key = teamKeyForName(spec.team)
  if (key === row.homeKey) return 'home'
  if (key === row.awayKey) return 'away'
  return null
}

const hitFor = (spec, row, venue) => {
  const goals = venue === 'away' ? row.awayGoals : row.homeGoals
  const opponent = venue === 'away' ? row.homeGoals : row.awayGoals
  if (spec.market === 'score') return goals === spec.score.for && opponent === spec.score.against
  if (spec.outcome === 'draw') return goals === opponent
  return spec.outcome === 'win' ? goals > opponent : goals < opponent
}

const summarize = (rows, spec, kind) => {
  const n = rows.length
  const hits = rows.filter((row) => row.hit).length
  const summary = { n, hits, hitRate: n ? hits / n : null, hitCI: n ? wilsonInterval(hits, n) : null }
  if (kind !== 'scenario') return summary
  let totalProfit = 0
  let peak = 0
  let maxDrawdown = 0
  const equityCurve = rows.map((row, index) => {
    const profit = row.hit ? spec.stakePerMatch * (spec.manualOdds - 1) : -spec.stakePerMatch
    totalProfit += profit
    peak = Math.max(peak, totalProfit)
    maxDrawdown = Math.max(maxDrawdown, peak - totalProfit)
    return { i: index + 1, id: row.id, date: row.date, profit, cum: totalProfit }
  })
  const totalStaked = n * spec.stakePerMatch
  return {
    ...summary, roi: totalStaked > 0 ? totalProfit / totalStaked : null,
    totalProfit: n ? totalProfit : null, totalStaked, maxDrawdown: n ? maxDrawdown : null,
    equityCurve, assumedOdds: spec.manualOdds,
  }
}

const evaluateHistory = (snapshot, kind) => {
  const { spec, protocol } = snapshot
  const { valid, excluded: invalid } = historicalRows(snapshot.results)
  const excluded = [...invalid]
  const included = []
  const baselineRows = []
  valid.forEach((row) => {
    let reason = ''
    if ((protocol.startDate && row.date < protocol.startDate) || (protocol.endDate && row.date > protocol.endDate)) {
      reason = 'outside_period'
    } else {
      // The context baseline intentionally uses all eligible events in the period.
      baselineRows.push({ ...row, venue: 'home', hit: hitFor(spec, row, 'home') })
      const venue = venueFor(spec, row)
      if (!venue) reason = 'outside_team'
      else if (spec.team && spec.venue !== 'any' && spec.venue !== venue) reason = 'outside_venue'
      else included.push({ ...row, venue, hit: hitFor(spec, row, venue) })
    }
    if (reason) excluded.push({ ...row, reason })
  })
  const splitEnabled = Boolean(protocol.holdoutStart)
  const training = splitEnabled ? included.filter((row) => row.date < protocol.holdoutStart) : []
  const holdout = splitEnabled ? included.filter((row) => row.date >= protocol.holdoutStart) : []
  return {
    label: kind === 'frequency' ? '历史规律研究' : '统一假定赔率情景推演',
    disclaimer: kind === 'frequency'
      ? '仅统计已知赛果的历史频率，不推导历史可执行收益。未用于预测质量评估。'
      : `所有入选比赛均按统一假定赔率 ${spec.manualOdds}、每场 ${spec.stakePerMatch} 单位结算；没有历史报价快照，不能还原历史可执行收益。`,
    counts: { source: snapshot.results.length, valid: valid.length, selected: included.length, excluded: excluded.length },
    included, excluded,
    summary: summarize(included, spec, kind),
    baseline: {
      label: '同期全部有效赛事 · 主队视角频率参考',
      disclaimer: '用于描述样本背景；与筛选样本不同，不代表策略增量收益或因果贡献。',
      summary: summarize(baselineRows, spec, 'frequency'),
    },
    split: {
      enabled: splitEnabled, holdoutStart: protocol.holdoutStart,
      training: splitEnabled ? summarize(training, spec, kind) : null,
      holdout: splitEnabled ? summarize(holdout, spec, kind) : null,
      note: '这是单次历史时间切分；切分后的数据已经可见，不能据此声明独立验证或策略有效。',
    },
    analysis: null,
  }
}

const evaluate = (snapshot, kind) => {
  if (kind !== 'simulation') return evaluateHistory(snapshot, kind)
  const analysis = analyzeStrategy(snapshot.spec, snapshot.marketMatches, {
    ratings: snapshot.ratings, kellyDivisor: snapshot.kellyDivisor, now: snapshot.capturedAt,
  })
  if (analysis.available === false) {
    throw new Error(analysis.message || '当前输入不足以进行可靠推演，本次实验未保存。')
  }
  const actualLegs = analysis.legs.filter((leg) => !leg.estimated)
  return clone({
    label: '条件概率推演',
    disclaimer: '根据当前概率和报价假设推演未来路径。补齐的未来场次与缺失报价使用估计值，结果不是历史验证；时间切分不适用于此实验。',
    counts: {
      source: snapshot.marketMatches.length, valid: snapshot.marketMatches.length,
      selected: actualLegs.length, excluded: Math.max(0, snapshot.marketMatches.length - actualLegs.length),
      estimated: analysis.legs.filter((leg) => leg.estimated).length,
    },
    included: analysis.legs,
    excluded: [],
    summary: {
      n: analysis.legs.length, hits: null, hitRate: null, hitCI: null,
      expectedProfit: analysis.monteCarlo.meanProfit,
      expectedRoi: analysis.monteCarlo.expectedRoiPct / 100,
      profitProbability: analysis.monteCarlo.pProfit,
      maxDrawdown: analysis.monteCarlo.expectedMaxDD,
    },
    split: { enabled: false, holdoutStart: '', training: null, holdout: null, note: '条件推演不使用历史时间切分。' },
    baseline: null,
    analysis,
  })
}

/** Data capability report. Current market quotes never certify historical replay. */
export const getResearchDataCoverage = (resultsIndex, marketMatches = []) => {
  const source = rowsOf(resultsIndex)
  const { valid, excluded } = historicalRows(source)
  const reasons = {}
  excluded.forEach(({ reason }) => { reasons[reason] = (reasons[reason] || 0) + 1 })
  return {
    source: source.length, valid: valid.length, excluded: excluded.length, reasons,
    firstDate: valid[0]?.date || null, lastDate: valid.at(-1)?.date || null,
    marketCount: Array.isArray(marketMatches) ? marketMatches.length : 0,
    capabilities: { frequency: valid.length > 0, scenario: valid.length > 0, simulation: true, historicalPriceReplay: false },
  }
}

const snapshotOf = ({ spec, brief = {}, protocol = {}, resultsIndex, marketMatches = [], ratings = null, kellyDivisor = 4 }, kind) => {
  const parsedDivisor = Number(kellyDivisor)
  return clone({
    capturedAt: new Date().toISOString(),
    spec: pick(normalizeSpec(spec), SPEC_FIELDS),
    brief: { hypothesis: text(brief.hypothesis), falsifier: text(brief.falsifier), notes: text(brief.notes) },
    protocol: normalizeProtocol(protocol),
    results: kind === 'simulation' ? [] : rowsOf(resultsIndex).map((row) => pick(row, RESULT_FIELDS)),
    marketMatches: kind === 'simulation' && Array.isArray(marketMatches) ? marketMatches : [],
    ratings: kind === 'simulation' ? ratings : null,
    kellyDivisor: Number.isFinite(parsedDivisor) && parsedDivisor >= 1 ? parsedDivisor : 4,
  })
}

const dataFingerprint = (snapshot, kind) => fingerprint(kind === 'simulation'
  ? { marketMatches: snapshot.marketMatches, ratings: snapshot.ratings, kellyDivisor: snapshot.kellyDivisor }
  : snapshot.results)

const makeRun = ({ projectId, versionId, kind, snapshot, reproductionOf = null }) => ({
  id: makeId('run'), projectId, versionId, kind,
  createdAt: new Date().toISOString(),
  inputSnapshot: snapshot,
  result: evaluate(snapshot, kind),
  conclusion: '',
  dataFingerprint: dataFingerprint(snapshot, kind),
  engineVersion: RESEARCH_ENGINE_VERSION,
  randomSeed: kind === 'simulation' ? RESEARCH_RANDOM_SEED : null,
  reproductionOf,
})

/** Synchronous by design: read, evaluate, one atomic write; failures propagate. */
export const createResearchExperiment = ({ projectId = null, kind = 'frequency', ...input } = {}) => {
  if (!KINDS.includes(kind)) throw new Error('不支持的实验类型。')
  const store = getResearchStore()
  const snapshot = snapshotOf(input, kind)
  const now = new Date().toISOString()
  const previous = projectId ? store.projects.find((project) => project.id === projectId) : null
  if (projectId && !previous) throw new Error('未找到该研究，请刷新记录后重试。')
  const project = previous
    ? { ...previous, updatedAt: now }
    : { id: makeId('research'), name: snapshot.spec.name || snapshot.brief.hypothesis || '未命名研究', createdAt: now, updatedAt: now }
  const version = {
    id: makeId('version'), projectId: project.id,
    number: store.versions.filter((item) => item.projectId === project.id).length + 1,
    createdAt: now, spec: snapshot.spec, brief: snapshot.brief, protocol: snapshot.protocol, kind,
  }
  const run = makeRun({ projectId: project.id, versionId: version.id, kind, snapshot })
  const next = {
    ...store,
    projects: previous ? store.projects.map((item) => item.id === project.id ? project : item) : [...store.projects, project],
    versions: [...store.versions, version], runs: [...store.runs, run],
  }
  writeStore(next)
  return clone({ project, version, run, store: next })
}

export const rerunResearchExperiment = (runId) => {
  const store = getResearchStore()
  const original = store.runs.find((run) => run.id === runId)
  if (!original) throw new Error('未找到原实验记录。')
  if (original.engineVersion !== RESEARCH_ENGINE_VERSION) {
    throw new Error('原实验使用不同的计算引擎，当前版本无法严格复现；原记录已保留。')
  }
  if (original.kind === 'simulation' && original.randomSeed !== RESEARCH_RANDOM_SEED) {
    throw new Error('原实验随机种子与当前引擎不一致，无法严格复现。')
  }
  const run = makeRun({
    projectId: original.projectId, versionId: original.versionId, kind: original.kind,
    snapshot: clone(original.inputSnapshot), reproductionOf: original.id,
  })
  const project = { ...store.projects.find((item) => item.id === run.projectId), updatedAt: run.createdAt }
  const version = store.versions.find((item) => item.id === run.versionId)
  const next = {
    ...store,
    projects: store.projects.map((item) => item.id === project.id ? project : item),
    runs: [...store.runs, run],
  }
  writeStore(next)
  return clone({ project, version, run, store: next })
}

export const saveResearchConclusion = (runId, conclusion) => {
  const store = getResearchStore()
  const original = store.runs.find((run) => run.id === runId)
  if (!original) throw new Error('未找到要记录结论的实验。')
  const run = { ...original, conclusion: text(conclusion), conclusionUpdatedAt: new Date().toISOString() }
  const next = { ...store, runs: store.runs.map((item) => item.id === runId ? run : item) }
  writeStore(next)
  return clone(run)
}

export const compareResearchRuns = (left, right) => {
  const reasons = []
  if (!left || !right) return { comparable: false, reasons: ['请选择两个实验。'], changedFields: [], deltas: {} }
  if (left.kind !== right.kind) reasons.push('实验类型不同。')
  if (!left.dataFingerprint || left.dataFingerprint !== right.dataFingerprint) reasons.push('数据或行情快照不同。')
  if (stableStringify(left.inputSnapshot?.protocol) !== stableStringify(right.inputSnapshot?.protocol)) reasons.push('实验区间或切分协议不同。')
  if (!left.engineVersion || left.engineVersion !== right.engineVersion) reasons.push('计算引擎版本不同。')
  if (left.randomSeed !== right.randomSeed) reasons.push('随机种子不同。')
  if (left.kind !== 'frequency' && right.kind !== 'frequency') {
    for (const field of ['stakePerMatch', 'bankroll']) {
      if (left.inputSnapshot?.spec?.[field] !== right.inputSnapshot?.spec?.[field]) {
        reasons.push('投入或资金假设不同；不能直接将资金差异当作策略收益提升。')
        break
      }
    }
    if (left.kind === 'scenario' && left.inputSnapshot?.spec?.manualOdds !== right.inputSnapshot?.spec?.manualOdds) {
      reasons.push('统一假定赔率不同；仅比较价格假设的变化。')
    }
  }
  const changedFields = SPEC_FIELDS.filter((field) =>
    stableStringify(left.inputSnapshot?.spec?.[field]) !== stableStringify(right.inputSnapshot?.spec?.[field]))
    .map((field) => ({ field, before: left.inputSnapshot?.spec?.[field], after: right.inputSnapshot?.spec?.[field] }))
  const deltas = {}
  if (!reasons.length) {
    for (const metric of ['n', 'hits', 'hitRate', 'roi', 'totalProfit', 'expectedProfit', 'expectedRoi', 'maxDrawdown']) {
      const before = left.result?.summary?.[metric]
      const after = right.result?.summary?.[metric]
      if (Number.isFinite(before) && Number.isFinite(after)) deltas[metric] = after - before
    }
  }
  return {
    comparable: reasons.length === 0, reasons, changedFields, deltas,
    note: '差异为右侧减左侧。相同输入条件允许描述性比较，不能据此推断因果贡献或独立验证通过。',
  }
}
