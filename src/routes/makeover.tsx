import { createFileRoute } from "@tanstack/react-router";
import ToolShell from "../components/tools/ToolShell";
import AiMakeover from "../components/tools/AiMakeover";
import { pageHead, breadcrumbLd } from "@/lib/seo";

const ANSWERS = [
  { q: "What does the AI makeover do?", a: "It reads a screenshot of your current homepage, keeps your business name, products and contact details, and designs an improved version with clearer headings, a stronger call to action and a better mobile layout. You see the before and after side by side." },
  { q: "Is the redesign a finished website?", a: "It's a working concept page to show the direction. A real rebuild adds your photos, brand fonts, pages, forms connected to your inbox or WhatsApp, analytics and SEO; that's what we do in a website project." },
  { q: "What happens to my screenshot?", a: "It's sent to our AI provider to create the design and isn't stored on our side." },
];

export const Route = createFileRoute("/makeover")({
  component: Page,
  head: () =>
    pageHead({
      title: "AI Website Makeover — See Your Site Redesigned in 60 Seconds",
      description: "Upload a screenshot of your website and watch AI redesign it live, keeping your business details. Compare before and after, pick a style, download the concept.",
      path: "/makeover",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "AI website makeover", path: "/makeover" }])],
    }),
});

function Page() {
  return (
    <ToolShell
      eyebrow="Free tool · Web design"
      title="See your website redesigned by AI"
      intro="Upload a screenshot of your homepage, pick a style, and watch a redesigned version get built live. It keeps your business name, products and contact details, and fixes the layout, hierarchy and calls to action."
      answers={ANSWERS}
    >
      <AiMakeover />
    </ToolShell>
  );
}
