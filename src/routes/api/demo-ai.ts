import { createFileRoute } from "@tanstack/react-router";
import { handleDemoAi } from "@/lib/ai/demo-handler";

export const Route = createFileRoute("/api/demo-ai")({
  server: { handlers: { POST: ({ request }) => handleDemoAi(request) } },
});
