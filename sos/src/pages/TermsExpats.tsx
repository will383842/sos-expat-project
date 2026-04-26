import React, { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { Link } from "react-router-dom";
import {
  Users,
  FileText,
  Shield,
  Globe,
  Clock,
  ArrowRight,
  Heart,
  UserCheck,
  DollarSign,
  Languages,
  Sparkles,
} from "lucide-react";
import Layout from "../components/layout/Layout";
import SEOHead from "../components/layout/SEOHead";
import BreadcrumbSchema from "../components/seo/BreadcrumbSchema";
import { useApp } from "../contexts/AppContext";
import { useLocalePath } from "../multilingual-system";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Important :
 * - Logique métier conservée (Firestore, parsing, sélection langue via useApp).
 * - Design refondu pour matcher Home (gradients, cards, badges, CTA), mobile-first.
 * - 100% éditable depuis l'admin (collection `legal_documents`).
 * - Aucun `any`.
 */

const TermsExpats: React.FC = () => {
  const { language } = useApp();
  const getLocalePath = useLocalePath();

  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedLanguage, setSelectedLanguage] = useState<
    "fr" | "en" | "es" | "de" | "ru" | "hi" | "ch" | "pt" | "ar"
  >(
    (language as
      | "fr"
      | "en"
      | "es"
      | "de"
      | "ru"
      | "hi"
      | "ch"
      | "pt"
      | "ar") || "fr"
  );

  useEffect(() => {
    if (language) {
      setSelectedLanguage(
        language as "fr" | "en" | "es" | "de" | "ru" | "hi" | "ch" | "pt" | "ar"
      );
    }
  }, [language]);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setIsLoading(true);
        const q = query(
          collection(db, "legal_documents"),
          where("type", "==", "terms_expats"),
          where("language", "==", selectedLanguage),
          where("isActive", "==", true),
          orderBy("updatedAt", "desc"),
          limit(1)
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          setContent((doc.data() as { content: string }).content);
        } else {
          setContent("");
        }
      } catch (error) {
        console.error("Error fetching terms:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTerms();
  }, [selectedLanguage]);

  const translations = {
    fr: {
      title: "CGU Expatriés Aidants",
      subtitle: "Conditions générales d'utilisation pour les expatriés aidants",
      lastUpdated: "Version 3.2 – Dernière mise à jour : 26 avril 2026",
      loading: "Chargement...",
      joinNetwork: "Rejoindre le réseau",
      trustedByHelpers: "Déjà 1K+ expatriés aidants nous font confiance",
      keyFeatures: "Points clés",
      features: [
        "Paiement garanti sous 7 jours",
        "Support technique 24/7",
        "Interface mobile optimisée",
        "Utilisateurs vérifiés",
      ],
      languageToggle: "Changer de langue",
      sections: {
        definitions: "Définitions",
        scope: "Objet, champ et acceptation",
        status: "Statut de l'Expatrié Aidant – Conformité et responsabilités",
        account: "Compte, vérifications et sécurité",
        rules: "Règles d'usage – Qualité, interdits, non-contournement",
        relationship: "Relation Aidant–Utilisateur (hors Plateforme)",
        fees: "Frais, paiement unique et taxes",
        kyc: "Paiements – KYC/LCB-FT – Sanctions",
        data: "Données personnelles (cadre global)",
        ip: "Propriété intellectuelle",
        liability: "Garanties, responsabilité et indemnisation",
        law: "Droit applicable – Arbitrage – Juridiction estonienne",
        protection: "Clauses de protection internationale",
        misc: "Divers",
        contact: "Contact",
      },
      readyToJoin: "Prêt à rejoindre SOS Expat ?",
      readySubtitle:
        "Aidez des expatriés et développez votre activité de conseil.",
      startNow: "Commencer maintenant",
      contactUs: "Nous contacter",
      anchorTitle: "Sommaire",
      editHint: "Document éditable depuis la console admin",
      ctaHero: "Voir les experts",
      heroBadge: "Nouveau — Conditions mises à jour",
      contactForm: "Formulaire de contact",
    },
    en: {
      title: "Expat Helper Terms",
      subtitle: "Terms of Use for expatriate helpers",
      lastUpdated: "Version 3.2 – Last updated: April 26, 2026",
      loading: "Loading...",
      joinNetwork: "Join the network",
      trustedByHelpers: "Already 1K+ expat helpers trust us",
      keyFeatures: "Key features",
      features: [
        "Guaranteed payment within 7 days",
        "24/7 technical support",
        "Mobile-optimized interface",
        "Verified users",
      ],
      languageToggle: "Switch language",
      sections: {
        definitions: "Definitions",
        scope: "Purpose, Scope and Acceptance",
        status: "Helper Status – Compliance and Responsibilities",
        account: "Account, Checks and Security",
        rules: "Use Rules – Quality, Prohibited Conduct, No Circumvention",
        relationship: "Helper–User Relationship (Off-Platform)",
        fees: "Fees, Single Payment and Taxes",
        kyc: "Payments – KYC/AML – Sanctions",
        data: "Data Protection (Global Framework)",
        ip: "Intellectual Property",
        liability: "Warranties, Liability and Indemnity",
        law: "Governing Law – ICC Arbitration – Estonian Courts",
        protection: "International Protection Clauses",
        misc: "Miscellaneous",
        contact: "Contact",
      },
      readyToJoin: "Ready to join SOS Expat?",
      readySubtitle: "Help expats and develop your consulting activity.",
      startNow: "Start now",
      contactUs: "Contact us",
      anchorTitle: "Overview",
      editHint: "Document editable from the admin console",
      ctaHero: "See experts",
      heroBadge: "New — Terms updated",
      contactForm: "Contact Form",
    },
    es: {
      title: "Términos para Ayudantes Expat",
      subtitle: "Términos de uso para ayudantes de expatriados",
      lastUpdated: "Versión 3.2 – Última actualización: 26 de abril de 2026",
      loading: "Cargando...",
      joinNetwork: "Únete a la red",
      trustedByHelpers: "Ya más de 1K+ ayudantes expat confían en nosotros",
      keyFeatures: "Características clave",
      features: [
        "Pago garantizado en 7 días",
        "Soporte técnico 24/7",
        "Interfaz optimizada para móvil",
        "Usuarios verificados",
      ],
      languageToggle: "Cambiar idioma",
      sections: {
        definitions: "Definiciones",
        scope: "Objeto, alcance y aceptación",
        status: "Estado del Ayudante – Cumplimiento y responsabilidades",
        account: "Cuenta, verificaciones y seguridad",
        rules: "Reglas de uso – Calidad, prohibiciones, no evasión",
        relationship: "Relación Ayudante–Usuario (fuera de la plataforma)",
        fees: "Tarifas, pago único e impuestos",
        kyc: "Pagos – KYC/AML – Sanciones",
        data: "Datos personales (marco global)",
        ip: "Propiedad intelectual",
        liability: "Garantías, responsabilidad e indemnización",
        law: "Ley aplicable – Arbitraje – Jurisdicción estonia",
        protection: "Cláusulas de protección internacional",
        misc: "Varios",
        contact: "Contacto",
      },
      readyToJoin: "¿Listo para unirte a SOS Expat?",
      readySubtitle:
        "Ayuda a expatriados y desarrolla tu actividad de consultoría.",
      startNow: "Empezar ahora",
      contactUs: "Contáctanos",
      anchorTitle: "Resumen",
      editHint: "Documento editable desde la consola de administración",
      ctaHero: "Ver expertos",
      heroBadge: "Nuevo — Términos actualizados",
      contactForm: "Formulario de contacto",
    },
    de: {
      title: "Expat-Helfer Bedingungen",
      subtitle: "Nutzungsbedingungen für Expatriate-Helfer",
      lastUpdated: "Version 3.2 – Letzte Aktualisierung: 26. April 2026",
      loading: "Lädt...",
      joinNetwork: "Dem Netzwerk beitreten",
      trustedByHelpers: "Bereits über 1K+ Expat-Helfer vertrauen uns",
      keyFeatures: "Hauptmerkmale",
      features: [
        "Garantierte Zahlung innerhalb von 7 Tagen",
        "24/7 technischer Support",
        "Mobiloptimierte Oberfläche",
        "Verifizierte Benutzer",
      ],
      languageToggle: "Sprache wechseln",
      sections: {
        definitions: "Definitionen",
        scope: "Gegenstand, Umfang und Annahme",
        status: "Helferstatus – Compliance und Verantwortlichkeiten",
        account: "Konto, Überprüfungen und Sicherheit",
        rules: "Nutzungsregeln – Qualität, Verbote, keine Umgehung",
        relationship: "Helfer–Benutzer-Beziehung (außerhalb der Plattform)",
        fees: "Gebühren, Einzelzahlung und Steuern",
        kyc: "Zahlungen – KYC/AML – Sanktionen",
        data: "Personenbezogene Daten (globaler Rahmen)",
        ip: "Geistiges Eigentum",
        liability: "Garantien, Haftung und Entschädigung",
        law: "Anwendbares Recht – Schiedsverfahren – Estnische Gerichtsbarkeit",
        protection: "Internationale Schutzklauseln",
        misc: "Verschiedenes",
        contact: "Kontakt",
      },
      readyToJoin: "Bereit, SOS Expat beizutreten?",
      readySubtitle:
        "Helfen Sie Expats und entwickeln Sie Ihre Beratungstätigkeit.",
      startNow: "Jetzt starten",
      contactUs: "Kontaktieren Sie uns",
      anchorTitle: "Übersicht",
      editHint: "Dokument über die Admin-Konsole bearbeitbar",
      ctaHero: "Experten ansehen",
      heroBadge: "Neu — Bedingungen aktualisiert",
      contactForm: "Kontaktformular",
    },
    ru: {
      title: "Условия для помощников эмигрантов",
      subtitle: "Условия использования для помощников эмигрантов",
      lastUpdated: "Версия 3.2 – Последнее обновление: 26 апреля 2026 г.",
      loading: "Загрузка...",
      joinNetwork: "Присоединиться к сети",
      trustedByHelpers: "Уже более 1K+ помощников эмигрантов доверяют нам",
      keyFeatures: "Ключевые особенности",
      features: [
        "Гарантированная оплата в течение 7 дней",
        "Техническая поддержка 24/7",
        "Мобильно-оптимизированный интерфейс",
        "Проверенные пользователи",
      ],
      languageToggle: "Сменить язык",
      sections: {
        definitions: "Определения",
        scope: "Предмет, сфера применения и принятие",
        status: "Статус помощника – Соответствие и обязанности",
        account: "Учётная запись, проверки и безопасность",
        rules: "Правила использования – Качество, запреты, отсутствие обхода",
        relationship: "Отношения помощник–пользователь (вне платформы)",
        fees: "Сборы, единый платёж и налоги",
        kyc: "Платежи – KYC/AML – Санкции",
        data: "Персональные данные (глобальная структура)",
        ip: "Интеллектуальная собственность",
        liability: "Гарантии, ответственность и возмещение ущерба",
        law: "Применимое право – Арбитраж – Эстонская юрисдикция",
        protection: "Международные защитные положения",
        misc: "Разное",
        contact: "Контакт",
      },
      readyToJoin: "Готовы присоединиться к SOS Expat?",
      readySubtitle:
        "Помогайте эмигрантам и развивайте свою консалтинговую деятельность.",
      startNow: "Начать сейчас",
      contactUs: "Свяжитесь с нами",
      anchorTitle: "Обзор",
      editHint: "Документ редактируется из консоли администратора",
      ctaHero: "Посмотреть экспертов",
      heroBadge: "Новое — Условия обновлены",
      contactForm: "Контактная форма",
    },
    hi: {
      title: "एक्सपैट हेल्पर शर्तें",
      subtitle: "प्रवासी सहायकों के लिए उपयोग की शर्तें",
      lastUpdated: "संस्करण 3.2 – अंतिम अपडेट: 26 अप्रैल 2026",
      loading: "लोड हो रहा है...",
      joinNetwork: "नेटवर्क में शामिल हों",
      trustedByHelpers: "पहले से ही 1K+ एक्सपैट हेल्पर्स हम पर भरोसा करते हैं",
      keyFeatures: "मुख्य विशेषताएं",
      features: [
        "7 दिनों के भीतर गारंटीकृत भुगतान",
        "24/7 तकनीकी सहायता",
        "मोबाइल-अनुकूलित इंटरफ़ेस",
        "सत्यापित उपयोगकर्ता",
      ],
      languageToggle: "भाषा बदलें",
      sections: {
        definitions: "परिभाषाएँ",
        scope: "उद्देश्य, दायरा और स्वीकृति",
        status: "सहायक स्थिति – अनुपालन और जिम्मेदारियाँ",
        account: "खाता, सत्यापन और सुरक्षा",
        rules: "उपयोग नियम – गुणवत्ता, निषेध, कोई परिहार नहीं",
        relationship: "सहायक–उपयोगकर्ता संबंध (प्लेटफ़ॉर्म के बाहर)",
        fees: "शुल्क, एकल भुगतान और कर",
        kyc: "भुगतान – KYC/AML – प्रतिबंध",
        data: "व्यक्तिगत डेटा (वैश्विक ढांचा)",
        ip: "बौद्धिक संपदा",
        liability: "वारंटी, दायित्व और क्षतिपूर्ति",
        law: "लागू कानून – मध्यस्थता – एस्टोनियाई अधिकार क्षेत्र",
        protection: "अंतर्राष्ट्रीय सुरक्षा खंड",
        misc: "विविध",
        contact: "संपर्क",
      },
      readyToJoin: "SOS Expat में शामिल होने के लिए तैयार हैं?",
      readySubtitle:
        "प्रवासियों की मदद करें और अपनी परामर्श गतिविधि विकसित करें।",
      startNow: "अभी शुरू करें",
      contactUs: "हमसे संपर्क करें",
      anchorTitle: "अवलोकन",
      editHint: "व्यवस्थापक कंसोल से संपादन योग्य दस्तावेज़",
      ctaHero: "विशेषज्ञ देखें",
      heroBadge: "नया — शर्तें अपडेट की गईं",
      contactForm: "संपर्क फ़ॉर्म",
    },
    ch: {
      title: "外籍助手服务条款",
      subtitle: "外籍助手使用条款",
      lastUpdated: "版本 3.2 – 最后更新：2026年4月26日",
      loading: "加载中...",
      joinNetwork: "加入网络",
      trustedByHelpers: "已有超过 1,000 名外籍助手信任我们",
      keyFeatures: "主要功能",
      features: [
        "7 天内保证付款",
        "全天候（24/7）技术支持",
        "移动端优化界面",
        "已验证用户",
      ],
      languageToggle: "切换语言",
      sections: {
        definitions: "定义",
        scope: "目的、适用范围与接受",
        status: "助手身份 – 合规与责任",
        account: "账户、审核与安全",
        rules: "使用规则 – 质量、禁止行为与禁止规避",
        relationship: "助手与用户关系（平台外）",
        fees: "费用、单次付款与税务",
        kyc: "支付 – KYC/AML – 制裁",
        data: "数据保护（全球框架）",
        ip: "知识产权",
        liability: "保证、责任与赔偿",
        law: "适用法律 – ICC 仲裁 – 爱沙尼亚法院",
        protection: "国际保护条款",
        misc: "其他条款",
        contact: "联系方式",
      },
      readyToJoin: "准备加入 SOS Expat 吗？",
      readySubtitle: "帮助外籍人士并发展您的咨询业务。",
      startNow: "立即开始",
      contactUs: "联系我们",
      anchorTitle: "概览",
      editHint: "可从管理控制台编辑文档",
      ctaHero: "查看专家",
      heroBadge: "新内容 — 条款已更新",
      contactForm: "联系表单",
    },
    ar: {
      title: "شروط مساعدي المغتربين",
      subtitle: "شروط الاستخدام لمساعدي المغتربين",
      lastUpdated: "الإصدار 3.2 – آخر تحديث: 26 أبريل 2026",
      loading: "جارٍ التحميل...",
      joinNetwork: "انضم إلى الشبكة",
      trustedByHelpers: "يثق بنا بالفعل أكثر من 1000+ مساعد مغترب",
      keyFeatures: "الميزات الرئيسية",
      features: [
        "دفع مضمون خلال 7 أيام",
        "دعم فني على مدار الساعة (24/7)",
        "واجهة محسّنة للأجهزة المحمولة",
        "مستخدمون موثقون",
      ],
      languageToggle: "تغيير اللغة",
      sections: {
        definitions: "التعريفات",
        scope: "الهدف والنطاق والقبول",
        status: "حالة المساعد – الامتثال والمسؤوليات",
        account: "الحساب والفحوصات والأمان",
        rules: "قواعد الاستخدام – الجودة والسلوك المحظور وبدون التفافية",
        relationship: "علاقة المساعد والمستخدم (خارج المنصة)",
        fees: "الرسوم والدفع الواحد والضرائب",
        kyc: "المدفوعات – KYC/AML – العقوبات",
        data: "حماية البيانات (الإطار العالمي)",
        ip: "الملكية الفكرية",
        liability: "الضمانات والمسؤولية والتعويض",
        law: "القانون الحاكم – التحكيم ICC – المحاكم الإستونية",
        protection: "بنود الحماية الدولية",
        misc: "متفرقات",
        contact: "اتصل",
      },
      readyToJoin: "هل أنت مستعد للانضمام إلى SOS Expat؟",
      readySubtitle: "ساعد المغتربين وطوّر نشاطك الاستشاري.",
      startNow: "ابدأ الآن",
      contactUs: "اتصل بنا",
      anchorTitle: "نظرة عامة",
      editHint: "مستند قابل للتحرير من وحدة التحكم الإدارية",
      ctaHero: "عرض الخبراء",
      heroBadge: "جديد – تم تحديث الشروط",
      contactForm: "نموذج الاتصال",
    },
    pt: {
      title: "Termos para Ajudantes Expat",
      subtitle: "Termos de uso para ajudantes de expatriados",
      lastUpdated: "Versão 3.2 – Última atualização: 26 de abril de 2026",
      loading: "Carregando...",
      joinNetwork: "Junte-se à rede",
      trustedByHelpers: "Já mais de 1K+ ajudantes expat confiam em nós",
      keyFeatures: "Características principais",
      features: [
        "Pagamento garantido em 7 dias",
        "Suporte técnico 24/7",
        "Interface otimizada para dispositivos móveis",
        "Usuários verificados",
      ],
      languageToggle: "Mudar idioma",
      sections: {
        definitions: "Definições",
        scope: "Objetivo, âmbito e aceitação",
        status: "Status do Ajudante – Conformidade e responsabilidades",
        account: "Conta, verificações e segurança",
        rules: "Regras de uso – Qualidade, condutas proibidas, sem contornamento",
        relationship: "Relação Ajudante–Usuário (fora da plataforma)",
        fees: "Taxas, pagamento único e impostos",
        kyc: "Pagamentos – KYC/AML – Sanções",
        data: "Proteção de dados (estrutura global)",
        ip: "Propriedade intelectual",
        liability: "Garantias, responsabilidade e indenização",
        law: "Lei aplicável – Arbitragem ICC – Tribunais estonianos",
        protection: "Cláusulas de proteção internacional",
        misc: "Diversos",
        contact: "Contato",
      },
      readyToJoin: "Pronto para se juntar ao SOS Expat?",
      readySubtitle: "Ajude expatriados e desenvolva sua atividade de consultoria.",
      startNow: "Começar agora",
      contactUs: "Entre em contato conosco",
      anchorTitle: "Resumo",
      editHint: "Documento editável a partir do console de administração",
      ctaHero: "Ver especialistas",
      heroBadge: "Novo — Termos atualizados",
      contactForm: "Formulário de contato",
    },
  };

  const t = translations[selectedLanguage];

  const handleLanguageChange = (
    newLang: "fr" | "en" | "es" | "de" | "ru" | "hi" | "ch" | "pt" | "ar"
  ) => {
    setSelectedLanguage(newLang);
  };

  // Parser Markdown (logique d’origine conservée)
  const parseMarkdownContent = (text: string) => {
    const lines = text.split("\n");
    const elements: JSX.Element[] = [];
    let currentIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim() === "") continue;

      if (line.trim() === "---") {
        elements.push(
          <hr
            key={currentIndex++}
            className="my-8 border-t-2 border-gray-200"
          />
        );
        continue;
      }

      // H1
      if (line.startsWith("# ")) {
        const title = line.substring(2).replace(/\*\*/g, "");
        elements.push(
          <h1
            key={currentIndex++}
            className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 mt-8 border-b-2 border-green-500 pb-4"
          >
            {title}
          </h1>
        );
        continue;
      }

      // H2 (+ id pour ancre)
      if (line.startsWith("## ")) {
        const title = line.substring(3).trim();
        const match = title.match(/^(\d+)\.\s*(.*)$/);
        if (match) {
          const sectionNumber = match[1];
          const sectionTitle = match[2].replace(/\*\*/g, "");
          elements.push(
            <h2
              id={`section-${sectionNumber}`}
              key={currentIndex++}
              className="scroll-mt-28 text-xl sm:text-2xl font-bold text-gray-900 mt-10 mb-6 flex items-center gap-3"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-bold shadow-lg">
                {sectionNumber}
              </span>
              <span>{sectionTitle}</span>
            </h2>
          );
        } else {
          elements.push(
            <h2
              key={currentIndex++}
              className="text-xl sm:text-2xl font-bold text-gray-900 mt-10 mb-6"
            >
              {title.replace(/\*\*/g, "")}
            </h2>
          );
        }
        continue;
      }

      // H3
      if (line.startsWith("### ")) {
        const title = line.substring(4).replace(/\*\*/g, "");
        elements.push(
          <h3
            key={currentIndex++}
            className="text-lg font-bold text-gray-800 mt-6 mb-4 border-l-4 border-green-500 pl-4"
          >
            {title}
          </h3>
        );
        continue;
      }

      // 2.1 / 3.2 …
      const numberedMatch = line.match(/^(\d+\.\d+\.?)\s+(.*)$/);
      if (numberedMatch) {
        const number = numberedMatch[1];
        const numberContent = numberedMatch[2];
        const formattedContent = numberContent.replace(
          /\*\*(.*?)\*\*/g,
          '<strong class="font-semibold text-gray-900">$1</strong>'
        );

        elements.push(
          <div
            key={currentIndex++}
            className="bg-gray-50 border-l-4 border-green-500 rounded-r-xl p-5 my-4 hover:bg-gray-100 transition-colors duration-200"
          >
            <p className="text-gray-800 leading-relaxed">
              <span className="font-bold text-green-600 mr-2">{number}</span>
              <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formattedContent) }} />
            </p>
          </div>
        );
        continue;
      }

      // Ligne entièrement en gras
      if (line.startsWith("**") && line.endsWith("**")) {
        const boldText = line.slice(2, -2);
        elements.push(
          <div
            className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 my-6"
            key={currentIndex++}
          >
            <p className="font-bold text-gray-900 text-lg">{boldText}</p>
          </div>
        );
        continue;
      }

      // Bloc Contact
      if (
        line.includes("Pour toute question") ||
        line.includes("For any questions")
      ) {
        elements.push(
          <div
            key={currentIndex++}
            className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-8 my-8 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold shadow-lg">
                13
              </span>
              Contact
            </h3>
            <p className="text-gray-800 leading-relaxed mb-6 text-lg">{line}</p>
            <a
              href="https://sos-expat.com/contact"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              {selectedLanguage === "fr"
                ? "Formulaire de contact"
                : "Contact Form"}
            </a>
          </div>
        );
        continue;
      }

      // Paragraphe
      if (line.trim()) {
        const formattedLine = line
          .replace(
            /\*\*(.*?)\*\*/g,
            '<strong class="font-semibold text-gray-900">$1</strong>'
          )
          .replace(/\*([^*]+)\*/g, '<em class="italic text-gray-700">$1</em>');

        elements.push(
          <p
            key={currentIndex++}
            className="mb-4 text-gray-800 leading-relaxed text-base"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formattedLine) }}
          />
        );
      }
    }

    return elements;
  };

  // Contenu par défaut FR (une seule paire de ** pour éviter le parsing foireux)
  const defaultFr = `
# Conditions Générales d'Utilisation – Expatriés Aidants (Global)

**SOS Expat d'WorldExpat OÜ** (la « **Plateforme** », « **SOS** », « **nous** »)

**Version 3.2 – Dernière mise à jour : 26 avril 2026**

---

## 1. Définitions

**Expatrié Aidant** (« **Aidant** ») : toute personne inscrite sur la Plateforme pour proposer, à titre indépendant, des services d'assistance non juridiques et non médicaux à des Utilisateurs (orientation, démarches pratiques, accompagnement, traduction informelle, mise en relation locale, etc.).

**Utilisateur** : toute personne utilisant la Plateforme pour contacter un Aidant.

**Mise en relation** : l'introduction technique/opérationnelle réalisée par la Plateforme entre un Utilisateur et un Aidant (transmission de coordonnées et/ou ouverture d'un canal de communication et/ou acceptation par l'Aidant d'une demande émise via la Plateforme).

**Pays d'Intervention** : la juridiction principalement visée par la demande de l'Utilisateur au moment de la Mise en relation ; à défaut, le pays de résidence de l'Utilisateur à la date de la demande.

**Frais de Mise en relation** : rémunération **due par l'Utilisateur à SOS Expat** pour chaque Mise en relation (art. 7), au titre du seul service technique de mise en relation fourni par la Plateforme. Ces frais ne constituent en aucun cas une commission, rétrocession ou partage de la rémunération de l'Aidant. Leur montant est défini dans le **barème en vigueur**, consultable dans l'espace personnel de l'Aidant et de l'Utilisateur. SOS Expat peut modifier ce barème dans les conditions prévues à l'article 2.4.

**Prestataire(s) de paiement** : services tiers traitant les encaissements et la répartition des fonds.

**Partenaire B2B** : toute personne morale (entreprise, association, mutuelle, comité d'entreprise, organisation, etc.) ayant conclu avec SOS Expat un contrat-cadre distinct prévoyant qu'elle finance, en tout ou partie, les Frais de Mise en relation pour ses membres, salariés ou bénéficiaires (les « **Utilisateurs B2B** »). Une **Mise en relation B2B** est une Mise en relation déclenchée par un Utilisateur B2B au titre d'un tel contrat-cadre. Par opposition, une **Mise en relation B2C** est déclenchée par un Utilisateur qui paie directement les Frais de Mise en relation.

---

## 2. Objet, champ et acceptation

2.1. Les présentes CGU régissent l'accès et l'utilisation de la Plateforme par les Aidants.

2.2. **SOS Expat agit exclusivement comme intermédiaire technique de Mise en relation.** SOS Expat n'est pas employeur, mandataire ou partenaire des Aidants, ne fournit aucun conseil juridique, médical, fiscal, comptable ou réglementé, et n'est pas partie aux contrats entre Aidants et Utilisateurs.

2.3. **Acceptation électronique (click-wrap).** L'inscription et/ou l'usage de la Plateforme valent acceptation des CGU, signature électronique et consentement contractuel. SOS peut conserver des preuves techniques (horodatage, identifiants).

2.4. **Modifications (préavis P2B).** SOS Expat peut mettre à jour les CGU et/ou le barème des frais à tout moment, sous réserve d'un **préavis minimum de quinze (15) jours** notifié à l'Aidant sur support durable (email à l'adresse enregistrée et publication dans l'espace personnel), conformément à l'article 3 du Règlement (UE) 2019/1150 (« P2B »). Le préavis peut être réduit ou supprimé : (i) lorsque la modification est imposée par la loi ou par une décision d'autorité compétente ; (ii) pour des raisons impérieuses de sécurité ou de prévention de la fraude ; ou (iii) pour les corrections matérielles ou typographiques sans incidence économique. Pendant la période de préavis, l'Aidant peut **résilier sans pénalité** sa relation avec la Plateforme. À défaut de résiliation, la poursuite de l'usage de la Plateforme à l'expiration du préavis vaut acceptation.

2.5. **Capacité professionnelle (B2B).** L'Aidant déclare agir **exclusivement à des fins professionnelles** ; les régimes de protection des consommateurs ne s'appliquent pas à la relation SOS Expat–Aidant.

---

## 3. Statut de l'Aidant – Conformité, autorisations et responsabilités

3.1. **Indépendance.** L'Aidant agit en **professionnel indépendant** ; aucun lien d'emploi, mandat, agence, partenariat ou coentreprise n'est créé avec SOS Expat.

3.2. **Autorisation de travail & statut d'immigration.** L'Aidant est **seul responsable** d'obtenir et de maintenir **toutes autorisations** requises dans chaque Pays d'Intervention (visa, permis de travail, enregistrement d'activité/auto-entreprise, assurances, licences locales, etc.). SOS Expat **ne vérifie pas** ces autorisations et **n'assume aucune responsabilité** à ce titre.

3.3. **Services non réglementés.** L'Aidant s'engage à **ne pas fournir de services réglementés** (ex. conseil juridique, médical, financier, d'expert-comptable, d'agent immobilier, etc.) **sans** détenir les **autorisations/licences** nécessaires **et** sans se conformer pleinement aux lois locales. À défaut, il s'abstient de tels services et redirige l'Utilisateur vers un professionnel dûment habilité (ex. avocat inscrit).

3.4. **Conformité générale.** L'Aidant respecte les lois/règlements applicables (consommation, e-commerce, publicité/démarchage, concurrence loyale, LCB-FT/KYC le cas échéant, fiscalité, protection des données, sanctions/export, sécurité des personnes).

3.5. **Assurances.** L'Aidant déclare disposer des assurances nécessaires (responsabilité civile pro, le cas échéant) couvrant ses activités et territoires d'intervention.

3.6. **Confidentialité.** L'Aidant protège les informations des Utilisateurs et s'abstient de les divulguer, sauf obligation légale ou consentement.

3.7. **Déclarations et garanties de l'Aidant.** En s'inscrivant sur la Plateforme, l'Aidant déclare et garantit expressément que :
- (a) Il est **majeur** selon le droit de son pays de résidence et dispose de la **pleine capacité juridique** pour contracter et exercer son activité ;
- (b) Il dispose, ou s'engage à disposer **avant toute prestation**, de **toutes les autorisations** requises par le droit du Pays d'Intervention pour exercer son activité (visa, permis de travail, enregistrement d'activité indépendante / auto-entreprise / freelance / micro-entreprise selon les pays, immatriculation fiscale et sociale, licences sectorielles le cas échéant) ;
- (c) Il **ne fournira aucun service relevant d'une profession réglementée** (avocat, notaire, médecin, expert-comptable, conseiller financier ou en investissement, agent immobilier, etc.) sans détenir le titre/la licence locale requis ; il oriente l'Utilisateur vers un professionnel dûment habilité dès lors qu'une question relève d'une telle profession ;
- (d) Il **n'est pas frappé d'une interdiction d'exercer** une activité professionnelle ou commerciale dans son pays de résidence, ni dans le Pays d'Intervention ;
- (e) Il ne figure sur **aucune liste de sanctions** internationale (OFAC/SDN, UE, ONU, HMT) ;
- (f) Toutes les informations fournies lors de l'inscription sont **exactes, complètes et à jour** et il s'engage à **informer immédiatement** SOS Expat de tout changement les affectant ;
- (g) Il **assume seul l'intégralité de la responsabilité** liée au respect, dans chaque Pays d'Intervention, des règles applicables à son activité (immigration, droit du travail / du travail indépendant, fiscalité, protection du consommateur, données personnelles, publicité/démarchage, sécurité des personnes, déontologies sectorielles).

Toute fausse déclaration constitue une violation grave des CGU pouvant entraîner la suspension immédiate ou la résiliation du compte, sans préjudice de toute action en réparation.

---

## 4. Compte, vérifications et sécurité

4.1. **Inscription.** Un (1) compte par Aidant ; informations exactes, complètes et à jour (identité, moyens de contact, description des services, zones d'intervention, etc.).

4.2. **Vérifications.** SOS Expat peut procéder à des contrôles raisonnables (identité, cohérence du profil, screenings sanctions/KYC via Prestataires) et refuser/suspendre/retirer l'accès pour motif de sécurité, conformité ou qualité de service.

4.3. **Sécurité des accès.** L'Aidant protège ses identifiants. Toute activité via le compte est réputée effectuée par lui.

4.4. **Inactivité & résiliation.** En cas d'**inactivité supérieure à 365 jours**, le compte peut être désactivé automatiquement après notification. L'Aidant peut fermer son compte à tout moment après avoir honoré ses obligations en cours. SOS Expat peut suspendre ou résilier un compte pour violation des CGU, sans préjudice d'autres recours.

4.5. **Communications électroniques.** L'Aidant consent à recevoir toute notification relative aux CGU par voie électronique (email, notification in-app, publication sur la Plateforme).

4.6. **Système interne de traitement des réclamations (Règlement P2B).** Conformément à l'article 11 du Règlement (UE) 2019/1150, SOS Expat met à la disposition de l'Aidant un **système interne de traitement des réclamations gratuit**, accessible via le formulaire de contact (https://sos-expat.com/contact). SOS Expat s'engage à : (i) **accuser réception** de toute réclamation sous **sept (7) jours ouvrés** ; (ii) traiter la réclamation **avec sérieux et sans discrimination, dans un délai raisonnable** (en règle générale **trente (30) jours**) ; (iii) communiquer à l'Aidant le résultat **motivé** du traitement, dans un langage clair et compréhensible, indiquant les voies de recours ultérieures (médiation à l'art. 12.5, arbitrage à l'art. 12.2) ; (iv) tenir des **statistiques agrégées** sur le fonctionnement de ce système, accessibles annuellement.

---

## 5. Règles d'usage – Qualité, interdits, non-contournement

5.1. **Qualité & description fidèle.** L'Aidant décrit ses services de façon exacte, sans promesse de résultat. Il ne présente **aucune fausse qualité** (ex. profession réglementée non détenue).

5.2. **Interdits.** Contenus illicites, discriminatoires ou trompeurs ; pratiques déloyales ; collecte ou usage abusif de données ; contournement/ingénierie inverse de la Plateforme ; collusion/boycott visant à nuire ; violations sanctions/export ; toute activité illégale.

5.3. **Non-contournement.** Chaque **nouvelle Mise en relation** avec un **nouvel Utilisateur** via la Plateforme donne lieu aux **Frais de Mise en relation** (art. 7). Il est **interdit** d'éviter ces frais en contournant la Plateforme pour une nouvelle introduction.

5.4. **Disponibilité.** La Plateforme est fournie **« en l'état »** ; aucune disponibilité ininterrompue n'est garantie (maintenance, incidents, force majeure). L'accès peut être restreint si la loi l'exige.

---

## 6. Relation Aidant–Utilisateur (hors Plateforme)

6.1. Après la Mise en relation, l'Aidant et l'Utilisateur peuvent contractualiser **hors Plateforme**. Les **honoraires** et modalités sont fixés librement par eux, dans le respect des lois locales.

6.2. L'Aidant remet des **conditions/confirmations de service** conformes au droit local, gère sa **facturation** et ses **obligations fiscales**.

6.3. SOS Expat **n'est pas responsable** de la qualité, de l'exactitude ou du résultat des services de l'Aidant, ni des engagements pris entre l'Aidant et l'Utilisateur.

---

## 7. Frais, paiement unique et taxes

7.1. **Frais de Mise en relation (rémunération de la Plateforme).** Les Frais de Mise en relation rémunèrent **exclusivement le service technique de mise en relation** fourni par SOS Expat à l'**Utilisateur**. Ils sont **dus par l'Utilisateur**, et **non par l'Aidant**. Leur montant est défini dans la **grille tarifaire en vigueur**, consultable dans l'espace personnel de l'Aidant, par Mise en relation, hors taxes et hors frais du Prestataire de paiement. Toute modification du barème intervient dans les conditions de l'article 2.4 (préavis minimum quinze (15) jours).

7.2. **Caractérisation juridique du paiement — deux dettes distinctes et indépendantes.** Le paiement effectué par l'Utilisateur via la Plateforme se décompose **juridiquement en deux dettes distinctes et indépendantes**, malgré leur règlement par un encaissement unique pour des raisons de commodité opérationnelle :
- (a) **Dette « Mise en relation »** : somme **due par l'Utilisateur à SOS Expat** au titre du service technique de mise en relation (Frais de Mise en relation, art. 7.1) ;
- (b) **Dette « Rémunération Aidant »** : somme **due par l'Utilisateur à l'Aidant** au titre de la prestation convenue entre eux. Le contenu, la qualité, le résultat, ainsi que la facturation détaillée, relèvent **exclusivement** de la relation Aidant–Utilisateur, hors Plateforme (art. 6 et 13.5).

**SOS Expat ne perçoit, ne réclame et n'a droit à aucune commission, rétrocession, partage, pourcentage ou fraction quelconque de la rémunération de l'Aidant. Les Frais de Mise en relation constituent la seule rémunération de SOS Expat et proviennent exclusivement de la dette de l'Utilisateur visée au (a).**

Le Prestataire de paiement, agissant pour la part (b) en qualité d'**agent payeur de l'Aidant**, reverse à ce dernier la rémunération perçue, sous déduction des seuls frais bancaires de traitement et, le cas échéant, des frais de conversion de devise (art. 7.3 et 7.4). **Le montant net que l'Aidant percevra est affiché dans son tableau de bord avant et après chaque transaction**, lui permettant d'accepter ou de refuser la mise en relation en toute connaissance de cause.

7.3. **Frais bancaires du Prestataire de paiement.** Le Prestataire de paiement — **Stripe Payments Europe Ltd.** (Irlande, UE, certifié PCI-DSS niveau 1) **ou PayPal (Europe) S.à r.l. et Cie, S.C.A.** (Luxembourg, UE, certifié PCI-DSS), selon le pays de résidence et la disponibilité — prélève des frais de traitement sur chaque transaction. **Ces frais bancaires sont intégralement à la charge de l'Aidant** et sont automatiquement déduits du montant qui lui est reversé. Le détail de ces frais est disponible dans les conditions du Prestataire de paiement (Stripe : stripe.com/fr/pricing ; PayPal : paypal.com/fr/webapps/mpp/merchant-fees) et dans le tableau de bord de l'Aidant pour chaque transaction.

7.4. **Frais de change et conversion de devises.** Lorsque la devise de paiement de l'Utilisateur diffère de la devise du compte bancaire de l'Aidant, des **frais de conversion de devises** sont appliqués par le Prestataire de paiement. **Ces frais de change sont intégralement à la charge de l'Aidant** et sont déduits du montant qui lui est reversé.

7.5. **Calcul du montant net reversé à l'Aidant.** Le montant net reversé à l'Aidant correspond à la **dette « Rémunération Aidant »** due par l'Utilisateur (art. 7.2.b), sous déduction **uniquement** : (i) des **frais bancaires** du Prestataire de paiement applicables à la part « Rémunération Aidant » (art. 7.3) et (ii) le cas échéant, des **frais de conversion de devise** (art. 7.4). **Les Frais de Mise en relation (art. 7.2.a) ne sont en aucun cas déduits de la rémunération de l'Aidant** : ils sont prélevés au titre d'une dette distincte de l'Utilisateur envers SOS Expat. **L'Aidant est informé du montant exact qu'il percevra dans son tableau de bord avant chaque prestation et peut ainsi décider en toute connaissance de cause d'accepter ou non la mise en relation.**

7.6. **Durée minimale d'appel et paiement.** **Aucun paiement n'est dû ni effectué** lorsque la durée effective de l'appel entre l'Utilisateur et l'Aidant est **inférieure à soixante (60) secondes**. Dans ce cas, l'autorisation de paiement est automatiquement annulée, l'Utilisateur n'est pas débité, et aucune rémunération n'est versée à l'Aidant. Cette règle s'applique quels que soient les motifs de la brièveté de l'appel (déconnexion technique, raccrochage anticipé, indisponibilité, etc.).

7.7. **Exigibilité & non-remboursement.** Les Frais de Mise en relation sont **dus dès** la Mise en relation et sont **non remboursables** (sauf geste commercial discrétionnaire d'SOS Expat en cas d'échec exclusivement imputable à la Plateforme et **dans la mesure permise par la loi**).

7.8. **Remboursements Utilisateur.** Si un remboursement est accordé à l'Utilisateur, il est **imputé sur la part de l'Aidant** : SOS Expat peut **retenir/compenser** le montant correspondant sur les versements futurs de l'Aidant ou en demander le remboursement si aucun versement n'est à venir. **Aucun remboursement** des Frais de Mise en relation n'est dû, sauf décision discrétionnaire d'SOS Expat.

7.9. **Devises & conversion.** Plusieurs devises peuvent être proposées ; des taux/frais de conversion du Prestataire peuvent s'appliquer.

7.10. **Taxes.** L'Aidant demeure responsable de **toutes taxes** applicables (TVA, impôt sur le revenu, sécurité sociale, etc.). SOS Expat collecte/reverse, lorsque requis, la TVA/équivalent local sur les Frais de Mise en relation.

7.11. **Compensation.** SOS Expat peut compenser toute somme due par l'Aidant avec toute somme payable à l'Aidant.

7.12. **Délais de paiement de l'Aidant selon le canal.** Sous réserve de la complétion du processus KYC (article 8), les délais de versement de la rémunération nette de l'Aidant diffèrent selon le canal de la Mise en relation :
- (a) **Mises en relation B2C** (paiement direct par l'Utilisateur) : la rémunération de l'Aidant est mise en paiement **immédiatement à l'issue de l'appel** par le Prestataire de paiement, sous réserve uniquement des délais techniques de traitement bancaire, anti-fraude et de capture du paiement propres au Prestataire (typiquement de un (1) à sept (7) jours ouvrés selon le pays de l'Aidant et la maturité de son compte chez le Prestataire) ;
- (b) **Mises en relation B2B** (paiement par le Partenaire B2B) : compte tenu du modèle de facturation différée applicable au Partenaire B2B (facturation mensuelle ou « net-30 »), la rémunération de l'Aidant est versée **dans un délai de trente (30) jours** suivant la date de l'appel ;
- (c) Dans tous les cas, le paiement peut être suspendu en cas de litige, de réclamation de l'Utilisateur ou du Partenaire, de vérification KYC/LCB-FT en cours, ou de toute autre circonstance prévue aux présentes CGU.

7.13. **Déclaration fiscale automatique (Directive DAC7 — UE 2021/514).** L'Aidant résidant dans un État membre de l'Union européenne est informé que SOS Expat, en sa qualité d'opérateur de plateforme déclarant, est tenue de **déclarer annuellement** aux autorités fiscales compétentes (au titre de la Directive (UE) 2021/514 dite « DAC7 ») les informations relatives aux Aidants actifs résidant dans l'UE, à savoir notamment : nom, adresse, identifiant fiscal (TIN), État de résidence, montant total des contreparties perçues via la Plateforme et nombre de Mises en relation, ventilés par trimestre civil. L'Aidant s'engage à fournir et à tenir à jour ces informations dans son espace personnel. Le défaut de communication ou de mise à jour peut entraîner la suspension des paiements jusqu'à régularisation, conformément aux dispositions DAC7.

7.14. **Canal B2B — Mises en relation via un Partenaire B2B.**

(a) **Périmètre.** Une Mise en relation B2B est déclenchée par un Utilisateur B2B, bénéficiaire d'un contrat-cadre conclu entre SOS Expat et un Partenaire B2B (art. 1).

(b) **Adaptation des deux dettes.** Le mécanisme des deux dettes (art. 7.2) s'applique comme suit en B2B :
- la **dette « Mise en relation »** est due par le **Partenaire B2B** à SOS Expat (en tout ou partie selon le contrat-cadre), de sorte que l'**Utilisateur B2B ne paie en règle générale rien**, ou ne paie qu'un éventuel ticket modérateur à SOS Expat ;
- la **dette « Rémunération Aidant »** demeure due par l'**Utilisateur final** à l'**Aidant**, sauf clause expresse du contrat-cadre prévoyant une prise en charge totale ou partielle par le Partenaire B2B (auquel cas le Partenaire devient redevable de la part prise en charge envers l'Aidant, via le mécanisme d'agent payeur de l'art. 7.2).

(c) **Tarifs Aidant distincts B2C / B2B — l'Aidant l'accepte expressément.** L'Aidant **reconnaît et accepte expressément** que **la rémunération nette qu'il perçoit pour une Mise en relation B2B peut différer**, à la hausse ou à la baisse, **de celle perçue pour une Mise en relation B2C** (par exemple : tarif forfaitaire négocié avec le Partenaire, prise en compte d'un volume garanti, prise en charge totale ou partielle par le Partenaire, ou réduction consentie au Partenaire). Le **canal d'origine (B2C ou B2B)** et le **montant exact** que l'Aidant percevra sont **affichés dans son tableau de bord avant chaque Mise en relation**. **Aucune obligation d'acceptation** ne pèse sur l'Aidant à raison du canal ou du tarif proposé.

(d) **Inopposabilité du contrat-cadre B2B à l'Aidant.** Les stipulations du contrat-cadre conclu entre SOS Expat et le Partenaire B2B **ne sont pas opposables à l'Aidant** ; seules les présentes CGU et les informations affichées dans le tableau de bord régissent la relation entre SOS Expat et l'Aidant à l'occasion d'une Mise en relation B2B.

(e) **Toute autre stipulation des présentes CGU s'applique** aux Mises en relation B2B.

(f) **Barèmes en vigueur à la date des présentes (à titre indicatif).** Au jour de la dernière mise à jour des présentes CGU, les barèmes nets de rémunération de l'Aidant sont les suivants :
- **Mise en relation B2C** : **trente euros (30 €) ou trente dollars US (30 USD)** net par Mise en relation acceptée et exécutée, selon la devise du règlement ;
- **Mise en relation B2B** : **vingt euros (20 €) ou vingt dollars US (20 USD)** net par Mise en relation acceptée et exécutée, selon la devise du règlement.

Ces montants sont **indicatifs** et reflètent le barème en vigueur à la date de mise à jour des présentes CGU. Le **barème actualisé** est en permanence consultable dans le tableau de bord de l'Aidant avant chaque Mise en relation. Toute évolution est soumise au préavis de quinze (15) jours prévu à l'article 7.15.

7.15. **Modification du barème de rémunération de l'Aidant.** SOS Expat se réserve le droit de **modifier à tout moment le barème de rémunération nette de l'Aidant**, qu'il s'agisse :
- (i) du **barème B2C** — par modification des Frais de Mise en relation ou de leur structure (qui se répercute sur le net perçu par l'Aidant) ;
- (ii) du **barème B2B** — par modification de la rémunération forfaitaire ou variable applicable aux Mises en relation B2B ;
- (iii) ou de toute autre composante de la rémunération nette (par exemple : devises, paliers de volume, paliers d'ancienneté).

Toute modification est soumise au **préavis minimum de quinze (15) jours** prévu à l'article 2.4, notifié à l'Aidant sur support durable. Pendant la période de préavis, l'Aidant peut **résilier sans pénalité** sa relation avec la Plateforme ou continuer à **refuser au cas par cas** les Mises en relation dont la rémunération ne lui conviendrait plus, étant rappelé que **l'Aidant n'est jamais tenu d'accepter une Mise en relation**. **Les Mises en relation déjà acceptées avant l'expiration du préavis demeurent rémunérées au tarif en vigueur à la date d'acceptation.** À défaut de résiliation, la poursuite de l'usage de la Plateforme à l'expiration du préavis vaut acceptation du nouveau barème.

---

## 8. Paiements – KYC/LCB-FT – Sanctions

8.1. **Prestataires de paiement.** Les paiements sont traités **exclusivement** par des Prestataires tiers certifiés **PCI-DSS** : **Stripe Payments Europe Ltd.** (Irlande, UE) et/ou **PayPal (Europe) S.à r.l. et Cie, S.C.A.** (Luxembourg, UE). Le choix du Prestataire dépend du pays de résidence/d'exercice de l'Aidant (Stripe couvre actuellement 44 pays, PayPal 150+ pays). L'Aidant **accepte expressément** les conditions générales et les processus de vérification **KYC/LCB-FT** (Know Your Customer / Lutte contre le Blanchiment et le Financement du Terrorisme) du ou des Prestataires applicables. **SOS Expat n'a aucun rôle de banque, d'établissement de paiement ou d'établissement de crédit** ; SOS Expat n'est qu'un client commercial des Prestataires de paiement précités.

8.2. **KYC obligatoire pour recevoir les versements.** L'Aidant **doit compléter avec succès** la procédure de vérification d'identité (KYC) auprès du Prestataire de paiement **avant** de pouvoir recevoir tout versement. **Aucun paiement ne sera effectué** tant que le KYC n'est pas validé. SOS Expat décline toute responsabilité pour les retards de paiement liés à un KYC incomplet ou refusé.

8.3. **Rétention et annulation.** SOS Expat peut **différer, retenir ou annuler** des paiements en cas de : (i) soupçon de fraude, (ii) non-conformité aux CGU ou aux lois, (iii) injonction légale ou administrative, (iv) défaut de KYC, (v) violation des règles de sanctions internationales.

8.4. **Sanctions et embargos.** L'accès à la Plateforme et aux services de paiement peut être **restreint ou bloqué** dans tout **pays ou territoire faisant l'objet d'un embargo global ou de mesures restrictives complètes** au titre des lois et règlements applicables, en particulier ceux des Prestataires de paiement, de l'Union européenne, des Nations unies, de l'OFAC (États-Unis), du HMT (Royaume-Uni) ou de toute autre autorité compétente. La liste à jour de ces pays et territoires est tenue par les autorités précitées et fait foi ; SOS Expat n'établit ni ne publie sa propre liste géopolitique. L'Aidant déclare **ne figurer sur aucune liste de sanctions** internationale (OFAC/SDN, UE, ONU, HMT) et **respecter les contrôles export** applicables.

8.5. **Coopération légale.** L'Aidant s'engage à coopérer avec SOS Expat et les autorités compétentes en cas d'enquête relative au blanchiment d'argent, au financement du terrorisme ou à toute autre infraction financière.

### Fonds non réclamés et vérification KYC

8.6. **Conservation des fonds en attente.** Lorsqu'un paiement est effectué par un Utilisateur pour une prestation réalisée par un Aidant n'ayant pas complété sa vérification KYC, les fonds correspondant à la part de l'Aidant (déduction faite des frais de mise en relation de la Plateforme) sont conservés en attente sur un compte séquestre. La Plateforme s'engage à :
- Notifier l'Aidant par email de l'existence de fonds en attente ;
- Envoyer des rappels réguliers (à 7 jours, 30 jours, 60 jours, 90 jours, 120 jours et 150 jours) ;
- Fournir à l'Aidant tous les moyens nécessaires pour compléter sa vérification KYC.

8.7. **Fonds en attente prolongée — frais de gestion et transfert aux autorités compétentes.** Lorsque la vérification KYC n'est pas complétée dans un délai de **cent quatre-vingts (180) jours** à compter du premier paiement mis en attente, et malgré les notifications prévues à l'article 8.6 :
- (a) **Frais de gestion forfaitaires.** SOS Expat peut prélever sur les fonds en attente des **frais de gestion forfaitaires raisonnables, plafonnés à dix pour cent (10 %) du montant retenu**, couvrant strictement les coûts administratifs effectifs de conservation, de tentatives de contact et de traitement comptable ;
- (b) **Conservation prolongée.** Le solde demeure conservé sur le compte de cantonnement du Prestataire de paiement (ou consigné par SOS Expat si les conditions techniques l'exigent). L'Aidant peut, à tout moment durant cette phase, compléter son KYC et réclamer les fonds ;
- (c) **Transfert aux autorités compétentes (déshérence).** À l'expiration d'un délai global de **cinq (5) ans** à compter du premier paiement mis en attente, à défaut de réclamation valide, les fonds résiduels sont **transférés à l'autorité compétente du pays de résidence de l'Aidant** au titre des règles applicables aux fonds en déshérence (par exemple, en France, à la Caisse des dépôts au titre de la loi Eckert ; aux États-Unis, au programme d'unclaimed property de l'État compétent ; au Royaume-Uni, au Dormant Assets Scheme ; et de manière générale au mécanisme local équivalent). **SOS Expat ne s'approprie en aucun cas ces fonds résiduels.**

8.8. **Réclamation pendant la conservation prolongée.** L'Aidant peut, à tout moment durant la phase de conservation prolongée (b), adresser une demande de réclamation motivée à SOS Expat via le formulaire de contact, accompagnée d'une **vérification KYC complète** (le KYC étant une condition technique imposée par le Prestataire de paiement et par les obligations LCB-FT). SOS Expat examine la demande sous **trente (30) jours**. En cas d'acceptation, les fonds sont reversés sous déduction des seuls frais de gestion mentionnés au (a). En cas de force majeure dûment justifiée ou d'incapacité médicale documentée, ces frais peuvent être réduits ou supprimés à la discrétion raisonnable de SOS Expat.

8.9. **Acceptation expresse.** En s'inscrivant sur la Plateforme, l'Aidant déclare avoir pris connaissance des modalités du présent article 8 et les accepte expressément. Cette acceptation est une condition essentielle d'accès au statut de prestataire.

---

## 9. Données personnelles (cadre global – GDPR/DSA)

9.1. **Rôles.** Pour les données d'Utilisateurs reçues aux fins de Mise en relation, **SOS Expat et l'Aidant** agissent **chacun** en **responsable de traitement** pour leurs propres finalités, conformément au **Règlement (UE) 2016/679 (GDPR)**.

9.2. **Bases & finalités.** Exécution du contrat (Mise en relation), intérêts légitimes (sécurité, prévention de la fraude, amélioration), conformité légale (LCB-FT, sanctions), et consentement lorsque requis.

9.3. **Transferts internationaux** avec **garanties appropriées** lorsque requis (clauses contractuelles types, décision d'adéquation, etc.).

9.4. **Droits & contact.** Exercice des droits (accès, rectification, effacement, portabilité, opposition) via le **formulaire de contact** de la Plateforme.

9.5. **Sécurité.** Mesures techniques/organisationnelles raisonnables ; notification des violations selon les lois applicables (72 heures conformément au GDPR).

9.6. L'Aidant traite les données conformément au droit du **Pays d'Intervention**.

9.7. **Conformité DSA.** La Plateforme opère en tant que **service intermédiaire** au sens du **Règlement (UE) 2022/2065 (Digital Services Act)**. SOS Expat met en place des mécanismes de signalement de contenus illicites et coopère avec les autorités compétentes conformément au DSA.

---

## 10. Propriété intellectuelle

La Plateforme, ses marques, logos, bases de données et contenus sont protégés. Aucun droit n'est cédé à l'Aidant, hormis un droit **personnel, non exclusif, non transférable** d'accès pendant la durée des CGU. Les contenus fournis par l'Aidant font l'objet d'une **licence mondiale, non exclusive** au profit d'SOS Expat pour l'hébergement et l'affichage dans la Plateforme.

---

## 11. Garanties, responsabilité et indemnisation

11.1. **Aucune garantie** quant aux résultats/qualité/volume d'affaires ; la Plateforme est fournie **« en l'état »**.

11.2. **Limitation de responsabilité** : dans la mesure permise, la responsabilité totale d'SOS Expat envers l'Aidant est limitée aux **dommages directs** et **ne peut excéder** le total des **Frais de Mise en relation** perçus par SOS Expat au titre de la **transaction** à l'origine de la réclamation.

11.3. **Exclusions** : aucun dommage indirect/consécutif/spécial/punitif (perte de profits, d'opportunités, de clientèle, atteinte à la réputation, coûts de remplacement, etc.).

11.4. **Indemnisation** : l'Aidant **indemnise et garantit** SOS Expat (ainsi que ses affiliés, dirigeants, employés, agents) contre toute réclamation, perte, dommage, pénalité et frais (dont honoraires d'avocat) liés à (i) son manquement aux CGU/lois, (ii) ses contenus, (iii) ses services/omissions, (iv) l'absence d'autorisations de travail/immigration/licences.

11.5. **Renonciation aux recours.** L'Aidant **renonce expressément et irrévocablement** à tout recours contre SOS Expat au titre (i) des dommages résultant de la prestation de services, (ii) des pertes indirectes, (iii) des litiges contractuels avec les Utilisateurs, (iv) de toute défaillance des services fournis par l'Aidant. Cette renonciation s'applique dans la mesure maximale permise par la loi.

11.6. **Aucune représentation.** Rien n'emporte mandat, emploi, partenariat ou coentreprise entre SOS Expat et l'Aidant.

11.7. **Force majeure.** SOS Expat n'est pas responsable des retards ou défaillances causés par des événements de **force majeure** (catastrophe naturelle, guerre, pandémie, cyberattaque, panne électrique ou internet, décision gouvernementale, grève, etc.).

11.8. **Survie.** Les art. 5, 7, 8, 9, 10, 11, 12 et 13 survivent à la résiliation.

---

## 12. Droit applicable – Arbitrage – Juridiction estonienne – Actions collectives

12.1. **Droit applicable et primauté de la conformité locale.** Pour chaque Mise en relation, la relation **SOS Expat–Aidant** est régie par les **lois du Pays d'Intervention**, sous réserve des règles d'ordre public locales et des normes internationales impératives. **À titre supplétif** et pour l'interprétation/validité des présentes CGU ainsi que pour toute question non régie par le droit du Pays d'Intervention, le **droit estonien** s'applique. **Pour éviter toute ambiguïté**, les règles impératives applicables à l'activité de l'Aidant dans le Pays d'Intervention (immigration, droit du travail/du travail indépendant, fiscalité, protection du consommateur, données personnelles, publicité/démarchage, sécurité des personnes, déontologies sectorielles le cas échéant) sont **réputées d'ordre public** et **priment** sur toute stipulation contraire ou ambiguë des présentes CGU. Aucune clause des CGU ne saurait être interprétée comme imposant ou autorisant l'Aidant à adopter un comportement contraire à ces règles ; en cas de conflit, l'Aidant s'abstient et en informe SOS Expat sans délai.

12.2. **Arbitrage CCI obligatoire** : tout litige SOS Expat/Aidant est résolu **définitivement** selon le Règlement d'Arbitrage de la **CCI**. **Siège : Tallinn (Estonie)**. **Langue : français.** Le tribunal applique le **droit matériel** défini à l'art. 12.1. Procédure **confidentielle**.

12.3. **Renonciation aux actions collectives** : dans la mesure permise, toute action **collective/de groupe/représentative** est exclue ; réclamations **individuelles uniquement**.

12.4. **Compétence exclusive des tribunaux d'Estonie** : pour toute demande **non arbitrable**, l'**exécution** des sentences ou les **mesures urgentes**, les tribunaux estoniens (compétents à Tallinn) ont compétence **exclusive**. L'Aidant renonce à toute objection de forum/non-convenance.

12.5. **Médiation préalable obligatoire et médiateurs identifiés (Règlement P2B).** Avant tout arbitrage, les parties s'engagent à tenter de résoudre le litige à l'amiable par **négociation de bonne foi** pendant un délai de **trente (30) jours** à compter de la notification écrite du différend, envoyée par email avec accusé de réception à l'adresse de contact de l'autre partie. Conformément à l'article 12 du Règlement (UE) 2019/1150, SOS Expat identifie au moins **deux (2) médiateurs spécialisés**, indépendants et raisonnablement accessibles, parmi lesquels l'Aidant peut choisir : **(i) le Centre de Médiation et d'Arbitrage de Paris (CMAP) — cmap.fr** ; et **(ii) le WIPO Arbitration and Mediation Center (Genève) — wipo.int/amc**. SOS Expat supporte une **part raisonnable des frais de médiation**, appréciée de bonne foi au cas par cas, en particulier lorsque le litige est de faible montant. L'échec de la médiation est une condition préalable à l'introduction d'une demande d'arbitrage.

12.6. **Prescription.** Toute action ou réclamation de l'Aidant contre SOS Expat doit être introduite dans le **délai le plus court entre trois (3) ans** à compter de la survenance du fait générateur **et le délai légal applicable** dans la juridiction de l'Aidant, sous peine de forclusion. La présente clause n'a ni pour objet ni pour effet de réduire en deçà du minimum impératif les délais de prescription qui seraient inopposables à toute réduction conventionnelle dans la juridiction concernée ; en pareil cas, le délai légal local s'applique.

---

## 13. Clauses de protection internationale

13.1. **Anti-corruption.** L'Aidant s'engage à ne pas offrir, promettre ou verser de pots-de-vin ou avantages indus à des agents publics ou privés. Il respecte les lois anti-corruption applicables (FCPA, UK Bribery Act, loi Sapin II, etc.).

13.2. **Confidentialité des échanges et politique d'enregistrement.** Les échanges réalisés via la Plateforme (messages, appels téléphoniques) sont **confidentiels**.

**Politique d'enregistrement :**
- (a) **Par défaut**, SOS Expat **n'enregistre PAS le contenu audio** des appels entre Aidant et Utilisateur. Seules les **métadonnées techniques** sont conservées (horodatage, durée, identifiants Twilio, statut) à des fins de facturation, anti-fraude et résolution de litiges techniques ;
- (b) SOS Expat **n'active aucun enregistrement audio sans le consentement explicite, préalable et séparé de l'Aidant ET de l'Utilisateur**, manifesté avant le début de l'appel par une action positive distincte. Aucun enregistrement ne peut être déclenché unilatéralement par SOS Expat, à la seule exception d'une **réquisition régulière émanant d'une autorité judiciaire compétente du pays de l'Aidant ou de l'Utilisateur**, présentant les garanties d'ordre public requises par cette juridiction ;
- (c) Lorsqu'un enregistrement est exceptionnellement activé dans le cadre du (b), il est conservé pour la durée strictement nécessaire à sa finalité, dans la limite maximale de **six (6) mois** (sauf prolongation imposée par une procédure judiciaire en cours), conformément au RGPD et aux recommandations des autorités locales de protection des données ;
- (d) **L'Aidant s'interdit lui-même** d'enregistrer, retranscrire intégralement, divulguer ou utiliser les échanges à d'autres fins que la prestation convenue, sauf autorisation écrite de l'Utilisateur ou obligation légale. Toute violation peut entraîner la suspension immédiate du compte et l'engagement de la responsabilité civile et/ou pénale de l'Aidant.

13.3. **Non-sollicitation.** Pendant la durée des CGU et **douze (12) mois** après leur résiliation, l'Aidant s'interdit de solliciter directement les Utilisateurs rencontrés via la Plateforme pour éviter les Frais de Mise en relation.

13.4. **Responsabilité exclusive de l'Aidant.** L'Aidant est **seul responsable** de la qualité, de l'exactitude et de la légalité des services qu'il fournit. SOS Expat **ne garantit pas** les conseils, informations ou services délivrés par l'Aidant et **décline toute responsabilité** pour tout préjudice subi par un Utilisateur du fait des services de l'Aidant.

13.5. **Absence de relation de conseil.** SOS Expat n'est **pas un cabinet de conseil**, ni un prestataire de services juridiques, fiscaux, médicaux ou réglementés. La Plateforme se limite à la **mise en relation**. Toute relation de conseil est établie **exclusivement** entre l'Aidant et l'Utilisateur, **hors** de SOS Expat.

13.6. **Litiges Aidant-Utilisateur.** Tout litige entre un Aidant et un Utilisateur relève **exclusivement** de leur relation directe. SOS Expat **n'intervient pas** dans ces litiges et **ne peut être mis en cause** comme partie, garant ou médiateur.

---

## 14. Divers

14.1. **Cession.** SOS Expat peut céder les CGU à une entité de son groupe ou à un successeur ; l'Aidant ne peut céder sans accord écrit d'SOS Expat.

14.2. **Intégralité.** Les CGU constituent l'accord complet et remplacent tout accord antérieur relatif au même objet.

14.3. **Notifications.** Par publication sur la Plateforme, notification in-app ou via le **formulaire de contact**.

14.4. **Interprétation.** Les intitulés sont indicatifs. Aucune règle **contra proferentem**.

14.5. **Langues.** Des traductions peuvent être fournies à titre informatif ; **l'anglais prévaut** pour l'interprétation en cas de divergence (cohérence avec les CGU Avocats et Clients).

14.6. **Nullité partielle.** Si une stipulation est nulle/inapplicable, le reste demeure en vigueur ; remplaçable par une stipulation valide d'effet équivalent lorsque possible.

14.7. **Non-renonciation.** L'absence d'exercice d'un droit n'emporte pas renonciation.

---

## 15. Contact

Pour toute question ou demande légale, contactez-nous :
`;

  // Contenu par défaut EN (une seule paire de **)
  const defaultEn = `
# Terms of Use – Expatriate Helpers (Global)

**SOS Expat by WorldExpat OÜ** (the "**Platform**", "**SOS**", "**we**")

**Version 3.2 – Last updated: April 26, 2026**

---

## 1. Definitions

**Expatriate Helper (“Helper”):** any person registered on the Platform to offer, on an independent basis, non-legal and non-medical assistance services to Users (guidance, practical support, informal translation, local networking, etc.).

**User:** any person using the Platform to contact a Helper.

**Connection:** the technical/operational introduction made by the Platform between a User and a Helper (transmission of contact details and/or opening of a communication channel and/or acceptance by the Helper of a request submitted through the Platform).

**Country of Operation:** the jurisdiction primarily targeted by the User’s request at the time of Connection; failing that, the User’s country of residence at the date of the request.

**Connection Fee:** remuneration **owed by the User to SOS Expat** for each Connection (art. 7), as compensation for the technical connection service provided by the Platform. The Connection Fee in no event constitutes a commission, kickback, or share of the Helper's remuneration. Its amount is defined in the **current fee schedule**, accessible in the personal dashboard of the Helper and the User. SOS Expat may modify the schedule under the conditions of article 2.4.

**Payment Service Providers:** third-party services processing payments and fund distribution.

**B2B Partner:** any legal entity (company, association, mutual fund, works council, organization, etc.) having entered into a separate framework agreement with SOS Expat under which it finances, in whole or in part, the Connection Fees for its members, employees, or beneficiaries (the "**B2B Users**"). A **B2B Connection** is a Connection initiated by a B2B User under such a framework agreement. By contrast, a **B2C Connection** is initiated by a User who pays the Connection Fees directly.

---

## 2. Purpose, Scope and Acceptance

2.1. These Terms of Use govern access to and use of the Platform by Helpers.

2.2. SOS Expat acts solely as a technical intermediary for Connections. SOS Expat is not the employer, agent, or partner of Helpers, provides no legal, medical, tax, accounting, or other regulated advice, and is not a party to contracts between Helpers and Users.

2.3. **Electronic acceptance (click-wrap):** Registration and/or use of the Platform constitutes acceptance of these Terms, electronic signature, and contractual consent. SOS may retain technical evidence (timestamps, identifiers).

2.4. **Modifications (P2B notice period):** SOS Expat may update the Terms and/or fee schedules at any time, subject to a **minimum notice period of fifteen (15) days** notified to the Helper on a durable medium (email to the registered address and publication in the personal dashboard), in accordance with article 3 of Regulation (EU) 2019/1150 ("P2B"). The notice period may be reduced or waived: (i) when the modification is required by law or by a decision of a competent authority; (ii) for compelling security or fraud prevention reasons; or (iii) for material or typographical corrections without economic impact. During the notice period, the Helper may **terminate the relationship without penalty**. Failing termination, continued use of the Platform after the notice period constitutes acceptance.

2.5. **Professional capacity (B2B):** The Helper declares to act solely for professional purposes; consumer protection regimes do not apply to the SOS Expat–Helper relationship.

---

## 3. Helper status – Compliance, authorizations, and responsibilities

3.1. **Independence:** The Helper acts as an independent professional; no employment, agency, partnership, or joint venture relationship is created with SOS Expat.

3.2. **Work authorization & immigration status:** The Helper is solely responsible for obtaining and maintaining all required authorizations in each Country of Operation (visa, work permit, business registration/self-employment, insurance, local licenses, etc.). SOS Expat does not verify such authorizations and assumes no responsibility in this regard.

3.3. **Unregulated services:** The Helper agrees not to provide regulated services (e.g. legal, medical, financial, accounting, or real estate advice, etc.) without holding the required authorizations/licenses and full compliance with local laws. Otherwise, the Helper must refrain from such services and refer the User to a duly licensed professional (e.g. a registered lawyer).

3.4. **General compliance:** The Helper complies with applicable laws/regulations (consumer protection, e-commerce, advertising/solicitation, fair competition, AML/KYC where applicable, taxation, data protection, sanctions/export, and personal safety).

3.5. **Insurance:** The Helper declares to hold necessary insurance (e.g., professional liability) covering their activities and territories of operation.

3.6. **Confidentiality:** The Helper protects Users’ information and shall not disclose it except where legally required or with consent.

3.7. **Helper Declarations and Warranties.** By registering on the Platform, the Helper expressly declares and warrants that:
- (a) They are of **legal age** under the law of their country of residence and have **full legal capacity** to contract and carry out their activity;
- (b) They hold, or undertake to hold **before any service is performed**, **all authorizations** required by the law of the Country of Operation to carry out their activity (visa, work permit, registration of self-employed/freelance/micro-enterprise activity as applicable, fiscal and social registration, sectoral licenses where applicable);
- (c) They **will not provide any service falling within a regulated profession** (lawyer, notary, doctor, certified accountant, financial or investment advisor, real estate agent, etc.) without holding the required local title/license; they direct the User to a duly licensed professional whenever a question relates to such a profession;
- (d) They are **not subject to any prohibition from carrying out** a professional or commercial activity in their country of residence, nor in the Country of Operation;
- (e) They do not appear on **any Sanctions List** (OFAC/SDN, EU, UN, HMT);
- (f) All information provided during registration is **accurate, complete, and up to date** and they undertake to **immediately inform** SOS Expat of any change affecting them;
- (g) They **bear sole and full responsibility** for compliance, in each Country of Operation, with the rules applicable to their activity (immigration, employment / self-employment law, taxation, consumer protection, personal data, advertising/solicitation, personal safety, sectoral ethics).

Any false declaration constitutes a serious violation of the Terms that may result in immediate suspension or termination of the account, without prejudice to any action for damages.

---

## 4. Account, verification, and security

4.1. **Registration** One (1) account per Helper; information must be accurate, complete, and up to date (identity, contact details, service descriptions, operational areas, etc.).

4.2. **Verification** SOS Expat may perform reasonable checks (identity, profile consistency, sanctions/KYC screenings via Providers) and may refuse/suspend/remove access for reasons of security, compliance, or service quality.

4.3. **Access security** The Helper protects their login credentials. Any activity under the account is deemed to have been performed by them.

4.4. **Inactivity & termination.** After **365 days of inactivity**, the account may be automatically deactivated following notification. The Helper may close their account at any time after fulfilling their outstanding obligations. SOS Expat may suspend or terminate an account for violation of the Terms, without prejudice to other remedies.

4.5. **Electronic communications.** The Helper consents to receive any notifications related to the Terms by electronic means (email, in-app notification, publication on the Platform).

4.6. **Internal Complaint-Handling System (P2B Regulation).** In accordance with article 11 of Regulation (EU) 2019/1150, SOS Expat provides the Helper with a **free internal complaint-handling system**, accessible via the contact form (https://sos-expat.com/contact). SOS Expat undertakes to: (i) **acknowledge receipt** of any complaint within **seven (7) business days**; (ii) handle the complaint **seriously and without discrimination, within a reasonable time** (as a rule **thirty (30) days**); (iii) communicate the **reasoned outcome** to the Helper in clear and understandable language, indicating subsequent remedies (mediation under art. 12.5, arbitration under art. 12.2); (iv) maintain **aggregated statistics** on the operation of this system, made available annually.

---

## 5. Use Rules – Quality, Prohibited Conduct, No Circumvention

5.1. **Quality & accurate description** The Helper must describe services accurately, without promising results. The Helper must not claim false professional status (e.g., regulated profession not held).

5.2. **Prohibitions** Illegal, discriminatory, or misleading content; unfair practices; abusive data collection or use; circumvention or reverse-engineering of the Platform; collusion/boycott intended to harm; sanctions/export violations; any unlawful activity.

5.3. **Non-circumvention** Each new Connection with a new User through the Platform gives rise to Connection Fees (art. 7). It is forbidden to avoid such fees by bypassing the Platform for a new introduction.

5.4. **Availability** The Platform is provided “as is”; uninterrupted availability is not guaranteed (maintenance, incidents, force majeure). Access may be restricted where required by law.

---

## 6. Helper–User Relationship (Off-Platform)

6.1. After the Connection, the Helper and User may enter into an agreement off-platform. Fees and terms are freely determined between them, in compliance with local laws.

6.2. The Helper provides service confirmations/terms compliant with local law, manages their own billing and tax obligations.

6.3. SOS Expat is not responsible for the quality, accuracy, or outcome of the Helper’s services, nor for any commitments made between Helper and User.

---

## 7. Fees, Single Payment and Taxes

7.1. **Connection Fee (Platform remuneration).** The Connection Fee compensates **exclusively the technical connection service** provided by SOS Expat to the **User**. It is **owed by the User**, and **not by the Helper**. Its amount is defined in the **current fee schedule** accessible in the Helper's personal dashboard, per Connection, excluding taxes and Payment Provider fees. Any modification of the fee schedule is made under the conditions of article 2.4 (minimum fifteen (15) days notice).

7.2. **Legal characterization of the payment — two separate and independent debts.** The payment made by the User via the Platform is **legally composed of two separate and independent debts**, despite being settled through a single technical collection for operational convenience:
- (a) **"Connection" debt:** amount **owed by the User to SOS Expat** for the technical connection service (Connection Fees, art. 7.1);
- (b) **"Helper Remuneration" debt:** amount **owed by the User to the Helper** for the service agreed between them. The content, quality, outcome, and detailed billing are governed **exclusively** by the Helper–User relationship, off-Platform (art. 6 and 13.5).

**SOS Expat does not receive, claim or have any right to any commission, kickback, share, percentage or fraction whatsoever of the Helper's remuneration. The Connection Fees constitute the sole remuneration of SOS Expat and are derived exclusively from the User's debt referred to in (a).**

The Payment Provider, acting in respect of part (b) as **paying agent of the Helper**, transfers to the latter the remuneration collected, after deducting only its own banking processing fees and, where applicable, currency conversion fees. **The exact net amount the Helper will receive is displayed in their dashboard before and after each transaction**, allowing the Helper to accept or decline the connection on a fully informed basis.

7.3. **Due and non-refundable:** The Connection Fee is due as soon as the Connection is made and non-refundable (except at SOS Expat’s discretionary goodwill in case of a failure solely attributable to the Platform and to the extent permitted by law).

7.4. **User refunds:** If a refund is granted to a User, it is deducted from the Helper’s share: SOS Expat may withhold/offset the corresponding amount from future payments to the Helper or request repayment if no payment is pending. No refund of Connection Fees is due, except at SOS Expat’s discretion.

7.5. **Currencies & conversion:** Multiple currencies may be offered; Provider exchange rates/fees may apply.

7.6. **Taxes** The Helper remains responsible for all applicable taxes (VAT, income tax, social security, etc.). SOS Expat collects/remits, where required, VAT/equivalent on Connection Fees.

7.7. **Set-off** SOS Expat may offset any amount owed by the Helper against any amount payable to the Helper.

7.8. **Helper Payment Timelines by Channel.** Subject to completion of the KYC process (article 8), the timelines for paying the Helper's net remuneration vary by channel:
- (a) **B2C Connections** (direct payment by the User): the Helper's remuneration is **released for payment immediately upon completion of the call** by the Payment Provider, subject only to the Provider's technical banking, anti-fraud and capture processing delays (typically one (1) to seven (7) business days depending on the Helper's country and account maturity with the Provider);
- (b) **B2B Connections** (payment by the B2B Partner): given the B2B Partner's deferred billing model (monthly invoicing or "net-30"), the Helper's remuneration is paid **within thirty (30) days** after the call;
- (c) In all cases, payment may be suspended in case of dispute, User or Partner claim, ongoing KYC/AML verification, or any other circumstance provided in these Terms.

7.9. **Automatic Tax Reporting (DAC7 Directive — EU 2021/514).** Helpers resident in a European Union Member State are informed that SOS Expat, in its capacity as a reporting platform operator, is required to **annually report** to the competent tax authorities (under Directive (EU) 2021/514 known as "DAC7") information relating to active Helpers resident in the EU, in particular: name, address, taxpayer identification number (TIN), Member State of residence, total consideration received via the Platform and number of Connections, broken down by calendar quarter. The Helper undertakes to provide and keep up to date this information in their personal dashboard. Failure to provide or update may result in the suspension of payments until rectification, in accordance with DAC7 provisions.

7.10. **B2B Channel — Connections via a B2B Partner.**

(a) **Scope.** A B2B Connection is initiated by a B2B User who benefits from a framework agreement entered into between SOS Expat and a B2B Partner (art. 1).

(b) **Adaptation of the two debts.** The two-debt mechanism (art. 7.2) applies in B2B as follows:
- the **"Connection" debt** is owed by the **B2B Partner** to SOS Expat (in whole or in part under the framework agreement), so that the **B2B User generally pays nothing**, or pays only a possible co-payment to SOS Expat;
- the **"Helper Remuneration" debt** remains owed by the **end User** to the **Helper**, unless the framework agreement expressly provides for full or partial coverage by the B2B Partner (in which case the Partner becomes liable for the covered portion towards the Helper, via the paying agent mechanism of art. 7.2).

(c) **Distinct Helper remuneration B2C / B2B — the Helper expressly accepts.** The Helper **acknowledges and expressly accepts** that **the net remuneration they receive for a B2B Connection may differ**, upwards or downwards, **from that received for a B2C Connection** (e.g., flat fee negotiated with the Partner, guaranteed volume considerations, full or partial coverage by the Partner, or discount granted to the Partner). The **channel of origin (B2C or B2B)** and the **exact amount** the Helper will receive are **displayed in their dashboard before each Connection**. **No obligation to accept** is imposed on the Helper based on the channel or the proposed rate.

(d) **B2B framework agreement not binding on the Helper.** The provisions of the framework agreement entered into between SOS Expat and the B2B Partner are **not binding on the Helper**; only these Terms and the information displayed in the Helper's dashboard govern the relationship between SOS Expat and the Helper in the context of a B2B Connection.

(e) **All other provisions of these Terms apply** to B2B Connections.

(f) **Current schedules as of the date hereof (for information).** As of the date of the latest update of these Terms, the Helper's net remuneration schedules are as follows:
- **B2C Connection**: **thirty euros (€30) or thirty US dollars (US$30)** net per Connection accepted and performed, depending on the settlement currency;
- **B2B Connection**: **twenty euros (€20) or twenty US dollars (US$20)** net per Connection accepted and performed, depending on the settlement currency.

These amounts are **indicative** and reflect the schedule in force on the date of the latest update of these Terms. The **current schedule** is permanently accessible in the Helper's dashboard before each Connection. Any change is subject to the fifteen (15) day notice period set out in article 7.11.

7.11. **Modification of the Helper Remuneration Schedule.** SOS Expat reserves the right to **modify at any time the schedule of net remuneration of the Helper**, whether:
- (i) the **B2C schedule** — by modifying the Connection Fees or their structure (which impacts the net amount received by the Helper);
- (ii) the **B2B schedule** — by modifying the flat or variable remuneration applicable to B2B Connections;
- (iii) or any other component of the net remuneration.

Any modification is subject to the **minimum fifteen (15) day notice period** provided in article 2.4, notified to the Helper on a durable medium. During the notice period, the Helper may **terminate the relationship without penalty** or continue to **decline on a case-by-case basis** Connections whose remuneration would no longer suit them, it being recalled that **the Helper is never required to accept a Connection**. **Connections already accepted before expiry of the notice remain remunerated at the rate in force on the acceptance date.** Failing termination, continued use of the Platform after the notice period constitutes acceptance of the new schedule.

---

## 8. Payments – KYC/AML – Sanctions

8.1. **Payment Providers.** Payments are processed **exclusively** by **PCI-DSS certified** third-party Providers: **Stripe Payments Europe Ltd.** (Ireland, EU) and/or **PayPal (Europe) S.à r.l. et Cie, S.C.A.** (Luxembourg, EU). The applicable Provider depends on the Helper's country of residence/practice (Stripe currently covers 44 countries, PayPal 150+ countries). The Helper **expressly agrees** to the terms and conditions and the **KYC/AML** (Know Your Customer / Anti-Money Laundering) verification processes of the applicable Provider(s). **SOS Expat is NOT a bank, payment institution, or credit institution**; SOS Expat is solely a commercial customer of the aforementioned Payment Providers.

8.2. **KYC required to receive payments.** The Helper **must successfully complete** the identity verification process (KYC) with the Payment Provider **before** receiving any payment. **No payment will be made** until KYC is validated. SOS Expat disclaims any responsibility for payment delays related to incomplete or rejected KYC.

8.3. **Retention and cancellation.** SOS Expat may **defer, withhold, or cancel** payments in case of: (i) suspected fraud, (ii) non-compliance with Terms or laws, (iii) legal or administrative order, (iv) KYC failure, (v) violation of international sanctions rules.

8.4. **Sanctions and embargoes.** Access to the Platform and payment services may be **restricted or blocked** in any **country or territory subject to a comprehensive embargo or full restrictive measures** under the laws and regulations applicable to the Payment Providers, the European Union, the United Nations, OFAC (United States), HMT (United Kingdom) or any other competent authority. The current list of such countries and territories is maintained by the aforementioned authorities and shall prevail; SOS Expat does not maintain or publish its own geopolitical list. The Helper declares **not to appear on any Sanctions List** (OFAC/SDN, EU, UN, HMT) and to comply with applicable **export controls**.

8.5. **Legal cooperation.** The Helper agrees to cooperate with SOS Expat and competent authorities in case of investigation related to money laundering, terrorist financing, or any other financial offense.

### Unclaimed Funds and KYC Verification

8.6. **Holding of pending funds.** When a payment is made by a User for a service provided by a Helper who has not completed KYC verification, the funds corresponding to the Helper's share (after deduction of the Platform's connection fees) are held in escrow. The Platform commits to:
- Notify the Helper by email of the existence of pending funds;
- Send regular reminders (at 7 days, 30 days, 60 days, 90 days, 120 days, and 150 days);
- Provide the Helper with all necessary means to complete their KYC verification.

8.7. **Funds in extended hold — management fees and transfer to competent authorities.** If KYC verification is not completed within **one hundred and eighty (180) days** from the first payment placed on hold, and despite the notifications provided in article 8.6:
- (a) **Lump-sum management fees.** SOS Expat may deduct from the funds in hold **reasonable lump-sum management fees, capped at ten percent (10%) of the amount retained**, strictly covering effective administrative costs of custody, contact attempts and accounting processing;
- (b) **Extended custody.** The balance remains held on the Payment Provider's segregated account (or escrowed by SOS Expat where technical conditions so require). The Helper may, at any time during this phase, complete KYC and claim the funds;
- (c) **Transfer to competent authorities (escheat / unclaimed property).** Upon expiry of an overall period of **five (5) years** from the first payment placed on hold, in the absence of a valid claim, the residual funds are **transferred to the competent authority of the Helper's country of residence** under applicable rules on unclaimed property (for example, in France, to the Caisse des Dépôts under the Eckert Act; in the United States, to the relevant State's unclaimed property program; in the United Kingdom, to the Dormant Assets Scheme; and generally to the equivalent local mechanism). **SOS Expat in no event appropriates these residual funds.**

8.8. **Claim during extended custody.** The Helper may, at any time during the extended custody phase (b), submit a substantiated claim to SOS Expat via the contact form, accompanied by **complete KYC verification** (KYC being a technical condition imposed by the Payment Provider and AML/CFT obligations). SOS Expat will review the request within **thirty (30) days**. If accepted, the funds are transferred net of only the management fees referred to in (a). In case of duly justified force majeure or documented medical incapacity, these fees may be reduced or waived at SOS Expat's reasonable discretion.

8.9. **Express acceptance.** By registering on the Platform, the Helper declares that they have read the provisions of this article 8 and expressly accept them. This acceptance constitutes an essential condition for access to provider status.

---

## 9. Data Protection (Global Framework – GDPR/DSA)

9.1. **Roles** For User data received for Connection purposes, SOS Expat and the Helper each act as independent data controllers for their own purposes, in accordance with **Regulation (EU) 2016/679 (GDPR)**.

9.2. **Legal bases & purposes** Contract performance (Connection), legitimate interests (security, fraud prevention, improvement), legal compliance (AML, sanctions), and consent where required.

9.3. International transfers with appropriate safeguards where required (standard contractual clauses, adequacy decisions, etc.).

9.4. **Rights & contact** Exercise of rights (access, rectification, erasure, portability, objection) via the Platform's contact form.

9.5. **Security** Reasonable technical/organizational measures; breach notifications according to applicable law (72 hours under GDPR).

9.6. The Helper processes data in accordance with the law of the Country of Operation.

9.7. **DSA Compliance.** The Platform operates as an **intermediary service** within the meaning of **Regulation (EU) 2022/2065 (Digital Services Act)**. SOS Expat implements mechanisms for reporting illegal content and cooperates with competent authorities in accordance with the DSA.

---

## 10. Intellectual Property

The Platform, its trademarks, logos, databases, and content are protected. No rights are transferred to the Helper, except for a personal, non-exclusive, non-transferable right of access during the term of these Terms. Content provided by the Helper is subject to a worldwide, non-exclusive license in favor of SOS Expat for hosting and display on the Platform.

---

## 11. Warranties, Liability and Indemnity

11.1. No guarantee regarding results/quality/business volume; the Platform is provided "as is".

11.2. **Liability limitation:** to the extent permitted, SOS Expat's total liability to the Helper is limited to direct damages and shall not exceed the total Connection Fees received by SOS Expat for the transaction giving rise to the claim.

11.3. **Exclusions:** no indirect/consequential/special/punitive damages (loss of profits, opportunities, clients, reputation, replacement costs, etc.).

11.4. **Indemnification:** the Helper indemnifies and holds harmless SOS Expat (and its affiliates, officers, employees, agents) from any claim, loss, damage, penalty, and expense (including attorney fees) arising from (i) breach of these Terms/laws, (ii) their content, (iii) their services/omissions, (iv) lack of work/immigration/license authorization.

11.5. **Waiver of recourse.** The Helper **expressly and irrevocably waives** any recourse against SOS Expat for (i) damages arising from the provision of services, (ii) indirect losses, (iii) contractual disputes with Users, (iv) any failure of services provided by the Helper. This waiver applies to the maximum extent permitted by law.

11.6. No representation. Nothing herein creates agency, employment, partnership, or joint venture between SOS Expat and the Helper.

11.7. **Force majeure.** SOS Expat is not liable for delays or failures caused by **force majeure** events (natural disaster, war, pandemic, cyberattack, power or internet outage, government decision, strike, etc.).

11.8. Survival. Articles 5, 7, 8, 9, 10, 11, 12, and 13 survive termination.

---

## 12. Governing law – Arbitration – Estonian jurisdiction – Class action waiver

12.1. **Governing law and primacy of local compliance.** For each Connection, the SOS Expat–Helper relationship is governed by the **laws of the Country of Operation**, subject to local public policy and mandatory international norms. **Supplementarily**, and for interpretation/validity of these Terms as well as any issue not governed by the law of the Country of Operation, **Estonian law** applies. **For the avoidance of doubt**, the mandatory rules applicable to the Helper's activity in the Country of Operation (immigration, employment / self-employment law, taxation, consumer protection, personal data, advertising/solicitation, personal safety, sectoral ethics where applicable) are deemed to be **mandatory rules of public policy** and **prevail** over any contrary or ambiguous provision of these Terms. No provision of these Terms shall be construed as requiring or permitting the Helper to engage in conduct contrary to such rules; in case of conflict, the Helper shall refrain and shall promptly inform SOS Expat.

12.2. **Mandatory ICC arbitration:** any dispute between SOS Expat and the Helper shall be finally resolved under the ICC Arbitration Rules. Seat: Tallinn (Estonia). Language: French. The tribunal shall apply the substantive law defined in art. 12.1. Proceedings are confidential.

12.3. **Class action waiver:** to the extent permitted, any collective/group/representative action is excluded; individual claims only are allowed.

12.4. **Exclusive jurisdiction of Estonian courts:** for any non-arbitrable matters, enforcement of awards, or urgent measures, Estonian courts (competent in Tallinn) have exclusive jurisdiction. The Helper waives any objection of forum or non-convenience.

12.5. **Mandatory Pre-Arbitration Mediation and identified mediators (P2B Regulation).** Before any arbitration, the parties agree to attempt to resolve the dispute amicably through **good faith negotiation** for a period of **thirty (30) days** from written notice of the dispute, sent by email with acknowledgment of receipt to the contact address of the other party. In accordance with article 12 of Regulation (EU) 2019/1150, SOS Expat identifies at least **two (2) specialized, independent and reasonably accessible mediators**, from among which the Helper may choose: **(i) the Centre de Médiation et d'Arbitrage de Paris (CMAP) — cmap.fr**; and **(ii) the WIPO Arbitration and Mediation Center (Geneva) — wipo.int/amc**. SOS Expat bears a **reasonable share of the mediation costs**, assessed in good faith on a case-by-case basis, in particular where the dispute is of low value. Failure of mediation is a prerequisite for filing an arbitration request.

12.6. **Limitation Period.** Any action or claim by the Helper against SOS Expat must be brought within the **shorter of three (3) years** from the occurrence of the triggering event **and the applicable statutory limitation period** in the Helper's jurisdiction, failing which it shall be time-barred. This clause is neither intended nor designed to reduce, below the mandatory statutory minimum, any limitation period that would not be subject to contractual reduction in the relevant jurisdiction; in such case the local statutory period applies.

---

## 13. International Protection Clauses

13.1. **Anti-corruption.** The Helper agrees not to offer, promise, or pay bribes or undue benefits to public or private officials. The Helper complies with applicable anti-corruption laws (FCPA, UK Bribery Act, Sapin II Act, etc.).

13.2. **Confidentiality of communications and recording policy.** Communications made through the Platform (messages, calls, videos) are **confidential**.

**Recording policy:**
- (a) **By default**, SOS Expat **does NOT record the audio content** of calls between Helper and User. Only **technical metadata** is retained (timestamp, duration, Twilio identifiers, status) for billing, anti-fraud, and technical dispute resolution purposes;
- (b) SOS Expat **does not enable any audio recording without the explicit, prior and separate consent of both the Helper AND the User**, expressed before the start of the call by a distinct positive action. No recording may be triggered unilaterally by SOS Expat, except pursuant to a **valid order issued by a competent judicial authority of the country of the Helper or the User**, providing the public-policy safeguards required by that jurisdiction;
- (c) Where a recording is exceptionally enabled under (b), it is retained for the duration strictly necessary for its purpose, capped at a maximum of **six (6) months** (unless extended by ongoing judicial proceedings), in accordance with GDPR and the recommendations of local data-protection authorities;
- (d) **The Helper is themselves prohibited** from recording, fully transcribing, disclosing, or using the exchanges for any purpose other than the agreed service, except with the User's written authorization or by legal obligation. Any breach may result in immediate account suspension and engage the Helper's civil and/or criminal liability.

13.3. **Non-solicitation.** During the term of these Terms and **twelve (12) months** after termination, the Helper shall not directly solicit Users met through the Platform to avoid Connection Fees.

13.4. **Exclusive responsibility of the Helper.** The Helper is **solely responsible** for the quality, accuracy, and legality of the services provided. SOS Expat **does not guarantee** the advice, information, or services delivered by the Helper and **disclaims any liability** for any harm suffered by a User due to the Helper's services.

13.5. **No advisory relationship.** SOS Expat is **not a consulting firm**, nor a provider of legal, tax, medical, or regulated services. The Platform is limited to **connection services**. Any advisory relationship is established **exclusively** between the Helper and the User, **outside** of SOS Expat.

13.6. **Helper-User disputes.** Any dispute between a Helper and a User falls **exclusively** within their direct relationship. SOS Expat **does not intervene** in such disputes and **cannot be held liable** as a party, guarantor, or mediator.

---

## 14. Miscellaneous

14.1. **Assignment**: SOS Expat may assign these Terms to an affiliate or successor; the Helper may not assign without SOS Expat's written consent.

14.2. **Entire Agreement**: These Terms constitute the entire agreement and supersede all prior agreements relating to the same subject matter.

14.3. **Notices**: By publication on the Platform, in-app notification, or via the contact form.

14.4. **Interpretation**: Headings are for convenience only. No **contra proferentem** rule applies.

14.5. **Languages**: Translations may be provided for informational purposes; **English prevails** for interpretation in case of discrepancy (consistent with the Lawyer and Client Terms).

14.6. **Severability**: If any provision is invalid/unenforceable, the remainder remains effective; it may be replaced by a valid provision of equivalent effect where possible.

14.7. **No waiver**: Failure to exercise a right does not constitute waiver thereof.

---

## 15. Contact

For any question or legal request, please contact us:
`;

  const defaultRu = `
# Общие условия использования – Эмигранты-помощники (Global)

**SOS Expat d'WorldExpat OÜ** (далее « **Платформа** », « **SOS** », « **мы** »)

**Версия 3.2 – Последнее обновление: 26 апреля 2026 года**

---

## 1. Определения

**Эмигрант-помощник** (« **Помощник** »): любое лицо, зарегистрированное на Платформе для предоставления на независимой основе услуг непрофессиональной юридической и медицинской помощи Пользователям (ориентация, практическая поддержка, сопровождение, неформальный перевод, локальные контакты и т.д.).

**Пользователь**: любое лицо, использующее Платформу для связи с Помощником.

**Связь**: техническое/операционное соединение, осуществляемое Платформой между Пользователем и Помощником (передача контактных данных и/или открытие канала связи и/или согласие Помощника на запрос, сделанный через Платформу).

**Страна деятельности**: юрисдикция, преимущественно затрагиваемая запросом Пользователя в момент Связи; в противном случае – страна проживания Пользователя на дату запроса.

**Плата за Связь**: **вознаграждение, причитающееся Пользователем SOS Expat** за каждую Связь (ст. 7), за единственный технический сервис связи, предоставляемый Платформой. Эта плата ни в коем случае не является комиссией, ретроцессией или разделом вознаграждения Помощника. Её размер определяется в **действующем тарифе**, доступном в личном кабинете Помощника и Пользователя. SOS Expat может изменять этот тариф в условиях, предусмотренных статьёй 2.4.

**Поставщик(и) платежей**: сторонние сервисы, обрабатывающие платежи и распределение средств.

**B2B-партнёр**: любое юридическое лицо (компания, ассоциация, страховая касса, рабочий совет, организация и т.д.), заключившее с SOS Expat отдельный рамочный договор, предусматривающий, что оно полностью или частично финансирует Плату за Связь для своих членов, сотрудников или бенефициаров (« **B2B-Пользователи** »). **B2B-Связь** — это Связь, инициированная B2B-Пользователем в соответствии с таким рамочным договором. В отличие от этого, **B2C-Связь** инициируется Пользователем, который непосредственно оплачивает Плату за Связь.

---

## 2. Цель, сфера применения и принятие

2.1. Настоящие ОУС регулируют доступ и использование Платформы Помощниками.

2.2. **SOS Expat действует исключительно как технический посредник по Связи.** SOS Expat не является работодателем, агентом или партнером Помощников, не предоставляет юридические, медицинские, налоговые, бухгалтерские или регулируемые консультации и не является стороной контрактов между Помощниками и Пользователями.

2.3. **Электронное согласие (click-wrap).** Регистрация и/или использование Платформы означает принятие ОУС, электронную подпись и контрактное согласие. SOS может сохранять технические доказательства (отметки времени, идентификаторы).

2.4. **Изменения (P2B-уведомление).** SOS Expat может обновлять ОУС и/или тариф в любое время, при условии **минимального уведомления за пятнадцать (15) дней**, направленного Помощнику на надёжном носителе (электронная почта на зарегистрированный адрес и публикация в личном кабинете), в соответствии со ст. 3 Регламента (ЕС) 2019/1150 (« P2B »). Уведомление может быть сокращено или отменено: (i) когда изменение продиктовано законом или решением компетентного органа; (ii) по неотложным причинам безопасности или предотвращения мошенничества; или (iii) для материальных или типографских исправлений без экономических последствий. В период уведомления Помощник может **расторгнуть без штрафа** отношения с Платформой. При отсутствии расторжения продолжение использования Платформы по истечении уведомления означает согласие.

2.5. **Профессиональная компетенция (B2B).** Помощник заявляет, что действует **исключительно в профессиональных целях**; нормы защиты потребителей не применяются к отношениям SOS Expat–Помощник.

---

## 3. Статус Помощника – Соответствие, разрешения и ответственность

3.1. **Независимость.** Помощник действует как **независимый профессионал**; никакая связь трудовых отношений, агентства, партнерства или совместного предприятия с SOS Expat не создается.

3.2. **Разрешение на работу и иммиграционный статус.** Помощник **сам несет ответственность** за получение и поддержание **всех необходимых разрешений** в каждой Стране деятельности (визы, разрешения на работу, регистрация деятельности/самозанятость, страховки, местные лицензии и т.д.). SOS Expat **не проверяет** эти разрешения и **не несет никакой ответственности** в этом отношении.

3.3. **Нерегулируемые услуги.** Помощник обязуется **не предоставлять регулируемые услуги** (например, юридические, медицинские, финансовые, бухгалтерские, риелторские и т.д.) **без наличия соответствующих лицензий** и **без полного соблюдения местного законодательства**. В противном случае он воздерживается от таких услуг и направляет Пользователя к квалифицированному специалисту (например, зарегистрированному адвокату).

3.4. **Общее соответствие.** Помощник соблюдает применимые законы/регламенты (потребление, электронная коммерция, реклама/продажи, честная конкуренция, AML/KYC при необходимости, налогообложение, защита данных, санкции/экспорт, безопасность людей).

3.5. **Страхование.** Помощник заявляет, что имеет необходимые страховки (например, профессиональная ответственность), охватывающие его деятельность и территории работы.

3.6. **Конфиденциальность.** Помощник защищает информацию Пользователей и воздерживается от ее раскрытия, за исключением случаев, предусмотренных законом или с согласия.

3.7. **Заявления и гарантии Помощника.** При регистрации на Платформе Помощник прямо заявляет и гарантирует, что:
- (a) Он является **совершеннолетним** по праву страны его проживания и обладает **полной правоспособностью** для заключения договоров и осуществления своей деятельности;
- (b) Он располагает или обязуется располагать **до начала любой услуги** **всеми разрешениями**, требуемыми правом Страны деятельности (виза, разрешение на работу, регистрация деятельности независимого лица / самозанятость / freelance / микропредприятие в зависимости от страны, налоговая и социальная регистрация, отраслевые лицензии при необходимости);
- (c) Он **не будет оказывать никаких услуг, относящихся к регулируемой профессии** (адвокат, нотариус, врач, эксперт-бухгалтер, финансовый или инвестиционный консультант, агент по недвижимости и т.д.), без обладания необходимым местным титулом/лицензией; он направляет Пользователя к должным образом уполномоченному специалисту, когда вопрос касается такой профессии;
- (d) В отношении него **не действует запрет на ведение** профессиональной или коммерческой деятельности;
- (e) Он не значится **ни в одном международном санкционном списке** (OFAC/SDN, ЕС, ООН, HMT);
- (f) Вся информация, предоставленная при регистрации, является **точной, полной и актуальной**, и он обязуется **немедленно информировать** SOS Expat о любых изменениях, затрагивающих эти сведения;
- (g) Он **самостоятельно несёт всю полноту ответственности** за соблюдение в каждой Стране деятельности правил, применимых к его деятельности.

Любое ложное заявление является серьёзным нарушением ОУС, которое может повлечь немедленное приостановление или расторжение аккаунта, без ущерба для любого иска о возмещении.

---

## 4. Аккаунт, проверки и безопасность

4.1. **Регистрация.** Один (1) аккаунт на Помощника; точная, полная и актуальная информация (личность, контактные данные, описание услуг, зоны работы и т.д.).

4.2. **Проверки.** SOS Expat может проводить разумные проверки (идентификация, согласованность профиля, проверки санкций/KYC через Поставщиков) и отказать/приостановить/удалить доступ по причинам безопасности, соответствия или качества обслуживания.

4.3. **Безопасность доступа.** Помощник защищает свои идентификаторы. Любая деятельность через аккаунт считается выполненной им самим.

4.4. **Неактивность и расторжение.** После **365 дней неактивности** аккаунт может быть автоматически деактивирован после уведомления. Помощник может закрыть свой аккаунт в любое время после выполнения своих текущих обязательств. SOS Expat может приостановить или расторгнуть аккаунт за нарушение Условий, без ущерба для других средств правовой защиты.

4.5. **Электронные сообщения.** Помощник соглашается получать любые уведомления, связанные с Условиями, электронными средствами (электронная почта, уведомление в приложении, публикация на Платформе).

4.6. **Внутренняя система рассмотрения жалоб (Регламент P2B).** В соответствии со статьёй 11 Регламента (ЕС) 2019/1150 SOS Expat предоставляет Помощнику **бесплатную внутреннюю систему рассмотрения жалоб**, доступную через контактную форму (https://sos-expat.com/contact). SOS Expat обязуется: (i) **подтвердить получение** в течение **семи (7) рабочих дней**; (ii) рассматривать жалобу **серьёзно и без дискриминации, в разумный срок** (как правило, **тридцать (30) дней**); (iii) сообщать Помощнику **мотивированный** результат; (iv) вести ежегодную **агрегированную статистику**.

---

## 5. Правила использования – Качество, запреты, обход

5.1. **Качество и точное описание.** Помощник описывает свои услуги точно, без обещания результата. Он не заявляет **о недостоверных квалификациях** (например, несуществующая регулируемая профессия).

5.2. **Запреты.** Незаконный, дискриминационный или вводящий в заблуждение контент; недобросовестные практики; сбор или злоупотребление данными; обход/обратная разработка Платформы; сговор/бойкот с целью вреда; нарушение санкций/экспорта; любая незаконная деятельность.

5.3. **Необходность обращения через Платформу.** Каждая **новая Связь** с **новым Пользователем** через Платформу подлежит **Плате за Связь** (ст. 7). **Запрещается** избегать этой платы, обходя Платформу для нового контакта.

5.4. **Доступность.** Платформа предоставляется **«как есть»**; непрерывная доступность не гарантируется (техническое обслуживание, инциденты, форс-мажор). Доступ может быть ограничен, если это требует закон.

---

## 6. Отношения Помощник–Пользователь (вне Платформы)

6.1. После Связи Помощник и Пользователь могут заключать договор **вне Платформы**. **Гонорары** и условия устанавливаются ими самостоятельно, с соблюдением местного законодательства.

6.2. Помощник предоставляет **условия/подтверждения услуг**, соответствующие местному праву, ведет **счет-фактуру** и выполняет **налоговые обязательства**.

6.3. SOS Expat **не несет ответственности** за качество, точность или результат услуг Помощника, а также за обязательства между Помощником и Пользователем.

---

## 7. Плата, единоразовая оплата и налоги

7.1. **Плата за Связь (вознаграждение Платформы).** Плата за Связь оплачивает **исключительно технический сервис связи**, предоставленный SOS Expat **Пользователю**. Она **причитается Пользователем**, а **не Помощником**. Её размер определяется в **действующей тарифной сетке**, доступной в личном кабинете Помощника, за каждую Связь, без учёта налогов и комиссий Поставщика платежей. Любое изменение тарифа происходит в условиях статьи 2.4 (минимальное уведомление за пятнадцать (15) дней).

7.2. **Юридическая характеристика платежа — два отдельных и независимых долга.** Платёж, осуществляемый Пользователем через Платформу, **юридически разделяется на два отдельных и независимых долга**, несмотря на их погашение единым платежом по соображениям операционного удобства:
- (a) **Долг « Связь »**: сумма, **причитающаяся Пользователем SOS Expat** за технический сервис связи (Плата за Связь, ст. 7.1);
- (b) **Долг « Вознаграждение Помощника »**: сумма, **причитающаяся Пользователем Помощнику** за услугу, согласованную между ними. Содержание, качество, результат, а также детальная фактурация, относятся **исключительно** к отношениям Помощник–Пользователь, вне Платформы.

**SOS Expat не получает, не требует и не имеет права на какую-либо комиссию, ретроцессию, разделение, процент или какую-либо часть вознаграждения Помощника. Плата за Связь является единственным вознаграждением SOS Expat и поступает исключительно из долга Пользователя, указанного в (a).**

Поставщик платежей, действуя для части (b) в качестве **платёжного агента Помощника**, перечисляет последнему полученное вознаграждение, за вычетом только банковских комиссий обработки и, при необходимости, комиссий за конверсию валюты. **Чистая сумма, которую получит Помощник, отображается в его панели управления до и после каждой транзакции.**

7.3. **Сроки и невозвратность.** Плата за Связь **должна быть уплачена сразу** при Связи и **не подлежит возврату** (за исключением дискреционных действий SOS Expat в случае неудачи, полностью связанной с Платформой и **в пределах, разрешенных законом**).

7.4. **Возвраты Пользователю.** Если возврат предоставляется Пользователю, он **считается вычетом из доли Помощника**: SOS Expat может **удерживать/компенсировать** сумму с будущих выплат или требовать возврат, если будущих выплат нет. **Возврат Платы за Связь не предусмотрен**, кроме как по дискреционному решению SOS Expat.

7.5. **Валюты и конвертация.** Возможны различные валюты; могут применяться курсы/комиссии Поставщика.

7.6. **Налоги.** Помощник остается ответственным за **все применимые налоги** (НДС, подоходный налог, социальное страхование и т.д.). SOS Expat собирает/перечисляет, если требуется, НДС/местный эквивалент с Платы за Связь.

7.7. **Компенсация.** SOS Expat может компенсировать любую сумму, подлежащую Помощником, с любой суммы, подлежащей выплате Помощнику.

7.8. **Сроки выплаты Помощнику в зависимости от канала.** При условии завершения процесса KYC (ст. 8):
- (a) **B2C-Связи** (прямой платёж Пользователя): вознаграждение направляется на выплату **немедленно по окончании звонка** Поставщиком платежей, с учётом только технических задержек (обычно от 1 до 7 рабочих дней в зависимости от страны и зрелости счёта);
- (b) **B2B-Связи** (платёж B2B-партнёра): с учётом модели отсроченного выставления счетов партнёру (ежемесячного или « net-30 ») вознаграждение выплачивается **в срок тридцати (30) дней** после звонка;
- (c) Возможна приостановка в случае спора, претензии, текущей KYC-проверки или иных обстоятельств, предусмотренных ОУС.

7.9. **Автоматическая налоговая декларация (Директива DAC7 — ЕС 2021/514).** Помощник, проживающий в государстве-члене ЕС, информируется о том, что SOS Expat в качестве оператора декларирующей платформы обязана **ежегодно декларировать** компетентным налоговым органам (на основании Директивы (ЕС) 2021/514 « DAC7 ») информацию о Помощниках-резидентах ЕС: имя, адрес, налоговый идентификатор (TIN), государство проживания, общая сумма, полученная через Платформу, и количество Связей, по кварталам. Помощник предоставляет и поддерживает эти данные в актуальном состоянии. Невыполнение может повлечь приостановку платежей.

7.10. **B2B-канал — Связи через B2B-партнёра.**
(a) B2B-Связь инициируется B2B-Пользователем на основании рамочного договора, заключённого между SOS Expat и B2B-партнёром.
(b) **Адаптация двух долгов**: долг « Связь » причитается **B2B-партнёром**; долг « Вознаграждение Помощника » остаётся причитающимся Пользователем Помощнику (за исключением принятия на себя партнёром).
(c) **Различные тарифы Помощника B2C / B2B**: Помощник **прямо признаёт и принимает**, что чистое вознаграждение в B2B может отличаться (в большую или меньшую сторону) от вознаграждения в B2C. Канал и точная сумма **отображаются в его панели управления перед каждой Связью**. На него **не возлагается обязанность принятия**.
(d) Рамочный B2B-договор **не противопоставляется Помощнику**.
(e) Любое иное положение ОУС применяется к B2B-Связям.
(f) **Действующие тарифы (для информации)**: **B2C: 30 € или 30 USD нетто** за принятую и выполненную Связь; **B2B: 20 € или 20 USD нетто**. Эти суммы являются ориентировочными; актуальный тариф доступен в панели управления. Любое изменение подчиняется уведомлению за 15 дней по ст. 7.11.

7.11. **Изменение тарифа вознаграждения Помощника.** SOS Expat оставляет за собой право в любое время изменять тариф чистого вознаграждения Помощника (B2C, B2B или иной компонент). Любое изменение подчиняется **уведомлению за 15 дней** по ст. 2.4. В период уведомления Помощник может **расторгнуть без штрафа** или продолжать отказываться в каждом конкретном случае. **Связи, уже принятые до истечения уведомления, остаются оплачиваемыми по тарифу, действующему на дату принятия.** При отсутствии расторжения продолжение использования означает согласие.

---

## 8. Персональные данные (глобальные рамки – GDPR/DSA)

8.1. **Роли.** Для данных Пользователей, полученных для Связи, **SOS Expat и Помощник** действуют **каждый** как **контролер обработки** для своих целей, в соответствии с **Регламентом (ЕС) 2016/679 (GDPR)**.

8.2. **Основания и цели.** Исполнение договора (Связь), законные интересы (безопасность, предотвращение мошенничества, улучшение), юридическое соответствие (AML/KYC, санкции), согласие, когда требуется.

8.3. **Международные передачи** с **соответствующими гарантиями**, если требуется.

8.4. **Права и контакт.** Осуществляются через **контактную форму** на Платформе.

8.5. **Безопасность.** Разумные технические и организационные меры; уведомление о нарушениях в соответствии с применимым законодательством.

8.6. Помощник обрабатывает данные в соответствии с законодательством **Страны деятельности**.

8.7. **Соответствие DSA.** Платформа функционирует как **посреднический сервис** в понимании **Регламента (ЕС) 2022/2065 (Закон о цифровых услугах)**. SOS Expat внедряет механизмы для сообщения о незаконном контенте и сотрудничает с компетентными органами в соответствии с DSA.

8.8. **Санкции и эмбарго.** Доступ к Платформе и платёжным сервисам может быть **ограничен или заблокирован** в любой **стране или территории, подпадающей под глобальное эмбарго или комплексные ограничительные меры** в соответствии с применимыми законами (Поставщики платежей, ЕС, ООН, OFAC, HMT или любой иной компетентный орган). Актуальный список ведётся вышеуказанными органами и имеет силу; SOS Expat не составляет собственного геополитического списка. Помощник заявляет, что не значится ни в одном санкционном списке и соблюдает экспортный контроль.

---

## 9. Интеллектуальная собственность

Платформа, её бренды, логотипы, базы данных и контент защищены. Помощнику не передаются права, кроме **личного, неисключительного, непередаваемого** права на доступ на срок действия ОУС. Контент, предоставленный Помощником, лицензируется **всемирно, неисключительно** в пользу SOS Expat для размещения и отображения на Платформе.

---

## 10. Гарантии, ответственность и возмещение

10.1. **Нет гарантии** по результатам/качеству/объему бизнеса; Платформа предоставляется **«как есть»**.

10.2. **Ограничение ответственности**: в пределах разрешенного законом, общая ответственность SOS Expat перед Помощником ограничивается **прямым ущербом** и **не может превышать** сумму **Платы за Связь**, полученной SOS Expat по **транзакции**, послужившей причиной претензии.

10.3. **Исключения**: никакой косвенный/последующий/специальный/штрафной ущерб (потеря прибыли, возможностей, клиентов, репутации, расходы на замену и т.д.).

10.4. **Возмещение**: Помощник **возмещает и гарантирует** SOS Expat (а также его аффилированным лицам, руководителям, сотрудникам, агентам) против любых претензий, потерь, ущерба, штрафов и расходов (включая адвокатские гонорары), связанных с (i) его нарушением ОУС/законов, (ii) его контентом, (iii) его услугами/упущениями, (iv) отсутствием разрешений на работу/иммиграцию/лицензий.

10.5. **Отказ от регресса.** Помощник **прямо и безотзывно отказывается** от любого регресса против SOS Expat за (i) ущерб, возникший в результате оказания услуг, (ii) косвенные убытки, (iii) договорные споры с Пользователями, (iv) любые недостатки услуг, оказанных Помощником. Этот отказ применяется в максимальной степени, разрешенной законом.

10.6. **Нет представительства.** Ничто не создает мандат, трудовые отношения, партнерство или совместное предприятие между SOS Expat и Помощником.

10.7. **Форс-мажор.** SOS Expat не несет ответственности за задержки или сбои, вызванные **форс-мажорными обстоятельствами** (стихийное бедствие, война, пандемия, кибератака, отключение электроэнергии или интернета, решение правительства, забастовка и т.д.).

10.8. **Сохранение.** Ст. 5, 7, 8, 9, 10, 11 и 12 сохраняются после прекращения действия.

---

## 11. Применимое право – Арбитраж – Эстонская юрисдикция – Коллективные иски

11.1. **Материальное право**: для каждой Связи отношения **SOS Expat–Помощник** регулируются **законами Страны деятельности**, с учетом местного публичного порядка и обязательных международных норм. **В качестве дополняющего права и для толкования/действительности настоящих ОУС, а также для вопросов, не регулируемых правом Страны деятельности, применяется право Эстонии.** Для устранения любой неясности, императивные нормы, применимые к деятельности Помощника в Стране деятельности (иммиграция, трудовое право / право независимого труда, налогообложение, защита потребителей, персональные данные, реклама/привлечение, безопасность лиц, отраслевая деонтология при необходимости), **считаются нормами публичного порядка** и **превалируют** над любым противоречащим или неоднозначным положением. Никакая статья не может предписывать поведение, противоречащее этим нормам; в случае конфликта Помощник воздерживается и без промедления информирует SOS Expat.

11.2. **Обязательный арбитраж ICC**: любые споры между SOS Expat и Помощником решаются **окончательно** в соответствии с Регламентом арбитража **ICC**. **Место: Таллинн (Эстония)**. **Язык: французский.** Суд применяет **материальное право**, указанное в ст. 11.1. Процедура **конфиденциальная**.

11.3. **Отказ от коллективных исков**: в пределах разрешенного законом любые коллективные/групповые/представительные иски исключены; только **индивидуальные претензии**.

11.4. **Исключительная юрисдикция судов Эстонии**: для любых требований **не подлежащих арбитражу**, исполнения решений или срочных мер, эстонские суды (компетентные в Таллине) имеют **исключительную** юрисдикцию. Помощник отказывается от любых возражений о неподходящем форуме.

11.5. **Обязательная предварительная медиация и определённые посредники (Регламент P2B).** Перед любым арбитражем добросовестные переговоры в течение **30 дней**. В соответствии со ст. 12 Регламента (ЕС) 2019/1150 SOS Expat определяет не менее двух (2) посредников: **(i) CMAP (cmap.fr); (ii) WIPO Arbitration and Mediation Center (wipo.int/amc)**. SOS Expat несёт **разумную часть** расходов. Неудача является предварительным условием для арбитража.

11.6. **Срок исковой давности.** Любой иск Помощника против SOS Expat должен быть предъявлен в **наименьший из сроков: три (3) года** с момента события **и применимый законный срок** в юрисдикции Помощника, без снижения ниже минимального императивного локального срока, не подлежащего сокращению.

---

## 12. Разное

12.1. **Передача.** SOS Expat может передать ОУС любой компании своей группы или правопреемнику; Помощник не может передавать без письменного согласия SOS Expat.

12.2. **Полнота.** ОУС составляют полное соглашение и заменяют все предыдущие соглашения по тому же объекту.

12.3. **Уведомления.** Через публикацию на Платформе, уведомление в приложении или через **контактную форму**.

12.4. **Толкование.** Заголовки справочные. Нет правила **contra proferentem**.

12.5. **Языки.** Могут предоставляться переводы; **французский язык имеет преимущественную силу** при толковании.

12.6. **Частичная недействительность.** Если положение недействительно/неприменимо, остальное остается в силе; может быть заменено действительным положением с аналогичным эффектом, если возможно.

12.7. **Неотказ от прав.** Неприменение права не означает отказ от него.

---

## 13. Положения о международной защите

13.1. **Конфиденциальность переписки и политика записи.** Переписка через Платформу (сообщения, телефонные звонки) является **конфиденциальной**.

**Политика записи:**
- (a) **По умолчанию** SOS Expat **НЕ записывает** аудио-содержимое звонков между Помощником и Пользователем. Сохраняются только **технические метаданные** (метка времени, длительность, идентификаторы, статус) для целей выставления счетов, борьбы с мошенничеством и разрешения технических споров;
- (b) SOS Expat **не активирует никакой аудиозаписи без явного, предварительного и отдельного согласия Помощника И Пользователя**, выраженного до начала звонка отдельным положительным действием. Никакая запись не может быть инициирована в одностороннем порядке, за единственным исключением законного запроса от **компетентного судебного органа страны Помощника или Пользователя**;
- (c) Хранение строго необходимое, максимум **6 месяцев** (за исключением судебного продления), в соответствии с GDPR и местными органами защиты данных;
- (d) **Помощник сам обязуется** не записывать, полностью не транскрибировать, не разглашать и не использовать переписку в иных целях, кроме согласованной услуги, кроме как с письменного разрешения Пользователя или по требованию закона.

---

## 14. Контакт

Для любых вопросов или юридических запросов свяжитесь с нами:
`;
  const defaultHi = `
# सामान्य उपयोग शर्तें – Expatriates Aidants (वैश्विक)

**SOS Expat by WorldExpat OÜ** (यहाँ “**प्लेटफ़ॉर्म**”, “**SOS**”, “**हम**” के रूप में संदर्भित है)

**संस्करण 3.2 – अंतिम अद्यतन: 26 अप्रैल 2026**

---

## 1. परिभाषाएँ

**Expatrié Aidant** (“**Aidant**”): प्लेटफ़ॉर्म पर पंजीकृत कोई भी व्यक्ति जो स्वतंत्र रूप से **गैर-कानूनी और गैर-चिकित्सीय समर्थन सेवाएँ** प्रदान करता है (जैसे मार्गदर्शन, व्यावहारिक सहायता, साथ चलना, अनौपचारिक अनुवाद, स्थानीय नेटवर्क आदि)।

**उपयोगकर्ता**: कोई भी व्यक्ति जो Aidant से संपर्क करने के लिए प्लेटफ़ॉर्म का उपयोग करता है।

**नेटवर्किंग / मिलान**: प्लेटफ़ॉर्म द्वारा उपयोगकर्ता और Aidant के बीच तकनीकी/संचालन परिचय (संपर्क विवरण साझा करना, संचार चैनल खोलना, या प्लेटफ़ॉर्म के माध्यम से अनुरोध को स्वीकार करना)।

**स्थान/देश**: वह कानूनी क्षेत्र जिस पर उपयोगकर्ता का अनुरोध नेटवर्किंग के समय मुख्य रूप से आधारित है; यदि निर्दिष्ट नहीं है, तो अनुरोध के समय उपयोगकर्ता का निवास देश मान्य होगा।

**नेटवर्किंग शुल्क (Frais de Mise en relation)**: **उपयोगकर्ता द्वारा SOS Expat को देय** पारिश्रमिक, प्रत्येक नेटवर्किंग के लिए (धारा 7), जो प्लेटफ़ॉर्म द्वारा प्रदान की गई **केवल तकनीकी मिलान सेवा** के लिए है। यह शुल्क किसी भी रूप में Aidant के पारिश्रमिक का कमीशन, रिटोसेशन या साझाकरण नहीं है। इसकी राशि **लागू मूल्य सूची** में परिभाषित है, जो Aidant और उपयोगकर्ता के व्यक्तिगत क्षेत्र में उपलब्ध है। SOS Expat इस सूची को धारा 2.4 की शर्तों के अनुसार संशोधित कर सकता है।

**भुगतान सेवा प्रदाता**: तृतीय पक्ष जो भुगतान प्रबंधित करता है और धन वितरित करता है।

**B2B पार्टनर**: कोई भी कानूनी इकाई (कंपनी, संघ, म्यूचुअल, कर्मचारी समिति, संगठन, आदि) जिसने SOS Expat के साथ एक अलग फ्रेमवर्क समझौते का निष्कर्ष किया है, जिसमें यह प्रावधान है कि वह अपने सदस्यों, कर्मचारियों या लाभार्थियों ("**B2B उपयोगकर्ता**") के लिए नेटवर्किंग शुल्क का पूर्ण या आंशिक वित्तपोषण करेगी। **B2B नेटवर्किंग** एक नेटवर्किंग है जो ऐसे फ्रेमवर्क समझौते के तहत B2B उपयोगकर्ता द्वारा शुरू की गई है। इसके विपरीत, **B2C नेटवर्किंग** एक उपयोगकर्ता द्वारा शुरू की जाती है जो सीधे नेटवर्किंग शुल्क का भुगतान करता है।

---

## 2. उद्देश्य, क्षेत्र और सहमति

2.1. ये शर्तें Aidants द्वारा प्लेटफ़ॉर्म तक पहुँच और उपयोग को नियंत्रित करती हैं।

2.2. **SOS Expat केवल तकनीकी मध्यस्थ के रूप में कार्य करता है।** SOS Expat न तो Aidants का नियोक्ता है, न प्रतिनिधि या साझेदार, न कानूनी/चिकित्सीय/कर/लेखांकन सेवाएं प्रदान करता है और न ही Aidant और उपयोगकर्ता के बीच किसी अनुबंध का पक्ष है।

2.3. **इलेक्ट्रॉनिक सहमति (Click-wrap)।** पंजीकरण या प्लेटफ़ॉर्म का उपयोग शर्तों की स्वीकृति के रूप में माना जाएगा। SOS तकनीकी प्रमाण (समय-स्टैम्प, ID) रख सकता है।

2.4. **परिवर्तन (P2B पूर्व-सूचना)।** SOS Expat किसी भी समय शर्तें और/या शुल्क सूची अद्यतन कर सकता है, बशर्ते कि **विनियमन (EU) 2019/1150 ("P2B") के अनुच्छेद 3 के अनुसार** एक स्थायी माध्यम पर **न्यूनतम पंद्रह (15) दिनों की पूर्व-सूचना** दी जाए। पूर्व-सूचना कम या समाप्त की जा सकती है: (i) कानून द्वारा अनिवार्य संशोधन; (ii) सुरक्षा/धोखाधड़ी रोकथाम के अनिवार्य कारण; (iii) आर्थिक प्रभाव के बिना सामग्री या टाइपोग्राफिक सुधार। पूर्व-सूचना अवधि के दौरान, Aidant **बिना दंड के समाप्त** कर सकता है। अन्यथा, निरंतर उपयोग = स्वीकृति।

2.5. **पेशेवर क्षमता (B2B)।** Aidant घोषित करता है कि वह **केवल पेशेवर रूप से** कार्य कर रहा है; उपभोक्ता संरक्षण नियम लागू नहीं होंगे।

---

## 3. Aidant की स्थिति – अनुपालन, अनुमतियाँ और जिम्मेदारी

3.1. **स्वतंत्रता।** Aidant **स्वतंत्र पेशेवर** के रूप में कार्य करता है; SOS Expat के साथ कोई रोजगार, एजेंसी, साझेदारी या जॉइंट वेंचर संबंध नहीं बनता।

3.2. **कार्य अनुमति और प्रवास स्थिति।** Aidant स्वयं जिम्मेदार है कि वह हर देश में आवश्यक अनुमतियाँ प्राप्त और बनाए रखे (वीज़ा, कार्य अनुमति, व्यवसाय पंजीकरण, बीमा, स्थानीय लाइसेंस)। SOS Expat इन अनुमतियों की जांच नहीं करता।

3.3. **गैर-नियंत्रित सेवाएँ।** Aidant बिना उचित लाइसेंस के किसी भी नियंत्रित सेवा (कानूनी, चिकित्सा, वित्त, कर आदि) प्रदान नहीं करेगा।

3.4. **सामान्य अनुपालन।** Aidant सभी लागू कानूनों/नियमों का पालन करेगा (उपभोक्ता संरक्षण, ई-कॉमर्स, विज्ञापन, प्रतिस्पर्धा, AML/KYC, कर, डेटा सुरक्षा, सुरक्षा, प्रतिबंध आदि)।

3.5. **बीमा।** Aidant पुष्टि करता है कि उसने अपनी गतिविधियों के लिए आवश्यक बीमा (व्यावसायिक जिम्मेदारी) कर रखा है।

3.6. **गोपनीयता।** Aidant उपयोगकर्ता डेटा सुरक्षित रखेगा और केवल कानूनी आवश्यकता या सहमति पर साझा करेगा।

3.7. **Aidant के घोषणाएँ और गारंटियाँ।** प्लेटफ़ॉर्म पर पंजीकरण करते समय, Aidant घोषणा और गारंटी देता है कि: (a) वह **वयस्क** है और **पूर्ण कानूनी क्षमता** रखता है; (b) उसके पास या किसी भी सेवा से पहले उसके पास **हस्तक्षेप के देश के कानून द्वारा आवश्यक सभी अनुमतियाँ** होंगी (वीज़ा, कार्य परमिट, स्वतंत्र/स्व-उद्यमी पंजीकरण, कर पंजीकरण, क्षेत्रीय लाइसेंस); (c) वह **विनियमित पेशे से संबंधित कोई सेवा प्रदान नहीं करेगा** (वकील, नोटरी, डॉक्टर, लेखाकार, वित्तीय सलाहकार, रियल एस्टेट एजेंट...) बिना आवश्यक टाइटल/लाइसेंस के और उपयोगकर्ता को पुनर्निर्देशित करेगा; (d) उस पर **प्रैक्टिस से प्रतिबंध** नहीं है; (e) वह **किसी भी प्रतिबंध सूची** में नहीं है; (f) उसकी जानकारी **सटीक** है और अद्यतन की जाएगी; (g) वह प्रत्येक हस्तक्षेप के देश में अपनी गतिविधि पर लागू नियमों के अनुपालन की **पूरी जिम्मेदारी अकेला उठाता है**। कोई भी झूठा घोषणा गंभीर उल्लंघन है।

---

## 4. खाता, सत्यापन और सुरक्षा

4.1. **पंजीकरण।** प्रत्येक Aidant का केवल एक खाता होगा; सभी विवरण सटीक और अद्यतन होंगे।

4.2. **सत्यापन।** SOS Expat सुरक्षा, अनुपालन या गुणवत्ता कारणों से पहुँच अस्वीकृत, निलंबित या हटाने का अधिकार रखता है।

4.3. **सुरक्षा।** खाता गतिविधि को Aidant की ओर से किया गया माना जाएगा।

4.4. **निष्क्रियता।** 365 दिनों की निष्क्रियता के बाद, खाता स्वचालित रूप से निष्क्रिय किया जा सकता है। Aidant अपने दायित्वों को पूरा करने के बाद किसी भी समय अपना खाता बंद कर सकता है। SOS Expat शर्तों के उल्लंघन के लिए खाता निलंबित या समाप्त कर सकता है।

4.5. **इलेक्ट्रॉनिक संचार।** Aidant इलेक्ट्रॉनिक माध्यमों (ईमेल, इन-ऐप अधिसूचनाएँ, प्लेटफ़ॉर्म पर प्रकाशन) के माध्यम से अधिसूचनाएँ प्राप्त करने की सहमति देता है।

4.6. **आंतरिक शिकायत निवारण प्रणाली (P2B विनियमन)।** विनियमन (EU) 2019/1150 के अनुच्छेद 11 के अनुसार, SOS Expat Aidant को संपर्क फॉर्म (https://sos-expat.com/contact) के माध्यम से सुलभ **निःशुल्क आंतरिक शिकायत निवारण प्रणाली** प्रदान करता है। SOS Expat प्रतिबद्ध है: (i) **सात (7) कार्य दिवसों के भीतर रसीद की पुष्टि करें**; (ii) शिकायत को **गंभीरता और भेदभाव के बिना, उचित समय में** (आम तौर पर **तीस (30) दिन**) संबोधित करें; (iii) Aidant को **तर्कपूर्ण** परिणाम सूचित करें; (iv) वार्षिक **समग्र आंकड़े** बनाए रखें।

---

## 5. उपयोग नियम – गुणवत्ता, निषेध और नेटवर्किंग शुल्क

5.1. **गुणवत्ता और विवरण।** Aidant अपनी सेवाओं का सही विवरण देगा; कोई गलत दावा नहीं।

5.2. **निषेध।** अवैध, भेदभावपूर्ण या भ्रामक सामग्री; डेटा का दुरुपयोग; प्लेटफ़ॉर्म की अनधिकृत पहुँच; सांठगांठ या प्रतिबंध; अवैध गतिविधियाँ।

5.3. **नेटवर्किंग शुल्क अवरोध।** प्रत्येक नई नेटवर्किंग पर **नेटवर्किंग शुल्क लागू** होगा।

5.4. **उपलब्धता।** प्लेटफ़ॉर्म **“जैसा है”** आधार पर उपलब्ध है; निरंतरता की कोई गारंटी नहीं।

---

## 6. Aidant–उपयोगकर्ता संबंध (प्लेटफ़ॉर्म के बाहर)

6.1. नेटवर्किंग के बाद, दोनों स्वतंत्र रूप से अनुबंध कर सकते हैं।

6.2. Aidant स्थानीय कानून के अनुसार **सेवा शर्तें और चालान** प्रबंधित करेगा।

6.3. SOS Expat **सेवा की गुणवत्ता या परिणामों के लिए जिम्मेदार नहीं** है।

---

## 7. शुल्क, एकल भुगतान और कर

7.1. **नेटवर्किंग शुल्क (प्लेटफ़ॉर्म का पारिश्रमिक)।** नेटवर्किंग शुल्क **केवल तकनीकी मिलान सेवा** के लिए पारिश्रमिक है जो SOS Expat द्वारा **उपयोगकर्ता** को प्रदान की जाती है। यह **उपयोगकर्ता द्वारा देय है, Aidant द्वारा नहीं**। इसकी राशि **लागू मूल्य सूची** में परिभाषित है, जो Aidant के व्यक्तिगत क्षेत्र में उपलब्ध है, प्रति नेटवर्किंग, करों के बिना और भुगतान सेवा प्रदाता के शुल्क के बिना। मूल्य सूची में कोई भी संशोधन धारा 2.4 की शर्तों के अनुसार होता है (न्यूनतम पंद्रह (15) दिन की पूर्व-सूचना)।

7.2. **भुगतान का कानूनी लक्षण-वर्णन — दो अलग और स्वतंत्र ऋण।** उपयोगकर्ता द्वारा प्लेटफ़ॉर्म के माध्यम से किया गया भुगतान **कानूनी रूप से दो अलग और स्वतंत्र ऋणों** में विभाजित है, परिचालन सुविधा के कारण एकल संग्रह द्वारा निपटान के बावजूद:
- (a) **"नेटवर्किंग" ऋण**: तकनीकी मिलान सेवा के लिए **उपयोगकर्ता द्वारा SOS Expat को देय राशि** (नेटवर्किंग शुल्क, धारा 7.1);
- (b) **"Aidant पारिश्रमिक" ऋण**: उनके बीच सहमत सेवा के लिए **उपयोगकर्ता द्वारा Aidant को देय राशि**। सामग्री, गुणवत्ता, परिणाम, साथ ही विस्तृत बिलिंग, **विशेष रूप से** Aidant–उपयोगकर्ता संबंध के अंतर्गत आती है, प्लेटफ़ॉर्म के बाहर।

**SOS Expat किसी भी कमीशन, रिटोसेशन, साझाकरण, प्रतिशत या Aidant के पारिश्रमिक के किसी भी अंश को न तो प्राप्त करता है, न मांगता है, न ही उसका हकदार है। नेटवर्किंग शुल्क SOS Expat का एकमात्र पारिश्रमिक है और विशेष रूप से (a) में संदर्भित उपयोगकर्ता ऋण से उत्पन्न होता है।**

भाग (b) के लिए भुगतान सेवा प्रदाता, **Aidant के भुगतानकर्ता एजेंट** के रूप में कार्य करते हुए, बैंकिंग प्रसंस्करण शुल्क और, यदि लागू हो, मुद्रा रूपांतरण शुल्क की कटौती के बाद, Aidant को प्राप्त पारिश्रमिक भेजता है। **Aidant को प्राप्त होने वाली शुद्ध राशि उसके डैशबोर्ड में प्रत्येक लेनदेन से पहले और बाद में प्रदर्शित की जाती है।**

7.3. **वापसी योग्य नहीं।** नेटवर्किंग शुल्क गैर-वापसी योग्य।

7.4. **वापसी पर काटौती।** कोई वापसी Aidant के हिस्से से की जा सकती है।

7.5. **मुद्रा और रूपांतरण।** कई मुद्राएँ संभव; सेवा प्रदाता शुल्क लागू कर सकते हैं।

7.6. **कर।** Aidant सभी लागू करों के लिए जिम्मेदार है।

7.7. **मुआवजा।** SOS Expat दावे काटकर भुगतान समायोजित कर सकता है।

7.8. **चैनल के अनुसार Aidant भुगतान की अवधि।** KYC प्रक्रिया के पूरा होने के अधीन:
- (a) **B2C** (उपयोगकर्ता द्वारा सीधा भुगतान): पारिश्रमिक प्रदाता द्वारा **कॉल के तुरंत बाद भुगतान के लिए जारी किया जाता है** (आमतौर पर देश/खाते की परिपक्वता के अनुसार 1 से 7 कार्य दिवस);
- (b) **B2B** (B2B पार्टनर द्वारा भुगतान): पार्टनर के विलंबित बिलिंग मॉडल (मासिक या "नेट-30") को देखते हुए, पारिश्रमिक कॉल के बाद **30 दिनों के भीतर** भुगतान किया जाता है;
- (c) विवाद, KYC प्रगति में, या अन्य CGU परिस्थितियों के मामले में निलंबन संभव।

7.9. **स्वचालित कर रिपोर्टिंग (DAC7 — EU 2021/514)।** यूरोपीय संघ के सदस्य राज्य में निवासी Aidant को सूचित किया जाता है कि SOS Expat, एक रिपोर्टिंग प्लेटफ़ॉर्म ऑपरेटर के रूप में, कर अधिकारियों को **वार्षिक रूप से रिपोर्ट करने के लिए बाध्य** है (निर्देश EU 2021/514 "DAC7"): नाम, पता, कर पहचानकर्ता (TIN), निवास का राज्य, प्राप्त कुल राशि और नेटवर्किंग की संख्या, तिमाही द्वारा। Aidant यह जानकारी प्रदान करता है और अद्यतन रखता है। डिफ़ॉल्ट = भुगतान निलंबन।

7.10. **B2B चैनल — B2B पार्टनर के माध्यम से नेटवर्किंग।**
(a) दायरा: SOS Expat और एक B2B पार्टनर के बीच निष्कर्षित फ्रेमवर्क समझौते के तहत B2B उपयोगकर्ता द्वारा शुरू की गई नेटवर्किंग।
(b) दो ऋणों का अनुकूलन: "नेटवर्किंग" ऋण **B2B पार्टनर** द्वारा देय है; "Aidant पारिश्रमिक" ऋण उपयोगकर्ता द्वारा Aidant को देय रहता है (पार्टनर द्वारा कवर किए जाने को छोड़कर)।
(c) **विशिष्ट B2C/B2B Aidant दरें — Aidant स्पष्ट रूप से इसे स्वीकार करता है।** B2B में शुद्ध पारिश्रमिक B2C से भिन्न हो सकता है। चैनल और सटीक राशि **प्रत्येक नेटवर्किंग से पहले उसके डैशबोर्ड में प्रदर्शित होती है**। उस पर **स्वीकृति की कोई बाध्यता नहीं** है।
(d) B2B फ्रेमवर्क समझौता Aidant पर **लागू नहीं** है।
(e) CGU की कोई अन्य धारा B2B नेटवर्किंग पर लागू होती है।
(f) **लागू मूल्य सूची (सांकेतिक रूप से)**: **B2C: 30 € या 30 USD शुद्ध**; **B2B: 20 € या 20 USD शुद्ध**। अद्यतन सूची डैशबोर्ड में उपलब्ध है। कोई भी विकास धारा 7.11 की 15 दिन की पूर्व-सूचना के अधीन है।

7.11. **Aidant पारिश्रमिक मूल्य सूची का संशोधन।** SOS Expat किसी भी समय Aidant की शुद्ध पारिश्रमिक सूची (B2C, B2B, या अन्य घटक) को **15 दिन की पूर्व-सूचना** (धारा 2.4) के साथ संशोधित करने का अधिकार रखता है। पूर्व-सूचना के दौरान: बिना दंड के समाप्ति या केस-बाय-केस इनकार। **पहले से स्वीकृत नेटवर्किंग = मूल दर।** पूर्व-सूचना के बाद निरंतर उपयोग = स्वीकृति।

7.12. **प्रतिबंध और आर्थिक नाकाबंदी।** लागू कानूनों और विनियमों (विशेष रूप से भुगतान सेवा प्रदाताओं, यूरोपीय संघ, संयुक्त राष्ट्र, OFAC (संयुक्त राज्य अमेरिका), HMT (यूनाइटेड किंगडम) या किसी अन्य सक्षम प्राधिकारी) के तहत **वैश्विक नाकाबंदी या व्यापक प्रतिबंधात्मक उपायों के अधीन किसी भी देश या क्षेत्र** में प्लेटफ़ॉर्म और भुगतान सेवाओं तक पहुँच **प्रतिबंधित या अवरुद्ध** की जा सकती है। इन देशों और क्षेत्रों की अद्यतन सूची उपरोक्त अधिकारियों द्वारा रखी जाती है और प्रामाणिक है; SOS Expat अपनी स्वयं की भू-राजनीतिक सूची स्थापित नहीं करता है। Aidant घोषित करता है कि वह किसी भी प्रतिबंध सूची में नहीं है और लागू निर्यात नियंत्रणों का पालन करता है।

7.13. **लंबित निधियाँ — प्रबंधन शुल्क और सक्षम अधिकारियों को स्थानांतरण।** यदि KYC 180 दिनों के भीतर पूरा नहीं हुआ है:
- (a) उचित निश्चित प्रबंधन शुल्क, **10% तक सीमित**, सख्ती से वास्तविक प्रशासनिक लागत को कवर करते हैं;
- (b) पृथक खाते में विस्तारित संरक्षण; Aidant किसी भी समय KYC पूरा कर सकता है;
- (c) **5 वर्षों** के बाद, अवशिष्ट निधियों को **Aidant के निवास के देश के सक्षम प्राधिकारी** को अप्रयुक्त निधियों पर लागू नियमों के तहत स्थानांतरित किया जाता है (फ्रांस में Eckert कानून के तहत Caisse des dépôts; अमेरिका में unclaimed property कार्यक्रम; यूके में Dormant Assets Scheme; स्थानीय समकक्ष तंत्र)। **SOS Expat किसी भी स्थिति में इन अवशिष्ट निधियों को अपने अधिकार में नहीं लेता है।**

विस्तारित संरक्षण के दौरान दावा: Aidant पूर्ण KYC के साथ एक तर्कपूर्ण अनुरोध भेज सकता है; **30 दिनों** के भीतर समीक्षा; केवल प्रबंधन शुल्क की कटौती (a)। फोर्स मेज्योर / चिकित्सा अक्षमता = SOS Expat के उचित विवेक पर शुल्क कम या समाप्त किए जा सकते हैं। इस धारा 7.13 की **स्पष्ट स्वीकृति** अनिवार्य है।

---

## 8. व्यक्तिगत डेटा (वैश्विक – GDPR/DSA)

8.1. **भूमिकाएँ।** नेटवर्किंग के लिए प्राप्त उपयोगकर्ता डेटा के लिए, SOS Expat और Aidant प्रत्येक **विनियमन (EU) 2016/679 (GDPR)** के अनुसार अपने स्वयं के उद्देश्यों के लिए स्वतंत्र डेटा नियंत्रक के रूप में कार्य करते हैं।

8.2. **उद्देश्य।** नेटवर्किंग, सुरक्षा, धोखाधड़ी रोकथाम, कानूनी आवश्यकताएँ।

8.3. **अंतरराष्ट्रीय स्थानांतरण।** उचित सुरक्षा उपायों के साथ।

8.4. **अधिकार और संपर्क।** प्लेटफ़ॉर्म संपर्क फ़ॉर्म के माध्यम से।

8.5. **सुरक्षा।** उचित तकनीकी/संगठनात्मक उपाय।

8.6. Aidant डेटा का प्रसंस्करण **स्थान/देश कानून** के अनुसार करेगा।

8.7. **DSA अनुपालन।** प्लेटफ़ॉर्म **विनियमन (EU) 2022/2065 (डिजिटल सेवा अधिनियम)** के तहत एक **मध्यस्थ सेवा** के रूप में कार्य करता है। SOS Expat अवैध सामग्री की रिपोर्टिंग के लिए तंत्र लागू करता है और DSA के अनुसार सक्षम अधिकारियों के साथ सहयोग करता है।

---

## 9. बौद्धिक संपदा

प्लेटफ़ॉर्म, ट्रेडमार्क, लोगो, डेटाबेस और सामग्री सुरक्षित हैं। Aidant को केवल व्यक्तिगत, गैर-विशेष, गैर-हस्तांतरित अधिकार मिलेगा। Aidant द्वारा दी गई सामग्री SOS Expat को प्लेटफ़ॉर्म पर होस्टिंग और प्रदर्शन के लिए गैर-विशेष लाइसेंस देती है।

---

## 10. गारंटी, दायित्व और मुआवजा

10.1. परिणाम या गुणवत्ता की कोई गारंटी नहीं।

10.2. **दायित्व सीमा:** कुल दायित्व नेटवर्किंग शुल्क तक सीमित।

10.3. **बहिष्कार:** अप्रत्यक्ष, परिणामी, दंडात्मक नुकसान शामिल नहीं।

10.4. **मुआवजा:** Aidant SOS Expat को किसी भी दावे, नुकसान या कानूनी शुल्क से मुक्त रखेगा।

10.5. **पुनर्प्राप्ति का त्याग।** Aidant **स्पष्ट और अपरिवर्तनीय रूप से** SOS Expat के विरुद्ध किसी भी पुनर्प्राप्ति का त्याग करता है: (i) सेवाओं के प्रावधान से उत्पन्न क्षति, (ii) अप्रत्यक्ष हानि, (iii) उपयोगकर्ताओं के साथ संविदात्मक विवाद, (iv) Aidant द्वारा प्रदान की गई सेवाओं की कोई भी विफलता। यह त्याग कानून द्वारा अनुमत अधिकतम सीमा तक लागू होता है।

10.6. **कोई प्रतिनिधित्व नहीं।** यहाँ कुछ भी SOS Expat और Aidant के बीच एजेंसी, रोजगार, साझेदारी या संयुक्त उद्यम नहीं बनाता।

10.7. **अप्रत्याशित घटना।** SOS Expat **अप्रत्याशित घटना** के कारण होने वाली देरी या विफलताओं के लिए उत्तरदायी नहीं है (प्राकृतिक आपदा, युद्ध, महामारी, साइबर हमला, बिजली या इंटरनेट आउटेज, सरकारी निर्णय, हड़ताल, आदि)।

10.8. ये प्रावधान समाप्ति के बाद भी लागू रहेंगे।

---

## 11. लागू कानून – पंचाट – एस्टोनियाई अधिकार क्षेत्र – सामूहिक मुकदमे

11.1. **सामग्रीक कानून:** प्रत्येक नेटवर्किंग के लिए स्थान/देश का कानून लागू। किसी भी अस्पष्टता से बचने के लिए, हस्तक्षेप के देश में Aidant की गतिविधि पर लागू अनिवार्य नियम (आव्रजन, श्रम/स्वतंत्र कार्य कानून, कराधान, उपभोक्ता संरक्षण, व्यक्तिगत डेटा, विज्ञापन/प्रचार, व्यक्तियों की सुरक्षा, क्षेत्रीय आचार संहिताएँ जहाँ लागू हों) **सार्वजनिक व्यवस्था के माने जाते हैं** और इन CGU के किसी भी विपरीत या अस्पष्ट प्रावधान **पर प्रबल होते हैं**। CGU के किसी भी खंड को इस तरह से व्याख्या नहीं किया जा सकता है कि यह Aidant को इन नियमों के विपरीत आचरण अपनाने के लिए बाध्य या अधिकृत करता है; संघर्ष की स्थिति में, Aidant ऐसा करने से बचता है और तुरंत SOS Expat को सूचित करता है।

11.2. **ICC पंचाट:** सभी विवाद अंतिम रूप से ICC नियमों के अनुसार। स्थान: टालिन, एस्टोनिया; भाषा: फ्रेंच।

11.3. **सामूहिक मुकदमे का त्याग।**

11.4. **एस्टोनियाई अदालती अधिकार।**

11.5. **अनिवार्य पूर्व मध्यस्थता और पहचाने गए मध्यस्थ (P2B विनियमन)।** किसी भी पंचाट से पहले, **30 दिनों** तक सद्भावना से बातचीत। विनियमन (EU) 2019/1150 के अनुच्छेद 12 के अनुसार, SOS Expat कम से कम दो (2) मध्यस्थों की पहचान करता है: **(i) CMAP (cmap.fr); (ii) WIPO Arbitration and Mediation Center (wipo.int/amc)**। SOS Expat **उचित हिस्सा** शुल्क का वहन करता है। विफलता पंचाट से पहले की शर्त है।

11.6. **पुरानी सीमा।** SOS Expat के विरुद्ध Aidant की कोई भी कार्रवाई **3 साल और Aidant के अधिकार क्षेत्र में लागू कानूनी अवधि के बीच की सबसे छोटी अवधि** के भीतर शुरू की जानी चाहिए, घटना के तथ्य से, स्थानीय अनिवार्य न्यूनतम से कम किए बिना।

---

## 12. विविध

12.1. **हस्तांतरण।** SOS Expat अधिकारों का हस्तांतरण कर सकता है।

12.2. **पूर्ण समझौता।**

12.3. **सूचनाएँ।** प्लेटफ़ॉर्म पर प्रकाशन या संपर्क फ़ॉर्म द्वारा।

12.4. **व्याख्या।**

12.5. **भाषाएँ।** फ्रेंच मूल है।

12.6. **आंशिक अमान्यता।**

12.7. **अस्वीकृति नहीं।**

---

## 13. संचार की गोपनीयता और रिकॉर्डिंग नीति

प्लेटफ़ॉर्म के माध्यम से किए गए संचार (संदेश, फोन कॉल) **गोपनीय** हैं।

**रिकॉर्डिंग नीति:**
- (a) **डिफ़ॉल्ट रूप से**, SOS Expat Aidant और उपयोगकर्ता के बीच कॉल की **ऑडियो सामग्री रिकॉर्ड नहीं करता है**। केवल **तकनीकी मेटाडेटा** (टाइमस्टैम्प, अवधि, Twilio पहचानकर्ता, स्थिति) बिलिंग, धोखाधड़ी रोकथाम और तकनीकी विवाद समाधान के लिए रखा जाता है;
- (b) SOS Expat **Aidant और उपयोगकर्ता दोनों की स्पष्ट, पूर्व और अलग सहमति के बिना कोई ऑडियो रिकॉर्डिंग सक्रिय नहीं करता है**, जो कॉल शुरू होने से पहले एक अलग सकारात्मक कार्रवाई द्वारा प्रकट होती है। SOS Expat द्वारा कोई भी रिकॉर्डिंग एकतरफा रूप से शुरू नहीं की जा सकती है, **Aidant या उपयोगकर्ता के देश के सक्षम न्यायिक प्राधिकारी से नियमित अनुरोध** के एकमात्र अपवाद के साथ;
- (c) जब (b) के तहत असाधारण रूप से एक रिकॉर्डिंग सक्रिय की जाती है, तो इसे इसके उद्देश्य के लिए सख्ती से आवश्यक अवधि के लिए रखा जाता है, अधिकतम **6 महीने** की सीमा के भीतर (वर्तमान न्यायिक प्रक्रिया द्वारा अनिवार्य विस्तार को छोड़कर), GDPR और स्थानीय डेटा संरक्षण अधिकारियों की सिफारिशों के अनुसार;
- (d) **Aidant स्वयं** सहमत प्रदर्शन के अलावा अन्य उद्देश्यों के लिए संचार रिकॉर्ड करने, पूरी तरह से ट्रांसक्राइब करने, प्रकट करने या उपयोग करने से बचता है, सिवाय उपयोगकर्ता के लिखित प्राधिकरण या कानूनी दायित्व के।

---

## 14. संपर्क

सवाल या कानूनी मुद्दों के लिए हमसे संपर्क करें:
`;

  const defaultEs = `
# Términos de Uso – Ayudantes de Expatriados (Global)


**SOS Expat por WorldExpat OÜ** (la "**Plataforma**", "**SOS**", "**nosotros**")


**Versión 3.2 – Última actualización: 26 de abril de 2026**


---


## 1. Definiciones


**Ayudante** significa cualquier persona registrada en la Plataforma para ofrecer, de forma independiente, servicios de asistencia no legal y no médica a los Usuarios (orientación, trámites prácticos, traducción informal, introducciones locales, etc.).


**Usuario** significa cualquier persona que utiliza la Plataforma para contactar con un Ayudante.


**Conexión** significa la introducción técnica/operacional que permite contacto (compartir detalles y/o iniciar llamada/mensaje/vídeo y/o aceptación por parte del Ayudante).


**País de Intervención** significa la jurisdicción principalmente dirigida por la solicitud del Usuario en el momento de la Conexión.


**Tarifa de Conexión / Gastos de Puesta en Contacto** : **remuneración debida por el Usuario a SOS Expat** por cada Puesta en Contacto (art. 7), en concepto del único servicio técnico de puesta en contacto prestado por la Plataforma. Estos gastos no constituyen en ningún caso una comisión, retrocesión o reparto de la remuneración del Asistente. Su importe se define en el **baremo vigente**, consultable en el espacio personal del Asistente y del Usuario. SOS Expat puede modificar este baremo en las condiciones previstas en el artículo 2.4.


**Procesadores de Pago** son servicios de terceros que manejan recaudaciones y pagos.

**Socio B2B** : toda persona jurídica (empresa, asociación, mutualidad, comité de empresa, organización, etc.) que haya celebrado con SOS Expat un contrato marco distinto que prevea que financia, total o parcialmente, los Gastos de Puesta en Contacto para sus miembros, empleados o beneficiarios (los « **Usuarios B2B** »). Una **Puesta en Contacto B2B** es una Puesta en Contacto activada por un Usuario B2B en virtud de dicho contrato marco. Por oposición, una **Puesta en Contacto B2C** es activada por un Usuario que paga directamente los Gastos de Puesta en Contacto.


---


## 2. Propósito, Alcance y Aceptación

2.1. Las presentes CGU regulan el acceso y el uso de la Plataforma por parte de los Asistentes.

2.2. **SOS Expat actúa exclusivamente como intermediario técnico de la puesta en contacto** SOS Expat no es empleador, mandatario ni socio de los Asistentes, no proporciona ningún tipo de asesoramiento jurídico, médico, fiscal, contable ni de otra índole regulada, y no forma parte de los contratos entre Asistentes y Usuarios.

2.3. **Aceptación electrónica (click-wrap)** El registro y/o el uso de la Plataforma constituyen la aceptación de las CGU, la firma electrónica y el consentimiento contractual. SOS puede conservar pruebas técnicas (marca de tiempo, identificadores).

2.4. **Modificaciones (preaviso P2B).** SOS Expat puede actualizar las CGU y/o el baremo de tarifas en cualquier momento, sujeto a un **preaviso mínimo de quince (15) días** notificado al Asistente en soporte duradero (correo electrónico a la dirección registrada y publicación en el espacio personal), conforme al artículo 3 del Reglamento (UE) 2019/1150 (« P2B »). El preaviso puede reducirse o suprimirse: (i) cuando la modificación venga impuesta por la ley o por una decisión de autoridad competente; (ii) por razones imperiosas de seguridad o prevención del fraude; o (iii) para correcciones materiales o tipográficas sin incidencia económica. Durante el período de preaviso, el Asistente puede **rescindir sin penalización** su relación con la Plataforma. A falta de rescisión, la continuación del uso de la Plataforma a la expiración del preaviso constituye aceptación.

2.5. **Capacidad profesional (B2B)** El Asistente declara actuar exclusivamente con fines profesionales; los regímenes de protección al consumidor no se aplican a la relación entre SOS Expat y el Asistente.


---


## 3. Estado del Ayudante – Cumplimiento, Autorizaciones y Responsabilidades


3.1. **Independencia** El Asistente actúa como profesional independiente; no se crea ningún vínculo de empleo, mandato, agencia, asociación o empresa conjunta con SOS Expat.

3.2. **Autorización de trabajo y estatus migratorio** El Asistente es únicamente responsable de obtener y mantener todas las autorizaciones necesarias en cada País de Intervención (visado, permiso de trabajo, registro de actividad/autónomo, seguros, licencias locales, etc.). SOS Expat no verifica dichas autorizaciones y no asume ninguna responsabilidad al respecto.

3.3. **Servicios no regulados** El Asistente se compromete a no prestar servicios regulados (por ejemplo, asesoramiento jurídico, médico, financiero, contable o inmobiliario, etc.) sin poseer las autorizaciones/licencias necesarias y sin cumplir plenamente con las leyes locales. En caso contrario, deberá abstenerse de ofrecer dichos servicios y redirigir al Usuario hacia un profesional debidamente autorizado (por ejemplo, un abogado colegiado).

3.4. **Cumplimiento general** El Asistente debe respetar todas las leyes y reglamentos aplicables (consumo, comercio electrónico, publicidad/promoción, competencia leal, LCB-FT/KYC cuando proceda, fiscalidad, protección de datos, sanciones/exportaciones, seguridad de las personas).

3.5. **Seguros** El Asistente declara contar con los seguros necesarios (responsabilidad civil profesional, cuando corresponda) que cubran sus actividades y territorios de intervención.

3.6. **Confidencialidad** El Asistente debe proteger la información de los Usuarios y abstenerse de divulgarla, salvo obligación legal o consentimiento expreso.

3.7. **Declaraciones y garantías del Asistente.** Al registrarse en la Plataforma, el Asistente declara y garantiza expresamente que:
- (a) Es **mayor de edad** según el derecho de su país de residencia y dispone de la **plena capacidad jurídica** para contratar y ejercer su actividad;
- (b) Dispone, o se compromete a disponer **antes de toda prestación**, de **todas las autorizaciones** requeridas por el derecho del País de Intervención para ejercer su actividad (visado, permiso de trabajo, registro de actividad independiente / autónomo / freelance / micro-empresa según los países, identificación fiscal y social, licencias sectoriales en su caso);
- (c) **No prestará ningún servicio relativo a una profesión regulada** (abogado, notario, médico, experto contable, asesor financiero o de inversiones, agente inmobiliario, etc.) sin tener el título/la licencia local requerida; orienta al Usuario hacia un profesional debidamente habilitado cuando una cuestión corresponda a tal profesión;
- (d) **No está sujeto a una prohibición de ejercer** una actividad profesional o comercial;
- (e) No figura en **ninguna lista de sanciones** internacional (OFAC/SDN, UE, ONU, HMT);
- (f) Toda la información facilitada en el momento del registro es **exacta, completa y actualizada** y se compromete a **informar inmediatamente** a SOS Expat de cualquier cambio que las afecte;
- (g) **Asume en exclusiva la integridad de la responsabilidad** vinculada al cumplimiento, en cada País de Intervención, de las normas aplicables a su actividad.

Toda declaración falsa constituye una violación grave de las CGU que puede conllevar la suspensión inmediata o la rescisión de la cuenta, sin perjuicio de cualquier acción de reparación.

---


## 4. Cuenta, Verificaciones y Seguridad

4.1. **Registro** Un (1) cuenta por Asistente; la información debe ser exacta, completa y actualizada (identidad, medios de contacto, descripción de los servicios, zonas de intervención, etc.).

4.2. **Verificaciones** SOS Expat puede realizar controles razonables (identidad, coherencia del perfil, revisiones de sanciones/KYC a través de Proveedores) y puede rechazar, suspender o retirar el acceso por motivos de seguridad, cumplimiento o calidad del servicio.

4.3. **Seguridad de acceso** El Asistente debe proteger sus credenciales. Toda actividad realizada a través de la cuenta se considerará efectuada por él mismo.

4.4. **Inactividad y rescisión.** Tras **365 días de inactividad**, la cuenta podrá ser desactivada automáticamente previo aviso. El Asistente puede cerrar su cuenta en cualquier momento una vez cumplidas sus obligaciones pendientes. SOS Expat puede suspender o rescindir una cuenta por incumplimiento de los Términos, sin perjuicio de otros recursos.

4.5. **Comunicaciones electrónicas.** El Asistente consiente en recibir cualquier notificación relacionada con los Términos por medios electrónicos (correo electrónico, notificación in-app, publicación en la Plataforma).

4.6. **Sistema interno de tramitación de reclamaciones (Reglamento P2B).** Conforme al artículo 11 del Reglamento (UE) 2019/1150, SOS Expat pone a disposición del Asistente un **sistema interno de tramitación de reclamaciones gratuito**, accesible mediante el formulario de contacto (https://sos-expat.com/contact). SOS Expat se compromete a: (i) **acusar recibo** en el plazo de **siete (7) días hábiles**; (ii) tramitar la reclamación **con seriedad y sin discriminación, en un plazo razonable** (en regla general **treinta (30) días**); (iii) comunicar al Asistente el resultado **motivado**; (iv) llevar **estadísticas agregadas** anuales.

---


## 5. Reglas de Uso – Calidad, Conducta Prohibida, Sin Evasión

5.1. **Calidad y descripción fiel** El Asistente debe describir sus servicios de manera precisa, sin prometer resultados. No debe presentarse con **cualificaciones falsas** (por ejemplo, profesiones reguladas que no posea).

5.2. **Prohibiciones** Contenidos ilícitos, discriminatorios o engañosos; prácticas desleales; recopilación o uso indebido de datos; elusión o ingeniería inversa de la Plataforma; colusión o boicot con el fin de perjudicar; infracción de sanciones o normas de exportación; y cualquier otra actividad ilegal.

5.3. **Prohibición de elusión** Cada **nuevo contacto** con un **nuevo Usuario** a través de la Plataforma da lugar al cobro de los **Gastos de Puesta en Contacto** (art. 7). Está **prohibido** evitar estos gastos eludiendo la Plataforma para realizar una nueva introducción.

5.4. **Disponibilidad** La Plataforma se proporciona **“tal cual”**; no se garantiza su disponibilidad ininterrumpida (mantenimiento, incidentes, fuerza mayor). El acceso puede restringirse si así lo exige la ley.

---


## 6. Relación Ayudante–Usuario (Fuera de la Plataforma)


6.1. **Tras la puesta en contacto,** el Asistente y el Usuario pueden formalizar un contrato **fuera de la Plataforma.** Los **honorarios** y las condiciones se establecen libremente entre ellos, respetando las leyes locales.

6.2. El Asistente debe proporcionar **condiciones o confirmaciones de servicio** conformes con la legislación local, gestionar su **facturación** y cumplir con sus **obligaciones fiscales.**

6.3. **SOS Expat no es responsable** de la calidad, exactitud o resultado de los servicios del Asistente, ni de los compromisos asumidos entre el Asistente y el Usuario.

---


## 7. Tarifas, Pago Único e Impuestos


7.1. **Gastos de Puesta en Contacto (remuneración de la Plataforma).** Los Gastos de Puesta en Contacto remuneran **exclusivamente el servicio técnico de puesta en contacto** prestado por SOS Expat al **Usuario**. Son **debidos por el Usuario**, y **no por el Asistente**. Su importe se define en el **baremo tarifario vigente**, consultable en el espacio personal del Asistente, por Puesta en Contacto, sin incluir impuestos ni comisiones del Proveedor de pagos. Cualquier modificación del baremo se efectúa en las condiciones del artículo 2.4 (preaviso mínimo quince (15) días).

7.2. **Calificación jurídica del pago — dos deudas distintas e independientes.** El pago efectuado por el Usuario a través de la Plataforma se descompone **jurídicamente en dos deudas distintas e independientes**, a pesar de su liquidación mediante un único cobro por razones de comodidad operativa:
- (a) **Deuda « Puesta en Contacto »**: importe **debido por el Usuario a SOS Expat** en concepto del servicio técnico de puesta en contacto (Gastos de Puesta en Contacto, art. 7.1);
- (b) **Deuda « Remuneración del Asistente »**: importe **debido por el Usuario al Asistente** en concepto de la prestación convenida entre ellos. El contenido, la calidad, el resultado, así como la facturación detallada, corresponden **exclusivamente** a la relación Asistente–Usuario, fuera de la Plataforma.

**SOS Expat no percibe, no reclama y no tiene derecho a ninguna comisión, retrocesión, reparto, porcentaje o fracción alguna de la remuneración del Asistente. Los Gastos de Puesta en Contacto constituyen la única remuneración de SOS Expat y proceden exclusivamente de la deuda del Usuario contemplada en (a).**

El Proveedor de pagos, actuando para la parte (b) en calidad de **agente pagador del Asistente**, transfiere a este la remuneración percibida, previa deducción únicamente de los gastos bancarios de tramitación y, en su caso, de los gastos de conversión de divisa. **El importe neto que percibirá el Asistente se muestra en su panel de control antes y después de cada transacción.**

7.3. **Exigibilidad y no reembolso.** Los Gastos de Puesta en Contacto son **exigibles desde** el momento de la Puesta en Contacto y **no son reembolsables** (salvo por decisión comercial discrecional de SOS Expat en caso de fallo exclusivamente atribuible a la Plataforma y **dentro de los límites permitidos por la ley**).

7.4. **Reembolsos al Usuario.** Si se concede un reembolso al Usuario, este se **deducirá de la parte correspondiente al Asistente**: SOS Expat podrá **retener o compensar** dicho importe con futuros pagos al Asistente, o **reclamar su devolución** si no hay pagos pendientes. **No se reembolsarán** los Gastos de Puesta en Contacto, salvo decisión discrecional de SOS Expat.

7.5. **Monedas y conversión.** Pueden ofrecerse varias monedas; se pueden aplicar tasas o comisiones de conversión del Proveedor de pagos.

7.6. **Impuestos.** El Asistente sigue siendo responsable de **todos los impuestos aplicables** (IVA, impuesto sobre la renta, seguridad social, etc.). SOS Expat recaudará y/o remitirá, cuando sea necesario, el IVA o su **equivalente local** correspondiente a los Gastos de Puesta en Contacto.

7.7. **Compensación.** SOS Expat podrá compensar cualquier suma debida por el Asistente con cualquier suma pagadera al mismo.

7.8. **Plazos de pago del Asistente según el canal.** Sujeto a la finalización del proceso KYC (artículo 8):
- (a) **Puestas en Contacto B2C** (pago directo por el Usuario): la remuneración se ordena en pago **inmediatamente al finalizar la llamada** por el Proveedor de pagos, únicamente sujeto a los plazos técnicos (típicamente de 1 a 7 días hábiles según el país y la madurez de la cuenta);
- (b) **Puestas en Contacto B2B** (pago por el Socio B2B): habida cuenta del modelo de facturación diferida del Socio (mensual o « net-30 »), la remuneración se abona **en un plazo de treinta (30) días** tras la llamada;
- (c) Suspensión posible en caso de litigio, reclamación, KYC en curso u otra circunstancia prevista en las CGU.

7.9. **Declaración fiscal automática (Directiva DAC7 — UE 2021/514).** El Asistente residente en un Estado miembro de la UE queda informado de que SOS Expat, en su condición de operador de plataforma declarante, está obligada a **declarar anualmente** a las autoridades fiscales competentes (a título de la Directiva (UE) 2021/514 « DAC7 ») las informaciones relativas a los Asistentes residentes en la UE: nombre, dirección, identificador fiscal (TIN), Estado de residencia, importe total percibido a través de la Plataforma y número de Puestas en Contacto, por trimestre. El Asistente facilita y mantiene actualizadas esas informaciones. La omisión puede conllevar la suspensión de los pagos.

7.10. **Canal B2B — Puestas en Contacto a través de un Socio B2B.**
(a) Una Puesta en Contacto B2B es activada por un Usuario B2B en virtud de un contrato marco celebrado entre SOS Expat y un Socio B2B.
(b) **Adaptación de las dos deudas**: la deuda « Puesta en Contacto » es debida por el **Socio B2B**; la deuda « Remuneración del Asistente » sigue siendo debida por el Usuario al Asistente (salvo asunción por el Socio).
(c) **Tarifas Asistente distintas B2C / B2B**: el Asistente **reconoce y acepta expresamente** que la remuneración neta en B2B puede diferir (al alza o a la baja) de la de B2C. El canal y el importe exacto se **muestran en su panel de control antes de cada Puesta en Contacto**. **Ninguna obligación de aceptación** recae sobre él.
(d) El contrato marco B2B **no es oponible al Asistente**.
(e) Cualquier otra estipulación de las CGU se aplica a las Puestas en Contacto B2B.
(f) **Baremos vigentes (a título indicativo)**: **B2C: 30 € o 30 USD neto** por Puesta en Contacto aceptada y ejecutada; **B2B: 20 € o 20 USD neto**. Estos importes son indicativos; el baremo actualizado puede consultarse en el panel de control. Toda evolución está sujeta al preaviso de 15 días del art. 7.11.

7.11. **Modificación del baremo de remuneración del Asistente.** SOS Expat se reserva el derecho de modificar en cualquier momento el baremo de remuneración neta del Asistente (B2C, B2B u otro componente). Toda modificación está sujeta al **preaviso de 15 días** del artículo 2.4. Durante el preaviso, el Asistente puede **rescindir sin penalización** o seguir rechazando caso por caso. **Las Puestas en Contacto ya aceptadas antes de la expiración del preaviso siguen remuneradas a la tarifa vigente en la fecha de aceptación.** A falta de rescisión, el uso continuado constituye aceptación.

---


## 8. Protección de Datos (Marco Global – RGPD/DSA)

8.1. **Funciones.** Con respecto a los datos de los Usuarios recibidos con el fin de la Puesta en Contacto, **SOS Expat y el Asistente** actúan **cada uno** como **responsable del tratamiento** para sus propias finalidades, de conformidad con el **Reglamento (UE) 2016/679 (RGPD)**.

8.2. **Bases y finalidades.** Ejecución del contrato (Puesta en Contacto), intereses legítimos (seguridad, prevención del fraude, mejora del servicio), cumplimiento legal (LCB-FT, sanciones) y consentimiento cuando sea requerido.

8.3. **Transferencias internacionales** con **garantías adecuadas** cuando sea necesario.

8.4. **Derechos y contacto.** El ejercicio de derechos se realiza a través del **formulario de contacto** disponible en la Plataforma.

8.5. **Seguridad.** Se aplican medidas técnicas y organizativas razonables; las violaciones de datos se notificarán conforme a la legislación aplicable.

8.6. El Asistente tratará los datos de acuerdo con la legislación del **País de Intervención.**

8.7. **Conformidad con la DSA.** La Plataforma opera como **servicio intermediario** en el sentido del **Reglamento (UE) 2022/2065 (Ley de Servicios Digitales)**. SOS Expat implementa mecanismos para la notificación de contenidos ilícitos y coopera con las autoridades competentes de conformidad con la DSA.

8.8. **Sanciones y embargos.** El acceso a la Plataforma y a los servicios de pago puede ser **restringido o bloqueado** en todo **país o territorio sujeto a un embargo global o a medidas restrictivas integrales** en virtud de las leyes aplicables (Proveedores de pago, UE, ONU, OFAC, HMT, o cualquier otra autoridad competente). La lista actualizada es mantenida por las autoridades antes mencionadas y prevalece; SOS Expat no establece su propia lista geopolítica. El Asistente declara no figurar en ninguna lista de sanciones y respetar los controles de exportación.

---


## 9. Propiedad Intelectual


La **Plataforma**, sus **marcas, logotipos, bases de datos y contenidos** están protegidos. **Ningún derecho** se cede al Asistente, salvo un derecho **personal, no exclusivo y no transferible** de acceso durante la vigencia de los Términos y Condiciones. Los **contenidos proporcionados por el Asistente** están sujetos a una **licencia mundial, no exclusiva** a favor de SOS Expat para su **alojamiento y exhibición en la Plataforma**.

---


## 10. Garantías, Responsabilidad e Indemnización

10.1. Ninguna garantía sobre resultados, calidad o volumen de negocio; la Plataforma se proporciona "**tal cual**".

10.2. Limitación de responsabilidad:** en la medida permitida, la responsabilidad total de SOS Expat frente al Asistente se limita a los **daños directos** y no puede exceder el total de los **Gastos de Conexión** percibidos por SOS Expat por la transacción que dio origen a la reclamación.

10.3. Exclusiones:** no se cubren daños **indirectos, consecuentes, especiales o punitivos** (pérdida de beneficios, oportunidades, clientela, daño a la reputación, costes de reemplazo, etc.).

10.4. Indemnización:** el Asistente **indemniza y garantiza** a SOS Expat (así como a sus afiliados, directivos, empleados y agentes) frente a cualquier reclamación, pérdida, daño, penalidad y gastos (incluidos honorarios de abogados) relacionados con: (i) su incumplimiento de los Términos y Condiciones o de la ley,(ii) sus contenidos,(iii) sus servicios u omisiones, (iv) la falta de autorizaciones de trabajo, inmigración o licencias.

10.5. **Renuncia a recursos.** El Asistente **renuncia expresa e irrevocablemente** a cualquier recurso contra SOS Expat por (i) daños derivados de la prestación de servicios, (ii) pérdidas indirectas, (iii) disputas contractuales con los Usuarios, (iv) cualquier fallo de los servicios prestados por el Asistente. Esta renuncia se aplica en la máxima medida permitida por la ley.

10.6. Ninguna representación:** nada implica mandato, empleo, asociación, sociedad o empresa conjunta entre SOS Expat y el Asistente.

10.7. **Fuerza mayor.** SOS Expat no será responsable de retrasos o fallos causados por eventos de **fuerza mayor** (catástrofe natural, guerra, pandemia, ciberataque, corte de electricidad o internet, decisión gubernamental, huelga, etc.).

10.8. Vigencia tras la terminación:** los arts. 5, 7, 8, 9, 10, 11 y 12 **sobreviven a la terminación**.

---


## 11. Ley Aplicable – Arbitraje – Tribunales Estonios – Acciones Colectivas

11.1. **Derecho sustantivo:** para cada Conexión, la relación SOS Expat–Asistente se rige por las leyes del **País de Intervención**, sin perjuicio de las normas de orden público locales y de las normas internacionales imperativas. A modo supletorio y para la interpretación/validez de estos Términos y Condiciones, así como para cualquier cuestión no regulada por la ley del País de Intervención, se aplica el **derecho estonio**. Para evitar toda ambigüedad, las normas imperativas aplicables a la actividad del Asistente en el País de Intervención (inmigración, derecho del trabajo / del trabajo independiente, fiscalidad, protección al consumidor, datos personales, publicidad/captación, seguridad de las personas, deontologías sectoriales en su caso) se **consideran de orden público** y **prevalecen** sobre toda estipulación contraria o ambigua. Ninguna cláusula puede imponer un comportamiento contrario a estas normas; en caso de conflicto, el Asistente se abstiene e informa a SOS Expat sin demora.

11.2. **Arbitraje obligatorio de la CCI:** cualquier disputa entre SOS Expat y el Asistente se resolverá **definitivamente** conforme al **Reglamento de Arbitraje de la CCI**. Sede: **Tallin (Estonia)**. Idioma: **francés**. El tribunal aplicará el derecho sustantivo definido en el art. 11.1. Procedimiento confidencial.

11.3. **Renuncia a acciones colectivas:** en la medida permitida, se excluyen todas las acciones colectivas/de grupo/representativas; únicamente se admiten reclamaciones individuales.

11.4. **Jurisdicción exclusiva de los tribunales de Estonia:** para cualquier asunto no arbitrable, ejecución de laudos o medidas urgentes, los tribunales estonios (**competentes en Tallin**) tendrán jurisdicción exclusiva. El Asistente renuncia a cualquier objeción por foro o inconveniencia de jurisdicción.

11.5. **Mediación previa obligatoria y mediadores identificados (Reglamento P2B).** Antes de todo arbitraje, negociación de buena fe durante **30 días**. Conforme al artículo 12 del Reglamento (UE) 2019/1150, SOS Expat identifica al menos dos (2) mediadores: **(i) CMAP (cmap.fr); (ii) WIPO Arbitration and Mediation Center (wipo.int/amc)**. SOS Expat soporta una **parte razonable** de los gastos. El fracaso es previo al arbitraje.

11.6. **Prescripción.** Toda acción del Asistente contra SOS Expat debe interponerse en el **plazo más breve entre tres (3) años** desde el hecho generador **y el plazo legal aplicable** en la jurisdicción del Asistente, sin reducir por debajo de un mínimo imperativo local no reducible.

---


## 12. Diverso


12.1. **Cesión:** SOS Expat puede ceder los Términos y Condiciones a una entidad de su grupo o a un sucesor; el Asistente no puede cederlos sin el acuerdo escrito de SOS Expat.

12.2. **Integridad:** Los Términos y Condiciones constituyen el acuerdo completo y reemplazan cualquier acuerdo previo relativo al mismo objeto.

12.3. **Notificaciones:** Se realizarán mediante publicación en la Plataforma, notificación dentro de la aplicación o a través del formulario de contacto.

12.4. **Interpretación:** Los títulos son indicativos. No se aplica la regla *contra proferentem*.

12.5. **Idiomas:** Pueden proporcionarse traducciones con fines informativos; **el inglés prevalece** para fines de interpretación en caso de discrepancia (coherente con los Términos de Abogados y Clientes).

12.6. **Nulidad parcial:** Si alguna disposición es nula o inaplicable, el resto permanece vigente; podrá reemplazarse por una disposición válida de efecto equivalente siempre que sea posible.

12.7. **No renuncia:** La falta de ejercicio de un derecho no constituye renuncia al mismo.

---


## 13. Cláusulas de protección internacional

13.1. **Confidencialidad de las comunicaciones y política de grabación.** Las comunicaciones realizadas a través de la Plataforma (mensajes, llamadas telefónicas) son **confidenciales**.

**Política de grabación:**
- (a) **Por defecto**, SOS Expat **NO graba** el contenido audio de las llamadas entre Asistente y Usuario. Solo se conservan **metadatos técnicos** (marca de tiempo, duración, identificadores, estado) con fines de facturación, antifraude y resolución de litigios técnicos;
- (b) SOS Expat **no activa ninguna grabación de audio sin el consentimiento explícito, previo y separado del Asistente Y del Usuario**, manifestado antes del inicio de la llamada por una acción positiva distinta. Ninguna grabación puede activarse unilateralmente, con la única excepción de un **requerimiento regular emanado de una autoridad judicial competente del país del Asistente o del Usuario**;
- (c) Conservación estrictamente necesaria, máximo **6 meses** (salvo prórroga judicial), conforme al RGPD y a las autoridades locales de protección de datos;
- (d) **El Asistente se prohíbe a sí mismo** grabar, transcribir íntegramente, divulgar o utilizar las comunicaciones para fines distintos a la prestación convenida, salvo autorización escrita del Usuario u obligación legal.

---


## 14. Contacto


Para cualquier pregunta o solicitud legal, contáctenos:
`;
  const defaultDe = `
# Allgemeine Nutzungsbedingungen – Expatriierte Helfer (Global)

**SOS Expat von WorldExpat OÜ** (estnische Gesellschaft, Registernr. 16885621, Sitz: Harju maakond, Tallinn, Kesklinna linnaosa, Tornimäe tn 3/5/7, 10145, Estland) – nachfolgend die « **Plattform** », « **SOS** », « **wir** »

**Version 3.2 – Letzte Aktualisierung: 26. April 2026**

---

## 1. Definitionen

**Anwendung / Website / Plattform**: Digitale Dienste, die von **WorldExpat OÜ** (estnische Gesellschaft, Registernr. 16885621, Sitz: Tallinn, Estland) betrieben werden und die Vernetzung zwischen Nutzern (den « **Nutzern** ») und expatriierten Helfern (den « **Helfern** ») ermöglichen.

**Expatriierter Helfer** („**Helfer**"): jede auf der Plattform registrierte Person, die eigenständig **nicht-juristische und nicht-medizinische Unterstützungsleistungen** für Nutzer anbietet (Orientierung, praktische Hilfe, Begleitung, informelle Übersetzungen, lokale Vernetzung usw.).

**Nutzer**: jede Person, die die Plattform verwendet, um einen Helfer zu kontaktieren.

**Vermittlung**: die technische/operative Einführung, die von der Plattform zwischen einem Nutzer und einem Helfer vorgenommen wird, die sich manifestiert durch (i) die Übermittlung von Kontaktdaten, (ii) die Eröffnung eines Kommunikationskanals (Anruf, Nachricht, Video), oder (iii) die Annahme einer über die Plattform gestellten Anfrage durch den Helfer.

**Einsatzland**: die Rechtsordnung, auf die sich die Nutzeranfrage zum Zeitpunkt der Vermittlung hauptsächlich bezieht. Fehlt eine solche, gilt das Wohnsitzland des Nutzers zum Zeitpunkt der Anfrage; bei mehreren Jurisdiktionen gilt diejenige, die dem Gegenstand der Anfrage am engsten verbunden ist.

**Vermittlungsgebühr**: **vom Nutzer an SOS Expat geschuldete Vergütung** für jede Vermittlung (Art. 7), für den ausschließlich technischen Vermittlungsdienst der Plattform. Diese Gebühr stellt in keinem Fall eine Provision, Rückerstattung oder Aufteilung der Vergütung des Helfers dar. Ihr Betrag ist im **gültigen Tarifverzeichnis** festgelegt, das im persönlichen Bereich des Helfers und des Nutzers einsehbar ist. SOS Expat kann dieses Tarifverzeichnis unter den in Artikel 2.5 vorgesehenen Bedingungen ändern.

**Zahlungsdienstleister**: Dritte, die für den Einzug der einmaligen Zahlung des Nutzers und die Verteilung der Gelder genutzt werden.

**B2B-Partner**: jede juristische Person (Unternehmen, Verband, Krankenkasse, Betriebsrat, Organisation usw.), die mit SOS Expat einen gesonderten Rahmenvertrag geschlossen hat, der vorsieht, dass sie ganz oder teilweise die Vermittlungsgebühren für ihre Mitglieder, Mitarbeiter oder Begünstigten (die « **B2B-Nutzer** ») finanziert. Eine **B2B-Vermittlung** ist eine Vermittlung, die von einem B2B-Nutzer aufgrund eines solchen Rahmenvertrags ausgelöst wird. Eine **B2C-Vermittlung** wird hingegen von einem Nutzer ausgelöst, der die Vermittlungsgebühren direkt zahlt.

**Sanktionslisten**: Listen von Personen, Einrichtungen oder Ländern, die Wirtschaftssanktionen oder Embargos unterliegen, insbesondere die Listen der OFAC (Vereinigte Staaten), der Europäischen Union, der Vereinten Nationen, des britischen Finanzministeriums (HMT) und jeder anderen zuständigen Behörde.

---

## 2. Zweck, Geltungsbereich und Annahme

2.1. Diese AGB regeln den Zugang und die Nutzung der Plattform durch Helfer.

2.2. SOS Expat agiert ausschließlich als technischer Vermittler. SOS Expat ist weder Arbeitgeber, Vertreter noch Partner der Helfer, bietet keine rechtlichen, medizinischen, steuerlichen, buchhalterischen oder regulierten Beratungen an und ist nicht Partei von Verträgen zwischen Helfern und Nutzern.

2.3. **Elektronische Zustimmung (Click-Wrap) und Nachverfolgbarkeit.** Der Helfer akzeptiert die AGB durch Anklicken des entsprechenden Feldes bei der Registrierung und/oder durch Nutzung der Plattform. Diese Handlung gilt als elektronische Unterschrift und vertragliche Zustimmung gemäß der Verordnung (EU) Nr. 910/2014 (eIDAS). SOS Expat führt **zeitgestempelte Auditprotokolle**, die Folgendes enthalten: (i) das genaue Datum und die Uhrzeit (UTC) der Annahme, (ii) die IP-Adresse des Helfers, (iii) die eindeutige Sitzungskennung, (iv) den User-Agent des Browsers, (v) die Version der akzeptierten AGB, (vi) den kryptografischen Hash des akzeptierten Dokuments und (vii) die eindeutige Kennung des Helfers. Diese Protokolle stellen einen **rechtlich durchsetzbaren Nachweis** der Annahme der AGB dar.

2.4. **Aufbewahrung der Annahmenachweise.** Gemäß DSGVO und den gesetzlichen Aufbewahrungspflichten bewahrt SOS Expat die Nachweise der AGB-Annahme für einen Zeitraum von **zehn (10) Jahren** ab dem Datum der Annahme auf, oder bis zum Abschluss eines laufenden Rechtsstreits, je nachdem, was zutrifft. Der Helfer kann auf schriftliche Anfrage über das Kontaktformular eine **Annahmebestätigung** mit den oben genannten Nachweiselementen erhalten. Diese Aufbewahrung beruht auf dem berechtigten Interesse von SOS Expat, im Streitfall über Beweise zu verfügen (Art. 6 Abs. 1 lit. f DSGVO), sowie auf der gesetzlichen Pflicht zur Aufbewahrung von Handelsverträgen.

2.5. **Änderungen (P2B-Vorankündigung).** SOS Expat kann die AGB und/oder das Gebührenverzeichnis jederzeit aktualisieren, vorbehaltlich einer **Mindestvorankündigungsfrist von fünfzehn (15) Tagen**, die dem Helfer auf einem dauerhaften Datenträger (E-Mail an die registrierte Adresse und Veröffentlichung im persönlichen Bereich) gemäß Artikel 3 der Verordnung (EU) 2019/1150 (« P2B ») mitgeteilt wird. Die Vorankündigung kann verkürzt oder entfallen, wenn: (i) die Änderung gesetzlich oder durch Entscheidung einer zuständigen Behörde vorgeschrieben ist; (ii) zwingende Sicherheits- oder Betrugspräventionsgründe vorliegen; oder (iii) bei materiellen oder typografischen Korrekturen ohne wirtschaftliche Auswirkung. Während der Vorankündigungsfrist kann der Helfer seine Beziehung zur Plattform **ohne Vertragsstrafe kündigen**. Erfolgt keine Kündigung, gilt die fortgesetzte Nutzung der Plattform nach Ablauf der Vorankündigung als Zustimmung.

2.6. **Berufliche Kapazität (B2B).** Der Helfer erklärt, ausschließlich zu beruflichen Zwecken zu handeln. Verbraucherschutzregelungen gelten nicht für die Beziehung zwischen SOS Expat und dem Helfer.

2.7. Laufzeit: unbefristet.

2.8. **Ergänzende Hinweise zur Annahme.** Der Helfer nimmt zur Kenntnis, dass die Annahme dieser AGB: (i) die Übertragung der hierin genannten Rechte und Pflichten beinhaltet, (ii) eine wesentliche Voraussetzung für den Zugang zu den Diensten der Plattform darstellt, und (iii) jederzeit durch SOS Expat technisch nachgewiesen werden kann.

---

## 3. Status des Helfers – Unabhängigkeit, Compliance und Erklärungen

3.1. Der Helfer handelt als unabhängiger Dienstleister; es entsteht kein Arbeits-, Agentur-, Mandats-, Partnerschafts- oder Joint-Venture-Verhältnis mit SOS Expat.

3.2. Der Helfer ist allein verantwortlich für: (i) die Beschaffung und Aufrechterhaltung aller erforderlichen Genehmigungen in jedem Einsatzland (Visum, Arbeitserlaubnis, Gewerbeanmeldung/Selbständigkeit, Versicherungen, lokale Lizenzen usw.); (ii) seine gültige Haftpflichtversicherung, angepasst an die Einsatzländer; (iii) die Einhaltung der lokalen Gesetze und Vorschriften (Verbraucherschutz, E-Commerce, Werbung, fairer Wettbewerb, Geldwäscheprävention/KYC falls zutreffend, Steuern, Datenschutz, Sanktionen/Export, Personensicherheit usw.).

3.3. SOS Expat überwacht oder bewertet weder den Inhalt noch die Qualität der Leistungen des Helfers und übernimmt hierfür keinerlei Verantwortung.

3.4. **Nicht regulierte Dienstleistungen.** Der Helfer verpflichtet sich, **keine regulierten Dienstleistungen** (z. B. Rechts-, Medizin-, Finanz-, Steuerberater-, Immobilienmaklerdienstleistungen etc.) **ohne** erforderliche **Genehmigungen/Lizenzen** und **ohne vollständige Einhaltung der lokalen Gesetze** anzubieten. Andernfalls verzichtet er auf diese Dienste und verweist den Nutzer an einen ordnungsgemäß befugten Fachmann.

3.5. **Versicherungen.** Der Helfer erklärt, die erforderlichen Versicherungen (berufliche Haftpflicht, falls zutreffend) für seine Tätigkeiten und Einsatzgebiete zu haben.

3.6. **Einhaltung der Gesetzgebung des Einsatzlandes.** Der Helfer verpflichtet sich, bei jeder Vermittlung die im Einsatzland geltenden Gesetze und Vorschriften zu kennen und einzuhalten, insbesondere hinsichtlich: (i) der Ausübung seiner Tätigkeit (Genehmigungen, Lizenzen, Zulassungen), (ii) des Verbraucherschutzes, (iii) des Datenschutzes, (iv) der steuerlichen Verpflichtungen, und (v) aller anderen anwendbaren zwingenden Vorschriften. Die Verantwortung für die Einhaltung dieser Vorschriften liegt ausschließlich beim Helfer.

3.7. **Erklärungen und Garantien des Helfers.** Mit der Registrierung auf der Plattform erklärt und garantiert der Helfer ausdrücklich, dass:
- (a) Er nach dem Recht seines Wohnsitz- und/oder Tätigkeitslandes **volljährig** ist;
- (b) Er die **volle Geschäftsfähigkeit** besitzt, um Verträge abzuschließen und seine Tätigkeit auszuüben;
- (c) Er nicht unter Vormundschaft, Betreuung, gerichtlichem Schutz oder einem gleichwertigen Schutzregime steht;
- (d) Gegen ihn kein **Berufs- oder Tätigkeitsverbot** besteht, weder vorübergehend noch dauerhaft;
- (e) Er auf **keiner Sanktionsliste** (OFAC, EU, UN, HMT oder andere) steht;
- (f) Er nicht wegen Straftaten **strafrechtlich verurteilt** wurde, die mit der Ausübung seiner Tätigkeit unvereinbar sind;
- (g) Alle bei der Registrierung angegebenen Informationen **korrekt, vollständig und aktuell** sind;
- (h) Er sich verpflichtet, SOS Expat **unverzüglich über Änderungen** zu informieren, die diese Erklärungen betreffen;
- (i) Er das **tatsächliche Recht hat, seine Tätigkeit** in jedem der Länder auszuüben, die er bei der Registrierung oder später in seinem Profil als "Einsatzländer" ausgewählt hat. Die Auswahl eines Einsatzlandes, in dem der Helfer nicht zur Tätigkeitsausübung berechtigt ist, stellt einen **schwerwiegenden Verstoß** gegen diese AGB dar;
- (j) Er **trägt allein die volle Verantwortung** für die Einhaltung der in jedem Einsatzland geltenden Vorschriften für seine Tätigkeit (Einwanderung, Arbeits-/Selbstständigkeitsrecht, Steuern, Verbraucherschutz, personenbezogene Daten, Werbung/Akquise, Personensicherheit, sektorale Berufsethik gegebenenfalls).

Jede falsche Erklärung stellt einen schwerwiegenden Verstoß gegen die AGB dar, der zu einem sofortigen und endgültigen Ausschluss führen kann, unbeschadet etwaiger Schadensersatzansprüche.

---

## 4. Kontoerstellung, Überprüfungen und Sicherheit

4.1. Voraussetzungen: gültige Berechtigung zur Tätigkeitsausübung in mindestens einer Jurisdiktion, Identitätsnachweise, gültige Haftpflichtversicherung (falls zutreffend).

4.2. Verfahren: Kontoerstellung, Vorlage der Dokumente, manuelle Validierung, die KYC/AML-Prüfungen über Dienstleister umfassen kann.

4.3. Richtigkeit & Aktualisierung: Der Helfer garantiert die Richtigkeit und Aktualität der Angaben; ein (1) Konto pro Helfer.

4.4. Sicherheit: Der Helfer schützt seine Zugangsdaten; jede Aktivität über das Konto gilt als von ihm vorgenommen; jede Kompromittierung ist unverzüglich zu melden.

4.5. **Zusätzliche Überprüfungen jederzeit.** SOS Expat behält sich das Recht vor, vom Helfer **jederzeit und ohne Begründung** die Vorlage oder Aktualisierung von Dokumenten zu verlangen, die seine Identität, seine Berechtigung zur Tätigkeitsausübung, seine Haftpflichtversicherung oder andere relevante Nachweise belegen. Der Helfer verpflichtet sich, auf solche Anfragen innerhalb von **sieben (7) Werktagen** zu antworten. Das Ausbleiben einer Antwort oder die Vorlage nicht konformer Dokumente kann zur sofortigen Kontosperrung führen.

4.6. **Moderation und Qualitätskontrolle.** SOS Expat setzt eine Moderationsrichtlinie um, die darauf abzielt, die Qualität und Konformität der auf der Plattform angebotenen Dienstleistungen sicherzustellen. Diese Moderation kann umfassen: (i) Überprüfung von Profilen und veröffentlichten Inhalten, (ii) Analyse von Nutzerbewertungen und Beschwerden, (iii) Kontrolle der Einhaltung der AGB und anwendbarer Gesetze, (iv) alle anderen angemessenen Qualitätskontrollmaßnahmen. Der Helfer erklärt sich mit dieser Moderation einverstanden.

4.7. **Vorübergehende Kontosperrung.** SOS Expat kann das Konto des Helfers in folgenden Fällen **sofort und ohne Vorankündigung sperren**:
- (a) Verdacht auf Betrug, Identitätsdiebstahl oder falsche Angaben;
- (b) Mehrfache oder schwerwiegende Beschwerden von Nutzern;
- (c) Nichtvorlage der gemäß Artikel 4.5 angeforderten Dokumente;
- (d) Nachgewiesener oder vermuteter Verstoß gegen die AGB oder anwendbare Gesetze;
- (e) Verhalten, das dem Image oder dem Ruf der Plattform schadet;
- (f) Anordnung einer Justiz- oder Verwaltungsbehörde;
- (g) Jeder andere berechtigte Grund nach alleinigem Ermessen von SOS Expat.
Während der Sperrung kann der Helfer nicht auf sein Konto zugreifen und keine neuen Vermittlungen erhalten. Ausstehende Zahlungen können bis zur Klärung der Situation einbehalten werden.

4.8. **Dauerhafter Ausschluss (Kündigung wegen Vertragsverletzung).** SOS Expat kann das Konto des Helfers in folgenden Fällen **dauerhaft und ohne Vorankündigung kündigen** ("Ausschluss"):
- (a) Schwerer oder wiederholter Verstoß gegen die AGB;
- (b) Nachgewiesener Betrug, vorsätzlich falsche Angaben oder Identitätsdiebstahl;
- (c) Verlust des Rechts zur Tätigkeitsausübung;
- (d) Strafrechtliche Verurteilung, die mit der Tätigkeitsausübung unvereinbar ist;
- (e) Verhalten, das Nutzern oder der Plattform schwerwiegend schadet;
- (f) Wiederholung nach einer vorübergehenden Sperrung;
- (g) Nachgewiesene Umgehung der Plattform zur Vermeidung von Vermittlungsgebühren;
- (h) Nichteinhaltung der KYC-Verifizierungspflichten trotz Mahnungen;
- (i) Jeder andere schwerwiegende Grund nach alleinigem Ermessen von SOS Expat.
Der Ausschluss ist **endgültig und unwiderruflich**. Ein ausgeschlossener Helfer kann kein neues Konto erstellen. Ausstehende Gelder können als pauschaler Schadensersatz einbehalten werden, unbeschadet weiterer Schadensersatzansprüche.

4.9. **Verfahren und Benachrichtigung.** Im Falle einer Sperrung oder eines Ausschlusses benachrichtigt SOS Expat den Helfer per E-Mail an die registrierte Adresse. Diese Benachrichtigung gibt den Grund der Maßnahme an (es sei denn, eine gesetzliche Vertraulichkeitspflicht besteht). Der Helfer hat **fünfzehn (15) Tage** Zeit, um schriftliche Stellungnahmen über das Kontaktformular einzureichen. SOS Expat prüft diese Stellungnahmen, ist aber nicht verpflichtet, die Maßnahme aufzuheben. Die Entscheidung von SOS Expat ist **nach eigenem Ermessen und endgültig**.

4.10. **Auswirkungen der Sperrung oder des Ausschlusses.** Im Falle einer Sperrung oder eines Ausschlusses:
- (a) Der Kontozugang wird sofort gesperrt;
- (b) Das Profil des Helfers wird aus den Suchergebnissen entfernt;
- (c) Laufende Vermittlungen können storniert werden;
- (d) Ausstehende Zahlungen können einbehalten oder mit Beträgen verrechnet werden, die SOS Expat geschuldet werden;
- (e) Der Helfer bleibt gemäß den Fortgeltungsklauseln an seine Verpflichtungen (Vertraulichkeit, Nicht-Abwerbung usw.) gebunden.

4.11. **Inaktivität.** Bei **Inaktivität von mehr als 365 Tagen** kann das Konto nach Benachrichtigung automatisch deaktiviert werden. Der Helfer kann sein Konto auf Anfrage reaktivieren, sofern er die erforderlichen Verifizierungsdokumente vorlegt.

4.12. **Freiwillige Kündigung.** Der Helfer kann sein Konto jederzeit schließen, nachdem er seine ausstehenden Verpflichtungen erfüllt hat. Der Schließungsantrag erfolgt über das Kontaktformular. SOS Expat führt die Schließung innerhalb von **dreißig (30) Tagen** durch.

4.13. **Elektronische Kommunikation.** Der Helfer erklärt sich damit einverstanden, alle Benachrichtigungen bezüglich der AGB, der Moderation und der Sperr-/Ausschlussmaßnahmen auf elektronischem Wege zu erhalten (E-Mail, In-App-Benachrichtigung, Veröffentlichung auf der Plattform). Der Helfer verpflichtet sich, eine gültige E-Mail-Adresse zu führen und seine Benachrichtigungen regelmäßig zu prüfen.

4.14. **Internes Beschwerdebearbeitungssystem (P2B-Verordnung).** Gemäß Artikel 11 der Verordnung (EU) 2019/1150 stellt SOS Expat dem Helfer ein **kostenloses internes Beschwerdebearbeitungssystem** zur Verfügung, das über das Kontaktformular (https://sos-expat.com/contact) zugänglich ist. SOS Expat verpflichtet sich: (i) den **Eingang** innerhalb von **sieben (7) Werktagen** zu **bestätigen**; (ii) die Beschwerde **ernsthaft und diskriminierungsfrei innerhalb einer angemessenen Frist** (in der Regel **dreißig (30) Tage**) zu bearbeiten; (iii) dem Helfer das **begründete** Ergebnis mitzuteilen; (iv) jährliche **aggregierte Statistiken** zu führen.

---

## 5. Nutzungsregeln – Qualität, Verbote, Umgehungsverbot

5.1. **Qualität & zutreffende Beschreibung.** Der Helfer beschreibt seine Dienstleistungen korrekt, ohne Erfolgsgarantie. Keine falschen Angaben über Qualifikationen oder Berufsbezeichnungen.

5.2. **Verbote.** Illegale, diskriminierende oder irreführende Inhalte; unfaire Praktiken; missbräuchliche Datennutzung; Umgehung/Reverse-Engineering der Plattform; Kollusion/Boykott zum Nachteil der Plattform; Verstöße gegen Sanktions- oder Exportgesetze; jegliche illegale Aktivitäten.

5.3. **Umgehungsverbot.** Jede neue Vermittlung mit einem neuen Nutzer über die Plattform löst die Vermittlungsgebühr aus. Es ist verboten, die Plattform zu umgehen, um diese Gebühren bei einer neuen Einführung zu vermeiden.

5.4. **Verfügbarkeit.** Die Plattform wird „wie besehen" bereitgestellt; keine Garantie für ununterbrochene Verfügbarkeit (Wartung, Störungen, höhere Gewalt). Der Zugang kann gesetzlich eingeschränkt werden.

5.5. **Vertraulichkeit.** Der Helfer schützt die Informationen der Nutzer und gibt sie nicht weiter, außer bei gesetzlicher Verpflichtung oder mit Einwilligung.

---

## 6. Beziehung Helfer–Nutzer (außerhalb der Plattform)

6.1. Nach der Vermittlung können Helfer und Nutzer außerhalb der Plattform einen Vertrag schließen. Honorare und Bedingungen werden von beiden frei festgelegt, unter Einhaltung der lokalen Gesetze.

6.2. Der Helfer stellt Leistungsbestätigungen gemäß dem lokalen Recht aus, erhebt/entrichtet anfallende Steuern und verwaltet seine Rechnungen sowie steuerlichen Verpflichtungen.

6.3. SOS Expat ist nicht verantwortlich für die Qualität, Richtigkeit oder das Ergebnis der Leistungen des Helfers oder für Vereinbarungen zwischen Helfer und Nutzer.

---

## 7. Gebühren, Einmalzahlung und Steuern

7.1. **Vermittlungsgebühr (Vergütung der Plattform).** Die Vermittlungsgebühr vergütet **ausschließlich den von SOS Expat dem Nutzer erbrachten technischen Vermittlungsdienst**. Sie ist **vom Nutzer geschuldet** und **nicht vom Helfer**. Ihr Betrag ist im **gültigen Tarifverzeichnis** festgelegt, das im persönlichen Bereich des Helfers einsehbar ist, pro Vermittlung, ohne Steuern und ohne Gebühren des Zahlungsdienstleisters. Jede Änderung des Tarifverzeichnisses erfolgt unter den Bedingungen des Artikels 2.5 (Mindestvorankündigung von fünfzehn (15) Tagen).

7.2. **Rechtliche Charakterisierung der Zahlung — zwei eigenständige und unabhängige Schulden.** Die vom Nutzer über die Plattform geleistete Zahlung gliedert sich **rechtlich in zwei eigenständige und unabhängige Schulden**, trotz ihrer Begleichung durch einen einzigen Einzug aus Gründen der operativen Bequemlichkeit:
- (a) **Schuld « Vermittlung »**: Betrag, der **vom Nutzer an SOS Expat** für den technischen Vermittlungsdienst (Vermittlungsgebühr, Art. 7.1) geschuldet wird;
- (b) **Schuld « Helfer-Vergütung »**: Betrag, der **vom Nutzer dem Helfer** für die zwischen ihnen vereinbarte Leistung geschuldet wird. Inhalt, Qualität, Ergebnis sowie die detaillierte Rechnungsstellung fallen **ausschließlich** in die Beziehung Helfer–Nutzer, außerhalb der Plattform.

**SOS Expat erhebt, fordert und hat keinen Anspruch auf Provisionen, Rückerstattungen, Aufteilungen, Prozentsätze oder Bruchteile der Vergütung des Helfers. Die Vermittlungsgebühr stellt die einzige Vergütung von SOS Expat dar und stammt ausschließlich aus der unter (a) genannten Schuld des Nutzers.**

Der Zahlungsdienstleister, der für den Teil (b) als **Zahlungsagent des Helfers** handelt, leitet diesem die erhaltene Vergütung weiter, abzüglich nur der Bearbeitungsbankgebühren und gegebenenfalls der Währungsumrechnungsgebühren. **Der Nettobetrag, den der Helfer erhalten wird, wird vor und nach jeder Transaktion in seinem Dashboard angezeigt.**

7.3. **Bankgebühren des Zahlungsdienstleisters.** Der Zahlungsdienstleister — **Stripe Payments Europe Ltd.** (Irland, EU, PCI-DSS Level 1 zertifiziert) **oder PayPal (Europe) S.à r.l. et Cie, S.C.A.** (Luxemburg, EU, PCI-DSS zertifiziert), abhängig vom Wohnsitzland und Verfügbarkeit — erhebt Bearbeitungsgebühren für jede Transaktion. **Diese Bankgebühren gehen vollständig zulasten des Helfers** und werden automatisch von dem ihm überwiesenen Betrag abgezogen.

7.4. **Wechselkurs- und Währungsumrechnungsgebühren.** Wenn die Zahlungswährung des Nutzers von der Währung des Bankkontos des Helfers abweicht, werden vom Zahlungsdienstleister **Währungsumrechnungsgebühren** erhoben. **Diese Wechselgebühren gehen vollständig zulasten des Helfers** und werden von dem ihm überwiesenen Betrag abgezogen. Die angewandten Wechselkurse sind die des Zahlungsdienstleisters zum Zeitpunkt der Überweisung. Der Helfer erkennt an und akzeptiert ausdrücklich, dass SOS Expat keine Kontrolle über diese Wechselkurse hat und jede Haftung für Währungsschwankungen oder vom Dienstleister erhobene Gebühren ablehnt.

7.5. **Berechnung des überwiesenen Nettobetrags.** Der an den Helfer überwiesene Nettobetrag wird nach folgender Formel berechnet: **Vom Nutzer gezahlter Betrag − Vermittlungsgebühr − Bankgebühren des Dienstleisters − Wechselgebühren (falls zutreffend)**. Der genaue Betrag variiert je nach den zum Zeitpunkt der Transaktion geltenden Gebühren. **Der Helfer wird vor jeder Leistung in seinem Dashboard über den genauen Betrag informiert, den er erhalten wird, und kann so eine fundierte Entscheidung treffen, ob er die Vermittlung annimmt oder nicht.**

7.6. **Fälligkeit & Nicht-Erstattung.** Die Vermittlungsgebühr wird mit der effektiven Vermittlung fällig und ist **nicht erstattungsfähig** (außer aus Kulanz von SOS Expat bei einem Fehler, der ausschließlich der Plattform zuzuschreiben ist, soweit gesetzlich zulässig).

7.7. **Rückzahlung an den Nutzer.** Wird einem Nutzer eine Rückzahlung gewährt, wird diese vom Anteil des Helfers abgezogen: SOS Expat kann den entsprechenden Betrag mit zukünftigen Zahlungen an den Helfer verrechnen oder eine direkte Rückzahlung verlangen, falls keine Zahlungen ausstehen. Die Vermittlungsgebühr verbleibt bei SOS Expat, sofern nicht nach eigenem Ermessen anders entschieden.

7.8. **Zahlungsfristen des Helfers nach Kanal.** Vorbehaltlich des Abschlusses des KYC-Prozesses (Artikel 8):
- (a) **B2C-Vermittlungen** (direkte Zahlung durch den Nutzer): Die Vergütung wird **unmittelbar nach Anrufende** vom Zahlungsdienstleister angewiesen, vorbehaltlich nur der technischen Fristen (typischerweise 1 bis 7 Werktage je nach Land und Reife des Kontos);
- (b) **B2B-Vermittlungen** (Zahlung durch den B2B-Partner): Aufgrund des differierten Abrechnungsmodells des Partners (monatlich oder « net-30 ») wird die Vergütung **innerhalb von dreißig (30) Tagen** nach dem Anruf gezahlt;
- (c) Aussetzung möglich bei Streit, Beschwerde, laufendem KYC oder anderen in den AGB vorgesehenen Umständen.

7.9. **Steuern.** Der Helfer bleibt **allein verantwortlich** für alle seine steuerlichen Verpflichtungen (Einkommensteuer, Umsatzsteuer, Sozialabgaben usw.) in seiner Wohnsitz- und/oder Tätigkeitsjurisdiktion. Die an den Helfer überwiesenen Beträge sind **Bruttobeträge**; der Helfer ist für die Anmeldung und Zahlung aller anfallenden Steuern verantwortlich. SOS Expat erhebt und führt, soweit gesetzlich vorgeschrieben, Umsatzsteuer/lokales Äquivalent nur auf die Vermittlungsgebühr ab.

7.10. **Verrechnung.** SOS Expat kann jeden Betrag, den der Helfer schuldet (aufgrund einer Nutzererstattung, Strafe oder anderer Verpflichtung), mit jedem dem Helfer geschuldeten Betrag verrechnen.

7.11. **Gebührentransparenz und Historie.** Der Helfer kann jederzeit in seinem persönlichen Dashboard einsehen: (i) vollständige Details zu jeder Transaktion, (ii) den vom Nutzer gezahlten Bruttobetrag, (iii) die abgezogene Vermittlungsgebühr, (iv) die Bankgebühren des Zahlungsdienstleisters, (v) ggf. Wechselgebühren, (vi) den überwiesenen oder zu überweisenden Nettobetrag und (vii) die Historie aller seiner Transaktionen. Diese Informationen werden während der gesamten Kontolaufzeit und **fünf (5) Jahre** nach dessen Schließung aufbewahrt und sind zugänglich.

7.12. **Automatische Steuermeldung (Richtlinie DAC7 — EU 2021/514).** Der in einem EU-Mitgliedstaat ansässige Helfer wird darüber informiert, dass SOS Expat als meldende Plattformbetreiberin verpflichtet ist, den zuständigen Steuerbehörden **jährlich** (gemäß der Richtlinie (EU) 2021/514 « DAC7 ») die Informationen zu in der EU ansässigen Helfern zu melden: Name, Adresse, Steuer-Identifikationsnummer (TIN), Wohnsitzstaat, über die Plattform erhaltener Gesamtbetrag und Anzahl der Vermittlungen, pro Quartal. Der Helfer stellt diese Informationen zur Verfügung und hält sie aktuell. Bei Versäumnis kann eine Aussetzung der Zahlungen erfolgen.

7.13. **B2B-Kanal — Vermittlungen über einen B2B-Partner.**
(a) Eine B2B-Vermittlung wird von einem B2B-Nutzer aufgrund eines Rahmenvertrags zwischen SOS Expat und einem B2B-Partner ausgelöst.
(b) **Anpassung der zwei Schulden**: die Schuld « Vermittlung » wird vom **B2B-Partner** geschuldet; die Schuld « Helfer-Vergütung » bleibt vom Nutzer dem Helfer geschuldet (sofern nicht vom Partner übernommen).
(c) **Unterschiedliche Helfer-Tarife B2C / B2B**: Der Helfer **erkennt ausdrücklich an und akzeptiert**, dass die Nettovergütung im B2B-Kanal von der im B2C-Kanal abweichen kann (höher oder niedriger). Der Kanal und der genaue Betrag werden **vor jeder Vermittlung in seinem Dashboard angezeigt**. Es besteht **keine Annahmepflicht** für ihn.
(d) Der B2B-Rahmenvertrag ist dem **Helfer nicht entgegenhaltbar**.
(e) Jede andere Bestimmung der AGB findet auf B2B-Vermittlungen Anwendung.
(f) **Geltende Tarife (zur Information)**: **B2C: 30 € oder 30 USD netto** pro angenommener und ausgeführter Vermittlung; **B2B: 20 € oder 20 USD netto**. Diese Beträge sind indikativ; das aktualisierte Tarifverzeichnis ist im Dashboard einsehbar. Jede Änderung unterliegt der 15-Tage-Vorankündigung gemäß Art. 7.14.

7.14. **Änderung des Vergütungstarifs des Helfers.** SOS Expat behält sich das Recht vor, das Nettovergütungstarifverzeichnis des Helfers (B2C, B2B oder einen anderen Bestandteil) jederzeit zu ändern. Jede Änderung unterliegt der **15-Tage-Vorankündigung** gemäß Artikel 2.5. Während der Vorankündigung kann der Helfer **ohne Vertragsstrafe kündigen** oder weiterhin Vermittlungen einzeln ablehnen. **Die vor Ablauf der Vorankündigung bereits angenommenen Vermittlungen werden weiterhin zum am Tag der Annahme geltenden Tarif vergütet.** Erfolgt keine Kündigung, gilt die fortgesetzte Nutzung als Zustimmung.

---

## 8. Zahlungen – KYC/AML – Sanktionen

8.1. Zahlungen werden über Drittanbieter abgewickelt. Der Helfer akzeptiert deren Bedingungen und KYC/AML-Verfahren.

8.2. SOS Expat kann Zahlungen bei Verdacht auf Betrug, Nichtkonformität oder aufgrund gesetzlicher Anordnung zurückhalten, verzögern oder stornieren.

8.3. **Internationale Sanktionen.** Der Helfer erklärt und garantiert:
- (a) Nicht direkt oder indirekt auf einer **Sanktionsliste** zu stehen (OFAC/SDN, EU, UN, HMT oder jede andere anwendbare Sanktionsliste);
- (b) Nicht direkt oder indirekt im Eigentum oder unter der Kontrolle einer Person oder Einrichtung zu stehen, die auf einer Sanktionsliste steht;
- (c) Die Plattform nicht für Transaktionen zu nutzen, die sanktionierte Personen oder Einrichtungen betreffen;
- (d) Alle geltenden **Exportkontrollgesetze** einzuhalten.
SOS Expat kann verpflichtet sein, die Gelder des Helfers auf Anordnung einer zuständigen Behörde **einzufrieren**.

8.4. **Sanktionen und Embargos.** Der Zugang zur Plattform und zu den Zahlungsdiensten kann in jedem **Land oder Gebiet, das einem globalen Embargo oder umfassenden restriktiven Maßnahmen** nach den anwendbaren Gesetzen unterliegt (Zahlungsdienstleister, EU, UN, OFAC, HMT oder jede andere zuständige Behörde), **eingeschränkt oder gesperrt** werden. Die aktuelle Liste wird von den genannten Behörden geführt und ist maßgebend; SOS Expat erstellt keine eigene geopolitische Liste. Der Helfer erklärt, auf keiner Sanktionsliste zu stehen und die Exportkontrollen einzuhalten.

### Nicht beanspruchte Gelder und KYC-Verifizierung

8.5. **Pflicht zur Vervollständigung des Verifizierungsprozesses (KYC).** Um Zahlungen aus über die Plattform erbrachten Leistungen zu erhalten, verpflichtet sich der Helfer, den Identitätsverifizierungsprozess (KYC - Know Your Customer) bei unserem Zahlungspartner Stripe schnellstmöglich nach der Registrierung abzuschließen. Der Helfer erkennt an, dass das Fehlen einer vollständigen KYC-Verifizierung die Überweisung von Geldern auf sein Bankkonto technisch verhindert.

8.6. **Verwahrung ausstehender Gelder.** Wenn ein Nutzer eine Zahlung für eine Leistung leistet, die von einem Helfer erbracht wurde, der seine KYC-Verifizierung nicht abgeschlossen hat, werden die dem Anteil des Helfers entsprechenden Gelder (nach Abzug der Vermittlungsgebühr der Plattform) auf einem Treuhandkonto verwahrt. Die Plattform verpflichtet sich:
- Den Helfer per E-Mail über das Vorhandensein ausstehender Gelder zu benachrichtigen;
- Regelmäßige Erinnerungen zu senden (nach 7, 30, 60, 90, 120 und 150 Tagen);
- Dem Helfer alle erforderlichen Mittel zur Verfügung zu stellen, um seine KYC-Verifizierung abzuschließen.

8.7. **Verlängerte Aufbewahrung der Gelder — Verwaltungsgebühren und Übertragung an die zuständigen Behörden.** Wird die KYC-Verifizierung nicht innerhalb von **einhundertachtzig (180) Tagen** abgeschlossen:
- (a) Pauschale, angemessene Verwaltungsgebühren, **gedeckelt auf 10 %**, decken ausschließlich die Verwaltungskosten;
- (b) Verlängerte Aufbewahrung auf einem Treuhandkonto; der Helfer kann jederzeit den KYC-Prozess abschließen;
- (c) Nach Ablauf von **5 Jahren** Übertragung der Restgelder an die **zuständige Behörde des Wohnsitzlandes des Helfers** (Caisse des dépôts in Frankreich gemäß Eckert-Gesetz; Unclaimed-Property-Programme in den USA; Dormant Assets Scheme im UK; usw.). **SOS Expat eignet sich diese Gelder in keinem Fall an.**

8.8. **Anspruch während der verlängerten Aufbewahrung.** Der Helfer kann einen begründeten Antrag mit vollständigem KYC einreichen; Prüfung innerhalb von 30 Tagen; Abzug nur der Verwaltungsgebühren (a). Bei höherer Gewalt / dokumentierter medizinischer Arbeitsunfähigkeit können die Gebühren nach angemessenem Ermessen reduziert oder erlassen werden.

8.9. **Ausdrückliche Annahme.** Dieser Artikel 8 wird bei der Registrierung ausdrücklich akzeptiert.

---

## 9. Personenbezogene Daten (globaler Rahmen – GDPR/DSA)

9.1. **Rollen.** Für Nutzerdaten, die zum Zweck der Vermittlung verarbeitet werden, handeln SOS Expat und der Helfer jeweils als eigenständige Verantwortliche für ihre jeweiligen Zwecke, gemäß der **Verordnung (EU) 2016/679 (DSGVO/GDPR)**.

9.2. **Rechtsgrundlagen & Zwecke.** Vertragserfüllung (Vermittlung), berechtigte Interessen (Sicherheit, Betrugsprävention, Verbesserung), gesetzliche Verpflichtungen (AML, Sanktionen) und ggf. Einwilligung.

9.3. **Internationale Übermittlungen** mit angemessenen Garantien, sofern erforderlich (Standardvertragsklauseln, Angemessenheitsbeschluss usw.).

9.4. **Rechte & Kontakt.** Ausübung der Rechte (Auskunft, Berichtigung, Löschung, Übertragbarkeit, Widerspruch) über das Kontaktformular der Plattform.

9.5. **Sicherheit.** Angemessene technische/organisatorische Maßnahmen; Meldung von Datenschutzverletzungen gemäß geltendem Recht (72 Stunden gemäß DSGVO).

9.6. Der Helfer verarbeitet die erhaltenen Daten gemäß dem Recht des Einsatzlandes.

9.7. **DSA-Konformität.** Die Plattform fungiert als **Vermittlungsdienst** im Sinne der **Verordnung (EU) 2022/2065 (Gesetz über digitale Dienste)**. SOS Expat implementiert Mechanismen zur Meldung illegaler Inhalte und kooperiert mit den zuständigen Behörden gemäß dem DSA.

---

## 10. Geistiges Eigentum

Die Plattform, ihre Marken, Logos, Datenbanken und Inhalte sind geschützt. Es werden keine Rechte an den Helfer übertragen, außer einem persönlichen, nicht exklusiven, nicht übertragbaren Zugangsrecht während der Laufzeit dieser AGB. Inhalte, die vom Helfer bereitgestellt werden (Profil, Foto, Beschreibungen), werden SOS Expat mit einer weltweiten, nicht exklusiven Lizenz zur Speicherung und Anzeige auf der Plattform eingeräumt.

---

## 11. Garantien, Haftung und Freistellung

11.1. Keine Garantie in Bezug auf Dienstleistungen; SOS Expat garantiert weder Ergebnis, Qualität noch Geschäftsvolumen.

11.2. Plattform „wie besehen"; keine Garantie für ständige Verfügbarkeit.

11.3. **Haftungsbeschränkung**: Soweit gesetzlich zulässig, ist die Gesamthaftung von SOS Expat gegenüber dem Helfer auf direkte Schäden beschränkt und darf den Gesamtbetrag der von SOS Expat im Zusammenhang mit der betreffenden Transaktion erhobenen Vermittlungsgebühren nicht überschreiten.

11.4. **Ausschlüsse**: keine Haftung für indirekte/folgende/besondere/punitive Schäden (z. B. entgangener Gewinn, Kundenverlust, Rufschaden usw.).

11.5. **Freistellung**: Der Helfer stellt SOS Expat (und dessen verbundene Unternehmen, Führungskräfte, Mitarbeiter, Vertreter) von allen Ansprüchen/Schäden/Kosten (einschließlich Anwaltskosten) frei, die sich aus (i) Verstößen gegen die AGB/Gesetze, (ii) seinen Inhalten, (iii) seinen Leistungen oder Unterlassungen, (iv) fehlenden Arbeitserlaubnissen/Immigration/Lizenzen ergeben.

11.6. **Verzicht auf Ansprüche.** Der Helfer **verzichtet ausdrücklich und unwiderruflich** auf alle Ansprüche gegen SOS Expat wegen (i) Schäden aus der Erbringung von Dienstleistungen, (ii) indirekter Verluste, (iii) vertraglicher Streitigkeiten mit Nutzern, (iv) jeglicher Mängel der vom Helfer erbrachten Leistungen. Dieser Verzicht gilt im gesetzlich zulässigen Umfang.

11.7. Keine Vertretung: Nichts hierin begründet ein Mandats-, Arbeits-, Partner- oder Joint-Venture-Verhältnis zwischen SOS Expat und dem Helfer.

11.8. **Höhere Gewalt.** SOS Expat haftet nicht für Verzögerungen oder Ausfälle aufgrund von **höherer Gewalt** (Naturkatastrophe, Krieg, Pandemie, Cyberangriff, Strom- oder Internetausfall, behördliche Anordnung, Streik usw.).

11.9. **Fortbestand von Klauseln.** Die folgenden Artikel bleiben nach Beendigung oder Ablauf der AGB unabhängig von der Ursache in Kraft: Artikel 2 (Annahmenachweise), 3.7 (Erklärungen), 5 (Nutzungsregeln), 7 (Gebühren und Zahlungen), 8 (KYC und Sanktionen), 9 (personenbezogene Daten), 10 (geistiges Eigentum), 11 (Haftung und Freistellung), 12 (anwendbares Recht und Schiedsgerichtsbarkeit), 13 (Schutzklauseln) und 14 (Verschiedenes). Diese Klauseln bleiben so lange in Kraft, wie es zur Entfaltung ihrer Wirkung erforderlich ist.

---

## 12. Anwendbares Recht – Schiedsgerichtsbarkeit – Estnische Gerichtsbarkeit – Sammelklagen

12.1. **Anwendbares Recht.** Diese AGB, ihre Auslegung, Gültigkeit und Durchführung unterliegen ausschließlich dem **estnischen Recht** unter Ausschluss seiner Kollisionsnormen. Für Fragen bezüglich der Erbringung von Dienstleistungen in einem bestimmten Einsatzland gelten die dortigen zwingenden Vorschriften und öffentlichen Ordnung ergänzend, soweit sie zwingend sind. Zur Vermeidung von Zweifeln gelten die zwingenden Vorschriften, die für die Tätigkeit des Helfers im Einsatzland gelten (Einwanderung, Arbeits-/Selbstständigkeitsrecht, Steuern, Verbraucherschutz, personenbezogene Daten, Werbung/Akquise, Personensicherheit, sektorale Berufsethik gegebenenfalls), als **zwingendes öffentliches Recht** und **gehen** jeder gegenteiligen oder mehrdeutigen Bestimmung **vor**. Keine Klausel kann ein Verhalten vorschreiben, das diesen Vorschriften zuwiderläuft; im Konfliktfall enthält sich der Helfer und informiert SOS Expat unverzüglich.

12.2. **Verbindliches internationales Schiedsverfahren.** Jeder Streit, jede Meinungsverschiedenheit oder jeder Anspruch, der sich aus diesen AGB ergibt oder damit zusammenhängt, einschließlich ihrer Gültigkeit, Auslegung, Durchführung oder Beendigung, wird endgültig durch **Schiedsverfahren** gemäß der Schiedsgerichtsordnung der **Internationalen Handelskammer (ICC)** entschieden.
- **Sitz des Schiedsverfahrens**: Tallinn, Estland;
- **Sprache des Schiedsverfahrens**: **Englisch**;
- **Anzahl der Schiedsrichter**: ein (1) Einzelschiedsrichter, es sei denn, der Streitwert übersteigt 100.000 €, in welchem Fall drei (3) Schiedsrichter;
- **Materielles Recht**: estnisches Recht (Art. 12.1);
- **Verfahren**: vertraulich. Die Parteien verpflichten sich, die Existenz, den Inhalt oder das Ergebnis des Schiedsverfahrens nicht offenzulegen, es sei denn, dies ist gesetzlich vorgeschrieben oder zur Vollstreckung des Schiedsspruchs erforderlich.
Der Schiedsspruch ist für die Parteien **endgültig und bindend**. Die Parteien verzichten im gesetzlich zulässigen Umfang auf jeden Aufhebungsantrag.

12.3. **Verzicht auf Sammelklagen und Geschworenengerichte.** Im größtmöglichen gesetzlich zulässigen Umfang:
- (a) Der Helfer verzichtet auf die Teilnahme an **Sammelklagen, Gruppenklagen oder Vertretungsklagen** gegen SOS Expat;
- (b) Jeder Streit wird **ausschließlich individuell** beigelegt;
- (c) Der Helfer verzichtet ausdrücklich auf jedes **Recht auf ein Geschworenengericht** (Jury Trial Waiver);
- (d) Der Helfer verzichtet auf **Class Actions, Consolidated Actions oder Representative Actions** nach US-amerikanischem Recht oder gleichwertigem Recht.

12.4. **Ausschließliche Zuständigkeit estnischer Gerichte.** Für nicht schiedsfähige Ansprüche nach anwendbarem Recht, für dringende einstweilige Maßnahmen vor Konstituierung des Schiedsgerichts und für die Vollstreckung von Schiedssprüchen sind die **Gerichte in Tallinn (Estland)** **ausschließlich zuständig**. Der Helfer:
- (a) Stimmt dieser Zuständigkeit unwiderruflich zu;
- (b) Verzichtet auf jede Einrede des **Forum non conveniens**;
- (c) Verzichtet auf jede Einrede der fehlenden persönlichen Zuständigkeit;
- (d) Akzeptiert, dass jede Zustellung an die auf der Plattform registrierte E-Mail-Adresse erfolgen kann.

12.5. **Obligatorische vorherige Mediation und benannte Mediatoren (P2B-Verordnung).** Vor jedem Schiedsverfahren Verhandlung in gutem Glauben für **30 Tage**. Gemäß Artikel 12 der Verordnung (EU) 2019/1150 benennt SOS Expat mindestens zwei (2) Mediatoren: **(i) CMAP (cmap.fr); (ii) WIPO Arbitration and Mediation Center (wipo.int/amc)**. SOS Expat trägt einen **angemessenen Anteil** der Gebühren. Das Scheitern ist Voraussetzung für das Schiedsverfahren.

12.6. **Verjährung.** Jede Klage des Helfers gegen SOS Expat muss innerhalb der **kürzeren der Fristen von drei (3) Jahren** ab dem auslösenden Ereignis **und der gesetzlich anwendbaren Frist** in der Jurisdiktion des Helfers erhoben werden, ohne unterhalb eines lokal nicht reduzierbaren zwingenden Mindestmaßes zu unterschreiten.

---

## 13. Internationale Schutzklauseln

13.1. **Antikorruption.** Der Helfer verpflichtet sich, keine Bestechungsgelder oder unzulässige Vorteile an öffentliche oder private Amtsträger anzubieten, zu versprechen oder zu zahlen. Er hält die geltenden Antikorruptionsgesetze ein (FCPA, UK Bribery Act, Sapin-II-Gesetz usw.).

13.2. **Vertraulichkeit der Kommunikation und Aufzeichnungsrichtlinie.** Die über die Plattform geführte Kommunikation (Nachrichten, Telefonate) ist **vertraulich**.

**Aufzeichnungsrichtlinie:**
- (a) **Standardmäßig** zeichnet SOS Expat den Audio-Inhalt der Anrufe zwischen Helfer und Nutzer **NICHT auf**. Es werden nur **technische Metadaten** für Abrechnung, Betrugsbekämpfung und Lösung technischer Streitigkeiten gespeichert;
- (b) SOS Expat **aktiviert keine Audio-Aufzeichnung ohne die ausdrückliche, vorherige und gesonderte Einwilligung des Helfers UND des Nutzers**, die vor Anrufbeginn durch eine eindeutige positive Handlung erteilt wird. Keine Aufzeichnung kann einseitig ausgelöst werden, mit der einzigen Ausnahme einer ordnungsgemäßen Anordnung einer **zuständigen Justizbehörde des Landes des Helfers oder des Nutzers**;
- (c) Aufbewahrung strikt erforderlich, höchstens **6 Monate** (außer bei gerichtlicher Verlängerung), gemäß DSGVO und lokalen Datenschutzbehörden;
- (d) **Der Helfer selbst ist verpflichtet**, die Gespräche nicht aufzuzeichnen, vollständig zu transkribieren, offenzulegen oder zu anderen Zwecken als der vereinbarten Dienstleistung zu verwenden, außer mit schriftlicher Genehmigung des Nutzers oder gesetzlicher Verpflichtung. Jeder Verstoß kann zur sofortigen Kontosperrung und zur zivil- und/oder strafrechtlichen Haftung des Helfers führen.

13.3. **Abwerbeverbot.** Während der Laufzeit dieser AGB und **zwölf (12) Monate** nach deren Beendigung darf der Helfer Nutzer, die er über die Plattform kennengelernt hat, nicht direkt abwerben, um die Vermittlungsgebühren zu umgehen.

13.4. **Alleinige Verantwortung des Helfers.** Der Helfer ist **allein verantwortlich** für die Qualität, Richtigkeit und Rechtmäßigkeit der von ihm erbrachten Leistungen. Der Helfer ist **vollständig verantwortlich** für die Einhaltung der gesetzlichen und regulatorischen Bestimmungen des Landes, in dem er tätig ist. SOS Expat **garantiert nicht** die vom Helfer erbrachten Leistungen und **lehnt jede Haftung** für Schäden ab, die einem Nutzer aufgrund der Leistungen des Helfers entstehen.

13.5. **Kein Beratungsverhältnis.** SOS Expat ist **kein Beratungsunternehmen** und kein Anbieter von rechtlichen, steuerlichen, medizinischen oder regulierten Dienstleistungen. Die Plattform beschränkt sich auf die **Vermittlung**. Jedes Beratungsverhältnis wird **ausschließlich** zwischen dem Helfer und dem Nutzer **außerhalb** von SOS Expat begründet.

13.6. **Streitigkeiten zwischen Helfer und Nutzer.** Jede Streitigkeit zwischen einem Helfer und einem Nutzer fällt **ausschließlich** in deren direkte Beziehung. SOS Expat **greift nicht** in solche Streitigkeiten ein und **kann nicht** als Partei, Garant oder Vermittler in Anspruch genommen werden. SOS Expat ist **in keinem Fall verantwortlich** für Streitigkeiten zwischen Helfer und Nutzer.

---

## 14. Verschiedenes

14.1. **Abtretung**: SOS Expat kann die AGB an ein Konzernunternehmen oder einen Rechtsnachfolger übertragen; der Helfer darf dies nur mit schriftlicher Zustimmung von SOS Expat.

14.2. **Gesamtheit**: Diese AGB stellen die vollständige Vereinbarung dar und ersetzen alle früheren Vereinbarungen zum selben Gegenstand.

14.3. **Mitteilungen**: Durch Veröffentlichung auf der Plattform, In-App-Benachrichtigung oder über das Kontaktformular.

14.4. **Auslegung**: Überschriften dienen nur der Übersicht. Keine Auslegungsregel contra proferentem.

14.5. **Sprachen**: Übersetzungen können bereitgestellt werden; für die Auslegung ist die **englische Fassung maßgeblich**.

14.6. **Teilnichtigkeit und Trennbarkeit.** Wird eine Bestimmung dieser AGB von einem zuständigen Gericht oder Schiedsrichter für nichtig, ungültig oder nicht durchsetzbar erklärt:
- (a) Berührt diese Nichtigkeit nicht die Gültigkeit der übrigen Bestimmungen, die in Kraft bleiben;
- (b) Die nichtige Bestimmung wird, soweit möglich, durch eine gültige Bestimmung mit gleichwertiger wirtschaftlicher Wirkung ersetzt;
- (c) Die Parteien verhandeln in gutem Glauben, um eine Ersatzbestimmung zu vereinbaren.

14.7. **Geografische Trennbarkeit.** Ist eine Bestimmung dieser AGB in einer bestimmten Jurisdiktion nicht durchsetzbar oder rechtswidrig:
- (a) Gilt diese Bestimmung nur in dieser Jurisdiktion nicht;
- (b) Sie bleibt in allen anderen Jurisdiktionen vollständig anwendbar;
- (c) Die lokale Nichtdurchsetzbarkeit berührt nicht die globale Gültigkeit der AGB.

14.8. **Kein Verzicht.** Das Unterlassen oder die Verzögerung der Ausübung eines Rechts durch SOS Expat stellt keinen Verzicht auf dieses Recht dar. Jeder Verzicht muss ausdrücklich und schriftlich erfolgen. Ein einmaliger Verzicht stellt keinen allgemeinen Verzicht dar.

14.9. **Unabhängigkeit der Klauseln.** Jede Klausel dieser AGB ist unabhängig. Die Unwirksamkeit einer Klausel führt nicht zur Unwirksamkeit der Klauseln über Haftungsbeschränkung, Freistellung, Schiedsgerichtsbarkeit oder Zuständigkeit, die im größtmöglichen gesetzlich zulässigen Umfang anwendbar bleiben.

14.10. **Dritte.** Diese AGB gewähren Dritten keine Rechte (mit Ausnahme der ausdrücklich genannten verbundenen Unternehmen von SOS Expat). Kein Dritter kann sich auf die Bestimmungen der AGB berufen.

---

## 15. Kontakt

Für rechtliche oder sonstige Anfragen: **https://sos-expat.com/contact**
`;
  const defaultCh = `
# 使用条款 – 海外互助者（全球版）

**SOS Expat by WorldExpat OÜ（“**平台**”、“**SOS**”、“**我们**”） 

**版本 3.2 – 最后更新：2026 年 4 月 26 日**

## 1. 定义

**海外互助者（“互助者”）：** 任何在平台上注册、以独立身份向用户提供非法律、非医疗的协助服务的个人（如指导、实际帮助、非正式翻译、当地联系等）。

**用户：** 使用平台联系互助者的任何人。

**匹配（联系）：** 平台在用户与互助者之间进行的技术/操作层面的引介（包括联系方式传递、沟通渠道开启、或互助者通过平台接受请求）。

**服务国家：** 在匹配时用户需求主要涉及的司法辖区；若无明确，则以请求日期的用户居住国为准。

**匹配费用（"Frais de Mise en relation"）：** **由用户向 SOS Expat 支付**的费用，针对每次匹配（第 7 条），仅作为平台所提供的技术匹配服务的对价。该费用在任何情况下均不构成对互助者报酬的佣金、回扣或分成。其金额由**现行费率表**确定，可在互助者及用户的个人账户中查询。SOS Expat 可按第 2.4 条规定的条件修改该费率表。

**支付服务提供商：** 处理收款及资金分配的第三方服务。

**B2B 合作伙伴：** 任何与 SOS Expat 签订框架合同的法人实体（企业、协会、互助会、企业委员会、组织等），合同约定其全部或部分承担其成员、员工或受益人（"**B2B 用户**"）的匹配费用。**B2B 匹配**是指由 B2B 用户在该框架合同下发起的匹配。相对地，**B2C 匹配**是指由用户直接支付匹配费用所发起的匹配。

---

## 2. 目的、适用范围与接受

2.1. 本使用条款规范互助者对平台的访问与使用。

2.2. SOS Expat 仅作为技术性匹配中介。 SOS Expat 不是互助者的雇主、代理或合作伙伴，不提供任何法律、医疗、税务、会计或其他受监管的建议，也不是互助者与用户之间合同的当事方。

2.3. **电子接受（点击同意):** 注册和/或使用平台即表示接受本条款，构成电子签署与合同同意。SOS 可保留技术性证据（时间戳、标识符等）。

2.4. **修改（P2B 预先通知）。** SOS Expat 可随时更新条款和/或费率表，但须按照欧盟 2019/1150 号条例（"P2B"）以持久载体（注册邮箱及个人账户公告）向互助者**至少提前 15 天通知**。在以下情况下可缩短或免除预先通知：(i) 法律或主管机关决定所要求的修改；(ii) 出于安全或防欺诈的紧迫原因；(iii) 不影响经济的实质性或排印更正。在预先通知期内，互助者可**无罚款解除**与平台的关系。如未解除，预先通知期满后继续使用即视为接受。

2.5. **专业身份（B2B):** 互助者声明其仅为职业目的行事；消费者保护法律不适用于 SOS Expat–互助者关系。

---

## 3. 互助者身份 – 合规、许可与责任

3.1. **独立性:** 互助者以独立专业人士身份行事；SOS Expat 与互助者之间不构成雇佣、代理、合作或合资关系。

3.2. **工作许可与移民身份** 互助者全权负责在每个服务国家获得并保持所有必要许可（签证、工作许可证、商业登记/个体经营、保险、当地执照等）。SOS Expat 不核实这些许可，也不承担任何责任。

3.3. **非受监管服务:** 互助者承诺不得提供受监管的服务（如法律、医疗、金融、会计、房地产咨询等），除非持有必要的许可/执照并完全遵守当地法律。否则，互助者应避免此类服务，并将用户转介给具有合法资质的专业人士（如注册律师）。

3.4. **一般合规** 互助者遵守适用法律/法规（消费者保护、电子商务、广告/营销、公平竞争、反洗钱/客户尽调（如适用）、税务、数据保护、制裁/出口管制、人员安全等）。

3.5. **保险** 互助者声明已持有必要保险（如职业责任险），涵盖其业务活动及服务地区。

3.6. **保密性** 互助者应保护用户信息，除法律要求或经同意外，不得泄露。

3.7. **互助者的声明与保证。** 互助者注册即明确声明并保证：(a) 其已成年且具有完全民事行为能力；(b) 其已取得或将在**任何服务提供之前**取得服务国家所要求的**所有授权**（签证、工作许可、个体经营/自由职业登记、税务登记、行业牌照）；(c) 其**不会提供任何属于受监管职业**（律师、公证员、医生、会计师、财务顾问、房地产经纪人等）的服务，除非持有所要求的资格证书；(d) 其未受到任何**禁止执业**处分；(e) 其未列入**任何制裁名单**（OFAC/SDN、欧盟、联合国、HMT）；(f) 其所提供的信息真实、完整并将持续更新；(g) 其独自承担遵守适用规则的全部责任。任何虚假声明构成严重违反本条款。

---

## 4. 账户、审查与安全

4.1. **注册:** 每位互助者仅可拥有一个账户；所填信息必须准确、完整并保持更新（身份、联系方式、服务描述、地区范围等）。

4.2. **验证:** SOS Expat 可进行合理检查（身份验证、资料一致性、制裁/尽调筛查等），并可因安全、合规或服务质量原因拒绝/暂停/撤销访问。

4.3. **账户安全:** 互助者须保护其登录凭证。任何账户下的操作均视为互助者本人行为。

4.4. **不活动。** 账户在365天不活动后可能会被自动停用。互助者可在履行义务后随时关闭其账户。SOS Expat 可因违反条款而暂停或终止账户。

4.5. **电子通信。** 互助者同意通过电子方式（电子邮件、应用内通知、平台发布）接收通知。

4.6. **内部投诉处理系统（P2B 条例）。** 根据欧盟 2019/1150 号条例第 11 条，SOS Expat 通过联系表单为互助者提供**免费的内部投诉处理系统**。SOS Expat 承诺：(i) 在 **7 个工作日内**确认收到任何投诉；(ii) 在合理期限内（通常为 **30 天**）以严肃、不歧视的方式处理投诉；(iii) 以清楚易懂的语言向互助者传达**附理由的**处理结果，并指明后续救济途径（第 11.5 条调解、第 11.2 条仲裁）；(iv) 保留有关该系统运行的**汇总统计数据**，每年公布。

---

## 5. 使用规则 – 质量、禁止行为、禁止规避

5.1. **质量与真实描述:** 互助者必须准确描述服务内容，不得承诺结果。不得虚假宣称专业身份（如未具备受监管职业资格）。

5.2. **禁止事项。** 禁止违法、歧视或误导性内容；不正当竞争；滥用数据；规避或逆向工程平台；恶意合谋/抵制；违反制裁或出口限制；任何非法活动。

5.3. **禁止规避。** 每次通过平台与新用户建立的新匹配均须支付匹配费用（第 7 条）。严禁为避免该费用而绕过平台进行新引介。

5.4. **可用性。** 平台按**“原样”**提供；不保证持续可用（维护、事故、不可抗力等）。在法律要求下可限制访问。

---

## 6. 协助者–用户关系（平台外）

6.1. 匹配后，互助者与用户可在平台外自行签订合同。服务费与条款由双方自由约定，须符合当地法律。

6.2. 互助者应提供符合当地法律的服务确认/条款，并自行处理开票与纳税义务。

6.3. SOS Expat 不对互助者服务的质量、准确性或结果负责，也不对互助者与用户之间的任何承诺承担责任。

---

## 7. 费用、单次付款与税务

7.1. **匹配费用（平台报酬）。** 匹配费用**仅**作为 SOS Expat 向**用户**提供的技术匹配服务的对价。该费用**由用户支付**，**不由互助者支付**。其金额由**现行费率表**确定，可在互助者个人账户中按匹配查询，不含税且不含支付服务提供商的费用。任何费率修改均按第 2.4 条的条件进行（最少 15 天预先通知）。

7.2. **付款的法律性质 — 两笔独立、互不依赖的债务：**
- (a) **"匹配"债务**：由用户对 SOS Expat 应付；
- (b) **"互助者报酬"债务**：由用户对互助者应付，针对相关服务，与平台无关。

**SOS Expat 不收取互助者报酬的任何佣金、分成或部分。** 匹配费用是 SOS Expat 唯一的报酬，仅来源于 (a) 项。

支付服务提供商作为 (b) 项的**互助者收款代理**，扣除银行费及兑换费后将净额转付给互助者。在每次交易前后，将在互助者控制台显示确切金额。

7.3. **互助者按渠道的付款时限。** 在 KYC 完成的前提下：
- (a) **B2C**：通话**结束后立即**付款（根据国家及账户成熟度，1–7 个工作日）；
- (b) **B2B**：通话后**30 天**付款（合作伙伴延期开票）；
- (c) 因争议、KYC 或本条款所述其他情况而暂停。

7.4. **DAC7 — 欧盟 2021/514 号指令。** 居住于欧盟的互助者：SOS Expat 须**每年向**税务机关申报（姓名、地址、TIN、所在国、收入总额、匹配次数，按季度划分）。互助者负责提供并保持更新。如未提供，可能暂停付款。

7.5. **B2B 渠道 — 通过 B2B 合作伙伴的匹配。**
(a) 范围：B2B 用户根据框架合同发起的匹配。
(b) 调整：**"匹配"债务**由 **B2B 合作伙伴**应付；**"互助者报酬"债务**由用户对互助者应付（除非合作伙伴承担）。
(c) **B2C/B2B 互助者费率不同 — 互助者明确接受。** B2B 净报酬可能与 B2C 不同。每次匹配前会在控制台显示渠道及金额。互助者无任何接受义务。
(d) B2B 框架合同**不能对抗**互助者。
(e) 任何其他规定均适用于 B2B。
(f) **现行费率表（参考）**：**B2C：30 欧元或 30 美元净额**；**B2B：20 欧元或 20 美元净额**。仅供参考；最新费率见控制台；任何变更适用 15 天预先通知（第 7.6 条）。

7.6. **互助者报酬费率表的修改。** 任何修改（B2C/B2B/其他）均**适用 15 天预先通知**（第 2.4 条）。预先通知期内：可无罚款解除关系或逐案拒绝。已接受的匹配按原费率执行。预先通知期后继续使用即视为接受。

7.7. **应付且不退款。** 匹配费用自匹配达成即应付且不可退还（除非 SOS Expat 出于善意、且在法律允许范围内、因平台自身原因造成失败而决定退款）。

7.8. **用户退款。** 若用户获批退款，该金额从互助者份额中扣除：SOS Expat 可抵扣/保留未来支付款，或在无未来支付时要求返还。匹配费用不退，除非 SOS Expat 自主决定。

7.9. **货币与兑换。** 平台可支持多种货币；可能适用服务商汇率及手续费。

7.10. **税费。** 互助者自行承担所有适用税费（增值税、所得税、社保等）。SOS Expat 在必要时收取/代缴匹配费用相关增值税或同等税项。

7.11. **抵销。** SOS Expat 可将互助者所欠款项与其应收款项相互抵销。

---

## 8. 个人数据（全球框架 – GDPR/DSA）

8.1. **角色。** 就为匹配目的接收的用户数据而言，SOS Expat 与互助者各自依据**欧盟法规 2016/679 (GDPR)** 为其自身目的担任独立的数据控制者。

8.2. **法律依据与目的。** 合同履行（匹配）、合法利益（安全、防欺诈、改进）、法律合规（反洗钱、制裁）及必要时的同意。

8.3. 国际传输在必要时附带适当保障措施。

8.4. **制裁与禁运。** 平台访问及支付服务在以下国家或地区可能被**限制或封锁**：根据适用法律法规，特别是支付服务提供商、欧盟、联合国、OFAC（美国）、HMT（英国）或任何其他主管机关，受**全面禁运或全面限制措施**约束的国家或地区。最新名单由前述机关维护并具有效力；SOS Expat 不建立或发布自己的地缘政治名单。互助者声明**不在任何国际制裁名单**（OFAC/SDN、欧盟、联合国、HMT）上，并**遵守适用的出口管制**。

8.5. **权利与联系。** 用户可通过平台的联系表单行使相关权利。

8.6. **安全。** 采取合理的技术和组织措施；数据泄露将依照适用法律通报。

8.7. 互助者根据服务国家法律处理数据。

8.8. **DSA 合规。** 平台作为**欧盟法规 2022/2065（数字服务法）**下的**中介服务**运营。SOS Expat 实施非法内容举报机制，并依据 DSA 与主管当局合作。

8.9. **延迟存放资金 — 费用与转交主管机关。** 如 KYC 在 180 天内未完成：
- (a) 管理费**上限为 10%**，仅用于行政成本；
- (b) 延长保管；KYC 可随时完成；
- (c) 经过 **5 年**后，转交**互助者居住国的失踪资金主管机关**（法国通过 Eckert 法律的 Caisse des dépôts、美国 unclaimed property、英国 Dormant Assets）。**SOS Expat 不会占有该等资金。**

8.10. **延长保管期间的索赔。** 附理由的请求 + 完整 KYC；30 天内审查；扣除 (a) 项费用。不可抗力 / 医疗无能力 = 费用可减少/取消。

8.11. **第 8 条的明确接受。**

---

## 9. 知识产权

平台及其商标、标识、数据库和内容受保护。除在条款有效期内享有个人的、非独占、不可转让的访问权外，互助者不获得任何权利。互助者提供的内容授予 SOS Expat 全球性、非独占许可，用于平台的托管与展示。

---

## 10. 免责声明、责任与赔偿

10.1. 不作任何保证，包括成果、质量或业务量；平台按**“原样”**提供。

10.2. **责任限制：** 在法律允许范围内，SOS Expat 对互助者的总责任仅限于直接损失，且不得超过 SOS Expat 在引发索赔的匹配交易中所收取的匹配费用总额。

10.3. **排除责任：** SOS Expat 不承担任何间接、连带、特殊或惩罚性损失（包括利润损失、机会损失、客户流失、声誉损害、替代成本等）。

10.4. **赔偿义务：** 互助者应赔偿并保障 SOS Expat（及其关联方、管理人员、员工、代理）免受因以下情况产生的任何索赔、损害、罚款或费用（包括律师费）：(i) 违反本条款/法律，(ii) 提供的内容，(iii) 服务或疏忽行为，(iv) 无合法工作/移民/执照许可。

10.5. **追索权放弃。** 互助者**明确且不可撤销地放弃**对 SOS Expat 的任何追索权，包括：(i) 因提供服务产生的损害，(ii) 间接损失，(iii) 与用户的合同纠纷，(iv) 互助者所提供服务的任何缺陷。此放弃在法律允许的最大范围内适用。

10.6. **无代表关系。** 本条款不构成 SOS Expat 与互助者之间的代理、雇佣、合作或合资关系。

10.7. **不可抗力。** SOS Expat 不对因**不可抗力**事件（自然灾害、战争、流行病、网络攻击、电力或互联网中断、政府决定、罢工等）造成的延迟或故障承担责任。

10.8. **存续条款。** 第 5、7、8、9、10、11、12 条在终止后仍有效。

---

## 11. 适用法律 – 仲裁 – 爱沙尼亚司法管辖 – 集体诉讼放弃

11.1. **实体法及当地强制规范的优先适用。** 每次匹配中，SOS Expat–互助者关系受**服务国家法律**管辖，受当地强制性规则及国际强制规范约束。**补充适用**及本条款的解释/效力或任何未被服务国家法律规制的事项，**爱沙尼亚法**适用。**为避免任何歧义**，适用于互助者在服务国家活动的强制性规则（移民、劳动法/独立工作法、税务、消费者保护、个人数据、广告/招揽、人身安全、行业职业道德规则）**视为公共秩序**，**优先于**本条款中任何相反或不明确的规定。条款中任何条款均不得被解释为强制或允许互助者采取违反这些规则的行为；如有冲突，互助者应避免并立即通知 SOS Expat。

11.2. **强制 ICC 仲裁：** SOS Expat 与互助者的任何争议应根据国际商会仲裁规则（ICC）最终解决。仲裁地：爱沙尼亚塔林。 语言：法语。 仲裁庭适用第 11.1 条所述实体法。程序保密。

11.3. **集体诉讼放弃：** 在法律允许范围内，任何集体/代表性诉讼均被排除；仅允许个人索赔。

11.4. **爱沙尼亚法院专属管辖：** 对于不可仲裁事项、裁决执行或紧急措施，爱沙尼亚法院（塔林有管辖权）享有专属管辖权。互助者放弃任何关于法院选择或不便法院的异议。

11.5. **强制性预先调解及指定调解员（P2B 条例）。** 任何仲裁前，双方应通过**善意谈判**尝试在自争议书面通知之日起 **30 天**内友好解决争议。根据欧盟 2019/1150 号条例第 12 条，SOS Expat 指定至少**两 (2) 位专业调解员**，独立且合理可及，互助者可从中选择：**(i) 巴黎调解与仲裁中心 (CMAP) — cmap.fr**；**(ii) WIPO 仲裁与调解中心（日内瓦）— wipo.int/amc**。SOS Expat 承担**合理部分的调解费用**，根据具体情况善意评估，特别是争议金额较小时。调解失败是提起仲裁请求的先决条件。

11.6. **诉讼时效。** 互助者对 SOS Expat 提起的任何诉讼或索赔，必须在自事件发生起**三 (3) 年**与互助者所在司法辖区**适用法定期限**之间的**较短期限**内提起，否则丧失权利。本条款无意也无效力将时效缩短至当地强制最低期限以下。

---

## 12. 其他条款

12.1. **转让。** SOS Expat 可将本条款转让给其关联实体或继承方；互助者未经书面同意不得转让。

12.2. **完整协议。** 本条款构成完整协议，取代此前关于同一主题的任何协议。

12.3. **通知。** 通过平台公告、应用内通知或联系表单发出。

12.4. **解释。** 标题仅为方便阅读，不具法律效力；不适用**“不利起草方解释”**规则。

12.5. **语言。** 可能提供翻译版本；如有歧义，以法语版为准。

12.6. **可分割性。** 若任何条款无效/不可执行，其余条款仍有效；可在可能范围内以具有等效效力的有效条款替代。

12.7. **权利不弃。** 未行使权利不构成放弃。

---

## 13. 国际保护条款

13.1. **反腐败。** 互助者承诺不向公职人员或私人提供、承诺或支付贿赂或不正当利益。其遵守适用的反腐败法律（FCPA、英国贿赂法、Sapin II 法等）。

13.2. **沟通保密及录音政策。** 通过平台进行的沟通（消息、电话）均**保密**。

**录音政策：**
- (a) **默认情况下**，SOS Expat **不录制**互助者与用户之间通话的**音频内容**。仅保留**技术元数据**（时间戳、时长、Twilio 标识符、状态），用于计费、防欺诈和解决技术争议；
- (b) **未经互助者和用户明确、事先且单独的同意**，不进行任何音频录制，且通话开始前需以单独的肯定行动表达。SOS Expat 不能单方面触发任何录音，唯一例外是相关国家**主管司法机关**的**合法调查请求**；
- (c) 当例外情况下进行录音时，按 GDPR 及当地数据保护机关建议，保留期严格限于其目的所需，最长 **6 个月**（除非司法程序要求延长）；
- (d) **互助者本人禁止**记录、完整转录、披露或将沟通用于约定服务以外的目的，除非用户书面授权或法律义务。任何违反可能导致立即暂停账户并引发互助者的民事和/或刑事责任。

13.3. **不招揽。** 在条款有效期及终止后**12 个月**内，互助者承诺不直接招揽通过平台认识的用户以避免匹配费用。

13.4. **互助者的专属责任。** 互助者对其提供的服务的质量、准确性和合法性**承担专属责任**。SOS Expat **不保证**互助者提供的建议、信息或服务，并对互助者服务给用户造成的任何损害**免责**。

13.5. **无咨询关系。** SOS Expat **不是咨询公司**，亦非法律、税务、医疗或受监管服务的提供者。平台仅限于**匹配**。任何咨询关系**仅**在互助者与用户之间建立，**与** SOS Expat **无关**。

13.6. **互助者-用户争议。** 互助者与用户之间的任何争议**仅**属于其直接关系。SOS Expat **不介入**这些争议，**不能**作为当事方、保证人或调解人**被追究**。

---

## 14. 联系方式

如有任何问题或法律请求，请联系我们：
`;

  const defaultAr = `
# شروط وأحكام الاستخدام العامة – المغتربون المساعدون (عالمي)

**SOS Expat** هي خدمة تديرها **WorldExpat OÜ**، شركة مسجلة وفق القانون الإستوني (سجل الشركات رقم 16885621)، ومقرها الرئيسي في Harju maakond, Tallinn, Kesklinna linnaosa, Tornimäe tn 3/5/7, 10145، إستونيا (يُشار إليها فيما يلي بـ"**المنصة**" أو "**SOS**" أو "**SOS Expat**" أو "**نحن**").

**الإصدار 3.2 – آخر تحديث: 26 أبريل 2026**

---

## 1. التعريفات

**المغترب المساعد** ("**المساعد**"): أي شخص طبيعي مسجل على المنصة لتقديم خدمات مساعدة **غير قانونية وغير طبية** بصفة مستقلة للمستخدمين (التوجيه، الإجراءات العملية، المرافقة، الترجمة غير الرسمية، التواصل المحلي، إلخ).

**المستخدم**: أي شخص يستخدم المنصة للتواصل مع مساعد.

**التوصيل / الربط**: التقديم التقني والتشغيلي الذي تقوم به المنصة بين المستخدم والمساعد، ويتمثل في: (أ) نقل بيانات الاتصال، و/أو (ب) فتح قناة اتصال (مكالمة، رسالة، مكالمة فيديو)، و/أو (ج) قبول المساعد لطلب مقدم عبر المنصة.

**بلد التدخل**: الولاية القضائية المستهدفة بشكل رئيسي بطلب المستخدم وقت التوصيل. في حال عدم التحديد، يُعتبر بلد إقامة المستخدم في تاريخ الطلب؛ وفي حالة تعدد الولايات القضائية، تُعتبر الولاية الأوثق صلة بموضوع الطلب.

**رسوم التوصيل**: المبلغ **المستحق من المستخدم لـ SOS Expat** عن كل توصيل (المادة 7)، مقابل خدمة التوصيل التقنية الوحيدة التي تقدمها المنصة. لا تشكل هذه الرسوم بأي حال من الأحوال عمولة أو حصة أو مشاركة في أتعاب المساعد. يحدد مبلغها في **جدول التعرفة الساري المفعول** المتاح للاطلاع في الفضاء الشخصي للمساعد والمستخدم. يجوز لـ SOS Expat تعديل هذا الجدول وفق الشروط المنصوص عليها في المادة 2.5.

**مزود(و) الدفع**: الخدمات الخارجية المستخدمة لتحصيل الدفعة الموحدة من المستخدم وتوزيع الأموال.

**شريك B2B**: أي شخص اعتباري (شركة، جمعية، تأمين تكافلي، لجنة عمالية، منظمة، إلخ) أبرم مع SOS Expat عقداً إطارياً ينص على تحمله، كلياً أو جزئياً، لرسوم التوصيل لصالح أعضائه أو موظفيه أو المستفيدين منه ("**مستخدمو B2B**"). **التوصيل B2B** هو توصيل يطلقه مستخدم B2B بموجب هذا العقد الإطاري. وعلى النقيض، **التوصيل B2C** هو توصيل يطلقه مستخدم يدفع رسوم التوصيل مباشرة.

**قوائم العقوبات**: قوائم الأشخاص والكيانات والدول الخاضعة لعقوبات اقتصادية أو حظر، بما في ذلك قوائم مكتب مراقبة الأصول الأجنبية (OFAC) الأمريكي، والاتحاد الأوروبي، والأمم المتحدة، وخزانة صاحب الجلالة البريطانية (HMT)، وأي سلطة مختصة أخرى.

---

## 2. الموضوع والنطاق والقبول

2.1. تحكم هذه الشروط والأحكام العامة الوصول إلى المنصة واستخدامها من قبل المساعدين.

2.2. **تعمل SOS Expat حصرياً كوسيط تقني للتوصيل.** SOS Expat ليست صاحب عمل أو وكيل أو شريك للمساعدين، ولا تقدم أي استشارات قانونية أو طبية أو ضريبية أو محاسبية أو منظمة، وليست طرفاً في العقود المبرمة بين المساعدين والمستخدمين.

2.3. **القبول الإلكتروني (Click-wrap) والتتبع.** يقبل المساعد هذه الشروط بوضع علامة في المربع المخصص عند التسجيل و/أو باستخدام المنصة. يُعد هذا الفعل توقيعاً إلكترونياً وموافقة تعاقدية وفقاً للائحة (الاتحاد الأوروبي) رقم 910/2014 (eIDAS). تحتفظ SOS Expat بـ **سجلات تدقيق مختومة زمنياً** تتضمن: (أ) التاريخ والوقت الدقيقين (بالتوقيت العالمي المنسق) للقبول، (ب) عنوان IP الخاص بالمساعد، (ج) معرف الجلسة الفريد، (د) وكيل مستخدم المتصفح، (هـ) إصدار الشروط المقبولة، (و) البصمة التشفيرية للوثيقة المقبولة، (ز) المعرف الفريد للمساعد. تُشكل هذه السجلات **دليلاً قانونياً قابلاً للاحتجاج به** على قبول الشروط.

2.4. **حفظ أدلة القبول.** وفقاً للائحة العامة لحماية البيانات (GDPR) والالتزامات القانونية للحفظ، تحتفظ SOS Expat بأدلة قبول الشروط لمدة **عشر (10) سنوات** من تاريخ القبول، أو حتى انتهاء أي نزاع قائم حسب الاقتضاء. يمكن للمساعد، بناءً على طلب كتابي عبر نموذج الاتصال، الحصول على **شهادة قبول** تتضمن عناصر الإثبات المذكورة أعلاه. يستند هذا الحفظ إلى المصلحة المشروعة لـ SOS Expat في امتلاك أدلة في حالة النزاع (المادة 6.1.و من GDPR) وإلى الالتزام القانوني بحفظ العقود التجارية.

2.5. **التعديلات (إخطار مسبق وفقاً للائحة P2B).** يجوز لـ SOS Expat تحديث الشروط و/أو جدول التعرفة، شريطة الالتزام بـ **إخطار مسبق لا يقل عن 15 يوماً** على دعامة دائمة (البريد الإلكتروني المسجل والإشعار في الفضاء الشخصي)، وفقاً لأحكام لائحة الاتحاد الأوروبي 2019/1150 ("P2B"). يجوز تقصير مدة الإخطار المسبق أو الاستغناء عنها في الحالات التالية: (أ) التعديلات المفروضة بموجب التزام قانوني أو قرار من سلطة مختصة؛ (ب) لأسباب أمنية أو لمكافحة الاحتيال بصفة عاجلة؛ (ج) التصحيحات المادية أو الطباعية بدون أثر اقتصادي. خلال مدة الإخطار المسبق، يجوز للمساعد **إنهاء العلاقة دون أي عقوبة**. وفي حال عدم الإنهاء بعد انقضاء مدة الإخطار، يُعد الاستمرار في الاستخدام قبولاً للتعديلات.

2.6. **الأهلية المهنية (B2B).** يُقر المساعد بأنه يتصرف **حصرياً لأغراض مهنية**؛ ولا تنطبق أنظمة حماية المستهلك على العلاقة بين SOS Expat والمساعد.

2.7. **المدة.** غير محددة.

---

## 3. وضع المساعد – الاستقلالية والامتثال والإقرارات

3.1. **الاستقلالية.** يعمل المساعد بصفته **مهنياً مستقلاً**؛ ولا تُنشأ أي علاقة توظيف أو وكالة أو شراكة أو مشروع مشترك مع SOS Expat.

3.2. **تصريح العمل ووضع الهجرة.** المساعد هو **المسؤول الوحيد** عن الحصول على جميع التصاريح اللازمة في كل بلد تدخل والحفاظ عليها (تأشيرة، تصريح عمل، تسجيل نشاط/عمل حر، تأمينات، تراخيص محلية، إلخ). **لا تتحقق** SOS Expat من هذه التصاريح و**لا تتحمل أي مسؤولية** في هذا الشأن.

3.3. **الخدمات غير المنظمة.** يلتزم المساعد بـ **عدم تقديم خدمات منظمة** (مثل الاستشارات القانونية أو الطبية أو المالية أو المحاسبية أو العقارية، إلخ) **دون** امتلاك **التصاريح/التراخيص** اللازمة **و** دون الامتثال الكامل للقوانين المحلية. وإلا، يمتنع عن تقديم مثل هذه الخدمات ويحيل المستخدم إلى متخصص مرخص حسب الأصول (مثل محامٍ مسجل).

3.4. **الامتثال العام.** يلتزم المساعد بالقوانين واللوائح المعمول بها (حماية المستهلك، التجارة الإلكترونية، الإعلان/التسويق، المنافسة العادلة، مكافحة غسل الأموال/اعرف عميلك عند الاقتضاء، الضرائب، حماية البيانات، العقوبات/الرقابة على الصادرات، سلامة الأشخاص).

3.5. **التأمينات.** يُقر المساعد بامتلاكه التأمينات اللازمة (المسؤولية المدنية المهنية، عند الاقتضاء) التي تغطي أنشطته ومناطق تدخله.

3.6. **الامتثال لتشريعات بلد التدخل.** يلتزم المساعد بالامتثال لجميع القوانين واللوائح المعمول بها في كل بلد تدخل يقدم فيه خدماته، بما في ذلك على سبيل المثال لا الحصر: قوانين العمل، واللوائح الضريبية، وقواعد حماية المستهلك، ومتطلبات التراخيص المهنية، وأي إطار تنظيمي محلي آخر معمول به. يُقر المساعد بأن SOS Expat **لا تضمن** امتثال المساعد للقوانين المحلية و**لا تتحمل أي مسؤولية** عن أي انتهاك يرتكبه المساعد.

3.7. **إقرارات وضمانات المساعد.** بالتسجيل على المنصة، يُقر المساعد ويضمن صراحةً أنه:
- (أ) **بالغ** وفقاً لقانون بلد إقامته و/أو ممارسته؛
- (ب) يتمتع بـ **الأهلية القانونية الكاملة** للتعاقد وممارسة نشاطه؛
- (ج) ليس خاضعاً للوصاية أو القوامة أو الحماية القضائية أو أي نظام حماية مماثل؛
- (د) ليس ممنوعاً من **ممارسة** نشاطه، سواء مؤقتاً أو نهائياً؛
- (هـ) لم يتم شطبه أو إيقافه أو استبعاده من أي هيئة مهنية ذات صلة؛
- (و) ليس خاضعاً لأي **إجراء تأديبي جارٍ** قد يؤدي إلى التعليق أو الشطب (أو يلتزم بإبلاغ SOS Expat فوراً في حال حدوث ذلك)؛
- (ز) لا يظهر على **أي قائمة عقوبات** (OFAC، الاتحاد الأوروبي، الأمم المتحدة، HMT، أو غيرها)؛
- (ح) لم تتم **إدانته جنائياً** بأفعال تتعارض مع ممارسة نشاطه؛
- (ط) جميع المعلومات المقدمة عند التسجيل **دقيقة وكاملة ومحدثة**؛
- (ي) يلتزم بـ **إبلاغ SOS Expat فوراً** بأي تغيير يؤثر على هذه الإقرارات.
يُعد أي إقرار كاذب انتهاكاً جسيماً لهذه الشروط قد يؤدي إلى الحظر الفوري والنهائي، دون الإخلال بأي دعوى تعويضية.

3.8. **السرية.** يحمي المساعد معلومات المستخدمين ويمتنع عن إفشائها، إلا بموجب التزام قانوني أو موافقة.

---

## 4. إنشاء الحساب والتحقق والأمان

4.1. **التسجيل.** حساب واحد (1) لكل مساعد؛ يجب أن تكون المعلومات دقيقة وكاملة ومحدثة (الهوية، وسائل الاتصال، وصف الخدمات، مناطق التدخل، إلخ).

4.2. **التحقق.** يجوز لـ SOS Expat إجراء فحوصات معقولة (الهوية، اتساق الملف الشخصي، فحوصات العقوبات/اعرف عميلك عبر مزودي الخدمة) ورفض/تعليق/إزالة الوصول لأسباب تتعلق بالأمان أو الامتثال أو جودة الخدمة.

4.3. **أمان الدخول.** يحمي المساعد بيانات اعتماده. أي نشاط عبر الحساب يُعتبر منفذاً من قبله.

4.4. **إجراءات التحقق التكميلي في أي وقت.** تحتفظ SOS Expat بالحق في طلب من المساعد، **في أي وقت ودون الحاجة لتبرير طلبها**، تقديم أو تحديث أي وثيقة تثبت حقه في الممارسة، أو تسجيله المهني أو ما يعادله، أو تأمين المسؤولية المدنية المهنية، أو هويته، أو أي إثبات آخر ذي صلة. يلتزم المساعد بالرد على هذه الطلبات خلال **سبعة (7) أيام عمل**. قد يؤدي عدم الرد أو تقديم وثائق غير مطابقة إلى التعليق الفوري للحساب.

4.5. **الإشراف ومراقبة الجودة.** تنفذ SOS Expat سياسة إشراف تهدف إلى ضمان جودة وامتثال الخدمات المقدمة على المنصة. قد يشمل هذا الإشراف: (أ) التحقق من الملفات الشخصية والمحتوى المنشور، (ب) تحليل تقييمات وشكاوى المستخدمين، (ج) مراقبة الامتثال للشروط والقوانين المعمول بها، (د) أي إجراء معقول آخر لمراقبة الجودة. يقبل المساعد الخضوع لهذا الإشراف.

4.6. **التعليق المؤقت للحساب.** يجوز لـ SOS Expat **تعليق حساب المساعد فوراً ودون إشعار مسبق** في الحالات التالية:
- (أ) الاشتباه في الاحتيال أو انتحال الهوية أو الإقرار الكاذب؛
- (ب) الشكاوى المتعددة أو الجسيمة من المستخدمين؛
- (ج) عدم تقديم الوثائق المطلوبة بموجب المادة 4.4؛
- (د) الانتهاك المؤكد أو المشتبه به للشروط أو القوانين المعمول بها؛
- (هـ) السلوك الذي يضر بصورة أو سمعة المنصة؛
- (و) أمر من سلطة قضائية أو إدارية أو مهنية؛
- (ز) أي سبب مشروع آخر تقدره SOS Expat وفق تقديرها المطلق.
خلال فترة التعليق، لا يمكن للمساعد الوصول إلى حسابه أو استلام توصيلات جديدة. يجوز حجز المدفوعات المعلقة حتى توضيح الوضع.

4.7. **الحظر النهائي (الإنهاء بسبب المخالفة).** يجوز لـ SOS Expat **إنهاء حساب المساعد نهائياً ودون إشعار مسبق** ("الحظر") في الحالات التالية:
- (أ) الانتهاك الجسيم أو المتكرر للشروط؛
- (ب) الاحتيال المؤكد أو الإقرار الكاذب المتعمد أو انتحال الهوية/الصفة؛
- (ج) فقدان الحق في الممارسة (الشطب، التعليق المهني، عدم تجديد التسجيل)؛
- (د) الإدانة الجنائية التي تتعارض مع ممارسة النشاط؛
- (هـ) السلوك الضار بشكل جسيم بالمستخدمين أو المنصة؛
- (و) العودة للمخالفة بعد تعليق مؤقت؛
- (ز) التحايل المؤكد على المنصة لتجنب رسوم التوصيل؛
- (ح) عدم الامتثال لالتزامات التحقق من الهوية (KYC) رغم التذكيرات؛
- (ط) أي سبب جسيم آخر تقدره SOS Expat وفق تقديرها المطلق.
الحظر **نهائي وغير قابل للإلغاء**. لا يمكن للمساعد المحظور إنشاء حساب جديد. يجوز حجز الأموال المعلقة كتعويضات جزافية، دون الإخلال بأي دعوى تعويضية أخرى.

4.8. **الإجراءات والإشعار.** في حالة التعليق أو الحظر، تُخطر SOS Expat المساعد بالبريد الإلكتروني على العنوان المسجل. يوضح هذا الإشعار سبب الإجراء (ما لم يكن هناك التزام قانوني بالسرية). يحق للمساعد تقديم ملاحظاته كتابياً عبر نموذج الاتصال خلال **خمسة عشر (15) يوماً**. تدرس SOS Expat هذه الملاحظات لكنها غير ملزمة برفع الإجراء. قرار SOS Expat **تقديري ونهائي**.

4.9. **آثار التعليق أو الحظر.** في حالة التعليق أو الحظر:
- (أ) يُحظر الوصول إلى الحساب فوراً؛
- (ب) يُزال ملف المساعد من نتائج البحث؛
- (ج) يجوز إلغاء التوصيلات الجارية؛
- (د) يجوز حجز المدفوعات المعلقة أو مقاصتها مع أي مبلغ مستحق لـ SOS Expat؛
- (هـ) يظل المساعد ملزماً بالتزاماته (السرية، عدم الاستقطاب، إلخ) وفقاً لبنود البقاء.

4.10. **عدم النشاط.** في حالة **عدم النشاط لأكثر من 365 يوماً**، يجوز تعطيل الحساب تلقائياً بعد الإشعار. يمكن للمساعد إعادة تنشيط حسابه عند الطلب، بشرط تقديم وثائق التحقق المطلوبة.

4.11. **الإنهاء الطوعي.** يمكن للمساعد إغلاق حسابه في أي وقت بعد الوفاء بالتزاماته الجارية (الخدمات المقبولة، المبالغ المستردة المحتملة). يتم طلب الإغلاق عبر نموذج الاتصال. تقوم SOS Expat بالإغلاق خلال **ثلاثين (30) يوماً**.

4.12. **الاتصالات الإلكترونية.** يوافق المساعد على تلقي أي إشعار يتعلق بالشروط والإشراف وإجراءات التعليق/الحظر عبر الوسائل الإلكترونية (البريد الإلكتروني، الإشعارات داخل التطبيق، النشر على المنصة). يلتزم المساعد بالحفاظ على عنوان بريد إلكتروني صالح ومراجعة إشعاراته بانتظام.

4.13. **النظام الداخلي لمعالجة الشكاوى (P2B).** وفقاً للمادة 11 من لائحة الاتحاد الأوروبي 2019/1150، تتيح SOS Expat للمساعدين **نظاماً داخلياً مجانياً** لمعالجة الشكاوى عبر نموذج الاتصال. تلتزم SOS Expat بـ: (أ) **الإقرار بالاستلام خلال 7 أيام عمل** لأي شكوى؛ (ب) معالجة الشكوى بشكل جاد وغير تمييزي خلال أجل معقول لا يتجاوز عادةً **30 يوماً**؛ (ج) إبلاغ المساعد بالنتيجة **مسببةً** بلغة واضحة، مع بيان وسائل الطعن المتاحة (الوساطة في المادة 12.5، التحكيم في المادة 12.2)؛ (د) الاحتفاظ بـ **إحصائيات مجمعة** سنوية حول تشغيل هذا النظام.

---

## 5. قواعد الاستخدام – الجودة، المحظورات، عدم التحايل

5.1. **الجودة والوصف الدقيق.** يصف المساعد خدماته بدقة، دون وعد بنتائج. لا يدعي **أي صفة زائفة** (مثل مهنة منظمة لا يحملها).

5.2. **المحظورات.** المحتوى غير القانوني أو التمييزي أو المضلل؛ الممارسات غير العادلة؛ الجمع أو الاستخدام التعسفي للبيانات؛ التحايل/الهندسة العكسية للمنصة؛ التواطؤ/المقاطعة بهدف الإضرار؛ انتهاكات العقوبات/الرقابة على الصادرات؛ أي نشاط غير قانوني.

5.3. **عدم التحايل.** كل **توصيل جديد** مع **مستخدم جديد** عبر المنصة يترتب عليه **رسوم التوصيل** (المادة 7). **يُحظر** تجنب هذه الرسوم بالتحايل على المنصة لتقديم جديد.

5.4. **التوافر.** المنصة مقدمة **"كما هي"**؛ لا ضمان للتوافر المستمر (الصيانة، الحوادث، القوة القاهرة). قد يُقيد الوصول إذا تطلب القانون ذلك.

---

## 6. العلاقة بين المساعد والمستخدم (خارج المنصة)

6.1. بعد التوصيل، يمكن للمساعد والمستخدم التعاقد **خارج المنصة**. **الأتعاب** والشروط تُحدد بحرية بينهما، مع مراعاة القوانين المحلية.

6.2. يقدم المساعد **شروط/تأكيدات الخدمة** المتوافقة مع القانون المحلي، ويدير **فواتيره** و**التزاماته الضريبية**.

6.3. SOS Expat **ليست مسؤولة** عن جودة أو دقة أو نتيجة خدمات المساعد، ولا عن الالتزامات المتخذة بين المساعد والمستخدم.

---

## 7. الرسوم والدفعة الموحدة والضرائب

7.1. **رسوم التوصيل (أجرة المنصة).** تشكل رسوم التوصيل **حصرياً** المقابل المالي لخدمة التوصيل التقنية المقدمة من SOS Expat لـ **المستخدم**. هذه الرسوم **مستحقة من المستخدم**، **وليست من المساعد**. يحدد مبلغها في **جدول التعرفة الساري المفعول** المتاح في الفضاء الشخصي للمساعد لكل توصيل، باستثناء الضرائب ورسوم مزود الدفع. يتم أي تعديل لجدول التعرفة وفق الشروط المنصوص عليها في المادة 2.5 (إخطار مسبق لا يقل عن 15 يوماً).

7.2. **التوصيف القانوني للدفع — ديْنان مستقلان متمايزان لا يعتمد أحدهما على الآخر:**
- (أ) **ديْن "التوصيل"**: مستحق من المستخدم لـ SOS Expat (المادة 7.1)؛
- (ب) **ديْن "أتعاب المساعد"**: مستحق من المستخدم للمساعد مقابل الخدمة المقدمة، خارج المنصة.

**لا تتلقى SOS Expat أي عمولة أو حصة أو مشاركة أو جزء من أتعاب المساعد.** تشكل رسوم التوصيل الأجرة الوحيدة لـ SOS Expat، وتُقتطع حصرياً من (أ).

يعمل مزود الدفع بصفته **وكيل تحصيل المساعد** فيما يخص (ب)؛ ويحول الصافي بعد خصم الرسوم البنكية ورسوم التحويل. يُعرض المبلغ الدقيق في لوحة التحكم قبل وبعد كل معاملة.

7.3. **الرسوم البنكية لمزود الدفع.** يحصّل مزود الدفع (Stripe أو ما يعادله) رسوم معالجة على كل معاملة. **هذه الرسوم البنكية تقع بالكامل على عاتق المساعد** وتُخصم تلقائياً من المبلغ المحول إليه. تفاصيل هذه الرسوم متاحة في شروط مزود الدفع وفي لوحة تحكم المساعد لكل معاملة.

7.4. **رسوم الصرف وتحويل العملات.** عندما تختلف عملة دفع المستخدم عن عملة الحساب البنكي للمساعد، تُطبق **رسوم تحويل عملات** من قبل مزود الدفع. **رسوم الصرف هذه تقع بالكامل على عاتق المساعد** وتُخصم من المبلغ المحول إليه. أسعار الصرف المطبقة هي تلك الخاصة بمزود الدفع وقت التحويل. يُقر المساعد ويقبل صراحةً أن SOS Expat ليس لها أي سيطرة على أسعار الصرف هذه وتُخلي مسؤوليتها عن تقلبات العملات أو الرسوم المطبقة من قبل المزود.

7.5. **حساب المبلغ الصافي المحول.** يُحسب المبلغ الصافي المحول للمساعد وفق الصيغة: **المبلغ المدفوع من المستخدم − رسوم التوصيل − الرسوم البنكية للمزود − رسوم الصرف (عند الاقتضاء)**. يختلف المبلغ الدقيق حسب الرسوم المعمول بها وقت المعاملة. **يُعلم المساعد بالمبلغ الدقيق الذي سيحصل عليه في لوحة التحكم قبل كل خدمة ويمكنه بالتالي اتخاذ قرار مستنير بقبول أو رفض التوصيل.**

7.6. **الاستحقاق وعدم الاسترداد.** رسوم التوصيل مستحقة فور التوصيل الفعلي و**غير قابلة للاسترداد** (إلا بموجب بادرة حسن نية تقديرية من SOS Expat في حالة فشل يُعزى حصرياً للمنصة وبالقدر الذي يسمح به القانون).

7.7. **استرداد المستخدم.** إذا مُنح استرداد للمستخدم، فإنه يُحسم من حصة المساعد: يجوز لـ SOS Expat حجز/مقاصة المبلغ المقابل من المدفوعات المستقبلية للمساعد، أو طلب السداد المباشر إذا لم تكن هناك مدفوعات مستحقة. تظل رسوم التوصيل مكتسبة لـ SOS Expat، إلا بموجب قرار تقديري مخالف.

7.8. **مواعيد دفع المساعد حسب القناة.** شريطة إكمال إجراءات KYC:
- (أ) **B2C**: الدفع **فور انتهاء المكالمة** (من 1 إلى 7 أيام عمل حسب البلد ومستوى نضج الحساب)؛
- (ب) **B2B**: الدفع **في غضون 30 يوماً** بعد المكالمة (فوترة مؤجلة لدى الشريك)؛
- (ج) قد يتم تعليق الدفع في حالة وجود نزاع، أو إجراءات KYC جارية، أو أي ظرف آخر منصوص عليه في هذه الشروط.

7.9. **الضرائب.** يظل المساعد **المسؤول الوحيد** عن جميع التزاماته الضريبية (ضريبة الدخل، ضريبة القيمة المضافة، الاشتراكات الاجتماعية، الرسوم المهنية، إلخ) في ولايته القضائية للإقامة و/أو الممارسة. المبالغ المحولة للمساعد هي **مبالغ إجمالية**؛ والمساعد مسؤول عن التصريح بجميع الضرائب المستحقة ودفعها. تحصّل SOS Expat وتحول، عند الاقتضاء بموجب القانون، ضريبة القيمة المضافة/ما يعادلها محلياً على رسوم التوصيل فقط.

7.10. **المقاصة.** يجوز لـ SOS Expat مقاصة أي مبلغ مستحق عليها للمساعد (بموجب استرداد للمستخدم أو غرامة أو التزام آخر) مع أي مبلغ مستحق للمساعد.

7.11. **الشفافية في التعرفة والسجل.** يمكن للمساعد في أي وقت الاطلاع في لوحة التحكم الشخصية على: (أ) التفاصيل الكاملة لكل معاملة، (ب) المبلغ الإجمالي المدفوع من المستخدم، (ج) رسوم التوصيل المخصومة، (د) الرسوم البنكية لمزود الدفع، (هـ) رسوم الصرف عند الاقتضاء، (و) المبلغ الصافي المحول أو المستحق التحويل، (ز) سجل جميع معاملاته. تُحفظ هذه المعلومات وتبقى متاحة طوال مدة الحساب و**خمس (5) سنوات** بعد إغلاقه.

7.12. **DAC7 — لائحة الاتحاد الأوروبي 2021/514.** بالنسبة للمساعد المقيم في الاتحاد الأوروبي، يجب على SOS Expat أن **تُصرّح سنوياً** للسلطات الضريبية المختصة (وفقاً للتوجيه الأوروبي 2021/514): الاسم، العنوان، رقم التعريف الضريبي (TIN)، الدولة، إجمالي المبالغ المقبوضة، عدد عمليات التوصيل، مفصلة فصلياً. يلتزم المساعد بـ **تقديم وتحديث** هذه المعلومات. أي تقصير في ذلك قد يؤدي إلى تعليق المدفوعات.

7.13. **قناة B2B — عمليات التوصيل عبر شريك B2B.**
(أ) **النطاق**: عملية توصيل يطلقها مستخدم B2B بموجب العقد الإطاري المبرم بين الشريك B2B وSOS Expat.
(ب) **التكييف**: ديْن "التوصيل" مستحق على **الشريك B2B** (وليس على المستخدم النهائي)؛ ديْن "أتعاب المساعد" مستحق على المستخدم للمساعد (ما لم يقم الشريك B2B بتحمله صراحةً في العقد الإطاري).
(ج) **تعريفات أتعاب المساعد المتمايزة بين B2C وB2B — يقبل المساعد ذلك صراحةً.** قد تختلف الأتعاب الصافية للمساعد لكل توصيل B2B عن أتعاب التوصيل B2C. تُعرض القناة (B2B أو B2C) والمبلغ الصافي في لوحة التحكم قبل كل عملية توصيل، مما يتيح للمساعد رفض التوصيل دون أي عقوبة. لا يخضع المساعد لأي التزام بقبول عمليات التوصيل B2B.
(د) **عدم القابلية للاحتجاج**: لا يكون العقد الإطاري المبرم بين الشريك B2B وSOS Expat **قابلاً للاحتجاج به** على المساعد، الذي يبقى محكوماً بهذه الشروط فقط.
(هـ) أي حكم آخر من هذه الشروط (KYC، DAC7، الضرائب، التحكيم، إلخ) ينطبق دون تمييز على عمليات التوصيل B2B.
(و) **جداول التعرفة الإرشادية الحالية**: **B2C: 30 يورو أو 30 دولار أمريكي صافي للمساعد**؛ **B2B: 20 يورو أو 20 دولار أمريكي صافي للمساعد**. هذه المبالغ إرشادية؛ يبقى جدول التعرفة المحدث المتاح في لوحة التحكم هو المرجع الوحيد. يخضع أي تعديل للإخطار المسبق المنصوص عليه في المادة 7.14.

7.14. **تعديل جدول تعرفة أتعاب المساعد.** قد يتطور جدول تعرفة أتعاب المساعد (B2C، B2B، أو أي قناة أخرى)، شريطة الالتزام بـ **إخطار مسبق لا يقل عن 15 يوماً** على دعامة دائمة (المادة 2.5). خلال مدة الإخطار، يجوز للمساعد إنهاء العلاقة دون عقوبة، أو رفض عمليات التوصيل المعروضة بالتعرفة الجديدة كلٌّ على حدة. تظل عمليات التوصيل المقبولة قبل سريان مفعول التعديل خاضعة للتعرفة الأصلية. يُعد الاستمرار في الاستخدام بعد انقضاء مدة الإخطار قبولاً للتعرفة الجديدة.

---

## 8. المدفوعات – KYC/مكافحة غسل الأموال – العقوبات

8.1. **مزودو الدفع.** تتم معالجة المدفوعات **حصرياً** من قبل مزودين خارجيين معتمدين **PCI-DSS**: **Stripe Payments Europe Ltd.** (أيرلندا، الاتحاد الأوروبي) و/أو **PayPal (Europe) S.à r.l. et Cie, S.C.A.** (لوكسمبورغ، الاتحاد الأوروبي). يعتمد المزود المطبق على بلد إقامة/ممارسة المساعد (Stripe يغطي 44 دولة، PayPal أكثر من 150 دولة). **يقبل المساعد صراحة** الشروط العامة وإجراءات التحقق **KYC/AML** للمزود(ين) المطبق(ين). **SOS Expat ليست بنكاً أو مؤسسة دفع أو مؤسسة ائتمان**؛ SOS Expat هي فقط عميل تجاري لمزودي الدفع المذكورين.

8.2. يجوز لـ SOS Expat تأجيل أو حجز أو إلغاء المدفوعات في حالة الاشتباه في الاحتيال أو عدم الامتثال أو الأمر القانوني.

8.3. **العقوبات الدولية والحظر.** يجوز **تقييد أو حظر** الوصول إلى المنصة وخدمات الدفع في أي بلد أو إقليم خاضع، بموجب الأنظمة المعمول بها، **لحظر شامل أو تدابير تقييدية كاملة**، خاصة من قبل: مزودي الدفع، الاتحاد الأوروبي، الأمم المتحدة، مكتب مراقبة الأصول الأجنبية الأمريكي (OFAC)، خزانة صاحب الجلالة البريطانية (HMT)، أو أي سلطة مختصة أخرى. القائمة المعمول بها هي تلك التي تحتفظ بها السلطات المذكورة أعلاه؛ **لا تنشئ SOS Expat ولا تنشر قائمتها الجيوسياسية الخاصة**. يُقر المساعد ويضمن أنه لا يظهر على أي **قائمة عقوبات دولية** (OFAC/SDN، الاتحاد الأوروبي، الأمم المتحدة، HMT، أو غيرها) ويلتزم بـ **قوانين الرقابة على الصادرات** المعمول بها. تحتفظ SOS Expat بالحق في تقييد أو حظر الوصول فوراً لأي مساعد يُشتبه في انتهاكه لهذه الأحكام. يجوز لـ SOS Expat أيضاً أن تكون ملزمة بـ **تجميد أموال** المساعد في حالة صدور أمر من سلطة مختصة.

8.4. **التزام إكمال عملية التحقق (KYC).** لاستلام المدفوعات الناتجة عن الخدمات المقدمة عبر المنصة، يلتزم المساعد بإكمال عملية التحقق من الهوية (KYC - اعرف عميلك) لدى شريكنا في الدفع Stripe في أقرب وقت ممكن بعد التسجيل. يُقر المساعد بأن عدم إكمال التحقق من الهوية يمنع تقنياً تحويل الأموال إلى حسابه البنكي.

### الأموال غير المطالب بها والتحقق من الهوية KYC

8.5. **حفظ الأموال المعلقة.** عندما يتم دفع مبلغ من قبل مستخدم مقابل خدمة قدمها مساعد لم يُكمل التحقق من هويته، تُحفظ الأموال المقابلة لحصة المساعد (بعد خصم رسوم التوصيل للمنصة) في حساب ضمان. تلتزم المنصة بـ:
- إشعار المساعد بالبريد الإلكتروني بوجود أموال معلقة؛
- إرسال تذكيرات منتظمة (في 7 أيام، 30 يوماً، 60 يوماً، 90 يوماً، 120 يوماً، و150 يوماً)؛
- تزويد المساعد بجميع الوسائل اللازمة لإكمال التحقق من هويته.

8.6. **الأموال المعلقة لفترة طويلة — رسوم الإدارة وتحويلها إلى السلطات المختصة.** في حال عدم إكمال إجراءات KYC خلال **مائة وثمانين (180) يوماً** من تاريخ أول دفعة معلقة، ورغم الإشعارات المنصوص عليها في المادة 8.5، تُطبق الأحكام التالية:
- (أ) يجوز لـ SOS Expat اقتطاع **رسوم إدارة جزافية بحد أقصى 10% من المبلغ المعلق**، تغطي حصرياً التكاليف الإدارية الفعلية (إدارة الأموال، محاولات الاتصال، الحفظ المحاسبي)؛
- (ب) تُحفظ الأموال لفترة طويلة في حساب ضمان؛ يجوز للمساعد إكمال التحقق من هويته في أي وقت لاسترداد المبلغ الصافي بعد خصم الرسوم المذكورة؛
- (ج) بعد انقضاء **خمس (5) سنوات** بدون مطالبة، تُحوّل الأموال إلى **آلية الأموال الراكدة المختصة في بلد إقامة المساعد** (في فرنسا: Caisse des dépôts et consignations بموجب قانون Eckert؛ في الولايات المتحدة: unclaimed property مكتب الولاية المختصة؛ في المملكة المتحدة: مخطط Dormant Assets؛ أو الهيئة المعادلة في البلدان الأخرى). **لا تستحوذ SOS Expat على هذه الأموال لمصلحتها الخاصة**؛ وتلتزم بالاحتفاظ بإثباتات هذا التحويل وتسليمها للمساعد الذي يطلبها.

8.7. **المطالبة خلال فترة الحفظ الطويلة.** خلال فترة الحفظ الطويلة (بين 180 يوماً و5 سنوات)، يجوز للمساعد تقديم طلب مطالبة عبر نموذج الاتصال، مرفقاً بـ: (أ) إثبات هويته الكامل وفق إجراءات KYC؛ (ب) المعلومات البنكية المحدثة. تدرس SOS Expat الطلب خلال أجل أقصاه **30 يوماً**، وتحول المبلغ الصافي بعد خصم رسوم الإدارة المنصوص عليها في المادة 8.6(أ). في حالة وجود **قوة قاهرة موثقة** أو **عدم قدرة طبية مثبتة**، يجوز تخفيض رسوم الإدارة أو إعفاؤها بناءً على دراسة كل حالة على حدة.

8.8. **القبول الصريح للمادة 8.** بالتسجيل على المنصة كمساعد، يُقر بأنه اطلع على هذه الشروط المتعلقة بإدارة الأموال المعلقة وتحويلها للسلطات المختصة في حالة عدم المطالبة الطويلة، ويقبلها صراحةً. يُشكل هذا القبول شرطاً جوهرياً وحاسماً للوصول إلى وضع مقدم الخدمة على المنصة.

8.9. **التعاون القانوني.** يلتزم المساعد بالتعاون مع SOS Expat والسلطات المختصة في حالة التحقيق المتعلق بغسل الأموال أو تمويل الإرهاب أو أي جريمة مالية أخرى.

---

## 9. البيانات الشخصية (الإطار العالمي – GDPR/DSA)

9.1. **الأدوار.** فيما يتعلق ببيانات المستخدمين المستلمة لأغراض التوصيل، يعمل كل من **SOS Expat والمساعد** **كل منهما** بصفته **مسؤول معالجة** لأغراضه الخاصة، وفقاً لـ **اللائحة (الاتحاد الأوروبي) 2016/679 (GDPR)**.

9.2. **الأسس والأغراض.** تنفيذ العقد (التوصيل)، المصالح المشروعة (الأمان، منع الاحتيال، التحسين)، الامتثال القانوني (مكافحة غسل الأموال، العقوبات)، والموافقة عند الاقتضاء.

9.3. **النقل الدولي** مع **ضمانات مناسبة** عند الاقتضاء (البنود التعاقدية النموذجية، قرارات الملاءمة، إلخ).

9.4. **الحقوق والاتصال.** ممارسة الحقوق (الوصول، التصحيح، المحو، قابلية النقل، الاعتراض) عبر **نموذج الاتصال** الخاص بالمنصة.

9.5. **الأمان.** تدابير تقنية/تنظيمية معقولة؛ الإخطار بالانتهاكات وفقاً للقوانين المعمول بها (72 ساعة وفقاً لـ GDPR).

9.6. يعالج المساعد البيانات وفقاً لقانون **بلد التدخل**.

9.7. **الامتثال لـ DSA.** تعمل المنصة بصفتها **خدمة وسيطة** بموجب **اللائحة (الاتحاد الأوروبي) 2022/2065 (قانون الخدمات الرقمية)**. تنفذ SOS Expat آليات للإبلاغ عن المحتوى غير القانوني وتتعاون مع السلطات المختصة وفقاً لـ DSA.

---

## 10. الملكية الفكرية

المنصة وعلاماتها التجارية وشعاراتها وقواعد بياناتها ومحتوياتها محمية. لا تُنقل أي حقوق للمساعد، باستثناء حق **شخصي وغير حصري وغير قابل للتحويل** للوصول خلال مدة هذه الشروط. المحتوى المقدم من المساعد يخضع لـ **ترخيص عالمي وغير حصري** لصالح SOS Expat للاستضافة والعرض على المنصة.

---

## 11. الضمانات والمسؤولية والتعويض

11.1. **لا ضمان** فيما يتعلق بالنتائج/الجودة/حجم الأعمال؛ المنصة مقدمة **"كما هي"**.

11.2. **تحديد المسؤولية**: بالقدر المسموح به، تقتصر المسؤولية الإجمالية لـ SOS Expat تجاه المساعد على **الأضرار المباشرة** و**لا يمكن أن تتجاوز** إجمالي **رسوم التوصيل** التي حصلت عليها SOS Expat بموجب **المعاملة** محل المطالبة.

11.3. **الاستثناءات**: لا أضرار غير مباشرة/تبعية/خاصة/عقابية (خسارة الأرباح، الفرص، العملاء، الإضرار بالسمعة، تكاليف الاستبدال، إلخ).

11.4. **التعويض**: **يعوض المساعد ويضمن** SOS Expat (وكذلك الشركات التابعة لها ومديريها وموظفيها ووكلائها) ضد أي مطالبة أو خسارة أو ضرر أو عقوبة أو مصاريف (بما في ذلك أتعاب المحاماة) تتعلق بـ (أ) مخالفته للشروط/القوانين، (ب) محتوياته، (ج) خدماته/إغفالاته، (د) عدم امتلاك تصاريح العمل/الهجرة/التراخيص.

11.5. **التنازل عن حق الرجوع.** يتنازل المساعد **صراحةً وبشكل لا رجعة فيه** عن أي حق رجوع ضد SOS Expat بموجب (أ) الأضرار الناتجة عن تقديم الخدمات، (ب) الخسائر غير المباشرة، (ج) النزاعات التعاقدية مع المستخدمين، (د) أي قصور في الخدمات المقدمة من المساعد. يسري هذا التنازل بأقصى حد يسمح به القانون.

11.6. **لا تمثيل.** لا شيء يُنشئ علاقة وكالة أو توظيف أو شراكة أو مشروع مشترك بين SOS Expat والمساعد.

11.7. **القوة القاهرة.** لا تتحمل SOS Expat المسؤولية عن التأخيرات أو الإخفاقات الناتجة عن أحداث **القوة القاهرة** (كارثة طبيعية، حرب، وباء، هجوم إلكتروني، انقطاع الكهرباء أو الإنترنت، قرار حكومي، إضراب، إلخ).

11.8. **البقاء.** تبقى المواد التالية سارية بعد إنهاء أو انتهاء هذه الشروط، أياً كان السبب: المواد 2 (أدلة القبول)، 3.7 (الإقرارات)، 5 (قواعد الاستخدام)، 7 (الرسوم والمدفوعات)، 8 (KYC والعقوبات)، 9 (البيانات الشخصية)، 10 (الملكية الفكرية)، 11 (المسؤولية والتعويض)، 12 (القانون المطبق والتحكيم)، 13 (بنود الحماية) و14 (متفرقات). تظل هذه البنود سارية طالما كان ذلك ضرورياً لإنتاج آثارها.

---

## 12. القانون المطبق – التحكيم – الاختصاص القضائي الإستوني – الدعاوى الجماعية

12.1. **القانون المطبق.** تخضع هذه الشروط وتفسيرها وصحتها وتنفيذها حصرياً لـ **القانون الإستوني**، باستثناء قواعد تنازع القوانين. بالنسبة للمسائل المتعلقة بتقديم الخدمات في بلد تدخل محدد، تُطبق القواعد المهنية وقواعد النظام العام المحلية لذلك البلد بشكل تكميلي بالقدر الذي تكون فيه آمرة. **لتجنب أي غموض**، فإن القواعد الآمرة المطبقة على نشاط المساعد في بلد التدخل (الهجرة، قانون العمل/العمل المستقل، الضرائب، حماية المستهلك، البيانات الشخصية، الإعلان/الاستقطاب، سلامة الأشخاص، الأخلاقيات المهنية القطاعية) **تُعتبر من النظام العام** و**لها الأسبقية** على أي حكم مخالف أو غامض من هذه الشروط. لا يجوز تفسير أي بند من هذه الشروط على أنه يفرض على المساعد أو يسمح له بسلوك مخالف لهذه القواعد؛ وفي حالة التعارض، يلتزم المساعد بالامتناع وإعلام SOS Expat فوراً.

12.2. **التحكيم الدولي الإلزامي.** أي نزاع أو خلاف أو مطالبة ناشئة عن هذه الشروط أو متعلقة بها، بما في ذلك صحتها وتفسيرها وتنفيذها أو إنهائها، يُفصل فيها نهائياً بـ **التحكيم** وفقاً لنظام التحكيم لـ **غرفة التجارة الدولية (ICC)**.
- **مقر التحكيم**: تالين، إستونيا؛
- **لغة التحكيم**: **الإنجليزية**؛
- **عدد المحكمين**: محكم واحد (1)، إلا إذا تجاوز المبلغ محل النزاع 100,000 يورو، وفي هذه الحالة ثلاثة (3) محكمين؛
- **القانون المطبق على الموضوع**: القانون الإستوني (المادة 12.1)؛
- **الإجراءات**: سرية. يلتزم الطرفان بعدم الإفصاح عن وجود أو محتوى أو نتيجة التحكيم، إلا بموجب التزام قانوني أو لتنفيذ الحكم.
حكم التحكيم **نهائي وملزم** للطرفين. يتنازل الطرفان عن أي طعن بالإلغاء بالقدر الذي يسمح به القانون.

12.3. **التنازل عن الدعاوى الجماعية وهيئة المحلفين.** بأقصى حد يسمح به القانون المعمول به:
- (أ) يتنازل المساعد عن المشاركة في أي **دعوى جماعية أو دعوى مجموعة أو دعوى تمثيلية** ضد SOS Expat؛
- (ب) يُحل أي نزاع على **أساس فردي فقط**؛
- (ج) يتنازل المساعد صراحةً عن أي **حق في المحاكمة أمام هيئة محلفين** (التنازل عن هيئة المحلفين)؛
- (د) يتنازل المساعد عن أي دعوى جماعية أو دعوى موحدة أو دعوى تمثيلية بموجب القانون الأمريكي أو أي قانون مماثل.

12.4. **الاختصاص الحصري للمحاكم الإستونية.** لأي مطالبة غير قابلة للتحكيم وفقاً للقانون المعمول به، وللتدابير المؤقتة أو التحفظية العاجلة قبل تشكيل هيئة التحكيم، ولتنفيذ أحكام التحكيم، تكون **لمحاكم تالين (إستونيا)** **الاختصاص الحصري**. المساعد:
- (أ) يوافق بشكل لا رجعة فيه على هذا الاختصاص؛
- (ب) يتنازل عن أي اعتراض على أساس **المحكمة غير الملائمة**؛
- (ج) يتنازل عن أي اعتراض مبني على انعدام الاختصاص الشخصي؛
- (د) يقبل أن أي تبليغ يمكن أن يتم على عنوان البريد الإلكتروني المسجل على المنصة.

12.5. **الوساطة المسبقة الإلزامية والوسطاء المعتمدون (P2B).** قبل أي تحكيم، يلتزم الطرفان بمحاولة حل النزاع ودياً عن طريق **التفاوض بحسن نية** لمدة **ثلاثين (30) يوماً** من الإخطار الكتابي بالنزاع. يجب إرسال هذا الإخطار بالبريد الإلكتروني مع إشعار بالاستلام إلى عنوان الاتصال الخاص بالطرف الآخر. وفقاً للمادة 12 من لائحة الاتحاد الأوروبي 2019/1150، تعين SOS Expat **وسيطين (2) محترفين على الأقل**، مستقلين ويمكن الوصول إليهما بتكلفة معقولة، يجوز للمساعد الاختيار من بينهم: **(i) مركز باريس للوساطة والتحكيم (CMAP) — cmap.fr**؛ **(ii) مركز التحكيم والوساطة التابع للويبو، جنيف — wipo.int/amc**. تتحمل SOS Expat **حصة معقولة من تكاليف الوساطة**، تُقدّر بحسن نية حسب الظروف، خاصة عندما تكون مبالغ النزاع متواضعة. فشل الوساطة شرط مسبق لتقديم طلب التحكيم.

12.6. **التقادم.** يجب تقديم أي دعوى أو مطالبة من المساعد ضد SOS Expat خلال **الأقصر من بين أجل ثلاث (3) سنوات** من تاريخ الواقعة المنشئة **والأجل القانوني** المعمول به في الولاية القضائية للمساعد، وإلا سقط الحق نهائياً. لا تهدف هذه الفقرة ولا يمكن أن تؤدي إلى تقصير أجل التقادم تحت الحد الأدنى الآمر المعمول به محلياً.

---

## 13. بنود الحماية الدولية

13.1. **مكافحة الفساد.** يلتزم المساعد بعدم تقديم أو وعد أو دفع رشاوى أو مزايا غير مشروعة لموظفين عموميين أو خاصين. يلتزم بقوانين مكافحة الفساد المعمول بها (FCPA، قانون الرشوة البريطاني، قانون سابان الثاني، إلخ).

13.2. **سرية الاتصالات وسياسة التسجيل.** الاتصالات التي تتم عبر المنصة (الرسائل، المكالمات الهاتفية) **سرية**.

**سياسة التسجيل:**
- (a) **بشكل افتراضي**، **لا تسجل SOS Expat المحتوى الصوتي** للمكالمات بين المساعد والمستخدم. تُحفظ فقط **البيانات الوصفية التقنية** لأغراض الفوترة ومكافحة الاحتيال وحل النزاعات التقنية؛
- (b) لا تقوم SOS Expat بتفعيل أي تسجيل **دون موافقة صريحة ومسبقة ومنفصلة من المساعد ومن المستخدم**، يتم التعبير عنها بفعل إيجابي مستقل قبل بدء المكالمة. لا يجوز لـ SOS Expat تفعيل أي تسجيل بشكل أحادي، ما عدا الاستثناء الوحيد المتعلق بـ **الطلب القانوني الصادر عن سلطة قضائية مختصة** في البلد المعني؛
- (c) في حالة التسجيل بشكل استثنائي بموجب البند (b)، يقتصر الحفظ على ما هو ضروري لتحقيق الغرض، بحد أقصى **ستة (6) أشهر** (ما لم يكن التمديد القضائي مطلوباً)، وفقاً للائحة العامة لحماية البيانات وتوصيات السلطات المحلية لحماية البيانات؛
- (d) **يلتزم المساعد بنفسه** بعدم تسجيل أو تدوين كامل أو إفشاء أو استخدام التبادلات لأغراض غير الخدمة المتفق عليها، إلا بإذن مكتوب من المستخدم أو التزام قانوني. أي مخالفة قد تؤدي إلى تعليق الحساب فوراً وإشراك المسؤولية المدنية و/أو الجنائية للمساعد.

13.3. **عدم الاستقطاب.** خلال مدة هذه الشروط و**اثني عشر (12) شهراً** بعد إنهائها، يمتنع المساعد عن استقطاب المستخدمين الذين تعرف عليهم عبر المنصة مباشرةً لتجنب رسوم التوصيل.

13.4. **المسؤولية الحصرية للمساعد.** المساعد هو **المسؤول الوحيد** عن جودة ودقة ومشروعية الخدمات التي يقدمها. SOS Expat **لا تضمن** النصائح أو المعلومات أو الخدمات المقدمة من المساعد و**تُخلي مسؤوليتها** عن أي ضرر يلحق بالمستخدم بسبب خدمات المساعد.

13.5. **انعدام علاقة الاستشارة.** SOS Expat **ليست شركة استشارات**، ولا مقدم خدمات قانونية أو ضريبية أو طبية أو منظمة. تقتصر المنصة على **التوصيل**. أي علاقة استشارية تُقام **حصرياً** بين المساعد والمستخدم، **خارج** SOS Expat.

13.6. **النزاعات بين المساعد والمستخدم.** أي نزاع بين المساعد والمستخدم يقع **حصرياً** ضمن علاقتهما المباشرة. SOS Expat **لا تتدخل** في هذه النزاعات و**لا يمكن إشراكها** كطرف أو ضامن أو وسيط.

---

## 14. متفرقات

14.1. **التنازل.** يجوز لـ SOS Expat التنازل عن هذه الشروط لكيان من مجموعتها أو لخلف؛ لا يجوز للمساعد التنازل دون موافقة كتابية من SOS Expat.

14.2. **الاتفاق الكامل.** تُشكل هذه الشروط الاتفاق الكامل وتحل محل أي اتفاق سابق يتعلق بنفس الموضوع.

14.3. **الإشعارات.** عبر النشر على المنصة أو الإشعار داخل التطبيق أو عبر نموذج الاتصال.

14.4. **التفسير.** العناوين إرشادية فقط. لا تُطبق قاعدة **التفسير ضد المحرر**.

14.5. **اللغات.** قد تُقدم ترجمات؛ **الإنجليزية هي السائدة** للتفسير.

14.6. **البطلان الجزئي والقابلية للتجزئة.** إذا أُعلن بطلان أو عدم نفاذ أي حكم من هذه الشروط من قبل محكمة أو محكم مختص:
- (أ) لا يؤثر هذا البطلان على صحة الأحكام الأخرى التي تظل سارية؛
- (ب) يُستبدل الحكم الباطل بحكم صحيح ذي أثر اقتصادي مماثل، قدر الإمكان؛
- (ج) يتفاوض الطرفان بحسن نية للاتفاق على حكم بديل.

14.7. **القابلية للتجزئة الجغرافية.** إذا كان حكم من هذه الشروط غير قابل للتطبيق أو غير قانوني في ولاية قضائية محددة:
- (أ) لا يُطبق هذا الحكم في تلك الولاية القضائية فقط؛
- (ب) يظل قابلاً للتطبيق بالكامل في جميع الولايات القضائية الأخرى؛
- (ج) لا يؤثر عدم قابلية التطبيق المحلي على الصحة العامة للشروط.

14.8. **عدم التنازل.** إن عدم ممارسة أو التأخر في ممارسة حق من قبل SOS Expat لا يُعد تنازلاً عن هذا الحق. يجب أن يكون أي تنازل صريحاً وكتابياً. التنازل المحدد لا يُشكل تنازلاً عاماً.

14.9. **استقلالية البنود.** كل بند من هذه الشروط مستقل. بطلان أي بند لا يؤدي إلى بطلان بنود تحديد المسؤولية أو التعويض أو التحكيم أو الاختصاص القضائي، التي تظل قابلة للتطبيق بأقصى حد يسمح به القانون.

14.10. **الغير.** لا تمنح هذه الشروط أي حقوق للغير (باستثناء الشركات التابعة لـ SOS Expat المذكورة صراحةً). لا يجوز لأي طرف ثالث الاستفادة من أحكام هذه الشروط.

---

## 15. الاتصال

لأي سؤال أو طلب قانوني: **https://sos-expat.com/contact**
`;

  const defaultPt = `
# Termos e Condições de Uso – Expatriates Aidants (Global)

**SOS Expat by WorldExpat OÜ** (doravante denominado “**Plataforma**”, “**SOS**” ou “**nós**”)

**Versão 3.2 – Última atualização: 26 de abril de 2026**

---

## 1. Definições

**Expatrié Aidant** (“**Aidant**”): qualquer pessoa registrada na Plataforma que fornece serviços de apoio **não legais e não médicos** de forma independente (ex.: orientação, ajuda prática, acompanhamento, tradução informal, rede local, etc.).

**Usuário**: qualquer pessoa que utilize a Plataforma para contatar um Aidant.

**Networking / Matchmaking**: a apresentação técnica/operacional realizada pela Plataforma entre Usuário e Aidant (compartilhamento de informações de contato, abertura de canais de comunicação ou aceitação de solicitação via Plataforma).

**Local / País**: a jurisdição legal à qual a solicitação do usuário se refere principalmente no momento do networking; se não especificado, será considerado o país de residência do usuário.

**Taxa de Networking (Frais de Mise en relation)**: remuneração **devida pelo Usuário à SOS Expat** por cada ação de networking (Seção 7), a título do único serviço técnico de matchmaking fornecido pela Plataforma. Esta taxa não constitui de modo algum uma comissão, retrocessão ou partilha da remuneração do Aidant. O seu valor é definido na **tabela tarifária em vigor**, consultável no espaço pessoal do Aidant e do Usuário. A SOS Expat pode modificar esta tabela nas condições previstas no artigo 2.4.

**Provedor de Pagamento**: terceiro responsável pelo processamento do pagamento e distribuição de fundos.

**Parceiro B2B**: qualquer pessoa coletiva (empresa, associação, mútua, comissão de trabalhadores, organização, etc.) que tenha celebrado com a SOS Expat um contrato-quadro distinto prevendo que financiará, no todo ou em parte, as Taxas de Networking para os seus membros, colaboradores ou beneficiários (os "**Usuários B2B**"). Um **Networking B2B** é um networking iniciado por um Usuário B2B ao abrigo desse contrato-quadro. Por oposição, um **Networking B2C** é iniciado por um Usuário que paga diretamente a Taxa de Networking.

---

## 2. Objetivo, escopo e consentimento

2.1. Estes termos regem o acesso e uso da Plataforma por Aidants.

2.2. **SOS Expat atua apenas como intermediário técnico.** SOS Expat não é empregador, representante ou parceiro do Aidant, não fornece serviços legais, médicos, fiscais ou contábeis, nem é parte de qualquer contrato entre Aidant e Usuário.

2.3. **Consentimento eletrônico (Click-wrap).** O registro ou uso da Plataforma constitui aceitação destes Termos. A SOS pode manter provas técnicas (timestamp, ID, etc.).

2.4. **Alterações (pré-aviso P2B).** A SOS Expat pode atualizar os Termos e/ou a tabela de taxas a qualquer momento, mediante **pré-aviso mínimo de quinze (15) dias** em suporte duradouro, em conformidade com o artigo 3.º do Regulamento (UE) 2019/1150 ("P2B"). Pré-aviso reduzido ou suprimido: (i) imposição legal; (ii) segurança/anti-fraude; (iii) correções materiais sem impacto económico. Durante o pré-aviso, o Aidant pode **resolver sem penalização**. Caso contrário, uso continuado = aceitação.

2.5. **Capacidade profissional (B2B).** O Aidant declara atuar **exclusivamente de forma profissional**; proteção ao consumidor não se aplica.

---

## 3. Status do Aidant – Conformidade, permissões e responsabilidades

3.1. **Independência.** O Aidant atua como **profissional independente**; nenhum vínculo empregatício, agência ou joint venture é criado com SOS Expat.

3.2. **Autorização de trabalho e status migratório.** O Aidant é responsável por obter e manter todas as autorizações necessárias em cada país (visto, permissão de trabalho, registro comercial, seguro, licenças locais). A SOS Expat não verifica essas autorizações.

3.3. **Serviços não regulamentados.** O Aidant não fornecerá serviços regulamentados sem licenciamento adequado (legal, médico, financeiro, fiscal, etc.).

3.4. **Conformidade geral.** O Aidant cumprirá todas as leis aplicáveis (proteção do consumidor, e-commerce, publicidade, concorrência, AML/KYC, fiscal, proteção de dados, segurança, sanções etc.).

3.5. **Seguro.** O Aidant confirma que possui seguro profissional adequado para suas atividades.

3.6. **Confidencialidade.** O Aidant protegerá os dados do usuário e só os compartilhará mediante obrigação legal ou consentimento.

3.7. **Declarações e garantias do Aidant.** Ao registar-se na Plataforma, o Aidant declara e garante que: (a) é **maior** e tem **plena capacidade jurídica**; (b) dispõe ou disporá **antes de qualquer prestação** de **todas as autorizações** exigidas pelo direito do País de Intervenção (visto, autorização de trabalho, registo freelancer/trabalhador independente, identificação fiscal, licenças setoriais); (c) **não prestará qualquer serviço relativo a uma profissão regulada** (advogado, notário, médico, contabilista, consultor financeiro, agente imobiliário...) sem o título/licença exigido e redirecionará o Usuário; (d) não está sujeito a **proibição de exercício**; (e) não consta de **qualquer lista de sanções**; (f) as suas informações são **exatas** e serão atualizadas; (g) **assume sozinho a responsabilidade integral** pelo cumprimento das regras aplicáveis à sua atividade em cada País de Intervenção. Qualquer falsa declaração constitui violação grave.

---

## 4. Conta, verificação e segurança

4.1. **Registro.** Cada Aidant terá apenas uma conta; todas as informações devem ser precisas e atualizadas.

4.2. **Verificação.** A SOS Expat pode recusar, suspender ou excluir o acesso por motivos de segurança, conformidade ou qualidade.

4.3. **Segurança.** Atividades na conta são consideradas realizadas pelo Aidant.

4.4. **Inatividade.** Após 365 dias de inatividade, a conta poderá ser automaticamente desativada. O Aidant pode encerrar sua conta a qualquer momento após cumprir suas obrigações. A SOS Expat pode suspender ou encerrar contas por violação dos Termos.

4.5. **Comunicações eletrônicas.** O Aidant consente em receber notificações por meios eletrônicos (e-mail, notificações no aplicativo, publicação na plataforma).

4.6. **Sistema interno de tratamento de reclamações (Regulamento P2B).** Em conformidade com o artigo 11.º do Regulamento (UE) 2019/1150, a SOS Expat coloca à disposição do Aidant um **sistema interno de tratamento de reclamações gratuito**, acessível através do formulário de contacto (https://sos-expat.com/contact). A SOS Expat compromete-se a: (i) **acusar a receção** no prazo de **sete (7) dias úteis**; (ii) tratar a reclamação **com seriedade e sem discriminação, em prazo razoável** (regra geral **trinta (30) dias**); (iii) comunicar ao Aidant o resultado **fundamentado**; (iv) manter **estatísticas agregadas** anuais.

---

## 5. Regras de uso – qualidade, proibições e taxa de networking

5.1. **Qualidade e descrição.** O Aidant fornecerá descrições precisas de seus serviços; não serão feitas declarações falsas.

5.2. **Proibições.** Conteúdo ilegal, discriminatório ou enganoso; uso indevido de dados; acesso não autorizado à Plataforma; conluio; atividades ilícitas.

5.3. **Taxa de networking.** Cada nova conexão está sujeita à **taxa de networking**.

5.4. **Disponibilidade.** A Plataforma é fornecida **“no estado em que se encontra”**; não há garantia de continuidade.

---

## 6. Relação Aidant–Usuário (fora da Plataforma)

6.1. Após o networking, ambos podem celebrar contratos de forma independente.

6.2. O Aidant gerenciará condições de serviço e faturamento conforme a legislação local.

6.3. A SOS Expat **não é responsável pela qualidade ou resultados do serviço**.

---

## 7. Taxas, pagamento único e impostos

7.1. **Taxa de Networking (remuneração da Plataforma).** A Taxa de Networking remunera **exclusivamente o serviço técnico de matchmaking** fornecido pela SOS Expat ao **Usuário**. É **devida pelo Usuário, e não pelo Aidant**. O seu valor é definido na **tabela tarifária em vigor**, consultável no espaço pessoal do Aidant, por networking, sem impostos e sem taxas do Provedor de Pagamento. Qualquer alteração à tabela ocorre nas condições do artigo 2.4 (pré-aviso mínimo de quinze (15) dias).

7.2. **Caracterização jurídica do pagamento — duas dívidas distintas e independentes.** O pagamento efetuado pelo Usuário através da Plataforma decompõe-se **juridicamente em duas dívidas distintas e independentes**, apesar da sua liquidação por uma cobrança única por razões de comodidade operacional:
- (a) **Dívida "Networking"**: montante **devido pelo Usuário à SOS Expat** a título do serviço técnico de matchmaking (Taxa de Networking, art. 7.1);
- (b) **Dívida "Remuneração Aidant"**: montante **devido pelo Usuário ao Aidant** a título da prestação acordada entre eles. O conteúdo, a qualidade, o resultado, bem como a faturação detalhada, são da **exclusiva** competência da relação Aidant–Usuário, fora da Plataforma.

**A SOS Expat não recebe, não reclama e não tem direito a qualquer comissão, retrocessão, partilha, percentagem ou fração da remuneração do Aidant. A Taxa de Networking constitui a única remuneração da SOS Expat e provém exclusivamente da dívida do Usuário referida em (a).**

O Provedor de Pagamento, agindo para a parte (b) na qualidade de **agente pagador do Aidant**, transfere para este a remuneração recebida, sob dedução das únicas comissões bancárias de processamento e, se aplicável, das taxas de conversão de moeda. **O montante líquido que o Aidant receberá é exibido no seu painel antes e depois de cada transação.**

7.3. **Não reembolsável.** A taxa de networking não é reembolsável.

7.4. **Dedução em reembolso.** Qualquer reembolso pode ser deduzido da parte do Aidant.

7.5. **Moeda e conversão.** Diversas moedas são possíveis; taxas do provedor de pagamento podem se aplicar.

7.6. **Impostos.** O Aidant é responsável por todos os impostos aplicáveis.

7.7. **Indenização.** SOS Expat pode ajustar pagamentos para compensar reivindicações.

7.8. **Prazos de pagamento do Aidant consoante o canal.** Sob reserva da conclusão do processo KYC:
- (a) **B2C** (pagamento direto pelo Usuário): remuneração colocada em pagamento **imediatamente após a chamada** pelo Provedor (tipicamente 1 a 7 dias úteis consoante país/maturidade da conta);
- (b) **B2B** (pagamento pelo Parceiro B2B): tendo em conta o modelo de faturação diferida do Parceiro (mensal ou "net-30"), remuneração paga **no prazo de 30 dias** após a chamada;
- (c) Suspensão possível em caso de litígio, KYC em curso, ou outra circunstância dos Termos.

7.9. **Declaração fiscal automática (DAC7 — UE 2021/514).** O Aidant residente num Estado-Membro da UE é informado de que a SOS Expat, como operador de plataforma declarante, está obrigada a **declarar anualmente** às autoridades fiscais (Diretiva UE 2021/514 "DAC7"): nome, morada, identificador fiscal (TIN), Estado de residência, montante total recebido e número de networkings, por trimestre. O Aidant fornece e mantém atualizadas estas informações. Falha = suspensão de pagamentos.

7.10. **Canal B2B — Networkings via Parceiro B2B.**
(a) Âmbito: networking iniciado por um Usuário B2B ao abrigo de contrato-quadro celebrado entre a SOS Expat e um Parceiro B2B.
(b) Adaptação das duas dívidas: a dívida "Networking" é devida pelo **Parceiro B2B**; a dívida "Remuneração Aidant" continua devida pelo Usuário ao Aidant (salvo assunção pelo Parceiro).
(c) **Tarifas Aidant distintas B2C/B2B — o Aidant aceita-o expressamente.** A remuneração líquida em B2B pode diferir da B2C. O canal e o montante exato são **exibidos no seu painel antes de cada networking**. **Nenhuma obrigação de aceitação** recai sobre ele.
(d) Contrato-quadro B2B **não oponível** ao Aidant.
(e) Qualquer outra estipulação dos Termos aplica-se aos networkings B2B.
(f) **Tabelas em vigor (a título indicativo)**: **B2C: 30 € ou 30 USD líquidos**; **B2B: 20 € ou 20 USD líquidos**. A tabela atualizada é consultável no painel. Qualquer evolução está sujeita ao pré-aviso de 15 dias do art. 7.11.

7.11. **Modificação da tabela de remuneração do Aidant.** A SOS Expat reserva-se o direito de modificar a qualquer momento a tabela de remuneração líquida do Aidant (B2C, B2B, ou outro componente) com **pré-aviso de 15 dias** (art. 2.4). Durante o pré-aviso: rescisão sem penalização ou recusa caso a caso. **Networkings já aceites = tarifa de origem.** Uso continuado após o pré-aviso = aceitação.

7.12. **Sanções e embargos.** O acesso à Plataforma e aos serviços de pagamento pode ser **restringido ou bloqueado** em qualquer **país ou território sujeito a embargo global ou a medidas restritivas integrais** ao abrigo das leis aplicáveis (Provedores de Pagamento, UE, ONU, OFAC, HMT, ou qualquer outra autoridade competente). A lista atualizada é mantida pelas autoridades acima e faz fé; a SOS Expat não estabelece a sua própria lista geopolítica. O Aidant declara não constar de qualquer lista de sanções e respeitar os controlos de exportação.

7.13. **Fundos em espera prolongada — taxas de gestão e transferência às autoridades competentes.** Se o KYC não for concluído em 180 dias:
- (a) Taxas de gestão fixas razoáveis, **limitadas a 10%**, cobrindo estritamente os custos administrativos efetivos;
- (b) Conservação prolongada em conta segregada; o Aidant pode concluir o KYC a qualquer momento;
- (c) Após **5 anos**, transferência dos fundos residuais à **autoridade competente do país de residência do Aidant** ao abrigo das regras aplicáveis aos fundos não reclamados (Caisse des dépôts em França via lei Eckert; programas de unclaimed property nos EUA; Dormant Assets Scheme no Reino Unido; mecanismos locais equivalentes). **A SOS Expat não se apropria em caso algum destes fundos residuais.**

Reclamação durante a conservação prolongada: o Aidant pode enviar pedido fundamentado + KYC completo; análise em **30 dias**; dedução apenas das taxas de gestão (a). Força maior / incapacidade médica = taxas reduzíveis ou suprimíveis a critério razoável da SOS Expat. **Aceitação expressa** deste artigo 7.13.

---

## 8. Dados pessoais (global – GDPR/DSA)

8.1. **Papéis.** Para dados de usuários recebidos para fins de networking, SOS Expat e o Aidant atuam como controladores de dados independentes para seus próprios fins, em conformidade com o **Regulamento (UE) 2016/679 (GDPR)**.

8.2. **Finalidade.** Networking, segurança, prevenção de fraude, conformidade legal.

8.3. **Transferência internacional.** Medidas de segurança adequadas são aplicadas.

8.4. **Direitos e contato.** Via formulário de contato da Plataforma.

8.5. **Segurança.** Medidas técnicas e organizacionais apropriadas.

8.6. O Aidant processará dados conforme leis do país/local.

8.7. **Conformidade DSA.** A Plataforma opera como um **serviço intermediário** nos termos do **Regulamento (UE) 2022/2065 (Digital Services Act)**. A SOS Expat implementa mecanismos para denúncia de conteúdo ilegal e coopera com as autoridades competentes em conformidade com o DSA.

---

## 9. Propriedade intelectual

A Plataforma, marcas, logotipos, banco de dados e conteúdo são protegidos. O Aidant recebe apenas direito limitado, pessoal e não transferível. O conteúdo fornecido pelo Aidant concede à SOS Expat licença não exclusiva para hospedagem e exibição na Plataforma.

---

## 10. Garantia, responsabilidade e indenização

10.1. Sem garantia de resultados ou qualidade.

10.2. **Limite de responsabilidade:** responsabilidade total limitada à taxa de networking.

10.3. **Exclusão:** danos indiretos, consequenciais ou punitivos não aplicáveis.

10.4. **Indenização:** Aidant indenizará SOS Expat por quaisquer reivindicações, danos ou custos legais.

10.5. **Renúncia ao recurso.** O Aidant **renuncia expressa e irrevogavelmente** a qualquer recurso contra a SOS Expat por: (i) danos decorrentes da prestação de serviços, (ii) perdas indiretas, (iii) disputas contratuais com Usuários, (iv) qualquer falha nos serviços prestados pelo Aidant. Esta renúncia aplica-se na máxima extensão permitida por lei.

10.6. **Sem representação.** Nada aqui cria relação de agência, emprego, parceria ou joint venture entre a SOS Expat e o Aidant.

10.7. **Força maior.** A SOS Expat não é responsável por atrasos ou falhas causados por eventos de **força maior** (desastre natural, guerra, pandemia, ciberataque, interrupção de energia ou internet, decisão governamental, greve, etc.).

10.8. Estas disposições permanecem válidas após término.

---

## 11. Lei aplicável – Arbitragem – Jurisdição estoniana – Ação coletiva

11.1. **Lei aplicável:** para cada conexão, aplica-se a lei do país/local. Para evitar qualquer ambiguidade, as regras imperativas aplicáveis à atividade do Aidant no País de Intervenção (imigração, direito do trabalho/trabalho independente, fiscalidade, proteção do consumidor, dados pessoais, publicidade/prospeção, segurança das pessoas, deontologias setoriais quando aplicável) são **consideradas de ordem pública** e **prevalecem** sobre qualquer estipulação contrária ou ambígua dos presentes Termos. Nenhuma cláusula dos Termos pode ser interpretada como impondo ou autorizando o Aidant a adotar comportamento contrário a estas regras; em caso de conflito, o Aidant abstém-se e informa a SOS Expat sem demora.

11.2. **Arbitragem ICC:** todas as disputas resolvidas conforme regras ICC. Local: Tallinn, Estônia; idioma: francês.

11.3. **Renúncia à ação coletiva.**

11.4. **Jurisdicional estoniana.**

11.5. **Mediação prévia obrigatória e mediadores identificados (Regulamento P2B).** Antes de qualquer arbitragem, negociação de boa-fé durante **30 dias**. Em conformidade com o artigo 12.º do Regulamento (UE) 2019/1150, a SOS Expat identifica pelo menos dois (2) mediadores: **(i) CMAP (cmap.fr); (ii) WIPO Arbitration and Mediation Center (wipo.int/amc)**. A SOS Expat suporta uma **parte razoável** das despesas. O fracasso é prévio à arbitragem.

11.6. **Prescrição.** Qualquer ação do Aidant contra a SOS Expat deve ser proposta no **prazo mais curto entre 3 anos** a contar do facto gerador **e o prazo legal aplicável** na jurisdição do Aidant, sem reduzir aquém de um mínimo imperativo local não reduzível.

---

## 12. Diversos

12.1. **Transferência.** SOS Expat pode transferir seus direitos.

12.2. **Acordo completo.**

12.3. **Notificações.** Via publicação na Plataforma ou formulário de contato.

12.4. **Interpretação.**

12.5. **Idiomas.** O francês é a versão original.

12.6. **Separabilidade.**

12.7. **Não renúncia.**

---

## 13. Confidencialidade das comunicações e política de gravação

As comunicações realizadas através da Plataforma (mensagens, chamadas telefónicas) são **confidenciais**.

**Política de gravação:**
- (a) **Por defeito**, a SOS Expat **NÃO grava o conteúdo áudio** das chamadas entre Aidant e Usuário. Apenas os **metadados técnicos** são conservados (timestamp, duração, identificadores Twilio, estado) para fins de faturação, anti-fraude e resolução de litígios técnicos;
- (b) A SOS Expat **não ativa qualquer gravação áudio sem o consentimento explícito, prévio e separado do Aidant E do Usuário**, manifestado antes do início da chamada por ação positiva distinta. Nenhuma gravação pode ser desencadeada unilateralmente pela SOS Expat, com a única exceção de **requisição regular emanada de uma autoridade judicial competente do país do Aidant ou do Usuário**;
- (c) Quando uma gravação é excecionalmente ativada no âmbito da alínea (b), é conservada pelo período estritamente necessário à sua finalidade, no limite máximo de **6 meses** (salvo prolongamento imposto por procedimento judicial em curso), em conformidade com o RGPD e as recomendações das autoridades locais de proteção de dados;
- (d) **O Aidant abstém-se de** gravar, transcrever integralmente, divulgar ou utilizar as comunicações para outros fins que não a prestação acordada, salvo autorização escrita do Usuário ou obrigação legal.

---

## 14. Contato

Para perguntas ou questões legais, entre em contato conosco:

`;

  // Fallback de contenu par langue
  // const defaultContent: string = selectedLanguage === 'fr' ? defaultFr : defaultEn;
  const defaultContent: string =
    selectedLanguage === "fr"
      ? defaultFr
      : selectedLanguage === "es"
        ? defaultEs
        : selectedLanguage === "de"
          ? defaultDe
          : selectedLanguage === "ru"
            ? defaultRu
            : selectedLanguage === "hi"
              ? defaultHi
              : selectedLanguage === "ch"
                ? defaultCh
                : selectedLanguage === "ar"
                  ? defaultAr
                  : selectedLanguage === "pt"
                    ? defaultPt
                    : defaultEn;

  // Ancrage UI
  const anchorMap = useMemo(
    () => [
      { num: 1, label: t.sections.definitions },
      { num: 2, label: t.sections.scope },
      { num: 3, label: t.sections.status },
      { num: 4, label: t.sections.account },
      { num: 5, label: t.sections.rules },
      { num: 6, label: t.sections.relationship },
      { num: 7, label: t.sections.fees },
      { num: 8, label: t.sections.data },
      { num: 9, label: t.sections.ip },
      { num: 10, label: t.sections.liability },
      { num: 11, label: t.sections.law },
      { num: 12, label: t.sections.misc },
      { num: 13, label: t.sections.contact },
    ],
    [t.sections]
  );

  const body = content || defaultContent;

  return (
    <Layout>
      <SEOHead title={`${t.title || "Expat Terms"} - SOS Expat`} description={t.subtitle || "Terms and conditions for SOS Expat helpers."} ogType="website" contentType="WebPage" />
      <BreadcrumbSchema items={[{ name: 'Home', url: '/' }, { name: t.title || 'Expat Terms' }]} />
      <main className="min-h-screen bg-gray-950">
        {/* HERO */}
        <section className="relative pt-20 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-blue-500/10 pointer-events-none" />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-6">
            {/* Badge + langues */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full pl-5 pr-4 py-2.5 border border-white/20 text-white">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-semibold">{t.heroBadge}</span>
                <span className="mx-1 text-white/40">•</span>
                <span className="text-sm text-white/90">{t.lastUpdated}</span>
              </div>

              {/* <div className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-1">
                <button
                  type="button"
                  onClick={() => handleLanguageChange('fr')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    selectedLanguage === 'fr' ? 'bg-white text-gray-900' : 'text-white hover:bg-white/10'
                  }`}
                  aria-pressed={selectedLanguage === 'fr'}
                >
                  <Languages className="w-4 h-4" />
                  FR
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('en')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    selectedLanguage === 'en' ? 'bg-white text-gray-900' : 'text-white hover:bg-white/10'
                  }`}
                  aria-pressed={selectedLanguage === 'en'}
                >
                  <Languages className="w-4 h-4" />
                  EN
                </button>
              </div> */}
            </div>

            <header className="text-center">
              <h1 className="text-4xl sm:text-6xl font-black mb-4 leading-tight">
                <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                  {t.title}
                </span>
              </h1>
              <p className="text-lg sm:text-2xl text-gray-300 max-w-3xl mx-auto">
                {t.subtitle}
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-white/90">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 border border-white/20 backdrop-blur-sm">
                  <Shield className="w-4 h-4" /> <span>{t.keyFeatures}</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 border border-white/20 backdrop-blur-sm">
                  <Users className="w-4 h-4" />{" "}
                  <span>{t.trustedByHelpers}</span>
                </span>
                {/* Avis retirés sur demande */}
              </div>

              <div className="mt-8 flex items-center justify-center gap-4">
                <Link
                  to={getLocalePath("/sos-appel")}
                  className="group inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm font-semibold"
                >
                  <FileText className="w-5 h-5" />
                  <span>{t.ctaHero}</span>
                </Link>
                <a
                  href="https://sos-expat.com/contact"
                  className="group inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white font-bold border-2 border-red-400/50 hover:scale-105 transition-all"
                >
                  <Heart className="w-5 h-5" />
                  <span>{t.contactUs}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </header>
          </div>
        </section>

        {/* Bandeau points clés */}
        <section className="py-10 bg-gray-950">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: <DollarSign className="w-6 h-6" />,
                  text: t.features[0],
                  gradient: "from-green-500 to-emerald-500",
                },
                {
                  icon: <Clock className="w-6 h-6" />,
                  text: t.features[1],
                  gradient: "from-yellow-500 to-orange-500",
                },
                {
                  icon: <Globe className="w-6 h-6" />,
                  text: t.features[2],
                  gradient: "from-blue-500 to-purple-500",
                },
                {
                  icon: <UserCheck className="w-6 h-6" />,
                  text: t.features[3],
                  gradient: "from-red-500 to-orange-500",
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className="group flex items-center gap-3 p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.01]"
                >
                  <span
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r ${f.gradient} text-white`}
                  >
                    {f.icon}
                  </span>
                  <span className="text-white/90 font-semibold">{f.text}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-400 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {t.editHint}
            </p>
          </div>
        </section>

        {/* Sommaire */}
        <section className="py-8 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 text-white">
                  <Globe className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                  {t.anchorTitle}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {anchorMap.map((s) => (
                  <a
                    key={s.num}
                    href={`#section-${s.num}`}
                    className="group flex items-center gap-3 px-4 py-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-gray-900 text-white text-xs font-bold">
                      {s.num}
                    </span>
                    <span className="text-gray-700 group-hover:text-gray-900">
                      {s.label}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contenu principal */}
        <section className="py-10 sm:py-14 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-5xl mx-auto px-6">
            {isLoading ? (
              <div className="space-y-4" aria-live="polite" aria-busy="true">
                <div className="h-8 w-2/3 bg-gray-200 rounded-xl animate-pulse" />
                <div className="h-6 w-1/2 bg-gray-200 rounded-xl animate-pulse" />
                <div className="h-5 w-full bg-gray-200 rounded-xl animate-pulse" />
                <div className="h-5 w-11/12 bg-gray-200 rounded-xl animate-pulse" />
                <div className="h-5 w-10/12 bg-gray-200 rounded-xl animate-pulse" />
                <div className="h-5 w-9/12 bg-gray-200 rounded-xl animate-pulse" />
              </div>
            ) : (
              <article className="prose max-w-none">
                <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-10 shadow-sm">
                  {parseMarkdownContent(body)}
                </div>
              </article>
            )}
          </div>
        </section>

        {/* Bandeau final */}
        <section className="py-20 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/20 pointer-events-none" />
          <div className="relative z-10 max-w-5xl mx-auto text-center px-6">
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">
              {t.readyToJoin}
            </h2>
            <p className="text-lg sm:text-2xl text-white/95 mb-10 leading-relaxed">
              {t.readySubtitle}
            </p>

            <div className="mb-8 flex flex-wrap items-center justify-center gap-3 text-white/90">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 border border-white/20 backdrop-blur-sm">
                <Shield className="w-4 h-4" /> Sécurisé
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 border border-white/20 backdrop-blur-sm">
                <Clock className="w-4 h-4" />{" "}
                <span>Moins de 5&nbsp;minutes</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 border border-white/20 backdrop-blur-sm">
                <Globe className="w-4 h-4" /> Mondial
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <Link
                to={getLocalePath("/register")}
                className="group relative overflow-hidden bg-white text-red-600 hover:text-red-700 px-10 py-5 rounded-3xl font-black text-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl flex items-center gap-3"
              >
                <span>{t.startNow}</span>
                {/* Flèche retirée sur demande */}
                <span className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-black/5" />
              </Link>

              <a
                href="https://sos-expat.com/contact"
                className="group relative overflow-hidden border-2 border-white bg-transparent text-white px-10 py-5 rounded-3xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:bg-white/10 flex items-center gap-3"
              >
                <Heart className="w-5 h-5" />
                <span>{t.contactUs}</span>
                <span className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/30" />
              </a>
            </div>

            {/* Ligne avis retirée */}
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default TermsExpats;
