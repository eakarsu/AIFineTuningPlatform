# Audit Apply Notes — AIFineTuningPlatform

Audit source: `_AUDIT/reports/batch_03.md` (#29). Audit verdict: template-clone with **0 AI endpoints**.

## Reality check

The audit appears stale. The codebase already has substantial AI:
- `fineTuningJobs.js` — `POST /:id/ai-optimize` (param recommendations)
- `evaluations.js` — `POST /:id/ai-run`
- `modelComparisons.js` — `POST /:id/ai-analyze`
- `trainingConfigs.js` — `POST /ai-suggest` (hyperparameter suggestions)
- `inference.js` — proxy through OpenRouter
- AI helpers in `dataPipelines.js`, `datasets.js`, `promptTemplates.js`, `customModels.js`, `deployments.js`, `baseModels.js`.

So `/recommend-params`, `/evaluate-model`, `/compare-models`, `/fine-tune` are effectively present.

## Implementation applied

Added one mechanical endpoint covering the audit's "cost estimation" gap and a `customFeature` from the audit list:

1. `POST /api/cost-estimator/estimate` (`backend/src/routes/costEstimator.js`)
   - Deterministic local cost calculation (training hours, GPU $/hr, overhead).
   - Optional AI narrative with cost-reduction levers (LoRA/QLoRA/distillation/etc.).
   - Persists results via existing `saveAiResult` pipeline.
   - Wired into `server.js` at `/api/cost-estimator`.
   - Syntax-checked via `node --check`.

## Backlog (prioritized)

### Mechanical
- Aggregate "model marketplace" listing — list public custom_models with metrics; metadata only.
- One-click deployment template (already half-implemented in deployments.js).

### Needs creds / external
- Hugging Face / PyTorch Hub integration for base models.
- AWS/Azure/GCP deployment targets.

### Needs product decision
- Pricing for the marketplace, revenue sharing model.
- Drift detection retraining cadence.

### Custom features
- Bayesian hyperparameter search.
- Prompt A/B tester with stat-sig calc.

## Apply pass 4 (mechanical backlog)

Two custom-feature backlog items implemented end-to-end:

| # | Feature | BE | FE |
|---|---------|----|----|
| 1 | Bayesian hyperparameter search (acquisition-function-style suggester over a JSON search space, returns next trials with EI/uncertainty) | `backend/src/routes/bayesianSearch.js` → `POST /api/bayesian-search/suggest` | `frontend/src/pages/BayesianSearchPage.jsx` (route `/bayesian-search`, Operations nav section) |
| 2 | Prompt A/B tester with statistical significance (deterministic Welch's t-test approximation + LLM judge) | `backend/src/routes/promptABTester.js` → `POST /api/prompt-ab/compare` | `frontend/src/pages/PromptABTesterPage.jsx` (route `/prompt-ab`, Operations nav section) |

Both reuse existing `callOpenRouter`+`parseAIJson` helpers and persist to `ai_results` via `saveAiResult`. Return **503** when `OPENROUTER_API_KEY` is unset (also wraps helper-thrown errors). FE pages use existing axios `services/api.js` (bearer interceptor) and styling identical to `CostEstimatorPage.jsx`. Wired in `server.js`, `App.jsx`, and `Layout.jsx` (icons `FiTarget`, `FiGitBranch`).

Smoke tested on `BACKEND_PORT=4901` against a registered user — both endpoints returned 200 with structured payloads.

Backlog still open: model marketplace listing, one-click deployment template, HF/PyTorch Hub & cloud target integrations.

## Apply pass 3 (frontend)

- **Stack:** Express backend + Vite-React 18 frontend (`frontend/src`) with `react-router-dom`, `react-hot-toast`, `axios` via `services/api.js` (interceptor attaches `Bearer ${localStorage.token}`), `AuthContext`.
- **Backend AI endpoints (verified):** `fineTuningJobs.js /:id/ai-optimize`, `evaluations.js /:id/ai-run`, `modelComparisons.js /:id/ai-analyze`, `trainingConfigs.js /ai-suggest`, `customModels.js /:id/ai-evaluate /:id/infer /:id/compare-to-base`, `dataPipelines.js /:id/ai-optimize`, `datasets.js /:id/ai-analyze`, `promptTemplates.js /ai-generate`, `deployments.js /:id/ai-scale`, `inference.js`, `costEstimator.js /estimate`, `webhooks.js`.
- **FE coverage:** Every AI endpoint has a matching page (`FineTuningJobsPage`, `EvaluationsPage`, `ModelComparisonsPage`, `TrainingConfigsPage`, `CustomModelsPage`, `DataPipelinesPage`, `DatasetsPage`, `PromptTemplatesPage`, `DeploymentsPage`, `InferencePage`, `CostEstimatorPage`, `WebhooksPage`).
- **Action:** **FE already wired** — no changes.

