import { createFileRoute } from "@tanstack/react-router";
import { handleProposal } from "@/lib/ai/proposal-handler";

export const Route = createFileRoute("/api/proposal")({
  server: { handlers: { POST: ({ request }) => handleProposal(request) } },
});
