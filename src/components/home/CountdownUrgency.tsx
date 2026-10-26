import { useState, useEffect } from "react";
import { useSetting } from "@/lib/site-settings";
import { ClaimTag } from "../future/ClaimTag";
import { useClaim } from "@/lib/claims";

function useCountdown() {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const diff = end.getTime() - now.getTime();
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setT({ d, h, m, s });
    };
    calc();
    const i = setInterval(calc, 1000);
    return () => clearInterval(i);
  }, []);
  return t;
}

/** Defaults; the owner sets the real monthly figures in the control room (Content → Claims → countdown). */
const DEFAULT_SPOTS = 20;
const DEFAULT_TAKEN = 12;

const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1?text=" + encodeURIComponent("Hi EmmaForYou! I'd like to book a spot for this month's onboarding.");

/**
 * Onboarding window as a glass chronometer: digits roll as they change, the intake bar glows to
 * the share of spots taken. Numbers stay plain text for screen readers.
 */
export default function CountdownUrgency() {
  const t = useCountdown();
  const cfg = useSetting("countdown");
  const claim = useClaim("countdown");
  const MONTHLY_SPOTS = typeof cfg?.spots === "number" ? cfg.spots : DEFAULT_SPOTS;
  const SPOTS_TAKEN = Math.min(MONTHLY_SPOTS, typeof cfg?.taken === "number" ? cfg.taken : DEFAULT_TAKEN);
  const pct = (SPOTS_TAKEN / MONTHLY_SPOTS) * 100;
  if (cfg?.on === false || claim.display === "hide") return null;

  return (
    <section className="cd band-ink section-padding" aria-labelledby="cd-h">
      <div className="hero-ink-grid" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl text-center text-white">
        <span className="cd-chip">⚡ Limited Onboarding Spots</span> <ClaimTag id="countdown" />
        <h2 id="cd-h" className="mt-6 font-display text-3xl font-semibold tracking-tight md:text-5xl">
          Only <span className="gradient-text-gold">{MONTHLY_SPOTS - SPOTS_TAKEN} Spots Left</span> This Month
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-white/70">
          Every project gets hands-on attention from Emmanuel, so we keep our monthly intake small. This month's onboarding closes in:
        </p>

        {/* Countdown to the end of this month's onboarding window */}
        <div className="cd-clock mx-auto mt-10" role="timer" aria-label="Time left in this month's onboarding window">
          {[
            { label: "Days", v: t.d }, { label: "Hours", v: t.h },
            { label: "Mins", v: t.m }, { label: "Secs", v: t.s },
          ].map((it) => (
            <div key={it.label} className="cd-tile lg">
              <div className="cd-digits" suppressHydrationWarning>
                {String(it.v).padStart(2, "0").split("").map((d, i) => <span key={`${i}-${d}`} className="cd-digit">{d}</span>)}
              </div>
              <div className="mt-1 text-xs uppercase tracking-[0.16em] text-white/60">{it.label}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mx-auto mt-10 max-w-xl">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold">{SPOTS_TAKEN} of {MONTHLY_SPOTS} spots taken</span>
            <span className="text-white/60">{Math.round(pct)}%</span>
          </div>
          <div className="cd-bar" role="progressbar" aria-valuemin={0} aria-valuemax={MONTHLY_SPOTS} aria-valuenow={SPOTS_TAKEN} aria-label="Onboarding spots taken">
            <span style={{ ["--w" as string]: `${pct}%` }} />
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn-gold inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm">
            Claim a spot on WhatsApp →
          </a>
          <a href="#get-started" data-track="countdown_profile" className="hero-ghost-btn text-sm">
            Send your business profile
          </a>
        </div>
      </div>
    </section>
  );
}
