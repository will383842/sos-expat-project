/**
 * P2B (Regulation EU 2019/1150) compliant notification of price/schedule
 * change to all active lawyers — with mandatory 15-day prior notice.
 *
 * Use this BEFORE any change to:
 *   - the SOS Connection Fee (B2C),
 *   - the lawyer net B2C remuneration,
 *   - the lawyer net B2B remuneration,
 *   - any other component of the lawyer remuneration schedule.
 *
 * What it does:
 *   1) Loads notification details from CLI args (or env vars).
 *   2) Lists all lawyers with role='lawyer' and termsType='terms_lawyers'.
 *   3) Sends a transactional email to each (in their preferred language
 *      when available; falls back to English) with the full P2B notice.
 *   4) Records a notification entry on each lawyer's user doc:
 *        priceChangeNotifications: arrayUnion({ id, subject, sentAt, effectiveAt })
 *      so we have a durable proof that the 15-day notice was given.
 *
 * IMPORTANT: respects the 15-day P2B notice. The script BLOCKS if the
 * effective date is less than 15 days from now (--force to override only
 * when allowed by P2B exceptions: legal compulsion, security, typo fix).
 *
 * Usage:
 *   # Dry run (no emails, no Firestore writes)
 *   node sos/scripts/notify-lawyers-p2b-price-change.cjs \
 *     --reason="B2C Connection Fee increase" \
 *     --details="The Connection Fee will move from 30 EUR to 35 EUR on 2026-05-15." \
 *     --effective="2026-05-15"
 *
 *   # Apply (sends emails + writes Firestore proofs)
 *   node sos/scripts/notify-lawyers-p2b-price-change.cjs \
 *     --reason="..." --details="..." --effective="2026-05-15" --apply
 *
 *   # Force (skip 15-day check — only for P2B exceptions)
 *   node sos/scripts/notify-lawyers-p2b-price-change.cjs ... --apply --force
 *
 * Email transport: relies on the Mailflow VPS / Brevo / Zoho already in
 * use elsewhere on the project. Update the sendEmail() function below to
 * point to the actual transport (currently a placeholder that logs).
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// --- Args ---
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const FORCE = args.includes('--force');
function arg(name, def = '') {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=').slice(1).join('=') : def;
}

const reason = arg('reason');
const details = arg('details');
const effective = arg('effective'); // ISO date YYYY-MM-DD

if (!reason || !details || !effective) {
  console.error('Missing args. Usage:');
  console.error('  --reason="..." --details="..." --effective="YYYY-MM-DD" [--apply] [--force]');
  process.exit(1);
}

const effectiveDate = new Date(effective + 'T00:00:00Z');
if (Number.isNaN(effectiveDate.getTime())) {
  console.error(`Invalid --effective date: ${effective}`);
  process.exit(1);
}

const now = new Date();
const daysAhead = Math.floor((effectiveDate.getTime() - now.getTime()) / 86400000);
if (daysAhead < 15 && !FORCE) {
  console.error(
    `BLOCKED: effective date is only ${daysAhead} day(s) away. P2B requires ` +
      `>= 15 days. Pick a later date or pass --force only if a P2B exception ` +
      `applies (legal compulsion, security, or typographical correction).`
  );
  process.exit(1);
}

// --- Firebase Admin ---
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', '..', 'serviceAccount.json');
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// --- Email subject + body templates per language ---
const SUBJECT = {
  fr: 'SOS Expat — Préavis P2B 15 jours : modification du barème',
  en: 'SOS Expat — P2B 15-day notice: schedule change',
  es: 'SOS Expat — Preaviso P2B 15 días: modificación del baremo',
  de: 'SOS Expat — P2B 15-Tage-Vorankündigung: Vergütungsänderung',
  ru: 'SOS Expat — Предуведомление P2B 15 дней: изменение тарифов',
  hi: 'SOS Expat — P2B 15-दिन की पूर्व सूचना: शुल्क परिवर्तन',
  pt: 'SOS Expat — Pré-aviso P2B 15 dias: alteração da tabela',
  ch: 'SOS Expat — P2B 15 天预先通知：费率变更',
  ar: 'SOS Expat — إشعار P2B بمدة 15 يومًا: تعديل التعرفة',
};

function buildBody(lang, lawyerName) {
  const greet = {
    fr: `Cher Maître ${lawyerName || ''}`,
    en: `Dear ${lawyerName || 'Counsel'}`,
    es: `Estimado/a ${lawyerName || ''}`,
    de: `Sehr geehrte/r ${lawyerName || ''}`,
    ru: `Уважаемый(ая) ${lawyerName || ''}`,
    hi: `प्रिय ${lawyerName || ''}`,
    pt: `Caro/a ${lawyerName || ''}`,
    ch: `尊敬的律师 ${lawyerName || ''}`,
    ar: `الأستاذ(ة) المحترم(ة) ${lawyerName || ''}`,
  };
  const intro = {
    fr: `Conformément à l'article 3 du Règlement (UE) 2019/1150 (« P2B ») et à l'article 2.5 / 7.14 de nos CGU, nous vous notifions le changement suivant :`,
    en: `In accordance with article 3 of Regulation (EU) 2019/1150 ("P2B") and articles 2.5 / 7.14 of our Terms, we hereby notify you of the following change:`,
    es: `Conforme al artículo 3 del Reglamento (UE) 2019/1150 («P2B») y a los artículos 2.5 / 7.14 de nuestras CGU, le notificamos el siguiente cambio:`,
    de: `Gemäß Artikel 3 der Verordnung (EU) 2019/1150 („P2B") und Artikel 2.5 / 7.14 unserer AGB teilen wir Ihnen die folgende Änderung mit:`,
    ru: `Согласно статье 3 Регламента (ЕС) 2019/1150 («P2B») и статьям 2.5 / 7.14 наших CGU, уведомляем вас о следующем изменении:`,
    hi: `विनियमन (EU) 2019/1150 ("P2B") के अनुच्छेद 3 और हमारी शर्तों के अनुच्छेद 2.5 / 7.14 के अनुसार, हम आपको निम्नलिखित परिवर्तन की सूचना देते हैं:`,
    pt: `Em conformidade com o artigo 3.º do Regulamento (UE) 2019/1150 ("P2B") e os artigos 2.5 / 7.14 das nossas CGU, notificamos a seguinte alteração:`,
    ch: `根据《欧盟2019/1150号条例》（"P2B"）第3条及我方《条款》第2.5/7.14条，我方在此通知您以下变更：`,
    ar: `وفقًا للمادة 3 من اللائحة (الاتحاد الأوروبي) 2019/1150 ("P2B") والمادتين 2.5 / 7.14 من شروطنا، نخطركم بالتغيير التالي:`,
  };
  const exitOpt = {
    fr: `Vous pouvez **résilier votre relation avec la Plateforme sans pénalité** pendant le préavis de 15 jours, ou continuer à refuser au cas par cas les Mises en relation dont la rémunération ne vous convient plus.`,
    en: `You may **terminate your relationship with the Platform without penalty** during the 15-day notice period, or continue to decline on a case-by-case basis Connections whose remuneration no longer suits you.`,
    es: `Puede **resolver su relación con la Plataforma sin penalización** durante el preaviso de 15 días, o seguir rechazando caso por caso las Conexiones cuya remuneración ya no le convenga.`,
    de: `Sie können Ihre Beziehung zur Plattform innerhalb der 15-tägigen Frist **ohne Vertragsstrafe kündigen** oder weiterhin im Einzelfall Vermittlungen ablehnen, deren Vergütung Ihnen nicht mehr passt.`,
    ru: `В течение 15-дневного предуведомления вы можете **расторгнуть отношения с Платформой без штрафа** или продолжать в индивидуальном порядке отказываться от Соединений, вознаграждение по которым вам больше не подходит.`,
    hi: `15-दिन की पूर्व सूचना अवधि के दौरान आप **बिना दंड के प्लेटफ़ॉर्म के साथ अपना संबंध समाप्त** कर सकते हैं, या उन कनेक्शनों को मामले-दर-मामले अस्वीकार करना जारी रख सकते हैं जिनका पारिश्रमिक अब आपको उपयुक्त नहीं लगता।`,
    pt: `Pode **rescindir a sua relação com a Plataforma sem penalização** durante o pré-aviso de 15 dias, ou continuar a recusar caso a caso as Ligações cuja remuneração já não lhe convenha.`,
    ch: `您可以在 15 天预先通知期间**无须罚款地终止与平台的关系**，或继续逐案拒绝您不再满意其报酬的对接。`,
    ar: `يمكنكم **إنهاء علاقتكم مع المنصة دون أي غرامة** خلال مهلة الإشعار البالغة 15 يومًا، أو الاستمرار في رفض عمليات الربط التي لم تعد التعرفة الخاصة بها تناسبكم، حالة بحالة.`,
  };
  const grandfather = {
    fr: `Les Mises en relation que vous aurez **acceptées avant la date d'effet** demeurent rémunérées au tarif en vigueur au jour de leur acceptation.`,
    en: `Connections you have **accepted before the effective date** remain remunerated at the rate in force on the day of acceptance.`,
    es: `Las Conexiones que haya **aceptado antes de la fecha de efectividad** se remuneran a la tarifa vigente en el día de su aceptación.`,
    de: `Vermittlungen, die Sie **vor dem Wirksamkeitsdatum angenommen** haben, werden weiterhin zu dem am Tag der Annahme geltenden Tarif vergütet.`,
    ru: `Соединения, которые вы **приняли до даты вступления в силу**, оплачиваются по тарифу, действующему на день их принятия.`,
    hi: `वे कनेक्शन जिन्हें आपने **प्रभावी तिथि से पहले स्वीकार किया है** उन्हें स्वीकृति के दिन लागू दर पर पारिश्रमिक मिलता रहेगा।`,
    pt: `As Ligações que tenha **aceitado antes da data de produção de efeitos** mantêm-se remuneradas à tarifa em vigor no dia da sua aceitação.`,
    ch: `您在**生效日期之前已接受**的对接，将继续按接受当日的费率获得报酬。`,
    ar: `تظل عمليات الربط التي **قبلتموها قبل تاريخ السريان** مأجورة بالتعرفة السارية يوم القبول.`,
  };
  const sign = {
    fr: `Cordialement,\n\nL'équipe juridique SOS Expat\nhttps://sos-expat.com/contact`,
    en: `Best regards,\n\nThe SOS Expat Legal Team\nhttps://sos-expat.com/contact`,
    es: `Atentamente,\n\nEl equipo jurídico de SOS Expat\nhttps://sos-expat.com/contact`,
    de: `Mit freundlichen Grüßen,\n\nDas Rechtsteam von SOS Expat\nhttps://sos-expat.com/contact`,
    ru: `С уважением,\n\nЮридическая команда SOS Expat\nhttps://sos-expat.com/contact`,
    hi: `शुभकामनाओं सहित,\n\nSOS Expat क़ानूनी टीम\nhttps://sos-expat.com/contact`,
    pt: `Com os melhores cumprimentos,\n\nA equipa jurídica SOS Expat\nhttps://sos-expat.com/contact`,
    ch: `此致敬礼，\n\nSOS Expat 法律团队\nhttps://sos-expat.com/contact`,
    ar: `مع تحيّاتنا،\n\nالفريق القانوني لـ SOS Expat\nhttps://sos-expat.com/contact`,
  };
  const L = SUBJECT[lang] ? lang : 'en';
  return [
    greet[L] + ',',
    '',
    intro[L],
    '',
    `**${reason}**`,
    '',
    details,
    '',
    `**Date d'effet / Effective date / Fecha de efecto:** ${effective}`,
    `**Préavis P2B / P2B notice:** ${daysAhead} days`,
    '',
    exitOpt[L],
    '',
    grandfather[L],
    '',
    sign[L],
  ].join('\n');
}

// --- Email transport stub ---
// TODO: replace with the actual transport used elsewhere on the project
// (Brevo, Zoho, Mailflow VPS at presse@*, etc.).
async function sendEmail({ to, subject, body }) {
  if (!APPLY) {
    console.log(`  [email-dry] to=${to} subject="${subject}"`);
    return true;
  }
  // Placeholder: log to a queue file for the operator to process.
  const queuePath = path.join(__dirname, '..', '..', 'tmp', `p2b-emails-${effective}.jsonl`);
  fs.mkdirSync(path.dirname(queuePath), { recursive: true });
  fs.appendFileSync(
    queuePath,
    JSON.stringify({ to, subject, body, queuedAt: new Date().toISOString() }) + '\n'
  );
  return true;
}

// --- Main ---
(async () => {
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Project: ${serviceAccount.project_id}`);
  console.log(`Effective: ${effective} (${daysAhead} days ahead)`);
  console.log(`Reason: ${reason}`);
  console.log(`Details: ${details}\n`);

  const seen = new Set();
  const lawyers = [];
  for (const q of [
    db.collection('users').where('role', '==', 'lawyer'),
    db.collection('users').where('termsType', '==', 'terms_lawyers'),
  ]) {
    const snap = await q.get();
    for (const doc of snap.docs) {
      if (seen.has(doc.id)) continue;
      seen.add(doc.id);
      lawyers.push(doc);
    }
  }

  console.log(`Lawyers found: ${lawyers.length}`);

  let emailed = 0;
  let skipped = 0;
  let errors = 0;
  const notifId = `p2b-${Date.now()}`;

  for (const doc of lawyers) {
    const data = doc.data();
    const email = data.email;
    if (!email) {
      skipped++;
      continue;
    }
    const lang = data.preferredLanguage || data.language || 'en';
    const subject = SUBJECT[lang] || SUBJECT.en;
    const body = buildBody(lang, data.firstName || data.displayName || '');

    try {
      console.log(`[notify] ${doc.id} <${email}> lang=${lang}`);
      await sendEmail({ to: email, subject, body });
      if (APPLY) {
        await doc.ref.update({
          priceChangeNotifications: admin.firestore.FieldValue.arrayUnion({
            id: notifId,
            reason,
            details,
            effective,
            language: lang,
            sentAt: new Date().toISOString(),
            p2bDaysAhead: daysAhead,
          }),
        });
      }
      emailed++;
    } catch (err) {
      console.error(`[error] ${doc.id}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nSummary: emailed=${emailed} skipped=${skipped} errors=${errors}`);
  if (APPLY) {
    console.log(`Email queue: sos/tmp/p2b-emails-${effective}.jsonl (process via your email transport)`);
    console.log(`Firestore proof: priceChangeNotifications[] field on each lawyer doc, id=${notifId}`);
  }
  process.exit(errors > 0 ? 1 : 0);
})();
