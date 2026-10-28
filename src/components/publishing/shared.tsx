/**
 * Shared pieces for the book tools: drafts kept in this browser, saved projects in the account
 * (book_projects, owner-only RLS), the sign-in gate for downloads and saving, usage reporting
 * and the professional-help call to action.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Cloud, Loader2, Lock, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/auth/use-account";
import { track } from "@/lib/analytics";
import AccountAuthForm from "@/components/auth/AccountAuthForm";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type ProjectKind = "book" | "cover" | "mockup" | "marketing" | "analysis" | "launch" | "royalty" | "readiness";
export type ProjectStatus = "draft" | "in_progress" | "ready" | "published" | "archived";
export interface BookProject<T = Record<string, unknown>> {
  id: string; kind: ProjectKind; title: string; status: ProjectStatus; data: T; meta: Record<string, unknown>; created_at: string; updated_at: string;
}
export const KIND_LABEL: Record<ProjectKind, string> = {
  book: "eBook", cover: "Cover", mockup: "Mockups & graphics", marketing: "Listing & marketing copy", analysis: "Manuscript analysis",
  launch: "Launch plan", royalty: "Royalty estimate", readiness: "Readiness check",
};
export const KIND_TOOL: Record<ProjectKind, string> = {
  book: "ebook-creator", cover: "cover-designer", mockup: "mockups", marketing: "book-marketing", analysis: "manuscript-analyzer",
  launch: "launch-planner", royalty: "royalty-calculator", readiness: "readiness-checker",
};

// ---------------------------------------------------------------- local drafts
const draftKey = (tool: string) => `efy_book_draft:${tool}`;
export function readDraft<T>(tool: string): T | null {
  try { const v = window.localStorage.getItem(draftKey(tool)); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
}
export function writeDraft(tool: string, value: unknown) {
  try { window.localStorage.setItem(draftKey(tool), JSON.stringify(value)); return true; } catch { return false; }
}
export function clearDraft(tool: string) { try { window.localStorage.removeItem(draftKey(tool)); } catch { /* ignore */ } }

/**
 * Tool state that survives a reload and the sign-in round trip: kept in localStorage (this
 * browser only) until it's saved to the account. `?project=<id>` opens a saved project instead.
 */
export function useBookState<T>(tool: string, kind: ProjectKind, initial: () => T) {
  const [state, setState] = useState<T>(initial);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const started = useRef(false);
  useEffect(() => {
    const pid = new URLSearchParams(window.location.search).get("project");
    (async () => {
      if (pid && /^[0-9a-f-]{36}$/i.test(pid)) {
        const { data, error } = await db.from("book_projects").select("*").eq("id", pid).eq("kind", kind).maybeSingle();
        if (error || !data) setLoadError("That project couldn't be opened. It may have been deleted, or you're signed in with a different account.");
        else { setState({ ...initial(), ...(data.data as T) }); setProjectId(data.id); }
      } else {
        const d = readDraft<{ v: T; projectId?: string }>(tool);
        if (d?.v) { setState({ ...initial(), ...d.v }); if (d.projectId) setProjectId(d.projectId); }
      }
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { if (loaded) writeDraft(tool, { v: state, projectId }); }, [loaded, state, projectId, tool]);
  const markStarted = useCallback(() => { if (!started.current) { started.current = true; track("book_tool_started", { tool }); } }, [tool]);
  const update = useCallback((fn: (s: T) => T) => { markStarted(); setState(fn); }, [markStarted]);
  const reset = useCallback(() => { clearDraft(tool); setState(initial()); setProjectId(null); }, [tool, initial]);
  return { state, setState: update, replace: setState, projectId, setProjectId, loaded, loadError, reset };
}

export async function saveProject(p: { id: string | null; kind: ProjectKind; title: string; data: unknown; meta?: Record<string, unknown>; status?: ProjectStatus }): Promise<string> {
  const row = { kind: p.kind, title: (p.title || "Untitled").slice(0, 200), data: p.data, meta: p.meta ?? {}, ...(p.status ? { status: p.status } : {}) };
  const t0 = performance.now();
  if (p.id) {
    const { data, error } = await db.from("book_projects").update(row).eq("id", p.id).select("id").maybeSingle();
    if (!error && data) { report(KIND_TOOL[p.kind], "save", true, t0); return data.id; }
    if (error && !/0 rows|not found/i.test(error.message)) { report(KIND_TOOL[p.kind], "save", false, t0, error.message); throw new Error(friendly(error.message)); }
  }
  const { data, error } = await db.from("book_projects").insert(row).select("id").single();
  if (error) { report(KIND_TOOL[p.kind], "save", false, t0, error.message); throw new Error(friendly(error.message)); }
  report(KIND_TOOL[p.kind], "save", true, t0);
  track("book_project_saved", { kind: p.kind });
  return data.id;
}
function friendly(m: string) {
  if (/up to 200/.test(m)) return m;
  if (/pg_column_size|check constraint/i.test(m)) return "This project is too large to save (over about 2 MB). Remove large images or split the book.";
  if (/JWT|auth/i.test(m)) return "Your session has expired. Sign in again to save.";
  return "The project couldn't be saved. Please try again.";
}

/** Outcome of an export/render, for the control room's failure monitor. Never includes content. */
export function report(tool: string, action: string, ok: boolean, t0: number, error?: string) {
  const ms = Math.max(0, Math.round(performance.now() - t0));
  void db.from("book_tool_usage").insert({ tool, action, ok, ms, error: error ? error.slice(0, 280) : null }).then(() => undefined, () => undefined);
}

export function downloadBytes(bytes: Uint8Array | Blob, name: string, type: string) {
  const blob = bytes instanceof Blob ? bytes : new Blob([bytes as BlobPart], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.rel = "noopener";
  document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// ---------------------------------------------------------------- sign-in gate
/**
 * Downloads and saving need a free account. The gate explains why, signs in with the site's one
 * account form, and then runs the action the person asked for. Their work stays in this browser
 * meanwhile (and is restored if they come back from an email confirmation link).
 */
export function useAccountGate(tool: string) {
  const acct = useAccount();
  const [pending, setPending] = useState<{ reason: string; run: () => void } | null>(null);
  const require = useCallback((reason: string, run: () => void) => {
    if (acct.signedIn) { run(); return; }
    setPending({ reason, run });
  }, [acct.signedIn]);
  const gate = pending ? (
    <GateDialog reason={pending.reason} tool={tool} onClose={() => setPending(null)} onSignedIn={() => { const r = pending.run; setPending(null); window.setTimeout(r, 50); }} />
  ) : null;
  return { signedIn: acct.signedIn, ready: acct.ready, require, gate };
}

function GateDialog({ reason, tool, onClose, onSignedIn }: { reason: string; tool: string; onClose: () => void; onSignedIn: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("input, button")?.focus();
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => { window.removeEventListener("keydown", k); prev?.focus?.(); };
  }, [onClose]);
  const next = typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : `/publishing/${tool}`;
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/55 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="gate-h" className="lg-dialog relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted" aria-label="Close"><X className="h-4 w-4" /></button>
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--hue,#ff9f5a)]"><Lock className="h-3.5 w-3.5" aria-hidden="true" /> Free account</p>
        <h2 id="gate-h" className="mt-2 font-display text-xl font-semibold">{reason}</h2>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />Download your finished files</li>
          <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />Save projects and continue on any device</li>
          <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />Your work stays private to you; delete it any time</li>
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">It's free, with no consultation or card required. Your work so far is kept in this browser while you sign in.</p>
        <div className="mt-5">
          <AccountAuthForm intent="account" initialMode="signup" next={next} idPrefix={`gate-${tool}`} onSignedIn={onSignedIn} onAccountCreated={() => track("book_registration_completed", { tool })} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- save bar
export function SaveBar({ kind, title, data, meta, projectId, setProjectId, gateRequire, disabled }: {
  kind: ProjectKind; title: string; data: unknown; meta?: Record<string, unknown>; projectId: string | null; setProjectId: (id: string) => void;
  gateRequire: (reason: string, run: () => void) => void; disabled?: boolean;
}) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [err, setErr] = useState("");
  const latest = useRef({ title, data, meta, projectId });
  latest.current = { title, data, meta, projectId };
  const doSave = async () => {
    setState("saving"); setErr("");
    try {
      const id = await saveProject({ id: latest.current.projectId, kind, title: latest.current.title, data: latest.current.data, meta: latest.current.meta, status: "in_progress" });
      setProjectId(id); setState("saved");
    } catch (e) { setErr((e as Error).message); setState("error"); }
  };
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" disabled={disabled || state === "saving"} onClick={() => gateRequire("Sign in to save this project", doSave)} className="nav-ghost h-auto px-4 py-2 text-sm disabled:opacity-50" data-track={`book_save_${kind}`}>
        {state === "saving" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Cloud className="h-4 w-4" aria-hidden="true" />} {projectId ? "Save changes" : "Save to my projects"}
      </button>
      <span role="status" className="text-sm">
        {state === "saved" && <span className="text-emerald-600 dark:text-emerald-400">Saved. <Link to="/account/books" className="underline underline-offset-4">Open my author workspace</Link></span>}
        {state === "error" && <span className="text-red-600 dark:text-red-400">{err}</span>}
        {state === "idle" && projectId && <span className="text-muted-foreground">Saved project · changes are kept in this browser until you save.</span>}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------- calls to action
export function ServiceCta({ service, title, body, cta = "Discuss my project" }: { service: string; title: string; body: string; cta?: string }) {
  return (
    <aside className="lg mt-10 flex flex-col gap-4 rounded-3xl border border-border p-6 md:flex-row md:items-center md:justify-between" aria-label="Professional help">
      <div className="max-w-2xl">
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Link to="/publishing/enquiry" search={{ service } as never} className="btn-gold inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm" data-track={`book_cta_${service}`}>{cta} <ArrowRight className="h-4 w-4" /></Link>
        <Link to={service === "ebook-publishing" ? "/services/ebook-publishing" : `/expertise/${service}`} className="nav-ghost h-auto px-5 py-2.5 text-sm">See the service</Link>
      </div>
    </aside>
  );
}

export function Panel({ title, children, actions, className = "" }: { title?: string; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={`lg rounded-3xl border border-border p-5 md:p-6 ${className}`}>
      {(title || actions) && <div className="mb-4 flex flex-wrap items-center justify-between gap-2">{title && <h2 className="font-display text-lg font-semibold">{title}</h2>}{actions}</div>}
      {children}
    </section>
  );
}

export const inputCls = "mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-[16px] md:text-sm text-foreground outline-none transition focus:border-[var(--emma-violet)] focus:ring-4 focus:ring-[var(--emma-violet)]/15";
export function Field({ label, hint, children, id }: { label: string; hint?: string; children: ReactNode; id?: string }) {
  return (
    <label className="block text-sm font-medium" htmlFor={id}>
      {label}
      {children}
      {hint && <span className="mt-1 block text-xs font-normal text-muted-foreground">{hint}</span>}
    </label>
  );
}
export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "error" | "ok"; children: ReactNode }) {
  const c = tone === "error" ? "border-red-500/40 bg-red-500/5 text-red-700 dark:text-red-300" : tone === "warn" ? "border-amber-500/40 bg-amber-500/5 text-amber-800 dark:text-amber-200" : tone === "ok" ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200" : "border-border bg-muted/40 text-muted-foreground";
  return <div role={tone === "error" ? "alert" : "status"} className={`rounded-2xl border px-4 py-3 text-sm ${c}`}>{children}</div>;
}
export function PrimaryBtn({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...p} className={`btn-gold inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${p.className ?? ""}`}>{children}</button>;
}
export function GhostBtn({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...p} className={`nav-ghost h-auto px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${p.className ?? ""}`}>{children}</button>;
}

/** Call /api/book-ai. Throws an Error with the server's friendly message. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function bookAi<T = any>(task: string, payload: Record<string, unknown>, tool: string): Promise<T> {
  const t0 = performance.now();
  let res: Response;
  try {
    res = await fetch("/api/book-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task, ...payload }) });
  } catch {
    report(tool, `ai_${task}`, false, t0, "network");
    throw new Error("We couldn't reach the server. Check your connection and try again.");
  }
  const j = await res.json().catch(() => ({}));
  if (!res.ok) { report(tool, `ai_${task}`, false, t0, `http ${res.status}`); throw new Error(j.message || "The AI draft couldn't be created. Please try again."); }
  report(tool, `ai_${task}`, true, t0);
  return j as T;
}

export async function accessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
