/**
 * ============================================================================
 *  matchResults.js — 历史赛果层（回测 / 自动结算 / 策略发现的事实底座）
 * ============================================================================
 *
 * 多来源赛果合并进同一个 localStorage 索引（dugou.results_cache.v1）：
 *   1. sporttery 官方接口 getMatchResultV1.qry —— fetchMatchResults()
 *      与 marketOdds.js 同一个 uniform 网关：浏览器可直连（CORS 开放），
 *      但 WAF（TencentEdgeOne）会拦非浏览器客户端——任何失败都只返回
 *      { ok:false, reason }，绝不抛异常，调用方必须能降级。
 *      注意：该接口的返回结构尚未实测确认，normalizeMatchResults 按
 *      多候选字段 + 多候选路径的防御式写法解析，垃圾行直接丢弃。
 *   2. openfootball 联赛历史包 —— fetchOpenFootballResults()；404 静默跳过。
 *   3. 手工录入 —— importResultRows / importResultsCsv。
 *   4. 已结算投资里的真实比分 —— harvestSettledScores(investments)
 *      （SettlePage 把赛果写在每场 match.results 文本里，如 "2-0"；
 *      部分记录还有结构化的 match.actual_score = {home, away}）。
 *   同键不同比分按 manual > settled > sporttery > openfootball 解决。
 *
 * 纪律：
 *   - 索引按 `date|teamIdHome|teamIdAway` 归一化去重；队名→teamId 走
 *     严格解析：归一化（大小写/变音/标点/通用后缀/连接词）后整键精确
 *     命中 TEAM_ALIAS_LIBRARY + EXTRA_TEAM_NAMES，绝不做子串匹配——否则
 *     "Rayo Vallecano de Madrid" 会被并进 Real Madrid、"Paris FC" 会被
 *     并进 PSG。匹配不上就保留原始队名、teamId 置 null，绝不硬猜。
 *   - 宽松的子串解析只保留给用户输入搜索（resolveTeamIdentityLoose），
 *     数据行一律不调用。
 *   - preview 模式下读写全部落到 previewStore，与 quantStrategy.js 同口径。
 *
 * @module matchResults
 */

import { TEAM_ALIAS_LIBRARY } from './localData'
import { parseFinalScore } from './readQuality'
import { isPreviewMode } from './displayMode'
import { previewRead, previewWrite } from './previewStore'

const RESULTS_KEY = 'dugou.results_cache.v1'
// 注意：不能用模块级常量固化 typeof window —— 测试里 window 是 import 之后才
// stub 出来的；每次读写都动态判断。
const isBrowser = () => typeof window !== 'undefined'

export const MATCH_RESULTS_ENDPOINT =
  'https://webapi.sporttery.cn/gateway/uniform/football/getMatchResultV1.qry'

const text = (value) => String(value ?? '').trim()

const toGoalCount = (value) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 30 ? parsed : Number.NaN
}

/**
 * 把各种日期写法收成 'YYYY-MM-DD'：
 * '2026-09-20' / '2026/9/2' / '2026-09-20 15:00' / '20260920' / ISO 时间戳。
 * 解析不出来返回 null（调用方自行决定要不要这条记录）。
 */
export const normalizeMatchDate = (value) => {
  if (value == null) return null
  const raw = String(value).trim()
  if (!raw) return null
  const direct = raw.match(/(\d{4})[-/年.](\d{1,2})[-/月.](\d{1,2})/)
  if (direct) {
    const year = Number(direct[1])
    const month = Number(direct[2])
    const day = Number(direct[3])
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }
  const compact = raw.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (compact) return `${compact[1]}-${compact[2]}-${compact[3]}`
  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10)
  return null
}

// ── 队名 → teamId ─────────────────────────────────────────────────────

const normalizeName = (value) => text(value).toLowerCase()

/**
 * 跨来源的稳定队名：去掉常见俱乐部后缀（FC/AFC/CF/SC/SV/AC）、标点与空格，
 * 小写并折叠拉丁重音。未入库球队因此仍能聚合到 name:<normalized> 伪 teamKey。
 */
export const normalizeTeamName = (value) => {
  const withoutSuffix = text(value).replace(/(?:\s+(?:afc|cf|sc|sv|ac|fc))+\s*$/i, '')
  const folded = withoutSuffix.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  return folded.replace(/[^a-z0-9\u4e00-\u9fff]+/gi, '').toLowerCase()
}

/** 有 teamId 用 teamId；否则使用归一化队名伪 id，绝不回退到易冲突的原始大小写。 */
export const teamKeyForName = (name) => {
  const identity = resolveTeamIdentity(name)
  if (identity?.teamId) return identity.teamId
  const normalized = normalizeTeamName(name) || normalizeName(name)
  return normalized ? `name:${normalized}` : null
}

// 严格解析里要抹掉的通用俱乐部 token 与连接词。只处理首尾 token，
// 避免把队名内部的字母序列误伤（如 "Inter" 中的 "int"）。
const STRICT_CLUB_SUFFIXES = new Set(['fc', 'afc', 'cf', 'sc', 'sv', 'ac', 'as', 'ss', 'rc', 'rcd', 'ud', 'sd', 'cfc'])
const STRICT_CONNECTOR_WORDS = new Set(['de', 'del', 'do', 'da', 'of'])

// 单独出现时无法区分同城球队的通用键，严格模式下一律拒绝：
//   paris   → Paris FC ≠ Paris Saint-Germain
//   madrid  → Real Madrid / Atlético / Rayo 三家共用城市名
const STRICT_AMBIGUOUS_KEYS = new Set(['paris', 'madrid'])

/**
 * 严格归一化（仅用于数据行匹配）：小写、去变音、去标点、去连接词，
 * 再剥掉队名首尾的通用俱乐部 token（"AFC Bournemouth" → bournemouth、
 * "AS Roma" → roma），最后把 token 直接拼接。
 * 不做任何子串匹配——"Rayo Vallecano de Madrid" 归一化后是
 * "rayovallecanomadrid"，永远不会命中 "realmadrid"。
 */
export const normalizeStrictTeamName = (value) => {
  const folded = text(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  const tokens = folded
    .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !STRICT_CONNECTOR_WORDS.has(token))
  while (tokens.length > 0 && STRICT_CLUB_SUFFIXES.has(tokens[0])) tokens.shift()
  while (tokens.length > 0 && STRICT_CLUB_SUFFIXES.has(tokens[tokens.length - 1])) tokens.pop()
  return tokens.join('')
}

/**
 * 严格归一化仍覆盖不到的常见全名。值必须是 TEAM_ALIAS_LIBRARY 里已有的
 * teamId；"union berlin" / "espanyol" / "rayo vallecano" 暂无库条目，
 * 因此不在这里强行编造身份（它们会落到稳定的 name: 伪 teamKey）。
 */
export const EXTRA_TEAM_NAMES = Object.freeze({
  'fc bayern munchen': 'bayern',
  'bayern munchen': 'bayern',
  'internazionale milano': 'inter',
  'fc internazionale milano': 'inter',
  'fc internazionale': 'inter',
  'paris saint-germain': 'psg',
  'paris saint germain': 'psg',
  'atletico de madrid': 'atletico',
  'club atletico de madrid': 'atletico',
  'athletic club': 'athletic',
  'real sociedad': 'realsociedad',
  'real betis': 'betis',
  'wolverhampton wanderers': 'wolves',
  'tottenham hotspur': 'tottenham',
  'brighton & hove albion': 'brighton',
  'newcastle united': 'newcastle',
  'nottingham forest': 'nottingham',
  'west ham united': 'westham',
  'leicester city': 'leicester',
  'leeds united': 'leeds',
  'sunderland afc': 'sunderland',
  'crystal palace': 'crystalpalace',
  'aston villa': 'astonvilla',
  'manchester united': 'manutd',
  'manchester city': 'mancity',
  'real madrid': 'realmadrid',
  'fc barcelona': 'barcelona',
  'ac milan': 'milan',
  'as roma': 'roma',
  'ssc napoli': 'napoli',
  'ss lazio': 'lazio',
  'juventus': 'juventus',
  'bayer leverkusen': 'leverkusen',
  'borussia dortmund': 'dortmund',
  'borussia monchengladbach': 'gladbach',
  'eintracht frankfurt': 'frankfurt',
  'rb leipzig': 'leipzig',
  'vfb stuttgart': 'stuttgart',
})

// 精确键 → 身份。构造时检测别名撞车：同一个归一化键若指向两支不同球队，
// 该键整体作废（宁可留 name: 伪 id，也不把两支球队合并）。
const STRICT_IDENTITY_LOOKUP = (() => {
  const entryById = new Map(TEAM_ALIAS_LIBRARY.map((entry) => [entry.teamId, entry]))
  const lookup = new Map()
  const ambiguous = new Set()
  const add = (alias, entry) => {
    const key = normalizeStrictTeamName(alias)
    if (!key || STRICT_AMBIGUOUS_KEYS.has(key)) return
    const existing = lookup.get(key)
    if (existing && existing.teamId !== entry.teamId) {
      ambiguous.add(key)
      return
    }
    lookup.set(key, { teamId: entry.teamId, teamName: entry.teamName })
  }
  TEAM_ALIAS_LIBRARY.forEach((entry) => {
    ;[entry.teamName, ...(entry.abbreviations || [])].forEach((alias) => add(alias, entry))
  })
  ambiguous.forEach((key) => lookup.delete(key))
  // 人工整理的全名映射优先于别名库的模糊键（例如 "as roma"）。
  Object.entries(EXTRA_TEAM_NAMES).forEach(([alias, teamId]) => {
    const entry = entryById.get(teamId)
    const key = normalizeStrictTeamName(alias)
    if (entry && key) lookup.set(key, { teamId: entry.teamId, teamName: entry.teamName })
  })
  return lookup
})()

/**
 * 数据摄入用的严格解析：归一化后只做整键精确匹配（别名库 + EXTRA_TEAM_NAMES），
 * 绝不回退到子串。命中返回 { teamId, teamName }，未命中返回 null。
 */
export const resolveTeamIdentity = (name) => {
  const key = normalizeStrictTeamName(name)
  if (!key) return null
  return STRICT_IDENTITY_LOOKUP.get(key) || null
}

/**
 * 宽松解析（仅供 UI 搜索 / 自动补全）：先整条目精确命中，再退到双向子串，
 * 取最长命中别名以减小歧义。数据行绝不能调用它——"madrid" / "milan" /
 * "barcelona" 这类城市词会把同城不同球队折叠成一支。
 */
export const resolveTeamIdentityLoose = (name) => {
  const needle = normalizeName(name)
  if (!needle) return null

  for (const entry of TEAM_ALIAS_LIBRARY) {
    const aliases = [entry.teamName, ...(entry.abbreviations || [])]
    if (aliases.some((alias) => normalizeName(alias) === needle)) {
      return { teamId: entry.teamId, teamName: entry.teamName }
    }
  }

  let best = null
  const normalizedNeedle = normalizeTeamName(name)
  TEAM_ALIAS_LIBRARY.forEach((entry) => {
    const aliases = [entry.teamName, ...(entry.abbreviations || [])]
    aliases.forEach((alias) => {
      // 后缀与标点归一化后再做子串匹配：FC/AFC 等通用后缀不会被当成队名。
      const normalizedAlias = normalizeTeamName(alias)
      if (!normalizedNeedle) return
      // 英文 2–3 字母缩写只允许上面的精确命中；否则 bra/ars/afc 会误中
      // zebra / arbitrary 等无关队名。中文别名仍允许双子串匹配。
      const isCjk = /[\u4e00-\u9fff]/.test(normalizedAlias)
      if (normalizedAlias.length < (isCjk ? 2 : 4)) return
      if (normalizedNeedle.includes(normalizedAlias) || normalizedAlias.includes(normalizedNeedle)) {
        if (!best || normalizedAlias.length > best.aliasLength) {
          best = { teamId: entry.teamId, teamName: entry.teamName, aliasLength: normalizedAlias.length }
        }
      }
    })
  })
  return best ? { teamId: best.teamId, teamName: best.teamName } : null
}

// ── 行规范化 ──────────────────────────────────────────────────────────

/** 从一行（任何来源）里抠出最终比分；抠不出返回 null。 */
const extractScore = (row) => {
  const candidates = [row.fullScore, row.score, row.sectionsNo1, row.full_score, row.matchScore, row.resultScore]
  for (const candidate of candidates) {
    if (typeof candidate !== 'string' || !candidate.trim()) continue
    const parsed = parseFinalScore(candidate)
    if (parsed && parsed.home <= 30 && parsed.away <= 30) return parsed
  }
  const home = toGoalCount(row.homeScore ?? row.homeGoals ?? row.home_goal ?? row.homeTeamScore)
  const away = toGoalCount(row.awayScore ?? row.awayGoals ?? row.away_goal ?? row.awayTeamScore)
  if (Number.isFinite(home) && Number.isFinite(away)) return { home, away }
  return null
}

/** 把接口的一行原始数据映射成标准行；缺队名或比分 → null（丢弃）。 */
const mapResultRow = (row, fallbackDate = null) => {
  if (!row || typeof row !== 'object') return null
  const home = text(row.homeTeamAbbName || row.homeTeamAllName || row.home || row.homeName || row.homeTeam)
  const away = text(row.awayTeamAbbName || row.awayTeamAllName || row.away || row.awayName || row.awayTeam)
  const score = extractScore(row)
  if (!home || !away || !score) return null
  return {
    date: normalizeMatchDate(row.matchDate || row.businessDate || row.date || row.kickoff || row.matchTime) || fallbackDate,
    home,
    away,
    homeGoals: score.home,
    awayGoals: score.away,
  }
}

/** value 下第一个"长得像赛果列表"的数组：先按已知键名找，再退一步找任意对象数组。 */
const findRowArray = (value) => {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return null
  const knownKeys = ['matchResultList', 'subMatchList', 'list', 'matchList', 'matchInfoList', 'rows', 'data']
  for (const key of knownKeys) {
    if (Array.isArray(value[key])) return value[key]
  }
  for (const key of Object.keys(value)) {
    const child = value[key]
    if (Array.isArray(child) && child.some((item) => item && typeof item === 'object')) return child
  }
  return null
}

/**
 * 防御式解析 getMatchResultV1 的返回体。结构未实测确认，因此：
 * 先找到第一个候选数组；数组元素若本身还挂着 subMatchList（分组结构），
 * 展开子列表并继承分组的 businessDate；每行走宽容字段映射，垃圾行丢弃。
 * 返回 { ok, matches, reason }，matches 是标准化行（未写缓存）。
 */
export const normalizeMatchResults = (payload) => {
  if (!payload || typeof payload !== 'object') return { ok: false, matches: [], reason: 'unexpected_payload' }
  if (payload.success === false || (payload.errorCode != null && String(payload.errorCode) !== '0')) {
    return { ok: false, matches: [], reason: `api_error_${payload.errorCode ?? 'unknown'}` }
  }
  const rows = findRowArray(payload.value)
  if (!rows) return { ok: false, matches: [], reason: 'unexpected_payload' }

  const matches = []
  rows.forEach((item) => {
    if (item && Array.isArray(item.subMatchList)) {
      const groupDate = normalizeMatchDate(item.businessDate || item.matchDate || item.date)
      item.subMatchList.forEach((child) => {
        const mapped = mapResultRow(child, groupDate)
        if (mapped) matches.push(mapped)
      })
      return
    }
    const mapped = mapResultRow(item)
    if (mapped) matches.push(mapped)
  })

  if (matches.length === 0) return { ok: false, matches: [], reason: 'no_valid_results' }
  return { ok: true, matches, reason: null }
}

// ── 缓存读写（preview 模式落 previewStore）─────────────────────────────

const readJSON = (key, fallback) => {
  if (!isBrowser()) return fallback
  if (isPreviewMode()) return previewRead(key, fallback)
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const writeJSON = (key, value) => {
  if (!isBrowser()) return
  if (isPreviewMode()) {
    previewWrite(key, value)
    window.dispatchEvent(new CustomEvent('dugou:data-changed', { detail: { key, preview: true } }))
    return
  }
  window.localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent('dugou:data-changed', { detail: { key } }))
}

const readCache = () => {
  const cache = readJSON(RESULTS_KEY, null)
  if (!cache || typeof cache !== 'object' || !Array.isArray(cache.matches)) {
    return { fetchedAt: null, matches: [], conflicts: 0 }
  }
  return { ...cache, conflicts: Number(cache.conflicts) || 0 }
}

/** 去重键：date + 双方 teamId；teamId 缺失时用去后缀/标点的归一化队名兜底。 */
const dedupeKeyFor = (row) =>
  `${row.date || ''}|${row.teamIdHome || normalizeTeamName(row.home)}|${row.teamIdAway || normalizeTeamName(row.away)}`

const SOURCE_PRIORITY = { openfootball: 1, sporttery: 2, settled: 3, manual: 4 }
const sourcePriority = (source) => SOURCE_PRIORITY[source] || 0
const sameScore = (a, b) => a.homeGoals === b.homeGoals && a.awayGoals === b.awayGoals

/** 标准化 + 补 teamId/teamKey；不合法（缺队名/比分非负整数）返回 null。 */
const enrichRow = (row, source) => {
  if (!row || typeof row !== 'object') return null
  const home = text(row.home)
  const away = text(row.away)
  const homeGoals = toGoalCount(row.homeGoals)
  const awayGoals = toGoalCount(row.awayGoals)
  if (!home || !away || !Number.isFinite(homeGoals) || !Number.isFinite(awayGoals)) return null
  const homeIdentity = resolveTeamIdentity(home)
  const awayIdentity = resolveTeamIdentity(away)
  const normalizedNameHome = normalizeTeamName(home)
  const normalizedNameAway = normalizeTeamName(away)
  return {
    date: normalizeMatchDate(row.date) || null,
    home,
    away,
    homeGoals,
    awayGoals,
    teamIdHome: homeIdentity?.teamId || null,
    teamIdAway: awayIdentity?.teamId || null,
    normalizedNameHome,
    normalizedNameAway,
    teamKeyHome: homeIdentity?.teamId || (normalizedNameHome ? `name:${normalizedNameHome}` : null),
    teamKeyAway: awayIdentity?.teamId || (normalizedNameAway ? `name:${normalizedNameAway}` : null),
    source: text(source) || 'manual',
  }
}

/**
 * 校验 + 合并一批行进缓存。同键不同比分是冲突，按
 * manual > settled > sporttery > openfootball 解决并累计 conflicts；
 * 同分重复只 skipped，新增键才 added，覆盖更新记 updated。
 */
export const importResultRows = (rowsInput, { source = 'manual' } = {}) => {
  const rows = Array.isArray(rowsInput) ? rowsInput : []
  const cache = readCache()
  const byKey = new Map(cache.matches.map((row) => [dedupeKeyFor(row), row]))
  let added = 0
  let skipped = 0
  let invalid = 0
  let updated = 0
  let conflicts = 0
  rows.forEach((raw) => {
    const enriched = enrichRow(raw, source)
    if (!enriched) {
      invalid += 1
      return
    }
    const key = dedupeKeyFor(enriched)
    const existing = byKey.get(key)
    if (existing) {
      if (sameScore(existing, enriched)) {
        skipped += 1
        return
      }
      conflicts += 1
      if (sourcePriority(enriched.source) > sourcePriority(existing.source)) {
        byKey.set(key, enriched)
        updated += 1
      } else {
        skipped += 1
      }
      return
    }
    byKey.set(key, enriched)
    added += 1
  })
  if (added > 0 || updated > 0 || conflicts > 0) {
    writeJSON(RESULTS_KEY, {
      fetchedAt: new Date().toISOString(),
      matches: [...byKey.values()],
      conflicts: cache.conflicts + conflicts,
    })
  }
  return { ok: true, added, skipped, invalid, updated, conflicts, total: byKey.size }
}

// ── 来源 1：sporttery 接口 ────────────────────────────────────────────

const formatDateParam = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

/**
 * 抓最近 days 天的官方赛果并合并进缓存。与 marketOdds.fetchOfficialMarketOdds
 * 同口径：AbortController 超时、永不抛异常；WAF 拦截 / 网络错误 / 结构不符
 * 都收敛成 { ok:false, reason }。成功时返回 { ok:true, matches, reason:null, fetchedAt }。
 */
export const fetchMatchResults = async ({ days = 30, fetchImpl, timeoutMs = 12000 } = {}) => {
  const doFetch = fetchImpl || (typeof fetch === 'function' ? fetch : null)
  if (!doFetch) return { ok: false, matches: [], reason: 'fetch_unavailable', fetchedAt: null }

  const end = new Date()
  const begin = new Date(end.getTime() - Math.max(1, Number(days) || 30) * 24 * 60 * 60 * 1000)
  const params = new URLSearchParams({
    matchPage: '1',
    matchBeginDate: formatDateParam(begin),
    matchEndDate: formatDateParam(end),
    leagueId: '',
    pageSize: '100',
    pageNo: '1',
    isFix: '0',
    pcOrWap: '1',
  })
  const url = `${MATCH_RESULTS_ENDPOINT}?${params.toString()}`

  const controller = typeof AbortController === 'function' ? new AbortController() : null
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null
  try {
    const response = await doFetch(url, {
      headers: { Accept: 'application/json, text/plain, */*' },
      signal: controller?.signal,
    })
    if (!response?.ok) return { ok: false, matches: [], reason: `http_${response?.status ?? 'error'}`, fetchedAt: null }
    const payload = await response.json()
    const normalized = normalizeMatchResults(payload)
    if (!normalized.ok) return { ...normalized, fetchedAt: null }
    const merged = importResultRows(normalized.matches, { source: 'sporttery' })
    return { ...normalized, fetchedAt: new Date().toISOString(), added: merged.added, skipped: merged.skipped }
  } catch (error) {
    const reason = error?.name === 'AbortError' ? 'timeout' : 'network_error'
    return { ok: false, matches: [], reason, fetchedAt: null }
  } finally {
    if (timer) clearTimeout(timer)
  }
}

// ── 来源 2：openfootball 联赛历史赛果 ──────────────────────────────────

export const OPENFOOTBALL_BASE_URL = 'https://raw.githubusercontent.com/openfootball/football.json/master'

/** openfootball 的 team1/team2/score.ft 映射；缺比分或未开赛的行直接丢弃。 */
export const normalizeOpenFootballResults = (payload) => {
  const rows = Array.isArray(payload?.matches) ? payload.matches : Array.isArray(payload) ? payload : null
  if (!rows) return { ok: false, matches: [], reason: 'unexpected_payload' }
  const matches = []
  rows.forEach((row) => {
    if (!row || typeof row !== 'object') return
    const home = text(row.team1)
    const away = text(row.team2)
    const fullTime = Array.isArray(row.score?.ft) ? row.score.ft : null
    if (!home || !away || !fullTime) return
    const homeGoals = toGoalCount(fullTime[0])
    const awayGoals = toGoalCount(fullTime[1])
    if (!Number.isFinite(homeGoals) || !Number.isFinite(awayGoals)) return
    matches.push({
      date: normalizeMatchDate(row.date),
      home,
      away,
      homeGoals,
      awayGoals,
    })
  })
  if (matches.length === 0) return { ok: false, matches: [], reason: 'no_valid_results' }
  return { ok: true, matches, reason: null }
}

/**
 * 逐联赛、逐赛季顺序抓取 openfootball JSON（不并发打 GitHub）。
 * 404（未发布赛季）静默跳过；任何单点失败只记录到 sources，不中断后续请求。
 */
export const fetchOpenFootballResults = async ({
  leagues = ['en.1', 'es.1', 'de.1', 'it.1', 'fr.1'],
  seasons = ['2024-25', '2025-26'],
  fetchImpl,
  timeoutMs = 12000,
} = {}) => {
  const doFetch = fetchImpl || (typeof fetch === 'function' ? fetch : null)
  const sources = []
  if (!doFetch) return { ok: false, added: 0, skipped: 0, sources, reason: 'fetch_unavailable' }

  let added = 0
  let skipped = 0
  let updated = 0
  let conflicts = 0
  let successes = 0
  let lastReason = null
  for (const league of leagues) {
    for (const season of seasons) {
      const url = `${OPENFOOTBALL_BASE_URL}/${encodeURIComponent(season)}/${encodeURIComponent(league)}.json`
      const controller = typeof AbortController === 'function' ? new AbortController() : null
      const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null
      try {
        const response = await doFetch(url, {
          headers: { Accept: 'application/json, text/plain, */*' },
          signal: controller?.signal,
        })
        if (!response?.ok) {
          const reason = `http_${response?.status ?? 'error'}`
          sources.push({ league, season, ok: false, added: 0, reason })
          if (response?.status !== 404) lastReason = reason
          continue
        }
        const payload = await response.json()
        const normalized = normalizeOpenFootballResults(payload)
        if (!normalized.ok) {
          sources.push({ league, season, ok: false, added: 0, reason: normalized.reason })
          lastReason = normalized.reason
          continue
        }
        const merged = importResultRows(normalized.matches, { source: 'openfootball' })
        added += merged.added
        skipped += merged.skipped
        updated += merged.updated
        conflicts += merged.conflicts
        successes += 1
        sources.push({ league, season, ok: true, added: merged.added })
      } catch (error) {
        const reason = error?.name === 'AbortError' ? 'timeout' : 'network_error'
        sources.push({ league, season, ok: false, added: 0, reason })
        lastReason = reason
      } finally {
        if (timer) clearTimeout(timer)
      }
    }
  }

  if (successes === 0) {
    return { ok: false, added, skipped, updated, conflicts, sources, reason: lastReason || 'no_data' }
  }
  return { ok: true, added, skipped, updated, conflicts, sources, reason: null }
}

// ── 手工 CSV 导入 ────────────────────────────────────────────────────────

const CSV_HEADER_ALIASES = {
  date: ['date', '日期', 'matchdate', '比赛日期'],
  home: ['home', '主队', 'team1', 'hometeam', 'home_team'],
  away: ['away', '客队', 'team2', 'awayteam', 'away_team'],
  homeGoals: ['homegoals', '主队进球', 'home_score', 'ft_home', 'homescore'],
  awayGoals: ['awaygoals', '客队进球', 'away_score', 'ft_away', 'awayscore'],
}

const splitCsvLine = (line, delimiter) => {
  const fields = []
  let current = ''
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        quoted = !quoted
      }
    } else if (char === delimiter && !quoted) {
      fields.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  fields.push(current.trim())
  return fields
}

const countDelimiterOutsideQuotes = (line, delimiter) => {
  let count = 0
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    if (line[i] === '"') quoted = !quoted
    else if (line[i] === delimiter && !quoted) count += 1
  }
  return count
}

/** 宽容 CSV/分号文本导入；首行必须是表头，返回与 importResultRows 相同的汇总。 */
export const importResultsCsv = (input) => {
  const lines = String(input ?? '')
    .replace(/^\uFEFF/, '')
    .split(/\r\n|\n|\r/)
    .filter((line) => line.trim())
  if (lines.length === 0) {
    return { ok: false, added: 0, skipped: 0, invalid: 0, updated: 0, conflicts: 0, total: getResultsIndex().matches.length, reason: 'empty_csv' }
  }
  const headerLine = lines[0]
  const delimiter = countDelimiterOutsideQuotes(headerLine, ';') > countDelimiterOutsideQuotes(headerLine, ',') ? ';' : ','
  const headers = splitCsvLine(headerLine, delimiter).map((header) => header.trim().toLowerCase())
  const columnFor = (field) => headers.findIndex((header) => CSV_HEADER_ALIASES[field].includes(header))
  const columns = Object.fromEntries(Object.keys(CSV_HEADER_ALIASES).map((field) => [field, columnFor(field)]))
  const missing = Object.entries(columns).filter(([, index]) => index < 0).map(([field]) => field)
  if (missing.length > 0) {
    return {
      ok: false,
      added: 0,
      skipped: 0,
      invalid: Math.max(0, lines.length - 1),
      updated: 0,
      conflicts: 0,
      total: getResultsIndex().matches.length,
      reason: `missing_columns:${missing.join(',')}`,
    }
  }
  const rows = lines.slice(1).map((line) => {
    const fields = splitCsvLine(line, delimiter)
    return Object.fromEntries(Object.entries(columns).map(([field, index]) => [field, fields[index] ?? '']))
  })
  return importResultRows(rows, { source: 'manual' })
}

// ── 来源 3：已结算投资里的真实比分 ─────────────────────────────────────

const normalizeActualScore = (value) => {
  if (!value || typeof value !== 'object') return null
  const home = toGoalCount(value.home ?? value.homeGoals ?? value.home_goals)
  const away = toGoalCount(value.away ?? value.awayGoals ?? value.away_goals)
  if (!Number.isFinite(home) || !Number.isFinite(away)) return null
  return { home, away }
}

/**
 * 从已结算（win/lose）投资里抽取真实比分行（纯函数，不写缓存——
 * 要落库请把返回值喂给 importResultRows(rows, { source: 'settled' })）。
 * 比分取 match.actual_score（结构化），缺了再 parseFinalScore(match.results)。
 * 注意：投资记录里没有比赛日期，date 用投资的 created_at（下单日）近似，
 * 与真实开赛日可能差一两天——settleStrategyPositions 的 ±1 天窗口正是为此留的。
 */
export const harvestSettledScores = (investmentsInput) => {
  const investments = Array.isArray(investmentsInput) ? investmentsInput : []
  const rows = []
  investments.forEach((investment) => {
    if (investment?.status !== 'win' && investment?.status !== 'lose') return
    const date = normalizeMatchDate(investment.created_at || investment.createdAt)
    ;(Array.isArray(investment.matches) ? investment.matches : []).forEach((match) => {
      const score = normalizeActualScore(match?.actual_score) || parseFinalScore(match?.results)
      if (!score) return
      const home = text(match?.home_team)
      const away = text(match?.away_team)
      if (!home || !away) return
      rows.push({ date, home, away, homeGoals: score.home, awayGoals: score.away })
    })
  })
  return rows
}

/** 抽取 + 落库一步走。返回 importResultRows 的汇总。 */
export const importSettledScores = (investmentsInput) =>
  importResultRows(harvestSettledScores(investmentsInput), { source: 'settled' })

// ── 索引读取 ──────────────────────────────────────────────────────────

/**
 * 合并后的赛果索引：按日期升序、按 date|teamIdHome|teamIdAway 去重。
 * 返回 { matches: [{ date, home, away, homeGoals, awayGoals, teamIdHome, teamIdAway,
 *   normalizedNameHome, normalizedNameAway, teamKeyHome, teamKeyAway, source }] }。
 */
export const getResultsIndex = () => {
  const cache = readCache()
  const byKey = new Map()
  cache.matches.forEach((row) => {
    const enriched = enrichRow(row, row?.source)
    if (!enriched) return
    const key = dedupeKeyFor(enriched)
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, enriched)
      return
    }
    // 老缓存可能带重复键；读取时同样按来源优先级收敛，保证跨来源确定性。
    if (!sameScore(existing, enriched) && sourcePriority(enriched.source) > sourcePriority(existing.source)) {
      byKey.set(key, enriched)
    }
  })
  const matches = [...byKey.values()].sort((a, b) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    return a.date < b.date ? -1 : a.date > b.date ? 1 : 0
  })
  return { matches }
}

/** UI 状态条用：{ count, minDate, maxDate, sources: {source: n}, fetchedAt, conflicts }。 */
export const resultsCacheStatus = () => {
  const cache = readCache()
  const { matches } = getResultsIndex()
  const dates = matches.map((row) => row.date).filter(Boolean).sort()
  const sources = {}
  matches.forEach((row) => {
    const key = row.source || 'unknown'
    sources[key] = (sources[key] || 0) + 1
  })
  return {
    count: matches.length,
    minDate: dates[0] || null,
    maxDate: dates[dates.length - 1] || null,
    sources,
    fetchedAt: cache.fetchedAt || null,
    conflicts: cache.conflicts,
  }
}
