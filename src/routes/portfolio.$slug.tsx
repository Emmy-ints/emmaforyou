import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { KineticText } from "@/components/future/Kinetic";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Layers, Target } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProjectCard from "../components/portfolio/ProjectCard";
import { useSettings } from "@/lib/site-settings";
import { liveImage, liveStandIn } from "@/lib/portfolio-live";
import { SafeProjectImage } from "../components/portfolio/ProjectVisual";
import { PROJECTS, featuredFor, findProject, projectSlug, socialFor } from "@/lib/portfolio-data";
import { buildWa } from "@/lib/leads";
import { pageHead, breadcrumbLd, creativeWorkLd, clip } from "@/lib/seo";
import { fetchCaseStudy } from "@/lib/case-studies";
import { Quote } from "lucide-react";

const SERVICE_FOR_CATEGORY: Record<string, { slug: string; name: string }> = {
  Ecommerce: { slug: "ecommerce", name: "Ecommerce Growth" },
  Websites: { slug: "website-design", name: "Website Design & Dev" },
  Automation: { slug: "ai-automation", name: "AI Automation" },
  Branding: { slug: "social-media", name: "Social Media Management" },
  "Social Media": { slug: "social-media", name: "Social Media Management" },
  Ads: { slug: "ad-marketing", name: "Ad Marketing" },
};

export const Route = createFileRoute("/portfolio/$slug")({
  component: CaseStudyPage,
  loader: async ({ params }) => {
    const project = findProject(params.slug);
    if (!project) throw notFound();
    const study = await fetchCaseStudy(projectSlug(project.name));
    return { project, study };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Project not found — EmmaForYou" }, { name: "robots", content: "noindex" }] };
    const p = loaderData.project;
    const f = featuredFor(p.name);
    const path = `/portfolio/${projectSlug(p.name)}`;
    const image = f?.img ?? p.img;
    return pageHead({
      title: `${p.name} — ${p.category} Case Study | EmmaForYou`,
      description: clip(loaderData.study?.challenge ? `${p.name}: ${loaderData.study.challenge} Outcome: ${f ? `${f.metric} ${f.metricLabel}` : p.outcome}.` : `${p.desc} Outcome: ${f ? `${f.metric} ${f.metricLabel}` : p.outcome}.`),
      path,
      image,
      imageAlt: `${p.name} project`,
      type: "article",
      jsonLd: [
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Portfolio", path: "/portfolio" }, { name: p.name, path }]),
        creativeWorkLd({ name: p.name, description: f?.desc ?? p.desc, path, image, about: p.category }),
      ],
    });
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-36 text-center">
        <h1 className="font-display text-3xl font-semibold"><KineticText text="That project isn't in the portfolio" base={60} /></h1>
        <p className="mt-3 text-muted-foreground">It may have been renamed. Browse all client work instead.</p>
        <Link to="/portfolio" className="btn-gold mt-8 inline-flex rounded-full px-6 py-3 text-sm">See all projects</Link>
      </main>
      <Footer />
    </div>
  ),
});

const reveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
};

function CaseStudyPage() {
  const { project: p, study } = Route.useLoaderData();
  const settings = useSettings();
  const featured = featuredFor(p.name);
  const social = socialFor(p.name);
  const service = SERVICE_FOR_CATEGORY[p.category] ?? SERVICE_FOR_CATEGORY.Websites;
  const index = PROJECTS.findIndex((x) => x.name === p.name);
  const more = [1, 2, 3].map((k) => PROJECTS[(index + k) % PROJECTS.length]);
  const deliverables = Array.from(new Set([...(featured?.tags ?? []), ...p.stack]));

  return (
    <div className="bg-background text-foreground">
      <Navbar />
      <main>
        <section className="hero-ink hero-x relative overflow-hidden" data-scroll>
          <div className="hero-ink-grid" aria-hidden="true" />
          <div className="hero-ink-glow" aria-hidden="true" />
          <div className="hero-x-horizon" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl px-5 pb-14 pt-32 md:px-8 lg:pt-40">
            <Link to="/portfolio" className="inline-flex items-center gap-1.5 text-sm text-[#a6abd0] hover:text-white"><ArrowLeft className="h-4 w-4" /> All client work</Link>
            <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:items-end">
              <div>
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="hero-kicker"><span className="hero-kicker-dot" aria-hidden="true" />{featured?.niche ?? p.category}</motion.p>
                <h1 className="hero-ink-title"><KineticText text={p.name} /></h1>
                <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.12 }} className="hero-ink-sub">{p.desc}</motion.p>
              </div>
              <motion.dl initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} className="svc-facts">
                <div className="svc-fact">
                  <span className="svc-fact-icon"><Target /></span>
                  <div><dt className="text-xs text-[#8f94bf]">Outcome</dt><dd className="mt-0.5 font-display text-xl font-semibold text-white">{featured ? `${featured.metric} ${featured.metricLabel}` : p.outcome}</dd></div>
                </div>
                <div className="svc-fact">
                  <span className="svc-fact-icon"><Layers /></span>
                  <div><dt className="text-xs text-[#8f94bf]">Category</dt><dd className="mt-0.5 text-sm text-white">{p.category}</dd></div>
                </div>
                <div className="svc-fact">
                  <span className="svc-fact-icon"><ArrowUpRight /></span>
                  <div><dt className="text-xs text-[#8f94bf]">Project</dt><dd className="mt-0.5 text-sm text-white">{p.url}</dd></div>
                </div>
              </motion.dl>
            </div>
          </div>
        </section>

        <section className="relative -mt-px bg-[#0b0d24] px-5 pb-20 md:px-8">
          <motion.figure initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="cs-media csx-media mx-auto max-w-7xl" data-scroll>
            <SafeProjectImage p={p} src={liveImage(p, settings)} alt={`${p.name} project`} className="csx-img h-full w-full object-cover" />
            {liveStandIn(p, settings) && <figcaption className="pc-standin">Illustrative photo — the client's own screenshots will replace it</figcaption>}
          </motion.figure>
        </section>

        <section className="py-20 md:py-28">
          <div className="mx-auto grid max-w-6xl gap-14 px-5 md:px-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <motion.div {...reveal}>
              <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl"><KineticText text="The project" base={30} /></h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{p.desc}</p>
              {featured && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{featured.desc}</p>}

              {social && (
                <div className="mt-12">
                  <h3 className="font-display text-xl font-semibold">Social media: before and after</h3>
                  <div className="mt-4 grid grid-cols-[1fr_auto_1fr] gap-3">
                    <div className="pf-social-col"><span className="text-xs text-muted-foreground">Before</span><p className="mt-1 text-sm">{social.before}</p></div>
                    <span className="grid place-items-center text-muted-foreground"><ArrowRight className="h-4 w-4" /></span>
                    <div className="pf-social-col is-after"><span className="text-xs text-[color:var(--emma-violet)]">After</span><p className="mt-1 text-sm font-medium">{social.after}</p></div>
                  </div>
                </div>
              )}
            </motion.div>

            <motion.aside {...reveal} className="space-y-5">
              <div className="svc-panel">
                <h3 className="font-display font-semibold">What we delivered</h3>
                <ul className="mt-4 space-y-2.5">
                  {deliverables.map((d) => (
                    <li key={d} className="flex items-center gap-2.5 text-sm"><span className="svc-tick"><Check className="h-3 w-3" /></span>{d}</li>
                  ))}
                </ul>
              </div>
              <div className="svc-panel">
                <h3 className="font-display font-semibold">Result</h3>
                <p className="pf-metric mt-2">{featured?.metric ?? p.outcome}</p>
                {featured && <p className="text-sm text-muted-foreground">{featured.metricLabel}</p>}
              </div>
              <Link to="/services/$slug" params={{ slug: service.slug }} className="flex items-center justify-between gap-3 rounded-[18px] border border-border bg-card p-5 text-sm font-semibold hover:border-[color:var(--emma-violet)]">
                How {service.name} works <ArrowRight className="h-4 w-4 text-[color:var(--emma-violet)]" />
              </Link>
            </motion.aside>
          </div>
        </section>

        {study && (
          <section className="border-t border-border py-20 md:py-24" aria-labelledby="cs-story">
            <div className="mx-auto max-w-4xl space-y-12 px-5 md:px-8">
              <h2 id="cs-story" className="font-display text-3xl font-semibold tracking-tight md:text-4xl"><KineticText text="The full story" base={30} /></h2>
              {study.challenge && (
                <div><h3 className="font-display text-xl font-semibold">The challenge</h3><p className="mt-3 whitespace-pre-line text-lg leading-relaxed text-muted-foreground">{study.challenge}</p></div>
              )}
              {(study.approach || study.deliverables.length > 0) && (
                <div>
                  <h3 className="font-display text-xl font-semibold">What we did</h3>
                  {study.approach && <p className="mt-3 whitespace-pre-line text-lg leading-relaxed text-muted-foreground">{study.approach}</p>}
                  {study.deliverables.length > 0 && (
                    <ul className="mt-4 grid gap-2 sm:grid-cols-2">{study.deliverables.map((d) => <li key={d} className="flex items-start gap-2.5 text-sm"><span className="svc-tick mt-0.5"><Check className="h-3 w-3" /></span>{d}</li>)}</ul>
                  )}
                </div>
              )}
              {study.results && (
                <div className="rounded-[22px] border border-border bg-card p-6"><h3 className="font-display text-xl font-semibold">Results</h3><p className="mt-3 whitespace-pre-line leading-relaxed text-foreground">{study.results}</p>{study.timeline && <p className="mt-3 text-sm text-muted-foreground">Timeline: {study.timeline}</p>}</div>
              )}
              {study.quote && (
                <figure className="rounded-[22px] bg-muted p-6 md:p-8">
                  <Quote className="h-6 w-6 text-[color:var(--emma-violet)]" aria-hidden="true" />
                  <blockquote className="mt-3 font-display text-xl leading-relaxed">“{study.quote}”</blockquote>
                  {(study.quote_author || study.client_role) && <figcaption className="mt-4 text-sm text-muted-foreground">— {[study.quote_author, study.client_role].filter(Boolean).join(", ")}</figcaption>}
                </figure>
              )}
              {study.screenshots.length > 0 && (
                <div>
                  <h3 className="font-display text-xl font-semibold">Screenshots</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {study.screenshots.map((src, i) => (
                      <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-[18px] border border-border">
                        <img src={src} alt={`${p.name} screenshot ${i + 1}`} loading="lazy" className="w-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="band-ink bg-[#0b0d24] py-20 text-white">
          <div className="mx-auto flex max-w-5xl flex-col items-center px-5 text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">Want something like {p.name} for your business?</h2>
            <p className="mt-4 max-w-xl text-[#b3b8dc]">Tell us about your project and we'll come back with a plan and a fixed quote.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/services/$slug" params={{ slug: service.slug }} hash="inquiry" className="btn-gold inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[15px]">Start a similar project</Link>
              <a href={buildWa(`Hi Emmanuel! I saw the ${p.name} project and I'd like something similar.`)} target="_blank" rel="noopener noreferrer" className="hero-ghost-btn">Chat on WhatsApp</a>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl"><KineticText text="More client work" base={30} /></h2>
              <Link to="/portfolio" className="text-sm font-semibold text-[color:var(--emma-violet)] hover:underline underline-offset-4">All projects</Link>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((m, i) => <ProjectCard key={projectSlug(m.name)} p={m} index={i} />)}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
