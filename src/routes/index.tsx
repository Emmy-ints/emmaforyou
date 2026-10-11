import { ClientOnly, Link, createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageLoader from "../components/PageLoader";
import SocialProofBar from "../components/SocialProofBar";
import ProblemSection from "../components/ProblemSection";
import ServicesSection from "../components/ServicesSection";
import AnalyserTeaser from "../components/AnalyserTeaser";
import NicheShowcase from "../components/NicheShowcase";
import StatsSection from "../components/StatsSection";
import TestimonialsPreview from "../components/TestimonialsPreview";
import AboutTeaser from "../components/AboutTeaser";
import MissionSection from "../components/MissionSection";
import WaitlistSection from "../components/WaitlistSection";
import ResultsTicker from "../components/home/ResultsTicker";
import TrustBadges from "../components/home/TrustBadges";
import ComparisonTable from "../components/home/ComparisonTable";
import CountdownUrgency from "../components/home/CountdownUrgency";
import IntakeSection from "../components/home/IntakeSection";
import StrategyCallSection from "../components/home/StrategyCallSection";
import FaqAccordion from "../components/home/FaqAccordion";
import FloatingWhatsApp from "../components/home/FloatingWhatsApp";
import RoiSection from "../components/home/RoiSection";
import PrototypeBuilder from "../components/home/PrototypeBuilder";
import { Button } from "../components/ui/button";
import { useI18n } from "../lib/i18n";

const HeroScene = lazy(() => import("../components/HeroScene"));

const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1";


export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "EmmaForYou | AI Automation & Digital Growth Agency — Nigeria, USA, Europe, Africa" },
      { name: "description", content: "EmmaForYou helps fashion stores, clinics, restaurants, coaches, real estate agents and 50+ business types grow with AI automation, website design, social media management, email marketing and ecommerce solutions." },
      { property: "og:title", content: "EmmaForYou — Grow Your Business With AI" },
      { property: "og:description", content: "500+ businesses transformed. Join the waitlist." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "keywords", content: "AI automation Nigeria, digital marketing agency Lagos, website design Nigeria, social media management Nigeria, ecommerce growth Nigeria" },
    ],
    links: [
      { rel: "canonical", href: "https://emmaforyou.com" },
    ],
  }),
});

function HomePage() {
  const { t } = useI18n();
  const [loaded, setLoaded] = useState(false);
  const onLoaderComplete = useCallback(() => setLoaded(true), []);

  return (
    <>
      {!loaded && <PageLoader onComplete={onLoaderComplete} />}
      <Navbar />
      <main>
        {/* Hero */}
        <section className="interactive-hero relative overflow-hidden pt-24">
          <div className="hero-copy relative z-30 mx-auto max-w-7xl px-5 pt-8 text-center">
            <motion.span
              className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {t("hero_badge")}
            </motion.span>
            <motion.h1
              className="mt-8 font-display text-4xl font-extrabold leading-[1.1] text-foreground sm:text-5xl md:text-7xl"
              initial={{ opacity: 0, y: 40, rotateX: 15 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ perspective: 1000 }}
            >
              {t("hero_title_1")}
              <br />
              {t("hero_title_2")}
              <br />
              {t("hero_title_3")}<span className="relative inline-block">
                <span className="gradient-text">{t("hero_title_4")}</span>
                <span className="absolute -bottom-1 left-0 h-1 w-full rounded-full" style={{ background: "var(--gradient-gold)" }} />
              </span>.
            </motion.h1>
            <motion.p
              className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7 }}
            >
              {t("hero_sub")}
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
                {t("cta_start")} →
              </motion.a>
              <Button asChild variant="outline" className="h-auto rounded-full px-7 py-3.5"><Link to="/watch">▶ {t("cta_watch")}</Link></Button>
            </motion.div>

          </div>
          <ClientOnly fallback={<div className="hero-scene" />}><Suspense fallback={<div className="hero-scene" />}><HeroScene /></Suspense></ClientOnly>
        </section>
        <PrototypeBuilder />

        <SocialProofBar />
        <ResultsTicker />
        <ProblemSection />
        <ServicesSection />
        <AnalyserTeaser />
        <NicheShowcase />
        <ComparisonTable />
        <RoiSection />
        <StatsSection />
        <TestimonialsPreview />
        <TrustBadges />
        <AboutTeaser />
        <MissionSection />
        <CountdownUrgency />
        <IntakeSection />
        <StrategyCallSection />
        <FaqAccordion />
        <WaitlistSection />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
