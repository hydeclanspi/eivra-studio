# Eivra Studio Android 构建日志

## 2026-11-09 · 跨端计算已跑通，APK 尚未生成

- 原网页基线 lint / Vitest / production build：已通过。
- Codespaces 实际执行：Node 24.22.2、OpenJDK 17.0.21、Gradle 8.13、Android SDK 36。
- 原生引擎 `npm run test`：通过。原始 demo 96 条投资，使用原 `localData.saveInvestment` 保存，使用 `updateInvestment` 逐腿结算，检查 `settled_at/outcome_available_at`，导出并回读；Dashboard/Analysis/Metrics/Teams/Research/Forward 调用完成。
- 原生引擎 `npm run build`：通过，独立引擎 752.7 KB，无网页 WebView。
- 关键修复：FULL session latch 在业务模块 import 前建立；JSON 调用采用 `invokeJSON(name, JSON.stringify(argsArray))`；结算按原始 `matches + entries + is_correct` 契约传入。
- `testDebugUnitTest` / `assembleDebug`：尚待成功。JDK 25 与 Gradle 不兼容已切到 JDK 17；SDK 已安装，下一次构建需修复 SDK 权限/依赖并处理 Kotlin 编译错误。
- 模拟器、视觉复刻、性能与真机验收均未执行。

这是构建记录，不是完成证明。
