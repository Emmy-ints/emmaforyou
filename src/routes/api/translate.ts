import { createFileRoute } from "@tanstack/react-router";
import { handleTranslate } from "@/lib/ai/translate-handler";
import { methodNotAllowed } from "@/lib/api-method";

export const Route = createFileRoute("/api/translate")({
  server: { handlers: { GET: methodNotAllowed(), POST: ({ request }) => handleTranslate(request) } },
});
