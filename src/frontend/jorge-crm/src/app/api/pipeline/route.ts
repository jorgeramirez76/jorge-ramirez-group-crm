import { NextResponse } from "next/server";
import {
  twentyFetch,
  TwentyPerson,
  extractEmail,
  extractPhone,
  formatPersonName,
  timeAgo,
} from "@/lib/twenty-api";

const PIPELINE_STAGES = [
  "New",
  "Nurture",
  "Cold",
  "Warm",
  "Hot",
  "Appt Booked",
  "Active Client",
  "Under Contract",
] as const;

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
  };
  return stageMap[stage.toUpperCase()] || stage;
}

function mapLeadType(type?: string): string {
  if (!type) return "Buyer";
  const typeMap: Record<string, string> = {
    BUYER: "Buyer",
    SELLER: "Seller",
    FSBO: "FSBO",
    EXPIRED: "Expired",
    INVESTOR: "Investor",
    RENTER: "Renter",
    REFERRAL: "Referral",
  };
  return typeMap[type.toUpperCase()] || type;
}

function buildDetail(person: TwentyPerson): string {
  const parts: string[] = [];
  if (person.propertyAddress) parts.push(person.propertyAddress);
  if (person.desiredAreas) parts.push(person.desiredAreas);
  if (person.priceRange) parts.push(person.priceRange);
  if (person.city) parts.push(person.city);
  return parts.join(", ") || extractEmail(person) || extractPhone(person) || "";
}

export async function GET() {
  try {
    const resp = await twentyFetch("/people?limit=100");
    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("Twenty CRM API error:", resp.status, errorText);
      return NextResponse.json(
        { error: "Failed to fetch pipeline data", detail: errorText },
        { status: resp.status }
      );
    }

    const json = await resp.json();
    const people: TwentyPerson[] = json.data?.people || json.data || json.people || [];

    // Group people by pipeline stage
    const pipeline: Record<string, Array<{
      id: string;
      name: string;
      type: string;
      lastActivity: string;
      detail: string;
    }>> = {};

    // Initialize all stages with empty arrays
    for (const stage of PIPELINE_STAGES) {
      pipeline[stage] = [];
    }

    for (const person of people) {
      const stage = normalizePipelineStage(person.pipelineStage);
      if (!pipeline[stage]) {
        pipeline[stage] = [];
      }
      pipeline[stage].push({
        id: person.id,
        name: formatPersonName(person),
        type: mapLeadType(person.leadType),
        lastActivity: timeAgo(person.updatedAt),
        detail: buildDetail(person),
      });
    }

    const totalLeads = people.length;

    return NextResponse.json({
      pipeline,
      totalLeads,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching pipeline:", error);
    return NextResponse.json(
      { error: "Failed to connect to CRM", detail: String(error) },
      { status: 500 }
    );
  }
}
