import { useSettings } from "@/lib/site-settings";
import { ClaimTag } from "./future/ClaimTag";
import { useEffect, useRef, useState } from "react";
import { prefersReduced } from "@/lib/motion";

const STATS = [
  { value: 500, suffix: "+", label: "Testimonials", claim: "stat-testimonials" },
  { value: 100, suffix: "+", label: "Case Studies", claim: "stat-cases" },
  { value: 50, suffix: "+", label: "Niches Served", claim: "stat-niches" },
  { value: 3, suffix: "", label: "Continents", claim: "stat-continents" },
  { value: 1, suffix: "", label: "Mission" },
];

function CountUp({ target, suffix, onStart }: { target: number; suffix: string; onStart?: () => void }) {
  const [count, setCount] = useState(target);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReduced()) return;
    // Below the fold: start from zero and count up once it's seen. Already visible: keep the final number.
    if (el.getBoundingClientRect().top > window.innerHeight) setCount(0);
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started.current) return;
      started.current = true; onStart?.();
      const duration = 1500, start = performance.now();
      const step = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        setCount(Math.round((1 - Math.pow(1 - p, 3)) * target));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, onStart]);

  return <span ref={ref} className="tabular-nums">{count}{suffix}</span>;
}

/** Figures as instrument dials: each ring draws round while its number counts up. */
export default function StatsSection() {
  const settings = useSettings();
  const shown = STATS.filter((s) => !s.claim || settings[`claim:${s.claim}`]?.display !== "hide");
  return (
    <section className="st band-ink section-padding" aria-label="EmmaForYou in numbers">
      <div className="hero-ink-grid" aria-hidden="true" />
      <ul className="relative mx-auto grid max-w-6xl grid-cols-2 gap-8 md:grid-cols-5">
        {shown.map((stat, i) => (
          <li key={stat.label} className="st-item" style={{ ["--i" as string]: i }}>
            <span className="st-dial" aria-hidden="true">
              <svg viewBox="0 0 120 120"><circle className="st-track" cx="60" cy="60" r="52" /><circle className="st-arc" cx="60" cy="60" r="52" pathLength={1} /></svg>
            </span>
            <span className="st-num font-display"><CountUp target={stat.value} suffix={stat.suffix} /></span>
            <span className="st-label">{stat.label}</span>
            {stat.claim && <ClaimTag id={stat.claim} />}
          </li>
        ))}
      </ul>
    </section>
  );
}
