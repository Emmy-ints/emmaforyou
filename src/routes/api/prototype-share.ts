import { createFileRoute } from "@tanstack/react-router";
import { handlePrototypeShare } from "@/lib/ai/prototype-share-handler";
import { methodNotAllowed } from "@/lib/api-method";

export const Route = createFileRoute("/api/prototype-share")({
  server: { handlers: { GET: methodNotAllowed(), POST: ({ request }) => handlePrototypeShare(request) } },
});
