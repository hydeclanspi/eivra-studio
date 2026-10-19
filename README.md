# Eivra Studio

**Intuition, calibrated.**

### A quantitative research workbench for decisions under uncertainty.

Eivra Studio turns a discretionary thesis into a traceable sequence of forecasts, allocations, outcomes, and revisions. It brings probability calibration, portfolio construction, and empirical validation into one interactive workspace—built for a researcher who wants to understand both the decision and the evidence behind it.

[Explore the live workspace](https://hydeclanspi.vercel.app) · [Inside the engine](#inside-the-engine) · [Run locally](#run-locally) · [Brand notes](eivra-studio/docs/brand-identity.md)

[![CI](https://github.com/hydeclanspi/eivra-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/hydeclanspi/eivra-studio/actions/workflows/ci.yml)

**Probability calibration · Fractional Kelly · Shared-event Monte Carlo · Walk-forward validation**

Independently designed, engineered, and maintained by [hydeclanspi](https://github.com/hydeclanspi). The current research domain is discrete football outcomes priced through market odds; the system studies the broader problem of allocating risk when part of the signal comes from human judgment.

---

## The idea

A probability is a claim. A position is a commitment. An outcome is evidence.

Eivra Studio connects all three. A forecast records what was believed before an event. Allocation makes the consequences of that belief explicit. Settlement adds an observation to the research history. Calibration tests whether confidence deserves to survive the next decision.

The objective is a disciplined feedback loop: **form a thesis, quantify uncertainty, size exposure, observe outcomes, revise the model.**

The name **Eivra** is coined from the mathematical ideas of *eigen* and *variance*: structure within complexity, and uncertainty that can be measured. **Studio** describes the working environment—an integrated space to investigate, build, test, and refine. The visual identity is intentionally light; the analytical work is explicit and inspectable.

## The research loop

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

## Inside the engine

### Probability, calibrated

The calibration pipeline combines regression, **PAV isotonic calibration**, confidence-by-odds adjustments, and empirical-Bayes shrinkage. Estimates move toward a prior when evidence is thin. Model comparisons use **Brier score** and **log loss**, alongside calibration diagnostics and chronological evaluation windows.

For binary outcomes, the Brier score makes the claim testable:

$$
\mathrm{Brier}=\frac{1}{N}\sum_{i=1}^{N}(p_i-y_i)^2
$$

A high-confidence forecast earns its place through subsequent observations. The implementation distinguishes tuning windows from held-out evaluation and tracks the basis of outcome-availability timestamps.

→ [Calibration and validation engine](eivra-studio/src/lib/analytics.js) · [Probability-update acceptance](eivra-studio/src/lib/adaptiveValidation.js)

### Exposure, constrained

**Fractional Kelly** translates an estimated edge into a proposed stake, subject to explicit capital and risk limits. Portfolio construction adds capped allocations, concentration penalties, and diversification-aware selection. Supporting a strong individual view and building a resilient collection of views are separate decisions in the interface.

Multi-event positions are decomposed into atomic selections before their probabilities and payoffs are evaluated. Unsupported joint-market combinations retain an explicit unsupported state.

→ [Atomic position model](eivra-studio/src/lib/atomicParlay.js) · [Portfolio workspace](eivra-studio/src/pages/ComboPage.jsx)

### Outcomes, simulated

**Seeded Monte Carlo simulation** makes repeated evaluations reproducible. Shared-event draws preserve the relationship between positions that depend on the same underlying match. The resulting distributions support inspection of profitability, losses, and drawdowns under the model's assumptions.

A separate dependency layer explores **FGM copula relationships** and **Shapley-style allocation of a proxy interaction index**. These diagnostics are labeled as exploratory indices; they do not establish calibrated tail probabilities or causal risk contributions.

→ [Simulation regression tests](eivra-studio/src/lib/__tests__/simulationEngine.test.js) · [Dependency-risk regression tests](eivra-studio/src/lib/__tests__/dependencyRisk.test.js)

### Evidence, time-aware

**Walk-forward and prequential evaluation** organize observations by when they could have been known. Forecast provenance, event identity, and outcome availability are explicit parts of the data contract. Recorded timestamps and derived legacy assumptions remain distinguishable.

Unreliable estimates have an unavailable state. Repeated copies of the same identifiable observation are not treated as independent evidence. Research outputs retain these limitations rather than hiding them behind a precise-looking number.

→ [Temporal data contract](eivra-studio/src/lib/temporalValidation.js) · [Forecast snapshots](eivra-studio/src/lib/investmentForecast.js) · [Historical audit notes](eivra-studio/docs/audits/)

## Built as a system

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

## Explore the workspace

| Area | Route | Purpose |
| --- | --- | --- |
| New | `/new` | Capture a thesis and create a structured position |
| Portfolio | `/combo` | Inspect candidate combinations, allocation, and dependency diagnostics |
| Settle | `/settle` | Record outcomes and close the feedback loop |
| Dashboard | `/dashboard` | Review capital and aggregate performance |
| Analysis & Metrics | `/dashboard/analysis` · `/dashboard/metrics` | Investigate performance slices and calibration |
| Seasons | `/dashboard/report` | Review a research period in context |
| Quants | `/quants` | Explore strategies, result history, and odds history |
| History & Teams | `/history` · `/history/teams` | Revisit decisions and event-level profiles |
| Console | `/params` | Inspect parameters, validation, and configuration |

The [live workspace](https://hydeclanspi.vercel.app) provides an interactive demo. Its existing visual identity remains in place while the Eivra identity is developed. **Eivra Studio** is the official name for the repository, portfolio, and CV.

## Run locally

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

## Project status

Eivra Studio is an independently developed research and portfolio project with a working application, an evolving model stack, and a maintained regression suite. Its current capabilities are described above; research proposals and historical design notes are not release commitments.

The repository demonstrates quantitative reasoning, analytical engineering, and product design. It makes no claim of independently verified alpha or institutional production readiness. Analysis is provided for research and demonstration, not investment advice.

**Eivra Models** and **Eivra Research** are reserved directions for a future product family. **Acuen** remains a candidate name for a future sub-feature. Neither naming direction implies a separately released product. See the [brand record](eivra-studio/docs/brand-identity.md).
