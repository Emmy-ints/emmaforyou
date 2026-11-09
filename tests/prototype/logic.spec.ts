/** Unit checks for the prototype builder's pure logic. Run: esbuild tests/prototype/logic.spec.ts --bundle --platform=node --alias:@=./src | node */
import { applyLogo, fallbackPlan, normalisePlan, previewDocument, prototypeRequestSchema, shareRequestSchema, suggestPlan, startingPrice } from "@/lib/prototype";
import { buildInstructions, buildUserMessage } from "@/lib/ai/prototype-prompts";
import { servicePrice } from "@/lib/service-pricing";
import { qrMatrix, qrSvg } from "@/lib/qr";
import { TIERS } from "@/lib/pricing-data";

const R: [string, boolean, unknown?][] = [];
const t = (n: string, ok: boolean, info?: unknown) => R.push([n, ok, info]);

// fallback plans pick the right template for any request
const kinds: [string, RegExp][] = [
  ["A delivery app for my restaurant with menu and cart", /Cart/],
  ["Booking app for my barbershop", /Book/],
  ["Church app with sermons and giving", /Sermons/],
  ["School app with timetable and results", /Courses/],
  ["Savings wallet for my cooperative", /Savings/],
  ["Gym app with workouts", /Workouts/],
  ["Something completely different: a pigeon racing club", /Services/],
];
for (const [idea, want] of kinds) {
  const p = fallbackPlan({ idea });
  t(`fallback plan for "${idea.slice(0, 30)}…"`, p.screens.length >= 3 && p.screens.some((s) => want.test(s.name)), p.screens.map((s) => s.name));
}
t("fallback plan uses the business name and brand colour", (() => { const p = fallbackPlan({ idea: "a shop app for shoes", business: "Kicks NG", color: "#123456" }); return p.name === "Kicks NG" && p.primary === "#123456"; })());

// AI plans are normalised: ids, uniqueness, limits, colours
const n = normalisePlan({ name: "X", primary: "red", accent: "#00ff00", screens: [{ name: "Home Page!" }, { name: "Home Page!" }, { id: "9bad", name: "Cart" }, ...Array(8).fill({ name: "More" })], features: ["a", "", "b"] }, { idea: "an app for my food store" });
t("normalised ids are valid and unique", n.screens.every((s) => /^[a-z][a-z0-9-]{0,23}$/.test(s.id)) && new Set(n.screens.map((s) => s.id)).size === n.screens.length, n.screens.map((s) => s.id));
t("normalised plan keeps at most 6 screens", n.screens.length === 6);
t("invalid colour falls back, valid one kept", /^#[0-9a-f]{6}$/i.test(n.primary) && n.primary !== "red" && n.accent === "#00ff00");
t("empty features dropped", n.features.join() === "a,b");
t("garbage plan → fallback", normalisePlan(null, { idea: "a church app" }).screens.length >= 3);

// requests
t("app request needs a plan", !prototypeRequestSchema.safeParse({ kind: "app", prompt: "an app for my salon" }).success);
t("app refinement doesn't need a plan", prototypeRequestSchema.safeParse({ kind: "app", prompt: "an app for my salon", html: "<html></html>", refinement: "make it blue" }).success);
t("website pages must be known", !prototypeRequestSchema.safeParse({ kind: "website", prompt: "a site for my salon", pages: ["Home", "Casino"] }).success);
const share = { kind: "app", prompt: "an app for my salon", html: "<html>" + "x".repeat(60) + "</html>", sig: "a".repeat(64), name: "Ada", consent: true };
t("share needs WhatsApp or email", !shareRequestSchema.safeParse(share).success && shareRequestSchema.safeParse({ ...share, whatsapp: "+234 803 000 0000" }).success);
t("share needs consent", !shareRequestSchema.safeParse({ ...share, email: "a@b.co", consent: false }).success);
t("share refuses non-image logos", !shareRequestSchema.safeParse({ ...share, email: "a@b.co", logo: "data:text/html;base64,PHNjcmlwdD4=" }).success);

// prompts
const appIn = prototypeRequestSchema.parse({ kind: "app", prompt: "food app", language: "fr", plan: fallbackPlan({ idea: "food delivery app" }) });
t("app instructions: no phone chrome, router, tab bar, splash, language", /Do NOT draw a phone frame/.test(buildInstructions(appIn)) && /tab bar/.test(buildInstructions(appIn)) && /splash/.test(buildInstructions(appIn)) && /French/.test(buildInstructions(appIn)));
t("app message lists every screen and feature", (() => { const m = buildUserMessage(appIn); return appIn.plan!.screens.every((s) => m.includes(s.id)) && appIn.plan!.features.every((f) => m.includes(f)); })());
const webIn = prototypeRequestSchema.parse({ kind: "website", prompt: "salon site", pages: ["Home", "Booking"], brand: { name: "Glow", color: "#ff3366" } });
t("website message has pages and brand", /Home, Booking/.test(buildUserMessage(webIn)) && /#ff3366/.test(buildUserMessage(webIn)) && /Glow/.test(buildUserMessage(webIn)));
t("both forbid network and real transactions", [buildInstructions(appIn), buildInstructions(webIn)].every((s) => /no external requests/.test(s) && /Demo/.test(s)));

// preview + logo
const doc = previewDocument("<html><head></head><body><b data-efy-logo>A</b></body></html>", "data:image/png;base64,AAAA");
t("CSP is first in head", /<head><meta http-equiv="Content-Security-Policy"/.test(doc));
t("logo script injected before </body>", /data-efy-logo/.test(doc) && /data:image\/png;base64,AAAA/.test(doc) && doc.indexOf("data:image/png") < doc.lastIndexOf("</body>"));
t("non-image logo ignored", applyLogo("<body></body>", "javascript:alert(1)") === "<body></body>");

// plan suggestions only come from published plans
const pro = TIERS.find((x) => x.name === "Pro")!;
t("website → Pro at the published price", suggestPlan("website", { pages: ["Home", "Shop"] }).price === `$${pro.monthly}/mo` && /shop/.test(suggestPlan("website", { pages: ["Home", "Shop"] }).why));
t("app → Enterprise custom quote", suggestPlan("app", { screens: 5 }).tier === "Enterprise" && suggestPlan("app").price === "Custom quote");
t("starting price is the lowest published plan", startingPrice() === `$${Math.min(...TIERS.filter((x) => x.monthly > 0).map((x) => x.monthly))}/mo`);
t("service prices match plan features", servicePrice("website-landing-pages").amount === `$${pro.monthly}/mo` && servicePrice("social-media-automation").amount === "$99/mo" && servicePrice("app-development").amount === "Custom quote" && servicePrice("copywriting").label === "Packages from");

// QR
const m = qrMatrix("https://emmaforyou.lovable.app/p/AbCd1234XyZ9");
t("QR is square, version 4 (33 modules) for a share link", m.length === 33 && m.every((r) => r.length === 33), m.length);
t("QR finder patterns present", m[0][0] && m[0][6] && m[6][0] && !m[1][1] && m[2][2] && m[0][32] && m[32][0]);
t("QR SVG has quiet zone", /viewBox="0 0 41 41"/.test(qrSvg("https://emmaforyou.lovable.app/p/AbCd1234XyZ9")));
let threw = false; try { qrMatrix("x".repeat(400)); } catch { threw = true; }
t("QR refuses text that's too long", threw);

for (const [name, ok, info] of R) if (!ok) console.log("FAIL", name, info === undefined ? "" : JSON.stringify(info));
console.log(`${R.filter((r) => r[1]).length}/${R.length} passed`);
if (R.some((r) => !r[1])) process.exit(1);
