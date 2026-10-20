import { createFileRoute } from "@tanstack/react-router";
import { handleAiStatus } from "@/lib/ai/status-handler";

export const Route = createFileRoute("/api/ai-status")({
  server: { handlers: { GET: ({ request }) => handleAiStatus(request), POST: ({ request }) => handleAiStatus(request) } },
});
