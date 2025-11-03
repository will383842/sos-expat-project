// src/pages/RegisterLawyer.tsx
import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  lazy,
  Suspense,
  useRef,
} from "react";
import {
  Link,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import {
  Scale,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Globe,
  Phone,
  CheckCircle,
  XCircle,
  Users,
  Camera,
  X,
  ShieldCheck,
  MapPin,
  MessageCircle,
} from "lucide-react";
import Layout from "../components/layout/Layout";
import Button from "../components/common/Button";
import { useAuth } from "../contexts/AuthContext";
import { useApp } from "../contexts/AppContext";
import type { MultiValue } from "react-select";
import type { Provider } from "../types/provider";
import { useIntl, FormattedMessage } from "react-intl";

import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { browserLocalPersistence, setPersistence } from "firebase/auth";
import { auth } from "@/config/firebase";

// ===== Lazy (perf) =====
const ImageUploader = lazy(() => import("../components/common/ImageUploader"));
const MultiLanguageSelect = lazy(
  () => import("../components/forms-data/MultiLanguageSelect")
);

// ===== Regex =====
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ===== Theme (indigo/purple) =====
const THEME = {
  gradFrom: "from-indigo-600",
  gradTo: "to-purple-600",
  ring: "focus:border-indigo-600",
  border: "border-indigo-200",
  icon: "text-indigo-600",
  chip: "border-indigo-200",
  subtle: "bg-indigo-50",
  button: "from-indigo-600 via-purple-600 to-fuchsia-700",
} as const;

// ===== Country options FR/EN (bilingue) =====
// type Duo = { fr: string; en: string };
type MultiLangDuo = {
  fr: string;
  es: string;
  en: string;
  de: string;
  ru: string;
  hi: string;
    pt: string;
};
// const COUNTRIES: MultiLangDuo[] = [
//   { fr: "Afghanistan", en: "Afghanistan" },
//   { fr: "Afrique du Sud", en: "South Africa" },
//   { fr: "Albanie", en: "Albania" },
//   { fr: "Algérie", en: "Algeria" },
//   { fr: "Allemagne", en: "Germany" },
//   { fr: "Andorre", en: "Andorra" },
//   { fr: "Angola", en: "Angola" },
//   { fr: "Arabie Saoudite", en: "Saudi Arabia" },
//   { fr: "Argentine", en: "Argentina" },
//   { fr: "Arménie", en: "Armenia" },
//   { fr: "Australie", en: "Australia" },
//   { fr: "Autriche", en: "Austria" },
//   { fr: "Azerbaïdjan", en: "Azerbaijan" },
//   { fr: "Bahamas", en: "Bahamas" },
//   { fr: "Bahreïn", en: "Bahrain" },
//   { fr: "Bangladesh", en: "Bangladesh" },
//   { fr: "Barbade", en: "Barbados" },
//   { fr: "Belgique", en: "Belgium" },
//   { fr: "Belize", en: "Belize" },
//   { fr: "Bénin", en: "Benin" },
//   { fr: "Bhoutan", en: "Bhutan" },
//   { fr: "Biélorussie", en: "Belarus" },
//   { fr: "Birmanie", en: "Myanmar" },
//   { fr: "Bolivie", en: "Bolivia" },
//   { fr: "Bosnie-Herzégovine", en: "Bosnia and Herzegovina" },
//   { fr: "Botswana", en: "Botswana" },
//   { fr: "Brésil", en: "Brazil" },
//   { fr: "Brunei", en: "Brunei" },
//   { fr: "Bulgarie", en: "Bulgaria" },
//   { fr: "Burkina Faso", en: "Burkina Faso" },
//   { fr: "Burundi", en: "Burundi" },
//   { fr: "Cambodge", en: "Cambodia" },
//   { fr: "Cameroun", en: "Cameroon" },
//   { fr: "Canada", en: "Canada" },
//   { fr: "Cap-Vert", en: "Cape Verde" },
//   { fr: "Chili", en: "Chile" },
//   { fr: "Chine", en: "China" },
//   { fr: "Chypre", en: "Cyprus" },
//   { fr: "Colombie", en: "Colombia" },
//   { fr: "Comores", en: "Comoros" },
//   { fr: "Congo", en: "Congo" },
//   { fr: "Corée du Nord", en: "North Korea" },
//   { fr: "Corée du Sud", en: "South Korea" },
//   { fr: "Costa Rica", en: "Costa Rica" },
//   { fr: "Côte d'Ivoire", en: "Ivory Coast" },
//   { fr: "Croatie", en: "Croatia" },
//   { fr: "Cuba", en: "Cuba" },
//   { fr: "Danemark", en: "Denmark" },
//   { fr: "Djibouti", en: "Djibouti" },
//   { fr: "Dominique", en: "Dominica" },
//   { fr: "Égypte", en: "Egypt" },
//   { fr: "Émirats arabes unis", en: "United Arab Emirates" },
//   { fr: "Équateur", en: "Ecuador" },
//   { fr: "Érythrée", en: "Eritrea" },
//   { fr: "Espagne", en: "Spain" },
//   { fr: "Estonie", en: "Estonia" },
//   { fr: "États-Unis", en: "United States" },
//   { fr: "Éthiopie", en: "Ethiopia" },
//   { fr: "Fidji", en: "Fiji" },
//   { fr: "Finlande", en: "Finland" },
//   { fr: "France", en: "France" },
//   { fr: "Autre", en: "Other" },
// ];

// const COUNTRIES: MultiLangDuo[] = [
//   {
//     fr: "Afghanistan",
//     es: "Afganistán",
//     en: "Afghanistan",
//     de: "Afghanistan",
//     ru: "Афганистан",
//     hi: "अफ़गानिस्तान",
//   },
//   {
//     fr: "Afrique du Sud",
//     es: "Sudáfrica",
//     en: "South Africa",
//     de: "Südafrika",
//     ru: "Южная Африка",
//     hi: "दक्षिण अफ्रीका",
//   },
//   {
//     fr: "Albanie",
//     es: "Albania",
//     en: "Albania",
//     de: "Albanien",
//     ru: "Албания",
//     hi: "अल्बानिया",
//   },
//   {
//     fr: "Algérie",
//     es: "Argelia",
//     en: "Algeria",
//     de: "Algerien",
//     ru: "Алжир",
//     hi: "अल्जीरिया",
//   },
//   {
//     fr: "Allemagne",
//     es: "Alemania",
//     en: "Germany",
//     de: "Deutschland",
//     ru: "Германия",
//     hi: "जर्मनी",
//   },
//   {
//     fr: "Andorre",
//     es: "Andorra",
//     en: "Andorra",
//     de: "Andorra",
//     ru: "Андорра",
//     hi: "अंडोरा",
//   },
//   {
//     fr: "Angola",
//     es: "Angola",
//     en: "Angola",
//     de: "Angola",
//     ru: "Ангола",
//     hi: "अंगोला",
//   },
//   {
//     fr: "Arabie Saoudite",
//     es: "Arabia Saudita",
//     en: "Saudi Arabia",
//     de: "Saudi-Arabien",
//     ru: "Саудовская Аравия",
//     hi: "सऊदी अरब",
//   },
//   {
//     fr: "Argentine",
//     es: "Argentina",
//     en: "Argentina",
//     de: "Argentinien",
//     ru: "Аргентина",
//     hi: "अर्जेंटीना",
//   },
//   {
//     fr: "Arménie",
//     es: "Armenia",
//     en: "Armenia",
//     de: "Armenien",
//     ru: "Армения",
//     hi: "आर्मेनिया",
//   },
//   {
//     fr: "Australie",
//     es: "Australia",
//     en: "Australia",
//     de: "Australien",
//     ru: "Австралия",
//     hi: "ऑस्ट्रेलिया",
//   },
//   {
//     fr: "Autriche",
//     es: "Austria",
//     en: "Austria",
//     de: "Österreich",
//     ru: "Австрия",
//     hi: "ऑस्ट्रिया",
//   },
//   {
//     fr: "Azerbaïdjan",
//     es: "Azerbaiyán",
//     en: "Azerbaijan",
//     de: "Aserbaidschan",
//     ru: "Азербайджан",
//     hi: "अज़रबैजान",
//   },
//   {
//     fr: "Bahamas",
//     es: "Bahamas",
//     en: "Bahamas",
//     de: "Bahamas",
//     ru: "Багамы",
//     hi: "बहामास",
//   },
//   {
//     fr: "Bahreïn",
//     es: "Baréin",
//     en: "Bahrain",
//     de: "Bahrain",
//     ru: "Бахрейн",
//     hi: "बहरीन",
//   },
//   {
//     fr: "Bangladesh",
//     es: "Bangladés",
//     en: "Bangladesh",
//     de: "Bangladesch",
//     ru: "Бангладеш",
//     hi: "बांग्लादेश",
//   },
//   {
//     fr: "Barbade",
//     es: "Barbados",
//     en: "Barbados",
//     de: "Barbados",
//     ru: "Барбадос",
//     hi: "बारबाडोस",
//   },
//   {
//     fr: "Belgique",
//     es: "Bélgica",
//     en: "Belgium",
//     de: "Belgien",
//     ru: "Бельгия",
//     hi: "बेल्जियम",
//   },
//   {
//     fr: "Belize",
//     es: "Belice",
//     en: "Belize",
//     de: "Belize",
//     ru: "Белиз",
//     hi: "बेलीज़",
//   },
//   {
//     fr: "Bénin",
//     es: "Benín",
//     en: "Benin",
//     de: "Benin",
//     ru: "Бенин",
//     hi: "बेनिन",
//   },
//   {
//     fr: "Bhoutan",
//     es: "Bután",
//     en: "Bhutan",
//     de: "Bhutan",
//     ru: "Бутан",
//     hi: "भूटान",
//   },
//   {
//     fr: "Biélorussie",
//     es: "Bielorrusia",
//     en: "Belarus",
//     de: "Belarus",
//     ru: "Беларусь",
//     hi: "बेलारूस",
//   },
//   {
//     fr: "Birmanie",
//     es: "Birmania",
//     en: "Myanmar",
//     de: "Myanmar",
//     ru: "Мьянма",
//     hi: "म्यांमार",
//   },
//   {
//     fr: "Bolivie",
//     es: "Bolivia",
//     en: "Bolivia",
//     de: "Bolivien",
//     ru: "Боливия",
//     hi: "बोलीविया",
//   },
//   {
//     fr: "Bosnie-Herzégovine",
//     es: "Bosnia y Herzegovina",
//     en: "Bosnia and Herzegovina",
//     de: "Bosnien und Herzegowina",
//     ru: "Босния и Герцеговина",
//     hi: "बोस्निया और हर्जेगोविना",
//   },
//   {
//     fr: "Botswana",
//     es: "Botsuana",
//     en: "Botswana",
//     de: "Botswana",
//     ru: "Ботсвана",
//     hi: "बोत्सवाना",
//   },
//   {
//     fr: "Brésil",
//     es: "Brasil",
//     en: "Brazil",
//     de: "Brasilien",
//     ru: "Бразилия",
//     hi: "ब्राज़ील",
//   },
//   {
//     fr: "Brunei",
//     es: "Brunéi",
//     en: "Brunei",
//     de: "Brunei",
//     ru: "Бруней",
//     hi: "ब्रुनेई",
//   },
//   {
//     fr: "Bulgarie",
//     es: "Bulgaria",
//     en: "Bulgaria",
//     de: "Bulgarien",
//     ru: "Болгария",
//     hi: "बुल्गारिया",
//   },
//   {
//     fr: "Burkina Faso",
//     es: "Burkina Faso",
//     en: "Burkina Faso",
//     de: "Burkina Faso",
//     ru: "Буркина-Фасо",
//     hi: "बुर्किना फासो",
//   },
//   {
//     fr: "Burundi",
//     es: "Burundi",
//     en: "Burundi",
//     de: "Burundi",
//     ru: "Бурунди",
//     hi: "बुरुंडी",
//   },
//   {
//     fr: "Cambodge",
//     es: "Camboya",
//     en: "Cambodia",
//     de: "Kambodscha",
//     ru: "Камбоджа",
//     hi: "कंबोडिया",
//   },
//   {
//     fr: "Cameroun",
//     es: "Camerún",
//     en: "Cameroon",
//     de: "Kamerun",
//     ru: "Камерун",
//     hi: "कैमरून",
//   },
//   {
//     fr: "Canada",
//     es: "Canadá",
//     en: "Canada",
//     de: "Kanada",
//     ru: "Канада",
//     hi: "कनाडा",
//   },
//   {
//     fr: "Cap-Vert",
//     es: "Cabo Verde",
//     en: "Cape Verde",
//     de: "Kap Verde",
//     ru: "Кабो-Верде",
//     hi: "केप वेर्डे",
//   },
//   {
//     fr: "Chili",
//     es: "Chile",
//     en: "Chile",
//     de: "Chile",
//     ru: "Чили",
//     hi: "चिली",
//   },
//   {
//     fr: "Chine",
//     es: "China",
//     en: "China",
//     de: "China",
//     ru: "Китай",
//     hi: "चीन",
//   },
//   {
//     fr: "Chypre",
//     es: "Chipre",
//     en: "Cyprus",
//     de: "Zypern",
//     ru: "Кипр",
//     hi: "साइप्रस",
//   },
//   {
//     fr: "Colombie",
//     es: "Colombia",
//     en: "Colombia",
//     de: "Kolumbien",
//     ru: "Колумбия",
//     hi: "कोलंबिया",
//   },
//   {
//     fr: "Comores",
//     es: "Comoras",
//     en: "Comoros",
//     de: "Komoren",
//     ru: "Коморы",
//     hi: "कोमोरोस",
//   },
//   {
//     fr: "Congo",
//     es: "Congo",
//     en: "Congo",
//     de: "Kongo",
//     ru: "Конго",
//     hi: "कांगो",
//   },
//   {
//     fr: "Corée du Nord",
//     es: "Corea del Norte",
//     en: "North Korea",
//     de: "Nordkorea",
//     ru: "Северная Корея",
//     hi: "उत्तर कोरिया",
//   },
//   {
//     fr: "Corée du Sud",
//     es: "Corea del Sur",
//     en: "South Korea",
//     de: "Südkorea",
//     ru: "Южная Корея",
//     hi: "दक्षिण कोरिया",
//   },
//   {
//     fr: "Costa Rica",
//     es: "Costa Rica",
//     en: "Costa Rica",
//     de: "Costa Rica",
//     ru: "Коста-Рика",
//     hi: "कोस्टा रिका",
//   },
//   {
//     fr: "Côte d'Ivoire",
//     es: "Costa de Marfil",
//     en: "Ivory Coast",
//     de: "Elfenbeinküste",
//     ru: "Кот-д'Ивуар",
//     hi: "आइवरी कोस्ट",
//   },
//   {
//     fr: "Croatie",
//     es: "Croacia",
//     en: "Croatia",
//     de: "Kroatien",
//     ru: "Хорватия",
//     hi: "क्रोएशिया",
//   },
//   { fr: "Cuba", es: "Cuba", en: "Cuba", de: "Kuba", ru: "Куба", hi: "क्यूबा" },
//   {
//     fr: "Danemark",
//     es: "Dinamarca",
//     en: "Denmark",
//     de: "Dänemark",
//     ru: "Дания",
//     hi: "डेनमार्क",
//   },
//   {
//     fr: "Djibouti",
//     es: "Yibuti",
//     en: "Djibouti",
//     de: "Dschibuti",
//     ru: "Джибути",
//     hi: "जिबूती",
//   },
//   {
//     fr: "Dominique",
//     es: "Dominica",
//     en: "Dominica",
//     de: "Dominica",
//     ru: "Доминика",
//     hi: "डोमिनिका",
//   },
//   {
//     fr: "Égypte",
//     es: "Egipto",
//     en: "Egypt",
//     de: "Ägypten",
//     ru: "Египет",
//     hi: "मिस्र",
//   },
//   {
//     fr: "Émirats arabes unis",
//     es: "Emiratos Árabes Unidos",
//     en: "United Arab Emirates",
//     de: "Vereinigte Arabische Emirate",
//     ru: "Объединённые Арабские Эмираты",
//     hi: "संयुक्त अरब अमीरात",
//   },
//   {
//     fr: "Équateur",
//     es: "Ecuador",
//     en: "Ecuador",
//     de: "Ecuador",
//     ru: "Эквадор",
//     hi: "इक्वाडोर",
//   },
//   {
//     fr: "Érythrée",
//     es: "Eritrea",
//     en: "Eritrea",
//     de: "Eritrea",
//     ru: "Эритрея",
//     hi: "इरिट्रिया",
//   },
//   {
//     fr: "Espagne",
//     es: "España",
//     en: "Spain",
//     de: "Spanien",
//     ru: "Испания",
//     hi: "स्पेन",
//   },
//   {
//     fr: "Estonie",
//     es: "Estonia",
//     en: "Estonia",
//     de: "Estland",
//     ru: "Эстония",
//     hi: "एस्टोनिया",
//   },
//   {
//     fr: "États-Unis",
//     es: "Estados Unidos",
//     en: "United States",
//     de: "Vereinigte Staaten",
//     ru: "Соединённые Штаты",
//     hi: "संयुक्त राज्य अमेरिका",
//   },
//   {
//     fr: "Éthiopie",
//     es: "Etiopía",
//     en: "Ethiopia",
//     de: "Äthiopien",
//     ru: "Эфиопия",
//     hi: "इथियोपिया",
//   },
//   {
//     fr: "Fidji",
//     es: "Fiyi",
//     en: "Fiji",
//     de: "Fidschi",
//     ru: "Фиджи",
//     hi: "फिजी",
//   },
//   {
//     fr: "Finlande",
//     es: "Finlandia",
//     en: "Finland",
//     de: "Finnland",
//     ru: "Финляндия",
//     hi: "फिनलैंड",
//   },
//   {
//     fr: "France",
//     es: "Francia",
//     en: "France",
//     de: "Frankreich",
//     ru: "Франция",
//     hi: "फ्रांस",
//   },
//   {
//     fr: "Autre",
//     es: "Otro",
//     en: "Other",
//     de: "Andere",
//     ru: "Другое",
//     hi: "अन्य",
//   },
// ];


const COUNTRIES: MultiLangDuo[] = [
  {
    fr: "Afghanistan",
    es: "Afganistán",
    en: "Afghanistan",
    de: "Afghanistan",
    ru: "Афганистан",
    hi: "अफ़गानिस्तान",
    pt: "Afeganistão",
  },
  {
    fr: "Afrique du Sud",
    es: "Sudáfrica",
    en: "South Africa",
    de: "Südafrika",
    ru: "Южная Африка",
    hi: "दक्षिण अफ्रीका",
    pt: "África do Sul",
  },
  {
    fr: "Albanie",
    es: "Albania",
    en: "Albania",
    de: "Albanien",
    ru: "Албания",
    hi: "अल्बानिया",
    pt: "Albânia",
  },
  {
    fr: "Algérie",
    es: "Argelia",
    en: "Algeria",
    de: "Algerien",
    ru: "Алжир",
    hi: "अल्जीरिया",
    pt: "Argélia",
  },
  {
    fr: "Allemagne",
    es: "Alemania",
    en: "Germany",
    de: "Deutschland",
    ru: "Германия",
    hi: "जर्मनी",
    pt: "Alemanha",
  },
  {
    fr: "Andorre",
    es: "Andorra",
    en: "Andorra",
    de: "Andorra",
    ru: "Андорра",
    hi: "अंडोरा",
    pt: "Andorra",
  },
  {
    fr: "Angola",
    es: "Angola",
    en: "Angola",
    de: "Angola",
    ru: "Ангола",
    hi: "अंगोला",
    pt: "Angola",
  },
  {
    fr: "Arabie Saoudite",
    es: "Arabia Saudita",
    en: "Saudi Arabia",
    de: "Saudi-Arabien",
    ru: "Саудовская Аравия",
    hi: "सऊदी अरब",
    pt: "Arábia Saudita",
  },
  {
    fr: "Argentine",
    es: "Argentina",
    en: "Argentina",
    de: "Argentinien",
    ru: "Аргентина",
    hi: "अर्जेंटीना",
    pt: "Argentina",
  },
  {
    fr: "Arménie",
    es: "Armenia",
    en: "Armenia",
    de: "Armenien",
    ru: "Армения",
    hi: "आर्मेनिया",
    pt: "Armênia",
  },
  {
    fr: "Australie",
    es: "Australia",
    en: "Australia",
    de: "Australien",
    ru: "Австралия",
    hi: "ऑस्ट्रेलिया",
    pt: "Austrália",
  },
  {
    fr: "Autriche",
    es: "Austria",
    en: "Austria",
    de: "Österreich",
    ru: "Австрия",
    hi: "ऑस्ट्रिया",
    pt: "Áustria",
  },
  {
    fr: "Azerbaïdjan",
    es: "Azerbaiyán",
    en: "Azerbaijan",
    de: "Aserbaidschan",
    ru: "Азербайджан",
    hi: "अज़रबैजान",
    pt: "Azerbaijão",
  },
  {
    fr: "Bahamas",
    es: "Bahamas",
    en: "Bahamas",
    de: "Bahamas",
    ru: "Багамы",
    hi: "बहामास",
    pt: "Bahamas",
  },
  {
    fr: "Bahreïn",
    es: "Baréin",
    en: "Bahrain",
    de: "Bahrain",
    ru: "Бахрейн",
    hi: "बहरीन",
    pt: "Bahrein",
  },
  {
    fr: "Bangladesh",
    es: "Bangladés",
    en: "Bangladesh",
    de: "Bangladesch",
    ru: "Бангладеш",
    hi: "बांग्लादेश",
    pt: "Bangladesh",
  },
  {
    fr: "Barbade",
    es: "Barbados",
    en: "Barbados",
    de: "Barbados",
    ru: "Барбадос",
    hi: "बारबाडोस",
    pt: "Barbados",
  },
  {
    fr: "Belgique",
    es: "Bélgica",
    en: "Belgium",
    de: "Belgien",
    ru: "Бельгия",
    hi: "बेल्जियम",
    pt: "Bélgica",
  },
  {
    fr: "Belize",
    es: "Belice",
    en: "Belize",
    de: "Belize",
    ru: "Белиз",
    hi: "बेलीज़",
    pt: "Belize",
  },
  {
    fr: "Bénin",
    es: "Benín",
    en: "Benin",
    de: "Benin",
    ru: "Бенин",
    hi: "बेनिन",
    pt: "Benin",
  },
  {
    fr: "Bhoutan",
    es: "Bután",
    en: "Bhutan",
    de: "Bhutan",
    ru: "Бутан",
    hi: "भूटान",
    pt: "Butão",
  },
  {
    fr: "Biélorussie",
    es: "Bielorrusia",
    en: "Belarus",
    de: "Belarus",
    ru: "Беларусь",
    hi: "बेलारूस",
    pt: "Bielorrússia",
  },
  {
    fr: "Birmanie",
    es: "Birmania",
    en: "Myanmar",
    de: "Myanmar",
    ru: "Мьянма",
    hi: "म्यांमार",
    pt: "Mianmar",
  },
  {
    fr: "Bolivie",
    es: "Bolivia",
    en: "Bolivia",
    de: "Bolivien",
    ru: "Боливия",
    hi: "बोलीविया",
    pt: "Bolívia",
  },
  {
    fr: "Bosnie-Herzégovine",
    es: "Bosnia y Herzegovina",
    en: "Bosnia and Herzegovina",
    de: "Bosnien und Herzegowina",
    ru: "Босния и Герцеговина",
    hi: "बोस्निया और हर्जेगोविना",
    pt: "Bósnia e Herzegovina",
  },
  {
    fr: "Botswana",
    es: "Botsuana",
    en: "Botswana",
    de: "Botswana",
    ru: "Ботсвана",
    hi: "बोत्सवाना",
    pt: "Botsuana",
  },
  {
    fr: "Brésil",
    es: "Brasil",
    en: "Brazil",
    de: "Brasilien",
    ru: "Бразилия",
    hi: "ब्राज़ील",
    pt: "Brasil",
  },
  {
    fr: "Brunei",
    es: "Brunéi",
    en: "Brunei",
    de: "Brunei",
    ru: "Бруней",
    hi: "ब्रुनेई",
    pt: "Brunei",
  },
  {
    fr: "Bulgarie",
    es: "Bulgaria",
    en: "Bulgaria",
    de: "Bulgarien",
    ru: "Болгария",
    hi: "बुल्गारिया",
    pt: "Bulgária",
  },
  {
    fr: "Burkina Faso",
    es: "Burkina Faso",
    en: "Burkina Faso",
    de: "Burkina Faso",
    ru: "Буркина-Фасо",
    hi: "बुर्किना फासो",
    pt: "Burkina Faso",
  },
  {
    fr: "Burundi",
    es: "Burundi",
    en: "Burundi",
    de: "Burundi",
    ru: "Бурунди",
    hi: "बुरुंडी",
    pt: "Burundi",
  },
  {
    fr: "Cambodge",
    es: "Camboya",
    en: "Cambodia",
    de: "Kambodscha",
    ru: "Камбоджа",
    hi: "कंबोडिया",
    pt: "Camboja",
  },
  {
    fr: "Cameroun",
    es: "Camerún",
    en: "Cameroon",
    de: "Kamerun",
    ru: "Камерун",
    hi: "कैमरून",
    pt: "Camarões",
  },
  {
    fr: "Canada",
    es: "Canadá",
    en: "Canada",
    de: "Kanada",
    ru: "Канада",
    hi: "कनाडा",
    pt: "Canadá",
  },
  {
    fr: "Cap-Vert",
    es: "Cabo Verde",
    en: "Cape Verde",
    de: "Kap Verde",
    ru: "Кабо-Верде",
    hi: "केप वेर्डे",
    pt: "Cabo Verde",
  },
  {
    fr: "Chili",
    es: "Chile",
    en: "Chile",
    de: "Chile",
    ru: "Чили",
    hi: "चिली",
    pt: "Chile",
  },
  {
    fr: "Chine",
    es: "China",
    en: "China",
    de: "China",
    ru: "Китай",
    hi: "चीन",
    pt: "China",
  },
  {
    fr: "Chypre",
    es: "Chipre",
    en: "Cyprus",
    de: "Zypern",
    ru: "Кипр",
    hi: "साइप्रस",
    pt: "Chipre",
  },
  {
    fr: "Colombie",
    es: "Colombia",
    en: "Colombia",
    de: "Kolumbien",
    ru: "Колумбия",
    hi: "कोलंबिया",
    pt: "Colômbia",
  },
  {
    fr: "Comores",
    es: "Comoras",
    en: "Comoros",
    de: "Komoren",
    ru: "Коморы",
    hi: "कोमोरोस",
    pt: "Comores",
  },
  {
    fr: "Congo",
    es: "Congo",
    en: "Congo",
    de: "Kongo",
    ru: "Конго",
    hi: "कांगो",
    pt: "Congo",
  },
  {
    fr: "Corée du Nord",
    es: "Corea del Norte",
    en: "North Korea",
    de: "Nordkorea",
    ru: "Северная Корея",
    hi: "उत्तर कोरिया",
    pt: "Coreia do Norte",
  },
  {
    fr: "Corée du Sud",
    es: "Corea del Sur",
    en: "South Korea",
    de: "Südkorea",
    ru: "Южная Корея",
    hi: "दक्षिण कोरिया",
    pt: "Coreia do Sul",
  },
  {
    fr: "Costa Rica",
    es: "Costa Rica",
    en: "Costa Rica",
    de: "Costa Rica",
    ru: "Коста-Рика",
    hi: "कोस्टा रिका",
    pt: "Costa Rica",
  },
  {
    fr: "Côte d'Ivoire",
    es: "Costa de Marfil",
    en: "Ivory Coast",
    de: "Elfenbeinküste",
    ru: "Кот-д'Ивуар",
    hi: "आइवरी कोस्ट",
    pt: "Costa do Marfim",
  },
  {
    fr: "Croatie",
    es: "Croacia",
    en: "Croatia",
    de: "Kroatien",
    ru: "Хорватия",
    hi: "क्रोएशिया",
    pt: "Croácia",
  },
  {
    fr: "Cuba",
    es: "Cuba",
    en: "Cuba",
    de: "Kuba",
    ru: "Куба",
    hi: "क्यूबा",
    pt: "Cuba",
  },
  {
    fr: "Danemark",
    es: "Dinamarca",
    en: "Denmark",
    de: "Dänemark",
    ru: "Дания",
    hi: "डेनमार्क",
    pt: "Dinamarca",
  },
  {
    fr: "Djibouti",
    es: "Yibuti",
    en: "Djibouti",
    de: "Dschibuti",
    ru: "Джибути",
    hi: "जिबूती",
    pt: "Djibuti",
  },
  {
    fr: "Dominique",
    es: "Dominica",
    en: "Dominica",
    de: "Dominica",
    ru: "Доминика",
    hi: "डोमिनिका",
    pt: "Dominica",
  },
  {
    fr: "Égypte",
    es: "Egipto",
    en: "Egypt",
    de: "Ägypten",
    ru: "Египет",
    hi: "मिस्र",
    pt: "Egito",
  },
  {
    fr: "Émirats arabes unis",
    es: "Emiratos Árabes Unidos",
    en: "United Arab Emirates",
    de: "Vereinigte Arabische Emirate",
    ru: "Объединённые Арабские Эмираты",
    hi: "संयुक्त अरब अमीरात",
    pt: "Emirados Árabes Unidos",
  },
  {
    fr: "Équateur",
    es: "Ecuador",
    en: "Ecuador",
    de: "Ecuador",
    ru: "Эквадор",
    hi: "इक्वाडोर",
    pt: "Equador",
  },
  {
    fr: "Érythrée",
    es: "Eritrea",
    en: "Eritrea",
    de: "Eritrea",
    ru: "Эритрея",
    hi: "इरिट्रिया",
    pt: "Eritreia",
  },
  {
    fr: "Espagne",
    es: "España",
    en: "Spain",
    de: "Spanien",
    ru: "Испания",
    hi: "स्पेन",
    pt: "Espanha",
  },
  {
    fr: "Estonie",
    es: "Estonia",
    en: "Estonia",
    de: "Estland",
    ru: "Эстония",
    hi: "एस्टोनिया",
    pt: "Estônia",
  },
  {
    fr: "États-Unis",
    es: "Estados Unidos",
    en: "United States",
    de: "Vereinigte Staaten",
    ru: "Соединённые Штаты",
    hi: "संयुक्त राज्य अमेरिका",
    pt: "Estados Unidos",
  },
  {
    fr: "Éthiopie",
    es: "Etiopía",
    en: "Ethiopia",
    de: "Äthiopien",
    ru: "Эфиопия",
    hi: "इथियोपिया",
    pt: "Etiópia",
  },
  {
    fr: "Fidji",
    es: "Fiyi",
    en: "Fiji",
    de: "Fidschi",
    ru: "Фиджи",
    hi: "फिजी",
    pt: "Fiji",
  },
  {
    fr: "Finlande",
    es: "Finlandia",
    en: "Finland",
    de: "Finnland",
    ru: "Финляндия",
    hi: "फिनलैंड",
    pt: "Finlândia",
  },
  {
    fr: "France",
    es: "Francia",
    en: "France",
    de: "Frankreich",
    ru: "Франция",
    hi: "फ्रांस",
    pt: "França",
  },
  {
    fr: "Autre",
    es: "Otro",
    en: "Other",
    de: "Andere",
    ru: "Другое",
    hi: "अन्य",
    pt: "Outro",
  },
];


const inputClass = (hasErr?: boolean) =>
  `w-full px-3 py-3 border-2 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none transition-all duration-200 text-base 
  
    [&_input]:border-0 [&_input]:outline-none [&_input]:shadow-none
    [&_input:focus]:border-0 [&_input:focus]:outline-none [&_input:focus]:shadow-none
    [&_select]:outline-none [&_select:focus]:outline-none
  ${
    hasErr
      ? "border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-red-50"
      : "border-gray-200 hover:border-gray-300 focus:border-red-600"
  }`;

// Add this at the top of your RegisterLawyer.tsx file (outside component)

// Country name to ISO code mapping (Stripe requires 2-letter codes)
const getCountryCode = (countryName: string, locale: string = "en"): string => {
  // Mapping for English country names
  const countryMap: Record<string, string> = {
    Afghanistan: "AF",
    "South Africa": "ZA",
    Albania: "AL",
    Algeria: "DZ",
    Germany: "DE",
    Andorra: "AD",
    Angola: "AO",
    "Saudi Arabia": "SA",
    Argentina: "AR",
    Armenia: "AM",
    Australia: "AU",
    "United Arab Emirates": "AE",
    Austria: "AT",
    Azerbaijan: "AZ",
    Bahamas: "BS",
    Bahrain: "BH",
    Bangladesh: "BD",
    Barbados: "BB",
    Belgium: "BE",
    Belize: "BZ",
    Benin: "BJ",
    Bhutan: "BT",
    Belarus: "BY",
    Myanmar: "MM",
    Bolivia: "BO",
    "Bosnia and Herzegovina": "BA",
    Botswana: "BW",
    Brazil: "BR",
    Brunei: "BN",
    Bulgaria: "BG",
    "Burkina Faso": "BF",
    Burundi: "BI",
    Cambodia: "KH",
    Cameroon: "CM",
    Canada: "CA",
    "Cape Verde": "CV",
    Chile: "CL",
    China: "CN",
    Cyprus: "CY",
    Colombia: "CO",
    Comoros: "KM",
    Congo: "CG",
    "North Korea": "KP",
    "South Korea": "KR",
    "Costa Rica": "CR",
    "Ivory Coast": "CI",
    Croatia: "HR",
    Cuba: "CU",
    Denmark: "DK",
    Djibouti: "DJ",
    Dominica: "DM",
    Egypt: "EG",
    Ecuador: "EC",
    Eritrea: "ER",
    Spain: "ES",
    Estonia: "EE",
    "United States": "US",
    Ethiopia: "ET",
    Fiji: "FJ",
    Finland: "FI",
    France: "FR",
    Other: "US", // Default fallback

    // French names
    Afganistán: "AF",
    Sudáfrica: "ZA",
    Argelia: "DZ",
    Alemania: "DE",
    "Arabia Saudita": "SA",
    Bélgica: "BE",
    Belice: "BZ",
    Benín: "BJ",
    Bután: "BT",
    Bielorrusia: "BY",
    Birmania: "MM",
    Botsuana: "BW",
    Brasil: "BR",
    Brunéi: "BN",
    Bangladés: "BD",
    "Cabo Verde": "CV",
    Camboya: "KH",
    Camerún: "CM",
    Canadá: "CA",
    Chipre: "CY",
    "Corea del Norte": "KP",
    "Corea del Sur": "KR",
    "Costa de Marfil": "CI",
    Croacia: "HR",
    Dinamarca: "DK",
    Yibuti: "DJ",
    Egipto: "EG",
    "Emiratos Árabes Unidos": "AE",

    España: "ES",
    "Estados Unidos": "US",
    Etiopía: "ET",
    Fiyi: "FJ",
    Finlandia: "FI",
    Francia: "FR",
    Otro: "US",

    // French names (fr)

    "Afrique du Sud": "ZA",
    Albanie: "AL",
    Algérie: "DZ",
    Allemagne: "DE",
    "Arabie Saoudite": "SA",
    Arménie: "AM",
    Australie: "AU",
    Autriche: "AT",
    Azerbaïdjan: "AZ",
    Bahreïn: "BH",
    Belgique: "BE",
    Biélorussie: "BY",
    Birmanie: "MM",
    "Bosnie-Herzégovine": "BA",
    Brésil: "BR",
    Bulgarie: "BG",
    "Côte d'Ivoire": "CI",
    Croatie: "HR",
    Danemark: "DK",
    Dominique: "DM",
    Égypte: "EG",
    "Émirats arabes unis": "AE",
    Équateur: "EC",
    Érythrée: "ER",
    Espagne: "ES",
    Estonie: "EE",
    "États-Unis": "US",
    Éthiopie: "ET",
    Finlande: "FI",
    Autre: "US",

    // German names (de)
    Südafrika: "ZA",
    Albanien: "AL",
    Algerien: "DZ",
    Deutschland: "DE",
    "Saudi-Arabien": "SA",
    Argentinien: "AR",
    Armenien: "AM",
    Australien: "AU",
    Österreich: "AT",
    Aserbaidschan: "AZ",
    Bangladesch: "BD",
    Belgien: "BE",

    "Bosnien und Herzegowina": "BA",
    Brasilien: "BR",
    Bulgarien: "BG",

    Kambodscha: "KH",
    Kamerun: "CM",
    Kanada: "CA",
    "Kap Verde": "CV",
    Kolumbien: "CO",
    Komoren: "KM",
    Kongo: "CG",
    Nordkorea: "KP",
    Südkorea: "KR",
    Elfenbeinküste: "CI",
    Kroatien: "HR",
    Dänemark: "DK",
    Dschibuti: "DJ",
    Ägypten: "EG",
    "Vereinigte Arabische Emirate": "AE",
    Äthiopien: "ET",
    Fidschi: "FJ",
    Finnland: "FI",
    Frankreich: "FR",
    "Vereinigte Staaten": "US",
    Andere: "US",

    // Russian names (ru)
    Афганистан: "AF",
    "Южная Африка": "ZA",
    Албания: "AL",
    Алжир: "DZ",
    Германия: "DE",
    Андорра: "AD",
    Ангола: "AO",
    "Саудовская Аравия": "SA",
    Аргентина: "AR",
    Армения: "AM",
    Австралия: "AU",
    Австрия: "AT",
    Азербайджан: "AZ",
    Багамы: "BS",
    Бахрейн: "BH",
    Бангладеш: "BD",
    Барбадос: "BB",
    Бельгия: "BE",
    Белиз: "BZ",
    Бенин: "BJ",
    Бутан: "BT",
    Беларусь: "BY",
    Мьянма: "MM",
    Боливия: "BO",
    "Босния и Герцеговина": "BA",
    Ботсвана: "BW",
    Бразилия: "BR",
    Бруней: "BN",
    Болгария: "BG",
    "Буркина-Фасо": "BF",
    Бурунди: "BI",
    Камбоджа: "KH",
    Камерун: "CM",
    Канада: "CA",

    Чили: "CL",
    Китай: "CN",
    Кипр: "CY",
    Колумбия: "CO",
    Коморы: "KM",
    Конго: "CG",
    "Северная Корея": "KP",
    "Южная Корея": "KR",
    "Коста-Рика": "CR",
    "Кот-д'Ивуар": "CI",
    Хорватия: "HR",

    Дания: "DK",
    Джибути: "DJ",
    Доминика: "DM",
    Египет: "EG",
    "Объединённые Арабские Эмираты": "AE",
    Эквадор: "EC",
    Эритрея: "ER",
    Испания: "ES",
    Эстония: "EE",
    "Соединённые Штаты": "US",
    Эфиопия: "ET",
    Фиджи: "FJ",
    Финляндия: "FI",
    Франция: "FR",
    Другое: "US",
  };

  // Try to get code, fallback to US if not found
  return countryMap[countryName] || "US";
};

// const SPECIALTIES: MultiLangDuo[] = [
//   { fr: "Droit de l'immigration", en: "Immigration Law" },
//   { fr: "Droit du travail", en: "Labor Law" },
//   { fr: "Droit immobilier", en: "Real Estate Law" },
//   { fr: "Droit des affaires", en: "Business Law" },
//   { fr: "Droit de la famille", en: "Family Law" },
//   { fr: "Droit pénal", en: "Criminal Law" },
//   { fr: "Droit fiscal", en: "Tax Law" },
//   { fr: "Droit international", en: "International Law" },
//   { fr: "Droit des contrats", en: "Contract Law" },
//   { fr: "Propriété intellectuelle", en: "Intellectual Property" },
//   { fr: "Droit de la consommation", en: "Consumer Law" },
//   { fr: "Droit bancaire", en: "Banking Law" },
//   { fr: "Droit de l'environnement", en: "Environmental Law" },
//   { fr: "Droit médical", en: "Medical Law" },
//   { fr: "Droit des sociétés", en: "Corporate Law" },
//   { fr: "Droit des successions", en: "Estate Law" },
//   { fr: "Droit administratif", en: "Administrative Law" },
//   { fr: "Droit européen", en: "European Law" },
//   { fr: "Droit des étrangers", en: "Immigrant Rights" },
//   { fr: "Autre", en: "Other" },
// ];

// const SPECIALTIES: MultiLangDuo[] = [
//   {
//     fr: "Droit de l'immigration",
//     es: "Derecho de inmigración",
//     en: "Immigration Law",
//     de: "Einwanderungsrecht",
//     ru: "Иммиграционное право",
//   },
//   {
//     fr: "Droit du travail",
//     es: "Derecho laboral",
//     en: "Labor Law",
//     de: "Arbeitsrecht",
//     ru: "Трудовое право",
//   },
//   {
//     fr: "Droit immobilier",
//     es: "Derecho inmobiliario",
//     en: "Real Estate Law",
//     de: "Immobilienrecht",
//     ru: "Недвижимость",
//   },
//   {
//     fr: "Droit des affaires",
//     es: "Derecho empresarial",
//     en: "Business Law",
//     de: "Wirtschaftsrecht",
//     ru: "Коммерческое право",
//   },
//   {
//     fr: "Droit de la famille",
//     es: "Derecho de familia",
//     en: "Family Law",
//     de: "Familienrecht",
//     ru: "Семейное право",
//   },
//   {
//     fr: "Droit pénal",
//     es: "Derecho penal",
//     en: "Criminal Law",
//     de: "Strafrecht",
//     ru: "Уголовное право",
//   },
//   {
//     fr: "Droit fiscal",
//     es: "Derecho fiscal",
//     en: "Tax Law",
//     de: "Steuerrecht",
//     ru: "Налоговое право",
//   },
//   {
//     fr: "Droit international",
//     es: "Derecho internacional",
//     en: "International Law",
//     de: "Internationales Recht",
//     ru: "Международное право",
//   },
//   {
//     fr: "Droit des contrats",
//     es: "Derecho de contratos",
//     en: "Contract Law",
//     de: "Vertragsrecht",
//     ru: "Договорное право",
//   },
//   {
//     fr: "Propriété intellectuelle",
//     es: "Propiedad intelectual",
//     en: "Intellectual Property",
//     de: "Geistiges Eigentum",
//     ru: "Интеллектуальная собственность",
//   },
//   {
//     fr: "Droit de la consommation",
//     es: "Derecho del consumidor",
//     en: "Consumer Law",
//     de: "Verbraucherschutzrecht",
//     ru: "Защита прав потребителей",
//   },
//   {
//     fr: "Droit bancaire",
//     es: "Derecho bancario",
//     en: "Banking Law",
//     de: "Bankrecht",
//     ru: "Банковское право",
//   },
//   {
//     fr: "Droit de l'environnement",
//     es: "Derecho ambiental",
//     en: "Environmental Law",
//     de: "Umweltrecht",
//     ru: "Экологическое право",
//   },
//   {
//     fr: "Droit médical",
//     es: "Derecho médico",
//     en: "Medical Law",
//     de: "Medizinrecht",
//     ru: "Медицинское право",
//   },
//   {
//     fr: "Droit des sociétés",
//     es: "Derecho corporativo",
//     en: "Corporate Law",
//     de: "Gesellschaftsrecht",
//     ru: "Корпоративное право",
//   },
//   {
//     fr: "Droit des successions",
//     es: "Derecho de sucesiones",
//     en: "Estate Law",
//     de: "Erbrecht",
//     ru: "Наследственное право",
//   },
//   {
//     fr: "Droit administratif",
//     es: "Derecho administrativo",
//     en: "Administrative Law",
//     de: "Verwaltungsrecht",
//     ru: "Административное право",
//   },
//   {
//     fr: "Droit européen",
//     es: "Derecho europeo",
//     en: "European Law",
//     de: "Europarecht",
//     ru: "Европейское право",
//   },
//   {
//     fr: "Droit des étrangers",
//     es: "Derecho de extranjería",
//     en: "Immigrant Rights",
//     de: "Ausländerrecht",
//     ru: "Право иностранцев",
//   },
//   {
//     fr: "Autre",
//     es: "Otro",
//     en: "Other",
//     de: "Andere",
//     ru: "Другое",
//   },
// ];

const SPECIALTIES: MultiLangDuo[] = [
  {
    fr: "Droit de l'immigration",
    es: "Derecho de inmigración",
    en: "Immigration Law",
    de: "Einwanderungsrecht",
    ru: "Иммиграционное право",
    hi: "आप्रवासन कानून",
  },
  {
    fr: "Droit du travail",
    es: "Derecho laboral",
    en: "Labor Law",
    de: "Arbeitsrecht",
    ru: "Трудовое право",
    hi: "श्रम कानून",
  },
  {
    fr: "Droit immobilier",
    es: "Derecho inmobiliario",
    en: "Real Estate Law",
    de: "Immobilienrecht",
    ru: "Недвижимость",
    hi: "रियल एस्टेट कानून",
  },
  {
    fr: "Droit des affaires",
    es: "Derecho empresarial",
    en: "Business Law",
    de: "Wirtschaftsrecht",
    ru: "Коммерческое право",
    hi: "व्यावसायिक कानून",
  },
  {
    fr: "Droit de la famille",
    es: "Derecho de familia",
    en: "Family Law",
    de: "Familienrecht",
    ru: "Семейное право",
    hi: "पारिवारिक कानून",
  },
  {
    fr: "Droit pénal",
    es: "Derecho penal",
    en: "Criminal Law",
    de: "Strafrecht",
    ru: "Уголовное право",
    hi: "आपराधिक कानून",
  },
  {
    fr: "Droit fiscal",
    es: "Derecho fiscal",
    en: "Tax Law",
    de: "Steuerrecht",
    ru: "Налоговое право",
    hi: "कर कानून",
  },
  {
    fr: "Droit international",
    es: "Derecho internacional",
    en: "International Law",
    de: "Internationales Recht",
    ru: "Международное право",
    hi: "अंतर्राष्ट्रीय कानून",
  },
  {
    fr: "Droit des contrats",
    es: "Derecho de contratos",
    en: "Contract Law",
    de: "Vertragsrecht",
    ru: "Договорное право",
    hi: "संविदा कानून",
  },
  {
    fr: "Propriété intellectuelle",
    es: "Propiedad intelectual",
    en: "Intellectual Property",
    de: "Geistiges Eigentum",
    ru: "Интеллектуальная собственность",
    hi: "बौद्धिक संपदा",
  },
  {
    fr: "Droit de la consommation",
    es: "Derecho del consumidor",
    en: "Consumer Law",
    de: "Verbraucherschutzrecht",
    ru: "Защита прав потребителей",
    hi: "उपभोक्ता कानून",
  },
  {
    fr: "Droit bancaire",
    es: "Derecho bancario",
    en: "Banking Law",
    de: "Bankrecht",
    ru: "Банковское право",
    hi: "बैंकिंग कानून",
  },
  {
    fr: "Droit de l'environnement",
    es: "Derecho ambiental",
    en: "Environmental Law",
    de: "Umweltrecht",
    ru: "Экологическое право",
    hi: "पर्यावरण कानून",
  },
  {
    fr: "Droit médical",
    es: "Derecho médico",
    en: "Medical Law",
    de: "Medizinrecht",
    ru: "Медицинское право",
    hi: "चिकित्सा कानून",
  },
  {
    fr: "Droit des sociétés",
    es: "Derecho corporativo",
    en: "Corporate Law",
    de: "Gesellschaftsrecht",
    ru: "Корпоративное право",
    hi: "कॉर्पोरेट कानून",
  },
  {
    fr: "Droit des successions",
    es: "Derecho de sucesiones",
    en: "Estate Law",
    de: "Erbrecht",
    ru: "Наследственное право",
    hi: "संपत्ति कानून",
  },
  {
    fr: "Droit administratif",
    es: "Derecho administrativo",
    en: "Administrative Law",
    de: "Verwaltungsrecht",
    ru: "Административное право",
    hi: "प्रशासनिक कानून",
  },
  {
    fr: "Droit européen",
    es: "Derecho europeo",
    en: "European Law",
    de: "Europarecht",
    ru: "Европейское право",
    hi: "यूरोपीय कानून",
  },
  {
    fr: "Droit des étrangers",
    es: "Derecho de extranjería",
    en: "Immigrant Rights",
    de: "Ausländerrecht",
    ru: "Право иностранцев",
    hi: "विदेशी अधिकार",
  },
  {
    fr: "Autre",
    es: "Otro",
    en: "Other",
    de: "Andere",
    ru: "Другое",
    hi: "अन्य",
  },
];

// ===== Types =====
interface LawyerFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  whatsapp: string;

  currentCountry: string;
  currentPresenceCountry: string;
  customCountry: string;
  preferredLanguage: "fr" | "en";
  practiceCountries: string[];
  customPracticeCountry: string;
  yearsOfExperience: number;
  specialties: string[];
  customSpecialty: string;
  graduationYear: number;
  profilePhoto: string;
  bio: string;
  educations: string[];
  availability: "available" | "busy" | "offline";
  acceptTerms: boolean;
}
interface LanguageOption {
  value: string;
  label: string;
}

// ===== i18n (typed) =====
type I18nKey = "fr" | "en";
type I18nShape = {
  metaTitle: string;
  metaDesc: string;
  heroTitle: string;
  heroSubtitle: string;
  already: string;
  login: string;
  personalInfo: string;
  geoInfo: string;
  proInfo: string;
  acceptTerms: string;
  termsLink: string;
  create: string;
  loading: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  whatsapp: string;
  countryCode: string;
  residenceCountry: string;
  presenceCountry: string;
  yoe: string;
  gradYear: string;
  bio: string;
  profilePhoto: string;
  specialties: string;
  practiceCountries: string;
  languages: string;
  formations: string;
  addFormation: string;
  addPractice: string;
  addSpecialty: string;
  specifyCountry: string;
  specifyPractice: string;
  specifySpecialty: string;
  help: {
    minPassword: string;
    emailPlaceholder: string;
    firstNamePlaceholder: string;
    bioHint: string;
  };
  errors: {
    title: string;
    firstNameRequired: string;
    lastNameRequired: string;
    emailRequired: string;
    emailInvalid: string;
    emailTaken: string;
    passwordTooShort: string;
    phoneRequired: string;
    whatsappRequired: string;
    needCountry: string;
    needPresence: string;
    needPractice: string;
    needLang: string;
    needSpec: string;
    needBio: string;
    needPhoto: string;
    needEducation: string;
    acceptTermsRequired: string;
  };
  success: {
    fieldValid: string;
    emailValid: string;
    pwdOk: string;
    allGood: string;
  };
  secureNote: string;
  footerTitle: string;
  footerText: string;
  langPlaceholder: string;
  previewTitle: string;
  previewToggleOpen: string;
  previewToggleClose: string;
};

const I18N: Record<I18nKey, I18nShape> = {
  fr: {
    metaTitle: "Inscription Avocat • SOS Expats",
    metaDesc:
      "Rejoignez le réseau SOS Expats : des clients partout, des dossiers malins, et vous aux commandes 🚀.",
    heroTitle: "Inscription Avocat",
    heroSubtitle:
      "Partagez votre expertise avec des expats du monde entier. On s'occupe du reste 😉",
    already: "Déjà inscrit ?",
    login: "Se connecter",
    personalInfo: "Informations personnelles",
    geoInfo: "Où vous opérez",
    proInfo: "Votre pratique",
    acceptTerms: "J'accepte les",
    termsLink: "CGU Avocats",
    create: "Créer mon compte avocat",
    loading: "On prépare tout pour vous… ⏳",
    firstName: "Prénom",
    lastName: "Nom",
    email: "Adresse email",
    password: "Mot de passe",
    phone: "Téléphone",
    whatsapp: "Numéro WhatsApp",
    countryCode: "Indicatif pays",
    residenceCountry: "Pays de résidence",
    presenceCountry: "Pays où vous êtes en ce moment",
    yoe: "Années d'expérience",
    gradYear: "Année de diplôme",
    bio: "Description professionnelle",
    profilePhoto: "Photo de profil",
    specialties: "Spécialités",
    practiceCountries: "Pays d'intervention",
    languages: "Langues parlées",
    formations: "Formations",
    addFormation: "Ajouter une formation",
    addPractice: "Ajouter un pays d'intervention",
    addSpecialty: "Ajouter une spécialité",
    specifyCountry: "Précisez votre pays",
    specifyPractice: "Précisez le pays",
    specifySpecialty: "Précisez la spécialité",
    help: {
      minPassword: "6 caractères et c'est parti (aucune contrainte) 💃",
      emailPlaceholder: "votre@email.com",
      firstNamePlaceholder: "Comment on vous appelle ? 😊",
      bioHint:
        "Racontez en 2–3 phrases comment vous aidez les expats (50 caractères mini).",
    },
    errors: {
      title: "Petites retouches avant le grand saut ✨",
      firstNameRequired: "On veut bien vous appeler… mais comment ? 😄",
      lastNameRequired: "Un petit nom de famille pour faire pro ? 👔",
      emailRequired: "On a besoin de votre email pour vous tenir au courant 📬",
      emailInvalid:
        "Cette adresse a l'air louche… Essayez plutôt nom@exemple.com 🧐",
      emailTaken:
        "Oups, cet email est déjà utilisé. Vous avez peut-être déjà un compte ? 🔑",
      passwordTooShort: "Juste 6 caractères minimum — easy ! 💪",
      phoneRequired: "On vous sonne où ? 📞",
      whatsappRequired: "On papote aussi sur WhatsApp ? 💬",
      needCountry: "Votre pays de résidence, s'il vous plaît 🌍",
      needPresence: "Où êtes-vous actuellement ? ✈️",
      needPractice: "Ajoutez au moins un pays d'intervention 🗺️",
      needLang: "Choisissez au moins une langue 🗣️",
      needSpec: "Une spécialité, et vous brillez ✨",
      needBio: "Encore un petit effort : 50 caractères minimum 📝",
      needPhoto: "Une photo pro, et c'est 100% plus rassurant 📸",
      needEducation: "Ajoutez au moins une formation 🎓",
      acceptTermsRequired: "Un petit clic sur les conditions et on y va ✅",
    },
    success: {
      fieldValid: "Parfait ! ✨",
      emailValid: "Super email ! 👌",
      pwdOk: "Mot de passe validé 🔒",
      allGood: "Tout est bon, prêt·e à rayonner 🌟",
    },
    secureNote: "Données protégées • Validation sous 24h • Support juridique",
    footerTitle: "⚖️ Rejoignez la communauté SOS Expats",
    footerText: "Des avocats vérifiés, des clients engagés — let's go !",
    langPlaceholder: "Sélectionnez les langues",
    previewTitle: "Aperçu live du profil",
    previewToggleOpen: "Masquer l'aperçu",
    previewToggleClose: "Voir l'aperçu",
  },
  en: {
    metaTitle: "Lawyer Registration • SOS Expats",
    metaDesc:
      "Join SOS Expats: smart clients, smooth cases, and you in the driver's seat 🚀.",
    heroTitle: "Lawyer Registration",
    heroSubtitle:
      "Share your expertise with expats worldwide. We handle the boring bits 😉",
    already: "Already registered?",
    login: "Log in",
    personalInfo: "Personal info",
    geoInfo: "Where you operate",
    proInfo: "Your practice",
    acceptTerms: "I accept the",
    termsLink: "Lawyers T&Cs",
    create: "Create my lawyer account",
    loading: "Getting things ready for you… ⏳",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    password: "Password",
    phone: "Phone",
    whatsapp: "WhatsApp Number",
    countryCode: "Country code",
    residenceCountry: "Country of residence",
    presenceCountry: "Where you are right now",
    yoe: "Years of experience",
    gradYear: "Graduation year",
    bio: "Professional bio",
    profilePhoto: "Profile photo",
    specialties: "Specialties",
    practiceCountries: "Practice countries",
    languages: "Spoken languages",
    formations: "Education",
    addFormation: "Add a formation",
    addPractice: "Add a practice country",
    addSpecialty: "Add a specialty",
    specifyCountry: "Specify your country",
    specifyPractice: "Specify the country",
    specifySpecialty: "Specify the specialty",
    help: {
      minPassword: "6+ characters and you're good 💃",
      emailPlaceholder: "you@example.com",
      firstNamePlaceholder: "How should we call you? 😊",
      bioHint: "In 2–3 lines, tell expats how you help (min 50 chars).",
    },
    errors: {
      title: "Tiny tweaks before we launch ✨",
      firstNameRequired: "We'd love to address you… what's your name? 😄",
      lastNameRequired: "A last name keeps it professional 👔",
      emailRequired: "We need your email to keep you posted 📬",
      emailInvalid: "That email looks off. Try name@example.com 🧐",
      emailTaken:
        "This email is already in use. Maybe you already have an account? 🔑",
      passwordTooShort: "At least 6 characters — easy peasy! 💪",
      phoneRequired: "Where can we call you? 📞",
      whatsappRequired: "WhatsApp number please? 💬",
      needCountry: "Your residence country, please 🌍",
      needPresence: "Where are you at the moment? ✈️",
      needPractice: "Add at least one practice country 🗺️",
      needLang: "Pick at least one language 🗣️",
      needSpec: "Choose at least one specialty ✨",
      needBio: "Push it to 50 characters, you got this 📝",
      needPhoto: "A professional photo builds trust 📸",
      needEducation: "Add at least one formation 🎓",
      acceptTermsRequired: "Tick the box and we're rolling ✅",
    },
    success: {
      fieldValid: "Looks great! ✨",
      emailValid: "Nice email! 👌",
      pwdOk: "Password good to go 🔒",
      allGood: "All set — time to shine 🌟",
    },
    secureNote: "Data protected • 24h validation • Legal support",
    footerTitle: "⚖️ Join the SOS Expats community",
    footerText: "Verified lawyers, great clients — let's go!",
    langPlaceholder: "Select languages",
    previewTitle: "Live profile preview",
    previewToggleOpen: "Hide preview",
    previewToggleClose: "Show preview",
  },
};

const mapDuo = (list: Duo[], lang: I18nKey) => list.map((item) => item[lang]);

/* ========= Mini composants feedback ========= */
const FieldError = React.memo(
  ({ error, show }: { error?: string; show: boolean }) => {
    if (!show || !error) return null;
    return (
      <div className="mt-1 flex items-center gap-1 text-sm text-red-600 bg-red-50 rounded-lg px-2 py-1">
        <XCircle className="h-4 w-4 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }
);
FieldError.displayName = "FieldError";

const FieldSuccess = React.memo(
  ({ show, message }: { show: boolean; message: string }) => {
    if (!show) return null;
    return (
      <div className="mt-1 flex items-center gap-1 text-sm text-green-600 bg-green-50 rounded-lg px-2 py-1">
        <CheckCircle className="h-4 w-4 flex-shrink-0" />
        <span>{message}</span>
      </div>
    );
  }
);
FieldSuccess.displayName = "FieldSuccess";

/* ========= Avatar + Preview ========= */
const Avatar = ({ src, name }: { src?: string; name: string }) => {
  if (src)
    return (
      <img
        src={src}
        alt={name}
        className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-200"
      />
    );
  const initials =
    name
      .split(" ")
      .map((p) => p.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("") || "🙂";
  return (
    <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center font-bold ring-2 ring-indigo-200">
      {initials}
    </div>
  );
};

// const LawyerPreviewCard = ({
//   lang,
//   t,
//   progress,
//   fullName,
//   photo,
//   currentCountry,
//   presenceCountry,
//   practiceCountries,
//   specialties,
//   languages,
//   whatsapp,
//   yearsOfExperience,
// }: {
//   lang: I18nKey;
//   t: I18nShape;
//   progress: number;
//   fullName: string;
//   photo?: string;
//   currentCountry?: string;
//   presenceCountry?: string;
//   practiceCountries: string[];
//   specialties: string[];
//   languages: string[];
//   whatsapp?: string;
//   yearsOfExperience?: number;
// }) => {
//   const intl = useIntl();
//   return (
//     <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-5">
//       <div className="flex items-center gap-3">
//         <Avatar src={photo} name={fullName} />
//         <div>
//           <h3 className="text-lg font-extrabold text-gray-900 leading-tight">
//             {fullName || (lang === "en" ? "Your Name" : "Votre nom")}
//           </h3>
//           <p className="text-xs text-gray-500">
//             {lang === "en" ? "Lawyer" : "Avocat"} • {progress}%{" "}
//             {lang === "en" ? "complete" : "complet"}
//           </p>
//         </div>
//       </div>

//       <div className="mt-3">
//         <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
//           <div
//             className="h-2 bg-indigo-500"
//             style={{ width: `${progress}%` }}
//           />
//         </div>
//       </div>

//       <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
//         {(currentCountry || presenceCountry) && (
//           <div className="flex items-center gap-2 text-gray-700">
//             <MapPin className="w-4 h-4 text-indigo-600" />
//             <span className="font-medium">
//               {currentCountry || (lang === "en" ? "Residence" : "Résidence")}
//             </span>
//             {presenceCountry && (
//               <span className="ml-auto rounded-full px-2 py-0.5 text-xs bg-indigo-50 border border-indigo-200">
//                 {presenceCountry}
//               </span>
//             )}
//           </div>
//         )}
//         {typeof yearsOfExperience === "number" && yearsOfExperience >= 0 && (
//           <div className="text-gray-700">
//             {lang === "en" ? "Experience:" : "Expérience :"}{" "}
//             <strong>{yearsOfExperience}</strong>{" "}
//             {lang === "en" ? "years" : "ans"}
//           </div>
//         )}
//       </div>

//       {!!languages.length && (
//         <div className="mt-4">
//           <p className="text-xs font-semibold text-gray-700 mb-1">
//             {lang === "en" ? "Languages" : "Langues"}
//           </p>
//           <div className="flex flex-wrap gap-2">
//             {languages.map((l) => (
//               <span
//                 key={l}
//                 className="px-2 py-1 rounded-lg bg-indigo-100 text-indigo-800 text-xs border border-indigo-200"
//               >
//                 {l.toUpperCase()}
//               </span>
//             ))}
//           </div>
//         </div>
//       )}

//       {!!specialties.length && (
//         <div className="mt-3">
//           <p className="text-xs font-semibold text-gray-700 mb-1">
//             {/* {t.specialties} */}
//             {intl.formatMessage({ id: "registerLawyer.fields.specialties" })}
//           </p>
//           <div className="flex flex-wrap gap-2">
//             {specialties.map((s, i) => (
//               <span
//                 key={`${s}-${i}`}
//                 className="px-2 py-1 rounded-lg bg-white text-gray-800 text-xs border border-indigo-200"
//               >
//                 {s}
//               </span>
//             ))}
//           </div>
//         </div>
//       )}

//       {!!practiceCountries.length && (
//         <div className="mt-3">
//           <p className="text-xs font-semibold text-gray-700 mb-1">
//             {/* {t.practiceCountries} */}
//             {intl.formatMessage({
//               id: "registerLawyer.fields.practiceCountries",
//             })}
//           </p>
//           <div className="flex flex-wrap gap-2">
//             {practiceCountries.map((c, i) => (
//               <span
//                 key={`${c}-${i}`}
//                 className="px-2 py-1 rounded-lg bg-white text-gray-800 text-xs border border-indigo-200"
//               >
//                 {c}
//               </span>
//             ))}
//           </div>
//         </div>
//       )}

//       {whatsapp && (
//         <div className="mt-4 flex items-center gap-2 text-sm text-gray-700">
//           <MessageCircle className="w-4 h-4 text-indigo-600" />
//           <span className="truncate">{whatsapp}</span>
//         </div>
//       )}

//       <p className="mt-4 text-xs text-gray-500">
//         {lang === "en"
//           ? "This is what clients will see. Make it shine ✨"
//           : "Ce que les clients verront. Faites briller votre profil ✨"}
//       </p>
//     </div>
//   );
// };

const LawyerPreviewCard = ({
  lang,
  t,
  progress,
  fullName,
  photo,
  currentCountry,
  presenceCountry,
  practiceCountries,
  specialties,
  languages,
  whatsapp,
  yearsOfExperience,
}: {
  lang: I18nKey;
  t: I18nShape;
  progress: number;
  fullName: string;
  photo?: string;
  currentCountry?: string;
  presenceCountry?: string;
  practiceCountries: string[];
  specialties: string[];
  languages: string[];
  whatsapp?: string;
  yearsOfExperience?: number;
}) => {
  const intl = useIntl();

  // Translation helper
  const getText = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      yourName: {
        en: "Your Name",
        fr: "Votre nom",
        es: "Tu nombre",
        de: "Ihr Name",
        ru: "Ваше имя",
        hi: "आपका नाम",
      },
      lawyer: {
        en: "Lawyer",
        fr: "Avocat",
        es: "Abogado",
        de: "Anwalt",
        ru: "Юрист",
        hi: "वकील",
      },
      complete: {
        en: "complete",
        fr: "complet",
        es: "completo",
        de: "vollständig",
        ru: "завершено",
        hi: "पूर्ण",
      },
      residence: {
        en: "Residence",
        fr: "Résidence",
        es: "Residencia",
        de: "Wohnsitz",
        ru: "Резиденция",
        hi: "निवास",
      },
      experience: {
        en: "Experience:",
        fr: "Expérience :",
        es: "Experiencia:",
        de: "Erfahrung:",
        ru: "Опыт:",
        hi: "अनुभव:",
      },
      years: {
        en: "years",
        fr: "ans",
        es: "años",
        de: "Jahre",
        ru: "лет",
        hi: "वर्ष",
      },
      languages: {
        en: "Languages",
        fr: "Langues",
        es: "Idiomas",
        de: "Sprachen",
        ru: "Языки",
        hi: "भाषाएं",
      },
      clientPreview: {
        en: "This is what clients will see. Make it shine ✨",
        fr: "Ce que les clients verront. Faites briller votre profil ✨",
        es: "Esto es lo que verán los clientes. Hazlo brillar ✨",
        de: "Das sehen Kunden. Lassen Sie es glänzen ✨",
        ru: "Это увидят клиенты. Сделайте его ярким ✨",
        hi: "ग्राहक यह देखेंगे। इसे चमकाएं ✨",
      },
    };

    return translations[key]?.[lang] || translations[key]?.en || "";
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <Avatar src={photo} name={fullName} />
        <div>
          <h3 className="text-lg font-extrabold text-gray-900 leading-tight">
            {fullName || getText("yourName")}
          </h3>
          <p className="text-xs text-gray-500">
            {getText("lawyer")} • {progress}% {getText("complete")}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-2 bg-indigo-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
        {(currentCountry || presenceCountry) && (
          <div className="flex items-center gap-2 text-gray-700">
            <MapPin className="w-4 h-4 text-indigo-600" />
            <span className="font-medium">
              {currentCountry || getText("residence")}
            </span>
            {presenceCountry && (
              <span className="ml-auto rounded-full px-2 py-0.5 text-xs bg-indigo-50 border border-indigo-200">
                {presenceCountry}
              </span>
            )}
          </div>
        )}
        {typeof yearsOfExperience === "number" && yearsOfExperience >= 0 && (
          <div className="text-gray-700">
            {getText("experience")} <strong>{yearsOfExperience}</strong>{" "}
            {getText("years")}
          </div>
        )}
      </div>

      {!!languages.length && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-700 mb-1">
            {getText("languages")}
          </p>
          <div className="flex flex-wrap gap-2">
            {languages.map((l) => (
              <span
                key={l}
                className="px-2 py-1 rounded-lg bg-indigo-100 text-indigo-800 text-xs border border-indigo-200"
              >
                {l.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}

      {!!specialties.length && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-700 mb-1">
            {intl.formatMessage({ id: "registerLawyer.fields.specialties" })}
          </p>
          <div className="flex flex-wrap gap-2">
            {specialties.map((s, i) => (
              <span
                key={`${s}-${i}`}
                className="px-2 py-1 rounded-lg bg-white text-gray-800 text-xs border border-indigo-200"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {!!practiceCountries.length && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-700 mb-1">
            {intl.formatMessage({
              id: "registerLawyer.fields.practiceCountries",
            })}
          </p>
          <div className="flex flex-wrap gap-2">
            {practiceCountries.map((c, i) => (
              <span
                key={`${c}-${i}`}
                className="px-2 py-1 rounded-lg bg-white text-gray-800 text-xs border border-indigo-200"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {whatsapp && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-700">
          <MessageCircle className="w-4 h-4 text-indigo-600" />
          <span className="truncate">{whatsapp}</span>
        </div>
      )}

      <p className="mt-4 text-xs text-gray-500">{getText("clientPreview")}</p>
    </div>
  );
};

/* ========= Helpers ========= */
const computePasswordStrength = (pw: string) => {
  if (!pw)
    return { percent: 0, labelFr: "", labelEn: "", color: "bg-gray-300" };
  let score = 0;
  if (pw.length >= 6) score += 30;
  if (pw.length >= 8) score += 20;
  if (pw.length >= 10) score += 15;
  if (pw.length >= 12) score += 15;
  if (/[a-z]/.test(pw)) score += 5;
  if (/[A-Z]/.test(pw)) score += 5;
  if (/\d/.test(pw)) score += 5;
  if (/[^a-zA-Z0-9]/.test(pw)) score += 5;
  const clamp = Math.min(100, score);
  let labelFr = "Excellent 🚀",
    labelEn = "Excellent 🚀",
    color = "bg-green-500";
  if (pw.length < 6) {
    labelFr = "Trop court 😅";
    labelEn = "Too short 😅";
    color = "bg-red-500";
  } else if (clamp < 40) {
    labelFr = "Faible 🙂";
    labelEn = "Weak 🙂";
    color = "bg-orange-500";
  } else if (clamp < 55) {
    labelFr = "Moyen 👍";
    labelEn = "Medium 👍";
    color = "bg-yellow-500";
  } else if (clamp < 70) {
    labelFr = "Bon 🔥";
    labelEn = "Good 🔥";
    color = "bg-blue-500";
  }
  return { percent: clamp, labelFr, labelEn, color };
};

const TagSelector = React.memo(
  ({
    items,
    onRemove,
    color = "indigo",
  }: {
    items: string[];
    onRemove: (v: string) => void;
    color?: "indigo" | "green";
  }) => {
    if (!items.length) return null;
    const tone =
      color === "green"
        ? "bg-green-100 text-green-800 border-green-300"
        : `bg-indigo-100 text-indigo-800 ${THEME.chip}`;
    return (
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {items.map((v, i) => (
            <span
              key={`${v}-${i}`}
              className={`${tone} px-3 py-1 rounded-xl text-sm border-2 flex items-center`}
            >
              {v}
              <button
                type="button"
                onClick={() => onRemove(v)}
                className="ml-2 hover:opacity-70"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
      </div>
    );
  }
);
TagSelector.displayName = "TagSelector";

const SectionHeader = React.memo(
  ({
    icon,
    title,
    subtitle,
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
  }) => (
    <div className="flex items-center space-x-3 mb-5">
      <div
        className={`bg-gradient-to-br ${THEME.gradFrom} ${THEME.gradTo} rounded-2xl p-3 shadow-md text-white`}
      >
        {icon}
      </div>
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
        {subtitle && (
          <p className="text-gray-600 text-sm sm:text-base mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
);
SectionHeader.displayName = "SectionHeader";

const RegisterLawyer: React.FC = () => {
  const intl = useIntl();
  const navigate = useNavigate();

  // --- Types sûrs (pas de any) ---
  type NavState = Readonly<{ selectedProvider?: Provider }>;
  function isProviderLike(v: unknown): v is Provider {
    if (typeof v !== "object" || v === null) return false;
    const o = v as Record<string, unknown>;
    return (
      typeof o.id === "string" &&
      typeof o.name === "string" &&
      (o.type === "lawyer" || o.type === "expat")
    );
  }

  const location = useLocation();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  useEffect(() => {
    const rawState: unknown = location.state;
    const state = (rawState ?? null) as NavState | null;
    const sp = state?.selectedProvider;
    if (isProviderLike(sp)) {
      try {
        sessionStorage.setItem("selectedProvider", JSON.stringify(sp));
      } catch {
        /* no-op */
      }
    }
  }, [location.state]);

  // Hooks simples sans react-hook-form
  const { register, isLoading, error } = useAuth();
  const { language } = useApp(); // 'fr' | 'en'
  const lang =
    (language as I18nKey) || "fr" || "en" || "es" || "de" || "ru" || "hi" || "pt";
  const t = I18N[lang];

  // ---- SEO / OG meta ----
  useEffect(() => {
    document.title = intl.formatMessage({ id: "registerLawyer.meta.title" });
    const ensure = (name: string, content: string, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        if (prop) el.setAttribute("property", name);
        else el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.content = content;
    };
    ensure(
      "description",
      intl.formatMessage({ id: "registerLawyer.meta.description" })
    );
    ensure(
      "og:title",
      intl.formatMessage({ id: "registerLawyer.meta.title" }),
      true
    );
    ensure(
      "og:description",
      intl.formatMessage({ id: "registerLawyer.meta.description" }),
      true
    );
    ensure("og:type", "website", true);
    ensure("twitter:card", "summary_large_image");
    ensure(
      "twitter:title",
      intl.formatMessage({ id: "registerLawyer.meta.title" })
    );
    ensure(
      "twitter:description",
      intl.formatMessage({ id: "registerLawyer.meta.description" })
    );
  }, [intl]);

  // ---- Initial state ----
  const initial: LawyerFormData = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    whatsapp: "",

    currentCountry: "",
    currentPresenceCountry: "",
    customCountry: "",
    preferredLanguage: lang,
    practiceCountries: [],
    customPracticeCountry: "",
    yearsOfExperience: 0,
    specialties: [],
    customSpecialty: "",
    graduationYear: new Date().getFullYear() - 5,
    profilePhoto: "",
    bio: "",
    educations: [""],
    availability: "available",
    acceptTerms: false,
  };

  const [form, setForm] = useState<LawyerFormData>(initial);
  const [selectedLanguages, setSelectedLanguages] = useState<
    MultiValue<LanguageOption>
  >([]);
  const [showPassword, setShowPassword] = useState(false);
  const [capsPassword, setCapsPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preview (mobile toggle)
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);

  // Refs
  const fieldRefs = {
    firstName: useRef<HTMLInputElement | null>(null),
    lastName: useRef<HTMLInputElement | null>(null),
    email: useRef<HTMLInputElement | null>(null),
    password: useRef<HTMLInputElement | null>(null),
    phone: useRef<HTMLInputElement | null>(null),
    whatsappNumber: useRef<HTMLInputElement | null>(null),
    currentCountry: useRef<HTMLSelectElement | null>(null),
    currentPresenceCountry: useRef<HTMLSelectElement | null>(null),
    bio: useRef<HTMLTextAreaElement | null>(null),
  };

  // ---- Options (bilingue) ----
  const countryOptions = useMemo(() => mapDuo(COUNTRIES, lang), [lang]);
  const specialtyOptions = useMemo(() => mapDuo(SPECIALTIES, lang), [lang]);

  // ---- Password strength ----
  const pwdStrength = useMemo(
    () => computePasswordStrength(form.password),
    [form.password]
  );

  // ---- Progress ----
  const progress = useMemo(() => {
    const fields = [
      !!form.firstName,
      !!form.lastName,
      EMAIL_REGEX.test(form.email),
      form.password.length >= 6,
      !!form.phone,
      !!form.whatsapp,

      !!form.currentCountry,
      !!form.currentPresenceCountry,
      form.bio.trim().length >= 50,
      !!form.profilePhoto,
      form.specialties.length > 0,
      form.practiceCountries.length > 0,
      (selectedLanguages as LanguageOption[]).length > 0,
      form.educations.some((e) => e.trim().length > 0),
      form.acceptTerms,
    ];
    const done = fields.filter(Boolean).length;
    return Math.round((done / fields.length) * 100);
  }, [form, selectedLanguages]);

  // ---- Classes ----
  const baseInput =
    "block w-full min-h-[44px] px-4 py-3 rounded-xl border transition-all duration-200 text-sm focus:outline-none";
  const getInputClassName = useCallback(
    (name: string, hasIcon = false) => {
      const hasErr = !!fieldErrors[name] && !!touched[name];
      const ok = !fieldErrors[name] && !!touched[name];
      let cl = baseInput + (hasIcon ? " pl-11" : "");
      if (hasErr)
        cl +=
          " bg-red-50/50 border-red-300 focus:ring-4 focus:ring-red-500/20 focus:border-red-500";
      else if (ok)
        cl +=
          " bg-green-50/50 border-green-300 focus:ring-4 focus:ring-green-500/20 focus:border-green-500";
      else
        cl += ` bg-white/90 border-gray-300 ${THEME.ring} hover:border-indigo-400`;
      return cl;
    },
    [fieldErrors, touched]
  );

  // ---- Touch / Change ----
  const markTouched = (name: string) =>
    setTouched((p) => ({ ...p, [name]: true }));

  const onChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name, value, type, checked } = e.target as HTMLInputElement;
      setForm((prev) => ({
        ...prev,
        [name]:
          type === "checkbox"
            ? checked
            : type === "number"
              ? Number(value)
              : value,
      }));

      if (fieldErrors[name]) {
        setFieldErrors((prev) => {
          const rest = { ...prev };
          delete rest[name];
          return rest;
        });
      }
    },
    [fieldErrors]
  );

  // ---- Sélections multi (pays de pratique / spécialités) ----
  const [showCustomCountry, setShowCustomCountry] = useState(false);
  const [showCustomSpecialty, setShowCustomSpecialty] = useState(false);

  const onPracticeSelect = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value;
      if (!v) return;
      const other = lang === "en" ? "Other" : "Autre";
      if (v === other) {
        setShowCustomCountry(true);
        e.target.value = "";
        return;
      }
      if (!form.practiceCountries.includes(v)) {
        setForm((prev) => ({
          ...prev,
          practiceCountries: [...prev.practiceCountries, v],
        }));
        setFieldErrors((prev) => ({ ...prev, practiceCountries: "" }));
      }
      e.target.value = "";
    },
    [form.practiceCountries, lang]
  );

  const removePractice = useCallback((v: string) => {
    setForm((prev) => ({
      ...prev,
      practiceCountries: prev.practiceCountries.filter((x) => x !== v),
    }));
  }, []);

  const addCustomPractice = useCallback(() => {
    const v = form.customPracticeCountry.trim();
    if (v && !form.practiceCountries.includes(v)) {
      setForm((prev) => ({
        ...prev,
        practiceCountries: [...prev.practiceCountries, v],
        customPracticeCountry: "",
      }));
      setShowCustomCountry(false);
      setFieldErrors((prev) => ({ ...prev, practiceCountries: "" }));
    }
  }, [form.customPracticeCountry, form.practiceCountries]);

  const onSpecialtySelect = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value;
      if (!v) return;
      const other = lang === "en" ? "Other" : "Autre";
      if (v === other) {
        setShowCustomSpecialty(true);
        e.target.value = "";
        return;
      }
      if (!form.specialties.includes(v)) {
        setForm((prev) => ({ ...prev, specialties: [...prev.specialties, v] }));
        setFieldErrors((prev) => ({ ...prev, specialties: "" }));
      }
      e.target.value = "";
    },
    [form.specialties, lang]
  );

  const removeSpecialty = useCallback((v: string) => {
    setForm((prev) => ({
      ...prev,
      specialties: prev.specialties.filter((x) => x !== v),
    }));
  }, []);

  const addCustomSpecialty = useCallback(() => {
    const v = form.customSpecialty.trim();
    if (v && !form.specialties.includes(v)) {
      setForm((prev) => ({
        ...prev,
        specialties: [...prev.specialties, v],
        customSpecialty: "",
      }));
      setShowCustomSpecialty(false);
      setFieldErrors((prev) => ({ ...prev, specialties: "" }));
    }
  }, [form.customSpecialty, form.specialties]);

  // Formations dynamiques
  const updateEducation = useCallback((idx: number, val: string) => {
    setForm((p) => {
      const arr = [...p.educations];
      arr[idx] = val;
      return { ...p, educations: arr };
    });
    setFieldErrors((prev) => ({ ...prev, educations: "" }));
  }, []);
  const addEducationField = useCallback(
    () => setForm((p) => ({ ...p, educations: [...p.educations, ""] })),
    []
  );
  const removeEducationField = useCallback((idx: number) => {
    setForm((p) => {
      const arr = p.educations.filter((_, i) => i !== idx);
      return { ...p, educations: arr.length ? arr : [""] };
    });
  }, []);

  // ---- Validation complète ----
  // const validateAll = useCallback(() => {
  //   const e: Record<string, string> = {};
  //   if (!form.firstName.trim()) e.firstName = t.errors.firstNameRequired;
  //   if (!form.lastName.trim()) e.lastName = t.errors.lastNameRequired;

  //   if (!form.email.trim()) e.email = t.errors.emailRequired;
  //   else if (!EMAIL_REGEX.test(form.email)) e.email = t.errors.emailInvalid;

  //   if (!form.password || form.password.length < 6)
  //     e.password = t.errors.passwordTooShort;

  //   if (!form.phone.trim()) e.phone = t.errors.phoneRequired;
  //   if (!form.whatsapp.trim()) e.whatsapp = t.errors.whatsappRequired;

  //   if (!form.currentCountry) e.currentCountry = t.errors.needCountry;
  //   if (!form.currentPresenceCountry)
  //     e.currentPresenceCountry = t.errors.needPresence;

  //   if (form.practiceCountries.length === 0)
  //     e.practiceCountries = t.errors.needPractice;
  //   if (form.specialties.length === 0) e.specialties = t.errors.needSpec;
  //   if ((selectedLanguages as LanguageOption[]).length === 0)
  //     e.languages = t.errors.needLang;

  //   if (!form.bio.trim() || form.bio.trim().length < 50)
  //     e.bio = t.errors.needBio;
  //   if (!form.profilePhoto) e.profilePhoto = t.errors.needPhoto;
  //   if (!form.educations.some((v) => v.trim().length > 0))
  //     e.educations = t.errors.needEducation;
  //   if (!form.acceptTerms) e.acceptTerms = t.errors.acceptTermsRequired;

  //   setFieldErrors(e);

  //   const order = [
  //     "firstName",
  //     "lastName",
  //     "email",
  //     "password",
  //     "phone",
  //     "currentCountry",
  //     "currentPresenceCountry",
  //     "bio",
  //   ] as const;
  //   const firstKey = order.find((k) => e[k]);
  //   if (firstKey && fieldRefs[firstKey]?.current) {
  //     fieldRefs[firstKey]!.current!.focus();
  //     window.scrollTo({
  //       top:
  //         fieldRefs[firstKey]!.current!.getBoundingClientRect().top +
  //         window.scrollY -
  //         120,
  //       behavior: "smooth",
  //     });
  //   }

  //   return Object.keys(e).length === 0;
  // }, [form, selectedLanguages, t]);

  const validateAll = useCallback(() => {
    const e: Record<string, string> = {};

    if (!form.firstName.trim())
      e.firstName = intl.formatMessage({
        id: "registerLawyer.errors.firstNameRequired",
      });

    if (!form.lastName.trim())
      e.lastName = intl.formatMessage({
        id: "registerLawyer.errors.lastNameRequired",
      });

    if (!form.email.trim())
      e.email = intl.formatMessage({
        id: "registerLawyer.errors.emailRequired",
      });
    else if (!EMAIL_REGEX.test(form.email))
      e.email = intl.formatMessage({
        id: "registerLawyer.errors.emailInvalid",
      });

    if (!form.password || form.password.length < 6)
      e.password = intl.formatMessage({
        id: "registerLawyer.errors.passwordTooShort",
      });

    if (!form.phone.trim())
      e.phone = intl.formatMessage({
        id: "registerLawyer.errors.phoneRequired",
      });

    if (!form.whatsapp.trim())
      e.whatsapp = intl.formatMessage({
        id: "registerLawyer.errors.whatsappRequired",
      });

    if (!form.currentCountry)
      e.currentCountry = intl.formatMessage({
        id: "registerLawyer.errors.needCountry",
      });

    if (!form.currentPresenceCountry)
      e.currentPresenceCountry = intl.formatMessage({
        id: "registerLawyer.errors.needPresence",
      });

    if (form.practiceCountries.length === 0)
      e.practiceCountries = intl.formatMessage({
        id: "registerLawyer.errors.needPractice",
      });

    if (form.specialties.length === 0)
      e.specialties = intl.formatMessage({
        id: "registerLawyer.errors.needSpecialty",
      });

    if ((selectedLanguages as LanguageOption[]).length === 0)
      e.languages = intl.formatMessage({
        id: "registerLawyer.errors.needLanguage",
      });

    if (!form.bio.trim() || form.bio.trim().length < 50)
      e.bio = intl.formatMessage({ id: "registerLawyer.errors.needBio" });

    if (!form.profilePhoto)
      e.profilePhoto = intl.formatMessage({
        id: "registerLawyer.errors.needPhoto",
      });

    if (!form.educations.some((v) => v.trim().length > 0))
      e.educations = intl.formatMessage({
        id: "registerLawyer.errors.needEducation",
      });

    if (!form.acceptTerms)
      e.acceptTerms = intl.formatMessage({
        id: "registerLawyer.errors.acceptTermsRequired",
      });

    setFieldErrors(e);

    const order = [
      "firstName",
      "lastName",
      "email",
      "password",
      "phone",
      "currentCountry",
      "currentPresenceCountry",
      "bio",
    ] as const;

    const firstKey = order.find((k) => e[k]);
    if (firstKey && fieldRefs[firstKey]?.current) {
      fieldRefs[firstKey]!.current!.focus();
      window.scrollTo({
        top:
          fieldRefs[firstKey]!.current!.getBoundingClientRect().top +
          window.scrollY -
          120,
        behavior: "smooth",
      });
    }

    return Object.keys(e).length === 0;
  }, [form, selectedLanguages, intl]);

  // ---- Missing checklist (UX clair) ----
  // const missing = useMemo(() => {
  //   const langs = (selectedLanguages as LanguageOption[]).length > 0;

  //   return [
  //     {
  //       key: "firstName",
  //       ok: !!form.firstName,
  //       labelFr: "Prénom",
  //       labelEn: "First name",
  //     },
  //     {
  //       key: "lastName",
  //       ok: !!form.lastName,
  //       labelFr: "Nom",
  //       labelEn: "Last name",
  //     },
  //     {
  //       key: "email",
  //       ok: EMAIL_REGEX.test(form.email),
  //       labelFr: "Email valide",
  //       labelEn: "Valid email",
  //     },
  //     {
  //       key: "password",
  //       ok: form.password.length >= 6,
  //       labelFr: "Mot de passe (≥ 6 caractères)",
  //       labelEn: "Password (≥ 6 chars)",
  //     },
  //     {
  //       key: "phone",
  //       ok: !!form.phone && !!(parsePhoneNumberFromString(form.phone) && parsePhoneNumberFromString(form.phone).isValid()),
  //       labelFr: "Téléphone",
  //       labelEn: "Phone",
  //     },
  //     {
  //       key: "whatsapp",
  //       ok: !!form.whatsapp && !!(parsePhoneNumberFromString(form.whatsapp) && parsePhoneNumberFromString(form.whatsapp).isValid()),
  //       labelFr: "WhatsApp",
  //       labelEn: "WhatsApp",
  //     },
  //     {
  //       key: "currentCountry",
  //       ok: !!form.currentCountry,
  //       labelFr: "Pays de résidence",
  //       labelEn: "Residence country",
  //     },
  //     {
  //       key: "currentPresenceCountry",
  //       ok: !!form.currentPresenceCountry,
  //       labelFr: "Pays de présence",
  //       labelEn: "Presence country",
  //     },
  //     {
  //       key: "practiceCountries",
  //       ok: form.practiceCountries.length > 0,
  //       labelFr: "Au moins un pays d'intervention",
  //       labelEn: "At least one practice country",
  //     },
  //     {
  //       key: "languages",
  //       ok: langs,
  //       labelFr: "Au moins une langue",
  //       labelEn: "At least one language",
  //     },
  //     {
  //       key: "specialties",
  //       ok: form.specialties.length > 0,
  //       labelFr: "Au moins une spécialité",
  //       labelEn: "At least one specialty",
  //     },
  //     {
  //       key: "bio",
  //       ok: form.bio.trim().length >= 50,
  //       labelFr: "Bio (≥ 50 caractères)",
  //       labelEn: "Bio (≥ 50 chars)",
  //     },
  //     {
  //       key: "profilePhoto",
  //       ok: !!form.profilePhoto,
  //       labelFr: "Photo de profil",
  //       labelEn: "Profile photo",
  //     },
  //     {
  //       key: "educations",
  //       ok: form.educations.some((v) => v.trim().length > 0),
  //       labelFr: "Au moins une formation",
  //       labelEn: "At least one education",
  //     },
  //     {
  //       key: "acceptTerms",
  //       ok: !!form.acceptTerms,
  //       labelFr: "Accepter les CGU",
  //       labelEn: "Accept T&Cs",
  //     },
  //   ];
  // }, [form, selectedLanguages]);

  const missing = useMemo(() => {
    const langs = (selectedLanguages as LanguageOption[]).length > 0;

    return [
      {
        key: "firstName",
        ok: !!form.firstName,
        label: {
          en: "First name",
          es: "Nombre",
          fr: "Prénom",
          de: "Vorname",
          ru: "Имя",
          hi: "पहला नाम",
        },
      },
      {
        key: "lastName",
        ok: !!form.lastName,
        label: {
          en: "Last name",
          es: "Apellido",
          fr: "Nom",
          de: "Nachname",
          ru: "Фамилия",
          hi: "उपनाम",
        },
      },
      {
        key: "email",
        ok: EMAIL_REGEX.test(form.email),
        label: {
          en: "Valid email",
          es: "Email válido",
          fr: "Email valide",
          de: "Gültige E-Mail",
          ru: "Действительный email",
          hi: "मान्य ईमेल",
        },
      },
      {
        key: "password",
        ok: form.password.length >= 6,
        label: {
          en: "Password (≥ 6 chars)",
          es: "Contraseña (≥ 6 caracteres)",
          fr: "Mot de passe (≥ 6 caractères)",
          de: "Passwort (≥ 6 Zeichen)",
          ru: "Пароль (≥ 6 символов)",
          hi: "पासवर्ड (≥ 6 अक्षर)",
        },
      },
      {
        key: "phone",
        ok:
          !!form.phone &&
          !!(
            parsePhoneNumberFromString(form.phone) &&
            parsePhoneNumberFromString(form.phone).isValid()
          ),
        label: {
          en: "Phone",
          es: "Teléfono",
          fr: "Téléphone",
          de: "Telefon",
          ru: "Телефон",
          hi: "फ़ोन",
        },
      },
      {
        key: "whatsapp",
        ok:
          !!form.whatsapp &&
          !!(
            parsePhoneNumberFromString(form.whatsapp) &&
            parsePhoneNumberFromString(form.whatsapp).isValid()
          ),
        label: {
          en: "WhatsApp",
          es: "WhatsApp",
          fr: "WhatsApp",
          de: "WhatsApp",
          ru: "WhatsApp",
          hi: "WhatsApp",
        },
      },
      {
        key: "currentCountry",
        ok: !!form.currentCountry,
        label: {
          en: "Residence country",
          es: "País de residencia",
          fr: "Pays de résidence",
          de: "Wohnsitzland",
          ru: "Страна проживания",
          hi: "निवास देश",
        },
      },
      {
        key: "currentPresenceCountry",
        ok: !!form.currentPresenceCountry,
        label: {
          en: "Presence country",
          es: "País de presencia",
          fr: "Pays de présence",
          de: "Anwesenheitsland",
          ru: "Страна присутствия",
          hi: "उपस्थिति देश",
        },
      },
      {
        key: "practiceCountries",
        ok: form.practiceCountries.length > 0,
        label: {
          en: "At least one practice country",
          es: "Al menos un país de práctica",
          fr: "Au moins un pays d'intervention",
          de: "Mindestens ein Praxisland",
          ru: "Хотя бы одна страна практики",
          hi: "कम से कम एक अभ्यास देश",
        },
      },
      {
        key: "languages",
        ok: langs,
        label: {
          en: "At least one language",
          es: "Al menos un idioma",
          fr: "Au moins une langue",
          de: "Mindestens eine Sprache",
          ru: "Хотя бы один язык",
          hi: "कम से कम एक भाषा",
        },
      },
      {
        key: "specialties",
        ok: form.specialties.length > 0,
        label: {
          en: "At least one specialty",
          es: "Al menos una especialidad",
          fr: "Au moins une spécialité",
          de: "Mindestens eine Spezialität",
          ru: "Хотя бы одна специальность",
          hi: "कम से कम एक विशेषता",
        },
      },
      {
        key: "bio",
        ok: form.bio.trim().length >= 50,
        label: {
          en: "Bio (≥ 50 chars)",
          es: "Biografía (≥ 50 caracteres)",
          fr: "Bio (≥ 50 caractères)",
          de: "Bio (≥ 50 Zeichen)",
          ru: "Биография (≥ 50 символов)",
          hi: "बायो (≥ 50 अक्षर)",
        },
      },
      {
        key: "profilePhoto",
        ok: !!form.profilePhoto,
        label: {
          en: "Profile photo",
          es: "Foto de perfil",
          fr: "Photo de profil",
          de: "Profilbild",
          ru: "Фото профиля",
          hi: "प्रोफ़ाइल फ़ोटो",
        },
      },
      {
        key: "educations",
        ok: form.educations.some((v) => v.trim().length > 0),
        label: {
          en: "At least one education",
          es: "Al menos una formación",
          fr: "Au moins une formation",
          de: "Mindestens eine Ausbildung",
          ru: "Хотя бы одно образование",
          hi: "कम से कम एक शिक्षा",
        },
      },
      {
        key: "acceptTerms",
        ok: !!form.acceptTerms,
        label: {
          en: "Accept T&Cs",
          es: "Aceptar T&C",
          fr: "Accepter les CGU",
          de: "AGB akzeptieren",
          ru: "Принять условия",
          hi: "नियम स्वीकार करें",
        },
      },
    ];
  }, [form, selectedLanguages]);

  const focusFirstMissingField = useCallback(() => {
    const first = missing.find((m) => !m.ok);
    if (!first) return;
    const ref = fieldRefs[first.key as keyof typeof fieldRefs]?.current as
      | HTMLElement
      | undefined;
    if (ref) {
      ref.focus();
      window.scrollTo({
        top: ref.getBoundingClientRect().top + window.scrollY - 120,
        behavior: "smooth",
      });
    }
  }, [missing]);

  // ---- Submit ----
  const handleSubmit = useCallback(
    async (ev: React.FormEvent) => {
      ev.preventDefault();

      console.log("=== FORM SUBMISSION ATTEMPT ===");
      console.log("Form Data:", form);
      // return

      setTouched((prev) => ({
        ...prev,
        firstName: true,
        lastName: true,
        email: true,
        password: true,
        phone: true,
        currentCountry: true,
        currentPresenceCountry: true,
        bio: true,
        acceptTerms: true,
      }));
      if (isSubmitting) return;
      setIsSubmitting(true);

      if (!validateAll()) {
        setIsSubmitting(false);
        return;
      }

      try {
        console.log("🔐 Setting auth persistence to LOCAL...");
        await setPersistence(auth, browserLocalPersistence);
        console.log("✅ Auth persistence set");

        const languageCodes = (selectedLanguages as LanguageOption[]).map(
          (l) => l.value
        );
        const someOther = lang === "en" ? "Other" : "Autre";

        const userData = {
          role: "lawyer" as const,
          type: "lawyer" as const,
          email: form.email.trim().toLowerCase(),
          fullName: `${form.firstName.trim()} ${form.lastName.trim()}`,
          name: `${form.firstName.trim()} ${form.lastName.trim()}`,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),

          phone: form.phone,
          whatsapp: form.whatsapp,
          currentCountry:
            form.currentCountry === someOther
              ? form.customCountry
              : form.currentCountry,
          currentPresenceCountry: form.currentPresenceCountry,
          country: form.currentPresenceCountry,
          practiceCountries: form.practiceCountries,
          profilePhoto: form.profilePhoto,
          photoURL: form.profilePhoto,
          avatar: form.profilePhoto,
          languages: languageCodes,
          languagesSpoken: languageCodes,
          specialties: form.specialties,
          education: form.educations.map((e) => e.trim()).filter(Boolean),
          yearsOfExperience: form.yearsOfExperience,
          graduationYear: form.graduationYear,
          bio: form.bio.trim(),
          description: form.bio.trim(),
          availability: form.availability,
          isOnline: form.availability === "available",
          isApproved: false,
          isVisible: true,
          isActive: true,
          rating: 4.5,
          reviewCount: 0,
          preferredLanguage: form.preferredLanguage,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await register(userData, form.password);

        // ============================================
        // STEP 2: Create Stripe Account (NOT KYC yet!)
        // ============================================
        console.log("💳 Creating Stripe account...");

        const { getFunctions, httpsCallable } = await import(
          "firebase/functions"
        );
        const functions = getFunctions(undefined, "europe-west1");

        const createStripeAccount = httpsCallable(
          functions,
          "createStripeAccount"
        );

        const selectedCountryName =
          form.currentCountry === "other"
            ? form.customCountry
            : form.currentCountry;

        const stripeResult = await createStripeAccount({
          email: form.email.trim().toLowerCase(),
          currentCountry: getCountryCode(form.currentCountry),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          userType: "lawyer", // ✅ Specify lawyer
        });
        const result = stripeResult.data as {
          success: boolean;
          accountId: string;
          message: string;
        };

        console.log("✅ Stripe account created:", result.accountId);

        navigate(redirect, {
          replace: true,
          state: {
            message:
              lang === "en"
                ? "Registration successful! Your profile will be validated within 24h."
                : "Inscription réussie ! Votre profil sera validé sous 24h.",
            type: "success",
          },
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error";
        setFieldErrors((prev) => ({ ...prev, general: msg }));
        window.scrollTo({ top: 0, behavior: "smooth" });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      validateAll,
      register,
      form,
      selectedLanguages,
      navigate,
      redirect,
      lang,
    ]
  );

  // ---- Can submit ----
  const canSubmit = useMemo(() => {
    return (
      !!form.firstName &&
      !!form.lastName &&
      EMAIL_REGEX.test(form.email) &&
      form.password.length >= 6 &&
      !!form.phone &&
      !!(
        parsePhoneNumberFromString(form.phone) &&
        parsePhoneNumberFromString(form.phone).isValid()
      ) &&
      !!form.whatsapp &&
      !!(
        parsePhoneNumberFromString(form.whatsapp) &&
        parsePhoneNumberFromString(form.whatsapp).isValid()
      ) &&
      !!form.currentCountry &&
      !!form.currentPresenceCountry &&
      form.bio.trim().length >= 50 &&
      !!form.profilePhoto &&
      form.specialties.length > 0 &&
      form.practiceCountries.length > 0 &&
      (selectedLanguages as LanguageOption[]).length > 0 &&
      form.educations.some((e) => e.trim().length > 0) &&
      form.acceptTerms &&
      !isLoading &&
      !isSubmitting
    );
  }, [form, selectedLanguages, isLoading, isSubmitting]);

  // ===== RENDER =====
  return (
    <Layout>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": ["WebPage", "RegisterAction"],
            name: intl.formatMessage({ id: "registerLawyer.meta.title" }),
            description: intl.formatMessage({ id: "registerLawyer.meta.desc" }),
            inLanguage: lang === "en" ? "en-US" : "fr-FR",
            publisher: { "@type": "Organization", name: "SOS Expats" },
          }),
        }}
      />

      <div className="min-h-screen bg-[linear-gradient(180deg,#f7f7ff_0%,#ffffff_35%,#f8f5ff_100%)]">
        {/* Hero */}
        <header className="pt-6 sm:pt-8 text-center">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-gray-900">
            <span
              className={`bg-gradient-to-r ${THEME.gradFrom} ${THEME.gradTo} bg-clip-text text-transparent`}
            >
              <FormattedMessage id="registerLawyer.ui.heroTitle" />
            </span>
          </h1>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-700 px-4">
            <FormattedMessage id="registerLawyer.ui.heroSubtitle" />
          </p>
          <div className="mt-3 inline-flex items-center gap-2">
            <span className="text-xs sm:text-sm px-3 py-1 rounded-full bg-white border shadow-sm">
              <FormattedMessage id="registerLawyer.ui.badgeMultilingual" />
            </span>
          </div>
          <div className="mt-3 text-xs sm:text-sm text-gray-500">
            <FormattedMessage id="registerLawyer.ui.already" />{" "}
            <Link
              to={`/login?redirect=${encodeURIComponent(redirect)}`}
              className="font-semibold underline text-indigo-700 hover:text-indigo-800"
            >
              <FormattedMessage id="registerLawyer.ui.login" />
            </Link>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
          {(error || fieldErrors.general) && (
            <div
              className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 p-4 mb-5"
              role="alert"
              aria-live="polite"
            >
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-semibold text-red-800">
                    <FormattedMessage id="registerLawyer.errors.title" />
                  </h3>
                  <p className="mt-1 text-sm text-red-700">
                    {error || fieldErrors.general}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Progress */}
          <div className="mb-6 max-w-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-700">
                <FormattedMessage id="registerLawyer.ui.progress" />
              </span>
              <span className="text-sm font-bold text-indigo-600">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Layout: Preview + Form */}
          <div className="lg:grid lg:grid-cols-3 lg:gap-6">
            {/* Mobile preview toggle */}
            <div className="mb-4 lg:hidden">
              <button
                type="button"
                onClick={() => setIsPreviewOpen((s) => !s)}
                className="w-full text-sm font-semibold px-4 py-2 rounded-xl border border-indigo-200 bg-white shadow-sm"
              >
                {isPreviewOpen
                  ? intl.formatMessage({
                      id: "registerLawyer.ui.previewToggleOpen",
                    })
                  : intl.formatMessage({
                      id: "registerLawyer.ui.previewToggleClose",
                    })}
              </button>
            </div>

            {/* PREVIEW (sticky on desktop) */}
            <aside
              className={`${isPreviewOpen ? "block" : "hidden"} lg:block lg:col-span-1 lg:order-last lg:sticky lg:top-6 mb-6`}
            >
              <h3 className="sr-only">
                {/* {t.previewTitle} */}
                {intl.formatMessage({ id: "registerLawyer.ui.previewTitle" })}
              </h3>
              <LawyerPreviewCard
                lang={lang}
                t={t}
                progress={progress}
                fullName={`${form.firstName || (lang === "en" ? "First" : "Prénom")} ${form.lastName || (lang === "en" ? "Last" : "Nom")}`.trim()}
                photo={form.profilePhoto}
                currentCountry={form.currentCountry}
                presenceCountry={form.currentPresenceCountry}
                practiceCountries={form.practiceCountries}
                specialties={form.specialties}
                languages={(selectedLanguages as LanguageOption[]).map(
                  (l) => l.value
                )}
                whatsapp={form.whatsapp}
                yearsOfExperience={form.yearsOfExperience}
              />
            </aside>

            {/* FORM */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 text-black">
                <form onSubmit={handleSubmit} noValidate>
                  {/* Personal */}
                  <section className="p-5 sm:p-6">
                    <SectionHeader
                      icon={<Users className="w-5 h-5" />}
                      title={intl.formatMessage({
                        id: "registerLawyer.ui.personalInfo",
                      })}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="firstName"
                          className="block text-sm font-semibold text-gray-800 mb-1"
                        >
                          <FormattedMessage id="registerLawyer.fields.firstName" />{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="firstName"
                          name="firstName"
                          ref={fieldRefs.firstName}
                          value={form.firstName}
                          onChange={onChange}
                          onBlur={() => markTouched("firstName")}
                          autoComplete="given-name"
                          className={getInputClassName("firstName")}
                          placeholder={intl.formatMessage({
                            id: "registerLawyer.help.firstNamePlaceholder",
                          })}
                          aria-describedby="firstName-error firstName-success"
                        />
                        <FieldError
                          error={fieldErrors.firstName}
                          show={!!(fieldErrors.firstName && touched.firstName)}
                        />
                        <FieldSuccess
                          show={
                            !fieldErrors.firstName &&
                            !!touched.firstName &&
                            !!form.firstName
                          }
                          // message={t.success.fieldValid}
                          message={intl.formatMessage({
                            id: "registerLawyer.success.fieldValid",
                          })}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="lastName"
                          className="block text-sm font-semibold text-gray-800 mb-1"
                        >
                          <FormattedMessage id="registerLawyer.fields.lastName" />{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="lastName"
                          name="lastName"
                          ref={fieldRefs.lastName}
                          value={form.lastName}
                          onChange={onChange}
                          onBlur={() => markTouched("lastName")}
                          autoComplete="family-name"
                          className={getInputClassName("lastName")}
                          placeholder={intl.formatMessage({
                            id: "registerLawyer.placeholder.lastName",
                          })}
                        />
                        <FieldError
                          error={fieldErrors.lastName}
                          show={!!(fieldErrors.lastName && touched.lastName)}
                        />
                        <FieldSuccess
                          show={
                            !fieldErrors.lastName &&
                            !!touched.lastName &&
                            !!form.lastName
                          }
                          // message={t.success.fieldValid}

                          message={intl.formatMessage({
                            id: "registerLawyer.success.fieldValid",
                          })}
                        />
                      </div>
                    </div>

                    {/* EMAIL */}
                    <div className="mt-4">
                      <label
                        htmlFor="email"
                        className="block text-sm font-semibold text-gray-800 mb-1"
                      >
                        <FormattedMessage id="registerLawyer.fields.email" />{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail
                          className={`pointer-events-none w-5 h-5 absolute left-3 top-3.5 ${THEME.icon}`}
                        />
                        <input
                          id="email"
                          name="email"
                          ref={fieldRefs.email}
                          type="email"
                          autoComplete="email"
                          value={form.email}
                          onChange={onChange}
                          onBlur={() => {
                            markTouched("email");
                          }}
                          placeholder={intl.formatMessage({
                            id: "registerLawyer.help.emailPlaceholder",
                          })}
                          aria-describedby="email-help"
                          className={`${getInputClassName("email", true)} relative z-10`}
                        />
                      </div>
                      <p id="email-help" className="mt-1 text-xs text-gray-500">
                        <FormattedMessage id="registerLawyer.help.emailInfo" />
                      </p>
                      <FieldError
                        error={
                          fieldErrors.email ||
                          (!EMAIL_REGEX.test(form.email) && touched.email
                            ? intl.formatMessage({
                                id: "registerLawyer.errors.emailInvalid",
                              })
                            : undefined)
                        }
                        show={
                          !!(
                            touched.email &&
                            (!!fieldErrors.email ||
                              !EMAIL_REGEX.test(form.email))
                          )
                        }
                      />
                      <FieldSuccess
                        show={!!touched.email && EMAIL_REGEX.test(form.email)}
                        message={intl.formatMessage({
                          id: "registerLawyer.success.emailValid",
                        })}
                      />
                    </div>

                    {/* PASSWORD */}
                    <div className="mt-4">
                      <label
                        htmlFor="password"
                        className="block text-sm font-semibold text-gray-800 mb-1"
                      >
                        <FormattedMessage id="registerLawyer.fields.password" />{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock
                          className={`pointer-events-none w-5 h-5 absolute left-3 top-3.5 ${THEME.icon}`}
                        />
                        <input
                          id="password"
                          name="password"
                          ref={fieldRefs.password}
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={onChange}
                          onBlur={() => markTouched("password")}
                          onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) =>
                            setCapsPassword(e.getModifierState("CapsLock"))
                          }
                          autoComplete="new-password"
                          placeholder={intl.formatMessage({
                            id: "registerLawyer.help.minPassword",
                          })}
                          aria-describedby="pwd-hint pwd-meter"
                          className={`${getInputClassName("password", true)} pr-11`}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-2.5 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:scale-95 transition-all"
                          onClick={() => setShowPassword((s) => !s)}
                          aria-label={
                            showPassword
                              ? intl.formatMessage({
                                  id: "registerLawyer.ui.ariaHidePassword",
                                })
                              : intl.formatMessage({
                                  id: "registerLawyer.ui.ariaShowPassword",
                                })
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      {/* Password strength */}
                      {form.password.length > 0 && (
                        <div id="pwd-meter" className="mt-2">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>
                              <FormattedMessage id="registerLawyer.password.strengthLabel" />
                            </span>
                            <span className="font-medium">
                              {form.password.length < 6
                                ? intl.formatMessage({
                                    id: "registerLawyer.password.tooShort",
                                  })
                                : form.password.length < 8
                                  ? intl.formatMessage({
                                      id: "registerLawyer.password.weak",
                                    })
                                  : form.password.length < 10
                                    ? intl.formatMessage({
                                        id: "registerLawyer.password.medium",
                                      })
                                    : form.password.length < 12
                                      ? intl.formatMessage({
                                          id: "registerLawyer.password.good",
                                        })
                                      : intl.formatMessage({
                                          id: "registerLawyer.password.excellent",
                                        })}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${pwdStrength.color}`}
                              style={{ width: `${pwdStrength.percent}%` }}
                            />
                          </div>
                          {capsPassword && (
                            <p className="text-xs text-orange-600 mt-1">
                              ↥{" "}
                              <FormattedMessage id="registerLawyer.password.capsLockOn" />
                            </p>
                          )}
                        </div>
                      )}
                      <FieldError
                        error={fieldErrors.password}
                        show={!!(fieldErrors.password && touched.password)}
                      />
                      <FieldSuccess
                        show={
                          !fieldErrors.password &&
                          !!touched.password &&
                          form.password.length >= 6
                        }
                        message={intl.formatMessage({
                          id: "registerLawyer.success.pwdOk",
                        })}
                      />
                    </div>

                    {/* Contact - Version simplifiée sans PhoneField */}
                    {/* <div
                      className={`mt-5 rounded-xl border ${THEME.border} ${THEME.subtle} p-4`}
                    >
                      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                        <Phone className={`w-4 h-4 mr-2 ${THEME.icon}`} />{" "}
                        <FormattedMessage id="registerLawyer.fields.phone" /> /{" "}
                        <FormattedMessage id="registerLawyer.fields.whatsapp" />
                      </h3>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label
                            htmlFor="phone"
                            className="block text-sm font-semibold text-gray-800 mb-1"
                          >
                            <FormattedMessage id="registerLawyer.fields.phone" />{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={form.phone}
                            onChange={onChange}
                            onBlur={() => markTouched("phone")}
                            className={getInputClassName("phone")}
                            placeholder="+33612345678"
                          />
                          <FieldError
                            error={fieldErrors.phone}
                            show={!!(fieldErrors.phone && touched.phone)}
                          />
                          <FieldSuccess
                            show={
                              !fieldErrors.phone &&
                              !!touched.phone &&
                              !!form.phone
                            }
                            // message={t.success.fieldValid}
                            message={intl.formatMessage({
                              id: "registerLawyer.success.fieldValid",
                            })}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="whatsapp"
                            className="block text-sm font-semibold text-gray-800 mb-1"
                          >
                            <FormattedMessage id="registerLawyer.fields.whatsapp" />{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="whatsapp"
                            name="whatsapp"
                            type="tel"
                            value={form.whatsapp}
                            onChange={onChange}
                            onBlur={() => markTouched("whatsapp")}
                            className={getInputClassName("whatsapp")}
                            placeholder="+33612345678"
                          />
                          <FieldError
                            error={fieldErrors.whatsapp}
                            show={!!(fieldErrors.whatsapp && touched.whatsapp)}
                          />
                          <FieldSuccess
                            show={
                              !fieldErrors.whatsapp &&
                              !!touched.whatsapp &&
                              !!form.whatsapp
                            }
                            // message={t.success.fieldValid}
                            message={intl.formatMessage({
                              id: "registerLawyer.success.fieldValid",
                            })}
                          />
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-gray-600 flex items-center">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1 text-green-600" />
                        <FormattedMessage id="registerLawyer.help.contactInfo" />
                      </p>
                    </div> */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
                      {/* Phone Number */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">
                          <FormattedMessage id="registerExpat.fields.phone" />
                          <span className="text-red-500">*</span>
                        </label>

                        <PhoneInput
                          value={form.phone}
                          onChange={(value) => {
                            const phoneValue = value || "";
                            setForm((prev) => ({ ...prev, phone: phoneValue }));

                            if (!touched.phone) {
                              markTouched("phone");
                            }

                            try {
                              const parsed =
                                parsePhoneNumberFromString(phoneValue);

                              if (!phoneValue) {
                                // Empty → clear error
                                setFieldErrors((prev) => {
                                  const { phone, ...rest } = prev;
                                  return rest;
                                });
                              } else if (!parsed || !parsed.isValid()) {
                                setFieldErrors((prev) => ({
                                  ...prev,
                                  phone: intl.formatMessage({
                                    id: "registerLawyer.errors.phoneInvalid",
                                  }),
                                }));
                              } else {
                                setFieldErrors((prev) => {
                                  const { phone, ...rest } = prev;
                                  return rest;
                                });
                              }
                            } catch {
                              setFieldErrors((prev) => ({
                                ...prev,
                                phone: intl.formatMessage({
                                  id: "registerLawyer.errors.phoneInvalid",
                                }),
                              }));
                            }
                          }}
                          onBlur={() => markTouched("phone")}
                          defaultCountry="FR"
                          international
                          countryCallingCodeEditable={false}
                          className={inputClass()}
                          placeholder="+33 6 12 34 56 78"
                        />

                        {form.phone && (
                          <div className="mt-1 text-xs text-gray-500">
                            Format:{" "}
                            <span className="font-mono">{form.phone}</span>
                          </div>
                        )}

                        <FieldError
                          error={fieldErrors.phone}
                          show={!!(touched.phone && fieldErrors.phone)}
                        />

                        {(() => {
                          const phoneNumber = parsePhoneNumberFromString(
                            form.phone
                          );
                          const isValidPhone = phoneNumber?.isValid?.();

                          return (
                            <FieldSuccess
                              show={
                                !!(
                                  touched.phone &&
                                  !fieldErrors.phone &&
                                  isValidPhone
                                )
                              }
                              message={intl.formatMessage({
                                id: "registerExpat.success.fieldValid",
                              })}
                            />
                          );
                        })()}
                      </div>

                      {/* WhatsApp Number */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">
                          <FormattedMessage id="registerLawyer.fields.whatsapp" />
                        </label>

                        <PhoneInput
                          value={form.whatsapp}
                          onChange={(value) => {
                            const whatsappValue = value || "";
                            setForm((prev) => ({
                              ...prev,
                              whatsapp: whatsappValue,
                            }));

                            if (!touched.whatsapp) {
                              markTouched("whatsapp");
                            }

                            try {
                              const parsed =
                                parsePhoneNumberFromString(whatsappValue);

                              if (!whatsappValue) {
                                // Empty → clear error
                                setFieldErrors((prev) => {
                                  const { whatsapp, ...rest } = prev;
                                  return rest;
                                });
                              } else if (!parsed || !parsed.isValid()) {
                                setFieldErrors((prev) => ({
                                  ...prev,
                                  whatsapp: intl.formatMessage({
                                    id: "registerLawyer.errors.whatsappInvalid",
                                  }),
                                }));
                              } else {
                                setFieldErrors((prev) => {
                                  const { whatsapp, ...rest } = prev;
                                  return rest;
                                });
                              }
                            } catch {
                              setFieldErrors((prev) => ({
                                ...prev,
                                phone: intl.formatMessage({
                                  id: "registerLawyer.errors.whatsappInvalid",
                                }),
                              }));
                            }
                          }}
                          onBlur={() => markTouched("whatsapp")}
                          defaultCountry="FR"
                          international
                          countryCallingCodeEditable={false}
                          className={inputClass()}
                          placeholder="+33 6 12 34 56 78"
                        />

                        {form.whatsapp && (
                          <div className="mt-1 text-xs text-gray-500">
                            Format:{" "}
                            <span className="font-mono">{form.whatsapp}</span>
                          </div>
                        )}

                        <FieldError
                          error={fieldErrors.whatsapp}
                          show={!!(touched.whatsapp && fieldErrors.whatsapp)}
                        />

                        {(() => {
                          const whatsappNumber = parsePhoneNumberFromString(
                            form.whatsapp
                          );
                          const whatsapp = whatsappNumber?.isValid?.();

                          return (
                            <FieldSuccess
                              show={
                                !!(
                                  touched.whatsapp &&
                                  !fieldErrors.whatsapp &&
                                  whatsapp
                                )
                              }
                              message={intl.formatMessage({
                                id: "registerExpat.success.fieldValid",
                              })}
                            />
                          );
                        })()}
                      </div>
                    </div>
                  </section>

                  {/* Geographic */}
                  <section className="p-5 sm:p-6 border-t border-gray-50">
                    <SectionHeader
                      icon={<Globe className="w-5 h-5" />}
                      title={intl.formatMessage({
                        id: "registerLawyer.ui.geoInfo",
                      })}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="currentCountry"
                          className="block text-sm font-semibold text-gray-800 mb-1"
                        >
                          <FormattedMessage id="registerLawyer.fields.residenceCountry" />{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="currentCountry"
                          name="currentCountry"
                          ref={fieldRefs.currentCountry}
                          value={form.currentCountry}
                          onChange={onChange}
                          onBlur={() => markTouched("currentCountry")}
                          className={getInputClassName("currentCountry")}
                        >
                          <option value="">
                            {lang === "fr"
                              ? "Sélectionnez votre pays"
                              : lang === "es"
                                ? "Selecciona tu país"
                                : lang === "de"
                                  ? "Wählen Sie Ihr Land"
                                  : lang === "ru"
                                    ? "Выберите свою страну"
                                    : lang === "hi"
                                      ? "अपना देश चुनें"
                                      : "Select your country"}
                          </option>
                          {countryOptions.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        {form.currentCountry ===
                          (lang === "en" ? "Other" : "Autre") && (
                          <div className="mt-3">
                            <input
                              name="customCountry"
                              value={form.customCountry}
                              onChange={onChange}
                              className={`${baseInput} border-gray-300`}
                              placeholder={intl.formatMessage({
                                id: "registerLawyer.placeholder.specifyCountry",
                              })}
                            />
                          </div>
                        )}
                        <FieldError
                          error={fieldErrors.currentCountry}
                          show={
                            !!(
                              fieldErrors.currentCountry &&
                              touched.currentCountry
                            )
                          }
                        />
                        <FieldSuccess
                          show={
                            !fieldErrors.currentCountry &&
                            !!touched.currentCountry &&
                            !!form.currentCountry
                          }
                          // message={t.success.fieldValid}
                          message={intl.formatMessage({
                            id: "registerLawyer.success.fieldValid",
                          })}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="currentPresenceCountry"
                          className="block text-sm font-semibold text-gray-800 mb-1"
                        >
                          <FormattedMessage id="registerLawyer.fields.presenceCountry" />{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="currentPresenceCountry"
                          name="currentPresenceCountry"
                          ref={fieldRefs.currentPresenceCountry}
                          value={form.currentPresenceCountry}
                          onChange={onChange}
                          onBlur={() => markTouched("currentPresenceCountry")}
                          className={getInputClassName(
                            "currentPresenceCountry"
                          )}
                        >
                          <option value="">
                            {/* {lang === "en"
                              ? "Select your presence country"
                              : "Sélectionnez votre pays de présence"} */}

                            {lang === "fr"
                              ? "Sélectionnez votre pays de présence"
                              : lang === "es"
                                ? "Selecciona tu país de presencia"
                                : lang === "de"
                                  ? "Wählen Sie Ihr Aufenthaltsland"
                                  : lang === "ru"
                                    ? "Выберите страну вашего пребывания"
                                    : lang === "hi"
                                      ? "अपनी उपस्थिति का देश चुनें"
                                      : "Select your presence country"}
                          </option>
                          {countryOptions.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <FieldError
                          error={fieldErrors.currentPresenceCountry}
                          show={
                            !!(
                              fieldErrors.currentPresenceCountry &&
                              touched.currentPresenceCountry
                            )
                          }
                        />
                        <FieldSuccess
                          show={
                            !fieldErrors.currentPresenceCountry &&
                            !!touched.currentPresenceCountry &&
                            !!form.currentPresenceCountry
                          }
                          // message={t.success.fieldValid}
                          message={intl.formatMessage({
                            id: "registerLawyer.success.fieldValid",
                          })}
                        />
                      </div>
                    </div>

                    {/* practice countries */}
                    <div
                      className={`mt-4 rounded-xl border ${THEME.border} p-4 ${THEME.subtle}`}
                    >
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        <FormattedMessage id="registerLawyer.fields.practiceCountries" />{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <TagSelector
                        items={form.practiceCountries}
                        onRemove={removePractice}
                        color="green"
                      />
                      <select
                        onChange={onPracticeSelect}
                        value=""
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:border-green-600"
                      >
                        <option value="">
                          {intl.formatMessage({
                            id: "registerLawyer.select.addPractice",
                          })}
                        </option>
                        {countryOptions.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                        <option value={lang === "en" ? "Other" : "Autre"}>
                          {lang === "en" ? "Other" : "Autre"}
                        </option>
                      </select>
                      {showCustomCountry && (
                        <div className="flex gap-2 mt-3">
                          <input
                            value={form.customPracticeCountry}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                customPracticeCountry: e.target.value,
                              }))
                            }
                            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl"
                            placeholder={intl.formatMessage({
                              id: "registerLawyer.placeholder.specifyPractice",
                            })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addCustomPractice();
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={addCustomPractice}
                            disabled={!form.customPracticeCountry.trim()}
                            className="px-4 py-3 rounded-xl bg-green-600 text-white font-semibold disabled:opacity-60"
                          >
                            OK
                          </button>
                        </div>
                      )}
                      <FieldError
                        error={fieldErrors.practiceCountries}
                        show={!!fieldErrors.practiceCountries}
                      />
                      <FieldSuccess
                        show={form.practiceCountries.length > 0}
                        // message={t.success.fieldValid}
                        message={intl.formatMessage({
                          id: "registerLawyer.success.fieldValid",
                        })}
                      />
                    </div>
                  </section>

                  {/* Professional */}
                  <section className="p-5 sm:p-6 border-t border-gray-50">
                    <SectionHeader
                      icon={<Scale className="w-5 h-5" />}
                      title={intl.formatMessage({
                        id: "registerLawyer.ui.proInfo",
                      })}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="yearsOfExperience"
                          className="block text-sm font-semibold text-gray-800 mb-1"
                        >
                          <FormattedMessage id="registerLawyer.fields.yearsOfExperience" />
                        </label>
                        <input
                          id="yearsOfExperience"
                          name="yearsOfExperience"
                          type="number"
                          value={form.yearsOfExperience}
                          onChange={onChange}
                          className={`${baseInput} bg-gray-50 hover:bg-white border-gray-200`}
                          min={0}
                          max={60}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="graduationYear"
                          className="block text-sm font-semibold text-gray-800 mb-1"
                        >
                          <FormattedMessage id="registerLawyer.fields.graduationYear" />
                        </label>
                        <input
                          id="graduationYear"
                          name="graduationYear"
                          type="number"
                          value={form.graduationYear}
                          onChange={onChange}
                          className={`${baseInput} bg-gray-50 hover:bg-white border-gray-200`}
                          min={1980}
                          max={new Date().getFullYear()}
                        />
                      </div>
                    </div>

                    {/* specialties */}
                    <div
                      className={`mt-4 rounded-xl border ${THEME.border} p-4 ${THEME.subtle}`}
                    >
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        <FormattedMessage id="registerLawyer.fields.specialties" />{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <TagSelector
                        items={form.specialties}
                        onRemove={removeSpecialty}
                      />
                      <select
                        onChange={onSpecialtySelect}
                        value=""
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:border-purple-600"
                      >
                        <option value="">
                          {intl.formatMessage({
                            id: "registerLawyer.select.addSpecialty",
                          })}
                        </option>
                        {specialtyOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                        <option value={lang === "en" ? "Other" : "Autre"}>
                          {lang === "en" ? "Other" : "Autre"}
                        </option>
                      </select>

                      {showCustomSpecialty && (
                        <div className="flex gap-2 mt-3">
                          <input
                            value={form.customSpecialty}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                customSpecialty: e.target.value,
                              }))
                            }
                            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl"
                            placeholder={intl.formatMessage({
                              id: "registerLawyer.placeholder.specifySpecialty",
                            })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addCustomSpecialty();
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={addCustomSpecialty}
                            disabled={!form.customSpecialty.trim()}
                            className="px-4 py-3 rounded-xl bg-purple-600 text-white font-semibold disabled:opacity-60"
                          >
                            OK
                          </button>
                        </div>
                      )}
                      <FieldError
                        error={fieldErrors.specialties}
                        show={!!fieldErrors.specialties}
                      />
                      <FieldSuccess
                        show={form.specialties.length > 0}
                        // message={t.success.fieldValid}
                        message={intl.formatMessage({
                          id: "registerLawyer.success.fieldValid",
                        })}
                      />
                    </div>

                    {/* formations */}
                    <div
                      className={`mt-4 rounded-xl border ${THEME.border} p-4 ${THEME.subtle}`}
                    >
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        <FormattedMessage id="registerLawyer.fields.education" />{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2">
                        {form.educations.map((ed, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              value={ed}
                              onChange={(e) =>
                                updateEducation(idx, e.target.value)
                              }
                              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:border-indigo-600"
                              placeholder={intl.formatMessage({
                                id: "registerLawyer.placeholder.education",
                              })}
                            />
                            <button
                              type="button"
                              onClick={() => removeEducationField(idx)}
                              className="px-3 py-2 rounded-xl border-2 border-gray-200 hover:bg-gray-50"
                              aria-label="Remove formation"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={addEducationField}
                          className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold"
                        >
                          <FormattedMessage id="registerLawyer.select.addEducation" />
                        </button>
                      </div>
                      <FieldError
                        error={fieldErrors.educations}
                        show={!!fieldErrors.educations}
                      />
                      <FieldSuccess
                        show={form.educations.some((e) => e.trim().length > 0)}
                        // message={t.success.fieldValid}
                        message={intl.formatMessage({
                          id: "registerLawyer.success.fieldValid",
                        })}
                      />
                    </div>

                    {/* Languages */}
                    <div
                      className={`mt-4 rounded-xl border ${THEME.border} p-4 ${THEME.subtle}`}
                    >
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        <FormattedMessage id="registerLawyer.fields.languages" />{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      {(selectedLanguages as LanguageOption[]).length > 0 && (
                        <div className="mb-2 text-xs text-gray-700">
                          <span className="font-medium">
                       
                           <FormattedMessage id="registerExpat.selectedLanguages" />
                            :
                          </span>{" "}
                          {(selectedLanguages as LanguageOption[])
                            .map((l) => l.value.toUpperCase())
                            .join(", ")}
                        </div>
                      )}

                      <Suspense
                        fallback={
                          <div className="h-11 animate-pulse rounded-xl border border-gray-200 bg-gray-100 flex items-center px-3 text-gray-500 text-sm">
                            <FormattedMessage id="registerLawyer.loading.languages" />
                          </div>
                        }
                      >
                        <div
                          className={`${getInputClassName("languages")} p-0`}
                        >
                          <MultiLanguageSelect
                            value={selectedLanguages}
                            onChange={(v: MultiValue<LanguageOption>) => {
                              setSelectedLanguages(v);
                              setTouched((p) => ({ ...p, languages: true }));
                              if (v.length > 0)
                                setFieldErrors((prev) => ({
                                  ...prev,
                                  languages: "",
                                }));
                            }}
                            locale={lang}
                            placeholder={intl.formatMessage({
                              id: "registerLawyer.select.searchLanguages",
                            })}
                          />
                        </div>
                      </Suspense>

                      <FieldError
                        error={fieldErrors.languages}
                        show={!!fieldErrors.languages}
                      />
                      <FieldSuccess
                        show={
                          (selectedLanguages as LanguageOption[]).length > 0
                        }
                        // message={t.success.fieldValid}
                        message={intl.formatMessage({
                          id: "registerLawyer.success.fieldValid",
                        })}
                      />
                    </div>

                    {/* Bio */}
                    <div className="mt-4">
                      <label
                        htmlFor="bio"
                        className="block text-sm font-semibold text-gray-800 mb-1"
                      >
                        <FormattedMessage id="registerLawyer.fields.bio" />{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="bio"
                        name="bio"
                        ref={fieldRefs.bio}
                        rows={5}
                        maxLength={500}
                        value={form.bio}
                        onChange={onChange}
                        onBlur={() => markTouched("bio")}
                        className={`${getInputClassName("bio")} min-h-[120px]`}
                        placeholder={intl.formatMessage({
                          id: "registerLawyer.placeholder.bio",
                        })}
                      />
                      <div className="mt-2">
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-2 ${form.bio.length < 50 ? "bg-orange-400" : "bg-green-500"} transition-all`}
                            style={{
                              width: `${Math.min((form.bio.length / 500) * 100, 100)}%`,
                            }}
                            aria-hidden
                          />
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span
                            className={
                              form.bio.length < 50
                                ? "text-orange-600"
                                : "text-green-600"
                            }
                          >
                            {/* {form.bio.length < 50
                              ? lang === "en"
                                ? `Just ${50 - form.bio.length} chars to go — you've got this! 💪`
                                : `Encore ${50 - form.bio.length} caractères — vous y êtes presque ! 💪`
                              : lang === "en"
                                ? "✓ Nice! Field validated."
                                : "✓ Top ! Champ validé."} */}

                            {form.bio.length < 50
                              ? lang === "fr"
                                ? `Encore ${50 - form.bio.length} caractères — vous y êtes presque ! 💪`
                                : lang === "es"
                                  ? `Solo ${50 - form.bio.length} caracteres más — ¡puedes hacerlo! 💪`
                                  : lang === "de"
                                    ? `Nur noch ${50 - form.bio.length} Zeichen — Sie schaffen das! 💪`
                                    : lang === "ru"
                                      ? `Осталось ${50 - form.bio.length} символов — вы почти у цели! 💪`
                                      : lang === "hi"
                                        ? `बस ${50 - form.bio.length} अक्षर और — आप कर सकते हैं! 💪`
                                        : `Just ${50 - form.bio.length} chars to go — you've got this! 💪`
                              : lang === "fr"
                                ? "✓ Top ! Champ validé."
                                : lang === "es"
                                  ? "✓ ¡Perfecto! Campo validado."
                                  : lang === "de"
                                    ? "✓ Toll! Feld validiert."
                                    : lang === "ru"
                                      ? "✓ Отлично! Поле проверено."
                                      : lang === "hi"
                                        ? "✓ बढ़िया! फ़ील्ड सत्यापित।"
                                        : "✓ Nice! Field validated."}
                          </span>
                          <span
                            className={
                              form.bio.length > 450
                                ? "text-orange-500"
                                : "text-gray-500"
                            }
                          >
                            {form.bio.length}/500
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          <FormattedMessage id="registerLawyer.help.bioHint" />
                        </p>
                      </div>
                      <FieldError
                        error={fieldErrors.bio}
                        show={!!(fieldErrors.bio && touched.bio)}
                      />
                      <FieldSuccess
                        show={form.bio.trim().length >= 50}
                        // message={t.success.fieldValid}
                        message={intl.formatMessage({
                          id: "registerLawyer.success.fieldValid",
                        })}
                      />
                    </div>

                    {/* Photo */}
                    <div
                      className={`mt-4 rounded-xl border ${THEME.border} p-4 ${THEME.subtle}`}
                    >
                      <label className="flex items-center text-sm font-semibold text-gray-900 mb-2">
                        <Camera className={`w-4 h-4 mr-2 ${THEME.icon}`} />{" "}
                        <FormattedMessage id="registerLawyer.fields.profilePhoto" />{" "}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <Suspense
                        fallback={
                          <div className="py-6">
                            <div className="h-24 bg-gray-100 animate-pulse rounded-xl" />
                          </div>
                        }
                      >
                        <ImageUploader
                          locale={lang}
                          currentImage={form.profilePhoto}
                          onImageUploaded={(url: string) => {
                            setForm((prev) => ({ ...prev, profilePhoto: url }));
                            setFieldErrors((prev) => ({
                              ...prev,
                              profilePhoto: "",
                            }));
                            setTouched((p) => ({ ...p, profilePhoto: true }));
                            setTimeout(focusFirstMissingField, 80);
                          }}
                          hideNativeFileLabel
                          cropShape="round"
                          outputSize={512}
                          uploadPath="registration_temp"
                          isRegistration={true}
                        />
                      </Suspense>
                      <FieldError
                        error={fieldErrors.profilePhoto}
                        show={!!fieldErrors.profilePhoto}
                      />
                      <FieldSuccess
                        show={!!form.profilePhoto}
                        // message={t.success.fieldValid}
                        message={intl.formatMessage({
                          id: "registerLawyer.success.fieldValid",
                        })}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        <FormattedMessage id="registerLawyer.help.photoInfo" />
                      </p>
                    </div>
                  </section>

                  {/* Terms + Submit */}
                  <section
                    className={`p-5 sm:p-6 border-t border-gray-50 bg-gradient-to-br ${THEME.gradFrom} ${THEME.gradTo}`}
                  >
                    <div className="bg-white rounded-xl p-4 sm:p-5 shadow-md">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="acceptTerms"
                          checked={form.acceptTerms}
                          onChange={(e) => {
                            setForm((p) => ({
                              ...p,
                              acceptTerms: e.target.checked,
                            }));
                            setTouched((p) => ({ ...p, acceptTerms: true }));
                            if (e.target.checked)
                              setFieldErrors((prev) => ({
                                ...prev,
                                acceptTerms: "",
                              }));
                          }}
                          className="h-5 w-5 text-indigo-600 border-gray-300 rounded mt-0.5"
                          required
                        />
                        <label
                          htmlFor="acceptTerms"
                          className="text-sm text-gray-800"
                        >
                          <FormattedMessage id="registerLawyer.ui.acceptTerms" />{" "}
                          <Link
                            to="/cgu-avocats"
                            className="text-indigo-700 underline font-semibold"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FormattedMessage id="registerLawyer.ui.termsLink" />
                          </Link>{" "}
                          <span className="text-red-500">*</span>
                        </label>
                      </div>
                      <FieldError
                        error={fieldErrors.acceptTerms}
                        show={!!fieldErrors.acceptTerms}
                      />
                      <FieldSuccess
                        show={!!form.acceptTerms}
                        // message={t.success.fieldValid}
                        message={intl.formatMessage({
                          id: "registerLawyer.success.fieldValid",
                        })}
                      />
                    </div>

                    <div className="mt-4">
                      <Button
                        type="submit"
                        loading={isLoading || isSubmitting}
                        fullWidth
                        size="large"
                        className={`text-white font-black py-4 px-6 rounded-2xl text-base sm:text-lg w-full shadow-lg ${
                          canSubmit
                            ? `bg-gradient-to-r ${THEME.button} hover:brightness-110`
                            : "bg-gray-400 cursor-not-allowed opacity-60"
                        }`}
                        disabled={!canSubmit}
                      >
                        {isLoading || isSubmitting ? (
                          <FormattedMessage id="registerLawyer.ui.loading" />
                        ) : (
                          <span className="inline-flex items-center justify-center">
                            <Scale className="w-5 h-5 mr-2" />{" "}
                            <FormattedMessage id="registerLawyer.ui.create" />
                          </span>
                        )}
                      </Button>

                      {/* Checklist claire, dynamique */}
                      {!isLoading && (
                        <div className="mt-5 rounded-2xl border border-white/40 bg-white/70 backdrop-blur p-4">
                          <h4 className="text-sm font-bold text-gray-800 mb-2">
                            <FormattedMessage id="registerLawyer.checklist.toComplete" />
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                            {missing.map((m, idx) => (
                              <div
                                key={idx}
                                className={`flex items-center text-sm ${m.ok ? "text-green-700" : "text-gray-700"}`}
                              >
                                {m.ok ? (
                                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                ) : (
                                  <XCircle className="w-4 h-4 mr-2 text-gray-400" />
                                )}
                                <span>
                                  {/* {lang === "en" ? m.labelEn : m.labelFr} */}
                                  {lang === "en"
                                    ? m.label.en
                                    : lang === "es"
                                      ? m.label.es
                                      : lang === "fr"
                                        ? m.label.fr
                                        : lang === "de"
                                          ? m.label.de
                                          : lang === "ru"
                                            ? m.label.ru
                                            : lang === "hi"
                                              ? m.label.hi
                                              : m.label.en}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 text-center">
                            <span className="text-xs text-gray-700 bg-gray-100 rounded-xl px-3 py-1 inline-block">
                              {intl.formatMessage(
                                { id: "registerLawyer.checklist.completion" },
                                { progress }
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                </form>
              </div>

              {/* Footer */}
              <footer className="text-center mt-8">
                <div className="bg-white p-5 shadow border rounded-xl">
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-1">
                    <FormattedMessage id="registerLawyer.footer.title" />
                  </h3>
                  <p className="text-sm text-gray-700">
                    <FormattedMessage id="registerLawyer.footer.text" />
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-gray-500">
                  <Link
                    to="/politique-confidentialite"
                    className="hover:text-indigo-700 underline"
                  >
                    <FormattedMessage id="registerLawyer.footer.privacy" />
                  </Link>
                  <Link
                    to="/cgu-avocats"
                    className="hover:text-indigo-700 underline"
                  >
                    <FormattedMessage id="registerLawyer.ui.termsLink" />
                  </Link>
                  <Link
                    to="/centre-aide"
                    className="hover:text-indigo-700 underline"
                  >
                    <FormattedMessage id="registerLawyer.footer.helpLink" />
                  </Link>
                  <Link
                    to="/contact"
                    className="hover:text-indigo-700 underline"
                  >
                    <FormattedMessage id="registerLawyer.footer.contact" />
                  </Link>
                </div>
              </footer>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default RegisterLawyer;
