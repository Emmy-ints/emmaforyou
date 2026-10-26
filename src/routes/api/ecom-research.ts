import { createFileRoute } from "@tanstack/react-router";
import { handleEcomResearch } from "@/lib/ecom/handlers";
import { methodNotAllowed } from "@/lib/api-method";

export const Route = createFileRoute("/api/ecom-research")({
  server: { handlers: { GET: methodNotAllowed(), POST: ({ request }) => handleEcomResearch(request) } },
});
