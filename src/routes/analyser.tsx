import { createFileRoute } from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import GrowthAssessment from "../components/assessment/GrowthAssessment";
import { pageHead, breadcrumbLd } from "@/lib/seo";

export const Route = createFileRoute("/analyser")({
  component: AnalyserPage,
  head: () =>
    pageHead({
      title: "Free Business Growth Assessment — Score Your Online Presence",
      description: "Answer 8 quick questions about your online presence, marketing, website and follow-up. Get an explained growth score, three prioritised fixes and an optional free expert audit.",
      path: "/analyser",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Growth assessment", path: "/analyser" }])],
    }),
});

function AnalyserPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 pb-24 pt-32">
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">Business growth assessment</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Eight short questions about how customers find you, buy from you and hear back from you. You'll get an explained score and a prioritised plan straight away.
        </p>
        <div className="mt-10 rounded-[24px] border border-border bg-card p-5 shadow-[var(--shadow-card)] md:p-8">
          <GrowthAssessment />
        </div>
      </main>
      <Footer />
    </div>
  );
}
