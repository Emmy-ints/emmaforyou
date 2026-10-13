import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download, ImageUp, Loader2, Maximize2, MessageCircle, RotateCcw, Wand2, X } from "lucide-react";
import { previewDocument } from "@/lib/prototype";
import { buildWa } from "@/lib/leads";
import { track } from "@/lib/analytics";

const STYLES = [
  { id: "modern", label: "Modern" },
  { id: "luxury", label: "Luxury" },
  { id: "bold", label: "Bold" },
  { id: "minimal", label: "Minimal" },
] as const;

/** Shrink a screenshot in the browser: max 1100px wide, top 2000px, JPEG under ~1 MB. */
async function prepareImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("That file isn't an image we can read."));
      i.src = url;
    });
    const scale = Math.min(1, 1100 / img.naturalWidth);
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.min(Math.round(img.naturalHeight * scale), 2000);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, img.naturalWidth * scale, img.naturalHeight * scale);
    for (const q of [0.8, 0.68, 0.55, 0.42]) {
      const data = canvas.toDataURL("image/jpeg", q);
      if (data.length < 1_350_000) return data;
    }
    throw new Error("That screenshot is too large. Try cropping it to the top of the page.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function AiMakeover() {
  const [image, setImage] = useState<string | null>(null);
  const [style, setStyle] = useState<(typeof STYLES)[number]["id"]>("modern");
  const [notes, setNotes] = useState("");
  const [html, setHtml] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"after" | "before">("after");
  const [full, setFull] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Render the streaming design at most every ~600ms to keep the page smooth.
  const [shown, setShown] = useState("");
  useEffect(() => {
    if (!busy) { setShown(html); return; }
    const id = window.setTimeout(() => setShown(html), 600);
    return () => window.clearTimeout(id);
  }, [html, busy]);
  const doc = useMemo(() => (shown ? previewDocument(shown) : ""), [shown]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files || []).find((f) => f.type.startsWith("image/"));
      if (file) { e.preventDefault(); pick(file); }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  async function pick(file?: File | null) {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) { setError("Please choose an image (JPG, PNG or WebP)."); return; }
    try { setImage(await prepareImage(file)); setHtml(""); } catch (e) { setError(e instanceof Error ? e.message : "That image couldn't be read."); }
  }

  async function generate() {
    if (!image || busy) return;
    setBusy(true);
    setError("");
    setHtml("");
    setView("after");
    const ac = new AbortController();
    abortRef.current = ac;
    let text = "";
    try {
      const res = await fetch("/api/makeover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image, style, notes }), signal: ac.signal });
      if (!res.ok || !res.body) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "The makeover couldn't start.");
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const msg = JSON.parse(line);
          if (msg.type === "text") { text += msg.text; setHtml(text); }
          if (msg.type === "error") throw new Error(msg.message);
        }
      }
      if (text.trim()) track("makeover_generated", { style });
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  function downloadHtml() {
    const blob = new Blob([previewDocument(html)], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "emmaforyou-makeover.html";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-5 rounded-[24px] border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div>
            <p className="text-sm font-semibold text-foreground">1. Your current website</p>
            <button type="button" onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
              className="mt-2 grid w-full place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/40 p-3 text-center text-sm text-muted-foreground transition hover:border-[var(--emma-violet)]">
              {image ? <img src={image} alt="Your uploaded screenshot" className="max-h-56 w-full rounded-lg object-cover object-top" /> : (
                <span className="py-8"><ImageUp className="mx-auto h-7 w-7" /><span className="mt-2 block font-medium text-foreground">Upload, drop or paste a screenshot</span><span className="mt-1 block text-xs">Of your homepage or Instagram profile</span></span>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} aria-label="Choose a screenshot" />
            <p className="mt-2 text-xs text-muted-foreground">Tip: on a computer press <kbd className="rounded border border-border px-1">Win+Shift+S</kbd> or <kbd className="rounded border border-border px-1">⌘+Shift+4</kbd>, then paste here.</p>
          </div>
          <fieldset>
            <legend className="text-sm font-semibold text-foreground">2. Style</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {STYLES.map((s) => (
                <button key={s.id} type="button" role="radio" aria-checked={style === s.id} onClick={() => setStyle(s.id)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${style === s.id ? "border-[var(--emma-violet)] bg-[var(--emma-violet)] text-white" : "border-border text-foreground hover:border-[var(--emma-violet)]"}`}>{s.label}</button>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm font-semibold text-foreground">3. Anything to change? <span className="font-normal text-muted-foreground">Optional</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={400} rows={3} className="roi-input mt-2 font-normal" placeholder="e.g. Make the booking button stand out; we're a luxury salon." />
          </label>
          {busy ? (
            <button type="button" onClick={() => abortRef.current?.abort()} className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border px-6 py-3.5 font-semibold text-foreground"><X className="h-5 w-5" /> Stop</button>
          ) : (
            <button type="button" onClick={generate} disabled={!image} className="btn-primary-gradient inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white disabled:opacity-50">
              {html ? <RotateCcw className="h-5 w-5" /> : <Wand2 className="h-5 w-5" />} {html ? "Try another version" : "Redesign my website"}
            </button>
          )}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <p className="text-xs text-muted-foreground">Your screenshot is sent to our AI provider to create the design and isn't stored by us. 2 free makeovers per hour.</p>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-border bg-card shadow-[var(--shadow-card-hover)]">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
            <div className="flex gap-1 rounded-xl bg-muted p-1" role="tablist" aria-label="Compare">
              {(["before", "after"] as const).map((v) => (
                <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} disabled={v === "before" ? !image : !html}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize disabled:opacity-40 ${view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>{v}</button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {busy && <span className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Designing live…</span>}
              {html && !busy && <button onClick={() => setFull(true)} aria-label="Open full screen" className="grid h-8 w-8 place-items-center rounded-lg border border-border"><Maximize2 className="h-4 w-4" /></button>}
            </div>
          </div>
          <div className="h-[560px] bg-muted/30">
            {view === "before" && image ? (
              <div className="h-full overflow-auto p-3"><img src={image} alt="Your current website" className="mx-auto w-full max-w-3xl rounded-lg" /></div>
            ) : doc ? (
              <iframe title="AI redesign preview" srcDoc={doc} sandbox="allow-scripts allow-forms" className="h-full w-full bg-white" />
            ) : (
              <div className="grid h-full place-items-center p-8 text-center text-sm text-muted-foreground">
                <div><Wand2 className="mx-auto h-8 w-8" /><p className="mt-3 max-w-xs">Your redesigned page appears here, built live as the AI designs it. Usually takes 30–60 seconds.</p></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {html && !busy && (
        <div className="flex flex-wrap gap-3">
          <Link to="/book" className="btn-primary-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white">Build this for real · book a free call</Link>
          <a href={buildWa("Hi Emmanuel, I tried the AI makeover on your site and I'd like a redesign like this for my business.")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-5 py-3 text-sm font-semibold text-white"><MessageCircle className="h-4 w-4" /> WhatsApp us</a>
          <button onClick={downloadHtml} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground hover:border-[var(--emma-violet)]"><Download className="h-4 w-4" /> Download design</button>
        </div>
      )}

      {full && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/80 p-3 backdrop-blur" role="dialog" aria-modal="true" aria-label="Full-screen redesign">
          <button onClick={() => setFull(false)} aria-label="Close full screen" className="mb-2 ml-auto grid h-10 w-10 place-items-center rounded-full bg-white text-black"><X className="h-5 w-5" /></button>
          <iframe title="AI redesign full screen" srcDoc={doc} sandbox="allow-scripts allow-forms" className="min-h-0 w-full flex-1 rounded-lg bg-white" />
        </div>
      )}
    </div>
  );
}
