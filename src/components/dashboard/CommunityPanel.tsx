import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/** Community at a glance for the owner: real counts from the community tables, with links to the tools. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function CommunityPanel() {
  const [n, setN] = useState<Record<string, number | null>>({});
  useEffect(() => {
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    const count = (q: Promise<{ count: number | null; error: unknown }>) => q.then((r) => (r.error ? null : r.count ?? 0)).catch(() => null);
    Promise.all([
      count(db.from("community_profiles").select("user_id", { count: "exact", head: true })),
      count(db.from("community_profiles").select("user_id", { count: "exact", head: true }).gte("created_at", since)),
      count(db.from("community_posts").select("id", { count: "exact", head: true }).eq("status", "published")),
      count(db.from("community_comments").select("id", { count: "exact", head: true }).eq("status", "visible")),
      count(db.from("community_reports").select("id", { count: "exact", head: true }).eq("status", "open")),
      count(db.from("community_conversations").select("id", { count: "exact", head: true }).eq("kind", "assistant").not("human_requested_at", "is", null).eq("control", "ai")),
      count(db.from("community_groups").select("id", { count: "exact", head: true })),
    ]).then(([members, newMembers, posts, comments, reports, waiting, groups]) => setN({ members, newMembers, posts, comments, reports, waiting, groups }));
  }, []);
  const v = (k: string) => (n[k] === undefined ? "…" : n[k] === null ? "—" : String(n[k]));
  const stat = (label: string, k: string, warn = false) => (
    <div className="rounded-xl border border-border p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className={`mt-1 font-display text-lg font-bold ${warn && (n[k] ?? 0) > 0 ? "text-amber-600" : ""}`}>{v(k)}</p></div>
  );
  return (
    <section className="dash-card mt-4" aria-labelledby="community-dash-h">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 id="community-dash-h" className="dash-h2">Community</h2><p className="mt-1 text-xs text-muted-foreground">Members, activity and things that need you.</p></div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link to="/community/moderation" className="rounded-full border border-border px-4 py-2 font-medium hover:bg-muted">Moderation queue</Link>
          <Link to="/community/inbox" className="rounded-full border border-border px-4 py-2 font-medium hover:bg-muted">Support inbox</Link>
          <Link to="/community" className="rounded-full border border-border px-4 py-2 font-medium hover:bg-muted">Open community</Link>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        {stat("Members", "members")}{stat("New this week", "newMembers")}{stat("Posts", "posts")}{stat("Comments", "comments")}{stat("Groups", "groups")}{stat("Open reports", "reports", true)}{stat("Waiting for a person", "waiting", true)}
      </div>
    </section>
  );
}
