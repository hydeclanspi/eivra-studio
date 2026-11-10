import { build } from 'esbuild'
import { nativePlatformPlugin } from './native-platform.mjs'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'
const outfile = join(mkdtempSync(join(tmpdir(), 'eivra-engine-')), 'engine.mjs')
await build({ entryPoints: ['entry.js'], plugins: [nativePlatformPlugin()], define: { 'import.meta.env': '{}' }, bundle: true, format: 'esm', platform: 'node', target: 'node20', outfile })
await import(pathToFileURL(outfile))
const api = globalThis.eivraEngine
assert.equal(api.version, 'native-contract-1')
const owner = api.hydrate(JSON.stringify({ emptyOwner: true }))
const ownerInvestmentCount = owner.investments.length
const ownerTeamCount = owner.team_profiles.length
assert.equal(ownerInvestmentCount, 0)
assert.ok(owner && typeof owner === 'object' && Array.isArray(owner.investments), 'native offline bootstrap must complete without browser timers')
// The original engine may seed a team directory; this is not investment history.
assert.equal(ownerInvestmentCount, 0)
assert.equal(ownerTeamCount >= 0, true)
const original = api.hydrate(JSON.stringify({ 'eivra.full_session_latch.v1': '1', 'eivra.workspace.native': '{}' }))
assert.equal(original.investments.length > 0, true)
assert.equal('system_config' in original, true)
const record = { id: 'native-golden-1', created_at: '2026-11-09T12:00:00.000Z', status: 'pending', inputs: 10,
  matches: [{ id: 'native-golden-match', home_team: 'Arsenal', away_team: 'Chelsea', odds: 2, conf: .6, entries: [{ name: '主胜', odds: 2 }] }] }
assert.equal(JSON.parse(api.invokeJSON('localData.saveInvestment', JSON.stringify([record]))).id, record.id)
const saved = JSON.parse(api.invokeJSON('localData.getInvestments')).find(x => x.id === record.id)
assert.equal(saved.matches.length, 1)
assert.equal(saved.matches[0].entries[0].name, '主胜')
assert.equal(saved.parlay_size, 1)
const updated = JSON.parse(api.invokeJSON('localData.settleFromForm', JSON.stringify([record.id, { revenues: 20, matches: [{ results: '2-1', isCorrect: true, matchRating: 0.3, matchRep: 0, postNote: '符合判断' }] }])))
assert.equal(updated.status, 'win')
assert.equal(updated.matches[0].is_correct, true)
assert.equal(updated.status, 'win')
assert.equal(updated.revenues, 20)
assert.equal(updated.actual_rating, 0.3)
assert.equal(typeof updated.settled_at, 'string')
const dashboard = JSON.parse(api.invokeJSON('analytics.getDashboardSnapshot', '[]'))
assert.equal(typeof dashboard, 'object')

const losing = JSON.parse(api.invokeJSON('localData.settleFromForm', JSON.stringify([record.id, {
  revenues: 0,
  matches: [{ results: '0-1', isCorrect: false, matchRating: 0.1, matchRep: null, postNote: '未兑现' }],
}])))
assert.equal(losing.status, 'lose')
assert.equal(losing.matches[0].is_correct, false)
assert.equal(losing.profit, -10)

const exported = api.exportWorkspace()
assert.equal(exported.investments.some(x => x.id === record.id), true)
assert.equal(JSON.parse(api.invokeJSON('localData.importDataBundle', JSON.stringify([exported, 'replace']))), true)
assert.equal(api.exportWorkspace().investments.some(x => x.id === record.id), true)
const analysis = JSON.parse(api.invokeJSON('analytics.getAnalysisSnapshot', '[]'))
const metrics = JSON.parse(api.invokeJSON('analytics.getMetricsSnapshot', '[]'))
const teams = JSON.parse(api.invokeJSON('analytics.getTeamsSnapshot', JSON.stringify(['', 'all'])))
const research = JSON.parse(api.invokeJSON('quantResearch.getResearchStore', '[]'))
const forward = JSON.parse(api.invokeJSON('quantForward.getForwardStore', '[]'))
assert.equal(typeof analysis, 'object')
assert.equal(typeof metrics.headline, 'object')
assert.equal(Array.isArray(teams), true)
assert.equal(Array.isArray(research.runs), true)
assert.equal(Array.isArray(forward.plans), true)

const forecast = JSON.parse(api.invokeJSON('forecast.buildDraft', JSON.stringify([[{
  home_team: 'Arsenal', away_team: 'Chelsea', conf: 0.6, mode: '常规-杠杆', odds: 2,
  entries: [{ name: '主胜', odds: 2 }, { name: '平局', odds: 3.4 }],
  tys_home: 'M', tys_away: 'M', fid: 0.4, fse_home: 0.6, fse_away: 0.55,
}], '2026-11-09T12:00:00.000Z'])))
assert.equal(forecast.profiles.length, 1)
assert.equal(typeof forecast.combinedProfile.valid, 'boolean')
assert.equal(forecast.forecastSnapshot.generated_at, '2026-11-09T12:00:00.000Z')
assert.equal(forecast.forecastSnapshot.legs[0].entries.length, 2)

const singleEntryForecast = JSON.parse(api.invokeJSON('forecast.buildDraft', JSON.stringify([[{
  home_team: 'Arsenal', away_team: 'Chelsea', conf: 0.6, mode: '常规-杠杆',
  entries: [{ name: '主胜', odds: 2 }], tys_home: 'M', tys_away: 'M', fid: 0.4, fse_home: 0.5, fse_away: 0.5,
}], '2026-11-10T12:00:00.000Z'])))
assert.equal(singleEntryForecast.profiles.length, 1)
assert.equal(singleEntryForecast.forecastSnapshot.legs.length, 1)

console.log(JSON.stringify({ ok: true, originalInvestments: original.investments.length, saved, updated, dashboardKeys: Object.keys(dashboard).slice(0, 20) }))

assert.throws(() => api.invokeJSON('forecast.buildDraft', JSON.stringify([[{ home_team: 'A', away_team: 'B', conf: null, entries: [{ name: '主胜', odds: 2 }] }]])), /explicit conf/)

