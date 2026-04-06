"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

const APPOINTMENT_TYPES = [
  { value: "discovery-call", label: "Discovery Call", duration: "30 min", color: "text-blue-400" },
  { value: "listing-consultation", label: "Listing Consultation", duration: "30 min", color: "text-green-400" },
  { value: "private-tour", label: "Private Tour", duration: "60 min", color: "text-purple-400" },
  { value: "buyer-consultation", label: "Buyer Consultation", duration: "30 min", color: "text-orange-400" },
];

function getNext14Days(): Date[] {
  const days: Date[] = [];
  const now = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    // Skip Sundays
    if (d.getDay() !== 0) {
      days.push(d);
    }
  }
  return days;
}

function getTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 9; h < 17; h++) {
    slots.push(`${h.toString().padStart(2, "0")}:00`);
    slots.push(`${h.toString().padStart(2, "0")}:30`);
  }
  return slots;
}

function formatTime(t: string): string {
  const [hStr, m] = t.split(":");
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${m} ${ampm}`;
}

// Simulate some booked slots
const BOOKED_SLOTS: Record<string, string[]> = {};
const next14 = getNext14Days();
if (next14[0]) BOOKED_SLOTS[next14[0].toISOString().slice(0, 10)] = ["09:00", "10:30", "14:00"];
if (next14[2]) BOOKED_SLOTS[next14[2].toISOString().slice(0, 10)] = ["11:00", "13:00", "15:30"];
if (next14[4]) BOOKED_SLOTS[next14[4].toISOString().slice(0, 10)] = ["09:30", "10:00"];

export default function BookingPage() {
  const [step, setStep] = useState<"type" | "datetime" | "details" | "confirmed">("type");
  const [appointmentType, setAppointmentType] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    buyOrSell: "",
    timeline: "",
  });

  const dates = getNext14Days();
  const timeSlots = getTimeSlots();

  const bookedForDate = selectedDate
    ? BOOKED_SLOTS[selectedDate.toISOString().slice(0, 10)] ?? []
    : [];

  const selectedTypeInfo = APPOINTMENT_TYPES.find((t) => t.value === appointmentType);

  function handleSubmit() {
    setStep("confirmed");
  }

  if (step === "confirmed") {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
        <Card className="bg-zinc-800/50 border-zinc-700 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">&#10003;</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Booking Confirmed!</h2>
            <p className="text-zinc-400 mb-6">
              Your appointment has been scheduled. You&apos;ll receive a confirmation email shortly.
            </p>
            <Separator className="bg-zinc-700 my-4" />
            <div className="text-left space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-zinc-400 text-sm">Type</span>
                <span className="text-white text-sm">{selectedTypeInfo?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 text-sm">Date</span>
                <span className="text-white text-sm">
                  {selectedDate?.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 text-sm">Time</span>
                <span className="text-white text-sm">{formatTime(selectedTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 text-sm">Duration</span>
                <span className="text-white text-sm">{selectedTypeInfo?.duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 text-sm">Name</span>
                <span className="text-white text-sm">{formData.name}</span>
              </div>
            </div>
            <Link href="/calendar">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Back to Calendar</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Jorge Ramirez Group</h1>
            <p className="text-xs text-zinc-400">Keller Williams Premier &middot; Central & Northern NJ</p>
          </div>
          <Link href="/calendar">
            <Button variant="outline" className="border-zinc-700 text-zinc-300 text-xs">
              Back to Calendar
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center p-6 pt-10">
        <div className="max-w-3xl w-full">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {(["type", "datetime", "details"] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step === s
                      ? "bg-blue-600 text-white"
                      : ["type", "datetime", "details"].indexOf(step) > i
                        ? "bg-green-600 text-white"
                        : "bg-zinc-700 text-zinc-400"
                  }`}
                >
                  {["type", "datetime", "details"].indexOf(step) > i ? "\u2713" : i + 1}
                </div>
                <span
                  className={`text-sm ${step === s ? "text-white font-medium" : "text-zinc-500"}`}
                >
                  {s === "type" ? "Appointment Type" : s === "datetime" ? "Date & Time" : "Your Details"}
                </span>
                {i < 2 && <div className="flex-1 h-px bg-zinc-700" />}
              </div>
            ))}
          </div>

          {/* Step 1: Type Selection */}
          {step === "type" && (
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Select Appointment Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {APPOINTMENT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setAppointmentType(type.value)}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        appointmentType === type.value
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                      }`}
                    >
                      <p className={`font-medium ${type.color}`}>{type.label}</p>
                      <p className="text-xs text-zinc-400 mt-1">{type.duration}</p>
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!appointmentType}
                    onClick={() => setStep("datetime")}
                  >
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Date & Time */}
          {step === "datetime" && (
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Select Date & Time</CardTitle>
                  <Badge variant="outline" className={`${selectedTypeInfo?.color} border-current text-xs`}>
                    {selectedTypeInfo?.label} &middot; {selectedTypeInfo?.duration}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Date Grid */}
                <p className="text-sm text-zinc-400 mb-3">Choose a date</p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-6">
                  {dates.map((d) => {
                    const key = d.toISOString().slice(0, 10);
                    const isSelected = selectedDate?.toISOString().slice(0, 10) === key;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedDate(d);
                          setSelectedTime("");
                        }}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-zinc-700 hover:border-zinc-600"
                        }`}
                      >
                        <p className="text-xs text-zinc-400">
                          {d.toLocaleDateString("en-US", { weekday: "short" })}
                        </p>
                        <p className={`text-lg font-bold ${isSelected ? "text-blue-400" : "text-white"}`}>
                          {d.getDate()}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {d.toLocaleDateString("en-US", { month: "short" })}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Time Slots */}
                {selectedDate && (
                  <>
                    <Separator className="bg-zinc-700 my-4" />
                    <p className="text-sm text-zinc-400 mb-3">Choose a time</p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {timeSlots.map((slot) => {
                        const isBooked = bookedForDate.includes(slot);
                        const isSelected = selectedTime === slot;
                        return (
                          <button
                            key={slot}
                            disabled={isBooked}
                            onClick={() => setSelectedTime(slot)}
                            className={`p-2 rounded-lg border text-sm transition-all ${
                              isBooked
                                ? "border-zinc-800 bg-zinc-800/30 text-zinc-600 cursor-not-allowed"
                                : isSelected
                                  ? "border-blue-500 bg-blue-500/10 text-blue-400 font-medium"
                                  : "border-zinc-700 text-zinc-300 hover:border-zinc-600"
                            }`}
                          >
                            {formatTime(slot)}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                <div className="mt-6 flex justify-between">
                  <Button
                    variant="outline"
                    className="border-zinc-700 text-zinc-300"
                    onClick={() => setStep("type")}
                  >
                    Back
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!selectedDate || !selectedTime}
                    onClick={() => setStep("details")}
                  >
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Details Form */}
          {step === "details" && (
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Your Details</CardTitle>
                  <div className="text-right">
                    <p className="text-xs text-zinc-400">
                      {selectedTypeInfo?.label} &middot;{" "}
                      {selectedDate?.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      at {formatTime(selectedTime)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">Full Name *</label>
                    <Input
                      className="bg-zinc-800 border-zinc-700 text-white"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1.5">Email *</label>
                      <Input
                        type="email"
                        className="bg-zinc-800 border-zinc-700 text-white"
                        placeholder="you@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1.5">Phone *</label>
                      <Input
                        type="tel"
                        className="bg-zinc-800 border-zinc-700 text-white"
                        placeholder="(555) 000-0000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">
                      Are you buying or selling? *
                    </label>
                    <div className="flex gap-3">
                      {["Buying", "Selling", "Both", "Not sure"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setFormData({ ...formData, buyOrSell: opt })}
                          className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                            formData.buyOrSell === opt
                              ? "border-blue-500 bg-blue-500/10 text-blue-400"
                              : "border-zinc-700 text-zinc-300 hover:border-zinc-600"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">
                      What&apos;s your timeline?
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {["ASAP", "1-3 months", "3-6 months", "6-12 months", "Just exploring"].map(
                        (opt) => (
                          <button
                            key={opt}
                            onClick={() => setFormData({ ...formData, timeline: opt })}
                            className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                              formData.timeline === opt
                                ? "border-blue-500 bg-blue-500/10 text-blue-400"
                                : "border-zinc-700 text-zinc-300 hover:border-zinc-600"
                            }`}
                          >
                            {opt}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  <Button
                    variant="outline"
                    className="border-zinc-700 text-zinc-300"
                    onClick={() => setStep("datetime")}
                  >
                    Back
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!formData.name || !formData.email || !formData.phone || !formData.buyOrSell}
                    onClick={handleSubmit}
                  >
                    Confirm Booking
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
