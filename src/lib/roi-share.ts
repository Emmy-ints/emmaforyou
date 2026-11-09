import { CURRENCIES, DEFAULT_ASSUMPTIONS, type CurrencyCode, type RoiAssumptions } from "./roi-model";

/** Everything needed to rebuild a calculation from a link. */
export interface RoiState {
  currency: CurrencyCode; industry: string; enquiries: number; missed: number; closeRate: number; customerValue: number;
  assumptions: RoiAssumptions; monthlyFee: number; setupFee: number; months: 6 | 12;
}

/** Three what-if scenarios around the visitor's own assumptions (inputs, never promised results). */
export const SCENARIOS = {
  cautious: { label: "Cautious", scale: 0.5, ramp: 2 },
  expected: { label: "Expected", scale: 1, ramp: 0 },
  ambitious: { label: "Ambitious", scale: 1.5, ramp: -1 },
} as const;
export type ScenarioId = keyof typeof SCENARIOS;

export function scenarioAssumptions(id: ScenarioId, base: RoiAssumptions = DEFAULT_ASSUMPTIONS): RoiAssumptions {
  const s = SCENARIOS[id];
  const clamp = (v: number, max: number) => Math.max(0, Math.min(max, Math.round(v / 5) * 5));
  return {
    recoveredPercent: clamp(base.recoveredPercent * s.scale, 100),
    closeLiftPercent: clamp(base.closeLiftPercent * s.scale, 100),
    extraEnquiriesPercent: clamp(base.extraEnquiriesPercent * s.scale, 200),
    rampMonths: Math.max(1, Math.min(6, base.rampMonths + s.ramp)),
  };
}

const num = (v: unknown, min: number, max: number, d: number) => { const n = Number(v); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : d; };
const KEYS = ["c", "i", "e", "m", "r", "v", "a1", "a2", "a3", "a4", "f", "s", "p"] as const;

/** Short, URL-safe encoding (`?roi=…`). Only numbers and the industry label; nothing personal. */
export function encodeRoi(st: RoiState): string {
  const vals = [st.currency, st.industry.slice(0, 40), st.enquiries, st.missed, st.closeRate, st.customerValue, st.assumptions.recoveredPercent, st.assumptions.closeLiftPercent, st.assumptions.extraEnquiriesPercent, st.assumptions.rampMonths, st.monthlyFee, st.setupFee, st.months];
  return KEYS.map((k, i) => `${k}${String(vals[i]).replace(/[~]/g, "")}`).join("~");
}

export function decodeRoi(raw: string | null | undefined, industries: readonly string[]): RoiState | null {
  if (!raw || raw.length > 400) return null;
  const parts: Record<string, string> = {};
  for (const p of raw.split("~")) { const m = /^(a[1-4]|[ciemrvfsp])(.*)$/.exec(p); if (m) parts[m[1]] = m[2]; }
  const currency = CURRENCIES.find((c) => c.code === parts.c)?.code;
  if (!currency) return null;
  return {
    currency,
    industry: industries.includes(parts.i) ? parts.i : industries[industries.length - 1],
    enquiries: num(parts.e, 0, 1_000_000, 80), missed: num(parts.m, 0, 100, 35), closeRate: num(parts.r, 0, 100, 20),
    customerValue: num(parts.v, 0, 1e12, 0),
    assumptions: { recoveredPercent: num(parts.a1, 0, 100, 50), closeLiftPercent: num(parts.a2, 0, 100, 15), extraEnquiriesPercent: num(parts.a3, 0, 200, 20), rampMonths: num(parts.a4, 1, 6, 3) },
    monthlyFee: num(parts.f, 0, 1e12, 0), setupFee: num(parts.s, 0, 1e12, 0), months: Number(parts.p) === 6 ? 6 : 12,
  };
}
