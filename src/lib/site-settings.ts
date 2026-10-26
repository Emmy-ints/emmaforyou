/**
 * Owner-editable site settings (control room → published values in `site_settings`).
 * Code stays the source of defaults: a missing setting means "as built". Visitors load the
 * published values once per session; staff can preview their drafts in their own browser.
 *
 * Keys: seo:/path, flag:<id>, service:<id>, project:<slug>, tool:/path, nav:/path, announce,
 * claim:<id>, countdown, i18n:<lang>:<key>. Values are validated by the database
 * (site_setting_valid), so the page treats them as plain data and only renders them as text.
 */
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SettingValue = Record<string, any>;
export type Settings = Record<string, SettingValue>;

export const PREVIEW_SETTINGS_KEY = "efy_settings_preview";
const CACHE_KEY = "efy_settings_live";
const TTL = 5 * 60 * 1000;
const EMPTY: Settings = Object.freeze({}) as Settings;

let live: Settings = EMPTY;
let preview: Settings | null = null;
let merged: Settings = EMPTY;
let started = false;
const subs = new Set<() => void>();

function recompute() { merged = preview ? { ...live, ...preview } : live; subs.forEach((f) => f()); }

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  try { const p = localStorage.getItem(PREVIEW_SETTINGS_KEY); if (p) preview = JSON.parse(p); } catch { preview = null; }
  try {
    const c = sessionStorage.getItem(CACHE_KEY);
    if (c) { const { at, v } = JSON.parse(c); if (Date.now() - at < TTL && v && typeof v === "object") { live = v; recompute(); return; } }
  } catch { /* storage blocked */ }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (supabase as any).rpc("site_live_settings").then(({ data }: { data: Settings | null }) => {
    if (data && typeof data === "object") { live = data; try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), v: data })); } catch { /* */ } }
    recompute();
  }, () => recompute());
  if (preview) recompute();
}

function subscribe(f: () => void) { start(); subs.add(f); return () => { subs.delete(f); }; }

/** All effective settings (published, plus the viewer's own draft preview if they started one). */
export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, () => merged, () => EMPTY);
}
export function useSetting<T extends SettingValue = SettingValue>(key: string): T | undefined {
  const s = useSettings();
  return s[key] as T | undefined;
}
export function isPreviewingSettings(): boolean { start(); return !!preview; }
export function setSettingsPreview(drafts: Settings | null) {
  try { if (drafts) localStorage.setItem(PREVIEW_SETTINGS_KEY, JSON.stringify(drafts)); else localStorage.removeItem(PREVIEW_SETTINGS_KEY); sessionStorage.removeItem(CACHE_KEY); } catch { /* */ }
  preview = drafts; recompute();
}
/** Forget the cached published values (after publishing) so the next read is fresh. */
export function refreshSettings() {
  try { sessionStorage.removeItem(CACHE_KEY); } catch { /* */ }
  started = false; start();
}

/** Feature switch: a section is on unless the owner turned it off. */
export function useFlag(id: string, fallback = true): boolean {
  const v = useSetting(`flag:${id}`);
  return typeof v?.on === "boolean" ? v.on : fallback;
}

/**
 * Homepage sections and features the owner can switch on and off, with release status.
 * `default` is what the code does when no setting exists.
 */
export const FEATURES: { id: string; name: string; where: string; status: "live" | "beta" | "prototype"; default: boolean }[] = [
  { id: "home-explorer", name: "Service explorer map", where: "Homepage", status: "live", default: true },
  { id: "home-finder", name: "Solution finder", where: "Homepage", status: "live", default: true },
  { id: "home-prototype", name: "Free prototype builder", where: "Homepage", status: "beta", default: true },
  { id: "home-tools", name: "Free tools hub", where: "Homepage", status: "live", default: true },
  { id: "home-testimonials", name: "Testimonials preview", where: "Homepage", status: "live", default: true },
  { id: "home-trust", name: "Partners & credentials", where: "Homepage", status: "live", default: true },
  { id: "home-countdown", name: "Monthly onboarding countdown", where: "Homepage", status: "live", default: true },
  { id: "home-stats", name: "Numbers band", where: "Homepage", status: "live", default: true },
  { id: "home-waitlist", name: "Waitlist", where: "Homepage", status: "live", default: true },
  { id: "explore-world", name: "Immersive service world (/explore)", where: "Header link + /explore", status: "beta", default: true },
  { id: "lab-gallery", name: "Published Innovation Lab tools (/lab)", where: "/lab", status: "beta", default: true },
  { id: "ask-emma", name: "Ask Emma AI button", where: "Every page", status: "live", default: true },
];
