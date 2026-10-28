import { createFileRoute } from "@tanstack/react-router";
import ToolShell from "@/components/tools/ToolShell";
import EbookCreator from "@/components/publishing/EbookCreator";
import { pageHead, breadcrumbLd } from "@/lib/seo";

const ANSWERS = [
  {
    "q": "Which eBook format do I need?",
    "a": "EPUB for eBook stores (Amazon KDP, Apple Books, Google Play Books, Kobo), a print-ready PDF at your trim size for paperbacks, and Word if you want to keep editing. You can download all three."
  },
  {
    "q": "Will my text be changed?",
    "a": "No. The creator only splits your text into chapters and reads formatting marks such as headings, bold and italic. Nothing is rewritten, and it tells you about anything it couldn't import, like images or footnotes."
  },
  {
    "q": "Is my manuscript uploaded anywhere?",
    "a": "Files are read and built in your browser. If you save the project, it's stored privately in your account; it's never published at a public link."
  },
  {
    "q": "Do I need an account?",
    "a": "No account is needed to import, organise and preview. A free account lets you download the files and save the project to continue later."
  }
];

export const Route = createFileRoute("/publishing/ebook-creator")({
  component: Page,
  head: () =>
    pageHead({
      title: "Free eBook Creator & Converter: PDF, EPUB and Word",
      description: "Turn your manuscript or Word file into a formatted eBook with chapters and a contents page. Preview every page, then download real PDF, EPUB and DOCX files.",
      path: "/publishing/ebook-creator",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Publishing", path: "/publishing" }, { name: "Create your eBook", path: "/publishing/ebook-creator" }])],
    }),
});

function Page() {
  return (
    <ToolShell eyebrow="Free tool · eBook publishing" title="Create your eBook" intro="Paste your manuscript or upload a Word file, organise chapters and the contents page, choose a page size and typography, preview the pages, and export PDF, EPUB and Word files. Your words are never rewritten." answers={ANSWERS} width="max-w-7xl">
      <EbookCreator />
    </ToolShell>
  );
}
