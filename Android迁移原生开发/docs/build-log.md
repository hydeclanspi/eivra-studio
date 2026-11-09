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

## 原生引擎调试与 GitHub 调度异常 · 2026-11-09

- 网页 lint/test/build 已连续通过；原生 golden tests 仍在适配，未通过。
- 已处理平台依赖别名、构建时 env、Node navigator、FULL/demo/genesis 初始化和离线云同步。
- Run 15 `42671411092`、Run 22 `42672498173` 均标记 completed/failure，但 jobs 为空、日志 zip 仅 22 bytes，无法取得实际执行日志。不得计作测试失败或通过，记为调度层无执行收据。
- 下一步用包含此说明的新提交重新触发，优先取真实 job；若仍无执行，构建与 APK 状态保持未验收。
