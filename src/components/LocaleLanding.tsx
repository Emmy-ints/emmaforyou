import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import NewsletterSignup from "./NewsletterSignup";
import FutureOrb from "./future/FutureOrb";
import { KineticText } from "./future/Kinetic";
import { TESTIMONIALS } from "./TestimonialsPreview";
import { PROJECTS, projectSlug } from "@/lib/portfolio-data";
import { TIERS } from "@/lib/pricing-data";
import { WHATSAPP_URL, pageHead, breadcrumbLd, absoluteUrl, HOME_ALTERNATES, ORG_ID } from "@/lib/seo";
import { LOCALE_PAGES, type LocaleCode } from "@/lib/locale-pages";

export function localeHead(code: LocaleCode) {
  const c = LOCALE_PAGES[code];
  const path = `/${code}`;
  return pageHead({
    title: c.seoTitle,
    description: c.description,
    path,
    locale: c.ogLocale,
    alternates: HOME_ALTERNATES,
    jsonLd: [
      breadcrumbLd([{ name: "EmmaForYou", path: "/" }, { name: c.breadcrumb, path }]),
      { "@context": "https://schema.org", "@type": "WebPage", "@id": `${absoluteUrl(path)}#webpage`, url: absoluteUrl(path), name: c.seoTitle, description: c.description, inLanguage: code, about: { "@id": ORG_ID } },
      { "@context": "https://schema.org", "@type": "FAQPage", inLanguage: code, mainEntity: c.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    ],
  });
}

const fmt = (n: number, code: LocaleCode) => new Intl.NumberFormat(code === "fr" ? "fr-FR" : "de-DE", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export default function LocaleLanding({ code }: { code: LocaleCode }) {
  const c = LOCALE_PAGES[code];
  const work = c.work.map((w) => ({ ...w, p: PROJECTS.find((x) => x.name === w.project) })).filter((w) => w.p);
  const quote = TESTIMONIALS.find((t) => t.name === c.testimonialName);

  return (
    <div lang={code}>
      <Navbar />
      <main>
        <section className="hero-ink hero-x relative overflow-hidden" data-scroll>
          <div className="hero-ink-grid" aria-hidden="true" />
          <div className="hero-ink-glow" aria-hidden="true" />
          <div className="hero-x-horizon" aria-hidden="true" />
          <FutureOrb className="-right-44 top-10 z-0 w-[320px] opacity-40 sm:w-[440px] sm:opacity-60 lg:-right-16 lg:top-20 lg:w-[560px] lg:opacity-90" />
          <div className="hero-par-copy relative z-10 mx-auto max-w-6xl px-5 pb-20 pt-32 md:pt-40">
            <p className="hero-kicker"><span className="hero-kicker-dot" aria-hidden="true" />{c.eyebrow}</p>
            <h1 className="hero-ink-title max-w-4xl"><KineticText text={c.h1} /></h1>
            <p className="hero-ink-sub max-w-3xl">{c.intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/book" className="btn-primary-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white">{c.ctaBook}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hero-ghost-btn"><MessageCircle className="h-4 w-4" aria-hidden="true" />{c.ctaWhatsApp}</a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {c.trust.map((t) => <li key={t} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[var(--emma-violet)]" aria-hidden="true" />{t}</li>)}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20" aria-labelledby="loc-services">
          <h2 id="loc-services" className="font-display text-3xl font-semibold tracking-tight"><KineticText text={c.servicesTitle} base={40} /></h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{c.servicesIntro}</p>
          <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {c.services.map((s) => (
              <li key={s.slug} className="flex flex-col rounded-[20px] border border-border bg-card p-5 shadow-[var(--shadow-card)]" data-tilt="3">
                <h3 className="font-display text-lg font-semibold">{s.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
                <Link to="/services/$slug" params={{ slug: s.slug }} hrefLang="en" className="mt-auto pt-4 text-sm font-semibold text-[var(--emma-violet)]">{s.name} →</Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">{c.englishNote}</p>
        </section>

        <section className="bg-muted/50" aria-labelledby="loc-process">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 id="loc-process" className="font-display text-3xl font-semibold tracking-tight"><KineticText text={c.processTitle} base={40} /></h2>
            <ol className="loc-path mt-8 grid gap-4 md:grid-cols-4">
              {c.process.map((p, i) => <li key={p.title} className="lg rounded-[20px] p-5" style={{ ["--i" as string]: i }}><span className="ix-node mb-4" aria-hidden="true">{i + 1}</span><h3 className="font-display font-semibold">{p.title}</h3><p className="mt-2 text-sm text-muted-foreground">{p.text}</p></li>)}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20" aria-labelledby="loc-work">
          <h2 id="loc-work" className="font-display text-3xl font-semibold tracking-tight"><KineticText text={c.workTitle} base={40} /></h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{c.workIntro}</p>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {work.map(({ p, label }) => (
              <li key={p!.name} className="overflow-hidden rounded-[20px] border border-border bg-card shadow-[var(--shadow-card)]" data-tilt="3">
                <img src={p!.img} alt="" loading="lazy" className="h-40 w-full object-cover" />
                <div className="p-5">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <h3 className="mt-1 font-display text-lg font-semibold">{p!.name}</h3>
                  <p className="mt-2 inline-block rounded-full bg-muted px-3 py-1 text-sm font-semibold" lang="en">{p!.outcome}</p>
                  <Link to="/portfolio/$slug" params={{ slug: projectSlug(p!.name) }} hrefLang="en" className="mt-4 block text-sm font-semibold text-[var(--emma-violet)]">{c.viewProject} →</Link>
                </div>
              </li>
            ))}
          </ul>
          {quote && (
            <figure className="mt-10 max-w-3xl rounded-[22px] border border-border bg-card p-6">
              <figcaption className="text-xs text-muted-foreground">{c.testimonialNote}</figcaption>
              <blockquote className="mt-3 text-lg leading-relaxed text-foreground" lang="en">“{quote.text}”</blockquote>
              <p className="mt-3 text-sm font-semibold">{quote.name} <span className="font-normal text-muted-foreground">· {quote.biz}, {quote.loc}</span></p>
            </figure>
          )}
        </section>

        <section className="bg-muted/50" aria-labelledby="loc-pricing">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 id="loc-pricing" className="font-display text-3xl font-semibold tracking-tight"><KineticText text={c.pricingTitle} base={40} /></h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">{c.pricingIntro}</p>
            <ul className="mt-8 grid gap-4 md:grid-cols-4">
              {TIERS.map((t) => (
                <li key={t.name} className={`rounded-[20px] border bg-card p-5 ${t.popular ? "border-2 border-[var(--emma-violet)]" : "border-border"}`}>
                  <h3 className="font-display text-lg font-semibold">{t.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{c.tierAudience[t.name] ?? t.audience}</p>
                  <p className="mt-4 font-display text-2xl font-semibold">{t.custom ? c.customLabel : <>{fmt(t.monthly, code)} <span className="text-sm font-normal text-muted-foreground">{c.perMonth}</span></>}</p>
                </li>
              ))}
            </ul>
            <Link to="/pricing" hrefLang="en" className="mt-6 inline-block text-sm font-semibold text-[var(--emma-violet)]">{c.seePricing} →</Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20" aria-labelledby="loc-tools">
          <h2 id="loc-tools" className="font-display text-3xl font-semibold tracking-tight"><KineticText text={c.toolsTitle} base={40} /></h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {c.tools.map((t) => <li key={t.to}><Link to={t.to} className="block h-full rounded-[20px] border border-border bg-card p-5 shadow-[var(--shadow-card)] hover:border-[var(--emma-violet)]" data-tilt="4"><h3 className="font-display font-semibold">{t.name}</h3><p className="mt-2 text-sm text-muted-foreground">{t.text}</p></Link></li>)}
          </ul>
        </section>

        <section className="mx-auto max-w-3xl px-5 pb-20" aria-labelledby="loc-faq">
          <h2 id="loc-faq" className="font-display text-3xl font-semibold tracking-tight"><KineticText text={c.faqTitle} base={40} /></h2>
          <div className="mt-6 space-y-3">
            {c.faqs.map((f) => (
              <details key={f.q} className="fq-details lg group rounded-[20px] p-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">{f.q}<span className="fq-icon" aria-hidden="true" /></summary><p className="mt-3 text-muted-foreground">{f.a}</p></details>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-12">
          <NewsletterSignup source={`locale:${code}`} language={code} variant="band" />
        </section>

        <section className="band-ink ms relative overflow-hidden" aria-labelledby="loc-final">
          <div className="ms-aurora" aria-hidden="true"><span /><span /><span /></div>
          <div className="relative mx-auto max-w-4xl px-5 py-20 text-center">
            <h2 id="loc-final" className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{c.finalTitle}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{c.finalText}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/book" className="btn-primary-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white">{c.ctaBook}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hero-ghost-btn"><MessageCircle className="h-4 w-4" aria-hidden="true" />{c.ctaWhatsApp}</a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
