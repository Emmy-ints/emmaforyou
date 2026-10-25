import { createFileRoute, Link } from "@tanstack/react-router";
import { KineticText } from "@/components/future/Kinetic";
import { useEffect, useState } from "react";
import { ArrowRight, Rocket, TrendingUp, Search, Stethoscope, Calculator, Users, Megaphone, ListChecks, MessageSquare, FolderOpen, Plug, ShieldCheck } from "lucide-react";
import { pageHead, breadcrumbLd } from "@/lib/seo";
import { useWorkspace } from "@/components/ecom/ui";
import { listItems, type Item } from "@/lib/ecom/workspace";

export const Route = createFileRoute("/ecommerce/")({
  head: () => pageHead({
    title: "Ecommerce Intelligence — Start or Grow an Online Store | EmmaForYou",
    description: "Free tools to start an online store or grow an existing one: launch roadmap, product research, store audit, sales diagnosis, profit analyzer and competitor comparison.",
    path: "/ecommerce",
    jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Ecommerce Intelligence", path: "/ecommerce" }])],
  }),
  component: Hub,
});

const TOOLS = [
  { to: "/ecommerce/research", icon: Search, title: "Product research & validation", text: "Check competitors, prices, reviews and margin for a product idea. Every point shows its source." },
  { to: "/ecommerce/grow", icon: ShieldCheck, title: "Store audit", text: "Scan any store or listing for speed, SEO, trust signals and product-page quality." },
  { to: "/ecommerce/diagnose", icon: Stethoscope, title: "Sales diagnosis", text: "Find where shoppers drop off and what to test first, from your own numbers or an orders export." },
  { to: "/ecommerce/profit", icon: Calculator, title: "Profit analyzer", text: "Gross, contribution and net profit, break-even and CAC, with every formula shown." },
  { to: "/ecommerce/competitors", icon: Users, title: "Competitor intelligence", text: "Compare competitors' public prices, reviews, shipping and payment options side by side." },
  { to: "/ecommerce/marketing", icon: Megaphone, title: "Marketing & traffic", text: "Plan measurable experiments: baseline, hypothesis, action, metric and review date." },
  { to: "/ecommerce/plan", icon: ListChecks, title: "Action planner", text: "Every fix and roadmap task in one prioritised list you can tick off." },
  { to: "/ecommerce/guide", icon: MessageSquare, title: "Business guide", text: "Ask questions about your plan; answers use the reports you've saved." },
  { to: "/ecommerce/workspace", icon: FolderOpen, title: "Workspace", text: "Saved reports, products, plans and audits. Export or delete any time." },
  { to: "/ecommerce/integrations", icon: Plug, title: "Integrations", text: "Which store and analytics connections are available, and CSV import for everything else." },
];

function Hub() {
  const { signedIn, workspace } = useWorkspace();
  const [items, setItems] = useState<Item[] | null>(null);
  useEffect(() => { if (workspace) listItems(workspace.id).then(setItems).catch(() => setItems([])); }, [workspace]);
  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl border border-border bg-[#0b0d24] px-5 py-10 text-white sm:px-10 sm:py-14">
        <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(109,91,255,0.45),transparent)]" />
        <p className="relative text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#9b8cff]">EmmaForYou Ecommerce Intelligence</p>
        <h1 className="relative mt-3 max-w-3xl font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl"><KineticText text="Make better decisions about what to sell and why it sells." base={60} /></h1>
        <p className="relative mt-4 max-w-2xl text-[0.98rem] leading-relaxed text-[#b8bce0]">Practical tools for people starting out and stores that want more sales. We show what we observed, what you told us and what's still a hypothesis, and never promise results.</p>
        <div className="relative mt-8 grid gap-3 sm:grid-cols-2 lg:max-w-3xl">
          <Link to="/ecommerce/start" className="group rounded-2xl border border-white/12 bg-white/[0.06] p-5 transition hover:border-[#9b8cff]/60 hover:bg-white/[0.09]">
            <Rocket className="h-5 w-5 text-[#9b8cff]" aria-hidden="true" />
            <span className="mt-3 block font-display text-lg font-bold">Start an ecommerce business</span>
            <span className="mt-1 block text-sm text-[#b8bce0]">Answer a few questions and get a step-by-step launch roadmap for your budget and market.</span>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-white">Build my roadmap <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" /></span>
          </Link>
          <Link to="/ecommerce/grow" className="group rounded-2xl border border-white/12 bg-white/[0.06] p-5 transition hover:border-[#3dd6f5]/60 hover:bg-white/[0.09]">
            <TrendingUp className="h-5 w-5 text-[#3dd6f5]" aria-hidden="true" />
            <span className="mt-3 block font-display text-lg font-bold">Grow my existing store</span>
            <span className="mt-1 block text-sm text-[#b8bce0]">Enter your store address for an audit, then diagnose sales and profit with your own numbers.</span>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-white">Audit my store <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" /></span>
          </Link>
        </div>
      </section>

      {signedIn && workspace && (
        <section aria-labelledby="ws-h" className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div>
            <h2 id="ws-h" className="font-display text-base font-bold">{workspace.name}</h2>
            <p className="text-sm text-muted-foreground">{items === null ? "Loading…" : items.length ? `${items.length} saved item${items.length === 1 ? "" : "s"}: ${[...new Set(items.map((i) => i.kind))].join(", ")}` : "Nothing saved yet. Run a tool and choose Save to workspace."}</p>
          </div>
          <Link to="/ecommerce/workspace" className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted">Open workspace <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </section>
      )}

      <h2 className="mt-10 font-display text-xl font-bold"><KineticText text="All tools" base={30} /></h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map(({ to, icon: Icon, title, text }) => (
          <li key={to}><Link to={to} className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-[var(--emma-violet)]">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--emma-violet)]/10 text-[var(--emma-violet)]"><Icon className="h-4 w-4" aria-hidden="true" /></span>
            <span className="mt-3 font-display text-base font-bold">{title}</span>
            <span className="mt-1 flex-1 text-sm text-muted-foreground">{text}</span>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--emma-violet)]">Open <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden="true" /></span>
          </Link></li>
        ))}
      </ul>

      <section className="mt-10 grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-3">
        <div><h2 className="font-display text-base font-bold"><KineticText text="What these tools can see" base={30} /></h2><p className="mt-1 text-sm text-muted-foreground">Public store pages, competitors' public product data, our tracked industry news, and any numbers or exports you provide.</p></div>
        <div><h2 className="font-display text-base font-bold"><KineticText text="What they can't" base={30} /></h2><p className="mt-1 text-sm text-muted-foreground">Your private traffic, orders or ad spend unless you enter or upload them. No connected-store integrations are live yet; see Integrations.</p></div>
        <div><h2 className="font-display text-base font-bold"><KineticText text="Want it done for you?" base={30} /></h2><p className="mt-1 text-sm text-muted-foreground">Our team builds stores, product pages and automations. <Link to="/services/$slug" params={{ slug: "ecommerce" }} className="font-semibold text-foreground underline">Ecommerce services</Link> or <Link to="/book" className="font-semibold text-foreground underline">book a call</Link>.</p></div>
      </section>
      <p className="mt-6 text-sm text-muted-foreground">Questions? Ask in the <Link to="/community" className="font-semibold text-foreground underline">Community</Link>.</p>
    </div>
  );
}
