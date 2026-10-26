import { createFileRoute } from "@tanstack/react-router";
import { handleCommunityAssistant } from "@/lib/community/assistant-handler";
import { methodNotAllowed } from "@/lib/api-method";

export const Route = createFileRoute("/api/community-assistant")({
  server: { handlers: { GET: methodNotAllowed(), POST: ({ request }) => handleCommunityAssistant(request) } },
});
