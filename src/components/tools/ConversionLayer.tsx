import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, FileSignature, Globe, MessageCircle, Sparkles, X } from "lucide-react";
import { track } from "@/lib/analytics";

const WA = "https://wa.me/message/HHGMMWMRJFYUC1";
const EXIT_KEY = "efy_exit_offer_at";
const QUIET = ["/dashboard", "/portal", "/book", "/proposal", "/community"];

/** Mobile action bar + a single, polite exit offer on desktop. */
export default function ConversionLayer() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const quiet = QUIET.some((p) => pathname.startsWith(p));
  const [exitOpen, setExitOpen] = useState(false);

  useEffect(() => {
    if (quiet) return;
    let armed = false;
    const arm = window.setTimeout(() => { armed = true; }, 20000);
    const recently = () => {
      try { const t = Number(localStorage.getItem(EXIT_KEY) || 0); return Date.now() - t < 14 * 86_400_000; } catch { return true; }
    };
    const onLeave = (e: MouseEvent) => {
      if (!armed || e.clientY > 8 || e.relatedTarget || window.innerWidth < 1024 || recently()) return;
      try { localStorage.setItem(EXIT_KEY, String(Date.now())); } catch { /* storage blocked */ }
      setExitOpen(true);
      track("exit_offer_shown", { page: pathname });
    };
    document.addEventListener("mouseout", onLeave);
    return () => { window.clearTimeout(arm); document.removeEventListener("mouseout", onLeave); };
  }, [pathname, quiet]);

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/portal") || pathname.startsWith("/community")) return null;
  const click = (what: string) => track("sticky_cta_click", { what, page: pathname });

  return (
    <>
      {/* Mobile: always-visible next steps */}
      <div className="h-[72px] md:hidden" aria-hidden="true" />
      <nav aria-label="Quick actions" className="fixed inset-x-0 bottom-0 z-[65] border-t border-border bg-card/95 px-3 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 backdrop-blur md:hidden">
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => { click("ask"); window.dispatchEvent(new Event("efy-open-ask")); }} className="flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold text-foreground">
            <Sparkles className="h-5 w-5 text-[var(--emma-violet)]" /> Ask Emma AI
          </button>
          <Link to="/book" onClick={() => click("book")} className="btn-primary-gradient flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold text-white">
            <CalendarCheck className="h-5 w-5" /> Book a free call
          </Link>
          <a href={WA} target="_blank" rel="noopener noreferrer" onClick={() => click("whatsapp")} className="flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold text-foreground">
            <MessageCircle className="h-5 w-5 text-[#25d366]" /> WhatsApp
          </a>
        </div>
      </nav>

      <AnimatePresence>
        {exitOpen && (
          <motion.div className="fixed inset-0 z-[120] grid place-items-center bg-black/50 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setExitOpen(false); }}>
            <motion.div role="dialog" aria-modal="true" aria-labelledby="exit-title" initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 10 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[24px] border border-border bg-card shadow-2xl">
              <button onClick={() => setExitOpen(false)} aria-label="Close" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
              <div className="hero-ink px-6 py-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--emma-violet)]">Before you go</p>
                <h2 id="exit-title" className="mt-2 font-display text-2xl font-semibold text-white">Take something useful with you, free.</h2>
                <p className="mt-2 text-sm text-white/70">No sign-up. Results in about a minute.</p>
              </div>
              <div className="grid gap-2 p-5">
                <Link to="/website-audit" onClick={() => { setExitOpen(false); track("exit_offer_clicked", { what: "audit" }); }} className="flex items-center gap-3 rounded-2xl border border-border p-3 hover:border-[var(--emma-violet)]">
                  <Globe className="h-5 w-5 text-[var(--emma-violet)]" /><span><span className="block text-sm font-semibold">Audit my website</span><span className="block text-xs text-muted-foreground">Score, speed, SEO and the top 5 fixes</span></span>
                </Link>
                <Link to="/proposal" onClick={() => { setExitOpen(false); track("exit_offer_clicked", { what: "proposal" }); }} className="flex items-center gap-3 rounded-2xl border border-border p-3 hover:border-[var(--emma-violet)]">
                  <FileSignature className="h-5 w-5 text-[var(--emma-violet)]" /><span><span className="block text-sm font-semibold">Get my proposal & price</span><span className="block text-xs text-muted-foreground">Scope, timeline and the right plan in 20 seconds</span></span>
                </Link>
                <button onClick={() => { setExitOpen(false); track("exit_offer_clicked", { what: "ask" }); window.dispatchEvent(new Event("efy-open-ask")); }} className="flex items-center gap-3 rounded-2xl border border-border p-3 text-left hover:border-[var(--emma-violet)]">
                  <Sparkles className="h-5 w-5 text-[var(--emma-violet)]" /><span><span className="block text-sm font-semibold">Ask Emma AI a quick question</span><span className="block text-xs text-muted-foreground">Prices, timelines, what fits your business</span></span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
