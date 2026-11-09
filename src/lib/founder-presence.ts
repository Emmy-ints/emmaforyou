/**
 * Founder presence: where and how Emmanuel's real portrait (crops of /images/emmanuel.webp) appears
 * on each page. Every public page gets one tasteful presence; pages are grouped by type so new pages,
 * dynamic routes and CMS pages inherit it automatically. Owners control it from the control room
 * (Content → Founder portrait) through site settings: `founder`, `founder:<type>`, `founder:/path`.
 * Captions only reuse wording the owner already approved elsewhere on the site.
 */
import type { Settings } from "./site-settings";

export type FounderPlacement = "auto" | "signature" | "watermark" | "byline";
export type FounderSize = "sm" | "md" | "lg";
export interface FounderConfig { on: boolean; size: FounderSize; placement: FounderPlacement }

export const PAGE_TYPES: { id: string; name: string; match: (p: string) => boolean; role: string; placement: FounderPlacement; href: string }[] = [
  { id: "services", name: "Services & service pages", match: (p) => /^\/(services|expertise)(\/|$)/.test(p), role: "Founder · reads every brief personally", placement: "auto", href: "/about" },
  { id: "solutions", name: "Solutions, categories & solution pages", match: (p) => p.startsWith("/solutions"), role: "Founder · reads every brief personally", placement: "auto", href: "/about" },
  { id: "industries", name: "Industries & niche pages", match: (p) => p === "/industries" || p.startsWith("/niche/"), role: "Founder · helping businesses grow from Lagos to the world", placement: "auto", href: "/about" },
  { id: "blog", name: "Blog, knowledge base & resources", match: (p) => /^\/(blog|knowledge-base|checklists|free-resources|newsletter)(\/|$)/.test(p), role: "Founder of EmmaForYou", placement: "signature", href: "/about" },
  { id: "pricing", name: "Pricing", match: (p) => p === "/pricing", role: "Founder · you'll speak with me directly", placement: "auto", href: "/book" },
  { id: "booking", name: "Booking, contact & intake", match: (p) => /^\/(book|contact|intake)(\/|$)/.test(p), role: "Founder · you'll speak with me directly", placement: "auto", href: "/about" },
  { id: "community", name: "Community", match: (p) => p.startsWith("/community"), role: "Founder of EmmaForYou", placement: "byline", href: "/about" },
  { id: "publishing", name: "eBook publishing & book tools", match: (p) => p.startsWith("/publishing"), role: "Founder · reads every brief personally", placement: "auto", href: "/about" },
  { id: "ecommerce", name: "Ecommerce Intelligence", match: (p) => p.startsWith("/ecommerce"), role: "Founder of EmmaForYou", placement: "auto", href: "/about" },
  { id: "tools", name: "Free tools, planners, demos & labs", match: (p) => /^\/(tools|ai-receptionist|website-audit|proposal|makeover|roi-calculator|goal-planner|growth-quiz|email-generator|smart-contract-check|analyser|lab|explore|inspiration|compare|watch)(\/|$)/.test(p), role: "Founder of EmmaForYou", placement: "auto", href: "/about" },
  { id: "work", name: "Portfolio, case studies & testimonials", match: (p) => /^\/(portfolio|cases|testimonials)(\/|$)/.test(p), role: "Founder & CEO, EmmaForYou", placement: "auto", href: "/about" },
  { id: "company", name: "Why us, FAQ, affiliates & interns", match: (p) => /^\/(why-emmaforyou|faq|affiliate|interns)(\/|$)/.test(p), role: "Founder & CEO, EmmaForYou", placement: "auto", href: "/about" },
  { id: "locale", name: "Language landing pages (FR, DE)", match: (p) => p === "/fr" || p === "/de", role: "Founder & CEO, EmmaForYou", placement: "auto", href: "/about" },
  { id: "legal", name: "Privacy, terms, cookies & utility pages", match: (p) => /^\/(privacy|terms|cookies|unsubscribe)(\/|$)/.test(p), role: "Founder & CEO, EmmaForYou", placement: "byline", href: "/about" },
  // Pages with their own, hand-placed founder portrait (homepage hero, About hero) — the global layer stays out.
  { id: "home", name: "Homepage (portrait docked to the hero demo)", match: (p) => p === "/", role: "", placement: "auto", href: "/about" },
  { id: "about", name: "About (arched portrait in the hero)", match: (p) => p === "/about", role: "", placement: "auto", href: "/about" },
  // Anything else public (new pages, future CMS pages) still gets a presence.
  { id: "other", name: "Other and future pages", match: () => true, role: "Founder & CEO, EmmaForYou", placement: "auto", href: "/about" },
];

/** Signed-in, private and admin areas, and saved prototypes (/p/<slug>: the visitor's own work): the logo badge is enough there. */
export const PRIVATE_FOUNDER = /^\/(dashboard|account|portal|login|p)(\/|$|_)|^\/community\/(inbox|messages|notifications|settings|saved|moderation)(\/|$)/;

export function pageType(path: string) {
  return PAGE_TYPES.find((t) => t.match(path)) ?? PAGE_TYPES[PAGE_TYPES.length - 1];
}

/** Path rule match: exact path, or a prefix rule ending in "/*". */
function pathRule(settings: Settings, path: string) {
  const exact = settings[`founder:${path}`];
  if (exact) return exact;
  let best: { len: number; v: Settings[string] } | null = null;
  for (const [k, v] of Object.entries(settings)) {
    if (!k.startsWith("founder:/") || !k.endsWith("/*")) continue;
    const prefix = k.slice("founder:".length, -2);
    if ((path === prefix || path.startsWith(`${prefix}/`)) && (!best || prefix.length > best.len)) best = { len: prefix.length, v };
  }
  return best?.v;
}

/** Effective config for a page: built-in defaults ← global ← page type ← page/prefix rule. */
export function founderConfig(settings: Settings, path: string): FounderConfig & { type: string; role: string; href: string } {
  const t = pageType(path);
  const g = settings.founder ?? {}, ty = settings[`founder:${t.id}`] ?? {}, pg = pathRule(settings, path) ?? {};
  const pick = <K extends keyof FounderConfig>(k: K, d: FounderConfig[K]): FounderConfig[K] => (pg[k] ?? ty[k] ?? g[k] ?? d) as FounderConfig[K];
  const globalOn = g.on !== false;
  const on = globalOn && (pg.on ?? ty.on ?? true) && !PRIVATE_FOUNDER.test(path);
  const placement = (pg.placement ?? ty.placement ?? (g.placement && g.placement !== "auto" ? g.placement : t.placement)) as FounderPlacement;
  return { on, size: pick("size", "md"), placement, type: t.id, role: t.role, href: t.href };
}
