import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getLocaleString, parseLocaleFromPath } from "../../utils/localeRoutes";
import {
  Menu,
  X,
  Phone,
  Shield,
  ChevronDown,
  Globe,
  User as UserIcon,
  UserPlus,
  Settings,
  LogOut,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useApp } from "../../contexts/AppContext";
import {
  doc,
  updateDoc,
  setDoc,
  onSnapshot,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
  collection,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import type { User } from "../../contexts/types";

/** ================================
 *  Types & Global
 *  ================================ */
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

interface Language {
  code: "fr" | "en" | "es" | "ru" | "de" | "hi" | "pt" | "ch" | "ar";
  name: string;
  nativeName: string;
  flag: React.ReactNode;
}

interface NavigationItem {
  path: string;
  labelKey: string;
  mobileIcon?: string;
  desktopIcon?: string;
  showInMobileMenu?: boolean;
}

type WithAuthExtras = User & {
  uid?: string;
  displayName?: string;
  profilePhoto?: string;
  photoURL?: string;
  isVerified?: boolean;
  isOnline?: boolean;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

/** ================================
 *  Flags
 *  ================================ */
const FrenchFlag = memo(() => (
  <div
    className="relative p-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg ring-1 ring-white/20"
    role="img"
    aria-label="Drapeau français"
  >
    <div className="w-6 h-4 rounded-md overflow-hidden shadow-sm flex">
      <div className="w-1/3 h-full bg-blue-600" />
      <div className="w-1/3 h-full bg-white" />
      <div className="w-1/3 h-full bg-red-600" />
    </div>
  </div>
));
FrenchFlag.displayName = "FrenchFlag";

const BritishFlag = memo(() => (
  <div
    className="relative p-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg ring-1 ring-white/20"
    role="img"
    aria-label="Drapeau britannique"
  >
    <div className="w-6 h-4 rounded-md overflow-hidden shadow-sm relative bg-blue-800">
      <div className="absolute inset-0">
        <div className="absolute w-full h-0.5 bg-white rotate-45 top-1/2 left-0 -translate-y-1/2" />
        <div className="absolute w-full h-0.5 bg-white -rotate-45 top-1/2 left-0 -translate-y-1/2" />
      </div>
      <div className="absolute inset-0">
        <div
          className="absolute w-full h-px bg-red-600 rotate-45"
          style={{ top: "calc(50% - 1px)" }}
        />
        <div
          className="absolute w-full h-px bg-red-600 -rotate-45"
          style={{ top: "calc(50% + 1px)" }}
        />
      </div>
      <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white -translate-x-1/2" />
      <div className="absolute left-0 top-1/2 w-full h-0.5 bg-white -translate-y-1/2" />
      <div className="absolute top-0 left-1/2 w-px h-full bg-red-600 -translate-x-1/2" />
      <div className="absolute left-0 top-1/2 w-full h-px bg-red-600 -translate-y-1/2" />
    </div>
  </div>
));
BritishFlag.displayName = "BritishFlag";

const SpanishFlag = memo(() => (
  <div
    className="relative p-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg ring-1 ring-white/20"
    role="img"
    aria-label="Bandera española"
  >
    <div className="w-6 h-4 rounded-md overflow-hidden shadow-sm flex flex-col">
      <div className="w-full h-1/3 bg-red-600" />
      <div className="w-full h-1/3 bg-yellow-400" />
      <div className="w-full h-1/3 bg-red-600" />
    </div>
  </div>
));
SpanishFlag.displayName = "SpanishFlag";

const RussianFlag = memo(() => (
  <div
    className="relative p-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg ring-1 ring-white/20"
    role="img"
    aria-label="Российский флаг"
  >
    <div className="w-6 h-4 rounded-md overflow-hidden shadow-sm flex flex-col">
      <div className="w-full h-1/3 bg-white" />
      <div className="w-full h-1/3 bg-blue-600" />
      <div className="w-full h-1/3 bg-red-600" />
    </div>
  </div>
));
RussianFlag.displayName = "RussianFlag";

const GermanFlag = memo(() => (
  <div
    className="relative p-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg ring-1 ring-white/20"
    role="img"
    aria-label="Deutsche Flagge"
  >
    <div className="w-6 h-4 rounded-md overflow-hidden shadow-sm flex flex-col">
      <div className="w-full h-1/3 bg-black" />
      <div className="w-full h-1/3 bg-red-600" />
      <div className="w-full h-1/3 bg-yellow-400" />
    </div>
  </div>
));
GermanFlag.displayName = "GermanFlag";

const IndianFlag = memo(() => (
  <div
    className="relative p-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg ring-1 ring-white/20"
    role="img"
    aria-label="भारतीय ध्वज"
  >
    <div className="w-6 h-4 rounded-md overflow-hidden shadow-sm flex flex-col">
      <div className="w-full h-1/3 bg-orange-500" />
      <div className="w-full h-1/3 bg-white flex items-center justify-center">
        <div className="w-2 h-2 border-2 border-blue-800 rounded-full relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1 h-1 bg-blue-800 rounded-full"></div>
          </div>
        </div>
      </div>
      <div className="w-full h-1/3 bg-green-600" />
    </div>
  </div>
));
IndianFlag.displayName = "IndianFlag";

const ChineseFlag = memo(() => (
  <div
    className="relative p-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg ring-1 ring-white/20"
    role="img"
    aria-label="中国国旗"
  >
    <div className="relative w-6 h-4 rounded-md overflow-hidden shadow-sm bg-red-600 flex items-start justify-start">
      <div className="absolute top-0.5 left-0.5 text-yellow-400" style={{ fontSize: "0.5rem" }}>
        ★
      </div>
      <div className="absolute top-[0.15rem] left-[1.2rem] text-yellow-400" style={{ fontSize: "0.3rem" }}>
        ★
      </div>
      <div className="absolute top-[0.45rem] left-[1.45rem] text-yellow-400" style={{ fontSize: "0.3rem" }}>
        ★
      </div>
      <div className="absolute top-[0.8rem] left-[1.4rem] text-yellow-400" style={{ fontSize: "0.3rem" }}>
        ★
      </div>
      <div className="absolute top-[1.05rem] left-[1.1rem] text-yellow-400" style={{ fontSize: "0.3rem" }}>
        ★
      </div>
    </div>
  </div>
));
ChineseFlag.displayName = "ChineseFlag";

const PortugueseFlag = memo(() => (
  <div
    className="relative p-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg ring-1 ring-white/20"
    role="img"
    aria-label="Bandeira portuguesa"
  >
    <div className="w-6 h-4 rounded-md overflow-hidden shadow-sm flex">
      <div className="w-2/5 h-full bg-green-600" />
      <div className="w-3/5 h-full bg-red-600 flex items-center justify-center">
        <div className="w-2 h-2 bg-yellow-300 rounded-full" />
      </div>
    </div>
  </div>
));
PortugueseFlag.displayName = "PortugueseFlag";

const ArabicFlag = memo(() => (
  <div className="relative p-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg ring-1 ring-white/20" role="img" aria-label="العلم العربي">
    <div className="w-6 h-4 rounded-md overflow-hidden shadow-sm flex flex-col">
      <div className="w-full h-1/3 bg-black"></div>
      <div className="w-full h-1/3 bg-white"></div>
      <div className="w-full h-1/3 bg-green-600"></div>
      <div className="absolute inset-0 flex items-center">
        <div className="w-1/4 h-full bg-red-600"></div>
      </div>
    </div>
  </div>
));
ArabicFlag.displayName = "ArabicFlag";

/** ================================
 *  i18n Config
 *  ================================ */
const SUPPORTED_LANGUAGES: Language[] = [
  { code: "fr", name: "French", nativeName: "Français", flag: <FrenchFlag /> },
  { code: "en", name: "English", nativeName: "English", flag: <BritishFlag /> },
  { code: "es", name: "Spanish", nativeName: "Español", flag: <SpanishFlag /> },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: <RussianFlag /> },
  { code: "de", name: "German", nativeName: "Deutsch", flag: <GermanFlag /> },
  { code: "hi", name: "Hindi", nativeName: "हिंदी", flag: <IndianFlag /> },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: <PortugueseFlag /> },
  { code: "ch", name: "Chinese", nativeName: "中国人", flag: <ChineseFlag /> },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: <ArabicFlag /> }
];

const LEFT_NAVIGATION_ITEMS: NavigationItem[] = [
  { path: "/", labelKey: "nav.home", mobileIcon: "🏠", desktopIcon: "🏠", showInMobileMenu: true },
  {
    path: "/sos-appel",
    labelKey: "nav.viewProfiles",
    mobileIcon: "👥",
    desktopIcon: "👥",
    showInMobileMenu: false,
  },
  {
    path: "/testimonials",
    labelKey: "nav.testimonials",
    mobileIcon: "💬",
    desktopIcon: "💬",
    showInMobileMenu: false,
  },
];

const RIGHT_NAVIGATION_ITEMS: NavigationItem[] = [
  {
    path: "/how-it-works",
    labelKey: "nav.howItWorks",
    mobileIcon: "⚡",
    desktopIcon: "⚡",
    showInMobileMenu: false,
  },
  {
    path: "/pricing",
    labelKey: "nav.pricing",
    mobileIcon: "💎",
    desktopIcon: "💎",
    showInMobileMenu: true,
  },
];

const ALL_NAVIGATION_ITEMS = [
  ...LEFT_NAVIGATION_ITEMS,
  ...RIGHT_NAVIGATION_ITEMS,
];

const MOBILE_NAVIGATION_ITEMS = ALL_NAVIGATION_ITEMS.filter(
  item => item.showInMobileMenu !== false
);

/** ================================
 *  Hooks
 *  ================================ */
const useScrolled = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 120);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return scrolled;
};

/** ================================
 *  Availability logic
 *  ================================ */
const useAvailabilityToggle = () => {
  const { user } = useAuth();
  const typedUser: WithAuthExtras | null = user as WithAuthExtras | null;

  const [isOnline, setIsOnline] = useState<boolean>(!!typedUser?.isOnline);
  const [isUpdating, setIsUpdating] = useState(false);
  const sosSnapshotSubscribed = useRef(false);

  const isProvider =
    typedUser?.role === "lawyer" || typedUser?.role === "expat";

  const userId = useMemo<string | undefined>(() => {
    if (!typedUser) return undefined;
    return typedUser.uid ?? typedUser.id;
  }, [typedUser]);

  const writeSosProfile = useCallback(
    async (newStatus: boolean) => {
      if (!typedUser || !isProvider || !userId) return;

      const sosRef = doc(db, "sos_profiles", userId);
      const updateData = {
        isOnline: newStatus,
        availability: newStatus ? "available" : "unavailable",
        lastStatusChange: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isVisible: true,
        isVisibleOnMap: true,
      };

      try {
        await updateDoc(sosRef, updateData);
        return;
      } catch {
        /* pass */
      }

      try {
        const snap = await getDoc(sosRef);
        if (!snap.exists()) {
          const newProfileData = {
            type: typedUser.role,
            fullName:
              typedUser.fullName ||
              `${typedUser.firstName || ""} ${typedUser.lastName || ""}`.trim() ||
              "Expert",
            ...updateData,
            isActive: true,
            isApproved: typedUser.role !== "lawyer",
            isVerified: !!typedUser.isVerified,
            rating: 5.0,
            reviewCount: 0,
            createdAt: serverTimestamp(),
          };
          await setDoc(sosRef, newProfileData, { merge: true });
          return;
        }
      } catch {
        /* pass */
      }

      const q = query(
        collection(db, "sos_profiles"),
        where("uid", "==", userId)
      );
      const found = await getDocs(q);
      if (!found.empty) {
        const batch = writeBatch(db);
        found.docs.forEach((d) => batch.update(d.ref, updateData));
        await batch.commit();
        return;
      }

      await setDoc(
        sosRef,
        {
          type: typedUser.role,
          fullName:
            typedUser.fullName ||
            `${typedUser.firstName || ""} ${typedUser.lastName || ""}`.trim() ||
            "Expert",
          ...updateData,
          isActive: true,
          isApproved: typedUser.role !== "lawyer",
          isVerified: !!typedUser.isVerified,
          rating: 5.0,
          reviewCount: 0,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
    },
    [typedUser, isProvider, userId]
  );

  const writeUsersPresenceBestEffort = useCallback(
    async (newStatus: boolean) => {
      if (!typedUser || !userId) return;

      const userRef = doc(db, "users", userId);
      const payload = {
        isOnline: newStatus,
        availability: newStatus ? "available" : "unavailable",
        lastStatusChange: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      try {
        await updateDoc(userRef, payload);
      } catch {
        try {
          await setDoc(userRef, { uid: userId, ...payload }, { merge: true });
        } catch (e2) {
          console.warn("Users presence update ignorée :", e2);
        }
      }
    },
    [typedUser, userId]
  );

  useEffect(() => {
    if (!typedUser || !isProvider || !userId) return;
    if (sosSnapshotSubscribed.current) return;
    sosSnapshotSubscribed.current = true;

    const sosRef = doc(db, "sos_profiles", userId);

    const un = onSnapshot(
      sosRef,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        if (!data) return;
        const next = data.isOnline === true;
        setIsOnline((prev) => (prev !== next ? next : prev));
      },
      (err) => console.error("Erreur snapshot sos_profiles:", err)
    );

    return () => {
      sosSnapshotSubscribed.current = false;
      un();
    };
  }, [typedUser, isProvider, userId]);

  useEffect(() => {
    if (typeof typedUser?.isOnline !== "undefined")
      setIsOnline(!!typedUser.isOnline);
  }, [typedUser?.isOnline]);

  const toggle = useCallback(async () => {
    if (!typedUser || isUpdating) return;

    const newStatus = !isOnline;
    setIsUpdating(true);

    try {
      await writeSosProfile(newStatus);
      await writeUsersPresenceBestEffort(newStatus);

      setIsOnline(newStatus);

      window.dispatchEvent(
        new CustomEvent("availability:changed", {
          detail: { isOnline: newStatus },
        })
      );
      window.dispatchEvent(
        new CustomEvent("availabilityChanged", {
          detail: { isOnline: newStatus },
        })
      );

      window.gtag?.("event", "online_status_change", {
        event_category: "engagement",
        event_label: newStatus ? "online" : "offline",
      });
    } catch (e) {
      console.error("Erreur online/offline :", e);
    } finally {
      setIsUpdating(false);
    }
  }, [
    isOnline,
    isUpdating,
    typedUser,
    writeSosProfile,
    writeUsersPresenceBestEffort,
  ]);

  return { isOnline, isUpdating, isProvider, toggle };
};

/** ================================
 *  Desktop Availability Toggle
 *  ================================ */
const HeaderAvailabilityToggle = memo(() => {
  const { language } = useApp();
  const { isOnline, isUpdating, isProvider, toggle } = useAvailabilityToggle();

  if (!isProvider) return null;
  const t = {
    online: language === "fr" ? "En ligne" : "Online",
    offline: language === "fr" ? "Hors ligne" : "Offline",
  };

  return (
    <button
      onClick={() => {
        toggle();
      }}
      disabled={isUpdating}
      type="button"
      className={`group flex items-center px-4 py-2.5 rounded-xl font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-white/50 min-h-[44px] ${
        isOnline
          ? "bg-green-500 hover:bg-green-600 text-white shadow-lg"
          : "bg-gray-500 hover:bg-gray-600 text-white shadow-lg"
      } ${isUpdating ? "opacity-75 cursor-not-allowed" : ""}`}
      style={{ border: "2px solid white", boxSizing: "border-box" }}
      aria-label={`Changer le statut vers ${isOnline ? t.offline : t.online}`}
    >
      {isUpdating ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
      ) : isOnline ? (
        <Wifi className="w-4 h-4 mr-2" />
      ) : (
        <WifiOff className="w-4 h-4 mr-2" />
      )}
      <span>{isOnline ? `🟢 ${t.online}` : `🔴 ${t.offline}`}</span>
    </button>
  );
});
HeaderAvailabilityToggle.displayName = "HeaderAvailabilityToggle";

/** ================================
 *  User Avatar
 *  ================================ */
const UserAvatar = memo<{ user: User | null; size?: "sm" | "md" }>(
  ({ user, size = "md" }) => {
    const [imageError, setImageError] = useState(false);
    const sizeClasses = size === "sm" ? "w-10 h-10" : "w-12 h-12";

    const u = user as WithAuthExtras | null;
    const photoUrl = u?.profilePhoto || u?.photoURL;
    const displayName = u?.firstName || u?.displayName || u?.email || "User";
    const onError = useCallback(() => setImageError(true), []);

    if (!photoUrl || imageError) {
      return (
        <div
          className={`${sizeClasses} rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-base ring-2 ring-white/30`}
          aria-label={`Avatar de ${displayName}`}
        >
          {displayName?.charAt(0).toUpperCase?.()}
        </div>
      );
    }

    return (
      <div className="relative">
        <img
          src={photoUrl}
          alt={`Avatar de ${displayName}`}
          className={`${sizeClasses} rounded-full object-cover ring-2 ring-white/30`}
          onError={onError}
          loading="lazy"
        />
        <div
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-white"
          aria-label="En ligne"
        />
      </div>
    );
  }
);
UserAvatar.displayName = "UserAvatar";

/** ================================
 *  Language Dropdown
 *  ================================ */
const LanguageDropdown = memo<{
  isMobile?: boolean;
}>(({ isMobile = false }) => {
  const { language, setLanguage } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLanguage =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) ||
    SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = useCallback(
    (langCode: "fr" | "en" | "es" | "ru" | "de" | "hi" | "pt" | "ch" | "ar") => {
      setLanguage(langCode);
      setOpen(false);
      
      const { pathname } = location;
      
      if (pathname.startsWith("/admin") || pathname.startsWith("/marketing")) {
        window.gtag?.("event", "language_change", {
          event_category: "engagement",
          event_label: langCode,
        });
        return;
      }
      
      const { pathWithoutLocale } = parseLocaleFromPath(pathname);
      const newLocale = getLocaleString(langCode);
      
      const newPath = pathWithoutLocale === "/" 
        ? `/${newLocale}` 
        : `/${newLocale}${pathWithoutLocale}`;
      
      navigate(newPath, { replace: true });
      
      window.gtag?.("event", "language_change", {
        event_category: "engagement",
        event_label: langCode,
      });
    },
    [setLanguage, location, navigate]
  );

  if (isMobile) {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium bg-white/20 backdrop-blur-xl text-white hover:bg-white/30 border border-white/20"
          aria-expanded={open}
          aria-label="Sélectionner la langue"
        >
          <div className="flex items-center">
            <Globe className="w-4 h-4 mr-2 text-white" />
            <div className="mr-2">{currentLanguage.flag}</div>
            <span className="text-sm font-semibold">{currentLanguage.nativeName}</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="absolute left-0 right-0 mt-2 rounded-xl shadow-2xl py-1 z-50 max-h-60 overflow-y-auto bg-gray-900/95 backdrop-blur-xl border border-white/10">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`group flex items-center w-full px-4 py-2.5 text-sm ${
                  language === lang.code
                    ? "bg-white/20 text-white font-semibold"
                    : "text-gray-300 hover:bg-white/10"
                }`}
                aria-pressed={language === lang.code}
              >
                <div className="mr-3">{lang.flag}</div>
                <span>{lang.nativeName}</span>
                {language === lang.code && (
                  <div className="ml-auto w-2 h-2 bg-red-500 rounded-full" aria-label="Langue actuelle" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="group flex items-center space-x-2 text-white hover:text-yellow-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 min-h-[44px] min-w-[44px] justify-center"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Sélectionner la langue"
      >
        <div>{currentLanguage.flag}</div>
        <ChevronDown className={`w-4 h-4 ${open ? "rotate-180 text-yellow-300" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl py-2 z-50 border border-gray-100">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`group flex items-center w-full px-4 py-3 text-sm text-left hover:bg-gray-50 rounded-xl mx-1 focus:outline-none focus:bg-gray-50 ${
                language === lang.code
                  ? "bg-red-50 text-red-600 font-semibold"
                  : "text-gray-700"
              }`}
              aria-pressed={language === lang.code}
            >
              <div className="mr-3">{lang.flag}</div>
              <span>{lang.nativeName}</span>
              {language === lang.code && (
                <div className="ml-auto w-2 h-2 bg-red-500 rounded-full" aria-label="Langue actuelle" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
LanguageDropdown.displayName = "LanguageDropdown";

/** ================================
 *  PWA Area (desktop)
 *  ================================ */
const PWAInstallArea = memo(({ scrolled }: { scrolled: boolean }) => {
  const { language } = useApp();

  return (
    <Link to="/" className="flex items-center select-none group" aria-label="Go to home">
      <div className="relative w-[72px] h-[72px] rounded-2xl overflow-hidden bg-transparent shrink-0">
        <img
          src="/icons/icon-72x72.png"
          alt="SOS Expat Logo"
          className="w-full h-full object-cover"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src.includes('icon-72x72.png')) {
              img.src = '/sos-logo.jpg';
            }
          }}
        />
      </div>

      <div className="ml-3">
        <div className="flex flex-col leading-tight text-center">
          <span
            className={`font-extrabold text-sm ${scrolled ? "text-white" : "text-gray-900"}`}
          >
            SOS Expat
          </span>
          <span className="text-sm font-semibold">
            <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              {language === "fr" ? "d'Ulixai" : "by Ulixai"}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
});
PWAInstallArea.displayName = "PWAInstallArea";

/** ================================
 *  PWA icon button (mobile)
 *  ================================ */
const PWAIconButton = memo(() => {
  const { language } = useApp();

  return (
    <Link 
      to="/"
      className="w-16 h-16 rounded-2xl overflow-hidden bg-transparent focus:outline-none focus:ring-2 focus:ring-red-500/50"
      aria-label={language === "fr" ? "Retour à l'accueil" : "Go to home"}
    >
      <img
        src="/icons/icon-72x72.png"
        alt="SOS Expat Logo"
        className="w-full h-full object-cover"
        onError={(e) => {
          const img = e.currentTarget;
          if (img.src.includes('icon-72x72.png')) {
            img.src = '/sos-logo.jpg';
          }
        }}
      />
    </Link>
  );
});
PWAIconButton.displayName = "PWAIconButton";

/** ================================
 *  User Menu
 *  ================================ */
const UserMenu = memo<{ isMobile?: boolean; scrolled?: boolean }>(
  ({ isMobile = false, scrolled = false }) => {
    const { user, logout } = useAuth();
    const typedUser: WithAuthExtras | null = user as WithAuthExtras | null;
    const { language } = useApp();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (ref.current && !ref.current.contains(event.target as Node))
          setOpen(false);
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = useCallback(async () => {
      try {
        await logout();
        setOpen(false);
        window.gtag?.("event", "logout", { event_category: "engagement" });
        try {
          navigate("/", { replace: true });
        } catch {
          window.location.assign("/");
        }
      } catch (error) {
        console.error("Logout error:", error);
        try {
          navigate("/", { replace: true });
        } catch {
          window.location.assign("/");
        }
      }
    }, [logout, navigate]);

    const t = {
      login:
        language === "fr" ? "Connexion"
        : language === "es" ? "Iniciar sesión"
        : language === "pt" ? "Entrar"
        : language === "de" ? "Anmelden"
        : language === "ru" ? "Войти"
        : language === "hi" ? "लॉगिन"
        : language === "ch" ? "登录"
        : language === "ar" ? "تسجيل الدخول"
        : "Login",
        
      signup:
        language === "fr" ? "S'inscrire"
        : language === "es" ? "Registrarse"
        : language === "pt" ? "Cadastrar-se"
        : language === "de" ? "Registrieren"
        : language === "ru" ? "Зарегистрироваться"
        : language === "hi" ? "साइन अप करें"
        : language === "ch" ? "报名"
        : language === "ar" ? "التسجيل"
        : "Sign up",
        
      dashboard:
        language === "fr" ? "Tableau de bord"
        : language === "es" ? "Panel de control"
        : language === "pt" ? "Painel de controle"
        : language === "de" ? "Dashboard"
        : language === "ru" ? "Панель управления"
        : language === "hi" ? "डैशबोर्ड"
        : language === "ch" ? "仪表板"
        : language === "ar" ? "لوحة التحكم"
        : "Dashboard",
        
      adminConsole:
        language === "fr" ? "Console Admin"
        : language === "es" ? "Consola de Administración"
        : language === "pt" ? "Console de Administração"
        : language === "de" ? "Admin-Konsole"
        : language === "ru" ? "Консоль администратора"
        : language === "hi" ? "एडमिन कंसोल"
        : language === "ch" ? "管理控制台"
        : language === "ar" ? "وحدة التحكم الإدارية"
        : "Admin Console",
        
      logout:
        language === "fr" ? "Déconnexion"
        : language === "es" ? "Cerrar sesión"
        : language === "pt" ? "Sair"
        : language === "de" ? "Abmelden"
        : language === "ru" ? "Выйти"
        : language === "hi" ? "लॉग आउट"
        : language === "ch" ? "退出"
        : language === "ar" ? "تسجيل الخروج"
        : "Logout",
    };

    // NON CONNECTÉ
    if (!typedUser) {
      const loginBtnDesktop = scrolled
        ? "group relative p-3 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 min-h-[44px] min-w-[44px] flex items-center justify-center"
        : "group relative p-3 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500/20 min-h-[44px] min-w-[44px] flex items-center justify-center border border-gray-200";
      const loginIconDesktop = scrolled
        ? "w-5 h-5 text-white group-hover:text-yellow-200"
        : "w-5 h-5 text-red-600";

      const registerBtnDesktop = scrolled
        ? "group relative p-3 rounded-full bg-white hover:bg-gray-50 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500/40 min-h-[44px] min-w-[44px] flex items-center justify-center"
        : "group relative p-3 rounded-full bg-red-600 hover:bg-red-700 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 min-h-[44px] min-w-[44px] flex items-center justify-center";
      const registerIconDesktop = scrolled
        ? "w-5 h-5 text-red-600"
        : "w-5 h-5 text-white";

      const authLinks = (
        <>
          <Link
            to="/login"
            className={
              isMobile
                ? "group flex items-center justify-center w-full bg-white text-red-600 px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 font-semibold min-h-[44px]"
                : loginBtnDesktop
            }
            aria-label={t.login}
          >
            {isMobile ? (
              <>
                <UserIcon className="w-5 h-5 mr-3" />
                <span>{t.login}</span>
              </>
            ) : (
              <UserIcon className={loginIconDesktop} />
            )}
          </Link>
          <Link
            to="/register"
            className={
              isMobile
                ? "group flex items-center justify-center w-full bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 font-bold shadow min-h-[44px]"
                : registerBtnDesktop
            }
            aria-label={t.signup}
          >
            {isMobile ? (
              <>
                <UserPlus className="w-5 h-5 mr-3" />
                <span>{t.signup}</span>
              </>
            ) : (
              <UserPlus className={registerIconDesktop} />
            )}
          </Link>
        </>
      );
      return isMobile ? (
        <div className="flex gap-3">{authLinks}</div>
      ) : (
        <div className="flex items-center space-x-4">{authLinks}</div>
      );
    }

    // CONNECTÉ MOBILE
    if (isMobile) {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white/20 backdrop-blur-sm rounded-xl">
            <div className="flex items-center gap-3">
              <UserAvatar user={typedUser} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-white text-sm truncate">
                  {typedUser.firstName || typedUser.displayName || typedUser.email}
                </div>
                <div className="text-xs text-white/70 capitalize">
                  {typedUser.role || "Utilisateur"}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {typedUser.role === "admin" && (
              <Link
                to="/admin/dashboard"
                className="flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 min-h-[44px]"
                aria-label={t.adminConsole}
              >
                <Shield className="w-4 h-4 mr-2" />
                <span>Admin</span>
              </Link>
            )}
            <Link
              to="/dashboard"
              className="flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 min-h-[44px]"
              aria-label={t.dashboard}
            >
              <Settings className="w-4 h-4 mr-2" />
              <span>{language === "fr" ? "Profil" : "Profile"}</span>
            </Link>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 w-full min-h-[44px]"
            aria-label={t.logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span>{t.logout}</span>
          </button>
        </div>
      );
    }

    // CONNECTÉ DESKTOP
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className={`${scrolled ? "text-white" : "text-black"} group flex items-center space-x-3 p-2 rounded-full focus:outline-none focus:ring-2 ${scrolled ? "focus:ring-white/50" : "focus:ring-black/50"} min-h-[44px]`}
          aria-expanded={open}
          aria-haspopup="true"
          aria-label="Menu utilisateur"
        >
          <UserAvatar user={typedUser} />
          <span className="text-sm font-medium hidden md:inline">
            {typedUser.firstName || typedUser.displayName || "User"}
          </span>
          <ChevronDown className={`w-4 h-4 ${open ? "rotate-180 text-yellow-300" : ""}`} />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl py-2 z-50 border border-gray-100">
            <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-50 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <UserAvatar user={typedUser} />
                <div>
                  <div className="font-semibold text-gray-900">
                    {typedUser.firstName || typedUser.displayName || typedUser.email}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {typedUser.role || "Utilisateur"}
                  </div>
                </div>
              </div>
            </div>

            <div className="py-1">
              {typedUser.role === "admin" && (
                <Link
                  to="/admin/dashboard"
                  className="group flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-xl mx-1 focus:outline-none focus:bg-red-50"
                  onClick={() => setOpen(false)}
                >
                  <Shield className="w-4 h-4 mr-3" />
                  {t.adminConsole}
                </Link>
              )}
              <Link
                to="/dashboard"
                className="group flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-xl mx-1 focus:outline-none focus:bg-red-50"
                onClick={() => setOpen(false)}
              >
                <Settings className="w-4 h-4 mr-3" />
                {t.dashboard}
              </Link>
              <hr className="my-1 border-gray-100" />
              <button
                onClick={handleLogout}
                className="group flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl mx-1 focus:outline-none focus:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-3" />
                {t.logout}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);
UserMenu.displayName = "UserMenu";

/** ================================
 *  Header
 *  ================================ */
const Header: React.FC = () => {
  const location = useLocation();
  const { isLoading } = useAuth();
  const { language } = useApp();
  const scrolled = useScrolled();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Bloquer le scroll quand le menu est ouvert
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const getNavigationLabel = useCallback(
    (labelKey: string): string => {
      const translations: Record<
        string,
        Record<"fr" | "en" | "es" | "pt" | "ru" | "de" | "hi" | "ch" | "ar", string>
      > = {
        "nav.home": {
          fr: "Accueil",
          en: "Home",
          es: "Inicio",
          pt: "Início",
          ru: "Главная",
          de: "Startseite",
          hi: "होम",
          ch: "家",
          ar: "الرئيسية"
        },
        "nav.viewProfiles": {
          fr: "Profils aidants",
          en: "Helper profiles",
          es: "Perfiles de ayuda",
          pt: "Perfis de ajudantes",
          ru: "Профили помощников",
          de: "Helferprofile",
          hi: "सहायक प्रोफाइल",
          ch: "助手资料",
          ar: "ملفات المساعدين"
        },
        "nav.testimonials": {
          fr: "Avis",
          en: "Reviews",
          es: "Reseñas",
          pt: "Avaliações",
          ru: "Отзывы",
          de: "Bewertungen",
          hi: "समीक्षाएं",
          ch: "评论",
          ar: "التقييمات"
        },
        "nav.howItWorks": {
          fr: "Comment ça marche",
          en: "How it Works",
          es: "Cómo funciona",
          pt: "Como funciona",
          ru: "Как это работает",
          de: "Wie es funktioniert",
          hi: "यह कैसे काम करता है",
          ch: "它是如何运作的",
          ar: "كيف يعمل"
        },
        "nav.pricing": {
          fr: "Tarifs",
          en: "Pricing",
          es: "Precios",
          pt: "Preços",
          ru: "Тарифы",
          de: "Preise",
          hi: "मूल्य निर्धारण",
          ch: "定价",
          ar: "التسعير"
        },
      };

      return translations[labelKey]?.[language] || labelKey;
    },
    [language]
  );

  const t = { sosCall: language === "fr" ? "SOS Appel" : "SOS Call" };

  const { isOnline, isUpdating, isProvider, toggle } = useAvailabilityToggle();

  return (
    <>
      {/* Header avec style différent mobile vs desktop */}
      <header
        className="fixed top-0 left-0 right-0 z-50 md:select-none"
        role="banner"
      >
        {/* Desktop - Style dynamique selon scroll */}
        <div className={`hidden lg:block ${
          scrolled
            ? "bg-gray-900/95 backdrop-blur-xl shadow-xl"
            : "bg-white border-b border-gray-200"
        }`}>
          <div className="w-full px-6">
            <div className="flex items-center justify-between h-20">
              <PWAInstallArea scrolled={scrolled} />

              <div className="flex-1 flex items-center justify-center">
                <nav className="flex items-center space-x-2">
                  {LEFT_NAVIGATION_ITEMS.slice(0, 2).map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2.5 px-2 py-2 rounded-lg ${
                        scrolled ? "hover:bg-white/10" : "hover:bg-gray-100"
                      } ${isActive(item.path) ? (scrolled ? "bg-white/20" : "bg-gray-100") : ""}`}
                      aria-current={isActive(item.path) ? "page" : undefined}
                    >
                      {item.desktopIcon && (
                        <span
                          className={`text-[15px] ${scrolled ? "text-gray-200" : "text-gray-700"}`}
                          aria-hidden="true"
                        >
                          {item.desktopIcon}
                        </span>
                      )}
                      <span
                        className={`font-semibold ${scrolled ? "text-gray-200" : "text-gray-700"} text-[15px] tracking-wide`}
                      >
                        {getNavigationLabel(item.labelKey)}
                      </span>
                    </Link>
                  ))}

                  <div className="mx-6">
                    <Link
                      to="/sos-appel"
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-3 py-1 rounded-2xl font-bold flex items-center space-x-2 shadow-lg border-2 border-white/20"
                      aria-label={t.sosCall}
                    >
                      <Phone className="size-3 text-white" />
                      <span className="tracking-wide">{t.sosCall.toUpperCase()}</span>
                    </Link>
                  </div>

                  {RIGHT_NAVIGATION_ITEMS.concat(LEFT_NAVIGATION_ITEMS.slice(2)).map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2.5 px-2 py-2 rounded-lg ${
                        scrolled ? "hover:bg-white/10" : "hover:bg-gray-100"
                      } ${isActive(item.path) ? (scrolled ? "bg-white/20" : "bg-gray-100") : ""}`}
                      aria-current={isActive(item.path) ? "page" : undefined}
                    >
                      {item.desktopIcon && (
                        <span
                          className={`text-[15px] ${scrolled ? "text-gray-200" : "text-gray-700"}`}
                          aria-hidden="true"
                        >
                          {item.desktopIcon}
                        </span>
                      )}
                      <span
                        className={`font-semibold ${scrolled ? "text-gray-200" : "text-gray-700"} text-[15px] tracking-wide`}
                      >
                        {getNavigationLabel(item.labelKey)}
                      </span>
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="flex items-center space-x-4">
                <HeaderAvailabilityToggle />
                <LanguageDropdown />
                {isLoading ? (
                  <div
                    className={`w-8 h-8 border-2 rounded-full animate-spin ${scrolled ? "border-white/30 border-t-white" : "border-gray-300 border-t-gray-600"}`}
                    role="status"
                    aria-label="Chargement"
                  />
                ) : (
                  <UserMenu scrolled={scrolled} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile - TOUJOURS NOIR avec ombre */}
        <div className="lg:hidden bg-gray-900 shadow-xl">
          <div className="px-4 py-3 flex items-center justify-between">
            <PWAIconButton />

            <div className="flex items-center gap-3">
              <Link
                to="/sos-appel"
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-7 py-2.5 rounded-2xl font-bold text-base flex items-center space-x-2 border border-white/20"
                aria-label={t.sosCall}
              >
                <Phone className="w-4 h-4 text-white" />
                <span>SOS</span>
              </Link>

              {isProvider && (
                <button
                  onClick={() => !isUpdating && toggle()}
                  className="relative w-7 h-7 rounded-full border-2 border-white/40 flex items-center justify-center"
                  aria-label={
                    isOnline
                      ? language === "fr" ? "Se mettre hors ligne" : "Go offline"
                      : language === "fr" ? "Se mettre en ligne" : "Go online"
                  }
                >
                  {isUpdating ? (
                    <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className={`block w-4 h-4 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
                  )}
                </button>
              )}
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-expanded={isMenuOpen}
              aria-label="Menu de navigation"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* MENU MOBILE - FOND NOIR OPAQUE */}
          {isMenuOpen && (
            <div
              className="fixed inset-x-0 top-[76px] bottom-0 overflow-hidden bg-gray-900"
              role="navigation"
              aria-label="Navigation mobile"
            >
              <div className="h-full overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
                <nav className="space-y-2">
                  {MOBILE_NAVIGATION_ITEMS.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-3 p-3 rounded-xl text-gray-300 hover:bg-white/10 ${
                        location.pathname === item.path ? "bg-white/10" : ""
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                      aria-current={location.pathname === item.path ? "page" : undefined}
                    >
                      {item.mobileIcon && <span className="text-xl">{item.mobileIcon}</span>}
                      <span className="font-semibold text-base">
                        {getNavigationLabel(item.labelKey)}
                      </span>
                    </Link>
                  ))}
                </nav>

                <div className="border-t border-white/10" />

                <div>
                  <LanguageDropdown isMobile />
                </div>

                <div className="border-t border-white/10" />

                <div>
                  <UserMenu isMobile scrolled={true} />
                </div>

                <div className="h-8" />
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="h-20" aria-hidden="true" />

      {typeof window !== "undefined" && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "SOS Expat d'Ulixai",
              description:
                language === "fr"
                  ? "Service d'assistance pour expatriés et voyageurs"
                  : "Assistance service for expats and travelers",
              url: window.location.origin,
              logo: `${window.location.origin}/icons/icon-512x512-maskable.png`,
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+33-XXX-XXX-XXX",
                contactType: "customer service",
                availableLanguage: ["French", "English"],
              },
              sameAs: [
                "https://facebook.com/sos-expat",
                "https://twitter.com/sos-expat",
                "https://linkedin.com/company/sos-expat",
              ],
            }),
          }}
        />
      )}

      {typeof window !== "undefined" &&
        (() => {
          const updateMetaTag = (property: string, content: string) => {
            let meta = document.querySelector(
              `meta[property="${property}"]`
            ) as HTMLMetaElement;
            if (!meta) {
              meta = document.createElement("meta");
              meta.setAttribute("property", property);
              document.head.appendChild(meta);
            }
            meta.content = content;
          };
          const updateTwitterMeta = (name: string, content: string) => {
            let meta = document.querySelector(
              `meta[name="${name}"]`
            ) as HTMLMetaElement;
            if (!meta) {
              meta = document.createElement("meta");
              meta.setAttribute("name", name);
              document.head.appendChild(meta);
            }
            meta.content = content;
          };
          const currentPage = location.pathname;
          const baseTitle = "SOS Expat d'Ulixai";
          const baseDescription =
            language === "fr"
              ? "Service d'assistance immédiate pour expatriés et voyageurs. Connexion en moins de 5 minutes avec des experts vérifiés."
              : "Immediate assistance service for expats and travelers. Connect in less than 5 minutes with verified experts.";
          const currentNavItem = ALL_NAVIGATION_ITEMS.find(
            (i) => i.path === currentPage
          );
          const pageTitle = currentNavItem
            ? getNavigationLabel(currentNavItem.labelKey)
            : getNavigationLabel("nav.home");

          updateMetaTag("og:title", `${baseTitle} - ${pageTitle}`);
          updateMetaTag("og:description", baseDescription);
          updateMetaTag("og:url", window.location.href);
          updateMetaTag("og:type", "website");
          updateMetaTag("og:locale", language === "fr" ? "fr_FR" : "en_US");

          updateTwitterMeta("twitter:card", "summary_large_image");
          updateTwitterMeta("twitter:title", `${baseTitle} - ${pageTitle}`);
          updateTwitterMeta("twitter:description", baseDescription);

          return null;
        })()}
    </>
  );
};

Header.displayName = "Header";
export default memo(Header);