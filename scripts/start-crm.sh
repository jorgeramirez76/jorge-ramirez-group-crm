#!/bin/bash
# Jorge Ramirez Group CRM — Master Startup Script
# Starts ALL services with one command

set -e

PROJECT_DIR="/Users/teddy/GPT-SoVITS"
PYTHON="/opt/homebrew/Caskroom/miniconda/base/envs/GPTSoVits/bin/python"
DASHBOARD_DIR="$PROJECT_DIR/src/frontend/jorge-crm"

echo ""
echo "  ╔═══════════════════════════════════════╗"
echo "  ║   Jorge Ramirez Group CRM             ║"
echo "  ║   AI-Powered Real Estate Platform     ║"
echo "  ╚═══════════════════════════════════════╝"
echo ""

# 1. Docker services
echo "[1/6] Starting Docker services..."
cd "$PROJECT_DIR"
docker compose up -d 2>/dev/null
echo "  ✓ PostgreSQL, Redis, Twenty CRM, n8n, Chatwoot"

# 2. Ollama
echo ""
echo "[2/6] Checking Ollama AI..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "  ✓ Ollama running"
else
    echo "  Starting Ollama..."
    brew services start ollama 2>/dev/null
    sleep 5
    echo "  ✓ Ollama started"
fi

# 3. Communication microservices
echo ""
echo "[3/6] Starting communication services..."

cd "$PROJECT_DIR"

# Twilio SMS Bridge
$PYTHON -m uvicorn src.communications.twilio_webhook:app --host 0.0.0.0 --port 8100 &>/tmp/crm-sms.log &
echo "  ✓ SMS Bridge (port 8100)"

# Email Sender
$PYTHON -m uvicorn src.communications.email_sender:app --host 0.0.0.0 --port 8200 &>/tmp/crm-email.log &
echo "  ✓ Email Sender (port 8200)"

# iMessage API
$PYTHON -m uvicorn src.communications.imessage_api:app --host 0.0.0.0 --port 8300 &>/tmp/crm-imessage.log &
echo "  ✓ iMessage API (port 8300)"

# 4. Integration services
echo ""
echo "[4/6] Starting integration services..."

# CRM Connector (API gateway)
$PYTHON -m uvicorn src.integrations.crm_connector:app --host 0.0.0.0 --port 8000 &>/tmp/crm-connector.log &
echo "  ✓ CRM Connector (port 8000)"

# Contract Manager
$PYTHON -m uvicorn src.integrations.contract_manager:app --host 0.0.0.0 --port 8400 &>/tmp/crm-contracts.log &
echo "  ✓ Contract Manager (port 8400)"

# 5. Dashboard
echo ""
echo "[5/6] Starting dashboard..."
cd "$DASHBOARD_DIR"
npm start -- -p 3333 &>/tmp/crm-dashboard.log &
echo "  ✓ Dashboard (port 3333)"

# 6. Wait and verify
echo ""
echo "[6/6] Verifying services..."
sleep 5

SERVICES_OK=0
for port_name in "3000:Twenty CRM" "3333:Dashboard" "5678:n8n" "4100:Chatwoot" "8000:Connector" "8100:SMS" "8200:Email" "8300:iMessage" "8400:Contracts" "11434:Ollama"; do
    port="${port_name%%:*}"
    name="${port_name##*:}"
    if curl -s -o /dev/null http://localhost:$port 2>/dev/null; then
        echo "  ✓ $name (port $port)"
        SERVICES_OK=$((SERVICES_OK + 1))
    else
        echo "  ⏳ $name (port $port) — still starting"
    fi
done

echo ""
echo "  ╔═══════════════════════════════════════╗"
echo "  ║   $SERVICES_OK/8 services running                ║"
echo "  ╠═══════════════════════════════════════╣"
echo "  ║                                       ║"
echo "  ║   Dashboard:    http://localhost:3333  ║"
echo "  ║   CRM:          http://localhost:3001  ║"
echo "  ║   Automations:  http://localhost:5678  ║"
echo "  ║   Inbox:        http://localhost:4100  ║"
echo "  ║   Contracts:    http://localhost:8400  ║"
echo "  ║   API Gateway:  http://localhost:8000  ║"
echo "  ║                                       ║"
echo "  ╚═══════════════════════════════════════╝"
echo ""
