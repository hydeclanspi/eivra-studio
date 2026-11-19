# Ledger · New 与 Settle 交接

**可集成，但尚未通过真实账本的端到端验收。** 分支 `android-v2/ledger`，公共父提交 `2e6ee10ae6d0bd49bc3749ba974a6dcb308cae88`。最后一版经共享 CI 验证的产品／仪器测试源码 `d45702885527910f9788f2de7b8f287a17b23469`。本文件之后的取证资料不改变应用入口。工作面仅 `Android迁移原生开发/v2/lanes/ledger/`；未动宿主、CI、其他 lane、v1 或网站，没有合并。

## 路径与实现

* `LedgerScreen(StudioEnv)` 直接渲染 `Route.New` / `Route.Settle`。New 的顶层顺序是标题／投前投后 → 通栏 Quick Input → 两张独立玻璃卡 → 模型反馈及实际投入。宽屏阈值 1101dp：投前策略 4 在左、比赛 6 在右；投后反排。手机比赛先于策略；主、VS、客可以纵排。样式参照线上 Inspiration、`NewInvestmentPage.jsx`、`SettlePage.jsx` 和 `preMatchStudio.css`，不取 v1 截图。
* 可编辑多场、多 Entry、策略、Conf、β/γ/δ、赛前备注、投入。完整比分触发主客进球范围、逐球数加权／压低以及 7×7 原始判断云图。只展示端口返回的分布，不把云图当机构价格。没有来源的数据不显示为 0。
* Portfolio 必须带 `Dest(New,draftId)`。`draft.get` 失败不会偷偷换空单。录入值一直保留字符串；`''`、`.`、`4.` 和 `4.30` 可停留，命名但未定价的行可存草稿，不可冻结。解析结果先核对，再替换；解析器可能填出的 50 不是用户确认。预览和写入时都验证；投后走单独的 `workspace.importInvestment`，不会用 `saveInvestment` 兜底生成假快照。
* 保存拿到 `{id,revision}` 才跳 **该 ID** 的 Settle；没有 ID、写入失败或当前模式不允许写入都不成功跳转。Settle 以 ID 重读当前记录，一场一个命中决定和赛果，可选 AJR／REP／赛后备注，整笔一项回款。无回款须明填 0。成功后送 `Dest(History,id)`；History 页面仍归 Insights。
* 编辑草稿在 destination 对应的 ViewModel 中，宿主返回栈／配置重建不要求把大段 JSON 放 Bundle。显式“存草稿”只保存 `draft.put` 回执的 key；未手动 checkpoint 的修改不承诺杀进程恢复。保存和结算有单次写入闸门；失败保稿，重复请求保留 record ID 和创建时间；后台预测与解析不会把旧结果盖在新输入上。

## 哪些证据已经成立

[Android v2 CI #44400214157](https://github.com/hydeclanspi/eivra-studio/actions/runs/44400214157) 在 `d457028` 的 `:app:testDebugUnitTest :app:assembleDebug :app:assembleDebugAndroidTest` 成功；v1 tree 校验成功。仪器测试 **编译成功不等于运行成功**。源工件 `14472580574`。从实际工件提取的 [JUnit XML](docs/evidence/TEST-LedgerContractTest.xml)：本 lane 11 项，失败 0、错误 0、跳过 0。前次 CI #44398906532 暴露 android.view.WindowInsets 遮蔽 Compose WindowInsets 的测试编译错误；已修复。

核心用例：读取 `portfolio-fixture`，从 `主胜@1.86 / 2-1@4.3` 修改第二条到 `4.75`，确认 Conf（未确认先断言禁止落账），连续提交两次但只写一次。替身返回 `receipt-73` 而不是请求 ID。指定这笔填 `2-1`、命中、AJR `0.6`、回款 `28`；再次用同一个 ID 读取 `win / 2-1 / 28`，另一笔 `also-pending` 留在待结算中。另测两场多 Entry 的顺序与扩展键、不完整数字 checkpoint、旧解析迟到、无效分布／质量和、投后不评级、错误回执、权限和写失败。**这些数全是测试数据，不是内核预测或真实投资。**

## 截图与复现

挂载本 lane 的 `docs/evidence/web-reference.zip` 是本次在线公开站点的 8 张实图（每种尺寸各有空稿、青岚/北港两 Entry、投后、Settle 公开 demo），内附 `capture.json`。使用原站页面和 390×844、1280×800 CSS 画框，DPR 2.2，按 CSS 像素导出。没有改原站 CSS、没有写网页账本。初次仅改小浏览器窗口会得到 980 CSS 布局宽，已排除该错误样本。投前／投后实测列宽分别约 `471.68 / 707.52` 和 `707.51 / 471.68`（网页自身外层有缩放）。

从 v2 在独立 API 35 模拟器执行 `ANDROID_SERIAL=emulator-… bash lanes/ledger/docs/check-ledger.sh`。指令限制为 emulator，不会对个人设备改分辨率。预期两套 `390×844px / 1280×800px`，160dpi、font scale 1.0，输出原始 instrumentation 日志、尺寸与系统截图，测试保留 IME 和恢复断言。分支 CI 设备步骤实际为 skipped。另在临时云机检查：当前构建用户不能打开 `/dev/kvm`，没有扩大权限；软件模拟器曾上线 adb，未能留在可执行测试状态。**本次没有通过 connected 设备验收**，没有把 v1、Web 截图或重画图当成设备证据。

### 已取得的原生画面（不是设备截屏）

`docs/evidence/native-render.zip` 在挂载可取。Robolectric 4.16.1 / SDK 35，`GraphicsMode.NATIVE`，MDPI，默认字体比例；真实 `StudioHost`、`LedgerScreen` 和 Android Activity decorView 绘制到 bitmap。手机 390×844、横屏平板 1280×800，各 4 张原尺寸 PNG。`LedgerRenderTest` 点击导航、填入两条 Entry、切换投前投后、打开指定结算记录，两个尺寸 **2/2 通过**：[原始 XML](docs/evidence/TEST-LedgerRenderTest.xml)。截图来自运行的 Compose，不是 WebView、设计稿或旧 App；无真实系统栏、硬件和 IME 证据。可选复现：`bash gradlew -I lanes/ledger/docs/native-render.init.gradle :app:testDebugUnitTest --tests '*LedgerRenderTest'`。取证器代码在 `133f31e`；未将测试专用依赖加入应用或共享 CI。

对照观察：平板 New 两栏左右位置、宽度与 Quick Input 通栏已对齐；同一组 `青岚 / 北港 · 主胜@1.86 · 2-1@4.30`，原站把两条 Entry 横排，而原生把每条名称／价格独占一行，所以云图出现得更靠下。手机 PK 两端均按主、VS、客纵排；原生的比赛面板更紧。网页默认显示 0.50；原生显示“尚未评级”，这是审计要求，不是漏填。Settle 对照的是公开米兰首腿、勒沃库森次腿的同一组对阵；原生走指定记录详情，不复刻网页列表上方的批量操作。原生沿用宿主 Moon 底色，未复刻网页 Settle 的彩色光场。测试替身的 pending 总数、ID、未填决定与线上 demo 不冒充逐字段相同。

像素文件保留在挂载和交付 ZIP，避免给 Git 源码树增加大二进制；Git 内保留生成器、测试回执和此对照说明。

## 接入后的验收闸门

1. `docs/PORTS.md` 对照了 platform `df4f17f`、strategy `cf0146b` 的真实代码／接口；生产不携带替身。当前独立分支自身的 `openPorts` 仍是公共基线的 unavailable 实现，不能把这个 APK 当作已接真内核的整包。
2. 集成端用实际 Portfolio 发一份两场多 Entry 草稿；修改并 checkpoint；验证同 ID 回读、来源键与价格不变，检查 mode 隔离。预览、提交时重新冻结、创建时间／快照时间、空值和无效分布均需对真实 QuickJS 重放。
3. 重启进程，在 Settle 对指定 recordId 逐场填结果，History 查到同一笔；无重复写，其他 pending 不变。再导入一笔历史记录，验证没有 forecast_snapshot。替身内的 History 查询不代替真正的 Insights UI。
4. 完整侧旁球队档案、官方盘对位与历史偏差、Settle 自然语言批量结算及批量编辑不在这次单笔闭环里；云图只表达未经历史修正的主观分布。输入法、旋转、返回、显示缩放、视觉逐项差异与帧时仍需设备实测。没有发布或性能结论。
