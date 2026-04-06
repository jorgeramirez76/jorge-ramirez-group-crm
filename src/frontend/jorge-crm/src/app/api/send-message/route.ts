import { NextResponse } from "next/server";

const CRM_CONNECTOR = process.env.CRM_CONNECTOR_URL || "http://localhost:8000";

export async function POST(request: Request) {
  const data = await request.json();

  try {
    const resp = await fetch(`${CRM_CONNECTOR}/api/send-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await resp.json();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { status: "error", detail: String(error) },
      { status: 500 }
    );
  }
}
