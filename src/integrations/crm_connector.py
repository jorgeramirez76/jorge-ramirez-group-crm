"""
CRM Connector — API Gateway
Connects Twenty CRM, n8n, Chatwoot, and all communication services.
Provides unified webhook endpoints and event routing.
"""

import os
import json
import logging
from datetime import datetime
from fastapi import FastAPI, Request, HTTPException
import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("crm-connector")

app = FastAPI(title="CRM Connector", version="1.0.0")

# Service URLs
TWENTY_API = os.getenv("TWENTY_API_URL", "http://localhost:3000")
N8N_API = os.getenv("N8N_API_URL", "http://localhost:5678")
CHATWOOT_API = os.getenv("CHATWOOT_API_URL", "http://localhost:4100")
SMS_API = os.getenv("SMS_API_URL", "http://localhost:8100")
EMAIL_API = os.getenv("EMAIL_API_URL", "http://localhost:8200")
IMESSAGE_API = os.getenv("IMESSAGE_API_URL", "http://localhost:8300")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

TWENTY_API_KEY = os.getenv("TWENTY_API_KEY", "")
CHATWOOT_API_TOKEN = os.getenv("CHATWOOT_API_TOKEN", "")


@app.post("/webhook/new-lead")
async def new_lead(request: Request):
    """
    Universal new lead intake.
    Accepts leads from any source (website form, Zillow, Facebook, manual entry).
    Routes to Twenty CRM, triggers n8n automation, notifies Chatwoot.
    """
    data = await request.json()
    lead_name = data.get("name", "Unknown")
    email = data.get("email", "")
    phone = data.get("phone", "")
    lead_type = data.get("lead_type", "buyer")
    source = data.get("source", "website")

    logger.info(f"New lead: {lead_name} ({lead_type}) from {source}")

    results = {}

    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Trigger n8n new lead workflow
        try:
            resp = await client.post(
                f"{N8N_API}/webhook/new-lead",
                json=data,
            )
            results["n8n"] = "triggered" if resp.status_code == 200 else f"error: {resp.status_code}"
        except Exception as e:
            results["n8n"] = f"error: {e}"
            logger.error(f"n8n trigger failed: {e}")

    return {
        "status": "received",
        "lead": lead_name,
        "results": results,
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.post("/webhook/call-completed")
async def call_completed(request: Request):
    """
    Webhook fired after a voice agent call completes.
    Updates CRM, logs transcript, triggers post-call automation.
    """
    data = await request.json()
    lead_phone = data.get("phone", "")
    lead_name = data.get("lead_name", "Unknown")
    duration = data.get("duration_seconds", 0)
    outcome = data.get("outcome", "unknown")  # booked, callback, not_interested, voicemail
    transcript = data.get("transcript", "")
    appointment_time = data.get("appointment_time", "")

    logger.info(f"Call completed: {lead_name} ({lead_phone}) — {outcome}, {duration}s")

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Trigger post-appointment workflow if appointment was booked
        if outcome == "booked" and appointment_time:
            try:
                await client.post(
                    f"{N8N_API}/webhook/post-appointment",
                    json={
                        "lead_name": lead_name,
                        "lead_phone": lead_phone,
                        "appointment_type": data.get("appointment_type", "consultation"),
                        "agent_phone": os.getenv("GEORGE_PHONE", "+19082307844"),
                    },
                )
            except Exception as e:
                logger.error(f"Post-appointment trigger failed: {e}")

        # If missed call / no answer, trigger missed call text-back
        if outcome == "no_answer":
            try:
                await client.post(
                    f"{N8N_API}/webhook/missed-call",
                    json={"from_number": lead_phone, "to_number": ""},
                )
            except Exception as e:
                logger.error(f"Missed call trigger failed: {e}")

    return {
        "status": "processed",
        "lead": lead_name,
        "outcome": outcome,
    }


@app.post("/webhook/chatwoot-event")
async def chatwoot_event(request: Request):
    """
    Receives Chatwoot webhook events (new message, conversation created, etc).
    Routes to AI for auto-response if needed.
    """
    data = await request.json()
    event_type = data.get("event", "unknown")

    logger.info(f"Chatwoot event: {event_type}")

    if event_type == "message_created":
        message = data.get("content", "")
        sender_type = data.get("message_type", "")

        # Only auto-respond to incoming messages
        if sender_type == "incoming" and message:
            # Call Ollama to generate AI response
            async with httpx.AsyncClient(timeout=60.0) as client:
                try:
                    resp = await client.post(
                        f"{OLLAMA_URL}/api/chat",
                        json={
                            "model": "gemma4:31b",
                            "messages": [
                                {
                                    "role": "system",
                                    "content": (
                                        "You are Teddy, George Ramirez's assistant at Keller Williams Premier Properties. "
                                        "Respond helpfully and concisely to this lead's message. Follow Brandon Mulrenin's "
                                        "Reverse Selling methodology. Be curious, not pushy. 1-2 sentences max. "
                                        "Never disparage other agents. Always identify as Teddy from George Ramirez's team."
                                    ),
                                },
                                {"role": "user", "content": message},
                            ],
                            "stream": False,
                            "options": {"temperature": 0.8, "num_predict": 100},
                        },
                    )
                    ai_response = resp.json().get("message", {}).get("content", "")
                    if ai_response:
                        logger.info(f"AI response generated: {ai_response[:50]}...")
                        return {"status": "ai_response_ready", "response": ai_response}
                except Exception as e:
                    logger.error(f"AI response failed: {e}")

    return {"status": "received", "event": event_type}


@app.post("/api/send-message")
async def send_message(request: Request):
    """
    Universal message sender. Routes to the best channel.
    Channels: sms, email, imessage
    """
    data = await request.json()
    channel = data.get("channel", "sms")
    to = data.get("to", "")
    message = data.get("message", "")
    subject = data.get("subject", "")
    lead = data.get("lead", {})

    logger.info(f"Sending via {channel} to {to}")

    async with httpx.AsyncClient(timeout=30.0) as client:
        if channel == "sms":
            resp = await client.post(
                f"{SMS_API}/api/sms/send",
                json={"to": to, "message": message},
            )
        elif channel == "email":
            resp = await client.post(
                f"{EMAIL_API}/api/email/send",
                json={"to": to, "subject": subject, "body": message, "lead": lead},
            )
        elif channel == "imessage":
            resp = await client.post(
                f"{IMESSAGE_API}/send",
                json={"phone_number": to, "message_text": message},
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unknown channel: {channel}")

    return resp.json()


@app.post("/api/ai-classify-lead")
async def classify_lead(request: Request):
    """
    Uses AI to classify a lead's temperature based on their data.
    Returns: hot, warm, cold, nurture
    """
    data = await request.json()
    lead_info = json.dumps(data, indent=2)

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": "gemma4:31b",
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a lead scoring AI for a real estate CRM. "
                            "Classify the lead temperature as exactly one of: hot, warm, cold, nurture. "
                            "Respond with ONLY the classification word, nothing else."
                        ),
                    },
                    {"role": "user", "content": f"Classify this lead:\n{lead_info}"},
                ],
                "stream": False,
                "options": {"temperature": 0.3, "num_predict": 10},
            },
        )
        classification = resp.json().get("message", {}).get("content", "cold").strip().lower()

    # Normalize
    if classification not in ("hot", "warm", "cold", "nurture"):
        classification = "cold"

    return {"classification": classification, "lead": data.get("name", "Unknown")}


@app.get("/health")
async def health():
    """Health check — also checks downstream services."""
    services = {}
    async with httpx.AsyncClient(timeout=5.0) as client:
        for name, url in [
            ("twenty", f"{TWENTY_API}"),
            ("n8n", f"{N8N_API}"),
            ("chatwoot", f"{CHATWOOT_API}"),
            ("ollama", f"{OLLAMA_URL}/api/tags"),
        ]:
            try:
                resp = await client.get(url)
                services[name] = "up" if resp.status_code in (200, 302) else f"status:{resp.status_code}"
            except Exception:
                services[name] = "down"

    all_up = all(v == "up" for v in services.values())
    return {"status": "ok" if all_up else "degraded", "services": services}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
