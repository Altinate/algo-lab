#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Hash Algorithm Visualizer - Status Check
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PID_FILE="${APP_DIR}/.server.pid"
LOG_FILE="${APP_DIR}/server.log"

echo "=============================================================================="
echo "📊 Hash Algorithm Visualizer Status"
echo "=============================================================================="

# Check PM2
if command -v pm2 >/dev/null 2>&1 && pm2 list | grep -q "hash-visualizer"; then
    echo "▶️  PM2 Status:"
    pm2 show hash-visualizer || pm2 status hash-visualizer
elif [ -f "${PID_FILE}" ] && kill -0 "$(cat "${PID_FILE}")" 2>/dev/null; then
    PID="$(cat "${PID_FILE}")"
    echo "▶️  Background Daemon Status: RUNNING (PID ${PID})"
    echo "📜 Recent Logs (${LOG_FILE}):"
    tail -n 15 "${LOG_FILE}" 2>/dev/null || true
else
    echo "⏸️  Background Status: STOPPED"
fi

# Check systemd status if installed
if systemctl is-active --quiet hash-visualizer 2>/dev/null; then
    echo "▶️  Systemd Service: ACTIVE (Running)"
elif systemctl is-enabled --quiet hash-visualizer 2>/dev/null; then
    echo "▶️  Systemd Service: ENABLED on boot (currently inactive)"
fi

echo "=============================================================================="
