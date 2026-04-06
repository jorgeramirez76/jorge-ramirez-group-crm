"""
HTTP API wrapper for iMessage sender.
Exposes a webhook endpoint that n8n (or any HTTP client) can call to send messages.

Run:
    uvicorn imessage_api:app --host 0.0.0.0 --port 8400

Or directly:
    python imessage_api.py
"""

import hmac
import logging
import os
import time
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from imessage_sender import MessageResult, MessageStatus, send_message

# ---------------------------------------------------------------------------
# Configuration via environment variables
# ---------------------------------------------------------------------------
API_TOKEN = os.getenv("IMESSAGE_API_TOKEN", "")  # shared secret for auth
RATE_LIMIT_PER_MIN = int(os.getenv("IMESSAGE_RATE_LIMIT", "30"))
LOG_LEVEL = os.getenv("IMESSAGE_LOG_LEVEL", "INFO").upper()

logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Simple in-memory sliding-window rate limiter
# ---------------------------------------------------------------------------
_request_timestamps: list[float] = []


def _check_rate_limit() -> bool:
    """Return True if under the rate limit, False if exceeded."""
    now = time.time()
    window = 60.0
    # Prune old entries
    while _request_timestamps and _request_timestamps[0] < now - window:
        _request_timestamps.pop(0)
    if len(_request_timestamps) >= RATE_LIMIT_PER_MIN:
        return False
    _request_timestamps.append(now)
    return True


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "iMessage API starting (rate_limit=%d/min, auth=%s)",
        RATE_LIMIT_PER_MIN,
        "enabled" if API_TOKEN else "DISABLED",
    )
    if not API_TOKEN:
        logger.warning(
            "IMESSAGE_API_TOKEN is not set -- the API is open to anyone who can reach this port. "
            "Set the env var to require Bearer token auth."
        )
    yield
    logger.info("iMessage API shutting down")


app = FastAPI(
    title="iMessage Sender API",
    version="1.0.0",
    description="Webhook endpoint for sending iMessages from macOS. Designed for n8n / CRM integrations.",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Auth middleware
# ---------------------------------------------------------------------------
def _verify_token(authorization: Optional[str]):
    """Raise 401 if a token is configured and the header doesn't match."""
    if not API_TOKEN:
        return  # auth disabled
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    # Accept "Bearer <token>" or raw token
    token = authorization.removeprefix("Bearer ").strip()
    if not hmac.compare_digest(token, API_TOKEN):
        raise HTTPException(status_code=401, detail="Invalid token")


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------
class SendMessageRequest(BaseModel):
    phone_number: str = Field(
        ...,
        description='Recipient phone number in E.164 format (e.g. "+15551234567")',
        examples=["+15551234567"],
    )
    message_text: str = Field(
        ...,
        description="Body of the message to send",
        examples=["Hi! Just following up on the property at 123 Main St."],
    )
    prefer_imessage: bool = Field(
        default=True,
        description="Try iMessage first, fall back to SMS. Set False for SMS-only.",
    )


class SendMessageResponse(BaseModel):
    status: str
    phone_number: str
    message_text: str
    error: Optional[str] = None
    delivery_service: Optional[str] = None


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "imessage-api"


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/health", response_model=HealthResponse, tags=["status"])
async def health():
    """Health-check endpoint (no auth required)."""
    return HealthResponse()


@app.post(
    "/send",
    response_model=SendMessageResponse,
    tags=["messaging"],
    summary="Send an iMessage or SMS",
)
async def send(
    body: SendMessageRequest,
    authorization: Optional[str] = Header(default=None),
):
    """
    Send a message via macOS Messages.app.

    Provide a Bearer token in the Authorization header if IMESSAGE_API_TOKEN is set.
    """
    _verify_token(authorization)

    if not _check_rate_limit():
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded ({RATE_LIMIT_PER_MIN} messages/min)",
        )

    logger.info("API request: send to %s (%d chars)", body.phone_number, len(body.message_text))

    result: MessageResult = send_message(
        body.phone_number,
        body.message_text,
        prefer_imessage=body.prefer_imessage,
    )

    response = SendMessageResponse(**result.to_dict())

    if result.status == MessageStatus.INVALID_INPUT:
        return JSONResponse(status_code=422, content=response.model_dump())
    if result.status == MessageStatus.FAILED:
        return JSONResponse(status_code=502, content=response.model_dump())

    return response


@app.post(
    "/webhook/send",
    response_model=SendMessageResponse,
    tags=["messaging"],
    summary="Webhook-friendly alias for /send (identical behavior)",
)
async def webhook_send(
    body: SendMessageRequest,
    authorization: Optional[str] = Header(default=None),
):
    """Alias of /send -- use whichever path is more convenient for your n8n workflow."""
    return await send(body, authorization)


# ---------------------------------------------------------------------------
# Error handlers
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"status": "error", "detail": "Internal server error"},
    )


# ---------------------------------------------------------------------------
# Direct execution
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "imessage_api:app",
        host="0.0.0.0",
        port=8400,
        log_level=LOG_LEVEL.lower(),
    )
