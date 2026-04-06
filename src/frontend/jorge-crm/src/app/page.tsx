import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const stats = [
  { label: "New Leads", value: "12", change: "+3 this week", color: "text-blue-400" },
  { label: "AI Nurturing", value: "48", change: "Active follow-ups", color: "text-purple-400" },
  { label: "Appointments", value: "5", change: "This week", color: "text-green-400" },
  { label: "Active Clients", value: "8", change: "In pipeline", color: "text-yellow-400" },
  { label: "Under Contract", value: "3", change: "Pending close", color: "text-orange-400" },
  { label: "Closed (YTD)", value: "14", change: "$4.2M volume", color: "text-emerald-400" },
];

const quickLinks = [
  { label: "CRM / Contacts", url: "http://localhost:3001", desc: "Manage leads & pipeline" },
  { label: "Automations", url: "http://localhost:5678", desc: "Workflows & follow-ups" },
  { label: "Inbox", url: "http://localhost:4100", desc: "SMS, email, chat" },
];

const recentActivity = [
  { time: "2m ago", event: "AI sent follow-up to Sarah Chen", type: "ai" },
  { time: "15m ago", event: "New lead: Michael Torres (FSBO)", type: "lead" },
  { time: "1h ago", event: "Appointment booked: Lisa Park - Listing Consultation", type: "appt" },
  { time: "2h ago", event: "AI responded to Google review (5 stars)", type: "review" },
  { time: "3h ago", event: "Contract signed: 45 Oak Ridge Rd", type: "contract" },
];

const pipeline = [
  { stage: "New", count: 12, color: "bg-blue-500" },
  { stage: "Nurture", count: 15, color: "bg-slate-500" },
  { stage: "Cold", count: 10, color: "bg-zinc-500" },
  { stage: "Warm", count: 8, color: "bg-yellow-500" },
  { stage: "Hot", count: 5, color: "bg-red-500" },
  { stage: "Appt Booked", count: 5, color: "bg-green-500" },
  { stage: "Active", count: 8, color: "bg-emerald-500" },
  { stage: "Under Contract", count: 3, color: "bg-orange-500" },
];

export default function Home() {
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
            { icon: "🏠", label: "Dashboard", href: "/", active: true },
            { icon: "👥", label: "Contacts", href: "/contacts" },
            { icon: "📊", label: "Pipeline", href: "/pipeline" },
            { icon: "💬", label: "Inbox", href: "http://localhost:4100" },
            { icon: "📅", label: "Calendar", href: "/calendar" },
            { icon: "⚡", label: "Automations", href: "http://localhost:5678" },
            { icon: "📧", label: "Campaigns", href: "/campaigns" },
            { icon: "📱", label: "Social Media", href: "#" },
            { icon: "⭐", label: "Reviews", href: "/reviews" },
            { icon: "📄", label: "Contracts", href: "http://localhost:8400/api/contracts" },
            { icon: "📈", label: "Analytics", href: "/analytics" },
            { icon: "🤖", label: "AI Settings", href: "/ai-settings" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href || "#"}
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
          <p>Central & Northern NJ</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 bg-zinc-900 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Good evening, Teddy</h2>
              <p className="text-zinc-400">Here&apos;s what&apos;s happening with your leads today.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="border-zinc-700">
                + New Lead
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Make a Call
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {stats.map((stat) => (
              <Card key={stat.label} className="bg-zinc-800/50 border-zinc-700">
                <CardContent className="p-4">
                  <p className="text-sm text-zinc-400">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-zinc-500 mt-1">{stat.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pipeline Overview */}
            <Card className="lg:col-span-2 bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Pipeline Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  {pipeline.map((stage) => (
                    <div
                      key={stage.stage}
                      className="flex-1"
                      title={`${stage.stage}: ${stage.count}`}
                    >
                      <div className={`h-8 rounded ${stage.color} flex items-center justify-center`}>
                        <span className="text-xs font-bold text-white">{stage.count}</span>
                      </div>
                      <p className="text-xs text-zinc-400 text-center mt-1 truncate">{stage.stage}</p>
                    </div>
                  ))}
                </div>
                <Separator className="bg-zinc-700 my-4" />
                <div className="flex gap-4 text-sm text-zinc-400">
                  <span>Total leads: <strong className="text-white">66</strong></span>
                  <span>AI managing: <strong className="text-purple-400">48</strong></span>
                  <span>Need attention: <strong className="text-yellow-400">3</strong></span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Quick Access</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {quickLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-700/50 hover:bg-zinc-700 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{link.label}</p>
                      <p className="text-xs text-zinc-400">{link.desc}</p>
                    </div>
                    <span className="text-zinc-500">→</span>
                  </a>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="lg:col-span-2 bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {recentActivity.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <Badge
                        variant="outline"
                        className={`text-xs min-w-[60px] justify-center ${
                          item.type === "ai" ? "border-purple-500 text-purple-400" :
                          item.type === "lead" ? "border-blue-500 text-blue-400" :
                          item.type === "appt" ? "border-green-500 text-green-400" :
                          item.type === "review" ? "border-yellow-500 text-yellow-400" :
                          "border-orange-500 text-orange-400"
                        }`}
                      >
                        {item.type}
                      </Badge>
                      <span className="text-zinc-300 flex-1">{item.event}</span>
                      <span className="text-zinc-500 text-xs">{item.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Status */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">AI Status</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Follow-up Engine</span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Voice Agent</span>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Standby</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Newsletter AI</span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Scheduled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Review Responder</span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Video Generator</span>
                  <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/50">Setup</Badge>
                </div>
                <Separator className="bg-zinc-700" />
                <div className="text-xs text-zinc-500">
                  <p>Model: Gemma 4 31B (local)</p>
                  <p>Emails sent today: 12</p>
                  <p>Texts sent today: 8</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
