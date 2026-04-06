"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface AISystem {
  name: string;
  description: string;
  enabled: boolean;
  status: string;
  statusColor: string;
  lastRun: string;
}

interface CadenceSetting {
  label: string;
  description: string;
  value: string;
}

const initialSystems: AISystem[] = [
  {
    name: "Follow-up Engine",
    description: "Automated email and SMS follow-ups based on lead behavior and pipeline stage.",
    enabled: true,
    status: "Active",
    statusColor: "bg-green-500/20 text-green-400 border-green-500/50",
    lastRun: "2 minutes ago",
  },
  {
    name: "Voice Agent",
    description: "AI-powered phone calls for lead qualification and appointment setting.",
    enabled: true,
    status: "Standby",
    statusColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    lastRun: "45 minutes ago",
  },
  {
    name: "Newsletter AI",
    description: "Weekly market update newsletters with AI-generated content and listings.",
    enabled: true,
    status: "Scheduled",
    statusColor: "bg-green-500/20 text-green-400 border-green-500/50",
    lastRun: "3 days ago",
  },
  {
    name: "Review Responder",
    description: "Automatically drafts and posts responses to reviews on Google, Facebook, and Zillow.",
    enabled: true,
    status: "Active",
    statusColor: "bg-green-500/20 text-green-400 border-green-500/50",
    lastRun: "6 hours ago",
  },
  {
    name: "Video Generator",
    description: "AI-generated listing tour videos and market update clips for social media.",
    enabled: false,
    status: "Setup Required",
    statusColor: "bg-zinc-500/20 text-zinc-400 border-zinc-500/50",
    lastRun: "Never",
  },
];

const cadenceSettings: CadenceSetting[] = [
  { label: "Hot Leads", description: "High-intent buyers/sellers", value: "Every 2 hours" },
  { label: "Warm Leads", description: "Engaged but not urgent", value: "Every 24 hours" },
  { label: "Cold Leads", description: "Low engagement or stale", value: "Every 3 days" },
  { label: "Nurture", description: "Long-term sphere contacts", value: "Weekly" },
];

const modelOptions = [
  "Gemma 4 31B (local)",
  "Gemma 3 27B (local)",
  "GPT-4o (API)",
  "Claude Sonnet 4 (API)",
];

const toneOptions = [
  { label: "Professional & Warm", active: true },
  { label: "Casual & Friendly", active: false },
  { label: "Formal & Authoritative", active: false },
  { label: "Bilingual (EN/ES)", active: false },
];

export default function AISettingsPage() {
  const [systems, setSystems] = useState(initialSystems);
  const [selectedModel, setSelectedModel] = useState(modelOptions[0]);
  const [activeTone, setActiveTone] = useState(0);

  function toggleSystem(index: number) {
    setSystems((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        const enabled = !s.enabled;
        return {
          ...s,
          enabled,
          status: enabled ? "Active" : "Disabled",
          statusColor: enabled
            ? "bg-green-500/20 text-green-400 border-green-500/50"
            : "bg-zinc-500/20 text-zinc-400 border-zinc-500/50",
        };
      })
    );
  }

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
            { icon: "👥", label: "Contacts", href: "http://localhost:3001" },
            { icon: "📊", label: "Pipeline", href: "http://localhost:3001" },
            { icon: "💬", label: "Inbox", href: "http://localhost:4100" },
            { icon: "📅", label: "Calendar", href: "#" },
            { icon: "⚡", label: "Automations", href: "http://localhost:5678" },
            { icon: "📧", label: "Campaigns", href: "/campaigns" },
            { icon: "📱", label: "Social Media", href: "#" },
            { icon: "⭐", label: "Reviews", href: "/reviews" },
            { icon: "📄", label: "Contracts", href: "#" },
            { icon: "📈", label: "Analytics", href: "/analytics" },
            { icon: "🤖", label: "AI Settings", href: "/ai-settings", active: true },
          ].map((item) => (
            <a
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
            </a>
          ))}
        </nav>
        <Separator className="my-4 bg-zinc-800" />
        <div className="text-xs text-zinc-500">
          <p>Keller Williams Premier</p>
          <p>Central &amp; Northern NJ</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 bg-zinc-900 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">AI Settings</h2>
            <p className="text-zinc-400">Configure your AI systems, models, and automation behavior.</p>
          </div>

          {/* AI System Toggles */}
          <Card className="bg-zinc-800/50 border-zinc-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">AI Systems</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {systems.map((system, i) => (
                  <div
                    key={system.name}
                    className="flex items-center justify-between p-4 rounded-lg bg-zinc-700/30"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-sm font-medium text-white">{system.name}</p>
                        <Badge className={system.statusColor}>{system.status}</Badge>
                      </div>
                      <p className="text-xs text-zinc-400">{system.description}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Last run: {system.lastRun}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleSystem(i)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        system.enabled ? "bg-green-500" : "bg-zinc-600"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform ${
                          system.enabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Model Selection */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Model Selection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-zinc-400 mb-4">
                  Choose the AI model used for text generation across all systems.
                </p>
                <div className="flex flex-col gap-2">
                  {modelOptions.map((model) => (
                    <button
                      key={model}
                      onClick={() => setSelectedModel(model)}
                      className={`flex items-center justify-between p-3 rounded-lg text-sm transition-colors ${
                        selectedModel === model
                          ? "bg-blue-600/20 border border-blue-500/50 text-blue-400"
                          : "bg-zinc-700/30 border border-transparent text-zinc-300 hover:bg-zinc-700/50"
                      }`}
                    >
                      <span>{model}</span>
                      {selectedModel === model && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                          Active
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Follow-up Cadence */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Follow-up Cadence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-zinc-400 mb-4">
                  Set how frequently AI reaches out based on lead temperature.
                </p>
                <div className="flex flex-col gap-3">
                  {cadenceSettings.map((setting) => (
                    <div
                      key={setting.label}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-700/30"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{setting.label}</p>
                        <p className="text-xs text-zinc-500">{setting.description}</p>
                      </div>
                      <span className="text-sm text-zinc-300 bg-zinc-600/50 px-3 py-1 rounded-md">
                        {setting.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Personality / Tone */}
          <Card className="bg-zinc-800/50 border-zinc-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">AI Personality &amp; Tone</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-zinc-400 mb-4">
                Select the communication style for all AI-generated messages (emails, texts, review
                responses).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {toneOptions.map((tone, i) => (
                  <button
                    key={tone.label}
                    onClick={() => setActiveTone(i)}
                    className={`p-4 rounded-lg text-sm font-medium transition-colors text-left ${
                      activeTone === i
                        ? "bg-purple-600/20 border border-purple-500/50 text-purple-400"
                        : "bg-zinc-700/30 border border-transparent text-zinc-300 hover:bg-zinc-700/50"
                    }`}
                  >
                    {tone.label}
                    {activeTone === i && (
                      <p className="text-xs text-purple-400/70 mt-1">Currently active</p>
                    )}
                  </button>
                ))}
              </div>
              <Separator className="bg-zinc-700 my-4" />
              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-500">
                  <p>All AI outputs are reviewed before sending when confidence is below 85%.</p>
                  <p className="mt-1">
                    Emails sent today: <strong className="text-zinc-300">12</strong> | Texts sent
                    today: <strong className="text-zinc-300">8</strong>
                  </p>
                </div>
                <Button variant="outline" className="border-zinc-700 text-zinc-300">
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
