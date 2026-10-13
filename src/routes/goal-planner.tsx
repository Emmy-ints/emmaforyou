import { createFileRoute } from "@tanstack/react-router";
import ToolShell from "../components/tools/ToolShell";
import GoalPlanner from "../components/tools/GoalPlanner";
import { pageHead, breadcrumbLd } from "@/lib/seo";

const ANSWERS = [
  { q: "How do I make a 90-day plan I'll actually follow?", a: "Pick one measurable goal, break it into a monthly milestone and three to five small weekly actions, schedule them, and review progress every week with someone who will ask whether you did them. Plan for your usual obstacle in advance with if-then rules." },
  { q: "What is accountability coaching?", a: "Accountability coaching gives you weekly commitments and regular check-ins so you follow through on your plan. The coach helps remove blockers, adjusts the plan and keeps you honest." },
  { q: "Is my plan saved?", a: "No. The plan stays in your browser; download it as a PDF to keep it. We only receive your details if you ask to talk about coaching." },
];

export const Route = createFileRoute("/goal-planner")({
  component: Page,
  head: () =>
    pageHead({
      title: "Free 90-Day Goal Planner — Turn Goals Into Weekly Actions",
      description: "Describe your goal and get a 90-day plan with monthly milestones, 12 weeks of concrete actions, habits and a plan for your biggest obstacle. Free, with a PDF.",
      path: "/goal-planner",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "90-day goal planner", path: "/goal-planner" }])],
    }),
});

function Page() {
  return (
    <ToolShell
      eyebrow="Free tool · Consulting & coaching"
      title="Turn your goal into a 90-day plan"
      intro="Tell us what you want to achieve and how much time you have. You'll get monthly milestones, 12 weeks of small concrete actions, weekly habits and an if-then plan for what usually stops you."
      answers={ANSWERS}
      width="max-w-5xl"
    >
      <GoalPlanner />
    </ToolShell>
  );
}
