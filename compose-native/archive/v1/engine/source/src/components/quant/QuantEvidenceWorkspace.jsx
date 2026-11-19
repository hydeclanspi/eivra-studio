import { useEffect, useState } from 'react'
import { Database, Download, RefreshCw, Upload, Radio } from 'lucide-react'
import { evidenceCoverage, importEvidence, instant, mergeEvidence } from '../../lib/quantEvidence'
import { exportForwardSnapshot, getForwardStore, importForwardSnapshot, mergeForwardStores } from '../../lib/quantForward'
import { downloadResearch } from './QuantResearchWorkspace'
import { usePreviewTextMask } from '../../lib/labels'

const EXAMPLE = { schemaVersion: 1, quotes: [{ home: '主队名称', away: '客队名称', kickoff: '2026-09-01T20:00:00+08:00', market: 'result', selection: 'home', odds: 2.1, observedAt: '2026-09-01T19:00:00+08:00', source: '你的真实数据来源', tradable: true }], results: [{ home: '主队名称', away: '客队名称', kickoff: '2026-09-01T20:00:00+08:00', homeGoals: 1, awayGoals: 0, availableAt: '2026-09-01T22:00:00+08:00', source: '你的真实数据来源' }] }
const date = (value) => value ? new Date(value).toLocaleString('zh-CN') : '尚无记录'
export default function QuantEvidenceWorkspace({ evidence, onCollect, collecting, onCollectResults, resultsCollecting, onRefresh, error }) {
  const [raw, setRaw] = useState('')
  const [notice, setNotice] = useState({ error: false, text: '' })
  const [reading, setReading] = useState(false)
  const [clock, setClock] = useState(Date.now)
  useEffect(() => { const timer = window.setInterval(() => setClock(Date.now()), 60000); return () => window.clearInterval(timer) }, [])
  const maskText = usePreviewTextMask()
  const coverage = evidenceCoverage(evidence)
  const lastCollector = [...evidence.imports].reverse().find((row) => row.collector)?.collector
  const snapshotStale = lastCollector && (instant(lastCollector.updatedAt) === null || clock - instant(lastCollector.updatedAt) > Math.max(120, lastCollector.intervalSeconds * 2) * 1000)
  const importPayload = (input, label) => {
    let evidenceWritten = false
    try {
      const parsed = typeof input === 'string' ? JSON.parse(input) : input
      const incoming = parsed.evidence || parsed
      const before = evidence.quotes.length
      mergeEvidence(evidence, incoming, { collector: parsed.collector || null }) // Validate every evidence row and task clock before either write.
      if (parsed.forwardStore) mergeForwardStores(getForwardStore(), parsed.forwardStore)
      const next = importEvidence(incoming, { label, collector: parsed.collector || null })
      evidenceWritten = true
      if (parsed.forwardStore) importForwardSnapshot(parsed)
      setNotice({ error: false, text: `已导入 ${Math.max(0, next.quotes.length - before)} 条新报价。相同记录已去重${parsed.forwardStore ? '，前向账本已合并' : ''}。来源与时间戳保留为文件声明；文件导入本身不证明来源真实性。` })
      setRaw(''); onRefresh?.()
    } catch (failure) { setNotice({ error: true, text: `${evidenceWritten ? '证据已保存，前向账本未合并：' : '本次导入未保存：'}${failure.message}` }); onRefresh?.() }
  }
  const readFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setReading(true)
    try {
      if (file.size > 50 * 1024 * 1024) throw new Error('文件超过 50 MiB，请按日期拆分后导入。')
      importPayload(await file.text(), file.name)
    } catch (failure) { setNotice({ error: true, text: failure.message }) }
    finally { setReading(false); event.target.value = '' }
  }
  const exportConfig = () => {
    try { downloadResearch(exportForwardSnapshot(getForwardStore(), evidence), 'quant-collector-config.json'); setNotice({ error: false, text: '已导出冻结计划与证据。采集器需要在本地终端手动启动，导出文件不会启动任务。' }) }
    catch (failure) { setNotice({ error: true, text: failure.message }) }
  }
  return <div className="quant-research">
    <section className="qr-surface">
      <div className="qr-section-heading"><div><span className="qr-eyebrow">AS-OF EVIDENCE</span><h3>赛前报价与赛果证据</h3><p>用采集时间回答「当时知道什么」。只有赛果、没有赛前价格的历史数据，仍用于规律研究。</p></div><Database size={20} /></div>
      <div className="qr-metric-grid"><div><span>已记录赛事</span><strong>{coverage.events}</strong></div><div><span>报价快照</span><strong>{coverage.quotes}</strong></div><div><span>同时有赛前价与赛果</span><strong>{coverage.replayable} 场</strong></div></div>
      <p className="qr-note">最近报价 {date(coverage.latest)} · 可知时间明确的赛果 {coverage.results} 场。上方覆盖数只是回放的初步交集，决策窗口、目标选项与基准覆盖会在运行时继续筛选。</p>
      <div className="qr-actions"><button className="qr-button qr-button-primary" onClick={onCollect} disabled={collecting}><RefreshCw size={14} />{collecting ? '采集中…' : '采集当前官方报价'}</button><button className="qr-button" onClick={onCollectResults} disabled={resultsCollecting}>{resultsCollecting ? '获取赛果中…' : '获取官方赛果并记录首次可知时间'}</button><button className="qr-button" onClick={() => downloadResearch(evidence, 'eivra-quant-evidence.json')}><Download size={14} />导出证据</button></div>
      <p className="qr-note">官方页面的时间按中国标准时间转换。当前采集不会补造过往报价；首次取得的赛果只记录今天的可知时间，不能据此回填过去模型。</p>
      {(error || notice.text) && <p className={`qr-page-notice ${error || notice.error ? 'is-error' : ''}`} role={error || notice.error ? 'alert' : 'status'}>{error || notice.text}</p>}
      <details className="qr-details"><summary>导入真实报价 / 采集器快照<span>JSON · 逐条校验 · 相同记录去重</span></summary>
        <label className="qr-file-input"><Upload size={15} />{reading ? '读取中…' : '选择 JSON 文件'}<input type="file" accept=".json,application/json" onChange={readFile} disabled={reading} /></label>
        <label className="qr-note-field">或粘贴 JSON<textarea rows={7} value={raw} onChange={(event) => setRaw(event.target.value)} maxLength={8 * 1024 * 1024} placeholder="粘贴 schemaVersion、quotes 和 results；或完整的采集器快照" /></label>
        <div className="qr-actions"><button className="qr-button qr-button-primary" disabled={!raw.trim()} onClick={() => importPayload(raw, '手动 JSON')}>校验并导入</button><button className="qr-button" onClick={() => downloadResearch(EXAMPLE, 'quant-evidence-format-example.json')}>下载格式示例</button></div>
        <p className="qr-note">示例只说明格式，请替换为真实证据后导入。所有时间必须包含 Z 或 +08:00 等时区；result 的 availableAt 是赛果首次可知时间。导入后的订单、报价与结果不会因再次导入而被改写。</p>
        <pre className="qr-code-block">{JSON.stringify(EXAMPLE, null, 2)}</pre>
      </details>
    </section>
    <section className="qr-surface qr-collector-panel">
      <div className="qr-section-heading"><div><span className="qr-eyebrow">COLLECTION TASK</span><h3><Radio size={17} />页面关闭后的采集</h3><p>独立本地进程持续获取报价，并按照已冻结的观察计划生成纸面决策。</p></div><span className="qr-tag qr-tag-muted">{lastCollector ? '已导入任务快照' : '尚无任务快照'}</span></div>
      <ol className="qr-workflow-list"><li><strong>冻结观察计划</strong><span>在影子观察中确定版本、复盘日期、入选门槛与风险限制。</span></li><li><strong>导出配置并启动</strong><span>在项目目录执行下方命令。电脑和终端进程需持续运行。</span></li><li><strong>导入任务快照</strong><span>将输出 JSON 导回上方入口，合并完整候选、报价、纸单和任务状态。</span></li></ol>
      <button className="qr-button" onClick={exportConfig}><Download size={14} />导出采集器配置</button>
      <pre className="qr-code-block">npm run quant:collect -- --config ./quant-collector-config.json --output ./quant-collector-snapshot.json --interval 300</pre>
      <p className="qr-note">默认不开启后台任务。此页面展示导入时的状态快照，没有连接正在运行的进程；若更新计划，需要重新导出配置并重启采集器。网络中断、电脑休眠和任务退出造成的缺口会保留。</p>
      {lastCollector && <><p className="qr-evidence-note">{snapshotStale ? '任务快照已过期，当前运行状态未知。请导入新的输出文件。' : '这是最近导入的任务快照，当前进程状态仍需在运行终端确认。'}</p><dl className="qr-definition-list"><dt>导入的任务状态</dt><dd>{({ starting: '启动中', running: '最近批次成功', degraded: '部分采集失败', stopped: '已停止', failed: '任务失败' })[lastCollector.state] || '未知'} · {date(lastCollector.updatedAt)}</dd><dt>最近报价成功</dt><dd>{date(lastCollector.lastSuccessAt)}</dd><dt>最近赛果成功</dt><dd>{date(lastCollector.lastResultsSuccessAt)}</dd><dt>最近任务消息</dt><dd>{maskText(lastCollector.message || '无')}</dd></dl></>}
      <details className="qr-details"><summary>导入记录<span>{evidence.imports.length} 次</span></summary><div className="qr-table-wrap"><table className="qr-table"><thead><tr><th>时间</th><th>来源 / 文件</th><th>新增记录</th></tr></thead><tbody>{[...evidence.imports].reverse().slice(0, 30).map((row) => <tr key={row.id}><td>{date(row.at)}</td><td>{maskText(row.label)}</td><td>{row.added}</td></tr>)}</tbody></table></div></details>
    </section>
  </div>
}
