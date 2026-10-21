import { createFileRoute } from "@tanstack/react-router";
import { handleEcomScan } from "@/lib/ecom/handlers";

export const Route = createFileRoute("/api/ecom-scan")({
  server: { handlers: { POST: ({ request }) => handleEcomScan(request) } },
});
