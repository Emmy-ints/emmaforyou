import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useRouterState } from "@tanstack/react-router";
import { useSettings } from "@/lib/site-settings";
import { FOUNDER } from "@/lib/seo";
import { founderConfig, type FounderPlacement, type FounderSize } from "@/lib/founder-presence";

/**
 * Founder presence, site-wide. Mounted once in __root, so every public page — including dynamic
 * routes and pages added later — gets Emmanuel's real portrait (crops of /images/emmanuel.webp)
 * without per-page code. It never moves, wraps or restyles existing elements:
 *  - "signature": a portrait + name chip placed in an EMPTY part of the page's hero;
 *  - "watermark": a larger faded arch portrait in an empty part of a dark hero (wide screens);
 *  - "byline": a slim founder row inserted directly after the hero (fallback when the hero has no free space).
 * Every candidate spot is checked against all text, buttons, links, images and cards in the hero, and
 * a spot that would touch any of them is rejected. Pages that already show the founder near the top
 * (homepage, About, Contact, Book — marked data-founder-presence) are left as they are.
 */

type Kind = "signature" | "watermark" | "byline" | "badge";
interface Slot { el: HTMLElement; kind: Kind; tone: "dark" | "light" }

const RING: Record<FounderSize, number> = { sm: 44, md: 56, lg: 68 };
const MARK: Record<FounderSize, [number, number]> = { sm: [150, 188], md: [184, 230], lg: [216, 270] };
const GAP = 18;

export default function FounderPresence() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const settings = useSettings();
  const cfg = useMemo(() => founderConfig(settings, path), [settings, path]);
  const [slot, setSlot] = useState<Slot | null>(null);
  const nodes = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const clear = () => { nodes.current.forEach((n) => n.remove()); nodes.current = []; setSlot(null); };
    clear();
    if (!cfg.on || cfg.type === "home" || cfg.type === "about" || typeof window === "undefined") return clear;
    let alive = true;
    const inlineIntro = cfg.type === "community";
    let current: { kind: Kind; hero: HTMLElement } | null = null;
    const timers: number[] = [];
    let ro: ResizeObserver | null = null;

    const place = (keep = false) => {
      if (!alive) return;
      const main = document.querySelector("main");
      const hero = main && findHero(main);
      if (!main || !hero) return;
      // Settling re-checks keep a portrait that is still in clear space (no flip-flopping between presentations).
      const el0 = nodes.current[0];
      if (keep && current && current.kind !== "byline" && current.hero === hero && el0?.isConnected && el0.firstElementChild && stillFree(el0.firstElementChild)) return;
      // The page already has a hand-placed founder portrait near the top: nothing to add.
      const explicit = [...main.querySelectorAll<HTMLElement>("[data-founder-presence]:not([data-founder-presence=global])")].find((e) => e.getBoundingClientRect().top + scrollY < innerHeight * 1.35);
      if (explicit) { clearNodes(); return; }
      const tone = isDark(hero) ? "dark" : "light";
      const want: Kind[] = cfg.placement === "byline" ? ["byline"]
        : cfg.placement === "watermark" ? ["watermark", "signature", "byline"]
        : cfg.placement === "signature" ? ["signature", "byline"]
        : tone === "dark" ? ["watermark", "signature", "byline"] : ["signature", "byline"];
      // Last resort for dense, viewport-locked layouts: the portrait ring alone, in the smallest free spot.
      want.push("badge");
      // Measure the page as it is without our own byline row (it pushes content down, which would make
      // room that disappears again as soon as the byline is replaced).
      const line = current?.kind === "byline" ? nodes.current[0] : undefined;
      if (line) line.style.display = "none";
      let found: { kind: Kind; pos: { x: number; y: number; w: number; dark?: boolean } | null } | null = null;
      for (const kind of want) {
        if (kind === "byline") { found = { kind, pos: null }; break; }
        if (kind === "watermark" && innerWidth < 1100) continue;
        const pos = findSpot(hero, kind, cfg.size);
        if (pos) { found = { kind, pos }; break; }
      }
      if (line) line.style.display = "";
      if (!found) return;
      if (found.kind === "byline") {
        if (show("byline", tone, hero, null)) return;
        for (const kind of want.slice(want.indexOf("byline") + 1)) { const pos = findSpot(hero, kind, cfg.size); if (pos) { show(kind, pos.dark === undefined ? tone : pos.dark ? "dark" : "light", hero, pos); return; } }
        return;
      }
      const pos = found.pos!;
      show(found.kind, pos.dark === undefined ? tone : pos.dark ? "dark" : "light", hero, pos);
    };

    const clearNodes = () => { nodes.current.forEach((n) => n.remove()); nodes.current = []; current = null; setSlot(null); };

    const show = (kind: Kind, tone: "dark" | "light", hero: HTMLElement, pos: { x: number; y: number; w: number } | null): boolean => {
      let el = nodes.current[0];
      if (!current || current.kind !== kind || current.hero !== hero || !el?.isConnected) {
        clearNodes();
        el = document.createElement("div");
        el.dataset.founderGlobal = kind;
        el.className = `efy-fp-slot efy-fp-${kind}`;
        // Inserted right after the hero, so keyboard order follows the visual order. When the hero is <main>
        // itself (a page without sections), it goes right after the headline's intro paragraph.
        const h1 = hero.querySelector("h1");
        if (h1 && (hero.tagName === "MAIN" || (kind === "byline" && (inlineIntro || hero.getBoundingClientRect().height > innerHeight * 1.1)))) {
          // no section wrapper, an app-style layout, or a tall multi-column page: right after the intro paragraph
          let anchor: Element = h1; let n = h1.nextElementSibling;
          for (let i = 0; n && i < 3; i++, n = n.nextElementSibling) if (n.tagName === "P") { anchor = n; break; }
          anchor.after(el);
        } else hero.after(el);
        // A byline joins the page flow. In a viewport-locked layout (fixed-height or clipped container, e.g. the
        // full-screen service world) it would push or hide existing controls, so
        // it is moved out to just after that container instead (below the full-screen area, never inside it).
        if (kind === "byline") {
          const main = document.querySelector("main");
          let box = el.parentElement;
          while (!roomForByline(el) && box && box !== main && main?.contains(box)) { box.after(el); box = el.parentElement; }
          if (!roomForByline(el)) { el.remove(); current = null; nodes.current = []; return false; }
        }
        nodes.current = [el];
        current = { kind, hero };
        setSlot({ el, kind, tone: kind === "byline" ? "light" : tone });
      }
      if (kind === "byline") { const e2 = el; requestAnimationFrame(() => alignByline(e2, hero)); }
      if (pos) {
        // Absolute, positioned against whatever the slot's containing block is (document coordinates in).
        const op = (el.offsetParent as HTMLElement | null) ?? document.body;
        const r = op === document.body || op === document.documentElement ? { left: -scrollX, top: -scrollY } : op.getBoundingClientRect();
        el.style.left = `${Math.round(pos.x - (r.left + scrollX))}px`;
        el.style.top = `${Math.round(pos.y - (r.top + scrollY))}px`;
        el.style.width = `${Math.round(pos.w)}px`;
      }
      return true;
    };

    const schedule = () => { timers.push(window.setTimeout(place, 60)); };
    // If the page changes after placement (data loads, tabs, animations), re-check: anything now under the portrait → move it.
    let mo: MutationObserver | null = null; let pending = 0;
    const validate = () => {
      pending = 0; const el = nodes.current[0]; if (!alive || !el || !current || current.kind === "byline") return;
      const mark = el.firstElementChild; if (!mark) return;
      const H = current.hero;
      if (!H.isConnected || coveredUnder(mark, el) || !stillFree(mark)) { current = null; place(); }
    };
    const main0 = document.querySelector("main");
    if (main0 && "MutationObserver" in window) { mo = new MutationObserver(() => { if (!pending) pending = window.setTimeout(validate, 300); }); mo.observe(main0, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "hidden", "open", "data-rv", "data-kt"] }); }
    const onScroll = () => { if (!pending) pending = window.setTimeout(validate, 250); };
    addEventListener("scroll", onScroll, { passive: true });
    // Pages settle after data loads, fonts and the entrance animation; re-check a few times, then on resize.
    for (const t of [350, 1100, 2400]) timers.push(window.setTimeout(() => place(t > 350), t));
    const onResize = () => { current = null; schedule(); };
    addEventListener("resize", onResize);
    timers.push(window.setTimeout(() => {
      const h = document.querySelector("main") && findHero(document.querySelector("main")!);
      if (h && "ResizeObserver" in window) { ro = new ResizeObserver(() => schedule()); ro.observe(h); }
    }, 400));
    return () => { alive = false; timers.forEach(clearTimeout); if (pending) clearTimeout(pending); removeEventListener("resize", onResize); removeEventListener("scroll", onScroll); ro?.disconnect(); mo?.disconnect(); clear(); };
  }, [cfg.on, cfg.type, cfg.placement, cfg.size, path]);

  if (!slot) return null;
  return createPortal(<FounderMark kind={slot.kind} tone={slot.tone} size={cfg.size} role={cfg.role} href={cfg.href} />, slot.el);
}

/** The portrait itself (one component, three presentations). */
export function FounderMark({ kind, tone, size, role, href }: { kind: Kind; tone: "dark" | "light"; size: FounderSize; role: string; href: string }) {
  const label = `${FOUNDER.name}, founder of EmmaForYou`;
  if (kind === "watermark") {
    const [w, h] = MARK[size];
    return (
      <figure className={`efy-fp-mark efy-fp-${tone}`} style={{ width: w }} data-founder-presence="global">
        <img src="/images/emmanuel-portrait-480.webp" width={480} height={600} alt="" aria-hidden="true" decoding="async" style={{ width: w, height: h }} />
        <figcaption><Link to={href} className="efy-fp-cap" aria-label={`Meet ${label}`}><span className="efy-fp-name">{FOUNDER.name}</span><span className="efy-fp-role">{role}</span></Link></figcaption>
      </figure>
    );
  }
  if (kind === "byline") {
    return (
      <div className={`efy-fp-line efy-fp-${tone}`} data-founder-presence="global">
        <div className="efy-fp-line-in">
          <Link to={href} className="efy-fp-sig" aria-label={`Meet ${label}`}>
            <span className="efy-fp-ring" style={{ width: 40, height: 40 }}><img src="/images/emmanuel-face-96.webp" width={96} height={96} alt="" decoding="async" /></span>
            <span className="efy-fp-text"><span className="efy-fp-name">{FOUNDER.name}</span><span className="efy-fp-role">{role}</span></span>
          </Link>
        </div>
      </div>
    );
  }
  const ring = RING[size];
  if (kind === "badge") return (
    <Link to={href} className={`efy-fp-sig efy-fp-badge efy-fp-${tone}`} aria-label={`Meet ${label}`} title={`${FOUNDER.name} · ${role}`} data-founder-presence="global">
      <span className="efy-fp-ring" style={{ width: ring, height: ring }}><img src="/images/emmanuel-face-256.webp" width={256} height={256} alt="" decoding="async" /></span>
    </Link>
  );
  return (
    <Link to={href} className={`efy-fp-sig efy-fp-chip efy-fp-${tone} efy-fp-${size}`} aria-label={`Meet ${label}`} data-founder-presence="global">
      <span className="efy-fp-ring" style={{ width: ring, height: ring }}><img src="/images/emmanuel-face-256.webp" width={256} height={256} alt="" decoding="async" /></span>
      <span className="efy-fp-text"><span className="efy-fp-name">{FOUNDER.name}</span><span className="efy-fp-role">{role}</span></span>
    </Link>
  );
}

/** True when an inserted (empty) byline slot can grow its container instead of pushing content out of a fixed box. */
function roomForByline(el: HTMLElement) {
  const parent = el.parentElement; if (!parent) return false;
  const probe = document.createElement("div"); probe.style.height = "60px";
  const before = parent.getBoundingClientRect().height; el.append(probe);
  const after = parent.getBoundingClientRect().height;
  let clipped = false;
  for (let n: HTMLElement | null = parent; n && n.tagName !== "BODY" && n.tagName !== "HTML"; n = n.parentElement) {
    if (/hidden|clip|auto|scroll/.test(getComputedStyle(n).overflowY) && n.scrollHeight - n.clientHeight >= 30 && n.clientHeight <= innerHeight * 1.05) { clipped = true; break; }
  }
  // The container either grows with the row, or (min-height layouts) had slack and its content still fits.
  const fits = after - before >= 55 || parent.scrollHeight <= parent.clientHeight + 1;
  probe.remove();
  return !clipped && fits;
}

/** Line the byline up with the hero's text column (centred when the headline is centred). */
function alignByline(el: HTMLElement, hero: HTMLElement) {
  const h1 = hero.querySelector("h1"); const inner = el.firstElementChild as HTMLElement | null;
  if (!h1 || !el.isConnected) return;
  const col = (h1.parentElement ?? h1).getBoundingClientRect(), me = el.getBoundingClientRect();
  const centred = getComputedStyle(h1).textAlign === "center";
  el.style.setProperty("--fp-left", `${Math.max(0, Math.round(col.left - me.left))}px`);
  el.style.setProperty("--fp-width", `${Math.round(Math.min(col.width, me.width))}px`);
  el.style.setProperty("--fp-justify", centred ? "center" : "flex-start");
  el.classList.toggle("efy-fp-inline", !!el.parentElement && el.parentElement !== hero.parentElement);
  if (inner) inner.dataset.aligned = "1";
}

/**
 * Cheap re-check while the page lives (scrolls, data updates): hit-test a grid of points under the
 * portrait and see whether any text, control, media or card now sits beneath it. Only runs when the
 * portrait is on screen (that's the only time an overlap can be seen).
 */
function coveredUnder(mark: Element, slot: HTMLElement): boolean {
  const r = mark.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight || r.width < 4) return false;
  for (let i = 0; i <= 4; i++) for (let j = 0; j <= 2; j++) {
    const x = r.left + 3 + ((r.width - 6) * i) / 4, y = r.top + 3 + ((r.height - 6) * j) / 2;
    if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
    for (const el of document.elementsFromPoint(x, y) as HTMLElement[]) {
      if (slot.contains(el) || el.contains(slot) || el === document.documentElement || el === document.body) continue;
      if (el.closest(".site-header")) continue;
      const cs = getComputedStyle(el);
      if (cs.position === "fixed" || cs.pointerEvents === "none" || (el.getAttribute("aria-hidden") === "true" && cs.position === "absolute")) continue;
      const own = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent!.trim());
      const control = /^(A|BUTTON|INPUT|SELECT|TEXTAREA|LABEL|IMG|SVG|CANVAS|VIDEO|IFRAME|PICTURE)$/i.test(el.tagName);
      const er = el.getBoundingClientRect();
      const small = er.width * er.height < innerWidth * innerHeight * 0.3;
      const contains = er.left <= r.left && er.right >= r.right && er.top <= r.top && er.bottom >= r.bottom; // a card we sit inside
      const surface = small && !contains && ((cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent") || parseFloat(cs.borderTopWidth) > 0 || cs.boxShadow !== "none");
      if (own || control || surface) return true;
    }
  }
  return false;
}

/** Full geometric re-check (also below the fold): the portrait's box is still clear of content and card edges. */
function stillFree(mark: Element): boolean {
  const r = docBox(mark); if (r.r - r.l < 4) return false;
  const frames: Box[] = [];
  const obs = obstacles(document.body, { l: r.l - 8, t: r.t - 8, r: r.r + 8, b: r.b + 8 }, frames);
  const inside = (a: Box, f: Box) => a.l >= f.l + 4 && a.r <= f.r - 4 && a.t >= f.t + 4 && a.b <= f.b - 4;
  return !obs.some((o) => hit(r, o, 4)) && !frames.some((f) => hit(r, f, 4) && !inside(r, f));
}

/* ───────── placement helpers (pure DOM measurement, no changes to existing elements) ───────── */

const decorative = (el: HTMLElement) => {
  const cs = getComputedStyle(el);
  return el.getAttribute("aria-hidden") === "true" || cs.position === "absolute" || cs.position === "fixed" || cs.pointerEvents === "none" || !!el.dataset.founderGlobal;
};
/**
 * The page's opening block: the largest block around the page's main headline that is still about one
 * screen tall (works for section heroes, layout routes with sidebars, and pages without sections);
 * pages without a headline use the first substantial, non-decorative child of <main>.
 */
export function findHero(main: Element): HTMLElement | null {
  const limit = Math.max(innerHeight * 1.3, 720);
  const h1 = [...main.querySelectorAll<HTMLElement>("h1")].find((h) => h.getBoundingClientRect().height > 0 && !h.closest("[data-founder-global]"));
  if (h1) {
    let el: HTMLElement = h1;
    while (el.parentElement && el.parentElement !== main && el.parentElement.getBoundingClientRect().height <= limit) el = el.parentElement;
    // a headline sitting loose in <main> (no wrapper): the hero is <main> itself
    return el === h1 && h1.parentElement === main ? (main as HTMLElement) : el;
  }
  for (const c of Array.from(main.children) as HTMLElement[]) {
    if (decorative(c)) continue;
    const r = c.getBoundingClientRect();
    if (r.height >= 120 && r.width >= 240) return c;
  }
  return null;
}

function lum(rgb: string) {
  const m = rgb.match(/[\d.]+/g); if (!m) return 1;
  const [r, g, b] = m.map(Number); return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
/** Dark if the hero's heading (or text) is light. */
function isDark(hero: HTMLElement) {
  if (hero.matches(".hero-ink, .band-ink") || hero.querySelector(":scope > .hero-ink")) return true;
  const h = hero.querySelector("h1, h2, p");
  return h ? lum(getComputedStyle(h).color) > 0.62 : false;
}

interface Box { l: number; t: number; r: number; b: number }
const docBox = (el: Element): Box => { const r = el.getBoundingClientRect(); return { l: r.left + scrollX, t: r.top + scrollY, r: r.right + scrollX, b: r.bottom + scrollY }; };
const hit = (a: Box, b: Box, pad: number) => a.l < b.r + pad && a.r > b.l - pad && a.t < b.b + pad && a.b > b.t - pad;

/**
 * Everything in a band of the page that a portrait must not touch: text, controls, media and visible
 * boxes. Elements that are still animating in (opacity 0) count too; only display:none is ignored.
 */
export function obstacles(root: HTMLElement, band?: Box, frames?: Box[]): Box[] {
  const R = band ?? docBox(root);
  const area = (R.r - R.l) * (R.b - R.t);
  const out: Box[] = [];
  root.querySelectorAll<HTMLElement>("*").forEach((el) => {
    if (el.closest("[data-founder-global], .site-header, script, style")) return;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    let d = { l: r.left + scrollX, t: r.top + scrollY, r: r.right + scrollX, b: r.bottom + scrollY };
    // Still moving in (scroll reveals, entrance animations): it may end up nearby, so give it extra room.
    const moving = el.closest("[data-rv], [data-kt]") || getComputedStyle(el).transform !== "none";
    if (moving) d = { l: d.l - 48, t: d.t - 64, r: d.r + 48, b: d.b + 64 };
    if (!hit(d, R, GAP)) return;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.position === "fixed") return;
    const big = (d.r - d.l) * (d.b - d.t) > area * 0.45;
    // full-size decoration (grids, glows, backgrounds) doesn't count
    // (an aria-hidden illustration in the flow is still visible, so it counts)
    if (big && (cs.pointerEvents === "none" || cs.position === "absolute")) return;
    const tag = el.tagName;
    const ownText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent!.trim());
    const control = /^(A|BUTTON|INPUT|SELECT|TEXTAREA|LABEL|IMG|SVG|CANVAS|VIDEO|IFRAME|PICTURE)$/i.test(tag) || el.getAttribute("role") === "img";
    const surface = (cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent") || parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderBottomWidth) > 0 || cs.boxShadow !== "none" || cs.backgroundImage !== "none";
    // big cards and panels: never straddle their edge (sit fully inside or fully outside)
    if (big && surface && frames && cs.position !== "absolute") frames.push(d);
    if (ownText || control || (!big && surface)) out.push(d);
  });
  return out;
}

/** First free spot (document coordinates) for a mark of this kind inside the hero, or null. */
export function findSpot(hero: HTMLElement, kind: Kind, size: FounderSize): { x: number; y: number; w: number; dark?: boolean } | null {
  const H = docBox(hero);
  const vw = document.documentElement.clientWidth;
  const header = (document.querySelector(".site-header") as HTMLElement | null)?.getBoundingClientRect().height ?? 72;
  const ring = RING[size];
  const [mw, mh] = MARK[size];
  const w = kind === "badge" ? ring : kind === "watermark" ? mw : Math.min(vw - 32, ring + 12 + Math.min(270, Math.max(190, vw * 0.5)));
  const h = kind === "watermark" ? mh + 44 : ring;
  const top = H.t < header + 4 ? header + 4 : H.t; // heroes that start under the fixed header
  // the hero, or at least the upper ~60% of the first screen when the hero is just a short intro
  const bottom = Math.min(Math.max(H.b, top + innerHeight * 0.62), top + Math.max(innerHeight * 1.1, 520));
  // Search across the page's full content width at the hero's height (the hero may be a narrow column).
  const main = (hero.closest("main") as HTMLElement | null) ?? hero;
  const M = docBox(main);
  const left = Math.max(Math.min(H.l, M.l), 0) + 16, right = Math.min(Math.max(H.r, M.r), vw) - 16;
  const end = Math.min(bottom, M.b - 8); // never past the page's content (into the footer)
  const frames: Box[] = [];
  const obs = obstacles(document.body, { l: left, t: top, r: right, b: end }, frames);
  const inside = (a: Box, f: Box) => a.l >= f.l + GAP && a.r <= f.r - GAP && a.t >= f.t + GAP && a.b <= f.b - GAP;
  if (right - left < w + 16 || end - top < h + 16) return null;
  // Scan the hero for free space and take the free spot closest to the preferred anchor:
  // bottom-right for the signature chip, right-middle for the watermark, within the first screen.
  const ax = right - w - 8, ay = kind === "watermark" ? top + (Math.min(bottom, top + innerHeight) - top - h) / 2 : Math.min(bottom, top + innerHeight - 40) - h - GAP;
  const step = 16;
  let best: { x: number; y: number; d: number } | null = null;
  for (let y = top + 8; y + h <= end - 4; y += step) {
    for (let x = left; x + w <= right; x += step) {
      const box = { l: x, t: y, r: x + w, b: y + h };
      if (box.l < 8 || box.r > vw - 8) continue;
      if (obs.some((o) => hit(box, o, GAP))) continue;
      if (frames.some((f) => hit(box, f, GAP) && !inside(box, f))) continue;
      // prefer spots with breathing room around them, then closeness to the anchor
      let clear = 140;
      for (const o of obs) { const dx = Math.max(o.l - box.r, box.l - o.r, 0), dy = Math.max(o.t - box.b, box.t - o.b, 0); clear = Math.min(clear, Math.hypot(dx, dy)); }
      const d = Math.hypot((ax - x) * 1, (ay - y) * 1.6) - clear * 2.2;
      if (!best || d < best.d) best = { x, y, d };
    }
  }
  if (!best) return null;
  // match the surface the mark sits on (e.g. a dark card inside a light page)
  const cx = best.x + w / 2 - scrollX, cy = best.y + h / 2 - scrollY;
  let dark: boolean | undefined;
  if (cy > 0 && cy < innerHeight) {
    for (let el = document.elementFromPoint(cx, cy) as HTMLElement | null; el && el !== document.body; el = el.parentElement) {
      if (el.closest("[data-founder-global]")) continue;
      const bg = getComputedStyle(el).backgroundColor;
      if (bg && bg !== "transparent" && !/rgba\(.*,\s*0\)$/.test(bg)) { dark = lum(bg) < 0.4; break; }
      if (el.matches(".hero-ink, .band-ink")) { dark = true; break; }
    }
  }
  return { x: best.x, y: best.y, w, dark };
}

export type { FounderPlacement };
