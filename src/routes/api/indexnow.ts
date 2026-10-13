import { createFileRoute } from "@tanstack/react-router";
import { handleIndexNow } from "@/lib/ai/indexnow-handler";

export const Route = createFileRoute("/api/indexnow")({
  server: { handlers: { POST: ({ request }) => handleIndexNow(request) } },
});
