import { createServerOnlyFn } from "@tanstack/react-start";
import { aiProvider } from "./provider";
import { aiText, checkLimits, checkOrigin, providerPaused, refundLimit } from "./guard";

/**
 * Which AI provider the server is configured with, for the owner and for verification.
 * Reports only the provider name, model names and pause state: never the key or any part of it.
 * POST (from this site only) also makes one tiny real request through the shared guard, so a
 * "connected" answer always means a request actually succeeded.
 */
export const handleAiStatus = createServerOnlyFn(async (request: Request) => {
  const provider = aiProvider();
  const base = {
    provider: provider?.id ?? null,
    model: provider?.model ?? null,
    creativeModel: provider?.creativeModel ?? null,
    paused: provider ? (await providerPaused(provider)).paused : null,
  };
  if (request.method !== "POST") return Response.json(base, { headers: { "Cache-Control": "no-store" } });

  const bad = checkOrigin(request);
  if (bad) return bad.response;
  if (!provider) return Response.json({ ...base, test: { ok: false, message: "No AI key is configured." } }, { headers: { "Cache-Control": "no-store" } });
  const limit = await checkLimits(request, "status", { perVisitor: 3, global: 20, label: "AI connection tests" });
  if (!limit.ok) return limit.response;
  const started = Date.now();
  const ai = await aiText(request, provider, "Reply with exactly the word OK.", [{ role: "user", content: "Connection test." }]);
  if (!ai.ok) {
    await refundLimit(limit.logId);
    const detail = await ai.response.clone().json().catch(() => ({}));
    return Response.json({ ...base, test: { ok: false, status: ai.response.status, message: (detail as { message?: string }).message ?? "Request failed." } }, { headers: { "Cache-Control": "no-store" } });
  }
  return Response.json({ ...base, test: { ok: true, provider: ai.provider, ms: Date.now() - started, reply: ai.text.trim().slice(0, 20) } }, { headers: { "Cache-Control": "no-store" } });
});
