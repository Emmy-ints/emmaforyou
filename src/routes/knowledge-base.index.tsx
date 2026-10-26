import { createFileRoute, Link } from "@tanstack/react-router";
import { KineticText } from "@/components/future/Kinetic";
import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { listKnowledge } from "@/lib/knowledge-server";
import { pageHead, breadcrumbLd, itemListLd } from "@/lib/seo";

export const Route = createFileRoute("/knowledge-base/")({
  component: KbIndex,
  loader: () => listKnowledge(),
  head: ({ loaderData }) => {
    const KNOWLEDGE = loaderData ?? [];
    return pageHead({
      title: `Knowledge Base — ${KNOWLEDGE.length} Free Guides on Websites, SEO & Automation`,
      description: `${KNOWLEDGE.length} in-depth guides for business owners on websites, SEO, AI automation, social media, paid ads, email marketing and ecommerce. Free to read.`,
      path: "/knowledge-base",
      jsonLd: [
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Knowledge base", path: "/knowledge-base" }]),
        itemListLd("EmmaForYou knowledge base", KNOWLEDGE.map((a) => ({ name: a.title, path: `/knowledge-base/${a.slug}` }))),
      ],
    });
  },
});

const CATS = ["All", "Business Growth", "Website & SEO", "AI Automation", "Social Media", "Paid Advertising", "Email Marketing", "Ecommerce"];

function KbIndex() {
  const KNOWLEDGE = Route.useLoaderData();
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    return KNOWLEDGE.filter((a) => (cat === "All" || a.category === cat) && (q === "" || a.title.toLowerCase().includes(q.toLowerCase()) || a.excerpt.toLowerCase().includes(q.toLowerCase())));
  }, [KNOWLEDGE, cat, q]);
  const featured = KNOWLEDGE.filter((a) => a.featured).slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content" className="pt-32 pb-24">
        <section className="mx-auto max-w-6xl px-5">
          <div className="text-center">
            <span className="inline-block rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground">Knowledge Base · 48 articles</span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-6xl">Learn to grow — <span className="gradient-text">free</span></h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">In-depth, no-fluff guides written by practitioners who run real campaigns every day.</p>
            <div className="mx-auto mt-6 max-w-xl">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search articles..." className="w-full rounded-full border border-border bg-card px-5 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-foreground/20" />
            </div>
          </div>

          {/* Featured */}
          <div className="mt-14">
            <h2 className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground"><KineticText text="Featured this week" base={30} /></h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {featured.map((a) => (
                <Link key={a.slug} to="/knowledge-base/$slug" params={{ slug: a.slug }} className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <span className="inline-block rounded-full bg-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-background">Featured</span>
                  <h3 className="mt-3 font-display text-lg font-bold leading-tight group-hover:text-primary">{a.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{a.excerpt}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground"><span>{a.category}</span><span>·</span><span>{a.readMin} min</span></div>
                </Link>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="mt-14 flex flex-wrap gap-2">
            {CATS.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${cat === c ? "bg-foreground text-background" : "border border-border bg-card text-muted-foreground hover:text-foreground"}`}>{c}</button>
            ))}
          </div>

          {/* List */}
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => (
              <Link key={a.slug} to="/knowledge-base/$slug" params={{ slug: a.slug }} className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span>{a.category}</span><span>·</span><span>{a.difficulty}</span>
                </div>
                <h3 className="mt-2 font-display text-base font-bold leading-snug group-hover:text-primary">{a.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{a.excerpt}</p>
                <span className="mt-3 text-xs text-muted-foreground">{a.readMin} min read</span>
              </Link>
            ))}
            {filtered.length === 0 && <p className="col-span-full text-center text-sm text-muted-foreground">No articles match — try another search.</p>}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}