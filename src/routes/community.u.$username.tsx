import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, Globe, Calendar, Loader2, MoreHorizontal, Flag, Ban, Pencil, BadgeCheck, Share2 } from "lucide-react";
import { pageHead, breadcrumbLd, absoluteUrl } from "@/lib/seo";
import { getProfileMeta } from "@/lib/community/meta-server";
import { fetchFeed, friendly, isFollowing, listFollows, myBlocks, profileByUsername, setBlock, setFollow, type FeedPage } from "@/lib/community/api";
import { refreshProfile, useCommunitySession } from "@/lib/community/session";
import { moderate } from "@/lib/community/moderation";
import type { FeedPost, Profile } from "@/lib/community/types";
import PostCard from "@/components/community/PostCard";
import ReportDialog from "@/components/community/ReportDialog";
import { openAuth } from "@/components/community/AuthDialog";
import { Avatar } from "@/components/community/RichText";

export const Route = createFileRoute("/community/u/$username")({
  loader: ({ params }) => getProfileMeta({ data: params.username }),
  head: ({ loaderData: m, params }) => {
    const path = `/community/u/${params.username.toLowerCase()}`;
    if (!m) return pageHead({ title: "Member profile — EmmaForYou Community", description: "A member of the EmmaForYou Community.", path, noindex: true });
    return pageHead({
      title: `${m.name} (@${m.username}) — EmmaForYou Community`, description: m.bio || m.headline || `${m.name} is a member of the EmmaForYou Community.`, path, type: "profile",
      jsonLd: [
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Community", path: "/community" }, { name: m.name, path }]),
        { "@context": "https://schema.org", "@type": "ProfilePage", mainEntity: { "@type": "Person", name: m.name, alternateName: `@${m.username}`, description: m.headline || undefined, url: absoluteUrl(path) } },
      ],
    });
  },
  component: ProfilePage,
});

type Tab = "posts" | "followers" | "following";
type Person = Awaited<ReturnType<typeof listFollows>>[number];

function ProfilePage() {
  const { username } = Route.useParams();
  const { ready, uid, profile: me, staff } = useCommunitySession();
  const [p, setP] = useState<Profile | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("posts");
  const [following, setFollowing] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [menu, setMenu] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const isMe = Boolean(p && uid === p.user_id);

  useEffect(() => {
    if (!ready) return;
    let live = true;
    setP(undefined); setTab("posts"); setError("");
    profileByUsername(username).then(async (row) => {
      if (!live) return;
      setP(row);
      if (row && uid && uid !== row.user_id) {
        const [f, b] = await Promise.all([isFollowing(uid, row.user_id).catch(() => false), myBlocks(uid).catch(() => [])]);
        if (live) { setFollowing(f); setBlocked(b.some((x) => x.user_id === row.user_id)); }
      }
    }).catch((e) => { if (live) { setError(friendly(e)); setP(null); } });
    return () => { live = false; };
  }, [username, uid, ready]);

  const flash = (m: string) => { setToast(m); window.setTimeout(() => setToast(""), 2200); };
  const needProfile = () => { if (!uid) { openAuth("Join to follow people."); return true; } if (!me) { flash("Set up your profile first in Settings."); return true; } return false; };

  async function toggleFollow() {
    if (!p || needProfile()) return;
    const on = !following;
    setFollowing(on);
    setP({ ...p, follower_count: Math.max(0, p.follower_count + (on ? 1 : -1)) });
    try { await setFollow(uid!, p.user_id, on); void refreshProfile(); }
    catch (e) { setFollowing(!on); setP(p); flash(friendly(e)); }
  }
  async function toggleBlock() {
    if (!p || needProfile()) return;
    setMenu(false);
    const on = !blocked;
    if (on && !window.confirm(`Block ${p.display_name}? You won't see each other's posts or comments, and any follows between you are removed.`)) return;
    try { await setBlock(uid!, p.user_id, on); setBlocked(on); if (on) setFollowing(false); flash(on ? "Blocked." : "Unblocked."); }
    catch (e) { flash(friendly(e)); }
  }
  async function staffAction(action: "suspend" | "unsuspend" | "specialist" | "unspecialist") {
    if (!p) return;
    setMenu(false);
    if (action === "suspend" && !window.confirm(`Suspend ${p.display_name}? Their profile, posts and comments are hidden until unsuspended. The action is logged.`)) return;
    try {
      await moderate("profile", p.user_id, action);
      setP({ ...p, suspended_at: action === "suspend" ? new Date().toISOString() : action === "unsuspend" ? null : p.suspended_at, is_specialist: action === "specialist" ? true : action === "unspecialist" ? false : p.is_specialist });
      flash("Done.");
    } catch (e) { flash(friendly(e)); }
  }
  async function share() {
    const url = absoluteUrl(`/community/u/${username.toLowerCase()}`);
    setMenu(false);
    try { if (navigator.share) await navigator.share({ title: p?.display_name, url }); else { await navigator.clipboard.writeText(url); flash("Link copied."); } } catch { /* cancelled */ }
  }

  if (p === undefined) return <div className="flex justify-center py-16" role="status"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" /><span className="sr-only">Loading profile</span></div>;
  if (p === null) return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center">
      <h1 className="font-display text-xl font-bold">Member not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error || (uid ? "This profile doesn't exist or isn't available." : "This profile may be visible to members only.")}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {!uid && <button type="button" onClick={() => openAuth("Sign in to see members-only profiles.", "signin")} className="btn-primary-gradient rounded-full px-5 py-2.5 text-sm font-semibold text-white">Sign in</button>}
        <Link to="/community" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">Back to the community</Link>
      </div>
    </div>
  );

  const joined = new Date(p.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const website = p.website && /^https?:\/\//i.test(p.website) ? p.website : null;

  return (
    <div className="mx-auto max-w-2xl">
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative h-28 bg-gradient-to-br from-[var(--emma-violet)]/70 to-[#9b8cff]/50 sm:h-40">
          {p.cover_url && <img src={p.cover_url} alt="" className="h-full w-full object-cover" loading="lazy" />}
        </div>
        <div className="px-4 pb-4 sm:px-6">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-3 sm:-mt-12">
            <div className="rounded-full border-4 border-card bg-card"><Avatar name={p.display_name} src={p.avatar_url} size={88} /></div>
            <div className="flex items-center gap-2 pb-1">
              {isMe ? (
                <Link to="/community/settings" className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted"><Pencil className="h-4 w-4" aria-hidden="true" />Edit profile</Link>
              ) : !blocked && (
                <button type="button" onClick={toggleFollow} aria-pressed={following} className={`min-h-10 rounded-full px-5 text-sm font-semibold ${following ? "border border-border hover:bg-muted" : "btn-primary-gradient text-white"}`}>{following ? "Following" : "Follow"}</button>
              )}
              <div className="relative">
                <button type="button" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-haspopup="menu" aria-label="More options" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border hover:bg-muted"><MoreHorizontal className="h-4 w-4" aria-hidden="true" /></button>
                {menu && (
                  <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-border bg-background p-1 shadow-xl" onKeyDown={(e) => { if (e.key === "Escape") setMenu(false); }}>
                    <button type="button" role="menuitem" onClick={share} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"><Share2 className="h-4 w-4" aria-hidden="true" />Share profile</button>
                    {!isMe && <button type="button" role="menuitem" onClick={toggleBlock} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"><Ban className="h-4 w-4" aria-hidden="true" />{blocked ? "Unblock" : "Block"}</button>}
                    {staff && !isMe && <button type="button" role="menuitem" onClick={() => staffAction(p.suspended_at ? "unsuspend" : "suspend")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"><Ban className="h-4 w-4" aria-hidden="true" />{p.suspended_at ? "Unsuspend (staff)" : "Suspend (staff)"}</button>}
                    {staff && <button type="button" role="menuitem" onClick={() => staffAction(p.is_specialist ? "unspecialist" : "specialist")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"><BadgeCheck className="h-4 w-4" aria-hidden="true" />{p.is_specialist ? "Remove specialist badge" : "Make specialist (admin)"}</button>}
                    {!isMe && <button type="button" role="menuitem" onClick={() => { setMenu(false); if (!uid) openAuth("Join to report members."); else setReporting(true); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-muted"><Flag className="h-4 w-4" aria-hidden="true" />Report</button>}
                  </div>
                )}
              </div>
            </div>
          </div>
          <h1 className="mt-3 flex items-center gap-1.5 font-display text-xl font-extrabold sm:text-2xl">{p.display_name}{p.is_specialist && <BadgeCheck className="h-5 w-5 text-[var(--emma-violet)]" aria-label="EmmaForYou specialist" />}</h1>
          <p className="text-sm text-muted-foreground">@{p.username}</p>
          {p.suspended_at && <p className="mt-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium">This account is suspended and hidden from the community.</p>}
          {p.headline && <p className="mt-2 text-sm font-medium">{p.headline}</p>}
          {p.bio && <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{p.bio}</p>}
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {p.location && <li className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{p.location}</li>}
            {website && <li><a href={website} target="_blank" rel="noopener noreferrer nofollow ugc" className="inline-flex items-center gap-1 hover:text-foreground hover:underline"><Globe className="h-3.5 w-3.5" aria-hidden="true" />{website.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "")}</a></li>}
            <li className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" aria-hidden="true" />Joined {joined}</li>
          </ul>
          {p.links?.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">{p.links.filter((l) => /^https?:\/\//i.test(l.url)).map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer nofollow ugc" className="text-xs font-semibold text-[var(--emma-violet)] hover:underline">{l.label || l.url}</a></li>)}</ul>
          )}
          {p.skills?.length > 0 && <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Skills">{p.skills.map((s) => <li key={s} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{s}</li>)}</ul>}
          <dl className="mt-4 grid grid-cols-4 gap-2 border-t border-border pt-3 text-center">
            {[["Posts", p.post_count], ["Followers", p.follower_count], ["Following", p.following_count], ["Helpful", p.helpful_count]].map(([k, v]) => (
              <div key={k as string}><dt className="text-[11px] text-muted-foreground sm:text-xs">{k}</dt><dd className="font-display text-base font-bold sm:text-lg">{v}</dd></div>
            ))}
          </dl>
        </div>
      </section>

      {blocked ? (
        <p className="mt-4 rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">You've blocked this member. Unblock them from the menu to see their posts.</p>
      ) : (
        <>
          <div role="group" aria-label="Profile sections" className="mt-4 flex gap-1">
            {(["posts", "followers", "following"] as Tab[]).map((t) => (
              <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-sm font-medium capitalize ${tab === t ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}>{t}</button>
            ))}
          </div>
          <div className="mt-4">{tab === "posts" ? <AuthorPosts authorId={p.user_id} isMe={isMe} /> : <People uid={p.user_id} direction={tab} />}</div>
        </>
      )}
      {reporting && uid && <ReportDialog uid={uid} targetType="profile" targetId={p.user_id} onClose={() => setReporting(false)} />}
      {toast && <div role="status" className="fixed bottom-20 left-1/2 z-[120] -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg md:bottom-6">{toast}</div>}
    </div>
  );
}

function AuthorPosts({ authorId, isMe }: { authorId: string; isMe: boolean }) {
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [next, setNext] = useState<FeedPage["next"]>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    fetchFeed({ sort: "latest", author: authorId }).then((pg) => { if (live) { setPosts(pg.posts); setNext(pg.next); } }).catch((e) => { if (live) { setError(friendly(e)); setPosts([]); } });
    return () => { live = false; };
  }, [authorId]);
  async function more() {
    if (!next) return;
    setBusy(true);
    try { const pg = await fetchFeed({ sort: "latest", author: authorId, ...next }); setPosts((p) => [...(p ?? []), ...pg.posts]); setNext(pg.next); }
    catch (e) { setError(friendly(e)); } finally { setBusy(false); }
  }
  if (posts === null) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading posts" /></div>;
  if (posts.length === 0) return <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">{error || (isMe ? "You haven't posted yet." : "No posts yet.")}</p>;
  return (
    <div className="space-y-4">
      {posts.map((x) => <PostCard key={x.id} post={x} onChange={(n) => setPosts((l) => l?.map((y) => (y.id === n.id ? n : y)) ?? l)} onRemoved={(id) => setPosts((l) => l?.filter((y) => y.id !== id) ?? l)} />)}
      {next && <div className="flex justify-center"><button type="button" onClick={more} disabled={busy} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Load more</button></div>}
    </div>
  );
}

function People({ uid, direction }: { uid: string; direction: "followers" | "following" }) {
  const [list, setList] = useState<Person[] | null>(null);
  useEffect(() => { let live = true; setList(null); listFollows(uid, direction).then((l) => { if (live) setList(l); }).catch(() => { if (live) setList([]); }); return () => { live = false; }; }, [uid, direction]);
  if (list === null) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading" /></div>;
  if (list.length === 0) return <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">{direction === "followers" ? "No followers yet." : "Not following anyone yet."}</p>;
  return (
    <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
      {list.map((x) => (
        <li key={x.user_id}><Link to="/community/u/$username" params={{ username: x.username }} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
          <Avatar name={x.display_name} src={x.avatar_url} size={40} />
          <span className="min-w-0"><span className="block truncate text-sm font-semibold">{x.display_name}</span><span className="block truncate text-xs text-muted-foreground">{x.headline || `@${x.username}`}</span></span>
        </Link></li>
      ))}
    </ul>
  );
}
