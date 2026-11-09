/**
 * Public showcase ("Made on EmmaForYou"): what visitors built with the free tools and chose to show.
 * Pure helpers shared by the server (/api/showcase) and the pages: industry detection, privacy scrubbing,
 * titles, and the client-side "my items" list (private remove links). Tested in tests/showcase.
 */
import { z } from "zod";
import { NICHES } from "./niches";

export type ShowcaseKind = "app" | "website" | "makeover" | "audit" | "emails" | "plan";

export const KIND_LABEL: Record<ShowcaseKind, { one: string; many: string; tool: string; toolPath: string }> = {
  app: { one: "App prototype", many: "Apps", tool: "App prototype builder", toolPath: "/?proto_kind=app#prototype" },
  website: { one: "Website prototype", many: "Websites", tool: "Website prototype builder", toolPath: "/?proto_kind=website#prototype" },
  makeover: { one: "Website makeover", many: "Makeovers", tool: "AI website makeover", toolPath: "/makeover" },
  audit: { one: "Website audit", many: "Audits", tool: "AI website audit", toolPath: "/website-audit" },
  emails: { one: "Email sequence", many: "Email sequences", tool: "Email sequence generator", toolPath: "/email-generator" },
  plan: { one: "90-day plan", many: "90-day plans", tool: "90-day goal planner", toolPath: "/goal-planner" },
};

/** Whether a kind is shown by default (visitor can untick). Makeovers and audits are about a real, existing website, so off by default. */
export const DEFAULT_SHOW: Record<ShowcaseKind, boolean> = { app: true, website: true, emails: true, plan: true, makeover: false, audit: false };

// Whole words only (plus plural), so "space" isn't a spa and "current" isn't rent.
const words = (list: string) => new RegExp(`\\b(?:${list})(?:s|es)?\\b`, "i");
const INDUSTRY_RULES: [string, RegExp][] = [
  ["salon", words("salon|spa|barber|barbershop|beauty|hair|hairdresser|nail|lash|braid|braiding|makeup|skincare|cosmetic")],
  ["restaurant", words("restaurant|food|kitchen|cafe|café|bakery|bakeries|pizza|pizzeria|chop|meal|catering|caterer|bar|grill|suya|jollof|menu|bukka|eatery|eateries")],
  ["clinic", words("clinic|doctor|dental|dentist|hospital|pharmacy|pharmacies|health|healthcare|therapy|therapist|physio|medical|patient")],
  ["hotel", words("hotel|guest ?house|resort|lodge|airbnb|hostel|motel")],
  ["real-estate", words("real estate|property|properties|realtor|apartment|house|rent|rental|estate agent|shortlet|letting")],
  ["fashion-store", words("fashion|boutique|clothing|cloth|clothe|wear|tailor|fabric|ankara|shoe|sneaker|jewel|jewelry|jewellery")],
  ["ecommerce", words("e-?commerce|online store|online shop|shopify|woocommerce|store|shop|product")],
  ["school", words("school|academy|academies|student|teacher|tutor|tutoring|lesson|course|education|learning|university|universities")],
  ["gym", words("gym|fitness|workout|yoga|pilates|crossfit|personal trainer")],
  ["coach", words("coach|coaching|consultant|consulting|consultancy|mentor|mentoring|trainer|speaker")],
  ["auto-dealer", words("car dealer|car|auto|vehicle|garage|mechanic|dealership")],
  ["saas", words("saas|software|startup|platform|b2b|crm|dashboard")],
];

/** Best-guess industry page for a piece of text (prompt, goal, business type). */
export function detectIndustry(...texts: (string | undefined | null)[]): string | null {
  const t = texts.filter(Boolean).join(" ");
  for (const [slug, re] of INDUSTRY_RULES) if (re.test(t) && NICHES.some((n) => n.slug === slug)) return slug;
  return null;
}

export const industryName = (slug?: string | null) => NICHES.find((n) => n.slug === slug)?.name ?? null;

const EMAIL = /[^\s@<>()]+@[^\s@<>()]+\.[a-z]{2,}/gi;
const PHONE = /(?:\+?\d[\d\s().-]{6,}\d)/g;
const URLISH = /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|ng|net|org|io|co|uk|de|fr|app|shop|store)(?:\/\S*)?\b/gi;

/** Remove contact details (emails, phone numbers, links) and optionally names from free text. */
export function scrub(text: string, opts: { names?: string[]; max?: number } = {}): string {
  let s = String(text ?? "").replace(EMAIL, "[email]").replace(URLISH, "[link]").replace(PHONE, (m) => (m.replace(/\D/g, "").length >= 7 ? "[phone]" : m));
  for (const n of opts.names ?? []) {
    const name = n.trim();
    if (name.length >= 3) s = s.replace(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "[business]");
  }
  s = s.replace(/\s+/g, " ").trim();
  const max = opts.max ?? 400;
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

/** Words that would make an item unsuitable for a public wall (kept short; staff can hide anything else). */
const BLOCK = /\b(fuck|shit|bitch|cunt|nigger|faggot|porn|xxx|nude|escort|casino|bet9ja|betting|loan shark|crypto doubling|hack(ing)? whatsapp|scam)\b/i;
export const unsuitable = (...texts: (string | undefined | null)[]) => BLOCK.test(texts.filter(Boolean).join(" "));

/** Deterministic JSON (sorted keys) so the server can sign and later re-check exactly the same content. */
export function stableStringify(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v ?? null);
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`).join(",")}}`;
}

/** "A restaurant app", "A salon website" — used when the visitor didn't ask to show their business name. */
export function genericTitle(kind: ShowcaseKind, industry: string | null, extra?: string): string {
  const who = industry ? industryName(industry)!.replace(/ & .*/, "").replace(/ies$/, "y").replace(/s$/, "").toLowerCase() : "";
  const label: Record<ShowcaseKind, string> = { app: "app", website: "website", makeover: "website makeover", audit: "website audit", emails: "email sequence", plan: "90-day plan" };
  const base = who ? `${who.charAt(0).toUpperCase()}${who.slice(1)} ${label[kind]}` : `${KIND_LABEL[kind].one}`;
  return extra ? `${base}: ${extra}`.slice(0, 90) : base;
}

/* ─────────────── request validation (server) ─────────────── */

export const showcaseRequestSchema = z.object({
  kind: z.enum(["app", "website", "makeover", "audit", "emails", "plan"]),
  sig: z.string().regex(/^[a-f0-9]{64}$/),
  content: z.unknown(),
  prompt: z.string().trim().max(600).optional(),
  showBusiness: z.boolean().default(false),
  business: z.string().trim().max(80).optional(),
  place: z.string().trim().max(60).optional(),
  showSite: z.boolean().default(false),
  lang: z.string().regex(/^[a-z]{2}$/).default("en"),
});
export type ShowcaseRequest = z.infer<typeof showcaseRequestSchema>;

/* ─────────────── "my items" (browser only) ─────────────── */

const MINE = "efy_showcase_mine";
export interface MyItem { slug: string; token: string; title: string; kind: ShowcaseKind; at: string }

export function myItems(): MyItem[] {
  try { const v = JSON.parse(localStorage.getItem(MINE) || "[]"); return Array.isArray(v) ? v.slice(0, 50) : []; } catch { return []; }
}
export function rememberItem(item: MyItem) {
  try { localStorage.setItem(MINE, JSON.stringify([item, ...myItems().filter((x) => x.slug !== item.slug)].slice(0, 50))); } catch { /* storage blocked */ }
}
export function forgetItem(slug: string) {
  try { localStorage.setItem(MINE, JSON.stringify(myItems().filter((x) => x.slug !== slug))); } catch { /* storage blocked */ }
}
