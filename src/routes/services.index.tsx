import { createFileRoute, Link } from "@tanstack/react-router";
import ToolShell from "../components/tools/ToolShell";
import { EXPERTISE, SERVICES, SERVICE_TO_EXPERTISE } from "@/lib/services-data";
import { canonicalForExpertise } from "@/lib/seo-routes";
import { pageHead, breadcrumbLd, itemListLd } from "@/lib/seo";

const GROUPS: { title: string; intro: string; slugs: string[] }[] = [
  { title: "Get more customers", intro: "Be found, look credible and turn interest into enquiries.", slugs: ["website-landing-pages", "seo", "paid-ads", "social-media-automation", "lead-generation", "marketing-promotion"] },
  { title: "Reply, follow up and sell", intro: "Answer instantly, follow up automatically and close more.", slugs: ["ai-automation", "email-marketing", "crm-systems", "sales-conversion", "funnel-building", "copywriting"] },
  { title: "Design and conversion", intro: "Interfaces people understand and pages that convert.", slugs: ["ui-ux-design", "conversion-rate-optimisation", "analytics"] },
  { title: "Build", intro: "Stores, apps and platforms built to last.", slugs: ["shopify-ecommerce", "app-development", "wordpress"] },
  { title: "Web3 and blockchain", intro: "dApps, smart contracts and crypto projects, built securely.", slugs: ["web3-development", "smart-contract-development", "blockchain-crypto"] },
  { title: "Strategy, consulting and coaching", intro: "Decide what matters, then follow through.", slugs: ["digital-strategy", "business-consulting", "accountability-coaching"] },
];

/** The public URL for an expertise item: its /services page when one exists. */
function hrefFor(slug: string) {
  return canonicalForExpertise(slug);
}

export const Route = createFileRoute("/services/")({
  component: Page,
  head: () =>
    pageHead({
      title: "Services — Websites, AI Automation, Marketing, Web3 & Consulting",
      description: "Everything EmmaForYou does: websites and apps, AI automation, marketing and ads, UI/UX and conversion, Web3 and smart contracts, consulting and coaching.",
      path: "/services",
      jsonLd: [
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }]),
        itemListLd("EmmaForYou services", EXPERTISE.map((e) => ({ name: e.name, path: hrefFor(e.slug) }))),
      ],
    }),
});

function Page() {
  const used = new Set(GROUPS.flatMap((g) => g.slugs));
  const others = EXPERTISE.filter((e) => !used.has(e.slug));
  const groups = others.length ? [...GROUPS, { title: "More services", intro: "", slugs: others.map((e) => e.slug) }] : GROUPS;
  return (
    <ToolShell
      eyebrow="What we do"
      title="Services"
      intro="One team for the whole growth system: get found, convert visitors, reply instantly, follow up and grow. Pick a service to see who it's for, what's included, timelines and answers to common questions."
      answers={[
        { q: "Can I hire you for just one service?", a: "Yes. Many clients start with one service, such as a website or AI automation, and add more once it's working." },
        { q: "How do I know which service I need?", a: "Take the free growth assessment or get an instant proposal. Both point you to the services that fit your goals and budget, and a free call confirms it." },
      ]}
    >
      <div className="mb-10 flex flex-wrap gap-2">
        {SERVICES.map((s) => (
          <Link key={s.slug} to="/services/$slug" params={{ slug: s.slug }} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-[var(--emma-violet)]">{s.icon} {s.name}</Link>
        ))}
      </div>
      <div className="space-y-12">
        {groups.map((g) => (
          <section key={g.title} aria-labelledby={`s-${g.title}`}>
            <h2 id={`s-${g.title}`} className="font-display text-2xl font-semibold tracking-tight">{g.title}</h2>
            {g.intro && <p className="mt-1 text-muted-foreground">{g.intro}</p>}
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.slugs.map((slug) => {
                const e = EXPERTISE.find((x) => x.slug === slug);
                if (!e) return null;
                const svc = Object.entries(SERVICE_TO_EXPERTISE).find(([, v]) => v === slug)?.[0];
                return (
                  <li key={slug}>
                    <Link to={hrefFor(slug)} className="flex h-full flex-col rounded-[20px] border border-border bg-card p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-[var(--emma-violet)]">
                      <span className="text-2xl" aria-hidden="true">{e.icon}</span>
                      <h3 className="mt-3 font-display text-lg font-semibold">{svc ? SERVICES.find((s) => s.slug === svc)?.name || e.name : e.name}</h3>
                      <p className="mt-1.5 text-sm text-muted-foreground">{e.short}</p>
                      <p className="mt-3 text-xs text-muted-foreground">Good for: {e.forYou.slice(0, 2).join("; ").toLowerCase()}</p>
                      <span className="mt-auto pt-4 text-sm font-semibold text-[var(--emma-violet)]">See how it works →</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </ToolShell>
  );
}
