import { createFileRoute, Link } from "@tanstack/react-router";
import ToolShell from "../components/tools/ToolShell";
import { CHECKLISTS, itemCount } from "@/lib/checklists";
import { pageHead, breadcrumbLd, itemListLd } from "@/lib/seo";

export const Route = createFileRoute("/checklists/")({
  component: Page,
  head: () =>
    pageHead({
      title: "Free Business Checklists — Website, Conversion, Web3 & Launch",
      description: "Free checklists to launch a website, improve conversions, prepare for AI automation, launch a Web3 project or promote a product. Tick them off and download as PDF.",
      path: "/checklists",
      jsonLd: [
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Checklists", path: "/checklists" }]),
        itemListLd("Free checklists", CHECKLISTS.map((c) => ({ name: c.title, path: `/checklists/${c.slug}` }))),
      ],
    }),
});

function Page() {
  return (
    <ToolShell eyebrow="Free downloads" title="Free checklists" intro="Practical, no-fluff checklists we use with clients. Each one explains why every check matters. Tick items off as you go and download a PDF to share with your team.">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CHECKLISTS.map((c) => (
          <li key={c.slug}>
            <Link to="/checklists/$slug" params={{ slug: c.slug }} className="flex h-full flex-col rounded-[20px] border border-border bg-card p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-[var(--emma-violet)]">
              <div className="flex items-center justify-between"><span className="text-3xl" aria-hidden="true">{c.icon}</span><span className="text-xs text-muted-foreground">{itemCount(c)} checks</span></div>
              <h2 className="mt-3 font-display text-lg font-semibold">{c.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{c.description}</p>
              <span className="mt-auto pt-4 text-sm font-semibold text-[var(--emma-violet)]">Get the checklist →</span>
            </Link>
          </li>
        ))}
      </ul>
    </ToolShell>
  );
}
