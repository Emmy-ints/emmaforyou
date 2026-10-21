import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Trash2, ListChecks } from "lucide-react";
import { pageHead } from "@/lib/seo";
import { buildRoadmap, type Answers } from "@/lib/ecom/roadmap";
import { deleteItem, listItems, saveItem, type Item } from "@/lib/ecom/workspace";
import type { StoreAudit } from "@/lib/ecom/audit-server";
import { Card, ErrorBox, PageIntro, useWorkspace } from "@/components/ecom/ui";

export const Route = createFileRoute("/ecommerce/plan")({
  head: () => pageHead({ title: "Ecommerce Action Plan — Prioritised Tasks for Your Store | EmmaForYou", description: "Turn your store audit, launch roadmap and sales diagnosis into one prioritised list of tasks you can track.", path: "/ecommerce/plan" }),
  component: Plan,
});

interface Task { text: string; why?: string; source: string; impact: "high" | "medium" | "low"; effort: "quick" | "moderate" | "larger"; link?: string; ref?: string; internal?: boolean }
const IMPACT = { high: 3, medium: 2, low: 1 } as const;
const EFFORT = { quick: 1, moderate: 2, larger: 3 } as const;
const score = (t: Pick<Task, "impact" | "effort">) => IMPACT[t.impact] * 2 - EFFORT[t.effort];

function Plan() {
  const { uid, workspace, signedIn, ready } = useWorkspace();
  const [tasks, setTasks] = useState<Item<Task>[]>([]);
  const [suggestions, setSuggestions] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [impact, setImpact] = useState<Task["impact"]>("medium");
  const [effort, setEffort] = useState<Task["effort"]>("moderate");
  const [error, setError] = useState("");
  const [showDone, setShowDone] = useState(false);

  async function load() {
    if (!workspace) return;
    setLoading(true);
    try {
      const all = await listItems(workspace.id, ["task", "audit", "roadmap", "experiment"]);
      const mine = (all.filter((i) => i.kind === "task") as Item<Task>[]).filter((i) => !i.data.internal && i.data.text);
      setTasks(mine);
      const have = new Set(mine.map((t) => t.data.ref).filter(Boolean));
      const s: Task[] = [];
      const audit = all.find((i) => i.kind === "audit") as Item<StoreAudit> | undefined;
      audit?.data.findings?.filter((f) => !f.pass).forEach((f) => s.push({ text: f.fix, why: f.title, source: `Store audit (${new URL(audit.data.finalUrl).hostname})`, impact: f.severity, effort: f.effort, link: "/ecommerce/grow", ref: `audit:${f.id}` }));
      const road = all.find((i) => i.kind === "roadmap") as Item<{ answers: Answers; done: string[] }> | undefined;
      if (road) {
        const steps = buildRoadmap(road.data.answers ?? {}).steps;
        const next = steps.find((st) => st.tasks.some((t) => !road.data.done?.includes(`${st.id}:${t.id}`)));
        next?.tasks.filter((t) => !road.data.done?.includes(`${next.id}:${t.id}`)).forEach((t) => s.push({ text: t.text, why: `Next roadmap step: ${next.title}`, source: "Launch roadmap", impact: "high", effort: "moderate", link: "/ecommerce/start", ref: `road:${next.id}:${t.id}` }));
      }
      (all.filter((i) => i.kind === "experiment" && i.status === "open") as Item<{ action: string; hypothesis: string }>[]).forEach((e) => s.push({ text: `Start experiment: ${e.data.action}`, why: e.data.hypothesis, source: "Experiments", impact: "medium", effort: "quick", link: "/ecommerce/marketing", ref: `exp:${e.id}` }));
      setSuggestions(s.filter((x) => !have.has(x.ref)).sort((a, b) => score(b) - score(a)));
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't load your plan."); } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [workspace]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addTask(t: Task) {
    if (!uid || !workspace) return;
    try { const it = await saveItem(uid, workspace.id, "task", t.text.slice(0, 200), t); setTasks((x) => [it, ...x]); setSuggestions((x) => x.filter((y) => y.ref !== t.ref || !t.ref)); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't add the task."); }
  }
  async function addOwn(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    await addTask({ text: text.trim(), source: "Added by you", impact, effort });
    setText("");
  }
  async function setStatus(it: Item<Task>, status: Item["status"]) {
    if (!uid || !workspace) return;
    setTasks((x) => x.map((y) => (y.id === it.id ? { ...y, status } : y)));
    await saveItem(uid, workspace.id, "task", it.title, it.data, it.id, status).catch(() => undefined);
  }

  const sorted = useMemo(() => [...tasks].sort((a, b) => (a.status === "done" ? 1 : 0) - (b.status === "done" ? 1 : 0) || score(b.data) - score(a.data)), [tasks]);
  const open = sorted.filter((t) => t.status !== "done" && t.status !== "archived");
  const done = sorted.filter((t) => t.status === "done");

  if (ready && !signedIn) return (
    <div><PageIntro eyebrow="Action planner" title="Your action plan">Collects fixes from your store audit, the next steps of your launch roadmap and your planned experiments into one prioritised list.</PageIntro>
      <Card><p className="text-sm">Sign in to build a plan from your saved reports. <Link to="/login" search={{ next: "/ecommerce/plan" }} className="font-semibold underline">Sign in or create an account</Link></p></Card></div>
  );

  return (
    <div>
      <PageIntro eyebrow="Action planner" title="Your action plan">Priority = impact × 2 − effort, using the impact and effort each tool assigned (or you chose). It ranks what to do first; it doesn't predict results.</PageIntro>
      {error && <div className="mb-4"><ErrorBox message={error} onRetry={() => { setError(""); void load(); }} /></div>}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Card title={`To do (${open.length})`}>
            <form onSubmit={addOwn} className="mb-4 flex flex-wrap gap-2">
              <label htmlFor="pl-t" className="sr-only">New task</label>
              <input id="pl-t" className="input min-w-[200px] flex-1" placeholder="Add your own task" value={text} maxLength={200} onChange={(e) => setText(e.target.value)} />
              <label htmlFor="pl-i" className="sr-only">Impact</label>
              <select id="pl-i" className="input !w-auto" value={impact} onChange={(e) => setImpact(e.target.value as Task["impact"])}><option value="high">High impact</option><option value="medium">Medium impact</option><option value="low">Low impact</option></select>
              <label htmlFor="pl-e" className="sr-only">Effort</label>
              <select id="pl-e" className="input !w-auto" value={effort} onChange={(e) => setEffort(e.target.value as Task["effort"])}><option value="quick">Quick</option><option value="moderate">Moderate</option><option value="larger">Larger</option></select>
              <button type="submit" disabled={!workspace} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-muted"><Plus className="h-4 w-4" aria-hidden="true" />Add</button>
            </form>
            {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : open.length === 0 ? <p className="text-sm text-muted-foreground">No open tasks. Add suggestions from the right, or your own above.</p> : (
              <ul className="divide-y divide-border">{open.map((t) => <TaskRow key={t.id} t={t} onStatus={setStatus} onDelete={async () => { await deleteItem(t.id).catch(() => undefined); setTasks((x) => x.filter((y) => y.id !== t.id)); void load(); }} />)}</ul>
            )}
          </Card>
          {done.length > 0 && (
            <Card title={<button type="button" onClick={() => setShowDone((v) => !v)} aria-expanded={showDone}>Done ({done.length}) {showDone ? "▾" : "▸"}</button>}>
              {showDone && <ul className="divide-y divide-border">{done.map((t) => <TaskRow key={t.id} t={t} onStatus={setStatus} onDelete={async () => { await deleteItem(t.id).catch(() => undefined); setTasks((x) => x.filter((y) => y.id !== t.id)); }} />)}</ul>}
            </Card>
          )}
        </div>
        <Card title="Suggested from your reports" className="lg:self-start">
          {suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing to suggest yet. Save an <Link to="/ecommerce/grow" className="underline">audit</Link>, a <Link to="/ecommerce/start" className="underline">launch roadmap</Link> or <Link to="/ecommerce/marketing" className="underline">experiments</Link> and they'll appear here.</p>
          ) : (
            <ul className="space-y-3">{suggestions.slice(0, 25).map((s) => (
              <li key={s.ref ?? s.text} className="rounded-xl border border-border p-3">
                <p className="text-xs text-muted-foreground">{s.source} · {s.impact} impact · {s.effort}</p>
                <p className="mt-0.5 text-sm font-medium">{s.text}</p>
                {s.why && <p className="text-xs text-muted-foreground">{s.why}</p>}
                <button type="button" onClick={() => addTask(s)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--emma-violet)]"><ListChecks className="h-3.5 w-3.5" aria-hidden="true" />Add to plan</button>
              </li>
            ))}</ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function TaskRow({ t, onStatus, onDelete }: { t: Item<Task>; onStatus: (t: Item<Task>, s: Item["status"]) => void; onDelete: () => void }) {
  const isDone = t.status === "done";
  return (
    <li className="flex items-start gap-3 py-3">
      <input type="checkbox" aria-label={`Mark "${t.data.text}" ${isDone ? "not done" : "done"}`} checked={isDone} onChange={() => onStatus(t, isDone ? "open" : "done")} className="mt-1 h-4 w-4 shrink-0 accent-[var(--emma-violet)]" />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${isDone ? "text-muted-foreground line-through" : ""}`}>{t.data.text}</p>
        <p className="text-xs text-muted-foreground">{t.data.source} · {t.data.impact} impact · {t.data.effort}{t.data.why ? ` · ${t.data.why}` : ""}</p>
        {t.data.link && <Link to={t.data.link as "/ecommerce"} className="text-xs font-semibold text-[var(--emma-violet)]">Open tool</Link>}
      </div>
      {!isDone && <select aria-label="Status" className="input !w-auto !py-1 text-xs" value={t.status} onChange={(e) => onStatus(t, e.target.value as Item["status"])}><option value="open">To do</option><option value="in_progress">Doing</option><option value="done">Done</option></select>}
      <button type="button" aria-label="Delete task" onClick={onDelete} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-red-600"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
    </li>
  );
}
