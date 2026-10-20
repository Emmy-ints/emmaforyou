import { WEBSITES, WEBSITE_DEFAULTS } from "./websites";
import { BUSINESS_APPS, APP_DEFAULTS } from "./business-apps";
import { AI_SOLUTIONS, AI_DEFAULTS } from "./ai-solutions";
import { AUTOMATIONS, DEVICE_APPS, INDUSTRY_SOLUTIONS, MORE_DEFAULTS } from "./more";
import { SOLUTION_CATEGORIES, findCategory } from "./categories";
import type { GroupDefaults, Solution } from "./types";

export { SOLUTION_CATEGORIES, findCategory };
export type { Solution };

export const ALL_SOLUTIONS: Solution[] = [...WEBSITES, ...BUSINESS_APPS, ...AI_SOLUTIONS, ...AUTOMATIONS, ...DEVICE_APPS, ...INDUSTRY_SOLUTIONS];

const DEFAULTS: Record<string, Record<string, GroupDefaults>> = {
  websites: WEBSITE_DEFAULTS, "business-apps": APP_DEFAULTS, "ai-solutions": AI_DEFAULTS,
  automation: MORE_DEFAULTS, "mobile-desktop": MORE_DEFAULTS, industries: MORE_DEFAULTS,
};

export function groupDefaults(s: Solution): GroupDefaults {
  return DEFAULTS[s.category]?.[s.group] ?? { integrations: [], benefits: [] };
}

export function findSolution(category: string, slug: string) {
  return ALL_SOLUTIONS.find((s) => s.category === category && s.slug === slug);
}

export function solutionsIn(category: string) {
  return ALL_SOLUTIONS.filter((s) => s.category === category);
}

/** Other solutions in the same group first, then ones sharing the same demo engine. */
export function relatedSolutions(s: Solution, n = 4) {
  const same = ALL_SOLUTIONS.filter((x) => x !== s && x.category === s.category && x.group === s.group);
  const engine = ALL_SOLUTIONS.filter((x) => x !== s && x.demo.engine === s.demo.engine && !same.includes(x));
  return [...same, ...engine].slice(0, n);
}

export const solutionPath = (s: Solution) => `/solutions/${s.category}/${s.slug}`;

import { USE_CASES } from "./use-cases";
import { INDUSTRY_DETAIL, USE_CASES_MORE } from "./use-cases-more";
/** Concrete use cases for a solution page (three per solution). */
export function useCasesFor(s: Solution): string[] {
  return USE_CASES[s.slug] ?? USE_CASES_MORE[s.slug] ?? INDUSTRY_DETAIL[s.slug]?.useCases ?? [];
}
