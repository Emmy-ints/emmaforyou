import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Loader2, Smartphone, Sparkles, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { KineticText } from "@/components/future/Kinetic";
import ShowcaseCard, { type ShowcaseListItem } from "@/components/showcase/ShowcaseCard";
import { ShowcaseCounters } from "@/components/showcase/ShowcaseStrip";
import { removeFromShowcase } from "@/components/showcase/ShowcaseOptIn";
import { fetchShowcase } from "@/lib/showcase-data";
import { KIND_LABEL, myItems, type MyItem } from "@/lib/showcase";
import { NICHES } from "@/lib/niches";
import { pageHead, breadcrumbLd } from "@/lib/seo";
import { track } from "@/lib/analytics";

const FILTERS: { id: string | null; label: string }[] = [
  { id: null, label: "Everything" },
  { id: "app", label: "Apps" },
  { id: "website", label: "Websites" },
  { id: "makeover", label: "Makeovers" },
  { id: "audit", label: "Audits" },
  { id: "emails", label: "Email sequences" },
  { id: "plan", label: "90-day plans" },
];

export const Route = createFileRoute("/showcase/")({
  component: ShowcasePage,
  head: () => pageHead({
    title: "Made on EmmaForYou: apps, websites and plans built with our free tools",
    description: "Real prototypes, website makeovers, audits, email sequences and 90-day plans that visitors made with EmmaForYou's free AI tools. Tap any to try it, then build your own.",
    path: "/showcase",
    jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Showcase", path: "/showcase" }])],
  }),
});

function ShowcasePage() {
  const [kind, setKind] = useState<string | null>(null);
  const [industry, setIndustry] = useState<string>("");
  const [items, setItems] = useState<ShowcaseListItem[] | null>(null);
  const [more, setMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mine, setMine] = useState<MyItem[]>([]);
  const PAGE = 24;

  useEffect(() => { setMine(myItems()); }, []);
  useEffect(() => {
    let alive = true;
    setItems(null);
    fetchShowcase({ kind, industry: industry || null, limit: PAGE }).then((v) => { if (!alive) return; setItems(v); setMore(v.length === PAGE); });
    return () => { alive = false; };
  }, [kind, industry]);

  async function loadMore() {
    if (!items?.length) return;
    setLoadingMore(true);
    const next = await fetchShowcase({ kind, industry: industry || null, limit: PAGE, before: items[items.length - 1].created_at });
    setItems([...items, ...next]); setMore(next.length === PAGE); setLoadingMore(false);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content" className="pb-24 pt-28 md:pt-32">
        <section className="mx-auto max-w-6xl px-5 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Made on EmmaForYou</span>
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-extrabold leading-[1.05] md:text-6xl"><KineticText text="See what people are building here" base={20} /></h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">Apps, websites, makeovers, audits, email sequences and 90-day plans that visitors made with our free tools and chose to share. Tap any to try it, then build your own in about a minute.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a href={KIND_LABEL.app.toolPath} onClick={() => track("cta_click", { cta: "showcase_build_app" })} className="btn-primary-gradient inline-flex min-h-12 items-center gap-2 rounded-full px-6 font-semibold text-white"><Smartphone className="h-5 w-5" aria-hidden="true" /> Build a free app</a>
            <a href={KIND_LABEL.website.toolPath} onClick={() => track("cta_click", { cta: "showcase_build_site" })} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-border px-6 font-semibold">Build a free website</a>
            <Link to="/website-audit" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-border px-6 font-semibold">Audit my website</Link>
          </div>
          <ShowcaseCounters className="mt-10" />
        </section>

        {mine.length > 0 && (
          <section className="mx-auto mt-14 max-w-6xl px-5" aria-labelledby="sc-mine">
            <h2 id="sc-mine" className="font-display text-lg font-bold">Your items</h2>
            <p className="text-xs text-muted-foreground">Only you see this list (it's saved in this browser). Remove anything you no longer want to show.</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {mine.map((m) => (
                <li key={m.slug} className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-4 pr-1 text-sm">
                  <Link to="/showcase/$slug" params={{ slug: m.slug }} className="max-w-[16rem] truncate font-medium">{m.title}</Link>
                  <button type="button" aria-label={`Remove ${m.title}`} onClick={async () => { if (await removeFromShowcase(m.slug)) { setMine(myItems()); setItems((v) => v?.filter((x) => x.slug !== m.slug) ?? v); } }} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mx-auto mt-14 max-w-6xl px-5" aria-label="Showcase">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by type">
              {FILTERS.map((f) => (
                <button key={f.label} type="button" aria-pressed={kind === f.id} onClick={() => setKind(f.id)} className="efy-page-chip px-4 py-2 text-sm">{f.label}</button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground" htmlFor="sc-industry">Industry
              <select id="sc-industry" value={industry} onChange={(e) => setIndustry(e.target.value)} className="rounded-full border border-border bg-background px-3 py-2 text-sm text-foreground">
                <option value="">All industries</option>
                {NICHES.map((n) => <option key={n.slug} value={n.slug}>{n.name}</option>)}
              </select>
            </label>
          </div>

          {items === null ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <div key={i} className="sc-card sc-skeleton" />)}</div>
          ) : items.length === 0 ? (
            <div className="mt-10 rounded-[28px] border border-dashed border-border p-10 text-center">
              <p className="font-display text-2xl font-bold">Nothing here yet</p>
              <p className="mx-auto mt-2 max-w-md text-muted-foreground">Be the first: build something with one of the free tools and tick "Add to the public showcase".</p>
              <a href={KIND_LABEL.app.toolPath} className="btn-primary-gradient mt-6 inline-flex min-h-11 items-center gap-2 rounded-full px-6 font-semibold text-white">Start building <ArrowRight className="h-4 w-4" /></a>
            </div>
          ) : (
            <>
              <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((it) => <li key={it.slug} className="min-w-0"><ShowcaseCard item={it} /></li>)}
              </ul>
              {more && (
                <div className="mt-8 text-center">
                  <button type="button" onClick={loadMore} disabled={loadingMore} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-6 font-semibold">{loadingMore && <Loader2 className="h-4 w-4 animate-spin" />} Show more</button>
                </div>
              )}
            </>
          )}
          <p className="mt-10 text-center text-xs text-muted-foreground">Everything here was made by visitors with our free AI tools and is shown with their permission, without names or contact details unless they chose to show their business name. It is sample content, not EmmaForYou client work; our client projects are in the <Link to="/portfolio" className="underline">portfolio</Link>.</p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
