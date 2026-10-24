# 红果主题 · 青橙交融与弧光

2026-10-24，本地实现。

保留红果鲜明的青橙辨识度，同时通过曲面、局部高光和颜色的面积分配控制视觉强度。上半部主绿带杏橙光，下半部主橙渐变回绿色，两种颜色在每个曲面中交融。克制来自构图和材质，不以灰绿、陶土橙或中央大块白色隔断替代青橙关系。

颜色参考为 [红果的官方 App Store 页面](https://apps.apple.com/cn/app/id6451407032)及其中的[当前图标素材](https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/c9/3e/6a/c93e6a66-6cc1-0463-c46b-ee02ac15a288/Placeholder.mill/400x400Icon.ApSiOS01-75.webp)。2026-10-24 对 400 × 400 图标的青绿区、左侧橙区取像素中位数，约为 `#6adab9` 和 `#fe7021`。这是渐变图标的局部采样，不是官方发布的品牌标准色值。绿色保留采样色相，最深尾色提高明度；橙色按界面材质调整为杏橙过渡，避免直接把鲜橙铺成高对比大色块。

| 部位 | 处理 |
| --- | --- |
| 衔接区 | 浅青、暖杏、浅青的连续过渡，不用白色切断两个曲面 |
| 右上曲面 | `#6adab9` 薄荷青为主，尾色抬至 `#8ddfc5`，左侧融入 `#f5cc96` 杏橙光 |
| 下方曲面 | `#f0b47c` 暖杏橙为主，经过柔和黄绿过渡至薄荷青 |
| 纹样 | 两片不对称弧面，上方保留一条细轮廓线；橙色面无内折层、无内轮廓框，保持连续干净 |
| 卡片 | 继续复用已集成的 clear-glass 材质与三个独立质量档位 |
| 辅助文字 | 仅红果将 `--clear-glass-muted` 加深为 `#20363a`，支撑有色底上的阅读 |

`src/design/liquidGlassThemes.js` 将 `hongguo` 注册为 composed 主题。`SmoothGlassBackdrop` 和 `LiquidGlassBackdrop` 已有的 composed 分支都会进入 `ComposedGlassScene`，不再使用旧红果 WebP 或 WebGL 色场。两处主题选择器也复用这个组件。旧资源和 shader 定义暂留，但不在红果的运行路径中。

具体造型都在 `src/design/liquidGlassThemes.css` 的 `.composed-glass-scene--hongguo` 范围内；`clearGlass.css` 中的红果专属变量只加深辅助文字并对齐不透明回退底色。手机端调整曲面的占比和位置，缩略图减小旋转角度以保留青橙两侧边缘。背景无动画循环、无滤镜模糊，两个背景质量档位均保持同一构图。

本地验证：

- Codex 内置 Chromium：1280 × 720 / 800 的 Console 页面、390 × 844 的 Settle 页面视觉检查。
- 背景流畅 / 满画质 × 材质流畅 / 平衡 / 满帧，共六种组合均使用新曲面。材质流畅不采样，平衡和满帧为 `blur(4px) saturate(118%)`。
- 月汐与红果来回切换、主题缩略图和默认路由均确认。背景满画质下 Console 原有光标轨迹 canvas 仍存在，红果本身不创建背景 canvas。
- `npm run lint`：0 errors，83 warnings；`npm test`：58 files / 672 tests 通过；`npm run build` 通过；`git diff --check` 通过。
- 390px 下原有顶栏超宽仍存在：红果与月汐的 document scrollWidth 均为 985px。这不是本轮新增的曲面溢出；主内容保持窄屏布局，本轮未修改导航。

以上为本地验证证据；浏览器检查不等于目标设备验收，部署结果需单独核验。
