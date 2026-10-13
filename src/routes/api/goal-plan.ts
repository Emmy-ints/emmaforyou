import { createFileRoute } from "@tanstack/react-router";
import { handleGoalPlan } from "@/lib/ai/goal-handler";

export const Route = createFileRoute("/api/goal-plan")({
  server: { handlers: { POST: ({ request }) => handleGoalPlan(request) } },
});
