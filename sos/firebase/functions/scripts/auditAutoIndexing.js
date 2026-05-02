/**
 * Audit complet du système d'auto-indexation :
 * - Compter tous les profils (lawyer + expat) approuvés/visibles/actifs
 * - État du curseur scheduledBulkIndexing
 * - Profils créés récemment (qui auraient dû passer dans onProfileCreated)
 *
 * Usage: node scripts/auditAutoIndexing.js
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'sos-urgently-ac307' });
}
const db = admin.firestore();

async function run() {
  console.log('='.repeat(70));
  console.log('AUDIT AUTO-INDEXATION');
  console.log('='.repeat(70));

  // 1. Compter tous les profils
  console.log('\n📊 1. PROFILS DANS FIRESTORE');
  console.log('-'.repeat(70));

  const allSnap = await db.collection('sos_profiles').get();
  console.log(`Total documents sos_profiles: ${allSnap.size}`);

  const stats = {
    total: 0,
    lawyer: 0,
    expat: 0,
    other: 0,
    aaa: 0,
    real: 0,
    indexable: 0,  // approved + visible + active + (lawyer or expat) + non-AAA
    aaaIndexable: 0,
  };

  const indexableProfiles = [];

  allSnap.forEach((doc) => {
    const p = doc.data();
    const uid = p.uid || doc.id;
    const isAaa = uid.startsWith('aaa_');

    stats.total++;
    if (isAaa) stats.aaa++; else stats.real++;

    if (p.type === 'lawyer') stats.lawyer++;
    else if (p.type === 'expat') stats.expat++;
    else stats.other++;

    const isApproved = p.isApproved === true;
    const isVisible = p.isVisible === true;
    const isActive = p.isActive !== false; // default true
    const isProvider = p.type === 'lawyer' || p.type === 'expat';

    if (isApproved && isVisible && isActive && isProvider) {
      if (isAaa) {
        stats.aaaIndexable++;
      } else {
        stats.indexable++;
      }
      indexableProfiles.push({
        uid,
        type: p.type,
        country: p.country,
        fullName: p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
        isAaa,
        slugFr: p.slugs?.fr,
        slugEn: p.slugs?.en,
      });
    }
  });

  console.log(`  Par type:`);
  console.log(`    - lawyer: ${stats.lawyer}`);
  console.log(`    - expat:  ${stats.expat}`);
  console.log(`    - autre:  ${stats.other}`);
  console.log(`  Par origine:`);
  console.log(`    - AAA (test/démo): ${stats.aaa}`);
  console.log(`    - Vrais profils:   ${stats.real}`);
  console.log(`  ✅ INDEXABLES (approuvés+visibles+actifs+lawyer/expat):`);
  console.log(`    - Vrais profils:   ${stats.indexable}`);
  console.log(`    - AAA:             ${stats.aaaIndexable}`);
  console.log(`    - TOTAL:           ${stats.indexable + stats.aaaIndexable}`);

  // 2. État du curseur scheduledBulkIndexing
  console.log('\n🔄 2. CURSEUR scheduledBulkIndexing');
  console.log('-'.repeat(70));

  const stateDoc = await db.collection('admin_config').doc('bulk_indexing_state').get();
  if (stateDoc.exists) {
    const state = stateDoc.data();
    console.log(`  ✅ État trouvé:`);
    console.log(`    - lastProcessedId: ${state.lastProcessedId || 'null (cycle commence)'}`);
    console.log(`    - totalSubmitted: ${state.totalSubmitted || 0}`);
    console.log(`    - lastUpdate: ${state.lastUpdate?.toDate?.()?.toISOString() || 'inconnu'}`);
    console.log(`    - cycleResets: ${state.cycleResets || 0}`);
  } else {
    console.log(`  ⚠️ Aucun curseur trouvé — le cron n'a peut-être jamais tourné`);
    console.log(`     OU les premiers cycles n'ont pas encore créé le doc de state.`);
  }

  // 3. Profils créés récemment
  console.log('\n📅 3. PROFILS CRÉÉS DERNIERS 30 JOURS');
  console.log('-'.repeat(70));
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentSnap = await db.collection('sos_profiles')
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  let recentReal = 0;
  let recentAaa = 0;
  recentSnap.forEach(doc => {
    const uid = (doc.data().uid || doc.id);
    if (uid.startsWith('aaa_')) recentAaa++;
    else recentReal++;
  });
  console.log(`  Total créés depuis 30 jours: ${recentSnap.size}`);
  console.log(`    - Vrais: ${recentReal}`);
  console.log(`    - AAA:   ${recentAaa}`);

  // 4. Logs récents auto-indexing (admin_config / index_log)
  console.log('\n📝 4. LOGS AUTO-INDEXATION (5 derniers)');
  console.log('-'.repeat(70));
  try {
    const logsSnap = await db.collection('admin_config')
      .doc('indexing_logs')
      .collection('runs')
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();
    if (logsSnap.empty) {
      console.log('  Aucun log dans admin_config/indexing_logs/runs');
    } else {
      logsSnap.forEach(doc => {
        const data = doc.data();
        console.log(`  ${data.timestamp?.toDate?.()?.toISOString() || '?'} - ${data.type || '?'} - ${data.urlsCount || 0} URLs`);
      });
    }
  } catch (e) {
    console.log(`  (collection logs n'existe pas: ${e.message})`);
  }

  // 5. Top profils sans slug (problème SEO)
  console.log('\n⚠️ 5. PROFILS INDEXABLES SANS SLUG FR');
  console.log('-'.repeat(70));
  const noSlug = indexableProfiles.filter(p => !p.slugFr);
  console.log(`  Sur ${indexableProfiles.length} profils indexables: ${noSlug.length} sans slug FR`);
  if (noSlug.length > 0 && noSlug.length <= 10) {
    noSlug.forEach(p => {
      console.log(`    - ${p.fullName} [${p.uid.substring(0, 20)}...] type=${p.type}`);
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('RÉSUMÉ');
  console.log('='.repeat(70));
  console.log(`  ${stats.total} profils total dans Firestore`);
  console.log(`  ${stats.indexable + stats.aaaIndexable} profils indexables (${stats.indexable} vrais + ${stats.aaaIndexable} AAA)`);
  console.log(`  Cron quotidien soumet 200/jour à Google Indexing API`);
  console.log(`  Trigger automatique sur création/modification de profil`);
  console.log(`  Si X profils existants pas tous indexés → patience, le cron rattrape`);

  process.exit(0);
}

run().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});
