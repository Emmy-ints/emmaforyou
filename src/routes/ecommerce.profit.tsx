import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Upload, AlertTriangle } from "lucide-react";
import { pageHead } from "@/lib/seo";
import { calculateProfit, emptyProfit, money, percent, type ProfitInput } from "@/lib/ecom/profit";
import { summariseOrders } from "@/lib/ecom/csv";
import { listItems, type Item } from "@/lib/ecom/workspace";
import { Card, ErrorBox, EvidenceBadge, NumberField, PageIntro, SaveToWorkspace, useWorkspace } from "@/components/ecom/ui";

export const Route = createFileRoute("/ecommerce/profit")({
  head: () => pageHead({ title: "Ecommerce Profit Calculator — Margin, Break-even & CAC | EmmaForYou", description: "Work out gross, contribution and net profit, break-even orders, CAC and ROAS for your store, with every formula shown.", path: "/ecommerce/profit" }),
  component: Profit,
});

type NumKey = { [K in keyof ProfitInput]: ProfitInput[K] extends number | null | undefined ? K : never }[keyof ProfitInput];
const GROUPS: { title: string; fields: [NumKey, string, string?, string?][] }[] = [
  { title: "Sales", fields: [["orders", "Orders"], ["averageOrderValue", "Average order value", "Excluding tax/VAT"], ["revenueOverride", "Or total revenue", "Overrides orders × AOV"], ["discounts", "Discounts given"], ["refunds", "Refunds"]] },
  { title: "Cost per order", fields: [["productCostPerOrder", "Product cost", "What you pay the supplier"], ["packagingPerOrder", "Packaging"], ["shippingPerOrder", "Shipping & fulfilment", "What you pay, not what you charge"], ["dutiesPerOrder", "Duties & import costs"]] },
  { title: "Fees", fields: [["paymentFeePct", "Payment fee", undefined, "%"], ["paymentFeeFixed", "Payment fee per order"], ["platformFeePct", "Marketplace / platform commission", undefined, "%"], ["platformFixedMonthly", "Platform subscription", "For this period"]] },
  { title: "Marketing & overheads", fields: [["advertising", "Advertising spend"], ["attributedRevenue", "Revenue attributed to ads", "Optional, for ROAS"], ["newCustomers", "New customers", "Optional, for CAC"], ["fixedCosts", "Fixed costs", "Staff, rent, software"], ["otherCosts", "Other costs"]] },
];
const CURRENCIES = ["USD", "NGN", "GBP", "EUR", "KES", "GHS", "ZAR", "CAD", "AUD", "INR", "AED"];

function Profit() {
  const { workspace } = useWorkspace();
  const [p, setP] = useState<ProfitInput>(emptyProfit());
  const [saved, setSaved] = useState<Item | null>(null);
  const [csvNote, setCsvNote] = useState("");
  const [csvError, setCsvError] = useState("");
  useEffect(() => {
    if (!workspace) return;
    listItems<{ input: ProfitInput }>(workspace.id, "profit").then((rows) => { if (rows[0]?.data?.input) { setP({ ...emptyProfit(), ...rows[0].data.input }); setSaved(rows[0]); } }).catch(() => undefined);
  }, [workspace]);
  const r = useMemo(() => calculateProfit(p), [p]);
  const set = (k: NumKey, v: number | null) => setP((x) => ({ ...x, [k]: k === "revenueOverride" || k === "attributedRevenue" || k === "newCustomers" ? v : v ?? 0 }));
  const m = (v: number | null | undefined) => money(v === 0 ? 0 : v, p.currency); // avoid "-0"

  async function onFile(file?: File) {
    if (!file) return;
    setCsvError(""); setCsvNote("");
    try {
      const s = summariseOrders(await file.text());
      setP((x) => ({ ...x, orders: s.orders, revenueOverride: Math.round(s.revenue * 100) / 100, discounts: Math.round(s.discounts * 100) / 100, refunds: Math.round(s.refunds * 100) / 100, currency: s.currency && CURRENCIES.includes(s.currency) ? s.currency : x.currency, periodLabel: s.from ? `${s.from} to ${s.to}` : x.periodLabel }));
      setCsvNote(`Filled from ${s.source} (${s.orders} orders). Add your costs below.${s.warnings.length ? " " + s.warnings.join(" ") : ""}`);
    } catch (e) { setCsvError(e instanceof Error ? e.message : "Couldn't read that file."); }
  }

  const rows: [string, number | null, string][] = [
    ["Gross revenue", r.grossRevenue, "Orders × average order value (or the revenue you entered)"],
    ["Net revenue", r.netRevenue, "Gross revenue − discounts − refunds"],
    ["Cost of goods", -r.cogs, "Orders × (product cost + packaging)"],
    ["Gross profit", r.grossProfit, "Net revenue − cost of goods"],
    ["Payment fees", -r.paymentFees, "Net revenue × payment % + orders × fixed fee"],
    ["Platform fees", -r.platformFees, "Net revenue × commission %"],
    ["Shipping & fulfilment", -r.shipping, "Orders × shipping per order"],
    ["Duties", -r.duties, "Orders × duties per order"],
    ["Advertising", -(p.advertising || 0), "As entered"],
    ["Contribution profit", r.contributionProfit, "Gross profit − variable costs − advertising"],
    ["Fixed & other costs", -r.fixedTotal, "Fixed costs + subscription + other"],
    ["Net profit (estimate)", r.netProfit, "Contribution profit − fixed and other costs"],
  ];

  return (
    <div>
      <PageIntro eyebrow="Profitability" title="Profit analyzer">Enter one period's numbers. Everything below is calculated from your inputs only, and each line shows its formula. Sales tax/VAT you collect for the government should be left out of revenue.</PageIntro>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <Card title="Period">
            <div className="grid gap-3 sm:grid-cols-3">
              <div><label htmlFor="pf-period" className="text-sm font-medium">Label</label><input id="pf-period" className="input mt-1" value={p.periodLabel} maxLength={60} onChange={(e) => setP((x) => ({ ...x, periodLabel: e.target.value }))} /></div>
              <div><label htmlFor="pf-cur" className="text-sm font-medium">Currency</label><select id="pf-cur" className="input mt-1" value={p.currency} onChange={(e) => setP((x) => ({ ...x, currency: e.target.value }))}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></div>
              <label className="flex cursor-pointer items-end"><span className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-3 text-sm font-medium hover:bg-muted/50"><Upload className="h-4 w-4" aria-hidden="true" />Import orders CSV</span><input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} /></label>
            </div>
            {csvNote && <p className="mt-2 text-xs text-muted-foreground">{csvNote}</p>}
            {csvError && <div className="mt-2"><ErrorBox message={csvError} /></div>}
          </Card>
          {GROUPS.map((g) => (
            <Card key={g.title} title={g.title}>
              <div className="grid gap-3 sm:grid-cols-2">{g.fields.map(([k, label, hint, suffix]) => <NumberField key={k} id={`pf-${k}`} label={label} hint={hint} suffix={suffix ?? (suffix === undefined && !String(k).endsWith("Pct") && k !== "orders" && k !== "newCustomers" ? p.currency : undefined)} value={p[k] as number | null} onChange={(v) => set(k, v)} />)}</div>
            </Card>
          ))}
        </div>

        <div className="space-y-4 lg:sticky lg:top-[140px] lg:self-start">
          <Card title={<span className="flex items-center gap-2">Results <EvidenceBadge kind="user" /></span>} actions={<SaveToWorkspace kind="profit" title={`Profit: ${p.periodLabel}`} data={{ input: p, result: r }} savedId={saved?.id} onSaved={setSaved} />}>
            <div className="grid grid-cols-2 gap-2">
              <Big label="Net profit" value={m(r.netProfit)} tone={r.netProfit < -0.004 ? "bad" : "good"} />
              <Big label="Net margin" value={percent(r.netMargin)} tone={r.netMargin != null && r.netMargin < 0 ? "bad" : "good"} />
              <Big label="Contribution per order" value={m(r.contributionPerOrder)} tone={r.contributionPerOrder != null && r.contributionPerOrder <= 0 ? "bad" : "good"} />
              <Big label="Break-even orders" value={r.breakEvenOrders != null ? r.breakEvenOrders.toLocaleString() : "—"} />
              <Big label="Gross margin" value={percent(r.grossMargin)} />
              <Big label="Contribution margin" value={percent(r.contributionMargin)} />
              <Big label="CAC" value={m(r.cac)} />
              <Big label="ROAS" value={r.roas != null ? `${r.roas.toFixed(2)}×` : "—"} />
            </div>
            {r.breakEvenRevenue != null && <p className="mt-2 text-xs text-muted-foreground">Break-even revenue ≈ {m(r.breakEvenRevenue)} this period (break-even orders × net revenue per order).</p>}
          </Card>
          {(r.missing.length > 0 || r.warnings.length > 0) && (
            <Card>
              {r.missing.length > 0 && <p className="text-sm"><span className="font-semibold">Still needed:</span> {r.missing.join(", ")}.</p>}
              <ul className="mt-1 space-y-1.5">{r.warnings.map((w) => <li key={w} className="flex gap-2 text-sm text-amber-800 dark:text-amber-300"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{w}</li>)}</ul>
            </Card>
          )}
          <Card title="Profit and loss">
            <table className="w-full text-sm">
              <caption className="sr-only">Profit and loss for {p.periodLabel}</caption>
              <tbody>{rows.map(([label, v, formula]) => {
                const total = /profit$|Net profit|Net revenue/.test(label);
                return <tr key={label} className={`border-b border-border/60 last:border-0 ${total ? "font-semibold" : ""}`}><th scope="row" className="py-1.5 pr-2 text-left font-[inherit]">{label}<span className="block text-[11px] font-normal text-muted-foreground">{formula}</span></th><td className={`py-1.5 text-right tabular-nums ${v != null && v < -0.004 ? "text-red-600 dark:text-red-400" : ""}`}>{m(v)}</td></tr>;
              })}</tbody>
            </table>
          </Card>
          <p className="text-xs text-muted-foreground">Want to check one product before you stock it? Use <Link to="/ecommerce/research" className="underline">product research</Link>. To find why orders are low, try the <Link to="/ecommerce/diagnose" className="underline">sales diagnosis</Link>.</p>
        </div>
      </div>
    </div>
  );
}

function Big({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return <div className="rounded-xl border border-border p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className={`mt-0.5 truncate font-display text-lg font-bold tabular-nums ${tone === "bad" ? "text-red-600 dark:text-red-400" : ""}`}>{value}</p></div>;
}
