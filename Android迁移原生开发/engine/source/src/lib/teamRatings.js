/**
 * ============================================================================
 *  teamRatings.js — 赛果驱动的球队强度与联赛状态（纯函数）
 * ============================================================================
 *
 * 只用赛果，不读赔率、不写存储。Elo 按时间顺序更新并带主客场加成、
 * 净胜球乘子和时间半衰期；球队缺 teamId 时使用 matchResults 的 name: 伪 id。
 *
 * @module teamRatings
 */

import { DEFAULT_LAMBDA_PRIOR, deriveScoreDistribution } from './readQuality'
import { TEAM_ALIAS_LIBRARY } from './localData'
import { resolveTeamIdentity, teamKeyForName } from './matchResults'

const INITIAL_ELO = 1500
const DAY_MS = 24 * 60 * 60 * 1000

const rowsOf = (resultsIndex) =>
  Array.isArray(resultsIndex) ? resultsIndex : Array.isArray(resultsIndex?.matches) ? resultsIndex.matches : []

const finiteGoals = (row) =>
  row && Number.isFinite(Number(row.homeGoals)) && Number.isFinite(Number(row.awayGoals))

const timeOf = (row) => {
  const time = new Date(row?.date || 0).getTime()
  return Number.isNaN(time) ? 0 : time
}

const chronological = (resultsIndex) =>
  rowsOf(resultsIndex)
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => finiteGoals(row))
    .sort((a, b) => timeOf(a.row) - timeOf(b.row) || a.index - b.index)
    .map(({ row }) => row)

const teamKey = (row, side) => {
  const capitalized = side === 'home' ? 'Home' : 'Away'
  return row[`teamKey${capitalized}`] || row[`teamId${capitalized}`] || teamKeyForName(row[side])
}

/**
 * 展示名：能解析到库内球队时优先用中文 teamName（如 FC Bayern München → 拜仁），
 * 原始英文名保留在 rawTeamName 里供 UI title / 搜索使用。teamKey 语义不变。
 */
const displayNameFor = (row, side, key) => {
  const capitalized = side === 'home' ? 'Home' : 'Away'
  const raw = String(row?.[side] || '').trim()
  const teamId = row?.[`teamId${capitalized}`]
  const libraryEntry = teamId ? TEAM_ALIAS_LIBRARY.find((entry) => entry.teamId === teamId) : null
  const identity = libraryEntry || resolveTeamIdentity(raw)
  if (identity?.teamName) {
    return { teamName: identity.teamName, rawTeamName: raw || identity.teamName }
  }
  return { teamName: raw || key || '未知球队', rawTeamName: raw }
}

/** 联赛基础进球环境：样本为空时各项为 0，sample=0。 */
export const ratingBaseline = (resultsIndex) => {
  const rows = chronological(resultsIndex)
  const sample = rows.length
  if (sample === 0) {
    return { avgGoalsPerMatch: 0, avgHomeGoals: 0, avgAwayGoals: 0, drawRate: 0, homeWinRate: 0, sample: 0 }
  }
  const sum = (selector) => rows.reduce((total, row) => total + selector(row), 0)
  const homeGoals = sum((row) => Number(row.homeGoals))
  const awayGoals = sum((row) => Number(row.awayGoals))
  return {
    avgGoalsPerMatch: (homeGoals + awayGoals) / sample,
    avgHomeGoals: homeGoals / sample,
    avgAwayGoals: awayGoals / sample,
    drawRate: rows.filter((row) => Number(row.homeGoals) === Number(row.awayGoals)).length / sample,
    homeWinRate: rows.filter((row) => Number(row.homeGoals) > Number(row.awayGoals)).length / sample,
    sample,
  }
}

const newTeam = (teamKey, teamName, rawTeamName) => ({
  teamKey,
  teamName,
  rawTeamName,
  elo: INITIAL_ELO,
  n: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  gf: 0,
  ga: 0,
  attack: 0,
  defense: 0,
  form: '',
  rank: null,
})

const goalDifferenceMultiplier = (goalDifference) => {
  if (goalDifference <= 0) return 1
  return Math.log(goalDifference + 1) * (2.2 / (goalDifference * 0.001 + 2.2))
}

const recordResult = (team, goalsFor, goalsAgainst, result) => {
  team.n += 1
  team.gf += goalsFor
  team.ga += goalsAgainst
  if (result === 'W') team.wins += 1
  else if (result === 'D') team.draws += 1
  else team.losses += 1
  team.form = `${team.form}${result}`.slice(-5)
  team.attack = team.gf / team.n
  team.defense = team.ga / team.n
}

/**
 * 时序 Elo。最新一场比赛的时间作为“现在”，老比赛的 K 按半衰期衰减，
 * 因此输出完全由赛果索引决定，不受运行日期影响。
 * 返回 { teams: 按 elo 降序数组, byTeam: teamKey→行, baseline }。
 */
export const buildTeamRatings = (resultsIndex, { k = 20, homeAdvantage = 60, recencyHalfLifeDays = 240 } = {}) => {
  const rows = chronological(resultsIndex)
  const byTeam = {}
  const latestTime = rows.reduce((latest, row) => Math.max(latest, timeOf(row)), 0)
  const halfLife = Math.max(1, Number(recencyHalfLifeDays) || 240)
  const baseK = Math.max(0, Number(k) || 20)

  rows.forEach((row) => {
    const homeKey = teamKey(row, 'home')
    const awayKey = teamKey(row, 'away')
    if (!homeKey || !awayKey || homeKey === awayKey) return
    if (!byTeam[homeKey]) {
      const homeName = displayNameFor(row, 'home', homeKey)
      byTeam[homeKey] = newTeam(homeKey, homeName.teamName, homeName.rawTeamName)
    }
    if (!byTeam[awayKey]) {
      const awayName = displayNameFor(row, 'away', awayKey)
      byTeam[awayKey] = newTeam(awayKey, awayName.teamName, awayName.rawTeamName)
    }
    const home = byTeam[homeKey]
    const away = byTeam[awayKey]

    const expectedHome = 1 / (10 ** (-(home.elo + homeAdvantage - away.elo) / 400) + 1)
    const homeGoals = Number(row.homeGoals)
    const awayGoals = Number(row.awayGoals)
    const actualHome = homeGoals > awayGoals ? 1 : homeGoals === awayGoals ? 0.5 : 0
    const ageDays = Math.max(0, (latestTime - timeOf(row)) / DAY_MS)
    const effectiveK = baseK * 0.5 ** (ageDays / halfLife)
    const delta = effectiveK * goalDifferenceMultiplier(Math.abs(homeGoals - awayGoals)) * (actualHome - expectedHome)
    home.elo += delta
    away.elo -= delta

    recordResult(home, homeGoals, awayGoals, homeGoals > awayGoals ? 'W' : homeGoals === awayGoals ? 'D' : 'L')
    recordResult(away, awayGoals, homeGoals, awayGoals > homeGoals ? 'W' : awayGoals === homeGoals ? 'D' : 'L')
  })

  const teams = Object.values(byTeam).sort(
    (a, b) => b.elo - a.elo || a.teamName.localeCompare(b.teamName),
  )
  teams.forEach((team, index) => {
    team.rank = index + 1
  })
  return { teams, byTeam, baseline: ratingBaseline(rows) }
}

const shrunkRatio = (rate, baselineRate, n) => {
  const base = Math.max(0.05, Number(baselineRate) || 0.05)
  const games = Math.max(0, Number(n) || 0)
  const value = Number.isFinite(Number(rate)) ? Number(rate) : base
  return (games * value + 10 * base) / (games + 10) / base
}

/**
 * 由攻防比率生成泊松比分分布。攻防数据先按 n/(n+10) 向联赛基准收缩，
 * 主场 lambda 再乘 1.12，客场乘 0.9。缺球队或无基准时 ready=false。
 */
export const probabilityFromRatings = ({ teamKeyHome, teamKeyAway } = {}, ratings, { maxGoals = 8 } = {}) => {
  const table = ratings?.byTeam || (ratings && !Array.isArray(ratings) ? ratings : {})
  const home = table[teamKeyHome]
  const away = table[teamKeyAway]
  const baseline = ratings?.baseline
  if (!home || !away || !baseline || !(baseline.sample > 0)) {
    return { cells: [], homeLambda: Number.NaN, awayLambda: Number.NaN, ready: false }
  }
  const homeBase = Math.max(0.05, baseline.avgHomeGoals || DEFAULT_LAMBDA_PRIOR.home)
  const awayBase = Math.max(0.05, baseline.avgAwayGoals || DEFAULT_LAMBDA_PRIOR.away)
  const homeLambda = Math.min(
    5,
    Math.max(
      0.05,
      1.12 * homeBase * shrunkRatio(home.attack, homeBase, home.n) * shrunkRatio(away.defense, homeBase, away.n),
    ),
  )
  const awayLambda = Math.min(
    5,
    Math.max(
      0.05,
      0.9 * awayBase * shrunkRatio(away.attack, awayBase, away.n) * shrunkRatio(home.defense, awayBase, home.n),
    ),
  )
  return { cells: deriveScoreDistribution(homeLambda, awayLambda, maxGoals), homeLambda, awayLambda, ready: true }
}

const summarizeWindow = (rows) => {
  const n = rows.length
  if (n === 0) return { n: 0, avgGoals: 0, drawRate: 0, homeWinRate: 0 }
  const goals = rows.reduce((sum, row) => sum + Number(row.homeGoals) + Number(row.awayGoals), 0)
  return {
    n,
    avgGoals: goals / n,
    drawRate: rows.filter((row) => Number(row.homeGoals) === Number(row.awayGoals)).length / n,
    homeWinRate: rows.filter((row) => Number(row.homeGoals) > Number(row.awayGoals)).length / n,
  }
}

/** 最近 window 场 vs 之前 window 场的联赛状态对照。 */
export const regimeSnapshot = (resultsIndex, { window = 60 } = {}) => {
  const rows = chronological(resultsIndex)
  const size = Math.max(1, Math.round(Number(window) || 60))
  const recent = summarizeWindow(rows.slice(-size))
  const previous = summarizeWindow(rows.slice(-2 * size, -size))
  const delta = {
    goals: recent.avgGoals - previous.avgGoals,
    drawRate: recent.drawRate - previous.drawRate,
  }
  let tone = 'stable'
  if (recent.n > 0 && previous.n > 0) {
    if (delta.goals >= 0.2) tone = 'higher_scoring'
    else if (delta.goals <= -0.2) tone = 'lower_scoring'
    else if (delta.drawRate >= 0.05) tone = 'more_draws'
    else if (delta.drawRate <= -0.05) tone = 'fewer_draws'
  }
  return { recent, previous, delta, tone }
}
