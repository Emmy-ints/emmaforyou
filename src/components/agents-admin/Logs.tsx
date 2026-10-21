import { useState } from "react";
import { Btn, Card, check, db, Empty, ErrorText, Loading, Pill, downloadCsv, label, useLoad, when, type AgentRow } from "./shared";

interface Audit { id: number; actor_type: string; actor_id: string | null; agent_id: string | null; action: string; target_type: string | null; target_id: string | null; details: Record<string, unknown>; created_at: string }
interface Report { id: number; period: "day" | "week" | "insights"; period_start: string; data: Record<string, unknown>; created_at: string }
interface Usage { id: number; agent_id: string | null; purpose: string; provider: string | null; model: string | null; ok: boolean; input_tokens: number | null; output_tokens: number | null; est_cost_usd: number | null; ms: number | null; created_at: string }

export function LogsTab({ agents }: { agents: AgentRow[] }) {
  const [actor, setActor] = useState("");
  const audit = useLoad<Audit[]>(async () => { let q = db.from("agent_audit_logs").select("*").order("created_at", { ascending: false }).limit(200); if (actor) q = q.eq("actor_type", actor); return check(await q); }, [actor]);
  const reports = useLoad<Report[]>(async () => check(await db.from("agent_reports").select("*").order("created_at", { ascending: false }).limit(20)));
  const usage = useLoad<Usage[]>(async () => check(await db.from("agent_usage_records").select("*").order("created_at", { ascending: false }).limit(200)));
  const name = (id: string | null) => (id ? agents.find((a) => a.id === id)?.name ?? "agent" : "");

  return (
    <div className="space-y-4">
      <Card title="Summaries & insights">
        {reports.loading && !reports.data ? <Loading /> : reports.error ? <ErrorText message={reports.error} onRetry={reports.reload} /> : !reports.data!.length ? <Empty>The daily summary job writes the first report after its first run.</Empty> : (
          <ul className="space-y-2">{reports.data!.map((r) => <ReportRow key={r.id} r={r} />)}</ul>
        )}
      </Card>
      <Card title="Audit log" actions={<span className="flex gap-2"><label htmlFor="lg-a" className="sr-only">Actor</label><select id="lg-a" className="dash-input !w-auto !py-1.5 text-xs" value={actor} onChange={(e) => setActor(e.target.value)}><option value="">Everyone</option><option value="admin">Admins</option><option value="agent">Agents</option><option value="system">System</option></select><Btn small disabled={!audit.data?.length} onClick={() => downloadCsv("agent-audit-log", (audit.data ?? []).map((a) => ({ ...a, agent: name(a.agent_id) })))}>Export CSV</Btn></span>}>
        <p className="mb-2 text-xs text-muted-foreground">Every configuration change made from this dashboard (who, what, before → after), plus agent and system events such as leads recorded, escalations, dead-lettered tasks and auto-assigned niches.</p>
        {audit.loading && !audit.data ? <Loading /> : audit.error ? <ErrorText message={audit.error} onRetry={audit.reload} /> : !audit.data!.length ? <Empty>No entries.</Empty> : (
          <ul className="max-h-[520px] divide-y divide-border overflow-y-auto">{audit.data!.map((a) => (
            <li key={a.id} className="py-1.5 text-xs">
              <span className="flex flex-wrap items-center gap-1.5"><Pill tone={a.actor_type === "admin" ? "info" : a.actor_type === "agent" ? "good" : "muted"}>{a.actor_type}</Pill><span className="font-semibold">{label(a.action)}</span>{a.target_type && <span className="text-muted-foreground">{a.target_type}{a.target_id ? ` · ${a.target_id.slice(0, 40)}` : ""}</span>}{a.agent_id && <span>{name(a.agent_id)}</span>}<span className="text-muted-foreground">{when(a.created_at)}</span></span>
              {Object.keys(a.details ?? {}).length > 0 && <code className="mt-0.5 block max-h-20 overflow-y-auto whitespace-pre-wrap break-all rounded bg-muted/50 p-1 text-[10px]">{JSON.stringify(a.details).slice(0, 600)}</code>}
            </li>
          ))}</ul>
        )}
      </Card>
      <Card title="AI usage" actions={<Btn small disabled={!usage.data?.length} onClick={() => downloadCsv("agent-ai-usage", (usage.data ?? []).map((u) => ({ ...u, agent: name(u.agent_id) })))}>Export CSV</Btn>}>
        {usage.loading && !usage.data ? <Loading /> : usage.error ? <ErrorText message={usage.error} onRetry={usage.reload} /> : !usage.data!.length ? <Empty>No AI calls yet.</Empty> : (
          <div className="relative -mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[620px] text-xs">
              <thead><tr className="text-left text-muted-foreground"><th className="py-1.5 font-medium">When</th><th className="font-medium">Agent</th><th className="font-medium">Purpose</th><th className="font-medium">Model</th><th className="font-medium">Tokens in/out</th><th className="font-medium">Est. cost</th><th className="font-medium">Time</th></tr></thead>
              <tbody>{usage.data!.map((u) => (
                <tr key={u.id} className={`border-t border-border/60 ${u.ok ? "" : "text-red-600 dark:text-red-400"}`}>
                  <td className="py-1.5">{when(u.created_at)}</td><td>{name(u.agent_id) || "—"}</td><td>{label(u.purpose)}{u.ok ? "" : " (failed)"}</td><td>{u.model ?? "—"}</td>
                  <td className="tabular-nums">{u.input_tokens ?? "?"} / {u.output_tokens ?? "?"}</td><td className="tabular-nums">{u.est_cost_usd != null ? `$${Number(u.est_cost_usd).toFixed(4)}` : "—"}</td><td className="tabular-nums">{u.ms != null ? `${(u.ms / 1000).toFixed(1)}s` : "—"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function ReportRow({ r }: { r: Report }) {
  const [open, setOpen] = useState(false);
  const d = r.data as Record<string, unknown>;
  const title = r.period === "insights" ? `Insights · ${r.period_start}` : `${r.period === "day" ? "Daily" : "Weekly"} summary · from ${r.period_start}`;
  const line = r.period === "insights"
    ? `${(d.recurring_questions as unknown[] | undefined)?.length ?? 0} recurring question group(s), ${(d.unmet_needs as unknown[] | undefined)?.length ?? 0} need(s) without a matching service, ${d.member_posts ?? 0} member posts analysed`
    : `${Object.values((d.actions as Record<string, number>) ?? {}).reduce((a, b) => a + b, 0)} actions, ${d.ai_calls ?? 0} AI calls${d.ai_failed ? ` (${d.ai_failed} failed)` : ""}, ${Number(d.tokens ?? 0).toLocaleString()} tokens${d.cost_usd != null ? `, $${Number(d.cost_usd).toFixed(2)}` : ""}`;
  return (
    <li className="rounded-xl border border-border p-3 text-sm">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="w-full text-left"><span className="font-semibold">{title}</span><span className="block text-xs text-muted-foreground">{line}</span></button>
      {open && <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-muted/50 p-2 text-[11px]">{JSON.stringify(d, null, 2)}</pre>}
    </li>
  );
}
