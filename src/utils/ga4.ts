// src/utils/ga4.ts
/**
 * Google Analytics 4 (GA4) Initialization and Management
 * 
 * Features:
 * - Dynamic script loading based on cookie consent
 * - Respects user privacy preferences
 * - Handles consent mode updates
 * - Provides safe gtag wrapper
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined;

/**
 * Check if GA4 is enabled and measurement ID is configured
 */
export const isGA4Enabled = (): boolean => {
  return Boolean(GA4_MEASUREMENT_ID && GA4_MEASUREMENT_ID.startsWith('G-'));
};

/**
 * Check if user has consented to analytics cookies
 */
export const hasAnalyticsConsent = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const savedPreferences = localStorage.getItem('cookie_preferences');
    if (savedPreferences) {
      const prefs = JSON.parse(savedPreferences) as { analytics?: boolean };
      return prefs.analytics === true;
    }
  } catch {
    // Invalid data, default to no consent
  }
  
  return false;
};

/**
 * Initialize GA4 script and dataLayer
 */
export const initializeGA4 = (): void => {
  if (typeof window === 'undefined' || !isGA4Enabled()) {
    return;
  }

  // Check if already initialized
  if (window.gtag && window.dataLayer) {
    return;
  }

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];

  // Define gtag function
  function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  }
  window.gtag = gtag;

  // Load GA4 script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Configure GA4 with consent mode
  const consentGranted = hasAnalyticsConsent();
  gtag('js', new Date());
  gtag('config', GA4_MEASUREMENT_ID, {
    // Privacy settings
    anonymize_ip: true,
    allow_google_signals: consentGranted,
    allow_ad_personalization_signals: consentGranted,
    // Consent mode
    analytics_storage: consentGranted ? 'granted' : 'denied',
    ad_storage: consentGranted ? 'granted' : 'denied',
  });

  console.log('✅ GA4 initialized:', GA4_MEASUREMENT_ID);
};

/**
 * Update GA4 consent mode
 */
export const updateGA4Consent = (granted: boolean): void => {
  if (typeof window === 'undefined' || !window.gtag || !isGA4Enabled()) {
    return;
  }

  window.gtag('consent', 'update', {
    analytics_storage: granted ? 'granted' : 'denied',
    ad_storage: granted ? 'granted' : 'denied',
  });

  // Update config
  if (GA4_MEASUREMENT_ID) {
    window.gtag('config', GA4_MEASUREMENT_ID, {
      allow_google_signals: granted,
      allow_ad_personalization_signals: granted,
    });
  }
};

/**
 * Safe gtag wrapper that checks if GA4 is available
 */
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, unknown>
): void => {
  if (typeof window === 'undefined' || !window.gtag || !hasAnalyticsConsent()) {
    return;
  }

  try {
    window.gtag('event', eventName, eventParams);
  } catch (error) {
    console.error('Error tracking GA4 event:', error);
  }
};

/**
 * Set user properties
 */
export const setUserProperties = (properties: Record<string, unknown>): void => {
  if (typeof window === 'undefined' || !window.gtag || !hasAnalyticsConsent()) {
    return;
  }

  try {
    window.gtag('set', 'user_properties', properties);
  } catch (error) {
    console.error('Error setting GA4 user properties:', error);
  }
};

/**
 * Set user ID
 */
export const setUserId = (userId: string): void => {
  if (typeof window === 'undefined' || !window.gtag || !hasAnalyticsConsent()) {
    return;
  }

  try {
    window.gtag('config', GA4_MEASUREMENT_ID, {
      user_id: userId,
    });
  } catch (error) {
    console.error('Error setting GA4 user ID:', error);
  }
};

