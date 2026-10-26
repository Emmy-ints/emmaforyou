import { createFileRoute } from "@tanstack/react-router";
import { handleAudit } from "@/lib/ai/audit-handler";
import { methodNotAllowed } from "@/lib/api-method";

export const Route = createFileRoute("/api/audit")({
  server: { handlers: { GET: methodNotAllowed(), POST: ({ request }) => handleAudit(request) } },
});
