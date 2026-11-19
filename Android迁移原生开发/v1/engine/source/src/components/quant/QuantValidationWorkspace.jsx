import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Download, FlaskConical, GitBranch, History, Play, RotateCcw } from 'lucide-react'
import { DISPLAY_MODE_CHANGE_EVENT, isPreviewMode } from '../../lib/displayMode'
import { usePreviewTextMask } from '../../lib/labels'
import {
  buildParameterCandidates, emptyValidationStore, getValidationStore, rerunValidation,
  runParameterValidation, runPriceReplay, VALIDATION_STORAGE_KEY,
} from '../../lib/quantValidation'
import './quantResearch.css'

const pct = (value) => Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : '不可用'
const number = (value) => Number.isFinite(value) ? value.toFixed(2) : '不可用'
const date = (value) => value ? new Date(value).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '未知'
const KINDS = { parameter_walk_forward: '受控参数与滚动观察', historical_price_replay: '真实历史价格回放' }
const REASONS = {
  invalid_date: '日期无效', invalid_identity: '球队身份无效', invalid_event_identity: '赛事标识或开赛时刻无效', invalid_score: '比分无效',
  conflicting_result: '赛果冲突', duplicate_result: '重复赛果', outside_period: '研究日期以外', outside_rule: '不符合球队或主客场规则',
  insufficient_training: '训练样本不足', outside_baseline_intersection: '不在基准覆盖交集', missing_source: '缺少来源',
  invalid_result_availability: '赛果可知时刻无效或晚于截止时刻', invalid_observation_time: '采集时刻无效', invalid_source_time: '来源更新时间无效',
  invalid_odds: '赔率无效', event_not_started_asof: '截止时刻尚未开赛', missing_available_result: '缺少当时已知的最终赛果',
  missing_asof_quote: '决策前没有合格报价', conflicting_quote: '同时间同来源报价冲突', market_closed: '最新记录已停盘', stale_quote: '最新报价超出时效',
  baseline_missing_asof_quote: '基准缺少决策前报价', baseline_conflicting_quote: '基准报价冲突', baseline_market_closed: '基准市场已停盘', baseline_stale_quote: '基准报价过期',
}
const reason = (value) => REASONS[value] || value || '未知'
const ruleName = (spec) => `${spec.team || '全部球队'} · ${{ any: '不限场地', home: '主场', away: '客场' }[spec.venue] || spec.venue} · ${spec.market === 'score' ? `${spec.score?.for}–${spec.score?.against}` : { win: '胜', draw: '平', lose: '负' }[spec.outcome]}`
const download = (value, filename) => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
const readStore = () => {
  try { return { store: getValidationStore(), error: '' } }
  catch (error) { return { store: emptyValidationStore(), error: error.message } }
}

function CandidateTable({ candidates, onLoadSpec }) {
  const mask = usePreviewTextMask()
  return <div className="qr-table-wrap"><table className="qr-table"><thead><tr><th>预先声明顺序</th><th>规则</th><th>统一假定赔率</th><th>操作</th></tr></thead><tbody>{candidates.map((candidate) => <tr key={candidate.id}><td>{candidate.order}</td><td>{mask(ruleName(candidate.spec))}</td><td>{number(candidate.spec.manualOdds)}</td><td><button className="qr-button qr-button-quiet" onClick={() => onLoadSpec?.(candidate.spec)} disabled={!onLoadSpec}>载入规则<ArrowRight size={13} /></button></td></tr>)}</tbody></table></div>
}

function ValidationRows({ rows, excluded = false }) {
  const [limit, setLimit] = useState(25)
  const mask = usePreviewTextMask()
  return <><div className="qr-table-wrap"><table className="qr-table"><thead><tr><th>比赛 / 时间</th><th>{excluded ? '排除原因' : '选择 / 报价'}</th>{!excluded && <><th>决策与可知时间</th><th>收益 / 基准</th><th>预测依据</th></>}</tr></thead><tbody>{rows.slice(0, limit).map((row, index) => <tr key={`${row.eventId || row.id}-${index}`}><td>{mask(`${row.home || '—'} / ${row.away || '—'}`)}<br /><small>{row.date || date(row.kickoff)}{row.fold ? ` · 窗口 ${row.fold}` : ''}</small></td><td>{excluded ? reason(row.reason) : <>{row.selection} · {number(row.odds)}<br /><small>{row.quote ? `${row.quote.source} · 采集 ${date(row.quote.observedAt)}` : '统一假定赔率'}</small></>}</td>{!excluded && <><td>{row.decisionAt ? date(row.decisionAt) : '按日情景'}<br /><small>结算：{date(row.availableAt)}{row.settlementTiming ? '（约定）' : ''}</small></td><td>{number(row.profit)} / {number(row.baselineProfit)}<br /><small>{row.hit ? '命中' : '未中'}</small></td><td>{row.forecast?.available ? <>{pct(row.forecast.probability)}<br /><small>{row.forecast.source} · 训练 {row.forecast.trainingCount || 0} 场</small></> : '不可用'}</td></>}</tr>)}</tbody></table></div>{rows.length > limit && <button className="qr-button qr-button-quiet" onClick={() => setLimit((value) => value + 50)}>继续显示 50 条 · 共 {rows.length} 条</button>}</>
}

function ValidationReport({ run, onRerun, onLoadSpec, busy }) {
  const mask = usePreviewTextMask()
  const parameter = run.kind === 'parameter_walk_forward'
  return <section className="qr-surface">
    <div className="qr-section-heading"><div><span className="qr-eyebrow">FROZEN EXPERIMENT</span><h3>{KINDS[run.kind]}</h3><p>{date(run.createdAt)} · {run.accepted.length} 场交集样本 · 同数据第 {run.exposureCount} 次已记录实验</p></div><span className="qr-tag">探索性研究</span></div>
    <p className="qr-evidence-note">{parameter ? '训练窗只选择历史命中率最高的候选，后窗均使用统一假定赔率。这不是价值选优，也不是历史真实收益。' : '仅回放决策前已采集的合格价格，收益和回撤按赛果可知时间结算；固定规则没有概率阈值时，缺少预测不会伪造概率读数。'}</p>
    <div className="qr-metric-grid"><div><span>{parameter ? '后窗情景 ROI' : '历史报价 ROI'}</span><strong>{pct(run.summary.roi)}</strong></div><div><span>累计收益 · 单位</span><strong>{number(run.summary.totalProfit)}</strong></div><div><span>最大回撤 · 单位</span><strong>{number(run.summary.maxDrawdown)}</strong></div></div>
    <div className="qr-baseline"><strong>{run.baseline.label}</strong><span>{run.baseline.summary.n} 场 · ROI {pct(run.baseline.summary.roi)} · 收益 {number(run.baseline.summary.totalProfit)} 单位</span><small>与策略只比较同事件及双方覆盖均完整的交集。差异不代表因果贡献。</small></div>
    {run.forecastCoverage && <div className="qr-evidence-strip"><span>预测覆盖 {run.forecastCoverage.available}/{run.forecastCoverage.total}</span><span>Brier {number(run.forecastCoverage.brier)}</span><span>LogLoss {number(run.forecastCoverage.logLoss)}</span><span>{run.forecastCoverage.note}</span></div>}
    {parameter && <details className="qr-details" open><summary>预先声明的全部候选<span>{run.candidates.length} 个</span></summary><CandidateTable candidates={run.candidates} onLoadSpec={onLoadSpec} /></details>}
    {parameter && run.sensitivity && <details className="qr-details" open><summary>全部候选的后窗敏感性<span>{run.sensitivity.commonEventIds.length} 场共同覆盖</span></summary>
      <p className="qr-note">{run.sensitivity.note}</p>
      <div className="qr-table-wrap"><table className="qr-table"><thead><tr><th>声明顺序</th><th>各自覆盖 / ROI</th><th>共同覆盖 ROI</th><th>共同覆盖回撤</th><th>选中窗口</th></tr></thead><tbody>{run.sensitivity.rows.map((row) => <tr key={row.candidateId}><td>候选 {row.order}</td><td>{row.ownSummary.n} 场 / {pct(row.ownSummary.roi)}</td><td>{pct(row.commonSummary.roi)}</td><td>{number(row.commonSummary.maxDrawdown)}</td><td>{row.selectedFoldCount}</td></tr>)}</tbody></table></div>
    </details>}
    {run.folds.length > 0 && <details className="qr-details" open><summary>滚动窗口与冻结规则<span>{run.folds.length} 个后窗，互不重叠</span></summary>{run.folds.map((fold) => <details className="qr-details" key={fold.id}><summary>窗口 {fold.number} · {fold.testingRange.start} 至 {fold.testingRange.endExclusive} 前<span>{fold.summary.n} 场 · 情景 ROI {pct(fold.summary.roi)}</span></summary><p className="qr-note">训练 {fold.trainingRange.start} 至 {fold.trainingRange.endExclusive} 前；{fold.selectedSpec ? `选中 ${mask(ruleName(fold.selectedSpec))}，假定赔率 ${number(fold.selectedSpec.manualOdds)}` : '全部候选未达到训练样本门槛，后窗不入选。'}</p>
      <div className="qr-table-wrap"><table className="qr-table"><thead><tr><th>候选顺序</th><th>训练样本</th><th>训练命中率</th><th>选择</th></tr></thead><tbody>{fold.trainingResults.map((row) => <tr key={row.candidateId}><td>{row.order}</td><td>{row.summary.n}</td><td>{pct(row.summary.hitRate)}</td><td>{row.candidateId === fold.selectedCandidateId ? '冻结用于本后窗' : '未选中'}</td></tr>)}</tbody></table></div>
      {fold.selectedSpec && <button className="qr-button qr-button-quiet" onClick={() => onLoadSpec?.(fold.selectedSpec)} disabled={!onLoadSpec}>载入这个窗口的规则<ArrowRight size={13} /></button>}
      <details className="qr-details"><summary>训练覆盖与排除<span>逐候选保留</span></summary>{fold.trainingResults.map((row) => <div key={row.candidateId}><p className="qr-note">候选 {row.order}：接纳 {row.acceptedEventIds.length} 场，排除 {row.excluded.length} 场。</p>{row.excluded.length > 0 && <ul>{row.excluded.slice(0, 30).map((item) => <li key={item.eventId}>{mask(item.eventId)} · {reason(item.reason)}</li>)}</ul>}</div>)}<p className="qr-note">完整事件标识保存在导出的实验快照中。</p></details>
      {fold.excluded.length > 0 && <ValidationRows rows={fold.excluded} excluded />}
    </details>)}</details>}
    <details className="qr-details"><summary>逐场入选与价格证据<span>{run.accepted.length} 条</span></summary>{run.accepted.length ? <ValidationRows key={`accepted-${run.id}`} rows={run.accepted} /> : <p className="qr-note">没有满足完整规则及基准交集的事件，收益和回撤不可用。</p>}</details>
    <details className="qr-details"><summary>逐条排除与数据问题<span>{run.excluded.length} 条</span></summary>{run.excluded.length ? <ValidationRows key={`excluded-${run.id}`} rows={run.excluded} excluded /> : <p className="qr-note">没有额外排除记录。</p>}</details>
    <details className="qr-details"><summary>计算协议、复现依据与边界</summary><dl className="qr-definition-list"><dt>数据指纹</dt><dd>{run.dataFingerprint}</dd><dt>计算版本</dt><dd>{run.engineVersion}</dd><dt>此前同数据实验</dt><dd>{run.priorExperimentIds.length} 次；仅追踪本模块的运行记录，不能证明用户此前未查看数据。</dd><dt>研究日期</dt><dd>{run.protocol.startDate} 至 {run.protocol.endDate}（UTC 日期）</dd>{!parameter && <><dt>决策时点</dt><dd>开赛前 {run.protocol.decisionLeadMinutes} 分钟；报价最长 {run.protocol.maxQuoteAgeMinutes} 分钟；来源 {run.protocol.source || '全部，按最新报价及稳定来源顺序选择'}</dd><dt>回放截止</dt><dd>{run.protocol.asOf}</dd></>}</dl><ul>{run.limitations.map((item) => <li key={item}>{item}</li>)}</ul></details>
    <div className="qr-actions"><button className="qr-button" disabled={busy} onClick={() => onRerun(run.id)}><RotateCcw size={14} />使用原快照复现</button><button className="qr-button" onClick={() => download(run, `eivra-validation-${run.id}.json`)}><Download size={14} />导出完整实验</button></div>
  </section>
}

export default function QuantValidationWorkspace({ spec, resultsIndex, evidence, onLoadSpec }) {
  const mask = usePreviewTextMask()
  const [state, setState] = useState(readStore)
  const [operationError, setOperationError] = useState('')
  const [busy, setBusy] = useState(false)
  const [kind, setKind] = useState('parameter_walk_forward')
  const [selectedId, setSelectedId] = useState('')
  const [venues, setVenues] = useState([spec.venue || 'any'])
  const [outcomes, setOutcomes] = useState([spec.outcome || 'draw'])
  const [oddsText, setOddsText] = useState(String(spec.manualOdds || 6.5))
  const [protocol, setProtocol] = useState({ startDate: '', endDate: '', trainDays: '180', testDays: '30', minTrainingSamples: '20', decisionLeadMinutes: '60', maxQuoteAgeMinutes: '60', source: '' })
  useEffect(() => {
    const refresh = (event) => {
      if (event.type === DISPLAY_MODE_CHANGE_EVENT || event.detail?.key === VALIDATION_STORAGE_KEY) setState(readStore())
    }
    window.addEventListener('eivra:data-changed', refresh); window.addEventListener(DISPLAY_MODE_CHANGE_EVENT, refresh)
    return () => { window.removeEventListener('eivra:data-changed', refresh); window.removeEventListener(DISPLAY_MODE_CHANGE_EVENT, refresh) }
  }, [])
  const candidateInput = useMemo(() => ({ spec, venueOptions: venues, outcomeOptions: outcomes, assumedOddsOptions: oddsText.split(/[,，\s]+/).filter(Boolean).map(Number) }), [spec, venues, outcomes, oddsText])
  const candidatePreview = useMemo(() => {
    try { return { candidates: buildParameterCandidates(candidateInput), error: '' } }
    catch (error) { return { candidates: [], error: error.message } }
  }, [candidateInput])
  const selected = state.store.runs.find((run) => run.id === selectedId) || state.store.runs.at(-1)
  const setField = (field, value) => setProtocol((current) => ({ ...current, [field]: value }))
  const toggle = (value, list, setter) => setter(list.includes(value) ? list.length > 1 ? list.filter((item) => item !== value) : list : [...list, value])
  const execute = (action) => {
    setOperationError(''); setBusy(true)
    try {
      const result = action()
      setState({ store: result.store, error: '' }); setSelectedId(result.run.id)
    } catch (error) { setOperationError(error.message || '实验未能保存，请检查数据与浏览器存储。') }
    finally { setBusy(false) }
  }
  const fields = kind === 'parameter_walk_forward'
    ? [['trainDays', '训练窗 · 天', 7, 3650], ['testDays', '后窗 · 天', 1, 365], ['minTrainingSamples', '候选最低训练场数', 1, 10000]]
    : [['decisionLeadMinutes', '开赛前决策 · 分钟', 1, 43200], ['maxQuoteAgeMinutes', '报价最长时效 · 分钟', 1, 10080]]
  return <div data-tour="quants.replay" data-tour-tag="FROZEN RULES · REPLAY · EVIDENCE" className="quant-research">
    <section className="qr-surface"><div className="qr-section-heading"><div><span className="qr-eyebrow">CONTROLLED RESEARCH</span><h3>扩大研究，保留每一次选择。</h3><p>先声明候选和时间协议，再显式运行。所有结果都保存为独立实验，不自动寻找“最佳收益”。</p></div><GitBranch size={20} /></div>
      <div className="qr-actions"><button className={`qr-button ${kind === 'parameter_walk_forward' ? 'qr-button-primary' : ''}`} aria-pressed={kind === 'parameter_walk_forward'} onClick={() => setKind('parameter_walk_forward')}><FlaskConical size={15} />参数批次与滚动观察</button><button className={`qr-button ${kind === 'historical_price_replay' ? 'qr-button-primary' : ''}`} aria-pressed={kind === 'historical_price_replay'} onClick={() => setKind('historical_price_replay')}><History size={15} />真实历史价格回放</button></div>
      <p className="qr-note">当前规则：{mask(ruleName(spec))} · 每场 {number(Number(spec.stakePerMatch))} 单位。球队、市场、比分及概率来源沿用上方策略编辑器。</p>
      <div className="qr-form-grid"><label>开始日期 · UTC<input type="date" value={protocol.startDate} onChange={(event) => setField('startDate', event.target.value)} /></label><label>结束日期 · UTC<input type="date" value={protocol.endDate} onChange={(event) => setField('endDate', event.target.value)} /></label></div><p className="qr-note">留空时使用数据的首末日期，并在实验中冻结该区间。</p>
      {kind === 'parameter_walk_forward' ? <>
        <div className="qr-form-grid"><fieldset><legend>主客场候选</legend><div className="qr-actions">{[['any', '不限'], ['home', '主场'], ['away', '客场']].map(([value, label]) => <label key={value}><input type="checkbox" checked={venues.includes(value)} onChange={() => toggle(value, venues, setVenues)} /> {label}</label>)}</div></fieldset>{spec.market === 'result' && <fieldset><legend>结果候选</legend><div className="qr-actions">{[['win', '胜'], ['draw', '平'], ['lose', '负']].map(([value, label]) => <label key={value}><input type="checkbox" checked={outcomes.includes(value)} onChange={() => toggle(value, outcomes, setOutcomes)} /> {label}</label>)}</div></fieldset>}<label>统一假定赔率候选<input value={oddsText} onChange={(event) => setOddsText(event.target.value)} placeholder="例如：5.5, 6.5, 7.5" inputMode="decimal" /></label></div>
        <p className="qr-evidence-note">完整候选为以上参数的组合，最多 30 个。训练窗只按命中率选择，平手使用声明顺序；赔率仅用于情景敏感性，不参与选优。基准固定为候选 1。</p>
        {candidatePreview.error ? <p role="alert" className="qr-evidence-note">{candidatePreview.error}</p> : <details className="qr-details" open><summary>运行前查看全部候选<span>{candidatePreview.candidates.length} 个</span></summary><CandidateTable candidates={candidatePreview.candidates} /></details>}
      </> : <><label className="qr-note-field">报价来源过滤 · 可选<input value={protocol.source} onChange={(event) => setField('source', event.target.value)} placeholder="留空使用全部声明来源" /></label><p className="qr-evidence-note">已载入 {evidence?.quotes?.length || 0} 条报价、{evidence?.results?.length || 0} 条有可知时间的赛果。当前或赛后补采的报价不会被当作历史可得价格，缺失不会回填假设价。</p></>}
      <div className="qr-protocol-grid">{fields.map(([key, label, min, max]) => <label key={key}>{label}<input type="number" min={min} max={max} step="1" value={protocol[key]} onChange={(event) => setField(key, event.target.value)} /></label>)}</div>
      <div className="qr-actions"><button className="qr-button qr-button-primary" disabled={busy || !!state.error || (kind === 'parameter_walk_forward' && !!candidatePreview.error)} onClick={() => execute(() => kind === 'parameter_walk_forward' ? runParameterValidation({ ...candidateInput, ...protocol, resultsIndex }) : runPriceReplay({ spec, evidence, ...protocol }))}><Play size={14} />{busy ? '正在计算与保存…' : '冻结协议并运行实验'}</button></div>
      <p className="qr-note">运行次数会进入数据曝光记录。此记录只追踪本模块，不能证明数据从未被看过；历史滚动结果仍属于探索。</p>
      {(state.error || operationError) && <p className="qr-evidence-note" role="alert">{state.error || operationError} 本次没有覆盖旧实验。</p>}
    </section>
    <section className="qr-surface"><div className="qr-section-heading"><div><h3>研究扩展记录</h3><p>{state.store.runs.length} 次已保存实验 · 包含失败候选与排除依据</p></div><button className="qr-button" disabled={!state.store.runs.length || !!state.error} onClick={() => download(state.store, 'eivra-quant-validation.json')}><Download size={14} />导出全部记录</button></div>{state.store.runs.length ? <label>选择实验<select value={selected?.id || ''} onChange={(event) => setSelectedId(event.target.value)}>{[...state.store.runs].reverse().map((run) => <option key={run.id} value={run.id}>{KINDS[run.kind]} · {date(run.createdAt)} · 同数据第 {run.exposureCount} 次</option>)}</select></label> : <p className="qr-note">先在上方声明研究协议，再运行第一项实验。</p>}</section>
    {selected && <ValidationReport run={selected} busy={busy} onLoadSpec={onLoadSpec} onRerun={(id) => execute(() => rerunValidation(id))} />}
    <p className="qr-note">{isPreviewMode() ? '公开预览使用独立内存记录，刷新后重置；导出仅包含当前预览。' : '实验保存在当前浏览器，尚未加入云同步。请定期导出完整档案。'}</p>
  </div>
}
