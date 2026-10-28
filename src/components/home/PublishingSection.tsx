import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Palette, Image as ImageIcon, PenLine, Rocket } from "lucide-react";
import SectionHead from "../future/SectionHead";
import { PUBLISHING_FAQS, PUBLISHING_SERVICES, PUBLISHING_TOOLS } from "@/lib/publishing-data";

const STEPS = [
  { icon: BookOpen, title: "Create & format", body: "Paste or upload your manuscript; chapters, contents page and typography are set up for you.", to: "/publishing/ebook-creator", cta: "eBook creator" },
  { icon: Palette, title: "Design the cover", body: "Cover concepts for your genre, sized for eBook stores and paperback wraps.", to: "/publishing/cover-designer", cta: "Cover designer" },
  { icon: ImageIcon, title: "Mockups & graphics", body: "3D books, device shots and launch posts built from your actual cover.", to: "/publishing/mockups", cta: "Mockup generator" },
  { icon: PenLine, title: "Describe & position", body: "Book description, tagline, author bio, keywords and categories within platform rules.", to: "/publishing/book-marketing", cta: "Marketing assistant" },
  { icon: Rocket, title: "Launch & market", body: "A dated launch plan, email outline and content calendar — then ongoing marketing.", to: "/publishing/launch-planner", cta: "Launch planner" },
];

/** Concept covers drawn with CSS: illustrative demos of styles, never presented as client work. */
const CONCEPTS = [
  { cls: "pbx-c1", kicker: "A NOVEL", title: "The River Remembers", author: "Concept author", genre: "Literary fiction" },
  { cls: "pbx-c2", kicker: "THE 90-DAY", title: "Growth Playbook", author: "Concept author", genre: "Business" },
  { cls: "pbx-c3", kicker: "", title: "Midnight in Lagos", author: "Concept author", genre: "Thriller" },
];

/**
 * Homepage: the eBook publishing & book marketing offer. Workflow, a labelled concept showcase,
 * the free book tools, the services, FAQs and three calls to action.
 */
export default function PublishingSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="publishing" className="pbx section-padding" aria-labelledby="pbx-h">
      <div className="mx-auto max-w-7xl">
        <SectionHead id="pbx-h" kicker="eBook publishing & book marketing" title="From Manuscript to a Book Readers Can Find" shine={["Readers", "Find"]}
          sub="eBook creation and conversion, manuscript formatting, cover design, 3D mockups, listing copy, launch planning and book marketing — with free tools to start yourself and a team to finish it with you. You publish under your own name and keep your rights." className="max-w-3xl" />

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/publishing/ebook-creator" className="btn-gold inline-flex items-center gap-2 rounded-full px-6 py-3 text-[15px]" data-track="home_pub_create">Create Your Book <ArrowRight className="h-4 w-4" /></Link>
          <Link to="/services/$slug" params={{ slug: "ebook-publishing" }} className="nav-ghost h-auto px-6 py-3" data-track="home_pub_services">Explore Publishing Services</Link>
          <Link to="/expertise/$slug" params={{ slug: "book-marketing" }} className="nav-ghost h-auto px-6 py-3" data-track="home_pub_market">Market Your Book</Link>
        </div>

        {/* Workflow */}
        <ol className="pbx-flow mt-14" aria-label="How a book comes together">
          {STEPS.map((s, i) => (
            <li key={s.title} className="pbx-step lg" style={{ ["--i" as string]: i }} data-tilt="3">
              <span className="pbx-step-n" aria-hidden="true">{i + 1}</span>
              <s.icon className="h-5 w-5 text-[color:var(--pb)]" aria-hidden="true" />
              <h3 className="mt-3 font-display text-base font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              <Link to={s.to} className="pbx-step-link">{s.cta} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
            </li>
          ))}
        </ol>

        {/* Showcase */}
        <div className="pbx-show mt-16 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center">
          <figure className="pbx-stage lg" aria-labelledby="pbx-show-cap">
            <div className="pbx-covers">
              {CONCEPTS.map((c, i) => (
                <div key={c.title} className={`pbx-book ${c.cls}`} style={{ ["--i" as string]: i }} role="img" aria-label={`Concept cover: ${c.title} (${c.genre})`}>
                  <span className="pbx-spine" aria-hidden="true" />
                  <span className="pbx-face" aria-hidden="true">
                    {c.kicker && <small>{c.kicker}</small>}
                    <strong>{c.title}</strong>
                    <em>{c.author}</em>
                  </span>
                </div>
              ))}
            </div>
            <div className="pbx-extras" aria-hidden="true">
              <div className="pbx-page"><b>Chapter 1</b><i /><i /><i /><i /><i className="s" /><i /><i /><i className="s" /></div>
              <div className="pbx-phone"><span className="pbx-phone-screen pbx-c1"><strong>The River Remembers</strong></span></div>
              <div className="pbx-social"><span>Out now</span><strong>Midnight in Lagos</strong><em>“A city that never sleeps keeps its secrets.”</em></div>
            </div>
            <figcaption id="pbx-show-cap" className="pbx-label">Concept examples: covers, a formatted interior page, a phone mockup and a launch graphic, made to show the styles our tools and designers produce. Not client work.</figcaption>
          </figure>
          <div>
            <h3 className="font-display text-2xl font-semibold tracking-tight">Free book tools, real files</h3>
            <p className="mt-3 text-muted-foreground">Every tool works before you sign up. A free account lets you download the finished files and keep your projects in your author workspace.</p>
            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {PUBLISHING_TOOLS.map((t) => (
                <li key={t.slug}>
                  <Link to={`/publishing/${t.slug}`} className="pbx-tool" data-track={`home_pub_tool_${t.slug}`}>
                    <span className="text-lg" aria-hidden="true">{t.icon}</span>
                    <span><span className="block text-sm font-semibold">{t.name}</span><span className="block text-xs text-muted-foreground">{t.get}</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Services preview + FAQ */}
        <div className="mt-16 grid gap-10 lg:grid-cols-2">
          <div>
            <h3 className="font-display text-2xl font-semibold tracking-tight">Publishing services</h3>
            <p className="mt-3 text-muted-foreground">Bring us in for any part of the journey. Fixed quote after a free call; no share of your royalties.</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {PUBLISHING_SERVICES.map((s) => (
                <li key={s.slug}>
                  <Link to={s.slug === "ebook-publishing" ? "/services/ebook-publishing" : `/expertise/${s.slug}`} className="svx-related lg h-full" data-tilt="3">
                    <span className="font-display font-semibold">{s.label}</span>
                    <span className="mt-1 text-sm text-muted-foreground">{s.short}</span>
                    <ArrowRight className="svx-related-arrow h-4 w-4" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
            <Link to="/publishing/enquiry" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--emma-violet)] hover:underline underline-offset-4" data-track="home_pub_enquiry">
              Discuss my book project <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div>
            <h3 className="font-display text-2xl font-semibold tracking-tight">Questions authors ask</h3>
            <div className="mt-6 space-y-3">
              {PUBLISHING_FAQS.map((f, i) => (
                <div key={f.q} className={`fq-item lg ${open === i ? "is-open" : ""}`}>
                  <h4>
                    <button id={`pub-faq-q-${i}`} onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} aria-controls={`pub-faq-${i}`} className="fq-q">
                      <span className="font-display text-base font-semibold">{f.q}</span>
                      <span className="fq-icon" aria-hidden="true" />
                    </button>
                  </h4>
                  <div id={`pub-faq-${i}`} role="region" aria-labelledby={`pub-faq-q-${i}`} className="acc-panel" data-open={open === i} inert={open !== i}>
                    <div><p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
