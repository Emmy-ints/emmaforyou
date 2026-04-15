import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1";

const BUSINESS_TYPES = [
  "Fashion Store","Shoe Store","Beauty Store","Gadgets Store","Furniture Store","Restaurant",
  "Clinic","Salon","Spa","Gym","Barbershop","Bakery","Pharmacy","Laundry","Nail Studio",
  "Real Estate Agent","Property Developer","Short-Let Apartments","Car Dealer","Car Rental",
  "Mechanic","Coach","Consultant","Lawyer","Fitness Trainer","Photographer","Event Planner",
  "School","SaaS Company","Logistics","Influencer","Course Creator","Hotel","Church/Ministry",
  "Ecommerce Store","Phone Accessories","Perfume Store","Food Business","Printing Service",
];

const CHALLENGES = [
  "Getting leads","Converting leads","Building trust","Retaining customers",
  "Online visibility","Managing social media","Automating follow-ups","Scaling revenue",
];

const PRESENCE = ["Website","Instagram","Facebook","TikTok","Google My Business","Email List","None"];

const BUDGETS_NGN = ["Under ₦50k","₦50k–₦200k","₦200k–₦500k","₦500k+"];
const TIMELINES = ["30 days","60 days","90 days","6 months"];

const SERVICES_MAP: Record<string, { name: string; why: string }[]> = {
  "Getting leads": [
    { name: "Google Ads", why: "Target customers actively searching for your service" },
    { name: "Website Design", why: "Convert visitors into leads with optimized landing pages" },
    { name: "Facebook Ads", why: "Reach new audiences with precise targeting" },
  ],
  "Converting leads": [
    { name: "AI Automation", why: "Instant follow-ups convert 3x more leads" },
    { name: "Email Marketing", why: "Nurture leads with automated sequences" },
    { name: "Website Design", why: "Build trust with professional online presence" },
  ],
  "Online visibility": [
    { name: "Social Media Management", why: "Consistent content builds brand awareness" },
    { name: "Google My Business", why: "Appear in local search results" },
    { name: "Website Design", why: "SEO-optimized site for organic traffic" },
  ],
  default: [
    { name: "AI Automation", why: "Save time and never miss a lead" },
    { name: "Website Design", why: "Professional online presence" },
    { name: "Social Media", why: "Grow your audience consistently" },
  ],
};

export const Route = createFileRoute("/analyser")({
  component: AnalyserPage,
  head: () => ({
    meta: [
      { title: "Free Business Analyser — EmmaForYou" },
      { name: "description", content: "Get a free analysis of your business digital health. Discover what services you need to grow faster." },
      { property: "og:title", content: "Free Business Analyser — EmmaForYou" },
      { property: "og:description", content: "Find out your business health score and get personalized growth recommendations." },
    ],
  }),
});

function AnalyserPage() {
  const [step, setStep] = useState(1);
  const [bizType, setBizType] = useState("");
  const [presence, setPresence] = useState<string[]>([]);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [showResults, setShowResults] = useState(false);

  const toggleArray = (arr: string[], item: string, setter: (a: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]);
  };

  const healthScore = Math.min(100, Math.max(15,
    100 - (challenges.length * 12) + (presence.length * 8) - (presence.includes("None") ? 30 : 0)
  ));

  const topServices = challenges.length > 0
    ? (SERVICES_MAP[challenges[0]] || SERVICES_MAP.default)
    : SERVICES_MAP.default;

  const canNext = () => {
    if (step === 1) return !!bizType;
    if (step === 2) return presence.length > 0;
    if (step === 3) return challenges.length > 0;
    if (step === 4) return !!budget;
    if (step === 5) return !!timeline;
    return true;
  };

  const next = () => {
    if (step < 5) setStep(step + 1);
    else setShowResults(true);
  };

  return (
    <>
      <Navbar />
      <main>
        <section className="flex min-h-[40vh] items-center justify-center pt-20" style={{ background: "var(--gradient-dark)" }}>
          <div className="mx-auto max-w-3xl px-5 py-16 text-center">
            <h1 className="font-display text-4xl font-extrabold text-white md:text-5xl">
              Free Business <span className="gradient-text-gold">Analyser</span>
            </h1>
            <p className="mt-4 text-base text-white/60">
              Answer 5 quick questions and get a personalized growth roadmap.
            </p>
          </div>
        </section>

        <section className="section-padding">
          <div className="mx-auto max-w-2xl">
            {!showResults ? (
              <div className="gradient-border rounded-3xl p-8">
                {/* Progress */}
                <div className="mb-6 flex gap-1.5">
                  {[1,2,3,4,5].map(s => (
                    <div key={s} className="h-1.5 flex-1 rounded-full" style={{
                      background: s <= step ? "var(--gradient-brand)" : "var(--muted)"
                    }} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mb-4">Step {step} of 5</p>

                {step === 1 && (
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">What type of business do you have?</h3>
                    <select
                      value={bizType}
                      onChange={e => setBizType(e.target.value)}
                      className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-emma-blue focus:outline-none"
                    >
                      <option value="">Select your business type</option>
                      {BUSINESS_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">What's your current online presence?</h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {PRESENCE.map(p => (
                        <button key={p} onClick={() => toggleArray(presence, p, setPresence)}
                          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${presence.includes(p) ? "btn-primary-gradient text-white" : "bg-muted text-muted-foreground"}`}
                        >{p}</button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">What are your biggest challenges?</h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {CHALLENGES.map(c => (
                        <button key={c} onClick={() => toggleArray(challenges, c, setChallenges)}
                          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${challenges.includes(c) ? "btn-primary-gradient text-white" : "bg-muted text-muted-foreground"}`}
                        >{c}</button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">What's your budget for growth?</h3>
                    <div className="mt-4 flex flex-col gap-2">
                      {BUDGETS_NGN.map(b => (
                        <button key={b} onClick={() => setBudget(b)}
                          className={`rounded-xl px-4 py-3 text-sm font-medium text-left transition-all ${budget === b ? "btn-primary-gradient text-white" : "bg-muted text-muted-foreground"}`}
                        >{b}</button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">What's your goal timeline?</h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {TIMELINES.map(t => (
                        <button key={t} onClick={() => setTimeline(t)}
                          className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all ${timeline === t ? "btn-primary-gradient text-white" : "bg-muted text-muted-foreground"}`}
                        >{t}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-8 flex gap-3">
                  {step > 1 && (
                    <button onClick={() => setStep(step - 1)} className="btn-ghost rounded-full px-6 py-2.5 text-sm">
                      ← Back
                    </button>
                  )}
                  <button
                    onClick={next}
                    disabled={!canNext()}
                    className="btn-gold rounded-full px-6 py-2.5 text-sm disabled:opacity-50"
                  >
                    {step === 5 ? "Get My Results →" : "Next →"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Health Score */}
                <div className="gradient-border rounded-3xl p-8 text-center">
                  <h3 className="font-display text-lg font-bold text-muted-foreground">Your Business Health Score</h3>
                  <div className="relative mx-auto mt-4 flex h-40 w-40 items-center justify-center">
                    <svg className="absolute inset-0" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="var(--muted)" strokeWidth="6" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke="url(#scoreGrad)" strokeWidth="6"
                        strokeDasharray={`${healthScore * 2.64} 264`} strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                      <defs>
                        <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="var(--emma-blue)" />
                          <stop offset="100%" stopColor="var(--emma-pink)" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="font-display text-4xl font-extrabold text-foreground">{healthScore}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {healthScore >= 70 ? "Good foundation — let's optimize!" : healthScore >= 40 ? "Room for improvement — we can help!" : "Critical — your business needs a digital system now."}
                  </p>
                </div>

                {/* Top Services */}
                <div className="gradient-border rounded-3xl p-8">
                  <h3 className="font-display text-lg font-bold text-foreground">Top 3 Recommended Services</h3>
                  <div className="mt-4 space-y-3">
                    {topServices.map((s, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-xl bg-muted p-4">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: "var(--gradient-brand)" }}>
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-display text-sm font-bold text-foreground">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.why}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Growth Roadmap */}
                <div className="gradient-border rounded-3xl p-8">
                  <h3 className="font-display text-lg font-bold text-foreground">Your Growth Roadmap</h3>
                  <div className="mt-4 space-y-4">
                    {["Phase 1: Foundation (Week 1-2)", "Phase 2: Growth (Week 3-6)", "Phase 3: Scale (Week 7+)"].map((phase, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: "var(--gradient-brand)" }} />
                        <div>
                          <p className="font-display text-sm font-bold text-foreground">{phase}</p>
                          <p className="text-xs text-muted-foreground">
                            {i === 0 && "Set up your digital infrastructure — website, social profiles, and lead capture systems."}
                            {i === 1 && "Launch marketing campaigns, automate follow-ups, and start generating consistent leads."}
                            {i === 2 && "Optimize based on data, scale winning campaigns, and expand to new channels."}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="rounded-3xl p-8 text-center" style={{ background: "var(--gradient-gold)" }}>
                  <h3 className="font-display text-2xl font-extrabold text-emma-charcoal">Let's Build This Together</h3>
                  <p className="mt-2 text-sm text-emma-charcoal/70">
                    Your {bizType} business is ready for growth. Let's make it happen.
                  </p>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white"
                    style={{ background: "var(--gradient-dark)" }}
                  >
                    Chat on WhatsApp →
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
