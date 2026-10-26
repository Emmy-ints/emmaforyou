import { createFileRoute } from "@tanstack/react-router";
import { handleSiteRepair } from "@/lib/ai/site-repair-handler";

export const Route = createFileRoute("/api/site-repair")({
  server: { handlers: { POST: ({ request }) => handleSiteRepair(request) } },
});
