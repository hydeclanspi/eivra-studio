import { build } from 'esbuild'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'
const dir = mkdtempSync(join(tmpdir(), 'eivra-engine-'))
const outfile = join(dir, 'engine.mjs')
await build({ entryPoints: ['entry.js'], bundle: true, format: 'esm', platform: 'node', target: 'node20', outfile })
globalThis.window = undefined
globalThis.localStorage = undefined
globalThis.sessionStorage = undefined
globalThis.document = undefined
const engine = await import(pathToFileURL(outfile))
const api = globalThis.eivraEngine
assert.equal(api.version, 'native-contract-1')
assert.equal(JSON.parse(api.invokeJSON('localData.getInvestments')).length > 0, true)
const bundle = JSON.parse(api.invokeJSON('localData.exportDataBundle'))
assert.equal(Array.isArray(bundle.investments), true)
assert.equal('system_config' in bundle, true)
const dashboard = JSON.parse(api.invokeJSON('analytics.getDashboardSnapshot'))
assert.equal(typeof dashboard, 'object')
console.log(JSON.stringify({ ok: true, investments: bundle.investments.length, dashboardKeys: Object.keys(dashboard).slice(0, 20) }))
