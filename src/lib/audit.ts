/** Shared types and scoring for the website audit (used by the server handler and the page). */

export type CheckStatus = "pass" | "warn" | "fail";
export type Pillar = "speed" | "seo" | "mobile" | "conversion" | "trust";

export interface AuditCheck {
  id: string;
  pillar: Pillar;
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface Vitals {
  performance?: number;
  accessibility?: number;
  seo?: number;
  bestPractices?: number;
  lcp?: string;
  cls?: string;
  tbt?: string;
  fcp?: string;
  speedIndex?: string;
}

export interface AuditPriority {
  title: string;
  why: string;
  fix: string;
  impact: "high" | "medium" | "low";
}

export interface AuditResult {
  url: string;
  finalUrl: string;
  fetchedAt: string;
  responseMs: number;
  pageKb: number;
  title: string;
  score: number;
  pillars: Record<Pillar, number>;
  checks: AuditCheck[];
  vitals: Vitals | null;
  screenshot: string | null;
  headline: string;
  summary: string;
  priorities: AuditPriority[];
  aiWritten: boolean;
}

export const PILLAR_LABELS: Record<Pillar, string> = {
  speed: "Speed",
  seo: "Search visibility",
  mobile: "Mobile & accessibility",
  conversion: "Turns visitors into leads",
  trust: "Trust & security",
};

const WEIGHT: Record<CheckStatus, number> = { pass: 1, warn: 0.5, fail: 0 };

export function scorePillars(checks: AuditCheck[], vitals: Vitals | null): { pillars: Record<Pillar, number>; score: number } {
  const pillars = {} as Record<Pillar, number>;
  (Object.keys(PILLAR_LABELS) as Pillar[]).forEach((p) => {
    const list = checks.filter((c) => c.pillar === p);
    const fromChecks = list.length ? (list.reduce((s, c) => s + WEIGHT[c.status], 0) / list.length) * 100 : 50;
    let value = fromChecks;
    if (p === "speed" && vitals?.performance !== undefined) value = vitals.performance * 0.7 + fromChecks * 0.3;
    if (p === "mobile" && vitals?.accessibility !== undefined) value = vitals.accessibility * 0.5 + fromChecks * 0.5;
    if (p === "seo" && vitals?.seo !== undefined) value = vitals.seo * 0.3 + fromChecks * 0.7;
    pillars[p] = Math.round(Math.max(0, Math.min(100, value)));
  });
  const score = Math.round(pillars.speed * 0.22 + pillars.seo * 0.22 + pillars.mobile * 0.18 + pillars.conversion * 0.24 + pillars.trust * 0.14);
  return { pillars, score };
}

export function scoreBand(score: number): { label: string; tone: "good" | "ok" | "poor" } {
  if (score >= 80) return { label: "Strong", tone: "good" };
  if (score >= 55) return { label: "Needs work", tone: "ok" };
  return { label: "Losing customers", tone: "poor" };
}

/** Plain fallback priorities when the AI summary is unavailable. */
export function fallbackPriorities(checks: AuditCheck[]): AuditPriority[] {
  const order: CheckStatus[] = ["fail", "warn"];
  return order
    .flatMap((s) => checks.filter((c) => c.status === s))
    .slice(0, 5)
    .map((c) => ({ title: c.label, why: c.detail, fix: FIXES[c.id] || "We can fix this as part of a website tune-up.", impact: c.status === "fail" ? "high" : "medium" }));
}

const FIXES: Record<string, string> = {
  https: "Install an SSL certificate and redirect all traffic to https.",
  title: "Write a unique 50–60 character title naming what you sell and where.",
  description: "Add a 120–155 character description that answers why someone should click.",
  h1: "Give the page exactly one main heading that says what you do.",
  viewport: "Add a responsive viewport tag and test the layout on a phone.",
  alt: "Describe every meaningful image in its alt text.",
  contact: "Put a WhatsApp or call button where visitors can always see it.",
  form: "Add a short enquiry or booking form (name, phone, what they need).",
  analytics: "Install analytics so you can see where visitors come from and what they do.",
  structured: "Add Organization/LocalBusiness structured data so search engines understand your business.",
  sitemap: "Publish an XML sitemap and submit it in Google Search Console.",
  speed: "Compress images, serve modern formats and remove unused scripts.",
  weight: "Reduce page weight: compress images and remove unused scripts and fonts.",
  og: "Add Open Graph tags so links shared on WhatsApp and social look professional.",
  compression: "Turn on gzip or brotli compression on your host.",
  lang: "Declare the page language so browsers and screen readers handle it correctly.",
  canonical: "Add a canonical link so search engines index the right URL.",
  proof: "Show reviews, client logos or results near your call to action.",
};
