import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { SOLUTION_CATEGORIES, findCategory, solutionsIn } from "@/lib/solutions";
import { ENGINE_TITLES } from "@/lib/solutions/engine-titles";
import { breadcrumbLd, clip, itemListLd, pageHead } from "@/lib/seo";

export const Route = createFileRoute("/solutions/$category/")({
  component: Page,
  loader: ({ params }) => {
    const c = findCategory(params.category);
    if (!c) throw notFound();
    return { slug: c.slug };
  },
  head: ({ loaderData }) => {
    const c = loaderData ? findCategory(loaderData.slug) : undefined;
    if (!c) return { meta: [{ title: "Not found — EmmaForYou" }, { name: "robots", content: "noindex" }] };
    const items = solutionsIn(c.slug);
    const path = `/solutions/${c.slug}`;
    return pageHead({
      title: `${c.name}: ${items.length} Solutions with Live Demos`.length <= 60 ? `${c.name}: ${items.length} Solutions with Live Demos` : `${c.name} — Live Demos`,
      description: clip(`${c.intro} Explore ${items.length} solutions, each with a working demo you can customise.`, 158),
      path,
      jsonLd: [
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Solutions", path: "/solutions" }, { name: c.name, path }]),
        itemListLd(c.name, items.map((s) => ({ name: s.name, path: `${path}/${s.slug}` }))),
      ],
    });
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background"><Navbar /><main className="mx-auto max-w-3xl px-5 pb-24 pt-36"><h1 className="font-display text-3xl font-semibold">Category not found</h1><Link to="/solutions" className="mt-6 inline-block font-semibold text-[var(--emma-violet)]">Browse all solutions →</Link></main><Footer /></div>
  ),
});

function Page() {
  const { slug } = Route.useLoaderData();
  const c = findCategory(slug)!;
  const items = solutionsIn(c.slug);
  const [q, setQ] = useState("");
  const shown = useMemo(() => items.filter((s) => `${s.name} ${s.tagline} ${s.who}`.toLowerCase().includes(q.toLowerCase())), [items, q]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <section className="hero-ink relative overflow-hidden">
          <div className="hero-ink-grid" aria-hidden="true" />
          <div className="hero-ink-glow" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-5 pb-14 pt-32 md:pt-40">
            <nav aria-label="Breadcrumb" className="text-sm text-[#a6abd0]"><Link to="/solutions" className="hover:text-white">Solutions</Link> <span aria-hidden="true">/</span> {c.name}</nav>
            <p className="hero-kicker mt-6"><span className="hero-kicker-dot" aria-hidden="true" />{items.length} solutions · every one with a live demo</p>
            <h1 className="hero-ink-title max-w-4xl"><span aria-hidden="true" className="mr-2">{c.icon}</span>{c.name}</h1>
            <p className="hero-ink-sub max-w-3xl">{c.intro}</p>
            <p className="mt-4 max-w-3xl text-sm text-[#a6abd0]"><strong className="text-white">Who it's for:</strong> {c.buyers}</p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative block w-full max-w-md"><span className="sr-only">Search {c.name.toLowerCase()}</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${c.name.toLowerCase()}…`} className="w-full rounded-full border border-border bg-card py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[var(--emma-violet)]" /></label>
            {c.groups.length > 1 && <nav aria-label="Jump to group" className="flex flex-wrap gap-1.5">{c.groups.map((g) => <a key={g.id} href={`#g-${g.id}`} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-[var(--emma-violet)] hover:text-foreground">{g.name}</a>)}</nav>}
          </div>

          {c.groups.map((g) => {
            const list = shown.filter((s) => s.group === g.id);
            if (!list.length) return null;
            return (
              <section key={g.id} id={`g-${g.id}`} className="mt-12 scroll-mt-24" aria-labelledby={`h-${g.id}`}>
                <h2 id={`h-${g.id}`} className="font-display text-2xl font-semibold tracking-tight">{c.groups.length > 1 ? g.name : "All solutions"}</h2>
                <p className="mt-1 text-muted-foreground">{g.intro}</p>
                <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((s) => (
                    <li key={s.slug}>
                      <Link to="/solutions/$category/$slug" params={{ category: c.slug, slug: s.slug }} className="group flex h-full flex-col rounded-[20px] border border-border bg-card p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-[var(--emma-violet)]">
                        <div className="flex items-start justify-between gap-2"><span className="text-3xl" aria-hidden="true">{s.icon}</span><span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">Demo: {ENGINE_TITLES[s.demo.engine]}</span></div>
                        <h3 className="mt-3 font-display text-lg font-semibold">{s.name}</h3>
                        <p className="mt-1.5 text-sm text-muted-foreground">{s.tagline}</p>
                        <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-[var(--emma-violet)]">Explore & try it <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
          {shown.length === 0 && <p className="mt-10 rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">Nothing matches "{q}". Try another word, or <Link to="/contact" className="font-semibold text-[var(--emma-violet)]">ask us</Link>.</p>}

          <section className="mt-16 rounded-[24px] bg-muted p-6 md:p-8" aria-labelledby="other-cats">
            <h2 id="other-cats" className="font-display text-xl font-semibold">Other solution areas</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{SOLUTION_CATEGORIES.filter((x) => x.slug !== c.slug).map((x) => <li key={x.slug}><Link to="/solutions/$category" params={{ category: x.slug }} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:border-[var(--emma-violet)]"><span className="text-xl" aria-hidden="true">{x.icon}</span><span className="text-sm font-semibold">{x.name}</span></Link></li>)}</ul>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
