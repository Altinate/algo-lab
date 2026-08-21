# Deployment & Boot Service Guide

This folder contains scripts to build, deploy, run, and configure the Hash Algorithm Visualizer to start automatically on system boot.

---

## 📁 Files in this Folder

| File | Description |
|---|---|
| [`deploy.sh`](./deploy.sh) | Installs dependencies, runs test suite, builds production assets in `dist/` |
| [`start.sh`](./start.sh) | Starts the production web server with **automatic port collision detection** (default: `3002`) |
| [`install-service.sh`](./install-service.sh) | Installs & enables the systemd service for boot startup |
| [`hash-visualizer.service`](./hash-visualizer.service) | Systemd unit configuration file |

---

## 🚀 Quick Start

### 1. Build and Deploy

```bash
chmod +x deploy/*.sh
./deploy/deploy.sh
```

### 2. Run Directly in Terminal

```bash
# Default (port 3002, auto-increments if in use)
./deploy/start.sh

# Or with custom port / host
PORT=8080 HOST=127.0.0.1 ./deploy/start.sh
```

---

## 🔄 Start on Boot (Systemd)

### Option A: System-Wide Service (Recommended with sudo)

Run the installer with `sudo`:

```bash
sudo ./deploy/install-service.sh
```

Manage the service:
```bash
# Check status
sudo systemctl status hash-visualizer

# Restart service
sudo systemctl restart hash-visualizer

# Stop service
sudo systemctl stop hash-visualizer

# View live logs
sudo journalctl -u hash-visualizer -f
```

---

### Option B: User-Level Service (Without sudo)

```bash
./deploy/install-service.sh
```

To allow user services to start on boot without requiring an active SSH/desktop login:
```bash
sudo loginctl enable-linger $USER
```

Manage the user service:
```bash
systemctl --user status hash-visualizer
systemctl --user restart hash-visualizer
journalctl --user -u hash-visualizer -f
```

---

### Option C: Crontab (`@reboot`) Fallback

If systemd is not available, you can add a crontab entry:

```bash
(crontab -l 2>/dev/null; echo "@reboot /home/ubuntu/Work/www/hash/deploy/start.sh >> /home/ubuntu/Work/www/hash/server.log 2>&1") | crontab -
```
