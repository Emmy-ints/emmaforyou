import { createFileRoute } from "@tanstack/react-router";
import { handleShowcase } from "@/lib/ai/showcase-handler";
import { methodNotAllowed } from "@/lib/api-method";

export const Route = createFileRoute("/api/showcase")({
  server: { handlers: { GET: methodNotAllowed(), POST: ({ request }) => handleShowcase(request), DELETE: ({ request }) => handleShowcase(request) } },
});
