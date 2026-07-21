#!/usr/bin/env bash
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
if [[ -f .env ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=(.*)$ ]] || continue
    key="${BASH_REMATCH[1]}"; value="${BASH_REMATCH[2]}"
    if [[ "$value" == \"*\" && "$value" == *\" ]] || [[ "$value" == \'*\' && "$value" == *\' ]]; then value="${value:1:${#value}-2}"; fi
    [[ -n "${!key+x}" ]] || export "$key=$value"
  done < .env
fi
BACKEND_PORT="${BACKEND_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
CLIENT_URL="${CLIENT_URL:-http://127.0.0.1:$FRONTEND_PORT}"
export BACKEND_PORT FRONTEND_PORT CLIENT_URL
for directory in backend/node_modules frontend/node_modules; do
  [[ -d "$directory" ]] || { echo "Missing $directory; install dependencies explicitly first." >&2; exit 1; }
done
for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then echo "Port $port is already in use; refusing to stop another process." >&2; exit 1; fi
done
(cd backend && npm start) & BACKEND_PID=$!
(cd frontend && npm run dev -- --port "$FRONTEND_PORT" --host 127.0.0.1) & FRONTEND_PID=$!
cleanup() { kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true; wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
echo "Fine-tuning API: http://127.0.0.1:$BACKEND_PORT; UI: http://127.0.0.1:$FRONTEND_PORT"
wait "$BACKEND_PID" "$FRONTEND_PID"
