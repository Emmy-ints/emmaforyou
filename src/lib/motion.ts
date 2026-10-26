import { useEffect, useState } from "react";

/**
 * Website-wide animation intensity. One design language, three strengths:
 *  - cinematic: homepage and locale landings (signature 3D, kinetic type, pinned story)
 *  - expressive: marketing, services, solutions, demos, tools, galleries (reveals, spotlight, magnetic CTAs)
 *  - subtle: reading, forms, community, accounts and dashboards (gentle fades only)
 * "reduced" wins whenever the visitor asks for reduced motion or data saving.
 */
export type MotionLevel = "cinematic" | "expressive" | "subtle" | "reduced";

const SUBTLE = [/^\/dashboard/, /^\/community/, /^\/account/, /^\/login/, /^\/portal/, /^\/privacy/, /^\/terms/, /^\/cookies/, /^\/unsubscribe/, /^\/intake/, /^\/book/, /^\/newsletter/];
const CINEMATIC = [/^\/$/, /^\/fr\/?$/, /^\/de\/?$/];

export function levelForPath(pathname: string): Exclude<MotionLevel, "reduced"> {
  if (CINEMATIC.some((r) => r.test(pathname))) return "cinematic";
  if (SUBTLE.some((r) => r.test(pathname))) return "subtle";
  return "expressive";
}

const PREF_KEY = "efy_motion";
/** The visitor's own choice from the motion switch ("reduced"), stored in this browser. */
export function motionPreference(): "reduced" | "full" | null {
  try { const v = localStorage.getItem(PREF_KEY); return v === "reduced" || v === "full" ? v : null; } catch { return null; }
}
export function setMotionPreference(v: "reduced" | "full") {
  try { localStorage.setItem(PREF_KEY, v); } catch { /* storage blocked */ }
  window.dispatchEvent(new CustomEvent("efy-motion", { detail: v }));
}

export function prefersReduced(): boolean {
  if (typeof window === "undefined") return false;
  if (motionPreference() === "reduced") return true;
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
    const c = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    return Boolean(c?.saveData);
  } catch { return false; }
}

/** Devices that should skip GPU-heavy effects (the CSS fallback is used instead). */
export function lowPower(): boolean {
  if (typeof window === "undefined") return true;
  const n = navigator as Navigator & { deviceMemory?: number };
  return (n.hardwareConcurrency ?? 8) < 4 || (n.deviceMemory ?? 8) < 3;
}

/**
 * React hook: true when motion should be reduced, by the system setting, Save-Data or the site's
 * own motion switch. Use this instead of framer-motion's useReducedMotion, which only sees the
 * system setting. False on the server and first render, then follows changes live.
 */
export function useReduceMotion(): boolean {
  const [r, setR] = useState(false);
  useEffect(() => {
    const sync = () => setR(prefersReduced());
    sync();
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    window.addEventListener("efy-motion", sync);
    mq?.addEventListener?.("change", sync);
    return () => { window.removeEventListener("efy-motion", sync); mq?.removeEventListener?.("change", sync); };
  }, []);
  return r;
}
