import { createServerOnlyFn } from "@tanstack/react-start";
import { DEMO_BUSINESSES, businessPrompt, offlineReply, receptionistRequestSchema, type DemoBooking } from "../receptionist-data";
import { aiText, checkLimits, checkOrigin, extractJson, readJson } from "./guard";

/** AI receptionist demo: one short reply per call, optionally confirming a (demo) booking. */
export const handleReceptionist = createServerOnlyFn(async (request: Request) => {
  const bad = checkOrigin(request);
  if (bad) return bad.response;
  const body = await readJson(request, 20000);
  if (!body.ok) return body.response;
  const parsed = receptionistRequestSchema.safeParse(body.value);
  if (!parsed.success) return Response.json({ message: "Please type a shorter message." }, { status: 400 });
  const input = parsed.data;
  if (input.messages[input.messages.length - 1].role !== "user") return Response.json({ message: "Say something first." }, { status: 400 });

  const limit = await checkLimits(request, "receptionist", { perVisitor: 40, global: 1500, label: "demo messages", worksWithoutAi: true });
  if (!limit.ok) return limit.response;

  const business = DEMO_BUSINESSES.find((b) => b.id === input.business)!;
  const today = input.today || new Date().toDateString();
  const result = !limit.provider ? { ok: false as const } : await aiText(request, limit.provider, businessPrompt(business, today), input.messages.map((m) => ({ role: m.role, content: m.content })));
  if (!result.ok) {
    const last = input.messages[input.messages.length - 1].content;
    return Response.json({ reply: offlineReply(business, last), booking: null, remaining: limit.remaining, offline: true }, { headers: { "Cache-Control": "no-store" } });
  }

  const json = extractJson<{ reply?: string; booking?: DemoBooking | null }>(result.text);
  const reply = (json?.reply || result.text).replace(/^["\s]+|["\s]+$/g, "").slice(0, 1200);
  const b = json?.booking;
  const booking = b && b.service && b.date && b.time && b.name
    ? { service: String(b.service).slice(0, 80), date: String(b.date).slice(0, 40), time: String(b.time).slice(0, 20), name: String(b.name).slice(0, 40), guests: b.guests ? String(b.guests).slice(0, 10) : "" }
    : null;
  return Response.json({ reply, booking, remaining: limit.remaining }, { headers: { "Cache-Control": "no-store" } });
});
