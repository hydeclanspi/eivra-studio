# Inspiration 宿主：实测与验收

参照为 https://eivra.vercel.app/new?tour=0 的公开 preview。禁止加载用户自己的工作区作为截图基准。2026-11-18 由实际 DOM 验证：Moon 顶栏 .mn-bar 的起点 (0,0)、宽=layout viewport，computed background 透明、无圆角/阴影，约 46.8 CSS px 高（52×0.9）；不是四周留边的白色胶囊。New 标题 26px / 600 / #393e42；Overview 24px / 700 / #233747。New Quick Input 为 7/26/7/7 非对称圆角、白色 0.30；研判主卡 24px、白色 0.10；History/Overview 常规卡 10px。不是整站一种白卡。字体 DM Sans 为离线 OFL 字体（其许可随 APK 的 assets/licenses/ 分发）；中文使用设备系统 fallback。CSS 的像素不是所有设备上一概等同的 dp。

公共层提供 GlassPanel、PageHeading，旧签名保留；GlassKind.QuickInput 与 StudioSurface 是 opt-in，适合单独的录入面板。默认卡片跟随路由。当前材质是原生静态光场+半透明叠层与内边高光，不宣称完整复现浏览器 backdrop-filter。在小窗口和大字体下提供按原栏目分组的工作区菜单，宁可重排也不压小文字；品牌返回 New。只有实际可用的本地模式才显示状态，不做伪解锁或无效 Modern 切换。

首轮 2e6ee10：JVM、debug APK、390×844dp 导航返回通过；1280×800dp 的启动报 Error type 3（测试完成后目标 APK 已不在设备），不能把它算作平板产品结果。新版在每种尺寸重新验证安装、前台包名、PNG 尺寸；检查主路由、二级页、系统返回、Activity 重建。perf 是 API 35 / 160dpi / font_scale=1 的 debug 模拟器：3 次 am start -S -W 进程冷启、4 次入口往返期间 Activity window 的 FrameMetrics、丢失回调数；不含浮层窗口、不是全工作区或荣耀 120Hz 验收。原始数据在同一提交对应的 CI artifacts。Web 参考另在无凭证 Chrome 上取同宽 CSS 视口；两类截图不可混标为真机。对齐时要扣除 Android 系统栏，另记 Web 在窄屏上的横向溢出。云端版本发生变化时以实际采样时间为准。
