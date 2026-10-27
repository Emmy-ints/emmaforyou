// Search/AEO/GEO/release unit tests. Bundled and run inside Chromium (DOMParser available).
import * as M from "../../src/lib/search/metrics";
import { classifyChannel, summarizeTraffic, type EventRow } from "../../src/lib/search/traffic";
import { validateChecks, nextHop, readHtml, robotsAllows } from "../../src/lib/search/http-check-core";
import { sampleHealth, decide, smokeFromHttp, SMOKE_ROUTES, sameCommit, type HealthSample } from "../../src/lib/search/release";
import { inspectDocument, normalisePath, type PageRecord } from "../../src/lib/search/inspect";
import { searchChecks, checkEntity, sitemapPathsFromXml } from "../../src/lib/search/checks";

const results: { name: string; ok: boolean; info?: string }[] = [];
const t = (name: string, ok: boolean, info = "") => results.push({ name, ok, info });
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const near = (a: number | null, b: number) => a !== null && Math.abs(a - b) < 1e-9;

export async function run() {
  // ---------------- metrics
  t("CTR 1,200 / 40,000 = 3 %", near(M.ctr(1200, 40000), 3));
  t("CTR with 0 impressions is null (N/A), not 0 or Infinity", M.ctr(5, 0) === null);
  t("CTR with missing data is null", M.ctr(null, 100) === null && M.ctr(10, undefined) === null);
  t("weighted position Σ(P·I)/ΣI", near(M.weightedPosition([{ position: 2, impressions: 100 }, { position: 10, impressions: 300 }]), 8));
  t("weighted position ignores 0-impression rows; none → null", M.weightedPosition([{ position: 3, impressions: 0 }]) === null);
  t("change 120 vs 100 = +20 / +20 %", eq(M.change(120, 100), { absolute: 20, percent: 20, label: null }));
  t("change vs negative previous uses |previous|", near(M.change(-5, -10).percent, 50));
  t("change from 0 → 'new', no division", eq(M.change(7, 0), { absolute: 7, percent: null, label: "new" }));
  t("change 0 vs 0 → not comparable", M.change(0, 0).label === "not comparable" && M.change(0, 0).percent === null);
  t("change with a missing value → not comparable", M.change(null, 5).label === "not comparable");
  t("conversion rate 3 / 150 = 2 %", near(M.conversionRate(3, 150), 2));
  t("qualified-lead rate 0 / 0 → null", M.qualifiedLeadRate(0, 0) === null);
  t("real zero stays 0 (0 / 10 = 0 %)", M.leadRate(0, 10) === 0);
  t("cost per lead null without spend", M.costPerLead(null, 4) === null && M.costPerLead(200, 0) === null && M.costPerLead(200, 4) === 50);
  t("revenue per session", M.revenuePerSession(500, 250) === 2 && M.revenuePerSession(500, 0) === null);
  t("content age in days", M.contentAgeDays("2026-10-01T00:00:00Z", new Date("2026-10-27T00:00:00Z")) === 26 && M.contentAgeDays(null) === null && M.contentAgeDays("not a date") === null);
  t("orphan rate 9 / 397", near(M.orphanRate(9, 397), (9 / 397) * 100));
  t("indexable coverage excludes unknown (denominator = known only)", near(M.indexableCoverage(30, 40), 75) && M.indexableCoverage(0, 0) === null);
  t("redirect chain rate with no redirects → N/A", M.redirectChainRate(0, 0) === null);
  t("AI mention / citation / support / page coverage", near(M.mentionRate(3, 12), 25) && near(M.citationRate(1, 12), 100 / 12) && M.citationSupportRate(0, 0) === null && near(M.citationPageCoverage(2, 8), 25));
  t("priority score 0–100 with documented weights", near(M.priorityScore({ business: 100, demand: 100, opportunity: 100, conversion: 100, confidence: 100 }), 100) && near(M.priorityScore({ business: 80, demand: 50, opportunity: 40, conversion: 60, confidence: 70 }), 0.25 * 80 + 0.2 * 50 + 0.2 * 40 + 0.15 * 60 + 0.2 * 70));
  t("priority score with a missing input is incomplete (null), never filled with 100", M.priorityScore({ business: 80, demand: null, opportunity: 40, conversion: 60, confidence: 70 }) === null);
  t("priority inputs are clamped to 0–100", near(M.priorityScore({ business: 300, demand: -20, opportunity: 0, conversion: 0, confidence: 0 }), 25));
  t("effort-adjusted S / (max(E,1)/10)", near(M.effortAdjusted(60, 5), 120) && near(M.effortAdjusted(60, 0), 600) && M.effortAdjusted(null, 3) === null);
  t("backoff min(dmax, d0·2ⁿ)", M.backoffDelay(0, 2000, 30000) === 2000 && M.backoffDelay(3, 2000, 30000) === 16000 && M.backoffDelay(10, 2000, 30000) === 30000);
  t("backoff jitter stays within ±jitter", [0, 0.5, 1].every((r) => { const d = M.backoffDelay(2, 1000, 30000, 200, () => r); return d >= 3800 && d <= 4200; }));
  t("fmtPct shows N/A for null", M.fmtPct(null) === "N/A" && M.fmtPct(12.345) === "12.3 %");

  // ---------------- traffic attribution
  t("google.com → organic search (Google)", eq(classifyChannel("google.com"), { channel: "organic_search", source: "Google" }));
  t("google.co.uk and bing.com", classifyChannel("google.co.uk").channel === "organic_search" && classifyChannel("bing.com").source === "Bing");
  t("chatgpt.com → AI assistant", eq(classifyChannel("chatgpt.com"), { channel: "ai_assistant", source: "ChatGPT" }));
  t("utm_source=chatgpt.com (ChatGPT adds this) → AI assistant", classifyChannel(null, "chatgpt.com", null).channel === "ai_assistant");
  t("perplexity / copilot / gemini", classifyChannel("perplexity.ai").source === "Perplexity" && classifyChannel("copilot.microsoft.com").source === "Microsoft Copilot" && classifyChannel("gemini.google.com").source === "Gemini");
  t("gemini.google.com isn't counted as Google search", classifyChannel("gemini.google.com").channel === "ai_assistant");
  t("utm_medium=cpc → paid even from google.com", classifyChannel("google.com", "google", "cpc").channel === "paid");
  t("facebook / t.co → social", classifyChannel("m.facebook.com").channel === "social" && classifyChannel("t.co").channel === "social");
  t("unknown site → referral; none → direct", classifyChannel("example.org").channel === "referral" && classifyChannel(null).channel === "direct");
  const ev = (s: string, e: string, at: string, ref: string | null = null, path = "/"): EventRow => ({ session_id: s, event: e, created_at: at, referrer: ref, utm_source: null, utm_medium: null, path });
  const rows: EventRow[] = [
    ev("s1aaaaaa", "page_view", "2026-10-20T10:00:00Z", "google.com", "/services"), ev("s1aaaaaa", "lead_submitted", "2026-10-20T10:05:00Z"), ev("s1aaaaaa", "lead_submitted", "2026-10-20T10:06:00Z"),
    ev("s2aaaaaa", "page_view", "2026-10-21T10:00:00Z", "chatgpt.com", "/pricing"), ev("s2aaaaaa", "whatsapp_click", "2026-10-21T10:01:00Z"),
    ev("s3aaaaaa", "page_view", "2026-10-22T10:00:00Z", null), ev("s3aaaaaa", "page_view", "2026-10-22T10:02:00Z", "google.com"),
    ev("s4aaaaaa", "page_view", "2026-09-01T10:00:00Z", "google.com"),
  ];
  const sum = summarizeTraffic(rows, "2026-10-01T00:00:00Z", "2026-11-01T00:00:00Z");
  const org = sum.channels.find((c) => c.channel === "organic_search")!;
  t("sessions in window only (s4 outside)", sum.sessions === 3);
  t("a session's channel comes from its first event (s3 stays direct)", sum.channels.find((c) => c.channel === "direct")?.sessions === 1);
  t("two lead events in one session count once", org.sessions === 1 && org.enquirySessions === 1 && near(org.enquiryRate, 100));
  t("AI referral session + contact click", sum.aiSources.ChatGPT === 1 && sum.channels.find((c) => c.channel === "ai_assistant")?.contactSessions === 1);
  t("landing page recorded per session", org.landing["/services"] === 1);
  t("empty window: no channels, no rates invented", summarizeTraffic([], "2026-10-01T00:00:00Z", "2026-11-01T00:00:00Z").channels.length === 0);

  // ---------------- HTTP checker input + robots
  t("accepts site paths", validateChecks({ checks: [{ path: "/" }, { path: "/blog?page=2" }, { path: "/x", crawler: "oai-searchbot" }] }).ok);
  t("refuses absolute URLs (no SSRF)", !validateChecks({ checks: [{ path: "http://169.254.169.254/" }] }).ok);
  t("refuses protocol-relative //host", !validateChecks({ checks: [{ path: "//evil.example/x" }] }).ok);
  t("refuses path traversal and backslashes", !validateChecks({ checks: [{ path: "/a/../../etc" }] }).ok && !validateChecks({ checks: [{ path: "/a\\b" }] }).ok);
  t("refuses unknown crawlers and >30 checks", !validateChecks({ checks: [{ path: "/", crawler: "evilbot" }] }).ok && !validateChecks({ checks: Array.from({ length: 31 }, () => ({ path: "/" })) }).ok);
  t("same-origin Location is followed", nextHop("/pricing?x=1", "https://emmaforyou.lovable.app/old", "https://emmaforyou.lovable.app") === "https://emmaforyou.lovable.app/pricing?x=1");
  t("off-site Location is not followed", nextHop("https://evil.example/", "https://emmaforyou.lovable.app/old", "https://emmaforyou.lovable.app") === null);
  const h = readHtml(`<html><head><title>Hi &amp; bye</title><meta name="robots" content="noindex, follow"><link rel="canonical" href="https://x/a"><script type="application/ld+json">{}</script></head><body><h1>A</h1><h1 class="x">B</h1></body></html>`);
  t("server HTML reader", h.title === "Hi & bye" && h.robots === "noindex, follow" && h.canonical === "https://x/a" && h.h1 === 2 && h.jsonld === 1);
  const robots = "User-agent: *\nAllow: /\nDisallow: /dashboard\nDisallow: /api/\n\nUser-agent: GPTBot\nDisallow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\nDisallow: /dashboard\n";
  t("robots: * allowed on /services, blocked on /dashboard/site", robotsAllows(robots, "Googlebot", "/services").allowed && !robotsAllows(robots, "Googlebot", "/dashboard/site").allowed);
  t("robots: named group wins (GPTBot blocked, OAI-SearchBot allowed)", !robotsAllows(robots, "GPTBot", "/").allowed && robotsAllows(robots, "OAI-SearchBot", "/pricing").allowed && robotsAllows(robots, "OAI-SearchBot", "/pricing").group === "OAI-SearchBot");
  t("robots: longest match wins", robotsAllows("User-agent: *\nDisallow: /a\nAllow: /a/b\n", "x", "/a/b/c").allowed && !robotsAllows("User-agent: *\nDisallow: /a\nAllow: /a/b\n", "x", "/a/c").allowed);
  t("robots: wildcard and $", !robotsAllows("User-agent: *\nDisallow: /*.pdf$\n", "x", "/f/x.pdf").allowed && robotsAllows("User-agent: *\nDisallow: /*.pdf$\n", "x", "/f/x.pdf?y").allowed);

  // ---------------- release verification
  const mk = (commit: string | null, dep = "d1"): HealthSample => ({ at: "", commit, deploymentId: dep, identity: commit ? "ok" : "unavailable", instance: "i", status: 200 });
  const run1 = async (seq: (string | null)[], extra: Partial<Parameters<typeof sampleHealth>[0]> = {}) => { let i = 0; let clock = 0; return sampleHealth({ expected: "abc1234", fetchSample: async () => ({ sample: mk(seq[Math.min(i++, seq.length - 1)]), body: { identity: "ok" } }), windowSize: 6, perRound: 2, maxMs: 60000, sleep: async (ms) => { clock += ms; }, now: () => clock, ...extra }); };
  const ok1 = await run1(["abc1234"]);
  t("all samples on the expected commit → verified", decide(ok1, []).state === "verified_live" && ok1.samples === 6 && ok1.matching === 6, JSON.stringify(decide(ok1, []).reasons));
  const roll = await run1(["0ld0000", "0ld0000", "0ld0000", "abc1234"]);
  t("old build during rollout is recorded, then a clean window verifies", roll.rollout.length === 3 && decide(roll, []).state === "verified_live");
  const flap = await run1(["abc1234", "abc1234", "0ld0000", "abc1234"]);
  t("a different build inside the window fails (instances disagree)", decide(flap, []).state === "verification_failed" && flap.mismatches >= 1, decide(flap, []).reasons.join(" "));
  const never = await run1(["0ld0000"]);
  t("expected commit never seen → failed with the exact mismatch", decide(never, []).state === "verification_failed" && /0ld0000/.test(decide(never, []).reasons.join(" ")) && never.timedOut);
  const unknown = await run1([null]);
  t("missing build identity is never a match", decide(unknown, []).state === "verification_failed" && !sameCommit(null, "abc1234") && !sameCommit("unknown", "unknown"));
  t("a failed mandatory smoke test blocks verified_live", decide(ok1, [{ name: "Homepage", ok: false, mandatory: true, detail: "HTTP 500" }]).state === "verification_failed");
  t("an optional or N/A check doesn't block", decide(ok1, [{ name: "x", ok: false, mandatory: false, detail: "" }, { name: "y", ok: false, mandatory: true, na: true, detail: "no live redirects" }]).state === "verified_live");
  t("unknown expected commit can't verify", decide({ ...ok1, expected: "unknown" }, []).state === "verification_failed");
  const home = SMOKE_ROUTES[0];
  t("smoke: homepage 200 with 1 h1, canonical and JSON-LD passes", smokeFromHttp(home, { finalStatus: 200, redirects: 0, html: { h1: 1, robots: "index, follow", canonical: "https://x/", jsonld: 3 } }).ok);
  t("smoke: noindex on the homepage fails", !smokeFromHttp(home, { finalStatus: 200, redirects: 0, html: { h1: 1, robots: "noindex", canonical: "https://x/", jsonld: 3 } }).ok);
  t("smoke: unknown route must be 404, not a soft 200", !smokeFromHttp(SMOKE_ROUTES.find((s) => s.expect.status === 404)!, { finalStatus: 200, redirects: 0 }).ok);
  t("smoke: private page must carry noindex", !smokeFromHttp(SMOKE_ROUTES.find((s) => s.path === "/login")!, { finalStatus: 200, redirects: 0, html: { h1: 1, robots: "index", canonical: "", jsonld: 0 } }).ok);

  // ---------------- inspect + checks (DOM)
  const O = "https://site.test";
  t("normalisePath strips origin, query, hash, trailing slash; rejects other origins", normalisePath("https://site.test/a/b/?x=1#y", O) === "/a/b" && normalisePath("/", O) === "/" && normalisePath("https://other.test/a", O) === null && normalisePath("mailto:x@y", O) === null);
  const page = (path: string, head: string, body: string, status = 200): PageRecord => ({ ...inspectDocument(new DOMParser().parseFromString(`<html lang="en"><head>${head}</head><body>${body}</body></html>`, "text/html"), path, O), status, finalPath: path, redirected: false, ms: 1 });
  const std = (path: string, extra = "") => `<title>${path} page</title><meta name="description" content="About ${path}"><meta name="robots" content="index, follow"><link rel="canonical" href="${O}${path === "/" ? "/" : path}"><meta property="og:title" content="t"><meta property="og:image" content="${O}/og.png"><meta property="og:url" content="${O}${path === "/" ? "/" : path}">${extra}`;
  const ld = (o: unknown) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;
  const pages = [
    page("/", std("/", ld({ "@context": "https://schema.org", "@type": "Organization", "@id": `${O}/#org`, name: "X", url: O }) + `<link rel="alternate" hreflang="en" href="${O}/"><link rel="alternate" hreflang="fr" href="${O}/fr"><link rel="alternate" hreflang="x-default" href="${O}/">`), `<main><h1>Home</h1><a href="/a">A</a><a href="/b/">B</a><a href="/gone">G</a><a href="/old">O</a></main>`),
    page("/fr", std("/fr", `<link rel="alternate" hreflang="en" href="${O}/"><link rel="alternate" hreflang="x-default" href="${O}/">`), `<h1>FR</h1>`),
    page("/a", std("/a", ld({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: `${O}/` }, { "@type": "ListItem", position: 3, name: "A" }] })), `<h1>A</h1>`),
    page("/b", std("/b", `<script type="application/ld+json">{bad json</script>`).replace(`${O}/b"`, `${O}/"`), `<h1>B</h1>`),
    page("/orphan", std("/orphan"), `<h1>O</h1>`),
    page("/gone", "", "", 404),
    { ...page("/old", std("/pricing"), "<h1>P</h1>"), finalPath: "/pricing", redirected: true },
  ];
  const { findings, metrics } = searchChecks(pages, { origin: O, sitemap: ["/", "/fr", "/a", "/b", "/orphan", "/gone"] });
  const has = (type: string, route?: string) => findings.some((f) => f.type === type && (!route || f.route === route));
  t("canonical pointing an unrelated page at the homepage is high", has("canonical-home", "/b") && findings.find((f) => f.type === "canonical-home")!.severity === "high");
  t("invalid JSON-LD is reported", has("schema-parse", "/b"));
  t("breadcrumb position gap is an error", findings.some((f) => f.type === "schema-error" && /position 3/.test(f.title)));
  t("sitemap: 404 and non-self canonical fail; valid rate computed", has("sitemap", "/gone") && has("sitemap", "/b") && metrics.sitemapValid === 4 && near(metrics.validSitemapRate, (4 / 6) * 100), String(metrics.sitemapValid));
  t("orphan page detected", has("orphan", "/orphan") && !has("orphan", "/a"));
  t("broken link occurrences and unique destinations", metrics.brokenOccurrences === 1 && metrics.brokenUnique === 1);
  t("link through a redirect reported", has("link-redirect", "/"));
  t("hreflang: /fr doesn't list itself → error", findings.some((f) => f.type === "hreflang" && f.route === "/fr" && /doesn't list itself/.test(f.evidence)));
  t("hreflang: / lists en, fr, x-default and /fr links back to / → no back-link error on /", !findings.some((f) => f.type === "hreflang" && f.route === "/" && /link back/.test(f.evidence)));
  t("schema validity rate counts only pages with schema", metrics.schemaPagesTested === 3 && metrics.schemaPagesPassing === 1, `${metrics.schemaPagesTested}/${metrics.schemaPagesPassing}`);
  t("checkEntity: LocalBusiness without address is an error (no invented address)", checkEntity({ "@type": "LocalBusiness", name: "x", url: O }, O).some((r) => r.level === "error" && /address/.test(r.msg)));
  t("checkEntity: aggregateRating is flagged for review", checkEntity({ "@type": "Service", name: "x", provider: {}, aggregateRating: { ratingValue: 5 } }, O).some((r) => /aggregateRating/.test(r.msg)));
  t("checkEntity: Article dateModified before datePublished is an error", checkEntity({ "@type": "Article", headline: "h", datePublished: "2026-05-01", dateModified: "2026-01-01", author: {}, image: `${O}/i.png` }, O).some((r) => r.level === "error"));
  t("checkEntity: relative url is an error", checkEntity({ "@type": "WebSite", name: "x", url: "/" }, O).some((r) => /absolute/.test(r.msg)));
  t("sitemap XML parsing", eq(sitemapPathsFromXml(`<urlset><url><loc>${O}/</loc></url><url><loc>${O}/a/</loc></url><url><loc>https://other/x</loc></url></urlset>`, O), ["/", "/a"]));

  return results;
}
