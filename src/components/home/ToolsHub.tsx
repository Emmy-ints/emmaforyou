import { useSettings } from "@/lib/site-settings";
import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { LayoutGroup, motion } from "framer-motion";
import {
  ArrowRight, ArrowLeftRight, BookOpen, Briefcase, Calculator, CalendarCheck, ClipboardList, Download, Gauge,
  HandCoins, HelpCircle, LayoutDashboard, ListChecks, Mail, MessageCircle, Newspaper, PlayCircle, Quote, Tag, WandSparkles,
  Bot, Globe, Languages, Mic, Palette, FileSignature, ShieldCheck, Target,
  Rocket, Search, Store, Stethoscope, Users, Megaphone, MessageSquare, FolderOpen, Plug, Layers, Scale, Sparkles, MessagesSquare,
} from "lucide-react";
import { buildWa } from "@/lib/leads";
import SectionHead from "../future/SectionHead";

type Group = "try" | "ecommerce" | "learn" | "work" | "proof";

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

export const TOOLS: Tool[] = [
  // Try it now
  { group: "try", icon: Bot, name: "AI receptionist demo", does: "Chat with, or talk out loud to, an AI receptionist for a sample salon, clinic or restaurant. Ask prices, then book an appointment.", get: "A feel for how your customers would get instant replies and bookings 24/7.", meta: "Live demo · voice", cta: "Talk to it", href: { to: "/ai-receptionist" } },
  { group: "try", icon: Globe, name: "AI website audit", does: "Enter your website address. We check speed on a phone (Google Lighthouse), SEO, contact buttons, trust and more.", get: "A score out of 100, a phone screenshot, the top 5 fixes and a downloadable PDF report.", meta: "Free · ~1 minute", cta: "Audit my website", href: { to: "/website-audit" } },
  { group: "try", icon: Palette, name: "AI website makeover", does: "Upload a screenshot of your website and watch AI redesign it live, keeping your business details.", get: "A before-and-after comparison and a redesign concept you can download.", meta: "Free · ~1 minute", cta: "Redesign my site", href: { to: "/makeover" } },
  { group: "try", icon: FileSignature, name: "Instant proposal & quote", does: "Answer a few questions about your business, goals and budget.", get: "A written proposal with scope, timeline and the right plan, priced from our published plans. Download it or accept online.", meta: "Free · 20 seconds", cta: "Build my proposal", href: { to: "/proposal" } },
  { group: "try", icon: ShieldCheck, name: "Smart contract check", does: "Paste a Solidity contract. A pattern scan and AI reviewer look for reentrancy, access-control, randomness and gas issues.", get: "Findings ranked from critical to info, each with a fix, plus a PDF and an optional manual review.", meta: "Web3 · free", cta: "Check my contract", href: { to: "/smart-contract-check" } },
  { group: "try", icon: Target, name: "90-day goal planner", does: "Describe a goal and how much time you have.", get: "Monthly milestones, 12 weeks of small concrete actions, habits and an if-then plan for your biggest obstacle.", meta: "Coaching · free", cta: "Plan my 90 days", href: { to: "/goal-planner" } },
  { group: "try", icon: Mic, name: "Ask anything (voice)", does: "Tap the mic and ask a question out loud, like 'how much is a website?', or type it.", get: "The best answer from our FAQs, service pages and guides, read aloud, with a link to read more.", meta: "Voice · instant", cta: "Ask a question", href: { event: "efy-open-ask" } },
  { group: "try", icon: Languages, name: "Read this site in your language", does: "Translate any page with AI into Yorùbá, Hausa, Igbo, Pidgin, Swahili, Zulu, Portuguese, Arabic, French, Spanish or German.", get: "The whole page in your language, in seconds.", meta: "11 languages", cta: "Choose a language", href: { event: "efy-open-lang" } },
  { group: "try", icon: WandSparkles, name: "AI prototype builder", does: "Describe the website or app you want in plain words and AI builds a working, clickable prototype.", get: "A live preview you can test on desktop, tablet and mobile, then refine.", meta: "Free · under a minute", cta: "Build my prototype", href: { hash: "prototype" } },
  { group: "try", icon: Gauge, name: "Business growth assessment", does: "Eight quick questions about how customers find you, buy from you and hear back from you.", get: "A score across five areas, how it's calculated, and three things to fix first.", meta: "Free · 2 minutes", cta: "Take the assessment", href: { hash: "analyser-teaser" } },
  { group: "try", icon: Calculator, name: "ROI calculator", does: "Enter your enquiries, close rate and customer value to see what faster replies and better marketing could earn.", get: "Monthly and yearly extra revenue, costs, payback month — with the maths shown.", meta: "Free · 1 minute", cta: "Calculate my ROI", href: { hash: "roi" } },
  { group: "try", icon: ArrowLeftRight, name: "Before → after website preview", does: "Pick your industry and drag the slider to compare a dated website with a modern, sales-ready one.", get: "A clear picture of what an upgrade could look like for your business.", meta: "Interactive", cta: "Compare before & after", href: { hash: "transformation" } },
  { group: "try", icon: ListChecks, name: "Digital growth quiz", does: "Ten yes/no questions that reveal where your business stands online.", get: "Your result plus the three fastest fixes to grow.", meta: "Free · 2 minutes", cta: "Start the quiz", href: { to: "/growth-quiz" } },
  { group: "try", icon: Mail, name: "Email sequence generator", does: "Generate a ready-to-use 5-email sequence: welcome, abandoned cart, re-engage or product launch.", get: "Five written emails tailored to your business, ready to copy.", meta: "Free · 60 seconds", cta: "Generate my emails", href: { to: "/email-generator" } },

  { group: "try", icon: Sparkles, name: "App feature planner", does: "Tick the building blocks your app needs (36 to choose from), or start from a common app type.", get: "What belongs in a first version, a list you can copy, and an optional quote for it.", meta: "Free · 3 minutes", cta: "Plan my app", href: { to: "/solutions/app-planner" } },
  { group: "try", icon: Layers, name: "Solutions catalogue with live demos", does: "Browse websites, business apps, AI solutions, automation and industry systems. Every page has a clickable demo with sample data.", get: "A clear picture of what each solution does before you talk to anyone.", meta: "Interactive demos", cta: "Explore solutions", href: { to: "/solutions" } },

  // Ecommerce Intelligence
  { group: "ecommerce", icon: Rocket, name: "Ecommerce launch roadmap", does: "Answer a few questions about your budget, market, products and experience.", get: "A 14-step launch plan for your situation, with tasks you can tick off and save.", meta: "Start a store · free", cta: "Build my roadmap", href: { to: "/ecommerce/start" } },
  { group: "ecommerce", icon: Search, name: "Product research & validation", does: "Describe a product idea. We check competitors' public product pages, tracked industry news and your costs.", get: "A sourced report that separates evidence from hypotheses, plus your margin per sale. No invented demand figures.", meta: "Free · ~1 minute", cta: "Research a product", href: { to: "/ecommerce/research" } },
  { group: "ecommerce", icon: Store, name: "Online store audit", does: "Enter any store or product page (Shopify, WooCommerce, Amazon, Jumia and more).", get: "Scores for speed, SEO, trust and product pages, with every issue, its fix and how to check it.", meta: "Free · ~1 minute", cta: "Audit my store", href: { to: "/ecommerce/grow" } },
  { group: "ecommerce", icon: Stethoscope, name: "Sales diagnosis", does: "Enter your visits, add-to-carts and orders, or upload an orders export (CSV).", get: "Where shoppers drop off, labelled confirmed, likely or unknown, and what to test first.", meta: "Free · CSV import", cta: "Diagnose my sales", href: { to: "/ecommerce/diagnose" } },
  { group: "ecommerce", icon: Calculator, name: "Profit analyzer", does: "Enter one period's sales, product costs, shipping, fees and ad spend.", get: "Gross, contribution and net profit, break-even orders, CAC and ROAS, with every formula shown.", meta: "Free · 3 minutes", cta: "Check my profit", href: { to: "/ecommerce/profit" } },
  { group: "ecommerce", icon: Users, name: "Competitor comparison", does: "Paste up to six competitor product pages or stores.", get: "Prices, reviews, shipping and returns info and payment options side by side, as published on their pages.", meta: "Free", cta: "Compare competitors", href: { to: "/ecommerce/competitors" } },
  { group: "ecommerce", icon: Megaphone, name: "Marketing experiment planner", does: "Plan traffic and conversion tests with a baseline, hypothesis, action, metric and review date.", get: "A tracked list of experiments and a checklist of traffic channels.", meta: "Free account", cta: "Plan experiments", href: { to: "/ecommerce/marketing" } },
  { group: "ecommerce", icon: ListChecks, name: "Ecommerce action plan", does: "Collects the fixes from your audit, your roadmap's next steps and your experiments.", get: "One prioritised to-do list ranked by impact and effort.", meta: "Free account", cta: "Open my plan", href: { to: "/ecommerce/plan" } },
  { group: "ecommerce", icon: MessageSquare, name: "AI ecommerce business guide", does: "Ask questions about your store or plan. Answers use the reports you've saved.", get: "Practical next steps for your business; it says when it needs data you haven't given it.", meta: "AI · free account", cta: "Ask the guide", href: { to: "/ecommerce/guide" } },
  { group: "ecommerce", icon: FolderOpen, name: "Ecommerce workspace", does: "Keep your roadmaps, audits, research and profit reports in one private place.", get: "Saved reports you can compare over time, export or delete.", meta: "Free account", cta: "Open workspace", href: { to: "/ecommerce/workspace" } },
  { group: "ecommerce", icon: Plug, name: "Platforms & integrations", does: "See which store platforms, marketplaces and analytics tools work with these tools today.", get: "An honest status for each, what a connection would need, and how to import a CSV instead.", meta: "19 platforms", cta: "See integrations", href: { to: "/ecommerce/integrations" } },

  // Learn & download
  { group: "learn", icon: Download, name: "Free growth toolkits", does: "Download practical toolkits: digital checklist, Instagram captions, AI automation starter, ad swipe file, WhatsApp playbook and a 90-day planner.", get: "Six downloadable resources you can use today.", meta: "Free download", cta: "Get the toolkits", href: { to: "/free-resources" } },
  { group: "learn", icon: BookOpen, name: "Knowledge base", does: "In-depth guides on websites, SEO, AI automation, social media, ads, email and ecommerce.", get: "Step-by-step answers written for business owners, not marketers.", meta: "Free guides", cta: "Browse the guides", href: { to: "/knowledge-base" } },
  { group: "learn", icon: MessagesSquare, name: "Community", does: "Ask questions, share projects and learn from other business owners. EmmaForYou's AI specialists (clearly labelled) answer questions too.", get: "Answers to your questions and people working on the same problems.", meta: "Free to join", cta: "Join the community", href: { to: "/community" } },
  { group: "learn", icon: ListChecks, name: "Free checklists", does: "Step-by-step checklists for website launches, conversion, Web3 projects and more.", get: "A list you can work through today, item by item.", meta: "Free", cta: "Open the checklists", href: { to: "/checklists" } },
  { group: "learn", icon: Scale, name: "Comparisons", does: "Side-by-side guides like Shopify vs WooCommerce and SEO vs ads.", get: "The trade-offs explained, so you can choose what fits your business.", meta: "Free guides", cta: "Read comparisons", href: { to: "/compare" } },
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
  { id: "ecommerce", label: "Ecommerce", intro: "Start an online store or grow an existing one: launch plan, research, audits, sales and profit — every figure is observed, yours, or labelled a hypothesis." },
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
  const [q, setQ] = useState("");
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const active = GROUPS.find((g) => g.id === group)!;
  const query = q.trim().toLowerCase();
  const settings = useSettings();
  const ALL = TOOLS.filter((t) => !("to" in t.href && settings[`tool:${t.href.to}`]?.hidden));
  const tools = query
    ? ALL.filter((t) => `${t.name} ${t.does} ${t.get} ${t.meta}`.toLowerCase().includes(query))
    : ALL.filter((t) => t.group === group);

  // Tabs follow the ARIA pattern: arrow keys / Home / End move between categories.
  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    const n = GROUPS.length;
    const to = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (to < 0) return;
    e.preventDefault(); setQ(""); setGroup(GROUPS[to].id); tabs.current[to]?.focus();
  };

  return (
    <section id="tools" className="band-ink th relative overflow-hidden bg-[#0b0d24] py-24 text-white md:py-32">
      <div className="hero-ink-grid" aria-hidden="true" />
      <div className="hero-ink-glow" aria-hidden="true" />
      <div className="th-constellation" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <span key={i} style={{ ["--i" as string]: i, left: `${(i * 37) % 100}%`, top: `${(i * 53 + 11) % 100}%` }} />)}</div>
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <SectionHead
          tone="ink"
          kicker="Everything on this site, in one place"
          title="Free tools & features"
          shine={["tools"]}
          sub={<>{TOOLS.length} tools and resources to understand, plan and grow your business. Each one tells you what it does and what you'll get — pick one and start.</>}
          className="max-w-3xl"
        />

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <LayoutGroup>
            <div className="th-tabs" role="tablist" aria-label="Tool categories">
              {GROUPS.map((g, i) => {
                const sel = !query && group === g.id;
                return (
                  <button key={g.id} ref={(el) => { tabs.current[i] = el; }} id={`th-tab-${g.id}`} role="tab" aria-selected={sel} aria-controls="th-panel" tabIndex={group === g.id ? 0 : -1}
                    onClick={() => { setQ(""); setGroup(g.id); }} onKeyDown={(e) => onTabKey(e, i)} className="th-tab">
                    {sel && <motion.span layoutId="th-pill" className="th-pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                    <span className="relative">{g.label}</span>
                    <span className="relative th-count">{ALL.filter((t) => t.group === g.id).length}</span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
          <label className="th-search">
            <Search className="h-4 w-4 shrink-0 text-[#8f94bf]" aria-hidden="true" />
            <span className="sr-only">Find a tool</span>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a tool…" maxLength={60} />
          </label>
        </div>
        <p className="mt-4 text-sm text-[#a6abd0]" aria-live="polite">
          {query ? `${tools.length} ${tools.length === 1 ? "match" : "matches"} for “${q.trim()}”` : active.intro}
        </p>

        {/* Keyed by tab/query: switching swaps cards instantly, then animates the new ones in. */}
        <div key={query ? `q-${query}` : group} id="th-panel" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="tabpanel" aria-labelledby={query ? undefined : `th-tab-${group}`} aria-label={query ? "Search results" : undefined}>
          {tools.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(i, 9) * 0.04, ease: [0.16, 1, 0.3, 1] }}
            >
              <ToolCard t={t} />
            </motion.div>
          ))}
          {!tools.length && <p className="col-span-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-[#c9ccec]">No tool matches that. Try “audit”, “email”, “store” or “quote”, or <button type="button" onClick={() => setQ("")} className="font-semibold text-white underline underline-offset-4">show all</button>.</p>}
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
  const settings = useSettings();
  const Icon = t.icon;
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="th-icon"><Icon /></span>
        <span className="th-meta">{t.meta}{"to" in t.href && settings[`tool:${t.href.to}`]?.status && settings[`tool:${t.href.to}`].status !== "live" ? ` · ${settings[`tool:${t.href.to}`].status === "beta" ? "Beta" : "Prototype"}` : ""}</span>
      </div>
      <h3 className="mt-5 font-display text-lg font-semibold text-white">{t.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#c9ccec]"><span className="text-[#8f94bf]">What it does: </span>{t.does}</p>
      <p className="mt-2 text-sm leading-relaxed text-[#c9ccec]"><span className="text-[#8f94bf]">You get: </span>{t.get}</p>
      <span className="th-cta">{t.cta} <ArrowRight className="h-4 w-4" /></span>
    </>
  );
  if ("hash" in t.href) return <a href={`#${t.href.hash}`} className="th-card" data-tilt="4" data-track={`tool_${t.href.hash}`}>{body}</a>;
  if ("event" in t.href) {
    const name = t.href.event;
    return <button type="button" onClick={() => window.dispatchEvent(new Event(name))} className="th-card w-full text-left" data-tilt="4">{body}</button>;
  }
  if ("external" in t.href) return <a href={t.href.external} target="_blank" rel="noopener noreferrer" className="th-card" data-tilt="4">{body}</a>;
  return <Link to={t.href.to} className="th-card" data-tilt="4" data-track={`tool_${t.href.to.slice(1)}`}>{body}</Link>;
}
