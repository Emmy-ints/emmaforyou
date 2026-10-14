import { useMemo, useState } from "react";
import { Badge, Btn, Field, Panel, Stat, Toast, money, type EngineProps } from "./ui";

interface ScoreCfg { title: string; signals: { key: string; label: string; weight: number; invert?: boolean }[]; rows: { name: string; vals: Record<string, number>; note: string }[]; labels: [string, string, string]; threshold: [number, number] }
const SCORE: Record<string, ScoreCfg> = {
  leads: { title: "Lead", labels: ["Hot", "Warm", "Cold"], threshold: [70, 40], signals: [{ key: "fit", label: "Industry fit", weight: 30 }, { key: "budget", label: "Budget stated", weight: 25 }, { key: "engage", label: "Engagement (opens, visits)", weight: 25 }, { key: "timing", label: "Wants to start soon", weight: 20 }], rows: [
    { name: "Bloom Dental", vals: { fit: 90, budget: 80, engage: 70, timing: 90 }, note: "Visited pricing 3×" }, { name: "Kora Fashion", vals: { fit: 70, budget: 40, engage: 85, timing: 50 }, note: "Opened 4 emails" },
    { name: "Delta Foods", vals: { fit: 40, budget: 20, engage: 30, timing: 20 }, note: "Downloaded a checklist" }, { name: "Northwind", vals: { fit: 85, budget: 90, engage: 40, timing: 60 }, note: "Asked for proposal" }, { name: "Vista Events", vals: { fit: 55, budget: 60, engage: 65, timing: 80 }, note: "Booked webinar" }] },
  health: { title: "Customer", labels: ["Healthy", "Watch", "At risk"], threshold: [70, 45], signals: [{ key: "usage", label: "Usage / visits", weight: 35 }, { key: "support", label: "Support issues", weight: 20, invert: true }, { key: "payment", label: "Payment on time", weight: 25 }, { key: "nps", label: "Satisfaction", weight: 20 }], rows: [
    { name: "FitHub member #204", vals: { usage: 85, support: 10, payment: 100, nps: 80 }, note: "3 visits/week" }, { name: "Acme Ltd (SaaS)", vals: { usage: 30, support: 70, payment: 60, nps: 40 }, note: "Logins down 60%" },
    { name: "Glow Box subscriber", vals: { usage: 60, support: 20, payment: 40, nps: 70 }, note: "Card failed once" }, { name: "Prime Realty", vals: { usage: 75, support: 30, payment: 100, nps: 85 }, note: "Added 2 users" }] },
  segments: { title: "Customer", labels: ["VIP", "Regular", "Lapsed"], threshold: [70, 40], signals: [{ key: "recency", label: "Recency", weight: 35 }, { key: "frequency", label: "Frequency", weight: 35 }, { key: "monetary", label: "Spend", weight: 30 }], rows: [
    { name: "Ada O.", vals: { recency: 95, frequency: 90, monetary: 85 }, note: "12 orders" }, { name: "Leo P.", vals: { recency: 20, frequency: 40, monetary: 50 }, note: "Last order 7 months ago" },
    { name: "Sara K.", vals: { recency: 70, frequency: 50, monetary: 40 }, note: "Buys at sales" }, { name: "Mark T.", vals: { recency: 10, frequency: 15, monetary: 20 }, note: "One order last year" }] },
  fraud: { title: "Order", labels: ["Hold for review", "Check", "Approve"], threshold: [65, 40], signals: [{ key: "mismatch", label: "Billing ≠ shipping country", weight: 30 }, { key: "velocity", label: "Many orders in 1 hour", weight: 30 }, { key: "newacct", label: "New account", weight: 15 }, { key: "value", label: "Unusually high value", weight: 25 }], rows: [
    { name: "#5521 · $1,980", vals: { mismatch: 100, velocity: 80, newacct: 100, value: 90 }, note: "3 cards tried" }, { name: "#5522 · $45", vals: { mismatch: 0, velocity: 0, newacct: 0, value: 10 }, note: "Returning customer" },
    { name: "#5523 · $320", vals: { mismatch: 100, velocity: 0, newacct: 100, value: 40 }, note: "Gift order" }, { name: "#5524 · $89", vals: { mismatch: 0, velocity: 60, newacct: 100, value: 20 }, note: "Promo code used" }] },
};
const LOYAL_TIERS: [string, number][] = [["Bronze", 0], ["Silver", 500], ["Gold", 1500]];

export default function ScoringDemo({ preset, brand }: EngineProps) {
  if (preset === "cro") return <Ice />;
  if (preset === "pricing") return <Pricing />;
  if (preset === "competitors" || preset === "quotes") return <Compare preset={preset} />;
  if (preset === "loyalty") return <Loyalty brand={brand} />;
  return <Score preset={preset} />;
}

function Score({ preset }: { preset: string }) {
  const cfg = SCORE[preset] ?? SCORE.leads;
  const [w, setW] = useState<Record<string, number>>(() => Object.fromEntries(cfg.signals.map((s) => [s.key, s.weight])));
  const [hi, setHi] = useState(cfg.threshold[0]);
  const total = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  const scored = useMemo(() => cfg.rows.map((r) => { const s = cfg.signals.reduce((acc, sg) => acc + (sg.invert ? 100 - r.vals[sg.key] : r.vals[sg.key]) * (w[sg.key] / total), 0); const score = Math.round(preset === "fraud" ? s : s); return { ...r, score }; }).sort((a, b) => b.score - a.score), [cfg, w, total, preset]);
  const label = (s: number) => (s >= hi ? cfg.labels[0] : s >= cfg.threshold[1] ? cfg.labels[1] : cfg.labels[2]);
  const tone = (s: number) => (preset === "fraud" ? (s >= hi ? "bad" : s >= cfg.threshold[1] ? "warn" : "good") : s >= hi ? "good" : s >= cfg.threshold[1] ? "warn" : "bad") as "good" | "warn" | "bad";
  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <Panel title="Scoring rules (adjust)">
        {cfg.signals.map((s) => <label key={s.key} className="mb-3 block text-xs font-medium text-muted-foreground">{s.label}{s.invert ? " (more = worse)" : ""}: weight {w[s.key]}<input type="range" min={0} max={50} value={w[s.key]} onChange={(e) => setW({ ...w, [s.key]: Number(e.target.value) })} className="mt-1 block w-full accent-[var(--demo-accent)]" /></label>)}
        <label className="block text-xs font-medium text-muted-foreground">"{cfg.labels[0]}" threshold: {hi}<input type="range" min={50} max={95} value={hi} onChange={(e) => setHi(Number(e.target.value))} className="mt-1 block w-full accent-[var(--demo-accent)]" /></label>
        <p className="mt-2 text-[11px] text-muted-foreground">Transparent, rule-based scores. Production versions can learn weights from your historical data, and people review the decisions that matter.</p>
      </Panel>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">{cfg.labels.map((l) => <Stat key={l} label={l} value={scored.filter((r) => label(r.score) === l).length} />)}</div>
        <ul className="space-y-2">{scored.map((r) => (
          <li key={r.name} className="rounded-2xl border border-border bg-card p-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">{r.name}<span className="ml-2 text-xs font-normal text-muted-foreground">{r.note}</span></span><span className="flex items-center gap-2"><span className="font-display text-lg font-semibold">{r.score}</span><Badge tone={tone(r.score)}>{label(r.score)}</Badge></span></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-[var(--demo-accent)]" style={{ width: `${r.score}%` }} /></div>
          </li>))}</ul>
      </div>
    </div>
  );
}

function Ice() {
  const [rows, setRows] = useState([
    { idea: "Move WhatsApp button above the fold", impact: 8, confidence: 7, ease: 9 }, { idea: "Shorten contact form from 9 to 4 fields", impact: 7, confidence: 8, ease: 8 },
    { idea: "Add reviews next to the price", impact: 6, confidence: 6, ease: 7 }, { idea: "Redesign the whole homepage", impact: 8, confidence: 4, ease: 2 }, { idea: "Show delivery time on product pages", impact: 6, confidence: 7, ease: 8 },
  ]);
  const ranked = [...rows].map((r) => ({ ...r, ice: Math.round((r.impact * r.confidence * r.ease) / 10) })).sort((a, b) => b.ice - a.ice);
  const funnel = [["Visitors", 10000], ["Viewed product/service", 4200], ["Started enquiry/cart", 900], ["Completed", 210]] as const;
  return (
    <div className="space-y-4">
      <Panel title="Funnel (sample data)"><div className="space-y-1.5">{funnel.map(([l, v], i) => <div key={l} className="flex items-center gap-2 text-sm"><span className="w-44">{l}</span><div className="h-5 flex-1 rounded bg-muted"><div className="h-full rounded bg-[var(--demo-accent)]" style={{ width: `${(v / funnel[0][1]) * 100}%` }} /></div><span className="w-20 text-right">{v.toLocaleString()}{i > 0 && <span className="block text-[10px] text-muted-foreground">{Math.round((v / funnel[i - 1][1]) * 100)}% of prev.</span>}</span></div>)}</div><p className="mt-2 text-xs text-muted-foreground">Biggest drop: started → completed (23%). Tests below target that step first.</p></Panel>
      <Panel title="Test ideas ranked by ICE (Impact × Confidence × Ease)">
        <ul className="space-y-2">{ranked.map((r, i) => (
          <li key={r.idea} className="grid items-center gap-2 rounded-xl border border-border p-2.5 text-sm sm:grid-cols-[24px_1fr_repeat(3,90px)_60px]">
            <span className="font-semibold text-muted-foreground">{i + 1}</span><span className="font-medium">{r.idea}</span>
            {(["impact", "confidence", "ease"] as const).map((k) => <label key={k} className="text-[11px] text-muted-foreground">{k} {r[k]}<input type="range" min={1} max={10} value={r[k]} onChange={(e) => setRows((rs) => rs.map((x) => (x.idea === r.idea ? { ...x, [k]: Number(e.target.value) } : x)))} className="block w-full accent-[var(--demo-accent)]" /></label>)}
            <Badge tone={i === 0 ? "good" : "neutral"}>ICE {r.ice}</Badge>
          </li>))}</ul>
      </Panel>
    </div>
  );
}

function Pricing() {
  const [cost, setCost] = useState(12);
  const [price, setPrice] = useState(25);
  const [elasticity, setElasticity] = useState(1.2);
  const baseUnits = 1000, basePrice = 25;
  const units = (p: number) => Math.max(0, Math.round(baseUnits * Math.pow(p / basePrice, -elasticity)));
  const scen = [price * 0.9, price, price * 1.1, price * 1.2].map((p) => ({ p: Math.round(p * 100) / 100, u: units(p), profit: (p - cost) * units(p) }));
  const best = scen.reduce((a, b) => (b.profit > a.profit ? b : a));
  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <Panel title="Inputs">
        <div className="space-y-2"><Field label="Unit cost ($)" type="number" min={0} value={cost} onChange={(e) => setCost(Math.max(0, Number(e.target.value)))} /><Field label="Current price ($)" type="number" min={0} value={price} onChange={(e) => setPrice(Math.max(0.5, Number(e.target.value)))} />
          <label className="block text-xs font-medium text-muted-foreground">Price sensitivity: {elasticity.toFixed(1)}<input type="range" min={0.3} max={2.5} step={0.1} value={elasticity} onChange={(e) => setElasticity(Number(e.target.value))} className="mt-1 block w-full accent-[var(--demo-accent)]" /></label></div>
        <p className="mt-2 text-[11px] text-muted-foreground">Illustrative model. Production versions estimate sensitivity from your own sales history; a person makes the final price decision.</p>
      </Panel>
      <Panel title="Scenarios (monthly)">
        <table className="w-full text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="p-2">Price</th><th className="p-2">Est. units</th><th className="p-2">Margin</th><th className="p-2">Profit</th></tr></thead>
          <tbody>{scen.map((s) => <tr key={s.p} className={`border-t border-border ${s === best ? "bg-[color-mix(in_srgb,var(--demo-accent)_8%,transparent)]" : ""}`}><td className="p-2 font-medium">{money(s.p)}</td><td className="p-2">{s.u}</td><td className="p-2">{Math.round(((s.p - cost) / s.p) * 100)}%</td><td className="p-2">{money(Math.round(s.profit))} {s === best && <Badge tone="good">Best</Badge>}</td></tr>)}</tbody></table>
      </Panel>
    </div>
  );
}

function Compare({ preset }: { preset: string }) {
  const quotes = preset === "quotes";
  const [rows, setRows] = useState(quotes
    ? [{ name: "Supplier A", price: 4800, days: 7, warranty: "12 months", terms: "30 days" }, { name: "Supplier B", price: 5200, days: 3, warranty: "24 months", terms: "Pay upfront" }, { name: "Supplier C", price: 7900, days: 10, warranty: "6 months", terms: "60 days" }]
    : [{ name: "Your business", price: 49, days: 1, warranty: "WhatsApp + email", terms: "Monthly" }, { name: "Competitor 1", price: 39, days: 3, warranty: "Email only", terms: "Annual only" }, { name: "Competitor 2", price: 79, days: 1, warranty: "Phone + chat", terms: "Monthly" }]);
  const [flag, setFlag] = useState(25);
  const median = [...rows].map((r) => r.price).sort((a, b) => a - b)[Math.floor(rows.length / 2)];
  return (
    <div className="space-y-3">
      {quotes && <label className="block max-w-xs text-xs font-medium text-muted-foreground">Flag quotes more than {flag}% above the median<input type="range" min={5} max={60} value={flag} onChange={(e) => setFlag(Number(e.target.value))} className="mt-1 block w-full accent-[var(--demo-accent)]" /></label>}
      <div className="overflow-x-auto rounded-2xl border border-border"><table className="w-full min-w-[560px] text-left text-sm">
        <thead className="bg-muted/60 text-xs text-muted-foreground"><tr><th className="p-2.5">{quotes ? "Supplier" : "Company"}</th><th className="p-2.5">{quotes ? "Quote ($)" : "Price ($/mo)"}</th><th className="p-2.5">{quotes ? "Delivery (days)" : "Response (days)"}</th><th className="p-2.5">{quotes ? "Warranty" : "Support"}</th><th className="p-2.5">{quotes ? "Payment terms" : "Contract"}</th><th className="p-2.5">Notes</th></tr></thead>
        <tbody>{rows.map((r, i) => { const over = ((r.price - median) / median) * 100; return (
          <tr key={r.name} className="border-t border-border">
            <td className="p-2.5 font-medium">{r.name}</td>
            <td className="p-2.5"><input aria-label={`Price for ${r.name}`} type="number" value={r.price} onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) } : x)))} className="w-24 rounded-md border border-border bg-background px-2 py-1" /></td>
            <td className="p-2.5">{r.days}</td><td className="p-2.5">{r.warranty}</td><td className="p-2.5">{r.terms}</td>
            <td className="p-2.5">{quotes ? (over > flag ? <Badge tone="bad">{Math.round(over)}% above median</Badge> : r.price === Math.min(...rows.map((x) => x.price)) ? <Badge tone="good">Lowest</Badge> : <Badge>Within range</Badge>) : i === 0 ? <Badge tone="accent">You</Badge> : r.price < rows[0].price ? <Badge tone="warn">Cheaper than you</Badge> : <Badge tone="good">You're cheaper</Badge>}</td>
          </tr>); })}</tbody></table></div>
      <p className="text-xs text-muted-foreground">{quotes ? "Summary: Supplier B costs more but delivers fastest with the longest warranty; Supplier C is flagged for unusual pricing." : "Gap spotted: you're the only one with WhatsApp support on a monthly contract. Lead with that in your ads."} Sample data.</p>
    </div>
  );
}

function Loyalty({ brand }: { brand: string }) {
  const [points, setPoints] = useState(420);
  const [ledger, setLedger] = useState<string[]>(["+120 · Order #1031", "+300 · Order #0998"]);
  const [code] = useState(`${brand.replace(/\W/g, "").slice(0, 5).toUpperCase() || "SHOP"}-ADA10`);
  const [msg, setMsg] = useState("");
  const tier = [...LOYAL_TIERS].reverse().find(([, min]) => points >= min)![0];
  const next = LOYAL_TIERS.find(([, min]) => min > points);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title={`${brand} rewards`}>
        <div className="grid grid-cols-2 gap-3"><Stat label="Points" value={points} /><Stat label="Tier" value={tier} hint={next ? `${next[1] - points} to ${next[0]}` : "Top tier"} /></div>
        <div className="mt-3 flex flex-wrap gap-2"><Btn onClick={() => { setPoints((p) => p + 150); setLedger((l) => [`+150 · Order #${1040 + l.length}`, ...l]); }}>Simulate a $150 purchase</Btn><Btn variant="ghost" disabled={points < 200} onClick={() => { setPoints((p) => p - 200); setLedger((l) => ["−200 · Redeemed: $10 voucher", ...l]); setMsg("Voucher issued: SAVE10-7KD2 (single use)"); }}>Redeem 200 pts → $10</Btn></div>
        {msg && <div className="mt-2"><Toast>{msg}</Toast></div>}
      </Panel>
      <Panel title="Referral">
        <p className="text-sm">Your code: <code className="rounded bg-muted px-1.5 py-0.5">{code}</code></p>
        <p className="mt-1 text-xs text-muted-foreground">Friends get 10% off; you get 250 points when they complete a first order. Self-referrals and duplicate accounts are blocked.</p>
        <Btn variant="soft" className="mt-2" onClick={() => { setPoints((p) => p + 250); setLedger((l) => ["+250 · Referral: Tolu joined", ...l]); }}>Simulate a friend's first order</Btn>
        <p className="mt-3 text-xs font-semibold">Ledger</p><ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">{ledger.map((l, i) => <li key={i}>{l}</li>)}</ul>
      </Panel>
    </div>
  );
}
