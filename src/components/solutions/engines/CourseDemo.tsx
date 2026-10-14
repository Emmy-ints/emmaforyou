import { useState } from "react";
import { BadgeCheck, Check, Lock, PlayCircle } from "lucide-react";
import { Badge, Btn, Field, Outbox, Panel, RoleBar, RowsEditor, Select, SettingsPanel, Stat, Toggles, uid, useDemoSetting, type EngineProps, type OutboxItem } from "./ui";

interface Lesson { id?: string; title: string; mins: number; body: string }
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

const LEARNERS: [string, number, number][] = [["Amaka O.", 100, 3], ["Ben T.", 75, 2], ["Chidi E.", 25, 0], ["Dana K.", 50, 3], ["Efe U.", 0, 0]];

export default function CourseDemo(props: EngineProps) {
  const { preset, brand } = props;
  const base = preset === "fitness" ? FITNESS : ACADEMY;
  const [courseName, setCourseName] = useDemoSetting(props, "course", base.course);
  const [lessons, setLessons] = useDemoSetting<(Lesson & { id: string })[]>(props, "lessons", base.lessons.map((l, i) => ({ ...l, id: `l${i}` })));
  const [passMark, setPassMark] = useDemoSetting(props, "pass", 66);
  const [dripDefault, setDripDefault] = useDemoSetting(props, "drip", false);
  const [step, setStep] = useDemoSetting(props, "step", 2.5);
  const [notify, setNotify] = useDemoSetting<string[]>(props, "notify", ["cert", "nudge"]);
  const [role, setRole] = useDemoSetting(props, "role", "student");
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const push = (channel: string, to: string, text: string) => setOutbox((o) => [...o, { id: uid(), channel, to, text }].slice(-20));
  const cfg = { ...base, course: courseName || base.course, lessons: lessons.length ? lessons : base.lessons };
  const [doneRaw, setDone] = useState<Record<string, boolean>>({});
  const done = cfg.lessons.map((l, i) => !!doneRaw[l.id ?? String(i)]);
  const markDone = (i: number, v: boolean) => setDone((d) => ({ ...d, [cfg.lessons[i].id ?? String(i)]: v }));
  const [curRaw, setCur] = useState(0);
  const cur = Math.min(curRaw, cfg.lessons.length - 1);
  const [drip, setDrip] = useState(dripDefault);
  const [answers, setAnswers] = useState<(number | null)[]>(cfg.quiz.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [cert, setCert] = useState(false);
  const [weights, setWeights] = useState<number[]>([20, 22.5, 22.5, 25]);

  const progress = Math.round((done.filter(Boolean).length / cfg.lessons.length) * 100);
  const locked = (i: number) => drip && i > 0 && !done[i - 1];
  const score = cfg.quiz.reduce((s, q, i) => s + (answers[i] === q.a ? 1 : 0), 0);
  const passed = preset === "fitness" ? submitted : submitted && (score / cfg.quiz.length) * 100 >= passMark - 0.5;
  const needed = Math.ceil((passMark / 100) * cfg.quiz.length - 0.005);
  const allDone = done.every(Boolean);

  const ROLES = [
    { id: "student", label: preset === "fitness" ? "Member" : "Student", can: preset === "fitness" ? "Follows the programme, logs sessions and sends check-ins." : "Takes lessons and the quiz, and earns the certificate." },
    { id: "instructor", label: preset === "fitness" ? "Coach" : "Instructor", can: "Sees every learner's progress, sends reminders and edits the course in Demo settings." },
  ];
  if (role === "instructor") {
    return (
      <div className="space-y-4">
        <RoleBar roles={ROLES} value={role} onChange={setRole} />
        <Panel title={`${cfg.course} · learners (sample)`} actions={<Btn variant="soft" disabled={!notify.includes("nudge")} onClick={() => LEARNERS.filter(([, p]) => p < 50).forEach(([n, p]) => push("Email + WhatsApp", n, `You're ${p}% through ${cfg.course}. Pick up where you left off: "${cfg.lessons[Math.floor((p / 100) * cfg.lessons.length)]?.title ?? cfg.lessons[0].title}".`))}>Nudge inactive learners</Btn>}>
          <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="p-2">Learner</th><th className="p-2">Progress</th><th className="p-2">{preset === "fitness" ? "Check-ins" : "Quiz score"}</th><th className="p-2">Status</th></tr></thead>
            <tbody>{LEARNERS.map(([n, p, q]) => <tr key={n} className="border-t border-border"><td className="p-2">{n}</td><td className="p-2"><div className="h-2 w-28 overflow-hidden rounded-full bg-muted"><div className="h-full bg-[var(--demo-accent)]" style={{ width: `${p}%` }} /></div><span className="text-[11px] text-muted-foreground">{p}%</span></td><td className="p-2">{preset === "fitness" ? q : `${q}/${cfg.quiz.length}`}</td><td className="p-2"><Badge tone={p === 100 && (preset === "fitness" || (q / cfg.quiz.length) * 100 >= passMark - 0.5) ? "good" : p < 50 ? "warn" : "neutral"}>{p === 100 ? ((preset === "fitness" || (q / cfg.quiz.length) * 100 >= passMark - 0.5) ? "Completed" : "Needs quiz retake") : p < 50 ? "Inactive" : "In progress"}</Badge></td></tr>)}</tbody></table></div>
          {!notify.includes("nudge") && <p className="mt-2 text-[11px] text-muted-foreground">Turn on reminders in Demo settings to nudge learners.</p>}
        </Panel>
        <Outbox items={outbox} onClear={() => setOutbox([])} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SettingsPanel summary={`${cfg.lessons.length} ${preset === "fitness" ? "sessions" : "lessons"}${preset === "fitness" ? "" : ` · pass mark ${passMark}%`}`}>
        <Field label={preset === "fitness" ? "Programme name" : "Course name"} value={courseName} maxLength={60} onChange={(e) => setCourseName(e.target.value)} className="max-w-md" />
        <RowsEditor<Lesson & { id: string }> label={preset === "fitness" ? "Sessions" : "Lessons"} rows={lessons} onChange={(v) => { setLessons(v); setCur(0); }} max={8}
          cols={[{ key: "title", label: "Title", type: "text", width: "34%" }, { key: "mins", label: "Minutes", type: "number", min: 1, width: "14%" }, { key: "body", label: preset === "fitness" ? "Exercises" : "Content", type: "text" }]}
          make={() => ({ id: uid(), title: preset === "fitness" ? "New session" : "New lesson", mins: 10, body: "Describe this step." })} />
        <div className="grid gap-3 sm:grid-cols-3">
          {preset !== "fitness" && <Select label="Pass mark" value={String(passMark)} onChange={(e) => { setPassMark(Number(e.target.value)); }} options={[["34", "1 of 3 (34%)"], ["66", "2 of 3 (66%)"], ["100", "All correct (100%)"]]} />}
          <Select label="Release" value={dripDefault ? "drip" : "all"} onChange={(e) => { setDripDefault(e.target.value === "drip"); setDrip(e.target.value === "drip"); }} options={[["all", "All unlocked"], ["drip", "Drip: one after another"]]} />
          {preset === "fitness" && <Select label="Progression per set" value={String(step)} onChange={(e) => setStep(Number(e.target.value))} options={[["1", "+1 kg"], ["2.5", "+2.5 kg"], ["5", "+5 kg"]]} />}
        </div>
        <Toggles label="Notifications" options={preset === "fitness" ? [["nudge", "Remind inactive members"], ["checkin", "Send check-ins to the coach"]] : [["nudge", "Remind inactive learners"], ["cert", "Email the certificate"]]} value={notify} onChange={setNotify} />
      </SettingsPanel>
      <RoleBar roles={ROLES} value={role} onChange={setRole} />
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
            <li key={l.id ?? l.title}><button type="button" disabled={locked(i)} onClick={() => setCur(i)} aria-current={cur === i ? "step" : undefined} className={`flex w-full items-center gap-2 rounded-xl border p-2.5 text-left text-sm disabled:opacity-50 ${cur === i ? "border-[var(--demo-accent)] bg-[color-mix(in_srgb,var(--demo-accent)_6%,transparent)]" : "border-border"}`}>
              {done[i] ? <Check className="h-4 w-4 text-emerald-600" /> : locked(i) ? <Lock className="h-4 w-4 text-muted-foreground" /> : <PlayCircle className="h-4 w-4 text-[var(--demo-accent)]" />}
              <span className="flex-1">{l.title}<span className="block text-[11px] text-muted-foreground">{l.mins} min</span></span>
            </button></li>
          ))}
        </ol>
        <Panel title={cfg.lessons[cur].title} actions={<Badge tone={done[cur] ? "good" : "neutral"}>{done[cur] ? "Completed" : "In progress"}</Badge>}>
          <div className="flex aspect-video items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--demo-accent),#1f2147)] text-white"><PlayCircle className="h-12 w-12 opacity-80" aria-hidden="true" /><span className="sr-only">Video placeholder</span></div>
          <p className="mt-3 text-sm text-foreground">{cfg.lessons[cur].body}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Btn onClick={() => { markDone(cur, true); if (cur < cfg.lessons.length - 1) setCur(cur + 1); }} disabled={done[cur]}>{preset === "fitness" ? "Log session" : "Mark complete"}</Btn>
            {done[cur] && <Btn variant="ghost" onClick={() => markDone(cur, false)}>Undo</Btn>}
          </div>
        </Panel>
      </div>

      {preset === "fitness" && (
        <Panel title="Progress: squat weight (kg)">
          <div className="flex items-end gap-2" style={{ height: 120 }}>{weights.map((w, i) => <div key={i} className="flex flex-1 flex-col items-center gap-1"><div className="w-full rounded-t-md bg-[var(--demo-accent)]" style={{ height: `${(w / 40) * 100}px` }} /><span className="text-[11px] text-muted-foreground">S{i + 1}: {w}</span></div>)}</div>
          <Btn variant="soft" className="mt-2" onClick={() => setWeights((ws) => [...ws.slice(-7), ws[ws.length - 1] + step])}>Log a heavier set (+{step}kg)</Btn>
        </Panel>
      )}

      <Panel title={preset === "fitness" ? "Weekly check-in" : "Quiz"}>
        <ol className="space-y-3">{cfg.quiz.map((q, i) => (
          <li key={q.q}><p className="text-sm font-medium">{i + 1}. {q.q}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">{q.options.map((o, j) => {
              const show = submitted && preset !== "fitness"; const right = j === q.a; const picked = answers[i] === j;
              return <button key={o} type="button" disabled={submitted} aria-pressed={picked} onClick={() => setAnswers((a) => a.map((v, k) => (k === i ? j : v)))} className={`rounded-full border px-3 py-1 text-xs ${show && right ? "border-emerald-500 bg-emerald-500/10" : show && picked ? "border-red-500 bg-red-500/10" : picked ? "border-[var(--demo-accent)] bg-[color-mix(in_srgb,var(--demo-accent)_10%,transparent)]" : "border-border"}`}>{o}</button>; })}</div></li>))}</ol>
        <div className="mt-3 flex gap-2">{!submitted ? <Btn disabled={answers.some((a) => a === null)} onClick={() => { setSubmitted(true); if (preset === "fitness" && notify.includes("checkin")) push("App message", "Your coach", `Weekly check-in: "${cfg.quiz[0].options[answers[0] ?? 1]}".`); }}>Submit</Btn> : <Btn variant="ghost" onClick={() => { setSubmitted(false); setAnswers(cfg.quiz.map(() => null)); }}>Retake</Btn>}</div>
        {submitted && preset !== "fitness" && <p className="mt-2 text-sm">{passed ? "Passed!" : `Not quite: ${needed} of ${cfg.quiz.length} needed. Review the lessons and retake.`}</p>}
        {submitted && preset === "fitness" && <p className="mt-2 text-sm text-muted-foreground">{notify.includes("checkin") ? "Check-in shared with your coach (see the notification preview)." : "Check-in saved."} In a live app the coach adjusts next week's plan.</p>}
      </Panel>

      {preset !== "fitness" && (
        <Panel title="Certificate">
          {!(allDone && passed) ? <p className="text-sm text-muted-foreground">Complete all lessons and pass the quiz to unlock your certificate.</p> : !cert ? (
            <form onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; setCert(true); if (notify.includes("cert")) push("Email", name.trim(), `Congratulations! Your certificate for ${cfg.course} is attached.`); }} className="flex items-end gap-2"><Field label="Name on certificate" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className="flex-1" /><Btn type="submit" disabled={!name.trim()}>Issue certificate</Btn></form>
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
      <Outbox items={outbox} onClear={() => setOutbox([])} />
    </div>
  );
}
