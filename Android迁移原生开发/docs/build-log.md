# 构建与验收记录

## Run 1 · 2026-11-09

- commit: `4c53e2b92e3e4a0ee65a39d7b69e8b88bd5b3809`
- branch: `android-native`
- run: https://github.com/hydeclanspi/eivra-studio/actions/runs/42669582303
- 结果：失败；Gradle wrapper 在 Windows 生成后没有 Unix 可执行位。
- 影响：测试与 APK 构建未执行，不记为测试失败、不记为 APK 已构建。
- 修复：CI 在测试前明确执行 `chmod +x gradlew`。
