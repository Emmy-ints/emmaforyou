/**
 * Owner-controlled design tokens. Stored in `site_design` (published + draft), validated in the
 * database (only these keys and value shapes), applied as CSS custom properties on <html>. Nothing
 * here can inject arbitrary CSS: every value is a colour hex or a bounded number.
 */
export type PresetId = "emmaforyou" | "titanium" | "ethereal" | "cybernetic" | "architectural" | "synthetic";
export interface Tokens { preset?: PresetId; accent?: string; accent2?: string; glass?: number; radius?: number; motion?: number; grain?: number; atmosphere?: number }

export const DEFAULTS: Required<Omit<Tokens, "preset">> = { accent: "#6d5bff", accent2: "#3dd6f5", glass: 0.7, radius: 22, motion: 1, grain: 0.035, atmosphere: 1 };

export const PRESETS: { id: PresetId; name: string; note: string; tokens: Tokens }[] = [
  { id: "emmaforyou", name: "EmmaForYou (default)", note: "Midnight ink, electric violet, signal cyan.", tokens: {} },
  { id: "titanium", name: "Titanium Future", note: "Brushed metal neutrals, tight corners, calm glass.", tokens: { accent: "#7d8bb3", accent2: "#c9d3e6", glass: 0.5, radius: 14, grain: 0.05, atmosphere: 0.7 } },
  { id: "ethereal", name: "Ethereal Intelligence", note: "Soft lavender light, deep glass, round shapes.", tokens: { accent: "#9b87ff", accent2: "#9ef0ff", glass: 0.95, radius: 30, atmosphere: 1.6, motion: 0.85 } },
  { id: "cybernetic", name: "Cybernetic Future", note: "Signal green and magenta, sharp edges, more grain.", tokens: { accent: "#00c48c", accent2: "#ff3ea5", glass: 0.6, radius: 8, grain: 0.07, motion: 1.15 } },
  { id: "architectural", name: "Architectural Future", note: "Brass and steel blue, near-square forms, little glow.", tokens: { accent: "#c8922a", accent2: "#6fa3ff", glass: 0.35, radius: 4, atmosphere: 0.45, motion: 0.8 } },
  { id: "synthetic", name: "Synthetic Intelligence", note: "Violet with a warm orange signal and livelier motion.", tokens: { accent: "#6d5bff", accent2: "#ff8a4c", glass: 0.75, radius: 22, motion: 1.25, atmosphere: 1.2 } },
];

export function resolve(t: Tokens): Required<Omit<Tokens, "preset">> & { preset: PresetId } {
  const base = PRESETS.find((p) => p.id === (t.preset ?? "emmaforyou"))?.tokens ?? {};
  const clean = Object.fromEntries(Object.entries(t).filter(([k, v]) => k !== "preset" && v !== undefined && v !== null));
  return { preset: t.preset ?? "emmaforyou", ...DEFAULTS, ...base, ...clean } as Required<Omit<Tokens, "preset">> & { preset: PresetId };
}

const hex = (v: string, fb: string) => (/^#[0-9a-f]{6}$/i.test(v) ? v : fb);
const num = (v: number, lo: number, hi: number, fb: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fb);

/** Write the tokens onto <html> (empty/default tokens remove every override). */
export function applyTokens(t: Tokens | null | undefined) {
  if (typeof document === "undefined") return;
  const s = document.documentElement.style;
  const keys = ["--emma-violet", "--emma-cyan", "--glass-k", "--radius-glass", "--motion-k", "--grain-o", "--atmos-k", "--rv-distance", "--accent-rgb"];
  if (!t || !Object.keys(t).length || (t.preset === "emmaforyou" && Object.keys(t).length === 1)) { keys.forEach((k) => s.removeProperty(k)); document.documentElement.removeAttribute("data-design"); return; }
  const r = resolve(t);
  const accent = hex(r.accent, DEFAULTS.accent);
  s.setProperty("--emma-violet", accent);
  s.setProperty("--emma-cyan", hex(r.accent2, DEFAULTS.accent2));
  s.setProperty("--glass-k", String(num(r.glass, 0, 1, 0.7) / 0.7));
  s.setProperty("--radius-glass", `${num(r.radius, 0, 40, 22)}px`);
  s.setProperty("--motion-k", String(num(r.motion, 0, 1.5, 1)));
  s.setProperty("--grain-o", String(num(r.grain, 0, 0.12, 0.035)));
  s.setProperty("--atmos-k", String(num(r.atmosphere, 0, 2, 1)));
  document.documentElement.dataset.design = r.preset;
}

export const PREVIEW_KEY = "efy_design_preview";
