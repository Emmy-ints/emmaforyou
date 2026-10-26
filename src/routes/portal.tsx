import { createFileRoute, Link } from "@tanstack/react-router";
import { KineticText } from "@/components/future/Kinetic";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { pageHead } from "@/lib/seo";
import { track } from "@/lib/analytics";
import AccountAuthForm from "@/components/auth/AccountAuthForm";

/** Optional: the owner's Google review link (Google Business Profile → "Ask for reviews"). Leave empty to hide. */
const GOOGLE_REVIEW_URL = "";

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
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      setSession(sess);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className="dash-x min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content" className="flex min-h-[80vh] items-center justify-center pt-32 pb-20" aria-busy="true">
        <h1 className="sr-only">Client Portal</h1>
        <p role="status" className="text-sm text-muted-foreground">Loading your portal…</p>
      </main>
    </div>
  );
  if (session && recovering) return <NewPassword onDone={() => setRecovering(false)} />;
  return session ? <PortalDashboard userId={session.user.id} email={session.user.email || ""} /> : <AuthScreen />;
}

function AuthScreen() {
  // The shared EmmaForYou sign-in: the same account and session as the community and dashboard.
  return (
    <div className="dash-x min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content" className="flex min-h-[80vh] items-center justify-center pt-32 pb-20">
        <div className="w-full max-w-md px-5">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-5 text-center">
              <h1 className="font-display text-3xl font-extrabold"><KineticText text="Client Portal" base={60} /></h1>
              <p className="mt-2 text-sm text-muted-foreground">Track your project, approve work, pay invoices and message the team. Already in the community? Use the same email and password.</p>
            </div>
            <AccountAuthForm intent="portal" next="/portal" idPrefix="portal-auth" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function PortalDashboard({ userId, email }: { userId: string; email: string }) {
  const [account, setAccount] = useState<ClientAcc | null>(null);
  const [accountChecked, setAccountChecked] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState("");
  const [actName, setActName] = useState("");
  const [actBiz, setActBiz] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [reply, setReply] = useState("");
  const [tab, setTab] = useState<"overview" | "approvals" | "invoices" | "tasks" | "messages" | "files" | "settings">("overview");
  const [uploading, setUploading] = useState(false);
  const [fileErr, setFileErr] = useState("");
  const [request, setRequest] = useState("");
  const [requestSent, setRequestSent] = useState(false);

  async function uploadFile(file: File | undefined) {
    if (!file) return;
    setFileErr("");
    if (file.size > 20 * 1024 * 1024) { setFileErr("Files must be under 20 MB."); return; }
    setUploading(true);
    const path = `${userId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_").slice(-80)}`;
    const { error } = await supabase.storage.from("client-files").upload(path, file, { contentType: file.type || undefined });
    if (error) { setFileErr("Upload failed. Please try again."); setUploading(false); return; }
    const { data } = await pdb.from("client_files").insert({ client_user_id: userId, file_name: file.name.slice(0, 200), size_kb: Math.max(1, Math.round(file.size / 1024)), category: "From you", storage_url: path, uploaded_by: "client" }).select().single();
    if (data) setFiles((prev) => [data as FileRow, ...prev]);
    await supabase.from("client_messages").insert({ client_user_id: userId, sender: "client", body: `📎 Uploaded a file: ${file.name}` });
    setUploading(false);
  }

  async function openFile(f: FileRow) {
    if (!f.storage_url) return;
    if (/^https:\/\//.test(f.storage_url)) { window.open(f.storage_url, "_blank", "noopener"); return; }
    const { data } = await supabase.storage.from("client-files").createSignedUrl(f.storage_url, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  }

  async function sendRequest(e: React.FormEvent) {
    e.preventDefault();
    const body = request.trim();
    if (!body) return;
    const { data } = await supabase.from("client_messages").insert({ client_user_id: userId, body: `📌 New request: ${body}`, sender: "client" }).select().single();
    if (data) setMessages((prev) => [...prev, data as Message]);
    setRequest("");
    setRequestSent(true);
  }

  useEffect(() => {
    (async () => {
      const [{ data: acc }, { data: proj }, { data: tk }, { data: msg }] = await Promise.all([
        supabase.from("client_accounts").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("client_projects").select("*").eq("client_user_id", userId).order("created_at", { ascending: false }),
        supabase.from("client_tasks").select("*").eq("client_user_id", userId).order("week"),
        supabase.from("client_messages").select("*").eq("client_user_id", userId).order("created_at"),
      ]);
      setAccount(acc as ClientAcc | null);
      setAccountChecked(true);
      setProjects((proj as Project[]) || []);
      setTasks((tk as Task[]) || []);
      setMessages((msg as Message[]) || []);
      const [{ data: ap }, { data: inv }, { data: fl }, { data: rv }] = await Promise.all([
        pdb.from("client_approvals").select("*").eq("client_user_id", userId).order("created_at", { ascending: false }),
        pdb.from("client_invoices").select("*").eq("client_user_id", userId).neq("status", "void").order("created_at", { ascending: false }),
        pdb.from("client_files").select("*").eq("client_user_id", userId).order("created_at", { ascending: false }),
        pdb.from("client_testimonials").select("approval_id").eq("client_user_id", userId),
      ]);
      setReviewed(new Set(((rv as { approval_id: string | null }[]) || []).map((r) => r.approval_id).filter(Boolean) as string[]));
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

  // Signed in with an EmmaForYou account that has no client record yet (e.g. made in the community):
  // offer to open the portal for this same account instead of showing an empty dashboard.
  async function activatePortal(e: React.FormEvent) {
    e.preventDefault();
    setActivating(true); setActivateError("");
    const { error } = await pdb.rpc("activate_client_portal", { _full_name: actName, _business_name: actBiz });
    if (error) { setActivateError(/confirm/i.test(error.message) ? "Confirm your email address first, then try again." : "Couldn't open your portal. Please try again."); setActivating(false); return; }
    const { data } = await supabase.from("client_accounts").select("*").eq("user_id", userId).maybeSingle();
    setAccount(data as ClientAcc | null); setActivating(false);
  }
  if (accountChecked && !account) return (
    <div className="dash-x min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content" className="flex min-h-[80vh] items-center justify-center pt-32 pb-20">
        <div className="w-full max-w-md px-5">
          <form onSubmit={activatePortal} className="space-y-3 rounded-3xl border border-border bg-card p-8 shadow-sm">
            <h1 className="font-display text-2xl font-extrabold"><KineticText text="Open your client portal" base={60} /></h1>
            <p className="text-sm text-muted-foreground">You're signed in as <strong className="text-foreground">{email}</strong>. Your portal uses this same account: no new password needed.</p>
            <div><label htmlFor="act-name" className="text-sm font-medium">Your name</label><input id="act-name" className="input mt-1" value={actName} onChange={(e) => setActName(e.target.value)} maxLength={80} autoComplete="name" /></div>
            <div><label htmlFor="act-biz" className="text-sm font-medium">Business name</label><input id="act-biz" className="input mt-1" value={actBiz} onChange={(e) => setActBiz(e.target.value)} maxLength={120} autoComplete="organization" /></div>
            {activateError && <p role="alert" className="text-sm text-destructive">{activateError}</p>}
            <button disabled={activating} className="btn-primary-gradient inline-flex w-full items-center justify-center rounded-full px-6 py-3 font-semibold text-white disabled:opacity-60">{activating ? "Opening…" : "Open my portal"}</button>
            <p className="text-center text-xs text-muted-foreground"><Link to="/account" className="underline">Back to your account</Link></p>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );

  const initials = account?.avatar_initials || email.slice(0, 2).toUpperCase();

  return (
    <div className="dash-x min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content" className="pt-32 pb-24">
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
            {(["overview", "approvals", "invoices", "tasks", "messages", "files", "settings"] as const).map((t) => {
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
                <div className="col-span-full grid gap-3 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                  <form onSubmit={sendRequest} className="rounded-2xl border border-border bg-card p-4">
                    <label htmlFor="portal-request" className="text-sm font-semibold">Need something? Send a request</label>
                    <textarea id="portal-request" value={request} onChange={(e) => { setRequest(e.target.value); setRequestSent(false); }} rows={2} maxLength={1000} placeholder="e.g. Please add our new price list to the website" className="input mt-2" />
                    <div className="mt-2 flex items-center gap-3">
                      <button disabled={!request.trim()} className="btn-primary-gradient rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">Send request</button>
                      {requestSent && <span className="text-xs text-emerald-600">Sent. You'll get a reply in Messages.</span>}
                    </div>
                  </form>
                  <div className="grid gap-2 rounded-2xl border border-border bg-card p-4 text-sm">
                    <p className="font-semibold">Quick actions</p>
                    <Link to="/book" className="rounded-xl border border-border px-3 py-2 hover:border-[var(--emma-violet)]">📅 Book a call with Emmanuel</Link>
                    <a href="https://wa.me/message/HHGMMWMRJFYUC1" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-border px-3 py-2 hover:border-[var(--emma-violet)]">💬 WhatsApp the team</a>
                    <button onClick={() => setTab("files")} className="rounded-xl border border-border px-3 py-2 text-left hover:border-[var(--emma-violet)]">📎 Share files with us</button>
                  </div>
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

            {tab === "settings" && <Settings account={account} email={email} onSaved={(a) => setAccount(a)} />}

            {tab === "approvals" && (
              <div className="space-y-4">
                {approvals.length === 0 && <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nothing to review yet. Designs, copy and campaigns for your sign-off will appear here.</div>}
                {approvals.map((a) => <ApprovalCard key={a.id} a={a} onDecide={decide} review={a.status === "approved" && !reviewed.has(a.id) ? <ReviewRequest approval={a} userId={userId} account={account} onDone={() => setReviewed((s) => new Set(s).add(a.id))} /> : null} />)}
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
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-4">
                <label className={`btn-primary-gradient cursor-pointer rounded-full px-5 py-2 text-sm font-semibold text-white ${uploading ? "opacity-60" : ""}`}>
                  {uploading ? "Uploading…" : "Upload a file"}
                  <input type="file" className="sr-only" disabled={uploading} onChange={(e) => { uploadFile(e.target.files?.[0]); e.target.value = ""; }} />
                </label>
                <p className="text-xs text-muted-foreground">Logos, photos, documents, up to 20 MB. Only you and our team can see them.</p>
                {fileErr && <p role="alert" className="text-xs text-red-600">{fileErr}</p>}
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
                      {f.storage_url && <button onClick={() => openFile(f)} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:border-[var(--emma-violet)]">Open</button>}
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

function ApprovalCard({ a, onDecide, review }: { a: Approval; onDecide: (a: Approval, s: "approved" | "changes_requested", note: string) => Promise<boolean>; review?: React.ReactNode }) {
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
      {review}
    </div>
  );
}

/** Shown after a client approves a delivery: a short, optional review. Nothing is published until the client allows it and the owner approves it. */
function ReviewRequest({ approval, userId, account, onDone }: { approval: Approval; userId: string; account: ClientAcc | null; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [name, setName] = useState(account?.full_name || "");
  const [biz, setBiz] = useState(account?.business_name || "");
  const [mayPublish, setMayPublish] = useState(true);
  const [state, setState] = useState<"idle" | "busy" | "done" | "later">("idle");
  const [err, setErr] = useState("");
  const laterKey = `efy_review_later_${approval.id}`;
  useEffect(() => { try { if (localStorage.getItem(laterKey)) setState("later"); } catch { /* storage blocked */ } }, [laterKey]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) { setErr("Choose a star rating."); return; }
    if (body.trim().length < 10) { setErr("Write at least a sentence (10+ characters)."); return; }
    if (name.trim().length < 2) { setErr("Add the name to show with your review."); return; }
    setState("busy"); setErr("");
    const { error } = await pdb.from("client_testimonials").insert({
      client_user_id: userId, approval_id: approval.id, rating, body: body.trim().slice(0, 1200),
      display_name: name.trim().slice(0, 120), business: biz.trim().slice(0, 160) || null, may_publish: mayPublish,
    });
    if (error) { setState("idle"); setErr("That didn't save. Please try again."); return; }
    track("review_submitted", { rating, may_publish: mayPublish });
    setState("done");
  }

  if (state === "later") return null;
  if (state === "done") {
    return (
      <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm" role="status">
        <p className="font-semibold">Thank you for your review!</p>
        {GOOGLE_REVIEW_URL && rating >= 4 && <p className="mt-1 text-muted-foreground">It would help us a lot if you also shared it on Google: <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--emma-violet)] underline">leave a Google review ↗</a></p>}
        <button onClick={onDone} className="mt-2 text-xs text-muted-foreground underline">Close</button>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="mt-4 rounded-xl border border-[var(--emma-violet)]/30 bg-[var(--emma-violet)]/5 p-4">
      <p className="font-semibold">Happy with this delivery? Tell us how we did.</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Takes 30 seconds. Your feedback goes to Emmanuel; it's only shown publicly if you allow it.</p>
      <fieldset className="mt-3">
        <legend className="text-xs text-muted-foreground">Your rating</legend>
        <div className="mt-1 flex gap-1" role="radiogroup">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)}
              className={`text-2xl leading-none transition ${n <= rating ? "text-amber-500" : "text-muted-foreground/40 hover:text-amber-400"}`}>★</button>
          ))}
        </div>
      </fieldset>
      <label className="mt-3 block text-xs text-muted-foreground">Your review
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={1200} placeholder="What did we do, and what difference has it made?" className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" />
      </label>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-muted-foreground">Name to show<input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" /></label>
        <label className="text-xs text-muted-foreground">Business (optional)<input value={biz} onChange={(e) => setBiz(e.target.value)} maxLength={160} className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" /></label>
      </div>
      <label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" checked={mayPublish} onChange={(e) => setMayPublish(e.target.checked)} className="mt-1" />EmmaForYou may show this review on its website, with the name and business above.</label>
      {err && <p role="alert" className="mt-2 text-sm text-red-600">{err}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={state === "busy"} className="rounded-full bg-[var(--emma-violet)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{state === "busy" ? "Sending…" : "Send review"}</button>
        <button type="button" onClick={() => { try { localStorage.setItem(laterKey, "1"); } catch { /* ignore */ } setState("later"); }} className="text-sm text-muted-foreground underline">Maybe later</button>
      </div>
    </form>
  );
}


function Settings({ account, email, onSaved }: { account: ClientAcc | null; email: string; onSaved: (a: ClientAcc) => void }) {
  const [name, setName] = useState(account?.full_name || "");
  const [biz, setBiz] = useState(account?.business_name || "");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const { error } = await pdb.rpc("update_my_profile", { p_full_name: name, p_business_name: biz });
    if (error) { setMsg("Couldn't save. Name and business name are required."); return; }
    if (account) onSaved({ ...account, full_name: name.trim(), business_name: biz.trim(), avatar_initials: name.trim().slice(0, 2).toUpperCase() });
    setMsg("Profile saved.");
  }
  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    if (pw.length < 8) { setMsg("Use at least 8 characters."); return; }
    const { error } = await supabase.auth.updateUser({ password: pw });
    setMsg(error ? error.message : "Password changed.");
    setPw("");
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form onSubmit={saveProfile} className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h3 className="font-display text-lg font-semibold">Your profile</h3>
        <label className="block text-sm text-muted-foreground">Your name<input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} /></label>
        <label className="block text-sm text-muted-foreground">Business name<input className="input mt-1" value={biz} onChange={(e) => setBiz(e.target.value)} maxLength={160} /></label>
        <p className="text-xs text-muted-foreground">Signed in as {email}. Plan: {account?.plan || "—"} (to change your plan, message us).</p>
        <button className="btn-primary-gradient rounded-full px-5 py-2 text-sm font-semibold text-white">Save profile</button>
      </form>
      <form onSubmit={changePassword} className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h3 className="font-display text-lg font-semibold">Change password</h3>
        <label className="block text-sm text-muted-foreground">New password<input type="password" className="input mt-1" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" minLength={8} /></label>
        <button className="rounded-full border border-border px-5 py-2 text-sm font-semibold hover:border-[var(--emma-violet)]">Update password</button>
      </form>
      {msg && <p role="status" className="text-sm text-foreground md:col-span-2">{msg}</p>}
    </div>
  );
}

function NewPassword({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) { setErr("Use at least 8 characters."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    onDone();
  }
  return (
    <div className="dash-x min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content" className="flex min-h-[80vh] items-center justify-center px-5 pt-32 pb-20">
        <form onSubmit={save} className="w-full max-w-md space-y-3 rounded-3xl border border-border bg-card p-8">
          <h1 className="font-display text-2xl font-semibold"><KineticText text="Choose a new password" base={60} /></h1>
          <input type="password" className="input" aria-label="New password" placeholder="New password (8+ characters)" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" minLength={8} required />
          {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
          <button disabled={busy} className="btn-primary-gradient w-full rounded-full px-6 py-3 font-semibold text-white disabled:opacity-60">{busy ? "Saving…" : "Save and continue"}</button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
