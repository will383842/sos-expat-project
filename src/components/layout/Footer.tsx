
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  ArrowUp,
  LucideIcon,
  Globe,
} from "lucide-react";
import { useIntl } from "react-intl";
import { useApp } from "../../contexts/AppContext";
import { Link } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";

type LegalLink = {
  label: string;
  href: string;
  order?: number;
};

type ContactInfo = {
  icon: LucideIcon;
  text: string;
  href?: string;
  ariaLabel: string;
};

type FooterSection = {
  title: string;
  links: LegalLink[];
};

const IS_DEV = import.meta.env.MODE !== "production";
const SOCIAL = {
  fb: (import.meta.env.VITE_FACEBOOK_URL as string | undefined) || "",
  tw: (import.meta.env.VITE_TWITTER_URL as string | undefined) || "",
  li: (import.meta.env.VITE_LINKEDIN_URL as string | undefined) || "",
};

const Footer: React.FC = () => {
  const intl = useIntl();
  const { language: ctxLang } = useApp();

  // Resolve language from context or intl
  const resolvedLang: "fr" | "en" | "es" = useMemo(() => {
    if (ctxLang === "fr" || ctxLang === "en" || ctxLang === "es") {
      return ctxLang;
    }
    if (intl.locale === "fr" || intl.locale === "en" || intl.locale === "es") {
      return intl.locale;
    }
    return "fr";
  }, [ctxLang, intl.locale]);

  const [legalLinks, setLegalLinks] = useState<LegalLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTop, setShowTop] = useState(false);

  // Default legal links (fallback)
  const defaultLegalLinks = useMemo<LegalLink[]>(
    () => [
      {
        label: intl.formatMessage({ id: "footer.legal.privacy" }),
        href: "/politique-confidentialite",
        order: 10,
      },
      {
        label: intl.formatMessage({ id: "footer.legal.termsClients" }),
        href: "/cgu-clients",
        order: 20,
      },
      { label: "Cookies", href: "/cookies", order: 50 },
      {
        label: intl.formatMessage({ id: "footer.legal.consumers" }),
        href: "/consommateurs",
        order: 60,
      },
    ],
    [intl]
  );

  // Footer sections
  const footerSections = useMemo<Record<string, FooterSection>>(
    () => ({
      services: {
        title: intl.formatMessage({ id: "footer.services.title" }),
        links: [
          {
            label: intl.formatMessage({ id: "footer.services.sosCall" }),
            href: "/sos-appel",
          },
          {
            label: intl.formatMessage({ id: "footer.services.expatCall" }),
            href: "/appel-expatrie",
          },
          {
            label: intl.formatMessage({ id: "footer.services.pricing" }),
            href: "/tarifs",
          },
          {
            label: intl.formatMessage({ id: "footer.services.experts" }),
            href: "/nos-experts",
          },
          {
            label: intl.formatMessage({ id: "footer.services.testimonials" }),
            href: "/temoignages",
          },
        ],
      },
      support: {
        title: intl.formatMessage({ id: "footer.support.title" }),
        links: [
          { label: "FAQ", href: "/faq" },
          {
            label: intl.formatMessage({ id: "footer.support.contact" }),
            href: "/contact",
          },
          {
            label: intl.formatMessage({ id: "footer.support.helpCenter" }),
            href: "/centre-aide",
          },
          {
            label: intl.formatMessage({ id: "footer.support.serviceStatus" }),
            href: "/statut-service",
          },
        ],
      },
    }),
    [intl]
  );

  const contactInfo = useMemo<ContactInfo[]>(
    () => [
      {
        icon: Globe,
        text: intl.formatMessage({ id: "footer.contact.presence" }),
        ariaLabel: intl.formatMessage({ id: "footer.contact.locationAria" }),
      },
      {
        icon: Phone,
        text: intl.formatMessage({ id: "footer.contact.callUs" }),
        href: "/contact",
        ariaLabel: intl.formatMessage({ id: "footer.contact.phoneAria" }),
      },
      {
        icon: Globe,
        text: intl.formatMessage({ id: "footer.contact.ulixai" }),
        href: "https://www.ulixai.com/",
        ariaLabel: intl.formatMessage({ id: "footer.contact.ulixaiAria" }),
      },
    ],
    [intl]
  );

  const socialLinks = useMemo(
    () => [
      {
        icon: Facebook,
        href: SOCIAL.fb || "#",
        ariaLabel: intl.formatMessage({ id: "footer.social.facebookAria" }),
        name: "Facebook",
      },
      {
        icon: Twitter,
        href: SOCIAL.tw || "#",
        ariaLabel: intl.formatMessage({ id: "footer.social.twitterAria" }),
        name: "Twitter",
      },
      {
        icon: Linkedin,
        href: SOCIAL.li || "#",
        ariaLabel: intl.formatMessage({ id: "footer.social.linkedinAria" }),
        name: "LinkedIn",
      },
    ],
    [intl]
  );

  // Load legal documents from Firestore (with cache + fallback)
  useEffect(() => {
    let isMounted = true;

    const CACHE_KEY = `legal_links_${resolvedLang}`;
    const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

    const readCache = (): LegalLink[] | null => {
      try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const { ts, data } = JSON.parse(raw);
        if (Date.now() - ts > CACHE_TTL_MS) return null;
        return data as LegalLink[];
      } catch {
        return null;
      }
    };

    const writeCache = (data: LegalLink[]) => {
      try {
        sessionStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ ts: Date.now(), data })
        );
      } catch {
        /* ignore */
      }
    };

    const loadLegalDocuments = async () => {
      const cached = readCache();
      if (cached && cached.length) {
        setLegalLinks(
          cached.filter(
            (l) =>
              ![
                "CGU Avocats",
                "CGU Expatriés",
                "Lawyer Terms",
                "Expat Terms",
              ].includes(l.label)
          )
        );
        setIsLoading(false);
      }

      try {
        if (!db) {
          if (IS_DEV)
            console.log("[Footer] Firebase indisponible, fallback par défaut");
          if (isMounted && !cached) {
            setLegalLinks(defaultLegalLinks);
            setIsLoading(false);
          }
          return;
        }

        setIsLoading(!cached);

        const col = collection(db, "legal_documents");
        const qLang = query(
          col,
          where("language", "==", resolvedLang),
          where("isActive", "==", true)
        );
        const qLocale = query(
          col,
          where("locale", "==", resolvedLang),
          where("isActive", "==", true)
        );

        let snapshot = await getDocs(qLang);
        if (snapshot.empty) snapshot = await getDocs(qLocale);

        if (!isMounted) return;

        if (snapshot.empty) {
          if (IS_DEV) console.log("[Footer] Aucun doc légal en base, fallback");
          if (!cached) setLegalLinks(defaultLegalLinks);
          writeCache(defaultLegalLinks);
        } else {
          const items: LegalLink[] = snapshot.docs
            .map((d) => {
              const data = d.data() as Record<string, unknown>;
              const title = String(
                (data.title || data.type || "Document") ?? "Document"
              );
              const order =
                typeof data.order === "number" ? (data.order as number) : 999;

              const slug =
                typeof data.slug === "string" ? data.slug : undefined;
              const path =
                typeof data.path === "string" ? data.path : undefined;
              const type = typeof data.type === "string" ? data.type : "";

              const href = path
                ? path
                : slug
                  ? `/${slug}`
                  : type === "terms"
                    ? "/cgu-clients"
                    : type === "privacy"
                      ? "/politique-confidentialite"
                      : type === "cookies"
                        ? "/cookies"
                        : type === "legal"
                          ? "/consommateurs"
                          : type === "faq"
                            ? "/faq"
                            : type === "help"
                              ? "/centre-aide"
                              : type === "seo"
                                ? "/referencement"
                                : `/${type || "legal"}`;

              return { label: title, href, order };
            })
            .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
            .filter(
              (l) =>
                ![
                  "CGU Avocats",
                  "CGU Expatriés",
                  "Lawyer Terms",
                  "Expat Terms",
                ].includes(l.label)
            );

          setLegalLinks(items);
          writeCache(items);
        }
      } catch (err) {
        console.error("[Footer] Erreur Firestore legal_documents:", err);
        if (!isMounted && cached) return;
        if (!cached) setLegalLinks(defaultLegalLinks);
        writeCache(defaultLegalLinks);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadLegalDocuments();
    return () => {
      isMounted = false;
    };
  }, [resolvedLang, defaultLegalLinks]);

  // UX: scroll to top button
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setShowTop(window.scrollY > 160);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    if ("scrollTo" in window) {
      const reduceMotion =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    }
  }, []);

  const jsonLd = useMemo(() => {
    const sameAs: string[] = [SOCIAL.fb, SOCIAL.tw, SOCIAL.li].filter(Boolean);
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "SOS Urgently",
      url:
        typeof window !== "undefined"
          ? window.location.origin
          : "https://sos-urgently.example",
      logo:
        typeof window !== "undefined"
          ? `${window.location.origin}/logo.svg`
          : undefined,
      description: intl.formatMessage({ id: "footer.company.description" }),
      sameAs,
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          areaServed: ["FR", "EN", "ES"],
          availableLanguage: ["French", "English", "Spanish"],
        },
      ],
    };
  }, [intl]);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <footer
      className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white overflow-hidden"
      role="contentinfo"
      aria-label={intl.formatMessage({ id: "footer.ariaLabel" })}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-blue-500/5" />
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-blue-500/8 rounded-full blur-2xl animate-pulse delay-1000" />
      </div>

      {showTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 group
                    bg-gradient-to-r from-red-500 to-red-600 
                    text-white p-3 rounded-2xl shadow-xl 
                    hover:shadow-red-500/25 hover:scale-110 
                    focus:scale-110 active:scale-95
                    transition-all duration-300 ease-out
                    focus:outline-none focus:ring-2 focus:ring-red-500/50
                    backdrop-blur-sm border border-red-400/20"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
          }}
          aria-label={intl.formatMessage({ id: "footer.scrollToTop" })}
        >
          <ArrowUp
            size={18}
            className="transform group-hover:translate-y-[-2px] transition-transform duration-300"
            aria-hidden
          />
        </button>
      )}

      <div className="relative backdrop-blur-sm bg-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
            {/* Company Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="group">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
                    <div className="relative bg-gradient-to-r from-red-500 to-red-600 p-2.5 rounded-xl shadow-lg">
                      <Phone className="text-white" size={18} aria-hidden />
                    </div>
                  </div>
                  <div>
                    <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      SOS Urgently
                    </span>
                    <div className="h-0.5 w-12 bg-gradient-to-r from-red-500 to-red-600 mt-1" />
                  </div>
                </div>

                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  {intl.formatMessage({ id: "footer.company.description" })}
                </p>
              </div>

              <div
                className="flex space-x-3"
                role="list"
                aria-label={intl.formatMessage({
                  id: "footer.social.ariaLabel",
                })}
              >
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href || "#"}
                    className="group p-2.5 rounded-xl bg-white/5 border border-white/10 
                               hover:bg-white/10 hover:border-white/20 hover:scale-105 
                               focus:bg-white/10 focus:border-white/20 focus:scale-105 
                               transition-all duration-300 focus:outline-none 
                               touch-manipulation active:scale-95"
                    aria-label={social.ariaLabel}
                    target={
                      social.href.startsWith("http") ? "_blank" : undefined
                    }
                    rel={
                      social.href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                  >
                    <social.icon
                      size={16}
                      className="text-gray-400 group-hover:text-white transition-colors duration-300"
                      aria-hidden
                    />
                  </a>
                ))}
              </div>
            </div>

            {/* Services */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                {footerSections.services.title}
                <div className="w-6 h-px bg-gradient-to-r from-red-500 to-red-600" />
              </h3>
              <nav
                aria-label={intl.formatMessage({
                  id: "footer.services.navAria",
                })}
              >
                <ul className="space-y-2">
                  {footerSections.services.links.map((link, index) => (
                    <li key={index}>
                      <Link
                        to={link.href}
                        className="group flex items-center text-gray-400 hover:text-white 
                                   focus:text-white transition-all duration-300 text-sm 
                                   focus:outline-none py-1.5 px-2 -mx-2 rounded-lg 
                                   hover:bg-white/5 focus:bg-white/5 touch-manipulation"
                      >
                        <span
                          className="w-1 h-1 bg-gray-600 rounded-full mr-3 
                                       group-hover:bg-red-400 group-focus:bg-red-400 
                                       transition-colors duration-300"
                        />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                {footerSections.support.title}
                <div className="w-6 h-px bg-gradient-to-r from-red-500 to-red-600" />
              </h3>
              <nav
                aria-label={intl.formatMessage({
                  id: "footer.support.navAria",
                })}
              >
                <ul className="space-y-2">
                  {footerSections.support.links.map((link, index) => (
                    <li key={index}>
                      <Link
                        to={link.href}
                        className="group flex items-center text-gray-400 hover:text-white 
                                   focus:text-white transition-all duration-300 text-sm 
                                   focus:outline-none py-1.5 px-2 -mx-2 rounded-lg 
                                   hover:bg-white/5 focus:bg-white/5 touch-manipulation"
                      >
                        <span
                          className="w-1 h-1 bg-gray-600 rounded-full mr-3 
                                       group-hover:bg-red-400 group-focus:bg-red-400 
                                       transition-colors duration-300"
                        />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                {intl.formatMessage({ id: "footer.contact.title" })}
                <div className="w-6 h-px bg-gradient-to-r from-red-500 to-red-600" />
              </h3>
              <ul className="space-y-3">
                {contactInfo.map((item, index) => (
                  <li key={index} className="group">
                    <div
                      className="flex items-start space-x-3 p-2 rounded-lg transition-all duration-300 
                                    hover:bg-white/5 focus-within:bg-white/5"
                    >
                      <div
                        className="flex-shrink-0 p-1.5 rounded-lg bg-white/5 border border-white/10 
                                      group-hover:bg-white/10 group-hover:border-white/20 
                                      transition-all duration-300"
                      >
                        <item.icon
                          size={14}
                          className="text-red-400"
                          aria-hidden
                        />
                      </div>
                      {item.href ? (
                        <Link
                          to={item.href}
                          className="text-gray-400 hover:text-white focus:text-white 
                                     transition-colors duration-300 text-sm 
                                     focus:outline-none leading-relaxed touch-manipulation"
                          aria-label={item.ariaLabel}
                        >
                          {item.text}
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-sm leading-relaxed">
                          {item.text}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
            <div className="relative flex justify-center">
              <div className="mx-2 bg-gradient-to-br bg-transparent from-slate-900 via-slate-900  px-4">
                <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-pulse" />
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="text-gray-400 text-sm text-center lg:text-left order-2 lg:order-1">
              <span className="font-medium text-white">
                © {currentYear} SOS Urgently.
              </span>
              <span className="ml-1">
                {intl.formatMessage({ id: "footer.copyright" })}
              </span>
            </div>

            <nav
              className="order-1 lg:order-2"
              aria-label={intl.formatMessage({ id: "footer.legal.navAria" })}
            >
              {isLoading ? (
                <div
                  className="flex items-center gap-3 text-gray-400 animate-pulse"
                  aria-live="polite"
                >
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce delay-200" />
                  </div>
                  <span className="text-sm">
                    {intl.formatMessage({ id: "common.loading" })}
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap justify-center lg:justify-end gap-1 text-sm">
                  {legalLinks.map((link, index) => (
                    <React.Fragment key={`${link.href}-${index}`}>
                      <Link
                        to={link.href}
                        className="px-3 py-2 rounded-lg text-gray-400 hover:text-white 
                                   focus:text-white transition-all duration-300 
                                   hover:bg-white/5 focus:bg-white/5 focus:outline-none
                                   touch-manipulation relative group overflow-hidden"
                      >
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/10 
                                      opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"
                        />
                        <span className="relative z-10">{link.label}</span>
                      </Link>
                      {index < legalLinks.length - 1 && (
                        <span
                          className="text-gray-600 select-none flex items-center px-1"
                          aria-hidden
                        >
                          <div className="w-1 h-1 bg-gray-600 rounded-full" />
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </nav>
          </div>
        </div>

        <div className="h-1 bg-gradient-to-r from-red-500/50 via-red-600/80 to-red-500/50" />
      </div>
    </footer>
  );
};

export default Footer;
