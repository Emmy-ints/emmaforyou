import { createFileRoute } from "@tanstack/react-router";
import { handleAssistant } from "@/lib/ai/assistant-handler";
import { methodNotAllowed } from "@/lib/api-method";

export const Route = createFileRoute("/api/assistant")({
  server: { handlers: { GET: methodNotAllowed(), POST: ({ request }) => handleAssistant(request) } },
});
