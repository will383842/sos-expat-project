# Gmail → Telegram bridge setup (sans VPS)

**Alternative au VPS Mailflow** — tourne sur GitHub Actions, zéro VPS à gérer.

Les Google Alerts livrent sur `williamsjullin@gmail.com`. Ce workflow les
lit via Gmail API, extrait les mentions, les poste sur Telegram chat
`7560535072`, et marque comme lues. Cron : toutes les 15 min.

---

## Setup 1-fois (20-30 min total)

### Étape 1 — Créer un projet Google Cloud + OAuth credentials (15 min)

1. Va sur [console.cloud.google.com](https://console.cloud.google.com)
2. Clique **"Select a project"** → **"New Project"**
   - Nom : `sos-expat-brand-entity`
   - Clique **"Create"**
3. Dans la barre de recherche en haut, tape **"Gmail API"** → clique **"Enable"**
4. Menu gauche → **"APIs & Services"** → **"OAuth consent screen"**
   - User type : **External**
   - App name : `SOS-Expat Gmail Alerts Bridge`
   - User support email : `williamsjullin@gmail.com`
   - Developer contact : `williamsjullin@gmail.com`
   - **Scopes** : ajouter `https://www.googleapis.com/auth/gmail.modify`
     (Gmail modify = lire + marquer comme lu)
   - **Test users** : ajouter `williamsjullin@gmail.com`
   - Save & continue
5. Menu gauche → **"APIs & Services"** → **"Credentials"** → **"+ Create Credentials"** → **"OAuth client ID"**
   - Application type : **Desktop app**
   - Nom : `sos-expat-gmail-bridge`
   - **"Create"** → popup avec **Client ID** et **Client Secret**
   - ⚠️ Copie-colle ces 2 valeurs, tu en auras besoin

### Étape 2 — Générer le refresh token (5 min, 1 seule fois)

Sur ta machine locale :

```bash
# Installer Python + 1 lib
pip install requests

# Copie-colle dans un fichier get-refresh-token.py :
cat > get-refresh-token.py <<'EOF'
import urllib.parse, webbrowser, requests
CLIENT_ID = input("Paste Client ID: ").strip()
CLIENT_SECRET = input("Paste Client Secret: ").strip()
SCOPE = "https://www.googleapis.com/auth/gmail.modify"
REDIRECT = "urn:ietf:wg:oauth:2.0:oob"  # copy-paste flow
url = "https://accounts.google.com/o/oauth2/auth?" + urllib.parse.urlencode({
    "client_id": CLIENT_ID, "redirect_uri": REDIRECT,
    "scope": SCOPE, "response_type": "code",
    "access_type": "offline", "prompt": "consent",
})
print(f"\nOpen this URL, sign in with williamsjullin@gmail.com, approve:\n{url}\n")
webbrowser.open(url)
code = input("Paste the authorization code: ").strip()
r = requests.post("https://oauth2.googleapis.com/token", data={
    "code": code, "client_id": CLIENT_ID, "client_secret": CLIENT_SECRET,
    "redirect_uri": REDIRECT, "grant_type": "authorization_code",
})
data = r.json()
print("\n--- REFRESH TOKEN (save this) ---")
print(data.get("refresh_token", "ERROR: " + str(data)))
EOF

python3 get-refresh-token.py
```

Processus :
1. Le script ouvre ton navigateur vers Google
2. Connecte-toi avec `williamsjullin@gmail.com`
3. Clique "Continue" sur l'avertissement "App not verified" (c'est ton app)
4. Autorise le scope Gmail
5. Google te donne un **code** à copier dans le terminal
6. Le script affiche ton **refresh_token** → copie-colle

⚠️ Le refresh token **n'expire pas** tant que tu ne révoques pas l'accès.
Stocke-le bien.

### Étape 3 — Créer le bot Telegram (si pas déjà fait) (3 min)

1. Dans Telegram, ouvre [@BotFather](https://t.me/BotFather)
2. Tape `/newbot`
3. Nom : `SOS-Expat Brand Alerts`
4. Username : `sosexpat_brand_alerts_bot` (doit finir par `_bot`)
5. BotFather te donne un **token** de la forme `123456789:ABC-DEF123...`
6. Copie-colle

Note : tu peux aussi réutiliser ton bot existant `@sosexpat_admin_bot` si
tu préfères. Récupère son token via `/mybots` dans BotFather.

### Étape 4 — Configurer les 5 secrets GitHub (2 min)

Sur https://github.com/will383842/sos-expat-project/settings/secrets/actions → **New repository secret**

| Nom | Valeur |
|---|---|
| `GMAIL_OAUTH_CLIENT_ID` | Client ID de l'étape 1 |
| `GMAIL_OAUTH_CLIENT_SECRET` | Client Secret de l'étape 1 |
| `GMAIL_OAUTH_REFRESH_TOKEN` | Refresh token de l'étape 2 |
| `TELEGRAM_BOT_TOKEN` | Token du bot de l'étape 3 |
| `TELEGRAM_PRESS_CHAT_ID` | `7560535072` (ton chat Telegram personnel) |

### Étape 5 — Déclencher le workflow manuellement pour tester (1 min)

1. https://github.com/will383842/sos-expat-project/actions → **Gmail Google Alerts → Telegram**
2. Bouton **"Run workflow"** → **"Run workflow"** (branch main)
3. Attends ~1 min → va voir les logs

Si tes Google Alerts ont des emails unread → tu recevras les notifs Telegram immédiatement.

---

## Comment ça tourne ensuite

- **Cron automatique** : toutes les 15 min, GitHub Actions run le script
- **Idempotent** : une fois marquée "read" dans Gmail, l'alerte n'est jamais
  re-postée
- **Concurrency guard** : 1 seul run à la fois (évite doublons si ça overrun)
- **Limite de safety** : max 20 alertes par run (évite spam massif Telegram
  si accumulation)

## Troubleshooting

### "FATAL: missing env vars"
→ Les 4 secrets GitHub ne sont pas tous créés. Retourne à l'étape 4.

### "OAuth refresh failed: invalid_grant"
→ Le refresh token a été révoqué ou n'est plus valide. Re-fais l'étape 2.

### "No new Google Alerts. Done."
→ Aucun email non-lu de `googlealerts-noreply@google.com` dans ton inbox.
C'est OK — attends qu'une alerte arrive (ou poste un tweet test contenant
"SOS-Expat" et attends 15-60 min).

### Les alertes arrivent dans Gmail mais pas dans Telegram
→ Vérifie les logs du workflow : https://github.com/will383842/sos-expat-project/actions
→ L'erreur la plus commune : scope Gmail OAuth manquant. Assure-toi que le
scope est `gmail.modify` (lit + marque read) et pas juste `gmail.readonly`.

### Ça poste en double sur Telegram
→ Bug dans le script. Vérifie les logs. En attendant, désactive le
workflow manuellement (Actions tab → Disable workflow) et contacte-moi.

---

## Alternative ultra-simple si tu veux éviter tout ce setup

Dans Gmail Settings → **Forwarding** → ajoute `contact@sos-expat.com`.
Tous les emails de `williamsjullin@gmail.com` sont forwardés à ton Mailflow
et traités par l'infra existante. 2 minutes de setup au lieu de 30.

Trade-off : tous tes emails perso sont forwardés, pas seulement les Google
Alerts. Filtre Gmail possible pour ne forward QUE les Google Alerts :
créer un filtre "From: googlealerts-noreply@google.com" → action "Forward
to: contact@sos-expat.com".
