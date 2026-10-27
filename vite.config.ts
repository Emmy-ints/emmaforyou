// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/**
 * Build manifest, read from the actual build environment and stamped into the bundle so the
 * running deployment can say exactly which code it is (/api/site-config-status). Values that
 * can't be determined are "unknown" — never a guessed or hand-typed label.
 */
function git(args: string) {
  try { return execSync(`git ${args}`, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim() || "unknown"; } catch { return "unknown"; }
}
function appVersion() {
  try { return String(JSON.parse(readFileSync("package.json", "utf8")).version ?? "unknown"); } catch { return "unknown"; }
}
const COMMIT_FULL = git("rev-parse HEAD");

export default defineConfig({
  vite: {
    define: {
      __EFY_BUILT_AT__: JSON.stringify(new Date().toISOString()),
      __EFY_COMMIT__: JSON.stringify(COMMIT_FULL === "unknown" ? "unknown" : COMMIT_FULL.slice(0, 7)),
      __EFY_COMMIT_FULL__: JSON.stringify(COMMIT_FULL),
      __EFY_APP_VERSION__: JSON.stringify(appVersion()),
      __EFY_BUILD_ENV__: JSON.stringify(process.env.NODE_ENV || "production"),
    },
  },
});
