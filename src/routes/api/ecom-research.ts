import { createFileRoute } from "@tanstack/react-router";
import { handleEcomResearch } from "@/lib/ecom/handlers";

export const Route = createFileRoute("/api/ecom-research")({
  server: { handlers: { POST: ({ request }) => handleEcomResearch(request) } },
});
