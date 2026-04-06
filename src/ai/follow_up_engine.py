#!/usr/bin/env python3
"""
AI Follow-Up Engine for Real Estate CRM
========================================

Scheduled job that reads leads from a PostgreSQL CRM database (Twenty CRM),
determines which leads are due for follow-up based on pipeline stage cadence,
generates personalized messages via Ollama (Gemma 4 31B), and writes output
to a JSON file for n8n to dispatch via SMS / email / iMessage.

Usage:
    # One-shot run
    python follow_up_engine.py

    # Cron (e.g. every morning at 8 AM)
    0 8 * * * /usr/bin/env python3 /Users/teddy/GPT-SoVITS/src/ai/follow_up_engine.py

Environment variable overrides (all optional):
    CRM_DB_HOST, CRM_DB_PORT, CRM_DB_USER, CRM_DB_PASSWORD, CRM_DB_NAME
    OLLAMA_BASE_URL, OLLAMA_MODEL
    OUTPUT_DIR
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import httpx
import psycopg2
import psycopg2.extras

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DB_CONFIG = {
    "host": os.getenv("CRM_DB_HOST", "localhost"),
    "port": int(os.getenv("CRM_DB_PORT", "5432")),
    "user": os.getenv("CRM_DB_USER", "crm"),
    "password": os.getenv("CRM_DB_PASSWORD", "crm_local_dev"),
    "dbname": os.getenv("CRM_DB_NAME", "twenty"),
}

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma4:31b")

OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", "/Users/teddy/GPT-SoVITS/src/ai/output"))

# ---------------------------------------------------------------------------
# Follow-up cadence per pipeline stage (in days)
# ---------------------------------------------------------------------------

CADENCE: dict[str, dict[str, Any]] = {
    "hot": {
        "min_days": 2,
        "max_days": 3,
        "description": "Hot lead -- high intent, actively looking",
    },
    "warm": {
        "min_days": 7,
        "max_days": 7,
        "description": "Warm lead -- interested but not urgent",
    },
    "cold": {
        "min_days": 14,
        "max_days": 14,
        "description": "Cold lead -- low engagement, needs re-activation",
    },
    "nurture": {
        "min_days": 30,
        "max_days": 30,
        "description": "Nurture -- long-term drip, value-first touches",
    },
    "sphere": {
        "min_days": 90,
        "max_days": 90,
        "description": "Sphere of influence / past client",
    },
    "past_client": {
        "min_days": 90,
        "max_days": 90,
        "description": "Past client -- relationship maintenance",
    },
    "fsbo": {
        "min_days": 7,
        "max_days": 7,
        "description": "For Sale By Owner -- persistent but respectful outreach",
    },
    "expired": {
        "min_days": 3,
        "max_days": 3,
        "description": "Expired listing -- aggressive early cadence (first 2 weeks)",
        "window_days": 14,
    },
}

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
logging.basicConfig(level=logging.INFO, format=LOG_FORMAT)
log = logging.getLogger("follow_up_engine")

# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

LEADS_QUERY = """
SELECT
    p.id                    AS person_id,
    p."nameFirstName"       AS first_name,
    p."nameLastName"        AS last_name,
    p.emails                AS emails,
    p.phones                AS phones,
    p.city                  AS city,
    ps."name"               AS pipeline_stage,
    lt."name"               AS lead_type,
    a."createdAt"           AS last_activity_at,
    a.body                  AS last_activity_body
FROM person p
LEFT JOIN LATERAL (
    SELECT pos."name"
    FROM "pipelineStepOpportunity" pso
    JOIN "pipelineStep" pos ON pos.id = pso."pipelineStepId"
    JOIN opportunity o       ON o.id  = pso."opportunityId"
    WHERE o."personId" = p.id
    ORDER BY pso."createdAt" DESC
    LIMIT 1
) ps ON true
LEFT JOIN LATERAL (
    SELECT t."name"
    FROM "personTag" pt
    JOIN tag t ON t.id = pt."tagId"
    WHERE pt."personId" = p.id
    ORDER BY pt."createdAt" DESC
    LIMIT 1
) lt ON true
LEFT JOIN LATERAL (
    SELECT a2."createdAt", a2.body
    FROM activity a2
    JOIN "activityTarget" at2 ON at2."activityId" = a2.id
    WHERE at2."personId" = p.id
    ORDER BY a2."createdAt" DESC
    LIMIT 1
) a ON true
WHERE p."deletedAt" IS NULL
ORDER BY a."createdAt" ASC NULLS FIRST;
"""

# Simplified fallback query if the Twenty CRM schema above fails
# (e.g. different version or custom schema). Adjusts to a flat leads table.
LEADS_QUERY_FALLBACK = """
SELECT
    id              AS person_id,
    first_name,
    last_name,
    email           AS emails,
    phone           AS phones,
    city,
    pipeline_stage,
    lead_type,
    last_contact_at AS last_activity_at,
    last_note       AS last_activity_body
FROM leads
WHERE deleted_at IS NULL
ORDER BY last_contact_at ASC NULLS FIRST;
"""


def connect_db() -> psycopg2.extensions.connection:
    """Open a connection to the CRM database."""
    log.info(
        "Connecting to PostgreSQL %s:%s/%s as %s",
        DB_CONFIG["host"],
        DB_CONFIG["port"],
        DB_CONFIG["dbname"],
        DB_CONFIG["user"],
    )
    return psycopg2.connect(**DB_CONFIG)


def fetch_leads(conn: psycopg2.extensions.connection) -> list[dict[str, Any]]:
    """Return all leads with their latest activity."""
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        try:
            cur.execute(LEADS_QUERY)
        except psycopg2.errors.UndefinedTable:
            conn.rollback()
            log.warning(
                "Primary schema query failed; trying fallback flat-table query."
            )
            cur.execute(LEADS_QUERY_FALLBACK)
        rows = cur.fetchall()
    log.info("Fetched %d leads from database.", len(rows))
    return [dict(r) for r in rows]


# ---------------------------------------------------------------------------
# Follow-up eligibility
# ---------------------------------------------------------------------------


def _normalize_stage(raw: str | None) -> str:
    """Map various stage labels to our canonical cadence keys."""
    if raw is None:
        return "cold"
    s = raw.strip().lower().replace(" ", "_").replace("-", "_")
    # handle common synonyms
    if s in CADENCE:
        return s
    if "past" in s and "client" in s:
        return "past_client"
    if "sphere" in s:
        return "sphere"
    if "fsbo" in s or "for_sale_by_owner" in s:
        return "fsbo"
    if "expire" in s:
        return "expired"
    if "hot" in s:
        return "hot"
    if "warm" in s:
        return "warm"
    if "nurture" in s:
        return "nurture"
    return "cold"


def needs_follow_up(lead: dict[str, Any], now: datetime) -> bool:
    """Decide whether a lead is due for follow-up."""
    stage = _normalize_stage(lead.get("pipeline_stage"))
    cadence = CADENCE.get(stage, CADENCE["cold"])

    last_contact = lead.get("last_activity_at")
    if last_contact is None:
        # Never contacted -- always due
        return True

    if isinstance(last_contact, str):
        last_contact = datetime.fromisoformat(last_contact)
    if last_contact.tzinfo is None:
        last_contact = last_contact.replace(tzinfo=timezone.utc)

    days_since = (now - last_contact).days

    # Expired leads: only aggressive cadence within the first 2 weeks
    if stage == "expired":
        window = cadence.get("window_days", 14)
        # If the lead entered the expired stage more than `window` days ago,
        # fall back to cold cadence.
        if days_since > window:
            return days_since >= CADENCE["cold"]["min_days"]

    return days_since >= cadence["min_days"]


# ---------------------------------------------------------------------------
# Preferred contact channel
# ---------------------------------------------------------------------------


def preferred_channel(lead: dict[str, Any]) -> str:
    """Pick the best outreach channel for the lead."""
    phones = lead.get("phones")
    emails = lead.get("emails")

    has_phone = False
    if isinstance(phones, list) and phones:
        has_phone = True
    elif isinstance(phones, str) and phones.strip():
        has_phone = True

    has_email = False
    if isinstance(emails, list) and emails:
        has_email = True
    elif isinstance(emails, str) and emails.strip():
        has_email = True

    stage = _normalize_stage(lead.get("pipeline_stage"))

    # Hot / expired / FSBO: prefer SMS for speed
    if stage in ("hot", "expired", "fsbo") and has_phone:
        return "sms"
    # Default to email, fall back to SMS, then iMessage
    if has_email:
        return "email"
    if has_phone:
        return "sms"
    return "imessage"


# ---------------------------------------------------------------------------
# AI message generation via Ollama
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """\
You are a real estate follow-up assistant trained in Brandon Mulrenin's \
Reverse Selling methodology. Core principles you MUST follow:

1. NEVER be pushy or salesy. Lead with genuine curiosity and empathy.
2. Ask permission-based questions: "Would it be okay if..." / "Would you \
be open to..."
3. Use negative framing / take-away selling: "I'm not sure if this would \
even make sense for you, but..."
4. Mirror the prospect's language and emotional state.
5. Focus on THEIR motivation, timeline, and pain -- not your services.
6. If the lead is cold or unresponsive, use a break-up / pattern-interrupt \
message to re-engage.
7. Keep messages concise and conversational. No corporate jargon.
8. End with exactly ONE low-pressure question to invite a reply.

COMPLIANCE (NJ Real Estate Law, NAR/NCJAR Code of Ethics):
- Never disparage another agent or brokerage.
- Never guarantee sale prices, timelines, or results.
- If the lead is working with another agent, do not attempt to interfere.
- Always identify as "Teddy from George Ramirez's team at Keller Williams."
- This is not intended to solicit currently listed properties.
- Respect opt-out requests immediately.

Adapt tone and length to the contact channel:
- SMS: 1-3 short sentences. Casual. No subject line.
- Email: Short paragraph (3-5 sentences). Include a subject line on its own \
first line prefixed with "Subject: ".
- iMessage: Same as SMS but can be slightly longer.
"""


def _build_user_prompt(lead: dict[str, Any], channel: str) -> str:
    first = lead.get("first_name") or "there"
    last = lead.get("last_name") or ""
    stage = _normalize_stage(lead.get("pipeline_stage"))
    lead_type = lead.get("lead_type") or "unknown"
    city = lead.get("city") or "their area"
    last_note = lead.get("last_activity_body") or "No prior conversation on file."
    cadence_desc = CADENCE.get(stage, CADENCE["cold"])["description"]

    return f"""\
Generate a follow-up message for the lead below. Channel: {channel}.

Lead name: {first} {last}
Pipeline stage: {stage} -- {cadence_desc}
Lead type / source: {lead_type}
City: {city}
Last conversation summary: {last_note}

Write ONLY the message text (and subject line for email). Nothing else."""


def generate_message(
    lead: dict[str, Any],
    channel: str,
    client: httpx.Client,
) -> str:
    """Call Ollama to generate a follow-up message."""
    user_prompt = _build_user_prompt(lead, channel)
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        "stream": False,
        "options": {
            "temperature": 0.7,
            "top_p": 0.9,
            "num_predict": 300,
        },
    }

    url = f"{OLLAMA_BASE_URL}/api/chat"
    log.debug("POST %s  model=%s", url, OLLAMA_MODEL)

    try:
        resp = client.post(url, json=payload, timeout=120.0)
        resp.raise_for_status()
        data = resp.json()
        return data["message"]["content"].strip()
    except httpx.HTTPStatusError as exc:
        log.error(
            "Ollama returned %s: %s",
            exc.response.status_code,
            exc.response.text[:500],
        )
        raise
    except (httpx.RequestError, KeyError) as exc:
        log.error("Ollama request failed: %s", exc)
        raise


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------


def write_output(records: list[dict[str, Any]], run_id: str) -> Path:
    """Write follow-up messages to a JSON file for n8n ingestion."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    filename = f"follow_ups_{timestamp}_{run_id[:8]}.json"
    path = OUTPUT_DIR / filename

    envelope = {
        "run_id": run_id,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "count": len(records),
        "follow_ups": records,
    }

    path.write_text(json.dumps(envelope, indent=2, default=str), encoding="utf-8")
    log.info("Wrote %d follow-up(s) to %s", len(records), path)
    return path


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------


def run(dry_run: bool = False) -> Path | None:
    """Execute one full follow-up cycle."""
    run_id = uuid.uuid4().hex
    now = datetime.now(timezone.utc)
    log.info("=== Follow-Up Engine  run_id=%s  ts=%s ===", run_id[:8], now.isoformat())

    # 1. Fetch leads
    conn = connect_db()
    try:
        leads = fetch_leads(conn)
    finally:
        conn.close()

    if not leads:
        log.info("No leads found. Exiting.")
        return None

    # 2. Filter to those needing follow-up
    due = [ld for ld in leads if needs_follow_up(ld, now)]
    log.info("%d / %d leads are due for follow-up.", len(due), len(leads))

    if not due:
        log.info("Nothing to do. Exiting.")
        return None

    # 3. Generate messages
    results: list[dict[str, Any]] = []

    with httpx.Client() as client:
        for i, lead in enumerate(due, 1):
            name = f"{lead.get('first_name', '')} {lead.get('last_name', '')}".strip()
            stage = _normalize_stage(lead.get("pipeline_stage"))
            channel = preferred_channel(lead)
            log.info(
                "[%d/%d] Generating %s message for %s (stage=%s)",
                i,
                len(due),
                channel,
                name or lead["person_id"],
                stage,
            )

            if dry_run:
                message_text = (
                    f"[DRY RUN] Would generate {channel} message for {name}"
                )
            else:
                try:
                    message_text = generate_message(lead, channel, client)
                except Exception:
                    log.exception("Failed to generate message for %s -- skipping.", name)
                    continue

            # Extract email subject if present
            subject = None
            body = message_text
            if channel == "email" and message_text.lower().startswith("subject:"):
                lines = message_text.split("\n", 1)
                subject = lines[0].split(":", 1)[1].strip()
                body = lines[1].strip() if len(lines) > 1 else ""

            record = {
                "person_id": str(lead.get("person_id", "")),
                "name": name,
                "pipeline_stage": stage,
                "channel": channel,
                "subject": subject,
                "message": body,
                "emails": lead.get("emails"),
                "phones": lead.get("phones"),
                "generated_at": datetime.now(timezone.utc).isoformat(),
            }
            results.append(record)

    if not results:
        log.warning("No messages were generated.")
        return None

    # 4. Write output
    return write_output(results, run_id)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(
        description="AI Follow-Up Engine for Real Estate CRM"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Skip Ollama calls; write placeholder messages instead.",
    )
    parser.add_argument(
        "--verbose", "-v", action="store_true", help="Enable DEBUG logging."
    )
    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    try:
        output_path = run(dry_run=args.dry_run)
        if output_path:
            print(f"Done. Output: {output_path}")
        else:
            print("Done. No follow-ups generated.")
    except psycopg2.OperationalError as exc:
        log.critical("Cannot connect to database: %s", exc)
        sys.exit(1)
    except Exception:
        log.exception("Unexpected error.")
        sys.exit(2)


if __name__ == "__main__":
    main()
