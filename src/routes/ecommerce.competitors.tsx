import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Plus, X, RefreshCw, Check, Minus } from "lucide-react";
import { pageHead } from "@/lib/seo";
import { api, listItems, type Item } from "@/lib/ecom/workspace";
import { Card, ErrorBox, EvidenceBadge, PageIntro, Progress, SaveToWorkspace, useWorkspace } from "@/components/ecom/ui";

export const Route = createFileRoute("/ecommerce/competitors")({
  head: () => pageHead({ title: "Competitor Price & Product Comparison for Online Stores | EmmaForYou", description: "Compare competitors' public product pages side by side: price, reviews, shipping and returns information, payment options and page content.", path: "/ecommerce/competitors" }),
  component: Competitors,
});

type Scan =
  | { url: string; ok: false; error: string }
  | { url: string; ok: true; scannedAt: string; platform: string; title: string | null; h1: string | null; description: string | null; product: { name: string | null; price: number | null; currency: string | null; availability: string | null; rating: number | null; reviewCount: number | null; brand: string | null } | null; priceVisible: boolean; reviews: boolean; shipping: boolean; returns: boolean; payments: string[]; words: number; images: number };
interface Group { name: string; urls: string[]; results: Scan[]; scannedAt: string }

function Competitors() {
  const { workspace } = useWorkspace();
  const [name, setName] = useState("My competitors");
  const [urls, setUrls] = useState<string[]>(["", ""]);
  const [results, setResults] = useState<Scan[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedGroups, setSavedGroups] = useState<Item<Group>[]>([]);
  const [saved, setSaved] = useState<Item | null>(null);

  useEffect(() => { if (workspace) listItems<Group>(workspace.id, "competitors").then(setSavedGroups).catch(() => undefined); }, [workspace, saved]);

  async function run(list = urls) {
    const clean = list.map((u) => u.trim()).filter(Boolean);
    if (!clean.length) return setError("Add at least one product or store address.");
    setBusy(true); setError("");
    try { const r = await api<{ results: Scan[] }>("/api/ecom-scan", { urls: clean }); setResults(r.results); }
    catch (e) { setError(e instanceof Error ? e.message : "Scan failed."); } finally { setBusy(false); }
  }
  function open(g: Item<Group>) { setName(g.data.name); setUrls(g.data.urls); setResults(g.data.results); setSaved(g); }

  const ok = (results ?? []).filter((r): r is Extract<Scan, { ok: true }> => r.ok);
  const prices = ok.map((r) => r.product?.price).filter((v): v is number => v != null);
  const currencies = new Set(ok.map((r) => r.product?.currency).filter(Boolean));

  return (
    <div>
      <PageIntro eyebrow="Competitor intelligence" title="Compare competitors">Paste up to 6 competitor product pages (best) or store homepages. We read only what's public on each page right now. We can't see their sales, revenue or traffic, so we don't guess them.</PageIntro>
      <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card title="Pages to compare">
            <form onSubmit={(e) => { e.preventDefault(); void run(); }} className="space-y-2">
              <label htmlFor="cg-name" className="text-sm font-medium">Group name</label>
              <input id="cg-name" className="input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
              {urls.map((u, i) => (
                <div key={i} className="flex gap-2">
                  <label htmlFor={`cu-${i}`} className="sr-only">Address {i + 1}</label>
                  <input id={`cu-${i}`} className="input" type="url" inputMode="url" placeholder="https://competitor.com/products/…" value={u} onChange={(e) => setUrls((x) => x.map((y, j) => (j === i ? e.target.value : y)))} />
                  {urls.length > 1 && <button type="button" aria-label={`Remove address ${i + 1}`} onClick={() => setUrls((x) => x.filter((_, j) => j !== i))} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border hover:bg-muted"><X className="h-4 w-4" aria-hidden="true" /></button>}
                </div>
              ))}
              {urls.length < 6 && <button type="button" onClick={() => setUrls((x) => [...x, ""])} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--emma-violet)]"><Plus className="h-4 w-4" aria-hidden="true" />Add another</button>}
              <button type="submit" disabled={busy} className="btn-primary-gradient mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-xl px-6 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Scanning…" : "Compare"}</button>
            </form>
          </Card>
          {savedGroups.length > 0 && (
            <Card title="Saved comparisons">
              <ul className="space-y-1">{savedGroups.map((g) => <li key={g.id}><button type="button" onClick={() => open(g)} className="w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted"><span className="font-medium">{g.title}</span><span className="block text-xs text-muted-foreground">{g.data.urls.length} pages · scanned {new Date(g.data.scannedAt).toLocaleDateString()}</span></button></li>)}</ul>
            </Card>
          )}
        </div>
        <div className="min-w-0 space-y-4">
          {busy && <Progress label="Reading public pages" steps={["Fetching each page", "Reading product data and prices", "Checking shipping, returns and payment info"]} />}
          {error && <ErrorBox message={error} onRetry={() => run()} />}
          {results && !busy && (
            <Card title="Side by side" actions={<span className="flex flex-wrap gap-2"><button type="button" onClick={() => run()} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted"><RefreshCw className="h-4 w-4" aria-hidden="true" />Rescan</button><SaveToWorkspace kind="competitors" title={name || "Competitors"} data={{ name, urls: urls.filter(Boolean), results, scannedAt: new Date().toISOString() } satisfies Group} savedId={saved?.id} onSaved={setSaved} /></span>}>
              <div className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
                <table className="w-full min-w-[560px] text-sm">
                  <caption className="sr-only">Competitor comparison</caption>
                  <thead><tr><th scope="col" className="w-36 py-2 text-left text-xs font-semibold text-muted-foreground">Observed</th>{results.map((r) => <th key={r.url} scope="col" className="max-w-[200px] py-2 pr-3 text-left align-bottom"><a href={r.url} target="_blank" rel="noopener noreferrer nofollow" className="line-clamp-2 break-all text-xs font-semibold underline">{r.ok ? (r.product?.name || r.h1 || r.title || new URL(r.url).hostname) : new URL(r.url).hostname}</a></th>)}</tr></thead>
                  <tbody>
                    <Row label="Status" cells={results.map((r) => (r.ok ? <span className="text-emerald-700 dark:text-emerald-300">Read</span> : <span className="text-red-600">{r.error}</span>))} />
                    <Row label="Platform" cells={results.map((r) => (r.ok ? r.platform : "—"))} />
                    <Row label="Price" cells={results.map((r) => (r.ok && r.product?.price != null ? `${r.product.currency ?? ""} ${r.product.price.toLocaleString()}` : r.ok && r.priceVisible ? "Visible, not in structured data" : "—"))} />
                    <Row label="Availability" cells={results.map((r) => (r.ok ? r.product?.availability?.replace(/^https?:\/\/schema.org\//, "") ?? "—" : "—"))} />
                    <Row label="Rating" cells={results.map((r) => (r.ok && r.product?.rating != null ? `${r.product.rating}${r.product.reviewCount ? ` (${r.product.reviewCount} reviews)` : ""}` : "—"))} />
                    <Row label="Reviews shown" cells={results.map((r) => (r.ok ? <Yes v={r.reviews} /> : "—"))} />
                    <Row label="Shipping info" cells={results.map((r) => (r.ok ? <Yes v={r.shipping} /> : "—"))} />
                    <Row label="Returns info" cells={results.map((r) => (r.ok ? <Yes v={r.returns} /> : "—"))} />
                    <Row label="Payment options" cells={results.map((r) => (r.ok ? (r.payments.length ? r.payments.join(", ") : "None detected") : "—"))} />
                    <Row label="Words on page" cells={results.map((r) => (r.ok ? r.words.toLocaleString() : "—"))} />
                    <Row label="Images" cells={results.map((r) => (r.ok ? String(r.images) : "—"))} />
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><EvidenceBadge kind="observed" />Read from each public page at {new Date(ok[0]?.scannedAt ?? Date.now()).toLocaleString()}. Prices can change and may depend on location; payment options are detected from page code and may be incomplete.</div>
              {prices.length >= 2 && currencies.size <= 1 && <p className="mt-2 text-sm">Observed price range: <strong>{Math.min(...prices).toLocaleString()} – {Math.max(...prices).toLocaleString()} {[...currencies][0] ?? ""}</strong> across {prices.length} pages.</p>}
              {currencies.size > 1 && <p className="mt-2 text-sm text-muted-foreground">Prices are in different currencies, so we don't compare them directly.</p>}
            </Card>
          )}
          {!results && !busy && <Card className="border-dashed"><p className="text-sm text-muted-foreground">Results show here. Tip: compare the same kind of product on each site. To check one idea in depth, use <Link to="/ecommerce/research" className="underline">product research</Link>.</p></Card>}
        </div>
      </div>
    </div>
  );
}

function Row({ label, cells }: { label: string; cells: ReactNode[] }) {
  return <tr className="border-t border-border/60"><th scope="row" className="py-2 pr-2 text-left text-xs font-medium text-muted-foreground">{label}</th>{cells.map((c, i) => <td key={i} className="py-2 pr-3 align-top text-xs">{c}</td>)}</tr>;
}
function Yes({ v }: { v: boolean }) {
  return v ? <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300"><Check className="h-3.5 w-3.5" aria-hidden="true" />Yes</span> : <span className="inline-flex items-center gap-1 text-muted-foreground"><Minus className="h-3.5 w-3.5" aria-hidden="true" />Not found</span>;
}
