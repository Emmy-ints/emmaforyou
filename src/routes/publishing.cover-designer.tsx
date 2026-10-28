import { createFileRoute } from "@tanstack/react-router";
import ToolShell from "@/components/tools/ToolShell";
import CoverDesigner from "@/components/publishing/CoverDesigner";
import { pageHead, breadcrumbLd } from "@/lib/seo";

const ANSWERS = [
  {
    "q": "What's the difference between an eBook and a paperback cover?",
    "a": "An eBook cover is the front only (KDP recommends 2,560 × 1,600 px). A paperback cover is one file with back, spine and front plus 0.125 in bleed; its width depends on trim size, page count and paper."
  },
  {
    "q": "Is the AI drawing my cover?",
    "a": "AI suggests concepts (layout, colours, fonts, tagline) that our own designer engine draws, so text stays sharp and editable. With a free account you can also generate background artwork with an image model when it's available, or upload your own."
  },
  {
    "q": "Can I upload the print wrap straight to KDP?",
    "a": "It's a correctly sized RGB layout proof. KDP asks for CMYK images, so convert it in a design tool, or ask us to prepare the final print file."
  }
];

export const Route = createFileRoute("/publishing/cover-designer")({
  component: Page,
  head: () =>
    pageHead({
      title: "Free Book Cover Designer: eBook Covers & Paperback Wraps",
      description: "Design an eBook cover or a full paperback wrap with spine and bleed. Get cover concepts for your genre, customise type, colour and artwork, and download at KDP's sizes.",
      path: "/publishing/cover-designer",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Publishing", path: "/publishing" }, { name: "Design your book cover", path: "/publishing/cover-designer" }])],
    }),
});

function Page() {
  return (
    <ToolShell eyebrow="Free tool · Book cover design" title="Design your book cover" intro="Enter your title, author, genre and style to get cover concepts drawn with editable layouts. Adjust typography, colours and artwork, check the thumbnail, then download an eBook cover or a paperback wrap sized to your page count." answers={ANSWERS} width="max-w-7xl">
      <CoverDesigner />
    </ToolShell>
  );
}
