import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { unreadCount } from "./api";

/**
 * Unread notification count for the signed-in member, shared by the side nav and the mobile
 * bottom nav. Updated live from the notifications table (realtime) and re-checked every minute
 * and whenever the tab becomes visible. Counts come only from the member's real notifications.
 */
let count = 0;
let messages = 0;
let forUid: string | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((s) => s());
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let channel: any = null;
let timer: number | undefined;

async function refresh() {
  if (!forUid) return;
  const [n, m] = await Promise.all([
    unreadCount().catch(() => count),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).rpc("community_unread_conversations").then((r: { data: number | null; error: unknown }) => (r.error ? messages : r.data ?? 0)).catch(() => messages),
  ]);
  if (n !== count || m !== messages) { count = n; messages = m; emit(); }
}

export function refreshUnread() { void refresh(); }
export function setUnread(n: number) { count = Math.max(0, n); emit(); }

function attach(uid: string | null) {
  if (uid === forUid) return;
  forUid = uid;
  count = 0; messages = 0; emit();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (channel) { (supabase as any).removeChannel(channel); channel = null; }
  window.clearInterval(timer);
  if (!uid) return;
  void refresh();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  channel = (supabase as any).channel(`notifications-${uid}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "community_notifications", filter: `user_id=eq.${uid}` }, () => void refresh())
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "community_conversations" }, () => void refresh())
    .subscribe();
  timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 60_000);
}

export function useUnread(uid: string | null): number {
  useEffect(() => {
    attach(uid);
    const onVis = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [uid]);
  return useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => count, () => 0);
}

/** Conversations with unread messages (shares the notification store's refresh cycle). */
export function useUnreadMessages(uid: string | null): number {
  useUnread(uid);
  return useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => messages, () => 0);
}
