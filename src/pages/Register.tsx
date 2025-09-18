// src/pages/Register.tsx
import React, { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Scale, Users, UserCheck, ArrowRight, Star, Shield, Clock, Sparkles, Download } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useApp } from '../contexts/AppContext';

/* ============ Safe gtag (no any) ============ */
type GtagFunction = (...args: unknown[]) => void;
interface GtagWindow { gtag?: GtagFunction }
const getGtag = (): GtagFunction | undefined =>
  (typeof window !== 'undefined' ? (window as unknown as GtagWindow).gtag : undefined);

/* ============ PWA install hook ============ */
type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BIPEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BIPEvent);
    };
    const onAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      const gtag = getGtag();
      if (gtag) {
        gtag('event', 'pwa_installed', { event_category: 'engagement' });
      }
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return { started: false as const };
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      const gtag = getGtag();
      if (choice && gtag) {
        gtag('event', 'pwa_install_prompt', {
          event_category: 'engagement',
          outcome: choice.outcome,
          platform: choice.platform,
        });
      }
      return { started: true as const };
    } catch {
      return { started: false as const };
    }
  }, [deferredPrompt]);

  return { install, isInstalled, canInstall: !!deferredPrompt };
};

/* ============ PWA Install Component ============ */
interface PWAInstallSectionProps {
  canInstall: boolean;
  onInstall: () => void;
}

function PWAInstallSection({ canInstall, onInstall }: PWAInstallSectionProps) {
  const [showHint, setShowHint] = useState(false);
  const [hintText, setHintText] = useState('');
  const hideTimer = useRef<number | null>(null);

  const computeHint = () => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || 
      ((navigator as any).platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);
    const isDesktop = !isIOS && !isAndroid;

    const prefix = 'Votre navigateur ne permet pas l\'installation automatique. ';
    if (isIOS) return prefix + 'Sur iPhone/iPad : Safari → « Partager » → « Sur l\'écran d\'accueil ». 😊';
    if (isAndroid) return prefix + 'Sur Android : Chrome → menu ⋮ → « Installer l\'application ». 😊';
    if (isDesktop) return prefix + 'Sur ordinateur : Chrome/Edge → icône « Installer » dans la barre d\'adresse.';
    return prefix + 'Essayez avec Chrome/Edge (ordinateur) ou Safari/Chrome (mobile).';
  };

  const reveal = (text?: string) => {
    if (hideTimer.current) { 
      window.clearTimeout(hideTimer.current); 
      hideTimer.current = null; 
    }
    setHintText(text ?? computeHint());
    setShowHint(true);
  };

  const scheduleHide = (delay = 1600) => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setShowHint(false), delay) as unknown as number;
  };

  const onClick = () => {
    if (canInstall) onInstall();
    else { 
      reveal(); 
      scheduleHide(2800); 
    }
  };

  return (
    <div className="relative z-10 mt-12 sm:mt-16">
      <div className="bg-gradient-to-r from-purple-600/20 via-violet-600/20 to-indigo-600/20 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-purple-400/30 shadow-2xl shadow-purple-500/20">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <button
                onClick={onClick}
                onTouchStart={() => { 
                  reveal('L\'app qui change la vie des expats ! 🚀'); 
                  scheduleHide(1400); 
                }}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden border-4 border-orange-400/50 hover:border-orange-300/70 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-orange-400/40 touch-manipulation shadow-2xl shadow-orange-500/30"
                aria-label="Télécharger l'application SOS Expats"
              >
                {/* Nouvelle icône avec image ronde */}
                <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center p-1">
                  <div className="w-full h-full rounded-2xl overflow-hidden">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      <defs>
                        <clipPath id="circle-clip">
                          <circle cx="100" cy="100" r="95" />
                        </clipPath>
                      </defs>
                      <circle cx="100" cy="100" r="95" fill="#E53E3E" />
                      <g clipPath="url(#circle-clip)">
                        {/* Triangle d'alerte */}
                        <path d="M100 40 L140 100 L60 100 Z" fill="white" />
                        {/* Point d'exclamation */}
                        <rect x="95" y="55" width="10" height="25" fill="#E53E3E" rx="2" />
                        <circle cx="100" cy="90" r="5" fill="#E53E3E" />
                        {/* Texte SOS */}
                        <text x="100" y="135" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold">SOS</text>
                        {/* Texte Expats */}
                        <text x="100" y="165" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">Expats</text>
                      </g>
                    </svg>
                  </div>
                </div>
              </button>
              
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-black px-2 py-1 rounded-full shadow-lg animate-pulse">
                NEW
              </div>
            </div>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent mb-3">
            📱 Télécharge l&apos;app SOS Expats !
          </h3>
          
          <p className="text-purple-200 text-base sm:text-lg leading-relaxed mb-6 max-w-lg mx-auto">
            L&apos;aide d&apos;urgence dans ta poche ! Accès instantané aux experts, même hors connexion.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onClick}
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500/40 touch-manipulation shadow-xl shadow-purple-500/30"
            >
              <Download className="w-6 h-6 group-hover:animate-bounce" />
              <span>{canInstall ? 'Installer maintenant' : 'Télécharger l\'app'}</span>
            </button>
            
            <div className="flex items-center gap-2 text-sm text-purple-300">
              <Shield className="w-4 h-4 text-green-400" />
              <span>100% gratuit & sécurisé</span>
            </div>
          </div>

          <div
            className={`absolute left-1/2 -translate-x-1/2 mt-4 w-[280px] sm:w-[320px] text-sm rounded-2xl shadow-2xl border transition-all duration-200 ${
              showHint ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'
            } bg-white/95 backdrop-blur-xl border-gray-200 text-gray-900`}
            role="status"
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/95 rotate-45 border-l border-t border-gray-200" />
            <div className="px-4 py-3">
              <div className="font-bold text-gray-900">L&apos;app qui change tout ! 🚀</div>
              {hintText && <div className="mt-1 leading-relaxed text-gray-700">{hintText}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ i18n léger (FR/EN) ============ */
const useTranslation = () => {
  const { language } = useApp();
  const lang = (language as 'fr' | 'en') || 'fr';

  const dict: Record<string, Record<'fr' | 'en', string>> = {
    'meta.title': {
      fr: "Inscription - SOS Expats | Choisissez votre profil ✨",
      en: 'Sign up - SOS Expats | Choose your profile ✨',
    },
    'meta.description': {
      fr: "Rejoignez SOS Expats : choisissez un profil (Client, Avocat, Expatrié) pour profiter d'une aide sympa et efficace, 24/7 et multilingue 🌍.",
      en: 'Join SOS Expats: choose a profile (Client, Lawyer, Expat) to get friendly and effective help, 24/7 and multilingual 🌍.',
    },
    'og.title': {
      fr: 'Inscription SOS Expats - Choisissez votre profil 🌴',
      en: 'SOS Expats Sign up - Choose your profile 🌴',
    },
    'og.description': {
      fr: "Plateforme d'aide sympa et efficace pour expatriés & conseils juridiques. Toujours là pour vous, même en vacances 😎.",
      en: 'Friendly and effective help for expats & legal advisory. Here for you, even on holiday 😎.',
    },
    'register.title': { 
      fr: 'Qui êtes-vous ? 🚀', 
      en: 'Who are you? 🚀' 
    },
    'register.subtitle': { 
      fr: 'Rejoignez la famille SOS Expats !', 
      en: 'Join the SOS Expats family!' 
    },
    'register.description': {
      fr: 'Choisissez votre camp et on vous emmène dans l\'aventure ! 🌟',
      en: 'Pick your side and we\'ll take you on the adventure! 🌟',
    },
    'register.loginPrompt': {
      fr: 'déjà dans la team ? Connectez-vous !',
      en: 'already on the team? Sign in!',
    },
    'register.bookingMessage': {
      fr: 'Après ton inscription, on te redirige direct pour finaliser ta résa ! 🎯',
      en: "After signing up, we'll redirect you to finish your booking! 🎯",
    },
    'register.needHelp': { 
      fr: "Un souci ? On est là ! ", 
      en: 'Need help? We got you! ' 
    },
    'register.contactUs': { 
      fr: 'Écris-nous 💬', 
      en: 'Hit us up 💬' 
    },
    'register.termsAccept': { 
      fr: 'En t\'inscrivant, tu acceptes nos', 
      en: 'By signing up, you agree to our' 
    },
    'register.termsLink': { 
      fr: "conditions (promis c'est pas chiant à lire)", 
      en: 'terms (promise they\'re not boring)' 
    },
    'register.secureData': { 
      fr: 'Tes données sont safe 🔒', 
      en: 'Your data is safe 🔒' 
    },
    'register.freeRegistration': { 
      fr: 'Inscription 100% gratuite 🎉', 
      en: '100% free signup 🎉' 
    },
    'role.client': { 
      fr: 'J\'ai besoin d\'aide', 
      en: 'I need help' 
    },
    'role.lawyer': { 
      fr: 'Je suis avocat(e)', 
      en: 'I\'m a lawyer' 
    },
    'role.expat': { 
      fr: 'Je suis expatrié(e)', 
      en: 'I\'m an expat' 
    },
    'role.client.desc': {
      fr: "J'ai des galères d'expat et j'ai besoin de conseils qui marchent vraiment ! 🆘",
      en: 'I have expat troubles and need advice that actually works! 🆘',
    },
    'role.lawyer.desc': {
      fr: 'Je connais le droit et je veux aider des expats tout en gagnant ma vie ! 💼',
      en: 'I know the law and want to help expats while making good money! 💼',
    },
    'role.expat.desc': {
      fr: "J'ai galéré, j'ai appris, et maintenant je veux aider les autres (et me faire un petit extra) ! 🌍",
      en: 'I\'ve struggled, learned, and now I want to help others (and make some extra cash)! 🌍',
    },
    'role.lawyer.cta': {
      fr: "Booste ton chiffre d'affaires en aidant des expats ! Tu décides quand être en ligne, tu réponds aux appels, tu factures. Simple et efficace ! 💰⚖️",
      en: "Boost your revenue helping expats! You decide when to go online, answer calls, and bill. Simple and effective! 💰⚖️",
    },
    'role.expat.cta': {
      fr: "Du petit extra au gros revenu, c'est TOI qui choisis ! Un clic pour passer en ligne → joignable 24h → payé direct. À toi de voir ton niveau d'implication ! 🎯💸",
      en: "From small extras to big income, YOU choose! One click to go online → available 24h → paid directly. Up to you how involved you want to be! 🎯💸",
    },
    'role.client.f1': { 
      fr: 'Conseils dans ta langue 🗣️', 
      en: 'Advice in your language 🗣️' 
    },
    'role.client.f2': { 
      fr: 'Dispo même à 3h du mat 🌙', 
      en: 'Available even at 3am 🌙' 
    },
    'role.client.f3': { 
      fr: 'Réponses ultra rapides ⚡', 
      en: 'Lightning fast answers ⚡' 
    },
    'role.lawyer.f1': { 
      fr: 'Clients du monde entier 🌏', 
      en: 'Clients worldwide 🌏' 
    },
    'role.lawyer.f2': { 
      fr: 'Travaille dans plusieurs langues 🎯', 
      en: 'Work in multiple languages 🎯' 
    },
    'role.lawyer.f3': { 
      fr: 'Revenus quand tu veux 💵', 
      en: 'Earn when you want 💵' 
    },
    'role.expat.f1': { 
      fr: 'Aide concrète sur le terrain 🛠️', 
      en: 'Real hands-on help 🛠️' 
    },
    'role.expat.f2': { 
      fr: 'Partage ton vécu 📖', 
      en: 'Share your experience 📖' 
    },
    'role.expat.f3': { 
      fr: 'Gagne en aidant 🤝💰', 
      en: 'Earn while helping 🤝💰' 
    },
    'badge.24_7': { 
      fr: 'Toujours là pour toi ! ⏰', 
      en: 'Always here for you! ⏰' 
    },
    'badge.multi': { 
      fr: 'On parle toutes les langues ! 🌍', 
      en: 'We speak all languages! 🌍' 
    },
    'register.topBadge': {
      fr: '🎉 Déjà +15K expats dans la team !',
      en: '🎉 Already +15K expats on the team!'
    },
    'register.mainTitle': {
      fr: 'Bienvenue dans l\'aventure',
      en: 'Welcome to the adventure'
    },
    'register.mainSubtitle': {
      fr: 'SOS Expats',
      en: 'SOS Expats'
    },
  };

  const t = (key: string) => dict[key]?.[lang] ?? dict[key]?.fr ?? key;
  return { t, language: lang };
};

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { t, language } = useTranslation();
  const { install, canInstall } = usePWAInstall();

  const redirectUrl = searchParams.get('redirect');
  const encodedRedirectUrl = encodeURIComponent(redirectUrl || '/dashboard');

  const handleRoleSelect = useCallback(
    (role: 'client' | 'lawyer' | 'expat') => {
      const registerUrl = redirectUrl ? `/register/${role}?redirect=${encodedRedirectUrl}` : `/register/${role}`;
      const gtag = getGtag();
      if (gtag) gtag('event', 'register_role_select', { role, redirect: !!redirectUrl });
      navigate(registerUrl, { state: location.state });
    },
    [redirectUrl, encodedRedirectUrl, navigate, location.state]
  );

  const navigateToLogin = useCallback(() => {
    const loginUrl = redirectUrl ? `/login?redirect=${encodedRedirectUrl}` : '/login';
    navigate(loginUrl, { state: location.state });
  }, [redirectUrl, encodedRedirectUrl, navigate, location.state]);

  const onInstallClick = useCallback(() => { 
    install(); 
  }, [install]);

  const roles = useMemo(
    () => [
      {
        id: 'client' as const,
        title: t('role.client'),
        description: t('role.client.desc'),
        icon: UserCheck,
        cardGradient: 'from-blue-600 via-blue-500 to-cyan-500',
        border: 'border-blue-400/50',
        bgGlow: 'bg-blue-500/20',
        features: [t('role.client.f1'), t('role.client.f2'), t('role.client.f3')],
        cta: '',
        emoji: '🆘',
        emojiSecondary: '💡',
      },
      {
        id: 'lawyer' as const,
        title: t('role.lawyer'),
        description: t('role.lawyer.desc'),
        icon: Scale,
        cardGradient: 'from-red-600 via-red-500 to-orange-500',
        border: 'border-red-400/50',
        bgGlow: 'bg-red-500/20',
        features: [t('role.lawyer.f1'), t('role.lawyer.f2'), t('role.lawyer.f3')],
        cta: t('role.lawyer.cta'),
        emoji: '⚖️',
        emojiSecondary: '💰',
      },
      {
        id: 'expat' as const,
        title: t('role.expat'),
        description: t('role.expat.desc'),
        icon: Users,
        cardGradient: 'from-emerald-600 via-green-500 to-teal-500',
        border: 'border-emerald-400/50',
        bgGlow: 'bg-emerald-500/20',
        features: [t('role.expat.f1'), t('role.expat.f2'), t('role.expat.f3')],
        cta: t('role.expat.cta'),
        emoji: '🌍',
        emojiSecondary: '✈️',
      },
    ],
    [t]
  );

  useEffect(() => {
    const originalTitle = document.title;
    document.title = t('meta.title');

    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
      return el;
    };

    setMeta('description', t('meta.description'));
    setMeta('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMeta('language', language);
    setMeta('og:type', 'website', true);
    setMeta('og:title', t('og.title'), true);
    setMeta('og:description', t('og.description'), true);
    setMeta('og:url', window.location.href, true);
    setMeta('og:site_name', 'SOS Expats', true);
    setMeta('og:locale', language === 'en' ? 'en_US' : 'fr_FR', true);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', t('og.title'));
    setMeta('twitter:description', t('og.description'));

    const currentLangPath = language === 'en' ? 'en' : 'fr';
    const canonicalUrl = `${window.location.origin}/${currentLangPath}/register`;
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(n => n.parentElement?.removeChild(n));
    const alternates: Record<string, string> = {
      fr: `${window.location.origin}/fr/register`,
      en: `${window.location.origin}/en/register`,
    };
    Object.entries(alternates).forEach(([langKey, url]) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = langKey;
      link.href = url;
      document.head.appendChild(link);
    });
    const xDefault = document.createElement('link');
    xDefault.rel = 'alternate';
    xDefault.hreflang = 'x-default';
    xDefault.href = alternates.fr;
    document.head.appendChild(xDefault);

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      name: t('meta.title'),
      description: t('meta.description'),
      url: canonicalUrl,
      inLanguage: language,
      isPartOf: { 
        '@type': 'WebSite', 
        '@id': `${window.location.origin}#website`, 
        name: 'SOS Expats', 
        url: window.location.origin 
      },
      mainEntity: {
        '@type': 'Thing',
        name: t('register.title'),
        description: t('register.description'),
      },
      potentialAction: {
        '@type': 'RegisterAction',
        target: { 
          '@type': 'EntryPoint', 
          urlTemplate: canonicalUrl, 
          actionPlatform: ['MobileWebApp', 'DesktopWebBrowser'] 
        },
      },
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'structured-data-register';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    const gtag = getGtag();
    if (gtag) gtag('event', 'register_page_view', { lang: language });

    return () => {
      document.title = originalTitle;
      document.getElementById('structured-data-register')?.remove();
    };
  }, [t, language]);

  return (
    <Layout>
      <main className="min-h-screen bg-gray-950 py-4 px-3 sm:py-8 sm:px-4 lg:py-12 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-transparent to-blue-500/20" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-gradient-to-r from-red-500/30 to-orange-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] sm:w-[400px] sm:h-[400px] bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        <div className="relative z-10 max-w-sm mx-auto sm:max-w-2xl lg:max-w-6xl">
          <header className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center space-x-2 sm:space-x-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-full pl-4 pr-3 sm:pl-6 sm:pr-4 py-2 sm:py-3 border border-yellow-400/50 mb-4 sm:mb-6 shadow-lg shadow-yellow-500/25">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 animate-pulse" />
              <span className="text-yellow-200 font-bold text-xs sm:text-sm">
                {t('register.topBadge')}
              </span>
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-ping" />
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                {t('register.mainTitle')}
              </span>
              <br />
              <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent animate-pulse">
                {t('register.mainSubtitle')}
              </span>
            </h1>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-3 sm:mb-4">
              {t('register.title')}
            </h2>

            <p className="text-base sm:text-lg lg:text-xl text-gray-300 leading-relaxed mb-4 sm:mb-6">
              {language === 'fr' ? 'Ou ' : 'Or '}{' '}
              <button
                onClick={navigateToLogin}
                className="font-bold text-transparent bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text hover:from-red-300 hover:to-orange-300 underline underline-offset-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-950 rounded-sm touch-manipulation"
                aria-label={language === 'fr' ? 'Se connecter à votre compte existant' : 'Sign in to your existing account'}
              >
                {t('register.loginPrompt')}
              </button>
            </p>

            {redirectUrl && redirectUrl.includes('/booking-request/') && (
              <div
                className="p-4 sm:p-6 bg-gradient-to-r from-blue-500/30 to-indigo-500/30 border border-blue-400/50 rounded-2xl sm:rounded-3xl shadow-2xl shadow-blue-500/25 backdrop-blur-sm mb-4 sm:mb-6"
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-start justify-center space-x-3 sm:space-x-4">
                  <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400 mt-0.5 flex-shrink-0 animate-pulse" aria-hidden="true" />
                  <p className="text-sm sm:text-base text-blue-200 font-semibold leading-relaxed text-center">{t('register.bookingMessage')}</p>
                </div>
              </div>
            )}
          </header>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-6 sm:mb-8">
            <span className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-purple-500/30 to-violet-500/30 text-white border border-purple-400/50 backdrop-blur-sm shadow-lg shadow-purple-500/25 touch-manipulation">
              <Clock className="w-4 h-4 animate-pulse" /> {t('badge.24_7')}
            </span>
            <span className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-violet-500/30 to-purple-500/30 text-white border border-violet-400/50 backdrop-blur-sm shadow-lg shadow-violet-500/25 touch-manipulation">
              <Users className="w-4 h-4 animate-pulse" /> {t('badge.multi')}
            </span>
          </div>

          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-3 sm:mb-4">
              {t('register.subtitle')}
            </h2>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">{t('register.description')}</p>
          </div>

          <section className="mb-8 sm:mb-12">
            <div className="flex flex-col space-y-6 sm:space-y-8 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <article key={role.id} className="group relative">
                    <button
                      onClick={() => handleRoleSelect(role.id)}
                      className="w-full h-auto min-h-[200px] sm:min-h-[220px] lg:min-h-[320px] text-left relative overflow-hidden rounded-2xl sm:rounded-3xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-white/30 touch-manipulation flex flex-col shadow-2xl"
                      aria-label={`${language === 'fr' ? "S'inscrire en tant que" : 'Sign up as'} ${role.title}. ${role.description}`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${role.cardGradient} opacity-90 group-hover:opacity-100 transition-opacity duration-500`} />
                      <div className={`absolute inset-0 ${role.bgGlow} blur-xl group-hover:blur-2xl transition-all duration-500`} />
                      <div className={`absolute inset-0 border-2 ${role.border} rounded-2xl sm:rounded-3xl group-hover:border-white/60 transition-colors duration-500`} />

                      <div className="relative z-10 p-4 sm:p-6 lg:p-8 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-2xl sm:text-3xl opacity-60">{role.emojiSecondary}</div>
                          <div className="bg-white/20 rounded-full px-2 py-1 backdrop-blur-sm">
                            <span className="text-white text-xs font-bold uppercase tracking-wide">
                              {language === 'fr' ? 'Populaire' : 'Popular'}
                            </span>
                          </div>
                        </div>

                        <div className="text-center mb-4 sm:mb-6">
                          <div className="mb-3">
                            <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 group-hover:scale-110 transition-transform duration-500">
                              {role.emoji}
                            </div>
                          </div>
                          
                          <h3 className="font-black text-white text-lg sm:text-xl lg:text-2xl mb-2 sm:mb-3 group-hover:scale-105 transition-transform duration-300">
                            {role.title}
                          </h3>
                          
                          <p className="text-white/95 text-sm sm:text-base leading-relaxed font-medium">
                            {role.description}
                          </p>
                        </div>

                        {role.cta && (
                          <div className="bg-gradient-to-r from-black/40 to-black/20 rounded-xl p-3 sm:p-4 backdrop-blur-sm border border-white/30 mb-4 flex-shrink-0 group-hover:border-white/50 transition-colors duration-300">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="text-lg">{role.emojiSecondary}</div>
                              <span className="text-white font-black text-xs">BONUS</span>
                            </div>
                            <p className="text-white/95 text-xs sm:text-sm leading-relaxed font-semibold">
                              {role.cta}
                            </p>
                          </div>
                        )}

                        {!role.cta && (
                          <div className="mb-4 flex-shrink-0">
                            <div className="h-8 sm:h-10 lg:h-12"></div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-2 mb-4 sm:mb-6 flex-grow">
                          {role.features.map((f, idx) => (
                            <div key={idx} className="bg-white/10 rounded-lg p-2 sm:p-3 backdrop-blur-sm border border-white/20 group-hover:bg-white/15 transition-colors duration-300">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0">
                                  <div className="w-2 h-2 rounded-full bg-white"></div>
                                </div>
                                <span className="text-white font-bold text-xs sm:text-sm">
                                  {f}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="text-center mt-auto">
                          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/25 backdrop-blur-sm border border-white/50 group-hover:bg-white/35 group-hover:scale-110 transition-all duration-300 text-white font-black text-sm sm:text-base touch-manipulation shadow-xl">
                            <span>{language === 'fr' ? 'C\'est parti !' : 'Let\'s go!'}</span>
                            <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform duration-300" aria-hidden="true" />
                          </div>
                        </div>
                      </div>
                    </button>
                  </article>
                );
              })}
            </div>
          </section>

          <PWAInstallSection canInstall={canInstall} onInstall={onInstallClick} />

          <footer className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-white/20">
            <div className="text-center space-y-4 sm:space-y-6">
              <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
                {t('register.termsAccept')}{' '}
                <Link
                  to="/cgu-clients"
                  className="text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text hover:from-blue-300 hover:to-purple-300 underline underline-offset-2 transition-all font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-950 rounded-sm touch-manipulation"
                  rel="noopener"
                >
                  {t('register.termsLink')}
                </Link>
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm">
                <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-300 border border-purple-400/30 backdrop-blur-sm touch-manipulation">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                  {t('register.secureData')}
                </span>
                <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 border border-violet-400/30 backdrop-blur-sm touch-manipulation">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                  {t('register.freeRegistration')}
                </span>
              </div>
            </div>
          </footer>

          <aside className="mt-8 sm:mt-12 text-center">
            <div className="inline-flex items-center gap-2 text-gray-400 leading-relaxed text-sm sm:text-base">
              <span>{t('register.needHelp')}</span>
              <Link
                to="/contact"
                className="inline-flex items-center gap-1 text-transparent bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text hover:from-orange-300 hover:to-red-300 underline underline-offset-2 transition-all font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-950 rounded-sm touch-manipulation"
              >
                {t('register.contactUs')}
              </Link>
              <span className="text-base sm:text-xl animate-bounce">👋</span>
            </div>
          </aside>
        </div>
      </main>
    </Layout>
  );
};

export default Register;