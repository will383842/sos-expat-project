"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
// firebase/functions/src/adminApi.ts
const https_1 = require("firebase-functions/v2/https");
const StripeManager_1 = require("./StripeManager");
const admin = __importStar(require("firebase-admin"));
const asDate = (d) => (d && typeof d.toDate === 'function')
    ? d.toDate()
    : d;
if (!admin.apps.length)
    admin.initializeApp();
const db = admin.firestore();
function pctChange(curr, prev) {
    if (!prev)
        return 100;
    return ((curr - prev) / prev) * 100;
}
exports.api = (0, https_1.onRequest)({
    region: 'europe-west1',
    memory: '256MiB',
    concurrency: 1,
    timeoutSeconds: 60,
    minInstances: 0,
    maxInstances: 3,
    cors: [
        'http://localhost:5173',
        'http://127.0.0.1:5000',
        'https://sos-urgently-ac307.web.app',
        'https://sos-expat.com' // Domaine custom prod
    ]
}, async (req, res) => {
    try {
        const path = req.path.replace(/\/+$/, ''); // trim trailing /
        console.log('🔍 API Request:', {
            method: req.method,
            path,
            originalUrl: req.originalUrl
        });
        // =============================
        // 📊 /admin/financial-stats
        // =============================
        if (path === '/admin/financial-stats') {
            console.log('📊 Route financial-stats appelée');
            try {
                const now = Date.now();
                const d30 = admin.firestore.Timestamp.fromDate(new Date(now - 30 * 864e5));
                const prevStart = admin.firestore.Timestamp.fromDate(new Date(now - 60 * 864e5));
                const prevEnd = admin.firestore.Timestamp.fromDate(new Date(now - 30 * 864e5));
                // Stats 30 derniers jours
                const curr = await StripeManager_1.stripeManager.getPaymentStatistics({
                    startDate: asDate(d30)
                });
                console.log('✅ Stats courantes récupérées:', curr);
                // Période précédente
                const prev = await StripeManager_1.stripeManager.getPaymentStatistics({
                    startDate: asDate(prevStart),
                    endDate: asDate(prevEnd)
                });
                console.log('✅ Stats précédentes récupérées:', prev);
                // "Transactions actives"
                const pendingSnap = await db
                    .collection('payments')
                    .where('createdAt', '>=', d30)
                    .where('status', 'in', [
                    'pending',
                    'authorized',
                    'requires_capture',
                    'processing',
                ])
                    .get();
                const monthlyRevenue = curr.totalAmount || 0;
                const totalCommissions = curr.totalCommission || 0;
                const activeTransactions = pendingSnap.size;
                const conversionRate = curr.count
                    ? ((curr.count - (curr.byStatus?.failed || 0)) / curr.count) * 100
                    : 0;
                const response = {
                    monthlyRevenue,
                    totalCommissions,
                    activeTransactions,
                    conversionRate,
                    changes: {
                        revenue: pctChange(monthlyRevenue, prev.totalAmount || 0),
                        commissions: pctChange(totalCommissions, prev.totalCommission || 0),
                        transactions: pctChange(activeTransactions, 0),
                        conversion: pctChange(conversionRate, 0)
                    },
                    debug: {
                        currentStats: curr,
                        previousStats: prev,
                        pendingCount: pendingSnap.size
                    }
                };
                console.log('📊 Réponse financial-stats:', response);
                res.json(response);
                return;
            }
            catch (statsError) {
                console.error('❌ Erreur stats:', statsError);
                res.status(500).json({
                    error: 'Erreur récupération statistiques',
                    details: statsError instanceof Error
                        ? statsError.message
                        : String(statsError)
                });
                return;
            }
        }
        // =============================
        // 🕐 /admin/last-modifications
        // =============================
        if (path === '/admin/last-modifications') {
            console.log('🕐 Route last-modifications appelée');
            try {
                const pricingDoc = await db
                    .doc('admin_config/pricing')
                    .get()
                    .catch(() => null);
                const lastPayment = await db
                    .collection('payments')
                    .orderBy('updatedAt', 'desc')
                    .limit(1)
                    .get()
                    .catch(() => null);
                const lastAnalytics = await db
                    .collection('call_sessions')
                    .orderBy('updatedAt', 'desc')
                    .limit(1)
                    .get()
                    .catch(() => null);
                const fmt = (ts) => ts ? ts.toDate().toISOString() : 'N/A';
                const response = {
                    pricing: fmt(pricingDoc?.updateTime ??
                        pricingDoc?.get('updatedAt')),
                    commissions: fmt(lastPayment?.docs[0]?.get('updatedAt') ||
                        lastPayment?.docs[0]?.get('createdAt')),
                    analytics: fmt(lastAnalytics?.docs[0]?.get('updatedAt') ||
                        lastAnalytics?.docs[0]?.get('createdAt'))
                };
                console.log('🕐 Réponse last-modifications:', response);
                res.json(response);
                return;
            }
            catch (modifError) {
                console.error('❌ Erreur modifications:', modifError);
                res.status(500).json({
                    error: 'Erreur récupération modifications',
                    details: modifError instanceof Error
                        ? modifError.message
                        : String(modifError)
                });
                return;
            }
        }
        // =============================
        // ⚙️ /admin/system-status
        // =============================
        if (path === '/admin/system-status') {
            console.log('⚙️ Route system-status appelée');
            try {
                const t0 = Date.now();
                await db.collection('users').limit(1).get();
                const latency = Date.now() - t0;
                const response = {
                    api: 'online',
                    database: latency < 250 ? 'optimal' : latency < 1000 ? 'slow' : 'error',
                    cache: 'inactive',
                    lastCheck: new Date().toISOString(),
                    latency: `${latency}ms`
                };
                console.log('⚙️ Réponse system-status:', response);
                res.json(response);
                return;
            }
            catch (statusError) {
                console.error('❌ Erreur status:', statusError);
                res.status(500).json({
                    error: 'Erreur vérification status',
                    details: statusError instanceof Error
                        ? statusError.message
                        : String(statusError)
                });
                return;
            }
        }
        // =============================
        // 🏠 / (racine)
        // =============================
        if (path === '' || path === '/') {
            console.log('🏠 Route racine appelée');
            res.json({
                message: 'API SOS Expat fonctionnelle',
                status: 'online',
                timestamp: new Date().toISOString(),
                availableRoutes: [
                    '/admin/financial-stats',
                    '/admin/last-modifications',
                    '/admin/system-status',
                ]
            });
            return;
        }
        // =============================
        // ❌ Route non trouvée
        // =============================
        console.log('❌ Route non trouvée:', path);
        res.status(404).json({
            error: 'Route non trouvée',
            path,
            availableRoutes: [
                '/admin/financial-stats',
                '/admin/last-modifications',
                '/admin/system-status',
            ]
        });
        return;
    }
    catch (e) {
        console.error('💥 Erreur globale API:', e);
        res.status(500).json({
            error: e instanceof Error ? e.message : 'Internal error',
            timestamp: new Date().toISOString()
        });
        return;
    }
});
//# sourceMappingURL=adminApi.js.map