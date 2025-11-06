// Types pour les langues
export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

// Données des langues parlées
export const languagesData: Language[] = [
  { code: 'fr', name: 'Français', nativeName: 'Français' },
  { code: 'en', name: 'Anglais', nativeName: 'English' },
  { code: 'es', name: 'Espagnol', nativeName: 'Español' },
  { code: 'de', name: 'Allemand', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italien', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portugais', nativeName: 'Português' },
  { code: 'zh', name: 'Chinois', nativeName: '中文' },
  { code: 'ja', name: 'Japonais', nativeName: '日本語' },
  { code: 'ar', name: 'Arabe', nativeName: 'العربية' },
  { code: 'ru', name: 'Russe', nativeName: 'Русский' }
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
export const getDetectedBrowserLanguage = (): string => {
  if (typeof navigator !== 'undefined') {
    return navigator.language.startsWith('fr') ? 'fr' : 'en';
  }
  return 'fr';
};

// Fonction de recherche de langues
export const searchLanguages = (query: string): Language[] => {
  const q = query.toLowerCase();
  return languagesData.filter(lang => 
    lang.name.toLowerCase().includes(q) ||
    lang.nativeName.toLowerCase().includes(q) ||
    lang.code.toLowerCase().includes(q)
  );
};

// Fonction pour trier les langues
export const getSortedLanguages = (languages: Language[]): Language[] => {
  return [...languages].sort((a, b) => a.name.localeCompare(b.name));
};

export default languagesData;
