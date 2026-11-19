import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, readFile, writeFile, rm, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { emptyForwardStore } from '../quantForward'
import { emptyEvidenceStore, mergeEvidence } from '../quantEvidence'

const exec = promisify(execFile)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
let dir, config, output, preload
beforeEach(async () => {
  dir = await mkdtemp(resolve(tmpdir(), 'eivra-collector-test-'))
  config = resolve(dir, 'config.json'); output = resolve(dir, 'snapshot.json'); preload = resolve(dir, 'fetch.mjs')
  const old = new Date(Date.now() - 86400000).toISOString()
  const futureChina = new Date(Date.now() + 9 * 3600000).toISOString()
  const oldChina = new Date(Date.parse(old) + 8 * 3600000).toISOString().slice(0, 10)
  const evidence = mergeEvidence(emptyEvidenceStore(), { schemaVersion: 1, events: [{ home: '曼联', away: '利物浦', kickoff: old, observedAt: new Date(Date.parse(old) - 3600000).toISOString(), source: 'sporttery' }] })
  await writeFile(config, JSON.stringify({ schemaVersion: 1, forwardStore: emptyForwardStore(), evidence }))
  const odds = { value: { matchInfoList: [{ subMatchList: [{ matchId: 1, matchDate: futureChina.slice(0, 10), matchTime: futureChina.slice(11, 19), homeTeamAbbName: '阿森纳', awayTeamAbbName: '切尔西', had: { h: '2', d: '3.5', a: '4' }, poolList: [{ poolCode: 'HAD', poolStatus: 'Selling' }] }] }] } }
  const results = { success: true, value: [{ matchDate: oldChina, homeTeamAbbName: '曼联', awayTeamAbbName: '利物浦', homeGoals: 1, awayGoals: 0 }] }
  // This preload blocks all real network requests in the child process.
  await writeFile(preload, `globalThis.fetch = async (url) => { if (String(url).includes('getMatchCalculatorV1')) { if (process.env.QUANT_TEST_FAIL_ODDS) throw new Error('synthetic outage'); return { ok: true, json: async () => (${JSON.stringify(odds)}) }; } if (String(url).includes('getMatchResultV1')) return { ok: true, json: async () => (${JSON.stringify(results)}) }; throw new Error('unexpected network request'); };`)
})
afterEach(async () => { await rm(dir, { recursive: true, force: true }) })
const run = (env = {}) => exec(process.execPath, ['--import', preload, resolve(root, 'scripts/quant-collector.mjs'), '--config', config, '--output', output, '--once'], { cwd: root, env: { ...process.env, ...env }, timeout: 25000 })
const snapshot = async () => JSON.parse(await readFile(output, 'utf8'))

describe('standalone collector process with isolated network fixtures', () => {
  it('loads the real SSR engines, persists evidence atomically and resumes without duplicating results', async () => {
    await run()
    const first = await snapshot()
    expect(first.collector).toMatchObject({ state: 'stopped', lastBatch: { oddsOk: true, resultsOk: true } })
    expect(first.evidence.quotes).toHaveLength(3)
    expect(first.evidence.results).toHaveLength(1)
    await expect(access(`${output}.lock`)).rejects.toThrow()
    await run()
    const second = await snapshot()
    expect(second.evidence.quotes.length).toBeGreaterThanOrEqual(3)
    expect(second.evidence.results).toEqual(first.evidence.results)
  }, 30000)
  it('continues collecting first-seen results during an odds outage', async () => {
    await run({ QUANT_TEST_FAIL_ODDS: '1' })
    const next = await snapshot()
    expect(next.evidence.quotes).toHaveLength(0)
    expect(next.evidence.results).toHaveLength(1)
    expect(next.collector).toMatchObject({ lastSuccessAt: null, lastBatch: { oddsOk: false, resultsOk: true } })
  }, 30000)
  it('preserves an unrelated output and respects an existing writer lock', async () => {
    await writeFile(output, '{"unrelated":true}')
    await expect(run()).rejects.toThrow('输出路径已有其他文件')
    expect(await readFile(output, 'utf8')).toBe('{"unrelated":true}')
    await writeFile(`${output}.lock`, 'existing writer')
    await expect(run()).rejects.toThrow('已有锁')
    expect(await readFile(`${output}.lock`, 'utf8')).toBe('existing writer')
  }, 30000)
})
