# Eivra Studio · 版本演进

Intuition, calibrated.

本页按产品变化整理近期历史，并链接到实际提交和验证记录。日期代表实现批次，未另行发行语义版本号；已发布的提交与历史审计保留原貌。

## 2026-10-27 · 从当前页面开始讲解

顶栏与手机悬浮导览入口按当前页面选择起点，再沿原时间轨继续。手机速览未覆盖的页面使用完整轨中的对应片段，保持页面与讲解一致；明确的「从头开始」和「重播」仍从开头播放。

深度分析的 TOP 数量左侧新增「仅为数据模拟，无足够样本」，复用顶部 preview 绿色胶囊。标识限于演示数据，桌面和手机布局均保留提示在 TOP 左侧。

提交：[827711a](https://github.com/hydeclanspi/eivra-studio/commit/827711a5dd4710828affb4fee3d5b837f3d556f0)。验证：[当前页导览与模拟标识](audits/2026-10-27-page-tour-entry.md)。

## 2026-10-27 · 从页面就绪，到研究工作区

首页欢迎窗以实际可读状态为起点：等待文档、字体、图片解码和完整校准，再给出 3.75 秒阅读时间。新资源、布局变化、后台隐藏或明显卡顿会重启计时。持续装饰动画和屏外懒加载不阻塞开场。

Quants 在 Dashboard 与 History 之间依次介绍实验工作室、策略库和数据中心，切换真实标签，字幕缩小一级。Seasons 使用「(S3) 26-27 欧冠淘汰赛阶段」；历史页用 Live 材质的「beta 测试数据」胶囊明确样例身份。

提交：[3576343](https://github.com/hydeclanspi/eivra-studio/commit/35763438ab5317ce86b8d725e89479c514ff843e)。验证：[本轮记录](audits/2026-10-27-demo-readiness-workspaces.md)。同步整理 README、文档导航、历史提交索引和维护规则。

## 2026-10-26 · 让样例账本遵循真实计算

演示亏损以几十元为主、少量超过百元；盈利保留大小不同的结果。胜单返还由本金与总赔率计算，分腿赔率、账本盈亏和周期结算保持一致。比赛、赛果与待结算样例保留。

导览形成 Dashboard → Quants → History → Console → New 的收束顺序，结尾回到下一次判断。

提交：[855995c](https://github.com/hydeclanspi/eivra-studio/commit/855995c)。验证：[研究导览与样例账本](audits/2026-10-26-research-tour-demo-ledger.md)。

## 2026-10-25 · 导览成为可以回看的实际操作

从依赖热力图继续进入单元格详情、证据与容错矩阵，演示编辑、撤销、释放约束和重新求解。进度条支持向前跳转与向后回看，框选随实际滚动和布局更新。Dashboard 向下展示趋势、优势与风险；Console 扫过完整页面。

比分概率云接上球队过往复盘；投后导入按一张两场组合解析，并下翻核对字段。开场重做为鲸鱼、闭环节点与能力预览，每次进入 Demo 首页都能重新触发。

| 提交 | 主要变化 |
| --- | --- |
| [0987bcb](https://github.com/hydeclanspi/eivra-studio/commit/0987bcb) | 依赖风险细节、Dashboard 深入与可拖动时间轨 |
| [9c74db2](https://github.com/hydeclanspi/eivra-studio/commit/9c74db2) | 过往复盘备注、已导入字段与继续下翻 |
| [53d1b86](https://github.com/hydeclanspi/eivra-studio/commit/53d1b86) | 开场重设计、每次首页触发与两场组合还原 |

验证：[深入演示与回拖](audits/2026-10-25-demo-tour-deep-dive.md) · [欢迎窗与投后导入](audits/2026-10-25-demo-welcome-polish.md)。

## 2026-10-24 · 红果的颜色，克制的层次

以薄荷绿和杏橙交融保留红果的辨识度，通过柔和明度、细腻表面和低对比轮廓减少厚重边缘。同期调整鲸鱼主讲节奏和历史匹配行为。

提交：[ab60c27](https://github.com/hydeclanspi/eivra-studio/commit/ab60c27) → [e9d1df4](https://github.com/hydeclanspi/eivra-studio/commit/e9d1df4)；导览修订 [9b9094b](https://github.com/hydeclanspi/eivra-studio/commit/9b9094b)。设计：[红果主题记录](design/hongguo-theme-2026-10-24.md)。

## 2026-10-23 · 一条连续的产品导览

建立持续驻场的主讲窗、真实解析与组合计算、跨页讲解、暂停接管和临时状态清理。公开演示的操作与真实账本隔离。

提交：[6007caf](https://github.com/hydeclanspi/eivra-studio/commit/6007caf)；示例文案 [ac13c44](https://github.com/hydeclanspi/eivra-studio/commit/ac13c44)。验证：[首版记录](audits/2026-10-23-demo-tour.md)。

## 2026-10-21 · 研究以版本和证据组织

Quant 形成研究台、实验工作台、策略库、影子观察与数据中心。冻结策略与实验输入，区分历史规律、条件推演、历史价格回放和前向观察；研究结果保留适用范围与证据边界。

提交：[90cd224](https://github.com/hydeclanspi/eivra-studio/commit/90cd224)、[608e2e9](https://github.com/hydeclanspi/eivra-studio/commit/608e2e9)、[d4a5e13](https://github.com/hydeclanspi/eivra-studio/commit/d4a5e13)、[aedc165](https://github.com/hydeclanspi/eivra-studio/commit/aedc165)、[b15c42d](https://github.com/hydeclanspi/eivra-studio/commit/b15c42d)。说明：[策略研究工作区](quant-research-workspace.md)。

## 维护约定

1. 一个提交表达一个可审查的改动主题；标题使用 `feat(scope): …`、`fix(scope): …` 或 `docs: …`，正文说明行为、原因与验证。功能实现与仓库资料整理分别提交。
2. 根 README 描述当前产品；维护文档解释当前行为；审计记录保留当时结果。发布说明归纳演进，并链接实际提交，不将旧验证写成新验证。
3. 在 `codex/` 分支完成实现与本地 lint、test、build，检查 diff 后快进合入 `main`，同时推送功能分支与 `main`；再按提交核验 CI 和 Vercel。
4. 本地测试、浏览器检查、远端 CI 与生产部署分别记录。已有 warnings、未覆盖的设备与未执行的检查明确保留。
5. 不通过重写已发布历史来统一标题；保留 `data` 分支、历史兼容入口与冻结归档。资料索引按产品主题组织同步记录与功能记录，避免混淆数据快照和产品版本。
