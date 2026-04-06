"""
Email Sender Service
Sends transactional and marketing emails via Resend or Amazon SES.
Provides HTTP API for n8n automations to send templated emails.
"""

import os
import json
import logging
from pathlib import Path
from fastapi import FastAPI, Request
import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("email-sender")

app = FastAPI(title="Email Sender", version="1.0.0")

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "teddy@jorgeramirezgroup.com")
FROM_NAME = os.getenv("FROM_NAME", "Teddy - Jorge Ramirez Group")

TEMPLATES_DIR = Path(__file__).parent.parent / "emails"


def load_sequence(sequence_name: str) -> list:
    """Load an email sequence from the templates directory."""
    for ext in [".json", ".md"]:
        path = TEMPLATES_DIR / f"{sequence_name}{ext}"
        if path.exists():
            if ext == ".json":
                with open(path) as f:
                    return json.load(f)
    return []


def personalize(text: str, lead: dict) -> str:
    """Replace merge variables in email text."""
    replacements = {
        "{first_name}": lead.get("first_name", "there"),
        "{last_name}": lead.get("last_name", ""),
        "{address}": lead.get("address", "your home"),
        "{area_of_interest}": lead.get("area_of_interest", "your area"),
        "{price_range}": lead.get("price_range", "your price range"),
        "{estimated_value}": lead.get("estimated_value", ""),
        "{days_on_market}": str(lead.get("days_on_market", "")),
        "{agent_name}": "George Ramirez",
        "{team_name}": "The Jorge Ramirez Group",
    }
    for key, value in replacements.items():
        text = text.replace(key, value)
    return text


@app.post("/api/email/send")
async def send_email(request: Request):
    """Send a single email. Called by n8n automations."""
    data = await request.json()
    to = data["to"]
    subject = data["subject"]
    body = data["body"]
    lead = data.get("lead", {})

    # Personalize
    subject = personalize(subject, lead)
    body = personalize(body, lead)

    # Append compliance footer (CAN-SPAM, NJ real estate law, NAR/NCJAR)
    compliance_footer = (
        "\n\n---\n"
        "The Jorge Ramirez Group | Keller Williams Realty Premier Properties\n"
        "Jorge Ramirez, Licensed Real Estate Salesperson\n"
        "488 Springfield Avenue, Summit, NJ 07901\n\n"
        "If you no longer wish to receive emails, reply STOP or click unsubscribe.\n"
        "This is not intended to solicit currently listed properties. "
        "If you are currently working with a real estate professional, please disregard this message."
    )
    body = body + compliance_footer

    # Convert newlines to HTML
    html_body = body.replace("\n\n", "</p><p>").replace("\n", "<br>")
    html_body = f"<div style='font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #333;'><p>{html_body}</p></div>"

    logger.info(f"Sending email to {to}: {subject}")

    if RESEND_API_KEY:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
                json={
                    "from": f"{FROM_NAME} <{FROM_EMAIL}>",
                    "to": [to],
                    "subject": subject,
                    "html": html_body,
                },
            )
            result = resp.json()
            if resp.status_code in (200, 201):
                logger.info(f"Email sent: {result.get('id')}")
                return {"status": "sent", "id": result.get("id")}
            else:
                logger.error(f"Email failed: {result}")
                return {"status": "error", "detail": result}
    else:
        logger.warning("No RESEND_API_KEY set — email logged but not sent")
        return {"status": "dry_run", "to": to, "subject": subject}


@app.post("/api/email/send-sequence")
async def send_sequence_email(request: Request):
    """Send a specific email from a sequence to a lead."""
    data = await request.json()
    sequence_name = data["sequence"]  # e.g. "fsbo_sequence"
    email_index = data["email_index"]  # 0-based
    to = data["to"]
    lead = data.get("lead", {})

    sequence = load_sequence(sequence_name)
    if not sequence or email_index >= len(sequence):
        return {"status": "error", "detail": "sequence or index not found"}

    email = sequence[email_index]
    subject = personalize(email.get("subject", ""), lead)
    body = personalize(email.get("body", ""), lead)

    # Reuse the send endpoint
    return await send_email(Request(scope=request.scope), json={
        "to": to, "subject": subject, "body": body, "lead": lead
    })


@app.get("/api/email/sequences")
async def list_sequences():
    """List available email sequences."""
    sequences = []
    if TEMPLATES_DIR.exists():
        for f in TEMPLATES_DIR.iterdir():
            if f.suffix in [".json", ".md"]:
                sequences.append(f.stem)
    return {"sequences": sequences}


@app.get("/health")
async def health():
    return {"status": "ok", "service": "email-sender"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8200)
