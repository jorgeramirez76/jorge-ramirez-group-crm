import { type NextRequest, NextResponse } from "next/server";
import {
  readAppointments,
  writeAppointments,
  isValidAppointmentType,
  getDuration,
  type AppointmentStatus,
  type AppointmentType,
} from "@/lib/appointments";

export const dynamic = "force-dynamic";

const VALID_STATUSES: AppointmentStatus[] = [
  "scheduled",
  "completed",
  "cancelled",
  "no-show",
];

/**
 * GET /api/appointments/[id]
 * Returns a single appointment by ID.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const appointments = await readAppointments();
    const appointment = appointments.find((a) => a.id === id);

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read appointment", detail: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/appointments/[id]
 * Update an appointment: reschedule, change status, update notes.
 * Body: { date?, time?, status?, notes?, appointmentType? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const appointments = await readAppointments();
    const index = appointments.findIndex((a) => a.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    const appointment = appointments[index];

    // Validate status if provided
    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          {
            error: "Invalid status",
            valid: VALID_STATUSES,
          },
          { status: 400 }
        );
      }
      appointment.status = body.status;
    }

    // Validate appointmentType if provided
    if (body.appointmentType !== undefined) {
      if (!isValidAppointmentType(body.appointmentType)) {
        return NextResponse.json(
          {
            error: "Invalid appointmentType",
            valid: ["discovery", "listing", "tour", "buyer", "internal"],
          },
          { status: 400 }
        );
      }
      appointment.appointmentType = body.appointmentType as AppointmentType;
      appointment.duration = getDuration(body.appointmentType as AppointmentType);
    }

    // Reschedule: validate and check conflicts
    if (body.date !== undefined || body.time !== undefined) {
      const newDate = body.date ?? appointment.date;
      const newTime = body.time ?? appointment.time;

      if (body.date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
        return NextResponse.json(
          { error: "Invalid date format. Expected YYYY-MM-DD" },
          { status: 400 }
        );
      }
      if (body.time !== undefined && !/^\d{2}:\d{2}$/.test(newTime)) {
        return NextResponse.json(
          { error: "Invalid time format. Expected HH:mm" },
          { status: 400 }
        );
      }

      // Check for conflict (excluding this appointment)
      const conflict = appointments.find(
        (a) =>
          a.id !== id &&
          a.date === newDate &&
          a.time === newTime &&
          a.status !== "cancelled"
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

      appointment.date = newDate;
      appointment.time = newTime;
    }

    // Update notes if provided
    if (body.notes !== undefined) {
      appointment.notes = body.notes;
    }

    // Update lead info if provided
    if (body.leadName !== undefined) appointment.leadName = body.leadName;
    if (body.leadEmail !== undefined) appointment.leadEmail = body.leadEmail;
    if (body.leadPhone !== undefined) appointment.leadPhone = body.leadPhone;

    appointment.updatedAt = new Date().toISOString();
    appointments[index] = appointment;
    await writeAppointments(appointments);

    return NextResponse.json({ appointment });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update appointment", detail: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/appointments/[id]
 * Soft-delete: marks appointment as cancelled.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const appointments = await readAppointments();
    const index = appointments.findIndex((a) => a.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    appointments[index].status = "cancelled";
    appointments[index].updatedAt = new Date().toISOString();
    await writeAppointments(appointments);

    return NextResponse.json({
      message: "Appointment cancelled",
      appointment: appointments[index],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to cancel appointment", detail: String(error) },
      { status: 500 }
    );
  }
}
