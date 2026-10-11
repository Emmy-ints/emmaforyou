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
import { homeExperienceCopy } from "../lib/home-experience-copy";
import { CheckCircle2 } from "lucide-react";

const HeroScene = lazy(() => import("../components/HeroScene"));

const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1";


export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "EmmaForYou | AI Automation & Digital Growth Agency — Nigeria, USA, Europe, Africa" },
      { name: "description", content: "EmmaForYou helps fashion stores, clinics, restaurants, coaches, real estate agents and 50+ business types grow with AI automation, website design, social media management, email marketing and ecommerce solutions." },
      { property: "og:title", content: "EmmaForYou — Grow Your Business With AI" },
      { property: "og:description", content: "AI automation, websites and digital marketing for growing businesses. Describe your idea and get a free working prototype in under a minute." },
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
  const { t, lang } = useI18n();
  const hx = homeExperienceCopy[lang];
  const [loaded, setLoaded] = useState(false);
  const onLoaderComplete = useCallback(() => setLoaded(true), []);

  return (
    <>
      {!loaded && <PageLoader onComplete={onLoaderComplete} />}
      <Navbar />
      <main>
        {/* Hero */}
        <section className="interactive-hero relative overflow-hidden pt-24">
          <div className="hero-backdrop" aria-hidden="true" />
          <div className="hero-grid" aria-hidden="true" />
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
              className="mt-8 font-display text-[clamp(2rem,4.5vw,4.1rem)] font-extrabold leading-[1.06] text-foreground"
              initial={{ opacity: 0, y: 40, rotateX: 15 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ perspective: 1000 }}
            >
              {t("hero_title_1")}
              <br />
              {t("hero_title_2")}
              <br />
              {t("hero_title_3")}<span className="whitespace-nowrap"><span className="relative inline-block">
                <span className="gradient-text">{t("hero_title_4")}</span>
                <span className="absolute -bottom-1 left-0 h-1 w-full rounded-full" style={{ background: "var(--gradient-gold)" }} />
              </span>.</span>
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
              <Button asChild variant="outline" className="h-auto rounded-full bg-card/80 px-7 py-3.5 backdrop-blur"><a href="#prototype" data-track="hero_try_prototype">✦ {hx.heroTry}</a></Button>
            </motion.div>
            <motion.div
              className="hero-proof mt-7"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              {hx.proof.map((item) => (
                <span key={item}><CheckCircle2 aria-hidden="true" />{item}</span>
              ))}
              <Link to="/watch" className="underline-offset-4 hover:text-foreground hover:underline">▶ {t("cta_watch")}</Link>
            </motion.div>

          </div>
          <ClientOnly fallback={<div className="hero-scene" />}><Suspense fallback={<div className="hero-scene" />}><HeroScene /></Suspense></ClientOnly>
          <p className="relative z-10 mt-1 text-center text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70" aria-hidden="true">{hx.dragHint}</p>
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
