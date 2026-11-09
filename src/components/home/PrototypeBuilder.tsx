import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ImagePlus,
  LayoutTemplate,
  Loader2,
  Maximize2,
  Monitor,
  Pencil,
  RotateCw,
  Smartphone,
  Sparkles,
  Square,
  Tablet,
  WandSparkles,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../ui/dialog";
import BusinessIntakeForm from "../intake/BusinessIntakeForm";
import SectionHead from "../future/SectionHead";
import PhoneFrame, { type Platform } from "../prototype/PhoneFrame";
import PlanEditor, { PlanSplash } from "../prototype/PlanEditor";
import { MakeItReal, SaveDialog, type SavePayload } from "../prototype/SavePrototype";
import { useI18n } from "@/lib/i18n";
import { homeExperienceCopy } from "@/lib/home-experience-copy";
import { prototypeCopy } from "@/lib/prototype-copy";
import { DEFAULT_PAGES, WEBSITE_PAGES, cleanGeneratedHtml, previewDocument, suggestPlan, type PlanSuggestion, type ProtoKind, type ProtoPlan } from "@/lib/prototype";
import { track } from "@/lib/analytics";

type Device = "desktop" | "tablet" | "mobile";
type Mode = "new" | "refine" | "regenerate" | "repair";

const DEVICES: { id: Device; icon: typeof Monitor }[] = [
  { id: "desktop", icon: Monitor },
  { id: "tablet", icon: Tablet },
  { id: "mobile", icon: Smartphone },
];

/** Closing tags that tell us the model produced a usable document, not a cut-off fragment. */
const COMPLETE_MARKUP = /<\/(html|body|main|section|div)>\s*$/i;

/** Shrink an uploaded logo to at most 256px so it can travel inside the prototype as a data: URL. */
async function readLogo(file: File): Promise<string> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 5_000_000) throw new Error("type");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = url; });
    const k = Math.min(1, 256 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * k));
    canvas.height = Math.max(1, Math.round(img.height * k));
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const out = canvas.toDataURL("image/png");
    return out.length < 190000 ? out : canvas.toDataURL("image/webp", 0.85);
  } finally { URL.revokeObjectURL(url); }
}

interface Built { kind: ProtoKind; html: string; sig: string; prompt: string; plan?: ProtoPlan; pages?: string[] }

export default function PrototypeBuilder() {
  const { lang } = useI18n();
  const c = homeExperienceCopy[lang];
  const p = prototypeCopy[lang];
  const [kind, setKind] = useState<ProtoKind>("website");
  const [prompt, setPrompt] = useState("");
  const [business, setBusiness] = useState("");
  const [color, setColor] = useState("#6d5bff");
  const [colorSet, setColorSet] = useState(false);
  const [logo, setLogo] = useState("");
  const [pages, setPages] = useState<string[]>(DEFAULT_PAGES);
  const [platform, setPlatform] = useState<Platform>("ios");
  const [plan, setPlan] = useState<ProtoPlan | null>(null);
  const [planAi, setPlanAi] = useState(true);
  const [planning, setPlanning] = useState(false);
  const [built, setBuilt] = useState<Built | null>(null);
  const [bytes, setBytes] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [paused, setPaused] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [stage, setStage] = useState(0);
  const [device, setDevice] = useState<Device>("desktop");
  const [refining, setRefining] = useState(false);
  const [change, setChange] = useState("");
  const [full, setFull] = useState(false);
  const [intake, setIntake] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saved, setSaved] = useState<{ slug: string; suggestion: PlanSuggestion } | null>(null);
  const [frameKey, setFrameKey] = useState(0);
  const [fixing, setFixing] = useState(false);
  const repairBudget = useRef(0);
  const abort = useRef<AbortController | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => abort.current?.abort(), []);
  // Industry pages link here with the idea filled in: /?proto_kind=app&proto_idea=…#prototype
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const idea = q.get("proto_idea");
      const k = q.get("proto_kind");
      if (k === "app" || k === "website") setKind(k);
      if (idea) {
        setPrompt(idea.slice(0, 500));
        track("prototype_prefilled", { kind: k ?? "website" });
        window.setTimeout(() => document.getElementById("prototype")?.scrollIntoView({ behavior: "smooth", block: "start" }), 400);
      }
    } catch { /* ignore malformed links */ }
  }, []);
  useEffect(() => {
    if (!busy) return;
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, 2)), 6000);
    return () => clearInterval(timer);
  }, [busy]);

  const brand = { name: business.trim() || undefined, color: colorSet ? color : undefined, hasLogo: Boolean(logo) };
  const showApp = built ? built.kind === "app" : kind === "app";

  async function makePlan() {
    const idea = prompt.trim();
    if (planning || busy || paused || idea.length < 8) return;
    setPlanning(true); setError(""); setBuilt(null); setSaved(null); setRefining(false);
    try {
      const res = await fetch("/api/prototype-plan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "app", idea, business: brand.name, color: brand.color, language: lang }),
      });
      const v = (await res.json().catch(() => ({}))) as { plan?: ProtoPlan; aiWritten?: boolean; message?: string };
      if (!res.ok || !v.plan) throw new Error(v.message || "We couldn't plan your app just now. Please try again.");
      setPlan(v.plan); setPlanAi(v.aiWritten !== false);
      track("prototype_planned", { ai: v.aiWritten !== false, screens: v.plan.screens.length });
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't plan your app just now.");
    } finally { setPlanning(false); }
  }

  async function generate(mode: Mode, repairError?: string) {
    const base = mode === "new" ? null : built;
    const k: ProtoKind = base ? base.kind : kind;
    const idea = (base ? base.prompt : prompt).trim();
    if (busy || paused || idea.length < 8) return;
    if (mode === "refine" && !change.trim()) return;
    if (mode === "repair" && (!base || !repairError)) return;
    const usePlan = k === "app" ? (base?.plan ?? plan) : undefined;
    if (k === "app" && !usePlan) return;
    const usePages = k === "website" ? (base?.pages ?? pages) : undefined;
    setBusy(true); setError(""); setBytes(0); setStage(0); setFixing(mode === "repair");
    if (window.innerWidth < 1024) previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    const controller = new AbortController();
    abort.current = controller;
    let accumulated = "";
    let sig = "";
    let completed = false;
    try {
      const response = await fetch("/api/prototype", {
        method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: k, prompt: idea, language: lang, brand,
          ...(k === "app" ? { plan: usePlan } : { pages: usePages }),
          ...(mode === "refine" && base ? { html: base.html, refinement: change.trim() } : {}),
          ...(mode === "repair" && base ? { html: base.html, refinement: repairError, repair: true } : {}),
        }),
      });
      if (!response.ok) {
        let message = "Generation is unavailable right now. Please try again later.";
        try { const value = (await response.json()) as { message?: string }; if (value.message) message = value.message; } catch { /* non-JSON */ }
        if (response.status === 429) { setRemaining(0); track("prototype_limit_hit"); }
        else if ([401, 402, 403, 404, 503].includes(response.status)) setPaused(true);
        throw new Error(message);
      }
      const left = Number(response.headers.get("X-Prototypes-Remaining"));
      if (Number.isFinite(left) && response.headers.has("X-Prototypes-Remaining")) setRemaining(left);
      if (!response.body) throw new Error("The AI service returned no prototype.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        let pos: number;
        while ((pos = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, pos);
          buffer = buffer.slice(pos + 1);
          if (!line.trim()) continue;
          const event = JSON.parse(line) as { type: string; text?: string; message?: string; sig?: string };
          if (event.type === "text" && event.text) { accumulated += event.text; setBytes(accumulated.length); setStage(2); }
          if (event.type === "done") { completed = true; sig = event.sig ?? ""; }
          if (event.type === "error") throw new Error(event.message || "Your prototype could not be completed.");
        }
      }
      const cleaned = cleanGeneratedHtml(accumulated);
      if (!completed || !COMPLETE_MARKUP.test(cleaned)) throw new Error("The prototype was cut off before it finished. Please try again.");
      setBuilt({ kind: k, html: cleaned, sig, prompt: idea, plan: usePlan ?? undefined, pages: usePages });
      if (mode !== "repair") repairBudget.current = 1;
      setSaved(null);
      setFrameKey((n) => n + 1);
      setRefining(false); setChange("");
      track(mode === "refine" ? "prototype_refined" : "prototype_generated", { mode, kind: k, chars: idea.length });
    } catch (e) {
      if (!controller.signal.aborted) {
        setError(e instanceof Error ? e.message : "Generation could not finish. Please try again later.");
        track("prototype_failed", { mode, kind: k });
      }
    } finally { setBusy(false); setFixing(false); abort.current = null; }
  }

  // The preview reports script errors (see REPORTER in lib/prototype). Repair once automatically; after that, say so.
  const builtRef = useRef(built); builtRef.current = built;
  const busyRef = useRef(busy); busyRef.current = busy;
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const msg = (e.data as { efyProtoError?: unknown } | null)?.efyProtoError;
      if (typeof msg !== "string" || !builtRef.current || busyRef.current) return;
      const ours = [...document.querySelectorAll<HTMLIFrameElement>("#prototype iframe, [role=dialog] iframe")].some((f) => f.contentWindow === e.source);
      if (!ours) return;
      if (repairBudget.current > 0) {
        repairBudget.current -= 1;
        track("prototype_repair", { kind: builtRef.current.kind });
        void generate("repair", msg.slice(0, 300));
      } else {
        setError(p.glitch);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  });

  const doc = useMemo(() => (built ? previewDocument(built.html, logo || null) : ""), [built, logo]);
  const stages = [c.sketch, c.code, c.interactions];
  const canSubmit = !busy && !paused && !planning && prompt.trim().length >= 8;
  const suggestion = saved?.suggestion ?? (built ? suggestPlan(built.kind, { screens: built.plan?.screens.length, pages: built.pages }) : null);
  const payload: SavePayload | null = built && built.sig ? {
    kind: built.kind, prompt: built.prompt, html: built.html, sig: built.sig, plan: built.plan, pages: built.pages,
    logo: logo || undefined, platform: built.kind === "app" ? platform : undefined, business: business.trim() || undefined,
  } : null;

  const progress = (
    <div className="flex min-h-[460px] w-full flex-col items-center justify-center px-6 text-center">
      <div className="build-orb" aria-hidden="true" />
      <ul className="mt-8 space-y-2 text-left text-sm" aria-live="polite">
        {stages.map((label, i) => (
          <li key={label} className={`flex items-center gap-2 transition-opacity ${i <= stage ? "opacity-100" : "opacity-35"}`}>
            {i < stage ? <Check className="h-4 w-4 text-emma-blue" /> : i === stage ? <Loader2 className="h-4 w-4 animate-spin text-emma-blue" /> : <span className="h-4 w-4" />}
            {label}
          </li>
        ))}
      </ul>
      {fixing && <p className="mt-4 text-sm font-semibold text-[var(--emma-violet)]">{p.fixing}</p>}
      <p className="mt-4 font-mono text-xs tabular-nums text-muted-foreground">{bytes ? `${bytes.toLocaleString()} characters written` : " "}</p>
      <Button variant="outline" size="sm" onClick={() => abort.current?.abort()} className="mt-5 rounded-full"><Square className="h-3.5 w-3.5" />{c.stop}</Button>
    </div>
  );

  const toolbar = (
    <div className="flex items-center gap-0.5">
      {showApp ? (
        (["ios", "android"] as Platform[]).map((pl) => (
          <Button key={pl} size="sm" variant={platform === pl ? "secondary" : "ghost"} className="h-8 rounded-full px-3 text-xs" aria-pressed={platform === pl} onClick={() => setPlatform(pl)}>{pl === "ios" ? p.iphone : p.android}</Button>
        ))
      ) : (
        DEVICES.map(({ id, icon: Icon }) => (
          <Button key={id} size="icon" variant={device === id ? "secondary" : "ghost"} className="h-8 w-8" title={c[id]} aria-label={c[id]} aria-pressed={device === id} onClick={() => setDevice(id)}><Icon className="h-4 w-4" /></Button>
        ))
      )}
      <span className="mx-1 h-5 border-l border-border" />
      <Button size="icon" variant="ghost" className="h-8 w-8" title={c.refine} aria-label={c.refine} disabled={!built || busy || paused} onClick={() => setRefining((s) => !s)}><Pencil className="h-4 w-4" /></Button>
      <Button size="icon" variant="ghost" className="h-8 w-8" title={c.regenerate} aria-label={c.regenerate} disabled={!built || busy || paused} onClick={() => void generate("regenerate")}><RotateCw className="h-4 w-4" /></Button>
      <Button size="icon" variant="ghost" className="h-8 w-8" title={c.fullscreen} aria-label={c.fullscreen} disabled={!built} onClick={() => setFull(true)}><Maximize2 className="h-4 w-4" /></Button>
    </div>
  );

  const refineForm = refining && (
    <form className="flex flex-wrap gap-2 border-b border-border p-3" onSubmit={(e) => { e.preventDefault(); void generate("refine"); }}>
      <input aria-label={c.change} placeholder={c.change} maxLength={500} value={change} onChange={(e) => setChange(e.target.value)} autoFocus className="min-w-0 flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      <Button type="submit" className="rounded-full" disabled={busy || !change.trim()}>{c.apply}</Button>
    </form>
  );

  const ideaForm = (
    <>
      <div className="efy-kind" role="radiogroup" aria-label={`${p.website} / ${p.app}`}>
        {([["website", LayoutTemplate, p.website, p.websiteHint], ["app", Smartphone, p.app, p.appHint]] as const).map(([id, Icon, label, hint]) => (
          <button key={id} type="button" role="radio" aria-checked={kind === id} disabled={busy || planning} onClick={() => { setKind(id); setPlan(null); setError(""); }} className="efy-kind-opt">
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span><strong>{label}</strong><small>{hint}</small></span>
          </button>
        ))}
      </div>
      <form className="prototype-prompt mt-4" onSubmit={(e) => { e.preventDefault(); if (kind === "app") void makePlan(); else void generate("new"); }}>
        <label htmlFor="prototype-prompt" className="sr-only">{c.placeholder}</label>
        <textarea
          id="prototype-prompt"
          placeholder={kind === "app" ? p.appPlaceholder : c.placeholderHint}
          maxLength={500}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (kind === "app") void makePlan(); else void generate("new"); } }}
          disabled={busy || planning}
          rows={4}
          className="block w-full resize-none bg-transparent p-5 text-base leading-relaxed outline-none placeholder:text-muted-foreground/70"
        />
        <div className="grid gap-3 border-t border-border px-4 py-3">
          <div className="grid grid-cols-[auto_auto_1fr] items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <label className="col-span-3 grid gap-1 text-xs font-medium text-muted-foreground sm:col-span-1" htmlFor="proto-business">{p.businessName}
              <input id="proto-business" maxLength={60} value={business} onChange={(e) => setBusiness(e.target.value)} disabled={busy || planning} className="efy-input text-sm text-foreground" />
            </label>
            <label className="grid gap-1 text-xs font-medium text-muted-foreground" htmlFor="proto-color">{p.brandColor}
              <input id="proto-color" type="color" value={color} onChange={(e) => { setColor(e.target.value); setColorSet(true); }} disabled={busy || planning} className="efy-swatch" />
            </label>
            <div className="grid gap-1 text-xs font-medium text-muted-foreground">
              <span>{p.logo}</span>
              {logo ? (
                <span className="flex items-center gap-2"><img src={logo} alt="" className="h-9 w-9 rounded-md border border-border object-contain" /><Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label={p.removeLogo} onClick={() => setLogo("")}><X className="h-4 w-4" /></Button></span>
              ) : (
                <label className="efy-upload" htmlFor="proto-logo"><ImagePlus className="h-4 w-4" aria-hidden="true" /><span className="sr-only">{p.logo}</span>
                  <input id="proto-logo" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={busy || planning} onChange={async (e) => {
                    const f = e.target.files?.[0]; e.target.value = "";
                    if (!f) return;
                    try { setLogo(await readLogo(f)); } catch { setError(p.logoTooBig); }
                  }} />
                </label>
              )}
            </div>
          </div>
          {kind === "website" && (
            <fieldset>
              <legend className="text-xs font-medium text-muted-foreground">{p.pages}</legend>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {WEBSITE_PAGES.map((pg) => {
                  const on = pages.includes(pg);
                  return (
                    <button key={pg} type="button" aria-pressed={on} disabled={busy || (pg === "Home") || (!on && pages.length >= 7)} onClick={() => setPages((cur) => (on ? cur.filter((x) => x !== pg) : WEBSITE_PAGES.filter((x) => cur.includes(x) || x === pg)))} className="efy-page-chip">{pg}</button>
                  );
                })}
              </div>
            </fieldset>
          )}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs tabular-nums text-muted-foreground">{prompt.length}/500</span>
            <Button type="submit" disabled={!canSubmit} className="btn-gold h-11 rounded-full px-5">
              {busy || planning ? <Loader2 className="animate-spin" /> : <WandSparkles />}
              {kind === "app" ? (planning ? p.planning : p.planApp) : busy ? c.generating : c.generate}
            </Button>
          </div>
        </div>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        {(kind === "app" ? p.appExamples : c.examples).map((example) => (
          <button key={example} type="button" disabled={busy || planning} onClick={() => setPrompt(example)} className="example-chip">{example}</button>
        ))}
      </div>
    </>
  );

  return (
    <section id="prototype" className="prototype-section relative overflow-clip px-5 py-20 md:px-8 md:py-28">
      <div className="prototype-glow" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl">
        <SectionHead align="center" className="max-w-3xl" kicker={<><Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> {c.eyebrow}</>} title={c.title} sub={c.subtitle}>
          <ol className="pb-steps mt-8">
            {[c.step1, c.step2, c.step3].map((step, i) => (
              <li key={step} style={{ ["--i" as string]: i }}><span className="step-dot">{i + 1}</span>{step}</li>
            ))}
          </ol>
        </SectionHead>

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
          <div className="min-w-0 lg:sticky lg:top-28">
            {kind === "app" && plan && !built ? (
              <PlanEditor plan={plan} onChange={setPlan} onBuild={() => void generate("new")} onBack={() => setPlan(null)} busy={busy} aiWritten={planAi} c={p} />
            ) : (
              ideaForm
            )}
            {built && !busy && (
              <Button type="button" variant="ghost" size="sm" className="mt-3 rounded-full" onClick={() => { setBuilt(null); setSaved(null); setRefining(false); }}>{p.backToIdea}</Button>
            )}
            <p className="mt-5 text-xs text-muted-foreground">
              {remaining !== null && remaining > 0 ? (remaining === 1 ? c.remainingOne : c.remaining.replace("{n}", String(remaining))) : c.freeNote}
            </p>
            {error && <div role="alert" className="mt-4 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-foreground">{error}</div>}
          </div>

          <div ref={previewRef} className="min-w-0 scroll-mt-28">
            {showApp ? (
              <div className="efy-phone-stage" data-busy={busy || undefined}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">{built && !busy ? p.tapHint : c.preview}</p>
                  {toolbar}
                </div>
                {refineForm}
                <PhoneFrame platform={platform} label={built?.plan?.name ?? plan?.name}>
                  {built && !busy ? (
                    <iframe key={frameKey} title={c.preview} srcDoc={doc} sandbox="allow-scripts allow-forms" />
                  ) : busy ? (
                    <div className="h-full overflow-auto bg-background">{progress}</div>
                  ) : plan ? (
                    <PlanSplash plan={plan} />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 bg-background px-8 text-center">
                      <div className="empty-preview" aria-hidden="true"><span /><span /><span /></div>
                      <p className="font-display text-lg font-bold text-foreground">{c.empty}</p>
                      <p className="text-sm text-muted-foreground">{p.appHint}</p>
                    </div>
                  )}
                </PhoneFrame>
              </div>
            ) : (
              <div className="prototype-browser" data-scroll data-busy={busy || undefined}>
                <span className="pb-beam" aria-hidden="true" />
                <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5">
                  <div className="flex items-center gap-1.5" aria-hidden="true">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="hidden min-w-0 flex-1 truncate rounded-md bg-muted px-3 py-1 text-center text-xs text-muted-foreground sm:block">{built?.prompt || c.preview}</div>
                  {toolbar}
                </div>
                {refineForm}
                <div className="prototype-stage">
                  {built && !busy ? (
                    <iframe key={frameKey} title={c.preview} srcDoc={doc} sandbox="allow-scripts allow-forms" className={`prototype-iframe device-${device}`} />
                  ) : busy ? progress : (
                    <div className="flex min-h-[460px] w-full flex-col items-center justify-center px-6 text-center">
                      <div className="empty-preview" aria-hidden="true"><span /><span /><span /></div>
                      <p className="mt-6 font-display text-lg font-bold text-foreground">{c.empty}</p>
                      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{c.subtitle}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {built && !busy && suggestion && (
          <div className="mt-8 grid gap-3">
            <p className="text-center text-sm text-muted-foreground">{c.demoNote}</p>
            <MakeItReal kind={built.kind} suggestion={suggestion} c={p} slug={saved?.slug} onSave={() => { setSaveOpen(true); track("cta_click", { cta: "prototype_save_open", kind: built.kind }); }} />
            <p className="text-center text-xs text-muted-foreground">
              <button type="button" className="font-semibold text-[var(--emma-violet)] underline-offset-2 hover:underline" onClick={() => { track("prototype_build_real_click"); setIntake(true); }}>{c.hook}</button>
            </p>
          </div>
        )}
      </div>

      <Dialog open={full} onOpenChange={setFull}>
        <DialogContent className="flex h-[92dvh] w-[96vw] max-w-none flex-col gap-3 p-3">
          <DialogTitle className="px-1 text-sm">{c.preview}</DialogTitle>
          <DialogDescription className="sr-only">{built?.prompt}</DialogDescription>
          {built?.kind === "app" ? (
            <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto"><PhoneFrame platform={platform} maxHeight={typeof window !== "undefined" ? window.innerHeight * 0.82 : 760}><iframe title={`${c.preview} fullscreen`} srcDoc={doc} sandbox="allow-scripts allow-forms" /></PhoneFrame></div>
          ) : (
            <iframe title={`${c.preview} fullscreen`} srcDoc={doc} sandbox="allow-scripts allow-forms" className="min-h-0 w-full flex-1 rounded-md border border-border bg-white" />
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={intake} onOpenChange={setIntake}>
        <DialogContent className="max-h-[90dvh] w-[95vw] max-w-3xl overflow-y-auto">
          <DialogTitle>{c.intake}</DialogTitle>
          <DialogDescription className="sr-only">{built?.prompt}</DialogDescription>
          <BusinessIntakeForm initialDescription={built?.prompt ?? prompt} onClose={() => setIntake(false)} />
        </DialogContent>
      </Dialog>
      <SaveDialog open={saveOpen} onOpenChange={setSaveOpen} payload={payload} c={p} onSaved={(slug, s) => setSaved({ slug, suggestion: s })} />
    </section>
  );
}
