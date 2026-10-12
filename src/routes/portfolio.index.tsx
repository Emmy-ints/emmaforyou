import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Megaphone, PlayCircle, Sparkles, Zap } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProjectCard from "../components/portfolio/ProjectCard";
import ClientWall from "../components/portfolio/ClientWall";
import { ADS, AUTOMATIONS, FEATURED, PROJECTS, SOCIAL_BEFORE_AFTER, VIDEOS, findProject, projectSlug } from "@/lib/portfolio-data";
import { buildWa } from "@/lib/leads";

export const Route = createFileRoute("/portfolio/")({
  component: PortfolioPage,
  head: () => ({
    meta: [
      { title: "Portfolio — Client Work | EmmaForYou" },
      { name: "description", content: "Websites, ecommerce stores, automation systems, social media and ad campaigns EmmaForYou has delivered for fashion brands, clinics, restaurants, real estate teams, coaches and more." },
      { property: "og:title", content: "EmmaForYou — Client Work" },
      { property: "og:description", content: "Real businesses, real projects: websites, automation, social and ads." },
      { property: "og:image", content: FEATURED[0].img },
    ],
  }),
});

const enter = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
});

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
};

function PortfolioPage() {
  const categories = useMemo(() => ["All", ...Array.from(new Set(PROJECTS.map((p) => p.category)))], []);
  const [filter, setFilter] = useState("All");
  const shown = PROJECTS.filter((p) => filter === "All" || p.category === filter);
  const videos = VIDEOS.filter((v) => v.url);

  return (
    <div className="bg-background text-foreground">
      <Navbar />
      <main>
        {/* Hero */}
        <section className="hero-ink relative overflow-hidden">
          <div className="hero-ink-grid" aria-hidden="true" />
          <div className="hero-ink-glow" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-32 md:px-8 lg:pt-40">
            <motion.p {...enter(0)} className="hero-kicker"><span className="hero-kicker-dot" aria-hidden="true" />Selected client work</motion.p>
            <motion.h1 {...enter(0.06)} className="hero-ink-title max-w-[18ch]">Real businesses. Real projects. Built and grown by EmmaForYou.</motion.h1>
            <motion.p {...enter(0.12)} className="hero-ink-sub">
              Websites, online stores, automation, social media and ads for {PROJECTS.length} businesses across fashion, real estate, hospitality, health, education and coaching.
            </motion.p>
            <div className="mt-12">
              <ClientWall tone="ink" />
            </div>
          </div>
        </section>

        {/* Featured case studies */}
        <section className="py-24 md:py-32">
          <div className="mx-auto max-w-7xl space-y-24 px-5 md:px-8">
            {FEATURED.map((f, i) => {
              const p = findProject(projectSlug(f.client));
              return (
                <motion.article key={f.client} {...reveal} className={`pf-feature ${i % 2 ? "is-flipped" : ""}`}>
                  <Link to="/portfolio/$slug" params={{ slug: projectSlug(f.client) }} className="pf-feature-media group" aria-label={`${f.client} case study`}>
                    <img src={f.img} alt={`${f.client} project`} loading="lazy" className="transition-transform duration-700 group-hover:scale-[1.03]" />
                    <span className="pf-feature-badge">{f.niche}</span>
                  </Link>
                  <div>
                    <ul className="flex flex-wrap gap-2">{f.tags.map((t) => <li key={t} className="pf-tag">{t}</li>)}</ul>
                    <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight md:text-4xl">{f.client}</h2>
                    {p && <p className="mt-1 text-sm text-muted-foreground">{p.url}</p>}
                    <div className="mt-6 flex items-baseline gap-3">
                      <span className="pf-metric">{f.metric}</span>
                      <span className="text-sm font-medium text-muted-foreground">{f.metricLabel}</span>
                    </div>
                    <p className="mt-5 max-w-xl leading-relaxed text-muted-foreground">{f.desc}</p>
                    <Link to="/portfolio/$slug" params={{ slug: projectSlug(f.client) }} className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--emma-violet)] hover:underline underline-offset-4">
                      Read the case study <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>

        {/* All projects */}
        <section id="projects" className="bg-secondary py-24 md:py-28">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <h2 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">All projects</h2>
                <p className="mt-3 text-muted-foreground">Hover or tap a project for details. Open any project for the full story.</p>
              </div>
              <LayoutGroup>
                <div className="pf-filters" role="tablist" aria-label="Filter projects">
                  {categories.map((c) => (
                    <button key={c} role="tab" aria-selected={filter === c} onClick={() => setFilter(c)} className="pf-filter">
                      {filter === c && <motion.span layoutId="pf-filter-pill" className="pf-filter-pill" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                      <span className="relative">{c}</span>
                    </button>
                  ))}
                </div>
              </LayoutGroup>
            </div>
            <motion.div layout className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {shown.map((p, i) => <ProjectCard key={p.name} p={p} index={i} />)}
              </AnimatePresence>
            </motion.div>
          </div>
        </section>

        {/* Social transformations */}
        <section className="py-24 md:py-28">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <motion.div {...reveal} className="max-w-2xl">
              <h2 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">Social media transformations</h2>
              <p className="mt-3 text-muted-foreground">Where each account started, and where we took it.</p>
            </motion.div>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {SOCIAL_BEFORE_AFTER.map((s) => (
                <motion.div key={s.name} {...reveal} className="pf-social">
                  <p className="font-display font-semibold">{s.name}</p>
                  <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-stretch gap-3">
                    <div className="pf-social-col">
                      <span className="text-xs text-muted-foreground">Before</span>
                      <p className="mt-1 text-sm">{s.before}</p>
                    </div>
                    <span className="grid place-items-center text-muted-foreground"><ArrowRight className="h-4 w-4" /></span>
                    <div className="pf-social-col is-after" style={{ ["--c" as string]: s.color }}>
                      <span className="text-xs text-[color:var(--emma-violet)]">After</span>
                      <p className="mt-1 text-sm font-medium">{s.after}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Ad creatives */}
        <section className="band-ink bg-[#0b0d24] py-24 text-white md:py-28">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <motion.div {...reveal} className="max-w-2xl">
              <p className="hero-kicker"><Megaphone className="h-4 w-4 text-[#3dd6f5]" /> Paid social & search</p>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white md:text-5xl">Ad creatives that convert</h2>
            </motion.div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ADS.map((ad) => (
                <motion.div key={ad.headline} {...reveal} className="pf-ad">
                  <div className="flex items-center gap-2 text-xs text-[#8f94bf]">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[rgba(109,91,255,0.3)] text-[10px] font-bold text-white">E</span>
                    Sponsored · {ad.niche}
                  </div>
                  <p className="mt-4 font-display text-lg font-semibold text-white">{ad.headline}</p>
                  <p className="mt-2 text-sm text-[#b3b8dc]">{ad.body}</p>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#0b0d24]">{ad.cta}</span>
                    <span className="text-xs text-[#7ee8fb]">{ad.stats}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Automation systems */}
        <section className="py-24 md:py-28">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <motion.div {...reveal} className="max-w-2xl">
              <h2 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">AI systems we've built</h2>
              <p className="mt-3 text-muted-foreground">The automations behind many of the projects above.</p>
            </motion.div>
            <ol className="mt-10 grid gap-3">
              {AUTOMATIONS.map((a, i) => (
                <motion.li key={a.title} {...reveal} className="pf-auto">
                  <span className="pf-auto-icon"><Zap className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-semibold">{a.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{a.desc}</p>
                  </div>
                  <span className="pf-auto-metric">{a.metric}</span>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        {/* Videos (shown once real recordings are added in portfolio-data) */}
        {videos.length > 0 && (
          <section className="bg-secondary py-24">
            <div className="mx-auto max-w-7xl px-5 md:px-8">
              <h2 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">Watch the transformations</h2>
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {videos.map((v) => (
                  <a key={v.title} href={v.url} target="_blank" rel="noopener noreferrer" className="pf-auto">
                    <PlayCircle className="h-6 w-6 text-[color:var(--emma-violet)]" />
                    <span className="flex-1 font-medium">{v.title}</span>
                    <span className="text-xs text-muted-foreground">{v.duration}</span>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="hero-ink relative overflow-hidden">
          <div className="hero-ink-glow" aria-hidden="true" />
          <div className="relative mx-auto flex max-w-5xl flex-col items-center px-5 py-24 text-center md:py-32">
            <Sparkles className="h-6 w-6 text-[#3dd6f5]" />
            <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-white md:text-5xl">Want results like these for your business?</h2>
            <p className="mt-4 max-w-xl text-[#b3b8dc]">Tell us what you're building. You'll get a clear plan and a fixed quote.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/intake" className="btn-gold inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[15px]">Start a project <ArrowUpRight className="h-4 w-4" /></Link>
              <a href={buildWa("Hi Emmanuel! I saw your portfolio and I'd like something similar for my business.")} target="_blank" rel="noopener noreferrer" className="hero-ghost-btn">Chat on WhatsApp</a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
