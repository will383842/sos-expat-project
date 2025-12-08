import React, { useState, useEffect } from "react";
import {
  Search,
  Phone,
  Mail,
  Book,
  Users,
  CreditCard,
  HelpCircle,
  LucideIcon,
} from "lucide-react";
import Layout from "../components/layout/Layout";
import { useApp } from "../contexts/AppContext";
import { useIntl } from "react-intl";
import {
  listHelpCategories,
  listHelpArticles,
  HelpCategory as FirestoreCategory,
  HelpArticle as FirestoreArticle,
} from "../services/helpCenter";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  readTime: number;
  content: string;
}

// Icon mapping from string to component
const iconMap: Record<string, LucideIcon> = {
  phone: Phone,
  book: Book,
  users: Users,
  creditcard: CreditCard,
  helpcircle: HelpCircle,
  mail: Mail,
  search: Search,
};

const getIcon = (iconName?: string): LucideIcon => {
  if (!iconName) return Book;
  const key = iconName.toLowerCase().replace(/[^a-z0-9]/g, "");
  return iconMap[key] || Book;
};

const HelpCenter: React.FC = () => {
  const intl = useIntl();
  const { language } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<
    Array<{
      id: string;
      name: string;
      icon: LucideIcon;
      count: number;
    }>
  >([]);
  const [articles, setArticles] = useState<Article[]>([]);

  // Load categories and articles from Firestore
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const locale = language === "fr" ? "fr" : "en";
        const [firestoreCategories, firestoreArticles] = await Promise.all([
          listHelpCategories(locale),
          listHelpArticles({ locale, onlyPublished: true }),
        ]);

        // Filter only published categories
        const publishedCategories = firestoreCategories.filter(
          (cat) => cat.isPublished
        );

        // Transform Firestore articles to component format
        const transformedArticles: Article[] = firestoreArticles.map(
          (art: FirestoreArticle) => ({
            id: art.id,
            title: art.title,
            excerpt: art.excerpt,
            category: art.categoryId,
            tags: art.tags || [],
            readTime: art.readTime,
            content: art.content,
          })
        );

        // Transform Firestore categories to component format
        const transformedCategories = [
          {
            id: "all",
            name:
              language === "fr" ? "Toutes les catégories" : "All categories",
            icon: Book,
            count: transformedArticles.length,
          },
          ...publishedCategories.map((cat: FirestoreCategory) => ({
            id: cat.id,
            name: cat.name,
            icon: getIcon(cat.icon),
            count: transformedArticles.filter(
              (a) => a.category === cat.id
            ).length,
          })),
        ];

        setArticles(transformedArticles);
        setCategories(transformedCategories);
      } catch (error) {
        console.error("Error loading help center data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [language]);

  // --- Articles (loaded from Firestore) ---
  // Static articles removed - now loaded dynamically

  // --- Filtrage ---
  const filteredArticles = articles.filter((article) => {
    const matchesCategory =
      selectedCategory === "all" || article.category === selectedCategory;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      article.title.toLowerCase().includes(q) ||
      article.excerpt.toLowerCase().includes(q) ||
      article.tags.some((tag) => tag.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  // --- Handlers (inchangés) ---
  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSearchTerm("");
    setSelectedArticle(null);
  };

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
  };

  const handleBackToList = () => {
    setSelectedArticle(null);
  };

  // --- Helper rendu markdown léger (présentation uniquement) ---
  const mdToHtml = (md: string): string => {
    // Échapper le HTML brut
    let html = md
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Titres
    html = html
      .replace(
        /^### (.*)$/gm,
        '<h3 class="mt-6 mb-2 text-xl font-white text-white font-extrabold">$1</h3>'
      )
      .replace(
        /^## (.*)$/gm,
        '<h2 class="mt-8 mb-3 text-2xl font-white text-white">$1</h2>'
      )
      .replace(
        /^# (.*)$/gm,
        '<h1 class="mt-10 mb-4 text-3xl md:text-4xl font-white text-white">$1</h1>'
      );

    // Gras
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Listes
    html = html
      .replace(/^\d+\.\s+(.*)$/gm, "<li>$1</li>")
      .replace(/^-\s+(.*)$/gm, "<li>$1</li>");
    html = html.replace(
      /(?:^|\n)((?:<li>.*<\/li>\n?)+)/g,
      (_m, list: string) =>
        `<ul class="list-disc pl-6 my-4 space-y-1">${list}</ul>`
    );

    // Paragraphes
    html = html.replace(
      /^(?!<h\d|<ul|<\/ul>|<li>|<\/li>|\s*$)(.+)$/gm,
      '<p class="leading-relaxed text-gray-300">$1</p>'
    );

    return html;
  };

  // ======================= Vue article détaillé =======================
  if (selectedArticle) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
          {/* Hero compact */}
          <div className="relative pt-16 pb-10">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-blue-500/10" />
            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <button
                onClick={handleBackToList}
                className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors font-semibold"
                aria-label={
                  language === "fr" ? "Retour aux articles" : "Back to articles"
                }
              >
                <span className="text-white/70">←</span>
                <span>
                  {language === "fr"
                    ? "Retour aux articles"
                    : "Back to articles"}
                </span>
              </button>
            </div>
          </div>

          {/* Carte contenu */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 mt-12">
            <article className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-10 text-white shadow-2xl">
              <div className="mb-6">
                <h1 className="text-3xl md:text-4xl text-white tracking-tight">
                  {selectedArticle.title}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
                    ⏱ {selectedArticle.readTime}{" "}
                    {language === "fr" ? "min de lecture" : "min read"}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div
                className="text-white prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: mdToHtml(selectedArticle.content),
                }}
              />
            </article>
          </div>
        </div>
      </Layout>
    );
  }

  // ======================= Vue liste =======================
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* HERO */}
        <header className="relative bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-blue-500/10" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h1 className="text-4xl md:text-6xl text-white font-bold mb-4">
              {/* {language === 'fr' ? "Centre d'aide" : 'Help Center'} */}
              {intl.formatMessage({ id: "helpCenter.title" })}
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto mb-8">
              {/* {language === 'fr'
                ? 'Trouvez rapidement des réponses et des guides internationaux.'
                : 'Quickly find international answers and guides.'} */}
              {intl.formatMessage({ id: "helpCenter.subtitle" })}
            </p>

            {/* Barre de recherche */}
            <div className="max-w-2xl mx-auto">
              <div className="relative group">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60"
                  size={20}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={
                    // language === "fr"
                    //   ? "Rechercher dans l'aide..."
                    //   : "Search help..."
                    intl.formatMessage({ id: "helpCenter.searchPlaceholder" })
                  }
                  aria-label={
                    // language === "fr"
                    //   ? "Champ de recherche du centre d'aide"
                    //   : "Help center search field"
                    intl.formatMessage({
                      id: "helpCenter.searchLabel",
                    })
                  }
                  className="w-full pl-12 pr-4 py-4 rounded-2xl text-base md:text-lg bg-white/10 border border-white/20 placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-white/40 backdrop-blur-md transition-shadow shadow-[0_0_0_0_rgba(0,0,0,0)] focus:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Contenu */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar catégories */}
            <aside className="lg:col-span-1">
              <div className="sticky top-6 rounded-3xl bg-white border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {/* {language === "fr" ? "Catégories" : "Categories"} */}
                  {intl.formatMessage({ id: "helpCenter.categories" })}
                </h3>
                <div className="space-y-2">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    const isActive = selectedCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryClick(category.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all border ${
                          isActive
                            ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
                            : "text-gray-700 hover:bg-blue-50 hover:text-blue-700 border-transparent"
                        }`}
                        aria-pressed={isActive}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${
                              isActive
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            <Icon size={18} />
                          </span>
                          <span className="font-medium">{category.name}</span>
                        </span>
                        <span
                          className={`text-sm px-2 py-1 rounded-full ${
                            isActive
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {category.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* Liste d’articles */}
            <section className="lg:col-span-3">
              {isLoading ? (
                <div className="text-center py-16">
                  <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-b-0 border-red-600" />
                  <p className="mt-4 text-gray-500">
                    {/* {language === "fr"
                      ? "Chargement des articles..."
                      : "Loading articles..."} */}
                    {intl.formatMessage({ id: "helpCenter.loadingArticles" })}
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                      {selectedCategory === "all"
                        ? intl.formatMessage({ id: "helpCenter.allArticles" })
                        : categories.find((c) => c.id === selectedCategory)
                            ?.name}
                    </h2>
                    <p className="text-gray-600">
                      {filteredArticles.length}{" "}
                      {/* {language === "fr"
                        ? "article(s) trouvé(s)"
                        : "article(s) found"} */}
                      {intl.formatMessage({ id: "helpCenter.articlesFound" })}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredArticles.map((article) => (
                      <article
                        key={article.id}
                        onClick={() => handleArticleClick(article)}
                        className="group cursor-pointer rounded-3xl border border-gray-200 bg-white p-6 hover:shadow-xl transition-all hover:scale-[1.01]"
                        aria-label={article.title}
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-3">
                          {article.excerpt}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-2">
                            {article.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                            ⏱ {article.readTime}{" "}
                            {/* {language === "fr" ? "min de lecture" : "min read"} */}
                            {intl.formatMessage({ id: "helpCenter.minRead" })}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>

                  {filteredArticles.length === 0 && (
                    <div className="text-center py-16">
                      <div className="text-gray-600 text-lg mb-4">
                        {/* {language === "fr"
                          ? "Aucun article trouvé pour ces critères"
                          : "No articles found for these criteria"} */}
                        {intl.formatMessage({
                          id: "helpCenter.noArticlesFound",
                        })}
                      </div>
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedCategory("all");
                        }}
                        className="inline-flex items-center gap-2 font-semibold text-blue-700 hover:text-blue-800"
                      >
                        ↻{" "}
                        {/* {language === "fr"
                          ? "Réinitialiser la recherche"
                          : "Reset search"} */}
                        {intl.formatMessage({ id: "helpCenter.resetSearch" })}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </main>

        {/* Contact Support */}
        <section className="relative bg-gradient-to-r from-red-600 via-red-500 to-orange-500 py-16">
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/20" />
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              {/* {language === "fr"
                ? "Vous ne trouvez pas votre réponse ?"
                : "Can't find your answer?"} */}
              {intl.formatMessage({ id: "helpCenter.supportTitle" })}
            </h2>
            <p className="text-lg md:text-xl text-white/95 mb-8">
              {/* {language === "fr"
                ? "Notre équipe support est disponible 24/7 pour vous aider"
                : "Our support team is available 24/7 to help you"} */}
              {intl.formatMessage({ id: "helpCenter.supportSubtitle" })}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="group relative overflow-hidden bg-white text-red-600 hover:text-red-700 px-8 py-3 rounded-2xl font-semibold transition-all hover:scale-105 border-2 border-white"
              >
                <span className="relative z-10 inline-flex items-center gap-2">
                  <Mail size={20} />
                  <span>
                    {/* {language === "fr" ? "Nous contacter" : "Contact us"} */}
                    {intl.formatMessage({ id: "helpCenter.contactUs" })}
                  </span>
                </span>
                <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-black/5" />
              </a>

              <a
                href="/sos-appel"
                className="group relative overflow-hidden border-2 border-white bg-transparent text-white px-8 py-3 rounded-2xl font-semibold transition-all hover:scale-105 hover:bg-white/10"
              >
                <span className="relative z-10 inline-flex items-center gap-2">
                  <Phone size={20} />
                  <span>
                    {/* {language === "fr" ? "Appel d'urgence" : "Emergency call"} */}
                    {intl.formatMessage({ id: "helpCenter.emergencyCall" })}
                  </span>
                </span>
                <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/30" />
              </a>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default HelpCenter;
