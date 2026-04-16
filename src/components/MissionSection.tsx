import { motion } from "framer-motion";

const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1";

export default function MissionSection() {
  return (
    <section className="section-padding" style={{ background: "var(--gradient-dark)" }}>
      <div className="mx-auto max-w-4xl text-center">
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 50, rotateX: 10 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ perspective: 800 }}
        >
          <span className="gradient-text-gold font-display text-6xl font-extrabold leading-none">"</span>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-white/50">Our Mission</h3>
          <p className="mt-4 font-display text-xl font-bold leading-relaxed text-white md:text-2xl">
            To help business owners save time, capture more leads, and close more customers through simple, affordable AI automation.
          </p>
        </motion.div>

        <motion.div
          className="border-t border-white/10 pt-10"
          initial={{ opacity: 0, y: 50, rotateX: -10 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ perspective: 800 }}
        >
          <span className="gradient-text-gold font-display text-6xl font-extrabold leading-none">"</span>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-white/50">Our Vision</h3>
          <p className="mt-4 font-display text-xl font-bold leading-relaxed text-white md:text-2xl">
            A future where no business loses a customer because of a slow reply or missed follow-up.
          </p>
        </motion.div>

        <motion.a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold mt-12 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          whileHover={{ scale: 1.08, y: -4 }}
          whileTap={{ scale: 0.95 }}
        >
          Work With Us →
        </motion.a>
      </div>
    </section>
  );
}
