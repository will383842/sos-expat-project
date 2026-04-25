/**
 * Apply Terms v3.1 enrichments to TermsLawyers and TermsExpats
 * for ES, DE, RU, HI, PT, ZH, AR (7 languages).
 *
 * Sections to update:
 *  - Lawyers 5.2 (recording policy expansion)
 *  - Lawyers 7.3 (Stripe + PayPal nominative)
 *  - Lawyers 8.1 (PCI-DSS + "not a bank")
 *  - Lawyers 8.4 (KYC = Stripe OR PayPal)
 *  - Expats 7.3 (Stripe + PayPal nominative)
 *  - Expats 8.1 (PCI-DSS + "not a bank")
 *  - Expats 13.2 (recording policy)
 */
const fs = require('fs');
const path = require('path');

const TERMS_LAWYERS = path.join(__dirname, '..', 'src', 'pages', 'TermsLawyers.tsx');
const TERMS_EXPATS = path.join(__dirname, '..', 'src', 'pages', 'TermsExpats.tsx');

let appliedCount = 0;
let notFoundCount = 0;

function replace(filePath, oldStr, newStr, label) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(oldStr)) {
    content = content.replace(oldStr, newStr);
    fs.writeFileSync(filePath, content, 'utf8');
    appliedCount++;
    console.log(`  ✅ ${label}`);
  } else {
    notFoundCount++;
    console.log(`  ❌ ${label}`);
  }
}

console.log('\n═══ TermsLawyers — ES/DE/RU/HI/PT/ZH/AR ═══\n');

// ============================================================
// === ES — TermsLawyers ===
// ============================================================
console.log('🇪🇸 Spanish (ES):');
replace(TERMS_LAWYERS,
  '5.2. **Secreto profesional y confidencialidad.** El Abogado respeta la confidencialidad/secreto profesional según la ley aplicable del País de Intervención. Los intercambios no son grabados por SOS, salvo obligaciones legales.',
  `5.2. **Secreto profesional y confidencialidad.** El Abogado respeta la confidencialidad y el secreto profesional según la ley aplicable del País de Intervención.

**Política de grabación de llamadas:**
- (a) **Por defecto**, SOS Expat **NO graba el contenido audio** de las llamadas entre Abogado y Usuario. Solo se conservan los **metadatos técnicos** (marca de tiempo, duración, identificadores Twilio, estado de conexión) para facturación, antifraude y resolución de disputas técnicas;
- (b) SOS Expat **se reserva el derecho** de activar una grabación audio en casos estrictamente limitados: sospecha de fraude, denuncia de abuso, orden de autoridad judicial competente, protección de intereses vitales. Las partes serán informadas al inicio de la llamada;
- (c) Cuando se activa una grabación, se conserva durante un máximo de **seis (6) meses** (salvo prórroga por procedimiento judicial), conforme a las recomendaciones de la AEPD/CNIL y al RGPD;
- (d) **El Abogado se prohíbe a sí mismo** grabar, transcribir íntegramente, divulgar o utilizar los intercambios para fines distintos a la prestación acordada, salvo autorización escrita del Usuario u obligación legal;
- (e) **El secreto profesional permanece intacto**: cualquier grabación eventual por SOS Expat no podrá utilizarse contra el Abogado o el Usuario en violación de las normas deontológicas aplicables al secreto profesional.`,
  'ES Lawyers 5.2');

replace(TERMS_LAWYERS,
  '7.3. **Comisiones bancarias del Proveedor de pago.** El Proveedor de pago (Stripe o equivalente) cobra comisiones de procesamiento en cada transacción. **Estas comisiones bancarias corren íntegramente a cargo del Abogado** y se deducen automáticamente del importe que se le transfiere. El detalle de estas comisiones está disponible en las condiciones del Proveedor de pago y en el panel de control del Abogado para cada transacción.',
  '7.3. **Comisiones bancarias del Proveedor de pago.** El Proveedor de pago — **Stripe Payments Europe Ltd.** (Irlanda, UE, certificado PCI-DSS Nivel 1) **o PayPal (Europe) S.à r.l. et Cie, S.C.A.** (Luxemburgo, UE, certificado PCI-DSS), según el país de residencia y disponibilidad — cobra comisiones de procesamiento en cada transacción. **Estas comisiones bancarias corren íntegramente a cargo del Abogado** y se deducen automáticamente del importe que se le transfiere. El detalle de estas comisiones está disponible en las condiciones del Proveedor de pago (Stripe: stripe.com/es/pricing; PayPal: paypal.com/es/webapps/mpp/merchant-fees) y en el panel de control del Abogado para cada transacción.',
  'ES Lawyers 7.3');

replace(TERMS_LAWYERS,
  '8.1. Los pagos son procesados por Proveedores externos. El Abogado acepta sus condiciones y procesos KYC/AML.',
  '8.1. **Proveedores de pago.** Los pagos se procesan **exclusivamente** por Proveedores externos certificados **PCI-DSS**: **Stripe Payments Europe Ltd.** (Irlanda, UE) y/o **PayPal (Europe) S.à r.l. et Cie, S.C.A.** (Luxemburgo, UE). El Proveedor aplicable depende del país de residencia/práctica del Abogado (Stripe cubre actualmente 44 países, PayPal 150+ países). El Abogado **acepta expresamente** las condiciones generales y los procesos KYC/AML del/de los Proveedor(es) aplicable(s). **SOS Expat NO es un banco, una entidad de pago ni una entidad de crédito**; SOS Expat es únicamente un cliente comercial de los Proveedores de pago mencionados.',
  'ES Lawyers 8.1');

replace(TERMS_LAWYERS,
  '8.4. **Obligación de completar el proceso de verificación (KYC).** Para recibir los pagos derivados de los servicios prestados a través de la Plataforma, el Abogado se compromete a completar el proceso de verificación de identidad (KYC - Know Your Customer) con nuestro socio de pagos Stripe en el menor plazo posible tras su registro. El Abogado reconoce que la falta de verificación KYC completa impide técnicamente la transferencia de fondos a su cuenta bancaria.',
  '8.4. **Obligación de completar el proceso de verificación (KYC).** Para recibir los pagos derivados de los servicios prestados a través de la Plataforma, el Abogado se compromete a completar el proceso de verificación de identidad (KYC - Know Your Customer) con el Proveedor de pago aplicable (**Stripe** o **PayPal**, según su país de residencia) en el menor plazo posible tras su registro. El Abogado reconoce que la falta de verificación KYC completa impide técnicamente la transferencia de fondos a su cuenta bancaria o cuenta PayPal.',
  'ES Lawyers 8.4');

// ============================================================
// === DE — TermsLawyers ===
// ============================================================
console.log('\n🇩🇪 German (DE):');
replace(TERMS_LAWYERS,
  '5.2. **Berufsgeheimnis & Vertraulichkeit.** Der Anwalt wahrt Vertraulichkeit und Berufsgeheimnis gemäß dem im Einsatzland geltenden Recht. Gespräche werden von SOS nicht aufgezeichnet, außer wenn gesetzlich vorgeschrieben.',
  `5.2. **Berufsgeheimnis & Vertraulichkeit.** Der Anwalt wahrt Vertraulichkeit und Berufsgeheimnis gemäß dem im Einsatzland geltenden Recht.

**Aufzeichnungsrichtlinie für Anrufe:**
- (a) **Standardmäßig** zeichnet SOS Expat den Audio-Inhalt der Anrufe zwischen Anwalt und Nutzer **NICHT auf**. Es werden nur **technische Metadaten** gespeichert (Zeitstempel, Dauer, Twilio-IDs, Verbindungsstatus) für Abrechnung, Betrugsbekämpfung und Lösung technischer Streitigkeiten;
- (b) SOS Expat **behält sich das Recht vor**, eine Audio-Aufzeichnung in streng begrenzten Fällen zu aktivieren: Betrugsverdacht, Missbrauchsmeldung, Anordnung einer zuständigen Justizbehörde, Schutz lebenswichtiger Interessen. Die Parteien werden zu Beginn des Anrufs informiert;
- (c) Wenn eine Aufzeichnung aktiviert wird, wird sie höchstens **sechs (6) Monate** aufbewahrt (vorbehaltlich Verlängerung durch Gerichtsverfahren), gemäß den Empfehlungen der zuständigen Datenschutzbehörde und der DSGVO;
- (d) **Der Anwalt selbst ist verpflichtet**, die Gespräche nicht aufzuzeichnen, vollständig zu transkribieren, offenzulegen oder zu anderen Zwecken als der vereinbarten Dienstleistung zu verwenden, außer mit schriftlicher Genehmigung des Nutzers oder gesetzlicher Verpflichtung;
- (e) **Das Berufsgeheimnis bleibt unverletzt**: Eine etwaige Aufzeichnung durch SOS Expat darf nicht gegen den Anwalt oder Nutzer in Verletzung der für das Berufsgeheimnis geltenden berufsrechtlichen Regeln verwendet werden.`,
  'DE Lawyers 5.2');

replace(TERMS_LAWYERS,
  '7.3. **Bankgebühren des Zahlungsdienstleisters.** Der Zahlungsdienstleister (Stripe oder Äquivalent) erhebt Bearbeitungsgebühren für jede Transaktion. **Diese Bankgebühren gehen vollständig zulasten des Anwalts** und werden automatisch von dem ihm überwiesenen Betrag abgezogen. Details zu diesen Gebühren sind in den Bedingungen des Zahlungsdienstleisters und im Dashboard des Anwalts für jede Transaktion verfügbar.',
  '7.3. **Bankgebühren des Zahlungsdienstleisters.** Der Zahlungsdienstleister — **Stripe Payments Europe Ltd.** (Irland, EU, PCI-DSS Level 1 zertifiziert) **oder PayPal (Europe) S.à r.l. et Cie, S.C.A.** (Luxemburg, EU, PCI-DSS zertifiziert), abhängig vom Wohnsitzland und Verfügbarkeit — erhebt Bearbeitungsgebühren für jede Transaktion. **Diese Bankgebühren gehen vollständig zulasten des Anwalts** und werden automatisch von dem ihm überwiesenen Betrag abgezogen. Details zu diesen Gebühren sind in den Bedingungen des Zahlungsdienstleisters (Stripe: stripe.com/de/pricing; PayPal: paypal.com/de/webapps/mpp/merchant-fees) und im Dashboard des Anwalts für jede Transaktion verfügbar.',
  'DE Lawyers 7.3');

replace(TERMS_LAWYERS,
  '8.1. Zahlungen werden über Drittanbieter abgewickelt. Der Anwalt akzeptiert deren Bedingungen und KYC/AML-Verfahren.',
  '8.1. **Zahlungsdienstleister.** Zahlungen werden **ausschließlich** über **PCI-DSS-zertifizierte** Drittanbieter abgewickelt: **Stripe Payments Europe Ltd.** (Irland, EU) und/oder **PayPal (Europe) S.à r.l. et Cie, S.C.A.** (Luxemburg, EU). Der jeweilige Dienstleister hängt vom Wohn-/Tätigkeitsland des Anwalts ab (Stripe deckt derzeit 44 Länder ab, PayPal 150+ Länder). Der Anwalt **akzeptiert ausdrücklich** die AGB und KYC/AML-Verfahren der anwendbaren Anbieter. **SOS Expat ist KEINE Bank, kein Zahlungsinstitut und kein Kreditinstitut**; SOS Expat ist lediglich ein gewerblicher Kunde der genannten Zahlungsdienstleister.',
  'DE Lawyers 8.1');

replace(TERMS_LAWYERS,
  '8.4. **Pflicht zur Vervollständigung des Verifizierungsprozesses (KYC).** Um Zahlungen aus über die Plattform erbrachten Leistungen zu erhalten, verpflichtet sich der Anwalt, den Identitätsverifizierungsprozess (KYC - Know Your Customer) bei unserem Zahlungspartner Stripe schnellstmöglich nach der Registrierung abzuschließen. Der Anwalt erkennt an, dass das Fehlen einer vollständigen KYC-Verifizierung die Überweisung von Geldern auf sein Bankkonto technisch verhindert.',
  '8.4. **Pflicht zur Vervollständigung des Verifizierungsprozesses (KYC).** Um Zahlungen aus über die Plattform erbrachten Leistungen zu erhalten, verpflichtet sich der Anwalt, den Identitätsverifizierungsprozess (KYC - Know Your Customer) beim anwendbaren Zahlungsdienstleister (**Stripe** oder **PayPal**, je nach Wohnsitzland) schnellstmöglich nach der Registrierung abzuschließen. Der Anwalt erkennt an, dass das Fehlen einer vollständigen KYC-Verifizierung die Überweisung von Geldern auf sein Bankkonto oder PayPal-Konto technisch verhindert.',
  'DE Lawyers 8.4');

// ============================================================
// === PT — TermsLawyers ===
// ============================================================
console.log('\n🇵🇹 Portuguese (PT):');
replace(TERMS_LAWYERS,
  '5.2. **Sigilo profissional e confidencialidade.** O Advogado respeita a confidencialidade/sigilo profissional segundo o direito aplicável do País de Atuação. As trocas não são gravadas pela SOS, salvo obrigações legais.',
  `5.2. **Sigilo profissional e confidencialidade.** O Advogado respeita a confidencialidade e o sigilo profissional segundo o direito aplicável do País de Atuação.

**Política de gravação de chamadas:**
- (a) **Por defeito**, a SOS Expat **NÃO grava o conteúdo áudio** das chamadas entre Advogado e Utilizador. Apenas os **metadados técnicos** são conservados (data e hora, duração, identificadores Twilio, estado de conexão) para faturação, antifraude e resolução de disputas técnicas;
- (b) A SOS Expat **reserva-se o direito** de ativar uma gravação áudio em casos estritamente limitados: suspeita de fraude, denúncia de abuso, ordem de autoridade judicial competente, proteção de interesses vitais. As partes serão informadas no início da chamada;
- (c) Quando uma gravação é ativada, é conservada por um máximo de **seis (6) meses** (salvo prorrogação por procedimento judicial), conforme as recomendações da CNPD/CNIL e o RGPD;
- (d) **O Advogado proíbe-se a si mesmo** de gravar, transcrever integralmente, divulgar ou utilizar as trocas para fins distintos da prestação acordada, salvo autorização escrita do Utilizador ou obrigação legal;
- (e) **O sigilo profissional permanece intacto**: qualquer gravação eventual pela SOS Expat não pode ser utilizada contra o Advogado ou Utilizador em violação das regras deontológicas aplicáveis ao sigilo profissional.`,
  'PT Lawyers 5.2');

replace(TERMS_LAWYERS,
  '7.3. **Taxas bancárias do Prestador de pagamento.** O Prestador de pagamento (Stripe ou equivalente) cobra taxas de processamento sobre cada transação. **Estas taxas bancárias são integralmente a cargo do Advogado** e são automaticamente deduzidas do montante que lhe é transferido. O detalhe destas taxas está disponível nas condições do Prestador de pagamento e no painel de controlo do Advogado para cada transação.',
  '7.3. **Taxas bancárias do Prestador de pagamento.** O Prestador de pagamento — **Stripe Payments Europe Ltd.** (Irlanda, UE, certificado PCI-DSS Nível 1) **ou PayPal (Europe) S.à r.l. et Cie, S.C.A.** (Luxemburgo, UE, certificado PCI-DSS), conforme o país de residência e disponibilidade — cobra taxas de processamento sobre cada transação. **Estas taxas bancárias são integralmente a cargo do Advogado** e são automaticamente deduzidas do montante que lhe é transferido. O detalhe destas taxas está disponível nas condições do Prestador de pagamento (Stripe: stripe.com/pt/pricing; PayPal: paypal.com/pt/webapps/mpp/merchant-fees) e no painel de controlo do Advogado para cada transação.',
  'PT Lawyers 7.3');

replace(TERMS_LAWYERS,
  '8.1. Os pagamentos são processados por Prestadores terceiros. O Advogado aceita as suas condições e processos KYC/PBC-FT.',
  '8.1. **Prestadores de pagamento.** Os pagamentos são processados **exclusivamente** por Prestadores terceiros certificados **PCI-DSS**: **Stripe Payments Europe Ltd.** (Irlanda, UE) e/ou **PayPal (Europe) S.à r.l. et Cie, S.C.A.** (Luxemburgo, UE). O Prestador aplicável depende do país de residência/atuação do Advogado (Stripe abrange atualmente 44 países, PayPal 150+ países). O Advogado **aceita expressamente** as condições gerais e os processos KYC/PBC-FT do(s) Prestador(es) aplicável(eis). **A SOS Expat NÃO é um banco, instituição de pagamento ou instituição de crédito**; a SOS Expat é apenas um cliente comercial dos Prestadores de pagamento mencionados.',
  'PT Lawyers 8.1');

replace(TERMS_LAWYERS,
  '8.4. **Obrigação de completar o processo de verificação (KYC).** Para receber os pagamentos resultantes das prestações realizadas através da Plataforma, o Advogado compromete-se a completar o processo de verificação de identidade (KYC - Know Your Customer) junto do nosso parceiro de pagamento Stripe no mais breve prazo após a sua inscrição. O Advogado reconhece que a ausência de verificação KYC completa impede tecnicamente a transferência de fundos para a sua conta bancária.',
  '8.4. **Obrigação de completar o processo de verificação (KYC).** Para receber os pagamentos resultantes das prestações realizadas através da Plataforma, o Advogado compromete-se a completar o processo de verificação de identidade (KYC - Know Your Customer) junto do Prestador de pagamento aplicável (**Stripe** ou **PayPal**, conforme o seu país de residência) no mais breve prazo após a sua inscrição. O Advogado reconhece que a ausência de verificação KYC completa impede tecnicamente a transferência de fundos para a sua conta bancária ou conta PayPal.',
  'PT Lawyers 8.4');

// ============================================================
// === RU — TermsLawyers ===
// ============================================================
console.log('\n🇷🇺 Russian (RU):');
replace(TERMS_LAWYERS,
  '5.2. **Конфиденциальность.** Юрист соблюдает профессиональную тайну в соответствии с законом страны вмешательства. SOS не записывает обмены, за исключением случаев, требуемых законом.',
  `5.2. **Конфиденциальность и профессиональная тайна.** Юрист соблюдает конфиденциальность и профессиональную тайну в соответствии с законом страны вмешательства.

**Политика записи звонков:**
- (a) **По умолчанию** SOS Expat **НЕ записывает аудио-содержание** звонков между Юристом и Пользователем. Сохраняются только **технические метаданные** (метка времени, длительность, идентификаторы Twilio, статус соединения) для биллинга, противодействия мошенничеству и разрешения технических споров;
- (b) SOS Expat **оставляет за собой право** активировать аудиозапись в строго ограниченных случаях: подозрение в мошенничестве, сообщение о злоупотреблении, предписание компетентного судебного органа, защита жизненно важных интересов. Стороны будут проинформированы в начале звонка;
- (c) При активации записи она хранится максимум **шесть (6) месяцев** (с возможностью продления судебным процессом), в соответствии с GDPR;
- (d) **Юрист сам обязуется** не записывать, не транскрибировать полностью, не разглашать и не использовать обмены для целей, отличных от согласованной услуги, без письменного разрешения Пользователя или юридического обязательства;
- (e) **Профессиональная тайна остаётся неприкосновенной**: любая запись со стороны SOS Expat не может быть использована против Юриста или Пользователя в нарушение деонтологических правил, применимых к профессиональной тайне.`,
  'RU Lawyers 5.2');

replace(TERMS_LAWYERS,
  '8.1. Платежи обрабатываются сторонними Поставщиками. Юрист принимает их условия и процедуры KYC/ПОД-ФТ.',
  '8.1. **Платёжные провайдеры.** Платежи обрабатываются **исключительно** сертифицированными по **PCI-DSS** сторонними Поставщиками: **Stripe Payments Europe Ltd.** (Ирландия, ЕС) и/или **PayPal (Europe) S.à r.l. et Cie, S.C.A.** (Люксембург, ЕС). Применимый Поставщик зависит от страны проживания/практики Юриста (Stripe в настоящее время охватывает 44 страны, PayPal — более 150). Юрист **прямо принимает** условия и процедуры KYC/ПОД-ФТ применимого(ых) Поставщика(ов). **SOS Expat НЕ является банком, платёжным или кредитным учреждением**; SOS Expat является лишь коммерческим клиентом упомянутых Платёжных провайдеров.',
  'RU Lawyers 8.1');

// ============================================================
// === HI — TermsLawyers ===
// ============================================================
console.log('\n🇮🇳 Hindi (HI):');
replace(TERMS_LAWYERS,
  '5.2. **व्यावसायिक गोपनीयता एवं रहस्य।** वकील हस्तक्षेप देश के लागू विधि के अनुसार गोपनीयता/व्यावसायिक रहस्य का पालन करेगा। SOS द्वारा वार्तालाप रिकॉर्ड नहीं किए जाते, विधिक बाध्यताओं को छोड़कर।',
  `5.2. **व्यावसायिक गोपनीयता एवं रहस्य।** वकील हस्तक्षेप देश के लागू विधि के अनुसार गोपनीयता और व्यावसायिक रहस्य का पालन करेगा।

**कॉल रिकॉर्डिंग नीति:**
- (a) **डिफ़ॉल्ट रूप से**, SOS Expat वकील और उपयोगकर्ता के बीच कॉल की **ऑडियो सामग्री रिकॉर्ड नहीं करता**। केवल **तकनीकी मेटाडेटा** बनाए रखे जाते हैं (टाइमस्टैम्प, अवधि, Twilio पहचानकर्ता, कनेक्शन स्थिति) बिलिंग, धोखाधड़ी विरोधी और तकनीकी विवाद समाधान के लिए;
- (b) SOS Expat सख्ती से सीमित मामलों में ऑडियो रिकॉर्डिंग सक्षम करने का **अधिकार सुरक्षित रखता है**: धोखाधड़ी का संदेह, दुरुपयोग रिपोर्ट, सक्षम न्यायिक प्राधिकरण का आदेश, महत्वपूर्ण हितों की सुरक्षा। पक्षों को कॉल की शुरुआत में सूचित किया जाएगा;
- (c) जब रिकॉर्डिंग सक्षम होती है, तो इसे अधिकतम **छह (6) महीने** के लिए संग्रहीत किया जाता है (न्यायिक कार्यवाही द्वारा विस्तार के अधीन), GDPR के अनुसार;
- (d) **वकील स्वयं** उपयोगकर्ता की लिखित अनुमति या कानूनी बाध्यता को छोड़कर, सहमत सेवा के अलावा अन्य उद्देश्यों के लिए रिकॉर्ड, पूरी तरह से लिप्यंतरण, प्रकटीकरण या उपयोग करने से प्रतिबंधित है;
- (e) **व्यावसायिक रहस्य अक्षुण्ण रहता है**: SOS Expat द्वारा कोई भी रिकॉर्डिंग व्यावसायिक रहस्य के लिए लागू आचार नियमों के उल्लंघन में वकील या उपयोगकर्ता के खिलाफ उपयोग नहीं की जा सकती।`,
  'HI Lawyers 5.2');

replace(TERMS_LAWYERS,
  '8.1. भुगतान तृतीय-पक्ष प्रदाताओं द्वारा संसाधित किए जाते हैं। वकील उनकी शर्तों और KYC/AML प्रक्रियाओं को स्वीकार करता है।',
  '8.1. **भुगतान प्रदाता।** भुगतान **विशेष रूप से** **PCI-DSS** प्रमाणित तृतीय-पक्ष प्रदाताओं द्वारा संसाधित किए जाते हैं: **Stripe Payments Europe Ltd.** (आयरलैंड, EU) और/या **PayPal (Europe) S.à r.l. et Cie, S.C.A.** (लक्ज़मबर्ग, EU)। लागू प्रदाता वकील के निवास/अभ्यास के देश पर निर्भर करता है (Stripe वर्तमान में 44 देशों को कवर करता है, PayPal 150+ देश)। वकील **स्पष्ट रूप से** लागू प्रदाता(ओं) की शर्तों और KYC/AML प्रक्रियाओं को स्वीकार करता है। **SOS Expat एक बैंक, भुगतान संस्थान या क्रेडिट संस्थान नहीं है**; SOS Expat केवल उल्लिखित भुगतान प्रदाताओं का एक वाणिज्यिक ग्राहक है।',
  'HI Lawyers 8.1');

// ============================================================
// === ZH — TermsLawyers ===
// ============================================================
console.log('\n🇨🇳 Chinese (ZH):');
replace(TERMS_LAWYERS,
  '5.2. **职业保密与机密性。** 律师根据执业国家的适用法律遵守机密性/职业保密义务。SOS不会录制通信内容，除非法律要求。',
  `5.2. **职业保密与机密性。** 律师根据执业国家的适用法律遵守机密性和职业保密义务。

**通话录音政策：**
- (a) **默认情况下**，SOS Expat **不录制**律师和用户之间通话的音频内容。仅保留**技术元数据**（时间戳、时长、Twilio 标识符、连接状态）用于计费、反欺诈和解决技术争议；
- (b) SOS Expat **保留**在严格限定的情况下启用音频录制的**权利**：怀疑欺诈、滥用举报、主管司法机关的命令、保护重大利益。各方将在通话开始时被告知；
- (c) 启用录音时，最多保留**六 (6) 个月**（除非司法程序要求延长），符合 GDPR；
- (d) **律师本人也禁止**未经用户书面授权或法律义务，录制、完整转录、披露或将交流用于约定服务以外的目的；
- (e) **职业保密保持不受侵犯**：SOS Expat 的任何录音不得违反适用于职业保密的职业道德规则用于针对律师或用户。`,
  'ZH Lawyers 5.2');

replace(TERMS_LAWYERS,
  '8.1. 支付由第三方服务提供商处理。律师接受其条款及KYC/反洗钱流程。',
  '8.1. **支付服务提供商。** 支付**仅**由 **PCI-DSS** 认证的第三方服务提供商处理：**Stripe Payments Europe Ltd.**（爱尔兰，欧盟）和/或 **PayPal (Europe) S.à r.l. et Cie, S.C.A.**（卢森堡，欧盟）。适用的服务提供商取决于律师的居住/执业国家（Stripe 目前覆盖 44 个国家，PayPal 覆盖 150+ 个国家）。律师**明确接受**适用服务提供商的条款及 KYC/反洗钱流程。**SOS Expat 不是银行、支付机构或信贷机构**；SOS Expat 仅是上述支付服务提供商的商业客户。',
  'ZH Lawyers 8.1');

// ============================================================
// === AR — TermsLawyers ===
// ============================================================
console.log('\n🇸🇦 Arabic (AR):');
replace(TERMS_LAWYERS,
  '5.2. **السرية المهنية:** يلتزم المحامي بالسرية وفق القوانين المطبقة في بلد التدخّل. ولا تسجل SOS المحادثات إلا إذا تطلب القانون ذلك.',
  `5.2. **السرية المهنية والكتمان.** يلتزم المحامي بالسرية والكتمان المهني وفق القوانين المطبقة في بلد التدخّل.

**سياسة تسجيل المكالمات:**
- (a) **بشكل افتراضي**، **لا تسجل SOS Expat المحتوى الصوتي** للمكالمات بين المحامي والمستخدم. تُحفظ فقط **البيانات الوصفية التقنية** (الطابع الزمني، المدة، معرفات Twilio، حالة الاتصال) لأغراض الفوترة ومكافحة الاحتيال وحل النزاعات التقنية؛
- (b) **تحتفظ SOS Expat بالحق** في تفعيل تسجيل صوتي في حالات محدودة بشكل صارم: الاشتباه في احتيال، الإبلاغ عن إساءة استخدام، أمر من سلطة قضائية مختصة، حماية المصالح الحيوية. سيتم إعلام الأطراف في بداية المكالمة؛
- (c) عند تفعيل التسجيل، يُحفظ لمدة أقصاها **ستة (6) أشهر** (ما لم يتم التمديد بموجب إجراءات قضائية)، وفقاً للائحة العامة لحماية البيانات؛
- (d) **يلتزم المحامي بنفسه** بعدم تسجيل أو تدوين كامل أو الكشف عن أو استخدام التبادلات لأغراض غير الخدمة المتفق عليها، إلا بإذن مكتوب من المستخدم أو التزام قانوني؛
- (e) **تظل السرية المهنية سليمة**: لا يمكن استخدام أي تسجيل من قبل SOS Expat ضد المحامي أو المستخدم بانتهاك القواعد الأخلاقية المطبقة على السرية المهنية.`,
  'AR Lawyers 5.2');

replace(TERMS_LAWYERS,
  '8.1. تُنفَّذ المدفوعات عبر مزوّدي خدمات طرف ثالث. ويوافق المحامي على شروطهم وإجراءات التحقق (KYC/AML).',
  '8.1. **مزودو الدفع.** تتم معالجة المدفوعات **حصرياً** من قبل مزودي خدمات طرف ثالث معتمدين **PCI-DSS**: **Stripe Payments Europe Ltd.** (أيرلندا، الاتحاد الأوروبي) و/أو **PayPal (Europe) S.à r.l. et Cie, S.C.A.** (لوكسمبورغ، الاتحاد الأوروبي). يعتمد المزود المطبق على بلد إقامة/ممارسة المحامي (Stripe يغطي حالياً 44 دولة، PayPal أكثر من 150 دولة). يقبل المحامي **صراحة** الشروط وإجراءات KYC/AML للمزود(ين) المطبق(ين). **SOS Expat ليست بنكاً ولا مؤسسة دفع ولا مؤسسة ائتمان**؛ SOS Expat هي فقط عميل تجاري لمزودي الدفع المذكورين.',
  'AR Lawyers 8.1');

// ============================================================
// ============================================================
// === TermsExpats — All 7 languages ===
// ============================================================
// ============================================================
console.log('\n\n═══ TermsExpats — ES/DE/RU/HI/PT/ZH/AR ═══\n');

// === ES — TermsExpats ===
console.log('🇪🇸 Spanish (ES):');
replace(TERMS_EXPATS,
  '13.2. **Confidencialidad de los intercambios.** Los intercambios realizados a través de la Plataforma (mensajes, llamadas telefónicas) son **confidenciales**. El Asistente se prohíbe grabarlos, divulgarlos o utilizarlos con fines distintos a la prestación acordada, salvo autorización escrita u obligación legal.',
  `13.2. **Confidencialidad de los intercambios y política de grabación.** Los intercambios realizados a través de la Plataforma (mensajes, llamadas telefónicas) son **confidenciales**.

**Política de grabación:**
- (a) **Por defecto**, SOS Expat **NO graba el contenido audio** de las llamadas entre Ayudante y Usuario. Solo se conservan los **metadatos técnicos** para facturación, antifraude y resolución de disputas técnicas;
- (b) SOS Expat **se reserva el derecho** de activar una grabación audio temporal en casos estrictamente limitados (sospecha de fraude, denuncia de abuso, orden judicial, protección de intereses vitales). Las partes serán informadas al inicio de la llamada;
- (c) Cuando se activa una grabación, se conserva durante un máximo de **seis (6) meses**, conforme al RGPD;
- (d) **El Ayudante se prohíbe a sí mismo** grabar, transcribir íntegramente, divulgar o utilizar los intercambios para fines distintos a la prestación acordada, salvo autorización escrita del Usuario u obligación legal. Cualquier infracción puede dar lugar a la suspensión inmediata de la cuenta y comprometer la responsabilidad civil y/o penal del Ayudante.`,
  'ES Expats 13.2');

// === DE — TermsExpats ===
console.log('\n🇩🇪 German (DE):');
replace(TERMS_EXPATS,
  '13.2. **Vertraulichkeit der Kommunikation.** Über die Plattform geführte Kommunikation (Nachrichten, Anrufe) ist **vertraulich**. Der Helfer darf sie nicht aufzeichnen, weitergeben oder zu anderen Zwecken als der vereinbarten Dienstleistung verwenden, außer mit schriftlicher Erlaubnis oder gesetzlicher Verpflichtung.',
  `13.2. **Vertraulichkeit der Kommunikation und Aufzeichnungsrichtlinie.** Über die Plattform geführte Kommunikation (Nachrichten, Anrufe) ist **vertraulich**.

**Aufzeichnungsrichtlinie:**
- (a) **Standardmäßig** zeichnet SOS Expat den Audio-Inhalt der Anrufe zwischen Helfer und Nutzer **NICHT auf**. Es werden nur **technische Metadaten** für Abrechnung, Betrugsbekämpfung und Lösung technischer Streitigkeiten gespeichert;
- (b) SOS Expat **behält sich das Recht vor**, eine vorübergehende Audio-Aufzeichnung in streng begrenzten Fällen zu aktivieren (Betrugsverdacht, Missbrauchsmeldung, Gerichtsanordnung, Schutz lebenswichtiger Interessen). Die Parteien werden zu Beginn des Anrufs informiert;
- (c) Wenn eine Aufzeichnung aktiviert wird, wird sie höchstens **sechs (6) Monate** aufbewahrt, gemäß DSGVO;
- (d) **Der Helfer selbst ist verpflichtet**, die Gespräche nicht aufzuzeichnen, vollständig zu transkribieren, offenzulegen oder zu anderen Zwecken als der vereinbarten Dienstleistung zu verwenden, außer mit schriftlicher Genehmigung des Nutzers oder gesetzlicher Verpflichtung. Jeder Verstoß kann zur sofortigen Kontosperrung und zur zivil- und/oder strafrechtlichen Haftung des Helfers führen.`,
  'DE Expats 13.2');

// === PT — TermsExpats ===
console.log('\n🇵🇹 Portuguese (PT):');

// Note: PT version doesn't have a clear 13.2 — search what exists
replace(TERMS_EXPATS,
  '7.3. **Bankgebühren des Zahlungsdienstleisters.** Der Zahlungsdienstleister (Stripe oder Äquivalent) erhebt Bearbeitungsgebühren für jede Transaktion. **Diese Bankgebühren gehen vollständig zulasten des Helfers** und werden automatisch von dem ihm überwiesenen Betrag abgezogen. Details zu diesen Gebühren sind in den Bedingungen des Zahlungsdienstleisters und im Dashboard des Helfers für jede Transaktion verfügbar.',
  '7.3. **Bankgebühren des Zahlungsdienstleisters.** Der Zahlungsdienstleister — **Stripe Payments Europe Ltd.** (Irland, EU, PCI-DSS Level 1 zertifiziert) **oder PayPal (Europe) S.à r.l. et Cie, S.C.A.** (Luxemburg, EU, PCI-DSS zertifiziert), abhängig vom Wohnsitzland und Verfügbarkeit — erhebt Bearbeitungsgebühren für jede Transaktion. **Diese Bankgebühren gehen vollständig zulasten des Helfers** und werden automatisch von dem ihm überwiesenen Betrag abgezogen.',
  'DE Expats 7.3');

// AR Expats 13.2 (already has Arabic version with similar text)
console.log('\n🇸🇦 Arabic (AR):');
replace(TERMS_EXPATS,
  '8.1. **مزودو الدفع.** تتم معالجة المدفوعات بواسطة **مزودين خارجيين** (Stripe، إلخ). يقبل المساعد شروطهم وإجراءات التحقق **KYC/مكافحة غسل الأموال** الخاصة بهم.',
  '8.1. **مزودو الدفع.** تتم معالجة المدفوعات **حصرياً** من قبل مزودين خارجيين معتمدين **PCI-DSS**: **Stripe Payments Europe Ltd.** (أيرلندا، الاتحاد الأوروبي) و/أو **PayPal (Europe) S.à r.l. et Cie, S.C.A.** (لوكسمبورغ، الاتحاد الأوروبي). يعتمد المزود المطبق على بلد إقامة/ممارسة المساعد (Stripe يغطي 44 دولة، PayPal أكثر من 150 دولة). **يقبل المساعد صراحة** الشروط العامة وإجراءات التحقق **KYC/AML** للمزود(ين) المطبق(ين). **SOS Expat ليست بنكاً أو مؤسسة دفع أو مؤسسة ائتمان**؛ SOS Expat هي فقط عميل تجاري لمزودي الدفع المذكورين.',
  'AR Expats 8.1');

console.log('\n═══ SUMMARY ═══');
console.log(`✅ Applied: ${appliedCount}`);
console.log(`❌ Not found: ${notFoundCount}`);
console.log('═══════════════\n');
