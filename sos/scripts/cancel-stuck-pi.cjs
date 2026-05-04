const admin = require('firebase-admin');
const path = require('path');
const Stripe = require('stripe');

const credPath = path.join(process.env.APPDATA || process.env.HOME, 'firebase', 'williamsjullin_gmail_com_application_default_credentials.json');
process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
admin.initializeApp({ projectId: 'sos-urgently-ac307' });
const db = admin.firestore();

// Resolve Stripe live key via firebase CLI (avoids embedding the secret in shell history).
const { execSync } = require('child_process');
let STRIPE_KEY;
try {
  STRIPE_KEY = execSync('firebase functions:secrets:access STRIPE_LIVE_SECRET_KEY', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
} catch (e) {
  console.error('Failed to fetch STRIPE_LIVE_SECRET_KEY via firebase CLI:', e.message);
  process.exit(1);
}
if (!STRIPE_KEY || !STRIPE_KEY.startsWith('sk_')) {
  console.error('Resolved key does not look like a Stripe secret key.');
  process.exit(1);
}
const stripe = new Stripe(STRIPE_KEY, { apiVersion: '2024-04-10' });

const PI_ID = 'pi_3TTIB1DF7L3utQbN1aKPGKHp';
const SESSION_ID = 'call_session_1777884483959_2xh4dck';

(async () => {
  console.log('1) Retrieving PI:', PI_ID);
  const pi = await stripe.paymentIntents.retrieve(PI_ID);
  console.log('   current status:', pi.status);
  console.log('   amount:', pi.amount, pi.currency);

  if (pi.status === 'requires_capture') {
    console.log('2) Cancelling PI...');
    const canceled = await stripe.paymentIntents.cancel(PI_ID, {
      cancellation_reason: 'requested_by_customer',
    });
    console.log('   new status:', canceled.status);
  } else if (pi.status === 'canceled') {
    console.log('2) PI already canceled — skipping cancel call');
  } else {
    console.log('2) Unexpected PI status:', pi.status, '— aborting');
    process.exit(1);
  }

  console.log('3) Updating call_session payment fields...');
  await db.collection('call_sessions').doc(SESSION_ID).update({
    'payment.status': 'cancelled',
    'payment.refundedAt': admin.firestore.FieldValue.serverTimestamp(),
    'payment.refundReason': 'manual_unstick_2026_05_04: stuck in processing after early-disconnect (54s overlap, bug fix deployed)',
    'metadata.updatedAt': admin.firestore.Timestamp.now(),
  });
  console.log('   call_sessions updated.');

  console.log('4) Syncing payments doc (if present)...');
  const psnap = await db.collection('payments').where('stripePaymentIntentId', '==', PI_ID).limit(1).get();
  if (!psnap.empty) {
    const pdoc = psnap.docs[0];
    await pdoc.ref.update({
      status: 'cancelled',
      refundedAt: admin.firestore.FieldValue.serverTimestamp(),
      refundReason: 'manual_unstick_2026_05_04',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('   payments doc updated:', pdoc.id);
  } else {
    console.log('   no payments doc found — checking by docId =', PI_ID);
    const direct = await db.collection('payments').doc(PI_ID).get();
    if (direct.exists) {
      await direct.ref.update({
        status: 'cancelled',
        refundedAt: admin.firestore.FieldValue.serverTimestamp(),
        refundReason: 'manual_unstick_2026_05_04',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('   payments doc updated by docId:', direct.id);
    } else {
      console.log('   no payments doc at all (only call_sessions had the record).');
    }
  }

  console.log('\nDONE.');
  process.exit(0);
})().catch(e => { console.error('FAILED:', e); process.exit(1); });
