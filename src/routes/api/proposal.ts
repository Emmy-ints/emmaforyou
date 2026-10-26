import { createFileRoute } from "@tanstack/react-router";
import { handleProposal } from "@/lib/ai/proposal-handler";
import { methodNotAllowed } from "@/lib/api-method";

export const Route = createFileRoute("/api/proposal")({
  server: { handlers: { GET: methodNotAllowed(), POST: ({ request }) => handleProposal(request) } },
});
