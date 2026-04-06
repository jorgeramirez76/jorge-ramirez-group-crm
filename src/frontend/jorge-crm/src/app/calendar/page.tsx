"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

const EVENT_TYPES = [
  { name: "Discovery Call", color: "bg-blue-500", textColor: "text-blue-400", borderColor: "border-blue-500" },
  { name: "Listing Consultation", color: "bg-green-500", textColor: "text-green-400", borderColor: "border-green-500" },
  { name: "Private Tour", color: "bg-purple-500", textColor: "text-purple-400", borderColor: "border-purple-500" },
  { name: "Buyer Consultation", color: "bg-orange-500", textColor: "text-orange-400", borderColor: "border-orange-500" },
  { name: "Agent Internal", color: "bg-zinc-500", textColor: "text-zinc-400", borderColor: "border-zinc-500" },
] as const;

type EventType = (typeof EVENT_TYPES)[number]["name"];

interface Appointment {
  id: string;
  title: string;
  type: EventType;
  time: string;
  duration: number; // minutes
  client: string;
}

function getWeekDates(offset: number): Date[] {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + offset * 7);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Mock appointments for this week
function generateMockAppointments(): Record<string, Appointment[]> {
  const week = getWeekDates(0);
  const map: Record<string, Appointment[]> = {};

  const mockData: { dayIndex: number; time: string; type: EventType; client: string }[] = [
    { dayIndex: 0, time: "09:00", type: "Discovery Call", client: "Sarah Chen" },
    { dayIndex: 0, time: "11:00", type: "Listing Consultation", client: "Michael Torres" },
    { dayIndex: 1, time: "10:00", type: "Private Tour", client: "Lisa Park" },
    { dayIndex: 1, time: "14:00", type: "Buyer Consultation", client: "James Wilson" },
    { dayIndex: 1, time: "16:00", type: "Agent Internal", client: "Team Meeting" },
    { dayIndex: 2, time: "09:30", type: "Discovery Call", client: "Priya Sharma" },
    { dayIndex: 2, time: "13:00", type: "Private Tour", client: "David Kim" },
    { dayIndex: 3, time: "10:00", type: "Listing Consultation", client: "Angela Rodriguez" },
    { dayIndex: 3, time: "11:30", type: "Discovery Call", client: "Tom Bradley" },
    { dayIndex: 3, time: "15:00", type: "Buyer Consultation", client: "Nina Patel" },
    { dayIndex: 4, time: "09:00", type: "Agent Internal", client: "Weekly Review" },
    { dayIndex: 4, time: "11:00", type: "Private Tour", client: "Robert Chang" },
    { dayIndex: 4, time: "14:30", type: "Discovery Call", client: "Maria Gonzalez" },
  ];

  mockData.forEach((item, idx) => {
    const key = dateKey(week[item.dayIndex]);
    if (!map[key]) map[key] = [];
    map[key].push({
      id: `appt-${idx}`,
      title: item.type,
      type: item.type,
      time: item.time,
      duration: item.type === "Private Tour" ? 60 : 30,
      client: item.client,
    });
  });

  return map;
}

const HOURS = Array.from({ length: 17 }, (_, i) => {
  const hour = 9 + Math.floor(i / 2);
  const min = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${min}`;
});

function getEventStyle(type: EventType) {
  return EVENT_TYPES.find((e) => e.name === type) ?? EVENT_TYPES[0];
}

export default function CalendarPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = getWeekDates(weekOffset);
  const appointments = generateMockAppointments();

  const today = dateKey(new Date());

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-950 p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">Jorge Ramirez</h1>
          <p className="text-sm text-zinc-400">Group CRM</p>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {[
            { icon: "🏠", label: "Dashboard", href: "/" },
            { icon: "👥", label: "Contacts", href: "/contacts" },
            { icon: "📊", label: "Pipeline", href: "/pipeline" },
            { icon: "📅", label: "Calendar", href: "/calendar", active: true },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                item.active
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <Separator className="my-4 bg-zinc-800" />
        <div className="text-xs text-zinc-500">
          <p>Keller Williams Premier</p>
          <p>Central & Northern NJ</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 bg-zinc-900 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Calendar</h2>
              <p className="text-zinc-400">Manage appointments and availability</p>
            </div>
            <div className="flex gap-3">
              <Link href="/calendar/book">
                <Button className="bg-blue-600 hover:bg-blue-700">+ Book New</Button>
              </Link>
            </div>
          </div>

          {/* Event Type Legend */}
          <div className="flex flex-wrap gap-3 mb-6">
            {EVENT_TYPES.map((et) => (
              <Badge
                key={et.name}
                variant="outline"
                className={`${et.borderColor} ${et.textColor} text-xs`}
              >
                <span className={`inline-block w-2 h-2 rounded-full ${et.color} mr-1.5`} />
                {et.name}
              </Badge>
            ))}
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              className="border-zinc-700 text-zinc-300"
              onClick={() => setWeekOffset((w) => w - 1)}
            >
              Previous Week
            </Button>
            <span className="text-zinc-300 font-medium">
              {formatDate(weekDates[0])} &mdash; {formatDate(weekDates[6])}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-zinc-700 text-zinc-300"
                onClick={() => setWeekOffset(0)}
              >
                Today
              </Button>
              <Button
                variant="outline"
                className="border-zinc-700 text-zinc-300"
                onClick={() => setWeekOffset((w) => w + 1)}
              >
                Next Week
              </Button>
            </div>
          </div>

          {/* Weekly Grid */}
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-0 overflow-x-auto">
              <div className="grid grid-cols-8 min-w-[900px]">
                {/* Time column header */}
                <div className="border-b border-zinc-700 p-2 text-xs text-zinc-500 font-medium">
                  Time
                </div>
                {/* Day headers */}
                {weekDates.map((d) => {
                  const isToday = dateKey(d) === today;
                  return (
                    <div
                      key={dateKey(d)}
                      className={`border-b border-l border-zinc-700 p-2 text-center text-xs font-medium ${
                        isToday ? "bg-blue-500/10 text-blue-400" : "text-zinc-400"
                      }`}
                    >
                      {d.toLocaleDateString("en-US", { weekday: "short" })}
                      <br />
                      <span className={`text-lg font-bold ${isToday ? "text-blue-400" : "text-white"}`}>
                        {d.getDate()}
                      </span>
                    </div>
                  );
                })}

                {/* Time slots */}
                {HOURS.map((hour) => (
                  <>
                    {/* Time label */}
                    <div
                      key={`time-${hour}`}
                      className="border-b border-zinc-700/50 p-2 text-xs text-zinc-500 h-14 flex items-start"
                    >
                      {hour}
                    </div>
                    {/* Day cells */}
                    {weekDates.map((d) => {
                      const key = dateKey(d);
                      const dayAppts = appointments[key] ?? [];
                      const slotAppts = dayAppts.filter((a) => a.time === hour);
                      const isToday = key === today;
                      return (
                        <div
                          key={`${key}-${hour}`}
                          className={`border-b border-l border-zinc-700/50 p-1 h-14 ${
                            isToday ? "bg-blue-500/5" : ""
                          } ${d.getDay() === 0 || d.getDay() === 6 ? "bg-zinc-800/30" : ""}`}
                        >
                          {slotAppts.map((appt) => {
                            const style = getEventStyle(appt.type);
                            return (
                              <div
                                key={appt.id}
                                className={`rounded px-1.5 py-0.5 text-xs ${style.color}/20 border-l-2 ${style.borderColor} truncate cursor-pointer hover:opacity-80`}
                                style={{ backgroundColor: `color-mix(in srgb, currentColor 10%, transparent)` }}
                                title={`${appt.type} - ${appt.client} (${appt.duration}min)`}
                              >
                                <span className={`${style.textColor} font-medium`}>{appt.client}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Today's Summary */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Today&apos;s Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {(appointments[today] ?? []).length === 0 ? (
                  <p className="text-zinc-500 text-sm">No appointments today</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {(appointments[today] ?? []).map((appt) => {
                      const style = getEventStyle(appt.type);
                      return (
                        <div
                          key={appt.id}
                          className="flex items-center gap-3 p-2 rounded-lg bg-zinc-700/30"
                        >
                          <div className={`w-1 h-8 rounded-full ${style.color}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">{appt.client}</p>
                            <p className="text-xs text-zinc-400">{appt.type}</p>
                          </div>
                          <span className="text-xs text-zinc-400">{appt.time}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">This Week&apos;s Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {Object.values(appointments).flat().length}
                    </p>
                    <p className="text-xs text-zinc-400">Total Appointments</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-400">
                      {Object.values(appointments).flat().filter((a) => a.type === "Discovery Call").length}
                    </p>
                    <p className="text-xs text-zinc-400">Discovery Calls</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-400">
                      {Object.values(appointments).flat().filter((a) => a.type === "Private Tour").length}
                    </p>
                    <p className="text-xs text-zinc-400">Private Tours</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-400">
                      {Object.values(appointments).flat().filter((a) => a.type === "Listing Consultation").length}
                    </p>
                    <p className="text-xs text-zinc-400">Listing Consults</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
