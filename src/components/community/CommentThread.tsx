import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BadgeCheck, CheckCircle2, Flag, Loader2, MoreHorizontal, Pencil, Reply, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import RichText, { Avatar, timeAgo } from "./RichText";
import { openAuth } from "./AuthDialog";
import ReportDialog from "./ReportDialog";
import { acceptAnswer, addComment, deleteComment, editComment, friendly, getComment, listComments, myCommentReactions, newKey, setCommentReaction } from "@/lib/community/api";
import { useCommunitySession } from "@/lib/community/session";
import { REACTIONS, type CommentRow, type FeedPost, type ReactionKind } from "@/lib/community/types";

const PAGE = 20;

/** Threaded comments (3 levels) with live updates. Permissions are enforced by the database. */
export default function CommentThread({ post, onPostChange }: { post: FeedPost; onPostChange: (p: FeedPost) => void }) {
  const { uid, profile } = useCommunitySession();
  const [comments, setComments] = useState<CommentRow[] | null>(null);
  const [mine, setMine] = useState<Record<string, ReactionKind>>({});
  const [error, setError] = useState("");
  const [shownRoots, setShownRoots] = useState(PAGE);
  const seen = useRef(new Set<string>());

  const load = useCallback(async () => {
    setError("");
    try {
      const rows = await listComments(post.id);
      rows.forEach((r) => seen.current.add(r.id));
      setComments(rows);
      if (uid) setMine(await myCommentReactions(rows.map((r) => r.id), uid));
    } catch (e) { setError(e instanceof Error ? e.message : friendly(e)); }
  }, [post.id, uid]);
  useEffect(() => { void load(); }, [load]);

  // Live: new comments by others appear without a reload (realtime applies the same access rules).
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channel = (supabase as any).channel(`comments-${post.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_comments", filter: `post_id=eq.${post.id}` }, async (msg: { new: { id: string } }) => {
        if (seen.current.has(msg.new.id)) return;
        const row = await getComment(msg.new.id).catch(() => null);
        if (row && !seen.current.has(row.id)) { seen.current.add(row.id); setComments((c) => (c ? [...c, row] : [row])); }
      })
      .subscribe();
    return () => { void (supabase as unknown as { removeChannel: (c: unknown) => Promise<unknown> }).removeChannel(channel); };
  }, [post.id]);

  const tree = useMemo(() => {
    const byParent = new Map<string | null, CommentRow[]>();
    for (const c of comments ?? []) { const k = c.parent_id; byParent.set(k, [...(byParent.get(k) ?? []), c]); }
    return byParent;
  }, [comments]);

  function upsert(c: CommentRow) {
    seen.current.add(c.id);
    setComments((list) => {
      const l = list ?? [];
      return l.some((x) => x.id === c.id) ? l.map((x) => (x.id === c.id ? c : x)) : [...l, c];
    });
  }

  async function onAdded(c: CommentRow) {
    upsert(c);
    onPostChange({ ...post, comment_count: post.comment_count + 1 });
  }

  async function accept(c: CommentRow | null) {
    try {
      await acceptAnswer(post.id, c?.id ?? null);
      onPostChange({ ...post, accepted_comment_id: c?.id ?? null });
      setComments((l) => l?.map((x) => ({ ...x, is_helpful: x.id === c?.id })) ?? l);
    } catch (e) { setError(e instanceof Error ? e.message : friendly(e)); }
  }

  const roots = tree.get(null) ?? [];
  const accepted = post.accepted_comment_id ? (comments ?? []).find((c) => c.id === post.accepted_comment_id) : null;
  const orderedRoots = accepted && !accepted.parent_id ? [accepted, ...roots.filter((r) => r.id !== accepted.id)] : roots;
  const label = post.kind === "question" ? "answer" : "comment";

  return (
    <section id="comments" aria-labelledby="comments-h" className="mt-5">
      <h2 id="comments-h" className="font-display text-lg font-semibold">{post.comment_count} {post.comment_count === 1 ? label : `${label}s`}</h2>
      {uid && profile ? (
        <CommentBox uid={uid} postId={post.id} parentId={null} placeholder={post.kind === "question" ? "Write an answer…" : "Add a comment…"} onAdded={onAdded} />
      ) : (
        <button type="button" onClick={() => openAuth(`Join to ${post.kind === "question" ? "answer" : "comment"}.`)} className="mt-3 w-full rounded-2xl border border-dashed border-border px-4 py-3 text-left text-sm text-muted-foreground hover:border-[var(--emma-violet)]">
          {uid ? "Set up your community profile to comment." : `Sign in to ${post.kind === "question" ? "answer" : "comment"}…`}
        </button>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error} <button type="button" className="font-semibold underline" onClick={() => void load()}>Retry</button></p>}
      {comments === null && !error && <div className="mt-4 space-y-3" aria-busy="true">{[0, 1].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />)}</div>}
      {comments && comments.length === 0 && <p className="mt-4 text-sm text-muted-foreground">No {label}s yet. Be the first.</p>}
      <ul className="mt-4 space-y-4">
        {orderedRoots.slice(0, shownRoots).map((c) => (
          <CommentItem key={c.id} c={c} tree={tree} post={post} uid={uid} hasProfile={Boolean(profile)} mine={mine} setMine={setMine} onUpsert={upsert} onAccept={accept}
            onRemoved={() => onPostChange({ ...post, comment_count: Math.max(0, post.comment_count - 1) })} onAdded={onAdded} />
        ))}
      </ul>
      {orderedRoots.length > shownRoots && <button type="button" onClick={() => setShownRoots((n) => n + PAGE)} className="mt-4 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">Show more {label}s ({orderedRoots.length - shownRoots})</button>}
    </section>
  );
}

function CommentBox({ uid, postId, parentId, placeholder, onAdded, onCancel, autoFocus }: { uid: string; postId: string; parentId: string | null; placeholder: string; onAdded: (c: CommentRow) => void; onCancel?: () => void; autoFocus?: boolean }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const key = useRef(newKey());
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true); setError("");
    try { const c = await addComment(postId, uid, body.trim(), parentId, key.current); key.current = newKey(); setBody(""); onAdded(c); onCancel?.(); }
    catch (err) { setError(err instanceof Error ? err.message : friendly(err)); }
    finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="mt-3">
      <label className="sr-only" htmlFor={`cb-${key.current}`}>{placeholder}</label>
      <textarea id={`cb-${key.current}`} className="input min-h-[72px] resize-y" placeholder={placeholder} maxLength={4000} value={body} autoFocus={autoFocus} onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit(e as unknown as React.FormEvent); }} />
      {error && <p role="alert" className="mt-1 text-sm text-red-600">{error}</p>}
      <div className="mt-2 flex items-center justify-end gap-2">
        {onCancel && <button type="button" onClick={onCancel} className="min-h-9 rounded-full px-3 text-sm text-muted-foreground hover:text-foreground">Cancel</button>}
        <button type="submit" disabled={!body.trim() || busy} className="btn-primary-gradient inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-white disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{parentId ? "Reply" : "Post"}</button>
      </div>
    </form>
  );
}

function CommentItem({ c, tree, post, uid, hasProfile, mine, setMine, onUpsert, onAccept, onRemoved, onAdded }: {
  c: CommentRow; tree: Map<string | null, CommentRow[]>; post: FeedPost; uid: string | null; hasProfile: boolean;
  mine: Record<string, ReactionKind>; setMine: (f: (m: Record<string, ReactionKind>) => Record<string, ReactionKind>) => void;
  onUpsert: (c: CommentRow) => void; onAccept: (c: CommentRow | null) => void; onRemoved: () => void; onAdded: (c: CommentRow) => void;
}) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(c.body);
  const [menu, setMenu] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [error, setError] = useState("");
  const replies = tree.get(c.id) ?? [];
  const own = uid === c.author_id;
  const visible = c.status === "visible";
  const myReaction = mine[c.id] ?? null;
  const canAccept = post.kind === "question" && uid === post.author_id && !own && visible;

  async function react(next: ReactionKind | null) {
    if (!uid) return openAuth("Join to react.");
    const prevKind = myReaction;
    const reactions = { ...c.reactions };
    if (prevKind) reactions[prevKind] = Math.max(0, (reactions[prevKind] ?? 1) - 1);
    if (next) reactions[next] = (reactions[next] ?? 0) + 1;
    const count = c.reaction_count + (next && !prevKind ? 1 : !next && prevKind ? -1 : 0);
    onUpsert({ ...c, reactions, reaction_count: Math.max(0, count) });
    setMine((m) => { const n = { ...m }; if (next) n[c.id] = next; else delete n[c.id]; return n; });
    try { await setCommentReaction(c.id, uid, next, prevKind); }
    catch (e) { onUpsert(c); setMine((m) => { const n = { ...m }; if (prevKind) n[c.id] = prevKind; else delete n[c.id]; return n; }); setError(e instanceof Error ? e.message : friendly(e)); }
  }
  async function saveEdit() {
    if (!draft.trim()) return;
    try { await editComment(c.id, draft.trim()); onUpsert({ ...c, body: draft.trim(), edited_at: new Date().toISOString() }); setEditing(false); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : friendly(e)); }
  }
  async function remove() {
    if (!window.confirm("Delete this comment?")) return;
    try { await deleteComment(c.id); onUpsert({ ...c, status: "deleted", body: "" }); onRemoved(); }
    catch (e) { setError(e instanceof Error ? e.message : friendly(e)); }
  }

  const name = c.author?.display_name ?? "Member";
  const like = REACTIONS.find((r) => r.id === (myReaction ?? "like"))!;
  return (
    <li className={c.depth > 0 ? "border-l-2 border-border pl-3 sm:pl-4" : ""}>
      <div className={`rounded-2xl p-3 ${c.is_helpful ? "border border-emerald-500/40 bg-emerald-500/5" : "bg-muted/50"}`}>
        {c.is_helpful && <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />Accepted answer</p>}
        <div className="flex items-start gap-2.5">
          {c.author ? <Link to="/community/u/$username" params={{ username: c.author.username }} tabIndex={-1} aria-hidden="true"><Avatar name={name} src={c.author.avatar_url} size={32} /></Link> : <Avatar name={name} size={32} />}
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-1.5 text-sm">
              {c.author ? <Link to="/community/u/$username" params={{ username: c.author.username }} className="font-semibold hover:underline">{name}</Link> : <span className="font-semibold">{name}</span>}
              {c.author?.is_specialist && <BadgeCheck className="h-3.5 w-3.5 text-[var(--emma-violet)]" aria-label="Specialist" />}
              {post.author_id === c.author_id && <span className="rounded-full bg-muted px-1.5 text-[10px] font-semibold">Author</span>}
              <span className="text-xs text-muted-foreground"><time dateTime={c.created_at}>{timeAgo(c.created_at)}</time>{c.edited_at && visible ? " · edited" : ""}</span>
            </p>
            {!visible ? <p className="mt-1 text-sm italic text-muted-foreground">{c.status === "removed" ? "Removed by a moderator." : "This comment was deleted."}</p>
              : editing ? (
                <div className="mt-1">
                  <label className="sr-only" htmlFor={`edit-${c.id}`}>Edit comment</label>
                  <textarea id={`edit-${c.id}`} className="input min-h-[72px]" maxLength={4000} value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
                  <div className="mt-2 flex justify-end gap-2"><button type="button" onClick={() => { setEditing(false); setDraft(c.body); }} className="min-h-9 rounded-full px-3 text-sm">Cancel</button><button type="button" onClick={() => void saveEdit()} className="btn-primary-gradient min-h-9 rounded-full px-4 text-sm font-semibold text-white">Save</button></div>
                </div>
              ) : <RichText text={c.body} className="mt-1 text-sm text-foreground/90" />}
          </div>
          {visible && (
            <div className="relative">
              <button type="button" aria-label="Comment options" aria-expanded={menu} onClick={() => setMenu((m) => !m)} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"><MoreHorizontal className="h-4 w-4" aria-hidden="true" /></button>
              {menu && (
                <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-border bg-popover p-1 shadow-xl" onMouseLeave={() => setMenu(false)}>
                  {own && <button type="button" role="menuitem" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted" onClick={() => { setEditing(true); setMenu(false); }}><Pencil className="h-4 w-4" aria-hidden="true" />Edit</button>}
                  {own && <button type="button" role="menuitem" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-muted" onClick={() => { setMenu(false); void remove(); }}><Trash2 className="h-4 w-4" aria-hidden="true" />Delete</button>}
                  {!own && <button type="button" role="menuitem" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted" onClick={() => { setMenu(false); if (!uid) { openAuth("Join to report content."); return; } setReporting(true); }}><Flag className="h-4 w-4" aria-hidden="true" />Report</button>}
                </div>
              )}
            </div>
          )}
        </div>
        {error && <p role="alert" className="mt-1 text-sm text-red-600">{error}</p>}
        {visible && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1 pl-10 text-xs">
            <button type="button" aria-pressed={Boolean(myReaction)} onClick={() => void react(myReaction ? null : "like")} className={`inline-flex min-h-8 items-center gap-1 rounded-full px-2 font-semibold hover:bg-muted ${myReaction ? "text-[var(--emma-violet)]" : "text-muted-foreground"}`}>
              <span aria-hidden="true">{like.emoji}</span>{myReaction ? like.label : "Like"}{c.reaction_count > 0 && <span className="font-normal">· {c.reaction_count}</span>}
            </button>
            <button type="button" onClick={() => { if (!uid || !hasProfile) { openAuth("Join to reply."); return; } setReplying((r) => !r); }} className="inline-flex min-h-8 items-center gap-1 rounded-full px-2 font-semibold text-muted-foreground hover:bg-muted"><Reply className="h-3.5 w-3.5" aria-hidden="true" />Reply</button>
            {canAccept && <button type="button" onClick={() => onAccept(c.is_helpful ? null : c)} className="inline-flex min-h-8 items-center gap-1 rounded-full px-2 font-semibold text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />{c.is_helpful ? "Unaccept" : "Accept answer"}</button>}
          </div>
        )}
      </div>
      {replying && uid && <div className="pl-3 sm:pl-6"><CommentBox uid={uid} postId={post.id} parentId={c.id} placeholder={`Reply to ${name}…`} onAdded={onAdded} onCancel={() => setReplying(false)} autoFocus /></div>}
      {replies.length > 0 && (
        <ul className="mt-3 space-y-3 pl-2 sm:pl-4">
          {replies.map((r) => <CommentItem key={r.id} c={r} tree={tree} post={post} uid={uid} hasProfile={hasProfile} mine={mine} setMine={setMine} onUpsert={onUpsert} onAccept={onAccept} onRemoved={onRemoved} onAdded={onAdded} />)}
        </ul>
      )}
      {reporting && uid && <ReportDialog uid={uid} targetType="comment" targetId={c.id} onClose={() => setReporting(false)} />}
    </li>
  );
}
