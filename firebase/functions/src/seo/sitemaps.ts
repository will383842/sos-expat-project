/**
 * Sitemaps Dynamiques
 * Génère les sitemaps XML pour les profils, blog et landing pages
 */

import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const SITE_URL = 'https://sos-expat.com';
const LANGUAGES = ['fr', 'en', 'de', 'es', 'pt', 'ru', 'zh', 'ar', 'hi'];

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
// 🧑‍⚖️ SITEMAP: Profils prestataires
// ============================================
export const sitemapProfiles = onRequest(
  {
    region: 'europe-west1',
    memory: '256MiB',
    timeoutSeconds: 60,
    maxInstances: 5,
    minInstances: 0,
  },
  async (_req, res) => {
    try {
      const db = admin.firestore();
      
      // ✅ Utilise sos_profiles (pas users)
      const snapshot = await db.collection('sos_profiles')
        .where('isVisible', '==', true)
        .where('isApproved', '==', true)
        .get();

      const today = new Date().toISOString().split('T')[0];
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

      snapshot.docs.forEach(doc => {
        const profile = doc.data();
        
        if (!profile.slug) return;

        const countryCode = profile.countryCode || profile.country || 'fr';
        
        LANGUAGES.forEach(lang => {
          const url = `${SITE_URL}/${lang}-${countryCode}/${profile.slug}`;
          
          xml += `  <url>
    <loc>${escapeXml(url)}</loc>
`;
          
          // Hreflang pour toutes les langues
          LANGUAGES.forEach(hrefLang => {
            const hrefUrl = `${SITE_URL}/${hrefLang}-${countryCode}/${profile.slug}`;
            xml += `    <xhtml:link rel="alternate" hreflang="${hrefLang}" href="${escapeXml(hrefUrl)}"/>
`;
          });
          
          xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${SITE_URL}/fr-${countryCode}/${profile.slug}`)}"/>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <lastmod>${today}</lastmod>
  </url>
`;
        });
      });

      xml += `</urlset>`;

      res.set('Content-Type', 'application/xml; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=3600');
      res.status(200).send(xml);
      
      console.log(`✅ Sitemap profils: ${snapshot.docs.length} profils (${snapshot.docs.length * LANGUAGES.length} URLs)`);
      
    } catch (error) {
      console.error('❌ Erreur sitemap profils:', error);
      res.status(500).send('Error generating sitemap');
    }
  }
);

// ============================================
// 📝 SITEMAP: Articles de blog
// ============================================
export const sitemapBlog = onRequest(
  {
    region: 'europe-west1',
    memory: '256MiB',
    timeoutSeconds: 60,
    maxInstances: 3,
    minInstances: 0,
  },
  async (_req, res) => {
    try {
      const db = admin.firestore();
      
      const snapshot = await db.collection('blog_posts')
        .where('status', '==', 'published')
        .get();

      const today = new Date().toISOString().split('T')[0];
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

      snapshot.docs.forEach(doc => {
        const post = doc.data();
        const slug = post.slug || doc.id;
        
        LANGUAGES.forEach(lang => {
          const url = `${SITE_URL}/${lang}/blog/${slug}`;
          
          xml += `  <url>
    <loc>${escapeXml(url)}</loc>
`;
          
          LANGUAGES.forEach(hrefLang => {
            xml += `    <xhtml:link rel="alternate" hreflang="${hrefLang}" href="${escapeXml(`${SITE_URL}/${hrefLang}/blog/${slug}`)}"/>
`;
          });
          
          xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${SITE_URL}/fr/blog/${slug}`)}"/>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
    <lastmod>${post.updatedAt?.toDate?.()?.toISOString?.()?.split('T')[0] || today}</lastmod>
  </url>
`;
        });
      });

      xml += `</urlset>`;

      res.set('Content-Type', 'application/xml; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=3600');
      res.status(200).send(xml);
      
      console.log(`✅ Sitemap blog: ${snapshot.docs.length} articles`);
      
    } catch (error) {
      console.error('❌ Erreur sitemap blog:', error);
      res.status(500).send('Error generating blog sitemap');
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
    timeoutSeconds: 60,
    maxInstances: 3,
    minInstances: 0,
  },
  async (_req, res) => {
    try {
      const db = admin.firestore();
      
      const snapshot = await db.collection('landing_pages')
        .where('isActive', '==', true)
        .get();

      const today = new Date().toISOString().split('T')[0];
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

      snapshot.docs.forEach(doc => {
        const page = doc.data();
        const slug = page.slug || doc.id;
        
        LANGUAGES.forEach(lang => {
          const url = `${SITE_URL}/${lang}/${slug}`;
          
          xml += `  <url>
    <loc>${escapeXml(url)}</loc>
`;
          
          LANGUAGES.forEach(hrefLang => {
            xml += `    <xhtml:link rel="alternate" hreflang="${hrefLang}" href="${escapeXml(`${SITE_URL}/${hrefLang}/${slug}`)}"/>
`;
          });
          
          xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${SITE_URL}/fr/${slug}`)}"/>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <lastmod>${today}</lastmod>
  </url>
`;
        });
      });

      xml += `</urlset>`;

      res.set('Content-Type', 'application/xml; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=3600');
      res.status(200).send(xml);
      
      console.log(`✅ Sitemap landing: ${snapshot.docs.length} pages`);
      
    } catch (error) {
      console.error('❌ Erreur sitemap landing:', error);
      res.status(500).send('Error generating landing sitemap');
    }
  }
);