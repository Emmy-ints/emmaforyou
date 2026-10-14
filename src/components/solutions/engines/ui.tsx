import { useEffect, useState, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";
import { ChevronDown, ChevronUp, Plus, SlidersHorizontal, Trash2 } from "lucide-react";

/** Props every demo engine receives from the demo shell. */
export interface EngineProps {
  preset: string;
  /** Business name chosen by the visitor (or the preset's sample name). */
  brand: string;
  /** Brand accent colour chosen by the visitor. */
  accent: string;
  /** Currency chosen by the visitor ("" = the sample data's own currency). */
  currency?: string;
  /** Prefix for this demo's browser-local settings (cleared by "Reset demo"). */
  storageKey?: string;
}

/** Currency to display: the visitor's choice, else the preset's. */
export const curOf = (p: EngineProps, fallback = "USD") => p.currency || fallback;

/**
 * A demo setting that persists in this browser only (localStorage), keyed per solution.
 * "Reset demo" in the shell removes every key under the prefix and remounts the engine.
 */
export function useDemoSetting<T>(p: EngineProps, id: string, initial: T): [T, (v: T | ((old: T) => T)) => void] {
  const key = p.storageKey ? `${p.storageKey}:${id}` : "";
  const [value, setValue] = useState<T>(() => {
    if (!key) return initial;
    try { const raw = localStorage.getItem(key); if (raw != null) return JSON.parse(raw) as T; } catch { /* storage blocked */ }
    return initial;
  });
  useEffect(() => {
    if (!key) return;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked */ }
  }, [key, value]);
  return [value, setValue];
}

/** Collapsible "Demo settings" area. Changes apply to the prototype immediately. */
export function SettingsPanel({ children, summary, defaultOpen = false }: { children: ReactNode; summary?: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--demo-accent)_45%,transparent)] bg-[color-mix(in_srgb,var(--demo-accent)_4%,transparent)] p-3">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
        <SlidersHorizontal className="h-4 w-4 text-[var(--demo-accent)]" />Demo settings
        {summary && <span className="hidden text-xs font-normal text-muted-foreground sm:inline">· {summary}</span>}
        <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground transition group-open:rotate-180" />
      </summary>
      <div className="mt-3 space-y-4">{children}</div>
    </details>
  );
}

/** Editable list of names (pipeline stages, columns, statuses…). */
export function ListEditor({ label, items, onChange, min = 1, max = 8, placeholder = "New item", help }: { label: string; items: string[]; onChange: (v: string[]) => void; min?: number; max?: number; placeholder?: string; help?: string }) {
  const [draft, setDraft] = useState("");
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= items.length) return; const n = [...items]; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };
  return (
    <fieldset>
      <legend className="text-xs font-semibold text-foreground">{label}</legend>
      {help && <p className="text-[11px] text-muted-foreground">{help}</p>}
      <ol className="mt-1.5 space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            <span className="w-5 text-right text-[11px] text-muted-foreground">{i + 1}.</span>
            <input aria-label={`${label} ${i + 1}`} value={it} maxLength={32} onChange={(e) => onChange(items.map((x, k) => (k === i ? e.target.value : x)))} onBlur={(e) => { if (!e.target.value.trim()) onChange(items.map((x, k) => (k === i ? `${label.replace(/s$/, "")} ${i + 1}` : x))); }} className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none focus:border-[var(--demo-accent)]" />
            <button type="button" aria-label={`Move ${it} up`} disabled={i === 0} onClick={() => move(i, -1)} className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
            <button type="button" aria-label={`Move ${it} down`} disabled={i === items.length - 1} onClick={() => move(i, 1)} className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
            <button type="button" aria-label={`Remove ${it}`} disabled={items.length <= min} onClick={() => onChange(items.filter((_, k) => k !== i))} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-red-600 disabled:opacity-30"><Trash2 className="h-3.5 w-3.5" /></button>
          </li>
        ))}
      </ol>
      {items.length < max && (
        <form onSubmit={(e) => { e.preventDefault(); const v = draft.trim(); if (!v) return; onChange([...items, v.slice(0, 32)]); setDraft(""); }} className="mt-1.5 flex gap-1 pl-6">
          <input aria-label={`Add to ${label}`} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} maxLength={32} className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none focus:border-[var(--demo-accent)]" />
          <Btn type="submit" variant="soft" className="!px-2.5 !py-1 !text-xs" disabled={!draft.trim()}><Plus className="h-3.5 w-3.5" />Add</Btn>
        </form>
      )}
    </fieldset>
  );
}

export interface RowCol<T> { key: keyof T & string; label: string; type: "text" | "number" | "checkbox"; width?: string; min?: number; step?: number }

/** Editable table of records (products and prices, services and durations, plans…). */
export function RowsEditor<T extends { id: string }>({ label, rows, cols, onChange, make, max = 12, min = 1, help }: { label: string; rows: T[]; cols: RowCol<T>[]; onChange: (v: T[]) => void; make: () => T; max?: number; min?: number; help?: string }) {
  const set = (id: string, k: keyof T, v: unknown) => onChange(rows.map((r) => (r.id === id ? { ...r, [k]: v } : r)));
  return (
    <fieldset>
      <legend className="text-xs font-semibold text-foreground">{label}</legend>
      {help && <p className="text-[11px] text-muted-foreground">{help}</p>}
      <div className="mt-1.5 overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead><tr className="text-left text-[11px] text-muted-foreground">{cols.map((c) => <th key={c.key} className="px-1 pb-1 font-medium" style={{ width: c.width }}>{c.label}</th>)}<th className="w-8"><span className="sr-only">Remove</span></th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}>
                {cols.map((c) => (
                  <td key={c.key} className="px-1 py-0.5">
                    {c.type === "checkbox"
                      ? <input type="checkbox" aria-label={`${c.label} (row ${i + 1})`} checked={!!r[c.key]} onChange={(e) => set(r.id, c.key, e.target.checked)} className="accent-[var(--demo-accent)]" />
                      : <input aria-label={`${c.label} (row ${i + 1})`} type={c.type} min={c.min} step={c.step} value={String(r[c.key] ?? "")} maxLength={40} onChange={(e) => set(r.id, c.key, c.type === "number" ? Math.max(c.min ?? 0, Number(e.target.value) || 0) : e.target.value)} className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none focus:border-[var(--demo-accent)]" />}
                  </td>
                ))}
                <td className="px-1"><button type="button" aria-label={`Remove row ${i + 1}`} disabled={rows.length <= min} onClick={() => onChange(rows.filter((x) => x.id !== r.id))} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-red-600 disabled:opacity-30"><Trash2 className="h-3.5 w-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length < max && <Btn variant="soft" className="mt-1.5 !px-2.5 !py-1 !text-xs" onClick={() => onChange([...rows, make()])}><Plus className="h-3.5 w-3.5" />Add row</Btn>}
    </fieldset>
  );
}

/** Pick the role you're viewing the prototype as; the engine limits actions accordingly. */
export function RoleBar({ roles, value, onChange }: { roles: { id: string; label: string; can: string }[]; value: string; onChange: (v: string) => void }) {
  const cur = roles.find((r) => r.id === value) ?? roles[0];
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-foreground">Viewing as</span>
        <div role="radiogroup" aria-label="Viewing as" className="flex flex-wrap gap-1">
          {roles.map((r) => (
            <button key={r.id} type="button" role="radio" aria-checked={value === r.id} onClick={() => onChange(r.id)} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${value === r.id ? "bg-[var(--demo-accent)] text-white" : "border border-border bg-background text-foreground"}`}>{r.label}</button>
          ))}
        </div>
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">{cur.can}</p>
    </div>
  );
}

/** Checkbox group for notification preferences and optional features. */
export function Toggles({ label, options, value, onChange }: { label: string; options: [string, string][]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <fieldset>
      <legend className="text-xs font-semibold text-foreground">{label}</legend>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
        {options.map(([id, l]) => (
          <label key={id} className="flex items-center gap-1.5 text-sm text-foreground">
            <input type="checkbox" checked={value.includes(id)} onChange={(e) => onChange(e.target.checked ? [...value, id] : value.filter((x) => x !== id))} className="accent-[var(--demo-accent)]" />{l}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export interface OutboxItem { id: string; channel: string; to: string; text: string }

/** Notifications the demo *would* send. Nothing leaves the browser. */
export function Outbox({ items, onClear }: { items: OutboxItem[]; onClear?: () => void }) {
  return (
    <Panel title={`Notification preview (${items.length})`} actions={items.length > 0 && onClear ? <Btn variant="ghost" className="!px-2.5 !py-1 !text-xs" onClick={onClear}>Clear</Btn> : undefined}>
      <p className="-mt-2 mb-2 text-[11px] text-muted-foreground">Simulated: shows what would be sent in a live system. Nothing is actually sent.</p>
      {items.length === 0 ? <p className="text-sm text-muted-foreground">No notifications yet.</p> : (
        <ul className="max-h-48 space-y-1.5 overflow-y-auto text-sm">
          {items.slice().reverse().map((m) => <li key={m.id} className="rounded-lg border border-border bg-background px-2.5 py-1.5"><span className="mr-1.5"><Badge tone="accent">{m.channel}</Badge></span><span className="text-[11px] text-muted-foreground">to {m.to}</span><p className="mt-0.5">{m.text}</p></li>)}
        </ul>
      )}
    </Panel>
  );
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
