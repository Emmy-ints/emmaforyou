import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NOTIFICATIONS } from "@/lib/notifications-data";

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function LiveNotifications() {
  const [queue, setQueue] = useState<typeof NOTIFICATIONS>([]);
  const [current, setCurrent] = useState<(typeof NOTIFICATIONS)[number] | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setQueue(shuffle(NOTIFICATIONS));
    const start = setTimeout(() => showNext(), 8000);
    return () => clearTimeout(start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function showNext() {
    if (paused) return;
    setQueue((q) => {
      if (q.length === 0) return shuffle(NOTIFICATIONS);
      const [head, ...rest] = q;
      setCurrent(head);
      const visibleMs = 5000;
      const gapMs = 20000 + Math.random() * 25000;
      setTimeout(() => setCurrent(null), visibleMs);
      setTimeout(() => showNext(), visibleMs + gapMs);
      return rest;
    });
  }

  function dismiss() {
    setCurrent(null);
    setPaused(true);
    setTimeout(() => {
      setPaused(false);
      showNext();
    }, 180000);
  }

  return (
    <div className="fixed bottom-5 left-5 z-[80] hidden md:block">
      <AnimatePresence>
        {current && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex max-w-[320px] items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-xl"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base"
              style={{ background: current.color, color: "white" }}
            >
              {current.flag}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {current.name} from {current.city}
              </p>
              <p className="text-xs text-muted-foreground">{current.action}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground/70">{current.time}</p>
            </div>
            <button onClick={dismiss} className="text-muted-foreground hover:text-foreground" aria-label="Dismiss">×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}