import { createFileRoute } from "@tanstack/react-router";
import { handleEcomGuide } from "@/lib/ecom/handlers";
import { methodNotAllowed } from "@/lib/api-method";

export const Route = createFileRoute("/api/ecom-guide")({
  server: { handlers: { GET: methodNotAllowed(), POST: ({ request }) => handleEcomGuide(request) } },
});
