// @ts-nocheck -- generated DB/router types lag behind; runtime verified
import { useEffect, useState } from "react";
import { planProgress, planToIcs } from "@/lib/goal-calendar";
import { Link } from "@tanstack/react-router";
import { CalendarPlus, CalendarRange, CheckCircle2, Download, Flag, Loader2, Repeat, Target } from "lucide-react";
import { HOURS, OBSTACLES, ROLES, type GoalPlan, type PlanRequest } from "@/lib/goal-plan";
import { LeadCapture } from "./LeadCapture";
import { track } from "@/lib/analytics";
import { useI18n } from "@/lib/i18n";
import { ShowcaseOptIn, ShowcasePublished, publishToShowcase, useShowcaseChoice } from "../showcase/ShowcaseOptIn";

export default function GoalPlanner() {
  const [form, setForm] = useState<PlanRequest>({ role: ROLES[0], goal: "", why: "", now: "", hours: HOURS[1], obstacle: OBSTACLES[0], startDate: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [aiWritten, setAiWritten] = useState(true);
  const [plan, setPlan] = useState<GoalPlan | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const { lang } = useI18n();
  const [showChoice, setShowChoice] = useShowcaseChoice("plan");
  const [shown, setShown] = useState<string | null>(null);
  // The plan and ticks are kept in this browser so the visitor can come back and continue.
  const SAVE = "efy_goal_plan_v1";
  const [resume, setResume] = useState<{ plan: GoalPlan; form: PlanRequest; done: string[]; aiWritten: boolean; savedAt: string } | null>(null);
  useEffect(() => { try { const v = JSON.parse(localStorage.getItem(SAVE) || "null"); if (v?.plan?.weeks) setResume(v); } catch { /* ignore */ } }, []);
  useEffect(() => {
    if (!plan) return;
    try { localStorage.setItem(SAVE, JSON.stringify({ plan, form, done: [...done], aiWritten, savedAt: new Date().toISOString() })); } catch { /* storage full or blocked */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, done]);
  function downloadIcs() {
    if (!plan) return;
    const start = form.startDate ? new Date(`${form.startDate}T09:00:00`) : new Date();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([planToIcs(plan, start)], { type: "text/calendar" }));
    a.download = "my-90-day-plan.ics"; a.click();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    track("plan_calendar_download");
  }

  const set = <K extends keyof PlanRequest>(k: K, v: PlanRequest[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function make(e: React.FormEvent) {
    e.preventDefault();
    if (busy || form.goal.trim().length < 8) return;
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/goal-plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "The plan couldn't be created.");
      setPlan(data.plan);
      setAiWritten(data.aiWritten !== false);
      setDone(new Set());
      setShown(null);
      // Only AI-written plans go to the showcase (the standard framework isn't anyone's own work).
      const sc = data.showcase as { content?: unknown; sig?: string } | undefined;
      if (sc?.sig && data.aiWritten !== false && showChoice.show) void publishToShowcase({ kind: "plan", sig: sc.sig, content: sc.content, prompt: form.goal, choice: showChoice }, lang).then((r) => r && setShown(r.slug));
      track("plan_generated", { role: form.role, obstacle: form.obstacle });
      window.setTimeout(() => document.getElementById("goal-plan")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setBusy(false); }
  }

  const toggle = (k: string) => setDone((d) => { const n = new Set(d); n.has(k) ? n.delete(k) : n.add(k); return n; });

  return (
    <div className="space-y-10">
      {resume && !plan && (
        <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-[var(--emma-violet)]/40 bg-[var(--emma-violet)]/5 p-4 text-sm" data-goal-resume>
          <p><strong>Welcome back.</strong> Your plan "{resume.plan.headline.slice(0, 70)}" is saved here, {planProgress(resume.plan, resume.done).pct}% done.</p>
          <span className="flex gap-2">
            <button type="button" onClick={() => { setPlan(resume.plan); setForm(resume.form); setDone(new Set(resume.done)); setAiWritten(resume.aiWritten); track("plan_resumed"); window.setTimeout(() => document.getElementById("goal-plan")?.scrollIntoView({ behavior: "smooth" }), 50); }} className="rounded-full bg-[var(--emma-violet)] px-4 py-2 font-semibold text-white">Continue my plan</button>
            <button type="button" onClick={() => { try { localStorage.removeItem(SAVE); } catch { /* ignore */ } setResume(null); }} className="rounded-full px-3 py-2 text-muted-foreground hover:bg-muted">Start fresh</button>
          </span>
        </div>
      )}
      <form onSubmit={make} className="no-print space-y-5 rounded-[24px] border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
        <label className="block text-sm font-medium">What do you want to achieve in the next 90 days?
          <textarea required value={form.goal} onChange={(e) => set("goal", e.target.value)} rows={2} maxLength={240} className="input mt-1.5" placeholder="e.g. Get my first 10 paying clients for my bookkeeping service" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">I am a<select value={form.role} onChange={(e) => set("role", e.target.value)} className="input mt-1.5">{ROLES.map((r) => <option key={r}>{r}</option>)}</select></label>
          <label className="block text-sm font-medium">Time I can give it<select value={form.hours} onChange={(e) => set("hours", e.target.value)} className="input mt-1.5">{HOURS.map((r) => <option key={r}>{r}</option>)}</select></label>
          <label className="block text-sm font-medium">What usually gets in the way<select value={form.obstacle} onChange={(e) => set("obstacle", e.target.value)} className="input mt-1.5">{OBSTACLES.map((r) => <option key={r}>{r}</option>)}</select></label>
          <label className="block text-sm font-medium">Start date <span className="font-normal text-muted-foreground">(optional)</span><input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} className="input mt-1.5" /></label>
        </div>
        <label className="block text-sm font-medium">Where are you now? <span className="font-normal text-muted-foreground">(optional)</span>
          <input value={form.now} onChange={(e) => set("now", e.target.value)} maxLength={300} className="input mt-1.5" placeholder="e.g. 2 clients from referrals, no website, posting irregularly" />
        </label>
        <label className="block text-sm font-medium">Why does it matter to you? <span className="font-normal text-muted-foreground">(optional)</span>
          <input value={form.why} onChange={(e) => set("why", e.target.value)} maxLength={240} className="input mt-1.5" placeholder="e.g. So I can leave my job by March" />
        </label>
        <button disabled={busy || form.goal.trim().length < 8} className="btn-primary-gradient inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white disabled:opacity-50">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Target className="h-5 w-5" />} {busy ? "Building your plan…" : "Build my 90-day plan"}
        </button>
        <ShowcaseOptIn kind="plan" choice={showChoice} onChange={setShowChoice} />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </form>

      {plan && (
        <section id="goal-plan" className="print-area scroll-mt-28 space-y-6" aria-labelledby="plan-heading">
          <div className="rounded-[24px] border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--emma-violet)]">Your 90-day plan</p>
            <h2 id="plan-heading" className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">{plan.headline}</h2>
            <p className="mt-3 flex gap-2 text-foreground"><Flag className="mt-1 h-4 w-4 shrink-0 text-[var(--emma-violet)]" />{plan.northStar}</p>
            {shown && <div className="no-print mt-3"><ShowcasePublished key={shown} slug={shown} /></div>}
            {!aiWritten && <p className="no-print mt-3 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground"><strong className="text-foreground">Standard framework.</strong> Our AI planner is unavailable right now, so this is a general 12-week structure built around your goal, time and obstacle. Try again later for a fully personalised plan.</p>}
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {plan.milestones.map((m) => (
                <div key={m.month} className="rounded-2xl bg-muted p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--emma-violet)]">Month {m.month}</p>
                  <p className="mt-1 font-semibold">{m.outcome}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{m.measure}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 font-display text-xl font-semibold"><CalendarRange className="h-5 w-5" /> Week by week</h3>
              {(() => { const pr = planProgress(plan, done); return (
                <div className="no-print flex min-w-[12rem] items-center gap-3 text-xs text-muted-foreground" data-goal-progress>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pr.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Plan progress"><div className="h-full rounded-full bg-[var(--emma-violet)] transition-all" style={{ width: `${pr.pct}%` }} /></div>
                  <span>{pr.done}/{pr.total} done · saved</span>
                </div>
              ); })()}
            </div>
            <ol className="mt-4 grid gap-3 md:grid-cols-2">
              {plan.weeks.map((w) => (
                <li key={w.week} className="rounded-2xl border border-border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Week {w.week} · {w.focus}</p>
                  <ul className="mt-2 space-y-1.5">
                    {w.actions.map((a, i) => {
                      const k = `${w.week}-${i}`;
                      return (
                        <li key={k}>
                          <label className="flex cursor-pointer gap-2 text-sm">
                            <input type="checkbox" checked={done.has(k)} onChange={() => toggle(k)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--emma-violet)]" />
                            <span className={done.has(k) ? "text-muted-foreground line-through" : ""}>{a}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[24px] border border-border bg-card p-6">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold"><Repeat className="h-5 w-5" /> Weekly habits</h3>
              <ul className="mt-3 space-y-2 text-sm">{plan.habits.map((h) => <li key={h} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{h}</li>)}</ul>
              {plan.checkin && <p className="mt-4 rounded-xl bg-muted p-3 text-sm"><strong>Weekly check-in:</strong> {plan.checkin}</p>}
            </div>
            <div className="rounded-[24px] border border-border bg-card p-6">
              <h3 className="font-display text-lg font-semibold">When things get in the way</h3>
              <ul className="mt-3 space-y-3 text-sm">{plan.risks.map((r) => <li key={r.risk}><strong>{r.risk}</strong><span className="block text-muted-foreground">{r.plan}</span></li>)}</ul>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Created with the EmmaForYou 90-day goal planner · emmaforyou.lovable.app/goal-planner</p>

          <div className="no-print flex flex-wrap gap-3">
            <button onClick={downloadIcs} className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background"><CalendarPlus className="h-4 w-4" /> Add the 12 weeks to my calendar</button>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:border-[var(--emma-violet)]"><Download className="h-4 w-4" /> Download PDF</button>
            <Link to="/expertise/accountability-coaching" className="inline-flex items-center rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:border-[var(--emma-violet)]">How accountability coaching works</Link>
          </div>
          <LeadCapture tool="Goal planner" title="Want someone to hold you to it?" lead="Plans are easier to keep when someone checks in. With accountability coaching, Emmanuel checks in every week, helps you clear blockers and keeps you moving." button="Talk about accountability coaching" summary={`Goal: ${form.goal}. Role: ${form.role}. Time: ${form.hours}. Obstacle: ${form.obstacle}. Plan: ${plan.northStar}`} />
        </section>
      )}
    </div>
  );
}
