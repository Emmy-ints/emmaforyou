import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Eye, EyeOff, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { KIND_LABEL, industryName, type ShowcaseKind } from "@/lib/showcase";
import { timeAgo } from "../showcase/ShowcaseCard";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any; auth: { getUser: () => Promise<{ data: { user: { id: string } | null } }> } };

interface Row { id: string; slug: string; kind: ShowcaseKind; title: string; industry: string | null; views: number; likes: number; hidden: boolean; created_at: string }

/**
 * The public showcase goes live without approval. This panel lists what visitors added so you can hide anything
 * unsuitable in one tap (hidden items disappear from the site immediately and can be shown again).
 */
export function ShowcaseModeration() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [view, setView] = useState<"live" | "hidden">("live");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await db.from("showcase_items").select("id, slug, kind, title, industry, views, likes, hidden, created_at").order("created_at", { ascending: false }).limit(60);
      if (!alive) return;
      if (error) { setErr("Couldn't load showcase items."); setRows([]); return; }
      setRows((data ?? []) as Row[]);
    })();
    return () => { alive = false; };
  }, []);

  async function toggle(r: Row) {
    setBusy(r.id); setErr("");
    const { data: u } = await db.auth.getUser();
    const { error } = await db.from("showcase_items").update({ hidden: !r.hidden, hidden_by: r.hidden ? null : u.user?.id ?? null }).eq("id", r.id);
    if (error) setErr("Couldn't change that item. You need content permission to hide showcase items.");
    else setRows((cur) => (cur ?? []).map((x) => (x.id === r.id ? { ...x, hidden: !r.hidden } : x)));
    setBusy(null);
  }

  const list = (rows ?? []).filter((r) => (view === "hidden" ? r.hidden : !r.hidden));
  const live = (rows ?? []).filter((r) => !r.hidden).length;
  const hidden = (rows ?? []).length - live;

  return (
    <section className="dash-card mt-4" aria-labelledby="sc-mod-title" data-showcase-moderation>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="sc-mod-title" className="dash-h2">Public showcase</h2>
          <p className="mt-1 text-xs text-muted-foreground">Visitor results appear on the site straight away. Hide anything you don't want public.</p>
        </div>
        <div className="flex gap-1 rounded-full border border-border p-1 text-xs" role="tablist" aria-label="Showcase items">
          <button type="button" role="tab" aria-selected={view === "live"} onClick={() => setView("live")} className={`rounded-full px-3 py-1.5 ${view === "live" ? "bg-foreground text-background" : "text-muted-foreground"}`}>Live ({live})</button>
          <button type="button" role="tab" aria-selected={view === "hidden"} onClick={() => setView("hidden")} className={`rounded-full px-3 py-1.5 ${view === "hidden" ? "bg-foreground text-background" : "text-muted-foreground"}`}>Hidden ({hidden})</button>
        </div>
      </div>
      {err && <p role="alert" className="mt-3 text-xs text-red-600">{err}</p>}
      {rows === null ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : list.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{view === "live" ? "Nothing in the showcase yet. Items appear here when visitors keep \"Add to showcase\" ticked." : "No hidden items."}</p>
      ) : (
        <ul className="mt-4 grid gap-2">
          {list.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-3" data-showcase-row={r.slug}>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{r.title}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                  <span>{KIND_LABEL[r.kind]?.one ?? r.kind}{industryName(r.industry) ? ` · ${industryName(r.industry)}` : ""}</span>
                  <span>{timeAgo(r.created_at)}</span>
                  <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" aria-hidden="true" />{r.views}</span>
                  <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" aria-hidden="true" />{r.likes}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!r.hidden && <Link to="/showcase/$slug" params={{ slug: r.slug }} target="_blank" className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted">Open</Link>}
                <button type="button" disabled={busy === r.id} onClick={() => toggle(r)} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50">
                  {r.hidden ? <><Eye className="h-3.5 w-3.5" aria-hidden="true" /> Show again</> : <><EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> Hide</>}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
