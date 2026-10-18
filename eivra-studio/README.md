# Eivra Studio — `eivra-studio/`

应用工作区（React + Vite）。产品定位、模型方法与架构总览见仓库根目录的 [`README.md`](../README.md)；本文件只覆盖开发者上手所需的部分。

正式品牌为 **Eivra Studio**，标语为 **Intuition, calibrated.**。当前生产页面仍沿用 DuGou 的视觉身份；命名规则、Acuen 备选名和兼容边界见 [`docs/brand-identity.md`](docs/brand-identity.md)。

## 环境要求

- Node.js ≥ 18，npm ≥ 9
- 纯前端即可运行：数据默认存于浏览器，分析全在前端完成，无需后端

## 常用脚本

```bash
npm ci

npm run dev            # 开发服务器，默认 http://localhost:3000
npm run build          # 生产构建（输出 dist/）
npm run preview        # 本地预览构建产物

npm run lint           # ESLint 9 flat config
npm run lint:fix       # 自动修复

npm test               # Vitest 跑一次
npm run test:watch     # 监听模式
npm run test:coverage  # 覆盖率报告（v8）
```

## 目录速览

```
src/
├── App.jsx        路由与全局布局
├── lib/           业务与模型内核（纯函数式）
│   ├── analytics.js   量化分析引擎：五段管线 + 三段式记忆化缓存
│   ├── ...            组合拆解、语义解析、存储/同步、展示层遮罩、演示数据
│   └── __tests__/     模型内核单元测试
├── pages/         决策工作流、周期复盘、策略研究与设计预览页面
├── components/    复用 UI
└── design/  data/  workers/
api/              Vercel serverless function（演示解锁端点，见 api/README.md）
```

`lib/analytics.js` 顶部有完整的管线（Pipeline）与缓存失效策略 Banner 注释，是理解整套派生逻辑的入口。

## 环境变量

| 变量 | 用途 |
| --- | --- |
| Supabase 连接配置 | 可选云同步；缺省时以纯本地模式运行，功能不受影响 |
| `UNLOCK_PASSWORD` · `JWT_SECRET` · `UNLOCK_TTL_HOURS` | 演示解锁端点，详见 [`api/README.md`](api/README.md) |

## 质量门禁

仓库根目录 [`../.github/workflows/`](../.github/workflows/) 下的 CI 在向主分支推送 / 提交 PR 时执行 **lint → test → build** 三道门禁。提交前请确保三者本地通过。

Vercel 项目的 **Root Directory** 必须是 `eivra-studio`。目录重命名不涉及生产域名、页面文案、Logo、存储键或同步协议的迁移。
