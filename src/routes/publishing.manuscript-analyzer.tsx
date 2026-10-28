import { createFileRoute } from "@tanstack/react-router";
import ToolShell from "@/components/tools/ToolShell";
import ManuscriptAnalyzer from "@/components/publishing/ManuscriptAnalyzer";
import { pageHead, breadcrumbLd } from "@/lib/seo";

const ANSWERS = [
  {
    "q": "Is the readability score a grade of my writing?",
    "a": "No. Formulas like Flesch Reading Ease only measure sentence and word length. Many great books score 'difficult'. Use them to spot passages that may be harder to read than you intend."
  },
  {
    "q": "Is my text kept?",
    "a": "Statistics are calculated in your browser. AI notes send the sample to our server and AI provider for that request only. Nothing is stored unless you save the report to your account."
  }
];

export const Route = createFileRoute("/publishing/manuscript-analyzer")({
  component: Page,
  head: () =>
    pageHead({
      title: "Free Manuscript & Chapter Analyzer: Readability and Editorial Notes",
      description: "Paste a chapter to measure readability, sentence length, passive voice, adverbs and repetition with formulas shown, and get AI-assisted editorial notes on clarity, structure and your opening hook.",
      path: "/publishing/manuscript-analyzer",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Publishing", path: "/publishing" }, { name: "Analyse your chapter", path: "/publishing/manuscript-analyzer" }])],
    }),
});

function Page() {
  return (
    <ToolShell eyebrow="AI-assisted tool · Manuscript feedback" title="Analyse your chapter" intro="Measured statistics with every formula shown, plus optional AI editorial notes that quote your own text. Feedback, not a professional edit — and nothing is rewritten." answers={ANSWERS} width="max-w-7xl">
      <ManuscriptAnalyzer />
    </ToolShell>
  );
}
