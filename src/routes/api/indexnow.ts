import { createFileRoute } from "@tanstack/react-router";
import { handleIndexNow } from "@/lib/ai/indexnow-handler";
import { methodNotAllowed } from "@/lib/api-method";

export const Route = createFileRoute("/api/indexnow")({
  server: { handlers: { GET: methodNotAllowed(), POST: ({ request }) => handleIndexNow(request) } },
});
