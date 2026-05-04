/**
 * Audit-payment-health
 *
 * Lit la collection `call_sessions` sur les N derniers jours et imprime un
 * tableau du taux de succès des paiements par (pays × passerelle).
 *
 * Usage :
 *   node scripts/audit-payment-health.cjs            # 30 derniers jours, tout
 *   node scripts/audit-payment-health.cjs --days=7   # 7 derniers jours
 *   node scripts/audit-payment-health.cjs --min=5    # n'affiche que les buckets ≥ 5 transactions
 *   node scripts/audit-payment-health.cjs --csv      # sortie CSV
 *
 * Le script se connecte à Firebase via les credentials Firebase CLI déjà
 * présents sur la machine (mêmes que `firebase login`), donc rien à configurer.
 */

const admin = require('firebase-admin');
const path = require('path');

// --- Auth via Firebase CLI default credentials -----------------------------
const credPath = path.join(
  process.env.APPDATA || process.env.HOME,
  'firebase',
  'williamsjullin_gmail_com_application_default_credentials.json'
);
process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
admin.initializeApp({ projectId: 'sos-urgently-ac307' });
const db = admin.firestore();

// --- CLI args --------------------------------------------------------------
function getArg(name, defaultValue) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!arg) return defaultValue;
  return arg.split('=')[1];
}
const DAYS = parseInt(getArg('days', '30'), 10);
const MIN_TX = parseInt(getArg('min', '1'), 10);
const CSV = process.argv.includes('--csv');

const SUCCESS_STATUSES = new Set([
  'succeeded', 'captured', 'authorized', 'completed', 'paid',
]);
const FAILED_STATUSES = new Set([
  'failed', 'error', 'declined', 'authorization_failed', 'capture_failed',
]);

async function main() {
  const since = admin.firestore.Timestamp.fromMillis(
    Date.now() - DAYS * 24 * 60 * 60 * 1000
  );
  if (!CSV) {
    console.log(`\n📊 Audit santé des paiements — ${DAYS} derniers jours`);
    console.log(`   Filtre: ≥ ${MIN_TX} transaction(s) finales par bucket\n`);
    process.stdout.write('Lecture call_sessions...');
  }

  const buckets = new Map(); // key: country__gateway -> stats
  let totalSuccesses = 0;
  let totalFailures = 0;
  let pending = 0;
  let unknownStatus = 0;
  let scannedSessions = 0;
  let scannedPayments = 0;

  const upsertBucket = (country, gateway, isSuccess, isFailure) => {
    const key = `${country}__${gateway}`;
    const b = buckets.get(key) || { country, gateway, total: 0, successes: 0, failures: 0 };
    b.total += 1;
    if (isSuccess) b.successes += 1;
    if (isFailure) b.failures += 1;
    buckets.set(key, b);
  };

  // Source 1 — call_sessions (PayPal flow)
  const sessionsSnap = await db
    .collection('call_sessions')
    .where('createdAt', '>=', since)
    .get();
  scannedSessions = sessionsSnap.size;

  sessionsSnap.forEach((doc) => {
    const data = doc.data();
    const status = String(data?.payment?.status ?? '').toLowerCase();
    const gateway = String(data?.payment?.gateway ?? 'unknown').toLowerCase();
    const country = String(data?.clientCurrentCountry ?? 'UNKNOWN').toUpperCase() || 'UNKNOWN';

    const isSuccess = SUCCESS_STATUSES.has(status);
    const isFailure = FAILED_STATUSES.has(status);
    if (!isSuccess && !isFailure) {
      if (!status || status === 'pending' || status === 'pending_approval' || status === 'processing') {
        pending++;
      } else {
        unknownStatus++;
      }
      return;
    }
    if (isSuccess) totalSuccesses++;
    if (isFailure) totalFailures++;
    upsertBucket(country, gateway, isSuccess, isFailure);
  });

  // Source 2 — payments (Stripe webhook updates)
  const paymentsSnap = await db
    .collection('payments')
    .where('createdAt', '>=', since)
    .get();
  scannedPayments = paymentsSnap.size;

  for (const doc of paymentsSnap.docs) {
    const data = doc.data();
    const status = String(data?.status ?? '').toLowerCase();
    const isSuccess = SUCCESS_STATUSES.has(status);
    const isFailure = FAILED_STATUSES.has(status);
    if (!isSuccess && !isFailure) {
      if (!status) unknownStatus++;
      else pending++; // call_session_created, processing, etc.
      continue;
    }
    if (isSuccess) totalSuccesses++;
    if (isFailure) totalFailures++;

    let country = String(
      data?.metadata?.clientCurrentCountry ||
      data?.metadata?.clientCountry ||
      data?.metadata?.country ||
      ''
    ).toUpperCase();
    if (!country) {
      const csId = data?.callSessionId || data?.metadata?.callSessionId;
      if (csId) {
        try {
          const cs = await db.collection('call_sessions').doc(csId).get();
          country = String(cs.data()?.clientCurrentCountry || '').toUpperCase();
        } catch { /* ignore */ }
      }
    }
    if (!country) country = 'UNKNOWN';

    const method = String(data?.metadata?.paymentMethod || data?.paymentMethod || '').toLowerCase();
    let gateway = 'stripe';
    if (method.includes('apple_pay')) gateway = 'stripe_apple_pay';
    else if (method.includes('google_pay')) gateway = 'stripe_google_pay';
    else if (method === 'apple_pay_google_pay') gateway = 'stripe_wallet';

    upsertBucket(country, gateway, isSuccess, isFailure);
  }

  if (!CSV) {
    console.log(` ${scannedSessions} call_sessions + ${scannedPayments} payments analysés.\n`);
  }

  const all = Array.from(buckets.values()).map((b) => ({
    ...b,
    rate: b.total === 0 ? 0 : b.successes / b.total,
  }));
  const filtered = all.filter((b) => b.total >= MIN_TX);
  filtered.sort((a, b) => a.rate - b.rate || b.total - a.total);

  if (CSV) {
    console.log('country,gateway,total,successes,failures,success_rate_pct');
    for (const b of filtered) {
      console.log(
        `${b.country},${b.gateway},${b.total},${b.successes},${b.failures},${(b.rate * 100).toFixed(1)}`
      );
    }
    return;
  }

  // Pretty print
  const finalTotal = totalSuccesses + totalFailures;
  const overall = finalTotal === 0 ? 0 : totalSuccesses / finalTotal;
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`📦 Documents analysés       : ${scannedSessions} call_sessions + ${scannedPayments} payments`);
  console.log(`✅ Paiements réussis        : ${totalSuccesses}`);
  console.log(`❌ Paiements échoués        : ${totalFailures}`);
  console.log(`⏳ En cours / pending       : ${pending}`);
  console.log(`❓ Statut inconnu           : ${unknownStatus}`);
  console.log(`🌐 Taux de succès global    : ${(overall * 100).toFixed(2)}%`);
  console.log(`🗺  Buckets distincts        : ${all.length} (${filtered.length} affichés)`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('PAYS  GATEWAY     TOTAL  ✅  ❌   TAUX   STATUT');
  console.log('───── ─────────── ─────  ──  ──   ─────  ──────');
  for (const b of filtered) {
    const ratePct = (b.rate * 100).toFixed(0).padStart(3);
    let badge;
    if (b.rate >= 0.95) badge = '🟢 OK';
    else if (b.rate >= 0.80) badge = '🟡 ATTENTION';
    else if (b.rate >= 0.50) badge = '🟠 À CREUSER';
    else badge = '🔴 CASSÉ';
    console.log(
      `${b.country.padEnd(5)} ${b.gateway.padEnd(11)} ${String(b.total).padStart(5)}  ` +
      `${String(b.successes).padStart(2)}  ${String(b.failures).padStart(2)}   ${ratePct}%   ${badge}`
    );
  }
  console.log('');

  // Bottom-line conclusion
  const broken = filtered.filter((b) => b.rate < 0.5 && b.total >= 3);
  const attention = filtered.filter((b) => b.rate >= 0.5 && b.rate < 0.8 && b.total >= 3);
  if (broken.length > 0) {
    console.log(`🔴 ${broken.length} pays/passerelles SOUS 50% de succès :`);
    for (const b of broken) {
      console.log(`   - ${b.country} / ${b.gateway} (${b.successes}/${b.total})`);
    }
  } else {
    console.log('🟢 Aucun pays/passerelle sous 50% de succès.');
  }
  if (attention.length > 0) {
    console.log(`🟠 ${attention.length} pays/passerelles entre 50-80% (à surveiller).`);
  }
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Erreur:', err);
    process.exit(1);
  });
