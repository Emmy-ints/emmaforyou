import { createFileRoute } from "@tanstack/react-router";
import ToolShell from "@/components/tools/ToolShell";
import ReadinessChecker from "@/components/publishing/ReadinessChecker";
import { pageHead, breadcrumbLd } from "@/lib/seo";

const ANSWERS = [
  {
    "q": "Does this replace the store's checks?",
    "a": "No. It catches common problems early. Stores run their own validation and previewers on upload; always page through your files there before publishing."
  }
];

export const Route = createFileRoute("/publishing/readiness-checker")({
  component: Page,
  head: () =>
    pageHead({
      title: "Publishing Readiness Checker: Manuscript, Cover & Listing",
      description: "Check your manuscript file, eBook cover and listing details against common platform requirements before you upload. See what we checked and what needs the platform or a person.",
      path: "/publishing/readiness-checker",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Publishing", path: "/publishing" }, { name: "Check your book", path: "/publishing/readiness-checker" }])],
    }),
});

function Page() {
  return (
    <ToolShell eyebrow="Free tool · Publishing readiness" title="Check your book" intro="Upload your manuscript (.docx, .epub, .pdf) and cover, add your listing details, and see clear results — separated into what this tool measured, what only the store can confirm, and what needs human judgement." answers={ANSWERS} width="max-w-7xl">
      <ReadinessChecker />
    </ToolShell>
  );
}
