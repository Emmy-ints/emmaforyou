import { MessageCircleOff, Globe2, CalendarX2 } from "lucide-react";
import { ScrubWords } from "./future/Kinetic";

const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1";

const PAIN_POINTS = [
  { icon: MessageCircleOff, title: "Slow replies = lost sales", desc: "Every minute you take to respond, your competitor is closing that deal." },
  { icon: Globe2, title: "No website = no credibility", desc: "Customers Google you before buying. No website means no trust." },
  { icon: CalendarX2, title: "Inconsistent social media = forgotten brand", desc: "Out of sight, out of mind. Inconsistent posting kills your reach." },
];

/**
 * "Signal loss": the statement lights up word by word as it scrolls past, while a customer signal
 * line runs from a strong pulse to a flat line underneath; each pain point is a point where the
 * signal drops. Static (fully lit, full line) with reduced motion.
 */
export default function ProblemSection() {
  return (
    <section className="ps section-padding" aria-labelledby="ps-h">
      <div className="ps-panel mx-auto max-w-6xl" data-scroll>
        <div className="hero-ink-grid" aria-hidden="true" />
        <p className="ps-kicker"><span className="ps-dot" aria-hidden="true" />The cost of standing still</p>
        <h2 id="ps-h" className="ps-quote">
          <ScrubWords text={"“Every day you don't have a system — you're losing customers to businesses that do.”"} accent={["losing", "customers"]} />
        </h2>

        <svg className="ps-signal" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="ps-grad" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#3dd6f5" /><stop offset=".45" stopColor="#8b7bff" /><stop offset=".75" stopColor="#ff6b6b" /><stop offset="1" stopColor="#ff6b6b" stopOpacity=".3" />
            </linearGradient>
          </defs>
          <path className="ps-signal-base" d="M0 60 H1200" />
          <path className="ps-signal-line" pathLength={1} d="M0 60 H90 L110 60 L125 12 L142 104 L158 34 L172 60 H300 L318 60 L330 22 L344 96 L356 44 L368 60 H520 L534 60 L544 36 L554 84 L562 52 L570 60 H720 L728 60 L734 50 L740 70 L746 58 L752 60 H1200" />
        </svg>

        <ol className="ps-grid">
          {PAIN_POINTS.map((p, i) => {
            const Icon = p.icon;
            return (
              <li key={p.title} className="ps-card" data-tilt="5" style={{ ["--i" as string]: i }}>
                <span className="ps-icon"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <span className="ps-drop" aria-hidden="true">Drop-off 0{i + 1}</span>
                <h3 className="mt-4 font-display text-lg font-semibold text-white">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{p.desc}</p>
              </li>
            );
          })}
        </ol>

        <div className="mt-10 text-center">
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn-gold inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm">
            Fix This Now →
          </a>
        </div>
      </div>
    </section>
  );
}
