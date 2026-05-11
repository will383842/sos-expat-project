/**
 * Audit : combien d'AAA providers ne sont relies a AUCUN compte multi (vue admin/agency) ?
 * Et combien de booking_requests recents sont du coup invisibles dans le dashboard multi ?
 */
const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'sos-urgently-ac307' });
}
const db = admin.firestore();

async function main() {
  console.log('\n=== AUDIT ORPHAN AAA PROVIDERS ===\n');

  // 1) Construire l'index providerId -> [accounts qui le linkent]
  const usersSnap = await db.collection('users').get();
  const linkedByProvider = new Map();
  const accountsWithLinks = [];
  for (const u of usersSnap.docs) {
    const data = u.data();
    const linked = data.linkedProviderIds || [];
    if (linked.length === 0) continue;
    // On garde aussi les provider-self (denormalisation) mais on les distingue
    const isRealOwner = data.role === 'admin' || data.role === 'agency_manager' || data.isMultiProvider === true;
    if (isRealOwner) {
      accountsWithLinks.push({ uid: u.id, email: data.email, role: data.role, count: linked.length });
    }
    for (const pid of linked) {
      if (!linkedByProvider.has(pid)) linkedByProvider.set(pid, { owners: [], denorms: [] });
      if (isRealOwner) linkedByProvider.get(pid).owners.push({ uid: u.id, email: data.email });
      else linkedByProvider.get(pid).denorms.push({ uid: u.id, email: data.email });
    }
  }
  console.log('Comptes multi (admin/agency_manager/isMultiProvider):', accountsWithLinks.length);
  for (const a of accountsWithLinks) {
    console.log(`  - ${a.email} (${a.role}) : ${a.count} providers lies`);
  }

  // 2) Lister tous les AAA providers
  // Strategie : tous les users avec id commencant par 'aaa_' OU isAAA=true
  let aaaProviders = [];
  let cursor = null;
  while (true) {
    let q = db.collection('users').orderBy('__name__').limit(500);
    if (cursor) q = q.startAfter(cursor);
    const snap = await q.get();
    if (snap.empty) break;
    for (const d of snap.docs) {
      const data = d.data();
      if (d.id.startsWith('aaa_') || data.isAAA === true) {
        aaaProviders.push({
          id: d.id,
          email: data.email,
          role: data.role,
          firstName: data.firstName,
          lastName: data.lastName,
          country: data.country,
          createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt,
        });
      }
    }
    if (snap.docs.length < 500) break;
    cursor = snap.docs[snap.docs.length - 1];
  }
  console.log('\nTotal users AAA detectes:', aaaProviders.length);

  // 3) Pour chaque AAA provider, est-il dans linkedProviderIds d'au moins un owner ?
  const orphans = [];
  const linkedAaa = [];
  for (const p of aaaProviders) {
    const info = linkedByProvider.get(p.id);
    if (!info || info.owners.length === 0) orphans.push(p);
    else linkedAaa.push({ ...p, ownerCount: info.owners.length });
  }
  console.log('\nAAA orphelins (zero owner les lie):', orphans.length);
  console.log('AAA lies a au moins un owner:', linkedAaa.length);

  // 4) Top 30 plus recents orphelins
  orphans.sort((a, b) => {
    const ta = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
    const tb = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
    return tb - ta;
  });
  console.log('\n--- 30 AAA orphelins les plus recents ---');
  for (const o of orphans.slice(0, 30)) {
    console.log(`  ${o.id} | ${o.firstName||''} ${o.lastName||''} | ${o.role} | ${o.country} | created=${o.createdAt instanceof Date ? o.createdAt.toISOString() : '(no createdAt)'}`);
  }

  // 5) booking_requests sur 30j dont providerId est orphelin -> invisibles dans dashboard
  console.log('\n--- booking_requests recents dont providerId est orphelin ---');
  const thirtyDaysAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 3600 * 1000));
  const brSnap = await db.collection('booking_requests')
    .where('createdAt', '>', thirtyDaysAgo)
    .orderBy('createdAt', 'desc')
    .limit(500)
    .get();
  console.log('booking_requests dans 30j:', brSnap.size);
  const orphanIds = new Set(orphans.map(o => o.id));
  let invisible = 0;
  const samples = [];
  for (const d of brSnap.docs) {
    const data = d.data();
    if (orphanIds.has(data.providerId)) {
      invisible++;
      if (samples.length < 10) samples.push({
        id: d.id,
        providerId: data.providerId,
        providerName: data.providerName,
        providerCountry: data.providerCountry,
        status: data.status,
        createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      });
    }
  }
  console.log(`Bookings INVISIBLES (providerId = AAA orphelin): ${invisible} / ${brSnap.size}`);
  console.log('Exemples:');
  for (const s of samples) console.log('  ', JSON.stringify(s));
}

main()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });
