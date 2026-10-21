import { useState } from "react";
import { Play, RotateCcw, X } from "lucide-react";
import { Btn, Card, check, db, Empty, ErrorText, Loading, Pill, STATUS_TONE, downloadCsv, label, useLoad, when, type AgentRow } from "./shared";

interface Schedule { id: string; label: string; enabled: boolean; interval_minutes: number; next_run_at: string; last_run_at: string | null; last_status: string | null }
interface Task { id: string; kind: string; agent_id: string | null; status: string; priority: number; attempts: number; max_attempts: number; run_after: string; last_error: string | null; result: Record<string, unknown> | null; created_at: string; finished_at: string | null; dedupe_key: string }
interface Run { id: number; task_id: string | null; agent_id: string | null; kind: string; attempt: number; started_at: string; finished_at: string | null; ok: boolean | null; outcome: string | null; ms: number | null; error: string | null }

const every = (m: number) => (m % 1440 === 0 ? `${m / 1440} day${m === 1440 ? "" : "s"}` : m % 60 === 0 ? `${m / 60} hour${m === 60 ? "" : "s"}` : `${m} min`);

export function JobsTab({ agents }: { agents: AgentRow[] }) {
  const sched = useLoad<Schedule[]>(async () => check(await db.from("agent_schedules").select("*").order("interval_minutes")));
  const [status, setStatus] = useState("active");
  const tasks = useLoad<Task[]>(async () => {
    let q = db.from("agent_tasks").select("id,kind,agent_id,status,priority,attempts,max_attempts,run_after,last_error,result,created_at,finished_at,dedupe_key").order("updated_at", { ascending: false }).limit(100);
    if (status === "active") q = q.in("status", ["queued", "running"]); else if (status) q = q.eq("status", status);
    return check(await q);
  }, [status]);
  const runs = useLoad<Run[]>(async () => check(await db.from("agent_task_runs").select("*").order("started_at", { ascending: false }).limit(100)));
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const name = (id: string | null) => (id ? agents.find((a) => a.id === id)?.name ?? "agent" : "—");

  async function runNow(id: string) { setErr(""); setMsg(""); try { check(await db.rpc("agent_admin_run_schedule", { p_id: id })); setMsg(`"${id}" queued and the worker was called.`); tasks.reload(); } catch (e) { setErr(e instanceof Error ? e.message : "Couldn't start the job."); } }
  async function patchSched(id: string, p: Partial<Schedule>) { setErr(""); try { check(await db.from("agent_schedules").update(p).eq("id", id).select("id").single()); sched.reload(); } catch (e) { setErr(e instanceof Error ? e.message : "Couldn't update the schedule."); } }
  async function taskAction(id: string, action: "retry" | "cancel") { setErr(""); try { check(await db.rpc("agent_admin_task", { p_id: id, p_action: action })); tasks.reload(); } catch (e) { setErr(e instanceof Error ? e.message : "Couldn't update the task."); } }

  return (
    <div className="space-y-4">
      <Card title="Scheduled jobs">
        <p className="mb-3 text-xs text-muted-foreground">The database scheduler (pg_cron) checks every 2 minutes and calls the worker on the published site, so jobs run with no browser open. New posts and comments also call the worker straight away.</p>
        <ErrorText message={err} />{msg && <p role="status" className="mb-2 text-sm text-emerald-700 dark:text-emerald-300">{msg}</p>}
        {sched.loading && !sched.data ? <Loading /> : sched.error ? <ErrorText message={sched.error} onRetry={sched.reload} /> : (
          <div className="relative -mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-2 font-medium">Job</th><th className="font-medium">Every</th><th className="font-medium">Next run</th><th className="font-medium">Last run</th><th className="font-medium">On</th><th /></tr></thead>
              <tbody>{sched.data!.map((s) => (
                <tr key={s.id} className="border-t border-border/60">
                  <td className="py-2"><span className="font-medium">{s.label}</span><span className="block text-[11px] text-muted-foreground">{s.id}</span></td>
                  <td><label htmlFor={`iv-${s.id}`} className="sr-only">Interval in minutes for {s.label}</label><input id={`iv-${s.id}`} type="number" min={2} max={43200} defaultValue={s.interval_minutes} onBlur={(e) => { const v = Number(e.target.value); if (v !== s.interval_minutes && v >= 2) void patchSched(s.id, { interval_minutes: v }); }} className="dash-input !w-24 !py-1 text-xs" /><span className="ml-1 text-[11px] text-muted-foreground">min ({every(s.interval_minutes)})</span></td>
                  <td className="text-xs text-muted-foreground">{s.enabled ? when(s.next_run_at) : "—"}</td>
                  <td className="text-xs text-muted-foreground">{when(s.last_run_at)}</td>
                  <td><label className="sr-only" htmlFor={`en-${s.id}`}>Enable {s.label}</label><input id={`en-${s.id}`} type="checkbox" className="h-4 w-4 accent-[var(--emma-violet)]" checked={s.enabled} onChange={(e) => void patchSched(s.id, { enabled: e.target.checked })} /></td>
                  <td className="text-right"><Btn small onClick={() => void runNow(s.id)}><Play className="h-3.5 w-3.5" aria-hidden="true" />Run now</Btn></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Task queue" actions={<span className="flex flex-wrap gap-1.5">{[["active", "Waiting & running"], ["failed", "Retrying"], ["dead", "Dead letters"], ["done", "Done"], ["skipped", "Skipped"], ["", "All"]].map(([v, l]) => <button key={v} type="button" aria-pressed={status === v} onClick={() => setStatus(v)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${status === v ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}>{l}</button>)}</span>}>
        {tasks.loading && !tasks.data ? <Loading /> : tasks.error ? <ErrorText message={tasks.error} onRetry={tasks.reload} /> : !tasks.data!.length ? <Empty>No tasks in this view.</Empty> : (
          <ul className="divide-y divide-border">{tasks.data!.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
              <Pill tone={STATUS_TONE[t.status]}>{label(t.status)}</Pill>
              <span className="font-medium">{label(t.kind)}</span>
              <span className="text-xs text-muted-foreground">{name(t.agent_id)} · attempt {t.attempts}/{t.max_attempts} · {t.status === "queued" ? `runs ${when(t.run_after)}` : when(t.finished_at ?? t.created_at)}</span>
              {typeof t.result?.outcome === "string" && <span className="min-w-0 break-words text-xs">{String(t.result.outcome)}</span>}
              {t.last_error && <span className="min-w-0 break-words text-xs text-amber-700 dark:text-amber-300">{t.last_error}</span>}
              <span className="ml-auto flex gap-1.5">
                {["failed", "dead", "cancelled", "skipped"].includes(t.status) && <Btn small onClick={() => void taskAction(t.id, "retry")}><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />Retry</Btn>}
                {t.status === "queued" && <Btn small onClick={() => void taskAction(t.id, "cancel")}><X className="h-3.5 w-3.5" aria-hidden="true" />Cancel</Btn>}
              </span>
            </li>
          ))}</ul>
        )}
      </Card>

      <Card title="Run history" actions={<Btn small disabled={!runs.data?.length} onClick={() => downloadCsv("agent-runs", (runs.data ?? []).map((r) => ({ ...r, agent: name(r.agent_id) })))}>Export CSV</Btn>}>
        {runs.loading && !runs.data ? <Loading /> : runs.error ? <ErrorText message={runs.error} onRetry={runs.reload} /> : !runs.data!.length ? <Empty>The worker hasn't run any tasks yet.</Empty> : (
          <div className="relative -mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[640px] text-xs">
              <thead><tr className="text-left text-muted-foreground"><th className="py-1.5 font-medium">Started</th><th className="font-medium">Job</th><th className="font-medium">Agent</th><th className="font-medium">Result</th><th className="font-medium">Time</th></tr></thead>
              <tbody>{runs.data!.map((r) => (
                <tr key={r.id} className="border-t border-border/60 align-top">
                  <td className="py-1.5 text-muted-foreground">{new Date(r.started_at).toLocaleString()}</td><td>{label(r.kind)}{r.attempt > 1 ? ` (#${r.attempt})` : ""}</td><td>{name(r.agent_id)}</td>
                  <td className={r.ok === false ? "text-red-600 dark:text-red-400" : ""}>{r.finished_at ? (r.error ?? r.outcome ?? "ok") : "running…"}</td><td className="tabular-nums">{r.ms != null ? `${(r.ms / 1000).toFixed(1)}s` : "—"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
