import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
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
} from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../ui/dialog";
import BusinessIntakeForm from "../intake/BusinessIntakeForm";
import { useI18n } from "@/lib/i18n";
import { homeExperienceCopy } from "@/lib/home-experience-copy";
import { cleanGeneratedHtml, previewDocument } from "@/lib/prototype";
import { track } from "@/lib/analytics";

type Device = "desktop" | "tablet" | "mobile";
type Mode = "new" | "refine" | "regenerate";

const DEVICES: { id: Device; icon: typeof Monitor }[] = [
  { id: "desktop", icon: Monitor },
  { id: "tablet", icon: Tablet },
  { id: "mobile", icon: Smartphone },
];

/** Closing tags that tell us the model produced a usable document, not a cut-off fragment. */
const COMPLETE_MARKUP = /<\/(html|body|main|section|div)>\s*$/i;

export default function PrototypeBuilder() {
  const { lang } = useI18n();
  const c = homeExperienceCopy[lang];
  const [prompt, setPrompt] = useState("");
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [html, setHtml] = useState("");
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
  const abort = useRef<AbortController | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    if (!busy) return;
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, 2)), 6000);
    return () => clearInterval(timer);
  }, [busy]);

  async function generate(mode: Mode) {
    const idea = (mode === "new" ? prompt : originalPrompt).trim();
    if (busy || paused || idea.length < 8) return;
    if (mode === "refine" && !change.trim()) return;
    setBusy(true);
    setError("");
    setBytes(0);
    setStage(0);
    // Bring the preview into view on small screens so people see the progress.
    if (window.innerWidth < 1024) previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    const controller = new AbortController();
    abort.current = controller;
    let accumulated = "";
    let completed = false;
    try {
      const response = await fetch("/api/prototype", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: idea,
          language: lang,
          ...(mode === "refine" ? { html, refinement: change.trim() } : {}),
        }),
      });
      if (!response.ok) {
        let message = "Generation is unavailable right now. Please try again later.";
        try {
          const value = (await response.json()) as { message?: string };
          if (value.message) message = value.message;
        } catch {
          /* non-JSON error page */
        }
        if (response.status === 429) {
          setRemaining(0);
          track("prototype_limit_hit");
        } else if ([401, 402, 403, 404, 503].includes(response.status)) {
          setPaused(true);
        }
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
          const event = JSON.parse(line) as { type: string; text?: string; message?: string };
          if (event.type === "text" && event.text) {
            accumulated += event.text;
            setBytes(accumulated.length);
            setStage(2);
          }
          if (event.type === "done") completed = true;
          if (event.type === "error") throw new Error(event.message || "Your prototype could not be completed.");
        }
      }
      const cleaned = cleanGeneratedHtml(accumulated);
      if (!completed || !COMPLETE_MARKUP.test(cleaned)) {
        throw new Error("The prototype was cut off before it finished. Please try again.");
      }
      setHtml(cleaned);
      setOriginalPrompt(idea);
      setRefining(false);
      setChange("");
      track(mode === "refine" ? "prototype_refined" : "prototype_generated", { mode, chars: idea.length });
    } catch (e) {
      if (!controller.signal.aborted) {
        setError(e instanceof Error ? e.message : "Generation could not finish. Please try again later.");
        track("prototype_failed", { mode });
      }
    } finally {
      setBusy(false);
      abort.current = null;
    }
  }

  const doc = html ? previewDocument(html) : "";
  const stages = [c.sketch, c.code, c.interactions];
  const canSubmit = !busy && !paused && prompt.trim().length >= 8;

  return (
    <section id="prototype" className="prototype-section relative overflow-hidden px-5 py-20 md:px-8 md:py-28">
      <div className="prototype-glow" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="eyebrow">
            <Sparkles className="h-3.5 w-3.5" /> {c.eyebrow}
          </span>
          <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">{c.title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">{c.subtitle}</p>
          <ol className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {[c.step1, c.step2, c.step3].map((step, i) => (
              <li key={step} className="flex items-center gap-2">
                <span className="step-dot">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
          {/* Prompt column */}
          <div className="lg:sticky lg:top-28">
            <form
              className="prototype-prompt"
              onSubmit={(e) => {
                e.preventDefault();
                void generate("new");
              }}
            >
              <label htmlFor="prototype-prompt" className="sr-only">
                {c.placeholder}
              </label>
              <textarea
                id="prototype-prompt"
                placeholder={c.placeholderHint}
                maxLength={500}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    void generate("new");
                  }
                }}
                disabled={busy}
                rows={5}
                className="block w-full resize-none bg-transparent p-5 text-base leading-relaxed outline-none placeholder:text-muted-foreground/70"
              />
              <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
                <span className="text-xs tabular-nums text-muted-foreground">{prompt.length}/500</span>
                <Button type="submit" disabled={!canSubmit} className="btn-gold h-11 rounded-full px-5">
                  {busy ? <Loader2 className="animate-spin" /> : <WandSparkles />}
                  {busy ? c.generating : c.generate}
                </Button>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {c.examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  disabled={busy}
                  onClick={() => setPrompt(example)}
                  className="example-chip"
                >
                  {example}
                </button>
              ))}
            </div>

            <p className="mt-5 text-xs text-muted-foreground">
              {remaining !== null && remaining > 0 ? (remaining === 1 ? c.remainingOne : c.remaining.replace("{n}", String(remaining))) : c.freeNote}
            </p>

            {error && (
              <div role="alert" className="mt-4 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-foreground">
                {error}
              </div>
            )}
          </div>

          {/* Preview column */}
          <div ref={previewRef} className="prototype-browser scroll-mt-28">
            <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              </div>
              <div className="hidden min-w-0 flex-1 truncate rounded-md bg-muted px-3 py-1 text-center text-xs text-muted-foreground sm:block">
                {originalPrompt || c.preview}
              </div>
              <div className="flex items-center gap-0.5">
                {DEVICES.map(({ id, icon: Icon }) => (
                  <Button
                    key={id}
                    size="icon"
                    variant={device === id ? "secondary" : "ghost"}
                    className="h-8 w-8"
                    title={c[id]}
                    aria-label={c[id]}
                    aria-pressed={device === id}
                    onClick={() => setDevice(id)}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                ))}
                <span className="mx-1 h-5 border-l border-border" />
                <Button size="icon" variant="ghost" className="h-8 w-8" title={c.refine} aria-label={c.refine} disabled={!html || busy || paused} onClick={() => setRefining((s) => !s)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" title={c.regenerate} aria-label={c.regenerate} disabled={!html || busy || paused} onClick={() => void generate("regenerate")}>
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" title={c.fullscreen} aria-label={c.fullscreen} disabled={!html} onClick={() => setFull(true)}>
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {refining && (
              <form
                className="flex flex-wrap gap-2 border-b border-border p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void generate("refine");
                }}
              >
                <input
                  aria-label={c.change}
                  placeholder={c.change}
                  maxLength={500}
                  value={change}
                  onChange={(e) => setChange(e.target.value)}
                  autoFocus
                  className="min-w-0 flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button type="submit" className="rounded-full" disabled={busy || !change.trim()}>
                  {c.apply}
                </Button>
              </form>
            )}

            <div className="prototype-stage">
              {html && !busy ? (
                <iframe title={c.preview} srcDoc={doc} sandbox="allow-scripts allow-forms" className={`prototype-iframe device-${device}`} />
              ) : (
                <div className="flex min-h-[460px] w-full flex-col items-center justify-center px-6 text-center">
                  {busy ? (
                    <>
                      <div className="build-orb" aria-hidden="true" />
                      <ul className="mt-8 space-y-2 text-left text-sm" aria-live="polite">
                        {stages.map((label, i) => (
                          <li key={label} className={`flex items-center gap-2 transition-opacity ${i <= stage ? "opacity-100" : "opacity-35"}`}>
                            {i < stage ? <Check className="h-4 w-4 text-emma-blue" /> : i === stage ? <Loader2 className="h-4 w-4 animate-spin text-emma-blue" /> : <span className="h-4 w-4" />}
                            {label}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-4 font-mono text-xs tabular-nums text-muted-foreground">{bytes ? `${bytes.toLocaleString()} characters written` : " "}</p>
                      <Button variant="outline" size="sm" onClick={() => abort.current?.abort()} className="mt-5 rounded-full">
                        <Square className="h-3.5 w-3.5" />
                        {c.stop}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="empty-preview" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </div>
                      <p className="mt-6 font-display text-lg font-bold text-foreground">{c.empty}</p>
                      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{c.subtitle}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {html && !busy && (
          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <p className="max-w-xl text-sm text-muted-foreground">{c.demoNote}</p>
            <Button
              onClick={() => {
                track("prototype_build_real_click");
                setIntake(true);
              }}
              className="btn-gold h-auto whitespace-normal rounded-full px-7 py-3.5 text-base"
            >
              {c.hook}
              <ArrowUpRight />
            </Button>
          </div>
        )}
      </div>

      <Dialog open={full} onOpenChange={setFull}>
        <DialogContent className="flex h-[92dvh] w-[96vw] max-w-none flex-col gap-3 p-3">
          <DialogTitle className="px-1 text-sm">{c.preview}</DialogTitle>
          <DialogDescription className="sr-only">{originalPrompt}</DialogDescription>
          <iframe title={`${c.preview} fullscreen`} srcDoc={doc} sandbox="allow-scripts allow-forms" className="min-h-0 w-full flex-1 rounded-md border border-border bg-white" />
        </DialogContent>
      </Dialog>
      <Dialog open={intake} onOpenChange={setIntake}>
        <DialogContent className="max-h-[90dvh] w-[95vw] max-w-3xl overflow-y-auto">
          <DialogTitle>{c.intake}</DialogTitle>
          <DialogDescription className="sr-only">{originalPrompt}</DialogDescription>
          <BusinessIntakeForm initialDescription={originalPrompt} onClose={() => setIntake(false)} />
        </DialogContent>
      </Dialog>
    </section>
  );
}
