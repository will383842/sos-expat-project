/**
 * Sitemaps Dynamiques
 * Génère les sitemaps XML pour les profils, blog et landing pages
 */

import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { COUNTRY_SLUG_TRANSLATIONS } from '../data/country-slug-translations';

// Lazy initialization to avoid issues during deployment analysis
const IS_DEPLOYMENT_ANALYSIS =
  !process.env.K_REVISION &&
  !process.env.K_SERVICE &&
  !process.env.FUNCTION_TARGET &&
  !process.env.FUNCTIONS_EMULATOR;

let _initialized = false;
function ensureInitialized() {
  if (!_initialized && !IS_DEPLOYMENT_ANALYSIS) {
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    _initialized = true;
  }
}

const SITE_URL = 'https://sos-expat.com';
// ⚠️ CONVENTION: Chinese uses 'ch' internally (Firestore slugs key: profile.slugs['ch'])
// but 'zh' in URLs (zh-cn) and 'zh-Hans' in hreflang (BCP 47).
// Conversion is handled by getLocaleString() and getHreflangCode().
// DO NOT change 'ch' to 'zh' here without migrating all Firestore slugs data.
const LANGUAGES = ['fr', 'en', 'de', 'es', 'pt', 'ru', 'ch', 'ar', 'hi'];

// Map language to default country code (must match frontend localeRoutes.ts)
const LANGUAGE_TO_COUNTRY: Record<string, string> = {
  fr: 'fr',  // French -> France
  en: 'us',  // English -> United States
  es: 'es',  // Spanish -> Spain
  de: 'de',  // German -> Germany
  ru: 'ru',  // Russian -> Russia
  pt: 'pt',  // Portuguese -> Portugal
  ch: 'cn',  // Chinese -> China
  hi: 'in',  // Hindi -> India
  ar: 'sa',  // Arabic -> Saudi Arabia
};

// ✅ WHITELIST: Only CANONICAL locales for sitemaps (one per language = default country)
// Non-canonical variants (fr-be, en-gb, zh-tw, etc.) are 301-redirected in _redirects
// and must NOT appear in sitemaps (Google flags "Page with redirect" error)
const VALID_LOCALES = new Set([
  'fr-fr',
  'en-us',
  'es-es',
  'de-de',
  'pt-pt',
  'ru-ru',
  'zh-cn',
  'ar-sa',
  'hi-in'
]);

/**
 * Valide si une locale est valide (ex: "fr-fr" OK, "es-FR" NOK)
 */
function isValidLocale(locale: string): boolean {
  return VALID_LOCALES.has(locale.toLowerCase());
}

/**
 * Extrait la locale d'un slug (ex: "es-FR/avocat-thailand/..." → "es-FR")
 */
function extractLocaleFromSlug(slug: string): string | null {
  const match = slug.match(/^([a-z]{2}-[a-z]{2})\//i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Get locale string in format "lang-country" (e.g., "hi-in", "fr-fr")
 * This must match the format expected by the frontend LocaleRouter
 * Special case: Chinese uses 'zh' as URL prefix (ISO standard) instead of 'ch' (internal code)
 */
function getLocaleString(lang: string): string {
  const country = LANGUAGE_TO_COUNTRY[lang] || lang;
  // Chinese: internal code is 'ch' but URL should use 'zh' (ISO 639-1 standard)
  const urlLang = lang === 'ch' ? 'zh' : lang;
  return `${urlLang}-${country}`;
}

// Convertit le code de langue interne vers le code hreflang BCP 47
// Aligné avec Blog Laravel CanonicalService::HREFLANG_MAP et SPA HrefLangConstants
const HREFLANG_MAP: Record<string, string> = {
  fr: 'fr-FR', en: 'en-US', es: 'es-ES', de: 'de-DE', ru: 'ru-RU',
  pt: 'pt-PT', ch: 'zh-Hans', hi: 'hi-IN', ar: 'ar-SA',
};
function getHreflangCode(lang: string): string {
  return HREFLANG_MAP[lang] || lang;
}

/**
 * Détecte si un slug a un préfixe de langue interne (ex: "ch-setting-prices" -> "ch")
 * Utilisé pour n'indexer les articles non-traduits que dans leur langue native
 */
function detectSlugLangPrefix(slug: string): string | null {
  const match = slug.match(/^([a-z]{2})-/);
  if (match && LANGUAGES.includes(match[1])) {
    return match[1];
  }
  return null;
}

/**
 * Escape les caractères spéciaux XML
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ============================================
// 📊 SEO SCORING — Calcule la qualité d'un profil pour l'indexation
// Score /100 : ≥ 60 = premium (priority 0.9), 40-59 = standard (0.6), < 40 = exclu
// ============================================
function calculateProfileSEOScore(profile: Record<string, unknown>): number {
  let score = 0;

  // Reviews (25 pts)
  const reviewCount = Number(profile.reviewCount ?? profile.realReviewsCount ?? 0);
  score += reviewCount === 0 ? 0 : reviewCount < 5 ? 12 : 25;

  // Average rating (20 pts)
  const avgRating = Number(profile.averageRating ?? 0);
  score += avgRating < 3.5 ? 0 : avgRating < 4.3 ? 10 : 20;

  // Description length (15 pts)
  const descLen = String(profile.description ?? '').length;
  score += descLen < 100 ? 0 : descLen < 300 ? 8 : 15;

  // Photo (10 pts)
  const photo = String(profile.photoURL ?? '');
  score += photo && !photo.includes('default') && photo.length > 10 ? 10 : 0;

  // Specialties (10 pts)
  const specialties = Array.isArray(profile.specialties) ? profile.specialties.length
    : Array.isArray(profile.helpTypes) ? profile.helpTypes.length : 0;
  score += specialties === 0 ? 0 : specialties < 3 ? 5 : 10;

  // Total calls (10 pts)
  const calls = Number(profile.totalCalls ?? profile.callCount ?? 0);
  score += calls === 0 ? 0 : calls < 10 ? 5 : 10;

  // SEO data available (5 pts) — proxy: has slugs object with multiple keys
  const slugsCount = profile.slugs && typeof profile.slugs === 'object' ? Object.keys(profile.slugs as object).length : 0;
  score += slugsCount >= 5 ? 5 : slugsCount >= 1 ? 3 : 0;

  // Languages spoken (5 pts)
  const langs = Array.isArray(profile.languages) ? profile.languages.length : 0;
  score += langs < 2 ? 1 : langs < 4 ? 3 : 5;

  return score;
}

/** Min SEO score to include in sitemap (below = noindex, excluded) */
const MIN_SEO_SCORE = 40;
/** Score threshold for premium priority */
const PREMIUM_SEO_SCORE = 60;
/** Max URLs per sitemap file — Google recommends < 50K, we use 500 for faster crawl */
const MAX_URLS_PER_SITEMAP = 500;

// ============================================
// 🧑‍⚖️ SITEMAP: Profils prestataires
// Supports ?lang=fr to filter by language (optional, backward compatible)
// Without ?lang, returns ALL languages (legacy behavior)
// ============================================
export const sitemapProfiles = onRequest(
  {
    region: 'europe-west1',
    memory: '256MiB',
    cpu: 0.5,
    timeoutSeconds: 120,
    maxInstances: 5,
    minInstances: 1,
    invoker: 'public',
    serviceAccount: 'firebase-adminsdk-fbsvc@sos-urgently-ac307.iam.gserviceaccount.com',
  },
  async (req, res) => {
    ensureInitialized();
    try {
      const db = admin.firestore();

      // ✅ Optional language filter: ?lang=fr returns only French URLs
      // Without ?lang, returns all languages (backward compatible)
      const filterLang = typeof req.query.lang === 'string' ? req.query.lang.toLowerCase() : null;
      // Validate filter lang is a known language
      if (filterLang && !LANGUAGES.includes(filterLang) && filterLang !== 'zh') {
        res.status(400).send(`Invalid lang parameter: ${filterLang}. Valid: ${LANGUAGES.join(', ')}, zh`);
        return;
      }
      // Map 'zh' URL param to 'ch' internal code
      const internalFilterLang = filterLang === 'zh' ? 'ch' : filterLang;

      // ✅ Optional pagination: ?page=1 (1-indexed). Without ?page, returns all URLs.
      // When used with ?lang=, splits large sitemaps into 500-URL pages.
      const pageParam = typeof req.query.page === 'string' ? parseInt(req.query.page, 10) : null;
      const pageNum = pageParam && pageParam >= 1 ? pageParam : null;

      // ✅ Utilise sos_profiles (pas users)
      // Filtre les prestataires visibles, approuvés ET actifs
      const snapshot = await db.collection('sos_profiles')
        .where('isVisible', '==', true)
        .where('isApproved', '==', true)
        .where('isActive', '==', true)
        .get();

      const today = new Date().toISOString().split('T')[0];
      const languagesToGenerate = internalFilterLang ? [internalFilterLang] : LANGUAGES;

      // OPTIMISÉ: Utilise array.join() au lieu de += pour éviter O(n²)
      const allUrlBlocks: string[] = [];
      let includedCount = 0;
      let excludedByScore = 0;

      snapshot.docs.forEach(doc => {
        const profile = doc.data();

        // Skip profiles without a valid name (frontend will show 404 for these)
        const name = profile.fullName || profile.displayName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
        if (!name) return;

        // ✅ SEO SCORING: Calculate quality score and exclude low-quality profiles
        const seoScore = calculateProfileSEOScore(profile);
        if (seoScore < MIN_SEO_SCORE) {
          excludedByScore++;
          return; // Exclude from sitemap — will be noindex on frontend
        }

        // Dynamic priority based on score
        const priority = seoScore >= PREMIUM_SEO_SCORE ? '0.9' : '0.6';

        // Image tag for Google Images indexing — included in every language variant of the URL
        const photoUrl = (profile.photoURL as string | undefined) || (profile.profilePhoto as string | undefined) || '';
        const imageTag = photoUrl && photoUrl.startsWith('http') && !photoUrl.includes('default-avatar')
          ? `\n    <image:image>\n      <image:loc>${escapeXml(photoUrl)}</image:loc>\n      <image:title>${escapeXml(name)}</image:title>\n    </image:image>`
          : '';

        // Utilise les slugs multilingues si disponibles
        const slugs = profile.slugs as Record<string, string> | undefined;
        const hasSlugs = slugs && typeof slugs === 'object' && Object.keys(slugs).length > 0;

        // Skip si pas de slugs multilingues ET pas de slug simple
        if (!hasSlugs && !profile.slug) return;

        // Pour les profils avec slugs multilingues (nouveau format)
        if (hasSlugs) {
          languagesToGenerate.forEach(lang => {
            const slug = slugs[lang];
            if (!slug) return;

            // ✅ VALIDATION: Vérifier que le slug a une locale valide
            const slugLocale = extractLocaleFromSlug(slug);
            if (!slugLocale || !isValidLocale(slugLocale)) {
              console.warn(`⚠️ Slug invalide ignoré (${doc.id}, ${lang}): ${slug} (locale: ${slugLocale || 'none'})`);
              return;
            }

            // ✅ VALIDATION: Vérifier que la locale du slug correspond à la langue
            const expectedUrlLang = lang === 'ch' ? 'zh' : lang;
            const slugLangPart = slugLocale.split('-')[0];
            if (slugLangPart !== expectedUrlLang) {
              console.warn(`⚠️ Slug cross-langue ignoré (${doc.id}, ${lang}): locale ${slugLocale} != expected ${expectedUrlLang}`);
              return;
            }

            const url = `${SITE_URL}/${slug}`;

            // Génère les hreflang pour TOUTES les langues du profil (même si filtré par langue)
            // Google a besoin de la réciprocité complète
            const hreflangs = LANGUAGES.map(hrefLang => {
              const hrefSlug = slugs[hrefLang];
              if (!hrefSlug) return null;
              const hrefLocale = extractLocaleFromSlug(hrefSlug);
              if (!hrefLocale || !isValidLocale(hrefLocale)) return null;
              return `    <xhtml:link rel="alternate" hreflang="${getHreflangCode(hrefLang)}" href="${escapeXml(`${SITE_URL}/${hrefSlug}`)}"/>`;
            }).filter(Boolean).join('\n');

            // x-default = français (si disponible et valide)
            let xDefaultSlug = slugs['fr'] || slug;
            const xDefaultLocale = extractLocaleFromSlug(xDefaultSlug);
            if (!xDefaultLocale || !isValidLocale(xDefaultLocale)) {
              xDefaultSlug = slug;
            }
            const xDefaultUrl = `${SITE_URL}/${xDefaultSlug}`;

            const profileLastmod = profile.updatedAt?.toDate?.()
              ? profile.updatedAt.toDate().toISOString().split('T')[0]
              : today;

            allUrlBlocks.push(`  <url>
    <loc>${escapeXml(url)}</loc>
${hreflangs}
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(xDefaultUrl)}"/>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
    <lastmod>${profileLastmod}</lastmod>${imageTag}
  </url>`);
            includedCount++;
          });
        } else if (profile.slug) {
          // Ancien format: slug unique (ex: "fr/expatrie-norvege/melissa-...")
          const legacySlug = profile.slug as string;
          const slugLang = legacySlug.split('/')[0];
          const isValidLang = LANGUAGES.includes(slugLang);

          if (isValidLang) {
            // Skip if filtering by language and this legacy slug doesn't match
            if (internalFilterLang && slugLang !== internalFilterLang) return;

            const url = `${SITE_URL}/${legacySlug}`;
            allUrlBlocks.push(`  <url>
    <loc>${escapeXml(url)}</loc>
    <xhtml:link rel="alternate" hreflang="${getHreflangCode(slugLang)}" href="${escapeXml(url)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(url)}"/>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
    <lastmod>${today}</lastmod>${imageTag}
  </url>`);
            includedCount++;
          } else {
            // Slug sans préfixe langue (très ancien format)
            languagesToGenerate.forEach(lang => {
              const locale = getLocaleString(lang);
              const url = `${SITE_URL}/${locale}/${legacySlug}`;

              const hreflangs = LANGUAGES.map(hrefLang => {
                const hrefLocale = getLocaleString(hrefLang);
                return `    <xhtml:link rel="alternate" hreflang="${getHreflangCode(hrefLang)}" href="${escapeXml(`${SITE_URL}/${hrefLocale}/${legacySlug}`)}"/>`;
              }).join('\n');

              const defaultLocale = getLocaleString('fr');
              allUrlBlocks.push(`  <url>
    <loc>${escapeXml(url)}</loc>
${hreflangs}
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${SITE_URL}/${defaultLocale}/${legacySlug}`)}"/>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
    <lastmod>${today}</lastmod>${imageTag}
  </url>`);
              includedCount++;
            });
          }
        }
      });

      // ✅ PAGINATION: Slice to requested page (500 URLs max per page)
      let urlBlocksPage = allUrlBlocks;
      let totalPages = 1;
      if (pageNum && allUrlBlocks.length > MAX_URLS_PER_SITEMAP) {
        totalPages = Math.ceil(allUrlBlocks.length / MAX_URLS_PER_SITEMAP);
        const start = (pageNum - 1) * MAX_URLS_PER_SITEMAP;
        const end = start + MAX_URLS_PER_SITEMAP;
        urlBlocksPage = allUrlBlocks.slice(start, end);
        if (urlBlocksPage.length === 0) {
          // Page out of range — return empty valid sitemap
          res.set('Content-Type', 'application/xml; charset=utf-8');
          res.set('Cache-Control', 'public, max-age=21600');
          res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`);
          return;
        }
      } else if (!pageNum && allUrlBlocks.length > MAX_URLS_PER_SITEMAP && filterLang) {
        // Auto-truncate to first page if no page param but lang is set (avoid giant sitemaps)
        totalPages = Math.ceil(allUrlBlocks.length / MAX_URLS_PER_SITEMAP);
        urlBlocksPage = allUrlBlocks.slice(0, MAX_URLS_PER_SITEMAP);
      }

      const xmlParts = [
        `<?xml version="1.0" encoding="UTF-8"?>`,
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`,
        `        xmlns:xhtml="http://www.w3.org/1999/xhtml"`,
        `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`,
        ...urlBlocksPage,
        `</urlset>`
      ];
      const xml = xmlParts.join('\n');

      res.set('Content-Type', 'application/xml; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=21600');
      if (totalPages > 1) {
        res.set('X-Sitemap-Total-Pages', String(totalPages));
        res.set('X-Sitemap-Total-URLs', String(allUrlBlocks.length));
      }
      res.status(200).send(xml);

      const langLabel = filterLang ? ` (lang=${filterLang})` : ' (all langs)';
      const pageLabel = totalPages > 1 ? ` (page ${pageNum || 1}/${totalPages})` : '';
      console.log(`✅ Sitemap profils${langLabel}${pageLabel}: ${snapshot.docs.length} profils, ${includedCount} URLs included, ${excludedByScore} excluded by score < ${MIN_SEO_SCORE}`);

    } catch (error: unknown) {
      const err = error as Error;
      console.error('❌ Erreur sitemap profils:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      res.status(500).send(`Error generating sitemap: ${err.message}`);
    }
  }
);

// ============================================
// 📚 SITEMAP: Articles du Centre d'Aide / Help Center
// ============================================
export const sitemapHelp = onRequest(
  {
    region: 'europe-west1',
    memory: '256MiB',
    cpu: 0.5,
    timeoutSeconds: 120,
    maxInstances: 3,
    minInstances: 1,
    invoker: 'public',
    serviceAccount: 'firebase-adminsdk-fbsvc@sos-urgently-ac307.iam.gserviceaccount.com',
  },
  async (req, res) => {
    ensureInitialized();
    try {
      console.log('🔄 Début génération sitemap help articles...');

      // ✅ Optional language filter: ?lang=fr
      const filterLang = typeof req.query.lang === 'string' ? req.query.lang.toLowerCase() : null;
      if (filterLang && !LANGUAGES.includes(filterLang) && filterLang !== 'zh') {
        res.status(400).send(`Invalid lang parameter: ${filterLang}`);
        return;
      }
      const internalFilterLang = filterLang === 'zh' ? 'ch' : filterLang;

      const db = admin.firestore();
      console.log('✅ Firestore initialisé');

      console.log('📥 Récupération des help_articles...');
      // ✅ Optional pagination: ?page=1
      // pagination parameter reserved for future use

      const snapshot = await db.collection('help_articles')
        .where('isPublished', '==', true)
        .limit(5000)
        .get();
      console.log(`📄 ${snapshot.docs.length} documents trouvés`);

      // Filtre les articles publiés (isPublished peut ne pas exister sur tous les docs)
      const publishedDocs = snapshot.docs.filter(doc => {
        const data = doc.data();
        return data.isPublished === true || data.status === 'published';
      });

      console.log(`📊 Sitemap blog: ${snapshot.docs.length} total, ${publishedDocs.length} publiés`);

      const today = new Date().toISOString().split('T')[0];

      // Mapping des slugs de routes par langue
      // ⚠️ DOIT correspondre exactement aux routes dans localeRoutes.ts (frontend)
      const helpCenterSlug: Record<string, string> = {
        fr: 'centre-aide',
        en: 'help-center',
        de: 'hilfezentrum',        // localeRoutes.ts: "hilfezentrum" (pas "hilfe-center")
        es: 'centro-ayuda',
        pt: 'centro-ajuda',
        ru: 'tsentr-pomoshchi',    // localeRoutes.ts: "tsentr-pomoshchi" (pas "centr-pomoshi")
        ch: 'bangzhu-zhongxin',
        ar: 'markaz-almusaeada',   // romanized (was Arabic script "مركز-المساعدة")
        hi: 'sahayata-kendra',
      };

      // Si aucun article, retourne un sitemap vide mais valide
      if (publishedDocs.length === 0) {
        const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
</urlset>`;
        res.set('Content-Type', 'application/xml; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=21600');
        res.status(200).send(emptyXml);
        console.log(`⚠️ Sitemap help articles: 0 articles publiés`);
        return;
      }

      // OPTIMISÉ: Utilise array.join() au lieu de += pour éviter O(n²)
      const urlBlocks: string[] = [];

      // Évite les URLs dupliquées dans le sitemap
      const seenUrls = new Set<string>();

      publishedDocs.forEach(doc => {
        const article = doc.data();
        const isMultilingualSlug = article.slug && typeof article.slug === 'object' && Object.keys(article.slug).length > 0;

        // Le slug peut être un string ou un objet multilingue
        const getSlug = (lang: string): string => {
          if (typeof article.slug === 'string') {
            return article.slug;
          }
          if (isMultilingualSlug) {
            return article.slug[lang] || article.slug['fr'] || article.slug['en'] || doc.id;
          }
          return doc.id;
        };

        // Pour les slugs string unique (non traduits), détecter la langue native via le préfixe
        const baseSlug = typeof article.slug === 'string' ? article.slug : null;
        const nativeLang = baseSlug ? detectSlugLangPrefix(baseSlug) : null;

        // ✅ Use filtered languages if ?lang= provided, otherwise all
        const helpLanguagesToGenerate = internalFilterLang ? [internalFilterLang] : LANGUAGES;

        helpLanguagesToGenerate.forEach(lang => {
          // Si le slug a un préfixe de langue (ex: "ch-"), n'inclure que pour cette langue
          if (nativeLang && nativeLang !== lang) return;

          // FIX: Pour les slugs multilingues, vérifier que le slug résolu
          // n'a pas un préfixe de langue différent (contamination cross-langue)
          // Ex: slug objet { fr: "ch-response-times-...", en: "ch-response-times-..." }
          // → le slug "ch-response-times" ne doit apparaître que sous la langue "ch"
          if (!nativeLang && isMultilingualSlug) {
            const resolvedSlug = getSlug(lang);
            const resolvedLangPrefix = detectSlugLangPrefix(resolvedSlug);
            if (resolvedLangPrefix && resolvedLangPrefix !== lang) return;
          }

          const slug = getSlug(lang);
          const routeSlug = helpCenterSlug[lang] || 'help-center';
          // Use locale format: lang-country (e.g., "hi-in", "fr-fr")
          const locale = getLocaleString(lang);
          const url = `${SITE_URL}/${locale}/${routeSlug}/${slug}`;

          // Déduplique les URLs (évite de lister deux fois la même URL si slugs identiques)
          if (seenUrls.has(url)) return;
          seenUrls.add(url);

          // Pour les slugs multilingues, générer les hreflang pour toutes les langues
          // Pour les slugs non traduits avec préfixe de langue, un seul hreflang
          const hreflangs = (isMultilingualSlug ? LANGUAGES : [lang]).map(hrefLang => {
            const hrefSlug = getSlug(hrefLang);
            const hrefRouteSlug = helpCenterSlug[hrefLang] || 'help-center';
            const hrefLocale = getLocaleString(hrefLang);
            return `    <xhtml:link rel="alternate" hreflang="${getHreflangCode(hrefLang)}" href="${escapeXml(`${SITE_URL}/${hrefLocale}/${hrefRouteSlug}/${hrefSlug}`)}"/>`;
          }).join('\n');

          // x-default: français si multilingue, sinon la langue native du slug
          const xDefaultLang = isMultilingualSlug ? 'fr' : lang;
          const defaultLocale = getLocaleString(xDefaultLang);
          const xDefaultSlug = getSlug(xDefaultLang);
          const xDefaultRouteSlug = helpCenterSlug[xDefaultLang] || 'help-center';

          urlBlocks.push(`  <url>
    <loc>${escapeXml(url)}</loc>
${hreflangs}
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${SITE_URL}/${defaultLocale}/${xDefaultRouteSlug}/${xDefaultSlug}`)}"/>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
    <lastmod>${article.updatedAt?.toDate?.()?.toISOString?.()?.split('T')[0] || today}</lastmod>
  </url>`);
        });
      });

      // ✅ Toujours retourner un urlset (jamais un sitemapindex)
      // Raison: sitemap.xml est lui-même un sitemapindex — Google interdit les sitemapindex imbriqués.
      // La limite Google est 50K URLs/fichier, largement au-dessus du volume help actuel.
      const helpPage = urlBlocks;

      const helpXml = [`<?xml version="1.0" encoding="UTF-8"?>`, `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`, `        xmlns:xhtml="http://www.w3.org/1999/xhtml">`, ...helpPage, `</urlset>`].join('\n');
      res.set('Content-Type', 'application/xml; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=21600');
      res.status(200).send(helpXml);

      console.log(`✅ Sitemap help: ${publishedDocs.length} articles, ${urlBlocks.length} URLs`);

    } catch (error: unknown) {
      const err = error as Error;
      console.error('❌ Erreur sitemap help articles:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      res.status(500).send(`Error generating help articles sitemap: ${err.message}`);
    }
  }
);

// ============================================
// 🎯 SITEMAP: Landing pages
// ============================================
export const sitemapLanding = onRequest(
  {
    region: 'europe-west1',
    memory: '256MiB',
    cpu: 0.083,
    timeoutSeconds: 60,
    maxInstances: 3,
    minInstances: 1,
    invoker: 'public',
    serviceAccount: 'firebase-adminsdk-fbsvc@sos-urgently-ac307.iam.gserviceaccount.com',
  },
  async (_req, res) => {
    ensureInitialized();
    try {
      const db = admin.firestore();

      const snapshot = await db.collection('landing_pages')
        .where('isActive', '==', true)
        .get();

      const today = new Date().toISOString().split('T')[0];

      // OPTIMISÉ: Utilise array.join() au lieu de += pour éviter O(n²)
      const urlBlocks: string[] = [];

      urlBlocks.push(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`);

      snapshot.docs.forEach(doc => {
        const page = doc.data();
        const slug = page.slug || doc.id;

        // Détecter si le slug a un préfixe de langue (ex: "en-guide-...")
        const slugNativeLang = detectSlugLangPrefix(slug);

        LANGUAGES.forEach(lang => {
          // Si le slug a un préfixe de langue, n'inclure que pour cette langue
          if (slugNativeLang && slugNativeLang !== lang) return;

          // Use locale format: lang-country (e.g., "hi-in", "fr-fr")
          const locale = getLocaleString(lang);
          const url = `${SITE_URL}/${locale}/${slug}`;

          // Génère tous les hreflang en une seule opération
          const hreflangs = LANGUAGES.map(hrefLang => {
            const hrefLocale = getLocaleString(hrefLang);
            return `    <xhtml:link rel="alternate" hreflang="${getHreflangCode(hrefLang)}" href="${escapeXml(`${SITE_URL}/${hrefLocale}/${slug}`)}"/>`;
          }).join('\n');

          // x-default uses French locale
          const defaultLocale = getLocaleString('fr');
          // Use page's updatedAt if available, fallback to today
          const pageLastmod = page.updatedAt?.toDate?.()
            ? page.updatedAt.toDate().toISOString().split('T')[0]
            : today;

          urlBlocks.push(`  <url>
    <loc>${escapeXml(url)}</loc>
${hreflangs}
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${SITE_URL}/${defaultLocale}/${slug}`)}"/>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <lastmod>${pageLastmod}</lastmod>
  </url>`);
        });
      });

      urlBlocks.push(`</urlset>`);
      const xml = urlBlocks.join('\n');

      res.set('Content-Type', 'application/xml; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=21600');
      res.status(200).send(xml);

      console.log(`✅ Sitemap landing: ${snapshot.docs.length} pages`);
      
    } catch (error) {
      console.error('❌ Erreur sitemap landing:', error);
      res.status(500).send('Error generating landing sitemap');
    }
  }
);

// ============================================
// ❓ SITEMAP: FAQ individuels
// ============================================
export const sitemapFaq = onRequest(
  {
    region: 'europe-west1',
    memory: '256MiB',
    cpu: 0.083,
    timeoutSeconds: 60,
    maxInstances: 3,
    minInstances: 1,
    invoker: 'public',
    serviceAccount: 'firebase-adminsdk-fbsvc@sos-urgently-ac307.iam.gserviceaccount.com',
  },
  async (req, res) => {
    ensureInitialized();
    try {
      console.log('🔄 Début génération sitemap FAQ...');

      // ✅ Optional language filter: ?lang=fr
      const faqFilterLang = typeof req.query.lang === 'string' ? req.query.lang.toLowerCase() : null;
      const faqInternalFilterLang = faqFilterLang === 'zh' ? 'ch' : faqFilterLang;

      const db = admin.firestore();

      // Récupère les FAQ actives (collection app_faq, même que la SPA FAQ.tsx)
      const snapshot = await db.collection('app_faq')
        .where('isActive', '==', true)
        .limit(500)
        .get();

      console.log(`📄 ${snapshot.docs.length} FAQs trouvées`);

      const today = new Date().toISOString().split('T')[0];

      // Si aucun FAQ, retourne un sitemap vide mais valide
      if (snapshot.docs.length === 0) {
        const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
</urlset>`;
        res.set('Content-Type', 'application/xml; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=21600');
        res.status(200).send(emptyXml);
        console.log(`⚠️ Sitemap FAQ: 0 FAQs actives`);
        return;
      }

      const urlBlocks: string[] = [];

      urlBlocks.push(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`);

      snapshot.docs.forEach(doc => {
        const faq = doc.data();

        // Le slug peut être un objet multilingue ou un string
        const slugs = faq.slug as Record<string, string> | string | undefined;
        const hasSlugs = slugs && typeof slugs === 'object' && Object.keys(slugs).length > 0;

        // Si pas de slug, utiliser l'ID du document
        const getSlug = (lang: string): string => {
          if (typeof slugs === 'string') return slugs;
          if (hasSlugs) return (slugs as Record<string, string>)[lang] || (slugs as Record<string, string>)['fr'] || doc.id;
          return doc.id;
        };

        // Pour les slugs string unique, détecter la langue native
        const baseSlugFaq = typeof slugs === 'string' ? slugs : null;
        const nativeLangFaq = baseSlugFaq ? detectSlugLangPrefix(baseSlugFaq) : null;

        const faqLanguagesToGenerate = faqInternalFilterLang ? [faqInternalFilterLang] : LANGUAGES;

        faqLanguagesToGenerate.forEach(lang => {
          // Si slug string avec préfixe de langue, n'inclure que pour cette langue
          if (nativeLangFaq && nativeLangFaq !== lang) return;

          // FIX: Pour les slugs multilingues, vérifier la contamination cross-langue
          // Ex: FAQ avec slug { fr: "cuales-son-las-tarifas", zh: "cuales-son-las-tarifas" }
          // → slug espagnol ne doit pas apparaître sous locale chinoise
          if (!nativeLangFaq && hasSlugs) {
            const resolvedSlug = getSlug(lang);
            const resolvedLangPrefix = detectSlugLangPrefix(resolvedSlug);
            if (resolvedLangPrefix && resolvedLangPrefix !== lang) return;
          }

          const slug = getSlug(lang);
          // Use locale format: lang-country (e.g., "hi-in", "fr-fr")
          const locale = getLocaleString(lang);
          const url = `${SITE_URL}/${locale}/faq/${slug}`;

          // Génère tous les hreflang
          const hreflangs = LANGUAGES.map(hrefLang => {
            const hrefSlug = getSlug(hrefLang);
            const hrefLocale = getLocaleString(hrefLang);
            return `    <xhtml:link rel="alternate" hreflang="${getHreflangCode(hrefLang)}" href="${escapeXml(`${SITE_URL}/${hrefLocale}/faq/${hrefSlug}`)}"/>`;
          }).join('\n');

          // x-default uses French locale
          const defaultLocale = getLocaleString('fr');
          urlBlocks.push(`  <url>
    <loc>${escapeXml(url)}</loc>
${hreflangs}
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${SITE_URL}/${defaultLocale}/faq/${getSlug('fr')}`)}"/>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <lastmod>${faq.updatedAt?.toDate?.()?.toISOString?.()?.split('T')[0] || today}</lastmod>
  </url>`);
        });
      });

      urlBlocks.push(`</urlset>`);
      const xml = urlBlocks.join('\n');

      res.set('Content-Type', 'application/xml; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=21600');
      res.status(200).send(xml);

      console.log(`✅ Sitemap FAQ: ${snapshot.docs.length} FAQs (${snapshot.docs.length * LANGUAGES.length} URLs)`);

    } catch (error: unknown) {
      const err = error as Error;
      console.error('❌ Erreur sitemap FAQ:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      res.status(500).send(`Error generating FAQ sitemap: ${err.message}`);
    }
  }
);

// ============================================
// 🌍 SITEMAP: Country Listing Pages (avocats/expatriés par pays)
// ============================================

/** Normalize country names (French or other) to ISO 2-letter codes */
const NAME_TO_ISO: Record<string, string> = {
  // French names
  'Thaïlande': 'TH', 'Algérie': 'DZ', 'Allemagne': 'DE', 'Angleterre': 'GB',
  'Arabie Saoudite': 'SA', 'Argentine': 'AR', 'Australie': 'AU', 'Autriche': 'AT',
  'Belgique': 'BE', 'Brésil': 'BR', 'Bulgarie': 'BG', 'Cambodge': 'KH',
  'Cameroun': 'CM', 'Canada': 'CA', 'Chili': 'CL', 'Chine': 'CN',
  'Chypre': 'CY', 'Colombie': 'CO', 'Corée du Sud': 'KR', 'Costa Rica': 'CR',
  'Croatie': 'HR', 'Côte d\'Ivoire': 'CI', 'Danemark': 'DK', 'Égypte': 'EG',
  'Émirats Arabes Unis': 'AE', 'Équateur': 'EC', 'Espagne': 'ES', 'Estonie': 'EE',
  'États-Unis': 'US', 'Finlande': 'FI', 'France': 'FR', 'Grèce': 'GR',
  'Guatemala': 'GT', 'Hongrie': 'HU', 'Inde': 'IN', 'Indonésie': 'ID',
  'Irlande': 'IE', 'Israël': 'IL', 'Italie': 'IT', 'Japon': 'JP',
  'Jordanie': 'JO', 'Kenya': 'KE', 'Liban': 'LB', 'Luxembourg': 'LU',
  'Madagascar': 'MG', 'Malaisie': 'MY', 'Malte': 'MT', 'Maroc': 'MA',
  'Maurice': 'MU', 'Mexique': 'MX', 'Monaco': 'MC', 'Norvège': 'NO',
  'Nouvelle-Zélande': 'NZ', 'Ouganda': 'UG', 'Pakistan': 'PK', 'Panama': 'PA',
  'Pays-Bas': 'NL', 'Pérou': 'PE', 'Philippines': 'PH', 'Pologne': 'PL',
  'Portugal': 'PT', 'Qatar': 'QA', 'République Dominicaine': 'DO',
  'République Tchèque': 'CZ', 'Roumanie': 'RO', 'Royaume-Uni': 'GB',
  'Russie': 'RU', 'Rwanda': 'RW', 'Sénégal': 'SN', 'Singapour': 'SG',
  'Slovaquie': 'SK', 'Slovénie': 'SI', 'Sri Lanka': 'LK', 'Suède': 'SE',
  'Suisse': 'CH', 'Taïwan': 'TW', 'Tanzanie': 'TZ', 'Tunisie': 'TN',
  'Turquie': 'TR', 'Ukraine': 'UA', 'Uruguay': 'UY', 'Vietnam': 'VN',
  // English names (only those different from French)
  'Thailand': 'TH', 'Algeria': 'DZ', 'Germany': 'DE', 'England': 'GB',
  'Saudi Arabia': 'SA', 'Austria': 'AT', 'Belgium': 'BE', 'Brazil': 'BR',
  'Bulgaria': 'BG', 'Cambodia': 'KH', 'Cameroon': 'CM', 'Chile': 'CL',
  'China': 'CN', 'Cyprus': 'CY', 'Colombia': 'CO', 'South Korea': 'KR',
  'Croatia': 'HR', 'Ivory Coast': 'CI', 'Denmark': 'DK', 'Egypt': 'EG',
  'United Arab Emirates': 'AE', 'Ecuador': 'EC', 'Spain': 'ES', 'Estonia': 'EE',
  'United States': 'US', 'Finland': 'FI', 'Greece': 'GR', 'Hungary': 'HU',
  'India': 'IN', 'Indonesia': 'ID', 'Ireland': 'IE', 'Israel': 'IL',
  'Italy': 'IT', 'Japan': 'JP', 'Jordan': 'JO', 'Lebanon': 'LB',
  'Malaysia': 'MY', 'Malta': 'MT', 'Morocco': 'MA', 'Mauritius': 'MU',
  'Mexico': 'MX', 'Norway': 'NO', 'New Zealand': 'NZ', 'Uganda': 'UG',
  'Netherlands': 'NL', 'Peru': 'PE', 'Poland': 'PL',
  'Dominican Republic': 'DO', 'Czech Republic': 'CZ', 'Romania': 'RO',
  'United Kingdom': 'GB', 'Russia': 'RU', 'Senegal': 'SN', 'Singapore': 'SG',
  'Slovakia': 'SK', 'Slovenia': 'SI', 'Sweden': 'SE', 'Switzerland': 'CH',
  'Taiwan': 'TW', 'Tanzania': 'TZ', 'Tunisia': 'TN', 'Turkey': 'TR',
};

/**
 * Country slug per language. Source of truth: sos/src/data/country-slug-translations.ts
 * (synced into sos/firebase/functions/src/data/country-slug-translations.ts).
 *
 * Previously this was an inline map of ~65 countries with an ISO-code fallback
 * that produced redirecting URLs (/lawyers/cu, /anwaelte/bh, etc.) reported by
 * GSC as "Page avec redirection". Now uses the full 248-country map and skips
 * emission when an entry is missing.
 */
const COUNTRY_SLUGS = COUNTRY_SLUG_TRANSLATIONS;

/** Role paths per language for lawyers */
const LAWYER_PATHS: Record<string, string> = {
  fr: 'avocats', en: 'lawyers', es: 'abogados', de: 'anwaelte',
  pt: 'advogados', ru: 'advokaty', ch: 'lushi', ar: 'muhamun', hi: 'vakil',
};

/** Role paths per language for expats */
const EXPAT_PATHS: Record<string, string> = {
  fr: 'expatries', en: 'expats', es: 'expatriados', de: 'expats',
  pt: 'expatriados', ru: 'expaty', ch: 'haiwai', ar: 'mughtaribun', hi: 'videshi',
};

/**
 * Normalize a country value to ISO 2-letter code.
 * Accepts ISO codes directly (2 letters) or full country names.
 */
function normalizeCountryToISO(country: string): string | null {
  if (!country) return null;
  const trimmed = country.trim();
  // Already an ISO code (2 uppercase letters)
  if (/^[A-Z]{2}$/.test(trimmed)) return trimmed;
  // Try uppercase version
  if (/^[a-z]{2}$/i.test(trimmed)) return trimmed.toUpperCase();
  // Lookup in NAME_TO_ISO
  return NAME_TO_ISO[trimmed] || null;
}

/**
 * Get the country slug for a given ISO code and language. Returns null when no
 * canonical slug exists, so callers can skip URL emission instead of generating
 * an ISO-code fallback (e.g. /lawyers/cu) that 301-redirects to the canonical
 * (/lawyers/cuba) and shows up in GSC as "Page avec redirection".
 */
function getCountrySlug(isoCode: string, lang: string): string | null {
  const slugs = COUNTRY_SLUGS[isoCode];
  if (!slugs) return null;
  // Chinese: internal code is 'ch' but COUNTRY_SLUGS uses 'zh' key
  const slugLang = lang === 'ch' ? 'zh' : lang;
  return slugs[slugLang] || null;
}

/** Min number of qualified providers (score ≥ MIN_SEO_SCORE) for a country page to be in sitemap */
const MIN_PROVIDERS_FOR_COUNTRY = 1;

export const sitemapCountryListings = onRequest(
  {
    region: 'europe-west1',
    memory: '512MiB',
    timeoutSeconds: 120,
    maxInstances: 5,
    minInstances: 1,
    invoker: 'public',
    cors: true,
    serviceAccount: 'firebase-adminsdk-fbsvc@sos-urgently-ac307.iam.gserviceaccount.com',
  },
  async (req, res) => {
    ensureInitialized();
    try {
      const db = admin.firestore();

      // ✅ Optional language filter: ?lang=fr returns only French URLs
      const filterLang = typeof req.query.lang === 'string' ? req.query.lang.toLowerCase() : null;
      if (filterLang && !LANGUAGES.includes(filterLang) && filterLang !== 'zh') {
        res.status(400).send(`Invalid lang parameter: ${filterLang}`);
        return;
      }
      const internalFilterLang = filterLang === 'zh' ? 'ch' : filterLang;

      // ✅ Optional min providers override (default: 3)
      const minProviders = Number(req.query.min) || MIN_PROVIDERS_FOR_COUNTRY;

      // Query active, visible, approved providers
      const snapshot = await db.collection('sos_profiles')
        .where('isVisible', '==', true)
        .where('isApproved', '==', true)
        .where('isActive', '==', true)
        .get();

      // Build country×type matrix with COUNTS of qualified providers
      const countryTypeCounts = new Map<string, number>();

      snapshot.docs.forEach(doc => {
        const profile = doc.data();
        const providerType = profile.type as string | undefined;
        if (!providerType || (providerType !== 'lawyer' && providerType !== 'expat')) return;

        // ✅ Only count providers with sufficient SEO score
        const seoScore = calculateProfileSEOScore(profile);
        if (seoScore < MIN_SEO_SCORE) return;

        const countries: string[] = [];
        if (profile.country) {
          const iso = normalizeCountryToISO(profile.country as string);
          if (iso) countries.push(iso);
        }
        const countryArrayFields = ['operatingCountries', 'interventionCountries', 'practiceCountries'];
        for (const field of countryArrayFields) {
          const arr = profile[field];
          if (Array.isArray(arr)) {
            for (const c of arr) {
              if (typeof c === 'string' && c.trim()) {
                const iso = normalizeCountryToISO(c);
                if (iso) countries.push(iso);
              }
            }
          }
        }

        const uniqueCountries = Array.from(new Set(countries));
        for (const iso of uniqueCountries) {
          const key = `${iso}_${providerType}`;
          countryTypeCounts.set(key, (countryTypeCounts.get(key) || 0) + 1);
        }
      });

      const today = new Date().toISOString().split('T')[0];
      const urlBlocks: string[] = [];
      const languagesToGenerate = internalFilterLang ? [internalFilterLang] : LANGUAGES;

      urlBlocks.push(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`);

      // ✅ Filter: only country×type combos with ≥ minProviders qualified providers
      const qualifiedEntries = Array.from(countryTypeCounts.entries())
        .filter(([, count]) => count >= minProviders)
        .sort((a, b) => a[0].localeCompare(b[0]));

      let urlCount = 0;
      let skippedNoSlug = 0;
      const excludedByThreshold = countryTypeCounts.size - qualifiedEntries.length;

      qualifiedEntries.forEach(([entry, providerCount]) => {
        const [isoCode, type] = entry.split('_');
        const rolePaths = type === 'lawyer' ? LAWYER_PATHS : EXPAT_PATHS;

        // Skip countries that aren't in COUNTRY_SLUGS at all — emitting a URL
        // for them would only be possible via an ISO-code fallback (e.g.
        // /lawyers/cu), which 301-redirects to the canonical and shows up in
        // GSC as "Page avec redirection". The fr slug is always present in the
        // synced map and is the fallback used for x-default below.
        if (!COUNTRY_SLUGS[isoCode] || !COUNTRY_SLUGS[isoCode]['fr']) {
          skippedNoSlug++;
          return;
        }

        // Dynamic priority based on provider count
        const priority = providerCount >= 5 ? '0.9' : '0.7';

        languagesToGenerate.forEach(lang => {
          const countrySlug = getCountrySlug(isoCode, lang);
          if (!countrySlug) return; // skip URLs for languages that lack a canonical slug

          const locale = getLocaleString(lang);
          const rolePath = rolePaths[lang] || rolePaths['en'];
          const url = `${SITE_URL}/${locale}/${rolePath}/${countrySlug}`;

          // Hreflang reciprocity: only emit alternates for languages that have
          // their own canonical slug — silently dropping a hreflang is safer
          // than pointing it at a redirecting URL.
          const hreflangs = LANGUAGES
            .map(hrefLang => {
              const hrefCountrySlug = getCountrySlug(isoCode, hrefLang);
              if (!hrefCountrySlug) return null;
              const hrefLocale = getLocaleString(hrefLang);
              const hrefRolePath = rolePaths[hrefLang] || rolePaths['en'];
              return `    <xhtml:link rel="alternate" hreflang="${getHreflangCode(hrefLang)}" href="${escapeXml(`${SITE_URL}/${hrefLocale}/${hrefRolePath}/${hrefCountrySlug}`)}"/>`;
            })
            .filter((s): s is string => s !== null)
            .join('\n');

          const defaultLocale = getLocaleString('fr');
          const defaultRolePath = rolePaths['fr'] || rolePaths['en'];
          const defaultCountrySlug = getCountrySlug(isoCode, 'fr')!; // gated above
          const xDefaultUrl = `${SITE_URL}/${defaultLocale}/${defaultRolePath}/${defaultCountrySlug}`;

          urlBlocks.push(`  <url>
    <loc>${escapeXml(url)}</loc>
${hreflangs}
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(xDefaultUrl)}"/>
    <changefreq>daily</changefreq>
    <priority>${priority}</priority>
    <lastmod>${today}</lastmod>
  </url>`);

          urlCount++;
        });
      });

      urlBlocks.push(`</urlset>`);
      const xml = urlBlocks.join('\n');

      res.set('Content-Type', 'application/xml; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=21600');
      res.status(200).send(xml);

      const langLabel = filterLang ? ` (lang=${filterLang})` : ' (all langs)';
      console.log(`✅ Sitemap country listings${langLabel}: ${qualifiedEntries.length} qualified combos (${excludedByThreshold} excluded by threshold, ${skippedNoSlug} skipped no canonical slug, min ${minProviders} providers), ${urlCount} URLs from ${snapshot.docs.length} providers`);

    } catch (error: unknown) {
      const err = error as Error;
      console.error('❌ Erreur sitemap country listings:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });
      res.status(500).send(`Error generating country listings sitemap: ${err.message}`);
    }
  }
);

// ============================================
// 📋 SITEMAP INDEX — Dynamic index listing all segmented sitemaps
// Returns a sitemapindex XML listing per-language sitemaps
// Replaces the static sitemap.xml for better crawl targeting
// ============================================
export const sitemapIndex = onRequest(
  {
    region: 'europe-west1',
    memory: '256MiB',
    cpu: 0.5,
    timeoutSeconds: 60,
    maxInstances: 3,
    minInstances: 1,
    invoker: 'public',
    serviceAccount: 'firebase-adminsdk-fbsvc@sos-urgently-ac307.iam.gserviceaccount.com',
  },
  async (_req, res) => {
    try {
      // All language codes used in sitemap file names (URL-safe)
      const LANG_CODES = ['fr', 'en', 'es', 'de', 'pt', 'ru', 'zh', 'ar', 'hi'];

      // Dedupe by URL — master index must not list the same sitemap twice
      const seenUrls = new Set<string>();
      const sitemapBlocks: string[] = [];

      // Per-sitemap lastmod. Previously all 638 sub-sitemaps were stamped with
      // the same `today` date, giving GSC no signal about which sub-sitemap
      // actually changed. Result: GSC processed only 2 of 638 children in the
      // first several days, leaving ~25 000 URLs undiscovered.
      //
      // SEO FIX 2026-04-22 (P1-I): `lastmod` is now OPTIONAL. If the caller
      // does not provide a real last-modified date, we OMIT the <lastmod>
      // tag instead of stamping `today`. Lying with today on every sub-sitemap
      // gave GSC noise ("everything changed today") and it effectively
      // ignored the signal. Omitting lets Google use its own crawl heuristic
      // for Firebase-exclusive sub-sitemaps (profiles/listings/help/faq) while
      // preserving the real lastmods parsed from the Laravel blog's sitemap.xml
      // (see the block below around line 1220 where blogLastmod is honoured).
      const addSitemap = (url: string, lastmod?: string) => {
        if (seenUrls.has(url)) return;
        seenUrls.add(url);
        const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
        sitemapBlocks.push(`  <sitemap>
    <loc>${url}</loc>${lastmodTag}
  </sitemap>`);
      };

      // ── Firebase-exclusive sitemaps (SPA content) ─────────────────────
      // Static pages (single file, all languages)
      addSitemap(`${SITE_URL}/sitemap-static.xml`);

      // Per-language: profiles (lawyers + expats), listings (country pages), help
      for (const lang of LANG_CODES) {
        addSitemap(`${SITE_URL}/sitemaps/profiles-${lang}.xml`);
      }
      for (const lang of LANG_CODES) {
        addSitemap(`${SITE_URL}/sitemaps/listings-${lang}.xml`);
      }
      for (const lang of LANG_CODES) {
        addSitemap(`${SITE_URL}/sitemaps/help-${lang}.xml`);
      }

      // FAQ (single sitemap, small enough)
      addSitemap(`${SITE_URL}/sitemaps/faq.xml`);

      // Legacy sitemaps REMOVED from index — they duplicate the per-lang
      // sitemaps above (profiles-{lang}, listings-{lang}, help-{lang}).
      // Keeping them in the index caused ~3 961 duplicate URLs which
      // confused Google and contributed to de-indexation.
      // The functions still respond (backward compat for any cached GSC
      // references), but they are no longer advertised in the master index.

      // ── Blog Laravel sitemaps (fetched at runtime) ────────────────────
      // The blog regenerates sitemap.xml dynamically (articles, categories,
      // tags, countries, guides, programme, news, priority country-campaign,
      // images, etc.). Fetching and merging them here makes sitemap-index.xml
      // the single master that covers 100% of the site.
      //
      // News articles are automatically picked up since the blog regenerates
      // its sitemap.xml on each request with the latest published articles.
      //
      // Fallback: if the blog is unreachable, we still serve the Firebase-only
      // sitemaps (degraded but never fails).
      let blogCount = 0;
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        const blogResponse = await fetch(`${SITE_URL}/sitemap.xml`, {
          headers: { 'Accept': 'application/xml' },
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (blogResponse.ok) {
          const blogXml = await blogResponse.text();
          // Parse each <sitemap>…</sitemap> block to preserve its own <lastmod>.
          // The blog's SeoController emits proper per-sub-sitemap lastmods
          // (based on Article/Category/etc. updated_at — see
          // Blog_sos-expat_frontend/app/Http/Controllers/SeoController.php).
          // Honouring them here signals to GSC which sub-sitemaps actually
          // changed since its last crawl.
          // Patterns of broken sub-sitemaps emitted by the Laravel blog's
          // sitemap.xml that don't actually exist on the server (return 404
          // or fall through to the SPA HTML). Confirmed broken on 2026-05-02
          // for /sitemaps/countries-{lang}.xml and /sitemaps/priority-{lang}.xml
          // (all 9 langs each = 18 broken entries). Excluding them from the
          // master index prevents Bing/Google from registering 404s on the
          // sub-sitemaps and losing trust in the index. The proper fix is
          // server-side in the Laravel blog's SeoController, but until then
          // this filter keeps the index clean.
          //
          // 2026-05-02 (+1h): also excluded /sitemap-news.xml — Laravel emits
          // an empty <urlset></urlset> (0 <url> children), which Bing rejects
          // as malformed ("Balise XML manquante : url"). Once Laravel
          // populates Google News articles, this exclusion can be removed.
          const BROKEN_SUBSITEMAP_RE = /\/sitemaps\/(countries|priority)-[a-z]{2}\.xml(\.gz)?$|\/sitemap-news\.xml$/i;

          const blockRegex = /<sitemap>\s*<loc>([^<]+)<\/loc>\s*(?:<lastmod>([^<]+)<\/lastmod>\s*)?<\/sitemap>/g;
          let match: RegExpExecArray | null;
          while ((match = blockRegex.exec(blogXml)) !== null) {
            const url = match[1].trim();
            const blogLastmod = (match[2] || '').trim();
            // Safety: only include URLs that point to our canonical domain
            if (url.startsWith(SITE_URL) && !BROKEN_SUBSITEMAP_RE.test(url)) {
              const before = seenUrls.size;
              // Keep only the YYYY-MM-DD date portion to match Firebase
              // sub-sitemaps' format (sitemaps.org accepts both full W3C
              // datetime and bare date; staying uniform avoids false
              // positives in GSC's "no changes" comparison).
              //
              // SEO FIX 2026-04-22 (P1-I): fall back to `undefined` instead of
              // `today` when Laravel didn't emit a lastmod — omitting the tag
              // is more honest than stamping a fake date (Google is better at
              // estimating freshness from its own crawl than from our lies).
              const normalizedLastmod = blogLastmod
                ? blogLastmod.substring(0, 10)
                : undefined;
              addSitemap(url, normalizedLastmod);
              if (seenUrls.size > before) blogCount++;
            }
          }
        } else {
          console.warn(`[sitemapIndex] Blog sitemap fetch returned ${blogResponse.status}, serving Firebase-only`);
        }
      } catch (fetchErr) {
        const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        console.warn(`[sitemapIndex] Blog sitemap fetch failed: ${msg}, serving Firebase-only`);
      }

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapBlocks.join('\n')}
</sitemapindex>`;

      res.set('Content-Type', 'application/xml; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=21600');
      res.status(200).send(xml);

      console.log(`✅ Master sitemap index: ${sitemapBlocks.length} unique sitemaps (${blogCount} from blog, ${sitemapBlocks.length - blogCount} from Firebase)`);

    } catch (error: unknown) {
      const err = error as Error;
      console.error('❌ Erreur sitemap index:', err.message);
      res.status(500).send(`Error generating sitemap index: ${err.message}`);
    }
  }
);