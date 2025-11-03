import React, { useEffect, useMemo, useState } from "react";
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
    "fr" | "en" | "es" | "de" | "ru" | "hi" | "pt"
  >((language as "fr" | "en" | "es" | "de" | "ru" | "hi" | "pt") || "fr");

  // Rester aligné avec la langue globale si elle change
  useEffect(() => {
    if (language)
      setSelectedLanguage(
        language as "fr" | "en" | "es" | "de" | "ru" | "hi" | "pt"
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
      lastUpdated: "Version 2.2 – Dernière mise à jour : 16 juin 2025",
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
      lastUpdated: "Version 2.2 – Last updated: 16 June 2025",
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
      lastUpdated: "Versión 2.2 – Última actualización: 16 de junio de 2025",
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
      lastUpdated: "Версия 2.2 – Последнее обновление: 16 июня 2025",
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
      lastUpdated: "Version 2.2 – Letzte Aktualisierung: 16. Juni 2025",
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
      lastUpdated: "संस्करण 2.2 – अंतिम अपडेट: 16 जून 2025",
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
      lastUpdated: "Versão 2.2 – Última atualização: 16 de junho de 2025",
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
  };

  const t = translations[selectedLanguage];

  const handleLanguageChange = (newLang: "fr" | "en") => {
    setSelectedLanguage(newLang); // Changement local (n’affecte pas la langue globale)
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
              <span dangerouslySetInnerHTML={{ __html: formatted }} />
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
              href="http://localhost:5174/contact"
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
            dangerouslySetInnerHTML={{ __html: formattedLine }}
          />
        );
      }
    }

    return elements;
  };

  // --- Contenu par défaut (séparé FR / EN) ---
  const defaultFr = `
# Conditions Générales d'Utilisation – Avocats (Global)

**SOS Expat d'Ulixai OÜ** (la « **Plateforme** », « **SOS** », « **nous** »)

**Version 2.2 – Dernière mise à jour : 16 juin 2025**

---

## 1. Définitions

**Application / Site / Plateforme** : services numériques exploités par **Ulixai OÜ** permettant la mise en relation entre des utilisateurs (les « **Utilisateurs** ») et des avocats (les « **Avocats** »).

**Mise en relation** : l'introduction technique/opérationnelle réalisée par la Plateforme entre un Utilisateur et un Avocat, matérialisée par (i) la transmission de coordonnées, (ii) l'ouverture d'un canal de communication (appel, message, visio), ou (iii) l'acceptation par l'Avocat d'une demande émise via la Plateforme.

**Pays d'Intervention** : la juridiction principalement visée par la Requête au moment de la Mise en relation. À défaut, le pays de résidence de l'Utilisateur au moment de la demande ; en cas de pluralité, la juridiction la plus étroitement liée à l'objet de la Requête.

**Frais de Mise en relation** : frais dus à SOS pour chaque Mise en relation (art. 7) : **19 €** si payés en **EUR** ou **25 $ USD** si payés en **USD**, étant précisé qu'Ulixai peut modifier ces montants et/ou publier des barèmes locaux par pays/devise, avec effet prospectif.

**Requête** : la situation/projet juridique exposé par l'Utilisateur.

**Prestataire(s) de paiement** : services tiers utilisés pour percevoir le paiement unique de l'Utilisateur et répartir les fonds.

---

## 2. Objet, champ et acceptation

2.1. Les présentes CGU régissent l'accès et l'utilisation de la Plateforme par les Avocats.

2.2. Ulixai agit uniquement en tant qu'intermédiaire technique de mise en relation. Ulixai n'exerce pas la profession d'avocat, ne fournit pas de conseil juridique et n'est pas partie à la relation Avocat-Utilisateur.

2.3. **Acceptation électronique (click-wrap).** L'Avocat accepte les CGU en cochant la case dédiée lors de l'inscription et/ou en utilisant la Plateforme. Cet acte vaut signature électronique et consentement contractuel. SOS peut conserver des journaux de preuve (horodatage, identifiants techniques).

2.4. **Modifications.** SOS peut mettre à jour les CGU et/ou le barème des frais (par pays/devise) à tout moment, avec effet prospectif après publication sur la Plateforme. L'usage continu vaut acceptation.

2.5. Durée : indéterminée.

---

## 3. Statut de l'Avocat – Indépendance et conformité

3.1. L'Avocat agit en professionnel indépendant ; aucune relation d'emploi, mandat, agence, partenariat ou coentreprise n'est créée avec Ulixai.

3.2. L'Avocat est seul responsable : (i) de ses diplômes, titres, inscriptions au barreau/équivalents et autorisations d'exercer ; (ii) de son assurance responsabilité civile professionnelle en vigueur et adaptée aux Pays d'Intervention ; (iii) du respect des lois et règles professionnelles locales (déontologie, publicité/démarchage, conflits d'intérêts, secret professionnel, LCB-FT/KYC, fiscalité, protection des consommateurs, etc.).

3.3. Ulixai ne supervise pas et n'évalue pas le contenu ni la qualité des conseils de l'Avocat et n'endosse aucune responsabilité à ce titre.

3.4. **Capacité professionnelle (B2B).** L'Avocat déclare agir exclusivement à des fins professionnelles. Les régimes protecteurs des consommateurs ne s'appliquent pas à la relation Ulixai–Avocat.

---

## 4. Création de compte, vérifications et sécurité

4.1. Conditions : droit d'exercer valide dans au moins une juridiction, justificatifs d'identité et de qualification, assurance RCP en cours de validité.

4.2. Processus : création de compte, fourniture des documents, validation manuelle pouvant inclure un entretien visio et des contrôles KYC/LCB-FT via des Prestataires.

4.3. Exactitude & mise à jour : l'Avocat garantit l'exactitude/actualité des informations ; un (1) compte par Avocat.

4.4. Sécurité : l'Avocat protège ses identifiants ; toute activité via le compte est réputée effectuée par lui ; signalement immédiat de toute compromission.

---

## 5. Règles d'usage – Conflits, confidentialité, non-contournement

5.1. **Conflits d'intérêts.** L'Avocat effectue un screening approprié avant tout conseil. En cas de conflit, il se retire et en informe l'Utilisateur.

5.2. **Secret professionnel & confidentialité.** L'Avocat respecte la confidentialité/secret professionnel selon le droit applicable du Pays d'Intervention. Les échanges ne sont pas enregistrés par SOS, sauf obligations légales.

5.3. **Non-contournement.** Ulixai ne perçoit aucune commission sur les honoraires. Chaque nouvelle Mise en relation avec un nouvel Utilisateur via la Plateforme donne lieu aux Frais de Mise en relation. Il est interdit de contourner la Plateforme pour éviter ces frais lors d'une nouvelle introduction.

5.4. **Comportements interdits.** Usurpation d'identité/titre, contenus illicites, manipulation, collusion/boycott visant à nuire à la Plateforme, violation de lois sur sanctions/export, ou toute activité illégale.

5.5. **Disponibilité.** La Plateforme est fournie « en l'état » ; aucune disponibilité ininterrompue n'est garantie (maintenance, incidents, force majeure). L'accès peut être restreint si la loi l'impose.

---

## 6. Relation Avocat–Utilisateur (hors Plateforme)

6.1. Après la Mise en relation, l'Avocat et l'Utilisateur peuvent contractualiser hors Plateforme (Ulixai n'intervient pas dans la fixation ni l'encaissement des honoraires, sauf mécanisme de paiement unique décrit ci-dessous).

6.2. L'Avocat remet ses conventions d'honoraires selon le droit local, collecte/reverse les taxes applicables et respecte les règles locales (publicité, démarchage, conflits d'intérêts, consommateurs).

6.3. Ulixai n'est pas responsable de la qualité, de l'exactitude ou du résultat des conseils de l'Avocat.

---

## 7. Frais, paiement unique et taxes

7.1. **Frais de Mise en relation (forfait).** 19 € (EUR) ou 25 $ (USD) par Mise en relation, hors taxes et hors frais du Prestataire de paiement. Ulixai peut modifier ces montants et/ou publier des barèmes locaux par pays/devise, avec effet prospectif.

7.2. **Paiement unique et répartition.** L'Utilisateur effectue un paiement unique via la Plateforme couvrant (i) les honoraires de l'Avocat (tels que convenus entre l'Avocat et l'Utilisateur) et (ii) les Frais de Mise en relation d'Ulixai. Ulixai (ou son Prestataire) encaisse ce paiement, déduit ses Frais de Mise en relation, puis reverse le solde à l'Avocat. L'Avocat autorise Ulixai à procéder à ces déductions et répartitions.

7.3. **Exigibilité & non-remboursement.** Les Frais de Mise en relation sont dus dès la Mise en relation et sont non remboursables (sauf geste commercial discrétionnaire d'Ulixai en cas d'échec exclusivement imputable à la Plateforme et dans la mesure permise par la loi).

7.4. **Remboursement à l'Utilisateur.** Si un remboursement est accordé à l'Utilisateur, il est imputé sur la part de l'Avocat : Ulixai peut retenir/compenser le montant correspondant sur les versements futurs de l'Avocat, ou en demander le remboursement si aucun versement n'est à venir. Aucun remboursement des Frais de Mise en relation n'est dû, sauf décision discrétionnaire d'Ulixai.

7.5. **Devises & conversion.** Plusieurs devises peuvent être proposées ; des taux/frais de conversion du Prestataire peuvent s'appliquer.

7.6. **Taxes.** L'Avocat demeure responsable de ses obligations fiscales. Ulixai collecte et reverse, lorsque requis, la TVA/équivalent local sur les Frais de Mise en relation.

7.7. **Compensation.** Ulixai peut compenser tout montant que l'Avocat lui doit (au titre d'un remboursement Utilisateur ou autre) avec toute somme due à l'Avocat.

---

## 8. Paiements – KYC/LCB-FT – Sanctions

8.1. Les paiements sont traités par des Prestataires tiers. L'Avocat accepte leurs conditions et processus KYC/LCB-FT.

8.2. Ulixai peut différer, retenir ou annuler des paiements en cas de soupçon de fraude, de non-conformité ou d'injonction légale.

8.3. L'accès peut être restreint dans des territoires soumis à sanctions/embargos si la loi l'exige. L'Avocat déclare ne figurer sur aucune liste de sanctions et respecter les contrôles export applicables.

---

## 9. Données personnelles (cadre global)

9.1. **Rôles.** Pour les données des Utilisateurs reçues aux fins de Mise en relation, Ulixai et l'Avocat agissent chacun en responsable de traitement pour leurs finalités respectives.

9.2. **Bases & finalités.** Exécution du contrat (Mise en relation), intérêts légitimes (sécurité, prévention de la fraude, amélioration), conformité légale (LCB-FT, sanctions), et, le cas échéant, consentement.

9.3. **Transferts internationaux** avec garanties appropriées lorsque requis.

9.4. **Droits & contact.** Exercice des droits via le formulaire de contact de la Plateforme.

9.5. **Sécurité.** Mesures techniques/organisationnelles raisonnables ; notification des violations selon les lois applicables.

9.6. L'Avocat traite les données reçues conformément au droit du Pays d'Intervention et à sa déontologie (secret professionnel).

---

## 10. Propriété intellectuelle

La Plateforme, ses marques, logos, bases de données et contenus sont protégés. Aucun droit n'est cédé à l'Avocat, hormis un droit personnel, non exclusif, non transférable d'accès pendant la durée des CGU. Les contenus fournis par l'Avocat (profil, photo, descriptifs) font l'objet d'une licence mondiale, non exclusive en faveur d'Ulixai pour l'hébergement et l'affichage dans la Plateforme.

---

## 11. Garanties, responsabilité et indemnisation

11.1. Aucune garantie quant aux services juridiques ; Ulixai n'assure ni l'issue, ni la qualité, ni le volume d'affaires.

11.2. Plateforme « en l'état » ; aucune garantie d'accessibilité continue.

11.3. **Limitation de responsabilité** : dans la mesure permise, la responsabilité totale d'Ulixai envers l'Avocat est limitée aux dommages directs et ne peut excéder le total des Frais de Mise en relation perçus par Ulixai au titre de la transaction à l'origine de la réclamation.

11.4. **Exclusions** : aucun dommage indirect/consécutif/spécial/punitif (perte de profits, clientèle, réputation, etc.).

11.5. **Indemnisation** : l'Avocat indemnise et garantit Ulixai (et ses affiliés, dirigeants, employés, agents) contre toute réclamation/préjudice/frais (dont honoraires d'avocat) liés à (i) ses manquements aux CGU/lois, (ii) ses contenus, (iii) ses conseils/omissions.

11.6. Aucune représentation : rien n'emporte mandat, emploi, partenariat ou coentreprise entre Ulixai et l'Avocat.

11.7. **Survie** : les articles 5, 7, 8, 9, 10, 11, 12 et 13 survivent à la résiliation.

---

## 12. Droit applicable – Arbitrage – Juridiction estonienne – Actions collectives

12.1. **Droit matériel** : pour chaque Mise en relation, la relation Ulixai–Avocat est régie par les lois du Pays d'Intervention, sous réserve des règles d'ordre public locales et des normes internationales impératives. **À titre supplétif et pour l'interprétation/validité des présentes CGU ainsi que pour toute question non régie par le droit du Pays d'Intervention, le droit estonien s'applique.**

12.2. **Arbitrage CCI obligatoire** : tout litige Ulixai/Avocat est résolu définitivement selon le Règlement d'Arbitrage de la CCI. **Siège : Tallinn (Estonie)**. **Langue : français**. Le tribunal applique le droit matériel défini à l'art. 12.1. Procédure confidentielle.

12.3. **Renonciation aux actions collectives** : dans la mesure permise, toute action collective/de groupe/représentative est exclue ; réclamations individuelles uniquement.

12.4. **Compétence exclusive des tribunaux d'Estonie** : pour toute demande non arbitrable et pour l'exécution des sentences ou mesures urgentes, les **tribunaux estoniens** (compétents à Tallinn) ont **compétence exclusive**. L'Avocat renonce à toute objection de forum ou de non-convenance.

---

## 13. Divers

13.1. **Cession** : Ulixai peut céder les CGU à une entité de son groupe ou à un successeur ; l'Avocat ne peut céder sans accord écrit d'Ulixai.

13.2. **Intégralité** : les CGU constituent l'accord complet et remplacent tout accord antérieur relatif au même objet.

13.3. **Notifications** : par publication sur la Plateforme, notification in-app ou via le formulaire de contact.

13.4. **Interprétation** : les intitulés sont indicatifs. Aucune règle contra proferentem.

13.5. **Langues** : des traductions peuvent être fournies ; l'anglais prévaut pour l'interprétation.

13.6. **Nullité partielle** : si une stipulation est nulle/inapplicable, le reste demeure en vigueur ; remplacement par une stipulation valide d'effet équivalent lorsque possible.

13.7. **Non-renonciation** : l'absence d'exercice d'un droit n'emporte pas renonciation.

---

## 14. Contact

Pour toute question ou demande légale : **http://localhost:5174/contact**
`;

  const defaultEn = `
# Terms of Use – Lawyers (Global)

**SOS Expat by Ulixai OÜ** (the "**Platform**", "**SOS**", "**we**")

**Version 2.2 – Last updated: 16 June 2025**

---

## 1. Definitions

"Connection" means the technical/operational introduction enabling contact (sharing details and/or initiating a call/message/video). "Country of Intervention" means the jurisdiction primarily targeted by the User's Request at the time of Connection; if multiple, the most closely connected jurisdiction. "Connection Fee" means **EUR 19** (if paid in EUR) or **USD 25** (if paid in USD), subject to future changes and/or local schedules by country/currency with prospective effect.

---

## 2. Purpose, Scope and Acceptance

Ulixai acts **solely as a technical intermediary**. Ulixai does not provide legal advice and is not a party to Lawyer–User engagements. **Click-wrap acceptance** constitutes electronic signature and consent; SOS may keep technical evidence. SOS may update these Terms and/or fee schedules with prospective effect upon posting. Term: open-ended.

---

## 3. Lawyer Status – Independence and Compliance

The Lawyer acts as an independent professional. No employment, mandate, agency, partnership or joint venture is created. The Lawyer is solely responsible for (i) qualifications, admissions and licenses, (ii) professional liability insurance adequate for all intended Countries of Intervention, (iii) local law and professional rules (ethics, advertising/solicitation, conflicts, confidentiality, AML/KYC, tax, consumer protection, etc.). Ulixai does not supervise or assess the Lawyer's advice.

**Professional capacity (B2B).** The Lawyer confirms they act **exclusively for professional purposes**. Consumer protection regimes do not apply to the Ulixai–Lawyer relationship.

---

## 4. Account, Checks and Security

Valid right to practice in at least one jurisdiction; identity/qualification documents; manual review (which may include video and AML/KYC checks). Accuracy and updates are the Lawyer's duty; one account per Lawyer. Keep credentials secure and report compromise immediately.

---

## 5. Use Rules – Conflicts, Confidentiality, No Circumvention

**Conflicts.** Screen for conflicts before any advice; withdraw and inform the User if a conflict exists. **Confidentiality.** Maintain privilege and confidentiality under the Country of Intervention's law. **No circumvention.** Ulixai takes no commission on legal fees. Each new Connection with a new User via the Platform triggers the Connection Fee. Avoiding the Platform to evade fees on a new introduction is prohibited. **Prohibited conduct** includes identity fraud, illegal content, manipulation, collusion/boycott, sanctions/export breaches, or any unlawful activity. **Availability** is "as is"; access may be restricted where required by law.

---

## 6. Lawyer–User Relationship (Off-Platform)

After the Connection, parties may contract **off-Platform**. Ulixai does not set or collect the Lawyer's fees (except via the single-payment mechanism below). The Lawyer provides local fee agreements, handles taxes, and complies with local rules.

---

## 7. Fees, Single Payment and Taxes

**Flat Connection Fee.** EUR 19 or USD 25 per Connection, exclusive of taxes and payment processor charges. Ulixai may change amounts and/or publish local schedules by country/currency with prospective effect.

**Single payment & split.** The User makes **one payment** via the Platform covering (i) the Lawyer's fee (as agreed) and (ii) Ulixai's Connection Fee. Ulixai (or its processor) collects, **deducts** its Fee, then **remits** the remainder to the Lawyer, who **authorizes** such deductions and allocations.

**Due & non-refundable.** The Connection Fee is **earned upon** Connection and **non-refundable** (subject to Ulixai's discretionary goodwill **to the extent permitted by law** in case of Platform-only failure).

**User refund.** If granted, refunds are **borne by the Lawyer's share**: Ulixai may **withhold/offset** against future payouts or request reimbursement if none are due.

**FX & taxes.** Processor FX rates/fees may apply; the Lawyer is responsible for all applicable taxes; Ulixai collects/remits VAT or local equivalent on the Connection Fee where required. **Set-off** authorized.

---

## 8. Payments – AML/KYC – Sanctions

Payments are processed by third-party providers. The Lawyer agrees to their terms and AML/KYC procedures. Ulixai may delay, withhold or cancel payouts in case of suspected fraud, non-compliance, or legal order. Access may be restricted in sanctioned territories where required by law. The Lawyer warrants it is not on sanctions lists and complies with export controls.

---

## 9. Data Protection (Global Framework)

**Roles.** For User data received for Connection, **Ulixai and the Lawyer** each act as an **independent controller** for their own purposes. **Legal bases & purposes** include contract performance (Connection), legitimate interests (security, fraud prevention, service improvement), legal compliance (AML, sanctions), and consent where applicable. **International transfers** may occur with appropriate safeguards where required. **Rights & contact** via the Platform contact form. **Security** measures apply; data breaches are notified as required. The Lawyer processes data under the Country of Intervention's law and professional secrecy.

---

## 10. Intellectual Property

The Platform, trademarks, logos, databases and contents are protected. No rights are assigned to the Lawyer beyond a personal, non-exclusive, non-transferable right to access during these Terms. Lawyer-provided content (profile, photo, descriptions) is licensed to Ulixai on a **worldwide, non-exclusive** basis for hosting and display on the Platform.

---

## 11. Warranties, Liability and Indemnity

No warranty for legal outcomes, quality, volume or Users' reliability. Platform is provided "as is." **Liability cap**: to the fullest extent permitted, Ulixai's total liability to the Lawyer is limited to **direct damages** and **shall not exceed** the total **Connection Fees** received by Ulixai for the **transaction** giving rise to the claim. No indirect/consequential/special/punitive damages. **Indemnity**: the Lawyer shall indemnify and hold harmless Ulixai (and affiliates, officers, employees, agents) from claims/costs (including reasonable attorneys' fees) arising from (i) breach of these Terms/laws, (ii) Lawyer content, (iii) Lawyer services or omissions. No agency/employment/partnership/JV is created. **Survival**: Sections 5, 7, 8, 9, 10, 11, 12 and 13 survive termination.

---

## 12. Governing Law – ICC Arbitration – Estonian Courts – Class Actions

**Substantive law:** for each Connection, the **laws of the Country of Intervention** govern the Ulixai–Lawyer relationship, subject to mandatory local rules and peremptory international norms.

**Mandatory ICC arbitration** for any Ulixai–Lawyer dispute. **Seat: Tallinn (Estonia). Language: French.** Tribunal applies the **substantive law** defined above. Proceedings are **confidential**.

**Class/collective actions are waived** to the extent permitted by law.

**Exclusive jurisdiction of Estonian courts** (Tallinn) for **non-arbitrable** claims, enforcement of awards and urgent measures; the Lawyer waives objections to venue/forum non conveniens.

---

## 13. Miscellaneous

**Assignment**: Ulixai may assign these Terms to a group entity or successor; the Lawyer may not assign without Ulixai's consent. **Entire Agreement**: these Terms supersede prior understandings. **Notices**: by posting on the Platform, in-app, or via the contact form. **Interpretation**: headings are for convenience; no **contra proferentem**. **Languages**: translations may be provided; **French prevails** for interpretation. **Severability**: invalid terms are replaced by valid ones of equivalent effect. **No waiver**: failure to enforce is not a waiver.

---

## 14. Contact

**Contact form (support & legal requests)**: **http://localhost:5174/contact**
`;

  const defaultEs = `
# Condiciones de Uso – Abogados (Global)


**SOS Expat por Ulixai OÜ** (la "**Plataforma**", "**SOS**", "**nosotros**")


**Versión 2.2 – Última actualización: 16 de junio de 2025**


---


## 1. Definiciones


"Conexión" significa la introducción técnica/operativa que permite el contacto (compartir detalles y/o iniciar una llamada/mensaje/vídeo). "País de Intervención" significa la jurisdicción principalmente dirigida por la Solicitud del Usuario en el momento de la Conexión; si hay varias, la más estrechamente conectada. "Tarifa de Conexión" significa **EUR 19** (si se paga en EUR) o **USD 25** (si se paga en USD), sujeto a cambios futuros y/o calendarios locales por país/moneda con efecto prospectivo.


---


## 2. Propósito, Alcance y Aceptación


Ulixai actúa **únicamente como intermediario técnico**. Ulixai no proporciona asesoría legal y no es parte en los compromisos Abogado-Usuario. **La aceptación click-wrap** constituye firma electrónica y consentimiento; SOS puede conservar evidencia técnica. SOS puede actualizar estos Términos y/o tarifas con efecto prospectivo al publicar. Plazo: indefinido.


---


## 3. Estado del Abogado – Independencia y Cumplimiento


El Abogado actúa como profesional independiente. No se crea empleo, mandato, agencia, asociación o empresa conjunta. El Abogado es exclusivamente responsable de (i) calificaciones, admisiones y licencias, (ii) seguro de responsabilidad profesional adecuado para todos los Países de Intervención previstos, (iii) ley local y reglas profesionales (ética, publicidad/solicitud, conflictos, confidencialidad, AML/KYC, impuestos, protección del consumidor, etc.). Ulixai no supervisa ni evalúa el asesoramiento del Abogado.


**Capacidad profesional (B2B).** El Abogado confirma que actúa **exclusivamente con fines profesionales**. Los regímenes de protección del consumidor no se aplican a la relación Ulixai-Abogado.


---


## 4. Cuenta, Verificaciones y Seguridad


Derecho válido a ejercer en al menos una jurisdicción; documentos de identidad/calificación; revisión manual (que puede incluir verificaciones de vídeo y AML/KYC). La precisión y actualizaciones son obligación del Abogado; una cuenta por Abogado. Mantenga las credenciales seguras e informe inmediatamente de cualquier compromiso.


---


## 5. Reglas de Uso – Conflictos, Confidencialidad, Sin Evasión


**Conflictos.** Cribado de conflictos antes de cualquier asesoramiento; retirarse e informar al Usuario si existe un conflicto. **Confidencialidad.** Mantener el privilegio y confidencialidad bajo la ley del País de Intervención. **Sin evasión.** Ulixai no toma comisión sobre honorarios legales. Cada nueva Conexión con un nuevo Usuario a través de la Plataforma genera la Tarifa de Conexión. Evitar la Plataforma para evadir tarifas en una nueva introducción está prohibido. **Conducta prohibida** incluye fraude de identidad, contenido ilegal, manipulación, colusión/boicot, incumplimiento de sanciones/controles de exportación, o cualquier actividad ilegal. **Disponibilidad** es "tal cual"; el acceso puede ser restringido donde sea requerido por ley.


---


## 6. Relación Abogado-Usuario (Fuera de la Plataforma)


Después de la Conexión, las partes pueden contratar **fuera de la Plataforma**. Ulixai no fija ni cobra los honorarios del Abogado (excepto a través del mecanismo de pago único a continuación). El Abogado proporciona acuerdos de tarifas locales, maneja impuestos y cumple con reglas locales.


---


## 7. Honorarios, Pago Único e Impuestos


**Tarifa Plana de Conexión.** EUR 19 o USD 25 por Conexión, exclusive de impuestos y cargos del procesador de pagos. Ulixai puede cambiar cantidades y/o publicar calendarios locales por país/moneda con efecto prospectivo.


**Pago único y división.** El Usuario realiza **un pago** a través de la Plataforma cubriendo (i) el honorario del Abogado (según lo acordado) y (ii) la Tarifa de Conexión de Ulixai. Ulixai (o su procesador) cobra, **deduce** su Tarifa, luego **remite** el resto al Abogado, quien **autoriza** tales deducciones y asignaciones.


**Debido y no reembolsable.** La Tarifa de Conexión se **gana en** la Conexión y es **no reembolsable** (sujeto a **buena voluntad discrecional** de Ulixai **en la medida permitida por ley** en caso de falla solo de la Plataforma).


**Reembolso del Usuario.** Si se otorga, los reembolsos son **asumidos por la parte del Abogado**: Ulixai puede **retener/compensar** contra pagos futuros o solicitar reembolso si no hay ninguno.


**TC e impuestos.** Las tarifas/cuotas TC del procesador pueden aplicarse; el Abogado es responsable de todos los impuestos aplicables; Ulixai cobra/remite IVA o equivalente local en la Tarifa de Conexión donde sea requerido. **Compensación** autorizada.


---


## 8. Pagos – AML/KYC – Sanciones


Los pagos se procesan por proveedores terceros. El Abogado acepta sus términos y procedimientos AML/KYC. Ulixai puede retrasar, retener o cancelar pagos en caso de fraude sospechoso, incumplimiento u orden legal. El acceso puede ser restringido en territorios sancionados donde sea requerido por ley. El Abogado garantiza que no está en listas de sanciones y cumple con controles de exportación.


---


## 9. Protección de Datos (Marco Global)


**Funciones.** Para datos de Usuario recibidos para Conexión, **Ulixai y el Abogado** actúan cada uno como **controlador independiente** para sus propios fines. **Bases legales y propósitos** incluyen ejecución de contrato (Conexión), intereses legítimos (seguridad, prevención de fraude, mejora de servicio), cumplimiento legal (AML, sanciones), y consentimiento donde sea aplicable. **Transferencias internacionales** pueden ocurrir con garantías apropiadas donde sea requerido. **Derechos y contacto** a través del formulario de contacto de la Plataforma. **Medidas de seguridad** se aplican; violaciones de datos se notifican según sea requerido. El Abogado procesa datos bajo la ley del País de Intervención y secreto profesional.


---


## 10. Propiedad Intelectual


La Plataforma, marcas, logos, bases de datos y contenidos están protegidos. No se ceden derechos al Abogado más allá de un derecho personal, no exclusivo, no transferible para acceder durante estos Términos. El contenido proporcionado por el Abogado (perfil, foto, descripciones) se licencia a Ulixai en base **mundial, no exclusiva** para hosting y visualización en la Plataforma.


---


## 11. Garantías, Responsabilidad e Indemnización


Sin garantía de resultados legales, calidad, volumen o fiabilidad de Usuarios. La Plataforma se proporciona "tal cual". **Límite de responsabilidad**: en la máxima medida permitida, la responsabilidad total de Ulixai ante el Abogado se limita a **daños directos** y **no excederá** los **Honorarios de Conexión** totales recibidos por Ulixai para la **transacción** que da lugar al reclamo. Sin daños indirectos/consecuentes/especiales/punitivos. **Indemnización**: el Abogado indemnizará y eximirá de responsabilidad a Ulixai (y afiliados, funcionarios, empleados, agentes) de reclamos/costos (incluyendo honorarios de abogados razonables) que surjan de (i) incumplimiento de estos Términos/leyes, (ii) contenido del Abogado, (iii) servicios u omisiones del Abogado. No se crea agencia/empleo/asociación/EJ. **Sobrevivencia**: Secciones 5, 7, 8, 9, 10, 11, 12 y 13 sobreviven a la terminación.


---


## 12. Ley Aplicable – Arbitraje ICC – Tribunales Estonios – Acciones Colectivas


**Ley sustantiva:** para cada Conexión, las **leyes del País de Intervención** rigen la relación Ulixai-Abogado, sujeto a reglas locales obligatorias y normas internacionales imperativas.


**Arbitraje ICC obligatorio** para cualquier disputa Ulixai-Abogado. **Sede: Tallín (Estonia). Idioma: francés.** El Tribunal aplica la **ley sustantiva** definida arriba. Los procedimientos son **confidenciales**.


**Las acciones colectivas/conjuntas son renunciadas** en la medida permitida por ley.


**Jurisdicción exclusiva de tribunales estonios** (Tallín) para reclamos **no arbitrables**, ejecución de laudos y medidas urgentes; el Abogado renuncia a objeciones de competencia/forum non conveniens.


---


## 13. Diversos


**Asignación**: Ulixai puede ceder estos Términos a una entidad del grupo o sucesor; el Abogado no puede asignar sin consentimiento de Ulixai. **Acuerdo completo**: estos Términos anulan entendimientos previos. **Avisos**: mediante publicación en la Plataforma, en la app, o a través del formulario de contacto. **Interpretación**: los títulos son por conveniencia; sin **contra proferentem**. **Idiomas**: las traducciones pueden proporcionarse; **el francés prevalece** para interpretación. **Divisibilidad**: términos inválidos se reemplazan por válidos de efecto equivalente. **Sin renuncia**: el incumplimiento de aplicación no es una renuncia.


---


## 14. Contacto


**Formulario de contacto (soporte y solicitudes legales)**: [**http://localhost:5174/contact**](http://localhost:5174/contact)
`;

  const defaultRu = `
# Условия использования – Адвокаты (Глобальные)


**SOS Expat от Ulixai OÜ** (the "**Платформа**", "**SOS**", "**мы**")


**Версия 2.2 – Последнее обновление: 16 июня 2025**


---


## 1. Определения


"Соединение" означает техническое/операционное знакомство, позволяющее установить контакт (обмен контактной информацией и/или инициирование звонка/сообщения/видео). "Страна вмешательства" означает юрисдикцию, в первую очередь указанную в запросе пользователя на момент соединения; если их несколько, то наиболее тесно связанная юрисдикция. "Плата за соединение" означает **EUR 19** (если платеж производится в EUR) или **USD 25** (если платеж производится в USD), с учетом будущих изменений и/или местных графиков по странам/валютам с перспективным эффектом.


---


## 2. Цель, область применения и принятие


Ulixai действует **исключительно как технический посредник**. Ulixai не предоставляет правовые консультации и не является стороной в договорах между адвокатом и пользователем. **Принятие click-wrap** составляет электронную подпись и согласие; SOS может сохранять техническое свидетельство. SOS может обновлять эти Условия и/или графики сборов с перспективным эффектом при публикации. Срок: открытый.


---


## 3. Статус адвоката – Независимость и соответствие


Адвокат действует как независимый профессионал. Не создаются трудовые отношения, мандат, агентство, партнерство или совместное предприятие. Адвокат несет исключительную ответственность за (i) квалификацию, допуск и лицензии, (ii) профессиональное страхование ответственности, адекватное для всех предусмотренных стран вмешательства, (iii) местное законодательство и профессиональные правила (этика, реклама/привлечение, конфликты, конфиденциальность, AML/KYC, налоги, защита прав потребителей и т. д.). Ulixai не контролирует и не оценивает консультации адвоката.


**Профессиональная деятельность (B2B).** Адвокат подтверждает, что действует **исключительно в профессиональных целях**. Режимы защиты прав потребителей не применяются к отношениям между Ulixai и адвокатом.


---


## 4. Аккаунт, проверки и безопасность


Действительное право на практику в по крайней мере одной юрисдикции; документы удостоверения личности/квалификации; ручная проверка (которая может включать проверки по видео и AML/KYC). Точность и обновления являются обязанностью адвоката; один аккаунт на адвоката. Храните учетные данные в безопасности и немедленно сообщайте о взломе.


---


## 5. Правила использования – Конфликты, конфиденциальность, без обхода


**Конфликты.** Проверка конфликтов перед любыми консультациями; отказ и информирование пользователя при наличии конфликта. **Конфиденциальность.** Сохранение привилегии и конфиденциальности в соответствии с законодательством страны вмешательства. **Без обхода.** Ulixai не берет комиссию с гонораров адвокатов. Каждое новое соединение с новым пользователем через платформу влечет плату за соединение. Избежание платформы для уклонения от сборов при новом знакомстве запрещено. **Запрещенное поведение** включает подделку личности, незаконный контент, манипуляцию, сговор/бойкот, нарушение санкций/экспортного контроля или любую незаконную деятельность. **Доступность** предоставляется "в том виде, в котором она есть"; доступ может быть ограничен, если это требуется по закону.


---


## 6. Отношения адвокат-пользователь (вне платформы)


После соединения стороны могут заключить договор **вне платформы**. Ulixai не устанавливает и не собирает гонорары адвоката (кроме как через механизм единовременного платежа ниже). Адвокат предоставляет местные соглашения о гонорарах, обрабатывает налоги и соблюдает местные правила.


---


## 7. Гонорары, единовременный платеж и налоги


**Фиксированная плата за соединение.** EUR 19 или USD 25 за соединение, без учета налогов и платежей процессора платежей. Ulixai может изменять суммы и/или публиковать местные графики по странам/валютам с перспективным эффектом.


**Единовременный платеж и разделение.** Пользователь производит **один платеж** через платформу, охватывающий (i) гонорар адвоката (согласно договоренности) и (ii) плату за соединение Ulixai. Ulixai (или его процессор) собирает, **вычитает** свой сбор, затем **перечисляет** остаток адвокату, который **авторизует** такие вычеты и распределения.


**Подлежит оплате и не подлежит возврату.** Плата за соединение **зарабатывается при** соединении и **не подлежит возврату** (с учетом дискреционной **доброй воли** Ulixai **в допустимой законом мере** в случае отказа только платформы).


**Возврат пользователю.** Если утвержден, возвраты **несет доля адвоката**: Ulixai может **удержать/компенсировать** против будущих выплат или запросить возмещение, если они не причитаются.


**Обмен валюты и налоги.** Могут применяться ставки обмена валюты/сборы процессора; адвокат несет ответственность за все применимые налоги; Ulixai собирает/перечисляет НДС или местный эквивалент за плату за соединение, где требуется. **Компенсация** авторизирована.


---


## 8. Платежи – AML/KYC – Санкции


Платежи обрабатываются поставщиками третьих сторон. Адвокат соглашается с их условиями и процедурами AML/KYC. Ulixai может отложить, удержать или отменить выплаты в случае подозрения на мошенничество, несоответствие или судебное решение. Доступ может быть ограничен на санкционированных территориях, где это требуется по закону. Адвокат гарантирует, что он не находится в списках санкций и соблюдает экспортный контроль.


---


## 9. Защита данных (глобальная база)


**Роли.** Для данных пользователя, полученных для соединения, **Ulixai и адвокат** каждый действуют как **независимый контролер** для своих собственных целей. **Правовые основы и цели** включают выполнение договора (соединение), законные интересы (безопасность, предотвращение мошенничества, улучшение услуги), соответствие закону (AML, санкции) и согласие, где применимо. **Международные передачи** могут происходить с надлежащими гарантиями, где требуется. **Права и контакт** через форму контакта платформы. **Меры безопасности** применяются; утечки данных уведомляются согласно требованиям. Адвокат обрабатывает данные в соответствии с законодательством страны вмешательства и профессиональной тайной.


---


## 10. Интеллектуальная собственность


Платформа, товарные знаки, логотипы, базы данных и содержание защищены. Адвокату не предоставляются никакие права, кроме личного, неисключительного, неотчуждаемого права на доступ в течение этих условий. Содержание, предоставленное адвокатом (профиль, фото, описания), лицензируется Ulixai на **мировой, неисключительной** основе для размещения и отображения на платформе.


---


## 11. Гарантии, ответственность и возмещение убытков


Нет гарантий в отношении юридических результатов, качества, объема или надежности пользователей. Платформа предоставляется "в том виде, в котором она есть". **Лимит ответственности**: в максимально допустимой законом степени общая ответственность Ulixai перед адвокатом ограничена **прямыми убытками** и **не превышает** всего **сборов за соединение**, полученные Ulixai за **операцию**, дающую основание для иска. Нет косвенных/побочных/специальных/штрафных убытков. **Возмещение убытков**: адвокат возмещает убытки и освобождает Ulixai (и аффилированных лиц, должностных лиц, работников, агентов) от исков/расходов (включая разумные гонорары адвокатов), вытекающих из (i) нарушения этих условий/законов, (ii) содержания адвоката, (iii) услуг или упущений адвоката. Не создаются отношения агентства/трудовые отношения/партнерство/СП. **Выживание**: разделы 5, 7, 8, 9, 10, 11, 12 и 13 выживают при расторжении.


---


## 12. Применимое право – Арбитраж ICC – Эстонские суды – Коллективные иски


**Материальное право:** для каждого соединения **законы страны вмешательства** регулируют отношения Ulixai-адвокат с учетом обязательных местных правил и неотъемлемых международных норм.


**Обязательный арбитраж ICC** для любого спора между Ulixai и адвокатом. **Место проведения: Таллин (Эстония). Язык: французский.** Арбитраж применяет **материальное право**, определенное выше. Разбирательство **конфиденциально**.


**Коллективные/групповые иски отказываются** в допустимой законом мере.


**Исключительная юрисдикция эстонских судов** (Таллин) для **не подлежащих арбитражу** исков, принудительного исполнения решений и срочных мер; адвокат отказывается от возражений по поводу подсудности/форум non conveniens.


---


## 13. Прочее


**Уступка**: Ulixai может уступить эти условия групповой компании или правопреемнику; адвокат не может уступить без согласия Ulixai. **Полнота соглашения**: эти условия заменяют предыдущие договоренности. **Уведомления**: путем публикации на платформе, в приложении или через форму контакта. **Интерпретация**: заголовки приводятся для удобства; без **contra proferentem**. **Языки**: переводы могут предоставляться; **французский преобладает** при интерпретации. **Делимость**: неверные условия заменяются действительными условиями эквивалентного эффекта. **Без отказа**: неиспользование права не является отказом.


---


## 14. Контакт


**Форма контакта (поддержка и юридические запросы)**: [**http://localhost:5174/contact**](http://localhost:5174/contact)
`;

  const defaultDe = `
# Nutzungsbedingungen – Anwälte (Global)


**SOS Expat von Ulixai OÜ** (die "**Plattform**", "**SOS**", "**wir**")


**Version 2.2 – Letzte Aktualisierung: 16. Juni 2025**


---


## 1. Definitionen


"Verbindung" bezeichnet die technische/operationale Einleitung, die einen Kontakt ermöglicht (Austausch von Details und/oder Einleitung eines Anrufs/einer Nachricht/eines Videos). "Interventionsland" bezeichnet die Gerichtsbarkeit, die von der Benutzeranfrage zum Zeitpunkt der Verbindung hauptsächlich anvisiert wird; bei mehreren die am engsten verbundene Gerichtsbarkeit. "Verbindungsgebühr" bedeutet **EUR 19** (wenn in EUR bezahlt) oder **USD 25** (wenn in USD bezahlt), vorbehaltlich künftiger Änderungen und/oder lokaler Gebührenordnungen pro Land/Währung mit prospektiver Wirkung.


---


## 2. Zweck, Geltungsbereich und Annahme


Ulixai fungiert **ausschließlich als technischer Vermittler**. Ulixai erbringt keine Rechtsberatung und ist nicht Partei von Anwalt-Benutzer-Engagements. **Click-wrap-Annahme** stellt eine elektronische Signatur und Zustimmung dar; SOS kann technische Nachweise aufbewahren. SOS kann diese Bedingungen und/oder Gebührenordnungen mit prospektiver Wirkung bei Veröffentlichung aktualisieren. Laufzeit: offene Laufzeit.


---


## 3. Anwaltsstatus – Unabhängigkeit und Compliance


Der Anwalt handelt als unabhängiger Fachmann. Es werden keine Arbeitsverhältnisse, Mandat, Agentur, Partnerschaft oder Joint Venture begründet. Der Anwalt trägt allein die Verantwortung für (i) Qualifikationen, Zulassungen und Lizenzen, (ii) angemessene Berufshaftpflichtversicherung für alle beabsichtigten Interventionsländer, (iii) Landesrecht und Berufsregeln (Ethik, Werbung/Akquisition, Konflikte, Geheimhaltung, AML/KYC, Steuern, Verbraucherschutz usw.). Ulixai überwacht oder bewertet die Beratung des Anwalts nicht.


**Berufliche Tätigkeit (B2B).** Der Anwalt bestätigt, dass er **ausschließlich zu beruflichen Zwecken** handelt. Verbraucherschutzbestimmungen gelten nicht für das Ulixai-Anwalt-Verhältnis.


---


## 4. Konto, Überprüfungen und Sicherheit


Gültiges Recht zur Ausübung in mindestens einer Gerichtsbarkeit; Identitäts-/Qualifikationsdokumente; manuelle Überprüfung (die Video- und AML/KYC-Überprüfungen umfassen kann). Genauigkeit und Aktualisierungen sind Pflicht des Anwalts; ein Konto pro Anwalt. Halten Sie Anmeldedaten sicher und melden Sie Kompromisse sofort.


---


## 5. Nutzungsregeln – Konflikte, Geheimhaltung, kein Umgehen


**Konflikte.** Überprüfen Sie Konflikte vor jeder Beratung; treten Sie zurück und informieren Sie den Benutzer, wenn ein Konflikt besteht. **Geheimhaltung.** Bewahren Sie Vertraulichkeit und Geheimnisse gemäß Recht des Interventionslandes. **Kein Umgehen.** Ulixai nimmt keine Provisionen auf Anwaltsgebühren. Jede neue Verbindung mit einem neuen Benutzer über die Plattform zieht die Verbindungsgebühr nach sich. Das Vermeiden der Plattform zur Gebührenvermeidung bei einer neuen Einführung ist verboten. **Verbotenes Verhalten** umfasst Identitätsdelikte, illegale Inhalte, Manipulation, Absprache/Boykott, Verstöße gegen Sanktionen/Exportkontrollen oder andere rechtswidrige Aktivitäten. **Verfügbarkeit** liegt im Bestand "wie besehen"; der Zugriff kann wo erforderlich eingeschränkt werden.


---


## 6. Anwalt-Benutzer-Beziehung (außerhalb der Plattform)


Nach der Verbindung können die Parteien **außerhalb der Plattform** vertraglich tätig werden. Ulixai legt die Anwaltsgebühren nicht fest und nimmt sie nicht ein (außer über den Einzelzahlungsmechanismus unten). Der Anwalt stellt lokale Gebührenvereinbarungen bereit, bearbeitet Steuern und beachtet lokale Regeln.


---


## 7. Gebühren, Einzelzahlung und Steuern


**Pauschalgebühr für Verbindung.** EUR 19 oder USD 25 pro Verbindung, exklusive Steuern und Zahlungsabwicklungsgebühren. Ulixai kann Beträge ändern und/oder lokale Gebührenordnungen pro Land/Währung mit prospektiver Wirkung veröffentlichen.


**Einzelzahlung und Aufteilung.** Der Benutzer leistet **eine Zahlung** über die Plattform, die abdeckt (i) die Anwaltsgebühr (wie vereinbart) und (ii) Ulixais Verbindungsgebühr. Ulixai (oder sein Verarbeiter) zieht ein, **zieht** seine Gebühr ab, dann **überweist** den Rest an den Anwalt, der solche **Abzüge und Zuordnungen genehmigt**.


**Fällig und nicht rückzahlbar.** Die Verbindungsgebühr wird **bei** Verbindung **verdient** und ist **nicht rückzahlbar** (vorbehaltlich **diskretionärer Großzügigkeit** von Ulixai **in dem von Gesetz erlaubten Umfang** im Falle eines ausschließlich plattformgebundenen Ausfalls).


**Rückerstattung des Benutzers.** Wenn gewährt, werden Rückerstattungen **vom Anwaltsanteil getragen**: Ulixai kann **zurückhalten/verrechnen** gegen zukünftige Auszahlungen oder Rückerstattung anfordern, wenn keine fällig sind.


**Wechselkurs & Steuern.** Wechselkurse/Gebühren des Verarbeiters können anfallen; der Anwalt ist verantwortlich für alle anwendbaren Steuern; Ulixai erhebt/überweist MwSt. oder lokales Äquivalent auf die Verbindungsgebühr, wo erforderlich. **Verrechnung** genehmigt.


---


## 8. Zahlungen – AML/KYC – Sanktionen


Zahlungen werden von Drittanbietern verarbeitet. Der Anwalt akzeptiert deren Bedingungen und AML/KYC-Verfahren. Ulixai kann Auszahlungen im Falle des Verdachts auf Betrug, Nichtkonformität oder behördliche Anordnung verzögern, einbehalten oder stornieren. Der Zugang kann in sanktionierten Gebieten, wo von Gesetz erforderlich, eingeschränkt werden. Der Anwalt erklärt, dass er nicht auf Sanktionslisten steht und Exportkontrollen einhält.


---


## 9. Datenschutz (globaler Rahmen)


**Rollen.** Für Benutzerdaten, die für Verbindung empfangen wurden, handeln **Ulixai und der Anwalt** jeweils als **unabhängige Verantwortliche** für ihre eigenen Zwecke. **Rechtliche Grundlagen & Zwecke** umfassen Vertragserfüllung (Verbindung), legitime Interessen (Sicherheit, Betrugsprävention, Dienstverbesserung), Rechtseinhaltung (AML, Sanktionen) und Zustimmung, sofern anwendbar. **Internationale Übermittlungen** können mit angemessenen Garantien erfolgen, wenn erforderlich. **Rechte & Kontakt** über das Kontaktformular der Plattform. **Sicherheitsmaßnahmen** gelten; Datenverletzungen werden wie erforderlich benachrichtigt. Der Anwalt verarbeitet Daten gemäß Landesrecht des Interventionslandes und Berufsgeheimnis.


---


## 10. Geistiges Eigentum


Die Plattform, Marken, Logos, Datenbanken und Inhalte sind geschützt. Dem Anwalt werden keine Rechte gewährt außer einem persönlichen, nicht-exklusiven, nicht-übertragbaren Recht zum Zugriff während dieser Bedingungen. Vom Anwalt bereitgestellte Inhalte (Profil, Foto, Beschreibungen) werden an Ulixai auf **weltweiter, nicht-exklusiver** Grundlage für Hosting und Anzeige auf der Plattform lizenziert.


---


## 11. Gewährleistungen, Haftung und Schadensersatz


Keine Gewährleistung für Rechtsergebnisse, Qualität, Volumen oder Benutzerzuverlässigkeit. Die Plattform wird "wie besehen" bereitgestellt. **Haftungsbegrenzung**: Im höchstmöglichen Umfang ist die Gesamthaftung von Ulixai gegenüber dem Anwalt auf **direkte Schäden** begrenzt und darf nicht die gesamten **Verbindungsgebühren** übersteigen, die Ulixai für die **Transaktion** erhielt, die zum Anspruch führte. Keine indirekten/Folge-/besonderen/Strafschadensersätze. **Schadloshaltung**: Der Anwalt hält Ulixai (und verbundene Unternehmen, Beamte, Mitarbeiter, Vertreter) schadlos von Ansprüchen/Kosten (einschließlich angemessener Anwaltsgebühren), die sich ergeben aus (i) Verstoß gegen diese Bedingungen/Gesetze, (ii) Inhalte des Anwalts, (iii) Leistungen oder Unterlassungen des Anwalts. Es werden keine Agentur-/Arbeitsverhältnisse/Partnerschaften/JVs begründet. **Fortbestand**: Die Abschnitte 5, 7, 8, 9, 10, 11, 12 und 13 bleiben nach Beendigung bestehen.


---


## 12. Anwendbares Recht – ICC-Schiedsverfahren – Estnische Gerichte – Sammelklagen


**Materielles Recht:** für jede Verbindung, **Gesetze des Interventionslandes** regeln das Ulixai-Anwalt-Verhältnis, vorbehaltlich zwingender lokaler Regeln und unabdingbarer internationaler Normen.


**Zwingendes ICC-Schiedsverfahren** für jeden Ulixai-Anwalt-Streit. **Sitz: Tallinn (Estland). Sprache: Französisch.** Das Schiedsgericht wendet das oben definierte **materielle Recht** an. Verfahren sind **vertraulich**.


**Sammelklagen werden verzichtet** im zulässigen Umfang.


**Ausschließliche Gerichtsbarkeit estnischer Gerichte** (Tallinn) für **nicht-schiedsbare** Ansprüche, Durchsetzung von Schiedssprüchen und dringende Maßnahmen; der Anwalt verzichtet auf Einwände zu Gerichtsstand/forum non conveniens.


---


## 13. Sonstiges


**Abtretung**: Ulixai kann diese Bedingungen an ein Konzernunternehmen oder einen Nachfolger abtreten; der Anwalt kann ohne Zustimmung von Ulixai nicht abtreten. **Gesamter Vertrag**: Diese Bedingungen ersetzen vorherige Absprachen. **Mitteilungen**: durch Veröffentlichung auf der Plattform, in der App oder über das Kontaktformular. **Auslegung**: Überschriften dienen dem Komfort; kein **contra proferentem**. **Sprachen**: Übersetzungen können bereitgestellt werden; **Französisch kommt Vorrang** bei der Auslegung zu. **Salvatorische Klausel**: Ungültige Bedingungen werden durch gültige mit gleichwertiger Wirkung ersetzt. **Keine Verzichtserklärung**: Nichtdurchsetzung eines Rechts ist keine Verzichtserklärung.


---


## 14. Kontakt


**Kontaktformular (Unterstützung & Rechtsfragen)**: [**http://localhost:5174/contact**](http://localhost:5174/contact)
`;

  const defaultHi = `
# उपयोग की शर्तें – वकील (वैश्विक)


**SOS Expat द्वारा Ulixai OÜ** (the "**प्लेटफॉर्म**", "**SOS**", "**हम**")


**संस्करण 2.2 – अंतिम अपडेट: 16 जून 2025**


---


## 1. परिभाषाएं


"कनेक्शन" से तात्पर्य तकनीकी/परिचालन परिचय से है जो संपर्क को सक्षम बनाता है (विवरण साझा करना और/या कॉल/संदेश/वीडियो शुरू करना)। "हस्तक्षेप का देश" उस न्यायक्षेत्र को दर्शाता है जिसे कनेक्शन के समय उपयोगकर्ता के अनुरोध द्वारा मुख्य रूप से लक्षित किया जाता है; यदि कई हैं, तो सबसे निकटता से जुड़ा हुआ न्यायक्षेत्र। "कनेक्शन शुल्क" का अर्थ है **EUR 19** (यदि EUR में भुगतान किया जाए) या **USD 25** (यदि USD में भुगतान किया जाए), भविष्य के परिवर्तनों और/या देश/मुद्रा के आधार पर स्थानीय शेड्यूल के अधीन।


---


## 2. उद्देश्य, दायरा और स्वीकृति


Ulixai **केवल तकनीकी मध्यस्थ** के रूप में कार्य करता है। Ulixai कानूनी सलाह प्रदान नहीं करता है और वकील-उपयोगकर्ता समझौतों का पक्ष नहीं है। **Click-wrap स्वीकृति** इलेक्ट्रॉनिक हस्ताक्षर और सहमति का गठन करती है; SOS तकनीकी साक्ष्य रख सकता है। SOS इन शर्तों और/या शुल्क शेड्यूल को प्रकाशन पर भविष्य के प्रभाव के साथ अपडेट कर सकता है। अवधि: खुली-खुली।


---


## 3. वकील की स्थिति – स्वतंत्रता और अनुपालन


वकील स्वतंत्र पेशेवार के रूप में कार्य करता है। कोई रोजगार, जनादेश, एजेंसी, साझेदारी या संयुक्त उद्यम नहीं बनाई जाती है। वकील (i) योग्यताएं, प्रवेश और लाइसेंस, (ii) सभी इच्छित हस्तक्षेप देशों के लिए पर्याप्त व्यावसायिक दायित्व बीमा, (iii) स्थानीय कानून और व्यावसायिक नियम (नैतिकता, विज्ञापन/प्रस्तावना, संघर्ष, गोपनीयता, AML/KYC, कर, उपभोक्ता संरक्षण, आदि) के लिए एकमात्र जिम्मेदार है। Ulixai वकील की सलाह की निगरानी या मूल्यांकन नहीं करता है।


**पेशेवर क्षमता (B2B).** वकील पुष्टि करता है कि वह **एक्सक्लूसिव रूप से व्यावसायिक उद्देश्यों के लिए** कार्य करता है। उपभोक्ता संरक्षण व्यवस्था Ulixai-वकील संबंध पर लागू नहीं होती है।


---


## 4. खाता, सत्यापन और सुरक्षा


कम से कम एक न्यायक्षेत्र में अभ्यास करने का वैध अधिकार; पहचान/योग्यता दस्तावेज; मैनुअल समीक्षा (जिसमें वीडियो और AML/KYC जांच शामिल हो सकती है)। सटीकता और अपडेट वकील की जिम्मेदारी हैं; प्रति वकील एक खाता। क्रेडेंशियल सुरक्षित रखें और समझौते की तुरंत रिपोर्ट करें।


---


## 5. उपयोग के नियम – संघर्ष, गोपनीयता, कोई बायपास नहीं


**संघर्ष।** किसी भी सलाह से पहले संघर्षों की जांच करें; सेवानिवृत्ति लें और यदि कोई संघर्ष मौजूद है तो उपयोगकर्ता को सूचित करें। **गोपनीयता।** हस्तक्षेप के देश के कानून के अनुसार विशेषाधिकार और गोपनीयता बनाए रखें। **कोई बायपास नहीं।** Ulixai कानूनी शुल्क पर कमीशन नहीं लेता है। प्लेटफॉर्म के माध्यम से एक नए उपयोगकर्ता के साथ प्रत्येक नया कनेक्शन कनेक्शन शुल्क लगाता है। प्लेटफॉर्म से बचना नई शुरुआत में शुल्क से बचने के लिए निषिद्ध है। **निषिद्ध आचरण** में पहचान धोखाधड़ी, अवैध सामग्री, हेराफेरी, मिलीभगत/बहिष्कार, प्रतिबंध/निर्यात नियंत्रण उल्लंघन, या किसी भी गैरकानूनी गतिविधि शामिल है। **उपलब्धता** "जैसी है" प्रदान की जाती है; जहां कानून द्वारा आवश्यक हो, वहां पहुंच प्रतिबंधित की जा सकती है।


---


## 6. वकील-उपयोगकर्ता संबंध (प्लेटफॉर्म के बाहर)


कनेक्शन के बाद, पक्ष **प्लेटफॉर्म के बाहर** अनुबंध कर सकते हैं। Ulixai वकील के शुल्क निर्धारित या एकत्र नहीं करता है (नीचे एकल-भुगतान तंत्र के माध्यम से छोड़कर)। वकील स्थानीय शुल्क समझौते प्रदान करता है, कर को संभालता है और स्थानीय नियमों का अनुपालन करता है।


---


## 7. शुल्क, एकल भुगतान और कर


**कनेक्शन के लिए फ्लैट शुल्क।** प्रति कनेक्शन EUR 19 या USD 25, कर और भुगतान प्रोसेसर शुल्क को छोड़कर। Ulixai राशि बदल सकता है और/या देश/मुद्रा के आधार पर स्थानीय शेड्यूल भविष्य के प्रभाव के साथ प्रकाशित कर सकता है।


**एकल भुगतान और विभाजन।** उपयोगकर्ता प्लेटफॉर्म के माध्यम से **एक भुगतान** करता है जो (i) वकील शुल्क (सहमत के रूप में) और (ii) Ulixai का कनेक्शन शुल्क शामिल करता है। Ulixai (या उसका प्रोसेसर) एकत्र करता है, **अपना शुल्क काटता है**, फिर **शेष वकील को भेजता है**, जो ऐसे **कटौती और आवंटन को अधिकृत करता है**।


**देय और गैर-वापसी योग्य।** कनेक्शन शुल्क कनेक्शन पर **अर्जित** होता है और **गैर-वापसी योग्य** है (Ulixai के **विवेकपूर्ण उदारता** के अधीन **कानून द्वारा अनुमति प्राप्त सीमा तक** केवल-प्लेटफॉर्म विफलता की स्थिति में)।


**उपयोगकर्ता वापसी।** यदि प्रदान किया जाए, तो वापसी **वकील के हिस्से द्वारा वहन की जाती है**: Ulixai **भविष्य के भुगतान के विरुद्ध रोक सकता है/समायोजन कर सकता है** या यदि कोई देय न हो तो प्रतिपूर्ति का अनुरोध कर सकता है।


**विदेशी मुद्रा और कर।** प्रोसेसर विदेशी मुद्रा दरें/शुल्क लागू हो सकते हैं; वकील सभी लागू करों के लिए जिम्मेदार है; Ulixai कनेक्शन शुल्क पर VAT या स्थानीय समकक्ष एकत्र/प्रेषित करता है जहां आवश्यक हो। **समायोजन** अधिकृत है।


---


## 8. भुगतान – AML/KYC – प्रतिबंध


भुगतान तृतीय-पक्ष प्रदाताओं द्वारा संसाधित किए जाते हैं। वकील उनकी शर्तों और AML/KYC प्रक्रियाओं से सहमत होता है। Ulixai संदिग्ध धोखाधड़ी, गैर-अनुपालन, या कानूनी आदेश के मामले में भुगतान में देरी, रोक या रद्द कर सकता है। प्रतिबंधित क्षेत्रों में पहुंच प्रतिबंधित की जा सकती है जहां कानून द्वारा आवश्यक हो। वकील यह प्रमाणित करता है कि वह प्रतिबंध सूचियों पर नहीं है और निर्यात नियंत्रण का अनुपालन करता है।


---


## 9. डेटा संरक्षण (वैश्विक ढांचा)


**भूमिकाएं।** कनेक्शन के लिए प्राप्त उपयोगकर्ता डेटा के लिए, **Ulixai और वकील** प्रत्येक अपनी स्वयं की उद्देश्यों के लिए **स्वतंत्र नियंत्रक** के रूप में कार्य करते हैं। **कानूनी आधार और उद्देश्य** में अनुबंध निष्पादन (कनेक्शन), वैध हित (सुरक्षा, धोखाधड़ी रोकथाम, सेवा सुधार), कानूनी अनुपालन (AML, प्रतिबंध), और जहां लागू हो सहमति शामिल है। **अंतर्राष्ट्रीय हस्तांतरण** आवश्यक होने पर उचित गारंटी के साथ हो सकते हैं। **अधिकार और संपर्क** प्लेटफॉर्म संपर्क फॉर्म के माध्यम से। **सुरक्षा** उपाय लागू होते हैं; डेटा उल्लंघनों को आवश्यकतानुसार सूचित किया जाता है। वकील हस्तक्षेप के देश के कानून और व्यावसायिक गोपनीयता के अनुसार डेटा संसाधित करता है।


---


## 10. बौद्धिक संपदा


प्लेटफॉर्म, ट्रेडमार्क, लोगो, डेटाबेस और सामग्री सुरक्षित हैं। वकील को इन शर्तों के दौरान पहुंच के अलावा कोई अधिकार नहीं दिया जाता है। वकील द्वारा प्रदान की गई सामग्री (प्रोफाइल, फोटो, विवरण) Ulixai को **वैश्विक, गैर-एक्सक्लूसिव** आधार पर प्लेटफॉर्म पर होस्टिंग और प्रदर्शन के लिए लाइसेंस दी गई है।


---


## 11. वारंटी, दायित्व और क्षतिपूर्ति


कानूनी परिणाम, गुणवत्ता, मात्रा या उपयोगकर्ता विश्वसनीयता की कोई वारंटी नहीं। प्लेटफॉर्म "जैसी है" प्रदान किया जाता है। **दायित्व सीमा**: अधिकतम सीमा तक अनुमत, Ulixai का वकील के प्रति कुल दायित्व **सीधे नुकसान** तक सीमित है और दावे को जन्म देने वाले **लेनदेन** के लिए Ulixai द्वारा प्राप्त कुल **कनेक्शन शुल्क** से अधिक नहीं हो सकता है। कोई अप्रत्यक्ष/परिणामी/विशेष/दंडकारी नुकसान नहीं। **क्षतिपूर्ति**: वकील Ulixai (और संबद्ध, अधिकारी, कर्मचारी, एजेंट) को दावों/लागत (युक्तिसंगत वकील शुल्क सहित) से क्षतिपूर्ति और हानिरहित रखता है जो (i) इन शर्तों/कानूनों के उल्लंघन, (ii) वकील सामग्री, (iii) वकील सेवाओं या चूक से उत्पन्न होते हैं। कोई एजेंसी/रोजगार/साझेदारी/JV नहीं बनाई गई है। **अस्तित्व**: धारा 5, 7, 8, 9, 10, 11, 12 और 13 समाप्ति के बाद जीवित रहती है।


---


## 12. लागू कानून – ICC मध्यस्थता – एस्टोनियाई अदालतें – सामूहिक कार्रवाई


**सामग्री कानून:** प्रत्येक कनेक्शन के लिए, **हस्तक्षेप के देश के कानून** Ulixai-वकील संबंध को नियंत्रित करते हैं, अनिवार्य स्थानीय नियमों और अपरिहार्य अंतर्राष्ट्रीय मानदंडों के अधीन।


**अनिवार्य ICC मध्यस्थता** किसी भी Ulixai-वकील विवाद के लिए। **सीट: तेलिन (एस्टोनिया)। भाषा: फ्रांसीसी।** ट्रिब्यूनल ऊपर परिभाषित **सामग्री कानून** लागू करता है। कार्यवाही **गोपनीय** हैं।


**सामूहिक/समूह कार्रवाई को कानून द्वारा अनुमत सीमा तक त्याग दिया जाता है।**


**एस्टोनियाई अदालतों का एक्सक्लूसिव अधिकार क्षेत्र** (तेलिन) **गैर-पंचायत योग्य** दावों, पुरस्कारों के निष्पादन और तत्काल उपायों के लिए; वकील अधिकार क्षेत्र/फोरम गैर सुविधाजनक के लिए आपत्तियों को त्यागता है।


---


## 13. विविध


**असाइनमेंट**: Ulixai इन शर्तों को एक समूह इकाई या उत्तराधिकारी को निर्दिष्ट कर सकता है; वकील Ulixai की सहमति के बिना निर्दिष्ट नहीं कर सकता है। **संपूर्ण समझौता**: ये शर्तें पूर्ववर्ती समझ को प्रतिस्थापित करती हैं। **नोटिस**: प्लेटफॉर्म पर प्रकाशन द्वारा, ऐप में, या संपर्क फॉर्म के माध्यम से। **व्याख्या**: शीर्षक सुविधा के लिए हैं; कोई **विरुद्ध प्रस्तावक** नहीं। **भाषाएं**: अनुवाद प्रदान किए जा सकते हैं; **फ्रांसीसी व्याख्या के लिए प्रबल होती है**। **विभाज्यता**: अमान्य शर्तें समतुल्य प्रभाव की वैध शर्तों द्वारा प्रतिस्थापित की जाती हैं। **कोई त्याग नहीं**: अधिकार के गैर-प्रयोग से कोई त्याग नहीं होता है।


---


## 14. संपर्क


**संपर्क फॉर्म (समर्थन और कानूनी अनुरोध)**: [**http://localhost:5174/contact**](http://localhost:5174/contact)
`;

  const defaultPt = `
# Termos de Uso – Advogados (Global)


**SOS Expat da Ulixai OÜ** (a "**Plataforma**", "**SOS**", "**nós**")


**Versão 2.2 – Última atualização: 16 de junho de 2025**


---


## 1. Definições


"Conexão" significa a introdução técnica/operacional que permite contato (compartilhamento de detalhes e/ou iniciação de chamada/mensagem/vídeo). "País de Intervenção" significa a jurisdição principalmente alvo da Solicitação do Usuário no momento da Conexão; se houver várias, a mais proximamente conectada. "Taxa de Conexão" significa **EUR 19** (se paga em EUR) ou **USD 25** (se paga em USD), sujeita a mudanças futuras e/ou cronogramas locais por país/moeda com efeito prospectivo.


---


## 2. Propósito, Escopo e Aceitação


Ulixai atua **exclusivamente como intermediária técnica**. Ulixai não fornece consultoria jurídica e não é parte dos compromissos Advogado-Usuário. **Aceitação por click-wrap** constitui assinatura eletrônica e consentimento; SOS pode manter evidência técnica. SOS pode atualizar estes Termos e/ou cronogramas de taxas com efeito prospectivo mediante publicação. Prazo: indefinido.


---


## 3. Status do Advogado – Independência e Conformidade


O Advogado atua como profissional independente. Nenhuma relação de emprego, mandato, agência, parceria ou empreendimento conjunto é criada. O Advogado é exclusivamente responsável por (i) qualificações, admissões e licenças, (ii) seguro de responsabilidade profissional adequado para todos os Países de Intervenção previstos, (iii) lei local e regras profissionais (ética, publicidade/solicitação, conflitos, confidencialidade, AML/KYC, impostos, proteção do consumidor, etc.). Ulixai não supervisiona nem avalia o parecer jurídico do Advogado.


**Capacidade profissional (B2B).** O Advogado confirma que atua **exclusivamente para fins profissionais**. Regimes de proteção do consumidor não se aplicam à relação Ulixai-Advogado.


---


## 4. Conta, Verificações e Segurança


Direito válido de exercer em pelo menos uma jurisdição; documentos de identidade/qualificação; revisão manual (que pode incluir verificações de vídeo e AML/KYC). Precisão e atualizações são obrigação do Advogado; uma conta por Advogado. Mantenha credenciais seguras e relate comprometimento imediatamente.


---


## 5. Regras de Uso – Conflitos, Confidencialidade, Sem Bypass


**Conflitos.** Tela para conflitos antes de qualquer consultoria; retire-se e informe o Usuário se um conflito existir. **Confidencialidade.** Mantenha privilégio e confidencialidade sob a lei do País de Intervenção. **Sem bypass.** Ulixai não recebe comissão sobre honorários legais. Cada nova Conexão com um novo Usuário através da Plataforma gera a Taxa de Conexão. Evitar a Plataforma para evadir taxas em uma nova introdução é proibido. **Conduta proibida** inclui fraude de identidade, conteúdo ilegal, manipulação, conluio/boicote, violações de sanções/controles de exportação, ou qualquer atividade ilegal. **Disponibilidade** é "no estado em que se encontra"; acesso pode ser restringido onde exigido por lei.


---


## 6. Relacionamento Advogado-Usuário (Fora da Plataforma)


Após a Conexão, as partes podem contratar **fora da Plataforma**. Ulixai não define nem cobra honorários do Advogado (exceto através do mecanismo de pagamento único abaixo). O Advogado fornece acordos de taxas locais, gerencia impostos e cumpre regras locais.


---


## 7. Honorários, Pagamento Único e Impostos


**Taxa Fixa de Conexão.** EUR 19 ou USD 25 por Conexão, exclusivos de impostos e taxas do processador de pagamento. Ulixai pode alterar valores e/ou publicar cronogramas locais por país/moeda com efeito prospectivo.


**Pagamento único e divisão.** O Usuário faz **um pagamento** através da Plataforma cobrindo (i) o honorário do Advogado (conforme acordado) e (ii) a Taxa de Conexão de Ulixai. Ulixai (ou seu processador) coleta, **deduz** sua Taxa, depois **remete** o saldo ao Advogado, que **autoriza** tais deduções e alocações.


**Devido e não reembolsável.** A Taxa de Conexão é **ganha na** Conexão e é **não reembolsável** (sujeita a **liberalidade discricionária** de Ulixai **na medida permitida por lei** em caso de falha exclusivamente da Plataforma).


**Reembolso do Usuário.** Se concedido, reembolsos são **suportados pela parcela do Advogado**: Ulixai pode **reter/compensar** contra pagamentos futuros ou solicitar reembolso se nenhum for devido.


**Câmbio & impostos.** Taxas de câmbio do processador/taxas podem se aplicar; o Advogado é responsável por todos os impostos aplicáveis; Ulixai coleta/remete IVA ou equivalente local na Taxa de Conexão onde exigido. **Compensação** autorizada.


---


## 8. Pagamentos – AML/KYC – Sanções


Pagamentos são processados por provedores terceirizados. O Advogado concorda com seus termos e procedimentos AML/KYC. Ulixai pode atrasar, reter ou cancelar pagamentos em caso de suspeita de fraude, não conformidade ou ordem legal. Acesso pode ser restringido em territórios sancionados onde exigido por lei. O Advogado garante que não está em listas de sanções e cumpre controles de exportação.


---


## 9. Proteção de Dados (Estrutura Global)


**Funções.** Para dados de Usuário recebidos para Conexão, **Ulixai e o Advogado** cada um atuam como **controlador independente** para seus próprios fins. **Bases legais e fins** incluem execução do contrato (Conexão), interesses legítimos (segurança, prevenção de fraude, melhoria de serviço), conformidade legal (AML, sanções), e consentimento onde aplicável. **Transferências internacionais** podem ocorrer com garantias apropriadas onde exigido. **Direitos e contato** via formulário de contato da Plataforma. **Medidas de segurança** aplicam-se; violações de dados são notificadas conforme exigido. O Advogado processa dados sob a lei do País de Intervenção e sigilo profissional.


---


## 10. Propriedade Intelectual


A Plataforma, marcas, logos, bancos de dados e conteúdo são protegidos. Nenhum direito é concedido ao Advogado além de um direito pessoal, não-exclusivo, não-transferível para acessar durante estes Termos. Conteúdo fornecido pelo Advogado (perfil, foto, descrições) é licenciado a Ulixai em base **mundial, não-exclusiva** para hospedagem e exibição na Plataforma.


---


## 11. Garantias, Responsabilidade e Indenização


Nenhuma garantia para resultados legais, qualidade, volume ou confiabilidade de Usuários. Plataforma é fornecida "no estado em que se encontra". **Limitação de responsabilidade**: na máxima medida permitida, a responsabilidade total de Ulixai perante o Advogado é limitada a **danos diretos** e **não deve exceder** o total de **Taxas de Conexão** recebidas por Ulixai pela **transação** que dá origem ao pedido. Nenhum dano indireto/consequente/especial/punitivo. **Indenização**: o Advogado indeniza e mantém indemne Ulixai (e afiliadas, oficiais, funcionários, agentes) de pedidos/custos (incluindo honorários advocatícios razoáveis) decorrentes de (i) violação destes Termos/leis, (ii) conteúdo do Advogado, (iii) serviços ou omissões do Advogado. Nenhuma relação de agência/emprego/parceria/JV é criada. **Sobrevivência**: Seções 5, 7, 8, 9, 10, 11, 12 e 13 sobrevivem à rescisão.


---


## 12. Lei Aplicável – Arbitragem ICC – Tribunais Estonianos – Ações Coletivas


**Lei material:** para cada Conexão, as **leis do País de Intervenção** regem o relacionamento Ulixai-Advogado, sujeito a regras locais obrigatórias e normas internacionais imperativas.


**Arbitragem ICC obrigatória** para qualquer disputa Ulixai-Advogado. **Sede: Tallinn (Estônia). Idioma: francês.** Tribunal aplica a **lei material** definida acima. Procedimentos são **confidenciais**.


**Ações coletivas/de grupo são renunciadas** na medida permitida por lei.


**Jurisdição exclusiva de tribunais estonianos** (Tallinn) para pedidos **não arbitráveis**, execução de sentenças e medidas urgentes; o Advogado renuncia a objeções a foro/forum non conveniens.


---


## 13. Diversos


**Cessão**: Ulixai pode ceder estes Termos a uma entidade do grupo ou sucessor; o Advogado não pode ceder sem consentimento de Ulixai. **Acordo integral**: estes Termos substituem entendimentos anteriores. **Avisos**: por publicação na Plataforma, no app, ou via formulário de contato. **Interpretação**: títulos são para conveniência; sem **contra proferentem**. **Idiomas**: traduções podem ser fornecidas; **francês prevalece** para interpretação. **Divisibilidade**: termos inválidos são substituídos por válidos de efeito equivalente. **Sem renúncia**: falha em fazer valer um direito não é renúncia.


---


## 14. Contato


**Formulário de contato (suporte e solicitações legais)**: [**http://localhost:5174/contact**](http://localhost:5174/contact)
`;

  // const defaultContent = selectedLanguage === 'fr' ? defaultFr : defaultEn;
  const defaultContent =
    selectedLanguage === "fr"
      ? defaultFr
      : selectedLanguage === "de"
        ? defaultDe
        : selectedLanguage === "hi"
          ? defaultHi
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
                  href="http://localhost:5174/contact"
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
                href="http://localhost:5174/contact"
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
