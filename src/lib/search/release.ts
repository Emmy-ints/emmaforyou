/**
 * Release verification. A deploy is "verified_live" only when the live health endpoint reports the
 * intended commit on every request of a verification window AND every mandatory smoke test passes.
 *
 * Sampling has two phases:
 *  1. rollout: poll with bounded exponential backoff until the expected commit first answers
 *     (old instances are expected here for a few minutes after publishing; they are recorded);
 *  2. window: `windowSize` consecutive samples. Any response from another build inside the window
 *     fails the release — instances disagree, so nothing is claimed.
 * If the expected commit never answers within `maxMs`, the release fails with the exact mismatch.
 */
import { backoffDelay } from "./metrics";

export interface HealthSample { at: string; commit: string | null; deploymentId: string | null; identity: string | null; instance: string | null; status: number; error?: string }
export interface SamplingResult {
  expected: string;
  window: HealthSample[];
  rollout: HealthSample[];
  samples: number; matching: number; mismatches: number;
  observed: Record<string, number>;
  reachedExpected: boolean;
  timedOut: boolean;
  build: Record<string, unknown> | null;
  durationMs: number;
}
export interface SmokeResult { name: string; ok: boolean; mandatory: boolean; detail: string; route?: string; na?: boolean }
export type ReleaseState = "queued" | "building" | "build_failed" | "awaiting_publish" | "publishing" | "verifying" | "verified_live" | "verification_failed" | "rollback_pending" | "rolled_back";

const short = (c: string | null | undefined) => (c ? c.slice(0, 7) : null);
export const sameCommit = (a: string | null | undefined, b: string | null | undefined) => !!a && !!b && a !== "unknown" && b !== "unknown" && (a.startsWith(b) || b.startsWith(a));

export async function sampleHealth(opts: {
  expected: string;
  fetchSample: () => Promise<{ sample: HealthSample; body: Record<string, unknown> | null }>;
  windowSize?: number; perRound?: number; maxMs?: number; d0?: number; dmax?: number;
  sleep?: (ms: number) => Promise<void>; now?: () => number; onProgress?: (msg: string) => void;
}): Promise<SamplingResult> {
  const windowSize = opts.windowSize ?? 12, perRound = opts.perRound ?? 4, maxMs = opts.maxMs ?? 6 * 60000;
  const sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  const now = opts.now ?? (() => Date.now());
  const t0 = now();
  const rollout: HealthSample[] = []; const window: HealthSample[] = []; const observed: Record<string, number> = {};
  let build: Record<string, unknown> | null = null; let reached = false; let round = 0;
  const key = (s: HealthSample) => `${short(s.commit) ?? (s.error ? "error" : "none")}|${s.deploymentId ?? "?"}`;
  while (now() - t0 < maxMs) {
    const batch = await Promise.all(Array.from({ length: perRound }, () => opts.fetchSample()));
    for (const { sample, body } of batch) {
      observed[key(sample)] = (observed[key(sample)] ?? 0) + 1;
      const match = sameCommit(sample.commit, opts.expected);
      if (!reached) { if (match) { reached = true; window.push(sample); build = body; } else rollout.push(sample); continue; }
      window.push(sample);
      if (match && !build) build = body;
    }
    if (reached && window.length >= windowSize) break;
    if (reached && window.some((s) => !sameCommit(s.commit, opts.expected))) break; // disagreement inside the window: stop, fail
    opts.onProgress?.(reached ? `Verifying: ${window.length}/${windowSize} samples` : `Waiting for ${short(opts.expected)}: latest answer ${short(batch[batch.length - 1]?.sample.commit) ?? "none"}`);
    await sleep(reached ? 1500 : backoffDelay(round++, opts.d0 ?? 3000, opts.dmax ?? 30000, 500));
  }
  const matching = window.filter((s) => sameCommit(s.commit, opts.expected)).length;
  return {
    expected: opts.expected, window, rollout, samples: window.length, matching, mismatches: window.length - matching,
    observed, reachedExpected: reached, timedOut: !reached || (window.length < windowSize && matching === window.length), build, durationMs: now() - t0,
  };
}

/** The release decision. Mirrors the database trigger on site_deployment_checks. */
export function decide(s: SamplingResult, smoke: SmokeResult[], minSamples = 3): { state: ReleaseState; reasons: string[] } {
  const reasons: string[] = [];
  if (!s.expected || s.expected === "unknown") reasons.push("The intended commit is unknown.");
  if (!s.reachedExpected) {
    const seen = Object.keys(s.observed).map((k) => k.split("|")[0]).filter((c, i, a) => a.indexOf(c) === i);
    reasons.push(`The live site never reported ${short(s.expected)}; it answered with ${seen.join(", ") || "nothing"}.`);
  } else {
    if (s.samples < minSamples) reasons.push(`Only ${s.samples} verification samples (need ${minSamples}).`);
    if (s.mismatches > 0) reasons.push(`${s.mismatches} of ${s.samples} samples came from another build — instances disagree.`);
    else if (s.timedOut) reasons.push(`Ran out of time after ${s.samples} matching samples; the verification window wasn't completed.`);
  }
  if (s.build && s.build.identity === "unavailable") reasons.push("The live build can't identify its own commit.");
  for (const t of smoke) if (t.mandatory && !t.ok && !t.na) reasons.push(`Smoke test failed: ${t.name} (${t.detail})`);
  return { state: reasons.length ? "verification_failed" : "verified_live", reasons };
}

/** Routes every release must serve correctly. `expect` is checked against the server-side HTTP check. */
export const SMOKE_ROUTES: { name: string; path: string; expect: { status: number; h1?: number; indexable?: boolean; noindex?: boolean; jsonld?: boolean; contains?: string } }[] = [
  { name: "Homepage", path: "/", expect: { status: 200, h1: 1, indexable: true, jsonld: true } },
  { name: "Login", path: "/login", expect: { status: 200, h1: 1, noindex: true } },
  { name: "Account", path: "/account", expect: { status: 200, h1: 1, noindex: true } },
  { name: "Contact", path: "/contact", expect: { status: 200, h1: 1, indexable: true } },
  { name: "Booking", path: "/book", expect: { status: 200, h1: 1, indexable: true } },
  { name: "Service page", path: "/services/website-design", expect: { status: 200, h1: 1, indexable: true, jsonld: true } },
  { name: "Blog", path: "/blog", expect: { status: 200, h1: 1, indexable: true } },
  { name: "Innovation Lab", path: "/lab", expect: { status: 200, h1: 1, indexable: true } },
  { name: "Explore", path: "/explore", expect: { status: 200, h1: 1, indexable: true } },
  { name: "Control room (signed out)", path: "/dashboard/site", expect: { status: 200, h1: 1, noindex: true } },
  { name: "Unknown route", path: "/efy-release-check-missing-page", expect: { status: 404 } },
  { name: "Sitemap", path: "/sitemap.xml", expect: { status: 200 } },
  { name: "robots.txt", path: "/robots.txt", expect: { status: 200 } },
  { name: "POST-only API answers GET with 405", path: "/api/translate", expect: { status: 405 } },
];

/** Check one HTTP-check result against its expectation. */
export function smokeFromHttp(def: (typeof SMOKE_ROUTES)[number], r: { finalStatus: number; redirects: number; html?: { h1: number; robots: string; canonical: string; jsonld: number }; error?: string } | undefined): SmokeResult {
  const e = def.expect; const bad: string[] = [];
  if (!r) return { name: def.name, route: def.path, ok: false, mandatory: true, detail: "no result" };
  if (r.error) bad.push(r.error);
  if (r.finalStatus !== e.status) bad.push(`HTTP ${r.finalStatus}, expected ${e.status}`);
  if (r.redirects) bad.push(`${r.redirects} redirect(s)`);
  if (e.h1 !== undefined && (r.html?.h1 ?? -1) !== e.h1) bad.push(`${r.html?.h1 ?? "?"} h1`);
  if (e.indexable && /noindex/i.test(r.html?.robots ?? "")) bad.push("noindex");
  if (e.indexable && !r.html?.canonical) bad.push("no canonical");
  if (e.noindex && !/noindex/i.test(r.html?.robots ?? "")) bad.push("missing noindex");
  if (e.jsonld && !(r.html?.jsonld ?? 0)) bad.push("no structured data");
  return { name: def.name, route: def.path, ok: !bad.length, mandatory: true, detail: bad.join("; ") || `HTTP ${r.finalStatus}${r.html ? `, ${r.html.h1} h1` : ""}` };
}
