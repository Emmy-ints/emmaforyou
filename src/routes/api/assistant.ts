import { createFileRoute } from "@tanstack/react-router";
import { handleAssistant } from "@/lib/ai/assistant-handler";

export const Route = createFileRoute("/api/assistant")({
  server: { handlers: { POST: ({ request }) => handleAssistant(request) } },
});
