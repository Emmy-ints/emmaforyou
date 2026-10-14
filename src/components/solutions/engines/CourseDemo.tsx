import { useState } from "react";
import { BadgeCheck, Check, Lock, PlayCircle } from "lucide-react";
import { Badge, Btn, Field, Panel, Stat, type EngineProps } from "./ui";

interface Lesson { title: string; mins: number; body: string }
interface Q { q: string; options: string[]; a: number }
const ACADEMY: { course: string; lessons: Lesson[]; quiz: Q[] } = {
  course: "Customer Service Essentials",
  lessons: [
    { title: "Why fast replies matter", mins: 6, body: "Customers often contact several businesses at once. Replying first, politely and with a clear next step wins more of them." },
    { title: "The 3-part reply", mins: 8, body: "Acknowledge the question, answer it clearly, then offer the next step (book, pay, visit or call)." },
    { title: "Handling complaints", mins: 10, body: "Listen, apologise for the experience, fix what you can, and follow up. Never argue in public reviews." },
    { title: "Using saved replies", mins: 5, body: "Saved replies keep answers consistent and fast. Personalise the first line every time." },
  ],
  quiz: [
    { q: "What should every reply end with?", options: ["A discount", "A clear next step", "A long apology"], a: 1 },
    { q: "First step with a complaint?", options: ["Listen", "Explain policy", "Offer a refund"], a: 0 },
    { q: "Saved replies should be…", options: ["Sent unchanged", "Personalised in the first line", "Avoided"], a: 1 },
  ],
};
const FITNESS: { course: string; lessons: Lesson[]; quiz: Q[] } = {
  course: "4-Week Strength Starter",
  lessons: [
    { title: "Week 1 · Full body A", mins: 35, body: "Squats 3×10 · Push-ups 3×8 · Rows 3×10 · Plank 3×30s" },
    { title: "Week 1 · Full body B", mins: 35, body: "Lunges 3×10 · Shoulder press 3×10 · Glute bridge 3×12 · Dead bug 3×10" },
    { title: "Week 2 · Full body A+", mins: 40, body: "Squats 4×10 · Push-ups 3×10 · Rows 4×10 · Plank 3×40s" },
    { title: "Week 2 · Conditioning", mins: 25, body: "Intervals: 30s on / 30s off × 12 · Walk 10 min" },
  ],
  quiz: [
    { q: "How hard did this week feel? (check-in)", options: ["Too easy", "About right", "Too hard"], a: 1 },
  ],
};

export default function CourseDemo({ preset, brand }: EngineProps) {
  const cfg = preset === "fitness" ? FITNESS : ACADEMY;
  const [done, setDone] = useState<boolean[]>(cfg.lessons.map(() => false));
  const [cur, setCur] = useState(0);
  const [drip, setDrip] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(cfg.quiz.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [cert, setCert] = useState(false);
  const [weights, setWeights] = useState<number[]>([20, 22.5, 22.5, 25]);

  const progress = Math.round((done.filter(Boolean).length / cfg.lessons.length) * 100);
  const locked = (i: number) => drip && i > 0 && !done[i - 1];
  const score = cfg.quiz.reduce((s, q, i) => s + (answers[i] === q.a ? 1 : 0), 0);
  const passed = preset === "fitness" ? submitted : submitted && score / cfg.quiz.length >= 0.66;
  const allDone = done.every(Boolean);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={preset === "fitness" ? "Programme" : "Course"} value={<span className="text-base">{cfg.course}</span>} />
        <Stat label="Progress" value={`${progress}%`} />
        <Stat label={preset === "fitness" ? "Sessions done" : "Lessons done"} value={`${done.filter(Boolean).length}/${cfg.lessons.length}`} />
        <Stat label={preset === "fitness" ? "Check-in" : "Quiz"} value={submitted ? (preset === "fitness" ? "Sent" : `${score}/${cfg.quiz.length}`) : "Not taken"} />
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progress"><div className="h-full bg-[var(--demo-accent)] transition-all" style={{ width: `${progress}%` }} /></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={drip} onChange={(e) => setDrip(e.target.checked)} className="accent-[var(--demo-accent)]" />Drip mode: unlock each {preset === "fitness" ? "session" : "lesson"} after the previous one</label>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <ol className="space-y-1.5">
          {cfg.lessons.map((l, i) => (
            <li key={l.title}><button type="button" disabled={locked(i)} onClick={() => setCur(i)} aria-current={cur === i ? "step" : undefined} className={`flex w-full items-center gap-2 rounded-xl border p-2.5 text-left text-sm disabled:opacity-50 ${cur === i ? "border-[var(--demo-accent)] bg-[color-mix(in_srgb,var(--demo-accent)_6%,transparent)]" : "border-border"}`}>
              {done[i] ? <Check className="h-4 w-4 text-emerald-600" /> : locked(i) ? <Lock className="h-4 w-4 text-muted-foreground" /> : <PlayCircle className="h-4 w-4 text-[var(--demo-accent)]" />}
              <span className="flex-1">{l.title}<span className="block text-[11px] text-muted-foreground">{l.mins} min</span></span>
            </button></li>
          ))}
        </ol>
        <Panel title={cfg.lessons[cur].title} actions={<Badge tone={done[cur] ? "good" : "neutral"}>{done[cur] ? "Completed" : "In progress"}</Badge>}>
          <div className="flex aspect-video items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--demo-accent),#1f2147)] text-white"><PlayCircle className="h-12 w-12 opacity-80" aria-hidden="true" /><span className="sr-only">Video placeholder</span></div>
          <p className="mt-3 text-sm text-foreground">{cfg.lessons[cur].body}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Btn onClick={() => { setDone((d) => d.map((v, i) => (i === cur ? true : v))); if (cur < cfg.lessons.length - 1) setCur(cur + 1); }} disabled={done[cur]}>{preset === "fitness" ? "Log session" : "Mark complete"}</Btn>
            {done[cur] && <Btn variant="ghost" onClick={() => setDone((d) => d.map((v, i) => (i === cur ? false : v)))}>Undo</Btn>}
          </div>
        </Panel>
      </div>

      {preset === "fitness" && (
        <Panel title="Progress: squat weight (kg)">
          <div className="flex items-end gap-2" style={{ height: 120 }}>{weights.map((w, i) => <div key={i} className="flex flex-1 flex-col items-center gap-1"><div className="w-full rounded-t-md bg-[var(--demo-accent)]" style={{ height: `${(w / 40) * 100}px` }} /><span className="text-[11px] text-muted-foreground">S{i + 1}: {w}</span></div>)}</div>
          <Btn variant="soft" className="mt-2" onClick={() => setWeights((ws) => [...ws.slice(-7), ws[ws.length - 1] + 2.5])}>Log a heavier set (+2.5kg)</Btn>
        </Panel>
      )}

      <Panel title={preset === "fitness" ? "Weekly check-in" : "Quiz"}>
        <ol className="space-y-3">{cfg.quiz.map((q, i) => (
          <li key={q.q}><p className="text-sm font-medium">{i + 1}. {q.q}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">{q.options.map((o, j) => {
              const show = submitted && preset !== "fitness"; const right = j === q.a; const picked = answers[i] === j;
              return <button key={o} type="button" disabled={submitted} aria-pressed={picked} onClick={() => setAnswers((a) => a.map((v, k) => (k === i ? j : v)))} className={`rounded-full border px-3 py-1 text-xs ${show && right ? "border-emerald-500 bg-emerald-500/10" : show && picked ? "border-red-500 bg-red-500/10" : picked ? "border-[var(--demo-accent)] bg-[color-mix(in_srgb,var(--demo-accent)_10%,transparent)]" : "border-border"}`}>{o}</button>; })}</div></li>))}</ol>
        <div className="mt-3 flex gap-2">{!submitted ? <Btn disabled={answers.some((a) => a === null)} onClick={() => setSubmitted(true)}>Submit</Btn> : <Btn variant="ghost" onClick={() => { setSubmitted(false); setAnswers(cfg.quiz.map(() => null)); }}>Retake</Btn>}</div>
        {submitted && preset !== "fitness" && <p className="mt-2 text-sm">{passed ? "Passed!" : "Not quite: 2 of 3 needed. Review the lessons and retake."}</p>}
        {submitted && preset === "fitness" && <p className="mt-2 text-sm text-muted-foreground">Check-in sent to your coach. Next week's plan adjusts to your answer.</p>}
      </Panel>

      {preset !== "fitness" && (
        <Panel title="Certificate">
          {!(allDone && passed) ? <p className="text-sm text-muted-foreground">Complete all lessons and pass the quiz to unlock your certificate.</p> : !cert ? (
            <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) setCert(true); }} className="flex items-end gap-2"><Field label="Name on certificate" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className="flex-1" /><Btn type="submit" disabled={!name.trim()}>Issue certificate</Btn></form>
          ) : (
            <div className="rounded-2xl border-4 border-double p-6 text-center" style={{ borderColor: "var(--demo-accent)" }}>
              <BadgeCheck className="mx-auto h-8 w-8 text-[var(--demo-accent)]" />
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Certificate of completion</p>
              <p className="mt-2 font-display text-2xl font-semibold">{name}</p>
              <p className="mt-1 text-sm text-muted-foreground">completed <strong>{cfg.course}</strong> at {brand}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">{new Date().toLocaleDateString()} · Demo certificate</p>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
