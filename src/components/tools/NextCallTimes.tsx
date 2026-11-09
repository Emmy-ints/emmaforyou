import { useEffect, useState, type ReactNode } from "react";
import { CalendarClock } from "lucide-react";
import { formatCallTime, relativeDay, type CallTimesResponse } from "@/lib/call-times";
import { track } from "@/lib/analytics";

let pending: Promise<CallTimesResponse | null> | null = null;
let cached: { at: number; v: CallTimesResponse | null } | null = null;

/** One request per page view (shared by every NextCallTimes on the page), refreshed after 5 minutes. */
export function loadCallTimes(): Promise<CallTimesResponse | null> {
  if (cached && Date.now() - cached.at < 5 * 60_000) return Promise.resolve(cached.v);
  pending ??= fetch("/api/call-times", { headers: { Accept: "application/json" } })
    .then((r) => (r.ok ? (r.json() as Promise<CallTimesResponse>) : null))
    .catch(() => null)
    .then((v) => { cached = { at: Date.now(), v }; pending = null; return v; });
  return pending;
}

export function useCallTimes() {
  const [data, setData] = useState<CallTimesResponse | null | undefined>(undefined);
  useEffect(() => { let alive = true; loadCallTimes().then((v) => { if (alive) setData(v); }); return () => { alive = false; }; }, []);
  return data;
}

/**
 * The next three real openings in Emmanuel's Calendly, in the visitor's own timezone. Each one opens Calendly's
 * booking form for that exact time. When Calendly isn't connected (no CALENDLY_TOKEN) or has no openings this week,
 * it shows `fallback` (or nothing) — it never invents availability.
 */
export default function NextCallTimes({ source, compact = false, title = "Next available call times", fallback = null, tone = "card" }: {
  source: string; compact?: boolean; title?: string; fallback?: ReactNode; tone?: "card" | "plain" | "ink";
}) {
  const data = useCallTimes();
  const [tz, setTz] = useState<string>("");
  useEffect(() => { try { setTz(Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, " ")); } catch { /* ignore */ } }, []);
  if (data === undefined) return compact ? null : <div className="efy-times efy-times-loading" aria-hidden="true" />;
  if (!data?.available || !data.times.length) return <>{fallback}</>;
  const now = new Date();
  return (
    <div className={`efy-times efy-times-${tone}${compact ? " efy-times-compact" : ""}`} data-call-times>
      <p className="efy-times-title"><CalendarClock className="h-4 w-4" aria-hidden="true" /> {title}</p>
      <ul className="efy-times-list">
        {data.times.map((t) => {
          const f = formatCallTime(t.start);
          const rel = relativeDay(t.start, now);
          return (
            <li key={t.start}>
              <a href={t.url} target="_blank" rel="noopener noreferrer" onClick={() => track("call_time_click", { source, rel: rel ?? "later" })}>
                <span className="efy-times-day">{rel === "today" ? "Today" : rel === "tomorrow" ? "Tomorrow" : f.day}</span>
                <span className="efy-times-time">{f.time}</span>
              </a>
            </li>
          );
        })}
      </ul>
      {!compact && <p className="efy-times-note">Free 30-minute call · times in your timezone{tz ? ` (${tz})` : ""} · you'll get a confirmation email</p>}
    </div>
  );
}
