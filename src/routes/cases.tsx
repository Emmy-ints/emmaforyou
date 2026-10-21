import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { pageHead, breadcrumbLd } from "@/lib/seo";

export const Route = createFileRoute("/cases")({
  component: CasesPage,
  head: () =>
    pageHead({
      title: "Case Studies — Before & After Results by Industry | EmmaForYou",
      description: "Before-and-after case studies across fashion, clinics, real estate, restaurants, salons and more — filter by industry and result type.",
      path: "/cases",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Case studies", path: "/cases" }])],
    }),
});

const NICHES = ["All","Fashion","Ecommerce","Real Estate","Clinics","Restaurants","Salons","Gyms","SaaS","Coaches","Barbershops","Bakeries","Car Dealers","Hotels","Logistics"];
const RESULT_TYPES = ["All","Leads","Revenue","Traffic","Bookings","Followers"];

const CITIES = ["Lagos","Abuja","Port Harcourt","Lekki","Ibadan","Hanover MD, USA","Toulon, France","Halle, Germany","Cookhouse, SA","Johannesburg, SA"];
const SERVICES_LIST = ["AI Automation","Website Design","Social Media","Email Marketing","Google Ads","Facebook Ads","Shopify Setup","App Development"];

function generateCases() {
  const cases: Array<{
    id: number; biz: string; niche: string; loc: string; challenge: string; solution: string;
    result: string; resultType: string; services: string[]; expanded: boolean;
    detail: string;
  }> = [];

  const challenges = [
    "No online presence and losing customers to competitors",
    "Inconsistent social media with zero engagement",
    "Website was outdated and not generating leads",
    "Spending on ads with no measurable return",
    "Relying solely on word-of-mouth for new customers",
    "Manual booking process causing missed appointments",
    "No email list or customer retention strategy",
    "Poor Google rankings and no local visibility",
  ];

  const solutions = [
    "Built a conversion-optimized website and launched targeted Google Ads",
    "Created a content calendar, designed branded posts, and grew social channels",
    "Redesigned website with SEO, set up lead capture funnels and email automation",
    "Audited ad spend, restructured campaigns, and implemented conversion tracking",
    "Launched Facebook lead generation campaigns with automated follow-ups",
    "Built an AI-powered booking system with automated reminders",
    "Set up email marketing automation with welcome sequences and promotions",
    "Optimized Google My Business, built backlinks, and launched local SEO strategy",
  ];

  const resultTemplates = [
    { text: "{pct}% increase in website traffic in {days} days", type: "Traffic" },
    { text: "From {before} to {after} monthly leads", type: "Leads" },
    { text: "{pct}% increase in monthly revenue", type: "Revenue" },
    { text: "{num} new bookings per week from online sources", type: "Bookings" },
    { text: "From {before} to {after} Instagram followers in {days} days", type: "Followers" },
    { text: "{pct}% increase in customer retention rate", type: "Revenue" },
  ];

  const nichesNoAll = NICHES.filter(n => n !== "All");

  for (let i = 0; i < 100; i++) {
    const niche = nichesNoAll[i % nichesNoAll.length];
    const loc = CITIES[i % CITIES.length];
    const rt = resultTemplates[i % resultTemplates.length];
    const pct = 120 + ((i * 31) % 400);
    const before = (i * 3) % 20;
    const after = before + 20 + ((i * 7) % 150);
    const num = 10 + ((i * 5) % 60);
    const days = 14 + (i % 76);

    const result = rt.text
      .replace("{pct}", String(pct))
      .replace("{before}", String(before))
      .replace("{after}", String(after))
      .replace("{num}", String(num))
      .replace("{days}", String(days));

    const svcCount = 2 + (i % 3);
    const services = SERVICES_LIST.slice(i % 4, i % 4 + svcCount);

    cases.push({
      id: i,
      biz: `${niche} Business #${i + 1}`,
      niche,
      loc,
      challenge: challenges[i % challenges.length],
      solution: solutions[i % solutions.length],
      result,
      resultType: rt.type,
      services,
      expanded: false,
      detail: `Full case study: We started by auditing the current digital presence and identified key opportunities. Over ${days} days, we implemented a comprehensive strategy including ${services.join(", ")}. The results speak for themselves: ${result}. The client continues to grow month over month.`,
    });
  }
  return cases;
}

const ALL_CASES = generateCases();

function CasesPage() {
  const [activeNiche, setActiveNiche] = useState("All");
  const [activeResult, setActiveResult] = useState("All");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return ALL_CASES.filter((c) => {
      const matchNiche = activeNiche === "All" || c.niche === activeNiche;
      const matchResult = activeResult === "All" || c.resultType === activeResult;
      return matchNiche && matchResult;
    });
  }, [activeNiche, activeResult]);

  return (
    <>
      <Navbar />
      <main>
        <section className="flex min-h-[40vh] items-center justify-center pt-20" style={{ background: "var(--gradient-dark)" }}>
          <div className="mx-auto max-w-4xl px-5 py-16 text-center">
            <h1 className="font-display text-4xl font-extrabold text-white md:text-6xl">
              <span className="gradient-text-gold">100</span> Businesses Transformed.
            </h1>
            <p className="mt-4 text-base text-white/60">Before & after proof that speaks for itself.</p>
          </div>
        </section>

        <section className="sticky top-[68px] lg:top-[72px] z-50 border-b border-border bg-background/95 backdrop-blur-md py-4">
          <div className="mx-auto max-w-7xl px-5 space-y-3">
            <div className="flex flex-wrap gap-2">
              {NICHES.map(n => (
                <button key={n} onClick={() => setActiveNiche(n)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${activeNiche === n ? "btn-primary-gradient text-white" : "bg-muted text-muted-foreground"}`}
                >{n}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {RESULT_TYPES.map(r => (
                <button key={r} onClick={() => setActiveResult(r)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${activeResult === r ? "bg-emma-charcoal text-white" : "bg-muted text-muted-foreground"}`}
                >{r}</button>
              ))}
            </div>
          </div>
        </section>

        <section className="section-padding">
          <h2 className="sr-only">Case studies</h2>
          <div className="mx-auto max-w-7xl grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <div key={c.id} className="gradient-border rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-emma-blue/10 px-3 py-1 text-xs font-medium text-emma-blue">{c.niche}</span>
                  <span className="text-xs text-muted-foreground">{c.loc}</span>
                </div>
                <h3 className="mt-3 font-display text-lg font-bold text-foreground">{c.biz}</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <p><span className="font-semibold text-destructive">Challenge:</span> <span className="text-muted-foreground">{c.challenge}</span></p>
                  <p><span className="font-semibold text-emma-blue">Solution:</span> <span className="text-muted-foreground">{c.solution}</span></p>
                  <p className="font-display font-bold text-foreground">📈 {c.result}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.services.map(s => (
                    <span key={s} className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">{s}</span>
                  ))}
                </div>
                <button
                  onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  className="mt-3 text-sm font-medium text-emma-blue hover:text-emma-pink transition-colors"
                >
                  {expandedId === c.id ? "Hide Details ↑" : "Read Full Case Study →"}
                </button>
                {expandedId === c.id && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground border-t border-border pt-3">{c.detail}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
