import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Check, ChevronDown, Clock, Layers, MessageCircle, Target, Wrench } from "lucide-react";
import emmanuelImg from "@/assets/emmanuel-portrait.webp";
import type { ServiceItem } from "@/lib/services-data";
import { extraFor, SERVICE_QA, SERVICE_WORK_MATCH } from "@/lib/service-extras";
import { PROJECTS } from "@/lib/portfolio-data";
import ProjectCard from "./portfolio/ProjectCard";
import { SERVICES, SERVICE_TO_EXPERTISE, EXPERTISE } from "@/lib/services-data";
import { WorkflowViz, DashboardDemo } from "./service/ServiceDemos";
import ServiceInquiryForm from "./service/ServiceInquiryForm";
import TransformationSlider from "./home/TransformationSlider";
import { buildWa } from "@/lib/leads";

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
};

function relatedWork(slug: string) {
  const m = SERVICE_WORK_MATCH[slug] ?? {};
  const hits = PROJECTS.filter((p) => (m.categories ?? []).includes(p.category) || p.stack.some((t) => (m.stack ?? []).some((k) => t.includes(k))));
  return (hits.length ? hits : PROJECTS).slice(0, 3);
}

function relatedServices(slug: string) {
  const own = Object.entries(SERVICE_TO_EXPERTISE).find(([, e]) => e === slug)?.[0];
  const svc = SERVICES.filter((s) => s.slug !== own).slice(0, 4).map((s) => ({ label: s.name, to: `/services/${s.slug}`, short: s.short }));
  const more = EXPERTISE.filter((e) => e.slug !== slug && !Object.values(SERVICE_TO_EXPERTISE).includes(e.slug)).slice(0, 4).map((e) => ({ label: e.name, to: `/expertise/${e.slug}`, short: e.short }));
  return [...svc, ...more];
}

export default function ExpertiseTemplate({ data }: { data: ServiceItem }) {
  const x = extraFor(data.slug);
  const qa = SERVICE_QA[data.slug] ?? [];
  const work = relatedWork(data.slug);
  const related = relatedServices(data.slug);
  const wa = buildWa(`Hi Emmanuel! I'm interested in ${data.name}.`);

  return (
    <article>
      {/* Hero */}
      <section className="hero-ink relative overflow-hidden">
        <div className="hero-ink-grid" aria-hidden="true" />
        <div className="hero-ink-glow" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-32 md:px-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)] lg:items-end lg:pb-24 lg:pt-40">
          <div>
            <nav aria-label="Breadcrumb" className="text-sm text-[#a6abd0]">
              <Link to="/" className="hover:text-white">Home</Link>
              <span className="mx-2 opacity-50">/</span>
              <span>Services</span>
              <span className="mx-2 opacity-50">/</span>
              <span className="text-white">{data.name}</span>
            </nav>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="svc-title">
              {data.hero.headline}
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="hero-ink-sub">
              {data.short} {x.audience}
            </motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="mt-8 flex flex-wrap gap-3">
              <a href="#inquiry" data-track={`svc_${data.slug}_hero_inquiry`} className="btn-gold inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[15px]">
                Tell us about your project <ArrowRight className="h-4 w-4" />
              </a>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="hero-ghost-btn">
                <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
              </a>
            </motion.div>
          </div>
          <motion.dl initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} className="svc-facts">
            <Fact icon={<Clock />} label="Typical timeline" value={x.timeline} />
            <Fact icon={<Layers />} label="How we work together" value={x.engagement} />
            <Fact icon={<Target />} label="Next step" value="A free call, then a clear plan and fixed quote" />
          </motion.dl>
        </div>
      </section>

      {/* Problem */}
      <Block title="The problem this solves" lead={`What usually goes wrong before businesses come to us for ${data.name}.`}>
        <div className="grid gap-4 md:grid-cols-2">
          {data.pains.map((p) => (
            <motion.div key={p.title} {...reveal} className="svc-pain">
              <h3 className="font-display text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </motion.div>
          ))}
        </div>
      </Block>

      {/* Deliverables + who it's for */}
      <Block tone="alt" title="What you get" lead="Everything below is included and set up for you.">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <ul className="grid gap-3 sm:grid-cols-2">
            {x.deliverables.map((d) => (
              <motion.li key={d} {...reveal} className="svc-deliverable">
                <span className="svc-tick"><Check className="h-3.5 w-3.5" /></span>
                <span>{d}</span>
              </motion.li>
            ))}
          </ul>
          <div>
            <h3 className="font-display text-lg font-semibold">This is a good fit if…</h3>
            <ul className="mt-4 space-y-3">
              {data.forYou.map((f) => (
                <li key={f} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--emma-violet)]" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Block>

      {/* Demo */}
      {x.demo === "workflow" && x.workflow && (
        <Block title="See how it works" lead="Hover to pause, or click any step.">
          <WorkflowViz nodes={x.workflow} />
        </Block>
      )}
      {x.demo === "dashboard" && (
        <Block title="What you'll see every week" lead="A clear view of results instead of guesswork. Illustrative numbers.">
          <DashboardDemo title={data.name} />
        </Block>
      )}
      {x.demo === "site" && <TransformationSlider />}

      {/* Process */}
      <Block tone="alt" title="How the work happens" lead="A clear process, so you always know what's next.">
        <ol className="svc-timeline">
          {data.process.map((p, i) => (
            <motion.li key={p.title} {...reveal} className="svc-step">
              <span className="svc-step-n">{i + 1}</span>
              <div>
                <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  {p.bullets.map((b) => <li key={b}>{b}</li>)}
                </ul>
              </div>
            </motion.li>
          ))}
        </ol>
      </Block>

      {/* Client results */}
      {data.results.length > 0 && (
        <Block title="What happens after we set this up" lead="Results from businesses we've built this for.">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {data.results.map((r) => (
              <motion.div key={r.business} {...reveal} className="svc-scenario">
                <p className="flex items-center gap-2 text-sm font-semibold"><span className="text-xl" aria-hidden="true">{r.flag}</span>{r.business}</p>
                <p className="mt-4 text-sm"><span className="text-muted-foreground">Before · </span>{r.before}</p>
                <p className="mt-2 text-sm font-medium"><span className="text-[color:var(--emma-violet)]">After · </span>{r.after}</p>
              </motion.div>
            ))}
          </div>
        </Block>
      )}

      {/* Direct answers */}
      {qa.length > 0 && (
        <Block title={`Questions about ${data.name}`} lead="Straight answers to what business owners ask us most.">
          <div className="grid gap-4 lg:grid-cols-2">
            {qa.map((item) => (
              <motion.article key={item.q} {...reveal} className="svc-panel">
                <h3 className="font-display text-lg font-semibold">{item.q}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{item.a}</p>
              </motion.article>
            ))}
          </div>
        </Block>
      )}

      {/* Related client work */}
      <Block tone="alt" title="Related client work" lead="Projects where we delivered this kind of work.">
        <div className="grid gap-5 md:grid-cols-3">
          {work.map((p, i) => <ProjectCard key={p.name} p={p} index={i} />)}
        </div>
        <Link to="/portfolio" className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--emma-violet)] hover:underline underline-offset-4">
          See all client work <ArrowRight className="h-4 w-4" />
        </Link>
      </Block>

      {/* Integrations + scope */}
      <Block tone="alt" title="Tools, scope and pricing">
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="svc-panel lg:col-span-2">
            <div className="flex items-center gap-2"><Wrench className="h-4 w-4 text-[color:var(--emma-violet)]" /><h3 className="font-display font-semibold">Tools we work with</h3></div>
            <p className="mt-1 text-sm text-muted-foreground">We use what fits your business, and connect to the tools you already have where possible.</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {data.tools.map((t) => <li key={t} className="svc-tool">{t}</li>)}
            </ul>
          </div>
          <div className="svc-panel">
            <h3 className="font-display font-semibold">Scope and pricing</h3>
            <p className="mt-2 text-sm text-muted-foreground">{x.timeline}. {x.engagement}. You get a fixed quote after a free call — no surprises.</p>
            <Link to="/pricing" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--emma-violet)] hover:underline underline-offset-4">
              See plans and pricing <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Block>

      {/* FAQ */}
      <Block title="Questions people ask">
        <div className="mx-auto max-w-3xl divide-y divide-border rounded-2xl border border-border bg-card">
          {data.faqs.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
        </div>
      </Block>

      {/* About Emmanuel (original bio) */}
      <Block tone="alt">
        <div className="grid gap-10 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
          <img src={emmanuelImg} alt="Emmanuel Akinloye Oluwaseun, founder of EmmaForYou" className="aspect-[4/5] w-full max-w-[300px] rounded-[22px] object-cover shadow-[var(--shadow-card-hover)]" loading="lazy" />
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Why Emmanuel Akinloye Oluwaseun?</h2>
            <div className="mt-5 max-w-2xl space-y-4 leading-relaxed text-muted-foreground">
              <p>Emmanuel is a developer (including Web3, Solidity and smart contracts), marketer and promoter, UI/UX designer, conversion rate optimisation expert, business consultant and accountability coach. He started building digital systems for businesses in Lagos before scaling his work across Europe and the United States. After 6+ years and 500+ projects, he's learnt one thing — businesses don't need more tools, they need the RIGHT system, configured for THEIR customer.</p>
              <p>He's worked with fashion brands, clinics, restaurants, real-estate teams, coaches, ecommerce stores and over 50 niches in total. Every implementation is hands-on, customised, and outcome-focused.</p>
              <p>His philosophy on {data.name}: "Tools are commodities. Strategy is rare. We sell the strategy and use the right tool for your specific reality."</p>
              <p>What makes his approach different is access — clients chat with Emmanuel directly on WhatsApp. No account managers. No layers. Just real conversations and real results.</p>
              <blockquote className="border-l-2 border-[color:var(--emma-violet)] pl-4 italic text-foreground">"Every business is one well-built system away from doubling. We just build that system."</blockquote>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">500+ Businesses Helped · 3 Continents · 6+ Years Experience · Nigeria · USA · Europe · Africa</p>
          </div>
        </div>
      </Block>

      {/* Related services */}
      <Block title="Related services">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((r) => (
            <li key={r.to}>
              <Link to={r.to} className="flex h-full flex-col rounded-[18px] border border-border bg-card p-5 transition-colors hover:border-[color:var(--emma-violet)]">
                <span className="font-display font-semibold">{r.label}</span>
                <span className="mt-1 text-sm text-muted-foreground">{r.short}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Block>

      {/* Inquiry */}
      <section id="inquiry" className="band-ink relative overflow-hidden bg-[#0b0d24] text-white">
        <div className="hero-ink-glow" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-24 md:px-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">Tell us about your {data.name} project</h2>
            <p className="mt-4 text-[#b3b8dc]">A few quick answers help us come back with a useful plan, not a generic pitch. Free, and no obligation.</p>
            <ul className="mt-8 space-y-3 text-sm text-[#c9ccec]">
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-[#3dd6f5]" /> Reply within one working day</li>
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-[#3dd6f5]" /> A clear plan and fixed quote</li>
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-[#3dd6f5]" /> No long-term contracts</li>
            </ul>
          </div>
          <ServiceInquiryForm serviceName={data.name} serviceSlug={data.slug} questions={x.questions} />
        </div>
      </section>
    </article>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="svc-fact">
      <span className="svc-fact-icon">{icon}</span>
      <div>
        <dt className="text-xs text-[#8f94bf]">{label}</dt>
        <dd className="mt-0.5 text-sm text-white">{value}</dd>
      </div>
    </div>
  );
}

function Block({ title, lead, tone, children }: { title?: string; lead?: string; tone?: "alt"; children: React.ReactNode }) {
  return (
    <section className={`py-20 md:py-28 ${tone === "alt" ? "bg-secondary" : "bg-background"}`}>
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        {title && (
          <motion.div {...reveal} className="mb-10 max-w-2xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
            {lead && <p className="mt-3 text-muted-foreground">{lead}</p>}
          </motion.div>
        )}
        {children}
      </div>
    </section>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
        <span className="font-medium">{q}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className="acc-panel" data-open={open} inert={!open}>
        <div><p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{a}</p></div>
      </div>
    </div>
  );
}
