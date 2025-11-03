import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useApp } from '../contexts/AppContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Important :
 * - Logique métier conservée (Firestore, parsing, sélection langue via useApp).
 * - Design refondu pour matcher Home (gradients, cards, badges, CTA), mobile-first.
 * - 100% éditable depuis l'admin (collection `legal_documents`).
 * - Aucun `any`.
 */

const TermsExpats: React.FC = () => {
  const { language } = useApp();

  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedLanguage, setSelectedLanguage] = useState<'fr' | 'en' | 'es' | 'de' | 'ru' | 'hi'>(
    (language as 'fr' | 'en' | 'es' | 'de' | 'ru' | 'hi') || 'fr'
  );

  useEffect(() => {
    if (language) {
      setSelectedLanguage(language as 'fr' | 'en' | 'es' | 'de' | 'ru' | 'hi');
    }
  }, [language]);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setIsLoading(true);
        const q = query(
          collection(db, 'legal_documents'),
          where('type', '==', 'terms_expats'),
          where('language', '==', selectedLanguage),
          where('isActive', '==', true),
          orderBy('updatedAt', 'desc'),
          limit(1)
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          setContent((doc.data() as { content: string }).content);
        } else {
          setContent('');
        }
      } catch (error) {
        console.error('Error fetching terms:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTerms();
  }, [selectedLanguage]);

  // const translations = {
  //   fr: {
  //     title: 'CGU Expatriés Aidants',
  //     subtitle: "Conditions générales d'utilisation pour les expatriés aidants",
  //     lastUpdated: 'Version 2.2 – Dernière mise à jour : 16 juin 2025',
  //     loading: 'Chargement...',
  //     joinNetwork: 'Rejoindre le réseau',
  //     trustedByHelpers: 'Déjà 1K+ expatriés aidants nous font confiance',
  //     keyFeatures: 'Points clés',
  //     features: [
  //       'Paiement garanti sous 7 jours',
  //       'Support technique 24/7',
  //       'Interface mobile optimisée',
  //       'Utilisateurs vérifiés',
  //     ],
  //     languageToggle: 'Changer de langue',
  //     sections: {
  //       definitions: 'Définitions',
  //       scope: 'Objet, champ et acceptation',
  //       status: "Statut de l'Expatrié Aidant – Conformité et responsabilités",
  //       account: 'Compte, vérifications et sécurité',
  //       rules: 'Règles d’usage – Qualité, interdits, non-contournement',
  //       relationship: 'Relation Aidant–Utilisateur (hors Plateforme)',
  //       fees: 'Frais, paiement unique et taxes',
  //       data: 'Données personnelles (cadre global)',
  //       ip: 'Propriété intellectuelle',
  //       liability: 'Garanties, responsabilité et indemnisation',
  //       law: 'Droit applicable – Arbitrage – Juridiction estonienne',
  //       misc: 'Divers',
  //       contact: 'Contact',
  //     },
  //     readyToJoin: 'Prêt à rejoindre SOS Expat ?',
  //     readySubtitle: 'Aidez des expatriés et développez votre activité de conseil.',
  //     startNow: 'Commencer maintenant',
  //     contactUs: 'Nous contacter',
  //     anchorTitle: 'Sommaire',
  //     editHint: 'Document éditable depuis la console admin',
  //     ctaHero: 'Voir les experts',
  //     heroBadge: 'Nouveau — Conditions mises à jour',
  //     contactForm: 'Formulaire de contact',
  //   },
  //   en: {
  //     title: 'Expat Helper Terms',
  //     subtitle: 'Terms of Use for expatriate helpers',
  //     lastUpdated: 'Version 2.2 – Last updated: 16 June 2025',
  //     loading: 'Loading...',
  //     joinNetwork: 'Join the network',
  //     trustedByHelpers: 'Already 1K+ expat helpers trust us',
  //     keyFeatures: 'Key features',
  //     features: [
  //       'Guaranteed payment within 7 days',
  //       '24/7 technical support',
  //       'Mobile-optimized interface',
  //       'Verified users',
  //     ],
  //     languageToggle: 'Switch language',
  //     sections: {
  //       definitions: 'Definitions',
  //       scope: 'Purpose, Scope and Acceptance',
  //       status: 'Helper Status – Compliance and Responsibilities',
  //       account: 'Account, Checks and Security',
  //       rules: 'Use Rules – Quality, Prohibited Conduct, No Circumvention',
  //       relationship: 'Helper–User Relationship (Off-Platform)',
  //       fees: 'Fees, Single Payment and Taxes',
  //       data: 'Data Protection (Global Framework)',
  //       ip: 'Intellectual Property',
  //       liability: 'Warranties, Liability and Indemnity',
  //       law: 'Governing Law – ICC Arbitration – Estonian Courts',
  //       misc: 'Miscellaneous',
  //       contact: 'Contact',
  //     },
  //     readyToJoin: 'Ready to join SOS Expat?',
  //     readySubtitle: 'Help expats and develop your consulting activity.',
  //     startNow: 'Start now',
  //     contactUs: 'Contact us',
  //     anchorTitle: 'Overview',
  //     editHint: 'Document editable from the admin console',
  //     ctaHero: 'See experts',
  //     heroBadge: 'New — Terms updated',
  //     contactForm: 'Contact Form',
  //   },
  // };


const translations = {
  fr: {
    title: 'CGU Expatriés Aidants',
    subtitle: "Conditions générales d'utilisation pour les expatriés aidants",
    lastUpdated: 'Version 2.2 – Dernière mise à jour : 16 juin 2025',
    loading: 'Chargement...',
    joinNetwork: 'Rejoindre le réseau',
    trustedByHelpers: 'Déjà 1K+ expatriés aidants nous font confiance',
    keyFeatures: 'Points clés',
    features: [
      'Paiement garanti sous 7 jours',
      'Support technique 24/7',
      'Interface mobile optimisée',
      'Utilisateurs vérifiés',
    ],
    languageToggle: 'Changer de langue',
    sections: {
      definitions: 'Définitions',
      scope: 'Objet, champ et acceptation',
      status: "Statut de l'Expatrié Aidant – Conformité et responsabilités",
      account: 'Compte, vérifications et sécurité',
      rules: "Règles d'usage – Qualité, interdits, non-contournement",
      relationship: 'Relation Aidant–Utilisateur (hors Plateforme)',
      fees: 'Frais, paiement unique et taxes',
      data: 'Données personnelles (cadre global)',
      ip: 'Propriété intellectuelle',
      liability: 'Garanties, responsabilité et indemnisation',
      law: 'Droit applicable – Arbitrage – Juridiction estonienne',
      misc: 'Divers',
      contact: 'Contact',
    },
    readyToJoin: 'Prêt à rejoindre SOS Expat ?',
    readySubtitle: 'Aidez des expatriés et développez votre activité de conseil.',
    startNow: 'Commencer maintenant',
    contactUs: 'Nous contacter',
    anchorTitle: 'Sommaire',
    editHint: 'Document éditable depuis la console admin',
    ctaHero: 'Voir les experts',
    heroBadge: 'Nouveau — Conditions mises à jour',
    contactForm: 'Formulaire de contact',
  },
  en: {
    title: 'Expat Helper Terms',
    subtitle: 'Terms of Use for expatriate helpers',
    lastUpdated: 'Version 2.2 – Last updated: 16 June 2025',
    loading: 'Loading...',
    joinNetwork: 'Join the network',
    trustedByHelpers: 'Already 1K+ expat helpers trust us',
    keyFeatures: 'Key features',
    features: [
      'Guaranteed payment within 7 days',
      '24/7 technical support',
      'Mobile-optimized interface',
      'Verified users',
    ],
    languageToggle: 'Switch language',
    sections: {
      definitions: 'Definitions',
      scope: 'Purpose, Scope and Acceptance',
      status: 'Helper Status – Compliance and Responsibilities',
      account: 'Account, Checks and Security',
      rules: 'Use Rules – Quality, Prohibited Conduct, No Circumvention',
      relationship: 'Helper–User Relationship (Off-Platform)',
      fees: 'Fees, Single Payment and Taxes',
      data: 'Data Protection (Global Framework)',
      ip: 'Intellectual Property',
      liability: 'Warranties, Liability and Indemnity',
      law: 'Governing Law – ICC Arbitration – Estonian Courts',
      misc: 'Miscellaneous',
      contact: 'Contact',
    },
    readyToJoin: 'Ready to join SOS Expat?',
    readySubtitle: 'Help expats and develop your consulting activity.',
    startNow: 'Start now',
    contactUs: 'Contact us',
    anchorTitle: 'Overview',
    editHint: 'Document editable from the admin console',
    ctaHero: 'See experts',
    heroBadge: 'New — Terms updated',
    contactForm: 'Contact Form',
  },
  es: {
    title: 'Términos para Ayudantes Expat',
    subtitle: 'Términos de uso para ayudantes de expatriados',
    lastUpdated: 'Versión 2.2 – Última actualización: 16 de junio de 2025',
    loading: 'Cargando...',
    joinNetwork: 'Únete a la red',
    trustedByHelpers: 'Ya más de 1K+ ayudantes expat confían en nosotros',
    keyFeatures: 'Características clave',
    features: [
      'Pago garantizado en 7 días',
      'Soporte técnico 24/7',
      'Interfaz optimizada para móvil',
      'Usuarios verificados',
    ],
    languageToggle: 'Cambiar idioma',
    sections: {
      definitions: 'Definiciones',
      scope: 'Objeto, alcance y aceptación',
      status: 'Estado del Ayudante – Cumplimiento y responsabilidades',
      account: 'Cuenta, verificaciones y seguridad',
      rules: 'Reglas de uso – Calidad, prohibiciones, no evasión',
      relationship: 'Relación Ayudante–Usuario (fuera de la plataforma)',
      fees: 'Tarifas, pago único e impuestos',
      data: 'Datos personales (marco global)',
      ip: 'Propiedad intelectual',
      liability: 'Garantías, responsabilidad e indemnización',
      law: 'Ley aplicable – Arbitraje – Jurisdicción estonia',
      misc: 'Varios',
      contact: 'Contacto',
    },
    readyToJoin: '¿Listo para unirte a SOS Expat?',
    readySubtitle: 'Ayuda a expatriados y desarrolla tu actividad de consultoría.',
    startNow: 'Empezar ahora',
    contactUs: 'Contáctanos',
    anchorTitle: 'Resumen',
    editHint: 'Documento editable desde la consola de administración',
    ctaHero: 'Ver expertos',
    heroBadge: 'Nuevo — Términos actualizados',
    contactForm: 'Formulario de contacto',
  },
  de: {
    title: 'Expat-Helfer Bedingungen',
    subtitle: 'Nutzungsbedingungen für Expatriate-Helfer',
    lastUpdated: 'Version 2.2 – Letzte Aktualisierung: 16. Juni 2025',
    loading: 'Lädt...',
    joinNetwork: 'Dem Netzwerk beitreten',
    trustedByHelpers: 'Bereits über 1K+ Expat-Helfer vertrauen uns',
    keyFeatures: 'Hauptmerkmale',
    features: [
      'Garantierte Zahlung innerhalb von 7 Tagen',
      '24/7 technischer Support',
      'Mobiloptimierte Oberfläche',
      'Verifizierte Benutzer',
    ],
    languageToggle: 'Sprache wechseln',
    sections: {
      definitions: 'Definitionen',
      scope: 'Gegenstand, Umfang und Annahme',
      status: 'Helferstatus – Compliance und Verantwortlichkeiten',
      account: 'Konto, Überprüfungen und Sicherheit',
      rules: 'Nutzungsregeln – Qualität, Verbote, keine Umgehung',
      relationship: 'Helfer–Benutzer-Beziehung (außerhalb der Plattform)',
      fees: 'Gebühren, Einzelzahlung und Steuern',
      data: 'Personenbezogene Daten (globaler Rahmen)',
      ip: 'Geistiges Eigentum',
      liability: 'Garantien, Haftung und Entschädigung',
      law: 'Anwendbares Recht – Schiedsverfahren – Estnische Gerichtsbarkeit',
      misc: 'Verschiedenes',
      contact: 'Kontakt',
    },
    readyToJoin: 'Bereit, SOS Expat beizutreten?',
    readySubtitle: 'Helfen Sie Expats und entwickeln Sie Ihre Beratungstätigkeit.',
    startNow: 'Jetzt starten',
    contactUs: 'Kontaktieren Sie uns',
    anchorTitle: 'Übersicht',
    editHint: 'Dokument über die Admin-Konsole bearbeitbar',
    ctaHero: 'Experten ansehen',
    heroBadge: 'Neu — Bedingungen aktualisiert',
    contactForm: 'Kontaktformular',
  },
  ru: {
    title: 'Условия для помощников эмигрантов',
    subtitle: 'Условия использования для помощников эмигрантов',
    lastUpdated: 'Версия 2.2 – Последнее обновление: 16 июня 2025 г.',
    loading: 'Загрузка...',
    joinNetwork: 'Присоединиться к сети',
    trustedByHelpers: 'Уже более 1K+ помощников эмигрантов доверяют нам',
    keyFeatures: 'Ключевые особенности',
    features: [
      'Гарантированная оплата в течение 7 дней',
      'Техническая поддержка 24/7',
      'Мобильно-оптимизированный интерфейс',
      'Проверенные пользователи',
    ],
    languageToggle: 'Сменить язык',
    sections: {
      definitions: 'Определения',
      scope: 'Предмет, сфера применения и принятие',
      status: 'Статус помощника – Соответствие и обязанности',
      account: 'Учётная запись, проверки и безопасность',
      rules: 'Правила использования – Качество, запреты, отсутствие обхода',
      relationship: 'Отношения помощник–пользователь (вне платформы)',
      fees: 'Сборы, единый платёж и налоги',
      data: 'Персональные данные (глобальная структура)',
      ip: 'Интеллектуальная собственность',
      liability: 'Гарантии, ответственность и возмещение ущерба',
      law: 'Применимое право – Арбитраж – Эстонская юрисдикция',
      misc: 'Разное',
      contact: 'Контакт',
    },
    readyToJoin: 'Готовы присоединиться к SOS Expat?',
    readySubtitle: 'Помогайте эмигрантам и развивайте свою консалтинговую деятельность.',
    startNow: 'Начать сейчас',
    contactUs: 'Свяжитесь с нами',
    anchorTitle: 'Обзор',
    editHint: 'Документ редактируется из консоли администратора',
    ctaHero: 'Посмотреть экспертов',
    heroBadge: 'Новое — Условия обновлены',
    contactForm: 'Контактная форма',
  },
  hi: {
    title: 'एक्सपैट हेल्पर शर्तें',
    subtitle: 'प्रवासी सहायकों के लिए उपयोग की शर्तें',
    lastUpdated: 'संस्करण 2.2 – अंतिम अपडेट: 16 जून 2025',
    loading: 'लोड हो रहा है...',
    joinNetwork: 'नेटवर्क में शामिल हों',
    trustedByHelpers: 'पहले से ही 1K+ एक्सपैट हेल्पर्स हम पर भरोसा करते हैं',
    keyFeatures: 'मुख्य विशेषताएं',
    features: [
      '7 दिनों के भीतर गारंटीकृत भुगतान',
      '24/7 तकनीकी सहायता',
      'मोबाइल-अनुकूलित इंटरफ़ेस',
      'सत्यापित उपयोगकर्ता',
    ],
    languageToggle: 'भाषा बदलें',
    sections: {
      definitions: 'परिभाषाएँ',
      scope: 'उद्देश्य, दायरा और स्वीकृति',
      status: 'सहायक स्थिति – अनुपालन और जिम्मेदारियाँ',
      account: 'खाता, सत्यापन और सुरक्षा',
      rules: 'उपयोग नियम – गुणवत्ता, निषेध, कोई परिहार नहीं',
      relationship: 'सहायक–उपयोगकर्ता संबंध (प्लेटफ़ॉर्म के बाहर)',
      fees: 'शुल्क, एकल भुगतान और कर',
      data: 'व्यक्तिगत डेटा (वैश्विक ढांचा)',
      ip: 'बौद्धिक संपदा',
      liability: 'वारंटी, दायित्व और क्षतिपूर्ति',
      law: 'लागू कानून – मध्यस्थता – एस्टोनियाई अधिकार क्षेत्र',
      misc: 'विविध',
      contact: 'संपर्क',
    },
    readyToJoin: 'SOS Expat में शामिल होने के लिए तैयार हैं?',
    readySubtitle: 'प्रवासियों की मदद करें और अपनी परामर्श गतिविधि विकसित करें।',
    startNow: 'अभी शुरू करें',
    contactUs: 'हमसे संपर्क करें',
    anchorTitle: 'अवलोकन',
    editHint: 'व्यवस्थापक कंसोल से संपादन योग्य दस्तावेज़',
    ctaHero: 'विशेषज्ञ देखें',
    heroBadge: 'नया — शर्तें अपडेट की गईं',
    contactForm: 'संपर्क फ़ॉर्म',
  },
};



  const t = translations[selectedLanguage];

  const handleLanguageChange = (newLang: 'fr' | 'en' | 'es' | 'de' | 'ru' | 'hi') => {
    setSelectedLanguage(newLang);
  };

  // Parser Markdown (logique d’origine conservée)
  const parseMarkdownContent = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let currentIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim() === '') continue;

      if (line.trim() === '---') {
        elements.push(<hr key={currentIndex++} className="my-8 border-t-2 border-gray-200" />);
        continue;
      }

      // H1
      if (line.startsWith('# ')) {
        const title = line.substring(2).replace(/\*\*/g, '');
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
      if (line.startsWith('## ')) {
        const title = line.substring(3).trim();
        const match = title.match(/^(\d+)\.\s*(.*)$/);
        if (match) {
          const sectionNumber = match[1];
          const sectionTitle = match[2].replace(/\*\*/g, '');
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
            <h2 key={currentIndex++} className="text-xl sm:text-2xl font-bold text-gray-900 mt-10 mb-6">
              {title.replace(/\*\*/g, '')}
            </h2>
          );
        }
        continue;
      }

      // H3
      if (line.startsWith('### ')) {
        const title = line.substring(4).replace(/\*\*/g, '');
        elements.push(
          <h3 key={currentIndex++} className="text-lg font-bold text-gray-800 mt-6 mb-4 border-l-4 border-green-500 pl-4">
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
      if (line.startsWith('**') && line.endsWith('**')) {
        const boldText = line.slice(2, -2);
        elements.push(
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 my-6" key={currentIndex++}>
            <p className="font-bold text-gray-900 text-lg">{boldText}</p>
          </div>
        );
        continue;
      }

      // Bloc Contact
      if (line.includes('Pour toute question') || line.includes('For any questions')) {
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
              {selectedLanguage === 'fr' ? 'Formulaire de contact' : 'Contact Form'}
            </a>
          </div>
        );
        continue;
      }

      // Paragraphe
      if (line.trim()) {
        const formattedLine = line
          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
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

**Helper** means any person registered on the Platform to offer, independently, non-legal and non-medical assistance services to Users (orientation, practical errands, informal translation, local introductions, etc.).

**User** means any person using the Platform to contact a Helper.

**Connection** means the technical/operational introduction enabling contact (sharing details and/or initiating a call/message/video and/or acceptance by the Helper).

**Country of Intervention** means the jurisdiction primarily targeted by the User's request at the time of Connection.

**Connection Fee** means **EUR 19** (if paid in EUR) or **USD 25** (if paid in USD), subject to change and/or **local schedules** by country/currency with prospective effect.

**Payment Processors** are third-party services handling collections and payouts.

---

## 2. Purpose, Scope and Acceptance

Ulixai acts **solely as a technical intermediary** and is neither an employer, agent nor partner of Helpers; Ulixai provides no legal, medical, tax, accounting or other regulated advice and is not a party to Helper–User contracts.

**Click-wrap acceptance** constitutes electronic signature and consent. SOS may update these Terms and/or fee schedules with **prospective effect** upon posting.

**Professional capacity (B2B)**: the Helper acts exclusively for professional purposes; consumer protection regimes do not apply to the Ulixai–Helper relationship.

---

## 3. Helper Status – Compliance, Authorizations and Responsibilities

**Independence.** The Helper acts as an independent professional.

**Work authorization & immigration.** The Helper is **solely responsible** for obtaining/maintaining **all permits/visas and business registrations** required in each Country of Intervention. Ulixai **does not verify** such authorizations and **assumes no liability** for them.

**Regulated services.** The Helper shall **not** provide regulated services (e.g., legal, medical, financial, accounting, real-estate brokerage, etc.) **unless duly licensed/authorized** and fully compliant with local law; otherwise the Helper must refrain and redirect the User to an appropriately licensed professional.

**General compliance.** The Helper complies with applicable laws (consumer, e-commerce, advertising/solicitation, fair competition, AML/KYC where relevant, tax, data protection, sanctions/export, personal safety).

**Insurance.** The Helper maintains appropriate insurance.

**Confidentiality.** The Helper safeguards User information.

---

## 4. Account, Checks and Security

One account per Helper; accurate, complete and up-to-date profile. Ulixai may conduct reasonable checks (ID, profile consistency, sanctions/KYC screenings via processors) and may refuse/suspend/withdraw access for security, compliance or quality reasons. Keep credentials secure; activity via the account is deemed that of the Helper.

---

## 5. Use Rules – Quality, Prohibited Conduct, No Circumvention

Accurate description; no false professional status; no promises of outcome.

**Prohibited:** unlawful/discriminatory/deceptive content; unfair practices; abusive data use; reverse-engineering; collusion/boycott; sanctions/export breaches; any unlawful activity.

**No circumvention:** **each new Connection with a new User** via the Platform triggers the **Connection Fee**; avoiding the Platform to evade fees on a new introduction is prohibited.

**Availability:** Platform is provided **"as is."**

---

## 6. Helper–User Relationship (Off-Platform)

After Connection, parties may contract **off-Platform**. The Helper provides local service confirmations/terms, invoices, and handles taxes. Ulixai is **not responsible** for the Helper's services or commitments.

---

## 7. Fees, Single Payment and Taxes

**Flat Connection Fee.** **EUR 19 / USD 25** per Connection, exclusive of taxes and processor charges; Ulixai may change amounts and/or publish **local schedules** by country/currency with prospective effect.

**Single payment & split.** User pays **one amount** via the Platform covering (i) the Helper's remuneration (as agreed) and (ii) Ulixai's Connection Fee. Ulixai (or its processor) collects, **deducts** its Fee, then **remits** the remainder to the Helper, who **authorizes** such deductions.

**Due & non-refundable.** The Connection Fee is **earned upon** Connection and **non-refundable** (subject to Ulixai's discretionary goodwill **to the extent permitted by law** in case of Platform-only failure).

**User refunds.** If granted, refunds are **borne by the Helper's share**: Ulixai may **withhold/offset** against future payouts or request reimbursement if none are due.

**FX** and **taxes**: processor FX rates/fees may apply; Helper is responsible for all applicable taxes; Ulixai collects/remits VAT or local equivalent on the Connection Fee where required.

**Set-off** authorized.

---

## 8. Data Protection (Global Framework)

**Roles.** For User data received for Connection, **Ulixai and the Helper** each act as an **independent controller** for their own purposes.

**Legal bases/purposes:** contract performance, legitimate interests (security/fraud prevention/service improvement), legal compliance (AML/sanctions), and consent where applicable.

**International transfers** may occur with appropriate safeguards where required.

**Rights & contact** via the Platform contact form.

**Security** measures apply; breaches are notified as required. The Helper processes data under the Country of Intervention's law.

---

## 9. Intellectual Property

Platform IP remains with Ulixai. The Helper receives a **personal, non-exclusive, non-transferable** right to access during these Terms. Helper content is licensed to Ulixai on a **worldwide, non-exclusive** basis for hosting and display.

---

## 10. Warranties, Liability and Indemnity

No warranty for outcomes/quality/volume; Platform **"as is."**

**Liability cap:** to the fullest extent permitted, Ulixai's total liability to the Helper is limited to **direct damages** and **shall not exceed** the total **Connection Fees** received by Ulixai for the **transaction** giving rise to the claim.

**No indirect/consequential/special/punitive damages.**

**Indemnity:** the Helper shall **indemnify and hold harmless** Ulixai (and affiliates, officers, employees, agents) against claims/losses/costs (including reasonable attorneys' fees) arising from (i) breach of these Terms/laws, (ii) Helper content, (iii) Helper services/omissions, (iv) lack of work authorization/immigration/licensing.

---

## 11. Governing Law – ICC Arbitration – Estonian Courts – Class Actions

**Substantive law:** for each Connection, the **laws of the Country of Intervention** govern the Ulixai–Helper relationship, subject to mandatory local rules and peremptory international norms.

**Mandatory ICC arbitration** for any Ulixai–Helper dispute. **Seat: Tallinn (Estonia). Language: French.** Tribunal applies the **substantive law** defined above. Proceedings are **confidential**.

**Class/collective actions are waived** to the extent permitted by law.

**Exclusive jurisdiction of Estonian courts** (Tallinn) for **non-arbitrable** claims, enforcement of awards and urgent measures; the Helper waives objections to venue/forum non conveniens.

---

## 12. Miscellaneous

**Assignment**: Ulixai may assign these Terms to a group entity or successor; the Helper may not assign without Ulixai's consent.

**Entire Agreement**: these Terms supersede prior understandings.

**Notices**: by posting on the Platform, in-app, or via the contact form.

**Interpretation**: headings are for convenience; no **contra proferentem**.

**Languages**: translations may be provided; **French prevails** for interpretation.

**Severability**: invalid terms replaced by valid ones of equivalent effect.

**No waiver**: failure to enforce is not a waiver.

---

## 13. Contact

For any questions or legal requests, contact us:
`;

  const defaultRu = `
# Условия использования – Помощники эмигрантов (глобально)


**SOS Expat от Ulixai OÜ** (the "**Platform**", "**SOS**", "**we**")


**Версия 2.2 – Последнее обновление: 16 июня 2025 г.**


---


## 1. Определения


**Помощник** означает любое лицо, зарегистрированное на Платформе для предоставления самостоятельно услуг неправовой и немедицинской помощи пользователям (ориентация, практические поручения, неформальный перевод, местные представления и т. д.).


**Пользователь** означает любое лицо, использующее Платформу для связи с Помощником.


**Соединение** означает техническое/операционное введение, позволяющее контакт (обмен деталями и/или инициирование звонка/сообщения/видео и/или согласие Помощника).


**Страна вмешательства** означает юрисдикцию, в основном целевую по запросу Пользователя на момент Соединения.


**Сбор за соединение** означает **EUR 19** (если оплачено в EUR) или **USD 25** (если оплачено в USD), с учётом изменений и/или **местных расписаний** по странам/валютам с перспективным эффектом.


**Процессоры платежей** – это сторонние услуги, обрабатывающие сборы и выплаты.


---


## 2. Назначение, сфера применения и принятие


Ulixai действует **исключительно как технический посредник** и не является работодателем, агентом или партнёром Помощников; Ulixai не предоставляет юридические, медицинские, налоговые, бухгалтерские или иные регулируемые советы и не является стороной контрактов Помощник–Пользователь.


**Принятие путём клика** составляет электронную подпись и согласие. SOS может обновлять эти Условия и/или расписания сборов с **перспективным эффектом** при публикации.


**Профессиональная ёмкость (B2B)**: Помощник действует исключительно в профессиональных целях; режимы защиты потребителей не применяются к отношениям Ulixai–Помощник.


---


## 3. Статус помощника – Соответствие, авторизации и обязанности


**Независимость.** Помощник действует как независимый профессионал.


**Разрешение на работу и иммиграция.** Помощник **несет исключительную ответственность** за получение/поддержание **всех разрешений/виз и деловых регистраций**, требуемых в каждой Стране вмешательства. Ulixai **не проверяет** такие авторизации и **не принимает на себя ответственность** за них.


**Регулируемые услуги.** Помощник **не должен** предоставлять регулируемые услуги (например, юридические, медицинские, финансовые, бухгалтерские, посредничество в сделках с недвижимостью и т. д.) **без надлежащей лицензии/авторизации** и полного соответствия местному законодательству; в противном случае Помощник должен воздержаться и перенаправить Пользователя надлежащему лицензированному профессионалу.


**Общее соответствие.** Помощник соответствует действующему законодательству (защита потребителей, электронная коммерция, реклама/ходатайство, справедливая конкуренция, AML/KYC, где уместно, налоги, защита данных, санкции/экспорт, личная безопасность).


**Страхование.** Помощник поддерживает надлежащее страхование.


**Конфиденциальность.** Помощник защищает информацию Пользователя.


---


## 4. Учётная запись, проверки и безопасность


Один аккаунт на Помощника; точный, полный и актуальный профиль. Ulixai может проводить разумные проверки (ID, соответствие профиля, проверки санкций/KYC через процессоры) и может отказать/приостановить/отозвать доступ по причинам безопасности, соответствия или качества. Держите учётные данные в безопасности; деятельность через аккаунт считается деятельностью Помощника.


---


## 5. Правила использования – Качество, запрещённое поведение, отсутствие обхода


Точное описание; нет ложного профессионального статуса; нет обещаний результатов.


**Запрещено:** незаконное/дискриминационное/обманчивое содержание; недобросовестная практика; неправомерное использование данных; обратная инженерия; сговор/бойкот; нарушение санкций/экспорта; любая незаконная деятельность.


**Отсутствие обхода:** **каждое новое Соединение с новым Пользователем** через Платформу вызывает **Сбор за соединение**; избежание Платформы для уклонения от сборов на новое представление запрещено.


**Доступность:** Платформа предоставляется **«как есть».**


---


## 6. Отношения помощник–пользователь (вне платформы)


После Соединения стороны могут заключить контракт **вне Платформы**. Помощник предоставляет подтверждения/условия местного обслуживания, счета-фактуры и обрабатывает налоги. Ulixai **не несёт ответственности** за услуги или обязательства Помощника.


---


## 7. Сборы, единая оплата и налоги


**Фиксированный сбор за соединение.** **EUR 19 / USD 25** за Соединение, исключая налоги и сборы процессоров; Ulixai может менять суммы и/или публиковать **местные расписания** по странам/валютам с перспективным эффектом.


**Единая оплата и раздел.** Пользователь платит **одну сумму** через Платформу, покрывающую (i) вознаграждение Помощника (как согласовано) и (ii) Сбор Ulixai за соединение. Ulixai (или его процессор) собирает, **вычитает** свой Сбор, затем **отправляет** остаток Помощнику, который **авторизует** такие вычеты.


**Причитается и невозвратно.** Сбор за соединение **заработан при** Соединении и **невозвратен** (при условии дискреционного доброго намерения Ulixai **в той мере, в какой это разрешено законом** в случае отказа только Платформы).


**Возвраты пользователей.** Если предоставлены, возвраты **несут обязанности** доля Помощника: Ulixai может **удержать/компенсировать** против будущих выплат или потребовать возмещение, если ничего не задолжено.


**FX** и **налоги**: курсы FX процессора/сборы могут применяться; Помощник несёт ответственность за все применимые налоги; Ulixai собирает/отправляет НДС или местный эквивалент на Сбор за соединение, где требуется.


**Компенсация** авторизована.


---


## 8. Защита данных (глобальная структура)


**Роли.** Для данных Пользователя, полученных для Соединения, **Ulixai и Помощник** каждый действуют как **независимый контролер** для своих собственных целей.


**Правовые основания/цели:** исполнение контракта, законные интересы (безопасность/предотвращение мошенничества/совершенствование услуг), правовое соответствие (AML/санкции) и согласие, где применимо.


**Международные переводы** могут происходить с надлежащими гарантиями, где требуется.


**Права и контакт** через форму контакта Платформы.


**Безопасность** применяются меры; нарушения уведомляются, как требуется. Помощник обрабатывает данные по закону Страны вмешательства.


---


## 9. Интеллектуальная собственность


IP Платформы остаётся у Ulixai. Помощник получает **личное, неисключительное, непередаваемое** право доступа во время этих Условий. Содержание Помощника лицензируется на Ulixai на **мировой, неисключительной** основе для хостинга и отображения.


---


## 10. Гарантии, ответственность и возмещение ущерба


Нет гарантий результатов/качества/объёма; Платформа **«как есть».**


**Ограничение ответственности:** в той мере, в какой это разрешено законом, общая ответственность Ulixai перед Помощником ограничена **прямым ущербом** и **не должна превышать** общего **Сборов за соединение**, полученных Ulixai для **транзакции**, давшей основание претензии.


**Никаких косвенных/косвенных/специальных/штрафных убытков.**


**Возмещение ущерба:** Помощник **должен возместить и защитить** Ulixai (и филиалы, должностные лица, сотрудники, агенты) от претензий/убытков/затрат (включая разумные гонорары адвокатов), вытекающих из (i) нарушения этих Условий/законов, (ii) содержания Помощника, (iii) услуг/упущений Помощника, (iv) отсутствия разрешения на работу/иммиграции/лицензирования.


---


## 11. Применимое право – Арбитраж МКА – Эстонские суды – Коллективные иски


**Материальное право:** для каждого Соединения законы **Страны вмешательства** регулируют отношения Ulixai–Помощник, с учётом обязательных местных норм и повелительных международных норм.


**Обязательный арбитраж МКА** для любого спора Ulixai–Помощник. **Место: Таллинн (Эстония). Язык: французский.** Трибунал применяет **материальное право**, определённое выше. Разбирательства **конфиденциальны**.


**Коллективные/коллективные иски отказываются** в той мере, в какой это разрешено законом.


**Исключительная юрисдикция эстонских судов** (Таллинн) для **неарбитражных** претензий, принудительного исполнения постановлений и срочных мер; Помощник отказывается от возражений против места проведения/форума non conveniens.


---


## 12. Разное


**Уступка**: Ulixai может передать эти Условия субъекту группы или преемнику; Помощник не может уступить без согласия Ulixai.


**Полное соглашение**: эти Условия заменяют предыдущие взаимопонимания.


**Уведомления**: путём публикации на Платформе, в приложении или через форму контакта.


**Толкование**: заголовки предназначены для удобства; нет **contra proferentem**.


**Языки**: переводы могут быть предоставлены; **французский преобладает** для толкования.


**Разделимость**: недействительные условия заменены действительными с эквивалентным эффектом.


**Никакого отказа**: невыполнение требований не является отказом.


---


## 13. Контакт


По любым вопросам или юридическим запросам, свяжитесь с нами:
`;
const defaultHi = `
# उपयोग की शर्तें – प्रवासी सहायक (वैश्विक)


**SOS Expat द्वारा Ulixai OÜ** (the "**Platform**", "**SOS**", "**we**")


**संस्करण 2.2 – अंतिम अपडेट: 16 जून 2025**


---


## 1. परिभाषाएँ


**सहायक** का मतलब है कोई भी व्यक्ति जो प्लेटफॉर्म पर पंजीकृत है और उपयोगकर्ताओं को स्वतंत्र रूप से गैर-कानूनी और गैर-चिकित्सा सहायता सेवाएँ प्रदान करने के लिए (ओरिएंटेशन, व्यावहारिक काम, अनौपचारिक अनुवाद, स्थानीय परिचय, आदि)।


**उपयोगकर्ता** का मतलब है कोई भी व्यक्ति जो सहायक से संपर्क करने के लिए प्लेटफॉर्म का उपयोग करता है।


**कनेक्शन** का मतलब है तकनीकी/परिचालनात्मक परिचय जो संपर्क सक्षम करता है (विवरण साझा करना और/या कॉल/संदेश/वीडियो शुरू करना और/या सहायक द्वारा स्वीकृति)।


**हस्तक्षेप देश** का मतलब है वह क्षेत्राधिकार जो मुख्य रूप से कनेक्शन के समय उपयोगकर्ता के अनुरोध द्वारा लक्षित है।


**कनेक्शन शुल्क** का मतलब है **EUR 19** (यदि EUR में भुगतान किया गया) या **USD 25** (यदि USD में भुगतान किया गया), परिवर्तनों के अधीन और/या भविष्य के प्रभाव के साथ **स्थानीय सूचियाँ** देश/मुद्रा द्वारा।


**भुगतान प्रोसेसर** तीसरे पक्ष की सेवाएँ हैं जो संग्रह और भुगतान को संभालते हैं।


---


## 2. उद्देश्य, दायरा और स्वीकृति


Ulixai **केवल एक तकनीकी मध्यस्थ** के रूप में कार्य करता है और न तो नियोक्ता है, न एजेंट है और न ही सहायकों का साथी; Ulixai कोई कानूनी, चिकित्सा, कर, लेखा या अन्य विनियमित सलाह नहीं देता है और न ही सहायक–उपयोगकर्ता अनुबंधों का पक्ष है।


**क्लिक-रैप स्वीकृति** इलेक्ट्रॉनिक हस्ताक्षर और सहमति का गठन करती है। SOS इन शर्तों और/या शुल्क सूचियों को **भविष्य के प्रभाव** के साथ अद्यतन कर सकता है।


**व्यावसायिक क्षमता (B2B)**: सहायक विशेष रूप से व्यावसायिक उद्देश्यों के लिए कार्य करता है; उपभोक्ता संरक्षण नियम Ulixai–सहायक संबंध पर लागू नहीं होते हैं।


---


## 3. सहायक स्थिति – अनुपालन, अधिकार और जिम्मेदारियाँ


**स्वतंत्रता।** सहायक एक स्वतंत्र पेशेवर के रूप में कार्य करता है।


**कार्य अधिकार और आप्रवास।** सहायक **एकमात्र रूप से जिम्मेदार** है सभी **परमिट/वीजा और व्यावसायिक पंजीकरण** प्राप्त करने/बनाए रखने के लिए जो प्रत्येक हस्तक्षेप देश में आवश्यक हैं। Ulixai **ऐसे अधिकार को सत्यापित नहीं करता** है और **उनके लिए कोई दायित्व नहीं लेता है**।


**विनियमित सेवाएँ।** सहायक **नहीं** देगा विनियमित सेवाएँ (उदाहरण के लिए, कानूनी, चिकित्सा, वित्तीय, लेखा, रियल-एस्टेट दलाली, आदि) **जब तक कि ठीक से लाइसेंस/अधिकृत न हो** और स्थानीय कानून के साथ पूरी तरह अनुपालन न हो; अन्यथा सहायक को संयम से काम लेना चाहिए और उपयोगकर्ता को उपयुक्त लाइसेंसप्राप्त पेशेवर के पास निर्देशित करना चाहिए।


**सामान्य अनुपालन।** सहायक लागू कानूनों का पालन करता है (उपभोक्ता, ई-कॉमर्स, विज्ञापन/याचना, उचित प्रतिस्पर्धा, AML/KYC जहाँ प्रासंगिक, कर, डेटा सुरक्षा, प्रतिबंध/निर्यात, व्यक्तिगत सुरक्षा)।


**बीमा।** सहायक उपयुक्त बीमा बनाए रखता है।


**गोपनीयता।** सहायक उपयोगकर्ता की जानकारी की रक्षा करता है।


---


## 4. खाता, जाँच और सुरक्षा


एक सहायक के लिए एक खाता; सटीक, संपूर्ण और वर्तमान प्रोफ़ाइल। Ulixai उचित जाँच (ID, प्रोफ़ाइल संगति, प्रतिबंध/KYC स्क्रीनिंग प्रोसेसर के माध्यम से) कर सकता है और सुरक्षा, अनुपालन या गुणवत्ता के कारणों के लिए पहुँच से इनकार/निलंबित/वापस ले सकता है। साख सुरक्षित रखें; खाते के माध्यम से गतिविधि सहायक की मानी जाती है।


---


## 5. उपयोग नियम – गुणवत्ता, निषिद्ध आचरण, कोई परिहार नहीं


सटीक विवरण; कोई झूठी व्यावसायिक स्थिति नहीं; परिणाम की कोई गारंटी नहीं।


**निषिद्ध:** अवैध/भेदभावपूर्ण/धोखाधड़ीपूर्ण सामग्री; अनुचित प्रथाएँ; डेटा का दुरुपयोग; रिवर्स इंजीनियरिंग; मिलीभगत/बहिष्कार; प्रतिबंध/निर्यात उल्लंघन; कोई भी अवैध गतिविधि।


**कोई परिहार नहीं:** **नए उपयोगकर्ता के साथ प्रत्येक नया कनेक्शन** प्लेटफॉर्म के माध्यम से **कनेक्शन शुल्क** को ट्रिगर करता है; शुल्क से बचने के लिए नई परिचय पर प्लेटफॉर्म से बचना निषिद्ध है।


**उपलब्धता:** प्लेटफॉर्म **"जैसा है"** प्रदान किया जाता है।


---


## 6. सहायक–उपयोगकर्ता संबंध (प्लेटफॉर्म के बाहर)


कनेक्शन के बाद, पक्ष **प्लेटफॉर्म से बाहर** अनुबंध कर सकते हैं। सहायक स्थानीय सेवा पुष्टि/शर्तें, चालान और कर को संभालता है। Ulixai सहायक की सेवाओं या प्रतिबद्धताओं के लिए **जिम्मेदार नहीं है**।


---


## 7. शुल्क, एकल भुगतान और कर


**फ्लैट कनेक्शन शुल्क।** **EUR 19 / USD 25** प्रति कनेक्शन, कर और प्रोसेसर शुल्क को छोड़कर; Ulixai राशि बदल सकता है और/या भविष्य के प्रभाव के साथ **स्थानीय सूचियाँ** देश/मुद्रा द्वारा प्रकाशित कर सकता है।


**एकल भुगतान और विभाजन।** उपयोगकर्ता प्लेटफॉर्म के माध्यम से **एक राशि** का भुगतान करता है जो (i) सहायक का प्रतिफल (जैसा सहमत) और (ii) Ulixai का कनेक्शन शुल्क को कवर करता है। Ulixai (या इसका प्रोसेसर) एकत्र करता है, **कटौती करता है** इसका शुल्क, फिर **बाकी भेजता है** सहायक को, जो **अधिकृत करता है** ऐसी कटौतियों को।


**देय और गैर-वापसी योग्य।** कनेक्शन शुल्क **कनेक्शन पर** अर्जित होता है और **गैर-वापसी योग्य** होता है (Ulixai की विवेकाधीन अच्छी इच्छा के अधीन **कानून द्वारा अनुमत सीमा तक** केवल-प्लेटफॉर्म विफलता की स्थिति में)।


**उपयोगकर्ता रिफंड।** यदि प्रदान किया गया, तो रिफंड **सहायक के हिस्से को वहन करता है**: Ulixai भविष्य के भुगतान के विरुद्ध **रोक सकता है/ऑफसेट** कर सकता है या यदि कोई कारण नहीं है तो प्रतिपूर्ति का अनुरोध कर सकता है।


**विदेशी मुद्रा** और **कर**: प्रोसेसर FX दर/शुल्क लागू हो सकते हैं; सहायक सभी लागू कर के लिए जिम्मेदार है; Ulixai एकत्र/भेजता है जहाँ आवश्यक हो वहाँ VAT या स्थानीय समकक्ष कनेक्शन शुल्क पर।


**ऑफसेट** अधिकृत है।


---


## 8. डेटा सुरक्षा (वैश्विक संरचना)


**भूमिकाएँ।** कनेक्शन के लिए प्राप्त उपयोगकर्ता डेटा के लिए, **Ulixai और सहायक** प्रत्येक **स्वतंत्र नियंत्रक** के रूप में कार्य करते हैं अपने अपने उद्देश्यों के लिए।


**कानूनी आधार/उद्देश्य:** अनुबंध प्रदर्शन, वैध हित (सुरक्षा/धोखाधड़ी निवारण/सेवा सुधार), कानूनी अनुपालन (AML/प्रतिबंध) और जहाँ लागू हो वहाँ सहमति।


**अंतर्राष्ट्रीय हस्तांतरण** उपयुक्त सुरक्षा के साथ हो सकते हैं जहाँ आवश्यक हो।


**अधिकार और संपर्क** प्लेटफॉर्म संपर्क फॉर्म के माध्यम से।


**सुरक्षा** उपाय लागू होते हैं; उल्लंघनों को आवश्यकतानुसार सूचित किया जाता है। सहायक हस्तक्षेप देश के कानून के तहत डेटा प्रक्रिया करता है।


---


## 9. बौद्धिक संपदा


प्लेटफॉर्म IP Ulixai के साथ रहता है। सहायक इन शर्तों के दौरान पहुँच के लिए **व्यक्तिगत, गैर-एकमात्र, अहस्तांतरणीय** अधिकार प्राप्त करता है। सहायक की सामग्री **विश्वव्यापी, गैर-एकमात्र** आधार पर होस्टिंग और प्रदर्शन के लिए Ulixai को लाइसेंस दी जाती है।


---


## 10. गारंटियाँ, दायित्व और क्षतिपूर्ति


परिणामों/गुणवत्ता/मात्रा के लिए कोई वारंटी नहीं; प्लेटफॉर्म **"जैसा है"।**


**दायित्व सीमा:** कानून द्वारा अनुमत सीमा तक, Ulixai का सहायक को कुल दायित्व **प्रत्यक्ष नुकसान** तक सीमित है और **कुल से अधिक नहीं होगा** **कनेक्शन शुल्क** जो Ulixai को **लेनदेन** के लिए प्राप्त हुए हैं जो दावे को जन्म देते हैं।


**कोई अप्रत्यक्ष/परिणामी/विशेष/दंडात्मक नुकसान नहीं।**


**क्षतिपूर्ति:** सहायक **क्षतिपूर्ति और निर्दोष रखेगा** Ulixai (और संबद्ध, अधिकारी, कर्मचारी, एजेंट) दावों/नुकसान/लागतों (उचित वकीलों की फीस सहित) के विरुद्ध जो (i) इन शर्तों/कानूनों के उल्लंघन, (ii) सहायक की सामग्री, (iii) सहायक सेवाएँ/चूकें, (iv) कार्य अधिकार/आप्रवास/लाइसेंसिंग की कमी से उत्पन्न होते हैं।


---


## 11. लागू कानून – मध्यस्थता – एस्टोनियाई अदालतें – सामूहिक कार्यवाही


**वास्तविक कानून:** प्रत्येक कनेक्शन के लिए, **हस्तक्षेप देश के कानून** Ulixai–सहायक संबंध को नियंत्रित करते हैं, अनिवार्य स्थानीय नियमों और आदेशात्मक अंतर्राष्ट्रीय नियमों के अधीन।


**अनिवार्य मध्यस्थता** किसी भी Ulixai–सहायक विवाद के लिए। **स्थान: तालिन (एस्टोनिया)। भाषा: अंग्रेजी।** ट्रिब्यूनल ऊपर परिभाषित **वास्तविक कानून** लागू करता है। कार्यवाही **गोपनीय** हैं।


**सामूहिक/सामूहिक कार्यवाही को कानून द्वारा अनुमत सीमा तक छोड़ दिया गया है।**


**एस्टोनियाई अदालतों का एकमात्र क्षेत्राधिकार** (तालिन) **गैर-मध्यस्थ** दावों, पुरस्कारों के प्रवर्तन और तत्काल उपायों के लिए; सहायक स्थान/फोरम के आपत्तियों को वापस लेता है non conveniens.


---


## 12. विविध


**असाइनमेंट**: Ulixai इन शर्तों को समूह संस्था या उत्तराधिकारी को असाइन कर सकता है; सहायक Ulixai की सहमति के बिना असाइन नहीं कर सकता है।


**संपूर्ण समझौता**: ये शर्तें पूर्व समझ को प्रतिस्थापित करती हैं।


**नोटिस**: प्लेटफॉर्म पर पोस्ट करके, ऐप में, या संपर्क फॉर्म के माध्यम से।


**व्याख्या**: शीर्षक सुविधा के लिए हैं; कोई **प्रति proferentem** नहीं।


**भाषाएँ**: अनुवाद प्रदान किए जा सकते हैं; व्याख्या के लिए **अंग्रेजी प्रबल** होती है।


**वियोजनीयता**: अमान्य शर्तें समकक्ष प्रभाव के वैध लोगों द्वारा प्रतिस्थापित होती हैं।


**कोई वापसी नहीं**: प्रवर्तन की विफलता वापसी नहीं है।


---


## 13. संपर्क


किसी भी प्रश्न या कानूनी अनुरोधों के लिए, हमसे संपर्क करें:
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


Ulixai actúa **únicamente como intermediario técnico** y no es ni empleador ni agente ni socio de los Ayudantes; Ulixai no proporciona asesoramiento legal, médico, fiscal, contable u otro regulado y no es parte de contratos Ayudante–Usuario.


**La aceptación por clic** constituye firma electrónica y consentimiento. SOS puede actualizar estos Términos y/o horarios de tarifas con **efecto prospectivo** al publicar.


**Capacidad profesional (B2B)**: el Ayudante actúa exclusivamente para propósitos profesionales; los regímenes de protección del consumidor no se aplican a la relación Ulixai–Ayudante.


---


## 3. Estado del Ayudante – Cumplimiento, Autorizaciones y Responsabilidades


**Independencia.** El Ayudante actúa como profesional independiente.


**Autorización de trabajo e inmigración.** El Ayudante es **únicamente responsable** de obtener/mantener **todos los permisos/visas y registros comerciales** requeridos en cada País de Intervención. Ulixai **no verifica** tales autorizaciones y **no asume responsabilidad** por ellas.


**Servicios regulados.** El Ayudante **no deberá** proporcionar servicios regulados (por ejemplo, legal, médico, financiero, contable, corretaje de bienes raíces, etc.) **a menos que esté debidamente licenciado/autorizado** y en cumplimiento total con la ley local; de lo contrario, el Ayudante debe abstenerse y redirigir al Usuario a un profesional apropiadamente licenciado.


**Cumplimiento general.** El Ayudante cumple con las leyes aplicables (protección del consumidor, comercio electrónico, publicidad/solicitud, competencia leal, AML/KYC donde sea relevante, fiscalidad, protección de datos, sanciones/exportación, seguridad personal).


**Seguro.** El Ayudante mantiene un seguro apropiado.


**Confidencialidad.** El Ayudante salvaguarda la información del Usuario.


---


## 4. Cuenta, Verificaciones y Seguridad


Una cuenta por Ayudante; perfil exacto, completo y actualizado. Ulixai puede realizar verificaciones razonables (ID, coherencia de perfil, verificaciones de sanciones/KYC a través de procesadores) y puede denegar/suspender/retirar acceso por razones de seguridad, cumplimiento o calidad. Mantenga las credenciales seguras; la actividad a través de la cuenta se considera actividad del Ayudante.


---


## 5. Reglas de Uso – Calidad, Conducta Prohibida, Sin Evasión


Descripción exacta; sin estado profesional falso; sin promesas de resultados.


**Prohibido:** contenido ilegal/discriminatorio/engañoso; prácticas injustas; uso indebido de datos; ingeniería inversa; colusión/boicot; infracciones de sanciones/exportación; cualquier actividad ilegal.


**Sin evasión:** **cada nueva Conexión con un nuevo Usuario** a través de la Plataforma desencadena la **Tarifa de Conexión**; evitar la Plataforma para eludir tarifas en una nueva introducción está prohibido.


**Disponibilidad:** la Plataforma se proporciona **"tal como está".**


---


## 6. Relación Ayudante–Usuario (Fuera de la Plataforma)


Después de la Conexión, las partes pueden contratar **fuera de la Plataforma**. El Ayudante proporciona confirmaciones/términos de servicio local, facturas y maneja impuestos. Ulixai **no es responsable** por los servicios o compromisos del Ayudante.


---


## 7. Tarifas, Pago Único e Impuestos


**Tarifa de Conexión Fija.** **EUR 19 / USD 25** por Conexión, exclusivos de impuestos y cargos del procesador; Ulixai puede cambiar montos y/o publicar **horarios locales** por país/moneda con efecto prospectivo.


**Pago único y división.** El Usuario paga **una cantidad** a través de la Plataforma que cubre (i) la remuneración del Ayudante (como se acordó) y (ii) la Tarifa de Conexión de Ulixai. Ulixai (o su procesador) recauda, **deduce** su Tarifa, luego **remite** el resto al Ayudante, quien **autoriza** tales deducciones.


**Debido y no reembolsable.** La Tarifa de Conexión se **gana en** la Conexión y es **no reembolsable** (sujeta a la voluntad discrecional de buena fe de Ulixai **en la medida permitida por la ley** en caso de falla solo de la Plataforma).


**Reembolsos de Usuario.** Si se otorgan, los reembolsos los **cubre la parte del Ayudante**: Ulixai puede **retener/compensar** contra pagos futuros o solicitar reembolso si no hay ninguno.


**Divisas** e **impuestos**: pueden aplicarse tasas/cargos de divisas del procesador; el Ayudante es responsable de todos los impuestos aplicables; Ulixai recauda/remite IVA o equivalente local en la Tarifa de Conexión donde sea requerido.


**Compensación** autorizada.


---


## 8. Protección de Datos (Marco Global)


**Funciones.** Para datos de Usuario recibidos para Conexión, **Ulixai y el Ayudante** actúan cada uno como **controlador independiente** para sus propios propósitos.


**Bases legales/propósitos:** ejecución de contrato, intereses legítimos (seguridad/prevención de fraude/mejora de servicio), cumplimiento legal (AML/sanciones) y consentimiento donde sea aplicable.


**Las transferencias internacionales** pueden ocurrir con salvaguardias apropiadas donde sea requerido.


**Derechos y contacto** a través del formulario de contacto de la Plataforma.


**Se aplican medidas de** seguridad; las infracciones se notifican según sea requerido. El Ayudante procesa datos bajo la ley del País de Intervención.


---


## 9. Propiedad Intelectual


La IP de la Plataforma permanece con Ulixai. El Ayudante recibe un derecho **personal, no exclusivo, no transferible** para acceder durante estos Términos. El contenido del Ayudante se licencia a Ulixai en base **mundial, no exclusiva** para alojamiento y visualización.


---


## 10. Garantías, Responsabilidad e Indemnización


Sin garantía de resultados/calidad/volumen; Plataforma **"tal como está".**


**Límite de responsabilidad:** en la máxima medida permitida, la responsabilidad total de Ulixai ante el Ayudante se limita a **daños directos** y **no debe exceder** el total de **Tarifas de Conexión** recibidas por Ulixai para la **transacción** que da lugar al reclamo.


**Sin daños indirectos/consecuentes/especiales/punitivos.**


**Indemnización:** el Ayudante **indemnizará y dejará indemne** a Ulixai (y afiliadas, funcionarios, empleados, agentes) contra reclamos/pérdidas/costos (incluidos honorarios razonables de abogados) que surjan de (i) incumplimiento de estos Términos/leyes, (ii) contenido del Ayudante, (iii) servicios/omisiones del Ayudante, (iv) falta de autorización de trabajo/inmigración/licencia.


---


## 11. Ley Aplicable – Arbitraje – Tribunales Estonios – Acciones Colectivas


**Ley sustantiva:** para cada Conexión, las **leyes del País de Intervención** rigen la relación Ulixai–Ayudante, sujetas a reglas locales obligatorias y normas internacionales perentorias.


**Arbitraje ICC obligatorio** para cualquier disputa Ulixai–Ayudante. **Sede: Tallin (Estonia). Idioma: Francés.** El Tribunal aplica la **ley sustantiva** definida arriba. Los procedimientos son **confidenciales**.


**Las acciones/colectivas de clase se renuncian** en la medida permitida por la ley.


**Jurisdicción exclusiva de tribunales estonios** (Tallin) para reclamos **no arbitrables**, ejecución de laudos y medidas urgentes; el Ayudante renuncia a objeciones de jurisdicción/forum non conveniens.


---


## 12. Diverso


**Asignación**: Ulixai puede asignar estos Términos a una entidad de grupo o sucesor; el Ayudante no puede asignar sin consentimiento de Ulixai.


**Acuerdo Completo**: estos Términos reemplazan entendimientos previos.


**Avisos**: mediante publicación en la Plataforma, en la aplicación o a través del formulario de contacto.


**Interpretación**: los encabezados son por conveniencia; sin **contra proferentem**.


**Idiomas**: se pueden proporcionar traducciones; **el francés prevalece** para la interpretación.


**Separabilidad**: términos inválidos reemplazados por válidos de efecto equivalente.


**Sin renuncia**: el incumplimiento de hacer cumplir no es una renuncia.


---


## 13. Contacto


Para cualquier pregunta o solicitud legal, contáctenos:
`;
const defaultDe = `
# Nutzungsbedingungen – Expatriate Helfer (Global)


**SOS Expat von Ulixai OÜ** (die "**Plattform**", "**SOS**", "**wir**")


**Version 2.2 – Letzte Aktualisierung: 16. Juni 2025**


---


## 1. Definitionen


**Helfer** bedeutet jede Person, die auf der Plattform registriert ist, um Benutzern unabhängig nichtrechtliche und nichtmedizinische Hilfsdienste anzubieten (Orientierung, praktische Besorgungen, informelle Übersetzung, lokale Vorstellungen, usw.).


**Benutzer** bedeutet jede Person, die die Plattform nutzt, um einen Helfer zu kontaktieren.


**Verbindung** bedeutet die technische/operative Einführung, die Kontakt ermöglicht (Austausch von Details und/oder Einleitung eines Anrufs/einer Nachricht/eines Videos und/oder Annahme durch den Helfer).


**Interventionsland** bedeutet die Jurisdiktion, die hauptsächlich vom Antrag des Benutzers zum Zeitpunkt der Verbindung angestrebt wird.


**Verbindungsgebühr** bedeutet **EUR 19** (falls in EUR bezahlt) oder **USD 25** (falls in USD bezahlt), abhängig von Änderungen und/oder **lokalen Zeitplänen** nach Land/Währung mit prospektiver Wirkung.


**Zahlungsprozessoren** sind Drittanbieter-Services, die Einzüge und Auszahlungen bearbeiten.


---


## 2. Zweck, Umfang und Annahme


Ulixai handelt **ausschließlich als technischer Vermittler** und ist weder Arbeitgeber noch Agent noch Partner der Helfer; Ulixai leistet keine rechtliche, medizinische, steuerliche, buchhalterische oder sonstige regulierte Beratung und ist nicht Partei von Helfer–Benutzer-Verträgen.


**Click-Wrap-Annahme** stellt eine elektronische Unterschrift und Zustimmung dar. SOS kann diese Bedingungen und/oder Gebührenpläne mit **prospektiver Wirkung** durch Veröffentlichung aktualisieren.


**Berufliche Kapazität (B2B)**: Der Helfer handelt ausschließlich zu beruflichen Zwecken; Verbraucherschutzbestimmungen gelten nicht für die Ulixai–Helfer-Beziehung.


---


## 3. Helferstatus – Compliance, Genehmigungen und Verantwortlichkeiten


**Unabhängigkeit.** Der Helfer handelt als unabhängiger Fachmann.


**Arbeitserlaubnis und Einwanderung.** Der Helfer ist **allein verantwortlich** für das Erwerben/Beibehalten **aller erforderlichen Genehmigungen/Visa und Geschäftsregistrierungen** in jedem Interventionsland. Ulixai **prüft** solche Genehmigungen **nicht** und **übernimmt keine Haftung** dafür.


**Regulierte Dienstleistungen.** Der Helfer **darf** regulierte Dienstleistungen (z.B. rechtliche, medizinische, finanzielle, buchhalterische, Immobilienmakler usw.) **nicht** erbringen **ohne angemessene Lizenz/Genehmigung** und vollständige Einhaltung lokaler Gesetze; andernfalls muss sich der Helfer enthalten und den Benutzer an einen angemessen lizenzierten Fachmann weiterleiten.


**Allgemeine Compliance.** Der Helfer befolgt geltende Gesetze (Verbraucherschutz, E-Commerce, Werbung/Anwerbung, fairer Wettbewerb, AML/KYC, wo relevant, Steuern, Datenschutz, Sanktionen/Export, persönliche Sicherheit).


**Versicherung.** Der Helfer hält angemessene Versicherungen aufrecht.


**Vertraulichkeit.** Der Helfer schützt Benutzerinformationen.


---


## 4. Konto, Überprüfungen und Sicherheit


Ein Konto pro Helfer; genaues, vollständiges und aktuelles Profil. Ulixai kann angemessene Überprüfungen durchführen (ID, Profilkonsistenz, Sanktions-/KYC-Screenings über Prozessoren) und kann den Zugriff aus Sicherheits-, Compliance- oder Qualitätsgründen verweigern/aussetzen/widerrufen. Halten Sie Anmeldedaten sicher; Aktivität über das Konto gilt als Aktivität des Helfers.


---


## 5. Nutzungsregeln – Qualität, verbotenes Verhalten, keine Umgehung


Genaue Beschreibung; kein falscher beruflicher Status; keine Ergebnisgarantien.


**Verboten:** rechtswidrige/diskriminierende/trügerische Inhalte; unlautere Praktiken; Missbrauch von Daten; Rückwärts-Ingenieurwesen; Absprachen/Boykott; Verstöße gegen Sanktionen/Export; jede rechtswidrige Aktivität.


**Keine Umgehung:** **jede neue Verbindung mit einem neuen Benutzer** über die Plattform löst die **Verbindungsgebühr** aus; die Vermeidung der Plattform zur Umgehung von Gebühren bei einer neuen Vorstellung ist verboten.


**Verfügbarkeit:** Plattform wird **"wie gehabt"** bereitgestellt.


---


## 6. Helfer–Benutzer-Beziehung (außerhalb der Plattform)


Nach der Verbindung können Parteien **außerhalb der Plattform** einen Vertrag schließen. Der Helfer stellt lokale Dienstbestätigungen/Bedingungen, Rechnungen bereit und handhabt Steuern. Ulixai ist **nicht verantwortlich** für die Dienstleistungen oder Verpflichtungen des Helfers.


---


## 7. Gebühren, einmalige Zahlung und Steuern


**Festverbindungsgebühr.** **EUR 19 / USD 25** pro Verbindung, ausschließlich Steuern und Prozessorgebühren; Ulixai kann Beträge ändern und/oder **lokale Zeitpläne** nach Land/Währung mit prospektiver Wirkung veröffentlichen.


**Einmalige Zahlung und Aufteilung.** Der Benutzer zahlt **einen Betrag** über die Plattform, der (i) die Vergütung des Helfers (wie vereinbart) und (ii) die Verbindungsgebühr von Ulixai abdeckt. Ulixai (oder sein Prozessor) sammelt, **zieht** seine Gebühr ab, sendet dann den **Rest** an den Helfer, der solche **Abzüge autorisiert**.


**Fällig und nicht rückerstattbar.** Die Verbindungsgebühr wird bei der **Verbindung verdient** und ist **nicht rückerstattbar** (vorbehaltlich des diskretionierten guten Willens von Ulixai **insoweit gesetzlich zulässig** im Fall von nur Plattformfehlern).


**Benutzerrückerstattungen.** Falls gewährt, werden Rückerstattungen vom **Anteil des Helfers getragen**: Ulixai kann **gegen zukünftige Zahlungen zurückhalten/kompensieren** oder Rückerstattung fordern, falls keine ausstehend sind.


**Devisen** und **Steuern**: Prozessor-Devisensätze/-gebühren können gelten; Helfer ist für alle geltenden Steuern verantwortlich; Ulixai kassiert/überweist Mehrwertsteuer oder Ortsäquivalent auf die Verbindungsgebühr, wo erforderlich.


**Ausgleich** genehmigt.


---


## 8. Datenschutz (globales Rahmenwerk)


**Rollen.** Für Benutzerdaten, die für die Verbindung empfangen werden, handeln **Ulixai und der Helfer** jeweils als **unabhängiger Kontroller** für ihre eigenen Zwecke.


**Rechtsgrundlagen/Zwecke:** Vertragserfüllung, legitime Interessen (Sicherheit/Betrugsprävention/Serviceverbesserung), Rechtskonformität (AML/Sanktionen) und Zustimmung, wo zutreffend.


**Internationale Übertragungen** können mit angemessenen Schutzmaßnahmen erfolgen, wo erforderlich.


**Rechte und Kontakt** über das Kontaktformular der Plattform.


**Sicherheitsmaßnahmen** gelten; Verstöße werden wie erforderlich gemeldet. Der Helfer verarbeitet Daten gemäß dem Recht des Interventionslandes.


---


## 9. Geistiges Eigentum


Plattform-IP bleibt bei Ulixai. Der Helfer erhält ein **persönliches, nichtausschließliches, nichtübertragbares** Zugangsrecht während dieser Bedingungen. Der Helferinhalt wird unter **weltweiter, nichtausschließlicher** Basis an Ulixai lizenziert zum Hosten und Anzeigen.


---


## 10. Garantien, Haftung und Schadloshaltung


Keine Garantie für Ergebnisse/Qualität/Volumen; Plattform **"wie gehabt."**


**Haftungsbegrenzung:** insoweit gesetzlich zulässig ist Ulixais Gesamthaftung gegenüber dem Helfer auf **direkte Schäden** begrenzt und **darf nicht überschreiten** die Gesamtheit der **Verbindungsgebühren**, die Ulixai für die **Transaktion** erhielt, die zum Anspruch führte.


**Keine indirekten/Folge-/besonderen/Strafschäden.**


**Schadloshaltung:** Der Helfer wird Ulixai (und verbundene Unternehmen, Funktionäre, Mitarbeiter, Agenten) **schadlos halten und freistellen** gegen Ansprüche/Verluste/Kosten (einschließlich angemessene Anwaltsgebühren), die entstehen aus (i) Verstoß gegen diese Bedingungen/Gesetze, (ii) Helferinhalt, (iii) Helferdienste/Auslassungen, (iv) Fehlen von Arbeitserlaubnis/Einwanderung/Lizenzierung.


---


## 11. Anwendbares Recht – Schiedsverfahren – Estnische Gerichte – Klassenmaßnahmen


**Materielles Recht:** für jede Verbindung regeln **Gesetze des Interventionslandes** die Ulixai–Helfer-Beziehung, vorbehaltlich verbindlicher lokaler Regeln und zwingender internationaler Normen.


**Obligatorisches ICC-Schiedsverfahren** für jeden Ulixai–Helfer-Streit. **Sitz: Tallinn (Estland). Sprache: Französisch.** Tribunal wendet das oben definierte **materielle Recht** an. Verfahren sind **vertraulich**.


**Sammel-/Klasse-Klagen werden ausgeschlossen** insoweit gesetzlich zulässig.


**Ausschließliche Gerichtsbarkeit estnischer Gerichte** (Tallinn) für **nicht-schiedsrechtliche** Ansprüche, Durchsetzung von Schiedssprüchen und einstweilige Maßnahmen; Helfer verzichtet auf Einsprüche gegen Gerichtsstand/Forum non conveniens.


---


## 12. Sonstiges


**Abtretung**: Ulixai kann diese Bedingungen an ein Konzernunternehmen oder einen Nachfolger abtreten; Helfer kann ohne Zustimmung von Ulixai nicht abtreten.


**Gesamte Vereinbarung**: diese Bedingungen ersetzen frühere Abmachungen.


**Mitteilungen**: durch Veröffentlichung auf der Plattform, in der App oder über das Kontaktformular.


**Auslegung**: Überschriften sind zweckmäßig; kein **contra proferentem**.


**Sprachen**: Übersetzungen können bereitgestellt werden; **Französisch überwiegt** für die Auslegung.


**Salvatorische Klausel**: ungültige Bedingungen werden durch gültige mit gleichwertiger Wirkung ersetzt.


**Keine Verzichtserklärung**: Nichtgeltendmachung ist keine Verzichtserklärung.


---


## 13. Kontakt


Bei Fragen oder rechtlichen Anfragen kontaktieren Sie uns:
`;


  // Fallback de contenu par langue
  // const defaultContent: string = selectedLanguage === 'fr' ? defaultFr : defaultEn;
  const defaultContent: string = 
  selectedLanguage === 'fr' ? defaultFr :
  selectedLanguage === 'es' ? defaultEs :
  selectedLanguage === 'de' ? defaultDe :
  selectedLanguage === 'ru' ? defaultRu :
  selectedLanguage === 'hi' ? defaultHi :
  defaultEn;

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
              <p className="text-lg sm:text-2xl text-gray-300 max-w-3xl mx-auto">{t.subtitle}</p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-white/90">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 border border-white/20 backdrop-blur-sm">
                  <Shield className="w-4 h-4" /> <span>{t.keyFeatures}</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 border border-white/20 backdrop-blur-sm">
                  <Users className="w-4 h-4" /> <span>{t.trustedByHelpers}</span>
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
                { icon: <DollarSign className="w-6 h-6" />, text: t.features[0], gradient: 'from-green-500 to-emerald-500' },
                { icon: <Clock className="w-6 h-6" />, text: t.features[1], gradient: 'from-yellow-500 to-orange-500' },
                { icon: <Globe className="w-6 h-6" />, text: t.features[2], gradient: 'from-blue-500 to-purple-500' },
                { icon: <UserCheck className="w-6 h-6" />, text: t.features[3], gradient: 'from-red-500 to-orange-500' },
              ].map((f, i) => (
                <div
                  key={i}
                  className="group flex items-center gap-3 p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.01]"
                >
                  <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r ${f.gradient} text-white`}>
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
                <h2 className="text-xl sm:text-2xl font-black text-gray-900">{t.anchorTitle}</h2>
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
                    <span className="text-gray-700 group-hover:text-gray-900">{s.label}</span>
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
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">{t.readyToJoin}</h2>
            <p className="text-lg sm:text-2xl text-white/95 mb-10 leading-relaxed">{t.readySubtitle}</p>

            <div className="mb-8 flex flex-wrap items-center justify-center gap-3 text-white/90">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 border border-white/20 backdrop-blur-sm">
                <Shield className="w-4 h-4" /> Sécurisé
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 border border-white/20 backdrop-blur-sm">
                <Clock className="w-4 h-4" /> <span>Moins de 5&nbsp;minutes</span>
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
