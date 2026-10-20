import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Home, Search, PlusSquare, Bell, User, Bookmark, Settings, BookOpen, ShieldCheck, MessageSquare, Headset, Users, ChevronsLeft, ChevronsRight, Hash, Sparkles, LogIn, ArrowRight,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";
import { useCommunitySession } from "@/lib/community/session";
import { useUnread, useUnreadMessages } from "@/lib/community/unread";
import { setFollow, suggestedPeople, trendingTags } from "@/lib/community/api";
import { TOPICS, type FeedPost, type PostKind } from "@/lib/community/types";
import { latestBlogPosts } from "@/lib/blog-server";
import { openAuth, AuthDialogHost } from "./AuthDialog";
import Composer from "./Composer";
import { Avatar } from "./RichText";

/* ------------------------------------------------------------------ composer launcher */
let composer: { kind?: PostKind; groupId?: string } | null = null;
const composerSubs = new Set<() => void>();
const composerEmit = () => composerSubs.forEach((s) => s());
/** Opens the post composer from anywhere in the community (the feed listens for new posts). */
export function openComposer(kind?: PostKind, groupId?: string) { composer = { kind, groupId }; composerEmit(); }
const closeComposer = () => { composer = null; composerEmit(); };
const createdSubs = new Set<(p: FeedPost) => void>();
/** Subscribe to posts created from the shared composer (so the feed can show them at once). */
export function onPostCreated(fn: (p: FeedPost) => void) { createdSubs.add(fn); return () => { createdSubs.delete(fn); }; }

const COLLAPSE_KEY = "efy_community_nav_collapsed";

/** Starts a post: asks visitors to join and members without a profile to create one first. */
export function useStartPost() {
  const { uid, profile } = useCommunitySession();
  const navigate = useNavigate();
  return (kind?: PostKind, groupId?: string) => {
    if (!uid) return openAuth("Join the EmmaForYou Community to post.");
    if (!profile) return navigate({ to: "/community/settings", search: { setup: true } });
    openComposer(kind, groupId);
  };
}

export default function CommunityShell({ children }: { children: ReactNode }) {
  const session = useCommunitySession();
  const { uid, profile, staff } = session;
  const unread = useUnread(profile ? uid : null);
  const unreadMessages = useUnreadMessages(profile ? uid : null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const startPost = useStartPost();
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => { try { setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1"); } catch { /* storage unavailable */ } }, []);
  const toggle = () => setCollapsed((c) => { try { localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1"); } catch { /* storage unavailable */ } return !c; });
  const open = useSyncExternalStore((cb) => { composerSubs.add(cb); return () => composerSubs.delete(cb); }, () => composer, () => null);
  const navigate = useNavigate();

  const profileHref = profile ? { to: "/community/u/$username" as const, params: { username: profile.username } } : { to: "/community/settings" as const };
  const is = (p: string, exact = false) => (exact ? pathname === p || pathname === `${p}/` : pathname.startsWith(p));

  const items: { label: string; icon: typeof Home; to: string; params?: Record<string, string>; active: boolean; badge?: number; auth?: boolean }[] = [
    { label: "Home", icon: Home, to: "/community", active: is("/community", true) },
    { label: "Explore", icon: Search, to: "/community/search", active: is("/community/search") },
    { label: "Groups", icon: Users, to: "/community/groups", active: is("/community/groups") || is("/community/g/") },
    { label: "Notifications", icon: Bell, to: "/community/notifications", active: is("/community/notifications"), badge: unread, auth: true },
    { label: "Messages", icon: MessageSquare, to: "/community/messages", active: is("/community/messages"), badge: unreadMessages, auth: true },
    { label: "Saved", icon: Bookmark, to: "/community/saved", active: is("/community/saved"), auth: true },
    { label: "Profile", icon: User, ...profileHref, active: Boolean(profile) && is(`/community/u/${profile?.username}`), auth: true },
    { label: "Settings", icon: Settings, to: "/community/settings", active: is("/community/settings"), auth: true },
    { label: "Guidelines", icon: BookOpen, to: "/community/guidelines", active: is("/community/guidelines") },
    ...(staff ? [{ label: "Moderation", icon: ShieldCheck, to: "/community/moderation", active: is("/community/moderation") }, { label: "Support inbox", icon: Headset, to: "/community/inbox", active: is("/community/inbox") }] : []),
  ];

  return (
    <div className="mx-auto w-full max-w-[1320px] px-3 pb-24 pt-24 sm:px-4 md:pb-12 lg:px-6">
      <div className={`grid gap-5 md:grid-cols-[72px_minmax(0,1fr)] ${collapsed ? "lg:grid-cols-[72px_minmax(0,1fr)]" : "lg:grid-cols-[232px_minmax(0,1fr)]"} ${collapsed ? "xl:grid-cols-[72px_minmax(0,1fr)_300px]" : "xl:grid-cols-[232px_minmax(0,1fr)_300px]"}`}>
        {/* Left: community navigation (icons only on tablets, or when collapsed) */}
        <aside aria-label="Community" className="hidden md:block">
          <div className="sticky top-24 flex flex-col gap-1">
            <nav aria-label="Community sections" className="flex flex-col gap-1">
              {items.map((it) => {
                const Icon = it.icon;
                const label = it.badge ? `${it.label}, ${it.badge} unread` : it.label;
                const cls = `group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${it.active ? "bg-[var(--emma-violet)]/10 text-[var(--emma-violet)]" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`;
                const inner = (
                  <>
                    <span className="relative inline-flex"><Icon className="h-5 w-5 shrink-0" aria-hidden="true" />{it.badge ? <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] font-bold leading-4 text-white">{it.badge > 99 ? "99+" : it.badge}</span> : null}</span>
                    <span className={collapsed ? "sr-only" : "hidden lg:inline"}>{it.label}</span>
                  </>
                );
                if (it.auth && !uid) {
                  return <button key={it.label} type="button" onClick={() => openAuth(`Join to see your ${it.label.toLowerCase()}.`, "signin")} className={cls} title={it.label} aria-label={label}>{inner}</button>;
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return <Link key={it.label} to={it.to as any} params={it.params as any} className={cls} title={it.label} aria-label={label} aria-current={it.active ? "page" : undefined}>{inner}</Link>;
              })}
            </nav>
            <button type="button" onClick={() => startPost()} className={`btn-primary-gradient mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-white`} aria-label="Create a post">
              <PlusSquare className="h-5 w-5" aria-hidden="true" /><span className={collapsed ? "sr-only" : "hidden lg:inline"}>Create post</span>
            </button>
            {!collapsed && (
              <div className="mt-5 hidden lg:block">
                <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Topics</p>
                <ul className="mt-1.5 space-y-0.5">
                  {TOPICS.map((t) => (
                    <li key={t.id}><Link to="/community" search={{ topic: t.id }} className="flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><Hash className="h-3.5 w-3.5" aria-hidden="true" />{t.label}</Link></li>
                  ))}
                </ul>
              </div>
            )}
            <button type="button" onClick={toggle} className="mt-3 hidden min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground lg:inline-flex" aria-pressed={collapsed} aria-label={collapsed ? "Expand community menu" : "Collapse community menu"}>
              {collapsed ? <ChevronsRight className="h-4 w-4" aria-hidden="true" /> : <><ChevronsLeft className="h-4 w-4" aria-hidden="true" />Collapse</>}
            </button>
          </div>
        </aside>

        <div className="min-w-0">
          {/* Mobile: the sections the bottom bar has no room for */}
          <nav aria-label="More community sections" className="-mx-3 mb-4 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
            {items.filter((it) => !["Home", "Explore", "Notifications", "Profile"].includes(it.label)).map((it) => {
              const Icon = it.icon;
              const cls = `inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium ${it.active ? "border-[var(--emma-violet)] bg-[var(--emma-violet)]/10 text-[var(--emma-violet)]" : "border-border text-muted-foreground"}`;
              if (it.auth && !uid) return <button key={it.label} type="button" onClick={() => openAuth(`Join to see your ${it.label.toLowerCase()}.`, "signin")} className={cls}><Icon className="h-3.5 w-3.5" aria-hidden="true" />{it.label}</button>;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return <Link key={it.label} to={it.to as any} params={it.params as any} aria-current={it.active ? "page" : undefined} className={cls}><Icon className="h-3.5 w-3.5" aria-hidden="true" />{it.label}</Link>;
            })}
          </nav>
          {children}
        </div>

        {/* Right: discovery */}
        <aside aria-label="Discover" className="hidden xl:block">
          <div className="sticky top-24 space-y-4">
            <DiscoverPanel />
          </div>
        </aside>
      </div>

      {/* Mobile bottom navigation */}
      <nav aria-label="Community" className="fixed inset-x-0 bottom-0 z-[65] border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="mx-auto grid max-w-md grid-cols-5">
          <BottomItem to="/community" label="Home" icon={Home} active={is("/community", true)} />
          <BottomItem to="/community/search" label="Explore" icon={Search} active={is("/community/search")} />
          <li><button type="button" onClick={() => startPost()} className="flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground"><span className="btn-primary-gradient inline-flex h-8 w-10 items-center justify-center rounded-xl text-white"><PlusSquare className="h-5 w-5" aria-hidden="true" /></span>Create</button></li>
          {uid ? <BottomItem to="/community/notifications" label="Alerts" aria="Notifications" icon={Bell} active={is("/community/notifications")} badge={unread} />
            : <li><button type="button" onClick={() => openAuth("Join to get notified about replies and follows.", "signin")} className="flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground" aria-label="Notifications"><Bell className="h-5 w-5" aria-hidden="true" />Alerts</button></li>}
          {uid ? (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <BottomItem {...(profileHref as any)} label="Profile" icon={User} active={is("/community/u/") || is("/community/settings")} />
          ) : (
            <li><button type="button" onClick={() => openAuth(undefined, "signin")} className="flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground"><LogIn className="h-5 w-5" aria-hidden="true" />Sign in</button></li>
          )}
        </ul>
      </nav>

      <Dialog open={Boolean(open)} onOpenChange={(o) => { if (!o) closeComposer(); }}>
        <DialogContent className="max-h-[92dvh] w-[96vw] max-w-2xl overflow-y-auto p-4 sm:p-6">
          <DialogTitle>{open?.groupId ? "Post in this group" : "Create a post"}</DialogTitle>
          <DialogDescription className="sr-only">Write a post for the EmmaForYou Community.</DialogDescription>
          {open && uid && (
            <Composer uid={uid} staff={staff} initialKind={open.kind} groupId={open.groupId} autoFocus onCancel={closeComposer}
              onDone={(p) => { closeComposer(); createdSubs.forEach((fn) => fn(p)); if (p.status === "published") navigate({ to: "/community/post/$id", params: { id: p.id } }); }} />
          )}
        </DialogContent>
      </Dialog>
      <AuthDialogHost />
    </div>
  );
}

function BottomItem({ to, params, label, aria, icon: Icon, active, badge }: { to: string; params?: Record<string, string>; label: string; aria?: string; icon: typeof Home; active: boolean; badge?: number }) {
  return (
    <li>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Link to={to as any} params={params as any} aria-current={active ? "page" : undefined} aria-label={badge ? `${aria ?? label}, ${badge} unread` : aria ?? label}
        className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${active ? "text-[var(--emma-violet)]" : "text-muted-foreground"}`}>
        <span className="relative inline-flex"><Icon className="h-5 w-5" aria-hidden="true" />{badge ? <span aria-hidden="true" className="absolute -right-2 -top-1.5 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] font-bold leading-4 text-white">{badge > 99 ? "99+" : badge}</span> : null}</span>
        {label}
      </Link>
    </li>
  );
}

type Person = Awaited<ReturnType<typeof suggestedPeople>>[number];

/** Right-hand discovery: real trending tags and members from the database, nothing invented. */
export function DiscoverPanel() {
  const { ready, uid, profile } = useCommunitySession();
  const [tags, setTags] = useState<{ tag: string; count: number }[] | null>(null);
  const [people, setPeople] = useState<Person[] | null>(null);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [blog, setBlog] = useState<{ slug: string; title: string; category: string }[]>([]);
  const navigate = useNavigate();
  useEffect(() => { latestBlogPosts({ data: 3 }).then(setBlog).catch(() => setBlog([])); }, []);
  useEffect(() => { trendingTags(8).then(setTags).catch(() => setTags([])); }, []);
  useEffect(() => { if (ready) suggestedPeople(uid, 5).then(setPeople).catch(() => setPeople([])); }, [ready, uid]);

  async function follow(p: Person) {
    if (!uid) return openAuth("Join to follow people.");
    if (!profile) return navigate({ to: "/community/settings", search: { setup: true } });
    const on = !followed.has(p.user_id);
    setFollowed((s) => { const n = new Set(s); if (on) n.add(p.user_id); else n.delete(p.user_id); return n; });
    try { await setFollow(uid, p.user_id, on); } catch { setFollowed((s) => { const n = new Set(s); if (on) n.delete(p.user_id); else n.add(p.user_id); return n; }); }
  }

  return (
    <>
      <form role="search" onSubmit={(e) => { e.preventDefault(); if (q.trim().length >= 2) navigate({ to: "/community/search", search: { q: q.trim() } }); }}>
        <label htmlFor="community-side-search" className="sr-only">Search the community</label>
        <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input id="community-side-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search posts and people" className="input rounded-full pl-9" /></div>
      </form>

      {ready && !uid && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="font-display text-base font-bold">Join the community</h2>
          <p className="mt-1 text-sm text-muted-foreground">Ask questions, share projects and learn from builders and business owners.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => openAuth()} className="btn-primary-gradient rounded-full px-4 py-2 text-sm font-semibold text-white">Join free</button>
            <button type="button" onClick={() => openAuth(undefined, "signin")} className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">Sign in</button>
          </div>
        </section>
      )}
      {ready && uid && !profile && (
        <section className="rounded-2xl border border-[var(--emma-violet)]/40 bg-card p-4">
          <h2 className="font-display text-base font-bold">Finish your profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">Pick a username so you can post, comment and follow people.</p>
          <Link to="/community/settings" search={{ setup: true }} className="btn-primary-gradient mt-3 inline-flex rounded-full px-4 py-2 text-sm font-semibold text-white">Set up profile</Link>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-4" aria-labelledby="trending-h">
        <h2 id="trending-h" className="font-display text-base font-bold">Trending this week</h2>
        {tags === null ? <SkeletonLines /> : tags.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No tags used this week yet.</p> : (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((t) => <li key={t.tag}><Link to="/community" search={{ tag: t.tag }} className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground">#{t.tag} <span className="ml-1 opacity-70">{t.count}</span></Link></li>)}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4" aria-labelledby="people-h">
        <h2 id="people-h" className="font-display text-base font-bold">People to follow</h2>
        {people === null ? <SkeletonLines /> : people.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No suggestions right now.</p> : (
          <ul className="mt-2 space-y-3">
            {people.map((p) => (
              <li key={p.user_id} className="flex items-center gap-2.5">
                <Link to="/community/u/$username" params={{ username: p.username }} aria-hidden="true" tabIndex={-1}><Avatar name={p.display_name} src={p.avatar_url} size={36} /></Link>
                <div className="min-w-0 flex-1">
                  <Link to="/community/u/$username" params={{ username: p.username }} className="block truncate text-sm font-semibold hover:underline">{p.display_name}</Link>
                  <p className="truncate text-xs text-muted-foreground">{p.headline || `@${p.username}`}</p>
                </div>
                <button type="button" onClick={() => follow(p)} aria-pressed={followed.has(p.user_id)} aria-label={`${followed.has(p.user_id) ? "Unfollow" : "Follow"} ${p.display_name}`} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${followed.has(p.user_id) ? "border border-border" : "bg-foreground text-background"}`}>{followed.has(p.user_id) ? "Following" : "Follow"}</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {blog.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-4" aria-labelledby="blog-h">
          <h2 id="blog-h" className="font-display text-base font-bold">Latest from the blog</h2>
          <ul className="mt-2 space-y-2.5">
            {blog.map((b) => <li key={b.slug}><Link to="/blog/$slug" params={{ slug: b.slug }} className="block text-sm font-medium leading-snug hover:underline">{b.title}</Link><span className="text-xs text-muted-foreground">{b.category}</span></li>)}
          </ul>
          <Link to="/blog" className="mt-2 inline-flex text-xs font-semibold text-[var(--emma-violet)] hover:underline">All articles →</Link>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="flex items-center gap-1.5 font-display text-base font-bold"><Sparkles className="h-4 w-4 text-[var(--emma-violet)]" aria-hidden="true" />Need it built?</h2>
        <p className="mt-1 text-sm text-muted-foreground">Browse ready-to-use websites, apps, AI and automation solutions.</p>
        <Link to="/solutions" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[var(--emma-violet)] hover:underline">Explore solutions <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
      </section>
      <p className="px-1 text-xs text-muted-foreground"><Link to="/community/guidelines" className="hover:underline">Community guidelines</Link> · <Link to="/privacy" className="hover:underline">Privacy</Link> · <Link to="/terms" className="hover:underline">Terms</Link></p>
    </>
  );
}

function SkeletonLines() {
  return <div className="mt-2 space-y-2" aria-hidden="true">{[0, 1, 2].map((i) => <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${85 - i * 15}%` }} />)}</div>;
}
