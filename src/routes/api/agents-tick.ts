import { createFileRoute } from "@tanstack/react-router";
import { handleAgentsTick } from "@/lib/agents/handler";

export const Route = createFileRoute("/api/agents-tick")({
  server: { handlers: { POST: ({ request }) => handleAgentsTick(request), GET: ({ request }) => handleAgentsTick(request) } },
});
