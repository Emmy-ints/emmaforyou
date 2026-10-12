import { createFileRoute } from "@tanstack/react-router";
import LegalPage from "../components/legal/LegalPage";
import { pageHead, breadcrumbLd } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () =>
    pageHead({
      title: "Privacy Policy — EmmaForYou",
      description: "What information EmmaForYou collects through this website, why, where it is stored, how long it is kept and how to have it deleted.",
      path: "/privacy",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Privacy policy", path: "/privacy" }])],
    }),
});

function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="11 October 2026">
      <p>This policy explains what information EmmaForYou ("we") collects through this website, why we collect it, and the choices you have. If anything is unclear, message us on WhatsApp or email and we'll explain.</p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Details you give us</strong> — when you use a form (the growth assessment, ROI calculator, service enquiries, business profile, free resources, quiz, waitlist or affiliate sign-up), we store what you enter, such as your name, business name, WhatsApp number, email and your answers.</li>
        <li><strong>Prototype requests</strong> — the description you type into the prototype builder is sent to an AI service to generate your preview. We keep a one-way, anonymised fingerprint of your connection (not your IP address) for one hour to apply the usage limit.</li>
        <li><strong>Site usage</strong> — we record which pages are viewed and which buttons are used, together with the referring website, campaign tags, device type and language. A random visit ID is kept in your browser tab and removed when you close it. We don't use advertising cookies or third-party trackers, and we honour Do Not Track and Global Privacy Control signals.</li>
        <li><strong>Client portal and dashboard</strong> — if you create an account, we store your email and the information needed to run your projects.</li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To reply to your enquiry and prepare the plan, audit or quote you asked for.</li>
        <li>To deliver and support services you've agreed to.</li>
        <li>To understand which parts of the website are useful, so we can improve it.</li>
      </ul>
      <p>We don't sell your information, and we only contact you about what you asked us for unless you agree to more.</p>

      <h2>Where it's stored and who processes it</h2>
      <p>Information is stored in our secure database hosted by our cloud provider. New enquiries are emailed to us through our email delivery provider. Prototype descriptions are processed by our AI provider to generate previews. These providers process data only on our behalf.</p>

      <h2>How long we keep it</h2>
      <p>Enquiries are kept for up to 24 months so we can follow up and serve you, unless you ask us to delete them sooner. Client project data is kept for as long as we work together and as required by law afterwards. Usage statistics are kept in aggregate.</p>

      <h2>Your rights</h2>
      <p>You can ask to see, correct or delete the information we hold about you, or tell us to stop contacting you, at any time. Message us on WhatsApp or email and we'll act within 30 days. Depending on where you live (for example under Nigeria's Data Protection Act, the UK or EU GDPR, or US state laws), you may also have the right to complain to your data protection authority.</p>

      <h2>Changes</h2>
      <p>If we change how we use your information, we'll update this page and the date at the top.</p>
    </LegalPage>
  );
}
