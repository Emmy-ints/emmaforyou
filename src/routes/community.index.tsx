import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { KineticText } from "@/components/future/Kinetic";
import { useCallback, useEffect, useRef, useState } from "react";
import { HelpCircle, BarChart3, FolderKanban, GraduationCap, Loader2, RefreshCw, X, PenSquare } from "lucide-react";
import { pageHead, breadcrumbLd } from "@/lib/seo";
import { fetchFeed, friendly, pinnedPosts, type FeedPage } from "@/lib/community/api";
import { useCommunitySession } from "@/lib/community/session";
import { FEED_SORTS, POST_KINDS, TOPICS, topicLabel, type FeedPost, type FeedSort, type PostKind } from "@/lib/community/types";
import PostCard from "@/components/community/PostCard";
import Composer from "@/components/community/Composer";
import { onPostCreated, useStartPost } from "@/components/community/CommunityShell";
import { openAuth } from "@/components/community/AuthDialog";
import { Avatar } from "@/components/community/RichText";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

interface FeedSearch { sort?: FeedSort; tag?: string; topic?: string; kind?: string }
const SORTS = new Set(FEED_SORTS.map((s) => s.id));
const KINDS = new Set<string>([...POST_KINDS.map((k) => k.id), "announcement"]);
const TOPIC_IDS = new Set(TOPICS.map((t) => t.id));

export const Route = createFileRoute("/community/")({
  validateSearch: (s: Record<string, unknown>): FeedSearch => {
    const out: FeedSearch = {};
    if (typeof s.sort === "string" && SORTS.has(s.sort as FeedSort)) out.sort = s.sort as FeedSort;
    if (typeof s.tag === "string" && /^[a-z0-9-]{1,30}$/i.test(s.tag)) out.tag = s.tag.toLowerCase();
    if (typeof s.topic === "string" && TOPIC_IDS.has(s.topic)) out.topic = s.topic;
    if (typeof s.kind === "string" && KINDS.has(s.kind)) out.kind = s.kind;
    return out;
  },
  head: () => pageHead({
    title: "EmmaForYou Community — Ask, Share & Build Together",
    description: "Join the EmmaForYou Community: ask questions, share projects and tutorials, and learn about websites, apps, AI and automation with builders and business owners.",
    path: "/community",
    jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Community", path: "/community" }])],
  }),
  component: FeedPage,
});

const QUICK: { kind: PostKind; label: string; icon: typeof HelpCircle }[] = [
  { kind: "question", label: "Ask", icon: HelpCircle },
  { kind: "poll", label: "Poll", icon: BarChart3 },
  { kind: "project", label: "Project", icon: FolderKanban },
  { kind: "tutorial", label: "Tutorial", icon: GraduationCap },
];

function FeedPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/community/" });
  const { ready, uid, profile, staff } = useCommunitySession();
  const startPost = useStartPost();
  const sort: FeedSort = search.sort ?? (uid ? "for_you" : "latest");
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [next, setNext] = useState<FeedPage["next"]>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<FeedPost | null>(null);
  const [pinned, setPinned] = useState<FeedPost[]>([]);
  const showPinned = !search.tag && !search.topic && !search.kind && (sort === "for_you" || sort === "latest");
  const reqId = useRef(0);
  const sentinel = useRef<HTMLDivElement>(null);
  const filterKey = `${sort}|${search.tag ?? ""}|${search.topic ?? ""}|${search.kind ?? ""}|${uid ?? ""}`;

  const load = useCallback(async (more: boolean) => {
    const id = more ? reqId.current : ++reqId.current;
    if (more) setLoadingMore(true); else { setPosts(null); setError(""); setNext(null); }
    try {
      const page = await fetchFeed({ sort, tag: search.tag, topic: search.topic, kind: search.kind, ...(more && next ? next : {}) });
      if (id !== reqId.current) return;
      setPosts((p) => {
        if (!more || !p) return page.posts;
        const seen = new Set(p.map((x) => x.id));
        return [...p, ...page.posts.filter((x) => !seen.has(x.id))];
      });
      setNext(page.next);
    } catch (e) {
      if (id !== reqId.current) return;
      setError(friendly(e, "Couldn't load the feed. Check your connection and try again."));
      if (!more) setPosts([]);
    } finally { if (id === reqId.current) setLoadingMore(false); }
  }, [sort, search.tag, search.topic, search.kind, next]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (ready) void load(false); }, [filterKey, ready]);
  useEffect(() => { if (ready && showPinned) pinnedPosts(uid).then(setPinned).catch(() => setPinned([])); else setPinned([]); }, [ready, uid, showPinned]);
  useEffect(() => onPostCreated((p) => { if (p.status === "published" && !p.group_id) setPosts((list) => (list ? [p, ...list.filter((x) => x.id !== p.id)] : [p])); }), []);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !next || loadingMore || error) return;
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) void load(true); }, { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [next, loadingMore, error, load]);

  const setSort = (s: FeedSort) => {
    if (s === "following" && !uid) return openAuth("Join to see posts from people you follow.");
    navigate({ search: (prev: FeedSearch) => ({ ...prev, sort: s }), replace: true });
  };
  const clearFilter = (k: "tag" | "topic" | "kind") => navigate({ search: (prev: FeedSearch) => ({ ...prev, [k]: undefined }), replace: true });
  const update = (p: FeedPost) => {
    setPosts((list) => list?.map((x) => (x.id === p.id ? p : x)) ?? list);
    setPinned((list) => (p.is_pinned && p.status === "published" ? (list.some((x) => x.id === p.id) ? list.map((x) => (x.id === p.id ? p : x)) : [p, ...list]) : list.filter((x) => x.id !== p.id)));
  };
  const remove = (id: string) => { setPosts((list) => list?.filter((x) => x.id !== id) ?? list); setPinned((list) => list.filter((x) => x.id !== id)); };
  const pinnedIds = new Set(pinned.map((p) => p.id));
  const filters = [
    search.topic && { k: "topic" as const, label: topicLabel(search.topic) ?? search.topic },
    search.tag && { k: "tag" as const, label: `#${search.tag}` },
    search.kind && { k: "kind" as const, label: POST_KINDS.find((x) => x.id === search.kind)?.label ?? "Announcements" },
  ].filter(Boolean) as { k: "tag" | "topic" | "kind"; label: string }[];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl"><KineticText text="Community" base={60} /></h1>
      <p className="mt-1 text-sm text-muted-foreground">Questions, projects and ideas about websites, apps, AI and automation.</p>

      {/* Start a post */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-3 sm:p-4">
        <div className="flex items-center gap-3">
          {profile ? <Avatar name={profile.display_name} src={profile.avatar_url} size={40} /> : <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted"><PenSquare className="h-4 w-4 text-muted-foreground" aria-hidden="true" /></span>}
          <button type="button" onClick={() => startPost()} className="min-h-11 flex-1 rounded-full border border-border bg-background px-4 text-left text-sm text-muted-foreground hover:border-[var(--emma-violet)]">
            {uid ? "Share something with the community…" : "Join to share something with the community…"}
          </button>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1">
          {QUICK.map(({ kind, label, icon: Icon }) => (
            <button key={kind} type="button" onClick={() => startPost(kind)} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:text-sm">
              <Icon className="h-4 w-4" aria-hidden="true" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort tabs */}
      <div role="group" aria-label="Sort the feed" className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-3 mt-4 flex gap-1 overflow-x-auto px-3 sm:mx-0 sm:px-0">
        {FEED_SORTS.map((s) => (
          <button key={s.id} type="button" aria-pressed={sort === s.id} onClick={() => setSort(s.id)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${sort === s.id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>{s.label}</button>
        ))}
      </div>

      {filters.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Active filters">
          {filters.map((f) => (
            <button key={f.k} type="button" onClick={() => clearFilter(f.k)} className="inline-flex items-center gap-1 rounded-full border border-[var(--emma-violet)]/40 bg-[var(--emma-violet)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--emma-violet)]" aria-label={`Remove filter ${f.label}`}>
              {f.label}<X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ))}
          {search.topic && TOPICS.find((t) => t.id === search.topic)?.solutions && (
            <Link to={TOPICS.find((t) => t.id === search.topic)!.solutions as "/solutions"} className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline">See {topicLabel(search.topic)} solutions →</Link>
          )}
        </div>
      )}

      <section aria-label="Posts" aria-busy={posts === null} className="mt-4 space-y-4">
        {posts === null ? <FeedSkeleton /> : posts.length === 0 && !(showPinned && pinned.length > 0) ? (
          error ? (
            <div role="alert" className="rounded-2xl border border-border bg-card p-6 text-center">
              <p className="text-sm">{error}</p>
              <button type="button" onClick={() => load(false)} className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"><RefreshCw className="h-4 w-4" aria-hidden="true" />Try again</button>
            </div>
          ) : <EmptyFeed sort={sort} filtered={filters.length > 0} onStart={() => startPost(sort === "unanswered" ? "question" : undefined)} />
        ) : (
          <>
            {showPinned && pinned.map((p) => <PostCard key={`pin-${p.id}`} post={p} onChange={update} onRemoved={remove} onEdit={setEditing} />)}
            {posts.filter((p) => !(showPinned && pinnedIds.has(p.id))).map((p) => <PostCard key={p.id} post={p} onChange={update} onRemoved={remove} onEdit={setEditing} />)}
            <div ref={sentinel} />
            {error && <p role="alert" className="text-center text-sm text-red-600">{error} <button type="button" onClick={() => load(true)} className="font-semibold underline">Retry</button></p>}
            {next ? (
              <div className="flex justify-center"><button type="button" onClick={() => load(true)} disabled={loadingMore} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-60">{loadingMore && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Load more</button></div>
            ) : <p className="py-4 text-center text-xs text-muted-foreground">You're all caught up.</p>}
          </>
        )}
      </section>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="max-h-[92dvh] w-[96vw] max-w-2xl overflow-y-auto p-4 sm:p-6">
          <DialogTitle>Edit post</DialogTitle>
          <DialogDescription className="sr-only">Change your post and save it.</DialogDescription>
          {editing && uid && <Composer uid={uid} staff={staff} editing={editing} onCancel={() => setEditing(null)} onDone={(p) => { setEditing(null); if (p.status === "published") update(p); else remove(p.id); }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyFeed({ sort, filtered, onStart }: { sort: FeedSort; filtered: boolean; onStart: () => void }) {
  const msg = filtered ? "No posts match this filter yet." : sort === "following" ? "Posts from people you follow will show here. Follow members to fill your feed."
    : sort === "unanswered" ? "Every question has an answer right now." : sort === "popular" ? "Nothing popular in the last 30 days yet." : "No posts yet. Be the first to start a conversation.";
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
      <p className="text-sm text-muted-foreground">{msg}</p>
      <button type="button" onClick={onStart} className="btn-primary-gradient mt-4 rounded-full px-5 py-2.5 text-sm font-semibold text-white">{sort === "unanswered" ? "Ask a question" : "Create a post"}</button>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3"><div className="h-11 w-11 animate-pulse rounded-full bg-muted" /><div className="flex-1 space-y-2"><div className="h-3.5 w-1/3 animate-pulse rounded bg-muted" /><div className="h-3 w-1/4 animate-pulse rounded bg-muted" /></div></div>
          <div className="mt-4 space-y-2"><div className="h-3.5 animate-pulse rounded bg-muted" /><div className="h-3.5 w-5/6 animate-pulse rounded bg-muted" /><div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" /></div>
        </div>
      ))}
    </div>
  );
}
