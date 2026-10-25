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

export function prefersReduced(): boolean {
  if (typeof window === "undefined") return false;
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
