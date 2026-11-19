# Eivra Android · 视觉验收账本

状态：等待真实原生 PNG。任何一项在拿到截图与尺寸前均不得标记通过。

## 对照基线

- Web desktop: 1440 × 1000, `tmp/eivra-acceptance/desktop-new.png`
- Web phone: 390 × 844, `tmp/eivra-acceptance/mobile-new.png`
- Android emulator evidence: CI artifact `eivra-native-emulator-evidence`

## 逐项检查

| 项目 | 检查内容 | 状态 |
|---|---|---|
| Canvas | 浅灰蓝底、不过曝、非默认 Material 白 | 待截图 |
| Cards | 非对称大圆角、细边、透明层次、阴影强度 | 待截图 |
| Type | 中英文字体、字号、字重、行高、截断 | 待截图 |
| Spacing | 顶栏、卡片内边距、表单行距、屏幕边距 | 待截图 |
| Navigation | 手机底部等宽入口、More、选中态；平板顶部与工作区 | 待截图 |
| Inputs | 标签、输入框高度、边框、聚焦、键盘避让 | 待截图 |
| Responsive | 手机无横向溢出；平板使用多栏工作区 | 待截图 |
| States | loading / empty / error / populated | 未完成 |
| Motion | 原网页动画与原生帧时 | 未验收 |

## 不照搬的网页缺陷

- Web 390px 视口曾测得 `scrollWidth=1026`，原生手机必须无横向溢出。
- 截图证明的是视口静态表现，不等于真实视觉系统、交互或帧时通过。
