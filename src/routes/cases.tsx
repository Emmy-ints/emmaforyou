import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BookOpen } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { FEATURED, PORTFOLIO_FILTERS, PROJECTS, projectSlug } from "@/lib/portfolio-data";
import { pageHead, breadcrumbLd, itemListLd } from "@/lib/seo";

export const Route = createFileRoute("/cases")({
  component: CasesPage,
  head: () =>
    pageHead({
      title: "Case Studies: Real Client Results | EmmaForYou",
      description: "Real EmmaForYou client projects in Nigeria, the USA, Europe and Africa: the challenge, what we built and the result. Filter by type of work.",
      path: "/cases",
      jsonLd: [
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Case studies", path: "/cases" }]),
        itemListLd("EmmaForYou case studies", PROJECTS.map((p) => ({ name: p.name, path: `/portfolio/${projectSlug(p.name)}` }))),
      ],
    }),
});

// Real client work only (portfolio-data, verbatim). Detailed stories are written by the owner in
// /dashboard and published to case_studies; never generate or pad case studies.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };
const FILTERS = PORTFOLIO_FILTERS.filter((f) => f === "All" || PROJECTS.some((p) => p.category === f));

function CasesPage() {
  const [filter, setFilter] = useState("All");
  const [full, setFull] = useState<Set<string>>(new Set());
  useEffect(() => {
    db.from("case_studies").select("slug").eq("published", true)
      .then(({ data }: { data: { slug: string }[] | null }) => setFull(new Set((data || []).map((r) => r.slug))))
      .catch(() => undefined);
  }, []);
  const shown = useMemo(() => PROJECTS.filter((p) => filter === "All" || p.category === filter), [filter]);

  return (
    <>
      <Navbar />
      <main>
        <section className="flex min-h-[36vh] items-center justify-center pt-20" style={{ background: "var(--gradient-dark)" }}>
          <div className="mx-auto max-w-4xl px-5 py-16 text-center">
            <h1 className="font-display text-4xl font-extrabold text-white md:text-6xl">
              Case Studies: <span className="gradient-text-gold">Real Client Results</span>
            </h1>
            <p className="mt-4 text-base text-white/60">{PROJECTS.length} client projects across Nigeria, Africa, the USA and Europe.</p>
          </div>
        </section>

        <section className="section-padding">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by type of work">
              {FILTERS.map((f) => (
                <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${filter === f ? "btn-primary-gradient text-white" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                  {f}
                </button>
              ))}
            </div>

            <h2 className="sr-only">Case studies</h2>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((p) => {
                const slug = projectSlug(p.name);
                const featured = FEATURED.find((f) => f.client === p.name);
                return (
                  <li key={p.name}>
                    <Link to="/portfolio/$slug" params={{ slug }} className="gradient-border flex h-full flex-col rounded-2xl p-6 transition hover:-translate-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-emma-blue/10 px-3 py-1 text-xs font-medium text-emma-blue">{p.category}</span>
                        {full.has(slug) && <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"><BookOpen className="h-3.5 w-3.5" aria-hidden="true" />Full story</span>}
                      </div>
                      <h3 className="mt-3 font-display text-lg font-bold text-foreground">{p.name}</h3>
                      {featured && <p className="text-xs text-muted-foreground">{featured.niche}</p>}
                      <p className="mt-3 font-display text-2xl font-bold text-foreground">{featured ? `${featured.metric} ${featured.metricLabel}` : p.outcome}</p>
                      <p className="mt-2 flex-1 text-sm text-muted-foreground">{featured ? featured.desc : p.desc}</p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {p.stack.map((s) => <span key={s} className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">{s}</span>)}
                      </div>
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-foreground">Read the case study<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-12 rounded-[24px] border border-border bg-card p-8 text-center">
              <h2 className="font-display text-2xl font-semibold">Want results like these for your business?</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">Book a free strategy call, or get a free audit of your website first.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link to="/book" className="btn-primary-gradient rounded-full px-6 py-3 text-sm font-semibold text-white">Book a free strategy call</Link>
                <Link to="/website-audit" className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground hover:border-[var(--emma-violet)]">Free website audit</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
