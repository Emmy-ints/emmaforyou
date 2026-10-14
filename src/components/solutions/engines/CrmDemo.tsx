import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { Badge, Btn, Field, Panel, Select, Stat, daysFromNow, fmtDate, money, uid, type EngineProps } from "./ui";

interface Deal { id: string; name: string; company: string; value: number; stage: number; owner: string; score: number; next: number; notes: string[] }

const PRESETS: Record<string, { stages: string[]; probs: number[]; owners: string[]; label: string; valueLabel: string; deals: Omit<Deal, "id" | "notes">[] }> = {
  sales: {
    stages: ["New lead", "Qualified", "Proposal sent", "Negotiation", "Won"], probs: [0.1, 0.3, 0.5, 0.75, 1], owners: ["Ada", "Tunde", "Chloe"], label: "Deal", valueLabel: "Deal value",
    deals: [
      { name: "Website + AI chat", company: "Bloom Dental", value: 4200, stage: 0, owner: "Ada", score: 72, next: 1 },
      { name: "Annual retainer", company: "Northwind Logistics", value: 18000, stage: 2, owner: "Tunde", score: 85, next: 0 },
      { name: "Store rebuild", company: "Kora Fashion", value: 6500, stage: 1, owner: "Chloe", score: 64, next: 2 },
      { name: "CRM setup", company: "Prime Realty", value: 3200, stage: 3, owner: "Ada", score: 90, next: -1 },
      { name: "Ads management", company: "Sunrise Bakery", value: 2400, stage: 0, owner: "Tunde", score: 41, next: 3 },
      { name: "Booking app", company: "FitHub Studio", value: 9800, stage: 4, owner: "Chloe", score: 95, next: 5 },
    ],
  },
  partners: {
    stages: ["Referral received", "Contacted", "In discussion", "Signed", "Commission paid"], probs: [0.1, 0.25, 0.5, 1, 1], owners: ["Partner: Lumen Agency", "Partner: K. Mensah", "Partner: BrightOps"], label: "Referral", valueLabel: "Commission",
    deals: [
      { name: "Clinic website", company: "Harbour Health", value: 450, stage: 0, owner: "Partner: Lumen Agency", score: 70, next: 1 },
      { name: "Store + ads", company: "Urban Kicks", value: 900, stage: 2, owner: "Partner: K. Mensah", score: 78, next: 2 },
      { name: "CRM automation", company: "Apex Insurance", value: 600, stage: 3, owner: "Partner: BrightOps", score: 88, next: 6 },
      { name: "Landing pages", company: "Vista Events", value: 300, stage: 1, owner: "Partner: Lumen Agency", score: 55, next: 0 },
    ],
  },
  donors: {
    stages: ["Prospect", "Engaged", "Ask made", "Pledged", "Received"], probs: [0.05, 0.2, 0.5, 0.9, 1], owners: ["Grace", "Samuel"], label: "Gift", valueLabel: "Gift amount",
    deals: [
      { name: "Annual gift", company: "The Okoye Family", value: 5000, stage: 2, owner: "Grace", score: 80, next: 1 },
      { name: "Monthly giving", company: "J. Adeyemi", value: 1200, stage: 4, owner: "Samuel", score: 92, next: 30 },
      { name: "Corporate sponsor", company: "Delta Foods Ltd", value: 15000, stage: 1, owner: "Grace", score: 66, next: 4 },
      { name: "Event table", company: "M. Bello", value: 800, stage: 0, owner: "Samuel", score: 45, next: 2 },
    ],
  },
};

export default function CrmDemo({ preset }: EngineProps) {
  const cfg = PRESETS[preset] ?? PRESETS.sales;
  const [deals, setDeals] = useState<Deal[]>(() => cfg.deals.map((d) => ({ ...d, id: uid(), notes: [] })));
  const [q, setQ] = useState("");
  const [owner, setOwner] = useState("All");
  const [minScore, setMinScore] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", company: "", value: "" });
  const [note, setNote] = useState("");

  const shown = useMemo(() => deals.filter((d) => (owner === "All" || d.owner === owner) && d.score >= minScore && `${d.name} ${d.company}`.toLowerCase().includes(q.toLowerCase())), [deals, owner, minScore, q]);
  const pipeline = deals.filter((d) => d.stage < cfg.stages.length - 1).reduce((s, d) => s + d.value, 0);
  const weighted = deals.reduce((s, d) => s + d.value * cfg.probs[d.stage], 0);
  const won = deals.filter((d) => d.stage === cfg.stages.length - 1).reduce((s, d) => s + d.value, 0);
  const overdue = deals.filter((d) => d.next < 0 && d.stage < cfg.stages.length - 1).length;

  const move = (id: string, dir: number) => setDeals((ds) => ds.map((d) => (d.id === id ? { ...d, stage: Math.min(cfg.stages.length - 1, Math.max(0, d.stage + dir)), notes: [...d.notes, `Moved to "${cfg.stages[Math.min(cfg.stages.length - 1, Math.max(0, d.stage + dir))]}"`] } : d)));
  const add = () => {
    if (!form.name.trim() || !form.company.trim()) return;
    setDeals((ds) => [{ id: uid(), name: form.name.trim(), company: form.company.trim(), value: Math.max(0, Number(form.value) || 0), stage: 0, owner: cfg.owners[0], score: 50, next: 1, notes: ["Created from the demo form"] }, ...ds]);
    setForm({ name: "", company: "", value: "" });
  };
  const current = deals.find((d) => d.id === open);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Open pipeline" value={money(pipeline)} />
        <Stat label="Weighted forecast" value={money(Math.round(weighted))} hint="Value × stage probability" />
        <Stat label={cfg.stages[cfg.stages.length - 1]} value={money(won)} />
        <Stat label="Overdue follow-ups" value={overdue} hint={overdue ? "Needs attention" : "All on track"} />
      </div>

      <Panel title={`Add a ${cfg.label.toLowerCase()}`}>
        <form onSubmit={(e) => { e.preventDefault(); add(); }} className="grid gap-2 sm:grid-cols-[1fr_1fr_140px_auto] sm:items-end">
          <Field label={`${cfg.label} name`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. New website" maxLength={60} />
          <Field label="Company / person" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="e.g. Acme Ltd" maxLength={60} />
          <Field label={cfg.valueLabel} type="number" min={0} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="1000" />
          <Btn type="submit" disabled={!form.name.trim() || !form.company.trim()}><Plus className="h-4 w-4" />Add</Btn>
        </form>
      </Panel>

      <div className="flex flex-wrap items-end gap-3">
        <label className="relative block min-w-[180px] flex-1 text-xs font-medium text-muted-foreground">Search
          <Search className="pointer-events-none absolute left-2.5 top-[30px] h-4 w-4" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="mt-1 block w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-2.5 text-sm text-foreground outline-none focus:border-[var(--demo-accent)]" placeholder="Name or company" />
        </label>
        <Select label="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} options={["All", ...cfg.owners]} className="w-48" />
        <label className="block w-44 text-xs font-medium text-muted-foreground">Min. lead score: {minScore}
          <input type="range" min={0} max={100} step={5} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="mt-2 block w-full accent-[var(--demo-accent)]" />
        </label>
      </div>

      <div className="grid gap-3 overflow-x-auto pb-1 md:grid-cols-5" role="list" aria-label="Pipeline">
        {cfg.stages.map((stage, si) => {
          const col = shown.filter((d) => d.stage === si);
          return (
            <div key={stage} role="listitem" className="min-w-[200px] rounded-2xl bg-muted/60 p-2.5">
              <div className="mb-2 flex items-center justify-between px-1"><p className="text-xs font-semibold text-foreground">{stage}</p><span className="text-[11px] text-muted-foreground">{col.length} · {money(col.reduce((s, d) => s + d.value, 0))}</span></div>
              <div className="space-y-2">
                {col.map((d) => (
                  <article key={d.id} className={`rounded-xl border bg-card p-2.5 text-sm shadow-sm ${open === d.id ? "border-[var(--demo-accent)]" : "border-border"}`}>
                    <button type="button" onClick={() => setOpen(open === d.id ? null : d.id)} className="block w-full text-left">
                      <p className="font-semibold text-foreground">{d.company}</p>
                      <p className="text-xs text-muted-foreground">{d.name}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1"><Badge tone="accent">{money(d.value)}</Badge><Badge tone={d.score >= 75 ? "good" : d.score >= 50 ? "warn" : "neutral"}>Score {d.score}</Badge></div>
                      <p className={`mt-1 text-[11px] ${d.next < 0 && si < cfg.stages.length - 1 ? "font-semibold text-red-600" : "text-muted-foreground"}`}>Next: {fmtDate(daysFromNow(d.next))}{d.next < 0 && si < cfg.stages.length - 1 ? " (overdue)" : ""}</p>
                    </button>
                    <div className="mt-2 flex justify-between">
                      <button type="button" aria-label={`Move ${d.company} back`} disabled={si === 0} onClick={() => move(d.id, -1)} className="rounded-full p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
                      <span className="self-center text-[11px] text-muted-foreground">{d.owner.replace("Partner: ", "")}</span>
                      <button type="button" aria-label={`Move ${d.company} forward`} disabled={si === cfg.stages.length - 1} onClick={() => move(d.id, 1)} className="rounded-full p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
                    </div>
                  </article>
                ))}
                {col.length === 0 && <p className="px-1 py-3 text-center text-[11px] text-muted-foreground">Nothing here</p>}
              </div>
            </div>
          );
        })}
      </div>

      {current && (
        <Panel title={`${current.company} · ${current.name}`} actions={<Btn variant="ghost" onClick={() => setOpen(null)}>Close</Btn>}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Select label="Owner" value={current.owner} onChange={(e) => setDeals((ds) => ds.map((d) => (d.id === current.id ? { ...d, owner: e.target.value } : d)))} options={cfg.owners} />
            <Select label="Stage" value={String(current.stage)} onChange={(e) => setDeals((ds) => ds.map((d) => (d.id === current.id ? { ...d, stage: Number(e.target.value) } : d)))} options={cfg.stages.map((s, i) => [String(i), s] as [string, string])} />
            <Select label="Next follow-up" value={String(current.next)} onChange={(e) => setDeals((ds) => ds.map((d) => (d.id === current.id ? { ...d, next: Number(e.target.value) } : d)))} options={[["-1", "Yesterday"], ["0", "Today"], ["1", "Tomorrow"], ["3", "In 3 days"], ["7", "Next week"]]} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (!note.trim()) return; setDeals((ds) => ds.map((d) => (d.id === current.id ? { ...d, notes: [...d.notes, note.trim()] } : d))); setNote(""); }} className="mt-3 flex gap-2">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Log a call, WhatsApp or meeting note…" maxLength={200} className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-[var(--demo-accent)]" aria-label="Activity note" />
            <Btn type="submit">Log</Btn>
          </form>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">{current.notes.length ? current.notes.slice().reverse().map((n, i) => <li key={i}>• {n}</li>) : <li>No activity yet.</li>}</ul>
        </Panel>
      )}
    </div>
  );
}
