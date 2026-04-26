import React, { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { Link } from "react-router-dom";
import {
  Scale,
  FileText,
  Shield,
  Check,
  Globe,
  Clock,
  ArrowRight,
  Briefcase,
  DollarSign,
  Users,
  Languages,
  Sparkles,
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

/**
 * TermsLawyers
 * - Logique métier conservée : Firestore (legal_documents / terms_lawyers), sélection de langue locale.
 * - Design harmonisé avec Home / TermsExpats (gradients, chips, sommaire, cartes).
 * - 100% éditable depuis l’admin ; fallback FR/EN intégré.
 * - Aucune utilisation de `any`.
 */

const TermsLawyers: React.FC = () => {
  const { language } = useApp();

  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedLanguage, setSelectedLanguage] = useState<
    "fr" | "en" | "es" | "de" | "ru" | "hi" | "pt" | "ch" | "ar"
  >((language as "fr" | "en" | "es" | "de" | "ru" | "hi" | "pt" | "ch" | "ar") || "fr");

  // Rester aligné avec la langue globale si elle change
  useEffect(() => {
    if (language)
      setSelectedLanguage(
        language as "fr" | "en" | "es" | "de" | "ru" | "hi" | "pt" | "ch" | "ar"
      );
  }, [language]);

  // Fetch dernier document actif
  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setIsLoading(true);
        const q = query(
          collection(db, "legal_documents"),
          where("type", "==", "terms_lawyers"),
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
      title: "CGU Avocats",
      subtitle:
        "Conditions générales d'utilisation pour les avocats prestataires",
      lastUpdated: "Version 3.2 – Dernière mise à jour : 26 avril 2026",
      loading: "Chargement...",
      joinNetwork: "Rejoindre le réseau",
      trustedByExperts: "Déjà 2K+ avocats nous font confiance",
      keyFeatures: "Points clés",
      features: [
        "Paiement garanti sous 7 jours",
        "Support technique 24/7",
        "Interface mobile optimisée",
        "Clients vérifiés",
      ],
      languageToggle: "Changer de langue",
      sections: {
        definitions: "Définitions",
        scope: "Objet, champ et acceptation",
        status: "Statut de l'Avocat – Indépendance et conformité",
        account: "Création de compte, vérifications et sécurité",
        rules: "Règles d'usage – Conflits, confidentialité, non-contournement",
        relationship: "Relation Avocat–Utilisateur (hors Plateforme)",
        fees: "Frais, paiement unique et taxes",
        payments: "Paiements – KYC/LCB-FT – Sanctions",
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
        "Développez votre activité à l'international et aidez des milliers d'expatriés.",
      startNow: "Commencer maintenant",
      contactUs: "Nous contacter",
      anchorTitle: "Sommaire",
      editHint: "Document éditable depuis la console admin",
      heroBadge: "Nouveau — Conditions mises à jour",
      ctaHero: "Rejoindre les avocats",
      contactForm: "Formulaire de contact",
    },
    en: {
      title: "Lawyer Terms",
      subtitle: "Terms of Use for lawyer providers",
      lastUpdated: "Version 3.2 – Last updated: April 26, 2026",
      loading: "Loading...",
      joinNetwork: "Join the network",
      trustedByExperts: "Already 2K+ lawyers trust us",
      keyFeatures: "Key features",
      features: [
        "Guaranteed payment within 7 days",
        "24/7 technical support",
        "Mobile-optimized interface",
        "Verified clients",
      ],
      languageToggle: "Switch language",
      sections: {
        definitions: "Definitions",
        scope: "Purpose, Scope and Acceptance",
        status: "Lawyer Status – Independence and Compliance",
        account: "Account, Checks and Security",
        rules: "Use Rules – Conflicts, Confidentiality, No Circumvention",
        relationship: "Lawyer–User Relationship (Off-Platform)",
        fees: "Fees, Single Payment and Taxes",
        payments: "Payments – AML/KYC – Sanctions",
        data: "Data Protection (Global Framework)",
        ip: "Intellectual Property",
        liability: "Warranties, Liability and Indemnity",
        law: "Governing Law – ICC Arbitration – Estonian Courts",
        protection: "International Protection Clauses",
        misc: "Miscellaneous",
        contact: "Contact",
      },
      readyToJoin: "Ready to join SOS Expat?",
      readySubtitle:
        "Develop your international practice and help thousands of expats.",
      startNow: "Start now",
      contactUs: "Contact us",
      anchorTitle: "Overview",
      editHint: "Document editable from the admin console",
      heroBadge: "New — Terms updated",
      ctaHero: "Join as a lawyer",
      contactForm: "Contact Form",
    },
    es: {
      title: "Términos para Abogados",
      subtitle: "Condiciones generales de uso para abogados proveedores",
      lastUpdated: "Versión 3.2 – Última actualización: 26 de abril de 2026",
      loading: "Cargando...",
      joinNetwork: "Únete a la red",
      trustedByExperts: "Más de 2.000 abogados ya confían en nosotros",
      keyFeatures: "Características principales",
      features: [
        "Pago garantizado en 7 días",
        "Soporte técnico 24/7",
        "Interfaz móvil optimizada",
        "Clientes verificados",
      ],
      languageToggle: "Cambiar idioma",
      sections: {
        definitions: "Definiciones",
        scope: "Propósito, alcance y aceptación",
        status: "Estado del abogado - Independencia y cumplimiento",
        account: "Creación de cuenta, verificaciones y seguridad",
        rules: "Reglas de uso - Conflictos, confidencialidad, sin evasión",
        relationship: "Relación abogado-usuario (fuera de la plataforma)",
        fees: "Honorarios, pago único e impuestos",
        payments: "Pagos - KYC/AML - Sanciones",
        data: "Protección de datos (marco global)",
        ip: "Propiedad intelectual",
        liability: "Garantías, responsabilidad e indemnización",
        law: "Ley aplicable - Arbitraje - Tribunales estonios",
        protection: "Cláusulas de protección internacional",
        misc: "Diversos",
        contact: "Contacto",
      },
      readyToJoin: "¿Listo para unirte a SOS Expat?",
      readySubtitle:
        "Desarrolla tu práctica internacional y ayuda a miles de expatriados.",
      startNow: "Comenzar ahora",
      contactUs: "Contáctanos",
      anchorTitle: "Resumen",
      editHint: "Documento editable desde la consola de administración",
      heroBadge: "Nuevo — Términos actualizados",
      ctaHero: "Únete como abogado",
      contactForm: "Formulario de contacto",
    },
    ru: {
      title: "Условия для адвокатов",
      subtitle: "Условия использования для адвокатов-поставщиков услуг",
      lastUpdated: "Версия 3.2 – Последнее обновление: 26 апреля 2026",
      loading: "Загрузка...",
      joinNetwork: "Присоединиться к сети",
      trustedByExperts: "Уже более 2000+ адвокатов доверяют нам",
      keyFeatures: "Ключевые особенности",
      features: [
        "Гарантированный платеж в течение 7 дней",
        "Техническая поддержка 24/7",
        "Оптимизированный мобильный интерфейс",
        "Проверенные клиенты",
      ],
      languageToggle: "Сменить язык",
      sections: {
        definitions: "Определения",
        scope: "Цель, область применения и принятие",
        status: "Статус адвоката - Независимость и соответствие",
        account: "Учетная запись, проверки и безопасность",
        rules:
          "Правила использования - Конфликты, конфиденциальность, без обхода",
        relationship: "Отношения адвокат-пользователь (вне платформы)",
        fees: "Гонорары, единовременный платеж и налоги",
        payments: "Платежи - KYC/AML - Санкции",
        data: "Защита данных (глобальная база)",
        ip: "Интеллектуальная собственность",
        liability: "Гарантии, ответственность и возмещение убытков",
        law: "Применимое право - Арбитраж ICC - Эстонские суды",
        protection: "Международные защитные положения",
        misc: "Прочее",
        contact: "Контакт",
      },
      readyToJoin: "Готовы присоединиться к SOS Expat?",
      readySubtitle:
        "Развивайте свою международную практику и помогите тысячам эмигрантов.",
      startNow: "Начать сейчас",
      contactUs: "Свяжитесь с нами",
      anchorTitle: "Обзор",
      editHint: "Документ редактируется через консоль администратора",
      heroBadge: "Новое — Условия обновлены",
      ctaHero: "Присоединиться как адвокат",
      contactForm: "Контактная форма",
    },
    de: {
      title: "Anwaltsbedingungen",
      subtitle: "Allgemeine Nutzungsbedingungen für Anwaltsdienstleister",
      lastUpdated: "Version 3.2 – Letzte Aktualisierung: 26. April 2026",
      loading: "Wird geladen...",
      joinNetwork: "Netzwerk beitreten",
      trustedByExperts: "Bereits 2000+ Anwälte vertrauen uns",
      keyFeatures: "Wichtige Merkmale",
      features: [
        "Garantierte Zahlung innerhalb von 7 Tagen",
        "24/7 technischer Support",
        "Optimierte mobile Benutzeroberfläche",
        "Überprüfte Kunden",
      ],
      languageToggle: "Sprache wechseln",
      sections: {
        definitions: "Definitionen",
        scope: "Zweck, Geltungsbereich und Annahme",
        status: "Anwaltsstatus - Unabhängigkeit und Compliance",
        account: "Konto, Überprüfungen und Sicherheit",
        rules: "Nutzungsregeln - Konflikte, Vertraulichkeit, keine Umgehung",
        relationship: "Anwalts-Benutzer-Beziehung (außerhalb der Plattform)",
        fees: "Gebühren, Einmalzahlung und Steuern",
        payments: "Zahlungen - KYC/AML - Sanktionen",
        data: "Datenschutz (globaler Rahmen)",
        ip: "Geistiges Eigentum",
        liability: "Gewährleistungen, Haftung und Schadensersatz",
        law: "Anwendbares Recht - ICC-Schiedsverfahren - Estnische Gerichte",
        protection: "Internationale Schutzklauseln",
        misc: "Sonstiges",
        contact: "Kontakt",
      },
      readyToJoin: "Bereit, SOS Expat beizutreten?",
      readySubtitle:
        "Entwickeln Sie Ihre internationale Tätigkeit und helfen Sie Tausenden von Expats.",
      startNow: "Jetzt starten",
      contactUs: "Kontaktieren Sie uns",
      anchorTitle: "Übersicht",
      editHint: "Dokument bearbeitbar über die Admin-Konsole",
      heroBadge: "Neu — Bedingungen aktualisiert",
      ctaHero: "Als Anwalt beitreten",
      contactForm: "Kontaktformular",
    },
    hi: {
      title: "वकील शर्तें",
      subtitle: "वकील सेवा प्रदाताओं के लिए सामान्य उपयोग की शर्तें",
      lastUpdated: "संस्करण 3.2 – अंतिम अपडेट: 26 अप्रैल 2026",
      loading: "लोड हो रहा है...",
      joinNetwork: "नेटवर्क में शामिल हों",
      trustedByExperts: "पहले से 2000+ वकील हमारे पर विश्वास करते हैं",
      keyFeatures: "मुख्य विशेषताएं",
      features: [
        "7 दिनों में गारंटीकृत भुगतान",
        "24/7 तकनीकी समर्थन",
        "अनुकूलित मोबाइल इंटरफेस",
        "सत्यापित ग्राहक",
      ],
      languageToggle: "भाषा बदलें",
      sections: {
        definitions: "परिभाषाएं",
        scope: "उद्देश्य, दायरा और स्वीकृति",
        status: "वकील स्थिति - स्वतंत्रता और अनुपालन",
        account: "खाता, सत्यापन और सुरक्षा",
        rules: "उपयोग के नियम - संघर्ष, गोपनीयता, कोई बायपास नहीं",
        relationship: "वकील-उपयोगकर्ता संबंध (प्लेटफॉर्म के बाहर)",
        fees: "शुल्क, एकल भुगतान और कर",
        payments: "भुगतान - KYC/AML - प्रतिबंध",
        data: "डेटा सुरक्षा (वैश्विक ढांचा)",
        ip: "बौद्धिक संपदा",
        liability: "वारंटी, दायित्व और क्षतिपूर्ति",
        law: "लागू कानून - ICC मध्यस्थता - एस्टोनियाई अदालतें",
        protection: "अंतर्राष्ट्रीय सुरक्षा खंड",
        misc: "विविध",
        contact: "संपर्क",
      },
      readyToJoin: "SOS Expat में शामिल होने के लिए तैयार हैं?",
      readySubtitle:
        "अपने अंतर्राष्ट्रीय अभ्यास को विकसित करें और हजारों प्रवासियों की मदद करें।",
      startNow: "अभी शुरू करें",
      contactUs: "हमसे संपर्क करें",
      anchorTitle: "सारांश",
      editHint: "एडमिन कंसोल से संपादन योग्य दस्तावेज़",
      heroBadge: "नया — शर्तें अपडेट की गईं",
      ctaHero: "वकील के रूप में शामिल हों",
      contactForm: "संपर्क फॉर्म",
    },
    pt: {
      title: "Termos para Advogados",
      subtitle:
        "Condições gerais de uso para advogados prestadores de serviços",
      lastUpdated: "Versão 3.2 – Última atualização: 26 de abril de 2026",
      loading: "Carregando...",
      joinNetwork: "Junte-se à rede",
      trustedByExperts: "Já 2000+ advogados confiam em nós",
      keyFeatures: "Características principais",
      features: [
        "Pagamento garantido em 7 dias",
        "Suporte técnico 24/7",
        "Interface móvel otimizada",
        "Clientes verificados",
      ],
      languageToggle: "Mudar idioma",
      sections: {
        definitions: "Definições",
        scope: "Propósito, escopo e aceitação",
        status: "Status do advogado - Independência e conformidade",
        account: "Conta, verificações e segurança",
        rules: "Regras de uso - Conflitos, confidencialidade, sem desvio",
        relationship: "Relacionamento advogado-usuário (fora da plataforma)",
        fees: "Honorários, pagamento único e impostos",
        payments: "Pagamentos - KYC/AML - Sanções",
        data: "Proteção de dados (marco global)",
        ip: "Propriedade intelectual",
        liability: "Garantias, responsabilidade e indenização",
        law: "Lei aplicável - Arbitragem ICC - Tribunais estonios",
        protection: "Cláusulas de proteção internacional",
        misc: "Diversos",
        contact: "Contato",
      },
      readyToJoin: "Pronto para se juntar ao SOS Expat?",
      readySubtitle:
        "Desenvolva sua prática internacional e ajude milhares de expatriados.",
      startNow: "Comece agora",
      contactUs: "Entre em contato conosco",
      anchorTitle: "Resumo",
      editHint: "Documento editável no console do administrador",
      heroBadge: "Novo — Termos atualizados",
      ctaHero: "Junte-se como advogado",
      contactForm: "Formulário de contato",
    },
    ch: {
      title: "律师使用条款",
      subtitle: "为律师服务提供者制定的一般使用条款",
      lastUpdated: "版本 3.2 – 最近更新：2026年4月26日",
      loading: "加载中...",
      joinNetwork: "加入网络",
      trustedByExperts: "已有超过2,000名律师信任我们",
      keyFeatures: "主要特点",
      features: [
        "7天内保证付款",
        "全天候24/7技术支持",
        "优化的移动界面",
        "经过验证的客户",
      ],
      languageToggle: "切换语言",
      sections: {
        definitions: "定义",
        scope: "目的、范围与接受",
        status: "律师状态 – 独立性与合规性",
        account: "账户创建、验证与安全",
        rules: "使用规则 – 冲突、隐私、禁止规避",
        relationship: "律师–用户关系（平台外）",
        fees: "费用、一次性付款及税费",
        payments: "支付 – KYC/反洗钱 – 制裁",
        data: "个人数据（全球框架）",
        ip: "知识产权",
        liability: "保证、责任与赔偿",
        law: "适用法律 – 仲裁 – 爱沙尼亚司法管辖",
        protection: "国际保护条款",
        misc: "其他事项",
        contact: "联系方式",
      },
      readyToJoin: "准备加入SOS Expat吗？",
      readySubtitle: "拓展您的国际业务，帮助数千名外籍人士。",
      startNow: "立即开始",
      contactUs: "联系我们",
      anchorTitle: "目录",
      editHint: "可通过管理控制台编辑文档",
      heroBadge: "新 — 条款已更新",
      ctaHero: "加入律师行列",
      contactForm: "联系表单",
    },
    ar: {
      title: "شروط استخدام المحامين",
      subtitle: "الشروط العامة لاستخدام مقدمي خدمات المحاماة",
      lastUpdated: "الإصدار 3.2 – آخر تحديث: 26 أبريل 2026",
      loading: "جارٍ التحميل...",
      joinNetwork: "انضم إلى الشبكة",
      trustedByExperts: "أكثر من 2000 محامٍ يثقون بنا",
      keyFeatures: "الميزات الرئيسية",
      features: [
        "دفع مضمون خلال 7 أيام",
        "دعم فني على مدار الساعة طوال أيام الأسبوع",
        "واجهة محمولة محسّنة",
        "عملاء تم التحقق منهم",
      ],
      languageToggle: "تغيير اللغة",
      sections: {
        definitions: "التعريفات",
        scope: "الغرض والنطاق والموافقة",
        status: "حالة المحامي – الاستقلالية والامتثال",
        account: "إنشاء الحساب، التحقق والأمان",
        rules: "قواعد الاستخدام – النزاعات، الخصوصية، منع التحايل",
        relationship: "علاقة المحامي بالمستخدم (خارج المنصة)",
        fees: "الرسوم، الدفع الواحد والضرائب",
        payments: "المدفوعات – KYC/مكافحة غسل الأموال – العقوبات",
        data: "البيانات الشخصية (الإطار العام)",
        ip: "الملكية الفكرية",
        liability: "الضمانات والمسؤولية والتعويض",
        protection: "بنود الحماية الدولية",
        law: "القانون المطبق – التحكيم – الاختصاص القضائي الإستوني",
        misc: "متفرقات",
        contact: "الاتصال",
      },
      readyToJoin: "هل أنت مستعد للانضمام إلى SOS Expat؟",
      readySubtitle: "نمّ نشاطك التجاري دوليًا وساعد آلاف المغتربين.",
      startNow: "ابدأ الآن",
      contactUs: "اتصل بنا",
      anchorTitle: "المحتويات",
      editHint: "يمكن تحرير المستند من خلال لوحة الإدارة",
      heroBadge: "جديد — تم تحديث الشروط",
      ctaHero: "انضم إلى المحامين",
      contactForm: "نموذج الاتصال",
    }
  };

  const t = translations[selectedLanguage];

  const handleLanguageChange = (
    newLang: "fr" | "en" | "es" | "de" | "ru" | "hi" | "pt" | "ch" | "ar"
  ) => {
    setSelectedLanguage(newLang); // Changement local (n'affecte pas la langue globale)
  };

  // --- Parser Markdown (mêmes règles que TermsExpats) ---
  const parseMarkdownContent = (text: string) => {
    const lines = text.split("\n");
    const elements: JSX.Element[] = [];
    let currentIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim() === "") continue;

      // Séparateur
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
            className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 mt-8 border-b-2 border-red-500 pb-4"
          >
            {title}
          </h1>
        );
        continue;
      }

      // H2 (avec numéro optionnel au début)
      if (line.startsWith("## ")) {
        const title = line.substring(3).trim();
        const match = title.match(/^(\d+)\.\s*(.*)$/);
        if (match) {
          elements.push(
            <h2
              id={`section-${match[1]}`}
              key={currentIndex++}
              className="scroll-mt-28 text-xl sm:text-2xl font-bold text-gray-900 mt-10 mb-6 flex items-center gap-3"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white text-sm font-bold shadow-lg">
                {match[1]}
              </span>
              <span>{match[2].replace(/\*\*/g, "")}</span>
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
            className="text-lg font-bold text-gray-800 mt-6 mb-4 border-l-4 border-blue-500 pl-4"
          >
            {title}
          </h3>
        );
        continue;
      }

      // Points numérotés 2.1 / 3.2 …
      const numberedMatch = line.match(/^(\d+\.\d+\.?)\s+(.*)$/);
      if (numberedMatch) {
        const number = numberedMatch[1];
        const inner = numberedMatch[2];
        const formatted = inner.replace(
          /\*\*(.*?)\*\*/g,
          '<strong class="font-semibold text-gray-900">$1</strong>'
        );
        elements.push(
          <div
            key={currentIndex++}
            className="bg-gray-50 border-l-4 border-red-500 rounded-r-xl p-5 my-4 hover:bg-gray-100 transition-colors duration-200"
          >
            <p className="text-gray-800 leading-relaxed">
              <span className="font-bold text-red-600 mr-2">{number}</span>
              <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatted) }} />
            </p>
          </div>
        );
        continue;
      }

      // Ligne full bold
      if (line.startsWith("**") && line.endsWith("**")) {
        const boldText = line.slice(2, -2);
        elements.push(
          <div
            key={currentIndex++}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 my-6"
          >
            <p className="font-bold text-gray-900 text-lg">{boldText}</p>
          </div>
        );
        continue;
      }

      // Bloc Contact dédié
      if (
        line.includes("Pour toute question") ||
        line.includes("Contact form") ||
        line.includes("For any questions")
      ) {
        elements.push(
          <div
            key={currentIndex++}
            className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-8 my-8 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold shadow-lg">
                14
              </span>
              Contact
            </h3>
            <p className="text-gray-800 leading-relaxed mb-6 text-lg">{line}</p>
            <a
              href="https://sos-expat.com/contact"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
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

      // Paragraphe normal
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

  // --- Contenu par défaut (séparé FR / EN) ---
  const defaultFr = `
# Conditions Générales d'Utilisation – Avocats (Global)

**SOS Expat d'WorldExpat OÜ** (la « **Plateforme** », « **SOS** », « **nous** »)

**Version 3.2 – Dernière mise à jour : 26 avril 2026**

---

## 1. Définitions

**Application / Site / Plateforme** : services numériques exploités par **WorldExpat OÜ** (société de droit estonien, registre n° 16885621, siège social : Tallinn, Estonie) permettant la mise en relation entre des utilisateurs (les « **Utilisateurs** ») et des professionnels du droit (les « **Avocats** »).

**Avocat** : tout professionnel du droit dûment autorisé à exercer dans au moins une juridiction, quel que soit son titre local : avocat (France, Belgique, Suisse), lawyer/attorney/counsel (USA, UK, Commonwealth), solicitor/barrister (UK, Irlande, Australie), abogado (Espagne, Amérique latine), Rechtsanwalt (Allemagne, Autriche, Suisse), advogado (Portugal, Brésil), avvocato (Italie), advocaat (Pays-Bas, Belgique), адвокат/юрист (Russie, CEI), 弁護士 (Japon), 律师 (Chine), ou tout autre titre équivalent reconnu par l'ordre professionnel ou l'autorité compétente de sa juridiction d'exercice.

**Mise en relation** : l'introduction technique/opérationnelle réalisée par la Plateforme entre un Utilisateur et un Avocat, matérialisée par (i) la transmission de coordonnées, (ii) l'ouverture d'un canal de communication (appel, message, visio), ou (iii) l'acceptation par l'Avocat d'une demande émise via la Plateforme.

**Pays d'Intervention** : la juridiction principalement visée par la Requête au moment de la Mise en relation. À défaut, le pays de résidence de l'Utilisateur au moment de la demande ; en cas de pluralité, la juridiction la plus étroitement liée à l'objet de la Requête.

**Frais de Mise en relation** : rémunération **due par l'Utilisateur à SOS Expat** pour chaque Mise en relation (art. 7), au titre du seul service technique de mise en relation fourni par la Plateforme. Ces frais ne constituent en aucun cas une commission, rétrocession ou partage des honoraires de l'Avocat. Leur montant est défini dans le **barème en vigueur**, consultable dans l'espace personnel de l'Avocat et de l'Utilisateur. SOS Expat peut modifier ce barème dans les conditions prévues à l'article 2.5.

**Requête** : la situation/projet juridique exposé par l'Utilisateur.

**Prestataire(s) de paiement** : services tiers utilisés pour percevoir le paiement unique de l'Utilisateur et répartir les fonds.

**Partenaire B2B** : toute personne morale (entreprise, association, mutuelle, comité d'entreprise, cabinet, organisation professionnelle, etc.) ayant conclu avec SOS Expat un contrat-cadre distinct prévoyant qu'elle finance, en tout ou partie, les Frais de Mise en relation pour ses membres, salariés ou bénéficiaires (les « **Utilisateurs B2B** »). Une **Mise en relation B2B** est une Mise en relation déclenchée par un Utilisateur B2B au titre d'un tel contrat-cadre. Par opposition, une **Mise en relation B2C** est déclenchée par un Utilisateur qui paie directement les Frais de Mise en relation.

**Listes de sanctions** : listes de personnes, entités ou pays faisant l'objet de sanctions économiques ou d'embargos, notamment celles de l'OFAC (États-Unis), de l'Union européenne, de l'ONU, du Trésor britannique (HMT), et de toute autre autorité compétente.

---

## 2. Objet, champ et acceptation

2.1. Les présentes CGU régissent l'accès et l'utilisation de la Plateforme par les Avocats.

2.2. SOS Expat agit uniquement en tant qu'intermédiaire technique de mise en relation. SOS Expat n'exerce pas la profession d'avocat, ne fournit pas de conseil juridique et n'est pas partie à la relation Avocat-Utilisateur.

2.3. **Acceptation électronique (click-wrap) et traçabilité.** L'Avocat accepte les CGU en cochant la case dédiée lors de l'inscription et/ou en utilisant la Plateforme. Cet acte vaut signature électronique et consentement contractuel conformément au Règlement eIDAS (UE) n°910/2014. SOS Expat conserve des **journaux d'audit horodatés** comprenant : (i) la date et l'heure précises (UTC) de l'acceptation, (ii) l'adresse IP de l'Avocat, (iii) l'identifiant unique de session, (iv) le user-agent du navigateur, (v) la version des CGU acceptées, (vi) le hash cryptographique du document accepté, et (vii) l'identifiant unique de l'Avocat. Ces journaux constituent une **preuve légale opposable** de l'acceptation des CGU.

2.4. **Conservation des preuves d'acceptation.** Conformément au RGPD et aux obligations légales de conservation, SOS Expat conserve les preuves d'acceptation des CGU pendant une durée de **dix (10) ans** à compter de la date d'acceptation, ou jusqu'à la fin de tout litige en cours le cas échéant. L'Avocat peut, sur demande écrite via le formulaire de contact, obtenir un **certificat d'acceptation** comprenant les éléments de preuve susmentionnés. Cette conservation est fondée sur l'intérêt légitime de SOS Expat à disposer de preuves en cas de litige (art. 6.1.f RGPD) et sur l'obligation légale de conservation des contrats commerciaux.

2.5. **Modifications (préavis P2B).** SOS Expat peut mettre à jour les CGU et/ou le barème des frais à tout moment, sous réserve d'un **préavis minimum de quinze (15) jours** notifié à l'Avocat sur support durable (email à l'adresse enregistrée et publication dans l'espace personnel), conformément à l'article 3 du Règlement (UE) 2019/1150 (« P2B »). Le préavis peut être réduit ou supprimé : (i) lorsque la modification est imposée par la loi ou par une décision d'autorité compétente ; (ii) pour des raisons impérieuses de sécurité ou de prévention de la fraude ; ou (iii) pour les corrections matérielles ou typographiques sans incidence économique. Pendant la période de préavis, l'Avocat peut **résilier sans pénalité** sa relation avec la Plateforme. À défaut de résiliation, la poursuite de l'usage de la Plateforme à l'expiration du préavis vaut acceptation. En cas de modification substantielle, l'Avocat sera invité à reconfirmer expressément son acceptation, tracée selon les modalités de l'article 2.3.

2.6. Durée : indéterminée.

---

## 3. Statut de l'Avocat – Indépendance, conformité et déclarations

3.1. L'Avocat agit en professionnel indépendant ; aucune relation d'emploi, mandat, agence, partenariat ou coentreprise n'est créée avec SOS Expat.

3.2. L'Avocat est seul responsable : (i) de ses diplômes, titres, inscriptions au barreau/équivalents et autorisations d'exercer ; (ii) de son assurance responsabilité civile professionnelle en vigueur et adaptée aux Pays d'Intervention ; (iii) du respect des lois et règles professionnelles locales (déontologie, publicité/démarchage, conflits d'intérêts, secret professionnel, LCB-FT/KYC, fiscalité, protection des consommateurs, etc.).

3.3. SOS Expat ne supervise pas et n'évalue pas le contenu ni la qualité des conseils de l'Avocat et n'endosse aucune responsabilité à ce titre.

3.4. **Capacité professionnelle (B2B).** L'Avocat déclare agir exclusivement à des fins professionnelles. Les régimes protecteurs des consommateurs ne s'appliquent pas à la relation SOS Expat–Avocat.

3.5. **Déclarations et garanties de l'Avocat.** En s'inscrivant sur la Plateforme, l'Avocat déclare et garantit expressément que :
- (a) Il est **majeur** selon le droit de son pays de résidence et/ou d'exercice ;
- (b) Il dispose de la **pleine capacité juridique** pour contracter et exercer sa profession ;
- (c) Il n'est pas placé sous tutelle, curatelle, sauvegarde de justice ou tout régime équivalent de protection ;
- (d) Il n'est pas frappé d'une **interdiction d'exercer** sa profession, temporaire ou définitive ;
- (e) Il n'est pas radié, suspendu ou exclu de son barreau ou ordre professionnel ;
- (f) Il ne fait l'objet d'aucune **procédure disciplinaire en cours** susceptible d'entraîner une suspension ou radiation (ou s'engage à en informer immédiatement SOS Expat le cas échéant) ;
- (g) Il ne figure sur **aucune Liste de sanctions** (OFAC, UE, ONU, HMT, ou autre) ;
- (h) Il n'a pas été **condamné pénalement** pour des faits incompatibles avec l'exercice de sa profession ;
- (i) Toutes les informations fournies lors de l'inscription sont **exactes, complètes et à jour** ;
- (j) Il s'engage à **informer immédiatement** SOS Expat de tout changement affectant ces déclarations ;
- (k) Il dispose du **droit effectif d'exercer sa profession d'avocat** dans chacun des pays qu'il a sélectionnés comme « pays d'intervention » lors de son inscription ou ultérieurement sur son profil. L'Avocat s'engage à ne sélectionner que des juridictions dans lesquelles il est **autorisé légalement** à fournir des conseils juridiques ou à représenter des clients, que ce soit en vertu de son inscription locale, d'accords de reconnaissance mutuelle, de conventions internationales ou de tout autre mécanisme légal. Toute sélection d'un pays d'intervention dans lequel l'Avocat n'est pas habilité à exercer constitue une **violation grave** des présentes CGU.
Toute fausse déclaration constitue une violation grave des CGU pouvant entraîner un bannissement immédiat et définitif, sans préjudice de toute action en réparation.

---

## 4. Création de compte, vérifications et sécurité

4.1. Conditions : droit d'exercer valide dans au moins une juridiction, justificatifs d'identité et de qualification, assurance RCP en cours de validité.

4.2. Processus : création de compte, fourniture des documents, validation manuelle pouvant inclure un entretien visio et des contrôles KYC/LCB-FT via des Prestataires.

4.3. Exactitude & mise à jour : l'Avocat garantit l'exactitude/actualité des informations ; un (1) compte par Avocat.

4.4. Sécurité : l'Avocat protège ses identifiants ; toute activité via le compte est réputée effectuée par lui ; signalement immédiat de toute compromission.

4.5. **Vérifications complémentaires à tout moment.** SOS Expat se réserve le droit de demander à l'Avocat, **à tout moment et sans avoir à justifier sa demande**, la fourniture ou la mise à jour de tout document attestant de son droit d'exercer, de son inscription au barreau ou équivalent, de son assurance responsabilité civile professionnelle, de son identité, ou de tout autre justificatif pertinent. L'Avocat s'engage à répondre à ces demandes dans un délai de **sept (7) jours ouvrés**. Le défaut de réponse ou la fourniture de documents non conformes peut entraîner la suspension immédiate du compte.

4.6. **Modération et contrôle qualité.** SOS Expat met en œuvre une politique de modération visant à garantir la qualité et la conformité des services proposés sur la Plateforme. Cette modération peut inclure : (i) la vérification des profils et contenus publiés, (ii) l'analyse des évaluations et réclamations des Utilisateurs, (iii) le contrôle du respect des CGU et des lois applicables, (iv) toute autre mesure raisonnable de contrôle qualité. L'Avocat accepte de se soumettre à cette modération.

4.7. **Suspension temporaire du compte.** SOS Expat peut **suspendre immédiatement et sans préavis** le compte de l'Avocat dans les cas suivants :
- (a) Suspicion de fraude, d'usurpation d'identité ou de fausse déclaration ;
- (b) Réclamations multiples ou graves de la part des Utilisateurs ;
- (c) Non-fourniture des documents demandés au titre de l'article 4.5 ;
- (d) Violation avérée ou suspectée des CGU ou des lois applicables ;
- (e) Comportement portant atteinte à l'image ou à la réputation de la Plateforme ;
- (f) Injonction d'une autorité judiciaire, administrative ou ordinale ;
- (g) Tout autre motif légitime apprécié souverainement par SOS Expat.
Durant la suspension, l'Avocat ne peut plus accéder à son compte ni recevoir de nouvelles Mises en relation. Les paiements en cours peuvent être retenus jusqu'à clarification de la situation.

4.8. **Bannissement définitif (résiliation pour faute).** SOS Expat peut **résilier définitivement et sans préavis** le compte de l'Avocat (« bannissement ») dans les cas suivants :
- (a) Violation grave ou répétée des CGU ;
- (b) Fraude avérée, fausse déclaration intentionnelle ou usurpation d'identité/titre ;
- (c) Perte du droit d'exercer (radiation, suspension ordinale, non-renouvellement d'inscription) ;
- (d) Condamnation pénale incompatible avec l'exercice de la profession ;
- (e) Comportement gravement préjudiciable aux Utilisateurs ou à la Plateforme ;
- (f) Récidive après une suspension temporaire ;
- (g) Contournement avéré de la Plateforme pour éviter les Frais de Mise en relation ;
- (h) Non-respect des obligations de vérification KYC malgré relances ;
- (i) Tout autre motif grave apprécié souverainement par SOS Expat.
Le bannissement est **définitif et irrévocable**. L'Avocat banni ne peut créer de nouveau compte. Les fonds en attente peuvent être retenus à titre de dommages et intérêts forfaitaires, sans préjudice de toute autre action en réparation.

4.9. **Procédure et notification.** En cas de suspension ou de bannissement, SOS Expat notifie l'Avocat par email à l'adresse enregistrée. Cette notification indique le motif de la mesure (sauf obligation légale de confidentialité). L'Avocat dispose d'un délai de **quinze (15) jours** pour présenter ses observations par écrit via le formulaire de contact. SOS Expat examine ces observations mais n'est pas tenue de lever la mesure. La décision de SOS Expat est **discrétionnaire et définitive**.

4.10. **Effets de la suspension ou du bannissement.** En cas de suspension ou de bannissement :
- (a) L'accès au compte est immédiatement bloqué ;
- (b) Le profil de l'Avocat est retiré des résultats de recherche ;
- (c) Les Mises en relation en cours peuvent être annulées ;
- (d) Les paiements en attente peuvent être retenus ou compensés avec tout montant dû à SOS Expat ;
- (e) L'Avocat reste tenu de ses obligations (confidentialité, non-sollicitation, etc.) conformément aux clauses de survie.

4.11. **Inactivité.** En cas d'**inactivité supérieure à 365 jours**, le compte peut être désactivé automatiquement après notification. L'Avocat peut réactiver son compte sur demande, sous réserve de fournir les documents de vérification requis.

4.12. **Résiliation volontaire.** L'Avocat peut fermer son compte à tout moment après avoir honoré ses obligations en cours (prestations acceptées, remboursements éventuels). La demande de fermeture s'effectue via le formulaire de contact. SOS Expat procède à la fermeture dans un délai de **trente (30) jours**.

4.13. **Communications électroniques.** L'Avocat consent à recevoir toute notification relative aux CGU, à la modération et aux mesures de suspension/bannissement par voie électronique (email, notification in-app, publication sur la Plateforme). L'Avocat s'engage à maintenir une adresse email valide et à consulter régulièrement ses notifications.

4.14. **Système interne de traitement des réclamations (Règlement P2B).** Conformément à l'article 11 du Règlement (UE) 2019/1150, SOS Expat met à la disposition de l'Avocat un **système interne de traitement des réclamations gratuit**, accessible via le formulaire de contact (https://sos-expat.com/contact). SOS Expat s'engage à : (i) **accuser réception** de toute réclamation sous **sept (7) jours ouvrés** ; (ii) traiter la réclamation **avec sérieux et sans discrimination, dans un délai raisonnable** (en règle générale **trente (30) jours**) ; (iii) communiquer à l'Avocat le résultat **motivé** du traitement, dans un langage clair et compréhensible, indiquant les voies de recours ultérieures (médiation à l'art. 12.5, arbitrage à l'art. 12.2) ; (iv) tenir des **statistiques agrégées** sur le fonctionnement de ce système, accessibles annuellement.

---

## 5. Règles d'usage – Conflits, confidentialité, non-contournement

5.1. **Conflits d'intérêts.** L'Avocat effectue un screening approprié avant tout conseil. En cas de conflit, il se retire et en informe l'Utilisateur.

5.2. **Secret professionnel & confidentialité.** L'Avocat respecte la confidentialité et le secret professionnel selon le droit applicable du Pays d'Intervention.

**Enregistrement des appels — politique générale :**
- (a) **Par défaut**, SOS Expat **n'enregistre PAS le contenu audio** des appels entre Avocat et Utilisateur. Seules les **métadonnées techniques** sont conservées (horodatage, durée, identifiants Twilio, statut de connexion) à des fins de facturation, anti-fraude et résolution de litiges techniques ;
- (b) SOS Expat **n'active aucun enregistrement audio sans le consentement explicite, préalable et séparé de l'Avocat ET de l'Utilisateur**, manifesté avant le début de l'appel par une action positive distincte. Aucun enregistrement ne peut être déclenché unilatéralement par SOS Expat, à la seule exception d'une **réquisition régulière émanant d'une autorité judiciaire compétente du pays de l'Avocat ou de l'Utilisateur**, présentant les garanties d'ordre public requises par cette juridiction (notamment au regard du secret professionnel de l'avocat) ;
- (c) Lorsqu'un enregistrement est exceptionnellement activé dans le cadre du (b), il est conservé pour la durée strictement nécessaire à sa finalité, dans la limite maximale de **six (6) mois** (sauf prolongation imposée par une procédure judiciaire en cours), conformément au RGPD et aux recommandations des autorités locales de protection des données ;
- (d) **L'Avocat s'interdit lui-même** d'enregistrer, transcrire intégralement, divulguer ou utiliser les échanges à d'autres fins que la prestation convenue, sauf autorisation écrite de l'Utilisateur ou obligation légale ;
- (e) **Le secret professionnel demeure intact** : tout enregistrement éventuel par SOS Expat ne saurait être utilisé contre l'Avocat ou l'Utilisateur en violation des règles déontologiques applicables au secret professionnel.

5.3. **Non-contournement.** SOS Expat ne perçoit aucune commission sur les honoraires. Chaque nouvelle Mise en relation avec un nouvel Utilisateur via la Plateforme donne lieu aux Frais de Mise en relation. Il est interdit de contourner la Plateforme pour éviter ces frais lors d'une nouvelle introduction.

5.4. **Comportements interdits.** Usurpation d'identité/titre, contenus illicites, manipulation, collusion/boycott visant à nuire à la Plateforme, violation de lois sur sanctions/export, ou toute activité illégale.

5.5. **Disponibilité.** La Plateforme est fournie « en l'état » ; aucune disponibilité ininterrompue n'est garantie (maintenance, incidents, force majeure). L'accès peut être restreint si la loi l'impose.

---

## 6. Relation Avocat–Utilisateur (hors Plateforme)

6.1. Après la Mise en relation, l'Avocat et l'Utilisateur peuvent contractualiser hors Plateforme (SOS Expat n'intervient pas dans la fixation ni l'encaissement des honoraires, sauf mécanisme de paiement unique décrit ci-dessous).

6.2. L'Avocat remet ses conventions d'honoraires selon le droit local, collecte/reverse les taxes applicables et respecte les règles locales (publicité, démarchage, conflits d'intérêts, consommateurs).

6.3. SOS Expat n'est pas responsable de la qualité, de l'exactitude ou du résultat des conseils de l'Avocat.

---

## 7. Frais, paiement unique et taxes

7.1. **Frais de Mise en relation (rémunération de la Plateforme).** Les Frais de Mise en relation rémunèrent **exclusivement le service technique de mise en relation** fourni par SOS Expat à l'**Utilisateur**. Ils sont **dus par l'Utilisateur**, et **non par l'Avocat**. Leur montant est défini dans la **grille tarifaire en vigueur**, consultable dans l'espace personnel de l'Avocat, par Mise en relation, hors taxes et hors frais du Prestataire de paiement. Toute modification du barème intervient dans les conditions de l'article 2.5 (préavis minimum quinze (15) jours). L'Avocat est invité à consulter régulièrement la grille tarifaire en vigueur.

7.2. **Caractérisation juridique du paiement — deux dettes distinctes et indépendantes.** Le paiement effectué par l'Utilisateur via la Plateforme se décompose **juridiquement en deux dettes distinctes et indépendantes**, malgré leur règlement par un encaissement unique pour des raisons de commodité opérationnelle :
- (a) **Dette « Mise en relation »** : somme **due par l'Utilisateur à SOS Expat** au titre du service technique de mise en relation (Frais de Mise en relation, art. 7.1) ;
- (b) **Dette « Honoraires »** : somme **due par l'Utilisateur à l'Avocat** au titre des honoraires de la prestation juridique convenue entre eux. La convention d'honoraires, le contenu et la qualité de la prestation relèvent **exclusivement** de la relation Avocat–Utilisateur, hors Plateforme (art. 6 et 13.5).

**SOS Expat ne perçoit, ne réclame et n'a droit à aucune commission, rétrocession, partage, pourcentage ou fraction quelconque des honoraires de l'Avocat — notamment dans les juridictions dont les règles déontologiques prohibent le partage d'honoraires avec un non-avocat. Les Frais de Mise en relation constituent la seule rémunération de SOS Expat et proviennent exclusivement de la dette de l'Utilisateur visée au (a).**

Le Prestataire de paiement, agissant pour la part (b) en qualité d'**agent payeur de l'Avocat**, reverse à ce dernier les honoraires perçus, sous déduction des seuls frais bancaires de traitement et, le cas échéant, des frais de conversion de devise (art. 7.3 et 7.4). **Le montant net que l'Avocat percevra est affiché dans son tableau de bord avant et après chaque transaction**, lui permettant d'accepter ou de refuser la mise en relation en toute connaissance de cause.

7.3. **Frais bancaires du Prestataire de paiement.** Le Prestataire de paiement — **Stripe Payments Europe Ltd.** (Irlande, UE, certifié PCI-DSS niveau 1) **ou PayPal (Europe) S.à r.l. et Cie, S.C.A.** (Luxembourg, UE, certifié PCI-DSS), selon le pays de résidence et la disponibilité — prélève des frais de traitement sur chaque transaction. **Ces frais bancaires sont intégralement à la charge de l'Avocat** et sont automatiquement déduits du montant qui lui est reversé. Le détail de ces frais est disponible dans les conditions du Prestataire de paiement (Stripe : stripe.com/fr/pricing ; PayPal : paypal.com/fr/webapps/mpp/merchant-fees) et dans le tableau de bord de l'Avocat pour chaque transaction.

7.4. **Frais de change et conversion de devises.** Lorsque la devise de paiement de l'Utilisateur diffère de la devise du compte bancaire de l'Avocat, des **frais de conversion de devises** sont appliqués par le Prestataire de paiement. **Ces frais de change sont intégralement à la charge de l'Avocat** et sont déduits du montant qui lui est reversé. Les taux de change appliqués sont ceux du Prestataire de paiement au moment du transfert. L'Avocat reconnaît et accepte expressément que SOS Expat n'a aucun contrôle sur ces taux de change et décline toute responsabilité quant aux fluctuations de devises ou aux frais appliqués par le Prestataire.

7.5. **Calcul du montant net reversé à l'Avocat.** Le montant net reversé à l'Avocat correspond à la **dette « Honoraires »** due par l'Utilisateur (art. 7.2.b), sous déduction **uniquement** : (i) des **frais bancaires** du Prestataire de paiement applicables à la part « Honoraires » (art. 7.3) et (ii) le cas échéant, des **frais de conversion de devise** (art. 7.4). **Les Frais de Mise en relation (art. 7.2.a) ne sont en aucun cas déduits des honoraires** : ils sont prélevés au titre d'une dette distincte de l'Utilisateur envers SOS Expat. **L'Avocat est informé du montant exact qu'il percevra dans son tableau de bord avant chaque prestation et peut ainsi décider en toute connaissance de cause d'accepter ou non la mise en relation.**

7.6. **Durée minimale d'appel et paiement.** **Aucun paiement n'est dû ni effectué** lorsque la durée effective de l'appel entre l'Utilisateur et l'Avocat est **inférieure à soixante (60) secondes**. Dans ce cas, l'autorisation de paiement est automatiquement annulée, l'Utilisateur n'est pas débité, et aucune rémunération n'est versée à l'Avocat. Cette règle s'applique quels que soient les motifs de la brièveté de l'appel (déconnexion technique, raccrochage anticipé, indisponibilité, etc.).

7.7. **Exigibilité & non-remboursement.** Les Frais de Mise en relation sont dus dès la Mise en relation effective et sont **non remboursables** (sauf geste commercial discrétionnaire de SOS Expat en cas d'échec exclusivement imputable à la Plateforme et dans la mesure permise par la loi).

7.8. **Remboursement à l'Utilisateur.** Si un remboursement est accordé à l'Utilisateur, il est imputé sur la part de l'Avocat : SOS Expat peut retenir/compenser le montant correspondant sur les versements futurs de l'Avocat, ou en demander le remboursement direct si aucun versement n'est à venir. Les Frais de Mise en relation restent acquis à SOS Expat, sauf décision discrétionnaire contraire.

7.9. **Délais de paiement de l'Avocat selon le canal.** Sous réserve de la complétion du processus KYC (article 8), les délais de versement de la rémunération nette de l'Avocat diffèrent selon le canal de la Mise en relation :
- (a) **Mises en relation B2C** (paiement direct par l'Utilisateur) : la rémunération de l'Avocat est mise en paiement **immédiatement à l'issue de l'appel** par le Prestataire de paiement, sous réserve uniquement des délais techniques de traitement bancaire, anti-fraude et de capture du paiement propres au Prestataire (typiquement de un (1) à sept (7) jours ouvrés selon le pays de l'Avocat et la maturité de son compte chez le Prestataire) ;
- (b) **Mises en relation B2B** (paiement par le Partenaire B2B) : compte tenu du modèle de facturation différée applicable au Partenaire B2B (facturation mensuelle ou « net-30 »), la rémunération de l'Avocat est versée **dans un délai de trente (30) jours** suivant la date de l'appel ;
- (c) Dans tous les cas, le paiement peut être suspendu en cas de litige, de réclamation de l'Utilisateur ou du Partenaire, de vérification KYC/LCB-FT en cours, ou de toute autre circonstance prévue aux présentes CGU.

7.10. **Taxes.** L'Avocat demeure **seul responsable** de l'ensemble de ses obligations fiscales (impôts sur le revenu, TVA, cotisations sociales, charges professionnelles, etc.) dans sa juridiction de résidence et/ou d'exercice. Les montants reversés à l'Avocat sont des **montants bruts** ; l'Avocat est responsable de la déclaration et du paiement de toutes taxes applicables. SOS Expat collecte et reverse, lorsque requis par la loi, la TVA/équivalent local sur les Frais de Mise en relation uniquement.

7.11. **Compensation.** SOS Expat peut compenser tout montant que l'Avocat lui doit (au titre d'un remboursement Utilisateur, pénalité, ou autre obligation) avec toute somme due à l'Avocat.

7.12. **Transparence tarifaire et historique.** L'Avocat peut à tout moment consulter dans son tableau de bord personnel : (i) le détail complet de chaque transaction, (ii) le montant brut payé par l'Utilisateur, (iii) les Frais de Mise en relation perçus par SOS Expat (dette « Mise en relation »), (iv) les frais bancaires du Prestataire de paiement applicables à la part « Honoraires », (v) les frais de change le cas échéant, (vi) le montant net qui lui est ou lui sera reversé, et (vii) l'historique de toutes ses transactions. Ces informations sont conservées et accessibles pendant toute la durée du compte et **cinq (5) ans** après sa clôture.

7.13. **Déclaration fiscale automatique (Directive DAC7 — UE 2021/514).** L'Avocat résidant dans un État membre de l'Union européenne est informé que SOS Expat, en sa qualité d'opérateur de plateforme déclarant, est tenue de **déclarer annuellement** aux autorités fiscales compétentes (au titre de la Directive (UE) 2021/514 dite « DAC7 ») les informations relatives aux Avocats actifs résidant dans l'UE, à savoir notamment : nom, adresse, identifiant fiscal (TIN), État de résidence, montant total des contreparties perçues via la Plateforme et nombre de Mises en relation, ventilés par trimestre civil. L'Avocat s'engage à fournir et à tenir à jour ces informations dans son espace personnel. Le défaut de communication ou de mise à jour peut entraîner la suspension des paiements jusqu'à régularisation, conformément aux dispositions DAC7.

7.14. **Canal B2B — Mises en relation via un Partenaire B2B.**

(a) **Périmètre.** Une Mise en relation B2B est déclenchée par un Utilisateur B2B, bénéficiaire d'un contrat-cadre conclu entre SOS Expat et un Partenaire B2B (art. 1).

(b) **Adaptation des deux dettes.** Le mécanisme des deux dettes (art. 7.2) s'applique comme suit en B2B :
- la **dette « Mise en relation »** est due par le **Partenaire B2B** à SOS Expat (en tout ou partie selon le contrat-cadre), de sorte que l'**Utilisateur B2B ne paie en règle générale rien**, ou ne paie qu'un éventuel ticket modérateur à SOS Expat ;
- la **dette « Honoraires »** demeure due par l'**Utilisateur final** à l'**Avocat**, sauf clause expresse du contrat-cadre prévoyant une prise en charge totale ou partielle des honoraires par le Partenaire B2B (auquel cas le Partenaire devient redevable de la part prise en charge envers l'Avocat, via le mécanisme d'agent payeur de l'art. 7.2).
- L'Avocat n'est en aucun cas dispensé de signer une convention d'honoraires conforme à sa déontologie locale (art. 6.2).

(c) **Tarifs Avocat distincts B2C / B2B — l'Avocat l'accepte expressément.** L'Avocat **reconnaît et accepte expressément** que **la rémunération nette qu'il perçoit pour une Mise en relation B2B peut différer**, à la hausse ou à la baisse, **de celle perçue pour une Mise en relation B2C** (par exemple : tarif forfaitaire négocié avec le Partenaire, prise en compte d'un volume garanti, prise en charge totale ou partielle des honoraires par le Partenaire, ou réduction consentie au Partenaire). Le **canal d'origine (B2C ou B2B)** et le **montant exact** que l'Avocat percevra sont **affichés dans son tableau de bord avant chaque Mise en relation**, lui permettant de l'accepter ou de la refuser librement et en toute connaissance de cause. **Aucune obligation d'acceptation** ne pèse sur l'Avocat à raison du canal ou du tarif proposé.

(d) **Inopposabilité du contrat-cadre B2B à l'Avocat.** Les stipulations du contrat-cadre conclu entre SOS Expat et le Partenaire B2B **ne sont pas opposables à l'Avocat** ; seules les présentes CGU et les informations affichées dans le tableau de bord de l'Avocat régissent la relation entre SOS Expat et l'Avocat à l'occasion d'une Mise en relation B2B.

(e) **Toute autre stipulation des présentes CGU s'applique** aux Mises en relation B2B.

(f) **Barèmes en vigueur à la date des présentes (à titre indicatif).** Au jour de la dernière mise à jour des présentes CGU, les barèmes nets de rémunération de l'Avocat sont les suivants :
- **Mise en relation B2C** : **trente euros (30 €) ou trente dollars US (30 USD)** net par Mise en relation acceptée et exécutée, selon la devise du règlement ;
- **Mise en relation B2B** : **vingt euros (20 €) ou vingt dollars US (20 USD)** net par Mise en relation acceptée et exécutée, selon la devise du règlement.

Ces montants sont **indicatifs** et reflètent le barème en vigueur à la date de mise à jour des présentes CGU. Le **barème actualisé** est en permanence consultable dans le tableau de bord de l'Avocat avant chaque Mise en relation. Toute évolution est soumise au préavis de quinze (15) jours prévu à l'article 7.15.

7.15. **Modification du barème de rémunération de l'Avocat.** SOS Expat se réserve le droit de **modifier à tout moment le barème de rémunération nette de l'Avocat**, qu'il s'agisse :
- (i) du **barème B2C** — par modification des Frais de Mise en relation ou de leur structure (qui se répercute sur le net perçu par l'Avocat) ;
- (ii) du **barème B2B** — par modification de la rémunération forfaitaire ou variable applicable aux Mises en relation B2B ;
- (iii) ou de toute autre composante de la rémunération nette (par exemple : devises, paliers de volume, paliers d'ancienneté).

Toute modification est soumise au **préavis minimum de quinze (15) jours** prévu à l'article 2.5, notifié à l'Avocat sur support durable (email à l'adresse enregistrée et publication dans son espace personnel). Pendant la période de préavis, l'Avocat peut **résilier sans pénalité** sa relation avec la Plateforme ou continuer à **refuser au cas par cas** les Mises en relation dont la rémunération ne lui conviendrait plus, étant rappelé que **l'Avocat n'est jamais tenu d'accepter une Mise en relation**. **Les Mises en relation déjà acceptées avant l'expiration du préavis demeurent rémunérées au tarif en vigueur à la date d'acceptation.** À défaut de résiliation, la poursuite de l'usage de la Plateforme à l'expiration du préavis vaut acceptation du nouveau barème.

---

## 8. Paiements – KYC/LCB-FT – Sanctions

8.1. **Prestataires de paiement.** Les paiements sont traités **exclusivement** par des Prestataires tiers certifiés **PCI-DSS** : **Stripe Payments Europe Ltd.** (Irlande, UE) et/ou **PayPal (Europe) S.à r.l. et Cie, S.C.A.** (Luxembourg, UE). Le choix du Prestataire dépend du pays de résidence/d'exercice de l'Avocat (Stripe couvre actuellement 44 pays, PayPal 150+ pays). L'Avocat **accepte expressément** les conditions générales et les processus KYC/LCB-FT du ou des Prestataires applicables. **SOS Expat n'a aucun rôle de banque, d'établissement de paiement ou d'établissement de crédit** ; SOS Expat n'est qu'un client commercial des Prestataires de paiement précités.

8.2. SOS Expat peut différer, retenir ou annuler des paiements en cas de soupçon de fraude, de non-conformité ou d'injonction légale.

8.3. **Sanctions internationales et embargos.** L'Avocat déclare et garantit :
- (a) Ne pas figurer, directement ou indirectement, sur une **Liste de sanctions** (OFAC/SDN, UE, ONU, HMT, ou toute autre liste de sanctions applicable) ;
- (b) Ne pas être détenu ou contrôlé, directement ou indirectement, par une personne ou entité figurant sur une Liste de sanctions ;
- (c) Ne pas être résident, ressortissant ou situé dans un **pays ou territoire faisant l'objet d'un embargo global ou de mesures restrictives complètes** au titre des lois et règlements applicables, en particulier ceux des Prestataires de paiement, de l'Union européenne, des Nations unies, de l'OFAC (États-Unis), du HMT (Royaume-Uni) ou de toute autre autorité compétente. La liste à jour de ces pays et territoires est tenue par les autorités précitées et fait foi ; SOS Expat n'établit ni ne publie sa propre liste géopolitique ;
- (d) Ne pas utiliser la Plateforme pour des transactions impliquant des personnes, entités ou pays sanctionnés ;
- (e) Respecter toutes les **lois sur le contrôle des exportations** applicables.
SOS Expat se réserve le droit de **restreindre ou bloquer immédiatement l'accès** à la Plateforme dans tout territoire soumis à sanctions ou embargos, ou pour tout Avocat suspecté de violer ces dispositions, sans préavis ni indemnité. SOS Expat peut également être tenue de **geler les fonds** de l'Avocat en cas d'injonction d'une autorité compétente.

### Fonds non réclamés et vérification KYC

8.4. **Obligation de compléter le processus de vérification (KYC).** Pour recevoir les paiements issus des prestations réalisées via la Plateforme, l'Avocat s'engage à compléter le processus de vérification d'identité (KYC - Know Your Customer) auprès du Prestataire de paiement applicable (**Stripe** ou **PayPal**, selon son pays de résidence) dans les meilleurs délais suivant son inscription. L'Avocat reconnaît que l'absence de vérification KYC complète empêche techniquement le versement des fonds sur son compte bancaire ou compte PayPal.

8.5. **Conservation des fonds en attente.** Lorsqu'un paiement est effectué par un Utilisateur pour une prestation réalisée par un Avocat n'ayant pas complété sa vérification KYC, les fonds correspondant à la part de l'Avocat (déduction faite des frais de mise en relation de la Plateforme) sont conservés en attente sur un compte séquestre. La Plateforme s'engage à :
- Notifier l'Avocat par email de l'existence de fonds en attente ;
- Envoyer des rappels réguliers (à 7 jours, 30 jours, 60 jours, 90 jours, 120 jours et 150 jours) ;
- Fournir à l'Avocat tous les moyens nécessaires pour compléter sa vérification KYC.

8.6. **Fonds en attente prolongée — frais de gestion et transfert aux autorités compétentes.** Lorsque la vérification KYC n'est pas complétée dans un délai de **cent quatre-vingts (180) jours** à compter du premier paiement mis en attente, et malgré les notifications prévues à l'article 8.5 :
- (a) **Frais de gestion forfaitaires.** SOS Expat peut prélever sur les fonds en attente des **frais de gestion forfaitaires raisonnables, plafonnés à dix pour cent (10 %) du montant retenu**, couvrant strictement les coûts administratifs effectifs de conservation, de tentatives de contact et de traitement comptable ;
- (b) **Conservation prolongée.** Le solde demeure conservé sur le compte de cantonnement du Prestataire de paiement (ou consigné par SOS Expat si les conditions techniques l'exigent). L'Avocat peut, à tout moment durant cette phase, compléter son KYC et réclamer les fonds ;
- (c) **Transfert aux autorités compétentes (déshérence).** À l'expiration d'un délai global de **cinq (5) ans** à compter du premier paiement mis en attente, à défaut de réclamation valide, les fonds résiduels sont **transférés à l'autorité compétente du pays de résidence de l'Avocat** au titre des règles applicables aux fonds en déshérence (par exemple, en France, à la Caisse des dépôts au titre de la loi Eckert ; aux États-Unis, au programme d'unclaimed property de l'État compétent ; au Royaume-Uni, au Dormant Assets Scheme ; et de manière générale au mécanisme local équivalent). **SOS Expat ne s'approprie en aucun cas ces fonds résiduels.**

8.7. **Réclamation pendant la conservation prolongée.** L'Avocat peut, à tout moment durant la phase de conservation prolongée (b), adresser une demande de réclamation motivée à SOS Expat via le formulaire de contact, accompagnée d'une **vérification KYC complète** (le KYC étant une condition technique imposée par le Prestataire de paiement et par les obligations LCB-FT). SOS Expat examine la demande sous **trente (30) jours**. En cas d'acceptation, les fonds sont reversés sous déduction des seuls frais de gestion mentionnés au (a). En cas de force majeure dûment justifiée ou d'incapacité médicale documentée, ces frais peuvent être réduits ou supprimés à la discrétion raisonnable de SOS Expat.

8.8. **Acceptation expresse.** En s'inscrivant sur la Plateforme, l'Avocat déclare avoir pris connaissance des modalités du présent article 8 et les accepte expressément. Cette acceptation est une condition essentielle d'accès au statut de prestataire.

---

## 9. Données personnelles (cadre global – GDPR/DSA)

9.1. **Rôles.** Pour les données des Utilisateurs reçues aux fins de Mise en relation, SOS Expat et l'Avocat agissent chacun en responsable de traitement pour leurs finalités respectives, conformément au **Règlement (UE) 2016/679 (GDPR)**.

9.2. **Bases & finalités.** Exécution du contrat (Mise en relation), intérêts légitimes (sécurité, prévention de la fraude, amélioration), conformité légale (LCB-FT, sanctions), et, le cas échéant, consentement.

9.3. **Transferts internationaux** avec garanties appropriées lorsque requis (clauses contractuelles types, décision d'adéquation, etc.).

9.4. **Droits & contact.** Exercice des droits (accès, rectification, effacement, portabilité, opposition) via le formulaire de contact de la Plateforme.

9.5. **Sécurité.** Mesures techniques/organisationnelles raisonnables ; notification des violations selon les lois applicables (72 heures conformément au GDPR).

9.6. L'Avocat traite les données reçues conformément au droit du Pays d'Intervention et à sa déontologie (secret professionnel).

9.7. **Conformité DSA.** La Plateforme opère en tant que **service intermédiaire** au sens du **Règlement (UE) 2022/2065 (Digital Services Act)**. SOS Expat met en place des mécanismes de signalement de contenus illicites et coopère avec les autorités compétentes conformément au DSA.

---

## 10. Propriété intellectuelle

La Plateforme, ses marques, logos, bases de données et contenus sont protégés. Aucun droit n'est cédé à l'Avocat, hormis un droit personnel, non exclusif, non transférable d'accès pendant la durée des CGU. Les contenus fournis par l'Avocat (profil, photo, descriptifs) font l'objet d'une licence mondiale, non exclusive en faveur d'SOS Expat pour l'hébergement et l'affichage dans la Plateforme.

---

## 11. Garanties, responsabilité et indemnisation

11.1. Aucune garantie quant aux services juridiques ; SOS Expat n'assure ni l'issue, ni la qualité, ni le volume d'affaires.

11.2. Plateforme « en l'état » ; aucune garantie d'accessibilité continue.

11.3. **Limitation de responsabilité** : dans la mesure permise, la responsabilité totale d'SOS Expat envers l'Avocat est limitée aux dommages directs et ne peut excéder le total des Frais de Mise en relation perçus par SOS Expat au titre de la transaction à l'origine de la réclamation.

11.4. **Exclusions** : aucun dommage indirect/consécutif/spécial/punitif (perte de profits, clientèle, réputation, etc.).

11.5. **Indemnisation** : l'Avocat indemnise et garantit SOS Expat (et ses affiliés, dirigeants, employés, agents) contre toute réclamation/préjudice/frais (dont honoraires d'avocat) liés à (i) ses manquements aux CGU/lois, (ii) ses contenus, (iii) ses conseils/omissions.

11.6. **Renonciation aux recours.** L'Avocat **renonce expressément et irrévocablement** à tout recours contre SOS Expat au titre (i) des dommages résultant de la prestation de services juridiques, (ii) des pertes indirectes, (iii) des litiges contractuels avec les Utilisateurs, (iv) de toute défaillance des services fournis par l'Avocat. Cette renonciation s'applique dans la mesure maximale permise par la loi.

11.7. Aucune représentation : rien n'emporte mandat, emploi, partenariat ou coentreprise entre SOS Expat et l'Avocat.

11.8. **Force majeure.** SOS Expat n'est pas responsable des retards ou défaillances causés par des événements de **force majeure** (catastrophe naturelle, guerre, pandémie, cyberattaque, panne électrique ou internet, décision gouvernementale, grève, etc.).

11.9. **Survie des clauses.** Les articles suivants survivent à la résiliation ou à l'expiration des CGU, quelle qu'en soit la cause : articles 2 (preuves d'acceptation), 3.5 (déclarations), 5 (règles d'usage), 7 (frais et paiements), 8 (KYC et sanctions), 9 (données personnelles), 10 (propriété intellectuelle), 11 (responsabilité et indemnisation), 12 (droit applicable et arbitrage), 13 (clauses de protection) et 14 (divers). Ces clauses demeurent en vigueur aussi longtemps que nécessaire pour produire leurs effets.

---

## 12. Droit applicable – Arbitrage – Juridiction estonienne – Actions collectives

12.1. **Droit applicable et primauté de la déontologie locale.** Les présentes CGU, leur interprétation, leur validité et leur exécution sont régies exclusivement par le **droit estonien**, à l'exclusion de ses règles de conflit de lois. **Pour éviter toute ambiguïté**, les règles déontologiques de la profession d'avocat applicables dans le Pays d'Intervention et/ou le pays d'inscription au barreau de l'Avocat (notamment en matière de secret professionnel, d'interdiction de partage d'honoraires avec un non-avocat, d'encadrement de la publicité et du démarchage, de conflits d'intérêts, et de gestion des fonds clients) sont **réputées d'ordre public** et **priment** sur toute stipulation contraire ou ambiguë des présentes CGU. Aucune clause des CGU ne saurait être interprétée comme imposant ou autorisant l'Avocat à adopter un comportement contraire à sa déontologie locale ; en cas de conflit, l'Avocat s'abstient et en informe SOS Expat sans délai.

12.2. **Arbitrage international obligatoire.** Tout litige, différend ou réclamation découlant des présentes CGU ou s'y rapportant, y compris leur validité, interprétation, exécution ou résiliation, sera tranché définitivement par **arbitrage** conformément au Règlement d'Arbitrage de la **Chambre de Commerce Internationale (CCI)**.
- **Siège de l'arbitrage** : Tallinn, Estonie ;
- **Langue de l'arbitrage** : **anglais** ;
- **Nombre d'arbitres** : un (1) arbitre unique, sauf si le montant en litige excède 100 000 €, auquel cas trois (3) arbitres ;
- **Droit applicable au fond** : droit estonien (art. 12.1) ;
- **Procédure** : confidentielle. Les parties s'engagent à ne pas divulguer l'existence, le contenu ou l'issue de l'arbitrage, sauf obligation légale ou pour l'exécution de la sentence.
La sentence arbitrale est **définitive et obligatoire** pour les parties. Les parties renoncent à tout recours en annulation dans la mesure permise par la loi.

12.3. **Renonciation aux actions collectives et au jury.** Dans la mesure maximale permise par la loi applicable :
- (a) L'Avocat renonce à participer à toute **action collective, action de groupe ou action représentative** contre SOS Expat ;
- (b) Tout litige sera résolu sur une **base individuelle uniquement** ;
- (c) L'Avocat renonce expressément à tout **droit à un procès devant jury** (jury trial waiver) ;
- (d) L'Avocat renonce à toute action en **class action, consolidated action ou representative action** selon le droit américain ou tout droit équivalent.

12.4. **Compétence exclusive des tribunaux estoniens.** Pour toute demande non arbitrable selon la loi applicable, pour les mesures provisoires ou conservatoires urgentes avant constitution du tribunal arbitral, et pour l'exécution des sentences arbitrales, les **tribunaux de Tallinn (Estonie)** ont **compétence exclusive**. L'Avocat :
- (a) Consent irrévocablement à cette juridiction ;
- (b) Renonce à toute objection de **forum non conveniens** ;
- (c) Renonce à toute objection fondée sur l'absence de compétence personnelle ;
- (d) Accepte que toute signification puisse être faite à l'adresse email enregistrée sur la Plateforme.

12.5. **Médiation préalable obligatoire et médiateurs identifiés (Règlement P2B).** Avant tout arbitrage, les parties s'engagent à tenter de résoudre le litige à l'amiable par **négociation de bonne foi** pendant un délai de **trente (30) jours** à compter de la notification écrite du différend, envoyée par email avec accusé de réception à l'adresse de contact de l'autre partie. Conformément à l'article 12 du Règlement (UE) 2019/1150, SOS Expat identifie au moins **deux (2) médiateurs spécialisés**, indépendants et raisonnablement accessibles, parmi lesquels l'Avocat peut choisir : **(i) le Centre de Médiation et d'Arbitrage de Paris (CMAP) — cmap.fr** ; et **(ii) le WIPO Arbitration and Mediation Center (Genève) — wipo.int/amc**. SOS Expat supporte une **part raisonnable des frais de médiation**, appréciée de bonne foi au cas par cas, en particulier lorsque le litige est de faible montant. L'échec de la médiation est une condition préalable à l'introduction d'une demande d'arbitrage.

12.6. **Prescription.** Toute action ou réclamation de l'Avocat contre SOS Expat doit être introduite dans le **délai le plus court entre trois (3) ans** à compter de la survenance du fait générateur **et le délai légal applicable** dans la juridiction de l'Avocat, sous peine de forclusion. La présente clause n'a ni pour objet ni pour effet de réduire en deçà du minimum impératif les délais de prescription qui seraient inopposables à toute réduction conventionnelle dans la juridiction concernée ; en pareil cas, le délai légal local s'applique.

---

## 13. Clauses de protection internationale

13.1. **Anti-corruption.** L'Avocat s'engage à ne pas offrir, promettre ou verser de pots-de-vin ou avantages indus à des agents publics ou privés. Il respecte les lois anti-corruption applicables (FCPA, UK Bribery Act, loi Sapin II, etc.).

13.2. **Confidentialité des échanges.** Les échanges réalisés via la Plateforme (messages, appels téléphoniques) sont **confidentiels**. L'Avocat s'interdit de les enregistrer, divulguer ou utiliser à d'autres fins que la prestation convenue, sauf autorisation écrite ou obligation légale.

13.3. **Non-sollicitation.** Pendant la durée des CGU et **douze (12) mois** après leur résiliation, l'Avocat s'interdit de solliciter directement les Utilisateurs rencontrés via la Plateforme pour éviter les Frais de Mise en relation.

13.4. **Responsabilité exclusive de l'Avocat.** L'Avocat est **seul responsable** de la qualité, de l'exactitude et de la légalité des conseils et services qu'il fournit. L'Avocat est **entièrement responsable** du respect des dispositions légales et réglementaires du pays où il exerce. SOS Expat **ne garantit pas** les conseils juridiques délivrés par l'Avocat et **décline toute responsabilité** pour tout préjudice subi par un Utilisateur du fait des services de l'Avocat.

13.5. **Absence de relation de conseil.** SOS Expat n'est **pas un cabinet d'avocats**, ni un prestataire de services juridiques. La Plateforme se limite à la **mise en relation**. Toute relation de conseil juridique est établie **exclusivement** entre l'Avocat et l'Utilisateur, **hors** de SOS Expat. **Tout dossier** qui serait conclu avec un client se fera **hors de SOS Expat**.

13.6. **Litiges Avocat-Utilisateur.** Tout litige entre un Avocat et un Utilisateur relève **exclusivement** de leur relation directe. SOS Expat **n'intervient pas** dans ces litiges et **ne peut être mis en cause** comme partie, garant ou médiateur. SOS Expat n'est **en aucun cas responsable** des litiges entre Avocat et client.

---

## 14. Divers

14.1. **Cession** : SOS Expat peut céder les CGU à une entité de son groupe ou à un successeur ; l'Avocat ne peut céder sans accord écrit d'SOS Expat.

14.2. **Intégralité** : les CGU constituent l'accord complet et remplacent tout accord antérieur relatif au même objet.

14.3. **Notifications** : par publication sur la Plateforme, notification in-app ou via le formulaire de contact.

14.4. **Interprétation** : les intitulés sont indicatifs. Aucune règle contra proferentem.

14.5. **Langues** : des traductions peuvent être fournies ; l'anglais prévaut pour l'interprétation.

14.6. **Nullité partielle et divisibilité.** Si une stipulation des présentes CGU est déclarée nulle, invalide ou inapplicable par un tribunal ou arbitre compétent :
- (a) Cette nullité n'affecte pas la validité des autres stipulations, qui demeurent en vigueur ;
- (b) La stipulation nulle sera remplacée par une stipulation valide d'effet économique équivalent, dans la mesure du possible ;
- (c) Les parties négocieront de bonne foi pour convenir d'une stipulation de remplacement.

14.7. **Divisibilité géographique.** Si une stipulation des présentes CGU est inapplicable ou illégale dans une juridiction spécifique :
- (a) Cette stipulation ne s'applique pas dans cette juridiction uniquement ;
- (b) Elle demeure pleinement applicable dans toutes les autres juridictions ;
- (c) L'inapplicabilité locale n'affecte pas la validité globale des CGU.

14.8. **Non-renonciation.** L'absence ou le retard dans l'exercice d'un droit par SOS Expat n'emporte pas renonciation à ce droit. Toute renonciation doit être expresse et écrite. Une renonciation ponctuelle ne constitue pas une renonciation générale.

14.9. **Indépendance des clauses.** Chaque clause des présentes CGU est indépendante. L'invalidité d'une clause n'entraîne pas l'invalidité des clauses de limitation de responsabilité, d'indemnisation, d'arbitrage ou de juridiction, qui demeureront applicables dans la mesure maximale permise par la loi.

14.10. **Tiers.** Les présentes CGU ne confèrent aucun droit à des tiers (sauf les affiliés de SOS Expat expressément mentionnés). Aucun tiers ne peut se prévaloir des stipulations des CGU.

---

## 15. Contact

Pour toute question ou demande légale : **https://sos-expat.com/contact**
`;

  const defaultEn = `
# Terms of Use – Lawyers (Global)

**SOS Expat by WorldExpat OÜ** (the "**Platform**", "**SOS**", "**we**")

**Version 3.2 – Last updated: April 26, 2026**

---

## 1. Definitions

**Application / Site / Platform**: digital services operated by **WorldExpat OÜ** (Estonian company, registry no. 16885621, registered office: Tallinn, Estonia) enabling the connection between users (the "**Users**") and legal professionals (the "**Lawyers**").

**Lawyer**: any legal professional duly authorized to practice in at least one jurisdiction, regardless of their local title: avocat (France, Belgium, Switzerland), lawyer/attorney/counsel (USA, UK, Commonwealth), solicitor/barrister (UK, Ireland, Australia), abogado (Spain, Latin America), Rechtsanwalt (Germany, Austria, Switzerland), advogado (Portugal, Brazil), avvocato (Italy), advocaat (Netherlands, Belgium), адвокат/юрист (Russia, CIS), 弁護士 (Japan), 律师 (China), or any other equivalent title recognized by the professional bar or competent authority in their jurisdiction of practice.

**Connection**: the technical/operational introduction made by the Platform between a User and a Lawyer, represented by (i) the transmission of contact details, (ii) opening a communication channel (call, message, video), or (iii) the Lawyer accepting a request submitted via the Platform.

**Country of Intervention**: the jurisdiction primarily targeted by the Request at the time of the Connection. Failing that, the country of residence of the User at the time of the request; in case of multiple jurisdictions, the one most closely related to the subject of the Request.

**Connection Fee**: remuneration **owed by the User to SOS Expat** for each Connection (art. 7), as compensation for the technical connection service provided by the Platform. The Connection Fee in no event constitutes a commission, kickback, or share of the Lawyer's professional fees. Its amount is defined in the **current fee schedule**, accessible in the personal dashboard of the Lawyer and the User. SOS Expat may modify the schedule under the conditions of article 2.5.

**Request**: the legal situation/project presented by the User.

**Payment Provider(s)**: third-party services used to collect the User's single payment and distribute funds.

**B2B Partner**: any legal entity (company, association, mutual fund, works council, firm, professional organization, etc.) having entered into a separate framework agreement with SOS Expat under which it finances, in whole or in part, the Connection Fees for its members, employees, or beneficiaries (the "**B2B Users**"). A **B2B Connection** is a Connection initiated by a B2B User under such a framework agreement. By contrast, a **B2C Connection** is initiated by a User who pays the Connection Fees directly.

**Sanctions Lists**: lists of persons, entities, or countries subject to economic sanctions or embargoes, including those of OFAC (United States), the European Union, the United Nations, His Majesty's Treasury (HMT), and any other competent authority.

---

## 2. Purpose, Scope, and Acceptance

2.1. These Terms govern access to and use of the Platform by Lawyers.

2.2. SOS Expat acts solely as a technical intermediary for connections. SOS Expat does not practice law, provide legal advice, or participate in the Lawyer–User relationship.

2.3. **Electronic Acceptance (click-wrap) and Traceability.** The Lawyer accepts the Terms by checking the dedicated box during registration and/or by using the Platform. This constitutes an electronic signature and contractual consent in accordance with Regulation (EU) No. 910/2014 (eIDAS). SOS Expat maintains **timestamped audit logs** including: (i) the exact date and time (UTC) of acceptance, (ii) the Lawyer's IP address, (iii) the unique session identifier, (iv) the browser user-agent, (v) the version of the Terms accepted, (vi) the cryptographic hash of the accepted document, and (vii) the Lawyer's unique identifier. These logs constitute **legally enforceable proof** of acceptance of the Terms.

2.4. **Retention of Acceptance Evidence.** In accordance with GDPR and legal retention obligations, SOS Expat retains proof of acceptance of the Terms for a period of **ten (10) years** from the date of acceptance, or until the conclusion of any ongoing litigation as applicable. The Lawyer may, upon written request via the contact form, obtain an **acceptance certificate** containing the aforementioned evidence. This retention is based on SOS Expat's legitimate interest in having evidence in case of dispute (Art. 6.1.f GDPR) and the legal obligation to retain commercial contracts.

2.5. **Changes (P2B notice period).** SOS Expat may update the Terms and/or fee schedules at any time, subject to a **minimum notice period of fifteen (15) days** notified to the Lawyer on a durable medium (email to the registered address and publication in the personal dashboard), in accordance with article 3 of Regulation (EU) 2019/1150 ("P2B"). The notice period may be reduced or waived: (i) when the modification is required by law or by a decision of a competent authority; (ii) for compelling security or fraud prevention reasons; or (iii) for material or typographical corrections without economic impact. During the notice period, the Lawyer may **terminate the relationship without penalty**. Failing termination, continued use of the Platform after the notice period constitutes acceptance. In case of substantial modification, the Lawyer will be invited to expressly reconfirm acceptance, tracked again in accordance with article 2.3.

2.6. Duration: indefinite.

---

## 3. Lawyer Status – Independence, Compliance, and Declarations

3.1. The Lawyer acts as an independent professional; no employment, mandate, agency, partnership, or joint venture is created with SOS Expat.

3.2. The Lawyer is solely responsible for: (i) their degrees, titles, bar/equivalent registrations, and practice authorizations; (ii) their professional liability insurance valid and appropriate for the Countries of Intervention; (iii) compliance with local laws and professional rules (ethics, advertising/solicitation, conflicts of interest, professional secrecy, AML/KYC, taxation, consumer protection, etc.).

3.3. SOS Expat does not supervise or evaluate the content or quality of the Lawyer's advice and assumes no responsibility in this regard.

3.4. **Professional capacity (B2B).** The Lawyer declares acting exclusively for professional purposes. Consumer protection regimes do not apply to the SOS Expat–Lawyer relationship.

3.5. **Lawyer Declarations and Warranties.** By registering on the Platform, the Lawyer expressly declares and warrants that:
- (a) They are of **legal age** under the law of their country of residence and/or practice;
- (b) They have **full legal capacity** to contract and practice their profession;
- (c) They are not placed under guardianship, curatorship, judicial protection, or any equivalent protective regime;
- (d) They are not subject to any **prohibition from practicing** their profession, whether temporary or permanent;
- (e) They have not been disbarred, suspended, or excluded from their bar or professional body;
- (f) They are not subject to any **ongoing disciplinary proceedings** that could result in suspension or disbarment (or undertake to immediately inform SOS Expat if applicable);
- (g) They do not appear on **any Sanctions List** (OFAC, EU, UN, HMT, or other);
- (h) They have not been **criminally convicted** for offenses incompatible with the practice of their profession;
- (i) All information provided during registration is **accurate, complete, and up to date**;
- (j) They undertake to **immediately inform** SOS Expat of any change affecting these declarations;
- (k) They have the **effective right to practice law** in each of the countries they have selected as "countries of intervention" during registration or subsequently on their profile. The Lawyer undertakes to select only jurisdictions in which they are **legally authorized** to provide legal advice or represent clients, whether by virtue of their local registration, mutual recognition agreements, international conventions, or any other legal mechanism. Any selection of a country of intervention in which the Lawyer is not authorized to practice constitutes a **serious violation** of these Terms.
Any false declaration constitutes a serious violation of the Terms that may result in immediate and permanent banning, without prejudice to any action for damages.

---

## 4. Account Creation, Verification, and Security

4.1. Requirements: valid right to practice in at least one jurisdiction, proof of identity and qualifications, valid professional liability insurance.

4.2. Process: account creation, document submission, manual validation which may include a video interview and KYC/AML checks via Providers.

4.3. Accuracy & Updates: the Lawyer guarantees the accuracy and currency of information; one (1) account per Lawyer.

4.4. Security: the Lawyer protects their credentials; any activity via the account is deemed performed by them; immediate reporting of any compromise.

4.5. **Additional Verification at Any Time.** SOS Expat reserves the right to request from the Lawyer, **at any time and without having to justify the request**, the provision or update of any document attesting to their right to practice, their bar or equivalent registration, their professional liability insurance, their identity, or any other relevant supporting document. The Lawyer undertakes to respond to such requests within **seven (7) business days**. Failure to respond or provision of non-compliant documents may result in immediate suspension of the account.

4.6. **Moderation and Quality Control.** SOS Expat implements a moderation policy aimed at ensuring the quality and compliance of services offered on the Platform. This moderation may include: (i) verification of profiles and published content, (ii) analysis of User reviews and complaints, (iii) monitoring compliance with the Terms and applicable laws, (iv) any other reasonable quality control measure. The Lawyer agrees to submit to this moderation.

4.7. **Temporary Account Suspension.** SOS Expat may **immediately suspend without notice** the Lawyer's account in the following cases:
- (a) Suspicion of fraud, identity theft, or false declaration;
- (b) Multiple or serious complaints from Users;
- (c) Failure to provide documents requested under article 4.5;
- (d) Proven or suspected violation of the Terms or applicable laws;
- (e) Conduct harmful to the image or reputation of the Platform;
- (f) Order from a judicial, administrative, or bar authority;
- (g) Any other legitimate reason assessed at SOS Expat's sole discretion.
During suspension, the Lawyer can no longer access their account or receive new Connections. Pending payments may be withheld until clarification of the situation.

4.8. **Permanent Banning (Termination for Cause).** SOS Expat may **permanently terminate without notice** the Lawyer's account ("banning") in the following cases:
- (a) Serious or repeated violation of the Terms;
- (b) Proven fraud, intentional false declaration, or identity/title theft;
- (c) Loss of right to practice (disbarment, bar suspension, non-renewal of registration);
- (d) Criminal conviction incompatible with the practice of the profession;
- (e) Conduct seriously prejudicial to Users or the Platform;
- (f) Recurrence after a temporary suspension;
- (g) Proven circumvention of the Platform to avoid Connection Fees;
- (h) Non-compliance with KYC verification obligations despite reminders;
- (i) Any other serious reason assessed at SOS Expat's sole discretion.
Banning is **permanent and irrevocable**. A banned Lawyer cannot create a new account. Pending funds may be withheld as liquidated damages, without prejudice to any other action for damages.

4.9. **Procedure and Notification.** In case of suspension or banning, SOS Expat notifies the Lawyer by email to the registered address. This notification indicates the reason for the measure (unless legally required to maintain confidentiality). The Lawyer has **fifteen (15) days** to submit written observations via the contact form. SOS Expat reviews these observations but is not required to lift the measure. SOS Expat's decision is **discretionary and final**.

4.10. **Effects of Suspension or Banning.** In case of suspension or banning:
- (a) Account access is immediately blocked;
- (b) The Lawyer's profile is removed from search results;
- (c) Ongoing Connections may be cancelled;
- (d) Pending payments may be withheld or offset against any amount owed to SOS Expat;
- (e) The Lawyer remains bound by their obligations (confidentiality, non-solicitation, etc.) in accordance with survival clauses.

4.11. **Inactivity.** In case of **inactivity exceeding 365 days**, the account may be automatically deactivated after notification. The Lawyer may reactivate their account upon request, subject to providing the required verification documents.

4.12. **Voluntary Termination.** The Lawyer may close their account at any time after fulfilling their outstanding obligations (accepted services, potential refunds). The closure request is made via the contact form. SOS Expat processes the closure within **thirty (30) days**.

4.13. **Electronic Communications.** The Lawyer consents to receive any notifications related to the Terms, moderation, and suspension/banning measures by electronic means (email, in-app notification, publication on the Platform). The Lawyer undertakes to maintain a valid email address and to regularly check their notifications.

4.14. **Internal Complaint-Handling System (P2B Regulation).** In accordance with article 11 of Regulation (EU) 2019/1150, SOS Expat provides the Lawyer with a **free internal complaint-handling system**, accessible via the contact form (https://sos-expat.com/contact). SOS Expat undertakes to: (i) **acknowledge receipt** of any complaint within **seven (7) business days**; (ii) handle the complaint **seriously and without discrimination, within a reasonable time** (as a rule **thirty (30) days**); (iii) communicate the **reasoned outcome** to the Lawyer in clear and understandable language, indicating subsequent remedies (mediation under art. 12.5, arbitration under art. 12.2); (iv) maintain **aggregated statistics** on the operation of this system, made available annually.

---

## 5. Rules of Use – Conflicts, Confidentiality, Non-Circumvention

5.1. **Conflicts of interest.** The Lawyer conducts appropriate screening before any advice. In case of conflict, they withdraw and inform the User.

5.2. **Professional secrecy & confidentiality.** The Lawyer respects confidentiality and professional secrecy in accordance with the applicable law of the Country of Intervention.

**Call recording — general policy:**
- (a) **By default**, SOS Expat **does NOT record the audio content** of calls between Lawyer and User. Only **technical metadata** is retained (timestamp, duration, Twilio identifiers, connection status) for billing, anti-fraud, and technical dispute resolution purposes;
- (b) SOS Expat **does not enable any audio recording without the explicit, prior and separate consent of both the Lawyer AND the User**, expressed before the start of the call by a distinct positive action. No recording may be triggered unilaterally by SOS Expat, except pursuant to a **valid order issued by a competent judicial authority of the country of the Lawyer or the User**, providing the public-policy safeguards required by that jurisdiction (notably as regards the lawyer's professional secrecy);
- (c) Where a recording is exceptionally enabled under (b), it is retained for the duration strictly necessary for its purpose, capped at a maximum of **six (6) months** (unless extended by ongoing judicial proceedings), in accordance with GDPR and the recommendations of local data-protection authorities;
- (d) **The Lawyer is themselves prohibited** from recording, fully transcribing, disclosing, or using the exchanges for any purpose other than the agreed service, except with the User's written authorization or by legal obligation;
- (e) **Professional secrecy remains intact**: any recording by SOS Expat may not be used against the Lawyer or User in violation of the ethical rules applicable to professional secrecy.

5.3. **Non-circumvention.** SOS Expat does not receive any commission on fees. Each new Connection with a new User via the Platform incurs Connection Fees. Circumventing the Platform to avoid these fees for a new introduction is prohibited.

5.4. **Prohibited behavior.** Identity/title impersonation, illegal content, manipulation, collusion/boycotting to harm the Platform, violation of sanctions/export laws, or any illegal activity.

5.5. **Availability.** The Platform is provided "as is"; uninterrupted availability is not guaranteed (maintenance, incidents, force majeure). Access may be restricted if required by law.

---

## 6. Lawyer–User Relationship (off-Platform)

6.1. After the Connection, the Lawyer and User may contract off-Platform (SOS Expat does not intervene in fee setting or collection, except for the single payment mechanism described below).

6.2. The Lawyer issues fee agreements according to local law, collects/remits applicable taxes, and complies with local rules (advertising, solicitation, conflicts of interest, consumer law).

6.3. SOS Expat is not responsible for the quality, accuracy, or outcome of the Lawyer's advice.

---

## 7. Fees, Single Payment, and Taxes

7.1. **Connection Fees (Platform remuneration).** Connection Fees compensate **exclusively the technical connection service** provided by SOS Expat to the **User**. They are **owed by the User**, and **not by the Lawyer**. Their amount is defined in the **current fee schedule** accessible in the Lawyer's personal dashboard, per Connection, excluding taxes and Payment Provider fees. Any modification of the fee schedule is made under the conditions of article 2.5 (minimum fifteen (15) days notice). The Lawyer is encouraged to regularly consult the current fee schedule.

7.2. **Legal characterization of the payment — two separate and independent debts.** The payment made by the User via the Platform is **legally composed of two separate and independent debts**, despite being settled through a single technical collection for operational convenience:
- (a) **"Connection" debt**: amount **owed by the User to SOS Expat** for the technical connection service (Connection Fees, art. 7.1);
- (b) **"Fees" debt**: amount **owed by the User to the Lawyer** for the professional fees of the legal service agreed between them. The fee agreement, the content and the quality of the service are governed **exclusively** by the Lawyer–User relationship, off-Platform (art. 6 and 13.5).

**SOS Expat does not receive, claim or have any right to any commission, kickback, share, percentage or fraction whatsoever of the Lawyer's professional fees — in particular in jurisdictions whose ethical rules prohibit fee-sharing with non-lawyers. The Connection Fees constitute the sole remuneration of SOS Expat and are derived exclusively from the User's debt referred to in (a).**

The Payment Provider, acting in respect of part (b) as **paying agent of the Lawyer**, transfers to the latter the fees collected, after deducting only its own banking processing fees and, where applicable, currency conversion fees (art. 7.3 and 7.4). **The exact net amount the Lawyer will receive is displayed in their dashboard before and after each transaction**, allowing the Lawyer to accept or decline the connection on a fully informed basis.

7.3. **Payment Provider Bank Fees.** The Payment Provider — **Stripe Payments Europe Ltd.** (Ireland, EU, PCI-DSS Level 1 certified) **or PayPal (Europe) S.à r.l. et Cie, S.C.A.** (Luxembourg, EU, PCI-DSS certified), depending on the country of residence and availability — charges processing fees on each transaction. **These bank fees are entirely borne by the Lawyer** and are automatically deducted from the amount transferred to them. Details of these fees are available in the Payment Provider's terms (Stripe: stripe.com/pricing; PayPal: paypal.com/webapps/mpp/merchant-fees) and in the Lawyer's dashboard for each transaction.

7.4. **Currency Exchange and Conversion Fees.** When the User's payment currency differs from the Lawyer's bank account currency, **currency conversion fees** are applied by the Payment Provider. **These exchange fees are entirely borne by the Lawyer** and are deducted from the amount transferred to them. The exchange rates applied are those of the Payment Provider at the time of transfer. The Lawyer acknowledges and expressly accepts that SOS Expat has no control over these exchange rates and disclaims any liability for currency fluctuations or fees applied by the Provider.

7.5. **Calculation of Net Amount Transferred to the Lawyer.** The net amount transferred to the Lawyer corresponds to the **"Fees" debt** owed by the User (art. 7.2.b), after deduction **only of**: (i) the Payment Provider's **banking fees** applicable to the "Fees" portion (art. 7.3) and (ii) where applicable, the **currency conversion fees** (art. 7.4). **The Connection Fees (art. 7.2.a) are in no event deducted from the professional fees**: they are collected separately under a distinct debt of the User towards SOS Expat. **The Lawyer is informed of the exact amount they will receive in their dashboard before each service and can thus make an informed decision whether to accept the connection.**

7.6. **Due & Non-refundable.** Connection Fees are due upon effective Connection and are **non-refundable** (except at SOS Expat's discretionary gesture in case of failure solely attributable to the Platform, to the extent permitted by law).

7.7. **User Refunds.** If a refund is granted to the User, it is charged to the Lawyer's share: SOS Expat may withhold/offset the corresponding amount from future payments to the Lawyer, or request direct repayment if no payments are forthcoming. Connection Fees remain acquired by SOS Expat, except by discretionary decision to the contrary.

7.8. **Lawyer Payment Timelines by Channel.** Subject to completion of the KYC process (article 8), the timelines for paying the Lawyer's net remuneration vary by channel:
- (a) **B2C Connections** (direct payment by the User): the Lawyer's remuneration is **released for payment immediately upon completion of the call** by the Payment Provider, subject only to the Provider's technical banking, anti-fraud and capture processing delays (typically one (1) to seven (7) business days depending on the Lawyer's country and account maturity with the Provider);
- (b) **B2B Connections** (payment by the B2B Partner): given the B2B Partner's deferred billing model (monthly invoicing or "net-30"), the Lawyer's remuneration is paid **within thirty (30) days** after the call;
- (c) In all cases, payment may be suspended in case of dispute, User or Partner claim, ongoing KYC/AML verification, or any other circumstance provided in these Terms.

7.9. **Taxes.** The Lawyer remains **solely responsible** for all their tax obligations (income tax, VAT, social contributions, professional charges, etc.) in their jurisdiction of residence and/or practice. Amounts transferred to the Lawyer are **gross amounts**; the Lawyer is responsible for declaring and paying all applicable taxes. SOS Expat collects and remits, where required by law, VAT/local equivalent on Connection Fees only.

7.10. **Offset.** SOS Expat may offset any amount the Lawyer owes (for a User refund, penalty, or other obligation) against any amount owed to the Lawyer.

7.11. **Fee Transparency and History.** The Lawyer may at any time view in their personal dashboard: (i) complete details of each transaction, (ii) the gross amount paid by the User, (iii) Connection Fees collected by SOS Expat ("Connection" debt), (iv) Payment Provider bank fees applicable to the "Fees" portion, (v) exchange fees if applicable, (vi) the net amount transferred or to be transferred, and (vii) the history of all their transactions. This information is retained and accessible throughout the account duration and **five (5) years** after its closure.

7.12. **Automatic Tax Reporting (DAC7 Directive — EU 2021/514).** Lawyers resident in a European Union Member State are informed that SOS Expat, in its capacity as a reporting platform operator, is required to **annually report** to the competent tax authorities (under Directive (EU) 2021/514 known as "DAC7") information relating to active Lawyers resident in the EU, in particular: name, address, taxpayer identification number (TIN), Member State of residence, total consideration received via the Platform and number of Connections, broken down by calendar quarter. The Lawyer undertakes to provide and keep up to date this information in their personal dashboard. Failure to provide or update may result in the suspension of payments until rectification, in accordance with DAC7 provisions.

7.13. **B2B Channel — Connections via a B2B Partner.**

(a) **Scope.** A B2B Connection is initiated by a B2B User who benefits from a framework agreement entered into between SOS Expat and a B2B Partner (art. 1).

(b) **Adaptation of the two debts.** The two-debt mechanism (art. 7.2) applies in B2B as follows:
- the **"Connection" debt** is owed by the **B2B Partner** to SOS Expat (in whole or in part under the framework agreement), so that the **B2B User generally pays nothing**, or pays only a possible co-payment to SOS Expat;
- the **"Fees" debt** remains owed by the **end User** to the **Lawyer**, unless the framework agreement expressly provides for full or partial coverage of the fees by the B2B Partner (in which case the Partner becomes liable for the covered portion towards the Lawyer, via the paying agent mechanism of art. 7.2).
- The Lawyer is in no event released from signing a fee agreement compliant with their local ethical rules (art. 6.2).

(c) **Distinct Lawyer remuneration B2C / B2B — the Lawyer expressly accepts.** The Lawyer **acknowledges and expressly accepts** that **the net remuneration they receive for a B2B Connection may differ**, upwards or downwards, **from that received for a B2C Connection** (e.g., flat fee negotiated with the Partner, guaranteed volume considerations, full or partial coverage of fees by the Partner, or discount granted to the Partner). The **channel of origin (B2C or B2B)** and the **exact amount** the Lawyer will receive are **displayed in their dashboard before each Connection**, allowing the Lawyer to accept or decline freely and on a fully informed basis. **No obligation to accept** is imposed on the Lawyer based on the channel or the proposed rate.

(d) **B2B framework agreement not binding on the Lawyer.** The provisions of the framework agreement entered into between SOS Expat and the B2B Partner are **not binding on the Lawyer**; only these Terms and the information displayed in the Lawyer's dashboard govern the relationship between SOS Expat and the Lawyer in the context of a B2B Connection.

(e) **All other provisions of these Terms apply** to B2B Connections.

(f) **Current schedules as of the date hereof (for information).** As of the date of the latest update of these Terms, the Lawyer's net remuneration schedules are as follows:
- **B2C Connection**: **thirty euros (€30) or thirty US dollars (US$30)** net per Connection accepted and performed, depending on the settlement currency;
- **B2B Connection**: **twenty euros (€20) or twenty US dollars (US$20)** net per Connection accepted and performed, depending on the settlement currency.

These amounts are **indicative** and reflect the schedule in force on the date of the latest update of these Terms. The **current schedule** is permanently accessible in the Lawyer's dashboard before each Connection. Any change is subject to the fifteen (15) day notice period set out in article 7.14.

7.14. **Modification of the Lawyer Remuneration Schedule.** SOS Expat reserves the right to **modify at any time the schedule of net remuneration of the Lawyer**, whether:
- (i) the **B2C schedule** — by modifying the Connection Fees or their structure (which impacts the net amount received by the Lawyer);
- (ii) the **B2B schedule** — by modifying the flat or variable remuneration applicable to B2B Connections;
- (iii) or any other component of the net remuneration (e.g., currencies, volume tiers, seniority tiers).

Any modification is subject to the **minimum fifteen (15) day notice period** provided in article 2.5, notified to the Lawyer on a durable medium (email to the registered address and publication in their personal dashboard). During the notice period, the Lawyer may **terminate the relationship without penalty** or continue to **decline on a case-by-case basis** Connections whose remuneration would no longer suit them, it being recalled that **the Lawyer is never required to accept a Connection**. **Connections already accepted before expiry of the notice remain remunerated at the rate in force on the acceptance date.** Failing termination, continued use of the Platform after the notice period constitutes acceptance of the new schedule.

---

## 8. Payments – KYC/AML – Sanctions

8.1. **Payment Providers.** Payments are processed **exclusively** by **PCI-DSS certified** third-party Providers: **Stripe Payments Europe Ltd.** (Ireland, EU) and/or **PayPal (Europe) S.à r.l. et Cie, S.C.A.** (Luxembourg, EU). The applicable Provider depends on the Lawyer's country of residence/practice (Stripe currently covers 44 countries, PayPal 150+ countries). The Lawyer **expressly agrees** to the terms and KYC/AML processes of the applicable Provider(s). **SOS Expat is NOT a bank, payment institution, or credit institution**; SOS Expat is solely a commercial customer of the aforementioned Payment Providers.

8.2. SOS Expat may defer, withhold, or cancel payments in case of suspected fraud, non-compliance, or legal order.

8.3. **International Sanctions and Embargoes.** The Lawyer declares and warrants:
- (a) Not to appear, directly or indirectly, on any **Sanctions List** (OFAC/SDN, EU, UN, HMT, or any other applicable sanctions list);
- (b) Not to be owned or controlled, directly or indirectly, by any person or entity appearing on a Sanctions List;
- (c) Not to be a resident, national, or located in a **country or territory subject to a comprehensive embargo or full restrictive measures** under the laws and regulations applicable to the Payment Providers, the European Union, the United Nations, OFAC (United States), HMT (United Kingdom) or any other competent authority. The current list of such countries and territories is maintained by the aforementioned authorities and shall prevail; SOS Expat does not maintain or publish its own geopolitical list;
- (d) Not to use the Platform for transactions involving sanctioned persons, entities, or countries;
- (e) To comply with all applicable **export control laws**.
SOS Expat reserves the right to **immediately restrict or block access** to the Platform in any territory subject to sanctions or embargoes, or for any Lawyer suspected of violating these provisions, without notice or compensation. SOS Expat may also be required to **freeze the Lawyer's funds** in case of order from a competent authority.

### Unclaimed Funds and KYC Verification

8.4. **Obligation to complete the verification process (KYC).** To receive payments from services provided through the Platform, the Lawyer agrees to complete the identity verification process (KYC - Know Your Customer) with the applicable Payment Provider (**Stripe** or **PayPal**, depending on the country of residence) as soon as possible following registration. The Lawyer acknowledges that failure to complete KYC verification technically prevents the transfer of funds to their bank account or PayPal account.

8.5. **Holding of pending funds.** When a payment is made by a User for a service provided by a Lawyer who has not completed KYC verification, the funds corresponding to the Lawyer's share (after deduction of the Platform's connection fees) are held in escrow. The Platform commits to:
- Notify the Lawyer by email of the existence of pending funds;
- Send regular reminders (at 7 days, 30 days, 60 days, 90 days, 120 days, and 150 days);
- Provide the Lawyer with all necessary means to complete their KYC verification.

8.6. **Funds in extended hold — management fees and transfer to competent authorities.** If KYC verification is not completed within **one hundred and eighty (180) days** from the first payment placed on hold, and despite the notifications provided in article 8.5:
- (a) **Lump-sum management fees.** SOS Expat may deduct from the funds in hold **reasonable lump-sum management fees, capped at ten percent (10%) of the amount retained**, strictly covering effective administrative costs of custody, contact attempts and accounting processing;
- (b) **Extended custody.** The balance remains held on the Payment Provider's segregated account (or escrowed by SOS Expat where technical conditions so require). The Lawyer may, at any time during this phase, complete KYC and claim the funds;
- (c) **Transfer to competent authorities (escheat / unclaimed property).** Upon expiry of an overall period of **five (5) years** from the first payment placed on hold, in the absence of a valid claim, the residual funds are **transferred to the competent authority of the Lawyer's country of residence** under applicable rules on unclaimed property (for example, in France, to the Caisse des Dépôts under the Eckert Act; in the United States, to the relevant State's unclaimed property program; in the United Kingdom, to the Dormant Assets Scheme; and generally to the equivalent local mechanism). **SOS Expat in no event appropriates these residual funds.**

8.7. **Claim during extended custody.** The Lawyer may, at any time during the extended custody phase (b), submit a substantiated claim to SOS Expat via the contact form, accompanied by **complete KYC verification** (KYC being a technical condition imposed by the Payment Provider and AML/CFT obligations). SOS Expat will review the request within **thirty (30) days**. If accepted, the funds are transferred net of only the management fees referred to in (a). In case of duly justified force majeure or documented medical incapacity, these fees may be reduced or waived at SOS Expat's reasonable discretion.

8.8. **Express acceptance.** By registering on the Platform, the Lawyer declares that they have read the provisions of this article 8 and expressly accept them. This acceptance constitutes an essential condition for access to provider status.

---

## 9. Personal Data (Global Framework – GDPR/DSA)

9.1. **Roles.** For User data received for Connections, SOS Expat and the Lawyer each act as data controllers for their respective purposes, in accordance with **Regulation (EU) 2016/679 (GDPR)**.

9.2. **Bases & purposes.** Contract performance (Connection), legitimate interests (security, fraud prevention, improvement), legal compliance (AML, sanctions), and, if applicable, consent.

9.3. **International transfers** with appropriate safeguards where required (standard contractual clauses, adequacy decisions, etc.).

9.4. **Rights & contact.** Exercise of rights (access, rectification, erasure, portability, objection) via the Platform contact form.

9.5. **Security.** Reasonable technical/organizational measures; breach notification according to applicable laws (72 hours under GDPR).

9.6. The Lawyer processes received data in accordance with the law of the Country of Intervention and professional secrecy.

9.7. **DSA Compliance.** The Platform operates as an **intermediary service** within the meaning of **Regulation (EU) 2022/2065 (Digital Services Act)**. SOS Expat implements mechanisms for reporting illegal content and cooperates with competent authorities in accordance with the DSA.

---

## 10. Intellectual Property

The Platform, its trademarks, logos, databases, and content are protected. No rights are granted to the Lawyer except a personal, non-exclusive, non-transferable right to access during the Terms. Content provided by the Lawyer (profile, photo, descriptions) is licensed globally, non-exclusively, to SOS Expat for hosting and display on the Platform.

---

## 11. Warranties, Liability, and Indemnification

11.1. No guarantee regarding legal services; SOS Expat does not ensure outcome, quality, or volume of business.

11.2. Platform "as is"; no guarantee of continuous availability.

11.3. **Limitation of liability**: to the extent permitted, SOS Expat's total liability to the Lawyer is limited to direct damages and may not exceed the total Connection Fees received by SOS Expat for the transaction giving rise to the claim.

11.4. **Exclusions**: no indirect/consequential/special/punitive damages (loss of profits, clients, reputation, etc.).

11.5. **Indemnification**: the Lawyer indemnifies and holds SOS Expat (and its affiliates, officers, employees, agents) harmless from any claim/damage/costs (including attorney fees) related to (i) breaches of the Terms/laws, (ii) their content, (iii) their advice/omissions.

11.6. **Waiver of recourse.** The Lawyer **expressly and irrevocably waives** any recourse against SOS Expat for (i) damages arising from the provision of legal services, (ii) indirect losses, (iii) contractual disputes with Users, (iv) any failure of services provided by the Lawyer. This waiver applies to the maximum extent permitted by law.

11.7. No representation: nothing creates mandate, employment, partnership, or joint venture between SOS Expat and the Lawyer.

11.8. **Force majeure.** SOS Expat is not liable for delays or failures caused by **force majeure** events (natural disaster, war, pandemic, cyberattack, power or internet outage, government decision, strike, etc.).

11.9. **Survival of Clauses.** The following articles survive termination or expiration of the Terms, regardless of the cause: articles 2 (acceptance evidence), 3.5 (declarations), 5 (rules of use), 7 (fees and payments), 8 (KYC and sanctions), 9 (personal data), 10 (intellectual property), 11 (liability and indemnification), 12 (governing law and arbitration), 13 (protection clauses), and 14 (miscellaneous). These clauses remain in effect as long as necessary to produce their effects.

---

## 12. Governing Law – Arbitration – Estonian Jurisdiction – Class Actions

12.1. **Governing Law and primacy of local ethical rules.** These Terms, their interpretation, validity, and performance are governed exclusively by **Estonian law**, excluding its conflict of law rules. **For the avoidance of doubt**, the ethical rules of the legal profession applicable in the Country of Intervention and/or the country of bar registration of the Lawyer (notably regarding professional secrecy, prohibition of fee-sharing with non-lawyers, regulation of advertising and solicitation, conflicts of interest, and handling of client funds) are deemed to be **mandatory rules of public policy** and **prevail** over any contrary or ambiguous provision of these Terms. No provision of these Terms shall be construed as requiring or permitting the Lawyer to engage in conduct contrary to their local ethical rules; in case of conflict, the Lawyer shall refrain and shall promptly inform SOS Expat.

12.2. **Mandatory International Arbitration.** Any dispute, controversy, or claim arising out of or relating to these Terms, including their validity, interpretation, performance, or termination, shall be finally resolved by **arbitration** in accordance with the Arbitration Rules of the **International Chamber of Commerce (ICC)**.
- **Seat of arbitration**: Tallinn, Estonia;
- **Language of arbitration**: **English**;
- **Number of arbitrators**: one (1) sole arbitrator, unless the amount in dispute exceeds €100,000, in which case three (3) arbitrators;
- **Substantive law**: Estonian law (art. 12.1);
- **Procedure**: confidential. The parties undertake not to disclose the existence, content, or outcome of the arbitration, except as legally required or for enforcement of the award.
The arbitral award is **final and binding** on the parties. The parties waive any action to set aside the award to the extent permitted by law.

12.3. **Waiver of Class Actions and Jury Trial.** To the maximum extent permitted by applicable law:
- (a) The Lawyer waives participation in any **class action, group action, or representative action** against SOS Expat;
- (b) Any dispute shall be resolved on an **individual basis only**;
- (c) The Lawyer expressly waives any **right to a jury trial** (jury trial waiver);
- (d) The Lawyer waives any **class action, consolidated action, or representative action** under U.S. law or any equivalent law.

12.4. **Exclusive Jurisdiction of Estonian Courts.** For any non-arbitrable claims under applicable law, for urgent provisional or conservatory measures before constitution of the arbitral tribunal, and for enforcement of arbitral awards, the **courts of Tallinn (Estonia)** have **exclusive jurisdiction**. The Lawyer:
- (a) Irrevocably consents to this jurisdiction;
- (b) Waives any objection of **forum non conveniens**;
- (c) Waives any objection based on lack of personal jurisdiction;
- (d) Accepts that any service of process may be made to the email address registered on the Platform.

12.5. **Mandatory Pre-Arbitration Mediation and identified mediators (P2B Regulation).** Before any arbitration, the parties agree to attempt to resolve the dispute amicably through **good faith negotiation** for a period of **thirty (30) days** from written notice of the dispute, sent by email with acknowledgment of receipt to the contact address of the other party. In accordance with article 12 of Regulation (EU) 2019/1150, SOS Expat identifies at least **two (2) specialized, independent and reasonably accessible mediators**, from among which the Lawyer may choose: **(i) the Centre de Médiation et d'Arbitrage de Paris (CMAP) — cmap.fr**; and **(ii) the WIPO Arbitration and Mediation Center (Geneva) — wipo.int/amc**. SOS Expat bears a **reasonable share of the mediation costs**, assessed in good faith on a case-by-case basis, in particular where the dispute is of low value. Failure of mediation is a prerequisite for filing an arbitration request.

12.6. **Limitation Period.** Any action or claim by the Lawyer against SOS Expat must be brought within the **shorter of three (3) years** from the occurrence of the triggering event **and the applicable statutory limitation period** in the Lawyer's jurisdiction, failing which it shall be time-barred. This clause is neither intended nor designed to reduce, below the mandatory statutory minimum, any limitation period that would not be subject to contractual reduction in the relevant jurisdiction; in such case the local statutory period applies.

---

## 13. International Protection Clauses

13.1. **Anti-corruption.** The Lawyer agrees not to offer, promise, or pay bribes or undue benefits to public or private officials. The Lawyer complies with applicable anti-corruption laws (FCPA, UK Bribery Act, Sapin II Act, etc.).

13.2. **Confidentiality of Communications.** Communications made through the Platform (messages, phone calls) are **confidential**. The Lawyer shall not record, disclose, or use them for purposes other than the agreed service, except with written authorization or legal obligation.

13.3. **Non-solicitation.** During the term of these Terms and **twelve (12) months** after termination, the Lawyer shall not directly solicit Users met through the Platform to avoid Connection Fees.

13.4. **Exclusive Responsibility of the Lawyer.** The Lawyer is **solely responsible** for the quality, accuracy, and legality of the advice and services provided. The Lawyer is **entirely responsible** for compliance with legal and regulatory provisions of the country where they practice. SOS Expat **does not guarantee** the legal advice delivered by the Lawyer and **disclaims any liability** for any harm suffered by a User due to the Lawyer's services.

13.5. **No Legal Advisory Relationship.** SOS Expat is **not a law firm**, nor a legal services provider. The Platform is limited to **connection services**. Any legal advisory relationship is established **exclusively** between the Lawyer and the User, **outside** of SOS Expat. **Any case** concluded with a client shall be handled **outside of SOS Expat**.

13.6. **Lawyer-User Disputes.** Any dispute between a Lawyer and a User falls **exclusively** within their direct relationship. SOS Expat **does not intervene** in such disputes and **cannot be held liable** as a party, guarantor, or mediator. SOS Expat is **in no way responsible** for disputes between Lawyer and client.

---

## 14. Miscellaneous

14.1. **Assignment**: SOS Expat may assign the Terms to a group entity or successor; the Lawyer may not assign without SOS Expat's written consent.

14.2. **Entire Agreement**: the Terms constitute the complete agreement and replace any prior agreement regarding the same subject.

14.3. **Notices**: by publication on the Platform, in-app notification, or via the contact form.

14.4. **Interpretation**: headings are indicative. No contra proferentem rule.

14.5. **Languages**: translations may be provided; English prevails for interpretation.

14.6. **Partial Invalidity and Severability.** If any provision of these Terms is declared null, invalid, or unenforceable by a competent court or arbitrator:
- (a) Such invalidity does not affect the validity of the other provisions, which remain in force;
- (b) The invalid provision shall be replaced by a valid provision of equivalent economic effect, to the extent possible;
- (c) The parties shall negotiate in good faith to agree on a replacement provision.

14.7. **Geographic Severability.** If any provision of these Terms is unenforceable or illegal in a specific jurisdiction:
- (a) Such provision does not apply in that jurisdiction only;
- (b) It remains fully applicable in all other jurisdictions;
- (c) Local unenforceability does not affect the global validity of the Terms.

14.8. **Non-waiver.** Failure or delay in exercising a right by SOS Expat does not constitute a waiver of that right. Any waiver must be express and in writing. A one-time waiver does not constitute a general waiver.

14.9. **Independence of Clauses.** Each clause of these Terms is independent. The invalidity of one clause does not invalidate the limitation of liability, indemnification, arbitration, or jurisdiction clauses, which shall remain applicable to the maximum extent permitted by law.

14.10. **Third Parties.** These Terms do not confer any rights on third parties (except SOS Expat affiliates expressly mentioned). No third party may rely on the provisions of the Terms.

---

## 15. Contact

For any legal question or request: **https://sos-expat.com/contact**
`;

  const defaultEs = `
# Condiciones Generales de Uso – Abogados (Global)

**SOS Expat de WorldExpat OÜ** (la « **Plataforma** », « **SOS** », « **nosotros** »)

**Versión 3.2 – Última actualización: 26 de abril de 2026**

---

## 1. Definiciones

**Aplicación / Sitio / Plataforma**: servicios digitales operados por **WorldExpat OÜ** (sociedad de derecho estonio, registro n.º 16885621, sede social: Tallin, Estonia) que permiten la conexión entre usuarios (los « **Usuarios** ») y profesionales del derecho (los « **Abogados** »).

**Abogado**: cualquier profesional del derecho debidamente autorizado para ejercer en al menos una jurisdicción, independientemente de su título local: avocat (Francia, Bélgica, Suiza), lawyer/attorney/counsel (EE. UU., Reino Unido, Commonwealth), solicitor/barrister (Reino Unido, Irlanda, Australia), abogado (España, América Latina), Rechtsanwalt (Alemania, Austria, Suiza), advogado (Portugal, Brasil), avvocato (Italia), advocaat (Países Bajos, Bélgica), адвокат/юрист (Rusia, CEI), 弁護士 (Japón), 律师 (China), o cualquier otro título equivalente reconocido por el colegio profesional o la autoridad competente de su jurisdicción de ejercicio.

**Conexión**: la introducción técnica/operativa realizada por la Plataforma entre un Usuario y un Abogado, materializada mediante (i) la transmisión de datos de contacto, (ii) la apertura de un canal de comunicación (llamada, mensaje, videoconferencia), o (iii) la aceptación por parte del Abogado de una solicitud realizada a través de la Plataforma.

**País de Intervención**: la jurisdicción principal a la que se dirige la Solicitud en el momento de la Conexión. En su defecto, el país de residencia del Usuario en el momento de la solicitud; en caso de pluralidad, la jurisdicción más estrechamente vinculada al objeto de la Solicitud.

**Tarifa de Conexión**: remuneración **debida por el Usuario a SOS Expat** por cada Conexión (art. 7), en concepto del único servicio técnico de puesta en contacto prestado por la Plataforma. Esta tarifa no constituye en ningún caso una comisión, retrocesión ni reparto de los honorarios del Abogado. Su importe se establece en el **baremo en vigor**, consultable en el espacio personal del Abogado y del Usuario. SOS Expat puede modificar dicho baremo en las condiciones previstas en el artículo 2.5.

**Solicitud**: la situación/proyecto legal presentado por el Usuario.

**Proveedor(es) de pago**: servicios de terceros utilizados para recibir el pago único del Usuario y distribuir los fondos.

**Socio B2B**: cualquier persona jurídica (empresa, asociación, mutualidad, comité de empresa, despacho, organización profesional, etc.) que haya celebrado con SOS Expat un contrato marco distinto que prevea que esta financia, en todo o en parte, las Tarifas de Conexión para sus miembros, empleados o beneficiarios (los « **Usuarios B2B** »). Una **Conexión B2B** es una Conexión iniciada por un Usuario B2B en virtud de dicho contrato marco. Por oposición, una **Conexión B2C** se inicia por un Usuario que paga directamente las Tarifas de Conexión.

**Listas de sanciones**: listas de personas, entidades o países sujetos a sanciones económicas o embargos, incluyendo las de OFAC (Estados Unidos), la Unión Europea, las Naciones Unidas, el Tesoro de Su Majestad (HMT) y cualquier otra autoridad competente.

---

## 2. Objeto, alcance y aceptación

2.1. Estas CGU regulan el acceso y uso de la Plataforma por parte de los Abogados.

2.2. SOS Expat actúa únicamente como intermediario técnico de conexión. SOS Expat no ejerce la profesión de abogado, no ofrece asesoramiento legal y no es parte de la relación Abogado-Usuario.

2.3. **Aceptación electrónica (click-wrap) y trazabilidad.** El Abogado acepta las CGU marcando la casilla correspondiente durante el registro y/o utilizando la Plataforma. Este acto equivale a firma electrónica y consentimiento contractual de conformidad con el Reglamento eIDAS (UE) n.º 910/2014. SOS Expat conserva **registros de auditoría con marca temporal** que incluyen: (i) la fecha y hora exactas (UTC) de la aceptación, (ii) la dirección IP del Abogado, (iii) el identificador único de sesión, (iv) el user-agent del navegador, (v) la versión de las CGU aceptadas, (vi) el hash criptográfico del documento aceptado, y (vii) el identificador único del Abogado. Estos registros constituyen **prueba legal oponible** de la aceptación de las CGU.

2.4. **Conservación de las pruebas de aceptación.** De conformidad con el RGPD y las obligaciones legales de conservación, SOS Expat conserva las pruebas de aceptación de las CGU durante un período de **diez (10) años** a partir de la fecha de aceptación, o hasta la finalización de cualquier litigio en curso, según corresponda. El Abogado puede, previa solicitud escrita a través del formulario de contacto, obtener un **certificado de aceptación** que contenga los elementos probatorios mencionados. Esta conservación se fundamenta en el interés legítimo de SOS Expat de disponer de pruebas en caso de litigio (art. 6.1.f RGPD) y en la obligación legal de conservación de contratos comerciales.

2.5. **Modificaciones (preaviso P2B).** SOS Expat puede actualizar las CGU y/o el baremo de tarifas en cualquier momento, con sujeción a un **preaviso mínimo de quince (15) días** notificado al Abogado en soporte duradero (correo electrónico a la dirección registrada y publicación en el espacio personal), de conformidad con el artículo 3 del Reglamento (UE) 2019/1150 (« P2B »). El plazo de preaviso podrá reducirse o suprimirse: (i) cuando la modificación venga impuesta por la ley o por una decisión de autoridad competente; (ii) por razones imperiosas de seguridad o de prevención del fraude; o (iii) para correcciones materiales o tipográficas sin incidencia económica. Durante el período de preaviso, el Abogado podrá **resolver sin penalización** su relación con la Plataforma. A falta de resolución, el uso continuado de la Plataforma una vez expirado el preaviso equivaldrá a aceptación. En caso de modificación sustancial, se invitará al Abogado a reconfirmar expresamente su aceptación, la cual será trazada según las modalidades del artículo 2.3.

2.6. Duración: indefinida.

---

## 3. Estatus del Abogado – Independencia, cumplimiento y declaraciones

3.1. El Abogado actúa como profesional independiente; no se crea ninguna relación laboral, mandato, agencia, asociación o joint venture con SOS Expat.

3.2. El Abogado es el único responsable de: (i) sus títulos, inscripciones en colegios de abogados/equivalentes y autorizaciones para ejercer; (ii) su seguro de responsabilidad civil profesional vigente y adecuado para los Países de Intervención; (iii) cumplir con las leyes y normas profesionales locales (ética, publicidad/contacto, conflictos de interés, secreto profesional, AML/KYC, fiscalidad, protección del consumidor, etc.).

3.3. SOS Expat no supervisa ni evalúa el contenido o la calidad del asesoramiento del Abogado y no asume ninguna responsabilidad al respecto.

3.4. **Capacidad profesional (B2B).** El Abogado declara actuar exclusivamente con fines profesionales. Las protecciones de consumidores no se aplican a la relación SOS Expat–Abogado.

3.5. **Declaraciones y garantías del Abogado.** Al registrarse en la Plataforma, el Abogado declara y garantiza expresamente que:
- (a) Es **mayor de edad** según la legislación de su país de residencia y/o ejercicio profesional;
- (b) Posee **plena capacidad jurídica** para contratar y ejercer su profesión;
- (c) No se encuentra bajo tutela, curatela, protección judicial o cualquier régimen equivalente de protección;
- (d) No está sujeto a ninguna **prohibición de ejercicio** de su profesión, temporal o definitiva;
- (e) No ha sido expulsado, suspendido ni excluido de su colegio de abogados u organismo profesional;
- (f) No es objeto de ningún **procedimiento disciplinario en curso** que pueda resultar en suspensión o expulsión (o se compromete a informar inmediatamente a SOS Expat en caso de que así fuera);
- (g) No figura en ninguna **Lista de sanciones** (OFAC, UE, ONU, HMT u otra);
- (h) No ha sido **condenado penalmente** por hechos incompatibles con el ejercicio de su profesión;
- (i) Toda la información proporcionada durante el registro es **exacta, completa y actualizada**;
- (j) Se compromete a **informar inmediatamente** a SOS Expat de cualquier cambio que afecte a estas declaraciones;
- (k) Dispone del **derecho efectivo a ejercer la abogacía** en cada uno de los países que ha seleccionado como "países de intervención" durante su registro o posteriormente en su perfil. El Abogado se compromete a seleccionar únicamente jurisdicciones en las que esté **legalmente autorizado** para prestar asesoramiento jurídico o representar clientes, ya sea en virtud de su inscripción local, acuerdos de reconocimiento mutuo, convenios internacionales o cualquier otro mecanismo legal. La selección de un país de intervención en el que el Abogado no esté habilitado para ejercer constituye una **violación grave** de las presentes CGU.
Cualquier declaración falsa constituye una violación grave de las CGU que puede dar lugar a un bloqueo inmediato y definitivo, sin perjuicio de cualquier acción de reparación.

---

## 4. Creación de cuenta, verificaciones y seguridad

4.1. Condiciones: derecho válido a ejercer en al menos una jurisdicción, comprobantes de identidad y calificaciones, seguro de responsabilidad civil vigente.

4.2. Proceso: creación de cuenta, envío de documentos, validación manual que puede incluir entrevista por videoconferencia y controles KYC/AML mediante Proveedores.

4.3. Exactitud y actualización: el Abogado garantiza la exactitud y actualidad de la información; una (1) cuenta por Abogado.

4.4. Seguridad: el Abogado protege sus credenciales; cualquier actividad realizada a través de la cuenta se considera hecha por él; notificación inmediata de cualquier compromiso.

4.5. **Verificaciones adicionales en cualquier momento.** SOS Expat se reserva el derecho de solicitar al Abogado, **en cualquier momento y sin necesidad de justificación**, la aportación o actualización de cualquier documento que acredite su derecho a ejercer, su inscripción colegial o equivalente, su seguro de responsabilidad civil profesional, su identidad o cualquier otro justificante pertinente. El Abogado se compromete a responder a dichas solicitudes en un plazo de **siete (7) días hábiles**. La falta de respuesta o la aportación de documentos no conformes puede dar lugar a la suspensión inmediata de la cuenta.

4.6. **Moderación y control de calidad.** SOS Expat implementa una política de moderación destinada a garantizar la calidad y conformidad de los servicios ofrecidos en la Plataforma. Esta moderación puede incluir: (i) la verificación de perfiles y contenidos publicados, (ii) el análisis de valoraciones y reclamaciones de los Usuarios, (iii) el control del cumplimiento de las CGU y las leyes aplicables, (iv) cualquier otra medida razonable de control de calidad. El Abogado acepta someterse a esta moderación.

4.7. **Suspensión temporal de la cuenta.** SOS Expat puede **suspender inmediatamente y sin previo aviso** la cuenta del Abogado en los siguientes casos:
- (a) Sospecha de fraude, usurpación de identidad o declaración falsa;
- (b) Reclamaciones múltiples o graves por parte de los Usuarios;
- (c) Falta de aportación de los documentos solicitados en virtud del artículo 4.5;
- (d) Violación probada o sospechada de las CGU o de las leyes aplicables;
- (e) Comportamiento perjudicial para la imagen o reputación de la Plataforma;
- (f) Requerimiento de una autoridad judicial, administrativa o colegial;
- (g) Cualquier otro motivo legítimo apreciado soberanamente por SOS Expat.
Durante la suspensión, el Abogado no puede acceder a su cuenta ni recibir nuevas Conexiones. Los pagos pendientes pueden retenerse hasta que se aclare la situación.

4.8. **Bloqueo definitivo (rescisión por incumplimiento).** SOS Expat puede **rescindir definitivamente y sin previo aviso** la cuenta del Abogado ("bloqueo") en los siguientes casos:
- (a) Violación grave o reiterada de las CGU;
- (b) Fraude probado, declaración falsa intencionada o usurpación de identidad/título;
- (c) Pérdida del derecho a ejercer (expulsión, suspensión colegial, no renovación de la inscripción);
- (d) Condena penal incompatible con el ejercicio de la profesión;
- (e) Comportamiento gravemente perjudicial para los Usuarios o la Plataforma;
- (f) Reincidencia tras una suspensión temporal;
- (g) Elusión comprobada de la Plataforma para evitar las Tarifas de Conexión;
- (h) Incumplimiento de las obligaciones de verificación KYC pese a los recordatorios;
- (i) Cualquier otro motivo grave apreciado soberanamente por SOS Expat.
El bloqueo es **definitivo e irrevocable**. El Abogado bloqueado no puede crear una nueva cuenta. Los fondos pendientes pueden retenerse como indemnización a tanto alzado, sin perjuicio de cualquier otra acción de reparación.

4.9. **Procedimiento y notificación.** En caso de suspensión o bloqueo, SOS Expat notifica al Abogado por correo electrónico a la dirección registrada. Esta notificación indica el motivo de la medida (salvo obligación legal de confidencialidad). El Abogado dispone de un plazo de **quince (15) días** para presentar sus observaciones por escrito a través del formulario de contacto. SOS Expat examina dichas observaciones pero no está obligada a levantar la medida. La decisión de SOS Expat es **discrecional y definitiva**.

4.10. **Efectos de la suspensión o el bloqueo.** En caso de suspensión o bloqueo:
- (a) El acceso a la cuenta queda inmediatamente bloqueado;
- (b) El perfil del Abogado se retira de los resultados de búsqueda;
- (c) Las Conexiones en curso pueden ser anuladas;
- (d) Los pagos pendientes pueden retenerse o compensarse con cualquier cantidad debida a SOS Expat;
- (e) El Abogado sigue obligado por sus compromisos (confidencialidad, no captación, etc.) conforme a las cláusulas de supervivencia.

4.11. **Inactividad.** En caso de **inactividad superior a 365 días**, la cuenta puede desactivarse automáticamente tras notificación. El Abogado puede reactivar su cuenta previa solicitud, siempre que aporte los documentos de verificación requeridos.

4.12. **Rescisión voluntaria.** El Abogado puede cerrar su cuenta en cualquier momento después de cumplir sus obligaciones pendientes (servicios aceptados, posibles reembolsos). La solicitud de cierre se realiza a través del formulario de contacto. SOS Expat procede al cierre en un plazo de **treinta (30) días**.

4.13. **Comunicaciones electrónicas.** El Abogado consiente recibir cualquier notificación relativa a las CGU, la moderación y las medidas de suspensión/bloqueo por medios electrónicos (correo electrónico, notificación in-app, publicación en la Plataforma). El Abogado se compromete a mantener una dirección de correo electrónico válida y a consultar regularmente sus notificaciones.

4.14. **Sistema interno de tramitación de reclamaciones (Reglamento P2B).** De conformidad con el artículo 11 del Reglamento (UE) 2019/1150, SOS Expat pone a disposición del Abogado un **sistema interno de tramitación de reclamaciones gratuito**, accesible a través del formulario de contacto (https://sos-expat.com/contact). SOS Expat se compromete a: (i) **acusar recibo** de toda reclamación en un plazo de **siete (7) días hábiles**; (ii) tramitar la reclamación **con seriedad y sin discriminación, en un plazo razonable** (por regla general, **treinta (30) días**); (iii) comunicar al Abogado el resultado **motivado** del tratamiento, en un lenguaje claro y comprensible, indicando las vías de recurso ulteriores (mediación en el art. 12.5, arbitraje en el art. 12.2); (iv) llevar **estadísticas agregadas** sobre el funcionamiento de este sistema, accesibles anualmente.

---

## 5. Reglas de uso – Conflictos, confidencialidad, no elusión

5.1. **Conflictos de interés.** El Abogado realiza un examen adecuado antes de cualquier asesoramiento. En caso de conflicto, se retira e informa al Usuario.

5.2. **Secreto profesional y confidencialidad.** El Abogado respeta la confidencialidad y el secreto profesional según la ley aplicable del País de Intervención.

**Política de grabación de llamadas:**
- (a) **Por defecto**, SOS Expat **NO graba el contenido audio** de las llamadas entre Abogado y Usuario. Solo se conservan los **metadatos técnicos** (marca de tiempo, duración, identificadores Twilio, estado de conexión) para facturación, antifraude y resolución de disputas técnicas;
- (b) SOS Expat **no activa ninguna grabación de audio sin el consentimiento explícito, previo y separado del Abogado Y del Usuario**, manifestado antes del inicio de la llamada mediante una acción positiva diferenciada. Ninguna grabación podrá ser activada unilateralmente por SOS Expat, con la única excepción de un **requerimiento regular emitido por una autoridad judicial competente del país del Abogado o del Usuario**, que presente las garantías de orden público requeridas por dicha jurisdicción (en particular respecto al secreto profesional del abogado);
- (c) Cuando excepcionalmente se active una grabación en el marco del apartado (b), se conservará durante el tiempo estrictamente necesario para su finalidad, dentro del límite máximo de **seis (6) meses** (salvo prórroga impuesta por un procedimiento judicial en curso), de conformidad con el RGPD y las recomendaciones de las autoridades locales de protección de datos;
- (d) **El Abogado se prohíbe a sí mismo** grabar, transcribir íntegramente, divulgar o utilizar los intercambios para fines distintos a la prestación acordada, salvo autorización escrita del Usuario u obligación legal;
- (e) **El secreto profesional permanece intacto**: cualquier grabación eventual por SOS Expat no podrá utilizarse contra el Abogado o el Usuario en violación de las normas deontológicas aplicables al secreto profesional.

5.3. **No elusión.** SOS Expat no recibe comisión sobre honorarios. Cada nueva Conexión con un Usuario nuevo mediante la Plataforma genera Tarifa de Conexión. Está prohibido eludir la Plataforma para evitar estas tarifas.

5.4. **Conductas prohibidas.** Suplantación de identidad/título, contenidos ilícitos, manipulación, colusión/boicot contra la Plataforma, violación de leyes de sanciones/exportación o cualquier actividad ilegal.

5.5. **Disponibilidad.** La Plataforma se proporciona “tal cual”; no se garantiza disponibilidad continua (mantenimiento, incidentes, fuerza mayor). El acceso puede ser restringido si la ley lo requiere.

---

## 6. Relación Abogado–Usuario (fuera de la Plataforma)

6.1. Tras la Conexión, Abogado y Usuario pueden contratar fuera de la Plataforma (SOS Expat no interviene en la fijación ni cobro de honorarios, salvo el mecanismo de pago único descrito a continuación).

6.2. El Abogado entrega sus acuerdos de honorarios según la ley local, recauda/reembolsa impuestos aplicables y cumple normas locales (publicidad, contacto, conflictos de interés, consumidores).

6.3. SOS Expat no es responsable de la calidad, exactitud o resultado del asesoramiento del Abogado.

---

## 7. Tarifas, pago único e impuestos

7.1. **Tarifa de Conexión (remuneración de la Plataforma).** La Tarifa de Conexión remunera **exclusivamente el servicio técnico de puesta en contacto** prestado por SOS Expat al **Usuario**. Es **debida por el Usuario** y **no por el Abogado**. Su importe se establece en el **baremo tarifario en vigor**, consultable en el espacio personal del Abogado, por Conexión, sin impuestos ni tarifas del Proveedor de pago. Toda modificación del baremo se realizará en las condiciones del artículo 2.5 (preaviso mínimo de quince (15) días). Se recomienda al Abogado consultar regularmente el baremo tarifario en vigor.

7.2. **Calificación jurídica del pago — dos deudas distintas e independientes.** El pago efectuado por el Usuario a través de la Plataforma se descompone **jurídicamente en dos deudas distintas e independientes**, a pesar de su liquidación mediante un único cobro por razones de conveniencia operativa:
- (a) **Deuda « Conexión »**: importe **debido por el Usuario a SOS Expat** en concepto del servicio técnico de puesta en contacto (Tarifa de Conexión, art. 7.1);
- (b) **Deuda « Honorarios »**: importe **debido por el Usuario al Abogado** en concepto de los honorarios de la prestación jurídica acordada entre ellos. El convenio de honorarios, así como el contenido y la calidad de la prestación, dependen **exclusivamente** de la relación Abogado–Usuario, fuera de la Plataforma (art. 6 y 13.5).

**SOS Expat no percibe, no reclama ni tiene derecho a comisión, retrocesión, reparto, porcentaje ni fracción alguna de los honorarios del Abogado — en particular en las jurisdicciones cuyas normas deontológicas prohíben el reparto de honorarios con un no abogado. La Tarifa de Conexión constituye la única remuneración de SOS Expat y procede exclusivamente de la deuda del Usuario contemplada en el apartado (a).**

El Proveedor de pago, actuando para la parte (b) en calidad de **agente pagador del Abogado**, transfiere a este último los honorarios percibidos, previa deducción únicamente de las comisiones bancarias de tramitación y, en su caso, de las comisiones de conversión de divisa (art. 7.3 y 7.4). **El importe neto que el Abogado percibirá se muestra en su panel de control antes y después de cada transacción**, lo que le permite aceptar o rechazar la conexión con pleno conocimiento de causa.

7.3. **Comisiones bancarias del Proveedor de pago.** El Proveedor de pago — **Stripe Payments Europe Ltd.** (Irlanda, UE, certificado PCI-DSS Nivel 1) **o PayPal (Europe) S.à r.l. et Cie, S.C.A.** (Luxemburgo, UE, certificado PCI-DSS), según el país de residencia y disponibilidad — cobra comisiones de procesamiento en cada transacción. **Estas comisiones bancarias corren íntegramente a cargo del Abogado** y se deducen automáticamente del importe que se le transfiere. El detalle de estas comisiones está disponible en las condiciones del Proveedor de pago (Stripe: stripe.com/es/pricing; PayPal: paypal.com/es/webapps/mpp/merchant-fees) y en el panel de control del Abogado para cada transacción.

7.4. **Comisiones de cambio y conversión de divisas.** Cuando la divisa de pago del Usuario difiere de la divisa de la cuenta bancaria del Abogado, el Proveedor de pago aplica **comisiones de conversión de divisa**. **Estas comisiones de cambio corren íntegramente a cargo del Abogado** y se deducen del importe que se le transfiere. Los tipos de cambio aplicados son los del Proveedor de pago en el momento de la transferencia. El Abogado reconoce y acepta expresamente que SOS Expat no tiene control alguno sobre estos tipos de cambio y declina toda responsabilidad por las fluctuaciones de divisas o las comisiones aplicadas por el Proveedor.

7.5. **Cálculo del importe neto transferido al Abogado.** El importe neto transferido al Abogado corresponde a la **deuda « Honorarios »** debida por el Usuario (art. 7.2.b), previa deducción **únicamente** de: (i) las **comisiones bancarias** del Proveedor de pago aplicables a la parte « Honorarios » (art. 7.3) y (ii) en su caso, las **comisiones de conversión de divisa** (art. 7.4). **La Tarifa de Conexión (art. 7.2.a) no se deduce en ningún caso de los honorarios**: se cobra en concepto de una deuda distinta del Usuario hacia SOS Expat. **El Abogado es informado del importe exacto que percibirá en su panel de control antes de cada servicio y puede así decidir con pleno conocimiento de causa si acepta o no la conexión.**

7.6. **Exigibilidad y no reembolso.** La Tarifa de Conexión se debe desde la Conexión efectiva y **no es reembolsable** (salvo gesto comercial discrecional de SOS Expat en caso de fallo exclusivamente imputable a la Plataforma y en la medida permitida por la ley).

7.7. **Reembolso al Usuario.** Si se concede un reembolso al Usuario, se imputa a la parte del Abogado: SOS Expat puede retener/compensar la cantidad correspondiente de los pagos futuros del Abogado, o solicitar su reembolso directo si no hay pagos pendientes. La Tarifa de Conexión permanece adquirida por SOS Expat, salvo decisión discrecional en contrario.

7.8. **Plazos de pago del Abogado según el canal.** Sin perjuicio de la finalización del proceso KYC (artículo 8), los plazos de pago de la remuneración neta del Abogado difieren según el canal de la Conexión:
- (a) **Conexiones B2C** (pago directo por el Usuario): la remuneración del Abogado se pone en pago **inmediatamente al finalizar la llamada** por el Proveedor de pago, sin perjuicio únicamente de los plazos técnicos de tratamiento bancario, antifraude y de captura del pago propios del Proveedor (típicamente de uno (1) a siete (7) días hábiles según el país del Abogado y la madurez de su cuenta con el Proveedor);
- (b) **Conexiones B2B** (pago por el Socio B2B): teniendo en cuenta el modelo de facturación diferida aplicable al Socio B2B (facturación mensual o «net-30»), la remuneración del Abogado se abona **en un plazo de treinta (30) días** siguientes a la fecha de la llamada;
- (c) En todos los casos, el pago puede suspenderse en caso de litigio, reclamación del Usuario o del Socio, verificación KYC/LCB-FT en curso, o cualquier otra circunstancia prevista en las presentes CGU.

7.9. **Impuestos.** El Abogado sigue siendo **el único responsable** de todas sus obligaciones fiscales (impuesto sobre la renta, IVA, cotizaciones sociales, cargas profesionales, etc.) en su jurisdicción de residencia y/o ejercicio. Los importes transferidos al Abogado son **importes brutos**; el Abogado es responsable de la declaración y pago de todos los impuestos aplicables. SOS Expat recauda y remite, cuando la ley lo exija, el IVA/equivalente local únicamente sobre la Tarifa de Conexión.

7.10. **Compensación.** SOS Expat puede compensar cualquier cantidad que el Abogado le deba (por reembolso a Usuario, penalización u otra obligación) con cualquier importe adeudado al Abogado.

7.11. **Transparencia tarifaria e historial.** El Abogado puede consultar en cualquier momento en su panel de control personal: (i) el detalle completo de cada transacción, (ii) el importe bruto pagado por el Usuario, (iii) la Tarifa de Conexión deducida, (iv) las comisiones bancarias del Proveedor de pago, (v) las comisiones de cambio en su caso, (vi) el importe neto transferido o por transferir, y (vii) el historial de todas sus transacciones. Esta información se conserva y está accesible durante toda la duración de la cuenta y **cinco (5) años** después de su cierre.

7.12. **Declaración fiscal automática (Directiva DAC7 — UE 2021/514).** El Abogado residente en un Estado miembro de la Unión Europea queda informado de que SOS Expat, en su calidad de operador de plataforma declarante, está obligada a **declarar anualmente** ante las autoridades fiscales competentes (al amparo de la Directiva (UE) 2021/514 denominada « DAC7 ») la información relativa a los Abogados activos residentes en la UE, en particular: nombre, domicilio, número de identificación fiscal (NIF/TIN), Estado de residencia, importe total de las contraprestaciones percibidas a través de la Plataforma y número de Conexiones, desglosados por trimestre natural. El Abogado se compromete a proporcionar y mantener actualizada esta información en su espacio personal. La falta de comunicación o de actualización podrá dar lugar a la suspensión de los pagos hasta su regularización, conforme a las disposiciones de DAC7.

7.13. **Canal B2B — Conexiones a través de un Socio B2B.**

(a) **Ámbito.** Una Conexión B2B es iniciada por un Usuario B2B, beneficiario de un contrato marco celebrado entre SOS Expat y un Socio B2B (art. 1).

(b) **Adaptación de las dos deudas.** El mecanismo de las dos deudas (art. 7.2) se aplica del siguiente modo en B2B:
- la **deuda « Conexión »** es debida por el **Socio B2B** a SOS Expat (en todo o en parte según el contrato marco), de modo que el **Usuario B2B no paga, por regla general, nada**, o paga únicamente un eventual ticket moderador a SOS Expat;
- la **deuda « Honorarios »** sigue siendo debida por el **Usuario final** al **Abogado**, salvo cláusula expresa del contrato marco que prevea una asunción total o parcial de los honorarios por el Socio B2B (en cuyo caso el Socio se convierte en deudor de la parte asumida frente al Abogado, mediante el mecanismo de agente pagador del art. 7.2).
- El Abogado en ningún caso queda dispensado de firmar un convenio de honorarios conforme con su deontología local (art. 6.2).

(c) **Tarifas de Abogado distintas B2C / B2B — el Abogado lo acepta expresamente.** El Abogado **reconoce y acepta expresamente** que **la remuneración neta que percibe por una Conexión B2B puede diferir**, al alza o a la baja, **de la percibida por una Conexión B2C** (por ejemplo: tarifa fija negociada con el Socio, consideración de un volumen garantizado, asunción total o parcial de los honorarios por el Socio, o reducción concedida al Socio). El **canal de origen (B2C o B2B)** y el **importe exacto** que el Abogado percibirá se **muestran en su panel de control antes de cada Conexión**, lo que le permite aceptarla o rechazarla libremente y con pleno conocimiento de causa. **Ninguna obligación de aceptación** recae sobre el Abogado por razón del canal o de la tarifa propuesta.

(d) **Inoponibilidad del contrato marco B2B al Abogado.** Las estipulaciones del contrato marco celebrado entre SOS Expat y el Socio B2B **no son oponibles al Abogado**; únicamente las presentes CGU y la información mostrada en el panel de control del Abogado regulan la relación entre SOS Expat y el Abogado con motivo de una Conexión B2B.

(e) **Cualquier otra estipulación de las presentes CGU se aplica** a las Conexiones B2B.

(f) **Baremos en vigor a la fecha de las presentes (a título indicativo).** En la fecha de la última actualización de las presentes CGU, los baremos netos de remuneración del Abogado son los siguientes:
- **Conexión B2C**: **treinta euros (30 €) o treinta dólares estadounidenses (30 USD)** netos por Conexión aceptada y ejecutada, según la divisa del pago;
- **Conexión B2B**: **veinte euros (20 €) o veinte dólares estadounidenses (20 USD)** netos por Conexión aceptada y ejecutada, según la divisa del pago.

Estos importes son **indicativos** y reflejan el baremo en vigor en la fecha de actualización de las presentes CGU. El **baremo actualizado** puede consultarse permanentemente en el panel de control del Abogado antes de cada Conexión. Toda modificación está sujeta al preaviso de quince (15) días previsto en el artículo 7.14.

7.14. **Modificación del baremo de remuneración del Abogado.** SOS Expat se reserva el derecho de **modificar en cualquier momento el baremo de remuneración neta del Abogado**, ya se trate:
- (i) del **baremo B2C** — mediante la modificación de las Tarifas de Conexión o de su estructura (que repercute en el neto percibido por el Abogado);
- (ii) del **baremo B2B** — mediante la modificación de la remuneración fija o variable aplicable a las Conexiones B2B;
- (iii) o de cualquier otro componente de la remuneración neta (por ejemplo: divisas, tramos de volumen, tramos de antigüedad).

Toda modificación está sujeta al **preaviso mínimo de quince (15) días** previsto en el artículo 2.5, notificado al Abogado en soporte duradero (correo electrónico a la dirección registrada y publicación en su espacio personal). Durante el período de preaviso, el Abogado podrá **resolver sin penalización** su relación con la Plataforma o continuar **rechazando caso por caso** las Conexiones cuya remuneración ya no le conviniera, recordándose que **el Abogado nunca está obligado a aceptar una Conexión**. **Las Conexiones ya aceptadas antes de la expiración del preaviso siguen siendo remuneradas a la tarifa en vigor en la fecha de aceptación.** A falta de resolución, la continuación del uso de la Plataforma a la expiración del preaviso equivale a aceptación del nuevo baremo.

---

## 8. Pagos – KYC/AML – Sanciones

8.1. **Proveedores de pago.** Los pagos se procesan **exclusivamente** por Proveedores externos certificados **PCI-DSS**: **Stripe Payments Europe Ltd.** (Irlanda, UE) y/o **PayPal (Europe) S.à r.l. et Cie, S.C.A.** (Luxemburgo, UE). El Proveedor aplicable depende del país de residencia/práctica del Abogado (Stripe cubre actualmente 44 países, PayPal 150+ países). El Abogado **acepta expresamente** las condiciones generales y los procesos KYC/AML del/de los Proveedor(es) aplicable(s). **SOS Expat NO es un banco, una entidad de pago ni una entidad de crédito**; SOS Expat es únicamente un cliente comercial de los Proveedores de pago mencionados.

8.2. SOS Expat puede diferir, retener o cancelar pagos en caso de sospecha de fraude, incumplimiento o mandato legal.

8.3. **Sanciones internacionales y embargos.** El Abogado declara y garantiza:
- (a) No figurar, directa o indirectamente, en ninguna **Lista de sanciones** (OFAC/SDN, UE, ONU, HMT o cualquier otra lista de sanciones aplicable);
- (b) No ser propiedad ni estar controlado, directa o indirectamente, por ninguna persona o entidad que figure en una Lista de sanciones;
- (c) No ser residente, nacional ni estar ubicado en un **país o territorio objeto de embargo global o de medidas restrictivas integrales** en virtud de las leyes y reglamentos aplicables, en particular los de los Proveedores de pago, la Unión Europea, las Naciones Unidas, la OFAC (Estados Unidos), el HMT (Reino Unido) o cualquier otra autoridad competente. La lista actualizada de dichos países y territorios la mantienen las autoridades mencionadas y prevalece; SOS Expat no elabora ni publica una lista geopolítica propia;
- (d) No utilizar la Plataforma para transacciones que impliquen a personas, entidades o países sancionados;
- (e) Cumplir todas las **leyes de control de exportaciones** aplicables.
SOS Expat se reserva el derecho de **restringir o bloquear inmediatamente el acceso** a la Plataforma en cualquier territorio sujeto a sanciones o embargos, o para cualquier Abogado sospechoso de violar estas disposiciones, sin previo aviso ni indemnización. SOS Expat también puede verse obligada a **congelar los fondos** del Abogado en caso de requerimiento de una autoridad competente.

### Fondos no reclamados y verificación KYC

8.4. **Obligación de completar el proceso de verificación (KYC).** Para recibir los pagos derivados de los servicios prestados a través de la Plataforma, el Abogado se compromete a completar el proceso de verificación de identidad (KYC - Know Your Customer) con el Proveedor de pago aplicable (**Stripe** o **PayPal**, según su país de residencia) en el menor plazo posible tras su registro. El Abogado reconoce que la falta de verificación KYC completa impide técnicamente la transferencia de fondos a su cuenta bancaria o cuenta PayPal.

8.5. **Conservación de fondos pendientes.** Cuando un Usuario efectúa un pago por un servicio prestado por un Abogado que no ha completado su verificación KYC, los fondos correspondientes a la parte del Abogado (una vez deducida la Tarifa de Conexión de la Plataforma) se conservan en depósito. La Plataforma se compromete a:
- Notificar al Abogado por correo electrónico la existencia de fondos pendientes;
- Enviar recordatorios periódicos (a los 7, 30, 60, 90, 120 y 150 días);
- Proporcionar al Abogado todos los medios necesarios para completar su verificación KYC.

8.6. **Fondos en espera prolongada — gastos de gestión y transferencia a las autoridades competentes.** Cuando la verificación KYC no se complete en un plazo de **ciento ochenta (180) días** desde el primer pago puesto en espera, y a pesar de las notificaciones previstas en el artículo 8.5:
- (a) **Gastos de gestión a tanto alzado.** SOS Expat podrá detraer de los fondos en espera unos **gastos de gestión a tanto alzado razonables, con un límite máximo del diez por ciento (10 %) del importe retenido**, que cubran estrictamente los costes administrativos efectivos de conservación, intentos de contacto y tramitación contable;
- (b) **Conservación prolongada.** El saldo permanecerá depositado en la cuenta de segregación del Proveedor de pago (o consignado por SOS Expat si las condiciones técnicas así lo requieren). El Abogado podrá, en cualquier momento durante esta fase, completar su KYC y reclamar los fondos;
- (c) **Transferencia a las autoridades competentes (fondos en abandono).** Transcurrido un plazo global de **cinco (5) años** desde el primer pago puesto en espera, a falta de reclamación válida, los fondos residuales se **transferirán a la autoridad competente del país de residencia del Abogado** en virtud de las normas aplicables a los fondos en abandono (por ejemplo, en Francia, a la Caisse des dépôts en virtud de la Ley Eckert; en Estados Unidos, al programa de unclaimed property del Estado competente; en el Reino Unido, al Dormant Assets Scheme; y, en general, al mecanismo local equivalente). **SOS Expat no se apropia en ningún caso de estos fondos residuales.**

8.7. **Reclamación durante la conservación prolongada.** El Abogado podrá, en cualquier momento durante la fase de conservación prolongada (b), dirigir una solicitud de reclamación motivada a SOS Expat a través del formulario de contacto, acompañada de una **verificación KYC completa** (siendo el KYC una condición técnica impuesta por el Proveedor de pago y por las obligaciones de prevención de blanqueo de capitales/financiación del terrorismo). SOS Expat examinará la solicitud en un plazo de **treinta (30) días**. En caso de aceptación, los fondos se reembolsarán previa deducción únicamente de los gastos de gestión mencionados en el apartado (a). En caso de fuerza mayor debidamente justificada o de incapacidad médica documentada, dichos gastos podrán reducirse o suprimirse a discreción razonable de SOS Expat.

8.8. **Aceptación expresa.** Al registrarse en la Plataforma, el Abogado declara haber tomado conocimiento de las modalidades del presente artículo 8 y las acepta expresamente. Esta aceptación constituye una condición esencial de acceso al estatuto de prestador.

---

## 9. Datos personales (marco global – GDPR/DSA)

9.1. **Roles.** Para datos de Usuarios recibidos para la Conexión, SOS Expat y el Abogado actúan cada uno como responsables de tratamiento para sus fines respectivos, conforme al **Reglamento (UE) 2016/679 (GDPR)**.

9.2. **Bases y finalidades.** Ejecución del contrato (Conexión), intereses legítimos (seguridad, prevención de fraude, mejora), cumplimiento legal (AML, sanciones), y, cuando aplique, consentimiento.

9.3. **Transferencias internacionales** con garantías adecuadas cuando se requiera (cláusulas contractuales tipo, decisión de adecuación, etc.).

9.4. **Derechos y contacto.** Ejercicio de derechos (acceso, rectificación, supresión, portabilidad, oposición) mediante el formulario de contacto de la Plataforma.

9.5. **Seguridad.** Medidas técnicas/organizativas razonables; notificación de violaciones según la ley aplicable (72 horas conforme al GDPR).

9.6. El Abogado procesa los datos recibidos conforme a la ley del País de Intervención y su ética profesional (secreto profesional).

9.7. **Cumplimiento DSA.** La Plataforma opera como **servicio intermediario** según el **Reglamento (UE) 2022/2065 (Ley de Servicios Digitales)**. SOS Expat implementa mecanismos para reportar contenido ilegal y coopera con las autoridades competentes conforme al DSA.

---

## 10. Propiedad intelectual

La Plataforma, sus marcas, logotipos, bases de datos y contenidos están protegidos. Ningún derecho se transfiere al Abogado, excepto un derecho personal, no exclusivo e intransferible de acceso durante la vigencia de las CGU. Los contenidos proporcionados por el Abogado (perfil, foto, descripciones) están licenciados mundialmente, de manera no exclusiva, a favor de SOS Expat para alojamiento y visualización en la Plataforma.

---

## 11. Garantías, responsabilidad e indemnización

11.1. No hay garantía sobre servicios legales; SOS Expat no asegura resultados, calidad ni volumen de negocios.

11.2. Plataforma “tal cual”; no hay garantía de acceso continuo.

11.3. **Limitación de responsabilidad:** en la medida permitida, la responsabilidad total de SOS Expat hacia el Abogado se limita a daños directos y no puede exceder el total de la Tarifa de Conexión recibida por SOS Expat por la transacción que originó la reclamación.

11.4. **Exclusiones:** no hay responsabilidad por daños indirectos, consecuentes, especiales o punitivos (pérdida de ganancias, clientela, reputación, etc.).

11.5. **Indemnización:** el Abogado indemniza y protege a SOS Expat (y sus afiliados, directivos, empleados, agentes) frente a cualquier reclamación/daño/gasto (incluidos honorarios legales) relacionados con (i) incumplimientos de CGU/leyes, (ii) sus contenidos, (iii) sus consejos/omisiones.

11.6. **Renuncia a recursos.** El Abogado **renuncia expresa e irrevocablemente** a cualquier recurso contra SOS Expat por (i) daños derivados de la prestación de servicios jurídicos, (ii) pérdidas indirectas, (iii) disputas contractuales con Usuarios, (iv) cualquier deficiencia de los servicios prestados por el Abogado. Esta renuncia aplica en la medida máxima permitida por la ley.

11.7. Ninguna representación: nada genera mandato, empleo, asociación o joint venture entre SOS Expat y el Abogado.

11.8. **Fuerza mayor.** SOS Expat no es responsable de retrasos o fallos causados por eventos de **fuerza mayor** (desastre natural, guerra, pandemia, ciberataque, corte eléctrico o de internet, decisión gubernamental, huelga, etc.).

11.9. **Supervivencia de cláusulas.** Los siguientes artículos sobreviven a la terminación o expiración de las CGU, cualquiera que sea la causa: artículos 2 (pruebas de aceptación), 3.5 (declaraciones), 5 (reglas de uso), 7 (tarifas y pagos), 8 (KYC y sanciones), 9 (datos personales), 10 (propiedad intelectual), 11 (responsabilidad e indemnización), 12 (derecho aplicable y arbitraje), 13 (cláusulas de protección) y 14 (varios). Estas cláusulas permanecen vigentes durante el tiempo necesario para producir sus efectos.

---

## 12. Ley aplicable – Arbitraje – Jurisdicción estonia – Acciones colectivas

12.1. **Derecho aplicable y primacía de la deontología local.** Las presentes CGU, su interpretación, validez y ejecución se rigen exclusivamente por el **derecho estonio**, con exclusión de sus normas de conflicto de leyes. **Para evitar toda ambigüedad**, las normas deontológicas de la profesión de abogado aplicables en el País de Intervención y/o en el país de inscripción colegial del Abogado (en particular en materia de secreto profesional, prohibición de reparto de honorarios con un no abogado, regulación de la publicidad y la captación, conflictos de intereses y gestión de fondos de clientes) se reputan **de orden público** y **prevalecen** sobre cualquier estipulación contraria o ambigua de las presentes CGU. Ninguna cláusula de las CGU podrá interpretarse en el sentido de imponer o autorizar al Abogado un comportamiento contrario a su deontología local; en caso de conflicto, el Abogado se abstendrá e informará a SOS Expat sin demora.

12.2. **Arbitraje internacional obligatorio.** Cualquier litigio, controversia o reclamación derivados de las presentes CGU o relacionados con ellas, incluida su validez, interpretación, ejecución o resolución, se resolverá definitivamente mediante **arbitraje** de conformidad con el Reglamento de Arbitraje de la **Cámara de Comercio Internacional (CCI)**.
- **Sede del arbitraje**: Tallin, Estonia;
- **Idioma del arbitraje**: **inglés**;
- **Número de árbitros**: un (1) árbitro único, salvo que el importe en litigio supere los 100.000 €, en cuyo caso tres (3) árbitros;
- **Derecho aplicable al fondo**: derecho estonio (art. 12.1);
- **Procedimiento**: confidencial. Las partes se comprometen a no divulgar la existencia, el contenido o el resultado del arbitraje, salvo obligación legal o para la ejecución del laudo.
El laudo arbitral es **definitivo y vinculante** para las partes. Las partes renuncian a cualquier recurso de anulación en la medida permitida por la ley.

12.3. **Renuncia a acciones colectivas y al jurado.** En la medida máxima permitida por la ley aplicable:
- (a) El Abogado renuncia a participar en cualquier **acción colectiva, acción de grupo o acción representativa** contra SOS Expat;
- (b) Cualquier litigio se resolverá **únicamente de forma individual**;
- (c) El Abogado renuncia expresamente a cualquier **derecho a un juicio con jurado** (jury trial waiver);
- (d) El Abogado renuncia a cualquier acción de tipo **class action, consolidated action o representative action** según el derecho estadounidense o cualquier derecho equivalente.

12.4. **Competencia exclusiva de los tribunales estonios.** Para cualquier demanda no arbitrable según la ley aplicable, para las medidas provisionales o cautelares urgentes antes de la constitución del tribunal arbitral, y para la ejecución de laudos arbitrales, los **tribunales de Tallin (Estonia)** tienen **competencia exclusiva**. El Abogado:
- (a) Consiente irrevocablemente a esta jurisdicción;
- (b) Renuncia a cualquier objeción de **forum non conveniens**;
- (c) Renuncia a cualquier objeción basada en la ausencia de competencia personal;
- (d) Acepta que cualquier notificación pueda realizarse en la dirección de correo electrónico registrada en la Plataforma.

12.5. **Mediación previa obligatoria y mediadores identificados (Reglamento P2B).** Antes de cualquier arbitraje, las partes se comprometen a intentar resolver el litigio de forma amistosa mediante **negociación de buena fe** durante un plazo de **treinta (30) días** a contar desde la notificación escrita del conflicto, enviada por correo electrónico con acuse de recibo a la dirección de contacto de la otra parte. De conformidad con el artículo 12 del Reglamento (UE) 2019/1150, SOS Expat identifica al menos **dos (2) mediadores especializados**, independientes y razonablemente accesibles, entre los cuales el Abogado podrá elegir: **(i) el Centre de Médiation et d'Arbitrage de Paris (CMAP) — cmap.fr**; y **(ii) el WIPO Arbitration and Mediation Center (Ginebra) — wipo.int/amc**. SOS Expat asumirá una **parte razonable de los gastos de mediación**, apreciada de buena fe caso por caso, en particular cuando el litigio sea de escaso importe. El fracaso de la mediación es un requisito previo para la presentación de una solicitud de arbitraje.

12.6. **Prescripción.** Toda acción o reclamación del Abogado contra SOS Expat deberá interponerse en el **plazo más breve entre tres (3) años** a contar desde el acaecimiento del hecho generador **y el plazo legal aplicable** en la jurisdicción del Abogado, bajo pena de caducidad. La presente cláusula no tiene por objeto ni por efecto reducir por debajo del mínimo imperativo los plazos de prescripción que sean inoponibles a toda reducción convencional en la jurisdicción concernida; en tal caso, será de aplicación el plazo legal local.

---

## 13. Cláusulas de protección internacional

13.1. **Anticorrupción.** El Abogado se compromete a no ofrecer, prometer ni pagar sobornos o beneficios indebidos a funcionarios públicos o privados. Cumple las leyes anticorrupción aplicables (FCPA, UK Bribery Act, Ley Sapin II, etc.).

13.2. **Confidencialidad de las comunicaciones.** Las comunicaciones realizadas a través de la Plataforma (mensajes, llamadas telefónicas) son **confidenciales**. El Abogado se compromete a no grabarlas, divulgarlas ni utilizarlas para fines distintos del servicio acordado, salvo autorización escrita u obligación legal.

13.3. **No captación.** Durante la vigencia de las CGU y **doce (12) meses** después de su resolución, el Abogado se compromete a no captar directamente a los Usuarios conocidos a través de la Plataforma para evitar las Tarifas de Conexión.

13.4. **Responsabilidad exclusiva del Abogado.** El Abogado es **el único responsable** de la calidad, exactitud y legalidad de los consejos y servicios que presta. El Abogado es **enteramente responsable** del cumplimiento de las disposiciones legales y reglamentarias del país donde ejerce. SOS Expat **no garantiza** los consejos jurídicos prestados por el Abogado y **declina toda responsabilidad** por cualquier perjuicio sufrido por un Usuario como consecuencia de los servicios del Abogado.

13.5. **Ausencia de relación de asesoramiento.** SOS Expat **no es un despacho de abogados** ni un prestador de servicios jurídicos. La Plataforma se limita a la **intermediación**. Toda relación de asesoramiento jurídico se establece **exclusivamente** entre el Abogado y el Usuario, **fuera** de SOS Expat. **Todo asunto** que se concluya con un cliente se gestionará **fuera de SOS Expat**.

13.6. **Litigios Abogado-Usuario.** Todo litigio entre un Abogado y un Usuario corresponde **exclusivamente** a su relación directa. SOS Expat **no interviene** en estos litigios y **no puede ser responsabilizada** como parte, garante o mediador. SOS Expat **no es en ningún caso responsable** de los litigios entre Abogado y cliente.

---

## 14. Varios

14.1. **Cesión:** SOS Expat puede ceder las CGU a una entidad de su grupo o a un sucesor; el Abogado no puede ceder sin consentimiento escrito de SOS Expat.

14.2. **Integralidad:** las CGU constituyen el acuerdo completo y reemplazan cualquier acuerdo previo sobre el mismo objeto.

14.3. **Notificaciones:** mediante publicación en la Plataforma, notificación in-app o formulario de contacto.

14.4. **Interpretación:** los títulos son indicativos. No se aplica regla contra proferente.

14.5. **Idiomas:** se pueden proporcionar traducciones; prevalece el inglés para la interpretación.

14.6. **Nulidad parcial y divisibilidad.** Si una estipulación de las presentes CGU es declarada nula, inválida o inaplicable por un tribunal o árbitro competente:
- (a) Dicha nulidad no afecta a la validez de las demás estipulaciones, que permanecen en vigor;
- (b) La estipulación nula será sustituida por una estipulación válida de efecto económico equivalente, en la medida de lo posible;
- (c) Las partes negociarán de buena fe para acordar una estipulación de sustitución.

14.7. **Divisibilidad geográfica.** Si una estipulación de las presentes CGU es inaplicable o ilegal en una jurisdicción específica:
- (a) Dicha estipulación no se aplica únicamente en esa jurisdicción;
- (b) Permanece plenamente aplicable en todas las demás jurisdicciones;
- (c) La inaplicabilidad local no afecta a la validez global de las CGU.

14.8. **No renuncia.** La falta o el retraso en el ejercicio de un derecho por parte de SOS Expat no implica renuncia a dicho derecho. Toda renuncia debe ser expresa y por escrito. Una renuncia puntual no constituye una renuncia general.

14.9. **Independencia de las cláusulas.** Cada cláusula de las presentes CGU es independiente. La invalidez de una cláusula no implica la invalidez de las cláusulas de limitación de responsabilidad, indemnización, arbitraje o jurisdicción, que seguirán siendo aplicables en la medida máxima permitida por la ley.

14.10. **Terceros.** Las presentes CGU no confieren ningún derecho a terceros (salvo los afiliados de SOS Expat expresamente mencionados). Ningún tercero puede invocar las estipulaciones de las CGU.

---

## 15. Contacto

Para cualquier pregunta o solicitud legal: **https://sos-expat.com/contact**
`;

  const defaultRu = `
# Общие условия использования – Юристы (Глобально)

**SOS Expat от WorldExpat OÜ** (далее « **Платформа** », « **SOS** », « **мы** »)

**Версия 3.2 – Последнее обновление: 26 апреля 2026 г.**

---

## 1. Определения

**Приложение / Сайт / Платформа**: цифровые сервисы, управляемые компанией **WorldExpat OÜ** (юридическое лицо эстонского права, регистрационный номер 16885621, юридический адрес: Таллинн, Эстония), обеспечивающие связь между пользователями («**Пользователи**») и специалистами в области права («**Юристы**»).

**Юрист**: любой специалист в области права, имеющий надлежащее разрешение на практику хотя бы в одной юрисдикции, независимо от местного наименования: адвокат (Россия, СНГ), avocat (Франция, Бельгия, Швейцария), lawyer/attorney/counsel (США, Великобритания, Содружество), solicitor/barrister (Великобритания, Ирландия, Австралия), abogado (Испания, Латинская Америка), Rechtsanwalt (Германия, Австрия, Швейцария), advogado (Португалия, Бразилия), avvocato (Италия), advocaat (Нидерланды, Бельгия), адвокат/юрист (Россия, СНГ), 弁護士 (Япония), 律师 (Китай) или любое иное эквивалентное звание, признанное профессиональной коллегией или компетентным органом юрисдикции осуществления практики.

**Соединение**: техническое/операционное действие, осуществляемое Платформой для связи Пользователя с Юристом, реализуемое посредством (i) передачи контактных данных, (ii) открытия канала связи (звонок, сообщение, видеоконференция) или (iii) принятия Юристом запроса через Платформу.

**Страна Вмешательства**: юрисдикция, на которую в первую очередь направлен Запрос в момент Соединения. При отсутствии указания — страна проживания Пользователя в момент запроса; при множественности юрисдикций — та, которая наиболее тесно связана с предметом Запроса.

**Плата за Соединение**: вознаграждение, **причитающееся с Пользователя в пользу SOS Expat** за каждое Соединение (п. 7), исключительно за технический сервис соединения, предоставляемый Платформой. Данная плата ни при каких обстоятельствах не является комиссией, ретроцессией или разделом гонорара Юриста. Её размер определяется **действующим тарифом**, доступным в личном кабинете Юриста и Пользователя. SOS Expat вправе изменять данный тариф на условиях, предусмотренных пунктом 2.5.

**Запрос**: правовая ситуация или проект, представленный Пользователем.

**Поставщики платежей**: сторонние сервисы, используемые для получения единовременной оплаты от Пользователя и распределения средств.

**Партнёр B2B**: любое юридическое лицо (компания, ассоциация, общество взаимопомощи, производственный совет, бюро, профессиональная организация и т.д.), заключившее с SOS Expat отдельный рамочный договор, предусматривающий, что оно полностью или частично финансирует Плату за Соединение для своих участников, сотрудников или бенефициаров (« **Пользователи B2B** »). **Соединение B2B** — это Соединение, инициированное Пользователем B2B на основании такого рамочного договора. В отличие от него, **Соединение B2C** инициируется Пользователем, который оплачивает Плату за Соединение напрямую.

**Санкционные списки**: перечни лиц, организаций или стран, в отношении которых действуют экономические санкции или эмбарго, в частности списки OFAC (США), Европейского союза, ООН, Казначейства Великобритании (HMT) и любого другого компетентного органа.

---

## 2. Предмет, сфера применения и акцепт

2.1. Настоящие Условия регулируют доступ и использование Платформы Юристами.

2.2. SOS Expat действует исключительно как технический посредник. SOS Expat не осуществляет юридическую практику, не предоставляет юридических консультаций и не является стороной отношений Юрист–Пользователь.

2.3. **Электронный акцепт (click-wrap) и прослеживаемость.** Юрист принимает Условия, устанавливая соответствующую галочку при регистрации и/или используя Платформу. Данное действие приравнивается к электронной подписи и договорному согласию в соответствии с Регламентом eIDAS (ЕС) № 910/2014. SOS Expat сохраняет **журналы аудита с метками времени**, включающие: (i) точную дату и время (UTC) акцепта, (ii) IP-адрес Юриста, (iii) уникальный идентификатор сессии, (iv) user-agent браузера, (v) версию принятых Условий, (vi) криптографический хеш принятого документа и (vii) уникальный идентификатор Юриста. Указанные журналы являются **юридически значимым доказательством** акцепта Условий.

2.4. **Хранение доказательств акцепта.** В соответствии с GDPR и требованиями законодательства о хранении документов, SOS Expat хранит доказательства акцепта Условий в течение **десяти (10) лет** с даты акцепта или до окончания любого текущего спора, в зависимости от того, что наступит позднее. По письменному запросу через форму обратной связи Юрист может получить **сертификат акцепта**, содержащий вышеуказанные доказательственные элементы. Данное хранение основано на законном интересе SOS Expat иметь доказательства на случай спора (п. 6.1.f GDPR) и на законодательном требовании хранения коммерческих договоров.

2.5. **Изменения (преуведомление P2B).** SOS Expat вправе обновлять Условия и/или тариф в любое время при условии **минимального преуведомления в пятнадцать (15) дней**, направляемого Юристу на долговременном носителе (электронное письмо на зарегистрированный адрес и публикация в личном кабинете), в соответствии со статьёй 3 Регламента (ЕС) 2019/1150 (« P2B »). Срок преуведомления может быть сокращён или отменён: (i) когда изменение обусловлено законом или решением компетентного органа; (ii) по неотложным соображениям безопасности или предотвращения мошенничества; либо (iii) для технических или типографских исправлений, не имеющих экономических последствий. В течение срока преуведомления Юрист вправе **расторгнуть отношения с Платформой без штрафа**. При отсутствии расторжения продолжение использования Платформы по истечении преуведомления означает акцепт. В случае существенного изменения Юристу будет предложено явно повторно подтвердить акцепт, фиксируемый в соответствии с пунктом 2.3.

2.6. Срок действия: бессрочно.

---

## 3. Статус Юриста – Независимость, соответствие и декларации

3.1. Юрист действует как независимый профессионал; никаких трудовых, агентских, представительских, партнёрских отношений или совместных предприятий с SOS Expat не создаётся.

3.2. Юрист несёт единоличную ответственность за: (i) свои дипломы, звания, регистрацию в адвокатуре/эквивалентных органах и разрешения на практику; (ii) действующую профессиональную страховку ответственности, соответствующую Странам Вмешательства; (iii) соблюдение местного законодательства и профессиональных правил (профессиональная этика, реклама/привлечение клиентов, конфликт интересов, профессиональная тайна, ПОД/ФТ/KYC, налогообложение, защита прав потребителей и т.д.).

3.3. SOS Expat не контролирует и не оценивает содержание или качество консультаций Юриста и не несёт за это никакой ответственности.

3.4. **Профессиональная правоспособность (B2B).** Юрист заявляет, что действует исключительно в профессиональных целях. Режимы защиты прав потребителей не применяются к отношениям SOS Expat–Юрист.

3.5. **Заявления и гарантии Юриста.** При регистрации на Платформе Юрист прямо заявляет и гарантирует, что:
- (a) Он является **совершеннолетним** в соответствии с законодательством страны своего проживания и/или осуществления практики;
- (b) Он обладает **полной правоспособностью** для заключения договоров и осуществления своей профессиональной деятельности;
- (c) Он не находится под опекой, попечительством, судебной защитой или иным эквивалентным режимом защиты;
- (d) На него не наложен **запрет на осуществление практики**, временный или постоянный;
- (e) Он не исключён, не отстранён и не выведен из состава адвокатуры или профессиональной коллегии;
- (f) В отношении него не ведётся **дисциплинарное производство**, которое может повлечь отстранение или исключение (либо обязуется незамедлительно уведомить SOS Expat в случае его начала);
- (g) Он не включён ни в один **Санкционный список** (OFAC, ЕС, ООН, HMT или иной);
- (h) Он не был **осуждён за уголовные преступления**, несовместимые с осуществлением профессиональной деятельности;
- (i) Вся информация, предоставленная при регистрации, является **точной, полной и актуальной**;
- (j) Он обязуется **незамедлительно информировать** SOS Expat о любых изменениях, затрагивающих данные заявления;
- (k) Он обладает **действительным правом осуществлять юридическую практику** в каждой из стран, которые он указал как «страны вмешательства» при регистрации или впоследствии в своём профиле. Юрист обязуется указывать только те юрисдикции, в которых он **юридически уполномочен** оказывать юридические консультации или представлять клиентов на основании местной регистрации, соглашений о взаимном признании, международных конвенций или любого иного правового механизма. Указание страны вмешательства, в которой Юрист не имеет права практиковать, является **грубым нарушением** настоящих Условий.
Любое ложное заявление является грубым нарушением Условий, которое может повлечь немедленный и окончательный бан, без ущерба для любых требований о возмещении убытков.

---

## 4. Создание аккаунта, проверки и безопасность

4.1. Условия: действующее право на практику хотя бы в одной юрисдикции, документы, удостоверяющие личность и квалификацию, действующая страховка профессиональной ответственности.

4.2. Процедура: создание аккаунта, предоставление документов, ручная верификация, которая может включать видеособеседование и проверки KYC/ПОД-ФТ через Поставщиков.

4.3. Точность и актуализация: Юрист гарантирует точность и актуальность информации; один (1) аккаунт на Юриста.

4.4. Безопасность: Юрист защищает свои учётные данные; любая активность через аккаунт считается совершённой им; немедленное уведомление о любой компрометации.

4.5. **Дополнительные проверки в любое время.** SOS Expat оставляет за собой право запросить у Юриста **в любое время и без обоснования** предоставление или обновление любого документа, подтверждающего право на практику, регистрацию в адвокатуре или эквивалентном органе, страховку профессиональной ответственности, личность или любой иной соответствующий документ. Юрист обязуется отвечать на такие запросы в течение **семи (7) рабочих дней**. Отсутствие ответа или предоставление несоответствующих документов может повлечь немедленную приостановку аккаунта.

4.6. **Модерация и контроль качества.** SOS Expat осуществляет политику модерации, направленную на обеспечение качества и соответствия услуг, предлагаемых на Платформе. Данная модерация может включать: (i) проверку профилей и опубликованного контента, (ii) анализ оценок и жалоб Пользователей, (iii) контроль соблюдения Условий и применимого законодательства, (iv) любые иные разумные меры контроля качества. Юрист соглашается подчиняться данной модерации.

4.7. **Временная приостановка аккаунта.** SOS Expat вправе **немедленно приостановить без предварительного уведомления** аккаунт Юриста в следующих случаях:
- (a) Подозрение в мошенничестве, присвоении чужой личности или ложном заявлении;
- (b) Множественные или серьёзные жалобы со стороны Пользователей;
- (c) Непредоставление документов, запрошенных в соответствии с п. 4.5;
- (d) Установленное или предполагаемое нарушение Условий или применимого законодательства;
- (e) Поведение, наносящее ущерб имиджу или репутации Платформы;
- (f) Предписание судебного, административного или дисциплинарного органа;
- (g) Любое иное законное основание по усмотрению SOS Expat.
На период приостановки Юрист не может получить доступ к своему аккаунту и не может получать новые Соединения. Текущие платежи могут быть задержаны до прояснения ситуации.

4.8. **Окончательный бан (расторжение за нарушение).** SOS Expat вправе **окончательно расторгнуть без предварительного уведомления** аккаунт Юриста («бан») в следующих случаях:
- (a) Грубое или повторное нарушение Условий;
- (b) Установленное мошенничество, умышленное ложное заявление или присвоение чужой личности/звания;
- (c) Утрата права на практику (исключение, отстранение, непродление регистрации);
- (d) Уголовное осуждение, несовместимое с осуществлением профессии;
- (e) Поведение, грубо нарушающее интересы Пользователей или Платформы;
- (f) Рецидив после временной приостановки;
- (g) Установленный обход Платформы для уклонения от Платы за Соединение;
- (h) Несоблюдение требований верификации KYC, несмотря на напоминания;
- (i) Любое иное грубое основание по усмотрению SOS Expat.
Бан является **окончательным и безотзывным**. Забаненный Юрист не может создать новый аккаунт. Средства на ожидании могут быть удержаны в качестве паушальных убытков, без ущерба для любых иных требований о возмещении.

4.9. **Процедура и уведомление.** В случае приостановки или бана SOS Expat уведомляет Юриста по электронной почте на зарегистрированный адрес. Данное уведомление указывает причину меры (за исключением случаев юридического обязательства сохранения конфиденциальности). Юрист располагает сроком в **пятнадцать (15) дней** для представления письменных возражений через форму обратной связи. SOS Expat рассматривает данные возражения, но не обязана отменять меру. Решение SOS Expat является **дискреционным и окончательным**.

4.10. **Последствия приостановки или бана.** В случае приостановки или бана:
- (a) Доступ к аккаунту немедленно блокируется;
- (b) Профиль Юриста удаляется из результатов поиска;
- (c) Текущие Соединения могут быть аннулированы;
- (d) Ожидающие платежи могут быть удержаны или зачтены в счёт любой суммы, причитающейся SOS Expat;
- (e) Юрист остаётся связанным своими обязательствами (конфиденциальность, непривлечение и т.д.) в соответствии с положениями о сохранении действия.

4.11. **Неактивность.** При **неактивности более 365 дней** аккаунт может быть автоматически деактивирован после уведомления. Юрист может реактивировать свой аккаунт по запросу при условии предоставления требуемых верификационных документов.

4.12. **Добровольное расторжение.** Юрист может закрыть свой аккаунт в любое время после выполнения своих текущих обязательств (принятые услуги, возможные возвраты). Запрос на закрытие подаётся через форму обратной связи. SOS Expat осуществляет закрытие в течение **тридцати (30) дней**.

4.13. **Электронные коммуникации.** Юрист соглашается получать любые уведомления, касающиеся Условий, модерации и мер по приостановке/бану, электронным способом (email, уведомления в приложении, публикация на Платформе). Юрист обязуется поддерживать действительный адрес электронной почты и регулярно проверять свои уведомления.

4.14. **Внутренняя система рассмотрения жалоб (Регламент P2B).** В соответствии со статьёй 11 Регламента (ЕС) 2019/1150 SOS Expat предоставляет Юристу **бесплатную внутреннюю систему рассмотрения жалоб**, доступную через форму обратной связи (https://sos-expat.com/contact). SOS Expat обязуется: (i) **подтвердить получение** любой жалобы в течение **семи (7) рабочих дней**; (ii) рассмотреть жалобу **серьёзно, без дискриминации, в разумный срок** (как правило, **тридцать (30) дней**); (iii) сообщить Юристу **мотивированный** результат рассмотрения на ясном и понятном языке с указанием дальнейших средств правовой защиты (медиация согласно п. 12.5, арбитраж согласно п. 12.2); (iv) вести **агрегированную статистику** функционирования данной системы, доступную ежегодно.

---

## 5. Правила использования – Конфликты, конфиденциальность, недопущение обхода

5.1. **Конфликты интересов.** Юрист проверяет наличие конфликтов перед консультацией. При конфликте он отказывается от работы и информирует Пользователя.

5.2. **Конфиденциальность и профессиональная тайна.** Юрист соблюдает конфиденциальность и профессиональную тайну в соответствии с законом страны вмешательства.

**Политика записи звонков:**
- (a) **По умолчанию** SOS Expat **НЕ записывает аудио-содержание** звонков между Юристом и Пользователем. Сохраняются только **технические метаданные** (метка времени, длительность, идентификаторы Twilio, статус соединения) для биллинга, противодействия мошенничеству и разрешения технических споров;
- (b) SOS Expat **не активирует никакой аудиозаписи без явного, предварительного и раздельного согласия Юриста И Пользователя**, выраженного до начала звонка отдельным позитивным действием. Никакая запись не может быть запущена в одностороннем порядке SOS Expat, за единственным исключением **надлежащего предписания компетентного судебного органа страны Юриста или Пользователя**, отвечающего гарантиям публичного порядка соответствующей юрисдикции (в частности в отношении адвокатской тайны);
- (c) Если запись в исключительном порядке активирована в рамках (b), она хранится в течение времени, строго необходимого для её цели, в максимальный срок **шести (6) месяцев** (за исключением продления, обусловленного текущим судебным разбирательством), в соответствии с GDPR и рекомендациями местных органов по защите данных;
- (d) **Юрист сам обязуется** не записывать, не транскрибировать полностью, не разглашать и не использовать обмены для целей, отличных от согласованной услуги, без письменного разрешения Пользователя или юридического обязательства;
- (e) **Профессиональная тайна остаётся неприкосновенной**: любая запись со стороны SOS Expat не может быть использована против Юриста или Пользователя в нарушение деонтологических правил, применимых к профессиональной тайне.

5.3. **Недопущение обхода.** SOS Expat получает плату только за новые Соединения через Платформу. Запрещено обходить Платформу для уклонения от платы.

5.4. **Запрещенное поведение.** Выдача себя за кого-либо, незаконный контент, манипуляции, сговор/бойкот Платформы, нарушение санкций/экспорта или любая незаконная деятельность.

5.5. **Доступность.** Платформа предоставляется «как есть»; непрерывность работы не гарантируется (техническое обслуживание, сбои, форс-мажор). Доступ может быть ограничен по закону.

---

## 6. Отношения Юрист–Пользователь (вне Платформы)

6.1. После Соединения Юрист и Пользователь могут заключать соглашения вне Платформы. SOS Expat не участвует в согласовании или оплате гонораров, кроме описанного единовременного платежа.

6.2. Юрист обеспечивает соблюдение местного законодательства при заключении соглашений о гонорарах, собирает налоги и соблюдает местные нормы (реклама, конфликты интересов, защита потребителей).

6.3. SOS Expat не несет ответственности за качество, точность или результат консультаций.

---

## 7. Тарифы, единовременный платёж и налоги

7.1. **Плата за Соединение (вознаграждение Платформы).** Плата за Соединение является вознаграждением **исключительно за технический сервис соединения**, оказываемый SOS Expat **Пользователю**. Она **причитается с Пользователя**, **а не с Юриста**. Её размер определён в **действующем тарифе**, доступном в личном кабинете Юриста, за каждое Соединение, без учёта налогов и комиссий Поставщика платежей. Любое изменение тарифа осуществляется на условиях статьи 2.5 (минимальное преуведомление в пятнадцать (15) дней). Юристу рекомендуется регулярно сверяться с действующей тарифной сеткой.

7.2. **Юридическая квалификация платежа — два отдельных и независимых долга.** Платёж, совершаемый Пользователем через Платформу, **юридически разделяется на два отдельных и независимых долга**, несмотря на их урегулирование единым взиманием в целях операционного удобства:
- (a) **Долг « Соединение »**: сумма, **причитающаяся Пользователем в пользу SOS Expat** за технический сервис соединения (Плата за Соединение, п. 7.1);
- (b) **Долг « Гонорар »**: сумма, **причитающаяся Пользователем в пользу Юриста** в качестве гонорара за юридическую услугу, согласованную между ними. Соглашение о гонораре, содержание и качество услуги относятся **исключительно** к отношениям Юрист–Пользователь, вне Платформы (п. 6 и 13.5).

**SOS Expat не получает, не требует и не имеет права на какую-либо комиссию, ретроцессию, раздел, процент или любую долю гонорара Юриста — в частности в юрисдикциях, деонтологические правила которых запрещают раздел гонорара с лицом, не являющимся адвокатом. Плата за Соединение является единственным вознаграждением SOS Expat и происходит исключительно из долга Пользователя, указанного в (a).**

Поставщик платежей, действующий по части (b) в качестве **платёжного агента Юриста**, перечисляет последнему полученные гонорары за вычетом только банковских комиссий за обработку и, при наличии, комиссий за конвертацию валюты (п. 7.3 и 7.4). **Чистая сумма, которую получит Юрист, отображается на его панели управления до и после каждой транзакции**, что позволяет ему принять или отклонить соединение с полным пониманием обстоятельств.

7.3. **Банковские комиссии Поставщика платежей.** Поставщик платежей (Stripe или эквивалент) взимает комиссии за обработку каждой транзакции. **Данные банковские комиссии полностью относятся на счёт Юриста** и автоматически вычитаются из перечисляемой ему суммы. Детали данных комиссий доступны в условиях Поставщика платежей и в личном кабинете Юриста для каждой транзакции.

7.4. **Комиссии за обмен и конвертацию валюты.** Когда валюта платежа Пользователя отличается от валюты банковского счёта Юриста, Поставщиком платежей применяются **комиссии за конвертацию валюты**. **Данные комиссии за обмен полностью относятся на счёт Юриста** и вычитаются из перечисляемой ему суммы. Применяемые обменные курсы — это курсы Поставщика платежей на момент перевода. Юрист признаёт и прямо соглашается, что SOS Expat не контролирует данные обменные курсы и не несёт ответственности за колебания валют или комиссии, применяемые Поставщиком.

7.5. **Расчёт чистой суммы, перечисляемой Юристу.** Чистая сумма, перечисляемая Юристу, соответствует **долгу « Гонорар »**, причитающемуся с Пользователя (п. 7.2.b), за вычетом **только**: (i) **банковских комиссий** Поставщика платежей, применимых к части « Гонорар » (п. 7.3) и (ii) при наличии, **комиссий за конвертацию валюты** (п. 7.4). **Плата за Соединение (п. 7.2.a) ни при каких обстоятельствах не вычитается из гонорара**: она взимается за отдельный долг Пользователя перед SOS Expat. **Юрист информируется о точной сумме, которую он получит, в своём личном кабинете до каждой услуги и может таким образом с полным пониманием обстоятельств решить принимать или нет соединение.**

7.6. **Причитаемость и невозвратность.** Плата за Соединение причитается с момента фактического Соединения и является **невозвратной** (за исключением коммерческого жеста по усмотрению SOS Expat в случае сбоя, исключительно связанного с Платформой, и в пределах, разрешённых законом).

7.7. **Возврат Пользователю.** Если Пользователю предоставляется возврат, он относится на долю Юриста: SOS Expat может удержать/зачесть соответствующую сумму из будущих выплат Юристу или потребовать прямого возмещения, если выплаты не предвидятся. Плата за Соединение остаётся приобретённой SOS Expat, за исключением иного дискреционного решения.

7.8. **Сроки оплаты Юриста в зависимости от канала.** При условии завершения процесса KYC (статья 8) сроки выплаты чистого вознаграждения Юриста различаются в зависимости от канала Соединения:
- (a) **Соединения B2C** (прямая оплата Пользователем): вознаграждение Юриста направляется к выплате **немедленно по окончании звонка** Платёжным провайдером, с учётом исключительно технических сроков банковской обработки, антимошеннической проверки и захвата платежа, присущих Провайдеру (как правило, от одного (1) до семи (7) рабочих дней в зависимости от страны Юриста и зрелости его счёта у Провайдера);
- (b) **Соединения B2B** (оплата Партнёром B2B): с учётом модели отсроченного выставления счетов, применимой к Партнёру B2B (ежемесячное выставление или «net-30»), вознаграждение Юриста выплачивается **в течение тридцати (30) дней** с даты звонка;
- (c) Во всех случаях платёж может быть приостановлен в случае спора, претензии Пользователя или Партнёра, текущей проверки KYC/ПОД-ФТ либо любого иного обстоятельства, предусмотренного настоящими Условиями.

7.9. **Налоги.** Юрист остаётся **единолично ответственным** за все свои налоговые обязательства (подоходный налог, НДС, социальные взносы, профессиональные сборы и т.д.) в юрисдикции своего проживания и/или практики. Суммы, перечисляемые Юристу, являются **валовыми**; Юрист несёт ответственность за декларирование и уплату всех применимых налогов. SOS Expat собирает и перечисляет, когда это требуется по закону, НДС/местный эквивалент только на Плату за Соединение.

7.10. **Зачёт.** SOS Expat может зачесть любую сумму, которую Юрист ей должен (в связи с возвратом Пользователю, штрафом или иным обязательством), с любой суммой, причитающейся Юристу.

7.11. **Тарифная прозрачность и история.** Юрист может в любое время просмотреть в своём личном кабинете: (i) полные детали каждой транзакции, (ii) валовую сумму, уплаченную Пользователем, (iii) вычтенную Плату за Соединение, (iv) банковские комиссии Поставщика платежей, (v) комиссии за обмен при наличии, (vi) чистую сумму, перечисленную или подлежащую перечислению, и (vii) историю всех своих транзакций. Данная информация хранится и доступна в течение всего срока действия аккаунта и **пяти (5) лет** после его закрытия.

7.12. **Автоматическое налоговое декларирование (Директива DAC7 — ЕС 2021/514).** Юрист, проживающий в государстве — члене ЕС, информируется о том, что SOS Expat в качестве оператора декларирующей платформы обязана **ежегодно декларировать** компетентным налоговым органам (на основании Директивы (ЕС) 2021/514 « DAC7 ») сведения об активных Юристах — резидентах ЕС, в частности: имя, адрес, налоговый идентификатор (TIN), государство проживания, общую сумму вознаграждений, полученных через Платформу, и количество Соединений по кварталам. Юрист обязуется предоставлять и поддерживать в актуальном состоянии данные сведения. Непредоставление может повлечь приостановку платежей до устранения нарушения в соответствии с положениями DAC7.

7.13. **Канал B2B — Соединения через Партнёра B2B.**

(a) **Сфера применения.** Соединение B2B инициируется Пользователем B2B, являющимся бенефициаром рамочного договора, заключённого между SOS Expat и Партнёром B2B (п. 1).

(b) **Адаптация двух долгов.** Механизм двух долгов (п. 7.2) применяется в B2B следующим образом:
- **долг « Соединение »** причитается с **Партнёра B2B** в пользу SOS Expat (полностью или частично согласно рамочному договору), так что **Пользователь B2B, как правило, ничего не платит** или платит лишь возможный соплатёж в пользу SOS Expat;
- **долг « Гонорар »** по-прежнему причитается с **конечного Пользователя** в пользу **Юриста**, за исключением прямого положения рамочного договора, предусматривающего полное или частичное покрытие гонорара Партнёром B2B (в этом случае Партнёр становится должником покрытой части перед Юристом через механизм платёжного агента, предусмотренный п. 7.2).
- Юрист ни в коем случае не освобождается от подписания соглашения о гонораре, соответствующего его местной деонтологии (п. 6.2).

(c) **Различные тарифы Юриста B2C / B2B — Юрист прямо это принимает.** Юрист **признаёт и прямо принимает**, что **чистое вознаграждение, которое он получает за Соединение B2B, может отличаться** в большую или меньшую сторону **от вознаграждения за Соединение B2C** (например: фиксированный тариф, согласованный с Партнёром, учёт гарантированного объёма, полное или частичное покрытие гонорара Партнёром или скидка, предоставленная Партнёру). **Канал происхождения (B2C или B2B)** и **точная сумма**, которую получит Юрист, **отображаются в его личном кабинете перед каждым Соединением**, что позволяет ему свободно и с полным пониманием обстоятельств принять или отклонить его. **Никакая обязанность принятия** не возлагается на Юриста в зависимости от канала или предложенного тарифа.

(d) **Непротивопоставимость рамочного договора B2B Юристу.** Положения рамочного договора, заключённого между SOS Expat и Партнёром B2B, **не противопоставимы Юристу**; только настоящие Условия и информация, отображаемая в личном кабинете Юриста, регулируют отношения между SOS Expat и Юристом в связи с Соединением B2B.

(e) **Любое иное положение настоящих Условий применяется** к Соединениям B2B.

(f) **Действующие на дату настоящих Условий тарифы (для справки).** На дату последнего обновления настоящих Условий чистые тарифы вознаграждения Юриста составляют:
- **Соединение B2C**: **тридцать евро (30 €) или тридцать долларов США (30 USD)** нетто за принятое и выполненное Соединение, в зависимости от валюты расчёта;
- **Соединение B2B**: **двадцать евро (20 €) или двадцать долларов США (20 USD)** нетто за принятое и выполненное Соединение, в зависимости от валюты расчёта.

Эти суммы являются **ориентировочными** и отражают тарифы, действующие на дату обновления настоящих Условий. **Актуальная шкала тарифов** постоянно доступна в личном кабинете Юриста перед каждым Соединением. Любое изменение подлежит уведомлению за пятнадцать (15) дней, предусмотренному статьёй 7.14.

7.14. **Изменение шкалы вознаграждения Юриста.** SOS Expat оставляет за собой право **в любое время изменять шкалу чистого вознаграждения Юриста**, будь то:
- (i) **шкала B2C** — путём изменения Платы за Соединение или её структуры (что отражается на чистой сумме, получаемой Юристом);
- (ii) **шкала B2B** — путём изменения фиксированного или переменного вознаграждения, применимого к Соединениям B2B;
- (iii) или любого иного компонента чистого вознаграждения (например: валюты, объёмные пороги, пороги стажа).

Любое изменение подлежит **минимальному преуведомлению в пятнадцать (15) дней**, предусмотренному статьёй 2.5, направляемому Юристу на долговременном носителе (электронное письмо на зарегистрированный адрес и публикация в его личном кабинете). В течение срока преуведомления Юрист может **расторгнуть отношения с Платформой без штрафа** или продолжать **отказываться в каждом конкретном случае** от Соединений, вознаграждение по которым его более не устраивает, при этом напоминается, что **Юрист никогда не обязан принимать Соединение**. **Соединения, уже принятые до истечения срока преуведомления, остаются вознаграждаемыми по тарифу, действовавшему на дату принятия.** При отсутствии расторжения продолжение использования Платформы по истечении срока преуведомления означает акцепт новой шкалы.

---

## 8. Платежи – KYC/ПОД-ФТ – Санкции

8.1. **Платёжные провайдеры.** Платежи обрабатываются **исключительно** сертифицированными по **PCI-DSS** сторонними Поставщиками: **Stripe Payments Europe Ltd.** (Ирландия, ЕС) и/или **PayPal (Europe) S.à r.l. et Cie, S.C.A.** (Люксембург, ЕС). Применимый Поставщик зависит от страны проживания/практики Юриста (Stripe в настоящее время охватывает 44 страны, PayPal — более 150). Юрист **прямо принимает** условия и процедуры KYC/ПОД-ФТ применимого(ых) Поставщика(ов). **SOS Expat НЕ является банком, платёжным или кредитным учреждением**; SOS Expat является лишь коммерческим клиентом упомянутых Платёжных провайдеров.

8.2. SOS Expat может задерживать, удерживать или отменять платежи при подозрении в мошенничестве, несоответствии или по требованию закона.

8.3. **Международные санкции и эмбарго.** Юрист заявляет и гарантирует:
- (a) Не находиться, прямо или косвенно, в **Санкционном списке** (OFAC/SDN, ЕС, ООН, HMT или любом ином применимом санкционном списке);
- (b) Не находиться во владении или под контролем, прямо или косвенно, лица или организации, включённых в Санкционный список;
- (c) Не являться резидентом, гражданином или находиться в **стране или на территории, в отношении которых действует глобальное эмбарго или полные ограничительные меры** в соответствии с применимыми законами и нормативными актами, в частности Поставщиков платежей, Европейского союза, ООН, OFAC (США), HMT (Великобритания) или любого иного компетентного органа. Актуальный перечень таких стран и территорий ведётся вышеуказанными органами и имеет силу первоисточника; SOS Expat не составляет и не публикует собственного геополитического списка;
- (d) Не использовать Платформу для транзакций с участием лиц, организаций или стран, находящихся под санкциями;
- (e) Соблюдать все **применимые законы об экспортном контроле**.
SOS Expat оставляет за собой право **немедленно ограничить или заблокировать доступ** к Платформе на любой территории, находящейся под санкциями или эмбарго, или для любого Юриста, подозреваемого в нарушении данных положений, без предварительного уведомления и компенсации. SOS Expat также может быть обязана **заморозить средства** Юриста по требованию компетентного органа.

### Невостребованные средства и верификация KYC

8.4. **Обязанность завершить процесс верификации (KYC).** Для получения платежей за услуги, оказанные через Платформу, Юрист обязуется завершить процесс идентификации (KYC — Know Your Customer) у нашего платёжного партнёра Stripe в кратчайшие сроки после регистрации. Юрист признаёт, что отсутствие полной верификации KYC технически препятствует перечислению средств на его банковский счёт.

8.5. **Хранение ожидающих средств.** Когда платёж осуществляется Пользователем за услугу, оказанную Юристом, не завершившим верификацию KYC, средства, соответствующие доле Юриста (за вычетом Платы за Соединение Платформы), хранятся на депозитном счёте. Платформа обязуется:
- Уведомить Юриста по электронной почте о наличии ожидающих средств;
- Направлять регулярные напоминания (через 7 дней, 30 дней, 60 дней, 90 дней, 120 дней и 150 дней);
- Предоставить Юристу все необходимые средства для завершения верификации KYC.

8.6. **Длительное удержание — комиссия за управление и передача компетентным органам.** Если KYC не завершена в срок **ста восьмидесяти (180) дней** с момента первого платежа, помещённого в ожидание, несмотря на уведомления, предусмотренные п. 8.5:
- (a) **Фиксированная комиссия за управление.** SOS Expat вправе взимать с удерживаемых средств **разумную фиксированную комиссию за управление, ограниченную десятью процентами (10 %) от удерживаемой суммы**, строго покрывающую фактические административные расходы;
- (b) **Длительное хранение.** Остаток продолжает храниться на сегрегированном счёте Поставщика платежей. Юрист может в любой момент в течение данной фазы завершить KYC и потребовать средства;
- (c) **Передача компетентным органам (бесхозяйность).** По истечении общего срока **пяти (5) лет** с момента первого платежа, помещённого в ожидание, при отсутствии действительной претензии остаточные средства **передаются компетентному органу страны проживания Юриста** в соответствии с правилами, применимыми к бесхозяйным средствам (например, во Франции — в Caisse des dépôts на основании закона Eckert; в США — в программу unclaimed property; в Великобритании — в Dormant Assets Scheme; и в общем в местный эквивалентный механизм). **SOS Expat ни при каких обстоятельствах не присваивает себе данные остаточные средства.**

8.7. **Претензия в период длительного хранения.** Юрист может в любое время в фазе длительного хранения (b) направить SOS Expat мотивированный запрос претензии через форму обратной связи, сопровождаемый **полной верификацией KYC** (KYC является техническим условием, налагаемым Поставщиком платежей и обязательствами ПОД/ФТ). SOS Expat рассматривает запрос в срок **тридцати (30) дней**. В случае удовлетворения средства перечисляются за вычетом только комиссии за управление, упомянутой в (a). В случае надлежащим образом обоснованного форс-мажора или документально подтверждённой медицинской недееспособности данная комиссия может быть уменьшена или отменена по разумному усмотрению SOS Expat.

8.8. **Явный акцепт.** При регистрации на Платформе Юрист заявляет, что ознакомился с условиями настоящей статьи 8 и явно их принимает. Данный акцепт является существенным условием доступа к статусу поставщика услуг.

---

## 9. Персональные данные (глобальная рамка – GDPR/DSA)

9.1. **Роли.** Для данных Пользователей, полученных для Соединения, SOS Expat и Юрист действуют как независимые контролеры данных в соответствии с **Регламентом (ЕС) 2016/679 (GDPR)**.

9.2. **Цели.** Выполнение контракта (Соединение), законные интересы (безопасность, предотвращение мошенничества, улучшение), соблюдение закона (AML, санкции), согласие, если требуется.

9.3. **Международные передачи** с адекватными гарантиями, если необходимо (стандартные договорные условия, решение об адекватности и т.д.).

9.4. **Права и контакт.** Реализация прав (доступ, исправление, удаление, переносимость, возражение) через форму контакта на Платформе.

9.5. **Безопасность.** Разумные технические и организационные меры; уведомление о нарушениях согласно закону (72 часа по GDPR).

9.6. Юрист обрабатывает данные в соответствии с законодательством страны вмешательства и профессиональной этикой.

9.7. **Соответствие DSA.** Платформа действует как **посреднический сервис** согласно **Регламенту (ЕС) 2022/2065 (Закон о цифровых услугах)**. SOS Expat внедряет механизмы сообщения о незаконном контенте и сотрудничает с компетентными органами.

---

## 10. Интеллектуальная собственность

Платформа, бренды, логотипы, базы данных и контент защищены. Юрист получает только личное, неисключительное, непередаваемое право на доступ во время действия Условий. Контент Юриста (профиль, фото, описание) лицензируется SOS Expat для размещения и отображения на Платформе.

---

## 11. Гарантии, ответственность и возмещение

11.1. Юридические услуги предоставляются без гарантий; SOS Expat не гарантирует результат, качество или объем работы.

11.2. Платформа «как есть»; непрерывность работы не гарантируется.

11.3. **Ограничение ответственности:** максимальная ответственность SOS Expat перед Юристом ограничена суммой Платы за Соединение, полученной за транзакцию, вызвавшую претензию.

11.4. **Исключения:** нет ответственности за косвенные, особые, штрафные убытки.

11.5. **Возмещение:** Юрист компенсирует SOS Expat любые убытки, претензии, расходы (включая юридические), связанные с нарушением Условий, контента или консультаций.

11.6. **Отказ от претензий.** Юрист **прямо и безотзывно отказывается** от любых претензий к SOS Expat за (i) ущерб от предоставления юридических услуг, (ii) косвенные убытки, (iii) договорные споры с Пользователями, (iv) любые недостатки услуг Юриста. Этот отказ применяется в максимальной степени, разрешенной законом.

11.7. Никаких агентских или партнерских отношений не возникает.

11.8. **Форс-мажор.** SOS Expat не несет ответственности за задержки или сбои, вызванные **форс-мажорными** обстоятельствами (стихийное бедствие, война, пандемия, кибератака, отключение электричества или интернета, решение правительства, забастовка и т.д.).

11.9. **Сохранение действия положений.** Следующие статьи сохраняют своё действие после расторжения или истечения срока Условий по любой причине: статьи 2 (доказательства акцепта), 3.5 (заявления), 5 (правила использования), 7 (тарифы и платежи), 8 (KYC и санкции), 9 (персональные данные), 10 (интеллектуальная собственность), 11 (ответственность и возмещение), 12 (применимое право и арбитраж), 13 (защитные положения) и 14 (разное). Данные положения остаются в силе столько, сколько необходимо для достижения их целей.

---

## 12. Применимое право – Арбитраж – Юрисдикция Эстонии – Коллективные иски

12.1. **Применимое право и приоритет местной деонтологии.** Настоящие Условия, их толкование, действительность и исполнение регулируются исключительно **правом Эстонии**, за исключением его коллизионных норм. **Во избежание любой неоднозначности**, деонтологические правила адвокатской профессии, применимые в Стране Вмешательства и/или в стране регистрации Юриста (в частности касающиеся профессиональной тайны, запрета раздела гонорара с лицом, не являющимся адвокатом, регулирования рекламы и привлечения клиентов, конфликтов интересов и управления клиентскими средствами), **признаются нормами публичного порядка** и **имеют приоритет** над любым противоречащим или неоднозначным положением настоящих Условий. В случае конфликта Юрист воздерживается и без промедления информирует SOS Expat.

12.2. **Обязательный международный арбитраж.** Любой спор, разногласие или претензия, вытекающие из настоящих Условий или связанные с ними, включая их действительность, толкование, исполнение или расторжение, будут окончательно разрешены путём **арбитража** в соответствии с Арбитражным регламентом **Международной торговой палаты (ICC)**.
- **Место арбитража**: Таллинн, Эстония;
- **Язык арбитража**: **английский**;
- **Число арбитров**: один (1) единоличный арбитр, за исключением случаев, когда сумма спора превышает 100 000 €, в этом случае — три (3) арбитра;
- **Применимое материальное право**: право Эстонии (п. 12.1);
- **Процедура**: конфиденциальная. Стороны обязуются не разглашать наличие, содержание или исход арбитража, за исключением случаев, требуемых законом, или для исполнения решения.
Арбитражное решение является **окончательным и обязательным** для сторон. Стороны отказываются от любого обжалования об отмене в пределах, разрешённых законом.

12.3. **Отказ от коллективных исков и суда присяжных.** В максимальной степени, разрешённой применимым правом:
- (a) Юрист отказывается от участия в любом **коллективном иске, групповом иске или представительном иске** против SOS Expat;
- (b) Любой спор будет разрешаться только на **индивидуальной основе**;
- (c) Юрист прямо отказывается от любого **права на рассмотрение дела судом присяжных** (jury trial waiver);
- (d) Юрист отказывается от любого иска в форме **class action, consolidated action или representative action** по праву США или любому эквивалентному праву.

12.4. **Исключительная юрисдикция судов Эстонии.** По любым требованиям, не подлежащим арбитражу по применимому праву, для принятия срочных обеспечительных мер до формирования арбитражного трибунала и для исполнения арбитражных решений **суды Таллинна (Эстония)** обладают **исключительной юрисдикцией**. Юрист:
- (a) Безотзывно соглашается с данной юрисдикцией;
- (b) Отказывается от любых возражений о **forum non conveniens**;
- (c) Отказывается от любых возражений об отсутствии персональной юрисдикции;
- (d) Соглашается, что любое вручение может быть осуществлено по адресу электронной почты, зарегистрированному на Платформе.

12.5. **Обязательная предварительная медиация и идентифицированные медиаторы (Регламент P2B).** Перед любым арбитражем стороны обязуются попытаться разрешить спор мирным путём посредством **добросовестных переговоров** в течение **тридцати (30) дней** с момента письменного уведомления о разногласии, направленного по электронной почте с подтверждением получения на контактный адрес другой стороны. В соответствии со статьёй 12 Регламента (ЕС) 2019/1150 SOS Expat идентифицирует не менее **двух (2) специализированных, независимых и разумно доступных медиаторов**, из числа которых Юрист может выбрать: **(i) Centre de Médiation et d'Arbitrage de Paris (CMAP) — cmap.fr**; и **(ii) WIPO Arbitration and Mediation Center (Женева) — wipo.int/amc**. SOS Expat несёт **разумную часть расходов на медиацию**, оцениваемую добросовестно в каждом конкретном случае, в частности когда сумма спора невелика. Неудача медиации является предварительным условием для подачи заявления об арбитраже.

12.6. **Исковая давность.** Любой иск или претензия Юриста против SOS Expat должны быть предъявлены в **наименьший из двух сроков: трёх (3) лет** с момента возникновения правопорождающего факта **или законного срока, применимого** в юрисдикции Юриста, под угрозой утраты права. Настоящее положение не направлено и не имеет следствием сокращения ниже императивного минимума сроков исковой давности, которые не могут быть подвергнуты договорному сокращению в соответствующей юрисдикции; в таком случае применяется местный законный срок.

---

## 13. Положения о международной защите

13.1. **Антикоррупция.** Юрист обязуется не предлагать, не обещать и не выплачивать взятки или неправомерные преимущества государственным или частным должностным лицам. Он соблюдает применимое антикоррупционное законодательство (FCPA, UK Bribery Act, закон Сапена II и т.д.).

13.2. **Конфиденциальность обмена информацией.** Обмен информацией через Платформу (сообщения, телефонные звонки) является **конфиденциальным**. Юрист не вправе их записывать, раскрывать или использовать для целей, иных чем согласованная услуга, за исключением случаев письменного разрешения или законодательного обязательства.

13.3. **Неприманивание.** В течение срока действия Условий и **двенадцати (12) месяцев** после их расторжения Юрист не вправе непосредственно привлекать Пользователей, с которыми он познакомился через Платформу, для уклонения от Платы за Соединение.

13.4. **Исключительная ответственность Юриста.** Юрист **несёт единоличную ответственность** за качество, точность и законность консультаций и услуг, которые он предоставляет. Юрист **полностью ответственен** за соблюдение законодательных и нормативных требований страны, в которой он практикует. SOS Expat **не гарантирует** юридические консультации, предоставленные Юристом, и **отказывается от любой ответственности** за любой ущерб, понесённый Пользователем в результате услуг Юриста.

13.5. **Отсутствие консультационных отношений.** SOS Expat **не является юридической фирмой** и не является поставщиком юридических услуг. Платформа ограничивается **посредничеством в установлении контактов**. Любые консультационные отношения устанавливаются **исключительно** между Юристом и Пользователем, **вне** SOS Expat. **Любое дело**, которое будет заключено с клиентом, ведётся **вне SOS Expat**.

13.6. **Споры Юрист–Пользователь.** Любой спор между Юристом и Пользователем относится **исключительно** к их прямым отношениям. SOS Expat **не вмешивается** в данные споры и **не может быть привлечена** в качестве стороны, гаранта или посредника. SOS Expat **ни в коем случае не несёт ответственности** за споры между Юристом и клиентом.

---

## 14. Разное

14.1. **Уступка**: SOS Expat может уступить Условия организации своей группы или правопреемнику; Юрист не может уступить без письменного согласия SOS Expat.

14.2. **Полнота**: Условия представляют собой полное соглашение и заменяют любое предшествующее соглашение по тому же предмету.

14.3. **Уведомления**: посредством публикации на Платформе, уведомления в приложении или через форму обратной связи.

14.4. **Толкование**: заголовки носят справочный характер. Правило contra proferentem не применяется.

14.5. **Языки**: могут предоставляться переводы; при толковании приоритет имеет английский язык.

14.6. **Частичная недействительность и делимость.** Если какое-либо положение настоящих Условий будет признано недействительным, ничтожным или неприменимым судом или компетентным арбитром:
- (a) Данная недействительность не затрагивает действительность остальных положений, которые остаются в силе;
- (b) Недействительное положение будет заменено действительным положением с эквивалентным экономическим эффектом, насколько это возможно;
- (c) Стороны добросовестно проведут переговоры для согласования заменяющего положения.

14.7. **Географическая делимость.** Если какое-либо положение настоящих Условий неприменимо или незаконно в конкретной юрисдикции:
- (a) Данное положение не применяется только в данной юрисдикции;
- (b) Оно остаётся полностью применимым во всех других юрисдикциях;
- (c) Местная неприменимость не затрагивает глобальную действительность Условий.

14.8. **Отсутствие отказа.** Неосуществление или задержка в осуществлении права SOS Expat не означает отказа от данного права. Любой отказ должен быть прямым и письменным. Разовый отказ не является общим отказом.

14.9. **Независимость положений.** Каждое положение настоящих Условий является независимым. Недействительность одного положения не влечёт недействительности положений об ограничении ответственности, возмещении, арбитраже или юрисдикции, которые остаются применимыми в максимальной степени, разрешённой законом.

14.10. **Третьи лица.** Настоящие Условия не предоставляют никаких прав третьим лицам (за исключением прямо упомянутых аффилированных лиц SOS Expat). Никакое третье лицо не может ссылаться на положения Условий.

---

## 15. Контакты

По всем вопросам или юридическим запросам: **https://sos-expat.com/contact**
`;

  const defaultDe = `
# Allgemeine Nutzungsbedingungen – Anwälte (Global)

**SOS Expat von WorldExpat OÜ** (die « **Plattform** », « **SOS** », « **wir** »)

**Version 3.2 – Letzte Aktualisierung: 26. April 2026**

---

## 1. Definitionen

**Anwendung / Website / Plattform**: Digitale Dienste, die von **WorldExpat OÜ** (estnische Gesellschaft, Registernr. 16885621, Sitz: Tallinn, Estland) betrieben werden und die Vernetzung zwischen Nutzern (den « **Nutzern** ») und Anwälten (den « **Anwälten** ») ermöglichen.

**Anwalt**: Jeder Rechtsanwalt oder Rechtsfachmann, der in mindestens einer Jurisdiktion zur Berufsausübung zugelassen ist, unabhängig von seiner lokalen Berufsbezeichnung: Rechtsanwalt (Deutschland, Österreich, Schweiz), avocat (Frankreich, Belgien, Schweiz), lawyer/attorney/counsel (USA, UK, Commonwealth), solicitor/barrister (UK, Irland, Australien), abogado (Spanien, Lateinamerika), advogado (Portugal, Brasilien), avvocato (Italien), advocaat (Niederlande, Belgien), адвокат/юрист (Russland, GUS), 弁護士 (Japan), 律师 (China) oder jede andere gleichwertige Berufsbezeichnung, die von der Anwaltskammer oder zuständigen Behörde der Jurisdiktion anerkannt ist.

**Vermittlung**: Die technische/operative Einführung, die von der Plattform zwischen einem Nutzer und einem Anwalt vorgenommen wird, die sich manifestiert durch (i) die Übermittlung von Kontaktdaten, (ii) die Eröffnung eines Kommunikationskanals (Anruf, Nachricht, Video), oder (iii) die Annahme einer über die Plattform gestellten Anfrage durch den Anwalt.

**Einsatzland**: Die Rechtsordnung, die zum Zeitpunkt der Vermittlung hauptsächlich von der Anfrage betroffen ist. Fehlt eine solche, gilt das Wohnsitzland des Nutzers zum Zeitpunkt der Anfrage; bei mehreren Jurisdiktionen gilt diejenige, die dem Gegenstand der Anfrage am engsten verbunden ist.

**Vermittlungsgebühr**: Vergütung, die **vom Nutzer an SOS Expat** für jede Vermittlung (Art. 7) für die ausschließlich technische Vermittlungsleistung der Plattform geschuldet wird. Diese Gebühr stellt in keinem Fall eine Provision, Rückvergütung oder Beteiligung an den Honoraren des Anwalts dar. Ihre Höhe wird in der **jeweils geltenden Gebührenordnung** festgelegt, die im persönlichen Bereich des Anwalts und des Nutzers einsehbar ist. SOS Expat kann diese Gebührenordnung unter den in Artikel 2.5 vorgesehenen Bedingungen ändern.

**Anfrage**: Die vom Nutzer dargestellte rechtliche Situation oder das rechtliche Projekt.

**Zahlungsdienstleister**: Dritte, die für den Einzug der einmaligen Zahlung des Nutzers und die Verteilung der Gelder genutzt werden.

**B2B-Partner**: jede juristische Person (Unternehmen, Verein, Versicherungsverein auf Gegenseitigkeit, Betriebsrat, Kanzlei, Berufsorganisation usw.), die mit SOS Expat einen gesonderten Rahmenvertrag geschlossen hat, der vorsieht, dass sie die Vermittlungsgebühren für ihre Mitglieder, Mitarbeiter oder Begünstigten (die « **B2B-Nutzer** ») ganz oder teilweise finanziert. Eine **B2B-Vermittlung** ist eine Vermittlung, die von einem B2B-Nutzer aufgrund eines solchen Rahmenvertrags ausgelöst wird. Im Gegensatz dazu wird eine **B2C-Vermittlung** von einem Nutzer ausgelöst, der die Vermittlungsgebühren direkt zahlt.

**Sanktionslisten**: Listen von Personen, Einrichtungen oder Ländern, die Wirtschaftssanktionen oder Embargos unterliegen, insbesondere die Listen der OFAC (Vereinigte Staaten), der Europäischen Union, der Vereinten Nationen, des britischen Finanzministeriums (HMT) und jeder anderen zuständigen Behörde.

---

## 2. Zweck, Geltungsbereich und Annahme

2.1. Diese AGB regeln den Zugang und die Nutzung der Plattform durch Anwälte.

2.2. SOS Expat agiert ausschließlich als technischer Vermittler. SOS Expat übt den Anwaltsberuf nicht aus, erbringt keine Rechtsberatung und ist nicht Partei der Beziehung zwischen Anwalt und Nutzer.

2.3. **Elektronische Zustimmung (Click-Wrap) und Nachverfolgbarkeit.** Der Anwalt akzeptiert die AGB durch Anklicken des entsprechenden Feldes bei der Registrierung und/oder durch Nutzung der Plattform. Diese Handlung gilt als elektronische Unterschrift und vertragliche Zustimmung gemäß der Verordnung (EU) Nr. 910/2014 (eIDAS). SOS Expat führt **zeitgestempelte Auditprotokolle**, die Folgendes enthalten: (i) das genaue Datum und die Uhrzeit (UTC) der Annahme, (ii) die IP-Adresse des Anwalts, (iii) die eindeutige Sitzungskennung, (iv) den User-Agent des Browsers, (v) die Version der akzeptierten AGB, (vi) den kryptografischen Hash des akzeptierten Dokuments und (vii) die eindeutige Kennung des Anwalts. Diese Protokolle stellen einen **rechtlich durchsetzbaren Nachweis** der Annahme der AGB dar.

2.4. **Aufbewahrung der Annahmenachweise.** Gemäß DSGVO und den gesetzlichen Aufbewahrungspflichten bewahrt SOS Expat die Nachweise der AGB-Annahme für einen Zeitraum von **zehn (10) Jahren** ab dem Datum der Annahme auf, oder bis zum Abschluss eines laufenden Rechtsstreits, je nachdem, was zutrifft. Der Anwalt kann auf schriftliche Anfrage über das Kontaktformular eine **Annahmebestätigung** mit den oben genannten Nachweiselementen erhalten. Diese Aufbewahrung beruht auf dem berechtigten Interesse von SOS Expat, im Streitfall über Beweise zu verfügen (Art. 6 Abs. 1 lit. f DSGVO), sowie auf der gesetzlichen Pflicht zur Aufbewahrung von Handelsverträgen.

2.5. **Änderungen (P2B-Vorankündigung).** SOS Expat kann die AGB und/oder die Gebührenordnung jederzeit aktualisieren, vorbehaltlich einer **Mindestvorankündigung von fünfzehn (15) Tagen**, die dem Anwalt auf einem dauerhaften Datenträger mitgeteilt wird (E-Mail an die registrierte Adresse und Veröffentlichung im persönlichen Bereich), gemäß Artikel 3 der Verordnung (EU) 2019/1150 (« P2B »). Die Vorankündigungsfrist kann verkürzt oder aufgehoben werden: (i) wenn die Änderung gesetzlich oder durch eine Entscheidung einer zuständigen Behörde vorgeschrieben ist; (ii) aus zwingenden Gründen der Sicherheit oder der Betrugsprävention; oder (iii) bei sachlichen oder typografischen Korrekturen ohne wirtschaftliche Auswirkungen. Während der Vorankündigungsfrist kann der Anwalt seine Beziehung zur Plattform **ohne Vertragsstrafe kündigen**. Erfolgt keine Kündigung, gilt die fortgesetzte Nutzung der Plattform nach Ablauf der Vorankündigungsfrist als Zustimmung. Bei wesentlichen Änderungen wird der Anwalt aufgefordert, seine Annahme ausdrücklich erneut zu bestätigen, was nach den Modalitäten des Artikels 2.3 protokolliert wird.

2.6. Laufzeit: unbefristet.

---

## 3. Status des Anwalts – Unabhängigkeit, Compliance und Erklärungen

3.1. Der Anwalt handelt als unabhängiger Berufsträger; es entsteht kein Arbeits-, Agentur-, Mandats-, Partnerschafts- oder Joint-Venture-Verhältnis mit SOS Expat.

3.2. Der Anwalt ist allein verantwortlich für: (i) seine Abschlüsse, Titel, Zulassungen zur Rechtsanwaltschaft/Äquivalente und Berufsausübungsberechtigungen; (ii) seine gültige Berufshaftpflichtversicherung, angepasst an die Einsatzländer; (iii) die Einhaltung der lokalen Gesetze und Berufsregeln (Berufsordnung, Werbung/Mandantenakquise, Interessenkonflikte, Berufsgeheimnis, Geldwäscheprävention/KYC, Steuern, Verbraucherschutz usw.).

3.3. SOS Expat überwacht oder bewertet weder den Inhalt noch die Qualität der Beratung des Anwalts und übernimmt hierfür keinerlei Verantwortung.

3.4. **Berufliche Kapazität (B2B).** Der Anwalt erklärt, ausschließlich zu beruflichen Zwecken zu handeln. Verbraucherschutzregelungen gelten nicht für die Beziehung zwischen SOS Expat und dem Anwalt.

3.5. **Erklärungen und Garantien des Anwalts.** Mit der Registrierung auf der Plattform erklärt und garantiert der Anwalt ausdrücklich, dass:
- (a) Er nach dem Recht seines Wohnsitz- und/oder Tätigkeitslandes **volljährig** ist;
- (b) Er die **volle Geschäftsfähigkeit** besitzt, um Verträge abzuschließen und seinen Beruf auszuüben;
- (c) Er nicht unter Vormundschaft, Betreuung, gerichtlichem Schutz oder einem gleichwertigen Schutzregime steht;
- (d) Gegen ihn kein **Berufsverbot** besteht, weder vorübergehend noch dauerhaft;
- (e) Er nicht von seiner Anwaltskammer oder Berufsorganisation ausgeschlossen, suspendiert oder gesperrt wurde;
- (f) Gegen ihn kein **laufendes Disziplinarverfahren** anhängig ist, das zu einer Suspendierung oder einem Ausschluss führen könnte (oder er sich verpflichtet, SOS Expat unverzüglich zu informieren, falls dies der Fall sein sollte);
- (g) Er auf **keiner Sanktionsliste** (OFAC, EU, UN, HMT oder andere) steht;
- (h) Er nicht wegen Straftaten **strafrechtlich verurteilt** wurde, die mit der Ausübung seines Berufs unvereinbar sind;
- (i) Alle bei der Registrierung angegebenen Informationen **korrekt, vollständig und aktuell** sind;
- (j) Er sich verpflichtet, SOS Expat **unverzüglich über Änderungen** zu informieren, die diese Erklärungen betreffen;
- (k) Er das **tatsächliche Recht hat, als Anwalt tätig zu sein** in jedem der Länder, die er bei der Registrierung oder später in seinem Profil als "Einsatzländer" ausgewählt hat. Der Anwalt verpflichtet sich, nur Jurisdiktionen auszuwählen, in denen er **gesetzlich befugt** ist, Rechtsberatung zu erteilen oder Mandanten zu vertreten, sei es aufgrund seiner lokalen Zulassung, gegenseitiger Anerkennungsabkommen, internationaler Übereinkommen oder anderer rechtlicher Mechanismen. Die Auswahl eines Einsatzlandes, in dem der Anwalt nicht zur Berufsausübung berechtigt ist, stellt einen **schwerwiegenden Verstoß** gegen diese AGB dar.
Jede falsche Erklärung stellt einen schwerwiegenden Verstoß gegen die AGB dar, der zu einem sofortigen und endgültigen Ausschluss führen kann, unbeschadet etwaiger Schadensersatzansprüche.

---

## 4. Kontoerstellung, Überprüfungen und Sicherheit

4.1. Voraussetzungen: gültige Zulassung zur Berufsausübung in mindestens einer Jurisdiktion, Identitäts- und Qualifikationsnachweise, gültige Berufshaftpflichtversicherung.

4.2. Verfahren: Kontoerstellung, Vorlage der Dokumente, manuelle Validierung, die ein Videointerview und KYC/AML-Prüfungen über Dienstleister umfassen kann.

4.3. Richtigkeit & Aktualisierung: Der Anwalt garantiert die Richtigkeit und Aktualität der Angaben; ein (1) Konto pro Anwalt.

4.4. Sicherheit: Der Anwalt schützt seine Zugangsdaten; jede Aktivität über das Konto gilt als von ihm vorgenommen; jede Kompromittierung ist unverzüglich zu melden.

4.5. **Zusätzliche Überprüfungen jederzeit.** SOS Expat behält sich das Recht vor, vom Anwalt **jederzeit und ohne Begründung** die Vorlage oder Aktualisierung von Dokumenten zu verlangen, die sein Recht zur Berufsausübung, seine Kammerzulassung oder Äquivalent, seine Berufshaftpflichtversicherung, seine Identität oder andere relevante Nachweise belegen. Der Anwalt verpflichtet sich, auf solche Anfragen innerhalb von **sieben (7) Werktagen** zu antworten. Das Ausbleiben einer Antwort oder die Vorlage nicht konformer Dokumente kann zur sofortigen Kontosperrung führen.

4.6. **Moderation und Qualitätskontrolle.** SOS Expat setzt eine Moderationsrichtlinie um, die darauf abzielt, die Qualität und Konformität der auf der Plattform angebotenen Dienstleistungen sicherzustellen. Diese Moderation kann umfassen: (i) Überprüfung von Profilen und veröffentlichten Inhalten, (ii) Analyse von Nutzerbewertungen und Beschwerden, (iii) Kontrolle der Einhaltung der AGB und anwendbarer Gesetze, (iv) alle anderen angemessenen Qualitätskontrollmaßnahmen. Der Anwalt erklärt sich mit dieser Moderation einverstanden.

4.7. **Vorübergehende Kontosperrung.** SOS Expat kann das Konto des Anwalts in folgenden Fällen **sofort und ohne Vorankündigung sperren**:
- (a) Verdacht auf Betrug, Identitätsdiebstahl oder falsche Angaben;
- (b) Mehrfache oder schwerwiegende Beschwerden von Nutzern;
- (c) Nichtvorlage der gemäß Artikel 4.5 angeforderten Dokumente;
- (d) Nachgewiesener oder vermuteter Verstoß gegen die AGB oder anwendbare Gesetze;
- (e) Verhalten, das dem Image oder dem Ruf der Plattform schadet;
- (f) Anordnung einer Justiz-, Verwaltungs- oder Kammerbehörde;
- (g) Jeder andere berechtigte Grund nach alleinigem Ermessen von SOS Expat.
Während der Sperrung kann der Anwalt nicht auf sein Konto zugreifen und keine neuen Vermittlungen erhalten. Ausstehende Zahlungen können bis zur Klärung der Situation einbehalten werden.

4.8. **Dauerhafter Ausschluss (Kündigung wegen Vertragsverletzung).** SOS Expat kann das Konto des Anwalts in folgenden Fällen **dauerhaft und ohne Vorankündigung kündigen** ("Ausschluss"):
- (a) Schwerer oder wiederholter Verstoß gegen die AGB;
- (b) Nachgewiesener Betrug, vorsätzlich falsche Angaben oder Identitäts-/Titeldiebstahl;
- (c) Verlust des Rechts zur Berufsausübung (Ausschluss, Kammersuspendierung, Nichtverlängerung der Zulassung);
- (d) Strafrechtliche Verurteilung, die mit der Berufsausübung unvereinbar ist;
- (e) Verhalten, das Nutzern oder der Plattform schwerwiegend schadet;
- (f) Wiederholung nach einer vorübergehenden Sperrung;
- (g) Nachgewiesene Umgehung der Plattform zur Vermeidung von Vermittlungsgebühren;
- (h) Nichteinhaltung der KYC-Verifizierungspflichten trotz Mahnungen;
- (i) Jeder andere schwerwiegende Grund nach alleinigem Ermessen von SOS Expat.
Der Ausschluss ist **endgültig und unwiderruflich**. Ein ausgeschlossener Anwalt kann kein neues Konto erstellen. Ausstehende Gelder können als pauschaler Schadensersatz einbehalten werden, unbeschadet weiterer Schadensersatzansprüche.

4.9. **Verfahren und Benachrichtigung.** Im Falle einer Sperrung oder eines Ausschlusses benachrichtigt SOS Expat den Anwalt per E-Mail an die registrierte Adresse. Diese Benachrichtigung gibt den Grund der Maßnahme an (es sei denn, eine gesetzliche Vertraulichkeitspflicht besteht). Der Anwalt hat **fünfzehn (15) Tage** Zeit, um schriftliche Stellungnahmen über das Kontaktformular einzureichen. SOS Expat prüft diese Stellungnahmen, ist aber nicht verpflichtet, die Maßnahme aufzuheben. Die Entscheidung von SOS Expat ist **nach eigenem Ermessen und endgültig**.

4.10. **Auswirkungen der Sperrung oder des Ausschlusses.** Im Falle einer Sperrung oder eines Ausschlusses:
- (a) Der Kontozugang wird sofort gesperrt;
- (b) Das Profil des Anwalts wird aus den Suchergebnissen entfernt;
- (c) Laufende Vermittlungen können storniert werden;
- (d) Ausstehende Zahlungen können einbehalten oder mit Beträgen verrechnet werden, die SOS Expat geschuldet werden;
- (e) Der Anwalt bleibt gemäß den Fortgeltungsklauseln an seine Verpflichtungen (Vertraulichkeit, Nicht-Abwerbung usw.) gebunden.

4.11. **Inaktivität.** Bei **Inaktivität von mehr als 365 Tagen** kann das Konto nach Benachrichtigung automatisch deaktiviert werden. Der Anwalt kann sein Konto auf Anfrage reaktivieren, sofern er die erforderlichen Verifizierungsdokumente vorlegt.

4.12. **Freiwillige Kündigung.** Der Anwalt kann sein Konto jederzeit schließen, nachdem er seine ausstehenden Verpflichtungen erfüllt hat (angenommene Leistungen, mögliche Erstattungen). Der Schließungsantrag erfolgt über das Kontaktformular. SOS Expat führt die Schließung innerhalb von **dreißig (30) Tagen** durch.

4.13. **Elektronische Kommunikation.** Der Anwalt erklärt sich damit einverstanden, alle Benachrichtigungen bezüglich der AGB, der Moderation und der Sperr-/Ausschlussmaßnahmen auf elektronischem Wege zu erhalten (E-Mail, In-App-Benachrichtigung, Veröffentlichung auf der Plattform). Der Anwalt verpflichtet sich, eine gültige E-Mail-Adresse zu führen und seine Benachrichtigungen regelmäßig zu prüfen.

4.14. **Internes Beschwerdemanagementsystem (P2B-Verordnung).** Gemäß Artikel 11 der Verordnung (EU) 2019/1150 stellt SOS Expat dem Anwalt ein **kostenloses internes Beschwerdemanagementsystem** zur Verfügung, das über das Kontaktformular (https://sos-expat.com/contact) zugänglich ist. SOS Expat verpflichtet sich, (i) jede Beschwerde innerhalb von **sieben (7) Werktagen** **zu bestätigen**; (ii) die Beschwerde **mit Sorgfalt und ohne Diskriminierung innerhalb einer angemessenen Frist** zu bearbeiten (in der Regel **dreißig (30) Tage**); (iii) dem Anwalt das **begründete** Ergebnis der Bearbeitung in klarer und verständlicher Sprache mitzuteilen unter Angabe der weiteren Rechtsbehelfe (Mediation gemäß Art. 12.5, Schiedsverfahren gemäß Art. 12.2); (iv) **aggregierte Statistiken** über die Funktionsweise dieses Systems zu führen, die jährlich zugänglich sind.

---

## 5. Nutzungsregeln – Interessenkonflikte, Vertraulichkeit, Umgehungsverbot

5.1. **Interessenkonflikte.** Der Anwalt führt vor jeder Beratung eine angemessene Konfliktprüfung durch. Im Falle eines Konflikts zieht er sich zurück und informiert den Nutzer.

5.2. **Berufsgeheimnis & Vertraulichkeit.** Der Anwalt wahrt Vertraulichkeit und Berufsgeheimnis gemäß dem im Einsatzland geltenden Recht.

**Aufzeichnungsrichtlinie für Anrufe:**
- (a) **Standardmäßig** zeichnet SOS Expat den Audio-Inhalt der Anrufe zwischen Anwalt und Nutzer **NICHT auf**. Es werden nur **technische Metadaten** gespeichert (Zeitstempel, Dauer, Twilio-IDs, Verbindungsstatus) für Abrechnung, Betrugsbekämpfung und Lösung technischer Streitigkeiten;
- (b) SOS Expat **aktiviert keine Audioaufzeichnung ohne die ausdrückliche, vorherige und gesonderte Einwilligung sowohl des Anwalts ALS AUCH des Nutzers**, die vor Beginn des Anrufs durch eine eigenständige aktive Handlung erklärt wird. Eine Aufzeichnung darf von SOS Expat nicht einseitig ausgelöst werden, mit der einzigen Ausnahme einer **ordnungsgemäßen Anordnung einer zuständigen Justizbehörde des Landes des Anwalts oder des Nutzers**, die die in dieser Rechtsordnung erforderlichen Garantien des ordre public bietet (insbesondere im Hinblick auf das anwaltliche Berufsgeheimnis);
- (c) Wenn ausnahmsweise im Rahmen von (b) eine Aufzeichnung aktiviert wird, wird sie für die zur Erreichung ihres Zwecks unbedingt erforderliche Dauer aufbewahrt, höchstens jedoch **sechs (6) Monate** (vorbehaltlich einer durch ein laufendes Gerichtsverfahren angeordneten Verlängerung), gemäß DSGVO und den Empfehlungen der lokalen Datenschutzbehörden;
- (d) **Der Anwalt selbst ist verpflichtet**, die Gespräche nicht aufzuzeichnen, vollständig zu transkribieren, offenzulegen oder zu anderen Zwecken als der vereinbarten Dienstleistung zu verwenden, außer mit schriftlicher Genehmigung des Nutzers oder gesetzlicher Verpflichtung;
- (e) **Das Berufsgeheimnis bleibt unverletzt**: Eine etwaige Aufzeichnung durch SOS Expat darf nicht gegen den Anwalt oder Nutzer in Verletzung der für das Berufsgeheimnis geltenden berufsrechtlichen Regeln verwendet werden.

5.3. **Umgehungsverbot.** SOS Expat erhält keine Provision auf Honorare. Jede neue Vermittlung mit einem neuen Nutzer über die Plattform löst die Vermittlungsgebühr aus. Es ist verboten, die Plattform zu umgehen, um diese Gebühren bei einer neuen Einführung zu vermeiden.

5.4. **Verbotene Handlungen.** Identitäts-/Titelmissbrauch, illegale Inhalte, Manipulation, Kollusion/Boykott zum Nachteil der Plattform, Verstöße gegen Sanktions- oder Exportgesetze oder jegliche illegale Aktivität.

5.5. **Verfügbarkeit.** Die Plattform wird „wie besehen“ bereitgestellt; keine Garantie für ununterbrochene Verfügbarkeit (Wartung, Störungen, höhere Gewalt). Der Zugang kann gesetzlich eingeschränkt werden.

---

## 6. Beziehung Anwalt–Nutzer (außerhalb der Plattform)

6.1. Nach der Vermittlung können Anwalt und Nutzer außerhalb der Plattform einen Vertrag schließen (SOS Expat ist nicht an der Festsetzung oder dem Einzug der Honorare beteiligt, außer beim unten beschriebenen Einmalzahlungsmechanismus).

6.2. Der Anwalt übermittelt seine Honorarvereinbarung gemäß dem lokalen Recht, erhebt/entrichtet anfallende Steuern und hält die lokalen Vorschriften (Werbung, Akquise, Interessenkonflikte, Verbraucherschutz) ein.

6.3. SOS Expat ist nicht verantwortlich für die Qualität, Richtigkeit oder das Ergebnis der Beratung des Anwalts.

---

## 7. Gebühren, Einmalzahlung und Steuern

7.1. **Vermittlungsgebühr (Vergütung der Plattform).** Die Vermittlungsgebühr vergütet **ausschließlich die technische Vermittlungsleistung**, die SOS Expat dem **Nutzer** erbringt. Sie wird **vom Nutzer geschuldet** und **nicht vom Anwalt**. Ihre Höhe wird in der **jeweils geltenden Gebührenordnung** festgelegt, die im persönlichen Bereich des Anwalts einsehbar ist, je Vermittlung, exkl. Steuern und Zahlungsdienstleistergebühren. Jede Änderung der Gebührenordnung erfolgt unter den Bedingungen des Artikels 2.5 (Mindestvorankündigung von fünfzehn (15) Tagen). Dem Anwalt wird empfohlen, die geltende Gebührenordnung regelmäßig einzusehen.

7.2. **Rechtliche Qualifikation der Zahlung — zwei eigenständige und voneinander unabhängige Schulden.** Die vom Nutzer über die Plattform geleistete Zahlung gliedert sich **rechtlich in zwei eigenständige und voneinander unabhängige Schulden**, auch wenn sie aus betrieblicher Zweckmäßigkeit in einem einzigen Einzug abgewickelt werden:
- (a) **Schuld « Vermittlung »**: Betrag, den **der Nutzer SOS Expat** für die technische Vermittlungsleistung schuldet (Vermittlungsgebühr, Art. 7.1);
- (b) **Schuld « Honorare »**: Betrag, den **der Nutzer dem Anwalt** für das Honorar der zwischen ihnen vereinbarten Rechtsdienstleistung schuldet. Die Honorarvereinbarung sowie der Inhalt und die Qualität der Leistung unterliegen **ausschließlich** dem Verhältnis Anwalt–Nutzer außerhalb der Plattform (Art. 6 und 13.5).

**SOS Expat erhebt keinerlei Provision, Rückvergütung, Beteiligung, Prozentsatz oder Anteil am Anwaltshonorar, fordert ebensolche nicht und hat keinen Anspruch darauf — insbesondere nicht in Rechtsordnungen, deren berufsrechtliche Vorschriften eine Honorarteilung mit einem Nicht-Anwalt verbieten. Die Vermittlungsgebühr stellt die einzige Vergütung von SOS Expat dar und stammt ausschließlich aus der unter (a) genannten Schuld des Nutzers.**

Der Zahlungsdienstleister, der für den Teil (b) als **Zahlstelle des Anwalts** handelt, leitet die vereinnahmten Honorare unter Abzug ausschließlich der Bankbearbeitungsgebühren und gegebenenfalls der Währungsumrechnungsgebühren (Art. 7.3 und 7.4) an den Anwalt weiter. **Der Nettobetrag, den der Anwalt erhält, wird in seinem Dashboard vor und nach jeder Transaktion angezeigt**, sodass der Anwalt die Vermittlung in Kenntnis der Sachlage annehmen oder ablehnen kann.

7.3. **Bankgebühren des Zahlungsdienstleisters.** Der Zahlungsdienstleister — **Stripe Payments Europe Ltd.** (Irland, EU, PCI-DSS Level 1 zertifiziert) **oder PayPal (Europe) S.à r.l. et Cie, S.C.A.** (Luxemburg, EU, PCI-DSS zertifiziert), abhängig vom Wohnsitzland und Verfügbarkeit — erhebt Bearbeitungsgebühren für jede Transaktion. **Diese Bankgebühren gehen vollständig zulasten des Anwalts** und werden automatisch von dem ihm überwiesenen Betrag abgezogen. Details zu diesen Gebühren sind in den Bedingungen des Zahlungsdienstleisters (Stripe: stripe.com/de/pricing; PayPal: paypal.com/de/webapps/mpp/merchant-fees) und im Dashboard des Anwalts für jede Transaktion verfügbar.

7.4. **Wechselkurs- und Währungsumrechnungsgebühren.** Wenn die Zahlungswährung des Nutzers von der Währung des Bankkontos des Anwalts abweicht, werden vom Zahlungsdienstleister **Währungsumrechnungsgebühren** erhoben. **Diese Wechselgebühren gehen vollständig zulasten des Anwalts** und werden von dem ihm überwiesenen Betrag abgezogen. Die angewandten Wechselkurse sind die des Zahlungsdienstleisters zum Zeitpunkt der Überweisung. Der Anwalt erkennt an und akzeptiert ausdrücklich, dass SOS Expat keine Kontrolle über diese Wechselkurse hat und jede Haftung für Währungsschwankungen oder vom Dienstleister erhobene Gebühren ablehnt.

7.5. **Berechnung des an den Anwalt überwiesenen Nettobetrags.** Der an den Anwalt überwiesene Nettobetrag entspricht der **Schuld « Honorare »**, die der Nutzer dem Anwalt schuldet (Art. 7.2.b), unter Abzug **ausschließlich** von: (i) den **Bankgebühren** des Zahlungsdienstleisters, die auf den Teil « Honorare » entfallen (Art. 7.3), und (ii) gegebenenfalls den **Währungsumrechnungsgebühren** (Art. 7.4). **Die Vermittlungsgebühr (Art. 7.2.a) wird in keinem Fall vom Honorar abgezogen**: Sie wird im Rahmen einer eigenständigen Schuld des Nutzers gegenüber SOS Expat erhoben. **Der Anwalt wird vor jeder Leistung in seinem Dashboard über den genauen Betrag informiert, den er erhalten wird, und kann so eine fundierte Entscheidung treffen, ob er die Vermittlung annimmt oder nicht.**

7.6. **Fälligkeit & Nicht-Erstattung.** Die Vermittlungsgebühr wird mit der effektiven Vermittlung fällig und ist **nicht erstattungsfähig** (außer aus Kulanz von SOS Expat bei einem Fehler, der ausschließlich der Plattform zuzuschreiben ist, soweit gesetzlich zulässig).

7.7. **Rückzahlung an den Nutzer.** Wird einem Nutzer eine Rückzahlung gewährt, wird diese vom Anteil des Anwalts abgezogen: SOS Expat kann den entsprechenden Betrag mit zukünftigen Zahlungen an den Anwalt verrechnen oder eine direkte Rückzahlung verlangen, falls keine Zahlungen ausstehen. Die Vermittlungsgebühr verbleibt bei SOS Expat, sofern nicht nach eigenem Ermessen anders entschieden.

7.8. **Zahlungsfristen des Anwalts je nach Kanal.** Vorbehaltlich des Abschlusses des KYC-Prozesses (Artikel 8) unterscheiden sich die Auszahlungsfristen für die Nettovergütung des Anwalts je nach Kanal der Vermittlung:
- (a) **B2C-Vermittlungen** (Direktzahlung durch den Nutzer): Die Vergütung des Anwalts wird **unmittelbar nach Beendigung des Anrufs** durch den Zahlungsdienstleister zur Auszahlung freigegeben, vorbehaltlich allein der technischen Bearbeitungsfristen für Bankenverarbeitung, Betrugsprävention und Zahlungsabwicklung des Dienstleisters (typischerweise ein (1) bis sieben (7) Werktage je nach Land des Anwalts und Reife seines Kontos beim Dienstleister);
- (b) **B2B-Vermittlungen** (Zahlung durch den B2B-Partner): Aufgrund des für den B2B-Partner geltenden aufgeschobenen Abrechnungsmodells (monatliche Abrechnung oder „Net-30") wird die Vergütung des Anwalts **innerhalb von dreißig (30) Tagen** nach dem Datum des Anrufs ausgezahlt;
- (c) In allen Fällen kann die Zahlung im Falle eines Streitfalls, einer Beschwerde des Nutzers oder des Partners, einer laufenden KYC-/AML-Prüfung oder unter sonstigen in diesen AGB vorgesehenen Umständen ausgesetzt werden.

7.9. **Steuern.** Der Anwalt bleibt **allein verantwortlich** für alle seine steuerlichen Verpflichtungen (Einkommensteuer, Umsatzsteuer, Sozialabgaben, Berufsbeiträge usw.) in seiner Wohnsitz- und/oder Tätigkeitsjurisdiktion. Die an den Anwalt überwiesenen Beträge sind **Bruttobeträge**; der Anwalt ist für die Anmeldung und Zahlung aller anfallenden Steuern verantwortlich. SOS Expat erhebt und führt, soweit gesetzlich vorgeschrieben, Umsatzsteuer/lokales Äquivalent nur auf die Vermittlungsgebühr ab.

7.10. **Verrechnung.** SOS Expat kann jeden Betrag, den der Anwalt schuldet (aufgrund einer Nutzererstattung, Strafe oder anderer Verpflichtung), mit jedem dem Anwalt geschuldeten Betrag verrechnen.

7.11. **Gebührentransparenz und Historie.** Der Anwalt kann jederzeit in seinem persönlichen Dashboard einsehen: (i) vollständige Details zu jeder Transaktion, (ii) den vom Nutzer gezahlten Bruttobetrag, (iii) die abgezogene Vermittlungsgebühr, (iv) die Bankgebühren des Zahlungsdienstleisters, (v) ggf. Wechselgebühren, (vi) den überwiesenen oder zu überweisenden Nettobetrag und (vii) die Historie aller seiner Transaktionen. Diese Informationen werden während der gesamten Kontolaufzeit und **fünf (5) Jahre** nach dessen Schließung aufbewahrt und sind zugänglich.

---

7.12. **Automatische steuerliche Meldung (DAC7-Richtlinie — EU 2021/514).** Anwälte mit Wohnsitz in einem Mitgliedstaat der Europäischen Union werden darauf hingewiesen, dass SOS Expat als meldepflichtiger Plattformbetreiber verpflichtet ist, den zuständigen Steuerbehörden **jährlich** (gemäß der Richtlinie (EU) 2021/514 « DAC7 ») die Informationen zu in der EU ansässigen aktiven Anwälten zu melden, insbesondere: Name, Anschrift, Steueridentifikationsnummer (TIN), Wohnsitzstaat, Gesamtbetrag der über die Plattform vereinnahmten Vergütungen sowie Anzahl der Vermittlungen, aufgeschlüsselt nach Kalenderquartal. Der Anwalt verpflichtet sich, diese Informationen in seinem persönlichen Bereich bereitzustellen und aktuell zu halten. Die Nichtmitteilung oder unterbliebene Aktualisierung kann gemäß den DAC7-Bestimmungen zur Aussetzung der Zahlungen bis zur Regularisierung führen.

7.13. **B2B-Kanal — Vermittlungen über einen B2B-Partner.**

(a) **Anwendungsbereich.** Eine B2B-Vermittlung wird von einem B2B-Nutzer ausgelöst, der von einem zwischen SOS Expat und einem B2B-Partner geschlossenen Rahmenvertrag begünstigt wird (Art. 1).

(b) **Anpassung der zwei Schulden.** Der Mechanismus der zwei Schulden (Art. 7.2) gilt im B2B-Kontext wie folgt:
- die **Schuld « Vermittlung »** wird vom **B2B-Partner** an SOS Expat geschuldet (ganz oder teilweise nach Maßgabe des Rahmenvertrags), sodass der **B2B-Nutzer in der Regel nichts zahlt** oder lediglich eine etwaige Zuzahlung an SOS Expat leistet;
- die **Schuld « Honorare »** wird weiterhin vom **Endnutzer** dem **Anwalt** geschuldet, es sei denn, der Rahmenvertrag sieht ausdrücklich eine vollständige oder teilweise Übernahme der Honorare durch den B2B-Partner vor (in diesem Fall wird der Partner für den übernommenen Teil dem Anwalt gegenüber zahlungspflichtig, über den Zahlstellenmechanismus des Art. 7.2).
- Der Anwalt ist in keinem Fall davon befreit, eine seiner lokalen Berufsordnung entsprechende Honorarvereinbarung zu unterzeichnen (Art. 6.2).

(c) **Unterschiedliche Anwaltsvergütung B2C / B2B — der Anwalt akzeptiert dies ausdrücklich.** Der Anwalt **erkennt an und akzeptiert ausdrücklich**, dass **die Nettovergütung, die er für eine B2B-Vermittlung erhält, von der für eine B2C-Vermittlung erhaltenen Vergütung abweichen kann**, sei es nach oben oder nach unten (z. B.: mit dem Partner verhandelte Pauschalvergütung, Berücksichtigung eines garantierten Volumens, vollständige oder teilweise Übernahme der Honorare durch den Partner oder dem Partner gewährter Rabatt). Der **Ursprungskanal (B2C oder B2B)** und der **genaue Betrag**, den der Anwalt erhalten wird, werden **vor jeder Vermittlung in seinem Dashboard angezeigt**, sodass er sie frei und in voller Kenntnis der Sachlage annehmen oder ablehnen kann. **Keinerlei Annahmepflicht** trifft den Anwalt aufgrund des Kanals oder des angebotenen Tarifs.

(d) **Nichtdurchsetzbarkeit des B2B-Rahmenvertrags gegenüber dem Anwalt.** Die Bestimmungen des zwischen SOS Expat und dem B2B-Partner geschlossenen Rahmenvertrags **sind dem Anwalt nicht entgegenzuhalten**; ausschließlich diese AGB und die im Dashboard des Anwalts angezeigten Informationen regeln die Beziehung zwischen SOS Expat und dem Anwalt im Rahmen einer B2B-Vermittlung.

(e) **Alle übrigen Bestimmungen dieser AGB gelten** für B2B-Vermittlungen.

(f) **Zum Zeitpunkt dieser AGB geltende Vergütungssätze (zur Information).** Zum Datum der letzten Aktualisierung dieser AGB gelten folgende Nettovergütungssätze des Anwalts:
- **B2C-Vermittlung**: **dreißig Euro (30 €) oder dreißig US-Dollar (30 USD)** netto pro angenommener und durchgeführter Vermittlung, je nach Abrechnungswährung;
- **B2B-Vermittlung**: **zwanzig Euro (20 €) oder zwanzig US-Dollar (20 USD)** netto pro angenommener und durchgeführter Vermittlung, je nach Abrechnungswährung.

Diese Beträge sind **indikativ** und spiegeln die zum Zeitpunkt der Aktualisierung dieser AGB geltende Vergütungsordnung wider. Die **aktuelle Vergütungsordnung** ist im Dashboard des Anwalts vor jeder Vermittlung jederzeit einsehbar. Jede Änderung unterliegt der in Artikel 7.14 vorgesehenen Ankündigungsfrist von fünfzehn (15) Tagen.

7.14. **Änderung der Anwaltsvergütungsordnung.** SOS Expat behält sich das Recht vor, **jederzeit die Nettovergütungsordnung des Anwalts zu ändern**, sei es:
- (i) die **B2C-Vergütungsordnung** — durch Änderung der Vermittlungsgebühren oder ihrer Struktur (was sich auf den vom Anwalt erhaltenen Nettobetrag auswirkt);
- (ii) die **B2B-Vergütungsordnung** — durch Änderung der für B2B-Vermittlungen geltenden pauschalen oder variablen Vergütung;
- (iii) oder jeder andere Bestandteil der Nettovergütung (z. B.: Währungen, Volumenstufen, Senioritätsstufen).

Jede Änderung unterliegt der in Artikel 2.5 vorgesehenen **Mindestvorankündigungsfrist von fünfzehn (15) Tagen**, die dem Anwalt auf einem dauerhaften Datenträger mitgeteilt wird (E-Mail an die registrierte Adresse und Veröffentlichung in seinem persönlichen Bereich). Während der Vorankündigungsfrist kann der Anwalt seine Beziehung zur Plattform **ohne Vertragsstrafe kündigen** oder weiterhin **im Einzelfall Vermittlungen ablehnen**, deren Vergütung ihm nicht mehr zusagt, wobei darauf hingewiesen wird, dass **der Anwalt niemals zur Annahme einer Vermittlung verpflichtet ist**. **Bereits vor Ablauf der Vorankündigungsfrist angenommene Vermittlungen werden weiterhin zum am Annahmetag geltenden Tarif vergütet.** Erfolgt keine Kündigung, gilt die fortgesetzte Nutzung der Plattform nach Ablauf der Vorankündigungsfrist als Annahme der neuen Vergütungsordnung.

---

## 8. Zahlungen – KYC/AML – Sanktionen

8.1. **Zahlungsdienstleister.** Zahlungen werden **ausschließlich** über **PCI-DSS-zertifizierte** Drittanbieter abgewickelt: **Stripe Payments Europe Ltd.** (Irland, EU) und/oder **PayPal (Europe) S.à r.l. et Cie, S.C.A.** (Luxemburg, EU). Der jeweilige Dienstleister hängt vom Wohn-/Tätigkeitsland des Anwalts ab (Stripe deckt derzeit 44 Länder ab, PayPal 150+ Länder). Der Anwalt **akzeptiert ausdrücklich** die AGB und KYC/AML-Verfahren der anwendbaren Anbieter. **SOS Expat ist KEINE Bank, kein Zahlungsinstitut und kein Kreditinstitut**; SOS Expat ist lediglich ein gewerblicher Kunde der genannten Zahlungsdienstleister.

8.2. SOS Expat kann Zahlungen bei Verdacht auf Betrug, Nichtkonformität oder aufgrund gesetzlicher Anordnung zurückhalten, verzögern oder stornieren.

8.3. **Internationale Sanktionen und Embargos.** Der Anwalt erklärt und garantiert:
- (a) Nicht direkt oder indirekt auf einer **Sanktionsliste** zu stehen (OFAC/SDN, EU, UN, HMT oder jede andere anwendbare Sanktionsliste);
- (b) Nicht direkt oder indirekt im Eigentum oder unter der Kontrolle einer Person oder Einrichtung zu stehen, die auf einer Sanktionsliste steht;
- (c) Kein Einwohner oder Staatsangehöriger eines **Landes oder Gebiets zu sein, das einem umfassenden Embargo oder umfassenden restriktiven Maßnahmen** nach den anwendbaren Gesetzen und Verordnungen unterliegt, insbesondere denen der Zahlungsdienstleister, der Europäischen Union, der Vereinten Nationen, der OFAC (USA), des HMT (Vereinigtes Königreich) oder einer anderen zuständigen Behörde, sich auch nicht dort aufzuhalten. Die jeweils aktuelle Liste dieser Länder und Gebiete wird von den vorgenannten Behörden geführt und ist maßgeblich; SOS Expat erstellt und veröffentlicht keine eigene geopolitische Liste;
- (d) Die Plattform nicht für Transaktionen zu nutzen, die sanktionierte Personen, Einrichtungen oder Länder betreffen;
- (e) Alle geltenden **Exportkontrollgesetze** einzuhalten.
SOS Expat behält sich das Recht vor, den Zugang zur Plattform in jedem von Sanktionen oder Embargos betroffenen Gebiet oder für jeden Anwalt, der verdächtigt wird, gegen diese Bestimmungen zu verstoßen, **sofort zu beschränken oder zu sperren**, ohne Vorankündigung oder Entschädigung. SOS Expat kann auch verpflichtet sein, die Gelder des Anwalts auf Anordnung einer zuständigen Behörde **einzufrieren**.

### Nicht beanspruchte Gelder und KYC-Verifizierung

8.4. **Pflicht zur Vervollständigung des Verifizierungsprozesses (KYC).** Um Zahlungen aus über die Plattform erbrachten Leistungen zu erhalten, verpflichtet sich der Anwalt, den Identitätsverifizierungsprozess (KYC - Know Your Customer) beim anwendbaren Zahlungsdienstleister (**Stripe** oder **PayPal**, je nach Wohnsitzland) schnellstmöglich nach der Registrierung abzuschließen. Der Anwalt erkennt an, dass das Fehlen einer vollständigen KYC-Verifizierung die Überweisung von Geldern auf sein Bankkonto oder PayPal-Konto technisch verhindert.

8.5. **Verwahrung ausstehender Gelder.** Wenn ein Nutzer eine Zahlung für eine Leistung leistet, die von einem Anwalt erbracht wurde, der seine KYC-Verifizierung nicht abgeschlossen hat, werden die dem Anteil des Anwalts entsprechenden Gelder (nach Abzug der Vermittlungsgebühr der Plattform) auf einem Treuhandkonto verwahrt. Die Plattform verpflichtet sich:
- Den Anwalt per E-Mail über das Vorhandensein ausstehender Gelder zu benachrichtigen;
- Regelmäßige Erinnerungen zu senden (nach 7, 30, 60, 90, 120 und 150 Tagen);
- Dem Anwalt alle erforderlichen Mittel zur Verfügung zu stellen, um seine KYC-Verifizierung abzuschließen.

8.6. **Lang andauernd zurückgehaltene Gelder — Verwaltungsgebühren und Übertragung an die zuständigen Behörden.** Wird die KYC-Verifizierung nicht innerhalb von **einhundertachtzig (180) Tagen** ab der ersten zurückgehaltenen Zahlung abgeschlossen und trotz der in Artikel 8.5 vorgesehenen Benachrichtigungen:
- (a) **Pauschale Verwaltungsgebühren.** SOS Expat kann von den zurückgehaltenen Geldern **angemessene pauschale Verwaltungsgebühren in Höhe von höchstens zehn Prozent (10 %) des einbehaltenen Betrags** abziehen, die ausschließlich die tatsächlichen Verwaltungskosten der Aufbewahrung, der Kontaktversuche und der buchhalterischen Bearbeitung abdecken;
- (b) **Verlängerte Verwahrung.** Der Restbetrag verbleibt auf dem Treuhandkonto des Zahlungsdienstleisters (oder wird von SOS Expat hinterlegt, wenn die technischen Bedingungen dies erfordern). Der Anwalt kann während dieser Phase jederzeit sein KYC abschließen und die Gelder beanspruchen;
- (c) **Übertragung an die zuständigen Behörden (herrenloses Gut).** Nach Ablauf einer Gesamtfrist von **fünf (5) Jahren** ab der ersten zurückgehaltenen Zahlung werden die Restgelder mangels gültiger Geltendmachung **an die zuständige Behörde des Wohnsitzlandes des Anwalts** im Rahmen der für herrenlose Gelder anwendbaren Vorschriften **übertragen** (zum Beispiel in Frankreich an die Caisse des dépôts gemäß Eckert-Gesetz; in den USA an das Unclaimed-Property-Programm des zuständigen Bundesstaates; im Vereinigten Königreich an das Dormant Assets Scheme; und allgemein an den entsprechenden lokalen Mechanismus). **SOS Expat eignet sich diese Restgelder in keinem Fall an.**

8.7. **Anspruch während der verlängerten Verwahrung.** Der Anwalt kann jederzeit während der Phase der verlängerten Verwahrung (b) einen begründeten Anspruchsantrag über das Kontaktformular an SOS Expat richten, begleitet von einer **vollständigen KYC-Verifizierung** (KYC ist eine technische Voraussetzung, die vom Zahlungsdienstleister sowie durch Geldwäsche- und Terrorismusfinanzierungsbekämpfungspflichten auferlegt wird). SOS Expat prüft den Antrag innerhalb von **dreißig (30) Tagen**. Im Falle der Annahme werden die Gelder unter Abzug ausschließlich der unter (a) genannten Verwaltungsgebühren ausgezahlt. Bei ordnungsgemäß nachgewiesener höherer Gewalt oder dokumentierter medizinischer Arbeitsunfähigkeit können diese Gebühren nach billigem Ermessen von SOS Expat reduziert oder erlassen werden.

8.8. **Ausdrückliche Annahme.** Mit der Registrierung auf der Plattform erklärt der Anwalt, die Modalitäten des vorliegenden Artikels 8 zur Kenntnis genommen zu haben und akzeptiert sie ausdrücklich. Diese Annahme stellt eine wesentliche Bedingung für den Zugang zum Anbieterstatus dar.

---

## 9. Personenbezogene Daten (globaler Rahmen – GDPR/DSA)

9.1. **Rollen.** Für Nutzerdaten, die zum Zweck der Vermittlung verarbeitet werden, handeln SOS Expat und der Anwalt jeweils als eigenständige Verantwortliche für ihre jeweiligen Zwecke, gemäß der **Verordnung (EU) 2016/679 (DSGVO/GDPR)**.

9.2. **Rechtsgrundlagen & Zwecke.** Vertragserfüllung (Vermittlung), berechtigte Interessen (Sicherheit, Betrugsprävention, Verbesserung), gesetzliche Verpflichtungen (AML, Sanktionen) und ggf. Einwilligung.

9.3. **Internationale Übermittlungen** mit angemessenen Garantien, sofern erforderlich (Standardvertragsklauseln, Angemessenheitsbeschluss usw.).

9.4. **Rechte & Kontakt.** Ausübung der Rechte (Auskunft, Berichtigung, Löschung, Übertragbarkeit, Widerspruch) über das Kontaktformular der Plattform.

9.5. **Sicherheit.** Angemessene technische/organisatorische Maßnahmen; Meldung von Datenschutzverletzungen gemäß geltendem Recht (72 Stunden gemäß DSGVO).

9.6. Der Anwalt verarbeitet die erhaltenen Daten gemäß dem Recht des Einsatzlandes und seiner Berufsordnung (Berufsgeheimnis).

9.7. **DSA-Konformität.** Die Plattform fungiert als **Vermittlungsdienst** im Sinne der **Verordnung (EU) 2022/2065 (Gesetz über digitale Dienste)**. SOS Expat implementiert Mechanismen zur Meldung illegaler Inhalte und kooperiert mit den zuständigen Behörden gemäß dem DSA.

---

## 10. Geistiges Eigentum

Die Plattform, ihre Marken, Logos, Datenbanken und Inhalte sind geschützt. Es werden keine Rechte an den Anwalt übertragen, außer einem persönlichen, nicht exklusiven, nicht übertragbaren Zugangsrecht während der Laufzeit dieser AGB. Inhalte, die vom Anwalt bereitgestellt werden (Profil, Foto, Beschreibungen), werden SOS Expat mit einer weltweiten, nicht exklusiven Lizenz zur Speicherung und Anzeige auf der Plattform eingeräumt.

---

## 11. Garantien, Haftung und Freistellung

11.1. Keine Garantie in Bezug auf juristische Dienstleistungen; SOS Expat garantiert weder Ergebnis, Qualität noch Geschäftsvolumen.

11.2. Plattform „wie besehen“; keine Garantie für ständige Verfügbarkeit.

11.3. **Haftungsbeschränkung**: Soweit gesetzlich zulässig, ist die Gesamthaftung von SOS Expat gegenüber dem Anwalt auf direkte Schäden beschränkt und darf den Gesamtbetrag der von SOS Expat im Zusammenhang mit der betreffenden Transaktion erhobenen Vermittlungsgebühren nicht überschreiten.

11.4. **Ausschlüsse**: keine Haftung für indirekte/folgende/besondere/punitive Schäden (z. B. entgangener Gewinn, Kundenverlust, Rufschaden usw.).

11.5. **Freistellung**: Der Anwalt stellt SOS Expat (und dessen verbundene Unternehmen, Führungskräfte, Mitarbeiter, Vertreter) von allen Ansprüchen/Schäden/Kosten (einschließlich Anwaltskosten) frei, die sich aus (i) Verstößen gegen die AGB/Gesetze, (ii) seinen Inhalten, (iii) seinen Beratungen oder Unterlassungen ergeben.

11.6. **Verzicht auf Ansprüche.** Der Anwalt **verzichtet ausdrücklich und unwiderruflich** auf alle Ansprüche gegen SOS Expat wegen (i) Schäden aus der Erbringung von Rechtsdienstleistungen, (ii) indirekter Verluste, (iii) vertraglicher Streitigkeiten mit Nutzern, (iv) jeglicher Mängel der vom Anwalt erbrachten Leistungen. Dieser Verzicht gilt im gesetzlich zulässigen Umfang.

11.7. Keine Vertretung: Nichts hierin begründet ein Mandats-, Arbeits-, Partner- oder Joint-Venture-Verhältnis zwischen SOS Expat und dem Anwalt.

11.8. **Höhere Gewalt.** SOS Expat haftet nicht für Verzögerungen oder Ausfälle aufgrund von **höherer Gewalt** (Naturkatastrophe, Krieg, Pandemie, Cyberangriff, Strom- oder Internetausfall, behördliche Anordnung, Streik usw.).

11.9. **Fortbestand von Klauseln.** Die folgenden Artikel bleiben nach Beendigung oder Ablauf der AGB unabhängig von der Ursache in Kraft: Artikel 2 (Annahmenachweise), 3.5 (Erklärungen), 5 (Nutzungsregeln), 7 (Gebühren und Zahlungen), 8 (KYC und Sanktionen), 9 (personenbezogene Daten), 10 (geistiges Eigentum), 11 (Haftung und Freistellung), 12 (anwendbares Recht und Schiedsgerichtsbarkeit), 13 (Schutzklauseln) und 14 (Verschiedenes). Diese Klauseln bleiben so lange in Kraft, wie es zur Entfaltung ihrer Wirkung erforderlich ist.

---

## 12. Anwendbares Recht – Schiedsgerichtsbarkeit – Estnische Gerichtsbarkeit – Sammelklagen

12.1. **Anwendbares Recht und Vorrang des lokalen Berufsrechts.** Diese AGB, ihre Auslegung, Gültigkeit und Durchführung unterliegen ausschließlich dem **estnischen Recht** unter Ausschluss seiner Kollisionsnormen. **Zur Vermeidung jeglicher Mehrdeutigkeit** gelten die berufsrechtlichen Regeln des Anwaltsberufs, die im Einsatzland und/oder im Land der Kammerzulassung des Anwalts anwendbar sind (insbesondere in Bezug auf das Berufsgeheimnis, das Verbot der Honorarteilung mit einem Nicht-Anwalt, die Regulierung von Werbung und Mandantenakquise, Interessenkonflikte und die Verwaltung von Mandantengeldern), als **zwingendes Recht (ordre public)** und gehen jeder gegenteiligen oder mehrdeutigen Bestimmung dieser AGB **vor**. Keine Klausel der AGB darf so ausgelegt werden, dass sie dem Anwalt ein Verhalten auferlegt oder gestattet, das gegen sein lokales Berufsrecht verstößt; im Konfliktfall enthält sich der Anwalt und unterrichtet SOS Expat unverzüglich.

12.2. **Verbindliches internationales Schiedsverfahren.** Jeder Streit, jede Meinungsverschiedenheit oder jeder Anspruch, der sich aus diesen AGB ergibt oder damit zusammenhängt, einschließlich ihrer Gültigkeit, Auslegung, Durchführung oder Beendigung, wird endgültig durch **Schiedsverfahren** gemäß der Schiedsgerichtsordnung der **Internationalen Handelskammer (ICC)** entschieden.
- **Sitz des Schiedsverfahrens**: Tallinn, Estland;
- **Sprache des Schiedsverfahrens**: **Englisch**;
- **Anzahl der Schiedsrichter**: ein (1) Einzelschiedsrichter, es sei denn, der Streitwert übersteigt 100.000 €, in welchem Fall drei (3) Schiedsrichter;
- **Materielles Recht**: estnisches Recht (Art. 12.1);
- **Verfahren**: vertraulich. Die Parteien verpflichten sich, die Existenz, den Inhalt oder das Ergebnis des Schiedsverfahrens nicht offenzulegen, es sei denn, dies ist gesetzlich vorgeschrieben oder zur Vollstreckung des Schiedsspruchs erforderlich.
Der Schiedsspruch ist für die Parteien **endgültig und bindend**. Die Parteien verzichten im gesetzlich zulässigen Umfang auf jeden Aufhebungsantrag.

12.3. **Verzicht auf Sammelklagen und Geschworenengerichte.** Im größtmöglichen gesetzlich zulässigen Umfang:
- (a) Der Anwalt verzichtet auf die Teilnahme an **Sammelklagen, Gruppenklagen oder Vertretungsklagen** gegen SOS Expat;
- (b) Jeder Streit wird **ausschließlich individuell** beigelegt;
- (c) Der Anwalt verzichtet ausdrücklich auf jedes **Recht auf ein Geschworenengericht** (Jury Trial Waiver);
- (d) Der Anwalt verzichtet auf **Class Actions, Consolidated Actions oder Representative Actions** nach US-amerikanischem Recht oder gleichwertigem Recht.

12.4. **Ausschließliche Zuständigkeit estnischer Gerichte.** Für nicht schiedsfähige Ansprüche nach anwendbarem Recht, für dringende einstweilige Maßnahmen vor Konstituierung des Schiedsgerichts und für die Vollstreckung von Schiedssprüchen sind die **Gerichte in Tallinn (Estland)** **ausschließlich zuständig**. Der Anwalt:
- (a) Stimmt dieser Zuständigkeit unwiderruflich zu;
- (b) Verzichtet auf jede Einrede des **Forum non conveniens**;
- (c) Verzichtet auf jede Einrede der fehlenden persönlichen Zuständigkeit;
- (d) Akzeptiert, dass jede Zustellung an die auf der Plattform registrierte E-Mail-Adresse erfolgen kann.

12.5. **Obligatorische vorherige Mediation und benannte Mediatoren (P2B-Verordnung).** Vor jedem Schiedsverfahren verpflichten sich die Parteien, den Streit gütlich durch **Verhandlung in gutem Glauben** für einen Zeitraum von **dreißig (30) Tagen** ab schriftlicher Benachrichtigung des Streits beizulegen, die per E-Mail mit Empfangsbestätigung an die Kontaktadresse der anderen Partei gesendet wird. Gemäß Artikel 12 der Verordnung (EU) 2019/1150 benennt SOS Expat mindestens **zwei (2) spezialisierte, unabhängige und in zumutbarer Weise erreichbare Mediatoren**, unter denen der Anwalt wählen kann: **(i) das Centre de Médiation et d'Arbitrage de Paris (CMAP) — cmap.fr**; und **(ii) das WIPO Arbitration and Mediation Center (Genf) — wipo.int/amc**. SOS Expat trägt einen **angemessenen Anteil der Mediationskosten**, der nach Treu und Glauben einzelfallbezogen festgelegt wird, insbesondere bei geringen Streitwerten. Das Scheitern der Mediation ist Voraussetzung für die Einreichung eines Schiedsantrags.

12.6. **Verjährung.** Jede Klage oder jeder Anspruch des Anwalts gegen SOS Expat muss innerhalb der **kürzeren Frist von drei (3) Jahren** ab Eintritt des auslösenden Ereignisses **und der gesetzlichen Frist**, die in der Rechtsordnung des Anwalts gilt, erhoben werden, andernfalls erlischt der Anspruch. Diese Klausel hat weder den Zweck noch die Wirkung, Verjährungsfristen unter das zwingende Mindestmaß zu verkürzen, das in der betreffenden Rechtsordnung jeglicher vertraglichen Verkürzung entzogen ist; in einem solchen Fall gilt die örtliche gesetzliche Frist.

---

## 13. Internationale Schutzklauseln

13.1. **Antikorruption.** Der Anwalt verpflichtet sich, keine Bestechungsgelder oder unzulässige Vorteile an öffentliche oder private Amtsträger anzubieten, zu versprechen oder zu zahlen. Er hält die geltenden Antikorruptionsgesetze ein (FCPA, UK Bribery Act, Sapin-II-Gesetz usw.).

13.2. **Vertraulichkeit der Kommunikation.** Die über die Plattform geführte Kommunikation (Nachrichten, Telefonate) ist **vertraulich**. Der Anwalt verpflichtet sich, diese nicht aufzuzeichnen, offenzulegen oder für andere Zwecke als die vereinbarte Leistung zu verwenden, es sei denn, es liegt eine schriftliche Genehmigung oder eine gesetzliche Verpflichtung vor.

13.3. **Abwerbeverbot.** Während der Laufzeit dieser AGB und **zwölf (12) Monate** nach deren Beendigung darf der Anwalt Nutzer, die er über die Plattform kennengelernt hat, nicht direkt abwerben, um die Vermittlungsgebühren zu umgehen.

13.4. **Alleinige Verantwortung des Anwalts.** Der Anwalt ist **allein verantwortlich** für die Qualität, Richtigkeit und Rechtmäßigkeit der von ihm erbrachten Beratungen und Leistungen. Der Anwalt ist **vollständig verantwortlich** für die Einhaltung der gesetzlichen und regulatorischen Bestimmungen des Landes, in dem er tätig ist. SOS Expat **garantiert nicht** die vom Anwalt erteilte Rechtsberatung und **lehnt jede Haftung** für Schäden ab, die einem Nutzer aufgrund der Leistungen des Anwalts entstehen.

13.5. **Kein Beratungsverhältnis.** SOS Expat ist **keine Anwaltskanzlei** und kein Anbieter von Rechtsdienstleistungen. Die Plattform beschränkt sich auf die **Vermittlung**. Jedes Beratungsverhältnis wird **ausschließlich** zwischen dem Anwalt und dem Nutzer **außerhalb** von SOS Expat begründet. **Jeder Fall**, der mit einem Mandanten abgeschlossen wird, wird **außerhalb von SOS Expat** bearbeitet.

13.6. **Streitigkeiten zwischen Anwalt und Nutzer.** Jede Streitigkeit zwischen einem Anwalt und einem Nutzer fällt **ausschließlich** in deren direkte Beziehung. SOS Expat **greift nicht** in solche Streitigkeiten ein und **kann nicht** als Partei, Garant oder Vermittler in Anspruch genommen werden. SOS Expat ist **in keinem Fall verantwortlich** für Streitigkeiten zwischen Anwalt und Mandant.

---

## 14. Verschiedenes

14.1. **Abtretung**: SOS Expat kann die AGB an ein Konzernunternehmen oder einen Rechtsnachfolger übertragen; der Anwalt darf dies nur mit schriftlicher Zustimmung von SOS Expat.

14.2. **Gesamtheit**: Diese AGB stellen die vollständige Vereinbarung dar und ersetzen alle früheren Vereinbarungen zum selben Gegenstand.

14.3. **Mitteilungen**: Durch Veröffentlichung auf der Plattform, In-App-Benachrichtigung oder über das Kontaktformular.

14.4. **Auslegung**: Überschriften dienen nur der Übersicht. Keine Auslegungsregel contra proferentem.

14.5. **Sprachen**: Übersetzungen können bereitgestellt werden; für die Auslegung ist die englische Fassung maßgeblich.

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

  const defaultHi = `
# उपयोग की सामान्य शर्तें – वकील (वैश्विक)

**WorldExpat OÜ द्वारा SOS Expat** ( " **प्लेटफ़ॉर्म** ", " **SOS** ", " **हम** " )

**संस्करण 3.2 – अंतिम अद्यतन: 26 अप्रैल 2026**

---

## 1. परिभाषाएँ

**एप्लिकेशन / साइट / प्लेटफ़ॉर्म**: **WorldExpat OÜ** (एस्टोनियाई कानून के तहत पंजीकृत कंपनी, पंजीकरण संख्या 16885621, पंजीकृत कार्यालय: टालिन, एस्टोनिया) द्वारा संचालित डिजिटल सेवाएँ जो उपयोगकर्ताओं («**उपयोगकर्ता**») और विधिक पेशेवरों («**वकील**») के बीच संपर्क स्थापित करती हैं।

**वकील**: कोई भी विधिक पेशेवर जो कम से कम एक न्यायक्षेत्र में अभ्यास करने के लिए विधिवत अधिकृत है, चाहे उनका स्थानीय पदनाम कुछ भी हो: अधिवक्ता (भारत), avocat (फ्रांस, बेल्जियम, स्विट्जरलैंड), lawyer/attorney/counsel (अमेरिका, ब्रिटेन, राष्ट्रमंडल), solicitor/barrister (ब्रिटेन, आयरलैंड, ऑस्ट्रेलिया), abogado (स्पेन, लैटिन अमेरिका), Rechtsanwalt (जर्मनी, ऑस्ट्रिया, स्विट्जरलैंड), advogado (पुर्तगाल, ब्राज़ील), avvocato (इटली), advocaat (नीदरलैंड, बेल्जियम), адвокат/юрист (रूस, सीआईएस), 弁護士 (जापान), 律师 (चीन), या अभ्यास के न्यायक्षेत्र की पेशेवर संस्था या सक्षम प्राधिकारी द्वारा मान्यता प्राप्त कोई अन्य समकक्ष पदवी।

**संपर्क स्थापना**: प्लेटफ़ॉर्म द्वारा उपयोगकर्ता और वकील के बीच की गई तकनीकी/संचालनात्मक परिचय, जो (i) संपर्क विवरण के प्रसारण, (ii) संचार चैनल (कॉल, संदेश, वीडियो) खोलने, या (iii) प्लेटफ़ॉर्म के माध्यम से भेजे गए अनुरोध को वकील द्वारा स्वीकार करने के रूप में प्रकट होती है।

**हस्तक्षेप देश**: संपर्क स्थापना के समय अनुरोध द्वारा मुख्य रूप से लक्षित न्यायक्षेत्र। इसके अभाव में, अनुरोध के समय उपयोगकर्ता का निवास देश; एकाधिक न्यायक्षेत्रों के मामले में, अनुरोध के विषय से सबसे निकट से जुड़ा न्यायक्षेत्र।

**संपर्क शुल्क**: प्रत्येक संपर्क स्थापना के लिए (अनुच्छेद 7) **उपयोगकर्ता द्वारा SOS Expat को देय** पारिश्रमिक, केवल प्लेटफ़ॉर्म द्वारा प्रदत्त तकनीकी संपर्क सेवा के लिए। यह शुल्क किसी भी परिस्थिति में वकील के शुल्क पर कमीशन, प्रत्यागमन या भागीदारी नहीं है। इसकी राशि **प्रचलित शुल्क सूची** में परिभाषित है। SOS Expat अनुच्छेद 2.5 की शर्तों के तहत इस शुल्क सूची को संशोधित कर सकता है।

**अनुरोध**: उपयोगकर्ता द्वारा प्रस्तुत कानूनी स्थिति/परियोजना।

**भुगतान प्रदाता**: उपयोगकर्ता के एकमुश्त भुगतान को एकत्र करने और धन वितरित करने के लिए उपयोग की जाने वाली तृतीय-पक्ष सेवाएँ।

**B2B भागीदार**: कोई भी विधिक व्यक्ति (कंपनी, संघ, पारस्परिक बीमा कंपनी, कार्य समिति, फर्म, पेशेवर संगठन, आदि) जिसने SOS Expat के साथ एक पृथक रूपरेखा अनुबंध (फ्रेमवर्क कॉन्ट्रैक्ट) किया है, जो यह प्रावधान करता है कि वह अपने सदस्यों, कर्मचारियों या लाभार्थियों (« **B2B उपयोगकर्ता** ») के लिए संपर्क शुल्क का पूर्ण या आंशिक वित्तपोषण करेगा। **B2B संपर्क स्थापना** ऐसी संपर्क स्थापना है जो ऐसे रूपरेखा अनुबंध के तहत B2B उपयोगकर्ता द्वारा शुरू की जाती है। इसके विपरीत, **B2C संपर्क स्थापना** वह है जो ऐसे उपयोगकर्ता द्वारा शुरू की जाती है जो स्वयं संपर्क शुल्क का प्रत्यक्ष भुगतान करता है।

**प्रतिबंध सूचियाँ**: आर्थिक प्रतिबंधों या प्रतिबंधों के अधीन व्यक्तियों, संस्थाओं या देशों की सूचियाँ, विशेष रूप से OFAC (अमेरिका), यूरोपीय संघ, संयुक्त राष्ट्र, ब्रिटिश राजकोष (HMT), और किसी अन्य सक्षम प्राधिकारी की सूचियाँ।

---

## 2. उद्देश्य, दायरा और स्वीकृति

2.1. ये शर्तें वकीलों द्वारा प्लेटफ़ॉर्म तक पहुँच और उपयोग को नियंत्रित करती हैं।

2.2. SOS Expat केवल तकनीकी मध्यस्थ के रूप में कार्य करता है। SOS Expat विधिक अभ्यास नहीं करता, कानूनी सलाह प्रदान नहीं करता और वकील-उपयोगकर्ता संबंध का पक्ष नहीं है।

2.3. **इलेक्ट्रॉनिक स्वीकृति (click-wrap) और अनुरेखणीयता।** वकील पंजीकरण के दौरान संबंधित बॉक्स पर टिक करके और/या प्लेटफ़ॉर्म का उपयोग करके शर्तों को स्वीकार करता है। यह कार्य eIDAS विनियमन (EU) संख्या 910/2014 के अनुसार इलेक्ट्रॉनिक हस्ताक्षर और संविदात्मक सहमति के समान है। SOS Expat **समय-चिह्नित ऑडिट लॉग** बनाए रखता है जिसमें शामिल हैं: (i) स्वीकृति की सटीक तिथि और समय (UTC), (ii) वकील का IP पता, (iii) अद्वितीय सत्र पहचानकर्ता, (iv) ब्राउज़र user-agent, (v) स्वीकृत शर्तों का संस्करण, (vi) स्वीकृत दस्तावेज़ का क्रिप्टोग्राफिक हैश, और (vii) वकील का अद्वितीय पहचानकर्ता। ये लॉग शर्तों की स्वीकृति के **कानूनी रूप से बाध्यकारी साक्ष्य** हैं।

2.4. **स्वीकृति के साक्ष्य का संरक्षण।** GDPR और कानूनी अवधारण आवश्यकताओं के अनुसार, SOS Expat शर्तों की स्वीकृति के साक्ष्य स्वीकृति की तिथि से **दस (10) वर्षों** तक या किसी भी चल रहे विवाद के अंत तक (जो भी बाद में हो) बनाए रखता है। संपर्क फ़ॉर्म के माध्यम से लिखित अनुरोध पर, वकील उपर्युक्त साक्ष्य तत्वों वाला **स्वीकृति प्रमाणपत्र** प्राप्त कर सकता है।

2.5. **संशोधन (P2B पूर्वसूचना)।** SOS Expat किसी भी समय शर्तों/शुल्क सूची को अद्यतन कर सकता है, **न्यूनतम पंद्रह (15) दिन की पूर्वसूचना** के अधीन, जो वकील को टिकाऊ माध्यम पर भेजी जाएगी, विनियमन (EU) 2019/1150 (« P2B ») के अनुच्छेद 3 के अनुरूप। पूर्वसूचना अवधि कम/समाप्त की जा सकती है: (i) कानून द्वारा अधिरोपित परिवर्तन; (ii) सुरक्षा के अनिवार्य कारण; या (iii) आर्थिक प्रभाव रहित सुधार। पूर्वसूचना अवधि के दौरान, वकील **बिना दंड के संबंध समाप्त** कर सकता है। समाप्ति के अभाव में, निरंतर उपयोग स्वीकृति है। महत्वपूर्ण परिवर्तन पर वकील को 2.3 के अनुसार पुन: पुष्टि के लिए आमंत्रित किया जाएगा।

2.6. अवधि: अनिश्चितकालीन।

---

## 3. वकील की स्थिति – स्वतंत्रता, अनुपालन और घोषणाएँ

3.1. वकील एक स्वतंत्र पेशेवर के रूप में कार्य करता है; SOS Expat के साथ कोई रोज़गार, अधिदेश, एजेंसी, साझेदारी या संयुक्त उद्यम संबंध नहीं बनाया जाता।

3.2. वकील अकेले जिम्मेदार है: (i) अपनी डिग्री, पदवियाँ, बार/समकक्ष पंजीकरण और अभ्यास प्राधिकरणों के लिए; (ii) हस्तक्षेप देशों के लिए उपयुक्त और वैध व्यावसायिक दायित्व बीमा के लिए; (iii) स्थानीय कानूनों और पेशेवर नियमों (आचार संहिता, विज्ञापन/याचना, हितों का टकराव, पेशेवर गोपनीयता, AML/KYC, कराधान, उपभोक्ता संरक्षण, आदि) का पालन करने के लिए।

3.3. SOS Expat वकील की सलाह की सामग्री या गुणवत्ता की निगरानी या मूल्यांकन नहीं करता और इस संबंध में कोई जिम्मेदारी नहीं लेता।

3.4. **पेशेवर क्षमता (B2B)।** वकील घोषणा करता है कि वह विशेष रूप से पेशेवर उद्देश्यों के लिए कार्य कर रहा है। उपभोक्ता संरक्षण व्यवस्थाएँ SOS Expat-वकील संबंध पर लागू नहीं होती हैं।

3.5. **वकील की घोषणाएँ और आश्वासन।** प्लेटफ़ॉर्म पर पंजीकरण करके, वकील स्पष्ट रूप से घोषणा करता है और आश्वासन देता है कि:
- (a) वह अपने निवास और/या अभ्यास के देश के कानून के अनुसार **वयस्क** है;
- (b) उसके पास अनुबंध करने और अपने पेशे का अभ्यास करने की **पूर्ण कानूनी क्षमता** है;
- (c) वह संरक्षकता, अभिभावकता, न्यायिक सुरक्षा या किसी समकक्ष सुरक्षा व्यवस्था के अधीन नहीं है;
- (d) उस पर अपने पेशे का अभ्यास करने पर कोई **प्रतिबंध** नहीं है, अस्थायी या स्थायी;
- (e) उसे अपने बार या पेशेवर संगठन से बर्खास्त, निलंबित या निष्कासित नहीं किया गया है;
- (f) उसके खिलाफ कोई **अनुशासनात्मक कार्यवाही चल नहीं रही** है जो निलंबन या बर्खास्तगी में परिणित हो सकती है (या ऐसा होने पर SOS Expat को तुरंत सूचित करने का वचन देता है);
- (g) वह किसी भी **प्रतिबंध सूची** (OFAC, EU, UN, HMT, या अन्य) में नहीं है;
- (h) उसे अपने पेशे के अभ्यास के साथ असंगत तथ्यों के लिए **आपराधिक रूप से दोषी नहीं** ठहराया गया है;
- (i) पंजीकरण के दौरान प्रदान की गई सभी जानकारी **सटीक, पूर्ण और अद्यतन** है;
- (j) वह इन घोषणाओं को प्रभावित करने वाले किसी भी परिवर्तन के बारे में **तुरंत SOS Expat को सूचित** करने का वचन देता है;
- (k) उसके पास पंजीकरण के दौरान या बाद में अपनी प्रोफ़ाइल पर "हस्तक्षेप देशों" के रूप में चुने गए प्रत्येक देश में **विधिक अभ्यास करने का प्रभावी अधिकार** है। वकील केवल उन न्यायक्षेत्रों का चयन करने का वचन देता है जिनमें वह स्थानीय पंजीकरण, पारस्परिक मान्यता समझौतों, अंतर्राष्ट्रीय सम्मेलनों या किसी अन्य कानूनी तंत्र के आधार पर कानूनी सलाह प्रदान करने या ग्राहकों का प्रतिनिधित्व करने के लिए **कानूनी रूप से अधिकृत** है। किसी ऐसे हस्तक्षेप देश का चयन जिसमें वकील को अभ्यास करने का अधिकार नहीं है, इन शर्तों का **गंभीर उल्लंघन** है।
कोई भी झूठी घोषणा शर्तों का गंभीर उल्लंघन है जो तत्काल और स्थायी प्रतिबंध में परिणित हो सकती है, किसी भी क्षतिपूर्ति के दावे पर प्रतिकूल प्रभाव डाले बिना।

---

## 4. खाता निर्माण, सत्यापन और सुरक्षा

4.1. आवश्यकताएँ: कम से कम एक न्यायक्षेत्र में वैध अभ्यास का अधिकार, पहचान और योग्यता के प्रमाण, वैध व्यावसायिक दायित्व बीमा।

4.2. प्रक्रिया: खाता निर्माण, दस्तावेज़ प्रस्तुत करना, मैनुअल सत्यापन जिसमें वीडियो साक्षात्कार और प्रदाताओं के माध्यम से KYC/AML जाँच शामिल हो सकती है।

4.3. सटीकता और अपडेट: वकील जानकारी की सटीकता और मुद्रा की गारंटी देता है; प्रति वकील एक (1) खाता।

4.4. सुरक्षा: वकील अपने क्रेडेंशियल्स की सुरक्षा करता है; खाते के माध्यम से कोई भी गतिविधि उसके द्वारा की गई मानी जाती है; किसी भी समझौते की तत्काल रिपोर्टिंग।

4.5. **किसी भी समय अतिरिक्त सत्यापन।** SOS Expat **किसी भी समय और बिना कारण बताए** वकील से अभ्यास के अधिकार, बार पंजीकरण, व्यावसायिक दायित्व बीमा, पहचान, या किसी अन्य प्रासंगिक दस्तावेज़ को प्रमाणित करने वाले किसी भी दस्तावेज़ को प्रदान करने या अपडेट करने का अनुरोध करने का अधिकार सुरक्षित रखता है। वकील **सात (7) कार्य दिवसों** के भीतर ऐसे अनुरोधों का जवाब देने का वचन देता है। जवाब न देने या गैर-अनुपालक दस्तावेज़ प्रदान करने पर खाते का तत्काल निलंबन हो सकता है।

4.6. **मॉडरेशन और गुणवत्ता नियंत्रण।** SOS Expat प्लेटफ़ॉर्म पर प्रदान की जाने वाली सेवाओं की गुणवत्ता और अनुपालन सुनिश्चित करने के उद्देश्य से एक मॉडरेशन नीति लागू करता है। इस मॉडरेशन में शामिल हो सकते हैं: (i) प्रोफ़ाइल और प्रकाशित सामग्री का सत्यापन, (ii) उपयोगकर्ता रेटिंग और शिकायतों का विश्लेषण, (iii) शर्तों और लागू कानूनों के अनुपालन का नियंत्रण, (iv) कोई अन्य उचित गुणवत्ता नियंत्रण उपाय। वकील इस मॉडरेशन के अधीन होने के लिए सहमत है।

4.7. **खाते का अस्थायी निलंबन।** SOS Expat निम्नलिखित मामलों में वकील के खाते को **बिना पूर्व सूचना के तुरंत निलंबित** कर सकता है:
- (a) धोखाधड़ी, पहचान की चोरी या झूठी घोषणा का संदेह;
- (b) उपयोगकर्ताओं से एकाधिक या गंभीर शिकायतें;
- (c) अनुच्छेद 4.5 के तहत अनुरोधित दस्तावेज़ प्रदान न करना;
- (d) शर्तों या लागू कानूनों का सिद्ध या संदिग्ध उल्लंघन;
- (e) प्लेटफ़ॉर्म की छवि या प्रतिष्ठा को नुकसान पहुँचाने वाला आचरण;
- (f) न्यायिक, प्रशासनिक या अनुशासनात्मक प्राधिकारी का आदेश;
- (g) SOS Expat द्वारा संप्रभु रूप से मूल्यांकित कोई अन्य वैध आधार।
निलंबन के दौरान, वकील अपने खाते तक नहीं पहुँच सकता और नए संपर्क प्राप्त नहीं कर सकता। स्थिति के स्पष्ट होने तक चालू भुगतान रोके जा सकते हैं।

4.8. **स्थायी प्रतिबंध (दोष के लिए समाप्ति)।** SOS Expat निम्नलिखित मामलों में वकील के खाते को **बिना पूर्व सूचना के स्थायी रूप से समाप्त** कर सकता है ("प्रतिबंध"):
- (a) शर्तों का गंभीर या बार-बार उल्लंघन;
- (b) सिद्ध धोखाधड़ी, जानबूझकर झूठी घोषणा या पहचान/पदवी की चोरी;
- (c) अभ्यास का अधिकार खोना (बर्खास्तगी, निलंबन, पंजीकरण का नवीनीकरण न होना);
- (d) पेशे के अभ्यास के साथ असंगत आपराधिक दोषसिद्धि;
- (e) उपयोगकर्ताओं या प्लेटफ़ॉर्म के लिए गंभीर रूप से हानिकारक आचरण;
- (f) अस्थायी निलंबन के बाद पुनरावृत्ति;
- (g) संपर्क शुल्क से बचने के लिए प्लेटफ़ॉर्म का सिद्ध परिवर्जन;
- (h) अनुस्मारकों के बावजूद KYC सत्यापन आवश्यकताओं का पालन न करना;
- (i) SOS Expat द्वारा संप्रभु रूप से मूल्यांकित कोई अन्य गंभीर आधार।
प्रतिबंध **अंतिम और अपरिवर्तनीय** है। प्रतिबंधित वकील नया खाता नहीं बना सकता। लंबित धन को किसी अन्य क्षतिपूर्ति कार्रवाई पर प्रतिकूल प्रभाव डाले बिना एकमुश्त हर्जाने के रूप में रोका जा सकता है।

4.9. **प्रक्रिया और सूचना।** निलंबन या प्रतिबंध के मामले में, SOS Expat पंजीकृत पते पर ईमेल द्वारा वकील को सूचित करता है। यह सूचना उपाय का कारण बताती है (कानूनी गोपनीयता दायित्व को छोड़कर)। वकील के पास संपर्क फ़ॉर्म के माध्यम से लिखित टिप्पणियाँ प्रस्तुत करने के लिए **पंद्रह (15) दिन** हैं। SOS Expat इन टिप्पणियों की समीक्षा करता है लेकिन उपाय को उठाने के लिए बाध्य नहीं है। SOS Expat का निर्णय **विवेकाधीन और अंतिम** है।

4.10. **निलंबन या प्रतिबंध के प्रभाव।** निलंबन या प्रतिबंध के मामले में:
- (a) खाते तक पहुँच तुरंत अवरुद्ध हो जाती है;
- (b) वकील की प्रोफ़ाइल खोज परिणामों से हटा दी जाती है;
- (c) चालू संपर्क रद्द किए जा सकते हैं;
- (d) लंबित भुगतानों को SOS Expat को देय किसी भी राशि के विरुद्ध रोका या समायोजित किया जा सकता है;
- (e) वकील उत्तरजीविता खंडों के अनुसार अपने दायित्वों (गोपनीयता, गैर-याचना, आदि) से बंधा रहता है।

4.11. **निष्क्रियता।** **365 दिनों से अधिक की निष्क्रियता** के मामले में, सूचना के बाद खाता स्वचालित रूप से निष्क्रिय किया जा सकता है। वकील आवश्यक सत्यापन दस्तावेज़ प्रदान करने के अधीन अनुरोध पर अपने खाते को पुनः सक्रिय कर सकता है।

4.12. **स्वैच्छिक समाप्ति।** वकील अपने वर्तमान दायित्वों (स्वीकृत सेवाएँ, संभावित रिफंड) को पूरा करने के बाद किसी भी समय अपना खाता बंद कर सकता है। बंद करने का अनुरोध संपर्क फ़ॉर्म के माध्यम से किया जाता है। SOS Expat **तीस (30) दिनों** के भीतर बंद कर देता है।

4.13. **इलेक्ट्रॉनिक संचार।** वकील इलेक्ट्रॉनिक माध्यमों से शर्तों, मॉडरेशन और निलंबन/प्रतिबंध उपायों से संबंधित कोई भी सूचना प्राप्त करने के लिए सहमत है।

4.14. **शिकायत निवारण की आंतरिक प्रणाली (P2B विनियमन)।** विनियमन (EU) 2019/1150 के अनुच्छेद 11 के अनुसार, SOS Expat वकील को संपर्क फ़ॉर्म (https://sos-expat.com/contact) के माध्यम से **निःशुल्क आंतरिक शिकायत निवारण प्रणाली** उपलब्ध कराता है। SOS Expat प्रतिबद्ध है: (i) किसी भी शिकायत की **पावती** **सात (7) कार्य दिवसों** के भीतर देना; (ii) शिकायत को **गंभीरता और बिना भेदभाव के, उचित अवधि में** निपटाना (सामान्यतः **तीस (30) दिन**); (iii) वकील को **तर्कसंगत** परिणाम संप्रेषित करना, बाद के उपायों (12.5 मध्यस्थता, 12.2 पंचाट) का उल्लेख करते हुए; (iv) **समग्र आंकड़े** रखना, जो वार्षिक रूप से सुलभ हों।

---

## 5. उपयोग के नियम – हितों का टकराव, गोपनीयता, प्लेटफ़ॉर्म का परिवर्जन निषिद्ध

5.1. **हितों का टकराव।** वकील किसी भी परामर्श से पूर्व उचित जाँच करेगा। हितों के टकराव की स्थिति में, वह स्वयं को पृथक करेगा और उपयोगकर्ता को सूचित करेगा।

5.2. **व्यावसायिक गोपनीयता एवं रहस्य।** वकील हस्तक्षेप देश के लागू विधि के अनुसार गोपनीयता और व्यावसायिक रहस्य का पालन करेगा।

**कॉल रिकॉर्डिंग नीति:**
- (a) **डिफ़ॉल्ट रूप से**, SOS Expat वकील और उपयोगकर्ता के बीच कॉल की **ऑडियो सामग्री रिकॉर्ड नहीं करता**। केवल **तकनीकी मेटाडेटा** बनाए रखे जाते हैं (टाइमस्टैम्प, अवधि, Twilio पहचानकर्ता, कनेक्शन स्थिति) बिलिंग, धोखाधड़ी विरोधी और तकनीकी विवाद समाधान के लिए;
- (b) SOS Expat **वकील और उपयोगकर्ता दोनों की स्पष्ट, पूर्व और पृथक सहमति के बिना कोई ऑडियो रिकॉर्डिंग सक्रिय नहीं करता**, जो कॉल शुरू होने से पहले एक अलग सकारात्मक कार्य द्वारा व्यक्त की गई हो। SOS Expat द्वारा एकतरफा कोई रिकॉर्डिंग शुरू नहीं की जा सकती, केवल **वकील या उपयोगकर्ता के देश के सक्षम न्यायिक प्राधिकरण के विधिवत आदेश** के अपवाद को छोड़कर, जो उस न्यायक्षेत्र द्वारा अपेक्षित लोक नीति की गारंटी प्रस्तुत करता हो (विशेष रूप से अधिवक्ता-गोपनीयता के संबंध में);
- (c) जब रिकॉर्डिंग असाधारण रूप से (b) के तहत सक्रिय की जाती है, तो इसे अपने उद्देश्य के लिए कड़ाई से आवश्यक अवधि के लिए, अधिकतम **छह (6) महीनों** की सीमा के भीतर (चल रही न्यायिक कार्यवाही द्वारा अधिरोपित विस्तार को छोड़कर) संरक्षित किया जाता है, GDPR और स्थानीय डेटा संरक्षण प्राधिकरणों की सिफारिशों के अनुरूप;
- (d) **वकील स्वयं** उपयोगकर्ता की लिखित अनुमति या कानूनी बाध्यता को छोड़कर, सहमत सेवा के अलावा अन्य उद्देश्यों के लिए रिकॉर्ड, पूरी तरह से लिप्यंतरण, प्रकटीकरण या उपयोग करने से प्रतिबंधित है;
- (e) **व्यावसायिक रहस्य अक्षुण्ण रहता है**: SOS Expat द्वारा कोई भी रिकॉर्डिंग व्यावसायिक रहस्य के लिए लागू आचार नियमों के उल्लंघन में वकील या उपयोगकर्ता के खिलाफ उपयोग नहीं की जा सकती।

5.3. **प्लेटफ़ॉर्म का परिवर्जन निषिद्ध।** SOS Expat शुल्क पर कोई कमीशन नहीं लेता। प्लेटफ़ॉर्म के माध्यम से प्रत्येक नए उपयोगकर्ता के साथ प्रत्येक नई संपर्क स्थापना पर संपर्क शुल्क देय होता है। नए परिचय के लिए इन शुल्कों से बचने हेतु प्लेटफ़ॉर्म का परिवर्जन निषिद्ध है।

5.4. **निषिद्ध आचरण।** पहचान/पदवी का प्रतिरूपण, अवैध सामग्री, छलपूर्ण कृत्य, प्लेटफ़ॉर्म को हानि पहुँचाने के लिए मिलीभगत/बहिष्कार, प्रतिबंध/निर्यात विधियों का उल्लंघन, या कोई भी अवैध गतिविधि।

5.5. **उपलब्धता।** प्लेटफ़ॉर्म "जैसा है" आधार पर प्रदान किया गया है; निर्बाध उपलब्धता की कोई गारंटी नहीं है (अनुरक्षण, घटनाएँ, अप्रत्याशित घटना)। विधि द्वारा अपेक्षित होने पर पहुँच प्रतिबंधित की जा सकती है।

---

## 6. वकील–उपयोगकर्ता संबंध (प्लेटफ़ॉर्म के बाहर)

6.1. संपर्क स्थापना के पश्चात, वकील और उपयोगकर्ता प्लेटफ़ॉर्म के बाहर अनुबंध कर सकते हैं (SOS Expat शुल्क निर्धारण या संग्रहण में हस्तक्षेप नहीं करता, नीचे वर्णित एकमुश्त भुगतान तंत्र को छोड़कर)।

6.2. वकील स्थानीय विधि के अनुसार अपने शुल्क समझौते प्रदान करेगा, लागू करों का संग्रहण/प्रेषण करेगा और स्थानीय नियमों (विज्ञापन, याचना, हितों का टकराव, उपभोक्ता संरक्षण) का पालन करेगा।

6.3. SOS Expat वकील के परामर्श की गुणवत्ता, सटीकता या परिणाम के लिए उत्तरदायी नहीं है।

---

## 7. शुल्क, एकमुश्त भुगतान और कर

7.1. **संपर्क शुल्क (प्लेटफ़ॉर्म का पारिश्रमिक)।** संपर्क शुल्क **केवल तकनीकी संपर्क सेवा** के लिए पारिश्रमिक है, जो SOS Expat द्वारा **उपयोगकर्ता** को प्रदान की जाती है। यह शुल्क **उपयोगकर्ता द्वारा देय** है, **वकील द्वारा नहीं**। इसकी राशि **प्रचलित शुल्क सूची** में परिभाषित है, जो वकील के व्यक्तिगत डैशबोर्ड में उपलब्ध है, प्रति संपर्क, करों और भुगतान प्रदाता शुल्क के बिना। शुल्क सूची में कोई भी परिवर्तन अनुच्छेद 2.5 की शर्तों (न्यूनतम पंद्रह (15) दिन की पूर्वसूचना) के अधीन होता है। वकील को प्रचलित शुल्क सूची नियमित रूप से देखने की सलाह दी जाती है।

7.2. **भुगतान का विधिक चरित्रांकन — दो पृथक एवं स्वतंत्र ऋण।** प्लेटफ़ॉर्म के माध्यम से उपयोगकर्ता द्वारा किया गया भुगतान **विधिक रूप से दो पृथक एवं स्वतंत्र ऋणों में विभाजित है**, संचालनात्मक सुविधा के कारणों से एकल संग्रहण द्वारा निपटान के बावजूद:
- (क) **« संपर्क » ऋण**: तकनीकी संपर्क सेवा (संपर्क शुल्क, अनु. 7.1) के लिए **उपयोगकर्ता द्वारा SOS Expat को देय** राशि;
- (ख) **« शुल्क » ऋण**: वकील और उपयोगकर्ता के बीच सहमत विधिक सेवा के शुल्क के रूप में **उपयोगकर्ता द्वारा वकील को देय** राशि। शुल्क समझौता, सेवा की सामग्री और गुणवत्ता **विशेष रूप से** वकील-उपयोगकर्ता संबंध के अंतर्गत आते हैं, प्लेटफ़ॉर्म के बाहर (अनु. 6 और 13.5)।

**SOS Expat वकील के शुल्क पर कोई कमीशन, प्रत्यागमन, भागीदारी, प्रतिशत या कोई भी अंश प्राप्त नहीं करता, मांगता नहीं और उसका कोई अधिकार नहीं रखता — विशेष रूप से उन न्यायक्षेत्रों में जिनके आचार नियम गैर-अधिवक्ता के साथ शुल्क-भागीदारी पर रोक लगाते हैं। संपर्क शुल्क SOS Expat का एकमात्र पारिश्रमिक है और विशेष रूप से (क) में निर्दिष्ट उपयोगकर्ता के ऋण से उत्पन्न होता है।**

भुगतान प्रदाता, भाग (ख) के लिए **वकील के भुगतान एजेंट** के रूप में कार्य करते हुए, प्राप्त शुल्कों को बैंकिंग प्रसंस्करण शुल्क और, यदि लागू हो, मुद्रा रूपांतरण शुल्क की केवल कटौती के बाद वकील को हस्तांतरित करता है (अनु. 7.3 और 7.4)। **वकील जो शुद्ध राशि प्राप्त करेगा वह प्रत्येक लेनदेन से पहले और बाद में उसके डैशबोर्ड में प्रदर्शित होती है**, जिससे वह पूर्ण जानकारी के साथ संपर्क स्वीकार या अस्वीकार कर सकता है।

7.3. **भुगतान प्रदाता के बैंक शुल्क।** भुगतान प्रदाता (Stripe या समकक्ष) प्रत्येक लेनदेन पर प्रसंस्करण शुल्क लेता है। **ये बैंक शुल्क पूर्णतः वकील द्वारा वहन किए जाते हैं** और उन्हें हस्तांतरित राशि से स्वचालित रूप से काट लिए जाते हैं। इन शुल्कों का विवरण भुगतान प्रदाता की शर्तों में और प्रत्येक लेनदेन के लिए वकील के डैशबोर्ड में उपलब्ध है।

7.4. **विनिमय दर और मुद्रा रूपांतरण शुल्क।** जब उपयोगकर्ता की भुगतान मुद्रा वकील के बैंक खाते की मुद्रा से भिन्न होती है, तो भुगतान प्रदाता द्वारा **मुद्रा रूपांतरण शुल्क** लागू किए जाते हैं। **ये विनिमय शुल्क पूर्णतः वकील द्वारा वहन किए जाते हैं** और उन्हें हस्तांतरित राशि से काट लिए जाते हैं। लागू विनिमय दरें हस्तांतरण के समय भुगतान प्रदाता की दरें होती हैं। वकील स्वीकार करता है और स्पष्ट रूप से सहमत है कि SOS Expat का इन विनिमय दरों पर कोई नियंत्रण नहीं है और मुद्रा उतार-चढ़ाव या प्रदाता द्वारा लागू शुल्कों के लिए किसी भी दायित्व का अस्वीकरण करता है।

7.5. **वकील को हस्तांतरित शुद्ध राशि की गणना।** वकील को हस्तांतरित शुद्ध राशि उपयोगकर्ता द्वारा देय **« शुल्क » ऋण** (अनु. 7.2.ख) के अनुरूप होती है, **केवल** निम्नलिखित की कटौती के बाद: (i) « शुल्क » भाग पर लागू भुगतान प्रदाता के **बैंकिंग शुल्क** (अनु. 7.3) और (ii) यदि लागू हो, **मुद्रा रूपांतरण शुल्क** (अनु. 7.4)। **संपर्क शुल्क (अनु. 7.2.क) किसी भी परिस्थिति में शुल्कों से कटौती नहीं किया जाता**: वे SOS Expat की ओर उपयोगकर्ता के एक पृथक ऋण के रूप में लिए जाते हैं। **वकील को प्रत्येक सेवा से पहले उसके डैशबोर्ड में वह सटीक राशि बताई जाती है जो उसे प्राप्त होगी और इस प्रकार वह पूर्ण जानकारी के साथ संपर्क स्वीकार करने या न करने का निर्णय ले सकता है।**

7.6. **देयता और अप्रतिदेयता।** संपर्क शुल्क प्रभावी संपर्क स्थापना पर देय होते हैं और **अप्रतिदेय** हैं (SOS Expat के विवेकाधीन सद्भावना इशारे को छोड़कर, केवल प्लेटफ़ॉर्म को पूर्णतः जिम्मेदार ठहराई जा सकने वाली विफलता के मामले में और विधि द्वारा अनुमत सीमा तक)।

7.7. **उपयोगकर्ता को धनवापसी।** यदि उपयोगकर्ता को धनवापसी दी जाती है, तो यह वकील के हिस्से से काटी जाती है: SOS Expat वकील को भविष्य के भुगतानों से संबंधित राशि रोक/समायोजित कर सकता है, या यदि कोई भुगतान आने वाला नहीं है तो प्रत्यक्ष प्रतिपूर्ति की माँग कर सकता है। संपर्क शुल्क SOS Expat द्वारा अर्जित रहते हैं, विवेकाधीन विपरीत निर्णय को छोड़कर।

7.8. **चैनल के अनुसार वकील के भुगतान की समय-सीमा।** KYC प्रक्रिया (अनुच्छेद 8) के पूर्ण होने के अधीन, संपर्क स्थापना के चैनल के अनुसार वकील की शुद्ध पारिश्रमिक के भुगतान की समय-सीमाएँ भिन्न होती हैं:
- (क) **B2C संपर्क स्थापनाएँ** (उपयोगकर्ता द्वारा प्रत्यक्ष भुगतान): वकील की पारिश्रमिक भुगतान प्रदाता द्वारा **अपील की समाप्ति पर तत्काल भुगतान के लिए रखी जाती है**, केवल प्रदाता की बैंकिंग प्रसंस्करण, धोखाधड़ी-रोधी और भुगतान कैप्चर की तकनीकी समय-सीमाओं के अधीन (आमतौर पर वकील के देश और प्रदाता के साथ उसके खाते की परिपक्वता के अनुसार एक (1) से सात (7) कार्य दिवसों के बीच);
- (ख) **B2B संपर्क स्थापनाएँ** (B2B भागीदार द्वारा भुगतान): B2B भागीदार पर लागू स्थगित बिलिंग मॉडल (मासिक बिलिंग या « नेट-30 ») को देखते हुए, वकील की पारिश्रमिक का भुगतान कॉल की तिथि के बाद **तीस (30) दिनों की अवधि के भीतर** किया जाता है;
- (ग) सभी मामलों में, विवाद, उपयोगकर्ता या भागीदार के दावे, चालू KYC/AML-CFT सत्यापन, या वर्तमान CGU में प्रदान की गई किसी अन्य परिस्थिति की स्थिति में भुगतान निलंबित किया जा सकता है।

7.9. **कर।** वकील अपने निवास और/या अभ्यास के न्यायक्षेत्र में अपने सभी कर दायित्वों (आयकर, वैट, सामाजिक योगदान, व्यावसायिक प्रभार, आदि) के लिए **एकमात्र रूप से उत्तरदायी** रहता है। वकील को हस्तांतरित राशियाँ **सकल राशियाँ** हैं; वकील सभी लागू करों की घोषणा और भुगतान के लिए उत्तरदायी है। SOS Expat, जहाँ विधि द्वारा अपेक्षित हो, केवल संपर्क शुल्क पर वैट/स्थानीय समकक्ष का संग्रहण और प्रेषण करता है।

7.10. **समायोजन।** SOS Expat वकील द्वारा देय किसी भी राशि (उपयोगकर्ता धनवापसी, दंड, या अन्य दायित्व के लिए) को वकील को देय किसी भी राशि से समायोजित कर सकता है।

7.11. **शुल्क पारदर्शिता और इतिहास।** वकील किसी भी समय अपने व्यक्तिगत डैशबोर्ड में देख सकता है: (i) प्रत्येक लेनदेन का पूर्ण विवरण, (ii) उपयोगकर्ता द्वारा भुगतान की गई सकल राशि, (iii) काटे गए संपर्क शुल्क, (iv) भुगतान प्रदाता के बैंक शुल्क, (v) विनिमय शुल्क यदि लागू हो, (vi) हस्तांतरित या हस्तांतरित की जाने वाली शुद्ध राशि, और (vii) अपने सभी लेनदेन का इतिहास। यह जानकारी खाते की अवधि के दौरान और उसके बंद होने के **पाँच (5) वर्षों** बाद तक संरक्षित और सुलभ रहती है।

7.12. **स्वचालित कर घोषणा (निर्देश DAC7 — EU 2021/514)।** यूरोपीय संघ के सदस्य राज्य में निवास करने वाले वकील को सूचित किया जाता है कि SOS Expat, घोषणाकर्ता प्लेटफ़ॉर्म ऑपरेटर के रूप में, सक्षम कर अधिकारियों को (निर्देश (EU) 2021/514 « DAC7 » के तहत) EU में निवासी सक्रिय वकीलों के बारे में जानकारी **वार्षिक रूप से घोषित** करने के लिए बाध्य है, विशेष रूप से: नाम, पता, कर पहचानकर्ता (TIN), निवास का राज्य, प्लेटफ़ॉर्म के माध्यम से प्राप्त कुल पारिश्रमिक की राशि और संपर्कों की संख्या, कैलेंडर तिमाही द्वारा वर्गीकृत। वकील अपने व्यक्तिगत डैशबोर्ड में इन जानकारियों को प्रदान करने और अद्यतन रखने का वचन देता है। संप्रेषण या अद्यतन की कमी DAC7 प्रावधानों के अनुरूप नियमितीकरण तक भुगतानों के निलंबन का कारण बन सकती है।

7.13. **B2B चैनल — B2B भागीदार के माध्यम से संपर्क स्थापना।**

(क) **परिधि।** B2B संपर्क स्थापना एक B2B उपयोगकर्ता द्वारा शुरू की जाती है, जो SOS Expat और एक B2B भागीदार (अनु. 1) के बीच संपन्न रूपरेखा अनुबंध का लाभार्थी है।

(ख) **दो ऋणों का अनुकूलन।** दो ऋणों का तंत्र (अनु. 7.2) B2B में निम्नानुसार लागू होता है:
- **« संपर्क » ऋण** **B2B भागीदार** द्वारा SOS Expat को देय है (पूर्ण या आंशिक रूप से रूपरेखा अनुबंध के अनुसार), जिससे **B2B उपयोगकर्ता सामान्यतया कुछ भी भुगतान नहीं करता**, या केवल SOS Expat को एक संभावित मॉडरेटिंग टिकट (टिकट मॉडरेटर) का भुगतान करता है;
- **« शुल्क » ऋण** **अंतिम उपयोगकर्ता** द्वारा **वकील** को देय रहता है, सिवाय रूपरेखा अनुबंध के स्पष्ट खंड के जो B2B भागीदार द्वारा शुल्क के पूर्ण या आंशिक वहन का प्रावधान करता है (इस मामले में भागीदार वकील को वहन किए गए हिस्से के लिए ऋणी हो जाता है, अनु. 7.2 के भुगतान एजेंट तंत्र के माध्यम से)।
- वकील किसी भी परिस्थिति में अपने स्थानीय आचार संहिता के अनुरूप शुल्क समझौता पर हस्ताक्षर करने से छूट प्राप्त नहीं है (अनु. 6.2)।

(ग) **पृथक B2C / B2B वकील शुल्क सूची — वकील इसे स्पष्ट रूप से स्वीकार करता है।** वकील **स्पष्ट रूप से स्वीकार और सहमत है** कि **B2B संपर्क स्थापना के लिए उसे प्राप्त होने वाली शुद्ध पारिश्रमिक भिन्न हो सकती है**, ऊपर या नीचे, **B2C संपर्क स्थापना के लिए प्राप्त पारिश्रमिक से** (उदाहरण के लिए: भागीदार के साथ बातचीत की गई फ़्लैट दर, गारंटीकृत मात्रा को ध्यान में रखना, भागीदार द्वारा शुल्क का पूर्ण या आंशिक वहन, या भागीदार को दी गई छूट)। **मूल चैनल (B2C या B2B)** और **सटीक राशि** जो वकील को प्राप्त होगी, **प्रत्येक संपर्क स्थापना से पहले उसके डैशबोर्ड में प्रदर्शित होती है**, जिससे वह स्वतंत्र रूप से और पूर्ण जानकारी के साथ इसे स्वीकार या अस्वीकार कर सकता है। चैनल या प्रस्तावित दर के कारण वकील पर **कोई स्वीकृति का दायित्व नहीं** है।

(घ) **वकील के विरुद्ध B2B रूपरेखा अनुबंध की अनुपयोज्यता।** SOS Expat और B2B भागीदार के बीच संपन्न रूपरेखा अनुबंध की शर्तें **वकील के विरुद्ध अप्रयोज्य हैं**; B2B संपर्क स्थापना के अवसर पर SOS Expat और वकील के बीच संबंध को केवल वर्तमान CGU और वकील के डैशबोर्ड में प्रदर्शित जानकारी ही नियंत्रित करती है।

(ङ) **वर्तमान CGU की अन्य सभी शर्तें** B2B संपर्क स्थापनाओं पर लागू होती हैं।

(च) **वर्तमान CGU की तिथि पर लागू दरें (सूचनार्थ)।** वर्तमान CGU के अंतिम अद्यतन की तिथि पर, वकील की शुद्ध पारिश्रमिक की दरें निम्नानुसार हैं:
- **B2C संपर्क स्थापना**: निपटान की मुद्रा के अनुसार, स्वीकार और निष्पादित प्रत्येक संपर्क स्थापना के लिए **तीस यूरो (30 €) या तीस अमेरिकी डॉलर (30 USD)** शुद्ध;
- **B2B संपर्क स्थापना**: निपटान की मुद्रा के अनुसार, स्वीकार और निष्पादित प्रत्येक संपर्क स्थापना के लिए **बीस यूरो (20 €) या बीस अमेरिकी डॉलर (20 USD)** शुद्ध।

ये राशियाँ **सूचनार्थ** हैं और वर्तमान CGU के अद्यतन की तिथि पर लागू दर को दर्शाती हैं। **अद्यतन दर** प्रत्येक संपर्क स्थापना से पहले वकील के डैशबोर्ड में स्थायी रूप से उपलब्ध है। कोई भी परिवर्तन अनुच्छेद 7.14 में प्रदान किए गए पंद्रह (15) दिनों के पूर्वसूचना के अधीन है।

7.14. **वकील की पारिश्रमिक अनुसूची का संशोधन।** SOS Expat **किसी भी समय वकील की शुद्ध पारिश्रमिक अनुसूची को संशोधित करने** का अधिकार सुरक्षित रखता है, चाहे यह हो:
- (i) **B2C अनुसूची** — संपर्क शुल्क या उनकी संरचना के संशोधन द्वारा (जो वकील द्वारा प्राप्त शुद्ध राशि पर असर डालता है);
- (ii) **B2B अनुसूची** — B2B संपर्क स्थापनाओं पर लागू फ़्लैट या परिवर्तनीय पारिश्रमिक के संशोधन द्वारा;
- (iii) या शुद्ध पारिश्रमिक के किसी अन्य घटक का (उदाहरण के लिए: मुद्राएँ, मात्रा स्तर, वरिष्ठता स्तर)।

कोई भी संशोधन अनुच्छेद 2.5 में प्रदान किए गए **न्यूनतम पंद्रह (15) दिनों के पूर्वसूचना** के अधीन है, जो वकील को टिकाऊ माध्यम पर सूचित किया जाता है (पंजीकृत पते पर ईमेल और उसके व्यक्तिगत स्थान में प्रकाशन)। पूर्वसूचना अवधि के दौरान, वकील प्लेटफ़ॉर्म के साथ अपना संबंध **बिना दंड के समाप्त** कर सकता है या उन संपर्क स्थापनाओं को **केस-दर-केस आधार पर अस्वीकार करना जारी रख सकता है** जिनका पारिश्रमिक उसे अब उपयुक्त नहीं लगता, यह स्मरण रखते हुए कि **वकील कभी भी संपर्क स्थापना को स्वीकार करने के लिए बाध्य नहीं है**। **पूर्वसूचना की समाप्ति से पहले पहले से स्वीकार की गई संपर्क स्थापनाएँ स्वीकृति की तिथि पर लागू दर पर पारिश्रमित रहती हैं।** समाप्ति के अभाव में, पूर्वसूचना की समाप्ति पर प्लेटफ़ॉर्म के उपयोग की निरंतरता नई अनुसूची की स्वीकृति के बराबर है।

---

## 8. भुगतान – KYC/AML – प्रतिबंध

8.1. **भुगतान प्रदाता।** भुगतान **विशेष रूप से** **PCI-DSS** प्रमाणित तृतीय-पक्ष प्रदाताओं द्वारा संसाधित किए जाते हैं: **Stripe Payments Europe Ltd.** (आयरलैंड, EU) और/या **PayPal (Europe) S.à r.l. et Cie, S.C.A.** (लक्ज़मबर्ग, EU)। लागू प्रदाता वकील के निवास/अभ्यास के देश पर निर्भर करता है (Stripe वर्तमान में 44 देशों को कवर करता है, PayPal 150+ देश)। वकील **स्पष्ट रूप से** लागू प्रदाता(ओं) की शर्तों और KYC/AML प्रक्रियाओं को स्वीकार करता है। **SOS Expat एक बैंक, भुगतान संस्थान या क्रेडिट संस्थान नहीं है**; SOS Expat केवल उल्लिखित भुगतान प्रदाताओं का एक वाणिज्यिक ग्राहक है।

8.2. SOS Expat संदिग्ध धोखाधड़ी, गैर-अनुपालन, या विधिक आदेश के मामले में भुगतान स्थगित, रोक या रद्द कर सकता है।

8.3. **अंतर्राष्ट्रीय प्रतिबंध और प्रतिबंध।** वकील घोषणा करता है और गारंटी देता है:
- (क) प्रत्यक्ष या अप्रत्यक्ष रूप से किसी भी **प्रतिबंध सूची** (OFAC/SDN, यूरोपीय संघ, संयुक्त राष्ट्र, HMT, या कोई अन्य लागू प्रतिबंध सूची) में नहीं है;
- (ख) प्रत्यक्ष या अप्रत्यक्ष रूप से किसी प्रतिबंध सूची में शामिल किसी व्यक्ति या संस्था द्वारा स्वामित्व या नियंत्रित नहीं है;
- (ग) **वैश्विक प्रतिबंध या पूर्ण प्रतिबंधात्मक उपायों** के अधीन किसी देश या क्षेत्र का निवासी, नागरिक या वहाँ स्थित नहीं है, लागू कानूनों और विनियमों के तहत, विशेष रूप से भुगतान प्रदाताओं, यूरोपीय संघ, संयुक्त राष्ट्र, OFAC (अमेरिका), HMT (ब्रिटेन) या किसी अन्य सक्षम प्राधिकरण के। ऐसे देशों और क्षेत्रों की अद्यतन सूची उपरोक्त प्राधिकरणों द्वारा रखी जाती है और प्रामाणिक है; SOS Expat अपनी स्वयं की भूराजनीतिक सूची स्थापित या प्रकाशित नहीं करता;
- (घ) प्रतिबंधित व्यक्तियों, संस्थाओं या देशों से जुड़े लेनदेन के लिए प्लेटफ़ॉर्म का उपयोग नहीं करेगा;
- (ङ) सभी लागू **निर्यात नियंत्रण विधियों** का पालन करेगा।
SOS Expat किसी भी प्रतिबंध या प्रतिबंधों के अधीन क्षेत्र में, या इन प्रावधानों का उल्लंघन करने के संदेह वाले किसी भी वकील के लिए, बिना पूर्व सूचना या क्षतिपूर्ति के **तत्काल पहुँच प्रतिबंधित या अवरुद्ध** करने का अधिकार सुरक्षित रखता है। SOS Expat को सक्षम प्राधिकारी के आदेश पर वकील के **धन को जमा** करने की भी आवश्यकता हो सकती है।

### अदावाकृत धन और KYC सत्यापन

8.4. **सत्यापन प्रक्रिया (KYC) पूर्ण करने का दायित्व।** प्लेटफ़ॉर्म के माध्यम से प्रदान की गई सेवाओं से भुगतान प्राप्त करने के लिए, वकील पंजीकरण के पश्चात यथाशीघ्र हमारे भुगतान भागीदार Stripe के साथ पहचान सत्यापन प्रक्रिया (KYC - Know Your Customer) पूर्ण करने के लिए सहमत होता है। वकील स्वीकार करता है कि पूर्ण KYC सत्यापन के अभाव में तकनीकी रूप से उसके बैंक खाते में धन हस्तांतरण संभव नहीं है।

8.5. **लंबित धन का धारण।** जब किसी उपयोगकर्ता द्वारा किसी ऐसे वकील द्वारा प्रदान की गई सेवा के लिए भुगतान किया जाता है जिसने KYC सत्यापन पूर्ण नहीं किया है, तो वकील के हिस्से के अनुरूप धन (प्लेटफ़ॉर्म के संपर्क शुल्क की कटौती के बाद) एस्क्रो खाते में रोक कर रखा जाता है। प्लेटफ़ॉर्म वचनबद्ध है:
- वकील को ईमेल द्वारा लंबित धन के अस्तित्व की सूचना देना;
- नियमित अनुस्मारक भेजना (7 दिन, 30 दिन, 60 दिन, 90 दिन, 120 दिन और 150 दिन पर);
- वकील को उसकी KYC सत्यापन पूर्ण करने के लिए सभी आवश्यक साधन प्रदान करना।

8.6. **दीर्घकालिक धारण — प्रबंधन शुल्क और सक्षम प्राधिकरणों को हस्तांतरण।** यदि KYC सत्यापन पहले लंबित भुगतान से **एक सौ अस्सी (180) दिनों** के भीतर पूर्ण नहीं होता, और अनुच्छेद 8.5 में प्रदान की गई सूचनाओं के बावजूद:
- (क) **एकमुश्त प्रबंधन शुल्क।** SOS Expat लंबित धन से **उचित एकमुश्त प्रबंधन शुल्क, रोकी गई राशि के दस प्रतिशत (10 %) तक सीमित**, ले सकता है, जो कड़ाई से वास्तविक प्रशासनिक लागतों को कवर करता है;
- (ख) **दीर्घकालिक संरक्षण।** शेष भुगतान प्रदाता के पृथक खाते में संरक्षित रहता है। वकील इस चरण के दौरान किसी भी समय अपना KYC पूर्ण कर सकता है और धन का दावा कर सकता है;
- (ग) **सक्षम प्राधिकरणों को हस्तांतरण (अदावाकृत संपत्ति)।** पहले लंबित भुगतान से **पाँच (5) वर्षों** की समग्र अवधि की समाप्ति पर, वैध दावे के अभाव में, अवशिष्ट धन को **वकील के निवास देश के सक्षम प्राधिकरण को हस्तांतरित किया जाता है**, अदावाकृत निधियों पर लागू नियमों के अनुसार (उदाहरण के लिए, फ्रांस में, Eckert कानून के तहत Caisse des dépôts को; अमेरिका में, सक्षम राज्य के unclaimed property कार्यक्रम को; ब्रिटेन में, Dormant Assets Scheme को; और सामान्य रूप से स्थानीय समकक्ष तंत्र को)। **SOS Expat किसी भी परिस्थिति में इन अवशिष्ट धनों का स्वामी नहीं बनता।**

8.7. **दीर्घकालिक संरक्षण के दौरान दावा।** वकील दीर्घकालिक संरक्षण चरण (ख) के दौरान किसी भी समय SOS Expat को संपर्क फ़ॉर्म के माध्यम से एक तर्कसंगत दावा अनुरोध भेज सकता है, जिसके साथ **पूर्ण KYC सत्यापन** हो (KYC भुगतान प्रदाता और AML-FT दायित्वों द्वारा अधिरोपित एक तकनीकी शर्त है)। SOS Expat **तीस (30) दिनों** के भीतर अनुरोध की समीक्षा करता है। स्वीकृति के मामले में, धन केवल (क) में उल्लिखित प्रबंधन शुल्क की कटौती के बाद हस्तांतरित किया जाता है। विधिवत न्यायोचित अप्रत्याशित घटना या प्रलेखित चिकित्सा अक्षमता के मामले में, इन शुल्कों को SOS Expat के उचित विवेकाधिकार पर कम या समाप्त किया जा सकता है।

8.8. **स्पष्ट स्वीकृति।** प्लेटफ़ॉर्म पर पंजीकरण करके, वकील घोषणा करता है कि उसने इस अनुच्छेद 8 की शर्तों को पढ़ लिया है और स्पष्ट रूप से स्वीकार करता है। यह स्वीकृति प्रदाता स्थिति तक पहुँच की एक आवश्यक शर्त है।

---

## 9. व्यक्तिगत डेटा (वैश्विक ढाँचा – GDPR/DSA)

9.1. **भूमिकाएँ।** संपर्क स्थापना के लिए प्राप्त उपयोगकर्ता डेटा के लिए, SOS Expat और वकील प्रत्येक **विनियमन (EU) 2016/679 (GDPR)** के अनुसार अपने संबंधित उद्देश्यों के लिए डेटा नियंत्रक के रूप में कार्य करते हैं।

9.2. **आधार और उद्देश्य।** अनुबंध निष्पादन (संपर्क स्थापना), वैध हित (सुरक्षा, धोखाधड़ी रोकथाम, सुधार), विधिक अनुपालन (AML, प्रतिबंध), और, यदि लागू हो, सहमति।

9.3. **अंतर्राष्ट्रीय स्थानांतरण** जहाँ आवश्यक हो उचित सुरक्षा उपायों के साथ (मानक संविदात्मक खंड, पर्याप्तता निर्णय, आदि)।

9.4. **अधिकार और संपर्क।** अधिकारों का प्रयोग (पहुँच, सुधार, विलोपन, पोर्टेबिलिटी, आपत्ति) प्लेटफ़ॉर्म संपर्क फ़ॉर्म के माध्यम से।

9.5. **सुरक्षा।** उचित तकनीकी/संगठनात्मक उपाय; लागू विधियों के अनुसार उल्लंघन अधिसूचना (GDPR के अनुसार 72 घंटे)।

9.6. वकील हस्तक्षेप देश की विधि और व्यावसायिक गोपनीयता के अनुसार प्राप्त डेटा का प्रसंस्करण करता है।

9.7. **DSA अनुपालन।** प्लेटफ़ॉर्म **विनियमन (EU) 2022/2065 (डिजिटल सेवा अधिनियम)** के अर्थ में **मध्यस्थ सेवा** के रूप में संचालित होता है। SOS Expat DSA के अनुपालन में अवैध सामग्री की रिपोर्टिंग के लिए तंत्र लागू करता है और सक्षम प्राधिकारियों के साथ सहयोग करता है।

---

## 10. बौद्धिक संपदा

प्लेटफ़ॉर्म, इसके ट्रेडमार्क, लोगो, डेटाबेस और सामग्री संरक्षित हैं। वकील को शर्तों की अवधि के दौरान पहुँच का व्यक्तिगत, गैर-विशिष्ट, गैर-हस्तांतरणीय अधिकार के अलावा कोई अधिकार प्रदान नहीं किया गया है। वकील द्वारा प्रदान की गई सामग्री (प्रोफ़ाइल, फ़ोटो, विवरण) के लिए SOS Expat को प्लेटफ़ॉर्म पर होस्टिंग और प्रदर्शन हेतु वैश्विक, गैर-विशिष्ट लाइसेंस प्रदान किया जाता है।

---

## 11. गारंटी, दायित्व और क्षतिपूर्ति

11.1. विधिक सेवाओं के संबंध में कोई गारंटी नहीं; SOS Expat परिणाम, गुणवत्ता, या व्यापार की मात्रा सुनिश्चित नहीं करता।

11.2. प्लेटफ़ॉर्म "जैसा है" प्रदान किया गया है; निरंतर उपलब्धता की कोई गारंटी नहीं।

11.3. **दायित्व की सीमा**: अनुमत सीमा तक, वकील के प्रति SOS Expat का कुल दायित्व प्रत्यक्ष क्षति तक सीमित है और दावे को जन्म देने वाले लेनदेन के लिए SOS Expat द्वारा प्राप्त कुल संपर्क शुल्क से अधिक नहीं हो सकता।

11.4. **अपवर्जन**: कोई अप्रत्यक्ष/परिणामी/विशेष/दंडात्मक क्षति नहीं (लाभ, ग्राहक, प्रतिष्ठा की हानि, आदि)।

11.5. **क्षतिपूर्ति**: वकील SOS Expat (और इसके सहयोगियों, अधिकारियों, कर्मचारियों, एजेंटों) को (i) शर्तों/विधियों के उल्लंघन, (ii) उनकी सामग्री, (iii) उनके परामर्श/चूक से संबंधित किसी भी दावे/क्षति/लागत (वकील शुल्क सहित) से क्षतिपूर्ति करता है और हानिरहित रखता है।

11.6. **अनुसरण का त्याग।** वकील **स्पष्ट और अपरिवर्तनीय रूप से** SOS Expat के विरुद्ध किसी भी अनुसरण का त्याग करता है: (i) विधिक सेवाओं के प्रावधान से उत्पन्न क्षति, (ii) अप्रत्यक्ष हानि, (iii) उपयोगकर्ताओं के साथ संविदात्मक विवाद, (iv) वकील द्वारा प्रदान की गई सेवाओं की कोई विफलता। यह त्याग विधि द्वारा अनुमत अधिकतम सीमा तक लागू होता है।

11.7. कोई प्रतिनिधित्व नहीं: कुछ भी अधिदेश, रोज़गार, साझेदारी, या SOS Expat और वकील के बीच संयुक्त उद्यम नहीं बनाता।

11.8. **अप्रत्याशित घटना।** SOS Expat **अप्रत्याशित घटना** (प्राकृतिक आपदा, युद्ध, महामारी, साइबर हमला, विद्युत या इंटरनेट व्यवधान, सरकारी निर्णय, हड़ताल, आदि) के कारण विलंब या विफलता के लिए उत्तरदायी नहीं है।

11.9. **खंडों का उत्तरजीवन।** निम्नलिखित अनुच्छेद शर्तों की समाप्ति या परिसमाप्ति के बाद भी बने रहते हैं, कारण चाहे जो भी हो: अनुच्छेद 2 (स्वीकृति साक्ष्य), 3.5 (घोषणाएँ), 5 (उपयोग के नियम), 7 (शुल्क और भुगतान), 8 (KYC और प्रतिबंध), 9 (व्यक्तिगत डेटा), 10 (बौद्धिक संपदा), 11 (दायित्व और क्षतिपूर्ति), 12 (शासी विधि और मध्यस्थता), 13 (संरक्षण खंड) और 14 (विविध)। ये खंड अपने प्रभाव उत्पन्न करने के लिए आवश्यक समय तक प्रभावी रहते हैं।

---

## 12. शासी विधि – मध्यस्थता – एस्टोनियाई अधिकार क्षेत्र – सामूहिक कार्रवाई

12.1. **शासी विधि और स्थानीय आचार-संहिता की प्रधानता।** ये शर्तें, उनकी व्याख्या, वैधता और निष्पादन विशेष रूप से **एस्टोनियाई विधि** द्वारा शासित हैं, इसके विधि संघर्ष नियमों को छोड़कर। **किसी भी अस्पष्टता से बचने के लिए**, हस्तक्षेप देश और/या वकील के बार पंजीकरण देश में लागू अधिवक्ता पेशे के आचार नियम (विशेष रूप से व्यावसायिक गोपनीयता, गैर-अधिवक्ता के साथ शुल्क-भागीदारी पर रोक, विज्ञापन और याचना के नियमन, हितों के टकराव, और ग्राहक निधियों के प्रबंधन के संबंध में) **लोक नीति की मानी जाती हैं** और इन शर्तों के किसी भी विरोधी या अस्पष्ट प्रावधान पर **प्रधानता रखती हैं**। शर्तों के किसी भी खंड को इस तरह नहीं समझा जा सकता कि वह वकील को अपनी स्थानीय आचार-संहिता के विपरीत आचरण करने के लिए बाध्य या प्राधिकृत करे; टकराव की स्थिति में, वकील इससे विरत रहता है और बिना देरी के SOS Expat को सूचित करता है।

12.2. **अनिवार्य अंतर्राष्ट्रीय मध्यस्थता।** इन शर्तों से उत्पन्न या इनसे संबंधित कोई भी विवाद, मतभेद या दावा, जिसमें उनकी वैधता, व्याख्या, निष्पादन या समाप्ति शामिल है, **अंतर्राष्ट्रीय वाणिज्य मंडल (ICC)** के मध्यस्थता नियमों के अनुसार **मध्यस्थता** द्वारा अंतिम रूप से निपटाया जाएगा।
- **मध्यस्थता का स्थान**: टालिन, एस्टोनिया;
- **मध्यस्थता की भाषा**: **अंग्रेज़ी**;
- **मध्यस्थों की संख्या**: एक (1) एकमात्र मध्यस्थ, जब तक कि विवाद की राशि €100,000 से अधिक न हो, जिस स्थिति में तीन (3) मध्यस्थ;
- **मूल विधि**: एस्टोनियाई विधि (अनुच्छेद 12.1);
- **प्रक्रिया**: गोपनीय। पक्षकार मध्यस्थता के अस्तित्व, सामग्री या परिणाम का खुलासा न करने का वचन देते हैं, विधिक रूप से आवश्यक होने या पंचाट के प्रवर्तन के लिए छोड़कर।
मध्यस्थ पंचाट पक्षकारों पर **अंतिम और बाध्यकारी** है। पक्षकार विधि द्वारा अनुमत सीमा तक पंचाट को रद्द करने की किसी भी कार्रवाई का त्याग करते हैं।

12.3. **सामूहिक कार्रवाई और जूरी परीक्षण का त्याग।** लागू विधि द्वारा अनुमत अधिकतम सीमा तक:
- (क) वकील SOS Expat के विरुद्ध किसी भी **सामूहिक कार्रवाई, समूह कार्रवाई, या प्रतिनिधि कार्रवाई** में भागीदारी का त्याग करता है;
- (ख) कोई भी विवाद केवल **व्यक्तिगत आधार** पर हल किया जाएगा;
- (ग) वकील स्पष्ट रूप से किसी भी **जूरी परीक्षण के अधिकार** का त्याग करता है (जूरी परीक्षण त्याग);
- (घ) वकील अमेरिकी विधि या किसी समकक्ष विधि के अंतर्गत किसी भी **वर्ग कार्रवाई, समेकित कार्रवाई, या प्रतिनिधि कार्रवाई** का त्याग करता है।

12.4. **एस्टोनियाई न्यायालयों का विशेष अधिकार क्षेत्र।** लागू विधि के अंतर्गत किसी भी गैर-मध्यस्थनीय दावे के लिए, मध्यस्थ न्यायाधिकरण के गठन से पूर्व अत्यावश्यक अंतरिम या परिरक्षी उपायों के लिए, और मध्यस्थ पंचातों के प्रवर्तन के लिए, **टालिन (एस्टोनिया) के न्यायालयों** को **विशेष अधिकार क्षेत्र** प्राप्त है। वकील:
- (क) अपरिवर्तनीय रूप से इस अधिकार क्षेत्र के लिए सहमत है;
- (ख) **forum non conveniens** की किसी भी आपत्ति का त्याग करता है;
- (ग) व्यक्तिगत अधिकार क्षेत्र की अनुपस्थिति पर आधारित किसी भी आपत्ति का त्याग करता है;
- (घ) स्वीकार करता है कि कोई भी तामील प्लेटफ़ॉर्म पर पंजीकृत ईमेल पते पर की जा सकती है।

12.5. **अनिवार्य पूर्व-मध्यस्थता और चिह्नित मध्यस्थ (P2B विनियमन)।** किसी भी पंचाट से पूर्व, पक्षकार विवाद की लिखित सूचना से **तीस (30) दिनों** की अवधि के लिए **सद्भावपूर्ण वार्ता** के माध्यम से विवाद को सौहार्दपूर्ण ढंग से हल करने का प्रयास करने के लिए सहमत हैं, जो दूसरे पक्ष के संपर्क पते पर प्राप्ति की पावती सहित ईमेल द्वारा भेजी जानी चाहिए। विनियमन (EU) 2019/1150 के अनुच्छेद 12 के अनुरूप, SOS Expat कम से कम **दो (2) विशेषज्ञ, स्वतंत्र और उचित रूप से सुलभ मध्यस्थों** की पहचान करता है, जिनमें से वकील चुन सकता है: **(i) Centre de Médiation et d'Arbitrage de Paris (CMAP) — cmap.fr**; और **(ii) WIPO Arbitration and Mediation Center (जिनेवा) — wipo.int/amc**। SOS Expat **मध्यस्थता शुल्क का उचित हिस्सा** वहन करता है, प्रत्येक मामले में सद्भाव से मूल्यांकित, विशेष रूप से जब विवाद की राशि कम हो। मध्यस्थता की विफलता पंचाट अनुरोध दाखिल करने की पूर्व शर्त है।

12.6. **परिसीमा अवधि।** वकील द्वारा SOS Expat के विरुद्ध कोई भी कार्रवाई या दावा **ट्रिगरिंग घटना से तीन (3) वर्ष या वकील के न्यायक्षेत्र में लागू कानूनी अवधि के बीच जो भी कम हो** उसके भीतर लाया जाना चाहिए, जिसके अभाव में यह समय-वर्जित होगा। इस खंड का उद्देश्य या प्रभाव संबंधित न्यायक्षेत्र में किसी भी संविदात्मक कमी के अप्रवर्तनीय परिसीमा अवधियों को अनिवार्य न्यूनतम से नीचे कम करना नहीं है; ऐसे मामले में स्थानीय कानूनी अवधि लागू होती है।

---

## 13. अंतर्राष्ट्रीय संरक्षण खंड

13.1. **भ्रष्टाचार-रोधी।** वकील सहमत है कि वह सार्वजनिक या निजी अधिकारियों को रिश्वत या अनुचित लाभ की पेशकश, वादा या भुगतान नहीं करेगा। वकील लागू भ्रष्टाचार-रोधी विधियों (FCPA, UK Bribery Act, Sapin II अधिनियम, आदि) का पालन करता है।

13.2. **संचार की गोपनीयता।** प्लेटफ़ॉर्म के माध्यम से किए गए संचार (संदेश, फ़ोन कॉल) **गोपनीय** हैं। वकील इन्हें लिखित प्राधिकरण या विधिक बाध्यता को छोड़कर सहमत सेवा के अलावा अन्य उद्देश्यों के लिए रिकॉर्ड, प्रकट या उपयोग नहीं करेगा।

13.3. **गैर-याचना।** इन शर्तों की अवधि के दौरान और समाप्ति के **बारह (12) महीने** बाद तक, वकील संपर्क शुल्क से बचने के लिए प्लेटफ़ॉर्म के माध्यम से मिले उपयोगकर्ताओं को सीधे याचना नहीं करेगा।

13.4. **वकील की विशेष जिम्मेदारी।** वकील प्रदान किए गए परामर्श और सेवाओं की गुणवत्ता, सटीकता और वैधता के लिए **एकमात्र रूप से जिम्मेदार** है। वकील जिस देश में अभ्यास करता है वहाँ के विधिक और नियामक प्रावधानों के अनुपालन के लिए **पूर्णतः जिम्मेदार** है। SOS Expat वकील द्वारा दिए गए विधिक परामर्श की **गारंटी नहीं** देता और वकील की सेवाओं के कारण उपयोगकर्ता को हुई किसी भी हानि के लिए **किसी भी दायित्व का अस्वीकरण** करता है।

13.5. **कोई विधिक परामर्श संबंध नहीं।** SOS Expat **कोई विधि फ़र्म नहीं** है, न ही विधिक सेवा प्रदाता है। प्लेटफ़ॉर्म **संपर्क सेवाओं** तक सीमित है। कोई भी विधिक परामर्श संबंध **विशेष रूप से** वकील और उपयोगकर्ता के बीच, SOS Expat के **बाहर** स्थापित होता है। ग्राहक के साथ संपन्न कोई भी **मामला** SOS Expat के **बाहर** संभाला जाएगा।

13.6. **वकील-उपयोगकर्ता विवाद।** वकील और उपयोगकर्ता के बीच कोई भी विवाद **विशेष रूप से** उनके प्रत्यक्ष संबंध के अंतर्गत आता है। SOS Expat ऐसे विवादों में **हस्तक्षेप नहीं** करता और पक्ष, गारंटर, या मध्यस्थ के रूप में **जिम्मेदार नहीं** ठहराया जा सकता। SOS Expat वकील और ग्राहक के बीच विवादों के लिए **किसी भी प्रकार से जिम्मेदार नहीं** है।

---

## 14. विविध

14.1. **समनुदेशन**: SOS Expat शर्तों को किसी समूह इकाई या उत्तराधिकारी को समनुदेशित कर सकता है; वकील SOS Expat की लिखित सहमति के बिना समनुदेशित नहीं कर सकता।

14.2. **संपूर्ण समझौता**: शर्तें संपूर्ण समझौते का गठन करती हैं और समान विषय के संबंध में किसी भी पूर्व समझौते को प्रतिस्थापित करती हैं।

14.3. **सूचनाएँ**: प्लेटफ़ॉर्म पर प्रकाशन, इन-ऐप अधिसूचना, या संपर्क फ़ॉर्म के माध्यम से।

14.4. **व्याख्या**: शीर्षक सांकेतिक हैं। कोई contra proferentem नियम नहीं।

14.5. **भाषाएँ**: अनुवाद प्रदान किए जा सकते हैं; व्याख्या के लिए अंग्रेज़ी प्रबल होती है।

14.6. **आंशिक अमान्यता और पृथक्करणीयता।** यदि इन शर्तों का कोई प्रावधान सक्षम न्यायालय या मध्यस्थ द्वारा शून्य, अमान्य या अप्रवर्तनीय घोषित किया जाता है:
- (क) ऐसी अमान्यता अन्य प्रावधानों की वैधता को प्रभावित नहीं करती, जो प्रभावी रहते हैं;
- (ख) अमान्य प्रावधान को यथासंभव समकक्ष आर्थिक प्रभाव वाले वैध प्रावधान द्वारा प्रतिस्थापित किया जाएगा;
- (ग) पक्षकार प्रतिस्थापन प्रावधान पर सहमत होने के लिए सद्भाव से वार्ता करेंगे।

14.7. **भौगोलिक पृथक्करणीयता।** यदि इन शर्तों का कोई प्रावधान किसी विशिष्ट अधिकार क्षेत्र में अप्रवर्तनीय या अवैध है:
- (क) ऐसा प्रावधान केवल उस अधिकार क्षेत्र में लागू नहीं होता;
- (ख) यह अन्य सभी अधिकार क्षेत्रों में पूर्णतः लागू रहता है;
- (ग) स्थानीय अप्रवर्तनीयता शर्तों की वैश्विक वैधता को प्रभावित नहीं करती।

14.8. **गैर-त्याग।** SOS Expat द्वारा किसी अधिकार के प्रयोग में विफलता या विलंब उस अधिकार का त्याग नहीं है। कोई भी त्याग स्पष्ट और लिखित होना चाहिए। एक बार का त्याग सामान्य त्याग नहीं है।

14.9. **खंडों की स्वतंत्रता।** इन शर्तों का प्रत्येक खंड स्वतंत्र है। एक खंड की अमान्यता दायित्व सीमा, क्षतिपूर्ति, मध्यस्थता, या अधिकार क्षेत्र खंडों को अमान्य नहीं करती, जो विधि द्वारा अनुमत अधिकतम सीमा तक लागू रहेंगे।

14.10. **तृतीय पक्ष।** ये शर्तें तृतीय पक्षों को कोई अधिकार प्रदान नहीं करतीं (स्पष्ट रूप से उल्लिखित SOS Expat सहयोगियों को छोड़कर)। कोई तृतीय पक्ष शर्तों के प्रावधानों पर भरोसा नहीं कर सकता।

---

## 15. संपर्क

किसी भी विधिक प्रश्न या अनुरोध के लिए: **https://sos-expat.com/contact**
`;

  const defaultPt = `
# Termos e Condições de Utilização – Advogados (Global)

**SOS Expat da WorldExpat OÜ** (a « **Plataforma** », « **SOS** », « **nós** »)

**Versão 3.2 – Última atualização: 26 de abril de 2026**

---

## 1. Definições

**Aplicativo / Site / Plataforma**: serviços digitais operados pela **WorldExpat OÜ** (sociedade de direito estoniano, registro n° 16885621, sede social: Tallinn, Estônia) que permitem a ligação entre utilizadores (os « **Utilizadores** ») e profissionais do direito (os « **Advogados** »).

**Advogado**: qualquer profissional do direito devidamente autorizado a exercer em pelo menos uma jurisdição, independentemente de seu título local: avocat (França, Bélgica, Suíça), lawyer/attorney/counsel (EUA, Reino Unido, Commonwealth), solicitor/barrister (Reino Unido, Irlanda, Austrália), abogado (Espanha, América Latina), Rechtsanwalt (Alemanha, Áustria, Suíça), advogado (Portugal, Brasil), avvocato (Itália), advocaat (Países Baixos, Bélgica), адвокат/юрист (Rússia, CEI), 弁護士 (Japão), 律师 (China), ou qualquer outro título equivalente reconhecido pela ordem profissional ou autoridade competente de sua jurisdição de exercício.

**Ligação (Correspondência)**: a introdução técnica/operacional realizada pela Plataforma entre um Utilizador e um Advogado, concretizada por (i) transmissão de contactos, (ii) abertura de canal de comunicação (chamada, mensagem, vídeo) ou (iii) aceitação, pelo Advogado, de um pedido feito através da Plataforma.

**País de Atuação**: a jurisdição principalmente visada pelo Pedido no momento da Ligação. Na falta de indicação, considera-se o país de residência do Utilizador no momento do pedido; em caso de pluralidade, a jurisdição mais estreitamente ligada ao objeto do Pedido.

**Taxa de Ligação**: remuneração **devida pelo Utilizador à SOS Expat** por cada Ligação (art. 7), a título exclusivo do serviço técnico de ligação prestado pela Plataforma. Esta taxa não constitui, em caso algum, comissão, retrocessão ou partilha dos honorários do Advogado. O seu montante é definido na **tabela em vigor**, consultável no espaço pessoal do Advogado e do Utilizador. A SOS Expat pode modificar esta tabela nas condições previstas no artigo 2.5.

**Pedido (Requête)**: a situação ou projeto jurídico apresentado pelo Utilizador.

**Prestadores de Pagamento**: serviços de terceiros usados para receber o pagamento único do Utilizador e distribuir os fundos.

**Parceiro B2B**: qualquer pessoa coletiva (empresa, associação, mutualidade, comissão de trabalhadores, escritório, organização profissional, etc.) que tenha celebrado com a SOS Expat um contrato-quadro distinto prevendo que financia, no todo ou em parte, as Taxas de Ligação para os seus membros, colaboradores ou beneficiários (os « **Utilizadores B2B** »). Uma **Ligação B2B** é uma Ligação desencadeada por um Utilizador B2B ao abrigo de tal contrato-quadro. Por oposição, uma **Ligação B2C** é desencadeada por um Utilizador que paga diretamente as Taxas de Ligação.

**Listas de Sanções**: listas de pessoas, entidades ou países sujeitos a sanções econômicas ou embargos, nomeadamente as da OFAC (Estados Unidos), da União Europeia, da ONU, do Tesouro Britânico (HMT) e de qualquer outra autoridade competente.

---

## 2. Objeto, âmbito e aceitação

2.1. Os presentes Termos regulam o acesso e a utilização da Plataforma pelos Advogados.

2.2. A SOS Expat atua unicamente como intermediário técnico de ligação. A SOS Expat não exerce a advocacia, não presta consultoria jurídica e não é parte da relação Advogado-Utilizador.

2.3. **Aceitação eletrónica (click-wrap) e rastreabilidade.** O Advogado aceita os Termos ao marcar a caixa correspondente durante o registo e/ou ao usar a Plataforma. Este ato equivale a assinatura eletrónica e consentimento contratual nos termos do Regulamento eIDAS (UE) n°910/2014. A SOS Expat mantém **registros de auditoria com marcação temporal** incluindo: (i) a data e hora precisas (UTC) da aceitação, (ii) o endereço IP do Advogado, (iii) o identificador único de sessão, (iv) o user-agent do navegador, (v) a versão dos Termos aceitos, (vi) o hash criptográfico do documento aceito, e (vii) o identificador único do Advogado. Estes registros constituem **prova legal oponível** da aceitação dos Termos.

2.4. **Conservação das provas de aceitação.** Em conformidade com o RGPD e as obrigações legais de conservação, a SOS Expat conserva as provas de aceitação dos Termos durante **dez (10) anos** a contar da data de aceitação, ou até ao fim de qualquer litígio em curso, conforme aplicável. O Advogado pode, mediante pedido escrito através do formulário de contacto, obter um **certificado de aceitação** contendo os elementos de prova supramencionados. Esta conservação fundamenta-se no interesse legítimo da SOS Expat em dispor de provas em caso de litígio (art. 6.1.f RGPD) e na obrigação legal de conservação de contratos comerciais.

2.5. **Modificações (pré-aviso P2B).** A SOS Expat pode atualizar os Termos e/ou a tabela de taxas a qualquer momento, sob reserva de um **pré-aviso mínimo de quinze (15) dias** notificado ao Advogado em suporte duradouro (email para o endereço registado e publicação no espaço pessoal), em conformidade com o artigo 3.º do Regulamento (UE) 2019/1150 (« P2B »). O pré-aviso pode ser reduzido ou suprimido: (i) quando a modificação seja imposta pela lei ou por uma decisão de autoridade competente; (ii) por razões imperiosas de segurança ou de prevenção de fraude; ou (iii) para correções materiais ou tipográficas sem incidência económica. Durante o período de pré-aviso, o Advogado pode **rescindir sem penalidade** a sua relação com a Plataforma. Na falta de rescisão, a continuação do uso da Plataforma após o termo do pré-aviso vale como aceitação. Em caso de modificação substancial, o Advogado será convidado a reconfirmar expressamente a sua aceitação, registada nos termos do artigo 2.3.

2.6. Duração: indeterminada.

---

## 3. Estatuto do Advogado – Independência, conformidade e declarações

3.1. O Advogado atua como profissional independente; não existe vínculo de emprego, mandato, agência, parceria ou joint venture com a SOS Expat.

3.2. O Advogado é o único responsável por: (i) seus diplomas, títulos, inscrição na ordem dos advogados ou equivalentes e autorizações de exercício; (ii) seu seguro de responsabilidade civil profissional em vigor e adequado aos Países de Atuação; (iii) o cumprimento das leis e regras profissionais locais (deontologia, publicidade/angariação, conflitos de interesses, sigilo profissional, PBC-FT/KYC, fiscalidade, proteção do consumidor, etc.).

3.3. A SOS Expat não supervisiona nem avalia o conteúdo ou a qualidade dos conselhos do Advogado e não assume qualquer responsabilidade a esse respeito.

3.4. **Capacidade profissional (B2B).** O Advogado declara atuar exclusivamente para fins profissionais. Os regimes de proteção do consumidor não se aplicam à relação SOS Expat-Advogado.

3.5. **Declarações e garantias do Advogado.** Ao registar-se na Plataforma, o Advogado declara e garante expressamente que:
- (a) É **maior de idade** segundo o direito do seu país de residência e/ou de exercício;
- (b) Possui **plena capacidade jurídica** para contratar e exercer a sua profissão;
- (c) Não está sujeito a tutela, curatela, salvaguarda de justiça ou qualquer regime equivalente de proteção;
- (d) Não está sob **interdição de exercício** da sua profissão, temporária ou definitiva;
- (e) Não foi suspenso ou excluído da sua ordem profissional;
- (f) Não é objeto de qualquer **procedimento disciplinar em curso** suscetível de resultar em suspensão ou exclusão (ou compromete-se a informar imediatamente a SOS Expat caso tal ocorra);
- (g) Não figura em qualquer **Lista de Sanções** (OFAC, UE, ONU, HMT, ou outra);
- (h) Não foi **condenado penalmente** por factos incompatíveis com o exercício da sua profissão;
- (i) Todas as informações fornecidas durante o registo são **exatas, completas e atualizadas**;
- (j) Compromete-se a **informar imediatamente** a SOS Expat de qualquer alteração que afete estas declarações;
- (k) Possui o **direito efetivo de exercer a sua profissão de advogado** em cada um dos países que selecionou como "países de atuação" durante o seu registo ou posteriormente no seu perfil. O Advogado compromete-se a selecionar apenas jurisdições nas quais está **legalmente autorizado** a prestar aconselhamento jurídico ou a representar clientes, seja em virtude da sua inscrição local, de acordos de reconhecimento mútuo, de convenções internacionais ou de qualquer outro mecanismo legal. A seleção de um país de atuação no qual o Advogado não está habilitado a exercer constitui uma **violação grave** dos presentes Termos.
Qualquer declaração falsa constitui uma violação grave dos Termos podendo resultar em banimento imediato e definitivo, sem prejuízo de qualquer ação de reparação.

---

## 4. Criação de conta, verificações e segurança

4.1. Condições: direito de exercício válido em pelo menos uma jurisdição, comprovativos de identidade e qualificação, seguro de responsabilidade civil profissional em vigor.

4.2. Processo: criação de conta, fornecimento de documentos, validação manual podendo incluir entrevista por vídeo e controlos KYC/PBC-FT através de Prestadores.

4.3. Exatidão e atualização: o Advogado garante a exatidão/atualidade das informações; uma (1) conta por Advogado.

4.4. Segurança: o Advogado protege as suas credenciais; qualquer atividade através da conta é considerada realizada por ele; comunicação imediata de qualquer comprometimento.

4.5. **Verificações complementares a qualquer momento.** A SOS Expat reserva-se o direito de solicitar ao Advogado, **a qualquer momento e sem necessidade de justificar o pedido**, o fornecimento ou atualização de qualquer documento que ateste o seu direito de exercício, a sua inscrição na ordem ou equivalente, o seu seguro de responsabilidade civil profissional, a sua identidade, ou qualquer outro comprovativo pertinente. O Advogado compromete-se a responder a estes pedidos no prazo de **sete (7) dias úteis**. A falta de resposta ou o fornecimento de documentos não conformes pode resultar na suspensão imediata da conta.

4.6. **Moderação e controlo de qualidade.** A SOS Expat implementa uma política de moderação visando garantir a qualidade e a conformidade dos serviços oferecidos na Plataforma. Esta moderação pode incluir: (i) a verificação dos perfis e conteúdos publicados, (ii) a análise das avaliações e reclamações dos Utilizadores, (iii) o controlo do respeito pelos Termos e pelas leis aplicáveis, (iv) qualquer outra medida razoável de controlo de qualidade. O Advogado aceita submeter-se a esta moderação.

4.7. **Suspensão temporária da conta.** A SOS Expat pode **suspender imediatamente e sem aviso prévio** a conta do Advogado nos seguintes casos:
- (a) Suspeita de fraude, usurpação de identidade ou declaração falsa;
- (b) Reclamações múltiplas ou graves por parte dos Utilizadores;
- (c) Não fornecimento dos documentos solicitados ao abrigo do artigo 4.5;
- (d) Violação comprovada ou suspeita dos Termos ou das leis aplicáveis;
- (e) Comportamento prejudicial à imagem ou reputação da Plataforma;
- (f) Ordem de uma autoridade judicial, administrativa ou da ordem profissional;
- (g) Qualquer outro motivo legítimo apreciado soberanamente pela SOS Expat.
Durante a suspensão, o Advogado não pode aceder à sua conta nem receber novas Ligações. Os pagamentos em curso podem ser retidos até esclarecimento da situação.

4.8. **Banimento definitivo (rescisão por culpa).** A SOS Expat pode **rescindir definitivamente e sem aviso prévio** a conta do Advogado ("banimento") nos seguintes casos:
- (a) Violação grave ou repetida dos Termos;
- (b) Fraude comprovada, declaração falsa intencional ou usurpação de identidade/título;
- (c) Perda do direito de exercício (exclusão, suspensão pela ordem, não renovação da inscrição);
- (d) Condenação penal incompatível com o exercício da profissão;
- (e) Comportamento gravemente prejudicial aos Utilizadores ou à Plataforma;
- (f) Reincidência após uma suspensão temporária;
- (g) Contorno comprovado da Plataforma para evitar as Taxas de Ligação;
- (h) Incumprimento das obrigações de verificação KYC apesar de lembretes;
- (i) Qualquer outro motivo grave apreciado soberanamente pela SOS Expat.
O banimento é **definitivo e irrevogável**. O Advogado banido não pode criar nova conta. Os fundos pendentes podem ser retidos a título de indemnização forfetária, sem prejuízo de qualquer outra ação de reparação.

4.9. **Procedimento e notificação.** Em caso de suspensão ou banimento, a SOS Expat notifica o Advogado por email para o endereço registado. Esta notificação indica o motivo da medida (salvo obrigação legal de confidencialidade). O Advogado dispõe de um prazo de **quinze (15) dias** para apresentar as suas observações por escrito através do formulário de contacto. A SOS Expat examina estas observações mas não é obrigada a levantar a medida. A decisão da SOS Expat é **discricionária e definitiva**.

4.10. **Efeitos da suspensão ou do banimento.** Em caso de suspensão ou banimento:
- (a) O acesso à conta é imediatamente bloqueado;
- (b) O perfil do Advogado é retirado dos resultados de pesquisa;
- (c) As Ligações em curso podem ser canceladas;
- (d) Os pagamentos pendentes podem ser retidos ou compensados com qualquer montante devido à SOS Expat;
- (e) O Advogado permanece vinculado às suas obrigações (confidencialidade, não solicitação, etc.) em conformidade com as cláusulas de sobrevivência.

4.11. **Inatividade.** Em caso de **inatividade superior a 365 dias**, a conta pode ser desativada automaticamente após notificação. O Advogado pode reativar a sua conta mediante pedido, sob reserva de fornecer os documentos de verificação exigidos.

4.12. **Rescisão voluntária.** O Advogado pode encerrar a sua conta a qualquer momento após cumprir as suas obrigações em curso (prestações aceites, eventuais reembolsos). O pedido de encerramento é efetuado através do formulário de contacto. A SOS Expat procede ao encerramento no prazo de **trinta (30) dias**.

4.13. **Comunicações eletrónicas.** O Advogado consente em receber qualquer notificação relativa aos Termos, à moderação e às medidas de suspensão/banimento por via eletrónica (email, notificação in-app, publicação na Plataforma). O Advogado compromete-se a manter um endereço de email válido e a consultar regularmente as suas notificações.

4.14. **Sistema interno de tratamento de reclamações (Regulamento P2B).** Em conformidade com o artigo 11.º do Regulamento (UE) 2019/1150, a SOS Expat coloca à disposição do Advogado um **sistema interno de tratamento de reclamações gratuito**, acessível através do formulário de contacto (https://sos-expat.com/contact). A SOS Expat compromete-se a: (i) **acusar a receção** de qualquer reclamação no prazo de **sete (7) dias úteis**; (ii) tratar a reclamação **com seriedade e sem discriminação, num prazo razoável** (em regra geral **trinta (30) dias**); (iii) comunicar ao Advogado o resultado **fundamentado** do tratamento, em linguagem clara e compreensível, indicando as vias de recurso ulteriores (mediação no art. 12.5, arbitragem no art. 12.2); (iv) manter **estatísticas agregadas** sobre o funcionamento deste sistema, acessíveis anualmente.

---

## 5. Regras de utilização – Conflitos, confidencialidade, não contorno

5.1. **Conflitos de interesses.** O Advogado efetua uma verificação apropriada antes de qualquer aconselhamento. Em caso de conflito, retira-se e informa o Utilizador.

5.2. **Sigilo profissional e confidencialidade.** O Advogado respeita a confidencialidade e o sigilo profissional segundo o direito aplicável do País de Atuação.

**Política de gravação de chamadas:**
- (a) **Por defeito**, a SOS Expat **NÃO grava o conteúdo áudio** das chamadas entre Advogado e Utilizador. Apenas os **metadados técnicos** são conservados (data e hora, duração, identificadores Twilio, estado de conexão) para faturação, antifraude e resolução de disputas técnicas;
- (b) A SOS Expat **não ativa qualquer gravação áudio sem o consentimento expresso, prévio e separado do Advogado E do Utilizador**, manifestado antes do início da chamada por uma ação positiva distinta. Nenhuma gravação pode ser desencadeada unilateralmente pela SOS Expat, à exceção única de uma **requisição regular emanada de uma autoridade judicial competente do país do Advogado ou do Utilizador**, que apresente as garantias de ordem pública exigidas por essa jurisdição (nomeadamente quanto ao sigilo profissional do advogado);
- (c) Quando uma gravação é excecionalmente ativada no quadro do (b), é conservada pelo tempo estritamente necessário à sua finalidade, no limite máximo de **seis (6) meses** (salvo prorrogação imposta por procedimento judicial em curso), em conformidade com o RGPD e as recomendações das autoridades locais de proteção de dados;
- (d) **O Advogado proíbe-se a si mesmo** de gravar, transcrever integralmente, divulgar ou utilizar as trocas para fins distintos da prestação acordada, salvo autorização escrita do Utilizador ou obrigação legal;
- (e) **O sigilo profissional permanece intacto**: qualquer gravação eventual pela SOS Expat não pode ser utilizada contra o Advogado ou Utilizador em violação das regras deontológicas aplicáveis ao sigilo profissional.

5.3. **Não contorno.** A SOS Expat não recebe qualquer comissão sobre os honorários. Cada nova Ligação com um novo Utilizador através da Plataforma dá lugar às Taxas de Ligação. É proibido contornar a Plataforma para evitar estas taxas aquando de uma nova introdução.

5.4. **Comportamentos proibidos.** Usurpação de identidade/título, conteúdos ilícitos, manipulação, conluio/boicote visando prejudicar a Plataforma, violação de leis sobre sanções/exportação, ou qualquer atividade ilegal.

5.5. **Disponibilidade.** A Plataforma é fornecida "tal qual"; nenhuma disponibilidade ininterrupta é garantida (manutenção, incidentes, força maior). O acesso pode ser restringido se a lei o impuser.

---

## 6. Relação Advogado–Utilizador (fora da Plataforma)

6.1. Após a Ligação, o Advogado e o Utilizador podem contratar fora da Plataforma (a SOS Expat não intervém na fixação nem na cobrança dos honorários, salvo mecanismo de pagamento único descrito abaixo).

6.2. O Advogado fornece as suas convenções de honorários segundo o direito local, cobra/repassa os impostos aplicáveis e respeita as regras locais (publicidade, angariação, conflitos de interesses, consumidores).

6.3. A SOS Expat não é responsável pela qualidade, exatidão ou resultado dos conselhos do Advogado.

---

## 7. Taxas, pagamento único e impostos

7.1. **Taxa de Ligação (remuneração da Plataforma).** As Taxas de Ligação remuneram **exclusivamente o serviço técnico de ligação** prestado pela SOS Expat ao **Utilizador**. São **devidas pelo Utilizador**, e **não pelo Advogado**. O seu montante é definido na **tabela tarifária em vigor**, consultável no espaço pessoal do Advogado, por Ligação, sem impostos e sem taxas do Prestador de pagamento. Qualquer modificação da tabela é efetuada nas condições do artigo 2.5 (pré-aviso mínimo de quinze (15) dias). O Advogado é convidado a consultar regularmente a tabela tarifária em vigor.

7.2. **Caracterização jurídica do pagamento — duas dívidas distintas e independentes.** O pagamento efetuado pelo Utilizador através da Plataforma decompõe-se **juridicamente em duas dívidas distintas e independentes**, apesar do seu pagamento por uma cobrança única por razões de comodidade operacional:
- (a) **Dívida « Ligação »**: quantia **devida pelo Utilizador à SOS Expat** a título do serviço técnico de ligação (Taxa de Ligação, art. 7.1);
- (b) **Dívida « Honorários »**: quantia **devida pelo Utilizador ao Advogado** a título dos honorários da prestação jurídica acordada entre eles. A convenção de honorários, o conteúdo e a qualidade da prestação são da competência **exclusiva** da relação Advogado–Utilizador, fora da Plataforma (art. 6 e 13.5).

**A SOS Expat não recebe, não reclama e não tem direito a qualquer comissão, retrocessão, partilha, percentagem ou fração qualquer dos honorários do Advogado — nomeadamente nas jurisdições cujas regras deontológicas proíbem a partilha de honorários com não-advogado. As Taxas de Ligação constituem a única remuneração da SOS Expat e provêm exclusivamente da dívida do Utilizador referida em (a).**

O Prestador de pagamento, atuando para a parte (b) na qualidade de **agente pagador do Advogado**, transfere a este último os honorários recebidos, sob dedução apenas das taxas bancárias de processamento e, se aplicável, das taxas de conversão de moeda (art. 7.3 e 7.4). **O montante líquido que o Advogado receberá é apresentado no seu painel de controlo antes e após cada transação**, permitindo-lhe aceitar ou recusar a ligação com pleno conhecimento de causa.

7.3. **Taxas bancárias do Prestador de pagamento.** O Prestador de pagamento — **Stripe Payments Europe Ltd.** (Irlanda, UE, certificado PCI-DSS Nível 1) **ou PayPal (Europe) S.à r.l. et Cie, S.C.A.** (Luxemburgo, UE, certificado PCI-DSS), conforme o país de residência e disponibilidade — cobra taxas de processamento sobre cada transação. **Estas taxas bancárias são integralmente a cargo do Advogado** e são automaticamente deduzidas do montante que lhe é transferido. O detalhe destas taxas está disponível nas condições do Prestador de pagamento (Stripe: stripe.com/pt/pricing; PayPal: paypal.com/pt/webapps/mpp/merchant-fees) e no painel de controlo do Advogado para cada transação.

7.4. **Taxas de câmbio e conversão de moedas.** Quando a moeda de pagamento do Utilizador difere da moeda da conta bancária do Advogado, são aplicadas **taxas de conversão de moeda** pelo Prestador de pagamento. **Estas taxas de câmbio são integralmente a cargo do Advogado** e são deduzidas do montante que lhe é transferido. As taxas de câmbio aplicadas são as do Prestador de pagamento no momento da transferência. O Advogado reconhece e aceita expressamente que a SOS Expat não tem qualquer controlo sobre estas taxas de câmbio e declina qualquer responsabilidade quanto às flutuações de moedas ou às taxas aplicadas pelo Prestador.

7.5. **Cálculo do montante líquido transferido ao Advogado.** O montante líquido transferido ao Advogado corresponde à **dívida « Honorários »** devida pelo Utilizador (art. 7.2.b), sob dedução **apenas**: (i) das **taxas bancárias** do Prestador de pagamento aplicáveis à parte « Honorários » (art. 7.3) e (ii) se aplicável, das **taxas de conversão de moeda** (art. 7.4). **As Taxas de Ligação (art. 7.2.a) não são, em caso algum, deduzidas dos honorários**: são cobradas a título de uma dívida distinta do Utilizador para com a SOS Expat. **O Advogado é informado do montante exato que receberá no seu painel de controlo antes de cada prestação e pode assim decidir com pleno conhecimento de causa aceitar ou não a ligação.**

7.6. **Exigibilidade e não reembolso.** As Taxas de Ligação são devidas a partir da Ligação efetiva e são **não reembolsáveis** (salvo gesto comercial discricionário da SOS Expat em caso de falha exclusivamente imputável à Plataforma e na medida permitida pela lei).

7.7. **Reembolso ao Utilizador.** Se um reembolso for concedido ao Utilizador, é imputado à parte do Advogado: a SOS Expat pode reter/compensar o montante correspondente nas transferências futuras do Advogado, ou solicitar o reembolso direto se nenhuma transferência estiver prevista. As Taxas de Ligação permanecem adquiridas à SOS Expat, salvo decisão discricionária em contrário.

7.8. **Prazos de pagamento do Advogado consoante o canal.** Sob reserva da conclusão do processo KYC (artigo 8), os prazos de pagamento da remuneração líquida do Advogado diferem consoante o canal da Ligação:
- (a) **Ligações B2C** (pagamento direto pelo Utilizador): a remuneração do Advogado é colocada em pagamento **imediatamente após o termo da chamada** pelo Prestador de pagamento, sob reserva apenas dos prazos técnicos de processamento bancário, antifraude e de captura do pagamento próprios do Prestador (tipicamente entre um (1) e sete (7) dias úteis consoante o país do Advogado e a maturidade da sua conta junto do Prestador);
- (b) **Ligações B2B** (pagamento pelo Parceiro B2B): tendo em conta o modelo de faturação diferida aplicável ao Parceiro B2B (faturação mensal ou « net-30 »), a remuneração do Advogado é paga **num prazo de trinta (30) dias** após a data da chamada;
- (c) Em todos os casos, o pagamento pode ser suspenso em caso de litígio, reclamação do Utilizador ou do Parceiro, verificação KYC/CBC-FT em curso, ou qualquer outra circunstância prevista nos presentes Termos.

7.9. **Impostos.** O Advogado permanece **único responsável** por todas as suas obrigações fiscais (imposto sobre o rendimento, IVA, contribuições sociais, encargos profissionais, etc.) na sua jurisdição de residência e/ou de exercício. Os montantes transferidos ao Advogado são **montantes brutos**; o Advogado é responsável pela declaração e pagamento de todos os impostos aplicáveis. A SOS Expat cobra e remete, quando exigido por lei, o IVA/equivalente local sobre as Taxas de Ligação apenas.

7.10. **Compensação.** A SOS Expat pode compensar qualquer montante que o Advogado lhe deva (a título de reembolso ao Utilizador, penalidade, ou outra obrigação) com qualquer quantia devida ao Advogado.

7.11. **Transparência tarifária e histórico.** O Advogado pode a qualquer momento consultar no seu painel de controlo pessoal: (i) o detalhe completo de cada transação, (ii) o montante bruto pago pelo Utilizador, (iii) as Taxas de Ligação deduzidas, (iv) as taxas bancárias do Prestador de pagamento, (v) as taxas de câmbio se aplicável, (vi) o montante líquido transferido ou a transferir, e (vii) o histórico de todas as suas transações. Estas informações são conservadas e acessíveis durante toda a duração da conta e **cinco (5) anos** após o seu encerramento.

7.12. **Declaração fiscal automática (Diretiva DAC7 — UE 2021/514).** O Advogado residente num Estado-Membro da União Europeia é informado de que a SOS Expat, na sua qualidade de operador de plataforma declarante, está obrigada a **declarar anualmente** às autoridades fiscais competentes (ao abrigo da Diretiva (UE) 2021/514 dita « DAC7 ») as informações relativas aos Advogados ativos residentes na UE, designadamente: nome, endereço, identificador fiscal (TIN/NIF), Estado de residência, montante total das contrapartidas recebidas através da Plataforma e número de Ligações, repartidos por trimestre civil. O Advogado compromete-se a fornecer e a manter atualizadas estas informações no seu espaço pessoal. A falta de comunicação ou de atualização pode implicar a suspensão dos pagamentos até regularização, em conformidade com as disposições DAC7.

7.13. **Canal B2B — Ligações através de um Parceiro B2B.**

(a) **Âmbito.** Uma Ligação B2B é desencadeada por um Utilizador B2B, beneficiário de um contrato-quadro celebrado entre a SOS Expat e um Parceiro B2B (art. 1).

(b) **Adaptação das duas dívidas.** O mecanismo das duas dívidas (art. 7.2) aplica-se da seguinte forma em B2B:
- a **dívida « Ligação »** é devida pelo **Parceiro B2B** à SOS Expat (no todo ou em parte conforme o contrato-quadro), de modo que o **Utilizador B2B em regra geral não paga nada**, ou paga apenas um eventual ticket moderador à SOS Expat;
- a **dívida « Honorários »** continua devida pelo **Utilizador final** ao **Advogado**, salvo cláusula expressa do contrato-quadro que preveja a assunção total ou parcial dos honorários pelo Parceiro B2B (caso em que o Parceiro se torna devedor da parte assumida perante o Advogado, através do mecanismo de agente pagador do art. 7.2).
- O Advogado não está, em caso algum, dispensado de assinar uma convenção de honorários conforme à sua deontologia local (art. 6.2).

(c) **Tabelas Advogado distintas B2C / B2B — o Advogado aceita-o expressamente.** O Advogado **reconhece e aceita expressamente** que **a remuneração líquida que recebe por uma Ligação B2B pode diferir**, para mais ou para menos, **da que recebe por uma Ligação B2C** (por exemplo: tarifa fixa negociada com o Parceiro, consideração de um volume garantido, assunção total ou parcial dos honorários pelo Parceiro, ou desconto concedido ao Parceiro). O **canal de origem (B2C ou B2B)** e o **montante exato** que o Advogado receberá são **apresentados no seu painel de controlo antes de cada Ligação**, permitindo-lhe aceitá-la ou recusá-la livremente e com pleno conhecimento de causa. **Nenhuma obrigação de aceitação** recai sobre o Advogado em razão do canal ou da tarifa proposta.

(d) **Inoponibilidade do contrato-quadro B2B ao Advogado.** As estipulações do contrato-quadro celebrado entre a SOS Expat e o Parceiro B2B **não são oponíveis ao Advogado**; apenas os presentes Termos e as informações apresentadas no painel de controlo do Advogado regem a relação entre a SOS Expat e o Advogado por ocasião de uma Ligação B2B.

(e) **Todas as restantes estipulações dos presentes Termos aplicam-se** às Ligações B2B.

(f) **Tabelas em vigor à data dos presentes Termos (a título indicativo).** À data da última atualização dos presentes Termos, as tabelas líquidas de remuneração do Advogado são as seguintes:
- **Ligação B2C**: **trinta euros (30 €) ou trinta dólares dos EUA (30 USD)** líquidos por Ligação aceite e executada, consoante a moeda do pagamento;
- **Ligação B2B**: **vinte euros (20 €) ou vinte dólares dos EUA (20 USD)** líquidos por Ligação aceite e executada, consoante a moeda do pagamento.

Estes montantes são **indicativos** e refletem a tabela em vigor na data de atualização dos presentes Termos. A **tabela atualizada** está permanentemente acessível no painel de controlo do Advogado antes de cada Ligação. Qualquer evolução está sujeita ao pré-aviso de quinze (15) dias previsto no artigo 7.14.

7.14. **Modificação da tabela de remuneração do Advogado.** A SOS Expat reserva-se o direito de **modificar a qualquer momento a tabela de remuneração líquida do Advogado**, quer se trate:
- (i) da **tabela B2C** — por modificação das Taxas de Ligação ou da sua estrutura (que se repercute no líquido recebido pelo Advogado);
- (ii) da **tabela B2B** — por modificação da remuneração fixa ou variável aplicável às Ligações B2B;
- (iii) ou de qualquer outra componente da remuneração líquida (por exemplo: moedas, escalões de volume, escalões de antiguidade).

Qualquer modificação está sujeita ao **pré-aviso mínimo de quinze (15) dias** previsto no artigo 2.5, notificado ao Advogado em suporte duradouro (email para o endereço registado e publicação no seu espaço pessoal). Durante o período de pré-aviso, o Advogado pode **rescindir sem penalidade** a sua relação com a Plataforma ou continuar a **recusar caso a caso** as Ligações cuja remuneração já não lhe convenha, recordando-se que **o Advogado nunca é obrigado a aceitar uma Ligação**. **As Ligações já aceites antes do termo do pré-aviso permanecem remuneradas à tarifa em vigor à data da aceitação.** Na falta de rescisão, a continuação do uso da Plataforma após o termo do pré-aviso vale como aceitação da nova tabela.

---

## 8. Pagamentos – KYC/PBC-FT – Sanções

8.1. **Prestadores de pagamento.** Os pagamentos são processados **exclusivamente** por Prestadores terceiros certificados **PCI-DSS**: **Stripe Payments Europe Ltd.** (Irlanda, UE) e/ou **PayPal (Europe) S.à r.l. et Cie, S.C.A.** (Luxemburgo, UE). O Prestador aplicável depende do país de residência/atuação do Advogado (Stripe abrange atualmente 44 países, PayPal 150+ países). O Advogado **aceita expressamente** as condições gerais e os processos KYC/PBC-FT do(s) Prestador(es) aplicável(eis). **A SOS Expat NÃO é um banco, instituição de pagamento ou instituição de crédito**; a SOS Expat é apenas um cliente comercial dos Prestadores de pagamento mencionados.

8.2. A SOS Expat pode diferir, reter ou cancelar pagamentos em caso de suspeita de fraude, de não conformidade ou de ordem legal.

8.3. **Sanções internacionais e embargos.** O Advogado declara e garante:
- (a) Não figurar, direta ou indiretamente, numa **Lista de Sanções** (OFAC/SDN, UE, ONU, HMT, ou qualquer outra lista de sanções aplicável);
- (b) Não ser detido ou controlado, direta ou indiretamente, por uma pessoa ou entidade figurando numa Lista de Sanções;
- (c) Não ser residente, nacional ou estar situado num **país ou território objeto de embargo global ou de medidas restritivas completas** ao abrigo das leis e regulamentos aplicáveis, em particular dos Prestadores de pagamento, da União Europeia, das Nações Unidas, do OFAC (Estados Unidos), do HMT (Reino Unido) ou de qualquer outra autoridade competente. A lista atualizada destes países e territórios é mantida pelas autoridades supramencionadas e faz fé; a SOS Expat não estabelece nem publica a sua própria lista geopolítica;
- (d) Não utilizar a Plataforma para transações envolvendo pessoas, entidades ou países sancionados;
- (e) Respeitar todas as **leis de controlo de exportações** aplicáveis.
A SOS Expat reserva-se o direito de **restringir ou bloquear imediatamente o acesso** à Plataforma em qualquer território sujeito a sanções ou embargos, ou para qualquer Advogado suspeito de violar estas disposições, sem aviso prévio nem indemnização. A SOS Expat pode também ser obrigada a **congelar os fundos** do Advogado em caso de ordem de uma autoridade competente.

### Fundos não reclamados e verificação KYC

8.4. **Obrigação de completar o processo de verificação (KYC).** Para receber os pagamentos resultantes das prestações realizadas através da Plataforma, o Advogado compromete-se a completar o processo de verificação de identidade (KYC - Know Your Customer) junto do Prestador de pagamento aplicável (**Stripe** ou **PayPal**, conforme o seu país de residência) no mais breve prazo após a sua inscrição. O Advogado reconhece que a ausência de verificação KYC completa impede tecnicamente a transferência de fundos para a sua conta bancária ou conta PayPal.

8.5. **Conservação dos fundos em espera.** Quando um pagamento é efetuado por um Utilizador por uma prestação realizada por um Advogado que não completou a sua verificação KYC, os fundos correspondentes à parte do Advogado (após dedução das taxas de ligação da Plataforma) são conservados em espera numa conta de depósito. A Plataforma compromete-se a:
- Notificar o Advogado por email da existência de fundos em espera;
- Enviar lembretes regulares (aos 7 dias, 30 dias, 60 dias, 90 dias, 120 dias e 150 dias);
- Fornecer ao Advogado todos os meios necessários para completar a sua verificação KYC.

8.6. **Fundos em espera prolongada — taxa de gestão e transferência às autoridades competentes.** Quando a verificação KYC não for concluída no prazo de **cento e oitenta (180) dias** a contar do primeiro pagamento colocado em espera, e apesar das notificações previstas no artigo 8.5:
- (a) **Taxa de gestão forfetária.** A SOS Expat pode cobrar dos fundos em espera uma **taxa de gestão forfetária razoável, limitada a dez por cento (10 %) do montante retido**, cobrindo estritamente os custos administrativos efetivos de conservação, tentativas de contacto e tratamento contabilístico;
- (b) **Conservação prolongada.** O saldo permanece conservado na conta segregada do Prestador de pagamento (ou consignado pela SOS Expat se as condições técnicas o exigirem). O Advogado pode, a qualquer momento durante esta fase, completar o seu KYC e reclamar os fundos;
- (c) **Transferência às autoridades competentes (bens em desuso).** Decorrido um prazo global de **cinco (5) anos** a contar do primeiro pagamento colocado em espera, na falta de reclamação válida, os fundos residuais são **transferidos para a autoridade competente do país de residência do Advogado** ao abrigo das regras aplicáveis aos fundos em desuso (por exemplo, em França, à Caisse des dépôts ao abrigo da lei Eckert; nos Estados Unidos, ao programa de unclaimed property do Estado competente; no Reino Unido, ao Dormant Assets Scheme; em Portugal, ao Fundo de Garantia de Depósitos ou outro mecanismo legal aplicável a bens prescritos; no Brasil, ao mecanismo de prescrição quinquenal aplicável; e, de modo geral, ao mecanismo local equivalente). **A SOS Expat não se apropria, em caso algum, destes fundos residuais.**

8.7. **Reclamação durante a conservação prolongada.** O Advogado pode, a qualquer momento durante a fase de conservação prolongada (b), enviar à SOS Expat um pedido de reclamação fundamentado através do formulário de contacto, acompanhado de uma **verificação KYC completa** (sendo o KYC uma condição técnica imposta pelo Prestador de pagamento e pelas obrigações PBC-FT). A SOS Expat examina o pedido no prazo de **trinta (30) dias**. Em caso de aceitação, os fundos são transferidos sob dedução apenas das taxas de gestão referidas em (a). Em caso de força maior devidamente justificada ou de incapacidade médica documentada, estas taxas podem ser reduzidas ou suprimidas a critério razoável da SOS Expat.

8.8. **Aceitação expressa.** Ao inscrever-se na Plataforma, o Advogado declara ter tomado conhecimento das modalidades do presente artigo 8 e aceita-as expressamente. Esta aceitação constitui uma condição essencial de acesso ao estatuto de prestador.

---

## 9. Dados pessoais (quadro global – RGPD/DSA)

9.1. **Papéis.** Para os dados dos Utilizadores recebidos para efeitos de Ligação, a SOS Expat e o Advogado atuam cada um como responsável pelo tratamento para as suas finalidades respetivas, em conformidade com o **Regulamento (UE) 2016/679 (RGPD)**.

9.2. **Bases e finalidades.** Execução do contrato (Ligação), interesses legítimos (segurança, prevenção de fraude, melhoria), conformidade legal (PBC-FT, sanções), e, se aplicável, consentimento.

9.3. **Transferências internacionais** com garantias apropriadas quando exigido (cláusulas contratuais tipo, decisão de adequação, etc.).

9.4. **Direitos e contacto.** Exercício dos direitos (acesso, retificação, apagamento, portabilidade, oposição) através do formulário de contacto da Plataforma.

9.5. **Segurança.** Medidas técnicas/organizacionais razoáveis; notificação de violações segundo as leis aplicáveis (72 horas em conformidade com o RGPD).

9.6. O Advogado trata os dados recebidos em conformidade com o direito do País de Atuação e com a sua deontologia (sigilo profissional).

9.7. **Conformidade DSA.** A Plataforma opera como **serviço intermediário** nos termos do **Regulamento (UE) 2022/2065 (Digital Services Act)**. A SOS Expat implementa mecanismos de denúncia de conteúdos ilícitos e coopera com as autoridades competentes em conformidade com o DSA.

---

## 10. Propriedade intelectual

A Plataforma, as suas marcas, logótipos, bases de dados e conteúdos são protegidos. Nenhum direito é cedido ao Advogado, exceto um direito pessoal, não exclusivo, intransferível de acesso durante a vigência dos Termos. Os conteúdos fornecidos pelo Advogado (perfil, foto, descritivos) são objeto de uma licença mundial, não exclusiva a favor da SOS Expat para o alojamento e exibição na Plataforma.

---

## 11. Garantias, responsabilidade e indemnização

11.1. Nenhuma garantia quanto aos serviços jurídicos; a SOS Expat não assegura nem o resultado, nem a qualidade, nem o volume de negócios.

11.2. Plataforma "tal qual"; nenhuma garantia de acessibilidade contínua.

11.3. **Limitação de responsabilidade**: na medida permitida, a responsabilidade total da SOS Expat perante o Advogado é limitada aos danos diretos e não pode exceder o total das Taxas de Ligação recebidas pela SOS Expat a título da transação na origem da reclamação.

11.4. **Exclusões**: nenhum dano indireto/consequencial/especial/punitivo (perda de lucros, clientela, reputação, etc.).

11.5. **Indemnização**: o Advogado indemniza e garante a SOS Expat (e os seus afiliados, dirigentes, empregados, agentes) contra qualquer reclamação/prejuízo/custos (incluindo honorários de advogado) ligados a (i) os seus incumprimentos dos Termos/leis, (ii) os seus conteúdos, (iii) os seus conselhos/omissões.

11.6. **Renúncia aos recursos.** O Advogado **renuncia expressa e irrevogavelmente** a qualquer recurso contra a SOS Expat a título (i) dos danos resultantes da prestação de serviços jurídicos, (ii) das perdas indiretas, (iii) dos litígios contratuais com os Utilizadores, (iv) de qualquer falha dos serviços fornecidos pelo Advogado. Esta renúncia aplica-se na medida máxima permitida pela lei.

11.7. Nenhuma representação: nada implica mandato, emprego, parceria ou joint venture entre a SOS Expat e o Advogado.

11.8. **Força maior.** A SOS Expat não é responsável pelos atrasos ou falhas causados por eventos de **força maior** (catástrofe natural, guerra, pandemia, ciberataque, falha elétrica ou de internet, decisão governamental, greve, etc.).

11.9. **Sobrevivência das cláusulas.** Os seguintes artigos sobrevivem à rescisão ou expiração dos Termos, qualquer que seja a causa: artigos 2 (provas de aceitação), 3.5 (declarações), 5 (regras de utilização), 7 (taxas e pagamentos), 8 (KYC e sanções), 9 (dados pessoais), 10 (propriedade intelectual), 11 (responsabilidade e indemnização), 12 (direito aplicável e arbitragem), 13 (cláusulas de proteção) e 14 (diversos). Estas cláusulas permanecem em vigor pelo tempo necessário para produzirem os seus efeitos.

---

## 12. Direito aplicável – Arbitragem – Jurisdição estoniana – Ações coletivas

12.1. **Direito aplicável e primazia da deontologia local.** Os presentes Termos, a sua interpretação, validade e execução são regidos exclusivamente pelo **direito estoniano**, com exclusão das suas regras de conflito de leis. **Para evitar qualquer ambiguidade**, as regras deontológicas da profissão de advogado aplicáveis no País de Atuação e/ou no país de inscrição na ordem do Advogado (nomeadamente em matéria de sigilo profissional, de proibição de partilha de honorários com não-advogado, de enquadramento da publicidade e da angariação, de conflitos de interesses, e de gestão dos fundos de clientes) são **consideradas de ordem pública** e **prevalecem** sobre qualquer estipulação contrária ou ambígua dos presentes Termos. Nenhuma cláusula dos Termos pode ser interpretada como impondo ou autorizando o Advogado a adotar um comportamento contrário à sua deontologia local; em caso de conflito, o Advogado abstém-se e informa a SOS Expat sem demora.

12.2. **Arbitragem internacional obrigatória.** Qualquer litígio, diferendo ou reclamação decorrente dos presentes Termos ou a eles relativo, incluindo a sua validade, interpretação, execução ou rescisão, será decidido definitivamente por **arbitragem** em conformidade com o Regulamento de Arbitragem da **Câmara de Comércio Internacional (CCI)**.
- **Sede da arbitragem**: Tallinn, Estônia;
- **Língua da arbitragem**: **inglês**;
- **Número de árbitros**: um (1) árbitro único, salvo se o montante em litígio exceder 100 000 €, caso em que três (3) árbitros;
- **Direito aplicável ao fundo**: direito estoniano (art. 12.1);
- **Procedimento**: confidencial. As partes comprometem-se a não divulgar a existência, o conteúdo ou o resultado da arbitragem, salvo obrigação legal ou para a execução da sentença.
A sentença arbitral é **definitiva e obrigatória** para as partes. As partes renunciam a qualquer recurso de anulação na medida permitida pela lei.

12.3. **Renúncia às ações coletivas e ao júri.** Na medida máxima permitida pela lei aplicável:
- (a) O Advogado renuncia a participar em qualquer **ação coletiva, ação de grupo ou ação representativa** contra a SOS Expat;
- (b) Qualquer litígio será resolvido numa **base individual apenas**;
- (c) O Advogado renuncia expressamente a qualquer **direito a um julgamento perante júri** (jury trial waiver);
- (d) O Advogado renuncia a qualquer ação em **class action, consolidated action ou representative action** segundo o direito americano ou qualquer direito equivalente.

12.4. **Competência exclusiva dos tribunais estonianos.** Para qualquer pedido não arbitrável segundo a lei aplicável, para as medidas provisórias ou conservatórias urgentes antes da constituição do tribunal arbitral, e para a execução das sentenças arbitrais, os **tribunais de Tallinn (Estônia)** têm **competência exclusiva**. O Advogado:
- (a) Consente irrevogavelmente nesta jurisdição;
- (b) Renuncia a qualquer exceção de **forum non conveniens**;
- (c) Renuncia a qualquer exceção fundada na ausência de competência pessoal;
- (d) Aceita que qualquer citação possa ser feita para o endereço de email registado na Plataforma.

12.5. **Mediação prévia obrigatória e mediadores identificados (Regulamento P2B).** Antes de qualquer arbitragem, as partes comprometem-se a tentar resolver o litígio amigavelmente por **negociação de boa fé** durante um período de **trinta (30) dias** a contar da notificação escrita do diferendo, enviada por email com aviso de receção para o endereço de contacto da outra parte. Em conformidade com o artigo 12.º do Regulamento (UE) 2019/1150, a SOS Expat identifica pelo menos **dois (2) mediadores especializados**, independentes e razoavelmente acessíveis, dentre os quais o Advogado pode escolher: **(i) o Centre de Médiation et d'Arbitrage de Paris (CMAP) — cmap.fr**; e **(ii) o WIPO Arbitration and Mediation Center (Genebra) — wipo.int/amc**. A SOS Expat suporta uma **parte razoável dos custos de mediação**, apreciada de boa fé caso a caso, em particular quando o litígio é de baixo valor. O fracasso da mediação é uma condição prévia à introdução de um pedido de arbitragem.

12.6. **Prescrição.** Qualquer ação ou reclamação do Advogado contra a SOS Expat deve ser introduzida no **prazo mais curto entre três (3) anos** a contar da ocorrência do facto gerador **e o prazo legal aplicável** na jurisdição do Advogado, sob pena de caducidade. A presente cláusula não tem por objeto nem por efeito reduzir abaixo do mínimo imperativo os prazos de prescrição que sejam inoponíveis a qualquer redução convencional na jurisdição em causa; nesse caso, aplica-se o prazo legal local.

---

## 13. Cláusulas de proteção internacional

13.1. **Anticorrupção.** O Advogado compromete-se a não oferecer, prometer ou pagar subornos ou vantagens indevidas a agentes públicos ou privados. Respeita as leis anticorrupção aplicáveis (FCPA, UK Bribery Act, lei Sapin II, etc.).

13.2. **Confidencialidade das trocas.** As trocas realizadas através da Plataforma (mensagens, chamadas telefónicas) são **confidenciais**. O Advogado abstém-se de as gravar, divulgar ou utilizar para outros fins que não a prestação acordada, salvo autorização escrita ou obrigação legal.

13.3. **Não solicitação.** Durante a vigência dos Termos e **doze (12) meses** após a sua rescisão, o Advogado abstém-se de solicitar diretamente os Utilizadores conhecidos através da Plataforma para evitar as Taxas de Ligação.

13.4. **Responsabilidade exclusiva do Advogado.** O Advogado é **único responsável** pela qualidade, exatidão e legalidade dos conselhos e serviços que fornece. O Advogado é **inteiramente responsável** pelo respeito das disposições legais e regulamentares do país onde exerce. A SOS Expat **não garante** os conselhos jurídicos prestados pelo Advogado e **declina qualquer responsabilidade** por qualquer prejuízo sofrido por um Utilizador em consequência dos serviços do Advogado.

13.5. **Ausência de relação de aconselhamento.** A SOS Expat **não é um escritório de advogados**, nem um prestador de serviços jurídicos. A Plataforma limita-se à **ligação**. Qualquer relação de aconselhamento jurídico é estabelecida **exclusivamente** entre o Advogado e o Utilizador, **fora** da SOS Expat. **Qualquer dossier** que seja concluído com um cliente será feito **fora da SOS Expat**.

13.6. **Litígios Advogado-Utilizador.** Qualquer litígio entre um Advogado e um Utilizador é da competência **exclusiva** da sua relação direta. A SOS Expat **não intervém** nestes litígios e **não pode ser chamada** como parte, garante ou mediador. A SOS Expat **não é em caso algum responsável** pelos litígios entre Advogado e cliente.

---

## 14. Diversos

14.1. **Cessão**: a SOS Expat pode ceder os Termos a uma entidade do seu grupo ou a um sucessor; o Advogado não pode ceder sem acordo escrito da SOS Expat.

14.2. **Integralidade**: os Termos constituem o acordo completo e substituem qualquer acordo anterior relativo ao mesmo objeto.

14.3. **Notificações**: por publicação na Plataforma, notificação in-app ou através do formulário de contacto.

14.4. **Interpretação**: os títulos são indicativos. Nenhuma regra contra proferentem.

14.5. **Línguas**: podem ser fornecidas traduções; o inglês prevalece para a interpretação.

14.6. **Nulidade parcial e divisibilidade.** Se uma estipulação dos presentes Termos for declarada nula, inválida ou inaplicável por um tribunal ou árbitro competente:
- (a) Esta nulidade não afeta a validade das outras estipulações, que permanecem em vigor;
- (b) A estipulação nula será substituída por uma estipulação válida de efeito económico equivalente, na medida do possível;
- (c) As partes negociarão de boa fé para acordar uma estipulação de substituição.

14.7. **Divisibilidade geográfica.** Se uma estipulação dos presentes Termos for inaplicável ou ilegal numa jurisdição específica:
- (a) Esta estipulação não se aplica apenas nessa jurisdição;
- (b) Permanece plenamente aplicável em todas as outras jurisdições;
- (c) A inaplicabilidade local não afeta a validade global dos Termos.

14.8. **Não renúncia.** A ausência ou atraso no exercício de um direito pela SOS Expat não implica renúncia a esse direito. Qualquer renúncia deve ser expressa e por escrito. Uma renúncia pontual não constitui uma renúncia geral.

14.9. **Independência das cláusulas.** Cada cláusula dos presentes Termos é independente. A invalidade de uma cláusula não implica a invalidade das cláusulas de limitação de responsabilidade, de indemnização, de arbitragem ou de jurisdição, que permanecerão aplicáveis na medida máxima permitida pela lei.

14.10. **Terceiros.** Os presentes Termos não conferem quaisquer direitos a terceiros (exceto os afiliados da SOS Expat expressamente mencionados). Nenhum terceiro pode invocar as estipulações dos Termos.

---

## 15. Contacto

Para qualquer questão ou pedido legal: **https://sos-expat.com/contact**
`;

  const defaultCh = `
# 使用条款 – 律师（全球）

**WorldExpat OÜ 的 SOS Expat**（"**平台**"、"**SOS**"、"**我们**"）

**版本 3.2 – 最后更新日期：2026年4月26日**

---

## 1. 定义

**应用程序 / 网站 / 平台**：由 **WorldExpat OÜ**（爱沙尼亚法律下的公司，注册号16885621，注册地址：塔林，爱沙尼亚）运营的数字服务，用于连接用户（"**用户**"）与法律专业人士（"**律师**"）。

**律师**：任何在至少一个司法辖区获得执业许可的法律专业人士，无论其当地头衔为何：avocat（法国、比利时、瑞士）、lawyer/attorney/counsel（美国、英国、英联邦）、solicitor/barrister（英国、爱尔兰、澳大利亚）、abogado（西班牙、拉丁美洲）、Rechtsanwalt（德国、奥地利、瑞士）、advogado（葡萄牙、巴西）、avvocato（意大利）、advocaat（荷兰、比利时）、адвокат/юрист（俄罗斯、独联体）、弁護士（日本）、律师（中国），或其执业辖区的职业协会或主管机关认可的其他同等头衔。

**对接（匹配）**：平台在用户与律师之间进行的技术或操作性引荐，包括：(i) 提供联系方式，(ii) 开通沟通渠道（电话、消息、视频），或 (iii) 律师接受通过平台发出的请求。

**执业国家**：对接时请求所主要涉及的司法辖区。如无法确定，则为用户在请求时的居住国；如涉及多个司法辖区，则为与请求事项最密切相关的司法辖区。

**对接费用**：**用户应向 SOS Expat 支付**的每次对接报酬（第7条），仅作为平台提供的对接技术服务的对价。该费用在任何情况下均不构成佣金、回扣或律师费用的分成。其金额根据**现行价目表**确定，律师及用户可在其个人空间内查阅。SOS Expat 可依照第 2.5 条规定的条件修改该价目表。

**请求**：用户提出的法律问题或项目。

**支付服务提供商**：用于收取用户一次性付款并分配资金的第三方支付服务。

**B2B 合作伙伴**：任何与 SOS Expat 签订**单独的框架合同**的法人实体（企业、协会、互助组织、企业委员会、事务所、专业组织等），根据该框架合同，其全部或部分**承担其成员、雇员或受益人**（"**B2B 用户**"）的对接费用。**B2B 对接**是指由 B2B 用户基于此类框架合同发起的对接。相对而言，**B2C 对接**是指由直接支付对接费用的用户发起的对接。

**制裁名单**：受经济制裁或禁运的个人、实体或国家名单，特别包括OFAC（美国）、欧盟、联合国、英国财政部（HMT）及其他主管机关的名单。

---

## 2. 目的、适用范围与接受

2.1. 本条款规范律师对平台的访问与使用。

2.2. SOS Expat仅作为技术中介提供对接服务。SOS Expat不从事律师业务，不提供法律意见，也不是律师与用户之间合同关系的当事方。

2.3. **电子接受（Click-Wrap）与可追溯性。** 律师通过在注册时勾选指定复选框及/或使用平台的方式接受本条款。该行为依据欧盟第910/2014号eIDAS条例构成电子签名及合同同意。SOS Expat保留**带时间戳的审计日志**，包括：(i)接受的精确日期和时间（UTC），(ii)律师的IP地址，(iii)唯一会话标识符，(iv)浏览器用户代理，(v)接受的条款版本，(vi)接受文件的加密哈希值，(vii)律师的唯一标识符。这些日志构成接受本条款的**具有法律约束力的证据**。

2.4. **接受证明的保存。** 根据GDPR及法定保存义务，SOS Expat自接受之日起保存条款接受证明**十（10）年**，或在适用情况下保存至任何待决争议结束。律师可通过联系表提交书面请求，获取包含上述证据要素的**接受证书**。此保存基于SOS Expat在争议情况下保有证据的合法利益（GDPR第6.1.f条）及商业合同的法定保存义务。

2.5. **修改（P2B 规定的预先通知期）。** SOS Expat 可随时更新本条款及/或费用价目表，但须以耐用介质（向已登记电子邮箱发送电子邮件并在律师个人空间内公布）向律师发出**至少十五（15）天的预先通知**，符合欧盟《P2B 规则》（条例(EU) 2019/1150）第3条的规定。在以下情形下，预先通知期可缩短或取消：(i) 修改系法律或主管机关决定所要求；(ii) 出于安全或防范欺诈的紧迫理由；或 (iii) 不影响经济条款的实质性更正或排版更正。在通知期内，律师可**无任何违约金**地终止其与平台的关系。如未终止，则在通知期届满后继续使用平台视为接受。如属重大修改，律师将被邀请明示重新确认接受，并依第 2.3 条规定的方式予以记录。

2.6. 期限：无固定期限。

---

## 3. 律师身份 – 独立性、合规与声明

3.1. 律师以独立专业人士身份行事；与SOS Expat之间不存在雇佣、委托、代理、合伙或合资关系。

3.2. 律师独立负责：(i)其学历、头衔、律师协会/同等机构注册及执业许可；(ii)针对执业国家有效且适当的职业责任保险；(iii)遵守当地法律及职业规则（职业道德、广告/招揽、利益冲突、职业保密、反洗钱/KYC、税务、消费者保护等）。

3.3. SOS Expat不监督或评估律师提供的建议内容或质量，对此不承担任何责任。

3.4. **专业主体（B2B）。** 律师声明仅以专业身份行事。消费者保护制度不适用于SOS Expat与律师之间的关系。

3.5. **律师的声明与保证。** 通过在平台注册，律师明确声明并保证：
- (a) 根据其居住国及/或执业国法律，其已**成年**；
- (b) 其拥有**完全民事行为能力**签订合同并执业；
- (c) 其未处于监护、保佐、司法保护或任何同等保护制度下；
- (d) 其未受到**临时或永久执业禁止**处分；
- (e) 其未被其律师协会或职业协会除名、停业或开除；
- (f) 其不存在可能导致停业或除名的**进行中的纪律程序**（如有，应立即通知SOS Expat）；
- (g) 其不在任何**制裁名单**（OFAC、欧盟、联合国、HMT或其他）上；
- (h) 其未因与执业不相容的事项受到**刑事定罪**；
- (i) 注册时提供的所有信息**准确、完整且最新**；
- (j) 其承诺**立即通知**SOS Expat任何影响上述声明的变更；
- (k) 其在注册时或之后在其个人资料中选择的每个"执业国家"均拥有**有效的律师执业权**。律师承诺仅选择其**依法获准**提供法律咨询或代理客户的司法辖区，无论是基于当地注册、相互承认协议、国际公约或任何其他法律机制。选择其无权执业的执业国家构成对本条款的**严重违反**。
任何虚假声明构成对本条款的严重违反，可能导致立即永久封禁，且不影响任何损害赔偿诉讼。

---

## 4. 账户创建、验证与安全

4.1. 条件：在至少一个司法辖区拥有有效执业权、身份及资质证明、有效职业责任保险。

4.2. 流程：创建账户、提交文件、人工验证（可能包括视频面试及通过服务提供商进行的KYC/反洗钱检查）。

4.3. 准确性与更新：律师保证信息的准确性/时效性；每位律师一（1）个账户。

4.4. 安全：律师保护其登录凭证；通过账户进行的任何活动视为由其执行；任何安全漏洞应立即报告。

4.5. **随时补充验证。** SOS Expat保留**随时且无需说明理由**要求律师提供或更新任何证明其执业权、律师协会或同等机构注册、职业责任保险、身份或任何其他相关证明文件的权利。律师承诺在**七（7）个工作日**内回复此类请求。未回复或提供不合格文件可能导致账户立即暂停。

4.6. **审核与质量控制。** SOS Expat实施审核政策，以确保平台服务的质量和合规性。此审核可能包括：(i)验证发布的个人资料和内容，(ii)分析用户评价和投诉，(iii)检查是否遵守本条款及适用法律，(iv)任何其他合理的质量控制措施。律师同意接受此审核。

4.7. **账户临时暂停。** SOS Expat可在以下情况下**立即且无需事先通知**暂停律师账户：
- (a) 涉嫌欺诈、身份冒用或虚假声明；
- (b) 用户的多次或严重投诉；
- (c) 未提供第4.5条要求的文件；
- (d) 已证实或涉嫌违反本条款或适用法律；
- (e) 有损平台形象或声誉的行为；
- (f) 司法、行政或职业机关的命令；
- (g) SOS Expat自行裁量认定的任何其他正当理由。
暂停期间，律师无法访问其账户或接收新的对接。进行中的付款可能被保留直至情况澄清。

4.8. **永久封禁（因过错终止）。** SOS Expat可在以下情况下**永久终止且无需事先通知**律师账户（"封禁"）：
- (a) 严重或多次违反本条款；
- (b) 经证实的欺诈、故意虚假声明或身份/头衔冒用；
- (c) 丧失执业权（除名、职业协会停业、未续期注册）；
- (d) 与执业不相容的刑事定罪；
- (e) 对用户或平台严重有害的行为；
- (f) 临时暂停后再犯；
- (g) 经证实规避平台以逃避对接费用；
- (h) 尽管提醒仍不遵守KYC验证义务；
- (i) SOS Expat自行裁量认定的任何其他严重理由。
封禁是**永久且不可撤销的**。被封禁的律师不得创建新账户。待处理资金可作为约定损害赔偿金被保留，且不影响任何其他损害赔偿诉讼。

4.9. **程序与通知。** 如发生暂停或封禁，SOS Expat通过注册邮箱向律师发送通知。该通知说明措施理由（除非法律要求保密）。律师有**十五（15）天**通过联系表提交书面意见。SOS Expat审查这些意见但无义务撤销措施。SOS Expat的决定是**自由裁量且最终的**。

4.10. **暂停或封禁的效果。** 如发生暂停或封禁：
- (a) 账户访问立即被阻止；
- (b) 律师个人资料从搜索结果中移除；
- (c) 进行中的对接可能被取消；
- (d) 待处理付款可能被保留或用于抵销任何欠SOS Expat的金额；
- (e) 律师仍受其义务约束（保密、禁止招揽等），根据存续条款。

4.11. **不活跃。** 如**超过365天不活跃**，账户可能在通知后自动停用。律师可申请重新激活账户，但须提供所需验证文件。

4.12. **自愿终止。** 律师可在履行完其现有义务（已接受的服务、可能的退款）后随时关闭账户。关闭请求通过联系表提交。SOS Expat在**三十（30）天**内处理关闭。

4.13. **电子通信。** 律师同意通过电子方式接收有关本条款、审核及暂停/封禁措施的任何通知（电子邮件、应用内通知、平台发布）。律师承诺保持有效电子邮箱并定期查看通知。

4.14. **内部投诉处理系统（P2B 规则）。** 根据欧盟条例(EU) 2019/1150 第11条，SOS Expat 通过联系表（https://sos-expat.com/contact）向律师提供**免费的内部投诉处理系统**。SOS Expat 承诺：(i) 在**七（7）个工作日**内**确认收到**任何投诉；(ii) 以**严肃、无歧视的态度并在合理期限内**（一般为**三十（30）天**）处理投诉；(iii) 以清晰易懂的语言向律师传达**附理由的**处理结果，并指明后续救济途径（第 12.5 条的调解、第 12.2 条的仲裁）；(iv) 保留有关该系统运作的**汇总统计数据**，并每年提供查阅。

---

## 5. 使用规则 – 利益冲突、保密、禁止规避

5.1. **利益冲突。** 律师在提供任何建议前进行适当筛查。如存在冲突，应退出并通知用户。

5.2. **职业保密与机密性。** 律师根据执业国家的适用法律遵守机密性和职业保密义务。

**通话录音政策：**
- (a) **默认情况下**，SOS Expat **不录制**律师和用户之间通话的音频内容。仅保留**技术元数据**（时间戳、时长、Twilio 标识符、连接状态）用于计费、反欺诈和解决技术争议；
- (b) **未经律师与用户事先、明示且分别表示的同意**（在通话开始前通过单独的肯定行为表示），SOS Expat **不会启用任何音频录制**。任何录制不得由 SOS Expat 单方面触发，唯一例外为律师或用户所在国**主管司法机关依规作出的合法调取**，且须符合该司法辖区所要求的公共秩序保障（特别是关于律师职业保密的保障）；
- (c) 当因前述 (b) 项情形例外启用录制时，仅在实现其目的所必需的期间内保存，最长不超过**六（6）个月**（正在进行的司法程序要求延长的除外），符合 GDPR 及当地数据保护机构的建议；
- (d) **律师本人也禁止**未经用户书面授权或法律义务，录制、完整转录、披露或将交流用于约定服务以外的目的；
- (e) **职业保密保持不受侵犯**：SOS Expat 的任何录音不得违反适用于职业保密的职业道德规则用于针对律师或用户。

5.3. **禁止规避。** SOS Expat不从律师费中收取佣金。每次通过平台与新用户的对接均产生对接费用。禁止规避平台以逃避新介绍的费用。

5.4. **禁止行为。** 身份/头衔冒用、非法内容、操纵、损害平台的串通/抵制、违反制裁/出口法律，或任何非法活动。

5.5. **可用性。** 平台按"现状"提供；不保证不间断可用性（维护、故障、不可抗力）。如法律要求，访问可能受限。

---

## 6. 律师–用户关系（平台外）

6.1. 对接后，律师与用户可在平台外签订合同（SOS Expat不参与费用设定或收取，除非适用下述一次性支付机制）。

6.2. 律师根据当地法律签订费用协议，收取/缴纳适用税款，并遵守当地规则（广告、招揽、利益冲突、消费者保护）。

6.3. SOS Expat对律师建议的质量、准确性或结果不承担责任。

---

## 7. 费用、一次性支付与税务

7.1. **对接费用（平台报酬）。** 对接费用**仅作为 SOS Expat 向用户提供的对接技术服务**的报酬。该费用**由用户支付**，**而非由律师支付**。其金额根据**现行价目表**确定，律师可在其个人空间内按对接逐笔查阅，不含税且不含支付服务提供商费用。任何价目表的修改均按第 2.5 条规定的条件进行（至少十五 (15) 天预先通知）。律师应定期查阅现行价目表。

7.2. **付款的法律定性 — 两项独立且彼此分离的债务。** 用户通过平台进行的付款，尽管出于操作便利通过单笔收款一次性结算，但**在法律上分解为两项独立且彼此分离的债务**：
- (a) **"对接"债务**：用户因对接技术服务（对接费用，第 7.1 条）而**应向 SOS Expat 支付**的款项；
- (b) **"律师费"债务**：用户因双方约定的法律服务而**应向律师支付**的费用款项。费用协议、服务的内容及质量**完全**属于律师与用户之间的关系，不在平台范围之内（第 6 条及第 13.5 条）。

**SOS Expat 不收取、不索取、亦无权获得任何形式的律师费用佣金、回扣、分成、百分比或任何部分——尤其是在职业道德规则禁止与非律师分享律师费用的司法辖区。对接费用是 SOS Expat 唯一的报酬，且仅来源于上文 (a) 项所述用户的债务。**

支付服务提供商在 (b) 项部分中作为**律师的付款代理人**行事，将所收取的律师费用转付给律师，仅扣除银行处理费用以及在适用情况下的货币兑换费用（第 7.3 及 7.4 条）。**律师在每笔交易前后均可在其仪表板中查看其将实际收到的净额**，从而可在充分知情的前提下决定是否接受对接。

7.3. **支付服务提供商银行费用。** 支付服务提供商（Stripe或同等服务商）对每笔交易收取处理费。**这些银行费用完全由律师承担**，并自动从转给律师的金额中扣除。这些费用的详情可在支付服务提供商条款及律师仪表板中查看。

7.4. **汇兑费用与货币转换。** 当用户的支付货币与律师的银行账户货币不同时，支付服务提供商会收取**货币转换费**。**这些汇兑费用完全由律师承担**，并从转给律师的金额中扣除。适用的汇率为支付服务提供商在转账时的汇率。律师承认并明确接受SOS Expat对这些汇率没有控制权，且对货币波动或服务提供商收取的费用不承担任何责任。

7.5. **转给律师的净额计算。** 转给律师的净额对应于用户的**"律师费"债务**（第 7.2(b) 条），**仅**扣除：(i) 适用于"律师费"部分的支付服务提供商**银行费用**（第 7.3 条），及 (ii) 在适用情况下的**货币兑换费用**（第 7.4 条）。**对接费用（第 7.2(a) 条）在任何情况下均不从律师费中扣除**：该费用系基于用户对 SOS Expat 的另一项独立债务而收取。**律师在每次服务前可通过其仪表板获知其将收到的确切金额，从而可在充分知情的前提下决定是否接受对接。**

7.6. **到期与不可退还。** 对接费用在有效对接后到期，**不可退还**（除非SOS Expat自行决定在完全归因于平台的故障情况下作为商业让步退还，且在法律允许的范围内）。

7.7. **向用户退款。** 如向用户退款，从律师份额中扣除：SOS Expat可从律师未来付款中保留/抵销相应金额，或在无未来付款时要求直接退还。除非SOS Expat另行决定，对接费用仍归SOS Expat所有。

7.8. **律师按渠道划分的支付期限。** 在完成KYC流程（第8条）的前提下，律师净报酬的支付期限根据对接渠道而有所不同：
- (a) **B2C 对接**（用户直接支付）：律师的报酬由支付服务提供商**在通话结束后立即**进行支付，仅受限于支付服务提供商所固有的银行处理、反欺诈及付款捕获的技术性时延（视律师所在国及其在支付服务提供商账户的成熟度，通常为一（1）至七（7）个工作日）；
- (b) **B2B 对接**（由 B2B 合作伙伴支付）：鉴于适用于 B2B 合作伙伴的延期开票模式（按月开票或"net-30"），律师的报酬应**在通话之日起三十（30）天内**支付；
- (c) 在任何情况下，如发生争议、用户或合作伙伴投诉、KYC/反洗钱-反恐融资验证正在进行，或本 CGU 规定的任何其他情形，付款均可被暂停。

7.9. **税务。** 律师**独自负责**其在居住及/或执业辖区的所有税务义务（所得税、增值税、社会保险、职业费用等）。转给律师的金额为**毛额**；律师负责申报和缴纳所有适用税款。SOS Expat在法律要求时仅就对接费用收取和缴纳增值税/当地同等税。

7.10. **抵销。** SOS Expat可将律师所欠的任何金额（用户退款、罚款或其他义务）与欠律师的任何金额进行抵销。

7.11. **价格透明与历史记录。** 律师可随时在其个人仪表板中查看：(i)每笔交易的完整详情，(ii)用户支付的毛额，(iii)扣除的对接费用，(iv)支付服务提供商银行费用，(v)汇兑费用（如适用），(vi)已转或待转的净金额，以及(vii)所有交易历史。这些信息在账户存续期间及关闭后**五（5）年**内保存并可访问。

7.12. **税务自动申报（DAC7 指令——欧盟 2021/514）。** 居住于欧盟成员国的律师被告知，SOS Expat 作为申报平台运营者，依据欧盟指令(EU) 2021/514（"DAC7"），有义务**每年**向主管税务机关申报有关居住于欧盟的活跃律师的信息，特别包括：姓名、地址、税号（TIN）、居住国、通过平台收取的报酬总额及对接次数（按公历季度细分）。律师承诺在其个人空间内提供并保持上述信息的更新。未提供或未更新可能导致暂停付款直至完成补正，符合 DAC7 的规定。

7.13. **B2B 渠道——通过 B2B 合作伙伴进行的对接。**

(a) **范围。** B2B 对接由 B2B 用户发起，该用户是 SOS Expat 与 B2B 合作伙伴之间所签订框架合同的受益人（第 1 条）。

(b) **两项债务机制的适用调整。** 第 7.2 条规定的两项债务机制在 B2B 渠道下按以下方式适用：
- **"对接"债务**由 **B2B 合作伙伴**根据框架合同向 SOS Expat 全部或部分支付，因此**B2B 用户原则上无需支付任何费用**，或仅需向 SOS Expat 支付可能存在的自付额；
- **"律师费"债务**仍由**最终用户**向**律师**支付，除非框架合同明确约定 B2B 合作伙伴全部或部分承担律师费用（在此情形下，合作伙伴根据第 7.2 条所述的付款代理人机制，就其承担的部分对律师承担债务）；
- 律师在任何情况下均不免除签订符合其当地职业道德的费用协议的义务（第 6.2 条）。

(c) **B2C / B2B 律师费率不同——律师明确接受。** 律师**明确确认并接受**：**其在 B2B 对接中获得的净报酬可能与 B2C 对接中获得的净报酬不同**，无论是更高还是更低（例如：与合作伙伴协商的固定费率、考虑保证业务量的因素、合作伙伴全部或部分承担费用，或给予合作伙伴的折扣）。**对接的来源渠道（B2C 或 B2B）**及律师将获得的**确切金额**会**在每次对接前显示在其仪表板中**，使其能够在充分知情的情况下自由接受或拒绝。律师**不承担任何接受义务**，无论提议的渠道或费率如何。

(d) **B2B 框架合同对律师不具对抗性。** SOS Expat 与 B2B 合作伙伴签订的框架合同的条款**对律师不具对抗性**；仅本条款及律师仪表板中显示的信息规范 SOS Expat 与律师在 B2B 对接中的关系。

(e) **本条款的所有其他规定**均适用于 B2B 对接。

(f) **本 CGU 之日起适用的费率（仅供参考）。** 截至本 CGU 最近更新之日，律师的净报酬费率如下：
- **B2C 对接**：每笔已接受并执行的对接，**净额三十欧元（30 €）或三十美元（30 USD）**，视结算货币而定；
- **B2B 对接**：每笔已接受并执行的对接，**净额二十欧元（20 €）或二十美元（20 USD）**，视结算货币而定。

上述金额**仅供参考**，反映的是本 CGU 更新之日适用的费率。**最新费率**可在每次对接前于律师仪表板内随时查阅。任何变更均须遵守第 7.14 条规定的十五（15）天预先通知期。

7.14. **律师报酬标准的修改。** SOS Expat 保留**随时修改律师净报酬标准**的权利，无论是：
- (i) **B2C 标准**——通过修改对接费用或其结构（这会影响律师所收取的净额）；
- (ii) **B2B 标准**——通过修改适用于 B2B 对接的固定或可变报酬；
- (iii) 或净报酬的任何其他组成部分（例如：货币、业务量等级、资历等级）。

任何修改均须遵守第 2.5 条规定的**至少十五（15）天预先通知期**，以耐用介质（向已登记电子邮箱发送电子邮件并在律师个人空间内公布）通知律师。在通知期内，律师可**无任何违约金**地终止其与平台的关系，或继续**逐案拒绝**那些不再符合其报酬期望的对接，须知**律师从无义务接受任何对接**。**在通知期届满前已接受的对接，仍按接受之日适用的费率计酬。** 如未终止，则在通知期届满后继续使用平台视为接受新标准。

---

## 8. 支付 – KYC/反洗钱 – 制裁

8.1. **支付服务提供商。** 支付**仅**由 **PCI-DSS** 认证的第三方服务提供商处理：**Stripe Payments Europe Ltd.**（爱尔兰，欧盟）和/或 **PayPal (Europe) S.à r.l. et Cie, S.C.A.**（卢森堡，欧盟）。适用的服务提供商取决于律师的居住/执业国家（Stripe 目前覆盖 44 个国家，PayPal 覆盖 150+ 个国家）。律师**明确接受**适用服务提供商的条款及 KYC/反洗钱流程。**SOS Expat 不是银行、支付机构或信贷机构**；SOS Expat 仅是上述支付服务提供商的商业客户。

8.2. 如怀疑欺诈、不合规或存在法律命令，SOS Expat可推迟、保留或取消付款。

8.3. **国际制裁与禁运。** 律师声明并保证：
- (a) 不直接或间接在任何**制裁名单**上（OFAC/SDN、欧盟、联合国、HMT或任何其他适用制裁名单）；
- (b) 不被在制裁名单上的个人或实体直接或间接拥有或控制；
- (c) 不是依据适用法律法规——特别是支付服务提供商、欧盟、联合国、OFAC（美国）、HMT（英国）或其他主管机关的法律法规——所列**全面禁运或全面限制措施所涉国家或地区**的居民、国民或位于其中。上述国家及地区的最新清单由前述机关维护并具有效力；SOS Expat 不另行制定或公布其自有的地缘政治清单；
- (d) 不使用平台进行涉及受制裁个人、实体或国家的交易；
- (e) 遵守所有适用的**出口管制法**。
SOS Expat保留**立即限制或阻止**在任何受制裁或禁运地区或对任何涉嫌违反这些规定的律师访问平台的权利，无需事先通知或赔偿。如主管机关下令，SOS Expat也可能被要求**冻结律师资金**。

### 未认领资金与KYC验证

8.4. **完成验证流程（KYC）的义务。** 为接收通过平台提供的服务的付款，律师承诺在注册后尽快向我们的支付合作伙伴Stripe完成身份验证流程（KYC - 了解您的客户）。律师承认未完成KYC验证在技术上阻止资金转入其银行账户。

8.5. **待处理资金保管。** 当用户为未完成KYC验证的律师提供的服务付款时，律师份额对应的资金（扣除平台对接费用后）保存在托管账户中。平台承诺：
- 通过电子邮件通知律师存在待处理资金；
- 定期发送提醒（7天、30天、60天、90天、120天和150天）；
- 为律师提供完成KYC验证所需的所有手段。

8.6. **长期挂账资金——管理费用及向主管机关移交。** 当 KYC 验证在首次挂账付款之日起**一百八十（180）天**内仍未完成，且已按第 8.5 条发出通知时：
- (a) **固定管理费用。** SOS Expat 可从挂账资金中扣取**合理的固定管理费用，上限为所扣留金额的百分之十（10%）**，仅用于支付保管、联系尝试及会计处理的实际行政成本；
- (b) **延长保管。** 余款继续保存于支付服务提供商的隔离账户（或在技术条件要求时由 SOS Expat 提存）。律师可在此阶段内随时完成 KYC 并要求领取资金；
- (c) **向主管机关移交（无主财产）。** 自首次挂账付款之日起届满**五（5）年**全局期限后，如仍无有效申领，剩余资金应**移交至律师居住国的主管机关**，依据该国关于无主资金的适用规则（例如：在法国，依据 Eckert 法移交至 Caisse des dépôts；在美国，移交至主管州的无主财产计划；在英国，移交至 Dormant Assets Scheme；以及一般而言移交至当地相应机制）。**SOS Expat 在任何情况下均不占有该等剩余资金。**

8.7. **延长保管期间的申领。** 律师可在延长保管阶段 (b) 内随时通过联系表向 SOS Expat 提出附理由的申领请求，并附**完整的 KYC 验证**（KYC 系支付服务提供商及反洗钱/反恐融资义务所要求的技术性条件）。SOS Expat 在**三十（30）天**内审查申请。如获接受，资金应予返还，仅扣除上文 (a) 项所述的管理费用。如属经正当证明的不可抗力或经文件证明的医疗无行为能力，SOS Expat 可在合理的自由裁量范围内减免该等费用。

8.8. **明确接受。** 律师在平台上注册时声明已阅读本第 8 条的条款并明确接受。该接受是获得服务提供商身份的基本条件。

---

## 9. 个人数据（全球框架 – GDPR/DSA）

9.1. **角色。** 就为对接目的收到的用户数据而言，SOS Expat和律师各自作为其各自目的的数据控制者，依据**欧盟第2016/679号条例（GDPR）**。

9.2. **法律依据与目的。** 合同履行（对接）、合法利益（安全、欺诈预防、改进）、法律合规（反洗钱、制裁），以及在适用情况下的同意。

9.3. **国际传输**：在需要时采用适当保障（标准合同条款、充分性决定等）。

9.4. **权利与联系方式。** 通过平台联系表行使权利（访问、更正、删除、可携性、反对）。

9.5. **安全。** 合理的技术/组织措施；根据适用法律通报违规（依据GDPR在72小时内）。

9.6. 律师根据执业国家法律及其职业道德（职业保密）处理收到的数据。

9.7. **DSA合规。** 平台作为**欧盟第2022/2065号条例（数字服务法）**意义上的**中介服务**运营。SOS Expat实施非法内容举报机制，并根据DSA与主管机关合作。

---

## 10. 知识产权

平台、其商标、标识、数据库和内容受保护。除在本条款期间的个人、非独占、不可转让的访问权外，不向律师授予任何权利。律师提供的内容（个人资料、照片、描述）授予SOS Expat全球范围内的非独占许可，用于在平台上托管和展示。

---

## 11. 保证、责任与赔偿

11.1. 不对法律服务作任何保证；SOS Expat不保证结果、质量或业务量。

11.2. 平台按"现状"提供；不保证持续可访问性。

11.3. **责任限制**：在法律允许的范围内，SOS Expat对律师的总责任限于直接损害，且不超过SOS Expat就引起索赔的交易收取的对接费用总额。

11.4. **排除**：不承担间接/后果性/特殊/惩罚性损害（利润、客户、声誉损失等）。

11.5. **赔偿**：律师就与(i)其违反本条款/法律、(ii)其内容、(iii)其建议/疏忽相关的任何索赔/损害/费用（包括律师费）向SOS Expat（及其关联方、高管、员工、代理人）赔偿并使其免受损害。

11.6. **放弃追索权。** 律师**明确且不可撤销地放弃**就以下事项对SOS Expat的任何追索权：(i)因提供法律服务导致的损害，(ii)间接损失，(iii)与用户的合同纠纷，(iv)律师提供服务的任何缺陷。此放弃在法律允许的最大范围内适用。

11.7. 无代理关系：本条款不构成SOS Expat与律师之间的任何委托、雇佣、合伙或合资关系。

11.8. **不可抗力。** SOS Expat对因**不可抗力**事件（自然灾害、战争、疫情、网络攻击、电力或互联网故障、政府决定、罢工等）造成的延迟或故障不承担责任。

11.9. **条款存续。** 无论终止或届满的原因如何，以下条款在本条款终止或届满后存续：第2条（接受证明）、第3.5条（声明）、第5条（使用规则）、第7条（费用和支付）、第8条（KYC和制裁）、第9条（个人数据）、第10条（知识产权）、第11条（责任和赔偿）、第12条（适用法律和仲裁）、第13条（保护条款）和第14条（杂项）。这些条款在产生其效力所必需的期间内保持有效。

---

## 12. 适用法律 – 仲裁 – 爱沙尼亚管辖 – 集体诉讼

12.1. **适用法律及当地职业道德的优先地位。** 本条款及其解释、有效性和执行专属适用**爱沙尼亚法律**，排除其法律冲突规则。**为避免任何歧义**，律师在执业国及/或律师注册国所适用的律师职业道德规则（特别是关于职业保密、禁止与非律师分享律师费用、广告与招揽的限制、利益冲突及客户资金管理等方面）**视为公共秩序**规范，**优先**适用于本条款中任何相反或不明确的规定。本条款的任何条款均不得被解释为强制或允许律师采取违反其当地职业道德的行为；如发生冲突，律师应停止相关行为并立即通知 SOS Expat。

12.2. **强制国际仲裁。** 因本条款引起或与之相关的任何争议、分歧或索赔，包括其有效性、解释、执行或终止，将根据**国际商会（ICC）仲裁规则**通过**仲裁**最终解决。
- **仲裁地**：爱沙尼亚塔林；
- **仲裁语言**：**英语**；
- **仲裁员人数**：一（1）名独任仲裁员，除非争议金额超过100,000欧元，则为三（3）名仲裁员；
- **实体法**：爱沙尼亚法律（第12.1条）；
- **程序**：保密。双方承诺不披露仲裁的存在、内容或结果，除非法律要求或为执行裁决。
仲裁裁决对双方**最终且有约束力**。双方在法律允许的范围内放弃任何撤销诉讼。

12.3. **放弃集体诉讼和陪审团。** 在适用法律允许的最大范围内：
- (a) 律师放弃参与任何针对SOS Expat的**集体诉讼、团体诉讼或代表诉讼**；
- (b) 任何争议将仅在**个人基础上**解决；
- (c) 律师明确放弃任何**陪审团审判权**（陪审团审判弃权）；
- (d) 律师放弃根据美国法律或任何同等法律提起的任何**集体诉讼、合并诉讼或代表诉讼**。

12.4. **爱沙尼亚法院专属管辖权。** 对于根据适用法律不可仲裁的任何请求、仲裁庭组成前的紧急临时或保全措施以及仲裁裁决的执行，**塔林（爱沙尼亚）法院**拥有**专属管辖权**。律师：
- (a) 不可撤销地同意该管辖权；
- (b) 放弃任何**不方便法院**异议；
- (c) 放弃任何基于缺乏属人管辖权的异议；
- (d) 接受任何送达可通过在平台注册的电子邮件地址进行。

12.5. **强制事先调解及指定的调解机构（P2B 规则）。** 在任何仲裁之前，双方承诺自争议书面通知（以带回执确认的电子邮件发送至对方的联系地址）之日起**三十（30）天**内通过**善意协商**尝试友好解决争议。根据欧盟条例(EU) 2019/1150 第12条，SOS Expat 指定至少**两（2）家专门的、独立的、合理可达的调解机构**，律师可任选其一：**(i) 巴黎调解与仲裁中心（CMAP）—— cmap.fr**；及 **(ii) 世界知识产权组织仲裁与调解中心（日内瓦）—— wipo.int/amc**。SOS Expat 应根据具体情况善意承担**调解费用的合理份额**，特别是当争议金额较小时。调解失败是提起仲裁申请的先决条件。

12.6. **时效。** 律师对 SOS Expat 提起的任何诉讼或索赔，必须自引起诉讼的事实发生之日起**三（3）年**与**律师所在司法辖区适用的法定期限**两者中较短者内提起，否则丧失权利。本条款的目的及效力均不得将时效缩短至律师所在司法辖区不可被任何约定缩短的强制性最低期限以下；在此情形下，适用当地法定期限。

---

## 13. 国际保护条款

13.1. **反腐败。** 律师承诺不向公职人员或私人提供、承诺或支付贿赂或不正当利益。其遵守适用的反腐败法律（FCPA、英国反贿赂法、萨潘II法等）。

13.2. **通信保密。** 通过平台进行的通信（消息、电话）是**保密的**。律师禁止录制、披露或将其用于约定服务以外的目的，除非有书面授权或法律义务。

13.3. **禁止招揽。** 在本条款期间及终止后**十二（12）个月**内，律师禁止直接招揽通过平台认识的用户以逃避对接费用。

13.4. **律师的独自责任。** 律师**独自负责**其提供的建议和服务的质量、准确性和合法性。律师**完全负责**遵守其执业国家的法律法规。SOS Expat**不保证**律师提供的法律建议，并**对因律师服务导致的任何用户损害不承担任何责任**。

13.5. **无咨询关系。** SOS Expat**不是律师事务所**，也不是法律服务提供商。平台仅限于**对接**。任何法律咨询关系**仅**在律师与用户之间建立，**在SOS Expat之外**。**任何**与客户签订的案件将**在SOS Expat之外**进行。

13.6. **律师-用户争议。** 律师与用户之间的任何争议**仅**属于其直接关系。SOS Expat**不介入**这些争议，且**不能作为当事方、担保人或调解人被起诉**。SOS Expat**在任何情况下对律师与客户之间的争议不承担责任**。

---

## 14. 杂项

14.1. **转让**：SOS Expat可将本条款转让给其集团公司或继任者；律师未经SOS Expat书面同意不得转让。

14.2. **完整性**：本条款构成完整协议，取代任何有关同一主题的先前协议。

14.3. **通知**：通过平台发布、应用内通知或联系表进行。

14.4. **解释**：标题仅供参考。不适用不利于起草方的规则。

14.5. **语言**：可提供翻译；英语为解释的优先版本。

14.6. **部分无效与可分割性。** 如本条款的任何条款被有管辖权的法院或仲裁员宣告无效、无效或不可执行：
- (a) 该无效不影响其他条款的有效性，其他条款继续有效；
- (b) 无效条款将在可能的范围内由具有同等经济效果的有效条款替代；
- (c) 双方将善意协商商定替代条款。

14.7. **地理可分割性。** 如本条款的任何条款在特定司法辖区不可执行或不合法：
- (a) 该条款仅在该司法辖区不适用；
- (b) 其在所有其他司法辖区完全适用；
- (c) 当地的不可执行性不影响本条款的整体有效性。

14.8. **不弃权。** SOS Expat未行使或延迟行使任何权利不构成对该权利的放弃。任何放弃必须是明示且书面的。一次性放弃不构成一般性放弃。

14.9. **条款独立性。** 本条款的每个条款都是独立的。一个条款的无效不导致责任限制、赔偿、仲裁或管辖权条款的无效，这些条款在法律允许的最大范围内保持适用。

14.10. **第三方。** 本条款不授予任何第三方任何权利（除明确提及的SOS Expat关联方外）。任何第三方不得援引本条款的规定。

---

## 15. 联系方式

如有任何问题或法律请求：**https://sos-expat.com/contact**
`;
  const defaultAr = `
# شروط الاستخدام – للمحامين (عالمي)

**SOS Expat التابعة لشركة WorldExpat OÜ** (المشار إليها بـ «**المنصّة**»، «**SOS**»، «**نحن**»)

**الإصدار 3.2 – آخر تحديث: 26 أبريل 2026**

---

## 1. التعريفات

**التطبيق / الموقع / المنصّة**: الخدمات الرقمية التي تديرها **WorldExpat OÜ** (شركة مسجلة وفق القانون الإستوني، رقم السجل 16885621، المقر الرئيسي: تالين، إستونيا)، والتي تتيح التواصل بين المستخدمين («**المستخدمون**») والمهنيين القانونيين («**المحامون**»).

**المحامي**: أي مهني قانوني مرخص له بممارسة المهنة في ولاية قضائية واحدة على الأقل، بصرف النظر عن لقبه المحلي: avocat (فرنسا، بلجيكا، سويسرا)، lawyer/attorney/counsel (الولايات المتحدة، المملكة المتحدة، الكومنولث)، solicitor/barrister (المملكة المتحدة، أيرلندا، أستراليا)، abogado (إسبانيا، أمريكا اللاتينية)، Rechtsanwalt (ألمانيا، النمسا، سويسرا)، advogado (البرتغال، البرازيل)، avvocato (إيطاليا)، advocaat (هولندا، بلجيكا)، адвокат/юрист (روسيا، رابطة الدول المستقلة)، 弁護士 (اليابان)، 律师 (الصين)، أو أي لقب معادل آخر معترف به من قبل النقابة المهنية أو السلطة المختصة في ولاية الممارسة.

**الربط (المطابقة)**: عملية الاتصال الفني/العملي التي تُجريها المنصّة بين المستخدم والمحامي، والمتمثلة في:
(i) نقل بيانات الاتصال، أو (ii) فتح قناة تواصل (مكالمة، رسالة، فيديو)، أو (iii) قبول المحامي لطلب قُدّم عبر المنصّة.

**بلد التدخّل**: الدولة أو الاختصاص القضائي الذي يتعلق به الطلب أساسًا. وفي حال عدم التحديد، يُعتبر بلد إقامة المستخدم وقت الطلب؛ وإذا وُجد أكثر من بلد، فيُختار البلد الأكثر ارتباطًا بالطلب.

**رسوم الربط**: المقابل **المستحق على المستخدم لصالح SOS Expat** عن كل عملية ربط (المادة 7)، نظير الخدمة التقنية للربط التي توفرها المنصّة وحدها. لا تُشكّل هذه الرسوم بأي حال عمولة أو نسبة استرجاع أو مشاركة في أتعاب المحامي. يُحدَّد مبلغها وفق **جدول الأسعار الساري**، المتاح للاطلاع في الفضاء الشخصي للمحامي والمستخدم. يجوز لـ SOS Expat تعديل هذا الجدول وفق الشروط المنصوص عليها في المادة 2.5.

**الطلب (Requête)**: الحالة أو المشروع القانوني الذي يقدمه المستخدم.

**مزوّد(و) خدمات الدفع**: خدمات طرف ثالث تُستخدم لتحصيل الدفعة الموحدة من المستخدم وتوزيع الأموال.

**الشريك B2B**: أيّ شخص اعتباري (شركة، جمعية، تعاضدية، لجنة عمل، مكتب، منظمة مهنية، إلخ) أبرم مع SOS Expat **عقدًا إطاريًا منفصلًا** يقضي بأن يتحمّل، كليًا أو جزئيًا، **رسوم الربط** لصالح أعضائه أو موظفيه أو المستفيدين منه («**المستخدمون B2B**»). و**الربط B2B** هو الربط الذي يُطلقه مستخدم B2B بموجب عقد إطاري من هذا القبيل. وفي المقابل، **الربط B2C** هو الربط الذي يطلقه مستخدم يدفع رسوم الربط مباشرةً.

**قوائم العقوبات**: قوائم الأشخاص والكيانات والدول الخاضعة للعقوبات الاقتصادية أو الحظر، بما فيها قوائم OFAC (الولايات المتحدة)، والاتحاد الأوروبي، والأمم المتحدة، وخزانة جلالة الملكة البريطانية (HMT)، وأي سلطة مختصة أخرى.

---

## 2. الموضوع والنطاق والقبول

2.1. تحكم هذه الشروط وصول المحامين إلى المنصّة واستخدامهم لها.

2.2. تعمل SOS Expat حصرًا كوسيط تقني للربط. ولا تمارس مهنة المحاماة، ولا تقدم استشارات قانونية، وليست طرفًا في العلاقة بين المحامي والمستخدم.

2.3. **القبول الإلكتروني (Click-Wrap) والتتبع.** يوافق المحامي على هذه الشروط بتحديد خانة القبول عند التسجيل و/أو باستخدام المنصّة. يُعد هذا الفعل توقيعًا إلكترونيًا وموافقة تعاقدية وفقًا للائحة eIDAS (الاتحاد الأوروبي) رقم 910/2014. تحتفظ SOS Expat بـ**سجلات تدقيق مؤرخة** تتضمن: (أ) التاريخ والوقت الدقيقين (UTC) للقبول، (ب) عنوان IP الخاص بالمحامي، (ج) معرّف الجلسة الفريد، (د) بصمة المتصفح (user-agent)، (هـ) إصدار الشروط المقبولة، (و) التجزئة التشفيرية للمستند المقبول، (ز) المعرّف الفريد للمحامي. تُشكّل هذه السجلات **دليلًا قانونيًا قابلًا للاحتجاج** على قبول الشروط.

2.4. **الاحتفاظ بأدلة القبول.** وفقًا للائحة GDPR والالتزامات القانونية للاحتفاظ، تحتفظ SOS Expat بأدلة القبول لمدة **عشر (10) سنوات** من تاريخ القبول، أو حتى انتهاء أي نزاع قائم عند الاقتضاء. يمكن للمحامي، بطلب كتابي عبر نموذج الاتصال، الحصول على **شهادة قبول** تتضمن عناصر الإثبات المذكورة أعلاه. يستند هذا الاحتفاظ إلى المصلحة المشروعة لـ SOS Expat في الاحتفاظ بالأدلة تحسبًا للنزاعات (المادة 6.1.f من GDPR) وإلى الالتزام القانوني بحفظ العقود التجارية.

2.5. **التعديلات (إشعار مسبق وفق لائحة P2B).** يجوز لـ SOS Expat تحديث الشروط و/أو جدول الرسوم في أي وقت، شريطة توجيه **إشعار مسبق لا تقل مدته عن خمسة عشر (15) يومًا** للمحامي على دعامة دائمة (بريد إلكتروني إلى العنوان المسجل ونشر في الفضاء الشخصي)، طبقًا للمادة 3 من اللائحة (الاتحاد الأوروبي) 2019/1150 («P2B»). يجوز تقصير هذا الإشعار أو إلغاؤه: (i) عندما يكون التعديل مفروضًا بالقانون أو بقرار من سلطة مختصة؛ (ii) لأسباب أمنية ملحّة أو لمنع الاحتيال؛ أو (iii) لتصحيحات مادية أو طباعية لا أثر اقتصادي لها. خلال فترة الإشعار، يجوز للمحامي **إنهاء علاقته بالمنصّة دون أي غرامة**. وفي حال عدم الإنهاء، يُعدّ استمرار استخدام المنصّة بعد انقضاء الإشعار قبولًا. وفي حال تعديل جوهري، يُدعى المحامي لإعادة تأكيد قبوله صراحةً، ويُوثَّق ذلك وفق آليات المادة 2.3.

2.6. **المدة**: غير محددة.

---

## 3. وضع المحامي – الاستقلال والامتثال

3.1. يعمل المحامي كمهني مستقل، ولا تنشأ بينه وبين SOS Expat أي علاقة عمل أو وكالة أو شراكة أو مشروع مشترك.

3.2. يكون المحامي وحده مسؤولاً عن: (i) شهاداته ومؤهلاته وتسجيله في نقابة المحامين/الهيئات المعادلة وترخيصه المهني؛ (ii) تأمين المسؤولية المهنية الساري والمناسب لبلد التدخّل؛ (iii) الامتثال للقوانين والأنظمة المهنية المحلية (الأخلاقيات، الإعلان، تضارب المصالح، السرية المهنية، مكافحة غسل الأموال، الضرائب، حماية المستهلك، إلخ).

3.3. لا تقوم SOS Expat بالإشراف على محتوى الخدمات القانونية التي يقدمها المحامي أو تقييمها، ولا تتحمل أي مسؤولية عنها.

3.4. **الصفة المهنية (B2B).** يُقر المحامي بأنه يتصرف حصرًا لأغراض مهنية. ولا تسري أنظمة حماية المستهلك على علاقة SOS Expat–المحامي.

3.5. **إقرارات وضمانات المحامي.** بتسجيله على المنصّة، يُقر المحامي ويضمن صراحةً أنه:
- (أ) **بالغ** وفق قانون بلد إقامته و/أو ممارسته؛
- (ب) يتمتع بـ**الأهلية القانونية الكاملة** للتعاقد وممارسة مهنته؛
- (ج) غير خاضع لأي وصاية أو قوامة أو حماية قضائية أو أي نظام مماثل؛
- (د) غير محظور عليه ممارسة مهنته، بشكل مؤقت أو دائم؛
- (هـ) غير مشطوب أو موقوف أو مستبعد من نقابته أو هيئته المهنية؛
- (و) لا يخضع لأي **إجراء تأديبي جارٍ** قد يؤدي إلى الإيقاف أو الشطب (أو يلتزم بإبلاغ SOS Expat فورًا عند الاقتضاء)؛
- (ز) غير مدرج على أي **قائمة عقوبات** (OFAC، الاتحاد الأوروبي، الأمم المتحدة، HMT، أو غيرها)؛
- (ح) لم تصدر بحقه **إدانة جزائية** بأفعال تتعارض مع ممارسة مهنته؛
- (ط) جميع المعلومات المقدمة عند التسجيل **صحيحة وكاملة ومحدّثة**؛
- (ي) يلتزم بـ**إبلاغ SOS Expat فورًا** بأي تغيير يؤثر على هذه الإقرارات؛
- (ك) يملك **الحق الفعلي في ممارسة مهنة المحاماة** في كل دولة اختارها كـ«بلد تدخّل» عند تسجيله أو لاحقًا في ملفه الشخصي. يلتزم المحامي بعدم اختيار إلا الولايات القضائية التي يُرخص له فيها **قانونًا** بتقديم الاستشارات القانونية أو تمثيل العملاء، سواء بموجب تسجيله المحلي أو اتفاقيات الاعتراف المتبادل أو المعاهدات الدولية أو أي آلية قانونية أخرى. يُشكّل اختيار بلد تدخّل لا يملك فيه المحامي صلاحية الممارسة **انتهاكًا جسيمًا** لهذه الشروط.
يُعد أي إقرار كاذب انتهاكًا جسيمًا للشروط قد يؤدي إلى الحظر الفوري والنهائي، دون المساس بأي دعوى تعويض.

---

## 4. إنشاء الحساب والتحقق والأمان

4.1. **الشروط**: ترخيص ممارسة ساري في ولاية قضائية واحدة على الأقل، مستندات الهوية والمؤهلات، تأمين مسؤولية مهنية ساري.

4.2. **الإجراء**: إنشاء الحساب، تقديم المستندات، تحقق يدوي قد يشمل مقابلة فيديو وفحوصات KYC/AML عبر مزودي الخدمة.

4.3. **الدقة والتحديث**: يضمن المحامي دقة وحداثة المعلومات؛ حساب واحد (1) فقط لكل محامٍ.

4.4. **الأمان**: يحمي المحامي بيانات اعتماده؛ وتُعد أي نشاطات عبر الحساب صادرة عنه؛ ويجب الإبلاغ فورًا عن أي اختراق.

4.5. **تحققات تكميلية في أي وقت.** تحتفظ SOS Expat بالحق في مطالبة المحامي، **في أي وقت ودون تبرير**، بتقديم أو تحديث أي مستند يثبت حقه في الممارسة أو تسجيله بالنقابة أو تأمين مسؤوليته المهنية أو هويته أو أي وثيقة ذات صلة. يلتزم المحامي بالرد على هذه الطلبات خلال **سبعة (7) أيام عمل**. وقد يؤدي عدم الرد أو تقديم مستندات غير مطابقة إلى التعليق الفوري للحساب.

4.6. **الإشراف ومراقبة الجودة.** تطبّق SOS Expat سياسة إشراف تهدف إلى ضمان جودة وامتثال الخدمات المعروضة على المنصّة. قد يشمل هذا الإشراف: (أ) التحقق من الملفات والمحتويات المنشورة، (ب) تحليل تقييمات وشكاوى المستخدمين، (ج) مراقبة الامتثال للشروط والقوانين المعمول بها، (د) أي إجراء معقول آخر لضبط الجودة. يوافق المحامي على الخضوع لهذا الإشراف.

4.7. **التعليق المؤقت للحساب.** يجوز لـ SOS Expat **تعليق الحساب فورًا ودون إشعار مسبق** في الحالات التالية:
- (أ) الاشتباه بالاحتيال أو انتحال الهوية أو الإقرار الكاذب؛
- (ب) شكاوى متعددة أو جسيمة من المستخدمين؛
- (ج) عدم تقديم المستندات المطلوبة بموجب المادة 4.5؛
- (د) انتهاك مثبت أو مشتبه به للشروط أو القوانين المعمول بها؛
- (هـ) سلوك يضر بصورة المنصّة أو سمعتها؛
- (و) أمر من سلطة قضائية أو إدارية أو نقابية؛
- (ز) أي سبب مشروع آخر تقدّره SOS Expat بسلطتها التقديرية.
أثناء التعليق، لا يمكن للمحامي الوصول إلى حسابه أو تلقي عمليات ربط جديدة. وقد تُحتجز المدفوعات الجارية حتى توضيح الوضع.

4.8. **الحظر النهائي (الإنهاء لسبب).** يجوز لـ SOS Expat **إنهاء الحساب نهائيًا ودون إشعار** («الحظر») في الحالات التالية:
- (أ) انتهاك جسيم أو متكرر للشروط؛
- (ب) احتيال مثبت أو إقرار كاذب متعمد أو انتحال هوية/لقب؛
- (ج) فقدان حق الممارسة (شطب، إيقاف نقابي، عدم تجديد التسجيل)؛
- (د) إدانة جزائية تتعارض مع ممارسة المهنة؛
- (هـ) سلوك ضار جسيمًا بالمستخدمين أو بالمنصّة؛
- (و) العودة للمخالفة بعد تعليق مؤقت؛
- (ز) تحايل مثبت على المنصّة لتجنب رسوم الربط؛
- (ح) عدم الامتثال لمتطلبات التحقق KYC رغم التذكيرات؛
- (ط) أي سبب جسيم آخر تقدّره SOS Expat بسلطتها التقديرية.
الحظر **نهائي وغير قابل للإلغاء**. ولا يمكن للمحامي المحظور إنشاء حساب جديد. ويجوز احتجاز الأموال المعلقة كتعويضات جزافية، دون المساس بأي دعوى تعويض أخرى.

4.9. **الإجراء والإخطار.** في حال التعليق أو الحظر، تُخطر SOS Expat المحامي بالبريد الإلكتروني المسجل. يُبيّن الإخطار سبب الإجراء (ما لم يُلزم القانون بالسرية). يملك المحامي **خمسة عشر (15) يومًا** لتقديم ملاحظاته كتابيًا عبر نموذج الاتصال. تدرس SOS Expat هذه الملاحظات لكنها غير ملزمة برفع الإجراء. قرار SOS Expat **تقديري ونهائي**.

4.10. **آثار التعليق أو الحظر.** في حال التعليق أو الحظر:
- (أ) يُحظر الوصول إلى الحساب فورًا؛
- (ب) يُزال ملف المحامي من نتائج البحث؛
- (ج) قد تُلغى عمليات الربط الجارية؛
- (د) قد تُحتجز المدفوعات المعلقة أو تُقاص مع أي مبالغ مستحقة لـ SOS Expat؛
- (هـ) يظل المحامي ملزمًا بالتزاماته (السرية، عدم الاستقطاب، إلخ) وفقًا لبنود الاستمرارية.

4.11. **عدم النشاط.** في حال **عدم النشاط لأكثر من 365 يومًا**، قد يُلغى تفعيل الحساب تلقائيًا بعد الإخطار. يمكن للمحامي إعادة تفعيل حسابه عند الطلب، شريطة تقديم مستندات التحقق المطلوبة.

4.12. **الإنهاء الطوعي.** يمكن للمحامي إغلاق حسابه في أي وقت بعد الوفاء بالتزاماته الجارية (الخدمات المقبولة، المبالغ المستردة المحتملة). يُقدَّم طلب الإغلاق عبر نموذج الاتصال. تُنفذ SOS Expat الإغلاق خلال **ثلاثين (30) يومًا**.

4.13. **الاتصالات الإلكترونية.** يوافق المحامي على تلقي أي إخطارات تتعلق بالشروط والإشراف وإجراءات التعليق/الحظر إلكترونيًا (البريد الإلكتروني، إشعارات التطبيق، النشر على المنصّة). يلتزم المحامي بالإبقاء على عنوان بريد إلكتروني صالح ومراجعة إشعاراته بانتظام.

4.14. **النظام الداخلي لمعالجة الشكاوى (لائحة P2B).** طبقًا للمادة 11 من اللائحة (الاتحاد الأوروبي) 2019/1150، توفر SOS Expat للمحامي **نظامًا داخليًا مجانيًا لمعالجة الشكاوى**، يمكن الوصول إليه عبر نموذج الاتصال (https://sos-expat.com/contact). تلتزم SOS Expat بـ: (i) **الإقرار باستلام** أي شكوى خلال **سبعة (7) أيام عمل**؛ (ii) معالجة الشكوى **بجدية ودون تمييز وفي أجل معقول** (كقاعدة عامة **ثلاثون (30) يومًا**)؛ (iii) إبلاغ المحامي بـ**نتيجة معلَّلة** للمعالجة، بلغة واضحة ومفهومة، مع الإشارة إلى سبل الطعن اللاحقة (الوساطة في المادة 12.5، التحكيم في المادة 12.2)؛ (iv) الاحتفاظ بـ**إحصائيات مجمَّعة** عن سير هذا النظام، تُتاح سنويًا.

---

## 5. قواعد الاستخدام – تضارب المصالح، السرية، عدم التحايل

5.1. **تضارب المصالح:** يتعيّن على المحامي التحقق من أي تضارب قبل تقديم أي استشارة. وفي حال وجود تضارب، عليه الانسحاب وإخطار المستخدم.

5.2. **السرية المهنية والكتمان.** يلتزم المحامي بالسرية والكتمان المهني وفق القوانين المطبقة في بلد التدخّل.

**سياسة تسجيل المكالمات:**
- (a) **بشكل افتراضي**، **لا تسجل SOS Expat المحتوى الصوتي** للمكالمات بين المحامي والمستخدم. تُحفظ فقط **البيانات الوصفية التقنية** (الطابع الزمني، المدة، معرفات Twilio، حالة الاتصال) لأغراض الفوترة ومكافحة الاحتيال وحل النزاعات التقنية؛
- (b) **لا تُفعِّل SOS Expat أي تسجيل صوتي دون موافقة صريحة ومسبقة ومنفصلة من المحامي ومن المستخدم على حد سواء**، تتم بفعل إيجابي مستقل قبل بدء المكالمة. لا يجوز تفعيل أي تسجيل من جانب SOS Expat بصورة منفردة، باستثناء وحيد هو **استدعاء قانوني سليم صادر عن سلطة قضائية مختصة في بلد المحامي أو المستخدم**، يستوفي ضمانات النظام العام التي تشترطها تلك الولاية القضائية (لا سيما فيما يتعلق بالسرية المهنية للمحامي)؛
- (c) عند تفعيل تسجيل بصفة استثنائية في إطار البند (b)، يُحفظ للمدة الضرورية حصرًا لتحقيق غرضه، وفي حدود أقصاها **ستة (6) أشهر** (ما لم يُمدَّد بموجب إجراء قضائي قائم)، طبقًا للائحة GDPR وتوصيات السلطات المحلية لحماية البيانات؛
- (d) **يلتزم المحامي بنفسه** بعدم تسجيل أو تدوين كامل أو الكشف عن أو استخدام التبادلات لأغراض غير الخدمة المتفق عليها، إلا بإذن مكتوب من المستخدم أو التزام قانوني؛
- (e) **تظل السرية المهنية سليمة**: لا يمكن استخدام أي تسجيل من قبل SOS Expat ضد المحامي أو المستخدم بانتهاك القواعد الأخلاقية المطبقة على السرية المهنية.

5.3. **عدم التحايل:** لا تتقاضى SOS Expat عمولة على أتعاب المحامين. ويجب دفع رسوم الربط عن كل مستخدم جديد يتم التعرف عليه عبر المنصّة. يُحظر التحايل على المنصّة لتفادي دفع هذه الرسوم.

5.4. **السلوكيات المحظورة:** انتحال الهوية أو المؤهلات، نشر محتوى غير قانوني، التلاعب أو التواطؤ أو المقاطعة للإضرار بالمنصّة، مخالفة أنظمة العقوبات أو التصدير، أو أي نشاط غير قانوني.

5.5. **التوافر:** تُقدَّم المنصّة "كما هي" دون ضمان تشغيل مستمر. وقد يُقيّد الوصول لأسباب قانونية أو تقنية أو في حالات القوة القاهرة.

---

## 6. العلاقة بين المحامي والمستخدم (خارج المنصّة)

6.1. بعد عملية الربط، يمكن للمحامي والمستخدم إبرام اتفاق منفصل خارج المنصّة.
ولا تتدخل SOS Expat في تحديد أو تحصيل الأتعاب، إلا في حال استخدام نظام الدفع الموحد الموضح أدناه.

6.2. يلتزم المحامي بتقديم اتفاق الأتعاب وفق القانون المحلي، وجمع الضرائب المستحقة وسدادها، والامتثال للقواعد المهنية (الإعلان، تضارب المصالح، المستهلكين).

6.3. لا تتحمل SOS Expat أي مسؤولية عن جودة أو دقة أو نتائج الخدمات القانونية المقدّمة من المحامي.

---

## 7. الرسوم والدفع الموحد والضرائب

7.1. **رسوم الربط (مقابل المنصّة).** تُكافِئ رسوم الربط **حصريًا الخدمة التقنية للربط** التي تقدمها SOS Expat إلى **المستخدم**. وهي **مستحقة على المستخدم** و**ليست على المحامي**. يُحدَّد مبلغها وفق **جدول الأسعار الساري** القابل للاطلاع في الفضاء الشخصي للمحامي، عن كل عملية ربط، غير شامل الضرائب ورسوم مزوّد خدمات الدفع. يتم أي تعديل لجدول الأسعار وفق الشروط الواردة في المادة 2.5 (إشعار مسبق لا يقل عن خمسة عشر (15) يومًا). يُدعى المحامي للاطلاع بانتظام على جدول الأسعار الساري.

7.2. **التكييف القانوني للدفع — دَينان مستقلان ومتمايزان.** يُفكَّك الدفع الذي يقوم به المستخدم عبر المنصّة، رغم تسويته بتحصيل واحد لاعتبارات تشغيلية، **من الناحية القانونية إلى دَينَين مستقلَّين ومتمايزَين**:
- (أ) **دَين «الربط»**: المبلغ **المستحق على المستخدم لصالح SOS Expat** نظير الخدمة التقنية للربط (رسوم الربط، المادة 7.1)؛
- (ب) **دَين «الأتعاب»**: المبلغ **المستحق على المستخدم لصالح المحامي** نظير الخدمة القانونية المتفق عليها بينهما. تنتمي اتفاقية الأتعاب ومضمون الخدمة وجودتها **حصريًا** إلى علاقة المحامي بالمستخدم، خارج المنصّة (المادتان 6 و13.5).

**لا تتقاضى SOS Expat ولا تطالب ولا يحق لها الحصول على أي عمولة أو نسبة استرجاع أو مشاركة أو نسبة مئوية أو جزء أيًّا كان من أتعاب المحامي — لا سيما في الولايات القضائية التي تحظر قواعدها المهنية مشاركة الأتعاب مع غير المحامين. تُشكّل رسوم الربط المقابل الوحيد لـ SOS Expat، وتأتي حصريًا من دَين المستخدم المشار إليه في الفقرة (أ).**

يُحوِّل مزوّد خدمات الدفع، الذي يتصرف عن الجزء (ب) بصفة **وكيل دفع للمحامي**، الأتعاب المحصَّلة إلى هذا الأخير، بعد خصم الرسوم المصرفية للمعالجة، وعند الاقتضاء، رسوم تحويل العملة (المادتان 7.3 و7.4) فقط. **يُعرض المبلغ الصافي الذي سيتلقاه المحامي في لوحة التحكم الخاصة به قبل وبعد كل معاملة**، مما يتيح له قبول أو رفض الربط بمعرفة كاملة للوقائع.

7.3. **الرسوم المصرفية لمزوّد خدمات الدفع.** يقتطع مزوّد خدمات الدفع (Stripe أو ما يعادله) رسوم معالجة على كل معاملة. **تقع هذه الرسوم المصرفية بالكامل على عاتق المحامي** وتُخصم تلقائيًا من المبلغ المحوّل إليه. تفاصيل هذه الرسوم متاحة في شروط مزوّد خدمات الدفع وفي لوحة تحكم المحامي لكل معاملة.

7.4. **رسوم الصرف وتحويل العملات.** عندما تختلف عملة دفع المستخدم عن عملة الحساب المصرفي للمحامي، تُطبّق **رسوم تحويل العملات** من قبل مزوّد خدمات الدفع. **تقع رسوم الصرف هذه بالكامل على عاتق المحامي** وتُخصم من المبلغ المحوّل إليه. أسعار الصرف المطبّقة هي تلك الخاصة بمزوّد خدمات الدفع وقت التحويل. يُقر المحامي ويقبل صراحةً أن SOS Expat لا تملك أي سيطرة على أسعار الصرف هذه وتتنصّل من أي مسؤولية عن تقلبات العملات أو الرسوم المفروضة من المزوّد.

7.5. **حساب المبلغ الصافي المحوّل للمحامي.** يقابل المبلغ الصافي المحوَّل للمحامي **دَين «الأتعاب»** المستحق على المستخدم (المادة 7.2.ب)، بعد خصم **فقط**: (i) **الرسوم المصرفية** لمزوّد خدمات الدفع المطبَّقة على جزء «الأتعاب» (المادة 7.3)، و(ii) عند الاقتضاء، **رسوم تحويل العملة** (المادة 7.4). **لا تُخصم رسوم الربط (المادة 7.2.أ) في أي حال من الأتعاب**: فهي تُحصَّل بموجب دَين مستقل للمستخدم تجاه SOS Expat. **يُبلَّغ المحامي بالمبلغ الدقيق الذي سيتلقاه في لوحة التحكم قبل كل خدمة، ويمكنه بالتالي اتخاذ قرار مستنير بقبول أو رفض عملية الربط.**

7.6. **الاستحقاق وعدم الاسترداد.** تستحق رسوم الربط فور تنفيذ عملية الربط الفعلية و**لا تُردّ** (إلا بقرار تقديري من SOS Expat في حالة إخفاق منسوب حصريًا للمنصّة وفي حدود ما يسمح به القانون).

7.7. **استرداد المبالغ للمستخدم.** في حال منح استرداد للمستخدم، يُخصم من حصة المحامي: يجوز لـ SOS Expat احتجاز/مقاصة المبلغ المقابل من التحويلات المستقبلية للمحامي، أو طلب السداد المباشر إذا لم تكن هناك تحويلات قادمة. تظل رسوم الربط مستحقة لـ SOS Expat، ما لم يُقرر خلاف ذلك بشكل تقديري.

7.8. **مواعيد دفع أجر المحامي بحسب القناة.** رهنًا بإتمام عملية التحقق KYC (المادة 8)، تختلف مواعيد دفع الأجر الصافي للمحامي بحسب قناة الربط:
- (أ) **عمليات الربط B2C** (دفع مباشر من المستخدم): يُصرف أجر المحامي من قبل مزوّد خدمات الدفع **فورًا في أعقاب المكالمة**، مع مراعاة فقط آجال المعالجة المصرفية ومكافحة الاحتيال وإثبات الدفع التقنية الخاصة بمزوّد خدمات الدفع (عادةً من يوم (1) إلى سبعة (7) أيام عمل بحسب بلد المحامي ومدى نضج حسابه لدى المزوّد)؛
- (ب) **عمليات الربط B2B** (الدفع من قبل الشريك B2B): نظرًا لنموذج الفوترة المؤجَّلة المطبَّق على الشريك B2B (فوترة شهرية أو «net-30»)، يُصرف أجر المحامي **خلال ثلاثين (30) يومًا** من تاريخ المكالمة؛
- (ج) في جميع الأحوال، يجوز تعليق الدفع في حال وجود نزاع أو شكوى من المستخدم أو الشريك، أو تحقق KYC/مكافحة غسل الأموال-تمويل الإرهاب جارٍ، أو أيّ ظرف آخر منصوص عليه في هذه الشروط.

7.9. **الضرائب.** يظل المحامي **المسؤول الوحيد** عن جميع التزاماته الضريبية (ضريبة الدخل، ضريبة القيمة المضافة، الاشتراكات الاجتماعية، الرسوم المهنية، إلخ) في دولة إقامته و/أو ممارسته. المبالغ المحوّلة للمحامي هي **مبالغ إجمالية**؛ والمحامي مسؤول عن التصريح ودفع جميع الضرائب المطبّقة. تقوم SOS Expat بتحصيل وتحويل ضريبة القيمة المضافة/المعادل المحلي على رسوم الربط فقط، عند اشتراط القانون.

7.10. **المقاصة.** يجوز لـ SOS Expat مقاصة أي مبلغ مستحق لها من المحامي (بموجب استرداد للمستخدم أو غرامة أو أي التزام آخر) مع أي مبلغ مستحق للمحامي.

7.11. **الشفافية في التسعير والسجل.** يمكن للمحامي في أي وقت الاطلاع في لوحة التحكم الشخصية على: (i) التفاصيل الكاملة لكل معاملة، (ii) المبلغ الإجمالي المدفوع من المستخدم، (iii) رسوم الربط المخصومة، (iv) الرسوم المصرفية لمزوّد خدمات الدفع، (v) رسوم الصرف عند الاقتضاء، (vi) المبلغ الصافي المحوّل أو المستحق التحويل، و(vii) سجل جميع معاملاته. تُحفظ هذه المعلومات وتبقى متاحة طوال مدة الحساب و**خمس (5) سنوات** بعد إغلاقه.

7.12. **التصريح الضريبي التلقائي (توجيه DAC7 — الاتحاد الأوروبي 2021/514).** يُعلَم المحامي المقيم في إحدى الدول الأعضاء في الاتحاد الأوروبي بأن SOS Expat، بصفتها مشغِّل منصّة مُصرِّحة، ملزمة بـ**التصريح سنويًا** للسلطات الضريبية المختصة (بموجب التوجيه (الاتحاد الأوروبي) 2021/514 المعروف بـ«DAC7») بالمعلومات المتعلقة بالمحامين النشطين المقيمين في الاتحاد الأوروبي، وهي على وجه الخصوص: الاسم، العنوان، المعرّف الضريبي (TIN)، دولة الإقامة، إجمالي المقابل المتلقى عبر المنصّة وعدد عمليات الربط، موزَّعة حسب الفصل المدني. يلتزم المحامي بتقديم وتحديث هذه المعلومات في فضائه الشخصي. وقد يؤدي عدم التقديم أو التحديث إلى تعليق المدفوعات حتى التسوية، طبقًا لأحكام DAC7.

7.13. **القناة B2B — عمليات الربط عبر شريك B2B.**

(أ) **النطاق.** الربط B2B هو ربط يُطلقه مستخدم B2B بصفته مستفيدًا من عقد إطاري مُبرَم بين SOS Expat وشريك B2B (المادة 1).

(ب) **تكييف آلية الدَّينين.** تُطبَّق آلية الدَّينين (المادة 7.2) في القناة B2B على النحو الآتي:
- **دَين «الربط»** يكون مستحقًا على **الشريك B2B** لصالح SOS Expat (كليًا أو جزئيًا وفق العقد الإطاري)، بحيث **لا يدفع المستخدم B2B عادةً أيّ مبلغ**، أو لا يدفع سوى مبلغ مشاركة محتمل لـ SOS Expat؛
- **دَين «الأتعاب»** يبقى مستحقًا على **المستخدم النهائي** لصالح **المحامي**، ما لم يَنص بند صريح في العقد الإطاري على تحمّل الشريك B2B كامل الأتعاب أو جزء منها (وفي هذه الحالة يصبح الشريك مَدِينًا للمحامي بالحصة المتحمَّلة، عبر آلية وكيل الدفع المنصوص عليها في المادة 7.2)؛
- لا يُعفى المحامي بأيّ حال من توقيع اتفاقية أتعاب مطابقة لأخلاقيات مهنته المحلية (المادة 6.2).

(ج) **اختلاف الأسعار B2C / B2B للمحامي — يقبل المحامي ذلك صراحةً.** **يُقرّ المحامي ويقبل صراحةً** بأن **الأجر الصافي الذي يتقاضاه عن ربط B2B قد يختلف**، ارتفاعًا أو انخفاضًا، **عن الأجر المتقاضى عن ربط B2C** (مثلًا: تسعير جزافي مُتفاوض عليه مع الشريك، مراعاة حجم مضمون، تحمّل كلي أو جزئي للأتعاب من قِبَل الشريك، أو خصم ممنوح للشريك). و**قناة المنشأ (B2C أو B2B)** و**المبلغ الدقيق** الذي سيتقاضاه المحامي **يُعرَضان في لوحة التحكم الخاصة به قبل كل عملية ربط**، مما يتيح له القبول أو الرفض بحرية وبمعرفة كاملة بالوقائع. **لا يقع على المحامي أيّ التزام بالقبول** بسبب القناة أو السعر المعروض.

(د) **عدم نفاذ العقد الإطاري B2B في مواجهة المحامي.** إن أحكام العقد الإطاري المبرم بين SOS Expat والشريك B2B **غير نافذة في مواجهة المحامي**؛ ولا تحكم العلاقةَ بين SOS Expat والمحامي بمناسبة ربط B2B سوى هذه الشروط والمعلومات المعروضة في لوحة تحكم المحامي.

(هـ) **تنطبق جميع الأحكام الأخرى من هذه الشروط** على عمليات الربط B2B.

(و) **سُلَّم الأسعار الساري بتاريخ هذه الشروط (على سبيل الإرشاد).** بتاريخ آخر تحديث لهذه الشروط، تكون أسعار الأجر الصافي للمحامي على النحو الآتي:
- **الربط B2C**: **ثلاثون يورو (30 €) أو ثلاثون دولارًا أمريكيًا (30 USD)** صافيًا عن كل عملية ربط مقبولة ومنفَّذة، وفقًا لعملة التسوية؛
- **الربط B2B**: **عشرون يورو (20 €) أو عشرون دولارًا أمريكيًا (20 USD)** صافيًا عن كل عملية ربط مقبولة ومنفَّذة، وفقًا لعملة التسوية.

هذه المبالغ **إرشادية** وتعكس السُّلَّم الساري بتاريخ تحديث هذه الشروط. ويظل **السُّلَّم المحدَّث** متاحًا للاطلاع باستمرار في لوحة تحكم المحامي قبل كل عملية ربط. ويخضع أيّ تطوّر للإشعار المسبق ذي الخمسة عشر (15) يومًا المنصوص عليه في المادة 7.14.

7.14. **تعديل سُلَّم أجر المحامي.** تحتفظ SOS Expat بحق **تعديل سُلَّم الأجر الصافي للمحامي في أيّ وقت**، سواء تعلّق الأمر بـ:
- (i) **سُلَّم B2C** — بتعديل رسوم الربط أو هيكلها (وهو ما ينعكس على الصافي الذي يتقاضاه المحامي)؛
- (ii) **سُلَّم B2B** — بتعديل الأجر الجزافي أو المتغيِّر المطبَّق على عمليات الربط B2B؛
- (iii) أو أيّ عنصر آخر من عناصر الأجر الصافي (مثلًا: العملات، شرائح الحجم، شرائح الأقدمية).

يخضع كلّ تعديل لـ**إشعار مسبق لا يقل عن خمسة عشر (15) يومًا** المنصوص عليه في المادة 2.5، يُبلَّغ به المحامي على دعامة دائمة (بريد إلكتروني إلى العنوان المسجَّل ونشر في فضائه الشخصي). وأثناء فترة الإشعار، يجوز للمحامي **إنهاء علاقته بالمنصّة دون أيّ غرامة** أو الاستمرار في **الرفض حالةً بحالة** لعمليات الربط التي لم يَعُد أجرها يناسبه، مع التذكير بأن **المحامي غير مُلزَم أبدًا بقبول أيّ ربط**. **تظل عمليات الربط المقبولة قبل انقضاء فترة الإشعار مدفوعةً وفق السعر الساري في تاريخ القبول.** وفي حال عدم الإنهاء، يُعدّ استمرار استخدام المنصّة بعد انقضاء فترة الإشعار قبولًا للسُّلَّم الجديد.

---

## 8. المدفوعات – التحقق (KYC) – مكافحة غسل الأموال – العقوبات

8.1. **مزودو الدفع.** تتم معالجة المدفوعات **حصرياً** من قبل مزودي خدمات طرف ثالث معتمدين **PCI-DSS**: **Stripe Payments Europe Ltd.** (أيرلندا، الاتحاد الأوروبي) و/أو **PayPal (Europe) S.à r.l. et Cie, S.C.A.** (لوكسمبورغ، الاتحاد الأوروبي). يعتمد المزود المطبق على بلد إقامة/ممارسة المحامي (Stripe يغطي حالياً 44 دولة، PayPal أكثر من 150 دولة). يقبل المحامي **صراحة** الشروط وإجراءات KYC/AML للمزود(ين) المطبق(ين). **SOS Expat ليست بنكاً ولا مؤسسة دفع ولا مؤسسة ائتمان**؛ SOS Expat هي فقط عميل تجاري لمزودي الدفع المذكورين.

8.2. يجوز لـ SOS Expat تأخير أو احتجاز أو إلغاء أي مدفوعات في حال الاشتباه بالاحتيال أو عدم الامتثال أو صدور أوامر قانونية.

8.3. **العقوبات الدولية والحظر.** يُقر المحامي ويضمن أنه:
- (أ) غير مدرج، بشكل مباشر أو غير مباشر، على أي **قائمة عقوبات** (OFAC/SDN، الاتحاد الأوروبي، الأمم المتحدة، HMT، أو أي قائمة عقوبات أخرى سارية)؛
- (ب) غير مملوك أو مُسيطر عليه، بشكل مباشر أو غير مباشر، من قبل شخص أو كيان مدرج على قائمة عقوبات؛
- (ج) ليس مقيمًا أو من مواطني أو موجودًا في **دولة أو إقليم خاضع لحظر شامل أو لتدابير تقييدية كاملة** بموجب القوانين والأنظمة المعمول بها، لا سيما أنظمة مزوّدي خدمات الدفع، والاتحاد الأوروبي، والأمم المتحدة، وOFAC (الولايات المتحدة)، وHMT (المملكة المتحدة)، أو أي سلطة مختصة أخرى. تتولى السلطات المذكورة أعلاه القائمة المحدَّثة لهذه الدول والأقاليم، وهي القائمة المعتمدة؛ ولا تضع SOS Expat ولا تنشر قائمة جيوسياسية خاصة بها؛
- (د) لا يستخدم المنصّة لإجراء معاملات تتضمن أشخاصًا أو كيانات أو دولًا خاضعة للعقوبات؛
- (هـ) يلتزم بجميع **قوانين الرقابة على الصادرات** المعمول بها.
تحتفظ SOS Expat بالحق في **تقييد أو حظر الوصول فورًا** إلى المنصّة في أي إقليم خاضع للعقوبات أو الحظر، أو لأي محامٍ يُشتبه في انتهاكه لهذه الأحكام، دون إشعار مسبق أو تعويض. كما يجوز لـ SOS Expat أن تكون **ملزمة بتجميد أموال** المحامي بناءً على أمر من سلطة مختصة.

### الأموال غير المُطالب بها والتحقق KYC

8.4. **الالتزام بإكمال عملية التحقق (KYC).** لتلقي المدفوعات الناتجة عن الخدمات المقدمة عبر المنصّة، يلتزم المحامي بإكمال عملية التحقق من الهوية (KYC - اعرف عميلك) لدى شريك الدفع Stripe في أقرب وقت ممكن بعد التسجيل. يُقر المحامي بأن عدم إكمال التحقق KYC يمنع تقنيًا تحويل الأموال إلى حسابه المصرفي.

8.5. **حفظ الأموال المعلقة.** عندما يتم دفع مبلغ من مستخدم مقابل خدمة يقدمها محامٍ لم يُكمل التحقق KYC، تُحفظ الأموال المقابلة لحصة المحامي (بعد خصم رسوم الربط للمنصّة) في حساب ضمان. تلتزم المنصّة بما يلي:
- إخطار المحامي عبر البريد الإلكتروني بوجود أموال معلقة؛
- إرسال تذكيرات منتظمة (في اليوم 7، 30، 60، 90، 120 و150)؛
- توفير جميع الوسائل اللازمة للمحامي لإكمال التحقق KYC.

8.6. **الأموال المعلقة لفترة طويلة — رسوم الإدارة وتحويلها إلى السلطات المختصة.** عندما لا يُكمل التحقق KYC خلال **مائة وثمانين (180) يومًا** من تاريخ أول دفعة معلقة، وبالرغم من الإخطارات المنصوص عليها في المادة 8.5:
- (أ) **رسوم إدارة جزافية.** يجوز لـ SOS Expat اقتطاع **رسوم إدارة جزافية معقولة، بحد أقصى عشرة بالمائة (10%) من المبلغ المحتجز**، من الأموال المعلقة، تغطي حصرًا التكاليف الإدارية الفعلية للحفظ ومحاولات الاتصال والمعالجة المحاسبية؛
- (ب) **حفظ مطوَّل.** يبقى الرصيد محفوظًا في حساب الفصل لدى مزوّد خدمات الدفع (أو يُودع لدى SOS Expat إذا اقتضت الشروط التقنية ذلك). يجوز للمحامي في أي وقت خلال هذه المرحلة إكمال التحقق KYC والمطالبة بالأموال؛
- (ج) **التحويل إلى السلطات المختصة (سقوط ملكية الأموال غير المطالب بها).** عند انقضاء أجل إجمالي قدره **خمس (5) سنوات** من تاريخ أول دفعة معلقة، وفي غياب مطالبة صحيحة، تُحوَّل الأموال المتبقية **إلى السلطة المختصة في بلد إقامة المحامي** وفقًا للقواعد المطبَّقة على الأموال غير المطالب بها (مثلًا في فرنسا، إلى Caisse des dépôts بموجب قانون Eckert؛ في الولايات المتحدة، إلى برنامج unclaimed property التابع للولاية المختصة؛ في المملكة المتحدة، إلى Dormant Assets Scheme؛ وبصورة عامة إلى الآلية المحلية المماثلة). **لا تستحوذ SOS Expat بأي حال على هذه الأموال المتبقية.**

8.7. **المطالبة خلال فترة الحفظ المطوَّل.** يجوز للمحامي في أي وقت خلال مرحلة الحفظ المطوَّل (ب) أن يوجه طلب مطالبة مُسبَّبًا إلى SOS Expat عبر نموذج الاتصال، مرفقًا بـ**تحقق KYC كامل** (إذ يُعدّ التحقق KYC شرطًا تقنيًا تفرضه التزامات مزوّد خدمات الدفع وقواعد مكافحة غسل الأموال وتمويل الإرهاب). تدرس SOS Expat الطلب خلال **ثلاثين (30) يومًا**. في حال القبول، تُحوَّل الأموال بعد خصم رسوم الإدارة المذكورة في الفقرة (أ) فقط. وفي حال قوة قاهرة مُثبتة على النحو الواجب أو عجز طبي موثَّق، يجوز تخفيض هذه الرسوم أو إلغاؤها وفقًا للسلطة التقديرية المعقولة لـ SOS Expat.

8.8. **القبول الصريح.** بالتسجيل على المنصّة، يُقرّ المحامي بأنه اطلع على أحكام هذه المادة 8 ويقبلها صراحةً. يُشكّل هذا القبول شرطًا جوهريًا للحصول على صفة مقدم الخدمة.

---

## 9. البيانات الشخصية (إطار عالمي – GDPR/DSA)

9.1. **الأطراف المتحكمة بالبيانات:** بالنسبة لبيانات المستخدمين المستلمة لغرض الربط، تُعد SOS Expat والمحامي كلٌّ منهما مسؤولاً مستقلاً عن المعالجة لأغراضه الخاصة.

9.2. **الأسس والأغراض القانونية:** تنفيذ العقد (الربط)، المصالح المشروعة (الأمن، منع الاحتيال، التحسين)، الالتزام القانوني (مكافحة غسل الأموال، العقوبات)، أو بموافقة المستخدم عند الحاجة.

9.3. **النقل الدولي للبيانات:** يتم مع الضمانات اللازمة عند الاقتضاء.

9.4. **حقوق المستخدم والتواصل:** يمكن للمستخدم ممارسة حقوقه عبر نموذج الاتصال في المنصّة.

9.5. **الأمن:** اتخاذ تدابير تقنية وتنظيمية مناسبة؛ والإبلاغ عن أي خرق للبيانات وفق القوانين المعمول بها.

9.6. يلتزم المحامي بمعالجة البيانات وفق قوانين بلد التدخّل وأخلاقيات المهنة (السرية المهنية).

9.7. **الامتثال لـ DSA:** تعمل المنصّة كـ**خدمة وسيطة** بموجب **اللائحة (الاتحاد الأوروبي) 2022/2065 (قانون الخدمات الرقمية)**. تنفذ SOS Expat آليات للإبلاغ عن المحتوى غير القانوني وتتعاون مع السلطات المختصة.

---

## 10. الملكية الفكرية

المنصّة وعلاماتها وشعاراتها وقواعد بياناتها ومحتواها محمية قانونيًا.
ولا يُمنح المحامي سوى حق وصول شخصي غير حصري وغير قابل للتحويل طوال مدة الشروط.
ويمنح المحامي SOS Expat ترخيصًا عالميًا غير حصري لاستضافة وعرض محتواه (الملف الشخصي، الصورة، الوصف) ضمن المنصّة.

---

## 11. الضمان والمسؤولية والتعويض

11.1. لا تقدم SOS Expat أي ضمانات بخصوص الخدمات القانونية أو نتائجها.

11.2. تُقدَّم المنصّة «كما هي» دون أي ضمان لاستمرارية الوصول أو الجاهزية.

11.3. **تحديد المسؤولية:** في حدود القانون، لا تتجاوز مسؤولية SOS Expat تجاه المحامي عن أي ضرر مباشر إجمالي رسوم الربط المستلمة عن المعاملة محل النزاع.

11.4. **الاستثناءات:** لا تتحمل SOS Expat أي أضرار غير مباشرة أو تبعية أو خاصة أو تأديبية (مثل فقدان الأرباح أو السمعة).

11.5. **التعويض:** يتعهد المحامي بتعويض SOS Expat (وشركاتها التابعة وموظفيها ووكلائها) عن أي دعاوى أو أضرار أو تكاليف (بما في ذلك أتعاب المحاماة) ناتجة عن (i) خرق هذه الشروط أو القوانين، (ii) محتواه، أو (iii) أفعاله أو إغفالاته المهنية.

11.6. **التنازل عن حق الرجوع:** يتنازل المحامي صراحةً وبشكل غير قابل للإلغاء عن أي حق في الرجوع على SOS Expat عن أي أضرار ناتجة عن الخدمات القانونية المقدمة، أو الخسائر غير المباشرة، أو النزاعات مع المستخدمين، أو أي قصور في الخدمة.

11.7. لا تُفسَّر هذه الشروط على أنها تنشئ علاقة توظيف أو وكالة أو شراكة بين SOS Expat والمحامي.

11.8. **القوة القاهرة:** لا تتحمل SOS Expat أي مسؤولية عن التأخير أو الإخفاق في تنفيذ التزاماتها الناتج عن أحداث القوة القاهرة (كوارث طبيعية، حرب، جائحة، هجوم إلكتروني، انقطاع الكهرباء أو الإنترنت، قرار حكومي، إضراب، إلخ).

11.9. **استمرار البنود.** تظل المواد التالية سارية بعد إنهاء أو انتهاء هذه الشروط، أيًا كان السبب: المادة 2 (أدلة القبول)، 3.5 (الإقرارات)، 5 (قواعد الاستخدام)، 7 (الرسوم والدفع)، 8 (KYC والعقوبات)، 9 (البيانات الشخصية)، 10 (الملكية الفكرية)، 11 (المسؤولية والتعويض)، 12 (القانون الواجب التطبيق والتحكيم)، 13 (بنود الحماية) و14 (متنوعات). تظل هذه البنود سارية طالما كان ذلك ضروريًا لتحقيق آثارها.

---

## 12. القانون الواجب التطبيق – التحكيم – الاختصاص الإستوني – الدعاوى الجماعية

12.1. **القانون الواجب التطبيق وأسبقية الأخلاقيات المهنية المحلية.** تخضع هذه الشروط وتفسيرها وصحتها وتنفيذها حصريًا لـ**القانون الإستوني**، باستثناء قواعد تنازع القوانين. **لتفادي أي لبس**، تُعدّ القواعد الأخلاقية لمهنة المحاماة المطبَّقة في بلد التدخّل و/أو في بلد قيد المحامي بنقابة المحامين (لا سيما في مجالات السرية المهنية، وحظر مشاركة الأتعاب مع غير المحامين، وضوابط الإعلان والاستقطاب، وتضارب المصالح، وإدارة أموال العملاء) **من النظام العام**، و**تَسُود** على أي نص مخالف أو مبهم في هذه الشروط. لا يجوز تفسير أي بند من بنود الشروط على أنه يفرض على المحامي أو يجيز له سلوكًا مخالفًا لأخلاقياته المهنية المحلية؛ وفي حال تعارض، يمتنع المحامي ويُبلغ SOS Expat دون تأخير.

12.2. **التحكيم الدولي الإلزامي.** يُفصل نهائيًا في أي نزاع أو خلاف أو مطالبة ناشئة عن هذه الشروط أو متصلة بها، بما في ذلك صحتها أو تفسيرها أو تنفيذها أو إنهاؤها، عن طريق **التحكيم** وفقًا لقواعد التحكيم لـ**غرفة التجارة الدولية (ICC)**.
- **مقر التحكيم**: تالين، إستونيا؛
- **لغة التحكيم**: **الإنجليزية**؛
- **عدد المحكّمين**: محكّم واحد (1)، ما لم يتجاوز المبلغ المتنازع عليه 100,000 يورو، وفي هذه الحالة ثلاثة (3) محكّمين؛
- **القانون الموضوعي**: القانون الإستوني (المادة 12.1)؛
- **الإجراءات**: سرية. يلتزم الطرفان بعدم الكشف عن وجود التحكيم أو مضمونه أو نتيجته، إلا بموجب التزام قانوني أو لتنفيذ الحكم.
يكون حكم التحكيم **نهائيًا وملزمًا** للطرفين. يتنازل الطرفان عن أي طعن بالبطلان في حدود ما يسمح به القانون.

12.3. **التنازل عن الدعاوى الجماعية وهيئة المحلفين.** في أقصى حد يسمح به القانون المعمول به:
- (أ) يتنازل المحامي عن المشاركة في أي **دعوى جماعية أو دعوى تمثيلية** ضد SOS Expat؛
- (ب) يُحل أي نزاع على **أساس فردي فقط**؛
- (ج) يتنازل المحامي صراحةً عن أي **حق في المحاكمة أمام هيئة محلفين** (jury trial waiver)؛
- (د) يتنازل المحامي عن أي دعوى من نوع **class action** أو **consolidated action** أو **representative action** بموجب القانون الأمريكي أو أي قانون مماثل.

12.4. **الاختصاص الحصري للمحاكم الإستونية.** لأي طلب غير قابل للتحكيم بموجب القانون المعمول به، أو للتدابير التحفظية أو المؤقتة العاجلة قبل تشكيل هيئة التحكيم، ولتنفيذ أحكام التحكيم، تختص **محاكم تالين (إستونيا)** **حصريًا**. يُقر المحامي بما يلي:
- (أ) يوافق بشكل غير قابل للإلغاء على هذا الاختصاص؛
- (ب) يتنازل عن أي اعتراض على أساس **عدم ملاءمة المحكمة** (forum non conveniens)؛
- (ج) يتنازل عن أي اعتراض على أساس انعدام الاختصاص الشخصي؛
- (د) يقبل أن أي تبليغ يمكن أن يتم على عنوان البريد الإلكتروني المسجل على المنصّة.

12.5. **الوساطة الإلزامية المسبقة والوسطاء المحدَّدون (لائحة P2B).** قبل أي تحكيم، يلتزم الطرفان بمحاولة حل النزاع وديًا عن طريق **التفاوض بحسن نية** لمدة **ثلاثين (30) يومًا** من تاريخ الإخطار الكتابي بالنزاع، الذي يُرسَل بالبريد الإلكتروني مع إشعار بالاستلام إلى عنوان الاتصال للطرف الآخر. طبقًا للمادة 12 من اللائحة (الاتحاد الأوروبي) 2019/1150، تُحدِّد SOS Expat **وسيطَين (2) متخصصَين على الأقل**، مستقلَّين ويسهل الوصول إليهما بصورة معقولة، يختار من بينهما المحامي: **(i) مركز باريس للوساطة والتحكيم (CMAP) — cmap.fr**؛ و**(ii) مركز التحكيم والوساطة التابع للمنظمة العالمية للملكية الفكرية (جنيف) — wipo.int/amc**. تتحمل SOS Expat **حصة معقولة من رسوم الوساطة**، تُقدَّر بحسن نية وحالةً بحالة، لا سيما عندما يكون النزاع ذا قيمة منخفضة. يُعدّ فشل الوساطة شرطًا مسبقًا لتقديم طلب التحكيم.

12.6. **التقادم.** يجب رفع أي دعوى أو مطالبة من المحامي ضد SOS Expat خلال **الأقصر بين أجل ثلاث (3) سنوات** من تاريخ وقوع الواقعة المنشئة و**الأجل القانوني المطبَّق** في الولاية القضائية للمحامي، وإلا سقط الحق. ولا يُقصد بهذا البند ولا يترتب عليه تقصير آجال التقادم إلى ما دون الحد الأدنى الآمر الذي لا يجوز تقصيره اتفاقيًا في الولاية المعنية؛ وفي هذه الحالة يُطبَّق الأجل القانوني المحلي.

---

## 13. بنود الحماية الدولية

13.1. **مكافحة الفساد.** يلتزم المحامي بعدم تقديم أو وعد أو دفع رشاوى أو مزايا غير مشروعة لموظفين عموميين أو خاصين. ويلتزم بقوانين مكافحة الفساد المعمول بها (FCPA، UK Bribery Act، قانون Sapin II، إلخ).

13.2. **سرية الاتصالات.** الاتصالات التي تتم عبر المنصّة (الرسائل، المكالمات الهاتفية) **سرية**. يُحظر على المحامي تسجيلها أو الإفصاح عنها أو استخدامها لأغراض أخرى غير الخدمة المتفق عليها، إلا بإذن كتابي أو التزام قانوني.

13.3. **عدم الاستقطاب.** خلال مدة الشروط و**اثني عشر (12) شهرًا** بعد إنهائها، يُحظر على المحامي استقطاب المستخدمين الذين تعرف عليهم عبر المنصّة مباشرةً لتجنب رسوم الربط.

13.4. **المسؤولية الحصرية للمحامي.** المحامي هو **المسؤول الوحيد** عن جودة ودقة وقانونية الاستشارات والخدمات التي يقدمها. المحامي **مسؤول بالكامل** عن الامتثال للأحكام القانونية والتنظيمية في البلد الذي يمارس فيه. **لا تضمن** SOS Expat الاستشارات القانونية المقدمة من المحامي و**تتنصّل من أي مسؤولية** عن أي ضرر يلحق بالمستخدم نتيجة خدمات المحامي.

13.5. **انعدام علاقة الاستشارة.** SOS Expat **ليست مكتب محاماة** ولا مقدم خدمات قانونية. تقتصر المنصّة على **الربط**. أي علاقة استشارة قانونية تُقام **حصريًا** بين المحامي والمستخدم، **خارج** SOS Expat. **أي ملف** يُبرم مع عميل يتم **خارج SOS Expat**.

13.6. **النزاعات بين المحامي والمستخدم.** أي نزاع بين المحامي والمستخدم يخص **حصريًا** علاقتهما المباشرة. **لا تتدخل** SOS Expat في هذه النزاعات و**لا يمكن إشراكها** كطرف أو ضامن أو وسيط. SOS Expat **غير مسؤولة بأي حال** عن النزاعات بين المحامي والعميل.

---

## 14. متنوعات

14.1. **التنازل**: يجوز لـ SOS Expat التنازل عن الشروط لكيان من مجموعتها أو لخلف؛ ولا يجوز للمحامي التنازل دون موافقة كتابية من SOS Expat.

14.2. **الكمال**: تُشكّل الشروط الاتفاق الكامل وتحل محل أي اتفاق سابق يتعلق بالموضوع ذاته.

14.3. **الإخطارات**: بالنشر على المنصّة أو إشعارات التطبيق أو عبر نموذج الاتصال.

14.4. **التفسير**: العناوين إرشادية. لا تُطبّق قاعدة التفسير ضد الصائغ.

14.5. **اللغات**: قد تتوفر ترجمات؛ وتسود الإنجليزية في التفسير.

14.6. **البطلان الجزئي والقابلية للفصل.** إذا أُعلن بطلان أي حكم من هذه الشروط أو عدم صحته أو عدم قابليته للتنفيذ من قبل محكمة أو محكّم مختص:
- (أ) لا يؤثر هذا البطلان على صحة الأحكام الأخرى التي تظل سارية؛
- (ب) يُستبدل الحكم الباطل بحكم صحيح ذي أثر اقتصادي مماثل، قدر الإمكان؛
- (ج) يتفاوض الطرفان بحسن نية للاتفاق على حكم بديل.

14.7. **القابلية للفصل الجغرافي.** إذا كان أي حكم من هذه الشروط غير قابل للتنفيذ أو غير قانوني في ولاية قضائية معينة:
- (أ) لا يسري هذا الحكم في تلك الولاية فقط؛
- (ب) يظل ساريًا بالكامل في جميع الولايات الأخرى؛
- (ج) لا يؤثر عدم قابلية التنفيذ المحلية على الصحة الإجمالية للشروط.

14.8. **عدم التنازل.** لا يُعد عدم ممارسة SOS Expat لأي حق أو تأخرها فيه تنازلًا عنه. يجب أن يكون أي تنازل صريحًا ومكتوبًا. التنازل لمرة واحدة لا يُشكّل تنازلًا عامًا.

14.9. **استقلالية البنود.** كل بند من هذه الشروط مستقل. لا يؤدي بطلان بند إلى بطلان بنود تحديد المسؤولية أو التعويض أو التحكيم أو الاختصاص، التي تظل سارية في أقصى حد يسمح به القانون.

14.10. **الأطراف الثالثة.** لا تمنح هذه الشروط أي حقوق لأطراف ثالثة (باستثناء الشركات التابعة لـ SOS Expat المذكورة صراحةً). لا يحق لأي طرف ثالث الاحتجاج بأحكام الشروط.

---

## 15. الاتصال

لأي سؤال أو طلب قانوني: **https://sos-expat.com/contact**
`;

  // const defaultContent = selectedLanguage === 'fr' ? defaultFr : defaultEn;
  const defaultContent =
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

  // Sections du sommaire (UI)
  const anchorMap = useMemo(
    () => [
      { num: 1, label: t.sections.definitions },
      { num: 2, label: t.sections.scope },
      { num: 3, label: t.sections.status },
      { num: 4, label: t.sections.account },
      { num: 5, label: t.sections.rules },
      { num: 6, label: t.sections.relationship },
      { num: 7, label: t.sections.fees },
      { num: 8, label: t.sections.payments },
      { num: 9, label: t.sections.data },
      { num: 10, label: t.sections.ip },
      { num: 11, label: t.sections.liability },
      { num: 12, label: t.sections.law },
      { num: 13, label: t.sections.misc },
      { num: 14, label: t.sections.contact },
    ],
    [selectedLanguage]
  );

  const body = content || defaultContent;

  return (
    <Layout>
      <SEOHead title={`${t.title || "Lawyer Terms"} - SOS Expat`} description={t.subtitle || "Terms and conditions for SOS Expat lawyers."} ogType="website" contentType="WebPage" />
      <BreadcrumbSchema items={[{ name: 'Home', url: '/' }, { name: t.title || 'Lawyer Terms' }]} />
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

              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-1">
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
              </div>
            </div>

            <header className="text-center">
              <div className="flex justify-center mb-6">
                <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <Scale className="w-12 h-12 text-white" />
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

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-white/90">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 border border-white/20 backdrop-blur-sm">
                  <Shield className="w-4 h-4" /> <span>{t.keyFeatures}</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 border border-white/20 backdrop-blur-sm">
                  <Users className="w-4 h-4" />{" "}
                  <span>{t.trustedByExperts}</span>
                </span>
                {/* Aucune note/avis affichés */}
              </div>

              <div className="mt-8 flex items-center justify-center gap-4">
                <Link
                  to="/register/lawyer"
                  className="group inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm font-semibold"
                >
                  <Briefcase className="w-5 h-5" />
                  <span>{t.ctaHero}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="https://sos-expat.com/contact"
                  className="group inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white font-bold border-2 border-red-400/50 hover:scale-105 transition-all"
                >
                  <Globe className="w-5 h-5" />
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
                  icon: <Users className="w-6 h-6" />,
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
                  <FileText className="w-5 h-5" />
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
                <Globe className="w-4 h-4" /> Global
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <Link
                to="/register/lawyer"
                className="group relative overflow-hidden bg-white text-red-600 hover:text-red-700 px-10 py-5 rounded-3xl font-black text-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl flex items-center gap-3"
              >
                <Briefcase className="w-5 h-5" />
                <span>{t.startNow}</span>
                {/* Flèche retirée sur ce CTA comme demandé */}
                <span className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-black/5" />
              </Link>

              <a
                href="https://sos-expat.com/contact"
                className="group relative overflow-hidden border-2 border-white bg-transparent text-white px-10 py-5 rounded-3xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:bg-white/10 flex items-center gap-3"
              >
                <Globe className="w-5 h-5" />
                <span>{t.contactUs}</span>
                <span className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/30" />
              </a>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default TermsLawyers;
