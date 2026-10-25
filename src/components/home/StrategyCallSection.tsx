import { Link } from "@tanstack/react-router";
import { Check, PhoneCall } from "lucide-react";
import SectionHead from "../future/SectionHead";

const WA = "https://wa.me/message/HHGMMWMRJFYUC1?text=Hi%20EmmaForYou!%20I%27d%20like%20to%20book%20my%20free%2030-minute%20strategy%20call.";

/** Strategy call as a glass "session ticket": the offer on the left, what you get drawn in on the right. */
export default function StrategyCallSection() {
  const benefits = [
    "Full digital audit of your business",
    "Your top 3 growth opportunities identified",
    "A custom 90-day action plan",
    "Honest advice — no pressure to buy",
  ];
  return (
    <section id="strategy-call" className="sc section-padding" aria-labelledby="sc-h">
      <div className="sc-ticket lg-strong mx-auto max-w-5xl" data-tilt="2">
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div>
            <SectionHead id="sc-h" kicker={<><PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />Free call</>} title="Book a Free 30-Minute Strategy Call" shine={["Strategy", "Call"]}
              sub="Get on a call with Emmanuel or a senior strategist. We'll review your business, identify your top 3 growth opportunities, and outline a custom plan — for free." />
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/book" className="btn-gold inline-flex rounded-full px-6 py-3 text-sm font-semibold">Pick a time →</Link>
              <a href={WA} target="_blank" rel="noopener noreferrer" className="nav-ghost h-auto px-6 py-3">Or ask on WhatsApp</a>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              <span className="sc-live" aria-hidden="true" /> Times shown in your own timezone — Lagos · UK · USA and beyond
            </p>
          </div>
          <div className="sc-stub">
            <span className="sc-perf" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">What you'll get</p>
            <ul className="mt-4 space-y-3">
              {benefits.map((b, i) => (
                <li key={b} className="sc-benefit" style={{ ["--i" as string]: i }}>
                  <span className="sc-check"><Check className="h-3 w-3" aria-hidden="true" /></span>{b}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs text-muted-foreground">30 minutes · 100% free · No commitment · WhatsApp or Zoom</p>
          </div>
        </div>
      </div>
    </section>
  );
}
