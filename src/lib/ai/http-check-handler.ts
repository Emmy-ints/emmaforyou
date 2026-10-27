import { createServerOnlyFn } from "@tanstack/react-start";
import { SITE_URL } from "../seo";
import { CRAWLERS, nextHop, readHtml, validateChecks, type CheckResult, type Hop } from "../search/http-check-core";
import { adminDb, checkOrigin, readJson } from "./guard";

const STAFF = ["admin", "editor", "marketing", "developer", "analyst", "auditor"];
const MAX_HOPS = 6;

/**
 * Staff-only: request pages of this site from the server, the way a crawler does, and report the
 * real HTTP status of every hop (browsers hide 301/302 codes from scripts). Only paths on SITE_URL
 * are accepted and only same-origin redirects are followed, so it can't be pointed at internal or
 * third-party hosts. Crawler identities are user-agent strings only: this shows how the app and
 * CDN answer that user agent, not whether a real crawler's IP would be let through a firewall.
 */
export const handleHttpCheck = createServerOnlyFn(async (request: Request) => {
  const bad = checkOrigin(request);
  if (bad) return bad.response;
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ message: "Sign in to the control room first." }, { status: 401 });
  const db = await adminDb();
  const { data: u, error: ue } = await db.auth.getUser(token);
  if (ue || !u?.user) return Response.json({ message: "Your session expired. Sign in again." }, { status: 401 });
  const { data: roles } = await db.from("user_roles").select("role").eq("user_id", u.user.id);
  if (!roles?.some((r: { role: string }) => STAFF.includes(r.role))) return Response.json({ message: "Staff only." }, { status: 403 });

  const body = await readJson(request, 8000);
  if (!body.ok) return body.response;
  const v = validateChecks(body.value);
  if (!v.ok) return Response.json({ message: v.message }, { status: 400 });

  const origin = new URL(SITE_URL).origin;
  const results: CheckResult[] = [];
  for (const c of v.checks) {
    const hops: Hop[] = []; const seen = new Set<string>();
    let url = origin + c.path; let res: Response | null = null; let stoppedOffsite = false; let loop = false; let error: string | undefined;
    try {
      for (let i = 0; i < MAX_HOPS; i++) {
        if (seen.has(url)) { loop = true; break; }
        seen.add(url);
        res = await fetch(url, { method: c.method, redirect: "manual", headers: { "User-Agent": CRAWLERS[c.crawler].ua, Accept: "text/html,application/xhtml+xml,*/*;q=0.8" }, signal: AbortSignal.timeout(10000) });
        const location = res.headers.get("location");
        hops.push({ url: url.replace(origin, ""), status: res.status, location, deploymentId: (res.headers.get("x-deployment-id") ?? "").split(".")[1] ?? null });
        if (res.status >= 300 && res.status < 400 && location) {
          const n = nextHop(location, url, origin);
          if (!n) { stoppedOffsite = true; break; }
          await res.body?.cancel();
          url = n; continue;
        }
        break;
      }
    } catch (e) { error = e instanceof Error ? e.message : "Request failed"; }
    const last = hops[hops.length - 1];
    const ct = res?.headers.get("content-type") ?? null;
    let html: CheckResult["html"];
    if (res && c.method === "GET" && last && last.status < 300 && /text\/html/i.test(ct ?? "")) { try { html = readHtml(await res.text()); } catch { /* body unreadable */ } }
    else await res?.body?.cancel().catch(() => {});
    results.push({
      path: c.path, crawler: c.crawler, method: c.method, hops,
      finalStatus: last?.status ?? 0, finalUrl: last?.url ?? c.path, redirects: Math.max(0, hops.filter((h) => h.status >= 300 && h.status < 400).length),
      stoppedOffsite, loop, contentType: ct, xRobots: res?.headers.get("x-robots-tag") ?? null, cacheControl: res?.headers.get("cache-control") ?? null,
      html, error,
    });
  }
  return Response.json({ origin, checkedAt: new Date().toISOString(), results }, { headers: { "Cache-Control": "no-store" } });
});
