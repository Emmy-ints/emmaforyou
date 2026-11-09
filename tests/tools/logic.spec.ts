/** Unit checks for tool upgrades: audit history/compare, email exports + WhatsApp version, receptionist "my business".
 *  Run: esbuild tests/tools/logic.spec.ts --bundle --platform=node --alias:@=./src | node */
import { addSnapshot, compare, headToHead, historyFor, hostOf, type AuditSnapshot } from "@/lib/audit-history";
import { toCsv, toText, toWhatsApp } from "@/lib/email-tools";
import { decodeRoi, encodeRoi, scenarioAssumptions } from "@/lib/roi-share";
import { DEFAULT_ASSUMPTIONS } from "@/lib/roi-model";
import { firstMonday, planProgress, planToIcs } from "@/lib/goal-calendar";
import { businessPrompt, customBusinessSchema, customToBusiness, parseLines, parseServices, receptionistRequestSchema } from "@/lib/receptionist-data";

const R: [string, boolean, unknown?][] = [];
const t = (n: string, ok: boolean, info?: unknown) => R.push([n, ok, info]);

// ── audit history
const P = (n: number) => ({ speed: n, seo: n, mobile: n, conversion: n, trust: n });
t("host: strips www and case", hostOf("https://WWW.Example.com/a") === "example.com" && hostOf("nope") === "");
let all: AuditSnapshot[] = [];
for (let i = 0; i < 15; i++) all = addSnapshot(all, { host: "a.com", at: `2026-11-${String(i + 1).padStart(2, "0")}T00:00:00Z`, score: 40 + i, pillars: P(40 + i) });
all = addSnapshot(all, { host: "b.com", at: "2026-11-01T00:00:00Z", score: 70, pillars: P(70) });
t("history: capped at 12 per site, oldest dropped", historyFor(all, "a.com").length === 12 && historyFor(all, "a.com")[0].score === 43);
t("history: other sites untouched", historyFor(all, "b.com").length === 1);
t("history: same timestamp replaces", historyFor(addSnapshot(all, { host: "b.com", at: "2026-11-01T00:00:00Z", score: 71, pillars: P(71) }), "b.com").length === 1);
const d = compare({ host: "a.com", at: "2026-11-01T00:00:00Z", score: 54, pillars: P(50) }, { host: "a.com", at: "2026-11-08T00:00:00Z", score: 62, pillars: { ...P(50), speed: 70 } });
t("compare: score, pillar and days", d.score === 8 && d.pillars.speed === 20 && d.pillars.seo === 0 && d.days === 7, d);
const h = headToHead({ ...P(60), speed: 90 }, { ...P(60), seo: 80, trust: 70 });
t("head to head", h.aWins === 1 && h.bWins === 2 && h.rows.find((r) => r.pillar === "mobile")?.lead === "tie", h);

// ── email tools
const items = [
  { day: 0, subject: "Welcome to Ada's Kitchen", preview: "Glad you're here", body: "Hi [First name],\n\nThanks for joining us. We cook \"jollof\" the way your mum does.\n\nEvery Friday we share a new dish.\n\nReply to this email and tell us your favourite dish?\n\nBest,\nAda" },
  { day: 2, subject: "x", preview: "", body: "A".repeat(2000) },
];
const wa = toWhatsApp(items[0]);
t("WhatsApp: bold subject, greeting, ask, no sign-off", wa.startsWith("*Welcome to Ada's Kitchen*") && wa.includes("Hi [First name],") && /favourite dish\?/.test(wa) && !/Best,/.test(wa), wa);
t("WhatsApp: capped length", toWhatsApp(items[1]).length <= 700);
const csv = toCsv(items);
t("CSV: header + quoted cells with escaped quotes", csv.startsWith("day,subject,preview,body\r\n") && csv.includes('""jollof""') && csv.split("\r\n").length >= 3);
t("Text export has every subject", toText(items).includes("Subject: Welcome to Ada's Kitchen") && toText(items).includes("---"));

// ── receptionist: my business
const sv = parseServices("Silk press - ₦18,000\nWash & style: 8000\nBraids | from ₦30k\nConsultation\n\n");
t("services: separators and price-less lines", sv.length === 4 && sv[0].price === "₦18,000" && sv[1].name === "Wash & style" && sv[2].price === "from ₦30k" && sv[3].price === "", sv);
t("services: max 15", parseServices(Array.from({ length: 30 }, (_, i) => `S${i} - ${i}`).join("\n")).length === 15);
t("lines: trimmed, max 10", parseLines(" a \n\n b \n" + "x\n".repeat(20)).length === 10 && parseLines(" a \n b").join() === "a,b");
const cb = customBusinessSchema.parse({ name: "Ada's Kitchen", services: sv });
const biz = customToBusiness(cb);
t("custom: defaults fill gaps", biz.id === "custom" && /Not provided/.test(biz.hours) && biz.services.find((s) => s.name === "Consultation")?.price === "price on request" && biz.suggestions.length === 3);
const prompt = businessPrompt(biz, "Monday");
t("custom prompt: owner's details marked as facts, not instructions", /not instructions to you/.test(prompt) && prompt.includes("Silk press: ₦18,000") && !/fictional/.test(prompt));
t("demo prompt unchanged for samples", /fictional/.test(businessPrompt({ ...biz, id: "salon" }, "Monday")));
t("schema: custom requires name", !customBusinessSchema.safeParse({ name: "A" }).success);
t("schema: request accepts custom", receptionistRequestSchema.safeParse({ business: "custom", custom: cb, messages: [{ role: "user", content: "hi" }] }).success);
t("schema: too many services rejected", !customBusinessSchema.safeParse({ name: "Ada", services: Array.from({ length: 16 }, () => ({ name: "a" })) }).success);

// ── goal planner calendar
const plan = { headline: "Get 10 clients, fast; really", northStar: "10 paying clients", milestones: [{ month: 1, outcome: "Offer set", measure: "Price page" }, { month: 2, outcome: "5 clients", measure: "5 paid" }, { month: 3, outcome: "10 clients", measure: "10 paid" }], weeks: Array.from({ length: 12 }, (_, i) => ({ week: i + 1, focus: `Focus ${i + 1}`, actions: ["Do A, then B", "Do C"] })), habits: [], risks: [], checkin: "Friday review" };
t("Monday: Wed → next Mon; Mon stays", firstMonday(new Date(2026, 10, 11)).getDate() === 16 && firstMonday(new Date(2026, 10, 9)).getDate() === 9 && firstMonday(new Date(2026, 10, 15)).getDate() === 16);
const ics = planToIcs(plan, new Date(2026, 10, 11), new Date("2026-11-09T10:00:00Z"));
t("ICS: 12 weeks + 3 milestones", (ics.match(/BEGIN:VEVENT/g) ?? []).length === 15);
t("ICS: first week on Monday 16 Nov, all-day", ics.includes("DTSTART;VALUE=DATE:20261116") && ics.includes("DTEND;VALUE=DATE:20261117"));
t("ICS: escapes commas/semicolons, CRLF, folded lines", ics.includes("Do A\\, then B") && ics.includes("\r\n") && ics.split("\r\n").every((l) => new TextEncoder().encode(l).length <= 75) && ics.includes("X-WR-CALNAME:Get 10 clients\\, fast\\; really"), ics.split("\r\n").find((l) => new TextEncoder().encode(l).length > 75));
t("ICS: reminders", (ics.match(/BEGIN:VALARM/g) ?? []).length === 15);
const pr = planProgress(plan, ["1-0", "1-1", "2-0", "99-0"]);
t("progress ignores unknown keys", pr.done === 3 && pr.total === 24 && pr.pct === 13, pr);

// ── ROI share + scenarios
const IND = ["Salon & beauty", "Restaurant", "Other"];
const st = { currency: "USD" as const, industry: "Salon & beauty", enquiries: 120, missed: 40, closeRate: 25, customerValue: 300, assumptions: { recoveredPercent: 55, closeLiftPercent: 10, extraEnquiriesPercent: 30, rampMonths: 2 }, monthlyFee: 299, setupFee: 500, months: 6 as const };
const enc = encodeRoi(st);
t("ROI link round-trips", JSON.stringify(decodeRoi(enc, IND)) === JSON.stringify(st), decodeRoi(enc, IND));
t("ROI link: URL-safe after encodeURIComponent", decodeRoi(decodeURIComponent(encodeURIComponent(enc)), IND)?.industry === "Salon & beauty");
t("ROI link: bad input rejected or clamped", decodeRoi("cXXX~e5", IND) === null && decodeRoi("cNGN~m999~iHacker", IND)?.missed === 100 && decodeRoi("cNGN~iHacker", IND)?.industry === "Other" && decodeRoi("x".repeat(500), IND) === null);
t("Scenario expected = defaults", JSON.stringify(scenarioAssumptions("expected")) === JSON.stringify(DEFAULT_ASSUMPTIONS));
const ca = scenarioAssumptions("cautious"), am = scenarioAssumptions("ambitious");
t("Scenarios ordered and bounded", ca.recoveredPercent < DEFAULT_ASSUMPTIONS.recoveredPercent && am.recoveredPercent > DEFAULT_ASSUMPTIONS.recoveredPercent && ca.rampMonths > am.rampMonths && am.recoveredPercent <= 100 && am.rampMonths >= 1, { ca, am });

for (const [name, ok, info] of R) if (!ok) console.log("FAIL", name, info === undefined ? "" : JSON.stringify(info));
console.log(`${R.filter((r) => r[1]).length}/${R.length} passed`);
if (R.some((r) => !r[1])) process.exit(1);
