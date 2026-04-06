import { type NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  readAppointments,
  writeAppointments,
  isValidAppointmentType,
  getDuration,
  triggerN8nWebhook,
  type Appointment,
  type AppointmentType,
} from "@/lib/appointments";

export const dynamic = "force-dynamic";

/**
 * GET /api/appointments
 * Returns all appointments, optionally filtered by date range.
 * Query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let appointments = await readAppointments();

    // Filter by date range if provided
    if (from) {
      appointments = appointments.filter((a) => a.date >= from);
    }
    if (to) {
      appointments = appointments.filter((a) => a.date <= to);
    }

    // Exclude cancelled by default unless explicitly requested
    const includeStatus = searchParams.get("status");
    if (!includeStatus) {
      appointments = appointments.filter((a) => a.status !== "cancelled");
    } else if (includeStatus !== "all") {
      appointments = appointments.filter((a) => a.status === includeStatus);
    }

    // Sort by date then time
    appointments.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    return NextResponse.json({ appointments, count: appointments.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read appointments", detail: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/appointments
 * Creates a new appointment.
 * Body: { leadName, leadEmail, leadPhone, appointmentType, date, time, notes? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { leadName, leadEmail, leadPhone, appointmentType, date, time, notes } = body;

    // Validate required fields
    if (!leadName || !leadEmail || !leadPhone || !appointmentType || !date || !time) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["leadName", "leadEmail", "leadPhone", "appointmentType", "date", "time"],
        },
        { status: 400 }
      );
    }

    if (!isValidAppointmentType(appointmentType)) {
      return NextResponse.json(
        {
          error: "Invalid appointmentType",
          valid: ["discovery", "listing", "tour", "buyer", "internal"],
        },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Expected YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Validate time format (HH:mm)
    if (!/^\d{2}:\d{2}$/.test(time)) {
      return NextResponse.json(
        { error: "Invalid time format. Expected HH:mm" },
        { status: 400 }
      );
    }

    const appointments = await readAppointments();

    // Check for double-booking (same date + time, not cancelled)
    const conflict = appointments.find(
      (a) => a.date === date && a.time === time && a.status !== "cancelled"
    );
    if (conflict) {
      return NextResponse.json(
        {
          error: "Time slot already booked",
          conflictingAppointmentId: conflict.id,
        },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const appointment: Appointment = {
      id: randomUUID(),
      leadName,
      leadEmail,
      leadPhone,
      appointmentType: appointmentType as AppointmentType,
      date,
      time,
      duration: getDuration(appointmentType as AppointmentType),
      notes: notes || "",
      status: "scheduled",
      createdAt: now,
      updatedAt: now,
    };

    appointments.push(appointment);
    await writeAppointments(appointments);

    // Fire-and-forget webhook to n8n
    triggerN8nWebhook(appointment);

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create appointment", detail: String(error) },
      { status: 500 }
    );
  }
}
