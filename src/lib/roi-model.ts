/**
 * Transparent ROI model. Every number comes from either:
 *   - the visitor's own business inputs,
 *   - an assumption shown on screen with its default value (and editable), or
 *   - the investment the visitor chooses.
 * No hidden multipliers. Outputs are estimates, not guarantees.
 */

export interface RoiInputs {
  /** Enquiries/leads per month (calls, DMs, WhatsApp, forms). */
  monthlyEnquiries: number;
  /** % of enquiries that currently get no reply, or a slow one (> 1 hour). */
  missedPercent: number;
  /** % of answered enquiries that become paying customers today. */
  closeRatePercent: number;
  /** Average revenue from one new customer (first purchase or first 12 months — the visitor decides). */
  customerValue: number;
}

export interface RoiAssumptions {
  /** Share of missed/slow enquiries that instant replies win back. */
  recoveredPercent: number;
  /** Relative lift in close rate from automated follow-up and reminders. */
  closeLiftPercent: number;
  /** Extra enquiries per month from a better website, SEO and campaigns. */
  extraEnquiriesPercent: number;
  /** Months for the full effect to kick in (results ramp up linearly). */
  rampMonths: number;
}

export interface RoiCosts {
  monthlyFee: number;
  setupFee: number;
  months: number;
}

export const DEFAULT_ASSUMPTIONS: RoiAssumptions = {
  recoveredPercent: 50,
  closeLiftPercent: 15,
  extraEnquiriesPercent: 20,
  rampMonths: 3,
};

export const ASSUMPTION_NOTES: Record<keyof RoiAssumptions, string> = {
  recoveredPercent: "Of the enquiries you currently miss or answer late, how many an instant reply would win back.",
  closeLiftPercent: "Relative improvement in your close rate from automatic follow-ups, reminders and quicker answers.",
  extraEnquiriesPercent: "Additional enquiries each month from a better website, search visibility and campaigns.",
  rampMonths: "Systems take time to build and tune, so results grow gradually over these months.",
};

export interface RoiMonth {
  month: number;
  baselineRevenue: number;
  projectedRevenue: number;
  extraRevenue: number;
  cost: number;
  cumulativeNet: number;
}

export interface RoiResult {
  baselineCustomers: number;
  projectedCustomers: number;
  extraCustomersPerMonth: number;
  extraRevenuePerMonth: number;
  totalExtraRevenue: number;
  totalCost: number;
  netReturn: number;
  roiMultiple: number;
  paybackMonth: number | null;
  months: RoiMonth[];
  breakdown: { recoveredEnquiries: number; newEnquiries: number; liftedCloseRate: number };
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : 0));

export function calculateRoi(input: RoiInputs, a: RoiAssumptions, c: RoiCosts): RoiResult {
  const enquiries = clamp(input.monthlyEnquiries, 0, 1_000_000);
  const missed = clamp(input.missedPercent, 0, 100) / 100;
  const close = clamp(input.closeRatePercent, 0, 100) / 100;
  const value = clamp(input.customerValue, 0, 1e12);

  // Today: only answered enquiries can convert.
  const answered = enquiries * (1 - missed);
  const baselineCustomers = answered * close;

  // With EmmaForYou at full effect:
  const recoveredEnquiries = enquiries * missed * (clamp(a.recoveredPercent, 0, 100) / 100);
  const newEnquiries = enquiries * (clamp(a.extraEnquiriesPercent, 0, 500) / 100);
  const liftedCloseRate = Math.min(1, close * (1 + clamp(a.closeLiftPercent, 0, 300) / 100));
  const projectedCustomers = (answered + recoveredEnquiries + newEnquiries) * liftedCloseRate;
  const extraCustomersPerMonth = Math.max(0, projectedCustomers - baselineCustomers);
  const extraRevenuePerMonth = extraCustomersPerMonth * value;

  const months: RoiMonth[] = [];
  const ramp = Math.max(1, Math.round(clamp(a.rampMonths, 1, 12)));
  const span = Math.max(1, Math.round(clamp(c.months, 1, 36)));
  let cumulativeNet = 0;
  let totalExtraRevenue = 0;
  let totalCost = 0;
  let paybackMonth: number | null = null;
  for (let m = 1; m <= span; m++) {
    const effect = Math.min(1, m / ramp);
    const extra = extraRevenuePerMonth * effect;
    const cost = clamp(c.monthlyFee, 0, 1e12) + (m === 1 ? clamp(c.setupFee, 0, 1e12) : 0);
    totalExtraRevenue += extra;
    totalCost += cost;
    cumulativeNet += extra - cost;
    if (paybackMonth === null && cumulativeNet >= 0 && extra > 0) paybackMonth = m;
    months.push({ month: m, baselineRevenue: baselineCustomers * value, projectedRevenue: baselineCustomers * value + extra, extraRevenue: extra, cost, cumulativeNet });
  }

  return {
    baselineCustomers,
    projectedCustomers,
    extraCustomersPerMonth,
    extraRevenuePerMonth,
    totalExtraRevenue,
    totalCost,
    netReturn: totalExtraRevenue - totalCost,
    roiMultiple: totalCost > 0 ? totalExtraRevenue / totalCost : 0,
    paybackMonth,
    months,
    breakdown: { recoveredEnquiries, newEnquiries, liftedCloseRate },
  };
}

export const CURRENCIES = [
  { code: "NGN", symbol: "₦", locale: "en-NG" },
  { code: "USD", symbol: "$", locale: "en-US" },
  { code: "GBP", symbol: "£", locale: "en-GB" },
  { code: "EUR", symbol: "€", locale: "de-DE" },
] as const;
export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export function money(n: number, code: CurrencyCode): string {
  const c = CURRENCIES.find((x) => x.code === code) ?? CURRENCIES[1];
  try {
    return new Intl.NumberFormat(c.locale, { style: "currency", currency: c.code, maximumFractionDigits: 0 }).format(Math.round(n));
  } catch {
    return `${c.symbol}${Math.round(n).toLocaleString()}`;
  }
}

/** Sensible starting values per currency so the first screen is believable. */
export const CURRENCY_DEFAULTS: Record<CurrencyCode, { customerValue: number; monthlyFee: number; setupFee: number }> = {
  NGN: { customerValue: 45000, monthlyFee: 250000, setupFee: 0 },
  USD: { customerValue: 250, monthlyFee: 299, setupFee: 0 },
  GBP: { customerValue: 200, monthlyFee: 249, setupFee: 0 },
  EUR: { customerValue: 230, monthlyFee: 279, setupFee: 0 },
};
