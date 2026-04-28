# 📋 PLAN PAUSE BILLING GCP — SOS-Expat

**Date de création** : 2026-04-28
**Stratégie retenue** : **Option A** — Inscriptions ouvertes, services premium pausés
**Économie estimée** : ~55-65 €/mois (158 € → ~95 €/mois)
**Réversibilité** : 100% — chaque action listée se réactive en 1 clic console GCP

---

## ⚠️ LECTURE OBLIGATOIRE AVANT DE COMMENCER

1. **Toutes les actions sont RÉVERSIBLES**. Aucune suppression de code, aucune suppression de données.
2. **Les données Firestore sont INTACTES** : utilisateurs, commissions, codes affiliés, statistiques → tout est préservé.
3. **Pour réactiver** : tu fais le chemin inverse en cliquant "Enable" au lieu de "Disable" (cf. section RÉACTIVATION en bas).
4. **Avant chaque action**, vérifier la colonne "Vérification post-action" pour confirmer que la plateforme tourne toujours.

---

## 🎯 CE QUI RESTE 100% FONCTIONNEL APRÈS LA PAUSE

✅ Inscription **clients / lawyers / expats** (cœur business)
✅ **Appels Twilio** (réservation + lancement + conférence + DTMF)
✅ **Paiements Stripe** (webhooks + checkout)
✅ **PayPal** (capture restera, juste les workers payouts désactivés)
✅ **Provider catalog feed** (SEO Google Shopping)
✅ **Sitemaps** (`sitemapProfiles`, `sitemapBlog`, `sitemapIndex`, etc.)
✅ **Dynamic SSR** (`renderForBotsV2` pour Googlebot)
✅ **OpenGraph** des partages
✅ **Reviews** (visibles côté SEO)
✅ **Inscription chatter / influencer / blogger / groupAdmin** (`registerChatter`, `registerInfluencer`, `registerBlogger`, `registerGroupAdmin`)
✅ **Login + Dashboard de base** pour tous les rôles
✅ **Profile updates** pour tous les rôles
✅ **Annuaires publics** (`getChatterDirectory`, `getInfluencerDirectory`, `getBloggerDirectory`)
✅ **Triggers Firestore vitaux** (onUserCreated, onProviderCreated, onCallCompleted, onPaymentReceived)
✅ **Provider availability** (busy/available + checkProviderInactivity)
✅ **Backup Auth quotidien** (réduction proposée à hebdo)
✅ **Backup Storage DR** (gardé en hebdo)
✅ **GDPR audit trail** (obligation légale)
✅ **AAA busy simulation** (8 min, fait paraître profils AAA actifs pour SEO)

---

## 🔴 CE QUI EST PAUSÉ (réactivable en 1 clic)

### 1️⃣ VERTICALE CHATTER — Services premium

**Inscription / Login / Dashboard de base = ACTIFS.** On désactive les bonus et systèmes de fidélisation qui ne servent à rien sans revenu.

| Service Cloud Run | Région | Rôle | Risque pause |
|---|---|---|---|
| `chatterrequestwithdrawal` | us-central1 | Demandes de retrait chatter | None (0 retrait possible sans revenu) |
| `getchatterleaderboard` | us-central1 | Classement gamification | None (gadget) |
| `updatetelegramonboarding` | us-central1 | Bonus Telegram +$50 | None (déjà off-flow) |
| `generatetelegramlink` | us-central1 | Deep link Telegram chatter | None |
| `checktelegramlinkstatus` | us-central1 | Vérif lien Telegram | None |
| `telegramchatterbotwebhook` | us-central1 | Webhook bot Telegram chatter | None |
| `skiptelegramonboarding` | us-central1 | Skip Telegram | None |
| `getreferraldashboard` | us-central1 | Dashboard parrainages | None |
| `getchatterrecruitedproviders` | us-central1 | Liste recrutements | None |
| `getcaptaindashboard` | us-central1 | Dashboard captain (top recruteurs) | None |
| `registercaptainapplication` | us-central1 | Candidature captain | Low (peu d'intérêt sans revenu) |

### 2️⃣ VERTICALE INFLUENCER — Services premium

| Service Cloud Run | Région | Rôle | Risque pause |
|---|---|---|---|
| `influencerrequestwithdrawal` | us-central1 | Retraits influenceur | None |
| `getinfluencerleaderboard` | us-central1 | Classement | None |
| `getinfluencerrecruits` | us-central1 | Filleuls | None |
| `getinfluencerrecruitedproviders` | us-central1 | Filleuls prestataires | None |

### 3️⃣ VERTICALE BLOGGER — Services premium

| Service Cloud Run | Région | Rôle | Risque pause |
|---|---|---|---|
| `bloggerrequestwithdrawal` | us-central1 | Retraits blogger | None |
| `getbloggerleaderboard` | us-central1 | Classement | None |
| `getbloggerrecruits` | us-central1 | Filleuls | None |
| `getbloggerrecruitedproviders` | us-central1 | Filleuls prestataires | None |

### 4️⃣ VERTICALE GROUPADMIN — Services premium

| Service Cloud Run | Région | Rôle | Risque pause |
|---|---|---|---|
| `requestgroupadminwithdrawal` | us-central1 | Retraits group admin | None |
| `getgroupadminleaderboard` | us-central1 | Classement | None |
| `getgroupadmincommissions` | us-central1 | Détail commissions | None (0 commission) |
| `getgroupadminnotifications` | us-central1 | Notifs filleuls | None |
| `getgroupadminrecruits` | us-central1 | Filleuls | None |
| `getgroupadminrecruitedproviders` | us-central1 | Filleuls prestataires | None |

### 5️⃣ CRONS GAMIFICATION (Cloud Scheduler — pause)

| Job Cloud Scheduler | Fréquence | Source code | Rôle |
|---|---|---|---|
| `chatterMonthlyTop3Rewards` | Mensuel 1er à 01:00 UTC | `chatter/scheduled/monthlyTop3Rewards.ts` | Top 3 chatters → primes |
| `chatterResetCaptainMonthly` | Mensuel | `chatter/scheduled/resetCaptainMonthly.ts` | Reset compteurs captain |
| `chatterTierBonusCheck` | Quotidien | `chatter/scheduled/tierBonusCheck.ts` | Check paliers tier |
| `chatterWeeklyChallenges` | Hebdo | `chatter/scheduled/weeklyChallenges.ts` | Défis hebdo |
| `addActivityToFeed` | Quotidien | `chatter/scheduled/aggregateActivityFeed.ts` | Feed activité (=lectures Firestore inutiles) |
| `influencerMonthlyTop3Rewards` | Mensuel | `influencer/scheduled/monthlyTop3Rewards.ts` | Top 3 influenceurs |
| `crossRoleMonthlyTop3` | Mensuel | `scheduled/crossRoleMonthlyTop3.ts` | Top 3 cross-rôles |
| `aiTaxWatch` | Semestriel (jan/juil) | `scheduled/aiTaxWatch.ts` | Veille fiscale AI |

### 6️⃣ CRONS DE NETTOYAGE / MONITORING SUR-DIMENSIONNÉS

| Job Cloud Scheduler | Fréquence actuelle | Action recommandée |
|---|---|---|
| `cleanupOrphanedSessions` | Toutes les heures | **PAUSE** (volume nul) |
| `cleanupOrphanedAgentTasks` | Quotidien 8h | **PAUSE** (volume nul) |
| `cleanupTempStorageFiles` | Quotidien 3h | **REDUIRE** à hebdo |
| `notifyExpiringPromotions` | Quotidien 8h | **PAUSE** (0 promo) |
| `consolidatedDailyMonitoring` | Quotidien 8h | **PAUSE** (peu utile sans trafic) |
| `consolidatedWeeklyCleanup` | Dimanche 3h | **PAUSE** (peu utile) |
| `consolidatedDailyEmails` | Quotidien 8h | **PAUSE** (peu de notifs) |
| `consolidatedSecurityDaily` | Quotidien 3h | **REDUIRE** à hebdo |
| `monitorTwilioCrypto` | Quotidien 18h | **PAUSE** (Twilio surveille déjà) |
| `disasterRecoveryTest` | Mensuel | **PAUSE** (pas de prod réelle) |
| `quarterlyRestoreTest` | Trimestriel | **PAUSE** (idem) |
| `escrowMonitoringDaily` | Quotidien | **PAUSE** (0 escrow) |
| `paymentDataCleanup` | Toutes les 6h | **REDUIRE** à hebdo |
| `paypalMaintenance` | Toutes les 6h | **REDUIRE** à quotidien |
| `pendingTransfersMonitor` | Toutes les 6h | **REDUIRE** à quotidien |
| `processBacklinkEngineDLQ` | Toutes les 30 min | **REDUIRE** à toutes les 4h |
| `processDLQ` | Toutes les heures | **REDUIRE** à toutes les 6h |
| `aggregateProviderStats` | Toutes les heures | **REDUIRE** à toutes les 6h |
| `notificationRetry` | Toutes les 4h | **REDUIRE** à toutes les 12h |
| `stripeReconciliation` | Quotidien 4h | **REDUIRE** à hebdo |
| `stuckPaymentsRecovery` | Toutes les 30 min | **REDUIRE** à toutes les 6h |
| `multiFrequencyBackup` (3×/jour) | 3h, 11h, 19h | **REDUIRE** à 1× hebdo |
| `crossRegionBackup` | Hebdo | **REDUIRE** à mensuel |
| `backupAuth` | Quotidien 3h | **REDUIRE** à hebdo |
| `backupStorageToDR` | Quotidien 5h | **REDUIRE** à hebdo |

### 7️⃣ EMAIL MARKETING / GAMIFICATION (callables non critiques)

| Service Cloud Run | Source | Rôle |
|---|---|---|
| `handleMilestoneReached` | `emailMarketing/functions/gamification.ts` | Email milestone $5/$15/$50/$500 |
| `handleBadgeUnlocked` | `emailMarketing/functions/gamification.ts` | Email badge |
| `sendWeeklyStats` | `emailMarketing/functions/statsEmails.ts` | Stats hebdo |
| `sendMonthlyStats` | `emailMarketing/functions/statsEmails.ts` | Stats mensuelles |
| `chatterMailwizzOnRegistered` | `emailMarketing/functions/chatterLifecycle.ts` | Onboarding lifecycle |
| `detectInactiveChattersCron` | idem | Détection chatter inactif |
| `backfillExistingChattersToMailWizz` | `emailMarketing/functions/chatterBackfill.ts` | Backfill historique |
| `sendTrustpilotOutreach` | `emailMarketing/functions/trustpilotOutreach.ts` | Outreach Trustpilot |
| `testTrustpilotOutreach` | idem | Test outreach |

### 8️⃣ ACTIONS CONSOLE GCP (sans toucher au code)

| Action | Console | Économie | Risque |
|---|---|---|---|
| **Désactiver PITR Firestore** | Firestore → Backup → Point-in-time Recovery → Disable | -14 €/mois | Perte rollback < 7j (mais backup quotidien Auth reste) |
| **Buckets backup → Coldline** | Cloud Storage → bucket-backup-* → Lifecycle → Set storage class : Coldline | -4 €/mois | Aucun (lecture rare) |
| **Cleanup versions Secret Manager (>2 par secret)** | Secret Manager → chaque secret → Versions → Destroy old | -4 €/mois | Aucun (anciennes versions inutilisées) |
| **Désactiver fonctions v1 subscription** (legacy App Engine 58€/mois) | Cloud Run → search "createSubscription" etc. → Disable (les 12 fonctions v1) | -22 €/mois | ⚠️ Si tu utilises subscription B2B, NE PAS faire. Si pas encore live → safe |

---

## 🛠️ PROCÉDURE DE DÉSACTIVATION (étape par étape)

### Étape 1 — Cloud Scheduler (jobs/crons)

1. Va sur https://console.cloud.google.com/cloudscheduler
2. Sélectionne projet `sos-urgently-ac307`
3. Pour chaque job listé dans **section 5️⃣ et 6️⃣** (sauf ceux marqués REDUIRE) :
   - Clique sur le job
   - Bouton **PAUSE** en haut
   - Statut passe à `Paused`
4. Pour les jobs marqués **REDUIRE**, clique **EDIT** → modifie le champ "Frequency" selon la colonne "Action recommandée"

### Étape 2 — Cloud Run services (callables/triggers HTTPS)

1. Va sur https://console.cloud.google.com/run
2. Sélectionne projet `sos-urgently-ac307`
3. Filtrer par région : **us-central1** (ou europe-west1 selon le service)
4. Pour chaque service listé dans **sections 1️⃣ à 4️⃣ et 7️⃣** :
   - Clique sur le service
   - Onglet **TRIGGERS**
   - Clique **DISABLE** sur les triggers
   - OU dans l'onglet du service principal : bouton ⋮ → **DELETE TRAFFIC** (réservible)
   - **Alternative recommandée** : bouton **EDIT & DEPLOY NEW REVISION** → onglet "Containers" → réduire `Maximum number of instances` à **0**
5. Le service reste déployé (le code reste là) mais n'accepte plus de trafic et ne te coûte plus rien.

### Étape 3 — Console Firestore (PITR)

1. Va sur https://console.cloud.google.com/firestore/databases
2. Sélectionne database `(default)` du projet `sos-urgently-ac307`
3. Onglet **Backups**
4. Section **Point-in-time recovery** : clique **DISABLE**
5. Confirme

### Étape 4 — Cloud Storage (Coldline)

1. Va sur https://console.cloud.google.com/storage/browser
2. Pour chaque bucket commençant par `gs://sos-urgently-ac307-backup-*` ou `gs://*backup*` :
   - Clique sur le bucket
   - Onglet **LIFECYCLE**
   - **ADD A RULE** :
     - Action : `Set storage class to Coldline`
     - Object condition : `Age = 1 day`
   - Sauvegarde

### Étape 5 — Secret Manager (vieilles versions)

1. Va sur https://console.cloud.google.com/security/secret-manager
2. Pour chaque secret :
   - Clique sur le secret
   - Onglet **VERSIONS**
   - Pour chaque version sauf les **2 plus récentes** : ⋮ → **DESTROY**
3. Cible : passer de 112 versions à ~30 (2 par secret × 15 secrets actifs)

---

## 🔄 PROCÉDURE DE RÉACTIVATION (jour J quand CA arrive)

### Pour relancer chaque verticale

1. **Cloud Scheduler** :
   - https://console.cloud.google.com/cloudscheduler
   - Pour chaque job pausé : clique → bouton **RESUME**
   - Pour les jobs avec fréquence réduite : clique **EDIT** → restaurer la fréquence d'origine (cf. colonne "Fréquence actuelle" dans ce document)

2. **Cloud Run services** :
   - https://console.cloud.google.com/run
   - Pour chaque service désactivé : clique → **EDIT & DEPLOY NEW REVISION** → onglet Containers → restaurer `Maximum number of instances` à la valeur d'origine (5 ou plus selon config)
   - OU si trigger disabled : onglet TRIGGERS → **ENABLE**

3. **Firestore PITR** :
   - https://console.cloud.google.com/firestore/databases
   - Onglet Backups → Point-in-time recovery → **ENABLE**

4. **Cloud Storage** : pas besoin d'action (Coldline reste lisible normalement, juste un peu plus cher en lecture). Si tu veux repasser en Standard :
   - Bucket → Lifecycle → supprime la règle Coldline

5. **Secret Manager** : les versions détruites ne reviennent pas, mais ce n'est pas grave (les nouvelles versions seront créées au besoin).

### Checklist post-réactivation

- [ ] Test inscription chatter → vérifier que `chatterRequestWithdrawal` répond
- [ ] Test inscription influencer → vérifier dashboard complet
- [ ] Vérifier que les crons ont bien repris (Cloud Scheduler → "Last execution")
- [ ] Vérifier la facture GCP du mois suivant pour confirmer le retour à la normale

---

## 🛡️ FONCTIONS QU'IL NE FAUT **JAMAIS** TOUCHER

Ces fonctions sont marquées CRITIQUES. Ne JAMAIS les désactiver :

### SEO / Indexation Google
- `sitemapProfiles`, `sitemapBlog`, `sitemapIndex`, `sitemapNews`, `sitemapGuides`, `sitemapPrograms`, `sitemapLanding`, `sitemapImages`
- `renderForBotsV2` (SSR Googlebot)
- `generateProviderSEO`
- `affiliateOgRender`
- `providerCatalogFeed` (Google Shopping)
- `invalidateCacheEndpoint`

### Flow d'appel (Twilio temps réel)
- `createAndScheduleCall` / `createAndScheduleCallHTTPS`
- `twilioCallWebhook`, `twilioAmdTwiml`, `twilioGatherResponse`
- `twilioConferenceWebhook`
- `providerNoAnswerTwiML`
- `twilioRecordingWebhook`
- `executeCallTask`, `setProviderAvailableTask`, `busySafetyTimeoutTask`
- `forceEndCallTask`
- `processScheduledTransfers`

### Paiements
- `stripeWebhook`
- `createPaymentIntent`
- `notifyAfterPayment`
- `validateCouponCallable`

### Provider availability
- `checkProviderInactivity` (cron 15 min)
- `aaaBusySimulation` (cron 8 min)
- `updateProviderActivity`
- `setProviderOffline`
- `onProviderCreated`

### Auth / Register cœur business
- `registerChatter`, `registerInfluencer`, `registerBlogger`, `registerGroupAdmin` (les 4 entry points GARDÉS pour ne pas bloquer les inscriptions)
- `getChatterDashboard`, `getInfluencerDashboard`, `getBloggerDashboard`, `getGroupAdminDashboard` (dashboards de base)
- `updateChatterProfile`, `updateInfluencerProfile`, `updateBloggerProfile`, `updateGroupAdminProfile`
- `getChatterDirectory`, `getInfluencerDirectory`, `getBloggerDirectory` (annuaires publics SEO)
- `createUserDocument`
- `setAdminClaims`, `bootstrapFirstAdmin`
- `createLawyerStripeAccount`, `createStripeAccount`, `getStripeAccountSession`, `checkStripeAccountStatus`
- `completeLawyerOnboarding`

### Triggers Firestore vitaux
- `onUserDeleted` / `cleanupOrphanedProfiles`
- `onProviderCreated`
- `onBookingRequestCreated`
- `onPaymentRefunded`
- `onCallCompleted` (calculs commissions)
- `onPayoutRetryQueued`
- Tous les `telegramOn*` triggers (notifications admin)

### GDPR (obligation légale)
- `requestDataExport`, `requestAccountDeletion`
- `getMyDataAccessHistory`, `updateConsentPreferences`
- `listGDPRRequests`, `processGDPRRequest`
- `getUserAuditTrail`

### Backups (au moins hebdo)
- `backupAuth` (réduit à hebdo, mais GARDÉ)
- `crossRegionBackup` (réduit à mensuel, mais GARDÉ)
- `multiFrequencyBackup` (réduit à hebdo, mais GARDÉ)

---

## 📊 RÉCAP ÉCONOMIES ESTIMÉES

| Action | Économie/mois |
|---|---|
| Désactivation services Cloud Run verticales (chatter/influencer/blogger/groupAdmin premium) | ~25 € |
| Pause crons gamification + monitoring sur-dimensionnés | ~10 € |
| Désactivation PITR Firestore | ~14 € |
| Cloud Storage backups → Coldline | ~4 € |
| Cleanup versions Secret Manager | ~4 € |
| Pause email marketing / gamification non-critiques | ~3 € |
| **TOTAL Phase 1 (sans toucher au code)** | **~60 €/mois** |

**Facture mars 2026 : 158,50 €**
**Facture après pause estimée : ~95-100 €/mois**
**Réduction : ~38%**

---

## 📞 EN CAS DE PROBLÈME

### Symptôme : un utilisateur me dit "X ne fonctionne plus"
1. Identifier la fonctionnalité concernée
2. Chercher dans ce document section 1️⃣ à 7️⃣
3. Si listée → c'est normal, expliquer "service temporairement pausé, on rouvre bientôt"
4. Si non listée → c'est un bug réel, **alerte** : il faut investiguer

### Symptôme : Google ne crawl plus mon site
1. Vérifier dans Search Console l'erreur exacte
2. Vérifier que les services SEO listés en "🛡️ FONCTIONS QU'IL NE FAUT JAMAIS TOUCHER" tournent bien
3. Si l'un d'eux est `Disabled` → **réactiver immédiatement** (clic "Enable")

### Symptôme : un appel Twilio plante
1. **GRAVE** — les webhooks Twilio sont en CRITIQUES
2. Vérifier `twilioCallWebhook`, `twilioConferenceWebhook` dans Cloud Run → tous doivent être `Active`
3. Si l'un d'eux est `Disabled` → **réactiver immédiatement**

---

## ✅ CHECKLIST GLOBALE DE LANCEMENT DE LA PAUSE

- [ ] J'ai lu intégralement ce document
- [ ] J'ai sauvegardé l'URL de ce document quelque part (favoris)
- [ ] Étape 1 — Cloud Scheduler (29 jobs à pauser/réduire)
- [ ] Étape 2 — Cloud Run services (~30 services à désactiver)
- [ ] Étape 3 — Firestore PITR désactivé
- [ ] Étape 4 — Cloud Storage Coldline configuré
- [ ] Étape 5 — Secret Manager nettoyé
- [ ] Test golden path 1 : ouvrir SOS-Expat.com → la home s'affiche → ✅ SEO OK
- [ ] Test golden path 2 : essayer de réserver un appel (en mode test) → ✅ Twilio OK
- [ ] Test golden path 3 : essayer de s'inscrire comme chatter → ✅ Inscription OK
- [ ] Test golden path 4 : ouvrir le dashboard chatter → ✅ Dashboard de base OK
- [ ] Vérifier dans Cloud Console > Billing > Reports que la courbe baisse dans les 24-48h
- [ ] Date de pause notée : ____________________
- [ ] Date prévue de réactivation : ____________________

---

## 📁 FICHIERS DANS CE DOSSIER

- `PLAN_PAUSE_BILLING.md` — ce document (plan général)
- `CHECKLIST_REACTIVATION.md` — checklist détaillée à dérouler le jour J
- `SERVICES_PAUSED_LIST.csv` — liste complète des services désactivés (1 ligne = 1 service, pour tracking)

---

**Dernière mise à jour** : 2026-04-28
**Stratégie** : Option A — Plateforme 100% fonctionnelle, services premium pausés
