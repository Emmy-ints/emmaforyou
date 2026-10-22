import { useEffect, useState } from "react";
import { CalendarCheck, ExternalLink, MessageCircle } from "lucide-react";
import { CALENDLY_URL } from "@/lib/booking";
import { buildWa } from "@/lib/leads";
import { track } from "@/lib/analytics";

/**
 * Booking through Emmanuel's Calendly, so visitors only see times he is really free and get
 * Calendly's confirmation and reminder emails. The calendar loads only after the visitor asks for
 * it: Calendly is a third party with its own cookies, and the rest of the site uses none.
 */
export default function CalendlyBooking() {
  const [open, setOpen] = useState(false);
  const [booked, setBooked] = useState(false);
  const [src, setSrc] = useState(CALENDLY_URL);

  useEffect(() => {
    const host = window.location.host;
    setSrc(`${CALENDLY_URL}?embed_domain=${encodeURIComponent(host)}&embed_type=Inline`);
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== "https://calendly.com") return;
      const ev = (e.data as { event?: string } | null)?.event;
      if (ev === "calendly.event_scheduled") { setBooked(true); track("call_booked", { via: "calendly" }); }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (!open) {
    return (
      <div className="rounded-[24px] border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
        <CalendarCheck className="h-8 w-8 text-[var(--emma-violet)]" aria-hidden="true" />
        <h2 className="mt-3 font-display text-xl font-semibold">See Emmanuel's available times</h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">Times are shown in your own timezone. You'll get a confirmation email with the call details and a reminder before the call.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={() => { setOpen(true); track("cta_click", { cta: "calendly_open" }); }} className="btn-primary-gradient inline-flex min-h-11 items-center gap-2 rounded-full px-6 py-3 font-semibold text-white">
            <CalendarCheck className="h-5 w-5" aria-hidden="true" /> Show available times
          </button>
          <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" onClick={() => track("cta_click", { cta: "calendly_new_tab" })} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold hover:border-[var(--emma-violet)]">
            Open in a new tab <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">The booking calendar is provided by Calendly, which may set its own cookies once it opens. Prefer not to? <a href={buildWa("Hi Emmanuel, I'd like to book a free strategy call.")} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--emma-violet)]">Ask for a time on WhatsApp</a>.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-border bg-white shadow-[var(--shadow-card)]">
      {booked && (
        <p role="status" className="flex items-center gap-2 border-b border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-800">
          <CalendarCheck className="h-4 w-4" aria-hidden="true" /> You're booked. Check your email for the confirmation and call details.
        </p>
      )}
      <iframe title="Book a strategy call with Emmanuel (Calendly)" src={src} className="block h-[720px] w-full border-0" loading="lazy" />
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-card px-5 py-3 text-xs text-muted-foreground">
        <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-[var(--emma-violet)]">Calendar not loading? Open it in a new tab <ExternalLink className="h-3 w-3" aria-hidden="true" /></a>
        <a href={buildWa("Hi Emmanuel, I'd like to book a free strategy call.")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold"><MessageCircle className="h-3 w-3 text-[#25d366]" aria-hidden="true" /> Or ask on WhatsApp</a>
      </p>
    </div>
  );
}
