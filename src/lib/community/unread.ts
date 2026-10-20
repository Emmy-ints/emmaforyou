import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { unreadCount } from "./api";

/**
 * Unread notification count for the signed-in member, shared by the side nav and the mobile
 * bottom nav. Updated live from the notifications table (realtime) and re-checked every minute
 * and whenever the tab becomes visible. Counts come only from the member's real notifications.
 */
let count = 0;
let forUid: string | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((s) => s());
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let channel: any = null;
let timer: number | undefined;

async function refresh() {
  if (!forUid) return;
  const n = await unreadCount().catch(() => count);
  if (n !== count) { count = n; emit(); }
}

export function refreshUnread() { void refresh(); }
export function setUnread(n: number) { count = Math.max(0, n); emit(); }

function attach(uid: string | null) {
  if (uid === forUid) return;
  forUid = uid;
  count = 0; emit();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (channel) { (supabase as any).removeChannel(channel); channel = null; }
  window.clearInterval(timer);
  if (!uid) return;
  void refresh();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  channel = (supabase as any).channel(`notifications-${uid}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "community_notifications", filter: `user_id=eq.${uid}` }, () => void refresh())
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
