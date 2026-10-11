import { motion } from "framer-motion";
import { Calculator } from "lucide-react";
import RoiCalculator from "../roi/RoiCalculator";

export default function RoiSection() {
  return (
    <section id="roi" className="section-padding bg-background">
      <div className="mx-auto max-w-6xl">
        <motion.div className="mx-auto max-w-3xl text-center" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <span className="eyebrow"><Calculator className="h-3.5 w-3.5" /> ROI calculator</span>
          <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-foreground md:text-5xl">What faster replies and better marketing are worth to you</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            Enter your own numbers. Every assumption is visible and editable, and the maths is shown underneath — no black box.
          </p>
        </motion.div>
        <div className="mt-12">
          <RoiCalculator compact />
        </div>
      </div>
    </section>
  );
}
