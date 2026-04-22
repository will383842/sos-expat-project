// P0-C test harness : réplique minimale de handleLegacyLPRedirect pour
// tester la couverture 9 langues + non-régression profils + idempotency.
// Supprimer après validation ou garder en regression suite.

const LEGACY_LP_CANONICAL = {
  fr: { help: 'centre-aide',      articles: 'articles',  directory: 'annuaire',    pricing: 'tarifs',  country: 'pays' },
  en: { help: 'help-center',      articles: 'articles',  directory: 'directory',   pricing: 'pricing', country: 'country' },
  es: { help: 'centro-ayuda',     articles: 'articulos', directory: 'directorio',  pricing: null,      country: 'pais' },
  de: { help: 'hilfezentrum',     articles: 'artikel',   directory: 'verzeichnis', pricing: null,      country: 'land' },
  pt: { help: 'centro-ajuda',     articles: 'artigos',   directory: 'diretorio',   pricing: null,      country: 'pais' },
  ru: { help: 'tsentr-pomoshchi', articles: 'stati',     directory: 'spravochnik', pricing: null,      country: 'strana' },
  zh: { help: 'bangzhu-zhongxin', articles: 'wenzhang',  directory: 'minglu',      pricing: null,      country: 'guojia' },
  hi: { help: 'sahayata-kendra',  articles: 'lekh',      directory: 'nirdeshika',  pricing: null,      country: 'desh' },
  ar: { help: null,               articles: 'maqalat',   directory: 'dalil',       pricing: null,      country: 'balad' },
};

const LEGACY_SEGMENT_ALIAS = {
  'help': 'help', 'aide': 'help', 'ayuda': 'help', 'hilfe': 'help',
  'ajuda': 'help', 'pomoshch': 'help', 'bangzhu': 'help',
  'madad': 'help', 'musaada': 'help',
  'blog': 'articles', 'news': 'articles', 'guides': 'articles',
  'actualites': 'articles', 'nouvelles': 'articles',
  'expatries': 'directory', 'expats': 'directory',
  'consulter-avocat': 'pricing', 'sos-avocat': 'pricing',
  'consult-lawyer': 'pricing', 'sos-lawyer': 'pricing',
};

function resolve(pathname) {
  const m = pathname.match(/^\/([a-z]{2})-([a-z]{2})\/([^\/]+)(\/.*)?$/i);
  if (!m) return null;
  const lang = m[1].toLowerCase();
  const country = m[2].toLowerCase();
  const segment = m[3].toLowerCase();
  const rest = m[4] || '';
  const locale = `${lang}-${country}`;
  const canonicalLang = lang === 'ch' ? 'zh' : lang;
  const canon = LEGACY_LP_CANONICAL[canonicalLang];
  if (!canon) return null;
  if (segment === 'country' && rest && canonicalLang !== 'en') {
    const c = canon.country;
    if (c && c !== 'country') return `/${locale}/${c}${rest}`;
  }
  const sosLawyer = segment.match(/^(?:sos-avocat-|sos-lawyer-)(.+)$/);
  if (sosLawyer) {
    if (canon.directory) return `/${locale}/${canon.directory}/${sosLawyer[1]}`;
  }
  const bareLawyer = segment.match(/^(?:avocat-|lawyer-)(.+)$/);
  if (bareLawyer && !rest) {
    if (canon.directory) return `/${locale}/${canon.directory}/${bareLawyer[1]}`;
  }
  const aliasKey = LEGACY_SEGMENT_ALIAS[segment];
  if (aliasKey) {
    const canonSlug = canon[aliasKey];
    if (canonSlug && canonSlug !== segment) return `/${locale}/${canonSlug}${rest}`;
  }
  return null;
}

const tests = [
  // 9 langues × blog → articles localisé
  ['/fr-fr/blog', '/fr-fr/articles'],
  ['/en-us/blog', '/en-us/articles'],
  ['/es-es/blog', '/es-es/articulos'],
  ['/de-de/blog', '/de-de/artikel'],
  ['/pt-pt/blog', '/pt-pt/artigos'],
  ['/ru-ru/blog', '/ru-ru/stati'],
  ['/zh-cn/blog', '/zh-cn/wenzhang'],
  ['/ar-sa/blog', '/ar-sa/maqalat'],
  ['/hi-in/blog', '/hi-in/lekh'],
  ['/fr-fr/news', '/fr-fr/articles'],
  ['/es-es/guides', '/es-es/articulos'],
  ['/ar-sa/news', '/ar-sa/maqalat'],
  // aide/help et équivalents
  ['/fr-fr/aide', '/fr-fr/centre-aide'],
  ['/fr-fr/help', '/fr-fr/centre-aide'],
  ['/en-us/help', '/en-us/help-center'],
  ['/en-us/aide', '/en-us/help-center'],
  ['/es-es/ayuda', '/es-es/centro-ayuda'],
  ['/de-de/hilfe', '/de-de/hilfezentrum'],
  ['/pt-pt/ajuda', '/pt-pt/centro-ajuda'],
  ['/ru-ru/pomoshch', '/ru-ru/tsentr-pomoshchi'],
  ['/zh-cn/bangzhu', '/zh-cn/bangzhu-zhongxin'],
  ['/hi-in/madad', '/hi-in/sahayata-kendra'],
  ['/ar-sa/musaada', null],
  ['/ar-sa/help', null],
  // country/{slug}
  ['/fr-fr/country/france', '/fr-fr/pays/france'],
  ['/es-es/country/spain', '/es-es/pais/spain'],
  ['/de-de/country/germany', '/de-de/land/germany'],
  ['/en-us/country/france', null],
  ['/zh-cn/country/china', '/zh-cn/guojia/china'],
  // LP consulter-avocat / sos-avocat / EN variantes
  ['/fr-fr/consulter-avocat', '/fr-fr/tarifs'],
  ['/fr-fr/sos-avocat', '/fr-fr/tarifs'],
  ['/en-us/consult-lawyer', '/en-us/pricing'],
  ['/en-us/sos-lawyer', '/en-us/pricing'],
  ['/es-es/consulter-avocat', null],
  // expatries / expats
  ['/fr-fr/expatries', '/fr-fr/annuaire'],
  ['/en-us/expats', '/en-us/directory'],
  // sos-avocat-{country} / avocat-{country}
  ['/fr-fr/sos-avocat-france', '/fr-fr/annuaire/france'],
  ['/fr-fr/sos-avocat-thailande', '/fr-fr/annuaire/thailande'],
  ['/fr-fr/avocat-france', '/fr-fr/annuaire/france'],
  ['/fr-fr/avocat-thailande', '/fr-fr/annuaire/thailande'],
  ['/en-us/sos-lawyer-thailand', '/en-us/directory/thailand'],
  ['/en-us/lawyer-thailand', '/en-us/directory/thailand'],
  // CRITIQUE : profils prestataires NE doivent PAS rediriger
  ['/fr-fr/avocat-thailande/julien-penal-fsx3c9', null],
  ['/en-us/lawyer-thailand/julien-criminal-fsx3c9', null],
  ['/fr-fr/avocat-belgique/marc-leroy-def456', null],
  // Idempotency : URLs canoniques ne doivent pas rediriger
  ['/fr-fr/articles', null],
  ['/fr-fr/tarifs', null],
  ['/fr-fr/annuaire', null],
  ['/fr-fr/centre-aide', null],
  ['/en-us/pricing', null],
  ['/en-us/help-center', null],
  ['/fr-fr/pays/france', null],
  // Non-LP paths
  ['/', null],
  ['/fr-fr', null],
  ['/en-us', null],
  ['/sitemap-index.xml', null],
  ['/robots.txt', null],
];

let pass = 0, fail = 0;
for (const [input, expected] of tests) {
  const got = resolve(input);
  const ok = got === expected;
  if (ok) pass++; else fail++;
  const mark = ok ? '[PASS]' : '[FAIL]';
  console.log(`${mark}  ${input}  ->  ${got === null ? 'null' : got}${ok ? '' : '   EXPECTED: ' + (expected === null ? 'null' : expected)}`);
}
console.log('---');
console.log(`${pass}/${pass + fail} tests passed`);
process.exit(fail > 0 ? 1 : 0);
