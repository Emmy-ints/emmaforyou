import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ACTIVITY = [
  "🇳🇬 Amaka from Lagos just joined the waitlist",
  "🇺🇸 Marcus from Maryland just submitted his intake form",
  "🇬🇧 Sarah from London just booked a strategy call",
  "🇩🇪 Klaus from Halle just chatted with us on WhatsApp",
  "🇳🇬 Tunde from Abuja just took the analyser",
  "🇿🇦 Lerato from Cape Town just joined the waitlist",
  "🇬🇭 Kwame from Accra just submitted his intake",
  "🇫🇷 Camille from Toulon just booked a strategy call",
  "🇪🇸 Sofia from Madrid just took the analyser",
  "🇨🇴 Carlos from Bogotá just joined the waitlist",
];

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

export default function CountdownUrgency() {
  const t = useCountdown();
  const [activityIndex, setActivityIndex] = useState(0);
  const [activityAge, setActivityAge] = useState(2);

  useEffect(() => {
    const i = setInterval(() => {
      setActivityIndex((x) => (x + 1) % ACTIVITY.length);
      setActivityAge(Math.floor(Math.random() * 14) + 1);
    }, 4500);
    return () => clearInterval(i);
  }, []);

  return (
    <section className="section-padding" style={{ background: "linear-gradient(135deg, oklch(0.13 0.03 280), oklch(0.2 0.05 280))" }}>
      <div className="mx-auto max-w-5xl text-center text-white">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider"
            style={{ background: "var(--gradient-gold)", color: "var(--emma-charcoal)" }}>
            ⚡ Limited Onboarding Spots
          </span>
          <h2 className="mt-6 font-display text-3xl font-extrabold md:text-5xl">
            Only <span className="gradient-text-gold">8 Spots Left</span> This Month
          </h2>
        </motion.div>

        {/* Countdown */}
        <div className="mx-auto mt-10 flex max-w-2xl justify-center gap-3 md:gap-5">
          {[
            { label: "Days", v: t.d }, { label: "Hours", v: t.h },
            { label: "Mins", v: t.m }, { label: "Secs", v: t.s },
          ].map((it) => (
            <div key={it.label} className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="font-display text-3xl font-extrabold gradient-text-gold md:text-5xl tabular-nums">
                {String(it.v).padStart(2, "0")}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-white/60">{it.label}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mx-auto mt-10 max-w-xl">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold">14 of 20 spots taken</span>
            <span className="text-white/60">70%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full" style={{ background: "var(--gradient-gold)" }}
              initial={{ width: 0 }} whileInView={{ width: "70%" }} viewport={{ once: true }} transition={{ duration: 1.4, ease: "easeOut" }} />
          </div>
        </div>

        {/* Activity feed */}
        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <AnimatePresence mode="wait">
            <motion.p key={activityIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }}
              className="text-sm">
              <span>{ACTIVITY[activityIndex]}</span>
              <span className="ml-2 text-white/50">— {activityAge} mins ago</span>
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
