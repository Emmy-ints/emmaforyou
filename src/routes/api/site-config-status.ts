import { createFileRoute } from "@tanstack/react-router";
import { liveConfig, liveStatus } from "@/lib/live-config";
import { BUILD_IDENTITY, BUILD_INFO } from "@/lib/build-info";

/**
 * Public health check: which build this server is running (stamped at build time, see
 * vite.config.ts) and the state of its published-config cache. Counts and timing only — no
 * setting values, secrets or environment variables.
 */
export const Route = createFileRoute("/api/site-config-status")({
  server: {
    handlers: {
      GET: async () => {
        const cfg = await liveConfig();
        const seo = Object.keys(cfg.settings).filter((k) => k.startsWith("seo:")).length;
        return Response.json({
          identity: BUILD_IDENTITY, ...BUILD_INFO,
          instance: liveStatus.instance, settings: Object.keys(cfg.settings).length, seoOverrides: seo, redirects: cfg.redirects.length,
          loadedAt: liveStatus.loadedAt ? new Date(liveStatus.loadedAt).toISOString() : null, loads: liveStatus.loads, failures: liveStatus.failures, lastError: liveStatus.lastError || null,
        }, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
      },
    },
  },
});
