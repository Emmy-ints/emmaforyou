import { createFileRoute } from "@tanstack/react-router";
import { handleBookAi } from "@/lib/ai/book-handler";
import { methodNotAllowed } from "@/lib/api-method";

export const Route = createFileRoute("/api/book-ai")({
  server: { handlers: { GET: methodNotAllowed(), POST: ({ request }) => handleBookAi(request) } },
});
