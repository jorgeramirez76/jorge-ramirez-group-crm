"""
AI Newsletter Engine
Generates weekly/bi-weekly market update newsletters using Gemma 4.
Pulls local market data and creates personalized content for the Jorge Ramirez Group.
"""

import os
import json
import logging
from datetime import datetime
from pathlib import Path
import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("newsletter-engine")

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma4:31b")
EMAIL_API = os.getenv("EMAIL_API_URL", "http://localhost:8200")
OUTPUT_DIR = Path(__file__).parent / "output" / "newsletters"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

NEWSLETTER_PROMPT = """\
You are a real estate market expert writing a newsletter for The Jorge Ramirez Group \
at Keller Williams Premier Properties, serving Central and Northern New Jersey \
(Summit, Short Hills, Chatham, and surrounding luxury markets).

Write a market update newsletter with:

1. A catchy, non-clickbait subject line
2. A friendly opening paragraph (2-3 sentences)
3. 3 market insights for the {area} area:
   - Average days on market trend
   - Price trend (up/down/stable)
   - Inventory levels (buyer's vs seller's market)
4. A "Featured Tip" — one actionable piece of advice for homeowners
5. A soft CTA: "If you have any questions about your home's value or the market, \
George and I are always happy to chat. No pressure, just honest answers."

COMPLIANCE: Include "The Jorge Ramirez Group | Keller Williams Premier Properties" \
at the bottom. Do not guarantee prices or timelines. Do not disparage other agents.

Tone: Warm, knowledgeable, accessible. Like a trusted neighbor who happens to \
know real estate inside and out.

Format the output as:
Subject: [subject line]

[newsletter body]
"""


def generate_newsletter(area: str = "Summit/Short Hills/Chatham") -> dict:
    """Generate a newsletter using Ollama."""
    logger.info(f"Generating newsletter for {area}...")

    prompt = NEWSLETTER_PROMPT.replace("{area}", area)

    with httpx.Client(timeout=120.0) as client:
        resp = client.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": prompt},
                    {
                        "role": "user",
                        "content": f"Write this week's newsletter for {area}. "
                        f"Today's date is {datetime.now().strftime('%B %d, %Y')}.",
                    },
                ],
                "stream": False,
                "options": {"temperature": 0.7, "num_predict": 800},
            },
        )
        content = resp.json().get("message", {}).get("content", "")

    # Parse subject from content
    subject = "Market Update from The Jorge Ramirez Group"
    body = content
    if content.startswith("Subject:"):
        lines = content.split("\n", 1)
        subject = lines[0].replace("Subject:", "").strip()
        body = lines[1].strip() if len(lines) > 1 else content

    result = {
        "subject": subject,
        "body": body,
        "area": area,
        "generated_at": datetime.utcnow().isoformat(),
    }

    # Save to file
    filename = f"newsletter_{datetime.now().strftime('%Y%m%d_%H%M')}.json"
    with open(OUTPUT_DIR / filename, "w") as f:
        json.dump(result, f, indent=2)
    logger.info(f"Newsletter saved to {OUTPUT_DIR / filename}")

    return result


def send_newsletter(newsletter: dict, recipients: list[str]):
    """Send newsletter to a list of email addresses."""
    logger.info(f"Sending newsletter to {len(recipients)} recipients...")

    with httpx.Client(timeout=30.0) as client:
        for email in recipients:
            try:
                client.post(
                    f"{EMAIL_API}/api/email/send",
                    json={
                        "to": email,
                        "subject": newsletter["subject"],
                        "body": newsletter["body"],
                        "lead": {},
                    },
                )
                logger.info(f"Sent to {email}")
            except Exception as e:
                logger.error(f"Failed to send to {email}: {e}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Generate AI newsletter")
    parser.add_argument("--area", default="Summit/Short Hills/Chatham")
    parser.add_argument("--send-to", nargs="*", help="Email addresses to send to")
    parser.add_argument("--dry-run", action="store_true", help="Generate only, don't send")
    args = parser.parse_args()

    newsletter = generate_newsletter(args.area)
    print(f"\nSubject: {newsletter['subject']}\n")
    print(newsletter["body"])

    if args.send_to and not args.dry_run:
        send_newsletter(newsletter, args.send_to)
