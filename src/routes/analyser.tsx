import { createFileRoute } from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AnalyserFull from "../components/AnalyserFull";

export const Route = createFileRoute("/analyser")({
  component: AnalyserPage,
  head: () => ({
    meta: [
      { title: "Free 10-Step Business Analyser — EmmaForYou" },
      { name: "description", content: "Get a free 10-step deep-dive analysis of your business. Digital health score, revenue projection, recommended services and a 90-day roadmap — delivered to WhatsApp." },
      { property: "og:title", content: "Free Business Analyser — EmmaForYou" },
      { property: "og:description", content: "Discover your digital health score, revenue projection and 90-day growth roadmap in 10 quick steps." },
      { name: "keywords", content: "business analyser, business growth, digital health score, marketing audit, EmmaForYou" },
    ],
    links: [{ rel: "canonical", href: "https://emmaforyou.com/analyser" }],
  }),
});

function AnalyserPage() {
  return (
    <>
      <Navbar />
      <main>
        <AnalyserFull />
      </main>
      <Footer />
    </>
  );
}
