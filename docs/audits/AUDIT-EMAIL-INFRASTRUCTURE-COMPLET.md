# AUDIT EXHAUSTIF — INFRASTRUCTURE EMAIL SOS EXPAT / BACKLINK ENGINE

**Date audit** : 2026-04-11 12:30 UTC
**Auditeur** : Senior Deliverability & SMTP Infrastructure
**Mode** : Lecture seule, commandes réelles, aucune modification prod
**Périmètre** : 2 VPS Hetzner (204.168.180.175 + 204.168.254.60), 5 domaines, PMTA + Postfix + Dovecot + OpenDKIM + Mailflow + Backlink Engine + MailWizz

---

## NOTE DE SYNTHÈSE (10 lignes)

1. L'incident Spamhaus du 10 avril provient d'un **open relay PMTA** (`smtp-listener 204.168.180.175:2525` exposé publiquement) exploité par l'attaquant 102.36.228.189 pour relayer 7715 emails de phishing (spoof `support@metamask.io`) dont **659 ont été effectivement livrés** avant blocage des MX destinataires.
2. L'IP 204.168.180.175 est **toujours listée Spamhaus CSS** au moment de l'audit (confirmé par les rejets Outlook sur les 5 vmtas Mailflow ce matin à 10:12 UTC).
3. **Paradoxe grave** : Mailflow warmup est actif et génère 100 % de rejets sur Outlook.com — chaque tentative aggrave le signal négatif auprès de Microsoft. À couper d'urgence.
4. L'open relay est correctement fermé (PMTA bind 127.0.0.1 + 172.17.0.1, UFW deny 2525, attaquant banni).
5. Architecture prévue/réelle **incohérentes** : MailWizz est installé sur VPS2 (.60) mais non configuré (table `mw_delivery_server` inexistante, site en mode offline) ; Backlink Engine pointe vers `172.17.0.1:10025` qui **n'existe pas** (Postfix écoute 587, PMTA 2525) — BL Engine n'a donc **jamais envoyé un email** (`sent_emails` = 0 lignes).
6. **DKIM OK** : clés déployées dans `/home/pmta/conf/mail/<domain>/dkim.pem`, publiées sous sélecteur `dkim._domainkey` pour les 5 domaines, SPF `-all` pointe sur .175.
7. **VPS2 sans firewall** : `ufw status = inactive` — trou de sécurité majeur (MySQL/Redis écoutent sur loopback uniquement, OK, mais SSH non protégé par UFW).
8. **Hostnames Hetzner inversés** : VPS1 .175 = "Mailwizz-email-engine" (exécute PMTA+Postfix+BL Engine), VPS2 .60 = "pmta-engine-1" (exécute MailWizz). Source de confusion opérationnelle permanente.
9. **Monitoring** opérationnel (9 scripts + 13 crons + alertes Telegram) — script `check-spamhaus-via-microsoft.sh` fiable et confirme le listing en continu.
10. **Verdict** : **STOP envois total** jusqu'au delisting Spamhaus ST6726822 + 48 h de stabilité + exécution Phase 0 de hardening.

**Score global infrastructure : 42 / 100**
**Décision : STOP — aucune reprise avant Phase 0 exécutée + delisting confirmé.**

---

## PARTIE 1 — RÉSUMÉ EXÉCUTIF

### Top 3 risques CRITIQUES

| # | Risque | Impact | Preuve |
|---|--------|--------|--------|
| 1 | **Mailflow warmup actif pendant listing Spamhaus** — génère 100 % rejets Outlook, accumule signaux négatifs Microsoft/Spamhaus | Ré-listing quasi-certain après delisting | `acct-2026-04-11-0000.csv` : 5 tentatives à 10:12/10:19/10:19/10:20/10:21 UTC, toutes `550 5.7.1 blocked using Spamhaus` |
| 2 | **VPS2 (.60) UFW inactive** — SSH + services exposés sans firewall L3 | Compromission possible du serveur MailWizz | `ssh root@.60 "ufw status" → inactive` |
| 3 | **Backlink Engine SMTP_PORT=10025 inexistant** — aucun envoi possible, config fausse depuis le début | Silencieux : code fonctionne en apparence mais 0 mail envoyé | `docker exec bl-app env \| grep SMTP` → `SMTP_PORT=10025` ; `ss -tln` ne montre aucun listener sur 10025 |

### Top 3 quick wins

1. **Arrêter Mailflow warmup** sur les 5 inboxes maintenant (pauser les 5 tickets + `iptables -I OUTPUT -d mailflow-io.mail.protection.outlook.com -j DROP` en backup) — effort : 5 min.
2. **Activer UFW sur VPS2** avec règles minimales (22/80/443) — effort : 2 min.
3. **Corriger `SMTP_PORT=2525` + `SMTP_HOST=172.17.0.1` dans BL Engine** (PMTA local) — effort : 10 min (modifier .env + `docker compose restart bl-app`).

### Verdict GO/STOP

**STOP**. Aucun envoi de campagne jusqu'à :
- [ ] Delisting Spamhaus ST6726822 **confirmé** par `check-spamhaus-via-microsoft.sh` (état `clean` pendant 48 h)
- [ ] Phase 0 hardening complète (voir Partie 7)
- [ ] Warmup Mailflow arrêté pendant la période de listing
- [ ] Plan de ramp Phase 1..4 accepté

---

## PARTIE 2 — POINTS POSITIFS

| # | Point | Preuve (commande + output) | Impact |
|---|-------|-----------------------------|--------|
| P1 | **Open relay fermé** | `grep smtp-listener /etc/pmta/config` → `127.0.0.1:2525` + `172.17.0.1:2525` + commentaire `# REMOVED (open relay fix): smtp-listener 204.168.180.175:2525` | Cause racine colmatée |
| P2 | **Attaquant banni UFW** | `ufw status` → règle `DENY IN 102.36.228.189 # ATTACKER IP` | Défense en profondeur |
| P3 | **Port 2525 bloqué UFW** | `ufw status` → `2525 DENY IN Anywhere # PMTA — NEVER expose, was open relay` | Protection externe même si PMTA mal configuré |
| P4 | **DKIM correctement publié** | `dig TXT dkim._domainkey.hub-travelers.com` → `v=DKIM1; k=rsa; p=MIIBI...` (5/5 domaines OK) | Authentification email intacte |
| P5 | **SPF strict sur 5 domaines** | `dig TXT hub-travelers.com` → `v=spf1 ip4:204.168.180.175 -all` (5/5) | SPF hard fail (-all), bonne hygiène |
| P6 | **DMARC p=quarantine sur 5 domaines** | `dig TXT _dmarc.hub-travelers.com` → `v=DMARC1; p=quarantine; rua=...` | Politique conforme, permet ramp vers reject |
| P7 | **Certs Let's Encrypt valides** | `openssl x509 -in .../cert.pem -noout -enddate` → `Jul 9 12:37:47 2026 GMT` (5/5) | 90 jours de marge, renewal auto certbot |
| P8 | **SNI map Postfix correct** | `cat /etc/postfix/sni_map` → 5 entrées `mail.<domain>` avec privkey/fullchain Let's Encrypt | STARTTLS propre par domaine sur 587 |
| P9 | **OpenDKIM opérationnel** | signing.table + key.table référencent les 5 PEM présentes dans `/home/pmta/conf/mail/<d>/dkim.pem` mode 600 owner `opendkim` | Double protection DKIM (Postfix + PMTA) |
| P10 | **Pattern-list PMTA par domaine sender** | `/etc/pmta/config` lignes 120-127 : `mail-from /.*@hub-travelers\.com/ virtual-mta=vmta-hub` etc. | Routing DKIM cohérent sender↔vmta |
| P11 | **vmta-hub en mode rehab** (5 msg/h) | `/etc/pmta/config` : `<virtual-mta vmta-hub>` avec `max-msg-rate 5/h`, commentaire `REHABILITATION MODE` | Isolation du domaine compromis |
| P12 | **Postfix `relayhost = [127.0.0.1]:2525`** | `postconf -n \| grep relayhost` | Tout sort via PMTA (DKIM + rate limiting) |
| P13 | **Monitoring Telegram opérationnel** | 13 crons dans `/etc/cron.d/`, 9 scripts sous `/opt/mail-security/`, state files sous `/var/lib/mail-security/` | Détection rapide validée live (`spamhaus-state=listed`) |
| P14 | **fail2ban actif sshd** | `fail2ban-client status sshd` → 76 IPs bannies, 576 tentatives | Brute force SSH contenu |
| P15 | **Backup BL Engine quotidien** | `crontab -l` → `0 3 * * * /opt/backups/backup-bl-engine.sh` | Restauration possible |
| P16 | **Containers BL Engine healthy** | `docker ps` → `bl-app`, `bl-postgres`, `bl-redis` tous `Up (healthy)` | Stack applicative saine |
| P17 | **Let's Encrypt renewal auto** | `/etc/cron.d/certbot` présent | 0 maintenance TLS |
| P18 | **Source restriction PMTA stricte** | `<source 127.0.0.1>` + `<source 172.17.0.0/16>` avec `pattern-list sender-domains` | Sender domain whitelist appliquée en local |
| P19 | **5 vmtas + pool outreach + pool rehab** | `/etc/pmta/config` | Architecture snowshoe correcte post-incident |
| P20 | **5 inboxes presse-* Unix users créés** (uid 1001-1005, `/usr/sbin/nologin`) | `getent passwd \| grep presse` | Séparation privilèges correcte |

---

## PARTIE 3 — POINTS NÉGATIFS

| # | Grav | Point | Preuve | Impact |
|---|------|-------|--------|--------|
| N1 | **CRITIQUE** | **Mailflow warmup actif pendant listing** — les 5 inboxes presse@* envoient vers `noreply@mailflow.io` / `autowarmer@mailflow.io` et se font rejeter 100 % par Outlook | `cat /var/log/pmta/acct-2026-04-11-0000.csv` : 5 lignes à 10:12-10:21 UTC, toutes `failed` avec `550 5.7.1 blocked using Spamhaus` | Chaque rejet Outlook est un signal négatif supplémentaire au reputation engine Microsoft qui nourrit Spamhaus. Re-listing quasi-certain après delisting. |
| N2 | **CRITIQUE** | **VPS2 UFW inactive** | `ssh root@.60 "ufw status"` → `Status: inactive` | SSH non protégé par L3 firewall. Seul nginx/80 écoute publiquement, mais surface d'attaque SSH exposée. |
| N3 | **CRITIQUE** | **BL Engine SMTP_PORT=10025 invalide** | `docker exec bl-app env \| grep SMTP` → `SMTP_HOST=172.17.0.1 SMTP_PORT=10025` ; `ss -tln \| grep 10025` → rien | BL Engine ne peut envoyer aucun email. `sent_emails` = 0 lignes confirmé. Scraping/enrichment fonctionne (5294 prospects) mais couche envoi en silence total. |
| N4 | **HAUT** | **MailWizz non installé / non configuré** | `docker exec mw-mysql mysql -uroot -p mailwizz -e "SHOW TABLES"` → `Table 'mailwizz.mw_delivery_server' doesn't exist` ; `curl http://204.168.254.60/` → `302 → /site/offline` | VPS2 paie une VM Hetzner pour rien. Architecture MW↔PMTA inexistante. |
| N5 | **HAUT** | **PTR VPS2 générique** | `dig -x 204.168.254.60` → `static.60.254.168.204.clients.your-server.de.` | Si on décide d'envoyer depuis .60, PTR non forward-confirmed → SPF/rDNS check échouera partout. |
| N6 | **HAUT** | **MX priority 0** sur hub-travelers.com et plane-liberty.com | `dig MX hub-travelers.com` → `0 mail.hub-travelers.com.` | Non conforme (10 standard). Certains relais peuvent rejeter. 3 autres domaines à priority 10. |
| N7 | **HAUT** | **Logs monitoring vides** | `wc -l /var/log/mail-security.log /var/log/mail-forwarder-*.log` → 0/0/0 | `monitor.sh`, `forward-presse-mailboxes.py`, `forward-admin-providers.py` programmés en cron mais **n'ont jamais produit une ligne de log** — soit jamais exécutés (cron mis en place aujourd'hui), soit ils échouent silencieusement. À tester manuellement. |
| N8 | **HAUT** | **Postfix `mail.log` absent** | `ls /var/log/mail*` → aucun mail.log / mail.err / mail.info | rsyslog ne log plus le canal mail. Impossible de faire forensics SASL/submission. À corriger dans `/etc/rsyslog.d/50-default.conf`. |
| N9 | **HAUT** | **Attaquant a livré 659 emails (dsnAction=relayed)** avant blocage MX | `awk -F, '$7=="relayed"' acct-2026-04-10-0000.csv \| wc -l` → 659 | 659 emails de phishing `support@metamask.io` partis depuis 204.168.180.175 → signaux abuse reports accumulés chez gmail/yahoo/hotmail. Re-listing probable même après delisting CSS si d'autres BL se déclenchent ultérieurement. |
| N10 | **HAUT** | **Disque VPS1 à 85 %** | `df -h /` → `61G/75G 85%` | 12 Go restants. PMTA acct.csv + BL Engine logs + PG peuvent saturer vite. |
| N11 | **MOYEN** | **Spamhaus listing actif confirmé** | `bash /opt/mail-security/check-spamhaus-via-microsoft.sh ; cat spamhaus-state` → `listed` ; log : échantillons à 11:26, 11:30, 11:37, 12:00, 12:29 UTC tous `listed` | Source unique de vérité (Outlook:25). Listing continu depuis au moins 11:26 UTC ce matin. |
| N12 | **MOYEN** | **Hostnames Hetzner inversés** → confusion opérationnelle | .175 `hostname`=`Mailwizz-email-engine` exécute PMTA+Postfix+BL Engine ; .60 `hostname`=`pmta-engine-1` exécute MailWizz | Erreurs commandes/docs récurrentes. |
| N13 | **MOYEN** | **Rotation log PMTA non configurée pour `acct.csv`** | `/etc/pmta/config` : seul `diag.csv` a `move-interval 1d delete-after 30d`, pas `acct.csv` | Saturation disque possible. |
| N14 | **MOYEN** | **Mailflow = Microsoft derrière** | `dsnMta = mailflow-io.mail.protection.outlook.com` | Warmup 100 % dépendant de la réputation Microsoft — précisément ce qui nous bloque. Warmup inutile en période de listing. |
| N15 | **MOYEN** | **`Unable to parse serial number: number missing`** répété dans /var/log/pmta/log toutes les ~10 min | `tail /var/log/pmta/log` | Non bloquant mais pollue les logs. Probablement cert TLS ou licence PMTA. |
| N16 | **MOYEN** | **IPv6 non publié en SPF** | `dig TXT hub-travelers.com` → `ip4:204.168.180.175 -all` (pas d'ip6) | Si envoi accidentel via IPv6, SPF échoue. Mineur car Postfix bind 127.0.0.1. |
| N17 | **MOYEN** | **Pas de sieve Dovecot** | `doveconf -n \| grep protocols` → `imap lmtp` | Pas de filtrage spam/autoreply automatique côté user. |
| N18 | **MOYEN** | **Pas de validation automatique DKIM pass** | N/A | Aucun test pipeline `check-auth@verifier.port25.com` avant envoi. |
| N19 | **BAS** | **`spaceship.com` résiduel dans `/home/pmta/conf/mail/`** sans clé dkim.pem | `ls /home/pmta/conf/mail/` | Artefact ancien test. |
| N20 | **BAS** | **fail2ban sans jail `pmta-auth`** | `fail2ban-client status` → 4 jails (dovecot, postfix, postfix-sasl, sshd) | Si brute-force auth PMTA (`outreach@sos-expat.com`), aucune protection. |

---

## PARTIE 4 — INCOHÉRENCES PRÉVU vs RÉEL

| # | Prévu | Réel | Sévérité |
|---|-------|------|----------|
| I1 | VPS1 = envoi (PMTA + Postfix + Dovecot + BL Engine) | ✅ conforme + nginx sert aussi `backlinks.life-expat.com` frontend | OK |
| I2 | VPS2 = MailWizz connecté à PMTA sur VPS1 | ❌ MailWizz installé mais **pas initialisé** (DB mailwizz vide, site offline). Aucune connexion sortante de .60 vers .175. | HAUT |
| I3 | 5 inboxes presse@* warmup via Mailflow | ⚠️ Inboxes créées, Dovecot/Postfix/DKIM OK, **mais** warmup tourne **pendant listing Spamhaus** → 100 % rejets | CRITIQUE |
| I4 | Backlink Engine envoie via PMTA (172.17.0.1:2525) | ❌ Configuré pour `172.17.0.1:10025` qui n'existe pas. `sent_emails=0`. | CRITIQUE |
| I5 | 5 vmtas PMTA round-robin | ✅ Présents + pool `outreach-pool` (4 sans hub) + pool `rehab-hub-pool` dédié | OK |
| I6 | Hostnames cohérents avec rôle | ❌ Inversés | MOYEN |
| I7 | "Email Engine prêt à 92 %" | ❌ BL Engine scraping OK, envoi = 0 ligne en base | HAUT |
| I8 | Mailflow warmup = bonne pratique | ⚠️ Oui normalement, contre-productif pendant listing | CRITIQUE |
| I9 | "IP delisted/relisted" (perception) | ❌ Listing continu depuis ce matin, jamais delisted | MOYEN |
| I10 | PowerMTA sur VPS2 | ❌ Aucun binaire PMTA installé sur .60 | MOYEN |

---

## PARTIE 5 — ANALYSE LISTING SPAMHAUS

### 5.1 Cause racine

**Open relay PMTA exposé publiquement**. Config antérieure au 10 avril :

```
smtp-listener 204.168.180.175:2525   # exposé de facto sur IP publique
```

combiné à une source permissive ou absence de `require-auth`. UFW n'avait pas de règle `DENY IN 2525` avant l'incident. L'attaquant 102.36.228.189 a donc pu :
- se connecter en SMTP clair sur 204.168.180.175:2525
- soumettre 7715 messages en 24 h avec `MAIL FROM: support@metamask.io`
- routés via le fallback du pattern-list (`mail-from // virtual-mta=vmta-hub`)
- PMTA a DKIM-signé tous les messages avec la clé `hub-travelers.com` (!)
- envoi depuis 204.168.180.175 vers des milliers de destinataires

**Preuve forensics** (acct-2026-04-10-0000.csv) :
- `srcType=smtp`, `srcMta=[102.36.228.189] (102.36.228.189)`
- `orig=support@metamask.io`
- `dlvSourceIp=204.168.180.175`
- 7055 `failed` (bloqués par MX distants), 659 `relayed` (livrés avec succès)
- Exemple rejet : `smtp;554 Blocked - see https://ipcheck.proofpoint.com/?ip=204.168.180.175`

### 5.2 Chronologie

| Date/heure UTC | Événement |
|----------------|-----------|
| 2026-04-09 00:00 | Début exploitation open relay (6551 lignes dans acct-2026-04-09) |
| 2026-04-10 matin | Volume anormal, Proofpoint et Microsoft rejettent en masse |
| 2026-04-10 ~13:00 | Spamhaus CSS listing actif |
| 2026-04-10 13:38-13:49 | Postfix restart en chaîne, config PMTA corrigée (`127.0.0.1:2525 + 172.17.0.1:2525`) |
| 2026-04-10 13:50 | `LOCKDOWN_TIME` dans monitor.sh |
| 2026-04-10 | Ticket Spamhaus ST6726822 créé, vmta-hub rehab 5/h, attaquant banni UFW |
| 2026-04-11 10:12-10:21 | Mailflow warmup reprend, 5/5 tentatives rejetées par Outlook (Spamhaus) |
| 2026-04-11 11:26-12:29 | `check-spamhaus-via-microsoft.sh` confirme `listed` à chaque cycle |

### 5.3 Sous-listing et BL vérifiées

- **Spamhaus CSS (Composite Snowshoe)** : CONFIRMÉ (rejets Outlook literal `blocked using Spamhaus`)
- **Microsoft SmartScreen** : CONFIRMÉ (rejets depuis `*.protection.outlook.com`)
- **Proofpoint** : CONFIRMÉ pour les tentatives 10 avril (`smtp;554 Blocked - see https://ipcheck.proofpoint.com/?ip=204.168.180.175`)
- **Barracuda/SpamCop/SORBS** : non vérifiables depuis les VPS (DNS via Cloudflare bloqué comme open resolver). À vérifier via mxtoolbox.com depuis un poste externe
- **DBL/SURBL/URIBL pour les 5 domaines** : à vérifier manuellement

### 5.4 Ticket Spamhaus ST6726822

- **État déclaré** : en attente de review humaine
- **ETA typique** : 24-72 h (Spamhaus ne traite pas 24/7)
- **Risques re-listing post-delisting** :
  - Mailflow warmup continue à générer rejets Microsoft → **TRÈS HAUT**
  - 659 emails de phishing déjà livrés peuvent générer feedback loop tardif → **moyen**
  - Nouvelle exploitation de l'infra → **faible** (open relay colmaté, UFW strict, attaquant banni)
  - BL Engine envoyant en volume sur IP froide post-listing → **moyen** (pas de warmup réel)

### 5.5 Cohérence déclaration vs réalité

| Déclaration | Réalité |
|-------------|---------|
| "Open relay fermé 10 avril ~17h" | ✅ Confirmé (config + logs Postfix) |
| "hub-travelers.com en mode rehab" | ✅ Confirmé (`max-msg-rate 5/h`) |
| "Mailflow auto-warmer activé, 5 tickets" | ✅ Confirmé **mais contre-productif** |
| "IP delisted/relisted" | ❌ Listing CONTINU, jamais delisted |
| "Email Engine prêt à 92 %" | ❌ Envoi BL Engine non-fonctionnel + MailWizz non-init |

---

## PARTIE 6 — RECOMMANDATIONS PRIORISÉES

### P0 — Maintenant (avant toute reprise)

**R1. Arrêter le warmup Mailflow immédiatement**
- Pourquoi : chaque rejet Outlook nourrit négativement le reputation score Microsoft pendant le listing
- Comment : pauser les 5 tickets Mailflow côté UI + `iptables -I OUTPUT -d <mailflow-outlook-mx> -j DROP` en backup
- Effort : 5 min
- Risque si non fait : re-listing quasi-certain après delisting

**R2. Activer UFW sur VPS2**
```bash
ssh root@204.168.254.60 'ufw default deny incoming; ufw default allow outgoing; ufw allow 22/tcp; ufw allow 80/tcp; ufw allow 443/tcp; ufw --force enable'
```
- Effort : 2 min

**R3. Corriger `SMTP_PORT` BL Engine**
- Actuel : `172.17.0.1:10025` (n'existe pas)
- Cible : `172.17.0.1:2525` (PMTA local, source restriction 172.17.0.0/16 déjà OK)
- Modifier `/opt/backlink-engine/.env` puis `docker compose restart bl-app`
- Utiliser sender sur domaine non-hub (providers-expat.com) pour ne pas toucher vmta-hub
- Effort : 10 min

**R4. Renommer les VPS**
```bash
ssh root@204.168.180.175 'hostnamectl set-hostname sos-mail-sender'
ssh root@204.168.254.60   'hostnamectl set-hostname sos-mailwizz'
```
+ mettre à jour le panneau Hetzner
- Effort : 5 min

**R5. Corriger MX priority** de hub-travelers.com et plane-liberty.com (0 → 10) chez le registrar DNS — Effort : 5 min

**R6. Verrouiller Postfix IPv4 uniquement**
```
# /etc/postfix/main.cf
inet_protocols = ipv4
smtp_address_preference = ipv4
```
+ `postfix reload` — Effort : 2 min

**R7. Activer rotation `acct.csv` PMTA**
```
<acct-file /var/log/pmta/acct.csv>
    move-interval 1d
    delete-after 30d
    max-size 50M
</acct-file>
```
+ reload PMTA — Effort : 2 min

**R8. Réactiver logging Postfix (mail.log)**
```
# /etc/rsyslog.d/50-default.conf — dé-commenter :
mail.*   -/var/log/mail.log
```
puis `systemctl restart rsyslog` — Effort : 2 min
- Risque si non fait : impossible de débugger SASL / submission, incident sans forensics

**R9. Ajouter jail fail2ban `pmta-auth`** (détecte brute-force SMTP-auth sur 587 et HTTP mgmt PMTA) — Effort : 20 min

**R10. Nettoyer `spaceship.com` dans `/home/pmta/conf/mail/`** — Effort : 1 min

**R11. Tester manuellement les scripts monitoring qui n'ont jamais loggé**
```bash
bash /opt/mail-security/monitor.sh
python3 /opt/mail-forwarder/forward-presse-mailboxes.py
python3 /opt/mail-forwarder/forward-admin-providers.py
```
et corriger les bugs détectés. — Effort : 30 min

### P1 — Avant Phase 2 (démarrage doux, J+10)

**R12. Installer MailWizz OU le supprimer** — Effort : 2 h si install ; 10 min si suppression
**R13. Forward-confirmed rDNS VPS2** (si on y envoie) — Effort : 15 min via panneau Hetzner
**R14. Créer clé DKIM2 de rotation** (`dkim2._domainkey`) par domaine — Effort : 30 min
**R15. Sieve + autoreply** sur les 5 inboxes presse — Effort : 1 h
**R16. Monitoring disque VPS1** (alerte < 10 Go) — Effort : 10 min (script S3 ci-dessous)

### P2 — Avant Phase 3 (ramp, J+17)

**R17. Segmenter BL Engine** : un sender pour outreach cold, un pour transactional/replies. Pools PMTA distincts.
**R18. Intégrer gmass.co / mail-tester.com** en smoke test automatique pré-campagne
**R19. Feedback Loops inscriptions** : Microsoft SNDS, Google Postmaster Tools, Yahoo FBL

### P3 — Amélioration continue

**R20. `docs/email-architecture.md`** dans le repo principal
**R21. Migrer secrets PMTA auth, MW root, MW mailwizz dans un vault** (actuellement en clair dans docker-compose.yml VPS2)

---

## PARTIE 7 — PLAN D'IMPLÉMENTATION

### Phase 0 — MAINTENANT (aucun envoi)

| # | Tâche | Durée | Statut |
|---|-------|-------|--------|
| R1 | Stop Mailflow warmup | 5 min | À faire |
| R2 | UFW VPS2 | 2 min | À faire |
| R3 | Fix SMTP_PORT BL Engine | 10 min | À faire |
| R4 | Rename hostnames | 5 min | À faire |
| R5 | Fix MX priority | 5 min | À faire |
| R6 | Postfix IPv4 only | 2 min | À faire |
| R7 | Rotation acct.csv | 2 min | À faire |
| R8 | Postfix mail.log | 2 min | À faire |
| R9 | fail2ban pmta-auth | 20 min | À faire |
| R10 | Cleanup spaceship | 1 min | À faire |
| R11 | Test manuel scripts monitoring | 30 min | À faire |
| — | Attendre delisting ST6726822 | 24-72 h | En cours |
| — | Vérifier state `clean` pendant 48 h | 48 h | Après delisting |

**Critère GO Phase 1** : `cat /var/lib/mail-security/spamhaus-state` = `clean` pendant 48 h consécutives ET `microsoft-state` = `clean`.

### Phase 1 — J+0..J+10 : Warmup Mailflow bas régime

- Réactiver Mailflow warmup sur **1 seule inbox** : `presse@providers-expat.com` (vmta-provider, pas hub)
- Volume cible : 10 emails/j à J+0 → 50/j à J+10
- Monitoring : `check-spamhaus-via-microsoft.sh` toutes les 15 min, alerte Telegram immédiate si `listed`
- Kill switch : bounce rate > 5 % → STOP retour Phase 0
- Les 4 autres inboxes restent en attente
- vmta-hub reste en rehab 5/h, aucun cold

### Phase 2 — J+10..J+17 : Démarrage doux BL Engine

- BL Engine outreach : **20 emails/j** sur vmta-provider uniquement
- Sender : `outreach@providers-expat.com` (pas `@hub-travelers.com`)
- Cibles : prospects tier 1-2 uniquement dans la DB (qualité max)
- Monitoring : `alert-bounce-rate.sh` seuil 3 %, `alert-smtp-rejects.sh` seuil 5 %
- Réactiver Mailflow sur les 3 autres inboxes (sauf hub) à 20/j
- Daily report Telegram obligatoire

### Phase 3 — J+17..J+30 : Ramp progressif

- Volume BL Engine : 20 → 50 → 100 → 200/j (+50 par palier de 48 h si bounce stable)
- Ajout graduel des vmtas plane, emilia, planevilain au pool outreach
- vmta-hub ne ramp qu'après 30 j sans incident
- Feedback Loops actifs (R19)
- Cibles : bounce < 2 %, complaint < 0.1 %

### Phase 4 — J+30+ : Volume normal

- Max 1000/j/vmta, 5000/j total
- Réintégration progressive vmta-hub : 5/h → 50/h → 200/h sur 14 jours
- Review mensuelle : Google Postmaster, SNDS, mail-tester
- Pattern snowshoe : volume équilibré entre les 5 vmtas

### Roadmap ASCII

```
J+0          J+10         J+17         J+30          J+60
 │            │            │            │             │
 ▼            ▼            ▼            ▼             ▼
[Phase 0]══▶[Phase 1]═══▶[Phase 2]═══▶[Phase 3]════▶[Phase 4]
 Hardening   Warmup 1     BL Engine    Ramp BL       Volume
 + wait      inbox        doux 20/j    50→200/j      normal
 delisting   10→50/j      +Mailflow    +hub réint    1000/j
 STOP        mailflow     4 inboxes    (no hub)      5 vmtas
 envois      only         providers                  (+hub)
```

---

## PARTIE 8 — UTILISATION DES 2 IPs

### Question : PMTA sur .60 ou pas ?

**Non**. Recommandation : **.60 reste frontend MailWizz**, tout l'envoi passe par .175.

Raisons :
1. .60 n'a pas de PTR forward-confirmed (`static.60.254.168.204.clients.your-server.de`)
2. .60 n'a pas de DKIM, pas de DNS SPF
3. Rebuild d'une infra mirror sur .60 = 2 jours pour +1 IP de warmup sacrificielle
4. L'architecture cible (MW UI → PMTA VPS1 via submission 587 auth) est plus propre

### Alternatives

**Alternative A (recommandée)** : MailWizz sur .60 → delivery_server `204.168.180.175:587` avec user SMTP `outreach@sos-expat.com` (déjà créé PMTA). Auth + STARTTLS + DKIM côté PMTA. .60 n'a pas besoin de PTR mail.

**Alternative B** : Supprimer .60, économiser la VM, tout centraliser sur .175. MailWizz en Docker sur .175 (+500 Mo RAM).

**Alternative C** (coûteuse) : .60 en hot-standby complet (PMTA + Postfix + DKIM + PTR) pour failover IP. Effort 1 jour, bénéfice ~10 %.

### DNS spécifiques

- Alt A : aucun changement DNS, .60 reste backend Laravel/MW
- Alt C : A `mail2.<domain>` → .60, MX secondaire priority 20, SPF `ip4:204.168.180.175 ip4:204.168.254.60 -all`, PTR .60 = `mail2.providers-expat.com` (ticket Hetzner), DKIM partagé ou DKIM2

### Séparation MailWizz ↔ PMTA

```
[User] ─► [VPS2 nginx] ─► [MailWizz PHP] ─► submission 587 TLS auth
                                                  │
                                                  ▼ internet
                                           [VPS1 Postfix 587] ─► [PMTA 127:2525]
                                                  │ (DKIM sign via PMTA domain-keys)
                                                  ▼
                                           [destinataire MX]
```

**Préférable** : WireGuard entre .60 et .175, MailWizz parle directement `10.0.0.1:2525` PMTA (bypass Postfix), `<source 10.0.0.0/24>` dans PMTA. Sinon submission 587 authentifiée publique est OK.

---

## PARTIE 9 — SCRIPTS À AJOUTER / CORRIGER

### S1. Kill-switch Mailflow

**Fichier** : `/opt/mail-security/kill-mailflow.sh`

```bash
#!/bin/bash
# Stop Mailflow warmup by blocking outbound to mailflow-io outlook MX
set -euo pipefail
TG_BOT='8349162167:AAGlhfoIZx7cUk40ebLypjEbpK6SG_f-rAM'
TG_CHAT='7560535072'

IPS=$(dig +short mailflow-io.mail.protection.outlook.com A | sort -u)
for ip in $IPS; do
  iptables -C OUTPUT -d "$ip" -j DROP 2>/dev/null || iptables -I OUTPUT -d "$ip" -j DROP
done
echo "$(date -u) blocked: $IPS" >> /var/log/mail-security.log

curl -s -X POST "https://api.telegram.org/bot${TG_BOT}/sendMessage" \
  -d "chat_id=${TG_CHAT}" \
  -d "text=🛑 Mailflow warmup KILL-SWITCH activated ($(echo "$IPS" | tr '\n' ' '))"
```

Exécuter maintenant : `bash /opt/mail-security/kill-mailflow.sh`

### S2. Test DKIM/SPF/DMARC automatique

**Fichier** : `/opt/mail-security/test-auth.sh`

```bash
#!/bin/bash
# Envoie mail test vers check-auth@verifier.port25.com et vérifie dkim/spf/dmarc pass
set -euo pipefail
for d in hub-travelers.com plane-liberty.com providers-expat.com emilia-mullerd.com planevilain.com; do
  swaks --from test@$d --to check-auth@verifier.port25.com \
        --server 127.0.0.1:587 --auth-user outreach@sos-expat.com \
        --auth-password '<PMTA_PASSWORD>' \
        --tls --body "DKIM/SPF/DMARC auth test $d" 2>&1 | grep -E "(250|550)"
done
```

Cron : `0 6 * * * /opt/mail-security/test-auth.sh >> /var/log/mail-security.log 2>&1`

### S3. Alerte saturation disque

**Fichier** : `/opt/mail-security/alert-disk.sh`

```bash
#!/bin/bash
TG_BOT='8349162167:AAGlhfoIZx7cUk40ebLypjEbpK6SG_f-rAM'
TG_CHAT='7560535072'
U=$(df / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$U" -gt 80 ]; then
  curl -s -X POST "https://api.telegram.org/bot${TG_BOT}/sendMessage" \
    -d "chat_id=${TG_CHAT}" \
    -d "text=⚠️ Disque VPS1 à ${U}% — rotation logs nécessaire"
fi
```

Cron : `0 * * * * /opt/mail-security/alert-disk.sh`

### S4. Smoke test BL Engine → PMTA

**Fichier** : `/opt/mail-security/smoke-bl-engine.sh`

```bash
#!/bin/bash
set -e
nc -zv 172.17.0.1 2525 || { echo "BL Engine cannot reach PMTA"; exit 1; }
docker exec bl-app sh -c 'nc -zv $SMTP_HOST $SMTP_PORT' || exit 1
echo "OK: BL Engine → PMTA OK"
```

### S5. Correctif `monitor.sh` — détection spoofing volumétrique

Le script actuel whiteliste par domaine `ALLOWED` mais **ne détecte pas le spoofing volumétrique** (l'incident : `support@metamask.io` n'était pas dans ALLOWED mais a quand même été relayé). Ajouter :

```bash
# Post-incident: alert si sender domain N'EST PAS dans ALLOWED avec volume > 10
VIOLATIONS=$(awk -F, -v t="$CUTOFF" -v al="$ALLOWED" '
  NR>1 && $2 > t {
    from=$4; sub(/.*@/, "", from)
    if (from !~ "^("al")$") print from
  }' "$ACCT_FILE" | sort | uniq -c | awk '$1 > 10 {print $2, $1}')
[ -n "$VIOLATIONS" ] && alert "SPOOFING ALERT:%0A$VIOLATIONS"
```

---

## PARTIE 10 — CHECKLIST REPRISE CAMPAGNES

**Avant CHAQUE envoi** (cocher tous les items — sinon NO-GO) :

- [ ] `cat /var/lib/mail-security/spamhaus-state` = `clean` depuis ≥ 48 h
- [ ] `cat /var/lib/mail-security/microsoft-state` = `clean`
- [ ] `cat /var/lib/mail-security/barracuda-delisted` présent/vide
- [ ] MXtoolbox blacklist check 5 domaines + IP .175 : 0 listing
- [ ] `swaks --from test@providers-expat.com --to check-auth@verifier.port25.com` → dkim=pass, spf=pass, dmarc=pass
- [ ] `mail-tester.com` score ≥ 9/10 pour chaque vmta
- [ ] Bounce rate 24 h précédentes < 3 %
- [ ] Complaint rate 24 h précédentes < 0.1 %
- [ ] Disque VPS1 < 80 %
- [ ] UFW .175 actif, règle 2525 DENY présente
- [ ] UFW .60 actif
- [ ] Attaquant 102.36.228.189 toujours banni
- [ ] fail2ban status sshd : pas de jail anormal
- [ ] PMTA queue < 100 (pas d'accumulation)
- [ ] `ss -tln | grep 2525` → uniquement 127.0.0.1 et 172.17.0.1 (JAMAIS 0.0.0.0 ni .175)
- [ ] DKIM TXT répond pour les 5 domaines
- [ ] Volume planifié <= volume Phase courante
- [ ] Daily report Telegram reçu hier
- [ ] Mailflow warmup actif sur ≥ 1 inbox (hors période de listing)
- [ ] Kill-switch `kill-mailflow.sh` testé et documenté

**Si un item KO → STOP, diagnostiquer, corriger, retester.**

---

## ANNEXE A — Commandes d'audit réutilisables

```bash
# Check Spamhaus live
ssh root@204.168.180.175 'bash /opt/mail-security/check-spamhaus-via-microsoft.sh; cat /var/lib/mail-security/spamhaus-state'

# Volume PMTA dernière heure
ssh root@204.168.180.175 'awk -F, -v t="$(date -u -d "1 hour ago" +"%Y-%m-%d %H:%M")" "NR>1 && \$2 > t" /var/log/pmta/acct-$(date -u +%Y-%m-%d)-0000.csv | wc -l'

# Top senders (détection spoofing)
ssh root@204.168.180.175 'awk -F, "NR>1 {print \$4}" /var/log/pmta/acct-$(date -u +%Y-%m-%d)-0000.csv | sort | uniq -c | sort -rn | head'

# BL Engine sent_emails
ssh root@204.168.180.175 'docker exec bl-postgres psql -U backlink -d backlink_engine -c "SELECT COUNT(*), MAX(created_at) FROM sent_emails;"'

# Ports PMTA (doit être loopback only)
ssh root@204.168.180.175 'ss -tlnp | grep 2525'
```

## ANNEXE B — Fichiers et chemins critiques (absolus)

| Rôle | Chemin |
|------|--------|
| Config PMTA | `/etc/pmta/config` |
| Logs PMTA | `/var/log/pmta/{log,acct-YYYY-MM-DD-0000.csv,diag-*.csv}` |
| Clés DKIM PMTA | `/home/pmta/conf/mail/<domain>/dkim.pem` |
| Config Postfix | `/etc/postfix/{main.cf,master.cf,virtual,sni_map}` |
| Config Dovecot | `/etc/dovecot/` |
| Config OpenDKIM | `/etc/opendkim.conf`, `/etc/opendkim/{signing.table,key.table}` |
| Boîtes presse | `/var/mail/presse-{hubtravelers,planeliberty,providersexpat,emiliamullerd,planevilain}/Maildir/` |
| Scripts monitoring | `/opt/mail-security/*.sh`, `/opt/mail-security/campaign/*.sh` |
| State monitoring | `/var/lib/mail-security/{spamhaus-state,microsoft-state,state,barracuda-delisted,alert-states,reminders-sent}` |
| Logs monitoring | `/var/log/{mail-security.log,spamhaus-check.log,mail-forwarder-*.log}` |
| Crons | `/etc/cron.d/{mail-security,spamhaus-check,microsoft-delist-check,barracuda-delist-check,mail-forwarder-presse,mail-forwarder-providers,campaign-monitoring,campaign-reminders}` |
| BL Engine | `/opt/backlink-engine/`, container `bl-app`, DB `bl-postgres` (user `backlink`, db `backlink_engine`) |
| MailWizz (VPS2) | `/opt/mailwizz/docker-compose.yml`, containers `mw-mysql`+`mw-redis`, web `/var/www/mailwizz/` |
| UFW | `/etc/ufw/user.rules` |
| fail2ban | `/etc/fail2ban/jail.local` |

---

**Fin de l'audit.**

**Décision finale** : **STOP envois**. Exécuter Phase 0 (R1-R11) maintenant. Attendre delisting Spamhaus ST6726822 + 48 h de stabilité avant Phase 1. Warmup Mailflow en mode kill-switch tant que listing actif.
