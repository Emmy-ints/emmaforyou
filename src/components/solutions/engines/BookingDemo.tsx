import { useMemo, useState } from "react";
import { CalendarCheck, Check, Minus, Plus } from "lucide-react";
import { Badge, Btn, Field, Panel, daysFromNow, fmtDate, hash, isoDay, money, uid, type EngineProps } from "./ui";

type Mode = "slots" | "range" | "tickets" | "classes";
interface Svc { name: string; mins?: number; price: number; cap?: number; time?: string }
interface Cfg { mode: Mode; cur: string; staff?: string[]; open: [number, number]; services: Svc[]; deposit?: number; unit?: string; closedDays?: number[] }

const P: Record<string, Cfg> = {
  salon: { mode: "slots", cur: "NGN", staff: ["Any stylist", "Tola", "Ama", "Zara"], open: [9, 19], deposit: 0.2, closedDays: [1], services: [{ name: "Knotless braids", mins: 240, price: 35000 }, { name: "Silk press", mins: 90, price: 18000 }, { name: "Wash & style", mins: 60, price: 8000 }, { name: "Gel manicure", mins: 45, price: 10000 }] },
  clinic: { mode: "slots", cur: "NGN", staff: ["First available", "Dr. Bello", "Dr. Smith"], open: [8, 17], deposit: 0, closedDays: [0], services: [{ name: "Consultation", mins: 30, price: 20000 }, { name: "Check-up & clean", mins: 45, price: 25000 }, { name: "Follow-up", mins: 20, price: 10000 }] },
  consult: { mode: "slots", cur: "USD", staff: ["Lead consultant", "Strategist"], open: [10, 17], deposit: 0, closedDays: [0, 6], services: [{ name: "Discovery call (video)", mins: 30, price: 0 }, { name: "Strategy session (video)", mins: 60, price: 150 }, { name: "Workshop (video)", mins: 120, price: 400 }] },
  studio: { mode: "slots", cur: "USD", staff: ["Studio A", "Studio B (vocal booth)"], open: [10, 22], deposit: 0.3, services: [{ name: "Recording (2 hours)", mins: 120, price: 120 }, { name: "Mixing session", mins: 180, price: 200 }, { name: "Rehearsal room", mins: 60, price: 40 }] },
  rental: { mode: "range", cur: "USD", open: [0, 0], deposit: 0.25, unit: "day", services: [{ name: "Camera kit (4K)", price: 45 }, { name: "Party tent 6×12m", price: 120 }, { name: "Projector + screen", price: 35 }, { name: "Compact car", price: 60 }] },
  hotel: { mode: "range", cur: "EUR", open: [0, 0], deposit: 0.3, unit: "night", services: [{ name: "Classic double", price: 140 }, { name: "Deluxe king", price: 190 }, { name: "Junior suite", price: 260 }] },
  event: { mode: "tickets", cur: "USD", open: [0, 0], services: [{ name: "Early bird", price: 25, cap: 40 }, { name: "General admission", price: 40, cap: 120 }, { name: "VIP (front rows + replay)", price: 90, cap: 20 }] },
  fitness: { mode: "classes", cur: "USD", open: [6, 20], services: [{ name: "Spin", mins: 45, price: 12, cap: 16, time: "07:00" }, { name: "HIIT", mins: 30, price: 10, cap: 12, time: "12:30" }, { name: "Yoga flow", mins: 60, price: 12, cap: 20, time: "18:00" }, { name: "Strength", mins: 50, price: 14, cap: 10, time: "19:15" }] },
};

interface Booking { id: string; what: string; when: string; name: string; total: number; deposit: number; ref: string }

export default function BookingDemo({ preset, brand }: EngineProps) {
  const cfg = P[preset] ?? P.salon;
  const days = useMemo(() => Array.from({ length: 10 }, (_, i) => daysFromNow(i + 1)), []);
  const [svc, setSvc] = useState(0);
  const [staff, setStaff] = useState(cfg.staff?.[0] ?? "");
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [nights, setNights] = useState(2);
  const [qty, setQty] = useState<number[]>(cfg.services.map(() => 0));
  const [name, setName] = useState("");
  const [payDeposit, setPayDeposit] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<"book" | "admin">("book");
  const s = cfg.services[svc];
  const closed = (d: Date) => cfg.closedDays?.includes(d.getDay());

  const slots = useMemo(() => {
    if (cfg.mode !== "slots") return [];
    const out: { t: string; free: boolean }[] = [];
    const step = (s.mins ?? 60) >= 120 ? 120 : 60;
    for (let m = cfg.open[0] * 60; m + (s.mins ?? 60) <= cfg.open[1] * 60; m += step) {
      const t = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
      const key = `${isoDay(days[day])}|${t}|${staff}`;
      const taken = hash(`${preset}${key}`) < 0.35 || bookings.some((b) => b.when.includes(`${fmtDate(days[day])} ${t}`) && b.what.includes(staff));
      out.push({ t, free: !taken });
    }
    return out;
  }, [cfg, s, day, staff, days, preset, bookings]);

  const classSpots = (i: number) => { const c = cfg.services[i]; const used = Math.floor(hash(`${preset}${isoDay(days[day])}${i}`) * (c.cap ?? 10)); return Math.max(0, (c.cap ?? 10) - used - bookings.filter((b) => b.what.startsWith(c.name) && b.when.startsWith(fmtDate(days[day]))).length); };

  const total = cfg.mode === "range" ? s.price * nights : cfg.mode === "tickets" ? cfg.services.reduce((t, x, i) => t + x.price * qty[i], 0) : s.price;
  const deposit = cfg.deposit && payDeposit ? Math.round(total * cfg.deposit) : 0;
  const ready = name.trim().length >= 2 && (cfg.mode === "slots" ? !!slot : cfg.mode === "tickets" ? qty.some((q) => q > 0) : cfg.mode === "classes" ? !!slot : nights > 0);

  const confirm = () => {
    if (!ready) return;
    const what = cfg.mode === "tickets" ? cfg.services.map((x, i) => (qty[i] ? `${qty[i]}× ${x.name}` : "")).filter(Boolean).join(", ") : cfg.mode === "classes" ? `${slot}` : `${s.name}${staff ? ` · ${staff}` : ""}`;
    const when = cfg.mode === "range" ? `${fmtDate(days[day])} → ${fmtDate(daysFromNow(day + 1 + nights))} (${nights} ${cfg.unit}${nights > 1 ? "s" : ""})` : cfg.mode === "tickets" ? "Event day" : `${fmtDate(days[day])} ${cfg.mode === "classes" ? cfg.services.find((c) => c.name === slot)?.time : slot}`;
    setBookings((b) => [{ id: uid(), what, when, name: name.trim(), total, deposit, ref: `${brand.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}` }, ...b]);
    setSlot(null); setName(""); setQty(cfg.services.map(() => 0));
  };
  const latest = bookings[0];

  return (
    <div className="space-y-4">
      <div className="flex rounded-full border border-border p-0.5 text-xs font-semibold" role="tablist" aria-label="View">
        {(["book", "admin"] as const).map((t) => <button key={t} role="tab" aria-selected={tab === t} type="button" onClick={() => setTab(t)} className={`flex-1 rounded-full px-3 py-1.5 ${tab === t ? "bg-[var(--demo-accent)] text-white" : "text-muted-foreground"}`}>{t === "book" ? "Customer view" : `Staff view (${bookings.length})`}</button>)}
      </div>

      {tab === "book" ? (
        <>
          {cfg.mode !== "tickets" && cfg.mode !== "classes" && (
            <Panel title="1. Choose">
              <div className="grid gap-2 sm:grid-cols-2">
                {cfg.services.map((x, i) => (
                  <button key={x.name} type="button" onClick={() => { setSvc(i); setSlot(null); }} aria-pressed={svc === i} className={`rounded-xl border p-3 text-left text-sm transition ${svc === i ? "border-[var(--demo-accent)] bg-[color-mix(in_srgb,var(--demo-accent)_8%,transparent)]" : "border-border hover:border-[var(--demo-accent)]"}`}>
                    <p className="font-semibold text-foreground">{x.name}</p>
                    <p className="text-xs text-muted-foreground">{x.mins ? `${x.mins} min · ` : ""}{x.price ? money(x.price, cfg.cur) : "Free"}{cfg.unit ? ` per ${cfg.unit}` : ""}</p>
                  </button>
                ))}
              </div>
              {cfg.staff && <div className="mt-3 flex flex-wrap gap-1.5">{cfg.staff.map((st) => <button key={st} type="button" aria-pressed={staff === st} onClick={() => { setStaff(st); setSlot(null); }} className={`rounded-full border px-3 py-1 text-xs font-semibold ${staff === st ? "border-[var(--demo-accent)] text-[var(--demo-accent)]" : "border-border text-muted-foreground"}`}>{st}</button>)}</div>}
            </Panel>
          )}

          {cfg.mode !== "tickets" && (
            <Panel title={cfg.mode === "range" ? "2. Dates" : cfg.mode === "classes" ? "1. Pick a day and class" : "2. Pick a time"}>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {days.map((d, i) => (
                  <button key={i} type="button" disabled={closed(d)} onClick={() => { setDay(i); setSlot(null); }} aria-pressed={day === i} className={`min-w-[64px] rounded-xl border px-2 py-2 text-center text-xs disabled:opacity-35 ${day === i ? "border-[var(--demo-accent)] bg-[var(--demo-accent)] text-white" : "border-border text-foreground"}`}>
                    <span className="block font-semibold">{d.toLocaleDateString(undefined, { weekday: "short" })}</span>{d.getDate()} {d.toLocaleDateString(undefined, { month: "short" })}{closed(d) && <span className="block text-[10px]">Closed</span>}
                  </button>
                ))}
              </div>
              {cfg.mode === "slots" && (
                <div className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                  {slots.map((x) => <button key={x.t} type="button" disabled={!x.free} onClick={() => setSlot(x.t)} aria-pressed={slot === x.t} className={`rounded-lg border px-2 py-1.5 text-sm ${slot === x.t ? "border-[var(--demo-accent)] bg-[var(--demo-accent)] text-white" : x.free ? "border-border hover:border-[var(--demo-accent)]" : "border-border text-muted-foreground line-through opacity-50"}`}>{x.t}</button>)}
                </div>
              )}
              {cfg.mode === "range" && (
                <div className="mt-3 flex items-center gap-3 text-sm">
                  <span>Check-in {fmtDate(days[day])}</span>
                  <div className="flex items-center gap-1"><button type="button" aria-label={`Fewer ${cfg.unit}s`} onClick={() => setNights((n) => Math.max(1, n - 1))} className="rounded-full border border-border p-1"><Minus className="h-3.5 w-3.5" /></button><span className="w-16 text-center font-semibold">{nights} {cfg.unit}{nights > 1 ? "s" : ""}</span><button type="button" aria-label={`More ${cfg.unit}s`} onClick={() => setNights((n) => Math.min(14, n + 1))} className="rounded-full border border-border p-1"><Plus className="h-3.5 w-3.5" /></button></div>
                  <span className="text-muted-foreground">until {fmtDate(daysFromNow(day + 1 + nights))}</span>
                </div>
              )}
              {cfg.mode === "classes" && (
                <ul className="mt-3 space-y-1.5">
                  {cfg.services.map((c, i) => { const left = classSpots(i); return (
                    <li key={c.name}><button type="button" disabled={left === 0} onClick={() => setSlot(c.name)} aria-pressed={slot === c.name} className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm ${slot === c.name ? "border-[var(--demo-accent)] bg-[color-mix(in_srgb,var(--demo-accent)_8%,transparent)]" : "border-border"} disabled:opacity-40`}>
                      <span><strong>{c.time}</strong> · {c.name} · {c.mins} min</span><Badge tone={left === 0 ? "bad" : left < 4 ? "warn" : "good"}>{left === 0 ? "Full (join waitlist)" : `${left} spots`}</Badge>
                    </button></li>); })}
                </ul>
              )}
            </Panel>
          )}

          {cfg.mode === "tickets" && (
            <Panel title="1. Tickets">
              <ul className="space-y-2">
                {cfg.services.map((t, i) => (
                  <li key={t.name} className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm">
                    <span><strong>{t.name}</strong> · {money(t.price, cfg.cur)} <span className="text-xs text-muted-foreground">({Math.max(0, (t.cap ?? 0) - Math.floor(hash(t.name) * (t.cap ?? 0)))} left)</span></span>
                    <div className="flex items-center gap-1"><button type="button" aria-label={`Remove one ${t.name}`} onClick={() => setQty((q) => q.map((v, j) => (j === i ? Math.max(0, v - 1) : v)))} className="rounded-full border border-border p-1"><Minus className="h-3.5 w-3.5" /></button><span className="w-6 text-center font-semibold">{qty[i]}</span><button type="button" aria-label={`Add one ${t.name}`} onClick={() => setQty((q) => q.map((v, j) => (j === i ? Math.min(10, v + 1) : v)))} className="rounded-full border border-border p-1"><Plus className="h-3.5 w-3.5" /></button></div>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <Panel title="Your details">
            <form onSubmit={(e) => { e.preventDefault(); confirm(); }} className="space-y-3">
              <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} placeholder="e.g. Ada Okafor" />
              {cfg.deposit ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={payDeposit} onChange={(e) => setPayDeposit(e.target.checked)} className="accent-[var(--demo-accent)]" />Pay a {Math.round(cfg.deposit * 100)}% deposit now to secure it</label> : null}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted px-3 py-2 text-sm">
                <span>Total <strong>{money(total, cfg.cur)}</strong>{deposit ? <> · deposit today <strong>{money(deposit, cfg.cur)}</strong></> : null}</span>
                <Btn type="submit" disabled={!ready}><CalendarCheck className="h-4 w-4" />Confirm booking</Btn>
              </div>
              <p className="text-[11px] text-muted-foreground">Demo only: no payment is taken and nothing is sent.</p>
            </form>
          </Panel>

          {latest && (
            <div role="status" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
              <p className="flex items-center gap-2 font-semibold text-foreground"><Check className="h-4 w-4 text-emerald-600" />Booked: {latest.what}</p>
              <p className="mt-1 text-muted-foreground">{latest.when} · {latest.name} · ref {latest.ref}</p>
              <p className="mt-2 text-xs text-muted-foreground">Automatic messages in the real system: confirmation now, reminder 24 hours before, reminder 2 hours before, review request after the visit.</p>
            </div>
          )}
        </>
      ) : (
        <Panel title={`${brand} · bookings`}>
          {bookings.length === 0 ? <p className="text-sm text-muted-foreground">No bookings yet. Make one in the customer view and it appears here.</p> : (
            <ul className="divide-y divide-border text-sm">
              {bookings.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span><strong>{b.name}</strong> · {b.what}<br /><span className="text-xs text-muted-foreground">{b.when} · {money(b.total, cfg.cur)}{b.deposit ? ` (deposit ${money(b.deposit, cfg.cur)})` : ""} · {b.ref}</span></span>
                  <Btn variant="danger" onClick={() => setBookings((bs) => bs.filter((x) => x.id !== b.id))}>Cancel</Btn>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
    </div>
  );
}
