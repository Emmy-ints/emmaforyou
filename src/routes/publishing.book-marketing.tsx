import { createFileRoute } from "@tanstack/react-router";
import ToolShell from "@/components/tools/ToolShell";
import MarketingAssistant from "@/components/publishing/MarketingAssistant";
import { pageHead, breadcrumbLd } from "@/lib/seo";

const ANSWERS = [
  {
    "q": "Can I use AI-written descriptions on Amazon?",
    "a": "You're responsible for your listing, so treat drafts as a starting point and edit them in your voice. Make sure every claim is true."
  },
  {
    "q": "How many keywords does KDP allow?",
    "a": "Up to seven keywords or short phrases. Avoid words already in your title or categories, quality claims, other authors' names and Amazon programme names."
  }
];

export const Route = createFileRoute("/publishing/book-marketing")({
  component: Page,
  head: () =>
    pageHead({
      title: "AI Book Description & Marketing Assistant (KDP-Ready)",
      description: "Draft a book description, taglines, author bio, 7 keywords, category ideas, social captions and launch emails from your summary, checked against KDP's listing rules.",
      path: "/publishing/book-marketing",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Publishing", path: "/publishing" }, { name: "Improve your book description", path: "/publishing/book-marketing" }])],
    }),
});

function Page() {
  return (
    <ToolShell eyebrow="AI tool · Book metadata & marketing" title="Improve your book description" intro="Give a summary, genre and audience. AI drafts the pieces you choose; you edit everything. Drafts are checked for things KDP doesn't allow, such as reviews, links and bestseller claims." answers={ANSWERS} width="max-w-7xl">
      <MarketingAssistant />
    </ToolShell>
  );
}
