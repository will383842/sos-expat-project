import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Users,
  Shield,
  Check,
  Globe,
  Clock,
  Languages,
  Sparkles,
  CreditCard,
  Phone,
  DollarSign,
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

const TermsClients: React.FC = () => {
  const { language } = useApp();

  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedLanguage, setSelectedLanguage] = useState<
    "fr" | "en" | "es" | "de" | "ru" | "hi"
  >((language as "fr" | "en" | "es" | "de" | "ru" | "hi")  || "fr");

  // Reste aligné avec la langue globale si elle change
  useEffect(() => {
    if (language)
      setSelectedLanguage(language as "fr" | "en" | "es" | "de" | "ru" | "hi");
  }, [language]);

  // Récupération du dernier document actif depuis Firestore (type: "terms")
  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setIsLoading(true);
        const q = query(
          collection(db, "legal_documents"),
          where("type", "==", "terms"),
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

  // Traductions UI
  const translations = {
    fr: {
      title: "CGU Clients",
      subtitle: "Conditions générales d'utilisation pour les clients",
      lastUpdated: "Version 2.2 – Dernière mise à jour : 16 juin 2025",
      loading: "Chargement...",
      languageToggle: "Changer de langue",
      keyFeatures: "Points clés",
      features: [
        "Paiement sécurisé",
        "Remboursement si pas de mise en relation",
        "3 tentatives d’appel",
        "Prestataires vérifiés",
      ],
      anchorTitle: "Sommaire",
      editHint: "Document éditable depuis la console admin",
      heroBadge: "Nouveau — Conditions mises à jour",
      contactUs: "Nous contacter",
      contactForm: "Formulaire de contact",
      readyToUse: "Prêt à utiliser SOS Expat ?",
      readySubtitle:
        "Réservez un appel avec un avocat ou un aidant en quelques minutes, partout dans le monde.",
      seeHowItWorks: "Voir comment ça marche",
    },
    en: {
      title: "Client Terms",
      subtitle: "General terms of use for customers",
      lastUpdated: "Version 2.2 – Last updated: 16 June 2025",
      loading: "Loading...",
      languageToggle: "Switch language",
      keyFeatures: "Key features",
      features: [
        "Secure payment",
        "Refund if no connection",
        "3 call attempts",
        "Verified providers",
      ],
      anchorTitle: "Overview",
      editHint: "Document editable from the admin console",
      heroBadge: "New — Terms updated",
      contactUs: "Contact us",
      contactForm: "Contact Form",
      readyToUse: "Ready to use SOS Expat?",
      readySubtitle:
        "Book a call with a lawyer or a helper in minutes, anywhere in the world.",
      seeHowItWorks: "See how it works",
    },
    es: {
      title: "Términos del Cliente",
      subtitle: "Condiciones generales de uso para clientes",
      lastUpdated: "Versión 2.2 – Última actualización: 16 de junio de 2025",
      loading: "Cargando...",
      languageToggle: "Cambiar idioma",
      keyFeatures: "Características clave",
      features: [
        "Pago seguro",
        "Reembolso si no hay conexión",
        "3 intentos de llamada",
        "Proveedores verificados",
      ],
      anchorTitle: "Resumen",
      editHint: "Documento editable desde la consola de administración",
      heroBadge: "Nuevo — Términos actualizados",
      contactUs: "Contáctanos",
      contactForm: "Formulario de contacto",
      readyToUse: "¿Listo para usar SOS Expat?",
      readySubtitle:
        "Reserve una llamada con un abogado o un ayudante en minutos, en cualquier parte del mundo.",
      seeHowItWorks: "Ver cómo funciona",
    },
    de: {
      title: "Kundenbedingungen",
      subtitle: "Allgemeine Nutzungsbedingungen für Kunden",
      lastUpdated: "Version 2.2 – Letzte Aktualisierung: 16. Juni 2025",
      loading: "Wird geladen...",
      languageToggle: "Sprache wechseln",
      keyFeatures: "Wichtige Merkmale",
      features: [
        "Sichere Zahlung",
        "Rückerstattung bei fehlender Verbindung",
        "3 Anrufversuche",
        "Verifizierte Anbieter",
      ],
      anchorTitle: "Übersicht",
      editHint: "Dokument bearbeitbar über die Admin-Konsole",
      heroBadge: "Neu — Bedingungen aktualisiert",
      contactUs: "Kontaktieren Sie uns",
      contactForm: "Kontaktformular",
      readyToUse: "Bereit, SOS Expat zu nutzen?",
      readySubtitle:
        "Buchen Sie in wenigen Minuten ein Gespräch mit einem Anwalt oder Helfer, überall auf der Welt.",
      seeHowItWorks: "Wie es funktioniert",
    },
    ru: {
      title: "Условия для клиентов",
      subtitle: "Общие условия использования для клиентов",
      lastUpdated: "Версия 2.2 – Последнее обновление: 16 июня 2025",
      loading: "Загрузка...",
      languageToggle: "Сменить язык",
      keyFeatures: "Ключевые особенности",
      features: [
        "Безопасная оплата",
        "Возврат, если нет связи",
        "3 попытки звонка",
        "Проверенные поставщики",
      ],
      anchorTitle: "Обзор",
      editHint: "Документ редактируется через консоль администратора",
      heroBadge: "Новое — Условия обновлены",
      contactUs: "Свяжитесь с нами",
      contactForm: "Контактная форма",
      readyToUse: "Готовы использовать SOS Expat?",
      readySubtitle:
        "Забронируйте звонок с юристом или помощником за несколько минут, в любой точке мира.",
      seeHowItWorks: "Как это работает",
    },
      hi: {
    title: "ग्राहक शर्तें",
    subtitle: "ग्राहकों के लिए सामान्य उपयोग की शर्तें",
    lastUpdated: "संस्करण 2.2 – अंतिम अपडेट: 16 जून 2025",
    loading: "लोड हो रहा है...",
    languageToggle: "भाषा बदलें",
    keyFeatures: "मुख्य विशेषताएं",
    features: [
      "सुरक्षित भुगतान",
      "कोई संपर्क नहीं होने पर रिफंड",
      "3 कॉल प्रयास",
      "सत्यापित प्रदाता",
    ],
    anchorTitle: "सारांश",
    editHint: "एडमिन कंसोल से संपादन योग्य दस्तावेज़",
    heroBadge: "नया — शर्तें अपडेट की गईं",
    contactUs: "हमसे संपर्क करें",
    contactForm: "संपर्क फॉर्म",
    readyToUse: "SOS Expat का उपयोग करने के लिए तैयार हैं?",
    readySubtitle:
      "दुनिया में कहीं भी, मिनटों में एक वकील या सहायक के साथ कॉल बुक करें।",
    seeHowItWorks: "यह कैसे काम करता है देखें",
  },
  };

  const t = translations[selectedLanguage];

  const handleLanguageChange = (newLang: "fr" | "en") => {
    setSelectedLanguage(newLang);
  };

  // ------- Parser Markdown (aligné avec TermsExpats / TermsLawyers) -------
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

      // H2 (avec numéro optionnel)
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
        const subtitle = line.substring(4).replace(/\*\*/g, "");
        elements.push(
          <h3
            key={currentIndex++}
            className="text-lg font-bold text-gray-800 mt-6 mb-4 border-l-4 border-blue-500 pl-4"
          >
            {subtitle}
          </h3>
        );
        continue;
      }

      // Points numérotés 1.1 / 2.4 / …
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

      // Ligne entièrement en gras
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

      // Bloc contact spécial
      if (
        line.toLowerCase().includes("contact form") ||
        line.toLowerCase().includes("formulaire de contact") ||
        line.toLowerCase().includes("http://localhost:5174/contact")
      ) {
        elements.push(
          <div
            key={currentIndex++}
            className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-8 my-8 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold shadow-lg">
                15
              </span>
              {selectedLanguage === "fr" ? "Contact" : "Contact"}
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
              {t.contactForm}
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

  // --------- Contenu par défaut (bilingue, selon la langue) ----------


  const defaultHi = `
# सामान्य शर्तें – ग्राहक (वैश्विक)

**Ulixai OÜ द्वारा SOS Expat** ("प्लेटफ़ॉर्म", "SOS", "हम")

**संस्करण 2.2 – अंतिम अपडेट: 16 जून 2025**

---

## 1. उद्देश्य और दायरा

ये शर्तें किसी भी व्यक्ति या संस्था द्वारा प्लेटफ़ॉर्म के उपयोग को नियंत्रित करती हैं जो ग्राहक खाता बनाता है और सेवा बुक करता है ("ग्राहक")। **SOS Expat एक मेलमिलाप प्लेटफ़ॉर्म है** जो ग्राहकों को स्वतंत्र **वकीलों** और स्वतंत्र **सहायकों** से जोड़ता है। Ulixai **कानूनी फर्म नहीं है** और कोई कानूनी/चिकित्सा/कर/विनियमित सलाह प्रदान नहीं करता है और ग्राहक-प्रदाता अनुबंध का **भाग नहीं** है।

---

## 2. खाते, पात्रता और उपयोग

- **18+ और कानूनी क्षमता।** कॉर्पोरेट उपयोगकर्ता प्राधिकार की गारंटी देते हैं।
- **सटीक जानकारी** प्रदान की जानी चाहिए और अद्यतन रखी जानी चाहिए।
- **कोई अवैध/अपमानजनक उपयोग नहीं**; प्लेटफ़ॉर्म **आपातकालीन सेवा नहीं** है।
- **उपलब्धता** "जैसा है" के आधार पर है।

---

## 3. बुक करने योग्य सेवाएं

वकीलों के साथ संक्षिप्त कानूनी मार्गदर्शन कॉल (उदाहरण के लिए, 20 मिनट) और सहायकों के साथ गैर-विनियमित सहायता। परिणाम/गुणवत्ता/उपलब्धता के बारे में **कोई गारंटी नहीं**।

---

## 4. मूल्य, मुद्राएं और कनेक्शन शुल्क

दिखाई गई **कुल कीमत** में शामिल हैं (i) प्रदाता का पारिश्रमिक और (ii) SOS का **फ्लैट कनेक्शन शुल्क**। **कनेक्शन शुल्क:** प्रति कनेक्शन **19 EUR** या **25 USD** (कर अलग से), परिवर्तन के अधीन और/या भविष्य के प्रभाव के साथ स्थानीय अनुसूचियां। **FX और भुगतान प्रोसेसर शुल्क** लागू हो सकते हैं। कनेक्शन शुल्क पर जहां आवश्यक हो कर शामिल हैं; प्रदाता अपने स्वयं के करों के लिए जिम्मेदार हैं।

---

## 5. बुकिंग, कॉलिंग और प्रयास

संपर्क विवरण का आदान-प्रदान करने और/या कॉल/संदेश/वीडियो चैनल खोलने और/या प्रदाता स्वीकृति पर **कनेक्शन** होता है। तत्काल कॉल के लिए ~15 मिनट के भीतर **तीन (3) प्रयासों** तक। प्रयासों के बाद **यदि कोई कनेक्शन नहीं**, तो **पूर्ण रिफंड**। यदि कनेक्शन हुआ लेकिन ग्राहक संलग्न होने में विफल रहा (कोई उत्तर नहीं/अस्वीकृति/जल्दी समाप्ति), तो **भुगतान देय रहता है** और वापसी योग्य नहीं है।

---

## 6. वापसी का अधिकार (उपभोक्ता) और तत्काल प्रदर्शन

जहां अनिवार्य स्थानीय कानून वापसी का अधिकार प्रदान करता है, यह लागू हो सकता है जब तक कि ग्राहक **तत्काल प्रदर्शन** का अनुरोध नहीं करता। तत्काल या निकट-अवधि कॉल बुक करके, ग्राहक तत्काल प्रदर्शन का अनुरोध करता है और स्वीकार करता है कि एक बार **पूरी तरह से प्रदर्शन** हो जाने पर, वापसी का अधिकार खो जाता है; यदि वापसी से पहले **आंशिक रूप से प्रदर्शन** किया गया, तो ग्राहक को प्रदर्शन किए गए भाग और **गैर-वापसी योग्य कनेक्शन शुल्क** के लिए भुगतान करना होगा। प्लेटफ़ॉर्म जहां आवश्यक हो **स्पष्ट सहमति** एकत्र करता है।

---

## 7. भुगतान, सुरक्षा, चार्जबैक

**एकल भुगतान और विभाजन:** ग्राहक प्रदाता के हिस्से और कनेक्शन शुल्क को कवर करने वाली एक राशि का भुगतान करता है। SOS (या इसका प्रोसेसर) **एकत्र करता है**, अपना शुल्क **काटता है**, और शेष को प्रदाता को **भेजता है**। तीसरे पक्ष के प्रोसेसर के माध्यम से भुगतान; **AML/KYC** लागू हो सकता है। **चार्जबैक/विवाद** के मामले में, SOS प्रोसेसर के साथ सख्ती से आवश्यक डेटा साझा कर सकता है और संबंधित सेवाओं/भुगतानों को निलंबित कर सकता है। **सेट-ऑफ:** ग्राहकों को धनवापसी प्रदाता के हिस्से द्वारा वहन की जाती है; SOS भविष्य के भुगतानों के खिलाफ ऑफसेट कर सकता है।

---

## 8. रद्दीकरण और धनवापसी

जब तक अनिवार्य कानून अन्यथा प्रदान नहीं करता: एक बार कनेक्शन होने पर **कनेक्शन शुल्क गैर-वापसी योग्य है**; प्रदर्शन शुरू होने के बाद प्रदाता का हिस्सा गैर-वापसी योग्य है, प्रदाता की सद्भावना को बचाएं। **कनेक्शन से पहले:** पूर्ण धनवापसी। **प्रदाता रद्दीकरण:** पूर्ण धनवापसी। **प्लेटफ़ॉर्म-दोष तकनीकी मामले:** कानून द्वारा अनुमत सीमा तक SOS के विवेक पर धनवापसी या क्रेडिट।

---

## 9. आचरण, सुरक्षा और सामग्री

सम्मानजनक व्यवहार; कोई गैरकानूनी रिकॉर्डिंग/वितरण नहीं; अवैध कृत्यों की कोई याचिका नहीं। ग्राहक जानकारी वैध, सटीक और निष्पक्ष होनी चाहिए। दुरुपयोग संपर्क फॉर्म के माध्यम से रिपोर्ट किया जा सकता है।

---

## 10. डेटा सुरक्षा

अलग नियंत्रक: **SOS** और **प्रदाता** प्रत्येक अपने स्वयं के उद्देश्यों के लिए व्यक्तिगत डेटा को संसाधित करते हैं (अनुबंध निष्पादन, सुरक्षा/धोखाधड़ी रोकथाम/सेवा सुधार, AML/प्रतिबंध, जहां लागू हो सहमति)। जहां आवश्यक हो सुरक्षा उपायों के साथ **अंतर्राष्ट्रीय स्थानांतरण**। संपर्क फॉर्म के माध्यम से **अधिकार और संपर्क**। सुरक्षा उपाय; आवश्यकतानुसार उल्लंघन अधिसूचनाएं।

---

## 11. बौद्धिक संपदा

प्लेटफ़ॉर्म IP Ulixai के पास रहता है; ग्राहक को **व्यक्तिगत, सीमित** पहुंच का अधिकार प्राप्त होता है।

---

## 12. उत्तरदायित्व

प्रदाता **स्वतंत्र** हैं; SOS उनकी सेवाओं/परिणामों के लिए उत्तरदायी नहीं है। अधिकतम अनुमत सीमा तक, सिद्ध प्रत्यक्ष क्षति के लिए SOS की **उत्तरदायित्व सीमा** संबंधित बुकिंग के लिए **भुगतान की गई कुल कीमत** है; **कोई अप्रत्यक्ष/विशेष/परिणामी क्षति नहीं**, जहां अनुमति हो।

---

## 13. शासी कानून, विवाद और अदालतें

**सामग्री कानून:** सेवा द्वारा कवर किए गए प्रत्येक देश के लिए, **हस्तक्षेप के देश** के कानून निवास पर ग्राहक के अनिवार्य उपभोक्ता अधिकारों के पूर्वाग्रह के बिना SOS-ग्राहक संबंध को नियंत्रित करते हैं। **पूरक:** एस्टोनियाई कानून व्याख्या/वैधता और स्थानीय कानून द्वारा शासित किसी भी मामले को नियंत्रित करता है। **ICC मध्यस्थता:** **गैर-उपभोक्ताओं** के लिए अनिवार्य (स्थान: तेलिन, एस्टोनिया; भाषा: फ्रेंच; गोपनीय)। **उपभोक्ता** ICC मध्यस्थता का विकल्प चुन सकते हैं या अनिवार्य कानून के तहत उपलब्ध अदालतों का उपयोग कर सकते हैं। **एस्टोनियाई अदालतों (तेलिन)** के पास गैर-मध्यस्थता योग्य दावों, पुरस्कार प्रवर्तन और तत्काल उपायों के लिए विशेष अधिकार क्षेत्र है, उपभोक्ता अनिवार्य अधिकारों के अधीन। **कक्षा/सामूहिक कार्रवाइयों को छोड़ दिया गया है** कानून द्वारा अनुमत सीमा तक।

---

## 14. समाप्ति/निलंबन और विविध

हम धोखाधड़ी, गैर-अनुपालन, दुरुपयोग या कानूनी जोखिम के लिए खातों को निलंबित/बंद कर सकते हैं। व्याख्या के लिए **फ्रेंच प्रबल होती है**। **पृथक्करणीयता** और **गैर-छूट** लागू होती है। पोस्टिंग/इन-ऐप या संपर्क फॉर्म के माध्यम से नोटिस।

---

## 15. संपर्क

**संपर्क फॉर्म (सहायता और कानूनी अनुरोध):** [**http://localhost:5174/contact**](http://localhost:5174/contact)
`;

  const defaultFr = `
# Conditions Générales – Clients (Global)

**SOS Expat d’Ulixai OÜ** (la « Plateforme », « SOS », « nous »)

**Version 2.2 – Dernière mise à jour : 16 juin 2025**

---

## 1. Objet et champ d’application

1.1. Les présentes conditions générales (« CGV ») régissent l’utilisation de la Plateforme par toute personne physique ou morale qui crée un compte client et réserve un service via la Plateforme (le « Client »).

1.2. **Rôle d’Ulixai.** SOS Expat est une plateforme de mise en relation : (i) avec des avocats indépendants (« Avocats »), et/ou (ii) avec des expatriés aidants indépendants (« Aidants »). Ulixai n’est pas un cabinet d’avocats, ne fournit aucun conseil juridique, médical, fiscal ou réglementé, et n’est pas partie au contrat de prestation conclu entre le Client et le prestataire (Avocat/Aidant).

1.3. **Acceptation électronique (click-wrap).** En cochant la case d’acceptation et/ou en utilisant la Plateforme, le Client accepte les présentes CGV (signature électronique). SOS peut conserver des preuves techniques (horodatage, identifiants).

1.4. **Modifications.** Nous pouvons mettre à jour les CGV et/ou les tarifs/frais avec effet prospectif par publication sur la Plateforme. La poursuite d’usage vaut acceptation.

---

## 2. Comptes, éligibilité et usage

2.1. **Âge et capacité.** Le Client déclare avoir 18 ans révolus et la capacité juridique. Pour les personnes morales, l’utilisateur déclare être habilité à engager la société.

2.2. **Exactitude des informations.** Les informations fournies (identité, moyens de contact, pays, objet de la demande) doivent être exactes et à jour.

2.3. **Usage conforme.** Le Client s’interdit toute utilisation illicite ou abusive (fraude, contenu illégal, harcèlement, atteinte aux droits de tiers, détournement des flux de paiement, etc.). Aucun usage pour des situations médicales ou vitales d’urgence ; SOS n’est pas un service d’urgence.

2.4. **Disponibilité.** La Plateforme est fournie « en l’état » : aucune disponibilité ininterrompue n’est garantie (maintenance, incidents, force majeure).

---

## 3. Nature des services réservables

3.1. **Appels avec Avocats.** Consultations courtes d’orientation (par ex. 20 minutes). L’Avocat demeure seul responsable de ses conseils et du respect de sa déontologie/lois locales.

3.2. **Appels avec Aidants.** Aide non réglementée (orientation pratique, traduction informelle, contacts locaux…). Aucun conseil juridique/médical/réglementé sans licence locale adéquate.

3.3. **Aucune garantie.** Nous ne garantissons ni l’issue, ni la qualité, ni l’adéquation à un besoin particulier, ni la disponibilité des prestataires.

---

## 4. Prix, devises et frais de mise en relation

4.1. **Affichage des prix.** Le prix total affiché au moment de la réservation inclut : (i) la rémunération du prestataire (Avocat/Aidant) fixée selon l’offre présentée, et (ii) les frais de mise en relation dus à SOS (forfait).

4.2. **Frais de mise en relation (forfait).** 19 € (EUR) ou 25 $ (USD) par mise en relation (hors taxes), intégrés dans le prix total. SOS peut modifier ce forfait et/ou publier des barèmes locaux par pays/devise avec effet prospectif.

4.3. **Devises & conversion.** Les prix peuvent être proposés en plusieurs devises. Des frais/taux de change du prestataire de paiement peuvent s’appliquer.

4.4. **Taxes.** Les prix affichés incluent, le cas échéant, la TVA ou taxes applicables sur les frais de mise en relation. Les Prestataires demeurent responsables de leurs propres obligations fiscales.

---

## 5. Réservation, appel et tentatives de contact

5.1. **Définition de « mise en relation ».** Est réputée intervenue : (a) la transmission des coordonnées Client–Prestataire, et/ou (b) l’ouverture par la Plateforme d’un canal d’appel/messagerie/visio, et/ou (c) l’acceptation par le Prestataire d’une demande du Client.

5.2. **Tentatives d’appel.** En cas d’appel immédiat : la Plateforme effectue jusqu’à trois (3) tentatives sur une fenêtre d’environ 15 minutes (sauf indication différente in-app).

5.3. **Indisponibilité du prestataire.** Si aucune mise en relation n’a pu être réalisée après les tentatives, la réservation est annulée et le Client est remboursé intégralement du prix total payé.

5.4. **Non-réponse du Client.** Si la mise en relation a eu lieu (au sens 5.1) mais que le Client n’aboutit pas à un échange effectif (non-réponse, occupation, refus, arrêt prématuré), le paiement demeure dû et non remboursable.

5.5. **Qualité de la communication.** Le Client doit se trouver en zone de couverture suffisante et utiliser un équipement compatible. SOS n’est pas responsable des coupures/réseaux tiers.

---

## 6. Droit de rétractation (consommateurs) & exécution immédiate

6.1. **Information.** Si le Client est consommateur et la loi impérative locale prévoit un droit de rétractation, celui-ci peut s’exercer dans les délais légaux sauf si le Client demande l’exécution immédiate du service.

6.2. **Renonciation.** En réservant un appel immédiat ou programmé avant l’expiration du délai légal, le Client demande l’exécution immédiate et reconnaît que, une fois la prestation pleinement exécutée, il perd son droit de rétractation. En cas d’exécution partielle avant rétractation, le Client doit payer la partie déjà fournie et les frais de mise en relation, non remboursables.

6.3. **Formalisme.** La Plateforme recueille l’acceptation explicite de ces points lors de la réservation, lorsque requis.

---

## 7. Paiement, sécurité, rétrofacturations

7.1. **Paiement unique & répartition.** Le Client règle un paiement unique via la Plateforme couvrant (i) la part Prestataire et (ii) les frais de mise en relation. SOS (ou son prestataire de paiement) encaisse, déduit ses frais, puis reverse le solde au Prestataire.

7.2. **Sécurité.** Les paiements transitent par des prestataires de paiement tiers. Des contrôles KYC/LCB-FT peuvent s’appliquer.

7.3. **Rétrofacturations/contestation.** En cas de litige de paiement, SOS peut transmettre au prestataire de paiement les données strictement nécessaires et suspendre des services/paiements liés.

7.4. **Compensation.** Si un remboursement est accordé au Client, la part correspondante est prélevée sur le prestataire concerné ; SOS peut compenser sur ses paiements futurs.

---

## 8. Annulations et remboursements

8.1. **Général.** Sauf dispositions légales impératives :
- les frais de mise en relation sont non remboursables dès la mise en relation (5.1) ;
- la part Prestataire est non remboursable une fois la prestation commencée, sauf geste commercial du Prestataire.

8.2. **Annulation par le Client avant mise en relation.** Remboursement intégral.

8.3. **Annulation par le Prestataire.** Remboursement intégral. SOS peut proposer un re-routing vers un autre prestataire disponible.

8.4. **Cas techniques imputables à SOS.** Remboursement ou re-crédit à la discrétion de SOS, dans la mesure permise par la loi.

---

## 9. Comportements, sécurité et contenus

9.1. **Respect.** Le Client s’engage à un comportement respectueux, à ne pas enregistrer ni diffuser l’échange sans consentement légalement requis, et à ne pas solliciter d’actes illégaux.

9.2. **Contenus fournis.** Les informations transmises doivent être loyales, exactes et licites. Le Client garantit SOS et le Prestataire contre toute réclamation liée à des contenus illégaux qu’il fournirait.

9.3. **Signalement.** Tout abus peut être signalé via le formulaire de contact.

---

## 10. Données personnelles

10.1. **Rôles.** Pour les données strictement nécessaires à la mise en relation, SOS et le Prestataire agissent chacun en responsable de traitement pour leurs finalités propres.

10.2. **Bases & finalités.** Exécution du contrat (réservation), intérêts légitimes (sécurité, prévention de la fraude, amélioration), compliance (LCB-FT/sanctions) et consentement si requis.

10.3. **Transferts internationaux** possibles avec garanties appropriées.

10.4. **Droits & contact.** Exercice via le formulaire de contact de la Plateforme.

10.5. **Sécurité.** Mesures techniques/organisationnelles raisonnables ; notification des violations requises par la loi.

---

## 11. Propriété intellectuelle

La Plateforme, ses marques, logos, bases de données et contenus sont protégés. Aucun droit n’est cédé au Client. L’usage est strictement limité à un accès personnel conformément aux CGV.

---

## 12. Responsabilité

12.1. **Prestataires indépendants.** Le Client reconnaît que les Avocats et Aidants sont indépendants. SOS n’est pas responsable des conseils/services fournis ni de leur résultat.

12.2. **Limitations.** Dans la mesure permise par la loi, la responsabilité de SOS pour un dommage direct prouvé est limitée au prix total payé par le Client pour la réservation concernée. SOS n’est pas responsable des dommages indirects/spéciaux/consécutifs (perte de chance, de profits, d’image, etc.), dans la mesure permise.

12.3. **Aucune garantie.** SOS ne garantit pas la disponibilité continue de la Plateforme ni l’absence d’erreurs.

---

## 13. Droit applicable, règlement des litiges et tribunaux compétents

13.1. **Droit matériel.** Pour chaque service couvrant un pays donné, la relation SOS–Client est régie par les lois du pays d’intervention sans priver le Client consommateur de ses droits impératifs de résidence. À titre supplétif, le droit estonien régit l’interprétation/validité des CGV et toute question non régie par ce droit local.

13.2. **Arbitrage CCI (option consommateur) / obligatoire non-consommateur.**
- **Client non-consommateur (B2B)** : arbitrage CCI obligatoire, siège : Tallinn (Estonie), langue : français, droit matériel selon 13.1, procédure confidentielle.
- **Client consommateur** : option de recourir à l’arbitrage CCI (mêmes modalités) ou aux juridictions compétentes en vertu des lois impératives applicables.

13.3. **Compétence des tribunaux estoniens (Tallinn).** Pour toute demande non arbitrable, l’exécution des sentences ou les mesures urgentes, compétence exclusive des tribunaux d’Estonie (Tallinn), sans préjudice des droits impératifs du consommateur.

13.4. **Renonciation aux actions collectives (dans la mesure permise).** Toute action collective/de groupe/représentative est exclue, sauf si la loi impérative du lieu de résidence du consommateur en dispose autrement.

---

## 14. Résiliation/suspension et divers

14.1. **Suspension.** SOS peut suspendre/fermer le compte en cas de fraude, non-conformité, abus ou risque juridique.

14.2. **Intégralité.** Les CGV constituent l’accord complet entre SOS et le Client pour l’usage de la Plateforme.

14.3. **Langues.** Des traductions peuvent être fournies ; le français prévaut pour l’interprétation.

14.4. **Nullité partielle.** Si une stipulation est nulle/inapplicable, le reste demeure en vigueur ; elle pourra être remplacée par une clause valide d’effet équivalent.

14.5. **Non-renonciation.** Le fait de ne pas exercer un droit n’emporte pas renonciation.

---

## 15. Contact

**Formulaire de contact (support & demandes légales)** : **http://localhost:5174/contact**
`;

  const defaultEn = `
# General Terms – Customers (Global)

**SOS Expat by Ulixai OÜ** (the “Platform”, “SOS”, “we”)

**Version 2.2 – Last updated: 16 June 2025**

---

## 1. Purpose and Scope

These Terms govern the use of the Platform by any person or entity creating a customer account and booking a service (the “Customer”). **SOS Expat is a matchmaking platform** connecting Customers with independent **Lawyers** and independent **Helpers**. Ulixai is **not a law firm** and provides no legal/medical/tax/regulated advice and is **not** a party to the Customer–Provider contract.

---

## 2. Accounts, Eligibility and Use

- **18+ and legal capacity.** Corporate users warrant authority.
- **Accurate information** must be provided and kept up to date.
- **No illegal/abusive use**; the Platform is **not** an emergency service.
- **Availability** is “as is.”

---

## 3. Bookable Services

Short legal orientation calls with Lawyers (e.g., 20 minutes) and non-regulated assistance with Helpers. **No guarantees** as to outcome/quality/availability.

---

## 4. Prices, Currencies and Connection Fee

The **total price** shown includes (i) the Provider’s remuneration and (ii) SOS’s **flat Connection Fee**. **Connection Fee:** **EUR 19** or **USD 25** per Connection (excl. taxes), subject to change and/or local schedules with prospective effect. **FX and payment processor charges** may apply. Taxes included where required on the Connection Fee; Providers are responsible for their own taxes.

---

## 5. Booking, Calling and Attempts

A **Connection** occurs upon exchanging contact details and/or opening a call/message/video channel and/or Provider acceptance. Up to **three (3) attempts** within ~15 minutes for immediate calls. **If no Connection** after attempts, **full refund**. If a Connection occurred but the Customer fails to engage (no answer/refusal/early termination), **payment remains due** and non-refundable.

---

## 6. Withdrawal Right (Consumers) & Immediate Performance

Where mandatory local law grants a withdrawal right, it may apply unless the Customer requests **immediate performance**. By booking an immediate or near-term call, the Customer requests immediate performance and acknowledges that once **fully performed**, the withdrawal right is lost; if **partially performed** before withdrawal, the Customer must pay for the part performed and the **non-refundable Connection Fee**. The Platform collects **explicit consent** where required.

---

## 7. Payment, Security, Chargebacks

**Single payment & split:** Customer pays one amount covering the Provider’s share and the Connection Fee. SOS (or its processor) **collects**, **deducts** its Fee, and **remits** the remainder to the Provider. Payments via third-party processors; **AML/KYC** may apply. In case of **chargeback/dispute**, SOS may share strictly necessary data with the processor and suspend related services/payouts. **Set-off:** refunds to Customers are borne by the Provider’s share; SOS may offset against future payouts.

---

## 8. Cancellations and Refunds

Unless mandatory law provides otherwise: the **Connection Fee is non-refundable** once a Connection occurs; the Provider’s share is non-refundable once performance starts, save goodwill by the Provider. **Before Connection:** full refund. **Provider cancellation:** full refund. **Platform-fault technical cases:** refund or credit at SOS’s discretion to the extent permitted by law.

---

## 9. Conduct, Safety and Content

Respectful behaviour; no unlawful recording/distribution; no solicitation of illegal acts. Customer information must be lawful, accurate and fair. Abuse can be reported via the contact form.

---

## 10. Data Protection

Separate controllers: **SOS** and the **Provider** each process personal data for their own purposes (contract performance, security/fraud prevention/service improvement, AML/sanctions, consent where applicable). **International transfers** with safeguards where required. **Rights & contact** via the contact form. Security measures; breach notifications as required.

---

## 11. IP

Platform IP remains with Ulixai; Customer receives a **personal, limited** right of access.

---

## 12. Liability

Providers are **independent**; SOS is not liable for their services/results. To the maximum extent permitted, SOS’s **liability cap** for proven direct damage is the **total price paid** for the relevant booking; **no indirect/special/consequential damages**, where permitted.

---

## 13. Governing Law, Disputes and Courts

**Substantive law:** for each country covered by the service, the laws of the **Country of Intervention** govern the SOS–Customer relationship without prejudice to the Customer’s mandatory consumer rights at residence. **Supplementary:** Estonian law governs interpretation/validity and any matter not governed by local law. **ICC arbitration:** mandatory for **non-consumers** (seat: Tallinn, Estonia; language: French; confidential). **Consumers** may opt-in to ICC arbitration or use courts available under mandatory law. **Estonian courts (Tallinn)** have exclusive jurisdiction for non-arbitrable claims, award enforcement and urgent measures, subject to consumer mandatory rights. **Class/collective actions are waived** to the extent permitted by law.

---

## 14. Termination/Suspension and Miscellaneous

We may suspend/close accounts for fraud, non-compliance, abuse or legal risk. **French prevails** for interpretation. **Severability** and **no-waiver** apply. Notices by posting/in-app or via contact form.

---

## 15. Contact

**Contact form (support & legal requests):** **http://localhost:5174/contact**
`;

  const defaultEs = `
# Términos Generales – Clientes (Global)

**SOS Expat de Ulixai OÜ** (la "Plataforma", "SOS", "nosotros")

**Versión 2.2 – Última actualización: 16 de junio de 2025**

---

## 1. Propósito y Alcance

Estos Términos rigen el uso de la Plataforma por cualquier persona o entidad que cree una cuenta de cliente y reserve un servicio (el "Cliente"). **SOS Expat es una plataforma de conexión** que conecta a Clientes con **Abogados** independientes y **Ayudantes** independientes. Ulixai **no es un bufete de abogados** y no proporciona asesoramiento legal/médico/fiscal/regulado y **no** es parte del contrato Cliente-Proveedor.

---

## 2. Cuentas, Elegibilidad y Uso

- **18+ y capacidad legal.** Los usuarios corporativos garantizan autoridad.
- **Información precisa** debe proporcionarse y mantenerse actualizada.
- **Sin uso ilegal/abusivo**; la Plataforma **no** es un servicio de emergencia.
- **Disponibilidad** es "tal cual".

---

## 3. Servicios Reservables

Llamadas breves de orientación legal con Abogados (por ejemplo, 20 minutos) y asistencia no regulada con Ayudantes. **Sin garantías** sobre resultado/calidad/disponibilidad.

---

## 4. Precios, Monedas y Tarifa de Conexión

El **precio total** mostrado incluye (i) la remuneración del Proveedor y (ii) la **Tarifa de Conexión fija** de SOS. **Tarifa de Conexión:** **19 EUR** o **25 USD** por Conexión (impuestos excl.), sujeto a cambios y/o tarifas locales con efecto prospectivo. Pueden aplicarse **cargos de procesador de pagos y FX**. Impuestos incluidos cuando sea requerido en la Tarifa de Conexión; los Proveedores son responsables de sus propios impuestos.

---

## 5. Reserva, Llamadas e Intentos

Una **Conexión** ocurre al intercambiar detalles de contacto y/o abrir un canal de llamada/mensaje/video y/o aceptación del Proveedor. Hasta **tres (3) intentos** en ~15 minutos para llamadas inmediatas. **Si no hay Conexión** después de los intentos, **reembolso completo**. Si ocurrió una Conexión pero el Cliente no logra comprometerse (sin respuesta/rechazo/terminación temprana), **el pago sigue siendo debido** y no reembolsable.

---

## 6. Derecho de Desistimiento (Consumidores) y Ejecución Inmediata

Cuando la ley local obligatoria otorga un derecho de desistimiento, puede aplicarse a menos que el Cliente solicite **ejecución inmediata**. Al reservar una llamada inmediata o a corto plazo, el Cliente solicita ejecución inmediata y reconoce que una vez **completamente ejecutada**, el derecho de desistimiento se pierde; si **parcialmente ejecutada** antes del desistimiento, el Cliente debe pagar por la parte ejecutada y la **Tarifa de Conexión no reembolsable**. La Plataforma recoge **consentimiento explícito** cuando sea requerido.

---

## 7. Pago, Seguridad, Contracargos

**Pago único y división:** El Cliente paga un monto que cubre la parte del Proveedor y la Tarifa de Conexión. SOS (o su procesador) **recauda**, **deduce** su Tarifa y **remite** el resto al Proveedor. Pagos a través de procesadores de terceros; puede aplicarse **AML/KYC**. En caso de **contracargo/disputa**, SOS puede compartir datos estrictamente necesarios con el procesador y suspender servicios/pagos relacionados. **Compensación:** los reembolsos a Clientes son soportados por la parte del Proveedor; SOS puede compensar contra pagos futuros.

---

## 8. Cancelaciones y Reembolsos

A menos que la ley obligatoria disponga lo contrario: la **Tarifa de Conexión no es reembolsable** una vez que ocurre una Conexión; la parte del Proveedor no es reembolsable una vez que comienza la ejecución, salvo buena voluntad del Proveedor. **Antes de la Conexión:** reembolso completo. **Cancelación del Proveedor:** reembolso completo. **Casos técnicos por falla de la Plataforma:** reembolso o crédito a discreción de SOS en la medida permitida por la ley.

---

## 9. Conducta, Seguridad y Contenido

Comportamiento respetuoso; sin grabación/distribución ilegal; sin solicitud de actos ilegales. La información del Cliente debe ser legal, precisa y justa. Los abusos pueden ser reportados a través del formulario de contacto.

---

## 10. Protección de Datos

Controladores separados: **SOS** y el **Proveedor** procesan datos personales para sus propios fines (ejecución del contrato, seguridad/prevención de fraude/mejora del servicio, AML/sanciones, consentimiento cuando aplique). **Transferencias internacionales** con salvaguardas cuando sea requerido. **Derechos y contacto** a través del formulario de contacto. Medidas de seguridad; notificaciones de violación según sea requerido.

---

## 11. PI

La PI de la Plataforma permanece con Ulixai; el Cliente recibe un derecho de acceso **personal y limitado**.

---

## 12. Responsabilidad

Los Proveedores son **independientes**; SOS no es responsable de sus servicios/resultados. En la máxima medida permitida, el **límite de responsabilidad** de SOS por daño directo probado es el **precio total pagado** por la reserva relevante; **sin daños indirectos/especiales/consecuentes**, donde sea permitido.

---

## 13. Ley Aplicable, Disputas y Tribunales

**Ley sustantiva:** para cada país cubierto por el servicio, las leyes del **País de Intervención** rigen la relación SOS-Cliente sin perjuicio de los derechos obligatorios del consumidor en su residencia. **Suplementaria:** la ley estonia rige la interpretación/validez y cualquier asunto no regido por la ley local. **Arbitraje CCI:** obligatorio para **no consumidores** (sede: Tallin, Estonia; idioma: francés; confidencial). Los **Consumidores** pueden optar por el arbitraje CCI o usar tribunales disponibles bajo ley obligatoria. Los **tribunales estonios (Tallin)** tienen jurisdicción exclusiva para reclamaciones no arbitrables, ejecución de laudos y medidas urgentes, sujeto a derechos obligatorios del consumidor. **Las acciones colectivas/de clase se renuncian** en la medida permitida por la ley.

---

## 14. Terminación/Suspensión y Misceláneos

Podemos suspender/cerrar cuentas por fraude, incumplimiento, abuso o riesgo legal. **El francés prevalece** para interpretación. Aplica **Separabilidad** y **no renuncia**. Avisos por publicación/en la aplicación o a través del formulario de contacto.

---

## 15. Contacto

**Formulario de contacto (soporte y solicitudes legales):** [**http://localhost:5174/contact**](http://localhost:5174/contact)
`;

  const defaultDe = `
# Allgemeine Bedingungen – Kunden (Global)

**SOS Expat von Ulixai OÜ** (die "Plattform", "SOS", "wir")

**Version 2.2 – Letzte Aktualisierung: 16. Juni 2025**

---

## 1. Zweck und Geltungsbereich

Diese Bedingungen regeln die Nutzung der Plattform durch jede Person oder Organisation, die ein Kundenkonto erstellt und einen Service bucht (der "Kunde"). **SOS Expat ist eine Vermittlungsplattform**, die Kunden mit unabhängigen **Anwälten** und unabhängigen **Helfern** verbindet. Ulixai ist **keine Anwaltskanzlei** und bietet keine rechtliche/medizinische/steuerliche/regulierte Beratung und ist **keine** Vertragspartei des Kunde-Anbieter-Vertrags.

---

## 2. Konten, Berechtigung und Nutzung

- **18+ und Geschäftsfähigkeit.** Unternehmensnutzer gewährleisten Befugnis.
- **Genaue Informationen** müssen bereitgestellt und aktuell gehalten werden.
- **Keine illegale/missbräuchliche Nutzung**; die Plattform ist **kein** Notdienst.
- **Verfügbarkeit** ist "wie besehen".

---

## 3. Buchbare Dienste

Kurze rechtliche Orientierungsgespräche mit Anwälten (z.B. 20 Minuten) und nicht regulierte Unterstützung mit Helfern. **Keine Garantien** bezüglich Ergebnis/Qualität/Verfügbarkeit.

---

## 4. Preise, Währungen und Verbindungsgebühr

Der angezeigte **Gesamtpreis** umfasst (i) die Vergütung des Anbieters und (ii) die **pauschale Verbindungsgebühr** von SOS. **Verbindungsgebühr:** **19 EUR** oder **25 USD** pro Verbindung (ohne Steuern), vorbehaltlich Änderungen und/oder lokaler Zeitpläne mit prospektiver Wirkung. **Wechselkurs- und Zahlungsabwicklungsgebühren** können anfallen. Steuern enthalten, wo erforderlich auf die Verbindungsgebühr; Anbieter sind für ihre eigenen Steuern verantwortlich.

---

## 5. Buchung, Anrufe und Versuche

Eine **Verbindung** erfolgt beim Austausch von Kontaktdaten und/oder Öffnen eines Anruf-/Nachrichten-/Videokanals und/oder Anbieterakzeptanz. Bis zu **drei (3) Versuche** innerhalb von ~15 Minuten für sofortige Anrufe. **Bei keiner Verbindung** nach Versuchen, **volle Rückerstattung**. Wenn eine Verbindung erfolgte, aber der Kunde sich nicht engagiert (keine Antwort/Ablehnung/vorzeitige Beendigung), **bleibt die Zahlung fällig** und nicht erstattungsfähig.

---

## 6. Widerrufsrecht (Verbraucher) und Sofortige Ausführung

Wo zwingendes lokales Recht ein Widerrufsrecht gewährt, kann dies gelten, es sei denn, der Kunde verlangt **sofortige Ausführung**. Durch Buchung eines sofortigen oder kurzfristigen Anrufs verlangt der Kunde sofortige Ausführung und erkennt an, dass nach **vollständiger Ausführung** das Widerrufsrecht erlischt; bei **teilweiser Ausführung** vor Widerruf muss der Kunde für den ausgeführten Teil und die **nicht erstattungsfähige Verbindungsgebühr** bezahlen. Die Plattform sammelt **ausdrückliche Zustimmung**, wo erforderlich.

---

## 7. Zahlung, Sicherheit, Rückbuchungen

**Einzelzahlung und Aufteilung:** Kunde zahlt einen Betrag, der den Anteil des Anbieters und die Verbindungsgebühr abdeckt. SOS (oder sein Prozessor) **kassiert**, **zieht** seine Gebühr ab und **überweist** den Rest an den Anbieter. Zahlungen über Drittanbieter-Prozessoren; **AML/KYC** kann gelten. Im Falle von **Rückbuchung/Streit** kann SOS streng notwendige Daten mit dem Prozessor teilen und damit verbundene Dienste/Auszahlungen aussetzen. **Verrechnung:** Rückerstattungen an Kunden werden vom Anbieteranteil getragen; SOS kann gegen zukünftige Auszahlungen verrechnen.

---

## 8. Stornierungen und Rückerstattungen

Sofern nicht zwingendes Recht anders bestimmt: die **Verbindungsgebühr ist nicht erstattungsfähig**, sobald eine Verbindung erfolgt; der Anbieteranteil ist nicht erstattungsfähig, sobald die Ausführung beginnt, außer bei Kulanz durch den Anbieter. **Vor Verbindung:** volle Rückerstattung. **Anbieterstornierung:** volle Rückerstattung. **Plattformfehler technische Fälle:** Rückerstattung oder Gutschrift nach Ermessen von SOS im gesetzlich zulässigen Umfang.

---

## 9. Verhalten, Sicherheit und Inhalt

Respektvolles Verhalten; keine rechtswidrige Aufzeichnung/Verbreitung; keine Aufforderung zu illegalen Handlungen. Kundeninformationen müssen rechtmäßig, genau und fair sein. Missbrauch kann über das Kontaktformular gemeldet werden.

---

## 10. Datenschutz

Getrennte Verantwortliche: **SOS** und der **Anbieter** verarbeiten jeweils personenbezogene Daten für ihre eigenen Zwecke (Vertragserfüllung, Sicherheit/Betrugsprävention/Serviceverbesserung, AML/Sanktionen, Zustimmung falls anwendbar). **Internationale Übermittlungen** mit Sicherungen, wo erforderlich. **Rechte und Kontakt** über das Kontaktformular. Sicherheitsmaßnahmen; Verletzungsbenachrichtigungen wie erforderlich.

---

## 11. Geistiges Eigentum

Plattform-IP verbleibt bei Ulixai; Kunde erhält ein **persönliches, begrenztes** Zugangsrecht.

---

## 12. Haftung

Anbieter sind **unabhängig**; SOS haftet nicht für deren Dienste/Ergebnisse. Im maximal zulässigen Umfang ist die **Haftungsobergrenze** von SOS für nachgewiesene direkte Schäden der **gezahlte Gesamtpreis** für die relevante Buchung; **keine indirekten/speziellen/Folgeschäden**, wo zulässig.

---

## 13. Anwendbares Recht, Streitigkeiten und Gerichte

**Materielles Recht:** für jedes vom Dienst abgedeckte Land regeln die Gesetze des **Interventionslandes** die SOS-Kundenbeziehung unbeschadet der zwingenden Verbraucherrechte am Wohnsitz. **Ergänzend:** Estnisches Recht regelt Auslegung/Gültigkeit und jede nicht vom lokalen Recht geregelte Angelegenheit. **ICC-Schiedsverfahren:** obligatorisch für **Nicht-Verbraucher** (Sitz: Tallinn, Estland; Sprache: Französisch; vertraulich). **Verbraucher** können sich für ICC-Schiedsverfahren entscheiden oder verfügbare Gerichte nach zwingendem Recht nutzen. **Estnische Gerichte (Tallinn)** haben ausschließliche Zuständigkeit für nicht schiedsfähige Ansprüche, Schiedsspruchvollstreckung und dringende Maßnahmen, vorbehaltlich zwingender Verbraucherrechte. **Sammelklagen sind ausgeschlossen** im gesetzlich zulässigen Umfang.

---

## 14. Kündigung/Aussetzung und Sonstiges

Wir können Konten wegen Betrug, Nichteinhaltung, Missbrauch oder rechtlichem Risiko aussetzen/schließen. **Französisch gilt** zur Auslegung. **Salvatorische Klausel** und **Nicht-Verzicht** gelten. Mitteilungen durch Veröffentlichung/in der App oder über Kontaktformular.

---

## 15. Kontakt

**Kontaktformular (Support und rechtliche Anfragen):** [**http://localhost:5174/contact**](http://localhost:5174/contact)
`;

  const defaultRu = `
# Общие условия – Клиенты (Глобальные)

**SOS Expat от Ulixai OÜ** ("Платформа", "SOS", "мы")

**Версия 2.2 – Последнее обновление: 16 июня 2025**

---

## 1. Цель и сфера применения

Эти Условия регулируют использование Платформы любым лицом или организацией, создающей клиентскую учетную запись и бронирующей услугу ("Клиент"). **SOS Expat является платформой для подбора**, связывающей Клиентов с независимыми **Юристами** и независимыми **Помощниками**. Ulixai **не является юридической фирмой** и не предоставляет юридических/медицинских/налоговых/регулируемых консультаций и **не** является стороной контракта Клиент-Поставщик.

---

## 2. Аккаунты, право на использование и использование

- **18+ и дееспособность.** Корпоративные пользователи гарантируют полномочия.
- **Точная информация** должна быть предоставлена и поддерживаться в актуальном состоянии.
- **Никакого незаконного/оскорбительного использования**; Платформа **не является** службой экстренной помощи.
- **Доступность** "как есть".

---

## 3. Бронируемые услуги

Короткие юридические консультации с Юристами (например, 20 минут) и нерегулируемая помощь с Помощниками. **Никаких гарантий** относительно результата/качества/доступности.

---

## 4. Цены, валюты и плата за соединение

Указанная **общая цена** включает (i) вознаграждение Поставщика и (ii) **фиксированную плату за соединение** SOS. **Плата за соединение:** **19 EUR** или **25 USD** за Соединение (без налогов), с возможностью изменения и/или местных графиков с перспективным действием. Могут применяться **комиссии за обработку платежей и валютный обмен**. Налоги включены, где требуется на плату за соединение; Поставщики несут ответственность за свои собственные налоги.

---

## 5. Бронирование, звонки и попытки

**Соединение** происходит при обмене контактными данными и/или открытии канала звонка/сообщения/видео и/или принятии Поставщиком. До **трех (3) попыток** в течение ~15 минут для немедленных звонков. **Если нет Соединения** после попыток, **полный возврат средств**. Если Соединение произошло, но Клиент не смог взаимодействовать (нет ответа/отказ/досрочное завершение), **оплата остается обязательной** и не возвращается.

---

## 6. Право на отказ (Потребители) и немедленное выполнение

Где обязательное местное законодательство предоставляет право на отказ, оно может применяться, если только Клиент не запрашивает **немедленное выполнение**. Бронируя немедленный или краткосрочный звонок, Клиент запрашивает немедленное выполнение и признает, что после **полного выполнения** право на отказ утрачивается; если **частично выполнено** до отказа, Клиент должен оплатить выполненную часть и **невозвратную плату за соединение**. Платформа собирает **явное согласие**, где требуется.

---

## 7. Оплата, безопасность, возвратные платежи

**Единый платеж и разделение:** Клиент платит одну сумму, покрывающую долю Поставщика и плату за соединение. SOS (или его процессор) **собирает**, **вычитает** свою плату и **переводит** остаток Поставщику. Платежи через сторонние процессоры; может применяться **AML/KYC**. В случае **возвратного платежа/спора** SOS может делиться строго необходимыми данными с процессором и приостанавливать связанные услуги/выплаты. **Зачет:** возвраты Клиентам несет доля Поставщика; SOS может зачесть против будущих выплат.

---

## 8. Отмены и возвраты

Если обязательное законодательство не предусматривает иное: **плата за соединение не возвращается**, как только происходит Соединение; доля Поставщика не возвращается, как только начинается выполнение, кроме как по доброй воле Поставщика. **До Соединения:** полный возврат. **Отмена Поставщиком:** полный возврат. **Технические случаи по вине Платформы:** возврат или кредит по усмотрению SOS в разрешенной законом степени.

---

## 9. Поведение, безопасность и контент

Уважительное поведение; никакой незаконной записи/распространения; никакого подстрекательства к незаконным действиям. Информация Клиента должна быть законной, точной и справедливой. О нарушениях можно сообщить через контактную форму.

---

## 10. Защита данных

Отдельные контроллеры: **SOS** и **Поставщик** обрабатывают персональные данные для своих собственных целей (исполнение контракта, безопасность/предотвращение мошенничества/улучшение сервиса, AML/санкции, согласие где применимо). **Международные передачи** с гарантиями, где требуется. **Права и контакт** через контактную форму. Меры безопасности; уведомления о нарушениях по мере необходимости.

---

## 11. Интеллектуальная собственность

ИС Платформы остается за Ulixai; Клиент получает **личное, ограниченное** право доступа.

---

## 12. Ответственность

Поставщики **независимы**; SOS не несет ответственности за их услуги/результаты. В максимально разрешенной степени, **предел ответственности** SOS за доказанный прямой ущерб составляет **общую уплаченную цену** за соответствующее бронирование; **никаких косвенных/специальных/последующих убытков**, где разрешено.

---

## 13. Применимое право, споры и суды

**Материальное право:** для каждой страны, охваченной услугой, законы **Страны вмешательства** регулируют отношения SOS-Клиент без ущерба для обязательных прав потребителя по месту жительства. **Дополнительно:** эстонское право регулирует толкование/действительность и любой вопрос, не регулируемый местным правом. **Арбитраж ICC:** обязателен для **не-потребителей** (место: Таллинн, Эстония; язык: французский; конфиденциально). **Потребители** могут выбрать арбитраж ICC или использовать доступные суды в соответствии с обязательным законодательством. **Эстонские суды (Таллинн)** имеют исключительную юрисдикцию для неарбитрабельных требований, исполнения решений и срочных мер, с учетом обязательных прав потребителя. **Коллективные иски отменяются** в разрешенной законом степени.

---

## 14. Прекращение/приостановка и прочее

Мы можем приостановить/закрыть аккаунты из-за мошенничества, несоблюдения, злоупотребления или юридического риска. **Французский имеет приоритет** для толкования. Применяются **делимость** и **отсутствие отказа**. Уведомления путем публикации/в приложении или через контактную форму.

---

## 15. Контакт

**Контактная форма (поддержка и юридические запросы):** [**http://localhost:5174/contact**](http://localhost:5174/contact)
`;

  // const defaultContent = selectedLanguage === 'fr' ? defaultFr : defaultEn;
  // ✅ NEW (5 languages):
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
          : defaultEn;

  // Sommaire (UI)
  // const anchorMap = useMemo(
  //   () => [
  //     {
  //       num: 1,
  //       label:
  //         selectedLanguage === "fr"
  //           ? "Objet et champ d’application"
  //           : "Purpose and Scope",
  //     },
  //     {
  //       num: 2,
  //       label: selectedLanguage === "fr" ? "Comptes & usage" : "Accounts & Use",
  //     },
  //     {
  //       num: 3,
  //       label:
  //         selectedLanguage === "fr"
  //           ? "Services réservables"
  //           : "Bookable Services",
  //     },
  //     {
  //       num: 4,
  //       label: selectedLanguage === "fr" ? "Prix & frais" : "Prices & Fees",
  //     },
  //     {
  //       num: 5,
  //       label:
  //         selectedLanguage === "fr"
  //           ? "Réservation & appels"
  //           : "Booking & Calls",
  //     },
  //     {
  //       num: 6,
  //       label: selectedLanguage === "fr" ? "Rétractation" : "Withdrawal Right",
  //     },
  //     {
  //       num: 7,
  //       label:
  //         selectedLanguage === "fr"
  //           ? "Paiement & sécurité"
  //           : "Payment & Security",
  //     },
  //     {
  //       num: 8,
  //       label:
  //         selectedLanguage === "fr"
  //           ? "Annulations & remboursements"
  //           : "Cancellations & Refunds",
  //     },
  //     {
  //       num: 9,
  //       label:
  //         selectedLanguage === "fr"
  //           ? "Comportements & contenus"
  //           : "Conduct & Content",
  //     },
  //     {
  //       num: 10,
  //       label:
  //         selectedLanguage === "fr"
  //           ? "Données personnelles"
  //           : "Data Protection",
  //     },
  //     {
  //       num: 11,
  //       label:
  //         selectedLanguage === "fr"
  //           ? "Propriété intellectuelle"
  //           : "Intellectual Property",
  //     },
  //     {
  //       num: 12,
  //       label: selectedLanguage === "fr" ? "Responsabilité" : "Liability",
  //     },
  //     {
  //       num: 13,
  //       label:
  //         selectedLanguage === "fr"
  //           ? "Droit applicable & litiges"
  //           : "Governing Law & Disputes",
  //     },
  //     {
  //       num: 14,
  //       label:
  //         selectedLanguage === "fr"
  //           ? "Résiliation & divers"
  //           : "Termination & Misc.",
  //     },
  //     { num: 15, label: selectedLanguage === "fr" ? "Contact" : "Contact" },
  //   ],
  //   [selectedLanguage]
  // );

  const anchorMap = useMemo(
    () => [
      {
        num: 1,
        label:
          selectedLanguage === "fr"
            ? "Objet et champ d'application"
            : selectedLanguage === "es"
              ? "Propósito y alcance"
              : selectedLanguage === "de"
                ? "Zweck und Geltungsbereich"
                : selectedLanguage === "ru"
                  ? "Цель и область применения"
                  : "Purpose and Scope",
      },
      {
        num: 2,
        label:
          selectedLanguage === "fr"
            ? "Comptes & usage"
            : selectedLanguage === "es"
              ? "Cuentas y uso"
              : selectedLanguage === "de"
                ? "Konten & Nutzung"
                : selectedLanguage === "ru"
                  ? "Аккаунты и использование"
                  : "Accounts & Use",
      },
      {
        num: 3,
        label:
          selectedLanguage === "fr"
            ? "Services réservables"
            : selectedLanguage === "es"
              ? "Servicios reservables"
              : selectedLanguage === "de"
                ? "Buchbare Dienste"
                : selectedLanguage === "ru"
                  ? "Бронируемые услуги"
                  : "Bookable Services",
      },
      {
        num: 4,
        label:
          selectedLanguage === "fr"
            ? "Prix & frais"
            : selectedLanguage === "es"
              ? "Precios y tarifas"
              : selectedLanguage === "de"
                ? "Preise & Gebühren"
                : selectedLanguage === "ru"
                  ? "Цены и сборы"
                  : "Prices & Fees",
      },
      {
        num: 5,
        label:
          selectedLanguage === "fr"
            ? "Réservation & appels"
            : selectedLanguage === "es"
              ? "Reserva y llamadas"
              : selectedLanguage === "de"
                ? "Buchung & Anrufe"
                : selectedLanguage === "ru"
                  ? "Бронирование и звонки"
                  : "Booking & Calls",
      },
      {
        num: 6,
        label:
          selectedLanguage === "fr"
            ? "Rétractation"
            : selectedLanguage === "es"
              ? "Derecho de desistimiento"
              : selectedLanguage === "de"
                ? "Widerrufsrecht"
                : selectedLanguage === "ru"
                  ? "Право на отказ"
                  : "Withdrawal Right",
      },
      {
        num: 7,
        label:
          selectedLanguage === "fr"
            ? "Paiement & sécurité"
            : selectedLanguage === "es"
              ? "Pago y seguridad"
              : selectedLanguage === "de"
                ? "Zahlung & Sicherheit"
                : selectedLanguage === "ru"
                  ? "Оплата и безопасность"
                  : "Payment & Security",
      },
      {
        num: 8,
        label:
          selectedLanguage === "fr"
            ? "Annulations & remboursements"
            : selectedLanguage === "es"
              ? "Cancelaciones y reembolsos"
              : selectedLanguage === "de"
                ? "Stornierungen & Rückerstattungen"
                : selectedLanguage === "ru"
                  ? "Отмены и возвраты"
                  : "Cancellations & Refunds",
      },
      {
        num: 9,
        label:
          selectedLanguage === "fr"
            ? "Comportements & contenus"
            : selectedLanguage === "es"
              ? "Conducta y contenido"
              : selectedLanguage === "de"
                ? "Verhalten & Inhalte"
                : selectedLanguage === "ru"
                  ? "Поведение и контент"
                  : "Conduct & Content",
      },
      {
        num: 10,
        label:
          selectedLanguage === "fr"
            ? "Données personnelles"
            : selectedLanguage === "es"
              ? "Protección de datos"
              : selectedLanguage === "de"
                ? "Datenschutz"
                : selectedLanguage === "ru"
                  ? "Защита данных"
                  : "Data Protection",
      },
      {
        num: 11,
        label:
          selectedLanguage === "fr"
            ? "Propriété intellectuelle"
            : selectedLanguage === "es"
              ? "Propiedad intelectual"
              : selectedLanguage === "de"
                ? "Geistiges Eigentum"
                : selectedLanguage === "ru"
                  ? "Интеллектуальная собственность"
                  : "Intellectual Property",
      },
      {
        num: 12,
        label:
          selectedLanguage === "fr"
            ? "Responsabilité"
            : selectedLanguage === "es"
              ? "Responsabilidad"
              : selectedLanguage === "de"
                ? "Haftung"
                : selectedLanguage === "ru"
                  ? "Ответственность"
                  : "Liability",
      },
      {
        num: 13,
        label:
          selectedLanguage === "fr"
            ? "Droit applicable & litiges"
            : selectedLanguage === "es"
              ? "Ley aplicable y disputas"
              : selectedLanguage === "de"
                ? "Anwendbares Recht & Streitigkeiten"
                : selectedLanguage === "ru"
                  ? "Применимое право и споры"
                  : "Governing Law & Disputes",
      },
      {
        num: 14,
        label:
          selectedLanguage === "fr"
            ? "Résiliation & divers"
            : selectedLanguage === "es"
              ? "Terminación y varios"
              : selectedLanguage === "de"
                ? "Kündigung & Sonstiges"
                : selectedLanguage === "ru"
                  ? "Прекращение и прочее"
                  : "Termination & Misc.",
      },
      {
        num: 15,
        label:
          selectedLanguage === "fr"
            ? "Contact"
            : selectedLanguage === "es"
              ? "Contacto"
              : selectedLanguage === "de"
                ? "Kontakt"
                : selectedLanguage === "ru"
                  ? "Контакт"
                  : "Contact",
      },
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
              <div className="flex justify-center mb-6">
                <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <FileText className="w-12 h-12 text-white" />
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

              {/* Points clés */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-white/90">
                {[
                  {
                    icon: <CreditCard className="w-6 h-6" />,
                    text: t.features[0],
                    gradient: "from-green-500 to-emerald-500",
                  },
                  {
                    icon: <Shield className="w-6 h-6" />,
                    text: t.features[1],
                    gradient: "from-blue-500 to-indigo-500",
                  },
                  {
                    icon: <Phone className="w-6 h-6" />,
                    text: t.features[2],
                    gradient: "from-yellow-500 to-orange-500",
                  },
                  {
                    icon: <Users className="w-6 h-6" />,
                    text: t.features[3],
                    gradient: "from-red-500 to-orange-500",
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

              <div className="mt-8 flex items-center justify-center gap-4">
                <a
                  href="http://localhost:5174/contact"
                  className="group inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white font-bold border-2 border-red-400/50 hover:scale-105 transition-all"
                >
                  <Globe className="w-5 h-5" />
                  <span>{t.contactUs}</span>
                </a>
                <Link
                  to="/"
                  className="group inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 hover:border-white/50 transition-all duration-300 backdrop-blur-sm font-semibold"
                >
                  <Shield className="w-5 h-5" />
                  <span>{t.seeHowItWorks}</span>
                </Link>
              </div>
            </header>
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
              <p className="mt-4 text-sm text-gray-500 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                {t.editHint}
              </p>
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
              {t.readyToUse}
            </h2>
            <p className="text-lg sm:text-2xl text-white/95 mb-10 leading-relaxed">
              {t.readySubtitle}
            </p>

            <div className="mb-8 flex flex-wrap items-center justify-center gap-3 text-white/90">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 border border-white/20 backdrop-blur-sm">
                <Clock className="w-4 h-4" />{" "}
                <span>
                  3 {selectedLanguage === "fr" ? "tentatives" : "attempts"}
                </span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 border border-white/20 backdrop-blur-sm">
                <DollarSign className="w-4 h-4" /> <span>EUR 19 / USD 25</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 border border-white/20 backdrop-blur-sm">
                <Globe className="w-4 h-4" /> Global
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <a
                href="http://localhost:5174/contact"
                className="group relative overflow-hidden border-2 border-white bg-transparent text-white px-10 py-5 rounded-3xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:bg-white/10 flex items-center gap-3"
              >
                <Globe className="w-5 h-5" />
                <span>{t.contactUs}</span>
                <span className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/30" />
              </a>
              <Link
                to="/"
                className="group relative overflow-hidden bg-white text-red-600 hover:text-red-700 px-10 py-5 rounded-3xl font-black text-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl flex items-center gap-3"
              >
                <Shield className="w-5 h-5" />
                <span>{t.seeHowItWorks}</span>
                {/* Pas de flèche ici */}
                <span className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-black/5" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default TermsClients;
