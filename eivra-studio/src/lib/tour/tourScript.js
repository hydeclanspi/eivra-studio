export const TOUR_VERSION = 2
export const ENTRY_DELAY_MS = 3750
export const PAGE_OVERVIEW_MS = 3000
export const ROUTE_LEAD_MS = 420
export const overviewDuration = (route) => route.startsWith('/history') ? 2000 : PAGE_OVERVIEW_MS
export const routeBudget = (route) => ROUTE_LEAD_MS + overviewDuration(route)
export const DEMO_IMPORT = '阿森纳2-0利物浦 odds 3.9 conf 0.71\n巴萨3-3皇马 odds 7.5 conf 0.45\n投入140块'
export const DEMO_SENTENCE = '阿森纳2-0利物浦 odds 3.9 conf 0.71 140块'

export const ACTS = [
  ['01', '判断', 'JUDGE'], ['02', '配仓', 'ALLOCATE'], ['03', '结算', 'SETTLE'],
  ['04', '复盘', 'REVIEW'], ['05', '研究', 'RESEARCH'], ['06', '回看', 'RECALL'],
  ['07', '校准', 'CALIBRATE'], ['08', '闭环', 'LOOP'],
]

// Content budgets exclude the short overview after each route change.
export const STEPS = {
  'new.quickInput': { act: 0, route: '/new', anchor: 'new.quickInput', action: 'new.ensureQuickInputParsed', duration: 5500, title: '一句话，写下判断', body: '先写下一个判断，一句话就够。球队、比分、赔率、信心、投入，自动归位。' },
  'new.scoreCloud': { act: 0, route: '/new', anchor: 'new.scoreCloud', prepare: 'new.ensureQuickInputParsed', duration: 4500, title: '判断被翻译成概率', body: '进球区间和浓度，生成一张比分概率云。胜平负分布来自你的判断。' },
  'new.teamRecords': { act: 0, route: '/new', anchor: 'new.teamRecords', prepare: 'new.ensureQuickInputParsed', action: 'new.showTeamRecords', duration: 5000, title: '让过去的复盘，接上这次判断', body: '输入标的，过往记录即刻调出。赛前判断、赛果与投后复盘备注放在一起，接着上一次的思路继续研判。' },
  'new.sizing': { act: 0, route: '/new', anchor: 'new.sizing', prepare: 'new.ensureQuickInputParsed', duration: 4000, title: '信心多大，仓位多大', body: '校准后的信心经分数凯利换算成建议投入，风控上限与可用资金共同约束仓位。' },
  'new.postImport': { act: 0, route: '/new', anchor: 'new.importReview', preAnchor: 'new.postImport', action: 'new.showPostImport', duration: 7500, title: '也可以，一键投后导入', body: '已有记录，两场比赛一起粘贴，自动填入同一组合。核对后再一键入档，投后导入，一气呵成。' },
  'new.importDetails': { act: 0, route: '/new', anchor: 'new.importDetails', prepare: 'new.ensurePostImport', duration: 3500, title: '往下看，记录已经归位', body: '往下核对已填入的比赛、投注项与赔率。策略、信心和备注也能继续调整，确认后再入档。' },
  'combo.candidates': { act: 1, route: '/combo', anchor: 'combo.candidates', duration: 2500, title: '把判断放在一起看', body: '今天的备选，各自带着角色：稳、中信、杠杆。' },
  'combo.generate': { act: 1, route: '/combo', anchor: 'combo.package', preAnchor: 'combo.generateBtn', action: 'combo.ensureGenerated', duration: 7000, title: '现在，一键求解', body: '在效用、覆盖和去重之间权衡，生成组合方案，再用蒙特卡洛模拟评估盈亏分布。' },
  'combo.heatmap': { act: 1, route: '/combo', anchor: 'combo.heatmap', prepare: 'combo.ensureGenerated', duration: 4000, title: '看清隐性关联', body: '热力图标出比赛之间的依赖风险。这是探索性的诊断指数，不代表真实概率。' },
  'combo.dependencyDetail': { act: 1, route: '/combo', anchor: 'combo.dependencyDetail', preAnchor: 'combo.dependencyCell', prepare: 'combo.ensureGenerated', action: 'combo.inspectDependency', duration: 5000, title: '点开一对比赛，看风险从哪来', body: '点开矩阵中的一对比赛：共振评分、样本与共同失败记录，都能展开查看。' },
  'combo.dependencyEvidence': { act: 1, route: '/combo', anchor: 'combo.dependencyEvidence', prepare: 'combo.inspectDependency', duration: 4500, title: '继续往下，看证据', body: '往下对照市场隐含值与历史共同失败率，再看 Premium 和 MSI 代理指数分摊。' },
  'combo.tolerance': { act: 1, route: '/combo', anchor: 'combo.tolerance', preAnchor: 'combo.portfolioExpand', prepare: 'combo.ensureGenerated', action: 'combo.showTolerance', duration: 5000, title: '风险，可以变成自己的约束', body: '展开组合包，容错矩阵回答：一场失利时，哪些比赛还能在其他组合里存活。' },
  'combo.customize': { act: 1, route: '/combo', anchor: 'combo.tolerance', prepare: 'combo.showTolerance', action: 'combo.customizeTolerance', duration: 6500, title: '亲手编辑依赖关系', body: '点格子要求降低依赖，也能撤销修改、放开约束。容错偏好可以交给求解器重新计算。' },
  'combo.customResult': { act: 1, route: '/combo', anchor: 'combo.customResult', preAnchor: 'combo.recompute', prepare: 'combo.prepareCustomTolerance', action: 'combo.recomputeTolerance', duration: 6000, title: '让求解器回应你的偏好', body: '放开一项约束后重新求解，定制组合包置顶。编辑、验证、重算，形成可交互的配仓过程。' },
  'settle.quick': { act: 2, route: '/settle', anchor: 'settle.quick', duration: 4500, title: '赛后，一句话结算', body: '比赛结束，一句话结算。结果回流，成为下一次校准的证据。' },
  'dashboard.overview': { act: 3, route: '/dashboard', anchor: 'dashboard.overview', duration: 4500, title: '先看全局，再看细节', body: 'Dashboard 把资金、收益和判断质量放在一起。先看全局，再沿着线索往下探索。' },
  'dashboard.trend': { act: 3, route: '/dashboard', anchor: 'dashboard.trend', duration: 4000, title: '沿着趋势往下看', body: '往下看判断质量的走势和逐笔变化，再对照资金曲线，让当期概览连上历史轨迹。' },
  'dashboard.advantage': { act: 3, route: '/dashboard', anchor: 'dashboard.advantage', duration: 3500, title: '从全局走到优势', body: '继续看优势领域，把表现拆到更具体的策略和比赛类型。' },
  'dashboard.analysis': { act: 3, route: '/dashboard/analysis', anchor: 'dashboard.analysis', prepare: 'dashboard.showStrategy', duration: 4500, title: '找到自己的优势领域', body: '深度分析从策略组合、联赛与信心区间中寻找优势，也把样本量与不确定性放在眼前。' },
  'dashboard.analysisLeagues': { act: 3, route: '/dashboard/analysis', anchor: 'dashboard.analysisLeagues', preAnchor: 'dashboard.analysisTab.league', action: 'dashboard.showLeagues', duration: 4000, title: '把优势放回具体联赛', body: '切到联赛表现，看收益、命中与样本量，找到优势成立的范围。' },
  'dashboard.analysisRecency': { act: 3, route: '/dashboard/analysis', anchor: 'dashboard.analysisRecency', preAnchor: 'dashboard.analysisTab.time', action: 'dashboard.showRecency', duration: 3500, title: '最近的判断，也有不同权重', body: '时间近因机制展示新旧样本如何参与判断，让表现变化有迹可循。' },
  'dashboard.metrics': { act: 3, route: '/dashboard/metrics', anchor: 'dashboard.metrics', duration: 4500, title: '指标，也能展开看', body: '数据总览把关键指标铺成卡片。点开任一张，继续看计算口径与背后的证据。' },
  'dashboard.metricsRisk': { act: 3, route: '/dashboard/metrics', anchor: 'dashboard.metricsRisk', duration: 3500, title: '收益之外，也看风险', body: '指标下面还有近期趋势和风险：回撤、波动与效率，放在一起读。' },
  'seasons.hero': { act: 3, route: '/dashboard/report', anchor: 'seasons.hero', duration: 4500, title: '每个周期，一份战报', body: '净值、命中和回撤，汇成一页。回看一个研究周期的全貌。（演示数据）' },
  'seasons.split': { act: 3, route: '/dashboard/report', anchor: 'seasons.split', duration: 4500, title: '看清结果来自哪里', body: '按联赛、注额、策略和周次拆开，看清结果来自哪里。' },
  'quants.studio': { act: 4, route: '/quants', anchor: 'quants.studio', preAnchor: 'quants.labTab', action: 'quants.showStudio', duration: 6000, title: '实验工作室，把直觉写成规则', body: '在实验工作室写下假设与失效条件，配置规则和评估范围。单次实验、参数比较与滚动验证，让每次尝试可以复查。' },
  'quants.library': { act: 4, route: '/quants', anchor: 'quants.library', preAnchor: 'quants.libraryTab', action: 'quants.showLibrary', duration: 5500, title: '策略库，保留每一次演进', body: '策略库按版本保存规则，连同实验输入、结果与研究结论一起归档。比较不同尝试，复现旧版本，再决定下一步。' },
  'quants.data': { act: 4, route: '/quants', anchor: 'quants.data', preAnchor: 'quants.dataTab', action: 'quants.showData', duration: 5500, title: '数据中心，让证据决定边界', body: '数据中心汇集赛果、历史报价与采集记录，检查覆盖和时间依据。先看数据能回答什么，再选择研究与回放方式。' },
  'history.records': { act: 5, route: '/history', anchor: 'history.records', duration: 3000, title: '每一次判断，都能回看', body: 'History 留下每次判断、结果与盈亏。筛选、展开，回到当时的记录。' },
  'history.teams': { act: 5, route: '/history/teams', anchor: 'history.teams', duration: 3500, title: '球队，也有自己的档案', body: '球队档案把分散的交手与判断记录聚在一起，方便逐场回看。' },
  'console.fit': { act: 6, route: '/params', anchor: 'console.fit', duration: 6100, title: 'Intuition, calibrated.', body: '系统一直在检验自己：赛前预期，对照赛后实际。追踪拟合、误差与稳定性。' },
  'console.scan': { act: 6, route: '/params', preAnchor: 'console.top', anchor: 'console.bottom', action: 'console.scanPage', duration: 6500, title: '从上到下，看完整个 Console', body: '从资金与风控，到模型校准、回溯与数据管理。沿着页面往下，快速看完 Console 的完整结构。' },
  'new.return': { act: 7, route: '/new', anchor: 'new.return', reset: true, duration: 2800, title: '回到判断，继续下一轮', body: '回到 New，把这次复盘与校准，带进下一次判断。每一轮，都从这里继续。' },
}
export const TRACKS = {
  full: Object.keys(STEPS),
  short: ['new.quickInput', 'new.scoreCloud', 'new.teamRecords', 'new.postImport', 'new.importDetails', 'combo.generate', 'combo.dependencyDetail', 'combo.dependencyEvidence', 'combo.tolerance', 'combo.customize', 'combo.customResult', 'dashboard.overview', 'dashboard.trend', 'seasons.hero', 'quants.studio', 'quants.library', 'quants.data', 'history.records', 'console.fit', 'console.scan', 'new.return'],
}
export const navAnchor = (route) => `nav.${route.startsWith('/dashboard') ? 'dashboard' : route.startsWith('/history') ? 'history' : route.slice(1)}`
export const stepOffset = (track, index) => TRACKS[track].slice(0, index).reduce((sum, id, i) => sum + STEPS[id].duration + (TRACKS[track][i + 1] && STEPS[id].route !== STEPS[TRACKS[track][i + 1]].route ? routeBudget(STEPS[TRACKS[track][i + 1]].route) : 0), 0)
export const trackDuration = (track) => TRACKS[track].reduce((sum, id, i, ids) => sum + STEPS[id].duration + (i && STEPS[ids[i - 1]].route !== STEPS[id].route ? routeBudget(STEPS[id].route) : 0), 0)
export const trackLabel = (track) => {
  const seconds = Math.round(trackDuration(track) / 10000) * 10
  return `约 ${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒`
}

// Seek lands at a chapter boundary and re-establishes its real UI state.
export function stepAtProgress(track, progress) {
  const ids = TRACKS[track]
  const elapsed = Math.max(0, Math.min(1, Number(progress) || 0)) * trackDuration(track)
  for (let i = ids.length - 1; i >= 0; i--) if (elapsed >= stepOffset(track, i)) return i
  return 0
}
