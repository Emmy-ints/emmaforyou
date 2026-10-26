import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { levelForPath, prefersReduced } from "@/lib/motion";

const CARD = '[class*="shadow-[var(--shadow-card)]"], .dash-card, .lg, .lg-strong';
const MAGNET = ".btn-primary-gradient, .btn-gold, .nav-cta, [data-magnetic]";
const REVEAL = "section, ul.grid > li, ol.grid > li, [data-rv-item]";
const NO_REVEAL = "[data-no-reveal], [role='dialog'], .hero-ink, .story, form";

/**
 * One runtime for the whole site. It
 *  - sets the motion level on <html> per route (cinematic / expressive / subtle / reduced),
 *  - reveals below-the-fold sections once as they scroll into view (never hides what is on screen),
 *  - starts kinetic headings (.kt) only when they come into view,
 *  - feeds scroll progress to [data-scroll] elements as --sp (0 → 1 while the element crosses the
 *    viewport) and --sv (−1 → 1, centred), so sections can parallax and scrub in pure CSS,
 *  - adds a pointer spotlight to cards, a gentle pull to primary buttons and a restrained 3D tilt to
 *    [data-tilt] surfaces (fine pointers only),
 *  - plays a short page entrance when the browser can't do a view transition.
 * One scroll listener and one pointer listener for the whole page, rAF-throttled, all cleaned up on
 * route change. Reduced-motion visitors get none of the movement and nothing is ever hidden.
 */
export default function MotionRuntime() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Re-run everything when the visitor flips the motion switch.
  const [pref, setPref] = useState(0);
  useEffect(() => { const on = () => setPref((n) => n + 1); window.addEventListener("efy-motion", on); return () => window.removeEventListener("efy-motion", on); }, []);

  // Level, reveals, kinetic headings and scroll progress, per route.
  useEffect(() => {
    const root = document.documentElement;
    const reduced = prefersReduced();
    const level = reduced ? "reduced" : levelForPath(pathname);
    root.dataset.motion = level;
    if (reduced) return;

    let revealIO: IntersectionObserver | null = null;
    const marked: HTMLElement[] = [];
    const fold = () => window.innerHeight * 0.92;

    // Kinetic headings wait until they are on screen.
    const ktIO = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { (e.target as HTMLElement).dataset.kt = "go"; ktIO.unobserve(e.target); }
    }, { rootMargin: "0px 0px -8% 0px" });
    const armKinetic = (scope: ParentNode) => {
      scope.querySelectorAll<HTMLElement>(".kt:not([data-kt])").forEach((el) => {
        if (el.getBoundingClientRect().top < fold()) { el.dataset.kt = "go"; return; }
        el.dataset.kt = "wait"; ktIO.observe(el);
      });
    };

    // Scroll progress for [data-scroll] elements that are near the viewport.
    const live = new Set<HTMLElement>();
    const scrollIO = new IntersectionObserver((entries) => {
      for (const e of entries) { const el = e.target as HTMLElement; if (e.isIntersecting) live.add(el); else live.delete(el); }
      schedule();
    }, { rootMargin: "20% 0px 20% 0px" });
    const seen = new WeakSet<Element>();
    const armScroll = (scope: ParentNode) => {
      scope.querySelectorAll<HTMLElement>("[data-scroll]").forEach((el) => { if (!seen.has(el)) { seen.add(el); scrollIO.observe(el); } });
    };
    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      for (const el of live) {
        const r = el.getBoundingClientRect();
        const sp = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
        el.style.setProperty("--sp", sp.toFixed(4));
        el.style.setProperty("--sv", (sp * 2 - 1).toFixed(4));
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    // Content that appears later (tabs, lazy sections, client-only widgets) gets the same treatment.
    let mo: MutationObserver | null = null; let moTimer = 0;
    const t = window.setTimeout(() => {
      const main = document.querySelector("main") ?? document.body;
      armKinetic(document); armScroll(document);
      if (level !== "subtle") {
        const all = Array.from(main.querySelectorAll<HTMLElement>(REVEAL)).filter((el) => !el.closest(NO_REVEAL) && !el.hasAttribute("data-rv"));
        // Animate the finest level only: a section that contains other candidates isn't animated itself.
        const leaves = all.filter((el) => !all.some((o) => o !== el && el.contains(o))).slice(0, 320);
        revealIO = new IntersectionObserver((entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            const el = e.target as HTMLElement;
            el.dataset.rv = "in"; revealIO?.unobserve(el);
            // Drop the reveal styles once played so they never interfere with the element's own transforms.
            window.setTimeout(() => { el.removeAttribute("data-rv"); el.style.removeProperty("--rv-delay"); }, 1500);
          }
        }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
        for (const el of leaves) {
          if (el.getBoundingClientRect().top < fold()) continue; // already on screen: never hide it
          const parent = el.parentElement;
          if (parent && (parent.tagName === "UL" || parent.tagName === "OL")) el.style.setProperty("--rv-delay", `${(Array.prototype.indexOf.call(parent.children, el) % 6) * 70}ms`);
          el.dataset.rv = "pending";
          marked.push(el);
          revealIO.observe(el);
        }
      }
      mo = new MutationObserver(() => {
        window.clearTimeout(moTimer);
        moTimer = window.setTimeout(() => { armKinetic(document); armScroll(document); }, 120);
      });
      mo.observe(document.body, { childList: true, subtree: true });
      schedule();
    }, 120);

    return () => {
      window.clearTimeout(t); window.clearTimeout(moTimer);
      revealIO?.disconnect(); ktIO.disconnect(); scrollIO.disconnect(); mo?.disconnect();
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
      for (const el of marked) { el.removeAttribute("data-rv"); el.style.removeProperty("--rv-delay"); }
      document.querySelectorAll<HTMLElement>(".kt[data-kt]").forEach((el) => { el.dataset.kt = "go"; });
      document.querySelectorAll<HTMLElement>("[data-scroll]").forEach((el) => { el.style.removeProperty("--sp"); el.style.removeProperty("--sv"); });
    };
  }, [pathname, pref]);

  // Short entrance animation between pages, only where the browser can't run a view transition.
  useEffect(() => {
    const w = window as Window & { __efyNav?: number };
    w.__efyNav = (w.__efyNav ?? 0) + 1;
    if (w.__efyNav === 1 || prefersReduced() || "startViewTransition" in document) return;
    const main = document.getElementById("main-content") ?? document.querySelector("main");
    if (!main) return;
    main.classList.remove("efy-page-in"); void main.offsetWidth; main.classList.add("efy-page-in");
    const done = () => main.classList.remove("efy-page-in");
    main.addEventListener("animationend", done, { once: true });
    return () => main.removeEventListener("animationend", done);
  }, [pathname]);

  // Pointer spotlight on cards, magnetic primary buttons and 3D tilt (fine pointers only, one listener, rAF-throttled).
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches || prefersReduced()) return;
    let frame = 0; let last: PointerEvent | null = null;
    let card: HTMLElement | null = null; let magnet: HTMLElement | null = null; let tilt: HTMLElement | null = null;
    const release = (el: HTMLElement | null, props: string[]) => { if (el) for (const p of props) el.style.removeProperty(p); };
    const apply = () => {
      frame = 0;
      const e = last; if (!e) return;
      const target = e.target instanceof Element ? e.target : null;
      const c = target?.closest<HTMLElement>(CARD) ?? null;
      if (c !== card) { release(card, ["--mx", "--my"]); card = c; }
      if (card) { const r = card.getBoundingClientRect(); card.style.setProperty("--mx", `${e.clientX - r.left}px`); card.style.setProperty("--my", `${e.clientY - r.top}px`); }
      const level = document.documentElement.dataset.motion;
      const lively = level === "cinematic" || level === "expressive";
      const m = lively ? target?.closest<HTMLElement>(MAGNET) ?? null : null;
      if (m !== magnet) { release(magnet, ["--mag-x", "--mag-y"]); magnet = m; }
      if (magnet) {
        const r = magnet.getBoundingClientRect();
        const dx = Math.max(-6, Math.min(6, (e.clientX - (r.left + r.width / 2)) * 0.18));
        const dy = Math.max(-4, Math.min(4, (e.clientY - (r.top + r.height / 2)) * 0.22));
        magnet.style.setProperty("--mag-x", `${dx.toFixed(1)}px`); magnet.style.setProperty("--mag-y", `${dy.toFixed(1)}px`);
      }
      const tl = lively ? target?.closest<HTMLElement>("[data-tilt]") ?? null : null;
      if (tl !== tilt) { release(tilt, ["--tilt-r", "--gx", "--gy"]); tilt?.removeAttribute("data-tilting"); tilt = tl; }
      if (tilt) {
        const r = tilt.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        const max = Number(tilt.dataset.tilt) || 6;
        tilt.dataset.tilting = "";
        // rotateX(ry) rotateY(rx) as one axis–angle, so it lives on the `rotate` property and never
        // fights an element's own transform (framer-motion entrances, hover lifts).
        const rx = (px - 0.5) * max * 2, ry = (0.5 - py) * max * 2;
        const mag = Math.hypot(rx, ry);
        tilt.style.setProperty("--tilt-r", mag < 0.01 ? "none" : `${(ry / mag).toFixed(3)} ${(rx / mag).toFixed(3)} 0 ${mag.toFixed(2)}deg`);
        tilt.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`); tilt.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
      }
    };
    const onMove = (e: PointerEvent) => { last = e; if (!frame) frame = requestAnimationFrame(apply); };
    const onLeave = () => { release(card, ["--mx", "--my"]); release(magnet, ["--mag-x", "--mag-y"]); release(tilt, ["--tilt-r", "--gx", "--gy"]); tilt?.removeAttribute("data-tilting"); card = null; magnet = null; tilt = null; };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    return () => { document.removeEventListener("pointermove", onMove); document.removeEventListener("pointerleave", onLeave); window.removeEventListener("blur", onLeave); if (frame) cancelAnimationFrame(frame); onLeave(); };
  }, [pref]);

  return <div className="efy-grain" aria-hidden="true" />;
}
