#!/usr/bin/env python3
"""
Mailflow parser enhancement — Google Alerts → Telegram bridge.

Drop-in extension for /opt/mail-forwarder/forwarder.py on the Hetzner VPS.
Reads emails from the alerts@sos-expat.com Maildir (or whichever inbox
receives Google Alerts), extracts mentions, and pushes a formatted
summary to the Telegram chat 7560535072 via @sosexpat_admin_bot.

Deploy:
  scp forwarder-google-alerts.py root@VPS:/opt/mail-forwarder/
  # Then import the handler into your main forwarder loop:
  #   from forwarder_google_alerts import handle_google_alert
  # And call it when classify_email returns type="google_alert".

Dependencies (already installed for existing Mailflow):
  pip install requests beautifulsoup4
"""
from __future__ import annotations

import os
import re
import urllib.parse
from dataclasses import dataclass
from email.message import Message
from typing import List, Optional

import requests
from bs4 import BeautifulSoup


# ---------------------------------------------------------------------------
# Config (from env; tweak defaults to match your deploy)
# ---------------------------------------------------------------------------

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_PRESS_CHAT_ID", "7560535072")
MAX_MENTIONS_PER_MESSAGE = 5
MAX_SUBJECT_LEN = 80


# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------

@dataclass
class Mention:
    title: str
    url: str
    source: str  # e.g. "lepetitjournal.com"
    snippet: str = ""


# ---------------------------------------------------------------------------
# Classification — call this from your existing classify_email()
# ---------------------------------------------------------------------------

def is_google_alert(msg: Message) -> bool:
    """Detect Google Alerts emails by sender or subject."""
    from_addr = (msg.get("From") or "").lower()
    subject = msg.get("Subject") or ""
    if "googlealerts-noreply@google.com" in from_addr:
        return True
    if "google alert" in subject.lower() or "google alerte" in subject.lower():
        return True
    return False


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------

def _get_html_part(msg: Message) -> str:
    """Extract the text/html part of a multipart email."""
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
        return str(payload)
    return ""


def _unwrap_google_redirect(url: str) -> str:
    """Google Alerts wraps URLs in a google.com/url?url=XXX redirect. Unwrap."""
    m = re.search(r"[?&]url=([^&]+)", url)
    if not m:
        return url
    return urllib.parse.unquote(m.group(1))


def _hostname(url: str) -> str:
    try:
        return urllib.parse.urlparse(url).netloc or url
    except Exception:
        return url


def parse_alert_mentions(msg: Message) -> List[Mention]:
    """
    Extract the list of mentions from a Google Alerts email.

    Google Alerts HTML structure:
      <h2><a href="https://google.com/url?url=REAL_URL&...">Article title</a></h2>
      <font color="#666666">Source Name</font>
      <p>Snippet text</p>
    """
    html = _get_html_part(msg)
    if not html:
        return []

    soup = BeautifulSoup(html, "html.parser")
    mentions: List[Mention] = []

    for h2 in soup.find_all("h2"):
        link = h2.find("a")
        if not link:
            continue
        raw_url = link.get("href", "") or ""
        real_url = _unwrap_google_redirect(raw_url)
        title = link.get_text(strip=True)

        # Source: the <font color="#666666"> element after the H2
        source_elem = h2.find_next("font", {"color": "#666666"})
        source = source_elem.get_text(strip=True) if source_elem else _hostname(real_url)

        # Snippet: the next <p> or text block
        snippet_elem = h2.find_next("p")
        snippet = snippet_elem.get_text(strip=True)[:200] if snippet_elem else ""

        mentions.append(Mention(
            title=title,
            url=real_url,
            source=source,
            snippet=snippet,
        ))

    return mentions


# ---------------------------------------------------------------------------
# Telegram formatting
# ---------------------------------------------------------------------------

def _escape_md(s: str) -> str:
    """Escape Markdown v2 special chars."""
    return re.sub(r"([_*\[\]()~`>#+\-=|{}.!])", r"\\\1", s)


def format_telegram_message(msg: Message, mentions: List[Mention]) -> str:
    """Build a Telegram Markdown v2 message from parsed mentions."""
    subject = (msg.get("Subject") or "Google Alert")[:MAX_SUBJECT_LEN]

    if not mentions:
        return f"🔔 *Google Alert reçu* — {_escape_md(subject)}\n\n_Aucun lien exploitable trouvé\\._"

    lines = [f"🔔 *Google Alert* — {_escape_md(subject)}", ""]
    for i, m in enumerate(mentions[:MAX_MENTIONS_PER_MESSAGE], start=1):
        title = _escape_md(m.title[:100])
        source = _escape_md(m.source)
        lines.append(f"*{i}\\.* [{title}]({m.url})")
        lines.append(f"    📰 {source}")
        if m.snippet:
            snippet = _escape_md(m.snippet[:150])
            lines.append(f"    💬 _{snippet}_")
        lines.append("")

    if len(mentions) > MAX_MENTIONS_PER_MESSAGE:
        extra = len(mentions) - MAX_MENTIONS_PER_MESSAGE
        lines.append(f"_\\(et {extra} autres mentions\\)_")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Telegram send
# ---------------------------------------------------------------------------

def send_telegram(text: str) -> Optional[dict]:
    if not TELEGRAM_BOT_TOKEN:
        print("WARN: TELEGRAM_BOT_TOKEN not set, skipping Telegram send")
        return None

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text,
        "parse_mode": "MarkdownV2",
        "disable_web_page_preview": False,  # keep link previews for Google Alert articles
    }
    try:
        r = requests.post(url, json=payload, timeout=10)
        if r.status_code != 200:
            print(f"Telegram API error {r.status_code}: {r.text[:300]}")
            return None
        return r.json()
    except Exception as e:
        print(f"Telegram send failed: {e}")
        return None


# ---------------------------------------------------------------------------
# Main entry point — call from your existing forwarder loop
# ---------------------------------------------------------------------------

def handle_google_alert(msg: Message) -> bool:
    """
    Process a single Google Alert email and push to Telegram.

    Returns True if successfully forwarded, False otherwise.

    Integration (in your existing /opt/mail-forwarder/forwarder.py):

        from forwarder_google_alerts import is_google_alert, handle_google_alert

        for msg in new_messages:
            if is_google_alert(msg):
                handle_google_alert(msg)
                continue
            # ... existing press handling ...
    """
    mentions = parse_alert_mentions(msg)
    text = format_telegram_message(msg, mentions)
    result = send_telegram(text)
    return result is not None


# ---------------------------------------------------------------------------
# CLI test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import email
    import sys

    if len(sys.argv) < 2:
        print("Usage: python3 forwarder-google-alerts.py <path-to-raw-email.eml>")
        sys.exit(1)

    with open(sys.argv[1], "rb") as f:
        msg = email.message_from_binary_file(f)

    if not is_google_alert(msg):
        print("Not a Google Alert email (based on headers/subject)")
        sys.exit(1)

    mentions = parse_alert_mentions(msg)
    print(f"Found {len(mentions)} mention(s):")
    for i, m in enumerate(mentions, 1):
        print(f"  {i}. {m.title}")
        print(f"     {m.url}")
        print(f"     [{m.source}]")
        if m.snippet:
            print(f"     {m.snippet}")

    text = format_telegram_message(msg, mentions)
    print("\n--- Telegram message preview ---")
    print(text)
