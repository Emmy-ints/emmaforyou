import { createFileRoute } from "@tanstack/react-router";
import { handleTranslate } from "@/lib/ai/translate-handler";

export const Route = createFileRoute("/api/translate")({
  server: { handlers: { POST: ({ request }) => handleTranslate(request) } },
});
