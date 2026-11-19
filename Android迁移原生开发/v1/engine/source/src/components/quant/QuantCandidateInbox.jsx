import { useEffect, useState } from 'react'
import { ArrowDownToLine, Check, Inbox, X } from 'lucide-react'
import { candidateIssue, getQuantCandidates, setQuantCandidateStatus } from '../../lib/quantCandidates'
import { usePreviewTextMask } from '../../lib/labels'
import './quantResearch.css'

const read = () => {
  try { return { rows: getQuantCandidates(), error: '' } }
  catch (error) { return { rows: [], error: error.message } }
}
export default function QuantCandidateInbox() {
  const [state, setState] = useState(read)
  const [notice, setNotice] = useState('')
  const maskText = usePreviewTextMask()
  useEffect(() => {
    const refresh = () => setState(read())
    window.addEventListener('eivra:data-changed', refresh)
    window.addEventListener('eivra:display-mode-changed', refresh)
    const timer = window.setInterval(refresh, 30000)
    return () => { window.removeEventListener('eivra:data-changed', refresh); window.removeEventListener('eivra:display-mode-changed', refresh); window.clearInterval(timer) }
  }, [])
  const rows = state.rows.filter((item) => !['dismissed', 'adopted'].includes(item.status))
  const update = (id, status) => {
    try { setQuantCandidateStatus(id, status); setNotice(status === 'ready' ? '已加入下方组合候选池；实际投资仍由组合页的保存操作创建。' : '候选状态已更新。') }
    catch (error) { setNotice(error.message) }
  }
  if (!rows.length && !state.error && !notice) return null
  return <section className="quant-research qr-surface qr-candidate-inbox">
    <div className="qr-section-heading"><div><span className="qr-eyebrow">RESEARCH → PORTFOLIO</span><h3><Inbox size={17} />研究候选收件箱</h3><p>先核对来源与时效，再加入组合候选。研究快照的概率会保留，不叠加另一套概率校准。</p></div><span className="qr-tag">{rows.length} 个候选</span></div>
    {(state.error || notice) && <p role={state.error ? 'alert' : 'status'} className="qr-evidence-note">{state.error || notice}</p>}
    <div className="qr-candidate-grid">{rows.map((candidate) => {
      const issue = candidateIssue(candidate)
      return <article key={candidate.id} className="qr-candidate-card">
        <div className="qr-section-heading"><strong>{maskText(candidate.home)} / {maskText(candidate.away)}</strong><button className="qr-button qr-button-quiet" aria-label="移除候选" onClick={() => update(candidate.id, 'dismissed')}><X size={14} /></button></div>
        <span className="qr-tag">{maskText(candidate.name || 'Quant 研究')} · {candidate.market === 'score' ? candidate.selection : { home: '主胜', draw: '平', away: '客胜' }[candidate.selection]}</span>
        <div className="qr-candidate-values"><span>报价 <strong>{candidate.quote.odds.toFixed(2)}</strong></span><span>冻结概率 <strong>{(candidate.forecast.probability * 100).toFixed(1)}%</strong></span></div>
        <p className="qr-note">{new Date(candidate.kickoff).toLocaleString('zh-CN')} · {candidate.quote.source}<br />采集于 {new Date(candidate.quote.observedAt).toLocaleString('zh-CN')}<br />{candidate.forecast.source} · {candidate.versionId}</p>
        {issue ? <p className="qr-evidence-note">{issue}</p> : <button className={`qr-button ${candidate.status === 'ready' ? '' : 'qr-button-primary'}`} onClick={() => update(candidate.id, candidate.status === 'ready' ? 'inbox' : 'ready')}>{candidate.status === 'ready' ? <Check size={14} /> : <ArrowDownToLine size={14} />}{candidate.status === 'ready' ? '已加入 · 点击撤回' : '加入组合候选池'}</button>}
      </article>
    })}</div>
  </section>
}
