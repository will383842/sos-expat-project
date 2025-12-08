import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import { Globe, Plus, Edit, Trash2, Save, X, Eye, CheckCircle, AlertCircle } from 'lucide-react';

interface FAQ {
  id?: string;
  question: Record<string, string>;
  answer: Record<string, string>;
  category: string;
  slug: Record<string, string>;
  order: number;
  isActive: boolean;
  tags: string[];
  views?: number;
  createdAt?: any;
  updatedAt?: any;
}

const SUPPORTED_LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ch', name: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' }
];

// Helper function to get first available translation from any language
const getFirstAvailableTranslation = (translations: Record<string, string> | undefined, fallback: string = ''): string => {
  if (!translations) return fallback;
  
  // Try all supported languages in order
  for (const lang of SUPPORTED_LANGUAGES) {
    if (translations[lang.code] && translations[lang.code].trim().length > 0) {
      return translations[lang.code];
    }
  }
  
  return fallback;
};

// Helper function to get the language code of the first available translation
const getFirstAvailableLanguageCode = (translations: Record<string, string> | undefined, fallback: string = 'fr'): string => {
  if (!translations) return fallback;
  
  // Try all supported languages in order
  for (const lang of SUPPORTED_LANGUAGES) {
    if (translations[lang.code] && translations[lang.code].trim().length > 0) {
      return lang.code;
    }
  }
  
  return fallback;
};

const AdminFAQs: React.FC = () => {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState<boolean>(false);
  const [tagsInput, setTagsInput] = useState<string>(''); // Separate state for tags input
  const [translating, setTranslating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });
  
  // Single language form data (source language - default to French)
  const [questionText, setQuestionText] = useState<string>('');
  const [answerText, setAnswerText] = useState<string>('');
  
  const [formData, setFormData] = useState<FAQ>({
    question: {},
    answer: {},
    category: 'general',
    slug: {},
    order: 0,
    isActive: true,
    tags: []
  });

  // Generate slug from question text
  const generateSlug = (text: string): string => {
    if (!text || text.trim().length === 0) {
      return 'untitled-faq';
    }
    
    let slug = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/(^-|-$)/g, '') // Remove leading/trailing hyphens
      .substring(0, 100);
    
    // Ensure slug is not empty
    if (!slug || slug.trim().length === 0) {
      slug = 'untitled-faq';
    }
    
    return slug;
  };

  // Auto-detect language of text
  const detectLanguage = async (text: string): Promise<string> => {
    if (!text || text.trim().length === 0) {
      return 'en'; // Default to English
    }

    try {
      // Use Google Translate language detection API
      const detectUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text.substring(0, 500))}`;
      const response = await fetch(detectUrl);
      
      if (response.ok) {
        const data = await response.json() as any;
        // Google Translate API returns detected language in different formats
        // Try to extract from various possible response structures
        let detectedLang: string | null = null;
        
        // Method 1: Check if response has language code directly
        if (typeof data === 'string') {
          detectedLang = data;
        } else if (Array.isArray(data) && data.length > 2 && data[2]) {
          detectedLang = data[2];
        } else if (data && typeof data === 'object' && data.src) {
          detectedLang = data.src;
        }
        
        if (detectedLang) {
          // Map detected language to our supported languages
          const langMap: Record<string, string> = {
            'fr': 'fr', 'en': 'en', 'es': 'es', 'pt': 'pt', 'de': 'de',
            'ru': 'ru', 'zh': 'ch', 'zh-CN': 'ch', 'zh-TW': 'ch', 'zh-cn': 'ch',
            'hi': 'hi', 'ar': 'ar',
          };
          const mappedLang = langMap[detectedLang.toLowerCase()] || langMap[detectedLang];
          if (mappedLang) {
            console.log(`[detectLanguage] Detected: ${detectedLang} → Mapped: ${mappedLang}`);
            return mappedLang;
          }
        }
      }
    } catch (error) {
      console.warn('[detectLanguage] Error detecting language:', error);
    }

    // Fallback: Try simple heuristics based on character patterns
    const textLower = text.toLowerCase();
    
    // Check for common language patterns
    if (/[àâäéèêëïîôùûüÿç]/.test(text)) return 'fr';
    if (/[ñáéíóúü¿¡]/.test(text)) return 'es';
    if (/[äöüß]/.test(text)) return 'de';
    if (/[а-яё]/.test(text)) return 'ru';
    if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Devanagari script
    if (/[\u4e00-\u9fff]/.test(text)) return 'ch'; // Chinese characters
    if (/[\u0600-\u06FF]/.test(text)) return 'ar'; // Arabic script
    if (/[áàâãéêíóôõúç]/.test(text)) return 'pt';

    console.log('[detectLanguage] Using default: en');
    return 'en'; // Default fallback
  };

  // Translate text to target language using free translation API
  const translateText = async (text: string, fromLang: string, toLang: string): Promise<string> => {
    if (!text || text.trim().length === 0) {
      return text;
    }

    // If same language, return as-is
    if (fromLang === toLang) {
      return text;
    }

    // Language code mapping for APIs (map internal 'ch' to API 'zh')
    const languageMap: Record<string, string> = {
      'fr': 'fr', 'en': 'en', 'es': 'es', 'pt': 'pt', 'de': 'de',
      'ru': 'ru', 'ch': 'zh', 'hi': 'hi', 'ar': 'ar',
    };
    
    const targetLang = languageMap[toLang] || toLang;
    const sourceLang = languageMap[fromLang] || fromLang;

    // Try MyMemory Translation API (free tier - 10000 words/day)
    try {
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
      const response = await fetch(myMemoryUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json() as { responseData?: { translatedText?: string } };
        if (data.responseData && data.responseData.translatedText) {
          return data.responseData.translatedText;
        }
      }
    } catch (error) {
      console.warn(`[translateText] MyMemory API error:`, error);
    }

    // Fallback: Try Google Translate (free unofficial API)
    try {
      const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      const response = await fetch(googleUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json() as any;
        if (data && Array.isArray(data) && data[0] && Array.isArray(data[0])) {
          const translated = data[0].map((item: any[]) => item[0]).join('');
          if (translated) {
            return translated;
          }
        }
      }
    } catch (error) {
      console.warn(`[translateText] Google Translate API error:`, error);
    }

    // If all APIs fail, return original text
    console.warn(`[translateText] Translation failed for ${fromLang} → ${toLang}, returning original`);
    return text;
  };

  // Translate question and answer to all languages (auto-detect source language)
  const translateToAllLanguages = async (question: string, answer: string): Promise<{ question: Record<string, string>, answer: Record<string, string>, slug: Record<string, string> }> => {
    // Auto-detect source language from question text
    const sourceLang = await detectLanguage(question);
    console.log(`[translateToAllLanguages] Detected source language: ${sourceLang}`);
    
    const translatedQuestion: Record<string, string> = {};
    const translatedAnswer: Record<string, string> = {};
    const slugMap: Record<string, string> = {};

    // Translate to all supported languages
    const translationPromises = SUPPORTED_LANGUAGES.map(async (lang) => {
      const [translatedQ, translatedA] = await Promise.all([
        translateText(question, sourceLang, lang.code),
        translateText(answer, sourceLang, lang.code)
      ]);
      
      translatedQuestion[lang.code] = translatedQ;
      translatedAnswer[lang.code] = translatedA;
      
      // Generate slug from translated question, with fallback to original if translation is empty
      const slugSource = translatedQ && translatedQ.trim().length > 0 ? translatedQ : question;
      const generatedSlug = generateSlug(slugSource);
      slugMap[lang.code] = generatedSlug;
      
      console.log(`[translateToAllLanguages] Generated slug for ${lang.code}: "${generatedSlug}" from: "${slugSource.substring(0, 50)}..."`);
    });

    await Promise.all(translationPromises);

    return { question: translatedQuestion, answer: translatedAnswer, slug: slugMap };
  };

  // Auto-dismiss success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Auto-dismiss error messages
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 7000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Load FAQs
  useEffect(() => {
    const loadFAQs = async () => {
      try {
        const q = query(collection(db, 'faqs'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        setFaqs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FAQ)));
      } catch (error) {
        console.error('Error loading FAQs:', error);
        setErrorMessage('Error loading FAQs. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    loadFAQs();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!questionText.trim() || !answerText.trim()) {
      setErrorMessage('Please provide both a question and an answer.');
      return;
    }

    try {
      setTranslating(true);
      
      // Translate to all languages (auto-detect source language)
      const { question, answer, slug } = await translateToAllLanguages(
        questionText.trim(),
        answerText.trim()
      );

      // Convert tags input string to array
      const tagsArray = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const faqData = {
        question,
        answer,
        slug,
        category: formData.category,
        order: formData.order,
        isActive: formData.isActive,
        tags: tagsArray,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid
      };

      if (editingId) {
        await updateDoc(doc(db, 'faqs', editingId), faqData);
      } else {
        await addDoc(collection(db, 'faqs'), {
          ...faqData,
          createdAt: serverTimestamp(),
          createdBy: user?.uid,
          views: 0
        });
      }

      // Reset form
      setQuestionText('');
      setAnswerText('');
      setFormData({
        question: {},
        answer: {},
        category: 'general',
        slug: {},
        order: 0,
        isActive: true,
        tags: []
      });
      setTagsInput('');
      setEditingId(null);
      setShowNewForm(false);
      
      setSuccessMessage(editingId ? 'FAQ updated successfully!' : 'FAQ created and translated successfully!');
      
      // Reload FAQs
      const q = query(collection(db, 'faqs'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      setFaqs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FAQ)));
    } catch (error) {
      console.error('Error saving FAQ:', error);
      setErrorMessage('Error saving FAQ. Please try again.');
    } finally {
      setTranslating(false);
    }
  };

  // Delete FAQ
  const handleDeleteClick = (id: string) => {
    setShowDeleteConfirm({ show: true, id });
  };

  const handleDeleteConfirm = async () => {
    if (!showDeleteConfirm.id) return;
    
    try {
      await deleteDoc(doc(db, 'faqs', showDeleteConfirm.id));
      setFaqs(faqs.filter(f => f.id !== showDeleteConfirm.id));
      setSuccessMessage('FAQ deleted successfully!');
      setShowDeleteConfirm({ show: false, id: null });
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      setErrorMessage('Error deleting FAQ. Please try again.');
      setShowDeleteConfirm({ show: false, id: null });
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm({ show: false, id: null });
  };

  // Start editing
  const handleEdit = (faq: FAQ) => {
    setEditingId(faq.id!);
    setShowNewForm(false);
    setFormData(faq);
    setTagsInput(faq.tags?.join(', ') || '');
    // Load the first available language (prefer French, then English, then any)
    const detectedLang = getFirstAvailableLanguageCode(faq.question, 'fr');
    setQuestionText(faq.question[detectedLang] || faq.question['fr'] || faq.question['en'] || '');
    setAnswerText(faq.answer[detectedLang] || faq.answer['fr'] || faq.answer['en'] || '');
  };

  // Show new FAQ form
  const handleNewFAQ = () => {
    setEditingId(null);
    setShowNewForm(true);
    setQuestionText('');
    setAnswerText('');
    setFormData({
      question: {},
      answer: {},
      category: 'general',
      slug: {},
      order: 0,
      isActive: true,
      tags: []
    });
    setTagsInput('');
  };

  // Cancel editing/new
  const handleCancel = () => {
    setEditingId(null);
    setShowNewForm(false);
    setQuestionText('');
    setAnswerText('');
    setFormData({
      question: {},
      answer: {},
      category: 'general',
      slug: {},
      order: 0,
      isActive: true,
      tags: []
    });
    setTagsInput('');
    setSuccessMessage('');
    setErrorMessage('');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span>{successMessage}</span>
          </div>
          <button 
            onClick={() => setSuccessMessage('')} 
            className="text-green-600 hover:text-green-800 transition-colors"
            aria-label="Close notification"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{errorMessage}</span>
          </div>
          <button 
            onClick={() => setErrorMessage('')} 
            className="text-red-600 hover:text-red-800 transition-colors"
            aria-label="Close notification"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this FAQ? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage FAQs</h1>
        {!editingId && !showNewForm && (
          <button
            onClick={handleNewFAQ}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New FAQ
          </button>
        )}
      </div>

      {/* Form Section */}
      {(editingId || showNewForm || !faqs.length) && (
        <div className="bg-white rounded-lg shadow-lg mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">
              {editingId ? 'Edit FAQ' : 'Create New FAQ'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Info Banner */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Auto-Translation Enabled
                  </p>
                  <p className="text-xs text-blue-700">
                    Enter your question and answer in any language. The system will automatically detect the language and translate it to all 9 supported languages when you save.
                  </p>
                </div>
              </div>
            </div>

            {/* Single Question and Answer Input */}
            <div className="space-y-6">
              {/* Question Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Question
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="Enter your question in any language..."
                  required
                  disabled={translating}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Language will be auto-detected automatically
                </p>
              </div>

              {/* Answer Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Answer
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-y"
                  rows={6}
                  placeholder="Enter your answer in any language..."
                  required
                  disabled={translating}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {answerText.length} characters
                </p>
              </div>
            </div>

            {/* Common Fields */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="general">General</option>
                  <option value="payment">Payment</option>
                  <option value="billing">Billing</option>
                  <option value="calls">Calls</option>
                  <option value="account">Account</option>
                  <option value="technical">Technical</option>
                  <option value="legal">Legal</option>
                </select>
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  min="0"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="payment, billing, account"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Separate multiple tags with commas (e.g., payment, billing, account)
                </p>
              </div>

              {/* Status Checkbox */}
              <div className="space-y-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Active (visible on website)
                  </span>
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="mt-8 flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={translating}
                className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {translating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Translating...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {editingId ? 'Update FAQ' : 'Create & Translate FAQ'}
                  </>
                )}
              </button>
              {(editingId || showNewForm) && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={translating}
                  className="flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* FAQ List */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">Existing FAQs ({faqs.length})</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {faqs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No FAQs found. Create your first FAQ above.
            </div>
          ) : (
            faqs.map(faq => (
              <div key={faq.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {getFirstAvailableTranslation(faq.question, 'Untitled FAQ')}
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {faq.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {getFirstAvailableTranslation(faq.answer, 'No answer provided')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        faq.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {faq.isActive ? '✓ Active' : '✗ Inactive'}
                      </span>
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                        Order: {faq.order}
                      </span>
                      {faq.views !== undefined && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                          <Eye className="w-3 h-3 inline mr-1" />
                          {faq.views} views
                        </span>
                      )}
                    </div>
                    {faq.tags && faq.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {faq.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(faq)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit FAQ"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(faq.id!)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete FAQ"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFAQs;

