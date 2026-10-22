import { useState } from "react";
import { Pause, Play, RefreshCw } from "lucide-react";
import { Btn, Card, check, db, Empty, ErrorText, Loading, Pill, Stat, useLoad, when, type AgentRow } from "./shared";
import { TodayPanel } from "./Today";

interface Overview {
  agents: { total: number; enabled: number };
  tasks: Record<string, number>; actions_7d: Record<string, number>; questions_answered_7d: number; unanswered: number; research_7d: number;
  content: Record<string, number>; leads: Record<string, number>; handovers: number;
  usage_today: { calls: number; failed: number; tokens: number; cost: number | null }; usage_month: { calls: number; tokens: number; cost: number | null };
  last_tick: { source: string; started_at: string; finished_at: string; claimed: number; processed: number; ok: boolean; note: string } | null;
  ticks_24h: { requested: number; completed: number };
  recent_errors: { kind: string; error: string; started_at: string }[];
  per_agent: { id: string; name: string; slug: string; enabled: boolean; replies_7d: number; posts_7d: number; leads: number; qualified: number; won: number; tokens_month: number; last_run: string | null }[];
}
interface Settings { paused: boolean; paused_reason: string | null }
interface Health {
  day: string; scheduler: { job: string; schedule: string; active: boolean; last_run: string | null; failed_24h: number; runs_24h: number } | null;
  worker: { last_completed: string | null; requested_1h: number; completed_1h: number }; stuck_tasks: number; overdue_tasks: number; dead_tasks_7d: number;
  daily: { agents: number; met: number; failed: number; alerts: number }; leads_awaiting: number; replies_today: number; active_claims: number;
}

const n = (v: number | undefined | null) => (v ?? 0).toLocaleString();
const cost = (v: number | null | undefined) => (v == null ? "not priced" : `$${Number(v).toFixed(2)}`);

export function OverviewTab({ onOpenAgent, agents = [] }: { onOpenAgent: (id: string) => void; agents?: AgentRow[] }) {
  const o = useLoad<Overview>(async () => check(await db.rpc("agent_admin_overview")));
  const s = useLoad<Settings>(async () => check(await db.from("agent_settings").select("paused,paused_reason").eq("id", 1).single()));
  const h = useLoad<Health>(async () => check(await db.rpc("agent_admin_health")));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [reason, setReason] = useState("");

  async function setPaused(paused: boolean) {
    setBusy(true); setErr("");
    try {
      const { data: u } = await db.auth.getUser();
      check(await db.from("agent_settings").update({ paused, paused_reason: paused ? (reason.trim() || "Paused from the dashboard") : null, updated_by: u.user?.id ?? null }).eq("id", 1).select("id").single());
      s.reload(); o.reload();
    } catch (e) { setErr(e instanceof Error ? e.message : "Couldn't change the pause state."); } finally { setBusy(false); }
  }

  if (o.loading && !o.data) return <Loading />;
  if (o.error) return <ErrorText message={o.error.includes("Not authorised") ? "This account doesn't have the admin role." : `Couldn't load the overview: ${o.error}. If the agent tables don't exist yet, the migration hasn't been applied.`} onRetry={o.reload} />;
  const d = o.data!;
  const paused = s.data?.paused;
  const t = d.tasks;
  const stale = d.last_tick && Date.now() - new Date(d.last_tick.finished_at).getTime() > 15 * 60_000;

  return (
    <div className="space-y-4">
      <Card title="Team status" actions={<Btn small onClick={() => { o.reload(); s.reload(); }}><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />Refresh</Btn>}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold">{paused ? <Pill tone="bad">All agents paused</Pill> : <Pill tone="good">Running</Pill>}
              {d.last_tick ? <span className="font-normal text-muted-foreground">Last worker run {when(d.last_tick.finished_at)} ({d.last_tick.source.replace("worker:", "")}, {d.last_tick.processed} task{d.last_tick.processed === 1 ? "" : "s"})</span> : <span className="font-normal text-muted-foreground">The worker hasn't completed a run yet.</span>}</p>
            {paused && s.data?.paused_reason && <p className="mt-1 text-xs text-muted-foreground">Reason: {s.data.paused_reason}</p>}
            {stale && !paused && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">No completed run in the last 15 minutes. The scheduler calls the published site every 2 minutes; if the latest version isn't published yet, or the site is down, runs will be missing.</p>}
            <p className="mt-1 text-xs text-muted-foreground">Worker calls in the last 24 hours: {d.ticks_24h.requested} requested, {d.ticks_24h.completed} completed.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!paused && <><label htmlFor="pause-reason" className="sr-only">Reason for pausing</label><input id="pause-reason" className="dash-input !w-48 !py-2 text-sm" placeholder="Reason (optional)" value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} /></>}
            {paused ? <Btn tone="primary" disabled={busy} onClick={() => void setPaused(false)}><Play className="h-4 w-4" aria-hidden="true" />Resume all agents</Btn>
              : <Btn tone="danger" disabled={busy} onClick={() => void setPaused(true)}><Pause className="h-4 w-4" aria-hidden="true" />Pause all agents</Btn>}
          </div>
        </div>
        <ErrorText message={err} />
      </Card>

      {h.data && <HealthCard h={h.data} />}
      {h.error && <ErrorText message={`Health check unavailable: ${h.error}`} onRetry={h.reload} />}
      <TodayPanel agents={agents} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Active agents" value={`${d.agents.enabled}/${d.agents.total}`} />
        <Stat label="Jobs waiting" value={n(t.queued)} />
        <Stat label="Running now" value={n(t.running)} />
        <Stat label="Done (7 days)" value={n(t.done)} hint="Tasks completed in the last 7 days" />
        <Stat label="Failed / dead" value={`${n(t.failed)} / ${n(t.dead)}`} warn={(t.dead ?? 0) > 0} hint="Failed tasks are retried; dead tasks gave up after every attempt" />
        <Stat label="Human handovers" value={n(d.handovers)} warn={d.handovers > 0} />
        <Stat label="Replies (7 days)" value={n(d.actions_7d.reply)} />
        <Stat label="Posts (7 days)" value={n(d.actions_7d.post)} />
        <Stat label="Questions answered (7 days)" value={n(d.questions_answered_7d)} />
        <Stat label="Unanswered questions" value={n(d.unanswered)} warn={d.unanswered > 0} hint="Published questions from the last 30 days with no answer from anyone other than the author" />
        <Stat label="Research items (7 days)" value={n(d.research_7d)} />
        <Stat label="Content awaiting review" value={n(d.content.pending_review)} warn={(d.content.pending_review ?? 0) > 0} />
        <Stat label="Leads identified" value={n(Object.values(d.leads).reduce((a, b) => a + b, 0))} />
        <Stat label="Qualified+" value={n(["qualified", "service_recommended", "consultation_requested", "quote_requested"].reduce((a, k) => a + (d.leads[k] ?? 0), 0))} />
        <Stat label="Consultations requested" value={n(d.leads.consultation_requested)} />
        <Stat label="Won / lost" value={`${n(d.leads.won)} / ${n(d.leads.lost)}`} />
        <Stat label="AI calls today" value={`${n(d.usage_today.calls)}${d.usage_today.failed ? ` (${d.usage_today.failed} failed)` : ""}`} />
        <Stat label="Tokens this month" value={n(d.usage_month.tokens)} hint={`Estimated cost: ${cost(d.usage_month.cost)}`} />
      </div>
      <p className="text-xs text-muted-foreground">Estimated cost this month: {cost(d.usage_month.cost)}{d.usage_month.cost == null ? " (set token prices in Settings to see costs)" : ""}. Every number here is counted from the database; nothing is estimated except cost.</p>

      <Card title="Agents this week">
        {d.per_agent.length === 0 ? <Empty>No agents yet.</Empty> : (
          <div className="relative -mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-2 font-medium">Agent</th><th className="font-medium">Replies</th><th className="font-medium">Posts</th><th className="font-medium">Leads</th><th className="font-medium">Qualified</th><th className="font-medium">Won</th><th className="font-medium">Tokens (month)</th><th className="font-medium">Last activity</th></tr></thead>
              <tbody>{d.per_agent.map((a) => (
                <tr key={a.id} className="border-t border-border/60">
                  <td className="py-2"><button type="button" onClick={() => onOpenAgent(a.id)} className="font-semibold hover:underline">{a.name}</button> {!a.enabled && <Pill>off</Pill>}</td>
                  <td className="tabular-nums">{a.replies_7d}</td><td className="tabular-nums">{a.posts_7d}</td><td className="tabular-nums">{a.leads}</td><td className="tabular-nums">{a.qualified}</td><td className="tabular-nums">{a.won}</td><td className="tabular-nums">{n(a.tokens_month)}</td><td className="text-xs text-muted-foreground">{when(a.last_run)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Recent errors">
        {d.recent_errors.length === 0 ? <Empty>No failed runs.</Empty> : (
          <ul className="space-y-1.5 text-sm">{d.recent_errors.map((e, i) => <li key={i} className="flex flex-wrap gap-x-2"><span className="font-semibold">{e.kind}</span><span className="text-xs text-muted-foreground">{when(e.started_at)}</span><span className="min-w-0 break-words text-muted-foreground">{e.error}</span></li>)}</ul>
        )}
      </Card>
    </div>
  );
}

function HealthCard({ h }: { h: Health }) {
  const lastRun = h.scheduler?.last_run ? Date.now() - new Date(h.scheduler.last_run).getTime() : null;
  const lastDone = h.worker.last_completed ? Date.now() - new Date(h.worker.last_completed).getTime() : null;
  const problems: string[] = [];
  if (!h.scheduler) problems.push("The scheduler job is missing.");
  else if (!h.scheduler.active) problems.push("The scheduler job is switched off.");
  else if (lastRun == null || lastRun > 10 * 60_000) problems.push("The scheduler hasn't run in the last 10 minutes.");
  if (h.scheduler && h.scheduler.failed_24h > 0) problems.push(`${h.scheduler.failed_24h} scheduler run(s) failed in the last 24 hours.`);
  if (lastDone == null || lastDone > 15 * 60_000) problems.push("No worker run has completed in the last 15 minutes (is the latest version published and the site up?).");
  if (h.stuck_tasks) problems.push(`${h.stuck_tasks} task(s) stuck past their lease (they are retried automatically).`);
  if (h.overdue_tasks) problems.push(`${h.overdue_tasks} task(s) waiting more than 15 minutes past their run time.`);
  if (h.daily.alerts) problems.push(`${h.daily.alerts} agent(s) couldn't publish today's post after repeated attempts.`);
  return (
    <Card title="System health">
      {problems.length === 0 ? <p className="text-sm"><Pill tone="good">Healthy</Pill> <span className="text-muted-foreground">Scheduler and worker are running; nothing is stuck.</span></p>
        : <ul className="space-y-1 text-sm">{problems.map((p) => <li key={p} className="text-amber-800 dark:text-amber-300">• {p}</li>)}</ul>}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 lg:grid-cols-8">
        <Stat label="Scheduler runs (24h)" value={h.scheduler ? `${h.scheduler.runs_24h}` : "—"} hint={h.scheduler ? `Every ${h.scheduler.schedule}; last ${when(h.scheduler.last_run)}` : undefined} />
        <Stat label="Worker last completed" value={when(h.worker.last_completed)} />
        <Stat label="Worker calls (1h)" value={`${h.worker.completed_1h}/${h.worker.requested_1h}`} hint="Completed / requested" />
        <Stat label="Stuck / overdue" value={`${h.stuck_tasks} / ${h.overdue_tasks}`} warn={h.stuck_tasks + h.overdue_tasks > 0} />
        <Stat label="Dead tasks (7d)" value={h.dead_tasks_7d} warn={h.dead_tasks_7d > 0} />
        <Stat label={`Daily posts (${h.day})`} value={`${h.daily.met}/${h.daily.agents}`} warn={h.daily.alerts > 0} />
        <Stat label="Replies today" value={h.replies_today} />
        <Stat label="Leads awaiting Emmanuel" value={h.leads_awaiting} warn={h.leads_awaiting > 0} />
      </div>
    </Card>
  );
}

