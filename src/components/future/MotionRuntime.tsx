import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { levelForPath, prefersReduced } from "@/lib/motion";

const CARD = '[class*="shadow-[var(--shadow-card)]"], .dash-card, .lg, .lg-strong';
const MAGNET = ".btn-primary-gradient, .btn-gold, .nav-cta, [data-magnetic]";

/**
 * One runtime for the whole site: sets the motion level on <html>, reveals content as it scrolls
 * into view, adds a pointer spotlight to cards and a gentle pull to primary buttons, and plays a
 * short entrance on route changes. Nothing is hidden unless JavaScript is running, everything is
 * cleaned up on route change, and reduced-motion visitors get none of the movement.
 */
export default function MotionRuntime() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Level + reveals + page entrance, per route.
  useEffect(() => {
    const root = document.documentElement;
    const reduced = prefersReduced();
    const level = reduced ? "reduced" : levelForPath(pathname);
    root.dataset.motion = level;
    if (reduced || level === "subtle") return;

    let io: IntersectionObserver | null = null;
    const marked: HTMLElement[] = [];
    const t = window.setTimeout(() => {
      const main = document.querySelector("main");
      if (!main) return;
      const all = Array.from(main.querySelectorAll<HTMLElement>("section, ul.grid > li, ol.grid > li, [data-rv-item]"))
        .filter((el) => !el.closest("[data-no-reveal], [role='dialog'], .hero-ink, .story, form") && !el.hasAttribute("data-rv"));
      // Animate the finest level only: a section that contains other candidates isn't animated itself.
      const leaves = all.filter((el) => !all.some((o) => o !== el && el.contains(o))).slice(0, 320);
      const fold = window.innerHeight * 0.92;
      io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          el.dataset.rv = "in"; io?.unobserve(el);
          // Drop the reveal styles once played so they never interfere with the element's own transforms.
          window.setTimeout(() => { el.removeAttribute("data-rv"); el.style.removeProperty("--rv-delay"); }, 1500);
        }
      }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
      for (const el of leaves) {
        if (el.getBoundingClientRect().top < fold) continue; // already on screen: never hide it
        const parent = el.parentElement;
        if (parent && (parent.tagName === "UL" || parent.tagName === "OL")) el.style.setProperty("--rv-delay", `${(Array.prototype.indexOf.call(parent.children, el) % 6) * 70}ms`);
        el.dataset.rv = "pending";
        marked.push(el);
        io.observe(el);
      }
    }, 120);
    return () => {
      window.clearTimeout(t);
      io?.disconnect();
      for (const el of marked) { el.removeAttribute("data-rv"); el.style.removeProperty("--rv-delay"); }
    };
  }, [pathname]);

  // Short entrance animation when moving between pages (not on first load).
  useEffect(() => {
    const w = window as Window & { __efyNav?: number };
    w.__efyNav = (w.__efyNav ?? 0) + 1;
    if (w.__efyNav === 1 || prefersReduced()) return;
    const main = document.getElementById("main-content") ?? document.querySelector("main");
    if (!main) return;
    main.classList.remove("efy-page-in"); void main.offsetWidth; main.classList.add("efy-page-in");
    const done = () => main.classList.remove("efy-page-in");
    main.addEventListener("animationend", done, { once: true });
    return () => main.removeEventListener("animationend", done);
  }, [pathname]);

  // Pointer spotlight on cards and magnetic primary buttons (fine pointers only, one listener, rAF-throttled).
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches || prefersReduced()) return;
    let frame = 0; let last: PointerEvent | null = null;
    let card: HTMLElement | null = null; let magnet: HTMLElement | null = null;
    const release = (el: HTMLElement | null, props: string[]) => { if (el) for (const p of props) el.style.removeProperty(p); };
    const apply = () => {
      frame = 0;
      const e = last; if (!e) return;
      const target = e.target instanceof Element ? e.target : null;
      const c = target?.closest<HTMLElement>(CARD) ?? null;
      if (c !== card) { release(card, ["--mx", "--my"]); card = c; }
      if (card) { const r = card.getBoundingClientRect(); card.style.setProperty("--mx", `${e.clientX - r.left}px`); card.style.setProperty("--my", `${e.clientY - r.top}px`); }
      const level = document.documentElement.dataset.motion;
      const m = level === "cinematic" || level === "expressive" ? target?.closest<HTMLElement>(MAGNET) ?? null : null;
      if (m !== magnet) { release(magnet, ["--mag-x", "--mag-y"]); magnet = m; }
      if (magnet) {
        const r = magnet.getBoundingClientRect();
        const dx = Math.max(-6, Math.min(6, (e.clientX - (r.left + r.width / 2)) * 0.18));
        const dy = Math.max(-4, Math.min(4, (e.clientY - (r.top + r.height / 2)) * 0.22));
        magnet.style.setProperty("--mag-x", `${dx.toFixed(1)}px`); magnet.style.setProperty("--mag-y", `${dy.toFixed(1)}px`);
      }
    };
    const onMove = (e: PointerEvent) => { last = e; if (!frame) frame = requestAnimationFrame(apply); };
    const onLeave = () => { release(card, ["--mx", "--my"]); release(magnet, ["--mag-x", "--mag-y"]); card = null; magnet = null; };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    return () => { document.removeEventListener("pointermove", onMove); document.removeEventListener("pointerleave", onLeave); window.removeEventListener("blur", onLeave); if (frame) cancelAnimationFrame(frame); onLeave(); };
  }, []);

  return <div className="efy-grain" aria-hidden="true" />;
}
