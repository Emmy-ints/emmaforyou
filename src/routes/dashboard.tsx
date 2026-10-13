import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, LogOut, MessageCircle, RefreshCw, Mail, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/seo";
import { ClientManager, SearchVisibility, UpcomingCalls } from "../components/dashboard/ClientManager";
import { CaseStudyEditor, NewsletterPanel, ReviewsPanel } from "../components/dashboard/ContentManager";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () =>
    pageHead({
      title: "Dashboard — EmmaForYou",
      description: "Private dashboard.",
      path: "/dashboard",
      noindex: true,
    }),
});

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface SiteEvent {
  event: string;
  path: string | null;
  session_id: string;
  referrer: string | null;
  utm_source: string | null;
  device: string | null;
  props: Record<string, unknown> | null;
  created_at: string;
}

interface Lead {
  id: string;
  kind: "Analyser" | "Waitlist" | "Business profile" | "Quiz" | "Resource" | "ROI calculator" | "Website audit" | "Proposal signed" | "Call booked" | "Smart contract review" | "Goal planner" | "AI assistant chat" | "Exit offer" | "Contact form";
  name: string;
  business: string;
  email: string;
  whatsapp: string;
  detail: string;
  created_at: string;
}

type RangeDays = 7 | 30 | 90;

const CONVERSION_EVENTS = new Set([
  "whatsapp_click",
  "lead_submitted",
  "intake_submitted",
  "quiz_completed",
  "magnet_downloaded",
  "roi_calculated",
  "prototype_build_real_click",
  "phone_click",
  "email_click",
]);

/* ------------------------------------------------------------------ */
/* Page shell: sign-in, then role check                                */
/* ------------------------------------------------------------------ */

function DashboardPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setIsAdmin(null);
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .then(({ data }) => setIsAdmin(Boolean(data?.some((r) => r.role === "admin"))));
  }, [session]);

  if (checking || (session && isAdmin === null)) {
    return <Centered><p className="text-sm text-muted-foreground">Loading…</p></Centered>;
  }
  if (!session) return <SignIn />;
  if (!isAdmin) {
    return (
      <Centered>
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-extrabold">Almost there</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You're signed in as <strong className="text-foreground">{session.user.email}</strong>, but this account doesn't have
            dashboard access yet. Once it's been given the admin role, refresh this page.
          </p>
          <button onClick={() => supabase.auth.signOut()} className="mt-6 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Sign out
          </button>
        </div>
      </Centered>
    );
  }
  return <Dashboard email={session.user.email || ""} />;
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground">{children}</div>;
}

function SignIn() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        setInfo("Account created. If asked, confirm your email, then sign in.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Centered>
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 block text-center font-display text-2xl font-extrabold">
          EmmaForYou<span className="text-emma-gold">.</span>
        </Link>
        <form onSubmit={submit} className="space-y-3 rounded-3xl border border-border bg-card p-7 shadow-sm">
          <h1 className="font-display text-xl font-bold">{mode === "login" ? "Sign in to your dashboard" : "Create your dashboard account"}</h1>
          <input className="dash-input" type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="dash-input" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          {err && <p className="text-sm text-destructive">{err}</p>}
          {info && <p className="text-sm text-muted-foreground">{info}</p>}
          <button disabled={busy} className="btn-gold w-full rounded-full px-6 py-3 text-sm disabled:opacity-60">
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setErr("");
            }}
            className="w-full pt-1 text-center text-xs text-muted-foreground hover:text-foreground"
          >
            {mode === "login" ? "First time? Create an account" : "Have an account? Sign in"}
          </button>
          {mode === "login" && (
            <button
              type="button"
              onClick={async () => {
                setErr("");
                if (!email.includes("@")) { setErr("Enter your email above first."); return; }
                const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/portal` });
                setInfo(error ? error.message : "Password reset link sent. Open it, set a new password, then come back to /dashboard.");
              }}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Forgot password?
            </button>
          )}
        </form>
      </div>
      <DashStyles />
    </Centered>
  );
}

/* ------------------------------------------------------------------ */
/* Data loading                                                        */
/* ------------------------------------------------------------------ */

const PAGE = 1000;
const MAX_EVENTS = 20000;

async function loadEvents(sinceIso: string): Promise<SiteEvent[]> {
  const all: SiteEvent[] = [];
  for (let from = 0; from < MAX_EVENTS; from += PAGE) {
    const { data, error } = await supabase
      .from("site_events")
      .select("event,path,session_id,referrer,utm_source,device,props,created_at")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    all.push(...((data ?? []) as SiteEvent[]));
    if (!data || data.length < PAGE) break;
  }
  return all;
}

async function loadLeads(sinceIso: string): Promise<Lead[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tdb = supabase as unknown as { from: (t: string) => any };
  const [audits, proposals, calls, toolReqs] = await Promise.all([
    tdb.from("site_audits").select("id,created_at,name,whatsapp,email,url,score").gte("created_at", sinceIso).order("created_at", { ascending: false }).limit(500),
    tdb.from("proposal_acceptances").select("id,signed_at,full_name,business_name,whatsapp,email,plan").gte("signed_at", sinceIso).order("signed_at", { ascending: false }).limit(500),
    tdb.from("strategy_bookings").select("id,created_at,name,business,whatsapp,email,slot_start,topic").gte("created_at", sinceIso).order("created_at", { ascending: false }).limit(500),
    tdb.from("tool_requests").select("id,created_at,tool,name,whatsapp,email,summary").gte("created_at", sinceIso).order("created_at", { ascending: false }).limit(500),
  ]);
  const [leads, intakes, quiz, magnets, roi] = await Promise.all([
    supabase.from("leads").select("id,created_at,source,name,email,whatsapp,business_name,business_type,location,score,goal").gte("created_at", sinceIso).order("created_at", { ascending: false }).limit(500),
    supabase.from("business_intakes").select("id,created_at,full_name,business_name,business_type,email,whatsapp,city,country,primary_goal,services_needed,growth_budget").gte("created_at", sinceIso).order("created_at", { ascending: false }).limit(500),
    supabase.from("quiz_results").select("id,created_at,name,whatsapp,business_type,score,result_bucket").gte("created_at", sinceIso).order("created_at", { ascending: false }).limit(500),
    supabase.from("lead_magnet_downloads").select("id,created_at,name,whatsapp,email,business_type,resource_title").gte("created_at", sinceIso).order("created_at", { ascending: false }).limit(500),
    supabase.from("roi_calculations").select("id,created_at,name,whatsapp,email,niche,budget,additional_revenue").gte("created_at", sinceIso).order("created_at", { ascending: false }).limit(500),
  ]);
  const firstError = [leads, intakes, quiz, magnets, roi].find((r) => r.error)?.error;
  if (firstError) throw firstError;

  const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  const out: Lead[] = [];
  for (const r of leads.data ?? []) {
    out.push({
      id: `l-${r.id}`,
      kind: r.source === "waitlist" ? "Waitlist" : "Analyser",
      name: s(r.name), business: s(r.business_name), email: s(r.email), whatsapp: s(r.whatsapp),
      detail: [r.business_type, r.location, r.score != null ? `score ${r.score}/100` : "", r.goal].filter(Boolean).join(" · "),
      created_at: r.created_at,
    });
  }
  for (const r of intakes.data ?? []) {
    out.push({
      id: `i-${r.id}`, kind: "Business profile",
      name: s(r.full_name), business: s(r.business_name), email: s(r.email), whatsapp: s(r.whatsapp),
      detail: [r.business_type, [r.city, r.country].filter(Boolean).join(", "), r.primary_goal, r.growth_budget ? `budget ${r.growth_budget}` : ""].filter(Boolean).join(" · "),
      created_at: r.created_at,
    });
  }
  for (const r of quiz.data ?? []) {
    out.push({
      id: `q-${r.id}`, kind: "Quiz", name: s(r.name), business: s(r.business_type), email: "", whatsapp: s(r.whatsapp),
      detail: [r.result_bucket, `score ${r.score}`].filter(Boolean).join(" · "), created_at: r.created_at,
    });
  }
  for (const r of magnets.data ?? []) {
    out.push({
      id: `m-${r.id}`, kind: "Resource", name: s(r.name), business: s(r.business_type), email: s(r.email), whatsapp: s(r.whatsapp),
      detail: s(r.resource_title), created_at: r.created_at,
    });
  }
  for (const r of roi.data ?? []) {
    if (!r.name && !r.whatsapp && !r.email) continue; // anonymous calculations aren't leads
    out.push({
      id: `r-${r.id}`, kind: "ROI calculator", name: s(r.name), business: s(r.niche), email: s(r.email), whatsapp: s(r.whatsapp),
      detail: [r.budget ? `budget ${r.budget}` : "", r.additional_revenue ? `projected +${Math.round(Number(r.additional_revenue)).toLocaleString()}` : ""].filter(Boolean).join(" · "),
      created_at: r.created_at,
    });
  }
  for (const r of (audits.data ?? []) as Record<string, unknown>[]) {
    out.push({ id: `a-${r.id}`, kind: "Website audit", name: s(r.name), business: s(r.url), email: s(r.email), whatsapp: s(r.whatsapp), detail: r.score != null ? `score ${r.score}/100 · wants an expert review` : "wants an expert review", created_at: s(r.created_at) });
  }
  for (const r of (proposals.data ?? []) as Record<string, unknown>[]) {
    out.push({ id: `p-${r.id}`, kind: "Proposal signed", name: s(r.full_name), business: s(r.business_name), email: s(r.email), whatsapp: s(r.whatsapp), detail: `accepted the ${s(r.plan)} plan`, created_at: s(r.signed_at) });
  }
  for (const r of (calls.data ?? []) as Record<string, unknown>[]) {
    out.push({ id: `c-${r.id}`, kind: "Call booked", name: s(r.name), business: s(r.business), email: s(r.email), whatsapp: s(r.whatsapp), detail: [`call ${new Date(s(r.slot_start)).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`, s(r.topic)].filter(Boolean).join(" · "), created_at: s(r.created_at) });
  }
  for (const r of (toolReqs.data ?? []) as Record<string, unknown>[]) {
    out.push({ id: `t-${r.id}`, kind: s(r.tool) as Lead["kind"], name: s(r.name), business: "", email: s(r.email), whatsapp: s(r.whatsapp), detail: s(r.summary).slice(0, 300), created_at: s(r.created_at) });
  }
  return out.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

function Dashboard({ email }: { email: string }) {
  const [days, setDays] = useState<RangeDays>(30);
  const [events, setEvents] = useState<SiteEvent[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const since = new Date(Date.now() - days * 86400000).toISOString();
    Promise.all([loadEvents(since), loadLeads(since)])
      .then(([ev, ld]) => {
        if (cancelled) return;
        setEvents(ev);
        setLeads(ld);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Could not load data"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [days, refreshKey]);

  const stats = useMemo(() => summarise(events, days), [events, days]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <Link to="/" className="font-display text-lg font-extrabold">
            EmmaForYou<span className="text-emma-gold">.</span> <span className="ml-1 text-sm font-medium text-muted-foreground">Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground md:inline">{email}</span>
            <button onClick={() => supabase.auth.signOut()} className="dash-icon-btn" aria-label="Sign out" title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        {/* Filters: one row above everything */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold md:text-3xl">How the site is performing</h1>
            <p className="mt-1 text-sm text-muted-foreground">Visits, actions and leads from your own database. Your own visits to this page aren't counted.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="dash-segment" role="group" aria-label="Date range">
              {([7, 30, 90] as RangeDays[]).map((d) => (
                <button key={d} aria-pressed={days === d} onClick={() => setDays(d)}>
                  {d} days
                </button>
              ))}
            </div>
            <button onClick={() => setRefreshKey((k) => k + 1)} className="dash-icon-btn" aria-label="Refresh" title="Refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {error && <p className="mt-6 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">{error}</p>}

        {/* Headline numbers */}
        <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Kpi label="Visitors" value={stats.visitors} />
          <Kpi label="Page views" value={stats.pageViews} />
          <Kpi label="WhatsApp clicks" value={stats.count("whatsapp_click")} />
          <Kpi label="New leads" value={leads.length} />
          <Kpi label="Prototypes made" value={stats.count("prototype_generated") + stats.count("prototype_refined")} />
          <Kpi label="Visitor → action" value={`${stats.conversionRate}%`} hint="Share of visitors who clicked WhatsApp, submitted a form or asked for the real build" />
        </section>

        {/* AI tools at a glance */}
        <section className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Kpi label="Receptionist chats" value={stats.count("receptionist_message")} />
          <Kpi label="Website audits" value={stats.count("audit_run")} />
          <Kpi label="Proposals made" value={stats.count("proposal_generated")} hint={`${stats.count("proposal_accepted")} accepted`} />
          <Kpi label="Makeovers" value={stats.count("makeover_generated")} />
          <Kpi label="Calls booked" value={stats.count("call_booked")} />
          <Kpi label="Emma AI chats" value={stats.count("assistant_message")} hint={`${stats.count("assistant_lead")} leads captured · ${stats.count("contract_checked")} contract checks · ${stats.count("plan_generated")} goal plans`} />
        </section>

        {/* Trend */}
        <section className="dash-card mt-4">
          <div className="flex items-baseline justify-between">
            <h2 className="dash-h2">Daily visitors</h2>
            <span className="text-xs text-muted-foreground">last {days} days</span>
          </div>
          <div className="mt-4 h-64">
            {stats.visitors === 0 && !loading ? (
              <Empty text="No visits recorded yet. Data starts flowing as soon as this version is published." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.daily} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="visitsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--emma-blue)" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="var(--emma-blue)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12, color: "var(--popover-foreground)" }}
                    formatter={(v) => [v, "Visitors"]}
                  />
                  <Area type="monotone" dataKey="visitors" stroke="var(--emma-blue)" strokeWidth={2} fill="url(#visitsFill)" activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Funnel + breakdowns */}
        <section className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="dash-card">
            <h2 className="dash-h2">Client journey</h2>
            <p className="mt-1 text-xs text-muted-foreground">Unique visitors reaching each step</p>
            <BarList
              rows={[
                { label: "Visited the site", value: stats.visitors },
                { label: "Made a prototype", value: stats.sessionsWith("prototype_generated") },
                { label: "Asked for the real build", value: stats.sessionsWith("prototype_build_real_click") },
                { label: "Clicked WhatsApp", value: stats.sessionsWith("whatsapp_click") },
                { label: "Used an AI tool", value: stats.sessionsWithAny(["receptionist_message", "audit_run", "proposal_generated", "makeover_generated", "voice_search", "assistant_message", "contract_checked", "plan_generated"]) },
                { label: "Submitted a form", value: stats.sessionsWithAny(["lead_submitted", "intake_submitted", "quiz_completed", "magnet_downloaded", "roi_calculated", "audit_requested"]) },
                { label: "Booked a call or signed", value: stats.sessionsWithAny(["call_booked", "proposal_accepted"]) },
              ]}
              keepOrder
            />
          </div>
          <div className="dash-card">
            <h2 className="dash-h2">Where visitors come from</h2>
            <p className="mt-1 text-xs text-muted-foreground">First source of each visit</p>
            <BarList rows={stats.sources} />
          </div>
          <div className="dash-card">
            <h2 className="dash-h2">Most viewed pages</h2>
            <p className="mt-1 text-xs text-muted-foreground">Page views</p>
            <BarList rows={stats.pages} />
          </div>
          <div className="dash-card">
            <h2 className="dash-h2">Devices</h2>
            <p className="mt-1 text-xs text-muted-foreground">Unique visitors</p>
            <BarList rows={stats.devices} />
          </div>
          <div className="dash-card lg:col-span-2">
            <h2 className="dash-h2">Actions</h2>
            <p className="mt-1 text-xs text-muted-foreground">Everything visitors did, by count</p>
            <BarList rows={stats.actions} />
          </div>
        </section>

        <UpcomingCalls />

        {/* Leads inbox */}
        <section className="dash-card mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="dash-h2">Leads</h2>
              <p className="mt-1 text-xs text-muted-foreground">Everyone who left their details in the last {days} days, newest first</p>
            </div>
            <button onClick={() => downloadCsv(leads)} disabled={!leads.length} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          </div>
          {leads.length === 0 ? (
            <div className="mt-4 h-32"><Empty text={loading ? "Loading…" : "No leads in this period yet."} /></div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-3 font-medium">When</th>
                    <th className="py-2 pr-3 font-medium">Who</th>
                    <th className="py-2 pr-3 font-medium">From</th>
                    <th className="py-2 pr-3 font-medium">Details</th>
                    <th className="py-2 font-medium">Reach out</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.id} className="border-b border-border/60 align-top last:border-0">
                      <td className="whitespace-nowrap py-3 pr-3 text-xs text-muted-foreground">{formatWhen(l.created_at)}</td>
                      <td className="py-3 pr-3">
                        <div className="font-medium">{l.name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{l.business}</div>
                      </td>
                      <td className="py-3 pr-3"><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{l.kind}</span></td>
                      <td className="max-w-xs py-3 pr-3 text-xs text-muted-foreground">{l.detail || "—"}</td>
                      <td className="py-3">
                        <div className="flex gap-1.5">
                          {waLink(l.whatsapp, l.name) && (
                            <a href={waLink(l.whatsapp, l.name)!} target="_blank" rel="noopener noreferrer" className="dash-icon-btn" title={`WhatsApp ${l.whatsapp}`} aria-label={`WhatsApp ${l.name}`}>
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          )}
                          {l.email && (
                            <a href={`mailto:${l.email}`} className="dash-icon-btn" title={l.email} aria-label={`Email ${l.name}`}>
                              <Mail className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <ClientManager />
        <SearchVisibility />
        <ReviewsPanel />
        <CaseStudyEditor />
        <NewsletterPanel />
      </main>
      <DashStyles />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function Kpi({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="dash-card !p-4" title={hint}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold tabular-nums md:text-3xl">{typeof value === "number" ? value.toLocaleString() : value}</p>
    </div>
  );
}

function BarList({ rows, keepOrder }: { rows: { label: string; value: number }[]; keepOrder?: boolean }) {
  const list = (keepOrder ? rows : [...rows].sort((a, b) => b.value - a.value)).slice(0, 8);
  const max = Math.max(1, ...list.map((r) => r.value));
  if (!list.length || list.every((r) => r.value === 0)) return <div className="mt-4 h-24"><Empty text="Nothing yet." /></div>;
  return (
    <ul className="mt-4 space-y-2.5">
      {list.map((r) => (
        <li key={r.label} className="group" title={`${r.label}: ${r.value.toLocaleString()}`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{r.label}</span>
            <span className="tabular-nums text-muted-foreground">{r.value.toLocaleString()}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${(r.value / max) * 100}%`, background: "var(--emma-blue)" }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border px-4 text-center text-sm text-muted-foreground">{text}</div>;
}

function DashStyles() {
  return (
    <style>{`
      .dash-card { border: 1px solid var(--border); background: var(--card); border-radius: 20px; padding: 1.25rem; }
      .dash-h2 { font-family: var(--font-sora); font-size: 0.95rem; font-weight: 700; letter-spacing: -0.01em; }
      .dash-input { display: block; width: 100%; padding: 0.7rem 0.9rem; border-radius: 0.8rem; background: var(--background); border: 1px solid var(--border); color: inherit; font-size: 0.95rem; outline: none; }
      .dash-input:focus { border-color: var(--emma-blue); box-shadow: 0 0 0 3px oklch(0.45 0.22 265 / 0.12); }
      .dash-icon-btn { display: inline-grid; place-items: center; width: 2rem; height: 2rem; border-radius: 999px; border: 1px solid var(--border); color: var(--muted-foreground); background: var(--card); }
      .dash-icon-btn:hover { color: var(--foreground); background: var(--muted); }
      .dash-segment { display: inline-flex; padding: 3px; border-radius: 999px; border: 1px solid var(--border); background: var(--card); }
      .dash-segment button { padding: 0.35rem 0.8rem; border-radius: 999px; font-size: 0.75rem; color: var(--muted-foreground); }
      .dash-segment button[aria-pressed="true"] { background: var(--foreground); color: var(--background); }
    `}</style>
  );
}

/* ------------------------------------------------------------------ */
/* Maths                                                               */
/* ------------------------------------------------------------------ */

const EVENT_LABELS: Record<string, string> = {
  whatsapp_click: "WhatsApp clicks",
  phone_click: "Phone clicks",
  email_click: "Email clicks",
  cta_click: "Button clicks",
  prototype_generated: "Prototypes generated",
  prototype_refined: "Prototypes refined",
  prototype_failed: "Prototype errors",
  prototype_limit_hit: "Hit the hourly prototype limit",
  prototype_build_real_click: "“Build the real version” clicks",
  lead_submitted: "Analyser / waitlist sign-ups",
  intake_submitted: "Business profiles submitted",
  roi_calculated: "ROI calculations",
  quiz_completed: "Quizzes completed",
  magnet_downloaded: "Free resources downloaded",
  affiliate_signup: "Affiliate sign-ups",
  service_tile_click: "3D service tile clicks",
};

function summarise(events: SiteEvent[], days: number) {
  const sessions = new Set<string>();
  const firstSource = new Map<string, string>();
  const deviceBySession = new Map<string, string>();
  const byEvent = new Map<string, number>();
  const sessionsByEvent = new Map<string, Set<string>>();
  const pages = new Map<string, number>();
  const dailySessions = new Map<string, Set<string>>();
  let pageViews = 0;

  // Events arrive newest first; walk oldest first so "first source" really is first.
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    sessions.add(e.session_id);
    byEvent.set(e.event, (byEvent.get(e.event) ?? 0) + 1);
    if (!sessionsByEvent.has(e.event)) sessionsByEvent.set(e.event, new Set());
    sessionsByEvent.get(e.event)!.add(e.session_id);
    if (!firstSource.has(e.session_id)) firstSource.set(e.session_id, sourceName(e));
    if (e.device && !deviceBySession.has(e.session_id)) deviceBySession.set(e.session_id, e.device);
    if (e.event === "page_view") {
      pageViews++;
      const p = e.path || "/";
      pages.set(p, (pages.get(p) ?? 0) + 1);
    }
    const day = e.created_at.slice(0, 10);
    if (!dailySessions.has(day)) dailySessions.set(day, new Set());
    dailySessions.get(day)!.add(e.session_id);
  }

  const daily: { label: string; visitors: number }[] = [];
  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(Date.now() - d * 86400000);
    const key = date.toISOString().slice(0, 10);
    daily.push({ label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }), visitors: dailySessions.get(key)?.size ?? 0 });
  }

  const tally = (m: Map<string, string>) => {
    const out = new Map<string, number>();
    for (const v of m.values()) out.set(v, (out.get(v) ?? 0) + 1);
    return [...out].map(([label, value]) => ({ label, value }));
  };

  const converted = new Set<string>();
  for (const [ev, set] of sessionsByEvent) if (CONVERSION_EVENTS.has(ev)) set.forEach((s) => converted.add(s));

  return {
    visitors: sessions.size,
    pageViews,
    conversionRate: sessions.size ? Math.round((converted.size / sessions.size) * 1000) / 10 : 0,
    count: (ev: string) => byEvent.get(ev) ?? 0,
    sessionsWith: (ev: string) => sessionsByEvent.get(ev)?.size ?? 0,
    sessionsWithAny: (evs: string[]) => {
      const s = new Set<string>();
      evs.forEach((ev) => sessionsByEvent.get(ev)?.forEach((id) => s.add(id)));
      return s.size;
    },
    daily,
    sources: tally(firstSource),
    devices: tally(deviceBySession).map((r) => ({ ...r, label: r.label.charAt(0).toUpperCase() + r.label.slice(1) })),
    pages: [...pages].map(([label, value]) => ({ label, value })),
    actions: [...byEvent]
      .filter(([ev]) => ev !== "page_view")
      .map(([ev, value]) => ({ label: EVENT_LABELS[ev] ?? ev, value })),
  };
}

function sourceName(e: SiteEvent): string {
  const raw = (e.utm_source || e.referrer || "").toLowerCase();
  if (!raw) return "Direct / WhatsApp / apps";
  if (/google\./.test(raw) || raw === "google") return "Google";
  if (/facebook|fb\.|^fb$/.test(raw)) return "Facebook";
  if (/instagram|^ig$/.test(raw)) return "Instagram";
  if (/t\.co|twitter|x\.com/.test(raw)) return "X / Twitter";
  if (/linkedin|lnkd/.test(raw)) return "LinkedIn";
  if (/tiktok/.test(raw)) return "TikTok";
  if (/whatsapp|wa\.me/.test(raw)) return "WhatsApp";
  if (/bing|duckduckgo|yahoo/.test(raw)) return "Other search";
  return raw;
}

function waLink(number: string, name: string): string | null {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 8) return null;
  // Nigerian numbers are often typed locally (0803…); convert to the international form.
  const intl = digits.startsWith("0") && digits.length === 11 ? `234${digits.slice(1)}` : digits;
  const text = encodeURIComponent(`Hi${name ? ` ${name.split(" ")[0]}` : ""}, this is Emmanuel from EmmaForYou. Thanks for reaching out — `);
  return `https://wa.me/${intl}?text=${text}`;
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)} h ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function downloadCsv(leads: Lead[]) {
  const header = ["Date", "Source", "Name", "Business", "Email", "WhatsApp", "Details"];
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [header.join(","), ...leads.map((l) => [l.created_at, l.kind, l.name, l.business, l.email, l.whatsapp, l.detail].map(esc).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `emmaforyou-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
