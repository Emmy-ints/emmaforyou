import { createFileRoute } from "@tanstack/react-router";
import { handleHttpCheck } from "@/lib/ai/http-check-handler";
import { methodNotAllowed } from "@/lib/api-method";

export const Route = createFileRoute("/api/http-check")({
  server: { handlers: { GET: methodNotAllowed(), POST: ({ request }) => handleHttpCheck(request) } },
});
