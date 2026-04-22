#!/bin/bash
# Quick-install press-outreach on VPS mail (204.168.180.175).
# Run as root: curl -fsSL https://raw.githubusercontent.com/will383842/sos-expat-project/main/brand-entity-kit/mailflow-configs/quick-install-press.sh | bash
set -e

cd /opt/backlink-engine

echo "=== [1/5] git pull ==="
git fetch origin main && git reset --hard origin/main
echo "✓ $(git rev-parse --short HEAD)"
echo ""

echo "=== [2/5] .env update ==="
if ! grep -q "^PRESS_SMTP_HOST=" .env 2>/dev/null; then
  cat >> .env <<'ENV_EOF'

# Press outreach Vague 4.3 - Relay local Postfix (no auth, via host IP)
PRESS_SMTP_HOST=204.168.180.175
PRESS_SMTP_PORT=25
PRESS_SMTP_SECURE=false
PRESS_SMTP_NOAUTH=true
PRESS_INBOX_FR_USER=presse@hub-travelers.com
PRESS_INBOX_EN_USER=presse@plane-liberty.com
PRESS_INBOX_ES_USER=presse@providers-expat.com
PRESS_INBOX_DE_USER=presse@emilia-mullerd.com
PRESS_INBOX_DEFAULT_USER=presse@planevilain.com
PRESS_PDF_BASE_URL=https://sos-expat.com
TELEGRAM_PRESS_CHAT_ID=7560535072
ENV_EOF
  echo "✓ appended"
else
  echo "⏭ already present"
fi
echo ""

echo "=== [3/5] Prisma migrate ==="
docker compose exec -T bl-app npx prisma migrate deploy || docker compose run --rm bl-app npx prisma migrate deploy
echo ""

echo "=== [4/5] Restart + seed ==="
docker compose restart bl-app
sleep 12
docker compose exec -T bl-app npx tsx prisma/seed-press-contacts.ts
echo ""

echo "=== [5/5] Stats ==="
sleep 3
curl -sf http://localhost/api/press/stats | python3 -m json.tool 2>/dev/null || curl -sf http://localhost/api/press/stats
echo ""
echo "✓ DONE — tell Claude to trigger the campaign"
