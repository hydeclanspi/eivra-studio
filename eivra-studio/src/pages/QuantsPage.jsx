import { useEffect, useMemo, useState } from 'react'
import {
  Archive,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Database,
  DownloadCloud,
  FlaskConical,
  Gauge,
  History,
  Landmark,
  Library,
  Play,
  Plus,
  Radar,
  RefreshCw,
  RotateCcw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react'
import { fetchOfficialMarketOdds } from '../lib/marketOdds'
import { getReservoirState } from '../lib/analytics'
import { getInvestments, getSystemConfig, getTeamDirectoryProfiles, saveInvestment } from '../lib/localData'
import { usePreviewTextMask } from '../lib/labels'
import {
  fetchMatchResults,
  fetchOpenFootballResults,
  getResultsIndex,
  importResultRows,
  importResultsCsv,
  importSettledScores,
  resultsCacheStatus,
} from '../lib/matchResults'
import {
  getOddsDrift,
  marketEfficiencyMap,
  marketMatchKey,
  oddsHistoryStatus,
  recordOddsSnapshot,
} from '../lib/oddsHistory'
import { buildTeamRatings, regimeSnapshot } from '../lib/teamRatings'
import {
  createResearchExperiment,
  getResearchStore,
  rerunResearchExperiment,
  saveResearchConclusion,
} from '../lib/quantResearch'
import QuantGuideDialog from '../components/quant/QuantGuideDialog'
import QuantForwardWorkspace from '../components/quant/QuantForwardWorkspace'
import QuantValidationWorkspace from '../components/quant/QuantValidationWorkspace'
import QuantEvidenceWorkspace from '../components/quant/QuantEvidenceWorkspace'
import { EVIDENCE_KEY, emptyEvidenceStore, evidenceCoverage, evidenceFromOfficial, evidenceFromObservedResults, getEvidenceStore, importEvidence } from '../lib/quantEvidence'
import { FORWARD_KEY, getForwardStore, runForwardTask } from '../lib/quantForward'
import { sendQuantCandidate } from '../lib/quantCandidates'
import {
  ResearchBriefEditor,
  ResearchDataCapabilities,
  ResearchDesk,
  ResearchLibrary,
  ResearchRunReport,
} from '../components/quant/QuantResearchWorkspace'
import {
  DEFAULT_DISCOVERY_TEMPLATES,
  STRATEGY_STATUS_LABELS,
  aliasesForTeam,
  autoRetireStrategy,
  autoVoidStalePositions,
  buildInvestmentFromPosition,
  createEmptySpec,
  deleteStrategy,
  discoverStrategies,
  exportStrategiesCsv,
  getStrategies,
  kellyStakeForPool,
  markPositionExecuted,
  matchVenueForTeam,
  normalizeSpec,
  refreshClosingOdds,
  saveStrategy,
  settleStrategyPositions,
  simulateStrategyPortfolio,
  specFromDiscoveryRow,
  strategyPortfolio,
  strategyPositionsCsv,
  strategyStats,
  syncStrategyFixtures,
  updateStrategy,
  validateExecution,
  voidStrategyPosition,
  walkForwardStrategy,
} from '../lib/quantStrategy'

/* ──────────────────────────────────────────────────
   Quants · 量化策略实验室
   把一个直觉翻译成可定价、可推演、可复盘的策略对象
   ────────────────────────────────────────────────── */

const OUTCOME_LABELS = { win: '该队胜', draw: '平', lose: '该队负' }
const VENUE_LABELS = { any: '不限', home: '主场', away: '客场' }

const PRESET_TEMPLATES = [
  {
    id: 'chelsea-11',
    label: '切尔西 1-1 · 月度追踪',
    spec: {
      name: '切尔西 1-1 · 月度追踪',
      team: '切尔西',
      market: 'score',
      score: { for: 1, against: 1 },
      matchesPlanned: 6,
      stakePerMatch: 20,
      oddsMode: 'market',
      probMode: 'market',
    },
  },
  {
    id: 'strong-home-win',
    label: '强队主胜追踪',
    spec: {
      name: '强队主胜追踪',
      team: '曼城',
      market: 'result',
      outcome: 'win',
      matchesPlanned: 6,
      stakePerMatch: 20,
      oddsMode: 'market',
      probMode: 'market',
    },
  },
  {
    id: 'draw-collector',
    label: '平局收集者',
    spec: {
      name: '平局收集者',
      team: '热刺',
      market: 'result',
      outcome: 'draw',
      matchesPlanned: 6,
      stakePerMatch: 20,
      oddsMode: 'market',
      probMode: 'market',
    },
  },
  { id: 'blank', label: '空白自定义', spec: createEmptySpec() },
]

const DISCIPLINE_CARDS = [
  {
    id: 'vig',
    title: '价格需要时间坐标',
    body: '赛果、报价与预测必须对应当时可知的信息。假定赔率情景不能还原历史可执行收益。',
    IconComp: ShieldAlert,
    tone: 'rose',
  },
  {
    id: 'sample',
    title: '结论保留证据边界',
    body: '样本量、区间与数据覆盖一起阅读。固定场数、正收益或单项分数都不等于策略已被验证。',
    IconComp: Scale,
    tone: 'amber',
  },
  {
    id: 'decay',
    title: '每次修改留下版本',
    body: '先记录假设与失效条件，再冻结规则进行观察。修改后重新积累证据，保留旧实验和研究结论。',
    IconComp: TrendingUp,
    tone: 'slate',
  },
]

const ICON_TONE_CLASS = {
  indigo:
    'border-indigo-200 bg-gradient-to-b from-indigo-50 via-violet-50 to-white text-indigo-600 shadow-[0_1px_2px_rgba(99,102,241,0.16),inset_0_1px_0_rgba(255,255,255,0.88)]',
  sky: 'border-sky-200 bg-gradient-to-b from-sky-50 via-cyan-50 to-white text-sky-600 shadow-[0_1px_2px_rgba(14,165,233,0.18),inset_0_1px_0_rgba(255,255,255,0.9)]',
  emerald:
    'border-emerald-200 bg-gradient-to-b from-emerald-50 via-teal-50 to-white text-emerald-600 shadow-[0_1px_2px_rgba(16,185,129,0.17),inset_0_1px_0_rgba(255,255,255,0.88)]',
  amber:
    'border-amber-200 bg-gradient-to-b from-amber-50 via-orange-50 to-white text-amber-600 shadow-[0_1px_2px_rgba(245,158,11,0.16),inset_0_1px_0_rgba(255,255,255,0.9)]',
  violet:
    'border-violet-200 bg-gradient-to-b from-violet-50 via-fuchsia-50 to-white text-violet-600 shadow-[0_1px_2px_rgba(139,92,246,0.16),inset_0_1px_0_rgba(255,255,255,0.9)]',
  rose: 'border-rose-200 bg-gradient-to-b from-rose-50 via-pink-50 to-white text-rose-600 shadow-[0_1px_2px_rgba(244,63,94,0.16),inset_0_1px_0_rgba(255,255,255,0.9)]',
  slate:
    'border-stone-200 bg-gradient-to-b from-stone-50 via-zinc-50 to-white text-stone-600 shadow-[0_1px_2px_rgba(41,37,36,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]',
}

const GlassCardIcon = ({ IconComp, tone = 'indigo', iconSize = 14, className = '' }) => (
  <span
    className={`inline-flex h-7 w-7 items-center justify-center rounded-xl border ${ICON_TONE_CLASS[tone] || ICON_TONE_CLASS.indigo} ${className}`}
  >
    <IconComp size={iconSize} strokeWidth={1.7} />
  </span>
)

const fmtPct = (value, digits = 1) => (Number.isFinite(value) ? `${(value * 100).toFixed(digits)}%` : '—')
const fmtSignedPct = (value, digits = 1) =>
  Number.isFinite(value) ? `${value > 0 ? '+' : ''}${(value * 100).toFixed(digits)}%` : '—'
const fmtYuan = (value, digits = 1) =>
  Number.isFinite(value) ? `${value > 0 ? '+' : value < 0 ? '-' : ''}¥${Math.abs(value).toFixed(digits)}` : '—'

// 发现候选已接触全量数据；前后段切分仅为描述，不能称为独立样本外验证。
const OOS_STATE_META = {
  insufficient: {
    label: '后段样本不足',
    text: 'text-stone-500',
    badge: 'border-stone-200 bg-stone-50 text-stone-500',
  },
  profitable: {
    label: '后段情景收益为正',
    text: 'text-stone-600',
    badge: 'border-stone-200 bg-stone-50 text-stone-600',
  },
  flat: {
    label: '后段情景未盈利',
    text: 'text-amber-600',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  degraded: {
    label: '后段情景退化',
    text: 'text-rose-500',
    badge: 'border-rose-200 bg-rose-50 text-rose-600',
  },
}

const oosStateFor = (walkForward) => {
  if (!walkForward?.test || walkForward.test.n === 0) return 'insufficient'
  if (walkForward.testProfitable) return 'profitable'
  if (walkForward.notDegraded === false || walkForward.oosDegraded) return 'degraded'
  return 'flat'
}

const OosLabel = ({ walkForward, className = '' }) => (
  <span className={`${OOS_STATE_META[oosStateFor(walkForward)].text} ${className}`}>
    {OOS_STATE_META[oosStateFor(walkForward)].label}
  </span>
)

const VERDICT_TONE_CLASS = {
  positive: 'border-emerald-200 bg-emerald-50/80 text-emerald-800',
  neutral: 'border-amber-200 bg-amber-50/80 text-amber-800',
  negative: 'border-rose-200 bg-rose-50/80 text-rose-800',
}
const VERDICT_DOT_CLASS = { positive: 'bg-emerald-500', neutral: 'bg-amber-500', negative: 'bg-rose-500' }

const STATUS_BADGE_CLASS = {
  shadow: 'border-sky-200 bg-sky-50 text-sky-700',
  live: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  retired: 'border-stone-200 bg-stone-100 text-stone-500',
}
const NEXT_STATUS = { shadow: 'live', live: 'retired', retired: 'shadow' }

const Segmented = ({ options, value, onChange, ariaLabel }) => (
  <div className="inline-flex rounded-lg border border-stone-200 bg-stone-50/80 p-0.5" role="group" aria-label={ariaLabel}>
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        aria-pressed={value === option.value}
        disabled={Boolean(option.disabled)}
        title={option.title || ''}
        onClick={() => onChange(option.value)}
        className={`px-3 py-1.5 text-xs rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
          value === option.value
            ? 'bg-white shadow-sm text-stone-800 font-medium'
            : 'text-stone-500 hover:text-stone-700'
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
)

const FieldLabel = ({ children }) => (
  <label className="block text-xs font-medium text-stone-500 mb-1.5">{children}</label>
)

const INPUT_CLASS =
  'w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-300 focus:border-stone-300'

// 盈亏分布直方图：盈利区间用 emerald、亏损用 rose，零轴加亮，标出 p5 / 中位 / p95
const ProfitHistogram = ({ monteCarlo }) => {
  const bins = monteCarlo?.histogram || []
  if (!bins.length) return null
  const W = 600
  const H = 180
  const padTop = 18
  const padBottom = 26
  const min = monteCarlo.worst
  const max = monteCarlo.best
  const span = max - min || 1
  const xOf = (value) => ((value - min) / span) * W
  const maxCount = Math.max(...bins.map((bin) => bin.count), 1)
  const zeroX = min < 0 && max > 0 ? xOf(0) : null
  const markers = [
    { key: 'p5', value: monteCarlo.p5, label: 'P5', color: '#f43f5e' },
    { key: 'median', value: monteCarlo.medianProfit, label: '中位', color: '#57534e' },
    { key: 'p95', value: monteCarlo.p95, label: 'P95', color: '#10b981' },
  ]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44" role="img" aria-label="盈亏分布直方图">
      {bins.map((bin, index) => {
        const x0 = xOf(bin.x0)
        const x1 = xOf(bin.x1)
        const height = ((bin.count / maxCount) * (H - padTop - padBottom))
        const center = (bin.x0 + bin.x1) / 2
        return (
          <rect
            key={index}
            x={x0 + 0.5}
            y={H - padBottom - height}
            width={Math.max(1, x1 - x0 - 1)}
            height={height}
            rx={1.5}
            className={center >= 0 ? 'fill-emerald-400/80' : 'fill-rose-400/80'}
          />
        )
      })}
      {zeroX !== null && (
        <line x1={zeroX} y1={padTop - 6} x2={zeroX} y2={H - padBottom} stroke="#44403c" strokeWidth="1.4" />
      )}
      {markers.map((marker) => {
        if (!Number.isFinite(marker.value)) return null
        const x = xOf(marker.value)
        return (
          <g key={marker.key}>
            <line x1={x} y1={padTop} x2={x} y2={H - padBottom} stroke={marker.color} strokeWidth="1" strokeDasharray="3 3" />
            <text x={x} y={padTop - 6} fontSize="10" textAnchor="middle" fill={marker.color}>
              {marker.label}
            </text>
          </g>
        )
      })}
      <text x={2} y={H - 10} fontSize="10" fill="#a8a29e">
        {fmtYuan(min, 0)}
      </text>
      <text x={W - 2} y={H - 10} fontSize="10" textAnchor="end" fill="#a8a29e">
        {fmtYuan(max, 0)}
      </text>
      <text x={W / 2} y={H - 10} fontSize="10" textAnchor="middle" fill="#a8a29e">
        {monteCarlo.iterations.toLocaleString()} 次推演 · 每个直方柱是一条盈亏出路
      </text>
    </svg>
  )
}

const ProbViewsCard = ({ probViews }) => {
  const rows = [
    { key: 'devig', label: '市场去水', value: probViews.devig, barClass: 'bg-sky-400' },
    { key: 'poisson', label: '泊松反推', value: probViews.poisson, barClass: 'bg-indigo-400' },
    { key: 'base', label: '联赛基准', value: probViews.base, barClass: 'bg-stone-400' },
  ]
  if (Number.isFinite(probViews.ratings)) {
    rows.push({ key: 'ratings', label: '自建评级', value: probViews.ratings, barClass: 'bg-violet-400' })
  }
  const maxValue = Math.max(...rows.map((row) => (Number.isFinite(row.value) ? row.value : 0)), 1e-9)
  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center gap-3">
          <span className="w-16 shrink-0 text-xs text-stone-500">{row.label}</span>
          <div className="h-2.5 flex-1 rounded-full bg-stone-100 overflow-hidden">
            {Number.isFinite(row.value) && (
              <div
                className={`h-full rounded-full ${row.barClass}`}
                style={{ width: `${Math.max(2, (row.value / maxValue) * 100)}%` }}
              />
            )}
          </div>
          <span className="w-14 shrink-0 text-right text-xs font-semibold text-stone-700">{fmtPct(row.value)}</span>
        </div>
      ))}
    </div>
  )
}

const specSummaryLine = (spec) => {
  const market =
    spec.market === 'score'
      ? `比分 ${spec.score?.for ?? '?'}-${spec.score?.against ?? '?'}`
      : `胜平负 · ${OUTCOME_LABELS[spec.outcome] || '?'}`
  const venue = spec.venue && spec.venue !== 'any' ? ` · ${VENUE_LABELS[spec.venue]}` : ''
  return `${spec.team || '全联赛'} · ${market}${venue} · ${spec.matchesPlanned} 场 · ¥${spec.stakePerMatch}/场`
}

// 发现行的样本外查找键：teamKey 稳定唯一（未匹配球队是 name:归一化名），
// 绝不用可能为 null 的 teamId，否则不同球队会共用同一条 OOS 结果。
const discoveryRowKey = (row) =>
  `${row?.teamKey || row?.teamId || row?.teamName || 'unknown'}|${row?.templateId || ''}`

const RESULT_SOURCE_LABELS = { sporttery: '竞彩官方', manual: '手工导入', settled: '已结算投资', openfootball: '五大联赛' }

const REGIME_TONE_META = {
  higher_scoring: { label: '进球上升', className: 'border-emerald-200 bg-emerald-50 text-emerald-700', line: '近期场均进球较前一窗口上升，联赛节奏偏开放。' },
  lower_scoring: { label: '进球下降', className: 'border-sky-200 bg-sky-50 text-sky-700', line: '近期场均进球较前一窗口下降，联赛节奏趋于保守。' },
  more_draws: { label: '平局增多', className: 'border-violet-200 bg-violet-50 text-violet-700', line: '近期平局率上升，比分型策略需要重新评估估值。' },
  fewer_draws: { label: '平局减少', className: 'border-amber-200 bg-amber-50 text-amber-700', line: '近期平局率下降，胜负分化的比赛增多。' },
  stable: { label: '环境稳定', className: 'border-stone-200 bg-stone-50 text-stone-500', line: '近期与前一窗口的进球和平局结构基本稳定。' },
}

const downloadCsv = (content, filename) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(href)
}

const outcomeKeyForPosition = (strategy, position) => {
  if (position?.outcomeKey) return position.outcomeKey
  const spec = normalizeSpec(strategy)
  if (spec.market === 'score') {
    const home = position?.venue === 'away' ? spec.score.against : spec.score.for
    const away = position?.venue === 'away' ? spec.score.for : spec.score.against
    return `crs:${home}-${away}`
  }
  const outcome = spec.outcome || 'win'
  if (outcome === 'draw') return 'had:draw'
  if (position?.venue === 'away') return outcome === 'win' ? 'had:away' : 'had:home'
  return outcome === 'win' ? 'had:home' : 'had:away'
}

const trackedOutcomesFor = (strategies) => {
  const tracked = {}
  ;(Array.isArray(strategies) ? strategies : []).forEach((strategy) => {
    ;(Array.isArray(strategy?.positions) ? strategy.positions : []).forEach((position) => {
      if (position?.status !== 'pending') return
      const matchKey = position.matchKey || marketMatchKey(position)
      const outcomeKey = outcomeKeyForPosition(strategy, position)
      if (!matchKey || !outcomeKey) return
      if (!tracked[matchKey]) tracked[matchKey] = []
      if (!tracked[matchKey].includes(outcomeKey)) tracked[matchKey].push(outcomeKey)
    })
  })
  return tracked
}

const POSITION_STATUS_META = {
  pending: { label: '待结算', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  hit: { label: '命中', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  miss: { label: '未中', className: 'border-rose-200 bg-rose-50 text-rose-500' },
  void: { label: '作废', className: 'border-stone-200 bg-stone-50 text-stone-400' },
}

const fmtOdds = (value) => (Number.isFinite(Number(value)) && Number(value) > 1 ? Number(value).toFixed(2) : '—')
const fmtSharpe = (value) => (Number.isFinite(value) ? value.toFixed(2) : '—')
const fmtCi = (ci) => (ci ? `${fmtPct(ci.low)}–${fmtPct(ci.high)}` : '—')

// 回测累计盈亏折线：与盈亏分布直方图同一套 SVG 语言，零轴虚线，终值定色
const EquitySparkline = ({ equityCurve }) => {
  const points = Array.isArray(equityCurve) ? equityCurve : []
  if (points.length === 0) return null
  const W = 600
  const H = 140
  const padTop = 14
  const padBottom = 22
  const values = points.map((point) => point.cum)
  const min = Math.min(0, ...values)
  const max = Math.max(0, ...values)
  const span = max - min || 1
  const xOf = (index) => (points.length === 1 ? W / 2 : (index / (points.length - 1)) * W)
  const yOf = (value) => padTop + ((max - value) / span) * (H - padTop - padBottom)
  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${xOf(index).toFixed(1)},${yOf(point.cum).toFixed(1)}`)
    .join(' ')
  const zeroY = yOf(0)
  const last = points[points.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-32" role="img" aria-label="回测累计盈亏曲线">
      <line x1={0} y1={zeroY} x2={W} y2={zeroY} stroke="#d6d3d1" strokeWidth="1" strokeDasharray="3 3" />
      <path
        d={path}
        fill="none"
        stroke={last.cum >= 0 ? '#10b981' : '#f43f5e'}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <text x={2} y={H - 6} fontSize="10" fill="#a8a29e">
        谷底 {fmtYuan(min, 0)}
      </text>
      <text x={W - 2} y={H - 6} fontSize="10" textAnchor="end" fill="#a8a29e">
        {points.length} 场 · 终值 {fmtYuan(last.cum, 0)}
      </text>
    </svg>
  )
}

const EMPTY_RESEARCH = { schemaVersion: 1, projects: [], versions: [], runs: [] }
const emptyBrief = () => ({ hypothesis: '', falsifier: '', notes: '' })
const emptyProtocol = () => ({ startDate: '', endDate: '', holdoutStart: '' })
const readResearchState = () => {
  try { return { store: getResearchStore(), error: '' } }
  catch (error) { return { store: EMPTY_RESEARCH, error: error.message || '研究记录暂时无法读取。' } }
}
const readEvidenceState = () => {
  try { return { store: getEvidenceStore(), error: '' } }
  catch (error) { return { store: emptyEvidenceStore(), error: error.message } }
}
const readForwardCount = () => {
  try { return getForwardStore().plans.length }
  catch { return 0 }
}

export default function QuantsPage() {
  const maskText = usePreviewTextMask()
  const systemConfig = useMemo(() => getSystemConfig(), [])
  const teamOptions = useMemo(() => getTeamDirectoryProfiles(), [])
  const reservoir = useMemo(() => getReservoirState(), [])

  const [spec, setSpec] = useState(() => ({
    ...createEmptySpec(),
    bankroll: Number(systemConfig.initialCapital) || 600,
  }))
  const [marketMatches, setMarketMatches] = useState([])
  const [marketStatus, setMarketStatus] = useState({ state: 'idle', line: '尚未拉取市场赔率' })
  const [fetching, setFetching] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [strategies, setStrategies] = useState(() => getStrategies())
  // 赛果缓存 / 回测 / 发现扫描 / 策略台账状态
  const [resultsStatus, setResultsStatus] = useState(() => resultsCacheStatus())
  const [resultsAction, setResultsAction] = useState({ state: 'idle', line: '' })
  const [resultsFetching, setResultsFetching] = useState(false)
  const [manualImportOpen, setManualImportOpen] = useState(false)
  const [manualImportText, setManualImportText] = useState('')
  const [expandedStrategy, setExpandedStrategy] = useState(null)
  const [syncLine, setSyncLine] = useState('')
  const [syncNotes, setSyncNotes] = useState({})
  const [discoveryMinN, setDiscoveryMinN] = useState(15)
  const [discoveryQ, setDiscoveryQ] = useState(0.1)
  const [discoveryResult, setDiscoveryResult] = useState(null)
  const [discoveryShowAll, setDiscoveryShowAll] = useState(false)
  const [activeTab, setActiveTab] = useState('lab')
  const [openFootballLoading, setOpenFootballLoading] = useState(false)
  const [openFootballSources, setOpenFootballSources] = useState([])
  const [oddsStatus, setOddsStatus] = useState(() => oddsHistoryStatus())
  const [executionNotes, setExecutionNotes] = useState({})
  const [teamSearch, setTeamSearch] = useState('')
  const [showFullRatings, setShowFullRatings] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [researchState, setResearchState] = useState(readResearchState)
  const [projectId, setProjectId] = useState(null)
  const [brief, setBrief] = useState(emptyBrief)
  const [protocol, setProtocol] = useState(emptyProtocol)
  const [selectedRunId, setSelectedRunId] = useState(null)
  const [currentRunId, setCurrentRunId] = useState(null)
  const [researchNotice, setResearchNotice] = useState({ error: false, text: '' })
  const [evidenceState, setEvidenceState] = useState(readEvidenceState)
  const [forwardCount, setForwardCount] = useState(readForwardCount)
  const [observationVersionId, setObservationVersionId] = useState(null)
  const [labMode, setLabMode] = useState('single')
  const researchStore = researchState.store
  const currentRun = researchStore.runs.find((run) => run.id === currentRunId)
  const currentVersion = researchStore.versions.find((version) => version.id === currentRun?.versionId)

  const resultsIndex = useMemo(() => (resultsStatus.count > 0 ? getResultsIndex() : { matches: [] }), [resultsStatus])
  const ratings = useMemo(
    () => (resultsStatus.count > 0 ? buildTeamRatings(resultsIndex) : null),
    [resultsIndex, resultsStatus.count],
  )
  const regime = useMemo(
    () => (resultsStatus.count > 0 ? regimeSnapshot(resultsIndex, { window: 60 }) : null),
    [resultsIndex, resultsStatus.count],
  )
  const portfolio = useMemo(
    () => strategyPortfolio(strategies, { poolBalance: reservoir.availableCash, riskCapRatio: systemConfig.riskCapRatio }),
    [strategies, reservoir, systemConfig.riskCapRatio],
  )
  const portfolioSimulation = useMemo(() => simulateStrategyPortfolio(strategies, { iterations: 10000 }), [strategies])
  const portfolioHistogram = useMemo(
    () => ({ ...portfolioSimulation, medianProfit: portfolioSimulation.median }),
    [portfolioSimulation],
  )
  const efficiencyRows = useMemo(() => marketEfficiencyMap(marketMatches), [marketMatches])
  const discoveryOos = useMemo(() => {
    if (!discoveryResult) return {}
    return Object.fromEntries(
      discoveryResult.survivors.map((row) => [
        discoveryRowKey(row),
        walkForwardStrategy(specFromDiscoveryRow(row, DEFAULT_DISCOVERY_TEMPLATES), resultsIndex),
      ]),
    )
  }, [discoveryResult, resultsIndex])
  const ratingRows = useMemo(() => {
    if (!ratings) return { teams: [], minElo: 1500, maxElo: 1500 }
    const needle = teamSearch.trim().toLowerCase()
    const filtered = ratings.teams.filter(
      (team) =>
        !needle ||
        team.teamName.toLowerCase().includes(needle) ||
        String(team.rawTeamName || '').toLowerCase().includes(needle) ||
        team.teamKey.toLowerCase().includes(needle),
    )
    const teams = showFullRatings || needle
      ? filtered
      : filtered.length <= 24
        ? filtered
        : [...filtered.slice(0, 12), ...filtered.slice(-12)]
    return {
      teams,
      minElo: Math.min(...filtered.map((team) => team.elo), 1500),
      maxElo: Math.max(...filtered.map((team) => team.elo), 1500),
    }
  }, [ratings, teamSearch, showFullRatings])

  useEffect(() => {
    const onDataChanged = (event) => {
      if (event?.detail?.key === 'eivra.quant_research.v1') setResearchState(readResearchState())
      if (event?.detail?.key === 'eivra.strategies.v1') setStrategies(getStrategies())
      if (event?.detail?.key === 'eivra.results_cache.v1') setResultsStatus(resultsCacheStatus())
      if (event?.detail?.key === 'eivra.odds_history.v1') setOddsStatus(oddsHistoryStatus())
      if (event?.detail?.key === EVIDENCE_KEY) setEvidenceState(readEvidenceState())
      if (event?.detail?.key === FORWARD_KEY) setForwardCount(readForwardCount())
    }
    const onModeChanged = () => {
      setResearchState(readResearchState())
      setEvidenceState(readEvidenceState())
      setForwardCount(readForwardCount())
      setObservationVersionId(null)
      setLabMode('single')
      setProjectId(null)
      setCurrentRunId(null)
      setSelectedRunId(null)
      setAnalysis(null)
      setBrief(emptyBrief())
      setSpec(normalizeSpec(createEmptySpec()))
      setStrategies(getStrategies())
      setResultsStatus(resultsCacheStatus())
      setProtocol(emptyProtocol())
      setResearchNotice({ error: false, text: '' })
    }
    window.addEventListener('eivra:data-changed', onDataChanged)
    window.addEventListener('eivra:display-mode-changed', onModeChanged)
    return () => {
      window.removeEventListener('eivra:data-changed', onDataChanged)
      window.removeEventListener('eivra:display-mode-changed', onModeChanged)
    }
  }, [])

  // 页面内同步；关闭页面后不会采集。失败与不可用原因在观察区保留。
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const result = await fetchOfficialMarketOdds()
        if (cancelled) return
        if (!result.ok) {
          setSyncLine('页面内同步未完成：行情暂不可用，可手动重试。')
          return
        }
        setMarketMatches(result.matches)
        const capture = evidenceFromOfficial(result.matches)
        importEvidence(capture, { label: '页面采集 · 官方报价' })
        setMarketStatus({ state: 'ok', line: `已获取 ${result.matches.length} 场当前报价并保存采集时间。` })
        const currentResults = getResultsIndex()
        const currentRatings = buildTeamRatings(currentResults)
        let addedTotal = 0
        let settledTotal = 0
        let retiredTotal = 0
        const nextStrategies = getStrategies()
          .filter((item) => item.status === 'shadow' || item.status === 'live')
          .map((item) => {
            const synced = syncStrategyFixtures(item, result.matches, { ratings: currentRatings })
            if (synced.syncStatus?.available === false) {
              setSyncNotes((previous) => ({ ...previous, [item.id]: synced.syncStatus.message }))
            }
            const next = autoRetireStrategy(
              autoVoidStalePositions(
                settleStrategyPositions(refreshClosingOdds(synced, result.matches), currentResults),
              ),
            )
            const before = Array.isArray(item.positions) ? item.positions : []
            const after = Array.isArray(next.positions) ? next.positions : []
            const beforeStatus = new Map(before.map((position) => [position.id, position.status]))
            const newlySettled = after.filter(
              (position) => beforeStatus.get(position.id) === 'pending' && position.status !== 'pending',
            ).length
            const added = Math.max(0, after.length - before.length)
            const changed = JSON.stringify({
              positions: item.positions,
              status: item.status,
              statusHistory: item.statusHistory,
              retiredReason: item.retiredReason,
            }) !== JSON.stringify({
              positions: next.positions,
              status: next.status,
              statusHistory: next.statusHistory,
              retiredReason: next.retiredReason,
            })
            if (changed) {
              updateStrategy(item.id, {
                positions: next.positions,
                status: next.status,
                statusHistory: next.statusHistory,
                retiredReason: next.retiredReason,
              })
              addedTotal += added
              settledTotal += newlySettled
              if (item.status !== 'retired' && next.status === 'retired') retiredTotal += 1
            }
            return next
          })
        recordOddsSnapshot(result.matches, { trackedOutcomes: trackedOutcomesFor(nextStrategies) })
        setOddsStatus(oddsHistoryStatus())
        if (cancelled) return
        const notes = []
        if (addedTotal > 0 || settledTotal > 0) notes.push(`新增 ${addedTotal} 头寸 · 新结算 ${settledTotal} 场`)
        if (retiredTotal > 0) notes.push(`自动退役 ${retiredTotal} 个策略`)
        setSyncLine(`最近页面内同步 ${new Date().toLocaleTimeString('zh-CN')} · ${notes.length ? notes.join(' · ') : '暂无新增记录'}`)
      } catch (error) {
        if (!cancelled) setSyncLine(`页面内同步未完成：${error.message || '行情或存储暂不可用'}`)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  const clearCurrentResult = () => {
    setAnalysis(null)
    setCurrentRunId(null)
  }
  const patchSpec = (patch) => {
    setSpec((prev) => ({ ...prev, ...patch }))
    clearCurrentResult()
  }

  const applyTemplate = (template) => {
    setSpec((prev) =>
      normalizeSpec({
        ...createEmptySpec(),
        bankroll: prev.bankroll,
        ...template.spec,
      }),
    )
    clearCurrentResult()
    setProjectId(null)
    setBrief(emptyBrief())
    setProtocol(emptyProtocol())
  }

  const handleFetchMarket = async () => {
    setFetching(true)
    setMarketStatus({ state: 'loading', line: '正在拉取官方竞彩赔率…' })
    const result = await fetchOfficialMarketOdds()
    setFetching(false)
    if (!result.ok) {
      // 抓取失败（WAF 拦截 / 超时 / 无网络）≠ 没有市场价，只能降级
      setResearchNotice({ error: true, text: `官方报价采集失败（${result.reason || '网络不可用'}），历史证据保持原样。` })
      setMarketStatus({
        state: 'error',
        line: '拉取失败（网络被拦截或接口不可用）——已降级：可改用联赛基准概率 + 手动赔率继续推演',
      })
      return
    }
    setMarketMatches(result.matches)
    try {
      const capture = evidenceFromOfficial(result.matches)
      importEvidence(capture, { label: '手动采集 · 官方报价' })
      setResearchNotice({ error: false, text: `已保存 ${capture.quotes.length} 条带采集时间的报价。可在影子观察中显式运行冻结计划。` })
    } catch (error) {
      setResearchNotice({ error: true, text: `当前行情已获取，证据保存或观察任务未完成：${error.message}` })
    }
    const aliases = aliasesForTeam(spec.team)
    const count = aliases.length
      ? result.matches.filter((match) => matchVenueForTeam(match, aliases)).length
      : result.matches.length
    setMarketStatus({
      state: 'ok',
      line:
        count > 0
          ? `已更新 ${result.matches.length} 场在售赛事 · 找到该队 ${count} 场在售赛事`
          : `已更新 ${result.matches.length} 场在售赛事 · 该队暂不在售，推演将按估计场补齐`,
    })
  }

  const runResearch = (kind) => {
    if (researchState.error) return
    const normalized = normalizeSpec(spec)
    const name =
      normalized.name ||
      `${normalized.team || '全联赛'} ${
        normalized.market === 'score'
          ? `${normalized.score.for}-${normalized.score.against}`
          : OUTCOME_LABELS[normalized.outcome]
      }`
    try {
      const saved = createResearchExperiment({
        projectId, spec: { ...normalized, name }, brief, protocol, kind,
        resultsIndex, marketMatches, ratings, kellyDivisor: systemConfig.kellyDivisor,
      })
      setResearchState({ store: saved.store, error: '' })
      setProjectId(saved.project.id)
      setCurrentRunId(saved.run.id)
      setSelectedRunId(saved.run.id)
      setAnalysis(kind === 'simulation' ? saved.run.result.analysis : null)
      setResearchNotice({ error: false, text: `已保存 v${saved.version.number} 与本次实验的规则、输入快照和结果。可到策略库复现或补充结论。` })
    } catch (error) {
      setResearchNotice({ error: true, text: error.message || '实验未能完成保存，旧记录保持原样。' })
    }
  }

  const handleRun = () => runResearch('simulation')
  const handleSave = () => handleShadow(currentVersion, currentRun)

  const handleShadow = (version, run) => {
    if (!version || !run) return
    setObservationVersionId(version.id)
    setActiveTab('shelf')
    setResearchNotice({ error: false, text: `已选中 v${version.number}。请在观察区声明复盘日期与门槛，再冻结前向计划；已有计划的版本会打开原记录。` })
  }

  const handleSendCandidate = (order, plan) => {
    const candidate = sendQuantCandidate({ orderId: order.id, planId: plan.id, versionId: order.versionId,
      name: plan.name, eventId: order.eventId, home: order.home, away: order.away, kickoff: order.kickoff,
      market: order.market, selection: order.selection, quote: order.entryQuote, forecast: order.forecastSnapshot, stake: order.stake })
    setResearchNotice({ error: false, text: '已送入 Portfolio 研究候选收件箱。核对后可加入组合候选池，尚未创建实际投资。' })
    return candidate
  }

  const handleStartResearch = (intent = 'idea') => {
    if (intent === 'compare') { setActiveTab('library'); return }
    setProjectId(null)
    setLabMode('single')
    setSpec(normalizeSpec({ ...createEmptySpec(), bankroll: spec.bankroll }))
    setBrief(intent === 'history' ? { ...emptyBrief(), hypothesis: '我想了解所选结果在历史比赛中的发生频率，并检查前后时间段的变化。' } : emptyBrief())
    setProtocol(emptyProtocol())
    clearCurrentResult()
    setActiveTab('lab')
    setResearchNotice({ error: false, text: '' })
  }

  const handleLoadVersion = (version) => {
    if (!version) return
    setSpec(normalizeSpec(version.spec))
    setBrief({ ...emptyBrief(), ...version.brief })
    setProtocol({ ...emptyProtocol(), ...version.protocol })
    setProjectId(version.projectId)
    clearCurrentResult()
    setActiveTab('lab')
    setResearchNotice({ error: false, text: `已载入 v${version.number}。下一次运行会创建新版本，不会覆盖原实验。` })
  }

  const handleOpenRun = (id) => { setSelectedRunId(id); setActiveTab('library') }
  const handleRerun = (id) => {
    try {
      const saved = rerunResearchExperiment(id)
      setResearchState({ store: saved.store, error: '' })
      setSelectedRunId(saved.run.id)
      setActiveTab('library')
      setResearchNotice({ error: false, text: '已使用冻结输入复现；原实验保持不变。' })
    } catch (error) { setResearchNotice({ error: true, text: error.message || '复现失败。' }) }
  }
  const handleConclusion = (id, text) => {
    try {
      saveResearchConclusion(id, text)
      setResearchState(readResearchState())
      return true
    } catch (error) {
      setResearchNotice({ error: true, text: error.message || '结论保存失败。' })
      return false
    }
  }

  const handleReevaluate = (item) => {
    setSpec(normalizeSpec(item))
    setProjectId(item.researchProjectId || null)
    setBrief({ ...emptyBrief(), ...item.researchBrief })
    setProtocol({ ...emptyProtocol(), ...item.researchProtocol })
    clearCurrentResult()
    setActiveTab('lab')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── 赛果缓存操作 ──────────────────────────────────────────────────
  const handleFetchResults = async () => {
    setResultsFetching(true)
    setResultsAction({ state: 'loading', line: '正在拉取竞彩官方赛果（近 30 天）…' })
    const result = await fetchMatchResults({ days: 30 })
    const status = resultsCacheStatus()
    setResultsFetching(false)
    setResultsStatus(status)
    if (!result.ok) {
      // 抓取失败 ≠ 没有赛果：本地缓存原样保留，明确给出替代路径
      setResultsAction({
        state: 'error',
        line: '拉取失败（网络被拦截或接口不可用，本地赛果缓存不受影响）——可改用「导入已结算比分」或手工 JSON 导入',
      })
      return
    }
    setResultsAction({ state: 'ok', line: `新增 ${result.added ?? 0} 场（缓存共 ${status.count} 场）` })
    try {
      const observed = evidenceFromObservedResults(result.matches, getEvidenceStore())
      const next = importEvidence(observed, { label: '页面采集 · 首次观察官方赛果' })
      runForwardTask(null, next, { action: 'settle' })
      setResultsAction({ state: 'ok', line: `缓存新增 ${result.added ?? 0} 场；${observed.results.length} 场记录了首次可知时间；${observed.excluded.length} 场未严格匹配到已知赛事。` })
    } catch (error) { setResearchNotice({ error: true, text: `赛果缓存已更新，前向证据处理未完成：${error.message}` }) }
  }

  const handleHarvestSettled = () => {
    const result = importSettledScores(getInvestments())
    setResultsStatus(resultsCacheStatus())
    setResultsAction({
      state: 'ok',
      line: `已扫描已结算投资：提取 ${result.added + result.skipped} 场真实比分，新增 ${result.added} 场（去重跳过 ${result.skipped} 场）`,
    })
  }

  const handleManualImport = () => {
    let rows
    try {
      rows = JSON.parse(manualImportText)
    } catch {
      rows = null
    }
    const result = Array.isArray(rows) ? importResultRows(rows) : importResultsCsv(manualImportText)
    setResultsStatus(resultsCacheStatus())
    if (!result.ok) {
      setResultsAction({ state: 'error', line: `导入失败（${result.reason || '格式无法识别'}）——JSON 数组或带表头的 CSV 均可` })
      return
    }
    setResultsAction({
      state: result.invalid > 0 ? 'error' : 'ok',
      line: `手工导入：新增 ${result.added} 场 · 去重跳过 ${result.skipped} 场 · 字段不全丢弃 ${result.invalid} 条`,
    })
    if (result.added > 0) {
      setManualImportText('')
      setManualImportOpen(false)
    }
  }

  const handleFetchOpenFootball = async () => {
    setOpenFootballLoading(true)
    setOpenFootballSources([])
    setResultsAction({ state: 'loading', line: '正在顺序拉取五大联赛历史赛果（两个赛季，404 赛季自动跳过）…' })
    const result = await fetchOpenFootballResults()
    setOpenFootballLoading(false)
    setOpenFootballSources(result.sources || [])
    setResultsStatus(resultsCacheStatus())
    setResultsAction({
      state: result.ok ? 'ok' : 'error',
      line: result.ok
        ? `五大联赛赛果合并完成：新增 ${result.added} 场 · 去重跳过 ${result.skipped} 场（缓存共 ${resultsCacheStatus().count} 场）`
        : `五大联赛拉取失败（${result.reason || '网络不可用'}），本地缓存未受影响`,
    })
  }

  // ── 单个策略的合并同步：赛程/报价/收盘/结算/作废/退役，变化才持久化 ──
  const handleSyncStrategy = (item) => {
    const synced = syncStrategyFixtures(item, marketMatches, { ratings })
    const next = autoRetireStrategy(
      autoVoidStalePositions(
        settleStrategyPositions(refreshClosingOdds(synced, marketMatches), getResultsIndex()),
      ),
    )
    recordOddsSnapshot(marketMatches, { trackedOutcomes: trackedOutcomesFor([next]) })
    setOddsStatus(oddsHistoryStatus())
    const before = Array.isArray(item.positions) ? item.positions : []
    const after = Array.isArray(next.positions) ? next.positions : []
    const beforeStatus = new Map(before.map((position) => [position.id, position.status]))
    const newlySettled = after.filter(
      (position) => beforeStatus.get(position.id) === 'pending' && position.status !== 'pending',
    ).length
    const added = Math.max(0, after.length - before.length)
    updateStrategy(item.id, {
      positions: next.positions,
      status: next.status,
      statusHistory: next.statusHistory,
      retiredReason: next.retiredReason,
    })
    setSyncNotes((prev) => ({
      ...prev,
      [item.id]: `${synced.syncStatus?.message || ''}${marketMatches.length ? '' : '（未拉取市场赔率，赛程与收盘价未更新）'}已同步：新增 ${added} 头寸 · 新结算 ${newlySettled} 场${item.status !== next.status ? ' · 已自动退役' : ''}`,
    }))
  }

  const handleExecutePosition = (item, position) => {
    if (position.executedInvestmentId) return
    const validation = validateExecution(item, position, {
      poolBalance: reservoir.availableCash,
      riskCapRatio: systemConfig.riskCapRatio,
      existingStrategies: strategies,
    })
    if (!validation.ok) {
      setExecutionNotes((prev) => ({ ...prev, [position.id]: `建仓被拦截：${validation.reasons.join('；')}` }))
      return
    }
    const investment = buildInvestmentFromPosition(item, position, { stake: position.stake })
    const saved = saveInvestment(investment)
    if (!saved) {
      setExecutionNotes((prev) => ({ ...prev, [position.id]: '建仓失败：当前为只读模式或存储不可用' }))
      return
    }
    const marked = markPositionExecuted(item, position.id, { investmentId: saved.id, stake: position.stake })
    updateStrategy(item.id, { positions: marked.positions })
    setExecutionNotes((prev) => ({ ...prev, [position.id]: `已建仓 ${saved.id} · ¥${Number(position.stake).toFixed(1)}` }))
  }

  const handleVoidPosition = (item, positionId) => {
    const next = voidStrategyPosition(item, positionId, 'manual')
    updateStrategy(item.id, { positions: next.positions })
    setExecutionNotes((prev) => ({ ...prev, [positionId]: '已作废该头寸，不再计入待执行敞口' }))
  }

  // ── 历史回测 / 策略发现 ───────────────────────────────────────────
  const handleBacktest = () => runResearch('scenario')

  const handleDiscover = () => {
    const minN = Math.max(1, Number.parseInt(discoveryMinN, 10) || 15)
    const q = Number(discoveryQ) > 0 && Number(discoveryQ) <= 1 ? Number(discoveryQ) : 0.1
    setDiscoveryResult(discoverStrategies(getResultsIndex(), { minN, q }))
    setDiscoveryShowAll(false)
  }

  const handleLoadDiscoveryRow = (row) => {
    setSpec(specFromDiscoveryRow(row, DEFAULT_DISCOVERY_TEMPLATES))
    clearCurrentResult()
    setProjectId(null)
    setProtocol(emptyProtocol())
    setBrief({
      hypothesis: `${row.teamName} · ${row.label} 的历史频率值得进一步研究。`,
      falsifier: '',
      notes: `来源：探索扫描，共扫描 ${discoveryResult?.totalTested || 0} 个组合；候选已使用全量赛果筛选。后续历史时间切分不构成独立验证。`,
    })
    setActiveTab('lab')
    setResearchNotice({ error: false, text: '已将发现线索载入研究表单。先保存一次实验，再决定是否冻结规则进入影子观察。' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const { legs } = analysis || { legs: [] }
  const poolKelly = analysis
    ? kellyStakeForPool({
        p: analysis.perBet.avgP,
        odds: analysis.perBet.avgOdds,
        poolBalance: reservoir.availableCash,
        riskCapRatio: systemConfig.riskCapRatio,
        kellyDivisor: systemConfig.kellyDivisor,
      })
    : null
  const strategyAlertChips = strategies.flatMap((item) => {
    if (!Array.isArray(item.positions) || item.positions.length === 0) return []
    const stats = strategyStats(item)
    const chips = []
    if (stats.drift) chips.push({ id: `drift:${item.id}`, level: 'warn', text: `${item.name || '未命名策略'}：近期漂移` })
    if (stats.suggestRetire) chips.push({ id: `retire:${item.id}`, level: 'danger', text: `${item.name || '未命名策略'}：建议退役` })
    return chips
  })
  const alertChips = [...portfolio.alerts, ...strategyAlertChips]

  return (
    <div className="page-shell page-content-wide quant-page">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-stone-800 font-display flex items-center gap-2.5">
            <GlassCardIcon IconComp={FlaskConical} tone="violet" iconSize={16} className="h-9 w-9" />
            Quants · 量化策略实验室
          </h2>
          <p className="text-stone-400 text-sm mt-1">从一个直觉，到可复现的实验与持续观察</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="qr-button qr-button-primary" onClick={() => handleStartResearch('idea')}>
            <Plus size={15} strokeWidth={1.9} />开始一项研究
          </button>
          <button type="button" className="qr-guide-trigger" onClick={() => setGuideOpen(true)} aria-haspopup="dialog">
            <BookOpen size={15} strokeWidth={1.8} />使用指南与设计思路
          </button>
        </div>
      </div>
      <QuantGuideDialog open={guideOpen} onClose={() => setGuideOpen(false)} />
      <nav className="qr-workspace-tabs" aria-label="Quant 工作区">
        {[
          { id: 'home', label: '研究台', Icon: BookOpen },
          { id: 'lab', label: '实验工作台', Icon: FlaskConical },
          { id: 'library', label: '策略库', Icon: Library },
          { id: 'shelf', label: '影子观察', Icon: Radar },
          { id: 'data', label: '数据中心', Icon: Database },
        ].map((tab) => <button key={tab.id} type="button" aria-current={activeTab === tab.id ? 'page' : undefined} onClick={() => setActiveTab(tab.id)}><tab.Icon size={14} strokeWidth={1.8} />{tab.label}</button>)}
      </nav>
      {(researchState.error || researchNotice.text) && <div role={researchState.error || researchNotice.error ? 'alert' : 'status'} className={`qr-page-notice ${researchState.error || researchNotice.error ? 'is-error' : ''}`}>{researchState.error || researchNotice.text}</div>}
      {activeTab === 'home' && <ResearchDesk store={researchStore} onStart={handleStartResearch} onOpenRun={handleOpenRun} onNavigate={setActiveTab} shadowCount={forwardCount} resultCount={resultsStatus.count} />}
      {activeTab === 'library' && <ResearchLibrary store={researchStore} selectedRunId={selectedRunId} onSelectRun={setSelectedRunId} onRerun={handleRerun} onConclusion={handleConclusion} onLoadVersion={handleLoadVersion} onShadow={handleShadow} onStart={() => handleStartResearch()} legacyStrategies={strategies} onImportLegacy={handleReevaluate} />}

      {activeTab === 'lab' && (
        <>
      <ResearchBriefEditor brief={brief} onChange={(value) => { setBrief(value); clearCurrentResult() }} protocol={protocol} onProtocolChange={(value) => { setProtocol(value); clearCurrentResult() }} projectName={maskText(researchStore.projects.find((item) => item.id === projectId)?.name || '')} onNewResearch={() => handleStartResearch()} />
      <div className="qr-lab-tabs" role="group" aria-label="实验方式"><button type="button" aria-pressed={labMode === 'single'} onClick={() => setLabMode('single')}><FlaskConical size={14} />规则与单次实验</button><button type="button" aria-pressed={labMode === 'validation'} onClick={() => setLabMode('validation')}><History size={14} />参数、滚动与价格回放</button></div>
      {labMode === 'validation' && <QuantValidationWorkspace spec={spec} resultsIndex={resultsIndex} evidence={evidenceState.store} onLoadSpec={(next) => { setSpec(normalizeSpec(next)); clearCurrentResult(); setLabMode('single') }} />}
      <div hidden={labMode !== 'single'}>
      {currentRun && <ResearchRunReport run={currentRun} version={currentVersion} onRerun={handleRerun} onConclusion={handleConclusion} onLoadVersion={handleLoadVersion} onShadow={handleShadow} />}

      {/* ── 预设模板 ── */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-xs text-stone-400 mr-1">预设模板</span>
        {PRESET_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => applyTemplate(template)}
            className="px-3 py-1.5 rounded-full border border-stone-200 bg-white text-xs text-stone-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-stone-300 hover:text-stone-800"
          >
            {maskText(template.label)}
          </button>
        ))}
      </div>

      {/* ── 策略试算器 ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* 左：表单 */}
        <div className="xl:col-span-2 glow-card bg-white rounded-2xl border border-stone-100 p-6 space-y-5 self-start">
          <h3 className="font-medium text-stone-700 flex items-center gap-2">
            <GlassCardIcon IconComp={FlaskConical} tone="indigo" />
            策略试算器
          </h3>

          <div>
            <FieldLabel>策略名称</FieldLabel>
            <input
              type="text"
              value={spec.name}
              onChange={(event) => patchSpec({ name: event.target.value })}
              placeholder="留空则按球队与玩法自动命名"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <FieldLabel>球队（留空 = 全联赛口径）</FieldLabel>
            <input
              type="text"
              list="quants-team-options"
              value={spec.team}
              onChange={(event) => patchSpec({ team: event.target.value })}
              placeholder="如：切尔西 / chelsea"
              className={INPUT_CLASS}
            />
            <datalist id="quants-team-options">
              {teamOptions.map((team) => (
                <option key={team.teamId || team.teamName} value={team.teamName} />
              ))}
            </datalist>
          </div>

          <div>
            <FieldLabel>场地口径</FieldLabel>
            <Segmented
              ariaLabel="场地口径"
              value={spec.venue || 'any'}
              onChange={(venue) => patchSpec({ venue })}
              options={[
                { value: 'any', label: '不限' },
                { value: 'home', label: '主场' },
                { value: 'away', label: '客场' },
              ]}
            />
            <p className="mt-1 text-[11px] text-stone-400">只统计该队在该侧的赛程；不填球队时忽略，按全联赛口径。</p>
          </div>

          <div>
            <FieldLabel>玩法</FieldLabel>
            <Segmented
              ariaLabel="玩法"
              value={spec.market}
              onChange={(market) => patchSpec({ market })}
              options={[
                { value: 'score', label: '比分' },
                { value: 'result', label: '胜平负' },
              ]}
            />
          </div>

          {spec.market === 'score' ? (
            <div>
              <FieldLabel>比分 · 本队进球 / 对手进球</FieldLabel>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={spec.score?.for ?? 1}
                  onChange={(event) =>
                    patchSpec({ score: { for: event.target.value, against: spec.score?.against ?? 1 } })
                  }
                  className={`${INPUT_CLASS} w-20 text-center`}
                />
                <span className="text-stone-400 text-sm">:</span>
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={spec.score?.against ?? 1}
                  onChange={(event) =>
                    patchSpec({ score: { for: spec.score?.for ?? 1, against: event.target.value } })
                  }
                  className={`${INPUT_CLASS} w-20 text-center`}
                />
              </div>
              <p className="mt-1 text-[11px] text-stone-400">比分票本身不分主客：1-1 在主场和客场是同一张票；场地口径只筛选赛程。</p>
            </div>
          ) : (
            <div>
              <FieldLabel>结果方向（该队视角）</FieldLabel>
              <Segmented
                ariaLabel="结果方向"
                value={spec.outcome || 'win'}
                onChange={(outcome) => patchSpec({ outcome })}
                options={[
                  { value: 'win', label: '该队胜' },
                  { value: 'draw', label: '平' },
                  { value: 'lose', label: '该队负' },
                ]}
              />
            </div>
          )}

          <div>
            <FieldLabel>计划场次 · {spec.matchesPlanned} 场</FieldLabel>
            <input
              type="range"
              min="1"
              max="20"
              value={spec.matchesPlanned}
              onChange={(event) => patchSpec({ matchesPlanned: Number(event.target.value) })}
              className="w-full accent-stone-600"
            />
          </div>

          <div>
            <FieldLabel>每场注码（¥）</FieldLabel>
            <input
              type="number"
              min="0"
              value={spec.stakePerMatch}
              onChange={(event) => patchSpec({ stakePerMatch: event.target.value })}
              className={INPUT_CLASS}
            />
          </div>

          <div className="space-y-2">
            <FieldLabel>赔率来源</FieldLabel>
            <Segmented
              ariaLabel="赔率来源"
              value={spec.oddsMode}
              onChange={(oddsMode) => patchSpec({ oddsMode })}
              options={[
                { value: 'market', label: '实时市场' },
                { value: 'manual', label: '手动' },
              ]}
            />
            {spec.oddsMode === 'manual' && (
              <input
                type="number"
                min="1.01"
                step="0.05"
                value={spec.manualOdds}
                onChange={(event) => patchSpec({ manualOdds: event.target.value })}
                className={INPUT_CLASS}
              />
            )}
          </div>

          <div className="space-y-2">
            <FieldLabel>概率来源</FieldLabel>
            <Segmented
              ariaLabel="概率来源"
              value={spec.probMode}
              onChange={(probMode) => patchSpec({ probMode })}
              options={[
                { value: 'market', label: '市场定价' },
                { value: 'base', label: '联赛基准' },
                { value: 'custom', label: '自定义' },
                {
                  value: 'ratings',
                  label: '自建评级',
                  disabled: !ratings,
                  title: ratings ? '使用赛果驱动的 Elo 攻防分布' : '赛果缓存为空——先在「数据」里拉取或导入赛果',
                },
              ]}
            />
            {spec.probMode === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={Number((spec.customProb * 100).toFixed(2))}
                  onChange={(event) => patchSpec({ customProb: Number(event.target.value) / 100 })}
                  className={`${INPUT_CLASS} w-28`}
                />
                <span className="text-xs text-stone-400">% 估计命中率</span>
              </div>
            )}
          </div>

          {spec.oddsMode !== 'manual' && <div>
            <FieldLabel>历史情景假定赔率</FieldLabel>
            <input type="number" min="1.01" step="0.1" value={spec.manualOdds} onChange={(event) => patchSpec({ manualOdds: Number(event.target.value) })} className={INPUT_CLASS} aria-label="历史情景假定赔率" />
            <p className="mt-1 text-xs text-stone-500">假设赔率情景始终使用此固定值，不会套用今天的市场价。</p>
          </div>}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button type="button" onClick={handleFetchMarket} disabled={fetching} className="btn-secondary btn-hover">
              <span className="inline-flex items-center gap-1.5">
                <DownloadCloud size={14} strokeWidth={1.8} />
                {fetching ? '拉取中…' : '拉取市场定价'}
              </span>
            </button>
            <button type="button" onClick={handleRun} disabled={Boolean(researchState.error)} className="btn-primary btn-hover">
              <span className="inline-flex items-center gap-1.5">
                <Play size={14} strokeWidth={1.8} />
                运行并保存推演
              </span>
            </button>
            <button
              type="button"
              onClick={handleBacktest}
              disabled={resultsStatus.count === 0 || Boolean(researchState.error)}
              title={resultsStatus.count === 0 ? '先在数据中心导入历史赛果' : '按固定假定赔率进行情景分析并保存'}
              className="btn-secondary btn-hover"
            >
              <span className="inline-flex items-center gap-1.5">
                <History size={14} strokeWidth={1.8} />
                假设赔率情景
              </span>
            </button>
            <button type="button" onClick={() => runResearch('frequency')} disabled={resultsStatus.count === 0 || Boolean(researchState.error)} className="btn-secondary btn-hover">
              <span className="inline-flex items-center gap-1.5"><Database size={14} />研究历史规律</span>
            </button>
          </div>
          <p
            className={`text-[11px] leading-relaxed ${
              marketStatus.state === 'error'
                ? 'text-amber-600'
                : marketStatus.state === 'ok'
                  ? 'text-emerald-600'
                  : 'text-stone-400'
            }`}
          >
            {marketStatus.line}
          </p>
        </div>

        {/* 右：推演结果 */}
        <div className="xl:col-span-3 min-w-0 space-y-6">
          {currentRun?.kind === 'scenario' && <div className="glow-card bg-white rounded-2xl p-6 border border-stone-100">
            <h3 className="font-medium text-stone-700 mb-3">假设赔率情景 · 累计盈亏</h3>
            <EquitySparkline equityCurve={currentRun.result.summary.equityCurve} />
            <p className="mt-2 text-xs text-stone-500">横向为入选比赛顺序，纵向为累计金额。全部比赛采用同一假定赔率，不代表历史可执行收益。</p>
          </div>}
          {!analysis && !currentRun && (
            <div className="glow-card bg-white rounded-2xl border border-stone-100 p-10 text-center">
              <GlassCardIcon IconComp={Gauge} tone="slate" iconSize={18} className="h-10 w-10 mx-auto mb-3" />
              <p className="text-sm text-stone-500">先拉取市场定价，再运行推演。</p>
              <p className="mt-1 text-xs text-stone-400">
                拉不到市场价也能推演：概率切到联赛基准、赔率切到手动，即为纯假设口径。
              </p>
            </div>
          )}

          {analysis && (
            <>
              {analysis.warning && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-800">
                  {analysis.warning}
                </div>
              )}

              <div className={`rounded-2xl border px-5 py-4 ${VERDICT_TONE_CLASS[analysis.verdict.tone]}`}>
                <div className="flex items-center gap-2 font-semibold">
                  <span className={`h-2 w-2 rounded-full ${VERDICT_DOT_CLASS[analysis.verdict.tone]}`} />
                  {analysis.verdict.headline}
                </div>
                <ul className="mt-2 space-y-1 text-xs leading-relaxed opacity-90">
                  {analysis.verdict.lines.map((line, index) => (
                    <li key={index}>· {line}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: '单场期望 ROI',
                    value: fmtSignedPct(analysis.perBet.evPct),
                    tone: analysis.perBet.evPct >= 0 ? 'text-emerald-600' : 'text-rose-500',
                  },
                  {
                    label: `平衡命中 ${fmtPct(analysis.perBet.breakevenP)} vs 估计 ${fmtPct(analysis.perBet.avgP)}`,
                    value: `${analysis.perBet.edgePP > 0 ? '+' : ''}${(analysis.perBet.edgePP * 100).toFixed(1)} pp`,
                    tone: analysis.perBet.edgePP >= 0 ? 'text-emerald-600' : 'text-rose-500',
                  },
                  {
                    label: `${analysis.spec.matchesPlanned} 场盈利概率`,
                    value: fmtPct(analysis.monteCarlo.pProfit),
                    tone: analysis.monteCarlo.pProfit >= 0.5 ? 'text-emerald-600' : 'text-stone-700',
                  },
                  {
                    label: '期望总盈亏',
                    value: fmtYuan(analysis.monteCarlo.meanProfit),
                    tone: analysis.monteCarlo.meanProfit >= 0 ? 'text-emerald-600' : 'text-rose-500',
                  },
                ].map((tile) => (
                  <div key={tile.label} className="glow-card bg-white rounded-2xl p-5 border border-stone-100">
                    <span className="block text-[11px] text-stone-400 leading-snug min-h-8">{tile.label}</span>
                    <span className={`mt-1 block text-xl font-semibold ${tile.tone}`}>{tile.value}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'VaR 95（P5 盈亏）', value: fmtYuan(analysis.monteCarlo.p5) },
                  { label: '全亏概率', value: fmtPct(analysis.monteCarlo.pRuin) },
                  {
                    label: `Kelly 建议注码（1/${analysis.kelly.divisor}）`,
                    value: `${fmtYuan(analysis.kelly.suggestedStake).replace('+', '')} / 场`,
                  },
                  {
                    label: '样本量粗估 · 非通过标准',
                    value: Number.isFinite(analysis.significance.nNeeded) ? `${analysis.significance.nNeeded} 场` : '不可可靠估计',
                  },
                ].map((tile) => (
                  <div key={tile.label} className="glow-card bg-white rounded-2xl p-4 border border-stone-100">
                    <span className="block text-[11px] text-stone-400 leading-snug min-h-8">{tile.label}</span>
                    <span className="mt-1 block text-sm font-semibold text-stone-700">{tile.value}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glow-card bg-white rounded-2xl p-6 border border-stone-100">
                  <h3 className="font-medium text-stone-700 mb-4 flex items-center gap-2">
                    <GlassCardIcon IconComp={Scale} tone="sky" />
                    概率视角
                  </h3>
                  <ProbViewsCard probViews={analysis.probViews} />
                  {Number.isFinite(analysis.overround) && (
                    <p className="mt-3 text-[11px] text-stone-400">市场抽水率（去水口径）约 {fmtPct(analysis.overround)}</p>
                  )}
                </div>
                <div className="glow-card bg-white rounded-2xl p-6 border border-stone-100">
                  <h3 className="font-medium text-stone-700 mb-4 flex items-center gap-2">
                    <GlassCardIcon IconComp={Landmark} tone="emerald" />
                    资金口径
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">总头寸（{analysis.spec.matchesPlanned} 场）</span>
                      <span className="font-semibold text-stone-700">{fmtYuan(analysis.totalStake).replace('+', '')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">你的每场注码</span>
                      <span className="font-semibold text-stone-700">¥{Number(analysis.kelly.stakePerMatch).toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">Kelly 建议每场</span>
                      <span className={`font-semibold ${analysis.kelly.suggestedStake >= analysis.kelly.stakePerMatch ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {fmtYuan(analysis.kelly.suggestedStake).replace('+', '')}
                      </span>
                    </div>
                    {poolKelly && (
                      <div className="flex items-center justify-between border-t border-stone-100 pt-3">
                        <span className="text-stone-500">
                          蓄水池 Kelly（{fmtPct(poolKelly.fraction)} / 1-{systemConfig.kellyDivisor}）
                        </span>
                        <span className={`font-semibold ${poolKelly.capReason ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {fmtYuan(poolKelly.rawStake).replace('+', '')} → {fmtYuan(poolKelly.cappedStake).replace('+', '')}
                          {poolKelly.capReason ? '（风险帽）' : ''}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">期望最大回撤</span>
                      <span className="font-semibold text-rose-500">-{fmtYuan(analysis.monteCarlo.expectedMaxDD).replace(/^[+-]?/, '')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glow-card bg-white rounded-2xl p-6 border border-stone-100">
                <h3 className="font-medium text-stone-700 mb-4 flex items-center gap-2">
                  <GlassCardIcon IconComp={Gauge} tone="indigo" />
                  盈亏分布推演
                </h3>
                <ProfitHistogram monteCarlo={analysis.monteCarlo} />
              </div>

              <div className="glow-card bg-white rounded-2xl p-6 border border-stone-100">
                <h3 className="font-medium text-stone-700 mb-4 flex items-center gap-2">
                  <GlassCardIcon IconComp={Library} tone="slate" />
                  逐场明细
                </h3>
                <div className="rounded-xl border border-stone-100 bg-white overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50/90">
                      <tr className="text-left text-stone-500">
                        <th className="py-2.5 px-3 text-xs font-medium">场次</th>
                        <th className="py-2.5 px-3 text-xs font-medium">对手</th>
                        <th className="py-2.5 px-3 text-xs font-medium">日期</th>
                        <th className="py-2.5 px-3 text-xs font-medium">主客</th>
                        <th className="py-2.5 px-3 text-xs font-medium text-right">命中率 p</th>
                        <th className="py-2.5 px-3 text-xs font-medium text-right">赔率</th>
                        <th className="py-2.5 px-3 text-xs font-medium text-right">赔率漂移</th>
                        <th className="py-2.5 px-3 text-xs font-medium text-right">估计</th>
                      </tr>
                    </thead>
                    <tbody>
                      {legs.map((leg) => {
                        const drift = leg.matchKey && leg.outcomeKey ? getOddsDrift(leg.matchKey, leg.outcomeKey) : null
                        return (
                          <tr key={leg.index} className="border-t border-stone-100/90">
                            <td className="py-2.5 px-3 text-stone-600">{leg.estimated ? leg.label : `第 ${leg.index + 1} 场`}</td>
                            <td className="py-2.5 px-3 text-stone-700">{leg.opponent ? maskText(leg.opponent) : '—'}</td>
                            <td className="py-2.5 px-3 text-stone-500">{leg.kickoff || '—'}</td>
                            <td className="py-2.5 px-3 text-stone-500">
                              {leg.venue === 'home' ? '主' : leg.venue === 'away' ? '客' : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-stone-700">{fmtPct(leg.p)}</td>
                            <td className="py-2.5 px-3 text-right font-semibold italic text-violet-600">
                              {Number.isFinite(leg.odds) ? leg.odds.toFixed(2) : '—'}
                            </td>
                            <td className={`py-2.5 px-3 text-right text-xs ${
                              drift?.direction === 'steam'
                                ? 'text-emerald-600'
                                : drift?.direction === 'drift'
                                  ? 'text-rose-500'
                                  : 'text-stone-400'
                            }`}>
                              {drift && Number.isFinite(drift.changePct)
                                ? `${drift.direction === 'steam' ? '↓' : drift.direction === 'drift' ? '↑' : '→'} ${fmtSignedPct(drift.changePct)}`
                                : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {leg.estimated ? (
                                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">估计</span>
                              ) : (
                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">在售</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="button" onClick={handleSave} disabled={!analysis} className="btn-primary btn-hover">
                  <span className="inline-flex items-center gap-1.5">
                    <Archive size={14} strokeWidth={1.8} />
                    冻结进入影子观察
                  </span>
                </button>
              </div>
            </>
          )}

        </div>
      </div>
      </div>
        </>
      )}

      {activeTab === 'home' && (
        <details className="qr-explore-details">
          <summary>从历史数据寻找研究线索 · 探索工具</summary>
      {/* ── 策略发现扫描 ── */}
      <div className="mt-8 glow-card bg-white rounded-2xl border border-stone-100 p-6">
        <h3 className="font-medium text-stone-700 flex items-center gap-2">
          <GlassCardIcon IconComp={Radar} tone="violet" />
          策略发现扫描
        </h3>
        <p className="mt-1 text-xs text-stone-400">
          对赛果缓存里的每支球队 × 每个默认模板做一次历史命中率检验，并用 Benjamini–Hochberg
          校正本次批量比较。结果仅用于生成研究线索；假定赔率、重复筛选与同源数据切分，都限制了结论的独立性。
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <FieldLabel>最小样本 minN</FieldLabel>
            <input
              type="number"
              min="1"
              value={discoveryMinN}
              onChange={(event) => setDiscoveryMinN(event.target.value)}
              className={`${INPUT_CLASS} w-24`}
            />
          </div>
          <div>
            <FieldLabel>FDR 阈值 q</FieldLabel>
            <input
              type="number"
              min="0.01"
              max="1"
              step="0.01"
              value={discoveryQ}
              onChange={(event) => setDiscoveryQ(event.target.value)}
              className={`${INPUT_CLASS} w-24`}
            />
          </div>
          <button
            type="button"
            onClick={handleDiscover}
            disabled={resultsStatus.count === 0}
            title={resultsStatus.count === 0 ? '赛果缓存为空——先在下方「赛果数据」里拉取或导入' : ''}
            className="btn-primary btn-hover"
          >
            <span className="inline-flex items-center gap-1.5">
              <Radar size={14} strokeWidth={1.8} />
              运行发现扫描
            </span>
          </button>
        </div>

        {discoveryResult && (
          <div className="mt-5">
            <p className="text-xs text-stone-500">
              扫描了 {discoveryResult.totalTested} 个组合，仅 {discoveryResult.survivors.length}{' '}
              个通过多重检验校正，其余视为噪音。
            </p>

            {discoveryResult.survivors.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {discoveryResult.survivors.map((row) => (
                  <div key={discoveryRowKey(row)} className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-stone-800">
                        {maskText(row.teamName)} · {row.label}
                      </span>
                      <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        本次扫描入选
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-stone-500">
                      {row.n} 场 · 命中率 {fmtPct(row.hitRate)}（CI {fmtCi(row.hitCI)}） · 假设赔率 {row.assumedOdds} · ROI{' '}
                      <span className={row.roi >= 0 ? 'text-emerald-600 font-semibold' : 'text-rose-500 font-semibold'}>
                        {fmtSignedPct(row.roi)}
                      </span>{' '}
                      · q = {row.qValue.toFixed(3)}
                    </p>
                    {discoveryOos[discoveryRowKey(row)] && (
                      <p className="mt-1 text-[11px] text-stone-500">
                        后段观察 {discoveryOos[discoveryRowKey(row)].test.n} 场 · 命中率{' '}
                        {fmtPct(discoveryOos[discoveryRowKey(row)].test.hitRate)}（全量 {row.n} 场） ·{' '}
                        <OosLabel walkForward={discoveryOos[discoveryRowKey(row)]} />
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleLoadDiscoveryRow(row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1 text-xs text-stone-600 btn-hover"
                      >
                        <RotateCcw size={12} strokeWidth={1.8} />
                        载入试算器
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadDiscoveryRow(row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-sky-200 px-2.5 py-1 text-xs text-sky-700 btn-hover"
                      >
                        <Archive size={12} strokeWidth={1.8} />
                        建立研究
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {discoveryResult.rows.length > 0 && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setDiscoveryShowAll((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700"
                >
                  {discoveryShowAll ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {discoveryShowAll ? '收起全部组合' : `查看全部 ${discoveryResult.rows.length} 个被检验组合`}
                </button>
                {discoveryShowAll && (
                  <div className="mt-2 rounded-xl border border-stone-100 bg-white overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-stone-50/90">
                        <tr className="text-left text-stone-500">
                          <th className="py-2 px-3 font-medium">球队</th>
                          <th className="py-2 px-3 font-medium">模板</th>
                          <th className="py-2 px-3 font-medium text-right">场数</th>
                          <th className="py-2 px-3 font-medium text-right">命中</th>
                          <th className="py-2 px-3 font-medium text-right">命中率</th>
                          <th className="py-2 px-3 font-medium text-right">假设赔率</th>
                          <th className="py-2 px-3 font-medium text-right">ROI</th>
                          <th className="py-2 px-3 font-medium text-right">q 值</th>
                          <th className="py-2 px-3 font-medium text-right">后段观察</th>
                          <th className="py-2 px-3 font-medium text-right">判定</th>
                        </tr>
                      </thead>
                      <tbody>
                        {discoveryResult.rows.map((row) => {
                          const oos = discoveryOos[discoveryRowKey(row)]
                          return (
                            <tr key={discoveryRowKey(row)} className="border-t border-stone-100/90">
                              <td className="py-2 px-3 text-stone-700">{maskText(row.teamName)}</td>
                              <td className="py-2 px-3 text-stone-500">{row.label}</td>
                              <td className="py-2 px-3 text-right text-stone-600">{row.n}</td>
                              <td className="py-2 px-3 text-right text-stone-600">{row.hits}</td>
                              <td className="py-2 px-3 text-right text-stone-700">{fmtPct(row.hitRate)}</td>
                              <td className="py-2 px-3 text-right text-stone-600">{row.assumedOdds}</td>
                              <td className={`py-2 px-3 text-right font-medium ${row.roi >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {fmtSignedPct(row.roi)}
                              </td>
                              <td className="py-2 px-3 text-right text-stone-600">{row.qValue.toFixed(3)}</td>
                              <td className="py-2 px-3 text-right">
                                {row.survivesFdr && oos ? (
                                  <span title="单次前后时间切分，候选已使用全量数据筛选，不能作为独立验证。">
                                    <OosLabel walkForward={oos} />
                                    <span className="ml-1 text-stone-400">
                                      命中率 {fmtPct(oos.test.hitRate)}（n={oos.test.n}）
                                    </span>
                                  </span>
                                ) : '—'}
                              </td>
                              <td className="py-2 px-3 text-right">
                                {row.survivesFdr ? (
                                  <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] text-stone-600">探索候选</span>
                                ) : (
                                  <span className="text-[10px] text-stone-500">未入选</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 联赛环境 ── */}
      <div className="mt-8 glow-card bg-white rounded-2xl border border-stone-100 p-6">
        <h3 className="font-medium text-stone-700 flex items-center gap-2">
          <GlassCardIcon IconComp={Gauge} tone="sky" />
          联赛环境
        </h3>
        {regime ? (
          <div className="mt-3">
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] ${REGIME_TONE_META[regime.tone].className}`}>
              {REGIME_TONE_META[regime.tone].label}
            </span>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-stone-50/70 p-3">
                <div className="text-stone-400">最近 {regime.recent.n} 场</div>
                <div className="mt-1 font-semibold text-stone-700">场均 {regime.recent.avgGoals.toFixed(2)} 球 · 平局 {fmtPct(regime.recent.drawRate)}</div>
                <div className="text-[10px] text-stone-400">主胜率 {fmtPct(regime.recent.homeWinRate)}</div>
              </div>
              <div className="rounded-xl bg-stone-50/70 p-3">
                <div className="text-stone-400">此前 {regime.previous.n} 场</div>
                <div className="mt-1 font-semibold text-stone-700">场均 {regime.previous.avgGoals.toFixed(2)} 球 · 平局 {fmtPct(regime.previous.drawRate)}</div>
                <div className="text-[10px] text-stone-400">主胜率 {fmtPct(regime.previous.homeWinRate)}</div>
              </div>
            </div>
            <p className="mt-3 text-xs text-stone-500">{REGIME_TONE_META[regime.tone].line}</p>
          </div>
        ) : (
          <p className="mt-2 text-xs text-stone-400">赛果缓存为空，暂无法判断联赛环境。</p>
        )}
      </div>

      {/* ── 球队评级 ── */}
      <div className="mt-8 glow-card bg-white rounded-2xl border border-stone-100 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-medium text-stone-700 flex items-center gap-2">
            <GlassCardIcon IconComp={Landmark} tone="indigo" />
            球队评级
          </h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={teamSearch}
              onChange={(event) => setTeamSearch(event.target.value)}
              placeholder="搜索球队 / teamKey"
              className={`${INPUT_CLASS} w-48 text-xs`}
            />
            {ratings && ratings.teams.length > 24 && !teamSearch.trim() && (
              <button
                type="button"
                onClick={() => setShowFullRatings((prev) => !prev)}
                className="rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs text-stone-600 btn-hover"
              >
                {showFullRatings ? '只看首尾各 12' : '展开全部'}
              </button>
            )}
          </div>
        </div>
        {ratings ? (
          <div className="mt-4 rounded-xl border border-stone-100 bg-white overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-stone-50/90">
                <tr className="text-left text-stone-500">
                  <th className="py-2 px-3 font-medium">排名</th>
                  <th className="py-2 px-3 font-medium">球队</th>
                  <th className="py-2 px-3 font-medium">Elo</th>
                  <th className="py-2 px-3 font-medium">近 5 场</th>
                  <th className="py-2 px-3 font-medium text-right">场次</th>
                  <th className="py-2 px-3 font-medium text-right">进 / 失</th>
                  <th className="py-2 px-3 font-medium text-right">攻 / 防</th>
                </tr>
              </thead>
              <tbody>
                {ratingRows.teams.map((team) => (
                  <tr key={team.teamKey} className="border-t border-stone-100/90">
                    <td className="py-2 px-3 text-stone-400">{team.rank}</td>
                    <td
                      className="py-2 px-3 font-medium text-stone-700"
                      title={team.rawTeamName && team.rawTeamName !== team.teamName ? team.rawTeamName : undefined}
                    >
                      {maskText(team.teamName)}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-12 font-semibold text-stone-700">{team.elo.toFixed(0)}</span>
                        <div className="h-1.5 w-24 rounded-full bg-stone-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-400"
                            style={{ width: `${Math.max(2, ((team.elo - ratingRows.minElo) / (ratingRows.maxElo - ratingRows.minElo || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-stone-500">{team.form || '—'}</td>
                    <td className="py-2 px-3 text-right text-stone-600">{team.n}</td>
                    <td className="py-2 px-3 text-right text-stone-600">{team.gf} / {team.ga}</td>
                    <td className="py-2 px-3 text-right text-stone-600">{team.attack.toFixed(2)} / {team.defense.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ratingRows.teams.length === 0 && <p className="p-4 text-xs text-stone-400">没有匹配的球队。</p>}
          </div>
        ) : (
          <p className="mt-2 text-xs text-stone-400">赛果缓存为空，先导入比赛再生成 Elo 评级。</p>
        )}
      </div>

        </details>
      )}

      {activeTab === 'data' && (
        <>
      <ResearchDataCapabilities resultCount={resultsStatus.count} coverage={evidenceCoverage(evidenceState.store)} />
      <QuantEvidenceWorkspace evidence={evidenceState.store} error={evidenceState.error} onCollect={handleFetchMarket} collecting={fetching} onCollectResults={handleFetchResults} resultsCollecting={resultsFetching} onRefresh={() => setEvidenceState(readEvidenceState())} />
      {/* ── 赛果数据 ── */}
      <div className="mt-8 glow-card bg-white rounded-2xl border border-stone-100 p-6">
        <h3 className="font-medium text-stone-700 flex items-center gap-2">
          <GlassCardIcon IconComp={Database} tone="sky" />
          赛果数据
        </h3>
        <p className="mt-1 text-xs text-stone-400">
          本地缓存 {resultsStatus.count} 场赛果
          {resultsStatus.minDate && resultsStatus.maxDate ? `（${resultsStatus.minDate} ~ ${resultsStatus.maxDate}）` : ''}
          {Object.keys(resultsStatus.sources).length > 0 &&
            ` · 来源：${Object.entries(resultsStatus.sources)
              .map(([key, count]) => `${RESULT_SOURCE_LABELS[key] || key} ${count}`)
              .join(' / ')}`}
          {resultsStatus.count === 0 && '——回测与自动结算都依赖它，先灌一批再玩'}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={handleFetchResults} disabled={resultsFetching} className="btn-secondary btn-hover">
            <span className="inline-flex items-center gap-1.5">
              <DownloadCloud size={14} strokeWidth={1.8} />
              {resultsFetching ? '拉取中…' : '拉取竞彩赛果'}
            </span>
          </button>
          <button type="button" onClick={handleFetchOpenFootball} disabled={openFootballLoading} className="btn-secondary btn-hover">
            <span className="inline-flex items-center gap-1.5">
              <DownloadCloud size={14} strokeWidth={1.8} />
              {openFootballLoading ? '拉取中…' : '拉取五大联赛赛果'}
            </span>
          </button>
          <button type="button" onClick={handleHarvestSettled} className="btn-secondary btn-hover">
            <span className="inline-flex items-center gap-1.5">
              <Archive size={14} strokeWidth={1.8} />
              导入已结算比分
            </span>
          </button>
          <button
            type="button"
            onClick={() => setManualImportOpen((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-600 btn-hover"
          >
            {manualImportOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            手工 JSON / CSV 导入
          </button>
        </div>
        {manualImportOpen && (
          <div className="mt-3 space-y-2">
            <textarea
              rows={4}
              value={manualImportText}
              onChange={(event) => setManualImportText(event.target.value)}
              placeholder={'JSON：[{"date":"2026-09-20","home":"切尔西","away":"阿森纳","homeGoals":2,"awayGoals":1}]\n或 CSV：date,home,away,homeGoals,awayGoals'}
              className={`${INPUT_CLASS} font-mono text-xs resize-y`}
            />
            <button type="button" onClick={handleManualImport} className="btn-primary btn-hover">
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} strokeWidth={1.8} />
                校验并导入
              </span>
            </button>
          </div>
        )}
        {resultsAction.line && (
          <p
            className={`mt-3 text-[11px] leading-relaxed ${
              resultsAction.state === 'error'
                ? 'text-amber-600'
                : resultsAction.state === 'ok'
                  ? 'text-emerald-600'
                  : 'text-stone-400'
            }`}
          >
            {resultsAction.line}
          </p>
        )}
        <p className="mt-2 text-[11px] text-stone-400">
          来源明细：{Object.entries(resultsStatus.sources).map(([key, count]) => `${RESULT_SOURCE_LABELS[key] || key} ${count}`).join(' · ') || '暂无'}
          {resultsStatus.conflicts > 0 ? ` · 已按优先级解决 ${resultsStatus.conflicts} 个比分冲突` : ''}
        </p>
        {openFootballSources.length > 0 && (
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-stone-500">
            {openFootballSources.map((source) => (
              <li key={`${source.league}:${source.season}`}>
                {source.league} · {source.season}：{source.ok ? `新增 ${source.added} 场` : source.reason === 'http_404' ? '404 · 赛季未发布（已跳过）' : `失败 · ${source.reason}`}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── 赔率历史 ── */}
      <div className="mt-8 glow-card bg-white rounded-2xl border border-stone-100 p-6">
        <h3 className="font-medium text-stone-700 flex items-center gap-2">
          <GlassCardIcon IconComp={History} tone="amber" />
          赔率历史
        </h3>
        <p className="mt-2 text-xs text-stone-500">
          已跟踪 {oddsStatus.matches} 场 · 累计 {oddsStatus.quotes} 条报价
          {oddsStatus.since ? ` · 自 ${oddsStatus.since.slice(0, 10)} 起` : ''}
        </p>
        <p className="mt-1 text-[11px] text-stone-400">
          收盘价是近似口径：取开赛前最后一次快照；若还没有赛前快照，只能退回最近一次报价，不能倒造历史收盘。
        </p>
      </div>

      {/* ── 市场效率 ── */}
      <div className="mt-8 glow-card bg-white rounded-2xl border border-stone-100 p-6">
        <h3 className="font-medium text-stone-700 flex items-center gap-2">
          <GlassCardIcon IconComp={Scale} tone="rose" />
          市场效率
        </h3>
        <p className="mt-1 text-xs text-stone-400">比分盘（CRS）通常比胜平负（HAD）更贵：平均抽水越高，市场越不友好。</p>
        {efficiencyRows.length > 0 ? (
          <div className="mt-4 rounded-xl border border-stone-100 bg-white overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-stone-50/90">
                <tr className="text-left text-stone-500">
                  <th className="py-2 px-3 font-medium">联赛</th>
                  <th className="py-2 px-3 font-medium text-right">场次</th>
                  <th className="py-2 px-3 font-medium text-right">HAD 平均抽水</th>
                  <th className="py-2 px-3 font-medium">CRS 平均抽水</th>
                  <th className="py-2 px-3 font-medium text-right">CRS 样本</th>
                </tr>
              </thead>
              <tbody>
                {efficiencyRows.map((row) => {
                  const maxOverround = Math.max(...efficiencyRows.map((item) => Number.isFinite(item.avgCrsOverround) ? item.avgCrsOverround : 0), 0.01)
                  return (
                    <tr key={row.league} className="border-t border-stone-100/90">
                      <td className="py-2 px-3 text-stone-700">{row.league}</td>
                      <td className="py-2 px-3 text-right text-stone-600">{row.matches}</td>
                      <td className="py-2 px-3 text-right text-stone-600">{fmtPct(row.avgHadOverround)}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-stone-100 overflow-hidden">
                            {Number.isFinite(row.avgCrsOverround) && (
                              <div className="h-full rounded-full bg-rose-400" style={{ width: `${Math.max(2, (row.avgCrsOverround / maxOverround) * 100)}%` }} />
                            )}
                          </div>
                          <span className="w-12 text-right text-stone-600">{fmtPct(row.avgCrsOverround)}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right text-stone-600">{row.crsSamples}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-xs text-stone-400">尚未拉取市场赔率，暂时没有可比较的联赛。</p>
        )}
      </div>

        </>
      )}

      {activeTab === 'shelf' && (
        <>
      <QuantForwardWorkspace versions={researchStore.versions} initialVersionId={observationVersionId} evidence={evidenceState.store} onRefresh={() => setEvidenceState(readEvidenceState())} onSendCandidate={handleSendCandidate} />
      <details className="qr-explore-details"><summary>原有策略台账与执行记录<span>保留旧数据，使用旧同步口径</span></summary>
      <div className="qr-page-notice">下方为原有台账，旧头寸不自动升级为严格前向证据。新的研究版本请使用上方冻结计划；已有执行记录和手动建仓流程继续保留。</div>
      <div className="mb-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: '活跃策略',
            value: `${portfolio.activeCount} 个`,
            sub: '影子盘 + 已转正',
            tone: 'text-stone-800',
          },
          {
            label: '待结算敞口',
            value: fmtYuan(portfolio.pendingStake).replace('+', ''),
            sub: portfolio.exposurePct === null ? '蓄水池比例未知' : `占蓄水池 ${fmtPct(portfolio.exposurePct)}`,
            tone: portfolio.exposurePct !== null && portfolio.exposurePct > systemConfig.riskCapRatio ? 'text-rose-500' : 'text-amber-600',
          },
          {
            label: '组合盈利概率',
            value: portfolioSimulation.available ? fmtPct(portfolioSimulation.pProfit) : '—',
            sub: portfolioSimulation.available ? `${portfolioSimulation.nPositions} 头寸 / ${portfolioSimulation.nMatches} 场` : '缺少可靠的联合分布',
            tone: 'text-emerald-600',
          },
          {
            label: '蓄水池可用',
            value: fmtYuan(Number(reservoir.availableCash) || 0).replace('+', ''),
            sub: `风险上限 ${fmtPct(systemConfig.riskCapRatio)}`,
            tone: 'text-stone-800',
          },
        ].map((kpi) => (
          <div key={kpi.label} className="glow-card rounded-2xl border border-stone-100 bg-white p-4">
            <span className="block text-[11px] text-stone-400">{kpi.label}</span>
            <span className={`mt-1 block text-xl font-semibold ${kpi.tone}`}>{kpi.value}</span>
            <span className="mt-0.5 block text-[10px] text-stone-400">{kpi.sub}</span>
          </div>
        ))}
      </div>

      {alertChips.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {alertChips.map((alert) => (
            <button
              key={alert.id}
              type="button"
              onClick={() => setActiveTab('shelf')}
              className={`rounded-full border px-3 py-1 text-[11px] ${
                alert.level === 'danger'
                  ? 'border-rose-200 bg-rose-50 text-rose-600'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
              }`}
            >
              {alert.text} · 去影子观察
            </button>
          ))}
        </div>
      )}


      {/* ── 策略架 ── */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-medium text-stone-700 flex items-center gap-2">
            <GlassCardIcon IconComp={Archive} tone="indigo" />
            影子观察台账
            {syncLine && <span className="text-[11px] font-normal text-emerald-600">{syncLine}</span>}
          </h3>
          {strategies.length > 0 && (
            <button
              type="button"
              onClick={() => downloadCsv(exportStrategiesCsv(strategies), 'quants-strategies.csv')}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1 text-xs text-stone-600 btn-hover"
            >
              <DownloadCloud size={12} strokeWidth={1.8} />
              导出策略 CSV
            </button>
          )}
        </div>

        {/* ── 组合风控 ── */}
        <div className="mb-5 glow-card bg-white rounded-2xl border border-stone-100 p-5">
          <h4 className="font-medium text-stone-700 flex items-center gap-2">
            <GlassCardIcon IconComp={ShieldAlert} tone="amber" />
            组合风控
          </h4>
          {portfolio.alerts.length > 0 && (
            <div className="mt-3 space-y-2">
              {portfolio.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    alert.level === 'danger' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-800'
                  }`}
                >
                  {alert.text}
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 space-y-2">
            {portfolio.teams.length > 0 ? portfolio.teams.map((team) => (
              <div key={team.teamKey} className="flex items-center gap-3 text-xs">
                <span className="w-28 shrink-0 truncate text-stone-600" title={team.teamName}>{maskText(team.teamName)}</span>
                <div className="h-2 flex-1 rounded-full bg-stone-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${team.pctOfPool !== null && team.pctOfPool > 0.25 ? 'bg-rose-400' : 'bg-amber-400'}`}
                    style={{ width: `${team.pctOfPool === null ? 0 : Math.min(100, (team.pctOfPool / systemConfig.riskCapRatio) * 100)}%` }}
                  />
                </div>
                <span className="w-28 shrink-0 text-right text-stone-500">
                  {fmtYuan(team.stake).replace('+', '')} · {team.pctOfPool === null ? '比例未知' : fmtPct(team.pctOfPool)}
                </span>
              </div>
            )) : <p className="text-xs text-stone-400">暂无待执行敞口。</p>}
          </div>
          {portfolioSimulation.available && (
            <div className="mt-4 border-t border-stone-100 pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                {[
                  { label: '联合盈利概率', value: fmtPct(portfolioSimulation.pProfit) },
                  { label: 'P5 盈亏', value: fmtYuan(portfolioSimulation.p5) },
                  { label: 'P95 盈亏', value: fmtYuan(portfolioSimulation.p95) },
                  { label: '期望最大回撤', value: fmtYuan(portfolioSimulation.expectedMaxDD) },
                ].map((tile) => (
                  <div key={tile.label}>
                    <div className="text-[10px] text-stone-400">{tile.label}</div>
                    <div className="mt-0.5 text-sm font-semibold text-stone-700">{tile.value}</div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-stone-400">同场互斥结果联合抽样 · {portfolioSimulation.nPositions} 个头寸 / {portfolioSimulation.nMatches} 场</p>
              <ProfitHistogram monteCarlo={portfolioHistogram} />
            </div>
          )}
          {!portfolioSimulation.available && <p className="mt-4 rounded-lg bg-stone-50 p-3 text-xs leading-relaxed text-stone-500">{portfolioSimulation.message}</p>}
        </div>
        {strategies.length === 0 ? (
          <div className="glow-card bg-white rounded-2xl border border-stone-100 p-8 text-center">
            <p className="text-sm text-stone-500">还没有观察中的策略。</p>
            <p className="mt-1 text-xs text-stone-400">
              在实验工作台保存一次实验，再从策略库冻结对应版本，开始记录未来比赛。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {strategies.map((item) => {
              const tone = item.snapshot?.tone
              const dotClass = VERDICT_DOT_CLASS[tone] || 'bg-stone-300'
              const positions = Array.isArray(item.positions) ? item.positions : []
              const stats = positions.length > 0 ? strategyStats(item) : null
              const expanded = expandedStrategy === item.id
              const promotable = stats?.promotable === true
              const failingGates = stats ? stats.gateChecks.filter((gate) => !gate.pass) : []
              return (
                <div
                  key={item.id}
                  className={`glow-card bg-white rounded-2xl border border-stone-100 p-5${expanded ? ' md:col-span-2 xl:col-span-3' : ''}`}
                >
                  <div
                    className="flex items-start justify-between gap-2 cursor-pointer"
                    onClick={() => setExpandedStrategy((prev) => (prev === item.id ? null : item.id))}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
                      <span className="truncate text-sm font-semibold text-stone-800">{maskText(item.name || '未命名策略')}</span>
                      {expanded ? (
                        <ChevronUp size={14} className="shrink-0 text-stone-400" />
                      ) : (
                        <ChevronDown size={14} className="shrink-0 text-stone-400" />
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] ${STATUS_BADGE_CLASS[item.status] || STATUS_BADGE_CLASS.shadow}`}>
                        {STRATEGY_STATUS_LABELS[item.status] || '影子盘'}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-stone-400">{maskText(specSummaryLine(normalizeSpec(item)))}</p>
                  {stats && (
                    <p className="mt-2 text-[11px] text-stone-500">
                      已结算 {stats.n} 场{stats.pending > 0 ? ` · 待结算 ${stats.pending}` : ''}{stats.voided > 0 ? ` · 作废 ${stats.voided}` : ''} · 命中率 {fmtPct(stats.hitRate)}（CI{' '}
                      {fmtCi(stats.hitCI)}） · ROI{' '}
                      <span className={stats.roi >= 0 ? 'text-emerald-600 font-medium' : 'text-rose-500 font-medium'}>
                        {fmtSignedPct(stats.roi)}
                      </span>{' '}
                      · Sharpe {fmtSharpe(stats.sharpe)} · 平均 CLV {fmtSignedPct(stats.avgClv)}
                    </p>
                  )}
                  {item.snapshot && (
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-[10px] text-stone-400">边际 vs 去水</div>
                        <div className={`text-xs font-semibold ${Number(item.snapshot.edgePP) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {Number.isFinite(Number(item.snapshot.edgePP))
                            ? `${Number(item.snapshot.edgePP) > 0 ? '+' : ''}${(Number(item.snapshot.edgePP) * 100).toFixed(1)}pp`
                            : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-stone-400">盈利概率</div>
                        <div className="text-xs font-semibold text-stone-700">{fmtPct(Number(item.snapshot.pProfit))}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-stone-400">期望盈亏</div>
                        <div className={`text-xs font-semibold ${Number(item.snapshot.expectedProfit) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {fmtYuan(Number(item.snapshot.expectedProfit))}
                        </div>
                      </div>
                    </div>
                  )}
                  {syncNotes[item.id] && <p className="mt-2 text-[11px] text-emerald-600">{syncNotes[item.id]}</p>}

                  {expanded && (
                    <div className="mt-4 space-y-4 border-t border-stone-100 pt-4">
                      {stats?.drift && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-800">
                          近期漂移警告：最近 {stats.recent5.n} 场 ROI {fmtSignedPct(stats.recent5.roi)}
                          ，与整体表现出现明显偏离——考虑降回影子盘观察，别追加。
                        </div>
                      )}
                      {stats?.suggestRetire && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-xs text-rose-700">
                          建议退役：命中率置信上限已低于盈亏平衡线，统计上无法转正。
                        </div>
                      )}

                      {stats && (
                        <div>
                          <h4 className="text-xs font-medium text-stone-500 mb-2">转正闸门（三道全过才放行）</h4>
                          <ul className="space-y-1.5">
                            {stats.gateChecks.map((gate) => (
                              <li key={gate.id} className="flex items-start gap-2 text-xs">
                                {gate.pass ? (
                                  <Check size={13} className="mt-0.5 shrink-0 text-emerald-600" />
                                ) : (
                                  <X size={13} className="mt-0.5 shrink-0 text-rose-400" />
                                )}
                                <span className={gate.pass ? 'text-stone-600' : 'text-stone-400'}>
                                  {gate.label}
                                  <span className="text-stone-400"> · {gate.detail}</span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {positions.length > 0 && (
                        <div className="rounded-xl border border-stone-100 bg-white overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-stone-50/90">
                              <tr className="text-left text-stone-500">
                                <th className="py-2 px-3 font-medium">场次</th>
                                <th className="py-2 px-3 font-medium">对手</th>
                                <th className="py-2 px-3 font-medium">开赛</th>
                                <th className="py-2 px-3 font-medium">主客</th>
                                <th className="py-2 px-3 font-medium text-right">入场赔率</th>
                                <th className="py-2 px-3 font-medium text-right">收盘赔率</th>
                                <th className="py-2 px-3 font-medium text-right">CLV</th>
                                <th className="py-2 px-3 font-medium text-right">概率 p</th>
                                <th className="py-2 px-3 font-medium text-right">状态</th>
                                <th className="py-2 px-3 font-medium text-right">盈亏</th>
                                <th className="py-2 px-3 font-medium text-right">操作</th>
                              </tr>
                            </thead>
                            <tbody>
                              {positions.map((position) => {
                                const statusMeta = POSITION_STATUS_META[position.status] || POSITION_STATUS_META.pending
                                const opponent = position.venue === 'away' ? position.home : position.away
                                const executionCheck = position.status === 'pending' && !position.executedInvestmentId
                                  ? validateExecution(item, position, {
                                      poolBalance: reservoir.availableCash,
                                      riskCapRatio: systemConfig.riskCapRatio,
                                      existingStrategies: strategies,
                                    })
                                  : null
                                const canExecute = item.status === 'live' && executionCheck?.ok === true && !position.executedInvestmentId
                                return (
                                  <tr key={position.id} className="border-t border-stone-100/90">
                                    <td className="py-2 px-3 text-stone-600">
                                      {maskText(position.home)} vs {maskText(position.away)}
                                    </td>
                                    <td className="py-2 px-3 text-stone-700">{opponent ? maskText(opponent) : '—'}</td>
                                    <td className="py-2 px-3 text-stone-500">{position.kickoff || '—'}</td>
                                    <td className="py-2 px-3 text-stone-500">
                                      {position.venue === 'home' ? '主' : position.venue === 'away' ? '客' : '—'}
                                    </td>
                                    <td className="py-2 px-3 text-right font-semibold italic text-violet-600">{fmtOdds(position.entryOdds)}</td>
                                    <td className="py-2 px-3 text-right text-stone-600">{fmtOdds(position.lastSeenOdds)}</td>
                                    <td
                                      className={`py-2 px-3 text-right font-medium ${
                                        Number.isFinite(position.clv)
                                          ? position.clv > 0
                                            ? 'text-emerald-600'
                                            : position.clv < 0
                                              ? 'text-rose-500'
                                              : 'text-stone-500'
                                          : 'text-stone-400'
                                      }`}
                                    >
                                      {Number.isFinite(position.clv) ? fmtSignedPct(position.clv) : '—'}
                                    </td>
                                    <td className="py-2 px-3 text-right text-stone-600">{fmtPct(Number(position.p))}</td>
                                    <td className="py-2 px-3 text-right">
                                      <span className={`rounded-full border px-2 py-0.5 text-[10px] ${statusMeta.className}`}>
                                        {statusMeta.label}
                                        {position.finalScore ? ` ${position.finalScore}` : ''}
                                      </span>
                                    </td>
                                    <td
                                      className={`py-2 px-3 text-right font-semibold ${
                                        position.status === 'hit'
                                          ? 'text-emerald-600'
                                          : position.status === 'miss'
                                            ? 'text-rose-500'
                                            : 'text-stone-400'
                                      }`}
                                    >
                                      {position.status === 'pending' ? '—' : fmtYuan(Number(position.profit))}
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                      {position.status === 'pending' ? (
                                        position.executedInvestmentId ? (
                                          <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] text-sky-700" title={position.executedInvestmentId}>
                                            已建仓
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1">
                                            <button
                                              type="button"
                                              disabled={!canExecute}
                                              title={canExecute ? '按当前注码生成一笔实盘投资' : executionCheck?.reasons?.join('；') || '仅已转正策略可建仓'}
                                              onClick={() => handleExecutePosition(item, position)}
                                              className="rounded-md border border-emerald-200 px-1.5 py-0.5 text-[10px] text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                              一键建仓
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleVoidPosition(item, position.id)}
                                              className="rounded-md border border-stone-200 px-1.5 py-0.5 text-[10px] text-stone-500"
                                            >
                                              作废
                                            </button>
                                          </span>
                                        )
                                      ) : '—'}
                                      {executionNotes[position.id] && (
                                        <div className="mt-1 max-w-56 text-[10px] leading-relaxed text-stone-400">{executionNotes[position.id]}</div>
                                      )}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {(item.status === 'shadow' || item.status === 'live') && (
                      <button
                        type="button"
                        onClick={() => handleSyncStrategy(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1 text-xs text-stone-600 btn-hover"
                      >
                        <RefreshCw size={12} strokeWidth={1.8} />
                        同步
                      </button>
                    )}
                    {positions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => downloadCsv(strategyPositionsCsv(item), `quants-${item.id}-positions.csv`)}
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1 text-xs text-stone-600 btn-hover"
                      >
                        <DownloadCloud size={12} strokeWidth={1.8} />
                        导出头寸 CSV
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleReevaluate(item)}
                      className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1 text-xs text-stone-600 btn-hover"
                    >
                      <RotateCcw size={12} strokeWidth={1.8} />
                      重新评估
                    </button>
                    <button
                      type="button"
                      disabled={item.status === 'shadow' && !promotable}
                      title={
                        item.status === 'shadow'
                          ? promotable
                            ? '三道闸门全部通过，可转正'
                            : `转正闸门未过：${failingGates.map((gate) => gate.label).join('；') || '暂无结算样本'}`
                          : ''
                      }
                      onClick={() => updateStrategy(item.id, { status: NEXT_STATUS[item.status] || 'shadow' })}
                      className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1 text-xs text-stone-600 btn-hover disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <ShieldCheck size={12} strokeWidth={1.8} />
                      {item.status === 'shadow' ? '转正' : item.status === 'live' ? '退役' : '回到影子盘'}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteStrategy(item.id)}
                      className="ml-auto inline-flex items-center gap-1 rounded-lg border border-rose-100 px-2.5 py-1 text-xs text-rose-500 btn-hover"
                    >
                      <Trash2 size={12} strokeWidth={1.8} />
                      删除
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      </details>
        </>
      )}

      {/* ── 量化纪律 ── */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {DISCIPLINE_CARDS.map((card) => (
          <div key={card.id} className="glow-card bg-white rounded-2xl border border-stone-100 p-5">
            <h4 className="font-medium text-stone-700 mb-2 flex items-center gap-2">
              <GlassCardIcon IconComp={card.IconComp} tone={card.tone} />
              {card.title}
            </h4>
            <p className="text-xs leading-relaxed text-stone-500">{card.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
