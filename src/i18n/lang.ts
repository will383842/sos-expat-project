// src/i18n/lang.ts
export type Lang = 'fr' | 'en' | 'es';

const STORAGE_KEY = 'app:lang';

function langFromNavigator(): Lang {
  if (typeof navigator === 'undefined') return 'fr';
  const langs = (navigator.languages ?? [navigator.language]).map(l => (l || '').toLowerCase());
  return langs.some(l => l.startsWith('fr')) ? 'fr' : 'en' ;
}

export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'fr' || saved === 'en' || saved === 'es') return saved;
  } catch {}
  return langFromNavigator();
}

export function setLang(lang: Lang): void {
  try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
}
