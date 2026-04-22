import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const RESULTS = [
  "🇳🇬 Fashion store in Lagos: +312% website traffic this month",
  "🇺🇸 Real estate agent in Maryland: 47 new leads generated",
  "🇬🇧 Course creator in London: £18,000 course launch",
  "🇩🇪 Auto dealer in Halle: 3x more test drive bookings",
  "🇳🇬 Clinic in Abuja: 86 new Google reviews added",
  "🇿🇦 Fitness studio in Cape Town: memberships doubled in 60 days",
  "🇬🇭 Fashion brand in Accra: first 1,000 Instagram followers",
  "🇳🇬 Restaurant in Port Harcourt: fully booked every weekend",
];

export default function ResultsTicker() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % RESULTS.length), 4000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="border-y border-border" style={{ background: "var(--gradient-dark)" }}>
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-center px-5 text-center">
        <AnimatePresence mode="wait">
          <motion.span key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}
            className="text-sm font-medium text-white/90 md:text-base">
            <span className="gradient-text-gold font-bold">{RESULTS[i].split(":")[1]?.trim()}</span>
            <span className="ml-2 text-white/60">— {RESULTS[i].split(":")[0]}</span>
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
