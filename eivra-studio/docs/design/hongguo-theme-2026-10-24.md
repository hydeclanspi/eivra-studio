# 红果主题 · 瓷白、青釉与橙光

2026-10-24，本地实现。

原版的问题是青、橙、金色同时铺满背景，缺少清楚的物体轮廓；通透卡片又让这些色彩进入正文。新版保留原有青橙色系，沿用月汐、暖砂的曲面构图语言，以瓷白留白、青色弧面和右下角的暖橙曲面建立层次。

| 部位 | 处理 |
| --- | --- |
| 阅读区 | `#eff2ee` 瓷白底，减少全屏色彩混合 |
| 上方曲面 | 青白至 `#83afab` 的低饱和青色，细亮边与轻投影 |
| 右下曲面 | `#e8beaa` 至暖白的陶橙色，只占局部 |
| 卡片 | 继续复用已集成的 clear-glass 材质与三个独立质量档位 |

`src/design/liquidGlassThemes.js` 将 `hongguo` 注册为 composed 主题。`SmoothGlassBackdrop` 和 `LiquidGlassBackdrop` 已有的 composed 分支都会进入 `ComposedGlassScene`，不再使用旧红果 WebP 或 WebGL 色场。两处主题选择器也复用这个组件。旧资源和 shader 定义暂留，但不在红果的运行路径中。

具体造型都在 `src/design/liquidGlassThemes.css` 的 `.composed-glass-scene--hongguo` 范围内。手机端调整曲面的占比和位置，缩略图减小旋转角度以保留青橙两侧边缘。背景无动画循环、无滤镜模糊，两个背景质量档位均保持同一构图。

本地验证：

- Codex 内置 Chromium：1280 × 720 的 Console 页面、390 × 844 的 Settle 页面视觉检查。
- 背景流畅 / 满画质 × 材质流畅 / 平衡 / 满帧，共六种组合均使用新曲面。材质流畅不采样，平衡和满帧为 `blur(4px) saturate(118%)`。
- 暖砂与红果来回切换、主题缩略图和默认路由均确认。背景满画质下 Console 原有光标轨迹 canvas 仍存在，红果本身不创建背景 canvas。
- `npm run lint`：0 errors，83 warnings；`npm test`：58 files / 672 tests 通过；`npm run build` 通过；`git diff --check` 通过。
- 390px 下原有顶栏超宽仍存在：红果与月汐的 document scrollWidth 均为 985px。这不是本轮新增的曲面溢出；主内容保持窄屏布局，本轮未修改导航。

以上为本地验证证据；浏览器检查不等于目标设备验收，部署结果需单独核验。
