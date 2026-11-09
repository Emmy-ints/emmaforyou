import { createFileRoute } from "@tanstack/react-router";
import { handleCallTimes } from "@/lib/call-times-server";

export const Route = createFileRoute("/api/call-times")({
  server: { handlers: { GET: () => handleCallTimes() } },
});
