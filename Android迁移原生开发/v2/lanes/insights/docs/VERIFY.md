# 验收路径与证据边界

1. 仅在私有 checkout 的 `Android迁移原生开发/v2` 运行 `TZ=UTC node lanes/insights/tools/web-oracle.mjs /tmp/insights-oracle.json`。JSON 是原 Web 函数在合成输入上的输出，不是生产数据库。与 `lanes/insights/testAssets/insights-oracle.json` 比较（同一时区）。测试专用资产不在 main source set。写共享存储的测试替身方法会抛错。
2. Android 环境：JDK 17、SDK 36、项目 Gradle Wrapper；`bash gradlew :app:testDebugUnitTest :app:assembleDebug :app:assembleDebugAndroidTest`。使用平台固定的读取映射，见 PORTS.md。若平台未合并，默认 Activity 理应显示读取不可用，不应展示本测试账本。
3. **仅在一次性测试模拟器**分别运行：手机 `adb shell wm size 390x844`，平板 `adb shell wm size 1280x800`；两者都设 `adb shell wm density 160`、`adb shell settings put system font_scale 1.0`，确认显示方向、系统栏和有效 bounds。每个尺寸执行 `bash gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.eivra.studio.v2.insights.ReviewJourney -Pandroid.testInstrumentationRunnerArguments.capture=1`。独立实例或恢复模拟器原设置；不在用户的实机上改显示参数。
4. 截图测试使用真实宿主 `StudioHost` + 测试 `StudioPorts`。运行后（若已卸载则先保留/安装测试 APK，再用 `adb shell am instrument -w -e class com.eivra.studio.v2.insights.ReviewJourney -e capture 1 com.eivra.studio.v2.test/androidx.test.runner.AndroidJUnitRunner`）：`adb exec-out run-as com.eivra.studio.v2 cat files/insights-evidence/Record-0007.png > phone-record.png`。每帧有同名 JSON，记录截图像素、density、系统 inset、字体比例；以文件实测为准，不以 `wm size` 命令替代。截图是独立用例，不能修改或跳过业务断言来取得截图。
5. 核对同一合成状态：Overview/全部显示整票 50.0%；Metrics/全部显示逐腿 66.7%；空周显示「—」。输入 `0007`，不是另一笔 `7`。即使筛选待结算或近一周，完整 ID 仍能打开原票。逐腿实际 2–1 / 0–0，分别命中 / 未命中。North → 对阵 → #0007。第二版 `unsettled` 从未判定变 2–0；先阻塞旧「全部」读取，再切近一周，晚到结果不得回填。切换 mode 后旧记录消失；恢复页面重新读取。改用公开 demo 做最终视觉比对时，两侧都必须为同版 demo、同窗口、同 ID；不同账本的图片不得拼成验收通过。

**本次已有：** `tools/web-oracle.mjs` 的原引擎运行结果；Web 六页公开 demo 的两种 CSS 视口实拍。**本次没有：** Android 编译、instrumentation 运行、原生截图、真机帧时、真实平台 New→Settle→History 联调结果。
