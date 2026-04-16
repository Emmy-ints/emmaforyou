import { motion } from "framer-motion";

const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1";

const PAIN_POINTS = [
  { emoji: "🔴", title: "Slow replies = lost sales", desc: "Every minute you take to respond, your competitor is closing that deal." },
  { emoji: "🔴", title: "No website = no credibility", desc: "Customers Google you before buying. No website means no trust." },
  { emoji: "🔴", title: "Inconsistent social media = forgotten brand", desc: "Out of sight, out of mind. Inconsistent posting kills your reach." },
];

export default function ProblemSection() {
  return (
    <section className="section-padding">
      <div className="mx-auto max-w-5xl">
        <motion.div
          className="rounded-3xl p-8 md:p-14"
          style={{ background: "var(--gradient-dark)", transformStyle: "preserve-3d", perspective: 1000 }}
          initial={{ opacity: 0, rotateX: 8, y: 60 }}
          whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.p
            className="text-center font-display text-2xl font-extrabold leading-tight text-white md:text-4xl"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            "Every day you don't have a system —{" "}
            <span style={{ color: "oklch(0.7 0.2 25)" }}>you're losing customers</span>{" "}
            to businesses that do."
          </motion.p>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PAIN_POINTS.map((p, i) => (
              <motion.div
                key={i}
                className="rounded-2xl border border-white/10 p-6"
                style={{ background: "oklch(0.18 0.03 280 / 0.8)" }}
                initial={{ opacity: 0, y: 40, rotateY: -10 }}
                whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.04, rotateY: 5, z: 20 }}
              >
                <span className="text-2xl">{p.emoji}</span>
                <h3 className="mt-3 font-display text-lg font-bold text-white">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{p.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-10 text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm"
            >
              Fix This Now →
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
