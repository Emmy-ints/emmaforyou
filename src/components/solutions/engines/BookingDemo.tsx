import { useMemo, useState } from "react";
import { CalendarCheck, Check, Minus, Plus } from "lucide-react";
import { Badge, Btn, Field, ListEditor, Outbox, Panel, RowsEditor, Select, SettingsPanel, Toggles, curOf, daysFromNow, fmtDate, hash, isoDay, money as fmtMoney, uid, useDemoSetting, type EngineProps, type OutboxItem, type RowCol } from "./ui";

type Mode = "slots" | "range" | "tickets" | "classes";
interface Svc { id?: string; name: string; mins?: number; price: number; cap?: number; time?: string }
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

interface Booking { id: string; what: string; when: string; name: string; total: number; deposit: number; ref: string; day?: string; start?: number; end?: number; staff?: string; svc?: string }

const DAY_NAMES: [string, string][] = [["1", "Mon"], ["2", "Tue"], ["3", "Wed"], ["4", "Thu"], ["5", "Fri"], ["6", "Sat"], ["0", "Sun"]];
const NOTIFY: [string, string][] = [["confirm", "Confirmation to the customer"], ["r24", "Reminder 24 hours before"], ["r2", "Reminder 2 hours before"], ["staff", "New-booking alert to staff"], ["review", "Review request after the visit"]];
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export default function BookingDemo(props: EngineProps) {
  const { preset, brand } = props;
  const base = P[preset] ?? P.salon;
  const cur = curOf(props, base.cur);
  const money = (v: number, _c?: string) => fmtMoney(v, cur);
  const [services, setServices] = useDemoSetting<Svc[]>(props, "services", base.services.map((x, i) => ({ ...x, id: `s${i}` })));
  const [staffList, setStaffList] = useDemoSetting<string[]>(props, "staff", base.staff ?? []);
  const [hours, setHours] = useDemoSetting<[number, number]>(props, "hours", base.open);
  const [interval, setIntervalMins] = useDemoSetting(props, "interval", 0); // 0 = match the service length
  const [buffer, setBuffer] = useDemoSetting(props, "buffer", 0);
  const [closedDays, setClosedDays] = useDemoSetting<string[]>(props, "closed", (base.closedDays ?? []).map(String));
  const [depositPct, setDepositPct] = useDemoSetting(props, "deposit", Math.round((base.deposit ?? 0) * 100));
  const [notify, setNotify] = useDemoSetting<string[]>(props, "notify", ["confirm", "r24", "staff"]);
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const push = (channel: string, to: string, text: string) => setOutbox((o) => [...o, { id: uid(), channel, to, text }].slice(-40));
  const cfg: Cfg = { ...base, services: services.length ? services : base.services, staff: base.staff ? (staffList.length ? staffList : base.staff) : undefined, open: hours, deposit: depositPct / 100, closedDays: closedDays.map(Number) };
  const days = useMemo(() => Array.from({ length: 10 }, (_, i) => daysFromNow(i + 1)), []);
  const [svc, setSvc] = useState(0);
  const [staffPick, setStaff] = useState(cfg.staff?.[0] ?? "");
  const staff = cfg.staff ? (cfg.staff.includes(staffPick) ? staffPick : cfg.staff[0]) : "";
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [nights, setNights] = useState(2);
  const [qtyRaw, setQty] = useState<number[]>(cfg.services.map(() => 0));
  const qty = cfg.services.map((_, i) => qtyRaw[i] ?? 0);
  const [name, setName] = useState("");
  const [payDeposit, setPayDeposit] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<"book" | "admin">("book");
  const s = cfg.services[Math.min(svc, cfg.services.length - 1)];
  const closed = (d: Date) => cfg.closedDays?.includes(d.getDay());

  const slots = useMemo(() => {
    if (cfg.mode !== "slots") return [];
    const out: { t: string; free: boolean; why?: string }[] = [];
    const len = Math.max(5, s.mins ?? 60);
    const step = interval > 0 ? interval : len >= 120 ? 120 : len <= 30 ? 30 : 60;
    const dayKey = isoDay(days[day]);
    for (let m = cfg.open[0] * 60; m + len <= cfg.open[1] * 60; m += step) {
      const t = hhmm(m);
      // Sample busy times (stable per day/time/staff) plus real conflicts with bookings made in this demo, including the buffer.
      const sample = hash(`${preset}${dayKey}|${t}|${staff}`) < 0.3;
      const clash = bookings.some((b) => b.day === dayKey && b.staff === staff && b.start != null && b.end != null && m < b.end + buffer && b.start < m + len + buffer);
      out.push({ t, free: !sample && !clash, why: clash ? "Booked in this demo" : sample ? "Already booked" : undefined });
    }
    return out;
  }, [cfg.mode, cfg.open, s, day, staff, days, preset, bookings, interval, buffer]);

  const classSpots = (i: number) => { const c = cfg.services[i]; const used = Math.floor(hash(`${preset}${isoDay(days[day])}${i}`) * (c.cap ?? 10)); return Math.max(0, (c.cap ?? 10) - used - bookings.filter((b) => b.what.startsWith(c.name) && b.when.startsWith(fmtDate(days[day]))).length); };

  const total = cfg.mode === "range" ? s.price * nights : cfg.mode === "tickets" ? cfg.services.reduce((t, x, i) => t + x.price * qty[i], 0) : s.price;
  const deposit = cfg.deposit && payDeposit ? Math.round(total * cfg.deposit) : 0;
  const ready = name.trim().length >= 2 && (cfg.mode === "slots" ? !!slot : cfg.mode === "tickets" ? qty.some((q) => q > 0) : cfg.mode === "classes" ? !!slot : nights > 0);

  const confirm = () => {
    if (!ready) return;
    const dayKey = isoDay(days[day]);
    const startMin = cfg.mode === "slots" && slot ? Number(slot.slice(0, 2)) * 60 + Number(slot.slice(3)) : undefined;
    const what = cfg.mode === "tickets" ? cfg.services.map((x, i) => (qty[i] ? `${qty[i]}× ${x.name}` : "")).filter(Boolean).join(", ") : cfg.mode === "classes" ? `${slot}` : `${s.name}${staff ? ` · ${staff}` : ""}`;
    const when = cfg.mode === "range" ? `${fmtDate(days[day])} → ${fmtDate(daysFromNow(day + 1 + nights))} (${nights} ${cfg.unit}${nights > 1 ? "s" : ""})` : cfg.mode === "tickets" ? "Event day" : `${fmtDate(days[day])} ${cfg.mode === "classes" ? cfg.services.find((c) => c.name === slot)?.time : slot}`;
    const ref = `${brand.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "BK"}-${1000 + bookings.length * 7 + Math.floor(hash(name + dayKey) * 8000)}`;
    const who = name.trim();
    setBookings((b) => [{ id: uid(), what, when, name: who, total, deposit, ref, day: dayKey, start: startMin, end: startMin != null ? startMin + (s.mins ?? 60) : undefined, staff, svc: s.name }, ...b]);
    if (notify.includes("confirm")) push("WhatsApp", who, `Hi ${who.split(" ")[0]}, you're booked with ${brand}: ${what}, ${when}. Ref ${ref}.${deposit ? ` Deposit paid: ${money(deposit)}.` : ""}`);
    if (notify.includes("staff")) push("Email", `${brand} team`, `New booking ${ref}: ${who} · ${what} · ${when}.`);
    if (cfg.mode !== "tickets") {
      if (notify.includes("r24")) push("Scheduled · SMS", who, `Reminder for ${fmtDate(daysFromNow(day))}: ${what} tomorrow${startMin != null ? ` at ${hhmm(startMin)}` : ""}. Reply C to cancel.`);
      if (notify.includes("r2") && startMin != null) push("Scheduled · WhatsApp", who, `See you at ${hhmm(startMin)} today (sent at ${hhmm(Math.max(0, startMin - 120))}).`);
      if (notify.includes("review")) push("Scheduled · Email", who, `After your visit: "How was ${s.name}? Leave a quick review."`);
    }
    setSlot(null); setName(""); setQty(cfg.services.map(() => 0));
  };
  const cancel = (b: Booking) => { setBookings((bs) => bs.filter((x) => x.id !== b.id)); if (notify.includes("confirm")) push("WhatsApp", b.name, `Your booking ${b.ref} (${b.what}) has been cancelled. The time is now free for others.`); };
  const svcCols: RowCol<Svc & { id: string }>[] = [
    { key: "name", label: base.mode === "tickets" ? "Ticket type" : base.mode === "range" ? "Item / room" : "Service", type: "text" },
    ...(base.mode === "slots" || base.mode === "classes" ? [{ key: "mins" as const, label: "Minutes", type: "number" as const, min: 5, step: 5, width: "16%" }] : []),
    ...(base.mode === "classes" ? [{ key: "time" as const, label: "Start (HH:MM)", type: "text" as const, width: "18%" }] : []),
    { key: "price", label: `Price (${cur})${base.unit ? ` / ${base.unit}` : ""}`, type: "number", min: 0, step: 0.5, width: "20%" },
    ...(base.mode === "tickets" || base.mode === "classes" ? [{ key: "cap" as const, label: "Capacity", type: "number" as const, min: 1, width: "14%" }] : []),
  ];
  const latest = bookings[0];

  return (
    <div className="space-y-4">
      <SettingsPanel summary={`${cfg.services.length} ${base.mode === "tickets" ? "ticket types" : "services"}${base.mode === "slots" ? ` · ${hhmm(hours[0] * 60)}–${hhmm(hours[1] * 60)}` : ""}`}>
        <RowsEditor<Svc & { id: string }> label={base.mode === "tickets" ? "Tickets and prices" : "Services, durations and prices"} rows={cfg.services.map((x, i) => ({ ...x, id: x.id ?? `s${i}` }))} cols={svcCols} onChange={(v) => { setServices(v); setSlot(null); }} max={8}
          make={() => ({ id: uid(), name: "New service", mins: base.mode === "slots" || base.mode === "classes" ? 60 : undefined, price: 0, cap: base.mode === "tickets" || base.mode === "classes" ? 10 : undefined, time: base.mode === "classes" ? "17:00" : undefined })} />
        {base.staff && <ListEditor label="Staff or rooms" items={cfg.staff ?? []} onChange={(v) => { setStaffList(v); setSlot(null); }} min={1} max={6} placeholder="e.g. Kemi" />}
        {(base.mode === "slots") && (
          <div className="grid gap-3 sm:grid-cols-4">
            <Select label="Opens" value={String(hours[0])} onChange={(e) => { const v = Number(e.target.value); setHours([v, Math.max(v + 1, hours[1])]); setSlot(null); }} options={Array.from({ length: 18 }, (_, i) => [String(i + 5), hhmm((i + 5) * 60)] as [string, string])} />
            <Select label="Closes" value={String(hours[1])} onChange={(e) => { const v = Number(e.target.value); setHours([Math.min(hours[0], v - 1), v]); setSlot(null); }} options={Array.from({ length: 18 }, (_, i) => [String(i + 7), hhmm((i + 7) * 60)] as [string, string])} />
            <Select label="Slot interval" value={String(interval)} onChange={(e) => { setIntervalMins(Number(e.target.value)); setSlot(null); }} options={[["0", "Auto (by length)"], ["15", "Every 15 min"], ["30", "Every 30 min"], ["60", "Every hour"]]} />
            <Select label="Buffer after each booking" value={String(buffer)} onChange={(e) => setBuffer(Number(e.target.value))} options={[["0", "None"], ["10", "10 min"], ["15", "15 min"], ["30", "30 min"]]} />
          </div>
        )}
        {base.mode !== "tickets" && base.mode !== "range" && <Toggles label="Closed days" options={DAY_NAMES} value={closedDays} onChange={(v) => { setClosedDays(v); setSlot(null); }} />}
        {base.mode !== "tickets" && base.mode !== "classes" && <Field label="Deposit required (%)" type="number" min={0} max={100} value={depositPct} onChange={(e) => setDepositPct(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} className="max-w-[200px]" />}
        <Toggles label="Notifications" options={base.mode === "tickets" ? NOTIFY.filter(([k]) => k === "confirm" || k === "staff") : NOTIFY} value={notify} onChange={setNotify} />
      </SettingsPanel>
      <div className="flex rounded-full border border-border p-0.5 text-xs font-semibold" role="tablist" aria-label="View">
        {(["book", "admin"] as const).map((t) => <button key={t} role="tab" aria-selected={tab === t} type="button" onClick={() => setTab(t)} className={`flex-1 rounded-full px-3 py-1.5 ${tab === t ? "bg-[var(--demo-accent)] text-white" : "text-muted-foreground"}`}>{t === "book" ? "Customer view" : `Staff view (${bookings.length})`}</button>)}
      </div>

      {tab === "book" ? (
        <>
          {cfg.mode !== "tickets" && cfg.mode !== "classes" && (
            <Panel title="1. Choose">
              <div className="grid gap-2 sm:grid-cols-2">
                {cfg.services.map((x, i) => (
                  <button key={x.id ?? x.name} type="button" onClick={() => { setSvc(i); setSlot(null); }} aria-pressed={s === x} className={`rounded-xl border p-3 text-left text-sm transition ${s === x ? "border-[var(--demo-accent)] bg-[color-mix(in_srgb,var(--demo-accent)_8%,transparent)]" : "border-border hover:border-[var(--demo-accent)]"}`}>
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
              <div role="group" aria-label="Days" className="flex gap-1.5 overflow-x-auto pb-1">
                {days.map((d, i) => (
                  <button key={i} type="button" disabled={closed(d)} onClick={() => { setDay(i); setSlot(null); }} aria-pressed={day === i} className={`min-w-[64px] rounded-xl border px-2 py-2 text-center text-xs disabled:opacity-35 ${day === i ? "border-[var(--demo-accent)] bg-[var(--demo-accent)] text-white" : "border-border text-foreground"}`}>
                    <span className="block font-semibold">{d.toLocaleDateString(undefined, { weekday: "short" })}</span>{d.getDate()} {d.toLocaleDateString(undefined, { month: "short" })}{closed(d) && <span className="block text-[10px]">Closed</span>}
                  </button>
                ))}
              </div>
              {cfg.mode === "slots" && (
                <div role="group" aria-label="Available times" className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                  {slots.length === 0 && <p className="col-span-full text-sm text-muted-foreground">No times fit this service within opening hours. Try a shorter service or longer hours.</p>}
                  {slots.map((x) => <button key={x.t} type="button" disabled={!x.free} title={x.why} onClick={() => setSlot(x.t)} aria-pressed={slot === x.t} className={`rounded-lg border px-2 py-1.5 text-sm ${slot === x.t ? "border-[var(--demo-accent)] bg-[var(--demo-accent)] text-white" : x.free ? "border-border hover:border-[var(--demo-accent)]" : "border-border text-muted-foreground line-through opacity-50"}`}>{x.t}</button>)}
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
                    <li key={c.id ?? c.name}><button type="button" disabled={left === 0} onClick={() => setSlot(c.name)} aria-pressed={slot === c.name} className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm ${slot === c.name ? "border-[var(--demo-accent)] bg-[color-mix(in_srgb,var(--demo-accent)_8%,transparent)]" : "border-border"} disabled:opacity-40`}>
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
                  <li key={t.id ?? t.name} className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm">
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
              {cfg.deposit && base.mode !== "tickets" && base.mode !== "classes" ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={payDeposit} onChange={(e) => setPayDeposit(e.target.checked)} className="accent-[var(--demo-accent)]" />Pay a {Math.round(cfg.deposit * 100)}% deposit now to secure it</label> : null}
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
              <p className="mt-2 text-xs text-muted-foreground">See the notification preview below for the messages a live system would send, based on your Demo settings.</p>
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
                  <Btn variant="danger" onClick={() => cancel(b)}>Cancel</Btn>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
      <Outbox items={outbox} onClear={() => setOutbox([])} />
    </div>
  );
}
