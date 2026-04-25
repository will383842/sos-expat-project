// Runner — insère les 20 FAQ dans Firestore (app_faq)
// Utilise les credentials ADC Firebase CLI

process.env.GOOGLE_APPLICATION_CREDENTIALS =
  process.env.APPDATA + "/firebase/williamsjullin_gmail_com_application_default_credentials.json";

const admin = require("./sos/firebase/functions/node_modules/firebase-admin");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "sos-urgently-ac307",
});

const db = admin.firestore();

// ──── FAQ DATA ────────────────────────────────────────────────────────────────
// (importé depuis le fichier principal pour éviter la duplication)
const { faqs } = require("./faq-data.js");

async function insertFaqs() {
  console.log(`Insertion de ${faqs.length} FAQ dans app_faq...`);
  const batch = db.batch();
  faqs.forEach((faq) => {
    const ref = db.collection("app_faq").doc();
    batch.set(ref, faq);
  });
  await batch.commit();
  console.log(`✅ ${faqs.length} FAQ insérées avec succès dans app_faq`);
  process.exit(0);
}

insertFaqs().catch((err) => {
  console.error("❌ Erreur :", err.message);
  process.exit(1);
});
