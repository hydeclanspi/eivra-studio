# Eivra Studio · 文档导航

从产品定位、当前实现到历史证据，按阅读目的组织。源码是行为的最终依据；审计记录只证明其对应提交当时的验证结果。

## 产品与当前实现

| 文档 | 阅读目的 |
| --- | --- |
| [项目总览](../../README.md) | 产品理念、模型内核、研究闭环与工程架构 |
| [开发指南](../README.md) | 本地运行、环境、构建与质量门禁 |
| [版本演进与提交索引](release-notes.md) | 近期产品变化、关联提交与维护约定 |
| [Demo 导览](demo-tour.md) | 播放顺序、真实动作、加载就绪、时间轨与演示状态隔离 |
| [Quant 研究工作区](quant-research-workspace.md) | 策略版本、实验、数据契约与前向观察 |
| [品牌定义](brand-identity.md) | Eivra Studio 的正式命名、标语与使用边界 |
| [品牌迁移](product-brand-migration.md) | 目录、存储、同步协议与历史客户端兼容 |
| [API 配置](../api/README.md) | 解锁与可选远程服务 |

## 设计资料

- [Inspiration 2609](inspiration-2609.md) 与 [Lab Editions](lab-editions-v2.md)：主题与设计工作区。
- [红果主题](design/hongguo-theme-2026-10-24.md)：薄荷绿、杏橙与克制的表面层次。
- [Clear Glass 独立样稿](design/eivra-clear-glass-demo.html)、[鲸鱼主讲形象](design/eivra-whale-host.html)、[导览初始样稿](design/eivra-demo-tour-study.html)：可独立打开的设计参照；当前实现以维护说明与源码为准。

## 验证记录

| 日期 | 记录 |
| --- | --- |
| 2026-10-27 | [首页就绪、三工作区导览与状态标识](audits/2026-10-27-demo-readiness-workspaces.md) |
| 2026-10-26 | [研究顺序与测试账本](audits/2026-10-26-research-tour-demo-ledger.md) |
| 2026-10-25 | [开场与两场导入](audits/2026-10-25-demo-welcome-polish.md) · [依赖深挖与进度回拖](audits/2026-10-25-demo-tour-deep-dive.md) |
| 2026-10-24 | [首轮导览修订](audits/2026-10-24-demo-tour-refinement.md) |
| 2026-10-23 | [连续导览首版](audits/2026-10-23-demo-tour.md) |
| 2026-09 | [核心管线](audits/2026-09-18-core-pipeline-audit.md) · [技术修订](audits/2026-09-19-technical-fixes.md) · [修复验收](audits/2026-09-20-audit-fix-completion.md) · [材质性能](audits/2026-09-23-glass-performance.md) |

[冻结的 DuGou 历史归档](../../archive/README.md) 用于来源追溯，不作为当前开发或部署入口。
