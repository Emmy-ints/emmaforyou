import { createFileRoute } from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BusinessIntakeForm from "../components/intake/BusinessIntakeForm";
import { pageHead, breadcrumbLd } from "@/lib/seo";

export const Route = createFileRoute("/intake")({
  component: IntakePage,
  head: () =>
    pageHead({
      title: "Get a Custom 90-Day Growth Plan — Business Profile | EmmaForYou",
      description: "Tell us about your business, customers, goals and budget in one guided form. Emmanuel reviews every profile personally and replies with a 90-day plan.",
      path: "/intake",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Business profile", path: "/intake" }])],
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
