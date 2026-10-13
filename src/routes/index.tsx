import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SocialProofBar from "../components/SocialProofBar";
import ProblemSection from "../components/ProblemSection";
import ServicesSection from "../components/ServicesSection";
import AnalyserTeaser from "../components/AnalyserTeaser";
import TestimonialsPreview from "../components/TestimonialsPreview";
import AboutTeaser from "../components/AboutTeaser";
import ComparisonTable from "../components/home/ComparisonTable";
import IntakeSection from "../components/home/IntakeSection";
import StrategyCallSection from "../components/home/StrategyCallSection";
import FaqAccordion from "../components/home/FaqAccordion";
import FloatingWhatsApp from "../components/home/FloatingWhatsApp";
import RoiSection from "../components/home/RoiSection";
import PrototypeBuilder from "../components/home/PrototypeBuilder";
import TransformationSlider from "../components/home/TransformationSlider";
import GrowthOS from "../components/home/GrowthOS";
import SelectedWork from "../components/home/SelectedWork";
import ToolsHub from "../components/home/ToolsHub";
import ResultsTicker from "../components/home/ResultsTicker";
import NicheShowcase from "../components/NicheShowcase";
import MissionSection from "../components/MissionSection";
import WaitlistSection from "../components/WaitlistSection";
import StatsSection from "../components/StatsSection";
import TrustBadges from "../components/home/TrustBadges";
import CountdownUrgency from "../components/home/CountdownUrgency";
import { useI18n } from "../lib/i18n";
import { homeExperienceCopy } from "../lib/home-experience-copy";
import { CheckCircle2 } from "lucide-react";
import { pageHead, itemListLd, HOME_ALTERNATES } from "@/lib/seo";
import { SERVICES } from "@/lib/services-data";


const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1";


export const Route = createFileRoute("/")({
  component: HomePage,
  head: () =>
    pageHead({
      title: "EmmaForYou — AI Automation, Websites & Digital Growth Agency",
      description: "EmmaForYou builds AI chat and booking automation, websites, online stores, email, social and ads for growing businesses in Nigeria, the USA, Europe and Africa.",
      ogDescription: "500+ businesses transformed. Join the waitlist.",
      path: "/",
      alternates: HOME_ALTERNATES,
      jsonLd: [
        itemListLd("EmmaForYou services", SERVICES.map((s) => ({ name: s.name, path: `/services/${s.slug}` }))),
      ],
    }),
});

function HomePage() {
  const { t, lang } = useI18n();
  const hx = homeExperienceCopy[lang];

  return (
    <>
      <Navbar />
      <main>
        {/* Hero: midnight band with a working demo of the product */}
        <section className="hero-ink relative overflow-hidden">
          <div className="hero-ink-grid" aria-hidden="true" />
          <div className="hero-ink-glow" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-32 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-14 lg:pb-28 lg:pt-40">
            <div className="hero-ink-copy">
              <motion.p
                className="hero-kicker"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="hero-kicker-dot" aria-hidden="true" />
                AI-native growth studio for ambitious businesses
              </motion.p>
              <motion.h1
                className="hero-ink-title"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              >
                {t("hero_title_1")} {t("hero_title_2")} {t("hero_title_3")}<span className="whitespace-nowrap">{t("hero_title_4")}.</span>
              </motion.h1>
              <motion.p
                className="hero-ink-sub"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                {t("hero_sub")}
              </motion.p>
              <motion.div
                className="mt-9 flex flex-wrap items-center gap-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.28 }}
              >
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn-gold inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[15px]">
                  {t("cta_start")}
                </a>
                <a href="#prototype" data-track="hero_try_prototype" className="hero-ghost-btn">
                  {hx.heroTry}
                </a>
              </motion.div>
              <motion.ul
                className="hero-ink-proof"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                {hx.proof.map((item) => (
                  <li key={item}><CheckCircle2 aria-hidden="true" />{item}</li>
                ))}
                <li><a href="#tools" className="underline-offset-4 hover:text-white hover:underline">Explore all free tools ↓</a></li>
              </motion.ul>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <GrowthOS />
            </motion.div>
          </div>
        </section>

        <ResultsTicker />
        <SelectedWork />
        <ToolsHub />
        <SocialProofBar />
        <PrototypeBuilder />
        <TransformationSlider />
        <ProblemSection />
        <ServicesSection />
        <NicheShowcase />
        <AnalyserTeaser />
        <RoiSection />
        <ComparisonTable />
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
