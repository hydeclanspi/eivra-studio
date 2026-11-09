# 构建与验收记录

## Run 1 · 2026-11-09

- commit: `4c53e2b92e3e4a0ee65a39d7b69e8b88bd5b3809`
- branch: `android-native`
- run: https://github.com/hydeclanspi/eivra-studio/actions/runs/42669582303
- 结果：失败；Gradle wrapper 在 Windows 生成后没有 Unix 可执行位。
- 影响：测试与 APK 构建未执行，不记为测试失败、不记为 APK 已构建。
- 修复：CI 在测试前明确执行 `chmod +x gradlew`。

## Run 2 · 2026-11-09

- commit: `6c4ceb30561967415d5bfcd6ff1bece9c690b41c`
- run: https://github.com/hydeclanspi/eivra-studio/actions/runs/42669684862
- 结果：AAR metadata 检查失败；所选新版 AndroidX 依赖要求 compileSdk 36。
- 修复：compileSdk/targetSdk 36；minSdk 29 不变。
