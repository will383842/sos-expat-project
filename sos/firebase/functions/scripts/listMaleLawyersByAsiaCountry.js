/**
 * Liste UNIQUEMENT les avocats de SEXE MASCULIN (gender === 'male')
 * approuvés/visibles/actifs intervenant dans les 12 pays Asie-Pacifique prioritaires.
 *
 * Usage: node scripts/listMaleLawyersByAsiaCountry.js > male_asia_lawyers.txt
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'sos-urgently-ac307' });
}
const db = admin.firestore();

const TARGET_COUNTRIES = {
  AU: { name: 'Australie' },
  KH: { name: 'Cambodge' },
  ID: { name: 'Indonésie' },
  JP: { name: 'Japon' },
  LA: { name: 'Laos' },
  MY: { name: 'Malaisie' },
  MM: { name: 'Myanmar (Birmanie)' },
  PH: { name: 'Philippines' },
  SG: { name: 'Singapour' },
  TW: { name: 'Taïwan' },
  TH: { name: 'Thaïlande' },
  VN: { name: 'Vietnam' },
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

async function run() {
  console.error('Querying Firestore (sos_profiles type=lawyer)...');
  const snap = await db.collection('sos_profiles')
    .where('type', '==', 'lawyer')
    .where('isApproved', '==', true)
    .where('isVisible', '==', true)
    .where('isActive', '==', true)
    .get();

  console.error(`Total approved+visible+active lawyers: ${snap.size}`);

  // Sondage du champ gender (peut etre dans sos_profiles OU dans users)
  const userIdsToFetch = new Set();
  const profileMap = new Map();
  snap.forEach((doc) => {
    const p = doc.data();
    const uid = p.uid || doc.id;
    profileMap.set(uid, { p, profileId: doc.id });
    userIdsToFetch.add(uid);
  });

  // Chargement parallele des users pour recuperer 'gender' s'il n'est pas dans sos_profiles
  const userDocs = await Promise.all(
    Array.from(userIdsToFetch).map(uid => db.collection('users').doc(uid).get())
  );
  const userMap = new Map();
  userDocs.forEach(d => {
    if (d.exists) userMap.set(d.id, d.data());
  });

  const lawyersByCountry = {};
  for (const code of Object.keys(TARGET_COUNTRIES)) {
    lawyersByCountry[code] = { male: [], female: [], unknown: [] };
  }

  let totalMatched = 0;
  let totalRealMatched = 0;
  let aaaMatched = 0;
  let maleMatched = 0;
  let femaleMatched = 0;
  let unknownGenderMatched = 0;

  profileMap.forEach(({ p }, uid) => {
    const interventions = getInterventionCountries(p);
    const matchedTargets = interventions.filter(c => TARGET_COUNTRIES[c]);
    if (matchedTargets.length === 0) return;

    totalMatched++;
    const isAaa = isAaaProfile(uid);
    if (isAaa) aaaMatched++;
    else totalRealMatched++;

    const u = userMap.get(uid) || {};
    let gender = (p.gender || u.gender || '').toString().toLowerCase().trim();
    // normalisation possible: 'm','male','homme' / 'f','female','femme'
    if (['m', 'male', 'homme', 'masculin', 'man'].includes(gender)) gender = 'male';
    else if (['f', 'female', 'femme', 'feminin', 'feminine', 'woman'].includes(gender)) gender = 'female';
    else gender = 'unknown';

    if (gender === 'male') maleMatched++;
    else if (gender === 'female') femaleMatched++;
    else unknownGenderMatched++;

    const fullName = p.fullName || `${p.firstName || u.firstName || ''} ${p.lastName || u.lastName || ''}`.trim() || 'Sans nom';
    const lawyer = {
      uid,
      fullName,
      mainCountry: (p.country || '').toUpperCase(),
      interventions,
      isAaa,
      gender,
      rawGender: (p.gender || u.gender || '').toString(),
    };

    for (const code of matchedTargets) {
      lawyersByCountry[code][gender].push(lawyer);
    }
  });

  console.log('='.repeat(80));
  console.log('AVOCATS HOMMES (sexe masculin) — 12 pays Asie-Pacifique');
  console.log('='.repeat(80));
  console.log();
  console.log(`Total avocats matchant les 12 pays cibles: ${totalMatched}`);
  console.log(`  ├─ AAA (test): ${aaaMatched}`);
  console.log(`  └─ Réels: ${totalRealMatched}`);
  console.log();
  console.log(`Répartition par genre (toutes interventions cumulées):`);
  console.log(`  ├─ Homme  : ${maleMatched}`);
  console.log(`  ├─ Femme  : ${femaleMatched}`);
  console.log(`  └─ Inconnu: ${unknownGenderMatched}`);
  console.log();
  console.log('-'.repeat(80));
  console.log('COMPTAGE HOMMES PAR PAYS');
  console.log('-'.repeat(80));
  console.log();

  for (const [code, info] of Object.entries(TARGET_COUNTRIES)) {
    const males = lawyersByCountry[code].male;
    const females = lawyersByCountry[code].female;
    const unknown = lawyersByCountry[code].unknown;
    const malesReal = males.filter(l => !l.isAaa).length;
    const malesAaa = males.filter(l => l.isAaa).length;

    console.log(`[${code}] ${info.name}`);
    console.log(`    Hommes : ${males.length}  (réels: ${malesReal} | AAA: ${malesAaa})`);
    console.log(`    Femmes : ${females.length}`);
    if (unknown.length) console.log(`    Inconnu: ${unknown.length}`);
    if (males.length > 0) {
      for (const l of males) {
        const tag = l.mainCountry === code ? '(pays principal)' : `(intervention — basé en ${l.mainCountry})`;
        const aaa = l.isAaa ? ' [AAA test]' : '';
        console.log(`      • ${l.fullName} ${tag}${aaa}  [gender raw="${l.rawGender}"]`);
      }
    }
    console.log();
  }

  console.log('='.repeat(80));
  process.exit(0);
}

run().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});
