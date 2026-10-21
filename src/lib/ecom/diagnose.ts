/**
 * Sales diagnosis (pure functions). Works from whatever funnel numbers the user has, finds where
 * the largest measurable drop happens, and labels every finding by how strong the evidence is:
 *   confirmed  — directly measured in the numbers provided (e.g. "92% of carts don't reach checkout")
 *   supported  — measured problem + a matching observation from the store audit
 *   hypothesis — a plausible explanation that needs a test to confirm
 *   unknown    — can't be judged because the data needed is missing
 * No industry benchmark figures are used: comparisons are only between the user's own stages and
 * periods, so nothing is presented as fact that the data doesn't show.
 */
export interface FunnelInput {
  sessions: number | null;
  productViews: number | null;
  addToCarts: number | null;
  checkouts: number | null;
  orders: number | null;
  repeatCustomers: number | null;
  customers: number | null;
  revenue: number | null;
  adSpend: number | null;
  previous?: Partial<Omit<FunnelInput, "previous">> | null;
}
export type Evidence = "confirmed" | "supported" | "hypothesis" | "unknown";
export interface Finding { stage: string; evidence: Evidence; title: string; detail: string; causes: string[]; experiment?: { action: string; metric: string; direction: string; review: string } }
export interface AuditSignals { slow?: boolean; noShippingInfo?: boolean; noReturnsInfo?: boolean; noReviews?: boolean; fewPaymentOptions?: boolean; noProductSchema?: boolean; mobileIssues?: boolean; noPrice?: boolean }

const STAGES: { key: keyof FunnelInput; label: string }[] = [
  { key: "sessions", label: "Visits" }, { key: "productViews", label: "Product views" }, { key: "addToCarts", label: "Add to cart" },
  { key: "checkouts", label: "Checkout started" }, { key: "orders", label: "Orders" },
];

export interface StageRate { from: string; to: string; rate: number | null; lost: number | null }
export function stageRates(f: FunnelInput): StageRate[] {
  const out: StageRate[] = [];
  for (let i = 0; i < STAGES.length - 1; i++) {
    const a = f[STAGES[i].key] as number | null, b = f[STAGES[i + 1].key] as number | null;
    out.push({ from: STAGES[i].label, to: STAGES[i + 1].label, rate: a && a > 0 && b != null ? b / a : null, lost: a != null && b != null ? Math.max(0, a - b) : null });
  }
  return out;
}

const pc = (v: number) => `${(v * 100).toFixed(v < 0.1 ? 1 : 0)}%`;

export function diagnose(f: FunnelInput, signals: AuditSignals = {}): { findings: Finding[]; conversion: number | null; aov: number | null; biggestDrop: StageRate | null; missing: string[] } {
  const findings: Finding[] = [];
  const missing = STAGES.filter((s) => f[s.key] == null).map((s) => s.label);
  const rates = stageRates(f).filter((r) => r.rate != null);
  const conversion = f.sessions && f.sessions > 0 && f.orders != null ? f.orders / f.sessions : null;
  const aov = f.orders && f.orders > 0 && f.revenue != null ? f.revenue / f.orders : null;
  // Largest drop = lowest pass-through rate among the measured steps.
  const biggestDrop = rates.length ? rates.reduce((a, b) => ((b.rate as number) < (a.rate as number) ? b : a)) : null;

  if (f.sessions == null) {
    findings.push({ stage: "Traffic", evidence: "unknown", title: "Traffic volume unknown", detail: "Without the number of visits we can't tell whether the issue is too few visitors or visitors not buying.", causes: [], experiment: { action: "Install or open your store analytics (Shopify Analytics, GA4) and note visits for the same period as your orders.", metric: "Visits per day", direction: "Baseline", review: "1 week" } });
  } else if (f.orders === 0 && f.sessions > 0) {
    findings.push({ stage: "Traffic → Orders", evidence: "confirmed", title: `${f.sessions.toLocaleString()} visits and no orders`, detail: "Visitors arrive but nobody completes a purchase in this period.", causes: ["Visitors aren't the right audience (traffic quality)", "The offer or price isn't convincing", "Something blocks checkout (errors, shipping cost surprise, missing payment method)"], experiment: { action: "Place a real test order on mobile and desktop, then check where visitors leave using your analytics funnel.", metric: "Checkout completion of the test order; product → cart rate", direction: "Find the first step that fails", review: "Today" } });
  }

  if (biggestDrop && biggestDrop.rate != null) {
    const step = `${biggestDrop.from} → ${biggestDrop.to}`;
    const lostPct = 1 - biggestDrop.rate;
    const base: Finding = { stage: step, evidence: "confirmed", title: `Biggest drop: ${step} (${pc(lostPct)} don't continue)`, detail: `${biggestDrop.lost?.toLocaleString() ?? "Many"} people stopped at this step in the period you entered. This is where improvements are likely to matter most.`, causes: [] };
    if (biggestDrop.from === "Visits") {
      base.causes = ["Landing pages don't lead clearly to products", "Traffic from campaigns that don't match what you sell", "Slow or confusing home page on mobile"];
      base.experiment = { action: "Send your main traffic source to a specific product or collection page instead of the home page.", metric: "Visit → product view rate", direction: "Up", review: "2 weeks" };
      if (signals.slow || signals.mobileIssues) base.evidence = "supported";
    } else if (biggestDrop.from === "Product views") {
      base.causes = ["Product page doesn't explain benefits or answer key questions", "Price feels too high for the perceived value", "No reviews or trust signals near the add-to-cart button", "Shipping cost or delivery time unclear"];
      base.experiment = { action: "Rewrite the top product's page: benefit-led title, 5 key points, real photos, delivery time and returns next to the button.", metric: "Product view → add-to-cart rate for that product", direction: "Up", review: "2–4 weeks" };
      if (signals.noReviews || signals.noShippingInfo || signals.noReturnsInfo || signals.noPrice) base.evidence = "supported";
    } else if (biggestDrop.from === "Add to cart") {
      base.causes = ["Shipping cost revealed late", "Forced account creation", "Discount-code field sends people searching for codes", "Cart page distractions"];
      base.experiment = { action: "Show shipping cost (or the free-shipping threshold) on the product and cart pages.", metric: "Cart → checkout rate", direction: "Up", review: "2 weeks" };
      if (signals.noShippingInfo) base.evidence = "supported";
    } else if (biggestDrop.from === "Checkout started") {
      base.causes = ["Preferred payment method missing", "Unexpected fees or taxes at the last step", "Checkout errors on some devices", "Delivery date too far"];
      base.experiment = { action: "Add the payment methods your customers use most (cards, wallets, local options) and test checkout on several phones.", metric: "Checkout → order rate", direction: "Up", review: "2 weeks" };
      if (signals.fewPaymentOptions) base.evidence = "supported";
    }
    findings.push(base);
  }

  for (const r of rates) {
    if (r === biggestDrop) continue;
    if ((r.rate as number) < 0.5) findings.push({ stage: `${r.from} → ${r.to}`, evidence: "confirmed", title: `${pc(1 - (r.rate as number))} drop at ${r.from} → ${r.to}`, detail: "A second notable loss. Work on it after the biggest drop, so you can tell which change made the difference.", causes: [] });
  }

  if (f.previous && f.sessions != null && f.previous.sessions != null && f.previous.sessions > 0) {
    const change = (f.sessions - f.previous.sessions) / f.previous.sessions;
    if (Math.abs(change) >= 0.2) findings.push({ stage: "Traffic", evidence: "confirmed", title: `Visits ${change > 0 ? "up" : "down"} ${pc(Math.abs(change))} vs the previous period`, detail: change < 0 ? "Fewer visitors explains part of any drop in orders. Check which source fell (ads, search, social)." : "More visitors. Check whether orders grew at the same rate; if not, the new traffic may be lower quality.", causes: [] });
  }
  if (f.previous && conversion != null && f.previous.sessions && f.previous.orders != null) {
    const prev = f.previous.orders / f.previous.sessions;
    if (prev > 0 && Math.abs(conversion - prev) / prev >= 0.2) findings.push({ stage: "Conversion", evidence: "confirmed", title: `Conversion ${conversion > prev ? "improved" : "fell"} from ${pc(prev)} to ${pc(conversion)}`, detail: "Compare what changed between the two periods: prices, product pages, traffic sources, delivery times, stock.", causes: [] });
  }

  if (f.customers != null && f.repeatCustomers != null && f.customers > 0) {
    const rep = f.repeatCustomers / f.customers;
    findings.push({ stage: "Repeat purchase", evidence: "confirmed", title: `${pc(rep)} of customers bought again`, detail: rep < 0.2 ? "Most orders come from new customers, and winning new customers usually costs more than keeping existing ones. A post-purchase email sequence is a low-cost test." : "Returning customers are a meaningful part of your sales. Track this rate each period so you notice if it falls.", causes: [], experiment: rep < 0.2 ? { action: "Set up a 3-email post-purchase sequence (thank you, how to use, reorder reminder).", metric: "Repeat-customer rate", direction: "Up", review: "60 days" } : undefined });
  } else {
    findings.push({ stage: "Repeat purchase", evidence: "unknown", title: "Repeat purchases unknown", detail: "Add the number of customers and how many ordered more than once to see retention.", causes: [] });
  }

  if (f.adSpend != null && f.adSpend > 0 && f.revenue != null) {
    const roas = f.revenue / f.adSpend;
    findings.push({ stage: "Advertising", evidence: "confirmed", title: `Revenue is ${roas.toFixed(2)}× ad spend (all revenue, not only ad-attributed)`, detail: "Use the profit calculator to see whether this covers product, shipping and fees. A ratio that looks good can still lose money if margins are thin.", causes: [] });
  }

  if (signals.slow) findings.push({ stage: "Technical", evidence: "hypothesis", title: "Slow mobile pages may be costing sales", detail: "The store audit measured slow loading. Speed affects how many visitors stay, but only a before/after test shows how much it matters for your store.", causes: [], experiment: { action: "Compress the largest images and remove unused apps/scripts, then re-run the audit.", metric: "Mobile performance score and visit → product view rate", direction: "Up", review: "2 weeks" } });
  return { findings, conversion, aov, biggestDrop, missing };
}
