import { createFileRoute } from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RoiCalculator from "../components/roi/RoiCalculator";

export const Route = createFileRoute("/roi-calculator")({
  component: RoiPage,
  head: () => ({
    meta: [
      { title: "ROI Calculator — Transparent Growth Estimate | EmmaForYou" },
      { name: "description", content: "Estimate the extra revenue from faster replies, automated follow-up and better marketing — using your own numbers and editable assumptions." },
      { property: "og:title", content: "ROI Calculator — EmmaForYou" },
      { property: "og:description", content: "See exactly how much additional revenue you can generate." },
    ],
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
          <RoiCalculator />
        </div>
      </main>
      <Footer />
    </div>
  );
}
