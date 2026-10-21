import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/** Ecommerce Intelligence for the owner: real usage counts (admin-only RPC) and on/off controls for the AI agents. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface Summary { workspaces: number; starting: number; growing: number; items: Record<string, number>; guide_messages_7d: number; usage_24h: Record<string, { runs: number; failed: number; avg_ms: number }>; recent_errors: { tool: string; error: string | null; at: string }[] }
interface Agent { id: string; enabled: boolean; extra_instructions: string | null; updated_at: string }
const AGENT_LABEL: Record<string, { name: string; text: string }> = {
  community_assistant: { name: "Community assistant", text: "Answers members in the Community's AI chat (members can always ask for a person)." },
  ecommerce_guide: { name: "Ecommerce business guide", text: "Answers signed-in users on /ecommerce/guide using their saved reports." },
};

export function EcomPanel() {
  const [s, setS] = useState<Summary | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savedId, setSavedId] = useState("");

  async function load() {
    const [sum, ag] = await Promise.all([db.rpc("ecom_admin_summary"), db.from("ai_agent_settings").select("id,enabled,extra_instructions,updated_at").order("id")]);
    if (sum.error) setError("Ecommerce data isn't available yet (has the migration been applied?)."); else setS(sum.data as Summary);
    if (!ag.error) { setAgents(ag.data ?? []); setDrafts(Object.fromEntries((ag.data ?? []).map((a: Agent) => [a.id, a.extra_instructions ?? ""]))); }
  }
  useEffect(() => { void load(); }, []);

  async function save(id: string, patch: Partial<Agent>) {
    const { data: u } = await supabase.auth.getUser();
    const { error: e } = await db.from("ai_agent_settings").update({ ...patch, updated_at: new Date().toISOString(), updated_by: u.user?.id ?? null }).eq("id", id);
    if (e) return setError("Couldn't save the agent setting.");
    setAgents((x) => x.map((a) => (a.id === id ? { ...a, ...patch } : a))); setSavedId(id); window.setTimeout(() => setSavedId(""), 2000);
  }

  const stat = (label: string, v: number | string | undefined) => <div className="rounded-xl border border-border p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-1 font-display text-lg font-bold">{v ?? "…"}</p></div>;
  const usage = s ? Object.entries(s.usage_24h) : [];

  return (
    <section className="dash-card mt-4" aria-labelledby="ecom-dash-h">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 id="ecom-dash-h" className="dash-h2">Ecommerce Intelligence & AI agents</h2><p className="mt-1 text-xs text-muted-foreground">Usage of the ecommerce tools and controls for the automated assistants.</p></div>
        <Link to="/ecommerce" className="rounded-full border border-border px-4 py-2 text-xs font-medium hover:bg-muted">Open tools</Link>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      {s && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
            {stat("Workspaces", s.workspaces)}{stat("Starting", s.starting)}{stat("Growing", s.growing)}{stat("Saved items", Object.values(s.items).reduce((a, b) => a + b, 0))}{stat("Guide messages (7d)", s.guide_messages_7d)}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold">Tool runs, last 24 hours</h3>
              {usage.length === 0 ? <p className="mt-1 text-xs text-muted-foreground">No runs yet.</p> : (
                <table className="mt-2 w-full text-xs"><thead><tr className="text-left text-muted-foreground"><th className="py-1 font-medium">Tool</th><th className="py-1 font-medium">Runs</th><th className="py-1 font-medium">Failed</th><th className="py-1 font-medium">Avg time</th></tr></thead>
                  <tbody>{usage.map(([tool, u]) => <tr key={tool} className="border-t border-border/60"><td className="py-1">{tool}</td><td>{u.runs}</td><td className={u.failed ? "text-amber-600" : ""}>{u.failed}</td><td>{(u.avg_ms / 1000).toFixed(1)}s</td></tr>)}</tbody></table>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold">Recent errors</h3>
              {s.recent_errors.length === 0 ? <p className="mt-1 text-xs text-muted-foreground">None.</p> : <ul className="mt-2 space-y-1 text-xs">{s.recent_errors.map((e, i) => <li key={i}><span className="font-medium">{e.tool}</span> · {new Date(e.at).toLocaleString()} · <span className="text-muted-foreground">{e.error ?? "failed"}</span></li>)}</ul>}
            </div>
          </div>
        </>
      )}
      <h3 className="mt-5 text-sm font-semibold">AI agents</h3>
      <p className="mt-1 text-xs text-muted-foreground">Turning an agent off stops new automated replies immediately. Extra instructions are added to its rules (they can't remove the built-in safety rules). Every automated reply is labelled as AI.</p>
      <ul className="mt-3 grid gap-3 lg:grid-cols-2">{agents.map((a) => (
        <li key={a.id} className="rounded-xl border border-border p-3">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-sm font-semibold">{AGENT_LABEL[a.id]?.name ?? a.id}</p><p className="text-xs text-muted-foreground">{AGENT_LABEL[a.id]?.text}</p></div>
            <label className="inline-flex shrink-0 items-center gap-2 text-xs font-medium"><input type="checkbox" checked={a.enabled} onChange={(e) => void save(a.id, { enabled: e.target.checked })} className="h-4 w-4 accent-[var(--emma-violet)]" />{a.enabled ? "On" : "Off"}</label>
          </div>
          <label htmlFor={`agent-${a.id}`} className="mt-2 block text-xs font-medium">Extra instructions</label>
          <textarea id={`agent-${a.id}`} rows={3} maxLength={2000} className="input mt-1 text-xs" placeholder="e.g. Mention our free store audit when people ask about low sales." value={drafts[a.id] ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [a.id]: e.target.value }))} />
          <div className="mt-2 flex items-center gap-2">
            <button type="button" onClick={() => void save(a.id, { extra_instructions: (drafts[a.id] ?? "").trim() || null })} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted">Save instructions</button>
            {savedId === a.id && <span className="text-xs text-emerald-600">Saved</span>}
            <span className="ml-auto text-[11px] text-muted-foreground">Updated {new Date(a.updated_at).toLocaleDateString()}</span>
          </div>
        </li>
      ))}</ul>
      {a11yNote}
    </section>
  );
}

const a11yNote = <p className="mt-3 text-[11px] text-muted-foreground">Conversations needing review are in the <Link to="/community/inbox" className="underline">support inbox</Link>, where staff can take over any AI chat.</p>;
