# 证据索引

`511c9a0` [Actions 44397091946](https://github.com/hydeclanspi/eivra-studio/actions/runs/44397091946)，artifact `14469967778`，下载归档 SHA-256 `c5112162a5591e7fe497ca9e2759e5dab415f335725d7c3dcade1056907b0633`。解包 TEST-*.xml 核对：RoutesTest 3/3，PlatformTest 2/2（3.200s），ExchangeTest 2/2（4.894s）；failures/errors/skipped 均为 0。Java17、Ubuntu 24.04、实际 `app.cash.quickjs:quickjs-jvm:0.9.2` JNI；不是 Android 模拟器。测试子进程运行相同的 APK 内核脚本，生产 Kotlin LocalPorts 读写测试目录；不是内存账本。每次请求新建并销毁 realm。

`web-390x844.jpg` 和 `web-tablet-1279x799.jpg` 是 2026-11-18 从线上 `https://eivra.vercel.app/params?tour=0` 的公开 demo / Inspiration 取的原截图。没有注入数据或修改样式。前者是 390×844 px 的可见区域，ArkWeb 报 CSS layout 980×2121，DPR ≈1；后者申请 1280×800、实际像素 1279×799，CSS layout 1280×800，visualViewport.scale ≈2.513。两图展示已填充的 Fit Engine、仍有异步校准提示，且有可见裁切。它们不是同 dp 的移动设备验收图，不能当 Android 截图。线上此会话为暖色光场；原生沿用宿主 Moon，且此分支不复制其完整 Fit Engine 深入面板。

Android 手/平板原生图、字体缩放、系统栏 inset、IME 与帧时目前没有实测数据。`PlatformDeviceTest` 为独立临时目录的设备 ABI/Compose 测试；有设备时，在 v2 执行 `bash lanes/platform/prepare.sh`，再执行 `bash gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.eivra.studio.v2.platform.PlatformDeviceTest`。请分别使用 390×844dp 和 1280×800dp；诊断截图只在该设备测试实际执行后由 `run-as com.eivra.studio.v2 cat cache/platform-console-demo.png` 读出，不进入生产备份。
