/** Unit checks for the public showcase helpers (industry detection, privacy scrubbing, titles, signing format).
 *  Run: esbuild tests/showcase/logic.spec.ts --bundle --platform=node --alias:@=./src | node */
import { DEFAULT_SHOW, KIND_LABEL, detectIndustry, genericTitle, industryName, scrub, showcaseRequestSchema, stableStringify, unsuitable } from "@/lib/showcase";
import { NICHES } from "@/lib/niches";
import { signContent, verifyContent } from "@/lib/ai/content-sign";

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
