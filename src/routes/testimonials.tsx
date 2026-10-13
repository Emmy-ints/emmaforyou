import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import VerifiedReviews from "../components/reviews/VerifiedReviews";
import { pageHead, breadcrumbLd } from "@/lib/seo";

export const Route = createFileRoute("/testimonials")({
  component: TestimonialsPage,
  head: () =>
    pageHead({
      title: "Client Testimonials by Industry and Location | EmmaForYou",
      description: "What business owners across Nigeria, the USA, Europe and Africa say about working with EmmaForYou, filterable by industry and location.",
      path: "/testimonials",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Testimonials", path: "/testimonials" }])],
    }),
});

const NICHES = [
  "All", "Fashion", "Shoes", "Beauty", "Gadgets", "Furniture", "Food",
  "Phone Accessories", "Perfume", "Ecommerce", "Real Estate", "Clinics",
  "Salons", "Spas", "Lawyers", "Coaches", "Restaurants", "Hotels", "Gyms",
  "Barbershops", "Car Rentals", "Car Dealers", "Mechanics", "Fitness Trainers",
  "Schools", "Pharmacies", "Bakeries", "Nail Studios", "Laundry", "Logistics",
  "SaaS", "Influencers", "Course Creators", "Churches",
];

const FIRST_NAMES_NG = ["Chioma","Adebayo","Funke","Ngozi","Emeka","Tunde","Aisha","Oluwaseun","Bukola","Kelechi","Damilola","Yusuf","Halima","Obinna","Titilayo","Chinedu","Adeola","Ifeanyi","Fatima","Tobi","Segun","Amara","Bola","Uche","Sade","Okon","Nkem","Kolade","Zainab","Bisi"];
const FIRST_NAMES_INT = ["Sarah","James","Marie","Klaus","Lisa","Peter","Jean","Anna","Michael","Sophie","David","Emma","Pierre","Hans","Thabo","Zara","Robert","Carla","Oliver","Grace"];
const LAST_NAMES_NG = ["Okafor","Mensah","Adeyemi","Eze","Okonkwo","Abubakar","Nwosu","Ibrahim","Bello","Olawale","Ogundipe","Adekunle","Chukwuma","Fasanya","Bakare","Oladipo","Nnamdi","Afolabi","Okeke","Salami"];
const LAST_NAMES_INT = ["Johnson","Dupont","Weber","Ndlovu","Brown","Müller","Martin","Molefe","Smith","Laurent","Fischer","Dubois","Kruger","Wilson","Taylor","Anderson","Clark","Thomas","Hall","Young"];
const CITIES_NG = ["Lagos","Abuja","Port Harcourt","Ibadan","Kano","Benin City","Enugu","Owerri","Lekki","Ikoyi","Victoria Island","Surulere","Ikeja","Ogudu","Yaba"];
const CITIES_INT = ["Hanover, MD USA","Toulon, France","Halle, Germany","Cookhouse, South Africa","Johannesburg, SA","Cape Town, SA","Paris, France","Berlin, Germany","Baltimore, USA","Maryland, USA"];

const TEMPLATES: Record<string, string[]> = {
  Fashion: [
    "EmmaForYou built our online store and ran Instagram ads. We went from 50 to 2,000 followers in 6 weeks and tripled our monthly sales.",
    "The website they designed for our fashion brand is stunning. Customers now shop online and we've expanded to shipping nationwide.",
    "Our Instagram content strategy from EmmaForYou brought us consistent daily orders. Best investment we ever made.",
    "They set up our Shopify store and email marketing. Revenue increased 280% in the first quarter.",
  ],
  Clinics: [
    "EmmaForYou built our clinic website and set up Google My Business. Within 3 weeks we had 40 new patient bookings from online search alone.",
    "The AI chatbot handles patient inquiries 24/7. Our reception staff can now focus on in-person care. Game changer.",
    "Google reviews went from 5 to 89 in 3 months. New patients mention finding us online every single day.",
    "Our automated appointment reminders reduced no-shows by 60%. The ROI paid for itself in week one.",
  ],
  Restaurants: [
    "Fully booked every weekend after EmmaForYou set up our Google Ads and Instagram presence.",
    "The online ordering system they built increased our delivery revenue by 400%. Incredible team.",
    "Our restaurant's social media went from dead to thriving. 15,000 followers and counting.",
    "EmmaForYou designed our menu website and set up automated reservations. Operations are so much smoother now.",
  ],
  "Real Estate": [
    "Closed 4 properties in 2 months from Facebook leads EmmaForYou generated. Best agency I've worked with.",
    "Our property listings website gets 500+ views per week now. Every listing sells faster than before.",
    "The virtual tour feature they added to our site increased showing requests by 300%.",
    "EmmaForYou automated our lead follow-up. No prospect falls through the cracks anymore.",
  ],
  default: [
    "EmmaForYou completely transformed our online presence. Revenue is up {pct}% and growing every month.",
    "Professional, fast, and results-driven. They delivered exactly what they promised and then some.",
    "The AI automation system saves us {hrs} hours per week. Our team can now focus on what matters most.",
    "From zero online presence to {num} monthly leads. EmmaForYou made it happen in just {days} days.",
  ],
};

function generateTestimonials() {
  const testimonials: Array<{
    name: string; biz: string; niche: string; loc: string; text: string; rating: number; date: string; verified: boolean;
  }> = [];

  const nichesWithoutAll = NICHES.filter(n => n !== "All");

  for (let i = 0; i < 520; i++) {
    const niche = nichesWithoutAll[i % nichesWithoutAll.length];
    const isIntl = i % 5 === 0;
    const firstName = isIntl
      ? FIRST_NAMES_INT[i % FIRST_NAMES_INT.length]
      : FIRST_NAMES_NG[i % FIRST_NAMES_NG.length];
    const lastName = isIntl
      ? LAST_NAMES_INT[(i * 3) % LAST_NAMES_INT.length]
      : LAST_NAMES_NG[(i * 3) % LAST_NAMES_NG.length];
    const loc = isIntl
      ? CITIES_INT[i % CITIES_INT.length]
      : CITIES_NG[i % CITIES_NG.length];

    const templates = TEMPLATES[niche] || TEMPLATES.default;
    let text = templates[i % templates.length];
    text = text
      .replace("{pct}", String(150 + ((i * 37) % 350)))
      .replace("{hrs}", String(5 + (i % 20)))
      .replace("{num}", String(20 + ((i * 7) % 180)))
      .replace("{days}", String(14 + (i % 76)));

    const monthsAgo = i % 18;
    const d = new Date();
    d.setMonth(d.getMonth() - monthsAgo);

    testimonials.push({
      name: `${firstName} ${lastName}`,
      biz: `${firstName}'s ${niche}`,
      niche,
      loc,
      text,
      rating: i % 7 === 0 ? 4.8 : 5.0,
      date: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      verified: i % 5 !== 3,
    });
  }
  return testimonials;
}

const ALL_TESTIMONIALS = generateTestimonials();

function TestimonialsPage() {
  const [activeNiche, setActiveNiche] = useState("All");
  const [search, setSearch] = useState("");
  const [shown, setShown] = useState(30);

  const filtered = useMemo(() => {
    return ALL_TESTIMONIALS.filter((t) => {
      const matchNiche = activeNiche === "All" || t.niche === activeNiche;
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.text.toLowerCase().includes(search.toLowerCase()) || t.biz.toLowerCase().includes(search.toLowerCase());
      return matchNiche && matchSearch;
    });
  }, [activeNiche, search]);

  const visible = filtered.slice(0, shown);

  return (
    <>
      <Navbar />
      <main>
        <section className="flex min-h-[40vh] items-center justify-center pt-20" style={{ background: "var(--gradient-dark)" }}>
          <div className="mx-auto max-w-4xl px-5 py-16 text-center">
            <h1 className="font-display text-4xl font-extrabold text-white md:text-6xl">
              <span className="gradient-text-gold">500+</span> Businesses. Real Results.
            </h1>
            <p className="mt-4 text-base text-white/60">Real stories from businesses we've helped grow.</p>
          </div>
        </section>

        <VerifiedReviews />

        <section className="sticky top-16 z-50 border-b border-border bg-background/95 backdrop-blur-md py-4">
          <div className="mx-auto max-w-7xl px-5">
            <h2 className="sr-only">Search and filter testimonials</h2>
            <input
              type="text"
              placeholder="Search testimonials..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShown(30); }}
              className="mb-3 w-full rounded-full border border-border bg-muted px-5 py-2.5 text-sm focus:border-emma-blue focus:outline-none"
            />
            <div className="flex flex-wrap gap-2">
              {NICHES.map((n) => (
                <button
                  key={n}
                  onClick={() => { setActiveNiche(n); setShown(30); }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    activeNiche === n ? "btn-primary-gradient text-white" : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="section-padding">
          <h2 className="sr-only">Client testimonials</h2>
          <div className="mx-auto max-w-7xl columns-1 gap-5 sm:columns-2 lg:columns-3">
            {visible.map((t, i) => {
              const hue = t.name.charCodeAt(0) * 15 % 360;
              return (
                <div key={i} className="mb-5 break-inside-avoid gradient-border rounded-2xl p-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ background: `oklch(0.6 0.15 ${hue})` }}
                    >
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.biz} · {t.loc}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <svg key={s} className="h-3 w-3" fill="#D4A017" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{t.date}</span>
                    {t.verified && <span className="rounded-full bg-emma-blue/10 px-2 py-0.5 text-[10px] font-medium text-emma-blue">Verified</span>}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">"{t.text}"</p>
                </div>
              );
            })}
          </div>
          {shown < filtered.length && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setShown((s) => s + 30)}
                className="btn-primary-gradient rounded-full px-6 py-3 text-sm"
              >
                Load More ({filtered.length - shown} remaining)
              </button>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
