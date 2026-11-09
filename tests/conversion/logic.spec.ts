/** Unit checks for call times, Ask Emma qualification, WhatsApp follow-ups and industry landing data.
 *  Run: esbuild tests/conversion/logic.spec.ts --bundle --platform=node --alias:@=./src | node */
import { availabilityWindow, formatCallTime, pickEventType, pickTimes, relativeDay } from "@/lib/call-times";
import { BUDGETS, BUSINESSES, GOALS, QUESTIONS, TIMINGS, profileText, recommend, type Answers } from "@/lib/qualify";
import { messageFor, plan, summaryField, waLink, waNumber, type FollowLead } from "@/lib/followups";
import { INDUSTRY_LANDING, projectsFor, prototypeLink } from "@/lib/industry-landing";
import { NICHES } from "@/lib/niches";
import { PROJECTS } from "@/lib/portfolio-data";
import { TIERS } from "@/lib/pricing-data";
import { EXPERTISE } from "@/lib/services-data";

const R: [string, boolean, unknown?][] = [];
const t = (n: string, ok: boolean, info?: unknown) => R.push([n, ok, info]);

// ── call times
const now = new Date("2026-11-10T08:00:00Z");
const coll = [
  { status: "available", invitees_remaining: 1, start_time: "2026-11-10T08:30:00Z", scheduling_url: "https://calendly.com/x/new-meeting/2026-11-10T08:30:00Z" }, // under 1h notice
  { status: "available", invitees_remaining: 1, start_time: "2026-11-11T10:00:00Z", scheduling_url: "https://calendly.com/x/new-meeting/2026-11-11T10:00:00Z" },
  { status: "available", invitees_remaining: 0, start_time: "2026-11-11T11:00:00Z", scheduling_url: "https://calendly.com/x/a" }, // full
  { status: "available", invitees_remaining: 1, start_time: "2026-11-10T14:00:00Z", scheduling_url: "https://calendly.com/x/b" },
  { status: "available", invitees_remaining: 1, start_time: "2026-11-12T09:00:00Z", scheduling_url: "https://evil.example/x" }, // not Calendly
  { status: "available", invitees_remaining: 1, start_time: "2026-11-13T09:00:00Z", scheduling_url: "https://calendly.com/x/c" },
  { status: "available", invitees_remaining: 1, start_time: "2026-11-14T09:00:00Z", scheduling_url: "https://calendly.com/x/d" },
  { nonsense: true },
];
const times = pickTimes(coll, now);
t("times: future, ≥1h notice, open, Calendly links only, sorted, max 3", times.length === 3 && times[0].start === "2026-11-10T14:00:00.000Z" && times[1].start === "2026-11-11T10:00:00.000Z" && times[2].start === "2026-11-13T09:00:00.000Z", times);
t("times: garbage → none", pickTimes(null).length === 0 && pickTimes([{}]).length === 0);
t("event type matches the public booking link", pickEventType([{ uri: "a", scheduling_url: "https://calendly.com/other", active: true }, { uri: "b", scheduling_url: "https://calendly.com/discosundaysllc/new-meeting/" }]) === "b");
t("event type falls back to first active", pickEventType([{ uri: "a", active: false, scheduling_url: "x" }, { uri: "c", active: true, scheduling_url: "y" }]) === "c" && pickEventType("x") === null);
const w = availabilityWindow(now);
t("availability window ≤ 7 days and starts in the future", Date.parse(w.end) - Date.parse(w.start) < 7 * 864e5 && Date.parse(w.start) > now.getTime());
t("time shown in the visitor's timezone", formatCallTime("2026-11-10T14:00:00Z", "en-GB", "Africa/Lagos").time === "15:00" && formatCallTime("2026-11-10T14:00:00Z", "en-US", "America/Los_Angeles").time === "6:00 AM", [formatCallTime("2026-11-10T14:00:00Z", "en-GB", "Africa/Lagos"), formatCallTime("2026-11-10T14:00:00Z", "en-US", "America/Los_Angeles")]);
t("today / tomorrow labels per timezone", relativeDay("2026-11-10T14:00:00Z", now, "Africa/Lagos") === "today" && relativeDay("2026-11-11T10:00:00Z", now, "Africa/Lagos") === "tomorrow" && relativeDay("2026-11-13T09:00:00Z", now, "Africa/Lagos") === null);

// ── qualification
const all: Answers[] = [];
for (const b of BUSINESSES) for (const g of GOALS) for (const bu of BUDGETS) for (const ti of TIMINGS) all.push({ business: b.id, goal: g.id, budget: bu.id, timing: ti.id });
const recs = all.map((a) => ({ a, r: recommend(a) }));
t(`every answer combination gives a recommendation (${recs.length})`, recs.every(({ r }) => r.message.length > 40 && r.links.length >= 2 && ["hot", "warm", "cool"].includes(r.temperature)));
t("plans and prices only from pricing-data", recs.every(({ r }) => r.plan === null || TIERS.some((x) => x.name === r.plan && (r.price === `$${x.monthly}/mo`))));
const validPath = (p: string) => p === "/#prototype" || p === "/services" || p === "/analyser" || p === "/website-audit" || p === "/ai-receptionist" || p === "/growth-quiz" || p === "/ecommerce/start" || /^\/niche\/[a-z-]+$/.test(p) && NICHES.some((n) => `/niche/${n.slug}` === p) || /^\/expertise\/[a-z-]+$/.test(p) && EXPERTISE.some((e) => `/expertise/${e.slug}` === p);
t("every recommended link is a real page", recs.every(({ r }) => r.links.every((l) => validPath(l.path))), recs.flatMap(({ r }) => r.links).find((l) => !validPath(l.path)));
const web = recommend({ business: "salon", goal: "website", budget: "lt100", timing: "now" });
t("over-budget plan is said honestly and not hot", web.fitsBudget === false && /above the budget/.test(web.message) && web.temperature !== "hot");
t("no doubled words in any message", recs.every(({ r }) => !/\b(\w+) \1\b/i.test(r.message)), recs.map(({ r }) => r.message).find((m) => /\b(\w+) \1\b/i.test(m)));
const hot = recommend({ business: "restaurant", goal: "automate", budget: "100-300", timing: "now" });
t("in-budget + this month = hot, Starter for automation", hot.temperature === "hot" && hot.plan === "Starter" && hot.links[0].path === "/niche/restaurant");
const cool = recommend({ business: "other", goal: "unsure", budget: "unsure", timing: "exploring" });
t("unsure + exploring = cool, call first, no plan", cool.temperature === "cool" && cool.plan === null && /free 30-minute call/.test(cool.message));
t("summary has the fields the dashboard reads", summaryField(hot.summary, "Goal") === "Reply & book automatically" && summaryField(hot.summary, "Lead") === "hot" && summaryField(hot.summary, "Business") === "Restaurant, café or food");
t("profile text for the AI", profileText({ business: "gym", goal: "social" }) === "business: Gym or fitness; goal: Grow on social media");
t("questions in order: business, goal, budget, timing", QUESTIONS.map((q) => q.key).join() === "business,goal,budget,timing");
t("every business maps to a real industry page or none", BUSINESSES.every((b) => b.niche === null || NICHES.some((n) => n.slug === b.niche)));

// ── WhatsApp follow-ups
t("Nigerian 0-numbers become +234", waNumber("0803 123 4567").digits === "2348031234567" && waNumber("0803 123 4567").ok);
t("international numbers kept", waNumber("+1 (415) 555-0100").digits === "14155550100" && waNumber("0044 20 7946 0958").digits === "442079460958");
t("too short / no country code flagged", !waNumber("12345").ok && !waNumber("0123456789").ok && !waNumber("").ok);
const audit: FollowLead = { id: "a-1", kind: "Website audit", name: "Ada Obi", whatsapp: "08031234567", created_at: "2026-11-01T10:00:00Z", meta: { url: "adashop.com", score: "54" } };
const m1 = messageFor(audit, 1, "https://emmaforyou.lovable.app");
t("step 1 uses only the lead's own details", /^Hi Ada, it's Emmanuel from EmmaForYou\./.test(m1) && /adashop\.com/.test(m1) && /54\/100/.test(m1) && /https:\/\/emmaforyou\.lovable\.app\/book/.test(m1), m1);
t("unknown kinds get a safe generic message", /Thanks for reaching out through your mystery form/.test(messageFor({ id: "t-1", kind: "Mystery form", name: "", created_at: "2026-11-01T10:00:00Z" }, 1)));
t("no invented numbers in messages", !/\d+%|\d+x\b/i.test(messageFor({ id: "t-2", kind: "ROI calculator", name: "Bo", created_at: "2026-11-01T10:00:00Z" }, 1) + messageFor(audit, 2) + messageFor(audit, 3)));
t("wa.me link encodes the message", (waLink(audit, 1) ?? "").startsWith("https://wa.me/2348031234567?text=Hi%20Ada"));
const n0 = new Date("2026-11-01T12:00:00Z");
t("new lead: step 1 due now", plan(audit, undefined, n0).bucket === "due" && plan(audit, undefined, n0).nextStep === 1);
t("step 1 sent: step 2 waits 2 days", plan(audit, { lead_key: "a-1", step: 1, outcome: "open", last_sent_at: "2026-11-01T12:00:00Z" }, n0).bucket === "waiting" && plan(audit, { lead_key: "a-1", step: 1, outcome: "open", last_sent_at: "2026-11-01T12:00:00Z" }, new Date("2026-11-03T12:01:00Z")).bucket === "due");
t("step 3 waits 5 days after step 2", plan(audit, { lead_key: "a-1", step: 2, outcome: "open", last_sent_at: "2026-11-03T12:00:00Z" }, new Date("2026-11-07T12:00:00Z")).bucket === "waiting" && plan(audit, { lead_key: "a-1", step: 2, outcome: "open", last_sent_at: "2026-11-03T12:00:00Z" }, new Date("2026-11-08T12:01:00Z")).nextStep === 3);
t("replied / all sent = done", plan(audit, { lead_key: "a-1", step: 1, outcome: "replied", last_sent_at: null }, n0).bucket === "done" && plan(audit, { lead_key: "a-1", step: 3, outcome: "open", last_sent_at: null }, n0).bucket === "done");

// ── industry landing pages
t("every industry has landing content", NICHES.every((n) => INDUSTRY_LANDING[n.slug]));
t("one fix per problem", NICHES.every((n) => INDUSTRY_LANDING[n.slug].fixes.length === n.problems.length));
t("projects are real portfolio entries", Object.values(INDUSTRY_LANDING).every((l) => l.projects.every((p) => PROJECTS.some((x) => x.name === p))));
t("projectsFor returns outcomes from portfolio-data", projectsFor("restaurant").map((p) => p.outcome).join() === PROJECTS.filter((p) => ["Spice Restaurant", "Kitchen.ng"].includes(p.name)).map((p) => p.outcome).join());
t("services for pricing exist", Object.values(INDUSTRY_LANDING).every((l) => EXPERTISE.some((e) => e.slug === l.service)), Object.values(INDUSTRY_LANDING).map((l) => l.service).filter((s) => !EXPERTISE.some((e) => e.slug === s)));
t("Ask Emma preset is a valid business", Object.values(INDUSTRY_LANDING).every((l) => BUSINESSES.some((b) => b.id === l.business)));
t("prototype link pre-fills the builder", prototypeLink("salon").startsWith("/?proto_kind=app&proto_idea=") && prototypeLink("salon").endsWith("#prototype") && decodeURIComponent(prototypeLink("salon")).includes("salon booking app"));
t("landing FAQs and WhatsApp text have no numbers or promises", Object.values(INDUSTRY_LANDING).every((l) => !/\d+%|\d+x\b|guarantee/i.test(JSON.stringify([l.faqs, l.fixes, l.whatsapp]))));

for (const [name, ok, info] of R) if (!ok) console.log("FAIL", name, info === undefined ? "" : JSON.stringify(info));
console.log(`${R.filter((r) => r[1]).length}/${R.length} passed`);
if (R.some((r) => !r[1])) process.exit(1);
