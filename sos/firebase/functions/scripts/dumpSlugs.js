const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'sos-urgently-ac307' });
const db = admin.firestore();
const TARGETS = ['Jean-Marc Lefebvre', 'Olivier Moreau', 'Vincent Garnier', 'Jian Wong'];
(async () => {
  for (const name of TARGETS) {
    const s = await db.collection('sos_profiles').where('fullName', '==', name).limit(1).get();
    if (s.empty) { console.log(name + ': NOT FOUND'); continue; }
    const d = s.docs[0]; const p = d.data();
    console.log(`\n=== ${name} (${d.id}) ===`);
    console.log('country:', p.country);
    console.log('slugs.fr:', p.slugs?.fr);
    console.log('slugs.en:', p.slugs?.en);
  }
  process.exit(0);
})();
