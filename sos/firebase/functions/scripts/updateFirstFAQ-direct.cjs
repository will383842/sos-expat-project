#!/usr/bin/env node
/**
 * Direct update of FAQ 1 "Qu'est-ce que SOS-Expat ?" in Firestore.
 *
 * Why not call the adminResetFAQs callable?
 *   - It requires an authenticated admin user (request.auth)
 *   - We don't have the admin's ID token in this context
 *
 * Why not reset everything?
 *   - Only FAQ 1 was updated (the one that shows as Google rich-snippet)
 *   - Resetting all 10 FAQs × 9 langs = 90 writes + re-translation via
 *     MyMemory API (slow, subject to rate limits)
 *   - A targeted update of 1 doc is safer and faster
 *
 * This script uses firebase-admin with Application Default Credentials
 * (set via `firebase login` or `gcloud auth application-default login`)
 * so no service account JSON is needed.
 *
 * Usage:
 *   cd sos/firebase/functions
 *   node scripts/updateFirstFAQ-direct.cjs
 */
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "sos-urgently-ac307",
  });
}
const db = admin.firestore();

// The 9 languages supported (same list as faqInit.ts + resetFAQsCallable.ts)
const LANGS = ["fr", "en", "es", "de", "pt", "ru", "hi", "ar", "ch"];

// Translations of the new FAQ 1 answer per language
// FR is the master (owner wrote it), others are accurate translations
const TRANSLATIONS = {
  fr: {
    question: "Qu'est-ce que SOS-Expat ?",
    answer: "SOS-Expat est la première plateforme mondiale qui connecte par téléphone, en moins de 5 minutes, les voyageurs, vacanciers, expatriés, digital nomades, étudiants et retraités à un avocat francophone ou à un expatrié aidant qui connaît le terrain. Une urgence, une question administrative, un doute ou un simple conseil — nous répondons à tous les besoins dans votre langue. Consultation payante à l'acte (avocat 49€/20 min, expatrié aidant 19€/30 min), sans abonnement ni engagement. 197 pays, 9 langues, 24h/24. Peu importe votre nationalité ou votre pays.",
  },
  en: {
    question: "What is SOS-Expat?",
    answer: "SOS-Expat is the world's first platform that connects travelers, tourists, expats, digital nomads, students and retirees by phone, in under 5 minutes, to a lawyer or a helpful expat who knows the ground. An emergency, an administrative question, a doubt or just some advice — we answer every kind of need in your language. Pay-per-consultation (lawyer €49/20 min, helpful expat €19/30 min), no subscription, no commitment. 197 countries, 9 languages, 24/7. Whatever your nationality or country.",
  },
  es: {
    question: "¿Qué es SOS-Expat?",
    answer: "SOS-Expat es la primera plataforma mundial que conecta por teléfono, en menos de 5 minutos, a viajeros, turistas, expatriados, nómadas digitales, estudiantes y jubilados con un abogado hispanohablante o un expatriado ayudante que conoce el terreno. Una emergencia, una pregunta administrativa, una duda o un simple consejo — respondemos a todas las necesidades en tu idioma. Consulta de pago por acto (abogado 49€/20 min, expatriado ayudante 19€/30 min), sin suscripción ni compromiso. 197 países, 9 idiomas, 24/7. Sin importar tu nacionalidad o país.",
  },
  de: {
    question: "Was ist SOS-Expat?",
    answer: "SOS-Expat ist die erste weltweite Plattform, die Reisende, Touristen, Expats, Digital Nomads, Studierende und Rentner in unter 5 Minuten telefonisch mit einem deutschsprachigen Anwalt oder einem hilfsbereiten Expat verbindet, der das Gelände kennt. Ein Notfall, eine verwaltungstechnische Frage, ein Zweifel oder nur ein Rat — wir beantworten jede Art von Bedürfnis in Ihrer Sprache. Bezahlte Beratung pro Gespräch (Anwalt 49€/20 Min, hilfsbereiter Expat 19€/30 Min), ohne Abonnement, ohne Bindung. 197 Länder, 9 Sprachen, rund um die Uhr. Unabhängig von Nationalität oder Land.",
  },
  pt: {
    question: "O que é SOS-Expat?",
    answer: "SOS-Expat é a primeira plataforma mundial que liga por telefone, em menos de 5 minutos, viajantes, turistas, expatriados, nómadas digitais, estudantes e reformados a um advogado lusófono ou a um expatriado ajudante que conhece o terreno. Uma emergência, uma questão administrativa, uma dúvida ou apenas um conselho — respondemos a todos os tipos de necessidade no seu idioma. Consulta paga por ato (advogado 49€/20 min, expatriado ajudante 19€/30 min), sem subscrição nem compromisso. 197 países, 9 idiomas, 24/7. Independentemente da sua nacionalidade ou país.",
  },
  ru: {
    question: "Что такое SOS-Expat?",
    answer: "SOS-Expat — первая в мире платформа, которая менее чем за 5 минут по телефону соединяет путешественников, туристов, экспатов, цифровых кочевников, студентов и пенсионеров с русскоязычным юристом или с помогающим экспатом, знающим местность. Срочная ситуация, административный вопрос, сомнение или просто совет — мы отвечаем на любые потребности на вашем языке. Оплата за консультацию (юрист 49€/20 мин, помогающий экспат 19€/30 мин), без подписки и обязательств. 197 стран, 9 языков, 24/7. Независимо от вашей национальности или страны.",
  },
  hi: {
    question: "SOS-Expat क्या है?",
    answer: "SOS-Expat दुनिया का पहला प्लेटफ़ॉर्म है जो 5 मिनट से कम में फ़ोन के माध्यम से यात्रियों, पर्यटकों, प्रवासियों, डिजिटल नोमैड, छात्रों और सेवानिवृत्त लोगों को हिंदी बोलने वाले वकील या स्थानीय जानकारी वाले मददगार प्रवासी से जोड़ता है। आपातकाल, प्रशासनिक प्रश्न, संदेह या केवल सलाह — हम आपकी भाषा में हर प्रकार की ज़रूरत का उत्तर देते हैं। प्रति सेवा भुगतान परामर्श (वकील 49€/20 मिनट, मददगार प्रवासी 19€/30 मिनट), बिना सदस्यता या प्रतिबद्धता के। 197 देश, 9 भाषाएं, 24/7। आपकी राष्ट्रीयता या देश की परवाह किए बिना।",
  },
  ar: {
    question: "ما هو SOS-Expat؟",
    answer: "SOS-Expat هي أول منصة عالمية تربط عبر الهاتف، في أقل من 5 دقائق، المسافرين والسياح والمغتربين والبدو الرقميين والطلاب والمتقاعدين بمحامٍ ناطق بالعربية أو مغترب مساعد يعرف الميدان. حالة طارئة، سؤال إداري، شك أو مجرد نصيحة — نجيب على جميع أنواع الاحتياجات بلغتك. استشارة مدفوعة لكل جلسة (محامٍ 49€/20 دقيقة، مغترب مساعد 19€/30 دقيقة)، بدون اشتراك أو التزام. 197 دولة، 9 لغات، على مدار الساعة. بغض النظر عن جنسيتك أو بلدك.",
  },
  ch: {
    question: "SOS-Expat是什么？",
    answer: "SOS-Expat是全球首个平台，可在5分钟内通过电话将旅行者、游客、海外华人、数字游民、留学生和退休人员与华语律师或熟悉当地情况的热心海外同胞对接。紧急情况、行政问题、疑虑或仅仅是一条建议——我们用您的语言回应所有需求。按次付费咨询（律师49€/20分钟，热心海外同胞19€/30分钟），无需订阅或承诺。覆盖197个国家，支持9种语言，全天候24/7服务。无论您的国籍或所在国家。",
  },
};

async function main() {
  console.log("[updateFirstFAQ] Searching for existing 'Qu'est-ce que SOS-Expat ?' FAQ...");

  const snapshot = await db.collection("app_faq").get();
  const matches = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const questionFr = (data.question?.fr || "").toLowerCase();
    if (
      questionFr.includes("qu'est-ce que sos-expat") ||
      questionFr.includes("what is sos-expat") ||
      (data.category === "discover" && data.order === 1)
    ) {
      matches.push({ id: doc.id, data });
    }
  }

  console.log(`[updateFirstFAQ] Found ${matches.length} matching FAQ document(s)`);

  if (matches.length === 0) {
    console.log("[updateFirstFAQ] No existing FAQ 1 found — seeding a new one");
    const newDoc = {
      question: Object.fromEntries(Object.entries(TRANSLATIONS).map(([l, v]) => [l, v.question])),
      answer: Object.fromEntries(Object.entries(TRANSLATIONS).map(([l, v]) => [l, v.answer])),
      category: "discover",
      tags: ["présentation", "plateforme", "mission", "voyageurs", "vacanciers", "expatriés", "digital nomades", "étudiants", "retraités", "urgence", "tarifs"],
      order: 1,
      isActive: true,
      isFooter: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const ref = await db.collection("app_faq").add(newDoc);
    console.log(`[updateFirstFAQ] ✓ Created new FAQ ${ref.id}`);
    return;
  }

  for (const { id, data } of matches) {
    console.log(`[updateFirstFAQ] Updating FAQ ${id}...`);
    const updatedQuestions = { ...(data.question || {}) };
    const updatedAnswers = { ...(data.answer || {}) };
    for (const [lang, values] of Object.entries(TRANSLATIONS)) {
      updatedQuestions[lang] = values.question;
      updatedAnswers[lang] = values.answer;
    }
    await db.collection("app_faq").doc(id).update({
      question: updatedQuestions,
      answer: updatedAnswers,
      tags: ["présentation", "plateforme", "mission", "voyageurs", "vacanciers", "expatriés", "digital nomades", "étudiants", "retraités", "urgence", "tarifs"],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`[updateFirstFAQ] ✓ Updated FAQ ${id} in 9 languages`);
  }

  console.log("[updateFirstFAQ] Done.");
}

main()
  .then(() => {
    console.log("✅ Success");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
