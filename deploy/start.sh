#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Hash Algorithm Visualizer - Start Production Server
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

PORT="${PORT:-3002}"
HOST="${HOST:-0.0.0.0}"

cd "${APP_DIR}"

# Ensure dist build exists
if [ ! -d "${APP_DIR}/dist" ]; then
    echo "Production build not found in ${APP_DIR}/dist. Running deploy first..."
    "${SCRIPT_DIR}/deploy.sh"
fi

exec node "${SCRIPT_DIR}/server.cjs"
