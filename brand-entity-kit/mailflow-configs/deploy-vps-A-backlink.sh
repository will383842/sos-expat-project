#!/usr/bin/env bash
# ================================================================
# VPS A — Backlink Engine (Hetzner 204.168.180.175)
# ================================================================
#
# All-in-one deployment script for the press-outreach module.
# Copy-paste this entire block into your SSH root session on the VPS,
# OR: scp this file to /tmp/ and run `bash /tmp/deploy-vps-A-backlink.sh`
#
# Before running, fill in the SMTP_PASSWORDS section below with the
# passwords of your 5 presse@* inboxes from the Mailflow warmup setup.
#
# Safe to re-run — Prisma migrate is idempotent, seed uses upsert.

set -euo pipefail

# ────────────────────────────────────────────────────────────────
# CONFIG — Fill in your SMTP passwords before running
# ────────────────────────────────────────────────────────────────

# SMTP host (usually same as your existing Mailflow host)
PRESS_SMTP_HOST="${PRESS_SMTP_HOST:-mail.sos-expat.com}"
PRESS_SMTP_PORT="${PRESS_SMTP_PORT:-587}"
PRESS_SMTP_SECURE="${PRESS_SMTP_SECURE:-false}"

# If you have 5 presse@* inboxes (FR/EN/ES/DE + default) — fill the 5 passwords here.
# Leave empty ("") any language that uses the DEFAULT inbox.
PRESS_INBOX_FR_USER="${PRESS_INBOX_FR_USER:-presse-fr@sos-expat.com}"
PRESS_INBOX_FR_PASS="${PRESS_INBOX_FR_PASS:-FILL_ME}"
PRESS_INBOX_EN_USER="${PRESS_INBOX_EN_USER:-presse-en@sos-expat.com}"
PRESS_INBOX_EN_PASS="${PRESS_INBOX_EN_PASS:-FILL_ME}"
PRESS_INBOX_ES_USER="${PRESS_INBOX_ES_USER:-presse-es@sos-expat.com}"
PRESS_INBOX_ES_PASS="${PRESS_INBOX_ES_PASS:-FILL_ME}"
PRESS_INBOX_DE_USER="${PRESS_INBOX_DE_USER:-presse-de@sos-expat.com}"
PRESS_INBOX_DE_PASS="${PRESS_INBOX_DE_PASS:-FILL_ME}"
PRESS_INBOX_DEFAULT_USER="${PRESS_INBOX_DEFAULT_USER:-presse@sos-expat.com}"
PRESS_INBOX_DEFAULT_PASS="${PRESS_INBOX_DEFAULT_PASS:-FILL_ME}"

PRESS_PDF_BASE_URL="${PRESS_PDF_BASE_URL:-https://sos-expat.com}"
TELEGRAM_PRESS_CHAT_ID="${TELEGRAM_PRESS_CHAT_ID:-7560535072}"

# ────────────────────────────────────────────────────────────────
# Safety check — must run as root or with sudo
# ────────────────────────────────────────────────────────────────
if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: This script must run as root (or sudo bash $0)"
  exit 1
fi

if ! grep -qE "(FILL_ME)" <(env | grep PRESS_INBOX); then
  echo "✓ SMTP passwords provided"
else
  echo "⚠ Some SMTP passwords still = 'FILL_ME'."
  echo "  Edit the top of this script to set them, or export them before running."
  echo "  Continuing anyway — the worker will fail on those languages until fixed."
  echo ""
fi

BL_ROOT="${BL_ROOT:-/opt/backlink-engine}"

# ────────────────────────────────────────────────────────────────
# 1. Git pull
# ────────────────────────────────────────────────────────────────
echo "=== [1/5] git pull ==="
cd "$BL_ROOT"
git fetch origin main
git reset --hard origin/main
echo "✓ Repo updated to $(git rev-parse --short HEAD)"
echo ""

# ────────────────────────────────────────────────────────────────
# 2. Append env vars if not already present
# ────────────────────────────────────────────────────────────────
echo "=== [2/5] update .env ==="
ENV_FILE="$BL_ROOT/.env"
if ! grep -q "^PRESS_SMTP_HOST=" "$ENV_FILE" 2>/dev/null; then
  cat >> "$ENV_FILE" <<EOF

# ─── Press outreach (2026-04-22 Vague 4.3 brand entity) ───
PRESS_SMTP_HOST=$PRESS_SMTP_HOST
PRESS_SMTP_PORT=$PRESS_SMTP_PORT
PRESS_SMTP_SECURE=$PRESS_SMTP_SECURE
PRESS_INBOX_FR_USER=$PRESS_INBOX_FR_USER
PRESS_INBOX_FR_PASS=$PRESS_INBOX_FR_PASS
PRESS_INBOX_EN_USER=$PRESS_INBOX_EN_USER
PRESS_INBOX_EN_PASS=$PRESS_INBOX_EN_PASS
PRESS_INBOX_ES_USER=$PRESS_INBOX_ES_USER
PRESS_INBOX_ES_PASS=$PRESS_INBOX_ES_PASS
PRESS_INBOX_DE_USER=$PRESS_INBOX_DE_USER
PRESS_INBOX_DE_PASS=$PRESS_INBOX_DE_PASS
PRESS_INBOX_DEFAULT_USER=$PRESS_INBOX_DEFAULT_USER
PRESS_INBOX_DEFAULT_PASS=$PRESS_INBOX_DEFAULT_PASS
PRESS_PDF_BASE_URL=$PRESS_PDF_BASE_URL
TELEGRAM_PRESS_CHAT_ID=$TELEGRAM_PRESS_CHAT_ID
EOF
  echo "✓ Press env vars appended to $ENV_FILE"
else
  echo "⏭ Press env vars already present, skipping (edit manually if you want to change)"
fi
echo ""

# ────────────────────────────────────────────────────────────────
# 3. Prisma migrate (creates press_contacts table + enums)
# ────────────────────────────────────────────────────────────────
echo "=== [3/5] Prisma migrate ==="
if docker compose ps bl-app | grep -q "Up"; then
  docker compose exec -T bl-app npx prisma migrate deploy
else
  echo "bl-app container is not running. Starting it first..."
  docker compose up -d bl-app
  sleep 5
  docker compose exec -T bl-app npx prisma migrate deploy
fi
echo "✓ Migrations applied"
echo ""

# ────────────────────────────────────────────────────────────────
# 4. Restart + seed
# ────────────────────────────────────────────────────────────────
echo "=== [4/5] Restart + seed ==="
docker compose restart bl-app
sleep 8  # let Fastify boot + Prisma client regenerate
docker compose exec -T bl-app npx tsx prisma/seed-press-contacts.ts
echo "✓ Seeded press contacts"
echo ""

# ────────────────────────────────────────────────────────────────
# 5. Verify
# ────────────────────────────────────────────────────────────────
echo "=== [5/5] Health check ==="
sleep 3
BASE_URL="${BACKLINK_BASE_URL:-https://backlink.sos-expat.com}"
echo "Verifying SMTP inboxes..."
curl -sf -X POST "$BASE_URL/api/press/verify-inboxes" | python3 -m json.tool || echo "(API might require auth — check docs)"
echo ""
echo "Fetching stats (should show PENDING=~90)..."
curl -sf "$BASE_URL/api/press/stats" | python3 -m json.tool || echo "(API might require auth)"

echo ""
echo "============================================================"
echo "✓ Deployment complete."
echo ""
echo "Next step (dry-run to preview):"
echo "  curl -X POST $BASE_URL/api/press/outreach/start \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"status\":\"PENDING\",\"dryRun\":true,\"limit\":5}'"
echo ""
echo "Then go live (when ready):"
echo "  curl -X POST $BASE_URL/api/press/outreach/start \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"status\":\"PENDING\",\"campaignTag\":\"2026-Q2-launch\"}'"
echo "============================================================"
