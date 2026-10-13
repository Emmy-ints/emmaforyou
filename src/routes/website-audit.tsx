import { createFileRoute } from "@tanstack/react-router";
import ToolShell from "../components/tools/ToolShell";
import WebsiteAudit from "../components/tools/WebsiteAudit";
import { pageHead, breadcrumbLd } from "@/lib/seo";

const ANSWERS = [
  { q: "What does the website audit check?", a: "It loads your homepage and runs about 25 checks across five areas: speed (including Google Lighthouse Core Web Vitals on mobile), search visibility (titles, descriptions, headings, structured data, sitemap), mobile and accessibility, how easily visitors can contact or book you, and trust signals such as HTTPS and link previews." },
  { q: "Is the score the same as my Google ranking?", a: "No. The score summarises technical and conversion basics that affect how many visitors find you and get in touch. Rankings depend on many other things, including competition and content, so treat the score as a to-do list, not a prediction." },
  { q: "Why do some checks say 'could be better' when my site looks fine?", a: "The audit reads the page's code, which is what search engines and AI tools see. A site can look good to people and still be missing descriptions, headings or contact links in its code." },
  { q: "Do you store my website or results?", a: "Only if you request an expert review: then we save the address, the score and the summary with your contact details so Emmanuel can follow up." },
];

export const Route = createFileRoute("/website-audit")({
  component: Page,
  head: () =>
    pageHead({
      title: "Free AI Website Audit — Speed, SEO & Lead Score in 60 Seconds",
      description: "Get a free scored audit of your website: speed, SEO tags, mobile, contact and conversion checks, and a prioritised list of fixes, in about a minute.",
      path: "/website-audit",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Website audit", path: "/website-audit" }])],
    }),
});

function Page() {
  return (
    <ToolShell
      eyebrow="Free tool · Websites & SEO"
      title="Free AI website audit"
      intro="Paste your website address. In about a minute you'll see how fast it loads on a phone, what search engines see, whether visitors can easily contact you, and the five fixes that would bring in the most enquiries."
      answers={ANSWERS}
      width="max-w-5xl"
    >
      <WebsiteAudit />
    </ToolShell>
  );
}
