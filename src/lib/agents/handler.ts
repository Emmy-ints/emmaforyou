/**
 * /api/agents-tick — runs the agent team's worker. Only callers that present the scheduler secret
 * (stored in agent_settings, sent by pg_cron/pg_net and the database triggers) or a signed-in
 * administrator can start work. The secret never leaves the database and the server.
 */
import { adminDb } from "@/lib/ai/guard";
import { runTick } from "./worker";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

function same(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

async function isAdmin(db: any, request: Request): Promise<boolean> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;
  const { data } = await db.auth.getUser(token);
  const uid = data?.user?.id; if (!uid) return false;
  const { data: role } = await db.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
  return Boolean(role);
}

export async function handleAgentsTick(request: Request): Promise<Response> {
  try {
    if (request.method !== "POST") return json({ ok: false, error: "POST only" }, 405);
    const db = await adminDb();
    const { data: s } = await db.from("agent_settings").select("tick_secret").eq("id", 1).maybeSingle();
    if (!s) return json({ ok: false, error: "not set up" }, 503);
    const secret = request.headers.get("x-agent-secret") ?? "";
    let source = "cron";
    try { const b = (await request.clone().json()) as { source?: string }; if (typeof b?.source === "string") source = b.source.slice(0, 20); } catch { /* empty body */ }
    if (!same(secret, s.tick_secret)) {
      if (!(await isAdmin(db, request))) return json({ ok: false, error: "Not authorised." }, 403);
      source = "admin";
    }
    return json(await runTick(request, source));
  } catch (e) {
    console.error("[agents] tick failed", e instanceof Error ? e.message : e);
    return json({ ok: false, error: "tick failed" }, 500);
  }
}
