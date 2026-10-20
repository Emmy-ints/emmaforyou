import { supabase } from "@/integrations/supabase/client";
import { PROFILE_FIELDS, type CommentRow, type FeedPost, type FeedSort, type MediaItem, type NotificationRow, type PostKind, type Profile, type ReactionKind } from "./types";

/**
 * Community data access. Every call goes through Supabase with the visitor's own session, so the
 * database's row-level security, column grants and triggers decide what is allowed (see
 * supabase/migrations/20261020121000_community_core.sql). Nothing here is trusted for authorisation.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as any;
export const MEDIA_BUCKET = "community-media";

export class CommunityError extends Error {}

/** Turn database/network errors into short, honest messages for members. */
export function friendly(error: unknown, fallback = "Something went wrong. Please try again."): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = error as any;
  const code = String(e?.code ?? "");
  const msg = String(e?.message ?? "");
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return "Connection problem. Check your internet and try again.";
  if (code === "23505") return /already posted/i.test(msg) ? "You already posted this." : "That already exists.";
  if (code === "42501") return /suspended|announcement|moderator|Not authorised|staff|specialist/i.test(msg) ? msg : "You don't have permission to do that.";
  if (code === "P0001" || code === "22023" || code === "P0002") return msg || fallback;
  if (code === "23514") return "Some details aren't valid. Check the lengths and formats and try again.";
  if (code === "PGRST116") return "Not found.";
  return fallback;
}

function check<T>(res: { data: T; error: unknown }): T {
  if (res.error) throw new CommunityError(friendly(res.error));
  return res.data;
}

export const newKey = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`.replace(/\D/g, "").padEnd(32, "0").replace(/^(.{8})(.{4})(.{4})(.{4})(.{12}).*/, "$1-$2-$3-$4-$5"));

// ---------------------------------------------------------------- Feed and posts
export interface FeedCursor { ts: string; id: string; score: number }
export interface FeedPage { posts: FeedPost[]; next: { cursor?: FeedCursor; offset?: number } | null }

export async function fetchFeed(opts: { sort: FeedSort; cursor?: FeedCursor; offset?: number; tag?: string; kind?: string; topic?: string; author?: string; limit?: number }): Promise<FeedPage> {
  const limit = opts.limit ?? 12;
  const rows = check(await db.rpc("community_feed", {
    _sort: opts.sort, _limit: limit,
    _cursor_ts: opts.cursor?.ts ?? null, _cursor_id: opts.cursor?.id ?? null, _cursor_score: opts.cursor?.score ?? null,
    _offset: opts.offset ?? 0, _author: opts.author ?? null, _tag: opts.tag ?? null, _kind: opts.kind ?? null,
    ...(opts.topic ? { _topic: opts.topic } : {}),
  })) as FeedPost[];
  const posts = (rows ?? []).map((p) => ({ ...p, media: Array.isArray(p.media) ? p.media : [], reactions: p.reactions ?? {} }));
  if (posts.length < limit) return { posts, next: null };
  const last = posts[posts.length - 1];
  if (opts.sort === "for_you") return { posts, next: { offset: (opts.offset ?? 0) + posts.length } };
  return { posts, next: { cursor: { ts: last.published_at as string, id: last.id, score: last.engagement } } };
}

const POST_SELECT = "*, author:community_profiles!community_posts_author_id_fkey(username,display_name,headline,avatar_url,is_specialist)";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toFeedPost(row: any, mine: { reaction?: ReactionKind | null; vote?: number | null; saved?: boolean } = {}): FeedPost {
  return {
    ...row,
    media: Array.isArray(row.media) ? row.media : [],
    reactions: row.reactions ?? {},
    author_username: row.author?.username ?? "member",
    author_name: row.author?.display_name ?? "Member",
    author_headline: row.author?.headline ?? null,
    author_avatar: row.author?.avatar_url ?? null,
    author_specialist: Boolean(row.author?.is_specialist),
    my_reaction: mine.reaction ?? null,
    my_vote: mine.vote ?? null,
    saved: Boolean(mine.saved),
    rank_score: 0,
  };
}

/** One post (any status the viewer may see: their own drafts, or published posts). */
export async function getPost(id: string, uid: string | null): Promise<FeedPost | null> {
  const row = check(await db.from("community_posts").select(POST_SELECT).eq("id", id).maybeSingle());
  if (!row) return null;
  if (!uid) return toFeedPost(row);
  const [r, v, s] = await Promise.all([
    db.from("community_reactions").select("kind").eq("post_id", id).eq("user_id", uid).maybeSingle(),
    db.from("community_poll_votes").select("option_index").eq("post_id", id).eq("user_id", uid).maybeSingle(),
    db.from("community_saves").select("post_id").eq("post_id", id).eq("user_id", uid).maybeSingle(),
  ]);
  return toFeedPost(row, { reaction: r.data?.kind ?? null, vote: v.data?.option_index ?? null, saved: Boolean(s.data) });
}

/** Posts pinned by the community team (shown above the main feed). */
export async function pinnedPosts(uid: string | null): Promise<FeedPost[]> {
  const rows = check(await db.from("community_posts").select("id").eq("is_pinned", true).eq("status", "published").order("published_at", { ascending: false }).limit(3)) ?? [];
  const posts = await Promise.all((rows as { id: string }[]).map((r) => getPost(r.id, uid).catch(() => null)));
  return posts.filter(Boolean) as FeedPost[];
}

export async function listDrafts(uid: string): Promise<FeedPost[]> {
  const rows = check(await db.from("community_posts").select(POST_SELECT).eq("author_id", uid).eq("status", "draft").order("updated_at", { ascending: false }).limit(20));
  return (rows ?? []).map((r: unknown) => toFeedPost(r));
}

export interface PostInput {
  kind: PostKind; title: string | null; body: string; link_url: string | null; media: MediaItem[]; tags: string[];
  topic: string | null; poll_options: string[] | null; visibility: "public" | "members"; status: "draft" | "published";
}

export async function createPost(uid: string, input: PostInput, clientKey: string): Promise<string> {
  const res = await db.from("community_posts").insert({ ...input, author_id: uid, client_key: clientKey }).select("id").single();
  if (res.error?.code === "23505" && !/already posted/i.test(String(res.error.message))) {
    // Same client key: the first submission went through (e.g. a double click or a retry after a timeout).
    const again = await db.from("community_posts").select("id").eq("author_id", uid).eq("client_key", clientKey).maybeSingle();
    if (again.data?.id) return again.data.id as string;
  }
  return check(res).id as string;
}

export async function updatePost(id: string, patch: Partial<PostInput>): Promise<void> {
  const { poll_options: _ignored, kind: _k, ...editable } = patch;
  check(await db.from("community_posts").update(editable).eq("id", id).select("id").single());
}

export async function deletePost(id: string): Promise<void> {
  check(await db.from("community_posts").delete().eq("id", id));
}

export async function setReaction(postId: string, uid: string, next: ReactionKind | null, current: ReactionKind | null): Promise<void> {
  if (next === current) return;
  if (!next) { check(await db.from("community_reactions").delete().eq("post_id", postId).eq("user_id", uid)); return; }
  if (current) { check(await db.from("community_reactions").update({ kind: next }).eq("post_id", postId).eq("user_id", uid)); return; }
  const res = await db.from("community_reactions").insert({ post_id: postId, user_id: uid, kind: next });
  if (res.error?.code === "23505") { check(await db.from("community_reactions").update({ kind: next }).eq("post_id", postId).eq("user_id", uid)); return; }
  check(res);
}

export async function setSaved(postId: string, uid: string, saved: boolean): Promise<void> {
  if (saved) {
    const res = await db.from("community_saves").insert({ post_id: postId, user_id: uid });
    if (res.error && res.error.code !== "23505") check(res);
  } else check(await db.from("community_saves").delete().eq("post_id", postId).eq("user_id", uid));
}

export async function vote(postId: string, uid: string, option: number, current: number | null): Promise<void> {
  if (current === option) return;
  if (current !== null) check(await db.from("community_poll_votes").delete().eq("post_id", postId).eq("user_id", uid));
  check(await db.from("community_poll_votes").insert({ post_id: postId, user_id: uid, option_index: option }));
}

export async function acceptAnswer(postId: string, commentId: string | null): Promise<void> {
  check(await db.from("community_posts").update({ accepted_comment_id: commentId }).eq("id", postId).select("id").single());
}

export async function savedPosts(uid: string): Promise<FeedPost[]> {
  const rows = check(await db.from("community_saves").select(`created_at, post:community_posts(${POST_SELECT})`).eq("user_id", uid).order("created_at", { ascending: false }).limit(60));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rows ?? []).filter((r: any) => r.post).map((r: any) => toFeedPost(r.post, { saved: true }));
}

// ---------------------------------------------------------------- Comments
const COMMENT_SELECT = "id,post_id,author_id,parent_id,depth,body,status,reactions,reaction_count,reply_count,is_helpful,edited_at,created_at, author:community_profiles!community_comments_author_id_fkey(username,display_name,avatar_url,headline,is_specialist)";

export async function listComments(postId: string, before?: string): Promise<CommentRow[]> {
  let q = db.from("community_comments").select(COMMENT_SELECT).eq("post_id", postId).order("created_at", { ascending: true }).limit(200);
  if (before) q = q.gt("created_at", before);
  return (check(await q) ?? []) as CommentRow[];
}

export async function getComment(id: string): Promise<CommentRow | null> {
  return check(await db.from("community_comments").select(COMMENT_SELECT).eq("id", id).maybeSingle()) as CommentRow | null;
}

export async function addComment(postId: string, uid: string, body: string, parentId: string | null, clientKey: string): Promise<CommentRow> {
  const res = await db.from("community_comments").insert({ post_id: postId, author_id: uid, body, parent_id: parentId, client_key: clientKey }).select(COMMENT_SELECT).single();
  if (res.error?.code === "23505") {
    const again = await db.from("community_comments").select(COMMENT_SELECT).eq("author_id", uid).eq("client_key", clientKey).maybeSingle();
    if (again.data) return again.data as CommentRow;
  }
  return check(res) as CommentRow;
}

export async function editComment(id: string, body: string): Promise<void> {
  check(await db.from("community_comments").update({ body }).eq("id", id).select("id").single());
}

export async function deleteComment(id: string): Promise<void> {
  check(await db.from("community_comments").update({ status: "deleted" }).eq("id", id).select("id").single());
}

export async function myCommentReactions(commentIds: string[], uid: string): Promise<Record<string, ReactionKind>> {
  if (!commentIds.length) return {};
  const rows = check(await db.from("community_comment_reactions").select("comment_id,kind").eq("user_id", uid).in("comment_id", commentIds.slice(0, 200)));
  return Object.fromEntries((rows ?? []).map((r: { comment_id: string; kind: ReactionKind }) => [r.comment_id, r.kind]));
}

export async function setCommentReaction(commentId: string, uid: string, next: ReactionKind | null, current: ReactionKind | null): Promise<void> {
  if (next === current) return;
  if (!next) { check(await db.from("community_comment_reactions").delete().eq("comment_id", commentId).eq("user_id", uid)); return; }
  if (current) { check(await db.from("community_comment_reactions").update({ kind: next }).eq("comment_id", commentId).eq("user_id", uid)); return; }
  check(await db.from("community_comment_reactions").insert({ comment_id: commentId, user_id: uid, kind: next }));
}

// ---------------------------------------------------------------- Profiles, follows, blocks, reports
export async function profileByUsername(username: string): Promise<Profile | null> {
  return check(await db.from("community_profiles").select(PROFILE_FIELDS).eq("username", username.toLowerCase()).maybeSingle()) as Profile | null;
}

export async function profileById(uid: string): Promise<Profile | null> {
  return check(await db.from("community_profiles").select(PROFILE_FIELDS).eq("user_id", uid).maybeSingle()) as Profile | null;
}

export async function usernameTaken(username: string, uid: string): Promise<boolean> {
  const res = await db.from("community_profiles").select("user_id").eq("username", username.toLowerCase()).neq("user_id", uid).maybeSingle();
  return Boolean(res.data);
}

export type ProfileInput = Pick<Profile, "username" | "display_name" | "headline" | "bio" | "location" | "avatar_url" | "cover_url" | "website" | "skills" | "interests" | "links" | "visibility">;

export async function saveProfile(uid: string, input: ProfileInput, exists: boolean): Promise<void> {
  if (exists) check(await db.from("community_profiles").update(input).eq("user_id", uid).select("user_id").single());
  else check(await db.from("community_profiles").insert({ ...input, user_id: uid }).select("user_id").single());
}

export async function deleteMyProfile(uid: string): Promise<void> {
  // Members may only delete their own row; the server-side cascade removes their posts, comments and reactions.
  const res = await db.rpc("community_delete_my_profile");
  if (res.error) throw new CommunityError(friendly(res.error));
  void uid;
}

export async function isFollowing(follower: string, followee: string): Promise<boolean> {
  const res = await db.from("community_follows").select("follower_id").eq("follower_id", follower).eq("followee_id", followee).maybeSingle();
  return Boolean(res.data);
}

export async function setFollow(follower: string, followee: string, follow: boolean): Promise<void> {
  if (follow) {
    const res = await db.from("community_follows").insert({ follower_id: follower, followee_id: followee });
    if (res.error && res.error.code !== "23505") check(res);
  } else check(await db.from("community_follows").delete().eq("follower_id", follower).eq("followee_id", followee));
}

export async function listFollows(uid: string, direction: "followers" | "following"): Promise<Pick<Profile, "user_id" | "username" | "display_name" | "avatar_url" | "headline">[]> {
  const fk = direction === "followers" ? "community_follows_follower_id_fkey" : "community_follows_followee_id_fkey";
  const col = direction === "followers" ? "followee_id" : "follower_id";
  const rows = check(await db.from("community_follows").select(`created_at, person:community_profiles!${fk}(user_id,username,display_name,avatar_url,headline)`).eq(col, uid).order("created_at", { ascending: false }).limit(100));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rows ?? []).map((r: any) => r.person).filter(Boolean);
}

export async function myFollowingIds(uid: string): Promise<Set<string>> {
  const rows = check(await db.from("community_follows").select("followee_id").eq("follower_id", uid).limit(1000));
  return new Set((rows ?? []).map((r: { followee_id: string }) => r.followee_id));
}

export async function setBlock(blocker: string, blocked: string, block: boolean): Promise<void> {
  if (block) {
    const res = await db.from("community_blocks").insert({ blocker_id: blocker, blocked_id: blocked });
    if (res.error && res.error.code !== "23505") check(res);
  } else check(await db.from("community_blocks").delete().eq("blocker_id", blocker).eq("blocked_id", blocked));
}

export async function myBlocks(uid: string): Promise<Pick<Profile, "user_id" | "username" | "display_name" | "avatar_url">[]> {
  const rows = check(await db.from("community_blocks").select("blocked:community_profiles!community_blocks_blocked_id_fkey(user_id,username,display_name,avatar_url)").eq("blocker_id", uid));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rows ?? []).map((r: any) => r.blocked).filter(Boolean);
}

export async function report(uid: string, targetType: "post" | "comment" | "profile", targetId: string, reason: string, details: string): Promise<"sent" | "already"> {
  const res = await db.from("community_reports").insert({ reporter_id: uid, target_type: targetType, target_id: targetId, reason, details: details.trim() || null });
  if (res.error?.code === "23505") return "already";
  check(res);
  return "sent";
}

export async function suggestedPeople(uid: string | null, limit = 5): Promise<Pick<Profile, "user_id" | "username" | "display_name" | "avatar_url" | "headline" | "follower_count">[]> {
  const rows = check(await db.from("community_profiles").select("user_id,username,display_name,avatar_url,headline,follower_count").order("follower_count", { ascending: false }).order("created_at", { ascending: false }).limit(40)) ?? [];
  const following = uid ? await myFollowingIds(uid) : new Set<string>();
  return rows.filter((p: { user_id: string }) => p.user_id !== uid && !following.has(p.user_id)).slice(0, limit);
}

/** Most used tags in posts from the last 7 days (counted from real posts the viewer can see). */
export async function trendingTags(limit = 8): Promise<{ tag: string; count: number }[]> {
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const rows = check(await db.from("community_posts").select("tags").eq("status", "published").gte("published_at", since).limit(300)) ?? [];
  const counts = new Map<string, number>();
  for (const r of rows as { tags: string[] }[]) for (const t of r.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([tag, count]) => ({ tag, count }));
}

// ---------------------------------------------------------------- Notifications
export async function listNotifications(before?: string): Promise<NotificationRow[]> {
  let q = db.from("community_notifications").select("id,type,post_id,comment_id,read_at,created_at, actor:community_profiles!community_notifications_actor_id_fkey(username,display_name,avatar_url)").order("created_at", { ascending: false }).limit(30);
  if (before) q = q.lt("created_at", before);
  return (check(await q) ?? []) as NotificationRow[];
}

export async function unreadCount(): Promise<number> {
  const res = await db.from("community_notifications").select("id", { count: "exact", head: true }).is("read_at", null);
  return res.error ? 0 : (res.count ?? 0);
}

export async function markRead(id: string): Promise<void> {
  check(await db.from("community_notifications").update({ read_at: new Date().toISOString() }).eq("id", id));
}

export async function markAllRead(): Promise<void> {
  check(await db.rpc("community_mark_all_read"));
}

// ---------------------------------------------------------------- Search
export interface SearchHit { result_type: "post" | "person"; id: string; title: string | null; snippet: string | null; username: string; display_name: string; avatar_url: string | null; kind: string | null; published_at: string }
export async function searchCommunity(q: string, type: "all" | "posts" | "questions" | "people"): Promise<SearchHit[]> {
  if (q.trim().length < 2) return [];
  return (check(await db.rpc("community_search", { _q: q.trim(), _type: type, _limit: 20 })) ?? []) as SearchHit[];
}

// ---------------------------------------------------------------- Media
export function mediaUrl(path: string): string {
  return db.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl as string;
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];
export const MAX_IMAGE_MB = 10;
export const MAX_VIDEO_MB = 25;

/** Resize/compress photos in the browser (max 1600px, WebP) before upload. GIFs keep their animation. */
async function compressImage(file: File): Promise<{ blob: Blob; ext: string; w?: number; h?: number }> {
  if (file.type === "image/gif" || typeof createImageBitmap === "undefined") return { blob: file, ext: file.type.split("/")[1] };
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d")?.drawImage(bmp, 0, 0, w, h);
  const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/webp", 0.82));
  return blob ? { blob, ext: "webp", w, h } : { blob: file, ext: file.type.split("/")[1], w: bmp.width, h: bmp.height };
}

export async function uploadMedia(uid: string, file: File): Promise<MediaItem> {
  const isImage = IMAGE_TYPES.includes(file.type), isVideo = VIDEO_TYPES.includes(file.type);
  if (!isImage && !isVideo) throw new CommunityError("Use a JPG, PNG, WebP or GIF image, or an MP4 or WebM video.");
  if (isImage && file.size > MAX_IMAGE_MB * 1024 * 1024) throw new CommunityError(`Images can be up to ${MAX_IMAGE_MB} MB.`);
  if (isVideo && file.size > MAX_VIDEO_MB * 1024 * 1024) throw new CommunityError(`Videos can be up to ${MAX_VIDEO_MB} MB.`);
  const prepared = isImage ? await compressImage(file) : { blob: file, ext: file.type === "video/webm" ? "webm" : "mp4" as string, w: undefined, h: undefined };
  const path = `${uid}/${newKey()}.${prepared.ext}`;
  const res = await db.storage.from(MEDIA_BUCKET).upload(path, prepared.blob, { contentType: isImage && prepared.ext === "webp" ? "image/webp" : file.type, upsert: false, cacheControl: "31536000" });
  if (res.error) throw new CommunityError(/size|large/i.test(String(res.error.message)) ? "That file is too large." : "Upload failed. Please try again.");
  return { type: isImage ? "image" : "video", path, w: prepared.w, h: prepared.h };
}

export async function removeUploaded(path: string): Promise<void> {
  await db.storage.from(MEDIA_BUCKET).remove([path]);
}
