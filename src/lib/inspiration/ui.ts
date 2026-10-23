/** Client-side labels and helpers for the inspiration library (no crawler code here). */
import type { Kind } from "./extract";

export const KIND_LABEL: Record<Kind, string> = {
  ecommerce: "Shopify & ecommerce", email: "Email", landing_page: "Landing page", website: "Website", saas: "SaaS",
  dashboard: "Dashboard & web app", mobile_app: "Mobile app", component: "UI component & kit", portfolio: "Portfolio", design_concept: "Design concept",
};
export const KIND_ORDER: Kind[] = ["ecommerce", "email", "landing_page", "website", "saas", "dashboard", "mobile_app", "component", "portfolio", "design_concept"];

export interface Example {
  id: string; title: string; brand: string | null; description?: string | null; kind: Kind; tags: string[]; industries: string[]; styles: string[]; colors: string[];
  theme: "light" | "dark" | null; platform: string | null; image_url: string | null; image_status: string; source_id: string; original_url: string | null; listing_url: string;
  also_listed_on?: string[]; discovered_at: string; updated_at: string; link_status?: string; link_checked_at?: string | null; attribution?: string | null; source_published_at?: string | null;
}
export interface SourceInfo { id: string; name: string; home_url: string; category: string; status: string; imported_total: number; last_success_at: string | null; restriction: string | null; method: string; method_notes?: string; status_reason?: string | null; enabled: boolean; sort: number }
export interface Facets { total: number; kinds: Record<string, number>; sources: Record<string, number>; industries: Record<string, number>; styles: Record<string, number>; colors: Record<string, number>; platforms: Record<string, number>; themes: Record<string, number> }

export const CARD_COLUMNS = "id,title,brand,kind,tags,industries,styles,colors,theme,platform,image_url,image_status,source_id,original_url,listing_url,discovered_at,updated_at";

/** Only http(s) links are ever rendered. */
export function safeHref(u: string | null | undefined): string | null {
  if (!u) return null;
  try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.toString() : null; } catch { return null; }
}
export const hostLabel = (u: string | null | undefined) => { try { return u ? new URL(u).hostname.replace(/^www\./, "") : ""; } catch { return ""; } };

export interface Search { q?: string; kind?: Kind; source?: string; industry?: string; style?: string; color?: string; theme?: "light" | "dark"; platform?: string; sort?: "newest" | "updated" | "az"; saved?: "1"; collection?: string }
const s = (v: unknown, max = 60) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
export function validateSearch(raw: Record<string, unknown>): Search {
  const out: Search = {};
  const q = s(raw.q, 80); if (q) out.q = q;
  if (KIND_ORDER.includes(raw.kind as Kind)) out.kind = raw.kind as Kind;
  for (const k of ["source", "industry", "style", "color", "platform", "collection"] as const) { const v = s(raw[k], 60); if (v) out[k] = v; }
  if (raw.theme === "light" || raw.theme === "dark") out.theme = raw.theme;
  if (raw.sort === "updated" || raw.sort === "az") out.sort = raw.sort;
  if (raw.saved === "1" || raw.saved === 1) out.saved = "1";
  return out;
}
/** Text search safe for PostgREST filters: no operators, commas or quotes. */
export const cleanQuery = (q: string) => q.replace(/[^\p{L}\p{N}\s'&.+-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80);

export const STATUS_LABEL: Record<string, string> = { working: "Working", partial: "Partially available", blocked: "Blocked by source", not_started: "Not yet imported", disabled: "Switched off" };
