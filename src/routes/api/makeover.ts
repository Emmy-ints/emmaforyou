import { createFileRoute } from "@tanstack/react-router";
import { handleMakeover } from "@/lib/ai/makeover-handler";

export const Route = createFileRoute("/api/makeover")({
  server: { handlers: { POST: ({ request }) => handleMakeover(request) } },
});
