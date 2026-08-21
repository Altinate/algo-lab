#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Hash Algorithm Visualizer - Start Production Server
# Includes automatic port collision detection and auto-selection
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

HOST="${HOST:-0.0.0.0}"
DESIRED_PORT="${PORT:-3002}"

is_port_in_use() {
    local port="$1"
    if command -v ss >/dev/null 2>&1; then
        ss -tuln | grep -q ":${port} " && return 0
    elif command -v lsof >/dev/null 2>&1; then
        lsof -i ":${port}" >/dev/null 2>&1 && return 0
    elif command -v nc >/dev/null 2>&1; then
        nc -z 127.0.0.1 "${port}" >/dev/null 2>&1 && return 0
    else
        python3 -c "import socket; s=socket.socket(); s.connect(('127.0.0.1', ${port})); s.close()" >/dev/null 2>&1 && return 0
    fi
    return 1
}

# Find free port starting from DESIRED_PORT
ACTUAL_PORT="${DESIRED_PORT}"
while is_port_in_use "${ACTUAL_PORT}"; do
    echo "⚠️  Port ${ACTUAL_PORT} is already in use by another process."
    ACTUAL_PORT=$((ACTUAL_PORT + 1))
    echo "➡️  Trying port ${ACTUAL_PORT}..."
done

cd "${APP_DIR}"

# Ensure dist build exists
if [ ! -d "${APP_DIR}/dist" ]; then
    echo "Production build not found in ${APP_DIR}/dist. Running build first..."
    npm run build
fi

echo "=============================================================================="
echo "🚀 Starting Hash Algorithm Visualizer"
echo "🌐 Local URL:   http://localhost:${ACTUAL_PORT}"
echo "🌐 Network URL: http://${HOST}:${ACTUAL_PORT}"
echo "=============================================================================="

exec npm run preview -- --host "${HOST}" --port "${ACTUAL_PORT}"
