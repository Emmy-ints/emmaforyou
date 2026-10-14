/**
 * Which AI provider the server uses. Server-only: keys are read from environment secrets and never
 * leave the server (not in responses, logs or the browser bundle).
 *
 * - OPENAI_API_KEY set  → every AI feature calls OpenAI directly (api.openai.com). No fallback to
 *   Lovable's AI gateway, even if OpenAI fails, so Lovable AI credits are never used silently.
 * - OPENAI_API_KEY unset → features keep using Lovable's AI gateway (LOVABLE_API_KEY), as before.
 *
 * Optional secrets: OPENAI_MODEL (default gpt-6-luna) for short text tasks and
 * OPENAI_MODEL_CREATIVE (default gpt-6-luna) for full-page HTML generation (prototype builder, makeover).
 */
export type ProviderId = "openai" | "lovable";

export interface AiProvider {
  id: ProviderId;
  baseURL: string;
  apiKey: string;
  /** Model for short structured text tasks. */
  model: string;
  /** Model for long HTML generation (prototype builder, website makeover). */
  creativeModel: string;
  /** Row id in prototype_ai_access_state used to pause this provider after credit/key failures. */
  pauseId: string;
  /** Extra request headers the provider needs. */
  headers: Record<string, string>;
}

const OPENAI_DEFAULT_MODEL = "gpt-6-luna";
const LOVABLE_MODEL = "openai/gpt-6-astra";
const MODEL_RE = /^[a-z0-9][a-z0-9.\-:_/]{1,63}$/i;

function env(name: string): string {
  const v = process.env[name];
  return typeof v === "string" ? v.trim() : "";
}

export function aiProvider(): AiProvider | null {
  const openai = env("OPENAI_API_KEY");
  if (openai) {
    const model = MODEL_RE.test(env("OPENAI_MODEL")) ? env("OPENAI_MODEL") : OPENAI_DEFAULT_MODEL;
    const creative = MODEL_RE.test(env("OPENAI_MODEL_CREATIVE")) ? env("OPENAI_MODEL_CREATIVE") : model;
    return { id: "openai", baseURL: "https://api.openai.com/v1", apiKey: openai, model, creativeModel: creative, pauseId: "openai", headers: {} };
  }
  const lovable = env("LOVABLE_API_KEY");
  if (lovable) {
    return { id: "lovable", baseURL: "https://ai.gateway.lovable.dev/v1", apiKey: lovable, model: LOVABLE_MODEL, creativeModel: LOVABLE_MODEL, pauseId: "prototype", headers: { "Lovable-API-Key": lovable, "X-Lovable-AIG-SDK": "vercel-ai-sdk" } };
  }
  return null;
}

/** A stable server-side salt for hashing visitors (independent of which AI key is configured). */
export function visitorSalt(): string {
  return env("SUPABASE_SERVICE_ROLE_KEY") || env("OPENAI_API_KEY") || env("LOVABLE_API_KEY") || "emmaforyou-visitor-salt";
}

export interface ProviderFailure {
  /** Pause all AI features for this provider (bad key, no credits/quota, access denied). */
  pause: boolean;
  /** Safe message for visitors. Never includes provider details. */
  message: string;
  /** HTTP status to return to the browser. */
  status: number;
}

/** Map a provider error response to a safe, visitor-facing outcome. Provider details are only logged server-side. */
export async function classifyFailure(provider: AiProvider, response: Response): Promise<ProviderFailure> {
  let code = "", type = "", detail = "";
  try {
    const v = await response.clone().json();
    code = String(v?.error?.code ?? v?.code ?? "");
    type = String(v?.error?.type ?? "");
    detail = String(v?.error?.message ?? v?.message ?? "").slice(0, 300);
  } catch { /* non-JSON */ }
  // Server log for the owner/developer: status and error code only, never the key.
  console.error(`[ai:${provider.id}] HTTP ${response.status} ${code || type} ${detail.replace(/sk-[A-Za-z0-9_-]{8,}/g, "sk-***")}`);
  const s = response.status;
  if (s === 401 || s === 403 || (provider.id === "lovable" && s === 402)) {
    return { pause: true, message: "Our AI tools are taking a short break. Please try again later, or chat with us on WhatsApp.", status: 503 };
  }
  if (s === 429 && /insufficient_quota|billing/i.test(`${code} ${type} ${detail}`)) {
    return { pause: true, message: "Our AI tools are taking a short break. Please try again later, or chat with us on WhatsApp.", status: 503 };
  }
  if (s === 429) return { pause: false, message: "The AI service is busy right now. Please try again in a minute.", status: 429 };
  if (s === 400 && /context_length|too large|max_tokens/i.test(`${code} ${detail}`)) return { pause: false, message: "That request is too large for the AI. Please shorten it and try again.", status: 413 };
  if (s === 400 || s === 404) return { pause: false, message: "The AI service couldn't handle this request. Please try again later.", status: 502 };
  return { pause: false, message: "The AI service is temporarily unavailable. Please try again.", status: 502 };
}
