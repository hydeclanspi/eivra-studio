# Eivra Android 原生迁移 · v1.2 施工与验收账本

> 2026-11-10。v1 / v1.1 保留为来路。本版记录核心原生 UI 已通过的边界，以及尚未完成的视觉、全功能和性能工作。

## 已有真实收据

- 原网页 lint / Vitest / production build 通过。
- 原生 QuickJS 引擎打包与跨端 golden tests 通过，包含保存、逐腿结算、预测冻结、时间戳、导出回读、原分析投影与原投前分布。
- Kotlin 单测与 debug APK 构建通过。
- CI 42851118176（commit 2905ccc4）与 42853386498（commit 656c6d4）四组真实模拟器测试全部通过：
  1. New → Portfolio → Dashboard 与逐级返回；
  2. 未确认 Conf 拒绝，不默认 0.5；
  3. Activity 重建后草稿与路由保留；
  4. History 展开 Entries、Conf、旧记录不以当前模型反填的声明、结算时间。
- 手机底部导航等宽可点；History 改为 LazyColumn，避免一次创建 96 张记录卡。
- 原生 QuickJS 缺浏览器 timer 导致的初始化失败已通过离线 Git 调度 no-op 修复；本地原 `localData` 写入逻辑未替换。
- 最新 APK 约 66.7 MB；为施工版，不是发布候选。

## 当前未通过 / 未验收

- CI 42855100256 的两项失败只发生在截图保存路径修改后，报错为“无法保存原生截图”；同一提交的功能代码未变。随后改为 instrumentation 自有外部存储并验证非空 PNG，最新 CI 42858333376 正在验证 instrumentation 私有 filesDir 与 run-as 取回；此前外部存储路径在测试 context 返回 null，已定位并修正。
- 真实原生 PNG 尚未进入 artifact，视觉 diff 尚未开始；Folio / Glacier / Prism 源码不能替代截图验收。
- 完整 Combo、完整投前 Entries／比分云／自然语言、Quant 编辑与实验执行、War Report、全部动画和完整 Console 未完成。
- 全 UI 操作链、平板真实视口、四态、键盘与无障碍尚未全部验收。
- P50/P95/P99 帧时、启动、内存、ANR、干净安装、覆盖安装、备份恢复和真机使用未验收。

## 下一步

1. 取回真实原生手机 PNG，对照 Web 1440×1000 与 390×844 基线逐项修视觉。
2. 跑通 New → Portfolio → Settle → Dashboard → History 的真实 UI 端到端操作，不只依赖 golden tests。
3. 补平板视口与所有页面四态，再补完整功能。
4. 测帧时、启动、内存、ANR 和安装恢复；保留原始数据，不宣称未测的流畅度。
