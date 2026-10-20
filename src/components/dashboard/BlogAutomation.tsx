import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, Play, RefreshCw, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Blog automation control room. Every number comes from the database: published articles, runs
 * per slot, source health, scheduler calls and their HTTP results. "Published today" counts only
 * article rows that exist, so a failed or missing slot is visible as a shortfall.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface Settings { enabled: boolean; timezone: string; slots: string[]; daily_target: number; site_url: string }
interface Run { id: string; slot_key: string; kind: string; status: string; attempts: number; error: string | null; log: { at: string; step: string; detail?: string }[]; local_date: string; started_at: string; finished_at: string | null; article: { slug: string; title: string } | null }
interface Article { id: string; slug: string; title: string; category: string; status: string; quality_score: number; published_at: string; sources: { url: string }[] }
interface Source { id: string; name: string; industry: string; enabled: boolean; last_status: string | null; last_error: string | null; last_fetched_at: string | null; item_count: number }
interface TickRow { created_at: string; status_code: number | null; timed_out: boolean | null; error: string | null; body: string | null }

function localToday(tz: string) {
  try { return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); } catch { return new Date().toISOString().slice(0, 10); }
}

export function BlogAutomation() {
  const [s, setS] = useState<Settings | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [ticks, setTicks] = useState<TickRow[]>([]);
  const [trendCount, setTrendCount] = useState(0);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ timezone: string; slots: string; daily_target: number } | null>(null);

  const load = useCallback(async () => {
    const st = await db.from("blog_settings").select("enabled,timezone,slots,daily_target,site_url").eq("id", 1).maybeSingle();
    if (st.error) { setMissing(true); return; }
    setS(st.data); setDraft(st.data ? { timezone: st.data.timezone, slots: st.data.slots.join(", "), daily_target: st.data.daily_target } : null);
    const [r, a, so, t, tc] = await Promise.all([
      db.from("blog_runs").select("id,slot_key,kind,status,attempts,error,log,local_date,started_at,finished_at, article:blog_articles!blog_runs_article_id_fkey(slug,title)").order("started_at", { ascending: false }).limit(40),
      db.from("blog_articles").select("id,slug,title,category,status,quality_score,published_at,sources").order("published_at", { ascending: false }).limit(50),
      db.from("blog_sources").select("id,name,industry,enabled,last_status,last_error,last_fetched_at,item_count").order("industry"),
      db.rpc("blog_tick_status", { _limit: 12 }),
      db.from("blog_trends").select("id", { count: "exact", head: true }).is("used_at", null),
    ]);
    setRuns(r.data ?? []); setArticles(a.data ?? []); setSources(so.data ?? []); setTicks(t.data ?? []); setTrendCount(tc.count ?? 0);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function call(action: "run" | "refresh") {
    setBusy(action); setMsg("");
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/api/blog/tick", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` }, body: JSON.stringify({ action }) });
      const j = await res.json().catch(() => ({}));
      setMsg(j.action === "published" ? `Published: ${j.article?.title}` : j.detail || j.error || j.action || `HTTP ${res.status}`);
    } catch { setMsg("Couldn't reach the site."); }
    setBusy(""); void load();
  }

  async function saveSettings(patch: Partial<Settings>) {
    setBusy("settings"); setMsg("");
    const { error } = await db.from("blog_settings").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", 1);
    setMsg(error ? `Couldn't save: ${error.message}` : "Saved."); setBusy(""); void load();
  }
  async function setArticleStatus(id: string, status: "published" | "unpublished") {
    const { error } = await db.from("blog_articles").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) setMsg(error.message); void load();
  }
  async function toggleSource(id: string, enabled: boolean) {
    await db.from("blog_sources").update({ enabled }).eq("id", id); void load();
  }

  if (missing) return <section className="dash-card mt-4"><h2 className="dash-h2">Blog automation</h2><p className="mt-1 text-xs text-muted-foreground">The blog automation tables aren't installed yet.</p></section>;
  if (!s) return <section className="dash-card mt-4"><h2 className="dash-h2">Blog automation</h2><p className="mt-1 text-xs text-muted-foreground">Loading…</p></section>;

  const today = localToday(s.timezone);
  const todays = runs.filter((r) => r.local_date === today && r.kind === "scheduled");
  const publishedToday = articles.filter((a) => a.status === "published" && localToday(s.timezone) === new Intl.DateTimeFormat("en-CA", { timeZone: s.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(a.published_at))).length;
  const lastTick = ticks[0];
  const healthy = sources.filter((x) => x.enabled && x.last_status === "ok").length;

  return (
    <section className="dash-card mt-4" aria-labelledby="blog-auto-h">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="blog-auto-h" className="dash-h2">Blog automation</h2>
          <p className="mt-1 text-xs text-muted-foreground">{s.daily_target} articles a day at {s.slots.join(", ")} ({s.timezone}). Runs from the database scheduler, so it works with this page closed.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => saveSettings({ enabled: !s.enabled })} disabled={busy === "settings"} className={`rounded-full px-4 py-2 text-xs font-semibold ${s.enabled ? "bg-emerald-600 text-white" : "border border-border"}`} aria-pressed={s.enabled}>{s.enabled ? "Automation on" : "Automation off"}</button>
          <button onClick={() => call("refresh")} disabled={Boolean(busy)} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50">{busy === "refresh" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}Refresh sources</button>
          <button onClick={() => call("run")} disabled={Boolean(busy)} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50">{busy === "run" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}Write one now</button>
        </div>
      </div>
      {busy === "run" && <p className="mt-2 text-xs text-muted-foreground">Writing and checking an article usually takes 1–3 minutes…</p>}
      {msg && <p role="status" className="mt-2 rounded-xl bg-muted p-3 text-xs">{msg}</p>}

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={`Published today (${today})`} value={`${publishedToday} / ${s.daily_target}`} warn={publishedToday < s.daily_target} />
        <Stat label="Published, all time" value={String(articles.filter((a) => a.status === "published").length)} />
        <Stat label="Unused trend items" value={String(trendCount)} />
        <Stat label="Healthy sources" value={`${healthy} / ${sources.filter((x) => x.enabled).length}`} warn={healthy === 0} />
      </div>

      <div className="mt-4 rounded-xl border border-border p-3 text-xs">
        <p className="font-semibold">Scheduler</p>
        {!lastTick ? <p className="mt-1 text-muted-foreground">No scheduler calls recorded yet.</p> : (
          <p className="mt-1 text-muted-foreground">Last call {new Date(lastTick.created_at).toLocaleString()} → {lastTick.status_code ? `HTTP ${lastTick.status_code}` : lastTick.timed_out ? "timed out" : lastTick.error || "waiting for reply"}{lastTick.status_code === 404 ? ". The site at the scheduler address doesn't have the blog endpoint yet: publish the latest version in Lovable." : ""}</p>
        )}
        <p className="mt-1 text-muted-foreground">Target: {s.site_url}/api/blog/tick</p>
      </div>

      {todays.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold">Today's slots</p>
          <ul className="mt-1 flex flex-wrap gap-2">{s.slots.map((slot) => { const r = todays.find((x) => x.slot_key.endsWith(`@${slot}`)); return <li key={slot} className={`rounded-full px-3 py-1 text-xs ${r?.status === "published" ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400" : r?.status === "failed" ? "bg-red-600/10 text-red-600" : "bg-muted text-muted-foreground"}`}>{slot} · {r ? r.status : "not yet"}</li>; })}</ul>
        </div>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer text-xs font-semibold">Schedule settings</summary>
        {draft && (
          <form className="mt-2 grid gap-2 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); const slots = draft.slots.split(/[,\s]+/).filter((x) => /^([01]\d|2[0-3]):[0-5]\d$/.test(x)); void saveSettings({ timezone: draft.timezone.trim(), slots, daily_target: Math.max(0, Math.min(12, Number(draft.daily_target) || 0)) }); }}>
            <label className="text-xs">Timezone (IANA)<input className="dash-input mt-1" value={draft.timezone} onChange={(e) => setDraft({ ...draft, timezone: e.target.value })} /></label>
            <label className="text-xs">Slots (HH:MM, comma separated)<input className="dash-input mt-1" value={draft.slots} onChange={(e) => setDraft({ ...draft, slots: e.target.value })} /></label>
            <label className="text-xs">Articles per day<input type="number" min={0} max={12} className="dash-input mt-1" value={draft.daily_target} onChange={(e) => setDraft({ ...draft, daily_target: Number(e.target.value) })} /></label>
            <button type="submit" disabled={busy === "settings"} className="justify-self-start rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background sm:col-span-3">Save schedule</button>
          </form>
        )}
      </details>

      <details className="mt-3" open>
        <summary className="cursor-pointer text-xs font-semibold">Recent runs</summary>
        {runs.length === 0 ? <p className="mt-2 text-xs text-muted-foreground">No runs yet.</p> : (
          <ul className="mt-2 divide-y divide-border text-xs">
            {runs.slice(0, 20).map((r) => (
              <li key={r.id} className="py-2">
                <button type="button" onClick={() => setOpen(open === r.id ? null : r.id)} className="flex w-full items-center gap-2 text-left" aria-expanded={open === r.id}>
                  {r.status === "published" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : r.status === "failed" ? <XCircle className="h-4 w-4 shrink-0 text-red-600" /> : <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
                  <span className="font-medium">{r.slot_key.replace("manual@", "manual · ").slice(0, 32)}</span>
                  <span className="text-muted-foreground">{r.status}{r.attempts > 1 ? ` · attempt ${r.attempts}` : ""}</span>
                  <span className="ml-auto truncate text-muted-foreground">{r.article?.title ?? r.error ?? ""}</span>
                </button>
                {open === r.id && <ol className="mt-2 space-y-1 rounded-lg bg-muted p-2 text-[11px]">{r.log.map((l, i) => <li key={i}><span className="font-semibold">{l.step}</span> {l.detail}</li>)}</ol>}
              </li>
            ))}
          </ul>
        )}
      </details>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-semibold">Articles ({articles.length})</summary>
        <ul className="mt-2 divide-y divide-border text-xs">
          {articles.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-2 py-2">
              <Link to="/blog/$slug" params={{ slug: a.slug }} className="min-w-0 flex-1 truncate font-medium hover:underline">{a.title}</Link>
              <span className="text-muted-foreground">{a.category} · {a.quality_score}/20 · {a.sources?.length ?? 0} source{a.sources?.length === 1 ? "" : "s"} · {new Date(a.published_at).toLocaleDateString()}</span>
              <button onClick={() => setArticleStatus(a.id, a.status === "published" ? "unpublished" : "published")} className="rounded-full border border-border px-3 py-1 hover:bg-muted">{a.status === "published" ? "Unpublish" : "Republish"}</button>
            </li>
          ))}
        </ul>
      </details>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-semibold">Sources ({sources.length})</summary>
        <ul className="mt-2 divide-y divide-border text-xs">
          {sources.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center gap-2 py-1.5">
              <span className={`h-2 w-2 rounded-full ${!x.enabled ? "bg-muted-foreground" : x.last_status === "ok" ? "bg-emerald-500" : x.last_status ? "bg-red-500" : "bg-amber-400"}`} aria-hidden="true" />
              <span className="font-medium">{x.name}</span><span className="text-muted-foreground">{x.industry}{x.last_status === "ok" ? ` · ${x.item_count} items` : x.last_error ? ` · ${x.last_error}` : ""}</span>
              <button onClick={() => toggleSource(x.id, !x.enabled)} className="ml-auto rounded-full border border-border px-3 py-1 hover:bg-muted">{x.enabled ? "Disable" : "Enable"}</button>
            </li>
          ))}
        </ul>
      </details>
      <p className="mt-3 text-[11px] text-muted-foreground"><ExternalLink className="mr-1 inline h-3 w-3" />Articles appear on <Link to="/blog" className="underline">/blog</Link> and in the sitemap as soon as they're published.</p>
    </section>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return <div className="rounded-xl border border-border p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className={`mt-1 font-display text-lg font-bold ${warn ? "text-amber-600" : ""}`}>{value}</p></div>;
}
