"""
Email Warm-Up Script
Gradually increases email sending volume over 4 weeks to build sender reputation.

Schedule:
  Week 1:  5 emails/day
  Week 2: 15 emails/day
  Week 3: 30 emails/day
  Week 4+: Full volume (all seeds per run)

Run as a daily cron job:
  0 9 * * * cd /path/to/project && python src/communications/email_warmup.py

Requires:
  - Seed email config at src/communications/warmup_seeds.json
  - Email sender API running at http://localhost:8200
"""

import json
import logging
import os
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path

import httpx

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

BASE_DIR = Path(__file__).parent
SEEDS_FILE = BASE_DIR / "warmup_seeds.json"
STATE_FILE = BASE_DIR / "warmup_state.json"
LOG_FILE = BASE_DIR / "warmup.log"

EMAIL_API_URL = os.getenv("EMAIL_API_URL", "http://localhost:8200/api/email/send")

# Volume ramp: (days_since_start, emails_per_day)
VOLUME_SCHEDULE = [
    (0, 5),    # Week 1: days 0-6
    (7, 15),   # Week 2: days 7-13
    (14, 30),  # Week 3: days 14-20
    (21, -1),  # Week 4+: unlimited (send to all seeds)
]

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger("email-warmup")

# ---------------------------------------------------------------------------
# Warm-up email templates — natural-sounding messages that encourage opens
# and replies to boost engagement signals.
# ---------------------------------------------------------------------------

WARMUP_TEMPLATES = [
    {
        "subject": "Quick question about the neighborhood",
        "body": (
            "Hi {first_name},\n\n"
            "I was reviewing some listings in your area and had a quick question "
            "about the neighborhood. Would you have a few minutes to chat this week?\n\n"
            "Thanks,\n"
            "George Ramirez\n"
            "The Jorge Ramirez Group"
        ),
    },
    {
        "subject": "Market update for your area",
        "body": (
            "Hi {first_name},\n\n"
            "Just wanted to share a quick market update. Homes in your area have "
            "seen some interesting movement recently. Let me know if you'd like "
            "a detailed report!\n\n"
            "Best,\n"
            "George Ramirez\n"
            "The Jorge Ramirez Group"
        ),
    },
    {
        "subject": "Thanks for connecting!",
        "body": (
            "Hi {first_name},\n\n"
            "Great connecting with you. I wanted to follow up and see if there's "
            "anything I can help with on the real estate side. Always happy to chat.\n\n"
            "Warm regards,\n"
            "George Ramirez\n"
            "The Jorge Ramirez Group"
        ),
    },
    {
        "subject": "Saw something that reminded me of you",
        "body": (
            "Hey {first_name},\n\n"
            "I came across a listing that made me think of our earlier conversation. "
            "Would love to share it with you when you have a moment.\n\n"
            "Talk soon,\n"
            "George Ramirez\n"
            "The Jorge Ramirez Group"
        ),
    },
    {
        "subject": "Home values in Summit — quick note",
        "body": (
            "Hi {first_name},\n\n"
            "Hope you're doing well! I pulled some recent comps near Summit and "
            "thought you might find them interesting. Happy to send them over "
            "if you're curious.\n\n"
            "Cheers,\n"
            "George Ramirez\n"
            "The Jorge Ramirez Group"
        ),
    },
]

# ---------------------------------------------------------------------------
# State management
# ---------------------------------------------------------------------------


def load_state() -> dict:
    """Load warm-up state (start date, daily send log)."""
    if STATE_FILE.exists():
        with open(STATE_FILE) as f:
            return json.load(f)
    return {"start_date": None, "daily_log": {}}


def save_state(state: dict) -> None:
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


def load_seeds() -> list[dict]:
    """Load seed email addresses from config file."""
    if not SEEDS_FILE.exists():
        logger.error(f"Seed file not found: {SEEDS_FILE}")
        logger.error("Create it from warmup_seeds.example.json")
        sys.exit(1)
    with open(SEEDS_FILE) as f:
        data = json.load(f)
    return data.get("seeds", [])


# ---------------------------------------------------------------------------
# Volume calculation
# ---------------------------------------------------------------------------


def get_daily_limit(days_since_start: int) -> int:
    """Return the max number of emails to send today based on the ramp schedule."""
    limit = VOLUME_SCHEDULE[0][1]
    for day_threshold, vol in VOLUME_SCHEDULE:
        if days_since_start >= day_threshold:
            limit = vol
    return limit


# ---------------------------------------------------------------------------
# Sending
# ---------------------------------------------------------------------------


def personalize_template(template: dict, seed: dict) -> dict:
    """Fill in merge variables for a warm-up email."""
    first_name = seed.get("first_name", seed.get("name", "there"))
    return {
        "subject": template["subject"].replace("{first_name}", first_name),
        "body": template["body"].replace("{first_name}", first_name),
    }


def send_warmup_email(to: str, subject: str, body: str) -> dict:
    """Send a single warm-up email via the email sender API."""
    payload = {
        "to": to,
        "subject": subject,
        "body": body,
        "lead": {},  # No lead personalization for warm-up
    }
    try:
        resp = httpx.post(EMAIL_API_URL, json=payload, timeout=30)
        result = resp.json()
        logger.info(f"Sent to {to}: {subject} -> {result.get('status')}")
        return result
    except Exception as e:
        logger.error(f"Failed to send to {to}: {e}")
        return {"status": "error", "detail": str(e)}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def run_warmup() -> None:
    """Execute one day's worth of warm-up sends."""
    state = load_state()
    seeds = load_seeds()
    today = datetime.now().strftime("%Y-%m-%d")

    # Initialize start date on first run
    if state["start_date"] is None:
        state["start_date"] = today
        logger.info(f"Warm-up started on {today}")

    start_date = datetime.strptime(state["start_date"], "%Y-%m-%d")
    days_elapsed = (datetime.now() - start_date).days
    daily_limit = get_daily_limit(days_elapsed)

    # Check how many we already sent today
    already_sent = state["daily_log"].get(today, 0)

    if daily_limit == -1:
        # Full volume — send to all seeds
        effective_limit = len(seeds)
    else:
        effective_limit = daily_limit

    remaining = max(0, effective_limit - already_sent)

    if remaining == 0:
        logger.info(f"Daily limit reached ({effective_limit}). Nothing to send.")
        return

    logger.info(
        f"Day {days_elapsed} of warm-up | "
        f"Limit: {effective_limit}/day | "
        f"Already sent today: {already_sent} | "
        f"Will send: {remaining}"
    )

    # Pick seed recipients for today (shuffle for variety)
    recipients = list(seeds)
    random.shuffle(recipients)
    recipients = recipients[:remaining]

    sent_count = 0
    for seed in recipients:
        email = seed.get("email")
        if not email:
            continue

        template = random.choice(WARMUP_TEMPLATES)
        personalized = personalize_template(template, seed)

        result = send_warmup_email(email, personalized["subject"], personalized["body"])
        if result.get("status") in ("sent", "dry_run"):
            sent_count += 1

    # Update state
    state["daily_log"][today] = already_sent + sent_count
    save_state(state)

    logger.info(f"Warm-up complete: sent {sent_count} emails today (total today: {already_sent + sent_count})")

    # Log cumulative stats
    total_all_time = sum(state["daily_log"].values())
    logger.info(f"Cumulative warm-up emails sent: {total_all_time}")


if __name__ == "__main__":
    run_warmup()
