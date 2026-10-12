import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { buildWa } from "@/lib/leads";

export const Route = createFileRoute("/watch")({
  component: WatchPage,
  head: () => ({
    meta: [
      { title: "Watch: How We 3x Businesses in 90 Days | EmmaForYou" },
      { name: "description", content: "Watch our founder break down the exact 4-step system used to triple revenue for 1,200+ businesses worldwide." },
      { property: "og:title", content: "Watch the EmmaForYou Growth System" },
      { property: "og:description", content: "Free 12-minute breakdown of our proven 4-step system." },
    ],
  }),
});

function WatchPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-32 pb-24">
        <section className="mx-auto max-w-4xl px-5 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground">12-minute breakdown · Free</span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-6xl">How we <span className="gradient-text">3x businesses</span> in 90 days</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">The exact 4-step system used by 1,200+ businesses worldwide — broken down by our founder Emmanuel in 12 minutes.</p>
          </motion.div>

          <div className="mt-10 overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
            <div className="aspect-video w-full bg-black">
              <iframe
                title="EmmaForYou Growth System"
                src="https://www.youtube.com/embed/Tn6-PIqc4UM?rel=0"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {[
              { n: "1", t: "Audit", d: "We assess every digital channel" },
              { n: "2", t: "Foundation", d: "Website, brand, automation in week 2" },
              { n: "3", t: "Traffic", d: "Paid ads + content engine launches" },
              { n: "4", t: "Scale", d: "We double down on what's working" },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-border bg-card p-5 text-left">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: "var(--gradient-hero-cta)" }}>{s.n}</div>
                <p className="mt-4 font-display text-lg font-bold">{s.t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a href={buildWa("Hi! I just watched the 12-min video. I want to apply this to my business.")} target="_blank" rel="noopener noreferrer" className="btn-primary-gradient inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-white">Apply to my business →</a>
            <Link to="/intake" className="btn-ghost inline-flex items-center gap-2 rounded-full border border-border px-7 py-3.5 text-base font-semibold">Free strategy session</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}