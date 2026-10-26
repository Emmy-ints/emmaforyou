import { createFileRoute } from "@tanstack/react-router";
import { handleMakeover } from "@/lib/ai/makeover-handler";
import { methodNotAllowed } from "@/lib/api-method";

export const Route = createFileRoute("/api/makeover")({
  server: { handlers: { GET: methodNotAllowed(), POST: ({ request }) => handleMakeover(request) } },
});
