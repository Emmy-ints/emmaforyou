import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Lock, Plus, Search, Users } from "lucide-react";
import { pageHead, breadcrumbLd } from "@/lib/seo";
import { friendly } from "@/lib/community/api";
import { createGroup, listGroups, myGroupIds, type Group, type Membership } from "@/lib/community/groups";
import { useCommunitySession } from "@/lib/community/session";
import { TOPICS, topicLabel } from "@/lib/community/types";
import { openAuth } from "@/components/community/AuthDialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/community/groups")({
  head: () => pageHead({
    title: "Groups — EmmaForYou Community", description: "Join groups about websites, online stores, apps, AI, automation and marketing, or start your own.", path: "/community/groups",
    jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Community", path: "/community" }, { name: "Groups", path: "/community/groups" }])],
  }),
  component: GroupsPage,
});

function GroupsPage() {
  const { ready, uid, profile } = useCommunitySession();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [list, setList] = useState<Group[] | null>(null);
  const [mine, setMine] = useState<Map<string, Membership>>(new Map());
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { const t = window.setTimeout(() => { listGroups(q).then(setList).catch((e) => { setError(friendly(e)); setList([]); }); }, q ? 300 : 0); return () => window.clearTimeout(t); }, [q]);
  useEffect(() => { if (ready && uid && profile) myGroupIds(uid).then(setMine).catch(() => undefined); }, [ready, uid, profile]);

  function startCreate() {
    if (!uid) return openAuth("Join to create a group.");
    if (!profile) return navigate({ to: "/community/settings", search: { setup: true } });
    setCreating(true);
  }
  const joined = list?.filter((g) => mine.get(g.id)?.status === "active") ?? [];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-extrabold">Groups</h1>
        <button type="button" onClick={startCreate} className="btn-primary-gradient inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-white"><Plus className="h-4 w-4" aria-hidden="true" />Create a group</button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Smaller spaces for people working on the same thing. Public groups are open to everyone; private groups need approval.</p>
      <div className="relative mt-4"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <label htmlFor="group-search" className="sr-only">Search groups</label>
        <input id="group-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search groups" className="input rounded-full pl-10" /></div>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      {joined.length > 0 && !q && (
        <section className="mt-5" aria-labelledby="your-groups"><h2 id="your-groups" className="text-sm font-semibold">Your groups</h2><GroupGrid list={joined} mine={mine} /></section>
      )}
      <section className="mt-5" aria-labelledby="all-groups">
        <h2 id="all-groups" className="text-sm font-semibold">{q ? "Results" : "All groups"}</h2>
        {list === null ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading groups" /></div>
          : list.length === 0 ? <p className="mt-2 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">{q ? "No groups match." : "No groups yet. Start the first one."}</p>
          : <GroupGrid list={list} mine={mine} />}
      </section>
      {creating && uid && <CreateGroup uid={uid} onClose={() => setCreating(false)} onCreated={(g) => navigate({ to: "/community/g/$slug", params: { slug: g.slug } })} />}
    </div>
  );
}

function GroupGrid({ list, mine }: { list: Group[]; mine: Map<string, Membership> }) {
  return (
    <ul className="mt-2 grid gap-3 sm:grid-cols-2">
      {list.map((g) => {
        const m = mine.get(g.id);
        return (
          <li key={g.id}><Link to="/community/g/$slug" params={{ slug: g.slug }} className="block h-full rounded-2xl border border-border bg-card p-4 hover:border-[var(--emma-violet)]">
            <span className="flex items-center gap-1.5 font-display text-base font-bold">{g.visibility === "private" && <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-label="Private group" />}{g.name}</span>
            {g.description && <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{g.description}</span>}
            <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" aria-hidden="true" />{g.member_count} member{g.member_count === 1 ? "" : "s"}</span>{g.topic && <span>· {topicLabel(g.topic)}</span>}{m && <span className="rounded-full bg-[var(--emma-violet)]/10 px-2 py-0.5 font-semibold text-[var(--emma-violet)]">{m.status === "pending" ? "Requested" : m.role === "member" ? "Joined" : m.role}</span>}</span>
          </Link></li>
        );
      })}
    </ul>
  );
}

function CreateGroup({ uid, onClose, onCreated }: { uid: string; onClose: () => void; onCreated: (g: Group) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 3) return setError("Give the group a name of at least 3 characters.");
    setBusy(true); setError("");
    try { onCreated(await createGroup(uid, { name, description, visibility, topic: topic || null })); }
    catch (err) { setError(err instanceof Error ? err.message : friendly(err)); setBusy(false); }
  }
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-[94vw] max-w-lg">
        <DialogTitle>Create a group</DialogTitle>
        <DialogDescription>You'll be the owner and can add admins later.</DialogDescription>
        <form onSubmit={submit} className="space-y-3">
          <div><label htmlFor="g-name" className="text-sm font-medium">Name</label><input id="g-name" className="input mt-1" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div><label htmlFor="g-desc" className="text-sm font-medium">What is it about? <span className="font-normal text-muted-foreground">(optional)</span></label><textarea id="g-desc" className="input mt-1" rows={3} maxLength={600} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div><label htmlFor="g-topic" className="text-sm font-medium">Topic</label>
            <select id="g-topic" className="input mt-1" value={topic} onChange={(e) => setTopic(e.target.value)}><option value="">No topic</option>{TOPICS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></div>
          <fieldset><legend className="text-sm font-medium">Who can join</legend>
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              {([["public", "Public", "Anyone can join and read posts."], ["private", "Private", "People ask to join; only members read posts."]] as const).map(([v, t, d]) => (
                <label key={v} className="flex cursor-pointer gap-2 rounded-xl border border-border p-3 text-sm has-[:checked]:border-[var(--emma-violet)]"><input type="radio" name="g-vis" checked={visibility === v} onChange={() => setVisibility(v)} className="mt-0.5 accent-[var(--emma-violet)]" /><span><span className="block font-medium">{t}</span><span className="text-xs text-muted-foreground">{d}</span></span></label>
              ))}
            </div>
          </fieldset>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary-gradient inline-flex min-h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold text-white disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Create group</button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
