/**
 * Build manifest stamped by vite.config.ts (same values on the server and in the browser bundle).
 * `identity` is "unavailable" when the build couldn't read its own commit, so callers never
 * mistake a missing identity for a match.
 */
declare const __EFY_BUILT_AT__: string | undefined;
declare const __EFY_COMMIT__: string | undefined;
declare const __EFY_COMMIT_FULL__: string | undefined;
declare const __EFY_APP_VERSION__: string | undefined;
declare const __EFY_BUILD_ENV__: string | undefined;

const v = (x: string | undefined) => (typeof x === "string" && x && x !== "unknown" ? x : null);

export const BUILD_MANIFEST_VERSION = 1;
export const BUILD_INFO = {
  manifestVersion: BUILD_MANIFEST_VERSION,
  commit: v(typeof __EFY_COMMIT__ !== "undefined" ? __EFY_COMMIT__ : undefined),
  commitFull: v(typeof __EFY_COMMIT_FULL__ !== "undefined" ? __EFY_COMMIT_FULL__ : undefined),
  builtAt: v(typeof __EFY_BUILT_AT__ !== "undefined" ? __EFY_BUILT_AT__ : undefined),
  appVersion: v(typeof __EFY_APP_VERSION__ !== "undefined" ? __EFY_APP_VERSION__ : undefined),
  environment: v(typeof __EFY_BUILD_ENV__ !== "undefined" ? __EFY_BUILD_ENV__ : undefined),
};
export const BUILD_IDENTITY: "ok" | "unavailable" = BUILD_INFO.commit && BUILD_INFO.builtAt ? "ok" : "unavailable";
