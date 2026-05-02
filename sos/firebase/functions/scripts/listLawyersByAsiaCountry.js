/**
 * Liste tous les avocats RÉELS (non-AAA) approuvés/visibles/actifs intervenant dans
 * les 12 pays Asie-Pacifique demandés, avec leurs URLs (FR + EN) à soumettre dans GSC.
 *
 * Usage: node scripts/listLawyersByAsiaCountry.js > asia_lawyers_urls.txt
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'sos-urgently-ac307' });
}
const db = admin.firestore();

const TARGET_COUNTRIES = {
  AU: { fr: 'australie',   en: 'australia',   name: 'Australie' },
  KH: { fr: 'cambodge',    en: 'cambodia',    name: 'Cambodge' },
  ID: { fr: 'indonesie',   en: 'indonesia',   name: 'Indonésie' },
  JP: { fr: 'japon',       en: 'japan',       name: 'Japon' },
  LA: { fr: 'laos',        en: 'laos',        name: 'Laos' },
  MY: { fr: 'malaisie',    en: 'malaysia',    name: 'Malaisie' },
  MM: { fr: 'myanmar',     en: 'myanmar',     name: 'Myanmar (Birmanie)' },
  PH: { fr: 'philippines', en: 'philippines', name: 'Philippines' },
  SG: { fr: 'singapour',   en: 'singapore',   name: 'Singapour' },
  TW: { fr: 'taiwan',      en: 'taiwan',      name: 'Taïwan' },
  TH: { fr: 'thailande',   en: 'thailand',    name: 'Thaïlande' },
  VN: { fr: 'vietnam',     en: 'vietnam',     name: 'Vietnam' },
};

function isAaaProfile(uid) {
  return typeof uid === 'string' && uid.startsWith('aaa_');
}

function getInterventionCountries(p) {
  const set = new Set();
  if (p.country) set.add(String(p.country).toUpperCase());
  for (const field of ['operatingCountries', 'interventionCountries', 'practiceCountries']) {
    const arr = p[field];
    if (Array.isArray(arr)) {
      for (const c of arr) {
        if (c) set.add(String(c).toUpperCase());
      }
    }
  }
  return Array.from(set);
}

function pickFrUrl(p) {
  // 1) Slug Firestore (format actuel)
  if (p.slugs && typeof p.slugs.fr === 'string' && p.slugs.fr) {
    return `https://sos-expat.com/${p.slugs.fr}`;
  }
  return null;
}

function pickEnUrl(p) {
  if (p.slugs && typeof p.slugs.en === 'string' && p.slugs.en) {
    return `https://sos-expat.com/${p.slugs.en}`;
  }
  return null;
}

async function run() {
  console.error('Querying Firestore...');
  const snap = await db.collection('sos_profiles')
    .where('type', '==', 'lawyer')
    .where('isApproved', '==', true)
    .where('isVisible', '==', true)
    .where('isActive', '==', true)
    .get();

  console.error(`Total approved+visible+active lawyers: ${snap.size}`);

  const lawyersByCountry = {};
  for (const code of Object.keys(TARGET_COUNTRIES)) {
    lawyersByCountry[code] = [];
  }

  let realCount = 0;
  let aaaCount = 0;
  const allRealLawyers = [];

  snap.forEach((doc) => {
    const p = doc.data();
    const uid = p.uid || doc.id;

    const isAaa = isAaaProfile(uid);
    if (isAaa) aaaCount++;

    const interventions = getInterventionCountries(p);
    const matchedTargets = interventions.filter(c => TARGET_COUNTRIES[c]);
    if (matchedTargets.length === 0) return;

    if (!isAaa) realCount++;
    const frUrl = pickFrUrl(p);
    const enUrl = pickEnUrl(p);
    const fullName = p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Sans nom';

    const lawyer = {
      uid,
      shortId: p.shortId || '',
      fullName,
      mainCountry: (p.country || '').toUpperCase(),
      interventions,
      frUrl,
      enUrl,
      isAaa,
    };

    allRealLawyers.push(lawyer);
    for (const code of matchedTargets) {
      lawyersByCountry[code].push(lawyer);
    }
  });

  // Output
  console.log('='.repeat(80));
  console.log('AVOCATS À SOUMETTRE DANS GSC — Asie-Pacifique (12 pays)');
  console.log('='.repeat(80));
  console.log();
  console.log(`Total avocats approuvés/visibles/actifs (lawyer): ${snap.size}`);
  console.log(`  └─ Profils AAA (test) exclus: ${aaaCount}`);
  console.log(`  └─ Avocats réels intervenant dans les 12 pays cibles: ${realCount}`);
  console.log();
  console.log('-'.repeat(80));

  // Section 1 : pages liste pays (à soumettre EN PRIORITÉ — autorité partagée)
  console.log();
  console.log('📋 SECTION 1 — PAGES LISTE PAYS (à soumettre en priorité)');
  console.log('   Une page liste indexée = TOUS les avocats du pays bénéficient.');
  console.log();
  for (const [code, info] of Object.entries(TARGET_COUNTRIES)) {
    const count = lawyersByCountry[code].length;
    if (count === 0) {
      console.log(`  [${code}] ${info.name} — 0 avocat → skip`);
      continue;
    }
    console.log(`  [${code}] ${info.name} (${count} avocat${count > 1 ? 's' : ''})`);
    console.log(`    https://sos-expat.com/fr-fr/avocat/${info.fr}/`);
    console.log(`    https://sos-expat.com/en-us/lawyers/${info.en}/`);
  }

  console.log();
  console.log('-'.repeat(80));
  console.log();
  console.log('👤 SECTION 2 — FICHES AVOCATS INDIVIDUELLES');
  console.log('   Une URL FR + une URL EN par avocat (les 7 autres langues sont');
  console.log('   découvertes via les hreflang, pas besoin de les soumettre).');
  console.log();

  for (const [code, info] of Object.entries(TARGET_COUNTRIES)) {
    const list = lawyersByCountry[code];
    if (list.length === 0) continue;
    console.log();
    console.log(`### ${info.name} [${code}] — ${list.length} avocat${list.length > 1 ? 's' : ''}`);
    console.log();
    for (const l of list) {
      const isMain = l.mainCountry === code;
      const aaaTag = l.isAaa ? ' [AAA test]' : '';
      const tag = isMain ? '(pays principal)' : `(intervention — basé en ${l.mainCountry})`;
      console.log(`  • ${l.fullName} ${tag}${aaaTag}`);
      if (l.frUrl) console.log(`    FR: ${l.frUrl}`);
      else console.log(`    FR: pas de slug FR`);
      if (l.enUrl) console.log(`    EN: ${l.enUrl}`);
      else console.log(`    EN: pas de slug EN`);
    }
  }

  console.log();
  console.log('='.repeat(80));
  console.log('FIN — copier les URLs ci-dessus dans GSC → Inspection URL → Demander indexation');
  console.log('='.repeat(80));

  process.exit(0);
}

run().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});
