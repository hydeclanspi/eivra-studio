# Eivra · Brand Identity & Naming

确认日期：2026-10-18。此文件记录已确认的命名决定、未来候选与迁移边界。

## 正式名称

| 层级 | 名称 | 当前状态 |
| --- | --- | --- |
| 母品牌 | **Eivra** | 已确认；标准拼写为 Eivra，不能写作 Evira |
| 当前产品 / GitHub / 作品集 / CV | **Eivra Studio** | 已确认并用于本仓库 |
| 品牌标语 | **Intuition, calibrated.** | 已确认；保留逗号与句点 |
| 模型方向 | **Eivra Models** | 未来可延展的命名方向，尚非独立发布产品 |
| 研究方向 | **Eivra Research** | 未来可延展的命名方向，尚非独立发布产品 |
| 子功能候选品牌 | **Acuen** | 记录为备选，尚未指定功能或发布 |

## 命名理念

Eivra 是以 **eigen** 与 **variance** 为灵感创造的品牌名，建议读作 **EYE-vruh**。这是一种品牌构词设计，不是既有英文单词或数学术语的标准释义。

名字希望同时表达轻盈、洞察与技术的锋芒：人的直觉提出假设，统计方法检验判断，真实反馈推动校准。Studio 强调研究、构建、验证和复盘发生在同一个工作空间。

**Intuition, calibrated.** 对应产品的核心立场：让判断可计量、可检验、可修正，同时保留人的洞察。它表达工作方法，不承诺预测准确率或收益。

## Acuen · 未来子功能备选

Acuen 的命名灵感来自 **acumen**，强调敏锐的判断力。它可作为未来与洞察、判断辅助或校准有关的子功能的命名候选，但当前不绑定任何模块，也不表示这些功能已经开发或上线。实际启用前应另行确认产品职责、与 Eivra 的关系，以及名称使用条件。

本记录仅确认项目内部的品牌选择，不代表域名所有权或商标注册状态。

## CV / Portfolio 用法

项目标题使用 **Eivra Studio**。可配以下英文介绍：

> Independently developed a quantitative research and decision workspace integrating probability calibration, portfolio construction, Monte Carlo simulation, and walk-forward validation.

项目链接：<https://github.com/hydeclanspi/eivra-studio>。演示入口：<https://hydeclanspi.vercel.app>。

## 2026-10-18 · 仓库命名迁移

- GitHub 仓库与 npm 包名统一为 `eivra-studio`；应用目录由 `dugou-model-centre/` 更名为 `eivra-studio/`。
- README、当前文档中的品牌称呼、报告生成器的标题和带旧品牌的文件名使用 Eivra / Eivra Studio；CI 路径与 Vercel Root Directory 同步改为 `eivra-studio`。
- 头像文件更名为 `public/eivra-avatar.jpg`，图片内容不变。Vercel 保留 `/dugou-avatar.jpg` 到新资源的内部重写，以兼容已有 URL。
- `output/pdf/eivra-app-summary-1page-zh.pdf` 是更名前制作的历史摘要，仅更改归档文件名，正文仍记录当时的名称与产品状态；不应作为新版品牌介绍使用。
- 历史提交、审计日期与验证结论不重写。历史审计复现脚本中的 `49e4622:dugou-model-centre/...` 指向更名前的 Git 对象，必须保留原路径。

## 生产端边界

当前生产页面仍使用既有 DuGou 品牌与 Logo，HTML 标题与元数据保持原样。新的视觉身份另行设计；此次仓库命名迁移不修改 `src/` 中的产品行为或界面文案。

以下历史标识属于运行时或数据兼容契约，继续保留：

- `dugou.*` / `dugou:*` 本地存储、会话存储与事件名称。
- 同步数据库表、加密快照 schema、备份格式、JWT subject 与 API 请求头。
- 原始数据来源名称、应用导出文件名、内部 CSS 标识和历史审计基线路径。
- `data` 分支及其加密快照路径、现有生产域名和 Vercel 项目 ID。

将来推进生产端品牌迁移时，需要单独设计兼容与数据迁移方案，不能全仓库搜索替换这些标识。
