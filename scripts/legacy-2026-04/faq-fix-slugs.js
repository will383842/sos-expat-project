// faq-fix-slugs.js — Corrige tous les slugs non-ASCII + préfixes incorrects
// Stratégie: AR → ar-{english_slug}, CH zh- → ch-, accents spéciaux normalisés
// node faq-fix-slugs.js

process.env.GOOGLE_APPLICATION_CREDENTIALS =
  (process.env.APPDATA || require("os").homedir() + "/AppData/Roaming") +
  "/firebase/williamsjullin_gmail_com_application_default_credentials.json";

const admin = require("./sos/firebase/functions/node_modules/firebase-admin");
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "sos-urgently-ac307",
});
const db = admin.firestore();

// Correction des slugs par doc ID
// Format: { id, slug: { ar?, ch?, ru?, hi?, es?, pt? } }
// Pour AR: ar-{english_slug_sans_prefix}
// Pour CH: remplacer zh- par ch-, supprimer chars non-ASCII

const FIXES = [
  // ── Chinese: zh- → ch- (anciens docs) ──────────────────────────────────────
  { id: "lAmf1KxzUBjblqoT8g2j", slug: { ch: "ch-how-does-sos-expat-platform-work" } },
  { id: "LR7rmq5ZzCXXeM8sZYOQ", slug: { ch: "ch-difference-lawyer-expat-helper" } },
  { id: "n5ZC58RwHnJ8htcYgQVs", slug: { ch: "ch-how-to-become-provider-sos-expat" } },
  { id: "djFVhpxAeNQDSE0YZ5SG", slug: { ch: "ch-how-do-i-get-paid-sos-expat" } },
  { id: "PVTFuA2TaBVc1IosZiYK", slug: { ch: "ch-how-does-compensation-work-sos-expat" } },
  { id: "c9ezdEpxqDFOd6RIsTds", slug: { ch: "ch-how-does-payment-work-sos-expat" } },

  // ── Chinese: caractères spéciaux (ü, Cyrillic о) ───────────────────────────
  { id: "3bDkK2Jnoa6XZ2Zv5kNQ", slug: { ch: "ch-sos-holidays-luxing-jiuzhu-fuwu" } }, // ü→u
  { id: "6W67AmytFIpejYeXuSSU", slug: { ch: "ch-anzhuan-yeguo-xuanze-fuwushang",   // Cyrillic о→o
                                          ar: "ar-choose-provider-specialty-country" } },

  // ── Arabic: script arabe → ar-{english} ────────────────────────────────────
  { id: "86Lp2xjuaki6edmBQGNS", slug: { ar: "ar-optimize-provider-profile-receive-more-calls" } },
  { id: "MRzmeWHnJVl88vlxpTfZ", slug: { ar: "ar-contact-same-provider-previous-call" } },
  { id: "u36KVel0XxdyJRiLFryr", slug: { ar: "ar-provider-reviews-sos-expat-how-it-works" } },
  { id: "ITbGM14A4ErwmS1tMxIx", slug: { ar: "ar-provider-available-real-time-call" } },
  { id: "jwsCdIE8XhSQj9hnXBPC", slug: { ar: "ar-sos-expat-slow-unstable-internet-connection" } },
  { id: "xyS82MurwM42dbnoUs6v", slug: { ar: "ar-sos-expat-help-visa-immigration" } },
  { id: "wa9OTzRpEcS6Rut0jhTN", slug: { ar: "ar-landlord-rental-dispute-abroad-sos-expat" } },
  { id: "MXvcjJ1uQ70K2f4HgR0r", slug: { ar: "ar-employer-labor-law-problem-abroad" } },
  { id: "gplLHZlHJWMdK48xxKLp", slug: { ar: "ar-international-inheritance-help-sos-expat" } },
  { id: "HtCnTTF0pqldW8hCrgY5", slug: { ar: "ar-divorce-separation-abroad-sos-expat" } },
  { id: "8qsLjVfxCwscGLFqVSKD", slug: { ar: "ar-entrepreneurs-business-creation-abroad" } },
  { id: "MK2JGGgRjBEquKdFgEHU", slug: { ar: "ar-expat-taxation-double-tax-sos-expat" } },
  { id: "kqghDYapxV5kw0tj0IEx", slug: { ar: "ar-pension-social-protection-expat-sos-expat" } },
  { id: "KMHrBtIQnFII3w69dPW0", slug: { ar: "ar-accident-abroad-rights-compensation" } },
  { id: "Ae3dYoPFHd2w4oOSviEO", slug: { ar: "ar-children-rights-expat-abroad-sos-expat" } },
  { id: "sqlCshL0UjJKrGv6JAf5", slug: { ar: "ar-digital-nomads-sos-expat-visa-tax" } },
  { id: "f7xLFwV61PogwcR5oiD9", slug: { ar: "ar-expat-retirees-sos-expat-visa-tax" } },
  { id: "6mtd1oPomxGLktc23ldK", slug: { ar: "ar-student-abroad-difficulties-help-sos-expat" } },
  { id: "iXjvYkaBA4hYBduN8NPZ", slug: { ar: "ar-flight-canceled-abroad-refund-sos-holidays" } },
  { id: "lxqvdwsXSoS9TglbRQRP", slug: { ar: "ar-hotel-not-matching-booking-dispute" } },
  { id: "Y3RCFgcVERXN9aQmxQvc", slug: { ar: "ar-sos-expat-coverage-thailand-southeast-asia" } },
  { id: "fH30MrONda2cQdCnbquq", slug: { ar: "ar-sos-expat-morocco-algeria-tunisia-maghreb",
                                          hi: "hi-sos-expat-maroko-algeria-tunisia" } }, // lowercase Algeria
  { id: "ZoE3y1uRaDCcZJQS6eQw", slug: { ar: "ar-sos-expat-gulf-countries-uae-saudi-qatar" } },
  { id: "4zef7Wd7J68raTIDLIEE", slug: { ar: "ar-sos-expat-latin-america-mexico-brazil-argentina",
                                          pt: "sos-expat-america-latina-mexico-brasil-argentina-pt" } }, // fix doublon es/pt
  { id: "XxcHJpZxWSfZ0EBuXr5l", slug: { ar: "ar-sos-expat-sub-saharan-africa-coverage" } },
  { id: "BwDsJbuMh0SadJZ7fV6u", slug: { ar: "ar-use-sos-expat-without-local-sim-wifi" } },
  { id: "8dRhbn72Agv3gqbX2ITG", slug: { ar: "ar-sos-expat-basic-smartphone-prepaid" } },
  { id: "QLTYmoE602TDYINv8jtH", slug: { ar: "ar-update-phone-number-email-sos-expat" } },
  { id: "sbO6kxnjgfeGaLRVzMiH", slug: { ar: "ar-company-expat-employees-sos-expat" } },
  { id: "HsTigYJvO4DY7qGNTViy", slug: { ar: "ar-invoices-calls-sos-expat-dashboard" } },
  { id: "QyBoleCaZz3afq8lGezO", slug: { ar: "ar-provider-no-call-after-payment" } },
  { id: "cYYiGX8hz54Ll9Wo1Gv7", slug: { ar: "ar-why-become-provider-sos-expat" } },
  { id: "RTt85CjaeVCloBorUNL7", slug: { ar: "ar-provider-earnings-income-sos-expat" } },
  { id: "WvfLkLll8K4XYy9ALehp", slug: { ar: "ar-provider-sos-expat-any-country" } },
  { id: "w8Gul81uQgtcwyXuUA4H", slug: { ar: "ar-sos-expat-vs-consulate-advantages" } },
  { id: "pSVKEOMzq4BsAkercdcc", slug: { ar: "ar-sos-expat-vs-alone-abroad-advantages" } },
  { id: "39NqgynCgaztglN3o2fz", slug: { ar: "ar-sos-expat-vs-facebook-groups-forums" } },
  { id: "QpNyIJnrCFj1K8deU17I", slug: { ar: "ar-quality-guarantees-providers-sos-expat-kyc" } },
  { id: "awKSV2geoStUwN0iGr1J", slug: { ar: "ar-sos-expat-easy-use-elderly-non-technical" } },
  { id: "EUtZlimk2pqkbI7oUk4w", slug: { ar: "ar-protection-fake-providers-scam-sos-expat" } },

  // ── Russian: non-ASCII ──────────────────────────────────────────────────────
  { id: "86Lp2xjuaki6edmBQGNS" }, // already handled above (same doc)
  // slug.ru for order 60
  { id: "XxcHJpZxWSfZ0EBuXr5l", slug: { ar: "ar-sos-expat-sub-saharan-africa-coverage",
                                          ru: "ru-sos-expat-sub-saharan-africa-coverage" } },
  // slug.ru for order 36
  { id: "MRzmeWHnJVl88vlxpTfZ", slug: { ar: "ar-contact-same-provider-previous-call",
                                          ru: "ru-contact-same-provider-previous-call" } },
];

// Dédupliquer les entrées par ID (merger les slugs)
const byId = {};
for (const fix of FIXES) {
  if (!fix.slug) continue;
  if (!byId[fix.id]) byId[fix.id] = { id: fix.id, slug: {} };
  Object.assign(byId[fix.id].slug, fix.slug);
}

async function main() {
  console.log(`\n🔧 Correction de ${Object.keys(byId).length} docs (slugs non-ASCII)...\n`);

  // Vérifier d'abord la validité de tous les nouveaux slugs
  let allValid = true;
  for (const fix of Object.values(byId)) {
    for (const [lang, slug] of Object.entries(fix.slug)) {
      if (!/^[a-z0-9-]+$/.test(slug)) {
        console.error(`❌ SLUG INVALIDE: ${fix.id}.${lang} = "${slug}"`);
        allValid = false;
      }
    }
  }
  if (!allValid) {
    console.error("\n⛔ Certains slugs sont encore invalides — correction manuelle nécessaire.");
    process.exit(1);
  }

  let updated = 0;
  const BATCH_SIZE = 500;
  let batch = db.batch();
  let count = 0;

  for (const fix of Object.values(byId)) {
    const ref = db.collection("app_faq").doc(fix.id);
    const snap = await ref.get();
    if (!snap.exists) {
      console.warn(`⚠️  Doc ${fix.id} introuvable — ignoré`);
      continue;
    }

    const currentSlugs = snap.data().slug || {};
    const newSlugs = { ...currentSlugs };
    for (const [lang, newSlug] of Object.entries(fix.slug)) {
      newSlugs[lang] = newSlug;
    }

    batch.update(ref, {
      slug: newSlugs,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    updated++;
    count++;

    const order = snap.data().order;
    const langs = Object.keys(fix.slug).join(", ");
    console.log(`  ✅ #${order} (${fix.id.substring(0, 8)}…) → ${langs}`);

    if (count >= BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) await batch.commit();

  console.log(`\n✅ ${updated} documents mis à jour\n`);

  // Vérification finale
  console.log("🔍 Vérification post-correction...");
  const snap2 = await db.collection("app_faq").get();
  let remaining = 0;
  for (const d of snap2.docs) {
    const slugs = d.data().slug || {};
    for (const lang of ["ar", "ru", "hi", "ch"]) {
      const s = slugs[lang] || "";
      if (!/^[a-z0-9-]+$/.test(s)) {
        console.log(`  ❌ #${d.data().order} slug.${lang} encore invalide: "${s.substring(0, 40)}"`);
        remaining++;
      }
    }
  }
  if (remaining === 0) {
    console.log("  ✅ Tous les slugs sont maintenant en ASCII valide !");
  } else {
    console.log(`  ⚠️  ${remaining} slugs encore invalides`);
  }

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
