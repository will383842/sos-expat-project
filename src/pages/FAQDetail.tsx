import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, increment, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import Layout from '../components/layout/Layout';
import SEOHead from '../components/layout/SEOHead';
import { useApp } from '../contexts/AppContext';
import { getLocaleString, parseLocaleFromPath } from '../multilingual-system';
import { ChevronRight, Home, HelpCircle } from 'lucide-react';

interface FAQ {
  id: string;
  question: Record<string, string>;
  answer: Record<string, string>;
  category: string;
  slug: Record<string, string>;
  order: number;
  isActive: boolean;
  isFooter: boolean;
  tags: string[];
  views?: number;
}

const FAQDetail: React.FC = () => {
  const params = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useApp();
  const [faq, setFaq] = useState<FAQ | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedFAQs, setRelatedFAQs] = useState<FAQ[]>([]);

  // Extract slug from params
  const slug = params.slug;
  
  // Extract locale from pathname (e.g., /fr-FR/faq/slug or /en-US/faq/slug)
  const { locale: localeFromPath, lang } = parseLocaleFromPath(location.pathname);
  
  // Determine language from URL path or context
  const currentLang = lang || language || 'fr';
  const langCode = currentLang.split('-')[0]; // Extract 'fr' from 'fr-FR'
  
  console.log('[FAQDetail] Path:', location.pathname, 'Slug:', slug, 'Lang:', langCode, 'CurrentLang:', currentLang);

  useEffect(() => {
    const loadFAQ = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!slug) {
          setError('Invalid FAQ slug');
          setLoading(false);
          return;
        }

        if (!db) {
          setError('Database not initialized');
          setLoading(false);
          return;
        }

        // Query FAQ by slug in current language
        const faqsRef = collection(db, 'faqs');
        
        // Check if slug looks like a Firestore document ID (alphanumeric, typically 20 chars)
        // Firestore IDs are usually 20 characters long and alphanumeric
        const looksLikeDocId = /^[a-zA-Z0-9]{20,}$/.test(slug);
        
        // First, try to get document directly by ID if it looks like one
        if (looksLikeDocId) {
          try {
            const docRef = doc(db, 'faqs', slug);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              // Only use if active
              if (data.isActive !== false) {
                const faqData = { id: docSnap.id, ...data } as FAQ;
                setFaq(faqData);
                
                // Increment view count
                try {
                  await updateDoc(docRef, {
                    views: increment(1)
                  });
                } catch (err) {
                  console.error('Error incrementing views:', err);
                }
                
                // Load related FAQs
                if (faqData.category) {
                  const relatedQuery = query(
                    faqsRef,
                    where('category', '==', faqData.category),
                    // where('isActive', '==', true),
                    // orderBy('order', 'asc')
                  );
                  const relatedSnapshot = await getDocs(relatedQuery);
                  const related = relatedSnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() } as FAQ))
                    .filter(f => f.id !== faqData.id)
                    .slice(0, 5);
                  setRelatedFAQs(related);
                }
                
                setLoading(false);
                return;
              }
            }
          } catch (err) {
            console.warn('[FAQDetail] Error fetching by document ID:', err);
          }
        }
        
        // Always query all active FAQs and search manually for better reliability
        // This handles cases where Firestore queries might fail due to indexing or slug structure
        let snapshot: any = { docs: [], empty: true };
        
        try {
          console.log(`[FAQDetail] Searching for FAQ with slug: "${slug}" (language: ${langCode})`);
          
          // Query all active FAQs
          const allFAQsQuery = query(
            faqsRef,
            where('isActive', '==', true)
          );
          const allSnapshot = await getDocs(allFAQsQuery);
          
          console.log(`[FAQDetail] Found ${allSnapshot.docs.length} active FAQs, searching for matching slug...`);
          
          // Normalize slug for comparison (lowercase, trim)
          const normalizedSlug = slug.toLowerCase().trim();
          
          const matchingFAQ = allSnapshot.docs.find(doc => {
            const data = doc.data();
            const slugData = data.slug || {};
            
            // Normalize all slugs for comparison
            const normalizedSlugs: Record<string, string> = {};
            Object.keys(slugData).forEach(key => {
              if (slugData[key]) {
                normalizedSlugs[key] = String(slugData[key]).toLowerCase().trim();
              }
            });
            
            // Check if slug matches in current language (case-insensitive)
            if (normalizedSlugs[langCode] === normalizedSlug) {
              console.log(`[FAQDetail] ✓ Found match by langCode ${langCode}`);
              return true;
            }
            
            // Check if slug matches in any language (case-insensitive)
            if (Object.values(normalizedSlugs).includes(normalizedSlug)) {
              console.log(`[FAQDetail] ✓ Found match in another language`);
              return true;
            }
            
            // Check common fallback languages (case-insensitive)
            if (normalizedSlugs['fr'] === normalizedSlug || normalizedSlugs['en'] === normalizedSlug) {
              console.log(`[FAQDetail] ✓ Found match in fallback language`);
              return true;
            }
            
            // Check if document ID matches (for backward compatibility)
            if (doc.id === slug || doc.id.toLowerCase() === normalizedSlug) {
              console.log(`[FAQDetail] ✓ Found match by document ID`);
              return true;
            }
            
            return false;
          });
          
          if (matchingFAQ) {
            snapshot = { docs: [matchingFAQ], empty: false };
            console.log(`[FAQDetail] ✓ Successfully found FAQ: ${matchingFAQ.id}`);
          } else {
            console.warn(`[FAQDetail] ✗ No matching FAQ found for slug: "${slug}"`);
            // Log available slugs for debugging (first 3 FAQs)
            allSnapshot.docs.slice(0, 3).forEach(doc => {
              const data = doc.data();
              console.log(`[FAQDetail] Sample FAQ ${doc.id} slugs:`, data.slug || {});
            });
          }
        } catch (err) {
          console.error('[FAQDetail] Error querying FAQs:', err);
        }

        if (snapshot.empty) {
          console.error(`[FAQDetail] FAQ not found with slug: ${slug} for language: ${langCode}`);
          setError('FAQ not found');
          setLoading(false);
          return;
        }

        const faqDoc = snapshot.docs[0];
        const faqData = { id: faqDoc.id, ...faqDoc.data() } as FAQ;
        setFaq(faqData);

        // Increment view count
        try {
          await updateDoc(doc(db, 'faqs', faqDoc.id), {
            views: increment(1)
          });
        } catch (err) {
          console.error('Error incrementing views:', err);
          // Non-critical error, continue
        }

        // Load related FAQs (same category)
        if (faqData.category) {
          const relatedQuery = query(
            faqsRef,
            where('category', '==', faqData.category),
            // where('isActive', '==', true),
            // orderBy('order', 'asc')
          );
          const relatedSnapshot = await getDocs(relatedQuery);
          const related = relatedSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as FAQ))
            .filter(f => f.id !== faqData.id)
            .slice(0, 5);
          setRelatedFAQs(related);
        }
      } catch (err) {
        console.error('Error loading FAQ:', err);
        setError('Failed to load FAQ');
      } finally {
        setLoading(false);
      }
    };

    if (slug && db) {
      loadFAQ();
    } else if (!slug) {
      setError('No FAQ slug provided');
      setLoading(false);
    } else if (!db) {
      setError('Database not initialized');
      setLoading(false);
    }
  }, [slug, langCode, location.pathname]);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !faq) {
    return (
      <Layout>
        <SEOHead
          title="FAQ Not Found | SOS Expat"
          description="The requested FAQ could not be found."
        />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">FAQ Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The requested FAQ could not be found.'}</p>
            <div className="flex gap-4 justify-center">
              <Link
                to={`/${getLocaleString(language)}/faq`}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors inline-flex items-center gap-2"
              >
                <Home className="w-5 h-5" />
                Back to FAQ
              </Link>
              <Link
                to={`/${getLocaleString(language)}`}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const question = faq.question[langCode] || faq.question['fr'] || faq.question['en'] || 'Untitled FAQ';
  const answer = faq.answer[langCode] || faq.answer['fr'] || faq.answer['en'] || 'No answer available';

  // Format answer with line breaks
  const formattedAnswer = answer.split('\n').map((line, i) => (
    <React.Fragment key={i}>
      {line}
      {i < answer.split('\n').length - 1 && <br />}
    </React.Fragment>
  ));

  // Build canonical URL with locale prefix
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://sos-expat.com';
  const currentSlug = faq.slug[langCode] || faq.slug['fr'] || faq.slug['en'] || faq.id;
  const currentLocale = getLocaleString(currentLang as any);
  const canonicalUrl = `${baseUrl}/${currentLocale}/faq/${currentSlug}`;

  // Generate alternate language URLs for hreflang tags
  // Map language codes to their locale strings for URLs (using getLocaleString format: lowercase with hyphen)
  // For hreflang, we use ISO format (e.g., "en-US"), but for URLs we use lowercase (e.g., "en-us")
  const localeMap: Record<string, { urlLocale: string; hreflangLocale: string }> = {
    'fr': { urlLocale: 'fr-fr', hreflangLocale: 'fr-FR' },
    'en': { urlLocale: 'en-us', hreflangLocale: 'en-US' },
    'es': { urlLocale: 'es-es', hreflangLocale: 'es-ES' },
    'ru': { urlLocale: 'ru-ru', hreflangLocale: 'ru-RU' },
    'de': { urlLocale: 'de-de', hreflangLocale: 'de-DE' },
    'hi': { urlLocale: 'hi-in', hreflangLocale: 'hi-IN' },
    'pt': { urlLocale: 'pt-pt', hreflangLocale: 'pt-PT' },
    'ch': { urlLocale: 'zh-cn', hreflangLocale: 'zh-CN' },
    'ar': { urlLocale: 'ar-sa', hreflangLocale: 'ar-SA' }
  };

  const supportedLanguages = ['fr', 'en', 'es', 'ru', 'de', 'hi', 'pt', 'ch', 'ar'];

  const alternateLanguages = supportedLanguages
    .filter(langCode => {
      // Only include languages where the FAQ has content
      const hasQuestion = faq.question[langCode] && faq.question[langCode].trim().length > 0;
      const hasAnswer = faq.answer[langCode] && faq.answer[langCode].trim().length > 0;
      return hasQuestion && hasAnswer;
    })
    .map(langCode => {
      const slug = faq.slug[langCode] || faq.slug['fr'] || faq.slug['en'] || faq.id;
      const localeInfo = localeMap[langCode] || { urlLocale: `${langCode}-${langCode}`, hreflangLocale: `${langCode}-${langCode.toUpperCase()}` };
      return {
        lang: localeInfo.hreflangLocale, // Use ISO format for hreflang
        url: `${baseUrl}/${localeInfo.urlLocale}/faq/${slug}` // Use lowercase for URL
      };
    });

  return (
    <Layout>
      <SEOHead
        title={`${question} - FAQ | SOS Expat`}
        description={answer.substring(0, 160).replace(/\n/g, ' ')}
        keywords={[faq.category, 'FAQ', 'help', ...(faq.tags || [])].join(', ')}
        canonicalUrl={canonicalUrl}
        alternateLanguages={alternateLanguages}
        locale={currentLang === 'fr' ? 'fr_FR' : 
                currentLang === 'en' ? 'en_US' :
                currentLang === 'es' ? 'es_ES' :
                currentLang === 'ru' ? 'ru_RU' :
                currentLang === 'de' ? 'de_DE' :
                currentLang === 'hi' ? 'hi_IN' :
                currentLang === 'pt' ? 'pt_PT' :
                currentLang === 'ch' ? 'zh_CN' :
                currentLang === 'ar' ? 'ar_SA' : 'fr_FR'}
      />
      
      <article className="max-w-4xl mx-auto px-4 py-8 sm:py-12 min-h-[70vh]" >
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-600 flex items-center gap-2" aria-label="Breadcrumb">
          <Link to={`/${getLocaleString(language)}`} className="hover:text-red-600 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link to={`/${getLocaleString(language)}/faq`} className="hover:text-red-600 transition-colors">
            FAQ
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium truncate max-w-xs sm:max-w-md">
            {question}
          </span>
        </nav>

        {/* FAQ Content */}
        <header className="mb-8 pb-6 border-b border-gray-200">
          <div className="flex items-start gap-3 mb-4">
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium capitalize">
              {faq.category}
            </span>
            {faq.views !== undefined && (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                {faq.views} views
              </span>
            )}
          </div>
          <h1 
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight"
            itemProp="headline"
          >
            {question}
          </h1>
        </header>

        <div 
          className="prose prose-lg max-w-none mb-12"
          itemProp="text"
        >
          <div className="text-gray-700 leading-relaxed whitespace-pre-line">
            {formattedAnswer}
          </div>
        </div>

        {/* Related FAQs */}
        {relatedFAQs.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Questions</h2>
            <div className="space-y-4">
              {relatedFAQs.map(relatedFaq => {
                const relatedQuestion = relatedFaq.question[langCode] || relatedFaq.question['fr'] || relatedFaq.question['en'];
                const relatedSlug = relatedFaq.slug[langCode] || relatedFaq.slug['fr'] || relatedFaq.slug['en'];
                return (
                  <Link
                    key={relatedFaq.id}
                    to={`/${getLocaleString(language)}/faq/${relatedSlug}`}
                    className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">{relatedQuestion}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {relatedFaq.answer[langCode] || relatedFaq.answer['fr'] || relatedFaq.answer['en']}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Back to FAQ Link */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link
            to={`/${getLocaleString(language)}/faq`}
            className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to all FAQs
          </Link>
        </div>

        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              'mainEntity': {
                '@type': 'Question',
                'name': question,
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': answer
                }
              }
            })
          }}
        />
      </article>
    </Layout>
  );
};

export default FAQDetail;

