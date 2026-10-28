import { useState } from "react";
import SectionHead from "../future/SectionHead";
import { Link } from "@tanstack/react-router";

const FAQS = [
  { q: "Do you work with businesses outside Nigeria?", a: "Yes — we serve clients in Nigeria, the United States, United Kingdom, France, Germany, Spain, Colombia, Ghana, South Africa and beyond. Most of our work is done remotely via WhatsApp, Zoom and project portals." },
  { q: "How long does it take to see results?", a: "Most clients see meaningful traction within 30 days (more leads, more enquiries, more visibility). Significant revenue lifts typically show between days 60 and 90 once automations and ad systems are fully optimised." },
  { q: "What makes EmmaForYou different from other agencies?", a: "Three things: (1) we combine AI automation with traditional marketing — almost no agency does both well, (2) we deeply understand both African and Western markets, (3) you talk directly to senior strategists, never to junior account managers." },
  { q: "Do I need a big budget to work with you?", a: "No — our Starter plan is built specifically for new and small businesses. We have clients spending $99/month and clients spending $10,000+/month. We match the strategy to the budget." },
  { q: "Can you handle everything for me?", a: "Yes. Our 'Done-For-You' engagement type means you focus on running your business while we handle the strategy, design, automation, posting, ads and reporting. You just review and approve." },
  { q: "What is AI automation and how does it help my business?", a: "AI automation means your business responds to leads in seconds (not hours), follows up consistently with every enquiry, books appointments without you, and never lets a customer fall through the cracks. Most clients see 30–50% more conversions just from this." },
  { q: "Do you offer payment plans?", a: "Yes. Larger projects can be split into 2–3 monthly payments, and ongoing services bill monthly. We'll structure something that fits your cashflow." },
  { q: "Do you help with eBooks and book marketing?", a: "Yes. We format and convert manuscripts into eBooks and paperbacks, design covers and mockups, write book descriptions and keywords, and plan and run book launches and marketing. You publish under your own account and keep your rights. Our free book tools let you start yourself." },
  { q: "Is my business too small or too new for EmmaForYou?", a: "Almost never. We've helped one-person businesses go from zero to first 100 customers, and we've helped established companies scale to seven figures. The key is commitment, not size." },
];

/** FAQ as glass panels: the open answer glows, the plus turns into a cross, heights animate smoothly. */
export default function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="fq section-padding" aria-labelledby="fq-h">
      <div className="mx-auto max-w-3xl">
        <SectionHead id="fq-h" align="center" title="Frequently Asked Questions" shine={["Questions"]} sub="Quick answers — full library on our FAQ page." />

        <div className="mt-10 space-y-3">
          {FAQS.map((f, i) => (
            <div key={i} className={`fq-item lg ${open === i ? "is-open" : ""}`}>
              <h3>
                <button id={`home-faq-q-${i}`} onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} aria-controls={`home-faq-${i}`} className="fq-q">
                  <span className="font-display text-base font-semibold">{f.q}</span>
                  <span className="fq-icon" aria-hidden="true" />
                </button>
              </h3>
              <div id={`home-faq-${i}`} role="region" aria-labelledby={`home-faq-q-${i}`} className="acc-panel" data-open={open === i} inert={open !== i}>
                <div><p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p></div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link to="/faq" className="nav-ghost h-auto px-6 py-3">See All FAQs →</Link>
        </div>
      </div>
    </section>
  );
}
