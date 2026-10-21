import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ExternalLink, Search, ChevronDown, ArrowRight, Info } from "lucide-react";
import { pageHead } from "@/lib/seo";
import { api, listItems, updateWorkspace, type Item } from "@/lib/ecom/workspace";
import type { StoreAudit, AuditFinding, Category } from "@/lib/ecom/audit-server";
import { Card, ErrorBox, EvidenceBadge, PageIntro, Progress, SaveToWorkspace, ScoreRing, useWorkspace } from "@/components/ecom/ui";

export const Route = createFileRoute("/ecommerce/grow")({
  validateSearch: (s: Record<string, unknown>): { url?: string } => (typeof s.url === "string" ? { url: s.url.slice(0, 300) } : {}),
  head: () => pageHead({ title: "Free Ecommerce Store Audit — Speed, SEO & Conversion | EmmaForYou", description: "Audit any online store or product listing: speed, SEO, trust signals, product pages and checkout friction, with step-by-step fixes.", path: "/ecommerce/grow" }),
  component: StoreAuditPage,
});

const CAT_LABEL: Record<Category, string> = { technical: "Technical", seo: "SEO", conversion: "Conversion & trust", product: "Product pages" };
const SEV: Record<string, string> = { high: "bg-red-500/12 text-red-700 dark:text-red-300", medium: "bg-amber-500/12 text-amber-700 dark:text-amber-300", low: "bg-muted text-muted-foreground" };

function StoreAuditPage() {
  const search = Route.useSearch();
  const { workspace } = useWorkspace();
  const [url, setUrl] = useState(search.url ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [audit, setAudit] = useState<StoreAudit | null>(null);
  const [previous, setPrevious] = useState<Item<StoreAudit> | null>(null);
  const [saved, setSaved] = useState<Item<StoreAudit> | null>(null);
  const [filter, setFilter] = useState<"issues" | "all">("issues");

  useEffect(() => { if (workspace?.store_url && !url) setUrl(workspace.store_url); }, [workspace]); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    if (busy || !url.trim()) return;
    setBusy(true); setError(""); setAudit(null); setSaved(null);
    try {
      const r = await api<{ audit: StoreAudit }>("/api/ecom-audit", { url: url.trim() });
      setAudit(r.audit);
      if (workspace) {
        const host = new URL(r.audit.finalUrl).hostname;
        const prev = (await listItems<StoreAudit>(workspace.id, "audit")).find((i) => { try { return new URL(i.data.finalUrl).hostname === host; } catch { return false; } });
        setPrevious(prev ?? null);
        if (!workspace.store_url) void updateWorkspace(workspace.id, { store_url: r.audit.finalUrl.slice(0, 300), stage: "growing" }).catch(() => undefined);
      }
    } catch (err) { setError(err instanceof Error ? err.message : "The audit failed."); }
    finally { setBusy(false); }
  }

  const shown = audit ? audit.findings.filter((f) => filter === "all" || !f.pass) : [];
  return (
    <div>
      <PageIntro eyebrow="Grow my existing store" title="Store audit">Enter your store's home page or a product page. We check what any visitor can see: speed, search basics, trust signals and product pages. It can't see your private sales data; use <Link to="/ecommerce/diagnose" className="font-semibold text-foreground underline">Sales diagnosis</Link> for that.</PageIntro>
      <form onSubmit={run} className="flex flex-col gap-2 sm:flex-row" role="search">
        <label htmlFor="store-url" className="sr-only">Store or product address</label>
        <input id="store-url" className="input flex-1" type="url" inputMode="url" placeholder="https://yourstore.com or a product link" value={url} onChange={(e) => setUrl(e.target.value)} autoComplete="url" />
        <button type="submit" disabled={busy || !url.trim()} className="btn-primary-gradient inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold text-white disabled:opacity-60"><Search className="h-4 w-4" aria-hidden="true" />Audit</button>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">Works with Shopify, WooCommerce, Wix, BigCommerce, Squarespace, Magento, PrestaShop, OpenCart, Shopware, Ecwid, Salesforce Commerce, headless and custom stores, and listings on Amazon, Etsy, eBay, Walmart and Jumia where those pages allow automated visits.</p>

      <div className="mt-6 space-y-4">
        {busy && <Progress label="Auditing the store…" steps={["Opening the page", "Finding product pages", "Checking links, robots.txt and sitemap", "Asking Google PageSpeed for mobile speed (up to a minute)"]} />}
        {error && <ErrorBox message={error} onRetry={() => run()} />}
        {audit && (
          <>
            <Card>
              <div className="flex flex-wrap items-center gap-6">
                <ScoreRing value={audit.overall} label="Overall" size={96} />
                {(Object.keys(audit.scores) as Category[]).filter((c) => audit.scores[c] >= 0).map((c) => <ScoreRing key={c} value={audit.scores[c]} label={CAT_LABEL[c]} />)}
                <div className="min-w-[220px] flex-1 text-sm">
                  <p><span className="text-muted-foreground">Store:</span> <a href={audit.finalUrl} target="_blank" rel="noopener noreferrer nofollow" className="font-medium underline">{new URL(audit.finalUrl).hostname}</a></p>
                  <p><span className="text-muted-foreground">Platform:</span> <span className="font-medium">{audit.platform.name}</span>{audit.platform.signals.length ? <span className="text-muted-foreground"> (from {audit.platform.signals.slice(0, 2).join(", ")})</span> : null}</p>
                  <p><span className="text-muted-foreground">Scanned:</span> {new Date(audit.scannedAt).toLocaleString()} · {audit.pages.length} addresses</p>
                  {previous && <p className="mt-1 text-xs"><span className="text-muted-foreground">Last saved audit ({new Date(previous.data.scannedAt).toLocaleDateString()}):</span> <strong>{previous.data.overall}</strong> → <strong>{audit.overall}</strong> {audit.overall > previous.data.overall ? "▲" : audit.overall < previous.data.overall ? "▼" : "="}</p>}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <SaveToWorkspace kind="audit" title={`Store audit: ${new URL(audit.finalUrl).hostname}`} data={audit} savedId={saved?.id} onSaved={(i) => setSaved(i as Item<StoreAudit>)} />
                <Link to="/ecommerce/plan" className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted">Turn fixes into an action plan <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              </div>
            </Card>

            {audit.pagespeed !== "unavailable" && audit.pagespeed && (
              <Card title="Google PageSpeed (mobile)">
                <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  {[["Performance", audit.pagespeed.performance], ["Accessibility", audit.pagespeed.accessibility], ["SEO", audit.pagespeed.seo], ["Largest content", audit.pagespeed.lcp]].map(([k, v]) => <div key={k as string}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-display text-lg font-bold">{v ?? "—"}</dd></div>)}
                </dl>
              </Card>
            )}

            <Card title="What a connected store would add" className="border-dashed">
              <p className="text-sm text-muted-foreground"><Info className="mr-1 inline h-4 w-4" aria-hidden="true" />{audit.platform.connected ? <>A future <strong className="text-foreground">{audit.platform.connected.api}</strong> connection could read {audit.platform.connected.data.join(", ")}. It isn't available yet: {audit.platform.connected.requires}</> : "This platform has no public API we can connect to."} Until then, upload an orders export or enter your numbers in <Link to="/ecommerce/diagnose" className="font-semibold text-foreground underline">Sales diagnosis</Link>.</p>
            </Card>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold">{audit.findings.filter((f) => !f.pass).length} things to fix <span className="text-sm font-normal text-muted-foreground">of {audit.findings.length} checks</span></h2>
              <div role="group" aria-label="Show" className="flex gap-1">{(["issues", "all"] as const).map((f) => <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === f ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}>{f === "issues" ? "Issues" : "All checks"}</button>)}</div>
            </div>
            <ul className="space-y-2">{shown.map((f) => <FindingRow key={f.id} f={f} />)}</ul>
            {audit.limits.length > 0 && <Card title="Limits of this scan"><ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">{audit.limits.map((l) => <li key={l}>{l}</li>)}</ul></Card>}
            <details className="rounded-2xl border border-border bg-card p-4 text-sm"><summary className="cursor-pointer font-semibold">Addresses checked</summary><ul className="mt-2 space-y-1 text-xs">{audit.pages.map((p) => <li key={p.url} className="flex flex-wrap gap-2"><span className="text-muted-foreground">{p.kind}</span><span className="break-all">{p.url}</span><span className="text-muted-foreground">HTTP {p.status || "—"} · {(p.ms / 1000).toFixed(1)}s{p.error ? ` · ${p.error}` : ""}</span></li>)}</ul></details>
          </>
        )}
        {!busy && !audit && !error && (
          <Card className="border-dashed"><p className="text-sm text-muted-foreground">Tip: audit your best-selling product page as well as the home page, then save both and compare after you make changes.</p></Card>
        )}
      </div>
    </div>
  );
}

function FindingRow({ f }: { f: AuditFinding }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-2xl border border-border bg-card">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full flex-wrap items-center gap-2 px-4 py-3 text-left">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${f.pass ? "bg-emerald-500" : f.severity === "high" ? "bg-red-500" : f.severity === "medium" ? "bg-amber-500" : "bg-muted-foreground"}`} aria-hidden="true" />
        <span className="min-w-0 flex-1 text-sm font-semibold">{f.title}<span className="sr-only">{f.pass ? " (passed)" : ` (${f.severity} priority)`}</span></span>
        {!f.pass && <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${SEV[f.severity]}`}>{f.severity}</span>}
        <span className="hidden text-xs text-muted-foreground sm:inline">{CAT_LABEL[f.category]}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="space-y-3 border-t border-border px-4 py-3 text-sm">
          <p className="flex flex-wrap items-center gap-2"><EvidenceBadge kind={f.confidence} /><span>{f.evidence}</span></p>
          {!f.pass && <>
            <p><span className="font-semibold">Why it matters: </span><span className="text-muted-foreground">{f.impact}</span></p>
            <p><span className="font-semibold">Fix: </span>{f.fix}</p>
            <ol className="list-decimal space-y-0.5 pl-5 text-muted-foreground">{f.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            <p className="text-xs text-muted-foreground">Effort: {f.effort} · Check it worked: {f.verify}</p>
          </>}
          {f.affected.length > 0 && <ul className="space-y-0.5 text-xs">{f.affected.slice(0, 6).map((a) => <li key={a} className="break-all text-muted-foreground"><ExternalLink className="mr-1 inline h-3 w-3" aria-hidden="true" />{a}</li>)}</ul>}
        </div>
      )}
    </li>
  );
}
