import { useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, Info, Loader2, Upload, XCircle } from "lucide-react";
import { type CoverFacts, type ListingFacts, type ManuscriptFacts, type Check, runChecks, inspectEpub, inspectPdf } from "@/lib/books/readiness";
import { track } from "@/lib/analytics";
import { Field, Notice, Panel, SaveBar, ServiceCta, inputCls, report, useAccountGate, useBookState } from "./shared";

interface State { manuscript: ManuscriptFacts | null; cover: CoverFacts | null; listing: ListingFacts; keywordText: string }
const initial = (): State => ({ manuscript: null, cover: null, listing: { title: "", subtitle: "", author: "", description: "", keywords: [], categories: 0, isbn: "", format: "ebook", pages: null }, keywordText: "" });
const ICON = { pass: CheckCircle2, fix: XCircle, warn: CircleAlert, info: Info };
const TONE = { pass: "text-emerald-600 dark:text-emerald-400", fix: "text-red-600 dark:text-red-400", warn: "text-amber-600 dark:text-amber-400", info: "text-muted-foreground" };

export default function ReadinessChecker() {
  const s = useBookState<State>("readiness-checker", "readiness", initial);
  const { state, setState } = s;
  const gate = useAccountGate("readiness-checker");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const listing = { ...state.listing, keywords: state.keywordText.split(/\n|;/).map((k) => k.trim()).filter(Boolean) };
  const checks = useMemo(() => runChecks(state.manuscript, state.cover, listing), [state.manuscript, state.cover, state.listing, state.keywordText]); // eslint-disable-line react-hooks/exhaustive-deps
  const setL = (k: keyof ListingFacts, v: unknown) => setState((x) => ({ ...x, listing: { ...x.listing, [k]: v } }));

  async function onManuscript(f: File | undefined) {
    if (!f) return; setErr("");
    if (f.size > 60 * 1048576) { setErr("Files up to 60 MB."); return; }
    setBusy("Inspecting your file…");
    const t0 = performance.now();
    try {
      const bytes = new Uint8Array(await f.arrayBuffer());
      const name = f.name.toLowerCase();
      let facts: ManuscriptFacts;
      if (name.endsWith(".docx")) {
        const [{ importDocx }, { wordCount, chapterWords }] = await Promise.all([import("@/lib/books/import-docx"), import("@/lib/books/manuscript")]);
        const r = await importDocx(bytes);
        const styled = !r.notes.some((n) => /No Heading 1/.test(n));
        const imgNote = r.notes.find((n) => /image/.test(n));
        facts = { name: f.name, kind: "docx", bytes: f.size, words: wordCount(r.chapters), chapters: r.chapters.length, emptyChapters: r.chapters.filter((c) => !chapterWords(c).length).length, headingsStyled: styled, images: imgNote ? Number(imgNote.match(/^\d+/)?.[0] ?? 1) : 0, notes: r.notes.filter((n) => !/image|No Heading 1/.test(n)) };
        if (r.title && !state.listing.title) setL("title", r.title);
      } else if (name.endsWith(".epub")) {
        const e = await inspectEpub(bytes);
        facts = { name: f.name, kind: "epub", bytes: f.size, words: 0, chapters: e.spineItems, emptyChapters: 0, headingsStyled: null, images: 0, notes: [], epub: e };
        if (e.title && !state.listing.title) setL("title", e.title);
        if (e.author && !state.listing.author) setL("author", e.author);
      } else if (name.endsWith(".pdf")) {
        const p = inspectPdf(bytes);
        facts = { name: f.name, kind: "pdf", bytes: f.size, words: 0, chapters: 0, emptyChapters: 0, headingsStyled: null, images: 0, notes: [], pdf: p };
        if (p.pages && state.listing.pages == null) setL("pages", p.pages);
      } else if (/\.(txt|md)$/.test(name)) {
        const { parseText, wordCount, chapterWords } = await import("@/lib/books/manuscript");
        const r = parseText(new TextDecoder().decode(bytes));
        facts = { name: f.name, kind: "text", bytes: f.size, words: wordCount(r.chapters), chapters: r.chapters.length, emptyChapters: r.chapters.filter((c) => !chapterWords(c).length).length, headingsStyled: null, images: 0, notes: r.report.notes };
      } else throw new Error("Upload a .docx, .epub, .pdf, .txt or .md file.");
      setState((x) => ({ ...x, manuscript: facts }));
      report("readiness-checker", `inspect_${facts.kind}`, true, t0);
      track("book_preview_generated", { tool: "readiness-checker" });
    } catch (e) { setErr(`That file couldn't be inspected: ${(e as Error).message}`); report("readiness-checker", "inspect", false, t0, (e as Error).message); }
    finally { setBusy(""); }
  }
  function onCover(f: File | undefined) {
    if (!f) return; setErr("");
    const url = URL.createObjectURL(f);
    const im = new Image();
    im.onload = () => { setState((x) => ({ ...x, cover: { name: f.name, type: f.type, bytes: f.size, width: im.naturalWidth, height: im.naturalHeight } })); URL.revokeObjectURL(url); };
    im.onerror = () => { setErr("That cover image couldn't be read (TIFF files can't be previewed in browsers; check a JPEG copy)."); URL.revokeObjectURL(url); };
    im.src = url;
  }

  const groups = { checked: checks.filter((c) => c.how === "checked"), platform: checks.filter((c) => c.how === "platform"), person: checks.filter((c) => c.how === "person") };
  const fixes = groups.checked.filter((c) => c.status === "fix").length;
  if (!s.loaded) return <div className="py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" aria-label="Loading" /></div>;
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="1. Files">
          <div className="space-y-3">
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-border p-4 hover:border-[var(--hue)]"><Upload className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><span><span className="block text-sm font-medium">{state.manuscript ? `Manuscript: ${state.manuscript.name}` : "Manuscript or book file"}</span><span className="text-xs text-muted-foreground">.docx, .epub, .pdf, .txt — inspected in your browser, not uploaded</span></span><input type="file" accept=".docx,.epub,.pdf,.txt,.md" className="sr-only" onChange={(e) => { void onManuscript(e.target.files?.[0]); e.target.value = ""; }} /></label>
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-border p-4 hover:border-[var(--hue)]"><Upload className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><span><span className="block text-sm font-medium">{state.cover ? `Cover: ${state.cover.name} (${state.cover.width} × ${state.cover.height})` : "eBook cover image"}</span><span className="text-xs text-muted-foreground">JPEG or PNG</span></span><input type="file" accept="image/jpeg,image/png,image/tiff" className="sr-only" onChange={(e) => { onCover(e.target.files?.[0]); e.target.value = ""; }} /></label>
          </div>
          {busy && <p role="status" className="mt-3 inline-flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{busy}</p>}
          {err && <div className="mt-3"><Notice tone="error">{err}</Notice></div>}
        </Panel>
        <Panel title="2. Listing details">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title"><input className={inputCls} value={state.listing.title} onChange={(e) => setL("title", e.target.value)} /></Field>
            <Field label="Subtitle"><input className={inputCls} value={state.listing.subtitle} onChange={(e) => setL("subtitle", e.target.value)} /></Field>
            <Field label="Author"><input className={inputCls} value={state.listing.author} onChange={(e) => setL("author", e.target.value)} /></Field>
            <Field label="ISBN (optional)"><input className={inputCls} value={state.listing.isbn} onChange={(e) => setL("isbn", e.target.value)} /></Field>
            <Field label="Format"><select className={inputCls} value={state.listing.format} onChange={(e) => setL("format", e.target.value)}><option value="ebook">eBook</option><option value="paperback">Paperback</option><option value="both">Both</option></select></Field>
            <Field label="Paperback pages"><input type="number" min={0} className={inputCls} value={state.listing.pages ?? ""} onChange={(e) => setL("pages", e.target.value ? Number(e.target.value) : null)} /></Field>
            <Field label="Categories chosen"><input type="number" min={0} max={10} className={inputCls} value={state.listing.categories} onChange={(e) => setL("categories", Number(e.target.value) || 0)} /></Field>
          </div>
          <Field label="Description"><textarea className={inputCls} rows={4} value={state.listing.description} onChange={(e) => setL("description", e.target.value)} /></Field>
          <Field label="Keywords (one per line)"><textarea className={inputCls} rows={3} value={state.keywordText} onChange={(e) => setState((x) => ({ ...x, keywordText: e.target.value }))} /></Field>
        </Panel>
      </div>

      <Panel title={`3. Results · ${fixes ? `${fixes} to fix` : "nothing to fix in what we checked"}`}>
        <Group title="Checked by this tool" sub="Measured from your file and details." items={groups.checked} />
        <Group title="Needs the publishing platform" sub="Only the store's upload and previewer can confirm these." items={groups.platform} />
        <Group title="Needs a person" sub="Judgement or rights we can't verify." items={groups.person} />
        <div className="mt-5 border-t border-border pt-4"><SaveBar kind="readiness" title={state.listing.title || "Readiness check"} data={state} meta={{ fixes, checks: checks.length }} projectId={s.projectId} setProjectId={s.setProjectId} gateRequire={gate.require} /></div>
      </Panel>
      <ServiceCta service="ebook-publishing" title="Want us to get it upload-ready?" body="We fix the files, cover and listing, check everything in the store previewers and walk you through publishing from your own account." cta="Get publishing support" />
      {gate.gate}
    </div>
  );
}

function Group({ title, sub, items }: { title: string; sub: string; items: Check[] }) {
  if (!items.length) return null;
  return (
    <section className="mt-4 first:mt-0">
      <h3 className="font-display font-semibold">{title}</h3><p className="text-xs text-muted-foreground">{sub}</p>
      <ul className="mt-2 divide-y divide-border">{items.map((c) => { const I = ICON[c.status]; return (
        <li key={c.id} className="flex gap-3 py-2.5"><I className={`mt-0.5 h-4 w-4 shrink-0 ${TONE[c.status]}`} aria-hidden="true" /><div><p className="text-sm font-medium">{c.label} <span className="sr-only">({c.status === "fix" ? "needs fixing" : c.status})</span><span className="ml-1 text-xs font-normal text-muted-foreground">· {c.area}</span></p><p className="text-sm text-muted-foreground">{c.detail}</p></div></li>
      ); })}</ul>
    </section>
  );
}
