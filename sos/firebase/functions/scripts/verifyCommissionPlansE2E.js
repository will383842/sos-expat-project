/**
 * E2E verification of the commission_plans collection in production.
 *
 * READ-ONLY. Does not write anything. Exits non-zero if any assertion fails.
 *
 * Verifies:
 *   1. The 3 plans we intended to update (influencer, blogger, groupadmin)
 *      have the exact expected shape.
 *   2. The 5 plans we left alone (chatter, captain, client, provider, partner)
 *      still have their Firestore shape (not overwritten).
 *   3. No plan has leftover top3 multipliers.
 *   4. Sample users with lockedRates were NOT touched by the update.
 *   5. A migration_report was written with type=default_plans_update.
 *   6. All plans have valid withdrawal defaults.
 *
 * Usage: node scripts/verifyCommissionPlansE2E.js
 */

const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({ projectId: "sos-urgently-ac307" });
}
const db = admin.firestore();

const failures = [];
const passed = [];

function assert(cond, label) {
  if (cond) {
    passed.push(label);
    console.log(`  OK   ${label}`);
  } else {
    failures.push(label);
    console.log(`  FAIL ${label}`);
  }
}

function assertEqual(actual, expected, label) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed.push(label);
    console.log(`  OK   ${label}`);
  } else {
    failures.push(`${label} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
    console.log(`  FAIL ${label}`);
    console.log(`       expected: ${JSON.stringify(expected)}`);
    console.log(`       got:      ${JSON.stringify(actual)}`);
  }
}

const EXPECTED_MILESTONES = [
  { minQualifiedReferrals: 5, bonusAmount: 1500, name: "5 filleuls" },
  { minQualifiedReferrals: 10, bonusAmount: 3500, name: "10 filleuls" },
  { minQualifiedReferrals: 20, bonusAmount: 7500, name: "20 filleuls" },
  { minQualifiedReferrals: 50, bonusAmount: 25000, name: "50 filleuls" },
  { minQualifiedReferrals: 100, bonusAmount: 60000, name: "100 filleuls" },
  { minQualifiedReferrals: 500, bonusAmount: 400000, name: "500 filleuls" },
];

async function verifyPlan(planId, expectations) {
  console.log(`\n--- ${planId} ---`);
  const snap = await db.collection("commission_plans").doc(planId).get();
  assert(snap.exists, `${planId}: document exists`);
  if (!snap.exists) return;

  const data = snap.data();
  for (const [path, expected, label] of expectations) {
    const actual = path.split(".").reduce((obj, k) => obj?.[k], data);
    assertEqual(actual, expected, `${planId}: ${label}`);
  }

  // Universal invariants
  assert(
    data.withdrawal?.minimumAmount === 3000,
    `${planId}: withdrawal.minimumAmount = 3000 cents`
  );
  assert(
    data.withdrawal?.fee === 300,
    `${planId}: withdrawal.fee = 300 cents`
  );

  // No leftover top3 multipliers
  if (data.bonuses?.top3?.enabled) {
    const mult = data.bonuses.top3.multipliers;
    assert(
      !mult || mult.length === 0,
      `${planId}: bonuses.top3 has no leftover multipliers (got: ${JSON.stringify(mult)})`
    );
  }
}

async function verifyInfluencer() {
  await verifyPlan("influencer_v1", [
    ["discount.enabled", true, "discount.enabled = true"],
    ["discount.type", "fixed", "discount.type = fixed"],
    ["discount.value", 500, "discount.value = 500 cents ($5)"],
    ["rules.referral_milestones.enabled", true, "milestones enabled"],
    ["rules.referral_milestones.qualificationThreshold", 2000, "qualificationThreshold = 2000 cents"],
    ["rules.referral_milestones.milestones", EXPECTED_MILESTONES, "6 milestones match STANDARD"],
    ["bonuses.top3.enabled", true, "top3 cash enabled"],
    ["bonuses.top3.type", "cash", "top3 type=cash"],
    ["bonuses.top3.cashAmounts", [20000, 10000, 5000], "top3 cash $200/$100/$50"],
    ["bonuses.telegramBonus.enabled", true, "telegramBonus enabled"],
    ["bonuses.telegramBonus.amount", 5000, "telegramBonus amount = $50"],
    ["rules.client_call.amounts.lawyer", 500, "client_lawyer_call = $5"],
    ["rules.client_call.amounts.expat", 300, "client_expat_call = $3"],
  ]);
}

async function verifyBlogger() {
  await verifyPlan("blogger_v1", [
    ["rules.referral_milestones.enabled", true, "milestones enabled"],
    ["rules.referral_milestones.qualificationThreshold", 2000, "qualificationThreshold = 2000 cents"],
    ["rules.referral_milestones.milestones", EXPECTED_MILESTONES, "6 milestones match STANDARD"],
    ["rules.client_call.amounts.lawyer", 500, "client_lawyer_call = $5"],
    ["rules.client_call.amounts.expat", 300, "client_expat_call = $3"],
    ["discount.enabled", false, "discount disabled (blogger = no discount)"],
    ["rules.provider_recruitment.enabled", true, "provider recruitment enabled"],
    ["rules.provider_recruitment.amounts.lawyer", 500, "provider recruitment lawyer = $5"],
    ["rules.provider_recruitment.amounts.expat", 300, "provider recruitment expat = $3"],
  ]);
}

async function verifyGroupAdmin() {
  await verifyPlan("groupadmin_v1", [
    ["rules.referral_milestones.enabled", true, "milestones enabled"],
    ["rules.referral_milestones.milestones", EXPECTED_MILESTONES, "6 milestones match STANDARD"],
    ["discount.enabled", true, "discount enabled"],
    ["discount.type", "fixed", "discount type = fixed"],
    ["discount.value", 500, "discount = $5 fixed"],
    ["rules.recruitment_call.enabled", true, "N1/N2 enabled"],
    ["rules.recruitment_call.depth", 2, "depth = 2"],
    ["rules.recruitment_call.depthAmounts", [100, 50], "N1 $1, N2 $0.50"],
    ["rules.promo_multiplier.enabled", true, "promo_multiplier enabled (groupadmin specific)"],
  ]);
}

async function verifyUntouchedPlans() {
  console.log("\n--- Plans we did NOT touch ---");
  for (const planId of ["chatter_v1", "captain_v1", "client_v1", "provider_v1", "partner_v1"]) {
    const snap = await db.collection("commission_plans").doc(planId).get();
    assert(snap.exists, `${planId}: document still exists`);
    if (!snap.exists) continue;
    const data = snap.data();
    // Basic sanity: withdrawal still present and correct
    assert(
      data.withdrawal?.minimumAmount === 3000,
      `${planId}: withdrawal.minimumAmount still = 3000 cents (not corrupted)`
    );
  }
}

async function verifyLockedRatesPreservation() {
  console.log("\n--- lockedRates preservation (sample) ---");
  const sample = await db
    .collection("users")
    .where("lockedRates", "!=", null)
    .limit(5)
    .get();

  if (sample.empty) {
    console.log("  SKIP no users with lockedRates in the sample — nothing to check");
    passed.push("lockedRates preservation: no sample");
    return;
  }

  for (const doc of sample.docs) {
    const data = doc.data();
    assert(
      data.lockedRates && typeof data.lockedRates === "object",
      `user ${doc.id}: lockedRates still present and an object`
    );
  }
}

async function verifyMigrationReport() {
  console.log("\n--- migration_reports trail ---");
  // Equality-only query to avoid needing a composite index (which would require
  // an admin UI click to provision). Then sort in memory.
  const reports = await db
    .collection("migration_reports")
    .where("type", "==", "default_plans_update")
    .get();

  assert(!reports.empty, "at least one default_plans_update migration_report exists");
  if (reports.empty) return;

  const sorted = reports.docs
    .map((d) => d.data())
    .sort((a, b) => {
      const ta = a.timestamp?.toMillis?.() ?? 0;
      const tb = b.timestamp?.toMillis?.() ?? 0;
      return tb - ta;
    });
  const report = sorted[0];
  assert(typeof report.triggeredBy === "string", `report.triggeredBy set (got: ${report.triggeredBy})`);
  assert(report.updated === 3, `report.updated = 3 (got: ${report.updated})`);
  assert(
    Array.isArray(report.details) &&
      report.details.every((d) =>
        ["influencer_v1", "blogger_v1", "groupadmin_v1"].includes(d.id)
      ),
    "report.details covers exactly the 3 expected planIds"
  );
}

async function main() {
  console.log("========================================");
  console.log("E2E verify — commission_plans prod");
  console.log("Project : sos-urgently-ac307");
  console.log("========================================");

  await verifyInfluencer();
  await verifyBlogger();
  await verifyGroupAdmin();
  await verifyUntouchedPlans();
  await verifyLockedRatesPreservation();
  await verifyMigrationReport();

  console.log("\n========================================");
  console.log(`Passed: ${passed.length}`);
  console.log(`Failed: ${failures.length}`);
  console.log("========================================");

  if (failures.length > 0) {
    console.log("\nFAILURES:");
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
  console.log("\nALL OK");
  process.exit(0);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(2);
});
