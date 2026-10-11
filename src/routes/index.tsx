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
import { useI18n } from "../lib/i18n";
import { homeExperienceCopy } from "../lib/home-experience-copy";
import { CheckCircle2 } from "lucide-react";


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

        <SocialProofBar />
        <PrototypeBuilder />
        <TransformationSlider />
        <ProblemSection />
        <ServicesSection />
        <AnalyserTeaser />
        <RoiSection />
        <ComparisonTable />
        <TestimonialsPreview />
        <AboutTeaser />
        <IntakeSection />
        <StrategyCallSection />
        <FaqAccordion />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
