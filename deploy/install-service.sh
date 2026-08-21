#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Hash Algorithm Visualizer - Install and Enable Boot Service
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
SERVICE_NAME="hash-visualizer.service"
SERVICE_SRC="${SCRIPT_DIR}/${SERVICE_NAME}"
SYSTEM_SERVICE_DST="/etc/systemd/system/${SERVICE_NAME}"
USER_SERVICE_DIR="${HOME}/.config/systemd/user"
USER_SERVICE_DST="${USER_SERVICE_DIR}/${SERVICE_NAME}"

# First ensure deploy build is done
echo "=== Step 1: Running deployment build ==="
"${SCRIPT_DIR}/deploy.sh"

# Make start script executable
chmod +x "${SCRIPT_DIR}/start.sh"
chmod +x "${SCRIPT_DIR}/deploy.sh"

# Check if running with root/sudo for system-wide service
if [ "$(id -u)" -eq 0 ]; then
    echo "=== Step 2: Installing system-wide systemd service (${SYSTEM_SERVICE_DST}) ==="
    cp "${SERVICE_SRC}" "${SYSTEM_SERVICE_DST}"
    systemctl daemon-reload
    systemctl enable "${SERVICE_NAME}"
    systemctl restart "${SERVICE_NAME}"
    echo "=== Service installed and started successfully! ==="
    systemctl status "${SERVICE_NAME}" --no-pager
else
    echo "=== Step 2: Installing user-level systemd service (${USER_SERVICE_DST}) ==="
    mkdir -p "${USER_SERVICE_DIR}"
    cp "${SERVICE_SRC}" "${USER_SERVICE_DST}"
    systemctl --user daemon-reload
    systemctl --user enable "${SERVICE_NAME}"
    systemctl --user restart "${SERVICE_NAME}" || true
    echo ""
    echo "=============================================================================="
    echo " User service installed at: ${USER_SERVICE_DST}"
    echo " Enabled to run on boot."
    echo ""
    echo " To enable lingering (so user service starts on boot without login):"
    echo "   sudo loginctl enable-linger ${USER}"
    echo ""
    echo " For full system-wide installation, run:"
    echo "   sudo ${SCRIPT_DIR}/install-service.sh"
    echo "=============================================================================="
fi
