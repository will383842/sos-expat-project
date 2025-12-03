// Types pour les langues
export type SupportedLocale = 'fr' | 'en' | 'es' | 'ru' | 'de' | 'hi' | 'pt' | 'ch' | 'ar';

export interface Language {
  code: string;
  name: string; // legacy label (French)
  nativeName: string;
  labels: Partial<Record<SupportedLocale, string>>;
}

const buildLabels = (labels: Partial<Record<SupportedLocale, string>>): Partial<Record<SupportedLocale, string>> => labels;

// Données des langues parlées (codes alignés avec l'app : fr,en,es,de,ru,hi,pt,ch,ar)
export const languagesData: Language[] = [
  {
    code: 'fr',
    name: 'Français',
    nativeName: 'Français',
    labels: buildLabels({
      fr: 'Français',
      en: 'French',
      es: 'Francés',
      de: 'Französisch',
      ru: 'Французский',
      hi: 'फ़्रेंच',
      pt: 'Francês',
      ch: '法语',
      ar: 'الفرنسية',
    }),
  },
  {
    code: 'en',
    name: 'Anglais',
    nativeName: 'English',
    labels: buildLabels({
      fr: 'Anglais',
      en: 'English',
      es: 'Inglés',
      de: 'Englisch',
      ru: 'Английский',
      hi: 'अंग्रेज़ी',
      pt: 'Inglês',
      ch: '英语',
      ar: 'الإنجليزية',
    }),
  },
  {
    code: 'es',
    name: 'Espagnol',
    nativeName: 'Español',
    labels: buildLabels({
      fr: 'Espagnol',
      en: 'Spanish',
      es: 'Español',
      de: 'Spanisch',
      ru: 'Испанский',
      hi: 'स्पेनिश',
      pt: 'Espanhol',
      ch: '西班牙语',
      ar: 'الإسبانية',
    }),
  },
  {
    code: 'de',
    name: 'Allemand',
    nativeName: 'Deutsch',
    labels: buildLabels({
      fr: 'Allemand',
      en: 'German',
      es: 'Alemán',
      de: 'Deutsch',
      ru: 'Немецкий',
      hi: 'जर्मन',
      pt: 'Alemão',
      ch: '德语',
      ar: 'الألمانية',
    }),
  },
  {
    code: 'it',
    name: 'Italien',
    nativeName: 'Italiano',
    labels: buildLabels({
      fr: 'Italien',
      en: 'Italian',
      es: 'Italiano',
      de: 'Italienisch',
      ru: 'Итальянский',
      hi: 'इटालियन',
      pt: 'Italiano',
      ch: '意大利语',
      ar: 'الإيطالية',
    }),
  },
  {
    code: 'ru',
    name: 'Russe',
    nativeName: 'Русский',
    labels: buildLabels({
      fr: 'Russe',
      en: 'Russian',
      es: 'Ruso',
      de: 'Russisch',
      ru: 'Русский',
      hi: 'रूसी',
      pt: 'Russo',
      ch: '俄语',
      ar: 'الروسية',
    }),
  },
  {
    code: 'ja',
    name: 'Japonais',
    nativeName: '日本語',
    labels: buildLabels({
      fr: 'Japonais',
      en: 'Japanese',
      es: 'Japonés',
      de: 'Japanisch',
      ru: 'Японский',
      hi: 'जापानी',
      pt: 'Japonês',
      ch: '日语',
      ar: 'اليابانية',
    }),
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    labels: buildLabels({
      fr: 'Hindi',
      en: 'Hindi',
      es: 'Hindi',
      de: 'Hindi',
      ru: 'Хинди',
      hi: 'हिन्दी',
      pt: 'Hindi',
      ch: '印地语',
      ar: 'الهندية',
    }),
  },
  {
    code: 'pt',
    name: 'Portugais',
    nativeName: 'Português',
    labels: buildLabels({
      fr: 'Portugais',
      en: 'Portuguese',
      es: 'Portugués',
      de: 'Portugiesisch',
      ru: 'Португальский',
      hi: 'पुर्तगाली',
      pt: 'Português',
      ch: '葡萄牙语',
      ar: 'البرتغالية',
    }),
  },
  {
    code: 'ch', // Chinese language code used in the app
    name: 'Chinois',
    nativeName: '中文',
    labels: buildLabels({
      fr: 'Chinois',
      en: 'Chinese',
      es: 'Chino',
      de: 'Chinesisch',
      ru: 'Китайский',
      hi: 'चीनी',
      pt: 'Chinês',
      ch: '中文',
      ar: 'الصينية',
    }),
  },
  {
    code: 'ar',
    name: 'Arabe',
    nativeName: 'العربية',
    labels: buildLabels({
      fr: 'Arabe',
      en: 'Arabic',
      es: 'Árabe',
      de: 'Arabisch',
      ru: 'Арабский',
      hi: 'अरबी',
      pt: 'Árabe',
      ch: '阿拉伯语',
      ar: 'العربية',
    }),
  },
];

// export const languagesData: Language[] = [
//   { code: 'fr', name: 'French', nativeName: 'Français' },
//   { code: 'en', name: 'English', nativeName: 'English' },
//   { code: 'es', name: 'Spanish', nativeName: 'Español' },
//   { code: 'de', name: 'German', nativeName: 'Deutsch' },
//   { code: 'it', name: 'Italian', nativeName: 'Italiano' },
//   { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
//   { code: 'zh', name: 'Chinese', nativeName: '中文' },
//   { code: 'ja', name: 'Japanese', nativeName: '日本語' },
//   { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
//   { code: 'ru', name: 'Russian', nativeName: 'Русский' }
// ];

// Fonction pour détecter la langue du navigateur
export const getDetectedBrowserLanguage = (): SupportedLocale => {
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language.slice(0, 2).toLowerCase();
    const mapping: Record<string, SupportedLocale> = {
      fr: 'fr',
      en: 'en',
      es: 'es',
      de: 'de',
      ru: 'ru',
      hi: 'hi',
      pt: 'pt',
      ar: 'ar',
      zh: 'ch',
      ch: 'ch',
    };
    return mapping[browserLang] || 'fr';
  }
  return 'fr';
};

export const getLanguageLabel = (
  language: Language,
  locale: SupportedLocale = 'fr'
): string => {
  return (
    language.labels?.[locale] ??
    language.nativeName ??
    language.name
  );
};

// Fonction de recherche de langues
export const searchLanguages = (query: string): Language[] => {
  const q = query.toLowerCase();
  return languagesData.filter(lang => {
    const labelMatches = Object.values(lang.labels ?? {}).some(label =>
      label?.toLowerCase().includes(q)
    );
    return (
      lang.name.toLowerCase().includes(q) ||
      lang.nativeName.toLowerCase().includes(q) ||
      lang.code.toLowerCase().includes(q) ||
      labelMatches
    );
  });
};

// Fonction pour trier les langues
export const getSortedLanguages = (
  languages: Language[],
  locale: SupportedLocale = 'fr'
): Language[] => {
  return [...languages].sort((a, b) =>
    getLanguageLabel(a, locale).localeCompare(
      getLanguageLabel(b, locale),
      locale === 'ch' ? 'zh-CN' : locale
    )
  );
};

export default languagesData;
