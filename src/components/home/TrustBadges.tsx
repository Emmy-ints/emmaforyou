import { motion } from "framer-motion";

const PARTNERS = ["Meta Business Partner", "Google Partner", "Shopify Expert", "Stripe Verified", "Microsoft Partner", "WhatsApp Business"];
const CREDENTIALS = [
  { icon: "✓", text: "500+ Verified Client Reviews" },
  { icon: "🌍", text: "3 Continents Served" },
  { icon: "📅", text: "Operating Since 2019" },
  { icon: "🏆", text: "Featured Digital Agency" },
];

export default function TrustBadges() {
  return (
    <section className="section-padding">
      <div className="mx-auto max-w-6xl">
        <motion.h2 className="text-center font-display text-2xl font-bold md:text-3xl"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          Trusted Partners & Credentials
        </motion.h2>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {PARTNERS.map((p, i) => (
            <motion.div key={p}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="flex h-20 items-center justify-center rounded-xl border border-border bg-card px-3 text-center text-xs font-bold text-muted-foreground transition-all hover:border-emma-blue hover:text-foreground hover:shadow-md">
              {p}
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {CREDENTIALS.map((c, i) => (
            <motion.div key={c.text}
              initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold shadow-sm">
              <span className="text-emma-blue">{c.icon}</span>{c.text}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
