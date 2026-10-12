import { useState, useEffect } from "react";
import { motion } from "framer-motion";

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

/** Update these each month: how many onboarding spots you offer and how many are filled. */
const MONTHLY_SPOTS = 20;
const SPOTS_TAKEN = 12;

const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1?text=" + encodeURIComponent("Hi EmmaForYou! I'd like to book a spot for this month's onboarding.");

export default function CountdownUrgency() {
  const t = useCountdown();

  return (
    <section className="section-padding" style={{ background: "linear-gradient(135deg, oklch(0.13 0.03 280), oklch(0.2 0.05 280))" }}>
      <div className="mx-auto max-w-5xl text-center text-white">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider"
            style={{ background: "var(--gradient-gold)", color: "#fff" }}>
            ⚡ Limited Onboarding Spots
          </span>
          <h2 className="mt-6 font-display text-3xl font-extrabold md:text-5xl">
            Only <span className="gradient-text-gold">{MONTHLY_SPOTS - SPOTS_TAKEN} Spots Left</span> This Month
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/70">
            Every project gets hands-on attention from Emmanuel, so we keep our monthly intake small. This month's onboarding closes in:
          </p>
        </motion.div>

        {/* Countdown to the end of this month's onboarding window */}
        <div className="mx-auto mt-10 flex max-w-2xl justify-center gap-3 md:gap-5" aria-label="Time left in this month's onboarding window">
          {[
            { label: "Days", v: t.d }, { label: "Hours", v: t.h },
            { label: "Mins", v: t.m }, { label: "Secs", v: t.s },
          ].map((it) => (
            <div key={it.label} className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="font-display text-3xl font-extrabold gradient-text-gold md:text-5xl tabular-nums" suppressHydrationWarning>
                {String(it.v).padStart(2, "0")}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-white/60">{it.label}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mx-auto mt-10 max-w-xl">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold">{SPOTS_TAKEN} of {MONTHLY_SPOTS} spots taken</span>
            <span className="text-white/60">{Math.round((SPOTS_TAKEN / MONTHLY_SPOTS) * 100)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full" style={{ background: "var(--gradient-gold)" }}
              initial={{ width: 0 }} whileInView={{ width: `${(SPOTS_TAKEN / MONTHLY_SPOTS) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1.4, ease: "easeOut" }} />
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn-gold inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm">
            Claim a spot on WhatsApp →
          </a>
          <a href="#get-started" data-track="countdown_profile" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-sm font-medium text-white hover:bg-white/10">
            Send your business profile
          </a>
        </div>
      </div>
    </section>
  );
}
