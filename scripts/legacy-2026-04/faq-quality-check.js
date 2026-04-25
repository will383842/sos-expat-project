// faq-quality-check.js — Audit qualité des traductions FAQ (9 langues)
// node faq-quality-check.js

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

// Seuils de longueur minimale pour question/answer par langue (chars)
const MIN_QUESTION = 20;
const MIN_ANSWER = 80;
// Ratio max entre la langue la plus longue et la plus courte (réponse)
// ex: si FR=500 chars et EN=50, c'est suspect (ratio=10)
const MAX_RATIO = 8;

// Mots-clés en français qui ne devraient PAS apparaître dans d'autres langues
// (signe que la traduction est identique au FR = pas traduit)
const FR_MARKERS = ["expat", "SOS-Expat", "l'appel", "le prestataire", "un avocat"];

async function main() {
  const snapshot = await db.collection("app_faq").orderBy("order").get();
  console.log(`\n📊 Audit qualité — ${snapshot.size} FAQs × 9 langues\n`);
  console.log("═".repeat(70));

  const issues = [];

  for (const d of snapshot.docs) {
    const data = d.data();
    const order = data.order;
    const docIssues = [];

    // 1. Vérifier longueur minimale
    for (const lang of LANGS) {
      const q = data.question?.[lang] || "";
      const a = data.answer?.[lang] || "";
      if (q.length < MIN_QUESTION) docIssues.push(`question.${lang} trop courte (${q.length} chars)`);
      if (a.length < MIN_ANSWER) docIssues.push(`answer.${lang} trop courte (${a.length} chars)`);
    }

    // 2. Vérifier que les slugs sont en ASCII romanisé
    for (const lang of LANGS) {
      const slug = data.slug?.[lang] || "";
      // Slugs doivent contenir seulement a-z, 0-9, tirets
      if (!/^[a-z0-9-]+$/.test(slug)) {
        docIssues.push(`slug.${lang} contient des chars non-ASCII: "${slug.substring(0, 40)}"`);
      }
      // Slugs pour AR/RU/HI/CH doivent avoir un préfixe langue
      if (["ar", "ru", "hi", "ch"].includes(lang)) {
        if (!slug.startsWith(lang + "-")) {
          docIssues.push(`slug.${lang} sans préfixe "${lang}-": "${slug}"`);
        }
      }
    }

    // 3. Détecter les réponses suspicieusement courtes vs la moyenne
    const answerLengths = LANGS.map(lang => (data.answer?.[lang] || "").replace(/<[^>]+>/g, "").length);
    const maxLen = Math.max(...answerLengths);
    const minLen = Math.min(...answerLengths);
    if (maxLen > 0 && minLen > 0 && maxLen / minLen > MAX_RATIO) {
      const shortLangs = LANGS.filter((lang, i) => answerLengths[i] < maxLen / MAX_RATIO);
      if (shortLangs.length > 0) {
        docIssues.push(`réponses anormalement courtes vs FR (ratio ${Math.round(maxLen/minLen)}x): ${shortLangs.join(", ")}`);
      }
    }

    // 4. Vérifier que les slugs sont uniques (pas de dupliqué entre langues)
    const slugValues = LANGS.map(lang => data.slug?.[lang] || "");
    const uniqueSlugs = new Set(slugValues);
    if (uniqueSlugs.size < LANGS.length) {
      // Trouver les doublons
      const seen = {};
      slugValues.forEach((s, i) => {
        if (!seen[s]) seen[s] = [];
        seen[s].push(LANGS[i]);
      });
      for (const [slug, langs] of Object.entries(seen)) {
        if (langs.length > 1) {
          docIssues.push(`slug identique pour ${langs.join("/")} : "${slug}"`);
        }
      }
    }

    // 5. Vérifier fields obligatoires
    if (!data.category) docIssues.push("category manquant");
    if (!data.tags || data.tags.length === 0) docIssues.push("tags vide");
    if (data.isActive === undefined) docIssues.push("isActive manquant");

    if (docIssues.length > 0) {
      issues.push({ order, id: d.id, fr: data.question?.fr?.substring(0, 50), docIssues });
    }
  }

  // Rapport
  if (issues.length === 0) {
    console.log("✅ Aucun problème détecté — toutes les traductions passent l'audit qualité !\n");
  } else {
    console.log(`⚠️  ${issues.length} FAQ(s) avec problèmes :\n`);
    for (const item of issues) {
      console.log(`\n  FAQ #${item.order} (${item.id})`);
      console.log(`  "${item.fr}..."`);
      for (const issue of item.docIssues) {
        console.log(`    ❌ ${issue}`);
      }
    }
  }

  // Stats globales
  console.log("\n" + "═".repeat(70));
  console.log("\n📈 Longueur moyenne des réponses par langue :");
  for (const lang of LANGS) {
    const lengths = [];
    for (const d of snapshot.docs) {
      const a = d.data().answer?.[lang] || "";
      lengths.push(a.replace(/<[^>]+>/g, "").length);
    }
    const avg = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
    const min = Math.min(...lengths);
    const max = Math.max(...lengths);
    console.log(`  ${lang.padEnd(3)} avg=${String(avg).padStart(4)} chars  min=${String(min).padStart(4)}  max=${String(max).padStart(4)}`);
  }

  console.log("\n📋 Vérification slugs ASCII préfixés (AR/RU/HI/CH) :");
  let slugOk = 0, slugFail = 0;
  for (const d of snapshot.docs) {
    for (const lang of ["ar", "ru", "hi", "ch"]) {
      const slug = d.data().slug?.[lang] || "";
      if (/^[a-z0-9-]+$/.test(slug) && slug.startsWith(lang + "-")) {
        slugOk++;
      } else {
        slugFail++;
        if (slugFail <= 5) console.log(`  ❌ #${d.data().order} slug.${lang} = "${slug.substring(0, 50)}"`);
      }
    }
  }
  console.log(`  ✅ ${slugOk} slugs OK   ❌ ${slugFail} slugs problématiques`);

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
