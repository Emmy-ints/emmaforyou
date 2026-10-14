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
    <section className="section-padding" style={{ background: "var(--gradient-gold)" }}>
      <motion.div
        className="mx-auto max-w-3xl text-center"
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="font-display text-3xl font-extrabold text-emma-charcoal md:text-5xl">
          {t("waitlist_title")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-emma-charcoal/70">
          Join the EmmaForYou waitlist and be among the first businesses to access our full suite of AI-powered growth services. Limited spots. Serious results.
        </p>


        {!submitted ? (
          <motion.form
            onSubmit={handleSubmit}
            className="mx-auto mt-6 flex max-w-md gap-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <input
              type="email"
              required
              maxLength={255}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-full border-2 border-emma-charcoal/20 bg-white/80 px-5 py-3 text-sm text-emma-charcoal placeholder:text-emma-charcoal/40 focus:border-emma-charcoal/50 focus:outline-none"
            />
            <motion.button
              type="submit"
              disabled={busy}
              className="rounded-full px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "var(--gradient-dark)" }}
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              {busy ? "…" : t("cta_waitlist")}
            </motion.button>
          </motion.form>
        ) : null}
        {!submitted && error ? <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p> : null}
        {!submitted ? null : (
          <motion.div
            className="mt-6 rounded-2xl bg-white/60 p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <p className="font-display text-lg font-bold text-emma-charcoal">
              🎉 You're in!
            </p>
            <p className="mt-2 text-sm text-emma-charcoal/70">
              We'll email you soon. Want to talk sooner?
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white"
              style={{ background: "var(--gradient-dark)" }}
            >
              Chat With Us Now →
            </a>
          </motion.div>
        )}

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emma-charcoal/70 transition-colors hover:text-emma-charcoal"
        >
          Or chat with us directly on WhatsApp →
        </a>
      </motion.div>
    </section>
  );
}
