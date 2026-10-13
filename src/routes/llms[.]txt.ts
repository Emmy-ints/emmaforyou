import { createFileRoute } from "@tanstack/react-router";
import { FOUNDER, ORG_DESCRIPTION, SITE_URL, WHATSAPP_URL } from "@/lib/seo";
import { EXPERTISE, SERVICES, SERVICE_TO_EXPERTISE, findExpertise } from "@/lib/services-data";
import { PROJECTS, projectSlug } from "@/lib/portfolio-data";
import { canonicalForExpertise } from "@/lib/seo-routes";
import { POSTS } from "@/lib/blog-data";
import { COMPARISONS } from "@/lib/comparisons";
import { CHECKLISTS } from "@/lib/checklists";

/**
 * llms.txt (https://llmstxt.org) — an optional, experimental summary for AI assistants.
 * It is not required for appearing in AI answers and guarantees nothing; it simply gives
 * models an accurate, link-rich overview of the business.
 */
function body(): string {
  const u = (p: string) => `${SITE_URL}${p}`;
  const services = SERVICES.map((s) => {
    const e = findExpertise(SERVICE_TO_EXPERTISE[s.slug]);
    return `- [${s.name}](${u(`/services/${s.slug}`)}): ${e?.short ?? s.short}`;
  });
  const more = EXPERTISE.filter((e) => canonicalForExpertise(e.slug) === `/expertise/${e.slug}`).map((e) => `- [${e.name}](${u(`/expertise/${e.slug}`)}): ${e.short}`);
  const work = PROJECTS.map((p) => `- [${p.name}](${u(`/portfolio/${projectSlug(p.name)}`)}): ${p.desc} Outcome: ${p.outcome}.`);
  return [
    "# EmmaForYou",
    "",
    `> ${ORG_DESCRIPTION}`,
    "",
    `Founder: ${FOUNDER.name} (${FOUNDER.roles.join(", ")}). Contact: WhatsApp ${WHATSAPP_URL}; book a free call at ${u("/book")}. Website: ${SITE_URL}.`,
    "",
    "## Who EmmaForYou is for",
    "- Small and growing businesses in Nigeria, the USA, the UK, Europe and Africa that want more enquiries, faster replies and sales online (salons, clinics, restaurants, real estate, fashion, ecommerce, coaches, schools, hotels).",
    "- Founders who want one partner for website or app, AI automation, marketing and conversion optimisation instead of several freelancers.",
    "- Crypto and Web3 teams that need smart contracts (Solidity), dApps and a launch, from someone who also does marketing.",
    "- Founders and professionals who want business consulting or weekly accountability coaching.",
    "",
    "## Pricing at a glance",
    `- Monthly plans from $99 (Starter), $299 (Growth), $799 (Pro); Enterprise is custom. One-off projects, consulting, coaching and Web3 work are quoted after a free call. Details: ${u("/pricing")}`,
    "",
    `Full plain-text version of this site's key content: ${u("/llms-full.txt")}`,
    "",
    "## Services",
    ...services,
    ...more,
    "",
    "## Client work",
    ...work,
    "",
    "## Free tools",
    `- [AI prototype builder](${u("/#prototype")}): describe a website or app and get a working prototype.`,
    `- [Free AI website audit](${u("/website-audit")}): about 25 checks of a homepage (speed via Google Lighthouse, SEO, mobile, contact and trust) with a prioritised fix list and PDF report.`,
    `- [AI receptionist demo](${u("/ai-receptionist")}): chat or talk to an AI receptionist for sample businesses that answers questions and books appointments.`,
    `- [AI website makeover](${u("/makeover")}): upload a screenshot and get an AI redesign concept of the same page.`,
    `- [Instant proposal](${u("/proposal")}): a tailored proposal with scope, timeline and a plan priced from the published pricing.`,
    `- [Free smart contract check](${u("/smart-contract-check")}): pattern scan plus AI review of Solidity code, findings ranked by severity with fixes (not an audit).`,
    `- [90-day goal planner](${u("/goal-planner")}): turns a goal into milestones and weekly actions; linked to accountability coaching.`,
    `- [Book a strategy call](${u("/book")}): free 30-minute call with the founder; times shown in the visitor's timezone.`,
    `- [Business growth assessment](${u("/analyser")}): 8 questions, an explained score across five areas, and prioritised recommendations.`,
    `- [ROI calculator](${u("/roi-calculator")}): estimates extra revenue from faster replies and better marketing, with editable assumptions.`,
    `- [Email sequence generator](${u("/email-generator")}): drafts a 5-email sequence.`,
    `- [Growth quiz](${u("/growth-quiz")}): 10 yes/no questions on digital maturity.`,
    "",
    "## Start here",
    `- [Why EmmaForYou](${u("/why-emmaforyou")}): how EmmaForYou works, who it's a good fit for (and who it isn't), and the process.`,
    `- [All services](${u("/services")}) · [Industries](${u("/industries")}) · [All free tools](${u("/tools")}) · [Contact](${u("/contact")})`,
    "",
    "## Articles",
    ...POSTS.slice(0, 16).map((p) => `- [${p.title}](${u(`/blog/${p.slug}`)}): ${p.excerpt}`),
    "",
    "## Comparisons",
    ...COMPARISONS.map((c) => `- [${c.title}](${u(`/compare/${c.slug}`)}): ${c.answer}`),
    "",
    "## Checklists",
    ...CHECKLISTS.map((c) => `- [${c.title}](${u(`/checklists/${c.slug}`)}): ${c.description}`),
    "",
    "## Learn",
    `- [Knowledge base](${u("/knowledge-base")}): in-depth guides on websites, SEO, automation, social media, ads, email and ecommerce.`,
    `- [Blog](${u("/blog")}): practical growth tips.`,
    `- [Pricing](${u("/pricing")}): plans and what they include.`,
    `- [FAQ](${u("/faq")}): pricing, timelines and how engagements work.`,
    "",
    "## Optional",
    `- [About](${u("/about")}): the founder and company story.`,
    `- [Privacy policy](${u("/privacy")})`,
    "",
  ].join("\n");
}

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: () => new Response(body(), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } }),
    },
  },
});
