"""
iMessage Sender for macOS
Sends iMessages (and SMS fallback) via AppleScript through Messages.app.
Designed for automated CRM workflows (real estate lead follow-up).

Usage:
    from imessage_sender import send_message
    result = send_message("+15551234567", "Thanks for your interest in the property!")
"""

import logging
import re
import subprocess
import time
from dataclasses import dataclass
from enum import Enum
from typing import Optional

logger = logging.getLogger(__name__)


class MessageStatus(str, Enum):
    SENT = "sent"
    FAILED = "failed"
    INVALID_INPUT = "invalid_input"


@dataclass
class MessageResult:
    status: MessageStatus
    phone_number: str
    message_text: str
    error: Optional[str] = None
    delivery_service: Optional[str] = None  # "iMessage" or "SMS"

    def to_dict(self) -> dict:
        return {
            "status": self.status.value,
            "phone_number": self.phone_number,
            "message_text": self.message_text,
            "error": self.error,
            "delivery_service": self.delivery_service,
        }


def _normalize_phone(phone_number: str) -> str:
    """Strip a phone number down to digits, preserving a leading +."""
    digits = re.sub(r"[^\d+]", "", phone_number)
    if not digits.startswith("+"):
        # Assume US number if 10 digits with no country code
        bare = digits.lstrip("+")
        if len(bare) == 10:
            digits = "+1" + bare
        elif len(bare) == 11 and bare.startswith("1"):
            digits = "+" + bare
    return digits


def _validate_phone(phone_number: str) -> Optional[str]:
    """Return an error string if the phone number looks invalid, else None."""
    digits = re.sub(r"[^\d]", "", phone_number)
    if len(digits) < 10 or len(digits) > 15:
        return f"Phone number must be 10-15 digits, got {len(digits)}"
    return None


def _validate_message(text: str) -> Optional[str]:
    """Return an error string if the message text is problematic, else None."""
    if not text or not text.strip():
        return "Message text cannot be empty"
    if len(text) > 5000:
        return f"Message text too long ({len(text)} chars, max 5000)"
    return None


def _build_applescript(phone_number: str, message_text: str, service: str) -> str:
    """
    Build the AppleScript that tells Messages.app to send a message.

    `service` should be "iMessage" or "SMS".
    """
    # Escape backslashes and double-quotes for AppleScript string literals.
    escaped = message_text.replace("\\", "\\\\").replace('"', '\\"')

    return f'''
tell application "Messages"
    set targetService to 1st service whose service type = {service}
    set targetBuddy to buddy "{phone_number}" of targetService
    send "{escaped}" to targetBuddy
end tell
'''


def _run_applescript(script: str, timeout: int = 30) -> subprocess.CompletedProcess:
    """Execute an AppleScript via osascript and return the CompletedProcess."""
    return subprocess.run(
        ["osascript", "-e", script],
        capture_output=True,
        text=True,
        timeout=timeout,
    )


def send_message(
    phone_number: str,
    message_text: str,
    *,
    prefer_imessage: bool = True,
    timeout: int = 30,
) -> MessageResult:
    """
    Send a message to `phone_number` via macOS Messages.app.

    Tries iMessage first. If that fails and `prefer_imessage` is True,
    falls back to SMS automatically.

    Args:
        phone_number: Destination phone (E.164 recommended, e.g. "+15551234567").
        message_text: The body of the message.
        prefer_imessage: When True (default), try iMessage first then fall back to SMS.
        timeout: Seconds to wait for osascript before giving up.

    Returns:
        MessageResult with status, delivery_service, and optional error detail.
    """
    # --- input validation ---
    phone_error = _validate_phone(phone_number)
    if phone_error:
        logger.warning("Invalid phone number %r: %s", phone_number, phone_error)
        return MessageResult(
            status=MessageStatus.INVALID_INPUT,
            phone_number=phone_number,
            message_text=message_text,
            error=phone_error,
        )

    msg_error = _validate_message(message_text)
    if msg_error:
        logger.warning("Invalid message text: %s", msg_error)
        return MessageResult(
            status=MessageStatus.INVALID_INPUT,
            phone_number=phone_number,
            message_text=message_text,
            error=msg_error,
        )

    normalized = _normalize_phone(phone_number)

    # Determine the order of services to try.
    # AppleScript service type constant: iMessage or SMS
    services = ["iMessage", "SMS"] if prefer_imessage else ["SMS", "iMessage"]

    last_error = ""
    for service in services:
        script = _build_applescript(normalized, message_text, service)
        logger.info(
            "Attempting to send via %s to %s (%d chars)",
            service,
            normalized,
            len(message_text),
        )

        try:
            result = _run_applescript(script, timeout=timeout)
        except subprocess.TimeoutExpired:
            last_error = f"osascript timed out after {timeout}s for {service}"
            logger.warning(last_error)
            continue
        except FileNotFoundError:
            last_error = "osascript not found -- this must run on macOS"
            logger.error(last_error)
            return MessageResult(
                status=MessageStatus.FAILED,
                phone_number=normalized,
                message_text=message_text,
                error=last_error,
            )

        if result.returncode == 0:
            logger.info("Message sent via %s to %s", service, normalized)
            return MessageResult(
                status=MessageStatus.SENT,
                phone_number=normalized,
                message_text=message_text,
                delivery_service=service,
            )

        stderr = result.stderr.strip()
        last_error = f"{service} send failed (rc={result.returncode}): {stderr}"
        logger.warning(last_error)
        # Brief pause before trying the fallback service.
        time.sleep(1)

    # All services exhausted.
    logger.error("All delivery attempts failed for %s", normalized)
    return MessageResult(
        status=MessageStatus.FAILED,
        phone_number=normalized,
        message_text=message_text,
        error=last_error,
    )


# ---------------------------------------------------------------------------
# CLI convenience
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import argparse

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    parser = argparse.ArgumentParser(description="Send an iMessage from the CLI")
    parser.add_argument("phone_number", help="Recipient phone number")
    parser.add_argument("message_text", help="Message body")
    parser.add_argument(
        "--sms-only",
        action="store_true",
        help="Skip iMessage, send via SMS only",
    )
    args = parser.parse_args()

    res = send_message(
        args.phone_number,
        args.message_text,
        prefer_imessage=not args.sms_only,
    )
    print(res.to_dict())
