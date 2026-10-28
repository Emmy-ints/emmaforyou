import { useEffect, useMemo, useRef, useState } from "react";
import { Download, ImagePlus, Loader2, Shuffle, Sparkles, Wand2 } from "lucide-react";
import { type CoverDesign, type CoverText, DEFAULT_DESIGN, PALETTES, TEMPLATES, type TemplateId, canvasBlob, drawFront, drawWrap, loadImage, suggestConcepts } from "@/lib/books/cover";
import { CHECKED, EBOOK_COVER, PRINT_COVER, SOURCES, TRIMS, wrapDims } from "@/lib/books/specs";
import { safeFileName } from "@/lib/books/manuscript";
import { track } from "@/lib/analytics";
import { useFlag } from "@/lib/site-settings";
import { Field, GhostBtn, Notice, Panel, PrimaryBtn, SaveBar, ServiceCta, accessToken, bookAi, downloadBytes, inputCls, report, useAccountGate, useBookState } from "./shared";

const GENRES = ["Literary fiction", "Romance", "Thriller / crime", "Fantasy", "Science fiction", "Horror", "Children's", "Young adult", "Memoir", "Business", "Self-help", "Health & wellness", "Faith & inspiration", "Poetry", "Cookbook", "History", "Other"];
type Concept = CoverDesign & { name: string; why: string; tagline?: string; imagePrompt?: string };
interface State {
  text: CoverText; genre: string; audience: string; summary: string; style: string;
  format: "ebook" | "print"; trim: string; pages: number; paper: string;
  design: CoverDesign; concepts: Concept[]; conceptsBy: "ai" | "template" | null; art: string | null; artBy: "upload" | "ai" | null; imagePrompt: string;
}
const initial = (): State => ({
  text: { title: "", subtitle: "", author: "", tagline: "", series: "", blurb: "", bio: "" }, genre: "Literary fiction", audience: "", summary: "", style: "",
  format: "ebook", trim: "6x9", pages: 240, paper: "white", design: { ...DEFAULT_DESIGN }, concepts: [], conceptsBy: null, art: null, artBy: null, imagePrompt: "",
});

export const COVER_HANDOFF = "efy_book_cover_handoff";

export default function CoverDesigner() {
  const s = useBookState<State>("cover-designer", "cover", initial);
  const { state, setState } = s;
  const gate = useAccountGate("cover-designer");
  const aiOn = useFlag("publishing-ai", true);
  const [fontsReady, setFontsReady] = useState(false);
  const [artImg, setArtImg] = useState<HTMLImageElement | null>(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ tone: "ok" | "error" | "warn" | "info"; text: string } | null>(null);
  const [guides, setGuides] = useState(true);
  const big = useRef<HTMLCanvasElement>(null);
  const thumb = useRef<HTMLCanvasElement>(null);

  useEffect(() => { import("@/lib/books/fonts").then((f) => f.loadCanvasFonts()).then(() => setFontsReady(true)).catch(() => setFontsReady(true)); }, []);
  useEffect(() => { if (!state.art) { setArtImg(null); return; } loadImage(state.art).then(setArtImg).catch(() => setArtImg(null)); }, [state.art]);

  const text: CoverText = state.text;
  const title = text.title.trim() || "Your Book Title";
  const shownText = { ...text, title, author: text.author.trim() || "Author Name" };
  const dims = useMemo(() => wrapDims({ trimW: TRIMS[state.trim].w, trimH: TRIMS[state.trim].h, pages: state.pages, paper: state.paper }), [state.trim, state.pages, state.paper]);

  // live preview
  useEffect(() => {
    if (!fontsReady) return;
    const c = big.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    if (state.format === "ebook") {
      c.width = 800; c.height = 1280;
      ctx.clearRect(0, 0, c.width, c.height);
      drawFront(ctx, { x: 0, y: 0, w: 800, h: 1280 }, state.design, shownText, artImg);
    } else {
      const k = Math.min(1, 1500 / dims.px.w);
      c.width = Math.round(dims.px.w * k); c.height = Math.round(dims.px.h * k);
      ctx.save(); ctx.scale(k, k);
      drawWrap(ctx, dims.px, state.design, shownText, { spineText: dims.spineText, guides, dpi: PRINT_COVER.dpi }, artImg);
      ctx.restore();
    }
    const t = thumb.current;
    if (t) { t.width = 100; t.height = 160; const tc = t.getContext("2d")!; drawFront(tc, { x: 0, y: 0, w: 100, h: 160 }, state.design, shownText, artImg); }
  }, [fontsReady, state.design, state.format, shownText.title, shownText.author, text.subtitle, text.tagline, text.series, text.blurb, text.bio, artImg, dims, guides]); // eslint-disable-line react-hooks/exhaustive-deps

  const setText = (k: keyof CoverText, v: string) => setState((x) => ({ ...x, text: { ...x.text, [k]: v } }));
  const setD = <K extends keyof CoverDesign>(k: K, v: CoverDesign[K]) => setState((x) => ({ ...x, design: { ...x.design, [k]: v } }));

  async function generate() {
    setMsg(null);
    if (!text.title.trim()) { setMsg({ tone: "error", text: "Add your book title first." }); return; }
    setBusy("Designing concepts…");
    try {
      if (!aiOn) throw new Error("AI concepts are switched off on this site right now.");
      const r = await bookAi<{ concepts: Concept[] }>("cover_concepts", { title: text.title, subtitle: text.subtitle, author: text.author, genre: state.genre, audience: state.audience, summary: state.summary, style: state.style }, "cover-designer");
      const concepts = r.concepts.map((c, i) => ({ ...DEFAULT_DESIGN, ...c, titleScale: 1, overlay: 0.35, seed: 11 + i * 17, imageFocus: 0.5 }));
      setState((x) => ({ ...x, concepts, conceptsBy: "ai", design: concepts[0], text: { ...x.text, tagline: x.text.tagline || concepts[0].tagline || "" }, imagePrompt: x.imagePrompt || concepts[0].imagePrompt || "" }));
      setMsg({ tone: "ok", text: `${concepts.length} AI-suggested concepts, drawn with our editable layouts. Pick one and adjust anything.` });
    } catch (e) {
      const concepts = suggestConcepts(state.genre, state.style, Date.now() % 97);
      setState((x) => ({ ...x, concepts, conceptsBy: "template", design: concepts[0] }));
      setMsg({ tone: "warn", text: `${(e as Error).message} Showing template suggestions for ${state.genre.toLowerCase()} instead (no AI used).` });
    } finally { setBusy(""); }
    track("book_preview_generated", { tool: "cover-designer" });
  }

  async function onArt(f: File | undefined) {
    if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { setMsg({ tone: "error", text: "Use a JPEG, PNG or WebP image." }); return; }
    if (f.size > 12 * 1048576) { setMsg({ tone: "error", text: "Images up to 12 MB." }); return; }
    const url = await shrink(URL.createObjectURL(f), 1600);
    setState((x) => ({ ...x, art: url, artBy: "upload" }));
    const im = await loadImage(url);
    if (im.width < 625 || im.height < 1000) setMsg({ tone: "warn", text: `That image is ${im.width} × ${im.height} px — it may look soft. KDP's minimum cover size is 625 × 1,000 px and the ideal is 1,600 × 2,560.` });
    else setMsg({ tone: "ok", text: "Your image is now the cover background. Make sure you own it or have a commercial licence." });
  }

  async function aiArt() {
    setMsg(null);
    const prompt = state.imagePrompt.trim();
    if (prompt.length < 10) { setMsg({ tone: "error", text: "Describe the artwork first (scenery, objects, mood, colours)." }); return; }
    setBusy("Generating artwork… (up to a minute)");
    const t0 = performance.now();
    try {
      const token = await accessToken();
      const r = await fetch("/api/book-art", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ prompt, genre: state.genre }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.image) throw new Error(j.message || "Artwork couldn't be generated.");
      const url = await shrink(j.image, 1600);
      setState((x) => ({ ...x, art: url, artBy: "ai" }));
      setMsg({ tone: "ok", text: "AI-generated artwork added. Some stores ask you to declare AI-generated images when you publish." });
      report("cover-designer", "ai_art_client", true, t0);
    } catch (e) { setMsg({ tone: "error", text: (e as Error).message }); report("cover-designer", "ai_art_client", false, t0, (e as Error).message); }
    finally { setBusy(""); }
  }

  async function render(kind: "ebook-jpg" | "ebook-png" | "wrap-png" | "wrap-pdf") {
    setMsg(null);
    if (!text.title.trim() || !text.author.trim()) { setMsg({ tone: "error", text: "Add the title and author name before downloading." }); return; }
    const t0 = performance.now();
    track("book_export_attempted", { tool: "cover-designer", format: kind });
    setBusy("Rendering at full size…");
    try {
      const c = document.createElement("canvas");
      const ctx = c.getContext("2d")!;
      let name = safeFileName(`${text.title}-cover`, "jpg");
      if (kind.startsWith("ebook")) {
        c.width = EBOOK_COVER.idealW; c.height = EBOOK_COVER.idealH;
        drawFront(ctx, { x: 0, y: 0, w: c.width, h: c.height }, state.design, text, artImg);
        const type = kind === "ebook-png" ? "image/png" : "image/jpeg";
        const blob = await canvasBlob(c, type, 0.92);
        name = safeFileName(`${text.title}-ebook-cover`, type === "image/png" ? "png" : "jpg");
        downloadBytes(blob, name, type);
        setMsg({ tone: "ok", text: `Downloaded ${name}: ${c.width} × ${c.height} px (KDP's recommended size), ${(blob.size / 1048576).toFixed(1)} MB.` });
      } else {
        c.width = dims.px.w; c.height = dims.px.h;
        drawWrap(ctx, dims.px, state.design, text, { spineText: dims.spineText, guides: false, dpi: PRINT_COVER.dpi }, artImg);
        if (kind === "wrap-png") {
          const blob = await canvasBlob(c, "image/png");
          name = safeFileName(`${text.title}-paperback-wrap`, "png");
          downloadBytes(blob, name, "image/png");
        } else {
          const blob = await canvasBlob(c, "image/jpeg", 0.95);
          const { jpegToPdf } = await import("@/lib/books/export-pdf");
          const pdf = jpegToPdf(new Uint8Array(await blob.arrayBuffer()), { w: c.width, h: c.height }, { w: dims.width, h: dims.height }, text.title);
          name = safeFileName(`${text.title}-paperback-wrap`, "pdf");
          downloadBytes(pdf, name, "application/pdf");
        }
        setMsg({ tone: "ok", text: `Downloaded ${name}: ${dims.width.toFixed(3)} × ${dims.height.toFixed(3)} in at 300 DPI (${c.width} × ${c.height} px), spine ${dims.spine.toFixed(3)} in. RGB layout proof — convert to CMYK before uploading to KDP.` });
      }
      track("book_export_completed", { tool: "cover-designer", format: kind });
      report("cover-designer", `export_${kind}`, true, t0);
    } catch (e) {
      setMsg({ tone: "error", text: `The cover couldn't be rendered: ${(e as Error).message}` });
      track("book_export_failed", { tool: "cover-designer", format: kind });
      report("cover-designer", `export_${kind}`, false, t0, (e as Error).message);
    } finally { setBusy(""); }
  }

  async function handoff(to: "mockups" | "ebook-creator") {
    const c = document.createElement("canvas"); c.width = 1000; c.height = 1600;
    drawFront(c.getContext("2d")!, { x: 0, y: 0, w: 1000, h: 1600 }, state.design, shownText, artImg);
    const url = c.toDataURL("image/jpeg", 0.88);
    try {
      window.localStorage.setItem(COVER_HANDOFF, JSON.stringify({ image: url, title: text.title, author: text.author, at: Date.now() }));
      if (to === "ebook-creator") {
        const k = "efy_book_draft:ebook-creator";
        const d = JSON.parse(window.localStorage.getItem(k) || "null");
        if (d?.v) { d.v.cover = url; window.localStorage.setItem(k, JSON.stringify(d)); }
      }
    } catch { setMsg({ tone: "error", text: "This browser's storage is full or blocked, so the cover couldn't be passed on. Download it instead." }); return; }
    window.location.href = `/publishing/${to}?from=cover`;
  }

  const thumbData = () => { try { return thumb.current?.toDataURL("image/jpeg", 0.8) ?? null; } catch { return null; } };

  if (!s.loaded) return <div className="py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" aria-label="Loading" /></div>;

  return (
    <div className="space-y-6">
      {s.loadError && <Notice tone="error">{s.loadError}</Notice>}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel title="1. About the book">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title *"><input className={inputCls} value={text.title} maxLength={160} onChange={(e) => setText("title", e.target.value)} /></Field>
              <Field label="Subtitle"><input className={inputCls} value={text.subtitle} maxLength={160} onChange={(e) => setText("subtitle", e.target.value)} /></Field>
              <Field label="Author name *"><input className={inputCls} value={text.author} maxLength={100} onChange={(e) => setText("author", e.target.value)} /></Field>
              <Field label="Series (optional)"><input className={inputCls} value={text.series} maxLength={80} onChange={(e) => setText("series", e.target.value)} /></Field>
              <Field label="Genre"><select className={inputCls} value={state.genre} onChange={(e) => setState((x) => ({ ...x, genre: e.target.value }))}>{GENRES.map((g) => <option key={g}>{g}</option>)}</select></Field>
              <Field label="Audience"><input className={inputCls} value={state.audience} maxLength={200} placeholder="e.g. women 25–45 who love slow-burn romance" onChange={(e) => setState((x) => ({ ...x, audience: e.target.value }))} /></Field>
            </div>
            <div className="mt-4 grid gap-4">
              <Field label="Short summary" hint="Helps the AI suggest concepts. Not printed unless you add it as the back-cover blurb."><textarea className={inputCls} rows={3} maxLength={1500} value={state.summary} onChange={(e) => setState((x) => ({ ...x, summary: e.target.value }))} /></Field>
              <Field label="Style wishes"><input className={inputCls} value={state.style} maxLength={200} placeholder="e.g. dark and moody, gold accents, no people" onChange={(e) => setState((x) => ({ ...x, style: e.target.value }))} /></Field>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <PrimaryBtn onClick={() => void generate()} disabled={!!busy}><Sparkles className="h-4 w-4" aria-hidden="true" />Generate cover concepts</PrimaryBtn>
              {busy && <span role="status" className="inline-flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{busy}</span>}
            </div>
          </Panel>

          {state.concepts.length > 0 && (
            <Panel title={state.conceptsBy === "ai" ? "2. Concepts (AI-suggested layouts)" : "2. Concepts (template suggestions)"}>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {state.concepts.map((c, i) => (
                  <li key={i}>
                    <button type="button" onClick={() => setState((x) => ({ ...x, design: { ...c }, imagePrompt: c.imagePrompt || x.imagePrompt, text: { ...x.text, tagline: x.text.tagline || c.tagline || "" } }))} className={`w-full rounded-xl border p-2 text-left ${state.design.template === c.template && state.design.palette.bg === c.palette.bg ? "border-[var(--hue)] ring-2 ring-[var(--hue)]/30" : "border-border"}`} aria-label={`Use concept ${c.name}`}>
                      <ConceptThumb design={c} text={shownText} art={artImg} ready={fontsReady} />
                      <span className="mt-1.5 block text-xs font-semibold">{c.name}</span>
                      <span className="block text-[11px] leading-snug text-muted-foreground">{c.why}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <Panel title="3. Customise">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Layout"><select className={inputCls} value={state.design.template} onChange={(e) => setD("template", e.target.value as TemplateId)}>{TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name} — {t.suits}</option>)}</select></Field>
              <Field label="Palette"><select className={inputCls} value="" onChange={(e) => e.target.value && setD("palette", PALETTES[e.target.value])}><option value="">Choose a preset…</option>{Object.keys(PALETTES).map((p) => <option key={p} value={p}>{p}</option>)}</select></Field>
              <div className="grid grid-cols-4 gap-2 sm:col-span-2">
                {(["bg", "bg2", "fg", "accent"] as const).map((k) => (
                  <label key={k} className="text-xs">{{ bg: "Background", bg2: "Second", fg: "Text", accent: "Accent" }[k]}<input type="color" className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-border" value={state.design.palette[k]} onChange={(e) => setD("palette", { ...state.design.palette, [k]: e.target.value })} /></label>
                ))}
              </div>
              <Field label="Title font"><select className={inputCls} value={state.design.titleFont} onChange={(e) => setD("titleFont", e.target.value as "serif" | "sans")}><option value="serif">Serif (book)</option><option value="sans">Sans (bold, modern)</option></select></Field>
              <Field label="Alignment"><select className={inputCls} value={state.design.align} onChange={(e) => setD("align", e.target.value as "center" | "left")}><option value="center">Centred</option><option value="left">Left</option></select></Field>
              <Field label={`Title size · ${Math.round(state.design.titleScale * 100)}%`}><input type="range" min={0.7} max={1.4} step={0.05} className="mt-3 w-full" value={state.design.titleScale} onChange={(e) => setD("titleScale", Number(e.target.value))} /></Field>
              <Field label={`Image darkening · ${Math.round(state.design.overlay * 100)}%`}><input type="range" min={0} max={0.9} step={0.05} className="mt-3 w-full" value={state.design.overlay} onChange={(e) => setD("overlay", Number(e.target.value))} /></Field>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.design.uppercase} onChange={(e) => setD("uppercase", e.target.checked)} className="h-4 w-4" />Capital letters</label>
              <GhostBtn onClick={() => setD("seed", Math.floor(Math.random() * 99999))}><Shuffle className="h-4 w-4" aria-hidden="true" />Shuffle shapes/stars</GhostBtn>
              <Field label="Tagline (optional)"><input className={inputCls} value={text.tagline} maxLength={90} onChange={(e) => setText("tagline", e.target.value)} /></Field>
            </div>
            <div className="mt-5 border-t border-border pt-4">
              <p className="text-sm font-medium">Background artwork</p>
              <p className="text-xs text-muted-foreground">{state.art ? (state.artBy === "ai" ? "AI-generated image." : "Your uploaded image.") : "None — the layout's own shapes and colours are used."}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className="nav-ghost h-auto cursor-pointer px-4 py-2 text-sm"><ImagePlus className="h-4 w-4" aria-hidden="true" />Upload image<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { void onArt(e.target.files?.[0]); e.target.value = ""; }} /></label>
                {state.art && <GhostBtn onClick={() => setState((x) => ({ ...x, art: null, artBy: null }))}>Remove</GhostBtn>}
              </div>
              {state.art && <Field label={`Image position · ${Math.round(state.design.imageFocus * 100)}%`}><input type="range" min={0} max={1} step={0.05} className="mt-2 w-full" value={state.design.imageFocus} onChange={(e) => setD("imageFocus", Number(e.target.value))} /></Field>}
              {aiOn && (
                <div className="mt-3 rounded-2xl bg-muted/40 p-3">
                  <Field label="Generate artwork with AI (free account)" hint="Describe scenery, objects, mood and colours. Text is added by the designer, not the image model."><textarea className={inputCls} rows={2} maxLength={800} value={state.imagePrompt} onChange={(e) => setState((x) => ({ ...x, imagePrompt: e.target.value }))} /></Field>
                  <GhostBtn className="mt-2" disabled={!!busy} onClick={() => gate.require("Sign in to generate AI artwork", () => void aiArt())}><Wand2 className="h-4 w-4" aria-hidden="true" />Generate artwork</GhostBtn>
                </div>
              )}
            </div>
          </Panel>

          <Panel title="4. Format">
            <div role="radiogroup" aria-label="Cover type" className="grid gap-2 sm:grid-cols-2">
              {([["ebook", "eBook cover", `${EBOOK_COVER.idealW} × ${EBOOK_COVER.idealH} px, front only`], ["print", "Paperback wrap", "Back + spine + front, with bleed"]] as const).map(([v, l, d]) => (
                <button key={v} type="button" role="radio" aria-checked={state.format === v} onClick={() => setState((x) => ({ ...x, format: v }))} className={`rounded-2xl border p-3 text-left ${state.format === v ? "border-[var(--hue)] ring-2 ring-[var(--hue)]/30" : "border-border"}`}><span className="block text-sm font-semibold">{l}</span><span className="text-xs text-muted-foreground">{d}</span></button>
              ))}
            </div>
            {state.format === "print" && (
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Field label="Trim size"><select className={inputCls} value={state.trim} onChange={(e) => setState((x) => ({ ...x, trim: e.target.value }))}>{Object.entries(TRIMS).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}</select></Field>
                <Field label="Page count" hint={`Min ${PRINT_COVER.minPages}. Use your final interior PDF's count.`}><input type="number" min={PRINT_COVER.minPages} max={828} className={inputCls} value={state.pages} onChange={(e) => setState((x) => ({ ...x, pages: Math.max(1, Math.min(828, Number(e.target.value) || 0)) }))} /></Field>
                <Field label="Paper"><select className={inputCls} value={state.paper} onChange={(e) => setState((x) => ({ ...x, paper: e.target.value }))}><option value="white">White</option><option value="cream">Cream</option><option value="premium-color">Premium colour</option><option value="standard-color">Standard colour</option></select></Field>
                <Field label="Back-cover blurb"><textarea className={inputCls} rows={4} maxLength={1400} value={text.blurb} onChange={(e) => setText("blurb", e.target.value)} /></Field>
                <Field label="Author bio (back cover)"><textarea className={inputCls} rows={4} maxLength={500} value={text.bio} onChange={(e) => setText("bio", e.target.value)} /></Field>
                <div className="text-xs text-muted-foreground">
                  <p><strong className="text-foreground">Full wrap:</strong> {dims.width.toFixed(3)} × {dims.height.toFixed(3)} in</p>
                  <p>Spine: {state.pages} × {(PRINT_COVER.paper[state.paper]).toString()} in = {dims.spine.toFixed(3)} in</p>
                  <p>Bleed {PRINT_COVER.bleed} in on every edge · {PRINT_COVER.dpi} DPI = {dims.px.w} × {dims.px.h} px</p>
                  <p>{dims.spineText ? "Spine text included." : `No spine text: KDP needs at least ${PRINT_COVER.spineTextMinPages} pages for spine text.`}</p>
                  {state.pages < PRINT_COVER.minPages && <p className="text-red-600">Paperbacks need at least {PRINT_COVER.minPages} pages.</p>}
                </div>
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Panel title="Preview" actions={state.format === "print" ? <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} />Show trim, spine and safe-area guides</label> : null}>
            {!fontsReady ? <p className="py-16 text-center text-sm text-muted-foreground">Loading fonts…</p> : (
              <canvas ref={big} role="img" aria-label={`Cover preview: ${title} by ${shownText.author}`} className={`mx-auto block h-auto rounded shadow-[0_24px_50px_-24px_rgba(0,0,0,.6)] ${state.format === "ebook" ? "w-full max-w-[360px]" : "w-full"}`} />
            )}
            {!text.title.trim() && <p className="mt-2 text-center text-xs text-muted-foreground">Placeholder title and author shown until you add yours.</p>}
            <div className="mt-4 flex items-center gap-4 rounded-2xl bg-muted/40 p-3">
              <canvas ref={thumb} className="h-[80px] w-[50px] rounded-sm shadow" aria-label="Thumbnail-size preview" role="img" />
              <p className="text-xs text-muted-foreground">Thumbnail check: this is roughly the size shoppers see in store search results. Is the title still readable?</p>
            </div>
            {state.art == null && state.design.template === "photo" && <p className="mt-2 text-xs text-muted-foreground">The “Full image” layout is showing abstract shapes; add your own image or generate artwork.</p>}
          </Panel>

          <Panel title="Download & use">
            {msg && <div className="mb-3"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
            <div className="flex flex-wrap gap-2">
              {state.format === "ebook" ? (<>
                <PrimaryBtn disabled={!!busy} onClick={() => gate.require("Sign in to download your cover", () => void render("ebook-jpg"))}><Download className="h-4 w-4" aria-hidden="true" />eBook cover (JPEG)</PrimaryBtn>
                <GhostBtn disabled={!!busy} onClick={() => gate.require("Sign in to download your cover", () => void render("ebook-png"))}>PNG</GhostBtn>
              </>) : (<>
                <PrimaryBtn disabled={!!busy || state.pages < PRINT_COVER.minPages} onClick={() => gate.require("Sign in to download your cover", () => void render("wrap-pdf"))}><Download className="h-4 w-4" aria-hidden="true" />Wrap proof (PDF)</PrimaryBtn>
                <GhostBtn disabled={!!busy || state.pages < PRINT_COVER.minPages} onClick={() => gate.require("Sign in to download your cover", () => void render("wrap-png"))}>PNG (300 DPI)</GhostBtn>
              </>)}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <GhostBtn onClick={() => void handoff("mockups")}>Make mockups with this cover →</GhostBtn>
              <GhostBtn onClick={() => void handoff("ebook-creator")}>Add to my eBook →</GhostBtn>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              eBook: {EBOOK_COVER.idealW} × {EBOOK_COVER.idealH} px ({EBOOK_COVER.formats}). Paperback: {PRINT_COVER.color} Specs from <a className="underline" href={SOURCES.ebookCover} target="_blank" rel="noopener noreferrer">KDP eBook cover</a> and <a className="underline" href={SOURCES.paperbackCover} target="_blank" rel="noopener noreferrer">paperback cover</a> guidance, checked {CHECKED}.
            </p>
            <div className="mt-4 border-t border-border pt-4">
              <SaveBar kind="cover" title={text.title || "Untitled cover"} data={state} meta={{ thumb: thumbData(), format: state.format, template: state.design.template }} projectId={s.projectId} setProjectId={s.setProjectId} gateRequire={gate.require} />
            </div>
          </Panel>
        </div>
      </div>
      <ServiceCta service="book-cover-design" title="Want a professionally designed cover?" body="Our designers create original concepts with licensed images and fonts, then deliver the final eBook cover and a CMYK print wrap sized to your page count." cta="Request cover design" />
      {gate.gate}
    </div>
  );
}

function ConceptThumb({ design, text, art, ready }: { design: CoverDesign; text: CoverText; art: HTMLImageElement | null; ready: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const c = ref.current; if (!c || !ready) return; c.width = 200; c.height = 320; drawFront(c.getContext("2d")!, { x: 0, y: 0, w: 200, h: 320 }, design, text, art); }, [design, text, art, ready]);
  return <canvas ref={ref} className="aspect-[5/8] w-full rounded" aria-hidden="true" />;
}

/** Downscale an image to at most `max` px on the long side (keeps saved projects small). */
async function shrink(src: string, max: number): Promise<string> {
  const im = await loadImage(src);
  const k = Math.min(1, max / Math.max(im.width, im.height));
  const c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
  c.getContext("2d")!.drawImage(im, 0, 0, c.width, c.height);
  if (src.startsWith("blob:")) URL.revokeObjectURL(src);
  return c.toDataURL("image/jpeg", 0.86);
}
