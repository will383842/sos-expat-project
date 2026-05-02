/**
 * Verifie que les 3 nouveaux profils + la correction Mei->Jian sont bien en base.
 */
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'sos-urgently-ac307' });
const db = admin.firestore();

const TARGETS = [
  { name: 'Jean-Marc Lefebvre', country: 'KH' },
  { name: 'Olivier Moreau',     country: 'LA' },
  { name: 'Vincent Garnier',    country: 'MM' },
  { name: 'Jian Wong',          country: 'SG' },
];

async function check(name, country) {
  const snap = await db.collection('sos_profiles').where('fullName', '==', name).limit(1).get();
  if (snap.empty) return { name, country, ok: false, err: 'sos_profiles MISSING' };
  const doc = snap.docs[0];
  const uid = doc.id;
  const p = doc.data();

  const checks = {
    sos_profiles: doc.exists,
    fullName_match: p.fullName === name,
    gender_male: p.gender === 'male',
    country_match: p.country === country,
    languages_fr_only: Array.isArray(p.languages) && p.languages.length === 1 && p.languages[0] === 'fr',
    isAAA: p.isAAA === true,
    isApproved: p.isApproved === true,
    isVisible: p.isVisible === true,
    isActive: p.isActive === true,
    isCallable: p.isCallable === true,
    has_specialties: Array.isArray(p.specialties) && p.specialties.length >= 5,
    specialties_count: (p.specialties || []).length,
    has_slugs_9langs: p.slugs && Object.keys(p.slugs).length === 9,
    has_shortId: !!p.shortId,
    has_photo: !!p.photoURL,
    has_bio_fr: !!(p.bio && p.bio.fr),
    rating: p.rating,
    reviewCount_field: p.reviewCount,
  };

  const u = await db.collection('users').doc(uid).get();
  checks.users = u.exists;

  const c = await db.collection('ui_profile_cards').doc(uid).get();
  checks.ui_profile_cards = c.exists;
  if (c.exists) checks.card_title_match = c.data().title === name;

  const cc = await db.collection('ui_profile_carousel').doc(uid).get();
  checks.ui_profile_carousel = cc.exists;
  if (cc.exists) checks.carousel_title_match = cc.data().title === name;

  const r = await db.collection('reviews').where('providerId', '==', uid).get();
  checks.reviews_actual_count = r.size;

  const cs = await db.collection('call_sessions').where('metadata.providerId', '==', uid).get();
  checks.call_sessions_actual_count = cs.size;

  // Verifier que toutes les call_sessions ont le bon providerName
  let badCallNames = 0;
  cs.forEach(d => { if (d.data()?.metadata?.providerName !== name) badCallNames++; });
  checks.call_sessions_name_mismatch = badCallNames;

  return { name, country, uid, checks };
}

(async () => {
  for (const t of TARGETS) {
    const r = await check(t.name, t.country);
    console.log('\n=== ' + t.name + ' (' + t.country + ') ===');
    if (r.err) { console.log('  ERROR:', r.err); continue; }
    console.log('  uid:', r.uid);
    for (const [k, v] of Object.entries(r.checks)) {
      const isBool = typeof v === 'boolean';
      const flag = isBool ? (v ? 'OK ' : 'KO ') : '   ';
      console.log('  ' + flag + k + ': ' + v);
    }
  }
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
