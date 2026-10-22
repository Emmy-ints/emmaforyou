import { createFileRoute, Link } from "@tanstack/react-router";
import LegalPage from "../components/legal/LegalPage";
import { pageHead, breadcrumbLd } from "@/lib/seo";

export const Route = createFileRoute("/cookies")({
  component: CookiesPage,
  head: () =>
    pageHead({
      title: "Cookie Policy — EmmaForYou",
      description: "What EmmaForYou stores in your browser, why, and how to clear it. No advertising cookies and no third-party trackers.",
      path: "/cookies",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Cookie policy", path: "/cookies" }])],
    }),
});

function CookiesPage() {
  return (
    <LegalPage title="Cookie policy" updated="22 October 2026">
      <p>This page explains what this website stores on your device. In short: we don't use advertising cookies, we don't use third-party tracking scripts, and we honour Do Not Track and Global Privacy Control signals. What we do store is needed to make the site work or to remember choices you made.</p>

      <h2>What we store and why</h2>
      <ul>
        <li><strong>Your sign-in session</strong>: if you sign in to your EmmaForYou account (community, client portal or dashboard), your browser keeps the session our sign-in provider issues, so you stay signed in across the site. It is removed when you sign out.</li>
        <li><strong>Your preferences</strong>: light or dark theme, language, and similar display choices.</li>
        <li><strong>Work in progress</strong>: unsent drafts and form progress (for example a community post you're writing, or the business profile form) and the settings you choose in product demos, so you don't lose them if the page reloads.</li>
        <li><strong>Visit statistics</strong>: a random visit ID kept only in the current browser tab and removed when you close it, used to count page views and button clicks without identifying you. See our <Link to="/privacy">privacy policy</Link>.</li>
      </ul>
      <p>These are stored with your browser's own storage on this website only. Other websites can't read them.</p>

      <h2>Your choices</h2>
      <p>You can clear this information at any time from your browser settings (look for "site data" or "cookies and site data"). Clearing it signs you out and resets your preferences and drafts. You can also turn on Do Not Track or Global Privacy Control, and we won't record visit statistics.</p>

      <h2>Embedded content</h2>
      <p>Some pages link to or open services such as WhatsApp. On the booking page, Calendly's booking calendar loads only after you choose "Show available times"; Calendly may then set its own cookies under its own policy. These services have their own policies, which apply once you use them.</p>

      <h2>Changes</h2>
      <p>If we change what the site stores, we'll update this page and the date at the top. Questions? <Link to="/contact">Contact us</Link>.</p>
    </LegalPage>
  );
}
