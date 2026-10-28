import { createFileRoute } from "@tanstack/react-router";
import ToolShell from "@/components/tools/ToolShell";
import LaunchPlanner from "@/components/publishing/LaunchPlanner";
import { pageHead, breadcrumbLd } from "@/lib/seo";

const ANSWERS = [
  {
    "q": "How far ahead should I plan a book launch?",
    "a": "Ideally 8–12 weeks, so there's time for advance readers, a waitlist and content. The planner adapts if you have less time and tells you what to compress."
  },
  {
    "q": "Should I pay for reviews?",
    "a": "No. Paying for or requiring positive reviews breaks store rules. Give advance copies to readers who enjoy the genre and ask for honest reviews after launch."
  }
];

export const Route = createFileRoute("/publishing/launch-planner")({
  component: Page,
  head: () =>
    pageHead({
      title: "Free Book Launch Planner: Timeline, Checklist & Content Calendar",
      description: "Enter your launch date, channels and budget to get a dated launch checklist, content calendar and email sequence outline. Tick off tasks and export to your calendar.",
      path: "/publishing/launch-planner",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Publishing", path: "/publishing" }, { name: "Plan your book launch", path: "/publishing/launch-planner" }])],
    }),
});

function Page() {
  return (
    <ToolShell eyebrow="Free tool · Book launch strategy" title="Plan your book launch" intro="A launch plan built around your date: preparation, build-up, launch week and after. Edit any task, tick them off, add your own, and download a calendar file." answers={ANSWERS} width="max-w-7xl">
      <LaunchPlanner />
    </ToolShell>
  );
}
