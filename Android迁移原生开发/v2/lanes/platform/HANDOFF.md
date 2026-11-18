# Android v2 / platform · 2026-11-18

**交接状态：共享接口已推送，可以接入；不是整机验收。** 分支 `android-v2/platform`，共同基线 `2e6ee10ae6d0bd49bc3749ba974a6dcb308cae88`，预期 PR base 为 `android-native`，未自行合并。所有改动都在 `Android迁移原生开发/v2/lanes/platform/`。挂载目录同名镜像，先落挂载后同步。

## 接口与写入边界

入口 `openPorts(context)`、`PlatformScreen(env)`；[逐项契约、参数和返回示例](docs/PORTS.md)。Ledger 走 `workspace.snapshot → naturalInputParser.parseNaturalInput → forecast.buildDraft → workspace.saveInvestment → workspace.settleInvestment(id,form)`。投后是独立的 `workspace.importInvestment`，没有预测字段时绝不以事后模型补齐。Portfolio 的 `draft.put` 只交一份可编辑草稿，`draft.get` 才是 New 的输入；记录数、待结算数都不增加。Insights 和策略的只读接口不提交工作区。

计算用 APK 随附的 QuickJS；不是 WebView，也没有另一套概率公式。锁定源文件 SHA，从原 New/Settle/Combo 页提取业务函数，直接链接现有 Web lib。New 的 `detail:'lite'`、availableCash、模式 Kelly 分母、原快照、逐腿 outcome 可知时间都在；没有沿用 v1 近似调用参数。解析结果保留原结构和诊断，不自动确认 Conf。v1 只读复用离线平台 shims；构建排除 genesis、实际 Git 与 Supabase 后端。

Kotlin 在后台操作。每一笔持久写入在进程内唯一 writer 的锁下读最新账本，计算在独立的临时 JS realm 中进行，序列化成功才 `fsync` 临时文件并在同目录 atomic move，再发布 StateFlow。账本、草稿和幂等回执同一提交；demo/owner 各自一个文件。原文件损坏时抛错，不回退成空仓。Console 有五个常用参数输入、真实历史评分曲线、切仓、本地文件选择器、备份、导入预检与确认恢复；旧预检不能覆盖较新的 revision。

## 提交与真实证据

| 提交 | 内容 / 验证 |
|---|---|
| `df4f17f` | 第一批读写、预测冻结、草稿和逐腿结算，先于其他 UI 发布。[首次构建通过](https://github.com/hydeclanspi/eivra-studio/actions/runs/44393372341) |
| `40bf285` | 加入 V8 Web oracle 和 JNI / 磁盘测试；首次暴露 test compile 的 JSONObject API 不兼容。 |
| `25e2550` | Portfolio / Quant / WarReport / Insights 读取、参数写入；Linux JNI loader 依赖缺失，未把这次失败计为业务通过。 |
| `511c9a0` | 原生 Console、文件预检与恢复、隔离的宿主 JNI 测试运行器。[Actions 44397091946](https://github.com/hydeclanspi/eivra-studio/actions/runs/44397091946) 通过；已核对产物内 JUnit XML，平台 4/4 + 宿主 3/3，0 skipped。 |

复现（v2 根目录）：`bash lanes/platform/prepare.sh`，`bash gradlew :app:testDebugUnitTest :app:assembleDebug :app:assembleDebugAndroidTest`。构建输入：完整仓库（含 Web 与只读 v1）、Node/npm、JDK 17、Android SDK。测试用 `quickjs-jvm:0.9.2`，校验 SHA；Ubuntu 24.04 需要的 libc++ 仅解包到 lane 的 `.cache/`。这些构建/测试工具不进 APK；产品无联网同步入口。

- 同一文本「利兹联 win 拜仁 2.4 30块」，同一个合成工作区：初始 700、在途 101、可用 599。在测试中明确确认 Conf，再对比 Web/V8 和 QuickJS 的原 parser 结果、所有概率状态、每腿输入、校准 metadata、时间与金额。单场 2 states，Expected Rating `0.5600655281881419`、建议 `33`；两场 3 states，`0.5974145306781871`、建议 `8`。数值容差 1e-10，键、数组和时间不忽略。不是模型预测准确率的证明。
- 生产 `LocalPorts` + 临时真实文件 + 新 JNI realm：并发 5 次保存同一 ID 得同一回执；两笔不同 ID 都存在。只结算第一笔，其两腿一中一未中、回款 0、profit -30，冻结快照不变；另一笔逐字段不变且仍 pending。重新构造 ports 后读回。投后 null Conf 不补预测，备份恢复后亦然。损坏 JSON、重复 ID、坏校验值、跨仓及过期预检被拒；拒绝的导入逐字节未改旧文件。
- [证据与截图口径](docs/evidence/README.md)。公开 demo 的 96 笔 bundle 在本地 V8 预检通过；两场合成候选产生 1 个方案并运行原 50,000 次模拟。未触碰个人账本、真实账户或云端配置。

## 尚未验收 / 已知边界

1. 分支 CI 只构建 instrumented APK；基线 workflow 只在集成分支启动模拟器。本地无 adb，没有手机/平板原生截图、整机 force-stop 重启、实际系统文件选择器、IME、泄漏/掉电或真机帧时证据。磁盘读回测试不是伪造的设备回放。待多 lane 集成后跑完整 Strategy→New→Settle→History。
2. 96 笔 demo 的完整 Portfolio 生成与复盘组合探针在本地 jitless Node 的 120 秒预算内没有完成；未定位到某个函数，不据此报 Android 毫秒数。小样本结果不外推为整仓性能。当前未用不同公式或降级结果掩盖这点。
3. Console 不是 Web 全页复刻：未移植完整拟合解释矩阵、主题、Logo gallery、远端历史。Quant 暴露离线读/模拟，不包含行情抓取、云端研究采集或完整研究库的写入/恢复。外部文件只接受本版本能保真的 bundle。备份为明文，校验不是加密。无多进程 writer 或断电级承诺。
