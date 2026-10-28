import { createFileRoute } from "@tanstack/react-router";
import ToolShell from "@/components/tools/ToolShell";
import RoyaltyCalculator from "@/components/publishing/RoyaltyCalculator";
import { pageHead, breadcrumbLd } from "@/lib/seo";

const ANSWERS = [
  {
    "q": "How are KDP eBook royalties calculated?",
    "a": "On the 70% option: 70% × (list price − VAT − delivery cost), where delivery is charged per megabyte. On the 35% option: 35% × (list price − VAT). Eligibility and price bands apply."
  },
  {
    "q": "How are paperback royalties calculated?",
    "a": "Royalty rate × list price − printing cost. Printing cost is a fixed amount plus a per-page amount that depends on ink, trim and marketplace."
  }
];

export const Route = createFileRoute("/publishing/royalty-calculator")({
  component: Page,
  head: () =>
    pageHead({
      title: "Book Royalty & Publishing Cost Calculator (eBook and Paperback)",
      description: "Estimate royalties per copy, monthly earnings and break-even for eBook, paperback and direct sales. Compare scenarios with every formula and assumption shown.",
      path: "/publishing/royalty-calculator",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Publishing", path: "/publishing" }, { name: "Estimate your royalties", path: "/publishing/royalty-calculator" }])],
    }),
});

function Page() {
  return (
    <ToolShell eyebrow="Free tool · Publishing costs" title="Estimate your royalties" intro="Compare up to three scenarios — eBook at 70% or 35%, paperback with printing costs, or direct sales — with the formulas shown. Results are estimates based on your own assumptions." answers={ANSWERS} width="max-w-7xl">
      <RoyaltyCalculator />
    </ToolShell>
  );
}
