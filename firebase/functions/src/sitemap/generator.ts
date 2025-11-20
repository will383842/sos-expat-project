/**
 * Sitemap Generator
 * Generates 3-level sitemap structure:
 * - Level 1: By Language-Country (1773 files)
 * - Level 2: By Country (197 files)
 * - Level 3: Global Index (1 file)
 */

import * as admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);

// Languages and their default countries
const LANGUAGES: Array<{ code: string; country: string }> = [
  { code: 'fr', country: 'fr' },
  { code: 'en', country: 'us' },
  { code: 'es', country: 'es' },
  { code: 'ru', country: 'ru' },
  { code: 'de', country: 'de' },
  { code: 'hi', country: 'in' },
  { code: 'pt', country: 'pt' },
  { code: 'ch', country: 'cn' },
  { code: 'ar', country: 'sa' },
];

const SITE_URL = 'https://sosexpats.com';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: Array<{ hreflang: string; href: string }>;
}

interface StaticRoute {
  path: string;
  translated?: string;
  priority: number;
  changefreq: SitemapUrl['changefreq'];
}

// Static public routes (exclude protected routes)
const STATIC_ROUTES: StaticRoute[] = [
  { path: '/', priority: 1.0, changefreq: 'weekly' },
  { path: '/login', translated: 'login', priority: 0.5, changefreq: 'monthly' },
  { path: '/register', translated: 'register', priority: 0.6, changefreq: 'monthly' },
  { path: '/register/client', translated: 'register-client', priority: 0.5, changefreq: 'monthly' },
  { path: '/register/lawyer', translated: 'register-lawyer', priority: 0.6, changefreq: 'monthly' },
  { path: '/register/expat', translated: 'register-expat', priority: 0.6, changefreq: 'monthly' },
  { path: '/password-reset', translated: 'password-reset', priority: 0.3, changefreq: 'yearly' },
  { path: '/tarifs', translated: 'pricing', priority: 0.8, changefreq: 'monthly' },
  { path: '/contact', translated: 'contact', priority: 0.7, changefreq: 'monthly' },
  { path: '/how-it-works', translated: 'how-it-works', priority: 0.8, changefreq: 'monthly' },
  { path: '/faq', translated: 'faq', priority: 0.7, changefreq: 'weekly' },
  { path: '/centre-aide', translated: 'help-center', priority: 0.6, changefreq: 'weekly' },
  { path: '/testimonials', translated: 'testimonials', priority: 0.7, changefreq: 'weekly' },
  { path: '/terms-clients', translated: 'terms-clients', priority: 0.4, changefreq: 'yearly' },
  { path: '/terms-lawyers', translated: 'terms-lawyers', priority: 0.4, changefreq: 'yearly' },
  { path: '/terms-expats', translated: 'terms-expats', priority: 0.4, changefreq: 'yearly' },
  { path: '/privacy-policy', translated: 'privacy-policy', priority: 0.5, changefreq: 'yearly' },
  { path: '/cookies', translated: 'cookies', priority: 0.3, changefreq: 'yearly' },
  { path: '/consumers', translated: 'consumers', priority: 0.5, changefreq: 'monthly' },
  { path: '/statut-service', translated: 'service-status', priority: 0.6, changefreq: 'daily' },
  { path: '/seo', translated: 'seo', priority: 0.5, changefreq: 'monthly' },
  { path: '/sos-appel', translated: 'sos-call', priority: 0.9, changefreq: 'daily' },
  { path: '/appel-expatrie', translated: 'expat-call', priority: 0.9, changefreq: 'daily' },
  { path: '/providers', translated: 'providers', priority: 0.8, changefreq: 'daily' },
];

// Route translations mapping (from localeRoutes.ts)
// TODO: Add all other translations...
const ROUTE_TRANSLATIONS: Record<string, Record<string, string>> = {
  'login': { fr: 'connexion', en: 'login', es: 'iniciar-sesion', ru: 'вход', de: 'anmeldung', hi: 'लॉगिन', pt: 'entrar', ch: '登录', ar: 'تسجيل-الدخول' },
  'register': { fr: 'inscription', en: 'register', es: 'registro', ru: 'регистрация', de: 'registrierung', hi: 'पंजीकरण', pt: 'cadastro', ch: '注册', ar: 'التسجيل' },
  'pricing': { fr: 'tarifs', en: 'pricing', es: 'precios', ru: 'цены', de: 'preise', hi: 'मूल्य-निर्धारण', pt: 'precos', ch: '价格', ar: 'الأسعار' },
  // Add all other translations...
};

/**
 * Get translated route slug for a language
 */
function getTranslatedRouteSlug(routeKey: string, lang: string): string {
  return ROUTE_TRANSLATIONS[routeKey]?.[lang] || routeKey;
}

/**
 * Generate locale string (e.g., "en-us", "fr-fr")
 **/

function getLocaleString(lang: string, country: string): string {
  return `${lang}-${country.toLowerCase()}`;
}

/**
 ** Normalize country name to URL slug
 **/
function countryToSlug(country: string): string {
  return country
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generate URL for a route in a specific locale
 */
function generateRouteUrl(route: StaticRoute, lang: string, country: string): string {
  const locale = getLocaleString(lang, country);
  let path = route.path;
  
  if (route.translated) {
    const slug = getTranslatedRouteSlug(route.translated, lang);
    // Replace the first segment with translated slug
    const segments = path.split('/').filter(Boolean);
    if (segments.length > 0) {
      segments[0] = slug;
      path = '/' + segments.join('/');
    }
  }
  
  return `${SITE_URL}/${locale}${path}`;
}

/**
 * Generate provider profile URL
 */
function generateProviderUrl(
  provider: admin.firestore.DocumentSnapshot,
  lang: string,
  country: string
): string {
  const data = provider.data();
  const type = data?.type === 'lawyer' ? 'avocat' : 'expatrie';
  const providerCountry = countryToSlug(data?.country || 'monde');
  const providerLang = data?.languages?.[0]?.toLowerCase() || 'francais';
  const nameSlug = (data?.fullName || data?.name || 'expert')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-');
  
  const locale = getLocaleString(lang, country);
  return `${SITE_URL}/${locale}/${type}/${providerCountry}/${providerLang}/${nameSlug}-${provider.id}`;
}

/**
 * Generate XML for a sitemap
 */
function generateSitemapXml(urls: SitemapUrl[]): string {
  const urlEntries = urls.map(url => {
    let xml = '  <url>\n';
    xml += `    <loc>${escapeXml(url.loc)}</loc>\n`;
    
    if (url.lastmod) {
      xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    }
    
    if (url.changefreq) {
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    }
    
    if (url.priority !== undefined) {
      xml += `    <priority>${url.priority}</priority>\n`;
    }
    
    if (url.alternates && url.alternates.length > 0) {
      url.alternates.forEach(alt => {
        xml += `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${escapeXml(alt.href)}" />\n`;
      });
    }
    
    xml += '  </url>\n';
    return xml;
  }).join('');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries}</urlset>`;
}

/**
 * Generate sitemap index XML
 */
function generateSitemapIndexXml(sitemaps: Array<{ loc: string; lastmod?: string }>): string {
  const sitemapEntries = sitemaps.map(sitemap => {
    let xml = '  <sitemap>\n';
    xml += `    <loc>${escapeXml(sitemap.loc)}</loc>\n`;
    if (sitemap.lastmod) {
      xml += `    <lastmod>${sitemap.lastmod}</lastmod>\n`;
    }
    xml += '  </sitemap>\n';
    return xml;
  }).join('');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}</sitemapindex>`;
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Get all public providers from Firestore
 */
async function getPublicProviders(): Promise<admin.firestore.DocumentSnapshot[]> {
  const db = admin.firestore();
  const providers = await db.collection('sos_profiles')
    .where('isVisible', '==', true)
    .where('isApproved', '==', true)
    .where('isBanned', '==', false)
    .get();
  
  return providers.docs.filter(doc => {
    const data = doc.data();
    // Exclude admins
    return !data.isAdmin && data.type && ['lawyer', 'expat'].includes(data.type);
  });
}

/**
 * Generate Level 1 sitemap (by language-country)
 */
async function generateLevel1Sitemap(
  lang: string,
  country: string,
  providers: admin.firestore.DocumentSnapshot[]
): Promise<string> {
  const urls: SitemapUrl[] = [];
  const now = new Date().toISOString().split('T')[0];
  
  // Add static routes
  for (const route of STATIC_ROUTES) {
    const url = generateRouteUrl(route, lang, country);
    urls.push({
      loc: url,
      lastmod: now,
      changefreq: route.changefreq,
      priority: route.priority,
    });
  }
  
  // Add provider profiles
  for (const provider of providers) {
    const url = generateProviderUrl(provider, lang, country);
    const data = provider.data();
    const updatedAt = data?.updatedAt?.toDate?.() || new Date();
    
    urls.push({
      loc: url,
      lastmod: updatedAt.toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 0.7,
    });
  }
  
  return generateSitemapXml(urls);
}

/**
 * Generate Level 2 sitemap (by country, all languages)
 */
async function generateLevel2Sitemap(
  countryName: string,
  providers: admin.firestore.DocumentSnapshot[]
): Promise<string> {
  const urls: SitemapUrl[] = [];
  const now = new Date().toISOString().split('T')[0];
  
  // Add static routes for all languages
  for (const lang of LANGUAGES) {
    for (const route of STATIC_ROUTES) {
      const url = generateRouteUrl(route, lang.code, lang.country);
      urls.push({
        loc: url,
        lastmod: now,
        changefreq: route.changefreq,
        priority: route.priority,
      });
    }
  }
  
  // Add provider profiles for all languages
  const countryProviders = providers.filter(p => {
    const data = p.data();
    return countryToSlug(data?.country || '') === countryToSlug(countryName);
  });
  
  for (const provider of countryProviders) {
    for (const lang of LANGUAGES) {
      const url = generateProviderUrl(provider, lang.code, lang.country);
      const data = provider.data();
      const updatedAt = data?.updatedAt?.toDate?.() || new Date();
      
      urls.push({
        loc: url,
        lastmod: updatedAt.toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: 0.7,
      });
    }
  }
  
  return generateSitemapXml(urls);
}

/**
 * Upload sitemap to Firebase Storage with Gzip compression
 */
async function uploadSitemap(
  filename: string,
  content: string,
  bucket: any
): Promise<void> {
  const gzipped = await gzip(Buffer.from(content, 'utf-8'));
  const file = bucket.file(`sitemaps/${filename}`);
  
  await file.save(gzipped, {
    metadata: {
      contentType: 'application/xml',
      contentEncoding: 'gzip',
      cacheControl: 'public, max-age=3600',
    },
    gzip: false, // Already gzipped
  });
  
  console.log(`✅ Uploaded: ${filename} (${(gzipped.length / 1024).toFixed(2)} KB gzipped)`);
}

/**
 * Submit sitemap to search engines
 */
async function submitSitemapToSearchEngines(sitemapUrl: string): Promise<void> {
  const engines = [
    {
      name: 'Google',
      url: `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
    },
    {
      name: 'Bing',
      url: `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
    },
    {
      name: 'Yandex',
      url: `https://webmaster.yandex.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
    },
  ];
  
  for (const engine of engines) {
    try {
      const response = await fetch(engine.url);
      if (response.ok) {
        console.log(`✅ Submitted to ${engine.name}`);
      } else {
        console.warn(`⚠️ ${engine.name} submission failed: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Error submitting to ${engine.name}:`, error);
    }
  }
}

/**
 * Log generation results to Firestore for monitoring
 */
async function logSitemapGeneration(results: {
  level1Count: number;
  level2Count: number;
  totalFiles: number;
  totalSize: number;
  duration: number;
  errors?: string[];
}): Promise<void> {
  try {
    const db = admin.firestore();
    
    await db.collection('sitemap_logs').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: results.errors && results.errors.length > 0 ? 'partial' : 'success',
      level1Count: results.level1Count,
      level2Count: results.level2Count,
      totalFiles: results.totalFiles,
      totalSize: results.totalSize, // in bytes
      duration: results.duration, // in milliseconds
      errors: results.errors || [],
      sitemapIndexUrl: `${SITE_URL}/sitemaps/sitemap-index.xml.gz`,
    });
    
    console.log('📊 Generation logged to Firestore (collection: sitemap_logs)');
  } catch (error) {
    console.warn('⚠️ Failed to log to Firestore:', error);
  }
}

/**
 * Main function to generate all sitemaps
 */
export async function generateAllSitemaps(): Promise<void> {
  const startTime = Date.now();
  console.log('🚀 Starting sitemap generation...');
  
  const errors: string[] = [];
  let totalSize = 0;
  
  try {
    const storage = getStorage();
    const bucket = storage.bucket();
    const providers = await getPublicProviders();
    
    console.log(`📊 Found ${providers.length} public providers`);
    
    // Get unique countries from providers
    const countries = new Set<string>();
    providers.forEach(p => {
      const country = p.data()?.country;
      if (country) countries.add(country);
    });
    
    console.log(`🌍 Found ${countries.size} unique countries`);
    
    const sitemapIndexUrls: Array<{ loc: string; lastmod: string }> = [];
    const now = new Date().toISOString().split('T')[0];
    
    // Generate Level 1 sitemaps (by language-country)
    console.log('📝 Generating Level 1 sitemaps (by language-country)...');
    for (const lang of LANGUAGES) {
      try {
        const sitemapContent = await generateLevel1Sitemap(lang.code, lang.country, providers);
        const filename = `sitemap-${lang.code}-${lang.country}.xml.gz`;
        const gzipped = await gzip(Buffer.from(sitemapContent, 'utf-8'));
        totalSize += gzipped.length;
        await uploadSitemap(filename, sitemapContent, bucket);
        
        sitemapIndexUrls.push({
          loc: `${SITE_URL}/sitemaps/${filename}`,
          lastmod: now,
        });
      } catch (error) {
        const errorMsg = `Failed to generate Level 1 sitemap for ${lang.code}-${lang.country}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
    
    // Generate Level 2 sitemaps (by country)
    console.log('📝 Generating Level 2 sitemaps (by country)...');
    for (const country of countries) {
      try {
        const countrySlug = countryToSlug(country);
        const sitemapContent = await generateLevel2Sitemap(country, providers);
        const filename = `sitemap-country-${countrySlug}.xml.gz`;
        const gzipped = await gzip(Buffer.from(sitemapContent, 'utf-8'));
        totalSize += gzipped.length;
        await uploadSitemap(filename, sitemapContent, bucket);
        
        sitemapIndexUrls.push({
          loc: `${SITE_URL}/sitemaps/${filename}`,
          lastmod: now,
        });
      } catch (error) {
        const errorMsg = `Failed to generate Level 2 sitemap for ${country}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
    
    // Generate Level 3 sitemap index
    console.log('📝 Generating Level 3 sitemap index...');
    try {
      const indexContent = generateSitemapIndexXml(sitemapIndexUrls);
      const gzipped = await gzip(Buffer.from(indexContent, 'utf-8'));
      totalSize += gzipped.length;
      await uploadSitemap('sitemap-index.xml.gz', indexContent, bucket);
    } catch (error) {
      const errorMsg = `Failed to generate sitemap index: ${error}`;
      console.error(`❌ ${errorMsg}`);
      errors.push(errorMsg);
    }
    
    // Submit to search engines
    console.log('📤 Submitting to search engines...');
    try {
      await submitSitemapToSearchEngines(`${SITE_URL}/sitemaps/sitemap-index.xml.gz`);
    } catch (error) {
      const errorMsg = `Failed to submit to search engines: ${error}`;
      console.error(`❌ ${errorMsg}`);
      errors.push(errorMsg);
    }
    
    const duration = Date.now() - startTime;
    const results = {
      level1Count: LANGUAGES.length,
      level2Count: countries.size,
      totalFiles: LANGUAGES.length + countries.size + 1,
      totalSize,
      duration,
      errors: errors.length > 0 ? errors : undefined,
    };
    
    // Log to Firestore for monitoring
    await logSitemapGeneration(results);
    
    console.log('✅ Sitemap generation complete!');
    console.log(`📊 Summary: ${results.totalFiles} files, ${(totalSize / 1024 / 1024).toFixed(2)} MB, ${(duration / 1000).toFixed(2)}s`);
    
    if (errors.length > 0) {
      console.warn(`⚠️ Completed with ${errors.length} errors`);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    await logSitemapGeneration({
      level1Count: 0,
      level2Count: 0,
      totalFiles: 0,
      totalSize: 0,
      duration,
      errors: [String(error)],
    });
    throw error;
  }
}
