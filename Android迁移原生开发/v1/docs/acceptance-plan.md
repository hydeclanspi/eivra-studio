# Eivra Studio · Android 原生迁移与验收计划

基线：github.com/hydeclanspi/eivra-studio main（拉取日 2026-11-09，线上 931 commits）。
产品：Kotlin + Jetpack Compose 原生 UI，手机／平板自适应；无 WebView 页面承载。计算沿用原 JS 业务内核的独立适配，不通过网站渲染。

## 验收闸门

| 闸门 | 范围 | 必须交出的证据 | 未通过时的口径 |
|---|---|---|---|
| G0 可复现构建 | 完整源码、依赖锁定、独立 JDK／SDK 构建 | CI／本机构建日志；APK 包名、签名、哈希 | 只有源码，不称可安装 |
| G1 原生骨架 | MainActivity、Compose 导航、状态保存、后台计算 | APK；无 WebView 静态检查；启动／旋转／后台恢复测试 | 不称原生迁移完成 |
| G2 核心闭环 | New → Portfolio → Settle → Dashboard → History | 新建、编辑、保存、结算、撤销、持久化、重启恢复；数据导入／导出 | 不开放真实工作区承诺 |
| G3 全工作区 | Analysis、Metrics、Seasons、Teams、Quants、Console | 逐路由功能清单；每页 loading／empty／error／populated | 不称全功能完成 |
| G4 计算一致 | analytics、Kelly、原子头寸、Monte Carlo、时间契约、Quant | 原 Vitest 基线；跨端 golden cases；边界／重复结算／信息泄漏测试 | 不一致则阻断发布 |
| G5 视觉复刻 | Inspiration 主题、字体、颜色、间距、圆角、玻璃、图表 | 手机／平板逐页原站与 App 截图；样式 token 对照；视觉 diff | 不称像素级复刻 |
| G6 自适应与可用性 | 竖屏手机、横屏手机、平板／桌面窗口、分屏 | 导航、触控目标、键盘、系统返回、无横向溢出、屏幕阅读器 | 不只按设备名适配 |
| G7 性能与稳定 | 冷启动、切页、滚动、重计算、后台恢复、低端降级 | Android Profiler／宏基准；帧时 P50/P95/P99；内存、崩溃与 ANR | 不用代码推断流畅 |
| G8 发布候选 | 数据迁移、备份恢复、安全、安装升级、回归 | 签名校验；干净安装／覆盖安装；真机验收报告；已知限制 | 未验收项显式列出 |

## 数据与安全

- 演示区与主人工作区隔离，不用公开 preview 遮罩代替 Android 的访问控制。
- 支持原网页导出 bundle 的校验、预览、备份、合并／替换；默认本地持久化。
- Supabase、加密 Git 快照、服务端 AI 录入要单独接入与测试，未配置就不显示为可用。
- 不把 commit 数、测试数、CI 绿牌或界面复刻写成模型预测能力／收益证明。

## 实施顺序

1. 固化网页各路由、主题和模型输入输出基准；建立 golden cases。
2. 原生项目与 CI 可复现构建；先打通 New → Portfolio → Settle → Dashboard → History。
3. 拆数据、计算、界面三层；避免复制页面里的第二套指标。
4. 补齐 Analysis／Metrics／Seasons／Teams／Quants／Console。
5. 手机与平板分别排版；按原站 token 实现主题，而非 Material 默认皮肤。
6. 全部自动化测试后做真机安装、触控、性能与视觉验收。

## 阶段状态

- 原仓库与线上产品已拉取、路由与技术栈已核对。
- 迁移账本与构建结构已建立。
- 构建工具链、原生界面、模型适配、测试、APK、真机验收：按本文件后续收据更新；未交付前均不标完成。
