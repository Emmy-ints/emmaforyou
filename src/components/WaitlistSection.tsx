import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { submitLead } from "@/lib/leads";
import { useI18n } from "@/lib/i18n";

const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1";

export default function WaitlistSection() {
  const { t, lang } = useI18n();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email) return;
      setBusy(true); setError("");
      const res = await submitLead({ source: "waitlist", email, language: lang });
      setBusy(false);
      if (!res.ok) { setError("That didn't go through. Please check your email address and try again, or message us on WhatsApp."); return; }
      setSubmitted(true);
    },
    [email, lang]
  );

  return (
    <section className="wl section-padding" aria-labelledby="wl-h">
      <div className="wl-metal" aria-hidden="true" />
      <div className="relative mx-auto max-w-3xl text-center">
        <h2 id="wl-h" className="font-display text-3xl font-semibold tracking-tight text-white md:text-5xl">
          {t("waitlist_title")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-white/70">
          Join the EmmaForYou waitlist and be among the first businesses to access our full suite of AI-powered growth services. Limited spots. Serious results.
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="wl-form lg mx-auto mt-7">
            <input
              type="email"
              required
              maxLength={255}
              placeholder="Enter your email"
              aria-label="Your email address"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="wl-input"
            />
            <button type="submit" disabled={busy} className="btn-gold rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60">
              {busy ? "…" : t("cta_waitlist")}
            </button>
          </form>
        ) : null}
        {!submitted && error ? <p role="alert" className="mt-3 text-sm font-medium text-red-300">{error}</p> : null}
        {!submitted ? null : (
          <motion.div
            role="status"
            className="wl-done lg mx-auto mt-6 max-w-md"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <svg className="wl-check" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" pathLength={1} /><path d="M15 27 l7 7 l15 -16" pathLength={1} /></svg>
            <p className="font-display text-lg font-semibold text-white">You're in!</p>
            <p className="mt-2 text-sm text-white/70">We'll email you soon. Want to talk sooner?</p>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn-gold mt-4 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">
              Chat With Us Now →
            </a>
          </motion.div>
        )}

        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white">
          Or chat with us directly on WhatsApp →
        </a>
      </div>
    </section>
  );
}
