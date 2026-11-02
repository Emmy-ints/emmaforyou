import { createFileRoute } from "@tanstack/react-router";
import { handleInternProfile } from "@/lib/ai/intern-handler";
import { methodNotAllowed } from "@/lib/api-method";

export const Route = createFileRoute("/api/intern-profile")({
  server: { handlers: { GET: methodNotAllowed(), POST: ({ request }) => handleInternProfile(request) } },
});
