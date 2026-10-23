/**
 * /api/inspiration-tick — called by pg_cron (via inspiration_kick) with the stored secret, or by a
 * signed-in administrator ("run now"). Crawling happens only here, server-side.
 */
import { adminDb } from "@/lib/ai/guard";
import { inspirationTick } from "./engine";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
function same(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function handleInspirationTick(request: Request): Promise<Response> {
  try {
    if (request.method !== "POST") return json({ ok: false, error: "POST only" }, 405);
    const db = await adminDb();
    const { data: s } = await db.from("inspiration_settings").select("tick_secret").eq("id", 1).maybeSingle();
    if (!s) return json({ ok: false, error: "not set up" }, 503);
    let trigger = "cron";
    try { const b = (await request.clone().json()) as { source?: string }; if (typeof b?.source === "string") trigger = b.source.replace(/[^a-z]/g, "").slice(0, 20) || "cron"; } catch { /* empty body */ }
    if (!same(request.headers.get("x-inspiration-secret") ?? "", s.tick_secret)) {
      const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
      const uid = token ? (await db.auth.getUser(token)).data?.user?.id : null;
      const { data: role } = uid ? await db.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle() : { data: null };
      if (!role) return json({ ok: false, error: "Not authorised." }, 403);
      trigger = "admin";
    }
    return json(await inspirationTick(trigger));
  } catch (e) {
    console.error("[inspiration] tick failed", e instanceof Error ? e.message : e);
    return json({ ok: false, error: "tick failed" }, 500);
  }
}
