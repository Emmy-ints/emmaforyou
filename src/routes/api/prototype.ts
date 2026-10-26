import { createFileRoute } from "@tanstack/react-router";
import { handlePrototype } from "@/lib/ai/prototype-handler";
import { methodNotAllowed } from "@/lib/api-method";

export const Route = createFileRoute("/api/prototype")({
  server: { handlers: { GET: methodNotAllowed(), POST: ({ request }) => handlePrototype(request) } },
});