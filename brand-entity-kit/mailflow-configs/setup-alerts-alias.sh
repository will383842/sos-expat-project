#!/usr/bin/env bash
# Setup alerts@sos-expat.com alias on the Mailflow VPS (Hetzner).
#
# Usage (on the VPS, as root):
#   bash setup-alerts-alias.sh
#
# What it does:
#   1. Adds `alerts@sos-expat.com` to /etc/postfix/virtual as an alias
#      to an existing inbox (presse@ by default — change if needed).
#   2. Reloads Postfix.
#   3. Verifies the alias resolves.
#
# If your Mailflow runs in Docker with its own SMTP stack (Postal, Haraka,
# Maddy, etc.), adapt accordingly. This script assumes standard Postfix +
# virtual aliases file.

set -e

DOMAIN="sos-expat.com"
ALIAS_USER="alerts"
FORWARD_TO="${FORWARD_TO:-presse@sos-expat.com}"

VIRTUAL_FILE="/etc/postfix/virtual"
BACKUP_FILE="/etc/postfix/virtual.bak.$(date +%s)"

echo "=== Mailflow alerts@ alias setup ==="
echo "Alias: ${ALIAS_USER}@${DOMAIN} → ${FORWARD_TO}"
echo

if [ ! -f "$VIRTUAL_FILE" ]; then
  echo "ERROR: $VIRTUAL_FILE not found. Is Postfix configured with virtual aliases?"
  echo "If your Mailflow uses Postal/Maddy/other, configure the alias in its admin UI instead."
  exit 1
fi

# Check if alias already exists
if grep -qE "^${ALIAS_USER}@${DOMAIN}" "$VIRTUAL_FILE"; then
  echo "Alias ${ALIAS_USER}@${DOMAIN} already exists in ${VIRTUAL_FILE}, skipping."
else
  # Backup
  cp "$VIRTUAL_FILE" "$BACKUP_FILE"
  echo "Backup created: $BACKUP_FILE"

  # Append alias
  echo "" >> "$VIRTUAL_FILE"
  echo "# Added by brand-entity-kit setup-alerts-alias.sh ($(date -Iseconds))" >> "$VIRTUAL_FILE"
  echo "${ALIAS_USER}@${DOMAIN}   ${FORWARD_TO}" >> "$VIRTUAL_FILE"
  echo "✓ Alias appended."

  # Rebuild postmap
  postmap "$VIRTUAL_FILE"
  echo "✓ postmap rebuilt."

  # Reload postfix
  systemctl reload postfix
  echo "✓ Postfix reloaded."
fi

# Verify with postmap lookup
echo
echo "=== Verification ==="
RESOLVED=$(postmap -q "${ALIAS_USER}@${DOMAIN}" "$VIRTUAL_FILE" 2>/dev/null || true)
if [ "$RESOLVED" = "$FORWARD_TO" ]; then
  echo "✓ ${ALIAS_USER}@${DOMAIN} correctly resolves to ${FORWARD_TO}"
else
  echo "⚠ Resolution mismatch. Got: '${RESOLVED}' — expected: '${FORWARD_TO}'"
  echo "  Check ${VIRTUAL_FILE} manually."
fi

echo
echo "=== Next steps ==="
echo "1. Create your 18 Google Alerts at https://google.com/alerts"
echo "   → Deliver to: ${ALIAS_USER}@${DOMAIN}"
echo "2. Deploy forwarder-google-alerts.py:"
echo "     cp forwarder-google-alerts.py /opt/mail-forwarder/"
echo "3. Wire it into your existing forwarder.py:"
echo "     from forwarder_google_alerts import is_google_alert, handle_google_alert"
echo "     # In your main loop, if is_google_alert(msg): handle_google_alert(msg)"
echo "4. Set env var TELEGRAM_BOT_TOKEN in /opt/mail-forwarder/.env"
echo "5. Restart the forwarder cron/service:"
echo "     systemctl restart mail-forwarder.service  # or equivalent"
echo "6. Trigger a test alert (tweet with 'SOS-Expat' mention) — expect"
echo "   a Telegram message in chat 7560535072 within 15-60 min."
