import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchMatchResults,
  getResultsIndex,
  harvestSettledScores,
  importResultRows,
  importSettledScores,
  normalizeMatchDate,
  normalizeMatchResults,
  normalizeStrictTeamName,
  resolveTeamIdentity,
  resolveTeamIdentityLoose,
  resultsCacheStatus,
} from '../matchResults'

// 赛果缓存走 localStorage（full 模式）；node 环境里 stub 一个内存版 window。
const stubFullModeWindow = () => {
  const store = new Map()
  vi.stubGlobal('window', {
    location: { pathname: '/' },
    sessionStorage: {
      getItem: (key) => (key === 'eivra.full_session_latch.v1' ? '1' : null),
      setItem: () => {},
      removeItem: () => {},
    },
    localStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
    },
    dispatchEvent: () => true,
  })
  if (typeof globalThis.CustomEvent !== 'function') {
    vi.stubGlobal('CustomEvent', class CustomEvent {
      constructor(type, options) {
        this.type = type
        this.detail = options?.detail
      }
    })
  }
  return store
}

beforeEach(() => {
  stubFullModeWindow()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('normalizeMatchDate', () => {
  it('accepts the date shapes the API and manual entry produce', () => {
    expect(normalizeMatchDate('2026-09-20')).toBe('2026-09-20')
    expect(normalizeMatchDate('2026/9/2')).toBe('2026-09-02')
    expect(normalizeMatchDate('2026-09-20 15:00')).toBe('2026-09-20')
    expect(normalizeMatchDate('20260920')).toBe('2026-09-20')
    expect(normalizeMatchDate('2026-09-20T12:00:00.000Z')).toBe('2026-09-20')
    expect(normalizeMatchDate('不是日期')).toBeNull()
    expect(normalizeMatchDate('')).toBeNull()
    expect(normalizeMatchDate(null)).toBeNull()
  })
})

describe('resolveTeamIdentity', () => {
  it('resolves exact aliases case-insensitively and normalizes club suffixes/connectors', () => {
    expect(resolveTeamIdentity('切尔西')).toEqual({ teamId: 'chelsea', teamName: '切尔西' })
    expect(resolveTeamIdentity('Chelsea')).toEqual({ teamId: 'chelsea', teamName: '切尔西' })
    expect(resolveTeamIdentity('Chelsea FC')).toEqual({ teamId: 'chelsea', teamName: '切尔西' })
    expect(resolveTeamIdentity('阿森纳')).toEqual({ teamId: 'arsenal', teamName: '阿森纳' })
    expect(resolveTeamIdentity('Real Madrid')).toEqual({ teamId: 'realmadrid', teamName: '皇马' })
    expect(resolveTeamIdentity('FC Bayern München')).toEqual({ teamId: 'bayern', teamName: '拜仁' })
    expect(resolveTeamIdentity('FC Internazionale Milano')).toEqual({ teamId: 'inter', teamName: '国际米兰' })
    expect(resolveTeamIdentity('Paris Saint-Germain')).toEqual({ teamId: 'psg', teamName: '巴黎圣日耳曼' })
    expect(resolveTeamIdentity('')).toBeNull()
    expect(resolveTeamIdentity('不知名野球队')).toBeNull()
  })

  it('never falls back to substring matching in the strict (data ingestion) path', () => {
    expect(normalizeStrictTeamName('Rayo Vallecano de Madrid')).toBe('rayovallecanomadrid')
    expect(normalizeStrictTeamName('Club Atlético de Madrid')).toBe('clubatleticomadrid')
    expect(resolveTeamIdentity('Rayo Vallecano de Madrid')).toBeNull()
    expect(resolveTeamIdentity('Club Atlético de Madrid')).toEqual({ teamId: 'atletico', teamName: '马竞' })
    expect(resolveTeamIdentity('Espanyol de Barcelona')).toBeNull()
    expect(resolveTeamIdentity('Paris FC')).toBeNull()
    // 宽松解析仅保留给 UI 搜索，证明它不是数据路径。
    expect(resolveTeamIdentityLoose('Rayo Vallecano de Madrid')?.teamId).toBe('realmadrid')
    expect(resolveTeamIdentityLoose('Paris FC')?.teamId).toBe('psg')
  })

  it('keeps same-city clubs distinct for every known collision pair', () => {
    const id = (name) => resolveTeamIdentity(name)?.teamId ?? `name:${normalizeStrictTeamName(name)}`
    const pairs = [
      ['Rayo Vallecano de Madrid', 'Real Madrid', 'Club Atlético de Madrid'],
      ['FC Internazionale Milano', 'AC Milan'],
      ['Espanyol de Barcelona', 'FC Barcelona'],
      ['Paris FC', 'Paris Saint-Germain'],
      ['Manchester United', 'Manchester City'],
    ]
    pairs.forEach((names) => {
      expect(new Set(names.map(id)).size).toBe(names.length)
    })
    expect(id('Rayo Vallecano de Madrid')).not.toBe('realmadrid')
    expect(id('Espanyol de Barcelona')).not.toBe('barcelona')
    expect(id('Paris FC')).not.toBe('psg')
  })
})

describe('normalizeMatchResults', () => {
  it('maps a realistic flat payload and drops junk rows', () => {
    const payload = {
      success: true,
      errorCode: '0',
      value: {
        matchResultList: [
          { matchDate: '2026-09-20', homeTeamAbbName: '切尔西', awayTeamAbbName: '阿森纳', fullScore: '2-1' },
          { businessDate: '2026/09/21', homeTeamAllName: '利物浦', awayTeamAllName: '曼城', sectionsNo1: '1:1' },
          { matchDate: '2026-09-22', home: '皇马', away: '巴塞罗那', homeScore: 3, awayScore: 3 },
          { matchDate: '2026-09-22', homeTeamAbbName: '拜仁', awayTeamAbbName: '多特' }, // 无比分 → 丢弃
          'junk',
          null,
        ],
      },
    }
    const result = normalizeMatchResults(payload)
    expect(result.ok).toBe(true)
    expect(result.matches).toHaveLength(3)
    expect(result.matches[0]).toMatchObject({ date: '2026-09-20', home: '切尔西', away: '阿森纳', homeGoals: 2, awayGoals: 1 })
    expect(result.matches[1]).toMatchObject({ date: '2026-09-21', homeGoals: 1, awayGoals: 1 })
    expect(result.matches[2]).toMatchObject({ date: '2026-09-22', homeGoals: 3, awayGoals: 3 })
  })

  it('expands grouped payloads (matchInfoList → subMatchList) and inherits group dates', () => {
    const payload = {
      value: {
        matchInfoList: [
          {
            businessDate: '2026-09-24',
            subMatchList: [
              { homeTeamAbbName: '曼联', awayTeamAbbName: '热刺', fullScore: '0-2' },
              { homeTeamAbbName: '纽卡斯尔', awayTeamAbbName: '维拉', score: '1-1' },
            ],
          },
        ],
      },
    }
    const result = normalizeMatchResults(payload)
    expect(result.ok).toBe(true)
    expect(result.matches).toHaveLength(2)
    expect(result.matches[0]).toMatchObject({ date: '2026-09-24', homeGoals: 0, awayGoals: 2 })
  })

  it('reports structured failure for empty/garbage payloads', () => {
    expect(normalizeMatchResults(null)).toEqual({ ok: false, matches: [], reason: 'unexpected_payload' })
    expect(normalizeMatchResults({ success: true, errorCode: '0', value: {} })).toEqual({
      ok: false,
      matches: [],
      reason: 'unexpected_payload',
    })
    expect(normalizeMatchResults({ success: false, errorCode: '500001' }).ok).toBe(false)
    expect(normalizeMatchResults({ value: { matchResultList: [{ homeTeamAbbName: '无比分场' }] } }).reason).toBe('no_valid_results')
  })
})

describe('importResultRows + getResultsIndex', () => {
  it('merges, validates, enriches with teamIds and dedupes', () => {
    const first = importResultRows([
      { date: '2026-09-22', home: '皇马', away: '巴塞罗那', homeGoals: 3, awayGoals: 3 },
      { date: '2026-09-20', home: '切尔西', away: '阿森纳', homeGoals: 2, awayGoals: 1 },
      { date: '2026-09-21', home: '', away: '阿森纳', homeGoals: 1, awayGoals: 1 }, // 缺队名 → invalid
      { date: '2026-09-21', home: '利物浦', away: '曼城', homeGoals: -1, awayGoals: 0 }, // 负球 → invalid
    ])
    expect(first).toMatchObject({ ok: true, added: 2, invalid: 2, total: 2 })

    // 别名写法不同（Chelsea vs 切尔西）但 teamId 相同 + 同日期 → 去重
    const second = importResultRows([{ date: '2026-09-20', home: 'Chelsea', away: 'Arsenal', homeGoals: 2, awayGoals: 1 }])
    expect(second).toMatchObject({ ok: true, added: 0, skipped: 1, total: 2 })

    const index = getResultsIndex()
    expect(index.matches).toHaveLength(2)
    // 按日期升序
    expect(index.matches[0].date).toBe('2026-09-20')
    expect(index.matches[0]).toMatchObject({ teamIdHome: 'chelsea', teamIdAway: 'arsenal', source: 'manual' })
    expect(index.matches[1].date).toBe('2026-09-22')

    const status = resultsCacheStatus()
    expect(status.count).toBe(2)
    expect(status.minDate).toBe('2026-09-20')
    expect(status.maxDate).toBe('2026-09-22')
    expect(status.sources.manual).toBe(2)
    expect(status.fetchedAt).toBeTruthy()
  })
})

describe('harvestSettledScores / importSettledScores', () => {
  it('extracts real scorelines from settled investments and skips the rest', () => {
    const investments = [
      {
        id: 'inv1',
        status: 'lose',
        created_at: '2026-09-20T10:00:00.000Z',
        matches: [{ home_team: '利物浦', away_team: '维拉', results: '2-0', is_correct: false }],
      },
      {
        id: 'inv2',
        status: 'win',
        created_at: '2026-09-21T10:00:00.000Z',
        matches: [
          { home_team: '阿森纳', away_team: '曼城', actual_score: { home: 1, away: 1 } },
          { home_team: '曼联', away_team: '热刺', results: '输了，不写了' }, // 无比分 → 丢弃
        ],
      },
      { id: 'inv3', status: 'pending', created_at: '2026-09-22T10:00:00.000Z', matches: [{ home_team: '皇马', away_team: '巴萨', results: '9-9' }] },
    ]
    const rows = harvestSettledScores(investments)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ date: '2026-09-20', home: '利物浦', away: '维拉', homeGoals: 2, awayGoals: 0 })
    expect(rows[1]).toMatchObject({ date: '2026-09-21', home: '阿森纳', away: '曼城', homeGoals: 1, awayGoals: 1 })

    const merged = importSettledScores(investments)
    expect(merged.added).toBe(2)
    expect(resultsCacheStatus().sources.settled).toBe(2)
  })
})

describe('fetchMatchResults', () => {
  const goodPayload = {
    success: true,
    errorCode: '0',
    value: {
      matchResultList: [{ matchDate: '2026-09-28', homeTeamAbbName: '切尔西', awayTeamAbbName: '阿森纳', fullScore: '1-1' }],
    },
  }

  it('fetches, normalizes and merges into the cache', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => goodPayload }))
    const result = await fetchMatchResults({ days: 7, fetchImpl })
    expect(result.ok).toBe(true)
    expect(result.matches).toHaveLength(1)
    expect(result.added).toBe(1)
    expect(result.fetchedAt).toBeTruthy()

    const url = fetchImpl.mock.calls[0][0]
    expect(url).toContain('getMatchResultV1.qry')
    expect(url).toContain('matchPage=1')
    expect(url).toContain('pageSize=100')

    const index = getResultsIndex()
    expect(index.matches[0]).toMatchObject({ homeGoals: 1, awayGoals: 1, source: 'sporttery', teamIdHome: 'chelsea' })
  })

  it('never throws: http errors, WAF pages and timeouts all become {ok:false, reason}', async () => {
    const waf = await fetchMatchResults({ fetchImpl: async () => ({ ok: false, status: 567 }) })
    expect(waf).toEqual({ ok: false, matches: [], reason: 'http_567', fetchedAt: null })

    const notJson = await fetchMatchResults({
      fetchImpl: async () => ({ ok: true, json: async () => Promise.reject(new Error('Unexpected token <')) }),
    })
    expect(notJson.ok).toBe(false)
    expect(notJson.reason).toBe('network_error')

    const hangingFetch = (url, { signal }) =>
      new Promise((_, reject) => {
        signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })))
      })
    const timeout = await fetchMatchResults({ fetchImpl: hangingFetch, timeoutMs: 10 })
    expect(timeout.ok).toBe(false)
    expect(timeout.reason).toBe('timeout')
  })
})

// ── Round 3：openfootball / CSV / 冲突优先级 / 伪 teamKey ───────────────

describe('openfootball source', () => {
  it('normalizes team1/team2/score.ft and skips unfinished rows', async () => {
    const { normalizeOpenFootballResults } = await import('../matchResults')
    const payload = {
      name: 'Premier League',
      matches: [
        { round: 1, date: '2024-08-16', time: '20:00', team1: 'Manchester United FC', team2: 'Fulham FC', score: { ht: [0, 0], ft: [1, 0] } },
        { round: 1, date: '2024-08-17', team1: 'Arsenal FC', team2: 'Chelsea FC', score: { ht: [1, 1] } },
        { round: 1, date: '2024-08-17', team1: 'Liverpool FC', team2: 'Everton FC', score: { ft: [2, 2] } },
      ],
    }
    const result = normalizeOpenFootballResults(payload)
    expect(result.ok).toBe(true)
    expect(result.matches).toHaveLength(2)
    expect(result.matches[0]).toMatchObject({ date: '2024-08-16', home: 'Manchester United FC', away: 'Fulham FC', homeGoals: 1, awayGoals: 0 })
    expect(result.matches[1].homeGoals).toBe(2)
  })

  it('fetches sequentially, skips 404s and merges as openfootball', async () => {
    const { fetchOpenFootballResults } = await import('../matchResults')
    const payload = {
      matches: [{ date: '2024-08-16', team1: 'Manchester United FC', team2: 'Fulham FC', score: { ft: [1, 0] } }],
    }
    const calls = []
    const fetchImpl = async (url) => {
      calls.push(url)
      if (url.includes('2025-26')) return { ok: false, status: 404 }
      return { ok: true, json: async () => payload }
    }
    const result = await fetchOpenFootballResults({ leagues: ['en.1'], seasons: ['2024-25', '2025-26'], fetchImpl })
    expect(result.ok).toBe(true)
    expect(result.added).toBe(1)
    expect(result.sources).toEqual([
      { league: 'en.1', season: '2024-25', ok: true, added: 1 },
      { league: 'en.1', season: '2025-26', ok: false, added: 0, reason: 'http_404' },
    ])
    expect(calls).toHaveLength(2)
    const row = getResultsIndex().matches[0]
    expect(row).toMatchObject({ source: 'openfootball', teamIdHome: 'manutd', teamIdAway: 'fulham', teamKeyHome: 'manutd' })
  })
})

describe('CSV import and conflict resolution', () => {
  it('parses comma/semicolon CSV with aliases, quotes and dedupe', async () => {
    const { importResultsCsv } = await import('../matchResults')
    const first = importResultsCsv('date;主队;客队;home_score;away_score\n"2026-09-20";"切尔西";"阿森纳";2;1\n')
    expect(first).toMatchObject({ ok: true, added: 1, invalid: 0 })
    const second = importResultsCsv('date,home,away,homeGoals,awayGoals\n2026-09-20,Chelsea,Arsenal,2,1\n2026-09-21,利物浦,曼城,1,1\n')
    expect(second).toMatchObject({ ok: true, added: 1, skipped: 1 })
    expect(getResultsIndex().matches).toHaveLength(2)
  })

  it('resolves different scores by manual > settled > sporttery > openfootball', () => {
    const row = (homeGoals, awayGoals = 0) => ({ date: '2026-09-20', home: '切尔西', away: '阿森纳', homeGoals, awayGoals })
    importResultRows([row(1)], { source: 'openfootball' })
    importResultRows([row(2)], { source: 'sporttery' })
    importResultRows([row(3)], { source: 'manual' })
    importResultRows([row(4)], { source: 'openfootball' })
    const index = getResultsIndex()
    expect(index.matches).toHaveLength(1)
    expect(index.matches[0]).toMatchObject({ homeGoals: 3, source: 'manual' })
    expect(resultsCacheStatus().conflicts).toBe(3)
    // 同分重复不再额外计冲突
    importResultRows([row(3)], { source: 'settled' })
    expect(resultsCacheStatus().conflicts).toBe(3)
  })

  it('keeps unmatched teams on a stable normalized pseudo teamKey', async () => {
    const { normalizeTeamName, teamKeyForName } = await import('../matchResults')
    expect(normalizeTeamName('Manchester United FC')).toBe('manchesterunited')
    expect(normalizeTeamName('  Zebra Rovers AFC  ')).toBe('zebrarovers')
    expect(teamKeyForName('Zebra Rovers AFC')).toBe('name:zebrarovers')
    importResultRows([{ date: '2026-09-22', home: 'Zebra Rovers AFC', away: '另一支新队', homeGoals: 1, awayGoals: 1 }], { source: 'openfootball' })
    const row = getResultsIndex().matches[0]
    expect(row.teamIdHome).toBeNull()
    expect(row.teamKeyHome).toBe('name:zebrarovers')
    expect(row.normalizedNameHome).toBe('zebrarovers')
  })
})
