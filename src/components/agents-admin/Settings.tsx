import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Btn, Card, check, db, Empty, ErrorText, Loading, Pill, myUid, useLoad, when, type AgentRow } from "./shared";

interface Settings {
  paused: boolean; auto_publish_posts: boolean; review_all_replies: boolean; daily_ai_call_limit: number; monthly_token_limit: number; monthly_cost_limit_usd: number | null;
  price_input_per_1m: number | null; price_output_per_1m: number | null; model: string | null; max_agent_replies_per_thread: number; max_replies_per_member_per_day: number;
  max_followups_per_member_per_month: number; unanswered_after_minutes: number; reply_delay_seconds: number; private_outreach_enabled: boolean; admin_instructions: string | null; updated_at: string;
  timezone: string; post_window_start: number; post_window_end: number; reply_delay_jitter_seconds: number; monitor_comments: boolean;
}
const COLS = "paused,auto_publish_posts,review_all_replies,daily_ai_call_limit,monthly_token_limit,monthly_cost_limit_usd,price_input_per_1m,price_output_per_1m,model,max_agent_replies_per_thread,max_replies_per_member_per_day,max_followups_per_member_per_month,unanswered_after_minutes,reply_delay_seconds,private_outreach_enabled,admin_instructions,updated_at,timezone,post_window_start,post_window_end,reply_delay_jitter_seconds,monitor_comments";
interface Knowledge { id: string; ref: string; agent_id: string | null; layer: string; title: string; path: string | null; body: string; active: boolean; source: string; updated_at: string }

export function SettingsTab({ agents }: { agents: AgentRow[] }) {
  return <div className="space-y-4"><TeamSettings /><KnowledgeBase agents={agents} /><MemberPrefs /></div>;
}

function TeamSettings() {
  const s = useLoad<Settings>(async () => check(await db.from("agent_settings").select(COLS).eq("id", 1).single()));
  const [d, setD] = useState<Settings | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => { if (s.data) setD(s.data); }, [s.data]);
  if (s.loading && !s.data) return <Loading />;
  if (s.error) return <ErrorText message={s.error} onRetry={s.reload} />;
  if (!d) return null;
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setD((x) => (x ? { ...x, [k]: v } : x));
  const num = (k: keyof Settings, lbl: string, hint: string, opts: { min?: number; max?: number; step?: string; nullable?: boolean } = {}) => (
    <div><label htmlFor={`ts-${k}`} className="text-xs font-semibold">{lbl}</label>
      <input id={`ts-${k}`} type="number" step={opts.step ?? "1"} min={opts.min ?? 0} max={opts.max} className="dash-input mt-1" value={(d[k] as number | null) ?? ""} placeholder={opts.nullable ? "Not set" : undefined}
        onChange={(e) => set(k, (e.target.value === "" ? (opts.nullable ? null : 0) : Number(e.target.value)) as never)} />
      <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p></div>
  );
  const box = (k: keyof Settings, lbl: string, hint: string) => (
    <label className="flex gap-2 text-sm"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--emma-violet)]" checked={Boolean(d[k])} onChange={(e) => set(k, e.target.checked as never)} /><span><span className="font-semibold">{lbl}</span><span className="block text-[11px] text-muted-foreground">{hint}</span></span></label>
  );
  async function save() {
    setErr(""); setMsg("");
    try {
      const { updated_at: _u, paused: _p, ...rest } = d!; // eslint-disable-line @typescript-eslint/no-unused-vars
      check(await db.from("agent_settings").update({ ...rest, model: rest.model?.trim() || null, admin_instructions: rest.admin_instructions?.trim() || null, updated_by: await myUid() }).eq("id", 1).select("id").single());
      setMsg("Saved. Changes apply from the next worker run."); s.reload();
    } catch (e) { setErr(e instanceof Error ? e.message : "Couldn't save."); }
  }
  return (
    <Card title="Team settings" actions={<span className="text-xs text-muted-foreground">Last changed {when(d.updated_at)}</span>}>
      <div className="grid gap-4 lg:grid-cols-3">
        <fieldset className="space-y-3"><legend className="mb-1 text-sm font-semibold">Publishing & review</legend>
          {box("auto_publish_posts", "Allow automatic posts", "When off, every educational post waits for approval even if the agent's policy is automatic.")}
          {box("review_all_replies", "Approve every reply before it's posted", "Overrides each agent's reply policy.")}
          {box("private_outreach_enabled", "Allow private follow-up messages", "Off by default. Follow-ups are otherwise only posted in the member's own thread, and only with consent or for an unresolved question.")}
        </fieldset>
        <fieldset className="space-y-3"><legend className="mb-1 text-sm font-semibold">Response & outreach limits</legend>
          {num("max_agent_replies_per_thread", "Agent replies per thread", "Agents stop replying in a thread after this many.", { max: 20 })}
          {num("max_replies_per_member_per_day", "Replies to one member per day", "Across all agents.", { max: 100 })}
          {num("max_followups_per_member_per_month", "Follow-ups per member per month", "Members can also opt out completely.", { max: 20 })}
          {num("unanswered_after_minutes", "Treat a question as unanswered after (minutes)", "Then the team picks it up.", { max: 10080 })}
          {num("reply_delay_seconds", "Response window for new posts (seconds)", "Default 180 = 3 minutes. The specialist re-checks the post after this, then replies only if it adds value.", { max: 86400 })}
          {num("reply_delay_jitter_seconds", "Timing variation (± seconds)", "So replies don't all arrive at exactly the same interval.", { max: 600 })}
          {box("monitor_comments", "Watch every new comment", "Agents answer uninvolved comments only when they ask something the team can help with and nobody has replied.")}
        </fieldset>
        <fieldset className="space-y-3"><legend className="mb-1 text-sm font-semibold">Daily posts & usage</legend>
          <div><label htmlFor="ts-tz" className="text-xs font-semibold">Timezone</label><input id="ts-tz" className="dash-input mt-1" maxLength={60} value={d.timezone} onChange={(e) => set("timezone", e.target.value)} /><p className="mt-0.5 text-[11px] text-muted-foreground">Decides when a "day" starts, e.g. Africa/Lagos.</p></div>
          <div className="grid grid-cols-2 gap-2">{num("post_window_start", "Posting from (hour)", "Local time, 0–23.", { max: 23 })}{num("post_window_end", "Posting until (hour)", "Agents' posts are spread across this window.", { max: 24 })}</div>
          {num("daily_ai_call_limit", "AI calls per day", "Work beyond this waits until tomorrow.", { max: 100000 })}
          {num("monthly_token_limit", "Tokens per month", "All agents together.")}
          {num("monthly_cost_limit_usd", "Monthly cost limit (USD)", "Needs token prices below.", { step: "0.01", nullable: true })}
          <div className="grid grid-cols-2 gap-2">{num("price_input_per_1m", "Input $ / 1M tokens", "From your provider's price list.", { step: "0.0001", nullable: true })}{num("price_output_per_1m", "Output $ / 1M tokens", "Used to estimate cost.", { step: "0.0001", nullable: true })}</div>
          <div><label htmlFor="ts-model" className="text-xs font-semibold">Model</label><input id="ts-model" className="dash-input mt-1" maxLength={64} placeholder="Default from OPENAI_MODEL" value={d.model ?? ""} onChange={(e) => set("model", e.target.value)} /><p className="mt-0.5 text-[11px] text-muted-foreground">Agents can override this individually.</p></div>
        </fieldset>
      </div>
      <div className="mt-4"><label htmlFor="ts-ins" className="text-sm font-semibold">Instructions for every agent</label>
        <textarea id="ts-ins" rows={3} maxLength={4000} className="dash-input mt-1 text-sm" placeholder="e.g. Mention the free website audit when someone asks about site speed. Don't discuss competitor agencies by name." value={d.admin_instructions ?? ""} onChange={(e) => set("admin_instructions", e.target.value)} />
        <p className="mt-0.5 text-[11px] text-muted-foreground">Added to every agent's rules. They can't override the built-in safety rules (no fake experiences, no invented prices or results, honest about being AI).</p></div>
      <ErrorText message={err} />{msg && <p role="status" className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">{msg}</p>}
      <div className="mt-3"><Btn tone="primary" onClick={() => void save()}>Save settings</Btn></div>
    </Card>
  );
}

function KnowledgeBase({ agents }: { agents: AgentRow[] }) {
  const [layer, setLayer] = useState("admin");
  const [q, setQ] = useState("");
  const kb = useLoad<Knowledge[]>(async () => {
    let r = db.from("agent_knowledge_sources").select("id,ref,agent_id,layer,title,path,body,active,source,updated_at").order("updated_at", { ascending: false }).limit(300);
    if (layer) r = r.eq("layer", layer);
    if (q.trim()) r = r.ilike("title", `%${q.trim().replace(/[%_]/g, "")}%`);
    return check(await r);
  }, [layer, q]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [agent, setAgent] = useState("");
  const [err, setErr] = useState("");
  async function add() {
    setErr("");
    try { check(await db.from("agent_knowledge_sources").insert({ ref: `admin:${crypto.randomUUID()}`, agent_id: agent || null, layer: "admin", title: title.trim(), body: body.trim(), source: "admin", verified: true, keywords: title.toLowerCase().split(/\W+/).filter((w) => w.length > 3).slice(0, 12) }).select("id").single()); setTitle(""); setBody(""); kb.reload(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Couldn't add."); }
  }
  async function patch(id: string, p: Partial<Knowledge>) { try { check(await db.from("agent_knowledge_sources").update(p).eq("id", id).select("id").single()); kb.reload(); } catch (e) { setErr(e instanceof Error ? e.message : "Couldn't update."); } }
  return (
    <Card title="Knowledge base">
      <p className="mb-3 text-xs text-muted-foreground">What agents may state as fact. Company, service and policy entries are rebuilt from the website's catalogue by the daily "knowledge sync" job (you can run it from Jobs). Add your own verified notes here (policies, approved offers, corrections); turn an entry off if it's wrong. Agents retrieve only the few entries relevant to each question.</p>
      <div className="mb-3 flex flex-wrap gap-2">
        <label htmlFor="kb-l" className="sr-only">Layer</label><select id="kb-l" className="dash-input !w-auto max-w-full !py-2 text-sm" value={layer} onChange={(e) => setLayer(e.target.value)}><option value="admin">Your notes</option><option value="service">Services (from catalogue)</option><option value="company">Company facts</option><option value="policy">Policies</option><option value="">All</option></select>
        <label htmlFor="kb-q" className="sr-only">Search</label><input id="kb-q" className="dash-input !w-56 max-w-full !py-2 text-sm" placeholder="Search titles" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {layer === "admin" && (
        <div className="mb-3 grid gap-2 rounded-xl border border-dashed border-border p-3 sm:grid-cols-[200px_minmax(0,1fr)]">
          <div className="space-y-2">
            <label htmlFor="kb-t" className="sr-only">Title</label><input id="kb-t" className="dash-input !py-2 text-sm" placeholder="Title" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
            <label htmlFor="kb-a" className="sr-only">Agent</label><select id="kb-a" className="dash-input !py-2 text-sm" value={agent} onChange={(e) => setAgent(e.target.value)}><option value="">All agents</option>{agents.filter((a) => !a.merged_into).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
          </div>
          <div><label htmlFor="kb-b" className="sr-only">Content</label><textarea id="kb-b" rows={3} maxLength={6000} className="dash-input text-sm" placeholder="Verified information, e.g. 'Website projects include 30 days of free fixes after launch.'" value={body} onChange={(e) => setBody(e.target.value)} />
            <div className="mt-2"><Btn small disabled={title.trim().length < 3 || body.trim().length < 10} onClick={() => void add()}><Plus className="h-3.5 w-3.5" aria-hidden="true" />Add note</Btn></div></div>
        </div>
      )}
      <ErrorText message={err} />
      {kb.loading && !kb.data ? <Loading /> : kb.error ? <ErrorText message={kb.error} onRetry={kb.reload} /> : !kb.data!.length ? <Empty>{layer === "admin" ? "No notes yet." : "Nothing here yet. Run the knowledge sync job to load the catalogue."}</Empty> : (
        <ul className="max-h-[480px] divide-y divide-border overflow-y-auto">{kb.data!.map((k) => (
          <li key={k.id} className="flex items-start gap-3 py-2 text-sm">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-1.5"><span className="font-semibold">{k.title}</span>{k.path && <a href={k.path} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--emma-violet)] hover:underline">{k.path}</a>}<Pill>{agents.find((a) => a.id === k.agent_id)?.name ?? "all agents"}</Pill>{!k.active && <Pill tone="bad">off</Pill>}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{k.body}</p>
            </div>
            <label className="flex shrink-0 items-center gap-1 text-xs"><input type="checkbox" className="h-4 w-4 accent-[var(--emma-violet)]" checked={k.active} onChange={(e) => void patch(k.id, { active: e.target.checked })} />Active</label>
          </li>
        ))}</ul>
      )}
    </Card>
  );
}

function MemberPrefs() {
  const p = useLoad<{ replies: number; followups: number; memory: number }>(async () => {
    const c = async (col: string): Promise<number> => {
      const r = await db.from("agent_member_prefs").select("user_id", { count: "exact", head: true }).eq(col, true);
      if (r.error) throw new Error(r.error.message);
      return r.count ?? 0;
    };
    return { replies: await c("no_replies"), followups: await c("no_followups"), memory: await c("no_memory") };
  });
  return (
    <Card title="Member choices">
      <p className="text-sm text-muted-foreground">Members control this themselves in Community settings (or by asking an agent to stop). {p.data ? <>Right now <strong className="text-foreground">{p.data.replies}</strong> member(s) have turned agent replies off, <strong className="text-foreground">{p.data.followups}</strong> follow-ups off, and <strong className="text-foreground">{p.data.memory}</strong> memory off.</> : p.error ? "Couldn't load counts." : "Loading…"}</p>
    </Card>
  );
}
