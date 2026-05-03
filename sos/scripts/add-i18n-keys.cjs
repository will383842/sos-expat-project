// Petit utilitaire ad hoc : ajoute des clés i18n aux 10 langues, dans src/helper et public/helper.
const fs = require('fs');
const path = require('path');

const LOCALES = ['fr', 'en', 'es', 'de', 'pt', 'ru', 'ar', 'hi', 'zh', 'ch'];

const NEW_KEYS = {
  fr: {
    'payment.payAmount': 'Payer {amount}',
    'payment.orPayByCard': 'ou par carte',
    'payment.loading': 'Chargement...',
    'payment.processing': 'Traitement...',
    'checkout.threeDSCheck': 'Vérification bancaire en cours...',
    'checkout.providerUnavailable': "Ce prestataire n'est plus disponible actuellement. Veuillez réessayer plus tard.",
  },
  en: {
    'payment.payAmount': 'Pay {amount}',
    'payment.orPayByCard': 'or pay by card',
    'payment.loading': 'Loading...',
    'payment.processing': 'Processing...',
    'checkout.threeDSCheck': 'Bank verification in progress...',
    'checkout.providerUnavailable': 'This provider is currently unavailable. Please try again later.',
  },
  es: {
    'payment.payAmount': 'Pagar {amount}',
    'payment.orPayByCard': 'o con tarjeta',
    'payment.loading': 'Cargando...',
    'payment.processing': 'Procesando...',
    'checkout.threeDSCheck': 'Verificación bancaria en curso...',
    'checkout.providerUnavailable': 'Este proveedor no está disponible actualmente. Inténtelo de nuevo más tarde.',
  },
  de: {
    'payment.payAmount': '{amount} bezahlen',
    'payment.orPayByCard': 'oder mit Karte',
    'payment.loading': 'Wird geladen...',
    'payment.processing': 'Wird verarbeitet...',
    'checkout.threeDSCheck': 'Bankverifizierung läuft...',
    'checkout.providerUnavailable': 'Dieser Anbieter ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.',
  },
  pt: {
    'payment.payAmount': 'Pagar {amount}',
    'payment.orPayByCard': 'ou com cartão',
    'payment.loading': 'A carregar...',
    'payment.processing': 'A processar...',
    'checkout.threeDSCheck': 'Verificação bancária em curso...',
    'checkout.providerUnavailable': 'Este prestador não está disponível de momento. Tente novamente mais tarde.',
  },
  ru: {
    'payment.payAmount': 'Оплатить {amount}',
    'payment.orPayByCard': 'или картой',
    'payment.loading': 'Загрузка...',
    'payment.processing': 'Обработка...',
    'checkout.threeDSCheck': 'Идёт проверка банка...',
    'checkout.providerUnavailable': 'Этот специалист сейчас недоступен. Пожалуйста, попробуйте позже.',
  },
  ar: {
    'payment.payAmount': 'ادفع {amount}',
    'payment.orPayByCard': 'أو ببطاقة',
    'payment.loading': 'جارٍ التحميل...',
    'payment.processing': 'جارٍ المعالجة...',
    'checkout.threeDSCheck': 'جارٍ التحقق المصرفي...',
    'checkout.providerUnavailable': 'هذا المزود غير متاح حالياً. يرجى المحاولة لاحقاً.',
  },
  hi: {
    'payment.payAmount': '{amount} भुगतान करें',
    'payment.orPayByCard': 'या कार्ड से',
    'payment.loading': 'लोड हो रहा है...',
    'payment.processing': 'प्रसंस्करण...',
    'checkout.threeDSCheck': 'बैंक सत्यापन जारी है...',
    'checkout.providerUnavailable': 'यह प्रदाता अभी उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।',
  },
  zh: {
    'payment.payAmount': '支付 {amount}',
    'payment.orPayByCard': '或使用银行卡',
    'payment.loading': '加载中...',
    'payment.processing': '处理中...',
    'checkout.threeDSCheck': '银行验证中...',
    'checkout.providerUnavailable': '该服务商当前不可用，请稍后再试。',
  },
  ch: {
    'payment.payAmount': '支付 {amount}',
    'payment.orPayByCard': '或使用银行卡',
    'payment.loading': '加载中...',
    'payment.processing': '处理中...',
    'checkout.threeDSCheck': '银行验证中...',
    'checkout.providerUnavailable': '该服务商当前不可用，请稍后再试。',
  },
};

const ROOTS = [
  path.resolve(__dirname, '..', 'src', 'helper'),
  path.resolve(__dirname, '..', 'public', 'helper'),
];

let modified = 0;
for (const root of ROOTS) {
  for (const loc of LOCALES) {
    const file = path.join(root, `${loc}.json`);
    if (!fs.existsSync(file)) {
      console.warn(`SKIP missing ${file}`);
      continue;
    }
    const raw = fs.readFileSync(file, 'utf8');
    let json;
    try { json = JSON.parse(raw); }
    catch (e) { console.error(`PARSE FAIL ${file}: ${e.message}`); continue; }

    let touched = false;
    for (const [k, v] of Object.entries(NEW_KEYS[loc])) {
      if (!(k in json)) { json[k] = v; touched = true; }
    }
    if (!touched) { continue; }

    const sortedKeys = Object.keys(json).sort();
    const sorted = {};
    for (const k of sortedKeys) sorted[k] = json[k];

    fs.writeFileSync(file, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
    modified++;
    console.log(`OK ${file}`);
  }
}
console.log(`\nDone. ${modified} files modified.`);
