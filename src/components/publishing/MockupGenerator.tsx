import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download, ImagePlus, Loader2, Package } from "lucide-react";
import { FORMATS, type Format, type PromoStyle, type PromoText, renderFormat } from "@/lib/books/mockup";
import { canvasBlob, loadImage } from "@/lib/books/cover";
import { safeFileName } from "@/lib/books/manuscript";
import { track } from "@/lib/analytics";
import { Field, GhostBtn, Notice, Panel, PrimaryBtn, SaveBar, ServiceCta, downloadBytes, inputCls, report, useAccountGate, useBookState } from "./shared";
import { COVER_HANDOFF } from "./CoverDesigner";

interface State { cover: string | null; title: string; text: PromoText; style: PromoStyle; selected: string[] }
const initial = (): State => ({
  cover: null, title: "",
  text: { headline: "", sub: "", cta: "Available now", quote: "", attribution: "", badge: "OUT NOW" },
  style: { bg1: "#1d1033", bg2: "#0b0d24", fg: "#ffffff", accent: "#ff9f5a" },
  selected: ["ebook3d", "paperback", "square", "story", "link"],
});

export default function MockupGenerator() {
  const s = useBookState<State>("mockups", "mockup", initial);
  const { state, setState } = s;
  const gate = useAccountGate("mockups");
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [fonts, setFonts] = useState(false);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ tone: "ok" | "error" | "warn"; text: string } | null>(null);
  const [saved, setSaved] = useState<{ id: string; title: string; thumb: string | null }[] | null>(null);

  useEffect(() => { import("@/lib/books/fonts").then((f) => f.loadCanvasFonts()).finally(() => setFonts(true)); }, []);
  // a cover handed over from the Cover Designer
  useEffect(() => {
    if (!s.loaded) return;
    try {
      const h = JSON.parse(window.localStorage.getItem(COVER_HANDOFF) || "null");
      if (h?.image && new URLSearchParams(window.location.search).get("from") === "cover") {
        setState((x) => ({ ...x, cover: h.image, title: h.title || x.title, text: { ...x.text, headline: x.text.headline || h.title || "", sub: x.text.sub || (h.author ? `by ${h.author}` : "") } }));
        setMsg({ tone: "ok", text: "Your cover from the Cover Designer is loaded." });
      }
    } catch { /* storage blocked */ }
  }, [s.loaded]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!state.cover) { setImg(null); return; } loadImage(state.cover).then(setImg).catch(() => setMsg({ tone: "error", text: "That image couldn't be opened." })); }, [state.cover]);
  useEffect(() => { if (img) track("book_preview_generated", { tool: "mockups" }); }, [img]);

  async function onFile(f: File | undefined) {
    if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { setMsg({ tone: "error", text: "Use a JPEG, PNG or WebP cover image." }); return; }
    if (f.size > 15 * 1048576) { setMsg({ tone: "error", text: "Cover images up to 15 MB." }); return; }
    const raw = URL.createObjectURL(f);
    const im = await loadImage(raw);
    const k = Math.min(1, 1600 / im.height);
    const c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
    c.getContext("2d")!.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(raw);
    const ratio = im.height / im.width;
    setState((x) => ({ ...x, cover: c.toDataURL("image/jpeg", 0.9) }));
    setMsg(ratio < 1.2 || ratio > 1.8 ? { tone: "warn", text: `This image is ${im.width} × ${im.height} px (ratio ${ratio.toFixed(2)}:1). Book covers are usually about 1.5–1.6:1 tall, so mockups may look stretched.` } : { tone: "ok", text: `Cover loaded (${im.width} × ${im.height} px).` });
  }

  async function loadSaved() {
    const { supabase } = await import("@/integrations/supabase/client");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from("book_projects").select("id,title,meta").eq("kind", "cover").order("updated_at", { ascending: false }).limit(24);
    if (error) { setMsg({ tone: "error", text: "Your saved covers couldn't be loaded." }); return; }
    setSaved((data ?? []).map((r: { id: string; title: string; meta: { thumb?: string } }) => ({ id: r.id, title: r.title, thumb: r.meta?.thumb ?? null })));
  }
  async function useSaved(id: string) {
    setBusy("Opening your cover…");
    try {
      const [{ supabase }, cover] = await Promise.all([import("@/integrations/supabase/client"), import("@/lib/books/cover")]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).from("book_projects").select("data").eq("id", id).maybeSingle();
      const st = data?.data; if (!st) throw new Error("Not found");
      await (await import("@/lib/books/fonts")).loadCanvasFonts();
      const art = st.art ? await cover.loadImage(st.art) : null;
      const c = document.createElement("canvas"); c.width = 1000; c.height = 1600;
      cover.drawFront(c.getContext("2d")!, { x: 0, y: 0, w: 1000, h: 1600 }, st.design, st.text, art);
      setState((x) => ({ ...x, cover: c.toDataURL("image/jpeg", 0.9), title: st.text?.title || x.title, text: { ...x.text, headline: x.text.headline || st.text?.title || "" } }));
      setSaved(null);
    } catch { setMsg({ tone: "error", text: "That cover couldn't be opened." }); } finally { setBusy(""); }
  }

  async function renderBlob(f: Format, type: "image/png" | "image/jpeg") {
    const c = document.createElement("canvas"); c.width = f.w; c.height = f.h;
    renderFormat(c.getContext("2d")!, f, img!, state.text, state.style);
    return canvasBlob(c, type, 0.92);
  }
  async function downloadOne(f: Format) {
    const t0 = performance.now(); track("book_export_attempted", { tool: "mockups", format: f.id });
    try {
      const b = await renderBlob(f, "image/png");
      downloadBytes(b, safeFileName(`${state.title || "book"}-${f.id}`, "png"), "image/png");
      track("book_export_completed", { tool: "mockups", format: f.id }); report("mockups", `export_${f.id}`, true, t0);
    } catch (e) { setMsg({ tone: "error", text: (e as Error).message }); track("book_export_failed", { tool: "mockups", format: f.id }); report("mockups", `export_${f.id}`, false, t0, (e as Error).message); }
  }
  async function downloadPack() {
    const list = FORMATS.filter((f) => state.selected.includes(f.id));
    if (!list.length) { setMsg({ tone: "error", text: "Choose at least one format." }); return; }
    const t0 = performance.now(); track("book_export_attempted", { tool: "mockups", format: "pack" });
    setBusy(`Rendering ${list.length} images…`);
    try {
      const { makeZip } = await import("@/lib/books/zip");
      const files = [];
      for (const f of list) files.push({ name: `${f.id}-${f.w}x${f.h}.png`, data: new Uint8Array(await (await renderBlob(f, "image/png")).arrayBuffer()), store: true });
      files.push({ name: "README.txt", data: `Promo pack for "${state.title || "your book"}" made with the EmmaForYou mockup generator.\n\n${list.map((f) => `${f.id}-${f.w}x${f.h}.png — ${f.name} (${f.use})`).join("\n")}\n\nThe cover image is yours; make sure you have the rights to any artwork in it.\n` });
      const zip = await makeZip(files);
      const name = safeFileName(`${state.title || "book"}-promo-pack`, "zip");
      downloadBytes(zip, name, "application/zip");
      setMsg({ tone: "ok", text: `Downloaded ${name} with ${list.length} images (${(zip.length / 1048576).toFixed(1)} MB).` });
      track("book_export_completed", { tool: "mockups", format: "pack" }); report("mockups", "export_pack", true, t0);
    } catch (e) { setMsg({ tone: "error", text: `The pack couldn't be built: ${(e as Error).message}` }); track("book_export_failed", { tool: "mockups", format: "pack" }); report("mockups", "export_pack", false, t0, (e as Error).message); }
    finally { setBusy(""); }
  }

  const setT = (k: keyof PromoText, v: string) => setState((x) => ({ ...x, text: { ...x.text, [k]: v } }));
  const setS = (k: keyof PromoStyle, v: string) => setState((x) => ({ ...x, style: { ...x.style, [k]: v } }));
  if (!s.loaded) return <div className="py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" aria-label="Loading" /></div>;

  return (
    <div className="space-y-6">
      {s.loadError && <Notice tone="error">{s.loadError}</Notice>}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="space-y-6">
          <Panel title="1. Your cover">
            <div className="flex flex-wrap items-center gap-3">
              {state.cover && <img src={state.cover} alt="Your cover" className="h-28 rounded shadow" />}
              <label className="nav-ghost h-auto cursor-pointer px-4 py-2 text-sm"><ImagePlus className="h-4 w-4" aria-hidden="true" />{state.cover ? "Replace cover" : "Upload your cover"}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} /></label>
              <GhostBtn onClick={() => gate.require("Sign in to use your saved covers", () => void loadSaved())}>Use a saved cover</GhostBtn>
            </div>
            {!state.cover && <p className="mt-3 text-sm text-muted-foreground">No cover yet? <Link to="/publishing/cover-designer" className="underline underline-offset-4">Design one</Link> and send it here.</p>}
            {saved && (saved.length ? <ul className="mt-3 grid grid-cols-4 gap-2">{saved.map((c) => <li key={c.id}><button type="button" onClick={() => void useSaved(c.id)} className="w-full rounded-lg border border-border p-1 text-left text-[11px]">{c.thumb ? <img src={c.thumb} alt="" className="aspect-[5/8] w-full rounded object-cover" /> : <span className="block aspect-[5/8] rounded bg-muted" />}<span className="line-clamp-1">{c.title}</span></button></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">You have no saved covers yet.</p>)}
            {msg && <div className="mt-3"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
          </Panel>
          <Panel title="2. Words & colours">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Book title (file names)"><input className={inputCls} value={state.title} maxLength={120} onChange={(e) => setState((x) => ({ ...x, title: e.target.value }))} /></Field>
              <Field label="Headline"><input className={inputCls} value={state.text.headline} maxLength={90} onChange={(e) => setT("headline", e.target.value)} /></Field>
              <Field label="Sub-line"><input className={inputCls} value={state.text.sub} maxLength={140} onChange={(e) => setT("sub", e.target.value)} /></Field>
              <Field label="Button / call to action"><input className={inputCls} value={state.text.cta} maxLength={40} onChange={(e) => setT("cta", e.target.value)} /></Field>
              <Field label="Badge"><input className={inputCls} value={state.text.badge} maxLength={24} onChange={(e) => setT("badge", e.target.value)} placeholder="OUT NOW / COMING 12 MAY" /></Field>
              <Field label="Quote attribution"><input className={inputCls} value={state.text.attribution} maxLength={60} onChange={(e) => setT("attribution", e.target.value)} placeholder="Character or chapter" /></Field>
              <div className="sm:col-span-2"><Field label="Quote from your book" hint="Use your own words — not reviews you haven't received."><textarea className={inputCls} rows={3} maxLength={280} value={state.text.quote} onChange={(e) => setT("quote", e.target.value)} /></Field></div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {(["bg1", "bg2", "fg", "accent"] as const).map((k) => <label key={k} className="text-xs">{{ bg1: "Background", bg2: "Gradient", fg: "Text", accent: "Accent" }[k]}<input type="color" className="mt-1 h-9 w-full rounded-lg border border-border" value={state.style[k]} onChange={(e) => setS(k, e.target.value)} /></label>)}
            </div>
          </Panel>
        </div>

        <Panel title="3. Previews" actions={img && <PrimaryBtn disabled={!!busy} onClick={() => gate.require("Sign in to download your promo pack", () => void downloadPack())}><Package className="h-4 w-4" aria-hidden="true" />Download selected ({state.selected.length}) as ZIP</PrimaryBtn>}>
          {busy && <p role="status" className="mb-3 inline-flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{busy}</p>}
          {!img ? <p className="py-16 text-center text-sm text-muted-foreground">Upload or choose a cover to see every format rendered with it.</p> : !fonts ? <p className="py-16 text-center text-sm">Loading fonts…</p> : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {FORMATS.map((f) => (
                <li key={f.id} className="rounded-2xl border border-border p-3">
                  <Preview f={f} img={img} text={state.text} style={state.style} />
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.selected.includes(f.id)} onChange={(e) => setState((x) => ({ ...x, selected: e.target.checked ? [...x.selected, f.id] : x.selected.filter((y) => y !== f.id) }))} /><span><span className="font-semibold">{f.name}</span> <span className="text-xs text-muted-foreground">{f.w}×{f.h}</span></span></label>
                    <GhostBtn className="!px-3 !py-1 text-xs" onClick={() => gate.require("Sign in to download images", () => void downloadOne(f))}><Download className="h-3.5 w-3.5" aria-hidden="true" />PNG</GhostBtn>
                  </div>
                  <p className="text-xs text-muted-foreground">{f.use}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 border-t border-border pt-4">
            <SaveBar kind="mockup" title={state.title || "Promo graphics"} data={state} meta={{ formats: state.selected.length }} projectId={s.projectId} setProjectId={s.setProjectId} gateRequire={gate.require} disabled={!state.cover} />
          </div>
        </Panel>
      </div>
      <ServiceCta service="book-mockups-graphics" title="Want a full promotional graphics package?" body="We design a consistent launch pack — mockups, posts, stories, ads, banners and email headers — matched to your cover and campaign." cta="Request a graphics package" />
      {gate.gate}
    </div>
  );
}

function Preview({ f, img, text, style }: { f: Format; img: HTMLImageElement; text: PromoText; style: PromoStyle }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const k = Math.min(1, 640 / f.w); c.width = Math.round(f.w * k); c.height = Math.round(f.h * k);
    const ctx = c.getContext("2d")!; ctx.save(); ctx.scale(k, k); renderFormat(ctx, f, img, text, style); ctx.restore();
  }, [f, img, text, style]);
  return <canvas ref={ref} role="img" aria-label={`${f.name} preview`} className="h-auto w-full rounded-lg" />;
}
