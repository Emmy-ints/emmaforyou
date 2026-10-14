import { createFileRoute } from "@tanstack/react-router";
import { handleEmailSequence } from "@/lib/ai/email-handler";

export const Route = createFileRoute("/api/email-sequence")({
  server: { handlers: { POST: ({ request }) => handleEmailSequence(request) } },
});
