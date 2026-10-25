/**
 * Every public page a visitor can jump to from the command palette (⌘K / Ctrl K).
 * Built from the same data the pages render, so titles and paths never drift. Loaded only when the
 * palette is first opened.
 */
import { SERVICES, EXPERTISE } from "./services-data";
import { canonicalForExpertise } from "./expertise-canonical";
import { SOLUTION_CATEGORIES } from "./solutions/categories";
import { ALL_SOLUTIONS, solutionPath } from "./solutions";
import { NICHES } from "./niches";
import { PROJECTS, projectSlug } from "./portfolio-data";
import { KNOWLEDGE } from "./knowledge-data";
import { CHECKLISTS } from "./checklists";
import { COMPARISONS } from "./comparisons";
import { LEAD_MAGNETS } from "./lead-magnets";

export type PageKind = "Page" | "Service" | "Expertise" | "Solution" | "Tool" | "Industry" | "Work" | "Guide" | "Account";
export interface PageEntry { title: string; href: string; kind: PageKind; hint?: string; keywords?: string }

const STATIC: PageEntry[] = [
  { kind: "Page", title: "Home", href: "/", keywords: "start main" },
  { kind: "Page", title: "Book a free strategy call", href: "/book", keywords: "calendar call meeting consultation calendly appointment" },
  { kind: "Page", title: "Contact", href: "/contact", keywords: "whatsapp phone email message" },
  { kind: "Page", title: "Pricing", href: "/pricing", keywords: "plans cost price monthly budget" },
  { kind: "Page", title: "All services", href: "/services" },
  { kind: "Page", title: "All solutions", href: "/solutions", keywords: "demos catalogue" },
  { kind: "Tool", title: "App feature planner", href: "/solutions/app-planner", keywords: "app plan features quote" },
  { kind: "Page", title: "Portfolio", href: "/portfolio", keywords: "work clients projects" },
  { kind: "Page", title: "Case studies", href: "/cases", keywords: "results stories" },
  { kind: "Page", title: "Testimonials", href: "/testimonials", keywords: "reviews" },
  { kind: "Page", title: "About EmmaForYou", href: "/about", keywords: "story founder emmanuel team" },
  { kind: "Page", title: "Why EmmaForYou", href: "/why-emmaforyou" },
  { kind: "Page", title: "Industries", href: "/industries" },
  { kind: "Page", title: "Affiliate programme", href: "/affiliate", keywords: "refer commission partner" },
  { kind: "Page", title: "Get started (business profile)", href: "/intake", keywords: "intake form brief onboarding" },
  { kind: "Page", title: "Blog", href: "/blog", keywords: "articles news" },
  { kind: "Page", title: "Community", href: "/community", keywords: "forum questions members" },
  { kind: "Page", title: "Knowledge base", href: "/knowledge-base", keywords: "guides playbooks" },
  { kind: "Page", title: "Free checklists", href: "/checklists" },
  { kind: "Page", title: "Comparisons", href: "/compare", keywords: "vs versus" },
  { kind: "Page", title: "Inspiration library", href: "/inspiration", keywords: "design examples websites stores emails gallery" },
  { kind: "Page", title: "Free resources", href: "/free-resources", keywords: "downloads toolkits templates" },
  { kind: "Page", title: "FAQ", href: "/faq", keywords: "questions answers help" },
  { kind: "Page", title: "Watch how it works", href: "/watch", keywords: "video" },
  { kind: "Page", title: "Newsletter", href: "/newsletter", keywords: "email subscribe" },
  { kind: "Page", title: "All free tools", href: "/tools" },
  { kind: "Tool", title: "Ecommerce Intelligence", href: "/ecommerce", keywords: "store shop online" },
  { kind: "Tool", title: "Ecommerce launch roadmap", href: "/ecommerce/start", keywords: "start store" },
  { kind: "Tool", title: "Product research & validation", href: "/ecommerce/research" },
  { kind: "Tool", title: "Online store audit", href: "/ecommerce/grow", keywords: "shopify audit" },
  { kind: "Tool", title: "Sales diagnosis", href: "/ecommerce/diagnose", keywords: "conversion funnel csv" },
  { kind: "Tool", title: "Profit analyzer", href: "/ecommerce/profit", keywords: "margin roas cac" },
  { kind: "Tool", title: "Competitor comparison", href: "/ecommerce/competitors" },
  { kind: "Tool", title: "Marketing experiment planner", href: "/ecommerce/marketing" },
  { kind: "Tool", title: "Ecommerce action plan", href: "/ecommerce/plan" },
  { kind: "Tool", title: "AI ecommerce guide", href: "/ecommerce/guide" },
  { kind: "Tool", title: "Ecommerce workspace", href: "/ecommerce/workspace" },
  { kind: "Tool", title: "Platforms & integrations", href: "/ecommerce/integrations" },
  { kind: "Tool", title: "Website audit", href: "/website-audit", keywords: "speed seo lighthouse score" },
  { kind: "Tool", title: "AI receptionist demo", href: "/ai-receptionist", keywords: "chatbot voice booking" },
  { kind: "Tool", title: "AI website makeover", href: "/makeover", keywords: "redesign screenshot" },
  { kind: "Tool", title: "Instant proposal & quote", href: "/proposal", keywords: "quote estimate" },
  { kind: "Tool", title: "Smart contract check", href: "/smart-contract-check", keywords: "solidity web3 security" },
  { kind: "Tool", title: "90-day goal planner", href: "/goal-planner", keywords: "goals coaching" },
  { kind: "Tool", title: "ROI calculator", href: "/roi-calculator", keywords: "return revenue" },
  { kind: "Tool", title: "Growth quiz", href: "/growth-quiz" },
  { kind: "Tool", title: "Email sequence generator", href: "/email-generator", keywords: "emails welcome abandoned cart" },
  { kind: "Tool", title: "Business growth assessment", href: "/analyser", keywords: "score analyser" },
  { kind: "Account", title: "Sign in or create an account", href: "/login", keywords: "login register signup" },
  { kind: "Account", title: "Your account", href: "/account", keywords: "profile settings" },
  { kind: "Account", title: "Client portal", href: "/portal", keywords: "projects invoices approvals files" },
  { kind: "Page", title: "Privacy policy", href: "/privacy" },
  { kind: "Page", title: "Terms", href: "/terms" },
  { kind: "Page", title: "Cookie policy", href: "/cookies" },
];

let CACHE: PageEntry[] | null = null;
export function pageIndex(): PageEntry[] {
  if (CACHE) return CACHE;
  const out: PageEntry[] = [...STATIC];
  for (const s of SERVICES) out.push({ kind: "Service", title: s.name, href: `/services/${s.slug}`, hint: s.short });
  for (const e of EXPERTISE) {
    const href = canonicalForExpertise(e.slug);
    if (href === `/expertise/${e.slug}`) out.push({ kind: "Expertise", title: e.name, href });
  }
  for (const c of SOLUTION_CATEGORIES) out.push({ kind: "Solution", title: c.name, href: `/solutions/${c.slug}`, hint: c.short });
  for (const s of ALL_SOLUTIONS) out.push({ kind: "Solution", title: s.name, href: solutionPath(s), hint: s.tagline });
  for (const n of NICHES) out.push({ kind: "Industry", title: n.name, href: `/niche/${n.slug}` });
  for (const p of PROJECTS) out.push({ kind: "Work", title: p.name, href: `/portfolio/${projectSlug(p.name)}`, hint: p.category });
  for (const a of KNOWLEDGE) out.push({ kind: "Guide", title: a.title, href: `/knowledge-base/${a.slug}`, hint: a.category });
  for (const c of CHECKLISTS) out.push({ kind: "Guide", title: c.title, href: `/checklists/${c.slug}` });
  for (const c of COMPARISONS) out.push({ kind: "Guide", title: c.title, href: `/compare/${c.slug}` });
  for (const m of LEAD_MAGNETS) out.push({ kind: "Guide", title: m.title, href: `/free-resources/${m.slug}` });
  const seen = new Set<string>();
  CACHE = out.filter((e) => (seen.has(e.href) ? false : (seen.add(e.href), true)));
  return CACHE;
}

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^\p{L}\p{N}\s]/gu, " ");

/** Every query word must appear (as a word prefix) in the title, hint or keywords; title matches rank highest. */
export function searchPages(query: string, limit = 12): PageEntry[] {
  const words = norm(query).split(/\s+/).filter(Boolean);
  const all = pageIndex();
  if (!words.length) return all.filter((e) => e.kind === "Page" || e.kind === "Tool").slice(0, limit);
  const scored: { e: PageEntry; s: number }[] = [];
  for (const e of all) {
    const title = norm(e.title), rest = norm(`${e.hint ?? ""} ${e.keywords ?? ""} ${e.kind}`);
    const tw = title.split(/\s+/), rw = rest.split(/\s+/);
    let s = 0; let ok = true;
    for (const w of words) {
      if (tw.some((t) => t.startsWith(w))) s += tw[0].startsWith(w) ? 6 : 4;
      else if (rw.some((t) => t.startsWith(w))) s += 1.5;
      else if (title.includes(w)) s += 1;
      else { ok = false; break; }
    }
    if (!ok) continue;
    if (title === words.join(" ")) s += 8;
    if (e.kind === "Page" || e.kind === "Service" || e.kind === "Tool") s += 0.5;
    scored.push({ e, s: s - title.length / 400 });
  }
  return scored.sort((a, b) => b.s - a.s).slice(0, limit).map((x) => x.e);
}
