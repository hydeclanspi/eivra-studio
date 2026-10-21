import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowRight,
  BookOpen,
  Check,
  Database,
  FlaskConical,
  Layers,
  Library,
  Radar,
  X,
} from 'lucide-react'
import './quantGuide.css'

const CHAPTERS = [
  ['orientation', '先理解这间实验室'],
  ['architecture', '五个工作区'],
  ['workflow', '从想法到一次实验'],
  ['experiments', '数据决定实验类型'],
  ['reading', '怎样阅读实验结果'],
  ['versions', '版本、复现与比较'],
  ['example', '示例：切尔西 1–1'],
  ['shadow', '影子观察与证据边界'],
  ['validation', '批次、滚动评估与回放'],
  ['evidence', '报价证据与采集'],
  ['principles', '设计思路与路线'],
]

const WORKSPACES = [
  { name: '研究台', icon: BookOpen, purpose: '今天继续研究什么？', detail: '整理研究假设、最近实验和待办，从一个直觉或研究模板出发。' },
  { name: '实验工作台', icon: FlaskConical, purpose: '这个想法怎样检验？', detail: '定义规则、选择数据、运行实验，在相同条件下诊断和比较。' },
  { name: '策略库', icon: Library, purpose: '哪些规则值得保留？', detail: '保存策略版本、实验记录、研究结论，以及适用和失效条件。' },
  { name: '影子观察', icon: Radar, purpose: '冻结规则遇到新比赛会怎样？', detail: '记录赛前信号、虚拟头寸与结果，持续观察偏差和数据缺口。' },
  { name: '数据中心', icon: Database, purpose: '证据究竟从哪里来？', detail: '查看赛果、预测与报价的来源、时间和覆盖，识别可开展的实验。' },
]

const STRATEGY_PARTS = [
  ['研究假设', '用一句话说明你认为存在什么规律、为什么可能成立，以及什么结果会让你放弃这个想法。'],
  ['适用范围', '确定球队、联赛、主客场、市场和时间区间。筛选条件改变，回答的研究问题也会改变。'],
  ['概率判断', '说明概率来自市场、个人判断、历史频率还是模型。区分已记录的赛前预测与事后计算的参考值。'],
  ['入选规则', '写清哪些条件触发信号、哪些情况应跳过。数据缺失时也要有明确处理方式。'],
  ['配置规则', '记录计划场次、每场投入与资金假设。区分单个策略的结果和组合资金共同承担的风险。'],
  ['评估协议', '运行前确定主要问题、比较基准、验证区间和复盘条件。把研究结论与后续观察事项一并记录。'],
]

const EVIDENCE_EXAMPLE = JSON.stringify({
  schemaVersion: 1,
  quotes: [{
    home: '示例主队', away: '示例客队', kickoff: '2026-10-18T20:00:00+08:00',
    market: 'result', selection: 'draw', odds: 3.4,
    observedAt: '2026-10-18T19:30:00+08:00', source: '你的真实数据来源', tradable: true,
  }],
  results: [{
    home: '示例主队', away: '示例客队', kickoff: '2026-10-18T20:00:00+08:00',
    homeGoals: 1, awayGoals: 1, availableAt: '2026-10-18T22:10:00+08:00', source: '你的真实数据来源',
  }],
}, null, 2)

function GuideSection({ id, number, title, children }) {
  return (
    <section
      id={id}
      className="quant-guide-section"
      data-guide-section
      tabIndex={-1}
      aria-labelledby={`${id}-heading`}
    >
      <div className="quant-guide-section-heading">
        <span aria-hidden="true">{number}</span>
        <h3 id={`${id}-heading`}>{title}</h3>
      </div>
      {children}
    </section>
  )
}

function Note({ label, children }) {
  return (
    <aside className="quant-guide-note" aria-label={label}>
      <strong>{label}</strong>
      <div>{children}</div>
    </aside>
  )
}

/**
 * Long-form user guide. A native modal dialog provides focus containment and
 * makes the app inert while the guide is open, including when portalled.
 */
export default function QuantGuideDialog({ open, onClose }) {
  const dialogRef = useRef(null)
  const titleRef = useRef(null)
  const backdropPressRef = useRef(false)
  const instanceId = useId()
  const sectionId = key => `${instanceId}-${key}`

  useEffect(() => {
    if (!open) return undefined
    const dialog = dialogRef.current
    if (!dialog) return undefined

    const previouslyFocused = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    titleRef.current?.focus({ preventScroll: true })

    return () => {
      if (dialog.open) dialog.close()
      document.body.style.overflow = previousOverflow
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus({ preventScroll: true })
      }
    }
  }, [open])

  if (!open || typeof document === 'undefined') return null

  const isOutsideDialog = event => {
    if (event.target !== event.currentTarget) return false
    const rect = event.currentTarget.getBoundingClientRect()
    return event.clientX < rect.left || event.clientX > rect.right
      || event.clientY < rect.top || event.clientY > rect.bottom
  }

  const goToSection = key => {
    const section = document.getElementById(sectionId(key))
    if (!section) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    section.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' })
    section.focus({ preventScroll: true })
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className="quant-guide-dialog"
      aria-labelledby={`${instanceId}-title`}
      aria-describedby={`${instanceId}-summary`}
      onCancel={event => {
        event.preventDefault()
        onClose()
      }}
      onPointerDown={event => { backdropPressRef.current = isOutsideDialog(event) }}
      onClick={event => {
        if (backdropPressRef.current && isOutsideDialog(event)) onClose()
        backdropPressRef.current = false
      }}
    >
      <header className="quant-guide-header">
        <div className="quant-guide-header-copy">
          <div className="quant-guide-eyebrow"><BookOpen size={14} aria-hidden="true" /> QUANT LAB / FIELD GUIDE</div>
          <h2 id={`${instanceId}-title`} ref={titleRef} tabIndex={-1}>把直觉，变成可检验的研究。</h2>
          <p id={`${instanceId}-summary`}>使用说明与设计思路 · 从第一个想法，到一份可以回头检查的证据。</p>
        </div>
        <button type="button" className="quant-guide-close" aria-label="关闭量化实验室使用指南" onClick={onClose}>
          <X size={19} aria-hidden="true" />
        </button>
      </header>

      <div className="quant-guide-layout">
        <nav className="quant-guide-nav" aria-label="使用指南章节">
          <p>阅读导航</p>
          {CHAPTERS.map(([key, label], index) => (
            <button key={key} type="button" onClick={() => goToSection(key)}>
              <span>{String(index + 1).padStart(2, '0')}</span>{label}
            </button>
          ))}
          <div className="quant-guide-nav-signature">Eivra Studio<br /><span>Intuition, calibrated.</span></div>
        </nav>

        <div className="quant-guide-content">
          <GuideSection id={sectionId('orientation')} number="01" title="先理解这间实验室">
            <p className="quant-guide-lead">Quant 是策略研究工作台：把一个直觉，逐步变成有规则、有证据、能持续观察的策略。</p>
            <p>每次进入这里，先回答三个问题：我正在验证什么？目前的证据支持到哪一步？下一步该做什么？一条漂亮的收益曲线只是研究材料的一部分，真正需要保留下来的是规则、条件和判断的过程。</p>
            <div className="quant-guide-question-grid">
              <div><span>问题</span><strong>我想检验什么？</strong><p>从可以被推翻的假设开始。</p></div>
              <div><span>证据</span><strong>现在知道多少？</strong><p>对齐数据、时点和比较条件。</p></div>
              <div><span>行动</span><strong>接下来做什么？</strong><p>继续实验、冻结观察，或归档。</p></div>
            </div>
            <Note label="当前版本的能力">
              <p>研究流程分成三个层次：先保存策略版本与实验，再冻结前向计划并记录纸面订单，最后通过有限参数批次、滚动评估和真实报价回放扩大研究范围。</p>
              <p>历史规律、假设赔率情景和条件推演可以从现有数据出发。真实回放引擎需要逐场、逐时点的报价证据；没有对应价格或结果时间的比赛会显示覆盖缺口，不会用默认赔率补齐。</p>
              <p>规则以球队、主客场、比分或胜平负、概率来源与资金参数为基础。独立采集器需要你另外启动；页面显示的最近采集时间不代表采集器正持续运行，也不代表已经具备完整历史报价。</p>
            </Note>
          </GuideSection>

          <GuideSection id={sectionId('architecture')} number="02" title="五个工作区，一条研究流程">
            <p>整个 Quant 围绕「策略版本」和「实验记录」组织。你可以从不同入口进入，但研究最终都应落回一套明确的规则和一份可检查的结论。</p>
            <div className="quant-guide-architecture" aria-label="功能架构：量化策略实验室下设研究台、实验工作台、策略库、影子观察和数据中心">
              <div className="quant-guide-architecture-root"><FlaskConical size={18} aria-hidden="true" /><span>量化策略实验室<small>策略版本 × 实验记录</small></span></div>
              <div className="quant-guide-workspaces">
                {WORKSPACES.map(({ name, icon: Icon, purpose, detail }) => (
                  <article key={name}>
                    <Icon size={18} aria-hidden="true" />
                    <h4>{name}</h4>
                    <strong>{purpose}</strong>
                    <p>{detail}</p>
                  </article>
                ))}
              </div>
            </div>
            <p>「发现」用于产生候选假设。筛选过程中看到的现象，需要进入实验工作台继续验证。保留发现来源和筛选范围，才能判断一个结果是否只是反复尝试后偶然胜出的样本。</p>
            <div className="quant-guide-inline-flow" aria-label="页面协作关系">
              <span>Quant<br /><small>研究可重复的规则</small></span><ArrowRight aria-hidden="true" size={16} />
              <span>Portfolio<br /><small>处理候选与整体配置</small></span><ArrowRight aria-hidden="true" size={16} />
              <span>Settle<br /><small>记录实际结果</small></span><ArrowRight aria-hidden="true" size={16} />
              <span>Analysis<br /><small>复盘并产生新问题</small></span>
            </div>
            <p className="quant-guide-caption">这里展示的是完整产品架构。各工作区的数据条件和完成状态，以当前页面实际提示为准。</p>
          </GuideSection>

          <GuideSection id={sectionId('workflow')} number="03" title="从想法到一次实验">
            <p>先把研究写清楚，再运行实验。你不必一次填完所有复杂规则，但以下六件事需要有明确答案；当前没有对应数据或能力的部分，应保留为研究计划。</p>
            <ol className="quant-guide-elements">
              {STRATEGY_PARTS.map(([title, description], index) => (
                <li key={title}><span>{String(index + 1).padStart(2, '0')}</span><div><h4>{title}</h4><p>{description}</p></div></li>
              ))}
            </ol>
            <div className="quant-guide-example-copy">
              <span>一份可以运行的研究摘要</span>
              <p>研究某支球队在指定范围内的 1–1 赛果。先检查历史出现频率，再用明确标注的假设赔率比较盈亏变化。固定每场投入，保留研究区间、数据与规则；若要验证未来表现，另行冻结规则并记录之后的比赛。</p>
            </div>
            <p>一个顺手的开始方式是：在研究台创建想法 → 在实验工作台完善规则 → 检查数据条件 → 运行并保存实验 → 写下结论与下一步。修改研究设定后，再运行新实验，旧记录继续保留。</p>
            <div className="quant-guide-stage-order">
              <article><span>阶段一</span><h4>先得到一份可复现的研究</h4><p>定义假设、运行基础实验、保存版本并写下结论。此时就能明确知道证据支持到哪里。</p></article>
              <article><span>阶段二</span><h4>再把规则交给未来比赛</h4><p>预先声明观察与复盘标准，冻结前向计划，记录候选、报价、判断与纸面结算。</p></article>
              <article><span>阶段三</span><h4>有纪律地扩大研究范围</h4><p>先冻结有限候选，再做滚动评估；补齐时点报价后做真实回放，最后交接 Portfolio 候选。</p></article>
            </div>
          </GuideSection>

          <GuideSection id={sectionId('experiments')} number="04" title="数据决定你能做哪种实验">
            <p>同一项策略可以做不同实验，但每一种实验回答的问题不同。运行前先看清输入来自历史记录还是人为设定；结果名称应跟随证据条件。</p>
            <div className="quant-guide-experiment-list">
              <article>
                <div><span className="quant-guide-status">当前可用</span><h4>历史规律研究</h4></div>
                <dl><div><dt>需要</dt><dd>历史赛果与明确的筛选范围。</dd></div><div><dt>回答</dt><dd>某类结果出现多少次？在不同条件下有何差异？</dd></div><div><dt>边界</dt><dd>频率提供描述性证据，不能独自证明当时存在可获得的交易收益。</dd></div></dl>
              </article>
              <article>
                <div><span className="quant-guide-status">当前可用</span><h4>情景推演</h4></div>
                <dl><div><dt>需要</dt><dd>人为声明的赔率、概率、投入、场次等条件；可结合历史赛果。</dd></div><div><dt>回答</dt><dd>如果条件成立，盈亏、风险和资金需求可能怎样变化？</dd></div><div><dt>边界</dt><dd>假设赔率不能代表历史可成交价格；模拟结果取决于概率和相关性假设。</dd></div></dl>
              </article>
              <article>
                <div><span className="quant-guide-status quant-guide-status-planned">依赖时点证据</span><h4>历史策略回放</h4></div>
                <dl><div><dt>需要</dt><dd>对应时点的历史赔率、当时可知的赛前信息、预测版本和最终赛果。</dd></div><div><dt>回答</dt><dd>若在每个历史时点按同一规则决策，实际会产生怎样的结果？</dd></div><div><dt>边界</dt><dd>缺少价格、时点或当时信息时，不能把情景分析升级为真实历史回放。</dd></div></dl>
              </article>
              <article>
                <div><span className="quant-guide-status quant-guide-status-planned">需持续记录</span><h4>前向影子实验</h4></div>
                <dl><div><dt>需要</dt><dd>先冻结规则与复盘标准，再记录未来比赛的赛前预测、报价、入选决定和结果。</dd></div><div><dt>回答</dt><dd>面对未参与规则选择的新比赛，策略会如何表现？</dd></div><div><dt>边界</dt><dd>保留候选接受和拒绝日志。只有实际进入检查范围的比赛才有记录，未采集的赛事不能视为已全面覆盖。</dd></div></dl>
              </article>
            </div>
            <Note label="先检查数据能力">
              <p>「有很多场比赛」与「有足够的数据完成这个实验」是两件不同的事。某个市场有无报价、报价何时采集、预测是否赛前生成，比总记录数更能决定当前实验的能力。</p>
            </Note>
          </GuideSection>

          <GuideSection id={sectionId('reading')} number="05" title="从三个视角阅读结果">
            <div className="quant-guide-reading-grid">
              <article><span>01 / 判断</span><h4>预测质量</h4><p>概率是否可靠？在有可用预测快照时，查看 Brier、历史价格回放中的 LogLoss，以及基准对照。校准曲线尚未提供。</p></article>
              <article><span>02 / 结果</span><h4>收益与风险</h4><p>按所声明的价格和配置规则，盈亏、回撤、资金占用与收益集中度如何？注意结果对假设条件的依赖。</p></article>
              <article><span>03 / 依据</span><h4>证据质量</h4><p>样本是否完整？有多少独立赛事？是否隔离了验证数据？调整一个参数，结论会不会明显改变？</p></article>
            </div>
            <p>没有对应预测、历史价格或可靠计算依据的指标，应显示「不可用」并说明缺口。不要用默认值补成看似完整的研究报告。</p>
            <h4 className="quant-guide-subheading">看结论，也看它是怎样形成的</h4>
            <ul className="quant-guide-bullets">
              <li><strong>从整体下钻到单场。</strong>检查研究范围、是否入选、采用什么概率与价格、最后如何结算。历史赛果分析不能补出原本不存在的赛前决策。</li>
              <li><strong>把直觉的贡献拆开。</strong>未来在数据对齐时，可分别比较市场基准、个人判断、校准后判断和筛选后策略，识别改进究竟来自哪里。</li>
              <li><strong>解释两个版本的差异。</strong>先看规则与样本改变了什么，再看收益变化。范围不同或资金假设不同的实验，不能只凭最终数值排优劣。</li>
              <li><strong>留下一句可行动的结论。</strong>例如「历史出现频率值得继续观察；尚缺赛前报价，下一步冻结规则并开始采集」。</li>
            </ul>
          </GuideSection>

          <GuideSection id={sectionId('versions')} number="06" title="让版本、复现与比较有据可查">
            <p>研究过程中改变主意很正常。每一次修改都需要留下边界：旧实验回答旧问题，新实验回答新问题。</p>
            <div className="quant-guide-lifecycle" aria-label="策略研究生命周期">
              {['提出假设', '定义版本', '探索实验', '冻结规则', '独立验证', '影子观察'].map((label, index) => (
                <div key={label}><span>{index + 1}</span>{label}</div>
              ))}
            </div>
            <p className="quant-guide-caption">任何阶段都可以记录结论、创建新版本继续研究，或归档。走完流程并不等于已经证明策略有效。</p>
            <ul className="quant-guide-bullets">
              <li><strong>冻结实验的输入与结果。</strong>保存采用的策略版本、数据范围、参数与运行条件。之后的数据更新不应悄悄改写当时的结论。</li>
              <li><strong>复现需要相同条件。</strong>区分「按已保存条件复现」与「用最新数据重跑」。如果可用数据或计算方式改变，应生成新实验并说明差异。</li>
              <li><strong>比较前先对齐。</strong>核对数据范围、市场、价格假设、初始资金、投入与实验类型。条件不一致时，先研究差异来源。</li>
              <li><strong>探索和验证分开。</strong>已经看过、用于挑选规则的数据属于探索材料。对同一验证集反复调参，也会逐渐消耗它的独立性。</li>
              <li><strong>把查看次数一起留下。</strong>批次与验证记录会保留数据指纹和本模块的探索历史。它无法知道你在其他页面或外部资料中看过什么，因此不自动宣称某段数据从未被查看。</li>
              <li><strong>状态与证据分开。</strong>「观察中」表示正在做什么，「样本不足」表示证据到了哪里；两者完全可以同时成立。</li>
            </ul>
            <Note label="保存与导出">
              <p>当前研究记录保存在本机浏览器中，公开预览使用隔离的内存状态。预览中的操作不等于正式持久保存；刷新或离开后，预览记录可能不再保留。</p>
              <p>重要策略和实验请及时使用页面的导出功能保存副本。更换设备、浏览器或清除站点数据前，先核对备份；本地保存不等于已经加入云同步。</p>
              <p>每类浏览器档案设有约 4 MiB 上限，整个站点的共享存储额度可能更早耗尽。容量不足会停止保存并保留原记录，不会自动删除旧实验。</p>
            </Note>
          </GuideSection>

          <GuideSection id={sectionId('example')} number="07" title="示例：研究「切尔西 1–1」">
            <p>这个例子展示的是研究方法。它不预设该策略有效，也不代表已经拥有相应历史报价。</p>
            <ol className="quant-guide-example-steps">
              <li><h4>把直觉写成问题</h4><p>例如「我觉得切尔西的 1–1 比赛比想象中常见」。进一步写清球队、主客场、赛事范围和历史区间，避免边看结果边改变问题。</p></li>
              <li><h4>先查看历史规律</h4><p>导入或检查已记录赛果，核对球队别名和覆盖范围。查看符合条件的独立比赛数、1–1 出现次数，以及相关的频率分析。缺失赛果不能当成未命中。</p></li>
              <li><h4>用假设赔率做情景分析</h4><p>明确填写一个假设赔率和每场投入，检查不同假设下的盈亏变化。报告应持续标注「假设赔率」；这些数字不能回答历史上能否获得同样价格。</p></li>
              <li><h4>保存第一个版本与实验</h4><p>记录规则、数据、结果和结论。例如「只完成了历史规律与假设价格分析」。若尝试限定主场或更换时间范围，保存新的版本并检查样本如何变化。</p></li>
              <li><h4>准备前向观察</h4><p>在看到新比赛结果前冻结规则，记录该场预测、可用报价和入选原因。没有报价或错过记录的比赛同样留痕，避免只留下顺利完成的样本。</p></li>
              <li><h4>按预先确定的节点复盘</h4><p>对照原假设检查偏差，说明证据仍缺什么，再决定继续、修改或归档。不要因短期连续命中而自动升级策略状态。</p></li>
            </ol>
            <div className="quant-guide-example-copy"><span>一个诚实且有用的阶段结论</span><p>已完成历史频率研究与假设赔率情景分析。赛前价格覆盖不足，暂不能判断历史可执行收益。下一步固定研究规则，记录新比赛并继续观察。</p></div>
          </GuideSection>

          <GuideSection id={sectionId('shadow')} number="08" title="影子观察：把证据留在结果之前">
            <p>影子观察使用虚拟头寸检验冻结后的规则。真正有价值的是：当时知道什么、为什么行动、哪些比赛没能记录，以及后来发生了什么。</p>
            <ol className="quant-guide-example-steps">
              <li><h4>先声明复盘标准，再冻结计划</h4><p>从一个已保存的研究版本出发，填写未来复盘时间、最低已结算数量、最大回撤金额、最低预期收益率，以及入场报价和收盘报价的新鲜度窗口。每个版本只冻结一份计划，固定注码继承该版本；改变标准应从新版本开始。</p></li>
              <li><h4>采集并检查候选</h4><p>前向检查使用当下真实时间。已开赛、范围不符、报价缺失或过期、市场停盘、概率不可用、风险限额或预期收益门槛不符，都会留下拒绝原因。没有进入所采集赛事范围的比赛无法自动补成日志。</p></li>
              <li><h4>接受后生成纸面订单</h4><p>满足规则时冻结价格、概率、来源、时间和计划版本。同一版本、同一赛事只保留一张纸面订单；再次检查不能重复建单。纸面订单记录的是研究假设下的结果。</p></li>
              <li><h4>等待赛果与合格收盘报价</h4><p>结算需要同一赛事的明确赛果和可知时间；冲突赛果保留未结算。已结算后出现冲突时，保留历史并追加争议记录，从当前指标中排除该订单，暂停计划新增订单。CLV 仅使用同市场、同选项、同来源且在开赛前有效窗口内的报价，计算为入场赔率 ÷ 收盘赔率 − 1。</p></li>
              <li><h4>到预定节点再复盘</h4><p>到达复盘时间后，仍需检查最低已结算数量。ROI 只统计已结算纸面订单，Brier 只使用具有冻结概率的已结算样本。阶段偏差是描述性观察，不会自动产生「策略有效」或转实盘的决定。</p></li>
            </ol>
            <ul className="quant-guide-checklist">
              <li><Check size={16} aria-hidden="true" /><span><strong>记录完整候选范围。</strong>包括未入选、规则拒绝、缺失报价和漏采比赛。</span></li>
              <li><Check size={16} aria-hidden="true" /><span><strong>赛前信息保持可核查。</strong>预测时间、报价时间与规则版本应能对应到同一场比赛。</span></li>
              <li><Check size={16} aria-hidden="true" /><span><strong>虚拟和实际分别记录。</strong>影子结果不应被当作已经执行的真实记录或收益。</span></li>
              <li><Check size={16} aria-hidden="true" /><span><strong>关注共同风险。</strong>同一场的不同市场可能同时命中或同时失败，多个头寸不等于多个独立样本。</span></li>
            </ul>
            <div className="quant-guide-boundaries">
              <article><h4>时间边界</h4><p>开赛后才出现的信息不能回填到赛前预测。最新数据、最后一次报价和真正符合实验时点的数据，需要分别识别。</p></article>
              <article><h4>CLV 边界</h4><p>收盘价比较需要可比的市场、来源与时点。缺乏可靠收盘报价时应显示不可用；单一正向 CLV 也不能独自证明长期有效。</p></article>
              <article><h4>样本边界</h4><p>不存在普遍适用的「满 20 场就通过」。有效样本取决于独立赛事、稀有结果、筛选方式和不确定性，需结合研究目标判断。</p></article>
              <article><h4>运行边界</h4><p>页面采集依赖页面操作；独立采集器需要你启动并保持进程和电脑运行。界面显示的是最近导入的任务快照，不是与后台进程的实时连接。</p></article>
            </div>
            <Note label="观察异常，也观察缺失">
              <p>一次数据中断、报价覆盖下降或规则变化，都可能影响策略解释。完整研究应保留这些情况，而不是只展示可计算的漂亮结果。</p>
              <p>新前向计划记录实际检查过的候选及其接受或拒绝原因，并严格匹配收盘报价条件。它无法证明未采集时间段没有遗漏赛事。原有策略台账中的转正条件仍属于启发式检查，不构成策略有效的认证。</p>
            </Note>
          </GuideSection>

          <GuideSection id={sectionId('validation')} number="09" title="批次、滚动评估与真实回放">
            <p>扩大研究范围时，先把要比较的规则集合固定下来。不断增加参数直到出现好结果，会让「最好的一次」越来越难解释。</p>
            <h4 className="quant-guide-subheading">有限参数批次：先看清全部候选</h4>
            <p>批次围绕当前规则展开主客场、胜平负选项和假定赔率等有限维度，先展示候选全集，最多 30 个组合。点击“冻结协议并运行实验”后一次处理候选全集，并保存滚动窗口与全部候选的后窗敏感性。保留失败和无样本组合，避免只记下赢家。</p>
            <h4 className="quant-guide-subheading">滚动评估：每一段都先训练，再观察</h4>
            <p>预先指定训练天数、后续观察天数和最低训练样本。每一轮只根据训练窗内的命中率选择规则；并列时按已冻结的候选顺序决定。假定赔率不参与选优，避免单纯提高人为赔率就成为赢家。</p>
            <div className="quant-guide-validation-flow" aria-label="滚动评估：前段训练选规则，再在后段观察，随后滚动到下一段">
              <span>训练窗<small>仅用已知样本选规则</small></span><ArrowRight size={16} aria-hidden="true" /><span>冻结所选规则<small>保留所有候选的训练结果</small></span><ArrowRight size={16} aria-hidden="true" /><span>后续观察窗<small>后窗之间不重叠</small></span>
            </div>
            <p>这里的后窗收益仍按声明的统一假定赔率计算，属于情景结果。结果会保留数据指纹和本模块的累计探索记录；再次运行不是一份全新的、从未查看过的独立验证。</p>
            <h4 className="quant-guide-subheading">真实价格回放：让每条价格回到它的时间</h4>
            <p>先导入逐场、逐时点的报价证据，再设定开赛前多久决策及报价最大年龄。引擎只使用决策时可得、开赛前采集、未过期且可交易的报价；赛后信息不会进入当时的判断。缺价、停盘、时点不符或证据冲突的赛事会保留排除原因。</p>
            <p>收益按赛果真正可知的时间结算，同一时间的结果成组计入，避免输入顺序改变回撤。参考基准采用同场事件、同类市场且双方报价均合格的交集；仍需结合覆盖率解读结果。</p>
            <Note label="交接 Portfolio 时保留研究身份">
              <p>可以把研究结果与冻结规则交接为 Portfolio 候选，让整体配置另行评估。候选交接不会自动创建实际投资记录，也不代表已经下单。相关规则、实验来源和研究边界应随候选一起保留。</p>
              <p>先在收件箱核对并加入候选池，组合沿用冻结概率；只有你在 Portfolio 明确采纳方案时，才保存为实际投资记录。保存前再次检查是否已开赛、报价是否过期以及候选是否仍有效。</p>
            </Note>
          </GuideSection>

          <GuideSection id={sectionId('evidence')} number="10" title="报价证据、导入与独立采集">
            <p>数据中心支持证据 JSON 导入和官方行情采集。每条记录需要明确的主客队、开赛时间、来源及可知时点，球队别名归一后与开赛时间共同识别赛事。</p>
            <ul className="quant-guide-bullets">
              <li><strong>时间必须带时区。</strong>例如 <code>2026-10-18T19:30:00+08:00</code>。外部导入不猜测本地时区；官方站点的无时区时间仅由专用采集适配器按北京时间处理。</li>
              <li><strong>采集时间要真实。</strong><code>observedAt</code> 是实际看见报价的时间，<code>availableAt</code> 是赛果实际可知的时间。今天才补录的记录不能假装昨天已经采集。</li>
              <li><strong>区分市场与选择。</strong>胜平负使用 <code>result</code> 与 <code>home / draw / away</code>；比分使用 <code>score</code> 与主队在前的 <code>1-1</code> 等选项。</li>
              <li><strong>保留交易状态。</strong>停盘报价设置 <code>tradable: false</code>，即使价格字段存在，也不能作为可入场的价格。</li>
              <li><strong>区分数量与覆盖。</strong>看见报价并不保证满足某个策略的市场、决策时间和新鲜度要求。真实回放的实际覆盖以运行后的入选和排除明细为准。</li>
            </ul>
            <details className="quant-guide-schema">
              <summary>展开：报价与赛果 JSON 格式示例</summary>
              <p>以下是格式示意，球队、数字和时点均为示例。请替换为可核查的真实记录；不要把示例当作研究证据。单条平局报价不足以拟合完整市场概率，市场概率来源还需要同一来源、同一时点的完整胜平负报价。</p>
              <pre><code>{EVIDENCE_EXAMPLE}</code></pre>
              <p>系统会生成记录与赛事标识。可选 <code>sourceUpdatedAt</code> 用于保留来源公布的更新时间，它不能晚于实际采集时间。</p>
            </details>
            <h4 className="quant-guide-subheading">在电脑上独立采集的顺序</h4>
            <ol className="quant-guide-example-steps">
              <li><h4>从数据中心导出采集配置</h4><p>配置包含已冻结的前向计划和已有证据。新计划或规则更新后，应重新导出相应配置。</p></li>
              <li><h4>手动启动独立采集器</h4><p>准备 Node.js 18 或更新版本并安装项目依赖，在项目中启动采集进程，指定配置、输出文件和采集间隔。它默认不会自动启动，需要电脑和进程持续运行。</p></li>
              <li><h4>将采集快照导回数据中心</h4><p>采集器将报价、赛果、候选日志和纸面订单结果写入快照文件。导入时合并证据和不可变研究记录；页面不会自动读取电脑上的文件。</p></li>
              <li><h4>检查最近采集与过期状态</h4><p>界面显示导入时的任务快照。任务失败、进程停止或长期未重新导入时，旧的成功记录不能证明采集仍在运行。采集器不补造缺失的历史报价。</p></li>
            </ol>
            <Note label="证据文件与研究档案分别保存">
              <p>报价导入用于补充研究证据，采集快照用于合并任务输出；普通研究档案导出用于留存版本与实验。这些文件各有用途。浏览器本地记录、预览内存和独立进程输出不会自动云同步。</p>
              <p>采集器目前读取最近 7 天官方赛果的首批最多 100 条；未获取或无法唯一匹配的结果继续显示缺口。单份证据或前向账本接近 4 MiB 时停止并保留上一份完整文件，不裁剪历史。浏览器总配额可能更早用满，请及时导回并保留外部备份。页面拉取报价只保存证据；同一计划请选页面或独立采集器之一生成订单，避免并行副本产生冲突。</p>
            </Note>
          </GuideSection>

          <GuideSection id={sectionId('principles')} number="11" title="为什么这样设计">
            <p>这间实验室的核心体验，是让你几个月后重新打开一个策略，仍然知道当初为什么提出它、改过什么、依据哪些证据，以及为什么决定继续或放弃。</p>
            <ul className="quant-guide-bullets">
              <li><strong>先把问题表达清楚。</strong>以结构化规则和研究摘要为主，复杂节点画布与脚本编辑器可以以后再做。</li>
              <li><strong>让证据带着条件出现。</strong>结果始终关联数据、价格假设和研究阶段；缺少依据时保留不可用状态。</li>
              <li><strong>让比较解释变化。</strong>展示规则、范围和风险差异，避免把实验室变成追逐最高历史收益的排行榜。</li>
              <li><strong>让视觉服务研究。</strong>用留白、轻量导航和稳定的图表底色降低阅读负担，颜色优先表达选中状态、证据与异常。</li>
              <li><strong>让 AI 帮助整理与理解。</strong>未来适合辅助把人话转成规则、解释实验差异和撰写研究结论；自动生成最优策略并非当前承诺。</li>
            </ul>
            <div className="quant-guide-roadmap">
              <article><span>第一层 / 定义与保存</span><h4>研究闭环</h4><p>策略版本、实验记录、数据能力提示、比较与研究结论。让一个想法被完整定义，让一次实验有据可查。</p></article>
              <article><span>第二层 / 冻结与观察</span><h4>前向证据</h4><p>预先声明复盘标准，冻结赛前快照、候选日志和纸面订单，基于合格赛果与收盘报价持续观察。</p></article>
              <article><span>第三层 / 扩展与交接</span><h4>受控研究</h4><p>有限参数批次、仅在训练窗选规则的滚动评估、时点报价回放与 Portfolio 候选交接，保留每一步探索的范围和边界。</p></article>
            </div>
            <div className="quant-guide-endnote"><Layers size={18} aria-hidden="true" /><p>好的研究，既能留下支持，也能留下反证。<span>让每个下一步，都有一个可检查的理由。</span></p></div>
          </GuideSection>
        </div>
      </div>
    </dialog>,
    document.body,
  )
}
