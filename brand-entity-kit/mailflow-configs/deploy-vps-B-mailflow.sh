#!/usr/bin/env bash
# ================================================================
# VPS B — Mailflow (Hetzner 95.216.179.163)
# ================================================================
#
# All-in-one deployment script for the Google Alerts → Telegram bridge.
# Copy-paste this entire block into your SSH root session on the Mailflow VPS,
# OR: scp this file to /tmp/ and run `bash /tmp/deploy-vps-B-mailflow.sh`
#
# 2026-04-22 UPDATE (owner feedback):
#   - alerts@sos-expat.com does NOT exist → we use contact@sos-expat.com
#     which already exists in Mailflow.
#   - This script does NOT create any alias. It just deploys the Python
#     parser and wires it into the existing forwarder loop.
#
# Before running, set TELEGRAM_BOT_TOKEN with your @sosexpat_admin_bot token.

set -euo pipefail

# ────────────────────────────────────────────────────────────────
# CONFIG — Fill in before running
# ────────────────────────────────────────────────────────────────

TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-FILL_ME}"
TELEGRAM_PRESS_CHAT_ID="${TELEGRAM_PRESS_CHAT_ID:-7560535072}"

# Path to your existing Mailflow forwarder (adjust if different on your VPS)
MAILFLOW_DIR="${MAILFLOW_DIR:-/opt/mail-forwarder}"

# Inbox that will receive Google Alerts emails (we use the existing one)
GOOGLE_ALERTS_INBOX="${GOOGLE_ALERTS_INBOX:-contact@sos-expat.com}"

# ────────────────────────────────────────────────────────────────
# Safety checks
# ────────────────────────────────────────────────────────────────
if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: This script must run as root (or sudo bash $0)"
  exit 1
fi

if [ "$TELEGRAM_BOT_TOKEN" = "FILL_ME" ]; then
  echo "⚠ TELEGRAM_BOT_TOKEN is still 'FILL_ME'."
  echo "  Set it at the top of this script, or export before running:"
  echo "    export TELEGRAM_BOT_TOKEN=123456:ABC-DEF..."
  echo ""
  read -r -p "Continue anyway (the bridge will not post to Telegram)? [y/N] " response
  if [[ ! "$response" =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

if [ ! -d "$MAILFLOW_DIR" ]; then
  echo "ERROR: $MAILFLOW_DIR not found. Adjust MAILFLOW_DIR at top of script."
  exit 1
fi

# ────────────────────────────────────────────────────────────────
# 1. Install Python deps if missing
# ────────────────────────────────────────────────────────────────
echo "=== [1/5] Python deps ==="
pip3 list 2>/dev/null | grep -q "beautifulsoup4" || pip3 install beautifulsoup4
pip3 list 2>/dev/null | grep -q "requests" || pip3 install requests
echo "✓ Python deps OK"
echo ""

# ────────────────────────────────────────────────────────────────
# 2. Download the parser from GitHub
# ────────────────────────────────────────────────────────────────
echo "=== [2/5] Download Google Alerts parser ==="
PARSER_URL="https://raw.githubusercontent.com/will383842/sos-expat-project/main/brand-entity-kit/mailflow-configs/forwarder-google-alerts.py"
curl -fsS -o "$MAILFLOW_DIR/forwarder_google_alerts.py" "$PARSER_URL"
chmod 644 "$MAILFLOW_DIR/forwarder_google_alerts.py"
echo "✓ Parser installed to $MAILFLOW_DIR/forwarder_google_alerts.py"
echo ""

# ────────────────────────────────────────────────────────────────
# 3. Append env vars to Mailflow .env (if not already present)
# ────────────────────────────────────────────────────────────────
echo "=== [3/5] update .env ==="
ENV_FILE="$MAILFLOW_DIR/.env"
touch "$ENV_FILE"
if ! grep -q "^TELEGRAM_BOT_TOKEN=" "$ENV_FILE"; then
  {
    echo ""
    echo "# ─── Google Alerts → Telegram bridge (2026-04-22 brand entity) ───"
    echo "TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN"
    echo "TELEGRAM_PRESS_CHAT_ID=$TELEGRAM_PRESS_CHAT_ID"
    echo "GOOGLE_ALERTS_INBOX=$GOOGLE_ALERTS_INBOX"
  } >> "$ENV_FILE"
  echo "✓ Env vars appended to $ENV_FILE"
else
  echo "⏭ TELEGRAM_BOT_TOKEN already present, skipping"
fi
echo ""

# ────────────────────────────────────────────────────────────────
# 4. Wire the parser into forwarder.py (prepends an auto-block)
# ────────────────────────────────────────────────────────────────
echo "=== [4/5] Integrate parser into forwarder.py ==="
FORWARDER="$MAILFLOW_DIR/forwarder.py"

if [ ! -f "$FORWARDER" ]; then
  echo "WARN: $FORWARDER not found. Your Mailflow may use a different main file."
  echo "      Manually add this to the top of your main loop:"
  echo ""
  cat <<'HINT'
      from forwarder_google_alerts import is_google_alert, handle_google_alert

      # In your main message-processing loop:
      if is_google_alert(msg):
          handle_google_alert(msg)
          continue  # skip the rest of the rules for this message
HINT
else
  if grep -q "from forwarder_google_alerts" "$FORWARDER"; then
    echo "⏭ forwarder.py already imports forwarder_google_alerts, skipping wire-up"
  else
    # Backup first
    BACKUP="$FORWARDER.bak.$(date +%s)"
    cp "$FORWARDER" "$BACKUP"
    echo "✓ Backup: $BACKUP"

    # Insert import after last `import` line
    # (Safer than manipulating the main loop — the user can add the
    # if-call manually if they want custom logic ordering.)
    python3 <<PYEOF
import re
path = "$FORWARDER"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

import_line = "from forwarder_google_alerts import is_google_alert, handle_google_alert"

if import_line not in content:
    # Insert after the last existing 'import' or 'from ... import' line
    lines = content.split("\n")
    last_import_idx = -1
    for i, line in enumerate(lines):
        if re.match(r"^(import |from \w+ import)", line):
            last_import_idx = i
    if last_import_idx >= 0:
        lines.insert(last_import_idx + 1, import_line)
        new_content = "\n".join(lines)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("  Inserted import at line " + str(last_import_idx + 2))
    else:
        print("  WARN: could not find an import line; manual wire-up required")
PYEOF
    echo ""
    echo "⚠ Import added. You still need to add this check in your main loop:"
    echo ""
    cat <<'HINT'
    # In your message-processing loop (adjust to match your code):
    if is_google_alert(msg):
        handle_google_alert(msg)
        continue
HINT
    echo ""
    echo "  Then verify the forwarder.py changes with: git diff or cat $FORWARDER"
  fi
fi
echo ""

# ────────────────────────────────────────────────────────────────
# 5. Restart + test
# ────────────────────────────────────────────────────────────────
echo "=== [5/5] Restart forwarder ==="
if systemctl list-units --type=service | grep -q "mail-forwarder"; then
  systemctl restart mail-forwarder
  echo "✓ systemctl restarted mail-forwarder"
elif [ -f "$MAILFLOW_DIR/cron.sh" ]; then
  echo "(cron-based forwarder; next cron tick will pick up new parser)"
else
  echo "WARN: could not auto-restart. Restart your Mailflow process manually."
fi
echo ""

echo "============================================================"
echo "✓ VPS B deployment complete."
echo ""
echo "Next step (Google Alerts side, browser):"
echo "  1. Go to https://google.com/alerts"
echo "  2. Create 18 alerts — see brand-entity-kit/12-kpis-monitoring.md"
echo "  3. Set delivery email to: $GOOGLE_ALERTS_INBOX"
echo "  4. Trigger test: tweet \"Testing SOS-Expat brand entity\" from a"
echo "     new account Google doesn't know. Alert should arrive within"
echo "     15-60 min → Telegram notification in chat $TELEGRAM_PRESS_CHAT_ID"
echo "============================================================"
