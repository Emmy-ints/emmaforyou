import { createFileRoute } from "@tanstack/react-router";
import { handleContractCheck } from "@/lib/ai/contract-handler";
import { methodNotAllowed } from "@/lib/api-method";

export const Route = createFileRoute("/api/contract-check")({
  server: { handlers: { GET: methodNotAllowed(), POST: ({ request }) => handleContractCheck(request) } },
});
