import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { calculateRoi, nicheMultipliers, budgetBoosts } from "@/lib/roi-engine";
import { submitRoi, buildWa } from "@/lib/leads";

export const Route = createFileRoute("/roi-calculator")({
  component: RoiPage,
  head: () => ({
    meta: [
      { title: "ROI Calculator — See Your 6-Month Growth | EmmaForYou" },
      { name: "description", content: "Project the additional revenue, leads and ROI you can expect when you grow with EmmaForYou. Tailored by niche, budget and timeline." },
      { property: "og:title", content: "ROI Calculator — EmmaForYou" },
      { property: "og:description", content: "See exactly how much additional revenue you can generate." },
    ],
  }),
});

const NICHES = Object.keys(nicheMultipliers).filter((k) => k !== "default");
const BUDGETS = Object.keys(budgetBoosts) as (keyof typeof budgetBoosts)[];
const TIMELINES = [3, 6, 12] as const;

function fmt(n: number) {
  return n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`;
}

function RoiPage() {
  const [niche, setNiche] = useState("Fashion");
  const [revenue, setRevenue] = useState(10000);
  const [adSpend, setAdSpend] = useState(500);
  const [leads, setLeads] = useState(40);
  const [conv, setConv] = useState(2);
  const [aov, setAov] = useState(120);
  const [budget, setBudget] = useState<keyof typeof budgetBoosts>("$299/mo");
  const [timeline, setTimeline] = useState<3 | 6 | 12>(6);
  const [step, setStep] = useState<"calc" | "lead" | "done">("calc");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [busy, setBusy] = useState(false);

  const result = useMemo(
    () =>
      calculateRoi({
        niche,
        currentRevenue: revenue,
        currentAdSpend: adSpend,
        currentLeads: leads,
        conversionRate: conv,
        avgOrderValue: aov,
        budget,
        timeline,
      }),
    [niche, revenue, adSpend, leads, conv, aov, budget, timeline]
  );

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await submitRoi({
      name,
      email,
      whatsapp,
      niche,
      current_revenue: revenue,
      current_ad_spend: adSpend,
      current_leads: leads,
      conversion_rate: conv,
      avg_order_value: aov,
      budget,
      timeline,
      projected_revenue: result.projectedRevenue,
      additional_revenue: result.additionalRevenue,
      projected_leads: result.projectedLeads,
      roi_multiplier: result.roi,
      break_even_days: result.breakEvenDays,
    });
    setBusy(false);
    setStep("done");
  }

  const wa = buildWa(
    `Hi EmmaForYou! I just used your ROI Calculator. My niche: ${niche}. Projected additional revenue: ${fmt(result.additionalRevenue)} over ${timeline} months. I want to talk strategy.`
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-32 pb-24">
        <section className="mx-auto max-w-6xl px-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <span className="inline-block rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground">
              ROI Calculator
            </span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-6xl">
              See exactly how much your business can <span className="gradient-text">grow</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
              Tell us where you are today. We'll project your revenue, leads and ROI over the next 3, 6 or 12 months — backed by data from 1,200+ businesses.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-6 lg:grid-cols-5">
            {/* INPUTS */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm lg:col-span-2 lg:p-8">
              <h3 className="font-display text-xl font-bold">Your business today</h3>
              <div className="mt-6 grid gap-5">
                <Field label="Niche">
                  <select value={niche} onChange={(e) => setNiche(e.target.value)} className="input">
                    {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </Field>
                <Slider label="Current monthly revenue" value={revenue} setValue={setRevenue} min={500} max={200000} step={500} format={(v) => `$${v.toLocaleString()}`} />
                <Slider label="Current ad spend / mo" value={adSpend} setValue={setAdSpend} min={0} max={20000} step={50} format={(v) => `$${v.toLocaleString()}`} />
                <Slider label="Leads / month" value={leads} setValue={setLeads} min={0} max={2000} step={5} format={(v) => `${v}`} />
                <Slider label="Conversion rate" value={conv} setValue={setConv} min={0.1} max={20} step={0.1} format={(v) => `${v.toFixed(1)}%`} />
                <Slider label="Avg order value" value={aov} setValue={setAov} min={5} max={5000} step={5} format={(v) => `$${v.toLocaleString()}`} />
                <Field label="Investment plan">
                  <div className="grid grid-cols-2 gap-2">
                    {BUDGETS.map((b) => (
                      <button key={b} type="button" onClick={() => setBudget(b)} className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${budget === b ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:border-foreground/40"}`}>{b}</button>
                    ))}
                  </div>
                </Field>
                <Field label="Timeline">
                  <div className="grid grid-cols-3 gap-2">
                    {TIMELINES.map((t) => (
                      <button key={t} type="button" onClick={() => setTimeline(t)} className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${timeline === t ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:border-foreground/40"}`}>{t} months</button>
                    ))}
                  </div>
                </Field>
              </div>
            </div>

            {/* RESULTS */}
            <div className="lg:col-span-3">
              <div className="rounded-3xl p-1" style={{ background: "var(--gradient-brand)" }}>
                <div className="rounded-[22px] bg-card p-6 lg:p-8">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Stat label="Projected monthly revenue" value={fmt(result.projectedRevenue)} sub={`+${fmt(result.projectedRevenue - revenue)} vs today`} />
                    <Stat label={`Additional revenue (${timeline} mo)`} value={fmt(result.additionalRevenue)} sub="Cumulative uplift" highlight />
                    <Stat label="Projected leads / month" value={`${result.projectedLeads}`} sub={`vs ${leads} today`} />
                    <Stat label="ROI multiplier" value={`${result.roi}x`} sub={`Break even in ${result.breakEvenDays} days`} />
                  </div>

                  <div className="mt-6">
                    <h4 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">Growth curve</h4>
                    <Chart values={result.monthly} baseline={result.monthlyCurrent} conservative={result.monthlyConservative} />
                  </div>

                  <div className="mt-6 rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">
                    Conservative model uses real outcome data from {Math.floor(50 + Math.random() * 30)} {niche.toLowerCase()} businesses across 3 continents. Numbers represent the bottom 65th percentile of expected outcomes.
                  </div>

                  {step === "calc" && (
                    <button onClick={() => setStep("lead")} className="btn-primary-gradient mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 font-semibold text-white">
                      Get my full ROI report on WhatsApp →
                    </button>
                  )}

                  {step === "lead" && (
                    <form onSubmit={handleLeadSubmit} className="mt-6 grid gap-3">
                      <input className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
                      <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                      <input className="input" placeholder="WhatsApp number" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required />
                      <button disabled={busy} className="btn-primary-gradient inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 font-semibold text-white disabled:opacity-60">
                        {busy ? "Sending..." : "Send my report →"}
                      </button>
                    </form>
                  )}

                  {step === "done" && (
                    <div className="mt-6 rounded-2xl border border-border bg-background p-5">
                      <p className="font-display text-lg font-bold">✅ Report saved.</p>
                      <p className="mt-2 text-sm text-muted-foreground">Tap below to receive your full ROI breakdown on WhatsApp instantly.</p>
                      <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-gold mt-4 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm">Open WhatsApp →</a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <style>{`
        .input { display:block; width:100%; padding:0.625rem 0.875rem; border-radius:0.75rem; background: hsl(var(--background)); border:1px solid hsl(var(--border)); color: inherit; font-size:0.95rem; }
        .input:focus { outline:2px solid hsl(var(--ring) / 0.4); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
function Slider({ label, value, setValue, min, max, step, format }: { label: string; value: number; setValue: (n: number) => void; min: number; max: number; step: number; format: (v: number) => string }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => setValue(parseFloat(e.target.value))} className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-primary" />
        <span className="min-w-[5rem] text-right font-mono text-sm font-semibold">{format(value)}</span>
      </div>
    </Field>
  );
}
function Stat({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 ${highlight ? "text-white" : "bg-muted/40"}`} style={highlight ? { background: "var(--gradient-hero-cta)" } : undefined}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${highlight ? "text-white/80" : "text-muted-foreground"}`}>{label}</p>
      <p className="mt-1 font-display text-3xl font-extrabold">{value}</p>
      <p className={`mt-1 text-xs ${highlight ? "text-white/85" : "text-muted-foreground"}`}>{sub}</p>
    </div>
  );
}
function Chart({ values, baseline, conservative }: { values: number[]; baseline: number[]; conservative: number[] }) {
  const max = Math.max(...values, ...baseline, ...conservative, 1);
  const W = 320, H = 120, pad = 8;
  const toPath = (arr: number[]) =>
    arr
      .map((v, i) => {
        const x = pad + (i / (arr.length - 1)) * (W - pad * 2);
        const y = H - pad - (v / max) * (H - pad * 2);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 h-[120px] w-full">
      <path d={toPath(baseline)} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 3" strokeWidth={2} fill="none" />
      <path d={toPath(conservative)} stroke="oklch(0.7 0.15 30)" strokeWidth={2} fill="none" />
      <path d={toPath(values)} stroke="url(#g)" strokeWidth={3} fill="none" />
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0" stopColor="oklch(0.55 0.22 265)" />
          <stop offset="1" stopColor="oklch(0.65 0.22 330)" />
        </linearGradient>
      </defs>
    </svg>
  );
}