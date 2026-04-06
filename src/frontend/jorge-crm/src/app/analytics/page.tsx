import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const kpis = [
  { label: "Leads This Month", value: "47", change: "+12 vs last month", color: "text-blue-400" },
  { label: "Appointments Booked", value: "18", change: "+5 vs last month", color: "text-green-400" },
  { label: "Conversion Rate", value: "21%", change: "+3% vs last month", color: "text-purple-400" },
  { label: "Avg Days to Close", value: "34", change: "-6 vs last month", color: "text-yellow-400" },
  { label: "Revenue YTD", value: "$4.2M", change: "14 transactions", color: "text-emerald-400" },
];

const leadSources = [
  { source: "Zillow/Realtor.com", count: 18, pct: 38, color: "bg-blue-500" },
  { source: "Google Ads", count: 10, pct: 21, color: "bg-green-500" },
  { source: "Facebook/IG Ads", count: 7, pct: 15, color: "bg-purple-500" },
  { source: "Referrals", count: 5, pct: 11, color: "bg-yellow-500" },
  { source: "FSBO/Expired", count: 4, pct: 9, color: "bg-orange-500" },
  { source: "Open Houses", count: 3, pct: 6, color: "bg-pink-500" },
];

const funnel = [
  { stage: "New Leads", count: 47, pct: 100, color: "bg-blue-500" },
  { stage: "Contacted", count: 42, pct: 89, color: "bg-sky-500" },
  { stage: "Qualified", count: 28, pct: 60, color: "bg-cyan-500" },
  { stage: "Appointment Set", count: 18, pct: 38, color: "bg-teal-500" },
  { stage: "Active Client", count: 8, pct: 17, color: "bg-green-500" },
  { stage: "Under Contract", count: 3, pct: 6, color: "bg-emerald-500" },
  { stage: "Closed", count: 2, pct: 4, color: "bg-emerald-600" },
];

const monthlyTrends = [
  { month: "Oct", leads: 31, appointments: 10, closings: 1 },
  { month: "Nov", leads: 28, appointments: 9, closings: 2 },
  { month: "Dec", leads: 22, appointments: 7, closings: 1 },
  { month: "Jan", leads: 35, appointments: 12, closings: 2 },
  { month: "Feb", leads: 38, appointments: 14, closings: 3 },
  { month: "Mar", leads: 47, appointments: 18, closings: 2 },
];

const agents = [
  { name: "Jorge Ramirez", role: "Team Lead", leads: 18, appointments: 8, closings: 5, volume: "$1.8M" },
  { name: "Maria Santos", role: "Buyer Agent", leads: 14, appointments: 6, closings: 4, volume: "$1.2M" },
  { name: "Alex Kim", role: "Listing Agent", leads: 10, appointments: 3, closings: 3, volume: "$0.9M" },
  { name: "AI Assistant", role: "Automated", leads: 5, appointments: 1, closings: 2, volume: "$0.3M" },
];

export default function AnalyticsPage() {
  const maxLeads = Math.max(...monthlyTrends.map((m) => m.leads));

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
            { icon: "📈", label: "Analytics", href: "/analytics", active: true },
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
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
            <p className="text-zinc-400">Performance metrics and business intelligence.</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {kpis.map((kpi) => (
              <Card key={kpi.label} className="bg-zinc-800/50 border-zinc-700">
                <CardContent className="p-4">
                  <p className="text-sm text-zinc-400">{kpi.label}</p>
                  <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-xs text-zinc-500 mt-1">{kpi.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Lead Source Breakdown */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Lead Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {leadSources.map((ls) => (
                    <div key={ls.source}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-zinc-300">{ls.source}</span>
                        <span className="text-sm text-zinc-400">
                          {ls.count} <span className="text-zinc-500">({ls.pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${ls.color}`}
                          style={{ width: `${ls.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pipeline Conversion Funnel */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Pipeline Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {funnel.map((step) => (
                    <div key={step.stage} className="flex items-center gap-3">
                      <span className="text-xs text-zinc-400 w-28 text-right truncate">
                        {step.stage}
                      </span>
                      <div className="flex-1 flex items-center justify-center">
                        <div
                          className={`h-8 rounded ${step.color} flex items-center justify-center transition-all`}
                          style={{ width: `${Math.max(step.pct, 8)}%` }}
                        >
                          <span className="text-xs font-bold text-white">{step.count}</span>
                        </div>
                      </div>
                      <span className="text-xs text-zinc-500 w-10">{step.pct}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trends */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Legend */}
                <div className="flex gap-4 mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-blue-500" />
                    <span className="text-xs text-zinc-400">Leads</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-green-500" />
                    <span className="text-xs text-zinc-400">Appointments</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                    <span className="text-xs text-zinc-400">Closings</span>
                  </div>
                </div>
                {/* Bar Chart */}
                <div className="flex items-end gap-3 h-40">
                  {monthlyTrends.map((m) => (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end gap-0.5 h-32">
                        <div
                          className="flex-1 bg-blue-500 rounded-t"
                          style={{ height: `${(m.leads / maxLeads) * 100}%` }}
                          title={`${m.leads} leads`}
                        />
                        <div
                          className="flex-1 bg-green-500 rounded-t"
                          style={{ height: `${(m.appointments / maxLeads) * 100}%` }}
                          title={`${m.appointments} appointments`}
                        />
                        <div
                          className="flex-1 bg-emerald-500 rounded-t"
                          style={{ height: `${Math.max((m.closings / maxLeads) * 100, 3)}%` }}
                          title={`${m.closings} closings`}
                        />
                      </div>
                      <span className="text-xs text-zinc-500">{m.month}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Agent Activity Summary */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Agent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Table Header */}
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 px-2 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  <span>Agent</span>
                  <span>Leads</span>
                  <span>Appts</span>
                  <span>Closed</span>
                  <span>Volume</span>
                </div>
                <Separator className="bg-zinc-700 mb-2" />
                <div className="flex flex-col gap-1">
                  {agents.map((agent) => (
                    <div
                      key={agent.name}
                      className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 items-center px-2 py-2.5 rounded-lg hover:bg-zinc-700/30 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{agent.name}</p>
                        <p className="text-xs text-zinc-500">{agent.role}</p>
                      </div>
                      <p className="text-sm text-zinc-300">{agent.leads}</p>
                      <p className="text-sm text-zinc-300">{agent.appointments}</p>
                      <p className="text-sm text-zinc-300">{agent.closings}</p>
                      <p className="text-sm text-emerald-400 font-medium">{agent.volume}</p>
                    </div>
                  ))}
                </div>
                <Separator className="bg-zinc-700 my-3" />
                <div className="flex gap-4 text-sm text-zinc-400">
                  <span>
                    Total Volume: <strong className="text-emerald-400">$4.2M</strong>
                  </span>
                  <span>
                    Total Closed: <strong className="text-white">14</strong>
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
