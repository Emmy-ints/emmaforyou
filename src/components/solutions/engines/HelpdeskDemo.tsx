import { useMemo, useState } from "react";
import { Clock, MessageCircle, Search, Send, Star } from "lucide-react";
import { Badge, Btn, Panel, Select, Stat, Toast, uid, type EngineProps } from "./ui";

type Pri = "Urgent" | "High" | "Normal" | "Low";
interface Ticket { id: string; subject: string; from: string; channel: string; pri: Pri; status: "Open" | "Pending" | "Solved"; agent: string; ageMin: number; thread: { by: string; text: string }[]; csat?: number }
const SLA: Record<Pri, number> = { Urgent: 60, High: 240, Normal: 480, Low: 1440 };
const CANNED = [["Order status", "Thanks for your patience! Your order is on its way — here's your tracking link: {link}."], ["Refund policy", "You can return unused items within 14 days for a full refund. I've started the return for you."], ["Escalate", "I've passed this to our specialist team who'll reply within 2 hours."]];

const TICKETS: Omit<Ticket, "id">[] = [
  { subject: "Where is my order #1042?", from: "Ada O.", channel: "WhatsApp", pri: "High", status: "Open", agent: "Unassigned", ageMin: 190, thread: [{ by: "Ada O.", text: "I ordered 5 days ago and haven't received anything." }] },
  { subject: "Charged twice", from: "Mark T.", channel: "Email", pri: "Urgent", status: "Open", agent: "Chloe", ageMin: 75, thread: [{ by: "Mark T.", text: "I see two charges on my card for the same order." }] },
  { subject: "Change delivery address", from: "Ngozi E.", channel: "Instagram", pri: "Normal", status: "Pending", agent: "Tunde", ageMin: 30, thread: [{ by: "Ngozi E.", text: "Can you deliver to my office instead?" }, { by: "Tunde", text: "Sure — what's the new address?" }] },
  { subject: "Size exchange", from: "Leo P.", channel: "Web chat", pri: "Low", status: "Open", agent: "Unassigned", ageMin: 900, thread: [{ by: "Leo P.", text: "Can I swap a size M for L?" }] },
];

const REVIEWS = [
  { who: "Ifeoma", rating: 5, text: "Lovely staff and quick service. The new booking system is so easy.", place: "Lekki" },
  { who: "Daniel", rating: 2, text: "Waited 40 minutes past my appointment time. Nobody explained the delay.", place: "Ikeja" },
  { who: "Sara", rating: 4, text: "Great result, but parking was difficult.", place: "Lekki" },
  { who: "Kunle", rating: 1, text: "Rude reception and I was overcharged.", place: "Ikeja" },
  { who: "Mary", rating: 5, text: "Clean, friendly and on time. Will be back!", place: "VI" },
];
const THEMES: [string, RegExp][] = [["Waiting time", /wait|late|delay|on time|quick/i], ["Staff", /staff|rude|friendly|reception/i], ["Price", /price|overcharg|expensive|cheap/i], ["Facilities", /parking|clean|toilet/i], ["Booking", /booking|appointment/i]];

export default function HelpdeskDemo({ preset, brand }: EngineProps) {
  if (preset === "reviews") return <Reviews brand={brand} />;
  if (preset === "selfservice") return <SelfService />;
  return <Desk />;
}

function Desk() {
  const [tickets, setTickets] = useState<Ticket[]>(() => TICKETS.map((t) => ({ ...t, id: uid() })));
  const [sel, setSel] = useState<string>("");
  const [filter, setFilter] = useState("Open & pending");
  const [reply, setReply] = useState("");
  const shown = useMemo(() => tickets.filter((t) => filter === "All" || (filter === "Open & pending" ? t.status !== "Solved" : t.status === filter)).sort((a, b) => (SLA[a.pri] - a.ageMin) - (SLA[b.pri] - b.ageMin)), [tickets, filter]);
  const cur = tickets.find((t) => t.id === sel) ?? shown[0];
  const breached = tickets.filter((t) => t.status !== "Solved" && t.ageMin > SLA[t.pri]).length;
  const upd = (patch: Partial<Ticket>) => cur && setTickets((ts) => ts.map((t) => (t.id === cur.id ? { ...t, ...patch } : t)));
  const send = () => { if (!cur || !reply.trim()) return; upd({ thread: [...cur.thread, { by: cur.agent === "Unassigned" ? "You" : cur.agent, text: reply.trim() }], status: "Pending" }); setReply(""); };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Open" value={tickets.filter((t) => t.status === "Open").length} /><Stat label="Pending customer" value={tickets.filter((t) => t.status === "Pending").length} />
        <Stat label="SLA breached" value={breached} hint="Past first-reply target" /><Stat label="Solved" value={tickets.filter((t) => t.status === "Solved").length} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <div>
          <Select label="Show" value={filter} onChange={(e) => setFilter(e.target.value)} options={["Open & pending", "Open", "Pending", "Solved", "All"]} />
          <ul className="mt-2 space-y-1.5">
            {shown.map((t) => { const left = SLA[t.pri] - t.ageMin; return (
              <li key={t.id}><button type="button" onClick={() => setSel(t.id)} aria-pressed={cur?.id === t.id} className={`w-full rounded-xl border p-2.5 text-left text-sm ${cur?.id === t.id ? "border-[var(--demo-accent)] bg-[color-mix(in_srgb,var(--demo-accent)_6%,transparent)]" : "border-border"}`}>
                <p className="font-semibold text-foreground">{t.subject}</p>
                <div className="mt-1 flex flex-wrap gap-1"><Badge tone={t.pri === "Urgent" ? "bad" : t.pri === "High" ? "warn" : "neutral"}>{t.pri}</Badge><Badge>{t.channel}</Badge>{t.status !== "Solved" && <Badge tone={left < 0 ? "bad" : "good"}><Clock className="h-3 w-3" />{left < 0 ? `SLA −${Math.round(-left / 60)}h` : `${Math.round(left / 60)}h left`}</Badge>}{t.status === "Solved" && <Badge tone="good">Solved</Badge>}</div>
              </button></li>); })}
          </ul>
        </div>
        {cur ? (
          <Panel title={cur.subject} actions={<div className="flex gap-2"><Select label="" aria-label="Assign" value={cur.agent} onChange={(e) => upd({ agent: e.target.value })} options={["Unassigned", "Chloe", "Tunde", "Ada"]} className="w-32" /><Select label="" aria-label="Status" value={cur.status} onChange={(e) => upd({ status: e.target.value as Ticket["status"] })} options={["Open", "Pending", "Solved"]} className="w-28" /></div>}>
            <p className="text-xs text-muted-foreground">{cur.from} via {cur.channel} · customer history: 3 orders, 1 previous ticket</p>
            <ul className="mt-3 space-y-2">{cur.thread.map((m, i) => <li key={i} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.by === cur.from ? "bg-muted" : "ml-auto bg-[var(--demo-accent)] text-white"}`}><span className="block text-[10px] opacity-75">{m.by}</span>{m.text}</li>)}</ul>
            <div className="mt-3 flex flex-wrap gap-1.5">{CANNED.map(([k, v]) => <button key={k} type="button" onClick={() => setReply(v.replace("{link}", "track.example/1042"))} className="rounded-full border border-border px-2.5 py-1 text-xs hover:border-[var(--demo-accent)]">{k}</button>)}</div>
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-2 flex gap-2"><textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} maxLength={500} aria-label="Reply" placeholder="Type a reply or pick a saved response…" className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--demo-accent)]" /><Btn type="submit" disabled={!reply.trim()}><Send className="h-4 w-4" />Send</Btn></form>
            {cur.status === "Solved" && (
              <div className="mt-3 rounded-xl bg-muted p-3 text-sm"><p className="font-medium">Customer satisfaction survey (customer's view)</p><div className="mt-1 flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" aria-label={`${n} stars`} onClick={() => upd({ csat: n })}><Star className={`h-5 w-5 ${cur.csat && n <= cur.csat ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} /></button>)}</div></div>
            )}
          </Panel>
        ) : <Panel><p className="text-sm text-muted-foreground">No tickets in this view.</p></Panel>}
      </div>
    </div>
  );
}

function Reviews({ brand }: { brand: string }) {
  const [replies, setReplies] = useState<Record<number, string>>({});
  const [loc, setLoc] = useState("All");
  const rows = REVIEWS.map((r, i) => ({ ...r, i, sentiment: r.rating >= 4 ? "Positive" : r.rating === 3 ? "Mixed" : "Negative", themes: THEMES.filter(([, re]) => re.test(r.text)).map(([t]) => t) })).filter((r) => loc === "All" || r.place === loc);
  const avg = rows.length ? (rows.reduce((s, r) => s + r.rating, 0) / rows.length).toFixed(1) : "—";
  const themeCounts = THEMES.map(([t]) => [t, rows.filter((r) => r.themes.includes(t) && r.sentiment === "Negative").length] as const).filter(([, n]) => n > 0);
  const draft = (r: (typeof rows)[number]) => r.sentiment === "Positive" ? `Thank you, ${r.who}! We're so glad you enjoyed your visit to ${brand}. See you again soon.` : `Hi ${r.who}, we're sorry about your experience${r.themes.length ? ` with ${r.themes[0].toLowerCase()}` : ""}. That's not the standard we aim for at ${brand}. Please message us so we can put this right.`;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><Stat label="Average rating" value={avg} /><Stat label="Reviews" value={rows.length} /><Stat label="Negative" value={rows.filter((r) => r.sentiment === "Negative").length} /><Stat label="Replied" value={Object.keys(replies).length} /></div>
      <div className="flex flex-wrap items-end gap-3"><Select label="Location" value={loc} onChange={(e) => setLoc(e.target.value)} options={["All", "Lekki", "Ikeja", "VI"]} className="w-40" />{themeCounts.length > 0 && <p className="text-sm text-muted-foreground">Recurring complaints: {themeCounts.map(([t, n]) => <Badge key={t} tone="bad">{t} ×{n}</Badge>)}</p>}</div>
      <ul className="space-y-2">{rows.map((r) => (
        <li key={r.i} className="rounded-2xl border border-border bg-card p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2"><strong>{r.who}</strong><span className="text-amber-500" aria-label={`${r.rating} stars`}>{"★".repeat(r.rating)}<span className="text-muted-foreground/30">{"★".repeat(5 - r.rating)}</span></span><Badge tone={r.sentiment === "Positive" ? "good" : r.sentiment === "Mixed" ? "warn" : "bad"}>{r.sentiment}</Badge>{r.themes.map((t) => <Badge key={t}>{t}</Badge>)}<span className="ml-auto text-xs text-muted-foreground">{r.place}</span></div>
          <p className="mt-1.5 text-muted-foreground">“{r.text}”</p>
          {replies[r.i] !== undefined ? (
            <div className="mt-2"><textarea aria-label={`Reply to ${r.who}`} value={replies[r.i]} onChange={(e) => setReplies({ ...replies, [r.i]: e.target.value })} rows={2} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" /><p className="text-[11px] text-muted-foreground">Draft reply. A person reviews it before it's posted.</p></div>
          ) : <Btn variant="soft" className="mt-2" onClick={() => setReplies({ ...replies, [r.i]: draft(r) })}><MessageCircle className="h-4 w-4" />Draft reply</Btn>}
        </li>
      ))}</ul>
    </div>
  );
}

const KB = [["How long does delivery take?", "Lagos 1–2 days, other states 3–5 working days."], ["How do I return an item?", "Start a return from your orders page within 14 days. We'll send a pickup code."], ["Can I change my address?", "Yes, before the order ships, from the order page."]];
function SelfService() {
  const [orders, setOrders] = useState([{ id: "#1042", item: "Linen shirt (M)", status: "Shipped", date: "3 days ago", ret: false }, { id: "#1031", item: "Ankara dress", status: "Delivered", date: "2 weeks ago", ret: false }]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const hits = q.trim() ? KB.filter(([t, a]) => `${t} ${a}`.toLowerCase().includes(q.toLowerCase().split(" ")[0])) : KB;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="My orders">
        <ul className="divide-y divide-border text-sm">{orders.map((o) => (
          <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><span><strong>{o.id}</strong> · {o.item}<br /><span className="text-xs text-muted-foreground">{o.status} · {o.date}</span></span>
            {o.ret ? <Badge tone="accent">Return started</Badge> : o.status === "Delivered" ? <Btn variant="ghost" onClick={() => { setOrders((os) => os.map((x) => (x.id === o.id ? { ...x, ret: true } : x))); setMsg(`Return started for ${o.id}. Pickup code: RT-${o.id.slice(1)}.`); }}>Start return</Btn> : <Btn variant="soft" onClick={() => setMsg(`${o.id} is with the courier: arriving tomorrow.`)}>Track</Btn>}
          </li>))}</ul>
      </Panel>
      <Panel title="Help centre">
        <label className="relative block text-xs font-medium text-muted-foreground">Search answers<Search className="pointer-events-none absolute left-2.5 top-[30px] h-4 w-4" /><input value={q} onChange={(e) => setQ(e.target.value)} className="mt-1 block w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-2.5 text-sm outline-none focus:border-[var(--demo-accent)]" placeholder="e.g. return" /></label>
        <ul className="mt-2 space-y-2 text-sm">{hits.map(([t, a]) => <li key={t}><details className="rounded-xl border border-border p-2.5"><summary className="cursor-pointer font-medium">{t}</summary><p className="mt-1 text-muted-foreground">{a}</p></details></li>)}</ul>
        {hits.length === 0 && <Btn className="mt-2" onClick={() => setMsg("Ticket #T-2201 opened. You'll get a reply by email within 4 hours.")}>No answer? Open a ticket</Btn>}
      </Panel>
      {msg && <div className="lg:col-span-2"><Toast>{msg}</Toast></div>}
    </div>
  );
}
