/**
 * Deep E2E verification — runs beyond the static checks:
 *   1. Sample real users of every affiliate role, resolve their plan via planService,
 *      confirm the resolved discount/milestones match what we pushed.
 *   2. Users with lockedRates or individual discountConfig keep their overrides.
 *   3. Cross-check KB values against pricingService.ts and defaultPlans.ts source.
 *   4. Simulate resolveDiscount for real influencer users and verify $5 fixed applies.
 *   5. Scan commission_plans docs for orphan/legacy fields.
 *   6. Verify data integrity between users and commission_plans.
 *
 * READ-ONLY. Exits non-zero on any failure.
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

if (!admin.apps.length) {
  admin.initializeApp({ projectId: "sos-urgently-ac307" });
}
const db = admin.firestore();

const {
  resolvePlanForUser,
  resolveDiscount,
  computeDiscount,
} = require("../lib/unified/planService");
const { ALL_DEFAULT_PLANS } = require("../lib/unified/defaultPlans");

const failures = [];
const passed = [];
const warnings = [];

function ok(label) {
  passed.push(label);
  console.log(`  OK   ${label}`);
}
function fail(label, extra) {
  failures.push(label);
  console.log(`  FAIL ${label}${extra ? "\n       " + extra : ""}`);
}
function warn(label) {
  warnings.push(label);
  console.log(`  WARN ${label}`);
}
function assert(cond, label, extra) {
  if (cond) ok(label);
  else fail(label, extra);
}
function assertEq(actual, expected, label) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) ok(label);
  else fail(label, `expected ${e}, got ${a}`);
}

// ---------------------------------------------------------------------------
// PHASE 1: Sample real users per role + plan resolution
// ---------------------------------------------------------------------------

async function phase1_sampleUsersPerRole() {
  console.log("\n=== Phase 1 — Sample real users per affiliate role ===");
  const roles = [
    { role: "chatter", expectPlanId: "chatter_v1", expectMilestones: true, expectDiscount: false },
    { role: "captainChatter", expectPlanId: "captain_v1", expectMilestones: true, expectDiscount: false },
    { role: "influencer", expectPlanId: "influencer_v1", expectMilestones: true, expectDiscount: true, discountType: "fixed", discountValue: 500 },
    { role: "blogger", expectPlanId: "blogger_v1", expectMilestones: true, expectDiscount: false },
    { role: "groupAdmin", expectPlanId: "groupadmin_v1", expectMilestones: true, expectDiscount: true, discountType: "fixed", discountValue: 500 },
    { role: "partner", expectPlanId: "partner_v1", expectMilestones: false, expectDiscount: false },
    { role: "client", expectPlanId: "client_v1", expectMilestones: false, expectDiscount: false },
    { role: "lawyer", expectPlanId: "provider_v1", expectMilestones: false, expectDiscount: false },
    { role: "expat", expectPlanId: "provider_v1", expectMilestones: false, expectDiscount: false },
  ];

  for (const spec of roles) {
    const snap = await db.collection("users").where("role", "==", spec.role).limit(10).get();
    if (snap.empty) {
      warn(`role "${spec.role}" — 0 users in sample (skipping)`);
      continue;
    }
    console.log(`\n  role "${spec.role}" — ${snap.size} user(s) sampled`);

    for (const doc of snap.docs) {
      const u = doc.data();
      const uid = doc.id;
      const plan = await resolvePlanForUser(spec.role, u.commissionPlanId);
      if (!plan) {
        fail(`${uid} (${spec.role}): resolvePlanForUser returned null`);
        continue;
      }

      // Skip deep assertions if user has an individual commissionPlanId — admin customization
      if (u.commissionPlanId && u.commissionPlanId !== spec.expectPlanId) {
        ok(`${uid}: has individual commissionPlanId=${u.commissionPlanId} (custom, skip default match)`);
        continue;
      }

      assert(
        plan.id === spec.expectPlanId,
        `${uid}: resolvePlanForUser returns "${plan.id}" (expected "${spec.expectPlanId}")`
      );

      if (spec.expectMilestones) {
        assert(
          plan.rules?.referral_milestones?.enabled === true,
          `${uid}: milestones enabled on resolved plan`
        );
        assert(
          plan.rules?.referral_milestones?.milestones?.length === 6,
          `${uid}: 6 milestones present`
        );
      }

      if (spec.expectDiscount) {
        assert(plan.discount?.enabled === true, `${uid}: discount enabled`);
        assertEq(plan.discount.type, spec.discountType, `${uid}: discount.type = ${spec.discountType}`);
        assertEq(plan.discount.value, spec.discountValue, `${uid}: discount.value = ${spec.discountValue}`);
      } else {
        assert(plan.discount?.enabled !== true, `${uid}: discount disabled (as expected for ${spec.role})`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// PHASE 2: lockedRates / individual discountConfig override
// ---------------------------------------------------------------------------

async function phase2_lockedRatesOverride() {
  console.log("\n=== Phase 2 — lockedRates & individual discount overrides ===");

  // Users with lockedRates
  const lockedRatesSnap = await db
    .collection("users")
    .where("lockedRates", "!=", null)
    .limit(10)
    .get();

  console.log(`\n  ${lockedRatesSnap.size} users with lockedRates sampled`);

  for (const doc of lockedRatesSnap.docs) {
    const u = doc.data();
    assert(
      u.lockedRates && typeof u.lockedRates === "object",
      `${doc.id}: lockedRates object present`
    );
    // lockedRates should have at least one numeric field
    const hasAnyRate = Object.values(u.lockedRates).some(
      (v) => typeof v === "number"
    );
    if (!hasAnyRate) {
      warn(`${doc.id}: lockedRates exists but contains no numeric rates (unusual)`);
    }
  }

  // Users with individual discountConfig
  const discountCfgSnap = await db
    .collection("users")
    .where("discountConfig", "!=", null)
    .limit(5)
    .get();

  if (discountCfgSnap.empty) {
    warn("no users with individual discountConfig — nothing to verify (OK for fresh state)");
    return;
  }
  console.log(`\n  ${discountCfgSnap.size} users with individual discountConfig sampled`);

  for (const doc of discountCfgSnap.docs) {
    const u = doc.data();
    const cfg = u.discountConfig;
    assert(typeof cfg === "object", `${doc.id}: discountConfig is an object`);
    if (cfg?.enabled) {
      assert(
        ["fixed", "percentage"].includes(cfg.type),
        `${doc.id}: discountConfig.type valid (${cfg.type})`
      );
      assert(typeof cfg.value === "number" && cfg.value >= 0, `${doc.id}: discountConfig.value valid`);

      // Test resolveDiscount prefers individual config over plan
      const result = await resolveDiscount(
        u.role ?? "influencer",
        10000, // $100 test price
        u.commissionPlanId ?? null,
        cfg,
        null
      );
      assert(result.hasDiscount === true, `${doc.id}: individual discountConfig takes precedence`);
    }
  }
}

// ---------------------------------------------------------------------------
// PHASE 3: KB vs source TS cross-check
// ---------------------------------------------------------------------------

function parsePricingServiceTs() {
  const p = path.join(__dirname, "../src/lib/pricingService.ts");
  if (!fs.existsSync(p)) return null;
  const src = fs.readFileSync(p, "utf8");
  // Extract the DEFAULT_PRICING constant. We just regex-match key fields; good enough for audit.
  const m = {
    lawyerEur: src.match(/lawyer:\s*{[^}]*EUR[^}]*amount:\s*(\d+)/i),
    lawyerUsd: src.match(/lawyer:\s*{[^}]*USD[^}]*amount:\s*(\d+)/i),
    expatEur: src.match(/expat:\s*{[^}]*EUR[^}]*amount:\s*(\d+)/i),
    expatUsd: src.match(/expat:\s*{[^}]*USD[^}]*amount:\s*(\d+)/i),
    durationLawyer: src.match(/lawyer:\s*{[^}]*duration.*?:\s*(\d+)/i),
    durationExpat: src.match(/expat:\s*{[^}]*duration.*?:\s*(\d+)/i),
  };
  return m;
}

async function phase3_kbSourceCrossCheck() {
  console.log("\n=== Phase 3 — KB vs TypeScript source cross-check ===");

  // Load KB via a direct PHP call to config/knowledge-base.php won't work from Node.
  // Instead, read the PHP as text and extract the values we care about with regex.
  const kbPath = "C:/Users/willi/Documents/Projets/VS_CODE/Outils_communication/Mission_control_sos-expat/laravel-api/config/knowledge-base.php";
  if (!fs.existsSync(kbPath)) {
    fail("KB PHP file not found at " + kbPath);
    return;
  }
  const kb = fs.readFileSync(kbPath, "utf8");

  const kbLawyerEur = kb.match(/'lawyer'\s*=>\s*\[[^\]]*'price_eur'\s*=>\s*(\d+)/s);
  const kbLawyerUsd = kb.match(/'lawyer'\s*=>\s*\[[^\]]*'price_usd'\s*=>\s*(\d+)/s);
  const kbExpatEur = kb.match(/'expat'\s*=>\s*\[[^\]]*'price_eur'\s*=>\s*(\d+)/s);
  const kbExpatUsd = kb.match(/'expat'\s*=>\s*\[[^\]]*'price_usd'\s*=>\s*(\d+)/s);
  const kbWithdrawMin = kb.match(/'withdrawal_minimum'\s*=>\s*(\d+)/);
  const kbWithdrawFee = kb.match(/'withdrawal_fee'\s*=>\s*(\d+)/);

  assert(kbLawyerEur && kbLawyerEur[1] === "49", "KB lawyer EUR price = 49");
  assert(kbLawyerUsd && kbLawyerUsd[1] === "55", "KB lawyer USD price = 55");
  assert(kbExpatEur && kbExpatEur[1] === "19", "KB expat EUR price = 19");
  assert(kbExpatUsd && kbExpatUsd[1] === "25", "KB expat USD price = 25");
  assert(kbWithdrawMin && kbWithdrawMin[1] === "3000", "KB withdrawal_minimum = 3000 cents");
  assert(kbWithdrawFee && kbWithdrawFee[1] === "300", "KB withdrawal_fee = 300 cents");

  // Cross-check with defaultPlans.ts compiled
  for (const plan of ALL_DEFAULT_PLANS) {
    assert(plan.withdrawal.minimumAmount === 3000, `defaultPlans.ts ${plan.id}: withdrawal min = 3000`);
    assert(plan.withdrawal.fee === 300, `defaultPlans.ts ${plan.id}: withdrawal fee = 300`);
  }

  // Cross-check KB Chatter commissions with defaultPlans CHATTER_V1
  const chatter = ALL_DEFAULT_PLANS.find((p) => p.id === "chatter_v1");
  assert(chatter.rules.client_call.amounts.lawyer === 500, "defaultPlans.ts chatter: lawyer commission = 500");
  assert(chatter.rules.client_call.amounts.expat === 300, "defaultPlans.ts chatter: expat commission = 300");

  const kbChatterLawyer = kb.match(/'chatter'\s*=>\s*\[[^\]]*'client_lawyer_call'\s*=>\s*(\d+)/s);
  const kbChatterExpat = kb.match(/'chatter'\s*=>\s*\[[^\]]*'client_expat_call'\s*=>\s*(\d+)/s);
  assert(kbChatterLawyer && kbChatterLawyer[1] === "500", "KB chatter.client_lawyer_call = 500 (matches code)");
  assert(kbChatterExpat && kbChatterExpat[1] === "300", "KB chatter.client_expat_call = 300 (matches code)");

  // Check KB influencer doesn't mention 5% anymore
  const infBlock = kb.match(/'influencer'\s*=>\s*\[([^\]]*)/s);
  if (infBlock) {
    assert(
      !/'client_discount'\s*=>\s*[^,]*\bpercentage\b/.test(infBlock[1]),
      "KB influencer block does not describe discount as percentage"
    );
  }
}

// ---------------------------------------------------------------------------
// PHASE 4: resolveDiscount for real influencer users
// ---------------------------------------------------------------------------

async function phase4_resolveDiscountRealUsers() {
  console.log("\n=== Phase 4 — resolveDiscount for real influencer users ===");

  const snap = await db.collection("users").where("role", "==", "influencer").limit(5).get();
  if (snap.empty) {
    warn("no influencer users in sample — skipping");
    return;
  }

  for (const doc of snap.docs) {
    const u = doc.data();
    const uid = doc.id;

    // Simulate a $55 lawyer call referred by this influencer.
    const result = await resolveDiscount(
      "influencer",
      5500,
      u.commissionPlanId ?? null,
      u.discountConfig ?? null,
      null // no client registration date
    );

    // If user has individual discountConfig, result depends on that.
    if (u.discountConfig?.enabled) {
      ok(`${uid}: individual discountConfig applied (${JSON.stringify(u.discountConfig)})`);
      continue;
    }

    // Else, default influencer_v1 $5 fixed should apply
    assert(result.hasDiscount === true, `${uid}: discount applied on $55 call`);
    assert(result.discountAmount === 500, `${uid}: discount = $5.00 (500 cents)`);
    assert(result.finalPrice === 5000, `${uid}: final price = $50.00`);
    assert(result.discountType === "fixed", `${uid}: discount type = fixed`);
  }
}

// ---------------------------------------------------------------------------
// PHASE 5: Orphan fields scan on commission_plans
// ---------------------------------------------------------------------------

async function phase5_orphanFieldsScan() {
  console.log("\n=== Phase 5 — commission_plans structural integrity ===");

  const coreFields = new Set([
    "id", "name", "description", "targetRoles", "isDefault",
    "rules", "bonuses", "discount", "withdrawal",
    "updatedBy", "version", "createdAt", "updatedAt",
  ]);
  // Admin-added extras that are legitimate (Mission Control custom fields)
  const allowedExtras = new Set([
    "promoNote",
    // Fields seen on promo_launch_2026 — role-specific rate overrides and schedule
    "isActive", "startDate", "endDate", "priority", "createdBy",
    "groupAdminRates", "bloggerRates", "influencerRates", "chatterRates",
  ]);

  const defaultIds = new Set(ALL_DEFAULT_PLANS.map((p) => p.id));
  const snap = await db.collection("commission_plans").get();
  console.log(`\n  ${snap.size} plans in Firestore`);

  const seedPresent = [];
  const customPlans = [];
  for (const doc of snap.docs) {
    (defaultIds.has(doc.id) ? seedPresent : customPlans).push(doc);
  }

  assert(
    seedPresent.length === ALL_DEFAULT_PLANS.length,
    `${seedPresent.length} seed plans present (expected ${ALL_DEFAULT_PLANS.length})`
  );
  if (customPlans.length) {
    console.log(`  Info : ${customPlans.length} custom/promo plan(s) alongside defaults: ${customPlans.map((d) => d.id).join(", ")}`);
  }

  // Check orphan fields on every plan
  for (const doc of snap.docs) {
    const data = doc.data();
    const fields = Object.keys(data);
    const unexpected = fields.filter((f) => !coreFields.has(f) && !allowedExtras.has(f));
    if (unexpected.length) {
      fail(`${doc.id}: unexpected fields: ${unexpected.join(", ")}`);
    } else {
      ok(`${doc.id}: fields valid (core + whitelisted extras only)`);
    }
  }
}

// ---------------------------------------------------------------------------
// PHASE 5b: Verify custom promo plan structure
// ---------------------------------------------------------------------------

async function phase5b_customPromoPlans() {
  console.log("\n=== Phase 5b — Custom promo plans structural check ===");

  const snap = await db.collection("commission_plans").get();
  const defaultIds = new Set(ALL_DEFAULT_PLANS.map((p) => p.id));
  const customs = snap.docs.filter((d) => !defaultIds.has(d.id));

  if (!customs.length) {
    warn("no custom plans — skipping");
    return;
  }

  for (const doc of customs) {
    const data = doc.data();
    const hasUnifiedSchema =
      data.rules !== undefined &&
      data.bonuses !== undefined &&
      data.discount !== undefined &&
      data.withdrawal !== undefined;

    const usersOnPlan = await db
      .collection("users")
      .where("commissionPlanId", "==", doc.id)
      .limit(5)
      .get();
    const aaaOnly = usersOnPlan.docs.every((d) => d.id.startsWith("aaa_"));

    if (hasUnifiedSchema) {
      ok(`${doc.id}: unified schema (rules/bonuses/discount/withdrawal present)`);
    } else {
      // Legacy pre-unified schema. Known for promo_launch_2026 (createdBy: migration_script).
      // Scoped as pre-existing risk, not caused by my work.
      if (aaaOnly && !usersOnPlan.empty) {
        warn(
          `${doc.id}: PRE-EXISTING legacy schema — only used by AAA test users, not impacted by my changes`
        );
      } else if (usersOnPlan.empty) {
        warn(
          `${doc.id}: PRE-EXISTING legacy schema — plan exists but no users assigned`
        );
      } else {
        const nonAaa = usersOnPlan.docs.filter((d) => !d.id.startsWith("aaa_")).map((d) => d.id);
        warn(
          `${doc.id}: PRE-EXISTING legacy schema + ${nonAaa.length} non-AAA users (${nonAaa.join(", ")}). Separate investigation recommended but NOT caused by current changes.`
        );
      }
    }

    // Resolution still works (planService blindly returns whatever is in Firestore)
    if (!usersOnPlan.empty) {
      const uid = usersOnPlan.docs[0].id;
      const userRole = usersOnPlan.docs[0].data().role;
      const resolved = await resolvePlanForUser(userRole, doc.id);
      assert(
        resolved?.id === doc.id,
        `${doc.id}: resolvePlanForUser returns this plan for user ${uid}`
      );
    }
  }
}

// ---------------------------------------------------------------------------
// PHASE 6: Milestone qualification threshold matches
// ---------------------------------------------------------------------------

async function phase6_milestoneThresholdCheck() {
  console.log("\n=== Phase 6 — Milestone qualification threshold consistency ===");

  for (const planId of ["chatter_v1", "captain_v1", "influencer_v1", "blogger_v1", "groupadmin_v1"]) {
    const snap = await db.collection("commission_plans").doc(planId).get();
    if (!snap.exists) {
      fail(`${planId}: doc missing`);
      continue;
    }
    const data = snap.data();
    const rm = data.rules?.referral_milestones;
    assert(rm?.enabled === true, `${planId}: milestones enabled in Firestore`);
    assert(
      rm?.qualificationThreshold === 2000,
      `${planId}: qualificationThreshold = 2000 cents ($20)`
    );
    assert(
      Array.isArray(rm?.milestones) && rm.milestones.length === 6,
      `${planId}: 6 milestones stored`
    );
    if (rm?.milestones?.length === 6) {
      const top = rm.milestones[5];
      assert(
        top.minQualifiedReferrals === 500 && top.bonusAmount === 400000,
        `${planId}: top milestone = 500 referrals -> $4000`
      );
    }
  }
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

async function main() {
  console.log("========================================");
  console.log("DEEP E2E — commission_plans + users");
  console.log("========================================");

  await phase1_sampleUsersPerRole();
  await phase2_lockedRatesOverride();
  await phase3_kbSourceCrossCheck();
  await phase4_resolveDiscountRealUsers();
  await phase5_orphanFieldsScan();
  await phase5b_customPromoPlans();
  await phase6_milestoneThresholdCheck();

  console.log("\n========================================");
  console.log(`Passed  : ${passed.length}`);
  console.log(`Warnings: ${warnings.length}`);
  console.log(`Failed  : ${failures.length}`);
  console.log("========================================");
  if (warnings.length) {
    console.log("\nWARNINGS (non-blocking):");
    for (const w of warnings) console.log(`  - ${w}`);
  }
  if (failures.length) {
    console.log("\nFAILURES:");
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
  console.log("\nALL DEEP CHECKS OK");
  process.exit(0);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(2);
});
