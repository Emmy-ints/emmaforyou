import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BadgeCheck, Bookmark, BookmarkCheck, CheckCircle2, ChevronDown, Flag, Link2, MessageCircle, MoreHorizontal, Pencil, Pin, Share2, Trash2, UserPlus, UserMinus } from "lucide-react";
import RichText, { Avatar, timeAgo } from "./RichText";
import { openAuth } from "./AuthDialog";
import ReportDialog from "./ReportDialog";
import { deletePost, friendly, isFollowing, mediaUrl, setFollow, setReaction, setSaved, vote } from "@/lib/community/api";
import { useCommunitySession } from "@/lib/community/session";
import { moderate } from "@/lib/community/moderation";
import { getLinkPreview, type LinkPreview } from "@/lib/community/link-preview";
import { POST_KINDS, REACTIONS, topicLabel, type FeedPost, type MediaItem, type ReactionKind } from "@/lib/community/types";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";

const KIND_LABEL: Record<string, string> = Object.fromEntries([...POST_KINDS.map((k) => [k.id, k.label]), ["announcement", "Announcement"]]);

export default function PostCard({ post, onChange, onRemoved, onEdit, full = false }: {
  post: FeedPost; onChange: (p: FeedPost) => void; onRemoved?: (id: string) => void; onEdit?: (p: FeedPost) => void; full?: boolean;
}) {
  const { uid, staff } = useCommunitySession();
  const [expanded, setExpanded] = useState(full);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const mine = uid === post.author_id;
  const long = post.body.length > 600 || post.body.split("\n").length > 10;
  const flash = (m: string) => { setToast(m); window.setTimeout(() => setToast(""), 2200); };

  async function react(next: ReactionKind | null) {
    if (!uid) return openAuth("Join to react to posts.");
    const prev = post;
    const reactions = { ...post.reactions };
    if (post.my_reaction) reactions[post.my_reaction] = Math.max(0, (reactions[post.my_reaction] ?? 1) - 1);
    if (next) reactions[next] = (reactions[next] ?? 0) + 1;
    const count = post.reaction_count + (next && !post.my_reaction ? 1 : !next && post.my_reaction ? -1 : 0);
    onChange({ ...post, reactions, reaction_count: Math.max(0, count), my_reaction: next });
    try { await setReaction(post.id, uid, next, prev.my_reaction); setError(""); }
    catch (e) { onChange(prev); setError(e instanceof Error ? e.message : friendly(e)); }
  }

  async function toggleSave() {
    if (!uid) return openAuth("Join to save posts for later.");
    const prev = post;
    onChange({ ...post, saved: !post.saved });
    try { await setSaved(post.id, uid, !prev.saved); flash(prev.saved ? "Removed from saved" : "Saved"); }
    catch (e) { onChange(prev); setError(e instanceof Error ? e.message : friendly(e)); }
  }

  async function castVote(i: number) {
    if (!uid) return openAuth("Join to vote in polls.");
    if (!post.poll_counts) return;
    const prev = post;
    const counts = [...post.poll_counts];
    if (post.my_vote !== null && post.my_vote !== undefined) counts[post.my_vote] = Math.max(0, counts[post.my_vote] - 1);
    counts[i] += 1;
    onChange({ ...post, poll_counts: counts, my_vote: i });
    try { await vote(post.id, uid, i, prev.my_vote); setError(""); }
    catch (e) { onChange(prev); setError(e instanceof Error ? e.message : friendly(e)); }
  }

  async function share() {
    const url = `${window.location.origin}/community/post/${post.id}`;
    try {
      if (navigator.share) await navigator.share({ title: post.title ?? `Post by ${post.author_name}`, url });
      else { await navigator.clipboard.writeText(url); flash("Link copied"); }
    } catch { /* cancelled */ }
  }

  async function remove() {
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    try { await deletePost(post.id); onRemoved?.(post.id); }
    catch (e) { setError(e instanceof Error ? e.message : friendly(e)); }
  }

  const postLink = { to: "/community/post/$id" as const, params: { id: post.id } };
  return (
    <article className="rounded-[20px] border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5" aria-labelledby={`post-${post.id}-by`}>
      {post.is_pinned && <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--emma-violet)]"><Pin className="h-3.5 w-3.5" aria-hidden="true" />Pinned by the community team</p>}
      <header className="flex items-start gap-3">
        <Link to="/community/u/$username" params={{ username: post.author_username }} className="shrink-0" aria-hidden="true" tabIndex={-1}><Avatar name={post.author_name} src={post.author_avatar} size={44} /></Link>
        <div className="min-w-0 flex-1">
          <p id={`post-${post.id}-by`} className="flex flex-wrap items-center gap-x-1.5 text-sm">
            <Link to="/community/u/$username" params={{ username: post.author_username }} className="font-semibold text-foreground hover:underline">{post.author_name}</Link>
            {post.author_agent && <span className="inline-flex items-center gap-0.5 rounded-full border border-sky-500/40 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700 dark:text-sky-300" title="An automated EmmaForYou AI agent, not a person. The EmmaForYou team can step in at any time.">AI agent</span>}
            {post.author_specialist && !post.author_agent && <span className="inline-flex items-center gap-0.5 rounded-full bg-[color-mix(in_srgb,var(--emma-violet)_12%,transparent)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--emma-violet)]" title="Specialist status assigned by EmmaForYou"><BadgeCheck className="h-3 w-3" aria-hidden="true" />Specialist</span>}
            <span className="text-muted-foreground">@{post.author_username}</span>
          </p>
          {post.author_headline && <p className="truncate text-xs text-muted-foreground">{post.author_headline}</p>}
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
            <Link {...postLink} className="hover:underline"><time dateTime={post.published_at ?? undefined}>{post.status === "draft" ? "Draft" : timeAgo(post.published_at)}</time></Link>
            {post.edited_at && <span>· edited</span>}
            {post.visibility === "members" && <span>· members only</span>}
            {post.kind !== "update" && <span className="rounded-full bg-muted px-1.5 py-0.5 font-medium text-foreground/80">{KIND_LABEL[post.kind]}</span>}
            {post.kind === "question" && post.accepted_comment_id && <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600"><CheckCircle2 className="h-3 w-3" aria-hidden="true" />Answered</span>}
          </p>
        </div>
        <PostMenu post={post} mine={mine} uid={uid} staff={staff} onEdit={onEdit} onDelete={remove} onShare={share} onModerated={(p) => { onChange(p); if (p.status === "removed" && !full) onRemoved?.(p.id); }} onError={flash} />
      </header>

      <div className="mt-3">
        {post.title && <h2 className="mb-1.5 font-display text-lg font-semibold leading-snug text-foreground">{full ? post.title : <Link {...postLink} className="hover:underline">{post.title}</Link>}</h2>}
        <div className={!expanded && long ? "relative max-h-56 overflow-hidden" : ""}>
          <RichText text={post.body} className="text-[0.95rem] text-foreground/90" />
          {!expanded && long && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--card)] to-transparent" />}
        </div>
        {!expanded && long && <button type="button" onClick={() => setExpanded(true)} className="mt-1 text-sm font-semibold text-[var(--emma-violet)] hover:underline">See more</button>}
        {post.media.length > 0 && <MediaGrid media={post.media} />}
        {post.link_url && <LinkCard url={post.link_url} />}
        {post.poll_options && post.poll_counts && <Poll options={post.poll_options} counts={post.poll_counts} myVote={post.my_vote} onVote={castVote} />}
        {(post.tags.length > 0 || post.topic) && (
          <p className="mt-3 flex flex-wrap gap-1.5">
            {post.topic && topicLabel(post.topic) && <Link to="/community" search={{ topic: post.topic }} className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-[var(--emma-violet)] hover:text-foreground">{topicLabel(post.topic)}</Link>}
            {post.tags.map((t) => <Link key={t} to="/community" search={{ tag: t }} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground">#{t}</Link>)}
          </p>
        )}
      </div>

      {post.reaction_count > 0 && (
        <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
          <span aria-hidden="true">{REACTIONS.filter((r) => (post.reactions[r.id] ?? 0) > 0).map((r) => r.emoji).join("")}</span>
          <span>{post.reaction_count} {post.reaction_count === 1 ? "reaction" : "reactions"}</span>
        </p>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {post.status === "published" && (
        <footer className="mt-3 flex items-center justify-between gap-1 border-t border-border pt-2">
          <ReactionButton current={post.my_reaction} onReact={react} />
          <Link {...postLink} hash="comments" className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />{post.comment_count > 0 ? post.comment_count : ""}<span className="hidden sm:inline">{post.kind === "question" ? (post.comment_count === 1 ? " answer" : " answers") : post.comment_count === 1 ? " comment" : " comments"}</span>
          </Link>
          <button type="button" onClick={share} className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"><Share2 className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Share</span><span className="sr-only sm:hidden">Share</span></button>
          <button type="button" onClick={toggleSave} aria-pressed={post.saved} className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium hover:bg-muted ${post.saved ? "text-[var(--emma-violet)]" : "text-muted-foreground hover:text-foreground"}`}>
            {post.saved ? <BookmarkCheck className="h-4 w-4" aria-hidden="true" /> : <Bookmark className="h-4 w-4" aria-hidden="true" />}<span className="hidden sm:inline">{post.saved ? "Saved" : "Save"}</span><span className="sr-only sm:hidden">{post.saved ? "Saved" : "Save"}</span>
          </button>
        </footer>
      )}
      {toast && <p role="status" className="mt-2 text-xs font-medium text-emerald-600">{toast}</p>}
    </article>
  );
}

function ReactionButton({ current, onReact }: { current: ReactionKind | null; onReact: (k: ReactionKind | null) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pressTimer = useRef<number | null>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent | TouchEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away); document.addEventListener("touchstart", away); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("touchstart", away); document.removeEventListener("keydown", esc); };
  }, [open]);
  const cur = REACTIONS.find((r) => r.id === current);
  return (
    <div ref={ref} className="relative flex items-center">
      <button type="button" aria-pressed={Boolean(current)}
        onClick={() => onReact(current ? null : "like")}
        onTouchStart={() => { pressTimer.current = window.setTimeout(() => setOpen(true), 450); }}
        onTouchEnd={() => { if (pressTimer.current) window.clearTimeout(pressTimer.current); }}
        className={`inline-flex min-h-10 items-center gap-1.5 rounded-l-full px-3 text-sm font-medium hover:bg-muted ${current ? "text-[var(--emma-violet)]" : "text-muted-foreground hover:text-foreground"}`}>
        <span aria-hidden="true">{cur ? cur.emoji : "👍"}</span>{cur ? cur.label : "Like"}
      </button>
      <button type="button" aria-label="Choose a reaction" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="inline-flex min-h-10 items-center rounded-r-full px-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><ChevronDown className="h-3.5 w-3.5" aria-hidden="true" /></button>
      {open && (
        <div role="menu" aria-label="Reactions" className="absolute bottom-full left-0 z-30 mb-1 flex gap-0.5 rounded-full border border-border bg-popover p-1 shadow-xl">
          {REACTIONS.map((r) => (
            <button key={r.id} type="button" role="menuitemradio" aria-checked={current === r.id} aria-label={r.label} title={r.label}
              onClick={() => { onReact(current === r.id ? null : r.id); setOpen(false); }}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-xl transition hover:scale-110 hover:bg-muted motion-reduce:transition-none ${current === r.id ? "bg-muted" : ""}`}>{r.emoji}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function PostMenu({ post, mine, uid, staff, onEdit, onDelete, onShare, onModerated, onError }: { post: FeedPost; mine: boolean; uid: string | null; staff: boolean; onEdit?: (p: FeedPost) => void; onDelete: () => void; onShare: () => void; onModerated: (p: FeedPost) => void; onError: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [following, setFollowing] = useState<boolean | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    if (uid && !mine && following === null) isFollowing(uid, post.author_id).then(setFollowing).catch(() => setFollowing(false));
    const away = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open, uid, mine, following, post.author_id]);
  async function toggleFollow() {
    if (!uid) return openAuth("Join to follow members.");
    const next = !following;
    setFollowing(next);
    try { await setFollow(uid, post.author_id, next); } catch { setFollowing(!next); }
  }
  async function mod(action: "pin" | "unpin" | "remove" | "restore") {
    setOpen(false);
    if (action === "remove" && !window.confirm("Remove this post from the community? It's hidden from everyone except staff and the author, and the action is logged.")) return;
    try {
      await moderate("post", post.id, action);
      onModerated({ ...post, is_pinned: action === "pin" ? true : action === "unpin" ? false : post.is_pinned, status: action === "remove" ? "removed" : action === "restore" ? "published" : post.status });
    } catch (e) { onError(friendly(e)); }
  }
  const item = "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted";
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label="Post options" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"><MoreHorizontal className="h-5 w-5" aria-hidden="true" /></button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-1 w-52 rounded-xl border border-border bg-popover p-1 shadow-xl">
          <button type="button" role="menuitem" className={item} onClick={() => { onShare(); setOpen(false); }}><Link2 className="h-4 w-4" aria-hidden="true" />Copy or share link</button>
          {mine && onEdit && post.status !== "removed" && <button type="button" role="menuitem" className={item} onClick={() => { onEdit(post); setOpen(false); }}><Pencil className="h-4 w-4" aria-hidden="true" />Edit post</button>}
          {mine && <button type="button" role="menuitem" className={`${item} text-red-600`} onClick={() => { setOpen(false); onDelete(); }}><Trash2 className="h-4 w-4" aria-hidden="true" />Delete post</button>}
          {!mine && <button type="button" role="menuitem" className={item} onClick={toggleFollow}>{following ? <UserMinus className="h-4 w-4" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}{following ? "Unfollow" : "Follow"} @{post.author_username}</button>}
          {!mine && <button type="button" role="menuitem" className={item} onClick={() => { if (!uid) { openAuth("Join to report content."); return; } setReporting(true); setOpen(false); }}><Flag className="h-4 w-4" aria-hidden="true" />Report post</button>}
          {staff && post.status === "published" && <button type="button" role="menuitem" className={item} onClick={() => mod(post.is_pinned ? "unpin" : "pin")}><Pin className="h-4 w-4" aria-hidden="true" />{post.is_pinned ? "Unpin (staff)" : "Pin (staff)"}</button>}
          {staff && !mine && post.status !== "draft" && <button type="button" role="menuitem" className={`${item} text-red-600`} onClick={() => mod(post.status === "removed" ? "restore" : "remove")}><Trash2 className="h-4 w-4" aria-hidden="true" />{post.status === "removed" ? "Restore (staff)" : "Remove (staff)"}</button>}
        </div>
      )}
      {reporting && uid && <ReportDialog uid={uid} targetType="post" targetId={post.id} onClose={() => setReporting(false)} />}
    </div>
  );
}

function MediaGrid({ media }: { media: MediaItem[] }) {
  const [zoom, setZoom] = useState<MediaItem | null>(null);
  const images = media.filter((m) => m.type === "image");
  const videos = media.filter((m) => m.type === "video");
  const cols = images.length === 1 ? "grid-cols-1" : "grid-cols-2";
  return (
    <div className="mt-3 space-y-2">
      {images.length > 0 && (
        <div className={`grid gap-1.5 overflow-hidden rounded-2xl ${cols}`}>
          {images.slice(0, 4).map((m, i) => (
            <button key={m.path} type="button" onClick={() => setZoom(m)} className={`relative block overflow-hidden bg-muted ${images.length === 3 && i === 0 ? "row-span-2" : ""}`} aria-label={m.alt ? `View image: ${m.alt}` : "View image"}>
              <img src={mediaUrl(m.path)} alt={m.alt ?? ""} loading="lazy" decoding="async" width={m.w} height={m.h} className={`h-full w-full object-cover ${images.length === 1 ? "max-h-[520px]" : "aspect-square"}`} />
              {i === 3 && images.length > 4 && <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xl font-semibold text-white">+{images.length - 4}</span>}
            </button>
          ))}
        </div>
      )}
      {videos.map((m) => <video key={m.path} src={mediaUrl(m.path)} controls preload="metadata" playsInline className="max-h-[520px] w-full rounded-2xl bg-black" aria-label={m.alt || "Video"} />)}
      <Dialog open={Boolean(zoom)} onOpenChange={(o) => { if (!o) setZoom(null); }}>
        {zoom && (
          <DialogContent className="w-[96vw] max-w-4xl p-2">
            <DialogTitle className="sr-only">Image</DialogTitle>
            <DialogDescription className="sr-only">{zoom.alt || "Full-size image"}</DialogDescription>
            <img src={mediaUrl(zoom.path)} alt={zoom.alt ?? ""} className="max-h-[85dvh] w-full rounded-lg object-contain" />
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function LinkCard({ url }: { url: string }) {
  const [p, setP] = useState<LinkPreview | null | undefined>(undefined);
  useEffect(() => { let live = true; getLinkPreview({ data: url }).then((v) => { if (live) setP(v); }).catch(() => { if (live) setP(null); }); return () => { live = false; }; }, [url]);
  let host = url;
  try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { /* keep raw */ }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer nofollow ugc" className="mt-3 flex overflow-hidden rounded-2xl border border-border bg-background transition hover:border-[var(--emma-violet)]">
      {p?.image && <img src={p.image} alt="" loading="lazy" referrerPolicy="no-referrer" className="hidden h-auto w-32 shrink-0 object-cover sm:block" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
      <span className="min-w-0 p-3">
        <span className="block text-xs uppercase tracking-wide text-muted-foreground">{p?.host ?? host}</span>
        <span className="mt-0.5 block truncate text-sm font-semibold text-foreground">{p === undefined ? "Loading preview…" : p?.title ?? url}</span>
        {p?.description && <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{p.description}</span>}
      </span>
    </a>
  );
}

function Poll({ options, counts, myVote, onVote }: { options: string[]; counts: number[]; myVote: number | null; onVote: (i: number) => void }) {
  const total = counts.reduce((a, b) => a + b, 0);
  const voted = myVote !== null && myVote !== undefined;
  return (
    <fieldset className="mt-3 space-y-2">
      <legend className="sr-only">Poll options</legend>
      {options.map((o, i) => {
        const pct = total ? Math.round((counts[i] / total) * 100) : 0;
        return (
          <button key={i} type="button" onClick={() => onVote(i)} aria-pressed={myVote === i}
            className={`relative flex min-h-11 w-full items-center justify-between overflow-hidden rounded-xl border px-3 text-left text-sm transition ${myVote === i ? "border-[var(--emma-violet)]" : "border-border hover:border-[var(--emma-violet)]"}`}>
            {voted && <span aria-hidden="true" className="absolute inset-y-0 left-0 bg-[color-mix(in_srgb,var(--emma-violet)_14%,transparent)] transition-[width] motion-reduce:transition-none" style={{ width: `${pct}%` }} />}
            <span className="relative font-medium">{o}{myVote === i && <span className="sr-only"> (your vote)</span>}</span>
            {voted && <span className="relative text-xs font-semibold text-muted-foreground">{pct}%</span>}
          </button>
        );
      })}
      <p className="text-xs text-muted-foreground">{total} {total === 1 ? "vote" : "votes"}{voted ? " · tap another option to change your vote" : " · vote to see results"}</p>
    </fieldset>
  );
}
