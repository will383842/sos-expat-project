/**
 * Update Default Commission Plans — propagate seed changes to Firestore.
 *
 * Mirrors the adminUpdateDefaultPlans callable but runs locally with Admin SDK
 * (no Firebase Auth needed — uses application-default credentials).
 *
 * Compares, for each plan in ALL_DEFAULT_PLANS (from lib/unified/defaultPlans):
 *   - rules
 *   - bonuses
 *   - discount
 *   - withdrawal
 * against the current Firestore doc. Updates only the fields that differ.
 *
 * `name`, `description`, `version`, `targetRoles` are NEVER touched so admin
 * customizations survive. `createdAt` is preserved.
 *
 * Usage:
 *   node scripts/updateDefaultPlans.js                 # dry-run (default)
 *   node scripts/updateDefaultPlans.js --apply         # actually write
 *   node scripts/updateDefaultPlans.js --apply --only=influencer_v1,blogger_v1
 */

const admin = require("firebase-admin");
const { ALL_DEFAULT_PLANS } = require("../lib/unified/defaultPlans");

if (!admin.apps.length) {
  admin.initializeApp({ projectId: "sos-urgently-ac307" });
}
const db = admin.firestore();

const APPLY = process.argv.includes("--apply");
const ONLY_ARG = process.argv.find((a) => a.startsWith("--only="));
const ONLY = ONLY_ARG ? new Set(ONLY_ARG.split("=")[1].split(",")) : null;

const FIELDS = ["rules", "bonuses", "discount", "withdrawal"];

function canonical(value) {
  // Stable stringify by sorting object keys at every level so diffs don't
  // flicker on equivalent structures with different key order.
  return JSON.stringify(value, (_, v) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return Object.keys(v)
        .sort()
        .reduce((acc, k) => {
          acc[k] = v[k];
          return acc;
        }, {});
    }
    return v;
  });
}

function diffFields(before, after) {
  const changed = [];
  for (const field of FIELDS) {
    const a = canonical(before?.[field] ?? null);
    const b = canonical(after?.[field] ?? null);
    if (a !== b) {
      changed.push(field);
    }
  }
  return changed;
}

function summarizeChange(field, before, after) {
  const b = before?.[field];
  const a = after?.[field];
  if (field === "discount") {
    return `    ${field}: ${b?.type}=${b?.value} -> ${a?.type}=${a?.value}`;
  }
  if (field === "rules") {
    const bMs = b?.referral_milestones?.enabled ? "enabled" : "disabled";
    const aMs = a?.referral_milestones?.enabled ? "enabled" : "disabled";
    return `    ${field}: referral_milestones ${bMs} -> ${aMs}`;
  }
  return `    ${field}: changed`;
}

async function main() {
  const mode = APPLY ? "APPLY" : "DRY-RUN";
  console.log(`\n=== adminUpdateDefaultPlans [${mode}] ===`);
  console.log(`Project: sos-urgently-ac307`);
  console.log(`Filter : ${ONLY ? Array.from(ONLY).join(",") : "all plans"}\n`);

  const results = [];

  for (const plan of ALL_DEFAULT_PLANS) {
    if (ONLY && !ONLY.has(plan.id)) {
      continue;
    }

    const ref = db.collection("commission_plans").doc(plan.id);
    const snap = await ref.get();

    if (!snap.exists) {
      console.log(`[${plan.id}] MISSING — run adminSeedDefaultPlans first`);
      results.push({ id: plan.id, status: "missing" });
      continue;
    }

    const before = snap.data();
    const changed = diffFields(before, plan);

    if (changed.length === 0) {
      console.log(`[${plan.id}] up-to-date`);
      results.push({ id: plan.id, status: "up_to_date" });
      continue;
    }

    console.log(`[${plan.id}] ${APPLY ? "UPDATING" : "WOULD UPDATE"}: ${changed.join(", ")}`);
    for (const field of changed) {
      console.log(summarizeChange(field, before, plan));
    }

    if (!APPLY) {
      results.push({ id: plan.id, status: "would_update", changed });
      continue;
    }

    const payload = {
      updatedAt: admin.firestore.Timestamp.now(),
      updatedBy: "local-script:updateDefaultPlans",
    };
    for (const field of changed) {
      payload[field] = plan[field];
    }
    await ref.update(payload);
    results.push({ id: plan.id, status: "updated", changed });
  }

  if (APPLY && results.some((r) => r.status === "updated")) {
    await db.collection("migration_reports").add({
      type: "default_plans_update",
      triggeredBy: "local-script:updateDefaultPlans",
      timestamp: admin.firestore.Timestamp.now(),
      total: results.length,
      updated: results.filter((r) => r.status === "updated").length,
      upToDate: results.filter((r) => r.status === "up_to_date").length,
      missing: results.filter((r) => r.status === "missing").length,
      details: results,
    });
  }

  console.log("\n=== Summary ===");
  const counts = results.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  console.log(counts);

  if (!APPLY) {
    console.log("\nDry-run only. Re-run with --apply to write.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("FAILED:", err);
    process.exit(1);
  });
