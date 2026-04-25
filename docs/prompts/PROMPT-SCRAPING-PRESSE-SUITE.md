# PROMPT — Suite scraping presse francophone + enrichissement Backlink Engine

## CONTEXTE

On a un système de scraping de contacts presse/journalistes/blogueurs réparti sur 2 VPS :

### Mission Control (MC) — VPS `95.216.179.163`
- **Projet** : `Mission_control_sos-expat` (local : `C:\Users\willi\Documents\Projets\VS_CODE\Outils_communication\Mission_control_sos-expat`)
- **Repo** : `will383842/Mission_control_sos-expat` (branche `master`)
- **CI/CD** : GitHub Actions auto-deploy sur push master → Docker rebuild sur VPS
- **Path VPS** : `/opt/influenceurs-tracker/`
- **Container app** : `inf-app` (512MB RAM — ATTENTION OOM si on charge trop en mémoire)
- **Container scraper** : `inf-scraper` (worker queue `scraper`)
- **Container DB** : `inf-postgres` (user: `inf_user` ou voir `.env.production`, DB: `mission_control`)
- **SSH** : `ssh -i ~/.ssh/id_ed25519 root@95.216.179.163`
- **Stack** : Laravel 12, PHP 8.2, Docker Compose, PostgreSQL, Redis

#### Tables clés MC :
- `influenceurs` : 7303 contacts (tous types : presse, ecole, avocat, ambassade, consulat, alliance_francaise, ufe, communaute_expat, influenceur, youtubeur, instagrammeur, blog, partenaire)
- `press_publications` : 670 publications presse (avec `authors_url`, `email_pattern`, `email_domain`)
- `press_contacts` : 2697 contacts presse extraits des publications (2416 avec email)

#### Enum ContactType (`app/Enums/ContactType.php`) :
ambassade, consulat, association, ecole, institut_culturel, chambre_commerce, alliance_francaise, ufe, presse, blog, podcast_radio, influenceur, youtubeur, instagrammeur, avocat, immobilier, assurance, banque_fintech, traducteur, agence_voyage, emploi, communaute_expat, groupe_whatsapp_telegram, coworking_coliving, logement, lieu_communautaire, backlink, annuaire, plateforme_nomad, partenaire

#### Services de scraping disponibles :
- `PressScraperService.php` : scrape les pages /equipe, /redaction, /contact, /mentions-legales
- `PublicationBylinesScraperService.php` : extrait les noms de journalistes depuis les bylines d'articles et pages d'auteurs
- `JournalistDirectoryScraperService.php` : scrape les annuaires de journalistes (annuaire.journaliste.fr, presselib.com)
- `BacklinkEngineWebhookService.php` : envoie les contacts au Backlink Engine via webhook POST
- `PressContactObserver.php` : sync automatique chaque nouveau PressContact vers BL Engine

#### Commandes artisan utiles :
```bash
docker exec inf-app php artisan press:import-publications     # Import 55 publications FR curées
docker exec inf-app php artisan press:import-full              # Import 100+ publications FR avec authors_url + email_pattern
docker exec inf-app php artisan press:import-francophone       # Import 600+ publications francophones mondiales
docker exec inf-app php artisan press:discover --category=all --scrape  # Découverte depuis Feedspot + scraping
docker exec inf-app php artisan backlink:resync --force        # Re-sync tous les contacts vers BL Engine (ATTENTION: utiliser chunk, OOM sinon)
docker exec inf-app php artisan youtube:scrape-francophones --region=all  # Scrape YouTubeurs (utilise Claude Haiku)
docker exec inf-app php artisan instagram:scrape-francophones  # Scrape Instagrammeurs (utilise Claude Haiku)
docker exec inf-app php artisan lawyers:scrape                 # Scrape avocats internationaux
docker exec inf-app php artisan jobs:import-worldwide          # Import sites d'emploi (NOUVEAU, pas encore lancé)
```

### Backlink Engine (BL) — VPS `204.168.180.175`
- **Path VPS** : `/opt/backlink-engine/`
- **Container app** : `bl-app`
- **Container DB** : `bl-postgres` (user: `backlink`, DB: `backlink_engine`)
- **Container Redis** : `bl-redis` (password: `redis_default_password`)
- **SSH** : `ssh -i ~/.ssh/id_ed25519 root@204.168.180.175`
- **Stack** : TypeScript, Fastify, Prisma, PostgreSQL, Redis, BullMQ
- **URL** : https://backlinks.life-expat.com

#### État actuel BL Engine (5282 prospects) :
```
Par catégorie :
  blogger     : 1942
  association : 1309
  media       : 1135
  corporate   : 774
  influencer  : 105
  other       : 17

Par type de contact :
  blog               : 1942
  presse             : 1135
  ecole              : 825
  partenaire         : 522
  association        : 312
  avocat             : 252
  alliance_francaise : 86
  influenceur        : 63
  youtubeur          : 41
  ufe                : 38
  ambassade          : 27
  communaute_expat   : 12
  consulat           : 9
  instagrammeur      : 1
```

#### Exploitabilité actuelle :
- 2563 prospects avec email vérifié (49%)
- 110 avec formulaire de contact uniquement
- **2255 prospects SANS email ni formulaire (43%) — à enrichir**

#### Webhook MC → BL :
- URL : `POST /api/webhooks/mission-control/contact-created`
- Auth : header `X-Webhook-Secret`
- Rate limit : **500/min** (augmenté depuis 100)
- Config MC : `.env.production` → `BACKLINK_ENGINE_WEBHOOK_URL` + `BACKLINK_ENGINE_WEBHOOK_SECRET`
- Le `CATEGORY_MAP` dans `/opt/backlink-engine/src/api/routes/webhooks.ts` mappe les types MC → catégories BL (ambassade→association, presse→media, blog→blogger, avocat→corporate, etc.)

#### ATTENTION — Contraintes techniques :
1. **OOM** : le container `inf-app` a 512MB RAM. Ne JAMAIS faire `Model::all()->get()` sur les grosses tables. Toujours utiliser `->chunk(30, function($chunk) { ... })` ou `DB::table()->chunk()`
2. **Rate limit webhook** : 500 req/min. Utiliser `usleep(500000)` (500ms) entre chaque envoi
3. **Redis idempotency** : le webhook BL Engine déduplique par email (cache 1h). Faire `docker exec bl-redis redis-cli -a redis_default_password FLUSHALL` pour reset
4. **CI/CD** : `git push origin master` → GitHub Actions → Docker build --no-cache (~5 min) → deploy. Vérifier avec `docker exec inf-app find /var/www/html/app/Console/Commands/ -name 'NomFichier.php'` que le fichier est dans le container

---

## CE QUI A ÉTÉ FAIT (session précédente)

1. ✅ Import 670 publications presse (442 France + 228 monde francophone)
2. ✅ Scraping 488 jobs terminés (team pages, bylines, annuaires)
3. ✅ Audit complet 5282 prospects BL Engine — ~2700 recatégorisations
4. ✅ Type `ambassade` créé dans MC (126 ambassades) + BL Engine
5. ✅ Resync MC → BL Engine (633 contacts envoyés)
6. ✅ Inférence emails par pattern (8 nouveaux)
7. ✅ Rate limit webhook augmenté 100→500/min
8. ✅ Nettoyage : 28 prospects junk supprimés, 147 langues corrigées, 236 pays corrigés

---

## CE QU'IL FAUT FAIRE MAINTENANT

### PRIORITÉ 1 — Scraper les journalistes individuels des grands médias FR

73 publications ont un `authors_url` ET un `email_pattern`. C'est LE plus gros levier. Chaque grand média a des dizaines/centaines de journalistes.

**Stratégie :**
1. Pour chaque publication avec `authors_url` : scraper la page d'auteurs pour extraire les noms de journalistes
2. Pour chaque nom trouvé : générer l'email avec le `email_pattern` (ex: `{first}.{last}@lemonde.fr`)
3. Sauvegarder dans `press_contacts`
4. Le `PressContactObserver` enverra automatiquement au BL Engine

**Publications prioritaires (les plus gros médias FR) :**
- Le Monde (`authors_url`: /journaliste/, pattern: `{first}.{last}@lemonde.fr`)
- Le Figaro (`/auteur/`, `{first}.{last}@lefigaro.fr`)
- Libération (`/auteurs/`, `{first}.{last}@liberation.fr`)
- 20 Minutes (`/auteurs/`, `{first}.{last}@20minutes.fr`)
- Le Parisien (`/auteur/`, `{first}.{last}@leparisien.fr`)
- BFM TV (`/mediaplayer/bio/`, `{first}.{last}@bfmtv.com`)
- France 24 (`/fr/liste/reporters/`, `{first}.{last}@france24.com`)
- RFI (`/fr/profil/`, `{first}.{last}@rfi.fr`)
- France Inter/Culture/Info (`/equipe`, `{first}.{last}@radiofrance.fr`)
- Les Échos, Capital, Challenges, Forbes FR, Maddyness, FrenchWeb, etc.

**Code du service existant** : `PublicationBylinesScraperService.php` — il a les sélecteurs CSS pour extraire les noms d'auteurs. Mais il n'inférait pas les emails automatiquement. Il faut ajouter l'inférence.

### PRIORITÉ 2 — Scraper les blogueurs voyage/expat francophones

Les 1942 bloggers dans le BL Engine n'ont que 23% d'emails. Il faut :
1. Activer l'enrichissement automatique du BL Engine (deep email scraping : 16 pages par prospect)
2. Le BL Engine enrichit à 10 prospects / 5 min, 24h/24 — mais il faut vérifier que le worker tourne

**Vérifier** : `docker exec bl-postgres psql -U backlink -d backlink_engine -c "SELECT status, count(*) FROM prospects WHERE category = 'blogger' GROUP BY status;"`

### PRIORITÉ 3 — Synchro finale MC → BL Engine

Après le scraping, re-synchroniser les nouveaux contacts :
```bash
# IMPORTANT : utiliser chunk pour éviter OOM
docker exec inf-app php artisan tinker --execute="
use App\Services\BacklinkEngineWebhookService;
\$junk = ['gmail.com','yahoo.com','hotmail.com','outlook.com','live.com','aol.com','free.fr','orange.fr','sfr.fr','wanadoo.fr','laposte.net','icloud.com','protonmail.com'];
DB::table('press_contacts')->whereNull('backlink_synced_at')->whereNotNull('email')->orderBy('id')->chunk(30, function(\$chunk) use (\$junk) {
  foreach(\$chunk as \$c) {
    \$d = strtolower(explode('@',\$c->email)[1] ?? '');
    if(in_array(\$d, \$junk)) continue;
    \$ok = BacklinkEngineWebhookService::sendContactCreated(['email'=>\$c->email,'name'=>\$c->full_name,'type'=>'presse','publication'=>\$c->publication,'country'=>\$c->country,'language'=>\$c->language,'source_url'=>\$c->source_url,'source_table'=>'press_contacts','source_id'=>\$c->id]);
    if(\$ok) DB::table('press_contacts')->where('id',\$c->id)->update(['backlink_synced_at'=>now()]);
    usleep(500000);
  }
});
"
```

### PRIORITÉ 4 — Vérifier la qualité

Après chaque batch de scraping, vérifier :
```bash
# MC
docker exec inf-app php artisan tinker --execute="
echo 'Press contacts: ' . App\Models\PressContact::count();
echo '\nAvec email: ' . App\Models\PressContact::whereNotNull('email')->count();
echo '\nNouveaux (1h): ' . App\Models\PressContact::where('created_at','>',now()->subHour())->count();
"

# BL Engine
docker exec bl-postgres psql -U backlink -d backlink_engine -c "
SELECT category, count(*) as total,
  count(*) FILTER (WHERE EXISTS (SELECT 1 FROM contacts c WHERE c.\"prospectId\" = p.id AND c.\"emailStatus\" = 'verified')) as verified
FROM prospects p GROUP BY category ORDER BY total DESC;
"
```

---

## OBJECTIF FINAL

Avoir une liste de **10 000+ contacts presse/journalistes/blogueurs francophones** avec emails vérifiés, parfaitement classés par :
- Type (presse, blog, youtubeur, influenceur, ambassade, consulat, etc.)
- Catégorie (media, blogger, association, corporate, influencer)
- Langue (fr principalement, mais aussi en, es, de pour les médias internationaux)
- Pays

Tous synchronisés dans le Backlink Engine pour enrichissement IA et campagnes email d'outreach.
