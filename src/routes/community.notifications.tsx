import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, CheckCheck, Heart, MessageCircle, AtSign, UserPlus, Award, ShieldAlert, Megaphone } from "lucide-react";
import { pageHead } from "@/lib/seo";
import { friendly, listNotifications, markAllRead, markRead } from "@/lib/community/api";
import { useCommunitySession } from "@/lib/community/session";
import { refreshUnread, setUnread } from "@/lib/community/unread";
import type { NotificationRow } from "@/lib/community/types";
import { openAuth } from "@/components/community/AuthDialog";
import { Avatar, timeAgo } from "@/components/community/RichText";

export const Route = createFileRoute("/community/notifications")({
  head: () => pageHead({ title: "Notifications — EmmaForYou Community", description: "Your EmmaForYou Community notifications.", path: "/community/notifications", noindex: true }),
  component: NotificationsPage,
});

const TEXT: Record<NotificationRow["type"], { icon: typeof Heart; text: string }> = {
  reaction: { icon: Heart, text: "reacted to your post" },
  comment: { icon: MessageCircle, text: "commented on your post" },
  reply: { icon: MessageCircle, text: "replied to your comment" },
  mention: { icon: AtSign, text: "mentioned you" },
  follow: { icon: UserPlus, text: "started following you" },
  accepted: { icon: Award, text: "marked your answer as accepted" },
  moderation: { icon: ShieldAlert, text: "A moderator reviewed your content" },
  announcement: { icon: Megaphone, text: "posted an announcement" },
};

function NotificationsPage() {
  const { ready, uid, profile } = useCommunitySession();
  const [list, setList] = useState<NotificationRow[] | null>(null);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready || !uid || !profile) { if (ready) setList([]); return; }
    listNotifications().then((l) => { setList(l); setMore(l.length === 30); }).catch((e) => { setError(friendly(e)); setList([]); });
  }, [ready, uid, profile]);

  async function loadMore() {
    if (!list?.length) return;
    setBusy(true);
    try { const l = await listNotifications(list[list.length - 1].created_at); setList([...list, ...l]); setMore(l.length === 30); }
    catch (e) { setError(friendly(e)); } finally { setBusy(false); }
  }
  async function readAll() {
    try { await markAllRead(); setList((l) => l?.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })) ?? l); setUnread(0); }
    catch (e) { setError(friendly(e)); }
  }
  function open(n: NotificationRow) {
    if (n.read_at) return;
    setList((l) => l?.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)) ?? l);
    markRead(n.id).then(refreshUnread).catch(() => undefined);
  }

  if (ready && !uid) return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center">
      <h1 className="font-display text-xl font-bold">Notifications</h1>
      <p className="mt-2 text-sm text-muted-foreground">Sign in to see replies, reactions and new followers.</p>
      <button type="button" onClick={() => openAuth(undefined, "signin")} className="btn-primary-gradient mt-4 rounded-full px-5 py-2.5 text-sm font-semibold text-white">Sign in</button>
    </div>
  );
  const unread = list?.some((n) => !n.read_at);
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-extrabold">Notifications</h1>
        {unread && <button type="button" onClick={readAll} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted"><CheckCheck className="h-4 w-4" aria-hidden="true" />Mark all read</button>}
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      {ready && uid && !profile ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">Create your profile to start getting notifications. <Link to="/community/settings" search={{ setup: true }} className="font-semibold text-foreground underline">Set up profile</Link></p>
      ) : list === null ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading notifications" /></div>
        : list.length === 0 ? <p className="mt-4 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">No notifications yet. They'll show here when people react, reply, mention or follow you.</p> : (
        <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {list.map((n) => {
            const t = TEXT[n.type];
            const Icon = t.icon;
            const name = n.actor?.display_name;
            const line = n.type === "moderation" ? t.text : `${name ?? "Someone"} ${t.text}`;
            const inner = (
              <>
                <span className="relative shrink-0">{n.actor ? <Avatar name={n.actor.display_name} src={n.actor.avatar_url} size={40} /> : <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted"><Icon className="h-4 w-4" aria-hidden="true" /></span>}
                  <span className="absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--emma-violet)] text-white"><Icon className="h-3 w-3" aria-hidden="true" /></span></span>
                <span className="min-w-0 flex-1"><span className={`block text-sm ${n.read_at ? "text-muted-foreground" : "font-semibold"}`}>{line}</span><span className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</span></span>
                {!n.read_at && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--emma-violet)]" aria-label="Unread" />}
              </>
            );
            const cls = `flex items-center gap-3 px-4 py-3 hover:bg-muted/50 ${n.read_at ? "" : "bg-[var(--emma-violet)]/5"}`;
            return (
              <li key={n.id}>
                {n.post_id ? <Link to="/community/post/$id" params={{ id: n.post_id }} onClick={() => open(n)} className={cls}>{inner}</Link>
                  : n.type === "follow" && n.actor ? <Link to="/community/u/$username" params={{ username: n.actor.username }} onClick={() => open(n)} className={cls}>{inner}</Link>
                  : <button type="button" onClick={() => open(n)} className={`${cls} w-full text-left`}>{inner}</button>}
              </li>
            );
          })}
        </ul>
      )}
      {more && <div className="mt-4 flex justify-center"><button type="button" onClick={loadMore} disabled={busy} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Load more</button></div>}
    </div>
  );
}
