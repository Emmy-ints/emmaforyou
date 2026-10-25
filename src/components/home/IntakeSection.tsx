import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ClipboardList, X } from "lucide-react";
import BusinessIntakeForm from "../intake/BusinessIntakeForm";
import SectionHead from "../future/SectionHead";

const STEPS = ["Your business", "Your market", "Services & goals", "How we work together"];

/**
 * Personal onboarding: a glass launch panel with the four stages of the brief drawn as a connected
 * path; the brief opens in a modal (Escape closes it, focus moves in and returns to the button).
 */
export default function IntakeSection() {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const modal = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => modal.current?.querySelector<HTMLElement>("input, select, textarea, button")?.focus());
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = original; document.removeEventListener("keydown", onKey); opener.current?.focus(); };
  }, [open]);

  return (
    <section id="get-started" className="ix section-padding relative overflow-hidden" aria-labelledby="ix-h">
      <div className="ix-panel lg-strong mx-auto max-w-5xl">
        <SectionHead id="ix-h" align="center" className="max-w-3xl" kicker={<><ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />Personal onboarding</>}
          title="Tell Us About Your Business — We'll Build Your Custom Growth Plan." shine={["Custom", "Growth", "Plan"]}
          sub="Takes 5 minutes. No commitment. Our team reviews every submission personally and sends your custom 90-day plan to WhatsApp within 24 hours." />

        <ol className="ix-path mt-10" aria-label="What the brief covers">
          {STEPS.map((s, i) => <li key={s} style={{ ["--i" as string]: i }}><span className="ix-node" aria-hidden="true">{i + 1}</span>{s}</li>)}
        </ol>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button ref={opener} type="button" onClick={() => setOpen(true)} className="btn-primary-gradient rounded-full px-8 py-4 text-base font-semibold" aria-haspopup="dialog">
            Start My Business Profile →
          </button>
          <Link to="/intake" className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline">
            Or open as a full page →
          </Link>
        </div>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <li>✓ 5 minutes</li><li>✓ 100% free</li><li>✓ No obligation</li><li>✓ 24-hour response</li>
        </ul>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-[#0b0d24]/75 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
            <div ref={modal} role="dialog" aria-modal="true" aria-label="Business profile" className="my-12 w-full max-w-3xl">
              <button type="button" onClick={() => setOpen(false)}
                className="lg mb-4 ml-auto flex h-10 w-10 items-center justify-center rounded-full text-foreground" aria-label="Close the brief form"><X className="h-4 w-4" aria-hidden="true" /></button>
              <BusinessIntakeForm onClose={() => setOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
