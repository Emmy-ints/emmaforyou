import { useState } from "react";
import { Heart, Lock, MessageCircle, Send, ShieldAlert } from "lucide-react";
import { Badge, Btn, ListEditor, Outbox, Panel, RoleBar, Select, SettingsPanel, Toggles, curOf, money, uid, useDemoSetting, type EngineProps, type OutboxItem } from "./ui";

interface Post { id: string; author: string; group: string; text: string; likes: number; liked: boolean; comments: string[]; members?: boolean; status: "live" | "pending" }
const BANNED_DEFAULT = ["spam", "scam", "buy followers", "crypto giveaway", "http://"];

const P: Record<string, { groups: string[]; me: string; posts: Omit<Post, "id" | "liked" | "status">[]; placeholder: string }> = {
  community: { groups: ["General", "Introductions", "Marketing tips", "Wins"], me: "You", placeholder: "Share a question or win…", posts: [
    { author: "Ada (moderator)", group: "General", text: "Welcome to the community! Introduce yourself in #Introductions 👋", likes: 24, comments: ["Glad to be here!"] },
    { author: "Tunde", group: "Wins", text: "Just closed our first B2B client from LinkedIn after following last week's tips.", likes: 17, comments: ["Congrats!", "Which tip helped most?"] },
    { author: "Chloe", group: "Marketing tips", text: "What's everyone's best-performing post format this month?", likes: 6, comments: [] }] },
  creator: { groups: ["All posts", "Free", "Members only"], me: "Fan", placeholder: "Write something for your fans…", posts: [
    { author: "Creator", group: "Free", text: "New video drops Friday — here's a sneak peek of the set.", likes: 312, comments: ["Can't wait!"] },
    { author: "Creator", group: "Members only", text: "Full recipe + shopping list from today's video (members only).", likes: 88, comments: [], members: true },
    { author: "Creator", group: "Members only", text: "Live Q&A replay for members.", likes: 54, comments: [], members: true }] },
  chat: { groups: ["#general", "#sales", "#support", "#random"], me: "You", placeholder: "Message the channel… (try @Chloe)", posts: [
    { author: "Chloe", group: "#sales", text: "@Tunde the Northwind proposal is approved 🎉", likes: 3, comments: [] },
    { author: "Tunde", group: "#general", text: "Reminder: team call at 3pm today.", likes: 5, comments: [] },
    { author: "Ada", group: "#support", text: "Customer asking about bulk discounts — who owns this?", likes: 0, comments: ["Sales, I'll take it"] }] },
};

export default function FeedDemo(props: EngineProps) {
  const { preset, brand } = props;
  const base = P[preset] ?? P.community;
  const [groups, setGroups] = useDemoSetting<string[]>(props, "groups", base.groups);
  const [banned, setBanned] = useDemoSetting<string[]>(props, "banned", BANNED_DEFAULT);
  const [premod, setPremod] = useDemoSetting(props, "premod", false);
  const [price, setPrice] = useDemoSetting(props, "price", 5);
  const [notify, setNotify] = useDemoSetting<string[]>(props, "notify", ["mention", "reply"]);
  const [role, setRole] = useDemoSetting(props, "role", preset === "chat" ? "member" : "moderator");
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const push = (channel: string, to: string, text: string) => setOutbox((o) => [...o, { id: uid(), channel, to, text }].slice(-30));
  const cfg = { ...base, groups: preset === "creator" ? base.groups : groups };
  const isBanned = (t: string) => banned.find((w) => w.trim() && t.toLowerCase().includes(w.trim().toLowerCase()));
  const [posts, setPosts] = useState<Post[]>(() => base.posts.map((p) => ({ ...p, id: uid(), liked: false, status: "live" })));
  const [groupRaw, setGroup] = useState(cfg.groups[0]);
  const group = cfg.groups.includes(groupRaw) ? groupRaw : cfg.groups[0];
  const [text, setText] = useState("");
  const [member, setMember] = useState(false);
  const [comment, setComment] = useState<Record<string, string>>({});
  const [modView, setModView] = useState(false);
  const pending = posts.filter((p) => p.status === "pending");
  const shown = posts.filter((p) => p.status === "live" && (group === cfg.groups[0] && preset !== "chat" ? true : p.group === group));

  const post = () => {
    const t = text.trim(); if (!t) return;
    const flagged = !!isBanned(t) || (premod && role !== "moderator");
    setPosts((ps) => [{ id: uid(), author: cfg.me, group: preset === "creator" ? (group === "All posts" ? "Free" : group) : group, text: t, likes: 0, liked: false, comments: [], members: group === "Members only", status: flagged ? "pending" : "live" }, ...ps]);
    if (!flagged && notify.includes("mention")) (t.match(/@\w+/g) ?? []).forEach((m) => push("Push + email", m.slice(1), `${cfg.me} mentioned you in ${group}: "${t.slice(0, 80)}"`));
    if (flagged) push("Email", "Moderators", `Post waiting for review in ${group}${isBanned(t) ? ` (matched "${isBanned(t)}")` : " (pre-moderation is on)"}.`);
    setText("");
  };

  const ROLES = preset === "chat"
    ? [{ id: "member", label: "Team member", can: "Posts in channels, mentions colleagues and reacts." }, { id: "moderator", label: "Workspace admin", can: "Also manages channels and reviews flagged messages." }]
    : [{ id: "member", label: preset === "creator" ? "Fan" : "Member", can: preset === "creator" ? "Reads free posts; joins to unlock members-only posts." : "Posts, comments and likes. Flagged posts wait for a moderator." }, { id: "moderator", label: preset === "creator" ? "Creator" : "Moderator", can: "Sees the moderation queue, approves or removes posts, and edits rules in Demo settings." }];
  return (
    <div className="space-y-4">
    <SettingsPanel summary={`${banned.length} blocked words${premod ? " · pre-moderation" : ""}${preset === "creator" ? ` · ${money(price, curOf(props, "USD"))}/month` : ""}`}>
      {preset !== "creator" && <ListEditor label={preset === "chat" ? "Channels" : "Groups"} items={groups} onChange={setGroups} min={1} max={8} placeholder={preset === "chat" ? "#marketing" : "e.g. Events"} />}
      <ListEditor label="Blocked words and links (posts go to moderation)" items={banned} onChange={setBanned} min={0} max={10} placeholder="e.g. giveaway" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={premod} onChange={(e) => setPremod(e.target.checked)} className="accent-[var(--demo-accent)]" />Pre-moderation: every member post waits for approval</label>
      {preset === "creator" && <Select label="Membership price per month" value={String(price)} onChange={(e) => setPrice(Number(e.target.value))} options={[["3", money(3, curOf(props, "USD"))], ["5", money(5, curOf(props, "USD"))], ["10", money(10, curOf(props, "USD"))], ["25", money(25, curOf(props, "USD"))]]} className="max-w-[220px]" />}
      <Toggles label="Notifications" options={[["mention", "Notify people when they're @mentioned"], ["reply", "Notify authors about new comments"]]} value={notify} onChange={setNotify} />
    </SettingsPanel>
    <RoleBar roles={ROLES} value={role} onChange={(v) => { setRole(v); setModView(false); }} />
    <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
      <nav aria-label="Groups" className="space-y-1">
        {cfg.groups.map((g) => <button key={g} type="button" aria-pressed={group === g} onClick={() => setGroup(g)} className={`block w-full rounded-xl px-3 py-2 text-left text-sm ${group === g ? "bg-[var(--demo-accent)] font-semibold text-white" : "text-muted-foreground hover:bg-muted"}`}>{g}</button>)}
        {role === "moderator" && <button type="button" onClick={() => setModView(!modView)} className="mt-3 flex w-full items-center justify-between rounded-xl border border-border px-3 py-2 text-left text-xs"><span className="flex items-center gap-1"><ShieldAlert className="h-3.5 w-3.5" />Moderation</span>{pending.length > 0 && <Badge tone="warn">{pending.length}</Badge>}</button>}
        {preset === "creator" && <Btn className="mt-3 w-full" variant={member ? "ghost" : "primary"} onClick={() => setMember(!member)}>{member ? "Cancel membership" : `Join for ${money(price, curOf(props, "USD"))}/month`}</Btn>}
      </nav>
      <div className="space-y-3">
        {modView ? (
          <Panel title="Moderation queue">
            {pending.length === 0 ? <p className="text-sm text-muted-foreground">Nothing to review. Try posting something with the word "spam" to see auto-flagging.</p> : pending.map((p) => (
              <div key={p.id} className="mb-2 rounded-xl border border-amber-500/40 p-3 text-sm"><p>{p.text}</p><p className="mt-1 text-xs text-muted-foreground">{isBanned(p.text) ? `Flagged: contains "${isBanned(p.text)}"` : "Waiting for approval (pre-moderation)"}</p>
                <div className="mt-2 flex gap-2"><Btn onClick={() => setPosts((ps) => ps.map((x) => (x.id === p.id ? { ...x, status: "live" } : x)))}>Approve</Btn><Btn variant="danger" onClick={() => setPosts((ps) => ps.filter((x) => x.id !== p.id))}>Remove</Btn></div></div>))}
          </Panel>
        ) : (
          <>
            <form onSubmit={(e) => { e.preventDefault(); post(); }} className="flex gap-2 rounded-2xl border border-border bg-card p-3">
              <input value={text} onChange={(e) => setText(e.target.value)} maxLength={280} placeholder={preset === "chat" ? `Message ${group}… (try @Chloe)` : cfg.placeholder} aria-label="New post" className="flex-1 bg-transparent text-sm outline-none" />
              <Btn type="submit" disabled={!text.trim()} aria-label="Post"><Send className="h-4 w-4" /></Btn>
            </form>
            {posts.some((p) => p.status === "pending" && p.author === cfg.me) && <p role="status" className="text-xs text-amber-600">Your last post is waiting for a moderator.</p>}
            <ul className="space-y-3">{shown.map((p) => {
              const locked = p.members && !member && preset === "creator" && role !== "moderator";
              return (
                <li key={p.id} className="rounded-2xl border border-border bg-card p-3">
                  <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--demo-accent)_16%,transparent)] text-xs font-bold text-[var(--demo-accent)]">{p.author === "Creator" ? brand.charAt(0) : p.author.charAt(0)}</span><p className="text-sm font-semibold">{p.author === "Creator" ? brand : p.author}</p><span className="text-xs text-muted-foreground">{p.group}</span>{p.members && <Badge tone="accent">Members</Badge>}</div>
                  {locked ? <div className="mt-2 flex items-center gap-2 rounded-xl bg-muted p-4 text-sm text-muted-foreground"><Lock className="h-4 w-4" />Join to unlock this post</div> : <p className="mt-2 text-sm">{p.text.split(/(@\w+)/).map((s, i) => (s.startsWith("@") ? <mark key={i} className="rounded bg-[color-mix(in_srgb,var(--demo-accent)_18%,transparent)] px-0.5 text-foreground">{s}</mark> : s))}</p>}
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <button type="button" aria-pressed={p.liked} onClick={() => setPosts((ps) => ps.map((x) => (x.id === p.id ? { ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) } : x)))} className="flex items-center gap-1"><Heart className={`h-4 w-4 ${p.liked ? "fill-red-500 text-red-500" : ""}`} />{p.likes}</button>
                    <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" />{p.comments.length}</span>
                  </div>
                  {!locked && preset !== "chat" && (
                    <div className="mt-2 space-y-1">{p.comments.map((c, i) => <p key={i} className="rounded-lg bg-muted px-2 py-1 text-xs">{c}</p>)}
                      <form onSubmit={(e) => { e.preventDefault(); const c = comment[p.id]?.trim(); if (!c) return; setPosts((ps) => ps.map((x) => (x.id === p.id ? { ...x, comments: [...x.comments, c] } : x))); if (notify.includes("reply") && p.author !== cfg.me) push("Push", p.author === "Creator" ? brand : p.author, `New comment on your post: "${c.slice(0, 60)}"`); setComment({ ...comment, [p.id]: "" }); }}><input value={comment[p.id] ?? ""} onChange={(e) => setComment({ ...comment, [p.id]: e.target.value })} placeholder="Write a comment…" aria-label="Comment" maxLength={200} className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1 text-xs" /></form>
                    </div>
                  )}
                </li>);
            })}</ul>
            {shown.length === 0 && <p className="text-sm text-muted-foreground">No posts here yet. Be the first!</p>}
          </>
        )}
      </div>
    </div>
    <Outbox items={outbox} onClear={() => setOutbox([])} />
    </div>
  );
}
