import { createFileRoute } from "@tanstack/react-router";
import { liveConfig, liveStatus } from "@/lib/live-config";

declare const __EFY_BUILT_AT__: string | undefined;
declare const __EFY_COMMIT__: string | undefined;

/**
 * Build identity for deployment checks. builtAt and commit are stamped by vite.config.ts at build
 * time, so every deployment reports its own values (a hand-bumped label can't tell builds apart).
 */
const BUILD = "2026-10-26-r2";
const BUILT_AT = typeof __EFY_BUILT_AT__ !== "undefined" ? __EFY_BUILT_AT__ : null;
const COMMIT = typeof __EFY_COMMIT__ !== "undefined" ? __EFY_COMMIT__ : null;

/** Public health check of the server's published-config cache: counts and timing only, no values. */
export const Route = createFileRoute("/api/site-config-status")({
  server: {
    handlers: {
      GET: async () => {
        const cfg = await liveConfig();
        const seo = Object.keys(cfg.settings).filter((k) => k.startsWith("seo:")).length;
        return Response.json({ build: BUILD, builtAt: BUILT_AT, commit: COMMIT, instance: liveStatus.instance, settings: Object.keys(cfg.settings).length, seoOverrides: seo, redirects: cfg.redirects.length, loadedAt: liveStatus.loadedAt ? new Date(liveStatus.loadedAt).toISOString() : null, loads: liveStatus.loads, failures: liveStatus.failures, lastError: liveStatus.lastError || null }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
