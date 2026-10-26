// @ts-nocheck -- generated DB types lag behind; runtime verified
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { History, RotateCcw, Send, Undo2 } from "lucide-react";
import { Btn, check, db, ErrorText, Pill, useLoad, when } from "@/components/agents-admin/shared";
import { refreshSettings, setSettingsPreview } from "@/lib/site-settings";

/** Permissions for the signed-in person (from site_permissions); the database re-checks every call. */
export const PermsContext = createContext<string[]>([]);
export const useCan = () => { const p = useContext(PermsContext); return (perm: string) => p.includes(perm); };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;
export interface SettingRow { key: string; draft: Row | null; published: Row | null; draft_at: string | null; published_at: string | null }

/** All settings rows (staff view: drafts and published), keyed. */
export function useSettingRows(prefix?: string) {
  const q = useLoad<SettingRow[]>(async () => {
    let r = db.from("site_settings").select("key,draft,published,draft_at,published_at").order("key").limit(2000);
    if (prefix) r = r.like("key", `${prefix}%`);
    return check(await r);
  }, [prefix]);
  const map = useMemo(() => new Map((q.data ?? []).map((r) => [r.key, r])), [q.data]);
  return { ...q, map };
}

export const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
export const isPending = (r?: SettingRow) => !!r && !same(r.draft, r.published);

/** Remove empty fields so "no change" really stores nothing. */
export function clean(v: Row): Row | null {
  const out: Row = {};
  for (const [k, x] of Object.entries(v)) if (x !== undefined && x !== null && x !== "" && !(typeof x === "number" && Number.isNaN(x))) out[k] = x;
  return Object.keys(out).length ? out : null;
}

export async function saveDraft(key: string, value: Row | null) { check(await db.rpc("site_setting_save_draft", { _key: key, _value: value })); }
export async function publishKeys(keys: string[], note?: string) { const n = check(await db.rpc("site_setting_publish", { _keys: keys, _note: note ?? null })); refreshSettings(); return n as number; }
export async function discardKey(key: string) { check(await db.rpc("site_setting_discard", { _key: key })); }

/** Live / draft status pill for one key. */
export function StatusPill({ row }: { row?: SettingRow }) {
  if (!row) return <Pill>As built</Pill>;
  if (isPending(row)) return <Pill tone="warn">Draft{row.published ? " (live differs)" : " (not live)"}</Pill>;
  return <Pill tone="good">Live override</Pill>;
}

/** Publish bar for all pending drafts in a section, plus "preview my drafts". */
export function PendingBar({ rows, onDone, scope }: { rows: SettingRow[]; onDone: () => void; scope: string }) {
  const can = useCan();
  const pending = rows.filter(isPending);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [msg, setMsg] = useState(""); const [note, setNote] = useState("");
  if (!pending.length && !msg) return null;
  const publish = async () => {
    if (!window.confirm(`Publish ${pending.length} change${pending.length > 1 ? "s" : ""} to every visitor? Each one keeps its previous version for rollback.`)) return;
    setBusy(true); setErr("");
    try { const n = await publishKeys(pending.map((r) => r.key), note); setMsg(`Published ${n} change${n === 1 ? "" : "s"}. Visitors see them on their next page load.`); setNote(""); onDone(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Couldn't publish."); } finally { setBusy(false); }
  };
  const preview = () => {
    const drafts: Row = {};
    for (const r of pending) drafts[r.key] = r.draft;
    setSettingsPreview(drafts); window.open("/", "_blank", "noopener");
  };
  return (
    <div className="sticky top-[110px] z-10 mb-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 backdrop-blur">
      {pending.length > 0 && <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium">{pending.length} unpublished change{pending.length > 1 ? "s" : ""} in {scope}</p>
        <Btn small onClick={preview}>Preview on site</Btn>
        {can("content.publish") ? <>
          <input className="input h-8 w-auto flex-1 text-sm" maxLength={200} placeholder="What changed? (optional)" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Publish note" />
          <Btn small tone="primary" onClick={publish} disabled={busy}><Send className="h-3.5 w-3.5" aria-hidden="true" />Publish</Btn>
        </> : <span className="text-xs text-muted-foreground">An admin publishes drafts.</span>}
      </div>}
      {msg && <p role="status" className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">{msg}</p>}
      <ErrorText message={err} />
    </div>
  );
}

/** Version history for one key with rollback (admin). */
export function History_({ k, onDone }: { k: string; onDone: () => void }) {
  const can = useCan();
  const v = useLoad<Row[]>(async () => check(await db.from("site_settings_versions").select("*").eq("key", k).order("id", { ascending: false }).limit(20)), [k]);
  const [err, setErr] = useState("");
  const rollback = async (id: number) => {
    if (!window.confirm("Put the value from before this publish back live now?")) return;
    try { check(await db.rpc("site_setting_rollback", { _version: id })); refreshSettings(); v.reload(); onDone(); } catch (e) { setErr(e instanceof Error ? e.message : "Couldn't roll back."); }
  };
  if (v.loading) return <p className="text-xs text-muted-foreground">Loading history…</p>;
  if (!v.data?.length) return <p className="text-xs text-muted-foreground">No history yet.</p>;
  return (
    <div className="mt-2 rounded-xl border border-border p-2 text-xs">
      <ErrorText message={err || v.error} />
      <ul className="divide-y divide-border">{v.data.map((x) => (
        <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
          <span><Pill tone={x.action === "publish" ? "good" : x.action === "rollback" ? "info" : "muted"}>{x.action}</Pill> {when(x.created_at)} {x.note ? `· ${x.note}` : ""}<code className="ml-1 break-all text-[10px] text-muted-foreground">{JSON.stringify(x.value)}</code></span>
          {can("content.publish") && (x.action === "publish" || x.action === "rollback") && <Btn small onClick={() => rollback(x.id)}><RotateCcw className="h-3 w-3" aria-hidden="true" />Undo this</Btn>}
        </li>))}</ul>
    </div>
  );
}

/** Save draft / discard / history controls for one setting. */
export function SettingActions({ k, row, value, onDone, disabled }: { k: string; row?: SettingRow; value: Row | null; onDone: () => void; disabled?: boolean }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [hist, setHist] = useState(false);
  const changed = !same(value, row?.draft ?? row?.published ?? null);
  const run = async (fn: () => Promise<void>) => { setBusy(true); setErr(""); try { await fn(); onDone(); } catch (e) { setErr(e instanceof Error ? e.message : "That didn't work."); } finally { setBusy(false); } };
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusPill row={row} />
        <Btn small tone="primary" onClick={() => run(() => saveDraft(k, value))} disabled={busy || disabled || !changed}>Save draft</Btn>
        {isPending(row) && <Btn small onClick={() => run(() => discardKey(k))} disabled={busy}><Undo2 className="h-3 w-3" aria-hidden="true" />Discard draft</Btn>}
        {row && <Btn small onClick={() => setHist((h) => !h)}><History className="h-3 w-3" aria-hidden="true" />History</Btn>}
      </div>
      <ErrorText message={err} />
      {hist && <History_ k={k} onDone={onDone} />}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="block text-xs font-medium text-muted-foreground">{label}<span className="mt-1 block text-sm text-foreground">{children}</span>{hint && <span className="mt-0.5 block text-[11px]">{hint}</span>}</label>;
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return <input type="search" className="input mb-3 w-full" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />;
}

/** Shows the code that would make a browser-applied change permanent in the server HTML. */
export function CodeNote({ children }: { children: ReactNode }) {
  return <p className="mt-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5 text-[11px] text-sky-800 dark:text-sky-200">{children}</p>;
}
