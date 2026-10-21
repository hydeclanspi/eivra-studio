#!/usr/bin/env node
/** Explicitly started local collector. No trading API, web server or scheduled install. */
import { readFile, writeFile, rename, open, unlink, mkdir } from 'node:fs/promises'
import { resolve, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as sleep } from 'node:timers/promises'
import { createServer } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`)
  if (index === -1) return fallback
  if (!args[index + 1] || args[index + 1].startsWith('--')) throw new Error(`--${name} 缺少参数`)
  return args[index + 1]
}
if (args.includes('--help')) {
  console.log('npm run quant:collect -- --config ./quant-collector-config.json --output ./quant-collector-snapshot.json --interval 300 [--once]\n仅手动启动后运行。导入输出 JSON 可合并证据与前向账本；关闭进程即停止。')
  process.exit(0)
}
const configPath = resolve(option('config', './quant-collector-config.json'))
const outputPath = resolve(option('output', './quant-collector-snapshot.json'))
const interval = Number(option('interval', '300'))
if (!Number.isFinite(interval) || interval < 60 || interval > 86400) throw new Error('采集间隔必须为 60–86400 秒。')
if (configPath === outputPath) throw new Error('配置与输出路径不能相同。')
const lockPath = `${outputPath}.lock`
const controller = new AbortController()
let stopping = false; let ownsLock = false; let vite; let lastWritten = null
const stop = () => { stopping = true; controller.abort() }
process.on('SIGINT', stop); process.on('SIGTERM', stop)

const readJSON = async (path, optional = false) => {
  try { return JSON.parse(await readFile(path, 'utf8')) }
  catch (error) { if (optional && error.code === 'ENOENT') return null; throw error }
}
const atomicWrite = async (value) => {
  // Stop before generating a dataset that exceeds either browser record's explicit limit.
  if ([value.evidence, value.forwardStore].some((store) => JSON.stringify(store).length * 2 > 4 * 1024 * 1024 - 32768)) throw new Error('任务档案接近浏览器 4 MiB 上限。本轮未保存，任务停止；请导回上一快照并归档，不能无限累积。')
  const data = JSON.stringify(value, null, 2)
  if (Buffer.byteLength(data) > 50 * 1024 * 1024) throw new Error('任务快照达到 50 MB 上限。已停止采集，原文件保留；请归档后另建任务。')
  const tmp = `${outputPath}.${process.pid}.tmp`
  await writeFile(tmp, data, { mode: 0o600 })
  await rename(tmp, outputPath)
  lastWritten = JSON.parse(data)
}

try {
  await mkdir(dirname(outputPath), { recursive: true })
  const lock = await open(lockPath, 'wx', 0o600)
  ownsLock = true
  await lock.writeFile(JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }))
  await lock.close()
  // SSR loads the same pure browser engines without starting an HTTP server or creating a production build.
  vite = await createServer({ root, configFile: false, appType: 'custom', logLevel: 'error', server: { middlewareMode: true, hmr: false, watch: null } })
  const evidenceLib = await vite.ssrLoadModule('/src/lib/quantEvidence.js')
  const forwardLib = await vite.ssrLoadModule('/src/lib/quantForward.js')
  const marketLib = await vite.ssrLoadModule('/src/lib/marketOdds.js')
  const resultLib = await vite.ssrLoadModule('/src/lib/matchResults.js')
  const config = await readJSON(configPath)
  if (config.schemaVersion !== 1 || !config.forwardStore || !config.evidence) throw new Error('请使用 Quant 数据中心导出的采集配置。')
  forwardLib.assertForwardStore(config.forwardStore)
  const previous = await readJSON(outputPath, true)
  if (previous && (previous.schemaVersion !== 1 || !previous.collector || !previous.forwardStore || !previous.evidence)) throw new Error('输出路径已有其他文件；未覆盖，请指定新的输出路径。')
  let evidence = evidenceLib.mergeEvidence(evidenceLib.emptyEvidenceStore(), config.evidence)
  let forwardStore = config.forwardStore
  if (previous) {
    evidence = evidenceLib.mergeEvidence(evidence, previous.evidence)
    forwardStore = forwardLib.mergeForwardStores(forwardStore, previous.forwardStore)
  }
  let collector = { ...previous?.collector, state: 'starting', updatedAt: new Date().toISOString(), intervalSeconds: interval, engineVersion: 'quant-collector/1.0.0', message: '任务已启动', configFile: basename(configPath) }
  const snapshot = () => ({ schemaVersion: 1, exportedAt: new Date().toISOString(), evidence, forwardStore, collector })
  await atomicWrite(snapshot())
  console.log(`Quant 采集器已启动，每 ${interval} 秒采集；输出 ${outputPath}。Ctrl+C 停止。`)
  while (!stopping) {
    const startedAt = new Date().toISOString()
    let oddsOk = false; let resultsOk = false
    const messages = []
    let currentEvents = []
    try {
      const odds = await marketLib.fetchOfficialMarketOdds({ timeoutMs: 12000 })
      if (odds.ok) {
        const now = new Date().toISOString()
        const payload = evidenceLib.evidenceFromOfficial(odds.matches, { now })
        evidence = evidenceLib.mergeEvidence(evidence, payload, { now, label: '独立采集器 · 官方报价' })
        currentEvents = payload.events.map(evidenceLib.eventKey).filter(Boolean)
        oddsOk = true
        messages.push(`报价 ${payload.quotes.length} 条；排除 ${payload.excluded.length} 场`)
      } else messages.push(`报价失败：${odds.reason}`)
    } catch (error) { messages.push(`报价处理失败：${error.message}`) }
    try {
      const end = new Date(); const begin = new Date(end.getTime() - 7 * 86400000)
      const chinaDate = (date) => new Date(date.getTime() + 8 * 3600000).toISOString().slice(0, 10)
      const params = new URLSearchParams({ matchPage: '1', matchBeginDate: chinaDate(begin), matchEndDate: chinaDate(end), leagueId: '', pageSize: '100', pageNo: '1' })
      const response = await fetch(`${resultLib.MATCH_RESULTS_ENDPOINT}?${params}`, { signal: AbortSignal.timeout(12000) })
      if (!response.ok) throw new Error(`赛果 HTTP ${response.status}`)
      const normalized = resultLib.normalizeMatchResults(await response.json())
      if (!normalized.ok) throw new Error(`赛果 ${normalized.reason}`)
      const now = new Date().toISOString()
      const resultPayload = evidenceLib.evidenceFromObservedResults(normalized.matches, evidence, { now })
      evidence = evidenceLib.mergeEvidence(evidence, resultPayload, { now, label: '独立采集器 · 首次观察赛果' })
      resultsOk = true
      messages.push(`新赛果 ${resultPayload.results.length} 场；无法严格匹配 ${resultPayload.excluded.length} 场；接口首批最多 100 条`)
    } catch (error) { messages.push(error.message) }
    const now = new Date().toISOString()
    forwardStore = forwardLib.processForwardBatch(forwardStore, evidence, { now, action: oddsOk ? 'all' : 'settle', scopeEventIds: currentEvents })
    collector = { ...collector, state: oddsOk && resultsOk ? 'running' : 'degraded', startedAt, updatedAt: now,
      lastSuccessAt: oddsOk ? now : collector.lastSuccessAt || null, lastResultsSuccessAt: resultsOk ? now : collector.lastResultsSuccessAt || null,
      consecutiveFailures: oddsOk ? 0 : (collector.consecutiveFailures || 0) + 1,
      message: messages.join(' · '), lastBatch: { oddsOk, resultsOk, eventCount: currentEvents.length } }
    await atomicWrite(snapshot())
    console.log(`${now} ${collector.message}`)
    if (args.includes('--once')) break
    try { await sleep(interval * 1000, undefined, { signal: controller.signal }) } catch { /* Graceful signal shutdown. */ }
  }
  collector = { ...collector, state: 'stopped', updatedAt: new Date().toISOString(), message: '采集器已停止；历史证据保留，停止期间不会采集。' }
  await atomicWrite(snapshot())
} catch (error) {
  console.error(`Quant 采集器停止：${error.code === 'EEXIST' ? `输出文件已有锁 ${lockPath}；确认旧进程已退出后再手动移除锁。` : error.message}`)
  process.exitCode = 1
  if (lastWritten) {
    try { await atomicWrite({ ...lastWritten, exportedAt: new Date().toISOString(), collector: { ...lastWritten.collector, state: 'failed', updatedAt: new Date().toISOString(), message: error.message } }) }
    catch (writeError) { console.error(`无法更新错误状态，上一文件保留：${writeError.message}`) }
  }
} finally {
  if (vite) await vite.close()
  if (ownsLock) await unlink(lockPath).catch(() => {})
}
