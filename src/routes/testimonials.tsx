import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import VerifiedReviews from "../components/reviews/VerifiedReviews";
import { TESTIMONIALS } from "../components/TestimonialsPreview";
import { FEATURED, PROJECTS, projectSlug } from "@/lib/portfolio-data";
import { pageHead, breadcrumbLd } from "@/lib/seo";

export const Route = createFileRoute("/testimonials")({
  component: TestimonialsPage,
  head: () =>
    pageHead({
      title: "Client Testimonials and Results | EmmaForYou",
      description: "What clients in Nigeria, Ghana, South Africa, the USA, France and Germany say about working with EmmaForYou, plus verified reviews and real project results.",
      path: "/testimonials",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Testimonials", path: "/testimonials" }])],
    }),
});

// Only real content: portal-verified reviews (database), the owner's client testimonials (verbatim)
// and real project outcomes from portfolio-data. Never generate or pad testimonials.
const TYPES = ["All", ...Array.from(new Set(TESTIMONIALS.map((t) => t.biz)))];

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className="h-3.5 w-3.5" fill={s <= Math.round(rating) ? "#D4A017" : "#E5E7EB"} viewBox="0 0 20 20" aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function TestimonialsPage() {
  const [type, setType] = useState("All");
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const filtered = useMemo(
    () => TESTIMONIALS.filter((t) => (type === "All" || t.biz === type) && (!q || `${t.name} ${t.biz} ${t.loc} ${t.text}`.toLowerCase().includes(q))),
    [type, q],
  );

  return (
    <>
      <Navbar />
      <main>
        <section className="flex min-h-[36vh] items-center justify-center pt-20" style={{ background: "var(--gradient-dark)" }}>
          <div className="mx-auto max-w-4xl px-5 py-16 text-center">
            <h1 className="font-display text-4xl font-extrabold text-white md:text-6xl">
              Real Businesses. <span className="gradient-text-gold">Real Results.</span>
            </h1>
            <p className="mt-4 text-base text-white/60">What clients across Nigeria, Africa, the USA and Europe say about working with us.</p>
          </div>
        </section>

        <VerifiedReviews />

        <section className="section-padding" aria-labelledby="client-words">
          <div className="mx-auto max-w-7xl">
            <h2 id="client-words" className="font-display text-2xl font-semibold tracking-tight">In our clients' words</h2>
            <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
              <label className="sr-only" htmlFor="testimonial-search">Search testimonials</label>
              <input
                id="testimonial-search"
                type="search"
                placeholder="Search by name, business or city…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full border border-border bg-muted px-5 py-2.5 text-sm focus:border-emma-blue focus:outline-none md:max-w-sm"
              />
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by business type">
                {TYPES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={type === n}
                    onClick={() => setType(n)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${type === n ? "btn-primary-gradient text-white" : "bg-muted text-muted-foreground hover:bg-accent"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <p className="mt-8 text-sm text-muted-foreground">No testimonials match that search. <button type="button" className="font-semibold text-foreground underline" onClick={() => { setSearch(""); setType("All"); }}>Show all</button></p>
            ) : (
              <ul className="mt-8 columns-1 gap-5 sm:columns-2 lg:columns-3">
                {filtered.map((t) => {
                  const hue = (t.name.charCodeAt(0) * 15) % 360;
                  return (
                    <li key={t.name} className="mb-5 break-inside-avoid gradient-border rounded-2xl p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: `oklch(0.6 0.15 ${hue})` }} aria-hidden="true">{t.name[0]}</div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.biz} · {t.loc}</p>
                        </div>
                      </div>
                      <div className="mt-2"><Stars rating={t.rating} /></div>
                      <blockquote className="mt-3 text-sm leading-relaxed text-muted-foreground">“{t.text}”</blockquote>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section className="section-padding border-t border-border" aria-labelledby="results">
          <div className="mx-auto max-w-7xl">
            <h2 id="results" className="font-display text-2xl font-semibold tracking-tight">Results from client projects</h2>
            <p className="mt-2 text-sm text-muted-foreground">Each one links to the full case study.</p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PROJECTS.map((p) => {
                const featured = FEATURED.find((f) => f.client === p.name);
                return (
                  <li key={p.name}>
                    <Link to="/portfolio/$slug" params={{ slug: projectSlug(p.name) }} className="block h-full rounded-[20px] border border-border bg-card p-5 transition hover:border-[var(--emma-violet)]">
                      <p className="font-display text-xl font-semibold text-foreground">{featured ? `${featured.metric} ${featured.metricLabel}` : p.outcome}</p>
                      <p className="mt-1 text-sm font-semibold">{p.name} <span className="font-normal text-muted-foreground">· {p.category}</span></p>
                      <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link to="/book" className="btn-primary-gradient rounded-full px-6 py-3 text-sm font-semibold text-white">Book a free strategy call</Link>
              <Link to="/portfolio" className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground hover:border-[var(--emma-violet)]">See the portfolio</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
