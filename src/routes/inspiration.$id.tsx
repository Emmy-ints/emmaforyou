import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Bookmark, BookmarkCheck, ExternalLink, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ExampleCard from "@/components/inspiration/ExampleCard";
import { useSaves } from "@/components/inspiration/useSaves";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/seo";
import { CARD_COLUMNS, KIND_LABEL, hostLabel, safeHref, type Example, type SourceInfo } from "@/lib/inspiration/ui";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const Route = createFileRoute("/inspiration/$id")({
  component: Page,
  // Detail pages are thin by nature (they point elsewhere), so they stay out of search indexes.
  head: ({ params }) => pageHead({ title: "Inspiration example | EmmaForYou", description: "A design example from the EmmaForYou inspiration library, with a link to the original.", path: `/inspiration/${params.id}`, noindex: true }),
});

function Page() {
  const { id } = Route.useParams();
  const saves = useSaves();
  const [ex, setEx] = useState<Example | null>(null);
  const [source, setSource] = useState<SourceInfo | null>(null);
  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [related, setRelated] = useState<Example[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [imgFailed, setImgFailed] = useState(false);
  const [collection, setCollection] = useState("Saved");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true; setState("loading"); setImgFailed(false);
    (async () => {
      if (!/^[0-9a-f-]{36}$/i.test(id)) { setState("missing"); return; }
      const { data, error } = await db.from("inspiration_examples").select(`${CARD_COLUMNS},description,also_listed_on,link_status,link_checked_at,attribution,source_published_at`).eq("id", id).maybeSingle();
      if (!live) return;
      if (error) { setState("error"); return; }
      if (!data) { setState("missing"); return; }
      setEx(data); setState("ready");
      if (typeof document !== "undefined") document.title = `${data.title} — Inspiration | EmmaForYou`;
      const { data: srcs } = await db.from("inspiration_sources").select("id,name,home_url,category,status,imported_total,last_success_at,restriction,method,enabled,sort");
      if (!live) return;
      setSources(srcs ?? []); setSource((srcs ?? []).find((s: SourceInfo) => s.id === data.source_id) ?? null);
      let rq = db.from("inspiration_examples").select(CARD_COLUMNS).eq("status", "visible").eq("kind", data.kind).neq("id", data.id);
      const overlap = data.industries?.length ? data.industries : data.styles;
      if (overlap?.length) rq = rq.overlaps(data.industries?.length ? "industries" : "styles", overlap);
      const { data: rel } = await rq.order("discovered_at", { ascending: false }).limit(6);
      if (live) setRelated(rel ?? []);
    })().catch(() => live && setState("error"));
    return () => { live = false; };
  }, [id]);

  const original = safeHref(ex?.original_url);
  const listing = safeHref(ex?.listing_url);
  const img = ex && !imgFailed && ex.image_status !== "broken" ? safeHref(ex.image_url) : null;
  const saved = ex ? saves.isSaved(ex.id) : false;
  const name = (sid: string) => sources.find((s) => s.id === sid)?.name ?? sid;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content" className="mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-5 md:pt-32">
        <Link to="/inspiration" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Inspiration library</Link>
        {state === "loading" ? <p role="status" className="mt-10 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Loading…</p>
        : state === "missing" ? <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center"><p className="font-semibold">This example isn't in the library any more.</p><Link to="/inspiration" className="mt-3 inline-block text-sm font-semibold text-[var(--emma-violet)]">Browse the library</Link></div>
        : state === "error" || !ex ? <p role="alert" className="mt-10 text-red-600">Couldn't load this example. Please refresh.</p>
        : (
          <>
            <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <div className="overflow-hidden rounded-[24px] border border-border bg-muted">
                {img ? <img src={img} alt={`Preview of ${ex.title}`} referrerPolicy="no-referrer" onError={() => setImgFailed(true)} className="h-auto w-full object-cover object-top" />
                  : <div className="grid aspect-[16/10] place-items-center p-8 text-center"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{KIND_LABEL[ex.kind]}</p><p className="mt-2 font-display text-3xl font-semibold">{ex.brand || ex.title}</p><p className="mt-2 text-sm text-muted-foreground">No preview available. Open the original to see it.</p></div></div>}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--emma-violet)]">{KIND_LABEL[ex.kind]}</p>
                <h1 className="mt-2 break-words font-display text-3xl font-semibold tracking-tight md:text-4xl">{ex.title}</h1>
                {(ex.brand || original) && <p className="mt-2 text-muted-foreground">{ex.brand ?? hostLabel(original)}</p>}
                {ex.description && <p className="mt-4 text-[0.95rem] leading-relaxed text-muted-foreground">{ex.description}</p>}
                <div className="mt-6 flex flex-wrap gap-2">
                  {(original ?? listing) && <a href={(original ?? listing)!} target="_blank" rel="noopener noreferrer nofollow" className="btn-primary-gradient inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white">{original ? `Visit ${hostLabel(original)}` : `View on ${source?.name ?? "the source"}`}<ExternalLink className="h-4 w-4" aria-hidden="true" /></a>}
                  {original && listing && <a href={listing} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-semibold hover:border-[var(--emma-violet)]">See it on {source?.name ?? "the gallery"}<ExternalLink className="h-4 w-4" aria-hidden="true" /></a>}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {!saved && saves.uid && <label className="text-sm"><span className="sr-only">Collection</span><input list="insp-collections" value={collection} onChange={(e) => setCollection(e.target.value)} maxLength={60} className="input min-h-10 w-44 text-sm" aria-label="Collection name" /><datalist id="insp-collections">{saves.collections.map((c) => <option key={c} value={c} />)}</datalist></label>}
                  <button type="button" disabled={busy} onClick={async () => { setBusy(true); saves.setError(""); try { if (saved) await saves.unsave(ex); else await saves.save(ex, collection.trim() || "Saved"); } catch (e) { saves.setError(e instanceof Error ? e.message : "Couldn't save."); } finally { setBusy(false); } }} aria-pressed={saved}
                    className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold ${saved ? "border-[var(--emma-violet)] bg-[var(--emma-violet)] text-white" : "border-border"}`}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : saved ? <BookmarkCheck className="h-4 w-4" aria-hidden="true" /> : <Bookmark className="h-4 w-4" aria-hidden="true" />}{saved ? "Saved" : saves.uid ? "Save" : "Sign in to save"}
                  </button>
                </div>
                {saves.error && <p role="alert" className="mt-2 text-sm text-red-600">{saves.error}</p>}
                <dl className="mt-6 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Found on</dt><dd>{source ? <a href={source.home_url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-[var(--emma-violet)]">{source.name}</a> : ex.source_id}{(ex.also_listed_on ?? []).length > 0 && <span className="text-muted-foreground"> · also on {[...new Set((ex.also_listed_on ?? []).map((u) => hostLabel(u)))].join(", ")}</span>}</dd>
                  {ex.industries.length > 0 && <><dt className="text-muted-foreground">Industry</dt><dd>{ex.industries.map((t) => <Link key={t} to="/inspiration" search={{ industry: t }} className="mr-2 hover:text-[var(--emma-violet)]">{t}</Link>)}</dd></>}
                  {ex.styles.length > 0 && <><dt className="text-muted-foreground">Style</dt><dd>{ex.styles.map((t) => <Link key={t} to="/inspiration" search={{ style: t }} className="mr-2 hover:text-[var(--emma-violet)]">{t}</Link>)}</dd></>}
                  {ex.platform && <><dt className="text-muted-foreground">Platform</dt><dd>{ex.platform} <span className="text-xs text-muted-foreground">(as listed by {source?.name ?? "the source"})</span></dd></>}
                  {ex.colors.length > 0 && <><dt className="text-muted-foreground">Colours</dt><dd>{ex.colors.join(", ")}</dd></>}
                  {ex.tags.length > 0 && <><dt className="text-muted-foreground">Tags</dt><dd className="flex flex-wrap gap-1">{ex.tags.slice(0, 12).map((t) => <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs">{t}</span>)}</dd></>}
                  <dt className="text-muted-foreground">Link check</dt><dd>{ex.link_status === "ok" ? "Working" : ex.link_status === "redirected" ? "Working (redirects)" : ex.link_status === "broken" ? <span className="text-amber-700 dark:text-amber-300">May be offline</span> : "Not checked yet"}{ex.link_checked_at ? <span className="text-muted-foreground"> · {new Date(ex.link_checked_at).toLocaleDateString()}</span> : null}</dd>
                  <dt className="text-muted-foreground">Added</dt><dd>{new Date(ex.discovered_at).toLocaleDateString()}</dd>
                </dl>
                <p className="mt-6 text-xs text-muted-foreground">{img ? `Preview image from ${source?.name ?? "the source"}. ` : ""}EmmaForYou links to the original and credits where it was found. We don't host, copy or recreate it, and all rights stay with their owners.</p>
              </div>
            </div>
            {related.length > 0 && (
              <section className="mt-16" aria-labelledby="insp-related">
                <h2 id="insp-related" className="font-display text-2xl font-semibold tracking-tight">Related examples</h2>
                <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{related.map((r) => <li key={r.id} className="min-w-0"><ExampleCard ex={r} sourceName={name(r.source_id)} saved={saves.isSaved(r.id)} onToggleSave={saves.toggle} /></li>)}</ul>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
