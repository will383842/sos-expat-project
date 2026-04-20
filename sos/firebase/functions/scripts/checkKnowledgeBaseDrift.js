#!/usr/bin/env node
/**
 * checkKnowledgeBaseDrift.js — verify KB values match the TypeScript source of truth.
 *
 * Compares the Mission Control Knowledge Base (via JSON export or HTTP endpoint)
 * against hardcoded values in:
 *   - sos/firebase/functions/src/services/pricingService.ts (DEFAULT_PRICING_CONFIG)
 *   - sos/firebase/functions/src/unified/defaultPlans.ts (ALL_DEFAULT_PLANS)
 *
 * Drift means either an article will promise something different from billing,
 * or an admin console change wasn't mirrored in the KB. Either way, someone
 * needs to fix it before more content ships.
 *
 * Usage:
 *   node scripts/checkKnowledgeBaseDrift.js --kb-json=/path/to/kb.json
 *   node scripts/checkKnowledgeBaseDrift.js --kb-url=https://mc.example.com/api/public/knowledge-base.json
 *   node scripts/checkKnowledgeBaseDrift.js       # default: sibling MC repo export
 *
 * Exit codes:
 *   0  no drift
 *   1  drift detected
 *   2  could not load KB (no network, no file)
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const { ALL_DEFAULT_PLANS } = require("../lib/unified/defaultPlans");

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const flag = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : null;
};
const kbJsonPath = flag("kb-json");
const kbUrl = flag("kb-url");

const DEFAULT_MC_EXPORT = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "..",
  "Outils_communication",
  "Mission_control_sos-expat",
  "laravel-api",
  "storage",
  "kb-exports"
);

// ---------------------------------------------------------------------------
// KB loader
// ---------------------------------------------------------------------------

async function loadKb() {
  if (kbUrl) {
    return await fetchJson(kbUrl);
  }
  if (kbJsonPath) {
    return JSON.parse(fs.readFileSync(kbJsonPath, "utf8"));
  }
  // Default: try sibling MC repo export, picking the most recent file
  if (!fs.existsSync(DEFAULT_MC_EXPORT)) {
    throw new Error(
      `No --kb-json / --kb-url provided and default export dir not found: ${DEFAULT_MC_EXPORT}\n` +
        `Run: cd Mission_control_sos-expat/laravel-api && php artisan kb:export-json`
    );
  }
  const files = fs
    .readdirSync(DEFAULT_MC_EXPORT)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ name: f, mtime: fs.statSync(path.join(DEFAULT_MC_EXPORT, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  if (!files.length) {
    throw new Error(`No kb exports in ${DEFAULT_MC_EXPORT} — run php artisan kb:export-json first`);
  }
  const file = path.join(DEFAULT_MC_EXPORT, files[0].name);
  console.log(`Loaded KB from ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} from ${url}`));
          return;
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

// ---------------------------------------------------------------------------
// Parse pricingService.ts DEFAULT_PRICING_CONFIG
// ---------------------------------------------------------------------------

function parsePricingService() {
  const p = path.join(__dirname, "..", "src", "services", "pricingService.ts");
  const full = fs.readFileSync(p, "utf8");

  // Restrict the search window to the DEFAULT_PRICING_CONFIG literal so we
  // don't accidentally match the PricingConfig interface defined above.
  const startIdx = full.indexOf("DEFAULT_PRICING_CONFIG");
  if (startIdx === -1) {
    throw new Error("DEFAULT_PRICING_CONFIG not found in pricingService.ts");
  }
  const src = full.slice(startIdx);

  const grab = (role, cur, field) => {
    const re = new RegExp(
      `${role}:\\s*{[\\s\\S]*?${cur}:\\s*{[\\s\\S]*?${field}:\\s*(\\d+)`
    );
    const m = src.match(re);
    if (!m) throw new Error(`Could not parse ${role}.${cur}.${field} from pricingService.ts`);
    return parseInt(m[1], 10);
  };
  return {
    lawyer: {
      eur: {
        price: grab("lawyer", "eur", "totalAmount"),
        fee: grab("lawyer", "eur", "connectionFeeAmount"),
        payout: grab("lawyer", "eur", "providerAmount"),
        duration: grab("lawyer", "eur", "duration"),
      },
      usd: {
        price: grab("lawyer", "usd", "totalAmount"),
        fee: grab("lawyer", "usd", "connectionFeeAmount"),
        payout: grab("lawyer", "usd", "providerAmount"),
        duration: grab("lawyer", "usd", "duration"),
      },
    },
    expat: {
      eur: {
        price: grab("expat", "eur", "totalAmount"),
        fee: grab("expat", "eur", "connectionFeeAmount"),
        payout: grab("expat", "eur", "providerAmount"),
        duration: grab("expat", "eur", "duration"),
      },
      usd: {
        price: grab("expat", "usd", "totalAmount"),
        fee: grab("expat", "usd", "connectionFeeAmount"),
        payout: grab("expat", "usd", "providerAmount"),
        duration: grab("expat", "usd", "duration"),
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Drift rules
// ---------------------------------------------------------------------------

const drifts = [];
const ok = [];

function check(label, kbValue, tsValue) {
  if (kbValue === tsValue) {
    ok.push(label);
    return;
  }
  drifts.push({ label, kb: kbValue, ts: tsValue });
}

function runChecks(kb, ts) {
  // ----- Pricing -----
  check("lawyer EUR price", kb.services.lawyer.price_eur, ts.lawyer.eur.price);
  check("lawyer EUR fee", kb.services.lawyer.platform_fee_eur, ts.lawyer.eur.fee);
  check("lawyer EUR payout", kb.services.lawyer.provider_payout_eur, ts.lawyer.eur.payout);
  check("lawyer duration", kb.services.lawyer.duration_minutes, ts.lawyer.eur.duration);

  check("lawyer USD price", kb.services.lawyer.price_usd, ts.lawyer.usd.price);
  check("lawyer USD fee", kb.services.lawyer.platform_fee_usd, ts.lawyer.usd.fee);
  check("lawyer USD payout", kb.services.lawyer.provider_payout_usd, ts.lawyer.usd.payout);

  check("expat EUR price", kb.services.expat.price_eur, ts.expat.eur.price);
  check("expat EUR fee", kb.services.expat.platform_fee_eur, ts.expat.eur.fee);
  check("expat EUR payout", kb.services.expat.provider_payout_eur, ts.expat.eur.payout);
  check("expat duration", kb.services.expat.duration_minutes, ts.expat.eur.duration);

  check("expat USD price", kb.services.expat.price_usd, ts.expat.usd.price);
  check("expat USD fee", kb.services.expat.platform_fee_usd, ts.expat.usd.fee);
  check("expat USD payout", kb.services.expat.provider_payout_usd, ts.expat.usd.payout);

  // ----- Commissions (KB cents = TS cents) -----
  const chatter = ALL_DEFAULT_PLANS.find((p) => p.id === "chatter_v1");
  check("chatter client_lawyer_call", kb.programs.chatter.client_lawyer_call, chatter.rules.client_call.amounts.lawyer);
  check("chatter client_expat_call", kb.programs.chatter.client_expat_call, chatter.rules.client_call.amounts.expat);
  check("chatter n1_call_commission", kb.programs.chatter.n1_call_commission, chatter.rules.recruitment_call.depthAmounts[0]);
  check("chatter n2_call_commission", kb.programs.chatter.n2_call_commission, chatter.rules.recruitment_call.depthAmounts[1]);
  check("chatter activation_bonus", kb.programs.chatter.activation_bonus, chatter.rules.activation_bonus.amount);
  check("chatter telegram_bonus", kb.programs.chatter.telegram_bonus, chatter.bonuses.telegramBonus.amount);
  check("chatter telegram_unlock_threshold", kb.programs.chatter.telegram_unlock_threshold, chatter.bonuses.telegramBonus.unlockThreshold);

  // Withdrawal
  const common = kb.programs.common;
  for (const plan of ALL_DEFAULT_PLANS) {
    check(`${plan.id} withdrawal.minimumAmount`, common.withdrawal_minimum, plan.withdrawal.minimumAmount);
    check(`${plan.id} withdrawal.fee`, common.withdrawal_fee, plan.withdrawal.fee);
  }

  // Milestones: compare TS plan milestones against the KB block for the same
  // program (per-plan comparison, not just against chatter). This catches drift
  // introduced on a single role's KB milestones without touching others.
  //
  // TS plan id -> KB program key
  const planToKbProgram = {
    chatter_v1: "chatter",
    captain_v1: "captain_chatter",
    influencer_v1: "influencer",
    blogger_v1: "blogger",
    groupadmin_v1: "group_admin",
  };
  for (const plan of ALL_DEFAULT_PLANS) {
    if (!plan.rules.referral_milestones?.enabled) continue;
    const kbKey = planToKbProgram[plan.id];
    if (!kbKey) continue; // Plans like client_v1 / provider_v1 don't have KB milestones
    // Captain inherits its milestones from chatter in the KB (no own block)
    const kbSource = kb.programs[kbKey]?.milestones
      ?? (kbKey === "captain_chatter" ? kb.programs.chatter?.milestones : null);
    if (!kbSource) {
      drifts.push({
        label: `${plan.id} has milestones in code but KB.programs.${kbKey}.milestones missing`,
        kb: null,
        ts: plan.rules.referral_milestones.milestones.length,
      });
      continue;
    }
    for (const m of plan.rules.referral_milestones.milestones) {
      const kbBonus = kbSource[m.minQualifiedReferrals] ?? kbSource[String(m.minQualifiedReferrals)];
      check(
        `${plan.id} milestone @${m.minQualifiedReferrals}`,
        kbBonus,
        m.bonusAmount
      );
    }
  }

  // Influencer discount
  const inf = ALL_DEFAULT_PLANS.find((p) => p.id === "influencer_v1");
  check("influencer discount.type", kb.programs.influencer.client_discount != null ? "fixed" : "none", inf.discount.type);
  check("influencer discount.value", kb.programs.influencer.client_discount, inf.discount.value);

  // Partner rate
  const partner = ALL_DEFAULT_PLANS.find((p) => p.id === "partner_v1");
  check("partner call_commission_rate", kb.programs.partner.call_commission_rate, partner.rules.client_call.rate);
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

(async function main() {
  let kb;
  try {
    kb = await loadKb();
  } catch (e) {
    console.error("LOAD KB FAILED:", e.message);
    process.exit(2);
  }

  let ts;
  try {
    ts = parsePricingService();
  } catch (e) {
    console.error("PARSE TS FAILED:", e.message);
    process.exit(2);
  }

  console.log(`KB version: ${kb?.meta?.kb_version ?? "?"}`);
  console.log(`KB updated: ${kb?.meta?.kb_updated_at ?? "?"}`);
  console.log("");

  runChecks(kb, ts);

  if (drifts.length === 0) {
    console.log(`All ${ok.length} fields match between KB and TypeScript source.`);
    console.log("NO DRIFT.");
    process.exit(0);
  }

  console.log(`${ok.length} OK`);
  console.log(`${drifts.length} DRIFT(S):\n`);
  for (const d of drifts) {
    console.log(`  - ${d.label}`);
    console.log(`      KB : ${JSON.stringify(d.kb)}`);
    console.log(`      TS : ${JSON.stringify(d.ts)}`);
  }
  process.exit(1);
})();
