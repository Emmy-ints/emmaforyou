import { DEFAULT_PAGES, cleanGeneratedHtml, protoPlanSchema } from "./prototype";
import { detectIndustry, genericTitle, scrub, type ShowcaseKind, type showcaseRequestSchema } from "./showcase";
import type { z } from "zod";

/**
 * Turn a visitor's (already signature-checked) tool output into a privacy-safe public showcase item.
 * Pure: no database or network, so every kind is unit-tested (tests/showcase).
 */
export interface BuiltItem { title: string; summary: string | null; industry: string | null; business: string | null; payload: Record<string, unknown> }
type Req = z.infer<typeof showcaseRequestSchema>;
const s = (v: unknown, n: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);

export function buildShowcaseItem(v: Req): BuiltItem | { error: string } {
  const kind = v.kind as ShowcaseKind;
  const c = (v.content ?? {}) as Record<string, unknown>;
  const showName = v.showBusiness && v.business ? v.business : null;
  const names = [v.business, ...(kind === "emails" ? [s(c.businessName, 80)] : [])].filter((x): x is string => !!x && !showName?.includes(x));
  // The owner's own name is never shown (even when the business name is).
  const people = kind === "emails" ? [s(c.ownerName, 60)].filter((x) => x.length >= 3) : [];
  let item: BuiltItem;
  if (kind === "app" || kind === "website") {
    const html = cleanGeneratedHtml(c.html as string);
    if (html.length > 170000) return { error: "This prototype is too large for the showcase." };
    const plan = kind === "app" ? protoPlanSchema.safeParse(c.plan) : null;
    const prompt = scrub(v.prompt ?? "", { names, max: 240 });
    const industry = detectIndustry(v.prompt, plan?.success ? plan.data.name : "");
    const appName = plan?.success ? (showName ? plan.data.name : null) : null;
    item = {
      title: showName ? `${showName} ${kind === "app" ? "app" : "website"}`.slice(0, 90) : appName ?? genericTitle(kind, industry),
      summary: prompt || null, industry, business: showName,
      payload: {
        html,
        ...(plan?.success ? { plan: { name: showName ? plan.data.name : genericTitle("app", industry), primary: plan.data.primary, accent: plan.data.accent, screens: plan.data.screens.map((x) => x.name), features: plan.data.features } } : {}),
        ...(kind === "website" ? { pages: Array.isArray(c.pages) ? (c.pages as unknown[]).map((x) => s(x, 20)).slice(0, 7) : DEFAULT_PAGES } : {}),
        platform: c.platform === "android" ? "android" : "ios",
      },
    };
  } else if (kind === "makeover") {
    const html = cleanGeneratedHtml(String(c.html ?? ""));
    item = { title: showName ? `${showName} website makeover` : genericTitle("makeover", detectIndustry(v.prompt, html.slice(0, 4000))), summary: `Style: ${s(c.style, 30)}`, industry: detectIndustry(v.prompt, html.slice(0, 4000)), business: showName, payload: { html, style: s(c.style, 30) } };
  } else if (kind === "audit") {
    const host = s(c.host, 120);
    const industry = detectIndustry(v.prompt, s(c.headline, 200), s(c.summary, 700));
    const priorities = Array.isArray(c.priorities) ? (c.priorities as Record<string, unknown>[]).slice(0, 5).map((p) => ({ title: scrub(s(p.title, 80), { names }), impact: s(p.impact, 10) })) : [];
    item = {
      title: `${v.showSite ? host : showName ?? genericTitle("audit", industry)}: ${Number(c.score) || 0}/100`.slice(0, 90),
      summary: scrub(s(c.headline, 200), { names, max: 200 }) || null, industry, business: showName,
      payload: { score: Number(c.score) || 0, pillars: c.pillars, headline: scrub(s(c.headline, 200), { names }), summary: scrub(s(c.summary, 700), { names, max: 600 }), priorities, ...(v.showSite ? { host } : {}) },
    };
  } else if (kind === "emails") {
    const emails = Array.isArray(c.emails) ? (c.emails as Record<string, unknown>[]).slice(0, 5).map((e) => ({ day: Number(e.day) || 0, subject: scrub(s(e.subject, 90), { names, people, max: 90 }), preview: scrub(s(e.preview, 120), { names, people, max: 120 }), body: scrub(String(e.body ?? "").slice(0, 1500), { names, people, max: 1500 }) })) : [];
    const industry = detectIndustry(s(c.businessType, 40), v.prompt);
    item = { title: showName ? `${showName}: ${s(c.goal, 40)} emails` : (scrub(s(c.businessType, 40), { names, people, max: 40 }) ? `${scrub(s(c.businessType, 40), { names, people, max: 40 }).charAt(0).toUpperCase()}${scrub(s(c.businessType, 40), { names, people, max: 40 }).slice(1)} email sequence: ${s(c.goal, 40)}`.slice(0, 90) : genericTitle("emails", industry, s(c.goal, 40))), summary: `${emails.length} emails · ${s(c.goal, 40)}`, industry, business: showName, payload: { goal: s(c.goal, 40), businessType: s(c.businessType, 40), emails } };
  } else {
    const plan = (c.plan ?? {}) as Record<string, unknown>;
    const industry = detectIndustry(s(c.role, 60), s(c.goal, 300));
    const clean = (x: unknown, n: number) => scrub(s(x, n), { names, max: n });
    item = {
      title: clean(plan.headline, 60) ? `90-day plan: ${clean(plan.headline, 60)}`.slice(0, 90) : genericTitle("plan", industry),
      summary: clean(plan.northStar, 300) || clean(c.goal, 300), industry, business: showName,
      payload: {
        role: clean(c.role, 60), northStar: clean(plan.northStar, 400),
        milestones: Array.isArray(plan.milestones) ? (plan.milestones as Record<string, unknown>[]).slice(0, 3).map((m, i) => ({ month: i + 1, outcome: clean(m.outcome, 200), measure: clean(m.measure, 200) })) : [],
        weeks: Array.isArray(plan.weeks) ? (plan.weeks as Record<string, unknown>[]).slice(0, 12).map((w, i) => ({ week: i + 1, focus: clean(w.focus, 80), actions: Array.isArray(w.actions) ? (w.actions as unknown[]).slice(0, 4).map((a) => clean(a, 180)) : [] })) : [],
        habits: Array.isArray(plan.habits) ? (plan.habits as unknown[]).slice(0, 5).map((h) => clean(h, 160)) : [],
      },
    };
  }

  item.title = item.title.replace(/\s+/g, " ").trim();
  item.summary = item.summary ? item.summary.replace(/\s+/g, " ").trim() : null;
  return item;
}
