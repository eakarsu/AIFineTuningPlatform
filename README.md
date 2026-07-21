# AI Fine-Tuning Platform

The supported backend boundary is `/api/governed-lifecycle`: licensed/checksummed dataset versions, split-leakage evidence, reproducible recipes, resource caps, separate training approval, external execution recording, evaluation evidence, scanned artifacts, and a distinct deployment approval. It does not train or deploy models.

Copy `.env.example` to `.env`. Apply schema only with `ALLOW_DATABASE_MIGRATION=1 npm --prefix backend run db:init`; bootstrap only with the guarded script. `./start.sh` is nondestructive. Background simulated training was removed and legacy demo routes are disabled by default.

Object storage, GPU orchestration, model registry/gateway, provider adapters, monitoring, and production safety validation remain external blockers.
