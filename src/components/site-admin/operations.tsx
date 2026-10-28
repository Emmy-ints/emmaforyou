// @ts-nocheck -- generated DB types lag behind; runtime verified
import { useMemo, useState } from "react";
import { Download, ExternalLink, Play, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import { Btn, Card, check, db, downloadCsv, Empty, ErrorText, label, Loading, Pill, Stat, useLoad, when } from "@/components/agents-admin/shared";
import { FEATURES } from "@/lib/site-settings";
import { TRANSLATIONS } from "@/lib/i18n";
import { AI_LANGUAGES } from "@/lib/translate";
import { pageIndex } from "@/lib/page-index";
import { clean, PendingBar, SearchBox, SettingActions, useCan, useSettingRows, type Row } from "./settings";

/* ---------------------------------------------------------------- Enquiries */
const SOURCES: { id: string; name: string; summary: (r: Row) => string }[] = [
  { id: "leads", name: "Assessments & waitlist", summary: (r) => [r.source, r.business_type, r.goal, r.budget].filter(Boolean).join(" · ") },
  { id: "tool_requests", name: "Tool & form enquiries", summary: (r) => [r.tool, r.summary].filter(Boolean).join(" · ") },
  { id: "strategy_bookings", name: "Strategy calls", summary: (r) => [r.slot_start && new Date(r.slot_start).toLocaleString(), r.topic, r.status].filter(Boolean).join(" · ") },
  { id: "site_audits", name: "Website audit requests", summary: (r) => [r.url, r.score != null && `score ${r.score}`].filter(Boolean).join(" · ") },
  { id: "business_intakes", name: "Business intakes", summary: (r) => [r.business_name, r.business_type, r.goal ?? r.goals].filter(Boolean).join(" · ") },
  { id: "email_sequence_leads", name: "Email generator", summary: (r) => [r.business, r.sequence ?? r.kind].filter(Boolean).join(" · ") },
  { id: "publishing_enquiries", name: "Publishing enquiries", summary: (r) => [r.book_title && `“${r.book_title}”`, r.project_type, r.manuscript_status, (r.services ?? []).join(", "), r.launch_date && `launch ${r.launch_date}`, r.budget, r.details].filter(Boolean).join(" · ") },
];
const STATUSES = ["new", "contacted", "qualified", "won", "lost", "spam"];

export function EnquiriesTab() {
  const can = useCan();
  const data = useLoad<Row[]>(async () => {
    const all: Row[] = [];
    for (const s of SOURCES) {
      const r = await db.from(s.id).select("*").order("created_at", { ascending: false }).limit(300);
      if (r.error) continue; // a table this role can't read is skipped
      for (const x of r.data ?? []) all.push({ source: s.id, sourceName: s.name, ref: String(x.id ?? x.created_at), name: x.name ?? x.business_name ?? "", email: x.email ?? "", whatsapp: x.whatsapp ?? "", created_at: x.created_at, summary: s.summary(x).slice(0, 220) });
    }
    return all.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  });
  const st = useLoad<Row[]>(async () => check(await db.from("site_enquiry_status").select("*").limit(5000)));
  const smap = useMemo(() => new Map((st.data ?? []).map((x) => [`${x.source}:${x.ref}`, x])), [st.data]);
  const [q, setQ] = useState(""); const [src, setSrc] = useState("all"); const [fs, setFs] = useState("all"); const [err, setErr] = useState("");
  const rows = (data.data ?? []).filter((r) => (src === "all" || r.source === src) && (fs === "all" || (smap.get(`${r.source}:${r.ref}`)?.status ?? "new") === fs) && (!q || `${r.name} ${r.email} ${r.whatsapp} ${r.summary}`.toLowerCase().includes(q.toLowerCase())));
  async function setStatus(r: Row, status: string, note?: string) {
    setErr("");
    const { data: u } = await db.auth.getUser();
    const res = await db.from("site_enquiry_status").upsert({ source: r.source, ref: r.ref, status, note: note ?? smap.get(`${r.source}:${r.ref}`)?.note ?? null, updated_at: new Date().toISOString(), updated_by: u.user?.id });
    if (res.error) setErr(res.error.message); else st.reload();
  }
  const count = (s: string) => (data.data ?? []).filter((r) => (smap.get(`${r.source}:${r.ref}`)?.status ?? "new") === s).length;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Stat label="All enquiries" value={data.data?.length ?? "…"} /><Stat label="New" value={count("new")} warn={count("new") > 0} /><Stat label="Qualified" value={count("qualified")} /><Stat label="Won" value={count("won")} /></div>
      <Card title="Forms & enquiries" actions={<Btn small onClick={() => downloadCsv("enquiries", rows.map((r) => ({ received: r.created_at, source: r.sourceName, name: r.name, email: r.email, whatsapp: r.whatsapp, summary: r.summary, status: smap.get(`${r.source}:${r.ref}`)?.status ?? "new" })))}><Download className="h-3.5 w-3.5" aria-hidden="true" />CSV</Btn>}>
        <p className="mb-3 text-sm text-muted-foreground">Every form on the site in one inbox, newest first. Contact details are personal data: only roles with enquiry access can see them, and only admins change status.</p>
        <div className="flex flex-wrap gap-2">
          <div className="min-w-[200px] flex-1"><SearchBox value={q} onChange={setQ} placeholder="Search name, email, number or details" /></div>
          <select className="input mb-3 w-auto" value={src} onChange={(e) => setSrc(e.target.value)} aria-label="Form"><option value="all">All forms</option>{SOURCES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <select className="input mb-3 w-auto" value={fs} onChange={(e) => setFs(e.target.value)} aria-label="Status"><option value="all">Any status</option>{STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>
        </div>
        <ErrorText message={err || data.error} />
        {data.loading ? <Loading /> : !rows.length ? <Empty>No enquiries match.</Empty> : (
          <ul className="divide-y divide-border text-sm">{rows.slice(0, 200).map((r) => { const s = smap.get(`${r.source}:${r.ref}`); return (
            <li key={`${r.source}:${r.ref}`} className="flex flex-wrap items-start justify-between gap-2 py-2">
              <div className="min-w-0"><p className="font-medium">{r.name || "No name"} <span className="text-xs font-normal text-muted-foreground">· {r.sourceName} · {when(r.created_at)}</span></p>
                <p className="text-xs text-muted-foreground">{[r.email, r.whatsapp].filter(Boolean).join(" · ") || "No contact details"}</p>
                {r.summary && <p className="mt-0.5 text-xs">{r.summary}</p>}
                {s?.note && <p className="mt-0.5 text-xs italic text-muted-foreground">Note: {s.note}</p>}</div>
              <div className="flex items-center gap-1">
                {can("enquiries.manage") ? <select className="input h-8 w-auto text-xs" value={s?.status ?? "new"} onChange={(e) => setStatus(r, e.target.value)} aria-label="Status">{STATUSES.map((x) => <option key={x} value={x}>{label(x)}</option>)}</select> : <Pill>{label(s?.status ?? "new")}</Pill>}
                {can("enquiries.manage") && <Btn small onClick={() => { const n = window.prompt("Note", s?.note ?? ""); if (n !== null) setStatus(r, s?.status ?? "new", n.slice(0, 1000)); }}>Note</Btn>}
              </div>
            </li>); })}</ul>
        )}
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------- Translations */
const DICT_LANGS = ["fr", "es", "de", "en"] as const;
export function TranslationsTab() {
  const can = useCan();
  const stats = useLoad<Row[]>(async () => check(await db.rpc("site_translation_stats")));
  const [lang, setLang] = useState<string>(""); const [q, setQ] = useState(""); const [n, setN] = useState(0); const [err, setErr] = useState(""); const [msg, setMsg] = useState("");
  const found = useLoad<Row[]>(async () => check(await db.rpc("site_translation_search", { _lang: lang || null, _q: q.trim() || null, _limit: 60 })), [lang, q, n]);
  const rows = useSettingRows("i18n:");
  const [dl, setDl] = useState<(typeof DICT_LANGS)[number]>("fr"); const [dq, setDq] = useState("");
  const keys = Object.keys(TRANSLATIONS.en).filter((k) => !dq || `${k} ${TRANSLATIONS.en[k]} ${TRANSLATIONS[dl]?.[k] ?? ""}`.toLowerCase().includes(dq.toLowerCase()));
  const langName = (c: string) => AI_LANGUAGES.find((l) => l.code === c)?.name ?? c;
  async function edit(r: Row) { const t = window.prompt(`Edit the ${langName(r.lang)} translation`, r.translated); if (t === null) return; try { check(await db.rpc("site_translation_edit", { _hash: r.hash, _lang: r.lang, _text: t })); setN((x) => x + 1); } catch (e) { setErr(e.message); } }
  async function del(r: Row) { try { check(await db.rpc("site_translation_edit", { _hash: r.hash, _lang: r.lang, _text: null })); setN((x) => x + 1); } catch (e) { setErr(e.message); } }
  async function clear(l: string) { if (!window.confirm(`Delete all ${langName(l)} cached translations? Pages re-translate on the next visit (uses AI credits).`)) return; try { const c = check(await db.rpc("site_translation_clear", { _lang: l })); setMsg(`Removed ${c} ${langName(l)} entries.`); stats.reload(); setN((x) => x + 1); } catch (e) { setErr(e.message); } }
  return (
    <div className="space-y-4">
      <Card title="AI translation cache">
        <p className="mb-3 text-sm text-muted-foreground">Languages beyond English, French, Spanish and German are translated by the server's AI provider and cached here (shared by all visitors). Edit a wrong translation, delete one so it re-translates, or clear a language.</p>
        {stats.loading ? <Loading /> : !stats.data?.length ? <Empty>No AI translations cached yet.</Empty> : (
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{stats.data.map((s) => <div key={s.lang} className="rounded-xl border border-border p-2 text-sm"><p className="font-semibold">{langName(s.lang)}</p><p className="text-xs text-muted-foreground">{s.entries} strings · newest {when(s.newest)}</p>{can("translations.edit") && <button type="button" className="mt-1 text-xs text-red-600 underline" onClick={() => clear(s.lang)}>Clear</button>}</div>)}</div>
        )}
        <div className="flex flex-wrap gap-2"><select className="input mb-3 w-auto" value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language"><option value="">All languages</option>{AI_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}</select><div className="min-w-[200px] flex-1"><SearchBox value={q} onChange={setQ} placeholder="Search translated text" /></div></div>
        {msg && <p role="status" className="mb-2 text-sm text-emerald-700 dark:text-emerald-300">{msg}</p>}
        <ErrorText message={err || found.error || stats.error} />
        {found.loading ? <Loading /> : !found.data?.length ? <Empty>No matches.</Empty> : <ul className="divide-y divide-border text-sm">{found.data.map((r) => <li key={r.hash + r.lang} className="flex items-start justify-between gap-2 py-1.5"><span><Pill>{r.lang}</Pill> {r.translated}</span>{can("translations.edit") && <span className="flex shrink-0 gap-1"><Btn small onClick={() => edit(r)}>Edit</Btn><Btn small tone="danger" onClick={() => del(r)}><Trash2 className="h-3 w-3" aria-hidden="true" /></Btn></span>}</li>)}</ul>}
        <p className="mt-2 text-xs text-muted-foreground">The cache stores translations by a fingerprint of the English text, so the English original isn't shown here.</p>
      </Card>
      <Card title="Built-in interface text">
        <PendingBar rows={rows.data ?? []} onDone={rows.reload} scope="interface text" />
        <p className="mb-3 text-sm text-muted-foreground">The {Object.keys(TRANSLATIONS.en).length} phrases used for the menu and homepage in English, French, Spanish and German. Your edits override the built-in text once published.</p>
        <div className="flex flex-wrap gap-2"><select className="input mb-3 w-auto" value={dl} onChange={(e) => setDl(e.target.value as typeof dl)} aria-label="Language">{DICT_LANGS.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}</select><div className="min-w-[200px] flex-1"><SearchBox value={dq} onChange={setDq} placeholder="Search phrases" /></div></div>
        <ul className="divide-y divide-border text-sm">{keys.map((k) => <DictRow key={`${dl}-${k}`} lang={dl} k={k} row={rows.map.get(`i18n:${dl}:${k}`)} onDone={rows.reload} />)}</ul>
      </Card>
    </div>
  );
}
function DictRow({ lang, k, row, onDone }: { lang: string; k: string; row?: Row; onDone: () => void }) {
  const built = TRANSLATIONS[lang]?.[k] ?? "";
  const [text, setText] = useState((row?.draft ?? row?.published)?.text ?? "");
  return (
    <li className="grid gap-2 py-2 md:grid-cols-[1fr_1fr_auto]">
      <span className="text-xs"><code className="text-muted-foreground">{k}</code><br />EN: {TRANSLATIONS.en[k]}</span>
      <input className="input h-9 text-sm" maxLength={600} placeholder={built || "(uses English)"} value={text} onChange={(e) => setText(e.target.value)} aria-label={`${lang} text for ${k}`} />
      <SettingActions k={`i18n:${lang}:${k}`} row={row} value={text.trim() ? { text: text.trim() } : null} onDone={onDone} />
    </li>
  );
}

/* ---------------------------------------------------------------- Features & releases */
export function FeaturesTab() {
  const rows = useSettingRows("flag:");
  return (
    <Card title="Features & release status">
      <PendingBar rows={rows.data ?? []} onDone={rows.reload} scope="features" />
      <p className="mb-3 text-sm text-muted-foreground">Switch sections and features on or off for visitors, and record their release status. Turning something off hides it; it doesn't delete it.</p>
      <ul className="divide-y divide-border">{FEATURES.map((f) => <FeatureRow key={f.id} f={f} row={rows.map.get(`flag:${f.id}`)} onDone={rows.reload} />)}</ul>
    </Card>
  );
}
function FeatureRow({ f, row, onDone }: { f: (typeof FEATURES)[number]; row?: Row; onDone: () => void }) {
  const b = row?.draft ?? row?.published ?? {};
  const [on, setOn] = useState(typeof b.on === "boolean" ? b.on : f.default); const [status, setStatus] = useState(b.status ?? f.status); const [note, setNote] = useState(b.note ?? "");
  return (
    <li className="grid gap-2 py-2 md:grid-cols-[1fr_auto]">
      <div><p className="font-medium">{f.name} <span className="text-xs text-muted-foreground">· {f.where}</span></p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm"><label className="flex items-center gap-1"><input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} />On</label>
          <select className="input h-8 w-auto text-xs" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Release status"><option value="live">Live</option><option value="beta">Beta</option><option value="prototype">Prototype</option><option value="hidden">Hidden</option></select>
          <input className="input h-8 flex-1 text-xs" maxLength={300} placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Note" /></div></div>
      <SettingActions k={`flag:${f.id}`} row={row} value={on === f.default && status === f.status && !note.trim() ? null : clean({ on, status, note: note.trim() })} onDone={onDone} />
    </li>
  );
}

/* ---------------------------------------------------------------- Redirects */
export function RedirectsTab() {
  const can = useCan();
  const list = useLoad<Row[]>(async () => check(await db.from("site_redirects").select("*").order("from_path")));
  const routes = useMemo(() => new Set(pageIndex().map((p) => p.href)), []);
  const [from, setFrom] = useState(""); const [to, setTo] = useState(""); const [code, setCode] = useState(301); const [note, setNote] = useState(""); const [edit, setEdit] = useState<number | null>(null);
  const [check_, setCheck] = useState<string | null>(null); const [err, setErr] = useState(""); const [msg, setMsg] = useState("");
  const toKnown = routes.has(to.split(/[?#]/)[0]);
  const fromLive = routes.has(from.replace(/\/$/, ""));
  async function validate() { setCheck(null); const r = await db.rpc("site_redirect_check", { _id: edit, _from: from.trim().replace(/\/$/, "") || "/", _to: to.trim() }); setCheck(r.error ? r.error.message : r.data ?? "ok"); }
  async function save() {
    setErr(""); setMsg("");
    try { check(await db.rpc("site_redirect_save", { _id: edit, _from: from, _to: to, _code: code, _note: note || null })); setMsg("Saved as a draft. Publish it to make it work for visitors."); setFrom(""); setTo(""); setNote(""); setEdit(null); setCheck(null); list.reload(); }
    catch (e) { setErr(e.message); }
  }
  async function status(r: Row, s: string) { setErr(""); try { check(await db.rpc("site_redirect_set_status", { _id: r.id, _status: s })); list.reload(); } catch (e) { setErr(e.message); } }
  async function remove(r: Row) { if (!window.confirm(`Delete the redirect from ${r.from_path}?`)) return; try { check(await db.rpc("site_redirect_delete", { _id: r.id })); list.reload(); } catch (e) { setErr(e.message); } }
  return (
    <div className="space-y-4">
      <Card title={edit ? "Edit redirect" : "New redirect"}>
        <p className="mb-3 text-sm text-muted-foreground">Send an old or mistyped address to a page that exists. Redirects only apply to addresses that don't have their own page, so they can never hide a working page. The database refuses loops, duplicates, chains longer than 5 and protected paths (home, dashboard, sign-in, API).</p>
        <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
          <input className="input" placeholder="From: /old-page" value={from} onChange={(e) => { setFrom(e.target.value); setCheck(null); }} aria-label="From path" />
          <input className="input" placeholder="To: /services/website-design" value={to} onChange={(e) => { setTo(e.target.value); setCheck(null); }} aria-label="To path" list="redirect-routes" />
          <select className="input w-auto" value={code} onChange={(e) => setCode(Number(e.target.value))} aria-label="Type"><option value={301}>301 permanent</option><option value={302}>302 temporary</option></select>
        </div>
        <datalist id="redirect-routes">{[...routes].slice(0, 400).map((r) => <option key={r} value={r} />)}</datalist>
        <input className="input mt-2 w-full" maxLength={300} placeholder="Why (optional)" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Note" />
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          {to && (toKnown ? <Pill tone="good">Target is a known page</Pill> : <Pill tone="warn">Target isn't in the page index — check it exists</Pill>)}
          {from && fromLive && <Pill tone="warn">This address is a working page; the redirect won't apply while the page exists</Pill>}
          {check_ && (check_ === "ok" ? <Pill tone="good">Passes all checks</Pill> : <Pill tone="bad">{check_}</Pill>)}
        </div>
        <div className="mt-3 flex gap-2"><Btn onClick={validate} disabled={!from || !to}>Check</Btn><Btn tone="primary" onClick={save} disabled={!from || !to || !can("redirects.draft")}><Save className="h-4 w-4" aria-hidden="true" />Save draft</Btn>{edit && <Btn onClick={() => { setEdit(null); setFrom(""); setTo(""); }}>Cancel</Btn>}</div>
        {msg && <p role="status" className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">{msg}</p>}
        <div className="mt-2"><ErrorText message={err || list.error} /></div>
      </Card>
      <Card title={`Redirects (${list.data?.length ?? 0})`}>
        {list.loading ? <Loading /> : !list.data?.length ? <Empty>No redirects yet.</Empty> : (
          <ul className="divide-y divide-border text-sm">{list.data.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="min-w-0"><code>{r.from_path}</code> → <code>{r.to_path}</code> <span className="text-xs text-muted-foreground">{r.code} · {r.note ?? ""} · {when(r.updated_at)}</span></span>
              <span className="flex flex-wrap items-center gap-1"><Pill tone={r.status === "live" ? "good" : r.status === "draft" ? "warn" : "muted"}>{label(r.status)}</Pill>
                {r.status !== "live" && can("redirects.publish") && <Btn small tone="primary" onClick={() => status(r, "live")}>Publish</Btn>}
                {r.status === "live" && <Btn small onClick={() => status(r, "disabled")}>Disable</Btn>}
                {r.status === "live" && <a className="nav-ghost h-7 px-2 text-xs" href={r.from_path} target="_blank" rel="noopener noreferrer">Test <ExternalLink className="h-3 w-3" aria-hidden="true" /></a>}
                <Btn small onClick={() => { setEdit(r.id); setFrom(r.from_path); setTo(r.to_path); setCode(r.code); setNote(r.note ?? ""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</Btn>
                <Btn small tone="danger" onClick={() => remove(r)}><Trash2 className="h-3 w-3" aria-hidden="true" /></Btn></span>
            </li>))}</ul>
        )}
        <p className="mt-2 text-xs text-muted-foreground">How it works: the server answers a live redirect with a real HTTP 301 (or 302) before the page renders, so search engines see it too. It never applies to an address that has its own page; the "page not found" screen also checks redirects as a fallback.</p>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------- Backups & recovery */
export function BackupsTab() {
  const can = useCan();
  const list = useLoad<Row[]>(async () => check(await db.from("site_backups").select("id,created_at,note,scope,bytes,restored_at").order("id", { ascending: false }).limit(30)));
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [msg, setMsg] = useState(""); const [note, setNote] = useState("");
  async function create() { setBusy(true); setErr(""); try { const id = check(await db.rpc("site_backup_create", { _note: note || "Manual checkpoint" })); setMsg(`Checkpoint ${id} saved.`); setNote(""); list.reload(); } catch (e) { setErr(e.message); } finally { setBusy(false); } }
  async function download(id?: number) {
    setErr("");
    try {
      const snap = id ? check(await db.from("site_backups").select("snapshot").eq("id", id).single()).snapshot : check(await db.rpc("site_snapshot"));
      const blob = new Blob([JSON.stringify(snap, null, 2)], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `emmaforyou-site-config-${id ?? "now"}.json`; a.click(); URL.revokeObjectURL(a.href);
    } catch (e) { setErr(e.message); }
  }
  async function restore(id: number | null, snapshot?: Row) {
    if (!window.confirm("Restore into drafts? The current configuration is checkpointed first, and nothing goes live until you publish the drafts.")) return;
    setBusy(true); setErr("");
    try { const r = check(await db.rpc("site_backup_restore", { _id: id, _snapshot: snapshot ?? null })); setMsg(`Restored into drafts: ${r.settings} settings, ${r.redirects} redirects, ${r.lab} lab items, plus the design draft. Review and publish them in their tabs.`); list.reload(); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  }
  async function upload(f: File | undefined) { if (!f) return; try { const s = JSON.parse(await f.text()); await restore(null, s); } catch (e) { setErr(e instanceof SyntaxError ? "That file isn't valid JSON." : e.message); } }
  return (
    <div className="space-y-4">
      <Card title="What is and isn't backed up here">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li><strong>Covered:</strong> website configuration made in this control room — design tokens, every site setting (SEO, services, portfolio, claims, navigation, features, translations text), redirects and Innovation Lab items. Checkpoints are stored in your database and can be downloaded.</li>
          <li><strong>Also versioned:</strong> every published setting and design keeps its previous value with one-click undo; the code itself is versioned in GitHub (Emmy-ints/emmaforyou).</li>
          <li><strong>Not covered:</strong> business data (leads, bookings, community posts, accounts) and uploaded files. Database backups for those depend on your Lovable Cloud plan; this page can't see or verify them, so it makes no claim that they exist.</li>
        </ul>
      </Card>
      <Card title="Configuration checkpoints" actions={can("backup.create") && <div className="flex gap-2"><input className="input h-8 w-48 text-xs" placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Checkpoint note" /><Btn small tone="primary" onClick={create} disabled={busy}><Save className="h-3.5 w-3.5" aria-hidden="true" />Create checkpoint</Btn></div>}>
        {msg && <p role="status" className="mb-2 text-sm text-emerald-700 dark:text-emerald-300">{msg}</p>}
        <ErrorText message={err || list.error} />
        {list.loading ? <Loading /> : !list.data?.length ? <Empty>No checkpoints yet.</Empty> : (
          <ul className="divide-y divide-border text-sm">{list.data.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>#{b.id} · {when(b.created_at)} · {b.note} <span className="text-xs text-muted-foreground">· {b.scope?.join(", ")} · {(b.bytes / 1024).toFixed(1)} KB{b.restored_at ? ` · restored ${when(b.restored_at)}` : ""}</span></span>
              <span className="flex gap-1"><Btn small onClick={() => download(b.id)}><Download className="h-3 w-3" aria-hidden="true" />Download</Btn>{can("backup.restore") && <Btn small onClick={() => restore(b.id)} disabled={busy}><RotateCcw className="h-3 w-3" aria-hidden="true" />Restore to drafts</Btn>}</span>
            </li>))}</ul>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Btn small onClick={() => download()}><Download className="h-3.5 w-3.5" aria-hidden="true" />Download current configuration</Btn>
          {can("backup.restore") && <label className="nav-ghost h-7 cursor-pointer px-2 text-xs"><Upload className="h-3 w-3" aria-hidden="true" />Restore from file<input type="file" accept="application/json" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} /></label>}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">To restore: pick a checkpoint → Restore to drafts → review the drafts in Content, Design lab, Redirects and Innovation Lab → publish. A restore always checkpoints the current state first, so it can itself be undone.</p>
      </Card>
    </div>
  );
}
