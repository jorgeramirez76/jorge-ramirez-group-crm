#!/bin/bash
echo "Stopping CRM services..."
# Kill Python services
pkill -f "uvicorn src.communications" 2>/dev/null
pkill -f "uvicorn src.integrations" 2>/dev/null
# Kill dashboard
pkill -f "next-server.*3333" 2>/dev/null
lsof -ti :3333 | xargs kill 2>/dev/null
# Stop Docker
docker compose down 2>/dev/null
echo "All services stopped."
