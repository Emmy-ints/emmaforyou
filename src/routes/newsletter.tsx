import { createFileRoute, Link } from "@tanstack/react-router";
import ToolShell from "../components/tools/ToolShell";
import NewsletterSignup from "../components/NewsletterSignup";
import { pageHead, breadcrumbLd } from "@/lib/seo";

export const Route = createFileRoute("/newsletter")({
  component: Page,
  head: () =>
    pageHead({
      title: "Newsletter — Practical Growth Notes for Business Owners",
      description: "Subscribe to EmmaForYou's newsletter: practical ideas on websites, AI automation, WhatsApp, marketing, conversion and Web3. No spam, unsubscribe any time.",
      path: "/newsletter",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Newsletter", path: "/newsletter" }])],
    }),
});

const WHAT = [
  ["New articles and guides", "When we publish something useful on websites, AI, marketing or Web3, you hear first."],
  ["Free tools and checklists", "New checklists, comparisons and free AI tools as they launch."],
  ["Short, practical ideas", "One thing you can apply this week, not long theory."],
];

function Page() {
  return (
    <ToolShell
      eyebrow="Newsletter"
      title="Practical growth notes, in your inbox"
      intro="Ideas we use with clients to win more customers: websites that convert, AI replies on WhatsApp, smarter marketing and launches that land."
      width="max-w-4xl"
      answers={[
        { q: "How often will you email?", a: "Only when we have something useful to share. Every email has a one-click unsubscribe link." },
        { q: "What do you do with my email?", a: "We use it only to send this newsletter. We don't sell or share it. See our privacy policy for details." },
        { q: "Can I get it in French or German?", a: "Yes. Subscribe from our French or German page and we'll write to you in that language where we can." },
      ]}
    >
      <NewsletterSignup source="newsletter-page" />
      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {WHAT.map(([t, d]) => (
          <li key={t} className="rounded-[20px] border border-border bg-card p-5"><h2 className="font-display font-semibold">{t}</h2><p className="mt-1.5 text-sm text-muted-foreground">{d}</p></li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-muted-foreground">Prefer to read now? Browse the <Link to="/blog" className="font-semibold text-[var(--emma-violet)]">blog</Link>, the <Link to="/checklists" className="font-semibold text-[var(--emma-violet)]">free checklists</Link> or <Link to="/compare" className="font-semibold text-[var(--emma-violet)]">honest comparisons</Link>.</p>
    </ToolShell>
  );
}
