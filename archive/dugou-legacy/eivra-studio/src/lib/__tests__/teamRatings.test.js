import { describe, expect, it } from 'vitest'
import { buildTeamRatings, probabilityFromRatings, ratingBaseline, regimeSnapshot } from '../teamRatings'

const row = (date, homeId, awayId, homeGoals, awayGoals, names = {}) => ({
  date,
  home: names.home || homeId,
  away: names.away || awayId,
  homeGoals,
  awayGoals,
  teamIdHome: homeId,
  teamIdAway: awayId,
  teamKeyHome: homeId,
  teamKeyAway: awayId,
})

describe('buildTeamRatings', () => {
  it('raises strong teams, updates both sides symmetrically and tracks form', () => {
    const ratings = buildTeamRatings({
      matches: [
        row('2026-01-01', 'strong', 'weak', 3, 0),
        row('2026-01-08', 'weak', 'strong', 0, 2),
      ],
    })
    expect(ratings.byTeam.strong.elo).toBeGreaterThan(1500)
    expect(ratings.byTeam.weak.elo).toBeLessThan(1500)
    expect(ratings.byTeam.strong.elo + ratings.byTeam.weak.elo).toBeCloseTo(3000, 8)
    expect(ratings.byTeam.strong).toMatchObject({ n: 2, wins: 2, draws: 0, losses: 0, gf: 5, ga: 0, form: 'WW', rank: 1 })
    expect(ratings.byTeam.weak.rank).toBe(2)
  })

  it('prices home advantage into the expected score', () => {
    const homeWin = buildTeamRatings({ matches: [row('2026-01-01', 'strong', 'weak', 2, 0)] })
    const awayWin = buildTeamRatings({ matches: [row('2026-01-01', 'weak', 'strong', 0, 2)] })
    // 同样 2-0 胜利，客胜更“冷门”，Elo 奖励应高于主胜
    expect(awayWin.byTeam.strong.elo - 1500).toBeGreaterThan(homeWin.byTeam.strong.elo - 1500)
  })

  it('keeps same-city clubs as separate teams (each n is its own match count)', () => {
    const ratings = buildTeamRatings({
      matches: [
        { date: '2026-01-01', home: 'Real Madrid', away: 'Rayo Vallecano de Madrid', homeGoals: 2, awayGoals: 0 },
        { date: '2026-01-08', home: 'Club Atlético de Madrid', away: 'Real Madrid', homeGoals: 1, awayGoals: 1 },
        { date: '2026-01-15', home: 'Rayo Vallecano de Madrid', away: 'Club Atlético de Madrid', homeGoals: 0, awayGoals: 2 },
      ],
    })
    expect(ratings.teams).toHaveLength(3)
    expect(ratings.byTeam.realmadrid.n).toBe(2)
    expect(ratings.byTeam.atletico.n).toBe(2)
    const rayo = ratings.byTeam['name:rayovallecanodemadrid']
    expect(rayo).toBeTruthy()
    expect(rayo.n).toBe(2)
    expect(ratings.byTeam.barcelona).toBeUndefined()
  })

  it('prefers the resolved Chinese teamName but keeps the raw name for display', () => {
    const ratings = buildTeamRatings({
      matches: [
        {
          date: '2026-01-01',
          home: 'FC Bayern München',
          away: 'Borussia Dortmund',
          homeGoals: 2,
          awayGoals: 1,
          teamIdHome: 'bayern',
          teamIdAway: 'dortmund',
        },
      ],
    })
    expect(ratings.byTeam.bayern).toMatchObject({
      teamName: '拜仁',
      rawTeamName: 'FC Bayern München',
      teamKey: 'bayern',
      n: 1,
    })
    expect(ratings.byTeam.dortmund).toMatchObject({
      teamName: '多特',
      rawTeamName: 'Borussia Dortmund',
    })
  })

  it('generates a near-normalized score distribution from ratings', () => {
    const ratings = buildTeamRatings({
      matches: [
        row('2026-01-01', 'strong', 'weak', 3, 0),
        row('2026-01-08', 'strong', 'weak', 2, 1),
        row('2026-01-15', 'weak', 'strong', 0, 2),
      ],
    })
    const distribution = probabilityFromRatings({ teamKeyHome: 'strong', teamKeyAway: 'weak' }, ratings)
    expect(distribution.ready).toBe(true)
    expect(distribution.homeLambda).toBeGreaterThan(0)
    expect(distribution.awayLambda).toBeGreaterThan(0)
    const total = distribution.cells.reduce((sum, cell) => sum + cell.p, 0)
    expect(total).toBeGreaterThan(0.98)
    expect(total).toBeLessThanOrEqual(1.000001)
    expect(probabilityFromRatings({ teamKeyHome: 'missing', teamKeyAway: 'weak' }, ratings).ready).toBe(false)
  })
})

describe('ratingBaseline / regimeSnapshot', () => {
  const rows = [
    row('2026-01-01', 'a', 'b', 1, 0),
    row('2026-01-08', 'c', 'd', 0, 0),
    row('2026-01-15', 'a', 'c', 3, 2),
    row('2026-01-22', 'b', 'd', 2, 2),
  ]

  it('computes league scoring baselines', () => {
    const baseline = ratingBaseline({ matches: rows })
    expect(baseline).toMatchObject({ sample: 4, avgGoalsPerMatch: 2.5, avgHomeGoals: 1.5, avgAwayGoals: 1.0, drawRate: 0.5, homeWinRate: 0.5 })
  })

  it('detects a higher-scoring recent regime', () => {
    const snapshot = regimeSnapshot({ matches: rows }, { window: 2 })
    expect(snapshot.recent.n).toBe(2)
    expect(snapshot.previous.n).toBe(2)
    expect(snapshot.tone).toBe('higher_scoring')
    expect(snapshot.delta.goals).toBeCloseTo(4, 12)
    expect(snapshot.delta.drawRate).toBeCloseTo(0, 12)
  })

  it('detects more draws and stays stable with no previous window', () => {
    const drawHeavy = [
      row('2026-01-01', 'a', 'b', 2, 1),
      row('2026-01-08', 'c', 'd', 1, 0),
      row('2026-01-15', 'a', 'c', 2, 2),
      row('2026-01-22', 'b', 'd', 0, 0),
    ]
    expect(regimeSnapshot({ matches: drawHeavy }, { window: 2 }).tone).toBe('more_draws')
    expect(regimeSnapshot({ matches: rows.slice(0, 2) }, { window: 2 }).tone).toBe('stable')
  })
})
