import { createFileRoute } from "@tanstack/react-router";
import { handleReceptionist } from "@/lib/ai/receptionist-handler";
import { methodNotAllowed } from "@/lib/api-method";

export const Route = createFileRoute("/api/receptionist")({
  server: { handlers: { GET: methodNotAllowed(), POST: ({ request }) => handleReceptionist(request) } },
});
