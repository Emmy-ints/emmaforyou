import { createFileRoute } from "@tanstack/react-router";
import { handleEcomAudit } from "@/lib/ecom/handlers";
import { methodNotAllowed } from "@/lib/api-method";

export const Route = createFileRoute("/api/ecom-audit")({
  server: { handlers: { GET: methodNotAllowed(), POST: ({ request }) => handleEcomAudit(request) } },
});
