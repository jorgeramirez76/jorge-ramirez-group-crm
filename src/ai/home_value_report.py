"""
AI Home Value Report Generator
Creates personalized monthly home value reports for leads/sphere.
Replaces Homebot — uses Gemma 4 to write personalized market analysis.
"""

import os
import json
import logging
from datetime import datetime
from pathlib import Path
import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("home-value-report")

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma4:31b")
EMAIL_API = os.getenv("EMAIL_API_URL", "http://localhost:8200")
OUTPUT_DIR = Path(__file__).parent / "output" / "home_value_reports"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

REPORT_PROMPT = """\
You are a real estate market analyst for The Jorge Ramirez Group at Keller Williams \
Premier Properties. Generate a personalized home value update for a homeowner.

Write an email that includes:
1. A personalized greeting using their name
2. An estimated current value range for their home (based on the neighborhood data provided)
3. How their home's value has changed in the past 12 months (estimate a reasonable percentage)
4. 2-3 recent comparable sales in their neighborhood
5. A brief market outlook for their area (1-2 sentences)
6. A soft CTA: "If you're curious about a more precise valuation, George would be happy \
to pull a detailed CMA — no strings attached."

Keep it concise — the whole email should be readable in under 60 seconds.
Sign as "Teddy, The Jorge Ramirez Group"

COMPLIANCE: State that this is an estimated value based on publicly available data. \
A formal appraisal would be needed for an accurate valuation. Do not guarantee values.
"""


def generate_report(lead: dict) -> dict:
    """Generate a home value report for a specific lead."""
    name = lead.get("first_name", "Homeowner")
    address = lead.get("address", "your home")
    city = lead.get("city", "Summit")
    state = lead.get("state", "NJ")

    logger.info(f"Generating home value report for {name} at {address}")

    with httpx.Client(timeout=120.0) as client:
        resp = client.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": REPORT_PROMPT},
                    {
                        "role": "user",
                        "content": (
                            f"Generate a home value report for:\n"
                            f"Name: {name}\n"
                            f"Property: {address}, {city}, {state}\n"
                            f"Neighborhood: {city} area, Central/Northern NJ\n"
                            f"Date: {datetime.now().strftime('%B %Y')}\n\n"
                            f"Use realistic data for the {city}, NJ luxury market."
                        ),
                    },
                ],
                "stream": False,
                "options": {"temperature": 0.7, "num_predict": 600},
            },
        )
        content = resp.json().get("message", {}).get("content", "")

    subject = f"Your {city} Home Value Update — {datetime.now().strftime('%B %Y')}"

    result = {
        "lead_name": name,
        "address": address,
        "city": city,
        "subject": subject,
        "body": content,
        "generated_at": datetime.utcnow().isoformat(),
    }

    filename = f"hvr_{name.lower().replace(' ','_')}_{datetime.now().strftime('%Y%m')}.json"
    with open(OUTPUT_DIR / filename, "w") as f:
        json.dump(result, f, indent=2)
    logger.info(f"Report saved to {OUTPUT_DIR / filename}")

    return result


def send_report(report: dict, email: str):
    """Send home value report via email."""
    with httpx.Client(timeout=30.0) as client:
        client.post(
            f"{EMAIL_API}/api/email/send",
            json={
                "to": email,
                "subject": report["subject"],
                "body": report["body"],
                "lead": {"first_name": report["lead_name"], "address": report["address"]},
            },
        )
    logger.info(f"Report sent to {email}")


if __name__ == "__main__":
    test_lead = {
        "first_name": "Sarah",
        "address": "45 Oak Ridge Road",
        "city": "Summit",
        "state": "NJ",
    }
    report = generate_report(test_lead)
    print(f"\nSubject: {report['subject']}\n")
    print(report["body"])
