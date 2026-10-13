import { createFileRoute, Link } from "@tanstack/react-router";
import ToolShell from "../components/tools/ToolShell";
import { COMPARISONS } from "@/lib/comparisons";
import { pageHead, breadcrumbLd, itemListLd } from "@/lib/seo";

export const Route = createFileRoute("/compare/")({
  component: Page,
  head: () =>
    pageHead({
      title: "Honest Comparisons — Platforms, Tools and Ways to Grow",
      description: "Side-by-side comparisons to help you decide: agency vs freelancer vs DIY, Shopify vs WooCommerce, SEO vs ads, WhatsApp app vs API, Foundry vs Hardhat and more.",
      path: "/compare",
      jsonLd: [
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Comparisons", path: "/compare" }]),
        itemListLd("Comparisons", COMPARISONS.map((c) => ({ name: c.title, path: `/compare/${c.slug}` }))),
      ],
    }),
});

function Page() {
  return (
    <ToolShell eyebrow="Decide with confidence" title="Honest comparisons" intro="Short answers first, then the details: what each option costs, where it shines, where it doesn't, and which fits your situation.">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COMPARISONS.map((c) => (
          <li key={c.slug}>
            <Link to="/compare/$slug" params={{ slug: c.slug }} className="flex h-full flex-col rounded-[20px] border border-border bg-card p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-[var(--emma-violet)]">
              <div className="flex items-center justify-between"><span className="text-3xl" aria-hidden="true">{c.icon}</span><span className="text-xs text-muted-foreground">{c.category}</span></div>
              <h2 className="mt-3 font-display text-lg font-semibold">{c.title}</h2>
              <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">{c.answer}</p>
              <span className="mt-auto pt-4 text-sm font-semibold text-[var(--emma-violet)]">Compare →</span>
            </Link>
          </li>
        ))}
      </ul>
    </ToolShell>
  );
}
