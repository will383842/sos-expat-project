/**
 * Adds missing static pages to public/sitemap-static.xml.
 *
 * Routes existed in App.tsx + ROUTE_TRANSLATIONS but were missing from the
 * static sitemap (last regenerated 2026-04-14). This script appends the
 * missing URL entries for: testimonials, press, privacy-policy, terms-*
 * across all 9 supported locales.
 *
 * Idempotent: skips pages already present (matched by canonical fr-fr URL).
 *
 * Usage: node scripts/add-missing-pages-to-sitemap.cjs
 */

const fs = require('fs');
const path = require('path');

const SITEMAP_PATH = path.join(__dirname, '..', 'public', 'sitemap-static.xml');
const SITE_URL = 'https://sos-expat.com';

// Locales: lang code → URL locale prefix
const LOCALES = {
  fr: 'fr-fr', en: 'en-us', es: 'es-es', de: 'de-de', pt: 'pt-pt',
  ru: 'ru-ru', zh: 'zh-cn', ar: 'ar-sa', hi: 'hi-in',
};

// Hreflang codes (BCP 47)
const HREFLANG = {
  fr: 'fr', en: 'en', es: 'es', de: 'de', pt: 'pt',
  ru: 'ru', zh: 'zh-Hans', ar: 'ar', hi: 'hi',
};

// Translated slugs per page
const PAGES = {
  'testimonials': {
    priority: '0.7', changefreq: 'weekly',
    slugs: { fr: 'temoignages', en: 'testimonials', es: 'testimonios', de: 'testimonials', pt: 'depoimentos', ru: 'otzyvy', zh: 'yonghu-pingjia', ar: 'al-shahdat', hi: 'prashansapatra' },
  },
  'press': {
    priority: '0.6', changefreq: 'monthly',
    slugs: { fr: 'presse', en: 'press', es: 'prensa', de: 'presse', pt: 'imprensa', ru: 'pressa', zh: 'xinwen', ar: 'sahafa', hi: 'press' },
  },
  'privacy-policy': {
    priority: '0.5', changefreq: 'yearly',
    slugs: { fr: 'politique-confidentialite', en: 'privacy-policy', es: 'politica-privacidad', de: 'datenschutzrichtlinie', pt: 'politica-privacidade', ru: 'politika-konfidentsialnosti', zh: 'yinsi-zhengce', ar: 'siyasat-al-khususiya', hi: 'gopaniyata-niti' },
  },
  'terms-clients': {
    priority: '0.4', changefreq: 'yearly',
    slugs: { fr: 'cgu-clients', en: 'terms-clients', es: 'terminos-clientes', de: 'agb-kunden', pt: 'termos-clientes', ru: 'usloviya-klienty', zh: 'tiaokuan-kehu', ar: 'shurut-al-umala', hi: 'shartein-grahak' },
  },
  'terms-lawyers': {
    priority: '0.4', changefreq: 'yearly',
    slugs: { fr: 'cgu-avocats', en: 'terms-lawyers', es: 'terminos-abogados', de: 'agb-anwaelte', pt: 'termos-advogados', ru: 'usloviya-advokaty', zh: 'tiaokuan-lushi', ar: 'shurut-al-muhamin', hi: 'shartein-vakil' },
  },
  'terms-expats': {
    priority: '0.4', changefreq: 'yearly',
    slugs: { fr: 'cgu-expatries', en: 'terms-expats', es: 'terminos-expatriados', de: 'agb-expatriates', pt: 'termos-expatriados', ru: 'usloviya-expatrianty', zh: 'tiaokuan-waipai', ar: 'shurut-al-mugtaribin', hi: 'shartein-pravasi' },
  },
  'terms-chatters': {
    priority: '0.4', changefreq: 'yearly',
    slugs: { fr: 'cgu-chatters', en: 'terms-chatters', es: 'terminos-chatters', de: 'agb-chatters', pt: 'termos-chatters', ru: 'usloviya-chattery', zh: 'tiaokuan-chatters', ar: 'shurut-al-murwajin', hi: 'shartein-chatters' },
  },
  'terms-affiliate': {
    priority: '0.4', changefreq: 'yearly',
    slugs: { fr: 'cgu-affiliation', en: 'terms-affiliate', es: 'terminos-afiliacion', de: 'agb-partnerprogramm', pt: 'termos-afiliacao', ru: 'usloviya-partnerstva', zh: 'tiaokuan-lianmeng', ar: 'shurut-al-shiraka', hi: 'shartein-affiliate' },
  },
  'terms-influencers': {
    priority: '0.4', changefreq: 'yearly',
    slugs: { fr: 'cgu-influenceurs', en: 'terms-influencers', es: 'terminos-influencers', de: 'agb-influencer', pt: 'termos-influenciadores', ru: 'usloviya-influencery', zh: 'tiaokuan-yingxiangzhe', ar: 'shurut-al-muathirin', hi: 'shartein-influencers' },
  },
  'terms-bloggers': {
    priority: '0.4', changefreq: 'yearly',
    slugs: { fr: 'cgu-bloggers', en: 'terms-bloggers', es: 'terminos-bloggers', de: 'agb-blogger', pt: 'termos-bloggers', ru: 'usloviya-bloggery', zh: 'tiaokuan-bokezhu', ar: 'shurut-al-mudawanin', hi: 'shartein-bloggers' },
  },
  'terms-group-admins': {
    priority: '0.4', changefreq: 'yearly',
    slugs: { fr: 'cgu-group-admins', en: 'terms-group-admins', es: 'terminos-admins-grupos', de: 'agb-gruppenadmins', pt: 'termos-admins-grupos', ru: 'usloviya-admin-grupp', zh: 'tiaokuan-qunzu-guanliyuan', ar: 'shurut-aldarat-almajmua', hi: 'shartein-samuh-prabandhak' },
  },
};

const sitemap = fs.readFileSync(SITEMAP_PATH, 'utf-8');
const today = new Date().toISOString().split('T')[0];

const newBlocks = [];

for (const [pageKey, cfg] of Object.entries(PAGES)) {
  for (const lang of Object.keys(LOCALES)) {
    const locale = LOCALES[lang];
    const slug = cfg.slugs[lang];
    if (!slug) continue;
    const fullUrl = `${SITE_URL}/${locale}/${slug}`;

    // Idempotent: skip if URL already in sitemap
    if (sitemap.includes(`<loc>${fullUrl}</loc>`)) {
      continue;
    }

    // Build hreflang alternates
    const altLinks = Object.keys(LOCALES)
      .filter(l => cfg.slugs[l])
      .map(l => `    <xhtml:link rel="alternate" hreflang="${HREFLANG[l]}" href="${SITE_URL}/${LOCALES[l]}/${cfg.slugs[l]}"/>`)
      .join('\n');
    const xDefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}/${LOCALES.fr}/${cfg.slugs.fr}"/>`;

    newBlocks.push(`  <url>
    <loc>${fullUrl}</loc>
    <lastmod>${today}</lastmod>
${altLinks}
${xDefault}
    <changefreq>${cfg.changefreq}</changefreq>
    <priority>${cfg.priority}</priority>
  </url>`);
  }
}

if (newBlocks.length === 0) {
  console.log('All target URLs already present in sitemap. Nothing to add.');
  process.exit(0);
}

console.log(`Adding ${newBlocks.length} new URL entries to sitemap-static.xml`);

const insertion = '\n' + newBlocks.join('\n\n') + '\n\n';
const updated = sitemap.replace(/<\/urlset>/, insertion + '</urlset>');

fs.writeFileSync(SITEMAP_PATH, updated, 'utf-8');
console.log(`✅ sitemap-static.xml updated: +${newBlocks.length} URLs`);
process.exit(0);
