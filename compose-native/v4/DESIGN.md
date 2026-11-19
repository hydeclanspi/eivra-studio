# Eivra Studio Android v2 · Inspiration

设计来源是线上 https://eivra.vercel.app/ 的默认工作区，不是版本 1 的截图。2026-11-18 实查：Inspiration，liquid-glass-composed，style=moon，material=full，background=smooth。自动导览的暗遮罩不是背景色。

背板直接取自网页三组光场：#F5F7FB → #E4E9EF 底；冷面 #F5F7FB → #CFD9E5 → #ACBCD0；另一面 #DCE0E8 → #F2F5F8。玻璃只抬高亮度，不把背景抹平成灰绿。横屏一条悬浮顶栏，不再放一份重复的常驻侧栏；菱形 HDCS 标、细标签、紫色激活线、Quick Input 的香槟金与 PK 的玫瑰／天蓝各司其职。

实现边界：Android 绘制所有视图、文字和输入，原引擎只计算，不嵌网页。系统栏与键盘留足 inset；手机／平板按可用 dp 重排，不能靠把整个网站当位图缩放。业务读取与模型计算不得占用 UI 线程。调试版采用独立应用 ID，可与 v1 并存，不让测试写入旧账本。

源代码、测试、截图与性能样本应区分记录。截图比对不等于真机 120Hz 验收。