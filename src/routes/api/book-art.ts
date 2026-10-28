import { createFileRoute } from "@tanstack/react-router";
import { handleBookArt } from "@/lib/ai/book-handler";
import { methodNotAllowed } from "@/lib/api-method";

export const Route = createFileRoute("/api/book-art")({
  server: { handlers: { GET: methodNotAllowed(), POST: ({ request }) => handleBookArt(request) } },
});
