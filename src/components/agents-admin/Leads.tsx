import { useState } from "react";
import { ExternalLink, UserCheck } from "lucide-react";
import { Btn, Card, check, db, Empty, ErrorText, Loading, Pill, STATUS_TONE, downloadCsv, label, myUid, useLoad, when, type AgentRow } from "./shared";

interface Lead {
  id: string; agent_id: string | null; source: string; source_id: string; member_id: string | null; post_id: string | null; need: string; niche: string | null; service_path: string | null;
  evidence: string | null; confidence: number; stage: string; next_action: string | null; next_action_at: string | null; assigned_to: string | null; outcome_note: string | null;
  human_override: boolean; history: { at: string; by: string; stage: string; note?: string; evidence?: string }[]; created_at: string; updated_at: string;
}
const STAGES = ["new", "needs_clarification", "qualified", "service_recommended", "consultation_requested", "quote_requested", "awaiting_human", "followup_scheduled", "won", "lost", "not_suitable"];
const OPEN = ["new", "needs_clarification", "qualified", "service_recommended", "consultation_requested", "quote_requested", "awaiting_human", "followup_scheduled"];
const SOURCE: Record<string, string> = { community_post: "Community post", community_comment: "Community comment", form_leads: "Website form", form_booking: "Booked call", form_audit: "Website audit", form_proposal: "Accepted proposal", admin: "Added by you" };

export function LeadsTab({ agents }: { agents: AgentRow[] }) {
  const [stage, setStage] = useState("open");
  const leads = useLoad<{ rows: Lead[]; names: Record<string, string> }>(async () => {
    let q = db.from("agent_lead_records").select("*").order("updated_at", { ascending: false }).limit(200);
    if (stage === "open") q = q.in("stage", OPEN); else if (stage) q = q.eq("stage", stage);
    const rows = check(await q) as Lead[];
    const ids = [...new Set(rows.map((r) => r.member_id).filter(Boolean))];
    const names: Record<string, string> = {};
    if (ids.length) { const { data } = await db.from("community_profiles").select("user_id,display_name,username").in("user_id", ids); for (const p of data ?? []) names[p.user_id] = `${p.display_name} (@${p.username})`; }
    return { rows, names };
  }, [stage]);
  const name = (id: string | null) => agents.find((a) => a.id === id)?.name ?? "Team";

  return (
    <Card title="Leads & opportunities" actions={<Btn small disabled={!leads.data?.rows.length} onClick={() => downloadCsv("agent-leads", (leads.data?.rows ?? []).map((l) => ({ ...l, agent: name(l.agent_id), member: leads.data?.names[l.member_id ?? ""] ?? "", history: l.history })))}>Export CSV</Btn>}>
      <div className="mb-3 flex flex-wrap gap-2">
        <label htmlFor="ld-s" className="sr-only">Stage</label>
        <select id="ld-s" className="dash-input !w-auto max-w-full !py-2 text-sm" value={stage} onChange={(e) => setStage(e.target.value)}><option value="open">All open</option><option value="">Everything</option>{STAGES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">Recorded by agents when a member shows real intent in the community (with the member's own words as evidence), and from website forms, bookings, audits and accepted proposals. Contact details stay in the original form records (Leads section of the main dashboard). Taking a lead stops agents changing it.</p>
      {leads.loading && !leads.data ? <Loading /> : leads.error ? <ErrorText message={leads.error} onRetry={leads.reload} /> : !leads.data!.rows.length ? <Empty>No leads in this view.</Empty> : (
        <ul className="space-y-3">{leads.data!.rows.map((l) => <LeadRow key={l.id} l={l} agent={name(l.agent_id)} member={l.member_id ? leads.data!.names[l.member_id] : null} agents={agents} onChanged={leads.reload} />)}</ul>
      )}
    </Card>
  );
}

function LeadRow({ l, agent, member, agents, onChanged }: { l: Lead; agent: string; member: string | null; agents: AgentRow[]; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(l.outcome_note ?? "");
  const [next, setNext] = useState(l.next_action ?? "");
  const [nextAt, setNextAt] = useState(l.next_action_at ? l.next_action_at.slice(0, 10) : "");
  const [err, setErr] = useState("");
  async function patch(p: Record<string, unknown>, hist?: string) {
    setErr("");
    try {
      const history = hist ? [...(l.history ?? []), { at: new Date().toISOString(), by: "admin", stage: (p.stage as string) ?? l.stage, note: hist }].slice(-30) : undefined;
      check(await db.from("agent_lead_records").update({ ...p, ...(history ? { history } : {}), ...(p.assigned_to === undefined && p.agent_id === undefined && hist ? { human_override: true } : {}) }).eq("id", l.id).select("id").single());
      onChanged();
    } catch (e) { setErr(e instanceof Error ? e.message : "Couldn't update the lead."); }
  }
  return (
    <li className="rounded-xl border border-border p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={STATUS_TONE[l.stage]}>{label(l.stage)}</Pill>
        <span className="font-semibold">{l.need}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {SOURCE[l.source] ?? l.source} · {agent} · confidence {Math.round(Number(l.confidence) * 100)}% · {when(l.created_at)}{member ? ` · ${member}` : ""}
        {l.post_id && <> · <a href={`/community/post/${l.post_id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[var(--emma-violet)] hover:underline">conversation<ExternalLink className="h-3 w-3" aria-hidden="true" /></a></>}
        {l.service_path && <> · recommended <a href={l.service_path} target="_blank" rel="noopener noreferrer" className="underline">{l.service_path}</a></>}
        {l.human_override && <> · <span className="font-semibold text-foreground">handled by a person</span></>}
      </p>
      {l.evidence && <p className="mt-1 text-xs"><span className="font-semibold">Evidence:</span> {l.evidence}</p>}
      {l.next_action && <p className="mt-0.5 text-xs"><span className="font-semibold">Next:</span> {l.next_action}{l.next_action_at ? ` (${new Date(l.next_action_at).toLocaleDateString()})` : ""}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label htmlFor={`st-${l.id}`} className="sr-only">Stage</label>
        <select id={`st-${l.id}`} className="dash-input !w-auto max-w-full !py-1.5 text-xs" value={l.stage} onChange={(e) => void patch({ stage: e.target.value }, `Stage set to ${label(e.target.value)}`)}>{STAGES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>
        {!l.human_override && <Btn small onClick={async () => void patch({ assigned_to: await myUid(), human_override: true, stage: ["won", "lost", "not_suitable"].includes(l.stage) ? l.stage : "awaiting_human" }, "Taken by a person")}><UserCheck className="h-3.5 w-3.5" aria-hidden="true" />Take this lead</Btn>}
        {l.human_override && <Btn small onClick={() => void patch({ human_override: false, assigned_to: null }, "Returned to the agents")}>Return to agents</Btn>}
        <label htmlFor={`ag-${l.id}`} className="sr-only">Owning agent</label>
        <select id={`ag-${l.id}`} className="dash-input !w-auto max-w-full !py-1.5 text-xs" value={l.agent_id ?? ""} onChange={(e) => void patch({ agent_id: e.target.value || null }, "Reassigned")}><option value="">No agent</option>{agents.filter((a) => !a.merged_into).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="text-xs font-semibold underline">{open ? "Less" : "Notes & history"}</button>
      </div>
      {open && (
        <div className="mt-2 space-y-2 rounded-lg bg-muted/40 p-2">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_160px_auto]">
            <label htmlFor={`nx-${l.id}`} className="sr-only">Next action</label><input id={`nx-${l.id}`} className="dash-input !py-1.5 text-xs" placeholder="Next action" value={next} maxLength={300} onChange={(e) => setNext(e.target.value)} />
            <label htmlFor={`na-${l.id}`} className="sr-only">Next action date</label><input id={`na-${l.id}`} type="date" className="dash-input !py-1.5 text-xs" value={nextAt} onChange={(e) => setNextAt(e.target.value)} />
            <Btn small onClick={() => void patch({ next_action: next || null, next_action_at: nextAt ? new Date(`${nextAt}T09:00:00Z`).toISOString() : null, ...(nextAt ? { stage: "followup_scheduled" } : {}) }, "Next action updated")}>Save</Btn>
          </div>
          <div className="flex gap-2"><label htmlFor={`on-${l.id}`} className="sr-only">Outcome note</label><input id={`on-${l.id}`} className="dash-input !py-1.5 text-xs" placeholder="Outcome / notes (e.g. signed website package)" value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} /><Btn small onClick={() => void patch({ outcome_note: note || null }, "Note updated")}>Save note</Btn></div>
          <ol className="space-y-0.5 text-[11px] text-muted-foreground">{(l.history ?? []).slice().reverse().map((h, i) => <li key={i}>{new Date(h.at).toLocaleString()} · {h.by} · {label(h.stage)}{h.note ? ` · ${h.note}` : ""}{h.evidence ? ` · "${h.evidence}"` : ""}</li>)}</ol>
        </div>
      )}
      <ErrorText message={err} />
    </li>
  );
}
