/**
 * /api/blog/tick — called by the database scheduler (pg_cron + pg_net) every 10 minutes.
 * Safe to call by anyone: it only does work when the stored schedule says a slot is due, and the
 * database lets each slot publish at most once. Forcing a source refresh or an extra article
 * ("run now") requires a signed-in administrator.
 */
import { adminDb } from "@/lib/ai/guard";
import { dueSlot, localParts, tick } from "./engine";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function isAdmin(request: Request): Promise<boolean> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;
  const db = await adminDb();
  const { data } = await db.auth.getUser(token);
  const uid = data?.user?.id;
  if (!uid) return false;
  const { data: role } = await db.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
  return Boolean(role);
}

export async function handleBlogTick(request: Request): Promise<Response> {
  try {
    if (request.method === "GET") {
      const db = await adminDb();
      const { data: s } = await db.from("blog_settings").select("enabled,timezone,slots,daily_target").eq("id", 1).maybeSingle();
      if (!s) return json({ ok: false, error: "not set up" }, 503);
      const lp = localParts(s.timezone);
      return json({ ok: true, enabled: s.enabled, timezone: s.timezone, localDate: lp.date, localTime: `${String(Math.floor(lp.minutes / 60)).padStart(2, "0")}:${String(lp.minutes % 60).padStart(2, "0")}`, slots: s.slots, dailyTarget: s.daily_target, due: dueSlot(s)?.key ?? null });
    }
    let action = "tick";
    try { const b = (await request.clone().json()) as { action?: string }; if (typeof b?.action === "string") action = b.action; } catch { /* empty body */ }
    if (action === "run" || action === "refresh") {
      if (!(await isAdmin(request))) return json({ ok: false, error: "Administrators only." }, 403);
      return json(await tick(request, action === "run" ? { manual: true } : { refresh: true }));
    }
    const r = await tick(request);
    return json(r, r.ok ? 200 : 500);
  } catch (e) {
    console.error("[blog] tick failed", e instanceof Error ? e.message : e);
    return json({ ok: false, error: "tick failed" }, 500);
  }
}
