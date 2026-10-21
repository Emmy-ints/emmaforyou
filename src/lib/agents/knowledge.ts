/**
 * Verified company knowledge for the agents, built from the site's own catalogue code (server-side).
 * Only descriptive facts and real page paths are included: no testimonials, results or claims from
 * marketing copy, so agents can't repeat them as evidence. Pricing comes only from pricing-data.
 */
import { EXPERTISE } from "@/lib/services-data";
import { ALL_SOLUTIONS, SOLUTION_CATEGORIES } from "@/lib/solutions";
import { NICHES } from "@/lib/niches";
import { TOOLS_DIRECTORY } from "@/lib/tools-data";
import { TIERS } from "@/lib/pricing-data";
import { canonicalForExpertise } from "@/lib/expertise-canonical";
import { sitemapPaths } from "@/lib/seo-routes";
import type { NicheType } from "./directory";

export interface KnowledgeEntry { ref: string; layer: "company" | "service" | "policy"; title: string; path: string | null; body: string; keywords: string[]; niche: { type: NicheType; key: string } | null }

const words = (s: string) => [...new Set(s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w.length > 3))].slice(0, 24);

/** Every page an agent may link to (the sitemap plus the community and contact pages). */
export function allowedPaths(): Set<string> {
  const s = new Set(sitemapPaths().map((p) => p.path));
  ["/community", "/community/guidelines", "/book", "/contact", "/proposal", "/pricing", "/login", "/portal", "/intake", "/tools", "/ecommerce/guide", "/ecommerce/plan", "/ecommerce/integrations"].forEach((p) => s.add(p));
  return s;
}

export function catalogueKnowledge(): KnowledgeEntry[] {
  const out: KnowledgeEntry[] = [];
  for (const e of EXPERTISE) {
    const path = canonicalForExpertise(e.slug);
    out.push({ ref: `expertise:${e.slug}`, layer: "service", title: e.name, path, niche: { type: "expertise", key: e.slug },
      body: `${e.short}. ${e.hero.sub} Who it's for: ${e.forYou.join("; ")}. Typical tools: ${e.tools.join(", ")}. Process: ${e.process.map((p) => p.title).join(" → ")}.`.slice(0, 1500),
      keywords: words(`${e.name} ${e.short} ${e.tools.join(" ")}`) });
  }
  for (const c of SOLUTION_CATEGORIES) out.push({ ref: `category:${c.slug}`, layer: "service", title: c.name, path: `/solutions/${c.slug}`, niche: { type: "solution_category", key: c.slug }, body: c.short, keywords: words(`${c.name} ${c.short}`) });
  for (const s of ALL_SOLUTIONS) {
    const isIndustry = s.category === "industries";
    out.push({ ref: `solution:${s.category}/${s.slug}`, layer: "service", title: s.name, path: `/solutions/${s.category}/${s.slug}`,
      niche: isIndustry ? { type: "industry", key: s.slug } : { type: "solution", key: `${s.category}/${s.slug}` },
      body: `${s.tagline} Who needs it: ${s.who}. Solves: ${s.problems.join("; ")}. Core features: ${s.features.slice(0, 8).join(", ")}.`.slice(0, 1500),
      keywords: words(`${s.name} ${s.tagline} ${s.group}`) });
  }
  for (const n of NICHES) out.push({ ref: `niche:${n.slug}`, layer: "service", title: `${n.name} (industry page)`, path: `/niche/${n.slug}`, niche: { type: "niche", key: n.slug },
    body: `Common problems: ${n.problems.join("; ")}. Relevant services: ${n.services.join(", ")}.`, keywords: words(`${n.name} ${n.problems.join(" ")}`) });
  for (const t of TOOLS_DIRECTORY.filter((x) => !x.to.includes("#"))) out.push({ ref: `tool:${t.to}`, layer: "service", title: `${t.name} (free tool)`, path: t.to, niche: { type: "tool", key: t.to },
    body: `${t.does} You get: ${t.get} Time: ${t.time}.`, keywords: words(`${t.name} ${t.does}`) });
  const ecomTools: [string, string, string][] = [
    ["/ecommerce", "Ecommerce Intelligence hub", "Free tools to start an online store or grow an existing one."],
    ["/ecommerce/start", "Ecommerce launch roadmap", "Questionnaire that builds a 14-step launch plan."],
    ["/ecommerce/diagnose", "Sales diagnosis", "Funnel numbers or an orders CSV → biggest drop-off and what to test."],
    ["/ecommerce/competitors", "Competitor comparison", "Side-by-side public prices, reviews, shipping and payment options."],
  ];
  const sitePages: [string, string, string][] = [
    ["/tools", "All free tools", "Directory of every free EmmaForYou tool: audits, planners, calculators and generators."],
    ["/intake", "Project intake form", "Tell the EmmaForYou team about a project so they can scope it and reply."],
  ];
  for (const [path, title, body] of sitePages) if (!TOOLS_DIRECTORY.some((t) => t.to === path)) out.push({ ref: `tool:${path}`, layer: "service", title, path, niche: { type: "tool", key: path }, body, keywords: words(`${title} ${body}`) });
  for (const [path, title, body] of ecomTools) out.push({ ref: `tool:${path}`, layer: "service", title, path, niche: { type: "tool", key: path }, body, keywords: words(`${title} ${body} ecommerce store shop`) });
  out.push({ ref: "company:pricing", layer: "company", title: "Published plans (the only prices agents may quote)", path: "/pricing",
    body: TIERS.map((t) => ("custom" in t && t.custom) ? `${t.name}: custom quote (${t.audience}).` : `${t.name}: $${t.monthly}/month or $${t.annual}/month billed annually (${t.audience}). Includes: ${t.features.slice(0, 6).join(", ")}.`).join(" ") + " Project prices outside these plans come from the instant proposal (/proposal) or a call (/book); never estimate them.",
    keywords: ["price", "pricing", "cost", "plan", "monthly", "quote", "budget"], niche: null });
  out.push({ ref: "company:next-steps", layer: "company", title: "How people start working with EmmaForYou", path: "/book",
    body: "Free 30-minute strategy call: /book. Instant plan and price: /proposal. Project intake form: /intake. Contact (WhatsApp, phone, email): /contact. Free tools: /tools. Client portal for existing clients: /portal.",
    keywords: ["call", "consultation", "hire", "contact", "quote", "start", "work with"], niche: null });
  out.push({ ref: "policy:agents", layer: "policy", title: "Rules for automated agents", path: "/community/guidelines",
    body: "Agents are automated and say so when asked. They never claim personal experience, credentials or client results, never promise outcomes or timelines, never quote prices that aren't published, and hand complaints, payments, legal, financial or unusual commitments to a person.",
    keywords: ["rules", "policy"], niche: null });
  // Some pages are listed in more than one catalogue (e.g. ecommerce tools also appear in the tools directory): keep one entry per ref.
  const seen = new Set<string>();
  return out.filter((e) => (seen.has(e.ref) ? false : (seen.add(e.ref), true)));
}

/** Pick the few knowledge entries relevant to a text for one agent (cheap keyword retrieval; no embeddings needed at this size). */
export function retrieve<T extends { keywords: string[]; title: string; agent_id?: string | null }>(entries: T[], text: string, agentNiches: Set<string> | null, limit = 8): T[] {
  const t = ` ${text.toLowerCase().replace(/[^a-z0-9 ]+/g, " ")} `;
  return entries.map((e) => {
    let s = 0; for (const k of e.keywords) if (t.includes(` ${k} `) || t.includes(` ${k}s `)) s += 1;
    for (const w of e.title.toLowerCase().split(/\W+/)) if (w.length > 3 && t.includes(` ${w}`)) s += 1.5;
    if (agentNiches && agentNiches.has((e as unknown as { niche_key?: string }).niche_key ?? "")) s += 1;
    return { e, s };
  }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, limit).map((x) => x.e);
}
