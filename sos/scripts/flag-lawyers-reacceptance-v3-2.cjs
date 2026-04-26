/**
 * Flag every existing lawyer as "must re-accept Terms v3.2".
 *
 * Substantial CGU update (v3.1 -> v3.2) requires fresh click-wrap
 * acceptance per eIDAS / P2B / GDPR. This script writes two fields on
 * each lawyer's user doc:
 *   - termsLawyersV32AcceptanceRequired: true
 *   - termsLawyersV32FlaggedAt: serverTimestamp
 *
 * It also archives the previous acceptance (termsVersion + termsAcceptedAt)
 * into termsAcceptanceHistory[] for legal traceability — never deleted.
 *
 * Usage:
 *   node sos/scripts/flag-lawyers-reacceptance-v3-2.cjs           # dry run
 *   node sos/scripts/flag-lawyers-reacceptance-v3-2.cjs --apply   # write
 *
 * Targets: users where role == 'lawyer' OR termsType == 'terms_lawyers'.
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const APPLY = process.argv.includes('--apply');
const NEW_VERSION = '3.2';

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', '..', 'serviceAccount.json');
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

console.log(`Mode: ${APPLY ? 'APPLY (writing to Firestore)' : 'DRY RUN (no writes)'}`);
console.log(`Project: ${serviceAccount.project_id}`);
console.log(`Target lawyer terms version: ${NEW_VERSION}\n`);

(async () => {
  // Two queries to be safe (role-based and termsType-based) — then dedup
  const seen = new Set();
  const flagged = [];

  for (const q of [
    db.collection('users').where('role', '==', 'lawyer'),
    db.collection('users').where('termsType', '==', 'terms_lawyers'),
  ]) {
    const snap = await q.get();
    for (const doc of snap.docs) {
      if (seen.has(doc.id)) continue;
      seen.add(doc.id);
      flagged.push(doc);
    }
  }

  console.log(`Lawyers found: ${flagged.length}`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const doc of flagged) {
    const data = doc.data();

    // Skip if already at v3.2 and re-accepted
    if (data.termsVersion === NEW_VERSION && !data.termsLawyersV32AcceptanceRequired) {
      skipped++;
      continue;
    }

    const historyEntry = {
      version: data.termsVersion || 'unknown',
      type: data.termsType || 'terms_lawyers',
      acceptedAt: data.termsAcceptedAt || null,
      meta: data.termsAcceptanceMeta || null,
      archivedAt: new Date().toISOString(),
      archivedReason: 'CGU update v3.2 (substantial change: two-debt structure, P2B, DAC7, B2B channel)',
    };

    try {
      console.log(
        `[FLAG] ${doc.id} (current: v${data.termsVersion || '?'}, accepted: ${data.termsAcceptedAt || 'n/a'})`
      );
      if (APPLY) {
        await doc.ref.update({
          termsLawyersV32AcceptanceRequired: true,
          termsLawyersV32FlaggedAt: admin.firestore.FieldValue.serverTimestamp(),
          termsLawyersV32Reason: 'Substantial CGU update v3.1 -> v3.2: two-debt characterization (no fee-sharing), P2B 15-day notice, DAC7 reporting, B2B channel, escheat to authorities, 3-year limitation period.',
          termsAcceptanceHistory: admin.firestore.FieldValue.arrayUnion(historyEntry),
        });
      }
      updated++;
    } catch (err) {
      console.error(`[ERROR] ${doc.id}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nSummary: flagged=${updated} skipped=${skipped} errors=${errors}`);
  if (!APPLY && updated > 0) {
    console.log(`\nRe-run with --apply to write to Firestore.`);
  } else if (APPLY) {
    console.log(`\nDone. Frontend must check 'termsLawyersV32AcceptanceRequired' and prompt the lawyer to re-accept on next login.`);
  }
  process.exit(errors > 0 ? 1 : 0);
})();
