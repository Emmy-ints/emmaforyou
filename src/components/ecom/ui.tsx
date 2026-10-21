import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, Check, Save, LogIn } from "lucide-react";
import { useAccount } from "@/lib/auth/use-account";
import { currentWorkspace, rememberWorkspace, saveItem, type Item, type ItemKind, type Workspace } from "@/lib/ecom/workspace";

/* ------------------------------------------------------------------ workspace store */
let ws: Workspace | null = null;
let wsFor: string | null = null;
let wsError = "";
const subs = new Set<() => void>();
const emit = () => subs.forEach((s) => s());
export function setActiveWorkspace(w: Workspace | null) { ws = w; if (w) rememberWorkspace(w.id); emit(); }

/** The signed-in user's active workspace (created on first use). Null when signed out. */
export function useWorkspace(): { ready: boolean; signedIn: boolean; uid: string | null; workspace: Workspace | null; error: string } {
  const account = useAccount();
  useEffect(() => {
    if (!account.ready) return;
    if (!account.signedIn || !account.userId) { if (wsFor) { wsFor = null; ws = null; emit(); } return; }
    if (wsFor === account.userId) return;
    wsFor = account.userId; wsError = "";
    currentWorkspace(account.userId).then((w) => setActiveWorkspace(w)).catch((e) => { wsError = e instanceof Error ? e.message : "Couldn't open your workspace."; emit(); });
  }, [account.ready, account.signedIn, account.userId]);
  const w = useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => ws, () => null);
  return { ready: account.ready && (!account.signedIn || Boolean(w) || Boolean(wsError)), signedIn: account.signedIn, uid: account.userId, workspace: w, error: wsError };
}

/* ------------------------------------------------------------------ building blocks */
export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-6">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--emma-violet)]">{eyebrow}</p>
      <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
      {children && <div className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{children}</div>}
    </div>
  );
}

export function Card({ title, children, className = "", actions }: { title?: ReactNode; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={`rounded-2xl border border-border bg-card p-4 sm:p-5 ${className}`}>
      {(title || actions) && <div className="mb-3 flex flex-wrap items-center justify-between gap-2">{title && <h2 className="font-display text-base font-bold">{title}</h2>}{actions}</div>}
      {children}
    </section>
  );
}

const EVIDENCE: Record<string, { label: string; cls: string; tip: string }> = {
  confirmed: { label: "Confirmed", cls: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/30", tip: "Measured directly in the data or on the page." },
  observed: { label: "Observed", cls: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/30", tip: "Seen on the public page." },
  "partly observed": { label: "Partly observed", cls: "bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/30", tip: "Seen in the page's code; worth checking by eye." },
  supported: { label: "Strongly supported", cls: "bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/30", tip: "A measured problem plus a matching observation." },
  evidence: { label: "From sources", cls: "bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/30", tip: "Based on the cited evidence." },
  user: { label: "Your figures", cls: "bg-violet-500/12 text-violet-700 dark:text-violet-300 border-violet-500/30", tip: "Calculated from numbers you entered." },
  hypothesis: { label: "Hypothesis", cls: "bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/30", tip: "Plausible, but needs a test to confirm." },
  unknown: { label: "Unknown", cls: "bg-muted text-muted-foreground border-border", tip: "Can't be judged without more data." },
};
export function EvidenceBadge({ kind }: { kind: string }) {
  const e = EVIDENCE[kind] ?? EVIDENCE.unknown;
  return <span title={e.tip} className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${e.cls}`}>{e.label}</span>;
}

export function NumberField({ id, label, value, onChange, hint, suffix, step = "any" }: { id: string; label: string; value: number | null | undefined; onChange: (v: number | null) => void; hint?: string; suffix?: string; step?: string }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <div className="relative mt-1">
        <input id={id} type="number" inputMode="decimal" step={step} min={0} className="input pr-12" value={value == null || Number.isNaN(value) ? "" : value}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} aria-describedby={hint ? `${id}-hint` : undefined} />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>}
      </div>
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
      {message}{onRetry && <button type="button" onClick={onRetry} className="ml-2 font-semibold underline">Try again</button>}
    </div>
  );
}

export function Progress({ label, steps }: { label: string; steps?: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => { if (!steps?.length) return; const t = window.setInterval(() => setI((x) => Math.min(x + 1, steps.length - 1)), 4000); return () => window.clearInterval(t); }, [steps]);
  return (
    <div role="status" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
      <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[var(--emma-violet)]" aria-hidden="true" />
      <span><span className="font-semibold">{label}</span>{steps?.length ? <span className="block text-muted-foreground">{steps[i]}</span> : null}</span>
    </div>
  );
}

/** Save the current result to the workspace (asks to sign in first). */
export function SaveToWorkspace<T>({ kind, title, data, savedId, onSaved, label = "Save to workspace" }: { kind: ItemKind; title: string; data: T; savedId?: string | null; onSaved?: (item: Item<T>) => void; label?: string }) {
  const { signedIn, uid, workspace } = useWorkspace();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  if (!signedIn) return <Link to="/login" search={{ next: typeof window !== "undefined" ? window.location.pathname : "/ecommerce" }} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted"><LogIn className="h-4 w-4" aria-hidden="true" />Sign in to save</Link>;
  async function save() {
    if (!uid || !workspace) return;
    setBusy(true); setError("");
    try { const item = await saveItem(uid, workspace.id, kind, title, data, savedId ?? undefined); setDone(true); onSaved?.(item); window.setTimeout(() => setDone(false), 2500); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't save."); } finally { setBusy(false); }
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button type="button" onClick={save} disabled={busy || !workspace} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : done ? <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}{done ? "Saved" : savedId ? "Update saved copy" : label}
      </button>
      {error && <span role="alert" className="text-xs text-red-600">{error}</span>}
    </span>
  );
}

export function ScoreRing({ value, label, size = 76 }: { value: number; label: string; size?: number }) {
  const r = (size - 10) / 2, c = 2 * Math.PI * r, pct = Math.max(0, Math.min(100, value));
  const color = pct >= 75 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <figure className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label}: ${pct} out of 100`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="8" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(pct / 100) * c} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" className="fill-current font-display text-[17px] font-bold">{pct}</text>
      </svg>
      <figcaption className="text-xs font-medium text-muted-foreground">{label}</figcaption>
    </figure>
  );
}
