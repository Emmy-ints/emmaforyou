// @ts-nocheck -- generated DB types lag behind; runtime verified
import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, ExternalLink, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Btn, Card, check, db, Empty, ErrorText, Loading, Pill, useLoad, when } from "@/components/agents-admin/shared";
import { pageIndex, type PageKind } from "@/lib/page-index";
import { catalog, FAMILIES } from "@/lib/service-catalog";
import { PROJECTS, featuredFor, projectSlug } from "@/lib/portfolio-data";
import { CLAIMS } from "@/lib/claims";
import { TOOLS } from "@/components/home/ToolsHub";
import { NAV_MENUS } from "@/components/Navbar";
import { clean, CodeNote, Field, PendingBar, SearchBox, SettingActions, useCan, useSettingRows, type Row, type SettingRow } from "./settings";

const SUBS = [["pages", "Pages & SEO"], ["services", "Services"], ["portfolio", "Portfolio"], ["media", "Media"], ["tools", "Tools & demos"], ["nav", "Navigation & links"], ["claims", "Claims & numbers"]] as const;
type Sub = (typeof SUBS)[number][0];

export default function ContentTab() {
  const [sub, setSub] = useState<Sub>("pages");
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1" role="tablist" aria-label="Content sections">
        {SUBS.map(([id, l]) => <button key={id} type="button" role="tab" aria-selected={sub === id} onClick={() => setSub(id)} className={`rounded-full border px-3 py-1 text-xs font-medium ${sub === id ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground"}`}>{l}</button>)}
      </div>
      {sub === "pages" && <PagesSeo />}
      {sub === "services" && <ServicesMgr />}
      {sub === "portfolio" && <PortfolioMgr />}
      {sub === "media" && <MediaMgr />}
      {sub === "tools" && <ToolsMgr />}
      {sub === "nav" && <NavMgr />}
      {sub === "claims" && <ClaimsMgr />}
    </div>
  );
}

/* ---------------------------------------------------------------- Pages & SEO */
function PagesSeo() {
  const all = useMemo(() => pageIndex().filter((p) => p.href.startsWith("/")), []);
  const rows = useSettingRows("seo:");
  const [q, setQ] = useState(""); const [kind, setKind] = useState("all"); const [open, setOpen] = useState<string | null>(null); const [onlyOver, setOnlyOver] = useState(false);
  const kinds = [...new Set(all.map((p) => p.kind))] as PageKind[];
  const shown = all.filter((p) => (kind === "all" || p.kind === kind) && (!onlyOver || rows.map.has(`seo:${p.href}`)) && (!q || `${p.title} ${p.href}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <Card title={`Pages & SEO (${all.length} public pages)`}>
      <PendingBar rows={rows.data ?? []} onDone={rows.reload} scope="SEO" />
      <p className="mb-3 text-sm text-muted-foreground">Every public route from the site's page index. Open a page to see its live title and description and set an override. Published overrides are rendered into the server HTML that search engines read (within about a minute), and noindex pages leave the sitemap.</p>
      <div className="flex flex-wrap gap-2">
        <div className="min-w-[220px] flex-1"><SearchBox value={q} onChange={setQ} placeholder="Search pages by title or address" /></div>
        <select className="input mb-3 w-auto" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Page type"><option value="all">All types</option>{kinds.map((k) => <option key={k}>{k}</option>)}</select>
        <label className="mb-3 flex items-center gap-1.5 text-sm"><input type="checkbox" checked={onlyOver} onChange={(e) => setOnlyOver(e.target.checked)} />Only overridden</label>
      </div>
      <ErrorText message={rows.error} onRetry={rows.reload} />
      <p className="mb-2 text-xs text-muted-foreground">{shown.length} pages</p>
      <ul className="divide-y divide-border">
        {shown.slice(0, 150).map((p) => {
          const k = `seo:${p.href}`; const r = rows.map.get(k);
          return (
            <li key={p.href} className="py-2">
              <button type="button" className="flex w-full flex-wrap items-center justify-between gap-2 text-left" aria-expanded={open === p.href} onClick={() => setOpen(open === p.href ? null : p.href)}>
                <span className="min-w-0"><span className="font-medium">{p.title}</span> <span className="font-mono text-xs text-muted-foreground">{p.href}</span></span>
                <span className="flex items-center gap-1.5"><Pill>{p.kind}</Pill>{r && <Pill tone={r.draft && JSON.stringify(r.draft) !== JSON.stringify(r.published) ? "warn" : "good"}>Override</Pill>}</span>
              </button>
              {open === p.href && <SeoEditor path={p.href} k={k} row={r} onDone={rows.reload} />}
            </li>
          );
        })}
      </ul>
      {shown.length > 150 && <p className="mt-2 text-xs text-muted-foreground">Showing the first 150; narrow the search to see more.</p>}
    </Card>
  );
}

function SeoEditor({ path, k, row, onDone }: { path: string; k: string; row?: SettingRow; onDone: () => void }) {
  const base = row?.draft ?? row?.published ?? {};
  const [title, setTitle] = useState(base.title ?? ""); const [desc, setDesc] = useState(base.description ?? ""); const [noindex, setNoindex] = useState(!!base.noindex);
  const [live, setLive] = useState<{ title: string; description: string; h1: number } | null>(null); const [err, setErr] = useState("");
  useEffect(() => {
    let on = true;
    fetch(path, { headers: { Accept: "text/html" }, credentials: "omit" }).then((r) => r.text()).then((h) => {
      const d = new DOMParser().parseFromString(h, "text/html");
      if (on) setLive({ title: d.title, description: d.querySelector('meta[name="description"]')?.getAttribute("content") ?? "", h1: d.querySelectorAll("h1").length });
    }).catch(() => on && setErr("Couldn't load the live page."));
    return () => { on = false; };
  }, [path]);
  const value = clean({ title: title.trim(), description: desc.trim(), noindex: noindex || undefined });
  return (
    <div className="mt-2 grid gap-3 rounded-xl border border-border p-3 md:grid-cols-2">
      <div className="text-xs">
        <p className="font-semibold text-muted-foreground">Live (server HTML)</p>
        {err ? <p className="text-red-600">{err}</p> : !live ? <p>Loading…</p> : <>
          <p className="mt-1"><span className="text-muted-foreground">Title ({live.title.length}):</span> {live.title || <em>empty</em>}</p>
          <p className="mt-1"><span className="text-muted-foreground">Description ({live.description.length}):</span> {live.description || <em>empty</em>}</p>
          <p className="mt-1"><span className="text-muted-foreground">Main headings:</span> {live.h1}</p>
        </>}
        <a href={path} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[var(--emma-violet)]">Open page <ExternalLink className="h-3 w-3" aria-hidden="true" /></a>
      </div>
      <div className="space-y-2">
        <Field label={`Title override (${title.length}/70)`} hint="35–60 characters reads best in search results."><input className="input w-full" maxLength={70} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label={`Description override (${desc.length}/170)`}><textarea className="input min-h-[70px] w-full" maxLength={170} value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={noindex} onChange={(e) => setNoindex(e.target.checked)} />Hide from search engines (noindex)</label>
        <SettingActions k={k} row={row} value={value} onDone={onDone} />
        {(title || desc) && <CodeNote>After publishing, re-open this page here: the "Live (server HTML)" column should show your override within about a minute.</CodeNote>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Services */
function ServicesMgr() {
  const items = useMemo(() => catalog(), []);
  const rows = useSettingRows("service:");
  const [q, setQ] = useState(""); const [open, setOpen] = useState<string | null>(null);
  const shown = items.filter((i) => !q || `${i.name} ${i.short} ${i.href}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Card title={`Services (${items.length})`}>
      <PendingBar rows={rows.data ?? []} onDone={rows.reload} scope="services" />
      <p className="mb-3 text-sm text-muted-foreground">The catalogue behind the homepage cards, the service map, the solution finder and search. Hide, rename, reorder or feature an entry; its page itself is unchanged. Adding a brand-new service needs a new page in the code.</p>
      <SearchBox value={q} onChange={setQ} placeholder="Search services" />
      <ErrorText message={rows.error} />
      <ul className="divide-y divide-border">{shown.map((i) => {
        const k = `service:${i.id}`; const r = rows.map.get(k); const fam = FAMILIES.find((f) => f.id === i.family);
        return (
          <li key={i.id} className="py-2">
            <button type="button" className="flex w-full items-center justify-between gap-2 text-left" aria-expanded={open === i.id} onClick={() => setOpen(open === i.id ? null : i.id)}>
              <span><span aria-hidden="true">{i.icon}</span> <span className="font-medium">{i.name}</span> <span className="text-xs text-muted-foreground">{fam?.name} · {i.kind}</span></span>
              {r && <Pill tone={(r.draft ?? r.published)?.hidden ? "warn" : "good"}>{(r.draft ?? r.published)?.hidden ? "Hidden" : "Edited"}</Pill>}
            </button>
            {open === i.id && <ServiceEditor item={i} k={k} row={r} onDone={rows.reload} />}
          </li>);
      })}</ul>
    </Card>
  );
}
function ServiceEditor({ item, k, row, onDone }: { item: Row; k: string; row?: SettingRow; onDone: () => void }) {
  const b = row?.draft ?? row?.published ?? {};
  const [hidden, setHidden] = useState(!!b.hidden); const [featured, setFeatured] = useState(!!b.featured); const [order, setOrder] = useState<string>(b.order != null ? String(b.order) : "");
  const [name, setName] = useState(b.name ?? ""); const [short, setShort] = useState(b.short ?? "");
  const value = clean({ hidden: hidden || undefined, featured: featured || undefined, order: order === "" ? undefined : Math.max(0, Math.min(999, parseInt(order, 10))), name: name.trim(), short: short.trim() });
  return (
    <div className="mt-2 grid gap-3 rounded-xl border border-border p-3 md:grid-cols-2">
      <div className="space-y-2 text-sm">
        <p className="text-xs text-muted-foreground">As built: <strong>{item.name}</strong> — {item.short}</p>
        <a href={item.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[var(--emma-violet)]">{item.href} <ExternalLink className="h-3 w-3" aria-hidden="true" /></a>
        <label className="flex items-center gap-2"><input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />Hide from the catalogue, map and finder</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />Featured</label>
        <Field label="Order (0 = first)"><input className="input w-28" inputMode="numeric" value={order} onChange={(e) => setOrder(e.target.value.replace(/\D/g, ""))} /></Field>
      </div>
      <div className="space-y-2">
        <Field label="Display name"><input className="input w-full" maxLength={80} placeholder={item.name} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Short description"><textarea className="input min-h-[60px] w-full" maxLength={200} placeholder={item.short} value={short} onChange={(e) => setShort(e.target.value)} /></Field>
        <SettingActions k={k} row={row} value={value} onDone={onDone} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Portfolio */
function PortfolioMgr() {
  const rows = useSettingRows("project:");
  const media = useMedia();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Card title={`Portfolio projects (${PROJECTS.length})`}>
      <PendingBar rows={rows.data ?? []} onDone={rows.reload} scope="portfolio" />
      <p className="mb-3 text-sm text-muted-foreground">Client names, descriptions and results stay exactly as recorded in the code. Here you can hide or reorder a project and replace its stand-in stock photo with the client's real screenshot (upload it under Media first). Case-study text is edited in the owner dashboard's case study editor.</p>
      <ul className="divide-y divide-border">{PROJECTS.map((p) => {
        const slug = projectSlug(p.name); const k = `project:${slug}`; const r = rows.map.get(k); const v = r?.draft ?? r?.published;
        const own = !!featuredFor(p.name);
        return (
          <li key={slug} className="py-2">
            <button type="button" className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={open === slug} onClick={() => setOpen(open === slug ? null : slug)}>
              <span className="flex min-w-0 items-center gap-3"><img src={v?.img || featuredFor(p.name)?.img || p.img} alt="" className="h-10 w-16 shrink-0 rounded-md bg-muted object-cover" loading="lazy" /><span className="truncate font-medium">{p.name}</span> <span className="text-xs text-muted-foreground">{p.category}</span></span>
              <span className="flex gap-1">{own ? <Pill tone="good">Own photo</Pill> : v?.img && v?.screenshot ? <Pill tone="good">Real screenshot</Pill> : <Pill tone="warn">Stock stand-in</Pill>}{v?.hidden && <Pill tone="warn">Hidden</Pill>}</span>
            </button>
            {open === slug && <ProjectEditor slug={slug} k={k} row={r} media={media.files} onDone={rows.reload} />}
          </li>);
      })}</ul>
    </Card>
  );
}
function ProjectEditor({ slug, k, row, media, onDone }: { slug: string; k: string; row?: SettingRow; media: { name: string; url: string }[]; onDone: () => void }) {
  const b = row?.draft ?? row?.published ?? {};
  const [hidden, setHidden] = useState(!!b.hidden); const [order, setOrder] = useState(b.order != null ? String(b.order) : ""); const [img, setImg] = useState(b.img ?? ""); const [shot, setShot] = useState(!!b.screenshot);
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => { if (!img) { setOk(null); return; } const i = new Image(); i.onload = () => setOk(i.naturalWidth > 0); i.onerror = () => setOk(false); i.src = img; }, [img]);
  const value = clean({ hidden: hidden || undefined, order: order === "" ? undefined : Math.min(999, parseInt(order, 10)), img: img.trim(), screenshot: img && shot ? true : undefined });
  return (
    <div className="mt-2 grid gap-3 rounded-xl border border-border p-3 md:grid-cols-2">
      <div className="space-y-2 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />Hide from portfolio listings (owner decision; the case page stays)</label>
        <Field label="Order (0 = first)"><input className="input w-28" inputMode="numeric" value={order} onChange={(e) => setOrder(e.target.value.replace(/\D/g, ""))} /></Field>
        <a href={`/portfolio/${slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[var(--emma-violet)]">Open case page <ExternalLink className="h-3 w-3" aria-hidden="true" /></a>
      </div>
      <div className="space-y-2">
        <Field label="Replacement image" hint="Pick an uploaded file or paste an https:// address or /path.">
          <select className="input mb-1 w-full" value={media.some((m) => m.url === img) ? img : ""} onChange={(e) => setImg(e.target.value)}><option value="">Choose from the media library…</option>{media.map((m) => <option key={m.url} value={m.url}>{m.name}</option>)}</select>
          <input className="input w-full" value={img} onChange={(e) => setImg(e.target.value)} placeholder="https://…" />
        </Field>
        {img && <div className="flex items-center gap-2"><img src={img} alt="" className="h-16 w-24 rounded-md bg-muted object-cover" />{ok === false ? <Pill tone="bad">Doesn't load</Pill> : ok ? <Pill tone="good">Loads</Pill> : <Pill>Checking…</Pill>}</div>}
        {img && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={shot} onChange={(e) => setShot(e.target.checked)} />This is the client's real screenshot (removes the "illustrative" label)</label>}
        <SettingActions k={k} row={row} value={value} onDone={onDone} disabled={!!img && (ok === false || !shot)} />
        {img && !shot && <p className="text-xs text-amber-700 dark:text-amber-300">Stand-in photos may only be replaced with the client's own screenshots. Tick the box to confirm.</p>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Media */
function useMedia() {
  const [n, setN] = useState(0);
  const q = useLoad(async () => {
    const r = await supabase.storage.from("site-media").list("", { limit: 500, sortBy: { column: "created_at", order: "desc" } });
    if (r.error) throw new Error(r.error.message);
    return (r.data ?? []).filter((f) => f.name && !f.name.endsWith("/")).map((f) => ({ name: f.name, size: f.metadata?.size ?? 0, at: f.created_at, url: supabase.storage.from("site-media").getPublicUrl(f.name).data.publicUrl }));
  }, [n]);
  return { files: q.data ?? [], loading: q.loading, error: q.error, reload: () => setN((x) => x + 1) };
}
function MediaMgr() {
  const can = useCan(); const m = useMedia(); const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [msg, setMsg] = useState(""); const [q, setQ] = useState("");
  const code = useMemo(() => [{ name: "Founder photo", url: "/images/emmanuel.webp" }, ...PROJECTS.map((p) => ({ name: `${p.name} (${featuredFor(p.name) ? "own asset" : "stock stand-in"})`, url: featuredFor(p.name)?.img ?? p.img }))], []);
  const [status, setStatus] = useState<Record<string, boolean>>({});
  useEffect(() => { code.forEach((c) => { const i = new Image(); i.onload = () => setStatus((s) => ({ ...s, [c.url]: i.naturalWidth > 0 })); i.onerror = () => setStatus((s) => ({ ...s, [c.url]: false })); i.src = c.url; }); }, [code]);
  async function upload(files: FileList | null) {
    if (!files?.length) return; setBusy(true); setErr(""); setMsg("");
    try {
      for (const f of Array.from(files)) {
        if (f.size > 5 * 1024 * 1024) throw new Error(`${f.name} is over 5 MB.`);
        if (!/^image\/(webp|png|jpeg|avif|svg\+xml)$/.test(f.type)) throw new Error(`${f.name}: only WebP, PNG, JPEG, AVIF or SVG.`);
        const safe = `${Date.now().toString(36)}-${f.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").slice(-60)}`;
        const r = await supabase.storage.from("site-media").upload(safe, f, { contentType: f.type, upsert: false });
        if (r.error) throw new Error(r.error.message);
      }
      setMsg(`Uploaded ${files.length} file${files.length > 1 ? "s" : ""}.`); m.reload();
    } catch (e) { setErr(e instanceof Error ? e.message : "Upload failed."); } finally { setBusy(false); if (input.current) input.current.value = ""; }
  }
  async function remove(name: string) {
    if (!window.confirm(`Delete ${name}? Anything still using its address will show a fallback.`)) return;
    const r = await supabase.storage.from("site-media").remove([name]); if (r.error) setErr(r.error.message); else m.reload();
  }
  const shown = m.files.filter((f) => !q || f.name.includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <Card title="Media library" actions={can("media.upload") && <><input ref={input} type="file" accept="image/webp,image/png,image/jpeg,image/avif,image/svg+xml" multiple className="sr-only" id="media-up" onChange={(e) => upload(e.target.files)} /><label htmlFor="media-up" className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background"><Upload className="h-3.5 w-3.5" aria-hidden="true" />{busy ? "Uploading…" : "Upload images"}</label></>}>
        <p className="mb-3 text-sm text-muted-foreground">Images stored in your site's public media bucket (max 5 MB each). Use them for project screenshots under Portfolio.</p>
        <SearchBox value={q} onChange={setQ} placeholder="Search files" />
        {msg && <p role="status" className="mb-2 text-sm text-emerald-700 dark:text-emerald-300">{msg}</p>}
        <ErrorText message={err || m.error} />
        {m.loading ? <Loading /> : !shown.length ? <Empty>No uploaded images yet.</Empty> : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">{shown.map((f) => (
            <li key={f.name} className="rounded-xl border border-border p-2 text-xs">
              <img src={f.url} alt="" className="h-24 w-full rounded-md bg-muted object-cover" loading="lazy" />
              <p className="mt-1 truncate font-medium" title={f.name}>{f.name}</p>
              <p className="text-muted-foreground">{Math.round(f.size / 1024)} KB · {when(f.at)}</p>
              <div className="mt-1 flex gap-1"><Btn small onClick={() => navigator.clipboard.writeText(f.url)}><Copy className="h-3 w-3" aria-hidden="true" />Copy URL</Btn>{can("content.publish") && <Btn small tone="danger" onClick={() => remove(f.name)}>Delete</Btn>}</div>
            </li>))}</ul>
        )}
      </Card>
      <Card title="Images built into the code">
        <ul className="divide-y divide-border text-sm">{code.map((c) => <li key={c.url + c.name} className="flex items-center justify-between gap-2 py-1.5"><span className="flex min-w-0 items-center gap-2"><img src={c.url} alt="" className="h-8 w-12 shrink-0 rounded bg-muted object-cover" loading="lazy" /><span className="truncate">{c.name}</span></span>{status[c.url] === undefined ? <Pill>Checking</Pill> : status[c.url] ? <Pill tone="good">Loads</Pill> : <Pill tone="bad">Broken</Pill>}</li>)}</ul>
        <p className="mt-2 text-xs text-muted-foreground">Replacing a built-in image file itself is a code change; project photos can be swapped from Portfolio without one.</p>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------- Tools & demos */
function ToolsMgr() {
  const rows = useSettingRows("tool:");
  const tools = TOOLS.filter((t) => "to" in t.href);
  return (
    <Card title={`Free tools & demos (${tools.length})`}>
      <PendingBar rows={rows.data ?? []} onDone={rows.reload} scope="tools" />
      <p className="mb-3 text-sm text-muted-foreground">Hide a tool from the homepage tools hub or mark it Beta / Prototype there. The tool page itself stays reachable by its address. AI tools depend on the AI provider (see AI & integrations).</p>
      <ul className="divide-y divide-border">{tools.map((t) => <ToolRow key={t.href.to} t={t} row={rows.map.get(`tool:${t.href.to}`)} onDone={rows.reload} />)}</ul>
    </Card>
  );
}
function ToolRow({ t, row, onDone }: { t: Row; row?: SettingRow; onDone: () => void }) {
  const b = row?.draft ?? row?.published ?? {};
  const [hidden, setHidden] = useState(!!b.hidden); const [status, setStatus] = useState(b.status ?? "live");
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
      <span className="min-w-0"><span className="font-medium">{t.name}</span> <a href={t.href.to} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-muted-foreground underline">{t.href.to}</a></span>
      <span className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1"><input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />Hide</label>
        <select className="input h-8 w-auto text-xs" value={status} onChange={(e) => setStatus(e.target.value)} aria-label={`${t.name} status`}><option value="live">Live</option><option value="beta">Beta</option><option value="prototype">Prototype</option></select>
        <SettingActions k={`tool:${t.href.to}`} row={row} value={clean({ hidden: hidden || undefined, status: status === "live" ? undefined : status })} onDone={onDone} />
      </span>
    </li>
  );
}

/* ---------------------------------------------------------------- Navigation & links */
function NavMgr() {
  const rows = useSettingRows();
  const navRows = (rows.data ?? []).filter((r) => r.key.startsWith("nav:") || r.key === "announce");
  const report = useLoad<Row | null>(async () => check(await db.from("site_audit_reports").select("created_at,findings").order("created_at", { ascending: false }).limit(1).maybeSingle()));
  const broken = (report.data?.findings ?? []).filter((f: Row) => f.type === "link");
  const a = rows.map.get("announce"); const ab = a?.draft ?? a?.published ?? {};
  const [on, setOn] = useState(!!ab.on); const [text, setText] = useState(ab.text ?? ""); const [href, setHref] = useState(ab.href ?? "");
  useEffect(() => { setOn(!!ab.on); setText(ab.text ?? ""); setHref(ab.href ?? ""); }, [a?.draft, a?.published]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="space-y-4">
      <PendingBar rows={navRows} onDone={rows.reload} scope="navigation" />
      <Card title="Announcement bar">
        <div className="grid gap-2 md:grid-cols-[auto_1fr_1fr]">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} />Show</label>
          <input className="input" maxLength={140} placeholder="e.g. New: free AI website audit" value={text} onChange={(e) => setText(e.target.value)} aria-label="Announcement text" />
          <input className="input" placeholder="/website-audit or https://…" value={href} onChange={(e) => setHref(e.target.value)} aria-label="Announcement link" />
        </div>
        <div className="mt-2"><SettingActions k="announce" row={a} value={clean({ on: on || undefined, text: text.trim(), href: href.trim() })} onDone={rows.reload} /></div>
      </Card>
      <Card title="Menu entries">
        <p className="mb-3 text-sm text-muted-foreground">Hide entries from the Resources, Tools and Company menus (desktop and mobile). Solutions and Services menus follow the service catalogue. Adding a new menu entry is a code change.</p>
        {Object.entries(NAV_MENUS).map(([menu, items]) => (
          <div key={menu} className="mb-3"><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{menu}</p>
            <ul className="divide-y divide-border">{items.map((i) => <NavRow key={i.to} item={i} row={rows.map.get(`nav:${i.to}`)} onDone={rows.reload} />)}</ul></div>
        ))}
      </Card>
      <Card title="Broken internal links (last audit)">
        {report.loading ? <Loading /> : !report.data ? <Empty>Run an audit first.</Empty> : !broken.length ? <p className="text-sm text-emerald-700 dark:text-emerald-300">No broken internal links in the audit from {when(report.data.created_at)}.</p> : (
          <ul className="divide-y divide-border text-sm">{broken.map((f: Row) => <li key={f.key} className="py-1.5">{f.title} <span className="text-muted-foreground">on {f.route}</span> — fix it with a redirect under Audit & repair or Redirects.</li>)}</ul>
        )}
      </Card>
    </div>
  );
}
function NavRow({ item, row, onDone }: { item: { to: string; name: string }; row?: SettingRow; onDone: () => void }) {
  const [hidden, setHidden] = useState(!!(row?.draft ?? row?.published)?.hidden);
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-sm">
      <span>{item.name} <span className="font-mono text-xs text-muted-foreground">{item.to}</span></span>
      <span className="flex items-center gap-2"><label className="flex items-center gap-1"><input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />Hide</label>
        <SettingActions k={`nav:${item.to}`} row={row} value={clean({ hidden: hidden || undefined })} onDone={onDone} /></span>
    </li>
  );
}

/* ---------------------------------------------------------------- Claims & numbers */
function ClaimsMgr() {
  const rows = useSettingRows();
  const claimRows = (rows.data ?? []).filter((r) => r.key.startsWith("claim:") || r.key === "countdown");
  const c = rows.map.get("countdown"); const cb = c?.draft ?? c?.published ?? {};
  const [on, setOn] = useState(cb.on !== false); const [spots, setSpots] = useState(String(cb.spots ?? 20)); const [taken, setTaken] = useState(String(cb.taken ?? 12));
  useEffect(() => { setOn(cb.on !== false); setSpots(String(cb.spots ?? 20)); setTaken(String(cb.taken ?? 12)); }, [c?.draft, c?.published]); // eslint-disable-line react-hooks/exhaustive-deps
  const s = parseInt(spots, 10) || 1; const t = Math.min(s, parseInt(taken, 10) || 0);
  return (
    <div className="space-y-4">
      <PendingBar rows={claimRows} onDone={rows.reload} scope="claims" />
      <Card title="Claims register">
        <p className="mb-3 text-sm text-muted-foreground">Every number, partnership, credential and testimonial the site states without a data source in the code. Nothing has been removed. Record what each one really is and choose how visitors see it: as built, with a small "Unverified" / "Sample" / "Verified" label, or hidden.</p>
        <ul className="space-y-3">{CLAIMS.map((cl) => <ClaimRow key={cl.id} claim={cl} row={rows.map.get(`claim:${cl.id}`)} onDone={rows.reload} />)}</ul>
      </Card>
      <Card title="Monthly onboarding countdown">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} />Show the countdown</label>
          <Field label="Spots this month"><input className="input w-24" inputMode="numeric" value={spots} onChange={(e) => setSpots(e.target.value.replace(/\D/g, ""))} /></Field>
          <Field label="Spots taken"><input className="input w-24" inputMode="numeric" value={taken} onChange={(e) => setTaken(e.target.value.replace(/\D/g, ""))} /></Field>
          <p className="text-sm">Visitors see: <strong>{s - t} spots left</strong> ({t} of {s} taken)</p>
        </div>
        <div className="mt-2"><SettingActions k="countdown" row={c} value={on ? { spots: s, taken: t } : { on: false, spots: s, taken: t }} onDone={rows.reload} /></div>
        <p className="mt-2 text-xs text-muted-foreground">Until you save real figures the code default (12 of 20) shows. Update it each month so the urgency stays truthful.</p>
      </Card>
    </div>
  );
}
function ClaimRow({ claim, row, onDone }: { claim: (typeof CLAIMS)[number]; row?: SettingRow; onDone: () => void }) {
  const b = row?.draft ?? row?.published ?? {};
  const [status, setStatus] = useState(b.status ?? "unverified"); const [display, setDisplay] = useState(b.display ?? "show"); const [evidence, setEvidence] = useState(b.evidence ?? "");
  return (
    <li className="rounded-xl border border-border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0"><p className="font-medium">{claim.text}</p><p className="text-xs text-muted-foreground">{claim.where} · <code>{claim.file}</code> · {claim.kind}</p><p className="mt-1 text-xs">{claim.note}</p></div>
      </div>
      <div className="mt-2 grid gap-2 md:grid-cols-[auto_auto_1fr]">
        <select className="input h-9 w-auto text-sm" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="unverified">Unverified</option><option value="verified">Verified (I have evidence)</option><option value="sample">Sample / illustrative</option></select>
        <select className="input h-9 w-auto text-sm" value={display} onChange={(e) => setDisplay(e.target.value)} aria-label="Visitors see"><option value="show">Show as built</option><option value="label">Show with label</option><option value="hide">Hide</option></select>
        <input className="input h-9 text-sm" maxLength={500} placeholder={status === "verified" ? "Evidence (link, document, account ID)…" : "Notes"} value={evidence} onChange={(e) => setEvidence(e.target.value)} aria-label="Evidence" />
      </div>
      {status === "verified" && !evidence.trim() && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Add the evidence you're relying on before marking it verified.</p>}
      <div className="mt-2"><SettingActions k={`claim:${claim.id}`} row={row} value={status === "unverified" && display === "show" && !evidence.trim() ? null : clean({ status, display, evidence: evidence.trim() })} onDone={onDone} disabled={status === "verified" && !evidence.trim()} /></div>
    </li>
  );
}
