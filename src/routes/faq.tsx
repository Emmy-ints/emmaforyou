import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const Route = createFileRoute("/faq")({
  component: FaqPage,
  head: () => ({
    meta: [
      { title: "FAQs — Everything You Need to Know | EmmaForYou" },
      { name: "description", content: "Answers to common questions about pricing, services, timelines, AI automation, and working with EmmaForYou across Nigeria, USA, Europe and Africa." },
      { property: "og:title", content: "EmmaForYou — Frequently Asked Questions" },
      { property: "og:description", content: "Pricing, services, timelines and more — answered." },
    ],
  }),
});

const CATEGORIES = [
  { id: "general", label: "General", items: [
    { q: "Do you work with businesses outside Nigeria?", a: "Yes — we serve clients in Nigeria, the United States, United Kingdom, France, Germany, Spain, Colombia, Ghana and South Africa. Most work is delivered remotely via WhatsApp and Zoom." },
    { q: "What makes EmmaForYou different from other agencies?", a: "We combine AI automation with traditional digital marketing — almost no agency does both well. We also know both African and Western markets deeply, and you always work with senior strategists." },
    { q: "Is my business too small or too new for EmmaForYou?", a: "Almost never. We've launched one-person businesses from zero to first 100 customers, and we've scaled established companies to seven figures." },
    { q: "How do I know if this will work for my business type?", a: "We've worked with 50+ niches. Take the free analyser or fill the intake form — we'll only take you on if we're confident we can deliver." },
    { q: "Where is EmmaForYou based?", a: "Headquartered in Nigeria with team members and clients across the United States, United Kingdom, France, Germany, Spain, Colombia and South Africa." },
  ]},
  { id: "pricing", label: "Pricing", items: [
    { q: "Do I need a big budget to work with you?", a: "No — Starter starts at $99/month and is built for new businesses. We have clients spending $99 and clients spending $10k+. The strategy matches the budget." },
    { q: "Do you offer payment plans?", a: "Yes — larger projects can be split into 2–3 monthly payments. Ongoing services bill monthly." },
    { q: "Are ad spend costs included in your prices?", a: "No — our price covers our management fee. You pay the ad platforms directly. This keeps everything transparent." },
    { q: "What's your refund policy?", a: "Pro plan has a 30-day money-back guarantee. All plans can be cancelled anytime with no penalty." },
    { q: "Do you accept payments in local currency?", a: "Yes — we accept NGN, USD, EUR, GBP and ZAR via bank transfer, card or PayPal." },
  ]},
  { id: "services", label: "Services", items: [
    { q: "What is AI automation and how does it help my business?", a: "It means your business responds to leads in seconds, follows up consistently, books appointments without you, and never lets a customer fall through the cracks. Most clients see 30–50% more conversions just from this." },
    { q: "Can you handle everything for me?", a: "Yes — our 'Done-For-You' engagement means you focus on running your business while we handle strategy, design, automation, posting, ads and reporting." },
    { q: "Do you build mobile apps?", a: "Yes, both iOS and Android (or cross-platform). Typically used for booking, ordering, loyalty and internal team apps." },
    { q: "Can you redesign my existing website?", a: "Yes — most of our website work is rebuilds with a focus on conversion." },
    { q: "Do you offer SEO?", a: "Yes — both technical SEO and Google Business Profile optimisation for local visibility." },
  ]},
  { id: "timeline", label: "Timeline", items: [
    { q: "How long does it take to see results?", a: "Most clients see meaningful traction within 30 days. Significant revenue lifts typically show between days 60–90." },
    { q: "How quickly can we start?", a: "After your intake form, you'll have a strategy call within 48 hours. Onboarding starts within 1 week of signing." },
    { q: "How long does a website build take?", a: "Standard websites: 2–3 weeks. Complex ecommerce or custom builds: 4–8 weeks." },
    { q: "Are there long contracts?", a: "No — all monthly plans are month-to-month. We earn your business every month." },
  ]},
  { id: "automation", label: "AI Automation", items: [
    { q: "Will AI replace my human team?", a: "No — AI handles repetitive, low-value tasks (instant replies, reminders, follow-ups) so your team focuses on high-value work." },
    { q: "Will the AI sound robotic to my customers?", a: "No — we train it on your brand voice and customer personas. Most customers can't tell." },
    { q: "Can I edit what the AI says?", a: "Yes — you have full control via a simple dashboard. Update messages anytime." },
    { q: "What platforms does your AI work on?", a: "WhatsApp Business, Instagram DMs, Facebook Messenger, your website chat, and email." },
  ]},
  { id: "starting", label: "Getting Started", items: [
    { q: "What's the first step?", a: "Either take the free analyser, fill the business intake form, or message us on WhatsApp. We'll respond within hours." },
    { q: "What information do you need from me?", a: "Just complete the 8-step intake form — it covers everything we need to build your custom plan." },
    { q: "How do you communicate with clients?", a: "WhatsApp for daily comms, scheduled Zoom calls for strategy, email for documentation, and a project portal for deliverables." },
  ]},
];

function FaqPage() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("general");
  const [open, setOpen] = useState<string | null>(null);

  const all = useMemo(() => CATEGORIES.flatMap((c) => c.items.map((i) => ({ ...i, cat: c.id }))), []);
  const filtered = search
    ? all.filter((i) => i.q.toLowerCase().includes(search.toLowerCase()) || i.a.toLowerCase().includes(search.toLowerCase()))
    : (CATEGORIES.find((c) => c.id === activeCat)?.items || []).map((i) => ({ ...i, cat: activeCat }));

  return (
    <>
      <Navbar />
      <main>
        <section className="section-padding pt-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-4xl font-extrabold md:text-6xl">Frequently Asked <span className="gradient-text">Questions</span></h1>
            <p className="mt-4 text-base text-muted-foreground">Everything you need to know about working with us.</p>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search FAQs..."
              className="mt-8 w-full rounded-full border border-border bg-card px-6 py-4 text-sm focus:border-emma-blue focus:outline-none" />
          </div>

          {!search && (
            <div className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-2">
              {CATEGORIES.map((c) => (
                <button key={c.id} onClick={() => setActiveCat(c.id)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold ${
                    activeCat === c.id ? "bg-emma-charcoal text-white" : "border border-border hover:border-emma-blue"
                  }`}>{c.label}</button>
              ))}
            </div>
          )}

          <div className="mx-auto mt-10 max-w-3xl space-y-3">
            {filtered.length === 0 && <p className="text-center text-muted-foreground">No matches — try different keywords.</p>}
            {filtered.map((f, i) => {
              const key = `${f.cat}-${i}`;
              return (
                <div key={key} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <button onClick={() => setOpen(open === key ? null : key)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left hover:bg-muted/30">
                    <span className="font-display text-base font-bold">{f.q}</span>
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full bg-emma-blue/10 text-emma-blue transition-transform ${open === key ? "rotate-45" : ""}`}>+</span>
                  </button>
                  {open === key && <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>}
                </div>
              );
            })}
          </div>

          <div className="mx-auto mt-14 max-w-2xl rounded-3xl border border-border bg-card p-8 text-center shadow-lg">
            <h3 className="font-display text-xl font-bold">Still have questions?</h3>
            <p className="mt-2 text-sm text-muted-foreground">Chat with us directly on WhatsApp — we usually respond within minutes.</p>
            <a href="https://wa.me/message/HHGMMWMRJFYUC1" target="_blank" rel="noopener noreferrer"
              className="btn-gold mt-5 inline-flex rounded-full px-6 py-3 text-sm font-semibold">Chat With Us →</a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
