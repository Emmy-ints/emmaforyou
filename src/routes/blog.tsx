import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const Route = createFileRoute("/blog")({
  component: BlogPage,
  head: () => ({
    meta: [
      { title: "Free Resources & Guides | EmmaForYou Blog" },
      { name: "description", content: "Free tips, guides, and strategies to grow your business — from Instagram growth to WhatsApp automation, ads, SEO and more." },
      { property: "og:title", content: "EmmaForYou Blog — Free Growth Resources" },
      { property: "og:description", content: "Tips and strategies from the EmmaForYou team. 100% free." },
    ],
  }),
});

const POSTS = [
  { title: "How to Get Your First 1,000 Instagram Followers in 30 Days", category: "Social Media", excerpt: "A repeatable framework we use for new client accounts — covering content cadence, hashtag strategy, engagement loops and the one daily action that compounds.", read: "8 min", date: "Apr 18, 2026", colors: ["#fde68a", "#f59e0b"] },
  { title: "Why Every Nigerian Business Needs a Website in 2026", category: "Web Design", excerpt: "Customers Google you before they trust you. If you don't show up, you don't exist. Here's why a website is no longer optional — and what makes one effective.", read: "6 min", date: "Apr 15, 2026", colors: ["#dbeafe", "#1e3a8a"] },
  { title: "The WhatsApp Automation System That Generated 47 Leads in a Week", category: "Automation", excerpt: "Step-by-step breakdown of the actual flow we built for a Lagos clinic — from welcome message to qualifying questions to booking confirmation.", read: "10 min", date: "Apr 10, 2026", colors: ["#dcfce7", "#16a34a"] },
  { title: "Facebook vs Instagram Ads: Which Works Better in Nigeria?", category: "Ads", excerpt: "We spent over $50k on both platforms across niches. Here are the niches where Facebook still wins, where Instagram dominates, and how to test cheaply.", read: "9 min", date: "Apr 5, 2026", colors: ["#e0e7ff", "#4338ca"] },
  { title: "How to Set Up Google My Business (Step-by-Step Guide)", category: "SEO", excerpt: "Local businesses live and die by their Google Business Profile. This walkthrough covers verification, photos, posts, Q&A, and the review strategy that doubles ratings.", read: "7 min", date: "Mar 28, 2026", colors: ["#fee2e2", "#dc2626"] },
  { title: "AI Automation Explained: What It Is and Why Your Business Needs It", category: "Automation", excerpt: "Stripped of the buzzwords. AI automation in 2026 means responding faster than humans, never forgetting a follow-up, and capturing every lead — 24/7.", read: "11 min", date: "Mar 22, 2026", colors: ["#fae8ff", "#a21caf"] },
  { title: "5 Signs Your Business Is Ready to Scale Digitally", category: "Strategy", excerpt: "Not every business is ready. Here are the five honest indicators that you'll get a strong return on digital investment — and the warning signs to fix first.", read: "5 min", date: "Mar 15, 2026", colors: ["#fce7f3", "#db2777"] },
  { title: "From Lagos to London: How Small Businesses Can Win Globally", category: "Strategy", excerpt: "Cross-border ecommerce, multi-currency checkout, international shipping and the marketing tactics that let a Lagos brand compete in London markets.", read: "8 min", date: "Mar 8, 2026", colors: ["#cffafe", "#0891b2"] },
];

function BlogPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="section-padding pt-32">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <h1 className="font-display text-4xl font-extrabold md:text-6xl">Free Resources to <span className="gradient-text">Grow Your Business</span></h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">Tips, guides, and strategies from the EmmaForYou team — 100% free, no email required.</p>
            </div>
            <div className="mt-14 grid gap-7 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {POSTS.map((p, i) => (
                <motion.article key={p.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: (i % 4) * 0.08 }} whileHover={{ y: -6 }}
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-xl">
                  <div className="relative aspect-[16/10]" style={{ background: `linear-gradient(135deg, ${p.colors[0]}, ${p.colors[1]})` }}>
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold backdrop-blur-sm">{p.category}</span>
                  </div>
                  <div className="p-5">
                    <h2 className="font-display text-base font-bold leading-snug group-hover:text-emma-blue transition-colors">{p.title}</h2>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-3">{p.excerpt}</p>
                    <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{p.date}</span>
                      <span className="font-semibold">📖 {p.read}</span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
