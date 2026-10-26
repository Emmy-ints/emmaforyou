import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { listBlogPosts } from "@/lib/blog-server";
import { pageHead, breadcrumbLd } from "@/lib/seo";

export const Route = createFileRoute("/blog/")({
  component: BlogPage,
  loader: () => listBlogPosts(),
  head: () =>
    pageHead({
      title: "Blog — Practical Growth Tips for Small Businesses | EmmaForYou",
      description: "Practical tips on Instagram growth, WhatsApp automation, ads, SEO, email and websites from the EmmaForYou team.",
      path: "/blog",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }])],
    }),
});

function BlogPage() {
  const POSTS = Route.useLoaderData();
  return (
    <>
      <Navbar />
      <main id="main-content">
        <section className="section-padding pt-32">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <h1 className="font-display text-4xl font-extrabold md:text-6xl">Free Resources to <span className="gradient-text">Grow Your Business</span></h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">Tips, guides, and strategies from the EmmaForYou team — 100% free, no email required.</p>
            </div>
            <div className="mt-14 grid gap-7 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {POSTS.map((p, i) => (
                <motion.div key={p.slug} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: (i % 4) * 0.08 }} whileHover={{ y: -6 }}
                  className="group">
                  <Link to="/blog/$slug" params={{ slug: p.slug }} className="block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-xl">
                    <div className="relative flex aspect-[16/10] items-center justify-center text-5xl" style={{ background: `linear-gradient(135deg, ${p.cover.from}, ${p.cover.to})` }}>
                      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold text-foreground backdrop-blur-sm">{p.category}</span>
                      <span aria-hidden>{p.cover.emoji}</span>
                    </div>
                    <div className="p-5">
                      <h2 className="font-display text-base font-bold leading-snug text-foreground transition-colors group-hover:text-emma-blue">{p.title}</h2>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-3">{p.excerpt}</p>
                      <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{p.date}</span>
                        <span className="font-semibold">📖 {p.read}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
