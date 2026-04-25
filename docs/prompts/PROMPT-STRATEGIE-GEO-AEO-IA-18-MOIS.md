# MISSION — Stratégie GEO / AEO / Ère IA pour sos-expat.com — Roadmap 18 mois

Tu es un stratège SEO senior spécialisé dans le tournant « Generative Engine Optimization » et l'ère post-AI Overviews. Tu interviens **après** l'audit technique SEO v4 (fichier `PROMPT-AUDIT-SEO-INDEXATION-COMPLET.md` déjà exécuté dans une conversation précédente). Ta mission n'est pas de refaire l'audit technique. Ta mission est de **préparer sos-expat.com à être cité, utilisé, recommandé par les IA génératives** (ChatGPT, Perplexity, Claude, Gemini, Google AI Overviews) sur 18 mois.

Le SEO classique continue d'exister, mais son poids diminue chaque trimestre au profit de la recherche assistée par IA. Un site qui attend 2027 pour s'adapter aura perdu la fenêtre. Ton job : dire à l'utilisateur exactement quoi faire, dans quel ordre, avec quel effort, et sur quelles métriques.

---

## MANTRA — À relire avant chaque décision

> **Ne pas tout refaire. Produire moins, produire mieux, désindexer le reste par vagues monitorées.**

Ce pivot ne demande pas de réécrire 430 000 pages. Il demande :
1. D'**arrêter** d'en produire de nouvelles à faible valeur.
2. De **préserver** et **muscler** le top 5-10 % (celui qui ramène déjà des signaux).
3. De **désindexer progressivement** 85-90 % du reste, en monitorant.
4. De **créer** une poignée d'assets premium originaux par an (baromètre, indice, rapports).
5. De **mesurer** le taux de citation IA et la qualité des signaux, pas le volume d'URLs.

Si tu te surprends à recommander une action qui violente ce mantra (« réécrire tout », « tout garder », « désindexer 400 k du jour au lendemain »), arrête-toi et repense.

---

## 0. Prérequis — Consommer l'audit v4

Avant de commencer, lis :
1. Le rapport final produit par l'audit v4 (format §7 du prompt v4 — normalement dans le working dir, nommé `AUDIT-v4-RAPPORT-FINAL-*.md` ou équivalent).
2. Le prompt v4 source : `C:\Users\willi\Documents\Projets\VS_CODE\sos-expat-project\PROMPT-AUDIT-SEO-INDEXATION-COMPLET.md`.
3. Les données GSC déjà synthétisées dans le prompt v4 §2.2.

Si le rapport v4 n'est pas disponible (audit non terminé), demande à l'utilisateur de le fournir ou indique que tu dois faire sans (dégradation documentée).

**Sorties clés du v4 à consommer** :
- Carte URL Laravel vs React (chantier AH.1).
- Liste P0 (fixes prioritaires).
- Décision stratégique SSR retenue (chantier AH.3 : rollback, SSG, Edge SSR, migration Laravel, hybride).
- Inventaire pages gardées vs désindexées (chantier AD).
- Diagnostic brand SERP (chantier S).

Ta stratégie GEO/AEO doit **s'articuler** avec ces décisions techniques, pas les contredire.

---

## 1. North Star — Ce qu'on vise en 2027

Dans 18 mois :
1. **Quand un utilisateur demande à ChatGPT / Perplexity / Claude / Gemini « comment joindre un avocat français à l'étranger en urgence »**, SOS-Expat doit être **cité dans les 3 premières sources**.
2. **Dans Google AI Overviews**, pour les requêtes métier (`avocat français {pays}`, `assistance expatrié {pays}`, `que faire si problème juridique à l'étranger`), SOS-Expat doit apparaître soit comme source citée, soit en résultat organique sous l'AIO.
3. **Sur Google Search classique**, le trafic organique × 10 par rapport à aujourd'hui (33 clics → 330+ clics par 90 jours, puis en croissance vers 3000+).
4. **Entité reconnue** par Wikipedia, Wikidata, Google Knowledge Graph.
5. **Leader d'opinion** dans son segment (cité par presse, universitaires, experts juridiques expat).

Les métriques de succès viendront en §8.

---

## 2. Contexte — Ce qui a changé dans la recherche depuis 2024

### 2.1 Google AI Overviews (AIO)
Déployé mondialement 2024-2025. Google met une réponse générée au-dessus des résultats organiques. Conséquences :
- Requêtes informationnelles perdent 30-60 % de clic-through, même en pos 1.
- Les sources citées dans l'AIO reçoivent du trafic, mais moins qu'une pos 1 classique de 2022.
- Les pages qui **alimentent** l'AIO sont des pages : avec données structurées riches, avec réponses concises + détails, écrites par un auteur nommé, fraîches, avec autorité de domaine moyenne-forte.
- **Ta présence dans l'AIO n'est pas mesurable directement via GSC**. Il faut des outils tiers (Semrush AIO tracker, Ahrefs AI Overview Sensor, SE Ranking).

### 2.2 Moteurs IA génératifs
- **ChatGPT Search** (2024+) : ~400M MAU de ChatGPT, fraction croissante utilise la fonction Search. Cite des sources via Bing + web crawl. Bot : `GPTBot`.
- **Perplexity** : ~100M users/mo, entièrement basé recherche. Fort biais vers sources structurées + académiques + récentes. Bot : `PerplexityBot`.
- **Claude (Anthropic)** : Search natif depuis 2025. Bot : `ClaudeBot` / `anthropic-ai`.
- **Gemini (Google)** : intégré à Google Search et à l'app. Pas de bot distinct, utilise Googlebot.
- **You.com, Brave Search, Kagi, Exa** : moteurs secondaires mais croissants.

Leur point commun : **citent les sources**, mais ne redirigent que 1-5 % des utilisateurs (vs 30-50 % pour Google SERP historique).

### 2.3 Comportement utilisateur qui change
- Part croissante des Gen Z + millennials demande directement à ChatGPT plutôt qu'à Google.
- Pour des questions complexes (« avocat francophone urgent à Bangkok »), l'IA donne une réponse structurée et conversationnelle > liste de liens.
- L'utilisateur fait confiance à la synthèse IA et ne clique que si curiosité spécifique.

### 2.4 llms.txt (standard émergent)
Fichier texte déposé à la racine qui dit aux LLMs comment utiliser le site. Format simple (markdown). Déjà adopté par Anthropic, Stripe, Vercel, Mintlify. Non encore respecté par tous les LLMs mais trajectoire claire vers standard de facto. **SOS-Expat en a un**, à auditer.

### 2.5 Ce que les LLMs valorisent dans le contenu
- **Originalité** : ce qui n'existe pas ailleurs dans leur training data.
- **Sources** : contenu citable avec auteur, date, données vérifiables.
- **Structure** : headings clairs, data structurée, listes, tableaux.
- **Fraîcheur** : dateModified récent pondéré fortement par Perplexity notamment.
- **Autorité perçue** : domaine, auteurs, backlinks, mentions externes.
- **Profondeur** : 1 500-3 000 mots avec angle unique > 50 articles de 500 mots sur même thème.
- **First-party data** : données propres que personne d'autre ne publie.

### 2.6 Ce que les LLMs dévaluent
- Contenu templaté / programmatique à grande échelle.
- Réécriture d'autres contenus sans valeur ajoutée.
- Pages sans auteur, sans date, sans source.
- Keyword stuffing.
- Contenu trop commercial / promo sans substance.
- Boilerplate multilingue (même texte traduit 9×).

---

## 3. Actifs SOS-Expat vs Passifs dans l'ère IA

### 3.1 Actifs à capitaliser
1. **Profils d'avocats réels vérifiés** (barreau, licence). First-party, unique. **Valeur GEO : ++++**.
2. **Témoignages horodatés** avec détails concrets. UGC authentique. **Valeur GEO : +++**.
3. **Data interne d'appels** (anonymisée) : délais moyens pour joindre un avocat par pays, langues les plus demandées, types de problèmes — **gold pour études** que la presse relaiera. **Valeur GEO : ++++**.
4. **Baromètre / sondages expatriés** (déjà en place d'après la mémoire projet). À publier annuellement. **Valeur GEO : ++++**.
5. **Positionnement unique** : « appel en < 5 min, 197 pays, 9 langues ». Phrase nommable par une IA. **Valeur GEO : +++**.
6. **Blog Laravel SEO-sain** (qui rank déjà). Base de départ pour la stratégie contenu. **Valeur GEO : +++**.
7. **Presse déjà initiée** (dossier de presse, communiqués). **Valeur GEO : +++**.

### 3.2 Passifs / risques à démanteler
1. **430 000 LP programmatiques** templatées. Dévaluées par Helpful Content + ignorées / méprisées par les LLMs. **Risque : ----**.
2. **Pages tags / galerie** à masse (`/ar-sa/alwusum/*`, `/fr-fr/galerie/*`). Zéro valeur LLM. **Risque : --**.
3. **Titles = slugs** sur certains articles (observé 2026-04-22). Signale au LLM un contenu peu soigné. **Risque : --**.
4. **Duplication cross-locale** (même article traduit via template dans 9 langues). Les LLMs détectent et pénalisent. **Risque : ---**.
5. **Absence d'auteurs nommés** sur beaucoup de pages. Pas d'E-E-A-T pour les LLMs. **Risque : ---**.
6. **Pas d'autorité reconnue** (pos 9,54 sur propre marque). **Risque : ---**.

---

## 4. Checklist stratégique — 10 chantiers GEO/AEO

### Chantier 1 — Audit des crawlers IA
1. Identifier dans `sos/cloudflare-worker/worker.js` comment sont gérés les UA suivants : `GPTBot`, `ChatGPT-User`, `OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`, `anthropic-ai`, `Google-Extended`, `Applebot-Extended`, `CCBot`, `FacebookBot`, `Bytespider`, `Amazonbot`.
2. Politique actuelle : bloqués, autorisés, SSR servi, cache servi ?
3. Vérifier `/robots.txt` : chaque UA IA a-t-il les permissions adaptées ?
4. Recommandation standard pour SOS-Expat :
   - `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended` : **autorisés** sur le contenu public (articles, profils, annuaire). Notre contenu a besoin d'être dans leur training + retrieval.
   - Bloqués sur : `/admin`, `/dashboard`, `/api`, zones utilisateur.
   - `Bytespider` (TikTok), `CCBot` (Common Crawl) : à arbitrer selon stratégie.
5. Ajouter `User-agent:` explicites dans robots.txt pour chaque IA bot.
6. Mesurer ensuite en logs Cloudflare : quelles IA crawlent réellement, à quelle fréquence, sur quelles URLs.

### Chantier 2 — Audit llms.txt
1. Récupérer le `llms.txt` actuel (`https://sos-expat.com/llms.txt`). Lire en entier.
2. Vérifier conformité au format émergent (spec https://llmstxt.org) :
   - H1 avec nom du projet/entité.
   - Blockquote avec description courte.
   - Sections par type de contenu avec liens.
   - Section « Optional » pour contenu secondaire.
3. Vérifier la pertinence : le fichier doit surfacer **le meilleur contenu pour qu'un LLM comprenne SOS-Expat**, pas 400k URLs.
4. Refonte proposée — structure cible :
   ```markdown
   # SOS-Expat
   
   > Plateforme de mise en relation en moins de 5 minutes avec des avocats
   > et experts locaux pour expatriés et voyageurs, dans 197 pays et 9 langues.
   
   ## Qui sommes-nous
   - [À propos](https://sos-expat.com/fr-fr/about)
   - [Comment ça marche](https://sos-expat.com/fr-fr/comment-ca-marche)
   - [Presse](https://sos-expat.com/fr-fr/presse)
   
   ## Données et études originales
   - [Baromètre SOS-Expat 2026](url)
   - [Grand sondage expatriés et voyageurs 2026](url)
   - [Indice du coût de l'assistance juridique par pays](url)
   
   ## Articles de référence
   - [Travailler en Thaïlande — guide pratique 2026](url)
   - ...
   
   ## Ressources pour journalistes
   - [Communiqués de presse](url)
   - [Dossier de presse](url)
   
   ## Optional
   - [Annuaire complet des prestataires](url)
   ```
5. Vérifier `ai.txt` également si présent.
6. Déployer + ping via Sitemap GSC + soumission à IndexNow.

### Chantier 3 — Citation rate dans les LLMs (baseline)
Construire la baseline 2026-04 pour mesurer la progression :

1. Lister 30 requêtes cibles business (ex. `avocat francophone Thaïlande urgence`, `aide juridique expatrié France`, `comment joindre un avocat à l'étranger en moins de 5 minutes`, `services pour expatriés français au Maroc`, `urgence juridique à Dubaï français`).
2. Pour chacune, interroger :
   - **ChatGPT** (mode web search + mode classique)
   - **Perplexity** (free + Pro)
   - **Claude** (avec search natif)
   - **Gemini**
   - **Google AI Overview** (désactiver historique, Chrome incognito, langue FR)
3. Noter : SOS-Expat cité ? Position dans les sources ? Quel extrait utilisé ? Quel concurrent cité à sa place ?
4. Tableau CSV : `requete,moteur_ia,sos_cite,position,extrait_utilise,concurrents_cites`.
5. Re-mesurer à J+90, J+180, J+360.

### Chantier 4 — Produire du first-party data publiable
Ce qui différenciera SOS-Expat des LP templatées : **données que personne d'autre n'a**.

Pistes à valider avec l'utilisateur :
1. **Baromètre SOS-Expat annuel** : synthèse des appels de l'année — top pays, top problèmes, délai moyen de résolution, langues les plus demandées. À publier mi-janvier chaque année.
2. **Indice du coût de l'assistance juridique expat** par pays : tarif moyen d'un avocat francophone. Actualisé trimestriellement.
3. **Cartographie des urgences les plus fréquentes** par pays (top 3) : outil gratuit + page dédiée par pays.
4. **Rapport « État de l'expatriation francophone »** : sondage 5 000+ répondants, publié annuellement, avec média associé (infographie, vidéo, podcast, conférence de presse).
5. **Observatoire légal par pays** : changements légaux pour expatriés, alimenté par le réseau d'avocats partenaires. Newsletter + page hub.
6. **Chaque donnée doit avoir** : page dédiée (longue, structurée, avec JSON-LD `Dataset` + `Article`), PDF téléchargeable, infographie shareable, communiqué de presse, pitch presse, version anglaise.

Chaque publication = 1 asset GEO majeur + potentiel de citation presse + backlinks + autorité.

### Chantier 5 — Expert-authored content (E-E-A-T renforcé)
1. Sur tous les contenus YMYL (juridique, santé, administratif, financier), ajouter :
   - **Auteur nommé** avec bio + photo + barreau/licence + profil LinkedIn.
   - **Reviewer juridique** (avocat senior du réseau) qui valide chaque article, daté.
   - **Disclaimer** : « Cet article ne remplace pas une consultation juridique. Pour votre cas spécifique, appelez un avocat partenaire. »
   - Schema.org `Article` avec `author` (Person schema), `reviewedBy`, `datePublished`, `dateModified`.
2. Créer une page auteur pour chaque expert récurrent, avec ses articles + bio + lien LinkedIn.
3. **Supprimer ou refondre** les articles sans auteur identifié.
4. Page « Comité éditorial » : gouvernance du contenu, processus de vérification, corrections.

### Chantier 6 — Contenu vidéo et voice
1. Identifier top 30 requêtes informationnelles business → créer un format vidéo court (1-3 min) par requête. YouTube + intégration sur la page correspondante.
2. Optimiser : title + description + chapters + transcript + schema `VideoObject`.
3. Schema `speakable` (CSS selectors) sur les réponses courtes des pages FAQ et articles. Rend le contenu éligible aux assistants vocaux (Alexa, Google Assistant).
4. Considérer un podcast court (5-10 min / épisode) sur les cas concrets d'expat. Distribution : YouTube, Spotify, Apple Podcasts.

### Chantier 7 — Entité reconnue (brand entity for AI)
Directement lié au chantier AE du v4, mais avec angle IA :

1. **Wikidata** : créer entrée SOS-Expat avec `P31` (instance of) = `Q22679358` (online platform) ou `Q9080` (company), `P112` (founder), `P1448` (official name), `P856` (official website), `P2002` (Twitter), etc.
2. Lier à entités existantes (avocat, expatrié, assistance juridique) pour être dans leur « cluster sémantique ».
3. **Wikipedia** : envisager entrée si critères d'admissibilité atteints (notoriété médiatique). Sinon, commencer par créer la densité presse nécessaire.
4. **Google Knowledge Graph** : conséquence de Wikidata + SameAs dans Organization JSON-LD + cohérence NAP.
5. **Mentions presse** cohérentes avec une notice de marque (logo, description, baseline).
6. **Citations académiques / secteur** : contacter écoles de droit, centres d'étude sur l'expatriation (CNRS, universités, think tanks), proposer partenariat data.

### Chantier 8 — Structured data dense et cohérente pour IA
Les LLMs exploitent massivement le structured data. À auditer + étendre :

1. **Organization** : complet avec `logo`, `sameAs` (tous réseaux), `founder`, `foundingDate`, `numberOfEmployees`, `areaServed`, `knowsLanguage`, `knowsAbout`, `contactPoint` avec `availableLanguage` et `contactType`.
2. **WebSite** : avec `SearchAction` (site-search in SERP).
3. **Service** / **LegalService** sur chaque page service : `provider`, `areaServed`, `availableChannel`, `hoursAvailable`, `offers` avec prix.
4. **Person** sur chaque profil prestataire : `jobTitle`, `worksFor`, `alumniOf`, `memberOf` (barreau), `hasCredential`, `speaks` (langues).
5. **Article** + **NewsArticle** sur blog avec `author`, `reviewedBy`, `wordCount`, `articleSection`, `citation` (quand applicable).
6. **Dataset** sur chaque publication de données propriétaires (baromètre, indice).
7. **Review** et **AggregateRating** uniquement quand vrais avis.
8. **BreadcrumbList** partout.
9. **FAQPage** sur pages FAQ (déjà en place, à étendre).
10. **HowTo** sur guides pratiques.
11. Tester chaque schema dans **Rich Results Test** + **Schema.org validator** + aperçu **Google URL Inspection**.

### Chantier 9 — Contenu : pivoter de la masse à la profondeur
1. Avec les sorties chantier AD v4 (pages faible valeur à désindexer), décider **quelles LP garder et muscler**, **lesquelles désindexer** (noindex + retrait sitemap).
2. Cible réaliste : passer de 430 k URLs programmatiques à **3 000-5 000 pages ultra-qualitatives** + **500-1 000 articles éditoriaux**.
3. Pour les pages gardées : passer de 300-500 mots à 1 500-3 000 mots avec angle unique, données propriétaires, auteur, dateModified récurrent.
4. Supprimer la duplication cross-locale par template : chaque locale doit avoir du contenu adapté culturellement, pas juste traduit.
5. Ajouter sur chaque page : témoignage client pertinent, citation d'un avocat partenaire, statistique propriétaire, CTA clair.

### Chantier 11 — Stratégie de transition du parc existant (**critique**)

Le parc actuel fait ~430 k URLs. Cible : 5 k à 10 k pages profondes + quelques assets premium. Le passage est **progressif, par vagues monitorées, pas brutal**.

#### 11.1 Critères de tri quantitatifs
Pour chaque URL du parc, collecter :
- Impressions GSC 90 j.
- Clics GSC 90 j.
- Position moyenne GSC sur queries utiles.
- Backlinks externes pointant vers l'URL (Ahrefs / Semrush).
- Liens internes entrants.
- Valeur business estimée (la page convertit-elle sur un appel ? via GA4 → Firestore events).
- Fraîcheur (`dateModified` récent ?).
- Longueur texte unique hors boilerplate.
- Originalité (% de contenu dupliqué cross-locale / cross-country via shingles).

Score composite (0-100) par URL :
- Impressions × 3 + Clics × 10 + Backlinks × 5 + Liens internes × 1 + Conversion × 20 + Fraîcheur × 2 + Longueur × 1 + Originalité × 2.

#### 11.2 Décision par segment de score

| Score | % estimé du parc | Décision |
|---|---|---|
| ≥ 50 | 1-3 % | **Garder + muscler** (auteur, data, 1500-3000 mots, video, JSON-LD dense) |
| 20-49 | 5-10 % | **Garder basique** (fix title, ajout auteur, dateModified) |
| 5-19 | 20-30 % | **Fusionner** avec page hub si pertinent, sinon `noindex, follow` + retrait sitemap |
| 0-4 | 60-70 % | **Désindexer** : `noindex, follow` + retrait sitemap, puis 410 Gone après 6 mois |

#### 11.3 Phasage de la transition

**Phase A (T1, mois 1-3) — Observer + Arrêter**
- Zéro désindexation. On **observe** d'abord.
- Arrêter tous pipelines de génération programmatique de nouvelles LP.
- Calculer le score composite sur l'intégralité du parc.

**Phase B (T2, mois 4-6) — Muscler les top 5 %**
- Enrichir les 5 000 pages top score.
- Publier le premier asset premium (Baromètre T1).
- Toujours pas de désindexation.

**Phase C (T3-T4, mois 7-12) — Désindexation par vagues**
- Vague 1 : 10 % du segment score 0-4 (les **pires**, aucun trafic depuis 180 j).
- Attendre 4 semaines, monitorer GSC, trafic organique total, impressions brand, impressions business.
- **Critère d'arrêt** : si le trafic baisse de > 10 % par rapport à la baseline, pause + investigation.
- Vague 2 : 20 % supplémentaire, même monitoring.
- Continuer par vagues de 20 % jusqu'à avoir nettoyé 60-70 % du parc.
- Conserver ~5-10 k URLs au total (score ≥ 20).

**Phase D (T5-T6, mois 13-18) — Finalisation + Assets**
- Vagues finales (410 Gone sur les pages désindexées il y a > 6 mois et jamais réutilisées).
- 1 asset premium tous les 2 mois en rythme de croisière.

#### 11.4 Technique des désindexations

| Cas | Action HTTP + meta |
|---|---|
| Page sans valeur, aucun backlink, aucun trafic | Étape 1 : `noindex, follow` + retrait sitemap. Étape 2 (après 6 mois) : 410 Gone. |
| Page avec backlinks externes mais faible valeur | 301 vers page équivalente ou hub. Préserve l'équité de lien. |
| Page avec trafic faible mais non-nul | Fusionner contenu avec page sœur plus forte, puis 301. |
| Page avec erreur technique (404 actuelle) | 410 Gone direct si contenu jamais eu de valeur. |
| Page doublon cross-locale | Garder 1 canonical, les autres pointent vers elle en canonical. |

Tout changement doit passer par un **staging + test URL Inspection GSC** avant déploiement massif.

#### 11.5 Monitoring de la transition
Dashboard avec, sur chaque vague :
- Pages désindexées (volume, % du parc).
- Impressions totales GSC (ne doit pas baisser sur queries business).
- Clics totaux GSC.
- Position moyenne sur queries brand et top business.
- 404 / 5xx ratio (doit rester stable).
- Temps de réponse moyen Googlebot.
- Pages indexées (doit baisser puis stabiliser — normal).

Objectif : le trafic organique doit **monter** pendant la transition (on libère le crawl budget, on concentre l'autorité, on réduit la duplication perçue par Google).

### Chantier 12 — Pièges à éviter (« what NOT to do »)

15 choses à ne JAMAIS faire dans ce pivot GEO/AEO :

1. **Ne pas désindexer 400 k pages en une nuit**. Monitoring obligatoire, par vagues.
2. **Ne pas générer du contenu IA sans revue humaine**. Google et les LLMs détectent le slop AI (AI generated content scale) et pénalisent.
3. **Ne pas créer de faux auteurs** (Persona IA avec photo générée). Risque légal + détectable par reverse image + détruit l'E-E-A-T dès que démasqué.
4. **Ne pas acheter des backlinks**. Google Penguin, détection systématique, désavantage long terme.
5. **Ne pas spammer Reddit, Quora, HackerNews** avec des liens vers soi. Contre-productif, bannissement, réputation détruite.
6. **Ne pas traduire automatiquement les assets premium** en 9 langues. Le LLM voit la duplication. Choisir 2-3 langues de qualité > 9 langues médiocres.
7. **Ne pas bourrer le JSON-LD** de données incohérentes avec le contenu visible. Google pénalise la sur-optimisation structured data.
8. **Ne pas mettre `noindex` partout par prudence**. Chaque noindex doit avoir une raison et être documentée.
9. **Ne pas bloquer les crawlers IA par défaut**. Bloquer GPTBot / ClaudeBot / PerplexityBot = se rendre invisible dans l'IA de demain. Sauf cas particuliers (propriété intellectuelle).
10. **Ne pas créer des assets premium sans plan de distribution**. Un baromètre non relayé presse = investissement brûlé.
11. **Ne pas empiler les outils SaaS SEO** avant d'avoir la baseline de mesure. Otterly + Peec + Semrush + Ahrefs + SE Ranking = 1500€/mois. Choisir 1-2 d'abord.
12. **Ne pas oublier Bing**. Bing alimente ChatGPT Search + Copilot. Un site invisible sur Bing sera invisible dans ces IA.
13. **Ne pas promettre de résultats 30 j à la direction**. Le GEO prend 3-9 mois pour des effets mesurables.
14. **Ne pas ignorer les hallucinations LLM**. Si ChatGPT dit « SOS-Expat est gratuit » ou « fondé en 2010 » (info fausse), il faut agir (voir Chantier 14).
15. **Ne pas violer le RGPD** en publiant des données first-party issues d'appels sans anonymisation rigoureuse (voir §5.bis).

### Chantier 13 — Analyse concurrentielle GEO

Avant de définir quoi produire, il faut savoir **qui est cité** actuellement par les IA sur tes requêtes cibles.

1. **Benchmark** : pour chacune des 30 requêtes business cibles (chantier 3), noter qui est cité par ChatGPT, Perplexity, Claude, Gemini, Google AIO.
2. Construire un **tableau concurrentiel** :

| Requête | Source #1 cité | Source #2 | Source #3 | Pourquoi ces sources ? |
|---|---|---|---|---|
| `avocat francophone Thaïlande urgence` | ? | ? | ? | ancien article, forum, gouvernement, site concurrent ? |
| `aide juridique expatrié France` | ? | ? | ? | ? |
| ... | | | | |

3. **Décoder les patterns** : les sources citées sont-elles majoritairement :
   - Sites gouvernementaux / officiels (ambassade, consulat, gouv.fr) ?
   - Sites de presse (Le Monde, Figaro, Le Point, expat-specific comme Expatis, Pink Guide) ?
   - Forums / communautés (Expat.com, Reddit r/expatFR, Le Forum de Bangkok) ?
   - Concurrents directs (JustAnswer, Avocat.fr, Village de la Justice) ?
   - Wikipedia ?
   - Blogs spécialisés (expat-assurance, le-blog-du-canard-expat) ?

4. **Identifier les formats gagnants** : articles longs avec TOC, études de cas, témoignages horodatés, données chiffrées, vidéos YouTube, PDF officiels ?

5. **Identifier le gap** : qu'est-ce que SOS-Expat peut produire de mieux / différent ? Axes candidats :
   - Offre unique (appel 5 min) pas positionnée dans les sources actuelles.
   - Réseau d'avocats vérifiés spécifiques.
   - Data propriétaire issue des appels (personne d'autre n'a ça).

6. **Plan d'attaque** : par requête, lister l'angle, le format, l'effort pour déclasser les sources actuelles.

### Chantier 10 — Mesure et itération
Dashboard à construire. Métriques par catégorie :

**Présence IA**
- Taux de citation ChatGPT sur 30 requêtes (baseline + évolution mensuelle).
- Taux de citation Perplexity / Claude / Gemini.
- Présence dans AIO Google (via Semrush AIO tracker ou SE Ranking).

**Autorité et entité**
- Entrée Wikidata créée ? Complétée à X % ?
- Knowledge Graph Google : Knowledge Panel apparent sur requête marque ?
- Backlinks entrants : nombre RD, qualité, évolution.
- Mentions marque (avec ou sans lien) : `"SOS-Expat"` en search Google + Bing.

**Contenu original**
- Nombre de publications first-party (baromètre, indice, rapport) par an.
- Reach presse par publication (combien d'articles relaient).
- Backlinks gagnés par publication.

**Engagement / trust**
- CTR moyen GSC sur requêtes brand.
- Position moyenne sur requêtes marque et top business.
- Temps moyen sur page, taux rebond (GA4).
- Ratio pages avec auteur nommé + reviewer / total pages YMYL.

**Performance SEO classique (rappel v4)**
- Pages indexées / découvertes.
- TTFB Googlebot.
- Core Web Vitals.

---

## 4.bis RGPD, légal, gestion des hallucinations IA

### 4.bis.1 First-party data et RGPD

La valeur de SOS-Expat dans l'ère IA repose en partie sur ses **données d'appels propriétaires** (qui appelle, pour quel motif, dans quel pays, résolu ou non, durée). Avant de publier quoi que ce soit :

1. **Anonymisation stricte** : aucun nom, aucun email, aucun téléphone, aucun numéro de dossier. Agrégats uniquement (minimum N=10 par segment publié).
2. **Base légale RGPD** : traitement statistique / recherche d'intérêt public. Article 89 RGPD. Mentionner dans la politique de confidentialité.
3. **Information des utilisateurs** : mettre à jour la politique de confidentialité pour mentionner l'usage statistique agrégé.
4. **Pas de données sensibles** dans les publications (santé, religion, orientation politique) sauf si strictement agrégé.
5. **Consentement renforcé** pour les témoignages nominatifs dans les assets premium. Contrat écrit.
6. **Revue juridique** de chaque publication first-party par un avocat (idéalement du réseau SOS-Expat).
7. **Consideration CNIL / DPC** : déclaration si nécessaire.
8. **Données transfrontalières** : attention si les données d'appels sont stockées aux US (Firestore nam7). SCC + privacy policy explicites.

Pas de publication first-party sans case cochée sur ces 8 points.

### 4.bis.2 Gestion des hallucinations LLM

Les LLMs affirment parfois des choses fausses sur les marques. Ex. « SOS-Expat est gratuit » (faux), « SOS-Expat a été fondé en 2010 » (à vérifier), « SOS-Expat ne couvre pas la Thaïlande » (faux).

Protocole en 4 étapes :

1. **Monitoring mensuel** sur 20 prompts types (« qu'est-ce que SOS-Expat ? », « SOS-Expat est-il fiable ? », « combien coûte SOS-Expat ? », « SOS-Expat couvre quels pays ? », sur chaque LLM). Capturer les hallucinations.
2. **Correction source** : s'assurer que la vraie info est bien présente, visible, structurée sur le site (page About + Organization JSON-LD + llms.txt).
3. **Feedback aux IA** :
   - ChatGPT : bouton thumbs-down + commentaire.
   - Perplexity : feedback direct.
   - Google AIO : lien de feedback sur chaque AIO.
4. **Correction externe** : si l'hallucination vient d'une source tierce (ex. Wikipedia périmé, ancien article presse), corriger la source.

Ne jamais tenter de « tromper » le LLM (prompt injection sur le site, contenu caché pour IA) — Anthropic et OpenAI détectent et pénalisent.

### 4.bis.3 Propriété intellectuelle et crawling

1. Si une donnée / étude est stratégique et tu ne veux pas qu'elle alimente le training IA : la mettre derrière un formulaire (le LLM ne la récupère pas lors du training).
2. Pour ce qui est public et destiné à citation : `Allow` dans robots.txt + présence dans llms.txt + structured data.
3. Si tu veux **contrôler l'usage commercial** de tes données par les IA : clauses de CGU claires + watermarking discret (ex. fausses entrées contrôlées dans un annuaire public que tu peux détecter dans les résultats LLM).

## 5. Roadmap 18 mois (découpage trimestriel)

### T1 — Fondations (mois 1-3)
**Priorité** : exécuter le plan v4 (réparer ce qui saigne), poser les bases GEO.

- Chantier 1 (crawlers IA) + Chantier 2 (llms.txt refondu) : S, 2-3 j.
- Chantier 3 (baseline citation IA sur 30 requêtes) : M, 1 sem.
- Chantier 8 (structured data dense) partie 1 — Organization, WebSite, BreadcrumbList globaux : M, 2-3 j.
- Chantier 7 (Wikidata création entrée) : S-M, 3-5 j.
- **Quick win à viser** : premières citations ChatGPT / Perplexity sur requêtes brand pures.

### T2 — Premier contenu original (mois 4-6)
- Chantier 4 : lancer le **Baromètre SOS-Expat 2026** (mi-janvier) et l'**Indice coût assistance juridique** (trimestriel). Effort L, 4-6 sem équipe data + presse.
- Chantier 5 (expert-authored) : faire passer les top 50 articles blog sous la nouvelle norme. Effort L.
- Chantier 8 partie 2 — Service / LegalService / Person sur pages principales. Effort M-L.
- Chantier 6 (vidéo) : produire 10 vidéos sur top requêtes. Effort L.
- **Quick win** : relai presse du Baromètre + 20-50 backlinks gagnés en une campagne.

### T3 — Pivot contenu (mois 7-9)
- Chantier 9 : ménage LP programmatiques massif. Passer 430k → 10k URLs. Effort XL.
- Chantier 5 : généraliser expert-authoring sur 200 articles. Effort L.
- Chantier 8 partie 3 — Dataset / Review / HowTo / FAQ étendu. Effort M.
- Chantier 7 : viser entrée Wikipedia si critères atteints.
- **Quick win** : amélioration mesurable ratio indexées / découvertes (chantier v4 §10).

### T4 — Autorité et presse (mois 10-12)
- Chantier 4 : Rapport « État de l'expatriation francophone » publié. Campagne presse. Effort XL.
- Chantier 7 : campagne de citations presse + universitaires. Objectif : 10 articles presse majeurs relayant SOS-Expat comme source.
- Chantier 10 : dashboard complet en place, itération mensuelle.
- **Quick win** : passer pos < 3 sur `sos expat` (brand propre), première AIO citation.

### T5-T6 — Scale et internationalisation (mois 13-18)
- Étendre pivot contenu aux 8 autres langues (EN d'abord, puis ES, DE, PT, puis AR, ZH, RU, HI).
- Partenariats presse internationaux (expat blogs, presse locale pays cibles).
- Deuxième édition Baromètre (effet cumulatif).
- Mesurer taux de citation IA : objectif × 10 vs baseline T1.
- Décision sur extension produit (podcast, app, conférences).

---

## 6. Gouvernance et équipes

| Chantier | Propriétaire probable | Compétences requises |
|---|---|---|
| 1 — Crawlers IA | Équipe infra + DevOps | Cloudflare, robots.txt |
| 2 — llms.txt | Équipe contenu + SEO | Rédaction, markdown |
| 3 — Citation rate baseline | SEO + data | Analyse manuelle ou outil tiers |
| 4 — First-party data | Data + presse + direction | Stats, journalisme, PR |
| 5 — Expert content | Contenu + juridique | Rédaction, revue juridique |
| 6 — Vidéo | Contenu + production externe ? | Tournage, montage, YouTube SEO |
| 7 — Entité | SEO + communication | Wikidata, Wikipedia, PR |
| 8 — Structured data | Dev (Laravel + React) | JSON-LD, schema.org |
| 9 — Pivot contenu | Contenu + SEO + dev | Éditorial, refonte, désindexation |
| 10 — Mesure | SEO + data | Dashboards, outils tiers |

Un audit GEO/AEO sans propriétaire nommé pour chaque chantier ne passera pas l'étape 2. **Insister explicitement dans le rapport final**.

---

## 6.bis Change management — Faire passer le pivot en interne

Un pivot éditorial qui coupe 85 % des pages ne passe pas sans résistance interne. Prévoir :

### 6.bis.1 Pitch direction
Argumentaire à construire :
- **Problème actuel chiffré** : 33 clics / 90 j malgré 2 601 pages indexées. 14 592 URLs jamais crawlées. Pos 9,54 sur propre marque.
- **Coût du statu quo** : marché IA génératif prend 20-40 % des recherches YMYL en 18 mois. Sans pivot, SOS-Expat devient invisible.
- **Opportunité** : 33 → 3000 clics en 18 mois réaliste si exécution correcte. ROI calculable (× conversion × panier moyen appel).
- **Réassurance** : on ne refait pas tout. On arrête + on muscle + on désindexe par vagues monitorées (sans chute trafic).

### 6.bis.2 Alignement équipe contenu
Si une équipe produit 40 articles par semaine en mode programmatique, leur dire « on stoppe » est un choc. Accompagnement :
- **Leur montrer les données** (GSC Performance : leurs articles ne ramènent pas de clic).
- **Repositionner vers la profondeur** : 2-4 articles par semaine, longs, avec auteur, data, review juridique. Valorisation individuelle > volume.
- **Former aux nouveaux formats** : écriture expert-authored, data visualization, interviews d'avocats.
- **Rémunération / objectifs** : passer de « nombre d'articles publiés » à « citations + backlinks + conversions ».

### 6.bis.3 Alignement équipe tech
- L'équipe Laravel (blog) = alliée naturelle (son code rank déjà).
- L'équipe React = à embarquer sur le fix SSR du v4.
- Côté DevOps : monitoring dashboard GEO + citations IA.

### 6.bis.4 Communication externe
- **Clients / prestataires** : pas impact direct. Pas besoin d'annonce.
- **Presse / partenaires** : communiquer sur les assets premium (Baromètre), pas sur la désindexation.
- **SEO community** : optionnel, peut servir l'entité (partager la démarche en conférence / blog technique).

### 6.bis.5 Jalons go/no-go
Après chaque phase de transition (§Chantier 11.3), un comité (direction + SEO + contenu + tech) valide :
- Les KPI de la phase précédente sont atteints.
- Pas de chute de trafic imprévue.
- Go / No-go pour la phase suivante.

Sans ce rituel, le pivot ne survivra pas aux 18 mois.

## 7. Outils recommandés

| Besoin | Outil | Coût indicatif |
|---|---|---|
| Tracking citation IA (ChatGPT, Perplexity, Gemini) | Otterly.ai, Peec.ai, AthenaHQ, Semrush AI Toolkit | 50-200 €/mois |
| AIO tracking | Semrush Position Tracking (AI Overview) ou SE Ranking | inclus suite |
| Structured data validation + monitoring | Schema App, Schema Markup Generator | gratuit / 50€/mois |
| Backlinks + mentions | Ahrefs / Semrush | 200-400 €/mois |
| Wikidata / Wikipedia | Manuel + Wikidata Query Service | gratuit |
| GSC + Bing Webmaster + Yandex | natif | gratuit |
| Data publication (PDF, infographies) | Canva Pro / Figma | 10-50 €/mois |
| Podcast / Vidéo hosting | YouTube + Spotify | gratuit |

Budget outils : **200-600 €/mois** réaliste pour cette stratégie. Budget contenu (équipe rédac + data + presse) : variable selon ambition, minimum 5-10 k€/mois pour viser le pivot.

---

## 8. Métriques de succès — Objectifs 18 mois

| Métrique | Aujourd'hui (2026-04) | T1 (3 mois) | T3 (9 mois) | T6 (18 mois) |
|---|---|---|---|---|
| Clics organiques Google / 90 j | 33 | 100 | 600 | 3 000+ |
| Position `sos expat` (brand) | 9,54 | < 5 | < 3 | 1-2 |
| Pages indexées | 2 601 | 3 500 | 8 000 | 15 000 |
| Ratio indexées / découvertes | 13 % | 25 % | 50 % | 70 %+ |
| Citations ChatGPT (30 queries) | baseline à mesurer | +50 % | × 3 | × 10 |
| Citations Perplexity (30 queries) | baseline | +50 % | × 3 | × 10 |
| Présence AIO Google | 0 | 2-5 % des queries | 15 % | 30-40 % |
| Wikidata entry | 0 | créée | complète | liée à ≥ 20 entités |
| Knowledge Panel Google (brand) | absent | partiel | présent basique | complet avec logo, description |
| Backlinks RefDomains (qualité) | à mesurer | +20 | +100 | +500 |
| Publications first-party | 0 | 1 (baromètre T1 ?) | 3 | 8+ |
| Top 10 AIO pour requêtes business | 0 | 0-2 | 5-10 | 20+ |

---

## 9. Livrables attendus

Rapport final structuré :

### 9.1 Diagnostic stratégique (2 pages)
- Position GEO/AEO actuelle de SOS-Expat (baseline chiffrée).
- Menaces principales (pages programmatiques à forte exposition dévaluation).
- Atouts sous-utilisés (data appels, profils, sondages).

### 9.2 Roadmap 18 mois détaillée
- Reprendre §5 en granularité fine : mois par mois, livrable par livrable, propriétaire.
- Dépendances inter-chantiers.
- Risques et plans B.

### 9.3 Plan d'exécution T1 (3 premiers mois)
- Semaine par semaine.
- Deliverables concrets.
- Budget estimé.

### 9.4 Baseline mesures (chantier 3 + chantier 10)
- Tableau citation IA sur 30 requêtes.
- Tableau AIO présence.
- Screenshots de référence.

### 9.5 Quick wins — 10 actions à exécuter dans les 2 semaines
Listés P0, avec propriétaire, effort, impact attendu.

---

## 10. Règles de travail

1. **Ne refais pas l'audit v4**. Consomme ses sorties.
2. **Chiffre tout**. Chaque recommandation doit avoir baseline + cible + temporalité.
3. **Chaque fix a un propriétaire nommé**.
4. **Français**. Dense. Pas de jargon inutile.
5. **Priorise par ROI GEO** : l'action qui amène le plus de citations IA / presse / autorité par euro investi d'abord.
6. **Vérifie par échantillonnage** : ne pas affirmer « ChatGPT ne cite pas SOS-Expat » sans tester 10 requêtes.
7. **Reviewer hostile** à la fin : pour chaque P0, défends ton choix face à un CMO hostile qui dit « c'est du vent, montre-moi le ROI ».
8. **Intègre la contrainte business** : SOS-Expat est un marketplace marketplace transactionnel, pas un média. Le contenu doit in fine amener à un appel payant.

---

## 11. Plan de démarrage

1. Lire le rapport de l'audit v4. En l'absence, demander.
2. Lire le code : `sos/cloudflare-worker/worker.js` (section crawlers bots), `sos/public/robots.txt`, `sos/public/llms.txt`.
3. Dresser la baseline chantier 3 (citation IA sur 30 requêtes). C'est la donnée de référence pour toute mesure future.
4. Exécuter les 10 chantiers §4, dans l'ordre d'efficacité business :
   - Vague 1 (fondations) : 1 → 2 → 8 partie 1 → 7 (Wikidata).
   - Vague 2 (premier contenu original) : 4 (Baromètre) → 5 (expert-authoring) → 8 partie 2.
   - Vague 3 (pivot) : 9 (ménage LP) → 6 (vidéo) → 8 partie 3.
   - Vague 4 (autorité) : 7 (campagne presse) → 10 (dashboard).
5. Livrer §9 avec rigueur.

Go.
