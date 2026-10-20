import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calculator, CheckCircle2, ChevronDown, Info, Loader2, RotateCcw, SlidersHorizontal, Wallet } from "lucide-react";
import {
  ASSUMPTION_NOTES,
  CURRENCIES,
  CURRENCY_DEFAULTS,
  DEFAULT_ASSUMPTIONS,
  calculateRoi,
  money,
  type CurrencyCode,
  type RoiAssumptions,
} from "@/lib/roi-model";
import { submitRoi, buildWa } from "@/lib/leads";

const INDUSTRIES = ["Salon & beauty", "Restaurant", "Real estate", "Clinic", "Fashion", "Ecommerce", "Coach / consultant", "Gym & fitness", "Hotel", "Other"];
const TIMELINES = [6, 12] as const;

const ASSUMPTION_FIELDS: { key: keyof RoiAssumptions; label: string; suffix: string; min: number; max: number; step: number }[] = [
  { key: "recoveredPercent", label: "Missed enquiries won back", suffix: "%", min: 0, max: 100, step: 5 },
  { key: "closeLiftPercent", label: "Close-rate improvement", suffix: "%", min: 0, max: 100, step: 5 },
  { key: "extraEnquiriesPercent", label: "New enquiries from marketing", suffix: "%", min: 0, max: 200, step: 5 },
  { key: "rampMonths", label: "Months to full effect", suffix: "mo", min: 1, max: 6, step: 1 },
];

export default function RoiCalculator({ compact = false }: { compact?: boolean }) {
  const [currency, setCurrency] = useState<CurrencyCode>("NGN");
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [enquiries, setEnquiries] = useState(80);
  const [missed, setMissed] = useState(35);
  const [closeRate, setCloseRate] = useState(20);
  const [customerValue, setCustomerValue] = useState(CURRENCY_DEFAULTS.NGN.customerValue);
  const [assumptions, setAssumptions] = useState<RoiAssumptions>(DEFAULT_ASSUMPTIONS);
  const [monthlyFee, setMonthlyFee] = useState(CURRENCY_DEFAULTS.NGN.monthlyFee);
  const [setupFee, setSetupFee] = useState(CURRENCY_DEFAULTS.NGN.setupFee);
  const [months, setMonths] = useState<(typeof TIMELINES)[number]>(12);
  const [showMath, setShowMath] = useState(false);

  const result = useMemo(
    () => calculateRoi({ monthlyEnquiries: enquiries, missedPercent: missed, closeRatePercent: closeRate, customerValue }, assumptions, { monthlyFee, setupFee, months }),
    [enquiries, missed, closeRate, customerValue, assumptions, monthlyFee, setupFee, months],
  );
  const m = (n: number) => money(n, currency);
  const assumptionsChanged = JSON.stringify(assumptions) !== JSON.stringify(DEFAULT_ASSUMPTIONS);
  const maxAbs = Math.max(1, ...result.months.map((x) => Math.abs(x.cumulativeNet)));

  function switchCurrency(code: CurrencyCode) {
    setCurrency(code);
    setCustomerValue(CURRENCY_DEFAULTS[code].customerValue);
    setMonthlyFee(CURRENCY_DEFAULTS[code].monthlyFee);
    setSetupFee(CURRENCY_DEFAULTS[code].setupFee);
  }

  return (
    <div className="roi">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
        {/* ---------------- Inputs ---------------- */}
        <div className="space-y-5">
          <Panel icon={<Calculator />} title="Your business" note="Your own numbers. Rough estimates are fine.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Industry">
                <select aria-label="Industry" className="roi-input" value={industry} onChange={(e) => setIndustry(e.target.value)}>
                  {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
                </select>
              </Field>
              <Field label="Currency">
                <div className="roi-seg" role="group" aria-label="Currency">
                  {CURRENCIES.map((c) => (
                    <button key={c.code} type="button" aria-pressed={currency === c.code} onClick={() => switchCurrency(c.code)}>{c.code}</button>
                  ))}
                </div>
              </Field>
              <NumberField label="Enquiries per month" hint="Calls, DMs, WhatsApp and form messages" value={enquiries} onChange={setEnquiries} min={0} />
              <NumberField label="Enquiries missed or answered late" hint="No reply, or a reply after an hour" value={missed} onChange={setMissed} min={0} max={100} suffix="%" />
              <NumberField label="Close rate today" hint="Answered enquiries that become customers" value={closeRate} onChange={setCloseRate} min={0} max={100} suffix="%" />
              <NumberField label="Value of one new customer" hint="First sale, or a year of repeat visits" value={customerValue} onChange={setCustomerValue} min={0} prefix={CURRENCIES.find((c) => c.code === currency)?.symbol} />
            </div>
          </Panel>

          <Panel
            icon={<SlidersHorizontal />}
            title="Assumptions"
            note="Conservative starting points. Change any of them — the results update instantly."
            action={assumptionsChanged ? (
              <button type="button" onClick={() => setAssumptions(DEFAULT_ASSUMPTIONS)} className="roi-link"><RotateCcw className="h-3.5 w-3.5" /> Reset</button>
            ) : null}
          >
            <div className="space-y-4">
              {ASSUMPTION_FIELDS.map((f) => (
                <div key={f.key}>
                  <div className="flex items-baseline justify-between gap-3">
                    <label htmlFor={`roi-${f.key}`} className="text-sm font-medium">{f.label}</label>
                    <span className="roi-pill tabular-nums">{assumptions[f.key]}{f.suffix === "%" ? "%" : ` ${f.suffix}`}</span>
                  </div>
                  <input
                    id={`roi-${f.key}`}
                    type="range"
                    className="roi-range"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={assumptions[f.key]}
                    onChange={(e) => setAssumptions((a) => ({ ...a, [f.key]: Number(e.target.value) }))}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">{ASSUMPTION_NOTES[f.key]}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel icon={<Wallet />} title="Your investment" note="Edit to match the plan or quote you're considering.">
            <div className="grid gap-4 sm:grid-cols-3">
              <NumberField label="Monthly fee" value={monthlyFee} onChange={setMonthlyFee} min={0} prefix={CURRENCIES.find((c) => c.code === currency)?.symbol} />
              <NumberField label="One-time setup" hint="If any" value={setupFee} onChange={setSetupFee} min={0} prefix={CURRENCIES.find((c) => c.code === currency)?.symbol} />
              <Field label="Period">
                <div className="roi-seg" role="group" aria-label="Period">
                  {TIMELINES.map((t) => (
                    <button key={t} type="button" aria-pressed={months === t} onClick={() => setMonths(t)}>{t} months</button>
                  ))}
                </div>
              </Field>
            </div>
          </Panel>
        </div>

        {/* ---------------- Results ---------------- */}
        <div className="roi-results lg:sticky lg:top-24">
          <p className="text-sm text-[#a6abd0]">Estimated extra revenue per month at full effect</p>
          <motion.p key={Math.round(result.extraRevenuePerMonth)} initial={{ opacity: 0.4, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="roi-hero tabular-nums">
            {m(result.extraRevenuePerMonth)}
          </motion.p>
          <p className="text-sm text-[#a6abd0]">
            ≈ {result.extraCustomersPerMonth.toFixed(1)} more customers a month ({result.baselineCustomers.toFixed(1)} → {result.projectedCustomers.toFixed(1)})
          </p>

          <dl className="roi-grid">
            <Stat label={`Extra revenue · ${months} mo`} value={m(result.totalExtraRevenue)} tone="return" />
            <Stat label={`Total cost · ${months} mo`} value={m(result.totalCost)} tone="cost" />
            <Stat label="Net return" value={m(result.netReturn)} tone={result.netReturn >= 0 ? "return" : "cost"} />
            <Stat label="Return on spend" value={result.totalCost > 0 ? `${result.roiMultiple.toFixed(1)}×` : "—"} />
            <Stat label="Pays for itself" value={result.paybackMonth ? `Month ${result.paybackMonth}` : `Not within ${months} mo`} />
            <Stat label="Industry" value={industry} />
          </dl>

          <div className="mt-6">
            <p className="text-xs text-[#a6abd0]">Cumulative net return by month (extra revenue minus cost)</p>
            <div className="roi-bars" role="img" aria-label={`Cumulative net return reaches ${m(result.netReturn)} after ${months} months`}>
              {result.months.map((x) => (
                <div key={x.month} className="roi-bar-col" title={`Month ${x.month}: ${m(x.cumulativeNet)}`}>
                  <div className="roi-bar-track">
                    <div
                      className={`roi-bar ${x.cumulativeNet >= 0 ? "is-pos" : "is-neg"}`}
                      style={{ height: `${(Math.abs(x.cumulativeNet) / maxAbs) * 50}%`, [x.cumulativeNet >= 0 ? "bottom" : "top"]: "50%" } as React.CSSProperties}
                    />
                  </div>
                  <span>{x.month}</span>
                </div>
              ))}
            </div>
          </div>

          <button type="button" onClick={() => setShowMath((s) => !s)} className="roi-math-toggle" aria-expanded={showMath}>
            <Info className="h-4 w-4" /> How this is calculated
            <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${showMath ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {showMath && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <ol className="roi-math">
                  <li>Answered today: {enquiries} × (1 − {missed}%) = {(enquiries * (1 - missed / 100)).toFixed(1)} enquiries</li>
                  <li>Won back by instant replies: {enquiries} × {missed}% × {assumptions.recoveredPercent}% = {result.breakdown.recoveredEnquiries.toFixed(1)}</li>
                  <li>New from marketing: {enquiries} × {assumptions.extraEnquiriesPercent}% = {result.breakdown.newEnquiries.toFixed(1)}</li>
                  <li>Close rate: {closeRate}% × (1 + {assumptions.closeLiftPercent}%) = {(result.breakdown.liftedCloseRate * 100).toFixed(1)}%</li>
                  <li>Extra customers × {m(customerValue)} = {m(result.extraRevenuePerMonth)} a month at full effect, ramping up over {assumptions.rampMonths} month{assumptions.rampMonths === 1 ? "" : "s"}</li>
                </ol>
                <p className="mt-2 text-xs text-[#8f94bf]">An estimate from your inputs and the assumptions above — not a guarantee. Real results depend on your market, offer and how quickly enquiries are handled.</p>
              </motion.div>
            )}
          </AnimatePresence>

          {!compact && <RoiLeadForm result={result} industry={industry} currency={currency} months={months} monthlyFee={monthlyFee} enquiries={enquiries} closeRate={closeRate} customerValue={customerValue} />}
          {compact && (
            <a href="/roi-calculator" className="btn-gold mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm">
              Get this breakdown sent to you
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function RoiLeadForm(props: { result: ReturnType<typeof calculateRoi>; industry: string; currency: CurrencyCode; months: number; monthlyFee: number; enquiries: number; closeRate: number; customerValue: number }) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const r = props.result;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || (!whatsapp.trim() && !email.trim())) {
      setError("Add your name and a WhatsApp number or email so we can send your plan.");
      return;
    }
    setState("sending");
    setError("");
    const res = await submitRoi({
      name: name.trim(),
      whatsapp: whatsapp.trim() || undefined,
      email: email.trim() || undefined,
      niche: props.industry,
      current_revenue: Math.round(r.baselineCustomers * props.customerValue),
      current_ad_spend: 0,
      current_leads: props.enquiries,
      conversion_rate: props.closeRate,
      avg_order_value: props.customerValue,
      budget: `${props.currency} ${props.monthlyFee}/mo`,
      timeline: props.months,
      projected_revenue: Math.round((r.baselineCustomers + r.extraCustomersPerMonth) * props.customerValue),
      additional_revenue: Math.round(r.totalExtraRevenue),
      projected_leads: Math.round(props.enquiries + r.breakdown.newEnquiries + r.breakdown.recoveredEnquiries),
      roi_multiplier: Number(r.roiMultiple.toFixed(2)),
      break_even_days: r.paybackMonth ? r.paybackMonth * 30 : 0,
    });
    if (res.ok) setState("sent");
    else {
      setState("error");
      setError("We couldn't save your request just now. Please try again, or message us on WhatsApp.");
    }
  }

  if (state === "sent") {
    return (
      <div className="roi-sent">
        <CheckCircle2 className="h-5 w-5 text-[#3dd6f5]" />
        <div>
          <p className="font-semibold text-white">Request received</p>
          <p className="mt-1 text-sm text-[#a6abd0]">Emmanuel will review your numbers and send a plan within one working day.</p>
          <a href={buildWa(`Hi! I just used the ROI calculator (${props.industry}). Estimated +${money(r.extraRevenuePerMonth, props.currency)}/month. Can we talk?`)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-sm font-semibold text-[#3dd6f5] underline underline-offset-4">
            Prefer WhatsApp? Message us now
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="roi-lead" noValidate>
      <p className="font-semibold text-white">Get a personalised growth plan</p>
      <p className="mt-1 text-sm text-[#a6abd0]">We'll check these numbers against your business and show what we'd build first.</p>
      <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
        <input className="roi-dark-input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" aria-label="Your name" />
        <input className="roi-dark-input" placeholder="WhatsApp number" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} inputMode="tel" autoComplete="tel" aria-label="WhatsApp number" />
        <input className="roi-dark-input" placeholder="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-label="Email" />
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-[#ffb4b4]">{error}</p>}
      <button type="submit" disabled={state === "sending"} className="btn-gold mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm disabled:opacity-70">
        {state === "sending" ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : "Send me my plan"}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */

function Panel({ icon, title, note, action, children }: { icon: React.ReactNode; title: string; note: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="roi-panel">
      <header className="mb-4 flex items-start gap-3">
        <span className="roi-panel-icon">{icon}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{note}</p>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label}>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

function NumberField({ label, hint, value, onChange, min, max, prefix, suffix }: { label: string; hint?: string; value: number; onChange: (n: number) => void; min?: number; max?: number; prefix?: string; suffix?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <span className="roi-input flex items-center gap-1.5 focus-within:ring-2 focus-within:ring-ring">
        {prefix && <span className="text-muted-foreground">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          className="w-full min-w-0 bg-transparent outline-none tabular-nums"
          value={Number.isFinite(value) ? value : ""}
          min={min}
          max={max}
          onChange={(e) => {
            const n = e.target.value === "" ? 0 : Number(e.target.value);
            onChange(max !== undefined ? Math.min(max, Math.max(min ?? 0, n)) : Math.max(min ?? 0, n));
          }}
        />
        {suffix && <span className="text-muted-foreground">{suffix}</span>}
      </span>
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "return" | "cost" }) {
  return (
    <div className="roi-stat">
      <dt>{label}</dt>
      <dd className={`tabular-nums ${tone === "return" ? "is-return" : tone === "cost" ? "is-cost" : ""}`}>{value}</dd>
    </div>
  );
}
