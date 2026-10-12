import { createFileRoute } from "@tanstack/react-router";
import LegalPage from "../components/legal/LegalPage";
import { pageHead, breadcrumbLd } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () =>
    pageHead({
      title: "Terms of Use — EmmaForYou",
      description: "The terms for using the EmmaForYou website, its free tools and AI prototype builder.",
      path: "/terms",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Terms of use", path: "/terms" }])],
    }),
});

function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="11 October 2026">
      <p>These terms cover your use of this website and its free tools. Paid work is covered by the proposal or agreement we send you before any project starts.</p>

      <h2>Free tools are estimates</h2>
      <p>The ROI calculator, growth assessment and other tools give estimates and general recommendations based on the information you enter and the assumptions shown. They are not guarantees of results, and they aren't financial, legal or professional advice for your specific situation.</p>

      <h2>AI prototypes</h2>
      <p>Prototypes made with the prototype builder are quick, automatically generated concepts for illustration. They may contain mistakes, aren't production-ready, and don't take real bookings, orders or payments. Please don't enter personal or confidential information into the prototype builder. Usage is limited per visitor to keep the service fair.</p>

      <h2>Acceptable use</h2>
      <p>Don't use the website or its tools to break the law, to create harmful or misleading content, to try to access systems or data you aren't allowed to, or to overload the service.</p>

      <h2>Content and examples</h2>
      <p>Product interfaces, before-and-after comparisons and dashboards marked as demos or sample data are illustrations of the kind of systems we build, not records of a specific client's results.</p>

      <h2>Liability</h2>
      <p>We work hard to keep the website accurate and available, but we can't promise it will always be error-free or uninterrupted. To the extent allowed by law, we aren't liable for losses arising from use of the free website tools.</p>

      <h2>Contact</h2>
      <p>Questions about these terms? Message us on WhatsApp or email and we'll help.</p>
    </LegalPage>
  );
}
