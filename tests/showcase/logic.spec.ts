/** Unit checks for the public showcase helpers (industry detection, privacy scrubbing, titles, signing format).
 *  Run: esbuild tests/showcase/logic.spec.ts --bundle --platform=node --alias:@=./src | node */
import { DEFAULT_SHOW, KIND_LABEL, detectIndustry, genericTitle, industryName, scrub, showcaseRequestSchema, stableStringify, unsuitable } from "@/lib/showcase";
import { NICHES } from "@/lib/niches";
import { signContent, verifyContent } from "@/lib/ai/content-sign";
import { buildShowcaseItem } from "@/lib/showcase-build";

const R: [string, boolean, unknown?][] = [];
const t = (n: string, ok: boolean, info?: unknown) => R.push([n, ok, info]);

// ── industry detection
const cases: [string, string | null][] = [
  ["A booking app for my hair salon in Lekki", "salon"],
  ["Barbershop queue app", "salon"],
  ["Menu and ordering site for a jollof restaurant", "restaurant"],
  ["Dental clinic appointment reminders", "clinic"],
  ["Shortlet apartments listing website", "real-estate"],
  ["Ankara fashion boutique store", "fashion-store"],
  ["Online tutoring academy for students", "school"],
  ["Yoga studio class booking", "gym"],
  ["Personal trainer client app", "gym"],
  ["Business coaching website", "coach"],
  ["Small hotel and guest house booking", "hotel"],
  ["Used car dealership inventory", "auto-dealer"],
  ["We need more space for our current team", null],
  ["A different kind of app", null],
];
for (const [text, want] of cases) {
  const got = detectIndustry(text);
  const valid = want === null || NICHES.some((n) => n.slug === want);
  t(`industry: ${text}`, !valid || got === want, { got, want });
}
t("industry: empty input", detectIndustry(undefined, null, "") === null);
t("industryName known/unknown", !!industryName("salon") && industryName("nope") === null && industryName(null) === null);

// ── scrubbing
const s1 = scrub("Call 0803 123 4567 or +234 (0) 803-123-4567, mail ada@shop.ng, see www.adashop.com and adashop.ng/menu");
t("scrub phones", !/\d{7,}/.test(s1.replace(/\D/g, " ").replace(/\s+/g, "")) || !/803/.test(s1), s1);
t("scrub email", !s1.includes("@") && s1.includes("[email]"), s1);
t("scrub links", !/adashop/i.test(s1) && s1.includes("[link]"), s1);
t("scrub keeps short numbers (prices, years)", scrub("Grow to 40 clients by 2027 at $799").includes("40") && scrub("Grow to 40 clients by 2027 at $799").includes("2027"));
t("scrub names case-insensitive", scrub("Welcome to Mama Put Kitchen! mama put kitchen loves you", { names: ["Mama Put Kitchen"] }) === "Welcome to [business]! [business] loves you");
t("scrub ignores 1-2 letter names", scrub("A big day", { names: ["A"] }) === "A big day");
t("scrub escapes regex in names", scrub("Hi (Ada+Co)", { names: ["(Ada+Co)"] }) === "Hi [business]");
t("scrub max length with ellipsis", scrub("x".repeat(500), { max: 50 }).length === 50 && scrub("x".repeat(500), { max: 50 }).endsWith("…"));

t("scrub keeps paragraphs", scrub("Hi there,\n\nPara one.   More.\n\n\n\nBest,\nAda", { max: 500 }) === "Hi there,\n\nPara one. More.\n\nBest,\nAda");
t("scrub people get their own label, whole words only", scrub("I'm Ada from Crumb Corner. Adapt fast. Warmly, Ada", { names: ["Crumb Corner"], people: ["Ada"] }) === "I'm [your name] from [business]. Adapt fast. Warmly, [your name]");

// ── blocklist
t("unsuitable catches profanity", unsuitable("this is shit"));
t("unsuitable catches betting", unsuitable(undefined, "Casino promo app"));
t("unsuitable allows normal text", !unsuitable("Bar and grill booking", "Spa menu"));

// ── stable stringify
t("stable: key order irrelevant", stableStringify({ b: 1, a: [2, { d: 1, c: 2 }] }) === stableStringify({ a: [2, { c: 2, d: 1 }], b: 1 }));
t("stable: undefined keys dropped", stableStringify({ a: 1, b: undefined }) === stableStringify({ a: 1 }));
t("stable: matches JSON for primitives", stableStringify("x") === '"x"' && stableStringify(3) === "3" && stableStringify(null) === "null");

// ── titles
t("title: salon app", genericTitle("app", "salon") === `${industryName("salon")!.replace(/ & .*/, "").replace(/ies$/, "y").replace(/s$/, "")} app`, genericTitle("app", "salon"));
t("title: no industry", genericTitle("audit", null) === KIND_LABEL.audit.one);
t("title: extra appended and capped", genericTitle("emails", "restaurant", "Welcome").endsWith(": Welcome") && genericTitle("plan", null, "y".repeat(200)).length <= 90);
t("title: every niche gives a clean title", NICHES.every((n) => /^[A-Z]/.test(genericTitle("website", n.slug)) && !/\s{2}/.test(genericTitle("website", n.slug))), NICHES.map((n) => genericTitle("website", n.slug)));

// ── defaults and validation
t("defaults: existing-site tools off", DEFAULT_SHOW.audit === false && DEFAULT_SHOW.makeover === false && DEFAULT_SHOW.app && DEFAULT_SHOW.plan);
t("schema: rejects bad sig", !showcaseRequestSchema.safeParse({ kind: "app", sig: "nope", content: {} }).success);
t("schema: rejects unknown kind", !showcaseRequestSchema.safeParse({ kind: "video", sig: "a".repeat(64), content: {} }).success);
const ok = showcaseRequestSchema.safeParse({ kind: "plan", sig: "a".repeat(64), content: {} });
t("schema: defaults", ok.success && ok.data.lang === "en" && ok.data.showBusiness === false && ok.data.showSite === false);

// ── building the public item for every kind (the server's real code path, minus the database)
const base = { sig: "a".repeat(64), lang: "en", showBusiness: false, showSite: false } as const;
const B = (x: Record<string, unknown>) => buildShowcaseItem(showcaseRequestSchema.parse({ ...base, ...x }));
const HTML = "<!doctype html><html><body><h1>Crumb Corner</h1></body></html>";
const em = B({ kind: "emails", business: "Crumb Corner", content: { businessName: "Crumb Corner", ownerName: "Ada", businessType: "bakery", goal: "Welcome", emails: [{ day: 0, subject: "Welcome to Crumb Corner", preview: "Hi", body: "Hi {first_name},\n\nI'm Ada from Crumb Corner. Call 0803 123 4567.\n\nWarmly,\nAda" }] } });
t("build emails: title from business type", !("error" in em) && em.title === "Bakery email sequence: Welcome", em);
const body = !("error" in em) ? String(((em.payload.emails as { body: string }[])[0]).body) : "";
t("build emails: paragraphs kept, names/phone hidden", body.includes("\n\n") && body.includes("[your name] from [business]") && body.includes("[phone]") && !/Crumb|Ada\b|0803/.test(body), body);
const em2 = B({ kind: "emails", business: "Crumb Corner", showBusiness: true, content: { businessName: "Crumb Corner", ownerName: "Ada", businessType: "bakery", goal: "Welcome", emails: [{ day: 0, subject: "Hi from Ada", preview: "", body: "Ada here" }] } });
t("build emails: business shown when ticked, owner never", !("error" in em2) && em2.title.startsWith("Crumb Corner") && JSON.stringify(em2.payload).includes("[your name]") && !JSON.stringify(em2.payload).includes("Ada"), em2);
const pl = B({ kind: "plan", content: { role: "Founder", goal: "10 customers", plan: { headline: "Build a Repeat-Customer\nHome Bakery", northStar: "10 regulars", milestones: [{ outcome: "o", measure: "m" }], weeks: [{ focus: "f", actions: ["a"] }], habits: ["h"] } } });
t("build plan: '90-day plan: headline' on one line", !("error" in pl) && pl.title === "90-day plan: Build a Repeat-Customer Home Bakery", pl);
const au = B({ kind: "audit", showSite: true, content: { host: "example.com", score: 62, pillars: { speed: 50 }, headline: "Slow", summary: "S", priorities: [{ title: "Fix", impact: "high" }] } });
t("build audit: host only when it's theirs", !("error" in au) && au.title === "example.com: 62/100" && (au.payload as { host?: string }).host === "example.com");
const au2 = B({ kind: "audit", content: { host: "example.com", score: 62, pillars: {}, headline: "Slow", summary: "S", priorities: [] } });
t("build audit: no host by default", !("error" in au2) && !au2.title.includes("example") && !("host" in au2.payload));
const ap = B({ kind: "app", prompt: "Booking app for my salon, call 08031234567", content: { html: HTML, platform: "android" } });
t("build app: html kept, prompt scrubbed, platform", !("error" in ap) && String(ap.payload.html).includes("<h1>") && ap.payload.platform === "android" && !String(ap.summary).includes("0803") && ap.industry === "salon", ap);
const ws = B({ kind: "website", prompt: "Menu site", content: { html: HTML, pages: ["Home", "Menu"] } });
t("build website: pages kept", !("error" in ws) && JSON.stringify(ws.payload.pages) === '["Home","Menu"]');
const mk = B({ kind: "makeover", prompt: "", content: { html: HTML, style: "luxury" } });
t("build makeover", !("error" in mk) && mk.summary === "Style: luxury");
const big = B({ kind: "website", content: { html: "<!doctype html><html><body>" + "x".repeat(180000) + "</body></html>" } });
t("build: oversized prototype refused", "error" in big);

// ── signatures (tool output only)
await (async () => {
  const content = { role: "Founder", goal: "10 clients", plan: { northStar: "x", milestones: [{ month: 1 }] } };
  const sig = await signContent("plan", content);
  t("sign: 64 hex", /^[a-f0-9]{64}$/.test(sig));
  t("verify: same content in another key order", await verifyContent("plan", { plan: { milestones: [{ month: 1 }], northStar: "x" }, goal: "10 clients", role: "Founder" }, sig));
  t("verify: edited content fails", !(await verifyContent("plan", { ...content, goal: "100 clients" }, sig)));
  t("verify: other kind fails", !(await verifyContent("emails", content, sig)));
  t("verify: bad sig fails", !(await verifyContent("plan", content, "0".repeat(64))));
})();

for (const [name, pass, info] of R) if (!pass) console.log("FAIL", name, info === undefined ? "" : JSON.stringify(info));
console.log(`${R.filter((r) => r[1]).length}/${R.length} passed`);
if (R.some((r) => !r[1])) process.exit(1);
