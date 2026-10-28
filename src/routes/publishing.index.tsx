import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SectionHead from "@/components/future/SectionHead";
import { KineticText } from "@/components/future/Kinetic";
import { Scene } from "@/components/ServicesSection";
import { PUBLISHING_FAQS, PUBLISHING_SERVICES, PUBLISHING_TOOLS } from "@/lib/publishing-data";
import { pageHead, breadcrumbLd, itemListLd } from "@/lib/seo";

export const Route = createFileRoute("/publishing/")({
  component: Hub,
  head: () =>
    pageHead({
      title: "eBook Publishing, Book Cover Design & Book Marketing | EmmaForYou",
      description: "Publishing support from manuscript to launch: eBook creation and conversion, cover design, 3D mockups, book descriptions and keywords, launch planning and book marketing, plus free book tools.",
      path: "/publishing",
      jsonLd: [
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Publishing", path: "/publishing" }]),
        itemListLd("Free book publishing tools", PUBLISHING_TOOLS.map((t) => ({ name: t.name, path: `/publishing/${t.slug}` }))),
        { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: PUBLISHING_FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
      ],
    }),
});

function Hub() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="svx sv-book">
        <section className="hero-ink svx-hero relative overflow-hidden">
          <div className="hero-ink-grid" aria-hidden="true" />
          <div className="hero-ink-glow" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-5 pb-20 pt-32 md:px-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)] lg:items-end lg:pt-40">
            <div>
              <nav aria-label="Breadcrumb" className="text-sm text-[#a6abd0]"><Link to="/" className="hover:text-white">Home</Link><span className="mx-2 opacity-50">/</span><span className="text-white">Publishing</span></nav>
              <h1 className="svc-title"><KineticText text="eBook Publishing, Cover Design & Book Marketing" base={70} /></h1>
              <p className="hero-ink-sub">From manuscript to a book readers can find: formatting and conversion, covers, mockups, listing copy, launch plans and marketing. Use the free tools yourself or work with us — you publish under your own name and keep your rights and royalties.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/publishing/ebook-creator" className="btn-gold inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[15px]">Create Your Book <ArrowRight className="h-4 w-4" /></Link>
                <Link to="/publishing/enquiry" className="hero-ghost-btn">Get Publishing Support</Link>
              </div>
            </div>
            <div className="svx-side"><div className="svx-scene sv-scene" aria-hidden="true"><Scene kind="book" /></div>
              <ul className="mt-5 space-y-2 text-sm text-[#c9ccec]">
                {["Real PDF, EPUB and Word files", "eBook covers and paperback wraps with spine and bleed", "Listing copy checked against KDP's rules", "No share of your royalties, no sales promises"].map((x) => <li key={x} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-[#3dd6f5]" aria-hidden="true" />{x}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section className="py-20"><div className="mx-auto max-w-6xl px-5 md:px-8">
          <SectionHead title="Free book tools" sub="Every tool works before you sign up. A free account lets you download finished files and save projects in your author workspace." className="mb-10 max-w-2xl" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{PUBLISHING_TOOLS.map((t) => (
            <li key={t.slug}><Link to={`/publishing/${t.slug}`} className="svx-related lg h-full" data-tilt="3">
              <span className="text-2xl" aria-hidden="true">{t.icon}</span>
              <span className="mt-2 font-display font-semibold">{t.name}</span>
              <span className="mt-1 text-sm text-muted-foreground">{t.does}</span>
              <span className="mt-3 text-xs text-muted-foreground"><strong className="text-foreground">Free:</strong> {t.free}. <strong className="text-foreground">Account:</strong> {t.account}.</span>
              <ArrowRight className="svx-related-arrow h-4 w-4" aria-hidden="true" />
            </Link></li>
          ))}</ul>
          <p className="mt-6 text-sm"><Link to="/account/books" className="font-semibold text-[color:var(--emma-violet)] underline-offset-4 hover:underline">Open my author workspace →</Link></p>
        </div></section>

        <section className="svx-alt py-20"><div className="mx-auto max-w-6xl px-5 md:px-8">
          <SectionHead title="Publishing services" sub="Bring us in for one part or the whole journey. Fixed quote after a free call." className="mb-10 max-w-2xl" />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{PUBLISHING_SERVICES.map((p) => (
            <li key={p.slug}><Link to={p.slug === "ebook-publishing" ? "/services/ebook-publishing" : `/expertise/${p.slug}`} className="svx-related lg h-full" data-tilt="3"><span className="font-display font-semibold">{p.label}</span><span className="mt-1 text-sm text-muted-foreground">{p.short}</span><ArrowRight className="svx-related-arrow h-4 w-4" aria-hidden="true" /></Link></li>
          ))}</ul>
          <p className="mt-6 text-sm text-muted-foreground">See labelled <Link to="/portfolio" hash="publishing-concepts" className="underline underline-offset-4">publishing concept examples</Link>, or read our guides: <Link to="/knowledge-base/$slug" params={{ slug: "ebook-formats-epub-pdf-docx" }} className="underline underline-offset-4">eBook formats</Link>, <Link to="/knowledge-base/$slug" params={{ slug: "ebook-vs-paperback-cover-specs" }} className="underline underline-offset-4">cover specs</Link>, <Link to="/knowledge-base/$slug" params={{ slug: "write-a-book-description-that-sells" }} className="underline underline-offset-4">book descriptions</Link>.</p>
        </div></section>

        <section className="py-20"><div className="mx-auto max-w-3xl px-5 md:px-8">
          <SectionHead title="Questions authors ask" className="mb-8" />
          <div className="space-y-3">{PUBLISHING_FAQS.map((f) => (
            <details key={f.q} className="fq-item lg group rounded-2xl"><summary className="fq-q cursor-pointer list-none"><span className="font-display text-base font-semibold">{f.q}</span><span className="fq-icon" aria-hidden="true" /></summary><p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p></details>
          ))}</div>
          <div className="mt-10 flex flex-wrap gap-3"><Link to="/publishing/enquiry" className="btn-gold inline-flex items-center gap-2 rounded-full px-6 py-3 text-[15px]">Discuss My Project <ArrowRight className="h-4 w-4" /></Link><Link to="/expertise/$slug" params={{ slug: "book-marketing" }} className="nav-ghost h-auto px-6 py-3">Market Your Book</Link></div>
        </div></section>
      </main>
      <Footer />
    </>
  );
}
