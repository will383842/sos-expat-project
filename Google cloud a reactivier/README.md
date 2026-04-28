# 📁 Google Cloud à réactiver

Ce dossier contient le **plan de pause billing GCP** pour SOS-Expat.

## 🎯 Pourquoi ce dossier existe

Tant qu'il n'y a **pas encore de chiffre d'affaires**, beaucoup de fonctionnalités GCP tournent à vide et coûtent ~158 €/mois.
**Stratégie Option A** : pauser les fonctionnalités premium tout en gardant la plateforme **100% fonctionnelle** (inscriptions, appels, paiements, SEO).

## 📚 Comment lire ces fichiers

**Lis dans cet ordre** :

1. 🛡️ **`AVANT_DE_PAUSER_LIRE_OBLIGATOIREMENT.md`** ← **COMMENCE ICI**
   Procédure prudente, golden path tests, règles d'or pour ne rien casser.

2. 📋 **`PLAN_PAUSE_BILLING.md`**
   Plan détaillé : ce qu'on garde / ce qu'on pause, économies estimées, fonctions critiques à ne JAMAIS toucher.

3. 📊 **`SERVICES_PAUSED_LIST.csv`**
   Tableau de tracking. Pour chaque service à pauser, tu remplis : date pause, résultat test, date réactivation. Te sert de journal de bord.

4. 🔄 **`CHECKLIST_REACTIVATION.md`**
   À utiliser le jour J, quand le CA arrive. Checklist pas-à-pas pour tout réactiver en 30-45 min.

## 💰 Économies attendues

| Phase | Économie/mois | Risque |
|---|---|---|
| Bloc 0 — Console GCP (PITR, Coldline, secrets) | ~22 € | Quasi nul |
| Bloc 1 — Crons sur-dimensionnés | ~10 € | Très faible |
| Bloc 2 — Crons gamification | ~3 € | Faible |
| Bloc 3 — Email marketing non-critique | ~3 € | Faible |
| Bloc 4 — Verticales premium (chatter, influencer, blogger, groupAdmin) | ~25 € | Modéré (testé service par service) |
| **TOTAL** | **~60 €/mois** (158 → ~95-100) | Réversible 100% |

## ⚠️ Règles d'or

1. **Incrémental, jamais en bloc** : 1 service à la fois, test entre chaque
2. **Jamais le vendredi soir** : lundi-mercredi 10h-16h Paris idéal
3. **Snapshots avant** : screenshots des consoles avant de toucher
4. **Tests golden path** après chaque pause (SEO, inscription, Twilio, Stripe)
5. **Rollback instantané** : 1 clic ENABLE et le service revient

## 🛡️ Ce qu'on ne touche JAMAIS

- Tous les services SEO (sitemaps, dynamicRender, providerCatalogFeed)
- Tous les webhooks Twilio (appels temps réel)
- Tous les webhooks Stripe (paiements)
- `createAndScheduleCallFunction`
- `checkProviderInactivity` + `aaaBusySimulation`
- Tous les triggers Firestore liés au flow d'appel
- Inscriptions de tous les rôles (`registerChatter`, `registerInfluencer`, `registerBlogger`, `registerGroupAdmin`)
- Dashboards de base
- Annuaires publics
- GDPR (obligation légale)

## 📞 En cas de doute

**Avant chaque pause** : lis `AVANT_DE_PAUSER_LIRE_OBLIGATOIREMENT.md` section "TESTS GOLDEN PATH".

**Si quelque chose casse** : lis section "PROCÉDURE DE ROLLBACK RAPIDE" dans le même document.

**Solution nucléaire** : tous les services Disabled → ENABLE en bloc → tu repaies pour quelques heures, mais tu retrouves la stabilité immédiatement.

---

**Date de création** : 2026-04-28
**Dernière mise à jour** : 2026-04-28
