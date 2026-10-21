import { useState } from "react";
import { Check, X, Pencil, ExternalLink } from "lucide-react";
import { Btn, Card, check, db, Empty, ErrorText, Loading, Pill, STATUS_TONE, label, myUid, useLoad, when, type AgentRow } from "./shared";

interface Item {
  id: string; agent_id: string; kind: "post" | "reply"; status: string; post_id: string | null; parent_comment_id: string | null; title: string | null; body: string;
  post_kind: string | null; tags: string[]; sources: { title: string; url: string }[]; reason: string | null; publish_at: string; published_ref: string | null; error: string | null; created_at: string;
}
const FILTERS = [["pending_review", "Awaiting approval"], ["scheduled", "Scheduled"], ["draft", "Drafts"], ["published", "Published"], ["failed", "Failed"], ["rejected", "Rejected"], ["", "All"]] as const;

export function ContentTab({ agents }: { agents: AgentRow[] }) {
  const [status, setStatus] = useState<string>("pending_review");
  const items = useLoad<Item[]>(async () => {
    let q = db.from("agent_content_queue").select("*").order("created_at", { ascending: false }).limit(100);
    if (status) q = q.eq("status", status);
    return check(await q);
  }, [status]);
  const name = (id: string) => agents.find((a) => a.id === id)?.name ?? "Agent";

  return (
    <Card title="Content queue">
      <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
        {FILTERS.map(([v, l]) => <button key={v} type="button" aria-pressed={status === v} onClick={() => setStatus(v)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${status === v ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}>{l}</button>)}
      </div>
      <p className="mb-3 text-xs text-muted-foreground">Posts and replies that agents wrote but haven't published (per each agent's policy), plus history. Approving schedules it for the next publish run (within about 5 minutes); "Publish now" runs it immediately.</p>
      {items.loading && !items.data ? <Loading /> : items.error ? <ErrorText message={items.error} onRetry={items.reload} /> : !items.data!.length ? <Empty>Nothing here.</Empty> : (
        <ul className="space-y-3">{items.data!.map((it) => <Row key={it.id} it={it} agent={name(it.agent_id)} onChanged={items.reload} />)}</ul>
      )}
    </Card>
  );
}

function Row({ it, agent, onChanged }: { it: Item; agent: string; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(it.title ?? "");
  const [body, setBody] = useState(it.body);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const editable = ["pending_review", "draft", "scheduled", "failed"].includes(it.status);

  async function update(patch: Record<string, unknown>, publishNow = false) {
    setBusy(true); setErr("");
    try {
      const uid = await myUid();
      check(await db.from("agent_content_queue").update({ ...patch, reviewed_by: uid, reviewed_at: new Date().toISOString() }).eq("id", it.id).select("id").single());
      if (publishNow) check(await db.rpc("agent_admin_run_schedule", { p_id: "publish" }));
      setEditing(false); onChanged();
    } catch (e) { setErr(e instanceof Error ? e.message : "Couldn't update."); } finally { setBusy(false); }
  }
  const approve = (now: boolean) => update({ status: "scheduled", publish_at: new Date().toISOString(), title: it.kind === "post" ? title : it.title, body, error: null }, now);

  return (
    <li className="rounded-xl border border-border p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Pill tone={STATUS_TONE[it.status]}>{label(it.status)}</Pill><span className="font-semibold">{agent}</span><span className="text-muted-foreground">{it.kind === "post" ? `New ${it.post_kind ?? "post"}` : "Reply"} · {when(it.created_at)}</span>
        {it.post_id && <a href={`/community/post/${it.post_id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[var(--emma-violet)] hover:underline">Thread<ExternalLink className="h-3 w-3" aria-hidden="true" /></a>}
        {it.published_ref && it.kind === "post" && <a href={`/community/post/${it.published_ref}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[var(--emma-violet)] hover:underline">View post<ExternalLink className="h-3 w-3" aria-hidden="true" /></a>}
      </div>
      {editing ? (
        <div className="mt-2 space-y-2">
          {it.kind === "post" && <><label htmlFor={`t-${it.id}`} className="sr-only">Title</label><input id={`t-${it.id}`} className="dash-input text-sm font-semibold" maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} /></>}
          <label htmlFor={`b-${it.id}`} className="sr-only">Body</label><textarea id={`b-${it.id}`} rows={10} maxLength={10000} className="dash-input text-sm" value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
      ) : (
        <div className="mt-2">
          {it.title && <p className="font-semibold">{it.title}</p>}
          <p className="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap text-sm text-muted-foreground">{it.body}</p>
        </div>
      )}
      {it.sources?.length > 0 && <div className="mt-2 text-xs"><p className="font-semibold">Sources (evidence)</p><ul className="list-disc pl-5">{it.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="break-all underline">{s.title || s.url}</a></li>)}</ul></div>}
      {it.reason && <p className="mt-1 text-xs text-muted-foreground">Why: {it.reason}</p>}
      {it.error && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Note: {it.error}</p>}
      <ErrorText message={err} />
      {editable && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Btn small tone="primary" disabled={busy} onClick={() => void approve(false)}><Check className="h-3.5 w-3.5" aria-hidden="true" />Approve</Btn>
          <Btn small disabled={busy} onClick={() => void approve(true)}>Approve & publish now</Btn>
          {editing ? <Btn small onClick={() => { setEditing(false); setTitle(it.title ?? ""); setBody(it.body); }}>Cancel edit</Btn> : <Btn small onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5" aria-hidden="true" />Edit</Btn>}
          {it.status !== "draft" && it.kind === "post" && <Btn small disabled={busy} onClick={() => void update({ status: "draft" })}>Move to drafts</Btn>}
          <Btn small tone="danger" disabled={busy} onClick={() => void update({ status: "rejected" })}><X className="h-3.5 w-3.5" aria-hidden="true" />Reject</Btn>
        </div>
      )}
    </li>
  );
}
