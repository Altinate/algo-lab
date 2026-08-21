#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Hash Algorithm Visualizer - Start Headless in Background
# Uses PM2 if available, otherwise falls back to nohup daemon
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PID_FILE="${APP_DIR}/.server.pid"
LOG_FILE="${APP_DIR}/server.log"

cd "${APP_DIR}"

# Ensure dist exists
if [ ! -d "${APP_DIR}/dist" ]; then
    echo "Production build not found. Running deploy script first..."
    "${SCRIPT_DIR}/deploy.sh"
fi

if command -v pm2 >/dev/null 2>&1; then
    echo "=== Starting in background with PM2 ==="
    pm2 start "${APP_DIR}/ecosystem.config.cjs"
    pm2 save || true
    echo "=== Service started with PM2! ==="
    pm2 status hash-visualizer
else
    # Fallback to nohup
    if [ -f "${PID_FILE}" ] && kill -0 "$(cat "${PID_FILE}")" 2>/dev/null; then
        echo "⚠️  Server is already running with PID $(cat "${PID_FILE}")"
        exit 0
    fi

    echo "=== Starting in background with nohup ==="
    nohup "${SCRIPT_DIR}/start.sh" > "${LOG_FILE}" 2>&1 &
    PID=$!
    echo "${PID}" > "${PID_FILE}"
    sleep 2

    if kill -0 "${PID}" 2>/dev/null; then
        echo "✅ Server started in background with PID: ${PID}"
        echo "📜 Logs: ${LOG_FILE}"
    else
        echo "❌ Server failed to start. Showing logs:"
        cat "${LOG_FILE}"
        exit 1
    fi
fi
