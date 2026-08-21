#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Hash Algorithm Visualizer - Start Production Server
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

PORT="${PORT:-3000}"
HOST="${HOST:-0.0.0.0}"

cd "${APP_DIR}"

# Ensure dist exists
if [ ! -d "${APP_DIR}/dist" ]; then
    echo "Production build not found in ${APP_DIR}/dist. Running build first..."
    npm run build
fi

echo "Starting Hash Algorithm Visualizer on http://${HOST}:${PORT}..."
exec npm run preview -- --host "${HOST}" --port "${PORT}"
