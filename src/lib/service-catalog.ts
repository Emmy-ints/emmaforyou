/**
 * The complete, verified service catalogue: every service page (/services/*), every expertise page
 * that isn't a duplicate of a service page (/expertise/*) and every solution area (/solutions/*),
 * grouped into capability families. Built only from existing data, so every link is a real route
 * and nothing is claimed that the service pages don't already describe.
 */
import { EXPERTISE, SERVICES, SERVICE_TO_EXPERTISE } from "./services-data";
import { SOLUTION_CATEGORIES } from "./solutions/categories";

export type FamilyId = "web" | "ecom" | "design" | "ai" | "apps" | "marketing" | "web3" | "strategy" | "solutions";

export interface Family { id: FamilyId; name: string; short: string; hue: string; icon: string }
export interface CatalogItem {
  id: string; name: string; short: string; href: string; family: FamilyId; icon: string;
  /** Platforms and tools named on the service's own page. */
  tools: string[]; kind: "Service" | "Expertise" | "Solution area"; detail?: string;
}

export const FAMILIES: Family[] = [
  { id: "web", name: "Websites & landing pages", short: "Design, build, redesign and speed up the site customers judge you by.", hue: "#3dd6f5", icon: "🌐" },
  { id: "ecom", name: "Ecommerce", short: "Stores that sell: Shopify, WooCommerce, checkout, product pages and growth.", hue: "#ff8a4c", icon: "🛍️" },
  { id: "design", name: "UI/UX & messaging", short: "Interfaces that are easy to use and words that make people buy.", hue: "#ff6bb5", icon: "🎨" },
  { id: "ai", name: "AI agents & automation", short: "AI assistants, chatbots, CRMs and workflows that work around the clock.", hue: "#8b7bff", icon: "🤖" },
  { id: "apps", name: "Apps & software", short: "Mobile, web and desktop apps, portals and business software.", hue: "#4f7bff", icon: "📲" },
  { id: "marketing", name: "Marketing & growth", short: "SEO, ads, email, social, lead generation and analytics.", hue: "#3ddc97", icon: "📈" },
  { id: "web3", name: "Web3 & blockchain", short: "dApps, wallets, smart contracts in Solidity and crypto projects.", hue: "#b9a6ff", icon: "⛓️" },
  { id: "strategy", name: "Strategy & coaching", short: "Digital strategy, business consulting and weekly accountability.", hue: "#f5b544", icon: "🧭" },
  { id: "solutions", name: "Ready-made solutions", short: "Build-ready systems you can try first, each with a live demo.", hue: "#7ee8fb", icon: "🧩" },
];

const FAMILY_OF: Record<string, FamilyId> = {
  "website-design": "web", "website-landing-pages": "web", wordpress: "web", "funnel-building": "web", "conversion-rate-optimisation": "web",
  ecommerce: "ecom", "shopify-ecommerce": "ecom",
  "ui-ux-design": "design", copywriting: "design",
  "ai-automation": "ai", "crm-systems": "ai", "social-media-automation": "ai",
  "app-development": "apps",
  "email-marketing": "marketing", "social-media": "marketing", "ad-marketing": "marketing", "paid-ads": "marketing", seo: "marketing", "lead-generation": "marketing",
  "marketing-promotion": "marketing", analytics: "marketing", "sales-conversion": "marketing",
  "web3-development": "web3", "smart-contract-development": "web3", "blockchain-crypto": "web3",
  "digital-strategy": "strategy", "business-consulting": "strategy", "accountability-coaching": "strategy",
};

let CACHE: CatalogItem[] | null = null;
export function catalog(): CatalogItem[] {
  if (CACHE) return CACHE;
  const out: CatalogItem[] = [];
  const mapped = new Set(Object.values(SERVICE_TO_EXPERTISE));
  for (const s of SERVICES) {
    const exp = EXPERTISE.find((e) => e.slug === SERVICE_TO_EXPERTISE[s.slug]);
    out.push({ id: `svc-${s.slug}`, name: s.name, short: exp?.short ?? s.short, href: `/services/${s.slug}`, family: FAMILY_OF[s.slug] ?? "strategy", icon: s.icon, tools: exp?.tools ?? [], kind: "Service", detail: exp?.hero.sub });
  }
  for (const e of EXPERTISE) {
    if (mapped.has(e.slug)) continue; // the service page is canonical for these
    out.push({ id: `exp-${e.slug}`, name: e.name, short: e.short, href: `/expertise/${e.slug}`, family: FAMILY_OF[e.slug] ?? "strategy", icon: e.icon, tools: e.tools, kind: "Expertise", detail: e.hero.sub });
  }
  for (const c of SOLUTION_CATEGORIES) {
    out.push({ id: `sol-${c.slug}`, name: c.name, short: c.short, href: `/solutions/${c.slug}`, family: "solutions", icon: c.icon, tools: [], kind: "Solution area", detail: `${c.intro} Every solution in this area has a live demo you can customise.` });
  }
  CACHE = out;
  return out;
}

export const itemsIn = (f: FamilyId) => catalog().filter((i) => i.family === f);
