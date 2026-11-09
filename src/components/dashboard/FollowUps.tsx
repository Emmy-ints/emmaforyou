import { useEffect, useMemo, useState } from "react";
import { Check, Mail, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { STEPS, mailLink, messageFor, plan, waLink, waNumber, type FollowLead, type FollowState, type Outcome } from "@/lib/followups";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

const OUTCOMES: { id: Outcome; label: string }[] = [
  { id: "replied", label: "Replied" },
  { id: "booked", label: "Booked a call" },
  { id: "won", label: "Became a client" },
  { id: "lost", label: "Not interested" },
];

const ago = (iso: string) => {
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000);
  return h < 1 ? "just now" : h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
};

/**
 * WhatsApp follow-ups after a tool or form: the next message for each lead, ready to send from your own WhatsApp
 * in one tap. Mark it sent and the next step comes back when it's due (thank-you now, nudge after 2 days,
 * last check-in 5 days later). Progress is saved in lead_followups (staff only).
 */
export function FollowUps({ leads, loading }: { leads: FollowLead[]; loading: boolean }) {
  const [states, setStates] = useState<Record<string, FollowState>>({});
  const [view, setView] = useState<"due" | "waiting" | "done">("due");
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const site = typeof window !== "undefined" ? window.location.origin : undefined;

  const reachable = useMemo(() => leads.filter((l) => waNumber(l.whatsapp).ok || l.email?.includes("@")), [leads]);
  useEffect(() => {
    if (!reachable.length) return;
    let alive = true;
    const keys = reachable.map((l) => l.id);
    (async () => {
      const out: Record<string, FollowState> = {};
      for (let i = 0; i < keys.length; i += 150) {
        const { data, error } = await db.from("lead_followups").select("lead_key,step,outcome,last_sent_at,note").in("lead_key", keys.slice(i, i + 150));
        if (error) { if (alive) setErr("Follow-up progress couldn't be loaded."); return; }
        for (const r of (data ?? []) as FollowState[]) out[r.lead_key] = r;
      }
      if (alive) setStates(out);
    })();
    return () => { alive = false; };
  }, [reachable]);

  const rows = useMemo(() => {
    const now = new Date();
    return reachable.map((l) => ({ l, s: states[l.id], p: plan(l, states[l.id], now) }));
  }, [reachable, states]);
  const counts = { due: rows.filter((r) => r.p.bucket === "due").length, waiting: rows.filter((r) => r.p.bucket === "waiting").length, done: rows.filter((r) => r.p.bucket === "done").length };
  const list = rows.filter((r) => r.p.bucket === view).sort((a, b) => (a.p.dueAt?.getTime() ?? 0) - (b.p.dueAt?.getTime() ?? 0) || b.l.created_at.localeCompare(a.l.created_at));

  async function save(key: string, patch: Partial<FollowState>) {
    setErr("");
    const prev = states[key];
    const next: FollowState = { lead_key: key, step: prev?.step ?? 0, outcome: prev?.outcome ?? "open", last_sent_at: prev?.last_sent_at ?? null, note: prev?.note ?? null, ...patch };
    setStates((s) => ({ ...s, [key]: next }));
    const { error } = await db.from("lead_followups").upsert({ lead_key: key, step: next.step, outcome: next.outcome, last_sent_at: next.last_sent_at, note: next.note ?? null }, { onConflict: "lead_key" });
    if (error) { setErr("That change wasn't saved. Check your connection and try again."); setStates((s) => ({ ...s, [key]: prev as FollowState })); }
  }

  return (
    <section className="dash-card mt-4" aria-labelledby="fu-title" data-followups>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="fu-title" className="dash-h2">WhatsApp follow-ups</h2>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">Everyone who used a tool or left their details. Each message is written from what they gave you; tap to open it in WhatsApp, send it from your phone, then mark it sent. The next step comes back when it's due.</p>
        </div>
        <div className="dash-segment" role="group" aria-label="Follow-up list">
          {(["due", "waiting", "done"] as const).map((v) => (
            <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>{v === "due" ? "Due now" : v === "waiting" ? "Waiting" : "Done"} ({counts[v]})</button>
          ))}
        </div>
      </div>
      {err && <p role="alert" className="mt-3 text-xs text-red-600">{err}</p>}
      {list.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{loading ? "Loading…" : view === "due" ? "Nothing due right now." : "Nothing here yet."}</p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {list.map(({ l, s, p }) => {
            const step = p.nextStep;
            const n = waNumber(l.whatsapp);
            const text = step ? drafts[`${l.id}:${step}`] ?? messageFor(l, step, site) : "";
            const wa = step && n.ok ? `https://wa.me/${n.digits}?text=${encodeURIComponent(text)}` : null;
            const mail = step ? mailLink({ ...l }, step, site) : null;
            const isOpen = open === l.id;
            return (
              <li key={l.id} className="rounded-2xl border border-border p-4" data-followup={l.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{l.name || "—"} <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-normal">{l.kind}</span>{l.meta?.temperature && <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-semibold fu-${l.meta.temperature}`}>{l.meta.temperature}</span>}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{ago(l.created_at)}{l.business ? ` · ${l.business}` : ""}{l.whatsapp ? ` · ${l.whatsapp}` : ""}{n.note && l.whatsapp ? ` · ${n.note}` : ""}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {step ? <>Step {step} of 3 · {STEPS[step - 1].name}{p.bucket === "waiting" && p.dueAt ? <><br />due {p.dueAt.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</> : null}</> : <>Finished · {OUTCOMES.find((o) => o.id === s?.outcome)?.label ?? "all 3 steps sent"}</>}
                  </div>
                </div>
                {step && (
                  <>
                    {isOpen ? (
                      <label className="mt-3 block text-xs font-medium" htmlFor={`fu-${l.id}`}>Message (edit before sending)
                        <textarea id={`fu-${l.id}`} rows={4} value={text} onChange={(e) => setDrafts((d) => ({ ...d, [`${l.id}:${step}`]: e.target.value }))} className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-sm" />
                      </label>
                    ) : (
                      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{text}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#25d366] px-4 py-2 text-xs font-semibold text-white"><MessageCircle className="h-3.5 w-3.5" /> Open in WhatsApp</a>}
                      {!wa && mail && <a href={mail} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold"><Mail className="h-3.5 w-3.5" /> Open email</a>}
                      <button type="button" onClick={() => save(l.id, { step, last_sent_at: new Date().toISOString() })} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"><Check className="h-3.5 w-3.5" /> Mark step {step} sent</button>
                      <button type="button" onClick={() => setOpen(isOpen ? null : l.id)} className="rounded-full px-3 py-2 text-xs text-muted-foreground hover:bg-muted">{isOpen ? "Hide" : "Edit message"}</button>
                      <label className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground" htmlFor={`fu-out-${l.id}`}>Outcome
                        <select id={`fu-out-${l.id}`} value={s?.outcome ?? "open"} onChange={(e) => save(l.id, { outcome: e.target.value as Outcome })} className="rounded-full border border-border bg-background px-2 py-1 text-xs">
                          <option value="open">Still following up</option>
                          {OUTCOMES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                        </select>
                      </label>
                    </div>
                  </>
                )}
                {!step && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <button type="button" onClick={() => save(l.id, { outcome: "open", step: Math.min(s?.step ?? 0, 2) })} className="rounded-full border border-border px-3 py-1.5 hover:bg-muted">Reopen</button>
                    {waLink(l, 3, site) && <a href={`https://wa.me/${n.digits}`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-border px-3 py-1.5 hover:bg-muted">Open chat</a>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
