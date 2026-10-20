import { createFileRoute } from "@tanstack/react-router";
import { handleBlogTick } from "@/lib/blog-auto/handler";

export const Route = createFileRoute("/api/blog/tick")({
  server: { handlers: { GET: ({ request }) => handleBlogTick(request), POST: ({ request }) => handleBlogTick(request) } },
});
