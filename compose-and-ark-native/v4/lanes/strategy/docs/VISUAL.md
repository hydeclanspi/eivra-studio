# 双尺寸对照记录 · 2026-11-18

基准是公开 `demo · preview`，不是 owner 的账本。实走 `/combo`：默认勾选 7/7，取消 AC 米兰后为 6/7，最少标的改 3；当次点击生成没有观察到新的结果。另行恢复公开快照，显示 20 方案，展开候选包、分层与腿明细。没有点「确认投资」或「采纳」。实走 `/quants`：规则与单次实验 → 参数、滚动与价格回放 → 影子观察；默认编辑器尚无已拉取的报价。改用手动赔率与联赛基准，在公开预览运行并冻结实验 v1，结果明确标了 6 场估计、2 万次条件模拟，未把预览实验当实绩。

| 视口 | Web 实测 | Android 实现（不是运行收据） |
|---|---|---|
| 390×844 | Portfolio 候选池、角色与生成控件；Quants 研究问题和规则编辑为纵向阅读。 | 手机「构建／方案与明细」「研究规则／实验结果」切换，各有自己的 LazyColumn，避免必须滚回顶部核对输入。 |
| 1280×800 横屏 | 相同公开 demo 和初始选择；Portfolio 路由是 **sand**，Quants 是 **moon**，不是全站固定材质。 | 宽度 ≥840dp 左 42% 为输入、右 58% 为结果，独立滚动；背景、外壳和系统栏归宿主。没有在 lane 覆盖全局主题。 |

`evidence/web-comparison.jpg` 是实际浏览器采集的诊断联系表。四个同源 iframe 的**内层 CSS viewport**经读取确认，尺寸、宿主缩放、DPR、原帧像素与 SHA-256 在 `evidence/web-geometry.json`。此 ArkWeb 的截图有局部重复拼片（平板尤其明显）；重复的侧栏/标题不是页面结构。**不能拿它做逐像素金图**。原样帧归档于挂载 `docs/evidence/web-raw/`，不把大图塞进 APK。

**Native 证据尚缺。** 本地没有 adb / emulator / JDK；feature 分支的 Android v2 CI 明确跳过模拟器，只编译 instrumented APK。没有用 HTML、预览图、v1 或其他组截图冒充。`bash lanes/strategy/docs/connected-check.sh` 在独占模拟器（`ANDROID_SERIAL=emulator-…`）分别设置 390×844px / 1280×800px @160dpi；记录 font scale、insets、设备指纹、JUnit 与 5 张当前 Compose PNG。用的是同一份合成原引擎输出，两端可比，但并非 Web 7 场 demo 的相同数据。集成后还须在真实 platform 的**公开 demo 仓**重新取得同状态截图、冷启动/滚动帧时及实际 New 读回；这三项未验收。不要使用已有 owner 工作区做截图。
