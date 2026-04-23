#!/bin/bash
# ==========================================================================
# Scheduled apt upgrade + reboot — run once via `at` outside sending window
# ==========================================================================
#
# Usage (manual):
#   chmod +x scheduled-upgrade.sh
#   echo /root/scheduled-upgrade.sh | at 22:00 today
#
# What it does:
#   1. Notifies Telegram that upgrade is starting
#   2. Runs apt-get update + non-interactive full upgrade
#   3. Notifies Telegram with packages upgraded
#   4. Schedules a post-reboot verification notification (via systemd
#      one-shot) that pings Telegram once services are back up
#   5. Reboots the VPS
#
# Logs: /var/log/scheduled-upgrade.log
# Failure behaviour: if apt upgrade fails, reboot is NOT triggered and
# Telegram is alerted with the error.
# ==========================================================================

set -u -o pipefail

LOG=/var/log/scheduled-upgrade.log
exec > >(tee -a "$LOG") 2>&1

echo "=== [$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Scheduled upgrade starting ==="

# Pull Telegram creds from an existing script (avoids duplicating secrets)
TG_BOT=$(grep -oP "TG_BOT='\K[^']+" /opt/mail-security/check-spamhaus-dns.sh 2>/dev/null || true)
TG_CHAT=$(grep -oP "TG_CHAT='\K[^']+" /opt/mail-security/check-spamhaus-dns.sh 2>/dev/null || true)

tg() {
  local msg="$1"
  if [ -n "${TG_BOT:-}" ] && [ -n "${TG_CHAT:-}" ]; then
    curl -sS --max-time 10 -X POST \
      "https://api.telegram.org/bot${TG_BOT}/sendMessage" \
      -d chat_id="${TG_CHAT}" \
      -d text="${msg}" >/dev/null || true
  fi
  echo ">>> TG: ${msg}"
}

# ---------------------------------------------------------------------------
# 1. Announce start
# ---------------------------------------------------------------------------
tg "🔧 SCHEDULED UPGRADE STARTING on $(hostname). apt update + upgrade + reboot in progress. Log: ${LOG}"

# ---------------------------------------------------------------------------
# 2. apt update + upgrade
# ---------------------------------------------------------------------------
export DEBIAN_FRONTEND=noninteractive

echo ""
echo "--- apt-get update ---"
apt-get update -q

echo ""
echo "--- apt list --upgradable (pre-upgrade snapshot) ---"
UPGRADABLE=$(apt list --upgradable 2>/dev/null | tail -n +2 | wc -l)
apt list --upgradable 2>/dev/null | head -60

echo ""
echo "--- apt-get upgrade -y ---"
if ! apt-get -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" upgrade -y; then
  tg "❌ SCHEDULED UPGRADE FAILED — apt-get upgrade returned non-zero. Reboot ABORTED. Check ${LOG} on $(hostname)."
  exit 1
fi

# ---------------------------------------------------------------------------
# 3. Install post-reboot verification service (runs ONCE on next boot)
# ---------------------------------------------------------------------------
cat > /etc/systemd/system/post-reboot-verify.service << 'EOF_SERVICE'
[Unit]
Description=Post-upgrade verification (one-shot after reboot)
After=network-online.target docker.service postfix.service
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/root/post-reboot-verify.sh
RemainAfterExit=no

[Install]
WantedBy=multi-user.target
EOF_SERVICE

cat > /root/post-reboot-verify.sh << 'EOF_VERIFY'
#!/bin/bash
set -u
sleep 45  # let services finish starting
TG_BOT=$(grep -oP "TG_BOT='\K[^']+" /opt/mail-security/check-spamhaus-dns.sh 2>/dev/null)
TG_CHAT=$(grep -oP "TG_CHAT='\K[^']+" /opt/mail-security/check-spamhaus-dns.sh 2>/dev/null)

services_status=""
for s in postfix dovecot pmta opendkim; do
  state=$(systemctl is-active "$s" 2>&1)
  services_status+="${s}=${state}  "
done

docker_status=""
if command -v docker >/dev/null; then
  docker_status=$(docker ps --format '{{.Names}}:{{.Status}}' 2>/dev/null | grep -E '^bl-' | tr '\n' ' ')
fi

uptime_short=$(uptime -p)

msg="✅ POST-UPGRADE REBOOT COMPLETE on $(hostname)
Uptime: ${uptime_short}
Services: ${services_status}
Docker: ${docker_status:-none}
Log: /var/log/scheduled-upgrade.log"

if [ -n "${TG_BOT:-}" ] && [ -n "${TG_CHAT:-}" ]; then
  curl -sS --max-time 10 -X POST \
    "https://api.telegram.org/bot${TG_BOT}/sendMessage" \
    -d chat_id="${TG_CHAT}" \
    --data-urlencode "text=${msg}" >/dev/null || true
fi

# Self-disable: this service must run only once, not on every boot
systemctl disable post-reboot-verify.service >/dev/null 2>&1 || true
EOF_VERIFY
chmod +x /root/post-reboot-verify.sh

systemctl daemon-reload
systemctl enable post-reboot-verify.service

# ---------------------------------------------------------------------------
# 4. Announce reboot + go
# ---------------------------------------------------------------------------
tg "✅ Upgrade OK (${UPGRADABLE} packages). Rebooting ${HOSTNAME} in 30s. Post-reboot verification service armed."

echo ""
echo "--- reboot in 30s ---"
sleep 30
systemctl reboot
