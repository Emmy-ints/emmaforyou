import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, Info, Loader2, RotateCcw, Sparkles, UserRound } from "lucide-react";
import {
  EMPTY_ANSWERS,
  OPTIONS,
  PILLARS,
  scoreAssessment,
  stepError,
  type AssessmentAnswers,
  type PillarKey,
} from "@/lib/growth-assessment";
import { submitLead, buildWa } from "@/lib/leads";
import { track } from "@/lib/analytics";

type MultiKey = "presence" | "acquisition" | "marketing" | "challenges";
type SingleKey = "businessType" | "location" | "website" | "ecommerce" | "responseTime" | "followUp" | "goal" | "timeline";

interface StepDef {
  title: string;
  help: string;
  parts: ({ key: SingleKey; kind: "single"; label?: string; optional?: boolean } | { key: MultiKey; kind: "multi"; label?: string; max?: number; exclusive?: string })[];
}

const STEPS: StepDef[] = [
  { title: "What kind of business do you run?", help: "So recommendations fit your industry.", parts: [{ key: "businessType", kind: "single" }, { key: "location", kind: "single", label: "Where are most of your customers? (optional)", optional: true }] },
  { title: "Where can customers find you online today?", help: "Select everything you have and actively use.", parts: [{ key: "presence", kind: "multi", exclusive: "None yet" }] },
  { title: "Where do new customers come from?", help: "Select every channel that regularly brings you customers.", parts: [{ key: "acquisition", kind: "multi" }] },
  { title: "What can your website do?", help: "Be honest — this is where most businesses lose customers.", parts: [{ key: "website", kind: "single", label: "Your website today" }, { key: "ecommerce", kind: "single", label: "How customers pay" }] },
  { title: "Which marketing do you do regularly?", help: "Regularly means at least monthly.", parts: [{ key: "marketing", kind: "multi", exclusive: "None of these" }] },
  { title: "How do you handle new enquiries?", help: "Speed of reply is the biggest single factor in winning a customer.", parts: [{ key: "responseTime", kind: "single", label: "How quickly do you usually reply?" }, { key: "followUp", kind: "single", label: "Do you follow up with people who don't buy straight away?" }] },
  { title: "What's holding growth back?", help: "Choose up to three.", parts: [{ key: "challenges", kind: "multi", max: 3 }] },
  { title: "What do you want next?", help: "Your goal shapes the plan we suggest.", parts: [{ key: "goal", kind: "single", label: "Main goal" }, { key: "timeline", kind: "single", label: "When do you want to start?" }] },
];

export default function GrowthAssessment({ embedded = false }: { embedded?: boolean }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswers>(EMPTY_ANSWERS);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const result = useMemo(() => (done ? scoreAssessment(answers) : null), [done, answers]);

  useEffect(() => {
    if (done && result) track("quiz_completed", { kind: "growth_assessment", score: result.total, business: answers.businessType });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const def = STEPS[step];
  const progress = done ? 100 : Math.round((step / STEPS.length) * 100);

  function scrollTop() {
    if (!top.current) return;
    const y = top.current.getBoundingClientRect().top + window.scrollY - 100;
    if (window.scrollY > y) window.scrollTo({ top: y, behavior: "smooth" });
  }

  function next() {
    const err = stepError(step, answers);
    if (err) { setError(err); return; }
    setError(null);
    if (step === STEPS.length - 1) setDone(true);
    else setStep((s) => s + 1);
    scrollTop();
  }
  function back() { setError(null); setStep((s) => Math.max(0, s - 1)); scrollTop(); }
  function restart() { setAnswers(EMPTY_ANSWERS); setStep(0); setDone(false); setError(null); scrollTop(); }

  function pickSingle(key: SingleKey, value: string) { setAnswers((a) => ({ ...a, [key]: value })); setError(null); }
  function toggleMulti(key: MultiKey, value: string, max?: number, exclusive?: string) {
    setError(null);
    setAnswers((a) => {
      const current = a[key] as string[];
      if (current.includes(value)) return { ...a, [key]: current.filter((v) => v !== value) };
      if (exclusive && value === exclusive) return { ...a, [key]: [value] };
      const cleaned = exclusive ? current.filter((v) => v !== exclusive) : current;
      if (max && cleaned.length >= max) { setError(`You can choose up to ${max}.`); return a; }
      return { ...a, [key]: [...cleaned, value] };
    });
  }

  return (
    <div ref={top} className={`ga ${embedded ? "" : ""}`}>
      {/* Progress */}
      <div className="ga-progress" aria-hidden="true"><motion.span animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} /></div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{done ? "Your results" : `Step ${step + 1} of ${STEPS.length}`}</span>
        <span>{done ? "Completed" : "About 2 minutes"}</span>
      </div>

      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="mt-6">
            <h3 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{def.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{def.help}</p>

            <div className="mt-6 space-y-6">
              {def.parts.map((part) => (
                <fieldset key={part.key}>
                  {part.label && <legend className="mb-3 text-sm font-semibold">{part.label}</legend>}
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(OPTIONS[part.key] as readonly string[]).map((opt) => {
                      const active = part.kind === "single" ? answers[part.key] === opt : (answers[part.key] as string[]).includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          role={part.kind === "single" ? "radio" : "checkbox"}
                          aria-checked={active}
                          onClick={() => part.kind === "single" ? pickSingle(part.key, opt) : toggleMulti(part.key, opt, part.max, part.exclusive)}
                          className={`ga-option ${active ? "is-active" : ""}`}
                        >
                          <span className={`ga-check ${part.kind === "single" ? "is-radio" : ""}`}>{active && <Check className="h-3 w-3" />}</span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>

            {error && <p role="alert" className="mt-4 text-sm font-medium text-destructive">{error}</p>}

            <div className="mt-8 flex items-center justify-between gap-3">
              <button type="button" onClick={back} disabled={step === 0} className="ga-back"><ArrowLeft className="h-4 w-4" /> Back</button>
              <button type="button" onClick={next} className="btn-gold inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm">
                {step === STEPS.length - 1 ? "See my results" : "Next"} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          result && (
            <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mt-6">
              <Results answers={answers} result={result} onRestart={restart} />
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Results({ answers, result, onRestart }: { answers: AssessmentAnswers; result: ReturnType<typeof scoreAssessment>; onRestart: () => void }) {
  const [showHow, setShowHow] = useState(false);
  const order: PillarKey[] = ["presence", "acquisition", "website", "marketing", "followup"];

  return (
    <div className="space-y-6">
      <div className="ga-score">
        <div className="ga-ring" style={{ ["--p" as string]: `${result.total}` }}>
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tabular-nums">{result.total}</motion.span>
          <small>/100</small>
        </div>
        <div className="min-w-0">
          <p className="text-sm text-[#a6abd0]">Growth readiness score · {answers.businessType}</p>
          <p className="mt-1 font-display text-2xl font-semibold text-white">{result.band.label}</p>
          <p className="mt-2 text-sm leading-relaxed text-[#c9ccec]">{result.band.summary}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {order.map((k) => (
          <div key={k} className="ga-pillar">
            <p className="text-xs text-muted-foreground">{PILLARS[k].label}</p>
            <p className="mt-1 font-display text-xl font-semibold tabular-nums">{result.pillars[k]}<span className="text-sm text-muted-foreground">/20</span></p>
            <div className="ga-bar"><motion.span initial={{ width: 0 }} animate={{ width: `${(result.pillars[k] / 20) * 100}%` }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} /></div>
          </div>
        ))}
      </div>

      <button type="button" onClick={() => setShowHow((s) => !s)} aria-expanded={showHow} className="ga-how-toggle">
        <Info className="h-4 w-4" /> How your score works <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${showHow ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {showHow && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <ul className="grid gap-3 text-sm sm:grid-cols-2">
              {order.map((k) => (
                <li key={k} className="rounded-xl border border-border bg-card p-3">
                  <p className="font-semibold">{PILLARS[k].label} · up to 20 points</p>
                  <p className="mt-1 text-muted-foreground">{PILLARS[k].explain}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">Your goals and challenges don't change the score — they decide which recommendations come first. The score compares you with a well-run business in your category, not with other visitors.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[color:var(--emma-violet)]" />
          <h4 className="font-display text-lg font-semibold">Automated recommendations</h4>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Generated instantly from your answers. A useful starting point, not a substitute for a proper look at your business.</p>
        <ol className="mt-4 grid gap-3 md:grid-cols-3">
          {result.recommendations.map((r, i) => (
            <li key={r.title} className="ga-rec">
              <span className="ga-rec-n">{i + 1}</span>
              <p className="mt-3 font-display font-semibold">{r.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{r.why}</p>
              <p className="mt-3 text-sm"><span className="font-semibold">First step: </span>{r.firstStep}</p>
              <Link to="/services/$slug" params={{ slug: r.service.slug }} className="mt-4 inline-flex text-sm font-semibold text-[color:var(--emma-violet)] underline-offset-4 hover:underline">
                How {r.service.name} works
              </Link>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link to="/proposal" className="ga-rec block hover:border-[color:var(--emma-violet)]"><p className="font-display font-semibold">Get a written proposal →</p><p className="mt-1 text-sm text-muted-foreground">Scope, timeline and the right plan in 20 seconds.</p></Link>
        <Link to="/website-audit" className="ga-rec block hover:border-[color:var(--emma-violet)]"><p className="font-display font-semibold">Audit your website →</p><p className="mt-1 text-sm text-muted-foreground">Speed, SEO and contact checks with a fix list.</p></Link>
        <Link to="/book" className="ga-rec block hover:border-[color:var(--emma-violet)]"><p className="font-display font-semibold">Book a free call →</p><p className="mt-1 text-sm text-muted-foreground">Talk it through with Emmanuel.</p></Link>
      </div>

      <ExpertAuditForm answers={answers} result={result} />

      <button type="button" onClick={onRestart} className="ga-back"><RotateCcw className="h-4 w-4" /> Start again</button>
    </div>
  );
}

function ExpertAuditForm({ answers, result }: { answers: AssessmentAnswers; result: ReturnType<typeof scoreAssessment> }) {
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [site, setSite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Add your name.");
    if (!whatsapp.trim() && !email.trim()) return setError("Add a WhatsApp number or email so we can send your audit.");
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) return setError("That email address doesn't look right.");
    setError("");
    setState("sending");
    const res = await submitLead({
      source: "analyser_full",
      name: name.trim(),
      business_name: business.trim() || undefined,
      whatsapp: whatsapp.trim() || undefined,
      email: email.trim() || undefined,
      business_type: answers.businessType,
      location: answers.location || undefined,
      presence: answers.presence,
      challenges: answers.challenges,
      goal: [answers.goal, site.trim() ? `Website: ${site.trim()}` : ""].filter(Boolean).join(" · "),
      timeline: answers.timeline,
      score: result.total,
      recommended_services: result.recommendations.map((r) => r.service.name),
    });
    if (res.ok) setState("sent");
    else { setState("error"); setError("We couldn't send your request. Please try again, or message us on WhatsApp."); }
  }

  if (state === "sent") {
    return (
      <div className="ga-audit flex gap-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-[#3dd6f5]" />
        <div>
          <p className="font-semibold text-white">Audit requested</p>
          <p className="mt-1 text-sm text-[#a6abd0]">Emmanuel will personally review your answers{site ? " and your website" : ""}, and send your audit within two working days.</p>
          <a href={buildWa(`Hi! I just did the growth assessment (score ${result.total}/100, ${answers.businessType}). Looking forward to my audit.`)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-sm font-semibold text-[#3dd6f5] underline underline-offset-4">Say hello on WhatsApp</a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="ga-audit">
      <div className="flex items-center gap-2">
        <UserRound className="h-4 w-4 text-[#3dd6f5]" />
        <p className="font-display text-lg font-semibold text-white">Want a personal expert audit?</p>
      </div>
      <p className="mt-1 text-sm text-[#a6abd0]">Unlike the automated results above, a real person looks at your website, Google profile and social pages, then sends a prioritised plan. Free, no obligation.</p>
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        <input className="roi-dark-input" placeholder="Your name *" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" aria-label="Your name" />
        <input className="roi-dark-input" placeholder="Business name" value={business} onChange={(e) => setBusiness(e.target.value)} autoComplete="organization" aria-label="Business name" />
        <input className="roi-dark-input" placeholder="WhatsApp number" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} inputMode="tel" autoComplete="tel" aria-label="WhatsApp number" />
        <input className="roi-dark-input" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-label="Email" />
        <input className="roi-dark-input sm:col-span-2" placeholder="Website or Instagram link (optional)" value={site} onChange={(e) => setSite(e.target.value)} aria-label="Website or Instagram link" />
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-[#ffb4b4]">{error}</p>}
      <button type="submit" disabled={state === "sending"} className="btn-gold mt-4 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm disabled:opacity-70">
        {state === "sending" ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : "Request my free audit"}
      </button>
    </form>
  );
}
