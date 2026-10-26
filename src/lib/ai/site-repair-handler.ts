import { createServerOnlyFn } from "@tanstack/react-start";
import { SITE_URL } from "../seo";
import { adminDb, aiText, checkLimits, checkOrigin, refundLimit } from "./guard";

const STAFF = ["admin", "editor", "developer"];
const strip = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

/**
 * Staff-only: propose a page title and meta description for an audit finding. The server reads the
 * live page itself (never trusts page text from the browser), asks the configured AI provider for
 * a JSON proposal, validates lengths and characters, and returns it for a person to review.
 * Nothing is applied here: applying goes through the control room's approval step.
 */
export const handleSiteRepair = createServerOnlyFn(async (request: Request) => {
  const bad = checkOrigin(request);
  if (bad) return bad.response;
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ message: "Sign in to the control room first." }, { status: 401 });
  const db = await adminDb();
  const { data: u, error: ue } = await db.auth.getUser(token);
  if (ue || !u?.user) return Response.json({ message: "Your session expired. Sign in again." }, { status: 401 });
  const { data: roles } = await db.from("user_roles").select("role").eq("user_id", u.user.id);
  if (!roles?.some((r: { role: string }) => STAFF.includes(r.role))) return Response.json({ message: "Your role can't request AI fixes." }, { status: 403 });

  const body = await request.json().catch(() => ({})) as { route?: string; issue?: string };
  const route = typeof body.route === "string" && /^\/[A-Za-z0-9/_.\-]*$/.test(body.route) && body.route.length < 300 ? body.route : null;
  if (!route) return Response.json({ message: "Pick a page on this site." }, { status: 400 });
  const issue = String(body.issue ?? "").slice(0, 200);

  const page = await fetch(`${SITE_URL}${route}`, { headers: { Accept: "text/html" }, signal: AbortSignal.timeout(10000) }).then((r) => (r.ok ? r.text() : null)).catch(() => null);
  if (!page) return Response.json({ message: "Couldn't load that page from the live site." }, { status: 502 });
  const title = strip(page.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const desc = strip(page.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i)?.[1] ?? "");
  const h1 = strip(page.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
  const main = strip((page.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? page).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")).slice(0, 2500);

  const limit = await checkLimits(request, "site_repair", { perVisitor: 20, global: 60, label: "AI fix proposals" });
  if (!limit.ok) return limit.response;
  if (!limit.provider) { await refundLimit(limit.logId); return Response.json({ message: "No AI provider is available right now." }, { status: 503 }); }

  const instructions = "You improve SEO metadata for EmmaForYou, a digital growth studio. Using ONLY facts on the page, write a page title (35-60 characters, ends with ' | EmmaForYou' only if it fits) and a meta description (110-155 characters, plain, no hype, no invented numbers, prices or claims). Reply with JSON only: {\"title\":\"...\",\"description\":\"...\",\"rationale\":\"one sentence\"}.";
  const ai = await aiText(request, limit.provider, instructions, [{ role: "user", content: `Issue: ${issue}\nURL path: ${route}\nCurrent title: ${title}\nCurrent description: ${desc}\nMain heading: ${h1}\nPage text: ${main}` }]);
  if (!ai.ok) { await refundLimit(limit.logId); return ai.response; }
  let out: { title?: string; description?: string; rationale?: string } = {};
  try { out = JSON.parse(ai.text.slice(ai.text.indexOf("{"), ai.text.lastIndexOf("}") + 1)); } catch { /* handled below */ }
  const t = strip(String(out.title ?? "")).replace(/[<>]/g, "").slice(0, 70);
  const d = strip(String(out.description ?? "")).replace(/[<>]/g, "").slice(0, 170);
  const problems = [t.length < 20 && "title too short", d.length < 70 && "description too short"].filter(Boolean);
  if (problems.length) return Response.json({ message: `The AI proposal didn't pass checks (${problems.join(", ")}). Try again or write it yourself.` }, { status: 422 });
  return Response.json({ current: { title, description: desc, h1 }, proposal: { title: t, description: d }, rationale: strip(String(out.rationale ?? "")).slice(0, 300), provider: ai.provider }, { headers: { "Cache-Control": "no-store" } });
});
