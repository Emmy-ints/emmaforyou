import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Eye, ImagePlus, Plus, Save, Sparkles, Star, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Btn, Card, check, db, Empty, ErrorText, Loading, Pill, Stat, useLoad, when } from "@/components/agents-admin/shared";
import { DesignationBadge, InternPhoto } from "@/components/interns/InternCard";
import InternProfileView from "@/components/interns/InternProfileView";
import { DESIGNATION, STATUS_LABEL, slugify, type Designation, type InternProfile, type InternStatus, type PublicIntern } from "@/lib/interns";
import { EXPERTISE } from "@/lib/services-data";

/**
 * Control room → Interns. Admin-only (interns.manage). Every write goes straight to the database
 * through row-level security; the database itself enforces slugs, designations, the publishing
 * checks and the audit trail. Interns never get an account, role or permission from a profile.
 */
interface Item { title: string; description?: string; url?: string; approved: boolean }
interface Link_ { label: string; url: string; approved: boolean }
export interface InternRow {
  id: string; slug: string; source_ref: string | null; display_name: string; designation: Designation; status: InternStatus;
  published: boolean; published_at: string | null; homepage_featured: boolean; homepage_order: number;
  specialty: string; short_bio: string; location: string; show_location: boolean;
  skills: string[]; specialties: string[]; languages: string[]; tools: string[]; services: string[]; interests: string[];
  portfolio: Item[]; external_links: Link_[]; photo_url: string; photo_alt: string;
  profile: Partial<InternProfile>; profile_source: "manual" | "ai" | "ai_edited"; profile_generated_at: string | null;
  seo_title: string; seo_description: string; noindex: boolean; alumni_public: boolean; start_date: string | null; end_date: string | null;
  created_at: string; updated_at: string;
}
interface Private { email: string; notes: string; completion_reason: string; archive_reason: string; missing: string[] }

const BLANK: Omit<InternRow, "id" | "slug" | "created_at" | "updated_at"> = {
  source_ref: null, display_name: "", designation: "intern", status: "pending", published: false, published_at: null, homepage_featured: false, homepage_order: 100,
  specialty: "", short_bio: "", location: "", show_location: false, skills: [], specialties: [], languages: [], tools: [], services: [], interests: [],
  portfolio: [], external_links: [], photo_url: "", photo_alt: "", profile: {}, profile_source: "manual", profile_generated_at: null,
  seo_title: "", seo_description: "", noindex: false, alumni_public: false, start_date: null, end_date: null,
};
const STATUS_TONE: Record<InternStatus, "muted" | "good" | "warn" | "bad" | "info"> = { pending: "warn", active: "good", completed: "info", archived: "muted", promoted: "info" };
const inp = "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm";
const split = (t: string) => Array.from(new Set(t.split(/[,\n;]/).map((x) => x.trim()).filter(Boolean)));

/** What still needs completing before a profile is ready to publish. */
export function missingFor(r: Pick<InternRow, "display_name" | "specialty" | "short_bio" | "photo_url" | "profile" | "skills" | "languages" | "location" | "show_location">): string[] {
  const m: string[] = [];
  if (r.display_name.trim().length < 2) m.push("name");
  if (r.specialty.trim().length < 3) m.push("specialty");
  if (r.short_bio.trim().length < 20) m.push("short bio");
  if (!r.photo_url) m.push("photo");
  if (!r.profile?.intro) m.push("profile");
  if (!r.skills.length) m.push("skills");
  if (r.location && !r.show_location) m.push("location approval");
  return m;
}

async function token() { return (await supabase.auth.getSession()).data.session?.access_token ?? ""; }

export default function InternsTab() {
  const ov = useLoad(async () => check(await db.rpc("intern_overview")) as Record<string, number>);
  const list = useLoad(async () => check(await db.from("interns").select("*").order("created_at", { ascending: false }).limit(1000)) as InternRow[]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | InternStatus>("");
  const [vis, setVis] = useState<"" | "published" | "draft" | "featured">("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const reload = () => { list.reload(); ov.reload(); };
  const rows = list.data ?? [];
  const shown = rows.filter((r) => {
    const hay = `${r.display_name} ${r.slug} ${r.specialty} ${r.skills.join(" ")} ${r.location} ${r.source_ref ?? ""}`.toLowerCase();
    return (!q || hay.includes(q.toLowerCase())) && (!status || r.status === status)
      && (!vis || (vis === "published" ? r.published : vis === "draft" ? !r.published : r.homepage_featured));
  });
  const o = ov.data;

  const bulk = async (kind: "publish" | "unpublish" | "feature" | "unfeature" | "archive" | "restore" | "delete") => {
    const ids = [...sel]; if (!ids.length) return;
    const n = `${ids.length} profile${ids.length === 1 ? "" : "s"}`;
    if (["unpublish", "archive", "delete"].includes(kind) && !window.confirm(kind === "delete" ? `Permanently delete ${n}? Their pages, photos links and private records are removed. The audit log keeps a record. This can't be undone.` : `${kind === "archive" ? "Archive" : "Unpublish"} ${n}? They'll disappear from the directory, homepage and sitemap.`)) return;
    setErr(""); setMsg("");
    const fails: string[] = [];
    for (const id of ids) {
      const r = rows.find((x) => x.id === id)!;
      const patch = kind === "publish" ? { published: true } : kind === "unpublish" ? { published: false } : kind === "feature" ? { homepage_featured: true } : kind === "unfeature" ? { homepage_featured: false }
        : kind === "archive" ? { status: "archived" } : kind === "restore" ? { status: restoreStatus(r) } : null;
      const res = patch ? await db.from("interns").update(patch).eq("id", id) : await db.from("interns").delete().eq("id", id);
      if (res.error) fails.push(`${r.display_name || r.slug}: ${res.error.message}`);
    }
    setSel(new Set()); reload();
    if (fails.length) setErr(fails.slice(0, 5).join(" · ")); else setMsg(`Done: ${kind} ${n}.`);
  };

  if (editing) return <Editor id={editing} rows={rows} onClose={(changed) => { setEditing(null); if (changed) reload(); }} />;
  return (
    <div className="space-y-4">
      <ErrorText message={ov.error || list.error} onRetry={reload} />
      {o && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Total profiles" value={o.total} /><Stat label="Active interns" value={o.active} /><Stat label="Pending approval" value={o.pending} warn={o.pending > 0} /><Stat label="Published" value={o.published} />
          <Stat label="On the homepage" value={o.featured} /><Stat label="Completed" value={o.completed} /><Stat label="Archived" value={o.archived} /><Stat label="Promoted to team" value={o.promoted} />
        </div>
      )}
      <Card title="Intern profiles" actions={<Btn tone="primary" onClick={() => setEditing("new")}><Plus className="h-4 w-4" aria-hidden="true" />Add intern</Btn>}>
        <div className="flex flex-wrap gap-2">
          <input aria-label="Search profiles" className={`${inp} mt-0 max-w-xs`} placeholder="Search name, skill, slug…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select aria-label="Status" className={`${inp} mt-0 w-auto`} value={status} onChange={(e) => setStatus(e.target.value as InternStatus | "")}><option value="">All statuses</option>{(Object.keys(STATUS_LABEL) as InternStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
          <select aria-label="Visibility" className={`${inp} mt-0 w-auto`} value={vis} onChange={(e) => setVis(e.target.value as typeof vis)}><option value="">Any visibility</option><option value="published">Published</option><option value="draft">Not published</option><option value="featured">On homepage</option></select>
        </div>
        {sel.size > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/40 p-2 text-sm" role="region" aria-label="Bulk actions">
            <span className="px-1 font-medium">{sel.size} selected</span>
            <Btn small onClick={() => void bulk("publish")}>Publish</Btn><Btn small onClick={() => void bulk("unpublish")}>Unpublish</Btn>
            <Btn small onClick={() => void bulk("feature")}>Add to homepage</Btn><Btn small onClick={() => void bulk("unfeature")}>Remove from homepage</Btn>
            <Btn small onClick={() => void bulk("archive")}>Archive</Btn><Btn small onClick={() => void bulk("restore")}>Restore</Btn>
            <Btn small tone="danger" onClick={() => void bulk("delete")}>Delete permanently</Btn>
            <button type="button" className="ml-auto text-xs underline" onClick={() => setSel(new Set())}>Clear</button>
          </div>
        )}
        <div className="mt-3"><ErrorText message={err} />{msg && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{msg}</p>}</div>
        {list.loading && !list.data ? <Loading /> : !shown.length ? <Empty>{rows.length ? "No profiles match." : "No intern profiles yet. Press “Add intern” to create the first draft."}</Empty> : (
          <ul className="mt-2 divide-y divide-border">
            <li className="flex items-center gap-2 py-2 text-xs text-muted-foreground"><input type="checkbox" aria-label="Select all shown" checked={shown.every((r) => sel.has(r.id))} onChange={(e) => setSel(e.target.checked ? new Set(shown.map((r) => r.id)) : new Set())} /> Select all shown ({shown.length})</li>
            {shown.map((r) => {
              const miss = missingFor(r);
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-3 py-3" data-intern-row={r.slug}>
                  <input type="checkbox" aria-label={`Select ${r.display_name || r.slug}`} checked={sel.has(r.id)} onChange={(e) => { const n = new Set(sel); if (e.target.checked) n.add(r.id); else n.delete(r.id); setSel(n); }} />
                  <InternPhoto i={r} />
                  <div className="min-w-[200px] flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-medium">{r.display_name || <em className="text-muted-foreground">No name yet</em>} <DesignationBadge d={r.designation} /></p>
                    <p className="text-xs text-muted-foreground">{r.specialty || "No specialty"} · /interns/{r.slug}</p>
                    <p className="mt-1 flex flex-wrap gap-1.5">
                      <Pill tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Pill>
                      <Pill tone={r.published ? "good" : "muted"}>{r.published ? "Published" : "Draft"}</Pill>
                      {r.homepage_featured && <Pill tone="info">Homepage #{r.homepage_order}</Pill>}
                      {r.profile_source !== "manual" && <Pill>{r.profile_source === "ai" ? "AI draft" : "AI, edited"}</Pill>}
                      {miss.length > 0 && <Pill tone="warn">Needs: {miss.join(", ")}</Pill>}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Created {when(r.created_at)} · updated {when(r.updated_at)}</p>
                  </div>
                  <Btn small onClick={() => setEditing(r.id)}>Edit</Btn>
                  {r.published && <a className="text-xs underline" href={`/interns/${r.slug}`} target="_blank" rel="noopener noreferrer">View live</a>}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <HomepageOrder rows={rows} onChanged={reload} />
      <ActivityCard />
    </div>
  );
}

function restoreStatus(r: Pick<InternRow, "designation">): InternStatus { return r.designation === "team_member" ? "promoted" : r.designation === "alumni" ? "completed" : "active"; }

function HomepageOrder({ rows, onChanged }: { rows: InternRow[]; onChanged: () => void }) {
  const feat = rows.filter((r) => r.homepage_featured).sort((a, b) => a.homepage_order - b.homepage_order || a.created_at.localeCompare(b.created_at));
  const [err, setErr] = useState("");
  const save = async (order: InternRow[]) => {
    setErr("");
    for (const [n, r] of order.entries()) if (r.homepage_order !== n + 1) { const res = await db.from("interns").update({ homepage_order: n + 1 }).eq("id", r.id); if (res.error) { setErr(res.error.message); break; } }
    onChanged();
  };
  const move = (i: number, d: number) => { const o = [...feat]; const [x] = o.splice(i, 1); o.splice(i + d, 0, x); void save(o); };
  return (
    <Card title="Homepage: Meet Our Interns">
      <p className="mb-3 text-sm text-muted-foreground">The homepage shows published profiles you add here, in this order (up to 8). Removing one keeps the profile; only its homepage spot is cleared. Unpublished profiles stay hidden even if selected.</p>
      <ErrorText message={err} />
      {!feat.length ? <Empty>No one is on the homepage yet, so the section is hidden. Select profiles above and choose “Add to homepage”.</Empty> : (
        <ol className="space-y-2">{feat.map((r, i) => (
          <li key={r.id} className="flex items-center gap-3 rounded-xl border border-border p-2">
            <span className="w-6 text-center text-sm font-semibold tabular-nums">{i + 1}</span>
            <span className="flex-1 text-sm font-medium">{r.display_name || r.slug} {!r.published && <Pill tone="warn">Not published — hidden</Pill>}</span>
            <button type="button" className="rounded-lg p-1.5 hover:bg-muted disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${r.display_name} up`}><ArrowUp className="h-4 w-4" /></button>
            <button type="button" className="rounded-lg p-1.5 hover:bg-muted disabled:opacity-30" disabled={i === feat.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${r.display_name} down`}><ArrowDown className="h-4 w-4" /></button>
            <button type="button" className="rounded-lg p-1.5 hover:bg-muted" onClick={async () => { await db.from("interns").update({ homepage_featured: false }).eq("id", r.id); onChanged(); }} aria-label={`Remove ${r.display_name} from the homepage`}><X className="h-4 w-4" /></button>
          </li>
        ))}</ol>
      )}
    </Card>
  );
}

function ActivityCard({ id }: { id?: string }) {
  const ev = useLoad(async () => {
    let qy = db.from("intern_events").select("id,intern_name,action,detail,actor_email,at").order("at", { ascending: false }).limit(id ? 50 : 25);
    if (id) qy = qy.eq("intern_id", id);
    return check(await qy) as { id: number; intern_name: string; action: string; detail: { fields?: string[] }; actor_email: string | null; at: string }[];
  }, [id]);
  return (
    <Card title={id ? "History" : "Recent intern activity"}>
      <ErrorText message={ev.error} onRetry={ev.reload} />
      {ev.loading && !ev.data ? <Loading /> : !ev.data?.length ? <Empty>No activity yet.</Empty> : (
        <ul className="space-y-1.5 text-sm">{ev.data.map((e) => (
          <li key={e.id} className="flex flex-wrap gap-x-2"><span className="font-medium">{e.action.replace(/_/g, " ")}</span>{!id && <span>· {e.intern_name || "unnamed"}</span>}
            {e.action === "edited" && e.detail?.fields && <span className="text-muted-foreground">({e.detail.fields.slice(0, 6).join(", ")}{e.detail.fields.length > 6 ? "…" : ""})</span>}
            <span className="text-muted-foreground">· {e.actor_email ?? "system"} · {when(e.at)}</span></li>
        ))}</ul>
      )}
    </Card>
  );
}

/* ───────────────────────── Editor ───────────────────────── */

function Editor({ id, rows, onClose }: { id: string | "new"; rows: InternRow[]; onClose: (changed: boolean) => void }) {
  const orig = id === "new" ? null : rows.find((r) => r.id === id) ?? null;
  const [f, setF] = useState<Omit<InternRow, "id" | "created_at" | "updated_at"> & { slug: string }>(() => ({ ...BLANK, slug: "", ...(orig ?? {}) }));
  const [priv, setPriv] = useState<Private>({ email: "", notes: "", completion_reason: "", archive_reason: "", missing: [] });
  const [privOrig, setPrivOrig] = useState<string>("");
  const [rowId, setRowId] = useState<string | null>(orig?.id ?? null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [removed, setRemoved] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);
  const [changed, setChanged] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!rowId) return;
    db.from("intern_private").select("email,notes,completion_reason,archive_reason,missing").eq("intern_id", rowId).maybeSingle().then(({ data }: { data: Private | null }) => { if (data) { setPriv(data); setPrivOrig(JSON.stringify(data)); } });
  }, [rowId]);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => { setF((x) => ({ ...x, [k]: v })); setDirty(true); };
  const setP = (k: keyof InternProfile, v: string | string[]) => { setF((x) => ({ ...x, profile: { ...x.profile, [k]: v }, profile_source: x.profile_source === "ai" ? "ai_edited" : x.profile_source })); setDirty(true); };
  const privDirty = JSON.stringify(priv) !== (privOrig || JSON.stringify({ email: "", notes: "", completion_reason: "", archive_reason: "", missing: [] }));

  const payload = () => {
    const { slug, ...rest } = f;
    return { ...rest, slug: slugify(slug) || slugify(f.display_name) || "intern", display_name: f.display_name.trim(), specialty: f.specialty.trim(), short_bio: f.short_bio.trim(),
      portfolio: f.portfolio.filter((p) => p.title.trim()), external_links: f.external_links.filter((l) => /^https:\/\//.test(l.url.trim())) };
  };

  const save = async (extra: Partial<InternRow> = {}, note = "Saved.") => {
    setErr(""); setMsg(""); setBusy("save");
    try {
      if (!rowId) {
        const dupe = rows.find((r) => r.display_name.trim().toLowerCase() === f.display_name.trim().toLowerCase() && f.display_name.trim());
        if (dupe && !window.confirm(`A profile named “${dupe.display_name}” already exists. Create another one anyway?`)) { setBusy(""); return false; }
      }
      const body = { ...payload(), ...extra };
      // the database sets designation, published_at and the final unique slug
      const { id: _i, created_at: _c, updated_at: _u, ...clean } = body as typeof body & { id?: string; created_at?: string; updated_at?: string };
      const res = rowId ? await db.from("interns").update(clean).eq("id", rowId).select("*").single() : await db.from("interns").insert(clean).select("*").single();
      if (res.error) throw new Error(res.error.message);
      const r = res.data as InternRow;
      if (!rowId || privDirty) {
        const pr = await db.from("intern_private").upsert({ intern_id: r.id, ...priv, missing: missingFor(r) });
        if (pr.error) throw new Error(pr.error.message);
        setPrivOrig(JSON.stringify({ ...priv, missing: missingFor(r) }));
      }
      setRowId(r.id); setF({ ...r }); setDirty(false); setChanged(true);
      setMsg(r.slug !== slugify(body.slug) && body.slug ? `${note} That URL was taken, so it's /interns/${r.slug}.` : note);
      return true;
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); return false; } finally { setBusy(""); }
  };

  const act = async (label: string, patch: Partial<InternRow>, confirmText?: string, reason?: keyof Private) => {
    if (confirmText && !window.confirm(confirmText)) return;
    if (reason) { const t = window.prompt(`Reason (private, optional):`, priv[reason] as string) ?? null; if (t === null) return; setPriv((p) => ({ ...p, [reason]: t.slice(0, 2000) })); if (rowId) await db.from("intern_private").upsert({ intern_id: rowId, ...priv, [reason]: t.slice(0, 2000) }); }
    await save(patch, `${label}.`);
  };

  const ai = async (action: "generate" | "rewrite" | "expand" | "shorten" | "improve") => {
    setErr(""); setMsg(""); setBusy(action); setRemoved([]);
    try {
      const svc = f.services.map((s) => EXPERTISE.find((e) => e.slug === s)?.name).filter(Boolean);
      const res = await fetch("/api/intern-profile", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ action, name: f.display_name, specialty: f.specialty, shortBio: f.short_bio, skills: f.skills, specialties: f.specialties, languages: f.languages,
          location: f.show_location ? f.location : "", tools: f.tools, services: svc, interests: f.interests, portfolio: f.portfolio.filter((p) => p.approved).map((p) => `${p.title}${p.description ? ` — ${p.description}` : ""}`),
          designation: DESIGNATION[f.designation].label === "Former Intern" ? "Former Intern (Alumni)" : DESIGNATION[f.designation].label, current: f.profile }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setRemoved(j.removed ?? []); throw new Error(j.message || `The AI request failed (${res.status}).`); }
      const p = j.profile as InternProfile & { seo_title: string; seo_description: string };
      setF((x) => ({ ...x, profile: { intro: p.intro, bio: p.bio, expertise: p.expertise, capabilities: p.capabilities, contribution: p.contribution, role: p.role }, profile_source: "ai", profile_generated_at: new Date().toISOString(),
        seo_title: x.seo_title || p.seo_title, seo_description: x.seo_description || p.seo_description }));
      setDirty(true); setRemoved(j.removed ?? []);
      setMsg("AI draft ready below. Review and edit it, then press Save — nothing is saved or published until you do.");
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); } finally { setBusy(""); }
  };

  const upload = async (file: File) => {
    if (!rowId) { setErr("Save the draft first, then add a photo."); return; }
    setErr(""); setBusy("photo");
    try {
      const bmp = await createImageBitmap(file);
      const side = Math.min(bmp.width, bmp.height), out = Math.min(480, side);
      const c = document.createElement("canvas"); c.width = out; c.height = out;
      c.getContext("2d")!.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, out, out);
      const blob: Blob = await new Promise((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error("Couldn't convert the image"))), "image/webp", 0.86));
      const path = `${rowId}/${Date.now()}.webp`;
      const up = await supabase.storage.from("intern-photos").upload(path, blob, { contentType: "image/webp", upsert: false });
      if (up.error) throw new Error(up.error.message);
      const url = supabase.storage.from("intern-photos").getPublicUrl(path).data.publicUrl;
      const old = f.photo_url.split("/intern-photos/")[1];
      const res = await db.from("interns").update({ photo_url: url }).eq("id", rowId);
      if (res.error) throw new Error(res.error.message);
      if (old) await supabase.storage.from("intern-photos").remove([decodeURIComponent(old)]);
      setF((x) => ({ ...x, photo_url: url })); setChanged(true); setMsg(`Photo updated (${out}×${out} WebP${out < 240 ? " — low resolution, a larger photo would look sharper" : ""}).`);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); } finally { setBusy(""); if (fileRef.current) fileRef.current.value = ""; }
  };

  const del = async () => {
    if (!rowId || !window.confirm(`Permanently delete ${f.display_name || "this profile"}? The page, photo and private record are removed. The audit log keeps a record that it existed. This can't be undone.`)) return;
    if (f.photo_url.includes("/intern-photos/")) await supabase.storage.from("intern-photos").remove([decodeURIComponent(f.photo_url.split("/intern-photos/")[1])]);
    const res = await db.from("interns").delete().eq("id", rowId);
    if (res.error) setErr(res.error.message); else onClose(true);
  };

  const miss = missingFor(f);
  const previewData: PublicIntern = useMemo(() => ({ ...f, location: f.show_location ? f.location : "", portfolio: f.portfolio.filter((p) => p.approved).map((p) => ({ title: p.title, description: p.description ?? "", url: p.url ?? "" })),
    external_links: f.external_links.filter((l) => l.approved), profile: { intro: "", bio: "", expertise: [], capabilities: [], contribution: "", role: "", ...f.profile }, updated_at: new Date().toISOString() }), [f]);
  const locked = dirty || !!busy;

  return (
    <div className="space-y-4">
      <div className="sticky top-[110px] z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-background/95 p-3 backdrop-blur">
        <button type="button" className="text-sm underline" onClick={() => { if (!dirty || window.confirm("Discard unsaved changes?")) onClose(changed); }}>← All interns</button>
        <span className="ml-1 font-display font-semibold">{f.display_name || "New intern"}</span><DesignationBadge d={f.designation} />
        <Pill tone={STATUS_TONE[f.status]}>{STATUS_LABEL[f.status]}</Pill><Pill tone={f.published ? "good" : "muted"}>{f.published ? "Published" : "Draft"}</Pill>
        {dirty && <Pill tone="warn">Unsaved changes</Pill>}
        <div className="ml-auto flex flex-wrap gap-2">
          <Btn onClick={() => setPreview(true)}><Eye className="h-4 w-4" aria-hidden="true" />Preview</Btn>
          <Btn tone="primary" disabled={!!busy || (!dirty && !!rowId && !privDirty)} onClick={() => void save()}><Save className="h-4 w-4" aria-hidden="true" />{busy === "save" ? "Saving…" : rowId ? "Save" : "Create draft"}</Btn>
        </div>
      </div>
      <ErrorText message={err} />
      {msg && <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">{msg}</p>}

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Card title="Public details">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium">Display name<input className={inp} value={f.display_name} maxLength={120} onChange={(e) => set("display_name", e.target.value)} /></label>
              <label className="text-sm font-medium">URL slug<input className={inp} value={f.slug} placeholder={slugify(f.display_name) || "made from the name"} maxLength={70} onChange={(e) => set("slug", e.target.value)} onBlur={(e) => set("slug", slugify(e.target.value))} />
                <span className="mt-1 block text-[11px] font-normal text-muted-foreground">/interns/{slugify(f.slug) || slugify(f.display_name) || "…"}{orig && f.slug !== orig.slug ? " · the old URL will redirect here" : ""}</span></label>
              <label className="text-sm font-medium sm:col-span-2">Specialty (headline)<input className={inp} value={f.specialty} maxLength={160} onChange={(e) => set("specialty", e.target.value)} /></label>
              <label className="text-sm font-medium sm:col-span-2">Short bio (your words — the AI only expands what's here and in the fields below)<textarea className={`${inp} min-h-24`} value={f.short_bio} maxLength={2000} onChange={(e) => set("short_bio", e.target.value)} /></label>
              <ListField label="Specialties" value={f.specialties} onChange={(v) => set("specialties", v)} />
              <ListField label="Skills" value={f.skills} onChange={(v) => set("skills", v)} />
              <ListField label="Tools & technologies" value={f.tools} onChange={(v) => set("tools", v)} />
              <ListField label="Professional interests" value={f.interests} onChange={(v) => set("interests", v)} />
              <ListField label="Languages" value={f.languages} onChange={(v) => set("languages", v)} />
              <label className="text-sm font-medium">Location<input className={inp} value={f.location} maxLength={120} onChange={(e) => set("location", e.target.value)} />
                <span className="mt-1 flex items-center gap-2 text-xs font-normal"><input type="checkbox" checked={f.show_location} onChange={(e) => set("show_location", e.target.checked)} />Approved to show publicly</span></label>
            </div>
            <fieldset className="mt-4"><legend className="text-sm font-medium">Services they can contribute to</legend>
              <div className="mt-2 grid max-h-48 gap-1 overflow-y-auto rounded-xl border border-border p-2 sm:grid-cols-2">{EXPERTISE.map((e) => (
                <label key={e.slug} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={f.services.includes(e.slug)} onChange={(x) => set("services", x.target.checked ? [...f.services, e.slug] : f.services.filter((s) => s !== e.slug))} />{e.name}</label>
              ))}</div>
            </fieldset>
          </Card>

          <Card title={<span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4" aria-hidden="true" />Profile writer</span>} actions={<span className="text-xs text-muted-foreground">{f.profile_generated_at ? `AI draft ${when(f.profile_generated_at)}${f.profile_source === "ai_edited" ? ", edited" : ""}` : "Written manually"}</span>}>
            <p className="text-sm text-muted-foreground">The AI only reorganises and expands the details above. The server removes any sentence that adds numbers, tools, employers, qualifications, years of experience, achievements or client results you didn't supply.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Btn tone="primary" disabled={!!busy} onClick={() => void ai("generate")}>{busy === "generate" ? "Writing…" : f.profile?.intro ? "Regenerate" : "Generate profile"}</Btn>
              {(["rewrite", "expand", "shorten", "improve"] as const).map((a) => <Btn key={a} disabled={!!busy || !f.profile?.intro} onClick={() => void ai(a)}>{busy === a ? "Working…" : a[0].toUpperCase() + a.slice(1)}</Btn>)}
            </div>
            {removed.length > 0 && (
              <details className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs"><summary className="cursor-pointer font-semibold">{removed.length} unsupported sentence{removed.length === 1 ? " was" : "s were"} removed</summary><ul className="mt-2 list-disc space-y-1 pl-4">{removed.map((r, i) => <li key={i}>{r}</li>)}</ul></details>
            )}
            <div className="mt-4 grid gap-3">
              <label className="text-sm font-medium">Introduction<textarea className={`${inp} min-h-16`} value={f.profile?.intro ?? ""} maxLength={600} onChange={(e) => setP("intro", e.target.value)} /></label>
              <label className="text-sm font-medium">Biography<textarea className={`${inp} min-h-36`} value={f.profile?.bio ?? ""} maxLength={3000} onChange={(e) => setP("bio", e.target.value)} /></label>
              <LinesField label="Expertise (one per line)" value={f.profile?.expertise ?? []} onChange={(v) => setP("expertise", v)} />
              <LinesField label="Capabilities (one per line)" value={f.profile?.capabilities ?? []} onChange={(v) => setP("capabilities", v)} />
              <label className="text-sm font-medium">How they contribute to our services<textarea className={`${inp} min-h-16`} value={f.profile?.contribution ?? ""} maxLength={800} onChange={(e) => setP("contribution", e.target.value)} /></label>
              <label className="text-sm font-medium">Role at EmmaForYou<textarea className={`${inp} min-h-12`} value={f.profile?.role ?? ""} maxLength={400} onChange={(e) => setP("role", e.target.value)} placeholder="Leave blank for the standard wording for their designation" /></label>
            </div>
          </Card>

          <Card title="Portfolio & external links">
            <p className="text-sm text-muted-foreground">Only items you tick as approved appear publicly. Add only work the intern has permission to show — never client work without the client's consent.</p>
            <ul className="mt-3 space-y-2">{f.portfolio.map((p, n) => (
              <li key={n} className="grid gap-2 rounded-xl border border-border p-2 sm:grid-cols-[1fr_1fr_auto_auto]">
                <input aria-label="Title" className={`${inp} mt-0`} placeholder="Title" value={p.title} onChange={(e) => set("portfolio", f.portfolio.map((x, i) => (i === n ? { ...x, title: e.target.value } : x)))} />
                <input aria-label="Link (https)" className={`${inp} mt-0`} placeholder="https://… (optional)" value={p.url ?? ""} onChange={(e) => set("portfolio", f.portfolio.map((x, i) => (i === n ? { ...x, url: e.target.value } : x)))} />
                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={p.approved} onChange={(e) => set("portfolio", f.portfolio.map((x, i) => (i === n ? { ...x, approved: e.target.checked } : x)))} />Approved</label>
                <button type="button" aria-label="Remove item" className="rounded-lg p-1.5 hover:bg-muted" onClick={() => set("portfolio", f.portfolio.filter((_, i) => i !== n))}><Trash2 className="h-4 w-4" /></button>
                <input aria-label="Description" className={`${inp} mt-0 sm:col-span-4`} placeholder="Short description (optional)" value={p.description ?? ""} onChange={(e) => set("portfolio", f.portfolio.map((x, i) => (i === n ? { ...x, description: e.target.value } : x)))} />
              </li>
            ))}</ul>
            <div className="mt-2"><Btn small onClick={() => set("portfolio", [...f.portfolio, { title: "", description: "", url: "", approved: false }])}><Plus className="h-3.5 w-3.5" aria-hidden="true" />Add portfolio item</Btn></div>
            <h3 className="mt-5 text-sm font-semibold">External profile links (e.g. Fiverr)</h3>
            <ul className="mt-2 space-y-2">{f.external_links.map((l, n) => (
              <li key={n} className="grid gap-2 sm:grid-cols-[160px_1fr_auto_auto]">
                <input aria-label="Label" className={`${inp} mt-0`} value={l.label} onChange={(e) => set("external_links", f.external_links.map((x, i) => (i === n ? { ...x, label: e.target.value } : x)))} />
                <input aria-label="URL" className={`${inp} mt-0`} value={l.url} onChange={(e) => set("external_links", f.external_links.map((x, i) => (i === n ? { ...x, url: e.target.value } : x)))} />
                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={l.approved} onChange={(e) => set("external_links", f.external_links.map((x, i) => (i === n ? { ...x, approved: e.target.checked } : x)))} />Show publicly</label>
                <button type="button" aria-label="Remove link" className="rounded-lg p-1.5 hover:bg-muted" onClick={() => set("external_links", f.external_links.filter((_, i) => i !== n))}><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}</ul>
            <div className="mt-2"><Btn small onClick={() => set("external_links", [...f.external_links, { label: "Fiverr", url: "https://", approved: false }])}><Plus className="h-3.5 w-3.5" aria-hidden="true" />Add link</Btn></div>
          </Card>

          <Card title="Search & sharing (SEO)">
            <div className="grid gap-3">
              <label className="text-sm font-medium">SEO title <span className="font-normal text-muted-foreground">({f.seo_title.length}/60)</span><input className={inp} value={f.seo_title} maxLength={70} placeholder={`${f.display_name || "Name"} — ${DESIGNATION[f.designation].label}, ${f.specialty || "specialty"} | EmmaForYou`} onChange={(e) => set("seo_title", e.target.value)} /></label>
              <label className="text-sm font-medium">Meta description <span className="font-normal text-muted-foreground">({f.seo_description.length}/155)</span><textarea className={`${inp} min-h-16`} value={f.seo_description} maxLength={170} placeholder="Leave blank to build one from the introduction" onChange={(e) => set("seo_description", e.target.value)} /></label>
              <label className="text-sm font-medium">Photo alt text<input className={inp} value={f.photo_alt} maxLength={200} placeholder={`${f.display_name || "Name"}, ${f.specialty || "specialty"} — ${DESIGNATION[f.designation].label} at EmmaForYou`} onChange={(e) => set("photo_alt", e.target.value)} /></label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!f.noindex} onChange={(e) => set("noindex", !e.target.checked)} />Allow search engines to index this profile (and list it in the sitemap)</label>
            </div>
            <div className="mt-3 rounded-xl border border-border p-3 text-sm">
              <p className="text-[#1a0dab] dark:text-sky-300">{f.seo_title || `${f.display_name || "Name"} — ${DESIGNATION[f.designation].label}, ${f.specialty}`.slice(0, 60)}</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">emmaforyou.online/interns/{slugify(f.slug) || slugify(f.display_name)}</p>
              <p className="text-xs text-muted-foreground">{f.seo_description || f.profile?.intro || f.short_bio || "No description yet."}</p>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Photo">
            <div className="flex items-center gap-3"><InternPhoto i={f} />
              <div className="flex flex-col gap-2">
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" id="itn-photo" onChange={(e) => { const x = e.target.files?.[0]; if (x) void upload(x); }} />
                <label htmlFor="itn-photo" className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted ${!rowId ? "pointer-events-none opacity-50" : ""}`}><ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />{busy === "photo" ? "Uploading…" : f.photo_url ? "Change photo" : "Upload photo"}</label>
                {f.photo_url && <button type="button" className="text-left text-xs underline" onClick={async () => { const old = f.photo_url.split("/intern-photos/")[1]; await db.from("interns").update({ photo_url: "" }).eq("id", rowId); if (old) await supabase.storage.from("intern-photos").remove([decodeURIComponent(old)]); setF((x) => ({ ...x, photo_url: "" })); setChanged(true); }}>Remove photo</button>}
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">{rowId ? "Cropped square and saved as WebP (max 480px). Use only photos the person agreed to publish." : "Create the draft first, then add a photo."}</p>
          </Card>

          <Card title="Publishing & designation">
            {miss.length > 0 && <p className="mb-3 text-xs text-amber-700 dark:text-amber-300">Still needed: {miss.join(", ")}.</p>}
            {locked && rowId && <p className="mb-3 text-xs text-muted-foreground">Save your changes before using these actions.</p>}
            <div className="flex flex-col gap-2">
              {!rowId ? <p className="text-sm text-muted-foreground">Create the draft first.</p> : <>
                {f.status !== "archived" && (f.published
                  ? <Btn disabled={locked} onClick={() => void act("Unpublished", { published: false }, "Unpublish this profile? It leaves the directory, homepage and sitemap; the URL will return “not found”.")}>Unpublish</Btn>
                  : <Btn tone="primary" disabled={locked} onClick={() => void act("Published", { published: true }, `Publish ${f.display_name}'s profile? It appears at /interns/${f.slug}${f.noindex ? "" : " and in the sitemap"}.`)}>Publish</Btn>)}
                {f.status !== "archived" && <Btn disabled={locked} onClick={() => void act(f.homepage_featured ? "Removed from the homepage" : "Added to the homepage", { homepage_featured: !f.homepage_featured, ...(f.homepage_featured ? {} : { homepage_order: Math.max(0, ...rows.filter((r) => r.homepage_featured).map((r) => r.homepage_order).filter((n) => n < 100)) + 1 }) })}><Star className="h-4 w-4" aria-hidden="true" />{f.homepage_featured ? "Remove from homepage" : "Feature on homepage"}</Btn>}
                {f.designation === "intern" && f.status !== "archived" && <Btn disabled={locked} onClick={() => void act("Promoted to Team Member", { status: "promoted" }, `Promote ${f.display_name} from Intern to Team Member? Their badge changes everywhere. This is a profile designation only — it gives them no account, admin access or other permissions.`)}>Promote to Team Member</Btn>}
                {f.designation === "team_member" && f.status !== "archived" && <Btn disabled={locked} onClick={() => void act("Changed back to Intern", { status: "active" }, "Change this designation back to Intern?")}>Revert to Intern</Btn>}
                {f.status !== "completed" && f.status !== "archived" && <Btn disabled={locked} onClick={() => void act("Internship marked complete", { status: "completed", published: f.published && f.alumni_public, end_date: f.end_date ?? new Date().toISOString().slice(0, 10) }, "Mark the internship as completed? The badge becomes ALUMNI; the profile stays public only if you approve an alumni profile below.", "completion_reason")}>Mark internship completed</Btn>}
                {f.status === "archived"
                  ? <Btn disabled={locked} onClick={() => void act("Restored (not published — publish again when ready)", { status: restoreStatus(f) })}>Restore</Btn>
                  : <Btn tone="danger" disabled={locked} onClick={() => void act("Archived", { status: "archived" }, "Archive this profile? It's removed from every public listing and the homepage. The record is kept and can be restored.", "archive_reason")}>Archive</Btn>}
                <Btn tone="danger" disabled={!!busy} onClick={() => void del()}><Trash2 className="h-4 w-4" aria-hidden="true" />Delete permanently</Btn>
              </>}
            </div>
            <div className="mt-4 grid gap-2 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={f.alumni_public} onChange={(e) => set("alumni_public", e.target.checked)} />Approved alumni profile (keeps a completed internship public)</label>
              <label>Start date<input type="date" className={inp} value={f.start_date ?? ""} onChange={(e) => set("start_date", e.target.value || null)} /></label>
              <label>End date<input type="date" className={inp} value={f.end_date ?? ""} onChange={(e) => set("end_date", e.target.value || null)} /></label>
            </div>
          </Card>

          <Card title="Private record">
            <p className="mb-2 text-xs text-muted-foreground">Admins only. Never shown on the website, never sent to the AI.</p>
            <label className="text-sm font-medium">Personal email<input type="email" className={inp} value={priv.email} maxLength={254} onChange={(e) => { setPriv({ ...priv, email: e.target.value }); setDirty(true); }} /></label>
            <label className="mt-2 block text-sm font-medium">Internal notes<textarea className={`${inp} min-h-24`} value={priv.notes} maxLength={8000} onChange={(e) => { setPriv({ ...priv, notes: e.target.value }); setDirty(true); }} /></label>
            {(priv.completion_reason || priv.archive_reason) && <p className="mt-2 text-xs text-muted-foreground">{priv.completion_reason && <>Completion: {priv.completion_reason}<br /></>}{priv.archive_reason && <>Archive: {priv.archive_reason}</>}</p>}
            {f.source_ref && <p className="mt-2 text-[11px] text-muted-foreground">Imported as {f.source_ref}</p>}
          </Card>

          {rowId && <ActivityCard id={rowId} />}
        </div>
      </div>

      {preview && (
        <div role="dialog" aria-modal="true" aria-label="Profile preview" className="fixed inset-0 z-50 overflow-y-auto bg-background">
          <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-amber-100 px-4 py-2 text-sm text-amber-950">
            <strong>Preview</strong> — {f.published ? "this is how the page looks with your current edits." : "not published; the public can't see this page."} {dirty && "Includes unsaved changes."}
            <button type="button" className="ml-auto rounded-full border border-amber-900/30 px-3 py-1 font-semibold" onClick={() => setPreview(false)}>Close preview</button>
          </div>
          <InternProfileView i={previewData} preview />
        </div>
      )}
    </div>
  );
}

function ListField({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const [t, setT] = useState(value.join(", "));
  useEffect(() => { setT(value.join(", ")); }, [value.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
  return <label className="text-sm font-medium">{label} <span className="font-normal text-muted-foreground">(comma separated)</span><input className={inp} value={t} onChange={(e) => setT(e.target.value)} onBlur={() => onChange(split(t))} /></label>;
}
function LinesField({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const [t, setT] = useState(value.join("\n"));
  useEffect(() => { setT(value.join("\n")); }, [value.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
  return <label className="text-sm font-medium">{label}<textarea className={`${inp} min-h-20`} value={t} onChange={(e) => setT(e.target.value)} onBlur={() => onChange(t.split("\n").map((x) => x.trim()).filter(Boolean))} /></label>;
}
