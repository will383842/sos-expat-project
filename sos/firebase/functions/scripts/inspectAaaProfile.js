/**
 * Inspecte 1 profil AAA pour récupérer la structure complète (template).
 *
 * Usage: node scripts/inspectAaaProfile.js <fullName>
 *  ex:   node scripts/inspectAaaProfile.js "Weera Saetang"
 *        node scripts/inspectAaaProfile.js "Mei Wong"
 */

const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'sos-urgently-ac307' });
}
const db = admin.firestore();

async function run() {
  const target = process.argv[2] || 'Weera Saetang';
  const snap = await db.collection('sos_profiles')
    .where('type', '==', 'lawyer')
    .where('fullName', '==', target)
    .limit(1)
    .get();

  if (snap.empty) {
    // Try with firstName match
    const all = await db.collection('sos_profiles').where('type', '==', 'lawyer').get();
    let found = null;
    all.forEach(d => {
      const p = d.data();
      const name = p.fullName || `${p.firstName||''} ${p.lastName||''}`.trim();
      if (name.toLowerCase().includes(target.toLowerCase())) found = { id: d.id, data: p };
    });
    if (!found) { console.error('NOT FOUND:', target); process.exit(1); }
    console.log('=== sos_profiles/' + found.id + ' ===');
    console.log(JSON.stringify(found.data, null, 2));
    const u = await db.collection('users').doc(found.id).get();
    console.log('\n=== users/' + found.id + ' (exists=' + u.exists + ') ===');
    if (u.exists) console.log(JSON.stringify(u.data(), null, 2));
    const c = await db.collection('ui_profile_cards').doc(found.id).get();
    console.log('\n=== ui_profile_cards/' + found.id + ' (exists=' + c.exists + ') ===');
    if (c.exists) console.log(JSON.stringify(c.data(), null, 2));
    const r = await db.collection('reviews').where('providerId', '==', found.id).limit(2).get();
    console.log('\n=== reviews count for ' + found.id + ': ' + r.size + ' (showing 2) ===');
    r.forEach(d => console.log(JSON.stringify(d.data(), null, 2)));
    const cs = await db.collection('call_sessions').where('metadata.providerId', '==', found.id).limit(2).get();
    console.log('\n=== call_sessions count for ' + found.id + ': ' + cs.size + ' (showing 2) ===');
    cs.forEach(d => console.log(JSON.stringify(d.data(), null, 2)));
    process.exit(0);
  }

  for (const d of snap.docs) {
    console.log('=== sos_profiles/' + d.id + ' ===');
    console.log(JSON.stringify(d.data(), null, 2));
    const u = await db.collection('users').doc(d.id).get();
    console.log('\n=== users/' + d.id + ' (exists=' + u.exists + ') ===');
    if (u.exists) console.log(JSON.stringify(u.data(), null, 2));
    const c = await db.collection('ui_profile_cards').doc(d.id).get();
    console.log('\n=== ui_profile_cards/' + d.id + ' (exists=' + c.exists + ') ===');
    if (c.exists) console.log(JSON.stringify(c.data(), null, 2));
    const cc = await db.collection('ui_profile_carousel').doc(d.id).get();
    console.log('\n=== ui_profile_carousel/' + d.id + ' (exists=' + cc.exists + ') ===');
    if (cc.exists) console.log(JSON.stringify(cc.data(), null, 2));
    const r = await db.collection('reviews').where('providerId', '==', d.id).limit(2).get();
    console.log('\n=== reviews count: ' + r.size + ' (showing 2) ===');
    r.forEach(rd => console.log(JSON.stringify(rd.data(), null, 2)));
    const cs = await db.collection('call_sessions').where('metadata.providerId', '==', d.id).limit(2).get();
    console.log('\n=== call_sessions count: ' + cs.size + ' (showing 2) ===');
    cs.forEach(csd => console.log(JSON.stringify(csd.data(), null, 2)));
  }
  process.exit(0);
}

run().catch(e => { console.error('ERROR:', e); process.exit(1); });
