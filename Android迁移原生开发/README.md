# Eivra Studio · Android 原生迁移

这是网页应用 `../eivra-studio/` 的原生 Android 工程，**不是 WebView 套壳**。

## 当前阶段：原生基础骨架（构建验证中）

- Kotlin + Jetpack Compose；不使用 WebView 承载页面。
- 手机底部导航，宽屏顶部导航＋工作区侧栏；窗口宽度而非设备名称决定布局。
- 本地投资记录、结算、历史与基础指标；演示与真实数据的最终隔离尚未验收。
- 原生 QuickJS 计算边界已建立，原网页 analytics / Quant 的完整适配与 golden cases 尚未完成。
- 不是发布候选；视觉、功能、性能、安装升级均需按 `docs/acceptance-plan.md` 验收。

## 构建

JDK 17、Android SDK 36，在项目根目录执行：

```sh
./gradlew testDebugUnitTest
./gradlew assembleDebug
```

APK：`app/build/outputs/apk/debug/app-debug.apk`。
只有构建、自动测试、真机验收均通过后，才将状态提升为发布候选。

## 工程结构

- `app/`：原生 Activity、Compose 主题与页面、本地存储、计算边界。
- `engine/`：原网页业务内核的独立适配工作区；不含 React UI。
- `docs/`：逐阶段验收账本、原站基准与变更记录。
- `.github/workflows/`：云端标准 Android 构建与测试。

## 数据边界

本阶段使用 App 私有存储，不自动上传。Supabase、加密 Git 快照、AI 自然语言解析与完整原站导入尚未接通；UI 中不冒充可用。导入前必须校验、预览并备份。测试不构成预测能力或收益证明。
