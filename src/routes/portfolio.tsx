import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import fashionImg from "../assets/portfolio-fashion.jpg";
import realestateImg from "../assets/portfolio-realestate.jpg";
import clinicImg from "../assets/portfolio-clinic.jpg";

export const Route = createFileRoute("/portfolio")({
  component: PortfolioPage,
  head: () => ({
    meta: [
      { title: "Portfolio — Real Work, Real Results | EmmaForYou" },
      { name: "description", content: "Explore websites, social media transformations, ad creatives and AI automation systems we've built for fashion stores, clinics, restaurants, real estate agents and more across 3 continents." },
      { property: "og:title", content: "Portfolio — EmmaForYou Work Samples" },
      { property: "og:description", content: "Real websites. Real results. Real transformations." },
      { property: "og:image", content: fashionImg },
    ],
  }),
});

const FILTERS = ["All", "Websites", "Ecommerce", "Social Media", "Ads", "Automation", "Branding"];

const FEATURED = [
  { img: fashionImg, client: "Lagos Couture", niche: "Fashion · Lagos, Nigeria 🇳🇬", tags: ["Website", "Ecommerce", "Social Media"], metric: "+312%", metricLabel: "website traffic", desc: "Full ecommerce rebuild on Shopify with integrated WhatsApp checkout. Brand refresh, professional product photography, and Instagram strategy." },
  { img: realestateImg, client: "Maryland Premier Properties", niche: "Real Estate · Hanover, USA 🇺🇸", tags: ["Website", "Ads", "CRM"], metric: "47", metricLabel: "new qualified leads / month", desc: "Lead-gen optimised website + Google & Meta ad campaigns + automated WhatsApp follow-up sequence for cold leads." },
  { img: clinicImg, client: "Wellness Clinic Halle", niche: "Healthcare · Halle, Germany 🇩🇪", tags: ["Website", "Automation", "Reviews"], metric: "86", metricLabel: "new Google reviews", desc: "Online booking system with auto-confirmation, smart reminder flows that cut no-shows by 60%, and a Google Business Profile that ranks #1 locally." },
];

const NICHES = [
  { name: "Lagos Couture", desc: "Bold ecommerce rebuild for a Lagos fashion house — Shopify, WhatsApp checkout, ad-ready product feed.", category: "Ecommerce", url: "lagoscouture.com", img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=70", stack: ["Shopify", "Klaviyo", "Meta Ads"], outcome: "+312% traffic" },
  { name: "Maryland Premier Properties", desc: "Lead-gen funnel + automated WhatsApp follow-up for a US real estate team.", category: "Websites", url: "marylandhomes.us", img: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=70", stack: ["Webflow", "HubSpot", "Twilio"], outcome: "47 leads/mo" },
  { name: "Spice Restaurant", desc: "Reservations, menu showcase and local SEO for a restaurant in Halle.", category: "Websites", url: "spicerestaurant.com", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=70", stack: ["Next.js", "Stripe", "GBP"], outcome: "65% more bookings" },
  { name: "Wellness Clinic Halle", desc: "Booking system + automated reminders + Google review automation for a Berlin clinic.", category: "Automation", url: "wellnessclinic.de", img: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=70", stack: ["Make.com", "Calendly", "WhatsApp API"], outcome: "60% less no-shows" },
  { name: "Scale Up Coach", desc: "High-ticket coaching funnel with VSL, scheduler and email sequence.", category: "Websites", url: "scaleupcoach.com", img: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=70", stack: ["Framer", "Stripe", "ConvertKit"], outcome: "3.5x audience" },
  { name: "Autohaus Halle", desc: "Inventory listing site + lead-capture campaign for a German auto dealer.", category: "Ecommerce", url: "autohaus-halle.de", img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=70", stack: ["Astro", "Cloudinary", "Google Ads"], outcome: "3x test drives" },
  { name: "Glow Salon", desc: "Brand refresh + booking system + Instagram content engine for a Lagos beauty salon.", category: "Branding", url: "glowsalon.ng", img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=70", stack: ["Canva", "Fresha", "Instagram"], outcome: "2x bookings" },
  { name: "Cape Fitness", desc: "Member onboarding + retention sequences for a Cape Town gym chain.", category: "Social Media", url: "capefitness.za", img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=70", stack: ["Mailchimp", "Glofox", "Reels"], outcome: "+38% retention" },
  { name: "Bright Academy", desc: "Enrolment funnel + parent comms automation for a Ghanaian school.", category: "Automation", url: "brightschool.gh", img: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=70", stack: ["Notion", "Make.com", "WhatsApp"], outcome: "+40% enrolments" },
  { name: "Boutique Hotel Paris", desc: "Direct booking site that beats OTAs on conversion and brand feel.", category: "Ecommerce", url: "boutiquehotel.fr", img: "https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=1200&q=70", stack: ["Sanity", "Stripe", "i18n"], outcome: "+45% direct" },
  { name: "Kitchen.ng", desc: "WhatsApp-first ordering for a Lagos cloud kitchen.", category: "Ecommerce", url: "kitchen.com.ng", img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=70", stack: ["Paystack", "Twilio", "Vercel"], outcome: "+212% orders" },
  { name: "Courses London", desc: "Course launch site for a London-based business coach.", category: "Websites", url: "courses.london", img: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=70", stack: ["Teachable", "Stripe", "Webflow"], outcome: "5x launch revenue" },
];

const VIDEOS = [
  { title: "Fashion Store — Instagram Strategy Breakdown", duration: "2:34", category: "Social Media" },
  { title: "Clinic WhatsApp Automation Demo", duration: "3:12", category: "Automation" },
  { title: "Real Estate Lead Gen — 30 Day Results", duration: "4:05", category: "Ads" },
  { title: "Restaurant Facebook Ads — From $0 to Booked", duration: "2:48", category: "Ads" },
  { title: "Ecommerce Shopify Redesign — Before & After", duration: "5:20", category: "Websites" },
  { title: "AI Auto-Reply in 3 Seconds — Live Demo", duration: "1:45", category: "Automation" },
];

const SOCIAL_BEFORE_AFTER = [
  { name: "Lagos Couture (Instagram)", before: "800 followers · random posts", after: "12,000 followers · branded feed", color: "#f59e0b" },
  { name: "Maryland Properties (Instagram)", before: "Sporadic listings", after: "Consistent property reels", color: "#1e3a8a" },
  { name: "Spice Restaurant (Facebook)", before: "No photos · empty page", after: "Daily food photos · 4.8★ reviews", color: "#dc2626" },
  { name: "Scale Up Coach (LinkedIn)", before: "Empty profile", after: "Thought leader · 8k followers", color: "#0891b2" },
];

const ADS = [
  { headline: "Tired of slow website sales?", body: "Get a brand new ecommerce store in 14 days. Built to convert.", cta: "Get Your Free Quote", stats: "CTR 4.2% · ROAS 6.8x", niche: "Fashion" },
  { headline: "Sell faster on WhatsApp", body: "Auto-reply, capture leads, and close sales 24/7 with AI automation.", cta: "Start Free Trial", stats: "CTR 5.1% · CPC $0.34", niche: "Real Estate" },
  { headline: "Get more 5★ Google reviews", body: "Our system asks every happy customer automatically. Watch your rating climb.", cta: "Book a Demo", stats: "CTR 3.8% · ROAS 5.2x", niche: "Clinic" },
  { headline: "Fully booked every weekend", body: "We turn restaurants into local destinations using Meta ads + booking automation.", cta: "Get a Plan", stats: "CTR 4.6% · CPC $0.41", niche: "Restaurant" },
  { headline: "From $1k to $10k months", body: "We rebuilt their store, ran ads, and automated everything. Results in 60 days.", cta: "Apply Now", stats: "CTR 5.3% · ROAS 7.1x", niche: "Ecommerce" },
  { headline: "Coaches: Fill your calendar", body: "Done-for-you funnel + paid ads. We book your discovery calls. You close.", cta: "See How It Works", stats: "CTR 4.9% · ROAS 6.4x", niche: "Coach" },
];

const AUTOMATIONS = [
  { title: "WhatsApp Auto-Reply Flow", desc: "Capture leads, qualify them, book appointments — all automatically.", metric: "47% more conversions", emoji: "💬" },
  { title: "Welcome → Nurture → Convert email sequence", desc: "5-step automated flow that turns subscribers into buyers.", metric: "32% open rate", emoji: "📧" },
  { title: "Lead capture form → CRM", desc: "Every form submission instantly creates a CRM record + WhatsApp alert.", metric: "100% lead retention", emoji: "📋" },
  { title: "Google Business Profile optimisation", desc: "Reviews automation + post scheduling + Q&A management.", metric: "#1 local rank", emoji: "📍" },
  { title: "Shopify dashboard scaling", desc: "Cart abandonment recovery + upsell automation = bigger orders.", metric: "+38% AOV", emoji: "🛍️" },
];

function BrowserFrame({ children, url, dotColors = ["#ef4444", "#f59e0b", "#22c55e"] }: any) {
  return (
    <div className="overflow-hidden rounded-xl border border-border shadow-lg">
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
        {dotColors.map((c: string, i: number) => <span key={i} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />)}
        <div className="ml-2 flex-1 truncate rounded-md bg-background px-2 py-1 text-[10px] text-muted-foreground">{url}</div>
      </div>
      {children}
    </div>
  );
}

function NicheMockup({ name, colors, url }: any) {
  return (
    <div className="relative h-44" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
      <div className="absolute inset-x-3 top-3 flex h-2 gap-2">
        <div className="w-12 rounded-full bg-white/40" />
        <div className="w-8 rounded-full bg-white/30" />
        <div className="w-8 rounded-full bg-white/30" />
        <div className="ml-auto w-10 rounded-full bg-white/50" />
      </div>
      <div className="absolute inset-x-6 top-12">
        <div className="h-3 w-3/4 rounded bg-white/70" />
        <div className="mt-2 h-2 w-1/2 rounded bg-white/50" />
      </div>
      <div className="absolute bottom-3 left-3 right-3 grid grid-cols-3 gap-1.5">
        <div className="h-10 rounded bg-white/40" />
        <div className="h-10 rounded bg-white/40" />
        <div className="h-10 rounded bg-white/40" />
      </div>
    </div>
  );
}

function PortfolioPage() {
  const [filter, setFilter] = useState("All");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  const filtered = NICHES.filter((n) => filter === "All" || n.category === filter);

  return (
    <>
      <Navbar />
      <main>
        <section className="section-padding pt-32">
          <div className="mx-auto max-w-7xl text-center">
            <h1 className="font-display text-4xl font-extrabold md:text-7xl">
              Our Work <span className="gradient-text">Speaks for Itself.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
              Real websites, real results, real transformations — built for businesses just like yours.
            </p>
            <div className="sticky top-20 z-30 mt-10 -mx-5 flex justify-center bg-background/80 px-5 py-3 backdrop-blur-md">
              <div className="flex flex-wrap justify-center gap-2">
                {FILTERS.map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                      filter === f ? "bg-emma-charcoal text-white shadow-md" : "border border-border bg-background hover:border-emma-blue"
                    }`}>{f}</button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured */}
        <section className="px-5 pb-20">
          <div className="mx-auto max-w-7xl space-y-12">
            {FEATURED.map((f, i) => (
              <motion.div key={f.client} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7 }}
                className={`grid items-center gap-8 md:grid-cols-2 ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}>
                <button onClick={() => setLightbox(f.img)} className="block">
                  <BrowserFrame url={f.client.toLowerCase().replace(/\s+/g, "") + ".com"}>
                    <img src={f.img} alt={f.client} loading="lazy" width={1280} height={800} className="block w-full object-cover" />
                  </BrowserFrame>
                </button>
                <div>
                  <div className="flex flex-wrap gap-2">
                    {f.tags.map((t) => <span key={t} className="rounded-full bg-emma-blue/10 px-3 py-1 text-xs font-bold text-emma-blue">{t}</span>)}
                  </div>
                  <h3 className="mt-4 font-display text-2xl font-extrabold md:text-3xl">{f.client}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.niche}</p>
                  <div className="mt-5 font-display text-5xl font-extrabold gradient-text md:text-6xl">{f.metric}</div>
                  <p className="text-sm font-semibold text-muted-foreground">{f.metricLabel}</p>
                  <p className="mt-4 text-base leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Gallery */}
        <section className="section-padding bg-muted/30">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-center font-display text-3xl font-extrabold md:text-5xl">Website Gallery</h2>
            <p className="mt-3 text-center text-base text-muted-foreground">12 recent builds across niches</p>
            <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((n, i) => (
                <motion.article
                  key={n.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 6) * 0.05, duration: 0.4 }}
                  whileHover={{ y: -6 }}
                  className="group flex flex-col"
                >
                  <BrowserFrame url={n.url}>
                    <img
                      src={n.img}
                      alt={`${n.name} project preview`}
                      loading="lazy"
                      className="block h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </BrowserFrame>
                  <div className="mt-4 flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-display text-base font-bold">{n.name}</p>
                      <span className="rounded-full bg-emma-blue/10 px-2 py-0.5 text-[10px] font-bold text-emma-blue">
                        {n.outcome}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{n.desc}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {n.stack.map((s) => (
                        <span key={s} className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {s}
                        </span>
                      ))}
                    </div>
                    <a
                      href={`https://${n.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emma-blue hover:underline"
                    >
                      View case study →
                    </a>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Videos */}
        <section className="section-padding">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-center font-display text-3xl font-extrabold md:text-5xl">Watch the Transformations 🎬</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {VIDEOS.map((v, i) => (
                <motion.button key={v.title} onClick={() => setVideo(v.title)}
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }} whileHover={{ scale: 1.02 }}
                  className="group relative flex h-56 items-center justify-center overflow-hidden rounded-2xl text-left"
                  style={{ background: "linear-gradient(135deg, oklch(0.13 0.03 280), oklch(0.3 0.1 270))" }}>
                  <div className="absolute inset-0 opacity-30" style={{
                    background: "radial-gradient(circle at 70% 50%, oklch(0.5 0.22 340), transparent 70%)"
                  }} />
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-2xl transition-transform group-hover:scale-110">
                    <span className="ml-1 text-xl text-emma-charcoal">▶</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm">{v.category}</span>
                    <p className="mt-2 font-display text-base font-bold">{v.title}</p>
                  </div>
                  <span className="absolute right-3 top-3 rounded-md bg-black/60 px-2 py-0.5 text-xs font-bold text-white">{v.duration}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </section>

        {/* Social before/after */}
        <section className="section-padding bg-muted/30">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center font-display text-3xl font-extrabold md:text-5xl">Social Media Transformations</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {SOCIAL_BEFORE_AFTER.map((s, i) => (
                <motion.div key={s.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
                  <div className="grid grid-cols-2 divide-x divide-border">
                    <div className="p-5">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Before</span>
                      <div className="mt-3 grid grid-cols-3 gap-1">
                        {Array.from({ length: 9 }).map((_, j) => (
                          <div key={j} className="aspect-square rounded bg-muted" />
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">{s.before}</p>
                    </div>
                    <div className="p-5">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: s.color }}>After</span>
                      <div className="mt-3 grid grid-cols-3 gap-1">
                        {Array.from({ length: 9 }).map((_, j) => (
                          <div key={j} className="aspect-square rounded" style={{
                            background: `linear-gradient(${(j * 40) % 360}deg, ${s.color}, ${s.color}80)`
                          }} />
                        ))}
                      </div>
                      <p className="mt-3 text-xs font-semibold" style={{ color: s.color }}>{s.after}</p>
                    </div>
                  </div>
                  <div className="border-t border-border p-4">
                    <p className="font-display text-sm font-bold">{s.name}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Ads */}
        <section className="section-padding">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-center font-display text-3xl font-extrabold md:text-5xl">Ad Creatives That Convert</h2>
            <p className="mt-3 text-center text-base text-muted-foreground">The exact ad style we run for clients — built to stop the scroll.</p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {ADS.map((ad, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
                  <div className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full" style={{ background: "var(--gradient-brand)" }} />
                      <div>
                        <p className="text-xs font-bold">EmmaForYou · Sponsored</p>
                        <p className="text-[10px] text-muted-foreground">{ad.niche}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm">{ad.body}</p>
                  </div>
                  <div className="aspect-video p-2">
                    <div className="flex h-full items-center justify-center rounded-2xl p-5 text-center" style={{
                      background: `linear-gradient(135deg, oklch(0.45 0.22 ${(i * 60) % 360}), oklch(0.6 0.2 ${((i * 60) + 60) % 360}))`
                    }}>
                      <p className="font-display text-lg font-extrabold leading-tight text-white">{ad.headline}</p>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <button className="w-full rounded-lg bg-emma-blue py-2 text-xs font-bold text-white">{ad.cta}</button>
                    <p className="mt-2 text-center text-[10px] font-bold text-muted-foreground">{ad.stats}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Automation */}
        <section className="section-padding bg-muted/30">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center font-display text-3xl font-extrabold md:text-5xl">AI Systems We've Built</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {AUTOMATIONS.map((a, i) => (
                <motion.div key={a.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-lg">
                  <div className="text-3xl">{a.emoji}</div>
                  <h3 className="mt-3 font-display text-lg font-bold">{a.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{a.desc}</p>
                  <div className="mt-4 inline-flex rounded-full bg-emma-blue/10 px-3 py-1 text-xs font-bold text-emma-blue">{a.metric}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-padding" style={{ background: "var(--gradient-brand)" }}>
          <div className="mx-auto max-w-3xl text-center text-white">
            <h2 className="font-display text-3xl font-extrabold md:text-5xl">Ready to See Your Business Here?</h2>
            <p className="mt-4 text-base opacity-90 md:text-lg">Every project in this portfolio started with a conversation. Let's talk about yours.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a href="https://wa.me/message/HHGMMWMRJFYUC1" target="_blank" rel="noopener noreferrer"
                className="rounded-full bg-white px-7 py-3.5 text-sm font-bold text-emma-charcoal shadow-xl">Start My Project →</a>
              <a href="/intake" className="rounded-full border-2 border-white/50 px-7 py-3.5 text-sm font-bold backdrop-blur-sm">Complete Intake Form →</a>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
            <button onClick={() => setLightbox(null)} className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-foreground">✕</button>
            <img src={lightbox} alt="" className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl" />
          </motion.div>
        )}
        {video && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setVideo(null)}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl rounded-2xl bg-card p-6 text-center" onClick={(e) => e.stopPropagation()}>
              <div className="aspect-video flex items-center justify-center rounded-xl bg-muted">
                <span className="text-4xl">▶ Video coming soon</span>
              </div>
              <h3 className="mt-4 font-display text-xl font-bold">{video}</h3>
              <button onClick={() => setVideo(null)} className="mt-4 rounded-full border border-border px-5 py-2 text-sm font-semibold">Close</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
