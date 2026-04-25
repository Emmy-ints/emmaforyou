import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { NICHES, getNiche } from "@/lib/niches";
import { buildWa } from "@/lib/leads";

export const Route = createFileRoute("/niche/$slug")({
  component: NichePage,
  loader: ({ params }) => {
    const niche = getNiche(params.slug);
    if (!niche) throw notFound();
    return { niche };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background"><Navbar /><div className="pt-40 text-center"><h1 className="font-display text-3xl font-bold">Niche not found</h1><Link to="/" className="mt-4 inline-block text-sm underline">Go home</Link></div></div>
  ),
  head: ({ loaderData }) => ({
    meta: loaderData ? [
      { title: `${loaderData.niche.name} Growth — ${loaderData.niche.hero} | EmmaForYou` },
      { name: "description", content: loaderData.niche.sub },
      { property: "og:title", content: `${loaderData.niche.name} — ${loaderData.niche.hero}` },
      { property: "og:description", content: loaderData.niche.sub },
    ] : [],
  }),
});

function NichePage() {
  const { niche } = Route.useLoaderData();
  const wa = buildWa(`Hi! I run a ${niche.name.toLowerCase()} business and I want to grow with EmmaForYou. Can we talk?`);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-32 pb-24">
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-5 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground">{niche.flag} For {niche.name}</span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight md:text-7xl">
              <span className="gradient-text">{niche.hero}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">{niche.sub}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-primary-gradient inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-white">Talk to us on WhatsApp →</a>
              <Link to="/intake" className="btn-ghost inline-flex items-center gap-2 rounded-full border border-border px-7 py-3.5 text-base font-semibold">Free strategy session</Link>
            </div>
          </motion.div>
        </section>

        {/* Pain points */}
        <section className="mx-auto mt-24 max-w-5xl px-5">
          <h2 className="text-center font-display text-3xl font-bold md:text-4xl">Sound familiar?</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {niche.problems.map((p) => (
              <div key={p} className="rounded-2xl border border-border bg-card p-6 text-center">
                <div className="text-3xl">😩</div>
                <p className="mt-3 font-medium">{p}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Services */}
        <section className="mx-auto mt-24 max-w-5xl px-5">
          <h2 className="text-center font-display text-3xl font-bold md:text-4xl">Here's what we do for <span className="gradient-text">{niche.name.toLowerCase()}</span></h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {niche.services.map((s, i) => (
              <motion.div key={s} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: "var(--gradient-hero-cta)" }}>✓</div>
                <p className="mt-4 font-display font-bold">{s}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Result */}
        <section className="mx-auto mt-24 max-w-3xl px-5">
          <div className="rounded-3xl p-1" style={{ background: "var(--gradient-brand)" }}>
            <div className="rounded-[22px] bg-card p-10 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Average client outcome</p>
              <p className="mt-3 font-display text-5xl font-extrabold gradient-text">{niche.result}</p>
              <p className="mt-3 text-sm text-muted-foreground">Based on real data from our {niche.name.toLowerCase()} client roster.</p>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-primary-gradient mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white">Get my growth plan →</a>
            </div>
          </div>
        </section>

        {/* Other niches */}
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