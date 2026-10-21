import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, X, Send, GitMerge } from "lucide-react";
import { Btn, Card, check, db, Empty, ErrorText, Loading, Pill, useLoad, type AgentRow, type Assignment } from "./shared";

const NICHE_TYPES = ["expertise", "solution_category", "solution", "industry", "niche", "tool"] as const;
const CAPS = ["reply", "post", "research", "lead", "followup", "flag"] as const;
const CAP_LABEL: Record<string, string> = { reply: "Reply to members", post: "Publish posts", research: "Collect research", lead: "Record leads", followup: "Follow up", flag: "Flag harmful content" };

export function AgentsTab({ focus, onFocused }: { focus: string | null; onFocused: () => void }) {
  const agents = useLoad<AgentRow[]>(async () => check(await db.from("agent_profiles").select("*").order("sort").order("name")));
  const assigns = useLoad<Assignment[]>(async () => check(await db.from("agent_niche_assignments").select("*").order("niche_type").order("niche_key").limit(5000)));
  const [q, setQ] = useState("");
  const [niche, setNiche] = useState("");
  const [open, setOpen] = useState<string | "new" | null>(null);
  useEffect(() => { if (focus) { setOpen(focus); onFocused(); } }, [focus, onFocused]);

  const byAgent = useMemo(() => {
    const m = new Map<string, Assignment[]>();
    for (const a of assigns.data ?? []) { const l = m.get(a.agent_id) ?? []; l.push(a); m.set(a.agent_id, l); }
    return m;
  }, [assigns.data]);
  const list = (agents.data ?? []).filter((a) => {
    const t = q.trim().toLowerCase();
    const text = `${a.name} ${a.title} ${a.scope} ${a.keywords.join(" ")}`.toLowerCase();
    const n = niche.trim().toLowerCase();
    return (!t || text.includes(t)) && (!n || (byAgent.get(a.id) ?? []).some((x) => `${x.niche_type}:${x.niche_key}`.includes(n)));
  });

  if (agents.loading && !agents.data) return <Loading />;
  if (agents.error) return <ErrorText message={agents.error} onRetry={agents.reload} />;
  const current = open && open !== "new" ? agents.data!.find((a) => a.id === open) ?? null : null;

  return (
    <div className="space-y-4">
      <Card title={`Agent directory (${agents.data!.filter((a) => !a.merged_into).length})`} actions={<Btn small tone="primary" onClick={() => setOpen("new")}><Plus className="h-3.5 w-3.5" aria-hidden="true" />New agent</Btn>}>
        <div className="mb-3 grid gap-2 sm:grid-cols-2">
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><label htmlFor="ag-q" className="sr-only">Search agents</label><input id="ag-q" className="dash-input !pl-9" placeholder="Search name, title, scope or keyword" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div><label htmlFor="ag-n" className="sr-only">Filter by niche</label><input id="ag-n" className="dash-input" placeholder="Filter by niche (e.g. shopify, solution:ai-solutions, /website-audit)" value={niche} onChange={(e) => setNiche(e.target.value)} /></div>
        </div>
        {list.length === 0 ? <Empty>No agents match.</Empty> : (
          <ul className="grid gap-2 md:grid-cols-2">{list.map((a) => (
            <li key={a.id}>
              <button type="button" onClick={() => setOpen(a.id)} className={`w-full rounded-xl border p-3 text-left transition hover:border-[var(--emma-violet)] ${open === a.id ? "border-[var(--emma-violet)]" : "border-border"}`}>
                <span className="flex flex-wrap items-center gap-1.5"><span className="font-semibold">{a.name}</span>{a.kind === "general" && <Pill tone="info">coordinator</Pill>}{a.merged_into ? <Pill>merged</Pill> : !a.enabled ? <Pill tone="bad">off</Pill> : <Pill tone="good">on</Pill>}{a.reply_policy !== "auto" && <Pill tone="warn">replies: {a.reply_policy}</Pill>}{a.publish_policy !== "auto" && <Pill tone="warn">posts: {a.publish_policy}</Pill>}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{a.title}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{(byAgent.get(a.id) ?? []).length} niches · {a.daily_post_target ?? 1} post{(a.daily_post_target ?? 1) === 1 ? "" : "s"}/day · up to {a.daily_reply_limit} replies/day</span>
              </button>
            </li>
          ))}</ul>
        )}
      </Card>
      {open === "new" && <AgentEditor key="new" agent={null} all={agents.data!} assignments={[]} onClose={() => setOpen(null)} onSaved={(id) => { agents.reload(); assigns.reload(); setOpen(id); }} />}
      {current && <AgentEditor key={current.id} agent={current} all={agents.data!} assignments={byAgent.get(current.id) ?? []} onClose={() => setOpen(null)} onSaved={() => { agents.reload(); assigns.reload(); }} />}
    </div>
  );
}

type Draft = Omit<AgentRow, "id" | "user_id" | "created_at" | "updated_at" | "merged_into">;
const blank: Draft = {
  slug: "", name: "", title: "", kind: "specialist", description: "", scope: "", voice: "", knowledge: "", problem_workflow: "", sales_workflow: "", community_strategy: "", research_strategy: "", limits: "",
  keywords: [], topics: [], capabilities: [...CAPS], enabled: true, reply_policy: "auto", publish_policy: "review", posts_per_week: 7, daily_post_target: 1, daily_reply_limit: 20, monthly_token_budget: null, model: null, sort: 100,
};

function AgentEditor({ agent, all, assignments, onClose, onSaved }: { agent: AgentRow | null; all: AgentRow[]; assignments: Assignment[]; onClose: () => void; onSaved: (id: string) => void }) {
  const [d, setD] = useState<Draft>(() => (agent ? { ...agent } : blank));
  const [kw, setKw] = useState((agent?.keywords ?? []).join(", "));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const isNew = !agent;

  async function save() {
    setBusy(true); setErr(""); setMsg("");
    const { id: _i, user_id: _u, created_at: _c, updated_at: _up, merged_into: _m, ...editable } = d as Draft & Partial<AgentRow>; // eslint-disable-line @typescript-eslint/no-unused-vars
    const row: Record<string, unknown> = { ...editable, keywords: kw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).slice(0, 60), model: d.model?.trim() || null, monthly_token_budget: d.monthly_token_budget || null };
    // Fields the database fills in itself; defaults stay in force when a long-text field is left empty.
    for (const k of ["problem_workflow", "sales_workflow", "community_strategy", "research_strategy", "limits"] as const) if (isNew && !String(row[k] ?? "").trim()) delete row[k];
    try {
      if (isNew) {
        if (!/^[a-z][a-z0-9-]{1,30}$/.test(d.slug)) throw new Error("The ID must be lowercase letters, numbers or dashes (e.g. bookings-expert).");
        const r = check(await db.from("agent_profiles").insert(row).select("id").single()) as { id: string };
        setMsg("Agent created with its own labelled AI community profile."); onSaved(r.id);
      } else {
        delete row.slug;
        check(await db.from("agent_profiles").update(row).eq("id", agent.id).select("id").single());
        setMsg("Saved."); onSaved(agent.id);
      }
    } catch (e) { setErr(e instanceof Error ? e.message : "Couldn't save."); } finally { setBusy(false); }
  }

  const text = (k: keyof Draft, lbl: string, rows = 2, max = 2000, hint?: string) => (
    <div><label htmlFor={`ae-${k}`} className="text-xs font-semibold">{lbl}</label>{hint && <span className="ml-1 text-[11px] text-muted-foreground">{hint}</span>}
      <textarea id={`ae-${k}`} rows={rows} maxLength={max} className="dash-input mt-1 text-sm" value={String(d[k] ?? "")} onChange={(e) => set(k, e.target.value as never)} placeholder={isNew && ["problem_workflow", "sales_workflow", "community_strategy", "research_strategy", "limits"].includes(k) ? "Leave empty to use the standard team workflow" : undefined} /></div>
  );

  return (
    <Card title={isNew ? "New agent" : `${agent.name} — ${agent.title}`} actions={<button type="button" onClick={onClose} aria-label="Close editor" className="dash-icon-btn"><X className="h-4 w-4" aria-hidden="true" /></button>}>
      {agent?.merged_into && <p className="mb-3 text-sm text-muted-foreground">Merged into {all.find((a) => a.id === agent.merged_into)?.name ?? "another agent"}; it no longer receives work.</p>}
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label htmlFor="ae-name" className="text-xs font-semibold">Name</label><input id="ae-name" className="dash-input mt-1" maxLength={40} value={d.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div><label htmlFor="ae-slug" className="text-xs font-semibold">ID</label><input id="ae-slug" className="dash-input mt-1" maxLength={31} value={d.slug} disabled={!isNew} onChange={(e) => set("slug", e.target.value.toLowerCase())} /></div>
          </div>
          <div><label htmlFor="ae-title" className="text-xs font-semibold">Specialty title</label><input id="ae-title" className="dash-input mt-1" maxLength={100} value={d.title} onChange={(e) => set("title", e.target.value)} /></div>
          {text("description", "Identity (shown on its community profile)", 2, 2000)}
          {text("scope", "Scope of expertise", 2)}
          {text("voice", "Personality & communication style", 2, 1000)}
          {text("knowledge", "Specialist knowledge", 3, 8000, "verified facts only")}
          <div><label htmlFor="ae-kw" className="text-xs font-semibold">Routing keywords</label><span className="ml-1 text-[11px] text-muted-foreground">comma-separated; decide which posts this agent is considered for</span>
            <textarea id="ae-kw" rows={2} className="dash-input mt-1 text-sm" value={kw} onChange={(e) => setKw(e.target.value)} /></div>
        </div>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label htmlFor="ae-reply" className="text-xs font-semibold">Community replies</label>
              <select id="ae-reply" className="dash-input mt-1" value={d.reply_policy} onChange={(e) => set("reply_policy", e.target.value as Draft["reply_policy"])}><option value="auto">Publish automatically</option><option value="review">Wait for my approval</option><option value="off">Don't reply</option></select></div>
            <div><label htmlFor="ae-pub" className="text-xs font-semibold">Educational posts</label>
              <select id="ae-pub" className="dash-input mt-1" value={d.publish_policy} onChange={(e) => set("publish_policy", e.target.value as Draft["publish_policy"])}><option value="auto">Publish automatically</option><option value="review">Wait for my approval</option><option value="draft">Save as drafts</option><option value="off">Don't write posts</option></select></div>
            <div><label htmlFor="ae-ppd" className="text-xs font-semibold">Posts per day (minimum)</label><input id="ae-ppd" type="number" min={0} max={10} className="dash-input mt-1" value={d.daily_post_target ?? 1} onChange={(e) => set("daily_post_target", Math.max(0, Math.min(10, Number(e.target.value) || 0)))} /></div>
            <div><label htmlFor="ae-drl" className="text-xs font-semibold">Replies per day (max)</label><input id="ae-drl" type="number" min={0} max={500} className="dash-input mt-1" value={d.daily_reply_limit} onChange={(e) => set("daily_reply_limit", Math.max(0, Math.min(500, Number(e.target.value) || 0)))} /></div>
            <div><label htmlFor="ae-budget" className="text-xs font-semibold">Monthly token budget</label><input id="ae-budget" type="number" min={0} className="dash-input mt-1" placeholder="Team limit only" value={d.monthly_token_budget ?? ""} onChange={(e) => set("monthly_token_budget", e.target.value === "" ? null : Math.max(0, Number(e.target.value)))} /></div>
            <div><label htmlFor="ae-model" className="text-xs font-semibold">Model override</label><input id="ae-model" className="dash-input mt-1" maxLength={64} placeholder="Team default" value={d.model ?? ""} onChange={(e) => set("model", e.target.value)} /></div>
          </div>
          <fieldset><legend className="text-xs font-semibold">Allowed actions</legend>
            <div className="mt-1 grid grid-cols-2 gap-1">{CAPS.map((c) => <label key={c} className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[var(--emma-violet)]" checked={d.capabilities.includes(c)} onChange={(e) => set("capabilities", e.target.checked ? [...d.capabilities, c] : d.capabilities.filter((x) => x !== c))} />{CAP_LABEL[c]}</label>)}</div>
          </fieldset>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-[var(--emma-violet)]" checked={d.enabled} onChange={(e) => set("enabled", e.target.checked)} />Agent is active</label>
          {d.kind === "general" && <p className="text-xs text-muted-foreground">This is the General Opportunities coordinator: it routes posts to specialists and covers anything without a specialist.</p>}
        </div>
      </div>
      <details className="mt-3 rounded-xl border border-border p-3">
        <summary className="cursor-pointer text-sm font-semibold">Workflows, research and limits</summary>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {text("problem_workflow", "Problem-solving workflow", 3)}
          {text("sales_workflow", "Sales & qualification workflow", 3)}
          {text("community_strategy", "Community contribution strategy", 3)}
          {text("research_strategy", "Research strategy", 3)}
          {text("limits", "Limits & escalation rules", 3)}
        </div>
      </details>
      <ErrorText message={err} />
      {msg && <p role="status" className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">{msg}</p>}
      <div className="mt-3 flex flex-wrap gap-2"><Btn tone="primary" disabled={busy || !d.name.trim() || !d.title.trim()} onClick={() => void save()}>{isNew ? "Create agent" : "Save changes"}</Btn><Btn onClick={onClose}>Close</Btn></div>
      {agent && !agent.merged_into && <>
        <Niches agent={agent} assignments={assignments} all={all} onChanged={() => onSaved(agent.id)} />
        <AssignTask agent={agent} />
        <Merge agent={agent} all={all} onDone={() => onSaved(agent.id)} />
      </>}
    </Card>
  );
}

function Niches({ agent, assignments, all, onChanged }: { agent: AgentRow; assignments: Assignment[]; all: AgentRow[]; onChanged: () => void }) {
  const [type, setType] = useState<string>("solution");
  const [key, setKey] = useState("");
  const [err, setErr] = useState("");
  async function add() {
    setErr("");
    try { check(await db.from("agent_niche_assignments").insert({ agent_id: agent.id, niche_type: type, niche_key: key.trim(), source: "admin" }).select("id").single()); setKey(""); onChanged(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Couldn't add."); }
  }
  async function remove(id: number) { try { check(await db.from("agent_niche_assignments").delete().eq("id", id).select("id")); onChanged(); } catch (e) { setErr(e instanceof Error ? e.message : "Couldn't remove."); } }
  async function move(a: Assignment, to: string) { try { check(await db.from("agent_niche_assignments").update({ agent_id: to, source: "admin" }).eq("id", a.id).select("id").single()); onChanged(); } catch (e) { setErr(e instanceof Error ? e.message : "Couldn't reassign (the other agent may already have it)."); } }
  return (
    <div className="mt-5">
      <h3 className="text-sm font-semibold">Niches & services ({assignments.length})</h3>
      <p className="text-xs text-muted-foreground">The catalogue items this agent owns. New catalogue items with no owner are given to the coordinator automatically by the daily sync.</p>
      <ul className="mt-2 flex max-h-64 flex-wrap gap-1.5 overflow-y-auto">{assignments.map((a) => (
        <li key={a.id} className="inline-flex items-center gap-1 rounded-full border border-border py-0.5 pl-2 pr-1 text-xs">
          <span className="text-muted-foreground">{a.niche_type.replace("_", " ")}:</span>{a.niche_key}{a.source === "auto" && <Pill tone="info">auto</Pill>}
          <label className="sr-only" htmlFor={`mv-${a.id}`}>Reassign {a.niche_key}</label>
          <select id={`mv-${a.id}`} className="ml-1 rounded border border-border bg-background px-1 text-[11px]" value="" onChange={(e) => e.target.value && void move(a, e.target.value)}><option value="">move…</option>{all.filter((x) => x.id !== agent.id && !x.merged_into).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
          <button type="button" aria-label={`Remove ${a.niche_key}`} onClick={() => void remove(a.id)} className="rounded-full p-0.5 hover:bg-muted"><X className="h-3 w-3" aria-hidden="true" /></button>
        </li>
      ))}</ul>
      <div className="mt-2 flex flex-wrap gap-2">
        <label htmlFor="nt" className="sr-only">Niche type</label><select id="nt" className="dash-input !w-auto max-w-full !py-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>{NICHE_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}</select>
        <label htmlFor="nk" className="sr-only">Niche key</label><input id="nk" className="dash-input !w-64 max-w-full !py-2 text-sm" placeholder="e.g. websites/online-store or /website-audit" value={key} maxLength={120} onChange={(e) => setKey(e.target.value)} />
        <Btn small disabled={!key.trim()} onClick={() => void add()}><Plus className="h-3.5 w-3.5" aria-hidden="true" />Add</Btn>
      </div>
      <ErrorText message={err} />
    </div>
  );
}

function AssignTask({ agent }: { agent: AgentRow }) {
  const [instruction, setInstruction] = useState("");
  const [post, setPost] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  async function send() {
    setErr(""); setMsg("");
    const postId = post.trim().match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0] ?? null;
    if (post.trim() && !postId) return setErr("Paste a community post link or ID.");
    try { check(await db.rpc("agent_admin_assign", { p_agent: agent.id, p_instruction: instruction.trim(), p_post: postId })); setInstruction(""); setPost(""); setMsg(postId ? "Queued: the agent will reply to that post." : "Queued: the agent will draft a post for your review (see Content)."); }
    catch (e) { setErr(e instanceof Error ? e.message : "Couldn't assign."); }
  }
  return (
    <div className="mt-5">
      <h3 className="text-sm font-semibold">Assign a task</h3>
      <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_220px_auto]">
        <label htmlFor="at-i" className="sr-only">Instruction</label><input id="at-i" className="dash-input text-sm" placeholder="e.g. Write a checklist on preparing a store for Black Friday" value={instruction} maxLength={2000} onChange={(e) => setInstruction(e.target.value)} />
        <label htmlFor="at-p" className="sr-only">Optional post link</label><input id="at-p" className="dash-input text-sm" placeholder="Optional: post link to answer" value={post} onChange={(e) => setPost(e.target.value)} />
        <Btn small disabled={instruction.trim().length < 5} onClick={() => void send()}><Send className="h-3.5 w-3.5" aria-hidden="true" />Assign</Btn>
      </div>
      <ErrorText message={err} />{msg && <p role="status" className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">{msg}</p>}
    </div>
  );
}

function Merge({ agent, all, onDone }: { agent: AgentRow; all: AgentRow[]; onDone: () => void }) {
  const [into, setInto] = useState("");
  const [err, setErr] = useState("");
  async function merge() {
    const target = all.find((a) => a.id === into);
    if (!target || !window.confirm(`Merge ${agent.name} into ${target.name}? ${agent.name}'s niches, open leads and queued work move to ${target.name}, and ${agent.name} is switched off.`)) return;
    try { check(await db.rpc("agent_admin_merge", { p_from: agent.id, p_into: into })); onDone(); } catch (e) { setErr(e instanceof Error ? e.message : "Couldn't merge."); }
  }
  if (agent.kind === "general") return null;
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
      <GitMerge className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <label htmlFor="mg" className="text-sm">Merge into</label>
      <select id="mg" className="dash-input !w-auto max-w-full !py-2 text-sm" value={into} onChange={(e) => setInto(e.target.value)}><option value="">Choose an agent…</option>{all.filter((a) => a.id !== agent.id && !a.merged_into).map((a) => <option key={a.id} value={a.id}>{a.name} — {a.title}</option>)}</select>
      <Btn small tone="danger" disabled={!into} onClick={() => void merge()}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Merge</Btn>
      <ErrorText message={err} />
    </div>
  );
}
