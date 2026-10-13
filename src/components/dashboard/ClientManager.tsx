import { useEffect, useState } from "react";
import { CalendarClock, Check, Loader2, MessageCircle, Plus, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

interface Account { user_id: string; full_name: string; business_name: string; plan: string; created_at: string }
interface Project { id: string; title: string; status: string; progress_pct: number; next_milestone: string | null; next_milestone_date: string | null }
interface Approval { id: string; title: string; status: string; client_note: string | null; created_at: string }
interface Invoice { id: string; number: string; description: string; amount: number; currency: string; status: string; due_date: string | null }
interface Message { id: string; sender: string; body: string; created_at: string }
interface Task { id: string; label: string; week: number; done: boolean }
interface Booking { id: string; slot_start: string; name: string; whatsapp: string; email: string | null; business: string | null; topic: string | null; status: string; timezone: string | null }

const waHref = (n: string) => {
  let d = n.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("0")) d = `234${d.slice(1)}`;
  return d.length >= 8 ? `https://wa.me/${d}` : null;
};

/* ------------------------------ Upcoming calls ------------------------------ */

export function UpcomingCalls() {
  const [rows, setRows] = useState<Booking[] | null>(null);
  async function load() {
    const { data } = await db.from("strategy_bookings").select("*").gte("slot_start", new Date(Date.now() - 2 * 3600_000).toISOString()).order("slot_start").limit(50);
    setRows((data as Booking[]) || []);
  }
  useEffect(() => { load(); }, []);
  async function setStatus(id: string, status: "done" | "cancelled") {
    await db.from("strategy_bookings").update({ status }).eq("id", id);
    load();
  }
  return (
    <section className="dash-card mt-4">
      <h2 className="dash-h2 flex items-center gap-2"><CalendarClock className="h-4 w-4" /> Upcoming strategy calls</h2>
      <p className="mt-1 text-xs text-muted-foreground">Booked from /book. Times shown in your timezone; send the call link on WhatsApp.</p>
      {!rows ? <div className="mt-4"><Loader2 className="h-4 w-4 animate-spin" /></div> : rows.filter((r) => r.status === "booked").length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No upcoming calls.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {rows.filter((r) => r.status === "booked").map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium">{new Date(b.slot_start).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} · {b.name}{b.business ? ` (${b.business})` : ""}</p>
                <p className="text-xs text-muted-foreground">{b.topic || "No topic given"}{b.timezone ? ` · their timezone: ${b.timezone}` : ""}</p>
              </div>
              <div className="flex gap-1.5">
                {waHref(b.whatsapp) && <a className="dash-icon-btn" href={`${waHref(b.whatsapp)}?text=${encodeURIComponent(`Hi ${b.name.split(" ")[0]}, this is Emmanuel from EmmaForYou. Here's the link for our call: `)}`} target="_blank" rel="noopener noreferrer" aria-label={`Send call link to ${b.name}`} title="Send call link on WhatsApp"><MessageCircle className="h-4 w-4" /></a>}
                <button className="dash-icon-btn" onClick={() => setStatus(b.id, "done")} aria-label="Mark as done" title="Mark as done"><Check className="h-4 w-4" /></button>
                <button className="dash-icon-btn" onClick={() => setStatus(b.id, "cancelled")} aria-label="Cancel booking" title="Cancel (frees the slot)"><X className="h-4 w-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------ Client manager ------------------------------ */

export function ClientManager() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [sel, setSel] = useState<string>("");
  useEffect(() => {
    db.from("client_accounts").select("user_id,full_name,business_name,plan,created_at").order("created_at", { ascending: false }).then(({ data }: { data: Account[] | null }) => {
      setAccounts(data || []);
      if (data?.[0]) setSel(data[0].user_id);
    });
  }, []);
  const acc = accounts?.find((a) => a.user_id === sel);

  return (
    <section className="dash-card mt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="dash-h2">Clients</h2>
          <p className="mt-1 text-xs text-muted-foreground">What each client sees in their portal (/portal). Clients appear here once they create a portal account.</p>
        </div>
        {accounts && accounts.length > 0 && (
          <label className="text-xs text-muted-foreground">Client{" "}
            <select value={sel} onChange={(e) => setSel(e.target.value)} className="ml-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground">
              {accounts.map((a) => <option key={a.user_id} value={a.user_id}>{a.business_name} · {a.full_name}</option>)}
            </select>
          </label>
        )}
      </div>
      {!accounts ? <div className="mt-4"><Loader2 className="h-4 w-4 animate-spin" /></div> : !acc ? (
        <p className="mt-4 text-sm text-muted-foreground">No client accounts yet. Send clients to /portal to create one.</p>
      ) : (
        <ClientDetail key={acc.user_id} acc={acc} />
      )}
    </section>
  );
}

function ClientDetail({ acc }: { acc: Account }) {
  const uid = acc.user_id;
  const [projects, setProjects] = useState<Project[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    const [p, a, i, m, t] = await Promise.all([
      db.from("client_projects").select("*").eq("client_user_id", uid).order("created_at", { ascending: false }),
      db.from("client_approvals").select("*").eq("client_user_id", uid).order("created_at", { ascending: false }),
      db.from("client_invoices").select("*").eq("client_user_id", uid).order("created_at", { ascending: false }),
      db.from("client_messages").select("*").eq("client_user_id", uid).order("created_at"),
      db.from("client_tasks").select("*").eq("client_user_id", uid).order("week"),
    ]);
    setProjects(p.data || []); setApprovals(a.data || []); setInvoices(i.data || []); setMessages(m.data || []); setTasks(t.data || []);
  }
  useEffect(() => { load(); }, [uid]);

  async function run(promise: Promise<{ error: { message: string } | null }>) {
    setErr("");
    const { error } = await promise;
    if (error) setErr(error.message);
    await load();
  }

  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      {err && <p className="col-span-full rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm">{err}</p>}

      <Panel title="Projects">
        {projects.map((p) => (
          <div key={p.id} className="rounded-xl border border-border p-3 text-sm">
            <p className="font-medium">{p.title}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input type="range" min={0} max={100} step={5} defaultValue={p.progress_pct} aria-label="Progress"
                onMouseUp={(e) => run(db.from("client_projects").update({ progress_pct: Number((e.target as HTMLInputElement).value) }).eq("id", p.id))}
                onTouchEnd={(e) => run(db.from("client_projects").update({ progress_pct: Number((e.target as HTMLInputElement).value) }).eq("id", p.id))} />
              <span className="text-xs text-muted-foreground">{p.progress_pct}%</span>
              <select defaultValue={p.status} onChange={(e) => run(db.from("client_projects").update({ status: e.target.value }).eq("id", p.id))} className="rounded-md border border-border bg-background px-1.5 py-1 text-xs">
                {["planning", "in_progress", "review", "live", "paused"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </div>
            <InlineForm key={`${p.id}-${p.next_milestone}-${p.next_milestone_date}`} fields={[{ name: "next_milestone", placeholder: "Next milestone", value: p.next_milestone || "" }, { name: "next_milestone_date", type: "date", value: p.next_milestone_date || "" }]} submit="Save"
              onSubmit={(v) => run(db.from("client_projects").update({ next_milestone: v.next_milestone || null, next_milestone_date: v.next_milestone_date || null }).eq("id", p.id))} />
          </div>
        ))}
        <InlineForm fields={[{ name: "title", placeholder: "New project, e.g. Website rebuild", required: true }]} submit="Add project"
          onSubmit={(v) => run(db.from("client_projects").insert({ client_user_id: uid, title: v.title, status: "planning", progress_pct: 0 }))} />
      </Panel>

      <Panel title="Approvals">
        {approvals.map((a) => (
          <p key={a.id} className="flex justify-between gap-2 text-sm"><span>{a.title}{a.client_note ? <span className="block text-xs text-muted-foreground">“{a.client_note}”</span> : null}</span>
            <span className={`h-fit shrink-0 rounded-full px-2 py-0.5 text-xs ${a.status === "approved" ? "bg-emerald-500/10 text-emerald-600" : a.status === "changes_requested" ? "bg-amber-500/10 text-amber-600" : "bg-muted"}`}>{a.status.replace("_", " ")}</span></p>
        ))}
        <InlineForm fields={[{ name: "title", placeholder: "What to approve, e.g. Homepage design v2", required: true }, { name: "preview_url", placeholder: "https:// preview link (optional)" }, { name: "details", placeholder: "Notes for the client (optional)" }]} submit="Send for approval"
          onSubmit={(v) => run(db.from("client_approvals").insert({ client_user_id: uid, title: v.title, preview_url: v.preview_url || null, details: v.details || null }))} />
      </Panel>

      <Panel title="Invoices">
        {invoices.map((i) => (
          <div key={i.id} className="flex items-center justify-between gap-2 text-sm">
            <span>{i.number} · {i.description} · <strong>{i.currency} {Number(i.amount).toLocaleString()}</strong></span>
            {i.status === "unpaid" ? <button onClick={() => run(db.from("client_invoices").update({ status: "paid" }).eq("id", i.id))} className="rounded-full border border-border px-2.5 py-1 text-xs hover:bg-muted">Mark paid</button>
              : <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{i.status}</span>}
          </div>
        ))}
        <InlineForm fields={[{ name: "number", placeholder: "INV-001", required: true }, { name: "description", placeholder: "Description", required: true }, { name: "amount", placeholder: "Amount", type: "number", required: true }, { name: "currency", placeholder: "USD", value: "USD" }, { name: "due_date", type: "date" }, { name: "pay_url", placeholder: "https:// payment link (optional)" }]} submit="Add invoice"
          onSubmit={(v) => run(db.from("client_invoices").insert({ client_user_id: uid, number: v.number, description: v.description, amount: Number(v.amount), currency: (v.currency || "USD").toUpperCase().slice(0, 3), due_date: v.due_date || null, pay_url: v.pay_url || null }))} />
      </Panel>

      <Panel title="Tasks for the client">
        {tasks.map((t) => <p key={t.id} className={`text-sm ${t.done ? "text-muted-foreground line-through" : ""}`}>Week {t.week}: {t.label}</p>)}
        <InlineForm fields={[{ name: "week", placeholder: "Week", type: "number", value: "1" }, { name: "label", placeholder: "e.g. Send us your logo files", required: true }]} submit="Add task"
          onSubmit={(v) => run(db.from("client_tasks").insert({ client_user_id: uid, week: Math.max(1, Number(v.week) || 1), label: v.label }))} />
      </Panel>

      <div className="rounded-2xl border border-border p-4 lg:col-span-2">
        <h3 className="text-sm font-semibold">Messages with {acc.full_name}</h3>
        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
          {messages.length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
          {messages.map((m) => (
            <div key={m.id} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.sender === "team" ? "ml-auto bg-foreground text-background" : "bg-muted"}`}>
              {m.body}<span className="mt-0.5 block text-[10px] opacity-70">{new Date(m.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (!msg.trim()) return; const body = msg.trim(); setMsg(""); run(db.from("client_messages").insert({ client_user_id: uid, sender: "team", body })); }} className="mt-3 flex gap-2">
          <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Reply as EmmaForYou…" className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm" />
          <button className="dash-icon-btn" aria-label="Send reply"><Send className="h-4 w-4" /></button>
        </form>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="space-y-2.5 rounded-2xl border border-border p-4"><h3 className="text-sm font-semibold">{title}</h3>{children}</div>;
}

function InlineForm({ fields, submit, onSubmit }: { fields: { name: string; placeholder?: string; type?: string; required?: boolean; value?: string }[]; submit: string; onSubmit: (v: Record<string, string>) => void }) {
  const [v, setV] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((f) => [f.name, f.value || ""])));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(v); setV(Object.fromEntries(fields.map((f) => [f.name, f.value || ""]))); }} className="flex flex-wrap gap-1.5 pt-1">
      {fields.map((f) => (
        <input key={f.name} type={f.type || "text"} required={f.required} placeholder={f.placeholder} aria-label={f.placeholder || f.name} value={v[f.name]} step={f.type === "number" ? "any" : undefined}
          onChange={(e) => setV({ ...v, [f.name]: e.target.value })} className="min-w-0 flex-1 basis-32 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs" />
      ))}
      <button className="inline-flex items-center gap-1 rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background"><Plus className="h-3.5 w-3.5" />{submit}</button>
    </form>
  );
}
