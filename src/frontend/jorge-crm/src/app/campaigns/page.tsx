"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type CampaignStatus = "active" | "paused" | "draft";

interface Campaign {
  name: string;
  emails: number;
  enrolled: number;
  openRate: number;
  replyRate: number;
  status: CampaignStatus;
}

const initialCampaigns: Campaign[] = [
  { name: "FSBO Outreach", emails: 8, enrolled: 124, openRate: 42, replyRate: 8.3, status: "active" },
  { name: "Buyer Drip", emails: 6, enrolled: 89, openRate: 38, replyRate: 5.1, status: "active" },
  { name: "Seller Drip", emails: 6, enrolled: 67, openRate: 41, replyRate: 6.7, status: "active" },
  { name: "Expired Listings", emails: 6, enrolled: 53, openRate: 45, replyRate: 9.2, status: "active" },
  { name: "Hot Lead Urgency", emails: 4, enrolled: 18, openRate: 62, replyRate: 14.5, status: "active" },
  { name: "Re-engagement", emails: 4, enrolled: 210, openRate: 22, replyRate: 3.1, status: "active" },
  { name: "Open House", emails: 4, enrolled: 0, openRate: 0, replyRate: 0, status: "draft" },
  { name: "Sphere Nurture", emails: 4, enrolled: 342, openRate: 35, replyRate: 4.8, status: "active" },
];

const statusConfig: Record<CampaignStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-500/20 text-green-400 border-green-500/50" },
  paused: { label: "Paused", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50" },
  draft: { label: "Draft", className: "bg-zinc-500/20 text-zinc-400 border-zinc-500/50" },
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);

  function toggleStatus(index: number) {
    setCampaigns((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c;
        if (c.status === "draft") return c;
        return { ...c, status: c.status === "active" ? "paused" : "active" };
      })
    );
  }

  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const totalEnrolled = campaigns.reduce((sum, c) => sum + c.enrolled, 0);
  const avgOpenRate =
    campaigns.filter((c) => c.openRate > 0).reduce((sum, c) => sum + c.openRate, 0) /
    campaigns.filter((c) => c.openRate > 0).length;

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
            { icon: "📧", label: "Campaigns", href: "/campaigns", active: true },
            { icon: "📱", label: "Social Media", href: "#" },
            { icon: "⭐", label: "Reviews", href: "/reviews" },
            { icon: "📄", label: "Contracts", href: "#" },
            { icon: "📈", label: "Analytics", href: "/analytics" },
            { icon: "🤖", label: "AI Settings", href: "/ai-settings" },
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
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Email Campaigns</h2>
              <p className="text-zinc-400">Manage your automated email sequences and drip campaigns.</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">+ New Campaign</Button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-4">
                <p className="text-sm text-zinc-400">Total Campaigns</p>
                <p className="text-3xl font-bold text-white">{campaigns.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-4">
                <p className="text-sm text-zinc-400">Active</p>
                <p className="text-3xl font-bold text-green-400">{activeCampaigns}</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-4">
                <p className="text-sm text-zinc-400">Leads Enrolled</p>
                <p className="text-3xl font-bold text-blue-400">{totalEnrolled.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-4">
                <p className="text-sm text-zinc-400">Avg Open Rate</p>
                <p className="text-3xl font-bold text-purple-400">{avgOpenRate.toFixed(1)}%</p>
              </CardContent>
            </Card>
          </div>

          {/* Campaign List */}
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">All Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Table Header */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-4 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                <span>Sequence</span>
                <span>Emails</span>
                <span>Enrolled</span>
                <span>Open Rate</span>
                <span>Reply Rate</span>
                <span className="text-right">Status</span>
              </div>
              <Separator className="bg-zinc-700 mb-2" />

              {/* Rows */}
              <div className="flex flex-col gap-1">
                {campaigns.map((campaign, i) => {
                  const cfg = statusConfig[campaign.status];
                  return (
                    <div
                      key={campaign.name}
                      className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 items-center px-4 py-3 rounded-lg hover:bg-zinc-700/30 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{campaign.name}</p>
                      </div>
                      <p className="text-sm text-zinc-300">{campaign.emails} emails</p>
                      <p className="text-sm text-zinc-300">{campaign.enrolled.toLocaleString()}</p>
                      <p className="text-sm text-zinc-300">
                        {campaign.openRate > 0 ? `${campaign.openRate}%` : "--"}
                      </p>
                      <p className="text-sm text-zinc-300">
                        {campaign.replyRate > 0 ? `${campaign.replyRate}%` : "--"}
                      </p>
                      <div className="flex items-center justify-end gap-2">
                        <Badge className={cfg.className}>{cfg.label}</Badge>
                        {campaign.status !== "draft" && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => toggleStatus(i)}
                            className="text-zinc-400 hover:text-white"
                          >
                            {campaign.status === "active" ? "Pause" : "Resume"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
