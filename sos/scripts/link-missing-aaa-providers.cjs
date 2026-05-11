/**
 * P0 - Lier les AAA providers orphelins aux comptes multi appropries.
 *
 * Detecte tous les AAA providers (id commence par 'aaa_lawyer_' ou 'aaa_expat_')
 * qui ne sont referenes dans linkedProviderIds d'AUCUN account owner
 * (admin / agency_manager / isMultiProvider=true), puis les lie a:
 *   - williamsjullin@gmail.com (admin, vue globale)
 *   - leur compte regional (mapping country -> account email ci-dessous)
 *
 * Reproduit IaMultiProvidersTab.linkProvider :
 *  1) arrayUnion sur users/{accountUid}.linkedProviderIds
 *  2) isMultiProvider=true sur le compte
 *  3) Denormalise sur users/{pid} + sos_profiles/{pid}
 *
 * Idempotent. Lance autant de fois que tu veux.
 */
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'sos-urgently-ac307' });
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const ADMIN_EMAIL = 'williamsjullin@gmail.com';

// Convention "Afrique & Moyen-Orient" + "Asie & Oceanie" + "Ameriques" + "Europe"
const COUNTRY_TO_REGION = {
  // ------ Afrique & Moyen-Orient ------
  // Afrique
  DZ: 'afrique', AO: 'afrique', BJ: 'afrique', BW: 'afrique', BF: 'afrique', BI: 'afrique',
  CM: 'afrique', CV: 'afrique', CF: 'afrique', TD: 'afrique', KM: 'afrique', CG: 'afrique',
  CD: 'afrique', CI: 'afrique', DJ: 'afrique', EG: 'afrique', GQ: 'afrique', ER: 'afrique',
  SZ: 'afrique', ET: 'afrique', GA: 'afrique', GM: 'afrique', GH: 'afrique', GN: 'afrique',
  GW: 'afrique', KE: 'afrique', LS: 'afrique', LR: 'afrique', LY: 'afrique', MG: 'afrique',
  MW: 'afrique', ML: 'afrique', MR: 'afrique', MU: 'afrique', MA: 'afrique', MZ: 'afrique',
  NA: 'afrique', NE: 'afrique', NG: 'afrique', RW: 'afrique', ST: 'afrique', SN: 'afrique',
  SC: 'afrique', SL: 'afrique', SO: 'afrique', ZA: 'afrique', SS: 'afrique', SD: 'afrique',
  TZ: 'afrique', TG: 'afrique', TN: 'afrique', UG: 'afrique', ZM: 'afrique', ZW: 'afrique',
  // Moyen-Orient (logiquement regroupe ici cf. nom "Afrique & Moyen-Orient")
  BH: 'afrique', IL: 'afrique', IQ: 'afrique', JO: 'afrique', KW: 'afrique', LB: 'afrique',
  OM: 'afrique', PS: 'afrique', QA: 'afrique', SA: 'afrique', SY: 'afrique', AE: 'afrique',
  YE: 'afrique',

  // ------ Ameriques ------
  AR: 'ameriques', BS: 'ameriques', BZ: 'ameriques', BO: 'ameriques', BR: 'ameriques',
  CA: 'ameriques', CL: 'ameriques', CO: 'ameriques', CR: 'ameriques', CU: 'ameriques',
  DM: 'ameriques', DO: 'ameriques', EC: 'ameriques', SV: 'ameriques', GT: 'ameriques',
  GY: 'ameriques', HT: 'ameriques', HN: 'ameriques', JM: 'ameriques', MX: 'ameriques',
  NI: 'ameriques', PA: 'ameriques', PY: 'ameriques', PE: 'ameriques', PR: 'ameriques',
  SR: 'ameriques', TT: 'ameriques', US: 'ameriques', UY: 'ameriques', VE: 'ameriques',
  GF: 'ameriques',

  // ------ Asie & Oceanie ------
  AF: 'asie', AM: 'asie', AZ: 'asie', BD: 'asie', BT: 'asie', BN: 'asie', KH: 'asie',
  CN: 'asie', GE: 'asie', HK: 'asie', IN: 'asie', ID: 'asie', IR: 'asie', JP: 'asie',
  KZ: 'asie', KP: 'asie', KR: 'asie', KG: 'asie', LA: 'asie', MO: 'asie', MY: 'asie',
  MV: 'asie', MN: 'asie', MM: 'asie', NP: 'asie', PK: 'asie', PH: 'asie', SG: 'asie',
  LK: 'asie', TW: 'asie', TJ: 'asie', TH: 'asie', TL: 'asie', TM: 'asie', UZ: 'asie',
  VN: 'asie', TR: 'asie',
  // Oceanie
  AU: 'asie', NZ: 'asie', FJ: 'asie', PG: 'asie', SB: 'asie', VU: 'asie', WS: 'asie',
  TO: 'asie', KI: 'asie', FM: 'asie', MH: 'asie', NR: 'asie', PW: 'asie', TV: 'asie',
  PF: 'asie', NC: 'asie',

  // ------ Europe ------
  AL: 'europe', AD: 'europe', AT: 'europe', BY: 'europe', BE: 'europe', BA: 'europe',
  BG: 'europe', HR: 'europe', CY: 'europe', CZ: 'europe', DK: 'europe', EE: 'europe',
  FI: 'europe', FR: 'europe', DE: 'europe', GR: 'europe', HU: 'europe', IS: 'europe',
  IE: 'europe', IT: 'europe', LV: 'europe', LI: 'europe', LT: 'europe', LU: 'europe',
  MT: 'europe', MD: 'europe', MC: 'europe', ME: 'europe', NL: 'europe', MK: 'europe',
  NO: 'europe', PL: 'europe', PT: 'europe', RO: 'europe', RU: 'europe', SM: 'europe',
  RS: 'europe', SK: 'europe', SI: 'europe', ES: 'europe', SE: 'europe', CH: 'europe',
  UA: 'europe', GB: 'europe', VA: 'europe',
};

const REGION_TO_EMAIL = {
  afrique: 'aaa-multicompte-afrique@sos-expat.com',
  ameriques: 'aaa-multicompte-ameriques@sos-expat.com',
  asie: 'aaa-multicompte-asie-oceanie@sos-expat.com',
  europe: 'aaa-multicompte-europe@sos-expat.com',
};

async function findUidByEmail(email) {
  const s = await db.collection('users').where('email', '==', email).limit(1).get();
  return s.empty ? null : s.docs[0].id;
}

async function buildOwnerIndex() {
  const usersSnap = await db.collection('users').get();
  const byProvider = new Map();
  for (const u of usersSnap.docs) {
    const data = u.data();
    const linked = data.linkedProviderIds || [];
    if (linked.length === 0) continue;
    const isOwner = data.role === 'admin' || data.role === 'agency_manager' || data.isMultiProvider === true;
    if (!isOwner) continue;
    for (const pid of linked) {
      if (!byProvider.has(pid)) byProvider.set(pid, []);
      byProvider.get(pid).push(u.id);
    }
  }
  return byProvider;
}

async function listOrphanAaaProviders(ownerIndex) {
  const orphans = [];
  const all = await db.collection('users').get();
  for (const d of all.docs) {
    const data = d.data();
    if (!d.id.startsWith('aaa_lawyer_') && !d.id.startsWith('aaa_expat_')) continue;
    if (data.role !== 'lawyer' && data.role !== 'expat') continue;
    if (ownerIndex.has(d.id)) continue;
    orphans.push({
      id: d.id,
      country: data.country,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
    });
  }
  return orphans;
}

async function linkProviderToAccount(accountUid, providerId) {
  const ref = db.collection('users').doc(accountUid);
  const snap = await ref.get();
  if (!snap.exists) return { added: false, reason: 'account not found' };
  const data = snap.data();
  const existing = data.linkedProviderIds || [];
  if (existing.includes(providerId)) return { added: false, reason: 'already linked' };

  const update = {
    linkedProviderIds: FieldValue.arrayUnion(providerId),
    isMultiProvider: true,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (existing.length === 0 && !data.activeProviderId) update.activeProviderId = providerId;
  await ref.update(update);

  // Denorm sur le provider
  const denormData = {
    linkedProviderIds: [...existing, providerId],
    shareBusyStatus: data.shareBusyStatus === true,
    updatedAt: FieldValue.serverTimestamp(),
  };
  await Promise.all([
    db.collection('users').doc(providerId).update(denormData).catch(() => {}),
    db.collection('sos_profiles').doc(providerId).update(denormData).catch(() => {}),
  ]);
  return { added: true };
}

async function main() {
  console.log('\n=== P0 Link missing AAA providers ===\n');

  const adminUid = await findUidByEmail(ADMIN_EMAIL);
  if (!adminUid) throw new Error(`Admin ${ADMIN_EMAIL} introuvable`);
  console.log(`Admin: ${ADMIN_EMAIL} (${adminUid})`);

  const regionUids = {};
  for (const [region, email] of Object.entries(REGION_TO_EMAIL)) {
    regionUids[region] = await findUidByEmail(email);
    console.log(`  Region ${region}: ${email} (${regionUids[region] || 'NOT FOUND'})`);
  }

  console.log('\nIndexing existing owners...');
  const ownerIndex = await buildOwnerIndex();

  console.log('\nScanning AAA providers...');
  const orphans = await listOrphanAaaProviders(ownerIndex);
  console.log(`Trouve ${orphans.length} AAA providers orphelins\n`);

  let totalLinked = 0;
  for (const p of orphans) {
    const region = COUNTRY_TO_REGION[p.country] || null;
    const regionAccount = region ? regionUids[region] : null;
    console.log(`- ${p.id} (${p.firstName} ${p.lastName}, ${p.role}, ${p.country}) -> region=${region || 'UNKNOWN'}`);

    // Link a admin
    const r1 = await linkProviderToAccount(adminUid, p.id);
    console.log(`    admin: ${r1.added ? 'LINKED' : '(skip: ' + r1.reason + ')'}`);
    if (r1.added) totalLinked++;

    // Link au compte regional si on a pu mapper
    if (regionAccount) {
      const r2 = await linkProviderToAccount(regionAccount, p.id);
      console.log(`    region: ${r2.added ? 'LINKED' : '(skip: ' + r2.reason + ')'}`);
      if (r2.added) totalLinked++;
    } else if (p.country) {
      console.log(`    region: NO MAPPING for country=${p.country}, ajoute uniquement a admin`);
    }
  }

  console.log(`\nTotal liaisons creees: ${totalLinked}`);
  console.log(`\n=== Verification finale ===`);
  for (const p of orphans) {
    const usersWith = await db.collection('users').where('linkedProviderIds', 'array-contains', p.id).get();
    const owners = usersWith.docs
      .filter(d => d.data().role === 'admin' || d.data().role === 'agency_manager' || d.data().isMultiProvider === true)
      .map(d => d.data().email);
    console.log(`  ${p.id} -> ${owners.join(', ') || 'STILL ORPHAN'}`);
  }
}

main()
  .then(() => { console.log('\nOK'); process.exit(0); })
  .catch(e => { console.error('ERROR:', e); process.exit(1); });
