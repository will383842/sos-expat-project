// src/config/adminMenu.ts - VERSION MISE À JOUR AVEC NOUVELLE ORGANISATION
import {
  BarChart3,
  DollarSign,
  Users,
  Phone,
  Handshake,
  Building,
  Settings,
  TrendingUp,
  Shield,
  Globe,
  FileText,
  Database,
  Star,
  CreditCard,
  Calculator,
  PieChart,
  Receipt,
  Banknote,
  ArrowLeftRight,
  AlertCircle,
  RotateCcw,
  FileSpreadsheet,
  UserCheck,
  UserPlus,
  MessageSquare,
  Bell,
  Megaphone,
  Target,
  Truck,
  Ban,
  TestTube,
  PhoneCall,
  PlayCircle,
  Percent,
  Gift,
  Award,
  Briefcase,
  UsersIcon,
  FileSignature,
  CreditCard as CreditCardIcon,
  Archive,
  Cog,
  BarChart,
  Download,
  Zap,
  HelpingHand,
  HelpCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AdminMenuItem = {
  id: string;
  label: string;
  path?: string;
  children?: AdminMenuItem[];
  icon?: LucideIcon;
  badge?: string;
  description?: string;
};

export const adminMenuTree: AdminMenuItem[] = [
  // ===== 📊 TABLEAU DE BORD (Priorité 1 - Usage quotidien) =====
  {
    id: "dashboard",
    label: "Tableau de bord",
    path: "/admin/dashboard",
    icon: BarChart3,
    description: "Vue d'ensemble et KPIs en temps réel",
  },

  // ===== 👥 UTILISATEURS & PRESTATAIRES (Priorité 2 - Usage quotidien) =====
  {
    id: "users",
    label: "Users et prestataires",
    icon: Users,
    description: "Gestion complète des utilisateurs",
    children: [
      // Sous-section : TOUS LES UTILISATEURS
      {
        id: "all-users",
        label: "Tous les utilisateurs",
        icon: UsersIcon,
        description: "Vue globale de tous les utilisateurs",
        children: [
          {
            id: "clients",
            label: "Clients",
            path: "/admin/users/clients",
            icon: Users,
            description: "Utilisateurs clients",
          },
          {
            id: "prestataires-section",
            label: "Prestataires",
            icon: UserCheck,
            description: "Tous les prestataires",
            children: [
              {
                id: "avocats",
                label: "Avocat",
                path: "/admin/users/providers/lawyers",
                icon: Shield,
                description: "Avocats partenaires",
              },
              {
                id: "expats",
                label: "Expats",
                path: "/admin/users/providers/expats",
                icon: Globe,
                description: "Expatriés conseillers",
              },
            ],
          },
        ],
      },
      // Sous-section : AAA PROFILES
      {
        id: "aaa-profiles",
        label: "AAA Profiles",
        path: "/admin/aaaprofiles",
        icon: TestTube,
        description: "Profils de démonstration et test",
      },
      // Sous-section : VALIDATION AVOCATS
      {
        id: "validation-prestataires", // ✅ Nouveau ID (optionnel mais recommandé)
        label: "Validation prestataires", // ✅ CHANGEMENT PRINCIPAL
        path: "/admin/approvals/lawyers",
        icon: UserCheck,
        badge: "3",
        description: "Validation et KYC des prestataires",
      },
      // Sous-section : KYC PRESTATAIRES
      {
        id: "kyc-prestataires",
        label: "KYC prestataires",
        path: "/admin/kyc/providers",
        icon: Shield,
        badge: "2",
        description: "Vérification d'identité des prestataires",
      },
      // Sous-section : AVIS ET NOTATION
      {
        id: "avis-notation",
        label: "Avis et notation",
        path: "/admin/reviews",
        icon: Star,
        description: "Modération des avis clients",
      },
    ],
  },

  // ===== 📞 APPELS (Priorité 3 - Monitoring critique) =====
  {
    id: "calls",
    label: "Appels & Sessions",
    icon: Phone,
    description: "Monitoring et gestion des appels",
    children: [
      {
        id: "calls-monitor",
        label: "Monitoring temps réel",
        path: "/admin/calls",
        icon: PhoneCall,
        badge: "LIVE",
        description: "Surveillance des appels en cours",
      },
      {
        id: "calls-sessions",
        label: "Historique des sessions",
        path: "/admin/calls/sessions",
        icon: PlayCircle,
        description: "Archive des sessions d'appels",
      },
    ],
  },

  // ===== 💰 FINANCES (Priorité 4 - Business critique) =====
  {
    id: "finance",
    label: "Finances & Comptabilité",
    icon: DollarSign,
    description: "Gestion financière complète",
    children: [
      // Sous-section : Transactions & Paiements
      {
        id: "finance-transactions",
        label: "Transactions",
        icon: CreditCard,
        description: "Gestion des paiements et transactions",
        children: [
          {
            id: "payments",
            label: "Paiements",
            path: "/admin/finance/payments",
            icon: CreditCard,
            description: "Suivi des paiements clients",
          },
          // NOTE: Pages placeholder - à activer quand implémentées
          // {
          //   id: "refunds",
          //   label: "Remboursements",
          //   path: "/admin/finance/refunds",
          //   icon: RotateCcw,
          //   description: "Traitement des remboursements",
          // },
          // {
          //   id: "disputes",
          //   label: "Litiges & Contestations",
          //   path: "/admin/finance/disputes",
          //   icon: AlertCircle,
          //   badge: "2",
          //   description: "Gestion des litiges Stripe/PayPal",
          // },
        ],
      },
      // NOTE: Section Comptabilité - pages placeholder, à activer quand implémentées
      // {
      //   id: "finance-accounting",
      //   label: "Comptabilité & Fiscalité",
      //   icon: Calculator,
      //   description: "Facturation et obligations fiscales",
      //   children: [
      //     {
      //       id: "invoices",
      //       label: "Facturation",
      //       path: "/admin/finance/invoices",
      //       icon: Receipt,
      //       description: "Génération et envoi des factures",
      //     },
      //     {
      //       id: "taxes",
      //       label: "TVA & Déclarations",
      //       path: "/admin/finance/taxes",
      //       icon: Calculator,
      //       description: "Gestion TVA et fiscalité",
      //     },
      //     {
      //       id: "reconciliation",
      //       label: "Rapprochement bancaire",
      //       path: "/admin/finance/reconciliation",
      //       icon: ArrowLeftRight,
      //       description: "Rapprochement des comptes",
      //     },
      //     {
      //       id: "ledger",
      //       label: "Grand livre",
      //       path: "/admin/finance/ledger",
      //       icon: Database,
      //       description: "Comptabilité générale",
      //     },
      //   ],
      // },
      // NOTE: Section Rémunérations - pages placeholder, à activer quand implémentées
      // {
      //   id: "finance-payouts",
      //   label: "Rémunérations",
      //   icon: Banknote,
      //   description: "Paiements aux prestataires et affiliés",
      //   children: [
      //     {
      //       id: "provider-payouts",
      //       label: "Payouts prestataires",
      //       path: "/admin/finance/payouts",
      //       icon: Banknote,
      //       description: "Virements aux avocats/expatriés",
      //     },
      //     {
      //       id: "affiliate-payouts",
      //       label: "Commissions affiliés",
      //       path: "/admin/affiliates/payouts",
      //       icon: Gift,
      //       description: "Paiements du programme d'affiliation",
      //     },
      //   ],
      // },
      // NOTE: Rapports financiers - page placeholder
      // {
      //   id: "finance-reports",
      //   label: "Rapports & Exports",
      //   path: "/admin/finance/exports",
      //   icon: FileSpreadsheet,
      //   description: "Rapports financiers et exports",
      // },
    ],
  },

  // ===== 💌 MARKETING & COMMUNICATIONS (Priorité 5) =====
  {
    id: "marketing",
    label: "Marketing & Communication",
    icon: Megaphone,
    description: "Campagnes et communication client",
    children: [
      // NOTE: Campagnes - page placeholder
      // {
      //   id: "campaigns",
      //   label: "Campagnes marketing",
      //   path: "/admin/comms/campaigns",
      //   icon: Megaphone,
      //   description: "Campagnes email et newsletters",
      // },
      {
        id: "automations",
        label: "Automations",
        path: "/admin/comms/automations",
        icon: Zap,
        description: "Workflows automatisés",
      },
      // NOTE: Segments - page placeholder
      // {
      //   id: "segments",
      //   label: "Segmentation",
      //   path: "/admin/comms/segments",
      //   icon: Target,
      //   description: "Segmentation des utilisateurs",
      // },
      {
        id: "templates",
        label: "Templates emails",
        path: "/admin/comms/templates",
        icon: FileText,
        description: "Modèles d'emails et SMS",
      },
      {
        id: "promo-codes",
        label: "Codes promo",
        path: "/admin/coupons",
        icon: Percent,
        description: "Créer, activer, suivre les coupons",
      },
      // NOTE: Messages temps réel - à vérifier si fonctionnel
      // {
      //   id: "messages-realtime",
      //   label: "Messages temps réel",
      //   path: "/admin/comms/messages",
      //   icon: MessageSquare,
      //   description: "Chat et messages instantanés",
      // },
      {
        id: "notifications",
        label: "Notifications",
        path: "/admin/comms/notifications",
        icon: Bell,
        description: "Push, SMS et notifications",
      },
      {
        id: "Contacts",
        label: "Contact Requests",
        path: "/admin/contact-messages",
        icon: MessageSquare,
        description: "Gestion des contacts",
      },
      // NOTE: Pages placeholder - à activer quand implémentées
      // {
      //   id: "deliverability",
      //   label: "Délivrabilité",
      //   path: "/admin/comms/deliverability",
      //   icon: Truck,
      //   description: "Qualité d'envoi des emails",
      // },
      // {
      //   id: "suppression",
      //   label: "Listes de suppression",
      //   path: "/admin/comms/suppression",
      //   icon: Ban,
      //   description: "Désinscriptions et blocages",
      // },
      // {
      //   id: "ab-tests",
      //   label: "Tests A/B",
      //   path: "/admin/comms/ab",
      //   icon: TestTube,
      //   description: "Optimisation des campagnes",
      // },
    ],
  },

  // ===== 🏢 BUSINESS & PARTENARIATS (Priorité 6) =====
  // NOTE: Section entièrement placeholder - à activer quand implémentée
  // {
  //   id: "business",
  //   label: "Business & Partenariats",
  //   icon: Building,
  //   description: "Comptes entreprise et programmes partenaires",
  //   children: [
  //     // B2B Enterprise - pages placeholder
  //     {
  //       id: "b2b",
  //       label: "Comptes Entreprise (B2B)",
  //       icon: Briefcase,
  //       description: "Gestion des clients entreprise",
  //       children: [
  //         {
  //           id: "b2b-accounts",
  //           label: "Comptes",
  //           path: "/admin/b2b/accounts",
  //           icon: Building,
  //         },
  //         {
  //           id: "b2b-billing",
  //           label: "Facturation B2B",
  //           path: "/admin/b2b/billing",
  //           icon: CreditCardIcon,
  //         },
  //         {
  //           id: "b2b-invoices",
  //           label: "Factures",
  //           path: "/admin/b2b/invoices",
  //           icon: Receipt,
  //         },
  //       ],
  //     },
  //     // Programme d'affiliation - pages placeholder
  //     {
  //       id: "affiliation",
  //       label: "Programme Affiliation",
  //       icon: Handshake,
  //       description: "Affiliés et ambassadeurs",
  //       children: [
  //         {
  //           id: "affiliates-list",
  //           label: "Affiliés",
  //           path: "/admin/affiliates",
  //           icon: UserPlus,
  //         },
  //         {
  //           id: "ambassadors",
  //           label: "Ambassadeurs",
  //           path: "/admin/ambassadors",
  //           icon: Award,
  //         },
  //       ],
  //     },
  //   ],
  // },

  // ===== 📊 ANALYTICS & RAPPORTS (Priorité 7) =====
  {
    id: "analytics",
    label: "Analytics & Rapports",
    icon: TrendingUp,
    description: "Business Intelligence et reporting",
    children: [
      {
        id: "country-stats",
        label: "Statistiques par pays",
        path: "/admin/reports/country-stats",
        icon: Globe,
        description: "Statistiques globales et par pays",
      },
      // NOTE: Pages placeholder - à activer quand implémentées
      // {
      //   id: "financial-reports",
      //   label: "Rapports financiers",
      //   path: "/admin/reports/financial",
      //   icon: PieChart,
      //   description: "P&L, revenus, marges",
      // },
      // {
      //   id: "user-analytics",
      //   label: "Comportement utilisateurs",
      //   path: "/admin/reports/users",
      //   icon: Users,
      //   description: "Funnel, rétention, engagement",
      // },
      // {
      //   id: "platform-performance",
      //   label: "Performance plateforme",
      //   path: "/admin/reports/performance",
      //   icon: BarChart3,
      //   description: "Uptime, vitesse, erreurs",
      // },
      {
        id: "error-logs",
        label: "Suivi des erreurs",
        path: "/admin/reports/error-logs",
        icon: AlertCircle,
        description: "Logs d'erreurs et suivi des incidents",
      },
      // NOTE: Exports - page placeholder
      // {
      //   id: "data-exports",
      //   label: "Exports de données",
      //   path: "/admin/reports/exports",
      //   icon: Download,
      //   description: "CSV, Excel, API exports",
      // },
    ],
  },

  // ===== ⚙️ ADMINISTRATION SYSTÈME (Priorité 8 - Usage occasionnel) =====
  {
    id: "admin-system",
    label: "Administration Système",
    icon: Settings,
    description: "Configuration et maintenance",
    children: [
      {
        id: "pricing-management",
        label: "Gestion des tarifs",
        path: "/admin/pricing",
        icon: DollarSign,
        description: "Prix et commissions SOS Expats",
      },
      {
        id: "countries-management",
        label: "Pays & Régions",
        path: "/admin/countries",
        icon: Globe,
        description: "Pays supportés par la plateforme",
      },
      {
        id: "legal-documents",
        label: "Documents légaux",
        path: "/admin/documents",
        icon: FileText,
        description: "CGU, confidentialité, mentions",
      },
      {
        id: "help-center",
        label: "Centre d'aide",
        path: "/admin/help/center",
        icon: HelpingHand,
        description: "Gestion des articles du centre d'aide",
      },
      {
        id: 'faqs-management',
        label: 'FAQs',
        path: '/admin/cms/faqs',
        icon: HelpCircle,
        description: 'Gestion des questions fréquentes'
      },
      {
        id: 'system-maintenance',
        label: 'Maintenance système',
        icon: Cog,
        description: "Outils d'administration technique",
        children: [
          {
            id: "system-settings",
            label: "Paramètres système",
            path: "/admin/settings",
            icon: Cog,
            description: "Configuration générale",
          },
          {
            id: "system-backups",
            label: "Sauvegardes",
            path: "/admin/backups",
            icon: Archive,
            description: "Backup et restauration",
          },
        ],
      },
    ],
  },
  // // ===== 🌐 DASHBOARD LINGUISTIQUE (Priorité 9) =====
  // {
  //   id: 'language-dashboard',
  //   label: 'tableau de bord linguistique',
  //   path: '/admin/language/dashboard',
  //   icon: Globe2,
  //   description: 'Vue d\'ensemble et KPIs en temps réel'
  // },
];

// ===== FONCTIONS UTILITAIRES AMÉLIORÉES =====

/**
 * Trouve un élément de menu par son ID (recherche récursive)
 */
export function findMenuItemById(
  id: string,
  items: AdminMenuItem[] = adminMenuTree
): AdminMenuItem | null {
  for (const item of items) {
    if (item.id === id) {
      return item;
    }
    if (item.children) {
      const found = findMenuItemById(id, item.children);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Récupère tous les paths du menu (utile pour la validation des routes)
 */
export function getAllMenuPaths(
  items: AdminMenuItem[] = adminMenuTree
): string[] {
  const paths: string[] = [];

  function traverse(menuItems: AdminMenuItem[]) {
    for (const item of menuItems) {
      if (item.path) {
        paths.push(item.path);
      }
      if (item.children) {
        traverse(item.children);
      }
    }
  }

  traverse(items);
  return paths;
}

/**
 * Construit le breadcrumb pour un path donné
 */
export function buildBreadcrumb(
  path: string,
  items: AdminMenuItem[] = adminMenuTree
): AdminMenuItem[] {
  const breadcrumb: AdminMenuItem[] = [];

  function findPath(
    menuItems: AdminMenuItem[],
    currentPath: AdminMenuItem[]
  ): boolean {
    for (const item of menuItems) {
      const newPath = [...currentPath, item];

      if (item.path === path) {
        breadcrumb.push(...newPath);
        return true;
      }

      if (item.children && findPath(item.children, newPath)) {
        return true;
      }
    }
    return false;
  }

  findPath(items, []);
  return breadcrumb;
}

/**
 * Récupère les badges dynamiques (à connecter avec votre state management)
 */
export function getMenuBadges(): Record<string, string> {
  // Cette fonction devrait être connectée à votre store Redux/Zustand
  // ou récupérer les données depuis une API
  return {
    "validation-avocats": "3", // 3 validations d'avocats en attente
    "kyc-prestataires": "2", // 2 KYC de prestataires en attente
    "calls-monitor": "LIVE", // Appels en cours
    disputes: "2", // 2 litiges à traiter
    campaigns: "NEW", // Nouvelle fonctionnalité
  };
}

/**
 * Vérifie les permissions d'accès (extensible pour différents rôles)
 */
export function hasMenuAccess(
  menuItem: AdminMenuItem,
  userRole: string = "admin"
): boolean {
  // Permissions granulaires par rôle
  const rolePermissions: Record<string, string[]> = {
    "super-admin": ["*"], // Accès total
    "finance-admin": ["dashboard", "finance", "analytics", "business"],
    "support-admin": ["dashboard", "users", "calls", "marketing"],
    "read-only": ["dashboard", "analytics"],
  };

  const permissions = rolePermissions[userRole] || [];

  // Si accès total
  if (permissions.includes("*")) return true;

  // Vérifier si l'ID du menu est autorisé
  return permissions.includes(menuItem.id);
}

/**
 * Applique les badges dynamiques au menu
 */
export function applyBadgesToMenu(
  items: AdminMenuItem[] = adminMenuTree
): AdminMenuItem[] {
  const badges = getMenuBadges();

  return items.map((item) => ({
    ...item,
    badge: badges[item.id] || item.badge,
    children: item.children ? applyBadgesToMenu(item.children) : undefined,
  }));
}

/**
 * Filtre le menu selon les permissions utilisateur
 */
export function filterMenuByPermissions(
  items: AdminMenuItem[] = adminMenuTree,
  userRole: string = "admin"
): AdminMenuItem[] {
  return items
    .filter((item) => hasMenuAccess(item, userRole))
    .map((item) => ({
      ...item,
      children: item.children
        ? filterMenuByPermissions(item.children, userRole)
        : undefined,
    }));
}

/**
 * Obtient le menu final avec badges et permissions
 */
export function getFinalMenu(userRole: string = "admin"): AdminMenuItem[] {
  const menuWithBadges = applyBadgesToMenu(adminMenuTree);
  return filterMenuByPermissions(menuWithBadges, userRole);
}

// Export par défaut
export default adminMenuTree;
