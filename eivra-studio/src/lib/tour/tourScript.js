export const TOUR_VERSION = 1
export const DEMO_SENTENCE = '阿森纳2-0利物浦 odds 3.9 conf 0.71 140块'

export const ACTS = [
  ['01', '判断', 'JUDGE'], ['02', '配仓', 'ALLOCATE'], ['03', '结算', 'SETTLE'],
  ['04', '复盘', 'REVIEW'], ['05', '校准', 'CALIBRATE'], ['06', '研究', 'RESEARCH'],
]

// Duration includes preparation, speech and actions; route transitions add 950ms.
export const STEPS = {
  'new.quickInput': { act: 0, route: '/new', anchor: 'new.quickInput', action: 'new.ensureQuickInputParsed', duration: 5500, title: '一句话，写下判断', body: '先写下一个判断，一句话就够。球队、比分、赔率、信心、投入，自动归位。' },
  'new.scoreCloud': { act: 0, route: '/new', anchor: 'new.scoreCloud', prepare: 'new.ensureQuickInputParsed', duration: 4500, title: '判断被翻译成概率', body: '进球区间和浓度，生成一张比分概率云。胜平负分布来自你的判断。' },
  'new.sizing': { act: 0, route: '/new', anchor: 'new.sizing', prepare: 'new.ensureQuickInputParsed', duration: 4000, title: '信心多大，仓位多大', body: '校准后的信心经分数凯利换算成建议投入，风控上限与可用资金共同约束仓位。' },
  'combo.candidates': { act: 1, route: '/combo', anchor: 'combo.candidates', duration: 2500, title: '把判断放在一起看', body: '今天的备选，各自带着角色：稳、中信、杠杆。' },
  'combo.generate': { act: 1, route: '/combo', anchor: 'combo.package', preAnchor: 'combo.generateBtn', action: 'combo.ensureGenerated', duration: 7000, title: '现在，一键求解', body: '在效用、覆盖和去重之间权衡，生成组合方案，再用蒙特卡洛模拟评估盈亏分布。' },
  'combo.heatmap': { act: 1, route: '/combo', anchor: 'combo.heatmap', prepare: 'combo.ensureGenerated', duration: 4000, title: '看清隐性关联', body: '热力图标出比赛之间的依赖风险。这是探索性的诊断指数，不代表真实概率。' },
  'settle.quick': { act: 2, route: '/settle', anchor: 'settle.quick', duration: 4500, title: '赛后，一句话结算', body: '比赛结束，一句话结算。结果回流，成为下一次校准的证据。' },
  'seasons.hero': { act: 3, route: '/dashboard/report', anchor: 'seasons.hero', duration: 4500, title: '每个周期，一份战报', body: '净值、命中和回撤，汇成一页。回看一个研究周期的全貌。（演示数据）' },
  'seasons.split': { act: 3, route: '/dashboard/report', anchor: 'seasons.split', duration: 4500, title: '看清结果来自哪里', body: '按联赛、注额、策略和周次拆开，看清结果来自哪里。' },
  'console.fit': { act: 4, route: '/params', anchor: 'console.fit', duration: 6100, title: 'Intuition, calibrated.', body: '系统一直在检验自己：赛前预期，对照赛后实际。追踪拟合、误差与稳定性。' },
  'quants.workspaces': { act: 5, route: '/quants', anchor: 'quants.workspaces', duration: 5100, title: '还有一件事。', body: '还有一件事。Quants 把直觉写成规则，冻结版本，做回放和影子观察。' },
}
export const TRACKS = {
  full: Object.keys(STEPS),
  short: ['new.quickInput', 'new.scoreCloud', 'combo.generate', 'seasons.hero', 'console.fit'],
}
export const navAnchor = (route) => `nav.${route.startsWith('/dashboard') ? 'dashboard' : route.slice(1)}`
export const trackDuration = (track) => TRACKS[track].reduce((sum, id, i, ids) => sum + STEPS[id].duration + (i && STEPS[ids[i - 1]].route !== STEPS[id].route ? 950 : 0), 0)
