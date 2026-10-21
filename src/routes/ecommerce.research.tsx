import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, X, Search, ExternalLink, Scale } from "lucide-react";
import { pageHead } from "@/lib/seo";
import { api, listItems, type Item } from "@/lib/ecom/workspace";
import { money, unitEconomics } from "@/lib/ecom/profit";
import { Card, ErrorBox, EvidenceBadge, NumberField, PageIntro, Progress, SaveToWorkspace, useWorkspace } from "@/components/ecom/ui";

export const Route = createFileRoute("/ecommerce/research")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => (typeof s.q === "string" ? { q: s.q.slice(0, 120) } : {}),
  head: () => pageHead({ title: "Product Research & Validation Tool | EmmaForYou", description: "Research a product idea with real competitor prices, reviews and your own costs. Every conclusion is labelled as observed, your figures or a hypothesis.", path: "/ecommerce/research" }),
  component: Research,
});

type Point = { text: string; basis: "evidence" | "hypothesis"; cite?: string };
interface Report {
  query: string; market: string; currency: string; createdAt: string; score: number | null; confidence: string;
  competitors: ({ ok: true; url: string; platform: string; title: string; h1: string | null; product: { name: string | null; price: number | null; currency: string | null; rating: number | null; reviewCount: number | null } | null; shipping: boolean; returns: boolean; payments: string[]; reviews: boolean; scannedAt: string } | { ok: false; url: string; error: string })[];
  news: { title: string; url: string; published_at: string | null; source: string }[];
  factors: { id: string; label: string; value: string; points: number | null; max: number; basis: "observed" | "user" | "unknown" }[];
  unknowns: string[];
  ai: { summary?: string; customerNeeds?: Point[]; gaps?: Point[]; risks?: Point[]; channels?: Point[]; validationPlan?: string[]; questions?: string[] } | null;
  aiNote: string;
  inputs?: { price: number | null; cost: number | null; shipping: number | null; feesPct: number | null; adCost: number | null };
}

function Research() {
  const search = Route.useSearch();
  const { workspace } = useWorkspace();
  const [query, setQuery] = useState(search.q ?? "");
  const [market, setMarket] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [urls, setUrls] = useState<string[]>([""]);
  const [price, setPrice] = useState<number | null>(null);
  const [cost, setCost] = useState<number | null>(null);
  const [shipping, setShipping] = useState<number | null>(null);
  const [feesPct, setFeesPct] = useState<number | null>(3);
  const [adCost, setAdCost] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [saved, setSaved] = useState<Item<Report> | null>(null);
  const [history, setHistory] = useState<Item<Report>[]>([]);
  const [compare, setCompare] = useState<string[]>([]);

  useEffect(() => { if (workspace) listItems<Report>(workspace.id, "research").then(setHistory).catch(() => setHistory([])); }, [workspace, saved]);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setReport(null); setSaved(null);
    try {
      const r = await api<{ report: Report }>("/api/ecom-research", { query, market, currency, competitorUrls: urls.filter((u) => u.trim()), price, cost, shipping, notes });
      setReport({ ...r.report, inputs: { price, cost, shipping, feesPct, adCost } });
    } catch (err) { setError(err instanceof Error ? err.message : "Research failed."); }
    finally { setBusy(false); }
  }

  const unit = report && price && cost != null ? unitEconomics({ price: price ?? 0, productCost: cost ?? 0, shipping: shipping ?? 0, feesPct: feesPct ?? 0, feesFixed: 0, adCostPerSale: adCost ?? 0, returnRatePct: 0 }) : null;
  const compared = history.filter((h) => compare.includes(h.id));

  return (
    <div>
      <PageIntro eyebrow="Start or grow" title="Product research & validation">Describe a product or niche and add a few competitor product pages. We read their public prices and reviews, check our tracked industry news, and calculate margin from your own costs. Anything that isn't measured is labelled as a hypothesis or unknown.</PageIntro>
      <form onSubmit={run} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <div className="space-y-3">
            <div><label htmlFor="r-q" className="text-sm font-medium">Product, niche or customer problem</label><input id="r-q" className="input mt-1" required minLength={3} maxLength={120} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. linen shirts for men, eco baby wipes, dog anxiety vests" /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label htmlFor="r-m" className="text-sm font-medium">Target market</label><input id="r-m" className="input mt-1" maxLength={80} value={market} onChange={(e) => setMarket(e.target.value)} placeholder="e.g. Nigeria, UK, worldwide" /></div>
              <div><label htmlFor="r-c" className="text-sm font-medium">Currency</label><select id="r-c" className="input mt-1" value={currency} onChange={(e) => setCurrency(e.target.value)}>{["USD", "NGN", "EUR", "GBP", "GHS", "KES", "ZAR", "CAD", "AUD"].map((c) => <option key={c}>{c}</option>)}</select></div>
            </div>
            <fieldset>
              <legend className="text-sm font-medium">Competitor product pages <span className="font-normal text-muted-foreground">(up to 5, recommended)</span></legend>
              <div className="mt-1 space-y-2">
                {urls.map((u, i) => (
                  <div key={i} className="flex gap-2">
                    <input className="input" type="url" inputMode="url" aria-label={`Competitor address ${i + 1}`} placeholder="https://competitor.com/products/…" value={u} onChange={(e) => setUrls(urls.map((x, j) => (j === i ? e.target.value : x)))} />
                    {urls.length > 1 && <button type="button" onClick={() => setUrls(urls.filter((_, j) => j !== i))} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border hover:bg-muted" aria-label={`Remove address ${i + 1}`}><X className="h-4 w-4" aria-hidden="true" /></button>}
                  </div>
                ))}
                {urls.length < 5 && <button type="button" onClick={() => setUrls([...urls, ""])} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--emma-violet)]"><Plus className="h-4 w-4" aria-hidden="true" />Add another</button>}
              </div>
            </fieldset>
            <div><label htmlFor="r-n" className="text-sm font-medium">What you already know <span className="font-normal text-muted-foreground">(optional)</span></label><textarea id="r-n" className="input mt-1" rows={2} maxLength={600} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Search trends you've checked, supplier quotes, customer feedback…" /></div>
          </div>
        </Card>
        <Card title="Your numbers (optional)">
          <div className="space-y-3">
            <NumberField id="r-price" label="Planned selling price" value={price} onChange={setPrice} suffix={currency} hint="Leave empty to use the competitors' median price." />
            <NumberField id="r-cost" label="Product cost per unit" value={cost} onChange={setCost} suffix={currency} />
            <NumberField id="r-ship" label="Shipping per order" value={shipping} onChange={setShipping} suffix={currency} />
            <NumberField id="r-fees" label="Payment/platform fees" value={feesPct} onChange={setFeesPct} suffix="%" />
            <NumberField id="r-ad" label="Expected ad cost per sale" value={adCost} onChange={setAdCost} suffix={currency} hint="Your estimate; leave empty if unknown." />
            <button type="submit" disabled={busy || query.trim().length < 3} className="btn-primary-gradient inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"><Search className="h-4 w-4" aria-hidden="true" />Research</button>
          </div>
        </Card>
      </form>

      <div className="mt-6 space-y-4">
        {busy && <Progress label="Researching…" steps={["Reading competitor pages", "Checking tracked industry news", "Writing the validation brief"]} />}
        {error && <ErrorBox message={error} />}
        {report && (
          <>
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <h2 className="font-display text-xl font-bold">{report.query}</h2>
                  <p className="text-sm text-muted-foreground">{report.market || "Market not set"} · {new Date(report.createdAt).toLocaleString()}</p>
                  {report.ai?.summary && <p className="mt-3 text-sm"><EvidenceBadge kind="hypothesis" /> <span className="ml-1">{report.ai.summary}</span></p>}
                  {report.aiNote && <p className="mt-2 text-xs text-muted-foreground">{report.aiNote}</p>}
                </div>
                <div className="text-center">
                  <p className="font-display text-4xl font-extrabold">{report.score ?? "—"}<span className="text-base text-muted-foreground">/100</span></p>
                  <p className="text-xs text-muted-foreground">Opportunity score · {report.confidence} confidence</p>
                </div>
              </div>
              <div className="mt-4"><SaveToWorkspace kind="research" title={`Research: ${report.query}`} data={report} savedId={saved?.id} onSaved={(i) => setSaved(i as Item<Report>)} /></div>
            </Card>
            <Card title="How the score is worked out">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-muted-foreground"><tr><th className="py-1 font-medium">Factor</th><th className="py-1 font-medium">What we found</th><th className="py-1 text-right font-medium">Points</th></tr></thead>
                <tbody className="divide-y divide-border">{report.factors.map((f) => (
                  <tr key={f.id}><td className="py-2 pr-2 align-top"><span className="font-medium">{f.label}</span><div className="mt-1"><EvidenceBadge kind={f.basis} /></div></td><td className="py-2 pr-2 align-top text-muted-foreground">{f.value}</td><td className="py-2 text-right align-top font-semibold">{f.points == null ? "not scored" : `${f.points}/${f.max}`}</td></tr>
                ))}</tbody>
              </table>
              <p className="mt-2 text-xs text-muted-foreground">The score only counts factors with data, so it moves as you add competitors and costs. It measures evidence available, not a prediction of sales.</p>
            </Card>
            {unit && (
              <Card title="Unit economics (your figures)">
                <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div><dt className="text-xs text-muted-foreground">Fees per sale</dt><dd className="font-semibold">{money(unit.fees, report.currency)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Before ads</dt><dd className="font-semibold">{money(unit.contributionBeforeAds, report.currency)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Profit per sale</dt><dd className={`font-semibold ${unit.profitPerSale < 0 ? "text-red-600" : ""}`}>{money(unit.profitPerSale, report.currency)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Max ad cost to break even</dt><dd className="font-semibold">{money(unit.maxAffordableAdCost, report.currency)}</dd></div>
                </dl>
              </Card>
            )}
            <Card title="Competitors (observed on their pages)">
              {report.competitors.length === 0 ? <p className="text-sm text-muted-foreground">No competitor pages added. Add 3–5 for a meaningful comparison.</p> : (
                <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="text-xs text-muted-foreground"><tr><th className="py-1 font-medium">Product</th><th className="font-medium">Price</th><th className="font-medium">Rating</th><th className="font-medium">Shipping / returns info</th></tr></thead>
                  <tbody className="divide-y divide-border">{report.competitors.map((c) => c.ok ? (
                    <tr key={c.url}><td className="py-2 pr-2"><a href={c.url} target="_blank" rel="noopener noreferrer nofollow" className="font-medium underline">{(c.product?.name ?? c.h1 ?? c.title).slice(0, 60)}</a><span className="block text-xs text-muted-foreground">{c.platform}</span></td><td>{c.product?.price ? `${c.product.currency ?? ""} ${c.product.price}` : "not in page data"}</td><td>{c.product?.rating ? `${c.product.rating} (${c.product.reviewCount ?? 0})` : "—"}</td><td>{c.shipping ? "Shipping ✓" : "Shipping ✗"} · {c.returns ? "Returns ✓" : "Returns ✗"}</td></tr>
                  ) : <tr key={c.url}><td className="py-2 pr-2 break-all text-muted-foreground" colSpan={4}>{c.url}: couldn't read ({c.error})</td></tr>)}</tbody>
                </table></div>
              )}
            </Card>
            {report.news.length > 0 && <Card title="Related industry news (sourced)"><ul className="space-y-1.5 text-sm">{report.news.map((n) => <li key={n.url}><a href={n.url} target="_blank" rel="noopener noreferrer" className="font-medium underline">{n.title}</a><span className="text-xs text-muted-foreground"> — {n.source}{n.published_at ? `, ${new Date(n.published_at).toLocaleDateString()}` : ""}</span></li>)}</ul></Card>}
            {report.ai && (
              <div className="grid gap-4 md:grid-cols-2">
                {([["customerNeeds", "Customer needs"], ["gaps", "Ways to stand out"], ["risks", "Risks"], ["channels", "Likely marketing channels"]] as const).map(([k, label]) => (report.ai?.[k] as Point[] | undefined)?.length ? (
                  <Card key={k} title={label}><ul className="space-y-2 text-sm">{(report.ai![k] as Point[]).map((p, i) => <li key={i} className="flex gap-2"><EvidenceBadge kind={p.basis === "evidence" ? "evidence" : "hypothesis"} /><span>{p.text}{p.cite ? <span className="text-xs text-muted-foreground"> [{p.cite}]</span> : null}</span></li>)}</ul></Card>
                ) : null)}
                {report.ai.validationPlan?.length ? <Card title="Validation plan"><ol className="list-decimal space-y-1 pl-5 text-sm">{report.ai.validationPlan.map((s, i) => <li key={i}>{s}</li>)}</ol></Card> : null}
                {report.ai.questions?.length ? <Card title="Questions to answer next"><ul className="list-disc space-y-1 pl-5 text-sm">{report.ai.questions.map((s, i) => <li key={i}>{s}</li>)}</ul></Card> : null}
              </div>
            )}
            <Card title="What we couldn't check"><ul className="space-y-1 text-sm">{report.unknowns.map((u) => <li key={u} className="flex gap-2"><EvidenceBadge kind="unknown" /><span className="text-muted-foreground">{u}</span></li>)}</ul></Card>
          </>
        )}

        {history.length > 0 && (
          <Card title="Saved research" actions={compared.length >= 2 ? undefined : <span className="text-xs text-muted-foreground">Tick 2–4 to compare</span>}>
            <ul className="divide-y divide-border">{history.map((h) => (
              <li key={h.id} className="flex items-center gap-3 py-2 text-sm">
                <input type="checkbox" aria-label={`Compare ${h.data.query}`} checked={compare.includes(h.id)} onChange={() => setCompare((c) => (c.includes(h.id) ? c.filter((x) => x !== h.id) : [...c, h.id].slice(-4)))} className="h-4 w-4 accent-[var(--emma-violet)]" />
                <button type="button" onClick={() => { setReport(h.data); setSaved(h); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="min-w-0 flex-1 truncate text-left font-medium hover:underline">{h.data.query}</button>
                <span className="text-xs text-muted-foreground">{h.data.score ?? "—"}/100 · {new Date(h.updated_at).toLocaleDateString()}</span>
              </li>
            ))}</ul>
            {compared.length >= 2 && (
              <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[480px] text-left text-sm">
                <caption className="mb-2 text-left font-semibold"><Scale className="mr-1 inline h-4 w-4" aria-hidden="true" />Side by side</caption>
                <thead className="text-xs text-muted-foreground"><tr><th className="py-1 font-medium">Factor</th>{compared.map((c) => <th key={c.id} className="font-medium">{c.data.query}</th>)}</tr></thead>
                <tbody className="divide-y divide-border">
                  <tr><td className="py-2 font-medium">Score</td>{compared.map((c) => <td key={c.id}>{c.data.score ?? "—"} ({c.data.confidence})</td>)}</tr>
                  {compared[0].data.factors.map((f) => <tr key={f.id}><td className="py-2 font-medium">{f.label}</td>{compared.map((c) => <td key={c.id} className="text-muted-foreground">{c.data.factors.find((x) => x.id === f.id)?.value ?? "—"}</td>)}</tr>)}
                </tbody>
              </table></div>
            )}
          </Card>
        )}
        <p className="text-xs text-muted-foreground"><ExternalLink className="mr-1 inline h-3 w-3" aria-hidden="true" />Next: <Link to="/ecommerce/competitors" className="underline">track competitors</Link>, <Link to="/ecommerce/profit" className="underline">model profit</Link> or <Link to="/community" className="underline">ask the community</Link>.</p>
      </div>
    </div>
  );
}
