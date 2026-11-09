import type { GoalPlan } from "./goal-plan";

/** Monday on or after a date (local), as YYYY-MM-DD parts. */
export function firstMonday(start: Date): Date {
  const d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const add = (8 - d.getDay()) % 7; // 0 when already Monday
  d.setDate(d.getDate() + add);
  return d;
}
const ymd = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
/** RFC 5545 text escaping and 75-octet line folding. */
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
function fold(line: string): string {
  const out: string[] = [];
  let cur = "";
  for (const ch of line) {
    if (new TextEncoder().encode(cur + ch).length > 74) { out.push(cur); cur = " " + ch; } else cur += ch;
  }
  out.push(cur);
  return out.join("\r\n");
}

/**
 * Calendar file with one all-day event per plan week (Monday), listing that week's actions, plus the month
 * milestones on the last day of each month block. Imports into Google Calendar, Apple Calendar and Outlook.
 */
export function planToIcs(plan: GoalPlan, start: Date, now = new Date(), uidSeed = "goal"): string {
  const monday = firstMonday(start);
  const stamp = `${now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`;
  const ev: string[] = [];
  const event = (day: Date, summary: string, desc: string, uid: string) => {
    const next = new Date(day); next.setDate(next.getDate() + 1);
    ev.push("BEGIN:VEVENT", `UID:${uid}-${uidSeed}@emmaforyou`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${ymd(day)}`, `DTEND;VALUE=DATE:${ymd(next)}`, fold(`SUMMARY:${esc(summary)}`), fold(`DESCRIPTION:${esc(desc)}`), "BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:PT9H", fold(`DESCRIPTION:${esc(summary)}`), "END:VALARM", "END:VEVENT");
  };
  for (const w of plan.weeks) {
    const d = new Date(monday); d.setDate(d.getDate() + (w.week - 1) * 7);
    event(d, `Week ${w.week}: ${w.focus}`, `${w.actions.map((a) => `• ${a}`).join("\n")}${plan.checkin ? `\n\nWeekly check-in: ${plan.checkin}` : ""}\n\nYour 90-day plan: ${plan.northStar}`, `w${w.week}`);
  }
  for (const m of plan.milestones) {
    const d = new Date(monday); d.setDate(d.getDate() + m.month * 28 - 3);
    event(d, `Milestone ${m.month}: ${m.outcome}`, `How you'll know: ${m.measure}`, `m${m.month}`);
  }
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//EmmaForYou//90-day plan//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", fold(`X-WR-CALNAME:${esc(plan.headline.slice(0, 60))}`), ...ev, "END:VCALENDAR"].join("\r\n") + "\r\n";
}

/** Progress through the plan's actions (0–100). */
export function planProgress(plan: GoalPlan, done: Iterable<string>): { done: number; total: number; pct: number } {
  const total = plan.weeks.reduce((n, w) => n + w.actions.length, 0);
  const keys = new Set(plan.weeks.flatMap((w) => w.actions.map((_, i) => `${w.week}-${i}`)));
  const d = [...done].filter((k) => keys.has(k)).length;
  return { done: d, total, pct: total ? Math.round((d / total) * 100) : 0 };
}
