# Eivra Studio

[简体中文](#简体中文) · [English](#english)   


[![CI](https://github.com/hydeclanspi/eivra-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/hydeclanspi/eivra-studio/actions/workflows/ci.yml)

## 简体中文

**Intuition, calibrated.**

**让直觉接受校准。面向不确定性决策的量化研究工作台。**

Eivra Studio 将一份主观判断转化为可追溯的预测、配置、结果与修正记录。它把概率校准、组合构建与实证检验放进同一个交互工作空间，让研究者既能理解一笔决策，也能审视支撑它的证据。

[体验在线工作台](https://hydeclanspi.vercel.app) · [模型内核](#模型内核) · [策略实验室](#策略实验室) · [本地运行](#本地运行) · [品牌记录](eivra-studio/docs/brand-identity.md)


**概率校准 · 分数凯利 · 共享事件蒙特卡洛 · 滚动前推验证**

由 [hydeclanspi](https://github.com/hydeclanspi) 独立设计、开发与维护。当前研究对象是由市场赔率定价的足球赛事离散结果；系统关注的更一般问题是：当一部分信号来自人的判断，如何分配风险，并持续检验这份判断。

### 产品理念

概率是一项判断，头寸是一次承诺，结果是一份证据。

Eivra Studio 将三者连接起来。预测记录事件发生前的认知，配置把判断的风险后果量化，结算为研究历史补充观测，校准则检验这份信心是否值得延续到下一次决策。

系统围绕一条有纪律的反馈闭环展开：**提出判断，量化不确定性，配置风险敞口，观察结果，修正模型。**

**Eivra** 是以 *eigen*（特征）与 *variance*（方差）为灵感创造的名字：从复杂性中寻找结构，让不确定性可以被度量。**Studio** 表达的是工作方式——在同一处研究、构建、验证与打磨。视觉保持轻盈，分析过程清晰、可查。

### 研究闭环

```text
研究判断 → 预测 → 配置 → 结算 → 归因 → 校准
            ↑                         │
            └────── 下一次决策 ────────┘
```

| 阶段 | 研究问题 | 工作台中的实现 |
| --- | --- | --- |
| **形成判断** | 我相信什么，依据是什么？ | 结构化事件记录、自然语言录入与预测快照 |
| **配置风险** | 这份判断应承担多大风险？ | 分数凯利仓位、敞口限制与组合构建 |
| **观察结果** | 实际发生了什么？ | 结算、资金追踪与持久化决策历史 |
| **诊断表现** | 结果来自哪里？ | 表现切片、事件画像与依赖关系诊断 |
| **重新校准** | 证据是否支持调整模型？ | 概率评分、按时间顺序的验证与基于可靠性加权的更新 |

### 模型内核

#### 概率校准

校准管线结合回归、**PAV 保序校准**、按赔率调整信心的方法，以及经验贝叶斯收缩。证据不足时，估计向先验收敛。模型比较采用 **Brier 评分**与**对数损失**，并结合校准诊断和按时间顺序划分的评估窗口。

对于二元结果，Brier 评分让概率判断可以被检验：

$$
\mathrm{Brier}=\frac{1}{N}\sum_{i=1}^{N}(p_i-y_i)^2
$$

高信心预测需要后续观测来支持。实现中区分调参窗口与留出评估，并记录结果可用时间戳的依据。

→ [校准与验证引擎](eivra-studio/src/lib/analytics.js) · [概率更新验收](eivra-studio/src/lib/adaptiveValidation.js)

#### 风险配置

**分数凯利（Fractional Kelly）**将估计优势转化为建议仓位，并受明确的资金与风险限制约束。组合构建进一步引入配置上限、集中度惩罚与考虑分散程度的筛选。界面分别支持对单个判断的评估，以及对整体组合的权衡。

多事件头寸先拆解为原子选项，再评估概率与收益。对于不支持的联合市场组合，系统明确保留“不支持”状态。

→ [原子头寸模型](eivra-studio/src/lib/atomicParlay.js) · [组合工作台](eivra-studio/src/pages/ComboPage.jsx)

#### 结果模拟

**带固定随机种子的蒙特卡洛模拟**让重复评估可以复现。共享事件抽样保留了依赖同一场比赛的不同头寸之间的关联。生成的分布用于在模型假设下考察盈利、亏损与回撤。

独立的依赖关系层探索 **FGM Copula 关系**，以及**对代理交互指数的 Shapley 式分摊**。这些诊断被明确标注为探索性指数，不代表经过校准的尾部概率，也不构成因果意义上的风险贡献。

→ [模拟引擎回归测试](eivra-studio/src/lib/__tests__/simulationEngine.test.js) · [依赖风险回归测试](eivra-studio/src/lib/__tests__/dependencyRisk.test.js)

#### 时间与证据

**滚动前推（walk-forward）与预测序贯（prequential）评估**按照信息何时可以被获知来组织观测。预测来源、事件标识和结果可用时间都属于明确的数据契约。实际记录的时间戳与从历史数据推导的假设保持可区分。

无法可靠估计时，系统显示不可用。同一可识别观测的重复副本不会被当作独立证据。研究输出保留这些边界，不用看似精确的数字掩盖不确定性。

→ [时间数据契约](eivra-studio/src/lib/temporalValidation.js) · [预测快照](eivra-studio/src/lib/investmentForecast.js) · [历史审计记录](eivra-studio/docs/audits/)

### 策略实验室

Quant 是 Eivra 的策略研究工作台。它处理的不是“哪组参数在历史上最赚钱”，而是一个更慢的问题：一个直觉如何被写成可复核的规则，规则如何在明确的数据条件下接受检验，证据又如何决定下一步。

工作区围绕两个不可变对象组织：**策略版本**与**实验记录**。五个工作区各自回答一个问题。

| 工作区 | 研究问题 | 保留的产物 |
| --- | --- | --- |
| **研究台** | 今天继续研究什么？ | 最近实验、待补结论、等待结果的影子计划 |
| **实验工作台** | 这个想法如何检验？ | 假设与失效条件、适用范围、概率来源、投入与评估协议 |
| **策略库** | 哪套规则值得保留？ | 版本谱系、冻结输入、对照结果、研究结论与适用边界 |
| **影子观察** | 冻结规则遇到新比赛会怎样？ | 赛前预测与报价快照、完整候选日志、纸面订单、结算与阶段复盘 |
| **数据中心** | 现有数据能支持哪些实验？ | 赛事身份、报价时点、赛果可知时间、覆盖缺口与导入记录 |

**实验类型由数据条件决定，而不是由界面提供一份可以随意点选的菜单。** 只有赛果时，能做的是历史频率与条件差异，结果是描述性的；加入人为设定的赔率或概率后，才能做情景推演，但结论仍受假设约束；只有当赛果、对应时点的历史报价与当时可知的信息同时存在，才构成历史策略回放；从当下开始记录赛前判断与报价，才是前向影子实验。结果的名称跟随证据条件，避免把情景分析写成可执行收益。

每个结果从三个视角阅读：

- **预测质量**：在有冻结预测的样本上查看 Brier 评分与对数损失，并对照简单基准；校准曲线尚未提供。
- **收益与风险**：按声明的价格与配置规则，盈亏、回撤与资金占用。
- **证据质量**：覆盖是否完整、独立赛事有多少、验证数据是否参与过筛选、结论对参数变化是否敏感。

缺少依据的指标显示“不可用”，并说明缺少什么。整体结果可以下钻到单场：当时的概率、报价、是否入选、为什么入选，以及最终如何结算。

Quant 不替代组合工作台。研究阶段输出的是规则与候选；候选进入 Portfolio 后，仍由组合层处理整体配置与资金约束，研究冻结的概率不被二次校准。Settle 记录实际结果，Analysis 提供下一轮研究线索。

生命周期保留失败、修改与重新验证。调参产生新版本，原实验保留规则、数据指纹、时间区间、引擎版本与随机种子；探索与验证使用隔离的数据，并记录搜索过多少方案；工作状态（观察中）与证据状态（样本不足）分开表达；复盘条件在运行前声明。影子观察记录完整候选范围，包括未入选、缺报价、规则拒绝与漏采，而不是只留下成功路径。

底层只有一套规则。同一份策略版本贯穿历史回放、影子观察与候选生成，每条信号绑定预测快照与报价快照，同场不同市场共享一致的赛事结果模型，“1–1”与“平局”可以同时命中。采集器是需要手动启动的本地进程；页面展示最近导入的任务快照，不是常驻服务的实时心跳。

→ [研究引擎](eivra-studio/src/lib/quantResearch.js) · [前向观察](eivra-studio/src/lib/quantForward.js) · [证据契约](eivra-studio/src/lib/quantEvidence.js) · [实现说明](eivra-studio/docs/quant-research-workspace.md)

### 近期演进

- **可回看的完整闭环。** 导览贯穿投前记录、两场组合导入、依赖风险诊断与定制、Dashboard 深度复盘，以及三个研究工作区；Console 结束后回到下一次判断。
- **研究有版本，证据有边界。** 实验保留冻结规则、输入与结论，策略库追踪演进，数据中心决定可用的验证方式。
- **克制的视觉与可靠的开场。** 红果主题保留薄荷绿与杏橙的交融；首页按实际就绪状态触发欢迎，历史样例使用与 Live 一致的状态材质。

[版本演进与提交索引](eivra-studio/docs/release-notes.md) · [文档导航](eivra-studio/docs/README.md) · [导览实现说明](eivra-studio/docs/demo-tour.md)

### 工程架构

产品由浏览器中的研究界面与共享分析内核组成。数据通过结构化或自然语言流程进入系统，经由存储与模型函数处理，再以可检查的结果返回界面。

```text
React 工作台
      │
      ├── 本地数据与预测快照
      │          │
      │          ▼
      │   校准 · 配置 · 模拟 · 验证
      │          │
      └──────────┴──► 指标 · 诊断 · 研究历史

可选服务：加密 Git 快照 · Supabase 同步 · 服务端 AI 解析
```

- **本地优先计算。** 核心分析在浏览器中运行，可选远程服务支持同步与 AI 辅助录入。
- **明确的数据契约。** 预测快照、原子选项、事件标识与信息可用时间元数据，将决策连接到后续评估。
- **可复现计算。** 带随机种子的模拟与按数据修订号组织的缓存，支持重复分析和受控失效。
- **后台分析。** 专用 Worker 将部分分析任务移出界面主线程。
- **共享模型函数。** 页面使用公共分析模块，回归测试覆盖计算、存储行为、API 契约和展示边界。
- **经过推敲的界面。** 分层看板、组合配置、校准视图与交互式设计工作区，让密集的量化信息易于浏览与操作。

**技术栈：** React 18 · Vite 5 · Tailwind CSS 3 · Web Workers · Vitest · ESLint · Vercel Serverless Functions。

### 工作台导览

[播放约 3 分 10 秒的自动导览](https://hydeclanspi.vercel.app/?tour=1) · [约 2 分 10 秒速览](https://hydeclanspi.vercel.app/?tour=short)

公开 Demo 每次进入首页，在文档、字体、图片、首页校准与布局就绪后，再等待 3.75 秒显示欢迎窗，四秒后自动播放。跨页先留出 3 秒浏览整体界面，History 为 2 秒。玻璃小鲸鱼通过字幕、光束和真实页面操作，串起判断、配仓、结算、复盘、研究、历史回看与校准，最后回到 New。进度条可前后拖动；点击页面或按 Space 暂停接管，Esc 退出，顶栏「导览」可重播。手机默认速览，`?tour=0` 禁用当前 URL 的导览；Full、`/arsenal` 和设计预览不显示导览。操作使用临时演示状态，退出时清理；样例收益不构成收益承诺。

实现与验证边界见 [Demo 导览维护说明](eivra-studio/docs/demo-tour.md)。

| 区域 | 路由 | 用途 |
| --- | --- | --- |
| New | `/new` | 记录判断并建立结构化头寸 |
| Portfolio | `/combo` | 检查候选组合、配置与依赖关系诊断 |
| Settle | `/settle` | 记录结果，闭合反馈链路 |
| Dashboard | `/dashboard` | 查看资金与总体表现 |
| Analysis & Metrics | `/dashboard/analysis` · `/dashboard/metrics` | 分析表现切片与校准情况 |
| Seasons | `/dashboard/report` | 在完整背景下复盘一个研究周期 |
| Quants | `/quants` | 策略版本、实验、影子观察与数据证据 |
| History & Teams | `/history` · `/history/teams` | 回溯决策与事件画像 |
| Console | `/params` | 检查参数、验证与配置 |

[在线工作台](https://hydeclanspi.vercel.app) 提供交互演示。页面品牌已统一为 Eivra，图形 Logo 保留原件。**Eivra Studio** 是仓库、作品集与 CV 使用的正式名称。

### 本地运行

使用 Node.js 20+ 与 npm。GitHub CI 当前运行于 Node.js 20。

```bash
git clone https://github.com/hydeclanspi/eivra-studio.git
cd eivra-studio/eivra-studio
npm ci
npm run dev
```

开发服务器运行于 `http://localhost:3000`。核心本地流程无需后端；云同步与 AI 解析需要相应服务配置，单独运行 Vite 不会提供 Serverless API 路由。详见[开发指南](eivra-studio/README.md)与 [API 配置](eivra-studio/api/README.md)。

```bash
npm run lint
npm test
npm run build
```

[GitHub Actions](https://github.com/hydeclanspi/eivra-studio/actions/workflows/ci.yml) 在推送到 main 与提交 Pull Request 时执行 **lint → test → build**。测试验证实现行为，不证明预测能力或投资回报。

<details>
<summary>仓库结构与部署</summary>

```text
.
├── README.md
├── CLAUDE.md
├── .github/workflows/          CI 与定时服务维护
└── eivra-studio/               应用目录 / Vercel Root Directory
    ├── src/
    │   ├── lib/               分析内核与数据契约
    │   ├── lib/__tests__/     回归测试
    │   ├── pages/             研究与决策流程
    │   ├── components/        界面组件
    │   ├── design/            视觉系统与设计研究
    │   ├── data/              应用数据与演示样例
    │   └── workers/           后台分析任务
    ├── api/                   认证、解析与快照端点
    ├── docs/                  品牌记录、设计文档与审计
    ├── public/                静态资源
    ├── scripts/               研究工具
    ├── output/                报告与历史产物
    ├── package.json
    └── vercel.json
```

Vercel 的 **Root Directory** 为 `eivra-studio`，构建命令为 `npm run build`，输出目录为 `dist`。工作流定义位于仓库根目录。

</details>

历史版本封存于 [`archive/dugou-legacy/`](archive/dugou-legacy/)，正式应用仍位于 `eivra-studio/`。迁移与兼容说明见[品牌迁移记录](eivra-studio/docs/product-brand-migration.md)。

### 项目状态

Eivra Studio 是独立开发的研究与作品集项目，包含可运行的应用、持续演进的模型体系与维护中的回归测试。当前能力以本文描述为准；研究提案与历史设计记录不代表发布承诺。

本仓库展示量化思考、分析工程与产品设计能力，不声称拥有经独立验证的超额收益，也不声称达到机构生产环境的就绪标准。分析仅供研究与演示，不构成投资建议。

**Eivra Models** 与 **Eivra Research** 是为未来产品家族预留的方向。**Acuen** 保留为未来子功能的候选名称，以上命名均不意味着已发布独立产品。详见[品牌记录](eivra-studio/docs/brand-identity.md)。

[Read in English ↓](#english)

---

## English

[↑ 简体中文](#简体中文)

**Intuition, calibrated.**

**A quantitative research workbench for decisions under uncertainty.**

Eivra Studio turns a discretionary thesis into a traceable sequence of forecasts, allocations, outcomes, and revisions. It brings probability calibration, portfolio construction, and empirical validation into one interactive workspace—built for a researcher who wants to understand both the decision and the evidence behind it.

[Explore the live workspace](https://hydeclanspi.vercel.app) · [Inside the engine](#inside-the-engine) · [The strategy lab](#the-strategy-lab) · [Run locally](#run-locally) · [Brand notes](eivra-studio/docs/brand-identity.md)

[![CI](https://github.com/hydeclanspi/eivra-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/hydeclanspi/eivra-studio/actions/workflows/ci.yml)

**Probability calibration · Fractional Kelly · Shared-event Monte Carlo · Walk-forward validation**

Independently designed, engineered, and maintained by [hydeclanspi](https://github.com/hydeclanspi). The current research domain is discrete football outcomes priced through market odds; the system studies the broader problem of allocating risk when part of the signal comes from human judgment.

---

### Recent development

The guided demo now follows the full decision loop, with a seekable timeline, dependency editing, deeper dashboard views, and three Quant workspaces. It waits for the home page to become readable before offering the tour, then returns to New after Console. Synthetic history is explicitly labelled and follows the same payout arithmetic as the product.

[Release notes and commit index](eivra-studio/docs/release-notes.md) · [Documentation map](eivra-studio/docs/README.md) · [Play the guided demo](https://hydeclanspi.vercel.app/?tour=1)

### The idea

A probability is a claim. A position is a commitment. An outcome is evidence.

Eivra Studio connects all three. A forecast records what was believed before an event. Allocation makes the consequences of that belief explicit. Settlement adds an observation to the research history. Calibration tests whether confidence deserves to survive the next decision.

The objective is a disciplined feedback loop: **form a thesis, quantify uncertainty, size exposure, observe outcomes, revise the model.**

The name **Eivra** is coined from the mathematical ideas of *eigen* and *variance*: structure within complexity, and uncertainty that can be measured. **Studio** describes the working environment—an integrated space to investigate, build, test, and refine. The visual identity is intentionally light; the analytical work is explicit and inspectable.

### The research loop

```text
Thesis → Forecast → Allocation → Settlement → Attribution → Calibration
            ↑                                                │
            └────────────── the next decision ────────────────┘
```

| Stage | Research question | In the workspace |
| --- | --- | --- |
| **Frame** | What do I believe, and why? | Structured event records, natural-language entry, and forecast snapshots |
| **Allocate** | How much risk should this view carry? | Fractional Kelly sizing, exposure limits, and portfolio construction |
| **Observe** | What actually happened? | Settlement, capital tracking, and a persistent decision history |
| **Diagnose** | Where did the result come from? | Performance slices, event profiles, and dependency diagnostics |
| **Recalibrate** | Does the evidence support changing the model? | Probability scoring, chronological validation, and reliability-weighted updates |

### Inside the engine

#### Probability, calibrated

The calibration pipeline combines regression, **PAV isotonic calibration**, confidence-by-odds adjustments, and empirical-Bayes shrinkage. Estimates move toward a prior when evidence is thin. Model comparisons use **Brier score** and **log loss**, alongside calibration diagnostics and chronological evaluation windows.

For binary outcomes, the Brier score makes the claim testable:

$$
\mathrm{Brier}=\frac{1}{N}\sum_{i=1}^{N}(p_i-y_i)^2
$$

A high-confidence forecast earns its place through subsequent observations. The implementation distinguishes tuning windows from held-out evaluation and tracks the basis of outcome-availability timestamps.

→ [Calibration and validation engine](eivra-studio/src/lib/analytics.js) · [Probability-update acceptance](eivra-studio/src/lib/adaptiveValidation.js)

#### Exposure, constrained

**Fractional Kelly** translates an estimated edge into a proposed stake, subject to explicit capital and risk limits. Portfolio construction adds capped allocations, concentration penalties, and diversification-aware selection. Supporting a strong individual view and building a resilient collection of views are separate decisions in the interface.

Multi-event positions are decomposed into atomic selections before their probabilities and payoffs are evaluated. Unsupported joint-market combinations retain an explicit unsupported state.

→ [Atomic position model](eivra-studio/src/lib/atomicParlay.js) · [Portfolio workspace](eivra-studio/src/pages/ComboPage.jsx)

#### Outcomes, simulated

**Seeded Monte Carlo simulation** makes repeated evaluations reproducible. Shared-event draws preserve the relationship between positions that depend on the same underlying match. The resulting distributions support inspection of profitability, losses, and drawdowns under the model's assumptions.

A separate dependency layer explores **FGM copula relationships** and **Shapley-style allocation of a proxy interaction index**. These diagnostics are labeled as exploratory indices; they do not establish calibrated tail probabilities or causal risk contributions.

→ [Simulation regression tests](eivra-studio/src/lib/__tests__/simulationEngine.test.js) · [Dependency-risk regression tests](eivra-studio/src/lib/__tests__/dependencyRisk.test.js)

#### Evidence, time-aware

**Walk-forward and prequential evaluation** organize observations by when they could have been known. Forecast provenance, event identity, and outcome availability are explicit parts of the data contract. Recorded timestamps and derived legacy assumptions remain distinguishable.

Unreliable estimates have an unavailable state. Repeated copies of the same identifiable observation are not treated as independent evidence. Research outputs retain these limitations rather than hiding them behind a precise-looking number.

→ [Temporal data contract](eivra-studio/src/lib/temporalValidation.js) · [Forecast snapshots](eivra-studio/src/lib/investmentForecast.js) · [Historical audit notes](eivra-studio/docs/audits/)

### The strategy lab

Quant is Eivra's strategy research workbench. Its subject is not the parameter set that performed best in hindsight, but a slower question: how a hunch becomes a rule that can be inspected, how that rule is tested under explicit data conditions, and how the evidence decides what comes next.

The workspace is organized around two immutable objects: the **strategy version** and the **experiment record**. Five areas each answer one question.

| Area | Research question | What is retained |
| --- | --- | --- |
| **Research desk** | What should I continue today? | Recent experiments, conclusions still to be written, shadow plans awaiting results |
| **Experiment bench** | How should this idea be tested? | Hypothesis and falsifier, scope, probability source, stake sizing and evaluation protocol |
| **Strategy library** | Which rules deserve to stay? | Version lineage, frozen inputs, comparisons, conclusions, and applicability limits |
| **Shadow observation** | How do frozen rules meet new matches? | Pre-match forecast and quote snapshots, the full candidate log, paper orders, settlement, and staged reviews |
| **Data center** | Which experiments does the available data support? | Event identity, quote timestamps, result availability, coverage gaps, and import records |

**The data condition determines the experiment type; the interface does not offer a menu of interchangeable backtests.** With results alone, the work is a historical frequency study—descriptive, not a return. Add assumed odds or probabilities and it becomes a scenario analysis, still bounded by its assumptions. Only when results, as-of odds, and the information available at the time coexist does a historical strategy replay become possible. Recording forecasts and quotes from this moment forward is a forward shadow experiment. The name of the result follows the evidence, so a scenario is not presented as an executable return.

Every result is read from three angles:

- **Forecast quality.** Brier score and log loss where a frozen forecast exists, alongside a simple benchmark; a calibration curve is not yet provided.
- **Return and risk.** Profit and loss, drawdown, and capital committed under the declared prices and sizing rules.
- **Evidence quality.** Coverage, the number of independent matches, whether validation data took part in selection, and whether conclusions move under parameter changes.

An estimate without a basis is shown as unavailable, with the missing input named. Aggregate results drill down to the single match: the probability and quote at the time, whether it entered the strategy, why, and how it settled.

Quant does not replace the portfolio workspace. Research produces rules and candidates; the portfolio layer still owns aggregate allocation and capital constraints, and the frozen research probability is not recalibrated a second time. Settle records what actually happened; Analysis supplies the next line of inquiry.

The lifecycle keeps failures, revisions, and re-validation. A revised rule produces a new version, while the original experiment retains its rules, data fingerprint, time window, engine version, and random seed. Exploration and validation use separated data, and the record counts how many candidates were searched. Working state (observing) and evidence state (insufficient sample) are reported separately. Review conditions are declared before the run. Shadow observation keeps the full candidate range—rejected, unpriced, refused by a rule, or missed—rather than only the successful path.

One rule set underlies every surface. A strategy version runs through historical replay, shadow observation, and candidate generation; each signal binds a forecast snapshot and a quote snapshot, and different markets on the same match share one result model—a 1–1 scoreline and a draw settle from the same event. The collector is a local process the researcher starts by hand; the page shows the last imported task snapshot, not a live heartbeat.

→ [Research engine](eivra-studio/src/lib/quantResearch.js) · [Forward observation](eivra-studio/src/lib/quantForward.js) · [Evidence contract](eivra-studio/src/lib/quantEvidence.js) · [Implementation notes](eivra-studio/docs/quant-research-workspace.md)

### Built as a system

The product combines a browser-based research interface with a shared analytical core. Data enters through structured or natural-language workflows, moves through storage and model functions, and returns to the interface as inspectable results.

```text
React workspace
      │
      ├── Local data & forecast snapshots
      │          │
      │          ▼
      │   Calibration · Allocation · Simulation · Validation
      │          │
      └──────────┴──► Metrics · Diagnostics · Research history

Optional services: encrypted Git snapshots · Supabase sync · server-side AI parsing
```

- **Local-first computation.** Core analytics run in the browser. Optional remote services support synchronization and AI-assisted entry.
- **Explicit data contracts.** Forecast snapshots, atomic selections, event identities, and time-availability metadata connect decisions to later evaluation.
- **Reproducible computation.** Seeded simulations and revision-scoped caches support repeatable analysis and controlled invalidation.
- **Worker-backed analysis.** A dedicated worker handles selected analytical jobs away from the main UI thread.
- **Shared model functions.** Pages consume common analytical modules, with regression tests covering calculations, storage behavior, API contracts, and presentation boundaries.
- **A considered interface.** Layered dashboards, portfolio composition, calibration views, and an interactive design workspace make a dense quantitative system navigable.

**Stack:** React 18 · Vite 5 · Tailwind CSS 3 · Web Workers · Vitest · ESLint · Vercel serverless functions.

### Explore the workspace

| Area | Route | Purpose |
| --- | --- | --- |
| New | `/new` | Capture a thesis and create a structured position |
| Portfolio | `/combo` | Inspect candidate combinations, allocation, and dependency diagnostics |
| Settle | `/settle` | Record outcomes and close the feedback loop |
| Dashboard | `/dashboard` | Review capital and aggregate performance |
| Analysis & Metrics | `/dashboard/analysis` · `/dashboard/metrics` | Investigate performance slices and calibration |
| Seasons | `/dashboard/report` | Review a research period in context |
| Quants | `/quants` | Strategy versions, experiments, shadow observation, and data evidence |
| History & Teams | `/history` · `/history/teams` | Revisit decisions and event-level profiles |
| Console | `/params` | Inspect parameters, validation, and configuration |

The [live workspace](https://hydeclanspi.vercel.app) provides an interactive demo. The application now uses the Eivra name while retaining its existing graphical logo. **Eivra Studio** is the official name for the repository, portfolio, and CV.

### Run locally

Use Node.js 20+ and npm. GitHub CI currently runs on Node.js 20.

```bash
git clone https://github.com/hydeclanspi/eivra-studio.git
cd eivra-studio/eivra-studio
npm ci
npm run dev
```

The development server runs at `http://localhost:3000`. Core local workflows do not require a backend. Cloud synchronization and AI parsing require their respective service configuration; Vite alone does not serve the serverless API routes. See the [developer guide](eivra-studio/README.md) and [API setup](eivra-studio/api/README.md).

```bash
npm run lint
npm test
npm run build
```

[GitHub Actions](https://github.com/hydeclanspi/eivra-studio/actions/workflows/ci.yml) runs **lint → test → build** on main-branch pushes and pull requests. Tests establish implementation behavior; they do not establish predictive performance or investment returns.

<details>
<summary>Repository layout & deployment</summary>

```text
.
├── README.md
├── CLAUDE.md
├── .github/workflows/          CI and scheduled service maintenance
└── eivra-studio/               Application / Vercel Root Directory
    ├── src/
    │   ├── lib/               Analytical core and data contracts
    │   ├── lib/__tests__/     Regression suite
    │   ├── pages/             Research and decision workflows
    │   ├── components/        Interface components
    │   ├── design/            Visual systems and design studies
    │   ├── data/              Application data and demo fixtures
    │   └── workers/           Background analytical jobs
    ├── api/                   Authentication, parsing, and snapshot endpoints
    ├── docs/                  Brand notes, design records, and audits
    ├── public/                Static assets
    ├── scripts/               Research utilities
    ├── output/                Reports and historical artifacts
    ├── package.json
    └── vercel.json
```

Vercel uses `eivra-studio` as its **Root Directory**, `npm run build` as the build command, and `dist` as the output directory. Workflow definitions live at the repository root.

</details>

The frozen historical version is preserved in [`archive/dugou-legacy/`](archive/dugou-legacy/); the active application remains in `eivra-studio/`. See the [migration record](eivra-studio/docs/product-brand-migration.md) for compatibility details.

### Project status

Eivra Studio is an independently developed research and portfolio project with a working application, an evolving model stack, and a maintained regression suite. Its current capabilities are described above; research proposals and historical design notes are not release commitments.

The repository demonstrates quantitative reasoning, analytical engineering, and product design. It makes no claim of independently verified alpha or institutional production readiness. Analysis is provided for research and demonstration, not investment advice.

**Eivra Models** and **Eivra Research** are reserved directions for a future product family. **Acuen** remains a candidate name for a future sub-feature. Neither naming direction implies a separately released product. See the [brand record](eivra-studio/docs/brand-identity.md).
