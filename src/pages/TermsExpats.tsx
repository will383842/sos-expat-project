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
  const [selectedLanguage, setSelectedLanguage] = useState<'fr' | 'en' | 'es' | 'de' | 'ru' | 'hi' | 'ch'>(
    (language as 'fr' | 'en' | 'es' | 'de' | 'ru' | 'hi' | 'ch') || 'fr'
  );

  useEffect(() => {
    if (language) {
      setSelectedLanguage(language as 'fr' | 'en' | 'es' | 'de' | 'ru' | 'hi' | 'ch');
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
    lastUpdated: 'Version 2.2 – Dernière mise à jour : 16 juin 2029',
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
    lastUpdated: 'Version 2.2 – Last updated: 16 June 2029',
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
    lastUpdated: 'Versión 2.2 – Última actualización: 16 de junio de 2029',
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
    lastUpdated: 'Version 2.2 – Letzte Aktualisierung: 16. Juni 2029',
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
    lastUpdated: 'Версия 2.2 – Последнее обновление: 16 июня 2029 г.',
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
    lastUpdated: 'संस्करण 2.2 – अंतिम अपडेट: 16 जून 2029',
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
  ch: {
  title: '外籍助手服务条款',
  subtitle: '外籍助手使用条款',
  lastUpdated: '版本 2.2 – 最后更新：2029年6月16日',
  loading: '加载中...',
  joinNetwork: '加入网络',
  trustedByHelpers: '已有超过 1,000 名外籍助手信任我们',
  keyFeatures: '主要功能',
  features: [
    '7 天内保证付款',
    '全天候（24/7）技术支持',
    '移动端优化界面',
    '已验证用户',
  ],
  languageToggle: '切换语言',
  sections: {
    definitions: '定义',
    scope: '目的、适用范围与接受',
    status: '助手身份 – 合规与责任',
    account: '账户、审核与安全',
    rules: '使用规则 – 质量、禁止行为与禁止规避',
    relationship: '助手与用户关系（平台外）',
    fees: '费用、单次付款与税务',
    data: '数据保护（全球框架）',
    ip: '知识产权',
    liability: '保证、责任与赔偿',
    law: '适用法律 – ICC 仲裁 – 爱沙尼亚法院',
    misc: '其他条款',
    contact: '联系方式',
  },
  readyToJoin: '准备加入 SOS Expat 吗？',
  readySubtitle: '帮助外籍人士并发展您的咨询业务。',
  startNow: '立即开始',
  contactUs: '联系我们',
  anchorTitle: '概览',
  editHint: '可从管理控制台编辑文档',
  ctaHero: '查看专家',
  heroBadge: '新内容 — 条款已更新',
  contactForm: '联系表单',
}
 
};



  const t = translations[selectedLanguage];

  const handleLanguageChange = (newLang: 'fr' | 'en' | 'es' | 'de' | 'ru' | 'hi' | 'ch') => {
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

**Version 2.2 – Dernière mise à jour : 16 juin 2029**

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

11.4. **Compétence exclusive des tribunaux d'Estonie** : pour toute demande **non arbitrable**, l'**eximport React, { useEffect, useMemo, useState } from 'react';
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
  const [selectedLanguage, setSelectedLanguage] = useState<'fr' | 'en' | 'es' | 'de' | 'ru' | 'hi' | 'ch'>(
    (language as 'fr' | 'en' | 'es' | 'de' | 'ru' | 'hi' | 'ch') || 'fr'
  );

  useEffect(() => {
    if (language) {
      setSelectedLanguage(language as 'fr' | 'en' | 'es' | 'de' | 'ru' | 'hi' | 'ch');
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
    lastUpdated: 'Version 2.2 – Dernière mise à jour : 16 juin 2029',
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
    lastUpdated: 'Version 2.2 – Last updated: 16 June 2029',
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
    lastUpdated: 'Versión 2.2 – Última actualización: 16 de junio de 2029',
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
      law: 'Ley aplicable – Arbitraje – Jurisdicción estonienne',
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
    lastUpdated: 'Version 2.2 – Letzte Aktualisierung: 16. Juni 2029',
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
    lastUpdated: 'Версия 2.2 – Последнее обновление: 16 июня 2029 г.',
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
    lastUpdated: 'संस्करण 2.2 – अंतिम अपडेट: 16 जून 2029',
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
  ch: {
  title: '外籍助手服务条款',
  subtitle: '外籍助手使用条款',
  lastUpdated: '版本 2.2 – 最后更新：2029年6月16日',
  loading: '加载中...',
  joinNetwork: '加入网络',
  trustedByHelpers: '已有超过 1,000 名外籍助手信任我们',
  keyFeatures: '主要功能',
  features: [
    '7 天内保证付款',
    '全天候（24/7）技术支持',
    '移动端优化界面',
    '已验证用户',
  ],
  languageToggle: '切换语言',
  sections: {
    definitions: '定义',
    scope: '目的、适用范围与接受',
    status: '助手身份 – 合规与责任',
    account: '账户、审核与安全',
    rules: '使用规则 – 质量、禁止行为与禁止规避',
    relationship: '助手与用户关系（平台外）',
    fees: '费用、单次付款与税务',
    data: '数据保护（全球框架）',
    ip: '知识产权',
    liability: '保证、责任与赔偿',
    law: '适用法律 – ICC 仲裁 – 爱沙尼亚法院',
    misc: '其他条款',
    contact: '联系方式',
  },
  readyToJoin: '准备加入 SOS Expat 吗？',
  readySubtitle: '帮助外籍人士并发展您的咨询业务。',
  startNow: '立即开始',
  contactUs: '联系我们',
  anchorTitle: '概览',
  editHint: '可从管理控制台编辑文档',
  ctaHero: '查看专家',
  heroBadge: '新内容 — 条款已更新',
  contactForm: '联系表单',
}
 
};



  const t = translations[selectedLanguage];

  const handleLanguageChange = (newLang: 'fr' | 'en' | 'es' | 'de' | 'ru' | 'hi' | 'ch') => {
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

**Version 2.2 – Dernière mise à jour : 16 juin 2029**

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

11.4. **Compétence exclusive des tribunaux d'Estonie** : pour toute demande **non arbitrable**, l'**ex
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
const defaultCh = `
  使用条款 – 外籍协助者（全球）

SOS Expat by Ulixai OÜ（下称“平台”、“SOS”、“我们”）

版本 2.2 – 最后更新：2025年6月16日

1. 定义

协助者（Helper） 指在平台上注册，以独立身份向用户提供非法律、非医疗协助服务的人士（如方向指导、日常事务协助、非正式翻译、当地介绍等）。

用户（User） 指使用平台联系协助者的任何人。

连接（Connection） 指实现联系的技术或操作环节（包括共享联系方式、发起通话/消息/视频、以及协助者接受请求等）。

介入国家（Country of Intervention） 指用户在连接时主要提出请求的司法管辖区。

连接费用（Connection Fee） 指 19 欧元（EUR）（若以欧元支付）或 25 美元（USD）（若以美元支付），该金额可变，并可根据不同国家/货币的本地收费表进行前瞻性调整。

支付处理方（Payment Processors） 指负责收款和付款的第三方服务。

2. 目的、适用范围与接受

Ulixai 仅作为技术中介，并非协助者的雇主、代理人或合作伙伴；Ulixai 不提供任何法律、医疗、税务、会计或其他受监管的建议，也不参与协助者与用户之间的合同关系。

点击同意（Click-wrap acceptance） 构成电子签名与同意。SOS 可在发布后以前瞻性方式更新本条款和/或费用表。

专业身份（B2B）：协助者仅以专业身份行事；消费者保护法规不适用于 Ulixai 与协助者之间的关系。

3. 协助者身份 – 合规、许可与责任

独立性。 协助者以独立专业人士身份行事。

工作许可与移民。 协助者全权负责在每个介入国家获取/保持所需的许可证、签证及商业注册。Ulixai 不核实此类授权，也不承担任何责任。

受监管的服务。 协助者不得提供受监管的服务（如法律、医疗、金融、会计、不动产中介等），除非持有合法执照/授权并完全遵守当地法律；否则应停止并引导用户联系持证专业人士。

一般合规。 协助者遵守适用法律（消费者、电商、广告/招揽、公平竞争、反洗钱/客户识别、税务、数据保护、制裁/出口、个人安全等）。

保险。 协助者应保持适当的保险保障。

保密。 协助者应保护用户信息的机密性。

4. 账户、审查与安全

每位协助者仅限一个账户；资料应准确、完整并保持最新。Ulixai 可进行合理核查（身份证件、资料一致性、制裁/客户识别筛查等），并可因安全、合规或质量原因拒绝、暂停或撤销访问权限。协助者应妥善保管凭证；账户内的活动视为协助者本人行为。

5. 使用规则 – 质量、禁止行为、禁止规避

需准确描述，不得虚假宣称专业身份，不得保证结果。

**禁止行为：**违法、歧视、欺骗性内容；不公平行为；滥用数据；逆向工程；串通或抵制；违反制裁/出口规定；任何非法活动。

禁止规避： 通过平台与新用户建立的每次新连接均会触发连接费用；规避平台以逃避新引介费用的行为被禁止。

可用性： 平台按“原样提供”。

6. 协助者–用户关系（平台外）

连接完成后，双方可在平台外签订合同。协助者负责提供服务确认/条款、开具发票及处理税务。Ulixai 对协助者的服务或承诺不承担责任。

7. 费用、单次付款与税务

固定连接费。 每次连接 19 欧元 / 25 美元，不含税及支付处理费；Ulixai 可调整金额及/或按国家/货币公布本地收费表，并以前瞻性方式生效。

单次付款与分配。 用户通过平台支付一个总金额，涵盖：(i) 协助者的报酬（经双方约定），以及 (ii) Ulixai 的连接费。Ulixai（或其处理方）收款后扣除自身费用，再汇款余额给协助者；协助者授权此类扣除。

应得且不可退还。 连接费用自连接时即应计入并不可退还（若因平台自身原因失败，Ulixai 可在法律允许范围内酌情退款）。

用户退款。 若发生退款，将从协助者分成中承担：Ulixai 可抵扣未来付款或在无应付款项时要求返还。

汇率与税务： 支付处理方可能收取汇率/手续费；协助者负责所有适用税费；Ulixai 在需要时对连接费征收并缴纳增值税或本地等价税。

抵销权已获授权。

8. 数据保护（全球框架）

角色。 对于为实现连接而获得的用户数据，Ulixai 与协助者各自作为独立数据控制者并为各自目的处理。

法律依据与目的： 合同履行、合法利益（安全/防欺诈/服务改进）、法律合规（反洗钱/制裁）及在适用时的同意。

国际传输可能发生，并在需要时采取适当保障措施。

权利与联系方式：可通过平台联系表单行使。

安全措施适用；若发生数据泄露，将按要求通知。协助者根据介入国家法律处理数据。

9. 知识产权

平台知识产权归 Ulixai 所有。协助者在条款有效期内获得个人的、非独占、不可转让的访问权。协助者内容授予 Ulixai 全球范围内的非独占许可，用于托管与展示。

10. 免责声明、责任与赔偿

不对结果、质量或数量作任何保证；平台按“原样”提供。

责任上限： 在法律允许的最大范围内，Ulixai 对协助者的总责任限于直接损失，且不超过Ulixai 就引起索赔的交易所收取的连接费用总额。

不承担间接、后果性、特殊或惩罚性损害赔偿。

赔偿： 协助者应赔偿并使 Ulixai（及其关联方、管理人员、员工、代理人）免受损害，包括因 (i) 违反本条款或法律，(ii) 协助者内容，(iii) 协助者的服务或疏漏，(iv) 缺乏工作许可/移民/执照而引起的索赔、损失或费用（包括合理的律师费）。

11. 适用法律 – 国际商会仲裁 – 爱沙尼亚法院 – 集体诉讼放弃

实体法： 对每次连接，介入国家法律适用于 Ulixai 与协助者关系，但须受强制性当地法律及国际强行规范约束。

强制性 ICC 仲裁： 所有 Ulixai–协助者争议均提交国际商会仲裁。仲裁地：爱沙尼亚塔林。语言：法语。 仲裁庭适用上述实体法，程序保密。

放弃集体诉讼：在法律允许范围内放弃集体/联合诉讼权利。

非仲裁事项、执行与紧急措施由爱沙尼亚法院（塔林）专属管辖；协助者放弃有关管辖地/不便法院的异议。

12. 其他条款

转让： Ulixai 可将本条款转让给集团实体或继任者；协助者未经同意不得转让。

完整协议： 本条款取代此前所有理解与约定。

通知： 通过平台发布、应用内通知或联系表单发送。

解释： 标题仅为便利；不适用不利解释原则（contra proferentem）。

语言： 可提供翻译版本；如有歧义，以法语版本为准。

可分割性： 无效条款将由具有等效效果的有效条款替代。

不放弃： 未执行权利不构成放弃。

13. 联系方式

如有任何问题或法律请求，请联系我们：
`


  // Fallback de contenu par langue
  // const defaultContent: string = selectedLanguage === 'fr' ? defaultFr : defaultEn;
  const defaultContent: string = 
  selectedLanguage === 'fr' ? defaultFr :
  selectedLanguage === 'es' ? defaultEs :
  selectedLanguage === 'de' ? defaultDe :
  selectedLanguage === 'ru' ? defaultRu :
  selectedLanguage === 'hi' ? defaultHi :
  selectedLanguage === 'ch' ? defaultCh:
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
