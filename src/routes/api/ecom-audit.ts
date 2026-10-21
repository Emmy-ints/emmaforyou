import { createFileRoute } from "@tanstack/react-router";
import { handleEcomAudit } from "@/lib/ecom/handlers";

export const Route = createFileRoute("/api/ecom-audit")({
  server: { handlers: { POST: ({ request }) => handleEcomAudit(request) } },
});
