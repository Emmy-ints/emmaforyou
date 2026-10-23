import { createFileRoute } from "@tanstack/react-router";
import { handleInspirationTick } from "@/lib/inspiration/handler";

export const Route = createFileRoute("/api/inspiration-tick")({
  server: { handlers: { POST: ({ request }) => handleInspirationTick(request), GET: ({ request }) => handleInspirationTick(request) } },
});
