import { createServerOnlyFn } from "@tanstack/react-start";
import { prototypeRequestSchema, type PrototypeRequest } from "../prototype";
import { createResponsesCall } from "./responses";
import { getLovableAiGatewayResponseHeaders } from "./run-id.ts";
import { aiProvider, classifyFailure, visitorSalt, type ProviderFailure } from "./provider";
import { signPrototype } from "./proto-sign";
import { buildInstructions, buildUserMessage } from "./prototype-prompts";

export const handlePrototype = createServerOnlyFn(async (request: Request) => {
  const origin = request.headers.get("origin");
  const host = new URL(request.url).host;
  if (!origin || new URL(origin).host !== host || request.headers.get("sec-fetch-site") === "cross-site") {
    return Response.json({ message: "Please create your prototype from the EmmaForYou website." }, { status: 403 });
  }
  if (Number(request.headers.get("content-length") || 0) > 170000) {
    return Response.json({ message: "This prototype is too large to refine." }, { status: 413 });
  }
  let input: PrototypeRequest;
  try {
    const raw = await request.text();
    if (raw.length > 170000) return Response.json({ message: "This prototype is too large to refine." }, { status: 413 });
    input = prototypeRequestSchema.parse(JSON.parse(raw));
  } catch {
    return Response.json({ message: "Describe your idea in 8–500 characters (and plan your app's screens first)." }, { status: 400 });
  }
  const provider = aiProvider();
  if (!provider) return Response.json({ message: "The prototype builder isn't available right now. Please chat with us on WhatsApp." }, { status: 503 });
  // Only trusted same-origin generation requests can reach private circuit-breaker state.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: blocked, error: stateError } = await supabaseAdmin.from("prototype_ai_access_state").select("status,message,updated_at").eq("id", provider.pauseId).maybeSingle();
  if (stateError) return Response.json({ message: "AI generation is temporarily unavailable. Please try later." }, { status: 503 });
  // A credit/access failure pauses generation for a while, then retries on its own (e.g. after credits are topped up).
  if (blocked && Date.now() - new Date(blocked.updated_at).getTime() < BLOCK_COOLDOWN_MS) {
    return Response.json({ message: "The prototype builder is taking a short break. Please try again later, or chat with us on WhatsApp." }, { status: 503 });
  }

  // Visitor limit: a few generations per visitor per hour, plus an overall hourly cap to protect the AI budget.
  const visitorHash = await hashVisitor(request, visitorSalt());
  const since = new Date(Date.now() - HOUR_MS).toISOString();
  const [{ data: mine, error: mineError }, { count: everyone, error: allError }] = await Promise.all([
    // Only prototype runs count here; other tools log their own kinds in the same table.
    supabaseAdmin.from("prototype_generations").select("created_at").eq("visitor_hash", visitorHash).in("kind", ["new", "refine"]).gte("created_at", since).order("created_at", { ascending: true }),
    supabaseAdmin.from("prototype_generations").select("id", { count: "exact", head: true }).in("kind", ["new", "refine"]).gte("created_at", since),
  ]);
  if (mineError || allError) return Response.json({ message: "AI generation is temporarily unavailable. Please try later." }, { status: 503 });
  if ((mine?.length ?? 0) >= PER_VISITOR_PER_HOUR) {
    const oldest = new Date(mine![0].created_at).getTime();
    const minutes = Math.max(1, Math.ceil((oldest + HOUR_MS - Date.now()) / 60000));
    return Response.json(
      { message: `You've used your ${PER_VISITOR_PER_HOUR} free prototypes for this hour. You can create more in about ${minutes} minute${minutes === 1 ? "" : "s"} — or chat with us on WhatsApp and we'll build the real thing.`, retryAfterMinutes: minutes },
      { status: 429, headers: { "Retry-After": String(minutes * 60) } },
    );
  }
  if ((everyone ?? 0) >= GLOBAL_PER_HOUR) {
    return Response.json({ message: "The prototype builder is very busy right now. Please try again in a little while." }, { status: 429, headers: { "Retry-After": "900" } });
  }
  const { data: logged } = await supabaseAdmin.from("prototype_generations").insert({ visitor_hash: visitorHash, kind: input.refinement ? "refine" : "new" }).select("id").maybeSingle();
  const remaining = PER_VISITOR_PER_HOUR - (mine?.length ?? 0) - 1;

  let notifyReady: (response: Response | null) => void = () => {};
  const ready = new Promise<Response | null>((resolve) => { notifyReady = resolve; });
  let upstreamFailure = "";
  let failure: ProviderFailure | null = null;
  const call = createResponsesCall(request, {
    provider, model: provider.creativeModel,
    onResponse: async (response) => {
      if (!response.ok) {
        failure = await classifyFailure(provider, response);
        upstreamFailure = failure.message;
        if (failure.pause) {
          await supabaseAdmin.from("prototype_ai_access_state").upsert({ id: provider.pauseId, status: response.status, message: `${provider.id} ${response.status}`, updated_at: new Date().toISOString() });
        }
      }
      notifyReady(response);
    },
  }, [{ role: "user", content: buildUserMessage(input) }], buildInstructions(input));

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (value: object) => controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
      try {
        let hasText = false;
        let full = "";
        for await (const part of call.result.fullStream) {
          if (part.type === "text-delta") { hasText = true; full += part.text; send({ type: "text", text: part.text }); }
          if (part.type === "reasoning-delta") send({ type: "reasoning", text: part.text });
          if (part.type === "error") {
            notifyReady(null);
            send({ type: "error", message: upstreamFailure || "Your prototype could not be completed. Please try again later." });
          }
          if (part.type === "finish") {
            if (part.finishReason === "content-filter") send({ type: "error", message: "This request was declined by the AI service." });
            else if (!hasText) send({ type: "error", message: "The AI service returned no prototype." });
            // The signature lets the visitor save/share exactly this HTML later (see /api/prototype-share).
            else send({ type: "done", sig: await signPrototype(full) });
          }
        }
      } catch (error) {
        notifyReady(null);
        if (!request.signal.aborted) send({ type: "error", message: upstreamFailure || "Generation was interrupted. Your previous preview is safe." });
      } finally { notifyReady(null); controller.close(); }
    },
  });
  const upstream = await ready;
  if (upstream && !upstream.ok) {
    // Nothing was generated, so the attempt doesn't count against the visitor's limit.
    if (logged?.id) await supabaseAdmin.from("prototype_generations").delete().eq("id", logged.id);
    const f = failure as ProviderFailure | null;
    return Response.json({ message: upstreamFailure || "AI generation is temporarily unavailable." }, { status: f?.status ?? 502 });
  }
  if (request.signal.aborted) return new Response(null, { status: 499 });
  const headers = provider.id === "openai" ? new Headers({ "Content-Type": "application/x-ndjson", "Cache-Control": "no-store, no-transform", "X-Prototypes-Remaining": String(Math.max(0, remaining)) }) : getLovableAiGatewayResponseHeaders(upstream?.headers, { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store, no-transform", "X-Prototypes-Remaining": String(Math.max(0, remaining)) });
  return new Response(stream, { headers });
});

const HOUR_MS = 60 * 60 * 1000;
const PER_VISITOR_PER_HOUR = 3;
const GLOBAL_PER_HOUR = 60;
const BLOCK_COOLDOWN_MS = 30 * 60 * 1000;

/** One-way hash of the visitor's network address and browser, salted with a server secret. Raw IPs are never stored. */
async function hashVisitor(request: Request, secret: string): Promise<string> {
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const agent = (request.headers.get("user-agent") || "").slice(0, 200);
  const data = new TextEncoder().encode(`${secret.slice(0, 16)}|${ip}|${agent}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}