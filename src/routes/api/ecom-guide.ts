import { createFileRoute } from "@tanstack/react-router";
import { handleEcomGuide } from "@/lib/ecom/handlers";

export const Route = createFileRoute("/api/ecom-guide")({
  server: { handlers: { POST: ({ request }) => handleEcomGuide(request) } },
});
