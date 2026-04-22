#!/usr/bin/env python3
"""
Gmail → Telegram bridge for Google Alerts — 2026-04-22 (Vague 4.3 brand entity).

Alternative to the VPS Mailflow bridge : runs on GitHub Actions (cron every
15 min), reads Google Alerts emails from williamsjullin@gmail.com via the
Gmail API, extracts mentions, posts them to Telegram, marks as read.

NO VPS SSH required. Only needs:
  - GMAIL_OAUTH_CLIENT_ID       (from Google Cloud Console)
  - GMAIL_OAUTH_CLIENT_SECRET   (ditto)
  - GMAIL_OAUTH_REFRESH_TOKEN   (generated one-time, see docs/gmail-oauth-setup.md)
  - TELEGRAM_BOT_TOKEN          (from @BotFather)
  - TELEGRAM_PRESS_CHAT_ID      (default 7560535072)

Usage:
  pip install -r requirements.txt
  python3 gmail-to-telegram.py

Exits 0 on success (even if 0 alerts processed), non-zero only on fatal error.
"""
from __future__ import annotations

import base64
import os
import re
import sys
import urllib.parse
from email.message import Message
from email.parser import BytesParser
from email.policy import default as email_default_policy
from typing import Optional

import requests
from bs4 import BeautifulSoup


# ---------------------------------------------------------------------------
# Config from env
# ---------------------------------------------------------------------------

GMAIL_CLIENT_ID = os.environ.get("GMAIL_OAUTH_CLIENT_ID", "")
GMAIL_CLIENT_SECRET = os.environ.get("GMAIL_OAUTH_CLIENT_SECRET", "")
GMAIL_REFRESH_TOKEN = os.environ.get("GMAIL_OAUTH_REFRESH_TOKEN", "")
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_PRESS_CHAT_ID", "7560535072")

# Query: unread Google Alerts in primary category
GMAIL_QUERY = "from:googlealerts-noreply@google.com is:unread"
MAX_MENTIONS_PER_MESSAGE = 5
MAX_SUBJECT_LEN = 80
MAX_BATCH_PER_RUN = 20  # safety: don't drown Telegram if 100 alerts pile up

GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me"
OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token"


# ---------------------------------------------------------------------------
# OAuth helpers
# ---------------------------------------------------------------------------

def refresh_access_token() -> str:
    """Exchange refresh_token → short-lived access_token."""
    resp = requests.post(OAUTH_TOKEN_URL, data={
        "client_id": GMAIL_CLIENT_ID,
        "client_secret": GMAIL_CLIENT_SECRET,
        "refresh_token": GMAIL_REFRESH_TOKEN,
        "grant_type": "refresh_token",
    }, timeout=15)
    resp.raise_for_status()
    return resp.json()["access_token"]


def gmail_get(path: str, access_token: str, params: Optional[dict] = None) -> dict:
    r = requests.get(
        f"{GMAIL_API}{path}",
        headers={"Authorization": f"Bearer {access_token}"},
        params=params or {},
        timeout=20,
    )
    r.raise_for_status()
    return r.json()


def gmail_post(path: str, access_token: str, json_body: dict) -> dict:
    r = requests.post(
        f"{GMAIL_API}{path}",
        headers={"Authorization": f"Bearer {access_token}"},
        json=json_body,
        timeout=20,
    )
    r.raise_for_status()
    return r.json() if r.text else {}


# ---------------------------------------------------------------------------
# Gmail message fetching
# ---------------------------------------------------------------------------

def list_unread_alerts(access_token: str) -> list[str]:
    """Return list of message IDs matching the query."""
    data = gmail_get("/messages", access_token, params={
        "q": GMAIL_QUERY,
        "maxResults": MAX_BATCH_PER_RUN,
    })
    return [m["id"] for m in data.get("messages", [])]


def fetch_message_raw(msg_id: str, access_token: str) -> Message:
    data = gmail_get(f"/messages/{msg_id}", access_token, params={"format": "raw"})
    raw_b64 = data["raw"]
    # Gmail uses URL-safe base64
    raw_bytes = base64.urlsafe_b64decode(raw_b64.encode("ASCII"))
    msg = BytesParser(policy=email_default_policy).parsebytes(raw_bytes)
    return msg


def mark_as_read(msg_id: str, access_token: str) -> None:
    gmail_post(f"/messages/{msg_id}/modify", access_token, {
        "removeLabelIds": ["UNREAD"],
    })


# ---------------------------------------------------------------------------
# Parse Google Alerts HTML
# ---------------------------------------------------------------------------

def unwrap_google_redirect(url: str) -> str:
    m = re.search(r"[?&]url=([^&]+)", url)
    return urllib.parse.unquote(m.group(1)) if m else url


def extract_html(msg: Message) -> str:
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/html":
                payload = part.get_payload(decode=True)
                if isinstance(payload, bytes):
                    charset = part.get_content_charset() or "utf-8"
                    return payload.decode(charset, errors="replace")
                return str(payload)
    else:
        payload = msg.get_payload(decode=True)
        if isinstance(payload, bytes):
            return payload.decode("utf-8", errors="replace")
    return ""


def parse_mentions(msg: Message) -> list[dict]:
    html = extract_html(msg)
    if not html:
        return []
    soup = BeautifulSoup(html, "html.parser")
    mentions = []
    for h2 in soup.find_all("h2"):
        link = h2.find("a")
        if not link:
            continue
        raw_url = link.get("href", "") or ""
        real_url = unwrap_google_redirect(raw_url)
        title = link.get_text(strip=True)

        source_elem = h2.find_next("font", {"color": "#666666"})
        source = source_elem.get_text(strip=True) if source_elem else \
                 urllib.parse.urlparse(real_url).netloc

        snippet_elem = h2.find_next("p")
        snippet = snippet_elem.get_text(strip=True)[:200] if snippet_elem else ""

        mentions.append({
            "title": title,
            "url": real_url,
            "source": source,
            "snippet": snippet,
        })
    return mentions


# ---------------------------------------------------------------------------
# Telegram
# ---------------------------------------------------------------------------

def escape_md(s: str) -> str:
    return re.sub(r"([_*\[\]()~`>#+\-=|{}.!])", r"\\\1", s)


def format_telegram(msg: Message, mentions: list[dict]) -> str:
    subject = (msg.get("Subject") or "Google Alert")[:MAX_SUBJECT_LEN]
    if not mentions:
        return f"🔔 *Google Alert* — {escape_md(subject)}\n\n_Aucun lien exploitable\\._"

    lines = [f"🔔 *Google Alert* — {escape_md(subject)}", ""]
    for i, m in enumerate(mentions[:MAX_MENTIONS_PER_MESSAGE], 1):
        title = escape_md(m["title"][:100])
        src = escape_md(m["source"])
        lines.append(f"*{i}\\.* [{title}]({m['url']})")
        lines.append(f"    📰 {src}")
        if m["snippet"]:
            snippet = escape_md(m["snippet"][:150])
            lines.append(f"    💬 _{snippet}_")
        lines.append("")

    if len(mentions) > MAX_MENTIONS_PER_MESSAGE:
        lines.append(f"_\\(et {len(mentions) - MAX_MENTIONS_PER_MESSAGE} autres\\)_")

    return "\n".join(lines)


def send_telegram(text: str) -> bool:
    if not TELEGRAM_BOT_TOKEN:
        print("WARN: TELEGRAM_BOT_TOKEN missing", file=sys.stderr)
        return False
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    r = requests.post(url, json={
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text,
        "parse_mode": "MarkdownV2",
        "disable_web_page_preview": False,
    }, timeout=10)
    if r.status_code != 200:
        print(f"Telegram error {r.status_code}: {r.text[:300]}", file=sys.stderr)
        return False
    return True


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    missing = [k for k in (
        "GMAIL_OAUTH_CLIENT_ID", "GMAIL_OAUTH_CLIENT_SECRET",
        "GMAIL_OAUTH_REFRESH_TOKEN", "TELEGRAM_BOT_TOKEN",
    ) if not os.environ.get(k)]
    if missing:
        print(f"FATAL: missing env vars: {', '.join(missing)}", file=sys.stderr)
        return 2

    try:
        access_token = refresh_access_token()
    except Exception as e:
        print(f"FATAL: OAuth refresh failed: {e}", file=sys.stderr)
        return 3

    try:
        ids = list_unread_alerts(access_token)
    except Exception as e:
        print(f"FATAL: list_unread_alerts failed: {e}", file=sys.stderr)
        return 4

    if not ids:
        print("No new Google Alerts. Done.")
        return 0

    print(f"Found {len(ids)} unread Google Alert(s). Processing...")

    processed, failed = 0, 0
    for msg_id in ids:
        try:
            msg = fetch_message_raw(msg_id, access_token)
            mentions = parse_mentions(msg)
            text = format_telegram(msg, mentions)
            if send_telegram(text):
                mark_as_read(msg_id, access_token)
                processed += 1
                print(f"  ✓ {msg_id}: sent, {len(mentions)} mention(s)")
            else:
                failed += 1
                print(f"  ✗ {msg_id}: telegram send failed, keeping unread")
        except Exception as e:
            failed += 1
            print(f"  ✗ {msg_id}: {e}", file=sys.stderr)

    print(f"Done. Processed: {processed}, Failed: {failed}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
