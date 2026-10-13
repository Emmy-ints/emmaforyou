import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { LayoutGroup, motion } from "framer-motion";
import {
  ArrowRight, ArrowLeftRight, BookOpen, Briefcase, Calculator, CalendarCheck, ClipboardList, Download, Gauge,
  HandCoins, HelpCircle, LayoutDashboard, ListChecks, Mail, MessageCircle, Newspaper, PlayCircle, Quote, Tag, WandSparkles,
  Bot, Globe2, Languages, Mic, Palette, FileSignature,
} from "lucide-react";
import { buildWa } from "@/lib/leads";

type Group = "try" | "learn" | "work" | "proof";

interface Tool {
  group: Group;
  icon: typeof WandSparkles;
  name: string;
  does: string;
  get: string;
  meta: string;
  cta: string;
  /** In-page anchor on the homepage, an app route, or an external link. */
  href: { hash: string } | { to: string } | { external: string } | { event: string };
}

const TOOLS: Tool[] = [
  // Try it now
  { group: "try", icon: Bot, name: "AI receptionist demo", does: "Chat with, or talk out loud to, an AI receptionist for a sample salon, clinic or restaurant. Ask prices, then book an appointment.", get: "A feel for how your customers would get instant replies and bookings 24/7.", meta: "Live demo · voice", cta: "Talk to it", href: { to: "/ai-receptionist" } },
  { group: "try", icon: Globe2, name: "AI website audit", does: "Enter your website address. We check speed on a phone (Google Lighthouse), SEO, contact buttons, trust and more.", get: "A score out of 100, a phone screenshot, the top 5 fixes and a downloadable PDF report.", meta: "Free · ~1 minute", cta: "Audit my website", href: { to: "/website-audit" } },
  { group: "try", icon: Palette, name: "AI website makeover", does: "Upload a screenshot of your website and watch AI redesign it live, keeping your business details.", get: "A before-and-after comparison and a redesign concept you can download.", meta: "Free · ~1 minute", cta: "Redesign my site", href: { to: "/makeover" } },
  { group: "try", icon: FileSignature, name: "Instant proposal & quote", does: "Answer a few questions about your business, goals and budget.", get: "A written proposal with scope, timeline and the right plan, priced from our published plans. Download it or accept online.", meta: "Free · 20 seconds", cta: "Build my proposal", href: { to: "/proposal" } },
  { group: "try", icon: Mic, name: "Ask anything (voice)", does: "Tap the mic and ask a question out loud, like 'how much is a website?', or type it.", get: "The best answer from our FAQs, service pages and guides, read aloud, with a link to read more.", meta: "Voice · instant", cta: "Ask a question", href: { event: "efy-open-ask" } },
  { group: "try", icon: Languages, name: "Read this site in your language", does: "Translate any page with AI into Yorùbá, Hausa, Igbo, Pidgin, Swahili, Zulu, Portuguese, Arabic, French, Spanish or German.", get: "The whole page in your language, in seconds.", meta: "11 languages", cta: "Choose a language", href: { event: "efy-open-lang" } },
  { group: "try", icon: WandSparkles, name: "AI prototype builder", does: "Describe the website or app you want in plain words and AI builds a working, clickable prototype.", get: "A live preview you can test on desktop, tablet and mobile, then refine.", meta: "Free · under a minute", cta: "Build my prototype", href: { hash: "prototype" } },
  { group: "try", icon: Gauge, name: "Business growth assessment", does: "Eight quick questions about how customers find you, buy from you and hear back from you.", get: "A score across five areas, how it's calculated, and three things to fix first.", meta: "Free · 2 minutes", cta: "Take the assessment", href: { hash: "analyser-teaser" } },
  { group: "try", icon: Calculator, name: "ROI calculator", does: "Enter your enquiries, close rate and customer value to see what faster replies and better marketing could earn.", get: "Monthly and yearly extra revenue, costs, payback month — with the maths shown.", meta: "Free · 1 minute", cta: "Calculate my ROI", href: { hash: "roi" } },
  { group: "try", icon: ArrowLeftRight, name: "Before → after website preview", does: "Pick your industry and drag the slider to compare a dated website with a modern, sales-ready one.", get: "A clear picture of what an upgrade could look like for your business.", meta: "Interactive", cta: "Compare before & after", href: { hash: "transformation" } },
  { group: "try", icon: ListChecks, name: "Digital growth quiz", does: "Ten yes/no questions that reveal where your business stands online.", get: "Your result plus the three fastest fixes to grow.", meta: "Free · 2 minutes", cta: "Start the quiz", href: { to: "/growth-quiz" } },
  { group: "try", icon: Mail, name: "Email sequence generator", does: "Generate a ready-to-use 5-email sequence: welcome, abandoned cart, re-engage or product launch.", get: "Five written emails tailored to your business, ready to copy.", meta: "Free · 60 seconds", cta: "Generate my emails", href: { to: "/email-generator" } },

  // Learn & download
  { group: "learn", icon: Download, name: "Free growth toolkits", does: "Download practical toolkits: digital checklist, Instagram captions, AI automation starter, ad swipe file, WhatsApp playbook and a 90-day planner.", get: "Six downloadable resources you can use today.", meta: "Free download", cta: "Get the toolkits", href: { to: "/free-resources" } },
  { group: "learn", icon: BookOpen, name: "Knowledge base", does: "In-depth guides on websites, SEO, AI automation, social media, ads, email and ecommerce.", get: "Step-by-step answers written for business owners, not marketers.", meta: "Free guides", cta: "Browse the guides", href: { to: "/knowledge-base" } },
  { group: "learn", icon: Newspaper, name: "Blog", does: "Short, practical tips — from Instagram growth to WhatsApp automation, ads and SEO.", get: "Ideas you can try this week.", meta: "Free", cta: "Read the blog", href: { to: "/blog" } },
  { group: "learn", icon: PlayCircle, name: "Watch how it works", does: "Emmanuel walks through the 4-step system behind our client work.", get: "A clear view of how we'd approach your business.", meta: "Video", cta: "Watch now", href: { to: "/watch" } },

  // Work with us
  { group: "work", icon: ClipboardList, name: "Business profile & growth plan", does: "Tell us about your business, customers, goals and budget in one guided form.", get: "A custom 90-day growth plan, reviewed personally by Emmanuel.", meta: "5 minutes", cta: "Get my growth plan", href: { hash: "get-started" } },
  { group: "work", icon: CalendarCheck, name: "Free strategy call", does: "Book a 30-minute call to talk through your goals and what to build first.", get: "Clear next steps and honest advice — no pressure.", meta: "30 minutes · free", cta: "Pick a time", href: { to: "/book" } },
  { group: "work", icon: MessageCircle, name: "Chat on WhatsApp", does: "Message Emmanuel directly with a question or a project idea.", get: "A personal reply from Emmanuel.", meta: "Instant", cta: "Open WhatsApp", href: { external: buildWa("Hi Emmanuel! I found you on the website and I'd like to talk about my business.") } },
  { group: "work", icon: Tag, name: "Pricing", does: "Compare plans from Starter to Enterprise for automation, websites, social, ads and ecommerce.", get: "Transparent monthly prices and what each plan includes.", meta: "From $99/mo", cta: "See pricing", href: { to: "/pricing" } },
  { group: "work", icon: LayoutDashboard, name: "Client portal", does: "For existing clients: track projects, tasks and files, and message the team.", get: "Everything about your project in one place.", meta: "Clients", cta: "Log in", href: { to: "/portal" } },
  { group: "work", icon: HandCoins, name: "Affiliate programme", does: "Refer businesses to EmmaForYou and earn commission on every client you send.", get: "Your own referral link in about a minute.", meta: "25% recurring", cta: "Become an affiliate", href: { to: "/affiliate" } },

  // See our work
  { group: "proof", icon: Briefcase, name: "Client portfolio", does: "Websites, stores, automation and campaigns we've delivered for real businesses.", get: "Project details and a case study for every client.", meta: "12 projects", cta: "View our work", href: { to: "/portfolio" } },
  { group: "proof", icon: ClipboardList, name: "Case studies", does: "Before-and-after stories across industries, filterable by niche and result type.", get: "Challenge, solution and result for each business.", meta: "Filter by niche", cta: "Read case studies", href: { to: "/cases" } },
  { group: "proof", icon: Quote, name: "Testimonials", does: "What business owners say about working with EmmaForYou.", get: "Reviews you can filter by industry and location.", meta: "Reviews", cta: "Read testimonials", href: { to: "/testimonials" } },
  { group: "proof", icon: HelpCircle, name: "FAQ", does: "Answers about pricing, timelines, services and how we work together.", get: "Quick answers before you get in touch.", meta: "Answers", cta: "Read the FAQ", href: { to: "/faq" } },
];

const GROUPS: { id: Group; label: string; intro: string }[] = [
  { id: "try", label: "Try it now", intro: "Interactive tools that give you a result straight away — free, no sign-up." },
  { id: "learn", label: "Learn & download", intro: "Guides, toolkits and videos to grow on your own." },
  { id: "work", label: "Work with us", intro: "Ways to start a project or talk to Emmanuel." },
  { id: "proof", label: "See our work", intro: "Real client projects, results and reviews." },
];

const INDUSTRIES: { slug: string; label: string }[] = [
  { slug: "fashion-store", label: "Fashion" }, { slug: "clinic", label: "Clinics" }, { slug: "real-estate", label: "Real estate" },
  { slug: "restaurant", label: "Restaurants" }, { slug: "coach", label: "Coaches" }, { slug: "ecommerce", label: "Ecommerce" },
  { slug: "salon", label: "Salons" }, { slug: "gym", label: "Gyms" }, { slug: "auto-dealer", label: "Auto dealers" },
  { slug: "school", label: "Schools" }, { slug: "hotel", label: "Hotels" }, { slug: "saas", label: "SaaS" },
];

export default function ToolsHub() {
  const [group, setGroup] = useState<Group>("try");
  const active = GROUPS.find((g) => g.id === group)!;
  const tools = TOOLS.filter((t) => t.group === group);

  return (
    <section id="tools" className="band-ink relative overflow-hidden bg-[#0b0d24] py-24 text-white md:py-32">
      <div className="hero-ink-grid" aria-hidden="true" />
      <div className="hero-ink-glow" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-3xl">
          <p className="hero-kicker"><span className="hero-kicker-dot" aria-hidden="true" />Everything on this site, in one place</p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white md:text-5xl">Free tools & features</h2>
          <p className="mt-4 text-base text-[#b3b8dc] md:text-lg">
            {TOOLS.length} tools and resources to understand, plan and grow your business. Each one tells you what it does and what you'll get — pick one and start.
          </p>
        </motion.div>

        <LayoutGroup>
          <div className="th-tabs mt-10" role="tablist" aria-label="Tool categories">
            {GROUPS.map((g) => (
              <button key={g.id} role="tab" aria-selected={group === g.id} onClick={() => setGroup(g.id)} className="th-tab">
                {group === g.id && <motion.span layoutId="th-pill" className="th-pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                <span className="relative">{g.label}</span>
                <span className="relative th-count">{TOOLS.filter((t) => t.group === g.id).length}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
        <p className="mt-4 text-sm text-[#a6abd0]">{active.intro}</p>

        {/* Keyed by tab: switching swaps cards instantly, then animates the new ones in. */}
        <div key={group} className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="tabpanel" aria-label={active.label}>
          {tools.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
            >
              <ToolCard t={t} />
            </motion.div>
          ))}
        </div>

        <div className="mt-14 border-t border-white/10 pt-8">
          <p className="text-sm text-[#a6abd0]">Solutions for your industry — what we'd build for businesses like yours:</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {INDUSTRIES.map((n) => (
              <li key={n.slug}>
                <Link to="/niche/$slug" params={{ slug: n.slug }} className="th-industry">{n.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ToolCard({ t }: { t: Tool }) {
  const Icon = t.icon;
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="th-icon"><Icon /></span>
        <span className="th-meta">{t.meta}</span>
      </div>
      <h3 className="mt-5 font-display text-lg font-semibold text-white">{t.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#c9ccec]"><span className="text-[#8f94bf]">What it does: </span>{t.does}</p>
      <p className="mt-2 text-sm leading-relaxed text-[#c9ccec]"><span className="text-[#8f94bf]">You get: </span>{t.get}</p>
      <span className="th-cta">{t.cta} <ArrowRight className="h-4 w-4" /></span>
    </>
  );
  if ("hash" in t.href) return <a href={`#${t.href.hash}`} className="th-card" data-track={`tool_${t.href.hash}`}>{body}</a>;
  if ("event" in t.href) {
    const name = t.href.event;
    return <button type="button" onClick={() => window.dispatchEvent(new Event(name))} className="th-card w-full text-left">{body}</button>;
  }
  if ("external" in t.href) return <a href={t.href.external} target="_blank" rel="noopener noreferrer" className="th-card">{body}</a>;
  return <Link to={t.href.to} className="th-card" data-track={`tool_${t.href.to.slice(1)}`}>{body}</Link>;
}
