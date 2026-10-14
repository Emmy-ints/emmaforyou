import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from "react";

/** Props every demo engine receives from the demo shell. */
export interface EngineProps {
  preset: string;
  /** Business name chosen by the visitor (or the preset's sample name). */
  brand: string;
  /** Brand accent colour chosen by the visitor. */
  accent: string;
}

let n = 0;
export const uid = () => `d${Date.now().toString(36)}${(n++).toString(36)}`;

export const money = (v: number, cur = "USD") => {
  try { return new Intl.NumberFormat(cur === "NGN" ? "en-NG" : cur === "EUR" ? "de-DE" : cur === "GBP" ? "en-GB" : "en-US", { style: "currency", currency: cur, maximumFractionDigits: cur === "NGN" ? 0 : 2 }).format(v); }
  catch { return `${cur} ${v.toFixed(2)}`; }
};

/** Dates relative to today so sample data never looks stale. */
export const daysFromNow = (d: number) => { const x = new Date(); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() + d); return x; };
export const fmtDate = (d: Date) => d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
export const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Deterministic pseudo-random from a string, so sample availability is stable. */
export const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; };

export function Btn({ variant = "primary", className = "", ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "soft" | "danger" }) {
  const v = variant === "primary" ? "bg-[var(--demo-accent)] text-white hover:opacity-90"
    : variant === "danger" ? "border border-red-500/40 text-red-600 hover:bg-red-500/10"
    : variant === "soft" ? "bg-[color-mix(in_srgb,var(--demo-accent)_12%,transparent)] text-[var(--demo-accent)] hover:bg-[color-mix(in_srgb,var(--demo-accent)_20%,transparent)]"
    : "border border-border text-foreground hover:border-[var(--demo-accent)]";
  return <button type="button" {...p} className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--demo-accent)] ${v} ${className}`} />;
}

export function Field({ label, className = "", ...p }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`block text-xs font-medium text-muted-foreground ${className}`}>{label}
      <input {...p} className="mt-1 block w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-[var(--demo-accent)]" />
    </label>
  );
}

export function Select({ label, options, className = "", ...p }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: (string | [string, string])[] }) {
  return (
    <label className={`block text-xs font-medium text-muted-foreground ${className}`}>{label}
      <select {...p} className="mt-1 block w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-[var(--demo-accent)]">
        {options.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return <option key={v} value={v}>{l}</option>; })}
      </select>
    </label>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "good" | "warn" | "bad" | "accent"; children: ReactNode }) {
  const t = { neutral: "bg-muted text-muted-foreground", good: "bg-emerald-500/12 text-emerald-600", warn: "bg-amber-500/15 text-amber-600", bad: "bg-red-500/12 text-red-600", accent: "bg-[color-mix(in_srgb,var(--demo-accent)_14%,transparent)] text-[var(--demo-accent)]" }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${t}`}>{children}</span>;
}

export function Panel({ title, actions, children, className = "" }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-border bg-card p-4 ${className}`}>
      {(title || actions) && <div className="mb-3 flex flex-wrap items-center justify-between gap-2">{title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}{actions}</div>}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Toast({ children }: { children: ReactNode }) {
  return <p role="status" className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">{children}</p>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{children}</p>;
}
