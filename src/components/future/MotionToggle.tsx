import { useEffect, useState } from "react";
import { motionPreference, setMotionPreference } from "@/lib/motion";

/** Visible switch for non-essential motion (animations, parallax, 3D, auto-moving rails). Remembered in this browser. */
export default function MotionToggle() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const sync = () => setReduced(motionPreference() === "reduced" || window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    sync(); window.addEventListener("efy-motion", sync); return () => window.removeEventListener("efy-motion", sync);
  }, []);
  return (
    <button type="button" className="nav-chip flex h-9 w-9 items-center justify-center rounded-full text-foreground" aria-pressed={reduced}
      aria-label={reduced ? "Motion reduced. Turn animations back on" : "Reduce motion"} title={reduced ? "Motion reduced — click to turn animations on" : "Reduce motion"}
      onClick={() => setMotionPreference(reduced ? "full" : "reduced")}>
      <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        {reduced ? <><path d="M5 12h14" /><path d="M5 7h9M5 17h11" /></> : <><path d="M3 12c2.5-4 5-4 7.5 0s5 4 7.5 0" /><path d="M3 17c2.5-4 5-4 7.5 0s5 4 7.5 0" opacity=".45" /><path d="M3 7c2.5-4 5-4 7.5 0s5 4 7.5 0" opacity=".45" /></>}
      </svg>
    </button>
  );
}
