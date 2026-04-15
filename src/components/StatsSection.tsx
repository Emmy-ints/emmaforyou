import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: 500, suffix: "+", label: "Testimonials" },
  { value: 100, suffix: "+", label: "Case Studies" },
  { value: 50, suffix: "+", label: "Niches Served" },
  { value: 3, suffix: "", label: "Continents" },
  { value: 1, suffix: "", label: "Mission" },
];

function CountUp({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1500;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  );
}

export default function StatsSection() {
  return (
    <section className="section-padding" style={{ background: "var(--gradient-dark)" }}>
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {STATS.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="font-display text-4xl font-extrabold text-white md:text-5xl">
                <CountUp target={stat.value} suffix={stat.suffix} />
              </div>
              <p className="mt-2 text-sm font-medium text-white/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
