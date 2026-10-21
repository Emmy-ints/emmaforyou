import { useState } from "react";
import { ExternalLink, Hand, Undo2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Btn, Card, check, db, Empty, ErrorText, Loading, Pill, label, myUid, useLoad, when, type AgentRow } from "./shared";

interface Action { id: number; agent_id: string | null; action: string; post_id: string | null; comment_id: string | null; member_id: string | null; ok: boolean; reason: string | null; detail: Record<string, unknown>; created_at: string; post: { title: string | null; body: string } | null }
interface Handover { id: string; target_type: "post" | "lead" | "member"; target_id: string; state: "human" | "needs_human" | "agents"; reason: string | null; changed_at: string }
const ACTIONS = ["", "reply", "post", "followup", "route", "skip", "escalate", "flag", "queued_for_review"] as const;
const TONE: Record<string, "good" | "info" | "warn" | "bad" | "muted"> = { reply: "good", post: "good", followup: "good", route: "info", skip: "muted", escalate: "warn", flag: "bad", queued_for_review: "warn" };
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function ActivityTab({ agents }: { agents: AgentRow[] }) {
  const [action, setAction] = useState<string>("");
  const [agent, setAgent] = useState("");
  const list = useLoad<Action[]>(async () => {
    let q = db.from("agent_community_actions").select("*, post:community_posts(title,body)").order("created_at", { ascending: false }).limit(150);
    if (action) q = q.eq("action", action);
    if (agent) q = q.eq("agent_id", agent);
    return check(await q);
  }, [action, agent]);
  const hand = useLoad<Handover[]>(async () => check(await db.from("agent_handover_states").select("*").in("state", ["human", "needs_human"]).order("changed_at", { ascending: false }).limit(100)));
  const name = (id: string | null) => agents.find((a) => a.id === id)?.name ?? "System";

  return (
    <div className="space-y-4">
      <Handovers rows={hand.data} loading={hand.loading} error={hand.error} reload={hand.reload} />
      <Card title="Decisions & community actions">
        <div className="mb-3 flex flex-wrap gap-2">
          <label htmlFor="ac-a" className="sr-only">Action</label><select id="ac-a" className="dash-input !w-auto max-w-full !py-2 text-sm" value={action} onChange={(e) => setAction(e.target.value)}>{ACTIONS.map((a) => <option key={a} value={a}>{a ? label(a) : "All actions"}</option>)}</select>
          <label htmlFor="ac-g" className="sr-only">Agent</label><select id="ac-g" className="dash-input !w-auto max-w-full !py-2 text-sm" value={agent} onChange={(e) => setAgent(e.target.value)}><option value="">All agents</option>{agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">Every reply, post, follow-up, routing decision, skip and escalation the agents made, with the reason recorded at the time. Private assistant chats appear as replies without a post; read and take those over in the <Link to="/community/inbox" className="underline">support inbox</Link>.</p>
        {list.loading && !list.data ? <Loading /> : list.error ? <ErrorText message={list.error} onRetry={list.reload} /> : !list.data!.length ? <Empty>No agent activity yet. Activity appears once members post in the community or scheduled jobs run.</Empty> : (
          <ul className="divide-y divide-border">{list.data!.map((a) => <ActionRow key={a.id} a={a} agentName={name(a.agent_id)} onTookOver={hand.reload} />)}</ul>
        )}
      </Card>
    </div>
  );
}

function ActionRow({ a, agentName, onTookOver }: { a: Action; agentName: string; onTookOver: () => void }) {
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");
  async function takeOver() {
    if (!a.post_id) return;
    try { check(await db.from("agent_handover_states").upsert({ target_type: "post", target_id: a.post_id, state: "human", reason: "Taken over from the activity log", changed_by: await myUid(), changed_at: new Date().toISOString() }, { onConflict: "target_type,target_id" }).select("id")); onTookOver(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Couldn't take over."); }
  }
  const scores = Array.isArray(a.detail?.scores) ? (a.detail.scores as unknown[][]) : null;
  return (
    <li className="py-2.5 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={a.ok ? TONE[a.action] ?? "muted" : "bad"}>{label(a.action)}{a.ok ? "" : " (failed)"}</Pill>
        <span className="font-semibold">{agentName}</span><span className="text-xs text-muted-foreground">{when(a.created_at)}</span>
        {a.post_id && <a href={`/community/post/${a.post_id}${a.comment_id ? `#c-${a.comment_id}` : ""}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-w-0 max-w-full items-center gap-0.5 text-[var(--emma-violet)] hover:underline"><span className="truncate">{a.post?.title || a.post?.body?.slice(0, 60) || "Post"}</span><ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" /></a>}
        {(a.reason || Object.keys(a.detail ?? {}).length > 0) && <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="text-xs font-semibold text-muted-foreground underline">{open ? "Hide" : "Why"}</button>}
        {a.post_id && ["reply", "route", "followup", "queued_for_review"].includes(a.action) && <button type="button" onClick={() => void takeOver()} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"><Hand className="h-3.5 w-3.5" aria-hidden="true" />Take over thread</button>}
      </div>
      {open && (
        <div className="mt-1.5 rounded-lg bg-muted/50 p-2 text-xs">
          {a.reason && <p><span className="font-semibold">Reason:</span> {a.reason}</p>}
          {scores && <p className="mt-0.5"><span className="font-semibold">Routing scores:</span> {scores.map((s) => `${s[0]} ${s[1]}${Array.isArray(s[2]) && s[2].length ? ` (${(s[2] as string[]).join(", ")})` : ""}`).join(" · ")}</p>}
          {typeof a.detail?.chosen === "string" && <p className="mt-0.5"><span className="font-semibold">Chosen specialist:</span> {String(a.detail.chosen)}</p>}
          {Array.isArray(a.detail?.removed_links) && (a.detail.removed_links as string[]).length > 0 && <p className="mt-0.5"><span className="font-semibold">Links removed by the safety check:</span> {(a.detail.removed_links as string[]).join(", ")}</p>}
        </div>
      )}
      <ErrorText message={err} />
    </li>
  );
}

function Handovers({ rows, loading, error, reload }: { rows: Handover[] | null; loading: boolean; error: string; reload: () => void }) {
  const [target, setTarget] = useState("");
  const [type, setType] = useState<"post" | "member">("post");
  const [err, setErr] = useState("");
  async function set(t: Handover["target_type"], id: string, state: Handover["state"], reason: string) {
    setErr("");
    try { check(await db.from("agent_handover_states").upsert({ target_type: t, target_id: id, state, reason, changed_by: await myUid(), changed_at: new Date().toISOString() }, { onConflict: "target_type,target_id" }).select("id")); reload(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Couldn't change the handover."); }
  }
  async function takeOver() {
    let id = target.match(UUID)?.[0];
    if (!id && type === "member") {
      const u = target.trim().replace(/^.*\/community\/u\//, "").replace(/^@/, "").toLowerCase();
      const { data } = await db.from("community_profiles").select("user_id").eq("username", u).maybeSingle();
      id = data?.user_id;
    }
    if (!id) return setErr(type === "post" ? "Paste a community post link or ID." : "Enter a member's username or profile link.");
    await set(type, id, "human", "Taken over by the team");
    setTarget("");
  }
  return (
    <Card title="Human takeover">
      <p className="mb-3 text-xs text-muted-foreground">While a thread or member is with a person, no agent replies, follows up or publishes queued replies there. Hand it back when you're done. Agents also hand threads over themselves ("Needs a person") for complaints, disputes, legal or safety topics.</p>
      <div className="mb-3 flex flex-wrap gap-2">
        <label htmlFor="ho-t" className="sr-only">Type</label><select id="ho-t" className="dash-input !w-auto max-w-full !py-2 text-sm" value={type} onChange={(e) => setType(e.target.value as "post" | "member")}><option value="post">Thread</option><option value="member">Member</option></select>
        <label htmlFor="ho-v" className="sr-only">Thread link or member</label><input id="ho-v" className="dash-input !w-72 max-w-full !py-2 text-sm" placeholder={type === "post" ? "Post link or ID" : "Username or profile link"} value={target} onChange={(e) => setTarget(e.target.value)} />
        <Btn small disabled={!target.trim()} onClick={() => void takeOver()}><Hand className="h-3.5 w-3.5" aria-hidden="true" />Take over</Btn>
      </div>
      <ErrorText message={err || error} />
      {loading && !rows ? <Loading /> : !rows?.length ? <Empty>Nothing is with a person right now.</Empty> : (
        <ul className="divide-y divide-border">{rows.map((h) => (
          <li key={h.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
            <Pill tone={h.state === "needs_human" ? "warn" : "info"}>{h.state === "needs_human" ? "Needs a person" : "With a person"}</Pill>
            {h.target_type === "post" ? <a href={`/community/post/${h.target_id}`} target="_blank" rel="noopener noreferrer" className="text-[var(--emma-violet)] hover:underline">Thread</a> : <span>{label(h.target_type)}</span>}
            <span className="text-xs text-muted-foreground">{h.reason ?? ""} · {when(h.changed_at)}</span>
            <span className="ml-auto flex gap-2">
              {h.state === "needs_human" && <Btn small onClick={() => void set(h.target_type, h.target_id, "human", "Picked up by the team")}><Hand className="h-3.5 w-3.5" aria-hidden="true" />I'm handling it</Btn>}
              <Btn small onClick={() => void set(h.target_type, h.target_id, "agents", "Returned to the agents")}><Undo2 className="h-3.5 w-3.5" aria-hidden="true" />Return to agents</Btn>
            </span>
          </li>
        ))}</ul>
      )}
    </Card>
  );
}
