# Portfolio 与 Quants · Android v2 交接

**交付范围：可集成的 Compose 工作区，不是已验收的整机版本。** 分支 `android-v2/strategy`；集成目标 `android-native`；公共起点 `2e6ee10ae6d0bd49bc3749ba974a6dcb308cae88`。功能及设备测试源码提交 [68e3c0f](https://github.com/hydeclanspi/eivra-studio/commit/68e3c0f97bc7d9f68c1ffec5efa447b8babf1e5c)，本说明单独提交。只改 `Android迁移原生开发/v2/lanes/strategy/`，先落同名挂载，再按 expected HEAD 小步提交；无 merge、无强推。

## 第一条验收链

`StrategyScreen(StudioEnv)` → Portfolio → 以稳定 key 勾选候选 → 调整腿数、风险、覆盖/胜率/相关性门槛与求解设置 → 后台取得排序 → 按层筛选 → 展开一张方案 → 查看每场的每个 Entry → **送往 New · 仅建草稿**。

交接由 `canonicalDraft / putPlan` 完成。保留原顺序、来源身份、嵌套 Entry 元数据、备注与 null；选中的是一张方案，不是整个组合包。只带建议分配，不填实际投入，Conf 仍需复核。只调用 `draft.put([draft])`，仅在返回非空字符串 ID 后 `env.go(Dest(Route.New,id))`；不保存投资、不改变研究候选的采纳状态。缺腿、来源/Entry 不一致、过期工作区、坏回执均不导航。原求解器对 `minLegs` 有 graceful fallback，本组把用户明示的最低腿数当硬约束，不拿较短方案充数。

`LatestRead` 在后台 dispatcher 读与解析，大输入不进 savedInstanceState。改参即失效，随后防抖重算；区分未选择、正在算、缺样本、约束无解、接口错误和有效方案。取消不等于底层 JS 立即停止；迟到的成功或错误都无权更新新结果。没有把这条机制写成帧率承诺。

## 研究范围

规则编辑包括研究假设/失效条件、球队/场地、比分/胜平负、手动赔率/单位。支持固定价历史情景、条件模拟及估计腿、单次时序留后与滚动训练/后窗。影子观察按冻结版本看计划、纸面决策、接受/拒绝原因和届时可知的指标。明示点击才请求保存实验、冻结计划或运行跟踪，不自动写研究记录。读写走 StudioPorts；没有 WebView、第二个账本或 Kotlin 概率公式。

## 证据与复现

| 验证层 | 实际结果 |
|---|---|
| 公开 Web | 实走 Inspiration 两页。Portfolio 7→6 场、最小标的改 3；当次生成未观察到新结果，另由已存公开快照展开 20 张方案检查腿。Quants 将赔率切到手动、概率切到联赛基准，在公开预览中运行并冻结 v1；6 场均标为估计、2 万次条件推演，非真实历史结果。没有采纳投资。 |
| 原引擎合成回归 | `test/web-parity.mjs` 对上游 `generateRecommendations`、`runPortfolioMonteCarlo`、atomic-v2 和 quant 原模块作断言。1 张方案、2 腿、每腿 2 Entry、等效赔率 4.93、50,000 次 MC；严格门槛无解。24 场合成赛果分 16/8，滚动 5 窗、后窗 17 场；6 场模拟均为估计，空前向样本 ROI=null。不是策略收益。 |
| Android JVM + 构建 | [084a63c / run 44398819776](https://github.com/hydeclanspi/eivra-studio/actions/runs/44398819776)：`:app:testDebugUnitTest :app:assembleDebug :app:assembleDebugAndroidTest` 成功。实际解包复核 JUnit XML：本组 7 个组合/异步用例 + 5 个研究/跨端用例，12/12、0 跳过。原报告在 `docs/evidence/084a63c-*.xml`。[68e3c0f 对应 run](https://github.com/hydeclanspi/eivra-studio/actions/runs/44400482400) 同样成功：JVM 测试、debug APK 与新增的设备测试 APK 均编译通过；模拟器步骤为 skipped。中间的 [2dfb7e5 run](https://github.com/hydeclanspi/eivra-studio/actions/runs/44396639636) 因 Gradle 拉取 Kotlin BOM 失败，未算通过。 |
| 原生设备 | **未执行**。feature CI 的 emulator 步骤只在 `android-native` 运行；本地无 adb/emulator/JDK。`androidTest/StrategyFlowTest.kt`＋`docs/connected-check.sh` 已备；设备日志、原生截图、实测帧时目前没有。Web 原帧、DPR/视口、抓图拼片缺陷见 [双尺寸记录](docs/VISUAL.md)，不是 native 证据。 |

从仓库根、独立构建目录复现 JS（Python 3 / Node，测试工具 rollup@2.79.2）：

```sh
ROOT="$PWD"; L="$ROOT/Android迁移原生开发/v2/lanes/strategy"; BUILD=$(mktemp -d)
npm install --prefix "$BUILD" --ignore-scripts rollup@2.79.2
python3 "$L/kernel/prepare_core.py" "$ROOT/eivra-studio/src/pages/ComboPage.jsx" "$BUILD/core.mjs"
NODE_PATH="$BUILD/node_modules" node "$L/test/bundle-parity.cjs" "$ROOT" "$BUILD/core.mjs" "$BUILD/parity.cjs"
node "$BUILD/parity.cjs"
```

Android：从 v2 运行 `bash gradlew :app:testDebugUnitTest :app:assembleDebug :app:assembleDebugAndroidTest`。设备检查从 v2 运行 `ANDROID_SERIAL=emulator-5554 bash lanes/strategy/docs/connected-check.sh`（使用实际的独占模拟器序号）。测试 fixture 只在 `testAssets/`，生产无候选数据时不会加载它。

## 集成时不要略过的三件事

1. **platform 与 ledger 是运行依赖，不在本分支合并。** 挂载 `platform/kernel/reviews.js` 已见 portfolio 两个 read 及多项 quant reads，ledger 的 draft.get 约定亦已对过。以 platform 注册的实现为准，不要再装第二个 JS 执行器。研究窗口与持久写扩展的原函数、输入/输出和实例见 [PORTS](docs/PORTS.md)；未获允许的调用须报错，不能返回空表或假成功。研究 store、forward store、证据需在独立实例正确恢复，不能仅导出投资 bundle。
2. 合入顺序由集成负责人决定。合入 platform、ledger 和本组后，在干净 demo 上验证 `draft.put → draft.get → New`：两场、四个 Entry 全在，草稿 ID 一致，pending 数不变，实际金额未填、Conf 未替人确认。再用新实例复查研究与纸面观察的持久性。这里的 Kotlin 契约测试不能代替这一步。
3. 视觉/性能仍待验：手机与平板同状态逐屏对照、系统栏/IME/旋转、快速改参时滑动帧时。尚未复刻 Web 的多方案联合包编辑、依赖热力图、真实历史报价回放与全部研究库操作；本交付优先保证单方案及研究证据链。无发布或实盘结论。
