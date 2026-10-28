// @ts-nocheck -- generated DB types lag behind; runtime verified
import { Card, db, ErrorText, Loading, Pill, Stat, useLoad, when } from "@/components/agents-admin/shared";

const EVENTS = ["book_tool_started", "book_preview_generated", "book_registration_completed", "book_export_attempted", "book_export_completed", "book_export_failed", "book_project_saved", "publishing_enquiry_submitted"];

/**
 * Control room → AI & integrations: the book tools. Counts and error logs only — never anyone's
 * manuscript, covers or drafts (those rows are owner-only by RLS; the summary RPC returns counts).
 */
export function PublishingCard() {
  const sum = useLoad(async () => { const r = await db.rpc("book_admin_summary"); if (r.error) throw new Error(r.error.message.includes("Not authorised") ? "Needs analytics access." : r.error.message); return r.data; });
  const ev = useLoad(async () => {
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const r = await db.from("site_events").select("event").in("event", EVENTS).gte("created_at", since).limit(20000);
    if (r.error) return null;
    const m = Object.fromEntries(EVENTS.map((e) => [e, 0]));
    for (const x of r.data ?? []) m[x.event] = (m[x.event] ?? 0) + 1;
    return m;
  });
  const s = sum.data;
  const e = ev.data;
  const rate = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "N/A");
  return (
    <Card title="Book publishing tools">
      {sum.loading ? <Loading /> : sum.error ? <ErrorText message={sum.error} onRetry={sum.reload} /> : s && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Saved projects" value={s.projects} />
            <Stat label="Authors with projects" value={s.authors} />
            <Stat label="Publishing enquiries (30 days)" value={s.enquiries_30d} />
            <Stat label="Failures logged (7 days)" value={(s.usage_7d ?? []).reduce((a, u) => a + u.failed, 0)} warn={(s.usage_7d ?? []).some((u) => u.failed > 0)} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">By type: {Object.entries(s.by_kind ?? {}).map(([k, n]) => `${k} ${n}`).join(" · ") || "none yet"}. By status: {Object.entries(s.by_status ?? {}).map(([k, n]) => `${k} ${n}`).join(" · ") || "none yet"}.</p>
          {(s.usage_7d ?? []).length > 0 && (
            <table className="mt-3 w-full text-xs"><thead><tr className="text-left text-muted-foreground"><th className="py-1">Tool · action (7 days)</th><th>Runs</th><th>Failed</th><th>Avg ms</th></tr></thead>
              <tbody>{s.usage_7d.slice(0, 20).map((u) => <tr key={`${u.tool}:${u.action}`} className="border-t border-border"><td className="py-1">{u.tool} · {u.action}</td><td>{u.runs}</td><td>{u.failed ? <Pill tone="bad">{u.failed}</Pill> : 0}</td><td>{u.avg_ms ?? "—"}</td></tr>)}</tbody></table>
          )}
          {(s.recent_errors ?? []).length > 0 && <ul className="mt-3 space-y-1 text-xs">{s.recent_errors.map((x, i) => <li key={i}><Pill tone="bad">{x.tool}</Pill> {x.action}: {x.error ?? "error"} · {when(x.at)}</li>)}</ul>}
        </>
      )}
      <div className="mt-4 border-t border-border pt-3 text-sm">
        <p className="font-medium">Funnel (last 30 days, first-party events)</p>
        {ev.loading ? <Loading /> : !e ? <p className="text-xs text-muted-foreground">Needs analytics access.</p> : (
          <ul className="mt-1 grid gap-1 text-xs sm:grid-cols-2">
            <li>Tool started: {e.book_tool_started}</li><li>Previews generated: {e.book_preview_generated}</li>
            <li>Accounts created from a tool: {e.book_registration_completed}</li><li>Projects saved: {e.book_project_saved}</li>
            <li>Exports attempted: {e.book_export_attempted}</li><li>Exports completed: {e.book_export_completed} ({rate(e.book_export_completed, e.book_export_attempted)} of attempts)</li>
            <li>Exports failed: {e.book_export_failed}</li><li>Publishing enquiries submitted: {e.publishing_enquiry_submitted}</li>
          </ul>
        )}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Enquiries appear in the Enquiries tab. Switch the homepage section, the tools or their AI features off in Features; AI usage limits per visitor are enforced on the server (book_ai_* and book_art in the AI log). Project contents are private to each author.</p>
    </Card>
  );
}
