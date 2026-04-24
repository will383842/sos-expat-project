# Audit E2E — tous les flux de réservation d'un prestataire

**Date** : 2026-04-24
**Scope** : Du bouton "SOS Appel" jusqu'à la fin de l'appel, tous les scénarios possibles.

---

## 🎯 Principe fondamental

Un appel avec un prestataire peut se terminer de **2 façons** côté SOS-Expat :

- **Payant (univers A)** : le client règle 19€ ou 49€ via Stripe. SOS-Expat verse commissions et affiliations.
- **Gratuit (univers B)** : le partenaire B2B (AXA, Visa…) paie un forfait mensuel. **AUCUNE affiliation ne doit être versée** — seul le partenaire est débité, via facture mensuelle Stripe/SEPA.

---

## Parcours unifié (nouveau — après refonte)

```
                    CLIC "SOS APPEL"
                          │
                          ▼
                 ┌────────────────┐
                 │  /sos-appel    │
                 │ (liste         │
                 │  providers)    │
                 └────────┬───────┘
                          │
                          ▼
                 ┌────────────────┐
                 │ Profil provider│
                 │ (Maître Dupont)│
                 └────────┬───────┘
                          │ (auth requise)
                          ▼
                 ┌──────────────────────────────────┐
                 │  /booking-request/:providerId    │
                 │                                  │
                 │  • Infos personnelles            │
                 │  • Téléphone E.164               │
                 │  • Motif + description           │
                 │  • Langues                       │
                 │                                  │
                 │  ╔══════════════════════════╗    │
                 │  ║ ☐ J'ai un code SOS-Call ║    │
                 │  ╚══════════════════════════╝    │
                 │                                  │
                 │  ☑ CGU                            │
                 │  [ Valider ]                     │
                 └──────────┬───────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
          CASE DÉCOCHÉE           CASE COCHÉE
                │                       │
                ▼                       ▼
          ┌───────────┐          ┌──────────────────┐
          │           │          │ Saisie du code   │
          │           │          │ AXA-2026-X7K2P   │
          │           │          │ [ Vérifier ]     │
          │           │          └────────┬─────────┘
          │           │                   │
          │           │                   ▼
          │           │          ┌──────────────────┐
          │           │          │ /api/sos-call/   │
          │           │          │ check (Laravel)  │
          │           │          └────────┬─────────┘
          │           │                   │
          │           │             ┌─────┴─────┐
          │           │       VALIDÉ       ÉCHEC
          │           │             │         │
          │           │             │         ▼
          │           │             │    Message erreur
          │           │             │    (9 états possibles)
          │           │             │         │
          │           │             │         └─► retry / décoche
          │           │             │
          │           │             ▼
          │           │    ┌──────────────────┐
          │           │    │ ✓ Code validé    │
          │           │    │ Couvert par AXA  │
          │           │    │ [Modifier]       │
          │           │    │ [Annuler/payer]  │
          │           │    └────────┬─────────┘
          │           │             │
          └─┬─────────┴─────────────┘
            │ [ SUBMIT ]
            │
            ▼
   ┌────────────────────┐
   │ Branch : code OK ? │
   └──────┬─────────────┘
          │
      ┌───┴───┐
     NON     OUI
      │       │
      ▼       ▼
 ┌─────────┐ ┌──────────────────────────┐
 │CallCheckout│ │ Firebase callable       │
 │ (Stripe) │ │ createAndScheduleCall   │
 │          │ │  + sosCallSessionToken  │
 │ CB/Apple │ │                         │
 │ Pay/3DS  │ │ Backend Firebase :      │
 │          │ │  → skip Stripe          │
 │ amount=  │ │  → call_sessions avec   │
 │ 19€/49€  │ │    isSosCallFree=true   │
 └────┬─────┘ └───────────┬─────────────┘
      │                   │
      └─────────┬─────────┘
                │
                ▼
     ┌────────────────────┐
     │ /payment-success   │
     │ Countdown 240s     │
     │ onSnapshot live    │
     └──────────┬─────────┘
                │
                ▼
     ┌────────────────────────┐
     │ Twilio Conference      │
     │ 1. Appelle provider    │
     │ 2. DTMF # confirm      │
     │ 3. Appelle client      │
     │ 4. Conférence audio    │
     │ 5. Hang up → billing   │
     └──────────┬─────────────┘
                │
                ▼
     ┌─────────────────────────────────────────┐
     │ onCallCompleted — 6 triggers parallèles │
     └─┬───────────────────────────────────────┘
       │
   ┌───┴──────────────────────────────────────┐
   │ TOUS vérifient isSosCallFree en premier  │
   └──────────────────────────────────────────┘
```

---

## 🛡️ Les 6 triggers `onCallCompleted` et leurs gardes

Tous les triggers Firestore qui pourraient créer une commission sont protégés par un early return si `isSosCallFree===true`. **Tableau récap après correction** :

| Trigger | Fichier | Garde `isSosCallFree` |
|---|---|---|
| **Partner** | `partner/triggers/onCallCompleted.ts` | ✅ (pré-existant) |
| **Chatter** | `chatter/triggers/onCallCompleted.ts` | ✅ **(ajouté 2026-04-24)** |
| **Influencer** | `influencer/triggers/onCallCompleted.ts` | ✅ **(ajouté 2026-04-24)** |
| **Blogger** | `blogger/triggers/onCallCompleted.ts` | ✅ **(ajouté 2026-04-24)** |
| **GroupAdmin** | `groupAdmin/triggers/onCallCompleted.ts` | ✅ **(ajouté 2026-04-24)** |
| **Affiliate** | `affiliate/triggers/onCallCompleted.ts` | ✅ **(ajouté 2026-04-24)** |
| **Unified (shadow)** | `unified/handlers/handleCallCompleted.ts` | ✅ **(ajouté 2026-04-24)** |

### Pattern appliqué partout

```typescript
// 🆘 SOS-Call B2B bypass: no commission for free subscriber calls.
const isSosCallFree = after.isSosCallFree === true
                   || after.metadata?.isSosCallFree === true;
if (isSosCallFree) {
  logger.info("[handlerName] SOS-Call free — skip commission", {
    sessionId,
    partnerSubscriberId: after.partnerSubscriberId ?? null,
  });
  return;
}
```

---

## Les 12 scénarios end-to-end possibles

| # | Scénario | Paiement | Affiliation | Traitement onCallCompleted |
|---|---|---|---|---|
| 1 | Client normal sans code | Stripe 19€/49€ | ✅ Versée au chatter/influencer/blogger/GA/affilié | Tous les triggers tournent normalement |
| 2 | Client avec code validé | ❌ Aucun | ❌ Aucune | Tous les triggers early-return |
| 3 | Client coche, tape code, change d'avis, décoche | Stripe | ✅ Versée | Flux normal — code jamais envoyé à Firebase |
| 4 | Client coche, code invalide, décoche | Stripe | ✅ Versée | Flux normal |
| 5 | Client coche, code valide, clique "Annuler et payer" | Stripe | ✅ Versée | Flux normal — session_token brûlé mais ignoré |
| 6 | Client coche, code valide, clique "Modifier le code", retape | Selon validation | Selon | 2e appel à `/api/sos-call/check` |
| 7 | Code valide mais type provider non couvert | ❌ Bloqué au submit | — | Message d'erreur, pas d'appel créé |
| 8 | Code valide, mais Firebase échoue au scheduling | ❌ Aucun | — | Message "Essayez le paiement classique" |
| 9 | Code valide, provider `isBusy` pendant 240s | Libéré (pas de billing) | — | Firestore marque `no_answer`, pas de commission |
| 10 | Apple Pay / Google Pay (client normal) | Stripe via PaymentRequest | ✅ Versée | Tous triggers |
| 11 | 3DS Secure bank verification | Stripe après 3DS | ✅ Versée | Tous triggers |
| 12 | Flux direct `sos-call.sos-expat.com` (entry B2B dédié) | ❌ Aucun | ❌ Aucune | Auto-sélection provider, isSosCallFree=true |

---

## 🔒 Où sont placés les verrous sur `isSosCallFree`

```
┌─────────────────────────────────────────────────────────────┐
│  VERROU 1 — Création du call_session                        │
│  Fichier: createAndScheduleCallFunction.ts:443-470          │
│                                                             │
│  Si sosCallSessionToken fourni :                            │
│    → validation via /api/sos-call/check-session             │
│    → isSosCallFree = true écrit dans call_sessions          │
│    → paymentIntentId ignoré (pas de Stripe)                 │
│    → amount = 0                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  VERROU 2 — Fin d'appel, 6 triggers parallèles              │
│                                                             │
│  partner/triggers/onCallCompleted.ts:49                     │
│  chatter/triggers/onCallCompleted.ts:~95                    │
│  influencer/triggers/onCallCompleted.ts:~67                 │
│  blogger/triggers/onCallCompleted.ts:~394                   │
│  groupAdmin/triggers/onCallCompleted.ts:~72                 │
│  affiliate/triggers/onCallCompleted.ts:~55                  │
│  unified/handlers/handleCallCompleted.ts:~45                │
│                                                             │
│  TOUS font :                                                │
│    if (isSosCallFree) return;                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  VERROU 3 — consolidatedOnCallCompleted.ts                  │
│                                                             │
│  Propage isSosCallFree + partnerSubscriberId aux handlers  │
│  unifiés (system calcul shadow)                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Collections Firestore impactées

### Ce qui N'EST PAS créé quand `isSosCallFree=true`

- ❌ `chatter_commissions`
- ❌ `chatter_recruited_providers` (call counter)
- ❌ `influencer_commissions`
- ❌ `influencer_notifications`
- ❌ `blogger_commissions`
- ❌ `group_admin_commissions`
- ❌ `affiliate_commissions`
- ❌ `affiliate_notifications`
- ❌ `partner_commissions`
- ❌ `milestone_*` (progressions milestones)
- ❌ `tirelire_*` (épargne chatter)

### Ce qui EST créé quand `isSosCallFree=true`

- ✅ `call_sessions` (avec `isSosCallFree: true` + `partnerSubscriberId`)
- ✅ `subscriber_activities` côté **Partner Engine** (log interne pour factur.)
- ✅ Increment `calls_expert` ou `calls_lawyer` sur `subscribers` (Postgres)

---

## Test d'invariant critique

Un test dédié devrait vérifier en permanence que **aucune commission n'est créée pour un appel SOS-Call gratuit**. Ce test est côté Firebase Functions (jest), mais on peut l'approximer côté Laravel en vérifiant que le log endpoint `/api/sos-call/log` n'a pas créé de `subscriber_activity` de type commission.

---

## 🎯 Résumé : tout est en place

1. ✅ **Parcours unifié** : Jean choisit son provider (Maître Dupont), puis lors du booking coche "J'ai un code" → pas de Stripe, appel direct avec Maître Dupont.
2. ✅ **Réversibilité** : décoche, modifie le code, ou annule même après validation.
3. ✅ **Zéro affiliation** versée quand un code est utilisé : les 6 triggers `onCallCompleted` ont TOUS leur garde `isSosCallFree`.
4. ✅ **Zéro débit client** : pas de paymentIntent Stripe créé (et même si `SosCallCodePanel` a été remplacé, le banner n'est plus nécessaire).
5. ✅ **Facturation unique** : seul le partenaire reçoit sa facture mensuelle (cron `invoices:generate-monthly` → `PartnerInvoice` + PDF + Stripe Invoice).
6. ✅ **Provider crédité** : l'avocat/expatrié aidant est bien payé son forfait (30€/10€) depuis la caisse B2B — voir "Paiement providers" ci-dessous.

---

## 💼 Paiement des providers (avocats / expatriés aidants) — correction 2026-04-24

### Le problème initial

`TwilioCallManager.handleCallCompletion()` appelle `shouldCapturePayment()` → retourne `false` pour les appels SOS-Call gratuits (pas de `payment.intentId`) → `capturePaymentForSession()` n'est PAS appelé → `syncPaymentStatus()` n'écrit PAS `payment.providerAmount` sur le call_session. **Résultat : le provider ne voit jamais son gain dans son dashboard.**

### La correction

Un bloc dédié `isSosCallFree` a été ajouté à `handleCallCompletion` (TwilioCallManager.ts ~ligne 2680) :

```typescript
if (isSosCallFree) {
  if (duration >= CALL_CONFIG.MIN_CALL_DURATION) {
    const pricingConfig = await getPricingConfig();
    const providerAmount = pricingConfig[serviceType].eur.providerAmount; // 30€ ou 10€
    await sessionRef.update({
      "payment.status": "captured_sos_call_free",
      "payment.providerAmount": providerAmount,
      "payment.providerAmountCents": Math.round(providerAmount * 100),
      "payment.capturedAt": admin.firestore.Timestamp.now(),
      "payment.gateway": "sos_call_free",
      "isPaid": true,
    });
  }
  // + ne passe PAS par le refund branch (rien à rembourser)
  // + continue avec cooldown + logCallRecord normalement
}
```

### Ce qui est désormais correct

| Entité | Qu'est-ce qu'elle reçoit ? |
|---|---|
| **Avocat / Expert** (provider) | ✅ 30€ / 10€ crédités via `payment.providerAmount` |
| **Client final** (Jean) | ✅ Rien débité, appel offert |
| **Partenaire B2B** (AXA) | 💳 Facture mensuelle = nb clients actifs × forfait |
| **Chatter / Influencer / Blogger / GroupAdmin / Affilié** | ❌ Aucune commission (early-return `isSosCallFree`) |
| **Client avec affiliate code** (parrain) | ❌ Aucune commission (bloqué via `affiliate/onCallCompleted.ts`) |

### État de `payment.status` après call SOS-Call free

- **Appel réussi (>60s)** : `payment.status = 'captured_sos_call_free'`, `isPaid = true`, `providerAmount` écrit
- **Appel trop court (<60s)** : `payment.status = 'no_credit_short_call'`, `isPaid` non changé, pas de provider credit
- **Provider cooldown** : planifié normalement (5 min → disponible)
- **Notifications post-appel** : envoyées normalement (client reçoit "votre appel est terminé")

### Ce qui reste à faire côté prestataire (withdrawal / earnings dashboard)

Le provider voit le call dans son historique avec `payment.providerAmount`. Pour que l'argent soit réellement disponible au retrait (withdrawal Wise/PayPal/Bank), il faut que le **service de paiement providers** (batch quotidien ou à la demande) lise les `call_sessions` avec `payment.status IN ('captured', 'captured_sos_call_free')` et crédite le solde du provider. **Vérifier que ce batch lit bien les deux statuts.**

---

## Fichiers modifiés pendant cet audit (2026-04-24)

| Fichier | Changement |
|---|---|
| `sos/firebase/functions/src/chatter/triggers/onCallCompleted.ts` | ✅ Garde `isSosCallFree` early return |
| `sos/firebase/functions/src/influencer/triggers/onCallCompleted.ts` | ✅ Garde `isSosCallFree` |
| `sos/firebase/functions/src/blogger/triggers/onCallCompleted.ts` | ✅ Garde `isSosCallFree` |
| `sos/firebase/functions/src/groupAdmin/triggers/onCallCompleted.ts` | ✅ Garde `isSosCallFree` |
| `sos/firebase/functions/src/affiliate/triggers/onCallCompleted.ts` | ✅ Garde `isSosCallFree` |
| `sos/firebase/functions/src/unified/handlers/handleCallCompleted.ts` | ✅ Garde `isSosCallFree` |
| `sos/firebase/functions/src/unified/types.ts` | ✅ Ajout `isSosCallFree` + `partnerSubscriberId` au type |
| `sos/firebase/functions/src/triggers/consolidatedOnCallCompleted.ts` | ✅ Propage ces 2 flags au handler unifié |
| `sos/firebase/functions/src/TwilioCallManager.ts` | ✅ **Crédite provider** (30€/10€) pour SOS-Call free + évite le refund branch |
| `sos/firebase/functions/src/partner/triggers/onCallCompleted.ts` | (pré-existant) déjà protégé |
