import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, FileText, Loader2, Merge, Plus, Scissors, Trash2, Upload } from "lucide-react";
import {
  type Book, type BookMeta, type BookSettings, type Chapter, DEFAULT_SETTINGS, LIMITS, PAGE_SIZES, chapterFromMd, chapterToMd, chapterWords,
  mergeWithNext, moveChapter, newMeta, parseText, runsText, safeFileName, splitChapter, uuid, validateBook, wordCount, blockText,
} from "@/lib/books/manuscript";
import { track } from "@/lib/analytics";
import { Field, GhostBtn, Notice, Panel, PrimaryBtn, SaveBar, ServiceCta, downloadBytes, inputCls, report, useAccountGate, useBookState } from "./shared";
import PagePreview from "./PagePreview";
import type { Layout } from "@/lib/books/layout";

interface State { meta: BookMeta; chapters: Chapter[]; settings: BookSettings; source: string; notes: string[]; cover: string | null }
const initial = (): State => ({ meta: newMeta(), chapters: [], settings: { ...DEFAULT_SETTINGS }, source: "", notes: [], cover: null });

const LANGS: [string, string][] = [["en", "English"], ["en-GB", "English (UK)"], ["en-US", "English (US)"], ["fr", "French"], ["es", "Spanish"], ["de", "German"], ["pt", "Portuguese"], ["yo", "Yorùbá"], ["ig", "Igbo"], ["ha", "Hausa"], ["pcm", "Nigerian Pidgin"], ["sw", "Swahili"]];

export default function EbookCreator() {
  const s = useBookState<State>("ebook-creator", "book", initial);
  const { state, setState } = s;
  const gate = useAccountGate("ebook-creator");
  const [tab, setTab] = useState<"paste" | "upload">("paste");
  const [busy, setBusy] = useState<string>("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [splitAt, setSplitAt] = useState<{ id: string; at: number; title: string } | null>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [page, setPage] = useState(0);
  const [previewErr, setPreviewErr] = useState("");
  const [view, setView] = useState<"pages" | "reader">("pages");
  const [readerCh, setReaderCh] = useState(0);
  const [pw, setPw] = useState(360);

  const book: Book = useMemo(() => ({ meta: state.meta, chapters: state.chapters, settings: state.settings }), [state.meta, state.chapters, state.settings]);
  const issues = useMemo(() => validateBook(book), [book]);
  const errors = issues.filter((i) => i.level === "error");
  const words = useMemo(() => wordCount(state.chapters), [state.chapters]);

  const setMeta = (k: keyof BookMeta, v: string) => setState((x) => ({ ...x, meta: { ...x.meta, [k]: v } }));
  const setSet = <K extends keyof BookSettings>(k: K, v: BookSettings[K]) => setState((x) => ({ ...x, settings: { ...x.settings, [k]: v } }));
  const setChapters = (fn: (c: Chapter[]) => Chapter[]) => setState((x) => ({ ...x, chapters: fn(x.chapters) }));

  useEffect(() => { const f = () => setPw(Math.min(420, Math.max(240, window.innerWidth - 72))); f(); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);

  // ---- import
  function importText(text: string, from: string) {
    setErr(""); setOk("");
    if (!text.trim()) { setErr("Paste some text first."); return; }
    if (text.length > LIMITS.maxChars) { setErr(`That's ${text.length.toLocaleString()} characters. The limit is ${LIMITS.maxChars.toLocaleString()} (about 250,000 words). Split very long books into volumes or ask us to format it.`); return; }
    const { chapters, report: r } = parseText(text);
    setState((x) => ({ ...x, chapters, source: from, notes: r.notes }));
    setOk(`Imported ${r.words.toLocaleString()} words into ${r.chapters} chapter${r.chapters === 1 ? "" : "s"}. Nothing was rewritten.`);
  }
  async function onFile(f: File | undefined) {
    if (!f) return;
    setErr(""); setOk("");
    if (f.size > LIMITS.maxUploadBytes) { setErr(`That file is ${(f.size / 1048576).toFixed(1)} MB. The limit is 15 MB.`); return; }
    const name = f.name.toLowerCase();
    const t0 = performance.now();
    setBusy("Reading your file…");
    try {
      if (name.endsWith(".docx")) {
        const { importDocx } = await import("@/lib/books/import-docx");
        const r = await importDocx(new Uint8Array(await f.arrayBuffer()));
        const n = wordCount(r.chapters);
        if (n === 0) throw new Error("No text was found in this document.");
        setState((x) => ({ ...x, chapters: r.chapters, source: f.name, notes: r.notes, meta: { ...x.meta, title: x.meta.title || r.title || "", author: x.meta.author } }));
        setOk(`Imported ${n.toLocaleString()} words in ${r.chapters.length} chapter${r.chapters.length === 1 ? "" : "s"} from ${f.name}. Your text wasn't changed.`);
        report("ebook-creator", "import_docx", true, t0);
      } else if (/\.(txt|md|markdown|text)$/.test(name)) {
        const text = await f.text();
        importText(text, f.name);
        report("ebook-creator", "import_text", true, t0);
      } else if (name.endsWith(".doc")) throw new Error("Old Word .doc files can't be read here. In Word choose File → Save As → Word Document (.docx), then upload that.");
      else if (name.endsWith(".pdf")) throw new Error("PDFs can't be converted reliably (their text order isn't stored). Upload the original Word document, or copy the text and paste it.");
      else if (name.endsWith(".pages") || name.endsWith(".odt")) throw new Error("Export it as .docx first (Pages: File → Export To → Word; LibreOffice: Save As → Word), then upload that.");
      else throw new Error("Upload a .docx, .txt or .md file.");
    } catch (e) {
      setErr((e as Error).message);
      report("ebook-creator", "import", false, t0, (e as Error).message);
    } finally { setBusy(""); }
  }

  // ---- preview
  useEffect(() => {
    if (!state.chapters.length) { setLayout(null); return; }
    let cancelled = false;
    const t = window.setTimeout(async () => {
      try {
        const [{ loadCanvasFonts, loadPdfFonts }, { layoutBook }] = await Promise.all([import("@/lib/books/fonts"), import("@/lib/books/layout")]);
        const [fonts] = await Promise.all([loadPdfFonts(), loadCanvasFonts()]);
        if (cancelled) return;
        const L = layoutBook(book, fonts, { cover: !!state.cover && !PAGE_SIZES[book.settings.pageSize].print });
        setLayout(L); setPreviewErr("");
        setPage((p) => Math.min(p, L.pages.length - 1));
        track("book_preview_generated", { tool: "ebook-creator", pages: L.pages.length });
      } catch (e) { if (!cancelled) setPreviewErr(`The page preview couldn't be drawn: ${(e as Error).message}`); }
    }, 700);
    return () => { cancelled = true; window.clearTimeout(t); };
  }, [book, state.cover]);

  // ---- export
  async function exportAs(fmt: "pdf" | "epub" | "docx") {
    setErr(""); setOk("");
    if (errors.length) { setErr(`Fix these first: ${errors.map((e) => e.message).join(" ")}`); return; }
    const t0 = performance.now();
    track("book_export_attempted", { tool: "ebook-creator", format: fmt });
    setBusy(`Building your ${fmt.toUpperCase()}…`);
    try {
      const coverBytes = state.cover ? dataUrlBytes(state.cover) : null;
      let bytes: Uint8Array; let mime: string; let extra = "";
      if (fmt === "pdf") {
        const [{ exportPdf, jpegSize }, { loadPdfFonts }] = await Promise.all([import("@/lib/books/export-pdf"), import("@/lib/books/fonts")]);
        const fonts = await loadPdfFonts();
        const usesCover = coverBytes && coverBytes.type === "image/jpeg" && !PAGE_SIZES[book.settings.pageSize].print;
        const dims = usesCover ? jpegSize(coverBytes.bytes) : null;
        const r = await exportPdf(book, fonts, dims && usesCover ? { cover: { jpeg: coverBytes.bytes, ...dims } } : {});
        bytes = r.bytes; mime = "application/pdf";
        extra = ` ${r.pages} pages.${r.missing.length ? ` ${r.missing.length} character${r.missing.length > 1 ? "s" : ""} aren't in the book font and were replaced: ${r.missing.slice(0, 8).join(" ")}.` : ""}`;
      } else if (fmt === "epub") {
        const { exportEpub } = await import("@/lib/books/export-epub");
        bytes = await exportEpub(book, coverBytes ? { cover: coverBytes as { bytes: Uint8Array; type: "image/jpeg" | "image/png" } } : {});
        mime = "application/epub+zip";
      } else {
        const { exportDocx } = await import("@/lib/books/export-docx");
        bytes = await exportDocx(book);
        mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      }
      const file = safeFileName(book.meta.title, fmt);
      downloadBytes(bytes, file, mime);
      setOk(`Downloaded ${file} (${(bytes.length / 1024).toFixed(0)} KB).${extra}`);
      track("book_export_completed", { tool: "ebook-creator", format: fmt });
      report("ebook-creator", `export_${fmt}`, true, t0);
      setState((x) => ({ ...x, notes: x.notes }));
    } catch (e) {
      setErr(`The ${fmt.toUpperCase()} couldn't be built: ${(e as Error).message}. Your manuscript is unchanged; try again, or send it to us and we'll format it.`);
      track("book_export_failed", { tool: "ebook-creator", format: fmt });
      report("ebook-creator", `export_${fmt}`, false, t0, (e as Error).message);
    } finally { setBusy(""); }
  }

  function onCover(f: File | undefined) {
    if (!f) return;
    if (!/^image\/(jpeg|png)$/.test(f.type)) { setErr("Use a JPEG or PNG cover image."); return; }
    if (f.size > 5 * 1048576) { setErr("Cover images up to 5 MB here. Export a smaller JPEG (KDP's ideal is 1,600 × 2,560 px)."); return; }
    const r = new FileReader();
    r.onload = () => setState((x) => ({ ...x, cover: String(r.result) }));
    r.readAsDataURL(f);
  }

  const meta = { words, chapters: state.chapters.length, pages: layout?.pages.length ?? null, pageSize: state.settings.pageSize, author: state.meta.author };

  if (!s.loaded) return <div className="py-16 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" aria-hidden="true" /><span className="sr-only">Loading</span></div>;

  return (
    <div className="space-y-6">
      {s.loadError && <Notice tone="error">{s.loadError}</Notice>}
      <ol className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-4" aria-label="Steps">
        {["1 · Book details", "2 · Manuscript", "3 · Chapters & contents", "4 · Layout, preview & export"].map((x) => <li key={x} className="rounded-full border border-border px-3 py-1.5 text-center">{x}</li>)}
      </ol>

      <Panel title="1. Book details">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title *"><input className={inputCls} value={state.meta.title} maxLength={200} onChange={(e) => setMeta("title", e.target.value)} /></Field>
          <Field label="Subtitle"><input className={inputCls} value={state.meta.subtitle ?? ""} maxLength={200} onChange={(e) => setMeta("subtitle", e.target.value)} /></Field>
          <Field label="Author name *" hint="As it should appear on the book."><input className={inputCls} value={state.meta.author} maxLength={120} onChange={(e) => setMeta("author", e.target.value)} /></Field>
          <Field label="Language"><select className={inputCls} value={state.meta.language} onChange={(e) => setMeta("language", e.target.value)}>{LANGS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
          <Field label="Short description (optional)" hint="Stored in the file's metadata. Write your store description with the Marketing Assistant."><textarea className={inputCls} rows={2} maxLength={1000} value={state.meta.description ?? ""} onChange={(e) => setMeta("description", e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Publisher / imprint"><input className={inputCls} value={state.meta.publisher ?? ""} maxLength={120} onChange={(e) => setMeta("publisher", e.target.value)} /></Field>
            <Field label="ISBN (optional)" hint="Leave blank if you don't have one."><input className={inputCls} value={state.meta.isbn ?? ""} maxLength={20} inputMode="numeric" onChange={(e) => setMeta("isbn", e.target.value)} /></Field>
            <Field label="Copyright year"><input className={inputCls} value={state.meta.year ?? ""} maxLength={4} inputMode="numeric" placeholder={String(new Date().getFullYear())} onChange={(e) => setMeta("year", e.target.value.replace(/\D/g, ""))} /></Field>
            <Field label="Dedication (optional)"><input className={inputCls} value={state.meta.dedication ?? ""} maxLength={300} onChange={(e) => setMeta("dedication", e.target.value)} /></Field>
          </div>
        </div>
      </Panel>

      <Panel title="2. Manuscript">
        <div role="tablist" aria-label="How to add your manuscript" className="mb-4 inline-flex rounded-full border border-border p-1">
          {(["paste", "upload"] as const).map((t) => <button key={t} role="tab" aria-selected={tab === t} type="button" onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-sm ${tab === t ? "bg-foreground text-background" : ""}`}>{t === "paste" ? "Paste text" : "Upload a file"}</button>)}
        </div>
        {tab === "paste" ? (
          <PasteBox onImport={(t) => importText(t, "pasted text")} hasChapters={state.chapters.length > 0} />
        ) : (
          <div>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border px-6 py-10 text-center hover:border-[var(--hue)]">
              <Upload className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
              <span className="font-medium">Choose a .docx, .txt or .md file</span>
              <span className="text-xs text-muted-foreground">Up to 15 MB. Read in your browser — not uploaded to a public link. Headings (Heading 1 = chapter), bold, italic and lists are kept.</span>
              <input type="file" accept=".docx,.txt,.md,.markdown,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
          </div>
        )}
        {busy && <p role="status" className="mt-3 inline-flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{busy}</p>}
        {err && <div className="mt-3"><Notice tone="error">{err}</Notice></div>}
        {ok && <div className="mt-3"><Notice tone="ok">{ok}</Notice></div>}
        {state.notes.length > 0 && <div className="mt-3"><Notice tone="warn"><ul className="list-disc space-y-1 pl-4">{state.notes.map((n) => <li key={n}>{n}</li>)}</ul></Notice></div>}
      </Panel>

      {state.chapters.length > 0 && (
        <Panel title={`3. Chapters & contents · ${state.chapters.length} chapters · ${words.toLocaleString()} words`} actions={<GhostBtn onClick={() => setChapters((c) => [...c, { id: uuid(), title: `Chapter ${c.length + 1}`, blocks: [] }])}><Plus className="h-4 w-4" aria-hidden="true" />Add chapter</GhostBtn>}>
          <p className="mb-3 text-sm text-muted-foreground">These titles are your table of contents. Rename, reorder, split or merge chapters; edits never change other text.</p>
          <ol className="space-y-2">
            {state.chapters.map((c, i) => (
              <li key={c.id} className="rounded-2xl border border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-7 text-right text-xs tabular-nums text-muted-foreground">{i + 1}.</span>
                  <input aria-label={`Chapter ${i + 1} title`} className={`${inputCls} mt-0 min-w-[180px] flex-1`} value={c.title} maxLength={160} onChange={(e) => setChapters((cs) => cs.map((x) => (x.id === c.id ? { ...x, title: e.target.value } : x)))} />
                  <span className="text-xs text-muted-foreground">{chapterWords(c).length.toLocaleString()} words</span>
                  <div className="flex gap-1">
                    <IconBtn label="Move up" disabled={i === 0} onClick={() => setChapters((cs) => moveChapter(cs, i, -1))}><ArrowUp className="h-4 w-4" /></IconBtn>
                    <IconBtn label="Move down" disabled={i === state.chapters.length - 1} onClick={() => setChapters((cs) => moveChapter(cs, i, 1))}><ArrowDown className="h-4 w-4" /></IconBtn>
                    <IconBtn label="Edit text" onClick={() => { setEditing(c.id); setEditText(chapterToMd(c)); }}><FileText className="h-4 w-4" /></IconBtn>
                    <IconBtn label="Split chapter" disabled={c.blocks.length < 2} onClick={() => setSplitAt({ id: c.id, at: 1, title: `Chapter ${i + 2}` })}><Scissors className="h-4 w-4" /></IconBtn>
                    <IconBtn label="Merge with next chapter" disabled={i === state.chapters.length - 1} onClick={() => setChapters((cs) => mergeWithNext(cs, i))}><Merge className="h-4 w-4" /></IconBtn>
                    <IconBtn label="Delete chapter" onClick={() => { if (!chapterWords(c).length || window.confirm(`Delete “${c.title}” and its ${chapterWords(c).length.toLocaleString()} words? This can't be undone.`)) setChapters((cs) => cs.filter((x) => x.id !== c.id)); }}><Trash2 className="h-4 w-4" /></IconBtn>
                  </div>
                </div>
                {splitAt?.id === c.id && (
                  <div className="mt-3 grid gap-2 rounded-xl bg-muted/40 p-3 sm:grid-cols-[1fr_1fr_auto]">
                    <Field label="New chapter starts at"><select className={inputCls} value={splitAt.at} onChange={(e) => setSplitAt({ ...splitAt, at: Number(e.target.value) })}>{c.blocks.map((b, bi) => bi > 0 && <option key={bi} value={bi}>¶{bi + 1}: {(blockText(b) || "* * *").slice(0, 60)}</option>)}</select></Field>
                    <Field label="New chapter title"><input className={inputCls} value={splitAt.title} onChange={(e) => setSplitAt({ ...splitAt, title: e.target.value })} /></Field>
                    <div className="flex items-end gap-2"><PrimaryBtn onClick={() => { setChapters((cs) => splitChapter(cs, i, splitAt.at, splitAt.title || "Untitled")); setSplitAt(null); }}>Split</PrimaryBtn><GhostBtn onClick={() => setSplitAt(null)}>Cancel</GhostBtn></div>
                  </div>
                )}
                {editing === c.id && (
                  <div className="mt-3">
                    <label className="text-xs text-muted-foreground" htmlFor={`ed-${c.id}`}>Chapter text. **bold**, *italic*, “## ” sub-heading, “{">"} ” quote, “- ” list, “* * *” scene break.</label>
                    <textarea id={`ed-${c.id}`} className={`${inputCls} font-mono`} rows={12} value={editText} onChange={(e) => setEditText(e.target.value)} />
                    <div className="mt-2 flex gap-2"><PrimaryBtn onClick={() => { setChapters((cs) => cs.map((x) => (x.id === c.id ? chapterFromMd(x, editText) : x))); setEditing(null); }}>Apply</PrimaryBtn><GhostBtn onClick={() => setEditing(null)}>Cancel</GhostBtn></div>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </Panel>
      )}

      {state.chapters.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Panel title="4. Layout">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Page size"><select className={inputCls} value={state.settings.pageSize} onChange={(e) => setSet("pageSize", e.target.value as BookSettings["pageSize"])}>{Object.entries(PAGE_SIZES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></Field>
              <Field label={`Text size · ${state.settings.fontSize} pt`}><input type="range" min={9} max={14} step={0.5} className="mt-3 w-full" value={state.settings.fontSize} onChange={(e) => setSet("fontSize", Number(e.target.value))} /></Field>
              <Field label={`Line spacing · ${state.settings.lineHeight.toFixed(2)}`}><input type="range" min={1.2} max={1.8} step={0.05} className="mt-3 w-full" value={state.settings.lineHeight} onChange={(e) => setSet("lineHeight", Number(e.target.value))} /></Field>
              <div className="space-y-2 text-sm">
                <Check label="Justified text" v={state.settings.justify} on={(v) => setSet("justify", v)} />
                <Check label="Each chapter on a new page" v={state.settings.chapterNewPage} on={(v) => setSet("chapterNewPage", v)} />
                <Check label="Contents page" v={state.settings.includeToc} on={(v) => setSet("includeToc", v)} />
                <Check label="Copyright page" v={state.settings.includeCopyright} on={(v) => setSet("includeCopyright", v)} />
                <Check label="Mirrored print margins" v={state.settings.mirrorMargins} on={(v) => setSet("mirrorMargins", v)} disabled={!PAGE_SIZES[state.settings.pageSize].print} />
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {PAGE_SIZES[state.settings.pageSize].print
                ? `Print sizes use an inside margin of at least KDP's minimum for the page count (${layout ? `${(layout.margins.inner / 72).toFixed(3)} in for ${layout.pages.length} pages` : "worked out from the final page count"}) and 0.5 in outside, with the fonts embedded. EPUB files reflow, so readers choose their own text size.`
                : "Screen sizes use 1 in margins and can include your cover as the first page."}
            </p>
            <div className="mt-5 border-t border-border pt-4">
              <p className="text-sm font-medium">Cover image (optional)</p>
              <p className="text-xs text-muted-foreground">Added to the EPUB, and as page 1 of A4/Letter PDFs (JPEG). Make one with the Cover Designer.</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {state.cover && <img src={state.cover} alt="Cover preview" className="h-20 rounded shadow" />}
                <label className="nav-ghost h-auto cursor-pointer px-4 py-2 text-sm">{state.cover ? "Replace" : "Add cover"}<input type="file" accept="image/jpeg,image/png" className="sr-only" onChange={(e) => { onCover(e.target.files?.[0]); e.target.value = ""; }} /></label>
                {state.cover && <GhostBtn onClick={() => setState((x) => ({ ...x, cover: null }))}>Remove</GhostBtn>}
              </div>
            </div>
          </Panel>

          <Panel title="Preview" actions={
            <div role="tablist" aria-label="Preview type" className="inline-flex rounded-full border border-border p-1 text-xs">
              <button role="tab" aria-selected={view === "pages"} type="button" onClick={() => setView("pages")} className={`rounded-full px-3 py-1 ${view === "pages" ? "bg-foreground text-background" : ""}`}>PDF pages</button>
              <button role="tab" aria-selected={view === "reader"} type="button" onClick={() => setView("reader")} className={`rounded-full px-3 py-1 ${view === "reader" ? "bg-foreground text-background" : ""}`}>eBook reader</button>
            </div>}>
            {view === "pages" ? (
              previewErr ? <Notice tone="error">{previewErr}</Notice> : !layout ? <p className="py-16 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" aria-hidden="true" />Laying out pages…</p> : (
                <div>
                  <PagePreview layout={layout} index={page} cover={state.cover} width={pw} />
                  <div className="mt-3 flex items-center justify-center gap-3 text-sm">
                    <GhostBtn aria-label="Previous page" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}><ChevronLeft className="h-4 w-4" /></GhostBtn>
                    <span className="tabular-nums">Page {page + 1} of {layout.pages.length}</span>
                    <GhostBtn aria-label="Next page" disabled={page >= layout.pages.length - 1} onClick={() => setPage((p) => Math.min(layout.pages.length - 1, p + 1))}><ChevronRight className="h-4 w-4" /></GhostBtn>
                  </div>
                  <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                    {layout.chapterStarts.slice(0, 30).map((c, k) => <button key={k} type="button" className="tsh-chip !py-1 !text-xs" onClick={() => setPage(c.page)}>{c.title.slice(0, 24) || `Chapter ${k + 1}`}</button>)}
                  </div>
                </div>
              )
            ) : (
              <div>
                <select aria-label="Chapter" className={inputCls} value={readerCh} onChange={(e) => setReaderCh(Number(e.target.value))}>{state.chapters.map((c, i) => <option key={c.id} value={i}>{c.title}</option>)}</select>
                <ReaderView chapter={state.chapters[Math.min(readerCh, state.chapters.length - 1)]} />
              </div>
            )}
          </Panel>
        </div>
      )}

      {state.chapters.length > 0 && (
        <Panel title="Export">
          {issues.length > 0 && <div className="mb-4 space-y-2">{issues.map((i) => <Notice key={i.message} tone={i.level === "error" ? "error" : "warn"}>{i.message}</Notice>)}</div>}
          <div className="flex flex-wrap gap-3">
            {(["pdf", "epub", "docx"] as const).map((f) => (
              <PrimaryBtn key={f} disabled={!!busy || errors.length > 0} onClick={() => gate.require(`Sign in to download your ${f.toUpperCase()}`, () => void exportAs(f))} data-track={`book_export_${f}`}>
                <Download className="h-4 w-4" aria-hidden="true" />{f === "pdf" ? "PDF" : f === "epub" ? "EPUB" : "Word (.docx)"}
              </PrimaryBtn>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Files are built in your browser from your text: PDF with embedded fonts, linked contents and bookmarks; EPUB 3 with navigation (for Kindle, Apple Books, Google Play Books and Kobo); Word with real heading styles. Check them in the store's previewer before publishing.</p>
          <div className="mt-5 border-t border-border pt-4">
            <SaveBar kind="book" title={state.meta.title || "Untitled book"} data={state} meta={meta} projectId={s.projectId} setProjectId={s.setProjectId} gateRequire={gate.require} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <GhostBtn onClick={() => { if (window.confirm("Start a new book? Your current draft in this browser will be cleared (saved projects are kept).")) s.reset(); }}>Start a new book</GhostBtn>
          </div>
        </Panel>
      )}

      <ServiceCta service="ebook-formatting-conversion" title="Want it formatted professionally?" body="Images, tables, footnotes, poetry or a complex layout? We format and proof eBook and print files by hand, then help you upload them. Fixed quote after a free call." cta="Get publishing support" />
      {gate.gate}
    </div>
  );
}

function PasteBox({ onImport, hasChapters }: { onImport: (t: string) => void; hasChapters: boolean }) {
  const [t, setT] = useState("");
  return (
    <div>
      <label htmlFor="ms-paste" className="text-sm text-muted-foreground">Paste your manuscript. Lines starting with “# ” or standalone lines like “Chapter 1”, “Prologue” or “Epilogue” start chapters.</label>
      <textarea id="ms-paste" className={`${inputCls} min-h-[200px]`} rows={10} value={t} onChange={(e) => setT(e.target.value)} placeholder={"# Chapter 1\n\nYour first paragraph…\n\n# Chapter 2\n\n…"} />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <PrimaryBtn onClick={() => { if (!hasChapters || window.confirm("Replace the chapters you have now with this text?")) onImport(t); }} disabled={!t.trim()}>Organise into chapters</PrimaryBtn>
        <span className="text-xs text-muted-foreground">{t.length.toLocaleString()} / {LIMITS.maxChars.toLocaleString()} characters</span>
      </div>
    </div>
  );
}

function ReaderView({ chapter }: { chapter: Chapter }) {
  return (
    <article className="mt-3 max-h-[560px] overflow-y-auto rounded-xl bg-[#fffdf8] p-6 font-serif text-[15px] leading-relaxed text-[#1b1b1f]" style={{ fontFamily: "EFYBookSerif, Georgia, serif" }}>
      <h3 className="mb-6 mt-4 text-center text-xl font-bold">{chapter.title}</h3>
      {chapter.blocks.slice(0, 400).map((b, i) => {
        const prev = chapter.blocks[i - 1];
        const indent = prev && prev.t === "p";
        if (b.t === "p") return <p key={i} style={{ textIndent: indent ? "1.4em" : 0, margin: 0, textAlign: "justify" }}>{b.runs.map((r, k) => <Run key={k} r={r} />)}</p>;
        if (b.t === "h") return <h4 key={i} className="mb-2 mt-5 font-bold">{runsText(b.runs)}</h4>;
        if (b.t === "quote") return <blockquote key={i} className="my-3 ml-6 italic">{b.runs.map((r, k) => <Run key={k} r={r} />)}</blockquote>;
        if (b.t === "list") { const L = b.ordered ? "ol" : "ul"; return <L key={i} className={`my-2 ml-6 ${b.ordered ? "list-decimal" : "list-disc"}`}>{b.items.map((it, k) => <li key={k}>{it.map((r, j) => <Run key={j} r={r} />)}</li>)}</L>; }
        return <p key={i} className="my-3 text-center tracking-[.4em]">* * *</p>;
      })}
      {chapter.blocks.length > 400 && <p className="mt-4 text-center text-xs text-[#666]">Preview shows the first 400 paragraphs of this chapter; the files include everything.</p>}
    </article>
  );
}
function Run({ r }: { r: { text: string; b?: boolean; i?: boolean } }) {
  let n: React.ReactNode = r.text;
  if (r.i) n = <em>{n}</em>;
  if (r.b) n = <strong>{n}</strong>;
  return <>{n}</>;
}
function IconBtn({ label, children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button type="button" aria-label={label} title={label} {...p} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30">{children}</button>;
}
function Check({ label, v, on, disabled }: { label: string; v: boolean; on: (v: boolean) => void; disabled?: boolean }) {
  return <label className={`flex items-center gap-2 ${disabled ? "opacity-50" : ""}`}><input type="checkbox" checked={v} disabled={disabled} onChange={(e) => on(e.target.checked)} className="h-4 w-4 accent-[var(--emma-violet)]" />{label}</label>;
}
function dataUrlBytes(u: string): { bytes: Uint8Array; type: "image/jpeg" | "image/png" } | null {
  const m = u.match(/^data:(image\/(?:jpeg|png));base64,(.+)$/);
  if (!m) return null;
  const bin = atob(m[2]);
  const b = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
  return { bytes: b, type: m[1] as "image/jpeg" | "image/png" };
}
