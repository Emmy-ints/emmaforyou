/**
 * Shared server-side plumbing for the AI tools (receptionist, audit, proposal, makeover, translate).
 * Only imported from handlers wrapped in createServerOnlyFn, so none of this reaches the browser.
 */
import type { ModelMessage } from "ai";
import { createResponsesCall } from "./responses";
import { aiProvider, classifyFailure, visitorSalt, type AiProvider, type ProviderFailure, type ProviderId } from "./provider";
export { aiProvider, type AiProvider } from "./provider";

const HOUR_MS = 60 * 60 * 1000;
const PAUSE_MS = 30 * 60 * 1000;
export const AI_MODEL = "openai/gpt-6-astra";

export type Fail = { ok: false; response: Response };

export function fail(message: string, status: number, extra: Record<string, unknown> = {}): Fail {
  return { ok: false, response: Response.json({ message, ...extra }, { status }) };
}

/** Requests must come from this website (stops other sites spending the AI budget). */
export function checkOrigin(request: Request): Fail | null {
  const origin = request.headers.get("origin");
  const host = new URL(request.url).host;
  if (!origin || new URL(origin).host !== host || request.headers.get("sec-fetch-site") === "cross-site") {
    return fail("Please use this tool from the EmmaForYou website.", 403);
  }
  return null;
}

export async function readJson<T = unknown>(request: Request, maxBytes: number): Promise<{ ok: true; value: T } | Fail> {
  if (Number(request.headers.get("content-length") || 0) > maxBytes) return fail("That request is too large.", 413);
  try {
    const raw = await request.text();
    if (raw.length > maxBytes) return fail("That request is too large.", 413);
    return { ok: true, value: JSON.parse(raw) as T };
  } catch {
    return fail("That request could not be read.", 400);
  }
}

/** One-way hash of network address + browser, salted with a server secret. Raw IPs are never stored. */
export async function hashVisitor(request: Request, secret: string): Promise<string> {
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const agent = (request.headers.get("user-agent") || "").slice(0, 200);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${secret.slice(0, 16)}|${ip}|${agent}`));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function adminDb(): Promise<any> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Is the given provider currently paused after a credit/key failure? */
export async function providerPaused(provider: AiProvider): Promise<{ paused: boolean; error: boolean }> {
  const db = await adminDb();
  const { data, error } = await db.from("prototype_ai_access_state").select("updated_at").eq("id", provider.pauseId).maybeSingle();
  if (error) return { paused: false, error: true };
  return { paused: Boolean(data && Date.now() - new Date(data.updated_at).getTime() < PAUSE_MS), error: false };
}

/** Record a credit/key failure so every AI feature on this provider pauses for a while instead of failing repeatedly. */
export async function pauseProvider(provider: AiProvider, status: number, message: string): Promise<void> {
  try {
    const db = await adminDb();
    await db.from("prototype_ai_access_state").upsert({ id: provider.pauseId, status, message: message.slice(0, 200), updated_at: new Date().toISOString() });
  } catch { /* best effort */ }
}

/**
 * Per-feature limits share the prototype_generations log (kind = feature name), plus the shared
 * pause that kicks in when the AI provider reports a bad key or exhausted credits/quota.
 */
export async function checkLimits(
  request: Request,
  kind: string,
  limits: { perVisitor: number; global: number; label: string; /** The tool still gives a useful (rule-based) result without AI. */ worksWithoutAi?: boolean },
): Promise<{ ok: true; provider: AiProvider | null; remaining: number; aiPaused: boolean; logId: string | null } | Fail> {
  const configured = aiProvider();
  if (!configured && !limits.worksWithoutAi) return fail("AI is not configured yet.", 503);
  const db = await adminDb();
  const state = configured ? await providerPaused(configured) : { paused: true, error: false };
  if (state.error && !limits.worksWithoutAi) return fail("AI tools are temporarily unavailable. Please try later.", 503);
  const aiPaused = !configured || state.paused;
  if (aiPaused && !limits.worksWithoutAi) {
    return fail("Our AI tools are taking a short break. Please try again later, or chat with us on WhatsApp.", 503);
  }
  const visitor = await hashVisitor(request, visitorSalt());
  const since = new Date(Date.now() - HOUR_MS).toISOString();
  const [mine, all] = await Promise.all([
    db.from("prototype_generations").select("created_at").eq("visitor_hash", visitor).eq("kind", kind).gte("created_at", since).order("created_at", { ascending: true }),
    db.from("prototype_generations").select("id", { count: "exact", head: true }).eq("kind", kind).gte("created_at", since),
  ]);
  if (mine.error || all.error) return fail("This tool is temporarily unavailable. Please try later.", 503);
  const used = mine.data?.length ?? 0;
  if (used >= limits.perVisitor) {
    const oldest = new Date(mine.data[0].created_at).getTime();
    const minutes = Math.max(1, Math.ceil((oldest + HOUR_MS - Date.now()) / 60000));
    return fail(`You've used your ${limits.perVisitor} free ${limits.label} for this hour. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}, or chat with us on WhatsApp.`, 429, { retryAfterMinutes: minutes });
  }
  if ((all.count ?? 0) >= limits.global) return fail("This tool is very busy right now. Please try again in a little while.", 429);
  const { data: logged } = await db.from("prototype_generations").insert({ visitor_hash: visitor, kind }).select("id").maybeSingle();
  return { ok: true, provider: aiPaused ? null : configured, remaining: Math.max(0, limits.perVisitor - used - 1), aiPaused, logId: (logged?.id as string | undefined) ?? null };
}

/** Give a use back when the request failed for reasons outside the visitor's control (e.g. their site was unreachable, or the AI failed and nothing was produced). */
export async function refundLimit(logId: string | null): Promise<void> {
  if (!logId) return;
  try { const db = await adminDb(); await db.from("prototype_generations").delete().eq("id", logId); } catch { /* best effort */ }
}

/** Run one model call and return its full text. Key/credit failures pause all AI tools on that provider for a while. */
export async function aiText(
  request: Request,
  provider: AiProvider,
  instructions: string,
  messages: ModelMessage[],
  opts: { model?: string } = {},
): Promise<{ ok: true; text: string; provider: ProviderId; usage: { inputTokens: number | null; outputTokens: number | null } } | Fail> {
  let failure: ProviderFailure | null = null;
  const call = createResponsesCall(request, {
    provider,
    model: opts.model,
    onResponse: async (response) => {
      if (response.ok) return;
      failure = await classifyFailure(provider, response);
      if (failure.pause) await pauseProvider(provider, response.status, `${provider.id} ${response.status}`);
    },
  }, messages, instructions);
  try {
    const text = await call.result.text;
    if (!text.trim()) return fail("The AI service returned nothing. Please try again.", 502);
    const u = (await Promise.resolve(call.result.usage).catch(() => null)) as { inputTokens?: number; outputTokens?: number } | null;
    return { ok: true, text, provider: provider.id, usage: { inputTokens: u?.inputTokens ?? null, outputTokens: u?.outputTokens ?? null } };
  } catch (error) {
    const f = failure as ProviderFailure | null;
    if (f) return fail(f.message, f.status);
    if (request.signal.aborted) return fail("The request was cancelled.", 499);
    console.error(`[ai:${provider.id}] call failed: ${error instanceof Error ? error.name : "error"}`);
    return fail("The AI service is temporarily unavailable. Please try again.", 502);
  }
}

/** Pull the first JSON object out of a model reply (tolerates code fences or stray prose). */
export function extractJson<T>(text: string): T | null {
  const clean = text.replace(/```(?:json)?/gi, "");
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(clean.slice(start, end + 1)) as T; } catch { return null; }
}
