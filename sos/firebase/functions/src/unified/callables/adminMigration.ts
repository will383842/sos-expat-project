/**
 * Admin Migration Callables — Phase 10
 *
 * Callable functions for admin to trigger and monitor migration steps.
 * All steps are idempotent (safe to re-run).
 *
 * Region: us-central1 (affiliate region)
 */

import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getApps, initializeApp } from "firebase-admin/app";
import { logger } from "firebase-functions/v2";
import { affiliateAdminConfig } from "../../lib/functionConfigs";
import { batchMigrateAffiliateCodes } from "../codeMigrator";
import { batchMigrateReferrals } from "../migrations/migrateReferrals";
import { ALL_DEFAULT_PLANS } from "../defaultPlans";

// ============================================================================
// HELPERS
// ============================================================================

function ensureInitialized() {
  if (!getApps().length) initializeApp();
}

async function assertAdmin(request: CallableRequest): Promise<string> {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const uid = request.auth.uid;
  const role = request.auth.token?.role as string | undefined;
  if (role === "admin") return uid;

  const db = getFirestore();
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists || userDoc.data()?.role !== "admin") {
    throw new HttpsError("permission-denied", "Admin access required");
  }

  return uid;
}

// ============================================================================
// SEED DEFAULT PLANS
// ============================================================================

export const adminSeedDefaultPlans = onCall(
  { ...affiliateAdminConfig, timeoutSeconds: 60 },
  async (request) => {
    ensureInitialized();
    const adminId = await assertAdmin(request);

    const { dryRun } = (request.data || {}) as { dryRun?: boolean };
    const db = getFirestore();

    const results: Array<{ planId: string; status: string }> = [];

    for (const plan of ALL_DEFAULT_PLANS) {
      const existing = await db.collection("commission_plans").doc(plan.id).get();

      if (existing.exists) {
        results.push({ planId: plan.id, status: "exists" });
        continue;
      }

      if (dryRun) {
        results.push({ planId: plan.id, status: "would_create" });
        continue;
      }

      await db.collection("commission_plans").doc(plan.id).set({
        ...plan,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        updatedBy: adminId,
      });
      results.push({ planId: plan.id, status: "created" });
    }

    const created = results.filter((r) => r.status === "created").length;
    const existing = results.filter((r) => r.status === "exists").length;

    logger.info(`Seed plans: ${created} created, ${existing} already existed`, { adminId });

    return {
      success: true,
      dryRun: !!dryRun,
      created,
      existing,
      total: results.length,
      details: results,
    };
  }
);

// ============================================================================
// UPDATE DEFAULT PLANS — upsert rules/bonuses/discount/withdrawal on existing plans
// ============================================================================
//
// adminSeedDefaultPlans only CREATES missing plans. This callable UPDATES
// existing ones when the seed defaults change (e.g. milestones enabled for
// influencer/blogger/groupadmin, influencer discount moved from 5% to $5 fixed).
//
// Safety:
//   - dryRun returns the diff without writing
//   - lockedRates on individual user documents are never touched
//   - createdAt is preserved; updatedAt + updatedBy are stamped
//   - name + version are never rewritten (admin may have customized)

export const adminUpdateDefaultPlans = onCall(
  { ...affiliateAdminConfig, timeoutSeconds: 120 },
  async (request) => {
    ensureInitialized();
    const adminId = await assertAdmin(request);

    const { dryRun, onlyPlanIds } = (request.data || {}) as {
      dryRun?: boolean;
      onlyPlanIds?: string[];
    };
    const db = getFirestore();
    const planIdFilter = Array.isArray(onlyPlanIds) && onlyPlanIds.length > 0
      ? new Set(onlyPlanIds)
      : null;

    const results: Array<{
      planId: string;
      status: string;
      changedFields?: string[];
    }> = [];

    for (const plan of ALL_DEFAULT_PLANS) {
      if (planIdFilter && !planIdFilter.has(plan.id)) {
        continue;
      }

      const ref = db.collection("commission_plans").doc(plan.id);
      const existing = await ref.get();

      if (!existing.exists) {
        // Caller should use adminSeedDefaultPlans for missing plans.
        results.push({ planId: plan.id, status: "missing_skip_use_seed" });
        continue;
      }

      const data = existing.data() || {};
      const changedFields: string[] = [];

      // Compare the 4 fields that seeds control — rules, bonuses, discount, withdrawal.
      // name/description/version/targetRoles are left alone so admin customizations survive.
      const fieldsToSync = ["rules", "bonuses", "discount", "withdrawal"] as const;
      for (const field of fieldsToSync) {
        const before = JSON.stringify(data[field] ?? null);
        const after = JSON.stringify((plan as unknown as Record<string, unknown>)[field] ?? null);
        if (before !== after) {
          changedFields.push(field);
        }
      }

      if (changedFields.length === 0) {
        results.push({ planId: plan.id, status: "up_to_date" });
        continue;
      }

      if (dryRun) {
        results.push({ planId: plan.id, status: "would_update", changedFields });
        continue;
      }

      const payload: Record<string, unknown> = {
        updatedAt: Timestamp.now(),
        updatedBy: adminId,
      };
      for (const field of changedFields) {
        payload[field] = (plan as unknown as Record<string, unknown>)[field];
      }

      await ref.update(payload);
      results.push({ planId: plan.id, status: "updated", changedFields });
    }

    const updated = results.filter((r) => r.status === "updated").length;
    const upToDate = results.filter((r) => r.status === "up_to_date").length;
    const missing = results.filter((r) => r.status === "missing_skip_use_seed").length;

    logger.info(
      `Update plans: ${updated} updated, ${upToDate} up-to-date, ${missing} missing`,
      { adminId, dryRun: !!dryRun }
    );

    if (!dryRun && updated > 0) {
      await db.collection("migration_reports").add({
        type: "default_plans_update",
        triggeredBy: adminId,
        timestamp: Timestamp.now(),
        total: results.length,
        updated,
        upToDate,
        missing,
        details: results,
      });
    }

    return {
      success: true,
      dryRun: !!dryRun,
      updated,
      upToDate,
      missing,
      total: results.length,
      details: results,
    };
  }
);

// ============================================================================
// MIGRATE AFFILIATE CODES
// ============================================================================

export const adminMigrateAffiliateCodes = onCall(
  { ...affiliateAdminConfig, timeoutSeconds: 300 },
  async (request) => {
    ensureInitialized();
    const adminId = await assertAdmin(request);

    const { batchSize, dryRun } = (request.data || {}) as {
      batchSize?: number;
      dryRun?: boolean;
    };

    logger.info("Admin triggered affiliate code migration", { adminId, batchSize, dryRun });

    const result = await batchMigrateAffiliateCodes(batchSize || 100, !!dryRun);

    // Save migration report
    if (!dryRun) {
      await getFirestore().collection("migration_reports").add({
        type: "affiliate_codes",
        triggeredBy: adminId,
        timestamp: Timestamp.now(),
        total: result.total,
        migrated: result.migrated,
        skipped: result.skipped,
        errors: result.errors,
      });
    }

    return {
      success: true,
      dryRun: !!dryRun,
      ...result,
      // Truncate details to avoid exceeding callable response size limit
      details: result.details.slice(0, 200),
    };
  }
);

// ============================================================================
// MIGRATE REFERRAL RELATIONSHIPS
// ============================================================================

export const adminMigrateReferrals = onCall(
  { ...affiliateAdminConfig, timeoutSeconds: 300 },
  async (request) => {
    ensureInitialized();
    const adminId = await assertAdmin(request);

    const { batchSize, dryRun } = (request.data || {}) as {
      batchSize?: number;
      dryRun?: boolean;
    };

    logger.info("Admin triggered referral migration", { adminId, batchSize, dryRun });

    const result = await batchMigrateReferrals(batchSize || 100, !!dryRun);

    // Save migration report
    if (!dryRun) {
      await getFirestore().collection("migration_reports").add({
        type: "referrals",
        triggeredBy: adminId,
        timestamp: Timestamp.now(),
        total: result.total,
        migrated: result.migrated,
        skipped: result.skipped,
        errors: result.errors,
      });
    }

    return {
      success: true,
      dryRun: !!dryRun,
      ...result,
      details: result.details.slice(0, 200),
    };
  }
);

// ============================================================================
// MIGRATION STATUS — Check overall migration progress
// ============================================================================

export const adminGetMigrationStatus = onCall(
  { ...affiliateAdminConfig, timeoutSeconds: 60 },
  async (request) => {
    ensureInitialized();
    await assertAdmin(request);

    const db = getFirestore();

    // Count plans
    const plansSnap = await db.collection("commission_plans").get();
    const plansCount = plansSnap.size;

    // Count users with/without unified code
    const affiliateRoles = ["chatter", "captainChatter", "influencer", "blogger", "groupAdmin", "partner"];
    let totalAffiliates = 0;
    let withUnifiedCode = 0;
    let withLockedRates = 0;
    let withReferredByUserId = 0;
    let withLegacyReferral = 0;

    for (const role of affiliateRoles) {
      const snap = await db.collection("users").where("role", "==", role).get();
      for (const doc of snap.docs) {
        totalAffiliates++;
        const data = doc.data();
        if (data.affiliateCode && !data.affiliateCode.includes("-")) withUnifiedCode++;
        if (data.lockedRates) withLockedRates++;
      }
    }

    // Count referral status across ALL users (not just affiliates)
    // Sample first 500 users with any referral field
    const referralFields = [
      "referredByChatterId", "referredByInfluencerId", "referredByBlogger",
      "referredByGroupAdmin", "partnerReferredById", "referredBy",
    ];

    const usersSample = await db.collection("users").limit(1000).get();
    for (const doc of usersSample.docs) {
      const data = doc.data();
      if (data.referredByUserId) withReferredByUserId++;
      else if (referralFields.some((f) => data[f])) withLegacyReferral++;
    }

    // Get recent migration reports
    const reportsSnap = await db
      .collection("migration_reports")
      .orderBy("timestamp", "desc")
      .limit(10)
      .get();
    const reports = reportsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        triggeredBy: data.triggeredBy,
        timestamp: data.timestamp?.toDate?.()?.toISOString(),
        total: data.total,
        migrated: data.migrated,
        skipped: data.skipped,
        errors: data.errors,
      };
    });

    // Check system config
    const configDoc = await db.doc("unified_commission_system/config").get();
    const systemConfig = configDoc.exists ? configDoc.data() : null;

    return {
      success: true,
      plans: {
        total: plansCount,
        expected: ALL_DEFAULT_PLANS.length,
        allSeeded: plansCount >= ALL_DEFAULT_PLANS.length,
      },
      affiliates: {
        total: totalAffiliates,
        withUnifiedCode,
        withLockedRates,
        codesMigrated: totalAffiliates > 0 ? Math.round((withUnifiedCode / totalAffiliates) * 100) : 0,
        ratesMigrated: totalAffiliates > 0 ? Math.round((withLockedRates / totalAffiliates) * 100) : 0,
      },
      referrals: {
        withUnifiedField: withReferredByUserId,
        withLegacyOnly: withLegacyReferral,
        sampleSize: usersSample.size,
      },
      systemConfig,
      recentReports: reports,
    };
  }
);
