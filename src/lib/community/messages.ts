// @ts-nocheck -- generated DB/router types lag behind; runtime verified
import { supabase } from "@/integrations/supabase/client";
import { CommunityError, friendly, newKey } from "./api";
import type { Profile } from "./types";
import { refreshUnread } from "./unread";

/**
 * Private messages and the community assistant (browser side). Membership, blocks, rate limits
 * and who may reply (member, staff, AI) are all enforced by the database.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
const check = <T,>(res: { data: T; error: unknown }): T => { if (res.error) throw new CommunityError(friendly(res.error)); return res.data; };

type Person = Pick<Profile, "user_id" | "username" | "display_name" | "avatar_url">;
export interface Conversation {
  id: string; kind: "direct" | "assistant"; member_a: string; member_b: string | null; control: "ai" | "human"; control_version: number;
  specialist: string | null; human_requested_at: string | null; last_message_at: string; last_message_preview: string | null;
  a: Person | null; b: Person | null; unread: boolean;
}
export interface Message { id: string; conversation_id: string; sender_kind: "member" | "ai" | "staff" | "system"; sender_id: string | null; body: string; created_at: string; client_key?: string | null }

const CONV = "id,kind,member_a,member_b,control,control_version,specialist,human_requested_at,last_message_at,last_message_preview, a:community_profiles!community_conversations_member_a_fkey(user_id,username,display_name,avatar_url), b:community_profiles!community_conversations_member_b_fkey(user_id,username,display_name,avatar_url)";

async function withUnread(rows: Omit<Conversation, "unread">[], uid: string): Promise<Conversation[]> {
  if (!rows.length) return [];
  const reads = check(await db.from("community_conversation_reads").select("conversation_id,last_read_at").eq("user_id", uid).in("conversation_id", rows.map((r) => r.id))) ?? [];
  const map = new Map<string, string>((reads as { conversation_id: string; last_read_at: string }[]).map((r) => [r.conversation_id, r.last_read_at]));
  return rows.map((r) => ({ ...r, unread: !map.has(r.id) ? Boolean(r.last_message_preview) : map.get(r.id)! < r.last_message_at }));
}

/** The member's own conversations (direct messages and their assistant chat). */
export async function myConversations(uid: string): Promise<Conversation[]> {
  const rows = check(await db.from("community_conversations").select(CONV).or(`member_a.eq.${uid},member_b.eq.${uid}`).order("last_message_at", { ascending: false }).limit(100)) ?? [];
  return withUnread(rows, uid);
}

/** Staff inbox: assistant conversations, people waiting for a human first. */
export async function staffInbox(uid: string): Promise<Conversation[]> {
  const rows = check(await db.from("community_conversations").select(CONV).eq("kind", "assistant").order("human_requested_at", { ascending: false, nullsFirst: false }).order("last_message_at", { ascending: false }).limit(100)) ?? [];
  return withUnread(rows, uid);
}

export async function getConversation(id: string, uid: string): Promise<Conversation | null> {
  const row = check(await db.from("community_conversations").select(CONV).eq("id", id).maybeSingle());
  return row ? (await withUnread([row], uid))[0] : null;
}

export async function listMessages(conversationId: string, before?: string): Promise<Message[]> {
  let q = db.from("community_messages").select("id,conversation_id,sender_kind,sender_id,body,created_at,client_key").eq("conversation_id", conversationId).order("created_at", { ascending: false }).limit(50);
  if (before) q = q.lt("created_at", before);
  return ((check(await q) ?? []) as Message[]).reverse();
}

export async function sendMessage(conversationId: string, uid: string, body: string, kind: "member" | "staff" = "member", clientKey = newKey()): Promise<Message> {
  const res = await db.from("community_messages").insert({ conversation_id: conversationId, sender_id: uid, sender_kind: kind, body: body.trim(), client_key: clientKey }).select("id,conversation_id,sender_kind,sender_id,body,created_at,client_key").single();
  if (res.error?.code === "23505") {
    const again = await db.from("community_messages").select("id,conversation_id,sender_kind,sender_id,body,created_at,client_key").eq("conversation_id", conversationId).eq("client_key", clientKey).single();
    return check(again);
  }
  return check(res);
}

export async function markConversationRead(conversationId: string, uid: string): Promise<void> {
  await db.from("community_conversation_reads").upsert({ conversation_id: conversationId, user_id: uid, last_read_at: new Date().toISOString() }, { onConflict: "conversation_id,user_id" });
  refreshUnread();
}

export async function startDirect(otherId: string): Promise<string> {
  return check(await db.rpc("community_start_direct", { _other: otherId })) as string;
}

export async function assistantConversation(): Promise<string> {
  return check(await db.rpc("community_assistant_conversation")) as string;
}

export async function requestHuman(): Promise<void> {
  check(await db.rpc("community_request_human"));
}

export async function setControl(conversationId: string, control: "ai" | "human"): Promise<number> {
  return check(await db.rpc("community_set_control", { _conv: conversationId, _control: control })) as number;
}

/** Ask the server to write the assistant's reply. Returns who is handling the conversation. */
export async function askAssistant(conversationId: string): Promise<{ handled?: string; error?: string }> {
  const { data } = await supabase.auth.getSession();
  const res = await fetch("/api/community-assistant", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
    body: JSON.stringify({ conversationId }),
  });
  const j = await res.json().catch(() => ({}));
  return res.ok ? j : { error: j.error || "The assistant couldn't answer just now." };
}

/** Live updates for one conversation. Returns an unsubscribe function. */
export function subscribeMessages(conversationId: string, onMessage: (m: Message) => void, onConversation?: () => void): () => void {
  const ch = db.channel(`messages-${conversationId}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_messages", filter: `conversation_id=eq.${conversationId}` }, (msg: { new: Message }) => onMessage(msg.new))
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "community_conversations", filter: `id=eq.${conversationId}` }, () => onConversation?.())
    .subscribe();
  return () => { db.removeChannel(ch); };
}
