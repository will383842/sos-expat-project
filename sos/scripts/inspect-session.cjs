const admin = require('firebase-admin');
const path = require('path');
const credPath = path.join(process.env.APPDATA || process.env.HOME, 'firebase', 'williamsjullin_gmail_com_application_default_credentials.json');
process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
admin.initializeApp({ projectId: 'sos-urgently-ac307' });
const db = admin.firestore();

(async () => {
  const sessionId = 'call_session_1777884483959_2xh4dck';
  const snap = await db.collection('call_sessions').doc(sessionId).get();
  if (!snap.exists) {
    console.log('SESSION NOT FOUND');
    process.exit(1);
  }
  const data = snap.data();
  console.log('=== SESSION ===');
  console.log('status:', data.status);
  console.log('isPaid:', data.isPaid);
  console.log('createdAt:', data.createdAt?.toDate?.());
  console.log('clientCurrentCountry:', data.clientCurrentCountry);
  console.log('clientId:', data.clientId);
  console.log('providerId:', data.providerId);
  console.log('\n=== PAYMENT ===');
  console.log(JSON.stringify(data.payment, null, 2));
  console.log('\n=== CONFERENCE ===');
  console.log(JSON.stringify(data.conference, null, 2));
  console.log('\n=== PARTICIPANTS ===');
  console.log(JSON.stringify(data.participants, null, 2));
  console.log('\n=== METADATA ===');
  console.log(JSON.stringify(data.metadata, null, 2));

  // also fetch the payments doc by paymentIntentId
  const pi = data.payment?.paymentIntentId || data.payment?.stripePaymentIntentId;
  if (pi) {
    console.log('\n=== PAYMENT INTENT:', pi, '===');
    const psnap = await db.collection('payments').where('stripePaymentIntentId', '==', pi).limit(1).get();
    psnap.forEach(d => {
      const p = d.data();
      console.log('payment doc id:', d.id);
      console.log('status:', p.status);
      console.log('capturedAt:', p.capturedAt?.toDate?.());
      console.log('failureReason:', p.failureReason);
      console.log('callSessionId:', p.callSessionId);
      console.log('amount:', p.amount, p.currency);
    });
  }

  // Check call_records for this session
  console.log('\n=== call_records (last 20 events) ===');
  const records = await db.collection('call_records').where('callId', '==', sessionId).orderBy('createdAt', 'desc').limit(20).get();
  records.forEach(r => {
    const rec = r.data();
    console.log('-', rec.createdAt?.toDate?.()?.toISOString?.(), '|', rec.status, '|', JSON.stringify(rec.additionalData || {}).slice(0, 200));
  });
})().catch(e => { console.error(e); process.exit(1); });
