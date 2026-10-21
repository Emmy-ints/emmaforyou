import { useState } from "react";
import { ExternalLink, Send } from "lucide-react";
import { Btn, Card, check, db, Empty, ErrorText, Loading, Pill, label, useLoad, when, type AgentRow } from "./shared";

interface Daily { id: string; agent_id: string; day: string; target: number; published_count: number; slot_at: string; status: string; attempts: number; rounds: number; mode: string | null; last_error: string | null; last_published_at: string | null; post_ids: string[]; alerted_at: string | null; updated_at: string }
interface Pending { id: string; kind: string; status: string; run_after: string; payload: { post_id?: string; comment_id?: string; involved?: boolean }; attempts: number; last_error: string | null }
const TONE: Record<string, "good" | "info" | "warn" | "bad" | "muted"> = { published: "good", scheduled: "info", writing: "info", retrying: "warn", awaiting_review: "warn", failed: "bad", skipped: "muted" };

/** Today's publishing targets (from the persistent tracker) and replies waiting in the response window. */
export function TodayPanel({ agents }: { agents: AgentRow[] }) {
  const daily = useLoad<{ day: string; rows: Daily[] }>(async () => {
    const latest = check(await db.from("agent_daily_posts").select("day").order("day", { ascending: false }).limit(1)) as { day: string }[];
    const day = latest[0]?.day; if (!day) return { day: "", rows: [] };
    return { day, rows: check(await db.from("agent_daily_posts").select("*").eq("day", day).order("slot_at")) as Daily[] };
  });
  const pending = useLoad<{ rows: Pending[]; titles: Record<string, string> }>(async () => {
    const rows = (check(await db.from("agent_tasks").select("id,kind,status,run_after,payload,attempts,last_error").in("kind", ["post_created", "comment_created", "second_opinion"]).in("status", ["queued", "running"]).order("run_after").limit(50)) as Pending[]).map((r) => ({ ...r, payload: r.payload ?? {} }));
    const ids = [...new Set(rows.map((r) => r.payload.post_id).filter(Boolean))] as string[];
    const titles: Record<string, string> = {};
    if (ids.length) { const { data } = await db.from("community_posts").select("id,title,body").in("id", ids); for (const p of data ?? []) titles[p.id] = p.title || p.body.slice(0, 60); }
    return { rows, titles };
  });
  const [err, setErr] = useState(""); const [msg, setMsg] = useState("");
  const name = (id: string) => agents.find((a) => a.id === id)?.name ?? "Agent";
  async function now(agent?: string) {
    setErr(""); setMsg("");
    try { const n = check(await db.rpc("agent_admin_daily_now", { p_agent: agent ?? null })) as number; setMsg(n ? `Started ${n} post${n === 1 ? "" : "s"}. They publish one by one over the next few minutes.` : "Queued: the planner will create today's posts now."); daily.reload(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Couldn't start."); }
  }
  const rows = daily.data?.rows ?? [];
  const met = rows.filter((r) => r.published_count >= r.target).length;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <Card className="min-w-0" title={daily.data?.day ? `Today's posts · ${daily.data.day}` : "Today's posts"} actions={<Btn small onClick={() => void now()}><Send className="h-3.5 w-3.5" aria-hidden="true" />Write remaining posts now</Btn>}>
        <p className="mb-2 text-xs text-muted-foreground">Every active agent publishes at least its daily target, spread across the posting window (Settings). Counts come from posts actually live in the community feed. {rows.length ? <strong className="text-foreground">{met}/{rows.length} agents at target.</strong> : null}</p>
        <ErrorText message={err || daily.error} />{msg && <p role="status" className="mb-2 text-sm text-emerald-700 dark:text-emerald-300">{msg}</p>}
        {daily.loading && !daily.data ? <Loading /> : !rows.length ? <Empty>The daily planner creates today's schedule on its next run (every 10 minutes).</Empty> : (
          <div className="relative -mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[620px] text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1.5 font-medium">Agent</th><th className="font-medium">Done</th><th className="font-medium">Status</th><th className="font-medium">Slot / last post</th><th className="font-medium">Notes</th><th /></tr></thead>
              <tbody>{rows.map((r) => (
                <tr key={r.id} className="border-t border-border/60 align-top">
                  <td className="py-1.5 font-semibold">{name(r.agent_id)}</td>
                  <td className="tabular-nums">{r.published_count}/{r.target}</td>
                  <td><Pill tone={TONE[r.status]}>{label(r.status)}</Pill></td>
                  <td className="text-xs text-muted-foreground">{r.published_count >= r.target && r.last_published_at ? `posted ${when(r.last_published_at)}` : `due ${when(r.slot_at)}`}</td>
                  <td className="max-w-[260px] text-xs">{r.post_ids.map((id, i) => <a key={id} href={`/community/post/${id}`} target="_blank" rel="noopener noreferrer" className="mr-2 inline-flex items-center gap-0.5 text-[var(--emma-violet)] hover:underline">post {i + 1}<ExternalLink className="h-3 w-3" aria-hidden="true" /></a>)}{r.mode && <span className="text-muted-foreground">{r.mode}</span>}{r.last_error && r.published_count < r.target && <span className="block break-words text-amber-700 dark:text-amber-300">{r.last_error}{r.attempts ? ` (attempt ${r.attempts}${r.rounds ? `, round ${r.rounds + 1}` : ""})` : ""}</span>}{r.alerted_at && <span className="block font-semibold text-red-600">Needs attention</span>}</td>
                  <td className="text-right">{r.published_count < r.target && !["writing"].includes(r.status) && <Btn small onClick={() => void now(r.agent_id)}>Now</Btn>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Card>
      <Card className="min-w-0" title="Replies in the response window">
        <p className="mb-2 text-xs text-muted-foreground">New posts and comments wait about 3 minutes (Settings) before the best-fit specialist decides whether a reply would add value. Many end as "no reply needed", and that's intended.</p>
        {pending.loading && !pending.data ? <Loading /> : pending.error ? <ErrorText message={pending.error} onRetry={pending.reload} /> : !pending.data!.rows.length ? <Empty>Nothing waiting right now.</Empty> : (
          <ul className="divide-y divide-border">{pending.data!.rows.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
              <Pill tone="info">{p.kind === "post_created" ? "New post" : p.kind === "comment_created" ? (p.payload.involved ? "Reply to an agent" : "New comment") : "Second opinion"}</Pill>
              {p.payload.post_id && <a href={`/community/post/${p.payload.post_id}`} target="_blank" rel="noopener noreferrer" className="min-w-0 max-w-full truncate text-[var(--emma-violet)] hover:underline">{pending.data!.titles[p.payload.post_id] ?? "Post"}</a>}
              <span className="text-xs text-muted-foreground">{p.status === "running" ? "being handled now" : `considered ${when(p.run_after)}`}</span>
            </li>
          ))}</ul>
        )}
      </Card>
    </div>
  );
}
