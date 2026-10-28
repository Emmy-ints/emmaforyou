import { useMemo, useState } from "react";
import { CalendarDays, Download, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { BUDGETS, CHANNELS, type Budget, type Channel, type Plan, type Task, buildPlan, label, toCsv, toIcs } from "@/lib/books/launch";
import { safeFileName, uuid } from "@/lib/books/manuscript";
import { useFlag } from "@/lib/site-settings";
import { track } from "@/lib/analytics";
import { Field, GhostBtn, Notice, Panel, PrimaryBtn, SaveBar, ServiceCta, bookAi, downloadBytes, inputCls, useAccountGate, useBookState } from "./shared";

interface Ideas { hooks: string[]; posts: { channel: string; idea: string }[]; partnerships: string[]; leadMagnet: string }
interface State { title: string; genre: string; audience: string; launchDate: string; format: "ebook" | "paperback" | "both"; channels: Channel[]; budget: Budget; preorder: boolean; plan: Plan | null; ideas: Ideas | null }
const today = () => new Date().toISOString().slice(0, 10);
const plus = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);
const initial = (): State => ({ title: "", genre: "", audience: "", launchDate: plus(70), format: "both", channels: ["email", "arc", "instagram"], budget: "0", preorder: true, plan: null, ideas: null });

export default function LaunchPlanner() {
  const s = useBookState<State>("launch-planner", "launch", initial);
  const { state, setState } = s;
  const gate = useAccountGate("launch-planner");
  const aiOn = useFlag("publishing-ai", true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState<"all" | "open">("all");
  const plan = state.plan;
  const done = plan ? plan.tasks.filter((t) => t.done).length : 0;

  function build() {
    setErr("");
    if (!state.launchDate) { setErr("Choose a launch date."); return; }
    const p = buildPlan({ title: state.title, launchDate: state.launchDate, today: today(), format: state.format, audience: state.audience, channels: state.channels, budget: state.budget, preorder: state.preorder });
    // keep ticks on tasks that still exist
    const old = new Map((state.plan?.tasks ?? []).map((t) => [t.id, t]));
    p.tasks = [...p.tasks.map((t) => ({ ...t, done: old.get(t.id)?.done ?? false })), ...(state.plan?.tasks ?? []).filter((t) => t.custom)].sort((a, b) => a.due.localeCompare(b.due));
    setState((x) => ({ ...x, plan: p }));
    track("book_preview_generated", { tool: "launch-planner" });
  }
  const setTask = (id: string, patch: Partial<Task>) => setState((x) => ({ ...x, plan: x.plan ? { ...x.plan, tasks: x.plan.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) } : x.plan }));
  async function ideas() {
    setErr(""); setBusy(true);
    try {
      const r = await bookAi<Ideas>("launch_ideas", { title: state.title, genre: state.genre, audience: state.audience, channels: state.channels.map(label).join(", "), budget: BUDGETS.find((b) => b.id === state.budget)?.label }, "launch-planner");
      setState((x) => ({ ...x, ideas: r }));
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }
  const grouped = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of plan?.tasks ?? []) { if (filter === "open" && t.done) continue; const k = t.phase; m.set(k, [...(m.get(k) ?? []), t]); }
    return [...m.entries()];
  }, [plan, filter]);

  if (!s.loaded) return <div className="py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" aria-label="Loading" /></div>;
  return (
    <div className="space-y-6">
      {s.loadError && <Notice tone="error">{s.loadError}</Notice>}
      <Panel title="1. Your launch">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Book title"><input className={inputCls} value={state.title} maxLength={200} onChange={(e) => setState((x) => ({ ...x, title: e.target.value }))} /></Field>
          <Field label="Genre / type"><input className={inputCls} value={state.genre} maxLength={80} onChange={(e) => setState((x) => ({ ...x, genre: e.target.value }))} /></Field>
          <Field label="Launch date *"><input type="date" className={inputCls} value={state.launchDate} min="2020-01-01" onChange={(e) => setState((x) => ({ ...x, launchDate: e.target.value }))} /></Field>
          <Field label="Audience"><input className={inputCls} value={state.audience} maxLength={300} onChange={(e) => setState((x) => ({ ...x, audience: e.target.value }))} /></Field>
          <Field label="Formats"><select className={inputCls} value={state.format} onChange={(e) => setState((x) => ({ ...x, format: e.target.value as State["format"] }))}><option value="ebook">eBook</option><option value="paperback">Paperback</option><option value="both">eBook + paperback</option></select></Field>
          <Field label="Budget for promotion"><select className={inputCls} value={state.budget} onChange={(e) => setState((x) => ({ ...x, budget: e.target.value as Budget }))}>{BUDGETS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}</select></Field>
        </div>
        <fieldset className="mt-4"><legend className="text-sm font-medium">Channels you'll use</legend>
          <div className="mt-2 flex flex-wrap gap-2">{CHANNELS.map((c) => <label key={c.id} className="tsh-chip cursor-pointer"><input type="checkbox" className="mr-2" checked={state.channels.includes(c.id)} onChange={(e) => setState((x) => ({ ...x, channels: e.target.checked ? [...x.channels, c.id] : x.channels.filter((y) => y !== c.id) }))} />{c.label}</label>)}</div>
        </fieldset>
        <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={state.preorder} onChange={(e) => setState((x) => ({ ...x, preorder: e.target.checked }))} />Offer a pre-order</label>
        <div className="mt-4 flex flex-wrap gap-3">
          <PrimaryBtn onClick={build}><CalendarDays className="h-4 w-4" aria-hidden="true" />{plan ? "Update my plan" : "Build my launch plan"}</PrimaryBtn>
          {aiOn && <GhostBtn disabled={busy} onClick={() => void ideas()}>{busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}AI content ideas</GhostBtn>}
        </div>
        {err && <div className="mt-3"><Notice tone="error">{err}</Notice></div>}
      </Panel>

      {plan && (
        <Panel title={`2. Checklist · ${done} of ${plan.tasks.length} done`} actions={
          <div className="flex flex-wrap gap-2">
            <select aria-label="Show" className={`${inputCls} mt-0 w-auto`} value={filter} onChange={(e) => setFilter(e.target.value as "all" | "open")}><option value="all">All tasks</option><option value="open">Open tasks</option></select>
            <GhostBtn onClick={() => gate.require("Sign in to download your plan", () => downloadBytes(new TextEncoder().encode(toIcs(state.title, plan.tasks)), safeFileName(`${state.title || "book"}-launch`, "ics"), "text/calendar"))}><Download className="h-4 w-4" aria-hidden="true" />Calendar (.ics)</GhostBtn>
            <GhostBtn onClick={() => gate.require("Sign in to download your plan", () => downloadBytes(new TextEncoder().encode(toCsv(plan.tasks)), safeFileName(`${state.title || "book"}-launch-tasks`, "csv"), "text/csv"))}>CSV</GhostBtn>
          </div>}>
          {plan.warnings.map((w) => <div key={w} className="mb-2"><Notice tone="warn">{w}</Notice></div>)}
          <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true"><div className="h-full bg-[var(--hue)]" style={{ width: `${plan.tasks.length ? (done / plan.tasks.length) * 100 : 0}%` }} /></div>
          {grouped.map(([phase, tasks]) => (
            <div key={phase} className="mt-5">
              <h3 className="font-display font-semibold">{phase}</h3>
              <ul className="mt-2 space-y-2">{tasks.map((t) => (
                <li key={t.id} className="flex gap-3 rounded-2xl border border-border p-3">
                  <input type="checkbox" className="mt-1 h-4 w-4 shrink-0" checked={t.done} onChange={(e) => setTask(t.id, { done: e.target.checked })} aria-label={`Done: ${t.title}`} />
                  <div className="min-w-0 flex-1">
                    <input className="w-full bg-transparent font-medium outline-none focus:underline" value={t.title} onChange={(e) => setTask(t.id, { title: e.target.value })} aria-label="Task" />
                    <textarea className="mt-1 w-full resize-none bg-transparent text-sm text-muted-foreground outline-none" rows={2} value={t.detail} onChange={(e) => setTask(t.id, { detail: e.target.value })} aria-label="Details" />
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <input type="date" className="rounded-lg border border-border bg-background px-2 py-1 text-xs" value={t.due} onChange={(e) => setTask(t.id, { due: e.target.value })} aria-label="Due date" />
                    <span className="text-[11px] text-muted-foreground">{t.channel === "all" ? "All channels" : label(t.channel)}</span>
                    {t.custom && <button type="button" className="text-muted-foreground" aria-label="Delete task" onClick={() => setState((x) => ({ ...x, plan: x.plan ? { ...x.plan, tasks: x.plan.tasks.filter((y) => y.id !== t.id) } : x.plan }))}><Trash2 className="h-3.5 w-3.5" /></button>}
                  </div>
                </li>
              ))}</ul>
            </div>
          ))}
          <GhostBtn className="mt-4" onClick={() => setState((x) => ({ ...x, plan: x.plan ? { ...x.plan, tasks: [...x.plan.tasks, { id: `custom-${uuid().slice(0, 8)}`, title: "New task", detail: "", due: x.launchDate, phase: "Build-up", channel: "all", done: false, custom: true }] } : x.plan }))}><Plus className="h-4 w-4" aria-hidden="true" />Add a task</GhostBtn>
          <div className="mt-5 border-t border-border pt-4"><SaveBar kind="launch" title={state.title || "Launch plan"} data={state} meta={{ launchDate: state.launchDate, tasks: plan.tasks.length, done }} projectId={s.projectId} setProjectId={s.setProjectId} gateRequire={gate.require} /></div>
        </Panel>
      )}

      {plan && plan.calendar.length > 0 && (
        <Panel title="3. Content calendar">
          <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm"><thead><tr className="text-left text-xs text-muted-foreground"><th className="py-2 pr-3">Date</th><th className="pr-3">Channel</th><th>Post theme</th></tr></thead>
            <tbody>{plan.calendar.map((p, i) => <tr key={i} className="border-t border-border"><td className="py-2 pr-3 tabular-nums">{p.date}</td><td className="pr-3">{label(p.channel)}</td><td>{p.theme}</td></tr>)}</tbody></table></div>
        </Panel>
      )}
      {plan && plan.emails.length > 0 && (
        <Panel title="4. Email sequence outline">
          <ol className="grid gap-3 md:grid-cols-2">{plan.emails.map((e, i) => <li key={i} className="rounded-2xl border border-border p-3 text-sm"><p className="text-xs text-muted-foreground">{e.when}</p><p className="font-semibold">{e.subject}</p><ul className="mt-1 list-disc pl-5 text-muted-foreground">{e.points.map((p) => <li key={p}>{p}</li>)}</ul></li>)}</ol>
          <p className="mt-3 text-xs text-muted-foreground">Write the full emails with the Book Marketing Assistant. Send only to people who agreed to hear from you.</p>
        </Panel>
      )}
      {state.ideas && (
        <Panel title="AI content ideas">
          <Notice tone="info">AI-suggested ideas to adapt. No sales or rankings are implied.</Notice>
          <div className="mt-3 grid gap-4 md:grid-cols-2 text-sm">
            <div><p className="font-semibold">Angles</p><ul className="mt-1 list-disc pl-5">{state.ideas.hooks.map((h) => <li key={h}>{h}</li>)}</ul></div>
            <div><p className="font-semibold">Partners & communities</p><ul className="mt-1 list-disc pl-5">{state.ideas.partnerships.map((h) => <li key={h}>{h}</li>)}</ul>{state.ideas.leadMagnet && <p className="mt-2"><strong>List-building idea:</strong> {state.ideas.leadMagnet}</p>}</div>
            <div className="md:col-span-2"><p className="font-semibold">Post ideas</p><ul className="mt-1 space-y-1">{state.ideas.posts.map((p, i) => <li key={i}><span className="text-xs text-muted-foreground">{p.channel}: </span>{p.idea}</li>)}</ul></div>
          </div>
        </Panel>
      )}
      <ServiceCta service="book-launch-strategy" title="Want us to run the launch campaign?" body="We plan and run launches end to end — advance readers, landing page, emails, social content and ads — and report what each channel delivered." cta="Plan my launch campaign" />
      {gate.gate}
    </div>
  );
}
