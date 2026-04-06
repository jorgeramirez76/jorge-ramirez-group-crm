import { NextResponse } from "next/server";
import { twentyFetch, TwentyPerson } from "@/lib/twenty-api";

const CRM_CONNECTOR = process.env.CRM_CONNECTOR_URL || "http://localhost:8000";

function normalizePipelineStage(stage?: string): string {
  if (!stage) return "New";
  const stageMap: Record<string, string> = {
    NEW: "New",
    NURTURE: "Nurture",
    COLD: "Cold",
    WARM: "Warm",
    HOT: "Hot",
    APPT_BOOKED: "Appt Booked",
    ACTIVE_CLIENT: "Active Client",
    UNDER_CONTRACT: "Under Contract",
    CLOSED: "Closed",
  };
  return stageMap[stage.toUpperCase()] || stage;
}

export async function GET() {
  // Fetch people from Twenty CRM to compute real stats
  let stats = {
    newLeads: 0,
    aiNurturing: 0,
    appointments: 0,
    activeClients: 0,
    underContract: 0,
    closedYTD: 0,
  };

  try {
    const resp = await twentyFetch("/people?limit=100");
    if (resp.ok) {
      const json = await resp.json();
      const people: TwentyPerson[] = json.data?.people || json.data || json.people || [];

      // Count by pipeline stage
      const stageCounts: Record<string, number> = {};
      for (const person of people) {
        const stage = normalizePipelineStage(person.pipelineStage);
        stageCounts[stage] = (stageCounts[stage] || 0) + 1;
      }

      // Count AI-managed leads (those in Nurture, Cold, or Warm with AI assignment)
      const aiNurturing = people.filter((p) => {
        const stage = normalizePipelineStage(p.pipelineStage);
        return (
          ["Nurture", "Cold", "Warm"].includes(stage) ||
          p.assignedAgent === "AI" ||
          p.aiStatus === "active"
        );
      }).length;

      stats = {
        newLeads: stageCounts["New"] || 0,
        aiNurturing,
        appointments: stageCounts["Appt Booked"] || 0,
        activeClients: stageCounts["Active Client"] || 0,
        underContract: stageCounts["Under Contract"] || 0,
        closedYTD: stageCounts["Closed"] || 0,
      };
    }
  } catch (error) {
    console.error("Error fetching people from Twenty CRM:", error);
  }

  // Also try to get service health from CRM connector
  let services: Record<string, unknown> = { status: "unknown" };
  try {
    const healthResp = await fetch(`${CRM_CONNECTOR}/health`, {
      cache: "no-store",
    });
    const health = await healthResp.json();
    services = health.services;
  } catch {
    services = { status: "offline" };
  }

  return NextResponse.json({
    stats,
    services,
    timestamp: new Date().toISOString(),
  });
}
