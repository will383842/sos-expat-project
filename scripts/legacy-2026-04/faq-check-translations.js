// faq-check-translations.js — Vérifie les traductions 9 langues de toutes les FAQ
// node faq-check-translations.js

process.env.GOOGLE_APPLICATION_CREDENTIALS =
  (process.env.APPDATA || require("os").homedir() + "/AppData/Roaming") +
  "/firebase/williamsjullin_gmail_com_application_default_credentials.json";

const admin = require("./sos/firebase/functions/node_modules/firebase-admin");
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "sos-urgently-ac307",
});
const db = admin.firestore();

const LANGS = ["fr", "en", "es", "de", "pt", "ru", "ar", "hi", "ch"];
const FIELDS = ["question", "answer", "slug"];

async function main() {
  const snapshot = await db.collection("app_faq").orderBy("order").get();
  console.log(`\n📊 Total FAQs dans Firestore: ${snapshot.size}\n`);

  const missing = [];
  const orders = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const order = data.order ?? "?";
    orders.push(order);
    const docMissing = [];

    for (const field of FIELDS) {
      const fieldData = data[field] || {};
      for (const lang of LANGS) {
        const val = fieldData[lang];
        if (!val || val.trim() === "") {
          docMissing.push(`${field}.${lang}`);
        }
      }
    }

    if (docMissing.length > 0) {
      missing.push({ order, id: doc.id, missing: docMissing });
    }
  }

  // Résumé des ordres présents
  const sortedOrders = [...orders].sort((a, b) => a - b);
  console.log(`📋 Ordres présents: ${sortedOrders.join(", ")}\n`);

  // Vérifier les trous dans la séquence
  const expectedOrders = [];
  for (let i = sortedOrders[0]; i <= sortedOrders[sortedOrders.length - 1]; i++) {
    expectedOrders.push(i);
  }
  const missingOrders = expectedOrders.filter(o => !sortedOrders.includes(o));
  if (missingOrders.length > 0) {
    console.log(`⚠️  Ordres MANQUANTS dans la séquence: ${missingOrders.join(", ")}\n`);
  } else {
    console.log(`✅ Séquence d'ordres continue (${sortedOrders[0]} → ${sortedOrders[sortedOrders.length - 1]})\n`);
  }

  if (missing.length === 0) {
    console.log("✅ TOUTES les FAQs sont complètes dans les 9 langues !\n");
  } else {
    console.log(`❌ ${missing.length} FAQ(s) avec traductions manquantes :\n`);
    for (const m of missing) {
      console.log(`  → FAQ #${m.order} (${m.id})`);
      console.log(`     Manquant: ${m.missing.join(", ")}`);
    }
    console.log();
  }

  // Stats par langue
  console.log("📈 Couverture par langue :");
  for (const lang of LANGS) {
    let ok = 0;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.question?.[lang] && data.answer?.[lang] && data.slug?.[lang]) ok++;
    }
    const pct = Math.round((ok / snapshot.size) * 100);
    const bar = "█".repeat(Math.round(pct / 5)) + "░".repeat(20 - Math.round(pct / 5));
    console.log(`  ${lang.padEnd(3)} ${bar} ${ok}/${snapshot.size} (${pct}%)`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error("Erreur:", err);
  process.exit(1);
});
