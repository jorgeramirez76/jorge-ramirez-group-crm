const TWENTY_API_URL = process.env.TWENTY_API_URL || "http://localhost:3000/rest";
const TWENTY_API_KEY = process.env.TWENTY_API_KEY || "";

export async function twentyFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${TWENTY_API_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${TWENTY_API_KEY}`,
    ...(options.headers as Record<string, string> || {}),
  };

  return fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  });
}

export interface TwentyPerson {
  id: string;
  name?: {
    firstName?: string;
    lastName?: string;
  };
  emails?: { primaryEmail?: string } | { primaryEmail?: string }[];
  phones?: { primaryPhoneNumber?: string } | { primaryPhoneNumber?: string }[];
  city?: string;
  createdAt?: string;
  updatedAt?: string;
  // Custom fields for real estate CRM
  leadType?: string;
  pipelineStage?: string;
  propertyAddress?: string;
  priceRange?: string;
  bedrooms?: string;
  desiredAreas?: string;
  timeline?: string;
  leadSource?: string;
  aiStatus?: string;
  assignedAgent?: string;
}

export function extractEmail(person: TwentyPerson): string {
  if (!person.emails) return "";
  if (Array.isArray(person.emails)) {
    return person.emails[0]?.primaryEmail || "";
  }
  return person.emails.primaryEmail || "";
}

export function extractPhone(person: TwentyPerson): string {
  if (!person.phones) return "";
  if (Array.isArray(person.phones)) {
    return person.phones[0]?.primaryPhoneNumber || "";
  }
  return person.phones.primaryPhoneNumber || "";
}

export function formatPersonName(person: TwentyPerson): string {
  const first = person.name?.firstName || "";
  const last = person.name?.lastName || "";
  return `${first} ${last}`.trim() || "Unknown";
}

export function timeAgo(dateStr?: string): string {
  if (!dateStr) return "Unknown";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}w ago`;
}
