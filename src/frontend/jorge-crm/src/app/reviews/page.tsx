"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ReviewSource = "google" | "facebook" | "zillow";
type ResponseStatus = "responded" | "pending";

interface Review {
  source: ReviewSource;
  rating: number;
  reviewer: string;
  text: string;
  date: string;
  responseStatus: ResponseStatus;
}

const sourceConfig: Record<ReviewSource, { icon: string; label: string; color: string }> = {
  google: { icon: "G", label: "Google", color: "text-blue-400 bg-blue-500/20 border-blue-500/50" },
  facebook: { icon: "f", label: "Facebook", color: "text-blue-300 bg-blue-400/20 border-blue-400/50" },
  zillow: { icon: "Z", label: "Zillow", color: "text-green-400 bg-green-500/20 border-green-500/50" },
};

const reviews: Review[] = [
  {
    source: "google",
    rating: 5,
    reviewer: "Sarah M.",
    text: "Jorge and his team were incredible! They sold our home in under two weeks and helped us find our dream house. The AI-powered follow-ups kept us informed every step of the way. Highly recommend!",
    date: "Mar 28, 2026",
    responseStatus: "responded",
  },
  {
    source: "zillow",
    rating: 5,
    reviewer: "Michael T.",
    text: "As a first-time homebuyer, I was nervous about the process. Jorge made everything so smooth and his team was always available to answer my questions. Truly a five-star experience.",
    date: "Mar 22, 2026",
    responseStatus: "responded",
  },
  {
    source: "facebook",
    rating: 4,
    reviewer: "Lisa & David K.",
    text: "Great experience overall. Jorge helped us navigate a competitive market and we ended up getting a home we love. Only minor hiccup was some scheduling confusion but it was resolved quickly.",
    date: "Mar 15, 2026",
    responseStatus: "pending",
  },
  {
    source: "google",
    rating: 5,
    reviewer: "Robert Chen",
    text: "Sold my investment property with Jorge's team and couldn't be happier. Professional, knowledgeable, and the marketing materials were top-notch. The listing video was especially impressive.",
    date: "Mar 8, 2026",
    responseStatus: "responded",
  },
  {
    source: "zillow",
    rating: 3,
    reviewer: "Amanda P.",
    text: "Decent experience. Communication could have been better at times. The end result was good but I felt a bit out of the loop during the inspection phase. Would still recommend for the results.",
    date: "Feb 27, 2026",
    responseStatus: "pending",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-sm ${star <= rating ? "text-yellow-400" : "text-zinc-600"}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const totalReviews = reviews.length;
  const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1);
  const responseRate = Math.round(
    (reviews.filter((r) => r.responseStatus === "responded").length / totalReviews) * 100
  );

  const filterBySource = (source: string) =>
    source === "all" ? reviews : reviews.filter((r) => r.source === source);

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
            { icon: "⭐", label: "Reviews", href: "/reviews", active: true },
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
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Review Management</h2>
            <p className="text-zinc-400">Monitor and respond to reviews across all platforms.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-4">
                <p className="text-sm text-zinc-400">Average Rating</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-yellow-400">{avgRating}</p>
                  <StarRating rating={Math.round(Number(avgRating))} />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-4">
                <p className="text-sm text-zinc-400">Total Reviews</p>
                <p className="text-3xl font-bold text-blue-400">{totalReviews}</p>
                <p className="text-xs text-zinc-500 mt-1">Across all platforms</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-4">
                <p className="text-sm text-zinc-400">AI Response Rate</p>
                <p className="text-3xl font-bold text-green-400">{responseRate}%</p>
                <p className="text-xs text-zinc-500 mt-1">Automated responses</p>
              </CardContent>
            </Card>
          </div>

          {/* Reviews Feed */}
          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Sources</TabsTrigger>
              <TabsTrigger value="google">Google</TabsTrigger>
              <TabsTrigger value="facebook">Facebook</TabsTrigger>
              <TabsTrigger value="zillow">Zillow</TabsTrigger>
            </TabsList>

            {["all", "google", "facebook", "zillow"].map((source) => (
              <TabsContent key={source} value={source}>
                <div className="flex flex-col gap-4">
                  {filterBySource(source).map((review, i) => {
                    const src = sourceConfig[review.source];
                    return (
                      <Card key={i} className="bg-zinc-800/50 border-zinc-700">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${src.color}`}
                              >
                                {src.icon}
                              </span>
                              <div>
                                <p className="text-sm font-medium text-white">{review.reviewer}</p>
                                <div className="flex items-center gap-2">
                                  <StarRating rating={review.rating} />
                                  <span className="text-xs text-zinc-500">{review.date}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs ${src.color}`}>{src.label}</Badge>
                              <Badge
                                className={
                                  review.responseStatus === "responded"
                                    ? "bg-green-500/20 text-green-400 border-green-500/50"
                                    : "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                                }
                              >
                                {review.responseStatus === "responded"
                                  ? "AI Responded"
                                  : "Pending"}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-zinc-300 leading-relaxed">{review.text}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
    </div>
  );
}
