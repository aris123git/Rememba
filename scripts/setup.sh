#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/apps/web"
npx prisma generate
npx prisma db push
cd "$ROOT/apps/ai-service"
.venv/bin/python -c "from app.model_store import ensure_models; ensure_models()"
