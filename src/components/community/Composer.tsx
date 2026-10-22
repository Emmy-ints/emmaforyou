import { useEffect, useRef, useState } from "react";
import { Eye, ImagePlus, Link2, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import RichText from "./RichText";
import { createPost, friendly, getPost, mediaUrl, newKey, removeUploaded, updatePost, uploadMedia, type PostInput } from "@/lib/community/api";
import { POST_KINDS, TOPICS, type FeedPost, type MediaItem, type PostKind } from "@/lib/community/types";

const DRAFT_KEY = "efy_community_compose";
const MAX_BODY = 10000;

interface Draft { kind: PostKind; title: string; body: string; link: string; tags: string; topic: string; visibility: "public" | "members"; options: string[]; media: MediaItem[] }
const empty = (kind: PostKind = "update"): Draft => ({ kind, title: "", body: "", link: "", tags: "", topic: "", visibility: "public", options: ["", ""], media: [] });

function fromPost(p: FeedPost): Draft {
  return { kind: p.kind, title: p.title ?? "", body: p.body, link: p.link_url ?? "", tags: p.tags.join(", "), topic: p.topic ?? "", visibility: p.visibility, options: p.poll_options ?? ["", ""], media: p.media };
}

/** Create or edit a post. Validation mirrors the database rules; the database has the final say. */
export default function Composer({ uid, editing, initialKind, staff = false, groupId, onDone, onCancel, autoFocus = false, stickyActions = false }: {
  uid: string; editing?: FeedPost; initialKind?: PostKind; staff?: boolean; groupId?: string; onDone: (post: FeedPost) => void; onCancel?: () => void; autoFocus?: boolean;
  /** Keep Publish/Cancel pinned to the bottom of a scrolling dialog so they are always reachable. */
  stickyActions?: boolean;
}) {
  const [d, setD] = useState<Draft>(() => {
    if (editing) return fromPost(editing);
    try { const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); if (saved?.body || saved?.title) return { ...empty(), ...saved, media: [] }; } catch { /* storage unavailable */ }
    return empty(initialKind);
  });
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState<"" | "publish" | "draft" | "upload">("");
  const [error, setError] = useState("");
  const clientKey = useRef(newKey());
  const fileRef = useRef<HTMLInputElement>(null);
  const kindInfo = POST_KINDS.find((k) => k.id === d.kind);
  const needsTitle = d.kind === "announcement" || Boolean(kindInfo?.needsTitle);
  const isPoll = d.kind === "poll";
  const update = (patch: Partial<Draft>) => { setD((x) => ({ ...x, ...patch })); setError(""); };

  // Keep unsent text in this browser only (never for edits). Cleared after publishing.
  useEffect(() => {
    if (editing) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, media: [] })); } catch { /* storage unavailable */ }
  }, [d, editing]);

  const tags = d.tags.split(/[\s,]+/).map((t) => t.replace(/^#/, "").replace(/[^A-Za-z0-9-]/g, "").toLowerCase()).filter((t) => t.length >= 2 && t.length <= 30).slice(0, 8);
  const options = d.options.map((o) => o.trim());
  const linkOk = !d.link.trim() || /^https?:\/\/\S+\.\S+/.test(d.link.trim());
  const problems = [
    !d.body.trim() && "Write something.",
    d.body.length > MAX_BODY && `Keep it under ${MAX_BODY.toLocaleString()} characters.`,
    needsTitle && d.title.trim().length < 3 && "Add a title (at least 3 characters).",
    d.title.length > 160 && "Keep the title under 160 characters.",
    isPoll && options.filter(Boolean).length < 2 && "A poll needs at least 2 options.",
    isPoll && options.some((o) => o.length > 80) && "Keep each poll option under 80 characters.",
    !linkOk && "The link must start with http:// or https://",
  ].filter(Boolean) as string[];

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = [...files];
    const hasVideo = d.media.some((m) => m.type === "video") || list.some((f) => f.type.startsWith("video/"));
    if (hasVideo && d.media.length + list.length > 1) { setError("Attach either one video or up to 6 images."); return; }
    if (d.media.length + list.length > 6) { setError("You can attach up to 6 images."); return; }
    setBusy("upload"); setError("");
    try {
      for (const f of list) { const m = await uploadMedia(uid, f); setD((x) => ({ ...x, media: [...x.media, m] })); }
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed."); }
    finally { setBusy(""); if (fileRef.current) fileRef.current.value = ""; }
  }

  function removeMedia(path: string) {
    update({ media: d.media.filter((m) => m.path !== path) });
    if (!editing?.media.some((m) => m.path === path)) void removeUploaded(path);
  }

  async function submit(status: "published" | "draft") {
    if (busy) return;
    if (status === "published" && problems.length) { setError(problems[0]); return; }
    if (status === "draft" && !d.body.trim()) { setError("Write something before saving a draft."); return; }
    setBusy(status === "published" ? "publish" : "draft"); setError("");
    const input: PostInput = {
      kind: d.kind, title: d.title.trim() || null, body: d.body.trim(), link_url: d.link.trim() || null, media: d.media,
      tags, topic: d.topic || null, poll_options: isPoll ? options.filter(Boolean) : null, visibility: d.visibility, status,
    };
    try {
      let id = editing?.id;
      if (editing) await updatePost(editing.id, input);
      else id = await createPost(uid, input, clientKey.current, groupId);
      const saved = id ? await getPost(id, uid) : null;
      if (!saved) throw new Error("Saved, but couldn't load the post. Refresh to see it.");
      if (!editing) { try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ } setD(empty()); clientKey.current = newKey(); }
      onDone(saved);
    } catch (e) { setError(e instanceof Error ? e.message : friendly(e)); }
    finally { setBusy(""); }
  }

  const kinds = POST_KINDS.filter((k) => !editing || k.id === editing.kind);
  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit("published"); }} className="min-w-0 space-y-3" aria-label={editing ? "Edit post" : "Create a post"} noValidate>
      {!editing && (
        <div role="radiogroup" aria-label="Type of post" className="flex min-w-0 flex-wrap gap-1.5">
          {[...kinds, ...(staff ? [{ id: "announcement" as const, label: "Announcement", needsTitle: true, hint: "Official news from the EmmaForYou team." }] : [])].map((k) => (
            <button key={k.id} type="button" role="radio" aria-checked={d.kind === k.id} onClick={() => update({ kind: k.id })}
              className={`min-h-9 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${d.kind === k.id ? "border-[var(--emma-violet)] bg-[var(--emma-violet)] text-white" : "border-border text-muted-foreground hover:text-foreground"}`}>{k.label}</button>
          ))}
        </div>
      )}
      {kindInfo && !editing && <p className="text-xs text-muted-foreground">{kindInfo.hint}</p>}

      {preview ? (
        <div className="rounded-2xl border border-dashed border-border p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preview</p>
          {d.title && <h2 className="mb-1.5 font-display text-lg font-semibold">{d.title}</h2>}
          <RichText text={d.body || "Nothing written yet."} className="text-[0.95rem]" />
          {d.media.length > 0 && <p className="mt-2 text-xs text-muted-foreground">{d.media.length} attachment{d.media.length === 1 ? "" : "s"}</p>}
          {isPoll && <ul className="mt-2 space-y-1">{options.filter(Boolean).map((o, i) => <li key={i} className="rounded-lg border border-border px-3 py-2 text-sm">{o}</li>)}</ul>}
          {tags.length > 0 && <p className="mt-2 text-xs text-[var(--emma-violet)]">{tags.map((t) => `#${t}`).join(" ")}</p>}
        </div>
      ) : (
        <>
          {(needsTitle || d.title) && (
            <label className="block"><span className="sr-only">Title</span>
              <input className="input font-semibold" placeholder={d.kind === "question" ? "What's your question?" : "Title"} maxLength={160} value={d.title} onChange={(e) => update({ title: e.target.value })} autoFocus={autoFocus && needsTitle} />
            </label>
          )}
          <label className="block"><span className="sr-only">{isPoll ? "Poll question" : "Post text"}</span>
            <textarea className="input min-h-[120px] w-full resize-y sm:min-h-[140px]" placeholder={isPoll ? "Ask your question…" : d.kind === "question" ? "Add details: what you've tried, your platform, your goal…" : "What would you like to share? Use @username to mention and #tag for topics."}
              maxLength={MAX_BODY} value={d.body} onChange={(e) => update({ body: e.target.value })} autoFocus={autoFocus && !needsTitle} />
          </label>
          <div className="-mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            {!needsTitle && !d.title ? <button type="button" onClick={() => update({ title: " " })} className="min-h-8 text-xs font-semibold text-[var(--emma-violet)] hover:underline">+ Add a title</button> : <span />}
            <p className="text-[11px] text-muted-foreground">{d.body.length.toLocaleString()} / {MAX_BODY.toLocaleString()}<span className="hidden sm:inline"> · **bold**, `code`, links, @mentions and #tags</span></p>
          </div>

          {isPoll && (
            <fieldset className="space-y-2" disabled={Boolean(editing)}>
              <legend className="text-sm font-medium">Options{editing && <span className="ml-1 text-xs font-normal text-muted-foreground">(can't be changed after posting)</span>}</legend>
              {d.options.map((o, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input" aria-label={`Option ${i + 1}`} placeholder={`Option ${i + 1}`} maxLength={80} value={o} onChange={(e) => update({ options: d.options.map((x, j) => (j === i ? e.target.value : x)) })} />
                  {d.options.length > 2 && !editing && <button type="button" aria-label={`Remove option ${i + 1}`} onClick={() => update({ options: d.options.filter((_, j) => j !== i) })} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-red-600"><X className="h-4 w-4" aria-hidden="true" /></button>}
                </div>
              ))}
              {d.options.length < 6 && !editing && <button type="button" onClick={() => update({ options: [...d.options, ""] })} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--emma-violet)]"><Plus className="h-4 w-4" aria-hidden="true" />Add option</button>}
            </fieldset>
          )}

          {d.media.length > 0 && (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {d.media.map((m, i) => (
                <li key={m.path} className="overflow-hidden rounded-xl border border-border bg-muted">
                  <div className="relative">
                    {m.type === "image" ? <img src={mediaUrl(m.path)} alt="" className="aspect-video w-full object-cover" /> : <video src={mediaUrl(m.path)} className="aspect-video w-full bg-black object-cover" muted preload="metadata" />}
                    <button type="button" aria-label="Remove attachment" onClick={() => removeMedia(m.path)} className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                  </div>
                  <input className="w-full border-0 bg-transparent px-2 py-1.5 text-xs outline-none" aria-label={`Describe attachment ${i + 1} for people using screen readers`} placeholder="Describe it (alt text)" maxLength={300} value={m.alt ?? ""} onChange={(e) => update({ media: d.media.map((x) => (x.path === m.path ? { ...x, alt: e.target.value } : x)) })} />
                </li>
              ))}
            </ul>
          )}

          <details className="group min-w-0 rounded-xl border border-border px-3 py-2 [&_summary::-webkit-details-marker]:hidden" open={Boolean(d.link || d.tags || d.topic || d.visibility !== "public")}>
          <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium">
            <span>More options <span className="text-xs font-normal text-muted-foreground">(link, tags, topic, who can see it)</span></span>
            <Plus className="h-4 w-4 shrink-0 transition group-open:rotate-45" aria-hidden="true" />
          </summary>
          <div className="mt-2 grid min-w-0 grid-cols-1 gap-2 pb-1 sm:grid-cols-2">
            <label className="block min-w-0 text-xs font-medium text-muted-foreground"><span className="flex items-center gap-1"><Link2 className="h-3.5 w-3.5" aria-hidden="true" />Link (optional)</span>
              <input className="input mt-1" type="url" inputMode="url" placeholder="https://" maxLength={500} value={d.link} onChange={(e) => update({ link: e.target.value })} aria-invalid={!linkOk} />
            </label>
            <label className="block min-w-0 text-xs font-medium text-muted-foreground">Tags (up to 8)
              <input className="input mt-1" placeholder="shopify, seo" maxLength={200} value={d.tags} onChange={(e) => update({ tags: e.target.value })} />
            </label>
            <label className="block min-w-0 text-xs font-medium text-muted-foreground">Topic
              <select className="input mt-1" value={d.topic} onChange={(e) => update({ topic: e.target.value })}>
                <option value="">Choose a topic</option>
                {TOPICS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </label>
            <label className="block min-w-0 text-xs font-medium text-muted-foreground">Who can see it
              <select className="input mt-1" value={d.visibility} onChange={(e) => update({ visibility: e.target.value as Draft["visibility"] })}>
                <option value="public">Everyone</option>
                <option value="members">Signed-in members only</option>
              </select>
            </label>
          </div>
          </details>
        </>
      )}

      <div className={`flex flex-wrap items-center gap-2 border-t border-border pt-3 ${stickyActions ? "sticky -bottom-4 z-10 -mx-4 -mb-4 bg-background px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:-bottom-6 sm:-mx-6 sm:-mb-6 sm:px-6 sm:pb-6" : ""}`}>
        {error && <p role="alert" className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{error}</p>}
        {!preview && (
          <>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" multiple className="sr-only" id={`media-${clientKey.current}`} onChange={(e) => void addFiles(e.target.files)} />
            <label htmlFor={`media-${clientKey.current}`} className={`inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 text-sm font-medium hover:bg-muted ${busy === "upload" ? "pointer-events-none opacity-60" : ""}`}>
              {busy === "upload" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-4 w-4" aria-hidden="true" />}{busy === "upload" ? "Uploading…" : "Photo or video"}
            </label>
          </>
        )}
        <button type="button" onClick={() => setPreview((p) => !p)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-medium hover:bg-muted">{preview ? <Pencil className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}{preview ? "Keep editing" : "Preview"}</button>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
        {onCancel && <button type="button" onClick={onCancel} className="min-h-10 rounded-full px-3 text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</button>}
        {(!editing || editing.status === "draft") && <button type="button" onClick={() => void submit("draft")} disabled={Boolean(busy)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold disabled:opacity-60">{busy === "draft" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Save draft</button>}
        <button type="submit" disabled={Boolean(busy)} className="btn-primary-gradient inline-flex min-h-10 items-center gap-1.5 rounded-full px-5 text-sm font-semibold text-white disabled:opacity-60">
          {busy === "publish" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{busy === "publish" ? "Publishing…" : editing && editing.status === "published" ? "Save changes" : "Publish"}
        </button>
        </div>
      </div>
    </form>
  );
}
