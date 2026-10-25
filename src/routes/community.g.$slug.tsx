import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { KineticText } from "@/components/future/Kinetic";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Loader2, Lock, Users, Check, X, Shield, Trash2 } from "lucide-react";
import { pageHead } from "@/lib/seo";
import { fetchFeed, friendly, type FeedPage } from "@/lib/community/api";
import { approve, deleteGroup, groupBySlug, join, leave, members, membership, removeMember, setRole, updateGroup, type Group, type Member, type Membership } from "@/lib/community/groups";
import { useCommunitySession } from "@/lib/community/session";
import { topicLabel, type FeedPost } from "@/lib/community/types";
import PostCard from "@/components/community/PostCard";
import { onPostCreated, useStartPost } from "@/components/community/CommunityShell";
import { openAuth } from "@/components/community/AuthDialog";
import { Avatar } from "@/components/community/RichText";

export const Route = createFileRoute("/community/g/$slug")({
  head: ({ params }) => pageHead({ title: "Group — EmmaForYou Community", description: "A group in the EmmaForYou Community.", path: `/community/g/${params.slug}`, noindex: true }),
  component: GroupPage,
});

type Tab = "posts" | "members" | "settings";

function GroupPage() {
  const { slug } = Route.useParams();
  const { ready, uid, profile, staff } = useCommunitySession();
  const navigate = useNavigate();
  const startPost = useStartPost();
  const [g, setG] = useState<Group | null | undefined>(undefined);
  const [me, setMe] = useState<Membership | null>(null);
  const [tab, setTab] = useState<Tab>("posts");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const flash = (m: string) => { setToast(m); window.setTimeout(() => setToast(""), 2500); };

  useEffect(() => {
    if (!ready) return;
    let live = true;
    setG(undefined);
    groupBySlug(slug).then(async (row) => {
      if (!live) return;
      setG(row);
      if (row && uid) { const m = await membership(row.id, uid).catch(() => null); if (live) setMe(m); }
    }).catch(() => { if (live) setG(null); });
    return () => { live = false; };
  }, [slug, uid, ready]);

  const active = me?.status === "active";
  const manager = active && (me?.role === "owner" || me?.role === "admin");
  const canRead = g ? g.visibility === "public" || active || staff : false;

  async function toggleJoin() {
    if (!g) return;
    if (!uid) return openAuth("Join the community to join groups.");
    if (!profile) return navigate({ to: "/community/settings", search: { setup: true } });
    setBusy(true);
    try {
      if (me) { if (me.role === "owner") { flash("Owners can't leave their group. Delete it in Settings instead."); return; } await leave(g.id, uid); setMe(null); setG({ ...g, member_count: Math.max(0, g.member_count - (me.status === "active" ? 1 : 0)) }); }
      else { const m = await join(g.id, uid); setMe(m); if (m.status === "active") setG({ ...g, member_count: g.member_count + 1 }); else flash("Request sent. A group admin will review it."); }
    } catch (e) { flash(friendly(e)); } finally { setBusy(false); }
  }

  if (g === undefined) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading group" /></div>;
  if (g === null) return <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center"><h1 className="font-display text-xl font-bold"><KineticText text="Group not found" base={60} /></h1><Link to="/community/groups" className="mt-4 inline-flex rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">All groups</Link></div>;

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/community/groups" className="mb-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" aria-hidden="true" />All groups</Link>
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold">{g.visibility === "private" && <Lock className="h-5 w-5 text-muted-foreground" aria-label="Private group" />}{g.name}</h1>
            <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" aria-hidden="true" />{g.member_count} member{g.member_count === 1 ? "" : "s"}</span><span>{g.post_count} post{g.post_count === 1 ? "" : "s"}</span>{g.topic && <span>{topicLabel(g.topic)}</span>}<span>{g.visibility === "private" ? "Private: members only" : "Public"}</span></p>
          </div>
          <div className="flex gap-2">
            {active && <button type="button" onClick={() => startPost(undefined, g.id)} className="btn-primary-gradient min-h-10 rounded-full px-4 text-sm font-semibold text-white">Post</button>}
            <button type="button" onClick={toggleJoin} disabled={busy} aria-pressed={Boolean(me)} className={`min-h-10 rounded-full px-4 text-sm font-semibold disabled:opacity-60 ${me ? "border border-border hover:bg-muted" : "bg-foreground text-background"}`}>{me ? (me.status === "pending" ? "Cancel request" : me.role === "owner" ? "Owner" : "Leave") : g.visibility === "private" ? "Ask to join" : "Join"}</button>
          </div>
        </div>
        {g.description && <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{g.description}</p>}
      </section>

      <div role="group" aria-label="Group sections" className="mt-4 flex gap-1">
        {(["posts", "members", ...(manager || staff ? ["settings"] : [])] as Tab[]).map((t) => <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-sm font-medium capitalize ${tab === t ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}>{t}</button>)}
      </div>
      <div className="mt-4">
        {!canRead ? <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground"><Lock className="mx-auto mb-2 h-5 w-5" aria-hidden="true" />This is a private group. {me?.status === "pending" ? "Your request is waiting for approval." : "Ask to join to see its posts."}</p>
          : tab === "posts" ? <GroupFeed groupId={g.id} canPost={active} onStart={() => startPost(undefined, g.id)} />
          : tab === "members" ? <Members group={g} manager={Boolean(manager)} uid={uid} />
          : <GroupSettings group={g} owner={me?.role === "owner" || staff} onSaved={setG} onDeleted={() => navigate({ to: "/community/groups" })} />}
      </div>
      {toast && <div role="status" className="fixed bottom-20 left-1/2 z-[120] -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg md:bottom-6">{toast}</div>}
    </div>
  );
}

function GroupFeed({ groupId, canPost, onStart }: { groupId: string; canPost: boolean; onStart: () => void }) {
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [next, setNext] = useState<FeedPage["next"]>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async (more: boolean) => {
    setBusy(true);
    try { const pg = await fetchFeed({ sort: "latest", group: groupId, ...(more && next ? next : {}) }); setPosts((p) => (more && p ? [...p, ...pg.posts] : pg.posts)); setNext(pg.next); }
    catch (e) { setError(friendly(e)); if (!more) setPosts([]); } finally { setBusy(false); }
  }, [groupId, next]);
  useEffect(() => { void load(false); }, [groupId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => onPostCreated((p) => { if (p.group_id === groupId && p.status === "published") setPosts((l) => [p, ...(l ?? []).filter((x) => x.id !== p.id)]); }), [groupId]);
  if (posts === null) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading posts" /></div>;
  if (!posts.length) return <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">{error || "No posts in this group yet."}{canPost && !error && <div><button type="button" onClick={onStart} className="btn-primary-gradient mt-4 rounded-full px-5 py-2.5 text-sm font-semibold text-white">Write the first post</button></div>}</div>;
  return (
    <div className="space-y-4">
      {posts.map((p) => <PostCard key={p.id} post={p} onChange={(n) => setPosts((l) => l?.map((x) => (x.id === n.id ? n : x)) ?? l)} onRemoved={(id) => setPosts((l) => l?.filter((x) => x.id !== id) ?? l)} />)}
      {next && <div className="flex justify-center"><button type="button" onClick={() => load(true)} disabled={busy} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Load more</button></div>}
    </div>
  );
}

function Members({ group, manager, uid }: { group: Group; manager: boolean; uid: string | null }) {
  const [list, setList] = useState<Member[] | null>(null);
  const [error, setError] = useState("");
  const load = () => members(group.id).then(setList).catch((e) => { setError(friendly(e)); setList([]); });
  useEffect(() => { void load(); }, [group.id]); // eslint-disable-line react-hooks/exhaustive-deps
  async function act(fn: () => Promise<void>) { try { await fn(); await load(); } catch (e) { setError(friendly(e)); } }
  if (list === null) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading members" /></div>;
  const pending = list.filter((m) => m.status === "pending");
  const active = list.filter((m) => m.status === "active");
  const row = (m: Member, actions: React.ReactNode) => (
    <li key={m.user_id} className="flex items-center gap-3 px-4 py-3">
      <Avatar name={m.person?.display_name ?? "?"} src={m.person?.avatar_url} size={36} />
      <span className="min-w-0 flex-1">{m.person ? <Link to="/community/u/$username" params={{ username: m.person.username }} className="block truncate text-sm font-semibold hover:underline">{m.person.display_name}</Link> : <span className="text-sm">Member</span>}<span className="text-xs capitalize text-muted-foreground">{m.role}</span></span>
      {actions}
    </li>
  );
  const btn = "inline-flex h-8 items-center gap-1 rounded-full border border-border px-2.5 text-xs font-semibold hover:bg-muted";
  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {manager && pending.length > 0 && (
        <section aria-labelledby="pending-h"><h2 id="pending-h" className="mb-2 text-sm font-semibold">Requests ({pending.length})</h2>
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card">{pending.map((m) => row(m, <span className="flex gap-1.5"><button type="button" className={btn} onClick={() => act(() => approve(group.id, m.user_id))}><Check className="h-3.5 w-3.5" aria-hidden="true" />Approve</button><button type="button" className={btn} onClick={() => act(() => removeMember(group.id, m.user_id))} aria-label={`Decline ${m.person?.display_name ?? "request"}`}><X className="h-3.5 w-3.5" aria-hidden="true" /></button></span>))}</ul>
        </section>
      )}
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {active.map((m) => row(m, manager && m.role !== "owner" && m.user_id !== uid ? (
          <span className="flex gap-1.5">
            <button type="button" className={btn} onClick={() => act(() => setRole(group.id, m.user_id, m.role === "admin" ? "member" : "admin"))}><Shield className="h-3.5 w-3.5" aria-hidden="true" />{m.role === "admin" ? "Remove admin" : "Make admin"}</button>
            <button type="button" className={btn} onClick={() => { if (window.confirm(`Remove ${m.person?.display_name ?? "this member"} from the group?`)) void act(() => removeMember(group.id, m.user_id)); }} aria-label={`Remove ${m.person?.display_name ?? "member"}`}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></button>
          </span>
        ) : null))}
      </ul>
    </div>
  );
}

function GroupSettings({ group, owner, onSaved, onDeleted }: { group: Group; owner: boolean; onSaved: (g: Group) => void; onDeleted: () => void }) {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? "");
  const [visibility, setVisibility] = useState(group.visibility);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg("");
    try { await updateGroup(group.id, { name: name.trim(), description: description.trim() || null, visibility }); onSaved({ ...group, name: name.trim(), description: description.trim() || null, visibility }); setMsg("Saved."); }
    catch (err) { setMsg(friendly(err)); } finally { setBusy(false); }
  }
  async function remove() {
    if (!window.confirm(`Delete "${group.name}" and all of its posts? This can't be undone.`)) return;
    try { await deleteGroup(group.id); onDeleted(); } catch (e) { setMsg(friendly(e)); }
  }
  return (
    <form onSubmit={save} className="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div><label htmlFor="gs-name" className="text-sm font-medium">Name</label><input id="gs-name" className="input mt-1" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div><label htmlFor="gs-desc" className="text-sm font-medium">Description</label><textarea id="gs-desc" className="input mt-1" rows={3} maxLength={600} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      <div><label htmlFor="gs-vis" className="text-sm font-medium">Who can join</label><select id="gs-vis" className="input mt-1" value={visibility} onChange={(e) => setVisibility(e.target.value as "public" | "private")}><option value="public">Public: anyone can join and read</option><option value="private">Private: approval needed, members-only posts</option></select></div>
      {msg && <p role="status" className="text-sm">{msg}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="submit" disabled={busy} className="btn-primary-gradient min-h-10 rounded-full px-5 text-sm font-semibold text-white disabled:opacity-60">Save</button>
        {owner && <button type="button" onClick={remove} className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-red-600 hover:bg-red-500/10"><Trash2 className="h-4 w-4" aria-hidden="true" />Delete group</button>}
      </div>
    </form>
  );
}
