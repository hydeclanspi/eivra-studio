# 当前页面导览与模拟数据标识

## 行为

深度分析「最优组合发现」的 TOP 数量左侧增加「仅为数据模拟，无足够样本」。复用顶部 preview 的绿色胶囊与内容组件，使用静态状态语义，仅在演示模式显示。窄屏标题换行后，提示和 TOP 仍排列在同一行。

顶栏与手机导览入口读取点击时的当前路由，从该页面的第一个轨道片段开始，并沿现有时间轨继续播放。手机优先速览；速览缺少的 Settle、Analysis、Metrics、Teams 使用完整轨中的对应起点。首页别名、尾斜杠与旧 Quants 路由可正确匹配。暂停后的「从头开始」与结尾「重播」仍从轨道开头播放。

## 验证

- Vitest：61 个文件、707 项通过。增加 15 项当前页起播测试，覆盖 12 个路由／首页别名、状态重置、后续推进、手机回退、尾斜杠／旧路由、无对应页面和全程重播。
- lint：0 errors，83 条已有 warnings；生产 build 通过，保留原有 chunk size 提示。
- Codex 内置浏览器、localhost、1280×720：New、Portfolio、Settle、Dashboard、Analysis、Metrics、Seasons、Quants、History、Teams、Console 的入口均在当前路由启动对应步骤。Analysis 的绿色标识位于 TOP 6 左侧。
- 390×844：绿色标识与 TOP 同行且完整可见；Analysis、Metrics、Settle、Teams 使用对应完整轨起点，Portfolio 使用速览的 `combo.generate`。临时视口已恢复，验证标签页已关闭。
- 本轮为逐页入口与定向画面验证，没有重新执行两条完整轨道。远端 CI、Vercel 与生产检查按交付提交另行核验。
