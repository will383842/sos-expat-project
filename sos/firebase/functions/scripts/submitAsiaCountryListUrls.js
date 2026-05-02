/**
 * Soumet les 12 URLs francophones (pages liste pays Asie-Pacifique)
 * à Google Indexing API + IndexNow.
 *
 * Usage: node scripts/submitAsiaCountryListUrls.js
 */

const admin = require('firebase-admin');
const { google } = require('googleapis');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'sos-urgently-ac307' });
}

const URLS_FR = [
  'https://sos-expat.com/fr-fr/avocats/australie',
  'https://sos-expat.com/fr-fr/avocats/cambodge',
  'https://sos-expat.com/fr-fr/avocats/indonesie',
  'https://sos-expat.com/fr-fr/avocats/japon',
  'https://sos-expat.com/fr-fr/avocats/laos',
  'https://sos-expat.com/fr-fr/avocats/malaisie',
  'https://sos-expat.com/fr-fr/avocats/myanmar',
  'https://sos-expat.com/fr-fr/avocats/philippines',
  'https://sos-expat.com/fr-fr/avocats/singapour',
  'https://sos-expat.com/fr-fr/avocats/taiwan',
  'https://sos-expat.com/fr-fr/avocats/thailande',
  'https://sos-expat.com/fr-fr/avocats/vietnam',
];

const INDEXNOW_KEY = 'sosexpat2025indexnowkey';
const SITE_HOST = 'sos-expat.com';

async function submitToGoogleIndexing(urls) {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });
  const indexing = google.indexing({ version: 'v3', auth });

  const results = [];
  for (const url of urls) {
    try {
      const response = await indexing.urlNotifications.publish({
        requestBody: { url, type: 'URL_UPDATED' },
      });
      const notifyTime = response.data.urlNotificationMetadata?.latestUpdate?.notifyTime;
      results.push({ url, success: true, notifyTime });
      console.log(`  ✅ Google Indexing API: ${url}`);
    } catch (err) {
      results.push({ url, success: false, error: err.message });
      console.log(`  ❌ Google Indexing API: ${url} → ${err.message}`);
    }
  }
  return results;
}

async function submitToIndexNow(urls) {
  const payload = {
    host: SITE_HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  };

  try {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });
    return { success: response.status >= 200 && response.status < 300, statusCode: response.status };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function pingGoogleSitemap() {
  const sitemapUrl = encodeURIComponent('https://sos-expat.com/sitemap-index.xml');
  try {
    const response = await fetch(`https://www.google.com/ping?sitemap=${sitemapUrl}`);
    return { success: response.ok, statusCode: response.status };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function run() {
  console.log('='.repeat(70));
  console.log('SOUMISSION 12 URLs FR (Asie-Pacifique) → Google + Bing + Yandex');
  console.log('='.repeat(70));
  console.log();

  console.log('📤 1/3 — Google Indexing API (officielle, instantanée)');
  console.log('-'.repeat(70));
  const googleResults = await submitToGoogleIndexing(URLS_FR);
  const googleSuccess = googleResults.filter(r => r.success).length;
  console.log(`Résultat: ${googleSuccess}/${URLS_FR.length} soumises avec succès`);
  console.log();

  console.log('📤 2/3 — IndexNow (Bing + Yandex, instantanée)');
  console.log('-'.repeat(70));
  const indexNowResult = await submitToIndexNow(URLS_FR);
  if (indexNowResult.success) {
    console.log(`  ✅ IndexNow: ${URLS_FR.length} URLs soumises (HTTP ${indexNowResult.statusCode})`);
  } else {
    console.log(`  ❌ IndexNow: échec — ${indexNowResult.error || `HTTP ${indexNowResult.statusCode}`}`);
  }
  console.log();

  console.log('📤 3/3 — Google ping sitemap (fallback)');
  console.log('-'.repeat(70));
  const sitemapResult = await pingGoogleSitemap();
  if (sitemapResult.success) {
    console.log(`  ✅ Sitemap pingé Google (HTTP ${sitemapResult.statusCode})`);
  } else {
    console.log(`  ❌ Échec ping sitemap: ${sitemapResult.error || `HTTP ${sitemapResult.statusCode}`}`);
  }
  console.log();

  console.log('='.repeat(70));
  console.log('RÉSUMÉ FINAL');
  console.log('='.repeat(70));
  console.log(`  Google Indexing API (FR): ${googleSuccess}/${URLS_FR.length}`);
  console.log(`  IndexNow (Bing/Yandex):  ${indexNowResult.success ? '✅' : '❌'}`);
  console.log(`  Google sitemap ping:     ${sitemapResult.success ? '✅' : '❌'}`);
  console.log();
  console.log('Note: Google Indexing API ≠ indexation immédiate. Google reçoit le');
  console.log('signal mais peut prendre 1h-72h pour crawler/indexer effectivement.');
  console.log('Surveiller dans Google Search Console → "Pages" sous 3-5 jours.');

  process.exit(0);
}

run().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});
