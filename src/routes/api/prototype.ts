import { createFileRoute } from "@tanstack/react-router";
import { handlePrototype } from "@/lib/ai/prototype-handler";

export const Route = createFileRoute("/api/prototype")({
  server: { handlers: { POST: ({ request }) => handlePrototype(request) } },
});