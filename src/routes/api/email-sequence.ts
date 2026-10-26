import { createFileRoute } from "@tanstack/react-router";
import { handleEmailSequence } from "@/lib/ai/email-handler";
import { methodNotAllowed } from "@/lib/api-method";

export const Route = createFileRoute("/api/email-sequence")({
  server: { handlers: { GET: methodNotAllowed(), POST: ({ request }) => handleEmailSequence(request) } },
});
