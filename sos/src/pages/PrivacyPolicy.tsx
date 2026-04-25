import React, { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import {
  Shield,
  Eye,
  Lock,
  Users,
  Check,
  Globe,
  Clock,
  Languages,
} from "lucide-react";
import Layout from "../components/layout/Layout";
import SEOHead from "../components/layout/SEOHead";
import BreadcrumbSchema from "../components/seo/BreadcrumbSchema";
import { useApp } from "../contexts/AppContext";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useIntl } from "react-intl";

interface PrivacySection {
  icon: React.ComponentType<{ className?: string }>;
  titleKey: keyof TranslationUnit;
  contentKey: keyof TranslationUnit;
}

type TranslationUnit = {
  title: string;
  subtitle: string;
  lastUpdated: string;
  dataCollection: string;
  dataProtection: string;
  dataSharing: string;
  socialMediaApi: string;
  yourRights: string;
  contact: string;
  dataCollectionContent: string;
  dataProtectionContent: string;
  dataSharingContent: string;
  socialMediaApiContent: string;
  rights: string[];
  contactContent: string;
  features: string[];
  contactCta: string;
  editHint: string;
};

type Translations = {
  fr: TranslationUnit;
  en: TranslationUnit;
  es: TranslationUnit;
  de: TranslationUnit;
  ru: TranslationUnit;
  hi: TranslationUnit;
  pt: TranslationUnit;
  ch: TranslationUnit;
  ar: TranslationUnit;
};

const PrivacyPolicy: React.FC = () => {
  const intl = useIntl();
  const { language } = useApp();

  // --- State (business logic preserved) ---
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Local toggle without changing global app language
  const [selectedLanguage, setSelectedLanguage] = useState<

    "fr" | "en" | "es" | "de" | "ru" | "hi" | "pt" | "ch" | "ar"
  >(
    (language as
      | "fr"
      | "en"
      | "es"
      | "de"
      | "ru"
      | "hi"
      | "pt"
      | "ch"
      | "ar") || "fr"
  );

  useEffect(() => {
    if (language)
      setSelectedLanguage(
        language as "fr" | "en" | "es" | "de" | "ru" | "hi" | "pt" | "ch" | "ar"
      );
  }, [language]);

  // --- Static texts / i18n ---
  const texts: Translations = useMemo(
    () => ({
      fr: {
        title: "Politique de confidentialité",
        subtitle: "Votre vie privée est notre priorité",
        lastUpdated: "Version 2.2 – Dernière mise à jour : 16 juin 2025",
        dataCollection: "Collecte des données",
        dataProtection: "Protection des données",
        dataSharing: "Partage des données",
        socialMediaApi: "Réseaux sociaux et API Meta",
        yourRights: "Vos droits",
        contact: "Contact",
        dataCollectionContent:
          "Nous collectons uniquement les informations nécessaires pour fournir nos services d'assistance. Cela inclut vos informations de contact, des métadonnées techniques (appels, messagerie) et les détails indispensables à votre demande.",
        dataProtectionContent:
          "Vos données sont chiffrées en transit et au repos lorsque c'est possible et stockées de manière sécurisée. Des mesures techniques et organisationnelles sont mises en œuvre pour prévenir tout accès non autorisé.",
        dataSharingContent:
          "Nous ne vendons jamais vos données personnelles. Nous partageons uniquement les informations nécessaires avec des prestataires vérifiés (paiements, téléphonie, hébergement) pour fournir le service demandé.",
        socialMediaApiContent:
          "Notre outil interne « Mission Control » utilise les API officielles de Meta (Facebook, Instagram, Threads) et de LinkedIn UNIQUEMENT pour publier du contenu sur nos propres comptes professionnels SOS-Expat. Nous ne collectons aucune donnée d'utilisateur Meta à des fins commerciales. Les commentaires reçus sur nos publications sont temporairement stockés pour permettre à notre équipe éditoriale de répondre, puis anonymisés sous 90 jours. Vous pouvez à tout moment révoquer l'accès depuis les paramètres « Applications connectées » de votre compte Facebook / Instagram / LinkedIn. Pour la suppression complète de vos données, consultez notre page Suppression des données.",
        rights: [
          "Droit d'accès à vos données",
          "Droit de rectification",
          "Droit à l'effacement (dans les limites légales)",
          "Droit à la portabilité",
          "Droit d’opposition et de limitation",
        ],
        contactContent:
          "Pour toute question ou pour exercer vos droits, utilisez le formulaire dédié ci-dessous.",
        features: [
          "Chiffrement",
          "Transparence",
          "Contrôle utilisateur",
          "Pas de revente de données",
        ],
        contactCta: "Formulaire de contact",
        editHint: "Document éditable depuis la console admin (FR/EN)",
      },
      en: {
        title: "Privacy Policy",
        subtitle: "Your privacy is our priority",
        lastUpdated: "Version 2.2 – Last updated: 16 June 2025",
        dataCollection: "Data Collection",
        dataProtection: "Data Protection",
        dataSharing: "Data Sharing",
        socialMediaApi: "Social Media & Meta API",
        yourRights: "Your Rights",
        contact: "Contact",
        dataCollectionContent:
          "We collect only the information needed to deliver our assistance services. This includes your contact details, technical metadata (calls, messaging) and details strictly required for your request.",
        dataProtectionContent:
          "Your data is encrypted in transit and at rest where possible and stored securely. We apply technical and organizational measures to prevent unauthorized access.",
        dataSharingContent:
          "We never sell your personal data. We only share information necessary with vetted providers (payments, telephony, hosting) to deliver the requested service.",
        socialMediaApiContent:
          "Our internal tool 'Mission Control' uses the official Meta APIs (Facebook, Instagram, Threads) and LinkedIn API ONLY to publish content on our own SOS-Expat business accounts. We do NOT collect Meta user data for commercial purposes. Comments received on our publications are temporarily stored to allow our editorial team to reply, then anonymized after 90 days. You can revoke access at any time from the 'Connected Apps' section of your Facebook / Instagram / LinkedIn account settings. For full data deletion, see our Data Deletion page.",
        rights: [
          "Right of access",
          "Right to rectification",
          "Right to erasure (within legal limits)",
          "Right to data portability",
          "Right to object and restrict",
        ],
        contactContent:
          "For questions or to exercise your rights, please use the form below.",
        features: [
          "Encryption",
          "Transparency",
          "User control",
          "No data resale",
        ],
        contactCta: "Contact form",
        editHint: "Document editable from the admin console (EN/FR)",
      },
      es: {
        title: "Política de privacidad",
        subtitle: "Tu privacidad es nuestra prioridad",
        lastUpdated: "Versión 2.2 – Última actualización: 16 de junio de 2025",
        dataCollection: "Recopilación de datos",
        dataProtection: "Protección de datos",
        dataSharing: "Compartir datos",
        socialMediaApi: "Redes sociales y API Meta",
        yourRights: "Tus derechos",
        contact: "Contacto",
        dataCollectionContent:
          "Solo recopilamos la información necesaria para proporcionar nuestros servicios de asistencia. Esto incluye tus datos de contacto, metadatos técnicos (llamadas, mensajería) y detalles estrictamente necesarios para tu solicitud.",
        dataProtectionContent:
          "Tus datos están cifrados en tránsito y en reposo cuando es posible y almacenados de forma segura. Aplicamos medidas técnicas y organizativas para prevenir accesos no autorizados.",
        dataSharingContent:
          "Nunca vendemos tus datos personales. Solo compartimos información necesaria con proveedores verificados (pagos, telefonía, alojamiento) para entregar el servicio solicitado.",
        socialMediaApiContent:
          "Nuestra herramienta interna 'Mission Control' utiliza las APIs oficiales de Meta (Facebook, Instagram, Threads) y de LinkedIn ÚNICAMENTE para publicar contenido en nuestras propias cuentas profesionales SOS-Expat. NO recopilamos datos de usuarios de Meta con fines comerciales. Los comentarios recibidos en nuestras publicaciones se almacenan temporalmente para que nuestro equipo editorial pueda responder, y se anonimizan a los 90 días. Puedes revocar el acceso en cualquier momento desde la sección 'Aplicaciones conectadas' de tu cuenta Facebook / Instagram / LinkedIn. Para la eliminación completa de tus datos, consulta nuestra página de Eliminación de datos.",
        rights: [
          "Derecho de acceso",
          "Derecho de rectificación",
          "Derecho al olvido (dentro de los límites legales)",
          "Derecho a la portabilidad de datos",
          "Derecho a objetar y restringir",
        ],
        contactContent:
          "Para preguntas o ejercer tus derechos, utiliza el formulario a continuación.",
        features: [
          "Cifrado",
          "Transparencia",
          "Control del usuario",
          "Sin reventa de datos",
        ],
        contactCta: "Formulario de contacto",
        editHint: "Documento editable desde la consola de administración (ES)",
      },
      de: {
        title: "Datenschutzerklärung",
        subtitle: "Ihre Privatsphäre ist unsere Priorität",
        lastUpdated: "Version 2.2 – Letzte Aktualisierung: 16. Juni 2025",
        dataCollection: "Datenerfassung",
        dataProtection: "Datenschutz",
        dataSharing: "Datenweitergabe",
        socialMediaApi: "Soziale Medien und Meta-API",
        yourRights: "Ihre Rechte",
        contact: "Kontakt",
        dataCollectionContent:
          "Wir erfassen nur die notwendigen Informationen zur Bereitstellung unserer Dienste. Dazu gehören Ihre Kontaktdaten, technische Metadaten (Anrufe, Nachrichten) und Details, die für Ihre Anfrage erforderlich sind.",
        dataProtectionContent:
          "Ihre Daten werden während der Übertragung und im Ruhezustand verschlüsselt und sicher gespeichert. Wir setzen technische und organisatorische Maßnahmen ein, um unbefugten Zugriff zu verhindern.",
        dataSharingContent:
          "Wir verkaufen niemals Ihre persönlichen Daten. Wir geben nur die notwendigen Informationen an geprüfte Anbieter weiter (Zahlungen, Telefonie, Hosting), um den angeforderten Service bereitzustellen.",
        socialMediaApiContent:
          "Unser internes Tool 'Mission Control' nutzt die offiziellen Meta-APIs (Facebook, Instagram, Threads) und die LinkedIn-API AUSSCHLIESSLICH zur Veröffentlichung von Inhalten auf unseren eigenen SOS-Expat Geschäftskonten. Wir erfassen KEINE Meta-Nutzerdaten für kommerzielle Zwecke. Auf unsere Beiträge erhaltene Kommentare werden vorübergehend gespeichert, damit unser Redaktionsteam antworten kann, und nach 90 Tagen anonymisiert. Sie können den Zugriff jederzeit unter 'Verbundene Apps' in Ihren Facebook / Instagram / LinkedIn-Kontoeinstellungen widerrufen. Für die vollständige Löschung Ihrer Daten siehe unsere Seite Datenlöschung.",
        rights: [
          "Recht auf Zugang",
          "Recht auf Berichtigung",
          "Recht auf Löschung (innerhalb gesetzlicher Grenzen)",
          "Recht auf Datenübertragbarkeit",
          "Recht auf Widerspruch und Einschränkung",
        ],
        contactContent:
          "Bei Fragen oder zur Ausübung Ihrer Rechte nutzen Sie bitte das Formular unten.",
        features: [
          "Verschlüsselung",
          "Transparenz",
          "Benutzerkontrolle",
          "Kein Datenverkauf",
        ],
        contactCta: "Kontaktformular",
        editHint: "Dokument bearbeitbar über die Admin-Konsole (DE)",
      },
      ru: {
        title: "Политика конфиденциальности",
        subtitle: "Ваша конфиденциальность — наш приоритет",
        lastUpdated: "Версия 2.2 – Последнее обновление: 16 июня 2025",
        dataCollection: "Сбор данных",
        dataProtection: "Защита данных",
        dataSharing: "Обмен данными",
        socialMediaApi: "Социальные сети и Meta API",
        yourRights: "Ваши права",
        contact: "Контакт",
        dataCollectionContent:
          "Мы собираем только необходимую информацию для предоставления наших услуг. Это включает ваши контактные данные, технические метаданные (звонки, сообщения) и детали, необходимые для вашего запроса.",
        dataProtectionContent:
          "Ваши данные зашифрованы при передаче и хранении и надежно защищены. Мы применяем технические и организационные меры для предотвращения несанкционированного доступа.",
        dataSharingContent:
          "Мы никогда не продаем ваши личные данные. Мы делимся только необходимой информацией с проверенными поставщиками (платежи, телефония, хостинг) для предоставления запрошенной услуги.",
        socialMediaApiContent:
          "Наш внутренний инструмент 'Mission Control' использует официальные API Meta (Facebook, Instagram, Threads) и LinkedIn ИСКЛЮЧИТЕЛЬНО для публикации контента в наших собственных бизнес-аккаунтах SOS-Expat. Мы НЕ собираем данные пользователей Meta в коммерческих целях. Комментарии, полученные на наших публикациях, временно сохраняются для ответа нашей редакционной команды, затем анонимизируются через 90 дней. Вы можете в любой момент отозвать доступ из настроек 'Подключённые приложения' вашего аккаунта Facebook / Instagram / LinkedIn. Для полного удаления данных см. нашу страницу Удаление данных.",
        rights: [
          "Право на доступ",
          "Право на исправление",
          "Право на удаление (в пределах законных ограничений)",
          "Право на переносимость данных",
          "Право на возражение и ограничение",
        ],
        contactContent:
          "По вопросам или для реализации своих прав воспользуйтесь формой ниже.",
        features: [
          "Шифрование",
          "Прозрачность",
          "Контроль пользователя",
          "Без перепродажи данных",
        ],
        contactCta: "Контактная форма",
        editHint: "Документ редактируется через консоль администратора (RU)",
      },

      pt: {
        title: "Política de Privacidade",
        subtitle: "Sua privacidade é nossa prioridade",
        lastUpdated: "Versão 2.2 – Última atualização: 16 de junho de 2025",
        dataCollection: "Coleta de dados",
        dataProtection: "Proteção de dados",
        dataSharing: "Compartilhamento de dados",
        socialMediaApi: "Redes sociais e API Meta",
        yourRights: "Seus direitos",
        contact: "Contato",
        dataCollectionContent:
          "Coletamos apenas as informações necessárias para fornecer nossos serviços. Isso inclui seus dados de contato, metadados técnicos (chamadas, mensagens) e detalhes necessários para sua solicitação.",
        dataProtectionContent:
          "Seus dados são criptografados em trânsito e armazenamento e protegidos com segurança. Aplicamos medidas técnicas e organizacionais para evitar acesso não autorizado.",
        dataSharingContent:
          "Nunca vendemos seus dados pessoais. Compartilhamos apenas as informações necessárias com fornecedores verificados (pagamentos, telefonia, hospedagem) para fornecer o serviço solicitado.",
        socialMediaApiContent:
          "Nossa ferramenta interna 'Mission Control' usa as APIs oficiais da Meta (Facebook, Instagram, Threads) e do LinkedIn EXCLUSIVAMENTE para publicar conteúdo em nossas próprias contas profissionais SOS-Expat. NÃO coletamos dados de usuários Meta para fins comerciais. Os comentários recebidos em nossas publicações são armazenados temporariamente para que nossa equipe editorial possa responder, e anonimizados após 90 dias. Você pode revogar o acesso a qualquer momento na seção 'Aplicativos conectados' da sua conta Facebook / Instagram / LinkedIn. Para a exclusão completa de seus dados, consulte nossa página de Exclusão de dados.",
        rights: [
          "Direito de acesso",
          "Direito de retificação",
          "Direito de exclusão (dentro das limitações legais)",
          "Direito de portabilidade de dados",
          "Direito de oposição e limitação",
        ],
        contactContent:
          "Para perguntas ou para exercer seus direitos, use o formulário abaixo.",
        features: [
          "Criptografia",
          "Transparência",
          "Controle do usuário",
          "Sem revenda de dados",
        ],
        contactCta: "Formulário de contato",
        editHint: "Documento editável no console do administrador (PT)",
      },
      hi: {
        title: "गोपनीयता नीति",
        subtitle: "आपकी गोपनीयता हमारी प्राथमिकता है",
        lastUpdated: "संस्करण 2.2 – अंतिम अपडेट: 16 जून 2025",
        dataCollection: "डेटा संग्रह",
        dataProtection: "डेटा सुरक्षा",
        dataSharing: "डेटा साझाकरण",
        socialMediaApi: "सोशल मीडिया और Meta API",
        yourRights: "आपके अधिकार",
        contact: "संपर्क",
        dataCollectionContent:
          "हम केवल हमारी सेवाएं प्रदान करने के लिए आवश्यक जानकारी एकत्र करते हैं। इसमें आपके संपर्क विवरण, तकनीकी मेटाडेटा (कॉल, मैसेजिंग) और आपके अनुरोध के लिए आवश्यक विवरण शामिल हैं।",
        dataProtectionContent:
          "आपका डेटा ट्रांज़िट और स्टोरेज में एन्क्रिप्ट किया गया है और सुरक्षित रूप से संग्रहीत है। हम अनधिकृत पहुंच को रोकने के लिए तकनीकी और संगठनात्मक उपाय लागू करते हैं।",
        dataSharingContent:
          "हम कभी भी आपके व्यक्तिगत डेटा को नहीं बेचते। हम केवल आवश्यक जानकारी सत्यापित प्रदाताओं (भुगतान, टेलीफोनी, होस्टिंग) के साथ साझा करते हैं ताकि सेवा प्रदान की जा सके।",
        socialMediaApiContent:
          "हमारा आंतरिक टूल 'Mission Control' केवल हमारे अपने SOS-Expat व्यावसायिक खातों पर सामग्री प्रकाशित करने के लिए Meta (Facebook, Instagram, Threads) और LinkedIn के आधिकारिक API का उपयोग करता है। हम वाणिज्यिक उद्देश्यों के लिए Meta उपयोगकर्ता डेटा एकत्र नहीं करते। हमारी पोस्ट पर प्राप्त टिप्पणियाँ हमारी संपादकीय टीम द्वारा प्रतिक्रिया देने के लिए अस्थायी रूप से संग्रहीत की जाती हैं, फिर 90 दिनों के बाद अनाम कर दी जाती हैं। आप किसी भी समय अपने Facebook / Instagram / LinkedIn खाते की 'जुड़े हुए ऐप्स' सेटिंग्स से एक्सेस रद्द कर सकते हैं। पूर्ण डेटा विलोपन के लिए, हमारा डेटा विलोपन पृष्ठ देखें।",
        rights: [
          "पहुंच का अधिकार",
          "सुधार का अधिकार",
          "हटाने का अधिकार (कानूनी सीमाओं के भीतर)",
          "डेटा पोर्टेबिलिटी का अधिकार",
          "आपत्ति और प्रतिबंध का अधिकार",
        ],
        contactContent:
          "प्रश्नों के लिए या अपने अधिकारों का प्रयोग करने के लिए, कृपया नीचे दिए गए फॉर्म का उपयोग करें।",
        features: [
          "एन्क्रिप्शन",
          "पारदर्शिता",
          "उपयोगकर्ता नियंत्रण",
          "डेटा पुनर्विक्रय नहीं",
        ],
        contactCta: "संपर्क फॉर्म",
        editHint: "एडमिन कंसोल से संपादन योग्य दस्तावेज़ (HI)",
      },

      ar: {
        title: "سياسة الخصوصية",
        subtitle: "خصوصيتك هي أولويتنا",
        lastUpdated: "الإصدار 2.2 – آخر تحديث: 16 يونيو 2025",
        dataCollection: "جمع البيانات",
        dataProtection: "حماية البيانات",
        dataSharing: "مشاركة البيانات",
        socialMediaApi: "وسائل التواصل الاجتماعي و Meta API",
        yourRights: "حقوقك",
        contact: "اتصل",
        dataCollectionContent:
          "نجمع فقط المعلومات الضرورية لتقديم خدمات المساعدة لدينا. يتضمن ذلك معلومات الاتصال الخاصة بك، البيانات الوصفية التقنية (المكالمات، الرسائل) والتفاصيل الضرورية لطلبك.",
        dataProtectionContent:
          "يتم تشفير بياناتك أثناء النقل والتخزين عند الإمكان ويتم تخزينها بشكل آمن. يتم تنفيذ تدابير تقنية وتنظيمية لمنع أي وصول غير مصرح به.",
        dataSharingContent:
          "لا نبيع بياناتك الشخصية أبداً. نشارك فقط المعلومات الضرورية مع مقدمي خدمات معروفين (المدفوعات، الهاتف، الاستضافة) لتقديم الخدمة المطلوبة.",
        socialMediaApiContent:
          "تستخدم أداتنا الداخلية 'Mission Control' واجهات برمجة التطبيقات الرسمية لـ Meta (Facebook, Instagram, Threads) و LinkedIn فقط لنشر المحتوى على حسابات أعمال SOS-Expat الخاصة بنا. نحن لا نجمع بيانات مستخدمي Meta لأغراض تجارية. يتم تخزين التعليقات المستلمة على منشوراتنا مؤقتاً للسماح لفريقنا التحريري بالرد، ثم يتم إخفاء هويتها بعد 90 يوماً. يمكنك إلغاء الوصول في أي وقت من إعدادات 'التطبيقات المتصلة' في حسابك على Facebook / Instagram / LinkedIn. لحذف بياناتك بالكامل، راجع صفحة حذف البيانات.",
        rights: [
          "الحق في الوصول إلى بياناتك",
          "الحق في التصحيح",
          "الحق في الحذف (ضمن الحدود القانونية)",
          "حق نقل البيانات",
          "الحق في الاعتراض والحد",
        ],
        contactContent:
          "لأي استفسارات أو لممارسة حقوقك، استخدم النموذج المخصص أدناه.",
        features: [
          "التشفير",
          "الشفافية",
          "التحكم من قبل المستخدم",
          "عدم إعادة بيع البيانات",
        ],
        contactCta: "نموذج الاتصال",
        editHint: "مستند قابل للتحرير من وحدة التحكم الإدارية (FR/EN/AR)",
      },

      ch: {
        title: "隐私政策",
        subtitle: "您的隐私是我们的优先事项",
        lastUpdated: "版本 2.2 – 最后更新：2025年6月16日",
        dataCollection: "数据收集",
        dataProtection: "数据保护",
        dataSharing: "数据共享",
        socialMediaApi: "社交媒体与 Meta API",
        yourRights: "您的权利",
        contact: "联系方式",
        dataCollectionContent:
          "我们仅收集提供协助服务所需的信息。这包括您的联系方式、技术元数据（通话、消息）以及处理您的请求所必需的详细信息。",
        dataProtectionContent:
          "您的数据在传输和存储时（在可能的情况下）均经过加密并安全保存。我们采取技术和组织措施以防止未经授权的访问。",
        dataSharingContent:
          "我们绝不会出售您的个人数据。我们仅与经过审核的服务提供商（支付、通信、托管）共享提供所请求服务所必需的信息。",
        socialMediaApiContent:
          "我们的内部工具 'Mission Control' 仅使用 Meta（Facebook、Instagram、Threads）和 LinkedIn 的官方 API 在我们自己的 SOS-Expat 商业账户上发布内容。我们不会出于商业目的收集 Meta 用户数据。我们出版物上收到的评论会临时存储以便我们的编辑团队回复，然后在 90 天后匿名化。您可以随时从 Facebook / Instagram / LinkedIn 账户的「已连接应用」设置中撤销访问权限。如需完全删除数据，请参阅我们的数据删除页面。",
        rights: [
          "访问权",
          "更正权",
          "删除权（在法律允许范围内）",
          "数据可携权",
          "反对与限制处理权",
        ],
        contactContent:
          "如有疑问或希望行使您的权利，请使用下方的表单。",
        features: [
          "数据加密",
          "透明性",
          "用户控制",
          "不转售数据",
        ],
        contactCta: "联系表单",
        editHint: "可从管理控制台编辑文档（英文/法文）",
      }
    }),

    []
  );

  const t = texts[selectedLanguage];

  const privacySections: PrivacySection[] = useMemo(
    () => [
      {
        icon: Eye,
        titleKey: "dataCollection",
        contentKey: "dataCollectionContent",
      },
      {
        icon: Lock,
        titleKey: "dataProtection",
        contentKey: "dataProtectionContent",
      },
      {
        icon: Users,
        titleKey: "dataSharing",
        contentKey: "dataSharingContent",
      },
      {
        icon: Globe,
        titleKey: "socialMediaApi",
        contentKey: "socialMediaApiContent",
      },
    ],
    []
  );

  // --- Firestore fetch (unchanged business logic) ---
  useEffect(() => {
    const fetchPrivacyPolicy = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const q = query(
          collection(db, "legal_documents"),
          where("type", "==", "privacy"),
          where("language", "==", selectedLanguage),
          where("isActive", "==", true),
          orderBy("updatedAt", "desc"),
          limit(1)
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const docData = doc.data() as { content?: string };
          setContent(docData.content || "");
        } else {
          setContent("");
        }
      } catch (err) {
        console.error("Error fetching privacy policy:", err);
        setError(
          selectedLanguage === "fr" ? "Échec du chargement" : "Failed to load"
        );
        setContent("");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrivacyPolicy();
  }, [selectedLanguage]);

  const handleLanguageChange = (
    newLang: "fr" | "en" | "es" | "de" | "ru" | "hi" | "ch"
  ) => {
    setSelectedLanguage(newLang);
  };

  // ----- Markdown → UI (design only) -----
  const parseMarkdownContent = (text: string) => {
    const lines = text.split("\n");
    const elements: JSX.Element[] = [];
    let key = 0;

    for (const raw of lines) {
      const line = raw ?? "";
      if (!line.trim()) continue;

      if (line.trim() === "---") {
        elements.push(
          <hr key={key++} className="my-8 border-t-2 border-gray-200" />
        );
        continue;
      }

      if (line.startsWith("# ")) {
        elements.push(
          <h1
            key={key++}
            className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 mt-8 border-b-2 border-blue-500 pb-4"
          >
            {line.substring(2).replace(/\*\*/g, "")}
          </h1>
        );
        continue;
      }

      if (line.startsWith("## ")) {
        const title = line.substring(3).trim();
        const match = title.match(/^(\d+)\.\s*(.*)$/);
        if (match) {
          elements.push(
            <h2
              id={`section-${match[1]}`}
              key={key++}
              className="scroll-mt-28 text-xl sm:text-2xl font-bold text-gray-900 mt-10 mb-6 flex items-center gap-3"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold shadow-lg">
                {match[1]}
              </span>
              <span>{match[2].replace(/\*\*/g, "")}</span>
            </h2>
          );
        } else {
          elements.push(
            <h2
              key={key++}
              className="text-xl sm:text-2xl font-bold text-gray-900 mt-10 mb-6"
            >
              {title.replace(/\*\*/g, "")}
            </h2>
          );
        }
        continue;
      }

      if (line.startsWith("### ")) {
        elements.push(
          <h3
            key={key++}
            className="text-lg font-bold text-gray-800 mt-6 mb-4 border-l-4 border-blue-500 pl-4"
          >
            {line.substring(4).replace(/\*\*/g, "")}
          </h3>
        );
        continue;
      }

      // Numbered points (2.1, 3.2, etc.)
      const numbered = line.match(/^(\d+\.\d+\.?)\s+(.*)$/);
      if (numbered) {
        const num = numbered[1];
        const inner = numbered[2].replace(
          /\*\*(.*?)\*\*/g,
          '<strong class="font-semibold text-gray-900">$1</strong>'
        );
        elements.push(
          <div
            key={key++}
            className="bg-gray-50 border-l-4 border-blue-500 rounded-r-xl p-5 my-4 hover:bg-gray-100 transition-colors"
          >
            <p className="text-gray-800 leading-relaxed">
              <span className="font-bold text-blue-600 mr-2">{num}</span>
              <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(inner) }} />
            </p>
          </div>
        );
        continue;
      }

      // SPECIAL: contact line -> nice card WITHOUT raw URL & without extra heading
      if (
        line.toLowerCase().includes("https://sos-expat.com/contact") ||
        line.toLowerCase().includes("/contact")
      ) {
        elements.push(
          <div
            key={key++}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 sm:p-8 my-8 shadow-lg"
            role="group"
            aria-label="Contact"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
                <Globe className="w-5 h-5" />
              </span>
              <span className="font-semibold text-gray-900">{t.contact}</span>
            </div>
            <p className="text-gray-800 leading-relaxed mb-5">
              {t.contactContent}
            </p>
            <a
              href="https://sos-expat.com/contact"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 hover:shadow-lg"
            >
              <Globe className="w-5 h-5" />
              {t.contactCta}
            </a>
          </div>
        );
        continue;
      }

      if (line.startsWith("**") && line.endsWith("**")) {
        elements.push(
          <div
            key={key++}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 my-6"
          >
            <p className="font-bold text-gray-900 text-lg">
              {line.slice(2, -2)}
            </p>
          </div>
        );
        continue;
      }

      const formatted = line
        .replace(
          /\*\*(.*?)\*\*/g,
          '<strong class="font-semibold text-gray-900">$1</strong>'
        )
        .replace(/\*([^*]+)\*/g, '<em class="italic text-gray-700">$1</em>');

      elements.push(
        <p
          key={key++}
          className="mb-4 text-gray-800 leading-relaxed text-base"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatted) }}
        />
      );
    }

    return elements;
  };

  const defaultHi = `
# ${t.title}

**${t.lastUpdated}**

**डेटा नियंत्रक**: WorldExpat OÜ (एस्टोनियाई कंपनी), तालिन, एस्टोनिया। लागू कानूनी ढांचा: **विनियमन (EU) 2016/679 (GDPR)**।

---

## 1. ${t.dataCollection}
हम केवल **सख्ती से आवश्यक** डेटा एकत्र करते हैं:
- **पहचान और संपर्क**: नाम, ईमेल, फोन, देश;
- **भुगतान डेटा**: **PCI-DSS** प्रमाणित प्रदाताओं (Stripe और PayPal) द्वारा **विशेष रूप से** संसाधित। **SOS Expat किसी भी कार्ड डेटा को संग्रहीत नहीं करता**;
- **कॉल मेटाडेटा**: समय, अवधि (कॉल **सामग्री डिफ़ॉल्ट रूप से रिकॉर्ड नहीं की जाती**);
- **कनेक्शन डेटा**: IP, सत्र, user-agent;
- **अनुरोध सामग्री**।

## 2. ${t.dataProtection}
**ट्रांज़िट** (TLS 1.2+) और **स्टोरेज** में एन्क्रिप्शन जहां संभव हो। **उल्लंघन की 72 घंटे के भीतर अधिसूचना** (GDPR अनु. 33)।

## 3. ${t.dataSharing}

### 3.1. कोई पुनर्विक्रय नहीं
कोई **डेटा व्यापार** नहीं।

### 3.2. प्रोसेसर (GDPR अनु. 28)
अधिकृत प्रोसेसरों की सूची, **डेटा प्रोसेसिंग समझौतों (DPA)** के तहत:
- **Stripe Payments Europe Ltd.** — भुगतान, KYC/AML — आयरलैंड (EU) + USA
- **PayPal (Europe) S.à r.l.** — वैकल्पिक भुगतान, अंतरराष्ट्रीय स्थानांतरण — लक्ज़मबर्ग (EU)
- **Twilio Inc.** — टेलीफोनी, IVR, SMS — USA (DPF)
- **Google Cloud / Firebase (Google Ireland)** — होस्टिंग, डेटाबेस, प्रमाणीकरण — EU + USA
- **Cloudflare Inc.** — CDN, anti-DDoS, सुरक्षा — वैश्विक (DPF)
- **Zoho Corporation B.V.** — व्यावसायिक मेल, समर्थन — EU / भारत

सभी प्रदाता **EU मानक संविदात्मक खंडों** या **Data Privacy Framework** के तहत हैं।

## 4. ${t.yourRights}
- ${t.rights[0]}
- ${t.rights[1]}
- ${t.rights[2]}
- ${t.rights[3]}
- ${t.rights[4]}

**अवधारण**: अनुबंधात्मक संबंध की अवधि + वैधानिक सीमा अवधि (5-10 वर्ष)।

---

## 5. ${t.contact}
https://sos-expat.com/contact
`;

  // --- Default bilingual content (shown if no Firestore content) ---
  const defaultFr = `
# Politique de confidentialité

**${t.lastUpdated}**

**Responsable de traitement** : WorldExpat OÜ (société de droit estonien), Tallinn, Estonie. Cadre juridique applicable : **Règlement (UE) 2016/679 (RGPD / GDPR)** et législations locales équivalentes.

---

## 1. ${t.dataCollection}
Nous collectons les **données strictement nécessaires** à la fourniture de nos services :
- **Identité et contact** : nom, prénom, email, téléphone, pays de résidence ;
- **Données de paiement** : traitées **exclusivement** par nos prestataires de paiement certifiés **PCI-DSS** (Stripe et PayPal). **SOS Expat ne stocke aucune donnée de carte bancaire** ;
- **Métadonnées d'appel** : horodatage, durée, identifiants techniques (les **contenus** d'appel ne sont **pas enregistrés** par défaut) ;
- **Données de connexion** : adresse IP, identifiant de session, user-agent, journaux d'accès ;
- **Contenu de la demande** : objet et description fournis par l'utilisateur.

## 2. ${t.dataProtection}
Chiffrement **en transit** (TLS 1.2+) et **au repos** lorsque possible. Mesures techniques et organisationnelles renforcées (contrôle d'accès, audits, journalisation, principe de minimisation). **Notification des violations sous 72h** conformément à l'article 33 RGPD.

## 3. ${t.dataSharing}

### 3.1. Aucune revente
Aucun **commerce des données**. Aucune cession à des tiers à des fins publicitaires.

### 3.2. Sous-traitants (article 28 RGPD)
Nous partageons strictement le minimum nécessaire avec les sous-traitants suivants, sous **contrats de sous-traitance (DPA)** conformes au RGPD :

| Sous-traitant | Finalité | Localisation des données | Garanties |
|---|---|---|---|
| **Stripe Payments Europe Ltd.** | Encaissement des paiements, KYC/LCB-FT, versements aux prestataires | Irlande (UE) + USA | Clauses contractuelles types UE, certification PCI-DSS niveau 1 |
| **PayPal (Europe) S.à r.l. et Cie, S.C.A.** | Paiement alternatif client, versements internationaux aux prestataires | Luxembourg (UE) | Clauses contractuelles types UE, certification PCI-DSS |
| **Twilio Inc.** | Mise en relation téléphonique (acheminement d'appel, IVR, SMS, conférence) | USA (DPF Data Privacy Framework) | DPF, clauses contractuelles types UE |
| **Google Cloud / Firebase (Google Ireland Ltd.)** | Hébergement applicatif, base de données, authentification, fonctions serverless | UE (europe-west1, europe-west3) + USA (us-central1, nam7) | Clauses contractuelles types UE, certifications ISO 27001/27017/27018, SOC 2 |
| **Cloudflare Inc.** | CDN, protection anti-DDoS, sécurité applicative, edge cache | Mondial (DPF) | DPF, clauses contractuelles types UE |
| **Zoho Corporation B.V.** | Messagerie professionnelle, support, transactionnel | UE / Inde | Clauses contractuelles types UE |

La liste ci-dessus est **mise à jour** en cas de changement matériel. Aucun nouveau sous-traitant n'est ajouté sans information préalable.

### 3.3. Transferts internationaux
Les transferts de données hors EEE sont encadrés par des **clauses contractuelles types** approuvées par la Commission européenne, des **décisions d'adéquation**, ou le **Data Privacy Framework** (USA).

## 4. ${t.yourRights}
- ${t.rights[0]}
- ${t.rights[1]}
- ${t.rights[2]}
- ${t.rights[3]}
- ${t.rights[4]}

**Conservation** : données conservées pendant la durée de la relation contractuelle, puis archivées pendant les durées légales de prescription (généralement 5 à 10 ans selon le type de donnée et l'obligation légale applicable). Les **journaux d'acceptation des CGU** sont conservés 10 ans (preuve eIDAS).

---

## 5. ${t.contact}
https://sos-expat.com/contact
`;

  const defaultEn = `
# ${t.title}

**${t.lastUpdated}**

**Data Controller**: WorldExpat OÜ (Estonian company), Tallinn, Estonia. Applicable legal framework: **Regulation (EU) 2016/679 (GDPR)** and equivalent local laws.

---

## 1. ${t.dataCollection}
We collect only **strictly necessary** data to deliver our services:
- **Identity & contact**: first name, last name, email, phone, country of residence;
- **Payment data**: processed **exclusively** by our **PCI-DSS certified** payment providers (Stripe and PayPal). **SOS Expat does NOT store any card data**;
- **Call metadata**: timestamps, duration, technical identifiers (call **contents are NOT recorded by default**);
- **Connection data**: IP address, session ID, user-agent, access logs;
- **Request content**: subject and description provided by the user.

## 2. ${t.dataProtection}
Encryption **in transit** (TLS 1.2+) and **at rest** where possible. Strong technical and organizational safeguards (access controls, audits, logging, data minimization). **Breach notification within 72h** as required by GDPR article 33.

## 3. ${t.dataSharing}

### 3.1. No resale
No **data trading**. No sharing with third parties for advertising purposes.

### 3.2. Processors (GDPR article 28)
We share strictly the minimum necessary with the following processors, under **Data Processing Agreements (DPAs)** compliant with GDPR:

| Processor | Purpose | Data location | Safeguards |
|---|---|---|---|
| **Stripe Payments Europe Ltd.** | Payment collection, KYC/AML, payouts to providers | Ireland (EU) + USA | EU SCCs, PCI-DSS Level 1 |
| **PayPal (Europe) S.à r.l. et Cie, S.C.A.** | Alternative client payment, international payouts | Luxembourg (EU) | EU SCCs, PCI-DSS |
| **Twilio Inc.** | Phone connection (call routing, IVR, SMS, conference) | USA (DPF Data Privacy Framework) | DPF, EU SCCs |
| **Google Cloud / Firebase (Google Ireland Ltd.)** | Application hosting, database, authentication, serverless functions | EU (europe-west1, europe-west3) + USA (us-central1, nam7) | EU SCCs, ISO 27001/27017/27018, SOC 2 |
| **Cloudflare Inc.** | CDN, anti-DDoS, application security, edge cache | Global (DPF) | DPF, EU SCCs |
| **Zoho Corporation B.V.** | Business email, support, transactional messages | EU / India | EU SCCs |

This list is **updated** in case of material change. No new processor is added without prior notice.

### 3.3. International transfers
Transfers of data outside the EEA are governed by **EU Standard Contractual Clauses** approved by the European Commission, **adequacy decisions**, or the **Data Privacy Framework** (USA).

## 4. ${t.yourRights}
- ${t.rights[0]}
- ${t.rights[1]}
- ${t.rights[2]}
- ${t.rights[3]}
- ${t.rights[4]}

**Retention**: data is kept for the duration of the contractual relationship, then archived for statutory limitation periods (generally 5 to 10 years depending on data type and applicable legal obligation). **Terms acceptance logs** are kept for 10 years (eIDAS evidence).

---

## 5. ${t.contact}
https://sos-expat.com/contact
`;

const defaultCh = `
# ${t.title}

**${t.lastUpdated}**

**数据控制者**：WorldExpat OÜ（爱沙尼亚公司），塔林，爱沙尼亚。适用法律框架：**欧盟法规 2016/679 (GDPR)**。

---

## 1. ${t.dataCollection}
我们仅收集**严格必要**的数据：
- **身份和联系方式**：姓名、电子邮件、电话、国家；
- **支付数据**：**仅由** **PCI-DSS** 认证的提供商（Stripe 和 PayPal）处理。**SOS Expat 不存储任何银行卡数据**；
- **通话元数据**：时间戳、时长（通话**内容默认不录制**）；
- **连接数据**：IP、会话、user-agent；
- **请求内容**。

## 2. ${t.dataProtection}
**传输中**（TLS 1.2+）和**静态存储时**加密（在可能的情况下）。**违规通知 72 小时内**（GDPR 第 33 条）。

## 3. ${t.dataSharing}

### 3.1. 不进行转售
不进行**数据交易**。

### 3.2. 处理方（GDPR 第 28 条）
根据**数据处理协议 (DPA)** 授权的处理方列表：
- **Stripe Payments Europe Ltd.** — 支付、KYC/AML — 爱尔兰（欧盟）+ 美国
- **PayPal (Europe) S.à r.l.** — 替代支付、国际转账 — 卢森堡（欧盟）
- **Twilio Inc.** — 电话、IVR、SMS — 美国 (DPF)
- **Google Cloud / Firebase (Google Ireland)** — 主机托管、数据库、身份验证 — 欧盟 + 美国
- **Cloudflare Inc.** — CDN、anti-DDoS、安全 — 全球 (DPF)
- **Zoho Corporation B.V.** — 商务邮件、支持 — 欧盟 / 印度

所有提供商均受**欧盟标准合同条款**或**数据隐私框架**约束。

## 4. ${t.yourRights}
- ${t.rights[0]}
- ${t.rights[1]}
- ${t.rights[2]}
- ${t.rights[3]}
- ${t.rights[4]}

**保留期**：合同关系期间 + 法定时效期间（5-10 年）。

---

## 5. ${t.contact}
https://sos-expat.com/contact
`

const defaultEs = `
# Política de Privacidad

**${t.lastUpdated}**

**Responsable del tratamiento**: WorldExpat OÜ (sociedad estonia), Tallin, Estonia. Marco legal aplicable: **Reglamento (UE) 2016/679 (RGPD / GDPR)**.

---

## 1. ${t.dataCollection}
Solo recopilamos datos **estrictamente necesarios** para proporcionar nuestros servicios:
- **Identidad y contacto**: nombre, email, teléfono, país;
- **Datos de pago**: procesados **exclusivamente** por nuestros proveedores certificados **PCI-DSS** (Stripe y PayPal). **SOS Expat no almacena datos de tarjetas**;
- **Metadatos de llamada**: horarios, duración, identificadores técnicos (los **contenidos** no se graban por defecto);
- **Datos de conexión**: IP, sesión, user-agent;
- **Contenido de la solicitud**.

## 2. ${t.dataProtection}
Cifrado **en tránsito** (TLS 1.2+) y **en reposo** cuando sea posible. **Notificación de violaciones en 72h** (RGPD art. 33).

## 3. ${t.dataSharing}

### 3.1. Sin reventa
Sin **comercio de datos**.

### 3.2. Subcontratistas (RGPD art. 28)
Lista de subcontratistas autorizados, sujetos a **acuerdos de tratamiento (DPA)**:
- **Stripe Payments Europe Ltd.** — pagos, KYC/AML — Irlanda (UE) + EE.UU.
- **PayPal (Europe) S.à r.l.** — pagos alternativos, transferencias internacionales — Luxemburgo (UE)
- **Twilio Inc.** — telefonía, IVR, SMS — EE.UU. (DPF)
- **Google Cloud / Firebase (Google Ireland)** — hosting, base de datos, autenticación — UE + EE.UU.
- **Cloudflare Inc.** — CDN, anti-DDoS, seguridad — global (DPF)
- **Zoho Corporation B.V.** — correo electrónico, soporte — UE / India

Todos los proveedores firmaron **Cláusulas Contractuales Tipo de la UE** o están bajo **Data Privacy Framework**.

## 4. ${t.yourRights}
- ${t.rights[0]}
- ${t.rights[1]}
- ${t.rights[2]}
- ${t.rights[3]}
- ${t.rights[4]}

**Conservación**: durante la relación contractual + plazos de prescripción legales (5-10 años).

---

## 5. ${t.contact}
https://sos-expat.com/contact
`;

const defaultDe = `
# Datenschutzerklärung

**${t.lastUpdated}**

**Verantwortlicher**: WorldExpat OÜ (estnische Gesellschaft), Tallinn, Estland. Geltender Rechtsrahmen: **Verordnung (EU) 2016/679 (DSGVO / GDPR)**.

---

## 1. ${t.dataCollection}
Wir erheben nur **streng notwendige** Daten:
- **Identität & Kontakt**: Name, E-Mail, Telefon, Land;
- **Zahlungsdaten**: ausschließlich von **PCI-DSS-zertifizierten** Anbietern (Stripe und PayPal) verarbeitet. **SOS Expat speichert KEINE Kartendaten**;
- **Anrufmetadaten**: Zeitstempel, Dauer (Anrufinhalte werden **nicht** standardmäßig aufgezeichnet);
- **Verbindungsdaten**: IP, Sitzung, User-Agent;
- **Anfrageinhalt**.

## 2. ${t.dataProtection}
Verschlüsselung **in Transit** (TLS 1.2+) und **at Rest** wo möglich. **Meldung von Datenschutzverletzungen innerhalb von 72h** (DSGVO Art. 33).

## 3. ${t.dataSharing}

### 3.1. Kein Verkauf
Kein **Datenhandel**.

### 3.2. Auftragsverarbeiter (DSGVO Art. 28)
Liste autorisierter Auftragsverarbeiter unter **Datenverarbeitungsverträgen (DPA)**:
- **Stripe Payments Europe Ltd.** — Zahlungen, KYC/AML — Irland (EU) + USA
- **PayPal (Europe) S.à r.l.** — alternative Zahlungen, internationale Auszahlungen — Luxemburg (EU)
- **Twilio Inc.** — Telefonie, IVR, SMS — USA (DPF)
- **Google Cloud / Firebase (Google Ireland)** — Hosting, Datenbank, Auth — EU + USA
- **Cloudflare Inc.** — CDN, Anti-DDoS, Sicherheit — global (DPF)
- **Zoho Corporation B.V.** — Geschäftsmail, Support — EU / Indien

Alle Anbieter unter **EU-Standardvertragsklauseln** oder **Data Privacy Framework**.

## 4. ${t.yourRights}
- ${t.rights[0]}
- ${t.rights[1]}
- ${t.rights[2]}
- ${t.rights[3]}
- ${t.rights[4]}

**Aufbewahrung**: während der Vertragsbeziehung + gesetzliche Verjährungsfristen (5–10 Jahre).

---

## 5. ${t.contact}
https://sos-expat.com/contact
`;

const defaultPt = `
# Política de Privacidade

**${t.lastUpdated}**

**Responsável pelo tratamento**: WorldExpat OÜ (sociedade estoniana), Tallinn, Estônia. Marco legal aplicável: **Regulamento (UE) 2016/679 (RGPD / GDPR)**.

---

## 1. ${t.dataCollection}
Coletamos apenas os dados **estritamente necessários**:
- **Identidade e contato**: nome, e-mail, telefone, país;
- **Dados de pagamento**: processados **exclusivamente** por provedores certificados **PCI-DSS** (Stripe e PayPal). **SOS Expat NÃO armazena dados de cartão**;
- **Metadados de chamada**: horários, duração (os **conteúdos** não são gravados por padrão);
- **Dados de conexão**: IP, sessão, user-agent;
- **Conteúdo da solicitação**.

## 2. ${t.dataProtection}
Criptografia **em trânsito** (TLS 1.2+) e **em repouso** quando possível. **Notificação de violações em 72h** (RGPD art. 33).

## 3. ${t.dataSharing}

### 3.1. Sem revenda
Sem **comércio de dados**.

### 3.2. Subcontratantes (RGPD art. 28)
Lista de subcontratantes autorizados, sob **Acordos de Tratamento (DPA)**:
- **Stripe Payments Europe Ltd.** — pagamentos, KYC/AML — Irlanda (UE) + EUA
- **PayPal (Europe) S.à r.l.** — pagamentos alternativos, transferências internacionais — Luxemburgo (UE)
- **Twilio Inc.** — telefonia, IVR, SMS — EUA (DPF)
- **Google Cloud / Firebase (Google Ireland)** — hospedagem, banco de dados, autenticação — UE + EUA
- **Cloudflare Inc.** — CDN, anti-DDoS, segurança — global (DPF)
- **Zoho Corporation B.V.** — e-mail corporativo, suporte — UE / Índia

Todos os provedores assinaram **Cláusulas Contratuais Padrão da UE** ou estão sob **Data Privacy Framework**.

## 4. ${t.yourRights}
- ${t.rights[0]}
- ${t.rights[1]}
- ${t.rights[2]}
- ${t.rights[3]}
- ${t.rights[4]}

**Conservação**: durante a relação contratual + prazos de prescrição legais (5-10 anos).

---

## 5. ${t.contact}
https://sos-expat.com/contact
`;

const defaultRu = `
# Политика конфиденциальности

**${t.lastUpdated}**

**Контролёр данных**: WorldExpat OÜ (эстонская компания), Таллин, Эстония. Применимая правовая база: **Регламент (ЕС) 2016/679 (GDPR / РОПД)**.

---

## 1. ${t.dataCollection}
Мы собираем только **строго необходимые** данные:
- **Идентификация и контакт**: имя, email, телефон, страна;
- **Платёжные данные**: обрабатываются **исключительно** сертифицированными **PCI-DSS** провайдерами (Stripe и PayPal). **SOS Expat НЕ хранит данные банковских карт**;
- **Метаданные звонков**: время, длительность (**содержание** не записывается по умолчанию);
- **Данные подключения**: IP, сессия, user-agent;
- **Содержание запроса**.

## 2. ${t.dataProtection}
Шифрование **при передаче** (TLS 1.2+) и **при хранении** где возможно. **Уведомление о нарушениях в течение 72ч** (GDPR ст. 33).

## 3. ${t.dataSharing}

### 3.1. Без перепродажи
Никакой **торговли данными**.

### 3.2. Субподрядчики (GDPR ст. 28)
Список авторизованных субподрядчиков по **соглашениям об обработке данных (DPA)**:
- **Stripe Payments Europe Ltd.** — платежи, KYC/AML — Ирландия (ЕС) + США
- **PayPal (Europe) S.à r.l.** — альтернативные платежи, международные переводы — Люксембург (ЕС)
- **Twilio Inc.** — телефония, IVR, SMS — США (DPF)
- **Google Cloud / Firebase (Google Ireland)** — хостинг, БД, аутентификация — ЕС + США
- **Cloudflare Inc.** — CDN, анти-DDoS, безопасность — глобально (DPF)
- **Zoho Corporation B.V.** — корпоративная почта, поддержка — ЕС / Индия

Все провайдеры под **Стандартными договорными положениями ЕС** или **Data Privacy Framework**.

## 4. ${t.yourRights}
- ${t.rights[0]}
- ${t.rights[1]}
- ${t.rights[2]}
- ${t.rights[3]}
- ${t.rights[4]}

**Хранение**: на время действия договора + установленные законом сроки давности (5–10 лет).

---

## 5. ${t.contact}
https://sos-expat.com/contact
`;

const defaultAr = `
# سياسة الخصوصية

**${t.lastUpdated}**

**المسؤول عن المعالجة**: WorldExpat OÜ (شركة إستونية)، تالين، إستونيا. الإطار القانوني المطبق: **اللائحة (الاتحاد الأوروبي) 2016/679 (اللائحة العامة لحماية البيانات / GDPR)**.

---

## 1. ${t.dataCollection}
نجمع فقط البيانات **الضرورية للغاية**:
- **الهوية والاتصال**: الاسم، البريد الإلكتروني، الهاتف، البلد؛
- **بيانات الدفع**: تتم معالجتها **حصرياً** من قبل مزودين معتمدين **PCI-DSS** (Stripe و PayPal). **SOS Expat لا يخزن أي بيانات بطاقات**؛
- **بيانات تعريف المكالمة**: الطوابع الزمنية، المدة (**محتويات** المكالمات لا تُسجَّل بشكل افتراضي)؛
- **بيانات الاتصال**: عنوان IP، الجلسة، user-agent؛
- **محتوى الطلب**.

## 2. ${t.dataProtection}
تشفير **أثناء النقل** (TLS 1.2+) و**أثناء التخزين** حيثما أمكن. **الإخطار بالاختراقات خلال 72 ساعة** (GDPR م. 33).

## 3. ${t.dataSharing}

### 3.1. لا إعادة بيع
لا **تجارة في البيانات**.

### 3.2. المعالجون من الباطن (GDPR م. 28)
قائمة المعالجين المعتمدين بموجب **اتفاقيات معالجة البيانات (DPA)**:
- **Stripe Payments Europe Ltd.** — المدفوعات، KYC/AML — أيرلندا (الاتحاد الأوروبي) + الولايات المتحدة
- **PayPal (Europe) S.à r.l.** — مدفوعات بديلة، تحويلات دولية — لوكسمبورغ (الاتحاد الأوروبي)
- **Twilio Inc.** — الاتصالات الهاتفية، IVR، SMS — الولايات المتحدة (DPF)
- **Google Cloud / Firebase (Google Ireland)** — الاستضافة، قاعدة البيانات، المصادقة — الاتحاد الأوروبي + الولايات المتحدة
- **Cloudflare Inc.** — CDN، مكافحة DDoS، الأمن — عالمي (DPF)
- **Zoho Corporation B.V.** — البريد المهني، الدعم — الاتحاد الأوروبي / الهند

جميع المزودين بموجب **البنود التعاقدية النموذجية للاتحاد الأوروبي** أو **إطار خصوصية البيانات**.

## 4. ${t.yourRights}
- ${t.rights[0]}
- ${t.rights[1]}
- ${t.rights[2]}
- ${t.rights[3]}
- ${t.rights[4]}

**الاحتفاظ**: طوال مدة العلاقة التعاقدية + فترات التقادم القانونية (5-10 سنوات).

---

## 5. ${t.contact}
https://sos-expat.com/contact
`;

  // const defaultContent = selectedLanguage === "fr" ? defaultFr : defaultEn;

  const defaultContent =
  selectedLanguage === "fr"
    ? defaultFr
    : selectedLanguage === "es"
    ? defaultEs
    : selectedLanguage === "de"
    ? defaultDe
    : selectedLanguage === "ru"
    ? defaultRu
    : selectedLanguage === "pt"
    ? defaultPt
    : selectedLanguage === "ar"
    ? defaultAr
    : selectedLanguage === "hi"
    ? defaultHi
    : selectedLanguage === "ch"
    ? defaultCh
    : defaultEn;

  return (
    <Layout>
      <SEOHead
        title={`${texts[selectedLanguage]?.title || "Privacy Policy"} - SOS Expat`}
        description={`${texts[selectedLanguage]?.subtitle || "Your privacy is our priority"} - SOS Expat`}
        ogType="website"
        contentType="WebPage"
      />
      <BreadcrumbSchema items={[{ name: 'Home', url: '/' }, { name: t.title || 'Privacy Policy' }]} />
      <main className="min-h-screen bg-gray-950">
        {/* HERO */}
        <section className="relative pt-20 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-indigo-500/10 pointer-events-none" />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-6">
            {/* Top bar: last updated + language toggle */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full pl-5 pr-4 py-2.5 border border-white/20 text-white">
                <Clock className="w-4 h-4 text-indigo-300" />
                <span className="text-sm font-semibold">{t.lastUpdated}</span>
              </div>

              {/* <div className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-1">
                <button
                  type="button"
                  onClick={() => handleLanguageChange("fr")}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    selectedLanguage === "fr"
                      ? "bg-white text-gray-900"
                      : "text-white hover:bg-white/10"
                  }`}
                  aria-pressed={selectedLanguage === "fr"}
                >
                  <Languages className="w-4 h-4" />
                  FR
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange("en")}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    selectedLanguage === "en"
                      ? "bg-white text-gray-900"
                      : "text-white hover:bg-white/10"
                  }`}
                  aria-pressed={selectedLanguage === "en"}
                >
                  <Languages className="w-4 h-4" />
                  EN
                </button>
              </div> */}
            </div>

            <header className="text-center">
              <div className="flex justify-center mb-6">
                <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <Shield className="w-12 h-12 text-white" />
                </div>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black mb-4 leading-tight">
                <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                  {t.title}
                </span>
              </h1>
              <p className="text-lg sm:text-2xl text-gray-300 max-w-3xl mx-auto">
                {t.subtitle}
              </p>

              {/* Feature chips */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-white/90">
                {[
                  {
                    icon: <Lock className="w-6 h-6" />,
                    text: t.features[0],
                    gradient: "from-emerald-500 to-green-500",
                  },
                  {
                    icon: <Check className="w-6 h-6" />,
                    text: t.features[1],
                    gradient: "from-blue-500 to-indigo-500",
                  },
                  {
                    icon: <Users className="w-6 h-6" />,
                    text: t.features[2],
                    gradient: "from-yellow-500 to-orange-500",
                  },
                  {
                    icon: <Globe className="w-6 h-6" />,
                    text: t.features[3],
                    gradient: "from-purple-500 to-pink-500",
                  },
                ].map((f, i) => (
                  <div
                    key={i}
                    className="group flex items-center gap-3 p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.01]"
                  >
                    <span
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r ${f.gradient} text-white`}
                    >
                      {f.icon}
                    </span>
                    <span className="font-semibold">{f.text}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-center">
                <a
                  href="https://sos-expat.com/contact"
                  className="group inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold border-2 border-blue-400/50 hover:scale-105 transition-all"
                >
                  <Globe className="w-5 h-5" />
                  <span>{t.contactCta}</span>
                </a>
              </div>
            </header>
          </div>
        </section>

        {/* CONTENT */}
        <section className="py-12 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-5xl mx-auto px-6">
            <article className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-10 shadow-sm">
              {isLoading ? (
                <div className="space-y-4" aria-live="polite" aria-busy="true">
                  <div className="h-8 w-2/3 bg-gray-200 rounded-xl animate-pulse" />
                  <div className="h-6 w-1/2 bg-gray-200 rounded-xl animate-pulse" />
                  <div className="h-5 w-full bg-gray-200 rounded-xl animate-pulse" />
                  <div className="h-5 w-11/12 bg-gray-200 rounded-xl animate-pulse" />
                  <div className="h-5 w-10/12 bg-gray-200 rounded-xl animate-pulse" />
                  <div className="h-5 w-9/12 bg-gray-200 rounded-xl animate-pulse" />
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">{error}</p>
                  <p className="text-gray-600">
                    {selectedLanguage === "fr"
                      ? "Affichage du contenu par défaut"
                      : "Showing default content"}
                  </p>
                </div>
              ) : (
                <div className="prose max-w-none">
                  {content ? (
                    <div>{parseMarkdownContent(content)}</div>
                  ) : (
                    <div>{parseMarkdownContent(defaultContent)}</div>
                  )}
                </div>
              )}

              {/* Hint admin */}
              <p className="mt-6 text-sm text-gray-500 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                {t.editHint}
              </p>
            </article>

            {/* Quick sections (static summary) */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              {privacySections.map((section, idx) => {
                const Icon = section.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm"
                  >
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white mb-4">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">
                      {t[section.titleKey] as string}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {t[section.contentKey] as string}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default PrivacyPolicy;
