#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Hash Algorithm Visualizer - Stop Background Server
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PID_FILE="${APP_DIR}/.server.pid"

STOPPED=0

# Check PM2
if command -v pm2 >/dev/null 2>&1; then
    if pm2 list | grep -q "hash-visualizer"; then
        echo "=== Stopping PM2 process: hash-visualizer ==="
        pm2 stop hash-visualizer || true
        pm2 delete hash-visualizer || true
        pm2 save || true
        STOPPED=1
    fi
fi

# Check PID file
if [ -f "${PID_FILE}" ]; then
    PID="$(cat "${PID_FILE}")"
    if kill -0 "${PID}" 2>/dev/null; then
        echo "=== Stopping background process PID ${PID} ==="
        kill "${PID}" 2>/dev/null || true
        sleep 1
        kill -9 "${PID}" 2>/dev/null || true
        STOPPED=1
    fi
    rm -f "${PID_FILE}"
fi

if [ "${STOPPED}" -eq 1 ]; then
    echo "✅ Hash Algorithm Visualizer has been stopped."
else
    echo "ℹ️  No running background instance of Hash Algorithm Visualizer was found."
fi
