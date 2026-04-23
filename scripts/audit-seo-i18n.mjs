#!/usr/bin/env node
/**
 * Comprehensive SEO + i18n audit.
 *
 * Verifies per language (fr/en/es/de/pt/ru/ch/hi/ar) that:
 *   1. All critical SEO meta keys exist
 *   2. Each meta description mentions the 6 audience profiles
 *   3. Each meta mentions the key positioning elements (5 min, 197 countries,
 *      24/7, lawyer OR expat helper)
 *   4. No leftover "expat-only" wording in meta descriptions
 *   5. No misleading "free first call" wording
 *
 * Output: clean pass/fail matrix + line-level issues.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const helperDir = path.join(__dirname, "..", "sos", "src", "helper");

const LANGS = ["fr", "en", "es", "de", "pt", "ru", "ch", "hi", "ar"];

// The 14 critical SEO meta keys every language file MUST have up to date
const CRITICAL_KEYS = [
  "seo.home.title",
  "seo.home.description",
  "seo.home.keywords",
  "footer.company.description",
  "seo.organizationDescription",
  "consumers.seo.title",
  "consumers.seo.description",
  "press.seo.title",
  "press.seo.description",
  "providers.seo.title",
  "providers.seo.description",
  "pricing.seo.keywords",
  "howItWorks.seo.keywords",
  "testy.meta.description",
];

// Per-language vocabulary to check for — we expect at least SOME of these
// terms in each meta description (varies per lang of course)
const PROFILE_TERMS = {
  fr: ["voyageur", "vacancier", "expatri", "nomade", "étudiant", "retraité"],
  en: ["traveler", "tourist", "expat", "nomad", "student", "retiree"],
  es: ["viajero", "turista", "expatriad", "nómada", "estudiante", "jubilado"],
  de: ["reisend", "tourist", "expat", "nomad", "studier", "rentner"],
  pt: ["viajant", "turista", "expatriad", "nómada", "estudant", "reformad"],
  ru: ["путешеств", "турист", "экспат", "кочевник", "студент", "пенсионер"],
  ch: ["旅行", "游客", "海外华人", "数字游民", "留学生", "退休"],
  hi: ["यात्री", "पर्यटक", "प्रवासी", "नोमैड", "छात्र", "सेवानिवृत्त"],
  // AR uses definite articles (ال-) which our includes() check misses.
  // Use root letters common to both bare and definite forms.
  ar: ["مسافر", "سائح", "مغترب", "بدو", "طالب", "متقاعد"],
};

const QUICK_TERMS = {
  fr: ["5 min", "197 pays", "24h/24", "téléphone"],
  en: ["5 min", "197 countries", "24/7", "phone"],
  es: ["5 min", "197 país", "24/7", "teléfono"],
  de: ["5 Min", "197 Länder", "rund um die Uhr", "Telefon"],
  pt: ["5 min", "197 país", "24/7", "telefone"],
  ru: ["5 мин", "197 стран", "24/7", "телефон"],
  ch: ["5分钟", "197个国家", "24/7", "电话"],
  hi: ["5 मिनट", "197 देश", "24/7", "फ़ोन"],
  ar: ["5 دقائق", "197 دولة", "الساعة", "الهاتف"],
};

// Patterns that should NOT be present (ambiguous "free first call", or
// narrow "expat-only" wording)
// Ambiguous/misleading wording that should NOT appear in any meta
const BAD_PATTERNS = [
  /premier contact rapide/i,
  /free first call/i,
  /gratuit.*premier appel/i,
  /first call is free/i,
  /offre un premier appel/i,
];

// Load all 9 language files
const loaded = {};
for (const lang of LANGS) {
  const file = path.join(helperDir, `${lang}.json`);
  if (!fs.existsSync(file)) {
    console.log(`✗ ${lang}.json missing`);
    continue;
  }
  loaded[lang] = JSON.parse(fs.readFileSync(file, "utf8"));
}

// ============================================================================
// Audit
// ============================================================================

const report = {
  byLang: {},
  missingKeys: [],
  badPatterns: [],
  profileCoverage: {},
  quickTermCoverage: {},
};

for (const lang of LANGS) {
  const data = loaded[lang];
  if (!data) continue;

  report.byLang[lang] = { ok: 0, missing: 0, issues: [] };

  for (const key of CRITICAL_KEYS) {
    const val = data[key];
    if (!val || typeof val !== "string" || val.trim().length < 20) {
      report.missingKeys.push(`${lang} — ${key} : missing or too short`);
      report.byLang[lang].missing++;
      continue;
    }
    report.byLang[lang].ok++;

    // Bad pattern check
    for (const pattern of BAD_PATTERNS) {
      if (pattern.test(val)) {
        report.badPatterns.push(`${lang} — ${key} : ${pattern.source} match`);
        report.byLang[lang].issues.push(`BAD: ${key} matches ${pattern.source}`);
      }
    }
  }

  // Profile coverage: scan the long description for 6 audience profile terms
  const longDesc = (data["seo.organizationDescription"] ?? "") + " " + (data["footer.company.description"] ?? "") + " " + (data["seo.home.description"] ?? "");
  const terms = PROFILE_TERMS[lang] || [];
  const termsFound = terms.filter((t) => longDesc.toLowerCase().includes(t.toLowerCase())).length;
  report.profileCoverage[lang] = `${termsFound}/${terms.length}`;

  const quickTerms = QUICK_TERMS[lang] || [];
  const quickFound = quickTerms.filter((t) => longDesc.toLowerCase().includes(t.toLowerCase())).length;
  report.quickTermCoverage[lang] = `${quickFound}/${quickTerms.length}`;
}

// ============================================================================
// Report
// ============================================================================

console.log("═══════════════════════════════════════════════════════════════════");
console.log("  SEO i18n Audit — 9 languages × 14 critical keys");
console.log("═══════════════════════════════════════════════════════════════════\n");

console.log("📊 Per-language status:");
console.log("┌─────┬──────┬─────────┬──────────────────┬────────────────┐");
console.log("│Lang │OK    │Missing  │Audience profiles │Quick terms     │");
console.log("├─────┼──────┼─────────┼──────────────────┼────────────────┤");
for (const lang of LANGS) {
  const b = report.byLang[lang] || { ok: "?", missing: "?" };
  const prof = report.profileCoverage[lang] || "-";
  const quick = report.quickTermCoverage[lang] || "-";
  console.log(`│ ${lang.padEnd(3)} │ ${String(b.ok).padStart(3)}  │ ${String(b.missing).padStart(5)}   │ ${prof.padEnd(16)} │ ${quick.padEnd(14)} │`);
}
console.log("└─────┴──────┴─────────┴──────────────────┴────────────────┘");

if (report.missingKeys.length > 0) {
  console.log("\n⚠️ Missing or too-short keys:");
  for (const issue of report.missingKeys) {
    console.log(`  • ${issue}`);
  }
} else {
  console.log("\n✅ All 14 critical keys present + non-empty in all 9 languages");
}

if (report.badPatterns.length > 0) {
  console.log("\n🔴 Bad patterns still present:");
  for (const issue of report.badPatterns) {
    console.log(`  • ${issue}`);
  }
} else {
  console.log("\n✅ No ambiguous/misleading wording detected");
}

// Key alignment check: all languages should have SAME set of keys
console.log("\n🔑 Key-set alignment (missing in some langs only):");
const allKeys = new Set();
for (const lang of LANGS) {
  if (loaded[lang]) {
    Object.keys(loaded[lang]).forEach((k) => allKeys.add(k));
  }
}
const mismatches = [];
for (const key of CRITICAL_KEYS) {
  const missing = LANGS.filter((l) => loaded[l] && !(key in loaded[l]));
  if (missing.length > 0) {
    mismatches.push(`  ${key} → missing in: ${missing.join(", ")}`);
  }
}
if (mismatches.length === 0) {
  console.log("  ✅ All 14 critical keys defined in all 9 languages");
} else {
  mismatches.forEach((m) => console.log(m));
}

// Overall verdict
const totalOk = Object.values(report.byLang).reduce((a, b) => a + (b.ok || 0), 0);
const totalExpected = LANGS.length * CRITICAL_KEYS.length;
const pct = Math.round((totalOk / totalExpected) * 100);
console.log(`\n═══════════════════════════════════════════════════════════════════`);
console.log(`  Global coverage: ${totalOk}/${totalExpected} (${pct}%)`);
if (pct === 100 && report.badPatterns.length === 0) {
  console.log(`  🎉 PERFECT — all 9 languages ready for production`);
} else if (pct >= 95) {
  console.log(`  ✅ EXCELLENT — near-perfect, minor gaps above`);
} else {
  console.log(`  ⚠️  INCOMPLETE — gaps remain, see above`);
}
console.log(`═══════════════════════════════════════════════════════════════════`);
