import { createFileRoute } from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { pageHead, breadcrumbLd, founderLd } from "@/lib/seo";

const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1";

const VALUES = [
  { icon: "🎯", title: "Results First", desc: "We measure success by your growth, not vanity metrics." },
  { icon: "🌍", title: "Global Mindset", desc: "Nigerian roots with a worldwide perspective on digital excellence." },
  { icon: "🤝", title: "Partnership", desc: "We treat your business like our own — your wins are our wins." },
  { icon: "⚡", title: "Speed & Quality", desc: "Fast delivery without cutting corners. That's the EmmaForYou standard." },
];

const LOCATIONS = [
  { city: "Lagos", country: "Nigeria", flag: "🇳🇬" },
  { city: "Hanover, MD", country: "USA", flag: "🇺🇸" },
  { city: "Toulon", country: "France", flag: "🇫🇷" },
  { city: "Halle", country: "Germany", flag: "🇩🇪" },
  { city: "Cookhouse", country: "South Africa", flag: "🇿🇦" },
];

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () =>
    pageHead({
      title: "About EmmaForYou — Founder Emmanuel Akinloye Oluwaseun",
      description: "From a laptop in Nigeria to 3 continents: the story of founder Emmanuel Akinloye Oluwaseun and how EmmaForYou helps businesses grow.",
      path: "/about",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }]), founderLd()],
    }),
});

function AboutPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative flex min-h-[60vh] items-center justify-center pt-20" style={{ background: "var(--gradient-dark)" }}>
          <div className="relative mx-auto max-w-4xl px-5 py-20 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 font-body text-xs font-medium text-white/70">
              Our Story
            </span>
            <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-white md:text-6xl">
              One Vision. Three Continents.{" "}
              <span className="gradient-text-gold">Unlimited Growth.</span>
            </h1>
          </div>
        </section>

        {/* Origin Story */}
        <section className="section-padding">
          <div className="mx-auto max-w-3xl">
            <div className="space-y-5 font-body text-base font-normal leading-relaxed text-muted-foreground">
              <p>
                Emmanuel Akinloye Oluwaseun didn't start with a team or an office. He started with a burning question: <em className="font-semibold text-foreground">"Why are Nigerian businesses being left behind in the digital age?"</em>
              </p>
              <p>
                From a small room in Nigeria, armed with nothing but a laptop and relentless drive, Emmanuel began helping local businesses get online. A fashion store here. A clinic there. Word spread fast.
              </p>
              <p>
                As clients in Lagos saw real results, referrals came from Hanover, Maryland. Then Toulon, France. Then Halle, Germany. Then Cookhouse, South Africa.
              </p>
              <p>
                What began as freelance work became something bigger — <strong className="text-foreground">EmmaForYou</strong>, a full-service digital agency built to give every business owner, regardless of location or budget, access to world-class digital tools.
              </p>
              <blockquote className="mt-8 rounded-2xl p-6" style={{ background: "var(--gradient-dark)" }}>
                <p className="font-display text-lg font-bold italic text-white">
                  "I've seen what happens when a small business gets the right digital system. They don't just survive — they dominate."
                </p>
                <cite className="mt-3 block font-body text-sm font-medium text-white/60 not-italic">
                  — Emmanuel Akinloye Oluwaseun, Founder
                </cite>
              </blockquote>
            </div>
          </div>
        </section>

        {/* Founder Card */}
        <section className="section-padding bg-muted/30">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto h-40 w-40 overflow-hidden rounded-full">
              <img
                src="/images/emmanuel.webp" width={900} height={1350} decoding="async"
                alt="Emmanuel Akinloye Oluwaseun"
                className="h-full w-full object-cover object-top"
                loading="lazy"
              />
            </div>
            <h3 className="mt-5 font-display text-2xl font-bold tracking-tight text-foreground">Emmanuel Akinloye Oluwaseun</h3>
            <p className="font-body text-sm font-normal text-muted-foreground">Founder & CEO, EmmaForYou</p>
            <p className="mx-auto mt-4 max-w-xl font-body text-sm font-normal leading-relaxed text-muted-foreground">
              Digital strategist, automation expert, and passionate advocate for African business growth. With experience serving clients across 5 countries and 50+ business niches.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="section-padding">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Our Core <span className="gradient-text">Values</span>
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {VALUES.map((v, i) => (
                <div key={i} className="gradient-border rounded-2xl p-6 text-center">
                  <span className="text-3xl">{v.icon}</span>
                  <h3 className="mt-3 font-display text-lg font-bold tracking-tight text-foreground">{v.title}</h3>
                  <p className="mt-2 font-body text-sm font-normal text-muted-foreground">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Global Presence */}
        <section className="section-padding bg-muted/30">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Global <span className="gradient-text">Presence</span>
            </h2>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              {LOCATIONS.map((loc) => (
                <div key={loc.city} className="gradient-border flex items-center gap-3 rounded-2xl bg-background px-6 py-4">
                  <span className="text-2xl">{loc.flag}</span>
                  <div className="text-left">
                    <p className="font-display text-sm font-bold text-foreground">{loc.city}</p>
                    <p className="font-body text-xs font-normal text-muted-foreground">{loc.country}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-padding text-center" style={{ background: "var(--gradient-gold)" }}>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-emma-charcoal md:text-4xl">Ready to Grow?</h2>
          <p className="mx-auto mt-3 max-w-lg font-body text-base font-normal text-emma-charcoal/70">Let's build something incredible for your business.</p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-body text-sm font-semibold text-white"
            style={{ background: "var(--gradient-dark)" }}
          >
            Work With Us →
          </a>
        </section>
      </main>
      <Footer />
    </>
  );
}
