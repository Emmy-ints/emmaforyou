import { createFileRoute } from "@tanstack/react-router";
import { FOUNDER, ORG_DESCRIPTION, SITE_URL, WHATSAPP_URL } from "@/lib/seo";
import { EXPERTISE, SERVICES, SERVICE_TO_EXPERTISE, findExpertise } from "@/lib/services-data";
import { PROJECTS, projectSlug } from "@/lib/portfolio-data";
import { canonicalForExpertise } from "@/lib/seo-routes";

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
    `Founder: ${FOUNDER.name}. Contact: WhatsApp ${WHATSAPP_URL}. Website: ${SITE_URL}.`,
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
    `- [Business growth assessment](${u("/analyser")}): 8 questions, an explained score across five areas, and prioritised recommendations.`,
    `- [ROI calculator](${u("/roi-calculator")}): estimates extra revenue from faster replies and better marketing, with editable assumptions.`,
    `- [Email sequence generator](${u("/email-generator")}): drafts a 5-email sequence.`,
    `- [Growth quiz](${u("/growth-quiz")}): 10 yes/no questions on digital maturity.`,
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
