import { createServerOnlyFn } from "@tanstack/react-start";
import { DEFAULT_PAGES, cleanGeneratedHtml, protoPlanSchema } from "../prototype";
import { detectIndustry, genericTitle, scrub, showcaseRequestSchema, unsuitable, type ShowcaseKind } from "../showcase";
import { adminDb, checkLimits, checkOrigin, hashVisitor, readJson } from "./guard";
import { visitorSalt } from "./provider";
import { verifyPrototype } from "./proto-sign";
import { verifyContent } from "./content-sign";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const rand = (n: number) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => ALPHABET[b % ALPHABET.length]).join("");
async function sha256(t: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
}
const bad = (message: string, status = 400) => Response.json({ message }, { status });
const s = (v: unknown, n: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);

interface Built { title: string; summary: string | null; industry: string | null; business: string | null; payload: Record<string, unknown> }

/**
 * POST /api/showcase — publish something a visitor made (they chose to). Only signed tool output is accepted; contact
 * details are scrubbed and names removed unless the visitor ticked "show my business name". Items appear at once.
 * DELETE /api/showcase — the visitor removes their own item with the private token they were given.
 */
export const handleShowcase = createServerOnlyFn(async (request: Request) => {
  const origin = checkOrigin(request);
  if (origin) return origin.response;

  if (request.method === "DELETE") {
    const body = await readJson(request, 400);
    if (!body.ok) return body.response;
    const { slug, token } = (body.value ?? {}) as { slug?: string; token?: string };
    if (typeof slug !== "string" || typeof token !== "string" || !/^[A-Za-z0-9]{10,16}$/.test(slug) || token.length < 20 || token.length > 64) return bad("That link isn't valid.");
    const db = await adminDb();
    const { data, error } = await db.from("showcase_items").delete().eq("slug", slug).eq("remove_hash", await sha256(token)).select("slug");
    if (error) return bad("We couldn't remove it just now. Please try again.", 500);
    if (!data?.length) return bad("We couldn't find that item, or it was already removed.", 404);
    return Response.json({ removed: true });
  }

  const body = await readJson(request, 400000);
  if (!body.ok) return body.response;
  const parsed = showcaseRequestSchema.safeParse(body.value);
  if (!parsed.success) return bad("That item can't be added to the showcase.");
  const v = parsed.data;
  const kind = v.kind as ShowcaseKind;
  const c = v.content as Record<string, unknown>;

  // 1. Only real tool output.
  let ok = false;
  if (kind === "app" || kind === "website") ok = typeof c?.html === "string" && (await verifyPrototype(c.html as string, v.sig));
  else ok = await verifyContent(kind, c, v.sig);
  if (!ok) return bad("Only results made with our free tools on this website can be added to the showcase.");

  const limit = await checkLimits(request, "showcase", { perVisitor: 20, global: 500, label: "showcase items", worksWithoutAi: true });
  if (!limit.ok) return limit.response;

  // 2. Build a privacy-safe item per kind.
  const showName = v.showBusiness && v.business ? v.business : null;
  const names = [v.business, ...(kind === "emails" ? [s(c.businessName, 80), s(c.ownerName, 60)] : [])].filter((x): x is string => !!x && !showName?.includes(x));
  let item: Built;
  if (kind === "app" || kind === "website") {
    const html = cleanGeneratedHtml(c.html as string);
    if (html.length > 170000) return bad("This prototype is too large for the showcase.");
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
    const emails = Array.isArray(c.emails) ? (c.emails as Record<string, unknown>[]).slice(0, 5).map((e) => ({ day: Number(e.day) || 0, subject: scrub(s(e.subject, 90), { names, max: 90 }), preview: scrub(s(e.preview, 120), { names, max: 120 }), body: scrub(String(e.body ?? "").slice(0, 1500), { names, max: 1500 }) })) : [];
    const industry = detectIndustry(s(c.businessType, 40), v.prompt);
    item = { title: showName ? `${showName}: ${s(c.goal, 40)} emails` : genericTitle("emails", industry, s(c.goal, 40)), summary: `${emails.length} emails · ${s(c.goal, 40)}`, industry, business: showName, payload: { goal: s(c.goal, 40), businessType: s(c.businessType, 40), emails } };
  } else {
    const plan = (c.plan ?? {}) as Record<string, unknown>;
    const industry = detectIndustry(s(c.role, 60), s(c.goal, 300));
    const clean = (x: unknown, n: number) => scrub(s(x, n), { names, max: n });
    item = {
      title: genericTitle("plan", industry, clean(plan.headline, 60) || undefined),
      summary: clean(plan.northStar, 300) || clean(c.goal, 300), industry, business: showName,
      payload: {
        role: clean(c.role, 60), northStar: clean(plan.northStar, 400),
        milestones: Array.isArray(plan.milestones) ? (plan.milestones as Record<string, unknown>[]).slice(0, 3).map((m, i) => ({ month: i + 1, outcome: clean(m.outcome, 200), measure: clean(m.measure, 200) })) : [],
        weeks: Array.isArray(plan.weeks) ? (plan.weeks as Record<string, unknown>[]).slice(0, 12).map((w, i) => ({ week: i + 1, focus: clean(w.focus, 80), actions: Array.isArray(w.actions) ? (w.actions as unknown[]).slice(0, 4).map((a) => clean(a, 180)) : [] })) : [],
        habits: Array.isArray(plan.habits) ? (plan.habits as unknown[]).slice(0, 5).map((h) => clean(h, 160)) : [],
      },
    };
  }

  // 3. Not suitable for a public wall.
  if (unsuitable(item.title, item.summary, v.prompt, JSON.stringify(item.payload).slice(0, 20000))) return bad("This item can't be shown publicly.", 422);

  const token = rand(24);
  const db = await adminDb();
  const visitor = await hashVisitor(request, visitorSalt());
  for (let i = 0; i < 3; i++) {
    const slug = rand(12);
    const { error } = await db.from("showcase_items").insert({
      slug, kind, title: item.title, summary: item.summary, industry: item.industry, place: v.place ? scrub(v.place, { max: 60 }) : null,
      business: item.business, payload: item.payload, lang: v.lang, remove_hash: await sha256(token), visitor_hash: visitor,
    });
    if (!error) return Response.json({ slug, token, title: item.title, path: `/showcase/${slug}` }, { headers: { "Cache-Control": "no-store" } });
    if (!/duplicate|unique/i.test(error.message ?? "")) { console.error("[showcase] insert", error.code); return bad("We couldn't add it to the showcase just now.", 500); }
  }
  return bad("We couldn't add it to the showcase just now.", 500);
});
