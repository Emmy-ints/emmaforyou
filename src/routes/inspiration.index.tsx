import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Bookmark, Loader2, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ExampleCard from "@/components/inspiration/ExampleCard";
import { useSaves } from "@/components/inspiration/useSaves";
import { supabase } from "@/integrations/supabase/client";
import { pageHead, breadcrumbLd } from "@/lib/seo";
import { CARD_COLUMNS, KIND_LABEL, KIND_ORDER, cleanQuery, validateSearch, type Example, type Facets, type Search as S, type SourceInfo } from "@/lib/inspiration/ui";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
const PAGE = 24;

export const Route = createFileRoute("/inspiration/")({
  validateSearch,
  component: Page,
  head: () => pageHead({
    title: "Inspiration Library — Websites, Shopify Stores, Emails & UI Examples",
    description: "Browse real website, landing page, Shopify store, email and UI design examples collected from leading design galleries. Filter by industry, style and platform, save favourites, and open the original.",
    path: "/inspiration",
    jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Inspiration library", path: "/inspiration" }])],
  }),
});

function Page() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const set = (patch: Partial<S>) => navigate({ to: "/inspiration", search: (prev: S) => { const next: Record<string, unknown> = { ...prev, ...patch }; for (const k of Object.keys(next)) if (next[k] === undefined || next[k] === "") delete next[k]; return next as S; }, replace: true });
  const saves = useSaves();
  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [rows, setRows] = useState<Example[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "more" | "error">("loading");
  const [error, setError] = useState("");
  const [q, setQ] = useState(search.q ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    db.from("inspiration_sources").select("id,name,home_url,category,status,imported_total,last_success_at,restriction,method,method_notes,status_reason,enabled,sort").order("sort").then(({ data }: { data: SourceInfo[] | null }) => setSources(data ?? []));
    db.rpc("inspiration_facets").then(({ data }: { data: Facets | null }) => setFacets(data));
  }, []);
  useEffect(() => { setQ(search.q ?? ""); }, [search.q]);
  // Debounced search box → URL.
  useEffect(() => { const t = window.setTimeout(() => { if ((q.trim() || undefined) !== search.q) set({ q: q.trim() || undefined }); }, 350); return () => window.clearTimeout(t); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const savedIds = useMemo(() => saves.saves.filter((s) => !search.collection || s.collection === search.collection).map((s) => s.example_id), [saves.saves, search.collection]);
  async function load(offset: number) {
    const id = ++reqId.current;
    setState(offset ? "more" : "loading"); setError("");
    try {
      if (search.saved && !saves.ready) return;
      if (search.saved && !savedIds.length) { setRows([]); setCount(0); setState("ready"); return; }
      let query = db.from("inspiration_examples").select(CARD_COLUMNS, { count: offset ? undefined : "exact" }).eq("status", "visible");
      const term = cleanQuery(search.q ?? "");
      if (term) query = query.or(`search.wfts(simple).${term},title.ilike.*${term}*,brand.ilike.*${term}*`);
      if (search.kind) query = query.eq("kind", search.kind);
      if (search.source) query = query.eq("source_id", search.source);
      if (search.industry) query = query.contains("industries", [search.industry]);
      if (search.style) query = query.contains("styles", [search.style]);
      if (search.color) query = query.contains("colors", [search.color]);
      if (search.theme) query = query.eq("theme", search.theme);
      if (search.platform) query = query.eq("platform", search.platform);
      if (search.saved) query = query.in("id", savedIds.slice(0, 500));
      query = search.sort === "az" ? query.order("title", { ascending: true }) : search.sort === "updated" ? query.order("updated_at", { ascending: false }) : query.order("discovered_at", { ascending: false });
      const { data, error: err, count: c } = await query.order("id").range(offset, offset + PAGE - 1);
      if (id !== reqId.current) return;
      if (err) throw new Error(err.message);
      setRows((r) => (offset ? [...r, ...(data ?? [])] : data ?? []));
      if (!offset) setCount(c ?? null);
      setState("ready");
    } catch (e) { if (id === reqId.current) { setError(e instanceof Error ? e.message : "Couldn't load examples."); setState("error"); } }
  }
  useEffect(() => { void load(0); }, [search.q, search.kind, search.source, search.industry, search.style, search.color, search.theme, search.platform, search.sort, search.saved, search.collection, saves.ready, savedIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const sourceName = (id: string) => sources.find((s) => s.id === id)?.name ?? id;
  const active = (["kind", "source", "industry", "style", "color", "theme", "platform"] as const).filter((k) => search[k]);
  const clearAll = () => navigate({ to: "/inspiration", search: search.saved ? { saved: "1" } : {}, replace: true });
  const live = sources.filter((s) => (facets?.sources[s.id] ?? 0) > 0);
  const entries = (o: Record<string, number> | undefined) => Object.entries(o ?? {}).sort((a, b) => b[1] - a[1]);

  const filterPanel = (
    <div className="space-y-5">
      <Group label="Type">
        <Chip on={!search.kind} onClick={() => set({ kind: undefined })}>All{facets ? ` (${facets.total})` : ""}</Chip>
        {KIND_ORDER.filter((k) => facets?.kinds[k]).map((k) => <Chip key={k} on={search.kind === k} onClick={() => set({ kind: search.kind === k ? undefined : k })}>{KIND_LABEL[k]} ({facets?.kinds[k]})</Chip>)}
      </Group>
      <Select label="Source" value={search.source} onChange={(v) => set({ source: v })} options={live.map((s) => [s.id, `${s.name} (${facets?.sources[s.id] ?? 0})`])} />
      <Select label="Industry" value={search.industry} onChange={(v) => set({ industry: v })} options={entries(facets?.industries).map(([k, n]) => [k, `${k} (${n})`])} />
      <Select label="Design style" value={search.style} onChange={(v) => set({ style: v })} options={entries(facets?.styles).map(([k, n]) => [k, `${k} (${n})`])} />
      <Select label="Platform (where the source names it)" value={search.platform} onChange={(v) => set({ platform: v })} options={entries(facets?.platforms).map(([k, n]) => [k, `${k} (${n})`])} />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Light or dark" value={search.theme} onChange={(v) => set({ theme: v as S["theme"] })} options={entries(facets?.themes).map(([k, n]) => [k, `${k === "dark" ? "Dark" : "Light"} (${n})`])} />
        <Select label="Colour" value={search.color} onChange={(v) => set({ color: v })} options={entries(facets?.colors).map(([k, n]) => [k, `${k} (${n})`])} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content" className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-5 md:pt-32">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--emma-violet)]">Inspiration library</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">Real designs to learn from</h1>
          <p className="mt-4 text-lg text-muted-foreground">Websites, landing pages, Shopify stores, emails and product interfaces collected from the design galleries people already trust. Search, filter, save what you like and open the original. Every card credits where it was found.</p>
        </header>

        <div className="sticky top-16 z-20 -mx-4 mt-8 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-5 sm:px-5 md:top-20">
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-0 flex-1 basis-64">
              <span className="sr-only">Search the library</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} maxLength={80} placeholder="Search brands, industries, styles…" className="input min-h-11 w-full" style={{ paddingLeft: "2.5rem" }} />
            </label>
            <select aria-label="Sort" value={search.sort ?? "newest"} onChange={(e) => set({ sort: e.target.value === "newest" ? undefined : (e.target.value as S["sort"]) })} className="min-h-11 shrink-0 rounded-xl border border-border bg-background px-3 text-sm text-foreground">
              <option value="newest">Newest added</option><option value="updated">Recently updated</option><option value="az">A–Z</option>
            </select>
            <button type="button" onClick={() => setFiltersOpen(true)} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold lg:hidden"><SlidersHorizontal className="h-4 w-4" aria-hidden="true" />Filters{active.length ? ` (${active.length})` : ""}</button>
            <button type="button" onClick={() => set({ saved: search.saved ? undefined : "1", collection: undefined })} aria-pressed={Boolean(search.saved)} className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold ${search.saved ? "border-[var(--emma-violet)] bg-[var(--emma-violet)] text-white" : "border-border"}`}><Bookmark className="h-4 w-4" aria-hidden="true" />Saved{saves.saves.length ? ` (${new Set(saves.saves.map((s) => s.example_id)).size})` : ""}</button>
          </div>
          {(active.length > 0 || search.q) && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
              {active.map((k) => <button key={k} type="button" onClick={() => set({ [k]: undefined } as Partial<S>)} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-medium">{k === "kind" ? KIND_LABEL[search.kind!] : k === "source" ? sourceName(search.source!) : String(search[k])}<X className="h-3 w-3" aria-hidden="true" /><span className="sr-only">Remove filter</span></button>)}
              <button type="button" onClick={() => { setQ(""); clearAll(); }} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold text-[var(--emma-violet)]"><RotateCcw className="h-3 w-3" aria-hidden="true" />Clear all</button>
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="hidden lg:block" aria-label="Filters"><div className="sticky top-44">{filterPanel}</div></aside>
          <section aria-live="polite" aria-busy={state === "loading"} className="min-w-0">
            {search.saved && saves.collections.length > 1 && (
              <div className="mb-4 flex flex-wrap gap-1.5"><Chip on={!search.collection} onClick={() => set({ collection: undefined })}>All saved</Chip>{saves.collections.map((c) => <Chip key={c} on={search.collection === c} onClick={() => set({ collection: c })}>{c}</Chip>)}</div>
            )}
            {saves.error && <p role="alert" className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{saves.error}</p>}
            <p className="mb-3 text-sm text-muted-foreground">{state === "loading" ? "Loading…" : count != null ? `${count.toLocaleString()} example${count === 1 ? "" : "s"}${search.saved ? " saved" : ""}` : ""}</p>
            {state === "error" ? (
              <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-700 dark:text-red-300">Couldn't load the library: {error} <button type="button" onClick={() => void load(0)} className="ml-2 font-semibold underline">Try again</button></div>
            ) : state === "loading" && !rows.length ? (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <li key={i} className="h-72 animate-pulse rounded-[20px] bg-muted" />)}</ul>
            ) : !rows.length ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center">
                <p className="font-semibold">{search.saved ? (saves.uid ? "Nothing saved yet." : "Sign in to save examples.") : facets && facets.total === 0 ? "The library is being collected." : "No examples match these filters."}</p>
                <p className="mt-1 text-sm text-muted-foreground">{search.saved ? (saves.uid ? "Use the bookmark on any card to save it here." : "Your saved examples are private to your account.") : facets && facets.total === 0 ? "Examples appear here as each source is read. Check back shortly." : "Try fewer filters or a different search."}</p>
                {search.saved && !saves.uid ? <Link to="/login" search={{ next: "/inspiration?saved=1" } as never} className="btn-primary-gradient mt-4 inline-flex min-h-10 items-center rounded-full px-5 text-sm font-semibold text-white">Sign in</Link> : (active.length > 0 || search.q) && <button type="button" onClick={() => { setQ(""); clearAll(); }} className="mt-4 text-sm font-semibold text-[var(--emma-violet)]">Clear all filters</button>}
              </div>
            ) : (
              <>
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{rows.map((ex) => <li key={ex.id} className="min-w-0"><ExampleCard ex={ex} sourceName={sourceName(ex.source_id)} saved={saves.isSaved(ex.id)} onToggleSave={saves.toggle} /></li>)}</ul>
                {count != null && rows.length < count && (
                  <div className="mt-8 text-center"><button type="button" onClick={() => void load(rows.length)} disabled={state === "more"} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-6 text-sm font-semibold hover:border-[var(--emma-violet)] disabled:opacity-60">{state === "more" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Show more ({(count - rows.length).toLocaleString()} left)</button></div>
                )}
              </>
            )}
          </section>
        </div>

        <section className="mt-20 overflow-hidden rounded-[28px] border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-10" aria-labelledby="insp-next">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--emma-violet)]">From inspiration to launch</p>
              <h2 id="insp-next" className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">Found a look you love? Let's build yours.</h2>
              <p className="mt-3 text-muted-foreground">Save the sites, stores and emails that feel right, then bring them to a free strategy call. We'll turn what you like about them into a design that fits your brand, your customers and your goals.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/book" className="btn-primary-gradient inline-flex min-h-11 items-center rounded-full px-6 text-sm font-semibold text-white">Book a free strategy call</Link>
                <Link to="/intake" className="inline-flex min-h-11 items-center rounded-full border border-border px-6 text-sm font-semibold hover:border-[var(--emma-violet)]">Start a project</Link>
                <Link to="/portfolio" className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-[var(--emma-violet)] hover:underline">See our client work →</Link>
              </div>
              {saves.saves.length > 0 && <p className="mt-4 text-sm text-muted-foreground">You've saved <strong className="text-foreground">{new Set(saves.saves.map((x) => x.example_id)).size}</strong> example{new Set(saves.saves.map((x) => x.example_id)).size === 1 ? "" : "s"}. Mention them when you book and we'll review them together.</p>}
            </div>
            <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[
                ["1", "Collect", "Save examples by type, industry or style. Group them into collections for each project."],
                ["2", "Discuss", "On a free call we look at what works in them and what your customers need."],
                ["3", "Build", "We design and build your site, store or emails around your brand, ready to launch."],
              ].map(([n, t, d]) => (
                <li key={n} className="rounded-2xl border border-border bg-background p-5">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--emma-violet)] text-sm font-bold text-white">{n}</span>
                  <h3 className="mt-3 font-display text-lg font-semibold">{t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <p className="mt-6 text-xs text-muted-foreground">Examples are collected from public design galleries and remain the work of their owners. Each card credits the gallery it came from and links to the original.</p>
      </main>

      {filtersOpen && (
        <div className="fixed inset-0 z-[150] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button type="button" aria-label="Close filters" className="absolute inset-0 bg-black/50" onClick={() => setFiltersOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Filters</h2><button type="button" onClick={() => setFiltersOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-border" aria-label="Close"><X className="h-4 w-4" aria-hidden="true" /></button></div>
            {filterPanel}
            <div className="sticky bottom-0 mt-6 flex gap-2 bg-background pt-3"><button type="button" onClick={clearAll} className="min-h-11 flex-1 rounded-full border border-border text-sm font-semibold">Clear all</button><button type="button" onClick={() => setFiltersOpen(false)} className="btn-primary-gradient min-h-11 flex-1 rounded-full text-sm font-semibold text-white">Show {count?.toLocaleString() ?? ""} results</button></div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return <fieldset><legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</legend><div className="flex flex-wrap gap-1.5">{children}</div></fieldset>;
}
function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" aria-pressed={on} onClick={onClick} className={`min-h-9 rounded-full border px-3 py-1 text-xs font-semibold transition ${on ? "border-[var(--emma-violet)] bg-[var(--emma-violet)] text-white" : "border-border text-muted-foreground hover:text-foreground"}`}>{children}</button>;
}
function Select({ label, value, onChange, options }: { label: string; value?: string; onChange: (v: string | undefined) => void; options: [string, string][] }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value || undefined)} disabled={!options.length && !value} className="input mt-1.5 min-h-10 w-full text-sm normal-case tracking-normal disabled:opacity-50">
        <option value="">{options.length ? "Any" : "None yet"}</option>
        {value && !options.some(([k]) => k === value) && <option value={value}>{value}</option>}
        {options.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
    </label>
  );
}
