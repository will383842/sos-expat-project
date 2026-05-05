/**
 * Auto-Indexing Triggers
 * Se déclenche automatiquement quand une nouvelle page est créée
 */

import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { submitToIndexNow, generateBlogUrls, generateLandingUrls, generateFaqUrls } from './indexNowService';
import { pingSitemap, pingCustomSitemap } from './sitemapPingService';
import { submitBatchToGoogleIndexing } from './googleIndexingService';
import { invalidateCache } from './dynamicRender';
import * as admin from 'firebase-admin';
import { TELEGRAM_BOT_TOKEN } from '../lib/secrets';
import { sendTelegramMessageDirect } from '../telegram/providers/telegramBot';
import { COUNTRY_SLUG_TRANSLATIONS } from '../data/country-slug-translations';

const REGION = 'europe-west1';
const SITE_URL = 'https://sos-expat.com';
const LANGUAGES = ['fr', 'en', 'de', 'es', 'pt', 'ru', 'ch', 'ar', 'hi'];

// ============================================
// 🧑‍⚖️ TRIGGER: Nouveau profil prestataire créé
// ============================================
export const onProfileCreated = onDocumentCreated(
  {
    document: 'sos_profiles/{profileId}',
    region: REGION,
    memory: '256MiB',
    cpu: 0.083,
    timeoutSeconds: 60,
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log('❌ Pas de données dans le snapshot');
      return;
    }

    const profile = snapshot.data();
    const profileId = event.params.profileId;

    console.log(`📤 Nouveau profil détecté: ${profileId}`);
    console.log(`   Type: ${profile.role || profile.type}`);
    console.log(`   Slug: ${profile.slug}`);
    console.log(`   Visible: ${profile.isVisible}`);
    console.log(`   Approuvé: ${profile.isApproved}`);

    // AAA profiles are real providers — index them normally

    // Vérifier que le profil est visible et approuvé
    if (!profile.isVisible || !profile.isApproved) {
      console.log('⏭️ Profil non visible ou non approuvé, indexation différée');
      return;
    }

    // Construire les URLs pour toutes les langues
    const urls = generateProfileUrlsFromData(profile);

    if (urls.length === 0) {
      console.log('❌ Impossible de générer les URLs (slug manquant?)');
      return;
    }

    // ✅ Prioriser FR + EN pour Google API (quota limité à 10 URLs)
    // IndexNow reçoit TOUTES les langues (illimité)
    const slugs = profile.slugs as Record<string, string> | undefined;
    const priorityUrls: string[] = [];
    if (slugs?.fr) priorityUrls.push(`${SITE_URL}/${slugs.fr}`);
    if (slugs?.en) priorityUrls.push(`${SITE_URL}/${slugs.en}`);
    // Compléter avec les autres langues jusqu'à 10
    const remainingUrls = urls.filter(u => !priorityUrls.includes(u));
    const googleUrls = [...priorityUrls, ...remainingUrls].slice(0, 10);

    console.log(`🔗 URLs à indexer: ${urls.length} (Google priorité: FR+EN first)`);

    // 1. Soumettre à IndexNow (Bing/Yandex) - instantané, TOUTES les langues
    const indexNowResult = await submitToIndexNow(urls);

    // 2. Soumettre à Google Indexing API (max 10 URLs, FR+EN prioritaires)
    const googleResult = await submitBatchToGoogleIndexing(googleUrls, 10);

    // 3. Ping sitemap (Google fallback) - rapide
    await pingSitemap();

    // 4. Logger le résultat
    await logIndexingEvent('profile', profileId, urls, {
      ...indexNowResult,
      googleSuccess: googleResult.successCount,
      googleErrors: googleResult.errorCount,
    });

    console.log(`✅ Indexation lancée pour profil ${profileId} (IndexNow: ${indexNowResult.success}, Google: ${googleResult.successCount}/${urls.slice(0, 10).length})`);

    // 5. Soumettre les URLs de listing pays
    await submitCountryListingUrls(profile, profileId, 'profile_country');

    // NOTE: AI SEO generation (generateProviderSEOCallable) is triggered manually by admin
    // Auto-trigger via Cloud Tasks can be added in phase 2 when the system is validated
  }
);

// ============================================
// 🧑‍⚖️ TRIGGER: Profil prestataire mis à jour
// ============================================
export const onProfileUpdated = onDocumentUpdated(
  {
    document: 'sos_profiles/{profileId}',
    region: REGION,
    // P0 HOTFIX 2026-05-03: bump 256→512MiB + cpu 0.083→0.167. OOM récurrent depuis 2026-04-29
    // (256 MiB exceeded with 256 MiB used). Le bundle SEO + Firestore + cache invalidation tape
    // pile à la limite. C'est la fonction la plus fréquemment OOM-killée du projet.
    memory: '512MiB',
    cpu: 0.167,
    timeoutSeconds: 60,
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const profileId = event.params.profileId;

    if (!before || !after) return;

    // Invalider le cache SSR pour ce profil (toutes les langues)
    const slugs = after.slugs as Record<string, string> | undefined;
    if (slugs) {
      Object.values(slugs).forEach(slug => {
        if (slug) invalidateCache(slug);
      });
      console.log(`🗑️ Cache SSR invalidé pour profil ${profileId}`);
    } else if (after.slug) {
      invalidateCache(after.slug as string);
      console.log(`🗑️ Cache SSR invalidé pour profil ${profileId} (legacy slug)`);
    }

    // AAA profiles are real providers — index them normally

    // Vérifier si le profil vient d'être publié
    const wasHidden = !before.isVisible || !before.isApproved;
    const isNowPublic = after.isVisible && after.isApproved;

    if (wasHidden && isNowPublic) {
      console.log(`📤 Profil ${profileId} vient d'être publié, indexation...`);

      const urls = generateProfileUrlsFromData(after);

      if (urls.length > 0) {
        // Soumettre en parallèle à IndexNow et Google
        const [indexNowResult, googleResult] = await Promise.all([
          submitToIndexNow(urls),
          submitBatchToGoogleIndexing(urls.slice(0, 10), 10),
        ]);
        await pingSitemap();
        await logIndexingEvent('profile_published', profileId, urls, {
          success: indexNowResult.success,
          urls,
          googleSuccess: googleResult.successCount,
        });

        // Soumettre les URLs de listing pays
        await submitCountryListingUrls(after, profileId, 'profile_published_country');
      }
    }
  }
);

// ============================================
// 📝 TRIGGER: Nouvel article de blog créé
// ============================================
export const onBlogPostCreated = onDocumentCreated(
  {
    document: 'blog_posts/{postId}',
    region: REGION,
    memory: '256MiB',
    cpu: 0.083,
    timeoutSeconds: 60,
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const post = snapshot.data();
    const postId = event.params.postId;

    console.log(`📝 Nouvel article de blog: ${postId}`);

    // Vérifier que l'article est publié
    if (post.status !== 'published' && !post.isPublished) {
      console.log('⏭️ Article non publié, indexation différée');
      return;
    }

    const slug = post.slug || postId;
    const urls = generateBlogUrls(slug);

    console.log(`🔗 URLs blog à indexer: ${urls.length}`);

    // Soumettre en parallèle à IndexNow et Google
    const [indexNowResult, googleResult] = await Promise.all([
      submitToIndexNow(urls),
      submitBatchToGoogleIndexing(urls, 9), // 9 langues = 9 URLs max
    ]);
    await pingSitemap();
    await logIndexingEvent('blog', postId, urls, {
      success: indexNowResult.success,
      urls,
      googleSuccess: googleResult.successCount,
    });

    console.log(`✅ Article de blog ${postId} indexé (Google: ${googleResult.successCount}/${urls.length})`);
  }
);

// ============================================
// 📝 TRIGGER: Article de blog publié
// ============================================
export const onBlogPostUpdated = onDocumentUpdated(
  {
    document: 'blog_posts/{postId}',
    region: REGION,
    memory: '256MiB',
    cpu: 0.083,
    timeoutSeconds: 60,
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const postId = event.params.postId;

    if (!before || !after) return;

    const wasUnpublished = before.status !== 'published' && !before.isPublished;
    const isNowPublished = after.status === 'published' || after.isPublished;

    // Invalider le cache SSR si le contenu a changé (même sans transition de publication)
    const slug = after.slug || postId;
    if (slug) {
      invalidateCache(slug);
      console.log(`🗑️ Cache SSR invalidé pour blog ${postId}`);
    }

    if (wasUnpublished && isNowPublished) {
      console.log(`📝 Article ${postId} vient d'être publié`);

      const urls = generateBlogUrls(slug);

      const [indexNowResult, googleResult] = await Promise.all([
        submitToIndexNow(urls),
        submitBatchToGoogleIndexing(urls, 9),
      ]);
      await pingSitemap();
      await logIndexingEvent('blog_published', postId, urls, {
        success: indexNowResult.success,
        urls,
        googleSuccess: googleResult.successCount,
      });

      console.log(`✅ Article ${postId} indexé après publication (Google: ${googleResult.successCount}/${urls.length})`);
    }
  }
);

// ============================================
// 📚 TRIGGER: Nouvel article du Centre d'aide créé
// ============================================
export const onHelpArticleCreated = onDocumentCreated(
  {
    document: 'help_articles/{articleId}',
    region: REGION,
    memory: '256MiB',
    cpu: 0.083,
    timeoutSeconds: 60,
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const article = snapshot.data();
    const articleId = event.params.articleId;

    console.log(`📚 Nouvel article centre d'aide: ${articleId}`);

    // Vérifier que l'article est publié
    if (!article.isPublished && article.status !== 'published') {
      console.log('⏭️ Article non publié, indexation différée');
      return;
    }

    const slug = article.slug || articleId;
    const urls = generateHelpCenterUrls(slug);

    console.log(`🔗 URLs help center à indexer: ${urls.length}`);

    // Soumettre en parallèle à IndexNow et Google
    const [indexNowResult, googleResult] = await Promise.all([
      submitToIndexNow(urls),
      submitBatchToGoogleIndexing(urls, 9),
    ]);
    await pingSitemap();
    await logIndexingEvent('help_article', articleId, urls, {
      success: indexNowResult.success,
      urls,
      googleSuccess: googleResult.successCount,
    });

    console.log(`✅ Article centre d'aide ${articleId} indexé (Google: ${googleResult.successCount}/${urls.length})`);
  }
);

// ============================================
// 📚 TRIGGER: Article du Centre d'aide publié
// ============================================
export const onHelpArticleUpdated = onDocumentUpdated(
  {
    document: 'help_articles/{articleId}',
    region: REGION,
    memory: '256MiB',
    cpu: 0.083,
    timeoutSeconds: 60,
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const articleId = event.params.articleId;

    if (!before || !after) return;

    // Invalider le cache SSR si le contenu a changé
    const slug = after.slug || articleId;
    if (slug) {
      invalidateCache(slug);
      console.log(`🗑️ Cache SSR invalidé pour help article ${articleId}`);
    }

    const wasUnpublished = !before.isPublished && before.status !== 'published';
    const isNowPublished = after.isPublished || after.status === 'published';

    if (wasUnpublished && isNowPublished) {
      console.log(`📚 Article centre d'aide ${articleId} vient d'être publié`);

      const urls = generateHelpCenterUrls(slug);

      const [indexNowResult, googleResult] = await Promise.all([
        submitToIndexNow(urls),
        submitBatchToGoogleIndexing(urls, 9),
      ]);
      await pingSitemap();
      await logIndexingEvent('help_article_published', articleId, urls, {
        success: indexNowResult.success,
        urls,
        googleSuccess: googleResult.successCount,
      });
    }
  }
);

// ============================================
// 🎯 TRIGGER: Nouvelle landing page créée
// ============================================
export const onLandingPageCreated = onDocumentCreated(
  {
    document: 'landing_pages/{pageId}',
    region: REGION,
    memory: '256MiB',
    cpu: 0.083,
    timeoutSeconds: 60,
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const page = snapshot.data();
    const pageId = event.params.pageId;

    console.log(`🎯 Nouvelle landing page: ${pageId}`);

    if (!page.isActive) {
      console.log('⏭️ Landing page inactive, indexation différée');
      return;
    }

    const slug = page.slug || pageId;
    const urls = generateLandingUrls(slug);

    console.log(`🔗 URLs landing à indexer: ${urls.length}`);

    const [indexNowResult, googleResult] = await Promise.all([
      submitToIndexNow(urls),
      submitBatchToGoogleIndexing(urls, 9),
    ]);
    await pingSitemap();
    await logIndexingEvent('landing', pageId, urls, {
      success: indexNowResult.success,
      urls,
      googleSuccess: googleResult.successCount,
    });

    console.log(`✅ Landing page ${pageId} indexée (Google: ${googleResult.successCount}/${urls.length})`);
  }
);

// ============================================
// 🎯 TRIGGER: Landing page mise à jour (activation)
// ============================================
export const onLandingPageUpdated = onDocumentUpdated(
  {
    document: 'landing_pages/{pageId}',
    region: REGION,
    memory: '256MiB',
    cpu: 0.083,
    timeoutSeconds: 60,
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const pageId = event.params.pageId;

    if (!before || !after) return;

    // Invalider le cache SSR si le contenu a changé
    const slug = after.slug || pageId;
    if (slug) {
      invalidateCache(slug);
      console.log(`🗑️ Cache SSR invalidé pour landing ${pageId}`);
    }

    const wasInactive = !before.isActive;
    const isNowActive = after.isActive;

    if (wasInactive && isNowActive) {
      console.log(`🎯 Landing page ${pageId} vient d'être activée`);

      const urls = generateLandingUrls(slug);

      const [indexNowResult, googleResult] = await Promise.all([
        submitToIndexNow(urls),
        submitBatchToGoogleIndexing(urls, 9),
      ]);
      await pingSitemap();
      await logIndexingEvent('landing_activated', pageId, urls, {
        success: indexNowResult.success,
        urls,
        googleSuccess: googleResult.successCount,
      });

      console.log(`✅ Landing page ${pageId} indexée après activation (Google: ${googleResult.successCount}/${urls.length})`);
    }
  }
);

// ============================================
// ❓ TRIGGER: Nouveau FAQ créé
// ============================================
export const onFaqCreated = onDocumentCreated(
  {
    document: 'faqs/{faqId}',
    region: REGION,
    memory: '256MiB',
    cpu: 0.083,
    timeoutSeconds: 60,
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const faq = snapshot.data();
    const faqId = event.params.faqId;

    console.log(`❓ Nouveau FAQ: ${faqId}`);

    // Vérifier que le FAQ est actif
    if (!faq.isActive) {
      console.log('⏭️ FAQ inactif, indexation différée');
      return;
    }

    const slug = typeof faq.slug === 'object' ? (faq.slug?.fr || faq.slug?.en || faqId) : (faq.slug || faqId);
    const urls = generateFaqUrls(slug);

    console.log(`🔗 URLs FAQ à indexer: ${urls.length}`);

    // Soumettre en parallèle à IndexNow et Google
    const [indexNowResult, googleResult] = await Promise.all([
      submitToIndexNow(urls),
      submitBatchToGoogleIndexing(urls, 9),
    ]);
    await pingSitemap();
    await logIndexingEvent('faq', faqId, urls, {
      success: indexNowResult.success,
      urls,
      googleSuccess: googleResult.successCount,
    });

    console.log(`✅ FAQ ${faqId} indexé (Google: ${googleResult.successCount}/${urls.length})`);
  }
);

// ============================================
// ❓ TRIGGER: FAQ mis à jour (activation)
// ============================================
export const onFaqUpdated = onDocumentUpdated(
  {
    document: 'faqs/{faqId}',
    region: REGION,
    memory: '256MiB',
    cpu: 0.083,
    timeoutSeconds: 60,
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const faqId = event.params.faqId;

    if (!before || !after) return;

    // Invalider le cache SSR si le contenu a changé
    const faqSlug = typeof after.slug === 'object' ? (after.slug?.fr || after.slug?.en || faqId) : (after.slug || faqId);
    if (faqSlug) {
      invalidateCache(faqSlug);
      console.log(`🗑️ Cache SSR invalidé pour FAQ ${faqId}`);
    }

    const wasInactive = !before.isActive;
    const isNowActive = after.isActive;

    if (wasInactive && isNowActive) {
      console.log(`❓ FAQ ${faqId} vient d'être activé`);

      const urls = generateFaqUrls(faqSlug);

      const [indexNowResult, googleResult] = await Promise.all([
        submitToIndexNow(urls),
        submitBatchToGoogleIndexing(urls, 9),
      ]);
      await pingSitemap();
      await logIndexingEvent('faq_activated', faqId, urls, {
        success: indexNowResult.success,
        urls,
        googleSuccess: googleResult.successCount,
      });

      console.log(`✅ FAQ ${faqId} indexé après activation`);
    }
  }
);

// ============================================
// ⏰ SCHEDULED: Ping sitemap toutes les heures
// ============================================
export const scheduledSitemapPing = onSchedule(
  {
    // 2025-01-16: Réduit à 1×/jour à 8h pour économies maximales (low traffic)
    schedule: '0 8 * * *', // 8h Paris tous les jours
    region: REGION,
    memory: '256MiB',
    cpu: 0.083,
    timeoutSeconds: 60,
  },
  async () => {
    console.log('⏰ Ping sitemap programmé...');

    // Ping tous les sitemaps dynamiques quotidiennement (inconditionnellement)
    // Note: Google a supprimé /ping?sitemap= en juin 2023, Bing reste actif
    await Promise.all([
      pingSitemap(),
      pingCustomSitemap('https://europe-west1-sos-urgently-ac307.cloudfunctions.net/sitemapProfiles'),
      pingCustomSitemap('https://europe-west1-sos-urgently-ac307.cloudfunctions.net/sitemapHelp'),
      pingCustomSitemap('https://europe-west1-sos-urgently-ac307.cloudfunctions.net/sitemapFaq'),
    ]);
    console.log('✅ Ping sitemaps terminé');
  }
);

// ============================================
// 🚀 SCHEDULED: Indexation accélérée quotidienne (200 URLs/jour)
// ============================================
export const scheduledBulkIndexing = onSchedule(
  {
    schedule: '0 9 * * *', // 9h Paris tous les jours (1h après ping sitemap)
    region: REGION,
    memory: '512MiB',
    cpu: 0.25,
    timeoutSeconds: 300, // 5 min max (200 URLs × 100ms delay = ~20s)
  },
  async () => {
    console.log('🚀 Indexation accélérée quotidienne...');

    const db = admin.firestore();
    const DAILY_QUOTA = 200;

    // Récupérer le curseur de la dernière exécution
    const stateDoc = await db.collection('admin_config').doc('bulk_indexing_state').get();
    const state = stateDoc.exists ? stateDoc.data() : null;
    const lastProcessedId = state?.lastProcessedId || null;
    const totalSubmitted = state?.totalSubmitted || 0;

    // Récupérer les profils visibles et approuvés pas encore soumis
    let query = db.collection('sos_profiles')
      .where('isVisible', '==', true)
      .where('isApproved', '==', true)
      .where('isActive', '==', true)
      .orderBy('__name__')
      .limit(DAILY_QUOTA);

    if (lastProcessedId) {
      query = query.startAfter(lastProcessedId);
    }

    const snapshot = await query.get();

    let activeDocs = snapshot.docs;
    let isCycleReset = false;

    if (snapshot.empty) {
      // Toutes les pages ont été soumises — recommencer le cycle depuis le début
      console.log(`✅ Cycle d'indexation complet (${totalSubmitted} URLs total). Redémarrage immédiat du cycle.`);
      isCycleReset = true;
      // Relancer depuis le début du cycle (sans filtre startAfter)
      const restartSnapshot = await db.collection('sos_profiles')
        .where('isVisible', '==', true)
        .where('isApproved', '==', true)
        .where('isActive', '==', true)
        .orderBy('__name__')
        .limit(DAILY_QUOTA)
        .get();

      if (restartSnapshot.empty) {
        console.log('⏭️ Aucun profil indexable trouvé, ping sitemap uniquement.');
        await pingSitemap();
        return;
      }

      activeDocs = restartSnapshot.docs;
    }

    // ✅ Sort profiles by quality score (best first) for optimal quota usage
    // High-quality profiles get indexed first in each cycle
    const sortedDocs = [...activeDocs].sort((a, b) => {
      const aData = a.data();
      const bData = b.data();
      // Simple score: reviews × rating + description length bonus
      const scoreA = (Number(aData.reviewCount ?? aData.realReviewsCount ?? 0) * Number(aData.averageRating ?? 0))
        + (String(aData.description ?? '').length > 200 ? 10 : 0);
      const scoreB = (Number(bData.reviewCount ?? bData.realReviewsCount ?? 0) * Number(bData.averageRating ?? 0))
        + (String(bData.description ?? '').length > 200 ? 10 : 0);
      return scoreB - scoreA; // DESC
    });

    // Collecter toutes les URLs (FR prioritaire par profil, puis autres langues)
    const urlsToSubmit: string[] = [];
    let lastId = '';

    for (const doc of sortedDocs) {
      const profile = doc.data();
      lastId = doc.id;

      // Skip admin profiles: they pass isApproved+isVisible+isActive filters but
      // ProviderProfile.tsx serves 404+noindex for role=admin (e.g. founder
      // accounts marked visible for internal reasons). Submitting them just
      // wastes Google API quota and creates soft-404 signals.
      if (profile.role === 'admin' || profile.isAdmin === true) {
        continue;
      }

      // Prioriser l'URL française (la plus importante pour SEO)
      const slugs = profile.slugs as Record<string, string> | undefined;
      if (slugs?.fr) {
        urlsToSubmit.push(`${SITE_URL}/${slugs.fr}`);
      } else if (slugs?.en) {
        urlsToSubmit.push(`${SITE_URL}/${slugs.en}`);
      } else if (profile.slug) {
        urlsToSubmit.push(`${SITE_URL}/${profile.slug}`);
      }

      // Si on a encore du quota, ajouter TOUTES les langues (9 au total)
      if (urlsToSubmit.length < DAILY_QUOTA && slugs) {
        for (const lang of ['en', 'es', 'de', 'pt', 'ru', 'ch', 'ar', 'hi'] as const) {
          if (slugs[lang] && urlsToSubmit.length < DAILY_QUOTA) {
            const url = `${SITE_URL}/${slugs[lang]}`;
            if (!urlsToSubmit.includes(url)) {
              urlsToSubmit.push(url);
            }
          }
        }
      }
    }

    // Also include help articles if we have remaining quota
    if (urlsToSubmit.length < DAILY_QUOTA) {
      const helpSnap = await db.collection('help_articles')
        .where('isPublished', '==', true)
        .limit(DAILY_QUOTA - urlsToSubmit.length)
        .get();

      const helpSegments: Record<string, string> = {
        fr: 'centre-aide', en: 'help-center', es: 'centro-ayuda', de: 'hilfezentrum',
        pt: 'centro-ajuda', ru: 'tsentr-pomoshchi', ch: 'bangzhu-zhongxin',
        hi: 'sahayata-kendra', ar: 'markaz-almusaeada',
      };
      const defaultCountries: Record<string, string> = {
        fr: 'fr', en: 'us', es: 'es', de: 'de', pt: 'pt', ru: 'ru', ch: 'cn', hi: 'in', ar: 'sa',
      };

      for (const doc of helpSnap.docs) {
        if (urlsToSubmit.length >= DAILY_QUOTA) break;
        const article = doc.data();
        const slugs = article.slugs as Record<string, string> | undefined;
        if (slugs) {
          for (const [lang, slug] of Object.entries(slugs)) {
            if (slug && urlsToSubmit.length < DAILY_QUOTA && helpSegments[lang]) {
              const urlLang = lang === 'ch' ? 'zh' : lang;
              urlsToSubmit.push(`${SITE_URL}/${urlLang}-${defaultCountries[lang]}/${helpSegments[lang]}/${slug}`);
            }
          }
        } else if (article.slug) {
          // Single slug — submit for FR only
          urlsToSubmit.push(`${SITE_URL}/fr-fr/centre-aide/${article.slug}`);
        }
      }
      console.log(`📚 Ajout articles aide: total ${urlsToSubmit.length} URLs`);
    }

    // Add country listing pages (e.g. /fr-fr/avocats/cambodge) to the cycle.
    // Uses a separate cursor (lastListingIdx) so listings rotate independently
    // of profiles. Listings are derived only from countries that have ≥1
    // indexable provider, so we never submit empty pages that would noindex.
    let nextListingIdx = state?.lastListingIdx || 0;
    if (urlsToSubmit.length < DAILY_QUOTA) {
      try {
        const allProfilesSnap = await db.collection('sos_profiles')
          .where('isVisible', '==', true)
          .where('isApproved', '==', true)
          .where('isActive', '==', true)
          .get();

        const countriesByRole: Record<'lawyer' | 'expat', Set<string>> = {
          lawyer: new Set(),
          expat: new Set(),
        };
        allProfilesSnap.forEach(d => {
          const p = d.data();
          const role: 'lawyer' | 'expat' = (p.type === 'lawyer') ? 'lawyer' : 'expat';
          if (p.country) countriesByRole[role].add(String(p.country).toUpperCase());
          const opCountries = p.operatingCountries;
          if (Array.isArray(opCountries)) {
            for (const c of opCountries) {
              if (c) countriesByRole[role].add(String(c).toUpperCase());
            }
          }
        });

        const allListings: Array<{ role: 'lawyer' | 'expat'; country: string }> = [];
        for (const role of ['lawyer', 'expat'] as const) {
          const sortedCountries = Array.from(countriesByRole[role]).sort();
          for (const country of sortedCountries) {
            allListings.push({ role, country });
          }
        }

        let listingIdx = nextListingIdx >= allListings.length ? 0 : nextListingIdx;
        const startIdx = listingIdx;
        let listingsAdded = 0;

        while (urlsToSubmit.length < DAILY_QUOTA && listingIdx < allListings.length) {
          const { role, country } = allListings[listingIdx];
          const rolePaths = ROLE_PATHS[role];
          if (rolePaths) {
            for (const lang of LANG_CODES) {
              if (urlsToSubmit.length >= DAILY_QUOTA) break;
              const locale = DEFAULT_LOCALES[lang];
              const rolePath = rolePaths[lang];
              const countrySlug = getCountrySlug(country, lang);
              if (locale && rolePath && countrySlug) {
                const url = `${SITE_URL}/${locale}/${rolePath}/${countrySlug}`;
                if (!urlsToSubmit.includes(url)) {
                  urlsToSubmit.push(url);
                }
              }
            }
          }
          listingIdx++;
          listingsAdded++;
        }

        nextListingIdx = listingIdx >= allListings.length ? 0 : listingIdx;

        console.log(`🌍 Pages liste pays ajoutées: ${listingsAdded} pays traités (idx ${startIdx}→${listingIdx}/${allListings.length}), total ${urlsToSubmit.length} URLs`);
      } catch (err) {
        // Non-blocking: if listing generation fails, profile URLs are still submitted
        console.error(`⚠️ Erreur génération URLs pages liste pays (non bloquant): ${(err as Error).message}`);
      }
    }

    if (urlsToSubmit.length === 0) {
      console.log('⏭️ Aucune URL à soumettre (profils sans slugs)');
      return;
    }

    console.log(`📤 Soumission de ${urlsToSubmit.length} URLs à Google (quota: ${DAILY_QUOTA}/jour)...`);

    // Soumettre en parallèle à Google et IndexNow
    const [googleResult, indexNowResult] = await Promise.all([
      submitBatchToGoogleIndexing(urlsToSubmit.slice(0, DAILY_QUOTA), DAILY_QUOTA),
      submitToIndexNow(urlsToSubmit), // IndexNow est illimité
    ]);

    // Sauvegarder l'état pour la prochaine exécution
    // Si cycle reset: totalSubmitted repart de 0 pour ce nouveau cycle
    const newTotal = isCycleReset ? urlsToSubmit.length : totalSubmitted + urlsToSubmit.length;
    const stateToSave: Record<string, unknown> = {
      lastProcessedId: lastId,
      lastListingIdx: nextListingIdx,
      totalSubmitted: newTotal,
      lastRunAt: admin.firestore.FieldValue.serverTimestamp(),
      lastBatchSize: urlsToSubmit.length,
      googleSuccess: googleResult.successCount,
      googleErrors: googleResult.errorCount,
      indexNowSuccess: indexNowResult.success,
    };
    if (isCycleReset) {
      stateToSave.cycleResetAt = admin.firestore.FieldValue.serverTimestamp();
    }
    await db.collection('admin_config').doc('bulk_indexing_state').set(stateToSave);

    await logIndexingEvent('bulk_daily', 'scheduled', urlsToSubmit, {
      success: googleResult.successCount > 0,
      googleSuccess: googleResult.successCount,
      googleErrors: googleResult.errorCount,
      indexNowSuccess: indexNowResult.success,
    });

    console.log(`✅ Indexation accélérée: ${googleResult.successCount}/${urlsToSubmit.length} Google, IndexNow: ${indexNowResult.success}`);
    console.log(`📊 Progression totale: ${newTotal} URLs soumises depuis le début du cycle`);
  }
);

// ============================================
// 📊 SCHEDULED: Rapport SEO hebdomadaire (lundi 10h)
// ============================================
export const scheduledSeoHealthCheck = onSchedule(
  {
    schedule: '0 10 * * 1', // Lundi 10h Paris
    region: REGION,
    memory: '512MiB',
    cpu: 0.25,
    timeoutSeconds: 120,
    secrets: [TELEGRAM_BOT_TOKEN],
  },
  async () => {
    console.log('📊 Rapport SEO hebdomadaire...');

    const db = admin.firestore();
    const now = Date.now();
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    // 1. Compter les profils indexables vs total
    const [totalProfiles, indexableProfiles] = await Promise.all([
      db.collection('sos_profiles').count().get(),
      db.collection('sos_profiles')
        .where('isVisible', '==', true)
        .where('isApproved', '==', true)
        .where('isActive', '==', true)
        .count().get(),
    ]);

    const totalCount = totalProfiles.data().count;
    const indexableCount = indexableProfiles.data().count;

    // 2. Compter les profils SANS slugs (problème SEO)
    const allIndexable = await db.collection('sos_profiles')
      .where('isVisible', '==', true)
      .where('isApproved', '==', true)
      .where('isActive', '==', true)
      .select('slug', 'slugs')
      .get();

    let noSlugCount = 0;
    const noSlugIds: string[] = [];
    allIndexable.docs.forEach(doc => {
      const data = doc.data();
      const hasSlugs = data.slugs && typeof data.slugs === 'object' && Object.keys(data.slugs).length > 0;
      if (!hasSlugs && !data.slug) {
        noSlugCount++;
        if (noSlugIds.length < 5) noSlugIds.push(doc.id);
      }
    });

    // 3. Lire les logs d'indexation de la semaine
    const recentLogs = await db.collection('indexing_logs')
      .where('timestamp', '>=', oneWeekAgo)
      .get();

    let weekSuccessCount = 0;
    let weekErrorCount = 0;
    const errorTypes: Record<string, number> = {};

    recentLogs.docs.forEach(doc => {
      const log = doc.data();
      if (log.indexNowSuccess) weekSuccessCount++;
      else {
        weekErrorCount++;
        const errorKey = log.indexNowError || 'unknown';
        errorTypes[errorKey] = (errorTypes[errorKey] || 0) + 1;
      }
    });

    // 4. Lire l'état du bulk indexing
    const bulkState = await db.collection('admin_config').doc('bulk_indexing_state').get();
    const bulk = bulkState.exists ? bulkState.data() : null;

    // 5. Vérifier les sitemaps dynamiques (HTTP check)
    const sitemapUrls = [
      'https://europe-west1-sos-urgently-ac307.cloudfunctions.net/sitemapProfiles',
      'https://europe-west1-sos-urgently-ac307.cloudfunctions.net/sitemapHelp',
      'https://europe-west1-sos-urgently-ac307.cloudfunctions.net/sitemapFaq',
      // sitemapLanding supprimé — landing_pages collection vide, MC publie sur le blog
    ];

    const sitemapResults: { name: string; ok: boolean; status: number }[] = [];
    for (const url of sitemapUrls) {
      try {
        const resp = await fetch(url, { method: 'HEAD' });
        const name = url.split('/').pop() || url;
        sitemapResults.push({ name, ok: resp.ok, status: resp.status });
      } catch {
        const name = url.split('/').pop() || url;
        sitemapResults.push({ name, ok: false, status: 0 });
      }
    }

    const sitemapErrors = sitemapResults.filter(s => !s.ok);

    // 6. Construire le message Telegram
    const estimatedUrls = indexableCount * 9; // 9 langues
    const hasProblems = noSlugCount > 0 || weekErrorCount > 3 || sitemapErrors.length > 0;
    const statusEmoji = hasProblems ? '⚠️' : '✅';

    let message = `${statusEmoji} *Rapport SEO Hebdomadaire*\n\n`;
    message += `📄 *Pages indexables:* ${indexableCount} profils (${estimatedUrls} URLs)\n`;
    message += `📊 *Total profils:* ${totalCount} (${totalCount - indexableCount} en attente)\n\n`;

    // Bulk indexing progress
    if (bulk) {
      message += `🚀 *Indexation accélérée:*\n`;
      message += `  Soumises: ${bulk.totalSubmitted || 0} URLs\n`;
      message += `  Dernier batch: ${bulk.googleSuccess || 0}/${bulk.lastBatchSize || 0} Google OK\n\n`;
    }

    // Semaine recap
    message += `📈 *Cette semaine:*\n`;
    message += `  ${weekSuccessCount} soumissions OK, ${weekErrorCount} erreurs\n`;
    if (weekErrorCount > 0) {
      const topErrors = Object.entries(errorTypes).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(', ');
      message += `  Erreurs: ${topErrors}\n`;
    }
    message += '\n';

    // Sitemaps
    message += `🗺️ *Sitemaps:*\n`;
    sitemapResults.forEach(s => {
      message += `  ${s.ok ? '✅' : '❌'} ${s.name} (${s.status})\n`;
    });
    message += '\n';

    // Problèmes détectés
    if (noSlugCount > 0) {
      message += `⚠️ *${noSlugCount} profils sans slug!*\n`;
      message += `  IDs: ${noSlugIds.join(', ')}${noSlugCount > 5 ? '...' : ''}\n`;
      message += `  → Non indexables par Google\n\n`;
    }

    if (!hasProblems) {
      message += `✅ Aucun problème détecté. SEO OK!`;
    }

    // 7. Envoyer via Telegram
    try {
      const adminConfig = await db.collection('telegram_admin_config').doc('settings').get();
      const adminChatId = adminConfig.exists ? adminConfig.data()?.recipientChatId : null;

      if (adminChatId) {
        await sendTelegramMessageDirect(adminChatId, message, { parseMode: 'Markdown' });
        console.log('✅ Rapport SEO envoyé via Telegram');
      } else {
        console.warn('⚠️ Pas de chat ID admin configuré dans telegram_admin_config/settings');
      }
    } catch (error) {
      console.error('❌ Erreur envoi Telegram:', error);
    }

    // 8. Sauvegarder le rapport dans Firestore
    await db.collection('seo_health_reports').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      totalProfiles: totalCount,
      indexableProfiles: indexableCount,
      estimatedUrls,
      noSlugCount,
      noSlugIds,
      weekSuccessCount,
      weekErrorCount,
      errorTypes,
      sitemapStatus: sitemapResults,
      bulkIndexingState: bulk || null,
      hasProblems,
    });

    console.log(`📊 Rapport SEO: ${indexableCount} indexables, ${noSlugCount} sans slug, ${weekErrorCount} erreurs`);
  }
);

// ============================================
// 🔧 HELPERS
// ============================================

/**
 * Génère les URLs pour un profil à partir des données Firestore
 * Supporte les slugs multilingues (nouveau format) et le slug simple (legacy)
 */
function generateProfileUrlsFromData(profile: any): string[] {
  const urls: string[] = [];

  // Préfère les slugs multilingues si disponibles
  const slugs = profile.slugs as Record<string, string> | undefined;
  const hasSlugs = slugs && typeof slugs === 'object' && Object.keys(slugs).length > 0;

  // Skip si ni slugs multilingues ni slug simple
  if (!hasSlugs && !profile.slug) {
    return urls;
  }

  // Nouveau format avec slugs multilingues
  if (hasSlugs) {
    LANGUAGES.forEach(lang => {
      const slug = slugs[lang];
      if (slug) {
        // Le slug contient déjà le chemin complet avec locale
        // Ex: "fr-fr/avocat-thailand/julien-k7m2p9"
        urls.push(`${SITE_URL}/${slug}`);
      }
    });
  } else if (profile.slug) {
    // Ancien format: slug unique
    const legacySlug = profile.slug as string;

    // Détecter si le slug commence par un code langue valide
    const slugLang = legacySlug.split('/')[0];
    const isValidLang = LANGUAGES.includes(slugLang);

    if (isValidLang) {
      // Le slug commence par une langue, utiliser tel quel
      urls.push(`${SITE_URL}/${legacySlug}`);
    } else {
      // Slug sans préfixe langue, ajouter le préfixe pour chaque langue
      const countryCode = (profile.countryCode || profile.country || 'fr') as string;
      LANGUAGES.forEach(lang => {
        urls.push(`${SITE_URL}/${lang}-${countryCode.toLowerCase()}/${legacySlug}`);
      });
    }
  }

  return urls;
}

/**
 * Génère les URLs pour un article du Centre d'aide (9 langues)
 * Utilise les slugs traduits des routes
 */
function generateHelpCenterUrls(slug: string): string[] {
  // ⚠️ DOIT correspondre exactement aux routes dans localeRoutes.ts (frontend)
  const helpCenterSlugs: Record<string, string> = {
    fr: 'centre-aide',
    en: 'help-center',
    de: 'hilfezentrum',       // localeRoutes.ts: "hilfezentrum"
    es: 'centro-ayuda',
    pt: 'centro-ajuda',
    ru: 'tsentr-pomoshchi',   // localeRoutes.ts: "tsentr-pomoshchi"
    ch: 'bangzhu-zhongxin',
    ar: 'مركز-المساعدة',      // localeRoutes.ts: "مركز-المساعدة"
    hi: 'sahayata-kendra',
  };

  // Utilise le format locale complet (fr-fr, en-us, ...) et non le code court (fr, en, ...)
  const LANGUAGE_TO_COUNTRY_LOCAL: Record<string, string> = {
    fr: 'fr', en: 'us', es: 'es', de: 'de', ru: 'ru', pt: 'pt', ch: 'cn', hi: 'in', ar: 'sa',
  };
  return LANGUAGES.map(lang => {
    const country = LANGUAGE_TO_COUNTRY_LOCAL[lang] || lang;
    const urlLang = lang === 'ch' ? 'zh' : lang;
    const locale = `${urlLang}-${country}`;
    return `${SITE_URL}/${locale}/${helpCenterSlugs[lang] || 'help-center'}/${slug}`;
  });
}

// generateFaqUrls is imported from indexNowService (uses correct locale format)

// ============================================
// 🌍 HELPERS: Country listing URL generation
// ============================================

/** Role path translations for country listing pages */
const ROLE_PATHS: Record<string, Record<string, string>> = {
  lawyer: { fr: 'avocats', en: 'lawyers', es: 'abogados', de: 'anwaelte', pt: 'advogados', ru: 'advokaty', zh: 'lushi', ar: 'muhamun', hi: 'vakil' },
  expat: { fr: 'expatries', en: 'expats', es: 'expatriados', de: 'expats', pt: 'expatriados', ru: 'expaty', zh: 'haiwai', ar: 'mughtaribun', hi: 'videshi' },
};

/** Default locale suffixes per language */
const DEFAULT_LOCALES: Record<string, string> = {
  fr: 'fr-fr', en: 'en-us', es: 'es-es', de: 'de-de', pt: 'pt-pt', ru: 'ru-ru', zh: 'zh-cn', ar: 'ar-sa', hi: 'hi-in',
};

/**
 * Country slug per language. Source of truth: sos/src/data/country-slug-translations.ts
 * (synced into sos/firebase/functions/src/data/country-slug-translations.ts).
 *
 * Replaced an inline map of ~30 countries whose ISO-code fallback produced
 * URLs like /lawyers/cu, /anwaelte/bh that 301-redirected and showed up in
 * GSC as "Page avec redirection". Now uses the full 248-country map.
 */
const COUNTRY_SLUGS = COUNTRY_SLUG_TRANSLATIONS;

/** All supported language codes for URL generation */
const LANG_CODES = ['fr', 'en', 'es', 'de', 'pt', 'ru', 'zh', 'ar', 'hi'] as const;

/**
 * Get the canonical country slug for a given ISO code and language. Returns
 * null when no canonical slug exists, so callers skip URL emission instead of
 * pushing an ISO-code fallback that 301-redirects on the live site.
 */
function getCountrySlug(isoCode: string, lang: string): string | null {
  const slugs = COUNTRY_SLUGS[isoCode.toUpperCase()];
  return slugs?.[lang] || null;
}

/**
 * Generate country listing URLs for a provider and submit them to IndexNow + Google.
 * Collects all countries from `country` and `operatingCountries`, generates 9 language URLs
 * per country per role, and submits up to 20 URLs total.
 */
async function submitCountryListingUrls(
  profile: any,
  profileId: string,
  eventType: string,
): Promise<void> {
  try {
    // Determine the provider role
    const role = (profile.role || profile.type || '').toLowerCase();
    const normalizedRole = role === 'lawyer' || role === 'avocat' ? 'lawyer' : 'expat';
    const rolePaths = ROLE_PATHS[normalizedRole];
    if (!rolePaths) {
      console.log(`⏭️ Country listing: rôle inconnu "${role}", pas d'URLs pays`);
      return;
    }

    // Collect unique country ISO codes from country + operatingCountries
    const countryCodes = new Set<string>();

    const mainCountry = (profile.country || profile.countryCode || '') as string;
    if (mainCountry) {
      countryCodes.add(mainCountry.toUpperCase());
    }

    const operatingCountries = profile.operatingCountries as string[] | undefined;
    if (Array.isArray(operatingCountries)) {
      for (const c of operatingCountries) {
        if (c) countryCodes.add(c.toUpperCase());
      }
    }

    if (countryCodes.size === 0) {
      console.log(`⏭️ Country listing: aucun pays trouvé pour profil ${profileId}`);
      return;
    }

    // Generate URLs: /{locale}/{rolePath}/{countrySlug} for each country × language
    const MAX_COUNTRY_URLS = 20;
    const countryUrls: string[] = [];
    const countryArray = Array.from(countryCodes);

    for (const countryCode of countryArray) {
      for (const lang of LANG_CODES) {
        if (countryUrls.length >= MAX_COUNTRY_URLS) break;

        const locale = DEFAULT_LOCALES[lang];
        const rolePath = rolePaths[lang];
        const countrySlug = getCountrySlug(countryCode, lang);

        if (locale && rolePath && countrySlug) {
          countryUrls.push(`${SITE_URL}/${locale}/${rolePath}/${countrySlug}`);
        }
      }
      if (countryUrls.length >= MAX_COUNTRY_URLS) break;
    }

    if (countryUrls.length === 0) {
      console.log(`⏭️ Country listing: aucune URL générée pour profil ${profileId}`);
      return;
    }

    console.log(`🌍 Country listing URLs à indexer pour ${profileId}: ${countryUrls.length}`);
    countryUrls.forEach(url => console.log(`   → ${url}`));

    // Submit to IndexNow and Google in parallel
    const [indexNowResult, googleResult] = await Promise.all([
      submitToIndexNow(countryUrls),
      submitBatchToGoogleIndexing(countryUrls.slice(0, 10), 10),
    ]);

    await logIndexingEvent(eventType, profileId, countryUrls, {
      success: indexNowResult.success,
      urls: countryUrls,
      googleSuccess: googleResult.successCount,
      googleErrors: googleResult.errorCount,
    });

    console.log(`✅ Country listing indexé pour ${profileId}: IndexNow=${indexNowResult.success}, Google=${googleResult.successCount}/${countryUrls.slice(0, 10).length}`);
  } catch (error) {
    console.error(`❌ Erreur soumission country listing pour ${profileId}:`, error);
  }
}

// ============================================
// 🔥 CRON: Préchauffage cache SSR toutes les 20h
// Lit le sitemap live → couvre automatiquement toutes les pages y compris futures
// ============================================
const SSR_FUNCTION_URL = 'https://europe-west1-sos-urgently-ac307.cloudfunctions.net/renderForBotsV2';
const SITEMAP_STATIC_URL = 'https://sos-expat.com/sitemap-static.xml';

/**
 * Extrait tous les <loc> d'un sitemap XML et retourne les chemins (sans domaine).
 * Exclut les URLs non-sos-expat.com et les assets statiques.
 */
async function fetchSitemapPaths(sitemapUrl: string): Promise<string[]> {
  const res = await fetch(sitemapUrl, { headers: { 'Accept': 'application/xml, text/xml' } });
  if (!res.ok) throw new Error(`Sitemap fetch failed: ${res.status}`);
  const xml = await res.text();
  const matches = xml.matchAll(/<loc>https?:\/\/sos-expat\.com(\/[^<]*)<\/loc>/g);
  const paths: string[] = [];
  for (const m of matches) {
    const p = m[1].replace(/\/$/, '') || '/';
    // Exclure assets, sitemaps, robots, et URLs avec paramètres
    if (!p.includes('?') && !p.match(/\.(xml|txt|png|jpg|ico|js|css)$/)) {
      paths.push(p);
    }
  }
  return [...new Set(paths)]; // dédupliquer
}

/**
 * Préchauffe le cache SSR pour un chemin donné.
 */
async function warmPath(path: string): Promise<boolean> {
  try {
    const url = new URL(SSR_FUNCTION_URL);
    url.searchParams.set('path', path);
    url.searchParams.set('url', `https://sos-expat.com${path}`);
    url.searchParams.set('bot', 'googlebot');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Googlebot/2.1',
        'Accept': 'text/html',
        // Force re-render: bypasse le cache SSR pour éviter de servir
        // du HTML périmé avec d'anciens hashes Vite (404 assets)
        'x-cache-bypass': '1',
      },
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

export const scheduledWarmSsrCache = onSchedule(
  {
    // Toutes les 20h — cache SSR dure 24h, on précauffe avant expiration.
    // Audit 2026-05-05 : on garde 1 run/20h (économie) mais on TRIPLE la
    // couverture par run via parallélisme 3 (vs séquentiel avant) + sleep
    // batch réduit (1s vs 2s/URL). Coût marginal estimé < 1€/mois.
    schedule: '0 */20 * * *',
    region: REGION,
    memory: '512MiB',
    cpu: 0.25,
    timeoutSeconds: 540, // 9 min max
  },
  async () => {
    const startTime = Date.now();

    // 1. Récupérer toutes les pages depuis le sitemap (auto-mis à jour, inclut les futures pages)
    let paths: string[] = [];
    try {
      paths = await fetchSitemapPaths(SITEMAP_STATIC_URL);
      console.log(`[SSR Warm] ${paths.length} pages trouvées dans le sitemap`);
    } catch (err: any) {
      console.error(`[SSR Warm] Impossible de lire le sitemap: ${err.message}`);
      return;
    }

    // 2. Préchauffer en parallèle par batches (audit 2026-05-05)
    //    AVANT : séquentiel + sleep 2s/URL → ~17-77 URLs warmes par run de 540s
    //    APRÈS : parallélisme 3 + sleep 1s/batch → ~80-150 URLs warmes par run
    //    Pourquoi pas plus haut : renderForBotsV2 a minInstances=3, parallélisme
    //    plus élevé sature les instances chaudes et déclenche cold starts.
    //    Pourquoi sleep 1s : laisser le SSR souffler entre batches (Puppeteer peut
    //    avoir une queue interne de pages, on évite l'OOM).
    const CONCURRENCY = 3;
    const BATCH_DELAY_MS = 1000;
    const MAX_RUN_DURATION_MS = 510_000; // 8.5 min — laisse 30s de marge avant timeout 540s

    let success = 0;
    let errors = 0;
    let processed = 0;
    const errorsByPath: string[] = [];

    for (let i = 0; i < paths.length; i += CONCURRENCY) {
      // Garde-fou timeout : si on approche du timeout function, on s'arrête proprement
      if (Date.now() - startTime > MAX_RUN_DURATION_MS) {
        console.warn(`[SSR Warm] Timeout approchant après ${processed}/${paths.length} URLs, arrêt préventif`);
        break;
      }

      const batch = paths.slice(i, i + CONCURRENCY);
      // Promise.all en lieu de séquentiel : 3× plus de URLs par seconde
      const results = await Promise.all(batch.map(async (p) => {
        const ok = await warmPath(p);
        return { path: p, ok };
      }));

      for (const { path, ok } of results) {
        processed++;
        if (ok) {
          success++;
        } else {
          errors++;
          if (errorsByPath.length < 10) errorsByPath.push(path);
        }
      }

      // Sleep entre batches (pas après le dernier)
      if (i + CONCURRENCY < paths.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    const durationMs = Date.now() - startTime;
    console.log(
      `[SSR Warm] Terminé en ${(durationMs / 1000).toFixed(1)}s — ` +
      `${success}/${processed} OK, ${errors} erreurs (sur ${paths.length} URLs disponibles)`
    );
    if (errorsByPath.length > 0) {
      console.warn(`[SSR Warm] Premiers paths en erreur : ${errorsByPath.join(', ')}`);
    }
  }
);

/**
 * Log l'événement d'indexation dans Firestore
 */
async function logIndexingEvent(
  type: string,
  documentId: string,
  urls: string[],
  result: any
): Promise<void> {
  try {
    const db = admin.firestore();
    await db.collection('indexing_logs').add({
      type,
      documentId,
      urlsCount: urls.length,
      urls: urls.slice(0, 10),
      indexNowSuccess: result.success,
      indexNowError: result.error || null,
      googleSuccess: result.googleSuccess ?? null,
      googleErrors: result.googleErrors ?? null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur log indexation:', error);
  }
}