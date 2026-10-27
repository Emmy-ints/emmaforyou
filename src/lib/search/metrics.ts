/**
 * Search, content and technical-health formulas, in one tested place. Every rate returns `null`
 * (shown as "N/A") when its denominator is zero or missing, never 0 % or Infinity, so a missing
 * measurement can't be mistaken for a real zero. None of these are search-engine ranking factors.
 */

export type Num = number | null | undefined;
const ok = (n: Num): n is number => typeof n === "number" && Number.isFinite(n);

/** part / whole × 100, or null when whole is 0 or either value is missing. */
export function rate(part: Num, whole: Num): number | null {
  if (!ok(part) || !ok(whole) || whole === 0) return null;
  return (part / whole) * 100;
}

export const sum = (xs: Num[]): number | null => (xs.some(ok) ? xs.filter(ok).reduce((a, b) => a + b, 0) : null);

/** Click-through rate = clicks / impressions × 100. */
export const ctr = (clicks: Num, impressions: Num) => rate(clicks, impressions);

/**
 * Impression-weighted average position, Σ(Pd·Id) / ΣId. An approximation: Search Console's own
 * aggregate should be preferred when the API returns one for the same scope.
 */
export function weightedPosition(rows: { position: Num; impressions: Num }[]): number | null {
  let num = 0, den = 0;
  for (const r of rows) if (ok(r.position) && ok(r.impressions) && r.impressions > 0) { num += r.position * r.impressions; den += r.impressions; }
  return den === 0 ? null : num / den;
}

export type Change = { absolute: number | null; percent: number | null; label: "new" | "not comparable" | null };
/** Absolute and percentage change. Previous 0 → percent null with label "new" (current > 0) or "not comparable". */
export function change(current: Num, previous: Num): Change {
  if (!ok(current) || !ok(previous)) return { absolute: null, percent: null, label: "not comparable" };
  const absolute = current - previous;
  if (previous === 0) return { absolute, percent: null, label: current > 0 ? "new" : "not comparable" };
  return { absolute, percent: (absolute / Math.abs(previous)) * 100, label: null };
}

// Conversion metrics (each needs a consistent cohort and attribution window, stated by the caller).
export const conversionRate = (conversions: Num, eligibleSessions: Num) => rate(conversions, eligibleSessions);
export const leadRate = (validLeads: Num, eligibleSessions: Num) => rate(validLeads, eligibleSessions);
export const qualifiedLeadRate = (qualified: Num, validLeads: Num) => rate(qualified, validLeads);
export const leadToCustomerRate = (customersFromCohort: Num, cohortLeads: Num) => rate(customersFromCohort, cohortLeads);
/** Cost per lead; null without spend data or leads. */
export function costPerLead(spend: Num, leads: Num): number | null { return !ok(spend) || !ok(leads) || leads === 0 ? null : spend / leads; }
export function revenuePerSession(revenue: Num, sessions: Num): number | null { return !ok(revenue) || !ok(sessions) || sessions === 0 ? null : revenue / sessions; }

// Content
export function contentAgeDays(lastMeaningfulUpdate: string | Date | null | undefined, now: Date = new Date()): number | null {
  if (!lastMeaningfulUpdate) return null;
  const t = new Date(lastMeaningfulUpdate).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((now.getTime() - t) / 864e5);
}
export const reviewedCoverage = (reviewed: Num, inScope: Num) => rate(reviewed, inScope);
export const orphanRate = (orphans: Num, indexable: Num) => rate(orphans, indexable);

// Technical health
export const validSitemapRate = (passing: Num, tested: Num) => rate(passing, tested);
export const brokenLinkRate = (brokenOccurrences: Num, totalOccurrences: Num) => rate(brokenOccurrences, totalOccurrences);
/** Indexed / pages with KNOWN status. Unknown status is excluded from the denominator, not counted as not indexed. */
export const indexableCoverage = (indexed: Num, knownStatus: Num) => rate(indexed, knownStatus);
export const schemaValidityRate = (passing: Num, tested: Num) => rate(passing, tested);
export const redirectChainRate = (multiHop: Num, redirecting: Num) => rate(multiHop, redirecting);

// AI visibility (sampled observations, not platform-wide statistics)
export const mentionRate = (withMention: Num, valid: Num) => rate(withMention, valid);
export const citationRate = (withLink: Num, valid: Num) => rate(withLink, valid);
export const citationSupportRate = (supporting: Num, reviewed: Num) => rate(supporting, reviewed);
export const citationPageCoverage = (distinctCited: Num, scope: Num) => rate(distinctCited, scope);

/**
 * Opportunity priority (planning heuristic, not a ranking factor). Inputs are 0–100. A missing
 * input makes the score incomplete (null) instead of being silently filled in.
 */
export const PRIORITY_WEIGHTS = { business: 0.25, demand: 0.2, opportunity: 0.2, conversion: 0.15, confidence: 0.2 } as const;
export type PriorityInput = { business: Num; demand: Num; opportunity: Num; conversion: Num; confidence: Num };
export function priorityScore(i: PriorityInput, w: Record<keyof PriorityInput, number> = PRIORITY_WEIGHTS): number | null {
  const keys = Object.keys(w) as (keyof PriorityInput)[];
  if (keys.some((k) => !ok(i[k]))) return null;
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  return keys.reduce((s, k) => s + w[k] * clamp(i[k] as number), 0);
}
/** Effort-adjusted score S / (max(E,1)/10), E rated 1–10. */
export function effortAdjusted(score: Num, effort: Num): number | null {
  if (!ok(score) || !ok(effort)) return null;
  return score / (Math.max(effort, 1) / 10);
}

/** Bounded exponential backoff with optional jitter: min(dmax, d0·2ⁿ) ± jitter. */
export function backoffDelay(n: number, d0 = 2000, dmax = 30000, jitter = 0, rnd: () => number = Math.random): number {
  const base = Math.min(dmax, d0 * 2 ** Math.max(0, n));
  return jitter ? Math.max(0, Math.round(base + (rnd() * 2 - 1) * jitter)) : base;
}

/** "12.3 %" or "N/A". */
export const fmtPct = (n: number | null, digits = 1) => (n === null ? "N/A" : `${n.toFixed(digits)} %`);
