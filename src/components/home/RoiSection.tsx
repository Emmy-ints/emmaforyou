import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { calculateRoi, nicheMultipliers, budgetBoosts } from "@/lib/roi-engine";

const NICHES = Object.keys(nicheMultipliers).filter((k) => k !== "default");
const BUDGETS = Object.keys(budgetBoosts) as (keyof typeof budgetBoosts)[];

function fmt(n: number) {
  return n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${Math.round(n)}`;
}

export default function RoiSection() {
  const [niche, setNiche] = useState("Fashion");
  const [revenue, setRevenue] = useState(10000);
  const [budget, setBudget] = useState<keyof typeof budgetBoosts>("$299/mo");

  const result = useMemo(
    () =>
      calculateRoi({
        niche,
        currentRevenue: revenue,
        currentAdSpend: Math.round(revenue * 0.05),
        currentLeads: 40,
        conversionRate: 2,
        avgOrderValue: 120,
        budget,
        timeline: 6,
      }),
    [niche, revenue, budget]
  );

  return (
    <section id="roi" className="section-padding bg-muted/30">
      <div className="mx-auto max-w-6xl px-5">
        <div className="text-center">
          <span className="inline-block rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground">
            ROI Calculator
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold md:text-5xl">
            See your <span className="gradient-text">6-month growth</span> in 30 seconds
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
            Three quick inputs. Instant projection — backed by data from 1,200+ businesses.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {/* Inputs */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your niche
                </label>
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="block w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                >
                  {NICHES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Current monthly revenue
                  </label>
                  <span className="font-mono text-sm font-bold">${revenue.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={200000}
                  step={500}
                  value={revenue}
                  onChange={(e) => setRevenue(parseInt(e.target.value, 10))}
                  className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Investment plan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {BUDGETS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBudget(b)}
                      className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                        budget === b
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background hover:border-foreground/40"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <motion.div
            key={`${niche}-${revenue}-${budget}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-1"
            style={{ background: "var(--gradient-brand)" }}
          >
            <div className="rounded-[22px] bg-card p-6 md:p-8">
              <div className="grid gap-3 sm:grid-cols-2">
                <Stat label="Projected revenue / mo" value={fmt(result.projectedRevenue)} />
                <Stat label="Additional revenue (6 mo)" value={fmt(result.additionalRevenue)} highlight />
                <Stat label="ROI multiplier" value={`${result.roi}x`} />
                <Stat label="Break-even" value={`${result.breakEvenDays} days`} />
              </div>
              <p className="mt-5 text-xs text-muted-foreground">
                Conservative estimate based on real outcomes from {NICHES.length}+ niches.
              </p>
              <Link
                to="/roi-calculator"
                className="btn-primary-gradient mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white"
              >
                Get my full ROI report →
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-2xl p-4 ${highlight ? "text-white" : "bg-muted/50"}`}
      style={highlight ? { background: "var(--gradient-hero-cta)" } : undefined}
    >
      <p className={`text-[10px] font-semibold uppercase tracking-wider ${highlight ? "text-white/80" : "text-muted-foreground"}`}>
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-extrabold">{value}</p>
    </div>
  );
}
