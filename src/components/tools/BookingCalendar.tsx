import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, CalendarPlus, ChevronLeft, ChevronRight, Clock, Download, Loader2, MessageCircle } from "lucide-react";
import { BOOKING, buildSlots, calendarLinks } from "@/lib/booking";
import { supabase } from "@/integrations/supabase/client";
import { buildWa } from "@/lib/leads";
import { track } from "@/lib/analytics";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any; rpc: (fn: string, args: Record<string, unknown>) => any };

export default function BookingCalendar() {
  const [days, setDays] = useState(() => buildSlots());
  const [taken, setTaken] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [dayIdx, setDayIdx] = useState(0);
  const [slot, setSlot] = useState<Date | null>(null);
  const [tz, setTz] = useState("your time");
  const [form, setForm] = useState({ name: "", whatsapp: "", email: "", business: "", topic: "" });
  const [state, setState] = useState<"idle" | "saving" | "done" | "error" | "conflict">("idle");

  async function loadTaken() {
    const all = buildSlots();
    setDays(all);
    if (!all.length) { setLoading(false); return; }
    const from = all[0].slots[0].toISOString();
    const to = new Date(all[all.length - 1].slots.at(-1)!.getTime() + 60_000).toISOString();
    const { data } = await db.rpc("booked_slots", { p_from: from, p_to: to });
    setTaken(new Set(((data as string[] | null) || []).map((s) => new Date(s).getTime())));
    setLoading(false);
  }

  useEffect(() => {
    try { setTz(Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, " ")); } catch { /* keep default */ }
    loadTaken();
  }, []);

  const day = days[dayIdx];
  const free = useMemo(() => (day ? day.slots.filter((s) => !taken.has(s.getTime())) : []), [day, taken]);
  const fmtDay = (d: Date) => d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  const fmtTime = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const ownerTime = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: BOOKING.ownerTimezone });

  async function book(e: React.FormEvent) {
    e.preventDefault();
    if (!slot || !form.name.trim() || form.whatsapp.replace(/\D/g, "").length < 6) return;
    setState("saving");
    const { error } = await db.from("strategy_bookings").insert({
      slot_start: slot.toISOString(), timezone: tz.slice(0, 64), name: form.name.trim().slice(0, 120), whatsapp: form.whatsapp.trim().slice(0, 40),
      email: form.email.trim().slice(0, 200) || null, business: form.business.trim().slice(0, 160) || null, topic: form.topic.trim().slice(0, 600) || null,
    });
    if (error) {
      if (error.code === "23505") { setState("conflict"); setTaken((t) => new Set(t).add(slot.getTime())); setSlot(null); return; }
      setState("error");
      return;
    }
    track("call_booked", { daysAhead: Math.round((slot.getTime() - Date.now()) / 86_400_000) });
    setState("done");
  }

  if (state === "done" && slot) {
    const details = `Free ${BOOKING.callLengthLabel} strategy call with Emmanuel (EmmaForYou).${form.topic ? `\nTopic: ${form.topic}` : ""}\nThe call link will be sent on WhatsApp.`;
    const { google, ics } = calendarLinks(slot, "Strategy call · EmmaForYou", details);
    const icsHref = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
    return (
      <div className="rounded-[24px] border border-emerald-500/30 bg-card p-6 shadow-[var(--shadow-card-hover)] md:p-8">
        <p className="flex items-center gap-2 font-display text-2xl font-semibold text-foreground"><CalendarCheck className="h-7 w-7 text-emerald-600" /> You're booked, {form.name.split(" ")[0]}</p>
        <p className="mt-2 text-lg text-foreground">{slot.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })} at {fmtTime(slot)} <span className="text-sm text-muted-foreground">({tz})</span></p>
        <p className="mt-3 text-sm text-muted-foreground">Emmanuel has been notified and will send the call link to your WhatsApp. Add it to your calendar so you get a reminder.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href={google} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:border-[var(--emma-violet)]"><CalendarPlus className="h-4 w-4" /> Google Calendar</a>
          <a href={icsHref} download="emmaforyou-strategy-call.ics" className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:border-[var(--emma-violet)]"><Download className="h-4 w-4" /> Apple / Outlook (.ics)</a>
          <a href={buildWa(`Hi Emmanuel, I just booked a strategy call for ${slot.toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: BOOKING.ownerTimezone })} (your time). My name is ${form.name}${form.business ? ` from ${form.business}` : ""}.`)}
            target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-5 py-2.5 text-sm font-semibold text-white"><MessageCircle className="h-4 w-4" /> Confirm on WhatsApp</a>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="rounded-[24px] border border-border bg-card p-5 shadow-[var(--shadow-card)] md:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Choose a time</h2>
          <p className="text-xs text-muted-foreground">Times shown in {tz}</p>
        </div>
        {loading ? (
          <div className="grid h-60 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : !days.length ? (
          <p className="mt-6 text-sm text-muted-foreground">No times available right now. Message us on WhatsApp instead.</p>
        ) : (
          <>
            <div className="mt-4 flex items-center gap-2">
              <button onClick={() => setDayIdx((i) => Math.max(0, i - 1))} disabled={dayIdx === 0} aria-label="Earlier days" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <div className="flex flex-1 gap-2 overflow-x-auto pb-1" role="listbox" aria-label="Day">
                {days.map((d, i) => {
                  const openCount = d.slots.filter((s) => !taken.has(s.getTime())).length;
                  return (
                    <button key={d.key} role="option" aria-selected={i === dayIdx} disabled={!openCount} onClick={() => { setDayIdx(i); setSlot(null); }}
                      className={`shrink-0 rounded-2xl border px-3 py-2 text-center text-sm transition disabled:opacity-40 ${i === dayIdx ? "border-[var(--emma-violet)] bg-[var(--emma-violet)] text-white" : "border-border hover:border-[var(--emma-violet)]"}`}>
                      <span className="block font-semibold">{fmtDay(d.date)}</span>
                      <span className={`block text-[11px] ${i === dayIdx ? "text-white/80" : "text-muted-foreground"}`}>{openCount ? `${openCount} open` : "Full"}</span>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setDayIdx((i) => Math.min(days.length - 1, i + 1))} disabled={dayIdx >= days.length - 1} aria-label="Later days" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4" role="listbox" aria-label="Time">
              {free.map((s) => (
                <button key={s.getTime()} role="option" aria-selected={slot?.getTime() === s.getTime()} onClick={() => { setSlot(s); setState("idle"); }}
                  className={`rounded-xl border px-2 py-2.5 text-sm font-medium transition ${slot?.getTime() === s.getTime() ? "border-[var(--emma-violet)] bg-[var(--emma-violet)] text-white" : "border-border text-foreground hover:border-[var(--emma-violet)]"}`}>
                  {fmtTime(s)}
                </button>
              ))}
            </div>
            {free.length === 0 && <p className="mt-4 text-sm text-muted-foreground">This day is fully booked. Try another day.</p>}
          </>
        )}
        {state === "conflict" && <p role="alert" className="mt-4 text-sm text-amber-600">Someone just booked that time. Please pick another.</p>}
      </div>

      <form onSubmit={book} className="rounded-[24px] border border-border bg-card p-5 shadow-[var(--shadow-card)] md:p-6">
        <h2 className="font-display text-lg font-semibold">Your details</h2>
        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" />
          {slot ? <>{slot.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}, {fmtTime(slot)} <span className="text-xs">({ownerTime(slot)} Lagos)</span></> : "Pick a time first"}
        </p>
        <div className="mt-4 space-y-3">
          <label className="block text-sm text-muted-foreground">Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} className="roi-input mt-1" /></label>
          <label className="block text-sm text-muted-foreground">WhatsApp number<input required value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} inputMode="tel" maxLength={40} placeholder="+234…" className="roi-input mt-1" /></label>
          <label className="block text-sm text-muted-foreground">Email <span className="text-xs">(optional)</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={200} className="roi-input mt-1" /></label>
          <label className="block text-sm text-muted-foreground">Business <span className="text-xs">(optional)</span><input value={form.business} onChange={(e) => setForm({ ...form, business: e.target.value })} maxLength={160} className="roi-input mt-1" /></label>
          <label className="block text-sm text-muted-foreground">What would you like to discuss? <span className="text-xs">(optional)</span><textarea value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} maxLength={600} rows={3} className="roi-input mt-1" /></label>
        </div>
        <button disabled={!slot || state === "saving" || !form.name.trim() || form.whatsapp.replace(/\D/g, "").length < 6} className="btn-primary-gradient mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white disabled:opacity-50">
          {state === "saving" ? <Loader2 className="h-5 w-5 animate-spin" /> : <CalendarCheck className="h-5 w-5" />} Book my free call
        </button>
        {state === "error" && <p role="alert" className="mt-3 text-sm text-red-600">That didn't go through. Please try again or message us on WhatsApp.</p>}
        <p className="mt-3 text-xs text-muted-foreground">Free, no obligation. We use your number only to send the call link and follow up about your call.</p>
      </form>
    </div>
  );
}
