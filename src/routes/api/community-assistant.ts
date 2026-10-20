import { createFileRoute } from "@tanstack/react-router";
import { handleCommunityAssistant } from "@/lib/community/assistant-handler";

export const Route = createFileRoute("/api/community-assistant")({
  server: { handlers: { POST: ({ request }) => handleCommunityAssistant(request) } },
});
