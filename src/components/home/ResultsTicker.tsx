import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { prefersReduced } from "@/lib/motion";
import { ClaimGate, ClaimTag } from "../future/ClaimTag";

const RESULTS = [
  "🇳🇬 Fashion store in Lagos: +312% website traffic",
  "🇺🇸 Real estate agent in Maryland: 47 new leads generated",
  "🇬🇧 Course creator in London: £18,000 course launch",
  "🇩🇪 Auto dealer in Halle: 3x more test drive bookings",
  "🇳🇬 Clinic in Abuja: 86 new Google reviews added",
  "🇿🇦 Fitness studio in Cape Town: memberships doubled in 60 days",
  "🇬🇭 Fashion brand in Accra: first 1,000 Instagram followers",
  "🇳🇬 Restaurant in Port Harcourt: fully booked every weekend",
];
const MS = 4000;

/**
 * Signal strip under the hero: one client result at a time, sliding through a mask, with a timer
 * line that fills while it's shown (the line's animation is the clock, so pausing it pauses the strip). Pauses on hover/focus and with the pause button (WCAG 2.2.2);
 * reduced-motion visitors get manual previous/next only.
 */
export default function ResultsTicker() {
  return <ClaimGate id="results-ticker"><Ticker /></ClaimGate>;
}

function Ticker() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hold, setHold] = useState(false);
  const [auto, setAuto] = useState(true);
  useEffect(() => { if (prefersReduced()) setAuto(false); }, []);
  const running = auto && !paused && !hold;
  const step = (d: number) => setI((x) => (x + d + RESULTS.length) % RESULTS.length);
  const [where, what] = RESULTS[i].split(":");

  return (
    <div className="rt" onPointerEnter={() => setHold(true)} onPointerLeave={() => setHold(false)} onFocus={() => setHold(true)} onBlur={() => setHold(false)}>
      <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-5 md:gap-5 md:px-8">
        <span className="rt-label"><span className="rt-live" aria-hidden="true" />Client results <ClaimTag id="results-ticker" /></span>
        <div className="rt-window" aria-live={running ? "off" : "polite"}>
          <p key={i} className="rt-item">
            <span className="rt-what">{what?.trim()}</span>
            <span className="rt-where">— {where}</span>
          </p>
        </div>
        <div className="rt-controls">
          <span className="rt-count" aria-hidden="true">{String(i + 1).padStart(2, "0")}<span>/{String(RESULTS.length).padStart(2, "0")}</span></span>
          <button type="button" onClick={() => step(-1)} aria-label="Previous result"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
          {auto && <button type="button" onClick={() => setPaused((p) => !p)} aria-label={paused ? "Play results" : "Pause results"} aria-pressed={paused}>{paused ? <Play className="h-3.5 w-3.5" aria-hidden="true" /> : <Pause className="h-3.5 w-3.5" aria-hidden="true" />}</button>}
          <button type="button" onClick={() => step(1)} aria-label="Next result"><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
        </div>
      </div>
      {auto && <span key={`bar-${i}`} className="rt-timer" data-paused={!running || undefined} style={{ ["--rt-ms" as string]: `${MS}ms` }} onAnimationEnd={() => step(1)} aria-hidden="true" />}
    </div>
  );
}
