import { createFileRoute, Link } from "@tanstack/react-router";
import { KineticText } from "@/components/future/Kinetic";
import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldCheck, Trash2, RotateCcw, Ban, CheckCircle2, XCircle, Pin, BadgeCheck } from "lucide-react";
import { pageHead } from "@/lib/seo";
import { friendly } from "@/lib/community/api";
import { auditLog, dismissReports, moderate, reportQueue, type AuditRow, type QueueItem } from "@/lib/community/moderation";
import { useCommunitySession } from "@/lib/community/session";
import { timeAgo } from "@/components/community/RichText";

export const Route = createFileRoute("/community/moderation")({
  head: () => pageHead({ title: "Moderation — EmmaForYou Community", description: "Community moderation queue.", path: "/community/moderation", noindex: true }),
  component: ModerationPage,
});

type View = "open" | "actioned" | "dismissed" | "log";

function ModerationPage() {
  const { ready, staff } = useCommunitySession();
  const [view, setView] = useState<View>("open");
  const [items, setItems] = useState<QueueItem[] | null>(null);
  const [log, setLog] = useState<AuditRow[] | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      if (view === "log") { setLog(null); setLog(await auditLog(80)); }
      else { setItems(null); setItems(await reportQueue(view)); }
    } catch (e) { setError(friendly(e)); setItems([]); setLog([]); }
  }, [view]);
  useEffect(() => { if (ready && staff) void load(); }, [ready, staff, load]);

  async function act(i: QueueItem, action: string) {
    const key = `${i.target_type}:${i.target_id}:${action}`;
    setBusy(key); setError("");
    try {
      if (action === "dismiss") await dismissReports(i.reports.map((r) => r.id));
      else await moderate(i.target_type, i.target_id, action, note.trim() || i.reports[0]?.reason);
      setNote("");
      await load();
    } catch (e) { setError(friendly(e)); } finally { setBusy(""); }
  }

  if (!ready) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading" /></div>;
  if (!staff) return (
    <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
      <h1 className="font-display text-xl font-bold"><KineticText text="Moderation" base={60} /></h1>
      <p className="mt-2 text-sm text-muted-foreground">This area is for community moderators and administrators.</p>
      <Link to="/community" className="mt-4 inline-flex rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">Back to the community</Link>
    </div>
  );

  const btn = "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold hover:bg-muted disabled:opacity-50";
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold"><ShieldCheck className="h-6 w-6 text-[var(--emma-violet)]" aria-hidden="true" />Moderation</h1>
      <p className="mt-1 text-sm text-muted-foreground">Reports from members, grouped by item. Every action is checked by the database and written to the audit log.</p>
      <div role="group" aria-label="Queue" className="mt-4 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(["open", "actioned", "dismissed", "log"] as View[]).map((v) => <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium capitalize ${view === v ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}>{v === "log" ? "Audit log" : v}</button>)}
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      {view !== "log" && view === "open" && (
        <div className="mt-3"><label htmlFor="mod-note" className="text-xs font-medium text-muted-foreground">Reason recorded with your next action (optional)</label><input id="mod-note" className="input mt-1" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} /></div>
      )}

      {view === "log" ? (
        log === null ? <Loader2 className="mx-auto mt-8 h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading" /> : log.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No moderation actions yet.</p> : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground"><tr><th className="px-3 py-2 font-medium">When</th><th className="px-3 py-2 font-medium">Who</th><th className="px-3 py-2 font-medium">Action</th><th className="px-3 py-2 font-medium">Target</th><th className="px-3 py-2 font-medium">Reason</th></tr></thead>
              <tbody className="divide-y divide-border">{log.map((r) => (
                <tr key={r.id}><td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{timeAgo(r.created_at)}</td><td className="px-3 py-2">{r.actor ? `@${r.actor}` : "—"}</td><td className="px-3 py-2 font-medium">{r.action.replace(/_/g, " ")}</td><td className="px-3 py-2">{r.target_type === "post" && r.target_id ? <Link to="/community/post/$id" params={{ id: r.target_id }} className="underline">post</Link> : r.target_type}</td><td className="px-3 py-2 text-muted-foreground">{r.details?.reason || "—"}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )
      ) : items === null ? <Loader2 className="mx-auto mt-8 h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading" /> : items.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">{view === "open" ? "No open reports. All clear." : `No ${view} reports.`}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((i) => {
            const k = (a: string) => busy === `${i.target_type}:${i.target_id}:${a}`;
            const p = i.preview;
            return (
              <li key={`${i.target_type}:${i.target_id}`} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-muted px-2 py-0.5 font-semibold capitalize">{i.target_type}</span>
                  <span className="rounded-full bg-red-500/10 px-2 py-0.5 font-semibold text-red-600">{i.reports.length} report{i.reports.length === 1 ? "" : "s"}</span>
                  {p && <span className="text-muted-foreground">by <Link to="/community/u/$username" params={{ username: p.username }} className="underline">@{p.username}</Link> · status {p.status}</span>}
                </div>
                {p ? (
                  <div className="mt-2">
                    {p.title && i.target_type !== "comment" && <p className="text-sm font-semibold">{p.title}</p>}
                    <p className="mt-0.5 line-clamp-4 whitespace-pre-line text-sm text-muted-foreground">{p.body || "(no text)"}</p>
                    {p.post_id && <Link to="/community/post/$id" params={{ id: p.post_id }} className="mt-1 inline-block text-xs font-semibold text-[var(--emma-violet)] underline">Open {i.target_type === "comment" ? "post" : "it"}</Link>}
                  </div>
                ) : <p className="mt-2 text-sm text-muted-foreground">This item no longer exists.</p>}
                <ul className="mt-3 space-y-1 border-t border-border pt-2 text-xs text-muted-foreground">
                  {i.reports.map((r) => <li key={r.id}><span className="font-semibold capitalize text-foreground">{r.reason}</span> · @{r.reporter} · {timeAgo(r.created_at)}{r.details ? ` — ${r.details}` : ""}</li>)}
                </ul>
                {view === "open" && p && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {i.target_type !== "profile" && (p.status === "removed"
                      ? <button type="button" className={btn} disabled={Boolean(busy)} onClick={() => act(i, "restore")}>{k("restore") ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}Restore</button>
                      : <button type="button" className={`${btn} border-red-500/40 text-red-600`} disabled={Boolean(busy)} onClick={() => act(i, "remove")}>{k("remove") ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}Remove</button>)}
                    {i.target_type === "profile" && (p.status === "suspended"
                      ? <button type="button" className={btn} disabled={Boolean(busy)} onClick={() => act(i, "unsuspend")}><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />Unsuspend</button>
                      : <button type="button" className={`${btn} border-red-500/40 text-red-600`} disabled={Boolean(busy)} onClick={() => act(i, "suspend")}>{k("suspend") ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Ban className="h-3.5 w-3.5" aria-hidden="true" />}Suspend member</button>)}
                    <button type="button" className={btn} disabled={Boolean(busy)} onClick={() => act(i, "dismiss")}>{k("dismiss") ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <XCircle className="h-3.5 w-3.5" aria-hidden="true" />}Dismiss</button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-6 text-xs text-muted-foreground"><Pin className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />Pin or remove any post from its menu. Suspend members or assign the specialist <BadgeCheck className="inline h-3.5 w-3.5" aria-hidden="true" /> badge (administrators only) from their profile menu.</p>
    </div>
  );
}
