import { createFileRoute } from "@tanstack/react-router";
import { handlePrototypePlan } from "@/lib/ai/prototype-plan-handler";
import { methodNotAllowed } from "@/lib/api-method";

export const Route = createFileRoute("/api/prototype-plan")({
  server: { handlers: { GET: methodNotAllowed(), POST: ({ request }) => handlePrototypePlan(request) } },
});
