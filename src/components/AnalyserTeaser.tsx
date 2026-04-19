// Compact 4-step analyser teaser shown on the homepage as section 4.
// Provides instant value, then funnels to the full /analyser page.
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { calcScore, getRecommendations, type AnalyserAnswers } from "@/lib/analyser-engine";
import { submitLead } from "@/lib/leads";

const BUSINESS_TYPES = [
  "Fashion Store", "Restaurant", "Clinic", "Salon", "Real Estate",
  "Coach / Consultant", "Ecommerce", "Gym", "Hotel", "Other",
];

const PRESENCE = ["Website", "Instagram", "Facebook", "TikTok", "Google Business", "WhatsApp Business", "Email List", "None"];

const CHALLENGES = [
  "Not enough leads", "Slow customer replies", "Low online visibility",
  "Low conversion", "Inconsistent branding", "No automation",
];

const REVENUE_TIERS = ["$0–500", "$500–2k", "$2k–10k", "$10k–50k", "$50k+"];

export default function AnalyserTeaser() {
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [showResult, setShowResult] = useState(false);
  const [bizType, setBizType] = useState("");
  const [presence, setPresence] = useState<string[]>([]);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [revenueTier, setRevenueTier] = useState("");

  const toggle = (arr: string[], setter: (v: string[]) => void, val: string) => {
    setter(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const answers = useMemo<AnalyserAnswers>(() => ({
    businessType: bizType,
    location: "",
    revenue: revenueTier === "$50k+" ? 50000 : revenueTier === "$10k–50k" ? 20000 : revenueTier === "$2k–10k" ? 5000 : revenueTier === "$500–2k" ? 1000 : 200,
    yearsInBusiness: "",
    presence,
    challenges,
    teamSize: "",
    budget: "",
    goal: "",
    timeline: "",
  }), [bizType, presence, challenges, revenueTier]);

  const score = useMemo(() => calcScore(answers), [answers]);
  const recs = useMemo(() => getRecommendations(answers), [answers]);

  const canNext = () => {
    if (step === 1) return !!bizType;
    if (step === 2) return presence.length > 0;
    if (step === 3) return challenges.length > 0;
    if (step === 4) return !!revenueTier;
    return false;
  };

  const submit = async () => {
    setShowResult(true);
    await submitLead({
      source: "analyser_teaser",
      business_type: bizType,
      presence,
      challenges,
      revenue: revenueTier,
      score: score.total,
      recommended_services: recs.map(r => r.service),
    });
  };

  const reset = () => {
    setStep(1); setShowResult(false); setBizType(""); setPresence([]); setChallenges([]); setRevenueTier("");
  };

  return (
    <section id="analyser-teaser" className="section-padding" style={{ background: "linear-gradient(180deg, var(--background), var(--secondary))" }}>
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground">
            ⚡ Free in 60 seconds
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold text-foreground md:text-5xl">
            {t("analyser_teaser_title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
            {t("analyser_teaser_sub")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: 8 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ perspective: 1200 }}
          className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-2xl md:p-10"
        >
          <AnimatePresence mode="wait">
            {!showResult ? (
              <motion.div key={`step-${step}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                {/* Progress */}
                <div className="mb-6 flex items-center gap-2">
                  {[1, 2, 3, 4].map(s => (
                    <div key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full"
                        style={{ background: "var(--gradient-brand)" }}
                        initial={{ width: "0%" }}
                        animate={{ width: s <= step ? "100%" : "0%" }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  ))}
                </div>
                <p className="mb-6 text-xs font-medium text-muted-foreground">Step {step} of 4</p>

                {step === 1 && (
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground md:text-2xl">What kind of business do you run?</h3>
                    <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-3">
                      {BUSINESS_TYPES.map(b => (
                        <button
                          key={b}
                          onClick={() => setBizType(b)}
                          className={`rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-all ${
                            bizType === b ? "border-emma-blue bg-muted text-foreground shadow-md" : "border-border text-muted-foreground hover:border-muted-foreground"
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground md:text-2xl">Where are you online today?</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Pick everything you have.</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {PRESENCE.map(p => (
                        <motion.button
                          key={p}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggle(presence, setPresence, p)}
                          className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-all ${
                            presence.includes(p) ? "border-transparent bg-foreground text-background" : "border-border text-muted-foreground"
                          }`}
                        >
                          {p}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground md:text-2xl">What's holding you back?</h3>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {CHALLENGES.map(c => (
                        <motion.button
                          key={c}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggle(challenges, setChallenges, c)}
                          className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-all ${
                            challenges.includes(c) ? "border-transparent text-white" : "border-border text-muted-foreground"
                          }`}
                          style={challenges.includes(c) ? { background: "var(--gradient-brand)" } : {}}
                        >
                          {c}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground md:text-2xl">Roughly, what's your monthly revenue?</h3>
                    <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-5">
                      {REVENUE_TIERS.map(r => (
                        <button
                          key={r}
                          onClick={() => setRevenueTier(r)}
                          className={`rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-all ${
                            revenueTier === r ? "border-emma-blue bg-muted shadow-md" : "border-border text-muted-foreground"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                  {step > 1 ? (
                    <button onClick={() => setStep(step - 1)} className="btn-ghost rounded-full px-5 py-2.5 text-sm">
                      ← {t("back")}
                    </button>
                  ) : <span />}
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => (step < 4 ? setStep(step + 1) : submit())}
                    disabled={!canNext()}
                    className="btn-gold rounded-full px-7 py-3 text-sm disabled:opacity-40"
                  >
                    {step < 4 ? `${t("next")} →` : `${t("get_results")} →`}
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="grid gap-8 md:grid-cols-2 md:items-center"
              >
                {/* Score ring */}
                <div className="flex flex-col items-center">
                  <div className="relative h-44 w-44">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="var(--muted)" strokeWidth="8" />
                      <motion.circle
                        cx="50" cy="50" r="42" fill="none"
                        stroke="url(#tsg)" strokeWidth="8" strokeLinecap="round"
                        initial={{ strokeDasharray: "0 264" }}
                        animate={{ strokeDasharray: `${score.total * 2.64} 264` }}
                        transition={{ duration: 1.4, ease: "easeOut" }}
                      />
                      <defs>
                        <linearGradient id="tsg" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="var(--emma-blue)" />
                          <stop offset="100%" stopColor="var(--emma-pink)" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="font-display text-5xl font-extrabold text-foreground"
                      >
                        {score.total}
                      </motion.span>
                      <span className="text-xs font-medium text-muted-foreground">/ 100</span>
                    </div>
                  </div>
                  <p className="mt-4 text-center text-sm font-semibold text-foreground">{t("score_label")}</p>
                  <p className="mt-1 text-center text-xs text-muted-foreground">
                    Better than {score.percentile}% of {bizType.toLowerCase() || "similar"} businesses
                  </p>
                </div>

                {/* Top recommendation */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Top recommendation</p>
                  <h3 className="mt-1 font-display text-2xl font-bold text-foreground">{recs[0]?.service}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{recs[0]?.why}</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {recs[0]?.outcome}
                  </div>

                  <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      💡 This is just a glimpse. The full 10-step analysis includes:
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-foreground/80">
                      <li>• Detailed score breakdown across 5 dimensions</li>
                      <li>• 6-month revenue projection chart</li>
                      <li>• 90-day action roadmap</li>
                      <li>• Competitor benchmark + package fit</li>
                    </ul>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      to="/analyser"
                      className="btn-gold inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
                    >
                      {t("analyser_get_full")}
                    </Link>
                    <button onClick={reset} className="btn-ghost rounded-full px-5 py-2.5 text-sm">
                      Restart
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
