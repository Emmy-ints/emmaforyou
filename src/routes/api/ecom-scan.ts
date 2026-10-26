import { createFileRoute } from "@tanstack/react-router";
import { handleEcomScan } from "@/lib/ecom/handlers";
import { methodNotAllowed } from "@/lib/api-method";

export const Route = createFileRoute("/api/ecom-scan")({
  server: { handlers: { GET: methodNotAllowed(), POST: ({ request }) => handleEcomScan(request) } },
});
