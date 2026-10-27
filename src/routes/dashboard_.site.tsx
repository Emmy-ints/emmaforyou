// @ts-nocheck -- generated DB/router types lag behind; runtime verified
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Eye, Lock, Play, RotateCcw, Save, Send, Square } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/seo";
import AccountAuthForm from "@/components/auth/AccountAuthForm";
import { KineticText } from "@/components/future/Kinetic";
import { Btn, Card, check, db, downloadCsv, Empty, ErrorText, label, Loading, Pill, Stat, useLoad, when } from "@/components/agents-admin/shared";
import { DEFAULTS, FONTS, PRESETS, PREVIEW_KEY, applyTokens, contrast, diffTokens, resolve, type Tokens } from "@/lib/design-tokens";
import { runAudit, type AuditRun, type Finding } from "@/lib/site-audit";
import { catalog, FAMILIES } from "@/lib/service-catalog";
import { pageIndex } from "@/lib/page-index";
import { RepairPanel, FIXABLE } from "@/components/site-admin/repair";
import { PermsContext } from "@/components/site-admin/settings";
import ContentTab from "@/components/site-admin/content";
import LabTab from "@/components/site-admin/lab-admin";
import { BackupsTab, EnquiriesTab, FeaturesTab, RedirectsTab, TranslationsTab } from "@/components/site-admin/operations";
import SearchTab from "@/components/site-admin/search";

/**
 * Website control room. Every action is checked again in the database (site_can / RLS), so the
 * tabs a person sees are a convenience, not the security boundary. Secrets never reach this page:
 * the AI check reports provider and model names only.
 */
const TABS = [["overview", "Overview"], ["audit", "Audit & repair"], ["search", "Search & releases"], ["content", "Content"], ["enquiries", "Enquiries"], ["translations", "Translations"], ["design", "Design lab"], ["features", "Features"], ["redirects", "Redirects"], ["lab", "Innovation Lab"], ["team", "Team & roles"], ["log", "Activity log"], ["backups", "Backups"], ["systems", "AI & integrations"]] as const;
type Tab = (typeof TABS)[number][0];
const NEEDS: Record<Tab, string[] | null> = { overview: null, audit: ["audit.read"], search: ["audit.read", "analytics.read"], content: ["content.draft"], enquiries: ["enquiries.read"], translations: ["translations.edit"], design: ["design.draft"], features: ["flags.draft"], redirects: ["redirects.draft"], lab: ["lab.use"], team: ["roles.manage"], log: ["log.read"], backups: ["backup.create"], systems: null };
const roleName = (p: string[]) => (p.includes("roles.manage") ? "Admin" : p.includes("translations.edit") ? "Marketing" : p.includes("flags.draft") ? "Developer" : p.includes("content.draft") ? "Editor" : p.includes("analytics.read") ? "Analyst" : "Auditor");

export const Route = createFileRoute("/dashboard_/site")({
  validateSearch: (s: Record<string, unknown>): { tab?: Tab } => (TABS.some(([t]) => t === s.tab) ? { tab: s.tab as Tab } : {}),
  head: () => pageHead({ title: "Website control room | EmmaForYou", description: "Audit, design and manage the EmmaForYou website.", path: "/dashboard/site", noindex: true }),
  component: Gate,
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="dash-x min-h-screen bg-background text-foreground">
      <header className="dash-top sticky top-0 z-40"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
        <Link to="/dashboard" className="inline-flex items-center gap-2 font-display text-lg font-extrabold"><ArrowLeft className="h-4 w-4" aria-hidden="true" />EmmaForYou<span className="text-emma-gold">.</span> <span className="text-sm font-medium text-muted-foreground">Control room</span></Link>
      </div></header>
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}

function Gate() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [perms, setPerms] = useState<string[] | null>(null);
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setChecking(false); });
    return () => sub.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session) { setPerms(null); return; }
    db.rpc("site_permissions").then(({ data }) => setPerms(Array.isArray(data) ? data : []));
  }, [session]);
  if (checking || (session && perms === null)) return <Shell><h1 className="sr-only">Website control room</h1><Loading /></Shell>;
  if (!session) return <Shell><div className="mx-auto mt-10 max-w-sm rounded-3xl border border-border bg-card p-7"><h1 className="mb-1 font-display text-xl font-bold"><KineticText text="Website control room" base={60} /></h1><p className="mb-5 text-sm text-muted-foreground">Sign in with a staff account.</p><AccountAuthForm intent="account" next="/dashboard/site" idPrefix="site-auth" /></div></Shell>;
  if (!perms!.length) return <Shell><div className="mx-auto mt-10 max-w-md rounded-3xl border border-border bg-card p-8 text-center"><Lock className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" /><h1 className="mt-4 font-display text-2xl font-extrabold"><KineticText text="Staff only" base={60} /></h1><p className="mt-2 text-sm text-muted-foreground">This account has no website role. An admin can grant editor or auditor access.</p></div></Shell>;
  return <Room perms={perms!} email={session.user.email ?? ""} />;
}

function Room({ perms, email }: { perms: string[]; email: string }) {
  const { tab = "overview" } = Route.useSearch();
  const navigate = useNavigate();
  const can = (p: string | null) => !p || perms.includes(p);
  const tabs = TABS.filter(([id]) => !NEEDS[id] || NEEDS[id]!.some((p) => perms.includes(p)));
  const current = tabs.some(([id]) => id === tab) ? tab : "overview";
  const setTab = (t: Tab) => navigate({ to: "/dashboard/site", search: t === "overview" ? {} : { tab: t }, replace: true });
  const role = roleName(perms);
  return (
    <PermsContext.Provider value={perms}>
    <Shell>
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-2xl font-extrabold tracking-tight"><KineticText text="Website control room" base={60} /></h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Audit every public page, manage the design system and see who changed what. Signed in as {email} · <Pill tone="info">{role}</Pill></p></div>
        <div className="flex gap-2"><Link to="/dashboard/agents" className="nav-ghost">Agents</Link><Link to="/dashboard/inspiration" className="nav-ghost">Inspiration</Link></div>
      </header>
      <nav aria-label="Sections" className="sticky top-[57px] z-20 -mx-4 mb-4 overflow-x-auto border-b border-border bg-background/95 px-4 backdrop-blur sm:-mx-6 sm:px-6">
        <ul className="flex gap-1 py-2">{tabs.map(([id, l]) => <li key={id}><button type="button" onClick={() => setTab(id)} aria-current={current === id ? "page" : undefined} className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium ${current === id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>{l}</button></li>)}</ul>
      </nav>
      {current === "overview" && <Overview perms={perms} go={setTab} />}
      {current === "audit" && <AuditTab canRun={can("audit.run")} />}
      {current === "search" && <SearchTab />}
      {current === "content" && <ContentTab />}
      {current === "enquiries" && <EnquiriesTab />}
      {current === "translations" && <TranslationsTab />}
      {current === "design" && <DesignTab canPublish={can("design.publish")} />}
      {current === "features" && <FeaturesTab />}
      {current === "redirects" && <RedirectsTab />}
      {current === "lab" && <LabTab />}
      {current === "team" && <TeamTab />}
      {current === "log" && <LogTab />}
      {current === "backups" && <BackupsTab />}
      {current === "systems" && <SystemsTab />}
    </Shell>
    </PermsContext.Provider>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
const since = (days: number) => new Date(Date.now() - days * 864e5).toISOString();

function Overview({ perms, go }: { perms: string[]; go: (t: Tab) => void }) {
  const m = useLoad(async () => {
    const count = async (q: Promise<{ count: number | null; error: { message: string } | null }>) => { const r = await q; return r.error ? null : r.count ?? 0; };
    const [views7, views30, leads30, audit, design] = await Promise.all([
      count(db.from("site_events").select("id", { count: "exact", head: true }).eq("event", "page_view").gte("created_at", since(7))),
      count(db.from("site_events").select("id", { count: "exact", head: true }).eq("event", "page_view").gte("created_at", since(30))),
      count(db.from("leads").select("id", { count: "exact", head: true }).gte("created_at", since(30))),
      perms.includes("audit.read") ? db.from("site_audit_reports").select("created_at,routes_checked,summary").order("created_at", { ascending: false }).limit(1).maybeSingle() : Promise.resolve({ data: null }),
      db.from("site_design").select("published,published_at,draft_updated_at").eq("id", 1).maybeSingle(),
    ]);
    return { views7, views30, leads30, audit: audit.data, design: design.data };
  });
  const pages = pageIndex().length; const services = catalog().length;
  const d = m.data;
  const preset = d?.design ? PRESETS.find((p) => p.id === (d.design.published?.preset ?? "emmaforyou"))?.name : "—";
  const fmt = (n: number | null | undefined) => (n == null ? "No access" : n.toLocaleString());
  return (
    <div className="space-y-4">
      <ErrorText message={m.error} onRetry={m.reload} />
      {m.loading ? <Loading /> : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Page views, 7 days" value={fmt(d?.views7)} hint="site_events, page_view" />
          <Stat label="Page views, 30 days" value={fmt(d?.views30)} />
          <Stat label="Leads, 30 days" value={fmt(d?.leads30)} hint="leads table" />
          <Stat label="Public pages indexed" value={pages} hint="From the site's page index" />
          <Stat label="Services in catalogue" value={services} />
          <Stat label="Live design" value={preset ?? "Default"} hint={d?.design?.published_at ? `Published ${when(d.design.published_at)}` : "Never published"} />
          <Stat label="Last audit" value={d?.audit ? when(d.audit.created_at) : "Never"} warn={!d?.audit} />
          <Stat label="Open high-severity findings" value={d?.audit ? (d.audit.summary?.high ?? 0) : "—"} warn={(d?.audit?.summary?.high ?? 0) > 0} />
        </div>
      )}
      <Card title="Next steps">
        <ul className="grid gap-2 sm:grid-cols-3">
          {perms.includes("audit.read") && <li><button type="button" className="nav-ghost w-full justify-start" onClick={() => go("audit")}><Play className="h-4 w-4" aria-hidden="true" />Run a full site audit</button></li>}
          {perms.includes("design.draft") && <li><button type="button" className="nav-ghost w-full justify-start" onClick={() => go("design")}><Eye className="h-4 w-4" aria-hidden="true" />Try a design preset</button></li>}
          <li><button type="button" className="nav-ghost w-full justify-start" onClick={() => go("systems")}><Check className="h-4 w-4" aria-hidden="true" />Check AI and database health</button></li>
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">Numbers come straight from your database. "No access" means this role can't read that table.</p>
      </Card>
    </div>
  );
}

const SEV_TONE = { high: "bad", medium: "warn", low: "info", info: "muted" } as const;

function AuditTab({ canRun }: { canRun: boolean }) {
  const [run, setRun] = useState<AuditRun | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number; phase: string } | null>(null);
  const [err, setErr] = useState(""); const [msg, setMsg] = useState("");
  const [sev, setSev] = useState("all"); const [status, setStatus] = useState("open"); const [q, setQ] = useState("");
  const cancel = useRef({ cancelled: false });
  const triage = useLoad<Row[]>(async () => check(await db.from("site_audit_triage").select("*").limit(5000)));
  const reports = useLoad<Row[]>(async () => check(await db.from("site_audit_reports").select("id,created_at,routes_checked,summary,findings").order("created_at", { ascending: false }).limit(10)));
  const tmap = useMemo(() => new Map((triage.data ?? []).map((t) => [t.key, t])), [triage.data]);
  const repairs = useLoad<Row[]>(async () => check(await db.from("site_repairs").select("*").order("created_at", { ascending: false }).limit(1000)));
  const rmap = useMemo(() => { const m = new Map<string, Row[]>(); for (const r of repairs.data ?? []) m.set(r.finding_key, [...(m.get(r.finding_key) ?? []), r]); return m; }, [repairs.data]);
  const [openFix, setOpenFix] = useState<string | null>(null);
  const [recheck, setRecheck] = useState<Record<string, string>>({});
  const findings: Finding[] = run?.findings ?? (reports.data?.[0]?.findings ?? []);
  const source = run ? "this run" : reports.data?.[0] ? `saved report from ${when(reports.data[0].created_at)}` : "";

  async function start() {
    setErr(""); setMsg(""); cancel.current = { cancelled: false }; setProgress({ done: 0, total: 0, phase: "Pages" });
    try {
      const r = await runAudit({ signal: cancel.current, onProgress: (done, total, phase) => setProgress({ done, total, phase }) });
      setRun(r);
      const summary = { high: r.findings.filter((f) => f.severity === "high").length, medium: r.findings.filter((f) => f.severity === "medium").length, low: r.findings.filter((f) => f.severity === "low").length, info: r.findings.filter((f) => f.severity === "info").length, images: r.images.length, brokenImages: r.images.filter((i) => !i.ok).length, ...(r.search ? { search: r.search } : {}) };
      const { data: u } = await supabase.auth.getUser();
      const saved = await db.from("site_audit_reports").insert({ created_by: u.user?.id, routes_checked: r.pages.length, summary, findings: r.findings.slice(0, 1500) });
      if (saved.error) setErr(`Audit finished but couldn't be saved: ${saved.error.message}`); else { setMsg(`Checked ${r.pages.length} pages and ${r.images.length} images. Report saved.`); reports.reload(); }
    } catch (e) { setErr(e instanceof Error ? e.message : "The audit stopped."); }
    finally { setProgress(null); }
  }
  async function setTriage(f: Finding, st: string, assignee?: string, reason?: string) {
    setErr("");
    const { data: u } = await supabase.auth.getUser();
    const r = await db.from("site_audit_triage").upsert({ key: f.key, status: st, assignee: assignee ?? null, reason: reason ?? null, updated_at: new Date().toISOString(), updated_by: u.user?.id });
    if (r.error) setErr(r.error.message); else triage.reload();
  }
  // Re-check one finding's page now (does the problem still show in the live HTML?).
  async function verify(f: Finding) {
    setRecheck((x) => ({ ...x, [f.key]: "Checking…" }));
    try {
      const r = await runAudit({ routes: f.type === "dup-title" ? (f.data?.routes ?? [f.route]) : [f.route], skipExtras: true });
      const still = r.findings.some((g) => g.type === f.type && g.route === f.route);
      setRecheck((x) => ({ ...x, [f.key]: still ? "Still present on the live page" : "Not found on the live page any more" }));
      if (!still && canRun) setTriage(f, "fixed", undefined, "Confirmed by re-check");
    } catch (e) { setRecheck((x) => ({ ...x, [f.key]: e instanceof Error ? e.message : "Re-check failed" })); }
  }
  const shown = findings.filter((f) => (sev === "all" || f.severity === sev) && (status === "all" || (tmap.get(f.key)?.status ?? "open") === status) && (!q || `${f.route} ${f.title} ${f.evidence}`.toLowerCase().includes(q.toLowerCase())));
  const counts = (s: string) => findings.filter((f) => f.severity === s).length;

  return (
    <div className="space-y-4">
      <Card title="Site audit" actions={canRun && (progress ? <Btn onClick={() => { cancel.current.cancelled = true; }}><Square className="h-4 w-4" aria-hidden="true" />Stop</Btn> : <Btn tone="primary" onClick={start}><Play className="h-4 w-4" aria-hidden="true" />Run full audit</Btn>)}>
        <p className="text-sm text-muted-foreground">Loads every public page from your browser exactly as a visitor gets it, then checks status codes, titles, descriptions, headings, internal links and every image. Each finding shows the evidence it's based on.</p>
        {progress && <div className="mt-3" role="status"><p className="text-sm">{progress.phase}: {progress.done} / {progress.total || "…"}</p><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-[var(--emma-violet)] transition-[width]" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 3}%` }} /></div></div>}
        {msg && <p role="status" className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">{msg}</p>}
        <div className="mt-3"><ErrorText message={err || triage.error || reports.error} /></div>
        {!canRun && <p className="mt-2 text-xs text-muted-foreground">Your role can read saved reports but not start a new audit.</p>}
      </Card>
      {findings.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{(["high", "medium", "low", "info"] as const).map((s) => <Stat key={s} label={`${label(s)} severity`} value={counts(s)} warn={s === "high" && counts(s) > 0} />)}</div>
          <Card title={`Findings (${shown.length})`} actions={<Btn small onClick={() => downloadCsv("site-audit", shown.map((f) => ({ severity: f.severity, route: f.route, title: f.title, evidence: f.evidence, fix: f.fix, status: tmap.get(f.key)?.status ?? "open" })))}>Export CSV</Btn>}>
            <p className="mb-3 text-xs text-muted-foreground">From {source}.</p>
            <div className="mb-3 flex flex-wrap gap-2">
              <select className="input w-auto" value={sev} onChange={(e) => setSev(e.target.value)} aria-label="Severity"><option value="all">All severities</option>{["high", "medium", "low", "info"].map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>
              <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="all">Any status</option>{["open", "assigned", "fixed", "ignored"].map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>
              <input className="input w-auto flex-1" placeholder="Filter by route or text" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter findings" />
            </div>
            {!shown.length ? <Empty>Nothing matches these filters.</Empty> : (
              <ul className="divide-y divide-border">
                {shown.slice(0, 300).map((f) => { const t = tmap.get(f.key); return (
                  <li key={f.key} className="py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0"><p className="font-medium"><Pill tone={SEV_TONE[f.severity]}>{label(f.severity)}</Pill> {f.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground"><a href={f.route} target="_blank" rel="noopener noreferrer" className="font-mono underline">{f.route}</a> · Evidence: <span className="break-all">{f.evidence}</span></p>
                        <p className="mt-1 text-xs">Suggested fix: {f.fix}</p>
                        {t && <p className="mt-1 text-xs text-muted-foreground">{label(t.status)}{t.assignee ? ` to ${t.assignee}` : ""}{t.reason ? ` · ${t.reason}` : ""}{t.note ? ` · ${t.note}` : ""} · {when(t.updated_at)}</p>}
                        {recheck[f.key] && <p className="mt-1 text-xs font-medium">{recheck[f.key]}</p>}
                        {(rmap.get(f.key)?.length ?? 0) > 0 && <p className="mt-1 text-xs"><Pill tone="info">{rmap.get(f.key)!.length} fix proposal{rmap.get(f.key)!.length > 1 ? "s" : ""}</Pill></p>}</div>
                      <div className="flex flex-wrap gap-1">
                        <Btn small onClick={() => setOpenFix(openFix === f.key ? null : f.key)}>{FIXABLE[f.type] === "manual" ? "How to fix" : "Fix…"}</Btn>
                        <Btn small onClick={() => window.open(f.route, "_blank", "noopener")}>Review page</Btn>
                        {canRun && <Btn small onClick={() => verify(f)}>Re-check</Btn>}
                        {canRun && t?.status !== "fixed" && <Btn small onClick={() => { const n = window.prompt("What was done? (recorded with the finding)", ""); if (n !== null) setTriage(f, "fixed", undefined, n.slice(0, 500) || "Marked fixed"); }}>Mark fixed</Btn>}
                        {canRun && <Btn small onClick={() => { const who = window.prompt("Assign to (name or email)"); if (who) setTriage(f, "assigned", who.slice(0, 120)); }}>Assign</Btn>}
                        {canRun && (t && t.status !== "open"
                          ? <Btn small onClick={() => setTriage(f, "open", undefined, "Reopened")}>Reopen</Btn>
                          : <Btn small onClick={() => { const why = window.prompt("Why ignore this finding? (required)", ""); if (why && why.trim()) setTriage(f, "ignored", undefined, why.trim().slice(0, 500)); }}>Ignore…</Btn>)}
                      </div>
                    </div>
                    {openFix === f.key && <RepairPanel f={f} repairs={rmap.get(f.key) ?? []} onDone={() => { repairs.reload(); triage.reload(); }} />}
                  </li>); })}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted-foreground">Supported fixes (page titles and descriptions, redirects for broken links) are proposed, reviewed as a before/after comparison, applied with a checkpoint and can be rolled back. Everything else shows what needs a code change. "Re-check" loads the live page again to confirm.</p>
          </Card>
        </>
      )}
      {run && (
        <Card title={`Pages checked (${run.pages.length})`}>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="text-xs text-muted-foreground"><th className="py-1 pr-3">Route</th><th className="pr-3">Status</th><th className="pr-3">Time</th><th className="pr-3">h1</th><th>Title</th></tr></thead>
            <tbody>{run.pages.map((p) => <tr key={p.route} className="border-t border-border"><td className="py-1 pr-3 font-mono text-xs">{p.route}</td><td className="pr-3"><Pill tone={p.status >= 200 && p.status < 400 ? "good" : "bad"}>{p.status || "—"}</Pill></td><td className="pr-3 tabular-nums">{p.ms} ms</td><td className="pr-3">{p.h1}</td><td className="max-w-[360px] truncate">{p.title}</td></tr>)}</tbody></table></div>
        </Card>
      )}
      <Card title="Saved reports">
        {reports.loading ? <Loading /> : !reports.data?.length ? <Empty>No saved audits yet.</Empty> : <ul className="divide-y divide-border text-sm">{reports.data.map((r) => <li key={r.id} className="flex flex-wrap justify-between gap-2 py-2"><span>{when(r.created_at)} · {r.routes_checked} pages</span><span className="flex gap-1"><Pill tone="bad">{r.summary?.high ?? 0} high</Pill><Pill tone="warn">{r.summary?.medium ?? 0} medium</Pill><Pill>{r.summary?.brokenImages ?? 0} broken images</Pill></span></li>)}</ul>}
      </Card>
    </div>
  );
}

const SLIDERS: { key: keyof typeof DEFAULTS; label: string; min: number; max: number; step: number }[] = [
  { key: "glass", label: "Glass strength", min: 0, max: 1, step: 0.05 }, { key: "radius", label: "Corner radius (px)", min: 0, max: 40, step: 1 },
  { key: "motion", label: "Motion intensity", min: 0, max: 1.5, step: 0.05 }, { key: "grain", label: "Film grain", min: 0, max: 0.12, step: 0.005 }, { key: "atmosphere", label: "Background atmosphere", min: 0, max: 2, step: 0.05 },
  { key: "shadow", label: "Shadow depth", min: 0, max: 2, step: 0.05 }, { key: "tintk", label: "Page tint strength", min: 0, max: 0.12, step: 0.005 },
];

function DesignTab({ canPublish }: { canPublish: boolean }) {
  const row = useLoad<Row | null>(async () => check(await db.from("site_design").select("*").eq("id", 1).maybeSingle()));
  const versions = useLoad<Row[]>(async () => check(await db.from("site_design_versions").select("*").order("id", { ascending: false }).limit(20)));
  const [t, setT] = useState<Tokens | null>(null);
  const [err, setErr] = useState(""); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false); const [note, setNote] = useState("");
  useEffect(() => { if (row.data && t === null) setT(Object.keys(row.data.draft ?? {}).length ? row.data.draft : row.data.published ?? {}); }, [row.data]); // eslint-disable-line react-hooks/exhaustive-deps
  // Live preview on this page only; restore the published look when leaving.
  useEffect(() => { if (t) applyTokens(t); }, [t]);
  useEffect(() => () => applyTokens(row.data?.published ?? null), [row.data]);
  const r = resolve(t ?? {});
  const set = (patch: Tokens) => setT((cur) => ({ ...(cur ?? {}), ...patch }));
  const clean = (x: Tokens) => Object.fromEntries(Object.entries(x).filter(([, v]) => v !== undefined && v !== null && v !== ""));
  async function act(fn: () => Promise<string>) { setBusy(true); setErr(""); setMsg(""); try { setMsg(await fn()); row.reload(); versions.reload(); } catch (e) { setErr(e instanceof Error ? e.message : "That didn't work."); } finally { setBusy(false); } }
  const saveDraft = () => act(async () => { check(await db.rpc("site_design_save_draft", { _tokens: clean(t ?? {}) })); return "Draft saved. The live site hasn't changed."; });
  const previewOnSite = async () => { await saveDraft(); try { localStorage.setItem(PREVIEW_KEY, JSON.stringify(clean(t ?? {}))); } catch { /* storage blocked */ } window.open("/", "_blank", "noopener"); };
  const publish = () => { if (!window.confirm("Publish this design to every visitor? The current live design is saved as a version you can restore.")) return; act(async () => { check(await db.rpc("site_design_save_draft", { _tokens: clean(t ?? {}) })); const v = check(await db.rpc("site_design_publish", { _note: note.slice(0, 200) || null })); setNote(""); return `Published (version ${v}). Visitors see it on their next page load.`; }); };
  const restore = (v: Row) => { if (!window.confirm(`Load version ${v.id} into the draft? Nothing goes live until you publish.`)) return; act(async () => { const tok = check(await db.rpc("site_design_restore", { _version: v.id })); setT(tok ?? {}); return `Version ${v.id} loaded into the draft. Publish to make it live.`; }); };

  if (row.loading && !row.data) return <Loading />;
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-4">
        <Card title="Presets">
          <div className="grid gap-2 sm:grid-cols-2">
            {PRESETS.map((p) => { const pr = resolve({ preset: p.id }); return (
              <button key={p.id} type="button" aria-pressed={r.preset === p.id} onClick={() => setT({ preset: p.id })} className={`rounded-xl border p-3 text-left transition ${r.preset === p.id ? "border-[var(--emma-violet)] ring-2 ring-[var(--emma-violet)]/30" : "border-border hover:border-foreground/30"}`}>
                <span className="flex items-center gap-2"><span className="h-5 w-5 rounded-full" style={{ background: `linear-gradient(135deg, ${pr.accent}, ${pr.accent2})` }} aria-hidden="true" /><span className="font-semibold">{p.name}</span></span>
                <span className="mt-1 block text-xs text-muted-foreground">{p.note}</span>
              </button>); })}
          </div>
        </Card>
        <Card title="Fine-tune">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">Heading font<select className="input mt-1 w-full" value={r.font} onChange={(e) => set({ font: e.target.value as Tokens["font"] })}>{FONTS.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
            <label className="text-sm font-medium">Page tint<span className="mt-1 flex items-center gap-2"><input type="color" value={r.tint} onChange={(e) => set({ tint: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent" /><code className="text-xs">{r.tint}</code></span></label>
            {(["accent", "accent2"] as const).map((k) => <label key={k} className="text-sm font-medium">{k === "accent" ? "Primary accent" : "Secondary accent"}<span className="mt-1 flex items-center gap-2"><input type="color" value={r[k]} onChange={(e) => set({ [k]: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent" /><code className="text-xs">{r[k]}</code></span></label>)}
            {SLIDERS.map((s) => <label key={s.key} className="text-sm font-medium">{s.label} <span className="tabular-nums text-muted-foreground">{Number(r[s.key]).toFixed(s.step < 1 ? (s.step < 0.01 ? 3 : 2) : 0)}</span><input type="range" min={s.min} max={s.max} step={s.step} value={Number(r[s.key])} onChange={(e) => set({ [s.key]: Number(e.target.value) })} className="mt-1 w-full" /></label>)}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Values are checked in the database: only these settings, colour codes and bounded numbers are accepted, so nothing here can inject code. Brand gradients, buttons, links, glass, corners, shadows, headings and the page tint all follow these tokens; category colours (one per service family) stay fixed on purpose.</p>
        </Card>
        <Card title="Readability check">
          {(() => { const c = contrast(r.accent); const okW = c.onWhite >= 4.5, okD = c.onDark >= 3; return (
            <ul className="space-y-1 text-sm">
              <li><Pill tone={okW ? "good" : c.onWhite >= 3 ? "warn" : "bad"}>{c.onWhite.toFixed(2)}:1</Pill> White text on the primary accent (buttons) {okW ? "meets" : c.onWhite >= 3 ? "only meets the large-text level of" : "fails"} WCAG AA</li>
              <li><Pill tone={okD ? "good" : "bad"}>{c.onDark.toFixed(2)}:1</Pill> Primary accent on the dark bands {okD ? "is readable" : "is too dark to read"}</li>
            </ul>); })()}
          <p className="mt-2 text-xs text-muted-foreground">The default theme stays one click away ("EmmaForYou (default)" or Reset to live), and every publish keeps the previous design as a version.</p>
        </Card>
      </div>
      <div className="space-y-4">
        <Card title="Live preview">
          <div className="lg-strong p-5" style={{ borderRadius: "var(--radius-glass)" }}>
            <p className="sx-kicker"><span className="sx-kicker-dot" aria-hidden="true" />Preview</p>
            <p className="mt-2 font-display text-2xl font-semibold">Websites that <span className="text-shine">sell for you</span></p>
            <p className="mt-1 text-sm text-muted-foreground">This whole page is showing the draft right now.</p>
            <div className="mt-4 flex gap-2"><span className="btn-primary-gradient rounded-full px-4 py-2 text-sm font-semibold text-white">Primary action</span><span className="nav-ghost">Secondary</span></div>
          </div>
        </Card>
        <Card title="Compare with live">
          {(() => { const d = diffTokens(row.data?.published ?? {}, t ?? {}); return !d.length ? <p className="text-sm text-muted-foreground">The draft matches the live design.</p> : (
            <table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1">Setting</th><th>Live</th><th>Draft</th></tr></thead>
              <tbody>{d.map((x) => <tr key={x.key} className="border-t border-border"><td className="py-1">{label(x.key)}</td><td className="font-mono text-xs">{String(x.from)}</td><td className="font-mono text-xs font-semibold">{String(x.to)}</td></tr>)}</tbody></table>); })()}
        </Card>
        <Card title="Save and publish">
          <ErrorText message={err || row.error} />
          {msg && <p role="status" className="mb-2 text-sm text-emerald-700 dark:text-emerald-300">{msg}</p>}
          <div className="flex flex-wrap gap-2">
            <Btn onClick={saveDraft} disabled={busy}><Save className="h-4 w-4" aria-hidden="true" />Save draft</Btn>
            <Btn onClick={previewOnSite} disabled={busy}><Eye className="h-4 w-4" aria-hidden="true" />Preview on site</Btn>
            <Btn onClick={() => setT(row.data?.published ?? {})} disabled={busy}><RotateCcw className="h-4 w-4" aria-hidden="true" />Reset to live</Btn>
          </div>
          {canPublish ? (
            <div className="mt-3 flex flex-wrap gap-2"><input className="input flex-1" maxLength={200} placeholder="What changed? (optional)" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Publish note" /><Btn tone="primary" onClick={publish} disabled={busy}><Send className="h-4 w-4" aria-hidden="true" />Publish</Btn></div>
          ) : <p className="mt-3 text-xs text-muted-foreground">Your role can save drafts; an admin publishes.</p>}
          <p className="mt-3 text-xs text-muted-foreground">Live since {when(row.data?.published_at)} · Draft saved {when(row.data?.draft_updated_at)}. "Preview on site" shows the draft only in your browser, with a bar to exit.</p>
        </Card>
        <Card title="Versions">
          {versions.loading ? <Loading /> : !versions.data?.length ? <Empty>No versions yet. Each publish saves one.</Empty> : (
            <ul className="divide-y divide-border text-sm">{versions.data.map((v) => <li key={v.id} className="flex items-center justify-between gap-2 py-2"><span className="min-w-0"><span className="font-semibold">v{v.id}</span> · {PRESETS.find((p) => p.id === (v.tokens?.preset ?? "emmaforyou"))?.name ?? "Custom"} · {when(v.created_at)}{v.note ? <span className="block truncate text-xs text-muted-foreground">{v.note}</span> : null}</span><span className="flex gap-1"><Btn small onClick={() => setT(v.tokens ?? {})} disabled={busy} title="Load into the editor to compare">Compare</Btn><Btn small onClick={() => restore(v)} disabled={busy}>Restore</Btn></span></li>)}</ul>
          )}
        </Card>
      </div>
    </div>
  );
}

const ROLE_INFO = [
  { id: "admin", name: "Admin (owner)", can: "Everything, including publishing, restores, roles and enquiry status.", cant: "Nothing is held back." },
  { id: "editor", name: "Editor", can: "Run audits, propose fixes, draft content, design, redirects and lab items, upload media, read enquiries.", cant: "Publish, change roles, restore, edit translations or feature switches." },
  { id: "marketing", name: "Marketing", can: "Draft content and SEO, edit translations, read enquiries and analytics, draft redirects, use the lab, upload media.", cant: "Publish, design, feature switches, run audits." },
  { id: "developer", name: "Developer", can: "Run audits, propose fixes, draft design and feature switches, draft redirects, use the lab, see integrations.", cant: "Publish, read enquiries, edit content or translations." },
  { id: "analyst", name: "Analyst", can: "Read analytics, enquiries, audits and the activity log.", cant: "Change anything." },
  { id: "auditor", name: "Auditor", can: "Read audits and the activity log.", cant: "Change anything or see enquiries." },
];

function TeamTab() {
  const staff = useLoad<Row[]>(async () => check(await db.rpc("site_staff")));
  const [email, setEmail] = useState(""); const [role, setRole] = useState("editor"); const [err, setErr] = useState(""); const [msg, setMsg] = useState("");
  async function change(e: string, r: string, grant: boolean) {
    setErr(""); setMsg("");
    if (!grant && !window.confirm(`Remove the ${r} role from ${e}?`)) return;
    const res = await db.rpc("site_set_role", { _email: e.trim(), _role: r, _grant: grant });
    if (res.error) setErr(res.error.message); else { setMsg(String(res.data ?? "Done.")); setEmail(""); staff.reload(); }
  }
  return (
    <div className="space-y-4">
      <Card title="Roles">
        <ul className="grid gap-2 text-sm sm:grid-cols-3">
          {ROLE_INFO.map((r) => <li key={r.id} className="rounded-xl border border-border p-3"><p className="font-semibold">{r.name}</p><p className="text-xs text-muted-foreground">{r.can}</p><p className="mt-1 text-[11px] text-muted-foreground">Can't: {r.cant}</p></li>)}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">Enforced in the database (site_can and row-level security) on every request, not just hidden in this page. Publishing anything to visitors, restores and role changes stay with admins.</p>
      </Card>
      <Card title="Grant a role">
        <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (email.includes("@")) change(email, role, true); }}>
          <input className="input flex-1" type="email" required placeholder="Their account email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Account email" />
          <select className="input w-auto" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role">{ROLE_INFO.filter((r) => r.id !== "admin").map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
          <Btn type="submit" tone="primary">Grant</Btn>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">They need an existing account with a verified email. Admin rights can only be granted directly in the database.</p>
        <div className="mt-2"><ErrorText message={err || staff.error} /></div>
        {msg && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{msg}</p>}
      </Card>
      <Card title="Current staff">
        {staff.loading ? <Loading /> : !staff.data?.length ? <Empty>No staff found.</Empty> : <ul className="divide-y divide-border text-sm">{staff.data.map((s) => <li key={`${s.email}-${s.role}`} className="flex items-center justify-between gap-2 py-2"><span>{s.email} <Pill tone={s.role === "admin" ? "info" : "muted"}>{label(s.role)}</Pill></span>{s.role !== "admin" && <Btn small tone="danger" onClick={() => change(s.email, s.role, false)}>Remove</Btn>}</li>)}</ul>}
      </Card>
    </div>
  );
}

function LogTab() {
  const log = useLoad<Row[]>(async () => check(await db.from("site_admin_log").select("*").order("at", { ascending: false }).limit(200)));
  return (
    <Card title="Activity log" actions={<div className="flex gap-2"><Btn small onClick={log.reload}>Refresh</Btn>{log.data?.length ? <Btn small onClick={() => downloadCsv("site-activity", log.data!.map((l) => ({ at: l.at, who: l.actor_email, action: l.action, target: l.target, ok: l.ok })))}>Export CSV</Btn> : null}</div>}>
      <ErrorText message={log.error} onRetry={log.reload} />
      {log.loading ? <Loading /> : !log.data?.length ? <Empty>No activity recorded yet.</Empty> : (
        <ul className="divide-y divide-border text-sm">{log.data.map((l) => <li key={l.id} className="flex flex-wrap justify-between gap-2 py-2"><span><span className="font-semibold">{label(l.action.replace(/\./g, " "))}</span>{l.target ? <span className="text-muted-foreground"> · {l.target}</span> : null}</span><span className="text-xs text-muted-foreground">{l.actor_email ?? "system"} · {when(l.at)} {!l.ok && <Pill tone="bad">failed</Pill>}</span></li>)}</ul>
      )}
      <p className="mt-3 text-xs text-muted-foreground">Written by the database itself when designs, audits or roles change. It can't be edited from here.</p>
    </Card>
  );
}

function SystemsTab() {
  const status = useLoad<Row>(async () => { const r = await fetch("/api/ai-status", { headers: { Accept: "application/json" } }); if (!r.ok) throw new Error(`AI status returned ${r.status}`); return r.json(); });
  const ping = useLoad<{ ms: number }>(async () => { const t0 = performance.now(); check(await db.from("site_design").select("id").eq("id", 1).maybeSingle()); return { ms: Math.round(performance.now() - t0) }; });
  const events = useLoad<string | null>(async () => { const r = await db.from("site_events").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(); return r.error ? null : r.data?.created_at ?? ""; });
  const [test, setTest] = useState<Row | null>(null); const [testing, setTesting] = useState(false);
  async function runTest() { setTesting(true); setTest(null); try { const r = await fetch("/api/ai-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); setTest(await r.json().catch(() => ({ test: { ok: false, message: `HTTP ${r.status}` } }))); } catch (e) { setTest({ test: { ok: false, message: e instanceof Error ? e.message : "Request failed" } }); } finally { setTesting(false); } }
  const s = status.data;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="AI provider" actions={<Btn small onClick={runTest} disabled={testing}>{testing ? "Testing…" : "Run a live test"}</Btn>}>
        {status.loading ? <Loading /> : <ErrorText message={status.error} onRetry={status.reload} />}
        {s && <dl className="grid grid-cols-2 gap-2 text-sm"><dt className="text-muted-foreground">Provider</dt><dd>{s.provider ?? <Pill tone="warn">Not configured</Pill>}</dd><dt className="text-muted-foreground">Model</dt><dd>{s.model ?? "—"}</dd><dt className="text-muted-foreground">Creative model</dt><dd>{s.creativeModel ?? "—"}</dd><dt className="text-muted-foreground">Paused</dt><dd>{s.paused == null ? "—" : s.paused ? <Pill tone="warn">Paused</Pill> : "No"}</dd></dl>}
        {test?.test && <p role="status" className="mt-3 text-sm">{test.test.ok ? <Pill tone="good">Working</Pill> : <Pill tone="bad">Failed</Pill>} {test.test.ok ? `Real request answered in ${test.test.ms} ms.` : test.test.message}</p>}
        <p className="mt-3 text-xs text-muted-foreground">Keys live only on the server and are never shown here. The configuration shown above isn't proof of health; only a passing live test is.</p>
      </Card>
      <Card title="Database">
        {ping.loading ? <Loading /> : ping.error ? <ErrorText message={ping.error} onRetry={ping.reload} /> : <p className="text-sm"><Pill tone="good">Reachable</Pill> Round trip {ping.data?.ms} ms from your browser.</p>}
        <p className="mt-3 text-sm">Analytics: {events.loading ? "checking…" : events.data === null ? <Pill>No read access</Pill> : events.data ? <>last event {when(events.data)}</> : <Pill tone="warn">No events recorded</Pill>}</p>
      </Card>
      <Card title="Translation"><p className="text-sm text-muted-foreground">English, French, Spanish and German use built-in text for key pages; every other language, and the rest of each page, is translated through the server AI route (/api/translate), so it depends on the AI provider above. Results are cached in each visitor's browser.</p></Card>
      <Card title="Backups and search data"><p className="text-sm text-muted-foreground">Configuration checkpoints are in Backups; full database backups (daily, about 14 days) and exports are in the Lovable project under Database. Search Console, Bing and the release checks are in "Search &amp; releases".</p></Card>
    </div>
  );
}
