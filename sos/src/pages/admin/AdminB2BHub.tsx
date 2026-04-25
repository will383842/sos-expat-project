import React from 'react';
import {
  Building2,
  ExternalLink,
  Users,
  FileText,
  DollarSign,
  Settings,
  ArrowRight,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';

const FILAMENT_ADMIN_URL = 'https://admin.sos-expat.com';

export default function AdminB2BHub() {
  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Building2 className="w-7 h-7 mr-2 text-indigo-600" />
            Programme partenaires B2B
          </h1>
          <p className="text-gray-600 mt-1">
            Gestion des comptes partenaires, agreements, abonnements SOS-Call mensuels et facturation.
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <Settings className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">
                Console dédiée Partner Engine
              </h3>
              <p className="text-sm text-gray-700 mt-1 mb-4">
                L'administration B2B (partenaires, contrats, abonnements, factures, clients) se gère
                dans la console Filament dédiée du Partner Engine. Elle expose tous les paramètres :
                modèle économique (commission / SOS-Call / hybride), tarifs par membre, devise EUR/USD,
                quotas, durées, factures mensuelles.
              </p>
              <a
                href={`${FILAMENT_ADMIN_URL}/admin`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
              >
                Ouvrir la console Partner Engine
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ce qui est configurable côté Partner Engine
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon={<Building2 className="w-5 h-5 text-indigo-600" />}
              title="Comptes & agreements"
              description="Création de partenaires, contrats, hiérarchie cabinet/région/dpt, statuts active/paused/expired."
              href={`${FILAMENT_ADMIN_URL}/admin/partners`}
            />
            <FeatureCard
              icon={<DollarSign className="w-5 h-5 text-green-600" />}
              title="Modèle économique & tarifs"
              description="Commission par appel (USD), forfait mensuel par membre (EUR/USD), forfait fixe, modèle hybride."
              href={`${FILAMENT_ADMIN_URL}/admin/partners`}
            />
            <FeatureCard
              icon={<Users className="w-5 h-5 text-blue-600" />}
              title="Membres / clients (subscribers)"
              description="Ajout, import CSV, génération automatique des codes SOS-Call, suspension, hiérarchie."
              href={`${FILAMENT_ADMIN_URL}/admin/subscribers`}
            />
            <FeatureCard
              icon={<FileText className="w-5 h-5 text-purple-600" />}
              title="Factures mensuelles"
              description="Génération automatique le 1er du mois, paiement Stripe ou SEPA, PDF, marquage manuel."
              href={`${FILAMENT_ADMIN_URL}/admin/partner-invoices`}
            />
          </div>
          <p className="text-xs text-gray-500 mt-6">
            Les liens ci-dessus ouvrent la console Filament dans un nouvel onglet. Authentification
            indépendante du SPA (login admin Partner Engine requis).
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-indigo-300 rounded-lg p-4 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="bg-white p-2 rounded-md shadow-sm flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-gray-900 group-hover:text-indigo-700">{title}</h4>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </div>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </a>
  );
}
