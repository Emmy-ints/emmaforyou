/**
 * Published site settings and live redirects, read on the server (SSR) and in the browser.
 * Cached per worker/tab for a minute so every request doesn't hit the database; a slow or
 * failed read never blocks a page (it falls back to the last good copy, or to "as built").
 */
import { supabase } from "@/integrations/supabase/client";
import { setSeoOverrides } from "./seo";

export interface LiveRedirect { from_path: string; to_path: string; code: number }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface LiveConfig { settings: Record<string, any>; redirects: LiveRedirect[]; at: number }

const TTL = 60_000;
let cache: LiveConfig | null = null;
let inflight: Promise<LiveConfig> | null = null;

function timeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => { const t = setTimeout(() => reject(new Error("timeout")), ms); p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); }); });
}

async function load(): Promise<LiveConfig> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const [s, r] = await timeout(Promise.all([db.rpc("site_live_settings"), db.rpc("site_live_redirects")]), 1500);
  const next: LiveConfig = { settings: s.error || !s.data ? cache?.settings ?? {} : s.data, redirects: r.error || !Array.isArray(r.data) ? cache?.redirects ?? [] : r.data, at: Date.now() };
  const seo: Record<string, { title?: string; description?: string; noindex?: boolean }> = {};
  for (const [k, v] of Object.entries(next.settings)) if (k.startsWith("seo:/") && v && typeof v === "object") seo[k.slice(4)] = v;
  setSeoOverrides(seo);
  return next;
}

export async function liveConfig(): Promise<LiveConfig> {
  if (cache && Date.now() - cache.at < TTL) return cache;
  if (!inflight) inflight = load().then((c) => (cache = c), () => (cache = cache ? { ...cache, at: Date.now() - TTL + 10_000 } : { settings: {}, redirects: [], at: Date.now() - TTL + 10_000 })).finally(() => { inflight = null; });
  return inflight;
}

/** Regexes for every route in a TanStack route tree (static segments, $params, $ splats). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function routePatterns(tree: any): RegExp[] {
  const out: RegExp[] = [];
  let unsafe = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walk = (r: any) => {
    const full: string | undefined = r?.fullPath ?? r?.options?.path;
    if (full && !full.startsWith("/")) unsafe = true; // tree not initialised: can't trust the paths
    if (full && full !== "/") {
      const norm = full.replace(/\/$/, "") || "/";
      if (!norm.startsWith("/api/") && !/\.(xml|txt)$/.test(norm)) {
        const re = norm.split("/").map((seg) => (seg === "$" ? ".*" : seg.startsWith("$") ? "[^/]+" : seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))).join("/");
        out.push(new RegExp(`^${re}/?$`));
      }
    }
    const kids = r?.children ? (Array.isArray(r.children) ? r.children : Object.values(r.children)) : [];
    kids.forEach(walk);
  };
  walk(tree);
  return unsafe ? [] : out;
}

/** Paths that belong to a real route (static or dynamic): redirects never apply to them. Fails safe (true). */
let patterns: RegExp[] | null = null;
export async function isKnownRoute(path: string): Promise<boolean> {
  if (path === "/") return true;
  try {
    if (!patterns) { const { routeTree } = await import("../routeTree.gen"); patterns = routePatterns(routeTree); }
    if (!patterns.length) return true;
    return patterns.some((re) => re.test(path));
  } catch { return true; }
}
