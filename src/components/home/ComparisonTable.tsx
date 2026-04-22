import { motion } from "framer-motion";

const ROWS = [
  { feature: "Personalised strategy", us: "✓", agency: "Sometimes", freelancer: "✗" },
  { feature: "AI automation included", us: "✓", agency: "Extra cost", freelancer: "✗" },
  { feature: "Africa & global market expertise", us: "✓", agency: "✗", freelancer: "Maybe" },
  { feature: "Same-day WhatsApp support", us: "✓", agency: "✗", freelancer: "Maybe" },
  { feature: "Results in 30 days", us: "✓", agency: "✗", freelancer: "Maybe" },
  { feature: "Transparent pricing", us: "✓", agency: "✗", freelancer: "Variable" },
  { feature: "Dedicated account manager", us: "✓", agency: "$$$+", freelancer: "✗" },
  { feature: "Money-back guarantee", us: "✓", agency: "✗", freelancer: "✗" },
];

export default function ComparisonTable() {
  return (
    <section className="section-padding bg-muted/30">
      <div className="mx-auto max-w-5xl">
        <motion.div className="text-center"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-display text-3xl font-extrabold md:text-5xl">
            Why <span className="gradient-text">EmmaForYou</span> vs. The Alternatives
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            We're not the cheapest. We're not the biggest. We're the team that actually delivers.
          </p>
        </motion.div>

        <div className="mt-12 overflow-x-auto rounded-3xl border border-border bg-card shadow-lg">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-5 py-4 text-left font-display font-bold">Feature</th>
                <th className="relative px-5 py-4 text-center">
                  <div className="absolute inset-0" style={{
                    background: "linear-gradient(180deg, oklch(0.45 0.22 265 / 0.08), oklch(0.5 0.22 340 / 0.08))",
                    borderRadius: "0",
                  }} />
                  <div className="relative">
                    <span className="font-display font-extrabold gradient-text">EmmaForYou</span>
                    <div className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                      style={{ background: "var(--gradient-gold)", color: "var(--emma-charcoal)" }}>RECOMMENDED</div>
                  </div>
                </th>
                <th className="px-5 py-4 text-center font-display font-bold text-muted-foreground">Big Agency</th>
                <th className="px-5 py-4 text-center font-display font-bold text-muted-foreground">Freelancer</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <motion.tr key={row.feature} className="border-b border-border last:border-0"
                  initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.4 }}>
                  <td className="px-5 py-4 font-medium">{row.feature}</td>
                  <td className="relative px-5 py-4 text-center">
                    <div className="absolute inset-0" style={{
                      background: "linear-gradient(180deg, oklch(0.45 0.22 265 / 0.05), oklch(0.5 0.22 340 / 0.05))",
                    }} />
                    <span className="relative font-bold text-emma-blue">{row.us}</span>
                  </td>
                  <td className="px-5 py-4 text-center text-muted-foreground">{row.agency}</td>
                  <td className="px-5 py-4 text-center text-muted-foreground">{row.freelancer}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
