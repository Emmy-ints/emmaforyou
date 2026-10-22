/**
 * Strategy-call availability. Owner's working hours in West Africa Time (UTC+1, no daylight saving).
 * Change these to update the booking calendar everywhere.
 */
/** Emmanuel's live Calendly page: real availability, confirmations and reminders come from Calendly. */
export const CALENDLY_URL = "https://calendly.com/discosundaysllc/new-meeting";

export const BOOKING = {
  ownerTimezone: "Africa/Lagos",
  utcOffsetMinutes: 60,
  days: [1, 2, 3, 4, 5], // Monday–Friday
  startHour: 10,
  endHour: 17, // last slot starts 30 minutes before this
  slotMinutes: 30,
  daysAhead: 21,
  minNoticeHours: 3,
  callLengthLabel: "30-minute",
};

export interface DaySlots {
  key: string; // owner-local YYYY-MM-DD
  date: Date; // noon owner-local, for labels
  slots: Date[];
}

/** All bookable slots, as real instants (UTC). */
export function buildSlots(now = new Date()): DaySlots[] {
  const off = BOOKING.utcOffsetMinutes * 60_000;
  const ownerNow = new Date(now.getTime() + off); // read with getUTC* to get owner-local parts
  const earliest = now.getTime() + BOOKING.minNoticeHours * 3_600_000;
  const out: DaySlots[] = [];
  for (let d = 0; d < BOOKING.daysAhead; d++) {
    const y = ownerNow.getUTCFullYear();
    const m = ownerNow.getUTCMonth();
    const day = ownerNow.getUTCDate() + d;
    const probe = new Date(Date.UTC(y, m, day, 12));
    if (!BOOKING.days.includes(probe.getUTCDay())) continue;
    const slots: Date[] = [];
    for (let mins = BOOKING.startHour * 60; mins < BOOKING.endHour * 60; mins += BOOKING.slotMinutes) {
      const t = Date.UTC(y, m, day, 0, mins) - off;
      if (t >= earliest) slots.push(new Date(t));
    }
    if (slots.length) out.push({ key: probe.toISOString().slice(0, 10), date: new Date(Date.UTC(y, m, day, 12) - off), slots });
  }
  return out;
}

const pad = (n: number) => String(n).padStart(2, "0");
const icsStamp = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

export function calendarLinks(start: Date, title: string, details: string) {
  const end = new Date(start.getTime() + BOOKING.slotMinutes * 60_000);
  const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${icsStamp(start)}/${icsStamp(end)}&details=${encodeURIComponent(details)}`;
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//EmmaForYou//Strategy call//EN", "METHOD:PUBLISH",
    "BEGIN:VEVENT", `UID:${start.getTime()}@emmaforyou`, `DTSTAMP:${icsStamp(new Date())}`, `DTSTART:${icsStamp(start)}`, `DTEND:${icsStamp(end)}`,
    `SUMMARY:${title}`, `DESCRIPTION:${details.replace(/\n/g, "\\n")}`,
    "BEGIN:VALARM", "TRIGGER:-PT30M", "ACTION:DISPLAY", "DESCRIPTION:Strategy call in 30 minutes", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  return { google, ics };
}
