/**
 * Profitability maths for one period (pure functions, used in the browser and on the server).
 * Every figure is the user's own input; nothing is estimated unless the user types an estimate.
 *
 * Definitions (per period):
 *   Gross revenue        = orders × average order value (or the revenue entered)
 *   Net revenue          = gross revenue − discounts − refunds
 *   Cost of goods (COGS) = orders × (product cost + packaging per order)
 *   Gross profit         = net revenue − COGS                       Gross margin  = gross profit ÷ net revenue
 *   Variable costs       = shipping & fulfilment + payment fees + platform/marketplace fees + duties
 *   Contribution profit  = gross profit − variable costs − advertising   Contribution margin = ÷ net revenue
 *   Net profit (est.)    = contribution profit − fixed operating costs − other costs
 *   CAC                  = advertising ÷ new customers (when new customers are known)
 *   ROAS                 = attributed revenue ÷ advertising (when attributed revenue is known)
 *   Break-even orders    = fixed costs ÷ contribution per order (when contribution per order > 0)
 * Taxes collected for the government (VAT/sales tax) are excluded from revenue, so they aren't counted twice.
 */
export interface ProfitInput {
  currency: string;
  periodLabel: string;
  orders: number;
  averageOrderValue: number;      // excluding sales tax/VAT
  revenueOverride?: number | null; // if the user knows revenue directly
  discounts: number;
  refunds: number;
  productCostPerOrder: number;
  packagingPerOrder: number;
  shippingPerOrder: number;
  paymentFeePct: number;           // e.g. 2.9
  paymentFeeFixed: number;         // per order, e.g. 0.30
  platformFeePct: number;          // marketplace/platform commission on net revenue
  platformFixedMonthly: number;    // subscription etc. (treated as fixed)
  dutiesPerOrder: number;
  advertising: number;
  attributedRevenue?: number | null;
  newCustomers?: number | null;
  fixedCosts: number;              // rent, staff, software, etc.
  otherCosts: number;
}

export const emptyProfit = (currency = "USD"): ProfitInput => ({
  currency, periodLabel: "Last 30 days", orders: 0, averageOrderValue: 0, revenueOverride: null, discounts: 0, refunds: 0,
  productCostPerOrder: 0, packagingPerOrder: 0, shippingPerOrder: 0, paymentFeePct: 0, paymentFeeFixed: 0, platformFeePct: 0,
  platformFixedMonthly: 0, dutiesPerOrder: 0, advertising: 0, attributedRevenue: null, newCustomers: null, fixedCosts: 0, otherCosts: 0,
});

export interface ProfitResult {
  grossRevenue: number; netRevenue: number; cogs: number; grossProfit: number; grossMargin: number | null;
  paymentFees: number; platformFees: number; shipping: number; duties: number; variableCosts: number;
  contributionProfit: number; contributionMargin: number | null; contributionPerOrder: number | null;
  fixedTotal: number; netProfit: number; netMargin: number | null;
  cac: number | null; roas: number | null; breakEvenOrders: number | null; breakEvenRevenue: number | null;
  warnings: string[]; missing: string[];
}

const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const pct = (a: number, b: number) => (b > 0 ? a / b : null);

export function calculateProfit(i: ProfitInput): ProfitResult {
  const orders = Math.max(0, n(i.orders));
  const grossRevenue = i.revenueOverride != null && n(i.revenueOverride) > 0 ? n(i.revenueOverride) : orders * n(i.averageOrderValue);
  const netRevenue = grossRevenue - n(i.discounts) - n(i.refunds);
  const cogs = orders * (n(i.productCostPerOrder) + n(i.packagingPerOrder));
  const grossProfit = netRevenue - cogs;
  const paymentFees = netRevenue * (n(i.paymentFeePct) / 100) + orders * n(i.paymentFeeFixed);
  const platformFees = netRevenue * (n(i.platformFeePct) / 100);
  const shipping = orders * n(i.shippingPerOrder);
  const duties = orders * n(i.dutiesPerOrder);
  const variableCosts = paymentFees + platformFees + shipping + duties;
  const contributionProfit = grossProfit - variableCosts - n(i.advertising);
  const contributionPerOrder = orders > 0 ? contributionProfit / orders : null;
  const fixedTotal = n(i.fixedCosts) + n(i.platformFixedMonthly) + n(i.otherCosts);
  const netProfit = contributionProfit - fixedTotal;
  // Break-even uses contribution before advertising is spread per order, so ads are part of the per-order cost.
  const breakEvenOrders = contributionPerOrder != null && contributionPerOrder > 0 ? Math.ceil(fixedTotal / contributionPerOrder) : null;
  const aov = orders > 0 ? netRevenue / orders : null;
  const warnings: string[] = [];
  const missing: string[] = [];
  if (orders === 0) missing.push("Number of orders");
  if (grossRevenue === 0) missing.push("Average order value or revenue");
  if (orders > 0 && n(i.productCostPerOrder) === 0) missing.push("Product cost per order (cost of goods)");
  if (orders > 0 && n(i.shippingPerOrder) === 0) warnings.push("Shipping cost is 0. If you pay for shipping or fulfilment, add it, or profit will be overstated.");
  if (orders > 0 && n(i.paymentFeePct) === 0 && n(i.paymentFeeFixed) === 0) warnings.push("Payment fees are 0. Most payment providers charge a percentage and/or a fixed fee per order.");
  if (netRevenue < 0) warnings.push("Discounts and refunds are larger than revenue for this period.");
  if (contributionPerOrder != null && contributionPerOrder <= 0) warnings.push("Each order loses money before fixed costs, so selling more would increase losses. Fix price, product cost, shipping or advertising first.");
  return {
    grossRevenue, netRevenue, cogs, grossProfit, grossMargin: pct(grossProfit, netRevenue),
    paymentFees, platformFees, shipping, duties, variableCosts,
    contributionProfit, contributionMargin: pct(contributionProfit, netRevenue), contributionPerOrder,
    fixedTotal, netProfit, netMargin: pct(netProfit, netRevenue),
    cac: i.newCustomers != null && n(i.newCustomers) > 0 ? n(i.advertising) / n(i.newCustomers) : null,
    roas: i.attributedRevenue != null && n(i.advertising) > 0 ? n(i.attributedRevenue) / n(i.advertising) : null,
    breakEvenOrders, breakEvenRevenue: breakEvenOrders != null && aov != null ? breakEvenOrders * aov : null,
    warnings, missing,
  };
}

/** Unit economics for one product (used in product research and the launch guide). */
export interface UnitInput { price: number; productCost: number; shipping: number; feesPct: number; feesFixed: number; adCostPerSale: number; returnRatePct: number }
export function unitEconomics(u: UnitInput) {
  const fees = u.price * (n(u.feesPct) / 100) + n(u.feesFixed);
  const returnsCost = u.price * (n(u.returnRatePct) / 100);
  const beforeAds = u.price - n(u.productCost) - n(u.shipping) - fees - returnsCost;
  const profit = beforeAds - n(u.adCostPerSale);
  return {
    fees, returnsCost, contributionBeforeAds: beforeAds, profitPerSale: profit,
    marginPct: u.price > 0 ? (profit / u.price) * 100 : null,
    maxAffordableAdCost: beforeAds, // the most you can pay to win one sale and still break even
  };
}

export function money(v: number | null | undefined, currency: string): string {
  if (v == null || !Number.isFinite(v)) return "—";
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: Math.abs(v) >= 1000 ? 0 : 2 }).format(v); }
  catch { return `${currency} ${v.toFixed(2)}`; }
}
export const percent = (v: number | null | undefined, digits = 1) => (v == null || !Number.isFinite(v) ? "—" : `${(v * 100).toFixed(digits)}%`);
