import { useEffect, useMemo, useRef, useState } from 'react'
import { Archive, ArrowRight, Download, FileCheck2, Play, RefreshCw } from 'lucide-react'
import { usePreviewTextMask } from '../../lib/labels'
import { instant } from '../../lib/quantEvidence'
import {
  createObservationPlan, emptyForwardStore, exportForwardSnapshot, FORWARD_KEY, FORWARD_REASON_LABELS,
  forwardPlanMetrics, getForwardStore, runForwardTask,
} from '../../lib/quantForward'
import './quantResearch.css'

const pct = (value) => Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : '不可用'
const amount = (value) => Number.isFinite(value) ? `¥${value.toFixed(2)}` : '不可用'
const decimal = (value) => Number.isFinite(value) ? value.toFixed(4) : '不可用'
const date = (value) => instant(value) === null ? '时间未知' : new Date(value).toLocaleString('zh-CN', { hour12: false })
const STATE_LABELS = { observing: '观察中 · 仅描述', insufficient_sample: '已到复盘日 · 样本不足', risk_limit_reached: '触及回撤上限 · 待复盘', review_ready: '证据已到复盘条件 · 待解释', data_disputed: '赛果存在争议 · 待核对' }
const ACTION_LABELS = { capture: '采集候选', settle: '纸面结算', review: '记录复盘', all: '完整前向批次' }
const read = () => {
  try { return { store: getForwardStore(), error: '' } }
  catch (error) { return { store: emptyForwardStore(), error: error.message } }
}
const download = (payload, filename) => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url; anchor.download = filename; anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function QuantForwardWorkspace({ versions = [], evidence, initialVersionId = '', onRefresh, onSendCandidate, onExportCollector }) {
  const mask = usePreviewTextMask()
  const [saved, setSaved] = useState(read)
  const [versionId, setVersionId] = useState(initialVersionId || versions[0]?.id || '')
  const [selectedId, setSelectedId] = useState('')
  const [reviewLocal, setReviewLocal] = useState('')
  const [minimum, setMinimum] = useState('30')
  const [drawdown, setDrawdown] = useState('')
  const [edge, setEdge] = useState('0')
  const [quoteAge, setQuoteAge] = useState('30')
  const [closingAge, setClosingAge] = useState('30')
  const [reviewNote, setReviewNote] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [clock, setClock] = useState(() => new Date().toISOString())
  const appliedInitialVersion = useRef(null)
  const { store } = saved
  const refresh = () => { setSaved(read()); setClock(new Date().toISOString()) }

  useEffect(() => {
    const update = (event) => {
      if (event.type === 'storage' ? event.key === FORWARD_KEY : !event.detail?.key || event.detail.key === FORWARD_KEY) {
        setSaved(read()); setClock(new Date().toISOString())
      }
    }
    window.addEventListener('eivra:data-changed', update)
    window.addEventListener('eivra:display-mode-changed', update)
    window.addEventListener('storage', update)
    const timer = window.setInterval(() => setClock(new Date().toISOString()), 60000)
    return () => {
      window.removeEventListener('eivra:data-changed', update)
      window.removeEventListener('eivra:display-mode-changed', update)
      window.removeEventListener('storage', update)
      window.clearInterval(timer)
    }
  }, [])
  useEffect(() => {
    // initialVersionId is a navigation hint. Refreshing records must preserve a manual plan selection.
    if (!initialVersionId || appliedInitialVersion.current === initialVersionId) return
    appliedInitialVersion.current = initialVersionId
    setVersionId(initialVersionId)
    setSelectedId(store.plans.find((plan) => plan.versionId === initialVersionId)?.id || '')
    setReviewNote('')
  }, [initialVersionId, store.plans])

  const plan = store.plans.find((item) => item.id === selectedId) || store.plans.at(-1) || null
  const version = versions.find((item) => item.id === versionId)
  const hasPlan = store.plans.some((item) => item.versionId === versionId)
  const metrics = useMemo(() => plan ? forwardPlanMetrics(store, plan.id, { now: clock, evidence }) : null, [store, plan, clock, evidence])
  const orders = plan ? store.orders.filter((item) => item.planId === plan.id) : []
  const settlements = new Map(store.settlements.map((row) => [row.orderId, row]))
  const candidates = plan ? store.candidates.filter((item) => item.planId === plan.id) : []
  const tasks = plan ? store.tasks.filter((item) => item.planId === plan.id) : []
  const reviews = plan ? store.reviews.filter((item) => item.planId === plan.id) : []
  const hasEvidence = evidence && Array.isArray(evidence.quotes) && Array.isArray(evidence.results)
  const unavailable = Boolean(saved.error || busy)

  const create = () => {
    setError(''); setNotice('')
    try {
      if (!reviewLocal) throw new Error('请预先选择复盘日期与时间。')
      const reviewAt = new Date(reviewLocal).toISOString()
      const created = createObservationPlan({ version, reviewAt, minSettled: Number(minimum), maxDrawdown: Number(drawdown),
        minExpectedRoi: Number(edge) / 100, maxQuoteAgeMinutes: Number(quoteAge), closingWindowMinutes: Number(closingAge) })
      setSelectedId(created.id); refresh()
      setNotice('观察计划已冻结。采集时将使用届时可知的报价和模型，改变条件需要新研究版本。')
      onRefresh?.()
    } catch (failure) { setError(failure.message) }
  }

  const run = async (action) => {
    if (!plan || !hasEvidence) return
    setError(''); setNotice(''); setBusy(action)
    // Yield once so the running state is visible before a synchronous local batch.
    await new Promise((resolve) => setTimeout(resolve, 0))
    try {
      const next = runForwardTask(plan.id, evidence, { action, now: new Date().toISOString(), note: action === 'review' ? reviewNote : '' })
      setSaved({ store: next, error: '' }); setClock(new Date().toISOString())
      setNotice(`${ACTION_LABELS[action]}已完成并保存。拒绝或不可用的原因可在审计明细中查看。`)
      onRefresh?.()
    } catch (failure) { setError(`${ACTION_LABELS[action]}失败：${failure.message}`) }
    finally { setBusy('') }
  }

  const send = async (order) => {
    if (!onSendCandidate) return
    setBusy('handoff'); setError(''); setNotice('')
    try {
      const result = await onSendCandidate(order, plan)
      if (result !== false) setNotice('该纸面信号已交给组合复核入口。原纸面订单与观察记录继续保留。')
    } catch (failure) { setError(failure.message) }
    finally { setBusy('') }
  }

  const exportRecords = async () => {
    setError('')
    try {
      if (onExportCollector) await onExportCollector(store, evidence)
      else download(exportForwardSnapshot(store, evidence || { schemaVersion: 1, events: [], quotes: [], results: [], imports: [] }), 'eivra-quant-forward.json')
    } catch (failure) { setError(failure.message) }
  }

  return <div className="quant-research">
    <div className="qr-intro">
      <div><span className="qr-eyebrow">FORWARD OBSERVATION</span><h3>让规则经受接下来的比赛。</h3><p>先冻结观察条件，再记录每次遇到的候选、接受或拒绝的原因，以及当时的报价与概率。纸面结果和实际资金记录分别保留。</p></div>
      <div className="qr-actions"><button type="button" className="qr-button" onClick={refresh} disabled={Boolean(busy)}><RefreshCw size={14} />刷新记录</button><button type="button" className="qr-button" onClick={exportRecords} disabled={unavailable}><Download size={14} />导出计划与完整账本</button></div>
    </div>
    {(saved.error || error) && <p className="qr-page-notice is-error" role="alert">{saved.error || error}</p>}
    {notice && <p className="qr-page-notice" role="status">{notice}</p>}
    {busy && <p className="qr-page-notice" role="status">{ACTION_LABELS[busy] || '交接'}进行中…</p>}

    <section className="qr-surface">
      <div className="qr-section-heading"><div><span className="qr-eyebrow">01 / PREDECLARE</span><h3>冻结一份观察计划</h3></div><span className="qr-tag">每个研究版本一份计划</span></div>
      {versions.length === 0 ? <p className="qr-note">先在实验室保存一个研究版本，再来确定观察条件。</p> : <>
        <div className="qr-form-grid">
          <label>研究版本<select value={versionId} onChange={(event) => setVersionId(event.target.value)} disabled={unavailable}><option value="">选择研究版本</option>{versions.map((item) => <option key={item.id} value={item.id}>{mask(item.spec?.name || '未命名研究')} · v{item.number || '—'}{store.plans.some((row) => row.versionId === item.id) ? ' · 已有计划' : ''}</option>)}</select></label>
          <label>预定复盘时间（本地时区）<input type="datetime-local" value={reviewLocal} onChange={(event) => setReviewLocal(event.target.value)} disabled={unavailable} /></label>
          <label>最低已结算样本<input type="number" min="1" step="1" value={minimum} onChange={(event) => setMinimum(event.target.value)} disabled={unavailable} /></label>
          <label>累计最大回撤上限（元）<input type="number" min="0.01" step="1" placeholder="预先确定可承受金额" value={drawdown} onChange={(event) => setDrawdown(event.target.value)} disabled={unavailable} /></label>
          <label>最低预期收益率（%）<input type="number" step="0.1" value={edge} onChange={(event) => setEdge(event.target.value)} disabled={unavailable} /></label>
          <label>入场报价新鲜窗口（分钟）<input type="number" min="1" step="1" value={quoteAge} onChange={(event) => setQuoteAge(event.target.value)} disabled={unavailable} /></label>
          <label>开赛前报价窗口（分钟）<input type="number" min="1" step="1" value={closingAge} onChange={(event) => setClosingAge(event.target.value)} disabled={unavailable} /></label>
        </div>
        <p className="qr-note">每单纸面金额沿用版本的 {amount(version?.spec?.stakePerMatch)}。默认收益门槛 0% 只接受模型估计的非负预期收益；去水市场概率通常会被拒绝。若研究目标需要观察负预期样本，可在冻结前显式填写负值。</p>
        <div className="qr-actions"><button type="button" className="qr-button qr-button-primary" onClick={create} disabled={unavailable || !version || hasPlan || !reviewLocal || !drawdown}><FileCheck2 size={14} />冻结观察计划</button>{hasPlan && <span className="qr-note">此版本已冻结；调整计划请创建新版本。</span>}</div>
      </>}
    </section>

    {plan && <>
      <section className="qr-surface">
        <div className="qr-section-heading"><div><span className="qr-eyebrow">02 / OBSERVE</span><h3>候选与纸面订单</h3></div><label>当前计划<select value={plan.id} onChange={(event) => { setSelectedId(event.target.value); setReviewNote('') }} disabled={Boolean(busy)}>{store.plans.map((item) => <option key={item.id} value={item.id}>{mask(item.name)} · v{item.versionSnapshot.number || '—'}</option>)}</select></label></div>
        <dl className="qr-definition-list"><dt>冻结于</dt><dd>{date(plan.createdAt)}</dd><dt>复盘条件</dt><dd>{date(plan.reviewAt)} · 至少 {plan.minSettled} 个结算样本</dd><dt>风险边界</dt><dd>最大回撤 {amount(plan.maxDrawdown)} · 每单 {amount(plan.stake)}</dd><dt>当前阶段</dt><dd>{STATE_LABELS[metrics.assessment]}{metrics.riskHalted && !metrics.reviewDue ? ' · 新增订单已暂停' : ''}</dd></dl>
        <div className="qr-actions"><button type="button" className="qr-button qr-button-primary" onClick={() => run('capture')} disabled={unavailable || !hasEvidence}><Play size={14} />采集本批候选</button><button type="button" className="qr-button" onClick={() => run('settle')} disabled={unavailable || !hasEvidence}><RefreshCw size={14} />纸面结算</button></div>
        <p className="qr-note">页面按钮按当前时间运行；导入历史报价不会补造过去的决策。连续采集需要外部采集器运行，最近任务回执显示在下方。</p>
        {metrics.disputed > 0 && <p className="qr-page-notice is-error" role="status">{metrics.disputed} 张纸面订单的赛果存在争议，已从当前绩效中排除，并暂停新增。原结算快照与冲突证据继续保留，需要核对来源。</p>}
        <div className="qr-metric-grid">
          <div><span>纸面收益率</span><strong>{pct(metrics.roi)}</strong><small>{metrics.coverage.roi}/{metrics.orders} 单已结算</small></div>
          <div><span>累计纸面盈亏</span><strong>{amount(metrics.profit)}</strong><small>仅计已结算订单</small></div>
          <div><span>Brier 分数</span><strong>{decimal(metrics.brier)}</strong><small>{metrics.coverage.brier}/{metrics.settled} 个结算样本有概率</small></div>
          <div><span>平均 CLV</span><strong>{pct(metrics.clv)}</strong><small>{metrics.coverage.clv}/{metrics.settled} 个样本有合格临场报价</small></div>
          <div><span>最大回撤</span><strong>{amount(metrics.maxDrawdown)}</strong><small>按赛果可知时间，同刻合并入账</small></div>
          <div><span>近期 ROI 变化</span><strong>{pct(metrics.drift.deltaRoi)}</strong><small>{metrics.drift.previousCount} / {metrics.drift.recentCount} 单 · 两窗各需至少 {plan.driftWindow} 单</small></div>
        </div>
        <p className="qr-note">CLV = 入场赔率 ÷ 同来源、同盘口的赛前参考赔率 − 1。没有满足新鲜窗口的报价时显示不可用。近期变化仅描述已观测样本。</p>
        {orders.length === 0 ? <p className="qr-note">尚无接受的纸面订单。每次拒绝同样会进入审计账本。</p> : <div style={{ overflowX: 'auto' }}><table className="w-full text-xs text-left"><thead><tr><th className="p-2">比赛 / 选择</th><th className="p-2">决策与报价</th><th className="p-2">冻结概率</th><th className="p-2">纸面结果</th><th className="p-2">复核</th></tr></thead><tbody>{orders.map((order) => {
          const settled = settlements.get(order.id)
          const disputed = metrics.disputedOrderIds.includes(order.id)
          return <tr key={order.id} className="border-t border-stone-100"><td className="p-2">{mask(order.home)} vs {mask(order.away)}<br /><span className="text-stone-400">{order.market === 'score' ? '比分' : '胜平负'} · {order.selection}</span></td><td className="p-2">{date(order.decisionAt)}<br />{order.entryOdds.toFixed(2)} · {order.entryQuote.source}</td><td className="p-2">{pct(order.forecastSnapshot.probability)}<br /><span className="text-stone-400">{order.forecastSnapshot.source}</span></td><td className="p-2">{disputed ? '赛果争议 · 不计入当前绩效' : settled ? `${settled.hit ? '命中' : '未命中'} · ${amount(settled.profit)}` : '等待可知且无冲突的赛果'}</td><td className="p-2">{onSendCandidate ? <button type="button" className="qr-button qr-button-quiet" onClick={() => send(order)} disabled={unavailable || disputed || Boolean(settled) || instant(order.kickoff) <= instant(clock)}>送组合复核<ArrowRight size={12} /></button> : '—'}</td></tr>
        })}</tbody></table></div>}
      </section>

      <section className="qr-surface">
        <div className="qr-section-heading"><div><span className="qr-eyebrow">03 / REVIEW</span><h3>按事先约定复盘</h3></div><span className="qr-tag">{STATE_LABELS[metrics.assessment]}</span></div>
        <p className="qr-note">{metrics.reviewDue ? '已到约定日期。样本量与风险边界满足后，结果仍需要人工解释，不会自动晋级实际资金策略。' : '预定日期前的盈亏和概率分数只作描述，不据短期表现判定策略通过。'}</p>
        <label className="block">复盘记录<textarea rows={3} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="记录哪些证据支持或反驳原假设，以及仍缺少什么。" disabled={unavailable} /></label>
        <button type="button" className="qr-button" onClick={() => run('review')} disabled={unavailable || !hasEvidence}><Archive size={14} />保存本次复盘</button>
        {reviews.length > 0 && <details className="qr-details"><summary>复盘历史 <span>{reviews.length} 次</span></summary>{[...reviews].reverse().map((review) => <article key={review.id} className="py-3 border-t border-stone-100"><strong>{STATE_LABELS[review.assessment]}</strong><p className="qr-note">{date(review.createdAt)} · 已结算 {review.metrics.settled} 单 · {review.boundary}</p>{review.note && <p>{mask(review.note)}</p>}</article>)}</details>}
      </section>

      <details className="qr-surface qr-details"><summary>任务状态与候选审计 <span>{candidates.length} 条候选 · {tasks.length} 次任务</span></summary>
        <p className="qr-note">同版本、同赛事只生成一张纸面订单。重试会保留新的审计记录；下方显示最近 100 条，完整历史可导出。</p>
        <div className="qr-run-list">{[...tasks].reverse().slice(0, 8).map((task) => <div key={task.id} className="qr-run-row"><span>{ACTION_LABELS[task.action] || task.action} · 已完成</span><small>{date(task.completedAt)}</small><span className="qr-note">{Object.entries(task.counts || {}).map(([key, value]) => `${({ candidates: '候选', accepted: '接受', rejected: '拒绝', added: '新结算', missing: '待赛果', conflicting: '冲突', settled: '已结算', required: '最低样本', assessment: '阶段' })[key] || key}: ${STATE_LABELS[value] || value}`).join(' · ')}</span></div>)}</div>
        {tasks.at(-1)?.issues?.length > 0 && <p className="qr-note">最近结算提示：{tasks.at(-1).issues.map((item) => FORWARD_REASON_LABELS[item.reason] || item.reason).filter((item, index, all) => all.indexOf(item) === index).join('；')}</p>}
        <div style={{ overflowX: 'auto' }}><table className="w-full text-xs text-left"><thead><tr><th className="p-2">决策时间</th><th className="p-2">候选事件</th><th className="p-2">处理结果</th></tr></thead><tbody>{[...candidates].reverse().slice(0, 100).map((candidate) => <tr className="border-t border-stone-100" key={candidate.id}><td className="p-2">{date(candidate.decisionAt)}</td><td className="p-2">{mask(candidate.home)} vs {mask(candidate.away)}</td><td className="p-2">{FORWARD_REASON_LABELS[candidate.reason] || candidate.reason}</td></tr>)}</tbody></table></div>
      </details>
    </>}
  </div>
}

export default QuantForwardWorkspace
