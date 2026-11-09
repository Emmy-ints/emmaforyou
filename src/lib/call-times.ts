/**
 * Next available strategy-call times, read from Emmanuel's real Calendly availability.
 * Pure helpers here (shared by the server handler and tests); the network call lives in
 * lib/call-times-server.ts and needs the CALENDLY_TOKEN secret (a Calendly personal access token).
 * Without it the site simply doesn't show times — it never guesses availability.
 */
import { CALENDLY_URL } from "./booking";

export interface CallTime { start: string; url: string }
export interface CallTimesResponse { available: boolean; times: CallTime[]; checkedAt: string; reason?: "not-configured" | "error" | "none" }

const CALENDLY_HOST = /^https:\/\/calendly\.com\//;

/** Pick the event type that matches the public booking link (or the first active one). */
export function pickEventType(collection: unknown, bookingUrl = CALENDLY_URL): string | null {
  if (!Array.isArray(collection)) return null;
  const items = collection.filter((e): e is { uri: string; scheduling_url?: string; active?: boolean } => !!e && typeof (e as { uri?: unknown }).uri === "string");
  const norm = (u?: string) => (u || "").replace(/\/+$/, "").toLowerCase();
  const exact = items.find((e) => norm(e.scheduling_url) === norm(bookingUrl));
  if (exact) return exact.uri;
  const active = items.find((e) => e.active !== false);
  return active?.uri ?? null;
}

/** Keep real, bookable, future slots with a Calendly link; sorted; first `limit`. */
export function pickTimes(collection: unknown, now = new Date(), limit = 3, minNoticeMinutes = 60): CallTime[] {
  if (!Array.isArray(collection)) return [];
  const earliest = now.getTime() + minNoticeMinutes * 60_000;
  return collection
    .filter((t): t is { status?: string; start_time: string; scheduling_url: string; invitees_remaining?: number } =>
      !!t && typeof (t as { start_time?: unknown }).start_time === "string" && typeof (t as { scheduling_url?: unknown }).scheduling_url === "string")
    .filter((t) => (t.status ?? "available") === "available" && (t.invitees_remaining ?? 1) > 0 && CALENDLY_HOST.test(t.scheduling_url))
    .map((t) => ({ start: new Date(t.start_time).toISOString(), url: t.scheduling_url }))
    .filter((t) => !Number.isNaN(Date.parse(t.start)) && Date.parse(t.start) >= earliest)
    .sort((a, b) => a.start.localeCompare(b.start))
    .filter((t, i, all) => i === 0 || t.start !== all[i - 1].start)
    .slice(0, limit);
}

/** Calendly allows at most 7 days per availability request; we look at the next 7 days. */
export function availabilityWindow(now = new Date()): { start: string; end: string } {
  const start = new Date(now.getTime() + 5 * 60_000);
  const end = new Date(start.getTime() + 7 * 24 * 3_600_000 - 60_000);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** "Tue 12 Nov · 10:00" in the visitor's own timezone and language. */
export function formatCallTime(iso: string, locale?: string, timeZone?: string): { day: string; time: string } {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", timeZone }).format(d);
  const time = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone }).format(d);
  return { day, time };
}

/** "Today" / "Tomorrow" when it applies, in the visitor's timezone. */
export function relativeDay(iso: string, now = new Date(), timeZone?: string): "today" | "tomorrow" | null {
  const key = (d: Date) => new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone }).format(d);
  const k = key(new Date(iso));
  if (k === key(now)) return "today";
  if (k === key(new Date(now.getTime() + 24 * 3_600_000))) return "tomorrow";
  return null;
}
