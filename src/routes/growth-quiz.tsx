import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { QUIZ_QUESTIONS, bucketFor } from "@/lib/quiz-data";
import { submitQuiz, buildWa } from "@/lib/leads";
import { pageHead, breadcrumbLd } from "@/lib/seo";

export const Route = createFileRoute("/growth-quiz")({
  component: QuizPage,
  head: () =>
    pageHead({
      title: "Digital Growth Quiz — 10 Questions, 3 Fixes | EmmaForYou",
      description: "Answer 10 yes/no questions to see where your business stands online, and get the three fastest fixes to grow.",
      path: "/growth-quiz",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Growth quiz", path: "/growth-quiz" }])],
    }),
});

function QuizPage() {
  const [step, setStep] = useState(-1); // -1 = intro
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(() => answers.filter(Boolean).length, [answers]);
  const result = useMemo(() => bucketFor(score), [score]);
  const noIdx = useMemo(() => answers.map((a, i) => (a ? -1 : i)).filter((i) => i >= 0), [answers]);
  const wa = buildWa(`Hi! I just took the EmmaForYou Growth Quiz. My score: ${score}/10 — "${result.title}". I want to talk strategy.`);

  function answer(yes: boolean) {
    const next = [...answers, yes];
    setAnswers(next);
    if (next.length === QUIZ_QUESTIONS.length) {
      setStep(QUIZ_QUESTIONS.length); // results
    } else {
      setStep(step + 1);
    }
  }

  async function saveResult(e: React.FormEvent) {
    e.preventDefault();
    await submitQuiz({
      name, whatsapp, business_type: businessType,
      score, result_bucket: result.bucket, no_questions: noIdx,
    });
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-32 pb-24">
        <section className="mx-auto max-w-3xl px-5">
          {step === -1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <span className="inline-block rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground">2 minutes · 10 questions</span>
              <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-6xl">
                What's your <span className="gradient-text">digital growth score?</span>
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
                10 simple yes/no questions reveal where your business stands — and the 3 fastest fixes to unlock growth.
              </p>
              <button onClick={() => setStep(0)} className="btn-primary-gradient mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white">
                Start the quiz →
              </button>
            </motion.div>
          )}

          {step >= 0 && step < QUIZ_QUESTIONS.length && (
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="mt-4">
                <div className="mb-6 flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
                  <span>Question {step + 1} / {QUIZ_QUESTIONS.length}</span>
                  <span>{Math.round(((step) / QUIZ_QUESTIONS.length) * 100)}% done</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div className="h-full" style={{ background: "var(--gradient-brand)" }} initial={{ width: 0 }} animate={{ width: `${((step) / QUIZ_QUESTIONS.length) * 100}%` }} />
                </div>
                <div className="mt-10 rounded-3xl border border-border bg-card p-8 text-center">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{QUIZ_QUESTIONS[step].why}</p>
                  <h2 className="mt-3 font-display text-2xl font-bold leading-tight md:text-3xl">{QUIZ_QUESTIONS[step].q}</h2>
                  <div className="mt-8 grid grid-cols-2 gap-3">
                    <button onClick={() => answer(true)} className="rounded-2xl border-2 border-border bg-background py-5 font-display text-xl font-bold transition hover:-translate-y-0.5 hover:border-foreground">✅ Yes</button>
                    <button onClick={() => answer(false)} className="rounded-2xl border-2 border-border bg-background py-5 font-display text-xl font-bold transition hover:-translate-y-0.5 hover:border-foreground">❌ No</button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {step === QUIZ_QUESTIONS.length && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="rounded-3xl p-1" style={{ background: "var(--gradient-brand)" }}>
                <div className="rounded-[22px] bg-card p-8 text-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full text-5xl text-white" style={{ background: result.color }}>{result.emoji}</div>
                  <p className="mt-5 font-display text-7xl font-extrabold">{score}<span className="text-3xl text-muted-foreground">/10</span></p>
                  <h2 className="mt-3 font-display text-3xl font-bold">{result.title}</h2>
                  <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{result.headline}</p>

                  {noIdx.length > 0 && (
                    <div className="mt-8 rounded-2xl bg-muted/50 p-5 text-left">
                      <p className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">Top {Math.min(3, noIdx.length)} fixes for you</p>
                      <ul className="mt-3 space-y-2">
                        {noIdx.slice(0, 3).map((i) => (
                          <li key={i} className="flex gap-2 text-sm"><span>⚠️</span><span>{QUIZ_QUESTIONS[i].noFix}</span></li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!submitted ? (
                    <form onSubmit={saveResult} className="mt-8 grid gap-3 text-left">
                      <input className="input" placeholder="Your name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
                      <input className="input" placeholder="WhatsApp number (optional)" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
                      <input className="input" placeholder="Business type" value={businessType} onChange={(e) => setBusinessType(e.target.value)} />
                      <button className="btn-primary-gradient inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white">Save my result & get fixes →</button>
                    </form>
                  ) : (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-gold mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm">Talk to a strategist on WhatsApp →</a>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </section>
      </main>
      <Footer />
      <style>{`.input { display:block; width:100%; padding:0.625rem 0.875rem; border-radius:0.75rem; background: hsl(var(--background)); border:1px solid hsl(var(--border)); color: inherit; font-size:0.95rem; }`}</style>
    </div>
  );
}