import { createFileRoute } from "@tanstack/react-router";
import { handleGoalPlan } from "@/lib/ai/goal-handler";
import { methodNotAllowed } from "@/lib/api-method";

export const Route = createFileRoute("/api/goal-plan")({
  server: { handlers: { GET: methodNotAllowed(), POST: ({ request }) => handleGoalPlan(request) } },
});
