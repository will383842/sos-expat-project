// src/pages/RegisterExpat.tsx
import React, {
  useState,
  useCallback,
  useMemo,
  lazy,
  Suspense,
  useEffect,
  useRef,
} from "react";
import {
  Link,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Globe,
  Phone as PhoneIcon,
  CheckCircle,
  Users,
  Camera,
  X,
  ArrowRight,
  Info,
  MapPin,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import Layout from "../components/layout/Layout";
import Button from "../components/common/Button";
import { useAuth } from "../contexts/AuthContext";
import { useApp } from "../contexts/AppContext";
import type { MultiValue } from "react-select";
import type { Provider } from "../types/provider";
import { useIntl, FormattedMessage } from "react-intl";

// 🔌 Champ téléphone normalisé (E.164)
import PhoneField from "@/components/PhoneField";
import { useForm } from "react-hook-form";

import IntlPhoneInput from "@/components/forms-data/IntlPhoneInput";
import { parsePhoneNumberFromString } from "libphonenumber-js";

// ===== Lazy (perf) =====
const ImageUploader = lazy(() => import("../components/common/ImageUploader"));
const MultiLanguageSelect = lazy(
  () => import("../components/forms-data/MultiLanguageSelect")
);

// ===== Theme (vert/emerald) =====
const THEME = {
  gradFrom: "from-emerald-600",
  gradTo: "to-green-600",
  ring: "focus:border-emerald-600",
  border: "border-emerald-200",
  icon: "text-emerald-600",
  chip: "border-emerald-200",
  subtle: "bg-emerald-50",
  button: "from-emerald-600 via-green-600 to-teal-700",
} as const;

// ===== Country options FR/EN (bilingue) =====
// type MultiLangDuo = { fr: string; en: string ; es?: string; de?: string; ru?: string };

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

type MultiLangDuo = {
  fr: string;
  es: string;
  en: string;
  de: string;
  ru: string;
  hi: string;
  pt: string;
  ch: string;
  ar: string;
};

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


const COUNTRIES: MultiLangDuo[] = [
  {
    fr: "Afghanistan",
    es: "Afganistán",
    en: "Afghanistan",
    de: "Afghanistan",
    ru: "Афганистан",
    hi: "अफगानिस्तान",
    pt: "Afeganistão",
    ch: "阿富汗",
    ar: "أفغانستان"
  },
  {
    fr: "Afrique du Sud",
    es: "Sudáfrica",
    en: "South Africa",
    de: "Südafrika",
    ru: "Южная Африка",
    hi: "दक्षिण अफ्रीका",
    pt: "África do Sul",
    ch: "南非",
    ar: "جنوب أفريقيا"
  },
  {
    fr: "Albanie",
    es: "Albania",
    en: "Albania",
    de: "Albanien",
    ru: "Албания",
    hi: "अल्बानिया",
    pt: "Albânia",
    ch: "阿尔巴尼亚",
    ar: "ألبانيا"
  },
  {
    fr: "Algérie",
    es: "Argelia",
    en: "Algeria",
    de: "Algerien",
    ru: "Алжир",
    hi: "अल्जीरिया",
    pt: "Argélia",
    ch: "阿尔及利亚",
    ar: "الجزائر"
  },
  {
    fr: "Allemagne",
    es: "Alemania",
    en: "Germany",
    de: "Deutschland",
    ru: "Германия",
    hi: "जर्मनी",
    pt: "Alemanha",
    ch: "德国",
    ar: "ألمانيا"
  },
  {
    fr: "Andorre",
    es: "Andorra",
    en: "Andorra",
    de: "Andorra",
    ru: "Андорра",
    hi: "अंडोरा",
    pt: "Andorra",
    ch: "安道尔",
    ar: "أندورا"
  },
  {
    fr: "Angola",
    es: "Angola",
    en: "Angola",
    de: "Angola",
    ru: "Ангола",
    hi: "अंगोला",
    pt: "Angola",
    ch: "安哥拉",
    ar: "أنغولا"
  },
  {
    fr: "Arabie Saoudite",
    es: "Arabia Saudita",
    en: "Saudi Arabia",
    de: "Saudi-Arabien",
    ru: "Саудовская Аравия",
    hi: "सऊदी अरब",
    pt: "Arábia Saudita",
    ch: "沙特阿拉伯",
    ar: "المملكة العربية السعودية"
  },
  {
    fr: "Argentine",
    es: "Argentina",
    en: "Argentina",
    de: "Argentinien",
    ru: "Аргентина",
    hi: "अर्जेंटीना",
    pt: "Argentina",
    ch: "阿根廷",
    ar: "الأرجنتين"
  },
  {
    fr: "Arménie",
    es: "Armenia",
    en: "Armenia",
    de: "Armenien",
    ru: "Армения",
    hi: "आर्मेनिया",
    pt: "Armênia",
    ch: "亚美尼亚",
    ar: "أرمينيا"
  },
  {
    fr: "Australie",
    es: "Australia",
    en: "Australia",
    de: "Australien",
    ru: "Австралия",
    hi: "ऑस्ट्रेलिया",
    pt: "Austrália",
    ch: "澳大利亚",
    ar: "أستراليا"
  },
  {
    fr: "Autriche",
    es: "Austria",
    en: "Austria",
    de: "Österreich",
    ru: "Австрия",
    hi: "ऑस्ट्रिया",
    pt: "Áustria",
    ch: "奥地利",
    ar: "النمسا"
  },
  {
    fr: "Azerbaïdjan",
    es: "Azerbaiyán",
    en: "Azerbaijan",
    de: "Aserbaidschan",
    ru: "Азербайджан",
    hi: "अजरबैजान",
    pt: "Azerbaijão",
    ch: "阿塞拜疆",
    ar: "أذربيجان"
  },
  {
    fr: "Bahamas",
    es: "Bahamas",
    en: "Bahamas",
    de: "Bahamas",
    ru: "Багамы",
    hi: "बहामा",
    pt: "Bahamas",
    ch: "巴哈马",
    ar: "جزر البهاما"
  },
  {
    fr: "Bahreïn",
    es: "Baréin",
    en: "Bahrain",
    de: "Bahrain",
    ru: "Бахрейн",
    hi: "बहरीन",
    pt: "Bahrein",
    ch: "巴林",
    ar: "البحرين"
  },
  {
    fr: "Bangladesh",
    es: "Bangladés",
    en: "Bangladesh",
    de: "Bangladesch",
    ru: "Бангладеш",
    hi: "बांग्लादेश",
    pt: "Bangladesh",
    ch: "孟加拉国",
    ar: "بنغلاديش"
  },
  {
    fr: "Barbade",
    es: "Barbados",
    en: "Barbados",
    de: "Barbados",
    ru: "Барбадос",
    hi: "बारबाडोस",
    pt: "Barbados",
    ch: "巴巴多斯",
    ar: "بربادوس"
  },
  {
    fr: "Belgique",
    es: "Bélgica",
    en: "Belgium",
    de: "Belgien",
    ru: "Бельгия",
    hi: "बेल्जियम",
    pt: "Bélgica",
    ch: "比利时",
    ar: "بلجيكا"
  },
  {
    fr: "Belize",
    es: "Belice",
    en: "Belize",
    de: "Belize",
    ru: "Белиз",
    hi: "बेलीज",
    pt: "Belize",
    ch: "伯利兹",
    ar: "بليز"
  },
  {
    fr: "Bénin",
    es: "Benín",
    en: "Benin",
    de: "Benin",
    ru: "Бенин",
    hi: "बेनिन",
    pt: "Benim",
    ch: "贝宁",
    ar: "بنين"
  },
  {
    fr: "Bhoutan",
    es: "Bután",
    en: "Bhutan",
    de: "Bhutan",
    ru: "Бутан",
    hi: "भूटान",
    pt: "Butão",
    ch: "不丹",
    ar: "بوتان"
  },
  {
    fr: "Biélorussie",
    es: "Bielorrusia",
    en: "Belarus",
    de: "Belarus",
    ru: "Беларусь",
    hi: "बेलारूस",
    pt: "Bielorrússia",
    ch: "白俄罗斯",
    ar: "بيلاروسيا"
  },
  {
    fr: "Birmanie",
    es: "Birmania",
    en: "Myanmar",
    de: "Myanmar",
    ru: "Мьянма",
    hi: "म्यांमार",
    pt: "Mianmar",
    ch: "缅甸",
    ar: "ميانمار"
  },
  {
    fr: "Bolivie",
    es: "Bolivia",
    en: "Bolivia",
    de: "Bolivien",
    ru: "Боливия",
    hi: "बोलीविया",
    pt: "Bolívia",
    ch: "玻利维亚",
    ar: "بوليفيا"
  },
  {
    fr: "Bosnie-Herzégovine",
    es: "Bosnia y Herzegovina",
    en: "Bosnia and Herzegovina",
    de: "Bosnien und Herzegowina",
    ru: "Босния и Герцеговина",
    hi: "बोस्निया और हर्जेगोविना",
    pt: "Bósnia e Herzegovina",
    ch: "波斯尼亚和黑塞哥维那",
    ar: "البوسنة والهرسك"
  },
  {
    fr: "Botswana",
    es: "Botsuana",
    en: "Botswana",
    de: "Botswana",
    ru: "Ботсвана",
    hi: "बोत्सवाना",
    pt: "Botsuana",
    ch: "博茨瓦纳",
    ar: "بوتسوانا"
  },
  {
    fr: "Brésil",
    es: "Brasil",
    en: "Brazil",
    de: "Brasilien",
    ru: "Бразилия",
    hi: "ब्राजील",
    pt: "Brasil",
    ch: "巴西",
    ar: "البرازيل"
  },
  {
    fr: "Brunei",
    es: "Brunéi",
    en: "Brunei",
    de: "Brunei",
    ru: "Бруней",
    hi: "ब्रुनेई",
    pt: "Brunei",
    ch: "文莱",
    ar: "بروناي"
  },
  {
    fr: "Bulgarie",
    es: "Bulgaria",
    en: "Bulgaria",
    de: "Bulgarien",
    ru: "Болгария",
    hi: "बुल्गारिया",
    pt: "Bulgária",
    ch: "保加利亚",
    ar: "بلغاريا"
  },
  {
    fr: "Burkina Faso",
    es: "Burkina Faso",
    en: "Burkina Faso",
    de: "Burkina Faso",
    ru: "Буркина-Фасо",
    hi: "बुर्किना फासो",
    pt: "Burquina Faso",
    ch: "布基纳法索",
    ar: "بوركينا فاسو"
  },
  {
    fr: "Burundi",
    es: "Burundi",
    en: "Burundi",
    de: "Burundi",
    ru: "Бурунди",
    hi: "बुरुंडी",
    pt: "Burúndi",
    ch: "布隆迪",
    ar: "بوروندي"
  },
  {
    fr: "Cambodge",
    es: "Camboya",
    en: "Cambodia",
    de: "Kambodscha",
    ru: "Камбоджа",
    hi: "कंबोडिया",
    pt: "Camboja",
    ch: "柬埔寨",
    ar: "كمبوديا"
  },
  {
    fr: "Cameroun",
    es: "Camerún",
    en: "Cameroon",
    de: "Kamerun",
    ru: "Камерун",
    hi: "कैमरून",
    pt: "Camarões",
    ch: "喀麦隆",
    ar: "الكاميرون"
  },
  {
    fr: "Canada",
    es: "Canadá",
    en: "Canada",
    de: "Kanada",
    ru: "Канада",
    hi: "कनाडा",
    pt: "Canadá",
    ch: "加拿大",
    ar: "كندا"
  },
  {
    fr: "Cap-Vert",
    es: "Cabo Verde",
    en: "Cape Verde",
    de: "Kap Verde",
    ru: "Кабо-Верде",
    hi: "केप वर्डे",
    pt: "Cabo Verde",
    ch: "佛得角",
    ar: "الرأس الأخضر"
  },
  {
    fr: "Chili",
    es: "Chile",
    en: "Chile",
    de: "Chile",
    ru: "Чили",
    hi: "चिली",
    pt: "Chile",
    ch: "智利",
    ar: "تشيلي"
  },
  {
    fr: "Chine",
    es: "China",
    en: "China",
    de: "China",
    ru: "Китай",
    hi: "चीन",
    pt: "China",
    ch: "中国",
    ar: "الصين"
  },
  {
    fr: "Chypre",
    es: "Chipre",
    en: "Cyprus",
    de: "Zypern",
    ru: "Кипр",
    hi: "साइप्रस",
    pt: "Chipre",
    ch: "塞浦路斯",
    ar: "قبرص"
  },
  {
    fr: "Colombie",
    es: "Colombia",
    en: "Colombia",
    de: "Kolumbien",
    ru: "Колумбия",
    hi: "कोलंबिया",
    pt: "Colômbia",
    ch: "哥伦比亚",
    ar: "كولومبيا"
  },
  {
    fr: "Comores",
    es: "Comoras",
    en: "Comoros",
    de: "Komoren",
    ru: "Коморы",
    hi: "कोमोरोस",
    pt: "Comores",
    ch: "科摩罗",
    ar: "جزر القمر"
  },
  {
    fr: "Congo",
    es: "Congo",
    en: "Congo",
    de: "Kongo",
    ru: "Конго",
    hi: "कांगो",
    pt: "Congo",
    ch: "刚果",
    ar: "الكونغو"
  },
  {
    fr: "Corée du Nord",
    es: "Corea del Norte",
    en: "North Korea",
    de: "Nordkorea",
    ru: "Северная Корея",
    hi: "उत्तर कोरिया",
    pt: "Coreia do Norte",
    ch: "北朝鲜",
    ar: "كوريا الشمالية"
  },
  {
    fr: "Corée du Sud",
    es: "Corea del Sur",
    en: "South Korea",
    de: "Südkorea",
    ru: "Южная Корея",
    hi: "दक्षिण कोरिया",
    pt: "Coreia do Sul",
    ch: "韩国",
    ar: "كوريا الجنوبية"
  },
  {
    fr: "Costa Rica",
    es: "Costa Rica",
    en: "Costa Rica",
    de: "Costa Rica",
    ru: "Коста-Рика",
    hi: "कोस्टा रिका",
    pt: "Costa Rica",
    ch: "哥斯达黎加",
    ar: "كوستاريكا"
  },
  {
    fr: "Côte d'Ivoire",
    es: "Costa de Marfil",
    en: "Ivory Coast",
    de: "Elfenbeinküste",
    ru: "Кот-д'Ивуар",
    hi: "आइवरी कोस्ट",
    pt: "Costa do Marfim",
    ch: "科特迪瓦",
    ar: "ساحل العاج"
  },
  {
    fr: "Croatie",
    es: "Croacia",
    en: "Croatia",
    de: "Kroatien",
    ru: "Хорватия",
    hi: "क्रोएशिया",
    pt: "Croácia",
    ch: "克罗地亚",
    ar: "كرواتيا"
  },
  {
    fr: "Cuba",
    es: "Cuba",
    en: "Cuba",
    de: "Kuba",
    ru: "Куба",
    hi: "क्यूबा",
    pt: "Cuba",
    ch: "古巴",
    ar: "كوبا"
  },
  {
    fr: "Danemark",
    es: "Dinamarca",
    en: "Denmark",
    de: "Dänemark",
    ru: "Дания",
    hi: "डेनमार्क",
    pt: "Dinamarca",
    ch: "丹麦",
    ar: "الدنمارك"
  },
  {
    fr: "Djibouti",
    es: "Yibuti",
    en: "Djibouti",
    de: "Dschibuti",
    ru: "Джибути",
    hi: "जिबूती",
    pt: "Djibuti",
    ch: "吉布提",
    ar: "جيبوتي"
  },
  {
    fr: "Dominique",
    es: "Dominica",
    en: "Dominica",
    de: "Dominica",
    ru: "Доминика",
    hi: "डोमिनिका",
    pt: "Dominica",
    ch: "多米尼加",
    ar: "دومينيكا"
  },
  {
    fr: "Égypte",
    es: "Egipto",
    en: "Egypt",
    de: "Ägypten",
    ru: "Египет",
    hi: "मिस्र",
    pt: "Egito",
    ch: "埃及",
    ar: "مصر"
  },
  {
    fr: "Émirats arabes unis",
    es: "Emiratos Árabes Unidos",
    en: "United Arab Emirates",
    de: "Vereinigte Arabische Emirate",
    ru: "Объединённые Арабские Эмираты",
    hi: "संयुक्त अरब अमीरात",
    pt: "Emirados Árabes Unidos",
    ch: "阿拉伯联合酋长国",
    ar: "الإمارات العربية المتحدة"
  },
  {
    fr: "Équateur",
    es: "Ecuador",
    en: "Ecuador",
    de: "Ecuador",
    ru: "Эквадор",
    hi: "इक्वेडोर",
    pt: "Equador",
    ch: "厄瓜多尔",
    ar: "الإكوادور"
  },
  {
    fr: "Érythrée",
    es: "Eritrea",
    en: "Eritrea",
    de: "Eritrea",
    ru: "Эритрея",
    hi: "इरिट्रिया",
    pt: "Eritreia",
    ch: "厄立特里亚",
    ar: "إريتريا"
  },
  {
    fr: "Espagne",
    es: "España",
    en: "Spain",
    de: "Spanien",
    ru: "Испания",
    hi: "स्पेन",
    pt: "Espanha",
    ch: "西班牙",
    ar: "إسبانيا"
  },
  {
    fr: "Estonie",
    es: "Estonia",
    en: "Estonia",
    de: "Estland",
    ru: "Эстония",
    hi: "एस्टोनिया",
    pt: "Estônia",
    ch: "爱沙尼亚",
    ar: "إستونيا"
  },
  {
    fr: "États-Unis",
    es: "Estados Unidos",
    en: "United States",
    de: "Vereinigte Staaten",
    ru: "Соединённые Штаты",
    hi: "संयुक्त राज्य अमेरिका",
    pt: "Estados Unidos",
    ch: "美国",
    ar: "الولايات المتحدة"
  },
  {
    fr: "Éthiopie",
    es: "Etiopía",
    en: "Ethiopia",
    de: "Äthiopien",
    ru: "Эфиопия",
    hi: "इथियोपिया",
    pt: "Etiópia",
    ch: "埃塞俄比亚",
    ar: "إثيوبيا"
  },
  {
    fr: "Fidji",
    es: "Fiyi",
    en: "Fiji",
    de: "Fidschi",
    ru: "Фиджи",
    hi: "फिजी",
    pt: "Fiji",
    ch: "斐济",
    ar: "فيجي"
  },
  {
    fr: "Finlande",
    es: "Finlandia",
    en: "Finland",
    de: "Finnland",
    ru: "Финляндия",
    hi: "फिनलैंड",
    pt: "Finlândia",
    ch: "芬兰",
    ar: "فنلندا"
  },
  {
    fr: "France",
    es: "Francia",
    en: "France",
    de: "Frankreich",
    ru: "Франция",
    hi: "फ्रांस",
    pt: "França",
    ch: "France",
    ar: "فرنسا"
  },
  {
    fr: "Autre",
    es: "Otro",
    en: "Other",
    de: "Andere",
    ru: "Другое",
    hi: "अन्य",
    pt: "Outro",
    ch: "其他",
    ar: "آخر"
  },
];






const HELP_TYPES: MultiLangDuo[] = [
  {
    fr: "Démarches administratives",
    es: "Trámites administrativos",
    en: "Administrative procedures",
    de: "Verwaltungsverfahren",
    ru: "Административные процедуры",
    hi: "प्रशासनिक प्रक्रियाएं",
    pt: "Procedimentos administrativos",
    ch: "行政程序",
    ar: "الإجراءات الإدارية"
  },
  {
    fr: "Recherche de logement",
    es: "Búsqueda de vivienda",
    en: "Housing search",
    de: "Wohnungssuche",
    ru: "Поиск жилья",
    hi: "आवास खोज",
    pt: "Busca de habitação",
    ch: "房屋搜寻",
    ar: "البحث عن السكن"
  },
  {
    fr: "Ouverture de compte bancaire",
    es: "Apertura de cuenta bancaria",
    en: "Bank account opening",
    de: "Kontoeröffnung",
    ru: "Открытие банковского счета",
    hi: "बैंक खाता खोलना",
    pt: "Abertura de conta bancária",
    ch: "银行开户",
    ar: "فتح حساب بنكي"
  },
  {
    fr: "Système de santé",
    es: "Sistema de salud",
    en: "Healthcare system",
    de: "Gesundheitssystem",
    ru: "Система здравоохранения",
    hi: "स्वास्थ्य सेवा प्रणाली",
    pt: "Sistema de saúde",
    ch: "医疗保健系统",
    ar: "نظام الرعاية الصحية"
  },
  {
    fr: "Éducation et écoles",
    es: "Educación y escuelas",
    en: "Education & schools",
    de: "Bildung und Schulen",
    ru: "Образование и школы",
    hi: "शिक्षा और स्कूल",
    pt: "Educação e escolas",
    ch: "教育与学校",
    ar: "التعليم والمدارس"
  },
  {
    fr: "Transport",
    es: "Transporte",
    en: "Transport",
    de: "Transport",
    ru: "Транспорт",
    hi: "परिवहन",
    pt: "Transporte",
    ch: "运输",
    ar: "النقل"
  },
  {
    fr: "Recherche d'emploi",
    es: "Búsqueda de empleo",
    en: "Job search",
    de: "Jobsuche",
    ru: "Поиск работы",
    hi: "नौकरी खोज",
    pt: "Busca de emprego",
    ch: "求职",
    ar: "البحث عن عمل"
  },
  {
    fr: "Création d'entreprise",
    es: "Creación de empresa",
    en: "Company creation",
    de: "Unternehmensgründung",
    ru: "Создание компании",
    hi: "कंपनी निर्माण",
    pt: "Criação de empresa",
    ch: "公司创建",
    ar: "إنشاء شركة"
  },
  {
    fr: "Fiscalité locale",
    es: "Fiscalidad local",
    en: "Local taxation",
    de: "Lokale Besteuerung",
    ru: "Местное налогообложение",
    hi: "स्थानीय कराधान",
    pt: "Tributação local",
    ch: "地方税",
    ar: "الضرائب المحلية"
  },
  {
    fr: "Culture et intégration",
    es: "Cultura e integración",
    en: "Culture & integration",
    de: "Kultur und Integration",
    ru: "Культура и интеграция",
    hi: "संस्कृति और एकीकरण",
    pt: "Cultura e integração",
    ch: "文化与融合",
    ar: "الثقافة والتكامل"
  },
  {
    fr: "Visa et immigration",
    es: "Visa e inmigración",
    en: "Visa & immigration",
    de: "Visum und Einwanderung",
    ru: "Виза и иммиграция",
    hi: "वीजा और आप्रवास",
    pt: "Visto e imigração",
    ch: "签证与移民",
    ar: "التأشيرة والهجرة"
  },
  {
    fr: "Assurances",
    es: "Seguros",
    en: "Insurances",
    de: "Versicherungen",
    ru: "Страхование",
    hi: "बीमा",
    pt: "Seguros",
    ch: "保险",
    ar: "التأمين"
  },
  {
    fr: "Téléphonie et internet",
    es: "Telefonía e internet",
    en: "Phone & internet",
    de: "Telefon und Internet",
    ru: "Телефон и интернет",
    hi: "फोन और इंटरनेट",
    pt: "Telefone e internet",
    ch: "电话和互联网",
    ar: "الهاتف والإنترنت"
  },
  {
    fr: "Alimentation et courses",
    es: "Alimentación y compras",
    en: "Groceries & food",
    de: "Lebensmittel und Einkauf",
    ru: "Продукты и покупки",
    hi: "किराने का सामान और खाना",
    pt: "Alimentos e compras",
    ch: "杂货和食品",
    ar: "البقالة والطعام"
  },
  {
    fr: "Loisirs et sorties",
    es: "Ocio y salidas",
    en: "Leisure & going out",
    de: "Freizeit und Ausgehen",
    ru: "Досуг и развлечения",
    hi: "अवकाश और बाहर जाना",
    pt: "Lazer e saídas",
    ch: "休闲与外出",
    ar: "الترفيه والخروج"
  },
  {
    fr: "Sports et activités",
    es: "Deportes y actividades",
    en: "Sports & activities",
    de: "Sport und Aktivitäten",
    ru: "Спорт и активности",
    hi: "खेल और गतिविधियां",
    pt: "Esportes e atividades",
    ch: "体育与活动",
    ar: "الرياضة والأنشطة"
  },
  {
    fr: "Sécurité",
    es: "Seguridad",
    en: "Safety",
    de: "Sicherheit",
    ru: "Безопасность",
    hi: "सुरक्षा",
    pt: "Segurança",
    ch: "安全",
    ar: "الأمان"
  },
  {
    fr: "Urgences",
    es: "Emergencias",
    en: "Emergencies",
    de: "Notfälle",
    ru: "Чрезвычайные ситуации",
    hi: "आपातकालीन स्थितियां",
    pt: "Emergências",
    ch: "紧急情况",
    ar: "حالات الطوارئ"
  },
  {
    fr: "Autre",
    es: "Otro",
    en: "Other",
    de: "Andere",
    ru: "Другое",
    hi: "अन्य",
    pt: "Outro",
    ch: "其他",
    ar: "آخر"
  },
];



// ===== Types =====
interface LanguageOption {
  value: string;
  label: string;
}
interface ExpatFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string; // E.164 (via PhoneField)

  currentCountry: string;
  currentPresenceCountry: string;
  interventionCountry: string;
  preferredLanguage: "fr" | "en" | "es" | "de" | "ru" | "hi"  | "pt" | "ch" | "ar";
  helpTypes: string[];
  customHelpType: string;
  yearsAsExpat: number;
  profilePhoto: string;
  bio: string;
  availability: "available" | "busy" | "offline";
  acceptTerms: boolean;
}

// ===== i18n =====
const I18N = {
  fr: {
    metaTitle: "Inscription Expat Aidant • SOS Expats",
    metaDesc:
      "Partagez vos bons plans, filez des coups de main et rendez la vie à l’étranger plus simple ✨",
    heroTitle: "Inscription Expat Aidant",
    heroSubtitle:
      "On crée votre profil en 3 petites étapes — facile, fluide, friendly 🌍",
    already: "Déjà inscrit ?",
    login: "Se connecter",
    personalInfo: "On fait connaissance",
    geoInfo: "Où vous êtes & expérience",
    helpInfo: "Comment vous aimez aider ?",
    firstName: "Prénom",
    lastName: "Nom",
    email: "Adresse email",
    password: "Mot de passe",
    phone: "Téléphone",
    countryCode: "Indicatif pays",
    residenceCountry: "Pays de résidence",
    presenceCountry: "Pays où vous êtes en ce moment",
    interventionCountry: "Pays d'intervention principal",
    yearsAsExpat: "Années d'expatriation",
    bio: "Votre expérience (bio)",
    profilePhoto: "Photo de profil",
    languages: "Langues parlées",
    selectedLanguages: "Langues sélectionnées",
    helpDomains: "Domaines d'aide",
    addHelp: "Ajouter un domaine d'aide",
    specifyHelp: "Précisez le domaine d'aide",
    help: {
      minPassword: "6 caractères et c’est parti (pas de prise de tête) 💃",
      emailPlaceholder: "vous@example.com",
      firstNamePlaceholder: "Comment on vous appelle ? 🥰",
      bioHint: "En 2–3 lignes, dites comment vous aidez (50 caractères mini).",
    },
    errors: {
      title: "Petites retouches avant le grand saut ✨",
      firstNameRequired: "On veut bien vous appeler… mais comment ? 😄",
      lastNameRequired: "Un nom de famille pour faire pro ? 👔",
      emailRequired: "Votre email pour rester en contact 📬",
      emailInvalid: "Cette adresse a l’air louche… Essayez nom@exemple.com 🧐",
      emailTaken:
        "Oups, cet email est déjà pris. Vous avez peut-être déjà un compte ? 🔑",
      passwordTooShort: "6 caractères minimum — easy ! 💪",
      phoneRequired: "Quel numéro on compose ? 📞",
      needCountry: "Votre pays de résidence, s’il vous plaît 🌍",
      needPresence: "Où êtes-vous en ce moment ? ✈️",
      needIntervention: "Choisissez un pays d'intervention 🗺️",
      needLang: "Ajoutez au moins une langue (polyglotte ? 🗣️)",
      needHelp: "Ajoutez au moins un domaine d'aide 🤝",
      needBio: "Encore un petit effort : 50 caractères minimum 📝",
      needPhoto: "Une photo pro, et c’est 100% plus rassurant 📸",
      needYears: "Au moins 1 an d’expatriation pour guider les autres 🌍",
      acceptTermsRequired: "Un petit clic sur les conditions et on y va ✅",
    },
    success: "Inscription réussie ! Bienvenue à bord 🎉",
    secureNote: "🔒 Données protégées • Support 24/7",
    progress: "Progression",
    footerTitle: "🌍 Une communauté d'entraide à portée de main",
    footerText: "Des expats qui s’entraident, partout.",
    cguLabel: "📋 CGU Expatriés",
    privacy: "🔒 Confidentialité",
    helpLink: "💬 Aide",
    contact: "📧 Contact",
    create: "Créer mon compte expat aidant",
    loading: "On prépare tout… ⏳",
    previewTitle: "Aperçu live de votre profil",
    previewHint: "C’est ce que les autres verront. Peaufinez à votre goût ✨",
    previewToggleOpen: "Masquer l’aperçu",
    previewToggleClose: "Voir l’aperçu",
  },
  en: {
    metaTitle: "Expat Helper Registration • SOS Expats",
    metaDesc: "Share your tips, lend a hand, and make life abroad feel easy ✨",
    heroTitle: "Expat Helper Registration",
    heroSubtitle:
      "Create your profile in 3 smooth steps — easy, friendly, fun 🌍",
    already: "Already registered?",
    login: "Log in",
    personalInfo: "Let’s get to know you",
    geoInfo: "Where you are & experience",
    helpInfo: "How do you like to help?",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    password: "Password",
    phone: "Phone",
    countryCode: "Country code",
    residenceCountry: "Country of residence",
    presenceCountry: "Where you are right now",
    interventionCountry: "Main intervention country",
    yearsAsExpat: "Years as an expat",
    bio: "Your experience (bio)",
    profilePhoto: "Profile photo",
    languages: "Spoken languages",
    selectedLanguages: "Selected languages",
    helpDomains: "Help domains",
    addHelp: "Add a help domain",
    specifyHelp: "Specify the help domain",
    help: {
      minPassword: "6+ characters and you’re good 💃",
      emailPlaceholder: "you@example.com",
      firstNamePlaceholder: "How should we call you? 🥰",
      bioHint: "In 2–3 lines, say how you help (min 50 chars).",
    },
    errors: {
      title: "Tiny tweaks and we’re there ✨",
      firstNameRequired: "We’d love to address you… what’s your name? 😄",
      lastNameRequired: "A last name keeps it professional 👔",
      emailRequired: "We need your email to stay in touch 📬",
      emailInvalid: "That email looks off. Try name@example.com 🧐",
      emailTaken:
        "This email is already in use. Maybe you already have an account? 🔑",
      passwordTooShort: "At least 6 characters — easy! 💪",
      phoneRequired: "What number should we call? 📞",
      needCountry: "Your residence country, please 🌍",
      needPresence: "Where are you at the moment? ✈️",
      needIntervention: "Pick a main intervention country 🗺️",
      needLang: "Add at least one language 🗣️",
      needHelp: "Add at least one help domain 🤝",
      needBio: "Push it to 50 characters — you got this 📝",
      needPhoto: "A professional photo builds trust 📸",
      needYears: "At least 1 year abroad to guide others 🌍",
      acceptTermsRequired: "Tick the box and we’re rolling ✅",
    },
    success: "Registration successful! Welcome aboard 🎉",
    secureNote: "🔒 Data protected • 24/7 support",
    progress: "Progress",
    footerTitle: "🌍 A community of helpful expats",
    footerText: "Expats helping expats, everywhere.",
    cguLabel: "📋 CGU Expats",
    privacy: "🔒 Privacy",
    helpLink: "💬 Help",
    contact: "📧 Contact",
    create: "Create my expat helper account",
    loading: "Getting things ready… ⏳",
    previewTitle: "Live profile preview",
    previewHint: "This is what others will see. Make it shine ✨",
    previewToggleOpen: "Hide preview",
    previewToggleClose: "Show preview",
  },
} as const;

// === Types i18n génériques (fix 21) ===
type I18NMap = typeof I18N;
type AnyI18N = I18NMap[keyof I18NMap];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mapDuo = (list: MultiLangDuo[], lang: "fr" | "en" | "es" | "de" | "ru" | "ch" | "hi" | "pt" | "ar") =>
  list.map((item) => item[lang]);

// Petit composant succès
const FieldSuccess = ({
  show,
  children,
}: {
  show: boolean;
  children: React.ReactNode;
}) =>
  show ? (
    <div className="mt-1 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-2 py-1 inline-flex items-center">
      <CheckCircle className="w-4 h-4 mr-1" /> {children}
    </div>
  ) : null;

const FieldError = ({
  show,
  children,
}: {
  show: boolean;
  children: React.ReactNode;
}) =>
  show ? (
    <div className="mt-1 flex items-center gap-1 text-sm text-red-600 bg-red-50 rounded-lg px-2 py-1">
      <XCircle className="h-4 w-4 flex-shrink-0" />
      <span>{children}</span>
    </div>
  ) : null;

const TagSelector = React.memo(
  ({ items, onRemove }: { items: string[]; onRemove: (v: string) => void }) => {
    if (!items.length) return null;
    return (
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {items.map((v, i) => (
            <span
              key={`${v}-${i}`}
              className={`bg-emerald-100 text-emerald-800 ${THEME.chip} px-3 py-1 rounded-xl text-sm border-2 flex items-center`}
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

// ===== Helpers =====
// const computePasswordStrength = (pw: string) => {
//   if (!pw)
//     return {
//       percent: 0,
//       labelFr: "Vide",
//       labelEn: "Empty",
//       color: "bg-gray-300",
//     };
//   let score = 0;
//   if (pw.length >= 6) score++;
//   if (pw.length >= 10) score++;
//   if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
//   if (/\d/.test(pw) || /[^A-Za-z]/.test(pw)) score++;
//   const clamp = Math.min(score, 4);
//   const percentMap = [10, 35, 60, 80, 100] as const;
//   const colorMap = [
//     "bg-red-400",
//     "bg-orange-400",
//     "bg-yellow-400",
//     "bg-green-500",
//     "bg-green-600",
//   ] as const;
//   const frMap = [
//     "Très faible",
//     "Faible",
//     "Correct",
//     "Bien",
//     "Très solide",
//   ] as const;
//   const enMap = ["Very weak", "Weak", "Okay", "Good", "Very strong"] as const;
//   return {
//     percent: percentMap[clamp],
//     labelFr: frMap[clamp],
//     labelEn: enMap[clamp],
//     color: colorMap[clamp],
//   };
// };

const computePasswordStrength = (pw: string) => {
  if (!pw)
    return {
      percent: 0,
      labelEn: "Empty",
      labelEs: "Vacío",
      labelFr: "Vide",
      labelRu: "Пусто",
      labelDe: "Leer",
      labelHi: "खाली",
      labelCh: "空的",
      labelAr: "فارغ",
      labelPt: "Vazio",
      color: "bg-gray-300"
    };

  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) || /[^A-Za-z]/.test(pw)) score++;

  const clamp = Math.min(score, 4);
  const percentMap = [10, 35, 60, 80, 100] as const;
  const colorMap = [
    "bg-red-400",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-green-500",
    "bg-green-600",
  ] as const;

  const enMap = ["Very weak", "Weak", "Okay", "Good", "Very strong"] as const;
  const esMap = [
    "Muy débil",
    "Débil",
    "Aceptable",
    "Buena",
    "Muy fuerte",
  ] as const;
  const frMap = [
    "Très faible",
    "Faible",
    "Correct",
    "Bien",
    "Très solide",
  ] as const;
  const ruMap = [
    "Очень слабый",
    "Слабый",
    "Нормальный",
    "Хороший",
    "Очень сильный",
  ] as const;
  const deMap = [
    "Sehr schwach",
    "Schwach",
    "Okay",
    "Gut",
    "Sehr stark",
  ] as const;
  const hiMap = ["बहुत कमजोर", "कमजोर", "ठीक", "अच्छा", "बहुत मजबूत"] as const;
  const chMap = ["很弱", "虚弱的", "好的", "好的", "很强"] as const;
  const arMap = ["ضعيف جدًا", "ضعيف", "مقبول", "جيد", "قوي جدًا"] as const;

  return {
    percent: percentMap[clamp],
    labelEn: enMap[clamp],
    labelEs: esMap[clamp],
    labelFr: frMap[clamp],
    labelRu: ruMap[clamp],
    labelDe: deMap[clamp],
    labelHi: hiMap[clamp],
    labelCh: chMap[clamp],
    labelAr: arMap[clamp],
    color: colorMap[clamp],
  };
};


const Avatar = ({ src, name }: { src?: string; name: string }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-200"
      />
    );
  }
  const initials = name
    .split(" ")
    .map((p) => p.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
  return (
    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center font-bold ring-2 ring-emerald-200">
      {initials || "🙂"}
    </div>
  );
};

// ===== Live Preview =====
const PreviewCard = ({
  lang,
  t,
  progress,
  fullName,
  photo,
  currentCountry,
  presenceCountry,
  interventionCountry,
  yearsAsExpat,
  languages,
  helpTypes,
}: {
  lang: "fr" | "en" | "hi" | "es" | "de" | "ru"| "ch" | "pt" | "ar";
  t: AnyI18N; // <- générique (fix 21)
  progress: number;
  fullName: string;
  photo?: string;
  currentCountry?: string;
  presenceCountry?: string;
  interventionCountry?: string;
  yearsAsExpat?: number;
  languages: string[];
  helpTypes: string[];
}) => {
  const intl = useIntl();
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <Avatar src={photo} name={fullName} />
        <div>
          <h3 className="text-lg font-extrabold text-gray-900 leading-tight">
            {/* {fullName || (lang === "en" ? "Your Name" : "Votre nom")} */}
            {fullName ||
              intl.formatMessage({ id: "registerExpat.preview.yourName" })}
          </h3>
          {/* <p className="text-xs text-gray-500">
            {lang === "en" ? "Expat Helper" : "Expat Aidant"} • {progress}%{" "}
            {lang === "en" ? "complete" : "complet"}
          </p> */}
          <p className="text-xs text-gray-500">
            <FormattedMessage id="registerExpat.preview.expatHelper" />
            {" • "}
            <FormattedMessage
              id="registerExpat.preview.complete"
              values={{ progress }}
            />
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-2 bg-emerald-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
        {(currentCountry || presenceCountry) && (
          <div className="flex items-center gap-2 text-gray-700">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">
              {/* {currentCountry || (lang === "en" ? "Residence" : "Résidence")} */}
   {currentCountry || (lang === "en"
  ? "Residence"
  : lang === "es"
  ? "Residencia"
  : lang === "fr"
  ? "Résidence"
  : lang === "ru"
  ? "Резиденция"
  : lang === "de"
  ? "Wohnsitz"
  : lang === "hi"
  ? "निवास स्थान"
  : lang === "ch"
  ? "住宅"
  : lang === "pt"
  ? "Residência"
  : lang === "ar"
  ? "الإقامة"
  : "Residence")}
            </span>
            {presenceCountry && (
              <span className="ml-auto rounded-full px-2 py-0.5 text-xs bg-emerald-50 border border-emerald-200">
                {presenceCountry}
              </span>
            )}
          </div>
        )}
        {interventionCountry && (
          <div className="flex items-center gap-2 text-gray-700">
            <Globe className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">
              {/* {lang === "en" ? "Main help in" : "Intervention"}: */}
           {lang === "en"
  ? "Main help in"
  : lang === "es"
  ? "Ayuda principal en"
  : lang === "fr"
  ? "Intervention"
  : lang === "ru"
  ? "Основная помощь в"
  : lang === "de"
  ? "Haupthilfe in"
  : lang === "hi"
  ? "मुख्य सहायता में"
  : lang === "ch"
  ? "主要帮助于"
  : lang === "ar"
  ? "المساعدة الرئيسية في"
  : "Main help in"}:
            </span>
            <span className="ml-auto rounded-full px-2 py-0.5 text-xs bg-emerald-50 border border-emerald-200">
              {interventionCountry}
            </span>
          </div>
        )}
        {typeof yearsAsExpat === "number" && yearsAsExpat > 0 && (
          <div className="text-gray-700">
            {/* {lang === "en" ? "Years abroad:" : "Années à l’étranger :"}{" "} */}
            {lang === "en"
  ? "Years abroad:"
  : lang === "es"
  ? "Años en el extranjero:"
  : lang === "fr"
  ? "Années à l'étranger :"
  : lang === "ru"
  ? "Лет за границей:"
  : lang === "de"
  ? "Jahre im Ausland:"
  : lang === "hi"
  ? "विदेश में वर्ष:"
  : lang === "ch"
  ? "国外生活年限:"
  : lang === "ar"
  ? "سنوات في الخارج:"
  : "Years abroad:"}{" "}
            <strong>{yearsAsExpat}</strong>
          </div>
        )}
      </div>

      {!!languages.length && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-700 mb-1">
            {/* {t.selectedLanguages} */}
          {t?.selectedLanguages || (lang === "en"
  ? "Selected Languages"
  : lang === "es"
  ? "Idiomas seleccionados"
  : lang === "fr"
  ? "Langues sélectionnées"
  : lang === "ru"
  ? "Выбранные языки"
  : lang === "de"
  ? "Ausgewählte Sprachen"
  : lang === "hi"
  ? "चयनित भाषाएं"
  : lang === "ch"
  ? "选定的语言"
  : lang === "ar"
  ? "اللغات المختارة"
  : "Selected Languages")}
          </p>
          <div className="flex flex-wrap gap-2">
            {languages.map((l) => (
              <span
                key={l}
                className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs border border-emerald-200"
              >
                {l.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}

      {!!helpTypes.length && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-700 mb-1">
            {t.helpDomains}
          </p>
          <div className="flex flex-wrap gap-2">
            {helpTypes.map((h, i) => (
              <span
                key={`${h}-${i}`}
                className="px-2 py-1 rounded-lg bg-white text-gray-800 text-xs border-emerald-200 border"
              >
                {h}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-gray-500">
        {/* {t.previewHint} */}
        {intl.formatMessage({ id: "registerExpat.preview.hint" })}
      </p>
    </div>
  );
};

// --- Panneau checklist vert en bas ---
const BottomChecklist = ({
  items,
  progress,
  lang,
  onJump,
}: {
  items: {
    key: string;
    label: string;
    ok: boolean;
    ref?: React.MutableRefObject<HTMLElement | null>;
  }[];
  progress: number;
  lang: "fr" | "en" | "es" | "de" | "ru" | "hi" | "ch" | "pt" | "ar";
  onJump: (r?: React.MutableRefObject<HTMLElement | null>) => void;
}) => (
  <div className="mt-6">
    <div className="rounded-2xl bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 p-[10px] shadow-lg">
      <div className="rounded-xl bg-white/90 backdrop-blur-sm p-4 sm:p-5">
        <p className="font-bold text-gray-900 mb-3">
          {/* {lang === "en" ? "To complete:" : "À compléter :"} */}
          <FormattedMessage id="registerExpat.checklist.toComplete" />
        </p>

        <div className="grid sm:grid-cols-2 gap-y-2">
          {items.map((it) => (
            <button
              key={it.key}
              type="button"
              onClick={() => onJump(it.ref)}
              className="text-left rounded-lg px-2 py-1 hover:bg-emerald-50/70 focus:outline-none"
            >
              <span
                className={`inline-flex items-center text-sm ${it.ok ? "text-emerald-700" : "text-gray-600"}`}
              >
                {it.ok ? (
                  <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
                ) : (
                  <span className="w-4 h-4 mr-2 inline-block rounded-full border border-gray-300" />
                )}
                {it.label}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4">
          <span className="text-xs text-gray-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1 inline-block">
            {/* {lang === "en"
              ? `Completion: ${progress}%`
              : `Complétion : ${progress}%`} */}

           {lang === "en"
  ? `Completion: ${progress}%`
  : lang === "es"
  ? `Completado: ${progress}%`
  : lang === "fr"
  ? `Complétion : ${progress}%`
  : lang === "ru"
  ? `Завершено: ${progress}%`
  : lang === "de"
  ? `Fortschritt: ${progress}%`
  : lang === "hi"
  ? `पूर्णता: ${progress}%`
  : lang === "ch"
  ? `完成: ${progress}%`
  : lang === "ar"
  ? `الإنجاز: ${progress}%`
  : `Completion: ${progress}%`}
            {/* <FormattedMessage
              id="registerExpat.checklist.completion"
              values={{ progress }}
            /> */}
          </span>
        </div>
      </div>
    </div>
  </div>
);

// ===== Component =====
const RegisterExpat: React.FC = () => {
  const intl = useIntl();
  const navigate = useNavigate();

  // --- Types sûrs ---
  type LocalNavState = Readonly<{ selectedProvider?: Provider }>;
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
    const state = (rawState ?? null) as LocalNavState | null;
    const sp = state?.selectedProvider;
    if (isProviderLike(sp)) {
      try {
        sessionStorage.setItem("selectedProvider", JSON.stringify(sp));
      } catch {
        /* no-op */
      }
    }
  }, [location.state]);

  const { register, isLoading, error } = useAuth();
  const { language } = useApp(); // 'fr' | 'en'
  const lang = (language as "fr" | "en" | "es" | "de" | "ru" | "hi" | "ch"  | "pt" | "ar") || "fr";
  const t: AnyI18N = I18N[lang]; // <- annotation explicite

  // ---- SEO / OG meta ----
  // useEffect(() => {
  //   document.title = t.metaTitle;
  //   const ensure = (name: string, content: string, prop = false) => {
  //     const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  //     let el = document.querySelector(sel) as HTMLMetaElement | null;
  //     if (!el) {
  //       el = document.createElement("meta");
  //       if (prop) el.setAttribute("property", name);
  //       else el.setAttribute("name", name);
  //       document.head.appendChild(el);
  //     }
  //     el.content = content;
  //   };
  //   ensure("description", t.metaDesc);
  //   ensure("og:title", t.metaTitle, true);
  //   ensure("og:description", t.metaDesc, true);
  //   ensure("og:type", "website", true);
  //   ensure("twitter:card", "summary_large_image");
  //   ensure("twitter:title", t.metaTitle);
  //   ensure("twitter:description", t.metaDesc);
  // }, [t]);

  useEffect(() => {
    document.title = intl.formatMessage({ id: "registerExpat.meta.title" });

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
      intl.formatMessage({ id: "registerExpat.meta.description" })
    );
    ensure(
      "og:title",
      intl.formatMessage({ id: "registerExpat.meta.title" }),
      true
    );
    ensure(
      "og:description",
      intl.formatMessage({ id: "registerExpat.meta.description" }),
      true
    );
    ensure("og:type", "website", true);
    ensure("twitter:card", "summary_large_image");
    ensure(
      "twitter:title",
      intl.formatMessage({ id: "registerExpat.meta.title" })
    );
    ensure(
      "twitter:description",
      intl.formatMessage({ id: "registerExpat.meta.description" })
    );
  }, [intl]);

  // ---- Initial state ----
  const initial: ExpatFormData = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "", // E.164 (via PhoneField)

    currentCountry: "",
    currentPresenceCountry: "",
    interventionCountry: "",
    preferredLanguage: lang,
    helpTypes: [],
    customHelpType: "",
    yearsAsExpat: 0,
    profilePhoto: "",
    bio: "",
    availability: "available",
    acceptTerms: false,
  };

  const [form, setForm] = useState<ExpatFormData>(initial);
  const [selectedLanguages, setSelectedLanguages] = useState<
    MultiValue<LanguageOption>
  >([]);
  const [showPassword, setShowPassword] = useState(false);
  const [capsPassword, setCapsPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showCustomHelp, setShowCustomHelp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);



  // Refs pour scroll/jump
  const refFirstName = useRef<HTMLDivElement | null>(null);
  const refLastName = useRef<HTMLDivElement | null>(null);
  const refEmail = useRef<HTMLDivElement | null>(null);
  const refPwd = useRef<HTMLDivElement | null>(null);
  const refPhone = useRef<HTMLDivElement | null>(null);
  const refCountry = useRef<HTMLDivElement | null>(null);
  const refPresence = useRef<HTMLDivElement | null>(null);
  const refInterv = useRef<HTMLDivElement | null>(null);
  const refYears = useRef<HTMLDivElement | null>(null);
  const refLangs = useRef<HTMLDivElement | null>(null);
  const refBio = useRef<HTMLDivElement | null>(null);
  const refPhoto = useRef<HTMLDivElement | null>(null);
  const refHelp = useRef<HTMLDivElement | null>(null);
  const refCGU = useRef<HTMLDivElement | null>(null);

  // ---- Options ----
  const countryOptions = useMemo(() => mapDuo(COUNTRIES, lang), [lang]);
  const helpTypeOptions = useMemo(() => mapDuo(HELP_TYPES, lang), [lang]);

  // ---- Password strength ----
  const pwdStrength = useMemo(
    () => computePasswordStrength(form.password),
    [form.password]
  );

  // ---- Validations (pour messages & checklist) ----
  const valid = useMemo(
    () => ({
      firstName: !!form.firstName.trim(),
      lastName: !!form.lastName.trim(),
      email: EMAIL_REGEX.test(form.email), // ✅ format uniquement
      password: form.password.length >= 6,
      // phone: !!(
      //   watchedPhone &&
      //   watchedPhone.startsWith("+") &&
      //   watchedPhone.length >= 10
      // ), // E.164 détecté
      phone: (() => {
        if (!form.phone.trim()) return false;

        try {
          const parsed = parsePhoneNumberFromString(form.phone);
          return parsed ? parsed.isValid() : false;
        } catch {
          return false;
        }
      })(),

      currentCountry: !!form.currentCountry,
      currentPresenceCountry: !!form.currentPresenceCountry,
      interventionCountry: !!form.interventionCountry,
      yearsAsExpat: form.yearsAsExpat >= 1,
      bio: form.bio.trim().length >= 50,
      profilePhoto: !!form.profilePhoto,
      languages: (selectedLanguages as LanguageOption[]).length > 0,
      helpTypes: form.helpTypes.length > 0,
      acceptTerms: form.acceptTerms,
    }),
    [form, selectedLanguages]
  );

  // ---- Progress (sans emailStatus) ----
  const progress = useMemo(() => {
    const fields = [
      !!form.firstName.trim(),
      !!form.lastName.trim(),
      EMAIL_REGEX.test(form.email),
      form.password.length >= 6,
      // !!(watchedPhone && watchedPhone.startsWith("+")),
      !!form.phone &&
        (() => {
          // ✅ Update this
          try {
            const parsed = parsePhoneNumberFromString(form.phone);
            return parsed ? parsed.isValid() : false;
          } catch {
            return false;
          }
        })(),

      !!form.currentCountry,
      !!form.currentPresenceCountry,
      !!form.interventionCountry,
      form.yearsAsExpat >= 1,
      form.bio.trim().length >= 50,
      !!form.profilePhoto,
      (selectedLanguages as LanguageOption[]).length > 0,
      form.helpTypes.length > 0,
      form.acceptTerms,
    ];
    const done = fields.filter(Boolean).length;
    return Math.round((done / fields.length) * 100);
  }, [form, selectedLanguages]);

  // ---- Handlers ----
  const onChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name, value, type, checked } = e.target as HTMLInputElement;
      setForm(
        (prev) =>
          ({
            ...prev,
            [name]:
              type === "checkbox"
                ? checked
                : type === "number"
                  ? Number(value)
                  : value,
          }) as ExpatFormData
      );
      if (fieldErrors[name]) {
        setFieldErrors((prev) => {
          const rest = { ...prev };
          delete rest[name];
          return rest;
        });
      }
      if (formError) setFormError("");
    },
    [fieldErrors, formError]
  );

  const onHelpSelect = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value;
      if (!v) return;
      const other = lang === "en" ? "Other" : "Autre";
      if (v === other) {
        setShowCustomHelp(true);
        e.target.value = "";
        return;
      }
      if (!form.helpTypes.includes(v)) {
        setForm((prev) => ({ ...prev, helpTypes: [...prev.helpTypes, v] }));
      }
      e.target.value = "";
      if (fieldErrors.helpTypes) {
        const rest = { ...fieldErrors };
        delete rest.helpTypes;
        setFieldErrors(rest);
      }
    },
    [form.helpTypes, fieldErrors, lang]
  );

  const removeHelp = useCallback((v: string) => {
    setForm((prev) => ({
      ...prev,
      helpTypes: prev.helpTypes.filter((x) => x !== v),
    }));
  }, []);
  const addCustomHelp = useCallback(() => {
    const v = form.customHelpType.trim();
    if (v && !form.helpTypes.includes(v)) {
      setForm((prev) => ({
        ...prev,
        helpTypes: [...prev.helpTypes, v],
        customHelpType: "",
      }));
      setShowCustomHelp(false);
    }
  }, [form.customHelpType, form.helpTypes]);

  // ---- Validation blocage submit ----
  // const validate = useCallback(() => {
  //   const e: Record<string, string> = {};
  //   if (!valid.firstName) e.firstName = t.errors.firstNameRequired;
  //   if (!valid.lastName) e.lastName = t.errors.lastNameRequired;
  //   if (!form.email.trim()) e.email = t.errors.emailRequired;
  //   else if (!EMAIL_REGEX.test(form.email)) e.email = t.errors.emailInvalid;
  //   // ⚠️ Unicité: on laisse Firebase gérer
  //   if (!valid.password) e.password = t.errors.passwordTooShort;
  //   if (!valid.phone) e.phone = t.errors.phoneRequired;
  //   if (!valid.currentCountry) e.currentCountry = t.errors.needCountry;
  //   if (!valid.currentPresenceCountry)
  //     e.currentPresenceCountry = t.errors.needPresence;
  //   if (!valid.interventionCountry)
  //     e.interventionCountry = t.errors.needIntervention;
  //   if (!valid.languages) e.languages = t.errors.needLang;
  //   if (!valid.helpTypes) e.helpTypes = t.errors.needHelp;
  //   if (!valid.bio) e.bio = t.errors.needBio;
  //   if (!valid.profilePhoto) e.profilePhoto = t.errors.needPhoto;
  //   if (!valid.yearsAsExpat) e.yearsAsExpat = t.errors.needYears;
  //   if (!valid.acceptTerms) e.acceptTerms = t.errors.acceptTermsRequired;

  //   setFieldErrors(e);
  //   if (Object.keys(e).length) {
  //     setFormError(t.errors.title);
  //     return false;
  //   }
  //   return true;
  // }, [form, valid, t]);

  const validate = useCallback(() => {
    const e: Record<string, string> = {};

    if (!valid.firstName)
      e.firstName = intl.formatMessage({
        id: "registerExpat.errors.firstNameRequired",
      });
    if (!valid.lastName)
      e.lastName = intl.formatMessage({
        id: "registerExpat.errors.lastNameRequired",
      });
    if (!form.email.trim())
      e.email = intl.formatMessage({
        id: "registerExpat.errors.emailRequired",
      });
    else if (!EMAIL_REGEX.test(form.email))
      e.email = intl.formatMessage({ id: "registerExpat.errors.emailInvalid" });

    if (!valid.password)
      e.password = intl.formatMessage({
        id: "registerExpat.errors.passwordTooShort",
      });
    if (!valid.phone)
      e.phone = intl.formatMessage({
        id: "registerExpat.errors.phoneRequired",
      });
    if (!valid.currentCountry)
      e.currentCountry = intl.formatMessage({
        id: "registerExpat.errors.needCountry",
      });
    if (!valid.currentPresenceCountry)
      e.currentPresenceCountry = intl.formatMessage({
        id: "registerExpat.errors.needPresence",
      });
    if (!valid.interventionCountry)
      e.interventionCountry = intl.formatMessage({
        id: "registerExpat.errors.needIntervention",
      });
    if (!valid.languages)
      e.languages = intl.formatMessage({ id: "registerExpat.errors.needLang" });
    if (!valid.helpTypes)
      e.helpTypes = intl.formatMessage({ id: "registerExpat.errors.needHelp" });
    if (!valid.bio)
      e.bio = intl.formatMessage({ id: "registerExpat.errors.needBio" });
    if (!valid.profilePhoto)
      e.profilePhoto = intl.formatMessage({
        id: "registerExpat.errors.needPhoto",
      });
    if (!valid.yearsAsExpat)
      e.yearsAsExpat = intl.formatMessage({
        id: "registerExpat.errors.needYears",
      });
    if (!valid.acceptTerms)
      e.acceptTerms = intl.formatMessage({
        id: "registerExpat.errors.acceptTermsRequired",
      });

    setFieldErrors(e);
    if (Object.keys(e).length) {
      setFormError(intl.formatMessage({ id: "registerExpat.errors.title" }));
      return false;
    }
    return true;
  }, [form, valid, intl]);

  // Scroll vers le premier champ incomplet
  const scrollToFirstIncomplete = useCallback(() => {
    const pairs: Array<
      [boolean, React.MutableRefObject<HTMLElement | null> | null]
    > = [
      [!valid.firstName, refFirstName],
      [!valid.lastName, refLastName],
      [!valid.email, refEmail],
      [!valid.password, refPwd],
      [!valid.phone, refPhone],
      [!valid.currentCountry, refCountry],
      [!valid.currentPresenceCountry, refPresence],
      [!valid.interventionCountry, refInterv],
      [!valid.languages, refLangs],
      [!valid.helpTypes, refHelp],
      [!valid.bio, refBio],
      [!valid.profilePhoto, refPhoto],
      [!valid.yearsAsExpat, refYears],
      [!valid.acceptTerms, refCGU],
    ];
    const target = pairs.find(([need]) => need)?.[1];
    const el = target?.current || null;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [valid]);

  // ---- Submit ----
  const handleSubmit = useCallback(
    async (ev: React.FormEvent) => {
      ev.preventDefault();
      console.log("=== FORM SUBMISSION ATTEMPT ===");
      console.log("Form Data:", form);

      if (isSubmitting) return;
      setIsSubmitting(true);
      setFormError("");
      if (!validate()) {
        setIsSubmitting(false);
        scrollToFirstIncomplete();
        return;
      }
      try {
        const languageCodes = (selectedLanguages as LanguageOption[]).map(
          (l) => l.value
        );
        // const e164Phone = getValues("phone") || ""; // déjà normalisé par PhoneField

        const userData = {
          role: "expat" as const,
          type: "expat" as const,
          email: form.email.trim().toLowerCase(),
          fullName: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone, // ✅ E.164
          currentCountry: form.currentCountry,
          currentPresenceCountry: form.currentPresenceCountry,
          country: form.currentPresenceCountry,
          interventionCountry: form.interventionCountry,
          profilePhoto: form.profilePhoto,
          photoURL: form.profilePhoto,
          avatar: form.profilePhoto,
          languages: languageCodes,
          languagesSpoken: languageCodes,
          helpTypes: form.helpTypes,
          yearsAsExpat: form.yearsAsExpat,
          bio: form.bio.trim(),
          description: form.bio.trim(),
          availability: form.availability,
          isOnline: form.availability === "available",
          // isApproved: true,
          // isVisible: true,
          isApproved: false,
          isVisible: false,
          isActive: true,
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

        const stripeResult = await createStripeAccount({
          email: form.email.trim().toLowerCase(),
          currentCountry: getCountryCode(form.currentCountry),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          userType: "expat", // ✅ Specify expat
        });

        const result = stripeResult.data as {
          success: boolean;
          accountId: string;
          message: string;
        };

        console.log("✅ Stripe account created:", result.accountId);
        // ============================================

        navigate(redirect, {
          replace: true,
          state: {
            message: intl.formatMessage({ id: "registerExpat.success" }),
            type: "success",
          },
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error";
        setFormError(msg);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      validate,
      register,
      form,
      selectedLanguages,
      navigate,
      redirect,
      t,
      scrollToFirstIncomplete,
      // getValues,
    ]
  );

  // ---- Can submit ----
  const canSubmit = useMemo(
    () =>
      valid.email &&
      valid.password &&
      valid.firstName &&
      valid.lastName &&
      valid.acceptTerms &&
      valid.bio &&
      valid.profilePhoto &&
      valid.languages &&
      valid.helpTypes &&
      valid.currentCountry &&
      valid.currentPresenceCountry &&
      valid.interventionCountry &&
      valid.yearsAsExpat &&
      valid.phone &&
      !isLoading &&
      !isSubmitting &&
      !Object.keys(fieldErrors).length,
    [valid, fieldErrors, isLoading, isSubmitting]
  );

  // ---- Checklist items ----
  // const checklist = useMemo(
  //   () => [
  //     {
  //       key: "firstName",
  //       label: lang === "en" ? "First name" : "Prénom",
  //       ok: valid.firstName,
  //       ref: refFirstName,
  //     },
  //     {
  //       key: "lastName",
  //       label: lang === "en" ? "Last name" : "Nom",
  //       ok: valid.lastName,
  //       ref: refLastName,
  //     },
  //     {
  //       key: "email",
  //       label: lang === "en" ? "Valid email" : "Email valide",
  //       ok: valid.email,
  //       ref: refEmail,
  //     },
  //     {
  //       key: "password",
  //       label:
  //         lang === "en"
  //           ? "Password (≥ 6 chars)"
  //           : "Mot de passe (≥ 6 caractères)",
  //       ok: valid.password,
  //       ref: refPwd,
  //     },
  //     {
  //       key: "phone",
  //       label: lang === "en" ? "Phone (E.164)" : "Téléphone (E.164)",
  //       ok: valid.phone,
  //       ref: refPhone,
  //     },
  //     {
  //       key: "currentCountry",
  //       label: lang === "en" ? "Country of residence" : "Pays de résidence",
  //       ok: valid.currentCountry,
  //       ref: refCountry,
  //     },
  //     {
  //       key: "currentPresenceCountry",
  //       label: lang === "en" ? "Presence country" : "Pays de présence",
  //       ok: valid.currentPresenceCountry,
  //       ref: refPresence,
  //     },
  //     {
  //       key: "interventionCountry",
  //       label:
  //         lang === "en" ? "Main intervention country" : "Pays d'intervention",
  //       ok: valid.interventionCountry,
  //       ref: refInterv,
  //     },
  //     {
  //       key: "languages",
  //       label: lang === "en" ? "At least one language" : "Au moins une langue",
  //       ok: valid.languages,
  //       ref: refLangs,
  //     },
  //     {
  //       key: "helpTypes",
  //       label:
  //         lang === "en" ? "At least one specialty" : "Au moins une spécialité",
  //       ok: valid.helpTypes,
  //       ref: refHelp,
  //     },
  //     {
  //       key: "profilePhoto",
  //       label: lang === "en" ? "Profile photo" : "Photo de profil",
  //       ok: valid.profilePhoto,
  //       ref: refPhoto,
  //     },
  //     {
  //       key: "bio",
  //       label: lang === "en" ? "Bio (≥ 50 chars)" : "Bio (≥ 50 caractères)",
  //       ok: valid.bio,
  //       ref: refBio,
  //     },
  //     {
  //       key: "yearsAsExpat",
  //       label:
  //         lang === "en" ? "Years abroad (≥ 1)" : "Années d'expatriation (≥ 1)",
  //       ok: valid.yearsAsExpat,
  //       ref: refYears,
  //     },
  //     {
  //       key: "acceptTerms",
  //       label: lang === "en" ? "Accept T&Cs" : "Accepter les CGU",
  //       ok: valid.acceptTerms,
  //       ref: refCGU,
  //     },
  //   ],
  //   [valid, lang]
  // );

  // const checklist = useMemo(
  //   () => [
  //     {
  //       key: "firstName",
  //       label: intl.formatMessage({ id: "registerExpat.firstName" }),
  //       ok: valid.firstName,
  //       ref: refFirstName,
  //     },
  //     {
  //       key: "lastName",
  //       label: intl.formatMessage({ id: "registerExpat.lastName" }),
  //       ok: valid.lastName,
  //       ref: refLastName,
  //     },
  //     {
  //       key: "email",
  //       label: intl.formatMessage({ id: "registerExpat.email" }),
  //       ok: valid.email,
  //       ref: refEmail,
  //     },
  //     {
  //       key: "password",
  //       label: intl.formatMessage({ id: "registerExpat.password" }),
  //       ok: valid.password,
  //       ref: refPwd,
  //     },
  //     {
  //       key: "phone",
  //       label: intl.formatMessage({ id: "registerExpat.phone" }),
  //       ok: valid.phone,
  //       ref: refPhone,
  //     },
  //     {
  //       key: "currentCountry",
  //       label: intl.formatMessage({ id: "registerExpat.residenceCountry" }),
  //       ok: valid.currentCountry,
  //       ref: refCountry,
  //     },
  //     {
  //       key: "currentPresenceCountry",
  //       label: intl.formatMessage({ id: "registerExpat.presenceCountry" }),
  //       ok: valid.currentPresenceCountry,
  //       ref: refPresence,
  //     },
  //     {
  //       key: "interventionCountry",
  //       label: intl.formatMessage({ id: "registerExpat.interventionCountry" }),
  //       ok: valid.interventionCountry,
  //       ref: refInterv,
  //     },
  //     {
  //       key: "languages",
  //       label: intl.formatMessage({ id: "registerExpat.languages" }),
  //       ok: valid.languages,
  //       ref: refLangs,
  //     },
  //     {
  //       key: "helpTypes",
  //       label: intl.formatMessage({ id: "registerExpat.helpDomains" }),
  //       ok: valid.helpTypes,
  //       ref: refHelp,
  //     },
  //     {
  //       key: "profilePhoto",
  //       label: intl.formatMessage({
  //         id: "registerExpat.checklist.profilePhoto",
  //       }),
  //       ok: valid.profilePhoto,
  //       ref: refPhoto,
  //     },
  //     {
  //       key: "bio",
  //       label: intl.formatMessage({ id: "registerExpat.checklist.bio" }),
  //       ok: valid.bio,
  //       ref: refBio,
  //     },
  //     {
  //       key: "yearsAsExpat",
  //       label: intl.formatMessage({
  //         id: "registerExpat.checklist.yearsAbroad",
  //       }),
  //       ok: valid.yearsAsExpat,
  //       ref: refYears,
  //     },
  //     {
  //       key: "acceptTerms",
  //       label: intl.formatMessage({
  //         id: "registerExpat.checklist.acceptTerms",
  //       }),
  //       ok: valid.acceptTerms,
  //       ref: refCGU,
  //     },
  //   ],
  //   [valid, intl]
  // );

  const checklist = useMemo(
    () => [
      {
        key: "firstName",
        label: intl.formatMessage({ id: "registerExpat.checklist.firstName" }),
        ok: valid.firstName,
        ref: refFirstName,
      },
      {
        key: "lastName",
        label: intl.formatMessage({ id: "registerExpat.checklist.lastName" }),
        ok: valid.lastName,
        ref: refLastName,
      },
      {
        key: "email",
        label: intl.formatMessage({ id: "registerExpat.checklist.validEmail" }),
        ok: valid.email,
        ref: refEmail,
      },
      {
        key: "password",
        label: intl.formatMessage({ id: "registerExpat.checklist.password" }),
        ok: valid.password,
        ref: refPwd,
      },
      {
        key: "phone",
        label: intl.formatMessage({ id: "registerExpat.checklist.phone" }),
        ok: valid.phone,
        ref: refPhone,
      },
      {
        key: "currentCountry",
        label: intl.formatMessage({
          id: "registerExpat.checklist.countryOfResidence",
        }),
        ok: valid.currentCountry,
        ref: refCountry,
      },
      {
        key: "currentPresenceCountry",
        label: intl.formatMessage({
          id: "registerExpat.checklist.presenceCountry",
        }),
        ok: valid.currentPresenceCountry,
        ref: refPresence,
      },
      {
        key: "interventionCountry",
        label: intl.formatMessage({
          id: "registerExpat.checklist.mainInterventionCountry",
        }),
        ok: valid.interventionCountry,
        ref: refInterv,
      },
      {
        key: "languages",
        label: intl.formatMessage({
          id: "registerExpat.checklist.atLeastOneLanguage",
        }),
        ok: valid.languages,
        ref: refLangs,
      },
      {
        key: "helpTypes",
        label: intl.formatMessage({
          id: "registerExpat.checklist.atLeastOneSpecialty",
        }),
        ok: valid.helpTypes,
        ref: refHelp,
      },
      {
        key: "profilePhoto",
        label: intl.formatMessage({
          id: "registerExpat.checklist.profilePhoto",
        }),
        ok: valid.profilePhoto,
        ref: refPhoto,
      },
      {
        key: "bio",
        label: intl.formatMessage({ id: "registerExpat.checklist.bio" }),
        ok: valid.bio,
        ref: refBio,
      },
      {
        key: "yearsAsExpat",
        label: intl.formatMessage({
          id: "registerExpat.checklist.yearsAbroad",
        }),
        ok: valid.yearsAsExpat,
        ref: refYears,
      },
      {
        key: "acceptTerms",
        label: intl.formatMessage({
          id: "registerExpat.checklist.acceptTerms",
        }),
        ok: valid.acceptTerms,
        ref: refCGU,
      },
    ],
    [valid, intl]
  );

  useEffect(() => {
    console.log("🔍 VALIDATION DEBUG");
    console.log("━".repeat(60));

    const validationChecks = {
      Email: valid.email,
      Password: valid.password,
      "First Name": valid.firstName,
      "Last Name": valid.lastName,
      "Accept Terms": valid.acceptTerms,
      Bio: valid.bio,
      "Profile Photo": valid.profilePhoto,
      Languages: valid.languages,
      "Help Types": valid.helpTypes,
      "Current Country": valid.currentCountry,
      "Current Presence Country": valid.currentPresenceCountry,
      "Intervention Country": valid.interventionCountry,
      "Years as Expat": valid.yearsAsExpat,
      Phone: valid.phone,
    };

    console.log("📋 FIELD VALIDATIONS:");
    Object.entries(validationChecks).forEach(([field, isValid]) => {
      if (!isValid) {
        console.log(`  ❌ ${field}: INVALID`);
      } else {
        console.log(`  ✅ ${field}: VALID`);
      }
    });

    if (Object.keys(fieldErrors).length > 0) {
      console.log("\n⚠️  FIELD ERRORS:", fieldErrors);
    }

    console.log("\n🎯 CAN SUBMIT:", canSubmit);
    console.log("━".repeat(60));
  }, [valid, fieldErrors, isLoading, isSubmitting, canSubmit]);

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
            name: intl.formatMessage({ id: "registerExpat.meta.title" }),
            description: intl.formatMessage({
              id: "registerExpat.meta.description",
            }),
            inLanguage: lang === "en" ? "en-US" : "fr-FR",
            publisher: { "@type": "Organization", name: "SOS Expats" },
          }),
        }}
      />

      <div className="min-h-screen bg-[linear-gradient(180deg,#f7fff9_0%,#ffffff_35%,#f0fff7_100%)]">
        {/* Hero */}
        {/* <header className="pt-6 sm:pt-8 text-center">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-gray-900">
            <span
              className={`bg-gradient-to-r ${THEME.gradFrom} ${THEME.gradTo} bg-clip-text text-transparent`}
            >
              {t.heroTitle}
            </span>
          </h1>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-700 px-4">
            {t.heroSubtitle}
          </p>
          <div className="mt-3 inline-flex items-center gap-2">
            <span className="text-xs sm:text-sm px-3 py-1 rounded-full bg-white border shadow-sm">
              24/7
            </span>
            <span className="text-xs sm:text-sm px-3 py-1 rounded-full bg-white border shadow-sm">
              {lang === "en" ? "Multilingual" : "Multilingue"}
            </span>
          </div>
          <div className="mt-3 text-xs sm:text-sm text-gray-600">
            {t.already}{" "}
            <Link
              to={`/login?redirect=${encodeURIComponent(redirect)}`}
              className="font-semibold text-emerald-700 underline decoration-2 underline-offset-2 hover:text-emerald-800"
            >
              {t.login}
            </Link>
          </div>
        </header> */}

        <header className="pt-6 sm:pt-8 text-center">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-gray-900">
            <span
              className={`bg-gradient-to-r ${THEME.gradFrom} ${THEME.gradTo} bg-clip-text text-transparent`}
            >
              {/* <FormattedMessage id="registerExpat.heroTitle" /> */}
              <FormattedMessage id="registerExpat.ui.heroTitle" />
            </span>
          </h1>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-700 px-4">
            <FormattedMessage id="registerExpat.ui.heroTitle" />
          </p>
          <div className="mt-3 inline-flex items-center gap-2">
            <span className="text-xs sm:text-sm px-3 py-1 rounded-full bg-white border shadow-sm">
              24/7
            </span>
            <span className="text-xs sm:text-sm px-3 py-1 rounded-full bg-white border shadow-sm">
              <FormattedMessage id="registerExpat.ui.badgeMultilingual" />
            </span>
          </div>
          <div className="mt-3 text-xs sm:text-sm text-gray-600">
            <FormattedMessage id="registerExpat.ui.already" />{" "}
            <Link
              to={`/login?redirect=${encodeURIComponent(redirect)}`}
              className="font-semibold text-emerald-700 underline decoration-2 underline-offset-2 hover:text-emerald-800"
            >
              <FormattedMessage id="registerExpat.ui.login" />
            </Link>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
          {/* {(error || formError) && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                <div className="text-sm text-red-700">
                  <div className="font-semibold mb-0.5">{t.errors.title}</div>
                  <div>{error || formError}</div>
                </div>
              </div>
            </div>
          )} */}

          {(error || formError) && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                <div className="text-sm text-red-700">
                  <div className="font-semibold mb-0.5">
                    <FormattedMessage id="registerExpat.errors.title" />
                  </div>
                  <div>{error || formError}</div>
                </div>
              </div>
            </div>
          )}

          {/* Progress */}
          {/* <div className="mb-6 max-w-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-700">
                {t.progress}
              </span>
              <span className="text-sm font-bold text-emerald-600">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div> */}

          <div className="mb-6 max-w-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-700">
                <FormattedMessage id="registerExpat.ui.progress" />
              </span>
              <span className="text-sm font-bold text-emerald-600">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Layout */}
          <div className="lg:grid lg:grid-cols-3 lg:gap-6">
            {/* Mobile preview toggle */}
            <div className="mb-4 lg:hidden">
              {/* <button
                type="button"
                onClick={() => setIsPreviewOpen((s) => !s)}
                className="w-full text-sm font-semibold px-4 py-2 rounded-xl border border-emerald-200 bg-white shadow-sm"
              >
                {isPreviewOpen ? t.previewToggleOpen : t.previewToggleClose}
              </button> */}
              <button
                type="button"
                onClick={() => setIsPreviewOpen((s) => !s)}
                className="w-full text-sm font-semibold px-4 py-2 rounded-xl border border-emerald-200 bg-white shadow-sm"
              >
                {isPreviewOpen ? (
                  <FormattedMessage id="registerExpat.previewToggleOpen" />
                ) : (
                  <FormattedMessage id="registerExpat.previewToggleClose" />
                )}
              </button>
            </div>

            {/* PREVIEW */}
            <aside
              className={`${isPreviewOpen ? "block" : "hidden"} lg:block lg:col-span-1 lg:order-last lg:sticky lg:top-6 mb-6`}
            >
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                {/* {t.previewTitle} */}
                {intl.formatMessage({ id: "registerExpat.preview.title" })}
              </h3>
              <PreviewCard
                lang={lang}
                t={t}
                progress={progress}
                fullName={`${form.firstName || (lang === "en" ? "First" : "Prénom")} ${form.lastName || (lang === "en" ? "Last" : "Nom")}`.trim()}
                photo={form.profilePhoto}
                currentCountry={form.currentCountry}
                presenceCountry={form.currentPresenceCountry}
                interventionCountry={form.interventionCountry}
                yearsAsExpat={form.yearsAsExpat}
                languages={(selectedLanguages as LanguageOption[]).map(
                  (l) => l.value
                )}
                helpTypes={form.helpTypes}
              />
            </aside>

            {/* FORM */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 text-black">
                <form onSubmit={handleSubmit} noValidate>
                  {/* Step 1: Personal */}
                  <section className="p-5 sm:p-6">
                    <SectionHeader
                      icon={<Users className="w-5 h-5" />}
                      // title={t.personalInfo}
                      title={intl.formatMessage({
                        id: "registerExpat.ui.personalInfo",
                      })}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* First name */}
                      <div ref={refFirstName}>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">
                          <FormattedMessage id="registerExpat.fields.firstName" />{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="firstName"
                          autoComplete="given-name"
                          value={form.firstName}
                          onChange={onChange}
                          className={`w-full px-4 py-3 border-2 rounded-xl bg-gray-50 hover:bg-white ${THEME.ring} focus:bg-white transition ${fieldErrors.firstName ? "border-red-500 bg-red-50" : valid.firstName ? "border-green-300 bg-green-50" : "border-gray-200"}`}
                          // placeholder={t.help.firstNamePlaceholder}
                          placeholder={intl.formatMessage({
                            id: "registerExpat.help.firstNamePlaceholder",
                          })}
                        />
                        <FieldSuccess show={valid.firstName}>
                          {/* {lang === "en" ? "Perfect! ✨" : "Parfait ! ✨"} */}
                          {intl.formatMessage({
                            id: "registerExpat.success.fieldValid",
                          })}
                        </FieldSuccess>
                      </div>

                      {/* Last name */}
                      <div ref={refLastName}>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">
                          {/* {t.lastName} */}
                          <FormattedMessage id="registerExpat.fields.lastName" />
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="lastName"
                          autoComplete="family-name"
                          value={form.lastName}
                          onChange={onChange}
                          className={`w-full px-4 py-3 border-2 rounded-xl bg-gray-50 hover:bg-white ${THEME.ring} focus:bg-white transition ${fieldErrors.lastName ? "border-red-500 bg-red-50" : valid.lastName ? "border-green-300 bg-green-50" : "border-gray-200"}`}
                        placeholder={
  lang === "en"
    ? "Doe"
    : lang === "es"
    ? "García"
    : lang === "fr"
    ? "Dupont"
    : lang === "de"
    ? "Müller"
    : lang === "ru"
    ? "Смирнов"
    : lang === "hi"
    ? "शर्मा"
    : lang === "ch"
    ? "王"
    : lang === "ar"
    ? "محمد"
    : lang === "pt"
    ? "Silva"
    : "Doe"
}

                        />
                        <FieldSuccess show={valid.lastName}>
                          {/* {lang === "en" ? "Perfect! ✨" : "Parfait ! ✨"} */}
                          <FormattedMessage id="registerExpat.success.fieldValid" />
                        </FieldSuccess>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="mt-4" ref={refEmail}>
                      <label
                        htmlFor="email"
                        className="block text-sm font-semibold text-gray-800 mb-1"
                      >
                        <FormattedMessage id="registerExpat.fields.email" />
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail
                          className={`pointer-events-none w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 ${THEME.icon}`}
                        />
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          value={form.email}
                          onChange={onChange}
                          aria-describedby="email-help"
                          className={`w-full block z-[1] pl-11 pr-4 py-3 rounded-xl border-2 ${THEME.ring} focus:bg-white transition
                                      ${fieldErrors.email ? "!border-red-500 bg-red-50" : valid.email ? "!border-green-300 bg-green-50" : "!border-gray-300"}`}
                        
                          placeholder={intl.formatMessage({
                            id: "registerExpat.help.emailPlaceholder",
                          })}
                        />
                      </div>
                      <p id="email-help" className="mt-1 text-xs text-gray-500">
                      
                 {lang === "en"
  ? "We only email for your account & connections. 🤝"
  : lang === "es"
    ? "Solo enviamos correos para tu cuenta y conexiones. 🤝"
    : lang === "fr"
      ? "On vous écrit seulement pour le compte & les mises en relation. 🤝"
      : lang === "ru"
        ? "Мы отправляем письма только для вашего аккаунта и связей. 🤝"
        : lang === "de"
          ? "Wir senden E-Mails nur für Ihr Konto und Verbindungen. 🤝"
          : lang === "hi"
            ? "हम केवल आपके खाते और कनेक्शन के लिए ईमेल भेजते हैं। 🤝"
            : lang === "ch"
              ? "我们仅通过电子邮件与您联系和建立联系. 🤝"
              : lang === "pt"
                ? "Enviamos e-mails apenas para sua conta e conexões. 🤝"
                : lang === "ar"
                  ? "نرسل رسائل بريد إلكتروني فقط لحسابك واتصالاتك. 🤝"
                  : "We only email for your account & connections. 🤝"}
                      </p>
                      {fieldErrors.email && (
                        <p className="mt-1 text-sm text-red-600">
                          {fieldErrors.email}
                        </p>
                      )}
                      <FieldSuccess show={valid.email}>
                        
                        <FormattedMessage id="registerExpat.success.emailValid" />
                      </FieldSuccess>
                    </div>

                    {/* Password */}
                    <div className="mt-4" ref={refPwd}>
                      <label className="block text-sm font-semibold text-gray-800 mb-1">
                        <FormattedMessage id="registerExpat.fields.password" />
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock
                          className={`w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 ${THEME.icon}`}
                        />
                        <input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={onChange}
                          onKeyUp={(e) =>
                            setCapsPassword(e.getModifierState("CapsLock"))
                          }
                          autoComplete="new-password"
                          aria-describedby="pwd-meter"
                          className={`w-full pl-10 pr-12 py-3 border-2 rounded-xl bg-gray-50 hover:bg-white ${THEME.ring} focus:bg-white transition ${fieldErrors.password ? "border-red-500 bg-red-50" : valid.password ? "border-green-300 bg-green-50" : "border-gray-200"}`}
                    
                          placeholder={intl.formatMessage({
                            id: "registerExpat.help.minPassword",
                          })}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                          onClick={() => setShowPassword((s) => !s)}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <div id="pwd-meter" className="mt-2">
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-2 ${pwdStrength.color} transition-all`}
                            style={{ width: `${pwdStrength.percent}%` }}
                            aria-hidden
                          />
                        </div>
                        <div className="mt-1 text-xs flex items-center justify-between">
                          <span className="text-gray-600">
                         
                          {lang === "en"
  ? "Strength:"
  : lang === "es"
    ? "Calidad:"
    : lang === "fr"
      ? "Qualité :"
      : lang === "ru"
        ? "Надёжность:"
        : lang === "de"
          ? "Stärke:"
          : lang === "hi"
            ? "मजबूती:"
            : lang === "ch"
              ? "力量:"
              : lang === "pt"
                ? "Força:"
                : lang === "ar"
                  ? "القوة:"
                  : "Strength:"}{" "}
                            <strong>
                              {lang === "en"
                                ? pwdStrength.labelEn
                                : lang === "es"
                                  ? pwdStrength.labelEs
                                  : lang === "fr"
                                    ? pwdStrength.labelFr
                                    : lang === "ru"
                                      ? pwdStrength.labelRu
                                      : lang === "de"
                                        ? pwdStrength.labelDe
                                        : lang === "hi"
                                          ? pwdStrength.labelHi
                                          : lang === "ch"
                                            ? pwdStrength.labelCh
                                            : lang === "pt"
                                              ? pwdStrength.labelPt
                                              : lang === "ar"
                                                ? pwdStrength.labelAr

                                          : pwdStrength.labelEn}
                            </strong>
                          </span>
                          <span className="text-gray-500">
                            {lang === "en"
  ? "Tip: mix A-z, 0-9 & symbols"
  : lang === "es"
    ? "Consejo: mezcla A-z, 0-9 y símbolos"
    : lang === "fr"
      ? "Astuce : mixez A-z, 0-9 & symboles"
      : lang === "ru"
        ? "Совет: смешайте A-z, 0-9 и символы"
        : lang === "de"
          ? "Tipp: A-z, 0-9 & Symbole mischen"
          : lang === "hi"
            ? "सुझाव: A-z, 0-9 और चिह्न मिलाएं"
            : lang === "ch"
              ? "提示：混合使用 A-z、0-9 和符号"
              : lang === "pt"
                ? "Dica: misture A-z, 0-9 & símbolos"
                : lang === "ar"
                  ? "نصيحة: امزج A-z و 0-9 والرموز"
                  : "Tip: mix A-z, 0-9 & symbols"}
                          </span>
                        </div>
                        {capsPassword && (
                          <p className="text-xs text-orange-600 mt-1">
                            ↥{" "}
                            {lang === "en"
  ? "Caps Lock is ON"
  : lang === "es"
    ? "Bloq Mayús activado"
    : lang === "fr"
      ? "Verr. Maj activée"
      : lang === "ru"
        ? "Caps Lock включён"
        : lang === "de"
          ? "Feststelltaste ist AN"
          : lang === "hi"
            ? "Caps Lock चालू है"
            : lang === "ch"
              ? "大写锁定键已开启"
              : lang === "pt"
                ? "Caps Lock ATIVADO"
                : lang === "ar"
                  ? "مفتاح Caps Lock مُفعّل"
                  : "Caps Lock is ON"}
                          </p>
                        )}
                      </div>
                      <FieldSuccess show={valid.password}>
                        <FormattedMessage id="registerExpat.success.passwordValid" />
                      </FieldSuccess>
                    </div>

                    {/* Contact (Téléphone E.164) */}
                    {/* <div
                      className={`mt-5 rounded-xl border ${THEME.border} ${THEME.subtle} p-4`}
                      ref={refPhone}
                    >
                      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                        <PhoneIcon className={`w-4 h-4 mr-2 ${THEME.icon}`} />{" "}
                    
                        <FormattedMessage id="registerExpat.fields.phone" />
                      </h3>

                   
                      <PhoneField
                        name="phone"
                        control={control}
                        label={
                          lang === "en"
                            ? "Phone (international format)"
                            : "Téléphone (format international)"
                        }
                        required
                        defaultCountry="FR"
                        placeholder="+33612345678"
                      />

                      <FieldSuccess show={valid.phone}>
                      
                        <FormattedMessage id="registerExpat.success.phoneValid" />
                      </FieldSuccess>

                      <p className="mt-3 text-xs text-gray-600 flex items-center">
                        <Info className="w-3.5 h-3.5 mr-1" />
                        {lang === "en"
                          ? "We only use your phone to connect you with people who need help. No spam."
                          : "Votre numéro sert uniquement à des mises en relation. Aucun spam."}
                      </p>
                    </div> */}

                    {/* Contact Phone with Country Selector */}
                    <div
                      className="mt-5 rounded-xl border {THEME.border} {THEME.subtle} p-4"
                      ref={refPhone}
                    >
                      <label className="block text-sm font-semibold text-gray-800 mb-1">
                        <FormattedMessage id="registerExpat.fields.phone" />
                        <span className="text-red-500">*</span>
                      </label>

                      <IntlPhoneInput
                        value={form.phone}
                        onChange={(value) => {
                          setForm((prev) => ({ ...prev, phone: value || "" }));

                          if (value) {
                            try {
                              const parsed = parsePhoneNumberFromString(value);
                              if (parsed && parsed.isValid()) {
                                setFieldErrors((prev) => {
                                  const { phone, ...rest } = prev;
                                  return rest;
                                });
                              }
                            } catch {}
                          }
                        }}
                        defaultCountry="fr"
                        className={`w-full ${fieldErrors.phone ? "border-red-500 bg-red-50" : valid.phone ? "border-green-300 bg-green-50" : "border-gray-200"}`}
                        placeholder="+33 6 12 34 56 78"
                        name="phone"
                      />

                      {form.phone && (
                        <div className="mt-1 text-xs text-gray-500">
                          <FormattedMessage id="Format" />:
                          <span className="font-mono ml-1">{form.phone}</span>
                        </div>
                      )}

                      <FieldError show={form.phone && !valid.phone}>
                        <FormattedMessage id="registerExpat.errors.phoneInvalid" />
                      </FieldError>

                      <FieldSuccess show={valid.phone}>
                        <FormattedMessage id="registerExpat.success.phoneValid" />
                      </FieldSuccess>

                      <p className="mt-3 text-xs text-gray-600 flex items-center">
                        <Info className="w-3.5 h-3.5 mr-1" />
                        <FormattedMessage id="registerExpat.help.contactInfo" />
                      </p>
                    </div>
                  </section>

                  {/* Step 2: Geographic & Experience */}
                  <section className="p-5 sm:p-6 border-t border-gray-50">
                    <SectionHeader
                      icon={<Globe className="w-5 h-5" />}
                      // title={t.geoInfo}
                      title={intl.formatMessage({
                        id: "registerExpat.ui.geoInfo",
                      })}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div ref={refCountry}>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">
                          {/* {t.residenceCountry}{" "} */}
                          <FormattedMessage id="registerExpat.fields.residenceCountry" />
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="currentCountry"
                          value={form.currentCountry}
                          onChange={onChange}
                          className={`w-full px-4 py-3 border-2 rounded-xl bg-white ${THEME.ring} ${fieldErrors.currentCountry ? "border-red-500" : valid.currentCountry ? "border-green-300 bg-green-50" : "border-gray-200"}`}
                        >
                          <option value="">
                            {/* {lang === "en"
                              ? "Select your country"
                              : "Sélectionnez votre pays"} */}
                            {intl.formatMessage({
                              id: "registerExpat.select.selectCountry",
                            })}
                          </option>
                          {countryOptions.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <FieldSuccess show={valid.currentCountry}>
                          {/* {lang === "en" ? "Perfect! ✨" : "Parfait ! ✨"} */}
                          <FormattedMessage id="registerExpat.success.fieldValid" />
                        </FieldSuccess>
                      </div>

                      <div ref={refPresence}>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">
                          {/* {t.presenceCountry}{" "} */}
                          <FormattedMessage id="registerExpat.fields.presenceCountry" />
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="currentPresenceCountry"
                          value={form.currentPresenceCountry}
                          onChange={onChange}
                          className={`w-full px-4 py-3 border-2 rounded-xl bg-white ${THEME.ring} ${fieldErrors.currentPresenceCountry ? "border-red-500" : valid.currentPresenceCountry ? "border-green-300 bg-green-50" : "border-gray-200"}`}
                        >
                          <option value="">
                          {lang === "en"
  ? "Select your presence country"
  : lang === "es"
    ? "Selecciona tu país de presencia"
    : lang === "fr"
      ? "Sélectionnez votre pays de présence"
      : lang === "ru"
        ? "Выберите страну вашего присутствия"
        : lang === "de"
          ? "Wählen Sie Ihr Präsenzland"
          : lang === "hi"
            ? "अपने उपस्थिति देश का चयन करें"
            : lang === "ch"
              ? "选择您所在的国家/地区"
              : lang === "pt"
                ? "Selecione seu país de presença"
                : lang === "ar"
                  ? "اختر بلد تواجدك"
                  : "Select your presence country"}
                          </option>
                          {countryOptions.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <FieldSuccess show={valid.currentPresenceCountry}>
                          {/* {lang === "en" ? "Perfect! ✨" : "Parfait ! ✨"} */}
                          <FormattedMessage id="registerExpat.success.fieldValid" />
                        </FieldSuccess>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div ref={refInterv}>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">
                          <FormattedMessage id="registerExpat.fields.interventionCountry" />{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="interventionCountry"
                          value={form.interventionCountry}
                          onChange={onChange}
                          className={`w-full px-4 py-3 border-2 rounded-xl bg-white ${THEME.ring} ${fieldErrors.interventionCountry ? "border-red-500" : valid.interventionCountry ? "border-green-300 bg-green-50" : "border-gray-200"}`}
                        >
                          <option value="">
                          {lang === "en"
  ? "Select your intervention country"
  : lang === "es"
    ? "Selecciona tu país de intervención"
    : lang === "fr"
      ? "Sélectionnez votre pays d'intervention"
      : lang === "ru"
        ? "Выберите страну вашего вмешательства"
        : lang === "de"
          ? "Wählen Sie Ihr Interventionsland"
          : lang === "hi"
            ? "अपने हस्तक्षेप देश का चयन करें"
            : lang === "ch"
              ? "选择您的干预国家"
              : lang === "pt"
                ? "Selecione seu país de intervenção"
                : lang === "ar"
                  ? "اختر بلد تدخلك"
                  : "Select your intervention country"}
                          </option>
                          {countryOptions.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <FieldSuccess show={valid.interventionCountry}>
                         
                          <FormattedMessage id="registerExpat.success.fieldValid" />
                        </FieldSuccess>
                      </div>

                      <div ref={refYears}>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">
                      
                          <FormattedMessage id="registerExpat.fields.yearsAsExpat" />
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="yearsAsExpat"
                          type="number"
                          min={1}
                          max={60}
                          value={form.yearsAsExpat || ""}
                          onChange={onChange}
                          className={`w-full px-4 py-3 border-2 rounded-xl bg-gray-50 hover:bg-white ${THEME.ring} ${fieldErrors.yearsAsExpat ? "border-red-500 bg-red-50" : valid.yearsAsExpat ? "border-green-300 bg-green-50" : "border-gray-200"}`}
                          placeholder="5"
                        />
                        <FieldSuccess show={valid.yearsAsExpat}>
                        
                          <FormattedMessage id="registerExpat.success.fieldValid" />
                        </FieldSuccess>
                      </div>
                    </div>

                    {/* Languages */}
                    <div
                      className={`mt-4 rounded-xl border ${THEME.border} p-4 ${THEME.subtle}`}
                      ref={refLangs}
                    >
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        <FormattedMessage id="registerExpat.fields.languages" />{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      {(selectedLanguages as LanguageOption[]).length > 0 && (
                        <div className="mb-2 text-xs text-gray-700">
                          <span className="font-medium">
                            <FormattedMessage id="registerExpat.fields.selectedLanguages" />
                            :
                          </span>{" "}
                          {(selectedLanguages as LanguageOption[])
                            .map((l) => l.value.toUpperCase())
                            .join(", ")}
                        </div>
                      )}

                      <Suspense
                        fallback={
                          <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
                        }
                      >
                        <MultiLanguageSelect
                          value={selectedLanguages}
                          onChange={(v: MultiValue<LanguageOption>) => {
                            setSelectedLanguages(v);
                            if (fieldErrors.languages) {
                              setFieldErrors((prev) => {
                                const rest = { ...prev };
                                delete rest.languages;
                                return rest;
                              });
                            }
                          }}
                          locale={lang}
                      

                          placeholder={
                           lang === "en"
  ? "Search and select languages..."
  : lang === "es"
    ? "Buscar y seleccionar idiomas..."
    : lang === "fr"
      ? "Rechercher et sélectionner les langues..."
      : lang === "ru"
        ? "Поиск и выбор языков..."
        : lang === "de"
          ? "Sprachen suchen und auswählen..."
          : lang === "hi"
            ? "भाषाओं को खोजें और चुनें..."
            : lang === "ch"
              ? "搜索并选择语言……"
              : lang === "pt"
                ? "Pesquisar e selecionar idiomas..."
                : lang === "ar"
                  ? "البحث واختيار اللغات..."
                  : "Search and select languages..."
                          }
                        />
                      </Suspense>

                      {fieldErrors.languages && (
                        <p className="text-sm text-red-600 mt-2">
                          {fieldErrors.languages}
                        </p>
                      )}
                      <FieldSuccess show={valid.languages}>
                        {/* {lang === "en" ? "Perfect! ✨" : "Parfait ! ✨"} */}
                        <FormattedMessage id="registerExpat.success.fieldValid" />
                      </FieldSuccess>
                    </div>

                    {/* Bio */}
                    <div className="mt-4" ref={refBio}>
                      <label className="block text-sm font-semibold text-gray-800 mb-1">
                        <FormattedMessage id="registerExpat.fields.bio" />
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="bio"
                        rows={5}
                        maxLength={500}
                        value={form.bio}
                        onChange={onChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl bg-gray-50 hover:bg-white ${THEME.ring} min-h-[120px] ${fieldErrors.bio ? "border-red-500 bg-red-50" : valid.bio ? "border-green-300 bg-green-50" : "border-gray-200"}`}
                        // placeholder={
                        //   lang === "en"
                        //     ? "In a few lines, share your journey + how you help (friendly + specific)."
                        //     : "En quelques lignes, racontez votre parcours + comment vous aidez (sympa & concret)."
                        // }

                        placeholder={
                         lang === "en"
  ? "In a few lines, share your journey + how you help (friendly + specific)."
  : lang === "es"
    ? "En pocas líneas, comparte tu trayecto + cómo ayudas (amigable y específico)."
    : lang === "fr"
      ? "En quelques lignes, racontez votre parcours + comment vous aidez (sympa & concret)."
      : lang === "ru"
        ? "В несколько строк расскажите о вашем пути + как вы помогаете (дружелюбно и конкретно)."
        : lang === "de"
          ? "Erzählen Sie in wenigen Zeilen Ihre Geschichte + wie Sie helfen (freundlich & konkret)."
          : lang === "hi"
            ? "कुछ पंक्तियों में, अपनी यात्रा साझा करें + आप कैसे मदद करते हैं (मित्रवत + विशिष्ट)।"
            : lang === "ch"
              ? "请用几句话分享您的经历以及您如何提供帮助（友好且具体）。"
              : lang === "pt"
                ? "Em poucas linhas, compartilhe sua jornada + como você ajuda (amigável + específico)."
                : lang === "ar"
                  ? "في عدة أسطر، شارك رحلتك + كيف تساعد (ودود + محدد)."
                  : "In a few lines, share your journey + how you help (friendly + specific)."

                        }
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
                            {form.bio.length < 50 ? (
                           
                              <FormattedMessage
                                id="registerExpat.bio.charsToGo"
                                values={{ count: 50 - form.bio.length }}
                              />
                            ) : (
                              <FormattedMessage id="registerExpat.bio.fieldValidated" />
                            )}
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
                      
                          <FormattedMessage id="registerExpat.help.bioHint" />
                        </p>
                      </div>
                    </div>

                    {/* Photo */}
                    <div
                      className={`mt-4 rounded-xl border ${THEME.border} p-4 ${THEME.subtle}`}
                      ref={refPhoto}
                    >
                      <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                        <Camera className={`w-4 h-4 mr-2 ${THEME.icon}`} />{" "}
                     
                        <FormattedMessage id="registerExpat.fields.profilePhoto" />{" "}
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
                            setTimeout(() => {
                              scrollToFirstIncomplete();
                            }, 150);
                          }}
                          hideNativeFileLabel
                          cropShape="round"
                          outputSize={512}
                          uploadPath="registration_temp"
                          isRegistration={true}
                        />
                      </Suspense>
                      {fieldErrors.profilePhoto && (
                        <p className="text-sm text-red-600 mt-2">
                          {fieldErrors.profilePhoto}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                      {lang === "en"
  ? "Professional photo (JPG/PNG) required"
  : lang === "es"
    ? "Foto profesional (JPG/PNG) requerida"
    : lang === "fr"
      ? "Photo professionnelle (JPG/PNG) obligatoire"
      : lang === "ru"
        ? "Требуется профессиональное фото (JPG/PNG)"
        : lang === "de"
          ? "Professionelles Foto (JPG/PNG) erforderlich"
          : lang === "hi"
            ? "पेशेवर फोटो (JPG/PNG) आवश्यक है"
            : lang === "ch"
              ? "需要专业照片（JPG/PNG格式）。"
              : lang === "pt"
                ? "Foto profissional (JPG/PNG) obrigatória"
                : lang === "ar"
                  ? "صورة احترافية (JPG/PNG) مطلوبة"
                  : "Professional photo (JPG/PNG) required"}

                      </p>
                      <FieldSuccess show={valid.profilePhoto}>
                        {/* {lang === "en" ? "Nice photo! 📸" : "Belle photo ! 📸"} */}
                        <FormattedMessage id="registerExpat.success.photoValid" />
                      </FieldSuccess>
                    </div>
                  </section>

                  {/* Step 3: Help domains */}
                  <section
                    className="p-5 sm:p-6 border-t border-gray-50"
                    ref={refHelp}
                  >
                    <SectionHeader
                      icon={<CheckCircle className="w-5 h-5" />}
                   
                      title={intl.formatMessage({
                        id: "registerExpat.ui.helpInfo",
                      })}
                    />
                    <div
                      className={`rounded-xl border ${THEME.border} p-4 ${THEME.subtle}`}
                    >
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        <FormattedMessage id="registerExpat.fields.helpDomains" />{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <TagSelector
                        items={form.helpTypes}
                        onRemove={removeHelp}
                      />
                      <select
                        onChange={onHelpSelect}
                        value=""
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:border-green-600"
                      >
                        <option value="">
                     
                          {intl.formatMessage({
                            id: "registerExpat.fields.addHelp",
                          })}
                        </option>
                        {helpTypeOptions.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.helpTypes && (
                        <p className="text-sm text-red-600 mt-2">
                          {fieldErrors.helpTypes}
                        </p>
                      )}

                      {showCustomHelp && (
                        <div className="flex gap-2 mt-3">
                          <input
                            value={form.customHelpType}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                customHelpType: e.target.value,
                              }))
                            }
                            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl"
                       
                            placeholder={intl.formatMessage({
                              id: "registerExpat.fields.specifyHelp",
                            })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addCustomHelp();
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={addCustomHelp}
                            disabled={!form.customHelpType.trim()}
                            className="px-4 py-3 rounded-xl bg-green-600 text-white font-semibold disabled:opacity-60"
                          >
                            OK
                          </button>
                        </div>
                      )}

                      <FieldSuccess show={valid.helpTypes}>
                    
                        <FormattedMessage id="registerExpat.success.fieldValid" />
                      </FieldSuccess>
                    </div>
                  </section>

                  {/* Terms + Submit */}
                  <section
                    className={`p-5 sm:p-6 border-t border-gray-50 bg-gradient-to-br ${THEME.gradFrom} ${THEME.gradTo}`}
                  >
                    <div
                      className="bg-white rounded-xl p-4 sm:p-5 shadow-md"
                      ref={refCGU}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="acceptTerms"
                          checked={form.acceptTerms}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              acceptTerms: e.target.checked,
                            }))
                          }
                          className="h-5 w-5 text-emerald-600 border-gray-300 rounded mt-0.5"
                          required
                        />
                        <label
                          htmlFor="acceptTerms"
                          className="text-sm text-gray-800"
                        >
                   
                  {lang === "en"
  ? "I accept the"
  : lang === "es"
    ? "Acepto los"
    : lang === "fr"
      ? "J'accepte les"
      : lang === "ru"
        ? "Я принимаю"
        : lang === "de"
          ? "Ich akzeptiere die"
          : lang === "hi"
            ? "मैं स्वीकार करता हूँ"
            : lang === "ch"
              ? "我接受"
              : lang === "pt"
                ? "Aceito os"
                : lang === "ar"
                  ? "أوافق على"
                  : "I accept the"}{" "}
                          <Link
                            to="/cgu-expatries"
                            className="text-emerald-700 underline font-semibold"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                          
                         {lang === "en"
  ? "Expat T&Cs"
  : lang === "es"
    ? "Términos y Condiciones de Expat"
    : lang === "fr"
      ? "CGU Expatriés"
      : lang === "ru"
        ? "Условия использования для экспатов"
        : lang === "de"
          ? "Expat AGB"
          : lang === "hi"
            ? "एक्सपैट नियम और शर्तें"
            : lang === "ch"
              ? "外籍人士条款及细则"
              : lang === "pt"
                ? "T&C de Expats"
                : lang === "ar"
                  ? "شروط وأحكام المغتربين"
                  : "Expat T&Cs"}
                          </Link>{" "}
                          <span className="text-red-500">*</span>
                        </label>
                      </div>
                      {fieldErrors.acceptTerms && (
                        <p className="text-sm text-red-600 mt-2">
                          {fieldErrors.acceptTerms}
                        </p>
                      )}
                      <FieldSuccess show={valid.acceptTerms}>
                      
                        <FormattedMessage id="registerExpat.success.fieldValid" />
                      </FieldSuccess>
                    </div>

                    <div className="mt-4">
                      <Button
                        type="submit"
                        loading={isLoading || isSubmitting}
                        fullWidth
                        size="large"
                        className={`text-white font-black py-4 px-6 rounded-2xl text-base sm:text-lg w-full shadow-lg
                          ${canSubmit ? `bg-gradient-to-r ${THEME.button} hover:brightness-110` : "bg-gray-400 cursor-not-allowed opacity-60"}`}
                        disabled={!canSubmit}
                      >
                        {isLoading || isSubmitting ? (
                
                          <FormattedMessage id="registerExpat.ui.loading" />
                        ) : (
                          <span className="inline-flex items-center justify-center">
                            <ArrowRight className="w-5 h-5 mr-2" />
                        
                            <FormattedMessage id="registerExpat.ui.create" />
                          </span>
                        )}
                      </Button>
                      <p className="text-center text-xs text-white/90 mt-4">
                  
                        <FormattedMessage id="registerExpat.ui.secureNote" />
                      </p>
                    </div>
                  </section>
                </form>
              </div>

              {/* Checklist verte en bas */}
              <BottomChecklist
                items={checklist}
                progress={progress}
                lang={lang}
                onJump={(r) => {
                  const el = (r?.current as HTMLElement | null) || null;
                  if (el)
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              />

              {/* Footer */}
              <footer className="text-center mt-8">
                <div className="bg-white rounded-xl p-5 shadow border">
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-1">
                 
                    <FormattedMessage id="registerExpat.footer.title" />
                  </h3>
                  <p className="text-sm text-gray-700">
               

                    <FormattedMessage id="registerExpat.footer.text" />
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-gray-500">
                  <Link
                    to="/politique-confidentialite"
                    className="hover:text-emerald-700 underline"
                  >
               
                    <FormattedMessage id="registerExpat.footer.privacy" />
                  </Link>
                  <Link
                    to="/cgu-expatries"
                    className="hover:text-emerald-700 underline"
                  >
                
                    <FormattedMessage id="registerExpat.footer.cguLabel" />
                  </Link>
                  <Link
                    to="/centre-aide"
                    className="hover:text-emerald-700 underline"
                  >
                
                    <FormattedMessage id="registerExpat.footer.helpLink" />
                  </Link>
                  <Link
                    to="/contact"
                    className="hover:text-emerald-700 underline"
                  >
               
                    <FormattedMessage id="registerExpat.footer.contact" />
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

export default RegisterExpat;
