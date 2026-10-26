import { createFileRoute } from "@tanstack/react-router";
import { handleSiteRepair } from "@/lib/ai/site-repair-handler";
import { methodNotAllowed } from "@/lib/api-method";

export const Route = createFileRoute("/api/site-repair")({
  server: { handlers: { GET: methodNotAllowed(), POST: ({ request }) => handleSiteRepair(request) } },
});
