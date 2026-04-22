import { createFileRoute } from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BusinessIntakeForm from "../components/intake/BusinessIntakeForm";

export const Route = createFileRoute("/intake")({
  component: IntakePage,
  head: () => ({
    meta: [
      { title: "Business Intake — Get Your Custom Growth Plan | EmmaForYou" },
      { name: "description", content: "Tell us about your business and we'll build a custom 90-day growth plan. Takes 5 minutes. Personal review by Emmanuel and the EmmaForYou team." },
      { property: "og:title", content: "Business Intake — Custom Growth Plan | EmmaForYou" },
      { property: "og:description", content: "Submit your business profile and get a custom plan within 24 hours." },
    ],
  }),
});

function IntakePage() {
  return (
    <>
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-10 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emma-blue">
              ✨ Personal Onboarding
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight md:text-6xl">
              Tell us about your business —<br/>
              <span className="gradient-text">we'll build your custom plan.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground">
              Takes 5 minutes. No commitment. Our team reviews every submission personally and sends your plan to WhatsApp within 24 hours.
            </p>
          </div>
          <BusinessIntakeForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
