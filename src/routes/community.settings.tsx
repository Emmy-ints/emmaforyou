import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, Trash2, Download, LogOut, Check } from "lucide-react";
import { pageHead } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyProfile, deletePost, friendly, listDrafts, mediaUrl, myBlocks, saveProfile, setBlock, uploadMedia, usernameTaken, type ProfileInput } from "@/lib/community/api";
import { refreshProfile, useCommunitySession } from "@/lib/community/session";
import { TOPICS, type FeedPost } from "@/lib/community/types";
import { openAuth } from "@/components/community/AuthDialog";
import { openComposer } from "@/components/community/CommunityShell";
import { Avatar, timeAgo } from "@/components/community/RichText";

type Tab = "profile" | "drafts" | "privacy" | "account";
const TABS: { id: Tab; label: string }[] = [{ id: "profile", label: "Profile" }, { id: "drafts", label: "Drafts" }, { id: "privacy", label: "Privacy & blocks" }, { id: "account", label: "Account" }];

export const Route = createFileRoute("/community/settings")({
  validateSearch: (s: Record<string, unknown>): { setup?: boolean; tab?: Tab } => ({
    ...(s.setup === true || s.setup === "true" ? { setup: true } : {}),
    ...(typeof s.tab === "string" && TABS.some((t) => t.id === s.tab) ? { tab: s.tab as Tab } : {}),
  }),
  head: () => pageHead({ title: "Community settings — EmmaForYou", description: "Manage your EmmaForYou Community profile, drafts, privacy and account.", path: "/community/settings", noindex: true }),
  component: SettingsPage,
});

function SettingsPage() {
  const { ready, uid, profile } = useCommunitySession();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/community/settings" });
  const tab: Tab = profile ? (search.tab ?? "profile") : "profile";

  if (!ready) return <div className="flex justify-center py-16" role="status"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" /><span className="sr-only">Loading</span></div>;
  if (!uid) return (
    <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
      <h1 className="font-display text-xl font-bold">Community settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">Sign in to manage your community profile.</p>
      <div className="mt-4 flex justify-center gap-2">
        <button type="button" onClick={() => openAuth(undefined, "signin")} className="btn-primary-gradient rounded-full px-5 py-2.5 text-sm font-semibold text-white">Sign in</button>
        <button type="button" onClick={() => openAuth()} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">Join free</button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-extrabold">{profile ? "Settings" : "Set up your community profile"}</h1>
      {!profile && <p className="mt-1 text-sm text-muted-foreground">Choose a username and name. You can change everything later.</p>}
      {profile && (
        <div role="group" aria-label="Settings sections" className="mt-4 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <button key={t.id} type="button" aria-pressed={tab === t.id} onClick={() => navigate({ search: { tab: t.id }, replace: true })} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${tab === t.id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}>{t.label}</button>
          ))}
        </div>
      )}
      <div className="mt-4">
        {tab === "profile" && <ProfileForm uid={uid} />}
        {tab === "drafts" && <Drafts uid={uid} />}
        {tab === "privacy" && <Privacy uid={uid} />}
        {tab === "account" && <Account uid={uid} />}
      </div>
    </div>
  );
}

const card = "rounded-2xl border border-border bg-card p-4 sm:p-6";
const split = (s: string) => [...new Set(s.split(",").map((x) => x.trim()).filter(Boolean))].slice(0, 20);

function ProfileForm({ uid }: { uid: string }) {
  const { profile, email } = useCommunitySession();
  const navigate = useNavigate();
  const exists = Boolean(profile);
  const suggested = (email?.split("@")[0] ?? "").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24);
  const [f, setF] = useState(() => ({
    username: profile?.username ?? (suggested.length >= 3 ? suggested : ""),
    display_name: profile?.display_name ?? "",
    headline: profile?.headline ?? "", bio: profile?.bio ?? "", location: profile?.location ?? "", website: profile?.website ?? "",
    skills: (profile?.skills ?? []).join(", "), interests: profile?.interests ?? [],
    links: profile?.links?.length ? profile.links : [] as { label: string; url: string }[],
    avatar_url: profile?.avatar_url ?? null as string | null, cover_url: profile?.cover_url ?? null as string | null,
    visibility: profile?.visibility ?? "public" as "public" | "members",
  }));
  const [busy, setBusy] = useState<"" | "save" | "avatar" | "cover">("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [nameState, setNameState] = useState<"" | "checking" | "taken" | "ok">("");
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => { setF((x) => ({ ...x, [k]: v })); setSaved(false); };

  useEffect(() => {
    const u = f.username;
    if (!/^[a-z0-9_]{3,24}$/.test(u) || u === profile?.username) { setNameState(""); return; }
    setNameState("checking");
    const t = window.setTimeout(() => { usernameTaken(u, uid).then((taken) => setNameState(taken ? "taken" : "ok")).catch(() => setNameState("")); }, 400);
    return () => window.clearTimeout(t);
  }, [f.username, uid, profile?.username]);

  async function upload(kind: "avatar" | "cover", file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Choose an image file."); return; }
    setBusy(kind); setError("");
    try { const m = await uploadMedia(uid, file); set(kind === "avatar" ? "avatar_url" : "cover_url", mediaUrl(m.path)); }
    catch (e) { setError(friendly(e)); } finally { setBusy(""); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");
    if (!/^[a-z0-9_]{3,24}$/.test(f.username)) return setError("Usernames are 3–24 characters: lowercase letters, numbers and underscores.");
    if (!f.display_name.trim()) return setError("Add your name.");
    if (nameState === "taken") return setError("That username is taken.");
    const website = f.website.trim() ? (/^https?:\/\//i.test(f.website.trim()) ? f.website.trim() : `https://${f.website.trim()}`) : null;
    const links = f.links.map((l) => ({ label: l.label.trim().slice(0, 40), url: l.url.trim() })).filter((l) => l.url).map((l) => ({ ...l, url: /^https?:\/\//i.test(l.url) ? l.url : `https://${l.url}` })).slice(0, 8);
    const input: ProfileInput = {
      username: f.username, display_name: f.display_name.trim().slice(0, 60), headline: f.headline.trim() || null, bio: f.bio.trim() || null,
      location: f.location.trim() || null, website, skills: split(f.skills).map((s) => s.slice(0, 40)), interests: f.interests, links,
      avatar_url: f.avatar_url, cover_url: f.cover_url, visibility: f.visibility,
    };
    setBusy("save");
    try {
      await saveProfile(uid, input, exists);
      await refreshProfile();
      setSaved(true);
      if (!exists) navigate({ to: "/community" });
    } catch (err) {
      const m = friendly(err);
      setError(/duplicate|unique|23505/i.test(String((err as { message?: string })?.message ?? m)) ? "That username is taken." : m);
    } finally { setBusy(""); }
  }

  return (
    <form onSubmit={submit} className={`${card} space-y-5`} noValidate>
      <div>
        <p className="text-sm font-medium">Photos</p>
        <div className="mt-2 overflow-hidden rounded-xl border border-border">
          <div className="relative h-24 bg-gradient-to-br from-[var(--emma-violet)]/70 to-[#9b8cff]/50 sm:h-32">
            {f.cover_url && <img src={f.cover_url} alt="" className="h-full w-full object-cover" />}
            <div className="absolute right-2 top-2 flex gap-1.5">
              <button type="button" onClick={() => coverRef.current?.click()} className="inline-flex min-h-9 items-center gap-1 rounded-full bg-black/60 px-3 text-xs font-semibold text-white">{busy === "cover" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Upload className="h-3.5 w-3.5" aria-hidden="true" />}Cover</button>
              {f.cover_url && <button type="button" onClick={() => set("cover_url", null)} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white" aria-label="Remove cover photo"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></button>}
            </div>
          </div>
          <div className="flex items-center gap-3 p-3">
            <Avatar name={f.display_name || f.username || "?"} src={f.avatar_url} size={64} />
            <button type="button" onClick={() => avatarRef.current?.click()} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted">{busy === "avatar" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}Profile photo</button>
            {f.avatar_url && <button type="button" onClick={() => set("avatar_url", null)} className="text-sm font-medium text-muted-foreground hover:text-foreground">Remove</button>}
          </div>
        </div>
        <input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { void upload("avatar", e.target.files?.[0]); e.target.value = ""; }} />
        <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { void upload("cover", e.target.files?.[0]); e.target.value = ""; }} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cs-username" className="text-sm font-medium">Username</label>
          <div className="relative mt-1"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
            <input id="cs-username" className="input pl-7" value={f.username} onChange={(e) => set("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24))} required autoComplete="username" aria-describedby="cs-username-help" /></div>
          <p id="cs-username-help" className={`mt-1 text-xs ${nameState === "taken" ? "text-red-600" : "text-muted-foreground"}`} aria-live="polite">
            {nameState === "checking" ? "Checking…" : nameState === "taken" ? "That username is taken." : nameState === "ok" ? "Available." : "3–24 characters: a–z, 0–9 and _."}
          </p>
        </div>
        <div>
          <label htmlFor="cs-name" className="text-sm font-medium">Name</label>
          <input id="cs-name" className="input mt-1" value={f.display_name} onChange={(e) => set("display_name", e.target.value.slice(0, 60))} required autoComplete="name" />
        </div>
      </div>
      <div>
        <label htmlFor="cs-headline" className="text-sm font-medium">Headline <span className="font-normal text-muted-foreground">(optional)</span></label>
        <input id="cs-headline" className="input mt-1" value={f.headline} maxLength={120} onChange={(e) => set("headline", e.target.value)} placeholder="e.g. Founder at a Lagos fashion brand" />
      </div>
      <div>
        <label htmlFor="cs-bio" className="text-sm font-medium">About you <span className="font-normal text-muted-foreground">(optional)</span></label>
        <textarea id="cs-bio" className="input mt-1" rows={4} maxLength={1500} value={f.bio} onChange={(e) => set("bio", e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="cs-location" className="text-sm font-medium">Location</label><input id="cs-location" className="input mt-1" maxLength={80} value={f.location} onChange={(e) => set("location", e.target.value)} autoComplete="address-level2" /></div>
        <div><label htmlFor="cs-website" className="text-sm font-medium">Website</label><input id="cs-website" className="input mt-1" type="url" inputMode="url" maxLength={300} value={f.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" autoComplete="url" /></div>
      </div>
      <div>
        <label htmlFor="cs-skills" className="text-sm font-medium">Skills <span className="font-normal text-muted-foreground">(comma separated)</span></label>
        <input id="cs-skills" className="input mt-1" value={f.skills} onChange={(e) => set("skills", e.target.value)} placeholder="Shopify, React, Copywriting" />
      </div>
      <fieldset>
        <legend className="text-sm font-medium">Interests <span className="font-normal text-muted-foreground">(shapes your For you feed)</span></legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TOPICS.map((t) => {
            const on = f.interests.includes(t.id);
            return <button key={t.id} type="button" aria-pressed={on} onClick={() => set("interests", on ? f.interests.filter((x) => x !== t.id) : [...f.interests, t.id].slice(0, 20))} className={`inline-flex min-h-9 items-center gap-1 rounded-full border px-3 text-xs font-medium ${on ? "border-[var(--emma-violet)] bg-[var(--emma-violet)]/10 text-[var(--emma-violet)]" : "border-border text-muted-foreground hover:text-foreground"}`}>{on && <Check className="h-3.5 w-3.5" aria-hidden="true" />}{t.label}</button>;
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-medium">Links <span className="font-normal text-muted-foreground">(up to 8)</span></legend>
        <div className="mt-2 space-y-2">
          {f.links.map((l, i) => (
            <div key={i} className="flex gap-2">
              <input className="input w-1/3" aria-label={`Link ${i + 1} label`} placeholder="Label" value={l.label} onChange={(e) => set("links", f.links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <input className="input flex-1" aria-label={`Link ${i + 1} address`} placeholder="https://" inputMode="url" value={l.url} onChange={(e) => set("links", f.links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
              <button type="button" onClick={() => set("links", f.links.filter((_, j) => j !== i))} className="inline-flex w-10 shrink-0 items-center justify-center rounded-xl border border-border hover:bg-muted" aria-label={`Remove link ${i + 1}`}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          ))}
          {f.links.length < 8 && <button type="button" onClick={() => set("links", [...f.links, { label: "", url: "" }])} className="text-sm font-semibold text-[var(--emma-violet)] hover:underline">+ Add a link</button>}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-medium">Who can see your profile</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {([["public", "Everyone", "Anyone on the web, including search engines."], ["members", "Members only", "Only signed-in community members."]] as const).map(([v, t, d]) => (
            <label key={v} className="flex cursor-pointer gap-2 rounded-xl border border-border p-3 text-sm has-[:checked]:border-[var(--emma-violet)]">
              <input type="radio" name="visibility" value={v} checked={f.visibility === v} onChange={() => set("visibility", v)} className="mt-0.5 accent-[var(--emma-violet)]" />
              <span><span className="block font-medium">{t}</span><span className="text-xs text-muted-foreground">{d}</span></span>
            </label>
          ))}
        </div>
      </fieldset>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={Boolean(busy)} className="btn-primary-gradient inline-flex min-h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold text-white disabled:opacity-60">{busy === "save" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{exists ? "Save changes" : "Create profile"}</button>
        {saved && <span role="status" className="inline-flex items-center gap-1 text-sm text-emerald-600"><Check className="h-4 w-4" aria-hidden="true" />Saved</span>}
        {exists && profile && <Link to="/community/u/$username" params={{ username: profile.username }} className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline">View profile</Link>}
      </div>
    </form>
  );
}

function Drafts({ uid }: { uid: string }) {
  const [list, setList] = useState<FeedPost[] | null>(null);
  const [error, setError] = useState("");
  const load = () => listDrafts(uid).then(setList).catch((e) => { setError(friendly(e)); setList([]); });
  useEffect(() => { void load(); }, [uid]); // eslint-disable-line react-hooks/exhaustive-deps
  async function remove(id: string) {
    if (!window.confirm("Delete this draft? This can't be undone.")) return;
    try { await deletePost(id); setList((l) => l?.filter((x) => x.id !== id) ?? l); } catch (e) { setError(friendly(e)); }
  }
  if (list === null) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading drafts" /></div>;
  return (
    <div className={card}>
      <div className="flex items-center justify-between gap-2"><h2 className="font-display text-lg font-bold">Drafts</h2><button type="button" onClick={() => openComposer()} className="text-sm font-semibold text-[var(--emma-violet)] hover:underline">New post</button></div>
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
      {list.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No drafts. Choose "Save draft" in the composer to keep a post for later.</p> : (
        <ul className="mt-3 divide-y divide-border">
          {list.map((d) => (
            <li key={d.id} className="flex items-center gap-3 py-3">
              <Link to="/community/post/$id" params={{ id: d.id }} className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{d.title || d.body.slice(0, 80) || "Untitled draft"}</span>
                <span className="text-xs capitalize text-muted-foreground">{d.kind} · edited {timeAgo(d.edited_at ?? d.published_at)}</span>
              </Link>
              <button type="button" onClick={() => remove(d.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted" aria-label="Delete draft"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Privacy({ uid }: { uid: string }) {
  const [list, setList] = useState<Awaited<ReturnType<typeof myBlocks>> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { myBlocks(uid).then(setList).catch((e) => { setError(friendly(e)); setList([]); }); }, [uid]);
  async function unblock(id: string) {
    try { await setBlock(uid, id, false); setList((l) => l?.filter((x) => x.user_id !== id) ?? l); } catch (e) { setError(friendly(e)); }
  }
  return (
    <div className={card}>
      <h2 className="font-display text-lg font-bold">Blocked members</h2>
      <p className="mt-1 text-sm text-muted-foreground">You and people you block can't see each other's posts or comments, and follows between you are removed.</p>
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
      {list === null ? <Loader2 className="mt-4 h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading" /> : list.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">You haven't blocked anyone.</p> : (
        <ul className="mt-3 divide-y divide-border">
          {list.map((b) => (
            <li key={b.user_id} className="flex items-center gap-3 py-3">
              <Avatar name={b.display_name} src={b.avatar_url} size={36} />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{b.display_name}</span><span className="text-xs text-muted-foreground">@{b.username}</span></span>
              <button type="button" onClick={() => unblock(b.user_id)} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted">Unblock</button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-sm text-muted-foreground">Profile visibility is set on the <Link to="/community/settings" search={{ tab: "profile" }} className="font-semibold text-foreground underline">Profile</Link> tab.</p>
    </div>
  );
}

function Account({ uid }: { uid: string }) {
  const { email, profile } = useCommunitySession();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState<"" | "pw" | "export" | "delete" | "out">("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmText, setConfirmText] = useState("");

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (pw.length < 8) return setMsg({ ok: false, text: "Use at least 8 characters." });
    if (pw !== pw2) return setMsg({ ok: false, text: "The passwords don't match." });
    setBusy("pw");
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy("");
    if (error) setMsg({ ok: false, text: friendly(error) }); else { setPw(""); setPw2(""); setMsg({ ok: true, text: "Password updated." }); }
  }

  async function exportData() {
    setBusy("export"); setMsg(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const [posts, comments, reactions, follows, saves, reports] = await Promise.all([
        db.from("community_posts").select("*").eq("author_id", uid),
        db.from("community_comments").select("*").eq("author_id", uid),
        db.from("community_reactions").select("*").eq("user_id", uid),
        db.from("community_follows").select("*").or(`follower_id.eq.${uid},followee_id.eq.${uid}`),
        db.from("community_saves").select("*").eq("user_id", uid),
        db.from("community_reports").select("target_type,target_id,reason,details,status,created_at").eq("reporter_id", uid),
      ]);
      const data = { exported_at: new Date().toISOString(), email, profile, posts: posts.data ?? [], comments: comments.data ?? [], reactions: reactions.data ?? [], follows: follows.data ?? [], saved_posts: saves.data ?? [], reports: reports.data ?? [] };
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const a = document.createElement("a"); a.href = url; a.download = `emmaforyou-community-${profile?.username ?? "data"}.json`; a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      setMsg({ ok: true, text: "Your data was downloaded." });
    } catch (e) { setMsg({ ok: false, text: friendly(e) }); } finally { setBusy(""); }
  }

  async function removeProfile() {
    if (confirmText !== profile?.username) return;
    setBusy("delete"); setMsg(null);
    try { await deleteMyProfile(uid); await refreshProfile(); navigate({ to: "/community" }); }
    catch (e) { setMsg({ ok: false, text: friendly(e) }); setBusy(""); }
  }

  return (
    <div className="space-y-4">
      <div className={card}>
        <h2 className="font-display text-lg font-bold">Sign-in</h2>
        <p className="mt-1 text-sm text-muted-foreground">Signed in as <span className="font-medium text-foreground">{email}</span></p>
        <form onSubmit={changePassword} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="cs-pw" className="text-sm font-medium">New password</label><input id="cs-pw" type="password" className="input mt-1" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} /></div>
          <div><label htmlFor="cs-pw2" className="text-sm font-medium">Repeat new password</label><input id="cs-pw2" type="password" className="input mt-1" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} minLength={8} /></div>
          <div className="sm:col-span-2"><button type="submit" disabled={busy === "pw" || !pw} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-5 text-sm font-semibold hover:bg-muted disabled:opacity-60">{busy === "pw" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Update password</button></div>
        </form>
        <button type="button" onClick={async () => { setBusy("out"); await supabase.auth.signOut(); navigate({ to: "/community" }); }} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"><LogOut className="h-4 w-4" aria-hidden="true" />Sign out</button>
      </div>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</p>}
      <div className={card}>
        <h2 className="font-display text-lg font-bold">Your data</h2>
        <p className="mt-1 text-sm text-muted-foreground">Download everything you've shared in the community as a JSON file.</p>
        <button type="button" onClick={exportData} disabled={busy === "export"} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-5 text-sm font-semibold hover:bg-muted disabled:opacity-60">{busy === "export" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}Download my data</button>
      </div>
      {profile && (
        <div className={`${card} border-red-500/40`}>
          <h2 className="font-display text-lg font-bold text-red-600">Delete community profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">Permanently deletes your profile, posts, comments, reactions and follows. Your sign-in stays, so you can create a new profile later. This can't be undone.</p>
          <label htmlFor="cs-del" className="mt-3 block text-sm font-medium">Type <span className="font-mono">{profile.username}</span> to confirm</label>
          <input id="cs-del" className="input mt-1 max-w-xs" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
          <button type="button" onClick={removeProfile} disabled={confirmText !== profile.username || busy === "delete"} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full bg-red-600 px-5 text-sm font-semibold text-white disabled:opacity-50">{busy === "delete" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Delete my profile</button>
        </div>
      )}
    </div>
  );
}
