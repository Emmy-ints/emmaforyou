import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { LeadCapture } from "../tools/LeadCapture";
import { defaults, run, type Answers, type LabConfig, type Template } from "@/lib/lab/engine";

/**
 * Renders an Innovation Lab item from its config. The same component powers the admin preview
 * and the public page, so what's tested is exactly what visitors get.
 */
export default function LabRunner({ template, config, title, preview = false }: { template: Template; config: LabConfig; title: string; preview?: boolean }) {
  const [a, setA] = useState<Answers>(() => defaults(config));
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const res = useMemo(() => { try { return { ok: true as const, r: run(template, config, a, title) }; } catch (e) { return { ok: false as const, msg: (e as Error).message }; } }, [template, config, a, title]);
  const set = (id: string, v: Answers[string]) => setA((x) => ({ ...x, [id]: v }));
  const live = ["calculator", "assessment", "configurator", "proposal", "recommender"].includes(template);

  if (template === "demo") {
    const steps = config.steps ?? [];
    const s = steps[step];
    return (
      <div className="lab-run">
        <p className="text-sm text-muted-foreground">{config.intro}</p>
        <ol className="lab-steps mt-4" aria-label="Steps">{steps.map((x, i) => <li key={i} aria-current={i === step ? "step" : undefined} className={i <= step ? "is-done" : ""}><span>{i + 1}</span></li>)}</ol>
        {s && <div className="lab-card mt-4" aria-live="polite"><p className="font-display text-lg font-semibold">{s.title}</p><p className="mt-1 text-sm text-muted-foreground">{s.text}</p></div>}
        <div className="mt-4 flex gap-2">
          <button type="button" className="nav-ghost" disabled={step === 0} onClick={() => setStep((x) => x - 1)}><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back</button>
          {step < steps.length - 1 ? <button type="button" className="btn-primary-gradient inline-flex items-center gap-1 rounded-full px-5 py-2 text-sm font-semibold text-white" onClick={() => setStep((x) => x + 1)}>Next<ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
            : config.cta && <Link to={config.cta.to} className="btn-primary-gradient inline-flex items-center rounded-full px-5 py-2 text-sm font-semibold text-white">{config.cta.label}</Link>}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Demonstration with sample data.</p>
      </div>
    );
  }

  if (template === "assistant") {
    const as = config.assistant;
    return (
      <div className="lab-run">
        <p className="text-sm text-muted-foreground">{config.intro}</p>
        <ul className="mt-4 flex flex-wrap gap-2">{(as?.starters ?? []).map((q) => (
          <li key={q}><button type="button" className="tsh-chip" onClick={() => window.dispatchEvent(new CustomEvent("efy-open-ask", { detail: `About ${as?.topic ?? title}: ${q}` }))}><Sparkles className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />{q}</button></li>
        ))}</ul>
        <p className="mt-3 text-xs text-muted-foreground">Answers come from Emma AI, the site's assistant. AI can make mistakes; Emmanuel can take over any conversation.</p>
      </div>
    );
  }

  return (
    <div className="lab-run">
      <p className="text-sm text-muted-foreground">{config.intro}</p>
      <form className="mt-4 grid gap-4" onSubmit={(e) => { e.preventDefault(); setDone(true); }}>
        {config.fields.map((f) => (
          <fieldset key={f.id} className="lab-field">
            <legend className="text-sm font-medium">{f.label}</legend>
            {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
            {f.type === "number" && <input type="number" className="input mt-1 w-full max-w-xs" min={f.min} max={f.max} step={f.step ?? "any"} value={String(a[f.id] ?? "")} onChange={(e) => set(f.id, e.target.value === "" ? 0 : Number(e.target.value))} aria-label={f.label} />}
            {f.type === "text" && <textarea className="input mt-1 min-h-[70px] w-full" maxLength={600} value={String(a[f.id] ?? "")} onChange={(e) => set(f.id, e.target.value)} aria-label={f.label} />}
            {f.type === "choice" && <div className="mt-1 flex flex-wrap gap-2">{(f.options ?? []).map((o) => <button key={o.value} type="button" aria-pressed={a[f.id] === o.value} className="sf-goal" onClick={() => set(f.id, o.value)}>{a[f.id] === o.value && <Check className="h-3.5 w-3.5" aria-hidden="true" />}{o.label}{o.price ? <span className="text-xs text-muted-foreground">+{config.currency ?? "$"}{o.price}</span> : null}</button>)}</div>}
            {f.type === "multi" && <div className="mt-1 flex flex-wrap gap-2">{(f.options ?? []).map((o) => { const on = ((a[f.id] as string[]) ?? []).includes(o.value); return <button key={o.value} type="button" aria-pressed={on} className="sf-goal" onClick={() => set(f.id, on ? ((a[f.id] as string[]) ?? []).filter((x) => x !== o.value) : [...((a[f.id] as string[]) ?? []), o.value])}>{on && <Check className="h-3.5 w-3.5" aria-hidden="true" />}{o.label}{o.price ? <span className="text-xs text-muted-foreground">+{config.currency ?? "$"}{o.price}</span> : null}</button>; })}</div>}
          </fieldset>
        ))}
        {!live && <div><button type="submit" className="btn-primary-gradient inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white">Continue</button></div>}
      </form>

      {(live || done) && (
        <div className="lab-card mt-5" aria-live="polite">
          {!res.ok ? <p className="text-sm text-red-600">This tool couldn't calculate a result: {res.msg}</p> : <>
            {res.r.headline && <p className="font-display text-3xl font-semibold">{res.r.headline}</p>}
            {res.r.text && <p className="mt-1 text-sm text-muted-foreground">{res.r.text}</p>}
            {res.r.items && res.r.items.length > 0 && <ul className="mt-3 space-y-2">{res.r.items.map((it) => <li key={it.href}><Link to={it.href} className="font-semibold text-[var(--emma-violet)] hover:underline">{it.name}</Link> <span className="text-sm text-muted-foreground">for {it.why}</span></li>)}</ul>}
            {template === "onboarding" && <p className="text-sm">Thanks — here's what you told us. Send it to Emmanuel below.</p>}
          </>}
          {config.cta && <Link to={config.cta.to} className="mt-4 inline-flex rounded-full border border-border px-4 py-2 text-sm font-semibold">{config.cta.label} →</Link>}
        </div>
      )}
      {config.lead && res.ok && (live || done) && (preview
        ? <p className="mt-4 rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">Preview: the enquiry form appears here for visitors. It's disabled in the lab so tests don't create real leads.</p>
        : <div className="mt-4"><LeadCapture compact tool="Lab enquiry" title="Send this to Emmanuel" lead="Leave a WhatsApp number or email and he'll reply personally." button="Send" summary={res.r.summary} /></div>)}
      <p className="mt-3 text-xs text-muted-foreground">Results are estimates to help you plan, not a quote or guarantee.</p>
    </div>
  );
}
