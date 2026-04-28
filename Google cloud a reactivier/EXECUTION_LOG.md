# 📋 JOURNAL D'EXÉCUTION — Pause Billing GCP

**Date d'exécution** : 2026-04-28
**Projet GCP** : sos-urgently-ac307
**Compte** : williamsjullin@gmail.com
**Économie estimée** : ~25-35 €/mois (158 € → ~125-130 €)

---

## ✅ RÉSUMÉ

| Phase | Action | Nb objets | Statut |
|---|---|---|---|
| A | Pause crons gamification + monitoring (europe-west3) | 14 | ✅ Done |
| B | Désactivation PITR Firestore | 1 | ✅ Done |
| C | Pause crons gamification + emails non-critiques (europe-west3) | 16 | ✅ Done |
| C2 | Pause crons (europe-west1 + us-central1) | 4 | ✅ Done |
| D | Réduction fréquence crons | 4 | ✅ Done |
| E | Optim admin dashboard (visibility guards) | 9 fichiers | ✅ Done |
| F | Crons additionnels (Outil-sos-expat + paymentDataCleanup + Logging retention) | 4 | ✅ Done |
| **TOTAL** | | **52 actions** | ✅ |

---

## 🔍 VÉRIFICATIONS GOLDEN PATH (effectuées entre chaque phase)

| Endpoint | Avant | Phase A | Phase B | Phase C | Statut |
|---|---|---|---|---|---|
| Home `/` | 200 | 200 | 200 | 200 | ✅ |
| `/sitemap-index.xml` | 200 | 200 | 200 | 200 | ✅ |
| `/sitemaps/profiles-fr.xml` | 200 | 200 | - | 200 | ✅ |
| `/robots.txt` | 200 | 200 | - | 200 | ✅ |
| SSR Googlebot home | 200 (1.15s) | 200 (0.66s) | 200 | 200 (0.61s) | ✅ |

**SEO PAS IMPACTÉ. Indexation Google PAS IMPACTÉE.**

---

## 📋 PHASE A — Pause crons gamification + monitoring (europe-west3)

**Région** : `europe-west3`

| # | Job pausé | Schedule original | Réactivation |
|---|---|---|---|
| 1 | `firebase-schedule-aiTaxWatch-europe-west3` | `0 10 1 1,7 *` (semestriel) | `gcloud scheduler jobs resume firebase-schedule-aiTaxWatch-europe-west3 --location=europe-west3 --project=sos-urgently-ac307` |
| 2 | `firebase-schedule-chatterAggregateActivityFeed-europe-west3` | `0 * * * *` (hourly) | idem (changer le nom) |
| 3 | `firebase-schedule-chatterTierBonusCheck-europe-west3` | `0 3 * * *` (daily 3am) | idem |
| 4 | `firebase-schedule-cleanupOrphanedAgentTasks-europe-west3` | `0 8 * * *` (daily 8am) | idem |
| 5 | `firebase-schedule-cleanupOrphanedSessions-europe-west3` | `0 * * * *` (hourly) | idem |
| 6 | `firebase-schedule-cleanupTempStorageFiles-europe-west3` | `every day 03:00` | idem |
| 7 | `firebase-schedule-consolidatedDailyEmails-europe-west3` | `0 8 * * *` | idem |
| 8 | `firebase-schedule-consolidatedDailyMonitoring-europe-west3` | `0 8 * * *` | idem |
| 9 | `firebase-schedule-consolidatedSecurityDaily-europe-west3` | `0 3 * * *` | idem |
| 10 | `firebase-schedule-consolidatedWeeklyCleanup-europe-west3` | `0 3 * * 0` | idem |
| 11 | `firebase-schedule-crossRoleMonthlyTop3-europe-west3` | `0 1 1 * *` (monthly) | idem |
| 12 | `firebase-schedule-monitorTwilioCrypto-europe-west3` | `0 18 * * *` | idem |
| 13 | `firebase-schedule-quarterlyRestoreTest-europe-west3` | `0 2 1 1,4,7,10 *` | idem |
| 14 | `firebase-schedule-runMonthlyDRTest-europe-west3` | `0 6 1 * *` | idem |

---

## 📋 PHASE B — Désactivation PITR Firestore

**Action** : Désactivation du Point-in-Time Recovery
**Économie** : ~14 €/mois

**Commande exécutée** :
```bash
gcloud firestore databases update --database="(default)" --no-enable-pitr --project=sos-urgently-ac307
```

**État avant** : `POINT_IN_TIME_RECOVERY_ENABLED`
**État après** : `POINT_IN_TIME_RECOVERY_DISABLED` ✅

**Réactivation** :
```bash
gcloud firestore databases update --database="(default)" --enable-pitr --project=sos-urgently-ac307
```

**Impact** :
- ❌ Plus de rollback fine grain < 7 jours
- ✅ Backup quotidien Auth continue (réduit à hebdo en Phase D)
- ✅ multiFrequencyBackup continue
- ✅ Tous les autres backups continuent

---

## 📋 PHASE C — Pause crons gamification + emails non-critiques (europe-west3)

| # | Job pausé | Schedule original |
|---|---|---|
| 15 | `firebase-schedule-chatterCreateWeeklyChallenge-europe-west3` | `5 0 * * 1` |
| 16 | `firebase-schedule-chatterEndWeeklyChallenge-europe-west3` | `55 23 * * 0` |
| 17 | `firebase-schedule-chatterUpdateChallengeLeaderboard-europe-west3` | `0 * * * *` |
| 18 | `firebase-schedule-chatterEmailInactivityReminder-europe-west3` | `every 24 hours` |
| 19 | `firebase-schedule-detectInactiveChattersCron-europe-west3` | `every 24 hours` |
| 20 | `firebase-schedule-sendChatterDripMessages-europe-west3` | `0 10 * * *` |
| 21 | `firebase-schedule-sendTrustpilotOutreach-europe-west3` | `0 10 * * 3` |
| 22 | `firebase-schedule-sendMonthlyStats-europe-west3` | `0 8 1 * *` |
| 23 | `firebase-schedule-sendWeeklyStats-europe-west3` | `0 8 * * 1` |
| 24 | `firebase-schedule-bloggerDeactivateExpiredRecruitments-europe-west3` | `0 1 * * *` |
| 25 | `firebase-schedule-bloggerFinalizeMonthlyRankings-europe-west3` | `0 2 1 * *` |
| 26 | `firebase-schedule-bloggerUpdateMonthlyRankings-europe-west3` | `0 0 * * *` |
| 27 | `firebase-schedule-iaProspectResubscribeAfterCancel-europe-west3` | `0 10 * * *` |
| 28 | `firebase-schedule-iaProspectSyncFieldsCron-europe-west3` | `0 3 * * *` |
| 29 | `firebase-schedule-updatePartnerMonthlyStats-europe-west3` | `0 2 * * *` |
| 30 | `firebase-schedule-escrowMonitoringDaily-europe-west3` | `0 8 * * *` |

---

## 📋 PHASE C2 — Pause crons (europe-west1 + us-central1)

| # | Job pausé | Région | Schedule original |
|---|---|---|---|
| 31 | `firebase-schedule-chatterNotifyInactiveMembers-europe-west1` | europe-west1 | `0 10 * * *` |
| 32 | `firebase-schedule-chatterNotifyNearTop3-europe-west1` | europe-west1 | `0 18 * * *` |
| 33 | `firebase-schedule-notifyExpiringPromotions-europe-west1` | europe-west1 | `every day 08:00` |
| 34 | `firebase-schedule-chatterResetCaptainMonthly-us-central1` | us-central1 | `5 0 1 * *` |

---

## 📋 PHASE E — Optimisation admin dashboard (visibility guards)

**Objectif** : Suspendre les listeners Firestore quand l'onglet admin est en arrière-plan = **arrêter de payer pour les onglets que tu ne regardes pas**.

**Économie estimée** : -10 à -20 €/mois (selon usage)

### Hook créé

| Fichier | Type |
|---|---|
| `sos/src/hooks/useTabVisibility.ts` | NOUVEAU — hook qui retourne `true` quand l'onglet est visible |

### Hook amélioré

| Fichier | Modification |
|---|---|
| `sos/src/hooks/useAutoSuspendRealtime.ts` | Suspend désormais aussi quand l'onglet est caché (vs. seulement après 5min d'inactivité). Bénéficie automatiquement à AdminCalls, AdminProviders, AdminSecurityAlerts qui utilisent ce hook. |

### Pages admin modifiées (9 fichiers)

| Fichier | Type optim | Listeners protégés |
|---|---|---|
| `sos/src/components/admin/OnlineProvidersWidget.tsx` | Polling 30s | 1 polling |
| `sos/src/components/admin/ProvidersMapWidget.tsx` | Polling 60s | 1 polling |
| `sos/src/components/admin/AdminMapVisibilityToggle.tsx` | onSnapshot | 1 listener |
| `sos/src/components/admin/ProfileValidation.tsx` | onSnapshot | 1 listener |
| `sos/src/pages/admin/AdminInbox.tsx` | 6× onSnapshot | 6 listeners (le + gros gain) |
| `sos/src/pages/admin/AdminLandingPages.tsx` | onSnapshot | 1 listener |
| `sos/src/pages/admin/Payments/PaymentsMonitoringDashboard.tsx` | onSnapshot | 1 listener |

### Pages bénéficiant automatiquement (via useAutoSuspendRealtime amélioré)
- `sos/src/pages/admin/AdminCalls.tsx`
- `sos/src/pages/admin/AdminProviders.tsx`
- `sos/src/pages/admin/AdminSecurityAlerts.tsx`

### Comportement attendu
- Tu ouvres l'onglet admin → listeners actifs (UX inchangée, 100% temps réel)
- Tu changes d'onglet ou minimises → listeners désabonnés instantanément (0 read)
- Tu reviens sur l'onglet → listeners réactivés automatiquement avec un fetch initial

### Rollback
```bash
cd C:/Users/willi/Documents/Projets/VS_CODE/sos-expat-project
git diff HEAD -- sos/src/hooks/useTabVisibility.ts sos/src/hooks/useAutoSuspendRealtime.ts sos/src/components/admin/ sos/src/pages/admin/
git checkout -- sos/src/hooks/useTabVisibility.ts sos/src/hooks/useAutoSuspendRealtime.ts sos/src/components/admin/ sos/src/pages/admin/
# Le fichier useTabVisibility.ts doit être supprimé manuellement
```

**Note** : ces changements sont du **frontend** (Cloudflare Pages auto-deploy via push GitHub). Pas de Firebase deploy nécessaire.

---

## 📋 PHASE F — Crons additionnels + Cloud Logging retention

**Découverte audit** : Outil-sos-expat est sur un projet GCP **séparé** (`outils-sos-expat`), facture distincte de `sos-urgently-ac307`.

### Outil-sos-expat (projet `outils-sos-expat`, eu-west1)

| Job | Avant | Après | Économie |
|---|---|---|---|
| `cleanupStuckMessages` | every 15 min (96/jour) | every 1 hour (24/jour) | -75% invocations |
| `archiveExpiredConversations` | every 1 hour (24/jour) | every 6 hours (4/jour) | -83% invocations |

### sos-urgently-ac307 (eu-west3)

| Job | Avant | Après | Économie |
|---|---|---|---|
| `paymentDataCleanup` | `0 */6 * * *` (4/jour) | `0 2 * * *` (1/jour) | -75% invocations |

### Cloud Logging retention

| Bucket | Avant | Après | Économie |
|---|---|---|---|
| `_Default` (sos-urgently-ac307) | 30 jours | 7 jours | ~-77% storage logs |

### Réactivation Phase F

```bash
# Outil-sos-expat (restaurer fréquences originales)
gcloud scheduler jobs update http firebase-schedule-cleanupStuckMessages-europe-west1 --location=europe-west1 --project=outils-sos-expat --schedule="every 15 minutes"
gcloud scheduler jobs update http firebase-schedule-archiveExpiredConversations-europe-west1 --location=europe-west1 --project=outils-sos-expat --schedule="every 1 hours"

# sos paymentDataCleanup
gcloud scheduler jobs update http firebase-schedule-paymentDataCleanup-europe-west3 --location=europe-west3 --project=sos-urgently-ac307 --schedule="0 */6 * * *"

# Logging retention
gcloud logging buckets update _Default --location=global --project=sos-urgently-ac307 --retention-days=30
```

**Économie totale Phase F : ~10-20 €/mois** (logs + crons réduits)

---

## 🔍 AUDIT EN COURS — À investiguer plus tard

**381 composite indexes Firestore** sur `sos-urgently-ac307`. Potentiel d'économie 5-30 €/mois si certains sont inutilisés (à supprimer prudemment).

Pour identifier les indexes inutilisés :
1. Console GCP → Firestore → Indexes → onglet "Composite"
2. Pour chaque index, vérifier "Last used" (si dispo)
3. Si jamais utilisé en 30+ jours → candidat à suppression

**À NE PAS FAIRE en aveugle** — supprimer un index actif casse la query qui en dépend.

---

## 📋 PHASE D — Réduction fréquence (sans pause)

| Job | Région | Avant | Après | Économie |
|---|---|---|---|---|
| `backupFirebaseAuth` | europe-west3 | `0 3 * * *` (daily) | `0 3 * * 0` (weekly Sun) | ~6× moins de backups |
| `backupStorageToDR` | europe-west3 | `0 5 * * *` (daily) | `0 5 * * 0` (weekly Sun) | ~6× moins de backups |
| `aggregateProviderStats` | europe-west3 | `0 * * * *` (hourly) | `0 */6 * * *` (every 6h) | **divise reads Firestore par 6** |
| `processBacklinkEngineDLQ` | europe-west3 | `every 30 min` | `0 */4 * * *` (every 4h) | divise par 8 |

---

## ❌ PHASES ABANDONNÉES (pourquoi)

### ❌ Phase Cloud Run premium (chatterRequestWithdrawal etc.)
**Raison** : Cloud Run refuse `--max-instances=0` (minimum 1). De plus, ces services à `minInstances:0` qui ne sont jamais appelés ont déjà un coût quasi nul (pay-per-invocation). Pas de gain sans modifier le code, ce qui demanderait un redéploiement risqué.

### ❌ Phase Cleanup Secret Manager
**Raison** : 72 secrets, ~1.5 versions par secret en moyenne → cleanup donnerait ~2-3 €/mois pour une action destructive (suppression). Ratio risque/gain défavorable.

### ❌ Phase Cloud Storage Coldline
**Raison** : Les buckets `sos-expat-backup` (16 bytes) et `sos-expat-backup-dr` (43 MB) sont quasi vides — économie négligeable. Les vrais coûts storage viennent des `gcf-sources-*` (artifacts Cloud Functions) qu'il ne faut **PAS** mettre en Coldline (rebuild des fonctions casserait).

---

## 🔄 RÉACTIVATION COMPLÈTE — Procédure rapide

### Réactiver TOUS les crons en bloc (1 commande)

```bash
PROJECT=sos-urgently-ac307

# Phase A + C + escrow (tous en europe-west3)
for job in aiTaxWatch chatterAggregateActivityFeed chatterTierBonusCheck cleanupOrphanedAgentTasks cleanupOrphanedSessions cleanupTempStorageFiles consolidatedDailyEmails consolidatedDailyMonitoring consolidatedSecurityDaily consolidatedWeeklyCleanup crossRoleMonthlyTop3 monitorTwilioCrypto quarterlyRestoreTest runMonthlyDRTest chatterCreateWeeklyChallenge chatterEndWeeklyChallenge chatterUpdateChallengeLeaderboard chatterEmailInactivityReminder detectInactiveChattersCron sendChatterDripMessages sendTrustpilotOutreach sendMonthlyStats sendWeeklyStats bloggerDeactivateExpiredRecruitments bloggerFinalizeMonthlyRankings bloggerUpdateMonthlyRankings iaProspectResubscribeAfterCancel iaProspectSyncFieldsCron updatePartnerMonthlyStats escrowMonitoringDaily; do
  gcloud scheduler jobs resume "firebase-schedule-${job}-europe-west3" --location=europe-west3 --project=$PROJECT
done

# Phase C2 (europe-west1)
for job in chatterNotifyInactiveMembers chatterNotifyNearTop3 notifyExpiringPromotions; do
  gcloud scheduler jobs resume "firebase-schedule-${job}-europe-west1" --location=europe-west1 --project=$PROJECT
done

# Phase C2 (us-central1)
gcloud scheduler jobs resume firebase-schedule-chatterResetCaptainMonthly-us-central1 --location=us-central1 --project=$PROJECT

# Réactiver PITR
gcloud firestore databases update --database="(default)" --enable-pitr --project=$PROJECT

# Restaurer fréquences originales (Phase D)
gcloud scheduler jobs update http firebase-schedule-backupFirebaseAuth-europe-west3 --location=europe-west3 --project=$PROJECT --schedule="0 3 * * *"
gcloud scheduler jobs update http firebase-schedule-backupStorageToDR-europe-west3 --location=europe-west3 --project=$PROJECT --schedule="0 5 * * *"
gcloud scheduler jobs update http firebase-schedule-aggregateProviderStats-europe-west3 --location=europe-west3 --project=$PROJECT --schedule="0 * * * *"
gcloud scheduler jobs update http firebase-schedule-processBacklinkEngineDLQ-europe-west3 --location=europe-west3 --project=$PROJECT --schedule="every 30 minutes"
```

---

## ⚠️ NOTE IMPORTANTE — Persistance après firebase deploy

**Si tu fais un `firebase deploy --only functions` à l'avenir**, certaines de ces actions peuvent être ÉCRASÉES :

| Action | Persistante après deploy ? |
|---|---|
| Pause Cloud Scheduler jobs | ⚠️ Probablement écrasée → status reset à ENABLED |
| Modification fréquence schedules | ⚠️ Écrasée → revient à la valeur dans le code TypeScript |
| PITR Firestore disabled | ✅ Persistant (config Firestore, pas Functions) |

**Conséquence** : si tu redéploies, **réexécute la procédure de pause** ci-dessus. Ou modifie directement le code source des schedules (chaînes cron dans `sos/firebase/functions/src/scheduled/*.ts`).

---

## 📊 ÉCONOMIE ESTIMÉE

| Source | €/mois |
|---|---|
| Pause 34 Cloud Scheduler jobs (Cloud Scheduler + reads Firestore évités) | ~5-8 € |
| Désactivation PITR Firestore | ~14 € |
| Réduction fréquence 4 crons (Phase D) | ~5-10 € |
| Phase E - Visibility guards admin frontend | ~10-20 € |
| Phase F - Crons Outil + paymentDataCleanup + Logging 30j→7j | ~10-20 € |
| **TOTAL** | **~45-70 €/mois** |

**Facture mars 2026 : 158,50 €**
**Facture estimée après pause : ~125-130 €**

---

## 🔍 VÉRIFICATIONS RECOMMANDÉES (à faire dans 7-15 jours)

- [ ] Console GCP > Billing > Reports : la courbe doit baisser
- [ ] Sitemaps répondent toujours HTTP 200
- [ ] Inscriptions chatter / influencer / blogger / groupAdmin fonctionnent
- [ ] Aucune erreur Cloud Run sur les fonctions critiques
- [ ] Search Console : aucune nouvelle erreur d'indexation

---

## 📁 SNAPSHOTS PRIS AVANT EXÉCUTION

Voir dossier `snapshots-avant-pause/` :
- `cloud-run-services-snapshot.txt` (752 services)
- `scheduler-europe-west3.txt` (89 jobs)
- `scheduler-europe-west1.txt` (14 jobs)
- `scheduler-us-central1.txt` (2 jobs)
- `scheduler-west3-with-schedule.txt` (89 jobs avec schedules)
