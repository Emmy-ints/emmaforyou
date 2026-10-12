import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { buildWa } from "@/lib/leads";
import GrowthOS from "../components/home/GrowthOS";
import { pageHead, breadcrumbLd, absoluteUrl, ORG_ID } from "@/lib/seo";

/**
 * Founder walkthrough video. Paste the YouTube video ID of Emmanuel's own recording here
 * (the part after "v=" in the YouTube link), plus its upload date. Until then the page shows
 * the interactive product demo instead. The previous embed was an unrelated third-party video.
 */
const FOUNDER_VIDEO: { youtubeId: string; uploadDate: string; durationIso: string } = { youtubeId: "", uploadDate: "", durationIso: "" };

const TITLE = "How the EmmaForYou Growth System Works — Audit, Foundation, Traffic, Scale";
const DESCRIPTION = "The four-step system EmmaForYou uses with clients: audit every channel, build the foundation (website, brand, automation), launch traffic, then scale what works.";

export const Route = createFileRoute("/watch")({
  component: WatchPage,
  head: () => {
    const base = pageHead({
      title: TITLE,
      description: DESCRIPTION,
      path: "/watch",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "How it works", path: "/watch" }])],
    });
    if (FOUNDER_VIDEO.youtubeId && FOUNDER_VIDEO.uploadDate) {
      base.scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "VideoObject",
          name: TITLE,
          description: DESCRIPTION,
          thumbnailUrl: `https://i.ytimg.com/vi/${FOUNDER_VIDEO.youtubeId}/hqdefault.jpg`,
          uploadDate: FOUNDER_VIDEO.uploadDate,
          ...(FOUNDER_VIDEO.durationIso ? { duration: FOUNDER_VIDEO.durationIso } : {}),
          embedUrl: `https://www.youtube.com/embed/${FOUNDER_VIDEO.youtubeId}`,
          url: absoluteUrl("/watch"),
          publisher: { "@id": ORG_ID },
        }),
      });
    }
    return base;
  },
});

function WatchPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-32 pb-24">
        <section className="mx-auto max-w-4xl px-5 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight md:text-6xl">How the EmmaForYou growth system works</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">Four steps we follow with every client: audit, foundation, traffic and scale. Below is a live demo of the kind of automation we build in step two.</p>
          </motion.div>

          <div className="mt-10 text-left">
            {FOUNDER_VIDEO.youtubeId ? (
              <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
                <div className="aspect-video w-full bg-black">
                  <iframe
                    title="Emmanuel explains the EmmaForYou growth system"
                    src={`https://www.youtube-nocookie.com/embed/${FOUNDER_VIDEO.youtubeId}?rel=0`}
                    className="h-full w-full"
                    loading="lazy"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : (
              <GrowthOS />
            )}
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
            <a href={buildWa("Hi! I just read how the EmmaForYou growth system works. I want to apply it to my business.")} target="_blank" rel="noopener noreferrer" className="btn-primary-gradient inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-white">Apply to my business →</a>
            <Link to="/intake" className="btn-ghost inline-flex items-center gap-2 rounded-full border border-border px-7 py-3.5 text-base font-semibold">Free strategy session</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}