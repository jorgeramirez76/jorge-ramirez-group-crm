"""
Contract Manager — E-Signature System
Manages buyer agency agreements, listing contracts, and other documents.
Provides PDF generation, e-signature tracking, and automated sending.
Replaces DocuSign for basic contract workflows.
"""

import os
import json
import uuid
import hashlib
import logging
from datetime import datetime
from pathlib import Path
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("contract-manager")

app = FastAPI(title="Contract Manager", version="1.0.0")

CONTRACTS_DIR = Path("/Users/teddy/GPT-SoVITS/data/contracts")
TEMPLATES_DIR = Path("/Users/teddy/GPT-SoVITS/data/contract_templates")
CONTRACTS_DIR.mkdir(parents=True, exist_ok=True)
TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)

EMAIL_API = os.getenv("EMAIL_API_URL", "http://localhost:8200")
BASE_URL = os.getenv("CONTRACT_BASE_URL", "http://localhost:8400")


def generate_contract_id() -> str:
    return str(uuid.uuid4())[:8]


def generate_signing_token(contract_id: str, signer_email: str) -> str:
    secret = os.getenv("CONTRACT_SECRET", "jorge-crm-contract-secret")
    return hashlib.sha256(f"{contract_id}:{signer_email}:{secret}".encode()).hexdigest()[:32]


@app.post("/api/contracts/create")
async def create_contract(request: Request):
    """Create a new contract from a template."""
    data = await request.json()
    template_name = data.get("template", "buyer_agency")
    lead_name = data.get("lead_name", "")
    lead_email = data.get("lead_email", "")
    lead_phone = data.get("lead_phone", "")
    custom_fields = data.get("fields", {})

    contract_id = generate_contract_id()
    signing_token = generate_signing_token(contract_id, lead_email)

    contract = {
        "id": contract_id,
        "template": template_name,
        "lead_name": lead_name,
        "lead_email": lead_email,
        "lead_phone": lead_phone,
        "fields": custom_fields,
        "status": "sent",
        "signing_token": signing_token,
        "signing_url": f"{BASE_URL}/sign/{contract_id}?token={signing_token}",
        "created_at": datetime.utcnow().isoformat(),
        "signed_at": None,
        "signature_data": None,
    }

    with open(CONTRACTS_DIR / f"{contract_id}.json", "w") as f:
        json.dump(contract, f, indent=2)

    logger.info(f"Contract created: {contract_id} for {lead_name} ({template_name})")
    return contract


@app.post("/api/contracts/{contract_id}/send")
async def send_contract(contract_id: str):
    """Send contract signing link via email."""
    contract_path = CONTRACTS_DIR / f"{contract_id}.json"
    if not contract_path.exists():
        raise HTTPException(status_code=404, detail="Contract not found")

    with open(contract_path) as f:
        contract = json.load(f)

    import httpx
    async with httpx.AsyncClient(timeout=30.0) as client:
        await client.post(
            f"{EMAIL_API}/api/email/send",
            json={
                "to": contract["lead_email"],
                "subject": f"Contract Ready for Signature — Jorge Ramirez Group",
                "body": (
                    f"Hi {contract['lead_name']},\n\n"
                    f"Your {contract['template'].replace('_', ' ').title()} is ready for review and signature.\n\n"
                    f"Please click the link below to review and sign:\n"
                    f"{contract['signing_url']}\n\n"
                    f"If you have any questions, don't hesitate to reach out.\n\n"
                    f"Teddy\n"
                    f"The Jorge Ramirez Group | Keller Williams Premier Properties"
                ),
                "lead": {"first_name": contract["lead_name"]},
            },
        )

    logger.info(f"Contract {contract_id} sent to {contract['lead_email']}")
    return {"status": "sent", "contract_id": contract_id}


@app.get("/sign/{contract_id}", response_class=HTMLResponse)
async def signing_page(contract_id: str, token: str = ""):
    """Display contract signing page."""
    contract_path = CONTRACTS_DIR / f"{contract_id}.json"
    if not contract_path.exists():
        raise HTTPException(status_code=404, detail="Contract not found")

    with open(contract_path) as f:
        contract = json.load(f)

    if token != contract.get("signing_token"):
        raise HTTPException(status_code=403, detail="Invalid signing token")

    if contract.get("signed_at"):
        return HTMLResponse(f"""
        <html><body style="font-family: Arial; max-width: 600px; margin: 50px auto; text-align: center;">
        <h2>Contract Already Signed</h2>
        <p>This contract was signed on {contract['signed_at']}.</p>
        <p>Thank you, {contract['lead_name']}!</p>
        </body></html>
        """)

    return HTMLResponse(f"""
    <html>
    <head><title>Sign Contract — Jorge Ramirez Group</title></head>
    <body style="font-family: Arial; max-width: 700px; margin: 50px auto; padding: 20px;">
        <h2>The Jorge Ramirez Group</h2>
        <p style="color: #666;">Keller Williams Premier Properties</p>
        <hr>
        <h3>{contract['template'].replace('_', ' ').title()}</h3>
        <p>Prepared for: <strong>{contract['lead_name']}</strong></p>
        <p>Date: {datetime.now().strftime('%B %d, %Y')}</p>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><em>Contract terms and conditions would be displayed here.</em></p>
            <p><em>In production, this would render the actual contract PDF.</em></p>
        </div>

        <form action="/api/contracts/{contract_id}/sign" method="POST" style="margin-top: 30px;">
            <input type="hidden" name="token" value="{token}">
            <label>Type your full name to sign:</label><br>
            <input type="text" name="signature" required
                   style="width: 100%; padding: 12px; margin: 10px 0; border: 2px solid #333; border-radius: 4px; font-size: 18px;"
                   placeholder="{contract['lead_name']}">
            <br>
            <label><input type="checkbox" required> I agree to the terms and conditions above.</label>
            <br><br>
            <button type="submit"
                    style="background: #1a56db; color: white; padding: 14px 40px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">
                Sign Contract
            </button>
        </form>
    </body>
    </html>
    """)


@app.post("/api/contracts/{contract_id}/sign")
async def sign_contract(contract_id: str, request: Request):
    """Process contract signature."""
    contract_path = CONTRACTS_DIR / f"{contract_id}.json"
    if not contract_path.exists():
        raise HTTPException(status_code=404, detail="Contract not found")

    form_data = await request.form()
    signature = form_data.get("signature", "")
    token = form_data.get("token", "")

    with open(contract_path) as f:
        contract = json.load(f)

    if token != contract.get("signing_token"):
        raise HTTPException(status_code=403, detail="Invalid token")

    contract["status"] = "signed"
    contract["signed_at"] = datetime.utcnow().isoformat()
    contract["signature_data"] = signature

    with open(contract_path, "w") as f:
        json.dump(contract, f, indent=2)

    logger.info(f"Contract {contract_id} signed by {contract['lead_name']}")

    return HTMLResponse(f"""
    <html><body style="font-family: Arial; max-width: 600px; margin: 50px auto; text-align: center;">
    <h2>Contract Signed Successfully!</h2>
    <p>Thank you, {contract['lead_name']}. Your {contract['template'].replace('_', ' ').title()} has been signed.</p>
    <p>George will be in touch shortly.</p>
    <p style="color: #666; margin-top: 30px;">The Jorge Ramirez Group | Keller Williams Premier Properties</p>
    </body></html>
    """)


@app.get("/api/contracts")
async def list_contracts():
    """List all contracts."""
    contracts = []
    for f in CONTRACTS_DIR.glob("*.json"):
        with open(f) as fh:
            contracts.append(json.load(fh))
    contracts.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return {"contracts": contracts}


@app.get("/health")
async def health():
    return {"status": "ok", "service": "contract-manager"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8400)
