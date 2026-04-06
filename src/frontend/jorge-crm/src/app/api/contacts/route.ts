import { NextResponse } from "next/server";
import {
  twentyFetch,
  TwentyPerson,
  extractEmail,
  extractPhone,
  formatPersonName,
  timeAgo,
} from "@/lib/twenty-api";

function mapPipelineStage(stage?: string): string {
  if (!stage) return "New";
  // Normalize the stage value to match dashboard expectations
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

function formatContact(person: TwentyPerson) {
  return {
    id: person.id,
    name: formatPersonName(person),
    type: mapLeadType(person.leadType),
    stage: mapPipelineStage(person.pipelineStage),
    phone: extractPhone(person),
    email: extractEmail(person),
    lastActivity: timeAgo(person.updatedAt),
    assignedTo: person.assignedAgent || "AI",
    notes: person.desiredAreas
      ? `Looking in ${person.desiredAreas}. ${person.priceRange ? `Budget: ${person.priceRange}.` : ""} ${person.timeline ? `Timeline: ${person.timeline}.` : ""}`.trim()
      : undefined,
    address: person.propertyAddress || person.city || undefined,
  };
}

export async function GET() {
  try {
    const resp = await twentyFetch("/people?limit=100");
    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("Twenty CRM API error:", resp.status, errorText);
      return NextResponse.json(
        { error: "Failed to fetch contacts from CRM", detail: errorText },
        { status: resp.status }
      );
    }

    const json = await resp.json();
    // Twenty CRM returns { data: { people: [...] } } or { data: [...] }
    const people: TwentyPerson[] = json.data?.people || json.data || json.people || [];

    const contacts = people.map(formatContact);

    return NextResponse.json({
      contacts,
      total: contacts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to connect to CRM", detail: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Build the Twenty CRM person payload
    const personPayload: Record<string, unknown> = {
      name: {
        firstName: body.firstName || "",
        lastName: body.lastName || "",
      },
      emails: {
        primaryEmail: body.email || "",
      },
      phones: {
        primaryPhoneNumber: body.phone || "",
      },
    };

    // Map custom fields if provided
    if (body.leadType) personPayload.leadType = body.leadType;
    if (body.pipelineStage) personPayload.pipelineStage = body.pipelineStage;
    if (body.propertyAddress) personPayload.propertyAddress = body.propertyAddress;
    if (body.priceRange) personPayload.priceRange = body.priceRange;
    if (body.bedrooms) personPayload.bedrooms = body.bedrooms;
    if (body.desiredAreas) personPayload.desiredAreas = body.desiredAreas;
    if (body.timeline) personPayload.timeline = body.timeline;
    if (body.leadSource) personPayload.leadSource = body.leadSource;
    if (body.aiStatus) personPayload.aiStatus = body.aiStatus;
    if (body.assignedAgent) personPayload.assignedAgent = body.assignedAgent;
    if (body.city) personPayload.city = body.city;

    const resp = await twentyFetch("/people", {
      method: "POST",
      body: JSON.stringify(personPayload),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("Twenty CRM create error:", resp.status, errorText);
      return NextResponse.json(
        { error: "Failed to create contact", detail: errorText },
        { status: resp.status }
      );
    }

    const created = await resp.json();
    return NextResponse.json({
      contact: formatContact(created.data || created),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact", detail: String(error) },
      { status: 500 }
    );
  }
}
