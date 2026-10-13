import { createFileRoute } from "@tanstack/react-router";
import { handleAudit } from "@/lib/ai/audit-handler";

export const Route = createFileRoute("/api/audit")({
  server: { handlers: { POST: ({ request }) => handleAudit(request) } },
});
