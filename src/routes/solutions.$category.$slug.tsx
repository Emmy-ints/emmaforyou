import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Check, MessageCircle, PlayCircle } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DemoShell from "../components/solutions/DemoShell";
import { findCategory, findSolution, groupDefaults, relatedSolutions, solutionPath, useCasesFor } from "@/lib/solutions";
import { PROCESS, solutionDescription, solutionFaqs, solutionSeoTitle } from "@/lib/solutions/content";
import { ENGINE_TITLES } from "@/lib/solutions/engine-titles";
import { PROJECTS, projectSlug } from "@/lib/portfolio-data";
import { WHATSAPP_URL, breadcrumbLd, pageHead, serviceLd } from "@/lib/seo";
import { track } from "@/lib/analytics";
import { LeadCapture } from "../components/tools/LeadCapture";
import { getSolutionMeta } from "@/lib/solutions-server";

export const Route = createFileRoute("/solutions/$category/$slug")({
  component: Page,
  loader: async ({ params }) => {
    const meta = await getSolutionMeta({ data: { category: params.category, slug: params.slug } });
    if (!meta) throw notFound();
    return meta;
  },
  head: ({ loaderData: m }) => {
    if (!m) return { meta: [{ title: "Solution not found — EmmaForYou" }, { name: "robots", content: "noindex" }] };
    const { path, faqs } = m;
    return pageHead({
      title: m.title,
      description: m.description,
      path,
      jsonLd: [
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Solutions", path: "/solutions" }, { name: m.catName, path: `/solutions/${m.catSlug}` }, { name: m.name, path }]),
        serviceLd({ name: m.name, description: m.serviceDescription, path, serviceType: m.catName }),
        { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
      ],
    });
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background"><Navbar /><main className="mx-auto max-w-3xl px-5 pb-24 pt-36"><h1 className="font-display text-3xl font-semibold">That solution doesn't exist</h1><p className="mt-3 text-muted-foreground">It may have moved.</p><Link to="/solutions" className="mt-6 inline-block font-semibold text-[var(--emma-violet)]">Browse all solutions →</Link></main><Footer /></div>
  ),
});

function Page() {
  const { category, slug } = Route.useLoaderData();
  const s = findSolution(category, slug)!;
  const cat = findCategory(s.category)!;
  const group = cat.groups.find((g) => g.id === s.group);
  const d = groupDefaults(s);
  const integrations = [...new Set([...(s.integrations ?? []), ...d.integrations])];
  const benefits = [...(s.benefits ?? []), ...d.benefits];
  const faqs = solutionFaqs(s);
  const related = relatedSolutions(s, 4);
  const work = (s.clientWork ?? []).map((n) => PROJECTS.find((p) => p.name === n)).filter(Boolean) as typeof PROJECTS;
  const cta = (label: string) => () => track("cta_click", { cta: label, page: `solution:${s.slug}` });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <section className="hero-ink relative overflow-hidden">
          <div className="hero-ink-grid" aria-hidden="true" />
          <div className="hero-ink-glow" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-5 pb-14 pt-32 md:pt-40">
            <nav aria-label="Breadcrumb" className="text-sm text-[#a6abd0]"><Link to="/solutions" className="hover:text-white">Solutions</Link> <span aria-hidden="true">/</span> <Link to="/solutions/$category" params={{ category: cat.slug }} className="hover:text-white">{cat.name}</Link>{group && cat.groups.length > 1 && <> <span aria-hidden="true">/</span> <span>{group.name}</span></>}</nav>
            <p className="hero-kicker mt-6"><span className="hero-kicker-dot" aria-hidden="true" />Live demo · {ENGINE_TITLES[s.demo.engine]}</p>
            <h1 className="hero-ink-title max-w-4xl"><span aria-hidden="true" className="mr-2">{s.icon}</span>{s.name}</h1>
            <p className="hero-ink-sub max-w-3xl">{s.tagline}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#demo" onClick={cta("try-demo")} className="btn-primary-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white"><PlayCircle className="h-4 w-4" />Try the live demo</a>
              <Link to="/proposal" onClick={cta("quote")} className="hero-ghost-btn">Get a quote <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/book" onClick={cta("book")} className="hero-ghost-btn">Book a free call</Link>
            </div>
          </div>
        </section>

        <section id="demo" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-14" aria-labelledby="demo-h">
          <div className="mb-5 max-w-3xl"><h2 id="demo-h" className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Try it: {s.name.replace(/\s*\([^)]*\)/, "")} prototype</h2><p className="mt-2 text-muted-foreground">Add your business name and colour, click around, then reset whenever you like. It runs entirely in your browser with sample data.</p></div>
          <DemoShell solution={s} />
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-14" aria-labelledby="overview-h">
          <h2 id="overview-h" className="sr-only">Overview</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[20px] border border-border bg-card p-5"><h3 className="font-display text-lg font-semibold">What it does</h3><p className="mt-2 text-sm text-muted-foreground">{s.tagline}</p></div>
            <div className="rounded-[20px] border border-border bg-card p-5"><h3 className="font-display text-lg font-semibold">Who needs it</h3><p className="mt-2 text-sm text-muted-foreground">{s.who}</p></div>
            <div className="rounded-[20px] border border-border bg-card p-5"><h3 className="font-display text-lg font-semibold">Problems it solves</h3><ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">{s.problems.map((p) => <li key={p} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--emma-violet)]" />{p}</li>)}</ul></div>
          </div>
        </section>

        {useCasesFor(s).length > 0 && (
          <section className="mx-auto max-w-6xl px-5 pb-14" aria-labelledby="uses-h">
            <h2 id="uses-h" className="font-display text-2xl font-semibold tracking-tight">Use cases</h2>
            <ol className="mt-4 grid gap-4 md:grid-cols-3">{useCasesFor(s).map((u, i) => <li key={u} className="rounded-[20px] border border-border bg-card p-5 text-sm leading-relaxed"><span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--emma-violet)_12%,transparent)] text-xs font-semibold text-[var(--emma-violet)]" aria-hidden="true">{i + 1}</span>{u}</li>)}</ol>
          </section>
        )}

        <section className="bg-muted/50" aria-labelledby="features-h">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-2">
            <div>
              <h2 id="features-h" className="font-display text-2xl font-semibold tracking-tight">Key features</h2>
              <ul className="mt-4 space-y-2">{s.features.map((f) => <li key={f} className="flex gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{f}</li>)}</ul>
            </div>
            {s.advanced && s.advanced.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight">{s.category === "industries" ? "AI features" : "Advanced options"}</h2>
                <ul className="mt-4 space-y-2">{s.advanced.map((f) => <li key={f} className="flex gap-2 text-sm"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--emma-violet)]" />{f.replace(/^AI: /, "")}</li>)}</ul>
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14" aria-labelledby="int-h">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 id="int-h" className="font-display text-2xl font-semibold tracking-tight">Possible integrations</h2>
              <ul className="mt-4 flex flex-wrap gap-2">{integrations.map((i) => <li key={i} className="rounded-full border border-border bg-card px-3 py-1.5 text-sm">{i}</li>)}</ul>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight">Business benefits</h2>
              <ul className="mt-4 space-y-2">{benefits.map((b) => <li key={b} className="flex gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--emma-violet)]" />{b}</li>)}</ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-14" aria-labelledby="ba-h">
          <h2 id="ba-h" className="font-display text-2xl font-semibold tracking-tight">Before and after</h2>
          <p className="mt-1 text-sm text-muted-foreground">An illustrative example of the change, not a specific client's result.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-[20px] border border-border bg-card p-5"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Before</p><p className="mt-2">{s.before}</p></div>
            <div className="rounded-[20px] border-2 border-[var(--emma-violet)] bg-card p-5"><p className="text-xs font-semibold uppercase tracking-wider text-[var(--emma-violet)]">After</p><p className="mt-2">{s.after}</p></div>
          </div>
        </section>

        {work.length > 0 && (
          <section className="mx-auto max-w-6xl px-5 pb-14" aria-labelledby="work-h">
            <h2 id="work-h" className="font-display text-2xl font-semibold tracking-tight">Related client work</h2>
            <p className="mt-1 text-sm text-muted-foreground">Real projects from our portfolio with similar features.</p>
            <ul className="mt-4 grid gap-4 md:grid-cols-3">{work.map((p) => (
              <li key={p.name}><Link to="/portfolio/$slug" params={{ slug: projectSlug(p.name) }} className="block h-full overflow-hidden rounded-[20px] border border-border bg-card transition hover:border-[var(--emma-violet)]">
                <img src={p.img} alt="" loading="lazy" className="h-36 w-full object-cover" />
                <div className="p-4"><p className="font-display font-semibold">{p.name}</p><p className="mt-1 text-sm text-muted-foreground">{p.desc}</p><p className="mt-2 inline-block rounded-full bg-muted px-3 py-1 text-sm font-semibold">{p.outcome}</p></div>
              </Link></li>))}</ul>
          </section>
        )}

        <section className="bg-muted/50" aria-labelledby="process-h">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <h2 id="process-h" className="font-display text-2xl font-semibold tracking-tight">How we'd build yours</h2>
            <ol className="mt-5 grid gap-3 md:grid-cols-5">{PROCESS.map((p, i) => <li key={p.title} className="rounded-[18px] border border-border bg-card p-4"><span className="text-xs font-semibold text-[var(--emma-violet)]">Step {i + 1}</span><h3 className="mt-1 font-semibold">{p.title}</h3><p className="mt-1 text-sm text-muted-foreground">{p.text}</p></li>)}</ol>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-14" aria-labelledby="faq-h">
          <h2 id="faq-h" className="font-display text-2xl font-semibold tracking-tight">Questions</h2>
          <div className="mt-4 divide-y divide-border rounded-[20px] border border-border bg-card">{faqs.map((f) => <details key={f.q} className="p-5"><summary className="cursor-pointer font-semibold">{f.q}</summary><p className="mt-2 text-muted-foreground">{f.a}</p></details>)}</div>
        </section>

        {related.length > 0 && (
          <section className="mx-auto max-w-6xl px-5 pb-14" aria-labelledby="rel-h">
            <h2 id="rel-h" className="font-display text-2xl font-semibold tracking-tight">Related solutions</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{related.map((r) => <li key={r.slug}><Link to="/solutions/$category/$slug" params={{ category: r.category, slug: r.slug }} className="flex h-full flex-col rounded-[18px] border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-[var(--emma-violet)]"><span className="text-2xl" aria-hidden="true">{r.icon}</span><span className="mt-2 font-semibold">{r.name}</span><span className="mt-1 text-xs text-muted-foreground">{r.tagline}</span></Link></li>)}</ul>
          </section>
        )}

        <section className="mx-auto max-w-3xl px-5 pb-14">
          <LeadCapture tool="Solution enquiry" title={`Ask about a ${s.name.replace(/\s*\([^)]*\)/, "")} for your business`} lead="Leave your details and Emmanuel will get back to you on WhatsApp or email." button="Send my enquiry" summary={`Interested in: ${s.name} (${cat.name})\nPage: ${solutionPath(s)}`} />
        </section>

        <section className="band-ink" aria-labelledby="cta-h">
          <div className="mx-auto max-w-4xl px-5 py-16 text-center">
            <h2 id="cta-h" className="font-display text-3xl font-semibold tracking-tight text-foreground">Want this for your business?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Tell us what you need. You'll get a clear scope, timeline and quote, and a prototype built around your business.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link to="/proposal" onClick={cta("quote-bottom")} className="btn-primary-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white">Get a quote <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/book" onClick={cta("book-bottom")} className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 font-semibold text-foreground">Book a free call</Link>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 font-semibold text-foreground"><MessageCircle className="h-4 w-4" />WhatsApp</a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
