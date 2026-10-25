import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BarChart3, Bot, Megaphone, Search } from "lucide-react";
import { prefersReduced } from "@/lib/motion";

/**
 * "Found → Followed → Automated → Growing": a pinned, scroll-scrubbed story on large screens (the
 * scene stays in place while scrolling moves through four chapters), and a plain stacked list on
 * phones, tablets and for reduced-motion visitors. Describes how EmmaForYou works; no figures.
 */
const CHAPTERS = [
  { key: "found", icon: Search, kicker: "01 · Found", title: "Be the business people find first", body: "A fast website, search-friendly pages and a complete Google profile, so customers who are already looking land on you, not a competitor.", chips: ["Websites & stores", "SEO", "Google Business"], to: "/services" },
  { key: "followed", icon: Megaphone, kicker: "02 · Followed", title: "Stay in front of the people who care", body: "Social content, email and ads that keep your brand visible and bring visitors back until they're ready to buy.", chips: ["Social media", "Email", "Ads"], to: "/services" },
  { key: "automated", icon: Bot, kicker: "03 · Automated", title: "Answer every enquiry, day and night", body: "AI chat and WhatsApp assistants that reply in seconds, book appointments and follow up, with a person stepping in whenever it matters.", chips: ["AI assistants", "WhatsApp", "Booking"], to: "/solutions" },
  { key: "growing", icon: BarChart3, kicker: "04 · Growing", title: "See what works, then do more of it", body: "Clear reporting on where customers come from and what they do, so every next step is based on what's actually happening.", chips: ["Dashboards", "Analytics", "Ongoing support"], to: "/book" },
] as const;

export default function GrowthStory() {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);
  const [p, setP] = useState(0);

  useEffect(() => {
    const decide = () => setPinned(!prefersReduced() && window.innerWidth >= 1024 && window.innerHeight >= 620);
    decide();
    window.addEventListener("resize", decide);
    return () => window.removeEventListener("resize", decide);
  }, []);

  useEffect(() => {
    if (!pinned) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = track.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const total = Math.max(1, r.height - window.innerHeight);
      const prog = Math.min(1, Math.max(0, -r.top / total));
      setP(prog);
      setActive(Math.min(CHAPTERS.length - 1, Math.floor(prog * CHAPTERS.length * 0.999)));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [pinned]);

  const heading = (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--emma-cyan)]">How we grow businesses</p>
      <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white md:text-5xl">Found, followed, fully automated.</h2>
    </div>
  );

  if (!pinned) {
    return (
      <section className="hero-ink story relative overflow-hidden py-20" aria-labelledby="story-h">
        <div className="hero-ink-grid" aria-hidden="true" />
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div id="story-h">{heading}</div>
          <ol className="mt-10 grid gap-4 md:grid-cols-2">
            {CHAPTERS.map((c) => <li key={c.key}><ChapterCard c={c} /></li>)}
          </ol>
        </div>
      </section>
    );
  }

  return (
    <section className="hero-ink story" aria-labelledby="story-h" style={{ ["--p" as string]: p }}>
      <div ref={track} className="story-track" style={{ height: `${CHAPTERS.length * 85 + 40}svh` }}>
        <div className="story-sticky">
          <div className="hero-ink-grid" aria-hidden="true" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(700px 520px at ${70 - p * 40}% ${30 + p * 30}%, rgba(109,91,255,.28), transparent 65%)` }} />
          <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
            <div>
              <div id="story-h">{heading}</div>
              <ol className="mt-10 space-y-1.5" aria-label="Chapters">
                {CHAPTERS.map((c, i) => (
                  <li key={c.key} className={`flex items-center gap-3 text-sm font-semibold transition-colors duration-500 ${i === active ? "text-white" : "text-white/35"}`}>
                    <span className={`h-px transition-all duration-700 ${i === active ? "w-10 bg-[var(--emma-cyan)]" : "w-5 bg-white/25"}`} aria-hidden="true" />{c.kicker}
                  </li>
                ))}
              </ol>
            </div>
            <div className="relative grid">
              {CHAPTERS.map((c, i) => (
                <div key={c.key} className="story-chapter [grid-area:1/1]" data-state={i === active ? "active" : i < active ? "after" : "before"} aria-hidden={i !== active}>
                  <ChapterCard c={c} big focusable={i === active} />
                </div>
              ))}
            </div>
          </div>
          <div className="story-progress" aria-hidden="true"><span /></div>
        </div>
      </div>
    </section>
  );
}

function ChapterCard({ c, big, focusable = true }: { c: (typeof CHAPTERS)[number]; big?: boolean; focusable?: boolean }) {
  const Icon = c.icon;
  return (
    <article className={`lg-strong h-full rounded-[28px] text-white ${big ? "p-9 md:p-11" : "p-6"}`} style={{ background: "linear-gradient(160deg, rgba(255,255,255,.07), rgba(255,255,255,.02))" }}>
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-[var(--emma-cyan)] shadow-[inset_0_1px_0_rgba(255,255,255,.2)]"><Icon className="h-6 w-6" aria-hidden="true" /></span>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">{c.kicker}</p>
      <h3 className={`mt-2 font-display font-semibold tracking-tight ${big ? "text-3xl md:text-4xl" : "text-2xl"}`}>{c.title}</h3>
      <p className={`mt-3 text-white/70 ${big ? "text-lg" : ""}`}>{c.body}</p>
      <ul className="mt-6 flex flex-wrap gap-2">{c.chips.map((x) => <li key={x} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/85">{x}</li>)}</ul>
      <Link to={c.to} tabIndex={focusable ? undefined : -1} className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--emma-cyan)] hover:underline">Explore how →</Link>
    </article>
  );
}
