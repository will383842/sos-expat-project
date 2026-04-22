# Bridge Google Alerts → Telegram (via ton Mailflow existant)

Objectif : recevoir chaque mention de "SOS-Expat" sur le web directement
dans ton Telegram (chat `7560535072`, bot `@sosexpat_admin_bot`), sans
outil externe payant.

Tu as **déjà toute l'infrastructure** en place (mémoire projet
`reference_mailflow_telegram_bot`).

## Architecture actuelle (rappel mémoire)

```
[Email arrivant sur presse@*]
        │
        ▼
[Maildir VPS Hetzner /opt/mail-forwarder]
        │
        ▼ cron 2 min lit Maildir
[Parser + détection importance]
        │
        ▼
[Bot @sosexpat_admin_bot → chat 7560535072 Telegram]
```

## Extension proposée pour Google Alerts

```
[Google Alerts notifie alerts@sos-expat.com]
        │
        ▼
[Maildir VPS reçoit l'email]
        │
        ▼ cron 2 min déjà configuré
[Parser avec règle : alerts@ → template "🔔 Google Alert"]
        │
        ▼
[Telegram chat 7560535072 instantané]
```

## Étape 1 — Créer l'alias email `alerts@sos-expat.com`

Si pas déjà existant dans ta config Postfix/Postal (`5 inboxes presse@*`
d'après la mémoire) :

### Option A — Nouvel alias dédié

Édite `/etc/postfix/virtual` (ou équivalent Postal admin) :

```
alerts@sos-expat.com   will@sos-expat.com   # ou autre inbox maître
```

Puis : `sudo postmap /etc/postfix/virtual && sudo systemctl reload postfix`

### Option B — Utiliser un inbox `presse@*` existant

Plus simple : Google Alerts → `presse@sos-expat.com` (ou un alias
`presse-alerts@`), et tu filtres côté parser par le **subject** :

```
Subject: Google Alert - SOS-Expat
Subject: Google Alerte - SOS-Expat
```

## Étape 2 — Créer les 18 alertes Google

Va sur [google.com/alerts](https://www.google.com/alerts) et crée ces alertes :

| # | Requête | Fréquence | Langue |
|---|---------|-----------|--------|
| 1 | `"SOS-Expat"` | As-it-happens | All |
| 2 | `"SOS Expat"` (sans tiret) | As-it-happens | All |
| 3 | `"sos-expat.com"` | Daily | All |
| 4 | `"sos-expat"` avocat | Weekly | French |
| 5 | `"sos-expat"` lawyer | Weekly | English |
| 6 | `"sos-expat"` abogado | Weekly | Spanish |
| 7 | `"sos-expat"` anwalt | Weekly | German |
| 8 | `"sos-expat"` advogado | Weekly | Portuguese |
| 9 | `"sos-expat"` юрист | Weekly | Russian |
| 10 | `"sos-expat"` 律师 | Weekly | Chinese |
| 11 | `"sos-expat"` वकील | Weekly | Hindi |
| 12 | `"sos-expat"` محامي | Weekly | Arabic |
| 13 | `"sos-expat"` Tallinn | Daily | All |
| 14 | `"sos-expat"` Estonia | Daily | All |
| 15 | `"sos-expat"` expat | Weekly | All |
| 16 | `"sos-expat"` Thailand | Weekly | FR+EN |
| 17 | `"SOS-Expat" e-residency` | Weekly | All |
| 18 | Crunchbase mentions (indirect via link to crunchbase.com/organizations/sos-expat) | Weekly | All |

Pour chaque alerte :
- **Show options → Deliver to** : `alerts@sos-expat.com` (ou l'inbox de l'option B)
- **How often** : selon tableau
- **Sources** : `Automatic` (couvre news, blogs, web)
- **Language** : selon tableau (ou "Any language")
- **Region** : `Any region` (international)
- **How many** : `Only the best results` (pour réduire bruit) OU `All results` si tu veux tout

## Étape 3 — Modifier le parser Mailflow existant

Sur ton VPS, édite le script `/opt/mail-forwarder/forwarder.py` (ou
équivalent selon implémentation exacte de ton cron) pour ajouter une règle :

```python
# /opt/mail-forwarder/forwarder.py — ajout Google Alerts

def classify_email(msg):
    from_addr = msg.get('From', '').lower()
    subject = msg.get('Subject', '')

    # Règle Google Alerts (AJOUT)
    if 'googlealerts-noreply@google.com' in from_addr or 'Google Alert' in subject:
        return {
            'type': 'google_alert',
            'priority': 'medium',
            'template': 'google_alert',
        }

    # Règles existantes (presse, contact, etc.)
    # ...

def format_telegram_message(msg, classification):
    if classification['type'] == 'google_alert':
        # Parser le contenu HTML de Google Alerts pour extraire les liens
        html = msg.get_payload_html()
        links = extract_alert_links(html)  # retourne [{title, url, source}]

        text = f"🔔 *Google Alert* — {msg['Subject']}\n\n"
        for i, link in enumerate(links[:5]):  # Top 5 mentions
            text += f"*{i+1}.* {escape_markdown(link['title'])}\n"
            text += f"    🔗 {link['url']}\n"
            text += f"    📰 {link['source']}\n\n"
        text += f"(et {len(links) - 5} autres)" if len(links) > 5 else ""
        return text

    # Autres templates existants...
```

### Parser des liens Google Alerts (fonction helper)

```python
# /opt/mail-forwarder/alert_parser.py
from bs4 import BeautifulSoup
import re

def extract_alert_links(html_content):
    """Extrait les mentions depuis un email Google Alerts."""
    soup = BeautifulSoup(html_content, 'html.parser')
    results = []

    # Google Alerts structure: chaque mention est dans un <h2> + <a>
    for h2 in soup.find_all('h2'):
        link_elem = h2.find('a')
        if not link_elem:
            continue

        # URL réelle (pas le lien de tracking Google)
        raw_url = link_elem.get('href', '')
        match = re.search(r'[&?]url=([^&]+)', raw_url)
        real_url = match.group(1) if match else raw_url
        real_url = unquote(real_url)

        # Source (nom du média)
        source_elem = h2.find_next('font', {'color': '#666666'})
        source = source_elem.get_text(strip=True) if source_elem else 'Unknown'

        results.append({
            'title': link_elem.get_text(strip=True),
            'url': real_url,
            'source': source,
        })

    return results
```

## Étape 4 — Tester

Crée une alerte simple (ex. `"SOS-Expat"`) et attend le premier déclenchement
(peut prendre quelques jours si aucune nouvelle mention).

**Test manuel immédiat** : publie un tweet ou LinkedIn post avec le mot
"SOS-Expat" et vois si l'alerte arrive sous 24-48h.

**Résultat attendu** dans ton Telegram chat `7560535072` :

```
🔔 Google Alert — Google Alert - SOS-Expat

1. Le Petit Journal : SOS-Expat révolutionne l'aide aux expatriés
    🔗 https://lepetitjournal.com/article/xxx
    📰 lepetitjournal.com

2. Startup Estonia : E-residency powers new legal-tech success story
    🔗 https://startupestonia.ee/story/xxx
    📰 startupestonia.ee

(et 3 autres)
```

## Étape 5 — Volume et rate-limit Telegram

Telegram limite à 30 msg/sec par bot. Largement suffisant.

**Si volume trop élevé** (ex. 50 alertes/jour vers le chat), regroupe par
heure ou jour :
- Au lieu de 1 msg par alert, un digest quotidien via cron dedicated
- Stocke en DB les alerts de la journée → message unique à 09:00 UTC

## Extensions possibles

| Idée | Complexité | Gain |
|------|-----------|------|
| Cross-référencer l'URL avec la DB PressContact | Faible | Sait si c'est un média déjà pitché |
| Auto-tag article comme "PUBLISHED" dans Backlink Engine | Moyenne | Automatise tracking Wikidata source |
| Score de sentiment (positif/négatif) via OpenAI | Moyenne | Priorisation lecture |
| Archivage auto dans Airtable / Notion | Faible | Revue de presse structurée |
| Screenshot auto de l'article (via Browserless) | Moyenne | Preserve l'article si supprimé |

## Summary

**Ce que tu auras** :
- ✅ 18 alertes Google surveillant "SOS-Expat" en 9 langues
- ✅ Notifications Telegram en temps quasi-réel
- ✅ Pas d'outil SaaS payant
- ✅ Infrastructure entièrement sous ton contrôle
- ✅ Réutilisable pour d'autres projets

**Temps de setup total** : **~2 heures**
- Création 18 Google Alerts : 30 min
- Alias `alerts@sos-expat.com` (si besoin) : 10 min
- Modif parser Mailflow : 30-45 min
- Tests : 30 min

**Budget** : 0 €.
