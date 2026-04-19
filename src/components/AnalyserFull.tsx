// Full 10-step Business Analyser wizard.
// Used by the dedicated /analyser route AND can be embedded anywhere.
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  calcScore, getRecommendations, projectRevenue, buildRoadmap,
  recommendPackage, getCompetitiveIntel, type AnalyserAnswers,
} from "@/lib/analyser-engine";
import { submitLead, buildWhatsAppLink } from "@/lib/leads";
import { useI18n } from "@/lib/i18n";

const BUSINESS_TYPES = [
  "Fashion Store", "Shoe Store", "Beauty Store", "Gadgets Store", "Furniture Store",
  "Restaurant", "Clinic", "Salon", "Spa", "Gym", "Barbershop", "Bakery", "Pharmacy",
  "Laundry", "Nail Studio", "Real Estate Agent", "Property Developer", "Short-Let Apartments",
  "Car Dealer", "Car Rental", "Mechanic", "Coach", "Consultant", "Lawyer", "Fitness Trainer",
  "Photographer", "Event Planner", "School", "SaaS Company", "Logistics", "Influencer",
  "Course Creator", "Hotel", "Church/Ministry", "Ecommerce Store", "Phone Accessories",
  "Perfume Store", "Food Business", "Printing Service", "Other",
];

const LOCATIONS = ["Nigeria", "USA", "UK", "Europe", "South Africa", "Colombia", "Other"];
const YEARS = ["< 1yr", "1-3yrs", "3-5yrs", "5yrs+"];
const PRESENCE = ["Website", "Instagram", "Facebook", "TikTok", "Google Business", "Email List", "WhatsApp Business", "LinkedIn", "None"];
const CHALLENGES = [
  "Not enough leads", "Slow customer replies", "Low conversion rate", "Poor online visibility",
  "Inconsistent branding", "No marketing automation", "Bad website / no website",
  "Can't retain customers", "Hard to scale ad spend", "Weak social presence",
  "No email strategy", "Time-consuming admin",
];
const TEAMS = ["Solo", "2-5", "6-15", "16-50", "50+"];
const BUDGETS = ["$0–100", "$100–500", "$500–2000", "$2000–5000", "$5000+"];
const GOALS = ["More leads", "More sales", "Brand awareness", "Customer retention", "Launch new product", "Scale to new market"];
const TIMELINES = ["30 days", "60 days", "90 days", "6 months", "1 year"];

const TOTAL_STEPS = 10;

interface Props {
  embedded?: boolean;
}

export default function AnalyserFull({ embedded = false }: Props) {
  const { t, lang } = useI18n();
  const [step, setStep] = useState(1);
  const [showResults, setShowResults] = useState(false);

  const [businessType, setBusinessType] = useState("");
  const [location, setLocation] = useState("");
  const [revenue, setRevenue] = useState(1000);
  const [yearsInBusiness, setYearsInBusiness] = useState("");
  const [presence, setPresence] = useState<string[]>([]);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState("");
  const [budget, setBudget] = useState("");
  const [goal, setGoal] = useState("");
  const [timeline, setTimeline] = useState("");

  // Lead capture
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const answers = useMemo<AnalyserAnswers>(() => ({
    businessType, location, revenue, yearsInBusiness, presence, challenges,
    teamSize, budget, goal, timeline,
  }), [businessType, location, revenue, yearsInBusiness, presence, challenges, teamSize, budget, goal, timeline]);

  const score = useMemo(() => calcScore(answers), [answers]);
  const recs = useMemo(() => getRecommendations(answers), [answers]);
  const projection = useMemo(() => projectRevenue(answers), [answers]);
  const roadmap = useMemo(() => buildRoadmap(answers), [answers]);
  const pkg = useMemo(() => recommendPackage(answers), [answers]);
  const intel = useMemo(() => getCompetitiveIntel(answers, score.total), [answers, score.total]);

  const toggle = (arr: string[], setter: (v: string[]) => void, val: string) => {
    setter(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const canNext = (() => {
    switch (step) {
      case 1: return !!businessType;
      case 2: return !!location;
      case 3: return revenue >= 0;
      case 4: return !!yearsInBusiness;
      case 5: return presence.length > 0;
      case 6: return challenges.length > 0;
      case 7: return !!teamSize;
      case 8: return !!budget;
      case 9: return !!goal;
      case 10: return !!timeline;
      default: return false;
    }
  })();

  const next = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
    else setShowResults(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !whatsapp || !businessName) return;
    setSubmitting(true);
    setSubmitErr(null);
    const result = await submitLead({
      source: "analyser_full",
      name, email, whatsapp, business_name: businessName,
      business_type: businessType, location,
      revenue: `$${revenue}/mo`,
      years_in_business: yearsInBusiness,
      presence, challenges,
      team_size: teamSize, budget, goal, timeline,
      score: score.total,
      recommended_services: recs.map(r => r.service),
      language: lang,
    });
    setSubmitting(false);
    if (result.ok) {
      setSubmitted(true);
      setTimeout(() => {
        window.open(buildWhatsAppLink(score.total, businessName), "_blank", "noopener");
      }, 1500);
    } else {
      setSubmitErr("Could not save your details. We've kept a local backup — please try again or message us directly on WhatsApp.");
    }
  };

  const wrapperBg = embedded
    ? "bg-transparent"
    : "min-h-screen pt-20";

  return (
    <section className={`${wrapperBg} section-padding`}>
      <div className="mx-auto max-w-5xl">
        {!embedded && (
          <div className="mb-12 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground">
              📊 10-step deep analysis · 100% free
            </span>
            <h1 className="mt-4 font-display text-4xl font-extrabold text-foreground md:text-6xl">
              {t("analyser_title")}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
              {t("analyser_sub")}
            </p>
          </div>
        )}

        {embedded && (
          <div className="mb-10 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground">
              🚀 The deep dive — 10 steps
            </span>
            <h2 className="mt-4 font-display text-3xl font-extrabold text-foreground md:text-5xl">
              The Full Business Analyser
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
              For owners ready to invest. Get a complete digital health audit, revenue projection and 90-day roadmap.
            </p>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.7 }}
          className="rounded-3xl border border-border bg-card p-6 shadow-2xl md:p-10"
        >
          {!showResults ? (
            <>
              {/* Stepper */}
              <div className="mb-2 flex items-center gap-1">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full"
                      style={{ background: "var(--gradient-brand)" }}
                      initial={{ width: 0 }}
                      animate={{ width: i < step ? "100%" : 0 }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                ))}
              </div>
              <p className="mb-6 text-xs font-medium text-muted-foreground">Step {step} of {TOTAL_STEPS}</p>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`step-${step}`}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                >
                  {step === 1 && (
                    <StepWrap title="What type of business do you run?">
                      <select
                        value={businessType}
                        onChange={e => setBusinessType(e.target.value)}
                        className="mt-4 w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus:border-emma-blue focus:outline-none"
                      >
                        <option value="">Select your business type…</option>
                        {BUSINESS_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </StepWrap>
                  )}

                  {step === 2 && (
                    <StepWrap title="Where do you primarily serve customers?">
                      <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
                        {LOCATIONS.map(l => (
                          <PickButton key={l} active={location === l} onClick={() => setLocation(l)}>{l}</PickButton>
                        ))}
                      </div>
                    </StepWrap>
                  )}

                  {step === 3 && (
                    <StepWrap title="Roughly, what's your current monthly revenue?">
                      <div className="mt-6 space-y-4">
                        <input
                          type="range" min={0} max={50000} step={500}
                          value={revenue}
                          onChange={e => setRevenue(Number(e.target.value))}
                          className="w-full accent-emma-blue"
                        />
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-muted-foreground">$0</span>
                          <span className="font-display text-3xl font-extrabold text-foreground">
                            ${revenue.toLocaleString()}{revenue >= 50000 ? "+" : ""}/mo
                          </span>
                          <span className="text-xs text-muted-foreground">$50k+</span>
                        </div>
                      </div>
                    </StepWrap>
                  )}

                  {step === 4 && (
                    <StepWrap title="How long have you been in business?">
                      <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
                        {YEARS.map(y => (
                          <PickButton key={y} active={yearsInBusiness === y} onClick={() => setYearsInBusiness(y)}>{y}</PickButton>
                        ))}
                      </div>
                    </StepWrap>
                  )}

                  {step === 5 && (
                    <StepWrap title="What's your current online presence?" subtitle="Pick everything you have.">
                      <div className="mt-5 flex flex-wrap gap-2">
                        {PRESENCE.map(p => (
                          <ChipButton key={p} active={presence.includes(p)} onClick={() => toggle(presence, setPresence, p)}>{p}</ChipButton>
                        ))}
                      </div>
                    </StepWrap>
                  )}

                  {step === 6 && (
                    <StepWrap title="What are your biggest challenges?" subtitle="Pick all that apply.">
                      <div className="mt-5 flex flex-wrap gap-2">
                        {CHALLENGES.map(c => (
                          <ChipButton key={c} active={challenges.includes(c)} onClick={() => toggle(challenges, setChallenges, c)} brand>{c}</ChipButton>
                        ))}
                      </div>
                    </StepWrap>
                  )}

                  {step === 7 && (
                    <StepWrap title="How big is your team?">
                      <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-5">
                        {TEAMS.map(team => (
                          <PickButton key={team} active={teamSize === team} onClick={() => setTeamSize(team)}>{team}</PickButton>
                        ))}
                      </div>
                    </StepWrap>
                  )}

                  {step === 8 && (
                    <StepWrap title="What's your monthly marketing budget?">
                      <div className="mt-5 grid gap-2 md:grid-cols-5">
                        {BUDGETS.map(b => (
                          <PickButton key={b} active={budget === b} onClick={() => setBudget(b)}>{b}</PickButton>
                        ))}
                      </div>
                    </StepWrap>
                  )}

                  {step === 9 && (
                    <StepWrap title="What's your primary growth goal?">
                      <div className="mt-5 grid gap-2 md:grid-cols-3">
                        {GOALS.map(g => (
                          <PickButton key={g} active={goal === g} onClick={() => setGoal(g)}>{g}</PickButton>
                        ))}
                      </div>
                    </StepWrap>
                  )}

                  {step === 10 && (
                    <StepWrap title="How soon do you want results?">
                      <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-5">
                        {TIMELINES.map(tm => (
                          <PickButton key={tm} active={timeline === tm} onClick={() => setTimeline(tm)}>{tm}</PickButton>
                        ))}
                      </div>
                    </StepWrap>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                {step > 1 ? (
                  <button onClick={() => setStep(step - 1)} className="btn-ghost rounded-full px-5 py-2.5 text-sm">
                    ← {t("back")}
                  </button>
                ) : <span />}
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={next}
                  disabled={!canNext}
                  className="btn-gold rounded-full px-7 py-3 text-sm disabled:opacity-40"
                >
                  {step === TOTAL_STEPS ? `${t("get_results")} →` : `${t("next")} →`}
                </motion.button>
              </div>
            </>
          ) : (
            <ResultsDashboard
              answers={answers}
              score={score}
              recs={recs}
              projection={projection}
              roadmap={roadmap}
              pkg={pkg}
              intel={intel}
              name={name} setName={setName}
              email={email} setEmail={setEmail}
              whatsapp={whatsapp} setWhatsapp={setWhatsapp}
              businessName={businessName} setBusinessName={setBusinessName}
              submitting={submitting}
              submitted={submitted}
              submitErr={submitErr}
              onSubmit={handleSubmit}
            />
          )}
        </motion.div>
      </div>
    </section>
  );
}

function StepWrap({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-display text-xl font-bold text-foreground md:text-2xl">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      {children}
    </div>
  );
}

function PickButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
        active ? "border-emma-blue bg-muted text-foreground shadow-md" : "border-border text-muted-foreground hover:border-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function ChipButton({ active, onClick, children, brand }: { active: boolean; onClick: () => void; children: React.ReactNode; brand?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-all ${
        active
          ? brand ? "border-transparent text-white" : "border-transparent bg-foreground text-background"
          : "border-border text-muted-foreground"
      }`}
      style={active && brand ? { background: "var(--gradient-brand)" } : {}}
    >
      {children}
    </motion.button>
  );
}

// ===== RESULTS DASHBOARD =====
interface ResultsProps {
  answers: AnalyserAnswers;
  score: ReturnType<typeof calcScore>;
  recs: ReturnType<typeof getRecommendations>;
  projection: ReturnType<typeof projectRevenue>;
  roadmap: ReturnType<typeof buildRoadmap>;
  pkg: ReturnType<typeof recommendPackage>;
  intel: ReturnType<typeof getCompetitiveIntel>;
  name: string; setName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  whatsapp: string; setWhatsapp: (v: string) => void;
  businessName: string; setBusinessName: (v: string) => void;
  submitting: boolean;
  submitted: boolean;
  submitErr: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

function ResultsDashboard(p: ResultsProps) {
  return (
    <div className="space-y-8">
      {/* Panel 1: Score */}
      <Panel title="Digital Health Score" badge="01">
        <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-center">
          <div className="flex flex-col items-center">
            <div className="relative h-48 w-48">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--muted)" strokeWidth="8" />
                <motion.circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="url(#fsg)" strokeWidth="8" strokeLinecap="round"
                  initial={{ strokeDasharray: "0 264" }}
                  animate={{ strokeDasharray: `${p.score.total * 2.64} 264` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="fsg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={p.score.total >= 70 ? "#10b981" : p.score.total >= 40 ? "#f59e0b" : "#ef4444"} />
                    <stop offset="100%" stopColor="var(--emma-pink)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
                  className="font-display text-6xl font-extrabold text-foreground"
                >{p.score.total}</motion.span>
                <span className="text-xs font-medium text-muted-foreground">/ 100</span>
              </div>
            </div>
            <p className="mt-3 text-center text-sm font-medium text-muted-foreground">
              You score higher than <span className="font-bold text-foreground">{p.score.percentile}%</span> of {(p.answers.businessType || "similar").toLowerCase()} businesses{p.answers.location ? ` in ${p.answers.location}` : ""}
            </p>
          </div>
          <div className="space-y-3">
            <ScoreBar label="Website" value={p.score.website} max={20} />
            <ScoreBar label="Social Media" value={p.score.social} max={20} />
            <ScoreBar label="Automation" value={p.score.automation} max={20} />
            <ScoreBar label="Paid Ads" value={p.score.ads} max={20} />
            <ScoreBar label="Content" value={p.score.content} max={20} />
          </div>
        </div>
      </Panel>

      {/* Panel 2: Top 3 services */}
      <Panel title="Top 3 Recommended Services" badge="02">
        <div className="space-y-3">
          {p.recs.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className="rounded-2xl border border-border bg-muted/40 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-display text-lg font-bold text-foreground">{r.service}</h4>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  r.priority === "URGENT" ? "bg-red-100 text-red-700" :
                  r.priority === "HIGH" ? "bg-amber-100 text-amber-700" :
                  "bg-blue-100 text-blue-700"
                }`}>{r.priority}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{r.why}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1 font-medium text-foreground">
                  🎯 {r.outcome}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1 font-medium text-foreground">
                  ⏱ {r.timeframe}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </Panel>

      {/* Panel 3: Revenue projection */}
      <Panel title="Revenue Growth Projection" badge="03">
        <RevenueChart projection={p.projection} />
        <p className="mt-3 text-xs italic text-muted-foreground">
          Projections based on average results across similar businesses. Actual results vary.
        </p>
      </Panel>

      {/* Panel 4: Roadmap */}
      <Panel title="Your 90-Day Action Roadmap" badge="04">
        <div className="grid gap-4 md:grid-cols-3">
          {p.roadmap.map((r, i) => (
            <motion.div
              key={r.month}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full font-display text-base font-bold text-white" style={{ background: "var(--gradient-brand)" }}>
                  M{r.month}
                </span>
                <p className="font-display text-base font-bold text-foreground">{r.phase}</p>
              </div>
              <ul className="mt-4 space-y-2">
                {r.actions.map((a, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                    {a}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </Panel>

      {/* Panel 5: Competitive intel */}
      <Panel title="Competitive Intelligence" badge="05">
        <p className="text-sm font-medium text-foreground">{p.intel.headline}</p>
        <p className="mt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Top performers use</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {p.intel.tools.map((t, i) => (
            <span key={i} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">{t}</span>
          ))}
        </div>
        <div className="mt-6 space-y-2">
          <CompareBar label="You" value={p.intel.you} highlight />
          <CompareBar label="Industry average" value={p.intel.industry} />
          <CompareBar label="Top performers" value={p.intel.top} />
        </div>
      </Panel>

      {/* Panel 6: Package */}
      <Panel title="Recommended Package" badge="06">
        <div className="rounded-2xl border-2 border-emma-blue/30 p-6" style={{ background: "linear-gradient(135deg, var(--card), var(--muted))" }}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h4 className="font-display text-2xl font-extrabold text-foreground">{p.pkg.name}</h4>
            <span className="font-display text-base font-bold gradient-text">{p.pkg.priceRange}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Best fit based on your budget tier and goals.</p>
          <ul className="mt-4 space-y-2">
            {p.pkg.deliverables.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
                </svg>
                {d}
              </li>
            ))}
          </ul>
        </div>
      </Panel>

      {/* Panel 7: Lead capture */}
      <Panel title="Get Your Full Report on WhatsApp" badge="07">
        {!p.submitted ? (
          <form onSubmit={p.onSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Your name" required>
                <input
                  type="text" required maxLength={100}
                  value={p.name} onChange={e => p.setName(e.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus:border-emma-blue focus:outline-none"
                  placeholder="John Doe"
                />
              </Field>
              <Field label="Business name" required>
                <input
                  type="text" required maxLength={100}
                  value={p.businessName} onChange={e => p.setBusinessName(e.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus:border-emma-blue focus:outline-none"
                  placeholder="Acme Co."
                />
              </Field>
              <Field label="WhatsApp number" required>
                <input
                  type="tel" required maxLength={20}
                  value={p.whatsapp} onChange={e => p.setWhatsapp(e.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus:border-emma-blue focus:outline-none"
                  placeholder="+234…"
                />
              </Field>
              <Field label="Email" required>
                <input
                  type="email" required maxLength={255}
                  value={p.email} onChange={e => p.setEmail(e.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm focus:border-emma-blue focus:outline-none"
                  placeholder="you@business.com"
                />
              </Field>
            </div>
            {p.submitErr && <p className="text-xs font-medium text-destructive">{p.submitErr}</p>}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={p.submitting}
              className="w-full rounded-full px-6 py-4 text-base font-bold text-white shadow-lg disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
            >
              {p.submitting ? "Sending…" : "📲 Send My Full Report to WhatsApp"}
            </motion.button>
            <p className="text-center text-xs text-muted-foreground">
              🔒 Your information is 100% secure. We'll send your personalised report within 1 hour.
            </p>
          </form>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-green-50 p-6 text-center"
          >
            <p className="text-3xl">🎉</p>
            <h4 className="mt-2 font-display text-xl font-bold text-foreground">You're all set!</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Opening WhatsApp now. We'll follow up within 1 hour with your full personalised report.
            </p>
            <a
              href={buildWhatsAppLink(p.score.total, p.businessName)}
              target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
            >
              Open WhatsApp →
            </a>
          </motion.div>
        )}
      </Panel>
    </div>
  );
}

function Panel({ title, badge, children }: { title: string; badge: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6 }}
      className="rounded-3xl border border-border bg-card p-6 shadow-md md:p-8"
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="font-display text-xs font-bold tracking-widest text-muted-foreground">{badge}</span>
        <div className="h-px flex-1 bg-border" />
        <h3 className="font-display text-lg font-bold text-foreground md:text-xl">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = (value / max) * 100;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs font-bold text-muted-foreground">{value}/{max}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "var(--gradient-brand)" }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function CompareBar({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className={`text-sm ${highlight ? "font-bold text-foreground" : "font-medium text-muted-foreground"}`}>{label}</span>
        <span className="text-xs font-bold text-muted-foreground">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full"
          style={highlight ? { background: "var(--gradient-brand)" } : { background: "var(--muted-foreground)" }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-foreground">
        {label}{required && <span className="text-destructive"> *</span>}
      </span>
      {children}
    </label>
  );
}

// ===== SVG Revenue Chart =====
function RevenueChart({ projection }: { projection: ReturnType<typeof projectRevenue> }) {
  const w = 600, h = 240, pad = 40;
  const all = [...projection.current, ...projection.conservative, ...projection.aggressive];
  const max = Math.max(...all);
  const min = 0;
  const xs = projection.months.map((_, i) => pad + (i * (w - 2 * pad)) / (projection.months.length - 1));
  const yScale = (v: number) => h - pad - ((v - min) / (max - min || 1)) * (h - 2 * pad);

  const path = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? "M" : "L"} ${xs[i]} ${yScale(v)}`).join(" ");

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full min-w-[500px]">
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((g, i) => (
          <line key={i} x1={pad} x2={w - pad} y1={pad + g * (h - 2 * pad)} y2={pad + g * (h - 2 * pad)} stroke="var(--border)" strokeWidth="1" />
        ))}
        {/* Y labels */}
        {[0, 0.5, 1].map((g, i) => {
          const v = max - g * (max - min);
          return (
            <text key={i} x={pad - 6} y={pad + g * (h - 2 * pad) + 4} fontSize="10" textAnchor="end" fill="var(--muted-foreground)">
              ${Math.round(v / 100) / 10}k
            </text>
          );
        })}
        {/* X labels */}
        {projection.months.map((m, i) => (
          <text key={m} x={xs[i]} y={h - 12} fontSize="11" textAnchor="middle" fill="var(--muted-foreground)" fontWeight="600">
            M{m}
          </text>
        ))}

        {/* Lines */}
        <motion.path d={path(projection.current)} fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeDasharray="4 4"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} />
        <motion.path d={path(projection.conservative)} fill="none" stroke="var(--emma-blue)" strokeWidth="3"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: 0.2 }} />
        <motion.path d={path(projection.aggressive)} fill="none" stroke="var(--emma-pink)" strokeWidth="3"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, delay: 0.4 }} />

        {/* Dots + values for aggressive */}
        {projection.aggressive.map((v, i) => (
          <g key={i}>
            <circle cx={xs[i]} cy={yScale(v)} r="4" fill="var(--emma-pink)" />
            <text x={xs[i]} y={yScale(v) - 10} fontSize="10" textAnchor="middle" fill="var(--foreground)" fontWeight="700">
              ${(v / 1000).toFixed(1)}k
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs">
        <Legend color="var(--muted-foreground)" dashed>Current</Legend>
        <Legend color="var(--emma-blue)">Conservative</Legend>
        <Legend color="var(--emma-pink)">Aggressive (with EmmaForYou)</Legend>
      </div>
    </div>
  );
}

function Legend({ color, dashed, children }: { color: string; dashed?: boolean; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-medium text-muted-foreground">
      <span className="inline-block h-0.5 w-6" style={{ background: color, borderTop: dashed ? `2px dashed ${color}` : undefined, backgroundColor: dashed ? "transparent" : color }} />
      {children}
    </span>
  );
}
