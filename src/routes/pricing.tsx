import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { pageHead, breadcrumbLd } from "@/lib/seo";

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

const TIERS = [
  { name: "Starter", monthly: 99, annual: 79, audience: "New businesses just getting started", popular: false,
    features: ["1 social platform managed", "8 posts per month", "Basic WhatsApp automation", "Google Business setup", "Monthly performance report", "Email support", "Free strategy call", "Cancel anytime"] },
  { name: "Growth", monthly: 299, annual: 239, audience: "Growing businesses ready to scale", popular: false,
    features: ["3 social platforms managed", "20 posts per month", "Full WhatsApp + email automation", "Lead capture system", "Basic ad management ($500/mo cap)", "Bi-weekly strategy calls", "Website maintenance", "Priority support"] },
  { name: "Pro", monthly: 799, annual: 639, audience: "Scaling businesses serious about growth", popular: true,
    features: ["All Growth features +", "Custom website (or rebuild)", "Full ad management (up to $5k/mo)", "AI chatbot deployment", "Advanced CRM setup", "Email sequences (5 flows)", "Weekly strategy calls", "Dedicated account manager", "30-day results guarantee"] },
  { name: "Enterprise", monthly: 0, annual: 0, audience: "Established companies & agencies", popular: false, custom: true,
    features: ["Everything in Pro +", "Custom app development", "Multi-brand / multi-location", "Custom integrations & APIs", "On-site visits available", "Senior strategy team", "Daily reporting access", "24/7 priority support", "Custom SLA & contracts"] },
];

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
      <main>
        <section className="section-padding pt-32 text-center">
          <div className="mx-auto max-w-4xl">
            <h1 className="font-display text-4xl font-extrabold md:text-7xl">
              Transparent Pricing.<br/><span className="gradient-text">Real Results.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
              No hidden fees. No long contracts. Upgrade, downgrade or cancel anytime.
            </p>
            <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-border bg-card p-1.5">
              <button onClick={() => setAnnual(false)} className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${!annual ? "bg-emma-charcoal text-white" : "text-muted-foreground"}`}>Monthly</button>
              <button onClick={() => setAnnual(true)} className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${annual ? "bg-emma-charcoal text-white" : "text-muted-foreground"}`}>
                Annual <span className="ml-1 rounded-full bg-emma-gold/30 px-2 py-0.5 text-[10px] font-bold text-emma-charcoal">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="mx-auto mt-14 grid max-w-7xl gap-6 px-5 lg:grid-cols-4">
            {TIERS.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className={`relative flex flex-col rounded-3xl border-2 bg-card p-6 text-left ${t.popular ? "border-emma-blue shadow-2xl scale-[1.03]" : "border-border shadow-md"}`}>
                {t.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                    style={{ background: "var(--gradient-brand)" }}>Most Popular</div>
                )}
                <h3 className="font-display text-xl font-extrabold">{t.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{t.audience}</p>
                <div className="mt-5">
                  {t.custom ? (
                    <div className="font-display text-4xl font-extrabold">Custom</div>
                  ) : (
                    <>
                      <span className="font-display text-4xl font-extrabold">${annual ? t.annual : t.monthly}</span>
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
            Not sure which plan? <Link to="/analyser" className="font-bold text-emma-blue underline">Take the free analyser →</Link>
          </p>
        </section>

        <section className="section-padding bg-muted/30">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center font-display text-3xl font-extrabold md:text-5xl">Pricing FAQs</h2>
            <div className="mt-10 space-y-3">
              {FAQS.map((f, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left">
                    <span className="font-display text-base font-bold">{f.q}</span>
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full bg-emma-blue/10 text-emma-blue transition-transform ${openFaq === i ? "rotate-45" : ""}`}>+</span>
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
