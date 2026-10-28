/**
 * Royalty and cost estimates. Formulas are shown in the UI; every rate comes from the user's
 * inputs, with optional presets from KDP's help pages (checked 28 Oct 2026; see specs.ts).
 * Results are estimates, not earnings.
 */
export type Format = "ebook" | "paperback" | "direct";
export interface Scenario {
  name: string;
  format: Format;
  price: number; // list price incl. VAT where applicable
  vatPct: number; // VAT included in the price (0 for US)
  ratePct: number; // royalty rate %
  sizeMb: number; // eBook file size (70% option delivery cost)
  deliveryPerMb: number; // $/MB
  pages: number;
  printFixed: number; // $ per copy
  printPerPage: number; // $ per page
  feePct: number; // direct sales: payment fee %
  feeFixed: number; // direct sales: fixed fee per sale
  monthlySales: number;
  oneOffCosts: number; // editing, cover, formatting, ISBN…
  monthlyCosts: number; // ads, newsletter tool…
}

export const PRESETS: Record<string, Partial<Scenario> & { label: string; note: string }> = {
  "kdp-ebook-70": { label: "Kindle eBook · 70% option (Amazon.com)", format: "ebook", ratePct: 70, deliveryPerMb: 0.15, vatPct: 0, note: "70% × (list price − VAT − delivery). Delivery on Amazon.com is US$0.15 per MB. Only available in eligible territories and price bands, and the price must be at least 20% below any print edition; check KDP's pricing page." },
  "kdp-ebook-35": { label: "Kindle eBook · 35% option", format: "ebook", ratePct: 35, deliveryPerMb: 0, vatPct: 0, note: "35% × (list price − VAT). No delivery cost." },
  "kdp-paperback-60": { label: "KDP paperback · 60% rate (Amazon marketplaces)", format: "paperback", ratePct: 60, printFixed: 1.0, printPerPage: 0.012, vatPct: 0, note: "rate × list price − printing cost. KDP pays 50% or 60% depending on list price. Printing preset: US$1.00 + US$0.012 per page (black ink), which matches KDP's example of US$4.60 for a 300-page regular-trim book; check KDP's printing-cost table for your trim, ink and marketplace." },
  "kdp-paperback-50": { label: "KDP paperback · 50% rate", format: "paperback", ratePct: 50, printFixed: 1.0, printPerPage: 0.012, vatPct: 0, note: "As above at the 50% rate, which applies below KDP's list-price threshold." },
  direct: { label: "Selling directly (your website / payment link)", format: "direct", ratePct: 100, feePct: 0, feeFixed: 0, vatPct: 0, note: "You keep the price minus your payment provider's fees. Enter your provider's real fees; none are assumed." },
  custom: { label: "Another platform (enter its rates)", format: "ebook", ratePct: 0, deliveryPerMb: 0, vatPct: 0, note: "Enter the platform's published royalty rate and any per-copy costs." },
};

export function presetValues(id: string): Partial<Scenario> {
  const p = PRESETS[id]; if (!p) return {};
  const { label: _l, note: _n, ...rest } = p; void _l; void _n;
  return rest;
}

export function blankScenario(name: string): Scenario {
  return { name, format: "ebook", price: 4.99, vatPct: 0, ratePct: 70, sizeMb: 2, deliveryPerMb: 0.15, pages: 250, printFixed: 1, printPerPage: 0.012, feePct: 0, feeFixed: 0, monthlySales: 30, oneOffCosts: 0, monthlyCosts: 0 };
}

export interface Result {
  perCopy: number; printing: number; delivery: number; netPrice: number;
  monthly: number; yearly: number; monthlyProfit: number; breakEvenCopies: number | null; breakEvenMonths: number | null;
  minPrice: number | null; // paperback: price at which royalty is zero
  formula: string; warnings: string[];
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function calc(s: Scenario): Result {
  const warnings: string[] = [];
  const netPrice = s.price / (1 + Math.max(0, s.vatPct) / 100);
  let perCopy = 0, printing = 0, delivery = 0, formula = "", minPrice: number | null = null;
  if (s.format === "ebook") {
    delivery = Math.max(0, s.sizeMb) * Math.max(0, s.deliveryPerMb);
    perCopy = (s.ratePct / 100) * (netPrice - delivery);
    formula = `${s.ratePct}% × (${fmt(s.price)} price − ${fmt(s.price - netPrice)} VAT − ${fmt(delivery)} delivery) = ${fmt(perCopy)}`;
  } else if (s.format === "paperback") {
    printing = s.printFixed + s.pages * s.printPerPage;
    perCopy = (s.ratePct / 100) * netPrice - printing;
    minPrice = s.ratePct > 0 ? r2((printing / (s.ratePct / 100)) * (1 + s.vatPct / 100)) : null;
    formula = `${s.ratePct}% × ${fmt(netPrice)} − printing (${fmt(s.printFixed)} + ${s.pages} pages × ${fmt(s.printPerPage, 3)} = ${fmt(printing)}) = ${fmt(perCopy)}`;
    if (minPrice != null && s.price < minPrice) warnings.push(`At this price printing costs more than the royalty. The price must be at least ${fmt(minPrice)} for this page count.`);
  } else {
    const fee = netPrice * (s.feePct / 100) + s.feeFixed;
    perCopy = netPrice - fee;
    formula = `${fmt(netPrice)} after VAT − fees (${s.feePct}% + ${fmt(s.feeFixed)}) = ${fmt(perCopy)}`;
    if (s.feePct === 0 && s.feeFixed === 0) warnings.push("No payment fees entered. Most payment providers charge a percentage and/or a fixed fee per sale.");
  }
  if (s.price <= 0) warnings.push("Enter a price above zero.");
  if (s.format === "ebook" && s.deliveryPerMb > 0 && s.sizeMb > 10) warnings.push("Large eBook files (lots of images) cost more to deliver on the 70% option.");
  const monthly = perCopy * Math.max(0, s.monthlySales);
  const monthlyProfit = monthly - s.monthlyCosts;
  const breakEvenCopies = perCopy > 0 ? Math.ceil((s.oneOffCosts + 0) / perCopy) : null;
  const breakEvenMonths = s.oneOffCosts <= 0 ? 0 : monthlyProfit > 0 ? Math.ceil(s.oneOffCosts / monthlyProfit) : null;
  return { perCopy: r2(perCopy), printing: r2(printing), delivery: r2(delivery), netPrice: r2(netPrice), monthly: r2(monthly), yearly: r2(monthly * 12), monthlyProfit: r2(monthlyProfit), breakEvenCopies, breakEvenMonths, minPrice, formula, warnings };
}

export function fmt(n: number, d = 2) { return `${n < 0 ? "−" : ""}${Math.abs(n).toFixed(d)}`; }
