import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ArrowUpRight, BookOpen, Check, ChevronRight, Download, FlaskConical, GitBranch, History, Layers, Plus, RotateCcw } from 'lucide-react'
import { compareResearchRuns } from '../../lib/quantResearch'
import { isPreviewMode } from '../../lib/displayMode'
import { usePreviewTextMask } from '../../lib/labels'
import './quantResearch.css'

export const RESEARCH_KINDS = {
  simulation: '条件推演',
  frequency: '历史规律研究',
  scenario: '假设赔率情景',
}

const pct = (value) => Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : '不可用'
const num = (value) => Number.isFinite(value) ? value.toFixed(2) : '不可用'
const date = (value) => value ? new Date(value).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
const count = (value) => Number.isFinite(value) ? value : '—'
const labelValue = (value) => value == null || value === '' ? '未设置' : typeof value === 'object' ? JSON.stringify(value) : String(value)
const REASONS = {
  missing_or_invalid_date: '日期缺失或无效', invalid_score: '比分无效', missing_team: '球队缺失',
  invalid_team_identity: '赛事身份无效', conflicting_result: '同场赛果冲突', duplicate: '重复赛事',
  outside_period: '不在实验日期内', outside_team: '不在所选球队范围', outside_venue: '不符合主客场规则',
}
const FIELD_LABELS = { name: '策略名称', team: '球队范围', venue: '主客场', market: '市场', score: '比分规则', outcome: '结果规则', matchesPlanned: '计划场次', stakePerMatch: '每场投入', oddsMode: '赔率来源', manualOdds: '假定赔率', probMode: '概率来源', customProb: '自定义概率', bankroll: '资金假设' }

export function downloadResearch(value, filename = 'eivra-quant-research.json') {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function ResearchDesk({ store, onStart, onOpenRun, onNavigate, onGuide, shadowCount, resultCount }) {
  const maskText = usePreviewTextMask()
  const recent = [...store.runs].reverse().slice(0, 4)
  const pendingConclusions = store.runs.filter((run) => !run.conclusion?.trim()).length
  return (
    <div className="quant-research">
      <section className="qr-intro">
        <div>
          <span className="qr-eyebrow">INTUITION, CALIBRATED.</span>
          <h3>给一个直觉，建立一份证据。</h3>
          <p>写下你的判断，冻结规则，比较结果。每次修改都有记录，每个结论都有来处。</p>
          <div className="qr-actions">
            <button className="qr-button qr-button-primary" onClick={() => onStart('idea')}><Plus size={15} />开始一项研究</button>
            <button className="qr-button qr-button-quiet" onClick={onGuide}><BookOpen size={15} />先了解研究流程</button>
          </div>
        </div>
        <ol className="qr-path" aria-label="研究路径">
          {['提出假设', '冻结与实验', '理解证据', '前向观察'].map((step, i) => <li key={step}><span>0{i + 1}</span>{step}{i < 3 && <ChevronRight size={13} aria-hidden="true" />}</li>)}
        </ol>
      </section>

      <div className="qr-status-row">
        <span><strong>{store.projects.length}</strong> 项研究</span>
        <span><strong>{store.runs.length}</strong> 次实验</span>
        <button onClick={() => onNavigate('library')}><strong>{pendingConclusions}</strong> 份结论待补充<ArrowUpRight size={13} /></button>
        <button onClick={() => onNavigate('shelf')}><strong>{shadowCount}</strong> 个观察策略<ArrowUpRight size={13} /></button>
      </div>

      <div className="qr-start-grid">
        {[
          { id: 'idea', title: '检验一个想法', text: '把「某队的平局可能被低估」整理成规则与失效条件。', Icon: FlaskConical },
          { id: 'history', title: '观察历史规律', text: '从已知赛果了解频率与分布，再决定如何验证。', Icon: History },
          { id: 'compare', title: '比较策略版本', text: '对齐实验条件，检查一次规则修改带来了什么。', Icon: GitBranch },
        ].map(({ id, title, text, Icon }) => (
          <button className="qr-start-card" key={id} onClick={() => onStart(id)}>
            <Icon size={20} strokeWidth={1.6} /><strong>{title}</strong><span>{text}</span><ArrowRight size={16} />
          </button>
        ))}
      </div>

      <section className="qr-surface">
        <div className="qr-section-heading"><div><h3>继续研究</h3><p>查看最近的实验，或沿用一个版本继续探索。</p></div><button className="qr-button qr-button-quiet" onClick={() => onNavigate('library')}>全部记录<ArrowRight size={14} /></button></div>
        {recent.length ? <div className="qr-run-list">{recent.map((run) => {
          const version = store.versions.find((item) => item.id === run.versionId)
          return <button key={run.id} className="qr-run-row" onClick={() => onOpenRun(run.id)}><span className="qr-run-icon"><Layers size={17} /></span><span><strong>{maskText(version?.spec?.name || '未命名研究')}</strong><small>{RESEARCH_KINDS[run.kind]} · v{version?.number} · {date(run.createdAt)}</small></span><span className="qr-tag">{run.conclusion ? '已有研究结论' : '待记录结论'}</span><ChevronRight size={16} /></button>
        })}</div> : <div className="qr-empty"><FlaskConical size={26} strokeWidth={1.3} /><p>你的第一份研究记录，从一个具体的问题开始。</p><span>运行实验后，规则、数据和结果会一起保存在这里。</span></div>}
        {!resultCount && <button className="qr-inline-notice" onClick={() => onNavigate('data')}>历史赛果尚未准备好。前往数据中心导入，或先使用条件推演。<ArrowRight size={14} /></button>}
      </section>
    </div>
  )
}

export function ResearchBriefEditor({ brief, onChange, protocol, onProtocolChange, projectName, onNewResearch }) {
  return (
    <section className="quant-research qr-surface qr-brief">
      <div className="qr-section-heading"><div><span className="qr-eyebrow">RESEARCH BRIEF</span><h3>{projectName ? `继续研究 · ${projectName}` : '从研究问题开始'}</h3><p>每次运行都会冻结当前规则与输入。修改后运行，将保留一个新版本。</p></div>{projectName && <button className="qr-button" onClick={onNewResearch}><Plus size={14} />另建研究</button>}</div>
      <div className="qr-form-grid">
        <label>研究假设<textarea value={brief.hypothesis} onChange={(e) => onChange({ ...brief, hypothesis: e.target.value })} placeholder="我认为什么规律可能存在？依据是什么？" rows={2} maxLength={3000} /></label>
        <label>失效条件<textarea value={brief.falsifier} onChange={(e) => onChange({ ...brief, falsifier: e.target.value })} placeholder="出现什么结果，我会修正或放弃这个想法？" rows={2} maxLength={3000} /></label>
      </div>
      <details className="qr-details">
        <summary>实验范围与研究笔记<span>可选；历史实验使用日期范围</span></summary>
        <div className="qr-protocol-grid">
          <label>开始日期<input type="date" value={protocol.startDate} onChange={(e) => onProtocolChange({ ...protocol, startDate: e.target.value })} /></label>
          <label>结束日期<input type="date" value={protocol.endDate} onChange={(e) => onProtocolChange({ ...protocol, endDate: e.target.value })} /></label>
          <label>后段观察起点<input type="date" value={protocol.holdoutStart} onChange={(e) => onProtocolChange({ ...protocol, holdoutStart: e.target.value })} /></label>
        </div>
        <p className="qr-note">日期切分用于描述前后表现。若已经用整段数据筛选过策略，后段结果仍属于探索，不能当作独立验证。</p>
        <label className="qr-note-field">研究笔记<textarea value={brief.notes} onChange={(e) => onChange({ ...brief, notes: e.target.value })} rows={2} maxLength={5000} placeholder="判断来源、尚待确认的问题、计划复盘时间…" /></label>
      </details>
    </section>
  )
}

function EvidenceTable({ rows, excluded = false }) {
  const [limit, setLimit] = useState(20)
  const maskText = usePreviewTextMask()
  return <><div className="qr-table-wrap"><table className="qr-table"><thead><tr><th>日期</th><th>比赛</th><th>{excluded ? '排除原因' : '赛果'}</th>{!excluded && <th>规则结果</th>}</tr></thead><tbody>
    {rows.slice(0, limit).map((row, i) => <tr key={`${row.id}-${i}`}><td>{row.date || '未知'}</td><td>{maskText(`${row.home || '—'} / ${row.away || '—'}`)}</td><td>{excluded ? REASONS[row.reason] || row.reason : `${row.homeGoals ?? row.homeScore}–${row.awayGoals ?? row.awayScore}`}</td>{!excluded && <td>{row.hit ? '命中' : '未中'}</td>}</tr>)}
  </tbody></table></div>{rows.length > limit && <button className="qr-button qr-button-quiet" onClick={() => setLimit((value) => value + 50)}>再显示 50 场 · 共 {rows.length} 场</button>}</>
}

export function ResearchRunReport({ run, version, onRerun, onConclusion, onLoadVersion, onShadow, compact = false }) {
  const [conclusion, setConclusion] = useState(run?.conclusion || '')
  const [saved, setSaved] = useState(false)
  const maskText = usePreviewTextMask()
  useEffect(() => { setConclusion(run?.conclusion || ''); setSaved(false) }, [run?.id, run?.conclusion])
  if (!run) return null
  const result = run.result
  const summary = result.summary || {}
  const simulation = run.kind === 'simulation'
  const included = result.included || []
  const excluded = result.excluded || []
  const spec = version?.spec || run.inputSnapshot?.spec || {}
  const metrics = simulation
    ? [['条件期望收益', num(summary.expectedProfit)], ['条件期望 ROI', pct(summary.expectedRoi)], ['盈利概率', pct(summary.profitProbability)]]
    : [['有效样本', `${count(summary.n)} 场`], ['命中率', pct(summary.hitRate)], [run.kind === 'frequency' ? '命中率区间 · 95%' : '情景 ROI', run.kind === 'frequency' ? summary.hitCI ? `${pct(summary.hitCI.low)} – ${pct(summary.hitCI.high)}` : '不可用' : pct(summary.roi)]]
  return (
    <section className={`quant-research qr-surface qr-report ${compact ? 'qr-report-compact' : ''}`}>
      <div className="qr-section-heading"><div><span className="qr-eyebrow">EXPERIMENT RECORD · v{version?.number || '—'}</span><h3>{maskText(spec.name || '未命名研究')}</h3><p>{RESEARCH_KINDS[run.kind]} · {date(run.createdAt)}{run.reproductionOf && ' · 使用原始快照复现'}</p></div><span className="qr-tag"><Check size={12} />已冻结并保存</span></div>
      <div className="qr-evidence-note">{result.disclaimer || '条件推演依赖输入假设，不是历史可执行收益，也不是已验证的预测能力。'}</div>
      <div className="qr-metric-grid">{metrics.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      <div className="qr-evidence-strip"><span>来源 {count(result.counts?.source)} 条</span><span>入选 {count(result.counts?.selected)} 条</span><span>排除 {count(result.counts?.excluded)} 条</span>{simulation && <span>估计场次 {count(result.counts?.estimated)} 场</span>}<span>证据：{simulation ? '输入假设下的推演' : '探索性历史观察'}</span></div>
      {run.kind === 'scenario' && <div className="qr-baseline"><strong>假设收益 {num(summary.totalProfit)} 单位</strong><span>累计投入 {num(summary.totalStaked)} · 最大回撤 {num(summary.maxDrawdown)} 单位</span></div>}
      {result.baseline?.summary && <div className="qr-baseline"><strong>{result.baseline.label || '描述性基准'}</strong><span>{count(result.baseline.summary.n)} 场 · 命中率 {pct(result.baseline.summary.hitRate)}</span><small>基准用于提供上下文；样本范围不同，不代表策略带来的因果提升。</small></div>}
      {result.split?.enabled && <div className="qr-split"><div><span>前段 · {count(result.split.training?.n)} 场</span><strong>{pct(result.split.training?.hitRate)}</strong></div><div><span>后段 · {count(result.split.holdout?.n)} 场</span><strong>{pct(result.split.holdout?.hitRate)}</strong></div><p>{result.split.note || '单次时间切分，仅作探索性比较；不自动构成独立验证。'}</p></div>}
      {!compact && <>
        {included.length > 0 && <details className="qr-details"><summary>{simulation ? '逐场推演输入' : '逐场入选记录'}<span>{included.length} 场</span></summary>{simulation ? <div className="qr-table-wrap"><table className="qr-table"><thead><tr><th>场次</th><th>概率</th><th>赔率</th><th>依据</th></tr></thead><tbody>{included.map((leg, i) => <tr key={leg.id || i}><td>{maskText(leg.label || `${leg.home || '估计'} / ${leg.away || '场次'}`)}</td><td>{pct(leg.p)}</td><td>{num(leg.odds)}</td><td>{leg.estimated ? '估计场次' : leg.forecastSnapshot?.source === 'base' ? '联赛基准估计' : '当前报价与概率快照'}</td></tr>)}</tbody></table></div> : <EvidenceTable key={`in-${run.id}`} rows={included} />}</details>}
        {excluded.length > 0 && <details className="qr-details"><summary>排除与数据问题<span>{excluded.length} 条</span></summary><EvidenceTable key={`out-${run.id}`} rows={excluded} excluded /></details>}
        <details className="qr-details"><summary>规则与复现依据<span>查看本次冻结内容</span></summary><dl className="qr-definition-list">
          <dt>研究假设</dt><dd>{maskText(version?.brief?.hypothesis || run.inputSnapshot?.brief?.hypothesis || '未填写')}</dd>
          <dt>失效条件</dt><dd>{maskText(version?.brief?.falsifier || run.inputSnapshot?.brief?.falsifier || '未填写')}</dd>
          <dt>范围</dt><dd>{maskText(spec.team || '全部球队')} · {spec.venue === 'home' ? '主场' : spec.venue === 'away' ? '客场' : '不限场地'} · {spec.market === 'score' ? `比分 ${spec.score?.for}–${spec.score?.against}` : { win: '胜', draw: '平', lose: '负' }[spec.outcome]}</dd>
          <dt>数据指纹</dt><dd>{run.dataFingerprint}</dd><dt>计算版本</dt><dd>{run.engineVersion}</dd><dt>随机种子</dt><dd>{run.randomSeed ?? '不使用随机抽样'}</dd>
        </dl></details>
        <label className="qr-note-field">研究结论<textarea rows={3} value={conclusion} onChange={(e) => { setConclusion(e.target.value); setSaved(false) }} maxLength={5000} placeholder="证据支持什么？尚不能回答什么？下一步继续观察、修改规则，还是归档这一思路？" /></label>
        <div className="qr-actions"><button className="qr-button qr-button-primary" onClick={() => { const ok = onConclusion(run.id, conclusion); setSaved(ok !== false) }}>{saved ? <Check size={14} /> : null}{saved ? '结论已保存' : '保存研究结论'}</button><button className="qr-button" onClick={() => onRerun(run.id)}><RotateCcw size={14} />原样复现</button><button className="qr-button" onClick={() => onLoadVersion(version)}><GitBranch size={14} />修改为新版本</button><button className="qr-button" onClick={() => downloadResearch({ version, run }, `eivra-experiment-${run.id}.json`)}><Download size={14} />导出实验</button>{onShadow && <button className="qr-button" onClick={() => onShadow(version, run)}>冻结进入影子观察<ArrowRight size={14} /></button>}</div>
        <p className="qr-note">进入影子观察表示开始积累新证据，不代表本次实验已证明策略有效。</p>
      </>}
    </section>
  )
}

function ResearchComparison({ store }) {
  const [leftId, setLeftId] = useState('')
  const [rightId, setRightId] = useState('')
  const maskText = usePreviewTextMask()
  const left = store.runs.find((run) => run.id === leftId)
  const right = store.runs.find((run) => run.id === rightId)
  const comparison = useMemo(() => left && right ? compareResearchRuns(left, right) : null, [left, right])
  const names = { n: '样本数', hits: '命中数', hitRate: '命中率', roi: '情景 ROI', totalProfit: '情景收益', expectedProfit: '期望收益', expectedRoi: '期望 ROI', maxDrawdown: '最大回撤' }
  const choose = (id, setter, label) => <label>{label}<select value={id} onChange={(e) => setter(e.target.value)}><option value="">选择一次实验</option>{[...store.runs].reverse().map((run) => {
    const version = store.versions.find((v) => v.id === run.versionId)
    return <option key={run.id} value={run.id}>{maskText(version?.spec.name || '未命名')} · v{version?.number} · {RESEARCH_KINDS[run.kind]} · {date(run.createdAt)}</option>
  })}</select></label>
  return <section className="qr-surface"><div className="qr-section-heading"><div><h3>实验对照</h3><p>以右侧实验减去左侧实验。条件不一致时，只比较规则，不显示收益提升。</p></div><GitBranch size={18} /></div>
    <div className="qr-form-grid">{choose(leftId, setLeftId, '基准实验 A')}{choose(rightId, setRightId, '对照实验 B')}</div>
    {comparison && <div className="qr-comparison-result"><p className="qr-evidence-note">{leftId === rightId ? '选择了同一次实验；差值为零。' : comparison.comparable ? '数据与实验条件已对齐，可以比较结果。差值属于描述性比较，不表示统计显著。' : `条件未对齐：${comparison.reasons.join('；')}`}</p>
      {comparison.changedFields.length ? <div className="qr-table-wrap"><table className="qr-table"><thead><tr><th>变更项</th><th>A</th><th>B</th></tr></thead><tbody>{comparison.changedFields.map((item) => <tr key={item.field}><td>{FIELD_LABELS[item.field] || item.field}</td><td>{maskText(labelValue(item.before))}</td><td>{maskText(labelValue(item.after))}</td></tr>)}</tbody></table></div> : <p className="qr-note">规则未发生变化。</p>}
      {comparison.comparable && <div className="qr-delta-grid">{Object.entries(comparison.deltas).filter(([, value]) => Number.isFinite(value)).map(([key, value]) => <div key={key}><span>{names[key] || key}变化</span><strong>{value > 0 ? '+' : ''}{['hitRate', 'roi', 'expectedRoi'].includes(key) ? `${(value * 100).toFixed(2)} pp` : num(value)}</strong></div>)}</div>}
    </div>}
  </section>
}

export function ResearchLibrary({ store, selectedRunId, onSelectRun, onRerun, onConclusion, onLoadVersion, onShadow, onStart, legacyStrategies, onImportLegacy }) {
  const maskText = usePreviewTextMask()
  const selected = store.runs.find((run) => run.id === selectedRunId) || store.runs[store.runs.length - 1]
  return <div className="quant-research">
    <div className="qr-section-heading"><div><h3>策略与实验档案</h3><p>规则按版本保存，实验保留输入和结果。研究结论可以持续补充。</p></div><div className="qr-actions"><button className="qr-button" disabled={!store.runs.length} onClick={() => downloadResearch(store)}><Download size={14} />导出研究档案</button><button className="qr-button qr-button-primary" onClick={onStart}><Plus size={14} />新研究</button></div></div>
    {store.runs.length ? <>
      <div className="qr-library-layout"><aside className="qr-surface qr-project-list" aria-label="研究与版本">
        {[...store.projects].reverse().map((project) => <div key={project.id}><h4>{maskText(project.name)}</h4>{store.versions.filter((v) => v.projectId === project.id).reverse().map((version) => <div key={version.id} className="qr-version"><span>v{version.number} · {RESEARCH_KINDS[version.kind]}</span>{store.runs.filter((run) => run.versionId === version.id).reverse().map((run) => <button className={run.id === selected?.id ? 'is-selected' : ''} aria-pressed={run.id === selected?.id} key={run.id} onClick={() => onSelectRun(run.id)}><span>{run.reproductionOf ? '复现' : '实验'} · {date(run.createdAt)}</span><small>{run.conclusion ? '已记录结论' : '待补充结论'}</small></button>)}</div>)}</div>)}
      </aside><ResearchRunReport key={selected.id} run={selected} version={store.versions.find((v) => v.id === selected.versionId)} onRerun={onRerun} onConclusion={onConclusion} onLoadVersion={onLoadVersion} onShadow={onShadow} /></div>
      {store.runs.length > 1 && <ResearchComparison store={store} />}
    </> : <div className="qr-surface qr-empty"><Layers size={28} strokeWidth={1.4} /><p>还没有冻结的研究版本。</p><span>在实验工作台运行一次实验，即可建立第一份可复现档案。</span><button className="qr-button" onClick={onStart}>前往实验工作台<ArrowRight size={14} /></button></div>}
    {legacyStrategies.length > 0 && <details className="qr-surface qr-details"><summary>已有观察策略<span>{legacyStrategies.length} 个 · 可作为新研究起点</span></summary><p className="qr-note">沿用旧规则会建立新的研究上下文，原有头寸与记录保持原样。</p>{legacyStrategies.map((strategy) => <div className="qr-legacy-row" key={strategy.id}><span>{maskText(strategy.name || '未命名策略')}</span><button className="qr-button qr-button-quiet" onClick={() => onImportLegacy(strategy)}>沿用规则开展研究<ArrowRight size={14} /></button></div>)}</details>}
    <p className="qr-note qr-storage-note">{isPreviewMode() ? '当前为公开预览：研究保存在本次页面会话内，刷新后会重置。可导出档案留存。' : '研究保存在当前浏览器，尚未加入云同步。建议定期导出档案留存。'}</p>
  </div>
}

export function ResearchDataCapabilities({ resultCount, coverage }) {
  return <section className="quant-research qr-surface"><div className="qr-section-heading"><div><span className="qr-eyebrow">DATA READINESS</span><h3>数据决定可以回答的问题</h3><p>每次历史实验都会重新检查日期、比分、赛事身份及重复记录，并保留排除明细。</p></div></div>
    <div className="qr-capabilities">
      <div><span className="qr-tag">{resultCount ? '可开展' : '待导入赛果'}</span><strong>历史规律研究</strong><p>已有 {resultCount} 条缓存赛果；有效样本以实验校验后的数量为准。</p></div>
      <div><span className="qr-tag">基于假设</span><strong>条件与赔率情景</strong><p>用明确的概率或固定赔率检验假设，结果保留条件标签。</p></div>
      <div><span className="qr-tag">{coverage?.replayable ? '可检查覆盖' : '待积累证据'}</span><strong>真实历史价格回放</strong><p>{coverage?.replayable || 0} 场同时有赛前报价与赛果。回放会继续校验决策时点、目标价格和基准交集。</p></div>
      <div><span className="qr-tag">前向积累</span><strong>影子观察</strong><p>先冻结计划，再记录候选与纸面结果。独立采集器可在用户启动后继续采集。</p></div>
    </div>
  </section>
}
