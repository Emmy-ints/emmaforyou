import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/portal")({
  component: Portal,
  head: () =>
    pageHead({
      title: "Client Portal — EmmaForYou",
      description: "Sign in to the EmmaForYou client portal.",
      path: "/portal",
      noindex: true,
    }),
});

interface Project { id: string; title: string; progress_pct: number; status: string; next_milestone: string | null; next_milestone_date: string | null; metrics: Record<string, unknown> }
interface Task { id: string; label: string; week: number; done: boolean }
interface Message { id: string; sender: string; body: string; created_at: string }
interface Approval { id: string; title: string; details: string | null; preview_url: string | null; status: "pending" | "approved" | "changes_requested"; client_note: string | null; decided_at: string | null; created_at: string }
interface Invoice { id: string; number: string; description: string; amount: number; currency: string; status: "unpaid" | "paid" | "void"; due_date: string | null; pay_url: string | null; created_at: string }
interface FileRow { id: string; file_name: string; category: string | null; size_kb: number | null; storage_url: string | null; created_at: string }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdb = supabase as unknown as { from: (t: string) => any; rpc: (fn: string, args: Record<string, unknown>) => any };
const money = (n: number, c: string) => { try { return new Intl.NumberFormat(undefined, { style: "currency", currency: c }).format(n); } catch { return `${c} ${n}`; } };
interface ClientAcc { id: string; full_name: string; business_name: string; avatar_initials: string | null; manager_name: string | null; plan: string; start_date: string }

function Portal() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="text-sm text-muted-foreground">Loading…</div></div>;
  return session ? <PortalDashboard userId={session.user.id} email={session.user.email || ""} /> : <AuthScreen />;
}

function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setInfo("");
    setBusy(true);
    try {
      if (mode === "signup") {
        const redirectUrl = `${window.location.origin}/portal`;
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: redirectUrl,
            data: { full_name: fullName, business_name: businessName },
          },
        });
        if (error) throw error;
        setInfo("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Auth error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex min-h-[80vh] items-center justify-center pt-32 pb-20">
        <div className="w-full max-w-md px-5">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <div className="text-center">
              <h1 className="font-display text-3xl font-extrabold">Client Portal</h1>
              <p className="mt-2 text-sm text-muted-foreground">{mode === "login" ? "Welcome back" : "Create your account"}</p>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-3">
              {mode === "signup" && (
                <>
                  <input className="input" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  <input className="input" placeholder="Business name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
                </>
              )}
              <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              {err && <p className="text-sm text-destructive">{err}</p>}
              {info && <p className="text-sm text-green-600">{info}</p>}
              <button disabled={busy} className="btn-primary-gradient inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white disabled:opacity-60">
                {busy ? "Working..." : mode === "login" ? "Log in" : "Create account"}
              </button>
            </form>

            <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); setInfo(""); }} className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground">
              {mode === "login" ? "No account? Create one" : "Already have an account? Log in"}
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            New here? <Link to="/intake" className="underline">Start with our intake form</Link>
          </p>
        </div>
      </main>
      <Footer />
      <style>{`.input { display:block; width:100%; padding:0.625rem 0.875rem; border-radius:0.75rem; background: hsl(var(--background)); border:1px solid hsl(var(--border)); color: inherit; font-size:0.95rem; }`}</style>
    </div>
  );
}

function PortalDashboard({ userId, email }: { userId: string; email: string }) {
  const [account, setAccount] = useState<ClientAcc | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [reply, setReply] = useState("");
  const [tab, setTab] = useState<"overview" | "approvals" | "invoices" | "tasks" | "messages" | "files">("overview");

  useEffect(() => {
    (async () => {
      const [{ data: acc }, { data: proj }, { data: tk }, { data: msg }] = await Promise.all([
        supabase.from("client_accounts").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("client_projects").select("*").eq("client_user_id", userId).order("created_at", { ascending: false }),
        supabase.from("client_tasks").select("*").eq("client_user_id", userId).order("week"),
        supabase.from("client_messages").select("*").eq("client_user_id", userId).order("created_at"),
      ]);
      setAccount(acc as ClientAcc | null);
      setProjects((proj as Project[]) || []);
      setTasks((tk as Task[]) || []);
      setMessages((msg as Message[]) || []);
      const [{ data: ap }, { data: inv }, { data: fl }] = await Promise.all([
        pdb.from("client_approvals").select("*").eq("client_user_id", userId).order("created_at", { ascending: false }),
        pdb.from("client_invoices").select("*").eq("client_user_id", userId).neq("status", "void").order("created_at", { ascending: false }),
        pdb.from("client_files").select("*").eq("client_user_id", userId).order("created_at", { ascending: false }),
      ]);
      setApprovals((ap as Approval[]) || []);
      setInvoices((inv as Invoice[]) || []);
      setFiles((fl as FileRow[]) || []);
    })();
  }, [userId]);

  // Keep the conversation fresh while it's open.
  useEffect(() => {
    if (tab !== "messages") return;
    const id = window.setInterval(async () => {
      const { data } = await supabase.from("client_messages").select("*").eq("client_user_id", userId).order("created_at");
      if (data) setMessages(data as Message[]);
    }, 15000);
    return () => window.clearInterval(id);
  }, [tab, userId]);

  async function decide(a: Approval, status: "approved" | "changes_requested", note: string) {
    const { error } = await pdb.rpc("decide_approval", { p_id: a.id, p_status: status, p_note: note });
    if (error) return false;
    setApprovals((prev) => prev.map((x) => (x.id === a.id ? { ...x, status, client_note: note || null, decided_at: new Date().toISOString() } : x)));
    const { data } = await supabase.from("client_messages").select("*").eq("client_user_id", userId).order("created_at");
    if (data) setMessages(data as Message[]);
    return true;
  }

  const pendingApprovals = approvals.filter((a) => a.status === "pending").length;
  const unpaid = invoices.filter((i) => i.status === "unpaid");

  async function logout() { await supabase.auth.signOut(); }

  async function toggleTask(t: Task) {
    const next = !t.done;
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, done: next } : x)));
    await supabase.from("client_tasks").update({ done: next }).eq("id", t.id);
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    const body = reply.trim();
    setReply("");
    const { data } = await supabase.from("client_messages").insert({ client_user_id: userId, body, sender: "client" }).select().single();
    if (data) setMessages((prev) => [...prev, data as Message]);
  }

  const initials = account?.avatar_initials || email.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-32 pb-24">
        <section className="mx-auto max-w-6xl px-5">
          {/* Hero */}
          <div className="rounded-3xl p-1" style={{ background: "var(--gradient-brand)" }}>
            <div className="rounded-[22px] bg-card p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white" style={{ background: "var(--gradient-hero-cta)" }}>{initials}</div>
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Welcome back</p>
                  <h1 className="font-display text-2xl font-extrabold md:text-3xl">{account?.full_name || email.split("@")[0]}</h1>
                  <p className="text-sm text-muted-foreground">{account?.business_name} · {account?.plan} plan · Manager: {account?.manager_name || "Emmanuel"}</p>
                </div>
                <button onClick={logout} className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Log out</button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8 flex gap-2 overflow-x-auto">
            {(["overview", "approvals", "invoices", "tasks", "messages", "files"] as const).map((t) => {
              const badge = t === "approvals" ? pendingApprovals : t === "invoices" ? unpaid.length : 0;
              return (
                <button key={t} onClick={() => setTab(t)} className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-medium capitalize transition ${tab === t ? "bg-foreground text-background" : "border border-border bg-card text-muted-foreground hover:text-foreground"}`}>
                  {t}{badge > 0 && <span className="ml-1.5 rounded-full bg-[var(--emma-violet)] px-1.5 py-0.5 text-[10px] font-bold text-white">{badge}</span>}
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            {tab === "overview" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="col-span-full grid gap-3 sm:grid-cols-4">
                  {[
                    { label: "Projects", value: projects.length, to: "overview" as const },
                    { label: "Awaiting your approval", value: pendingApprovals, to: "approvals" as const },
                    { label: "Unpaid invoices", value: unpaid.length, to: "invoices" as const },
                    { label: "Tasks done", value: `${tasks.filter((t) => t.done).length}/${tasks.length}`, to: "tasks" as const },
                  ].map((k) => (
                    <button key={k.label} onClick={() => setTab(k.to)} className="rounded-2xl border border-border bg-card p-4 text-left hover:border-[var(--emma-violet)]">
                      <p className="text-xs text-muted-foreground">{k.label}</p>
                      <p className="mt-1 font-display text-2xl font-semibold">{k.value}</p>
                    </button>
                  ))}
                </div>
                {projects.length === 0 && (
                  <div className="col-span-full rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    No projects yet. Your manager will set one up after kickoff.
                  </div>
                )}
                {projects.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg font-bold">{p.title}</h3>
                      <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-wider">{p.status.replace(/_/g, " ")}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full" style={{ width: `${p.progress_pct}%`, background: "var(--gradient-hero-cta)" }} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{p.progress_pct}% complete</p>
                    {p.next_milestone && (
                      <p className="mt-3 text-sm"><strong>Next:</strong> {p.next_milestone} <span className="text-muted-foreground">{p.next_milestone_date && `· ${p.next_milestone_date}`}</span></p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tab === "tasks" && (
              <div className="space-y-2">
                {tasks.length === 0 && <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No tasks assigned yet.</div>}
                {tasks.map((t) => (
                  <label key={t.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
                    <input type="checkbox" checked={t.done} onChange={() => toggleTask(t)} className="h-5 w-5" />
                    <span className={`flex-1 text-sm ${t.done ? "text-muted-foreground line-through" : ""}`}>{t.label}</span>
                    <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-wider">Week {t.week}</span>
                  </label>
                ))}
              </div>
            )}

            {tab === "messages" && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="space-y-3">
                  {messages.length === 0 && <p className="text-center text-sm text-muted-foreground">No messages yet — say hi to your manager 👋</p>}
                  {messages.map((m) => (
                    <div key={m.id} className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.sender === "client" ? "ml-auto bg-foreground text-background" : "bg-muted text-foreground"}`}>
                      <p>{m.body}</p>
                      <p className={`mt-1 text-[10px] ${m.sender === "client" ? "text-background/70" : "text-muted-foreground"}`}>{new Date(m.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <form onSubmit={sendReply} className="mt-4 flex gap-2">
                  <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type a message..." className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm" />
                  <button className="btn-primary-gradient rounded-full px-5 py-2 text-sm font-semibold text-white">Send</button>
                </form>
              </div>
            )}

            {tab === "approvals" && (
              <div className="space-y-4">
                {approvals.length === 0 && <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nothing to review yet. Designs, copy and campaigns for your sign-off will appear here.</div>}
                {approvals.map((a) => <ApprovalCard key={a.id} a={a} onDecide={decide} />)}
              </div>
            )}

            {tab === "invoices" && (
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                {invoices.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No invoices yet.</p> : (
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Invoice</th><th className="px-4 py-3 font-medium">Amount</th><th className="hidden px-4 py-3 font-medium sm:table-cell">Due</th><th className="px-4 py-3 font-medium">Status</th></tr></thead>
                    <tbody>
                      {invoices.map((i) => (
                        <tr key={i.id} className="border-t border-border">
                          <td className="px-4 py-3"><p className="font-medium">{i.number}</p><p className="text-xs text-muted-foreground">{i.description}</p></td>
                          <td className="px-4 py-3 font-semibold">{money(Number(i.amount), i.currency)}</td>
                          <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{i.due_date ? new Date(i.due_date).toLocaleDateString() : "—"}</td>
                          <td className="px-4 py-3">
                            {i.status === "paid" ? <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600">Paid</span>
                              : i.pay_url ? <a href={i.pay_url} target="_blank" rel="noopener noreferrer" className="btn-primary-gradient inline-block rounded-full px-4 py-1.5 text-xs font-semibold text-white">Pay now</a>
                              : <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600">Unpaid</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {tab === "files" && (
              files.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">Files shared by your manager will appear here.</div>
              ) : (
                <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                  {files.map((f) => (
                    <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div><p className="font-medium">{f.file_name}</p><p className="text-xs text-muted-foreground">{[f.category, f.size_kb ? `${f.size_kb} KB` : null, new Date(f.created_at).toLocaleDateString()].filter(Boolean).join(" · ")}</p></div>
                      {f.storage_url && /^https:\/\//.test(f.storage_url) && <a href={f.storage_url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:border-[var(--emma-violet)]">Open</a>}
                    </li>
                  ))}
                </ul>
              )
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function ApprovalCard({ a, onDecide }: { a: Approval; onDecide: (a: Approval, s: "approved" | "changes_requested", note: string) => Promise<boolean> }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function go(status: "approved" | "changes_requested") {
    if (status === "changes_requested" && !note.trim()) { setErr("Tell us what to change."); return; }
    setBusy(true); setErr("");
    const ok = await onDecide(a, status, note);
    if (!ok) setErr("That didn't save. Please try again.");
    setBusy(false);
  }
  const tone = a.status === "approved" ? "bg-emerald-500/10 text-emerald-600" : a.status === "changes_requested" ? "bg-amber-500/10 text-amber-600" : "bg-[var(--emma-violet)]/10 text-[var(--emma-violet)]";
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">{a.title}</h3>
          <p className="text-xs text-muted-foreground">Shared {new Date(a.created_at).toLocaleDateString()}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${tone}`}>{a.status === "pending" ? "Awaiting you" : a.status === "approved" ? "Approved" : "Changes requested"}</span>
      </div>
      {a.details && <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{a.details}</p>}
      {a.preview_url && <a href={a.preview_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-[var(--emma-violet)] underline-offset-4 hover:underline">Open preview ↗</a>}
      {a.status === "pending" ? (
        <div className="mt-4">
          <label className="text-xs text-muted-foreground">Comments (required if you want changes)
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => go("approved")} className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">Approve</button>
            <button disabled={busy} onClick={() => go("changes_requested")} className="rounded-full border border-border px-5 py-2 text-sm font-semibold hover:border-[var(--emma-violet)] disabled:opacity-50">Request changes</button>
          </div>
          {err && <p role="alert" className="mt-2 text-sm text-red-600">{err}</p>}
        </div>
      ) : a.client_note ? <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-sm">Your note: {a.client_note}</p> : null}
    </div>
  );
}
