import { createFileRoute } from "@tanstack/react-router";
import ToolShell from "@/components/tools/ToolShell";
import MockupGenerator from "@/components/publishing/MockupGenerator";
import { pageHead, breadcrumbLd } from "@/lib/seo";

const ANSWERS = [
  {
    "q": "Which sizes are included?",
    "a": "3D eBook and paperback (1600 × 1200), tablet, phone, square and portrait posts (1080 × 1080 / 1350), stories (1080 × 1920), a header banner (1500 × 500) and a link-preview/ad size (1200 × 628)."
  },
  {
    "q": "Do I need my own cover?",
    "a": "Yes — mockups use your real cover so readers see the actual book. Design one with the free Cover Designer if you don't have it yet."
  }
];

export const Route = createFileRoute("/publishing/mockups")({
  component: Page,
  head: () =>
    pageHead({
      title: "Free 3D Book Mockup & Promo Graphics Generator",
      description: "Put your book cover on 3D eBooks, paperbacks, tablets and phones, and make launch posts, stories, banners and quote cards in the right sizes. Download PNGs or a full pack.",
      path: "/publishing/mockups",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Publishing", path: "/publishing" }, { name: "Generate book mockups", path: "/publishing/mockups" }])],
    }),
});

function Page() {
  return (
    <ToolShell eyebrow="Free tool · Mockups & graphics" title="Generate book mockups" intro="Use your own cover or one you designed here. Every format below is rendered from your cover with your words and colours, ready for your website, social media and ads." answers={ANSWERS} width="max-w-7xl">
      <MockupGenerator />
    </ToolShell>
  );
}
