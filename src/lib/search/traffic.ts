/**
 * First-party traffic attribution from `site_events` (referrer host + UTM tags recorded by
 * lib/analytics.ts). Sessions are the unit: a session's channel is taken from its first event
 * (last-non-direct is not attempted), and a session converts at most once per conversion group,
 * so repeated clicks are never double-counted. Labels are this site's own classification, not GA4's.
 */
import { conversionRate, rate } from "./metrics";

export type Channel = "organic_search" | "ai_assistant" | "paid" | "social" | "email" | "referral" | "direct";
export const CHANNEL_LABEL: Record<Channel, string> = {
  organic_search: "Organic search", ai_assistant: "AI assistants", paid: "Paid", social: "Social", email: "Email", referral: "Other websites", direct: "Direct / unknown",
};

const SEARCH: [RegExp, string][] = [
  [/(^|\.)google\.[a-z.]+$/, "Google"], [/(^|\.)bing\.com$/, "Bing"], [/(^|\.)duckduckgo\.com$/, "DuckDuckGo"], [/(^|\.)search\.yahoo\.com$|(^|\.)yahoo\.com$/, "Yahoo"],
  [/(^|\.)ecosia\.org$/, "Ecosia"], [/(^|\.)yandex\.[a-z]+$/, "Yandex"], [/(^|\.)baidu\.com$/, "Baidu"], [/(^|\.)search\.brave\.com$/, "Brave"], [/(^|\.)startpage\.com$/, "Startpage"], [/(^|\.)qwant\.com$/, "Qwant"],
];
/** AI assistants that pass a referrer when a person clicks a cited link. */
const AI: [RegExp, string][] = [
  [/(^|\.)chatgpt\.com$|(^|\.)chat\.openai\.com$/, "ChatGPT"], [/(^|\.)perplexity\.ai$/, "Perplexity"], [/(^|\.)copilot\.microsoft\.com$/, "Microsoft Copilot"],
  [/(^|\.)gemini\.google\.com$|(^|\.)bard\.google\.com$/, "Gemini"], [/(^|\.)claude\.ai$/, "Claude"], [/(^|\.)you\.com$/, "You.com"], [/(^|\.)meta\.ai$/, "Meta AI"], [/(^|\.)phind\.com$/, "Phind"], [/(^|\.)deepseek\.com$/, "DeepSeek"], [/(^|\.)grok\.com$/, "Grok"],
];
const SOCIAL = /(^|\.)(facebook|fb|instagram|l\.instagram|t|twitter|x|linkedin|lnkd|tiktok|youtube|youtu|pinterest|reddit|threads|snapchat|whatsapp|wa|telegram|t\.me)\.(com|me|net|co|in|be|org)$|^t\.co$|^lm\.facebook\.com$|^m\.facebook\.com$/;
const EMAIL = /(^|\.)(mail\.google|outlook\.live|mail\.yahoo|outlook\.office)\.com$/;

export function classifyChannel(referrer: string | null | undefined, utmSource?: string | null, utmMedium?: string | null): { channel: Channel; source: string } {
  const med = (utmMedium ?? "").toLowerCase();
  const src = (utmSource ?? "").toLowerCase();
  const host = (referrer ?? "").toLowerCase().replace(/^www\./, "");
  if (/^(cpc|ppc|paid|paidsearch|paid_social|paidsocial|display|cpm|ads?)$/.test(med)) return { channel: "paid", source: src || host || "paid" };
  if (med === "email" || med === "newsletter") return { channel: "email", source: src || "email" };
  for (const [re, name] of AI) if (re.test(host) || (src && re.test(src))) return { channel: "ai_assistant", source: name };
  if (src === "chatgpt.com" || src === "openai") return { channel: "ai_assistant", source: "ChatGPT" };
  if (med === "organic") return { channel: "organic_search", source: src || host || "search" };
  for (const [re, name] of SEARCH) if (re.test(host)) return { channel: "organic_search", source: name };
  if (med === "social" || SOCIAL.test(host)) return { channel: "social", source: src || host };
  if (EMAIL.test(host)) return { channel: "email", source: host };
  if (host) return { channel: "referral", source: host };
  if (src) return { channel: "referral", source: src };
  return { channel: "direct", source: "(none)" };
}

/** Enquiries: the visitor asked for something. Contact clicks are tracked separately. */
export const ENQUIRY_EVENTS = ["lead_submitted", "intake_submitted", "call_booked", "assistant_lead", "proposal_accepted", "audit_requested", "affiliate_signup", "publishing_enquiry_submitted"] as const;
export const CONTACT_EVENTS = ["whatsapp_click", "phone_click", "email_click"] as const;

export interface EventRow { event: string; path: string | null; session_id: string; referrer: string | null; utm_source: string | null; utm_medium: string | null; created_at: string; device?: string | null; language?: string | null }
export interface ChannelStats { channel: Channel; sessions: number; enquirySessions: number; contactSessions: number; enquiryRate: number | null; contactRate: number | null; sources: Record<string, number>; landing: Record<string, number> }
export interface TrafficSummary { from: string; to: string; sessions: number; events: number; channels: ChannelStats[]; aiSources: Record<string, number>; searchSources: Record<string, number>; enquirySessions: number }

/** Summarise events in [from, to). Expects rows for that window; earlier-session events outside it are ignored. */
export function summarizeTraffic(rows: EventRow[], from: string, to: string): TrafficSummary {
  const lo = Date.parse(from), hi = Date.parse(to);
  const inWin = rows.filter((r) => { const t = Date.parse(r.created_at); return t >= lo && t < hi; }).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const sessions = new Map<string, { channel: Channel; source: string; landing: string; enquiry: boolean; contact: boolean }>();
  for (const r of inWin) {
    let s = sessions.get(r.session_id);
    if (!s) { const c = classifyChannel(r.referrer, r.utm_source, r.utm_medium); s = { ...c, landing: r.path ?? "/", enquiry: false, contact: false }; sessions.set(r.session_id, s); }
    if ((ENQUIRY_EVENTS as readonly string[]).includes(r.event)) s.enquiry = true;
    if ((CONTACT_EVENTS as readonly string[]).includes(r.event)) s.contact = true;
  }
  const by = new Map<Channel, ChannelStats>();
  for (const s of sessions.values()) {
    const c = by.get(s.channel) ?? { channel: s.channel, sessions: 0, enquirySessions: 0, contactSessions: 0, enquiryRate: null, contactRate: null, sources: {}, landing: {} };
    c.sessions++; if (s.enquiry) c.enquirySessions++; if (s.contact) c.contactSessions++;
    c.sources[s.source] = (c.sources[s.source] ?? 0) + 1;
    c.landing[s.landing] = (c.landing[s.landing] ?? 0) + 1;
    by.set(s.channel, c);
  }
  const channels = [...by.values()].map((c) => ({ ...c, enquiryRate: conversionRate(c.enquirySessions, c.sessions), contactRate: rate(c.contactSessions, c.sessions) })).sort((a, b) => b.sessions - a.sessions);
  return {
    from, to, sessions: sessions.size, events: inWin.length, channels,
    aiSources: by.get("ai_assistant")?.sources ?? {},
    searchSources: by.get("organic_search")?.sources ?? {},
    enquirySessions: [...sessions.values()].filter((s) => s.enquiry).length,
  };
}
