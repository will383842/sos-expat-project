#!/bin/bash
# Deploy SOS-Call B2B Firebase Functions.
# Run locally from a developer machine with `firebase login` done.
#
# Usage (from sos/firebase/functions):
#   bash scripts/deploy-sos-call.sh

set -euo pipefail

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " SOS-Call B2B Firebase Functions — deploy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1 — Verify secrets are set in Firebase
echo ""
echo "→ Step 1/5: Verifying Firebase secrets..."
REQUIRED_SECRETS=(PARTNER_ENGINE_URL PARTNER_ENGINE_API_KEY)
for secret in "${REQUIRED_SECRETS[@]}"; do
    if ! firebase functions:secrets:access "$secret" >/dev/null 2>&1; then
        echo "❌ Missing Firebase secret: $secret"
        echo "   Set it with: firebase functions:secrets:set $secret"
        exit 1
    fi
done
echo "✅ All required secrets are set"

# Step 2 — Build
echo ""
echo "→ Step 2/5: Building TypeScript..."
rm -rf lib
npm run build

# Step 3 — Run Jest tests
echo ""
echo "→ Step 3/5: Running Jest tests..."
npm test -- --passWithNoTests --testPathPattern='(sosCall|partner|onCallCompleted|triggerSosCall)'

# Step 4 — Deploy SOS-Call-related functions (selective to avoid touching everything)
echo ""
echo "→ Step 4/5: Deploying SOS-Call functions..."

# List of functions to deploy
# NOTE: chatter/influencer/blogger/groupAdmin/affiliate handlers are NOT deployed
# as separate Cloud Functions — they were consolidated 2026-01 into one dispatcher
# (consolidatedOnCallCompleted) which invokes them internally. My isSosCallFree
# guards added to their handler files ARE active via this consolidated trigger.
FUNCTIONS=(
    # New callables
    "functions:checkSosCallCode"
    "functions:triggerSosCallFromWeb"
    "functions:releaseProviderPayments"
    # Modified: Stripe bypass when sosCallSessionToken present
    "functions:createAndScheduleCall"
    # Modified: dispatches to 5 handlers that now all check isSosCallFree
    "functions:consolidatedOnCallCompleted"
)

# Join with commas
DEPLOY_TARGETS=$(IFS=','; echo "${FUNCTIONS[*]}")

echo "→ Deploying: $DEPLOY_TARGETS"
firebase deploy --only "$DEPLOY_TARGETS" --force

# Step 5 — Smoke test
echo ""
echo "→ Step 5/5: Smoke test — listing deployed functions..."
firebase functions:list | grep -E "(checkSosCallCode|triggerSosCallFromWeb|releaseProviderPayments)" || {
    echo "❌ Deployed functions not found in list. Something went wrong."
    exit 1
}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SOS-Call Firebase Functions deployed successfully"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next: deploy Partner Engine (git push origin main — CI/CD auto-deploy)"
