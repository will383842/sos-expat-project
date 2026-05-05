/**
 * Met à jour admin_config/aaa_busy_simulation
 * Usage: node scripts/update-aaa-sim-config.cjs
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

(async () => {
  const ref = db.doc('admin_config/aaa_busy_simulation');
  const before = (await ref.get()).data();
  console.log('AVANT:', before);

  await ref.set({
    enabled: true,
    simultaneousBusyMin: 2,
    simultaneousBusyMax: 4,
    busyDurationMinutes: 20,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: 'script-cap-max-4',
  }, { merge: true });

  const after = (await ref.get()).data();
  console.log('APRES:', after);
  console.log('✅ Config mise à jour. Le prochain run du cron (≤ 8min) appliquera la nouvelle cible.');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
