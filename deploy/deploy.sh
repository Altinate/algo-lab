#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Hash Algorithm Visualizer - Deployment Script
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=== [1/4] Entering project directory: ${APP_DIR} ==="
cd "${APP_DIR}"

echo "=== [2/4] Installing dependencies ==="
npm ci || npm install

echo "=== [3/4] Running automated test suite ==="
npm run test:run

echo "=== [4/4] Building production bundle ==="
npm run build

echo "=============================================================================="
echo " Deployment build completed successfully!"
echo " Production files ready in: ${APP_DIR}/dist"
echo " You can start the server using: ${SCRIPT_DIR}/start.sh"
echo " Or enable on boot using:        sudo ${SCRIPT_DIR}/install-service.sh"
echo "=============================================================================="
