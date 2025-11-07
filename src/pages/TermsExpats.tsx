import React, { useEffect, useMemo, useState } from "react";
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

/**
 * Important :
 * - Logique métier conservée (Firestore, parsing, sélection langue via useApp).
 * - Design refondu pour matcher Home (gradients, cards, badges, CTA), mobile-first.
 * - 100% éditable depuis l'admin (collection `legal_documents`).
 * - Aucun `any`.
 */

const TermsExpats: React.FC = () => {
  const { language } = useApp();

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
      lastUpdated: "Version 2.2 – Dernière mise à jour : 16 juin 2025",
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
        data: "Données personnelles (cadre global)",
        ip: "Propriété intellectuelle",
        liability: "Garanties, responsabilité et indemnisation",
        law: "Droit applicable – Arbitrage – Juridiction estonienne",
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
      lastUpdated: "Version 2.2 – Last updated: 16 June 2025",
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
        data: "Data Protection (Global Framework)",
        ip: "Intellectual Property",
        liability: "Warranties, Liability and Indemnity",
        law: "Governing Law – ICC Arbitration – Estonian Courts",
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
      lastUpdated: "Versión 2.2 – Última actualización: 16 de junio de 2025",
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
        data: "Datos personales (marco global)",
        ip: "Propiedad intelectual",
        liability: "Garantías, responsabilidad e indemnización",
        law: "Ley aplicable – Arbitraje – Jurisdicción estonia",
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
      lastUpdated: "Version 2.2 – Letzte Aktualisierung: 16. Juni 2025",
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
        data: "Personenbezogene Daten (globaler Rahmen)",
        ip: "Geistiges Eigentum",
        liability: "Garantien, Haftung und Entschädigung",
        law: "Anwendbares Recht – Schiedsverfahren – Estnische Gerichtsbarkeit",
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
      lastUpdated: "Версия 2.2 – Последнее обновление: 16 июня 2025 г.",
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
        data: "Персональные данные (глобальная структура)",
        ip: "Интеллектуальная собственность",
        liability: "Гарантии, ответственность и возмещение ущерба",
        law: "Применимое право – Арбитраж – Эстонская юрисдикция",
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
      lastUpdated: "संस्करण 2.2 – अंतिम अपडेट: 16 जून 2025",
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
        data: "व्यक्तिगत डेटा (वैश्विक ढांचा)",
        ip: "बौद्धिक संपदा",
        liability: "वारंटी, दायित्व और क्षतिपूर्ति",
        law: "लागू कानून – मध्यस्थता – एस्टोनियाई अधिकार क्षेत्र",
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
      lastUpdated: "版本 2.2 – 最后更新：2025年6月16日",
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
        data: "数据保护（全球框架）",
        ip: "知识产权",
        liability: "保证、责任与赔偿",
        law: "适用法律 – ICC 仲裁 – 爱沙尼亚法院",
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
      lastUpdated: "الإصدار 2.2 – آخر تحديث: 16 يونيو 2025",
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
        data: "حماية البيانات (الإطار العالمي)",
        ip: "الملكية الفكرية",
        liability: "الضمانات والمسؤولية والتعويض",
        law: "القانون الحاكم – التحكيم ICC – المحاكم الإستونية",
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
  lastUpdated: "Versão 2.2 – Última atualização: 16 de junho de 2025",
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
    data: "Proteção de dados (estrutura global)",
    ip: "Propriedade intelectual",
    liability: "Garantias, responsabilidade e indenização",
    law: "Lei aplicável – Arbitragem ICC – Tribunais estonianos",
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
              <span dangerouslySetInnerHTML={{ __html: formattedContent }} />
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
              href="http://localhost:5174/contact"
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
            dangerouslySetInnerHTML={{ __html: formattedLine }}
          />
        );
      }
    }

    return elements;
  };

  // Contenu par défaut FR (une seule paire de ** pour éviter le parsing foireux)
  const defaultFr = `
# Conditions Générales d'Utilisation – Expatriés Aidants (Global)

**SOS Expat d'Ulixai OÜ** (la « **Plateforme** », « **SOS** », « **nous** »)

**Version 2.2 – Dernière mise à jour : 16 juin 2025**

---

## 1. Définitions

**Expatrié Aidant** (« **Aidant** ») : toute personne inscrite sur la Plateforme pour proposer, à titre indépendant, des services d'assistance non juridiques et non médicaux à des Utilisateurs (orientation, démarches pratiques, accompagnement, traduction informelle, mise en relation locale, etc.).

**Utilisateur** : toute personne utilisant la Plateforme pour contacter un Aidant.

**Mise en relation** : l'introduction technique/opérationnelle réalisée par la Plateforme entre un Utilisateur et un Aidant (transmission de coordonnées et/ou ouverture d'un canal de communication et/ou acceptation par l'Aidant d'une demande émise via la Plateforme).

**Pays d'Intervention** : la juridiction principalement visée par la demande de l'Utilisateur au moment de la Mise en relation ; à défaut, le pays de résidence de l'Utilisateur à la date de la demande.

**Frais de Mise en relation** : frais fixes dus à SOS par Mise en relation (art. 7) : **19 €** si paiement en **EUR** ou **25 $ USD** si paiement en **USD**, susceptibles d'évolution et/ou de **barèmes locaux** par pays/devise, avec effet prospectif.

**Prestataire(s) de paiement** : services tiers traitant les encaissements et la répartition des fonds.

---

## 2. Objet, champ et acceptation

2.1. Les présentes CGU régissent l'accès et l'utilisation de la Plateforme par les Aidants.

2.2. **Ulixai agit exclusivement comme intermédiaire technique de Mise en relation.** Ulixai n'est pas employeur, mandataire ou partenaire des Aidants, ne fournit aucun conseil juridique, médical, fiscal, comptable ou réglementé, et n'est pas partie aux contrats entre Aidants et Utilisateurs.

2.3. **Acceptation électronique (click-wrap).** L'inscription et/ou l'usage de la Plateforme valent acceptation des CGU, signature électronique et consentement contractuel. SOS peut conserver des preuves techniques (horodatage, identifiants).

2.4. **Modifications.** SOS peut mettre à jour les CGU et/ou les barèmes de frais (par pays/devise) avec **effet prospectif** par publication sur la Plateforme. L'usage continu vaut acceptation.

2.5. **Capacité professionnelle (B2B).** L'Aidant déclare agir **exclusivement à des fins professionnelles** ; les régimes de protection des consommateurs ne s'appliquent pas à la relation Ulixai–Aidant.

---

## 3. Statut de l'Aidant – Conformité, autorisations et responsabilités

3.1. **Indépendance.** L'Aidant agit en **professionnel indépendant** ; aucun lien d'emploi, mandat, agence, partenariat ou coentreprise n'est créé avec Ulixai.

3.2. **Autorisation de travail & statut d'immigration.** L'Aidant est **seul responsable** d'obtenir et de maintenir **toutes autorisations** requises dans chaque Pays d'Intervention (visa, permis de travail, enregistrement d'activité/auto-entreprise, assurances, licences locales, etc.). Ulixai **ne vérifie pas** ces autorisations et **n'assume aucune responsabilité** à ce titre.

3.3. **Services non réglementés.** L'Aidant s'engage à **ne pas fournir de services réglementés** (ex. conseil juridique, médical, financier, d'expert-comptable, d'agent immobilier, etc.) **sans** détenir les **autorisations/licences** nécessaires **et** sans se conformer pleinement aux lois locales. À défaut, il s'abstient de tels services et redirige l'Utilisateur vers un professionnel dûment habilité (ex. avocat inscrit).

3.4. **Conformité générale.** L'Aidant respecte les lois/règlements applicables (consommation, e-commerce, publicité/démarchage, concurrence loyale, LCB-FT/KYC le cas échéant, fiscalité, protection des données, sanctions/export, sécurité des personnes).

3.5. **Assurances.** L'Aidant déclare disposer des assurances nécessaires (responsabilité civile pro, le cas échéant) couvrant ses activités et territoires d'intervention.

3.6. **Confidentialité.** L'Aidant protège les informations des Utilisateurs et s'abstient de les divulguer, sauf obligation légale ou consentement.

---

## 4. Compte, vérifications et sécurité

4.1. **Inscription.** Un (1) compte par Aidant ; informations exactes, complètes et à jour (identité, moyens de contact, description des services, zones d'intervention, etc.).

4.2. **Vérifications.** Ulixai peut procéder à des contrôles raisonnables (identité, cohérence du profil, screenings sanctions/KYC via Prestataires) et refuser/suspendre/retirer l'accès pour motif de sécurité, conformité ou qualité de service.

4.3. **Sécurité des accès.** L'Aidant protège ses identifiants. Toute activité via le compte est réputée effectuée par lui.

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

6.3. Ulixai **n'est pas responsable** de la qualité, de l'exactitude ou du résultat des services de l'Aidant, ni des engagements pris entre l'Aidant et l'Utilisateur.

---

## 7. Frais, paiement unique et taxes

7.1. **Frais de Mise en relation (forfait).** **19 € (EUR)** **ou** **25 $ (USD)** **par Mise en relation**, hors taxes et hors frais du Prestataire de paiement. Ulixai peut modifier ces montants et/ou publier des **barèmes locaux** par pays/devise, avec effet prospectif.

7.2. **Paiement unique & répartition.** L'Utilisateur effectue **un paiement unique** via la Plateforme couvrant (i) la **rémunération de l'Aidant** (telle que convenue) et (ii) les **Frais de Mise en relation** d'Ulixai. Ulixai (ou son Prestataire) encaisse, **déduit** ses frais, puis **reverse** le solde à l'Aidant. L'Aidant **autorise** ces déductions et répartitions.

7.3. **Exigibilité & non-remboursement.** Les Frais de Mise en relation sont **dus dès** la Mise en relation et sont **non remboursables** (sauf geste commercial discrétionnaire d'Ulixai en cas d'échec exclusivement imputable à la Plateforme et **dans la mesure permise par la loi**).

7.4. **Remboursements Utilisateur.** Si un remboursement est accordé à l'Utilisateur, il est **imputé sur la part de l'Aidant** : Ulixai peut **retenir/compenser** le montant correspondant sur les versements futurs de l'Aidant ou en demander le remboursement si aucun versement n'est à venir. **Aucun remboursement** des Frais de Mise en relation n'est dû, sauf décision discrétionnaire d'Ulixai.

7.5. **Devises & conversion.** Plusieurs devises peuvent être proposées ; des taux/frais de conversion du Prestataire peuvent s'appliquer.

7.6. **Taxes.** L'Aidant demeure responsable de **toutes taxes** applicables (TVA, impôt sur le revenu, sécurité sociale, etc.). Ulixai collecte/reverse, lorsque requis, la TVA/équivalent local sur les Frais de Mise en relation.

7.7. **Compensation.** Ulixai peut compenser toute somme due par l'Aidant avec toute somme payable à l'Aidant.

---

## 8. Données personnelles (cadre global)

8.1. **Rôles.** Pour les données d'Utilisateurs reçues aux fins de Mise en relation, **Ulixai et l'Aidant** agissent **chacun** en **responsable de traitement** pour leurs propres finalités.

8.2. **Bases & finalités.** Exécution du contrat (Mise en relation), intérêts légitimes (sécurité, prévention de la fraude, amélioration), conformité légale (LCB-FT, sanctions), et consentement lorsque requis.

8.3. **Transferts internationaux** avec **garanties appropriées** lorsque requis.

8.4. **Droits & contact.** Exercice via le **formulaire de contact** de la Plateforme.

8.5. **Sécurité.** Mesures techniques/organisationnelles raisonnables ; notification des violations selon les lois applicables.

8.6. L'Aidant traite les données conformément au droit du **Pays d'Intervention**.

---

## 9. Propriété intellectuelle

La Plateforme, ses marques, logos, bases de données et contenus sont protégés. Aucun droit n'est cédé à l'Aidant, hormis un droit **personnel, non exclusif, non transférable** d'accès pendant la durée des CGU. Les contenus fournis par l'Aidant font l'objet d'une **licence mondiale, non exclusive** au profit d'Ulixai pour l'hébergement et l'affichage dans la Plateforme.

---

## 10. Garanties, responsabilité et indemnisation

10.1. **Aucune garantie** quant aux résultats/qualité/volume d'affaires ; la Plateforme est fournie **« en l'état »**.

10.2. **Limitation de responsabilité** : dans la mesure permise, la responsabilité totale d'Ulixai envers l'Aidant est limitée aux **dommages directs** et **ne peut excéder** le total des **Frais de Mise en relation** perçus par Ulixai au titre de la **transaction** à l'origine de la réclamation.

10.3. **Exclusions** : aucun dommage indirect/consécutif/spécial/punitif (perte de profits, d'opportunités, de clientèle, atteinte à la réputation, coûts de remplacement, etc.).

10.4. **Indemnisation** : l'Aidant **indemnise et garantit** Ulixai (ainsi que ses affiliés, dirigeants, employés, agents) contre toute réclamation, perte, dommage, pénalité et frais (dont honoraires d'avocat) liés à (i) son manquement aux CGU/lois, (ii) ses contenus, (iii) ses services/omissions, (iv) l'absence d'autorisations de travail/immigration/licences.

10.5. **Aucune représentation.** Rien n'emporte mandat, emploi, partenariat ou coentreprise entre Ulixai et l'Aidant.

10.6. **Survie.** Les art. 5, 7, 8, 9, 10, 11 et 12 survivent à la résiliation.

---

## 11. Droit applicable – Arbitrage – Juridiction estonienne – Actions collectives

11.1. **Droit matériel** : pour chaque Mise en relation, la relation **Ulixai–Aidant** est régie par les **lois du Pays d'Intervention**, sous réserve des règles d'ordre public locales et des normes internationales impératives. **À titre supplétif et pour l'interprétation/validité des présentes CGU ainsi que pour toute question non régie par le droit du Pays d'Intervention, le droit estonien s'applique.**

11.2. **Arbitrage CCI obligatoire** : tout litige Ulixai/Aidant est résolu **définitivement** selon le Règlement d'Arbitrage de la **CCI**. **Siège : Tallinn (Estonie)**. **Langue : français.** Le tribunal applique le **droit matériel** défini à l'art. 11.1. Procédure **confidentielle**.

11.3. **Renonciation aux actions collectives** : dans la mesure permise, toute action **collective/de groupe/représentative** est exclue ; réclamations **individuelles uniquement**.

11.4. **Compétence exclusive des tribunaux d'Estonie** : pour toute demande **non arbitrable**, l'**exécution** des sentences ou les **mesures urgentes**, les tribunaux estoniens (compétents à Tallinn) ont compétence **exclusive**. L'Aidant renonce à toute objection de forum/non-convenance.

---

## 12. Divers

12.1. **Cession.** Ulixai peut céder les CGU à une entité de son groupe ou à un successeur ; l'Aidant ne peut céder sans accord écrit d'Ulixai.

12.2. **Intégralité.** Les CGU constituent l'accord complet et remplacent tout accord antérieur relatif au même objet.

12.3. **Notifications.** Par publication sur la Plateforme, notification in-app ou via le **formulaire de contact**.

12.4. **Interprétation.** Les intitulés sont indicatifs. Aucune règle **contra proferentem**.

12.5. **Langues.** Des traductions peuvent être fournies ; **le français prévaut** pour l'interprétation.

12.6. **Nullité partielle.** Si une stipulation est nulle/inapplicable, le reste demeure en vigueur ; remplaçable par une stipulation valide d'effet équivalent lorsque possible.

12.7. **Non-renonciation.** L'absence d'exercice d'un droit n'emporte pas renonciation.

---

## 13. Contact

Pour toute question ou demande légale, contactez-nous :
`;

  // Contenu par défaut EN (une seule paire de **)
  const defaultEn = `
# Terms of Use – Expatriate Helpers (Global)

**SOS Expat by Ulixai OÜ** (the "**Platform**", "**SOS**", "**we**")

**Version 2.2 – Last updated: 16 June 2025**

---

## 1. Definitions

**Expatriate Helper (“Helper”):** any person registered on the Platform to offer, on an independent basis, non-legal and non-medical assistance services to Users (guidance, practical support, informal translation, local networking, etc.).

**User:** any person using the Platform to contact a Helper.

**Connection:** the technical/operational introduction made by the Platform between a User and a Helper (transmission of contact details and/or opening of a communication channel and/or acceptance by the Helper of a request submitted through the Platform).

**Country of Operation:** the jurisdiction primarily targeted by the User’s request at the time of Connection; failing that, the User’s country of residence at the date of the request.

**Connection Fee:** fixed fee payable to SOS per Connection (art. 7): **€19** if paid in EUR or **$25 USD** if paid in USD, subject to change and/or **local rate schedules** by country/currency, with prospective effect.

**Payment Service Providers:** third-party services processing payments and fund distribution.

---

## 2. Purpose, Scope and Acceptance

2.1. These Terms of Use govern access to and use of the Platform by Helpers.

2.2. Ulixai acts solely as a technical intermediary for Connections. Ulixai is not the employer, agent, or partner of Helpers, provides no legal, medical, tax, accounting, or other regulated advice, and is not a party to contracts between Helpers and Users.

2.3. **Electronic acceptance (click-wrap):** Registration and/or use of the Platform constitutes acceptance of these Terms, electronic signature, and contractual consent. SOS may retain technical evidence (timestamps, identifiers).

2.4. **Modifications:** SOS may update the Terms and/or fee schedules (by country/currency) with prospective effect by publishing them on the Platform. Continued use constitutes acceptance.

2.5. **Professional capacity (B2B):** The Helper declares to act solely for professional purposes; consumer protection regimes do not apply to the Ulixai–Helper relationship.

---

## 3. Helper status – Compliance, authorizations, and responsibilities

3.1. **Independence:** The Helper acts as an independent professional; no employment, agency, partnership, or joint venture relationship is created with Ulixai.

3.2. **Work authorization & immigration status:** The Helper is solely responsible for obtaining and maintaining all required authorizations in each Country of Operation (visa, work permit, business registration/self-employment, insurance, local licenses, etc.). Ulixai does not verify such authorizations and assumes no responsibility in this regard.

3.3. **Unregulated services:** The Helper agrees not to provide regulated services (e.g. legal, medical, financial, accounting, or real estate advice, etc.) without holding the required authorizations/licenses and full compliance with local laws. Otherwise, the Helper must refrain from such services and refer the User to a duly licensed professional (e.g. a registered lawyer).

3.4. **General compliance:** The Helper complies with applicable laws/regulations (consumer protection, e-commerce, advertising/solicitation, fair competition, AML/KYC where applicable, taxation, data protection, sanctions/export, and personal safety).

3.5. **Insurance:** The Helper declares to hold necessary insurance (e.g., professional liability) covering their activities and territories of operation.

3.6. **Confidentiality:** The Helper protects Users’ information and shall not disclose it except where legally required or with consent.

---

## 4. Account, verification, and security

4.1. **Registration** One (1) account per Helper; information must be accurate, complete, and up to date (identity, contact details, service descriptions, operational areas, etc.).

4.2. **Verification** Ulixai may perform reasonable checks (identity, profile consistency, sanctions/KYC screenings via Providers) and may refuse/suspend/remove access for reasons of security, compliance, or service quality.

4.3. **Access security** The Helper protects their login credentials. Any activity under the account is deemed to have been performed by them.

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

6.3. Ulixai is not responsible for the quality, accuracy, or outcome of the Helper’s services, nor for any commitments made between Helper and User.

---

## 7. Fees, Single Payment and Taxes

7.1. **Connection Fee (flat rate): €19 (EUR) or $25 (USD)** per Connection, excluding taxes and Payment Provider fees. Ulixai may modify these amounts and/or publish local rate schedules by country/currency, with prospective effect.

7.2. **Single payment & distribution:** The User makes a single payment via the Platform covering (i) the Helper’s remuneration (as agreed) and (ii) Ulixai’s Connection Fee. Ulixai (or its Provider) collects, deducts its fee, and transfers the remaining balance to the Helper. The Helper authorizes such deductions and allocations.

7.3. **Due and non-refundable:** The Connection Fee is due as soon as the Connection is made and non-refundable (except at Ulixai’s discretionary goodwill in case of a failure solely attributable to the Platform and to the extent permitted by law).

7.4. **User refunds:** If a refund is granted to a User, it is deducted from the Helper’s share: Ulixai may withhold/offset the corresponding amount from future payments to the Helper or request repayment if no payment is pending. No refund of Connection Fees is due, except at Ulixai’s discretion.

7.5. **Currencies & conversion:** Multiple currencies may be offered; Provider exchange rates/fees may apply.

7.6. **Taxes** The Helper remains responsible for all applicable taxes (VAT, income tax, social security, etc.). Ulixai collects/remits, where required, VAT/equivalent on Connection Fees.

7.7. **Set-off** Ulixai may offset any amount owed by the Helper against any amount payable to the Helper.

---

## 8. Data Protection (Global Framework)

8.1. **Roles** For User data received for Connection purposes, Ulixai and the Helper each act as independent data controllers for their own purposes.

8.2. **Legal bases & purposes** Contract performance (Connection), legitimate interests (security, fraud prevention, improvement), legal compliance (AML, sanctions), and consent where required.

8.3. International transfers with appropriate safeguards where required.

8.4. **Rights & contact** Exercised via the Platform’s contact form.

8.5. **Security** Reasonable technical/organizational measures; breach notifications according to applicable law.

8.6. The Helper processes data in accordance with the law of the Country of Operation.
---

## 9. Intellectual Property

The Platform, its trademarks, logos, databases, and content are protected. No rights are transferred to the Helper, except for a personal, non-exclusive, non-transferable right of access during the term of these Terms. Content provided by the Helper is subject to a worldwide, non-exclusive license in favor of Ulixai for hosting and display on the Platform.

---

## 10. Warranties, Liability and Indemnity

10.1. No guarantee regarding results/quality/business volume; the Platform is provided “as is”.

10.2. **Liability limitation:** to the extent permitted, Ulixai’s total liability to the Helper is limited to direct damages and shall not exceed the total Connection Fees received by Ulixai for the transaction giving rise to the claim.

10.3. **Exclusions:** no indirect/consequential/special/punitive damages (loss of profits, opportunities, clients, reputation, replacement costs, etc.).

10.4. **Indemnification:** the Helper indemnifies and holds harmless Ulixai (and its affiliates, officers, employees, agents) from any claim, loss, damage, penalty, and expense (including attorney fees) arising from (i) breach of these Terms/laws, (ii) their content, (iii) their services/omissions, (iv) lack of work/immigration/license authorization.

10.5. No representation. Nothing herein creates agency, employment, partnership, or joint venture between Ulixai and the Helper.

10.6. Survival. Articles 5, 7, 8, 9, 10, 11, and 12 survive termination.

---

## 11. Governing law – Arbitration – Estonian jurisdiction – Class action waiver

11.1. **Substantive law:** for each Connection, the Ulixai–Helper relationship is governed by the **laws of the Country of Operation**, subject to local public policy and mandatory international norms. Supplementarily, and for interpretation/validity of these Terms as well as any issue not governed by the law of the Country of Operation, Estonian law applies.

11.2. **Mandatory ICC arbitration:** any dispute between Ulixai and the Helper shall be finally resolved under the ICC Arbitration Rules. Seat: Tallinn (Estonia). Language: French. The tribunal shall apply the substantive law defined in art. 11.1. Proceedings are confidential.

11.3. **Class action waiver:** to the extent permitted, any collective/group/representative action is excluded; individual claims only are allowed.

11.4. **Exclusive jurisdiction of Estonian courts:** for any non-arbitrable matters, enforcement of awards, or urgent measures, Estonian courts (competent in Tallinn) have exclusive jurisdiction. The Helper waives any objection of forum or non-convenience.

---

## 12. Miscellaneous

12.1. **Assignment**: Ulixai may assign these Terms to an affiliate or successor; the Helper may not assign without Ulixai’s written consent.

12.2. **Entire Agreement**: These Terms constitute the entire agreement and supersede all prior agreements relating to the same subject matter.

12.3. **Notices**: By publication on the Platform, in-app notification, or via the contact form.

12.4. **Interpretation**: Headings are for convenience only. No **contra proferentem** rule applies.

12.5. **Languages**: Translations may be provided; French prevails for interpretation.

12.6. **Severability**: If any provision is invalid/unenforceable, the remainder remains effective; it may be replaced by a valid provision of equivalent effect where possible.

12.7. **No waiver**: Failure to exercise a right does not constitute waiver thereof.

---

## 13. Contact

For any question or legal request, please contact us:
`;

  const defaultRu = `

Sure! I will convert your French text into **German**, keeping all the markup exactly as it is. Here’s the translation:

---

# Allgemeine Nutzungsbedingungen – Expatriates Aidants (Global)

**SOS Expat von Ulixai OÜ** (die „**Plattform**“, „**SOS**“, „**wir**“)

**Version 2.2 – Letzte Aktualisierung: 16. Juni 2025**

---

## 1. Definitionen

**Expatrié Aidant** („**Aidant**“): jede auf der Plattform registrierte Person, die eigenständig **nicht-juristische und nicht-medizinische Unterstützungsleistungen** für Nutzer anbietet (Orientierung, praktische Hilfe, Begleitung, informelle Übersetzungen, lokale Vernetzung usw.).

**Nutzer**: jede Person, die die Plattform verwendet, um einen Aidant zu kontaktieren.

**Vernetzung / Matching**: die technische/operative Einführung, die von der Plattform zwischen einem Nutzer und einem Aidant vorgenommen wird (Weitergabe von Kontaktdaten und/oder Eröffnung eines Kommunikationskanals und/oder Annahme einer über die Plattform gestellten Anfrage durch den Aidant).

**Einsatzland**: die Rechtsordnung, auf die sich die Nutzeranfrage zum Zeitpunkt der Vernetzung hauptsächlich bezieht; falls nicht definiert, das Wohnsitzland des Nutzers zum Zeitpunkt der Anfrage.

**Vernetzungsgebühren**: feste Gebühren, die an SOS pro Vernetzung zu zahlen sind (Art. 7): **19 €** bei Zahlung in **EUR** oder **25 $ USD** bei Zahlung in **USD**, Änderungen und/oder **lokale Tarife** nach Land/Währung vorbehalten, mit **zukunftsgerichteter Wirkung**.

**Zahlungsdienstleister**: Dritte, die Zahlungen abwickeln und Gelder verteilen.

---

## 2. Zweck, Anwendungsbereich und Zustimmung

2.1. Diese AGB regeln den Zugriff auf und die Nutzung der Plattform durch die Aidants.

2.2. **Ulixai fungiert ausschließlich als technischer Vermittler für die Vernetzung.** Ulixai ist weder Arbeitgeber, Vertreter noch Partner der Aidants, bietet keine rechtlichen, medizinischen, steuerlichen, buchhalterischen oder regulierten Beratungen an und ist nicht Partei von Verträgen zwischen Aidants und Nutzern.

2.3. **Elektronische Zustimmung (Click-wrap).** Die Registrierung und/oder Nutzung der Plattform gilt als Zustimmung zu den AGB, elektronische Unterzeichnung und vertragliche Einwilligung. SOS kann technische Nachweise (Zeitstempel, IDs) aufbewahren.

2.4. **Änderungen.** SOS kann die AGB und/oder die Gebührenordnungen (nach Land/Währung) mit **zukunftsgerichteter Wirkung** durch Veröffentlichung auf der Plattform aktualisieren. Fortgesetzte Nutzung gilt als Zustimmung.

2.5. **Berufliche Kapazität (B2B).** Der Aidant erklärt, **ausschließlich beruflich** zu handeln; Verbraucherschutzregelungen gelten nicht für die Beziehung Ulixai–Aidant.

---

## 3. Status des Aidants – Compliance, Genehmigungen und Verantwortung

3.1. **Unabhängigkeit.** Der Aidant handelt als **selbstständiger Fachmann**; keine Beschäftigungs-, Mandats-, Agentur-, Partnerschafts- oder Joint-Venture-Beziehung zu Ulixai wird begründet.

3.2. **Arbeitserlaubnis & Einwanderungsstatus.** Der Aidant ist **allein verantwortlich**, alle erforderlichen Genehmigungen in jedem Einsatzland zu beschaffen und aufrechtzuerhalten (Visum, Arbeitserlaubnis, Geschäftsanmeldung/Selbständigkeit, Versicherungen, lokale Lizenzen etc.). Ulixai **prüft diese Genehmigungen nicht** und **trägt hierfür keine Verantwortung**.

3.3. **Nicht regulierte Dienstleistungen.** Der Aidant verpflichtet sich, **keine regulierten Dienstleistungen** (z. B. Rechts-, Medizin-, Finanz-, Steuerberater-, Immobilienmaklerdienstleistungen etc.) **ohne** erforderliche **Genehmigungen/Lizenzen** und **ohne vollständige Einhaltung der lokalen Gesetze** anzubieten. Andernfalls verzichtet er auf diese Dienste und verweist den Nutzer an einen ordnungsgemäß befugten Fachmann (z. B. registrierter Anwalt).

3.4. **Allgemeine Compliance.** Der Aidant hält die geltenden Gesetze/Vorschriften ein (Verbraucherschutz, E-Commerce, Werbung/Telefonwerbung, fairer Wettbewerb, AML/KYC falls zutreffend, Steuern, Datenschutz, Sanktionen/Export, Sicherheit von Personen).

3.5. **Versicherungen.** Der Aidant erklärt, die erforderlichen Versicherungen (berufliche Haftpflicht, falls zutreffend) für seine Tätigkeiten und Einsatzgebiete zu haben.

3.6. **Vertraulichkeit.** Der Aidant schützt die Daten der Nutzer und gibt sie nicht weiter, außer bei gesetzlicher Pflicht oder Einwilligung.

---

## 4. Konto, Überprüfungen und Sicherheit

4.1. **Registrierung.** Ein (1) Konto pro Aidant; genaue, vollständige und aktuelle Angaben (Identität, Kontaktmöglichkeiten, Leistungsbeschreibung, Einsatzgebiete usw.).

4.2. **Überprüfungen.** Ulixai kann angemessene Kontrollen durchführen (Identität, Profilkonsistenz, Sanktions-/KYC-Prüfungen über Dienstleister) und den Zugang aus Sicherheits-, Compliance- oder Qualitätsgründen verweigern, aussetzen oder löschen.

4.3. **Zugriffssicherheit.** Der Aidant schützt seine Zugangsdaten. Jede Aktivität über das Konto gilt als durch ihn erfolgt.

---

## 5. Nutzungsregeln – Qualität, Verbote, Umgehungsverbot

5.1. **Qualität & zutreffende Beschreibung.** Der Aidant beschreibt seine Dienstleistungen korrekt, ohne Erfolgsgarantie. Keine falschen Angaben (z. B. unberechtigte Berufsausübung).

5.2. **Verbote.** Illegale, diskriminierende oder irreführende Inhalte; unfaire Praktiken; missbräuchliche Datennutzung; Umgehung/Reverse-Engineering der Plattform; Kollusion/Boykott; Verletzung von Sanktionen/Export; jegliche illegale Aktivitäten.

5.3. **Umgehungsverbot.** Jede **neue Vernetzung** mit einem **neuen Nutzer** über die Plattform unterliegt den **Vernetzungsgebühren** (Art. 7). Es ist **verboten**, diese Gebühren durch Umgehung der Plattform zu vermeiden.

5.4. **Verfügbarkeit.** Die Plattform wird **„wie besehen“** bereitgestellt; keine durchgehende Verfügbarkeit garantiert (Wartung, Zwischenfälle, höhere Gewalt). Zugang kann gesetzlich eingeschränkt werden.

---

## 6. Beziehung Aidant–Nutzer (außerhalb der Plattform)

6.1. Nach der Vernetzung können Aidant und Nutzer **außerhalb der Plattform** Verträge schließen. **Honorare** und Bedingungen werden von beiden frei festgelegt, unter Einhaltung der lokalen Gesetze.

6.2. Der Aidant stellt **Leistungsbedingungen/-bestätigungen** nach lokalem Recht aus, verwaltet **Rechnungen** und **steuerliche Verpflichtungen**.

6.3. Ulixai **trägt keine Verantwortung** für Qualität, Richtigkeit oder Ergebnisse der Leistungen des Aidants oder für Vereinbarungen zwischen Aidant und Nutzer.

---

## 7. Gebühren, Einmalzahlung und Steuern

7.1. **Vernetzungsgebühren (Pauschale).** **19 € (EUR)** **oder** **25 $ (USD)** **pro Vernetzung**, zuzüglich Steuern und Zahlungsdienstleistergebühren. Ulixai kann diese Beträge ändern und/oder **lokale Tarife** veröffentlichen, mit zukunftsgerichteter Wirkung.

7.2. **Einmalzahlung & Verteilung.** Der Nutzer leistet **eine Einmalzahlung** über die Plattform, die (i) die **Vergütung des Aidants** und (ii) die **Vernetzungsgebühren von Ulixai** abdeckt. Ulixai (oder dessen Dienstleister) zieht Gebühren ab und überweist den Rest an den Aidant. Der Aidant **erlaubt** diese Abzüge und Verteilungen.

7.3. **Fälligkeit & Nicht-Rückerstattung.** Vernetzungsgebühren sind **bei Vernetzung fällig** und **nicht erstattbar** (außer nach freiem Ermessen von Ulixai bei ausschließlich durch die Plattform verursachtem Scheitern und **sofern gesetzlich zulässig**).

7.4. **Rückerstattung an Nutzer.** Wird einem Nutzer eine Rückerstattung gewährt, wird sie **vom Anteil des Aidants abgezogen**: Ulixai kann den Betrag **einbehalten/kompensieren** oder Rückzahlung verlangen, falls keine zukünftigen Zahlungen anstehen. **Keine Rückerstattung** der Vernetzungsgebühren, außer nach Ermessen von Ulixai.

7.5. **Währungen & Umrechnung.** Mehrere Währungen möglich; ggf. Gebühren/Umrechnung durch Zahlungsdienstleister.

7.6. **Steuern.** Der Aidant bleibt verantwortlich für **alle anwendbaren Steuern** (MwSt., Einkommensteuer, Sozialversicherung etc.). Ulixai erhebt/überweist, wenn erforderlich, MwSt./lokale Äquivalente auf Vernetzungsgebühren.

7.7. **Kompensation.** Ulixai kann Forderungen gegen den Aidant mit Zahlungen an ihn verrechnen.

---

## 8. Persönliche Daten (globaler Rahmen)

8.1. **Rollen.** Für vom Nutzer empfangene Daten zur Vernetzung handeln **Ulixai und der Aidant** jeweils als **Verantwortliche für die Datenverarbeitung** für ihre eigenen Zwecke.

8.2. **Grundlagen & Zwecke.** Vertragserfüllung (Vernetzung), berechtigte Interessen (Sicherheit, Betrugsprävention, Verbesserung), gesetzliche Pflichten (AML/KYC, Sanktionen) und Einwilligung, wo erforderlich.

8.3. **Internationale Übermittlungen** mit **angemessenen Garantien**, wenn erforderlich.

8.4. **Rechte & Kontakt.** Ausübung über das **Kontaktformular** der Plattform.

8.5. **Sicherheit.** Angemessene technische/organisatorische Maßnahmen; Benachrichtigung über Verstöße gemäß geltendem Recht.

8.6. Der Aidant verarbeitet Daten gemäß dem Recht des **Einsatzlands**.

---

## 9. Geistiges Eigentum

Die Plattform, Marken, Logos, Datenbanken und Inhalte sind geschützt. Kein Recht wird an den Aidant übertragen, außer einem **persönlichen, nicht-exklusiven, nicht übertragbaren** Zugriffsrecht während der AGB-Laufzeit. Inhalte, die vom Aidant bereitgestellt werden, unterliegen einer **weltweiten, nicht-exklusiven Lizenz** zugunsten von Ulixai für Hosting und Anzeige auf der Plattform.

---

## 10. Garantien, Haftung und Entschädigung

10.1. **Keine Garantie** für Ergebnisse/Qualität/Umsatz; Plattform wird **„wie besehen“** bereitgestellt.

10.2. **Haftungsbegrenzung:** Soweit zulässig, ist die Gesamthaftung von Ulixai gegenüber dem Aidant auf **direkte Schäden** begrenzt und darf die Summe der von Ulixai erhaltenen **Vernetzungsgebühren** der betreffenden **Transaktion** nicht überschreiten.

10.3. **Ausschlüsse:** keine indirekten/folgenden/sonderen/Strafschäden (Gewinnverlust, Chancenverlust, Kundenverlust, Rufschädigung, Ersatzkosten etc.).

10.4. **Entschädigung:** Der Aidant **schützt und stellt frei** Ulixai (einschließlich verbundener Unternehmen, Führungskräfte, Mitarbeiter, Vertreter) von Ansprüchen, Verlusten, Schäden, Strafen und Kosten (einschließlich Anwaltsgebühren) im Zusammenhang mit (i) Verstößen gegen AGB/Gesetze, (ii) Inhalten, (iii) Dienstleistungen/Unterlassungen, (iv) fehlenden Arbeitserlaubnissen/Immigration/Lizenzen.

10.5. **Keine Vertretung.** Nichts begründet Mandat, Anstellung, Partnerschaft oder Joint Venture zwischen Ulixai und dem Aidant.

10.6. **Fortbestehen.** Die Art. 5, 7, 8, 9, 10, 11 und 12 bleiben nach Kündigung wirksam.

---

## 11. Anwendbares Recht – Schiedsgericht – Estnische Gerichtsbarkeit – Sammelklagen

11.1. **Materielles Recht:** Für jede Vernetzung gilt das Recht des **Einsatzlands**, vorbehaltlich lokaler zwingender Vorschriften und internationaler zwingender Normen. **Ergänzend und für die Auslegung/Gültigkeit der AGB sowie nicht geregelte Fragen gilt estnisches Recht.**

11.2. **Verbindliche ICC-Schiedsgerichtsbarkeit:** Alle Streitigkeiten zwischen Ulixai und Aidant werden **endgültig** nach dem Schiedsgerichtsreglement der **ICC** gelöst. **Sitz: Tallinn (Estland)**. **Sprache: Französisch.** Das Gericht wendet das in Art. 11.1 definierte materielle Recht an. **Vertrauliches Verfahren.**

11.3. **Verzicht auf Sammelklagen:** Soweit zulässig, ausgeschlossen; nur **individuelle Ansprüche**.

11.4. **Ausschließliche Zuständigkeit estnischer Gerichte:** Für nicht-schiedsgerichtliche Ansprüche, Vollstreckung von Urteilen oder einstweilige Maßnahmen haben estnische Gerichte (zuständig in Tallinn) **ausschließliche Zuständigkeit**. Der Aidant verzichtet auf Einwände wegen unpassendem Gerichtsstand.

---

## 12. Sonstiges

12.1. **Abtretung.** Ulixai kann die AGB an ein Konzernunternehmen oder einen Nachfolger abtreten; der Aidant kann ohne schriftliche Zustimmung von Ulixai nicht abtreten.

12.2. **Gesamtheit.** Die AGB bilden die vollständige Vereinbarung und ersetzen alle vorherigen Vereinbarungen zum selben Gegenstand.

12.3. **Benachrichtigungen.** Durch Veröffentlichung auf der Plattform, In-App-Benachrichtigung oder über das **Kontaktformular**.

12.4. **Auslegung.** Überschriften sind nur Hinweis; keine Regel **contra proferentem**.

12.5. **Sprachen.** Übersetzungen können bereitgestellt werden; **Französisch ist maßgeblich** für die Auslegung.

12.6. **Teilnichtigkeit.** Ist eine Bestimmung ungültig/unanwendbar, bleibt der Rest in Kraft; ersetzbar durch gültige Bestimmung mit gleichwertiger Wirkung, wenn möglich.

12.7. **Nichtverzicht.** Nichtausübung eines Rechts bedeutet keinen Verzicht.

---

## 13. Kontakt

Bei Fragen oder rechtlichen Anliegen kontaktieren Sie uns:



# Общие условия использования – Эмигранты-помощники (Global)

**SOS Expat d'Ulixai OÜ** (далее « **Платформа** », « **SOS** », « **мы** »)

**Версия 2.2 – Последнее обновление: 16 июня 2025 года**

---

## 1. Определения

**Эмигрант-помощник** (« **Помощник** »): любое лицо, зарегистрированное на Платформе для предоставления на независимой основе услуг непрофессиональной юридической и медицинской помощи Пользователям (ориентация, практическая поддержка, сопровождение, неформальный перевод, локальные контакты и т.д.).

**Пользователь**: любое лицо, использующее Платформу для связи с Помощником.

**Связь**: техническое/операционное соединение, осуществляемое Платформой между Пользователем и Помощником (передача контактных данных и/или открытие канала связи и/или согласие Помощника на запрос, сделанный через Платформу).

**Страна деятельности**: юрисдикция, преимущественно затрагиваемая запросом Пользователя в момент Связи; в противном случае – страна проживания Пользователя на дату запроса.

**Плата за Связь**: фиксированная плата, подлежащая уплате SOS за Связь (ст. 7): **19 €**, если оплата в **EUR**, или **25 $ USD**, если оплата в **USD**, с возможной корректировкой и/или **локальными тарифами** по странам/валютам с перспективным действием.

**Поставщик(и) платежей**: сторонние сервисы, обрабатывающие платежи и распределение средств.

---

## 2. Цель, сфера применения и принятие

2.1. Настоящие ОУС регулируют доступ и использование Платформы Помощниками.

2.2. **Ulixai действует исключительно как технический посредник по Связи.** Ulixai не является работодателем, агентом или партнером Помощников, не предоставляет юридические, медицинские, налоговые, бухгалтерские или регулируемые консультации и не является стороной контрактов между Помощниками и Пользователями.

2.3. **Электронное согласие (click-wrap).** Регистрация и/или использование Платформы означает принятие ОУС, электронную подпись и контрактное согласие. SOS может сохранять технические доказательства (отметки времени, идентификаторы).

2.4. **Изменения.** SOS может обновлять ОУС и/или тарифы (по странам/валютам) с **перспективным действием**, публикуя их на Платформе. Продолжение использования означает согласие.

2.5. **Профессиональная компетенция (B2B).** Помощник заявляет, что действует **исключительно в профессиональных целях**; нормы защиты потребителей не применяются к отношениям Ulixai–Помощник.

---

## 3. Статус Помощника – Соответствие, разрешения и ответственность

3.1. **Независимость.** Помощник действует как **независимый профессионал**; никакая связь трудовых отношений, агентства, партнерства или совместного предприятия с Ulixai не создается.

3.2. **Разрешение на работу и иммиграционный статус.** Помощник **сам несет ответственность** за получение и поддержание **всех необходимых разрешений** в каждой Стране деятельности (визы, разрешения на работу, регистрация деятельности/самозанятость, страховки, местные лицензии и т.д.). Ulixai **не проверяет** эти разрешения и **не несет никакой ответственности** в этом отношении.

3.3. **Нерегулируемые услуги.** Помощник обязуется **не предоставлять регулируемые услуги** (например, юридические, медицинские, финансовые, бухгалтерские, риелторские и т.д.) **без наличия соответствующих лицензий** и **без полного соблюдения местного законодательства**. В противном случае он воздерживается от таких услуг и направляет Пользователя к квалифицированному специалисту (например, зарегистрированному адвокату).

3.4. **Общее соответствие.** Помощник соблюдает применимые законы/регламенты (потребление, электронная коммерция, реклама/продажи, честная конкуренция, AML/KYC при необходимости, налогообложение, защита данных, санкции/экспорт, безопасность людей).

3.5. **Страхование.** Помощник заявляет, что имеет необходимые страховки (например, профессиональная ответственность), охватывающие его деятельность и территории работы.

3.6. **Конфиденциальность.** Помощник защищает информацию Пользователей и воздерживается от ее раскрытия, за исключением случаев, предусмотренных законом или с согласия.

---

## 4. Аккаунт, проверки и безопасность

4.1. **Регистрация.** Один (1) аккаунт на Помощника; точная, полная и актуальная информация (личность, контактные данные, описание услуг, зоны работы и т.д.).

4.2. **Проверки.** Ulixai может проводить разумные проверки (идентификация, согласованность профиля, проверки санкций/KYC через Поставщиков) и отказать/приостановить/удалить доступ по причинам безопасности, соответствия или качества обслуживания.

4.3. **Безопасность доступа.** Помощник защищает свои идентификаторы. Любая деятельность через аккаунт считается выполненной им самим.

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

6.3. Ulixai **не несет ответственности** за качество, точность или результат услуг Помощника, а также за обязательства между Помощником и Пользователем.

---

## 7. Плата, единоразовая оплата и налоги

7.1. **Плата за Связь (фиксированная).** **19 € (EUR)** **или** **25 $ (USD)** **за Связь**, без учета налогов и комиссии Поставщика платежей. Ulixai может изменять эти суммы и/или публиковать **локальные тарифы** по странам/валютам с перспективным действием.

7.2. **Единоразовая оплата и распределение.** Пользователь осуществляет **единый платеж** через Платформу, включающий (i) **вознаграждение Помощника** (согласованное) и (ii) **Плату за Связь** Ulixai. Ulixai (или его Поставщик) получает платеж, **вычитает** свои комиссии, а оставшееся **переводит Помощнику**. Помощник **согласен** с этими вычетами и распределением.

7.3. **Сроки и невозвратность.** Плата за Связь **должна быть уплачена сразу** при Связи и **не подлежит возврату** (за исключением дискреционных действий Ulixai в случае неудачи, полностью связанной с Платформой и **в пределах, разрешенных законом**).

7.4. **Возвраты Пользователю.** Если возврат предоставляется Пользователю, он **считается вычетом из доли Помощника**: Ulixai может **удерживать/компенсировать** сумму с будущих выплат или требовать возврат, если будущих выплат нет. **Возврат Платы за Связь не предусмотрен**, кроме как по дискреционному решению Ulixai.

7.5. **Валюты и конвертация.** Возможны различные валюты; могут применяться курсы/комиссии Поставщика.

7.6. **Налоги.** Помощник остается ответственным за **все применимые налоги** (НДС, подоходный налог, социальное страхование и т.д.). Ulixai собирает/перечисляет, если требуется, НДС/местный эквивалент с Платы за Связь.

7.7. **Компенсация.** Ulixai может компенсировать любую сумму, подлежащую Помощником, с любой суммы, подлежащей выплате Помощнику.

---

## 8. Персональные данные (глобальные рамки)

8.1. **Роли.** Для данных Пользователей, полученных для Связи, **Ulixai и Помощник** действуют **каждый** как **контролер обработки** для своих целей.

8.2. **Основания и цели.** Исполнение договора (Связь), законные интересы (безопасность, предотвращение мошенничества, улучшение), юридическое соответствие (AML/KYC, санкции), согласие, когда требуется.

8.3. **Международные передачи** с **соответствующими гарантиями**, если требуется.

8.4. **Права и контакт.** Осуществляются через **контактную форму** на Платформе.

8.5. **Безопасность.** Разумные технические и организационные меры; уведомление о нарушениях в соответствии с применимым законодательством.

8.6. Помощник обрабатывает данные в соответствии с законодательством **Страны деятельности**.

---

## 9. Интеллектуальная собственность

Платформа, её бренды, логотипы, базы данных и контент защищены. Помощнику не передаются права, кроме **личного, неисключительного, непередаваемого** права на доступ на срок действия ОУС. Контент, предоставленный Помощником, лицензируется **всемирно, неисключительно** в пользу Ulixai для размещения и отображения на Платформе.

---

## 10. Гарантии, ответственность и возмещение

10.1. **Нет гарантии** по результатам/качеству/объему бизнеса; Платформа предоставляется **«как есть»**.

10.2. **Ограничение ответственности**: в пределах разрешенного законом, общая ответственность Ulixai перед Помощником ограничивается **прямым ущербом** и **не может превышать** сумму **Платы за Связь**, полученной Ulixai по **транзакции**, послужившей причиной претензии.

10.3. **Исключения**: никакой косвенный/последующий/специальный/штрафной ущерб (потеря прибыли, возможностей, клиентов, репутации, расходы на замену и т.д.).

10.4. **Возмещение**: Помощник **возмещает и гарантирует** Ulixai (а также его аффилированным лицам, руководителям, сотрудникам, агентам) против любых претензий, потерь, ущерба, штрафов и расходов (включая адвокатские гонорары), связанных с (i) его нарушением ОУС/законов, (ii) его контентом, (iii) его услугами/упущениями, (iv) отсутствием разрешений на работу/иммиграцию/лицензий.

10.5. **Нет представительства.** Ничто не создает мандат, трудовые отношения, партнерство или совместное предприятие между Ulixai и Помощником.

10.6. **Сохранение.** Ст. 5, 7, 8, 9, 10, 11 и 12 сохраняются после прекращения действия.

---

## 11. Применимое право – Арбитраж – Эстонская юрисдикция – Коллективные иски

11.1. **Материальное право**: для каждой Связи отношения **Ulixai–Помощник** регулируются **законами Страны деятельности**, с учетом местного публичного порядка и обязательных международных норм. **В качестве дополняющего права и для толкования/действительности настоящих ОУС, а также для вопросов, не регулируемых правом Страны деятельности, применяется право Эстонии.**

11.2. **Обязательный арбитраж ICC**: любые споры между Ulixai и Помощником решаются **окончательно** в соответствии с Регламентом арбитража **ICC**. **Место: Таллинн (Эстония)**. **Язык: французский.** Суд применяет **материальное право**, указанное в ст. 11.1. Процедура **конфиденциальная**.

11.3. **Отказ от коллективных исков**: в пределах разрешенного законом любые коллективные/групповые/представительные иски исключены; только **индивидуальные претензии**.

11.4. **Исключительная юрисдикция судов Эстонии**: для любых требований **не подлежащих арбитражу**, исполнения решений или срочных мер, эстонские суды (компетентные в Таллине) имеют **исключительную** юрисдикцию. Помощник отказывается от любых возражений о неподходящем форуме.

---

## 12. Разное

12.1. **Передача.** Ulixai может передать ОУС любой компании своей группы или правопреемнику; Помощник не может передавать без письменного согласия Ulixai.

12.2. **Полнота.** ОУС составляют полное соглашение и заменяют все предыдущие соглашения по тому же объекту.

12.3. **Уведомления.** Через публикацию на Платформе, уведомление в приложении или через **контактную форму**.

12.4. **Толкование.** Заголовки справочные. Нет правила **contra proferentem**.

12.5. **Языки.** Могут предоставляться переводы; **французский язык имеет преимущественную силу** при толковании.

12.6. **Частичная недействительность.** Если положение недействительно/неприменимо, остальное остается в силе; может быть заменено действительным положением с аналогичным эффектом, если возможно.

12.7. **Неотказ от прав.** Неприменение права не означает отказ от него.

---

## 13. Контакт

Для любых вопросов или юридических запросов свяжитесь с нами:
`;
  const defaultHi = `
# सामान्य उपयोग शर्तें – Expatriates Aidants (वैश्विक)

**SOS Expat by Ulixai OÜ** (यहाँ “**प्लेटफ़ॉर्म**”, “**SOS**”, “**हम**” के रूप में संदर्भित है)

**संस्करण 2.2 – अंतिम अद्यतन: 16 जून 2025**

---

## 1. परिभाषाएँ

**Expatrié Aidant** (“**Aidant**”): प्लेटफ़ॉर्म पर पंजीकृत कोई भी व्यक्ति जो स्वतंत्र रूप से **गैर-कानूनी और गैर-चिकित्सीय समर्थन सेवाएँ** प्रदान करता है (जैसे मार्गदर्शन, व्यावहारिक सहायता, साथ चलना, अनौपचारिक अनुवाद, स्थानीय नेटवर्क आदि)।

**उपयोगकर्ता**: कोई भी व्यक्ति जो Aidant से संपर्क करने के लिए प्लेटफ़ॉर्म का उपयोग करता है।

**नेटवर्किंग / मिलान**: प्लेटफ़ॉर्म द्वारा उपयोगकर्ता और Aidant के बीच तकनीकी/संचालन परिचय (संपर्क विवरण साझा करना, संचार चैनल खोलना, या प्लेटफ़ॉर्म के माध्यम से अनुरोध को स्वीकार करना)।

**स्थान/देश**: वह कानूनी क्षेत्र जिस पर उपयोगकर्ता का अनुरोध नेटवर्किंग के समय मुख्य रूप से आधारित है; यदि निर्दिष्ट नहीं है, तो अनुरोध के समय उपयोगकर्ता का निवास देश मान्य होगा।

**नेटवर्किंग शुल्क**: प्लेटफ़ॉर्म द्वारा प्रत्येक नेटवर्किंग पर SOS को देय निश्चित शुल्क (धारा 7): **19 €** (EUR) या **25 $ USD**, स्थानीय मुद्रा/देश के अनुसार बदलाव संभव।

**भुगतान सेवा प्रदाता**: तृतीय पक्ष जो भुगतान प्रबंधित करता है और धन वितरित करता है।

---

## 2. उद्देश्य, क्षेत्र और सहमति

2.1. ये शर्तें Aidants द्वारा प्लेटफ़ॉर्म तक पहुँच और उपयोग को नियंत्रित करती हैं।

2.2. **Ulixai केवल तकनीकी मध्यस्थ के रूप में कार्य करता है।** Ulixai न तो Aidants का नियोक्ता है, न प्रतिनिधि या साझेदार, न कानूनी/चिकित्सीय/कर/लेखांकन सेवाएं प्रदान करता है और न ही Aidant और उपयोगकर्ता के बीच किसी अनुबंध का पक्ष है।

2.3. **इलेक्ट्रॉनिक सहमति (Click-wrap)।** पंजीकरण या प्लेटफ़ॉर्म का उपयोग शर्तों की स्वीकृति के रूप में माना जाएगा। SOS तकनीकी प्रमाण (समय-स्टैम्प, ID) रख सकता है।

2.4. **परिवर्तन।** SOS भविष्य में प्रभावी रूप से शर्तें और शुल्क अद्यतन कर सकता है। प्लेटफ़ॉर्म का उपयोग जारी रखना स्वीकृति माना जाएगा।

2.5. **पेशेवर क्षमता (B2B)।** Aidant घोषित करता है कि वह **केवल पेशेवर रूप से** कार्य कर रहा है; उपभोक्ता संरक्षण नियम लागू नहीं होंगे।

---

## 3. Aidant की स्थिति – अनुपालन, अनुमतियाँ और जिम्मेदारी

3.1. **स्वतंत्रता।** Aidant **स्वतंत्र पेशेवर** के रूप में कार्य करता है; Ulixai के साथ कोई रोजगार, एजेंसी, साझेदारी या जॉइंट वेंचर संबंध नहीं बनता।

3.2. **कार्य अनुमति और प्रवास स्थिति।** Aidant स्वयं जिम्मेदार है कि वह हर देश में आवश्यक अनुमतियाँ प्राप्त और बनाए रखे (वीज़ा, कार्य अनुमति, व्यवसाय पंजीकरण, बीमा, स्थानीय लाइसेंस)। Ulixai इन अनुमतियों की जांच नहीं करता।

3.3. **गैर-नियंत्रित सेवाएँ।** Aidant बिना उचित लाइसेंस के किसी भी नियंत्रित सेवा (कानूनी, चिकित्सा, वित्त, कर आदि) प्रदान नहीं करेगा।

3.4. **सामान्य अनुपालन।** Aidant सभी लागू कानूनों/नियमों का पालन करेगा (उपभोक्ता संरक्षण, ई-कॉमर्स, विज्ञापन, प्रतिस्पर्धा, AML/KYC, कर, डेटा सुरक्षा, सुरक्षा, प्रतिबंध आदि)।

3.5. **बीमा।** Aidant पुष्टि करता है कि उसने अपनी गतिविधियों के लिए आवश्यक बीमा (व्यावसायिक जिम्मेदारी) कर रखा है।

3.6. **गोपनीयता।** Aidant उपयोगकर्ता डेटा सुरक्षित रखेगा और केवल कानूनी आवश्यकता या सहमति पर साझा करेगा।

---

## 4. खाता, सत्यापन और सुरक्षा

4.1. **पंजीकरण।** प्रत्येक Aidant का केवल एक खाता होगा; सभी विवरण सटीक और अद्यतन होंगे।

4.2. **सत्यापन।** Ulixai सुरक्षा, अनुपालन या गुणवत्ता कारणों से पहुँच अस्वीकृत, निलंबित या हटाने का अधिकार रखता है।

4.3. **सुरक्षा।** खाता गतिविधि को Aidant की ओर से किया गया माना जाएगा।

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

6.3. Ulixai **सेवा की गुणवत्ता या परिणामों के लिए जिम्मेदार नहीं** है।

---

## 7. शुल्क, एकल भुगतान और कर

7.1. **नेटवर्किंग शुल्क।** 19 € (EUR) या 25 $ (USD) प्रति नेटवर्किंग।

7.2. **एकल भुगतान और वितरण।** भुगतान प्लेटफ़ॉर्म के माध्यम से किया जाता है; Ulixai शुल्क काटकर शेष राशि Aidant को भेजेगा।

7.3. **वापसी योग्य नहीं।** नेटवर्किंग शुल्क गैर-वापसी योग्य।

7.4. **वापसी पर काटौती।** कोई वापसी Aidant के हिस्से से की जा सकती है।

7.5. **मुद्रा और रूपांतरण।** कई मुद्राएँ संभव; सेवा प्रदाता शुल्क लागू कर सकते हैं।

7.6. **कर।** Aidant सभी लागू करों के लिए जिम्मेदार है।

7.7. **मुआवजा।** Ulixai दावे काटकर भुगतान समायोजित कर सकता है।

---

## 8. व्यक्तिगत डेटा (वैश्विक)

8.1. **भूमिकाएँ।** डेटा प्रसंस्करण के लिए Ulixai और Aidant अलग-अलग जिम्मेदार हैं।

8.2. **उद्देश्य।** नेटवर्किंग, सुरक्षा, धोखाधड़ी रोकथाम, कानूनी आवश्यकताएँ।

8.3. **अंतरराष्ट्रीय स्थानांतरण।** उचित सुरक्षा उपायों के साथ।

8.4. **अधिकार और संपर्क।** प्लेटफ़ॉर्म संपर्क फ़ॉर्म के माध्यम से।

8.5. **सुरक्षा।** उचित तकनीकी/संगठनात्मक उपाय।

8.6. Aidant डेटा का प्रसंस्करण **स्थान/देश कानून** के अनुसार करेगा।

---

## 9. बौद्धिक संपदा

प्लेटफ़ॉर्म, ट्रेडमार्क, लोगो, डेटाबेस और सामग्री सुरक्षित हैं। Aidant को केवल व्यक्तिगत, गैर-विशेष, गैर-हस्तांतरित अधिकार मिलेगा। Aidant द्वारा दी गई सामग्री Ulixai को प्लेटफ़ॉर्म पर होस्टिंग और प्रदर्शन के लिए गैर-विशेष लाइसेंस देती है।

---

## 10. गारंटी, दायित्व और मुआवजा

10.1. परिणाम या गुणवत्ता की कोई गारंटी नहीं।

10.2. **दायित्व सीमा:** कुल दायित्व नेटवर्किंग शुल्क तक सीमित।

10.3. **बहिष्कार:** अप्रत्यक्ष, परिणामी, दंडात्मक नुकसान शामिल नहीं।

10.4. **मुआवजा:** Aidant Ulixai को किसी भी दावे, नुकसान या कानूनी शुल्क से मुक्त रखेगा।

10.5. **कोई प्रतिनिधित्व नहीं।**

10.6. ये प्रावधान समाप्ति के बाद भी लागू रहेंगे।

---

## 11. लागू कानून – पंचाट – एस्टोनियाई अधिकार क्षेत्र – सामूहिक मुकदमे

11.1. **सामग्रीक कानून:** प्रत्येक नेटवर्किंग के लिए स्थान/देश का कानून लागू।

11.2. **ICC पंचाट:** सभी विवाद अंतिम रूप से ICC नियमों के अनुसार। स्थान: टालिन, एस्टोनिया; भाषा: फ्रेंच।

11.3. **सामूहिक मुकदमे का त्याग।**

11.4. **एस्टोनियाई अदालती अधिकार।**

---

## 12. विविध

12.1. **हस्तांतरण।** Ulixai अधिकारों का हस्तांतरण कर सकता है।

12.2. **पूर्ण समझौता।**

12.3. **सूचनाएँ।** प्लेटफ़ॉर्म पर प्रकाशन या संपर्क फ़ॉर्म द्वारा।

12.4. **व्याख्या।**

12.5. **भाषाएँ।** फ्रेंच मूल है।

12.6. **आंशिक अमान्यता।**

12.7. **अस्वीकृति नहीं।**

---

## 13. संपर्क

सवाल या कानूनी मुद्दों के लिए हमसे संपर्क करें:
`;

  const defaultEs = `
# Términos de Uso – Ayudantes de Expatriados (Global)


**SOS Expat por Ulixai OÜ** (la "**Plataforma**", "**SOS**", "**nosotros**")


**Versión 2.2 – Última actualización: 16 de junio de 2025**


---


## 1. Definiciones


**Ayudante** significa cualquier persona registrada en la Plataforma para ofrecer, de forma independiente, servicios de asistencia no legal y no médica a los Usuarios (orientación, trámites prácticos, traducción informal, introducciones locales, etc.).


**Usuario** significa cualquier persona que utiliza la Plataforma para contactar con un Ayudante.


**Conexión** significa la introducción técnica/operacional que permite contacto (compartir detalles y/o iniciar llamada/mensaje/vídeo y/o aceptación por parte del Ayudante).


**País de Intervención** significa la jurisdicción principalmente dirigida por la solicitud del Usuario en el momento de la Conexión.


**Tarifa de Conexión** significa **EUR 19** (si se paga en EUR) o **USD 25** (si se paga en USD), sujeta a cambios y/o **horarios locales** por país/moneda con efecto prospectivo.


**Procesadores de Pago** son servicios de terceros que manejan recaudaciones y pagos.


---


## 2. Propósito, Alcance y Aceptación

2.1. Las presentes CGU regulan el acceso y el uso de la Plataforma por parte de los Asistentes.

2.2. **Ulixai actúa exclusivamente como intermediario técnico de la puesta en contacto** Ulixai no es empleador, mandatario ni socio de los Asistentes, no proporciona ningún tipo de asesoramiento jurídico, médico, fiscal, contable ni de otra índole regulada, y no forma parte de los contratos entre Asistentes y Usuarios.

2.3. **Aceptación electrónica (click-wrap)** El registro y/o el uso de la Plataforma constituyen la aceptación de las CGU, la firma electrónica y el consentimiento contractual. SOS puede conservar pruebas técnicas (marca de tiempo, identificadores).

2.4. **Modificaciones** SOS puede actualizar las CGU y/o las tablas de tarifas (por país/divisa) con efecto prospectivo mediante su publicación en la Plataforma. El uso continuado implica aceptación.

2.5. **Capacidad profesional (B2B)** El Asistente declara actuar exclusivamente con fines profesionales; los regímenes de protección al consumidor no se aplican a la relación entre Ulixai y el Asistente.


---


## 3. Estado del Ayudante – Cumplimiento, Autorizaciones y Responsabilidades


3.1. **Independencia** El Asistente actúa como profesional independiente; no se crea ningún vínculo de empleo, mandato, agencia, asociación o empresa conjunta con Ulixai.

3.2. **Autorización de trabajo y estatus migratorio** El Asistente es únicamente responsable de obtener y mantener todas las autorizaciones necesarias en cada País de Intervención (visado, permiso de trabajo, registro de actividad/autónomo, seguros, licencias locales, etc.). Ulixai no verifica dichas autorizaciones y no asume ninguna responsabilidad al respecto.

3.3. **Servicios no regulados** El Asistente se compromete a no prestar servicios regulados (por ejemplo, asesoramiento jurídico, médico, financiero, contable o inmobiliario, etc.) sin poseer las autorizaciones/licencias necesarias y sin cumplir plenamente con las leyes locales. En caso contrario, deberá abstenerse de ofrecer dichos servicios y redirigir al Usuario hacia un profesional debidamente autorizado (por ejemplo, un abogado colegiado).

3.4. **Cumplimiento general** El Asistente debe respetar todas las leyes y reglamentos aplicables (consumo, comercio electrónico, publicidad/promoción, competencia leal, LCB-FT/KYC cuando proceda, fiscalidad, protección de datos, sanciones/exportaciones, seguridad de las personas).

3.5. **Seguros** El Asistente declara contar con los seguros necesarios (responsabilidad civil profesional, cuando corresponda) que cubran sus actividades y territorios de intervención.

3.6. **Confidencialidad** El Asistente debe proteger la información de los Usuarios y abstenerse de divulgarla, salvo obligación legal o consentimiento expreso.

---


## 4. Cuenta, Verificaciones y Seguridad

4.1. **Registro** Un (1) cuenta por Asistente; la información debe ser exacta, completa y actualizada (identidad, medios de contacto, descripción de los servicios, zonas de intervención, etc.).

4.2. **Verificaciones** Ulixai puede realizar controles razonables (identidad, coherencia del perfil, revisiones de sanciones/KYC a través de Proveedores) y puede rechazar, suspender o retirar el acceso por motivos de seguridad, cumplimiento o calidad del servicio.

4.3. **Seguridad de acceso** El Asistente debe proteger sus credenciales. Toda actividad realizada a través de la cuenta se considerará efectuada por él mismo.

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

6.3. **Ulixai no es responsable** de la calidad, exactitud o resultado de los servicios del Asistente, ni de los compromisos asumidos entre el Asistente y el Usuario.

---


## 7. Tarifas, Pago Único e Impuestos


7.1. **Gastos de Puesta en Contacto (tarifa fija).** **19 € (EUR)** o **25 $ (USD)** por cada Puesta en Contacto, sin incluir impuestos ni las comisiones del Proveedor de pagos. Ulixai puede modificar estos importes y/o publicar **tarifas locales** por país o moneda, con **efecto prospectivo.**

7.2. **Pago único y distribución.** El Usuario realiza **un solo pago** a través de la Plataforma que cubre (i) la **remuneración del Asistente** (según lo acordado) y (ii) los **Gastos de Puesta en Contacto** de Ulixai. Ulixai (o su Proveedor) recibe el pago, **deduce** sus comisiones y luego **transfiere** el saldo al Asistente. El Asistente **autoriza** dichas deducciones y distribuciones.

7.3. **Exigibilidad y no reembolso.** Los Gastos de Puesta en Contacto son **exigibles desde** el momento de la Puesta en Contacto y **no son reembolsables** (salvo por decisión comercial discrecional de Ulixai en caso de fallo exclusivamente atribuible a la Plataforma y **dentro de los límites permitidos por la ley**).

7.4. **Reembolsos al Usuario.** Si se concede un reembolso al Usuario, este se **deducirá de la parte correspondiente al Asistente**: Ulixai podrá **retener o compensar** dicho importe con futuros pagos al Asistente, o **reclamar su devolución** si no hay pagos pendientes. **No se reembolsarán** los Gastos de Puesta en Contacto, salvo decisión discrecional de Ulixai.

7.5. **Monedas y conversión.** Pueden ofrecerse varias monedas; se pueden aplicar tasas o comisiones de conversión del Proveedor de pagos.

7.6. **Impuestos.** El Asistente sigue siendo responsable de **todos los impuestos aplicables** (IVA, impuesto sobre la renta, seguridad social, etc.). Ulixai recaudará y/o remitirá, cuando sea necesario, el IVA o su **equivalente local** correspondiente a los Gastos de Puesta en Contacto.

7.7. **Compensación.** Ulixai podrá compensar cualquier suma debida por el Asistente con cualquier suma pagadera al mismo.

---


## 8. Protección de Datos (Marco Global)

8.1. **Funciones.** Con respecto a los datos de los Usuarios recibidos con el fin de la Puesta en Contacto, **Ulixai y el Asistente** actúan **cada uno** como **responsable del tratamiento** para sus propias finalidades.

8.2. **Bases y finalidades.** Ejecución del contrato (Puesta en Contacto), intereses legítimos (seguridad, prevención del fraude, mejora del servicio), cumplimiento legal (LCB-FT, sanciones) y consentimiento cuando sea requerido.

8.3. **Transferencias internacionales** con **garantías adecuadas** cuando sea necesario.

8.4. **Derechos y contacto.** El ejercicio de derechos se realiza a través del **formulario de contacto** disponible en la Plataforma.

8.5. **Seguridad.** Se aplican medidas técnicas y organizativas razonables; las violaciones de datos se notificarán conforme a la legislación aplicable.

8.6. El Asistente tratará los datos de acuerdo con la legislación del **País de Intervención.**


---


## 9. Propiedad Intelectual


La **Plataforma**, sus **marcas, logotipos, bases de datos y contenidos** están protegidos. **Ningún derecho** se cede al Asistente, salvo un derecho **personal, no exclusivo y no transferible** de acceso durante la vigencia de los Términos y Condiciones. Los **contenidos proporcionados por el Asistente** están sujetos a una **licencia mundial, no exclusiva** a favor de Ulixai para su **alojamiento y exhibición en la Plataforma**.

---


## 10. Garantías, Responsabilidad e Indemnización

10.1. Ninguna garantía sobre resultados, calidad o volumen de negocio; la Plataforma se proporciona "**tal cual**".

10.2. Limitación de responsabilidad:** en la medida permitida, la responsabilidad total de Ulixai frente al Asistente se limita a los **daños directos** y no puede exceder el total de los **Gastos de Conexión** percibidos por Ulixai por la transacción que dio origen a la reclamación.

10.3. Exclusiones:** no se cubren daños **indirectos, consecuentes, especiales o punitivos** (pérdida de beneficios, oportunidades, clientela, daño a la reputación, costes de reemplazo, etc.).

10.4. Indemnización:** el Asistente **indemniza y garantiza** a Ulixai (así como a sus afiliados, directivos, empleados y agentes) frente a cualquier reclamación, pérdida, daño, penalidad y gastos (incluidos honorarios de abogados) relacionados con: (i) su incumplimiento de los Términos y Condiciones o de la ley,(ii) sus contenidos,(iii) sus servicios u omisiones, (iv) la falta de autorizaciones de trabajo, inmigración o licencias.

10.5. Ninguna representación:** nada implica mandato, empleo, asociación, sociedad o empresa conjunta entre Ulixai y el Asistente.

10.6. Vigencia tras la terminación:** los arts. 5, 7, 8, 9, 10, 11 y 12 **sobreviven a la terminación**.

---


## 11. Ley Aplicable – Arbitraje – Tribunales Estonios – Acciones Colectivas

11.1. **Derecho sustantivo:** para cada Conexión, la relación Ulixai–Asistente se rige por las leyes del **País de Intervención**, sin perjuicio de las normas de orden público locales y de las normas internacionales imperativas. A modo supletorio y para la interpretación/validez de estos Términos y Condiciones, así como para cualquier cuestión no regulada por la ley del País de Intervención, se aplica el **derecho estonio**.

11.2. **Arbitraje obligatorio de la CCI:** cualquier disputa entre Ulixai y el Asistente se resolverá **definitivamente** conforme al **Reglamento de Arbitraje de la CCI**. Sede: **Tallin (Estonia)**. Idioma: **francés**. El tribunal aplicará el derecho sustantivo definido en el art. 11.1. Procedimiento confidencial.

11.3. **Renuncia a acciones colectivas:** en la medida permitida, se excluyen todas las acciones colectivas/de grupo/representativas; únicamente se admiten reclamaciones individuales.

11.4. **Jurisdicción exclusiva de los tribunales de Estonia:** para cualquier asunto no arbitrable, ejecución de laudos o medidas urgentes, los tribunales estonios (**competentes en Tallin**) tendrán jurisdicción exclusiva. El Asistente renuncia a cualquier objeción por foro o inconveniencia de jurisdicción.

---


## 12. Diverso


12.1. **Cesión:** Ulixai puede ceder los Términos y Condiciones a una entidad de su grupo o a un sucesor; el Asistente no puede cederlos sin el acuerdo escrito de Ulixai.

12.2. **Integridad:** Los Términos y Condiciones constituyen el acuerdo completo y reemplazan cualquier acuerdo previo relativo al mismo objeto.

12.3. **Notificaciones:** Se realizarán mediante publicación en la Plataforma, notificación dentro de la aplicación o a través del formulario de contacto.

12.4. **Interpretación:** Los títulos son indicativos. No se aplica la regla *contra proferentem*.

12.5. **Idiomas:** Pueden proporcionarse traducciones; el francés prevalece para fines de interpretación.

12.6. **Nulidad parcial:** Si alguna disposición es nula o inaplicable, el resto permanece vigente; podrá reemplazarse por una disposición válida de efecto equivalente siempre que sea posible.

12.7. **No renuncia:** La falta de ejercicio de un derecho no constituye renuncia al mismo.

---


## 13. Contacto


Para cualquier pregunta o solicitud legal, contáctenos:
`;
  const defaultDe = `
# Allgemeine Nutzungsbedingungen – Expatriates Aidants (Global)

**SOS Expat von Ulixai OÜ** (die „**Plattform**“, „**SOS**“, „**wir**“)

**Version 2.2 – Letzte Aktualisierung: 16. Juni 2025**

---

## 1. Definitionen

**Expatrié Aidant** („**Aidant**“): jede auf der Plattform registrierte Person, die eigenständig **nicht-juristische und nicht-medizinische Unterstützungsleistungen** für Nutzer anbietet (Orientierung, praktische Hilfe, Begleitung, informelle Übersetzungen, lokale Vernetzung usw.).

**Nutzer**: jede Person, die die Plattform verwendet, um einen Aidant zu kontaktieren.

**Vernetzung / Matching**: die technische/operative Einführung, die von der Plattform zwischen einem Nutzer und einem Aidant vorgenommen wird (Weitergabe von Kontaktdaten und/oder Eröffnung eines Kommunikationskanals und/oder Annahme einer über die Plattform gestellten Anfrage durch den Aidant).

**Einsatzland**: die Rechtsordnung, auf die sich die Nutzeranfrage zum Zeitpunkt der Vernetzung hauptsächlich bezieht; falls nicht definiert, das Wohnsitzland des Nutzers zum Zeitpunkt der Anfrage.

**Vernetzungsgebühren**: feste Gebühren, die an SOS pro Vernetzung zu zahlen sind (Art. 7): **19 €** bei Zahlung in **EUR** oder **25 $ USD** bei Zahlung in **USD**, Änderungen und/oder **lokale Tarife** nach Land/Währung vorbehalten, mit **zukunftsgerichteter Wirkung**.

**Zahlungsdienstleister**: Dritte, die Zahlungen abwickeln und Gelder verteilen.

---

## 2. Zweck, Anwendungsbereich und Zustimmung

2.1. Diese AGB regeln den Zugriff auf und die Nutzung der Plattform durch die Aidants.

2.2. **Ulixai fungiert ausschließlich als technischer Vermittler für die Vernetzung.** Ulixai ist weder Arbeitgeber, Vertreter noch Partner der Aidants, bietet keine rechtlichen, medizinischen, steuerlichen, buchhalterischen oder regulierten Beratungen an und ist nicht Partei von Verträgen zwischen Aidants und Nutzern.

2.3. **Elektronische Zustimmung (Click-wrap).** Die Registrierung und/oder Nutzung der Plattform gilt als Zustimmung zu den AGB, elektronische Unterzeichnung und vertragliche Einwilligung. SOS kann technische Nachweise (Zeitstempel, IDs) aufbewahren.

2.4. **Änderungen.** SOS kann die AGB und/oder die Gebührenordnungen (nach Land/Währung) mit **zukunftsgerichteter Wirkung** durch Veröffentlichung auf der Plattform aktualisieren. Fortgesetzte Nutzung gilt als Zustimmung.

2.5. **Berufliche Kapazität (B2B).** Der Aidant erklärt, **ausschließlich beruflich** zu handeln; Verbraucherschutzregelungen gelten nicht für die Beziehung Ulixai–Aidant.

---

## 3. Status des Aidants – Compliance, Genehmigungen und Verantwortung

3.1. **Unabhängigkeit.** Der Aidant handelt als **selbstständiger Fachmann**; keine Beschäftigungs-, Mandats-, Agentur-, Partnerschafts- oder Joint-Venture-Beziehung zu Ulixai wird begründet.

3.2. **Arbeitserlaubnis & Einwanderungsstatus.** Der Aidant ist **allein verantwortlich**, alle erforderlichen Genehmigungen in jedem Einsatzland zu beschaffen und aufrechtzuerhalten (Visum, Arbeitserlaubnis, Geschäftsanmeldung/Selbständigkeit, Versicherungen, lokale Lizenzen etc.). Ulixai **prüft diese Genehmigungen nicht** und **trägt hierfür keine Verantwortung**.

3.3. **Nicht regulierte Dienstleistungen.** Der Aidant verpflichtet sich, **keine regulierten Dienstleistungen** (z. B. Rechts-, Medizin-, Finanz-, Steuerberater-, Immobilienmaklerdienstleistungen etc.) **ohne** erforderliche **Genehmigungen/Lizenzen** und **ohne vollständige Einhaltung der lokalen Gesetze** anzubieten. Andernfalls verzichtet er auf diese Dienste und verweist den Nutzer an einen ordnungsgemäß befugten Fachmann (z. B. registrierter Anwalt).

3.4. **Allgemeine Compliance.** Der Aidant hält die geltenden Gesetze/Vorschriften ein (Verbraucherschutz, E-Commerce, Werbung/Telefonwerbung, fairer Wettbewerb, AML/KYC falls zutreffend, Steuern, Datenschutz, Sanktionen/Export, Sicherheit von Personen).

3.5. **Versicherungen.** Der Aidant erklärt, die erforderlichen Versicherungen (berufliche Haftpflicht, falls zutreffend) für seine Tätigkeiten und Einsatzgebiete zu haben.

3.6. **Vertraulichkeit.** Der Aidant schützt die Daten der Nutzer und gibt sie nicht weiter, außer bei gesetzlicher Pflicht oder Einwilligung.

---

## 4. Konto, Überprüfungen und Sicherheit

4.1. **Registrierung.** Ein (1) Konto pro Aidant; genaue, vollständige und aktuelle Angaben (Identität, Kontaktmöglichkeiten, Leistungsbeschreibung, Einsatzgebiete usw.).

4.2. **Überprüfungen.** Ulixai kann angemessene Kontrollen durchführen (Identität, Profilkonsistenz, Sanktions-/KYC-Prüfungen über Dienstleister) und den Zugang aus Sicherheits-, Compliance- oder Qualitätsgründen verweigern, aussetzen oder löschen.

4.3. **Zugriffssicherheit.** Der Aidant schützt seine Zugangsdaten. Jede Aktivität über das Konto gilt als durch ihn erfolgt.

---

## 5. Nutzungsregeln – Qualität, Verbote, Umgehungsverbot

5.1. **Qualität & zutreffende Beschreibung.** Der Aidant beschreibt seine Dienstleistungen korrekt, ohne Erfolgsgarantie. Keine falschen Angaben (z. B. unberechtigte Berufsausübung).

5.2. **Verbote.** Illegale, diskriminierende oder irreführende Inhalte; unfaire Praktiken; missbräuchliche Datennutzung; Umgehung/Reverse-Engineering der Plattform; Kollusion/Boykott; Verletzung von Sanktionen/Export; jegliche illegale Aktivitäten.

5.3. **Umgehungsverbot.** Jede **neue Vernetzung** mit einem **neuen Nutzer** über die Plattform unterliegt den **Vernetzungsgebühren** (Art. 7). Es ist **verboten**, diese Gebühren durch Umgehung der Plattform zu vermeiden.

5.4. **Verfügbarkeit.** Die Plattform wird **„wie besehen“** bereitgestellt; keine durchgehende Verfügbarkeit garantiert (Wartung, Zwischenfälle, höhere Gewalt). Zugang kann gesetzlich eingeschränkt werden.

---

## 6. Beziehung Aidant–Nutzer (außerhalb der Plattform)

6.1. Nach der Vernetzung können Aidant und Nutzer **außerhalb der Plattform** Verträge schließen. **Honorare** und Bedingungen werden von beiden frei festgelegt, unter Einhaltung der lokalen Gesetze.

6.2. Der Aidant stellt **Leistungsbedingungen/-bestätigungen** nach lokalem Recht aus, verwaltet **Rechnungen** und **steuerliche Verpflichtungen**.

6.3. Ulixai **trägt keine Verantwortung** für Qualität, Richtigkeit oder Ergebnisse der Leistungen des Aidants oder für Vereinbarungen zwischen Aidant und Nutzer.

---

## 7. Gebühren, Einmalzahlung und Steuern

7.1. **Vernetzungsgebühren (Pauschale).** **19 € (EUR)** **oder** **25 $ (USD)** **pro Vernetzung**, zuzüglich Steuern und Zahlungsdienstleistergebühren. Ulixai kann diese Beträge ändern und/oder **lokale Tarife** veröffentlichen, mit zukunftsgerichteter Wirkung.

7.2. **Einmalzahlung & Verteilung.** Der Nutzer leistet **eine Einmalzahlung** über die Plattform, die (i) die **Vergütung des Aidants** und (ii) die **Vernetzungsgebühren von Ulixai** abdeckt. Ulixai (oder dessen Dienstleister) zieht Gebühren ab und überweist den Rest an den Aidant. Der Aidant **erlaubt** diese Abzüge und Verteilungen.

7.3. **Fälligkeit & Nicht-Rückerstattung.** Vernetzungsgebühren sind **bei Vernetzung fällig** und **nicht erstattbar** (außer nach freiem Ermessen von Ulixai bei ausschließlich durch die Plattform verursachtem Scheitern und **sofern gesetzlich zulässig**).

7.4. **Rückerstattung an Nutzer.** Wird einem Nutzer eine Rückerstattung gewährt, wird sie **vom Anteil des Aidants abgezogen**: Ulixai kann den Betrag **einbehalten/kompensieren** oder Rückzahlung verlangen, falls keine zukünftigen Zahlungen anstehen. **Keine Rückerstattung** der Vernetzungsgebühren, außer nach Ermessen von Ulixai.

7.5. **Währungen & Umrechnung.** Mehrere Währungen möglich; ggf. Gebühren/Umrechnung durch Zahlungsdienstleister.

7.6. **Steuern.** Der Aidant bleibt verantwortlich für **alle anwendbaren Steuern** (MwSt., Einkommensteuer, Sozialversicherung etc.). Ulixai erhebt/überweist, wenn erforderlich, MwSt./lokale Äquivalente auf Vernetzungsgebühren.

7.7. **Kompensation.** Ulixai kann Forderungen gegen den Aidant mit Zahlungen an ihn verrechnen.

---

## 8. Persönliche Daten (globaler Rahmen)

8.1. **Rollen.** Für vom Nutzer empfangene Daten zur Vernetzung handeln **Ulixai und der Aidant** jeweils als **Verantwortliche für die Datenverarbeitung** für ihre eigenen Zwecke.

8.2. **Grundlagen & Zwecke.** Vertragserfüllung (Vernetzung), berechtigte Interessen (Sicherheit, Betrugsprävention, Verbesserung), gesetzliche Pflichten (AML/KYC, Sanktionen) und Einwilligung, wo erforderlich.

8.3. **Internationale Übermittlungen** mit **angemessenen Garantien**, wenn erforderlich.

8.4. **Rechte & Kontakt.** Ausübung über das **Kontaktformular** der Plattform.

8.5. **Sicherheit.** Angemessene technische/organisatorische Maßnahmen; Benachrichtigung über Verstöße gemäß geltendem Recht.

8.6. Der Aidant verarbeitet Daten gemäß dem Recht des **Einsatzlands**.

---

## 9. Geistiges Eigentum

Die Plattform, Marken, Logos, Datenbanken und Inhalte sind geschützt. Kein Recht wird an den Aidant übertragen, außer einem **persönlichen, nicht-exklusiven, nicht übertragbaren** Zugriffsrecht während der AGB-Laufzeit. Inhalte, die vom Aidant bereitgestellt werden, unterliegen einer **weltweiten, nicht-exklusiven Lizenz** zugunsten von Ulixai für Hosting und Anzeige auf der Plattform.

---

## 10. Garantien, Haftung und Entschädigung

10.1. **Keine Garantie** für Ergebnisse/Qualität/Umsatz; Plattform wird **„wie besehen“** bereitgestellt.

10.2. **Haftungsbegrenzung:** Soweit zulässig, ist die Gesamthaftung von Ulixai gegenüber dem Aidant auf **direkte Schäden** begrenzt und darf die Summe der von Ulixai erhaltenen **Vernetzungsgebühren** der betreffenden **Transaktion** nicht überschreiten.

10.3. **Ausschlüsse:** keine indirekten/folgenden/sonderen/Strafschäden (Gewinnverlust, Chancenverlust, Kundenverlust, Rufschädigung, Ersatzkosten etc.).

10.4. **Entschädigung:** Der Aidant **schützt und stellt frei** Ulixai (einschließlich verbundener Unternehmen, Führungskräfte, Mitarbeiter, Vertreter) von Ansprüchen, Verlusten, Schäden, Strafen und Kosten (einschließlich Anwaltsgebühren) im Zusammenhang mit (i) Verstößen gegen AGB/Gesetze, (ii) Inhalten, (iii) Dienstleistungen/Unterlassungen, (iv) fehlenden Arbeitserlaubnissen/Immigration/Lizenzen.

10.5. **Keine Vertretung.** Nichts begründet Mandat, Anstellung, Partnerschaft oder Joint Venture zwischen Ulixai und dem Aidant.

10.6. **Fortbestehen.** Die Art. 5, 7, 8, 9, 10, 11 und 12 bleiben nach Kündigung wirksam.

---

## 11. Anwendbares Recht – Schiedsgericht – Estnische Gerichtsbarkeit – Sammelklagen

11.1. **Materielles Recht:** Für jede Vernetzung gilt das Recht des **Einsatzlands**, vorbehaltlich lokaler zwingender Vorschriften und internationaler zwingender Normen. **Ergänzend und für die Auslegung/Gültigkeit der AGB sowie nicht geregelte Fragen gilt estnisches Recht.**

11.2. **Verbindliche ICC-Schiedsgerichtsbarkeit:** Alle Streitigkeiten zwischen Ulixai und Aidant werden **endgültig** nach dem Schiedsgerichtsreglement der **ICC** gelöst. **Sitz: Tallinn (Estland)**. **Sprache: Französisch.** Das Gericht wendet das in Art. 11.1 definierte materielle Recht an. **Vertrauliches Verfahren.**

11.3. **Verzicht auf Sammelklagen:** Soweit zulässig, ausgeschlossen; nur **individuelle Ansprüche**.

11.4. **Ausschließliche Zuständigkeit estnischer Gerichte:** Für nicht-schiedsgerichtliche Ansprüche, Vollstreckung von Urteilen oder einstweilige Maßnahmen haben estnische Gerichte (zuständig in Tallinn) **ausschließliche Zuständigkeit**. Der Aidant verzichtet auf Einwände wegen unpassendem Gerichtsstand.

---

## 12. Sonstiges

12.1. **Abtretung.** Ulixai kann die AGB an ein Konzernunternehmen oder einen Nachfolger abtreten; der Aidant kann ohne schriftliche Zustimmung von Ulixai nicht abtreten.

12.2. **Gesamtheit.** Die AGB bilden die vollständige Vereinbarung und ersetzen alle vorherigen Vereinbarungen zum selben Gegenstand.

12.3. **Benachrichtigungen.** Durch Veröffentlichung auf der Plattform, In-App-Benachrichtigung oder über das **Kontaktformular**.

12.4. **Auslegung.** Überschriften sind nur Hinweis; keine Regel **contra proferentem**.

12.5. **Sprachen.** Übersetzungen können bereitgestellt werden; **Französisch ist maßgeblich** für die Auslegung.

12.6. **Teilnichtigkeit.** Ist eine Bestimmung ungültig/unanwendbar, bleibt der Rest in Kraft; ersetzbar durch gültige Bestimmung mit gleichwertiger Wirkung, wenn möglich.

12.7. **Nichtverzicht.** Nichtausübung eines Rechts bedeutet keinen Verzicht.

---

## 13. Kontakt

Bei Fragen oder rechtlichen Anliegen kontaktieren Sie uns:
`;
  const defaultCh = `
# 使用条款 – 海外互助者（全球版）

**SOS Expat by Ulixai OÜ（“**平台**”、“**SOS**”、“**我们**”） 

**版本 2.2 – 最后更新：2025 年 6 月 16 日**

## 1. 定义

**海外互助者（“互助者”）：** 任何在平台上注册、以独立身份向用户提供非法律、非医疗的协助服务的个人（如指导、实际帮助、非正式翻译、当地联系等）。

**用户：** 使用平台联系互助者的任何人。

**匹配（联系）：** 平台在用户与互助者之间进行的技术/操作层面的引介（包括联系方式传递、沟通渠道开启、或互助者通过平台接受请求）。

**服务国家：** 在匹配时用户需求主要涉及的司法辖区；若无明确，则以请求日期的用户居住国为准。

**匹配费用：** 每次匹配须向 SOS 支付的固定费用（见第 7 条）：以 欧元支付为 **€19**，以 美元支付为 **$25 USD**，金额可调整，或按国家/货币制定本地费率表，并具有前瞻性效力。

**支付服务提供商：** 处理收款及资金分配的第三方服务。

---

## 2. 目的、适用范围与接受

2.1. 本使用条款规范互助者对平台的访问与使用。

2.2. Ulixai 仅作为技术性匹配中介。 Ulixai 不是互助者的雇主、代理或合作伙伴，不提供任何法律、医疗、税务、会计或其他受监管的建议，也不是互助者与用户之间合同的当事方。

2.3. **电子接受（点击同意):** 注册和/或使用平台即表示接受本条款，构成电子签署与合同同意。SOS 可保留技术性证据（时间戳、标识符等）。

2.4. **修改:** SOS 可通过在平台上发布方式更新条款和/或费率表（按国家/货币），更新具有前瞻性效力。继续使用即视为接受。

2.5. **专业身份（B2B):** 互助者声明其仅为职业目的行事；消费者保护法律不适用于 Ulixai–互助者关系。

---

## 3. 互助者身份 – 合规、许可与责任

3.1. **独立性:** 互助者以独立专业人士身份行事；Ulixai 与互助者之间不构成雇佣、代理、合作或合资关系。

3.2. **工作许可与移民身份** 互助者全权负责在每个服务国家获得并保持所有必要许可（签证、工作许可证、商业登记/个体经营、保险、当地执照等）。Ulixai 不核实这些许可，也不承担任何责任。

3.3. **非受监管服务:** 互助者承诺不得提供受监管的服务（如法律、医疗、金融、会计、房地产咨询等），除非持有必要的许可/执照并完全遵守当地法律。否则，互助者应避免此类服务，并将用户转介给具有合法资质的专业人士（如注册律师）。

3.4. **一般合规** 互助者遵守适用法律/法规（消费者保护、电子商务、广告/营销、公平竞争、反洗钱/客户尽调（如适用）、税务、数据保护、制裁/出口管制、人员安全等）。

3.5. **保险** 互助者声明已持有必要保险（如职业责任险），涵盖其业务活动及服务地区。

3.6. **保密性** 互助者应保护用户信息，除法律要求或经同意外，不得泄露。

---

## 4. 账户、审查与安全

4.1. **注册:** 每位互助者仅可拥有一个账户；所填信息必须准确、完整并保持更新（身份、联系方式、服务描述、地区范围等）。

4.2. **验证:** Ulixai 可进行合理检查（身份验证、资料一致性、制裁/尽调筛查等），并可因安全、合规或服务质量原因拒绝/暂停/撤销访问。

4.3. **账户安全:** 互助者须保护其登录凭证。任何账户下的操作均视为互助者本人行为。

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

6.3. Ulixai 不对互助者服务的质量、准确性或结果负责，也不对互助者与用户之间的任何承诺承担责任。

---

## 7. 费用、单次付款与税务

7.1. **匹配费用（固定费率）。 每次匹配收费 €19（欧元） 或 $25（美元）**，不含税及支付服务费用。Ulixai 可调整金额及/或按国家/货币发布本地费率表，具前瞻性效力。

7.2. **一次性支付与分配。** 用户通过平台进行一次性支付，涵盖 (i) 互助者报酬（双方约定）及 (ii) Ulixai 的匹配费用。Ulixai（或其服务商）收款后，扣除费用并将余额转给互助者。互助者授权此类扣除与分配。

7.3. **应付且不退款。** 匹配费用自匹配达成即应付且不可退还（除非 Ulixai 出于善意、且在法律允许范围内、因平台自身原因造成失败而决定退款）。

7.4. **用户退款。** 若用户获批退款，该金额从互助者份额中扣除：Ulixai 可抵扣/保留未来支付款，或在无未来支付时要求返还。匹配费用不退，除非 Ulixai 自主决定。

7.5. **货币与兑换。** 平台可支持多种货币；可能适用服务商汇率及手续费。

7.6. **税费。** 互助者自行承担所有适用税费（增值税、所得税、社保等）。Ulixai 在必要时收取/代缴匹配费用相关增值税或同等税项。

7.7. **抵销。** Ulixai 可将互助者所欠款项与其应收款项相互抵销。

---

## 8. 个人数据（全球框架)

8.1. **角色。** 就为匹配目的接收的用户数据而言，Ulixai 与互助者各自为其自身目的的独立数据控制者。

8.2. **法律依据与目的。** 合同履行（匹配）、合法利益（安全、防欺诈、改进）、法律合规（反洗钱、制裁）及必要时的同意。

8.3. 国际传输在必要时附带适当保障措施。

8.4. **权利与联系。** 用户可通过平台的联系表单行使相关权利。

8.5. **安全。** 采取合理的技术和组织措施；数据泄露将依照适用法律通报。

8.6. 互助者根据服务国家法律处理数据。

---

## 9. 知识产权

平台及其商标、标识、数据库和内容受保护。除在条款有效期内享有个人的、非独占、不可转让的访问权外，互助者不获得任何权利。互助者提供的内容授予 Ulixai 全球性、非独占许可，用于平台的托管与展示。

---

## 10. 免责声明、责任与赔偿

10.1. 不作任何保证，包括成果、质量或业务量；平台按**“原样”**提供。

10.2. **责任限制：** 在法律允许范围内，Ulixai 对互助者的总责任仅限于直接损失，且不得超过 Ulixai 在引发索赔的匹配交易中所收取的匹配费用总额。

10.3. **排除责任：** Ulixai 不承担任何间接、连带、特殊或惩罚性损失（包括利润损失、机会损失、客户流失、声誉损害、替代成本等）。

10.4. **赔偿义务：** 互助者应赔偿并保障 Ulixai（及其关联方、管理人员、员工、代理）免受因以下情况产生的任何索赔、损害、罚款或费用（包括律师费）：(i) 违反本条款/法律，(ii) 提供的内容，(iii) 服务或疏忽行为，(iv) 无合法工作/移民/执照许可。

10.5. 无代表关系。 本条款不构成 Ulixai 与互助者之间的代理、雇佣、合作或合资关系。

10.6. 存续条款。 第 5、7、8、9、10、11、12 条在终止后仍有效。

---

## 11. 适用法律 – 仲裁 – 爱沙尼亚司法管辖 – 集体诉讼放弃

11.1. **实体法：** 每次匹配中，Ulixai–互助者关系受服务国家法律管辖，受当地强制性法律及国际强制规范约束。补充适用及本条款的解释/效力或任何未被服务国家法律规制的事项，适用爱沙尼亚法。

11.2. **强制 ICC 仲裁：** Ulixai 与互助者的任何争议应根据国际商会仲裁规则（ICC）最终解决。仲裁地：爱沙尼亚塔林。 语言：法语。 仲裁庭适用第 11.1 条所述实体法。程序保密。

11.3. **集体诉讼放弃：** 在法律允许范围内，任何集体/代表性诉讼均被排除；仅允许个人索赔。

11.4. **爱沙尼亚法院专属管辖：** 对于不可仲裁事项、裁决执行或紧急措施，爱沙尼亚法院（塔林有管辖权）享有专属管辖权。互助者放弃任何关于法院选择或不便法院的异议。

---

## 12. 其他条款

12.1. **转让。** Ulixai 可将本条款转让给其关联实体或继承方；互助者未经书面同意不得转让。

12.2. **完整协议。** 本条款构成完整协议，取代此前关于同一主题的任何协议。

12.3. **通知。** 通过平台公告、应用内通知或联系表单发出。

12.4. **解释。** 标题仅为方便阅读，不具法律效力；不适用**“不利起草方解释”**规则。

12.5. **语言。** 可能提供翻译版本；如有歧义，以法语版为准。

12.6. **可分割性。** 若任何条款无效/不可执行，其余条款仍有效；可在可能范围内以具有等效效力的有效条款替代。

12.7. **权利不弃。** 未行使权利不构成放弃。

---

## 13. 联系方式

如有任何问题或法律请求，请联系我们：
`;

  const defaultAr = `
# الشروط والأحكام – Expatriates Aidants (عالمي)

**SOS Expat بواسطة Ulixai OÜ** (ويشار إليها فيما يلي باسم “**المنصة**”، “**SOS**” أو “**نحن**”)

**الإصدار 2.2 – آخر تحديث: 16 يونيو 2025**

---

## 1. التعريفات

**Expatrié Aidant** (“**المساعد**”): أي شخص مسجل على المنصة ويقدم خدمات دعم **غير قانونية وغير طبية** بشكل مستقل (مثل: الإرشاد، المساعدة العملية، المرافقة، الترجمة غير الرسمية، بناء الشبكات المحلية، إلخ).

**المستخدم**: أي شخص يستخدم المنصة للتواصل مع مساعد.

**التواصل / التوفيق بين الأطراف**: تقديم المنصة لتسهيل التواصل بين المستخدم والمساعد (مشاركة معلومات الاتصال، فتح قنوات اتصال، أو قبول طلب عبر المنصة).

**البلد / الإقليم**: الاختصاص القانوني الذي يشير إليه المستخدم في الغالب عند التواصل؛ إذا لم يُحدد، يُعتبر بلد إقامة المستخدم.

**رسوم التواصل**: الرسوم الثابتة التي تدفع لـ SOS مقابل كل تواصل (المادة 7): **19 €** (يورو) أو **25 $** (دولار أمريكي)، مع إمكانية تعديلها حسب العملة أو الموقع.

**مزود الدفع**: طرف ثالث مسؤول عن معالجة المدفوعات وتوزيع الأموال.

---

## 2. الهدف والنطاق والموافقة

2.1. تحكم هذه الشروط الوصول إلى المنصة واستخدامها من قبل المساعدين.

2.2. **تعمل Ulixai فقط كوسيط تقني.** Ulixai ليست صاحب عمل، ممثلًا، أو شريكًا للمساعد، ولا تقدم خدمات قانونية أو طبية أو مالية، ولا تشارك في أي عقد بين المساعد والمستخدم.

2.3. **الموافقة الإلكترونية (Click-wrap).** التسجيل أو استخدام المنصة يعني قبول هذه الشروط. يمكن لـ SOS الاحتفاظ بسجلات تقنية (طابع زمني، معرف، إلخ).

2.4. **التعديلات.** يمكن لـ SOS تحديث الشروط والرسوم في المستقبل؛ ويعتبر استمرار استخدام المنصة بمثابة قبول لهذه التحديثات.

2.5. **القدرة المهنية (B2B).** يصرح المساعد بأنه يعمل **بشكل مهني فقط**؛ ولا تنطبق حماية المستهلك.

---

## 3. حالة المساعد – الامتثال، التصاريح والمسؤوليات

3.1. **الاستقلالية.** يعمل المساعد كـ **مهني مستقل**؛ ولا ينشأ أي علاقة توظيف أو وكالة أو مشروع مشترك مع Ulixai.

3.2. **تصاريح العمل ووضع الهجرة.** المساعد مسؤول عن الحصول على جميع التصاريح اللازمة في كل بلد (تأشيرة، تصريح عمل، تسجيل تجاري، تأمين، تراخيص محلية). Ulixai لا تتحقق من هذه التصاريح.

3.3. **الخدمات غير المنظمة.** لا يقدم المساعد خدمات منظمة بدون الترخيص المناسب (قانونية، طبية، مالية، ضريبية، إلخ).

3.4. **الامتثال العام.** يلتزم المساعد بجميع القوانين المعمول بها (حماية المستهلك، التجارة الإلكترونية، الإعلانات، المنافسة، مكافحة غسيل الأموال، الضرائب، حماية البيانات، السلامة، العقوبات، إلخ).

3.5. **التأمين.** يؤكد المساعد أنه يمتلك التأمين المهني المناسب لأنشطته.

3.6. **السرية.** يحمي المساعد بيانات المستخدم ولا يشاركها إلا بموجب القانون أو بموافقة المستخدم.

---

## 4. الحساب، التحقق والأمان

4.1. **التسجيل.** لكل مساعد حساب واحد فقط؛ يجب أن تكون جميع المعلومات دقيقة ومحدثة.

4.2. **التحقق.** يمكن لـ Ulixai رفض، تعليق، أو حذف الوصول لأسباب أمنية أو امتثال أو جودة.

4.3. **الأمان.** تعتبر جميع الأنشطة التي تتم عبر الحساب من مسؤولية المساعد.

---

## 5. قواعد الاستخدام – الجودة، الحظر ورسوم التواصل

5.1. **الجودة والوصف.** يقدم المساعد أوصاف دقيقة لخدماته؛ لا يُسمح بالادعاءات الكاذبة.

5.2. **المحظورات.** المحتوى غير القانوني أو التمييزي أو المضلل؛ استخدام البيانات بشكل غير قانوني؛ الوصول غير المصرح به للمنصة؛ التواطؤ؛ الأنشطة غير القانونية.

5.3. **رسوم التواصل.** كل اتصال جديد يخضع **لرسوم التواصل**.

5.4. **التوافر.** يتم تقديم المنصة **“كما هي”**؛ لا توجد ضمانات لاستمرارية الخدمة.

---

## 6. العلاقة بين المساعد والمستخدم (خارج المنصة)

6.1. بعد التواصل، يمكن لكلا الطرفين إبرام عقود مستقلة.

6.2. يدير المساعد شروط الخدمة والفواتير وفقًا للقوانين المحلية.

6.3. **Ulixai ليست مسؤولة عن جودة أو نتائج الخدمة.**

---

## 7. الرسوم والدفع الفردي والضرائب

7.1. **رسوم التواصل:** 19 € (يورو) أو 25 $ (دولار أمريكي) لكل تواصل.

7.2. **الدفع الفردي والتوزيع.** تتم المدفوعات عبر المنصة؛ تقوم Ulixai بخصم الرسوم وتحويل الرصيد إلى المساعد.

7.3. **غير قابلة للاسترداد.** رسوم التواصل غير قابلة للاسترداد.

7.4. **الخصم عند الاسترداد.** يمكن خصم أي استرداد من حصة المساعد.

7.5. **العملة والتحويل.** يمكن قبول عملات متعددة؛ وقد تطبق رسوم مزود الدفع.

7.6. **الضرائب.** المساعد مسؤول عن جميع الضرائب المترتبة.

7.7. **التعويض.** يمكن لـ Ulixai تعديل المدفوعات لتعويض أي مطالبات.

---

## 8. البيانات الشخصية (عالمي)

8.1. **الأدوار.** Ulixai والمساعد مسؤولان بشكل مستقل عن معالجة البيانات.

8.2. **الغرض.** التواصل، الأمان، منع الاحتيال، الامتثال القانوني.

8.3. **النقل الدولي.** يتم تطبيق تدابير أمنية مناسبة.

8.4. **الحقوق والتواصل.** عبر نموذج الاتصال في المنصة.

8.5. **الأمان.** تدابير تقنية وتنظيمية مناسبة.

8.6. يعالج المساعد البيانات وفق قوانين بلده/منطقته.

---

## 9. الملكية الفكرية

المنصة والعلامات التجارية والشعارات وقاعدة البيانات والمحتوى محمية. يمنح المساعد فقط حقًا محدودًا وشخصيًا وغير قابل للتحويل. يمنح المحتوى المقدم من المساعد Ulixai ترخيصًا غير حصري لاستضافته وعرضه على المنصة.

---

## 10. الضمان والمسؤولية والتعويض

10.1. لا يوجد ضمان على النتائج أو الجودة.

10.2. **حدود المسؤولية:** المسؤولية الإجمالية محدودة برسوم التواصل.

10.3. **الاستثناء:** لا تُطبق المسؤولية عن الأضرار غير المباشرة أو التبعية أو العقابية.

10.4. **التعويض:** يعوض المساعد Ulixai عن أي مطالبات أو أضرار أو تكاليف قانونية.

10.5. **عدم التمثيل.**

10.6. تظل هذه الأحكام سارية بعد إنهاء الحساب.

---

## 11. القانون المطبق – التحكيم – الاختصاص القضائي الإستوني – الدعاوى الجماعية

11.1. **القانون المطبق:** لكل اتصال، يُطبق قانون البلد/المنطقة.

11.2. **التحكيم ICC:** تُحل جميع النزاعات وفق قواعد ICC. المكان: تالين، إستونيا؛ اللغة: الفرنسية.

11.3. **التنازل عن الدعوى الجماعية.**

11.4. **الاختصاص القضائي الإستوني.**

---

## 12. متفرقات

12.1. **النقل.** يمكن لـ Ulixai نقل حقوقها.

12.2. **الاتفاق الكامل.**

12.3. **الإشعارات.** عبر النشر على المنصة أو نموذج الاتصال.

12.4. **التفسير.**

12.5. **اللغات.** النسخة الفرنسية هي النسخة الأصلية.

12.6. **الاستقلالية.**

12.7. **عدم التنازل.**

---

## 13. الاتصال

لأي أسئلة أو مسائل قانونية، يرجى التواصل معنا عبر:
`;

  const defaultPt = `
# Termos e Condições de Uso – Expatriates Aidants (Global)

**SOS Expat by Ulixai OÜ** (doravante denominado “**Plataforma**”, “**SOS**” ou “**nós**”)

**Versão 2.2 – Última atualização: 16 de junho de 2025**

---

## 1. Definições

**Expatrié Aidant** (“**Aidant**”): qualquer pessoa registrada na Plataforma que fornece serviços de apoio **não legais e não médicos** de forma independente (ex.: orientação, ajuda prática, acompanhamento, tradução informal, rede local, etc.).

**Usuário**: qualquer pessoa que utilize a Plataforma para contatar um Aidant.

**Networking / Matchmaking**: a apresentação técnica/operacional realizada pela Plataforma entre Usuário e Aidant (compartilhamento de informações de contato, abertura de canais de comunicação ou aceitação de solicitação via Plataforma).

**Local / País**: a jurisdição legal à qual a solicitação do usuário se refere principalmente no momento do networking; se não especificado, será considerado o país de residência do usuário.

**Taxa de Networking**: taxa fixa devida à SOS por cada ação de networking (Seção 7): **19 €** (EUR) ou **25 $ USD**, com possibilidade de ajustes conforme a moeda/local.

**Provedor de Pagamento**: terceiro responsável pelo processamento do pagamento e distribuição de fundos.

---

## 2. Objetivo, escopo e consentimento

2.1. Estes termos regem o acesso e uso da Plataforma por Aidants.

2.2. **Ulixai atua apenas como intermediário técnico.** Ulixai não é empregador, representante ou parceiro do Aidant, não fornece serviços legais, médicos, fiscais ou contábeis, nem é parte de qualquer contrato entre Aidant e Usuário.

2.3. **Consentimento eletrônico (Click-wrap).** O registro ou uso da Plataforma constitui aceitação destes Termos. A SOS pode manter provas técnicas (timestamp, ID, etc.).

2.4. **Alterações.** A SOS pode atualizar termos e taxas no futuro; o uso continuado da Plataforma será considerado aceitação.

2.5. **Capacidade profissional (B2B).** O Aidant declara atuar **exclusivamente de forma profissional**; proteção ao consumidor não se aplica.

---

## 3. Status do Aidant – Conformidade, permissões e responsabilidades

3.1. **Independência.** O Aidant atua como **profissional independente**; nenhum vínculo empregatício, agência ou joint venture é criado com Ulixai.

3.2. **Autorização de trabalho e status migratório.** O Aidant é responsável por obter e manter todas as autorizações necessárias em cada país (visto, permissão de trabalho, registro comercial, seguro, licenças locais). A Ulixai não verifica essas autorizações.

3.3. **Serviços não regulamentados.** O Aidant não fornecerá serviços regulamentados sem licenciamento adequado (legal, médico, financeiro, fiscal, etc.).

3.4. **Conformidade geral.** O Aidant cumprirá todas as leis aplicáveis (proteção do consumidor, e-commerce, publicidade, concorrência, AML/KYC, fiscal, proteção de dados, segurança, sanções etc.).

3.5. **Seguro.** O Aidant confirma que possui seguro profissional adequado para suas atividades.

3.6. **Confidencialidade.** O Aidant protegerá os dados do usuário e só os compartilhará mediante obrigação legal ou consentimento.

---

## 4. Conta, verificação e segurança

4.1. **Registro.** Cada Aidant terá apenas uma conta; todas as informações devem ser precisas e atualizadas.

4.2. **Verificação.** A Ulixai pode recusar, suspender ou excluir o acesso por motivos de segurança, conformidade ou qualidade.

4.3. **Segurança.** Atividades na conta são consideradas realizadas pelo Aidant.

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

6.3. A Ulixai **não é responsável pela qualidade ou resultados do serviço**.

---

## 7. Taxas, pagamento único e impostos

7.1. **Taxa de networking:** 19 € (EUR) ou 25 $ (USD) por conexão.

7.2. **Pagamento único e distribuição.** Pagamentos são feitos via Plataforma; Ulixai deduz a taxa e repassa o saldo ao Aidant.

7.3. **Não reembolsável.** A taxa de networking não é reembolsável.

7.4. **Dedução em reembolso.** Qualquer reembolso pode ser deduzido da parte do Aidant.

7.5. **Moeda e conversão.** Diversas moedas são possíveis; taxas do provedor de pagamento podem se aplicar.

7.6. **Impostos.** O Aidant é responsável por todos os impostos aplicáveis.

7.7. **Indenização.** Ulixai pode ajustar pagamentos para compensar reivindicações.

---

## 8. Dados pessoais (global)

8.1. **Papéis.** Ulixai e o Aidant são responsáveis separadamente pelo processamento de dados.

8.2. **Finalidade.** Networking, segurança, prevenção de fraude, conformidade legal.

8.3. **Transferência internacional.** Medidas de segurança adequadas são aplicadas.

8.4. **Direitos e contato.** Via formulário de contato da Plataforma.

8.5. **Segurança.** Medidas técnicas e organizacionais apropriadas.

8.6. O Aidant processará dados conforme leis do país/local.

---

## 9. Propriedade intelectual

A Plataforma, marcas, logotipos, banco de dados e conteúdo são protegidos. O Aidant recebe apenas direito limitado, pessoal e não transferível. O conteúdo fornecido pelo Aidant concede à Ulixai licença não exclusiva para hospedagem e exibição na Plataforma.

---

## 10. Garantia, responsabilidade e indenização

10.1. Sem garantia de resultados ou qualidade.

10.2. **Limite de responsabilidade:** responsabilidade total limitada à taxa de networking.

10.3. **Exclusão:** danos indiretos, consequenciais ou punitivos não aplicáveis.

10.4. **Indenização:** Aidant indenizará Ulixai por quaisquer reivindicações, danos ou custos legais.

10.5. **Sem representação.**

10.6. Estas disposições permanecem válidas após término.

---

## 11. Lei aplicável – Arbitragem – Jurisdição estoniana – Ação coletiva

11.1. **Lei aplicável:** para cada conexão, aplica-se a lei do país/local.

11.2. **Arbitragem ICC:** todas as disputas resolvidas conforme regras ICC. Local: Tallinn, Estônia; idioma: francês.

11.3. **Renúncia à ação coletiva.**

11.4. **Jurisdicional estoniana.**

---

## 12. Diversos

12.1. **Transferência.** Ulixai pode transferir seus direitos.

12.2. **Acordo completo.**

12.3. **Notificações.** Via publicação na Plataforma ou formulário de contato.

12.4. **Interpretação.**

12.5. **Idiomas.** O francês é a versão original.

12.6. **Separabilidade.**

12.7. **Não renúncia.**

---

## 13. Contato

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
      <main className="min-h-screen bg-gray-950">
        {/* HERO */}
        <section className="relative pt-20 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-blue-500/10" />
          <div className="absolute inset-0 overflow-hidden">
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
                  to="/sos-appel"
                  className="group inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm font-semibold"
                >
                  <FileText className="w-5 h-5" />
                  <span>{t.ctaHero}</span>
                </Link>
                <a
                  href="http://localhost:5174/contact"
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
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/20" />
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
                to="/register"
                className="group relative overflow-hidden bg-white text-red-600 hover:text-red-700 px-10 py-5 rounded-3xl font-black text-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl flex items-center gap-3"
              >
                <span>{t.startNow}</span>
                {/* Flèche retirée sur demande */}
                <span className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-black/5" />
              </Link>

              <a
                href="http://localhost:5174/contact"
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
