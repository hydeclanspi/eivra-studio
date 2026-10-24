export const TOUR_VERSION = 2
export const ENTRY_DELAY_MS = 8500
export const PAGE_OVERVIEW_MS = 5000
export const ROUTE_LEAD_MS = 420
export const ROUTE_BUDGET_MS = ROUTE_LEAD_MS + PAGE_OVERVIEW_MS
export const DEMO_SENTENCE = '阿森纳2-0利物浦 odds 3.9 conf 0.71 140块'

export const ACTS = [
  ['01', '判断', 'JUDGE'], ['02', '配仓', 'ALLOCATE'], ['03', '结算', 'SETTLE'],
  ['04', '复盘', 'REVIEW'], ['05', '校准', 'CALIBRATE'], ['06', '研究', 'RESEARCH'],
]

// Content budgets exclude the five-second overview after each route change.
export const STEPS = {
  'new.quickInput': { act: 0, route: '/new', anchor: 'new.quickInput', action: 'new.ensureQuickInputParsed', duration: 5500, title: '一句话，写下判断', body: '先写下一个判断，一句话就够。球队、比分、赔率、信心、投入，自动归位。' },
  'new.scoreCloud': { act: 0, route: '/new', anchor: 'new.scoreCloud', prepare: 'new.ensureQuickInputParsed', duration: 4500, title: '判断被翻译成概率', body: '进球区间和浓度，生成一张比分概率云。胜平负分布来自你的判断。' },
  'new.sizing': { act: 0, route: '/new', anchor: 'new.sizing', prepare: 'new.ensureQuickInputParsed', duration: 4000, title: '信心多大，仓位多大', body: '校准后的信心经分数凯利换算成建议投入，风控上限与可用资金共同约束仓位。' },
  'new.postImport': { act: 0, route: '/new', anchor: 'new.quickInput', preAnchor: 'new.postImport', action: 'new.showPostImport', duration: 5000, title: '也可以，一键投后导入', body: '已有的记录，也可以一键投后导入。粘贴文本、批量解析，核对后再入档。' },
  'combo.candidates': { act: 1, route: '/combo', anchor: 'combo.candidates', duration: 2500, title: '把判断放在一起看', body: '今天的备选，各自带着角色：稳、中信、杠杆。' },
  'combo.generate': { act: 1, route: '/combo', anchor: 'combo.package', preAnchor: 'combo.generateBtn', action: 'combo.ensureGenerated', duration: 7000, title: '现在，一键求解', body: '在效用、覆盖和去重之间权衡，生成组合方案，再用蒙特卡洛模拟评估盈亏分布。' },
  'combo.heatmap': { act: 1, route: '/combo', anchor: 'combo.heatmap', prepare: 'combo.ensureGenerated', duration: 4000, title: '看清隐性关联', body: '热力图标出比赛之间的依赖风险。这是探索性的诊断指数，不代表真实概率。' },
  'settle.quick': { act: 2, route: '/settle', anchor: 'settle.quick', duration: 4500, title: '赛后，一句话结算', body: '比赛结束，一句话结算。结果回流，成为下一次校准的证据。' },
  'dashboard.overview': { act: 3, route: '/dashboard', anchor: 'dashboard.overview', duration: 4500, title: '先看全局，再看细节', body: 'Dashboard 把资金、收益和判断质量放在一起。先看全局，再沿着线索往下探索。' },
  'dashboard.analysis': { act: 3, route: '/dashboard/analysis', anchor: 'dashboard.analysis', duration: 4500, title: '找到自己的优势领域', body: '深度分析从策略组合、联赛与信心区间中寻找优势，也把样本量与不确定性放在眼前。' },
  'dashboard.metrics': { act: 3, route: '/dashboard/metrics', anchor: 'dashboard.metrics', duration: 4500, title: '指标，也能展开看', body: '数据总览把关键指标铺成卡片。点开任一张，继续看计算口径与背后的证据。' },
  'seasons.hero': { act: 3, route: '/dashboard/report', anchor: 'seasons.hero', duration: 4500, title: '每个周期，一份战报', body: '净值、命中和回撤，汇成一页。回看一个研究周期的全貌。（演示数据）' },
  'seasons.split': { act: 3, route: '/dashboard/report', anchor: 'seasons.split', duration: 4500, title: '看清结果来自哪里', body: '按联赛、注额、策略和周次拆开，看清结果来自哪里。' },
  'history.records': { act: 3, route: '/history', anchor: 'history.records', duration: 3000, title: '每一次判断，都能回看', body: 'History 留下每次判断、结果与盈亏。筛选、展开，回到当时的记录。' },
  'history.teams': { act: 3, route: '/history/teams', anchor: 'history.teams', duration: 3500, title: '球队，也有自己的档案', body: '球队档案把分散的交手与判断记录聚在一起，方便逐场回看。' },
  'console.fit': { act: 4, route: '/params', anchor: 'console.fit', duration: 6100, title: 'Intuition, calibrated.', body: '系统一直在检验自己：赛前预期，对照赛后实际。追踪拟合、误差与稳定性。' },
  'quants.workspaces': { act: 5, route: '/quants', anchor: 'quants.workspaces', duration: 5100, title: '还有一件事。', body: '还有一件事。Quants 把直觉写成规则，冻结版本，做回放和影子观察。' },
}
export const TRACKS = {
  full: Object.keys(STEPS),
  short: ['new.quickInput', 'new.scoreCloud', 'new.postImport', 'combo.generate', 'dashboard.overview', 'seasons.hero', 'history.records', 'console.fit'],
}
export const navAnchor = (route) => `nav.${route.startsWith('/dashboard') ? 'dashboard' : route.startsWith('/history') ? 'history' : route.slice(1)}`
export const stepOffset = (track, index) => TRACKS[track].slice(0, index).reduce((sum, id, i) => sum + STEPS[id].duration + (TRACKS[track][i + 1] && STEPS[id].route !== STEPS[TRACKS[track][i + 1]].route ? ROUTE_BUDGET_MS : 0), 0)
export const trackDuration = (track) => TRACKS[track].reduce((sum, id, i, ids) => sum + STEPS[id].duration + (i && STEPS[ids[i - 1]].route !== STEPS[id].route ? ROUTE_BUDGET_MS : 0), 0)
export const trackLabel = (track) => {
  const seconds = Math.round(trackDuration(track) / 10000) * 10
  return `约 ${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒`
}
