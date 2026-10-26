import { createFileRoute } from "@tanstack/react-router";
import { handleDemoAi } from "@/lib/ai/demo-handler";
import { methodNotAllowed } from "@/lib/api-method";

export const Route = createFileRoute("/api/demo-ai")({
  server: { handlers: { GET: methodNotAllowed(), POST: ({ request }) => handleDemoAi(request) } },
});
