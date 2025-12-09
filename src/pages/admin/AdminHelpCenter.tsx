// src/pages/admin/AdminHelpCenter.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash,
  BookOpen,
  CheckCircle2,
  Loader2,
  Tag,
  Globe,
} from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import { useAuth } from "../../contexts/AuthContext";
import {
  createHelpArticle,
  createHelpCategory,
  deleteHelpArticle,
  deleteHelpCategory,
  HelpArticle,
  HelpCategory,
  listHelpArticles,
  listHelpCategories,
  updateHelpArticle,
  updateHelpCategory,
} from "../../services/helpCenter";

type CategoryFormState = Omit<HelpCategory, "id" | "createdAt" | "updatedAt">;
type ArticleFormState = Omit<HelpArticle, "id" | "createdAt" | "updatedAt">;

const SUPPORTED_LANGUAGES = [
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ch", name: "中文", flag: "🇨🇳" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
];

// Helper to get first available translation
const getFirstAvailableTranslation = (
  translations: string | Record<string, string> | undefined,
  fallback: string = ""
): string => {
  if (typeof translations === "string") return translations;
  if (!translations || typeof translations !== "object") return fallback;
  for (const lang of SUPPORTED_LANGUAGES) {
    if (translations[lang.code] && translations[lang.code].trim().length > 0) {
      return translations[lang.code];
    }
  }
  return fallback;
};

// Helper to get translation for a specific locale (with fallback)
const getTranslationForLocale = (
  translations: string | Record<string, string> | undefined,
  locale: string,
  fallback: string = ""
): string => {
  if (typeof translations === "string") return translations;
  if (!translations || typeof translations !== "object") return fallback;
  // Try to get translation for the requested locale
  if (translations[locale] && translations[locale].trim().length > 0) {
    return translations[locale];
  }
  // Fallback to first available translation
  return getFirstAvailableTranslation(translations, fallback);
};

// Helper to get first available language code
const getFirstAvailableLanguageCode = (
  translations: string | Record<string, string> | undefined,
  fallback: string = "fr"
): string => {
  if (typeof translations === "string") return fallback;
  if (!translations || typeof translations !== "object") return fallback;
  for (const lang of SUPPORTED_LANGUAGES) {
    if (translations[lang.code] && translations[lang.code].trim().length > 0) {
      return lang.code;
    }
  }
  return fallback;
};

// Helper to get first available tags array
const getFirstAvailableTags = (
  tags: string[] | Record<string, string[]> | undefined,
  fallback: string[] = []
): string[] => {
  if (Array.isArray(tags)) return tags;
  if (!tags || typeof tags !== "object") return fallback;
  // Try to find first available language with tags
  for (const lang of SUPPORTED_LANGUAGES) {
    const langTags = tags[lang.code];
    if (langTags && Array.isArray(langTags) && langTags.length > 0) {
      return langTags;
    }
  }
  // Fallback: try to get any language's tags from the object
  const allTags = Object.values(tags);
  for (const tagArray of allTags) {
    if (Array.isArray(tagArray) && tagArray.length > 0) {
      return tagArray;
    }
  }
  return fallback;
};

// Helper to get tags for a specific locale (with fallback)
const getTagsForLocale = (
  tags: string[] | Record<string, string[]> | undefined,
  locale: string,
  fallback: string[] = []
): string[] => {
  if (Array.isArray(tags)) return tags;
  if (!tags || typeof tags !== "object") return fallback;
  // Try to get tags for the requested locale
  if (tags[locale] && Array.isArray(tags[locale]) && tags[locale].length > 0) {
    return tags[locale];
  }
  // Fallback to first available tags
  return getFirstAvailableTags(tags, fallback);
};

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[''"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Generate slug from text
const generateSlug = (text: string): string => {
  if (!text || text.trim().length === 0) {
    return "untitled";
  }
  let slug = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 100);
  if (!slug || slug.trim().length === 0) {
    slug = "untitled";
  }
  return slug;
};

// Auto-detect language of text
const detectLanguage = async (text: string): Promise<string> => {
  if (!text || text.trim().length === 0) {
    return "en";
  }
  try {
    const detectUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text.substring(0, 500))}`;
    const response = await fetch(detectUrl);
    if (response.ok) {
      const data = (await response.json()) as any;
      let detectedLang: string | null = null;
      if (typeof data === "string") {
        detectedLang = data;
      } else if (Array.isArray(data) && data.length > 2 && data[2]) {
        detectedLang = data[2];
      } else if (data && typeof data === "object" && data.src) {
        detectedLang = data.src;
      }
      if (detectedLang) {
        const langMap: Record<string, string> = {
          fr: "fr",
          en: "en",
          es: "es",
          pt: "pt",
          de: "de",
          ru: "ru",
          zh: "ch",
          "zh-CN": "ch",
          "zh-TW": "ch",
          "zh-cn": "ch",
          hi: "hi",
          ar: "ar",
        };
        const mappedLang =
          langMap[detectedLang.toLowerCase()] || langMap[detectedLang];
        if (mappedLang) {
          return mappedLang;
        }
      }
    }
  } catch (error) {
    console.warn("[detectLanguage] Error detecting language:", error);
  }
  // Fallback: Try simple heuristics
  const textLower = text.toLowerCase();
  if (/[àâäéèêëïîôùûüÿç]/.test(text)) return "fr";
  if (/[ñáéíóúü¿¡]/.test(text)) return "es";
  if (/[äöüß]/.test(text)) return "de";
  if (/[а-яё]/.test(text)) return "ru";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u4e00-\u9fff]/.test(text)) return "ch";
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  if (/[áàâãéêíóôõúç]/.test(text)) return "pt";
  return "en";
};

// Translate text to target language
const translateText = async (
  text: string,
  fromLang: string,
  toLang: string
): Promise<string> => {
  if (!text || text.trim().length === 0) {
    return text;
  }
  if (fromLang === toLang) {
    return text;
  }
  const languageMap: Record<string, string> = {
    fr: "fr",
    en: "en",
    es: "es",
    pt: "pt",
    de: "de",
    ru: "ru",
    ch: "zh",
    hi: "hi",
    ar: "ar",
  };
  const targetLang = languageMap[toLang] || toLang;
  const sourceLang = languageMap[fromLang] || fromLang;
  // Try MyMemory Translation API
  try {
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
    const response = await fetch(myMemoryUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (response.ok) {
      const data = (await response.json()) as {
        responseData?: { translatedText?: string };
      };
      if (data.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
    }
  } catch (error) {
    console.warn(`[translateText] MyMemory API error:`, error);
  }
  // Fallback: Try Google Translate
  try {
    const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(googleUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (response.ok) {
      const data = (await response.json()) as any;
      if (data && Array.isArray(data) && data[0] && Array.isArray(data[0])) {
        const translated = data[0].map((item: any[]) => item[0]).join("");
        if (translated) {
          return translated;
        }
      }
    }
  } catch (error) {
    console.warn(`[translateText] Google Translate API error:`, error);
  }
  return text;
};

const defaultCategoryForm = (locale: string): CategoryFormState => ({
  name: "",
  slug: "",
  order: 1,
  isPublished: true,
  locale,
  icon: "",
});

const defaultArticleForm = (
  locale: string,
  categoryId?: string
): ArticleFormState => ({
  title: "",
  slug: "",
  categoryId: categoryId ?? "",
  excerpt: "",
  content: "",
  tags: [],
  readTime: 3,
  order: 1,
  isPublished: true,
  locale,
});

const AdminHelpCenter: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [locale, setLocale] = useState<string>("fr");
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [isCategoryModalOpen, setIsCategoryModalOpen] =
    useState<boolean>(false);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState<boolean>(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);

  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(
    defaultCategoryForm(locale)
  );
  const [articleForm, setArticleForm] = useState<ArticleFormState>(
    defaultArticleForm(locale)
  );
  const [tagInput, setTagInput] = useState<string>("");
  const [translating, setTranslating] = useState<boolean>(false);

  // Single input fields for translation
  const [categoryNameInput, setCategoryNameInput] = useState<string>("");
  const [articleTitleInput, setArticleTitleInput] = useState<string>("");
  const [articleExcerptInput, setArticleExcerptInput] = useState<string>("");
  const [articleContentInput, setArticleContentInput] = useState<string>("");

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load all categories and articles (they contain translations)
      const [cats, arts] = await Promise.all([
        listHelpCategories(), // Load all categories
        listHelpArticles({ onlyPublished: false }), // Load all articles in admin
      ]);
      setCategories(cats);
      setArticles(arts);
      // Set selectedCategoryId if not set, or if current selection doesn't exist in new categories
      setSelectedCategoryId((prev) => {
        if (!prev && cats.length > 0) {
          return cats[0].id;
        }
        // If current selection doesn't exist in new categories, select first one
        if (prev && !cats.find((c) => c.id === prev) && cats.length > 0) {
          return cats[0].id;
        }
        return prev;
      });
    } catch (error) {
      console.error("Error loading help center data", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      navigate("/admin/login");
      return;
    }
    // Load data on initial mount
    void refreshAll();
  }, [currentUser, navigate, refreshAll]);

  useEffect(() => {
    setCategoryForm(defaultCategoryForm(locale));
    setArticleForm(defaultArticleForm(locale, selectedCategoryId ?? undefined));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, selectedCategoryId]);

  const filteredArticles = useMemo(() => {
    if (!selectedCategoryId) return articles;
    return articles.filter((a) => a.categoryId === selectedCategoryId);
  }, [articles, selectedCategoryId]);

  // Translate category name and slug to all languages
  const translateCategory = async (
    name: string
  ): Promise<{ name: Record<string, string>; slug: Record<string, string> }> => {
    const sourceLang = await detectLanguage(name);
    const translatedName: Record<string, string> = {};
    const slugMap: Record<string, string> = {};

    const translationPromises = SUPPORTED_LANGUAGES.map(async (lang) => {
      const translated = await translateText(name, sourceLang, lang.code);
      translatedName[lang.code] = translated;
      const slugSource =
        translated && translated.trim().length > 0 ? translated : name;
      slugMap[lang.code] = generateSlug(slugSource);
    });

    await Promise.all(translationPromises);
    return { name: translatedName, slug: slugMap };
  };

  // Translate article fields to all languages
  const translateArticle = async (
    title: string,
    excerpt: string,
    content: string,
    tags: string[]
  ): Promise<{
    title: Record<string, string>;
    excerpt: Record<string, string>;
    content: Record<string, string>;
    slug: Record<string, string>;
    tags: Record<string, string[]>;
  }> => {
    const sourceLang = await detectLanguage(title);
    const translatedTitle: Record<string, string> = {};
    const translatedExcerpt: Record<string, string> = {};
    const translatedContent: Record<string, string> = {};
    const slugMap: Record<string, string> = {};
    const tagsMap: Record<string, string[]> = {};

    const translationPromises = SUPPORTED_LANGUAGES.map(async (lang) => {
      const [translatedT, translatedE, translatedC] = await Promise.all([
        translateText(title, sourceLang, lang.code),
        translateText(excerpt, sourceLang, lang.code),
        translateText(content, sourceLang, lang.code),
      ]);
      translatedTitle[lang.code] = translatedT;
      translatedExcerpt[lang.code] = translatedE;
      translatedContent[lang.code] = translatedC;

      const slugSource =
        translatedT && translatedT.trim().length > 0 ? translatedT : title;
      slugMap[lang.code] = generateSlug(slugSource);

      // Translate tags
      const translatedTags = await Promise.all(
        tags.map((tag) => translateText(tag, sourceLang, lang.code))
      );
      tagsMap[lang.code] = translatedTags;
    });

    await Promise.all(translationPromises);
    return {
      title: translatedTitle,
      excerpt: translatedExcerpt,
      content: translatedContent,
      slug: slugMap,
      tags: tagsMap,
    };
  };

  const openCategoryModal = (category?: HelpCategory) => {
    if (category) {
      setEditingCategoryId(category.id);
      // Extract first available translation for editing
      const nameValue = getFirstAvailableTranslation(category.name, "");
      setCategoryNameInput(nameValue);
      setCategoryForm({
        name: category.name,
        slug: category.slug,
        order: category.order,
        isPublished: category.isPublished,
        locale: category.locale,
        icon: category.icon ?? "",
      });
    } else {
      setEditingCategoryId(null);
      setCategoryNameInput("");
      setCategoryForm(defaultCategoryForm(locale));
    }
    setIsCategoryModalOpen(true);
  };

  const openArticleModal = (article?: HelpArticle) => {
    if (article) {
      setEditingArticleId(article.id);
      // Extract first available translations for editing
      const titleValue = getFirstAvailableTranslation(article.title, "");
      const excerptValue = getFirstAvailableTranslation(article.excerpt, "");
      const contentValue = getFirstAvailableTranslation(article.content, "");
      const tagsArray = getFirstAvailableTags(article.tags, []);
      setArticleTitleInput(titleValue);
      setArticleExcerptInput(excerptValue);
      setArticleContentInput(contentValue);
      setTagInput(tagsArray.join(", "));
      setArticleForm({
        title: article.title,
        slug: article.slug,
        categoryId: article.categoryId,
        excerpt: article.excerpt,
        content: article.content,
        tags: article.tags ?? [],
        readTime: article.readTime,
        order: article.order,
        isPublished: article.isPublished,
        locale: article.locale,
      });
    } else {
      setEditingArticleId(null);
      setArticleTitleInput("");
      setArticleExcerptInput("");
      setArticleContentInput("");
      setTagInput("");
      const defaultCategoryId = selectedCategoryId ?? categories[0]?.id ?? "";
      setArticleForm(defaultArticleForm(locale, defaultCategoryId));
    }
    setIsArticleModalOpen(true);
  };

  const handleSaveCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!categoryNameInput.trim()) {
      alert("Please enter a category name.");
      return;
    }
    setIsSaving(true);
    setTranslating(true);
    try {
      // Translate name and slug to all languages
      const { name: translatedName, slug: translatedSlug } =
        await translateCategory(categoryNameInput.trim());

      const payload = {
        ...categoryForm,
        name: translatedName,
        slug: translatedSlug,
      };

      if (editingCategoryId) {
        await updateHelpCategory(editingCategoryId, payload);
      } else {
        await createHelpCategory(payload);
      }
      
      // Close modal and reset form state first to avoid DOM reconciliation issues
      setIsCategoryModalOpen(false);
      setCategoryNameInput("");
      setEditingCategoryId(null);
      
      // Refresh data after a small delay to allow modal to fully unmount
      setTimeout(() => {
        void refreshAll();
      }, 100);
    } catch (error) {
      console.error("Error saving category", error);
      alert("Error saving category. Please try again.");
    } finally {
      setIsSaving(false);
      setTranslating(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const hasArticles = articles.some((a) => a.categoryId === categoryId);
    if (
      hasArticles &&
      !window.confirm("This category has articles. Delete anyway?")
    ) {
      return;
    }
    setIsSaving(true);
    try {
      await deleteHelpCategory(categoryId);
      await refreshAll();
    } catch (error) {
      console.error("Error deleting category", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveArticle = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!articleForm.categoryId) {
      alert("Select a category for the article.");
      return;
    }
    if (!articleTitleInput.trim() || !articleExcerptInput.trim() || !articleContentInput.trim()) {
      alert("Please fill in title, excerpt, and content.");
      return;
    }
    setIsSaving(true);
    setTranslating(true);
    try {
      const tags = tagInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      // Translate all article fields to all languages
      const {
        title: translatedTitle,
        excerpt: translatedExcerpt,
        content: translatedContent,
        slug: translatedSlug,
        tags: translatedTags,
      } = await translateArticle(
        articleTitleInput.trim(),
        articleExcerptInput.trim(),
        articleContentInput.trim(),
        tags
      );

      const payload = {
        ...articleForm,
        title: translatedTitle,
        excerpt: translatedExcerpt,
        content: translatedContent,
        slug: translatedSlug,
        tags: translatedTags,
      };

      if (editingArticleId) {
        await updateHelpArticle(editingArticleId, payload);
      } else {
        await createHelpArticle(payload);
      }
      
      // Close modal and reset form state first to avoid DOM reconciliation issues
      setIsArticleModalOpen(false);
      setArticleTitleInput("");
      setArticleExcerptInput("");
      setArticleContentInput("");
      setTagInput("");
      setEditingArticleId(null);
      
      // Refresh data after a small delay to allow modal to fully unmount
      setTimeout(() => {
        void refreshAll();
      }, 100);
    } catch (error) {
      console.error("Error saving article", error);
      alert("Error saving article. Please try again.");
    } finally {
      setIsSaving(false);
      setTranslating(false);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    setIsSaving(true);
    try {
      await deleteHelpArticle(articleId);
      await refreshAll();
    } catch (error) {
      console.error("Error deleting article", error);
    } finally {
      setIsSaving(false);
    }
  };

  // const selectedCategory =
  //   categories.find((c) => c.id === selectedCategoryId) ?? null;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6 p-5">
        <div>
          <p className="text-sm text-gray-500">Help Center</p>
          <h1 className="text-2xl font-semibold text-gray-900">
            Manage content
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="primary"
            onClick={() => openArticleModal()}
            disabled={categories.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            New article
          </Button>
          <Button variant="outline" onClick={() => openCategoryModal()}>
            <Plus className="h-4 w-4 mr-2" />
            New category
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-red-600" />
              <h2 className="font-semibold text-gray-900">Categories</h2>
            </div>
            <Button
              size="small"
              variant="ghost"
              onClick={() => openCategoryModal()}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          {isLoading ? (
            <div className="p-6 flex items-center justify-center text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="p-6 text-sm text-gray-500 text-center">
              No categories yet.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className={`p-4 flex items-start justify-between cursor-pointer hover:bg-gray-50 ${
                    selectedCategoryId === category.id ? "bg-red-50" : ""
                  }`}
                  onClick={() => setSelectedCategoryId(category.id)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {typeof category.name === "string"
                          ? category.name
                          : getTranslationForLocale(category.name, locale, "Untitled Category")}
                      </span>
                      {category.isPublished ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700">
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 space-x-2">
                      <span>
                        Slug:{" "}
                        {typeof category.slug === "string"
                          ? category.slug
                          : getTranslationForLocale(category.slug, locale, "")}
                      </span>
                      <span>Order: {category.order}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="small"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCategoryModal(category);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="small"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(category.id);
                      }}
                      disabled={isSaving}
                    >
                      <Trash className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Tag className="h-5 w-5 text-red-600" />
              <h2 className="font-semibold text-gray-900">Articles</h2>
            </div>
            <Button
              size="small"
              variant="outline"
              onClick={() => openArticleModal()}
              disabled={categories.length === 0}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add article
            </Button>
          </div>

          {isLoading ? (
            <div className="p-6 flex items-center justify-center text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading articles...
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="p-6 text-sm text-gray-500 text-center">
              No articles in this locale/category yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredArticles.map((article) => (
                <div key={article.id} className="p-4 flex justify-between">
                  <div className="space-y-1 max-w-3xl">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">
                        {typeof article.title === "string"
                          ? article.title
                          : getTranslationForLocale(article.title, locale, "Untitled Article")}
                      </span>
                      {article.isPublished ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700">
                          Draft
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        Read: {article.readTime} min
                      </span>
                      <span className="text-xs text-gray-500">
                        Order: {article.order}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {typeof article.excerpt === "string"
                        ? article.excerpt
                        : getTranslationForLocale(article.excerpt, locale, "")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {getTagsForLocale(article.tags, locale, []).map((tag, tagIndex) => (
                        <span
                          key={`${article.id}-tag-${tagIndex}-${tag}`}
                          className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="small"
                      variant="ghost"
                      onClick={() => openArticleModal(article)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="small"
                      variant="ghost"
                      onClick={() => handleDeleteArticle(article.id)}
                      disabled={isSaving}
                    >
                      <Trash className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategoryId ? "Edit category" : "New category"}
        size="large"
      >
        <form className="space-y-4" onSubmit={handleSaveCategory}>
          {/* Translation Info Banner */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Auto-Translation Enabled
                </p>
                <p className="text-xs text-blue-700">
                  Enter the category name in any language. The system will automatically detect the language and translate it to all 9 supported languages when you save.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="mt-1 w-full border rounded-md px-3 py-2"
              value={categoryNameInput}
              onChange={(e) => setCategoryNameInput(e.target.value)}
              placeholder="Enter category name in any language..."
              required
              disabled={translating}
            />
            <p className="mt-1 text-xs text-gray-500">
              Language will be auto-detected automatically
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Order
              </label>
              <input
                type="number"
                min={0}
                className="mt-1 w-full border rounded-md px-3 py-2"
                value={categoryForm.order}
                onChange={(e) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    order: Number(e.target.value),
                  }))
                }
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 pt-6">
              <input
                id="category-published"
                type="checkbox"
                className="h-4 w-4 text-red-600"
                checked={categoryForm.isPublished}
                onChange={(e) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    isPublished: e.target.checked,
                  }))
                }
              />
              <label
                htmlFor="category-published"
                className="text-sm text-gray-700"
              >
                Published
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Icon (optional, emoji or class)
            </label>
            <input
              type="text"
              className="mt-1 w-full border rounded-md px-3 py-2"
              value={categoryForm.icon ?? ""}
              onChange={(e) =>
                setCategoryForm((prev) => ({
                  ...prev,
                  icon: e.target.value,
                }))
              }
              placeholder="ex: 🚑 or lucide icon name"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => setIsCategoryModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSaving || translating} disabled={translating}>
              {translating
                ? "Translating..."
                : editingCategoryId
                ? "Update"
                : "Create & Translate"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isArticleModalOpen}
        onClose={() => setIsArticleModalOpen(false)}
        title={editingArticleId ? "Edit article" : "New article"}
        size="large"
      >
        <form className="space-y-4" onSubmit={handleSaveArticle}>
          {/* Translation Info Banner */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Auto-Translation Enabled
                </p>
                <p className="text-xs text-blue-700">
                  Enter your article content in any language. The system will automatically detect the language and translate it to all 9 supported languages when you save.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="mt-1 w-full border rounded-md px-3 py-2"
              value={articleTitleInput}
              onChange={(e) => setArticleTitleInput(e.target.value)}
              placeholder="Enter article title in any language..."
              required
              disabled={translating}
            />
            <p className="mt-1 text-xs text-gray-500">
              Language will be auto-detected automatically
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                className="mt-1 w-full border rounded-md px-3 py-2"
                value={articleForm.categoryId}
                onChange={(e) =>
                  setArticleForm((prev) => ({
                    ...prev,
                    categoryId: e.target.value,
                  }))
                }
                required
              >
                <option value="">Select...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {typeof c.name === "string"
                      ? c.name
                      : getTranslationForLocale(c.name, locale, "Untitled Category")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Locale
              </label>
              <select
                className="mt-1 w-full border rounded-md px-3 py-2"
                value={articleForm.locale}
                onChange={(e) =>
                  setArticleForm((prev) => ({
                    ...prev,
                    locale: e.target.value,
                  }))
                }
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Read time (min)
              </label>
              <input
                type="number"
                min={1}
                className="mt-1 w-full border rounded-md px-3 py-2"
                value={articleForm.readTime}
                onChange={(e) =>
                  setArticleForm((prev) => ({
                    ...prev,
                    readTime: Number(e.target.value),
                  }))
                }
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Excerpt <span className="text-red-500">*</span>
            </label>
            <textarea
              className="mt-1 w-full border rounded-md px-3 py-2"
              rows={3}
              value={articleExcerptInput}
              onChange={(e) => setArticleExcerptInput(e.target.value)}
              placeholder="Enter article excerpt in any language..."
              required
              disabled={translating}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Order
              </label>
              <input
                type="number"
                min={0}
                className="mt-1 w-full border rounded-md px-3 py-2"
                value={articleForm.order}
                onChange={(e) =>
                  setArticleForm((prev) => ({
                    ...prev,
                    order: Number(e.target.value),
                  }))
                }
                required
              />
              <div className="flex items-center space-x-2 mt-3">
                <input
                  id="article-published"
                  type="checkbox"
                  className="h-4 w-4 text-red-600"
                  checked={articleForm.isPublished}
                  onChange={(e) =>
                    setArticleForm((prev) => ({
                      ...prev,
                      isPublished: e.target.checked,
                    }))
                  }
                />
                <label
                  htmlFor="article-published"
                  className="text-sm text-gray-700"
                >
                  Published
                </label>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Content (markdown supported) <span className="text-red-500">*</span>
            </label>
            <textarea
              className="mt-1 w-full border rounded-md px-3 py-2 font-mono text-sm"
              rows={12}
              value={articleContentInput}
              onChange={(e) => setArticleContentInput(e.target.value)}
              placeholder="Enter article content in any language (markdown supported)..."
              required
              disabled={translating}
            />
            <p className="mt-1 text-xs text-gray-500">
              {articleContentInput.length} characters
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tags (comma separated)
            </label>
            <input
              type="text"
              className="mt-1 w-full border rounded-md px-3 py-2"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="sos, urgence, international"
              disabled={translating}
            />
            <p className="mt-1 text-xs text-gray-500">
              Tags will be translated to all languages automatically
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => setIsArticleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSaving || translating} disabled={translating}>
              {translating
                ? "Translating..."
                : editingArticleId
                ? "Update"
                : "Create & Translate"}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
};

export default AdminHelpCenter;
