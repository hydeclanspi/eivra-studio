# Insights / 只读复盘工作区

**状态：原生实现已落挂载并本地提交，Web 源函数对账通过；未推远端、未编译 Android、未完成设备验收。**

分支 `android-v2/insights`；共同父提交 `2e6ee10ae6d0bd49bc3749ba974a6dcb308cae88`，预期集成目标 `android-native`，未发 PR 或合并。只改 `Android迁移原生开发/v2/lanes/insights/`。本地提交顺序：`58654b3`（契约、原始记录解码）→ `cd01355`（六页原生读端、交互与版本隔离）→ **`2c827e39c060559c6152bffa0535509d6c12900e`**（冻结概率、只读降级、测试与实测结果）。最后一笔只添加本交接文档；含交接的精确 HEAD 见交付包 `manifest.json`，避免自引用 SHA。

## 从哪里复盘

从 Dashboard 点「最近结算」或近期投资可直接打开原票；「查看历史」进入 Records。普通结果按登记时间倒排；完整 ID 在当前模式全库查找，不受时间窗、状态筛选或近期列表限制。`0007` 与 `7` 是不同记录。已归档可检索；demo 种子仅在**仍待结算**时隐藏（避免上游保留旧种子标记而遮住刚结算的记录）。ID 缺失、重复和找不到，不跳到“最相似”的一笔。

详情按腿列出 Entries 与赔率、Conf、备注，和真实比分、逐腿对错、AJR、赛后备注；手机上下读，宽屏左右对照。主客顺序不翻转，球队按钮可下钻并返回原票。没有比分不从预测猜，没有明确布尔结果不从整票猜。Expected Rating 与冻结快照里的 ticket_hit_probability 分列；历史记录不补造快照。

Dashboard 内：Overview、Analysis、Metrics、Seasons；History 内：Records、Teams。列表用带稳定 key 的 LazyColumn。Analysis 按持仓结构、模式、Conf、Entry 切片；Metrics 区分已判定腿的命中率、冻结概率可靠性、滚动误差与判断尺度；Seasons 用实际资金周期，不按自然年分组。曲线可点选、前后逐点、无障碍读值；与原票关联的点可直接下钻。

## 数据与依赖

生产只调用 StudioPorts 的固定 read 操作。`Archive` 读取原账本快照，`ReviewReader` 将原快照投影为界面模型。每次 mode/revision/前台恢复或本地日期改变都换 reader；日期、搜索、细分与周期参与请求身份，新请求不借用旧结果；读后复查版本并保留协程取消。端口读取、JSON 解码和投影离开 UI 线程。没有共享写入、隐式网络、第二份账本或生产 fixture。

**依赖 platform 注册** `workspace.snapshot`、四个 `analytics.get*Snapshot`、两个 `warReport.*`、`insights.getProbabilityReview`。最后一项的纯函数已随 `kernel/probability.mjs` 交付，固定映射与输入输出见 [docs/PORTS.md](docs/PORTS.md)。在公共基线 openPorts 全部抛错；如果只有 workspace.snapshot 已接，可查原票及球队关联，明确标记未接入的统计，不以 0 假装成功。平台、宿主、CI 均未改。

## 实际跑过什么

`TZ=UTC node tools/web-oracle.mjs`：Node v24.2.0，26 条断言通过；再次运行退出 0，生成的测试资产逐字节一致。用仓库原 analytics、matchAttribution、teamHistory、warReport、投资选择身份函数；只替换外层存储、展示模式与时钟。不是在 Kotlin 里重算一组期望值。`testAssets/insights-oracle.json` 只进入测试 APK。

| 合成状态 | 原引擎返回 |
|---|---|
| 2 笔已结算＋1 待结算，另有 1 笔归档 | 结算本金 30，净盈亏 0；整票 1/2 = 50%，有明确赛果的腿 2/3 ≈ 66.7%；待结算本金 500 不进入 ROI |
| `0007` 是双腿、`7` 是另一张单票 | `0007` 的结算 2–1 命中 / 0–0 未中；两份冻结腿调换顺序仍按身份配对，平均预测 65%，观察命中 50%，n=2 |
| 空近一周 | 记录、已结算、可画误差点数均 0；冻结校准空桶为 null，不画 0% |
| 在外部结算 `unsettled`，发送原数据更新事件 | 原 ID 的比分 2–0；3 笔已结算、0 笔 pending；整票 66.7%，逐腿 75%，净盈亏 100 |

[实测结果](docs/evidence/test-result.json)；[复跑说明](docs/VERIFY.md)。JUnit 已写 4 个业务用例；Compose 仪器测试已写 ID→球队→原票、切窗口时旧读取迟到、revision/mode、恢复与截图用例。**这些 Android 用例均未执行**，不能据它们证明 Compose 已编译或交互已通过。

## 手机与平板证据

挂载本 lane 的 `docs/evidence/web-reference.zip` 与 `web-contact.jpg`：部署版公开 Inspiration，6 页 × 2 个实测 CSS 视口（390×844、1280×800），无 tour 遮罩。实拍在固定浏览上下文中取样，为避免截屏器拼接重复，外层取图缩小；`viewports.json` 登记各帧真实像素、CSS 视口、DPR 与来源，不能把图片像素当 Android dp。Web 图不在 app 资产或 Git 源码中。公开 demo（Overview 显示 96 笔、整票 38.7%）与合成金样是**两种账本**。

保留的视觉层级是原站的窄标题栏下先读数、再看样本、最后回原票；Android 用宿主 Moon/GlassPanel 重排。宽屏并列数字与逐腿前后对照，窄屏不把网站整体缩小。未复刻原站所有动画、REP 面板和导出/编辑动作；窄屏宿主现有总菜单仍平列 Route，lane 只提供当前组的子页，未越界修改顶栏。Web 与原生的逐页同状态差异、IME、帧时、真机流畅度均待实拍，不将 Web 参照当双端验收证据。

## 未完成与接续

GitHub 公开分支可读；安全凭证代理对 API 目标报 `E_SECRET_TARGET_MISMATCH`，Git 快进 push 返回 HTTP 401。未读取 token 明文、未换其他用途的凭证；没有本次远端 SHA、CI 链接或 APK。本环境无可用 bash/JDK/adb/emulator，Gradle Wrapper 入口退出 127，没有启动 Gradle。按分工文档交付相对 2e6ee10 的 patch 及保留提交链的增量 bundle。

恢复仓库写入通道后只快进当前分支，不强推；如果远端已经前移，先比对，不覆盖。随后在合法的 SDK 环境跑 JVM/编译与上述两种尺寸仪器测试；平台接通后再以真实 New→Settle 的返回 ID 切到 History 作端到端回归，并把原生实拍与同版 demo 对照。这三项完成之前不建议标记为集成验收通过。
