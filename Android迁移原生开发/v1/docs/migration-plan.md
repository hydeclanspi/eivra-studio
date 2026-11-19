# Eivra Studio Native Android

## 目标
原生 Jetpack Compose 界面；手机、横屏和平板采用窗口宽度自适应布局。保持 Inspiration 视觉语言。

## 结构
- app：Android Activity、ViewModel、Compose 页面与本地偏好。
- engine：原网页业务计算代码的独立适配与打包，不含 React、DOM 或 WebView。
- contract：原生界面与计算引擎之间的 JSON 契约。
- docs：网页基准、迁移状态、验收证据与版本变更。

## 数据与边界
默认演示数据与主人工作区分开。原网页数据通过导出 bundle 导入，不默认上传；云同步、AI 录入在相应服务配置前不冒充已接通。验证测试不等于收益保证。
