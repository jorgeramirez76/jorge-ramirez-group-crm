"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

type ContactType = "Buyer" | "Seller" | "FSBO" | "Expired" | "Investor" | "Referral";
type PipelineStage =
  | "New"
  | "Nurture"
  | "Cold"
  | "Warm"
  | "Hot"
  | "Appt Booked"
  | "Active Client"
  | "Under Contract";

interface PipelineCard {
  id: string;
  name: string;
  type: ContactType;
  lastActivity: string;
  detail: string;
}

const STAGE_CONFIG: {
  stage: PipelineStage;
  color: string;
  headerBg: string;
}[] = [
  { stage: "New", color: "bg-blue-500", headerBg: "bg-blue-500/10" },
  { stage: "Nurture", color: "bg-slate-500", headerBg: "bg-slate-500/10" },
  { stage: "Cold", color: "bg-zinc-500", headerBg: "bg-zinc-500/10" },
  { stage: "Warm", color: "bg-yellow-500", headerBg: "bg-yellow-500/10" },
  { stage: "Hot", color: "bg-red-500", headerBg: "bg-red-500/10" },
  { stage: "Appt Booked", color: "bg-green-500", headerBg: "bg-green-500/10" },
  { stage: "Active Client", color: "bg-emerald-500", headerBg: "bg-emerald-500/10" },
  { stage: "Under Contract", color: "bg-orange-500", headerBg: "bg-orange-500/10" },
];

const TYPE_COLORS: Record<ContactType, string> = {
  Buyer: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  Seller: "bg-green-500/20 text-green-400 border-green-500/50",
  FSBO: "bg-purple-500/20 text-purple-400 border-purple-500/50",
  Expired: "bg-red-500/20 text-red-400 border-red-500/50",
  Investor: "bg-amber-500/20 text-amber-400 border-amber-500/50",
  Referral: "bg-pink-500/20 text-pink-400 border-pink-500/50",
};

const EMPTY_PIPELINE: Record<PipelineStage, PipelineCard[]> = {
  New: [],
  Nurture: [],
  Cold: [],
  Warm: [],
  Hot: [],
  "Appt Booked": [],
  "Active Client": [],
  "Under Contract": [],
};

export default function PipelinePage() {
  const [pipelineData, setPipelineData] = useState<Record<string, PipelineCard[]>>(EMPTY_PIPELINE);
  const [totalLeads, setTotalLeads] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPipeline() {
      try {
        setLoading(true);
        const resp = await fetch("/api/pipeline");
        if (!resp.ok) throw new Error(`Failed to fetch: ${resp.status}`);
        const data = await resp.json();
        setPipelineData({ ...EMPTY_PIPELINE, ...(data.pipeline || {}) });
        setTotalLeads(data.totalLeads || 0);
        setError(null);
      } catch (err) {
        console.error("Error fetching pipeline:", err);
        setError("Failed to load pipeline from CRM");
        setPipelineData(EMPTY_PIPELINE);
      } finally {
        setLoading(false);
      }
    }
    fetchPipeline();
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-950 p-6 flex flex-col shrink-0">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">Jorge Ramirez</h1>
          <p className="text-sm text-zinc-400">Group CRM</p>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {[
            { icon: "🏠", label: "Dashboard", href: "/" },
            { icon: "👥", label: "Contacts", href: "/contacts" },
            { icon: "📊", label: "Pipeline", href: "/pipeline", active: true },
            { icon: "📅", label: "Calendar", href: "/calendar" },
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
        <div className="max-w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Pipeline</h2>
              <p className="text-zinc-400">
                {loading ? "Loading pipeline..." : `${totalLeads} leads across all stages`}
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/contacts">
                <Button variant="outline" className="border-zinc-700 text-zinc-300">
                  List View
                </Button>
              </Link>
              <Button className="bg-blue-600 hover:bg-blue-700">+ Add Lead</Button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Kanban Board */}
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGE_CONFIG.map(({ stage, color, headerBg }) => {
              const cards = pipelineData[stage] || [];
              return (
                <div key={stage} className="min-w-[260px] w-[260px] shrink-0 flex flex-col">
                  {/* Column Header */}
                  <div className={`rounded-t-lg p-3 ${headerBg} border border-b-0 border-zinc-700`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                        <span className="text-sm font-medium text-white">{stage}</span>
                      </div>
                      <span className="text-xs text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                        {cards.length}
                      </span>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 bg-zinc-800/30 border border-t-0 border-zinc-700 rounded-b-lg p-2 space-y-2 min-h-[200px]">
                    {cards.map((card) => (
                      <Card
                        key={card.id}
                        className="bg-zinc-800/80 border-zinc-700 hover:border-zinc-600 transition-colors cursor-pointer"
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm font-medium text-white leading-tight">
                              {card.name}
                            </p>
                            <Badge
                              variant="outline"
                              className={`text-[10px] shrink-0 ml-2 ${TYPE_COLORS[card.type]}`}
                            >
                              {card.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-zinc-400 mb-2 line-clamp-2">{card.detail}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-500">{card.lastActivity}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {cards.length === 0 && (
                      <div className="flex items-center justify-center h-20 text-xs text-zinc-600">
                        No leads
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Bar */}
          <Card className="bg-zinc-800/50 border-zinc-700 mt-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-4">
                  {STAGE_CONFIG.map(({ stage, color }) => (
                    <div key={stage} className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${color}`} />
                      <span className="text-xs text-zinc-400">
                        {stage}: <strong className="text-white">{(pipelineData[stage] || []).length}</strong>
                      </span>
                    </div>
                  ))}
                </div>
                <Separator orientation="vertical" className="h-4 bg-zinc-700" />
                <span className="text-xs text-zinc-400">
                  Total: <strong className="text-white">{totalLeads}</strong>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
