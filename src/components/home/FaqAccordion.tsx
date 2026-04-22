import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";

const FAQS = [
  { q: "Do you work with businesses outside Nigeria?", a: "Yes — we serve clients in Nigeria, the United States, United Kingdom, France, Germany, Spain, Colombia, Ghana, South Africa and beyond. Most of our work is done remotely via WhatsApp, Zoom and project portals." },
  { q: "How long does it take to see results?", a: "Most clients see meaningful traction within 30 days (more leads, more enquiries, more visibility). Significant revenue lifts typically show between days 60 and 90 once automations and ad systems are fully optimised." },
  { q: "What makes EmmaForYou different from other agencies?", a: "Three things: (1) we combine AI automation with traditional marketing — almost no agency does both well, (2) we deeply understand both African and Western markets, (3) you talk directly to senior strategists, never to junior account managers." },
  { q: "Do I need a big budget to work with you?", a: "No — our Starter plan is built specifically for new and small businesses. We have clients spending $99/month and clients spending $10,000+/month. We match the strategy to the budget." },
  { q: "Can you handle everything for me?", a: "Yes. Our 'Done-For-You' engagement type means you focus on running your business while we handle the strategy, design, automation, posting, ads and reporting. You just review and approve." },
  { q: "What is AI automation and how does it help my business?", a: "AI automation means your business responds to leads in seconds (not hours), follows up consistently with every enquiry, books appointments without you, and never lets a customer fall through the cracks. Most clients see 30–50% more conversions just from this." },
  { q: "Do you offer payment plans?", a: "Yes. Larger projects can be split into 2–3 monthly payments, and ongoing services bill monthly. We'll structure something that fits your cashflow." },
  { q: "Is my business too small or too new for EmmaForYou?", a: "Almost never. We've helped one-person businesses go from zero to first 100 customers, and we've helped established companies scale to seven figures. The key is commitment, not size." },
];

export default function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="section-padding">
      <div className="mx-auto max-w-3xl">
        <motion.div className="text-center"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-display text-3xl font-extrabold md:text-5xl">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground">Quick answers — full library on our FAQ page.</p>
        </motion.div>

        <div className="mt-10 space-y-3">
          {FAQS.map((f, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
              <button onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-muted/30">
                <span className="font-display text-base font-bold">{f.q}</span>
                <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emma-blue/10 text-emma-blue transition-transform ${open === i ? "rotate-45" : ""}`}>+</span>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                    <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link to="/faq" className="inline-flex rounded-full border-2 border-border px-6 py-3 text-sm font-semibold transition-colors hover:border-emma-blue hover:text-emma-blue">
            See All FAQs →
          </Link>
        </div>
      </div>
    </section>
  );
}
