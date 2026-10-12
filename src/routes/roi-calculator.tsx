import { createFileRoute } from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RoiCalculator from "../components/roi/RoiCalculator";
import { pageHead, breadcrumbLd } from "@/lib/seo";

export const Route = createFileRoute("/roi-calculator")({
  component: RoiPage,
  head: () =>
    pageHead({
      title: "ROI Calculator — Estimate Revenue from Faster Replies & Marketing",
      description: "Estimate the extra revenue from answering enquiries faster, automated follow-up and better marketing, with your own numbers and visible maths.",
      path: "/roi-calculator",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "ROI calculator", path: "/roi-calculator" }])],
    }),
});

function RoiPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-32">
        <div className="max-w-3xl">
          <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">ROI calculator</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            See what answering every enquiry quickly, following up automatically and attracting more of the right customers could be worth to your business. Your inputs, visible assumptions, shown maths.
          </p>
        </div>
        <div className="mt-10">
          <h2 className="sr-only">Calculate your return</h2>
          <RoiCalculator />
        </div>
      </main>
      <Footer />
    </div>
  );
}
