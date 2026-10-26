/**
 * Owner-controlled design tokens. Stored in `site_design` (published + draft), validated in the
 * database (only these keys and value shapes), applied as CSS custom properties on <html>. Nothing
 * here can inject arbitrary CSS: every value is a colour hex or a bounded number.
 */
export type PresetId = "emmaforyou" | "titanium" | "ethereal" | "cybernetic" | "architectural" | "synthetic";
export type FontId = "poppins" | "inter" | "system" | "serif";
export interface Tokens { preset?: PresetId; accent?: string; accent2?: string; glass?: number; radius?: number; motion?: number; grain?: number; atmosphere?: number; font?: FontId; shadow?: number; tint?: string; tintk?: number }

export const DEFAULTS: Required<Omit<Tokens, "preset">> = { accent: "#6d5bff", accent2: "#3dd6f5", glass: 0.7, radius: 22, motion: 1, grain: 0.035, atmosphere: 1, font: "poppins", shadow: 1, tint: "#6d5bff", tintk: 0 };

/** Display fonts that are already loaded (or built into every device), so a change never waits on a download. */
export const FONTS: { id: FontId; name: string; stack: string }[] = [
  { id: "poppins", name: "Poppins (default)", stack: "'Poppins', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" },
  { id: "inter", name: "Inter", stack: "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" },
  { id: "system", name: "Device font", stack: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
  { id: "serif", name: "Editorial serif", stack: "ui-serif, Georgia, 'Times New Roman', serif" },
];

export const PRESETS: { id: PresetId; name: string; note: string; tokens: Tokens }[] = [
  { id: "emmaforyou", name: "EmmaForYou (default)", note: "Midnight ink, electric violet, signal cyan.", tokens: {} },
  { id: "titanium", name: "Titanium Future", note: "Brushed metal neutrals, tight corners, calm glass.", tokens: { accent: "#5f6f9a", accent2: "#9fb0cf", glass: 0.5, radius: 14, grain: 0.05, atmosphere: 0.7, font: "inter", shadow: 1.2, tint: "#7d8bb3", tintk: 0.04 } },
  { id: "ethereal", name: "Ethereal Intelligence", note: "Soft lavender light, deep glass, round shapes.", tokens: { accent: "#6e57ee", accent2: "#5fd7ef", glass: 0.95, radius: 30, atmosphere: 1.6, motion: 0.85, shadow: 0.7, tint: "#b9a6ff", tintk: 0.05 } },
  { id: "cybernetic", name: "Cybernetic Future", note: "Signal green and magenta, sharp edges, more grain.", tokens: { accent: "#008a62", accent2: "#e0368f", glass: 0.6, radius: 8, grain: 0.07, motion: 1.15, font: "system", shadow: 1.4, tint: "#00c48c", tintk: 0.03 } },
  { id: "architectural", name: "Architectural Future", note: "Brass and steel blue, near-square forms, little glow.", tokens: { accent: "#94651a", accent2: "#4f86e8", glass: 0.35, radius: 4, atmosphere: 0.45, motion: 0.8, font: "serif", shadow: 0.6, tint: "#c8922a", tintk: 0.035 } },
  { id: "synthetic", name: "Synthetic Intelligence", note: "Violet with a warm orange signal and livelier motion.", tokens: { accent: "#6d5bff", accent2: "#f2733a", glass: 0.75, radius: 22, motion: 1.25, atmosphere: 1.2, shadow: 1.1, tint: "#ff8a4c", tintk: 0.025 } },
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
  const keys = ["--emma-violet", "--emma-cyan", "--glass-k", "--radius-glass", "--motion-k", "--grain-o", "--atmos-k", "--rv-distance", "--accent-rgb", "--font-sora", "--shadow-k", "--page-tint", "--tint-k"];
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
  const font = FONTS.find((f) => f.id === r.font);
  if (font && font.id !== "poppins") s.setProperty("--font-sora", font.stack); else s.removeProperty("--font-sora");
  s.setProperty("--shadow-k", String(num(r.shadow, 0, 2, 1)));
  s.setProperty("--page-tint", hex(r.tint, DEFAULTS.tint));
  s.setProperty("--tint-k", `${(num(r.tintk, 0, 0.12, 0) * 100).toFixed(1)}%`);
  document.documentElement.dataset.design = r.preset;
}

export const PREVIEW_KEY = "efy_design_preview";

/** Keys whose value differs between two token sets (for the compare view). */
export function diffTokens(a: Tokens, b: Tokens): { key: string; from: unknown; to: unknown }[] {
  const ra = resolve(a), rb = resolve(b);
  return (Object.keys(rb) as (keyof typeof rb)[]).filter((k) => ra[k] !== rb[k]).map((k) => ({ key: k, from: ra[k], to: rb[k] }));
}

/** WCAG contrast ratio of a hex colour against white and against the dark page colour. */
export function contrast(hexColor: string): { onWhite: number; onDark: number } {
  const lum = (h: string) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const ratio = (x: number, y: number) => (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  const l = lum(/^#[0-9a-f]{6}$/i.test(hexColor) ? hexColor : "#6d5bff");
  return { onWhite: ratio(l, 1), onDark: ratio(l, lum("#0b0d24")) };
}
