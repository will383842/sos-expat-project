/**
 * Reconstruit les slugs corrects pour les 3 nouveaux profils KH/LA/MM
 * (le trigger backend les a écrasés avec le code ISO en minuscule).
 *
 * Aligne aussi les slugs sur la convention "Birmanie" en FR pour MM.
 *
 * Usage: node scripts/rebuildSlugsKhLaMm.js [--dry]
 */
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'sos-urgently-ac307' });
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const DRY = process.argv.includes('--dry');

const SUPPORTED_LANGS = ['fr', 'en', 'es', 'de', 'pt', 'ru', 'zh', 'ar', 'hi'];
const DEFAULT_LOCALES = { fr: 'fr', en: 'us', es: 'es', de: 'de', pt: 'pt', ru: 'ru', zh: 'cn', ar: 'sa', hi: 'in' };
const ROLE_TRANS = { fr: 'avocat', en: 'lawyer', es: 'abogado', de: 'anwalt', pt: 'advogado', ru: 'advokat', zh: 'lushi', ar: 'muhami', hi: 'vakil' };
const COUNTRY_SLUG = {
  KH: { fr: 'cambodge',  en: 'cambodia', es: 'camboya',  de: 'kambodscha', pt: 'camboja',  ru: 'kambodzha', zh: 'jianpuzhai', ar: 'kambudia', hi: 'kambodiya' },
  LA: { fr: 'laos',      en: 'laos',     es: 'laos',     de: 'laos',       pt: 'laos',     ru: 'laos',      zh: 'laowo',      ar: 'laws',     hi: 'laos' },
  MM: { fr: 'birmanie',  en: 'myanmar',  es: 'birmania', de: 'myanmar',    pt: 'myanmar',  ru: 'myanma',    zh: 'miandian',   ar: 'mianmar',  hi: 'myanmar' },
};
const SPECIALTY_SLUG = {
  visa: { fr: 'visa', en: 'visa', es: 'visa', de: 'visum', pt: 'visto', ru: 'viza', zh: 'qianzheng', ar: 'tashira', hi: 'visa' },
};

function slugify(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function buildSlug(lang, countryCode, firstName, shortId) {
  const ll = `${lang}-${DEFAULT_LOCALES[lang]}`;
  const country = COUNTRY_SLUG[countryCode][lang];
  const role = ROLE_TRANS[lang];
  const fn = slugify(firstName);
  const spec = SPECIALTY_SLUG.visa[lang];
  return `${ll}/${role}-${country}/${fn}-${spec}-${shortId}`;
}

function buildAllSlugs(countryCode, firstName, shortId) {
  const out = {};
  for (const lang of SUPPORTED_LANGS) out[lang] = buildSlug(lang, countryCode, firstName, shortId);
  return out;
}

const TARGETS = [
  { name: 'Jean-Marc Lefebvre', countryCode: 'KH', firstName: 'Jean-Marc', uiCountry: 'Cambodge' },
  { name: 'Olivier Moreau',     countryCode: 'LA', firstName: 'Olivier',   uiCountry: 'Laos' },
  { name: 'Vincent Garnier',    countryCode: 'MM', firstName: 'Vincent',   uiCountry: 'Birmanie' },
];

(async () => {
  console.log(`Mode: ${DRY ? 'DRY' : 'PROD'}`);
  for (const t of TARGETS) {
    const snap = await db.collection('sos_profiles').where('fullName', '==', t.name).limit(1).get();
    if (snap.empty) { console.log(`[!] ${t.name} not found`); continue; }
    const d = snap.docs[0];
    const uid = d.id;
    const p = d.data();
    const shortId = p.shortId;
    if (!shortId) { console.log(`[!] ${t.name} no shortId`); continue; }

    const newSlugs = buildAllSlugs(t.countryCode, t.firstName, shortId);
    console.log(`\n=== ${t.name} (${uid}) ===`);
    console.log('  current FR:', p.slugs?.fr);
    console.log('  new FR    :', newSlugs.fr);
    console.log('  current EN:', p.slugs?.en);
    console.log('  new EN    :', newSlugs.en);

    if (DRY) continue;

    const batch = db.batch();
    batch.update(d.ref, {
      slugs: newSlugs,
      slugsUpdatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    batch.set(db.doc(`users/${uid}`), {
      slugs: newSlugs,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    batch.set(db.doc(`ui_profile_cards/${uid}`), {
      country: t.uiCountry,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    batch.set(db.doc(`ui_profile_carousel/${uid}`), {
      country: t.uiCountry,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await batch.commit();
    console.log('  [updated]');
  }

  console.log('\n[done]');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
