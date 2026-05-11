/**
 * Affiche pour chaque compte regional la liste des pays couverts par ses providers lies.
 * But: deduire le mapping country -> compte regional avec certitude (au lieu de deviner).
 */
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'sos-urgently-ac307' });
const db = admin.firestore();

const REGIONAL_ACCOUNTS = [
  'aaa-multicompte-afrique@sos-expat.com',
  'aaa-multicompte-ameriques@sos-expat.com',
  'aaa-multicompte-asie-oceanie@sos-expat.com',
  'aaa-multicompte-europe@sos-expat.com',
];

async function main() {
  for (const email of REGIONAL_ACCOUNTS) {
    const snap = await db.collection('users').where('email', '==', email).limit(1).get();
    if (snap.empty) { console.log(email, '-> compte introuvable'); continue; }
    const accUid = snap.docs[0].id;
    const linked = snap.docs[0].data().linkedProviderIds || [];

    const countries = new Map();
    for (const pid of linked) {
      const u = await db.collection('users').doc(pid).get();
      if (!u.exists) continue;
      const c = u.data().country || '(none)';
      countries.set(c, (countries.get(c) || 0) + 1);
    }
    const sorted = [...countries.entries()].sort((a,b) => b[1]-a[1]);
    console.log(`\n[${email}] uid=${accUid}, total=${linked.length}`);
    console.log('  pays:', sorted.map(([c,n]) => `${c}(${n})`).join(', '));
  }
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
