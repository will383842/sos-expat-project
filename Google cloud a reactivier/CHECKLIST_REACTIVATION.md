# 🔄 CHECKLIST RÉACTIVATION — Le jour J quand le CA arrive

**Quand utiliser ce document** : quand tu es prêt à relancer la plateforme à pleine puissance (premier client B2B SOS-Call, lancement campagne pub, etc.).

**Temps estimé pour tout réactiver** : 30-45 minutes.

---

## 📂 Récap des actions à inverser (mises à jour 2026-04-28)

| Action effectuée | Méthode de réactivation | Section |
|---|---|---|
| 30 jobs pausés europe-west3 | `gcloud scheduler jobs resume` | Phase 2 |
| 3 jobs pausés europe-west1 | idem | Phase 2 |
| 1 job pausé us-central1 | idem | Phase 2 |
| PITR Firestore désactivé | `gcloud firestore databases update --enable-pitr` | Phase 1 |
| 4 fréquences crons réduites | `gcloud scheduler jobs update http --schedule=...` | Phase 2 |
| 9 fichiers admin avec visibility guards | `git revert` du commit Phase E | Phase 0 |

---

## ⚡ ORDRE DE RÉACTIVATION

### Phase 0 — Rollback du code admin (visibility guards) — 2 min

**Si tu veux retrouver le comportement d'avant** (listeners actifs même quand l'onglet est en arrière-plan) :

```bash
cd C:/Users/willi/Documents/Projets/VS_CODE/sos-expat-project
# Trouver le commit "perf(billing): pause inactive crons + admin visibility guards"
git log --oneline | grep "billing"
# Revert le commit (remplace COMMIT_HASH par le hash trouvé)
git revert COMMIT_HASH
git push origin main
# Cloudflare Pages déploie automatiquement en ~2-3 min
```

**Mais en pratique tu n'as PAS besoin de revert** : la Phase E ne casse rien, elle ne fait que pauser les listeners quand tu ne regardes pas. Quand tu reviens sur l'onglet, ça reprend tout seul. Donc tu peux laisser Phase E active en permanence, même quand tu auras du CA.

---

### Phase 1 — Réactivation infra GCP (5 min)

#### ✅ PITR Firestore (rollback < 7j)
```bash
gcloud firestore databases update --database="(default)" --enable-pitr --project=sos-urgently-ac307
```
Vérification :
```bash
gcloud firestore databases describe --database="(default)" --project=sos-urgently-ac307 --format="value(pointInTimeRecoveryEnablement)"
# Doit afficher: POINT_IN_TIME_RECOVERY_ENABLED
```

#### ✅ Cloud Storage Standard (optionnel — pas configuré dans cette session, skip)
Pas appliqué → rien à faire.

---

### Phase 2 — Crons (5 min)

#### ⚡ Méthode rapide : tout réactiver en bloc (1 commande)

```bash
PROJECT=sos-urgently-ac307

# Réactiver les 30 crons pausés en europe-west3
for job in aiTaxWatch chatterAggregateActivityFeed chatterTierBonusCheck cleanupOrphanedAgentTasks cleanupOrphanedSessions cleanupTempStorageFiles consolidatedDailyEmails consolidatedDailyMonitoring consolidatedSecurityDaily consolidatedWeeklyCleanup crossRoleMonthlyTop3 monitorTwilioCrypto quarterlyRestoreTest runMonthlyDRTest chatterCreateWeeklyChallenge chatterEndWeeklyChallenge chatterUpdateChallengeLeaderboard chatterEmailInactivityReminder detectInactiveChattersCron sendChatterDripMessages sendTrustpilotOutreach sendMonthlyStats sendWeeklyStats bloggerDeactivateExpiredRecruitments bloggerFinalizeMonthlyRankings bloggerUpdateMonthlyRankings iaProspectResubscribeAfterCancel iaProspectSyncFieldsCron updatePartnerMonthlyStats escrowMonitoringDaily; do
  gcloud scheduler jobs resume "firebase-schedule-${job}-europe-west3" --location=europe-west3 --project=$PROJECT
done

# Réactiver les 3 crons pausés en europe-west1
for job in chatterNotifyInactiveMembers chatterNotifyNearTop3 notifyExpiringPromotions; do
  gcloud scheduler jobs resume "firebase-schedule-${job}-europe-west1" --location=europe-west1 --project=$PROJECT
done

# Réactiver le 1 cron pausé en us-central1
gcloud scheduler jobs resume firebase-schedule-chatterResetCaptainMonthly-us-central1 --location=us-central1 --project=$PROJECT

# Restaurer les 4 fréquences modifiées (Phase D)
gcloud scheduler jobs update http firebase-schedule-backupFirebaseAuth-europe-west3 --location=europe-west3 --project=$PROJECT --schedule="0 3 * * *"
gcloud scheduler jobs update http firebase-schedule-backupStorageToDR-europe-west3 --location=europe-west3 --project=$PROJECT --schedule="0 5 * * *"
gcloud scheduler jobs update http firebase-schedule-aggregateProviderStats-europe-west3 --location=europe-west3 --project=$PROJECT --schedule="0 * * * *"
gcloud scheduler jobs update http firebase-schedule-processBacklinkEngineDLQ-europe-west3 --location=europe-west3 --project=$PROJECT --schedule="every 30 minutes"

echo "✅ Tout réactivé"
```

#### Méthode console (manuelle)

Va sur https://console.cloud.google.com/cloudscheduler

#### ✅ Backups quotidiens (priorité haute)
- [ ] `backupAuth` : RESUME + EDIT → fréquence `0 3 * * *` (tous les jours 3h)
- [ ] `backupStorageToDR` : RESUME + EDIT → `0 5 * * *`
- [ ] `multiFrequencyBackup-morning` : RESUME → `0 3 * * *`
- [ ] `multiFrequencyBackup-midday` : RESUME → `0 11 * * *`
- [ ] `multiFrequencyBackup-evening` : RESUME → `0 19 * * *`
- [ ] `crossRegionBackup` : RESUME → `0 4 * * 0` (dimanche 4h)

#### ✅ Monitoring & DR (priorité moyenne)
- [ ] `consolidatedDailyMonitoring` : RESUME → `0 8 * * *`
- [ ] `consolidatedSecurityDaily` : RESUME → `0 3 * * *`
- [ ] `consolidatedDailyEmails` : RESUME → `0 8 * * *`
- [ ] `consolidatedWeeklyCleanup` : RESUME → `0 3 * * 0`
- [ ] `disasterRecoveryTest` : RESUME → `0 6 1 * *`
- [ ] `quarterlyRestoreTest` : RESUME → `0 2 1 1,4,7,10 *`
- [ ] `escrowMonitoringDaily` : RESUME → `0 8 * * *`

#### ✅ Paiements (priorité haute)
- [ ] `paymentDataCleanup` : EDIT → `0 */6 * * *` (toutes les 6h)
- [ ] `paypalMaintenance` : EDIT → `0 */6 * * *`
- [ ] `pendingTransfersMonitor` : EDIT → `0 */6 * * *`
- [ ] `processBacklinkEngineDLQ` : EDIT → `every 30 minutes`
- [ ] `processDLQ` : EDIT → `0 * * * *`
- [ ] `notificationRetry` : EDIT → `0 */4 * * *`
- [ ] `stripeReconciliation` : EDIT → `0 4 * * *`
- [ ] `stuckPaymentsRecovery` : EDIT → `*/30 * * * *`
- [ ] `monitorTwilioCrypto` : RESUME → `0 18 * * *`

#### ✅ Stats & autres
- [ ] `aggregateProviderStats` : EDIT → `0 * * * *`
- [ ] `cleanupOrphanedSessions` : RESUME → `0 * * * *`
- [ ] `cleanupOrphanedAgentTasks` : RESUME → `0 8 * * *`
- [ ] `cleanupTempStorageFiles` : RESUME → `every day 03:00`
- [ ] `notifyExpiringPromotions` : RESUME → `every day 08:00`
- [ ] `aiTaxWatch` : RESUME → `0 10 1 1,7 *`

---

### Phase 3 — Crons gamification (3 min)

Réactive les crons gamification SI tu as des chatters/influencers actifs avec commissions :
- [ ] `chatterMonthlyTop3Rewards` : RESUME → `0 1 1 * *`
- [ ] `chatterResetCaptainMonthly` : RESUME → fréquence d'origine
- [ ] `chatterTierBonusCheck` : RESUME → quotidien
- [ ] `chatterWeeklyChallenges` : RESUME → hebdo
- [ ] `addActivityToFeed` : RESUME → quotidien
- [ ] `influencerMonthlyTop3Rewards` : RESUME → mensuel
- [ ] `crossRoleMonthlyTop3` : RESUME → `0 1 1 * *`

---

### Phase 4 — Cloud Run services (15 min)

Va sur https://console.cloud.google.com/run

#### ✅ Verticale CHATTER
- [ ] `chatterrequestwithdrawal` : EDIT & DEPLOY → maxInstances back to original (1 ou 5)
- [ ] `getchatterleaderboard` : EDIT & DEPLOY → maxInstances original
- [ ] `updatetelegramonboarding` : EDIT & DEPLOY → maxInstances original
- [ ] `generatetelegramlink` : ENABLE
- [ ] `checktelegramlinkstatus` : ENABLE
- [ ] `telegramchatterbotwebhook` : ENABLE
- [ ] `skiptelegramonboarding` : ENABLE
- [ ] `getreferraldashboard` : ENABLE
- [ ] `getchatterrecruitedproviders` : ENABLE
- [ ] `getcaptaindashboard` : ENABLE
- [ ] `registercaptainapplication` : ENABLE

#### ✅ Verticale INFLUENCER
- [ ] `influencerrequestwithdrawal` : ENABLE
- [ ] `getinfluencerleaderboard` : ENABLE
- [ ] `getinfluencerrecruits` : ENABLE
- [ ] `getinfluencerrecruitedproviders` : ENABLE

#### ✅ Verticale BLOGGER
- [ ] `bloggerrequestwithdrawal` : ENABLE
- [ ] `getbloggerleaderboard` : ENABLE
- [ ] `getbloggerrecruits` : ENABLE
- [ ] `getbloggerrecruitedproviders` : ENABLE

#### ✅ Verticale GROUPADMIN
- [ ] `requestgroupadminwithdrawal` : ENABLE
- [ ] `getgroupadminleaderboard` : ENABLE
- [ ] `getgroupadmincommissions` : ENABLE
- [ ] `getgroupadminnotifications` : ENABLE
- [ ] `getgroupadminrecruits` : ENABLE
- [ ] `getgroupadminrecruitedproviders` : ENABLE

#### ✅ EMAIL MARKETING / GAMIFICATION
- [ ] `handleMilestoneReached` : ENABLE
- [ ] `handleBadgeUnlocked` : ENABLE
- [ ] `sendWeeklyStats` : ENABLE
- [ ] `sendMonthlyStats` : ENABLE
- [ ] `chatterMailwizzOnRegistered` : ENABLE
- [ ] `detectInactiveChattersCron` : ENABLE
- [ ] `backfillExistingChattersToMailWizz` : ENABLE
- [ ] `sendTrustpilotOutreach` : ENABLE
- [ ] `testTrustpilotOutreach` : ENABLE

---

### Phase 5 — Vérifications post-réactivation (5 min)

#### Test 1 — Dashboard chatter complet
- [ ] Login chatter
- [ ] Vérifier que le leaderboard s'affiche (= `getChatterLeaderboard` OK)
- [ ] Vérifier que la liste des recruits s'affiche
- [ ] Tenter une demande de retrait test (= `chatterRequestWithdrawal` OK)

#### Test 2 — Telegram chatter
- [ ] Cliquer "Lier mon Telegram"
- [ ] Vérifier le deep link (= `generateTelegramLink` OK)

#### Test 3 — Crons reprennent
- [ ] Cloud Scheduler → vérifier que "Last execution" est récente sur les crons réactivés
- [ ] Attendre 1h-2h pour les crons hourly

#### Test 4 — Aucune erreur Cloud Run
- [ ] Cloud Run → trier par "Errors" descending → 0 erreur récente

#### Test 5 — Facture
- [ ] Console GCP → Billing → Reports → vérifier que le coût mensuel projeté est conforme aux attentes

---

## 🧪 SI TU N'AS PAS BESOIN DE TOUT RÉACTIVER

Tu peux réactiver **sélectivement** selon tes besoins :

### Tu lances une campagne acquisition chatters ?
→ Réactive uniquement la verticale CHATTER + crons gamification chatter.

### Tu signes un client B2B SOS-Call ?
→ Réactive uniquement les fonctions du fichier `subscription/index.ts` (callables Stripe checkout, billing portal, plan management).

### Tu lances une newsletter ?
→ Réactive uniquement Email marketing.

---

## 📞 EN CAS DE PROBLÈME POST-RÉACTIVATION

### Symptôme : un service réactivé tourne mais retourne des erreurs
1. Cloud Run → sélectionne le service
2. Onglet **LOGS** → vérifie les dernières erreurs
3. Souvent : la fonction n'a pas été redéployée depuis trop longtemps → fais un `firebase deploy --only functions:nomDeLaFonction`

### Symptôme : un cron a repris mais ne s'exécute pas
1. Cloud Scheduler → click sur le job
2. Bouton **RUN NOW** → force exécution
3. Vérifie les logs

### Symptôme : "Service was not deployed"
La fonction Cloud Run a été supprimée (pas seulement désactivée) → il faut redéployer le code :
```bash
cd sos/firebase/functions
npm run build
firebase deploy --only functions:nomDeLaFonction --project sos-urgently-ac307
```

---

## ✅ CHECKLIST FINALE DE RÉACTIVATION

- [ ] Tous les services Cloud Run de la liste sont en `Active`
- [ ] Tous les crons Cloud Scheduler sont en `Enabled` avec leur fréquence d'origine
- [ ] PITR Firestore est `Enabled`
- [ ] Tests golden path 1-5 passent (cf. `AVANT_DE_PAUSER_LIRE_OBLIGATOIREMENT.md`)
- [ ] Dashboard chatter / influencer / blogger / groupAdmin fonctionne complètement
- [ ] Withdrawals fonctionnent
- [ ] Telegram onboarding fonctionne
- [ ] Email marketing tourne
- [ ] Date de réactivation notée : ____________________
- [ ] Facture GCP de retour à la normale (vérifier dans 7-15 jours)

---

**Pour toute question** : relire `PLAN_PAUSE_BILLING.md` qui contient le contexte complet.
