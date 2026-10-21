import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, RotateCcw, Plus, X, MessageSquare } from "lucide-react";
import { pageHead } from "@/lib/seo";
import { buildRoadmap, visibleQuestions, type Answers } from "@/lib/ecom/roadmap";
import { listItems, saveItem, type Item } from "@/lib/ecom/workspace";
import { Card, PageIntro, SaveToWorkspace, useWorkspace } from "@/components/ecom/ui";

export const Route = createFileRoute("/ecommerce/start")({
  head: () => pageHead({ title: "Ecommerce Launch Guide — Your Step-by-Step Roadmap | EmmaForYou", description: "Answer a few questions about your budget, market and time and get a personalised 14-step roadmap to start selling online.", path: "/ecommerce/start" }),
  component: LaunchGuide,
});

interface RoadmapData { answers: Answers; done: string[]; ideas: string[]; model?: string }
const DRAFT = "efy_ecom_launch_draft";

function LaunchGuide() {
  const { uid, workspace } = useWorkspace();
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState(0);
  const [view, setView] = useState<"questions" | "roadmap">("questions");
  const [done, setDone] = useState<string[]>([]);
  const [ideas, setIdeas] = useState<string[]>([]);
  const [idea, setIdea] = useState("");
  const [saved, setSaved] = useState<Item<RoadmapData> | null>(null);
  const qs = useMemo(() => visibleQuestions(answers), [answers]);
  const q = qs[Math.min(step, qs.length - 1)];

  // Restore: saved roadmap from the workspace first, else this browser's draft.
  useEffect(() => {
    let restored = false;
    if (workspace) listItems<RoadmapData>(workspace.id, "roadmap").then((rows) => {
      const r = rows[0];
      if (r) { restored = true; setSaved(r); setAnswers(r.data.answers ?? {}); setDone(r.data.done ?? []); setIdeas(r.data.ideas ?? []); setView("roadmap"); }
    }).catch(() => undefined);
    if (!restored) { try { const d = JSON.parse(localStorage.getItem(DRAFT) || "null"); if (d?.answers) { setAnswers(d.answers); setDone(d.done ?? []); setIdeas(d.ideas ?? []); } } catch { /* ignore */ } }
  }, [workspace]);
  useEffect(() => { try { localStorage.setItem(DRAFT, JSON.stringify({ answers, done, ideas })); } catch { /* ignore */ } }, [answers, done, ideas]);

  const roadmap = useMemo(() => buildRoadmap(answers), [answers]);
  const allTasks = roadmap.steps.flatMap((s) => s.tasks.map((t) => `${s.id}:${t.id}`));
  const progress = allTasks.length ? Math.round((done.filter((d) => allTasks.includes(d)).length / allTasks.length) * 100) : 0;
  const data: RoadmapData = { answers, done, ideas, model: roadmap.model };

  // Ticking a task auto-saves when the roadmap is already in the workspace.
  async function toggle(key: string) {
    const next = done.includes(key) ? done.filter((d) => d !== key) : [...done, key];
    setDone(next);
    if (saved && uid && workspace) { try { setSaved(await saveItem(uid, workspace.id, "roadmap", saved.title, { ...data, done: next }, saved.id)); } catch { /* shown on next save */ } }
  }
  const set = <K extends keyof Answers>(k: K, v: Answers[K]) => setAnswers((a) => ({ ...a, [k]: v }));
  const answered = q ? answers[q.id] !== undefined && answers[q.id] !== "" && !(Array.isArray(answers[q.id]) && (answers[q.id] as string[]).length === 0) : false;

  if (view === "questions" && q) return (
    <div className="mx-auto max-w-2xl">
      <PageIntro eyebrow="Start an ecommerce business" title="Your launch guide">A few questions so the roadmap fits your budget, market and time. Skip anything you're unsure about; you can see your roadmap at any point.</PageIntro>
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground"><span>Question {Math.min(step, qs.length - 1) + 1} of {qs.length}</span><button type="button" onClick={() => setView("roadmap")} className="font-semibold text-[var(--emma-violet)] hover:underline">See my roadmap so far</button></div>
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true"><div className="h-full rounded-full bg-[var(--emma-violet)] transition-all" style={{ width: `${((Math.min(step, qs.length - 1) + 1) / qs.length) * 100}%` }} /></div>
      <Card>
        <fieldset>
          <legend className="font-display text-lg font-bold">{q.label}</legend>
          {q.help && <p className="mt-1 text-sm text-muted-foreground">{q.help}</p>}
          <div className="mt-4">
            {q.type === "text" ? (
              <><label htmlFor={`q-${q.id}`} className="sr-only">{q.label}</label><textarea id={`q-${q.id}`} rows={3} className="input" maxLength={300} value={(answers[q.id] as string) ?? ""} onChange={(e) => set(q.id, e.target.value as never)} /></>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {q.options!.map((o) => {
                  const multi = q.type === "multi";
                  const cur = answers[q.id] as string | string[] | undefined;
                  const on = multi ? (cur as string[] | undefined)?.includes(o.value) : cur === o.value;
                  return (
                    <button key={o.value} type="button" aria-pressed={Boolean(on)} onClick={() => {
                      if (multi) { const arr = (cur as string[] | undefined) ?? []; set(q.id, (on ? arr.filter((x) => x !== o.value) : [...arr, o.value]) as never); }
                      else { set(q.id, o.value as never); window.setTimeout(() => setStep((s) => s + 1), 180); }
                    }} className={`flex min-h-12 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition ${on ? "border-[var(--emma-violet)] bg-[var(--emma-violet)]/8 text-foreground" : "border-border hover:border-foreground/30"}`}>
                      <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center border ${multi ? "rounded-md" : "rounded-full"} ${on ? "border-[var(--emma-violet)] bg-[var(--emma-violet)] text-white" : "border-border"}`}>{on && <Check className="h-3 w-3" aria-hidden="true" />}</span>{o.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </fieldset>
        <div className="mt-5 flex items-center justify-between gap-2">
          <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-muted-foreground hover:text-foreground disabled:opacity-40"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back</button>
          {step >= qs.length - 1
            ? <button type="button" onClick={() => setView("roadmap")} className="btn-primary-gradient inline-flex min-h-11 items-center gap-1.5 rounded-full px-5 text-sm font-semibold text-white">Build my roadmap <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
            : <button type="button" onClick={() => setStep((s) => s + 1)} className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-5 text-sm font-semibold ${answered ? "btn-primary-gradient text-white" : "border border-border hover:bg-muted"}`}>{answered ? "Next" : "Skip"} <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
        </div>
      </Card>
    </div>
  );

  return (
    <div>
      <PageIntro eyebrow="Start an ecommerce business" title="Your launch roadmap">
        Recommended model: <strong className="text-foreground">{roadmap.model.replace("-", " ")}</strong>. {roadmap.modelReason} This is a plan to follow and adapt, not a promise of sales.
      </PageIntro>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="min-w-[200px] flex-1">
          <div className="flex justify-between text-xs text-muted-foreground"><span>Progress</span><span>{progress}%</span></div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Roadmap progress"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} /></div>
        </div>
        <button type="button" onClick={() => { setView("questions"); setStep(0); }} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted"><RotateCcw className="h-4 w-4" aria-hidden="true" />Change answers</button>
        <SaveToWorkspace kind="roadmap" title={`Launch roadmap: ${roadmap.model.replace("-", " ")}`} data={data} savedId={saved?.id} onSaved={(i) => setSaved(i as Item<RoadmapData>)} label="Save roadmap" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <ol className="space-y-3">
          {roadmap.steps.map((s, i) => {
            const keys = s.tasks.map((t) => `${s.id}:${t.id}`);
            const complete = keys.every((k) => done.includes(k));
            return (
              <li key={s.id}>
                <Card>
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${complete ? "bg-emerald-500 text-white" : "bg-[var(--emma-violet)]/10 text-[var(--emma-violet)]"}`}>{complete ? <Check className="h-4 w-4" aria-label="Done" /> : i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-base font-bold">{s.title}</h2>
                      <p className="mt-0.5 text-sm text-muted-foreground">{s.why}</p>
                      <ul className="mt-3 space-y-1.5">
                        {s.tasks.map((t) => { const k = `${s.id}:${t.id}`; return (
                          <li key={k}><label className="flex cursor-pointer items-start gap-2.5 text-sm"><input type="checkbox" checked={done.includes(k)} onChange={() => toggle(k)} className="mt-0.5 h-4 w-4 accent-[var(--emma-violet)]" /><span className={done.includes(k) ? "text-muted-foreground line-through" : ""}>{t.text}</span></label></li>
                        ); })}
                      </ul>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm">
                        {s.tool && <Link to={s.tool.to} className="inline-flex items-center gap-1 font-semibold text-[var(--emma-violet)] hover:underline">{s.tool.label} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>}
                        <Link to="/ecommerce/guide" search={{ ask: `Help me with "${s.title}" for my ${roadmap.model.replace("-", " ")} business.` }} className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"><MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />Ask the guide</Link>
                      </div>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>
        <aside className="space-y-4 lg:sticky lg:top-40 lg:self-start">
          <Card title="Product ideas">
            <form onSubmit={(e) => { e.preventDefault(); const v = idea.trim(); if (v && !ideas.includes(v)) setIdeas([...ideas, v].slice(0, 30)); setIdea(""); }} className="flex gap-2">
              <label htmlFor="idea" className="sr-only">Add a product idea</label>
              <input id="idea" className="input" placeholder="Add an idea" value={idea} onChange={(e) => setIdea(e.target.value)} maxLength={80} />
              <button type="submit" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border hover:bg-muted" aria-label="Add idea"><Plus className="h-4 w-4" aria-hidden="true" /></button>
            </form>
            {ideas.length ? (
              <ul className="mt-3 space-y-1.5">{ideas.map((x) => (
                <li key={x} className="flex items-center gap-2 text-sm"><Link to="/ecommerce/research" search={{ q: x }} className="min-w-0 flex-1 truncate font-medium hover:underline">{x}</Link><button type="button" onClick={() => setIdeas(ideas.filter((y) => y !== x))} aria-label={`Remove ${x}`} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" aria-hidden="true" /></button></li>
              ))}</ul>
            ) : <p className="mt-2 text-xs text-muted-foreground">List ideas here, then research each one.</p>}
          </Card>
          <Card title="Your answers">
            <dl className="space-y-1 text-xs">
              {visibleQuestions(answers).filter((x) => answers[x.id] != null && answers[x.id] !== "").map((x) => (
                <div key={x.id}><dt className="text-muted-foreground">{x.label}</dt><dd className="font-medium">{Array.isArray(answers[x.id]) ? (answers[x.id] as string[]).map((v) => x.options?.find((o) => o.value === v)?.label ?? v).join(", ") : x.options?.find((o) => o.value === answers[x.id])?.label ?? String(answers[x.id])}</dd></div>
              ))}
            </dl>
          </Card>
        </aside>
      </div>
    </div>
  );
}
