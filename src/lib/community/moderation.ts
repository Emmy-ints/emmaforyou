import { supabase } from "@/integrations/supabase/client";
import { CommunityError, friendly } from "./api";

/**
 * Moderation queue for community staff (admins and moderators). The database only returns
 * reports and audit entries to staff, and community_moderate() re-checks the role and writes
 * every action to the audit log, so nothing here relies on the interface for authorisation.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
const check = <T,>(res: { data: T; error: unknown }): T => { if (res.error) throw new CommunityError(friendly(res.error)); return res.data; };

export interface QueueItem {
  target_type: "post" | "comment" | "profile";
  target_id: string;
  reports: { id: string; reason: string; details: string | null; created_at: string; reporter: string }[];
  preview: { title: string; body: string; author: string; username: string; status: string; post_id?: string } | null;
}

export async function reportQueue(status: "open" | "actioned" | "dismissed" = "open"): Promise<QueueItem[]> {
  const rows = check(await db.from("community_reports")
    .select("id,target_type,target_id,reason,details,created_at, reporter:community_profiles!community_reports_reporter_id_fkey(username)")
    .eq("status", status).order("created_at", { ascending: false }).limit(200)) ?? [];
  const groups = new Map<string, QueueItem>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of rows as any[]) {
    const k = `${r.target_type}:${r.target_id}`;
    if (!groups.has(k)) groups.set(k, { target_type: r.target_type, target_id: r.target_id, reports: [], preview: null });
    groups.get(k)!.reports.push({ id: r.id, reason: r.reason, details: r.details, created_at: r.created_at, reporter: r.reporter?.username ?? "member" });
  }
  const items = [...groups.values()];
  const ids = (t: string) => items.filter((i) => i.target_type === t).map((i) => i.target_id);
  const [posts, comments, profiles] = await Promise.all([
    ids("post").length ? db.from("community_posts").select("id,title,body,status, author:community_profiles(username,display_name)").in("id", ids("post")) : { data: [] },
    ids("comment").length ? db.from("community_comments").select("id,post_id,body,status, author:community_profiles(username,display_name)").in("id", ids("comment")) : { data: [] },
    ids("profile").length ? db.from("community_profiles").select("user_id,username,display_name,headline,bio,suspended_at").in("user_id", ids("profile")) : { data: [] },
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byId = new Map<string, any>();
  for (const p of posts.data ?? []) byId.set(`post:${p.id}`, { title: p.title ?? "", body: p.body, author: p.author?.display_name ?? "", username: p.author?.username ?? "", status: p.status, post_id: p.id });
  for (const c of comments.data ?? []) byId.set(`comment:${c.id}`, { title: "Comment", body: c.body, author: c.author?.display_name ?? "", username: c.author?.username ?? "", status: c.status, post_id: c.post_id });
  for (const p of profiles.data ?? []) byId.set(`profile:${p.user_id}`, { title: p.display_name, body: [p.headline, p.bio].filter(Boolean).join(" — "), author: p.display_name, username: p.username, status: p.suspended_at ? "suspended" : "active" });
  for (const i of items) i.preview = byId.get(`${i.target_type}:${i.target_id}`) ?? null;
  return items.sort((a, b) => b.reports.length - a.reports.length);
}

export async function moderate(targetType: "post" | "comment" | "profile", targetId: string, action: string, reason?: string): Promise<void> {
  check(await db.rpc("community_moderate", { _target_type: targetType, _target_id: targetId, _action: action, _reason: reason ?? null }));
}

export async function dismissReports(reportIds: string[]): Promise<void> {
  for (const id of reportIds) check(await db.rpc("community_dismiss_report", { _report_id: id }));
}

export interface AuditRow { id: number; action: string; target_type: string; target_id: string | null; details: { reason?: string } | null; created_at: string; actor_id: string | null; actor: string | null }
/** Recent moderation actions. actor_id has no foreign key (entries outlive deleted profiles), so names are looked up separately. */
export async function auditLog(limit = 50): Promise<AuditRow[]> {
  const rows = (check(await db.from("community_audit_log").select("id,action,target_type,target_id,details,created_at,actor_id").order("created_at", { ascending: false }).limit(limit)) ?? []) as Omit<AuditRow, "actor">[];
  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))] as string[];
  const names = new Map<string, string>();
  if (actorIds.length) {
    const res = await db.from("community_profiles").select("user_id,username").in("user_id", actorIds);
    for (const p of res.data ?? []) names.set(p.user_id, p.username);
  }
  return rows.map((r) => ({ ...r, actor: r.actor_id ? names.get(r.actor_id) ?? null : null }));
}
