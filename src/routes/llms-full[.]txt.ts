import { createFileRoute } from "@tanstack/react-router";
import { FOUNDER, ORG_DESCRIPTION, SITE_URL, WHATSAPP_URL } from "@/lib/seo";
import { EXPERTISE, SERVICES, SERVICE_TO_EXPERTISE } from "@/lib/services-data";
import { SERVICE_EXTRAS, SERVICE_QA } from "@/lib/service-extras";
import { CATEGORIES } from "@/lib/faq-data";
import { TIERS } from "@/lib/pricing-data";
import { PROJECTS, projectSlug } from "@/lib/portfolio-data";
import { canonicalForExpertise } from "@/lib/seo-routes";

/**
 * llms-full.txt: the site's key facts in one plain-text file (services, deliverables, answers,
 * plans, tools, client work), generated from the same data the pages render. Optional and
 * experimental; it helps AI assistants describe the business accurately but guarantees nothing.
 */
function body(): string {
  const u = (p: string) => `${SITE_URL}${p}`;
  const out: string[] = [];
  out.push("# EmmaForYou — full overview", "", ORG_DESCRIPTION, "");
  out.push(`Founder: ${FOUNDER.name}, ${FOUNDER.jobTitle}. ${FOUNDER.roles.join(", ")}.`);
  out.push(`Contact: WhatsApp ${WHATSAPP_URL} · Book a free 30-minute call: ${u("/book")} · Website: ${SITE_URL}`, "");

  out.push("## Plans and pricing", "");
  for (const t of TIERS) {
    const price = "custom" in t && t.custom ? "Custom quote" : `$${t.monthly}/month, or $${t.annual}/month billed annually`;
    out.push(`### ${t.name} — ${price}`, `For: ${t.audience}.`, `Includes: ${t.features.join("; ")}.`, "");
  }
  out.push("One-off projects, consulting, coaching, UI/UX, conversion optimisation, promotion campaigns and Web3/smart contract work are quoted after a free call. Ad spend is paid directly to ad platforms.", "");

  out.push("## Services", "");
  const seen = new Set<string>();
  const all = [
    ...SERVICES.map((s) => ({ url: `/services/${s.slug}`, e: EXPERTISE.find((x) => x.slug === SERVICE_TO_EXPERTISE[s.slug]), name: s.name })),
    ...EXPERTISE.filter((e) => canonicalForExpertise(e.slug) === `/expertise/${e.slug}`).map((e) => ({ url: `/expertise/${e.slug}`, e, name: e.name })),
  ];
  for (const { url, e, name } of all) {
    if (!e || seen.has(e.slug)) continue;
    seen.add(e.slug);
    const x = SERVICE_EXTRAS[e.slug];
    out.push(`### ${name}`, `URL: ${u(url)}`, `${e.hero.headline} ${e.hero.sub}`);
    if (x) out.push(`Who it's for: ${x.audience}`, `Deliverables: ${x.deliverables.join("; ")}.`, `Timeline: ${x.timeline}. Engagement: ${x.engagement}.`);
    out.push(`Good fit if: ${e.forYou.join("; ")}.`, `Tools: ${e.tools.join(", ")}.`);
    for (const q of [...(SERVICE_QA[e.slug] || []), ...e.faqs]) out.push(`Q: ${q.q}`, `A: ${q.a}`);
    out.push("");
  }

  out.push("## Free tools", "");
  out.push(
    `- Website audit: ${u("/website-audit")} — about 25 checks with a score, top fixes and PDF.`,
    `- AI receptionist demo: ${u("/ai-receptionist")} — chat or talk to an AI that answers and books.`,
    `- Instant proposal: ${u("/proposal")} — scope, timeline and plan in about 20 seconds.`,
    `- AI website makeover: ${u("/makeover")} — redesign concept from a screenshot.`,
    `- Smart contract check: ${u("/smart-contract-check")} — Solidity security and gas review (not an audit).`,
    `- 90-day goal planner: ${u("/goal-planner")} — milestones and weekly actions.`,
    `- ROI calculator: ${u("/roi-calculator")} · Growth assessment: ${u("/analyser")}`,
    "",
  );

  out.push("## Frequently asked questions", "");
  for (const c of CATEGORIES) for (const i of c.items) out.push(`Q: ${i.q}`, `A: ${i.a}`);
  out.push("");

  out.push("## Client work", "");
  for (const p of PROJECTS) out.push(`- ${p.name} (${p.category}): ${p.desc} Outcome: ${p.outcome}. ${u(`/portfolio/${projectSlug(p.name)}`)}`);
  out.push("");
  return out.join("\n");
}

export const Route = createFileRoute("/llms-full.txt")({
  server: {
    handlers: {
      GET: () => new Response(body(), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } }),
    },
  },
});
