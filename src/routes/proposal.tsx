import { createFileRoute } from "@tanstack/react-router";
import ToolShell from "../components/tools/ToolShell";
import ProposalBuilder from "../components/tools/ProposalBuilder";
import { pageHead, breadcrumbLd } from "@/lib/seo";

const ANSWERS = [
  { q: "How is the price in my proposal worked out?", a: "The proposal recommends one of our published monthly plans, and the price shown is exactly the price on our pricing page. One-off work such as a custom app or a full store build is listed separately and quoted after a short call, because it depends on details a form can't capture." },
  { q: "Does accepting the proposal commit me to pay?", a: "Accepting tells us you'd like to go ahead. No payment is taken on the site: we confirm the final scope with you on a kickoff call, then send the first invoice." },
  { q: "Who writes the proposal?", a: "Our AI drafts it from your answers using our real plans, timelines and process. Emmanuel reviews every accepted proposal before work starts." },
];

export const Route = createFileRoute("/proposal")({
  component: Page,
  head: () =>
    pageHead({
      title: "Instant Proposal & Quote — Your Custom Growth Plan in 20 Seconds",
      description: "Answer a few questions and get a tailored proposal: scope, phases, deliverables and the plan that fits your budget, priced from our published plans. Download or accept online.",
      path: "/proposal",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Instant proposal", path: "/proposal" }])],
    }),
});

function Page() {
  return (
    <ToolShell
      eyebrow="Free tool · Plan & pricing"
      title="Get your proposal in 20 seconds"
      intro="Tell us about your business and what you want to achieve. You'll get a written proposal with the scope, timeline, deliverables and the plan that fits your budget. Download it as a PDF, or accept it online when you're ready."
      answers={ANSWERS}
      width="max-w-4xl"
    >
      <ProposalBuilder />
    </ToolShell>
  );
}
