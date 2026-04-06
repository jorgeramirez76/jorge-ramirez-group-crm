"""
Twilio SMS Webhook Handler
Receives incoming SMS via Twilio and forwards to Chatwoot inbox.
Also provides outbound SMS endpoint for n8n automations.
"""

import os
import logging
from fastapi import FastAPI, Request, Form
from fastapi.responses import PlainTextResponse
import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("twilio-webhook")

app = FastAPI(title="Twilio SMS Bridge", version="1.0.0")

CHATWOOT_URL = os.getenv("CHATWOOT_URL", "http://localhost:4100")
CHATWOOT_API_TOKEN = os.getenv("CHATWOOT_API_TOKEN", "")
CHATWOOT_ACCOUNT_ID = os.getenv("CHATWOOT_ACCOUNT_ID", "2")
CHATWOOT_INBOX_ID = os.getenv("CHATWOOT_INBOX_ID", "1")

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "")


@app.post("/webhook/twilio/incoming")
async def incoming_sms(
    From: str = Form(...),
    To: str = Form(...),
    Body: str = Form(...),
    MessageSid: str = Form(""),
):
    """Handle incoming SMS from Twilio → forward to Chatwoot."""
    logger.info(f"Incoming SMS from {From}: {Body[:50]}...")

    async with httpx.AsyncClient() as client:
        # Find or create contact in Chatwoot
        search_resp = await client.get(
            f"{CHATWOOT_URL}/api/v1/accounts/{CHATWOOT_ACCOUNT_ID}/contacts/search",
            params={"q": From},
            headers={"api_access_token": CHATWOOT_API_TOKEN},
        )

        contacts = search_resp.json().get("payload", [])
        if contacts:
            contact_id = contacts[0]["id"]
        else:
            # Create new contact
            create_resp = await client.post(
                f"{CHATWOOT_URL}/api/v1/accounts/{CHATWOOT_ACCOUNT_ID}/contacts",
                headers={"api_access_token": CHATWOOT_API_TOKEN},
                json={"phone_number": From, "name": From},
            )
            contact_id = create_resp.json().get("payload", {}).get("contact", {}).get("id")

        # Find existing conversation or create new one
        convos_resp = await client.get(
            f"{CHATWOOT_URL}/api/v1/accounts/{CHATWOOT_ACCOUNT_ID}/contacts/{contact_id}/conversations",
            headers={"api_access_token": CHATWOOT_API_TOKEN},
        )
        convos = convos_resp.json().get("payload", [])

        if convos:
            conversation_id = convos[0]["id"]
        else:
            conv_resp = await client.post(
                f"{CHATWOOT_URL}/api/v1/accounts/{CHATWOOT_ACCOUNT_ID}/conversations",
                headers={"api_access_token": CHATWOOT_API_TOKEN},
                json={
                    "contact_id": contact_id,
                    "inbox_id": int(CHATWOOT_INBOX_ID),
                    "message": {"content": Body},
                },
            )
            conversation_id = conv_resp.json().get("id")

        if convos:
            # Add message to existing conversation
            await client.post(
                f"{CHATWOOT_URL}/api/v1/accounts/{CHATWOOT_ACCOUNT_ID}/conversations/{conversation_id}/messages",
                headers={"api_access_token": CHATWOOT_API_TOKEN},
                json={"content": Body, "message_type": "incoming"},
            )

    logger.info(f"Forwarded to Chatwoot: contact={contact_id}, convo={conversation_id}")
    return PlainTextResponse("<?xml version='1.0'?><Response></Response>", media_type="text/xml")


@app.post("/api/sms/send")
async def send_sms(request: Request):
    """Send outbound SMS via Twilio. Called by n8n automations."""
    data = await request.json()
    to_number = data["to"]
    message = data["message"]

    logger.info(f"Sending SMS to {to_number}: {message[:50]}...")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json",
            auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
            data={
                "From": TWILIO_FROM_NUMBER,
                "To": to_number,
                "Body": message,
            },
        )
        result = resp.json()

    if resp.status_code in (200, 201):
        logger.info(f"SMS sent: {result.get('sid')}")
        return {"status": "sent", "sid": result.get("sid")}
    else:
        logger.error(f"SMS failed: {result}")
        return {"status": "error", "detail": result}


@app.get("/health")
async def health():
    return {"status": "ok", "service": "twilio-sms-bridge"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8100)
