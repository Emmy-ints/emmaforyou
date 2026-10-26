import { createFileRoute, Link } from "@tanstack/react-router";
import { KineticText } from "@/components/future/Kinetic";
import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { pageHead, breadcrumbLd } from "@/lib/seo";
import { TIERS } from "@/lib/pricing-data";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () =>
    pageHead({
      title: "Pricing — Plans from $99/month | EmmaForYou",
      description: "Monthly plans for AI automation, websites, social, ads and ecommerce: Starter $99, Growth $299, Pro $799, or custom Enterprise. Ad spend billed separately.",
      path: "/pricing",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Pricing", path: "/pricing" }])],
    }),
});

const FAQS = [
  { q: "Can I switch plans anytime?", a: "Yes — upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle." },
  { q: "What's included in 'free strategy call'?", a: "A 30-minute call with Emmanuel or a senior strategist to audit your business and outline a custom plan. Yours to keep, even if you don't sign up." },
  { q: "Do you offer refunds?", a: "Yes — the Pro plan includes a 30-day money-back guarantee. Other plans can be cancelled anytime with no penalty." },
  { q: "Is the ad spend included in the price?", a: "No — the price covers our management fee. You pay Meta/Google/TikTok directly. We only charge for our work." },
  { q: "What if I only need a one-time project?", a: "We offer one-time builds (websites, ad campaigns, automation systems) — fill out the intake form and we'll quote it." },
];

function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <Navbar />
      <main id="main-content">
        <section className="pr section-padding relative overflow-hidden pt-32 text-center">
          <div className="roi-x-grid" aria-hidden="true" />
          <div className="relative mx-auto max-w-4xl">
            <h1 className="font-display text-4xl font-extrabold md:text-7xl">
              Transparent Pricing.<br/><span className="gradient-text">Real Results.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
              No hidden fees. No long contracts. Upgrade, downgrade or cancel anytime.
            </p>
            <div className="pr-toggle lg mt-8 inline-flex items-center gap-1 rounded-full p-1.5" role="group" aria-label="Billing period" data-annual={annual || undefined}>
              <button type="button" aria-pressed={!annual} onClick={() => setAnnual(false)} className={`relative z-[1] rounded-full px-5 py-2 text-sm font-semibold transition-colors ${!annual ? "text-white" : "text-muted-foreground"}`}>Monthly</button>
              <button type="button" aria-pressed={annual} onClick={() => setAnnual(true)} className={`relative z-[1] rounded-full px-5 py-2 text-sm font-semibold transition-colors ${annual ? "text-white" : "text-muted-foreground"}`}>
                Annual <span className="ml-1 rounded-full bg-[#f5b544]/30 px-2 py-0.5 text-[10px] font-bold text-current">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="mx-auto mt-14 grid max-w-7xl gap-6 px-5 lg:grid-cols-4">
            {TIERS.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                data-tilt="3" className={`pr-tier relative flex flex-col rounded-[28px] p-6 text-left ${t.popular ? "is-popular lg-strong" : "lg"}`}>
                {t.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                    style={{ background: "var(--gradient-brand)" }}>Most Popular</div>
                )}
                <h2 className="font-display text-xl font-extrabold">{t.name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{t.audience}</p>
                <div className="mt-5">
                  {t.custom ? (
                    <div className="font-display text-4xl font-extrabold">Custom</div>
                  ) : (
                    <>
                      <span key={annual ? "a" : "m"} className="pr-price font-display text-4xl font-semibold tracking-tight">${annual ? t.annual : t.monthly}</span>
                      <span className="text-sm text-muted-foreground">/mo</span>
                      {annual && <p className="mt-1 text-xs text-emma-blue font-semibold">Billed annually · save ${(t.monthly - t.annual) * 12}/yr</p>}
                    </>
                  )}
                </div>
                <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-emma-blue/15 text-[9px] text-emma-blue">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/intake" className={`mt-6 block rounded-full py-3 text-center text-sm font-bold transition-all ${
                  t.popular ? "text-white shadow-lg" : "border border-border hover:border-emma-blue"
                }`} style={t.popular ? { background: "var(--gradient-brand)" } : {}}>
                  {t.custom ? "Contact Sales" : "Get Started"} →
                </Link>
              </motion.div>
            ))}
          </div>

          <p className="mt-12 text-sm text-muted-foreground">
            Not sure which plan? <Link to="/proposal" className="font-bold text-emma-blue underline">Get an instant proposal</Link>, <Link to="/analyser" className="font-bold text-emma-blue underline">take the growth assessment</Link> or <Link to="/book" className="font-bold text-emma-blue underline">book a free call</Link>.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Consulting, accountability coaching, UI/UX design, conversion optimisation and promotion campaigns are quoted separately after a free call.
          </p>
        </section>

        <section className="section-padding bg-muted/30">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center font-display text-3xl font-extrabold md:text-5xl"><KineticText text="Pricing FAQs" base={30} /></h2>
            <div className="mt-10 space-y-3">
              {FAQS.map((f, i) => (
                <div key={i} className={`fq-item lg ${openFaq === i ? "is-open" : ""}`}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i} className="fq-q">
                    <span className="font-display text-base font-semibold">{f.q}</span>
                    <span className="fq-icon" aria-hidden="true" />
                  </button>
                  <div className="acc-panel" data-open={openFaq === i} inert={openFaq !== i}><div><p className="px-5 pb-5 text-sm text-muted-foreground">{f.a}</p></div></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
