import { createServerOnlyFn } from "@tanstack/react-start";
import { availabilityWindow, pickEventType, pickTimes, type CallTimesResponse } from "./call-times";

const API = "https://api.calendly.com";
const TTL_MS = 5 * 60_000;
let cache: { at: number; body: CallTimesResponse } | null = null;
let eventTypeUri: string | null = null;

function token(): string {
  const v = process.env.CALENDLY_TOKEN;
  return typeof v === "string" ? v.trim() : "";
}

async function calendly(path: string, key: string): Promise<unknown> {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${key}`, Accept: "application/json" }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`calendly ${res.status}`);
  return res.json();
}

/**
 * GET /api/call-times → the next 3 bookable times from Calendly (real availability), cached for 5 minutes.
 * Public and contact-free: it returns start times and Calendly booking links only. The token never leaves the server.
 */
export const handleCallTimes = createServerOnlyFn(async (): Promise<Response> => {
  const headers = { "Cache-Control": "public, max-age=120", "Content-Type": "application/json" };
  const key = token();
  if (!key) return new Response(JSON.stringify({ available: false, times: [], checkedAt: new Date().toISOString(), reason: "not-configured" } satisfies CallTimesResponse), { headers });
  if (cache && Date.now() - cache.at < TTL_MS) return new Response(JSON.stringify(cache.body), { headers });
  try {
    if (!eventTypeUri) {
      const me = (await calendly("/users/me", key)) as { resource?: { uri?: string } };
      const user = me.resource?.uri;
      if (!user) throw new Error("calendly user");
      const types = (await calendly(`/event_types?user=${encodeURIComponent(user)}&active=true&count=50`, key)) as { collection?: unknown };
      eventTypeUri = pickEventType(types.collection);
      if (!eventTypeUri) throw new Error("calendly event type");
    }
    const w = availabilityWindow();
    const avail = (await calendly(`/event_type_available_times?event_type=${encodeURIComponent(eventTypeUri)}&start_time=${encodeURIComponent(w.start)}&end_time=${encodeURIComponent(w.end)}`, key)) as { collection?: unknown };
    const times = pickTimes(avail.collection);
    const body: CallTimesResponse = { available: times.length > 0, times, checkedAt: new Date().toISOString(), ...(times.length ? {} : { reason: "none" as const }) };
    cache = { at: Date.now(), body };
    return new Response(JSON.stringify(body), { headers });
  } catch (error) {
    // Logged without the token. Visitors just don't see times; the normal calendar still works.
    console.error("[call-times]", error instanceof Error ? error.message : "error");
    eventTypeUri = null;
    return new Response(JSON.stringify({ available: false, times: [], checkedAt: new Date().toISOString(), reason: "error" } satisfies CallTimesResponse), { headers: { ...headers, "Cache-Control": "no-store" } });
  }
});
