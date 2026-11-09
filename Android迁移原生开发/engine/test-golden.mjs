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
const original = api.hydrate(JSON.stringify({ 'eivra.full_session_latch.v1': '1', 'eivra.workspace.native': '{}' }))
assert.equal(original.investments.length > 0, true)
console.log('hydrated', original.investments.length, original.investments[0])
assert.equal('system_config' in original, true)
console.log('latch', globalThis.window.sessionStorage.getItem('eivra.full_session_latch.v1'), 'stored before save', api.exportWorkspace().investments.length)
const record = { id: 'native-golden-1', created_at: '2026-11-09T12:00:00.000Z', status: 'pending', inputs: 10,
  matches: [{ id: 'native-golden-match', home_team: 'Arsenal', away_team: 'Chelsea', odds: 2, conf: .6, entries: [{ name: '主胜', odds: 2 }] }] }
assert.equal(JSON.parse(api.invokeJSON('localData.saveInvestment', record)).id, record.id)
const saved = JSON.parse(api.invokeJSON('localData.getInvestments')).find(x => x.id === record.id)
assert.equal(saved.matches.length, 1)
assert.equal(saved.matches[0].entries[0].name, '主胜')
assert.equal(saved.parlay_size, 1)
const updated = JSON.parse(api.invokeJSON('localData.updateInvestment', { id: record.id, updater: { status: 'win', profit: 10 } }))
assert.equal(updated.status, 'win')
assert.equal(updated.matches[0].is_correct, true)
assert.equal(typeof updated.settled_at, 'string')
const dashboard = JSON.parse(api.invokeJSON('analytics.getDashboardSnapshot'))
assert.equal(typeof dashboard, 'object')
const exported = api.exportWorkspace()
assert.equal(exported.investments.some(x => x.id === record.id), true)
assert.equal(JSON.parse(api.invokeJSON('localData.importDataBundle', { bundle: exported, mode: 'replace' })), true)
assert.equal(api.exportWorkspace().investments.some(x => x.id === record.id), true)
const analysis = JSON.parse(api.invokeJSON('analytics.getAnalysisSnapshot'))
const metrics = JSON.parse(api.invokeJSON('analytics.getMetricsSnapshot'))
const teams = JSON.parse(api.invokeJSON('analytics.getTeamsSnapshot', ['', 'all']))
const research = JSON.parse(api.invokeJSON('quantResearch.getResearchStore'))
const forward = JSON.parse(api.invokeJSON('quantForward.getForwardStore'))
assert.equal(typeof analysis, 'object')
assert.equal(typeof metrics.headline, 'object')
assert.equal(Array.isArray(teams), true)
assert.equal(Array.isArray(research.runs), true)
assert.equal(Array.isArray(forward.plans), true)
console.log(JSON.stringify({ ok: true, originalInvestments: original.investments.length, saved, updated, dashboardKeys: Object.keys(dashboard).slice(0, 20) }))
