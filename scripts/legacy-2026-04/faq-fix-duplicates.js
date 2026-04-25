// faq-fix-duplicates.js — Corrige les 6 doublons d'ordre en renumerotant les FAQs en double
// node faq-fix-duplicates.js

process.env.GOOGLE_APPLICATION_CREDENTIALS =
  (process.env.APPDATA || require("os").homedir() + "/AppData/Roaming") +
  "/firebase/williamsjullin_gmail_com_application_default_credentials.json";

const admin = require("./sos/firebase/functions/node_modules/firebase-admin");
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "sos-urgently-ac307",
});
const db = admin.firestore();

// Pour chaque order dupliqué :
// - le doc SANS createdAt = le plus ancien → garde son order
// - le doc AVEC createdAt (Jan 5 2026) → reçoit un nouvel order > 80
// Cas particulier order 30 : [1] est sans createdAt (garde 30), [0] est Jan5 → renumber
const REASSIGNMENTS = [
  { id: "vLf0BOTSw7w34gMQBHCf", newOrder: 81, reason: "Combien de temps dure un appel? (doublon order 14)" },
  { id: "n5ZC58RwHnJ8htcYgQVs", newOrder: 82, reason: "Comment devenir prestataire? (doublon order 20)" },
  { id: "djFVhpxAeNQDSE0YZ5SG", newOrder: 83, reason: "Comment suis-je payé? (doublon order 22)" },
  { id: "PVTFuA2TaBVc1IosZiYK", newOrder: 84, reason: "Comment fonctionne la rémunération? (doublon order 25)" },
  { id: "c9ezdEpxqDFOd6RIsTds", newOrder: 85, reason: "Comment fonctionne le paiement? (doublon order 30)" },
  { id: "6b2mgavNPpH9ATOwKqby", newOrder: 86, reason: "Quels sont les tarifs? (doublon order 31)" },
];

async function main() {
  console.log("🔧 Correction des doublons d'ordre...\n");

  const batch = db.batch();

  for (const item of REASSIGNMENTS) {
    const ref = db.collection("app_faq").doc(item.id);
    const snap = await ref.get();
    if (!snap.exists) {
      console.log(`❌ Doc ${item.id} introuvable`);
      continue;
    }
    const oldOrder = snap.data().order;
    batch.update(ref, {
      order: item.newOrder,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`  ✅ ${item.reason}`);
    console.log(`     order ${oldOrder} → ${item.newOrder}`);
  }

  await batch.commit();
  console.log("\n✅ Batch commit réussi !\n");

  // Vérification finale
  const snap2 = await db.collection("app_faq").orderBy("order").get();
  const byOrder = {};
  for (const d of snap2.docs) {
    const o = d.data().order;
    byOrder[o] = (byOrder[o] || 0) + 1;
  }
  const dups = Object.entries(byOrder).filter(([, v]) => v > 1);
  if (dups.length === 0) {
    console.log(`✅ Aucun doublon — ${snap2.size} FAQs avec orders uniques`);
  } else {
    console.log("❌ Doublons restants:", dups);
  }
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
