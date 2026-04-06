import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), "../../../data");
const DATA_FILE = path.join(DATA_DIR, "appointments.json");

export type AppointmentType =
  | "discovery"
  | "listing"
  | "tour"
  | "buyer"
  | "internal";

export type AppointmentStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "no-show";

export interface Appointment {
  id: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  appointmentType: AppointmentType;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  duration: number; // minutes
  notes: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
}

export async function readAppointments(): Promise<Appointment[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as Appointment[];
  } catch {
    // File doesn't exist yet or is invalid — return empty array
    return [];
  }
}

export async function writeAppointments(
  appointments: Appointment[]
): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(appointments, null, 2), "utf-8");
}

const VALID_TYPES: AppointmentType[] = [
  "discovery",
  "listing",
  "tour",
  "buyer",
  "internal",
];

export function isValidAppointmentType(v: string): v is AppointmentType {
  return VALID_TYPES.includes(v as AppointmentType);
}

/** Duration in minutes for each appointment type */
export function getDuration(type: AppointmentType): number {
  return type === "tour" ? 60 : 30;
}

const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL ||
  "http://localhost:5678/webhook/post-appointment";

export async function triggerN8nWebhook(
  appointment: Appointment
): Promise<void> {
  try {
    await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(appointment),
    });
  } catch (err) {
    // Log but don't fail the request if webhook is unreachable
    console.error("Failed to trigger n8n webhook:", err);
  }
}

/** Generate all 30-minute slots from 09:00 to 16:30 (last slot starts at 16:30, ends at 17:00) */
export function generateAllSlots(): string[] {
  const slots: string[] = [];
  for (let h = 9; h < 17; h++) {
    slots.push(`${h.toString().padStart(2, "0")}:00`);
    slots.push(`${h.toString().padStart(2, "0")}:30`);
  }
  return slots;
}
