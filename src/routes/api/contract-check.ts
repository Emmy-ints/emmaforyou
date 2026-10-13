import { createFileRoute } from "@tanstack/react-router";
import { handleContractCheck } from "@/lib/ai/contract-handler";

export const Route = createFileRoute("/api/contract-check")({
  server: { handlers: { POST: ({ request }) => handleContractCheck(request) } },
});
