"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

type ContactType = "Buyer" | "Seller" | "FSBO" | "Expired" | "Investor" | "Renter" | "Referral";
type PipelineStage =
  | "New"
  | "Nurture"
  | "Cold"
  | "Warm"
  | "Hot"
  | "Appt Booked"
  | "Active Client"
  | "Under Contract";

interface Contact {
  id: string;
  name: string;
  type: ContactType;
  stage: PipelineStage;
  phone: string;
  email: string;
  lastActivity: string;
  assignedTo: string;
  notes?: string;
  address?: string;
}

const STAGE_COLORS: Record<PipelineStage, string> = {
  New: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  Nurture: "bg-slate-500/20 text-slate-400 border-slate-500/50",
  Cold: "bg-zinc-500/20 text-zinc-400 border-zinc-500/50",
  Warm: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  Hot: "bg-red-500/20 text-red-400 border-red-500/50",
  "Appt Booked": "bg-green-500/20 text-green-400 border-green-500/50",
  "Active Client": "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
  "Under Contract": "bg-orange-500/20 text-orange-400 border-orange-500/50",
};

const TYPE_COLORS: Record<ContactType, string> = {
  Buyer: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  Seller: "bg-green-500/20 text-green-400 border-green-500/50",
  FSBO: "bg-purple-500/20 text-purple-400 border-purple-500/50",
  Expired: "bg-red-500/20 text-red-400 border-red-500/50",
  Investor: "bg-amber-500/20 text-amber-400 border-amber-500/50",
  Renter: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
  Referral: "bg-pink-500/20 text-pink-400 border-pink-500/50",
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState<PipelineStage | "All">("All");
  const [filterType, setFilterType] = useState<ContactType | "All">("All");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  useEffect(() => {
    async function fetchContacts() {
      try {
        setLoading(true);
        const resp = await fetch("/api/contacts");
        if (!resp.ok) throw new Error(`Failed to fetch: ${resp.status}`);
        const data = await resp.json();
        setContacts(data.contacts || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching contacts:", err);
        setError("Failed to load contacts from CRM");
        setContacts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchContacts();
  }, []);

  const filtered = contacts.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    const matchStage = filterStage === "All" || c.stage === filterStage;
    const matchType = filterType === "All" || c.type === filterType;
    return matchSearch && matchStage && matchType;
  });

  const stages: (PipelineStage | "All")[] = [
    "All",
    "New",
    "Nurture",
    "Cold",
    "Warm",
    "Hot",
    "Appt Booked",
    "Active Client",
    "Under Contract",
  ];
  const types: (ContactType | "All")[] = [
    "All",
    "Buyer",
    "Seller",
    "FSBO",
    "Expired",
    "Investor",
    "Renter",
    "Referral",
  ];

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
            { icon: "👥", label: "Contacts", href: "/contacts", active: true },
            { icon: "📊", label: "Pipeline", href: "/pipeline" },
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
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Contacts</h2>
              <p className="text-zinc-400">
                {loading ? "Loading..." : `${contacts.length} total contacts`} &middot; {filtered.length} showing
              </p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">+ Add Contact</Button>
          </div>

          {/* Search & Filters */}
          <Card className="bg-zinc-800/50 border-zinc-700 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4">
                <Input
                  className="bg-zinc-800 border-zinc-700 text-white max-w-md"
                  placeholder="Search by name, email, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="flex flex-wrap gap-4">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1.5">Stage</p>
                    <div className="flex flex-wrap gap-1.5">
                      {stages.map((s) => (
                        <button
                          key={s}
                          onClick={() => setFilterStage(s)}
                          className={`px-2 py-1 rounded text-xs transition-all border ${
                            filterStage === s
                              ? "border-blue-500 bg-blue-500/10 text-blue-400"
                              : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1.5">Type</p>
                    <div className="flex flex-wrap gap-1.5">
                      {types.map((t) => (
                        <button
                          key={t}
                          onClick={() => setFilterType(t)}
                          className={`px-2 py-1 rounded text-xs transition-all border ${
                            filterType === t
                              ? "border-blue-500 bg-blue-500/10 text-blue-400"
                              : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-6">
            {/* Table */}
            <Card className="bg-zinc-800/50 border-zinc-700 flex-1">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-700">
                        <th className="text-left text-xs text-zinc-500 font-medium p-3">Name</th>
                        <th className="text-left text-xs text-zinc-500 font-medium p-3">Type</th>
                        <th className="text-left text-xs text-zinc-500 font-medium p-3">Stage</th>
                        <th className="text-left text-xs text-zinc-500 font-medium p-3">Phone</th>
                        <th className="text-left text-xs text-zinc-500 font-medium p-3">Email</th>
                        <th className="text-left text-xs text-zinc-500 font-medium p-3">Last Activity</th>
                        <th className="text-left text-xs text-zinc-500 font-medium p-3">Assigned To</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((contact) => (
                        <tr
                          key={contact.id}
                          onClick={() => setSelectedContact(contact)}
                          className={`border-b border-zinc-700/50 cursor-pointer transition-colors ${
                            selectedContact?.id === contact.id
                              ? "bg-blue-500/10"
                              : "hover:bg-zinc-800/50"
                          }`}
                        >
                          <td className="p-3">
                            <p className="text-sm font-medium text-white">{contact.name}</p>
                          </td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={`text-xs ${TYPE_COLORS[contact.type]}`}
                            >
                              {contact.type}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={`text-xs ${STAGE_COLORS[contact.stage]}`}
                            >
                              {contact.stage}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm text-zinc-400">{contact.phone}</td>
                          <td className="p-3 text-sm text-zinc-400">{contact.email}</td>
                          <td className="p-3 text-sm text-zinc-400">{contact.lastActivity}</td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                contact.assignedTo === "AI"
                                  ? "border-purple-500/50 text-purple-400"
                                  : "border-zinc-500/50 text-zinc-400"
                              }`}
                            >
                              {contact.assignedTo}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {loading && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-zinc-500">
                            Loading contacts from CRM...
                          </td>
                        </tr>
                      )}
                      {!loading && filtered.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-zinc-500">
                            {error ? "Could not load contacts" : "No contacts match your filters"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Detail Panel */}
            {selectedContact && (
              <Card className="bg-zinc-800/50 border-zinc-700 w-80 shrink-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">{selectedContact.name}</CardTitle>
                    <button
                      onClick={() => setSelectedContact(null)}
                      className="text-zinc-500 hover:text-white text-sm"
                    >
                      &#10005;
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <Badge variant="outline" className={`text-xs ${TYPE_COLORS[selectedContact.type]}`}>
                      {selectedContact.type}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${STAGE_COLORS[selectedContact.stage]}`}
                    >
                      {selectedContact.stage}
                    </Badge>
                  </div>
                  <Separator className="bg-zinc-700 mb-4" />
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-zinc-500">Phone</p>
                      <p className="text-sm text-white">{selectedContact.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Email</p>
                      <p className="text-sm text-white">{selectedContact.email}</p>
                    </div>
                    {selectedContact.address && (
                      <div>
                        <p className="text-xs text-zinc-500">Address</p>
                        <p className="text-sm text-white">{selectedContact.address}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-zinc-500">Assigned To</p>
                      <p className="text-sm text-white">{selectedContact.assignedTo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Last Activity</p>
                      <p className="text-sm text-white">{selectedContact.lastActivity}</p>
                    </div>
                    {selectedContact.notes && (
                      <div>
                        <p className="text-xs text-zinc-500">Notes</p>
                        <p className="text-sm text-zinc-300">{selectedContact.notes}</p>
                      </div>
                    )}
                  </div>
                  <Separator className="bg-zinc-700 my-4" />
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 border-zinc-700 text-zinc-300 text-xs">
                      Call
                    </Button>
                    <Button variant="outline" className="flex-1 border-zinc-700 text-zinc-300 text-xs">
                      Email
                    </Button>
                    <Button variant="outline" className="flex-1 border-zinc-700 text-zinc-300 text-xs">
                      Text
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
