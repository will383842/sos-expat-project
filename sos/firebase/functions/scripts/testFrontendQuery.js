/**
 * Reproduit EXACTEMENT la query frontend ProvidersByCountry pour MM/KH/LA
 * pour verifier si nos 3 profils ressortent bien.
 */
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'sos-urgently-ac307' });
const db = admin.firestore();

async function testCountry(code, nameFr, nameEn) {
  const variants = [code, nameFr, nameEn].filter(Boolean);
  console.log(`\n=== Query for ${code} (${nameFr}) ===`);
  console.log(`Country variants: ${JSON.stringify(variants)}`);

  // Query 1: country == variant
  for (const cv of variants) {
    const q = await db.collection('sos_profiles')
      .where('isApproved', '==', true)
      .where('isVisible', '==', true)
      .where('isActive', '==', true)
      .where('type', '==', 'lawyer')
      .where('country', '==', cv)
      .limit(100)
      .get();
    console.log(`  Query country==${cv}: ${q.size} hit(s)`);
    q.forEach(d => {
      const p = d.data();
      console.log(`    - ${p.fullName} [${d.id}] gender=${p.gender}`);
    });
  }

  // Query 2: operatingCountries array-contains code
  const q2 = await db.collection('sos_profiles')
    .where('isApproved', '==', true)
    .where('isVisible', '==', true)
    .where('isActive', '==', true)
    .where('type', '==', 'lawyer')
    .where('operatingCountries', 'array-contains', code)
    .limit(100)
    .get();
  console.log(`  Query operatingCountries array-contains ${code}: ${q2.size} hit(s)`);
  q2.forEach(d => {
    const p = d.data();
    console.log(`    - ${p.fullName} [${d.id}] gender=${p.gender}`);
  });
}

(async () => {
  await testCountry('KH', 'Cambodge', 'Cambodia');
  await testCountry('LA', 'Laos', 'Laos');
  await testCountry('MM', 'Myanmar', 'Myanmar');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
