/**
 * Met à jour le slug FR des avocats MM (Myanmar -> Birmanie en FR)
 * en remplaçant 'avocat-myanmar' par 'avocat-birmanie' dans slugs.fr.
 *
 * Egalement: aligne ui_profile_cards/ui_profile_carousel.country sur "Birmanie"
 * pour Vincent Garnier (deja mis a "Birmanie" a la creation, mais ce script
 * sert d'idempotent fixer pour tout le pays MM).
 *
 * Usage: node scripts/updateMmSlugsBirmanie.js [--dry]
 */
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'sos-urgently-ac307' });
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const DRY = process.argv.includes('--dry');

(async () => {
  console.log(`Mode: ${DRY ? 'DRY' : 'PROD'}`);
  // 1) Tous les profils ou country == "MM" (pays principal MM)
  const snap = await db.collection('sos_profiles')
    .where('type', '==', 'lawyer')
    .where('country', '==', 'MM')
    .get();
  console.log(`Profils avec country=MM: ${snap.size}`);

  let updated = 0;
  for (const d of snap.docs) {
    const p = d.data();
    const slugs = p.slugs || {};
    const oldFrSlug = slugs.fr || '';
    if (!oldFrSlug.includes('avocat-myanmar')) {
      console.log(`  [skip] ${d.id} (${p.fullName}) slug FR: ${oldFrSlug}`);
      continue;
    }
    const newFrSlug = oldFrSlug.replace('avocat-myanmar', 'avocat-birmanie');
    console.log(`  [fix] ${d.id} (${p.fullName})`);
    console.log(`        old slug FR: ${oldFrSlug}`);
    console.log(`        new slug FR: ${newFrSlug}`);
    if (DRY) continue;

    const batch = db.batch();
    batch.update(d.ref, {
      'slugs.fr': newFrSlug,
      slugsUpdatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    batch.set(db.doc(`users/${d.id}`), {
      'slugs.fr': newFrSlug,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    // ui_profile_cards / ui_profile_carousel : align country to "Birmanie" (cohérent avec countries.ts maj)
    batch.set(db.doc(`ui_profile_cards/${d.id}`), {
      country: 'Birmanie',
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    batch.set(db.doc(`ui_profile_carousel/${d.id}`), {
      country: 'Birmanie',
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await batch.commit();
    updated++;
  }

  console.log(`\nTermine. Updated: ${updated}`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
