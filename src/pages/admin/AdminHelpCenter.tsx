// src/pages/admin/AdminHelpCenter.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash,
  BookOpen,
  CheckCircle2,
  Languages,
  Loader2,
  Tag,
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

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/['’"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

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

const locales = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
];

const AdminHelpCenter: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [locale, setLocale] = useState<string>("en");
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

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cats, arts] = await Promise.all([
        listHelpCategories(locale),
        listHelpArticles({ locale, onlyPublished: false }), // Load all articles in admin
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
  }, [locale]);

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
    // Refresh data when locale changes
    void refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const filteredArticles = useMemo(() => {
    if (!selectedCategoryId) return articles;
    return articles.filter((a) => a.categoryId === selectedCategoryId);
  }, [articles, selectedCategoryId]);

  const openCategoryModal = (category?: HelpCategory) => {
    if (category) {
      setEditingCategoryId(category.id);
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
      setCategoryForm(defaultCategoryForm(locale));
    }
    setIsCategoryModalOpen(true);
  };

  const openArticleModal = (article?: HelpArticle) => {
    if (article) {
      setEditingArticleId(article.id);
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
      setTagInput((article.tags ?? []).join(", "));
    } else {
      setEditingArticleId(null);
      const defaultCategoryId = selectedCategoryId ?? categories[0]?.id ?? "";
      setArticleForm(defaultArticleForm(locale, defaultCategoryId));
      setTagInput("");
    }
    setIsArticleModalOpen(true);
  };

  const handleSaveCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      if (editingCategoryId) {
        await updateHelpCategory(editingCategoryId, categoryForm);
      } else {
        await createHelpCategory(categoryForm);
      }
      await refreshAll();
      setIsCategoryModalOpen(false);
    } catch (error) {
      console.error("Error saving category", error);
    } finally {
      setIsSaving(false);
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
    setIsSaving(true);
    try {
      const tags = tagInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const payload = { ...articleForm, tags };

      if (editingArticleId) {
        await updateHelpArticle(editingArticleId, payload);
      } else {
        await createHelpArticle(payload);
      }
      await refreshAll();
      setIsArticleModalOpen(false);
    } catch (error) {
      console.error("Error saving article", error);
    } finally {
      setIsSaving(false);
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">Help Center</p>
          <h1 className="text-2xl font-semibold text-gray-900">
            Manage content
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-sm text-gray-600">
            <Languages className="h-4 w-4" />
            <span>Locale</span>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              {locales.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
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
                        {category.name}
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
                      <span>Slug: {category.slug}</span>
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
              {categories.length === 0 && (
                <li className="p-4 text-sm text-gray-500">
                  No categories yet.
                </li>
              )}
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
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredArticles.map((article) => (
                <div key={article.id} className="p-4 flex justify-between">
                  <div className="space-y-1 max-w-3xl">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">
                        {article.title}
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
                      {article.excerpt}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {article.tags?.map((tag) => (
                        <span
                          key={tag}
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
              {filteredArticles.length === 0 && (
                <div className="p-4 text-sm text-gray-500">
                  No articles in this locale/category yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategoryId ? "Edit category" : "New category"}
      >
        <form className="space-y-4" onSubmit={handleSaveCategory}>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              className="mt-1 w-full border rounded-md px-3 py-2"
              value={categoryForm.name}
              onChange={(e) => {
                const nextTitle = e.target.value;
                setCategoryForm((prev) => ({
                  ...prev,
                  name: nextTitle,
                  slug: prev.slug ? prev.slug : slugify(nextTitle),
                }));
              }}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Slug
              </label>
              <input
                type="text"
                className="mt-1 w-full border rounded-md px-3 py-2"
                value={categoryForm.slug}
                onChange={(e) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    slug: slugify(e.target.value),
                  }))
                }
                required
              />
            </div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Locale
              </label>
              <select
                className="mt-1 w-full border rounded-md px-3 py-2"
                value={categoryForm.locale}
                onChange={(e) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    locale: e.target.value,
                  }))
                }
              >
                {locales.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
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
            <Button type="submit" variant="primary" loading={isSaving}>
              {editingCategoryId ? "Update" : "Create"}
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                className="mt-1 w-full border rounded-md px-3 py-2"
                value={articleForm.title}
                onChange={(e) => {
                  const nextTitle = e.target.value;
                  setArticleForm((prev) => ({
                    ...prev,
                    title: nextTitle,
                    slug: prev.slug ? prev.slug : slugify(nextTitle),
                  }));
                }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Slug
              </label>
              <input
                type="text"
                className="mt-1 w-full border rounded-md px-3 py-2"
                value={articleForm.slug}
                onChange={(e) =>
                  setArticleForm((prev) => ({
                    ...prev,
                    slug: slugify(e.target.value),
                  }))
                }
                required
              />
            </div>
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
                {categories
                  .filter((c) => c.locale === articleForm.locale)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
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
                {locales.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
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
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Excerpt
              </label>
              <textarea
                className="mt-1 w-full border rounded-md px-3 py-2"
                rows={3}
                value={articleForm.excerpt}
                onChange={(e) =>
                  setArticleForm((prev) => ({
                    ...prev,
                    excerpt: e.target.value,
                  }))
                }
                required
              />
            </div>
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
              Tags (comma separated)
            </label>
            <input
              type="text"
              className="mt-1 w-full border rounded-md px-3 py-2"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="sos, urgence, international"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Content (markdown supported)
            </label>
            <textarea
              className="mt-1 w-full border rounded-md px-3 py-2 font-mono text-sm"
              rows={12}
              value={articleForm.content}
              onChange={(e) =>
                setArticleForm((prev) => ({ ...prev, content: e.target.value }))
              }
              required
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => setIsArticleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSaving}>
              {editingArticleId ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
};

export default AdminHelpCenter;
