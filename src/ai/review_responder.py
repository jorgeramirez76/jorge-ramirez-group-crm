"""
AI Review Responder
Monitors Google Business Profile reviews and generates personalized AI responses.
Uses Gemma 4 to write professional, warm responses.
"""

import os
import json
import logging
from datetime import datetime
from pathlib import Path
import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("review-responder")

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma4:31b")
OUTPUT_DIR = Path(__file__).parent / "output" / "reviews"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

REVIEW_RESPONSE_PROMPT = """\
You are George Ramirez, lead agent at The Jorge Ramirez Group, Keller Williams \
Premier Properties, serving Central and Northern New Jersey.

Write a response to the following online review. Rules:

1. Be genuine and personal — reference specific details from their review
2. Thank them warmly
3. If positive (4-5 stars): Express gratitude, mention how much you enjoyed \
working with them, wish them well in their new home
4. If neutral (3 stars): Thank them for the feedback, acknowledge what could \
be improved, express desire to do better
5. If negative (1-2 stars): Respond professionally, acknowledge their frustration, \
offer to discuss offline, do NOT get defensive
6. Keep it to 3-4 sentences max
7. Sign as "George Ramirez, The Jorge Ramirez Group"

COMPLIANCE: Never disparage the reviewer. Never reveal private transaction details. \
Always maintain professionalism regardless of the review content.
"""


def generate_response(review: dict) -> dict:
    """Generate an AI response to a review."""
    reviewer_name = review.get("reviewer_name", "Valued Client")
    rating = review.get("rating", 5)
    review_text = review.get("text", "")
    source = review.get("source", "Google")

    logger.info(f"Generating response to {rating}-star review from {reviewer_name} on {source}")

    with httpx.Client(timeout=120.0) as client:
        resp = client.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": REVIEW_RESPONSE_PROMPT},
                    {
                        "role": "user",
                        "content": f"Review from {reviewer_name} ({rating} stars on {source}):\n\n"
                        f'"{review_text}"',
                    },
                ],
                "stream": False,
                "options": {"temperature": 0.7, "num_predict": 200},
            },
        )
        response_text = resp.json().get("message", {}).get("content", "")

    result = {
        "reviewer_name": reviewer_name,
        "rating": rating,
        "source": source,
        "review_text": review_text,
        "ai_response": response_text,
        "generated_at": datetime.utcnow().isoformat(),
        "status": "pending_approval",
    }

    # Save response
    filename = f"review_response_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(OUTPUT_DIR / filename, "w") as f:
        json.dump(result, f, indent=2)
    logger.info(f"Response saved to {OUTPUT_DIR / filename}")

    return result


def process_reviews(reviews: list[dict]) -> list[dict]:
    """Process a batch of reviews and generate responses."""
    responses = []
    for review in reviews:
        try:
            response = generate_response(review)
            responses.append(response)
        except Exception as e:
            logger.error(f"Failed to process review from {review.get('reviewer_name')}: {e}")
    return responses


if __name__ == "__main__":
    # Example usage / test
    test_reviews = [
        {
            "reviewer_name": "Sarah M.",
            "rating": 5,
            "source": "Google",
            "text": "George and his team were absolutely wonderful! They sold our home in Summit in just 12 days, well above asking price. Teddy kept us informed every step of the way. Couldn't recommend them more highly!",
        },
        {
            "reviewer_name": "Michael T.",
            "rating": 3,
            "source": "Zillow",
            "text": "The team did a decent job but communication could have been better during the closing process. The sale went through but I felt out of the loop at times.",
        },
    ]

    print("Processing test reviews...\n")
    responses = process_reviews(test_reviews)
    for r in responses:
        print(f"{'='*60}")
        print(f"Review from {r['reviewer_name']} ({r['rating']} stars on {r['source']}):")
        print(f'  "{r["review_text"][:80]}..."')
        print(f"\nAI Response:")
        print(f"  {r['ai_response']}")
        print()
