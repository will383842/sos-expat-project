# 🛡️ AVANT DE PAUSER — LIRE OBLIGATOIREMENT

**Le but de ce document** : t'éviter de casser quoi que ce soit. Ce document décrit **les vérifications préalables** et la **méthode d'exécution prudente** pour la pause billing GCP.

---

## 🚨 RÈGLES D'OR (à respecter absolument)

### Règle 1 — INCRÉMENTAL, jamais en bloc
Ne désactive **JAMAIS plusieurs services en même temps**. Tu fais :
1. Désactive **1 service** dans la console
2. Attends **2 minutes**
3. **Teste le golden path** (cf. section "Tests Golden Path" ci-dessous)
4. Si tout va bien → tu fais le service suivant
5. Si problème → tu **réactives immédiatement** (clic Enable) et tu notes le problème

### Règle 2 — JAMAIS le vendredi soir
Ne pas faire de pause après vendredi 17h. Si quelque chose casse pendant le week-end, tu peux ne pas le voir avant lundi → catastrophe SEO si Google crawl pendant ce temps.

**Bonne fenêtre** : lundi-mercredi entre 10h et 16h heure de Paris. Pourquoi ? Tu vois immédiatement les problèmes et tu peux corriger.

### Règle 3 — Ouvre 2 onglets
- **Onglet 1** : Console GCP (où tu cliques)
- **Onglet 2** : sos-expat.com en navigation privée (pour vérifier en temps réel)

### Règle 4 — Snapshot AVANT
Avant de toucher à quoi que ce soit, **prends un screenshot ou fais une copie écran de** :
- La liste des services Cloud Run actifs (filtrer par status = "Active")
- La liste des Cloud Scheduler jobs avec leur fréquence
- L'écran de configuration PITR Firestore
- La taxe storage class de tes buckets backup

Ça te servira de **référence visuelle** pour réactiver à l'identique.

### Règle 5 — Note ce que tu as fait
À chaque action, note dans `SERVICES_PAUSED_LIST.csv` :
- Le service touché
- L'heure
- Le résultat du test golden path

---

## ✅ TESTS GOLDEN PATH (à exécuter après CHAQUE pause)

### Test 1 — SEO (le plus important)
**À faire APRÈS chaque pause** (30 secondes max) :

1. Va sur https://www.sos-expat.com/sitemap.xml
   - Doit retourner du XML, pas une erreur
2. Va sur https://www.sos-expat.com/sitemap-profiles.xml
   - Doit retourner du XML
3. Va sur https://www.sos-expat.com/robots.txt
   - Doit retourner le contenu robots
4. **Test SSR Googlebot** :
   ```
   curl -A "Googlebot" https://www.sos-expat.com/fr/lawyer/avocat-paris-XXX | head -20
   ```
   Doit retourner du HTML rendu (pas une SPA vide).

✅ Si tous OK → le SEO n'est pas impacté → tu peux continuer.
❌ Si l'un échoue → **STOP, réactive le dernier service touché**.

### Test 2 — Inscription (cœur business)
1. Ouvre sos-expat.com en navigation privée
2. Va sur la page d'inscription chatter (`/chatter`)
3. Clique "M'inscrire" (sans valider, juste ouvrir le formulaire)
4. Vérifie que le formulaire s'affiche sans erreur console

✅ Si OK → inscriptions toujours possibles.
❌ Si erreur → **STOP, réactive immédiatement**.

### Test 3 — Twilio (appels)
**Après avoir touché aux fonctions liées aux paiements ou appels** uniquement :
1. Ouvre l'app SOS-Expat
2. Lance un appel test (mode preview)
3. Vérifie que le webhook répond (logs Cloud Run sur `twiliocallwebhook`)

⚠️ Tu n'es PAS censé toucher à Twilio dans ce plan, mais vérifier au cas où.

### Test 4 — Stripe (paiements)
- Ouvre le webhook Stripe → onglet "Recent events" → vérifie que les derniers événements sont en `Success`
- Si tu vois des `Failed` après ta pause → réactive

### Test 5 — Provider availability
1. Login en tant qu'admin
2. Va sur Multi-Provider dashboard
3. Vérifie que les statuts (busy/available) se mettent à jour
4. Si les statuts sont figés → réactive `checkProviderInactivity` ou `aaaBusySimulation`

---

## 🚦 ORDRE D'EXÉCUTION RECOMMANDÉ (du moins risqué au plus délicat)

### Bloc 1 — Tier 0 : ZÉRO risque (à faire en premier)
1. **Storage backups → Coldline** (lifecycle rule, pas de pause de service)
2. **Cleanup versions Secret Manager** (suppression versions anciennes)
3. **Désactivation PITR Firestore** (1 toggle dans la console)

→ Test golden path 1 (SEO) après ce bloc.
→ Économie : ~22 €/mois.

### Bloc 2 — Tier 1 : Crons sur-dimensionnés (très faible risque)
Pause/réduction des crons listés dans le PLAN_PAUSE_BILLING.md section 6️⃣ :
- Backups quotidiens → hebdo
- Crons de cleanup orphelins → pause
- Monitoring duplicates → pause

→ Test golden path 1 + 2 après ce bloc.
→ Économie : ~10 €/mois.

### Bloc 3 — Tier 2 : Gamification & email marketing non-critiques (faible risque)
Pause des fonctions de gamification :
- `handleMilestoneReached`, `handleBadgeUnlocked`
- `sendWeeklyStats`, `sendMonthlyStats`
- `chatterMonthlyTop3Rewards`, `influencerMonthlyTop3Rewards`, etc.

→ Test golden path 1 + 2.
→ Économie : ~6 €/mois.

### Bloc 4 — Tier 3 : Verticales premium (risque modéré, à faire 1 service à la fois)
Pause **un service à la fois**, en testant entre chaque, dans cet ordre :
1. `chatterRequestWithdrawal` (pas de retraits possibles sans CA = safe)
2. `getChatterLeaderboard` (gadget, safe)
3. `updateTelegramOnboarding` + `generateTelegramLink` + `checkTelegramLinkStatus`
4. `getReferralDashboard`
5. `getCaptainDashboard`
6. ... etc selon liste

→ Test golden path 2 après CHAQUE service.
→ Économie : ~25 €/mois.

### Bloc 5 — STOP, n'aller PAS plus loin pour l'instant
**NE PAS toucher à** :
- Migration v1→v2 du fichier `subscription/index.ts` (à faire plus tard, demande tests poussés)
- Optimisation des triggers Firestore en cascade (risque de casser les commissions)
- Webhooks Twilio / Stripe (jamais)
- Sitemaps / dynamicRender (jamais)

---

## 🔥 PROCÉDURE DE ROLLBACK RAPIDE (si quelque chose casse)

### Cas 1 — Le SEO casse (sitemap retourne 404 ou 500)
1. Ouvre Cloud Run console
2. Filtre par "Status: Disabled" ou "Traffic: 0"
3. Pour chaque service SEO listé dans la section "JAMAIS TOUCHER" du plan :
   - Si trouvé en Disabled → clique → **ENABLE**
4. Attends 1 minute
5. Re-teste le sitemap

### Cas 2 — Inscriptions cassées
1. Ouvre Cloud Run console
2. Cherche `registerchatter` (ou `registerinfluencer`, etc. selon ce qui casse)
3. Si Disabled → **ENABLE**
4. Re-teste l'inscription

### Cas 3 — Appel Twilio plante
🚨 **GRAVE — agis immédiatement**
1. Cloud Run → cherche `twiliocallwebhook`, `twilioconferencewebhook`, `providernoanswerwiml`
2. Si l'un est Disabled → **ENABLE IMMÉDIATEMENT**
3. Vérifie minInstances → doit être à 1 (pas 0)
4. Re-teste un appel

### Cas 4 — Paiement Stripe échoue
1. Cloud Run → `stripewebhook`, `createpaymentintent`
2. Si Disabled → **ENABLE**
3. Vérifie webhook dans Stripe Dashboard

### Cas 5 — Doute généralisé "j'ai cassé un truc je ne sais pas quoi"
**Solution nucléaire** : retourne sur Cloud Run, filtre tous les services en `Disabled` et **réactive tout en bloc**. Tu repaies pour quelques heures, mais tu retrouves la stabilité. Puis tu refais la pause **plus lentement**.

---

## 📋 CHECKLIST PRÉ-PAUSE (5 min, à cocher avant de commencer)

- [ ] J'ai lu **intégralement** le `PLAN_PAUSE_BILLING.md`
- [ ] J'ai lu **intégralement** ce fichier (AVANT_DE_PAUSER...)
- [ ] J'ai pris un screenshot de la liste Cloud Run actuelle
- [ ] J'ai pris un screenshot de la liste Cloud Scheduler actuelle
- [ ] J'ai noté l'état actuel de PITR Firestore (Enabled / Disabled)
- [ ] J'ai 2 onglets ouverts : Console GCP + sos-expat.com
- [ ] Je suis lundi-jeudi entre 10h-16h Paris
- [ ] J'ai vérifié dans Search Console qu'il n'y a pas de crawl en cours
- [ ] J'ai prévu **1h-1h30** pour faire la procédure proprement
- [ ] Je sais où trouver le bouton ENABLE pour réactiver en urgence
- [ ] J'ai noté le numéro du support GCP au cas où : https://cloud.google.com/support

✅ Si tous cochés → tu peux y aller.

---

## 🎯 OBJECTIF FINAL

À la fin de cette session de pause :
- Économie : **~55-60 €/mois**
- Plateforme : **100% fonctionnelle** (inscriptions, appels, paiements, SEO)
- Réactivation : **possible en 30 minutes** le jour J

Si tu suis cette procédure incrémentale, **tu ne peux PAS casser quoi que ce soit de manière irréversible**. Le pire scénario = tu te trompes sur 1 service, tu réactives en 30 secondes, et tu continues.

**Bonne pause 💰**
