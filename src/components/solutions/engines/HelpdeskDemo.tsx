import { useMemo, useState } from "react";
import { Clock, MessageCircle, Search, Send, Star } from "lucide-react";
import { Badge, Btn, ListEditor, Outbox, Panel, RoleBar, RowsEditor, Select, SettingsPanel, Stat, Toast, Toggles, uid, useDemoSetting, type EngineProps, type OutboxItem } from "./ui";

type Pri = "Urgent" | "High" | "Normal" | "Low";
interface Ticket { id: string; subject: string; from: string; channel: string; pri: Pri; status: "Open" | "Pending" | "Solved"; agent: string; ageMin: number; thread: { by: string; text: string }[]; csat?: number }
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

export default function HelpdeskDemo(props: EngineProps) {
  if (props.preset === "reviews") return <Reviews {...props} />;
  if (props.preset === "selfservice") return <SelfService {...props} />;
  return <Desk {...props} />;
}

interface Canned { id: string; title: string; text: string }
const NEW_TICKETS: [string, string, string, Pri, string][] = [["Discount code not working", "Bisi A.", "Web chat", "Normal", "WELCOME10 says invalid at checkout."], ["Item arrived damaged", "Paul N.", "Email", "High", "The mug was broken when I opened the box."], ["Can I pay on delivery?", "Halima S.", "WhatsApp", "Low", "Do you accept cash on delivery in Abuja?"]];

function Desk(props: EngineProps) {
  const [slaHours, setSlaHours] = useDemoSetting<Record<Pri, number>>(props, "sla", { Urgent: 1, High: 4, Normal: 8, Low: 24 });
  const [agents, setAgents] = useDemoSetting<string[]>(props, "agents", ["Chloe", "Tunde", "Ada"]);
  const [canned, setCanned] = useDemoSetting<Canned[]>(props, "canned", CANNED.map(([title, text], i) => ({ id: `c${i}`, title, text })));
  const [assignRule, setAssignRule] = useDemoSetting(props, "assign", "manual");
  const [notify, setNotify] = useDemoSetting<string[]>(props, "notify", ["reply", "breach"]);
  const [role, setRole] = useDemoSetting(props, "role", "supervisor");
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const [nextNew, setNextNew] = useState(0);
  const push = (channel: string, to: string, text: string) => setOutbox((o) => [...o, { id: uid(), channel, to, text }].slice(-30));
  const SLA: Record<Pri, number> = { Urgent: slaHours.Urgent * 60, High: slaHours.High * 60, Normal: slaHours.Normal * 60, Low: slaHours.Low * 60 };
  const me = agents[0];
  const [rawTickets, setTickets] = useState<Ticket[]>(() => TICKETS.map((t) => ({ ...t, id: uid() })));
  const tickets = rawTickets.map((t) => (t.agent !== "Unassigned" && !agents.includes(t.agent) ? { ...t, agent: "Unassigned" } : t));
  const canWork = (t: Ticket) => role === "supervisor" || t.agent === me || t.agent === "Unassigned";
  const [sel, setSel] = useState<string>("");
  const [filter, setFilter] = useState("Open & pending");
  const [reply, setReply] = useState("");
  const shown = useMemo(() => tickets.filter((t) => filter === "All" || (filter === "Open & pending" ? t.status !== "Solved" : t.status === filter)).sort((a, b) => (SLA[a.pri] - a.ageMin) - (SLA[b.pri] - b.ageMin)), [tickets, filter]);
  const cur = tickets.find((t) => t.id === sel) ?? shown[0];
  const breached = tickets.filter((t) => t.status !== "Solved" && t.ageMin > SLA[t.pri]).length;
  const upd = (patch: Partial<Ticket>) => cur && setTickets((ts) => ts.map((t) => (t.id === cur.id ? { ...t, ...patch } : t)));
  const send = () => {
    if (!cur || !reply.trim() || !canWork(cur)) return;
    const by = cur.agent === "Unassigned" ? (role === "agent" ? me : "You") : cur.agent;
    upd({ thread: [...cur.thread, { by, text: reply.trim() }], status: "Pending", agent: cur.agent === "Unassigned" && role === "agent" ? me : cur.agent });
    if (notify.includes("reply")) push(cur.channel, cur.from, reply.trim());
    setReply("");
  };
  const simulate = () => {
    const [subject, from, channel, pri, text] = NEW_TICKETS[nextNew % NEW_TICKETS.length];
    const open = (a: string) => tickets.filter((t) => t.agent === a && t.status !== "Solved").length;
    const agent = assignRule === "round" ? agents[(rawTickets.length) % agents.length] : assignRule === "least" ? [...agents].sort((a, b) => open(a) - open(b))[0] : "Unassigned";
    setTickets((ts) => [{ id: uid(), subject, from, channel, pri, status: "Open", agent, ageMin: 0, thread: [{ by: from, text }] }, ...ts]);
    setNextNew((n) => n + 1);
    if (notify.includes("assign") && agent !== "Unassigned") push("Email", agent, `New ${pri.toLowerCase()} ticket assigned to you: "${subject}".`);
  };
  const checkBreaches = () => tickets.filter((t) => t.status !== "Solved" && t.ageMin > SLA[t.pri]).forEach((t) => push("Slack", "Support supervisor", `SLA breached: "${t.subject}" (${t.pri}, ${t.agent}).`));

  return (
    <div className="space-y-4">
      <SettingsPanel summary={`SLA ${slaHours.Urgent}h/${slaHours.High}h/${slaHours.Normal}h/${slaHours.Low}h · ${agents.length} agents`}>
        <fieldset><legend className="text-xs font-semibold text-foreground">First-reply targets (hours)</legend>
          <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">{(["Urgent", "High", "Normal", "Low"] as Pri[]).map((k) => (
            <label key={k} className="text-xs text-muted-foreground">{k}<input type="number" min={1} max={72} value={slaHours[k]} onChange={(e) => setSlaHours({ ...slaHours, [k]: Math.min(72, Math.max(1, Number(e.target.value) || 1)) })} className="mt-1 block w-full rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground" /></label>
          ))}</div>
        </fieldset>
        <ListEditor label="Agents" items={agents} onChange={setAgents} min={1} max={6} placeholder="e.g. Kemi" />
        <Select label="Assign new tickets" value={assignRule} onChange={(e) => setAssignRule(e.target.value)} options={[["manual", "Leave unassigned (manual)"], ["round", "Round-robin between agents"], ["least", "Agent with the fewest open tickets"]]} className="max-w-[320px]" />
        <RowsEditor<Canned> label="Saved replies" rows={canned} onChange={setCanned} max={6} cols={[{ key: "title", label: "Name", type: "text", width: "28%" }, { key: "text", label: "Reply text", type: "text" }]} make={() => ({ id: uid(), title: "New reply", text: "Thanks for getting in touch!" })} />
        <Toggles label="Notifications" options={[["reply", "Send replies to the customer's channel"], ["assign", "Tell agents about new assignments"], ["breach", "Alert the supervisor on SLA breaches"]]} value={notify} onChange={setNotify} />
      </SettingsPanel>
      <RoleBar roles={[{ id: "supervisor", label: "Support supervisor", can: "Sees and works every ticket, reassigns, changes status." }, { id: "agent", label: `Agent (${me})`, can: `Can reply to and solve tickets assigned to ${me} or unassigned ones (taking them). Cannot reassign others' tickets.` }]} value={role} onChange={setRole} />
      <div className="flex flex-wrap gap-2">
        <Btn variant="soft" onClick={simulate}>Simulate a new incoming ticket</Btn>
        <Btn variant="ghost" disabled={!notify.includes("breach")} onClick={checkBreaches}>Run SLA check</Btn>
      </div>
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
          <Panel title={cur.subject} actions={<div className="flex gap-2"><Select label="" aria-label="Assign" disabled={role !== "supervisor"} value={cur.agent} onChange={(e) => { upd({ agent: e.target.value }); if (notify.includes("assign") && e.target.value !== "Unassigned") push("Email", e.target.value, `Ticket assigned to you: "${cur.subject}".`); }} options={["Unassigned", ...agents]} className="w-32" /><Select label="" aria-label="Status" disabled={!canWork(cur)} value={cur.status} onChange={(e) => upd({ status: e.target.value as Ticket["status"] })} options={["Open", "Pending", "Solved"]} className="w-28" /></div>}>
            <p className="text-xs text-muted-foreground">{cur.from} via {cur.channel} · customer history: 3 orders, 1 previous ticket</p>
            <ul className="mt-3 space-y-2">{cur.thread.map((m, i) => <li key={i} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.by === cur.from ? "bg-muted" : "ml-auto bg-[var(--demo-accent)] text-white"}`}><span className="block text-[10px] opacity-75">{m.by}</span>{m.text}</li>)}</ul>
            <div className="mt-3 flex flex-wrap gap-1.5">{canned.map(({ id, title: k, text: v }) => <button key={id} type="button" onClick={() => setReply(v.replace("{link}", "track.example/1042"))} className="rounded-full border border-border px-2.5 py-1 text-xs hover:border-[var(--demo-accent)]">{k}</button>)}</div>
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-2 flex gap-2"><textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} maxLength={500} aria-label="Reply" placeholder="Type a reply or pick a saved response…" className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--demo-accent)]" /><Btn type="submit" disabled={!reply.trim() || !canWork(cur)}><Send className="h-4 w-4" />Send</Btn></form>
            {!canWork(cur) && <p className="mt-1 text-[11px] text-muted-foreground">Assigned to {cur.agent}: agents can only work their own or unassigned tickets.</p>}
            {cur.status === "Solved" && (
              <div className="mt-3 rounded-xl bg-muted p-3 text-sm"><p className="font-medium">Customer satisfaction survey (customer's view)</p><div className="mt-1 flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" aria-label={`${n} stars`} onClick={() => upd({ csat: n })}><Star className={`h-5 w-5 ${cur.csat && n <= cur.csat ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} /></button>)}</div></div>
            )}
          </Panel>
        ) : <Panel><p className="text-sm text-muted-foreground">No tickets in this view.</p></Panel>}
      </div>
      <Outbox items={outbox} onClear={() => setOutbox([])} />
    </div>
  );
}

function Reviews(props: EngineProps) {
  const { brand } = props;
  const [tone, setTone] = useDemoSetting(props, "tone", "warm");
  const [alertAt, setAlertAt] = useDemoSetting(props, "alertAt", 2);
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const [replies, setReplies] = useState<Record<number, string>>({});
  const [loc, setLoc] = useState("All");
  const rows = REVIEWS.map((r, i) => ({ ...r, i, sentiment: r.rating >= 4 ? "Positive" : r.rating === 3 ? "Mixed" : "Negative", themes: THEMES.filter(([, re]) => re.test(r.text)).map(([t]) => t) })).filter((r) => loc === "All" || r.place === loc);
  const avg = rows.length ? (rows.reduce((s, r) => s + r.rating, 0) / rows.length).toFixed(1) : "—";
  const themeCounts = THEMES.map(([t]) => [t, rows.filter((r) => r.themes.includes(t) && r.sentiment === "Negative").length] as const).filter(([, n]) => n > 0);
  const draft = (r: (typeof rows)[number]) => tone === "formal"
    ? (r.sentiment === "Positive" ? `Dear ${r.who}, thank you for your review. We appreciate your feedback and look forward to welcoming you back to ${brand}.` : `Dear ${r.who}, thank you for your feedback${r.themes.length ? ` regarding ${r.themes[0].toLowerCase()}` : ""}. We apologise that your experience did not meet expectations. Please contact our customer care team so we can resolve this.`)
    : (r.sentiment === "Positive" ? `Thank you, ${r.who}! We're so glad you enjoyed your visit to ${brand}. See you again soon.` : `Hi ${r.who}, we're sorry about your experience${r.themes.length ? ` with ${r.themes[0].toLowerCase()}` : ""}. That's not the standard we aim for at ${brand}. Please message us so we can put this right.`);
  const runAlerts = () => setOutbox(rows.filter((r) => r.rating <= alertAt).map((r) => ({ id: uid(), channel: "WhatsApp", to: `${r.place} manager`, text: `${r.rating}★ review from ${r.who}: "${r.text}"` })));
  return (
    <div className="space-y-4">
      <SettingsPanel summary={`${tone === "formal" ? "Formal" : "Warm"} replies · alert at ${alertAt}★ or below`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Reply tone" value={tone} onChange={(e) => setTone(e.target.value)} options={[["warm", "Warm and personal"], ["formal", "Formal"]]} />
          <Select label="Alert the location manager for reviews at or below" value={String(alertAt)} onChange={(e) => setAlertAt(Number(e.target.value))} options={[["1", "1 star"], ["2", "2 stars"], ["3", "3 stars"]]} />
        </div>
      </SettingsPanel>
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
      <Btn variant="ghost" onClick={runAlerts}>Run low-rating alerts</Btn>
      <Outbox items={outbox} onClear={() => setOutbox([])} />
    </div>
  );
}

interface Faq { id: string; q: string; a: string }
const KB: Faq[] = [["How long does delivery take?", "Lagos 1–2 days, other states 3–5 working days."], ["How do I return an item?", "Start a return from your orders page within 14 days. We'll send a pickup code."], ["Can I change my address?", "Yes, before the order ships, from the order page."]].map(([q, a], i) => ({ id: `k${i}`, q, a }));
function SelfService(props: EngineProps) {
  const [kb, setKb] = useDemoSetting<Faq[]>(props, "kb", KB);
  const [returnDays, setReturnDays] = useDemoSetting(props, "returnDays", 14);
  const [orders, setOrders] = useState([{ id: "#1042", item: "Linen shirt (M)", status: "Shipped", date: "3 days ago", ret: false }, { id: "#1031", item: "Ankara dress", status: "Delivered", date: "2 weeks ago", ret: false }]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const hits = words.length ? kb.filter(({ q: t, a }) => words.some((w) => `${t} ${a}`.toLowerCase().includes(w))) : kb;
  const ageDays: Record<string, number> = { "#1042": 3, "#1031": 14 };
  return (
    <div className="space-y-4">
    <SettingsPanel summary={`${kb.length} help articles · ${returnDays}-day returns`}>
      <RowsEditor<Faq> label="Help centre articles" rows={kb} onChange={setKb} max={8} cols={[{ key: "q", label: "Question", type: "text", width: "40%" }, { key: "a", label: "Answer", type: "text" }]} make={() => ({ id: uid(), q: "New question?", a: "Answer." })} />
      <Select label="Return window" value={String(returnDays)} onChange={(e) => setReturnDays(Number(e.target.value))} options={[["7", "7 days"], ["14", "14 days"], ["30", "30 days"]]} className="max-w-[220px]" />
    </SettingsPanel>
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="My orders">
        <ul className="divide-y divide-border text-sm">{orders.map((o) => (
          <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><span><strong>{o.id}</strong> · {o.item}<br /><span className="text-xs text-muted-foreground">{o.status} · {o.date}</span></span>
            {o.ret ? <Badge tone="accent">Return started</Badge> : o.status === "Delivered" && (ageDays[o.id] ?? 0) > returnDays ? <Badge>Return window closed ({returnDays} days)</Badge> : o.status === "Delivered" ? <Btn variant="ghost" onClick={() => { setOrders((os) => os.map((x) => (x.id === o.id ? { ...x, ret: true } : x))); setMsg(`Return started for ${o.id}. Pickup code: RT-${o.id.slice(1)}.`); }}>Start return</Btn> : <Btn variant="soft" onClick={() => setMsg(`${o.id} is with the courier: arriving tomorrow.`)}>Track</Btn>}
          </li>))}</ul>
      </Panel>
      <Panel title="Help centre">
        <label className="relative block text-xs font-medium text-muted-foreground">Search answers<Search className="pointer-events-none absolute left-2.5 top-[30px] h-4 w-4" /><input value={q} onChange={(e) => setQ(e.target.value)} className="mt-1 block w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-2.5 text-sm outline-none focus:border-[var(--demo-accent)]" placeholder="e.g. return" /></label>
        <ul className="mt-2 space-y-2 text-sm">{hits.map(({ id, q: t, a }) => <li key={id}><details className="rounded-xl border border-border p-2.5"><summary className="cursor-pointer font-medium">{t}</summary><p className="mt-1 text-muted-foreground">{a}</p></details></li>)}</ul>
        {hits.length === 0 && <Btn className="mt-2" onClick={() => setMsg("Ticket #T-2201 opened (demo). In a live portal the customer gets an email confirmation and the support team sees it in their queue.")}>No answer? Open a ticket</Btn>}
      </Panel>
      {msg && <div className="lg:col-span-2"><Toast>{msg}</Toast></div>}
    </div>
    </div>
  );
}
