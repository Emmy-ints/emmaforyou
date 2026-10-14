import { Suspense, useEffect, useState } from "react";
import { Check, Info, Loader2, RotateCcw, SlidersHorizontal } from "lucide-react";
import { ENGINES } from "./engines/registry";
import type { Solution } from "@/lib/solutions/types";

const SWATCHES = [["Violet", "#6d5bff"], ["Blue", "#2563eb"], ["Teal", "#0f766e"], ["Pink", "#db2777"], ["Orange", "#c2410c"], ["Green", "#15803d"], ["Charcoal", "#1f2937"]] as const;
const CURRENCIES = [["", "Sample default"], ["USD", "US dollar ($)"], ["NGN", "Naira (₦)"], ["EUR", "Euro (€)"], ["GBP", "Pound (£)"], ["GHS", "Cedi (GH₵)"], ["KES", "Shilling (KSh)"], ["ZAR", "Rand (R)"]] as const;
const KEY = "efy_demo_brand";
const DEFAULT = { brand: "Your Business", accent: "#6d5bff", currency: "" };

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null");
    if (v && typeof v.brand === "string" && typeof v.accent === "string") {
      return {
        brand: v.brand.slice(0, 40),
        accent: SWATCHES.some(([, c]) => c === v.accent) ? v.accent : DEFAULT.accent,
        currency: CURRENCIES.some(([c]) => c === v.currency) ? String(v.currency) : "",
      };
    }
  } catch { /* storage blocked */ }
  return DEFAULT;
}

/** Remove this solution's saved demo settings (records, stages, products, roles…). */
function clearSettings(prefix: string) {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(`${prefix}:`)) keys.push(k); }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch { /* storage blocked */ }
}

/** Wraps a demo engine with customisation (business name, brand colour), reset and a clear "demo vs production" note. */
export default function DemoShell({ solution }: { solution: Solution }) {
  const engine = ENGINES[solution.demo.engine];
  const [mounted, setMounted] = useState(false);
  const [brand, setBrand] = useState(DEFAULT.brand);
  const [accent, setAccent] = useState(DEFAULT.accent);
  const [currency, setCurrency] = useState(DEFAULT.currency);
  const storageKey = `efy_demo_s_${solution.slug}`;
  const [run, setRun] = useState(0);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => { const v = load(); setBrand(v.brand); setAccent(v.accent); setCurrency(v.currency); setMounted(true); }, []);
  useEffect(() => { if (!mounted) return; try { localStorage.setItem(KEY, JSON.stringify({ brand, accent, currency })); } catch { /* storage blocked */ } }, [brand, accent, currency, mounted]);

  // Full reset: brand, colour, currency, this demo's saved settings, and all records/filters/workflow state (remount).
  const reset = () => { clearSettings(storageKey); setBrand(DEFAULT.brand); setAccent(DEFAULT.accent); setCurrency(DEFAULT.currency); setRun((r) => r + 1); setResetDone(true); window.setTimeout(() => setResetDone(false), 2000); };
  const Engine = engine.component;
  const name = brand.trim() || DEFAULT.brand;

  return (
    <div className="overflow-hidden rounded-[24px] border border-border bg-background shadow-[var(--shadow-card)]" style={{ ["--demo-accent" as string]: accent }}>
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/50 px-4 py-3">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><SlidersHorizontal className="h-4 w-4" />Customise</span>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">Business name
          <input value={brand} onChange={(e) => setBrand(e.target.value.slice(0, 40))} className="w-44 rounded-lg border border-border bg-background px-2.5 py-1 text-sm text-foreground outline-none focus:border-[var(--demo-accent)]" />
        </label>
        <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Brand colour">
          {SWATCHES.map(([label, c]) => (
            <button key={c} type="button" role="radio" aria-checked={accent === c} aria-label={label} title={label} onClick={() => setAccent(c)} className="flex h-6 w-6 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition hover:scale-110 focus-visible:ring-2 focus-visible:ring-[var(--demo-accent)]" style={{ background: c, boxShadow: accent === c ? `0 0 0 2px var(--background), 0 0 0 4px ${c}` : undefined }}>
              {accent === c && <Check className="h-3.5 w-3.5 text-white" />}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">Currency
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-[var(--demo-accent)]">
            {CURRENCIES.map(([c, l]) => <option key={c} value={c}>{l}</option>)}
          </select>
        </label>
        <button type="button" onClick={reset} className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:border-[var(--demo-accent)]"><RotateCcw className="h-3.5 w-3.5" />{resetDone ? "Reset ✓" : "Reset demo"}</button>
      </div>
      <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-[11px] text-muted-foreground"><Info className="h-3.5 w-3.5 shrink-0" />Interactive prototype with sample data. Your changes are kept in this browser only; nothing is saved to a server or sent to anyone. Open "Demo settings" inside the demo to change stages, products, prices, roles and rules.</div>
      <div className="p-4 sm:p-5" aria-live="off">
        {mounted ? (
          <Suspense fallback={<div className="flex h-64 items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading the demo…</div>}>
            <Engine key={run} preset={solution.demo.preset} brand={name} accent={accent} currency={currency} storageKey={storageKey} />
          </Suspense>
        ) : <div className="flex h-64 items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading the demo…</div>}
      </div>
      <div className="grid gap-4 border-t border-border bg-muted/40 px-4 py-4 text-sm sm:grid-cols-2 sm:px-5">
        <div><p className="font-semibold text-foreground">What this demo shows</p><ul className="mt-1.5 space-y-1 text-muted-foreground">{engine.demonstrated.map((d) => <li key={d} className="flex gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />{d}</li>)}</ul></div>
        <div><p className="font-semibold text-foreground">Added in the full build for your business</p><ul className="mt-1.5 space-y-1 text-muted-foreground">{engine.production.map((d) => <li key={d} className="flex gap-1.5"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--demo-accent)]" />{d}</li>)}</ul></div>
      </div>
    </div>
  );
}
