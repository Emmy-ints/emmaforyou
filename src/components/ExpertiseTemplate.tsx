import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import emmanuelImg from "@/assets/emmanuel-portrait.jpg";
import type { ServiceItem } from "@/lib/services-data";

const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1";

export default function ExpertiseTemplate({ data }: { data: ServiceItem }) {
  return (
    <article className="pt-24">
      {/* HERO */}
      <section className={`relative overflow-hidden bg-gradient-to-br ${data.gradient} text-white`}>
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-medium backdrop-blur">
            <span>{data.icon}</span> {data.name}
          </span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 font-display text-3xl font-extrabold leading-[1.1] md:text-5xl lg:text-6xl"
          >
            {data.hero.headline}
          </motion.h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/85 md:text-lg">{data.hero.sub}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-foreground hover:scale-105 transition">
              Let's Build This For Your Business →
            </a>
            <Link to="/portfolio" className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-7 py-3.5 text-sm font-semibold backdrop-blur hover:bg-white/20 transition">
              See Our Work →
            </Link>
          </div>
        </div>
      </section>

      {/* PAIN */}
      <Section title="Here's What's Costing Your Business Right Now">
        <div className="grid gap-5 md:grid-cols-2">
          {data.pains.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border bg-card p-6">
              <div className="text-2xl">{p.icon}</div>
              <h3 className="mt-3 font-display text-lg font-bold">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* CRITERIA */}
      <Section bg="muted" title={`What Smart Business Owners Look For Before Investing in ${data.name}`}>
        <div className="grid gap-4 md:grid-cols-2">
          {data.criteria.map((c) => (
            <div key={c.title} className="flex gap-4 rounded-2xl bg-card border border-border p-5">
              <span className="text-emerald-500 text-xl shrink-0">✓</span>
              <div>
                <h4 className="font-display font-bold">{c.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* PROCESS */}
      <Section title="Here's Exactly How We Do It">
        <div className="grid gap-6 md:grid-cols-3">
          {data.process.map((p, i) => (
            <div key={p.phase} className="relative rounded-2xl border border-border bg-card p-6">
              <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${data.gradient} text-white font-bold`}>
                {i + 1}
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{p.phase}</p>
              <h3 className="mt-1 font-display text-xl font-bold">{p.title}</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {p.bullets.map((b) => (
                  <li key={b} className="flex gap-2"><span className="text-primary">•</span>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* RESULTS */}
      <Section bg="muted" title="What Happens After We Set This Up">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {data.results.map((r) => (
            <div key={r.business} className="rounded-2xl border border-border bg-card p-5">
              <div className="text-3xl">{r.flag}</div>
              <h4 className="mt-2 font-display font-bold">{r.business}</h4>
              <p className="mt-3 text-xs text-muted-foreground"><span className="font-semibold text-foreground">Before:</span> {r.before}</p>
              <p className="mt-2 text-xs"><span className="font-semibold text-emerald-600">After:</span> {r.after}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* FOR YOU */}
      <Section title="This Is For You If...">
        <ul className="mx-auto max-w-2xl space-y-3">
          {data.forYou.map((f) => (
            <li key={f} className="flex items-start gap-3 rounded-xl bg-card border border-border p-4">
              <span className="text-emerald-500 text-xl shrink-0">✓</span>
              <span className="text-sm md:text-base">{f}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* EMMANUEL */}
      <Section bg="muted" title="">
        <div className="grid gap-10 lg:grid-cols-[320px_1fr] lg:items-start">
          <div className="overflow-hidden rounded-3xl shadow-xl">
            <img src={emmanuelImg} alt="Emmanuel Akinloye Oluwaseun" className="h-full w-full object-cover" />
          </div>
          <div>
            <h2 className="font-display text-3xl font-extrabold md:text-4xl">Why Emmanuel Akinloye Oluwaseun?</h2>
            <div className="mt-5 space-y-4 text-muted-foreground">
              <p>Emmanuel started building digital systems for businesses in Lagos before scaling his work across Europe and the United States. After 6+ years and 500+ projects, he's learnt one thing — businesses don't need more tools, they need the RIGHT system, configured for THEIR customer.</p>
              <p>He's worked with fashion brands, clinics, restaurants, real-estate teams, coaches, ecommerce stores and over 50 niches in total. Every implementation is hands-on, customised, and outcome-focused.</p>
              <p>His philosophy on {data.name.toLowerCase()}: "Tools are commodities. Strategy is rare. We sell the strategy and use the right tool for your specific reality."</p>
              <p>What makes his approach different is access — clients chat with Emmanuel directly on WhatsApp. No account managers. No layers. Just real conversations and real results.</p>
              <blockquote className="border-l-4 border-primary pl-4 italic text-foreground">"Every business is one well-built system away from doubling. We just build that system."</blockquote>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">500+ Businesses Helped · 3 Continents · 6+ Years Experience<br/>Nigeria · USA · Europe · Africa</p>
          </div>
        </div>
      </Section>

      {/* TOOLS */}
      {data.tools.length > 0 && (
        <Section title="Tools we use to deliver this">
          <div className="flex flex-wrap justify-center gap-2">
            {data.tools.map((t) => (
              <span key={t} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium">{t}</span>
            ))}
          </div>
        </Section>
      )}

      {/* FAQ */}
      <Section bg="muted" title="Common Questions">
        <div className="mx-auto max-w-3xl space-y-3">
          {data.faqs.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
        </div>
      </Section>

      {/* FINAL CTA */}
      <section className={`bg-gradient-to-br ${data.gradient} text-white`}>
        <div className="mx-auto max-w-4xl px-5 py-20 text-center">
          <h2 className="font-display text-3xl font-extrabold leading-tight md:text-5xl">
            Ready to Stop Losing Customers?<br/>Let's Build This System for Your Business.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-white/85">Every day without this system is another day of lost revenue. Free consultation. No pressure. Just a real plan, built for your business.</p>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-foreground hover:scale-105 transition">
            Get Started — Chat With Emmanuel →
          </a>
          <p className="mt-3 text-sm text-white/70">Free consultation. No pressure. Just results.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-white/85">
            <span>✓ 500+ Clients</span><span>✓ 3 Continents</span><span>✓ No Long Contracts</span><span>✓ Results in 30 Days</span><span>✓ WhatsApp Direct Access</span>
          </div>
        </div>
      </section>
    </article>
  );
}

function Section({ title, children, bg }: { title: string; children: React.ReactNode; bg?: "muted" }) {
  return (
    <section className={`section-padding ${bg === "muted" ? "bg-muted/30" : ""}`}>
      <div className="mx-auto max-w-6xl px-5">
        {title && (
          <h2 className="text-center font-display text-3xl font-extrabold leading-tight md:text-4xl">{title}</h2>
        )}
        <div className={title ? "mt-12" : ""}>{children}</div>
      </div>
    </section>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
        <span className="font-display font-bold">{q}</span>
        <span className={`text-2xl transition ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      {open && <div className="px-5 pb-4 text-sm text-muted-foreground">{a}</div>}
    </div>
  );
}
