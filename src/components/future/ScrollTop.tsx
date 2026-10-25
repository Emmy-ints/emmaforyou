import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";

/**
 * Floating "back to top" control with a ring that fills as you read. Appears after about two
 * screens of scrolling on tablets and larger (phones keep the bottom of the screen clear), and
 * never on app-style areas that have their own bottom controls.
 */
export default function ScrollTop() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [p, setP] = useState(0);
  const [show, setShow] = useState(false);
  const hidden = /^\/(community|dashboard|portal)/.test(pathname);
  useEffect(() => {
    if (hidden) return;
    let raf = 0;
    const on = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; const max = document.documentElement.scrollHeight - innerHeight; const y = scrollY; setShow(y > innerHeight * 1.8); setP(max > 0 ? Math.min(1, y / max) : 0); }); };
    on();
    addEventListener("scroll", on, { passive: true }); addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); if (raf) cancelAnimationFrame(raf); };
  }, [hidden, pathname]);
  if (hidden) return null;
  return (
    <button type="button" className="efy-top lg" data-show={show || undefined} tabIndex={show ? 0 : -1} aria-hidden={!show}
      onClick={() => { const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches; scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); (document.querySelector("main") as HTMLElement | null)?.focus?.({ preventScroll: true }); }}
      aria-label="Back to top" style={{ ["--p" as string]: p }}>
      <svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="20" className="efy-top-track" /><circle cx="22" cy="22" r="20" className="efy-top-ring" pathLength={1} /></svg>
      <ArrowUp className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
