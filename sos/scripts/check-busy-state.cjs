/**
 * Check Busy State - Diagnostic de l'état busy actuel
 *
 * 1. Lit admin_config/aaa_busy_simulation
 * 2. Liste tous les prestataires avec availability='busy' dans users
 * 3. Sépare AAA simulés vs vrais busy stuck
 * 4. Pour les vrais busy, vérifie l'état de la session associée
 *
 * Usage:
 *   node scripts/check-busy-state.cjs
 */

const admin = require('firebase-admin');
const path = require('path');

const credPath = path.join(
  process.env.APPDATA || process.env.HOME,
  'firebase',
  'williamsjullin_gmail_com_application_default_credentials.json'
);
process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;

admin.initializeApp({ projectId: 'sos-urgently-ac307' });
const db = admin.firestore();

function fmt(ts) {
  if (!ts) return 'N/A';
  if (ts.toDate) return ts.toDate().toISOString();
  if (ts._seconds) return new Date(ts._seconds * 1000).toISOString();
  return String(ts);
}

function minAgo(ts) {
  if (!ts) return null;
  const d = ts.toDate ? ts.toDate() : new Date(ts._seconds * 1000);
  return Math.round((Date.now() - d.getTime()) / 60000);
}

(async () => {
  console.log('\n========== 1. CONFIG SIMULATION AAA ==========');
  const cfgSnap = await db.doc('admin_config/aaa_busy_simulation').get();
  if (cfgSnap.exists) {
    const c = cfgSnap.data();
    console.log(`enabled              : ${c.enabled}`);
    console.log(`simultaneousBusyMin  : ${c.simultaneousBusyMin ?? c.simultaneousBusy ?? '(absent)'}`);
    console.log(`simultaneousBusyMax  : ${c.simultaneousBusyMax ?? c.simultaneousBusy ?? '(absent)'}`);
    console.log(`busyDurationMinutes  : ${c.busyDurationMinutes}`);
    console.log(`updatedAt            : ${fmt(c.updatedAt)}`);
    console.log(`updatedBy            : ${c.updatedBy || 'N/A'}`);
  } else {
    console.log('(document admin_config/aaa_busy_simulation absent — defaults: 3-6 / 20min / OFF)');
  }

  console.log('\n========== 2. TOUS LES PROVIDERS BUSY (users) ==========');
  const busySnap = await db.collection('users').where('availability', '==', 'busy').get();
  console.log(`Total: ${busySnap.size} users en busy`);

  const aaaSimulated = [];
  const realBusy = [];

  for (const doc of busySnap.docs) {
    const d = doc.data();
    const isAAA = d.isAAA === true || doc.id.startsWith('aaa_');
    const isSimulated = !!d.aaaBusySimulatedAt;
    if (isAAA && isSimulated) {
      aaaSimulated.push({ id: doc.id, data: d });
    } else {
      realBusy.push({ id: doc.id, data: d });
    }
  }

  console.log(`  - AAA simulés       : ${aaaSimulated.length}`);
  console.log(`  - Vrais busy        : ${realBusy.length}`);

  if (aaaSimulated.length > 0) {
    console.log('\n--- AAA simulés (rotation automatique) ---');
    for (const p of aaaSimulated) {
      const elapsed = minAgo(p.data.aaaBusySimulatedAt);
      console.log(`  ${p.id.padEnd(32)}  busy depuis ${elapsed}min  (${p.data.firstName || ''} ${p.data.lastName || ''})`);
    }
  }

  if (realBusy.length > 0) {
    console.log('\n--- VRAIS busy (à investiguer) ---');
    for (const p of realBusy) {
      const since = minAgo(p.data.busySince || p.data.lastStatusChange);
      const sessionId = p.data.currentCallSessionId;
      const reason = p.data.busyReason || 'N/A';
      const isAAA = p.data.isAAA === true || p.id.startsWith('aaa_');

      console.log(`\n  📌 ${p.id}  ${isAAA ? '(AAA mais sans aaaBusySimulatedAt)' : ''}`);
      console.log(`     Nom         : ${p.data.firstName || ''} ${p.data.lastName || ''}`);
      console.log(`     Email       : ${p.data.email || 'N/A'}`);
      console.log(`     Type        : ${p.data.type || 'N/A'}`);
      console.log(`     Busy depuis : ${since}min`);
      console.log(`     Reason      : ${reason}`);
      console.log(`     SessionId   : ${sessionId || 'AUCUN'}`);
      console.log(`     busyBySibling: ${p.data.busyBySibling || false}`);

      if (sessionId) {
        try {
          const sessSnap = await db.collection('call_sessions').doc(sessionId).get();
          if (sessSnap.exists) {
            const s = sessSnap.data();
            console.log(`     → Session   : status=${s.status}  payment=${s.payment?.status || 'N/A'}`);
            console.log(`     → Conf SID  : ${s.conference?.sid || 'NOT SET'}`);
            console.log(`     → Created   : ${fmt(s.metadata?.createdAt)}  (${minAgo(s.metadata?.createdAt)}min ago)`);
          } else {
            console.log(`     → Session   : ❌ N'EXISTE PAS — orpheline`);
          }
        } catch (e) {
          console.log(`     → Session   : erreur lecture: ${e.message}`);
        }
      }
    }
  }

  console.log('\n========== 3. RÉSUMÉ ==========');
  console.log(`AAA simulés actifs : ${aaaSimulated.length}`);
  console.log(`Vrais busy stuck   : ${realBusy.length}`);
  if (realBusy.length > 0) {
    console.log(`\n⚠️  ${realBusy.length} prestataire(s) potentiellement bloqué(s) en busy.`);
    console.log(`Pour les libérer manuellement, run:`);
    console.log(`   node scripts/check-busy-state.cjs --release-real`);
  }

  // Mode --release-real: libère les vrais busy
  if (process.argv.includes('--release-real') && realBusy.length > 0) {
    console.log('\n🔧 Libération des vrais busy stuck...');
    const now = admin.firestore.Timestamp.now();
    for (const p of realBusy) {
      try {
        const release = {
          availability: 'available',
          isOnline: true,
          currentCallSessionId: admin.firestore.FieldValue.delete(),
          busySince: admin.firestore.FieldValue.delete(),
          busyReason: admin.firestore.FieldValue.delete(),
          busyBySibling: admin.firestore.FieldValue.delete(),
          busySiblingProviderId: admin.firestore.FieldValue.delete(),
          busySiblingCallSessionId: admin.firestore.FieldValue.delete(),
          wasOfflineBeforeCall: admin.firestore.FieldValue.delete(),
          busySafetyTimeoutTaskId: admin.firestore.FieldValue.delete(),
          lastStatusChange: now,
          lastActivity: now,
          updatedAt: now,
        };
        const batch = db.batch();
        batch.update(db.collection('users').doc(p.id), release);
        const profDoc = await db.collection('sos_profiles').doc(p.id).get();
        if (profDoc.exists) batch.update(profDoc.ref, release);
        batch.set(db.collection('provider_status_logs').doc(), {
          providerId: p.id,
          action: 'MANUAL_RELEASE_STUCK',
          previousStatus: 'busy',
          newStatus: 'available',
          reason: 'manual_diagnostic_script',
          timestamp: now,
        });
        await batch.commit();
        console.log(`   ✅ ${p.id} libéré`);
      } catch (e) {
        console.log(`   ❌ ${p.id} erreur: ${e.message}`);
      }
    }
  }

  process.exit(0);
})().catch(e => {
  console.error('❌ Erreur:', e);
  process.exit(1);
});
