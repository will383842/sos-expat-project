/**
 * Sitemap Functions
 * HTTP endpoints and Firestore triggers for sitemap generation
 */

import * as functions from 'firebase-functions';
import { generateAllSitemaps } from './generator';

/**
 * HTTP endpoint to manually trigger sitemap generation
 */

export const generateSitemaps = functions.https.onRequest(async (req, res) => {
  try {
    await generateAllSitemaps();
    res.status(200).json({ success: true, message: 'Sitemaps generated successfully' });
  } catch (error) {
    console.error('Error generating sitemaps:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Firestore trigger: Regenerate sitemaps when a provider is created/updated
 */
export const onProviderChange = functions.firestore
  .doc('sos_profiles/{providerId}')
  .onWrite(async (change: any, context: any) => {
    const data = change.after.data();
    
    // Only regenerate if provider is public
    if (data && data.isVisible && data.isApproved && !data.isBanned && !data.isAdmin) {
      console.log(`Provider ${context.params.providerId} changed, regenerating sitemaps...`);
      try {
        await generateAllSitemaps();
      } catch (error) {
        console.error('Error regenerating sitemaps:', error);
      }
    }
  });

/**
 * Scheduled function: Regenerate sitemaps daily
 */
export const scheduledSitemapGeneration = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    console.log('Running scheduled sitemap generation...');
    try {
      await generateAllSitemaps();
    } catch (error) {
      console.error('Error in scheduled sitemap generation:', error);
    }
  });
