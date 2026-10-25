// @ts-nocheck -- generated DB/router types lag behind; runtime verified
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ExternalLink, Lock, Play, RotateCcw, Save, Trash2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/seo";
import AccountAuthForm from "@/components/auth/AccountAuthForm";
import { Btn, Card, check, db, Empty, ErrorText, label, Loading, Pill, Stat, useLoad, when } from "@/components/agents-admin/shared";
import { KIND_LABEL, KIND_ORDER, STATUS_LABEL, cleanQuery, hostLabel, safeHref } from "@/lib/inspiration/ui";

const TABS = [["sources", "Sources"], ["examples", "Examples"], ["runs", "Import history"], ["queue", "Errors & retries"], ["import", "Manual import"], ["settings", "Settings"]] as const;
type Tab = (typeof TABS)[number][0];
const TONE: Record<string, "good" | "warn" | "bad" | "muted" | "info"> = { working: "good", partial: "warn", blocked: "bad", not_started: "muted", disabled: "muted" };

export const Route = createFileRoute("/dashboard_/inspiration")({
  validateSearch: (s: Record<string, unknown>): { tab?: Tab } => (TABS.some(([t]) => t === s.tab) ? { tab: s.tab as Tab } : {}),
  head: () => pageHead({ title: "Inspiration Library admin | EmmaForYou", description: "Manage inspiration sources and imports.", path: "/dashboard/inspiration", noindex: true }),
  component: AdminPage,
});

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setChecking(false); });
    return () => sub.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    // Display gate only: the database refuses every admin read/write for non-admins.
    supabase.from("user_roles").select("role").eq("user_id", session.user.id).then(({ data }) => setIsAdmin(Boolean(data?.some((r) => r.role === "admin"))));
  }, [session]);
  if (checking || (session && isAdmin === null)) return <Shell><Loading /></Shell>;
  if (!session) return <Shell><div className="mx-auto mt-10 max-w-sm rounded-3xl border border-border bg-card p-7"><h1 className="mb-1 font-display text-xl font-bold">Inspiration Library admin</h1><p className="mb-5 text-sm text-muted-foreground">Sign in with an admin account.</p><AccountAuthForm intent="account" next="/dashboard/inspiration" idPrefix="insp-auth" /></div></Shell>;
  if (!isAdmin) return <Shell><div className="mx-auto mt-10 max-w-md rounded-3xl border border-border bg-card p-8 text-center"><Lock className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" /><h1 className="mt-4 font-display text-2xl font-extrabold">Admins only</h1></div></Shell>;
  return <Admin />;
}

function Admin() {
  const { tab = "sources" } = Route.useSearch();
  const navigate = useNavigate();
  const setTab = (t: Tab) => navigate({ to: "/dashboard/inspiration", search: t === "sources" ? {} : { tab: t }, replace: true });
  return (
    <Shell>
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-2xl font-extrabold tracking-tight">Inspiration Library</h1><p className="mt-1 max-w-3xl text-sm text-muted-foreground">Sources, imports and examples behind <Link to="/inspiration" className="font-semibold text-[var(--emma-violet)]">/inspiration</Link>. Crawling runs on the server every 10 minutes within each site's robots.txt rules and your per-source limits.</p></div>
      </header>
      <nav aria-label="Sections" className="sticky top-0 z-20 -mx-4 mb-4 overflow-x-auto border-b border-border bg-background/95 px-4 backdrop-blur sm:-mx-6 sm:px-6">
        <ul className="flex gap-1 py-2">{TABS.map(([id, l]) => <li key={id}><button type="button" onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined} className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium ${tab === id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>{l}</button></li>)}</ul>
      </nav>
      {tab === "sources" && <SourcesTab />}
      {tab === "examples" && <ExamplesTab />}
      {tab === "runs" && <RunsTab />}
      {tab === "queue" && <QueueTab />}
      {tab === "import" && <ImportTab />}
      {tab === "settings" && <SettingsTab />}
    </Shell>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function SourcesTab() {
  const src = useLoad<Row[]>(async () => check(await db.from("inspiration_sources").select("*").order("sort")));
  const q = useLoad<Row[]>(async () => check(await db.from("inspiration_queue").select("source_id,status").limit(20000)));
  const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [edit, setEdit] = useState<string | null>(null);
  const counts = (id: string) => { const r = (q.data ?? []).filter((x) => x.source_id === id); return { pending: r.filter((x) => x.status === "pending").length, failed: r.filter((x) => x.status === "failed").length }; };
  async function act(action: string, source?: string) {
    setErr(""); setMsg("");
    try { const r = check(await db.rpc("inspiration_admin", { p_action: action, p_source: source ?? null })) as { affected: number }; setMsg(action === "run" ? `Started ${r.affected} source${r.affected === 1 ? "" : "s"}. Results appear in Import history within a few minutes.` : `${r.affected} page(s) queued for retry.`); src.reload(); q.reload(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Couldn't start."); }
  }
  async function toggle(s: Row) {
    setErr("");
    try { check(await db.from("inspiration_sources").update({ enabled: !s.enabled, updated_at: new Date().toISOString() }).eq("id", s.id).select("id").single()); src.reload(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Couldn't change it."); }
  }
  const rows = src.data ?? [];
  const total = rows.reduce((n, s) => n + (s.imported_total ?? 0), 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Sources registered" value={rows.length} /><Stat label="Working" value={rows.filter((s) => s.status === "working").length} />
        <Stat label="Blocked or partial" value={rows.filter((s) => s.status === "blocked" || s.status === "partial").length} warn={rows.some((s) => s.status === "partial")} /><Stat label="Examples imported" value={total.toLocaleString()} />
      </div>
      <Card title="Sources" actions={<Btn small onClick={() => void act("run")}><Play className="h-3.5 w-3.5" aria-hidden="true" />Run all enabled now</Btn>}>
        <ErrorText message={err || src.error} />{msg && <p role="status" className="mb-2 text-sm text-emerald-700 dark:text-emerald-300">{msg}</p>}
        {src.loading && !src.data ? <Loading /> : (
          <div className="relative -mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[980px] text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1.5 font-medium">Source</th><th className="font-medium">Method</th><th className="font-medium">Status</th><th className="font-medium">Imported</th><th className="font-medium">Queue</th><th className="font-medium">Last success</th><th className="font-medium">Next run</th><th className="font-medium">On</th><th /></tr></thead>
              <tbody>{rows.map((s) => { const c = counts(s.id); return (
                <tr key={s.id} className="border-t border-border/60 align-top">
                  <td className="py-2"><a href={s.home_url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-[var(--emma-violet)]">{s.name}</a><span className="block text-xs text-muted-foreground">{s.category} · {KIND_LABEL[s.default_kind as keyof typeof KIND_LABEL] ?? s.default_kind}</span></td>
                  <td className="max-w-[240px] text-xs"><span className="font-semibold">{label(s.method)}</span><span className="block text-muted-foreground">{s.method_notes}</span></td>
                  <td className="max-w-[240px]"><Pill tone={TONE[s.status] ?? "muted"}>{STATUS_LABEL[s.status] ?? s.status}</Pill>{(s.restriction || s.status_reason) && <span className="mt-1 block text-xs text-muted-foreground">{s.restriction ?? s.status_reason}</span>}</td>
                  <td className="tabular-nums">{(s.imported_total ?? 0).toLocaleString()}</td>
                  <td className="text-xs tabular-nums">{c.pending} waiting{c.failed ? <span className="block text-amber-700 dark:text-amber-300">{c.failed} failed</span> : null}</td>
                  <td className="text-xs">{when(s.last_success_at)}</td>
                  <td className="text-xs">{s.enabled && s.method !== "manual" ? when(s.next_run_at) : "—"}</td>
                  <td><input type="checkbox" checked={s.enabled} onChange={() => void toggle(s)} aria-label={`${s.enabled ? "Disable" : "Enable"} ${s.name}`} className="h-4 w-4" /></td>
                  <td className="whitespace-nowrap text-right"><div className="flex justify-end gap-1">
                    {s.enabled && s.method !== "manual" && <Btn small onClick={() => void act("run", s.id)}>Run</Btn>}
                    {c.failed > 0 && <Btn small onClick={() => void act("retry", s.id)}>Retry</Btn>}
                    <Btn small onClick={() => setEdit(edit === s.id ? null : s.id)}>{edit === s.id ? "Close" : "Settings"}</Btn>
                  </div></td>
                </tr>
              ); })}</tbody>
            </table>
          </div>
        )}
      </Card>
      {edit && rows.find((s) => s.id === edit) && <SourceEditor key={edit} s={rows.find((s) => s.id === edit)!} onSaved={() => { src.reload(); setEdit(null); }} />}
    </div>
  );
}

function SourceEditor({ s, onSaved }: { s: Row; onSaved: () => void }) {
  const [d, setD] = useState({ ...s, sitemaps: (s.sitemaps ?? []).join("\n"), listing_pages: (s.listing_pages ?? []).join("\n"), tag_prefixes: (s.tag_prefixes ?? []).join(", ") });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const field = (k: string, l: string, hint: string, type: "text" | "number" | "area" = "text") => (
    <label className="block text-xs font-semibold">{l}
      {type === "area" ? <textarea rows={3} className="dash-input mt-1 font-mono text-xs" value={d[k] ?? ""} onChange={(e) => setD({ ...d, [k]: e.target.value })} />
        : <input className="dash-input mt-1" type={type} value={d[k] ?? ""} onChange={(e) => setD({ ...d, [k]: type === "number" ? Number(e.target.value) : e.target.value })} />}
      <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">{hint}</span>
    </label>
  );
  async function save() {
    setErr(""); setBusy(true);
    try {
      for (const p of [d.include_pattern, d.exclude_pattern]) if (p) new RegExp(p);
      const lines = (v: string) => v.split(/\s*\n\s*/).map((x) => x.trim()).filter((x) => /^https:\/\//.test(x)).slice(0, 20);
      check(await db.from("inspiration_sources").update({
        max_new_per_run: d.max_new_per_run, max_sitemaps_per_run: d.max_sitemaps_per_run, refresh_hours: d.refresh_hours, min_delay_ms: d.min_delay_ms, use_source_images: d.use_source_images,
        sitemaps: lines(d.sitemaps), listing_pages: lines(d.listing_pages), sitemap_pick: d.sitemap_pick?.trim() || null, include_pattern: d.include_pattern?.trim() || null, exclude_pattern: d.exclude_pattern?.trim() || null,
        tag_prefixes: d.tag_prefixes.split(",").map((x: string) => x.trim()).filter(Boolean).slice(0, 12), updated_at: new Date().toISOString(),
      }).eq("id", s.id).select("id").single());
      onSaved();
    } catch (e) { setErr(e instanceof SyntaxError ? "A URL pattern isn't a valid regular expression." : e instanceof Error ? e.message : "Couldn't save."); }
    finally { setBusy(false); }
  }
  return (
    <Card title={`${s.name}: discovery settings`} actions={<Btn small tone="primary" onClick={() => void save()} disabled={busy}><Save className="h-3.5 w-3.5" aria-hidden="true" />Save</Btn>}>
      <ErrorText message={err} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {field("max_new_per_run", "Pages per run", "Example pages read each run (0–100).", "number")}
        {field("max_sitemaps_per_run", "Sitemaps per run", "Newest child sitemaps read each refresh (+1 older, rotating).", "number")}
        {field("refresh_hours", "Refresh every (hours)", "How often new examples are looked for.", "number")}
        {field("min_delay_ms", "Gap between requests (ms)", "Robots.txt Crawl-delay wins if longer.", "number")}
        {field("sitemaps", "Sitemaps", "One https URL per line. Empty = read robots.txt.", "area")}
        {field("listing_pages", "Listing pages", "For listing-method sources: pages that link to examples.", "area")}
        <div className="space-y-4">{field("include_pattern", "Example URL pattern", "Regular expression for example page paths.")}{field("exclude_pattern", "Exclude pattern", "Paths to ignore.")}</div>
        <div className="space-y-4">{field("sitemap_pick", "Child sitemap filter", "Only child sitemaps whose URL contains this.")}{field("tag_prefixes", "Tag link prefixes", "Comma-separated paths whose links are read as tags.")}
          <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={d.use_source_images} onChange={(e) => setD({ ...d, use_source_images: e.target.checked })} />Show the source's preview images</label></div>
      </div>
    </Card>
  );
}

function ExamplesTab() {
  const [q, setQ] = useState(""); const [source, setSource] = useState(""); const [status, setStatus] = useState(""); const [link, setLink] = useState(""); const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Row | null>(null); const [err, setErr] = useState("");
  const srcs = useLoad<Row[]>(async () => check(await db.from("inspiration_sources").select("id,name").order("sort")));
  const ex = useLoad<{ rows: Row[]; count: number }>(async () => {
    let r = db.from("inspiration_examples").select("id,title,brand,kind,source_id,original_url,listing_url,status,link_status,image_status,discovered_at,tags,industries,styles,platform,also_listed_on,edited_by_admin", { count: "exact" });
    const t = cleanQuery(q); if (t) r = r.or(`title.ilike.*${t}*,brand.ilike.*${t}*,listing_url.ilike.*${t}*`);
    if (source) r = r.eq("source_id", source); if (status) r = r.eq("status", status); if (link) r = r.eq("link_status", link);
    const res = await r.order("discovered_at", { ascending: false }).range(page * 50, page * 50 + 49);
    return { rows: check(res) as Row[], count: res.count ?? 0 };
  }, [q, source, status, link, page]);
  async function patch(id: string, p: Row) { setErr(""); try { check(await db.from("inspiration_examples").update({ ...p, edited_by_admin: true, updated_at: new Date().toISOString() }).eq("id", id).select("id").single()); ex.reload(); } catch (e) { setErr(e instanceof Error ? e.message : "Couldn't update."); } }
  async function remove(id: string) { setErr(""); try { const { error } = await db.from("inspiration_examples").delete().eq("id", id); if (error) throw new Error(error.message); ex.reload(); } catch (e) { setErr(e instanceof Error ? e.message : "Couldn't delete."); } }
  return (
    <Card title={`Examples${ex.data ? ` (${ex.data.count.toLocaleString()})` : ""}`}>
      <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <input className="dash-input" placeholder="Search title, brand or URL" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} aria-label="Search examples" />
        <select className="dash-input" value={source} onChange={(e) => { setSource(e.target.value); setPage(0); }} aria-label="Source"><option value="">All sources</option>{(srcs.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <select className="dash-input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} aria-label="Visibility"><option value="">Visible and hidden</option><option value="visible">Visible</option><option value="hidden">Hidden</option></select>
        <select className="dash-input" value={link} onChange={(e) => { setLink(e.target.value); setPage(0); }} aria-label="Link status"><option value="">Any link status</option><option value="broken">Broken links</option><option value="blocked">Couldn't check</option><option value="ok">Working</option><option value="unknown">Not checked</option></select>
      </div>
      <ErrorText message={err || ex.error} />
      {ex.loading && !ex.data ? <Loading /> : !ex.data?.rows.length ? <Empty>No examples match.</Empty> : (
        <div className="relative -mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[900px] text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1.5 font-medium">Example</th><th className="font-medium">Type</th><th className="font-medium">Source</th><th className="font-medium">Link</th><th className="font-medium">Visible</th><th /></tr></thead>
            <tbody>{ex.data.rows.map((r) => (
              <tr key={r.id} className="border-t border-border/60 align-top">
                <td className="max-w-[340px] py-2"><Link to="/inspiration/$id" params={{ id: r.id }} className="font-semibold hover:text-[var(--emma-violet)]">{r.title}</Link>{r.edited_by_admin && <span className="ml-1 text-[11px] text-muted-foreground">(edited)</span>}
                  <span className="block truncate text-xs text-muted-foreground">{safeHref(r.original_url) ? <a href={safeHref(r.original_url)!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 hover:underline">{hostLabel(r.original_url)}<ExternalLink className="h-3 w-3" aria-hidden="true" /></a> : "no original link"}{(r.also_listed_on ?? []).length ? ` · +${r.also_listed_on.length} duplicate listing(s)` : ""}</span></td>
                <td className="text-xs">{KIND_LABEL[r.kind as keyof typeof KIND_LABEL]}</td>
                <td className="text-xs"><a href={safeHref(r.listing_url) ?? "#"} target="_blank" rel="noopener noreferrer" className="hover:underline">{r.source_id}</a></td>
                <td><Pill tone={r.link_status === "ok" || r.link_status === "redirected" ? "good" : r.link_status === "broken" ? "bad" : "muted"}>{label(r.link_status)}</Pill></td>
                <td><input type="checkbox" checked={r.status === "visible"} onChange={() => void patch(r.id, { status: r.status === "visible" ? "hidden" : "visible" })} aria-label={r.status === "visible" ? "Hide" : "Show"} className="h-4 w-4" /></td>
                <td className="whitespace-nowrap text-right"><div className="flex justify-end gap-1"><Btn small onClick={() => setEditing(r)}>Edit</Btn><button type="button" className="dash-icon-btn" aria-label={`Delete ${r.title}`} onClick={() => { if (window.confirm(`Delete "${r.title}" from the library? It may be re-imported later unless you hide it instead.`)) void remove(r.id); }}><Trash2 className="h-4 w-4" aria-hidden="true" /></button></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {ex.data && ex.data.count > 50 && <div className="mt-3 flex items-center justify-end gap-2 text-sm"><Btn small disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Btn><span className="text-muted-foreground">Page {page + 1} of {Math.ceil(ex.data.count / 50)}</span><Btn small disabled={(page + 1) * 50 >= ex.data.count} onClick={() => setPage(page + 1)}>Next</Btn></div>}
      {editing && <ExampleEditor r={editing} onClose={() => setEditing(null)} onSave={async (p) => { await patch(editing.id, p); setEditing(null); }} />}
    </Card>
  );
}

function ExampleEditor({ r, onClose, onSave }: { r: Row; onClose: () => void; onSave: (p: Row) => Promise<void> }) {
  const [d, setD] = useState({ title: r.title, brand: r.brand ?? "", kind: r.kind, original_url: r.original_url ?? "", tags: (r.tags ?? []).join(", "), industries: (r.industries ?? []).join(", "), styles: (r.styles ?? []).join(", "), platform: r.platform ?? "" });
  const [err, setErr] = useState("");
  const list = (v: string) => v.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean).slice(0, 16);
  return (
    <div className="mt-4 rounded-2xl border border-[var(--emma-violet)]/40 p-4">
      <h3 className="mb-3 font-semibold">Edit: {r.title}</h3>
      <ErrorText message={err} />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-xs font-semibold">Title<input className="dash-input mt-1" maxLength={200} value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></label>
        <label className="text-xs font-semibold">Brand<input className="dash-input mt-1" maxLength={120} value={d.brand} onChange={(e) => setD({ ...d, brand: e.target.value })} /></label>
        <label className="text-xs font-semibold">Type<select className="dash-input mt-1" value={d.kind} onChange={(e) => setD({ ...d, kind: e.target.value })}>{KIND_ORDER.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</select></label>
        <label className="text-xs font-semibold">Original URL<input className="dash-input mt-1" value={d.original_url} onChange={(e) => setD({ ...d, original_url: e.target.value })} placeholder="https://" /></label>
        <label className="text-xs font-semibold">Tags<input className="dash-input mt-1" value={d.tags} onChange={(e) => setD({ ...d, tags: e.target.value })} /></label>
        <label className="text-xs font-semibold">Industries<input className="dash-input mt-1" value={d.industries} onChange={(e) => setD({ ...d, industries: e.target.value })} /></label>
        <label className="text-xs font-semibold">Styles<input className="dash-input mt-1" value={d.styles} onChange={(e) => setD({ ...d, styles: e.target.value })} /></label>
        <label className="text-xs font-semibold">Platform (only if verified)<input className="dash-input mt-1" maxLength={40} value={d.platform} onChange={(e) => setD({ ...d, platform: e.target.value })} /></label>
      </div>
      <div className="mt-3 flex justify-end gap-2"><Btn small onClick={onClose}>Cancel</Btn><Btn small tone="primary" onClick={() => {
        if (d.title.trim().length < 1) { setErr("Add a title."); return; }
        if (d.original_url && !safeHref(d.original_url)) { setErr("The original URL must start with https://"); return; }
        void onSave({ title: d.title.trim(), brand: d.brand.trim() || null, kind: d.kind, original_url: d.original_url.trim() || null, tags: list(d.tags), industries: list(d.industries), styles: list(d.styles), platform: d.platform.trim() || null });
      }}>Save</Btn></div>
    </div>
  );
}

function RunsTab() {
  const runs = useLoad<Row[]>(async () => check(await db.from("inspiration_runs").select("*").order("started_at", { ascending: false }).limit(100)));
  const [open, setOpen] = useState<number | null>(null);
  return (
    <Card title="Import history" actions={<Btn small onClick={runs.reload}><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />Refresh</Btn>}>
      <ErrorText message={runs.error} />
      {runs.loading && !runs.data ? <Loading /> : !runs.data?.length ? <Empty>No runs yet. The first run starts within 10 minutes of setup, or press "Run" on a source.</Empty> : (
        <div className="relative -mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[960px] text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1.5 font-medium">Started</th><th className="font-medium">Source</th><th className="font-medium">Found</th><th className="font-medium">Queued</th><th className="font-medium">Imported</th><th className="font-medium">Updated</th><th className="font-medium">Duplicates</th><th className="font-medium">Skipped</th><th className="font-medium">Failed</th><th className="font-medium">Links checked</th><th className="font-medium">Requests</th><th /></tr></thead>
            <tbody>{runs.data.map((r) => (
              <Fragment key={r.id}>
                <tr className="border-t border-border/60 align-top tabular-nums">
                  <td className="py-1.5 text-xs">{when(r.started_at)}<span className="block text-muted-foreground">{r.trigger}{r.finished_at ? "" : " · running"}</span></td>
                  <td className="text-xs font-semibold">{r.source_id ?? "link checks"}</td>
                  <td>{r.discovered}</td><td>{r.queued}</td><td className="font-semibold">{r.imported}</td><td>{r.updated}</td><td>{r.duplicates}</td><td>{r.skipped}</td><td className={r.failed ? "text-amber-700 dark:text-amber-300" : ""}>{r.failed}</td><td>{r.verified}{r.broken ? ` (${r.broken} broken)` : ""}</td><td>{r.requests}</td>
                  <td>{(r.notes || (r.errors ?? []).length || (r.samples ?? []).length) ? <Btn small onClick={() => setOpen(open === r.id ? null : r.id)}>{open === r.id ? "Hide" : "Details"}</Btn> : null}</td>
                </tr>
                {open === r.id && <tr><td colSpan={12} className="bg-muted/40 p-3 text-xs">
                  {r.notes && <p><strong>Notes:</strong> {r.notes}</p>}
                  {(r.samples ?? []).length > 0 && <p className="mt-1 break-all"><strong>Sample URLs:</strong> {(r.samples as string[]).join(" · ")}</p>}
                  {(r.errors ?? []).length > 0 && <ul className="mt-1 space-y-0.5">{(r.errors as { url?: string; error: string }[]).map((e, i) => <li key={i} className="break-all"><span className="text-amber-700 dark:text-amber-300">{e.error}</span>{e.url ? ` — ${e.url}` : ""}</li>)}</ul>}
                </td></tr>}
              </Fragment>
            ))}</tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function QueueTab() {
  const [st, setSt] = useState("failed");
  const rows = useLoad<Row[]>(async () => check(await db.from("inspiration_queue").select("url,source_id,status,attempts,last_error,next_attempt_at,updated_at,manual").eq("status", st).order("updated_at", { ascending: false }).limit(200)), [st]);
  const [msg, setMsg] = useState(""); const [err, setErr] = useState("");
  async function retry(source?: string) { setErr(""); try { const r = check(await db.rpc("inspiration_admin", { p_action: "retry", p_source: source ?? null })) as { affected: number }; setMsg(`${r.affected} page(s) queued again.`); rows.reload(); } catch (e) { setErr(e instanceof Error ? e.message : "Couldn't retry."); } }
  return (
    <Card title="Errors & retries" actions={<div className="flex gap-2"><select className="dash-input w-auto" value={st} onChange={(e) => setSt(e.target.value)} aria-label="Status"><option value="failed">Failed</option><option value="skipped">Skipped</option><option value="pending">Waiting</option></select>{st === "failed" && <Btn small onClick={() => void retry()}><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />Retry all failed</Btn>}</div>}>
      <ErrorText message={err || rows.error} />{msg && <p role="status" className="mb-2 text-sm text-emerald-700 dark:text-emerald-300">{msg}</p>}
      <p className="mb-2 text-xs text-muted-foreground">Pages fail after 3 attempts with growing waits. Pages blocked by robots.txt fail at once and aren't retried automatically. Skipped pages were missing, had no title, or duplicated another example.</p>
      {rows.loading && !rows.data ? <Loading /> : !rows.data?.length ? <Empty>Nothing here.</Empty> : (
        <ul className="divide-y divide-border/60 text-sm">{rows.data.map((r) => (
          <li key={r.url} className="py-2"><a href={safeHref(r.url) ?? "#"} target="_blank" rel="noopener noreferrer" className="break-all font-medium hover:underline">{r.url}</a><span className="block text-xs text-muted-foreground">{r.source_id}{r.manual ? " · manual" : ""} · {r.attempts} attempt(s) · {when(r.updated_at)}{r.status === "pending" ? ` · next ${when(r.next_attempt_at)}` : ""}</span>{r.last_error && <span className="block text-xs text-amber-700 dark:text-amber-300">{r.last_error}</span>}</li>
        ))}</ul>
      )}
    </Card>
  );
}

function ImportTab() {
  const srcs = useLoad<Row[]>(async () => check(await db.from("inspiration_sources").select("id,name,method").order("sort")));
  const [source, setSource] = useState("dribbble"); const [kind, setKind] = useState(""); const [urls, setUrls] = useState("");
  const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function submit() {
    setErr(""); setMsg("");
    const list = [...new Set(urls.split(/\s+/).map((x) => x.trim()).filter(Boolean))];
    const bad = list.filter((u) => !/^https:\/\/[^/\s]+\.[^/\s]+/.test(u));
    if (!list.length) { setErr("Paste at least one https:// link."); return; }
    if (bad.length) { setErr(`These aren't https links: ${bad.slice(0, 3).join(", ")}`); return; }
    setBusy(true);
    try { const r = check(await db.rpc("inspiration_admin", { p_action: "import", p_source: source, p_urls: list.slice(0, 200), p_kind: kind || null })) as { affected: number }; setMsg(`${r.affected} link(s) queued. Each page's own title, description and preview are read within a few minutes (robots.txt still applies).`); setUrls(""); }
    catch (e) { setErr(e instanceof Error ? e.message : "Couldn't import."); } finally { setBusy(false); }
  }
  return (
    <Card title="Manual import">
      <p className="mb-3 max-w-3xl text-sm text-muted-foreground">For sources that don't allow automated collection (Dribbble, Behance) or for examples you've found yourself. Paste links to individual examples (a shot, project, email or website), one per line. Only the page's own public metadata is read, and the item is credited to the source you choose.</p>
      <ErrorText message={err || srcs.error} />{msg && <p role="status" className="mb-2 text-sm text-emerald-700 dark:text-emerald-300">{msg}</p>}
      <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
        <label className="text-xs font-semibold">Credit to source<select className="dash-input mt-1" value={source} onChange={(e) => setSource(e.target.value)}>{(srcs.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label className="text-xs font-semibold">Type (optional)<select className="dash-input mt-1" value={kind} onChange={(e) => setKind(e.target.value)}><option value="">Use the source's default</option>{KIND_ORDER.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</select></label>
      </div>
      <label className="mt-3 block text-xs font-semibold">Links (up to 200)<textarea rows={8} className="dash-input mt-1 font-mono text-xs" value={urls} onChange={(e) => setUrls(e.target.value)} placeholder={"https://dribbble.com/shots/12345-example\nhttps://www.behance.net/gallery/67890/example"} /></label>
      <div className="mt-3 flex justify-end"><Btn tone="primary" onClick={() => void submit()} disabled={busy}>Queue links</Btn></div>
    </Card>
  );
}

function SettingsTab() {
  const s = useLoad<Row>(async () => check(await db.from("inspiration_settings").select("id,enabled,verify_per_tick,reverify_days,last_tick_at,updated_at").eq("id", 1).single()));
  const [d, setD] = useState<Row | null>(null); const [msg, setMsg] = useState(""); const [err, setErr] = useState("");
  useEffect(() => { if (s.data) setD(s.data); }, [s.data]);
  if (!d) return <Card title="Settings"><ErrorText message={s.error} /><Loading /></Card>;
  async function save() { setErr(""); setMsg(""); try { check(await db.from("inspiration_settings").update({ enabled: d!.enabled, verify_per_tick: Number(d!.verify_per_tick), reverify_days: Number(d!.reverify_days) }).eq("id", 1).select("id").single()); setMsg("Saved."); s.reload(); } catch (e) { setErr(e instanceof Error ? e.message : "Couldn't save."); } }
  return (
    <Card title="Settings" actions={<span className="text-xs text-muted-foreground">Last worker call {when(d.last_tick_at)}</span>}>
      <ErrorText message={err} />{msg && <p role="status" className="mb-2 text-sm text-emerald-700 dark:text-emerald-300">{msg}</p>}
      <div className="grid max-w-2xl gap-4 sm:grid-cols-3">
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-3"><input type="checkbox" checked={d.enabled} onChange={(e) => setD({ ...d, enabled: e.target.checked })} />Crawling and link checks switched on</label>
        <label className="text-xs font-semibold">Links checked per run<input type="number" min={0} max={50} className="dash-input mt-1" value={d.verify_per_tick} onChange={(e) => setD({ ...d, verify_per_tick: e.target.value })} /></label>
        <label className="text-xs font-semibold">Re-check links every (days)<input type="number" min={1} max={365} className="dash-input mt-1" value={d.reverify_days} onChange={(e) => setD({ ...d, reverify_days: e.target.value })} /></label>
      </div>
      <div className="mt-4"><Btn tone="primary" onClick={() => void save()}>Save settings</Btn></div>
    </Card>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6"><Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Owner dashboard</Link><Link to="/inspiration" className="text-sm text-muted-foreground hover:text-foreground">View the library</Link></div></div>
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
      <style>{`
        .dash-card { border: 1px solid var(--border); background: var(--card); border-radius: 20px; padding: 1.25rem; }
        .dash-h2 { font-family: var(--font-sora); font-size: 0.95rem; font-weight: 700; letter-spacing: -0.01em; }
        .dash-input { display: block; width: 100%; padding: 0.6rem 0.8rem; border-radius: 0.75rem; background: var(--background); border: 1px solid var(--border); color: inherit; font-size: 0.9rem; outline: none; }
        .dash-input:focus { border-color: var(--emma-violet); box-shadow: 0 0 0 3px color-mix(in oklab, var(--emma-violet) 18%, transparent); }
        .dash-icon-btn { display: inline-grid; place-items: center; width: 2rem; height: 2rem; border-radius: 999px; border: 1px solid var(--border); color: var(--muted-foreground); background: var(--card); }
        .dash-icon-btn:hover { color: var(--foreground); background: var(--muted); }
      `}</style>
    </div>
  );
}
