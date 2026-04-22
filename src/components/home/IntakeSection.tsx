import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import BusinessIntakeForm from "../intake/BusinessIntakeForm";

export default function IntakeSection() {
  const [open, setOpen] = useState(false);
  return (
    <section id="get-started" className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-50" style={{
        background: "radial-gradient(circle at 30% 50%, oklch(0.8 0.15 85 / 0.15), transparent 60%)"
      }} />
      <motion.div className="mx-auto max-w-4xl text-center"
        initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.7 }}>
        <span className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emma-blue">
          ✨ Personal Onboarding
        </span>
        <h2 className="mt-6 font-display text-3xl font-extrabold leading-tight md:text-5xl">
          Tell Us About Your Business —<br/>
          <span className="gradient-text">We'll Build Your Custom Growth Plan.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground">
          Takes 5 minutes. No commitment. Our team reviews every submission personally and sends your custom 90-day plan to WhatsApp within 24 hours.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <motion.button onClick={() => setOpen(true)}
            whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.95 }}
            className="rounded-full px-8 py-4 text-base font-bold text-white shadow-xl"
            style={{ background: "var(--gradient-brand)" }}>
            Start My Business Profile →
          </motion.button>
          <Link to="/intake" className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline">
            Or open as a full page →
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <span>✓ 5 minutes</span><span>✓ 100% free</span><span>✓ No obligation</span><span>✓ 24-hour response</span>
        </div>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
            <div className="my-12 w-full max-w-3xl">
              <button onClick={() => setOpen(false)}
                className="mb-4 ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-foreground shadow-lg">✕</button>
              <BusinessIntakeForm onClose={() => setOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
