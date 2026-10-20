import { supabase } from "@/integrations/supabase/client";
import { CommunityError, friendly } from "./api";
import type { Profile } from "./types";

/** Community groups (browser side). Membership rules and private-group visibility are enforced by the database. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
const check = <T,>(res: { data: T; error: unknown }): T => { if (res.error) throw new CommunityError(friendly(res.error)); return res.data; };

export interface Group { id: string; slug: string; name: string; description: string | null; topic: string | null; visibility: "public" | "private"; owner_id: string; member_count: number; post_count: number; created_at: string }
export interface Membership { role: "owner" | "admin" | "member"; status: "active" | "pending" }
export interface Member extends Membership { user_id: string; created_at: string; person: Pick<Profile, "username" | "display_name" | "avatar_url" | "headline"> | null }

const G = "id,slug,name,description,topic,visibility,owner_id,member_count,post_count,created_at";

export async function listGroups(q = ""): Promise<Group[]> {
  let query = db.from("community_groups").select(G).order("member_count", { ascending: false }).order("created_at", { ascending: false }).limit(60);
  if (q.trim().length >= 2) query = query.ilike("name", `%${q.trim().replace(/[%_]/g, "")}%`);
  return (check(await query) ?? []) as Group[];
}
export async function myGroupIds(uid: string): Promise<Map<string, Membership>> {
  const rows = check(await db.from("community_group_members").select("group_id,role,status").eq("user_id", uid)) ?? [];
  return new Map((rows as ({ group_id: string } & Membership)[]).map((r) => [r.group_id, { role: r.role, status: r.status }]));
}
export async function groupBySlug(slug: string): Promise<Group | null> {
  return check(await db.from("community_groups").select(G).eq("slug", slug).maybeSingle()) as Group | null;
}
export async function membership(groupId: string, uid: string): Promise<Membership | null> {
  return check(await db.from("community_group_members").select("role,status").eq("group_id", groupId).eq("user_id", uid).maybeSingle()) as Membership | null;
}
export async function members(groupId: string): Promise<Member[]> {
  return (check(await db.from("community_group_members").select("user_id,role,status,created_at, person:community_profiles!community_group_members_user_id_fkey(username,display_name,avatar_url,headline)").eq("group_id", groupId).order("created_at", { ascending: true }).limit(300)) ?? []) as Member[];
}
export const slugifyGroup = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "");
export async function createGroup(uid: string, g: { name: string; description: string; visibility: "public" | "private"; topic: string | null }): Promise<Group> {
  const base = slugifyGroup(g.name) || "group";
  for (let i = 0; i < 5; i++) {
    const slug = i === 0 ? base : `${base.slice(0, 36)}-${i + 1}`;
    const res = await db.from("community_groups").insert({ slug, name: g.name.trim(), description: g.description.trim() || null, visibility: g.visibility, topic: g.topic, owner_id: uid }).select(G).single();
    if (res.error?.code === "23505") continue;
    return check(res) as Group;
  }
  throw new CommunityError("Couldn't pick a unique address for this group. Try a different name.");
}
export async function updateGroup(id: string, patch: Partial<Pick<Group, "name" | "description" | "visibility" | "topic">>): Promise<void> {
  check(await db.from("community_groups").update(patch).eq("id", id).select("id").single());
}
export async function deleteGroup(id: string): Promise<void> { check(await db.from("community_groups").delete().eq("id", id)); }
export async function join(groupId: string, uid: string): Promise<Membership> {
  const res = await db.from("community_group_members").insert({ group_id: groupId, user_id: uid }).select("role,status").single();
  if (res.error?.code === "23505") return (await membership(groupId, uid))!;
  return check(res) as Membership;
}
export async function leave(groupId: string, uid: string): Promise<void> {
  check(await db.from("community_group_members").delete().eq("group_id", groupId).eq("user_id", uid));
}
export async function approve(groupId: string, userId: string): Promise<void> {
  check(await db.from("community_group_members").update({ status: "active" }).eq("group_id", groupId).eq("user_id", userId).select("user_id").single());
}
export async function setRole(groupId: string, userId: string, role: "admin" | "member"): Promise<void> {
  check(await db.from("community_group_members").update({ role }).eq("group_id", groupId).eq("user_id", userId).select("user_id").single());
}
export async function removeMember(groupId: string, userId: string): Promise<void> {
  check(await db.from("community_group_members").delete().eq("group_id", groupId).eq("user_id", userId));
}
