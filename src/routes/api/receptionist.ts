import { createFileRoute } from "@tanstack/react-router";
import { handleReceptionist } from "@/lib/ai/receptionist-handler";

export const Route = createFileRoute("/api/receptionist")({
  server: { handlers: { POST: ({ request }) => handleReceptionist(request) } },
});
