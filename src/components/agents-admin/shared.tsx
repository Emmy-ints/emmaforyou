import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Shared pieces for the Agent Control Center (/dashboard/agents). Every read and write goes
 * through Supabase with the admin's own session, so the database's admin-only rules decide
 * what is allowed; nothing here is a client-side permission check.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as any;

export interface AgentRow {
  id: string; slug: string; name: string; title: string; kind: "specialist" | "general"; user_id: string | null;
  description: string; scope: string; voice: string; knowledge: string; problem_workflow: string; sales_workflow: string;
  community_strategy: string; research_strategy: string; limits: string; keywords: string[]; topics: string[]; capabilities: string[];
  enabled: boolean; reply_policy: "auto" | "review" | "off"; publish_policy: "auto" | "review" | "draft" | "off";
  posts_per_week: number; daily_reply_limit: number; monthly_token_budget: number | null; model: string | null; merged_into: string | null; sort: number;
  created_at: string; updated_at: string;
}
export interface Assignment { id: number; agent_id: string; niche_type: string; niche_key: string; is_primary: boolean; source: string }

export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []): { data: T | null; error: string; loading: boolean; reload: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [n, setN] = useState(0);
  const reload = useCallback(() => setN((x) => x + 1), []);
  useEffect(() => {
    let live = true; setLoading(true); setError("");
    fn().then((d) => { if (live) setData(d); }).catch((e) => { if (live) setError(e instanceof Error ? e.message : String(e?.message ?? e)); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [n, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
  return { data, error, loading, reload };
}

/** Throw the Supabase error (so callers show the real reason) or return data. */
export function check<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data;
}

export function Card({ title, actions, children, className = "" }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`dash-card ${className}`}>
      {(title || actions) && <div className="mb-3 flex flex-wrap items-center justify-between gap-2">{title && <h2 className="dash-h2">{title}</h2>}{actions}</div>}
      {children}
    </section>
  );
}

export function Stat({ label, value, warn = false, hint }: { label: string; value: ReactNode; warn?: boolean; hint?: string }) {
  return (
    <div className="rounded-xl border border-border p-3" title={hint}>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-lg font-bold tabular-nums ${warn ? "text-amber-600" : ""}`}>{value}</p>
    </div>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return <p role="status" className="flex items-center gap-2 py-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{label}</p>;
}
export function ErrorText({ message, onRetry }: { message: string; onRetry?: () => void }) {
  if (!message) return null;
  return <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{message}{onRetry && <button type="button" onClick={onRetry} className="ml-2 font-semibold underline">Retry</button>}</p>;
}
export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">{children}</p>;
}

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "good" | "warn" | "bad" | "info" }) {
  const cls = { muted: "bg-muted text-muted-foreground", good: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300", warn: "bg-amber-500/15 text-amber-800 dark:text-amber-300", bad: "bg-red-500/12 text-red-700 dark:text-red-300", info: "bg-sky-500/12 text-sky-700 dark:text-sky-300" }[tone];
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{children}</span>;
}

export const STATUS_TONE: Record<string, "muted" | "good" | "warn" | "bad" | "info"> = {
  queued: "info", running: "info", done: "good", skipped: "muted", failed: "warn", dead: "bad", cancelled: "muted",
  draft: "muted", pending_review: "warn", scheduled: "info", published: "good", rejected: "muted",
  new: "info", needs_clarification: "warn", qualified: "good", service_recommended: "good", consultation_requested: "good", quote_requested: "good",
  awaiting_human: "warn", won: "good", lost: "muted", followup_scheduled: "info", not_suitable: "muted",
};
export const label = (s: string) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export function when(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso), diff = (Date.now() - d.getTime()) / 1000;
  if (Math.abs(diff) < 60) return diff >= 0 ? "just now" : "in under a minute";
  const f = (n: number, u: string) => `${Math.round(Math.abs(n))} ${u}${Math.round(Math.abs(n)) === 1 ? "" : "s"}`;
  if (Math.abs(diff) >= 86400 * 14) return d.toLocaleDateString();
  const s = Math.abs(diff) < 3600 ? f(diff / 60, "min") : Math.abs(diff) < 86400 ? f(diff / 3600, "hour") : f(diff / 86400, "day");
  return diff >= 0 ? `${s} ago` : `in ${s}`;
}

export function Btn({ children, onClick, tone = "default", disabled, small, type = "button", title }: { children: ReactNode; onClick?: () => void; tone?: "default" | "primary" | "danger"; disabled?: boolean; small?: boolean; type?: "button" | "submit"; title?: string }) {
  const base = small ? "min-h-8 px-3 text-xs" : "min-h-10 px-4 text-sm";
  const cls = tone === "primary" ? "bg-foreground text-background hover:opacity-90" : tone === "danger" ? "border border-red-500/40 text-red-600 hover:bg-red-500/10" : "border border-border hover:bg-muted";
  return <button type={type} title={title} onClick={onClick} disabled={disabled} className={`inline-flex items-center justify-center gap-1.5 rounded-full font-semibold disabled:opacity-50 ${base} ${cls}`}>{children}</button>;
}

/** Download rows as CSV (for "export operational logs"). */
export function downloadCsv(name: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const esc = (v: unknown) => { const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a"); a.href = url; a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function myUid(): Promise<string | null> { const { data } = await supabase.auth.getUser(); return data.user?.id ?? null; }
