import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Badge, Btn, Panel, Select, Stat, hash, money, type EngineProps } from "./ui";

interface Metric { key: string; label: string; base: number; growth: number; fmt: "money" | "num" | "pct" | "unit"; unit?: string; goodUp: boolean }
const P: Record<string, { segments: string[]; segLabel: string; metrics: Metric[]; table: { cols: string[]; rows: (string | number)[][] }; cur: string }> = {
  erp: { cur: "USD", segLabel: "Branch", segments: ["All branches", "Lagos", "Abuja", "Accra"], metrics: [
    { key: "rev", label: "Revenue", base: 4200, growth: 0.012, fmt: "money", goodUp: true }, { key: "exp", label: "Expenses", base: 2600, growth: 0.006, fmt: "money", goodUp: false },
    { key: "orders", label: "Orders", base: 85, growth: 0.01, fmt: "num", goodUp: true }, { key: "stock", label: "Stock turns", base: 4.2, growth: 0.002, fmt: "unit", unit: "×", goodUp: true }],
    table: { cols: ["Approval", "Requested by", "Amount", "Status"], rows: [["Laptop purchase", "IT", "$1,450", "Awaiting finance"], ["Supplier invoice #882", "Ops", "$6,200", "Approved"], ["Marketing budget Q4", "Marketing", "$3,000", "Awaiting CEO"]] } },
  report: { cur: "USD", segLabel: "Channel", segments: ["All channels", "Website", "WhatsApp", "Instagram"], metrics: [
    { key: "leads", label: "Leads", base: 22, growth: 0.015, fmt: "num", goodUp: true }, { key: "conv", label: "Lead → customer", base: 18, growth: 0.004, fmt: "pct", goodUp: true },
    { key: "rev", label: "Revenue", base: 2900, growth: 0.01, fmt: "money", goodUp: true }, { key: "reply", label: "Avg. reply time", base: 46, growth: -0.01, fmt: "unit", unit: " min", goodUp: false }],
    table: { cols: ["Campaign", "Leads", "Cost per lead", "Customers"], rows: [["Google Search", 64, "$8.20", 14], ["Meta — retargeting", 41, "$5.90", 9], ["Instagram organic", 33, "$0", 5]] } },
  finance: { cur: "USD", segLabel: "Account", segments: ["All accounts", "Operating", "Savings"], metrics: [
    { key: "in", label: "Money in", base: 3100, growth: 0.008, fmt: "money", goodUp: true }, { key: "out", label: "Money out", base: 2400, growth: 0.007, fmt: "money", goodUp: false },
    { key: "cash", label: "Cash balance", base: 18000, growth: 0.004, fmt: "money", goodUp: true }, { key: "budget", label: "Budget used", base: 64, growth: 0.006, fmt: "pct", goodUp: false }],
    table: { cols: ["Category", "This period", "Budget", "Status"], rows: [["Payroll", "$9,800", "$10,000", "On budget"], ["Marketing", "$2,450", "$2,000", "Over"], ["Software", "$640", "$800", "Under"]] } },
  iot: { cur: "USD", segLabel: "Device", segments: ["All devices", "Cold room 1", "Cold room 2", "Generator"], metrics: [
    { key: "temp", label: "Avg temperature", base: 3.8, growth: 0.001, fmt: "unit", unit: "°C", goodUp: false }, { key: "hum", label: "Humidity", base: 61, growth: 0.0, fmt: "pct", goodUp: false },
    { key: "up", label: "Uptime", base: 99.2, growth: 0.0, fmt: "pct", goodUp: true }, { key: "alerts", label: "Alerts", base: 1, growth: 0.0, fmt: "num", goodUp: false }],
    table: { cols: ["Device", "Last reading", "Battery", "Status"], rows: [["Cold room 1", "3.6°C", "88%", "OK"], ["Cold room 2", "6.9°C", "72%", "Above 6°C"], ["Generator", "Fuel 41%", "—", "OK"]] } },
  farm: { cur: "USD", segLabel: "Field", segments: ["All fields", "North plot", "River plot"], metrics: [
    { key: "rain", label: "Rainfall", base: 6, growth: 0.0, fmt: "unit", unit: " mm", goodUp: true }, { key: "moist", label: "Soil moisture", base: 32, growth: -0.003, fmt: "pct", goodUp: true },
    { key: "yield", label: "Yield forecast", base: 4.1, growth: 0.002, fmt: "unit", unit: " t/ha", goodUp: true }, { key: "inputs", label: "Input spend", base: 210, growth: 0.004, fmt: "money", goodUp: false }],
    table: { cols: ["Task", "Field", "Due", "Status"], rows: [["Fertiliser (NPK)", "North plot", "Tomorrow", "Planned"], ["Irrigation check", "River plot", "Today", "Overdue"], ["Harvest maize", "North plot", "In 3 weeks", "Planned"]] } },
};
const RANGES = [["7", "7 days"], ["30", "30 days"], ["90", "90 days"]] as [string, string][];

export default function DashboardDemo({ preset, brand }: EngineProps) {
  const cfg = P[preset] ?? P.erp;
  const [range, setRange] = useState("30");
  const [seg, setSeg] = useState(cfg.segments[0]);
  const [metric, setMetric] = useState(cfg.metrics[0].key);
  const [readings, setReadings] = useState(0);
  const days = Number(range);
  const segMult = seg === cfg.segments[0] ? 1 : 0.3 + hash(seg) * 0.5;

  const series = useMemo(() => {
    const out: Record<string, number[]> = {};
    for (const m of cfg.metrics) out[m.key] = Array.from({ length: days }, (_, i) => { const noise = (hash(`${preset}${m.key}${seg}${i}${readings}`) - 0.5) * 0.25; const v = m.base * (1 + m.growth * i) * (1 + noise); return m.fmt === "pct" || m.fmt === "unit" ? v : v * segMult; });
    return out;
  }, [cfg, days, seg, preset, segMult, readings]);

  const agg = (m: Metric, arr: number[]) => (m.fmt === "money" || m.fmt === "num" ? arr.reduce((s, v) => s + v, 0) : arr.reduce((s, v) => s + v, 0) / arr.length);
  const fmt = (m: Metric, v: number) => (m.fmt === "money" ? money(Math.round(v), cfg.cur) : m.fmt === "pct" ? `${v.toFixed(1)}%` : m.fmt === "unit" ? `${v.toFixed(1)}${m.unit}` : Math.round(v).toLocaleString());
  const delta = (m: Metric) => { const a = series[m.key]; const half = Math.floor(a.length / 2); const first = agg(m, a.slice(0, half)); const second = agg(m, a.slice(half)); return first ? ((second - first) / Math.abs(first)) * 100 : 0; };

  const active = cfg.metrics.find((m) => m.key === metric)!;
  const data = series[active.key];
  const max = Math.max(...data) * 1.1, min = Math.min(...data) * 0.9;
  const W = 640, H = 180;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * W, H - ((v - min) / (max - min || 1)) * H] as const);
  const path = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  const summary = cfg.metrics.map((m) => { const d = delta(m); const good = m.goodUp ? d >= 0 : d <= 0; return `${m.label} ${d >= 0 ? "rose" : "fell"} ${Math.abs(d).toFixed(0)}% (${good ? "good" : "watch this"})`; });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Select label={cfg.segLabel} value={seg} onChange={(e) => setSeg(e.target.value)} options={cfg.segments} className="w-44" />
        <div className="flex rounded-full border border-border p-0.5 text-xs font-semibold" role="group" aria-label="Date range">{RANGES.map(([v, l]) => <button key={v} type="button" aria-pressed={range === v} onClick={() => setRange(v)} className={`rounded-full px-3 py-1 ${range === v ? "bg-[var(--demo-accent)] text-white" : "text-muted-foreground"}`}>{l}</button>)}</div>
        {preset === "iot" && <Btn variant="ghost" onClick={() => setReadings((r) => r + 1)}><RefreshCw className="h-4 w-4" />Request new reading</Btn>}
        <span className="ml-auto text-[11px] text-muted-foreground">Sample data · not live</span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cfg.metrics.map((m) => { const d = delta(m); const good = m.goodUp ? d >= 0 : d <= 0; return (
          <button key={m.key} type="button" onClick={() => setMetric(m.key)} aria-pressed={metric === m.key} className={`rounded-xl border p-3 text-left ${metric === m.key ? "border-[var(--demo-accent)]" : "border-border"} bg-background`}>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{m.label}</p>
            <p className="mt-1 font-display text-xl font-semibold">{fmt(m, agg(m, series[m.key]))}</p>
            <Badge tone={good ? "good" : "bad"}>{d >= 0 ? "▲" : "▼"} {Math.abs(d).toFixed(1)}%</Badge>
          </button>); })}
      </div>
      <Panel title={`${active.label} · last ${range} days · ${seg}`}>
        <svg viewBox={`0 0 ${W} ${H + 20}`} className="h-48 w-full" role="img" aria-label={`${active.label} trend chart`}>
          {[0, 0.5, 1].map((t) => <line key={t} x1={0} x2={W} y1={H * t} y2={H * t} stroke="currentColor" className="text-border" strokeDasharray="4 4" />)}
          <path d={`${path} L${W},${H} L0,${H} Z`} fill="var(--demo-accent)" opacity={0.1} />
          <path d={path} fill="none" stroke="var(--demo-accent)" strokeWidth={2.5} strokeLinejoin="round" />
          {pts.length <= 31 && pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2.5} fill="var(--demo-accent)" />)}
          <text x={0} y={H + 16} className="fill-muted-foreground text-[11px]">{range} days ago</text><text x={W} y={H + 16} textAnchor="end" className="fill-muted-foreground text-[11px]">Today</text>
        </svg>
      </Panel>
      {preset === "report" && <Panel title={`Plain-English summary for ${brand}`}><ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">{summary.map((s) => <li key={s}>{s}.</li>)}<li>Suggested focus: {cfg.metrics.map((m) => ({ m, d: delta(m) })).sort((a, b) => (a.m.goodUp ? a.d : -a.d) - (b.m.goodUp ? b.d : -b.d))[0].m.label.toLowerCase()}.</li></ul><p className="mt-2 text-[11px] text-muted-foreground">Generated from the numbers above; production versions write this with AI and send it by email or WhatsApp every Monday.</p></Panel>}
      <Panel title="Details">
        <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr>{cfg.table.cols.map((c) => <th key={c} className="p-2">{c}</th>)}</tr></thead>
          <tbody>{cfg.table.rows.map((r, i) => <tr key={i} className="border-t border-border">{r.map((c, j) => <td key={j} className="p-2">{j === r.length - 1 && typeof c === "string" ? <Badge tone={/ok|approved|on budget|under|planned/i.test(c) ? "good" : /over|overdue|above/i.test(c) ? "bad" : "warn"}>{c}</Badge> : c}</td>)}</tr>)}</tbody></table></div>
      </Panel>
      {preset === "erp" && <div className="grid grid-cols-2 gap-3 md:grid-cols-3"><Stat label="Profit (period)" value={money(Math.round(agg(cfg.metrics[0], series.rev) - agg(cfg.metrics[1], series.exp)), cfg.cur)} /><Stat label="Pending approvals" value={2} /><Stat label="Audit log entries" value={148 + readings} hint="Every change recorded" /></div>}
    </div>
  );
}
