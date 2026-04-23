export interface NicheMult {
  month3: number; month6: number; month12: number;
  leadBoost: number; convBoost: number;
}

export const nicheMultipliers: Record<string, NicheMult> = {
  Fashion: { month3: 1.85, month6: 2.65, month12: 4.2, leadBoost: 3.8, convBoost: 1.6 },
  Ecommerce: { month3: 2.25, month6: 3.9, month12: 6.1, leadBoost: 4.2, convBoost: 2.1 },
  "Real Estate": { month3: 1.75, month6: 2.9, month12: 4.8, leadBoost: 5.1, convBoost: 1.4 },
  Restaurant: { month3: 1.65, month6: 2.3, month12: 3.5, leadBoost: 2.9, convBoost: 1.8 },
  Clinic: { month3: 1.95, month6: 3.2, month12: 5.1, leadBoost: 4.4, convBoost: 1.9 },
  Coach: { month3: 2.15, month6: 3.6, month12: 5.8, leadBoost: 4.8, convBoost: 2.2 },
  Salon: { month3: 1.65, month6: 2.4, month12: 3.8, leadBoost: 3.1, convBoost: 1.7 },
  Gym: { month3: 1.8, month6: 2.8, month12: 4.3, leadBoost: 3.5, convBoost: 1.8 },
  SaaS: { month3: 2.2, month6: 4.0, month12: 7.2, leadBoost: 3.8, convBoost: 2.4 },
  default: { month3: 1.68, month6: 2.45, month12: 3.9, leadBoost: 3.2, convBoost: 1.7 },
};

export const budgetBoosts: Record<string, { boost: number; price: number }> = {
  "$99/mo": { boost: 1.0, price: 99 },
  "$299/mo": { boost: 1.18, price: 299 },
  "$799/mo": { boost: 1.38, price: 799 },
  "$1,999/mo": { boost: 1.62, price: 1999 },
  Custom: { boost: 1.8, price: 3500 },
};

export interface RoiInput {
  niche: string;
  currentRevenue: number;
  currentAdSpend: number;
  currentLeads: number;
  conversionRate: number;
  avgOrderValue: number;
  budget: keyof typeof budgetBoosts;
  timeline: 3 | 6 | 12;
}

export interface RoiResult {
  projectedRevenue: number;
  additionalRevenue: number;
  projectedLeads: number;
  projectedConversion: number;
  totalInvestment: number;
  roi: number;
  breakEvenDays: number;
  monthly: number[];
  monthlyConservative: number[];
  monthlyCurrent: number[];
}

export function calculateRoi(input: RoiInput): RoiResult {
  const mult = nicheMultipliers[input.niche] || nicheMultipliers.default;
  const { boost, price } = budgetBoosts[input.budget] || budgetBoosts["$99/mo"];
  const tKey = `month${input.timeline}` as "month3" | "month6" | "month12";
  const projectedRevenue = Math.round(input.currentRevenue * mult[tKey] * boost);
  const additionalRevenue = Math.round((projectedRevenue - input.currentRevenue) * input.timeline);
  const projectedLeads = Math.round(input.currentLeads * mult.leadBoost * boost);
  const projectedConversion = Math.min(input.conversionRate * mult.convBoost, 15);
  const totalInvestment = price * input.timeline;
  const monthlyExtra = (projectedRevenue - input.currentRevenue) / 30;
  const breakEvenDays = monthlyExtra > 0 ? Math.max(1, Math.round(price / monthlyExtra)) : 0;
  const roi = totalInvestment > 0 ? +(additionalRevenue / totalInvestment).toFixed(1) : 0;

  const monthly: number[] = [];
  const monthlyConservative: number[] = [];
  const monthlyCurrent: number[] = [];
  for (let m = 0; m <= input.timeline; m++) {
    const t = m / input.timeline;
    monthly.push(Math.round(input.currentRevenue + (projectedRevenue - input.currentRevenue) * Math.pow(t, 0.7)));
    monthlyConservative.push(Math.round(input.currentRevenue + (projectedRevenue - input.currentRevenue) * Math.pow(t, 0.7) * 0.65));
    monthlyCurrent.push(input.currentRevenue);
  }
  return {
    projectedRevenue, additionalRevenue, projectedLeads, projectedConversion,
    totalInvestment, roi, breakEvenDays, monthly, monthlyConservative, monthlyCurrent,
  };
}