import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageLoader from "../components/PageLoader";
import SocialProofBar from "../components/SocialProofBar";
import ProblemSection from "../components/ProblemSection";
import ServicesSection from "../components/ServicesSection";
import NicheShowcase from "../components/NicheShowcase";
import StatsSection from "../components/StatsSection";
import TestimonialsPreview from "../components/TestimonialsPreview";
import AboutTeaser from "../components/AboutTeaser";
import MissionSection from "../components/MissionSection";
import WaitlistSection from "../components/WaitlistSection";

const HeroScene = lazy(() => import("../components/HeroScene"));

const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1";

const FLOATING_PILLS = [
  "AI Automation", "Web Design", "Email Marketing", "Social Media",
  "Ecommerce", "App Dev", "Ad Marketing",
];

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "EmmaForYou | AI Automation & Digital Growth Agency — Nigeria, USA, Europe, Africa" },
      { name: "description", content: "EmmaForYou helps fashion stores, clinics, restaurants, coaches, real estate agents and 50+ business types grow with AI automation, website design, social media management, email marketing and ecommerce solutions." },
      { property: "og:title", content: "EmmaForYou — Grow Your Business With AI" },
      { property: "og:description", content: "500+ businesses transformed. Join the waitlist." },
      { name: "keywords", content: "AI automation Nigeria, digital marketing agency Lagos, website design Nigeria, social media management Nigeria, ecommerce growth Nigeria" },
    ],
    links: [
      { rel: "canonical", href: "https://emmaforyou.com" },
    ],
  }),
});

function HomePage() {
  const [loaded, setLoaded] = useState(false);
  const onLoaderComplete = useCallback(() => setLoaded(true), []);

  return (
    <>
      {!loaded && <PageLoader onComplete={onLoaderComplete} />}
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative flex min-h-screen items-center overflow-hidden pt-20">
          <Suspense fallback={null}>
            <HeroScene />
          </Suspense>
          <div className="relative mx-auto max-w-7xl px-5 py-20 text-center">
            <motion.span
              className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              🌍 Trusted by businesses across 3 continents
            </motion.span>
            <motion.h1
              className="mt-8 font-display text-4xl font-extrabold leading-[1.1] text-foreground sm:text-5xl md:text-7xl"
              initial={{ opacity: 0, y: 40, rotateX: 15 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ perspective: 1000 }}
            >
              Your Business Deserves
              <br />
              To Be Found, Followed
              <br />
              & <span className="relative inline-block">
                <span className="gradient-text">Fully Automated</span>
                <span className="absolute -bottom-1 left-0 h-1 w-full rounded-full" style={{ background: "var(--gradient-gold)" }} />
              </span>.
            </motion.h1>
            <motion.p
              className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7 }}
            >
              We help fashion stores, clinics, restaurants, coaches, real estate agents and 50+ business types across Nigeria, USA, Europe and Africa grow faster with AI automation, stunning websites, and digital marketing that actually works.
            </motion.p>
            <motion.div
              className="mt-8 flex flex-wrap items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              <motion.a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold"
                whileHover={{ scale: 1.06, y: -3 }}
                whileTap={{ scale: 0.96 }}
              >
                Start Growing My Business →
              </motion.a>
              <motion.button
                className="btn-ghost inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
              >
                ▶ Watch How It Works
              </motion.button>
            </motion.div>

            {/* Floating pills */}
            <motion.div
              className="mt-14 flex flex-wrap justify-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.3 }}
            >
              {FLOATING_PILLS.map((pill, i) => (
                <motion.span
                  key={pill}
                  className="rounded-full bg-background/80 px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm border border-border"
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.4 + i * 0.1 }}
                  whileHover={{ y: -8, scale: 1.1, rotate: 3 }}
                  style={{ animation: `float-slow 6s ease-in-out infinite ${i * 0.5}s` }}
                >
                  {pill}
                </motion.span>
              ))}
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              className="mt-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              style={{ animation: "bounce-down 2s ease-in-out infinite" }}
            >
              <svg className="mx-auto h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </motion.div>
          </div>
        </section>

        <SocialProofBar />
        <ProblemSection />
        <ServicesSection />
        <NicheShowcase />
        <StatsSection />
        <TestimonialsPreview />
        <AboutTeaser />
        <MissionSection />
        <WaitlistSection />
      </main>
      <Footer />
    </>
  );
}
