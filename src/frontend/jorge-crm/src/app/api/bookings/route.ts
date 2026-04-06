import { type NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  readAppointments,
  writeAppointments,
  isValidAppointmentType,
  getDuration,
  generateAllSlots,
  triggerN8nWebhook,
  type Appointment,
  type AppointmentType,
} from "@/lib/appointments";

export const dynamic = "force-dynamic";

/**
 * GET /api/bookings
 * Returns available time slots for a given date.
 * Query params: ?date=YYYY-MM-DD&type=discovery
 *
 * Business hours: 9am-5pm, 30-minute slots.
 * Excludes already-booked slots.
 * For 60-min appointments (tour), also excludes slots where the
 * following 30-min slot is booked.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");
    const type = searchParams.get("type");

    if (!date) {
      return NextResponse.json(
        { error: "Missing required query parameter: date" },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Expected YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Check the date is not a Sunday
    const dateObj = new Date(date + "T12:00:00");
    if (dateObj.getDay() === 0) {
      return NextResponse.json({
        date,
        availableSlots: [],
        message: "No availability on Sundays",
      });
    }

    const appointments = await readAppointments();
    const dayAppointments = appointments.filter(
      (a) => a.date === date && a.status !== "cancelled"
    );

    // Build set of blocked time slots
    const blockedSlots = new Set<string>();
    for (const appt of dayAppointments) {
      blockedSlots.add(appt.time);
      // If the appointment is 60 minutes, also block the next slot
      if (appt.duration === 60) {
        const [h, m] = appt.time.split(":").map(Number);
        const nextMin = m + 30;
        const nextH = h + Math.floor(nextMin / 60);
        const nextM = nextMin % 60;
        blockedSlots.add(
          `${nextH.toString().padStart(2, "0")}:${nextM.toString().padStart(2, "0")}`
        );
      }
    }

    const allSlots = generateAllSlots();
    const duration = type && isValidAppointmentType(type) ? getDuration(type as AppointmentType) : 30;

    // Filter available slots
    const availableSlots = allSlots.filter((slot) => {
      if (blockedSlots.has(slot)) return false;

      // For 60-min appointments, also check the next slot is free
      if (duration === 60) {
        const [h, m] = slot.split(":").map(Number);
        const nextMin = m + 30;
        const nextH = h + Math.floor(nextMin / 60);
        const nextM = nextMin % 60;
        const nextSlot = `${nextH.toString().padStart(2, "0")}:${nextM.toString().padStart(2, "0")}`;
        // Ensure next slot is within business hours (before 17:00)
        if (nextH >= 17) return false;
        if (blockedSlots.has(nextSlot)) return false;
      }

      return true;
    });

    return NextResponse.json({
      date,
      duration,
      availableSlots,
      count: availableSlots.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get available slots", detail: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings
 * Public booking endpoint used by the /calendar/book page.
 * Creates an appointment and sends confirmation.
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

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Expected YYYY-MM-DD" },
        { status: 400 }
      );
    }

    if (!/^\d{2}:\d{2}$/.test(time)) {
      return NextResponse.json(
        { error: "Invalid time format. Expected HH:mm" },
        { status: 400 }
      );
    }

    // Validate time is within business hours
    const [hour] = time.split(":").map(Number);
    if (hour < 9 || hour >= 17) {
      return NextResponse.json(
        { error: "Time must be within business hours (9:00 AM - 5:00 PM)" },
        { status: 400 }
      );
    }

    // Check Sunday
    const dateObj = new Date(date + "T12:00:00");
    if (dateObj.getDay() === 0) {
      return NextResponse.json(
        { error: "Bookings are not available on Sundays" },
        { status: 400 }
      );
    }

    const appointments = await readAppointments();

    // Check for conflicts
    const conflict = appointments.find(
      (a) => a.date === date && a.time === time && a.status !== "cancelled"
    );
    if (conflict) {
      return NextResponse.json(
        { error: "This time slot is no longer available. Please choose another." },
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

    // Fire-and-forget webhook to n8n (handles confirmation email, etc.)
    triggerN8nWebhook(appointment);

    return NextResponse.json(
      {
        message: "Booking confirmed! You will receive a confirmation email shortly.",
        appointment,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create booking", detail: String(error) },
      { status: 500 }
    );
  }
}
