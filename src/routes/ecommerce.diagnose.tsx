import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Upload, FlaskConical, Check } from "lucide-react";
import { pageHead } from "@/lib/seo";
import { diagnose, stageRates, type AuditSignals, type FunnelInput } from "@/lib/ecom/diagnose";
import { summariseOrders, type OrdersSummary } from "@/lib/ecom/csv";
import { listItems, saveItem, type Item } from "@/lib/ecom/workspace";
import type { StoreAudit } from "@/lib/ecom/audit-server";
import { Card, ErrorBox, EvidenceBadge, NumberField, PageIntro, SaveToWorkspace, useWorkspace } from "@/components/ecom/ui";

export const Route = createFileRoute("/ecommerce/diagnose")({
  head: () => pageHead({ title: "Ecommerce Sales Diagnosis — Why Isn't My Store Selling? | EmmaForYou", description: "Enter your funnel numbers or upload an orders export to see where shoppers drop off, what's confirmed and what to test first.", path: "/ecommerce/diagnose" }),
  component: Diagnose,
});

const empty: FunnelInput = { sessions: null, productViews: null, addToCarts: null, checkouts: null, orders: null, repeatCustomers: null, customers: null, revenue: null, adSpend: null, previous: null };
const FIELDS: [keyof FunnelInput, string, string?][] = [
  ["sessions", "Visits (sessions)"], ["productViews", "Product page views", "Sessions that viewed a product"], ["addToCarts", "Add to cart", "Sessions with an add-to-cart"],
  ["checkouts", "Checkouts started"], ["orders", "Orders"], ["revenue", "Revenue", "Excluding tax"], ["customers", "Customers"], ["repeatCustomers", "Repeat customers", "Customers with 2+ orders"], ["adSpend", "Ad spend"],
];

function Diagnose() {
  const { uid, workspace } = useWorkspace();
  const [f, setF] = useState<FunnelInput>(empty);
  const [prevOn, setPrevOn] = useState(false);
  const [csv, setCsv] = useState<OrdersSummary | null>(null);
  const [csvError, setCsvError] = useState("");
  const [signals, setSignals] = useState<AuditSignals>({});
  const [auditName, setAuditName] = useState("");
  const [saved, setSaved] = useState<Item | null>(null);
  const [added, setAdded] = useState<string[]>([]);

  useEffect(() => {
    if (!workspace) return;
    listItems<StoreAudit>(workspace.id, "audit").then((rows) => {
      const a = rows[0]?.data; if (!a) return;
      const failed = (id: string) => a.findings.some((x) => x.id === id && !x.pass);
      setSignals({ slow: failed("pagespeed") || failed("speed-response"), noShippingInfo: failed("shipping"), noReturnsInfo: failed("returns"), noReviews: failed("reviews"), fewPaymentOptions: failed("payments"), noProductSchema: failed("product-schema"), mobileIssues: failed("viewport"), noPrice: failed("price") });
      setAuditName(new URL(a.finalUrl).hostname);
    }).catch(() => undefined);
    listItems<{ input: FunnelInput }>(workspace.id, "diagnosis").then((rows) => { if (rows[0]?.data?.input) { setF(rows[0].data.input); setPrevOn(Boolean(rows[0].data.input.previous)); setSaved(rows[0]); } }).catch(() => undefined);
  }, [workspace]);

  const result = useMemo(() => diagnose({ ...f, previous: prevOn ? f.previous : null }, signals), [f, prevOn, signals]);
  const rates = stageRates(f);
  const hasData = FIELDS.some(([k]) => f[k] != null);
  const set = (k: keyof FunnelInput, v: number | null) => setF((x) => ({ ...x, [k]: v }));
  const setPrev = (k: keyof FunnelInput, v: number | null) => setF((x) => ({ ...x, previous: { ...(x.previous ?? {}), [k]: v } }));

  async function onFile(file?: File) {
    if (!file) return;
    setCsvError("");
    if (file.size > 15 * 1024 * 1024) return setCsvError("That file is over 15 MB. Export a shorter date range.");
    try {
      const s = summariseOrders(await file.text());
      setCsv(s);
      setF((x) => ({ ...x, orders: s.orders, revenue: Math.round((s.revenue - s.refunds) * 100) / 100, customers: s.customers, repeatCustomers: s.repeatCustomers }));
    } catch (e) { setCsvError(e instanceof Error ? e.message : "Couldn't read that file."); }
  }
  async function addExperiment(title: string, exp: { action: string; metric: string; direction: string; review: string }) {
    if (!uid || !workspace) return;
    await saveItem(uid, workspace.id, "experiment", title, { hypothesis: title, action: exp.action, metric: exp.metric, direction: exp.direction, reviewIn: exp.review, baseline: result.conversion != null ? `Conversion ${(result.conversion * 100).toFixed(2)}%` : "", source: "Sales diagnosis" });
    setAdded((a) => [...a, title]);
  }

  return (
    <div>
      <PageIntro eyebrow="Grow my existing store" title="Sales diagnosis">Enter the numbers you have for one period (your store's analytics shows them), or upload an orders export. We find the biggest drop between steps and label every finding by how strong the evidence is. Nothing here is compared with made-up industry averages.</PageIntro>
      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card title="Your numbers">
            <div className="grid grid-cols-2 gap-3">{FIELDS.map(([k, label, hint]) => <NumberField key={k} id={`d-${k}`} label={label} hint={hint} value={f[k] as number | null} onChange={(v) => set(k, v)} step="1" />)}</div>
            <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={prevOn} onChange={(e) => setPrevOn(e.target.checked)} className="h-4 w-4 accent-[var(--emma-violet)]" />Compare with a previous period</label>
            {prevOn && <div className="mt-3 grid grid-cols-2 gap-3">{(["sessions", "orders"] as const).map((k) => <NumberField key={k} id={`dp-${k}`} label={`Previous ${k === "sessions" ? "visits" : "orders"}`} value={(f.previous?.[k] as number | null) ?? null} onChange={(v) => setPrev(k, v)} step="1" />)}</div>}
          </Card>
          <Card title="Or upload an orders export (CSV)">
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border p-5 text-center text-sm hover:bg-muted/50">
              <Upload className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><span className="font-medium">Choose a CSV file</span><span className="text-xs text-muted-foreground">Shopify, WooCommerce or any export with order number and total. Read in your browser only.</span>
              <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
            {csvError && <div className="mt-2"><ErrorBox message={csvError} /></div>}
            {csv && <div className="mt-3 text-xs"><p className="font-semibold">{csv.source}: {csv.orders} orders{csv.from ? `, ${csv.from} to ${csv.to}` : ""}</p><p className="text-muted-foreground">Revenue {csv.revenue.toFixed(2)} {csv.currency ?? ""}, refunds {csv.refunds.toFixed(2)}, discounts {csv.discounts.toFixed(2)}, shipping charged {csv.shipping.toFixed(2)}.</p>{csv.warnings.map((w) => <p key={w} className="text-amber-700 dark:text-amber-300">{w}</p>)}<p className="mt-1 text-muted-foreground">Orders, revenue (after refunds) and customers were filled in. Enter visits and cart steps from your analytics for the <strong>same dates</strong>{csv.from ? ` (${csv.from} to ${csv.to})` : ""}, or the rates will be wrong.</p></div>}
          </Card>
          {auditName && <p className="text-xs text-muted-foreground">Using your saved audit of <strong>{auditName}</strong> to support findings.</p>}
        </div>

        <div className="space-y-4">
          {!hasData ? <Card className="border-dashed"><p className="text-sm text-muted-foreground">Enter at least visits and orders to start. The more steps you add, the more precise the diagnosis.</p></Card> : (
            <>
              <Card title="Funnel" actions={<SaveToWorkspace kind="diagnosis" title={`Sales diagnosis ${new Date().toLocaleDateString()}`} data={{ input: { ...f, previous: prevOn ? f.previous : null }, result, csv }} savedId={saved?.id} onSaved={setSaved} />}>
                <div className="grid gap-2 sm:grid-cols-4">
                  <Stat label="Conversion rate" value={result.conversion != null ? `${(result.conversion * 100).toFixed(2)}%` : "—"} />
                  <Stat label="Average order value" value={result.aov != null ? result.aov.toFixed(2) : "—"} />
                  <Stat label="Biggest drop" value={result.biggestDrop ? `${result.biggestDrop.from} → ${result.biggestDrop.to}` : "—"} />
                  <Stat label="Missing steps" value={result.missing.length ? String(result.missing.length) : "None"} />
                </div>
                <ol className="mt-4 space-y-2">
                  {rates.map((r) => (
                    <li key={r.from} className="text-sm">
                      <div className="flex justify-between"><span>{r.from} → {r.to}</span><span className="font-semibold">{r.rate != null ? `${(r.rate * 100).toFixed(1)}% continue` : "no data"}</span></div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true"><div className={`h-full rounded-full ${r === result.biggestDrop ? "bg-red-500" : "bg-[var(--emma-violet)]"}`} style={{ width: `${Math.min(100, (r.rate ?? 0) * 100)}%` }} /></div>
                    </li>
                  ))}
                </ol>
              </Card>
              <ul className="space-y-3">{result.findings.map((x, i) => (
                <li key={i}><Card>
                  <div className="flex flex-wrap items-center gap-2"><EvidenceBadge kind={x.evidence} /><span className="text-xs text-muted-foreground">{x.stage}</span></div>
                  <h3 className="mt-2 font-display text-base font-bold">{x.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{x.detail}</p>
                  {x.causes.length > 0 && <div className="mt-2 text-sm"><p className="font-semibold">Possible causes <span className="font-normal text-muted-foreground">(hypotheses to check)</span></p><ul className="list-disc pl-5 text-muted-foreground">{x.causes.map((c) => <li key={c}>{c}</li>)}</ul></div>}
                  {x.experiment && (
                    <div className="mt-3 rounded-xl bg-muted/50 p-3 text-sm">
                      <p className="flex items-center gap-1.5 font-semibold"><FlaskConical className="h-4 w-4 text-[var(--emma-violet)]" aria-hidden="true" />Test first</p>
                      <p className="mt-1">{x.experiment.action}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Measure: {x.experiment.metric} · Expect: {x.experiment.direction} · Review in: {x.experiment.review}</p>
                      {uid && workspace && <button type="button" disabled={added.includes(x.title)} onClick={() => addExperiment(x.title, x.experiment!)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--emma-violet)] disabled:text-emerald-600">{added.includes(x.title) ? <><Check className="h-3.5 w-3.5" aria-hidden="true" />Added to experiments</> : "Add to my experiments"}</button>}
                    </div>
                  )}
                </Card></li>
              ))}</ul>
              <p className="text-xs text-muted-foreground">Change one thing at a time and compare with these numbers. Next: <Link to="/ecommerce/profit" className="underline">check profit</Link>, <Link to="/ecommerce/grow" className="underline">audit your store</Link>, or <Link to="/ecommerce/marketing" className="underline">plan experiments</Link>.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-0.5 break-words font-display text-sm font-bold sm:text-base">{value}</p></div>;
}
