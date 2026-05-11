/**
 * Debug : trouver pourquoi la demande "Kien" Vietnam n'apparaît pas dans le dashboard multi.
 *
 * Hypothèses testées:
 *  H1 - le doc booking_requests existe-t-il ?
 *  H2 - quel providerId a-t-il ?
 *  H3 - ce providerId est-il dans linkedProviderIds d'un compte agency_manager/admin ?
 *  H4 - createdAt est-il dans la fenêtre 30 jours ?
 *  H5 - rules : agency manager a-t-il read access (status, role) ?
 */
const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'sos-urgently-ac307' });
}
const db = admin.firestore();

async function main() {
  console.log('\n=== 1. 30 dernieres booking_requests ===\n');
  const snap = await db.collection('booking_requests')
    .orderBy('createdAt', 'desc')
    .limit(30)
    .get();
  console.log('Total trouvees:', snap.size);

  const targets = [];
  for (const d of snap.docs) {
    const data = d.data();
    const created = data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt;
    const name = (data.clientName || ((data.clientFirstName || '') + ' ' + (data.clientLastName || '')).trim()).trim();
    const provName = data.providerName || '';
    const country = data.providerCountry || data.clientCurrentCountry || '';
    const matchKien = /kien/i.test(name + ' ' + provName) || /vietnam|viet nam|VN/i.test(country + ' ' + provName + ' ' + (data.description||''));
    if (matchKien) targets.push({ id: d.id, data });
    console.log('-', d.id.substring(0,8), '|', created && created.toISOString ? created.toISOString() : created, '| client=', name || '(?)', '| prov=', provName || data.providerId, '| country=', country, '| status=', data.status);
  }

  console.log('\n=== 2. Demandes potentielles Kien/Vietnam ===\n');
  if (!targets.length) {
    console.log('Aucune match Kien/Vietnam dans les 30 dernieres. Cherche plus large...');
    // Cherche aussi les bookings sans createdAt (epoch) ou sur 90 jours
  }
  for (const t of targets) {
    console.log('Doc complet:', JSON.stringify({
      id: t.id,
      providerId: t.data.providerId,
      providerName: t.data.providerName,
      providerType: t.data.providerType,
      providerCountry: t.data.providerCountry,
      clientId: t.data.clientId,
      clientName: t.data.clientName,
      clientFirstName: t.data.clientFirstName,
      clientLastName: t.data.clientLastName,
      clientCurrentCountry: t.data.clientCurrentCountry,
      serviceType: t.data.serviceType,
      status: t.data.status,
      createdAt: t.data.createdAt && t.data.createdAt.toDate ? t.data.createdAt.toDate().toISOString() : t.data.createdAt,
    }, null, 2));
  }

  console.log('\n=== 3. Pour chaque providerId vu ci-dessus, qui le contient dans linkedProviderIds ? ===\n');
  const providerIdsToCheck = new Set();
  for (const t of targets) {
    if (t.data.providerId) providerIdsToCheck.add(t.data.providerId);
  }
  // En plus, last 30 bookings
  for (const d of snap.docs) {
    const pid = d.data().providerId;
    if (pid) providerIdsToCheck.add(pid);
  }

  const usersSnap = await db.collection('users').where('linkedProviderIds', '!=', null).get();
  const ownersByProvider = new Map();
  for (const u of usersSnap.docs) {
    const linked = u.data().linkedProviderIds || [];
    for (const pid of linked) {
      if (!ownersByProvider.has(pid)) ownersByProvider.set(pid, []);
      ownersByProvider.get(pid).push({ uid: u.id, email: u.data().email, role: u.data().role, displayName: u.data().displayName });
    }
  }
  for (const pid of providerIdsToCheck) {
    const owners = ownersByProvider.get(pid) || [];
    console.log('providerId', pid, '-> owners:', owners.length ? owners.map(o => `${o.email}(${o.role})`).join(', ') : '*** AUCUN compte ne le lie ***');
  }

  console.log('\n=== 4. Pour chaque providerId, fetch user + sos_profile pour voir provider name/country ===\n');
  for (const pid of providerIdsToCheck) {
    const uSnap = await db.collection('users').doc(pid).get();
    const pSnap = await db.collection('sos_profiles').doc(pid).get();
    const u = uSnap.exists ? uSnap.data() : null;
    const p = pSnap.exists ? pSnap.data() : null;
    console.log(pid, '|', u ? `${u.firstName||''} ${u.lastName||''} (${u.role}, country=${u.country})` : 'NO user doc', '|', p ? `profile country=${p.country}, isVisible=${p.isVisible}` : 'NO sos_profile');
  }
}

main().catch(e => { console.error(e); process.exit(1); }).then(() => process.exit(0));
