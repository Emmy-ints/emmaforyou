import { motion } from "framer-motion";
import { Gauge } from "lucide-react";
import GrowthAssessment from "./assessment/GrowthAssessment";

/** Homepage section: the full growth assessment, embedded. */
export default function AnalyserTeaser() {
  return (
    <section id="analyser-teaser" className="section-padding bg-secondary">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="lg:sticky lg:top-28">
          <span className="eyebrow"><Gauge className="h-3.5 w-3.5" /> Free growth assessment</span>
          <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight md:text-5xl">Find out what's really holding your business back</h2>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            Eight questions, about two minutes. You get a score across five areas, an explanation of how it's calculated, and three things to fix first.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            <li>Online presence and customer acquisition</li>
            <li>Website, online booking and payments</li>
            <li>Marketing activity and lead follow-up</li>
          </ul>
        </motion.div>
        <div className="rounded-[24px] border border-border bg-card p-5 shadow-[var(--shadow-card)] md:p-8">
          <GrowthAssessment embedded />
        </div>
      </div>
    </section>
  );
}
