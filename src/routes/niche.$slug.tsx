import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, Check, MessageCircle, Sparkles, WandSparkles } from "lucide-react";
import { KineticText } from "@/components/future/Kinetic";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import NextCallTimes from "@/components/tools/NextCallTimes";
import { ClaimGate, ClaimTag } from "@/components/future/ClaimTag";
import { NICHES, getNiche } from "@/lib/niches";
import { INDUSTRY_LANDING, projectsFor, prototypeLink } from "@/lib/industry-landing";
import { servicePrice } from "@/lib/service-pricing";
import { buildWa } from "@/lib/leads";
import { track } from "@/lib/analytics";
import { pageHead, breadcrumbLd, serviceLd, clip, withBrand } from "@/lib/seo";

export const Route = createFileRoute("/niche/$slug")({
  component: NichePage,
  loader: ({ params }) => {
    const niche = getNiche(params.slug);
    if (!niche) throw notFound();
    return { niche };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background"><Navbar /><div className="pt-40 text-center"><h1 className="font-display text-3xl font-bold"><KineticText text="Niche not found" base={60} /></h1><Link to="/" className="mt-4 inline-block text-sm underline">Go home</Link></div></div>
  ),
  head: ({ loaderData }) =>
    loaderData
      ? pageHead({
          title: withBrand(`${loaderData.niche.name}: Websites, Automation & Marketing`),
          description: clip(`${loaderData.niche.hero} ${loaderData.niche.sub}`),
          path: `/niche/${loaderData.niche.slug}`,
          jsonLd: [
            breadcrumbLd([{ name: "Home", path: "/" }, { name: "Industries", path: "/industries" }, { name: loaderData.niche.name, path: `/niche/${loaderData.niche.slug}` }]),
            serviceLd({ name: `Digital growth services for ${loaderData.niche.name.toLowerCase()}`, description: loaderData.niche.sub, path: `/niche/${loaderData.niche.slug}`, serviceType: loaderData.niche.services.join(", ") }),
            ...(INDUSTRY_LANDING[loaderData.niche.slug] ? [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: INDUSTRY_LANDING[loaderData.niche.slug].faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }] : []),
          ],
        })
      : { meta: [{ title: "Industry not found — EmmaForYou" }, { name: "robots", content: "noindex" }] },
});

const STEPS = [
  { title: "See it first, free", body: "Build a free prototype of your website or app, or run the free website audit. No sign-up." },
  { title: "Free 30-minute call", body: "Emmanuel looks at how customers find you and buy from you today, and gives you a clear plan and price." },
  { title: "We build, you launch", body: "We set it up with your real brand and content, connect your tools, and show you how everything works." },
];

/** Industry landing page: built for ads and social traffic (one industry, one clear next step), and for search. */
function NichePage() {
  const { niche } = Route.useLoaderData();
  const l = INDUSTRY_LANDING[niche.slug];
  const projects = projectsFor(niche.slug);
  const price = l ? servicePrice(l.service) : null;
  const wa = buildWa(l?.whatsapp ?? `Hi! I run a ${niche.name.toLowerCase()} business and I want to grow with EmmaForYou. Can we talk?`);
  const proto = prototypeLink(niche.slug);
  const industry = niche.name.toLowerCase();
  const ask = () => { track("cta_click", { cta: "industry_recommend", industry: niche.slug }); window.dispatchEvent(new CustomEvent("efy-open-ask", { detail: { qualify: true, business: l?.business } })); };
  const waClick = (where: string) => track("whatsapp_click", { from: `industry_${where}`, industry: niche.slug });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content" className="pb-24 pt-28 md:pt-32" data-industry={niche.slug}>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-center">
          <div className="min-w-0">
            <span className="inline-block rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground">{niche.flag} For {niche.name}</span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] md:text-6xl"><span className="gradient-text">{niche.hero}</span></h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">{niche.sub}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={proto} onClick={() => track("cta_click", { cta: "industry_prototype", industry: niche.slug })} className="btn-primary-gradient inline-flex min-h-12 items-center gap-2 rounded-full px-6 py-3 text-base font-semibold text-white">
                <WandSparkles className="h-5 w-5" aria-hidden="true" /> Build a free {l?.ideaKind === "app" ? "app" : "website"} prototype
              </a>
              <a href={wa} target="_blank" rel="noopener noreferrer" onClick={() => waClick("hero")} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-border px-6 py-3 text-base font-semibold hover:border-[#25d366]">
                <MessageCircle className="h-5 w-5 text-[#25d366]" aria-hidden="true" /> WhatsApp us
              </a>
            </div>
            <button type="button" onClick={ask} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--emma-violet)] hover:underline">
              <Sparkles className="h-4 w-4" aria-hidden="true" /> Not sure what you need? Get a recommendation in 4 taps
            </button>
          </div>
          <aside className="lg-strong rounded-[26px] p-5" aria-label="Book a free call">
            <NextCallTimes source={`industry_${niche.slug}`} title="Talk to Emmanuel this week" fallback={
              <div>
                <p className="flex items-center gap-2 font-display font-semibold"><CalendarCheck className="h-5 w-5 text-[var(--emma-violet)]" aria-hidden="true" /> Free 30-minute strategy call</p>
                <p className="mt-2 text-sm text-muted-foreground">Pick a time that suits you. You'll get a confirmation email and a reminder.</p>
              </div>
            } />
            <Link to="/book" onClick={() => track("cta_click", { cta: "industry_book", industry: niche.slug })} className="btn-gold mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-5 font-semibold">See all times <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            {price && <p className="mt-4 text-center text-xs text-muted-foreground">{price.label} <strong className="text-foreground">{price.amount}</strong> · {price.note}</p>}
          </aside>
        </section>

        {/* Problems → fixes */}
        <section className="mx-auto mt-24 max-w-6xl px-5" aria-labelledby="ind-problems">
          <h2 id="ind-problems" className="text-center font-display text-3xl font-bold md:text-4xl"><KineticText text="Sound familiar?" base={30} /></h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {niche.problems.map((p: string, i: number) => (
              <li key={p} className="flex flex-col rounded-2xl border border-border bg-card p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">The problem</p>
                <p className="mt-1 font-display text-lg font-semibold">{p}</p>
                {l?.fixes[i] && (
                  <>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[var(--emma-violet)]">What we do</p>
                    <p className="mt-1 text-sm text-muted-foreground">{l.fixes[i]}</p>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Real client results (portfolio-data only) */}
        {projects.length > 0 && (
          <section className="mx-auto mt-24 max-w-6xl px-5" aria-labelledby="ind-results">
            <h2 id="ind-results" className="text-center font-display text-3xl font-bold md:text-4xl">Work for {industry} like yours</h2>
            <ul className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-2">
              {projects.map((p) => (
                <li key={p.name}>
                  <Link to="/portfolio/$slug" params={{ slug: p.slug }} className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition hover:border-[var(--emma-violet)]">
                    <p className="font-display text-3xl font-extrabold gradient-text">{p.outcome}</p>
                    <p className="mt-2 font-semibold">{p.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
                    <span className="mt-auto pt-4 text-sm font-semibold text-[var(--emma-violet)]">See the project →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Owner-controlled outcome line (registered claim) */}
        <ClaimGate id="niche-results">
          <section className="mx-auto mt-16 max-w-3xl px-5">
            <div className="rounded-3xl p-1" style={{ background: "var(--gradient-brand)" }}>
              <div className="rounded-[22px] bg-card p-8 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Average client outcome <ClaimTag id="niche-results" /></p>
                <p className="mt-3 font-display text-4xl font-extrabold gradient-text md:text-5xl">{niche.result}</p>
                <p className="mt-3 text-sm text-muted-foreground">Based on real data from our {industry} client roster.</p>
              </div>
            </div>
          </section>
        </ClaimGate>

        {/* How it works */}
        <section className="mx-auto mt-24 max-w-6xl px-5" aria-labelledby="ind-how">
          <h2 id="ind-how" className="text-center font-display text-3xl font-bold md:text-4xl">How it works</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-border bg-card p-6">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--emma-violet)] font-display font-bold text-white">{i + 1}</span>
                <p className="mt-4 font-display text-lg font-semibold">{s.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Services */}
        <section className="mx-auto mt-24 max-w-5xl px-5" aria-labelledby="ind-services">
          <h2 id="ind-services" className="text-center font-display text-3xl font-bold md:text-4xl">What we use for <span className="gradient-text">{industry}</span></h2>
          <ul className="mt-8 flex flex-wrap justify-center gap-3">
            {niche.services.map((s: string) => (
              <li key={s} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 font-semibold"><Check className="h-4 w-4 text-[var(--emma-violet)]" aria-hidden="true" /> {s}</li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        {l && (
          <section className="mx-auto mt-24 max-w-3xl px-5" aria-labelledby="ind-faq">
            <h2 id="ind-faq" className="text-center font-display text-3xl font-bold md:text-4xl">Questions {industry} ask us</h2>
            <div className="mt-8 space-y-3">
              {l.faqs.map((f) => (
                <details key={f.q} className="rounded-2xl border border-border bg-card p-5">
                  <summary className="cursor-pointer font-semibold">{f.q}</summary>
                  <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="mx-auto mt-24 max-w-5xl px-5">
          <div className="hero-ink grid gap-8 rounded-[28px] p-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center md:p-10">
            <div>
              <h2 className="font-display text-3xl font-bold text-white">Ready when you are</h2>
              <p className="mt-2 text-white/75">Start with a free prototype, a quick WhatsApp chat, or a free 30-minute call.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={proto} className="btn-primary-gradient inline-flex min-h-11 items-center gap-2 rounded-full px-5 font-semibold text-white"><WandSparkles className="h-4 w-4" aria-hidden="true" /> Free prototype</a>
                <a href={wa} target="_blank" rel="noopener noreferrer" onClick={() => waClick("footer")} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#25d366] px-5 font-semibold text-white"><MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp</a>
              </div>
            </div>
            <NextCallTimes source={`industry_${niche.slug}_footer`} tone="ink" fallback={
              <Link to="/book" className="btn-gold inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 font-semibold"><CalendarCheck className="h-4 w-4" aria-hidden="true" /> Book a free call</Link>
            } />
          </div>
        </section>

        {/* Other industries */}
        <section className="mx-auto mt-24 max-w-5xl px-5">
          <h3 className="text-center text-sm font-bold uppercase tracking-widest text-muted-foreground">We also serve</h3>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {NICHES.filter((n) => n.slug !== niche.slug).map((n) => (
              <Link key={n.slug} to="/niche/$slug" params={{ slug: n.slug }} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">{n.flag} {n.name}</Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
