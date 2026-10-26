// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { execSync } from "node:child_process";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/** Stamped into the build so /api/site-config-status can prove which build is serving. */
function commit() {
  try { return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim() || "unknown"; } catch { return "unknown"; }
}

export default defineConfig({
  vite: {
    define: {
      __EFY_BUILT_AT__: JSON.stringify(new Date().toISOString()),
      __EFY_COMMIT__: JSON.stringify(commit()),
    },
  },
});
