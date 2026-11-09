/**
 * Ask Emma's quick qualification: four taps (business, goal, budget, timing) → a recommendation built only
 * from the site's own data (published plans, real service/tool pages, industry pages). Pure and tested.
 */
import { TIERS } from "./pricing-data";

export const BUSINESSES = [
  { id: "salon", label: "Salon, spa or beauty", niche: "salon" },
  { id: "restaurant", label: "Restaurant, café or food", niche: "restaurant" },
  { id: "clinic", label: "Clinic or health", niche: "clinic" },
  { id: "shop", label: "Shop, fashion or ecommerce", niche: "ecommerce" },
  { id: "real-estate", label: "Real estate or property", niche: "real-estate" },
  { id: "school", label: "School or training", niche: "school" },
  { id: "coach", label: "Coach or consultant", niche: "coach" },
  { id: "gym", label: "Gym or fitness", niche: "gym" },
  { id: "hotel", label: "Hotel or short-let", niche: "hotel" },
  { id: "other", label: "Something else", niche: null },
] as const;

export const GOALS = [
  { id: "leads", label: "More customers & leads", service: "/expertise/lead-generation", serviceLabel: "Lead generation", tool: "/website-audit", toolLabel: "Free website audit", plan: "Growth" },
  { id: "automate", label: "Reply & book automatically", service: "/expertise/ai-automation", serviceLabel: "WhatsApp & AI automation", tool: "/ai-receptionist", toolLabel: "AI receptionist demo", plan: "Starter" },
  { id: "website", label: "A new website or app", service: "/expertise/website-landing-pages", serviceLabel: "Websites & landing pages", tool: "/#prototype", toolLabel: "Free prototype", plan: "Pro" },
  { id: "sell", label: "Sell online", service: "/expertise/shopify-ecommerce", serviceLabel: "Ecommerce stores", tool: "/ecommerce/start", toolLabel: "Ecommerce starter", plan: "Pro" },
  { id: "social", label: "Grow on social media", service: "/expertise/social-media-automation", serviceLabel: "Social media", tool: "/growth-quiz", toolLabel: "Growth quiz", plan: "Starter" },
  { id: "unsure", label: "Not sure yet", service: "/services", serviceLabel: "All services", tool: "/analyser", toolLabel: "Growth assessment", plan: null },
] as const;

export const BUDGETS = [
  { id: "lt100", label: "Under $100 a month", max: 99 },
  { id: "100-300", label: "$100–$300 a month", max: 300 },
  { id: "300-800", label: "$300–$800 a month", max: 800 },
  { id: "800+", label: "$800+ a month", max: Infinity },
  { id: "unsure", label: "Not sure yet", max: null },
] as const;

export const TIMINGS = [
  { id: "now", label: "This month" },
  { id: "soon", label: "In 1–3 months" },
  { id: "exploring", label: "Just exploring" },
] as const;

export type BusinessId = (typeof BUSINESSES)[number]["id"];
export type GoalId = (typeof GOALS)[number]["id"];
export type BudgetId = (typeof BUDGETS)[number]["id"];
export type TimingId = (typeof TIMINGS)[number]["id"];
export interface Answers { business: BusinessId; goal: GoalId; budget: BudgetId; timing: TimingId }

export const QUESTIONS = [
  { key: "business", ask: "Quick one: what kind of business do you run?", options: BUSINESSES },
  { key: "goal", ask: "What do you want most right now?", options: GOALS },
  { key: "budget", ask: "Roughly what monthly budget feels comfortable?", options: BUDGETS },
  { key: "timing", ask: "And when would you like to start?", options: TIMINGS },
] as const;

export interface Recommendation {
  plan: string | null;
  price: string | null;
  fitsBudget: boolean | null;
  message: string;
  links: { label: string; path: string }[];
  temperature: "hot" | "warm" | "cool";
  summary: string;
}

const label = <T extends { id: string; label: string }>(list: readonly T[], id: string) => list.find((x) => x.id === id)?.label ?? id;

export function recommend(a: Answers): Recommendation {
  const biz = BUSINESSES.find((b) => b.id === a.business)!;
  const goal = GOALS.find((g) => g.id === a.goal)!;
  const budget = BUDGETS.find((b) => b.id === a.budget)!;
  const tier = goal.plan ? TIERS.find((t) => t.name === goal.plan) : undefined;
  const price = tier ? (tier.monthly ? `$${tier.monthly}/mo` : "Custom quote") : null;
  const fitsBudget = !tier || budget.max === null ? null : tier.monthly <= budget.max;
  const who = biz.id === "other" ? "your business" : `a ${biz.label.split(",")[0].toLowerCase()} business`;

  let message: string;
  if (!tier) {
    message = `Thanks! For ${who} that isn't sure where to start, the best first step is a free 30-minute call: Emmanuel looks at how customers find you today and suggests the two or three changes that matter most.`;
  } else if (fitsBudget === false) {
    message = `For ${goal.label.toLowerCase()}, our ${tier.name} plan (${price}) is the one that includes it. That's above the budget you picked, so start with ${/^free\b/i.test(goal.toolLabel) ? "the " + goal.toolLabel.toLowerCase() : `the free ${goal.toolLabel.toLowerCase()}`} and a quick call: Emmanuel will tell you honestly what's worth doing first.`;
  } else {
    message = `For ${who} that wants ${goal.label.toLowerCase()}, our ${tier.name} plan (${price}) is the closest fit. It includes ${tier.features.filter((f) => !/\+$/.test(f)).slice(0, 3).map((f) => f.charAt(0).toLowerCase() + f.slice(1)).join(", ")}. A free call confirms it's right before you commit.`;
  }

  const links = [
    ...(biz.niche ? [{ label: `How we help ${biz.label.split(",")[0].toLowerCase()}s`, path: `/niche/${biz.niche}` }] : []),
    { label: goal.toolLabel, path: goal.tool },
    { label: goal.serviceLabel, path: goal.service },
  ].slice(0, 3);

  const budgetKnown = budget.max !== null;
  const temperature: Recommendation["temperature"] =
    a.timing === "now" && budgetKnown && fitsBudget !== false ? "hot"
    : a.timing !== "exploring" || (budgetKnown && fitsBudget !== false) ? "warm" : "cool";

  const summary = [
    `Business: ${label(BUSINESSES, a.business)}`,
    `Goal: ${label(GOALS, a.goal)}`,
    `Budget: ${label(BUDGETS, a.budget)}`,
    `Timing: ${label(TIMINGS, a.timing)}`,
    `Suggested: ${tier ? `${tier.name} (${price})${fitsBudget === false ? " — above stated budget" : ""}` : "free call first"}`,
    `Lead: ${temperature}`,
  ].join("\n");
  return { plan: tier?.name ?? null, price, fitsBudget, message, links, temperature, summary };
}

/** Plain-language profile for the AI, so Emma doesn't ask again. */
export function profileText(a: Partial<Answers>): string {
  const parts = [
    a.business && `business: ${label(BUSINESSES, a.business)}`,
    a.goal && `goal: ${label(GOALS, a.goal)}`,
    a.budget && `budget: ${label(BUDGETS, a.budget)}`,
    a.timing && `timing: ${label(TIMINGS, a.timing)}`,
  ].filter(Boolean);
  return parts.join("; ");
}
