import { NextResponse } from "next/server";

const CRM_CONNECTOR = process.env.CRM_CONNECTOR_URL || "http://localhost:8000";

export async function GET() {
  try {
    // Check health of all services
    const healthResp = await fetch(`${CRM_CONNECTOR}/health`, {
      cache: "no-store",
    });
    const health = await healthResp.json();

    // For now, return mock stats that will be replaced with real CRM data
    // once Twenty CRM account is created and API key is configured
    return NextResponse.json({
      stats: {
        newLeads: 12,
        aiNurturing: 48,
        appointments: 5,
        activeClients: 8,
        underContract: 3,
        closedYTD: 14,
      },
      services: health.services,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        stats: {
          newLeads: 0,
          aiNurturing: 0,
          appointments: 0,
          activeClients: 0,
          underContract: 0,
          closedYTD: 0,
        },
        services: { status: "offline" },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
