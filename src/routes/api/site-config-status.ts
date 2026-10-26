import { createFileRoute } from "@tanstack/react-router";
import { liveConfig, liveStatus } from "@/lib/live-config";

/** Build marker for deployment checks. Bump when verifying a deploy. */
const BUILD = "2026-10-26-final";

/** Public health check of the server's published-config cache: counts and timing only, no values. */
export const Route = createFileRoute("/api/site-config-status")({
  server: {
    handlers: {
      GET: async () => {
        const cfg = await liveConfig();
        const seo = Object.keys(cfg.settings).filter((k) => k.startsWith("seo:")).length;
        return Response.json({ build: BUILD, instance: liveStatus.instance, settings: Object.keys(cfg.settings).length, seoOverrides: seo, redirects: cfg.redirects.length, loadedAt: liveStatus.loadedAt ? new Date(liveStatus.loadedAt).toISOString() : null, loads: liveStatus.loads, failures: liveStatus.failures, lastError: liveStatus.lastError || null }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
