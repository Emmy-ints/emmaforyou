import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, PlayCircle } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ALL_SOLUTIONS, findSolution, solutionsIn } from "@/lib/solutions";
import { SOLUTION_CATEGORIES } from "@/lib/solutions/categories";
import { getSolutionCount } from "@/lib/solutions-server";
import { ENGINE_TITLES } from "@/lib/solutions/engine-titles";
import { breadcrumbLd, itemListLd, pageHead } from "@/lib/seo";

const FEATURED: [string, string][] = [["business-apps", "crm"], ["websites", "booking-reservation-website"], ["ai-solutions", "ai-customer-support-agent"], ["business-apps", "ecommerce-store-app"], ["ai-solutions", "ai-document-processor"], ["automation", "appointment-reminders"]];
const FAQS = [
  { q: "Are these real, working prototypes?", a: "Yes. Every solution page has an interactive prototype you can click through and customise with your business name and colour. They use sample data and run in your browser, so nothing is saved or sent." },
  { q: "Are the examples real clients?", a: "No. The demos use clearly labelled sample businesses. Where we've done related work for real clients, we link to those projects in our portfolio separately." },
  { q: "Can you build something that isn't listed?", a: "Yes. These are the most common solutions; most projects combine several. Use the app feature planner or book a call to scope yours." },
  { q: "How do I get a price?", a: "Our monthly plans are published on the pricing page. Custom builds are quoted after a free strategy call so you only pay for what you need." },
];

export const Route = createFileRoute("/solutions/")({
  component: Page,
  loader: () => getSolutionCount(),
  head: ({ loaderData }) =>
    pageHead({
      title: "Solutions & Live Demos — Websites, Apps, AI, Automation",
      description: `Explore ${loaderData ?? ""} websites, business apps, AI solutions and automations, each with a working prototype you can customise and test in your browser.`,
      path: "/solutions",
      jsonLd: [
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Solutions", path: "/solutions" }]),
        itemListLd("Solution categories", SOLUTION_CATEGORIES.map((c) => ({ name: c.name, path: `/solutions/${c.slug}` }))),
        { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
      ],
    }),
});

function Page() {
  const featured = FEATURED.map(([c, s]) => findSolution(c, s)).filter(Boolean) as NonNullable<ReturnType<typeof findSolution>>[];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <section className="hero-ink relative overflow-hidden">
          <div className="hero-ink-grid" aria-hidden="true" />
          <div className="hero-ink-glow" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-32 md:pt-40">
            <p className="hero-kicker"><span className="hero-kicker-dot" aria-hidden="true" />{ALL_SOLUTIONS.length} solutions · {SOLUTION_CATEGORIES.length} areas · every one with a live demo</p>
            <h1 className="hero-ink-title max-w-4xl">Try the software before you hire us to build it</h1>
            <p className="hero-ink-sub max-w-3xl">Websites, business apps, AI agents and automations, each with a working prototype you can click through, customise with your brand and reset. See exactly what you'd get, then let's build yours.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#areas" className="btn-primary-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white">Browse solutions <ArrowRight className="h-4 w-4" /></a>
              <Link to="/solutions/app-planner" className="hero-ghost-btn">Plan your app's features</Link>
            </div>
            <ul className="hero-ink-proof">{["Working prototypes, not screenshots", "Customise and reset", "Clear demo vs. full-build notes"].map((x) => <li key={x}><Check aria-hidden="true" />{x}</li>)}</ul>
          </div>
        </section>

        <section id="areas" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-14" aria-labelledby="areas-h">
          <h2 id="areas-h" className="font-display text-3xl font-semibold tracking-tight">Solution areas</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SOLUTION_CATEGORIES.map((c) => { const items = solutionsIn(c.slug); return (
              <li key={c.slug}>
                <Link to="/solutions/$category" params={{ category: c.slug }} className="group flex h-full flex-col rounded-[22px] border border-border bg-card p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:border-[var(--emma-violet)]">
                  <div className="flex items-center justify-between"><span className="text-4xl" aria-hidden="true">{c.icon}</span><span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{items.length} solutions</span></div>
                  <h3 className="mt-4 font-display text-xl font-semibold">{c.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{c.short}</p>
                  <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{items.slice(0, 4).map((s) => s.name).join(" · ")}…</p>
                  <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-[var(--emma-violet)]">Explore {c.name.toLowerCase()} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
                </Link>
              </li>); })}
          </ul>
        </section>

        <section className="bg-muted/50" aria-labelledby="feat-h">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <h2 id="feat-h" className="font-display text-3xl font-semibold tracking-tight">Popular demos to try first</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{featured.map((s) => (
              <li key={s.slug}><Link to="/solutions/$category/$slug" params={{ category: s.category, slug: s.slug }} hash="demo" className="flex h-full flex-col rounded-[20px] border border-border bg-card p-5 transition hover:border-[var(--emma-violet)]">
                <span className="flex items-center gap-2 text-xs font-semibold text-[var(--emma-violet)]"><PlayCircle className="h-4 w-4" />{ENGINE_TITLES[s.demo.engine]} demo</span>
                <h3 className="mt-2 font-display text-lg font-semibold"><span aria-hidden="true">{s.icon}</span> {s.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.tagline}</p>
              </Link></li>))}</ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14" aria-labelledby="all-h">
          <h2 id="all-h" className="font-display text-3xl font-semibold tracking-tight">Everything we build</h2>
          <div className="mt-6 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {SOLUTION_CATEGORIES.map((c) => (
              <div key={c.slug}>
                <h3 className="font-display text-lg font-semibold"><Link to="/solutions/$category" params={{ category: c.slug }} className="hover:text-[var(--emma-violet)]">{c.icon} {c.name}</Link></h3>
                <ul className="mt-2 space-y-1 text-sm">{solutionsIn(c.slug).map((s) => <li key={s.slug}><Link to="/solutions/$category/$slug" params={{ category: c.slug, slug: s.slug }} className="text-muted-foreground hover:text-foreground">{s.name}</Link></li>)}</ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 pb-14" aria-labelledby="faq-h">
          <h2 id="faq-h" className="font-display text-2xl font-semibold tracking-tight">Questions</h2>
          <div className="mt-4 divide-y divide-border rounded-[20px] border border-border bg-card">{FAQS.map((f) => <details key={f.q} className="p-5"><summary className="cursor-pointer font-semibold">{f.q}</summary><p className="mt-2 text-muted-foreground">{f.a}</p></details>)}</div>
        </section>

        <section className="band-ink" aria-labelledby="cta-h">
          <div className="mx-auto max-w-4xl px-5 py-16 text-center">
            <h2 id="cta-h" className="font-display text-3xl font-semibold tracking-tight text-foreground">Not sure what you need?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Pick features in the app planner, or tell us about your business on a free call and we'll recommend the right mix.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3"><Link to="/solutions/app-planner" className="btn-primary-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white">Open the app planner</Link><Link to="/book" className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 font-semibold text-foreground">Book a free call</Link></div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
