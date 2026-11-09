import { useState } from "react";
import { ArrowLeft, Plus, WandSparkles, X } from "lucide-react";
import { Button } from "../ui/button";
import type { ProtoPlan } from "@/lib/prototype";
import type { PrototypeCopy } from "@/lib/prototype-copy";

const idFrom = (name: string, taken: string[]) => {
  let id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/^[^a-z]+/, "").slice(0, 20) || "screen";
  let n = 2;
  const base = id;
  while (taken.includes(id)) id = `${base}-${n++}`;
  return id;
};

/** Step 2 of the app builder: the visitor checks and edits the AI's plan before anything is built. */
export default function PlanEditor({ plan, onChange, onBuild, onBack, busy, aiWritten, c }: {
  plan: ProtoPlan; onChange: (p: ProtoPlan) => void; onBuild: () => void; onBack: () => void; busy: boolean; aiWritten: boolean; c: PrototypeCopy;
}) {
  const [newScreen, setNewScreen] = useState("");
  const [newFeature, setNewFeature] = useState("");
  const set = (patch: Partial<ProtoPlan>) => onChange({ ...plan, ...patch });
  const tabs = plan.screens.filter((s) => s.tab).length;

  return (
    <div className="prototype-prompt efy-plan" aria-labelledby="efy-plan-title">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h3 id="efy-plan-title" className="font-display text-base font-bold">{c.planTitle}</h3>
        <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={onBack} disabled={busy}><ArrowLeft className="h-4 w-4" /> {c.backToIdea}</Button>
      </div>
      <div className="grid gap-4 p-4">
        <p className="text-sm text-muted-foreground">{aiWritten ? c.planIntro : c.planNoAi}</p>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="plan-name">{c.appName}
            <input id="plan-name" maxLength={40} value={plan.name} onChange={(e) => set({ name: e.target.value })} className="efy-input text-base normal-case tracking-normal text-foreground" />
          </label>
          <fieldset className="grid gap-1">
            <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.colours}</legend>
            <div className="flex gap-2">
              <input type="color" aria-label={`${c.colours} 1`} value={plan.primary} onChange={(e) => set({ primary: e.target.value })} className="efy-swatch" />
              <input type="color" aria-label={`${c.colours} 2`} value={plan.accent} onChange={(e) => set({ accent: e.target.value })} className="efy-swatch" />
            </div>
          </fieldset>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.screens} · {plan.screens.length}/6</p>
          <ol className="mt-2 grid gap-2">
            {plan.screens.map((s, i) => (
              <li key={s.id} className="efy-plan-screen">
                <span className="efy-plan-num" style={{ background: plan.primary }}>{i + 1}</span>
                <div className="grid min-w-0 flex-1 gap-1">
                  <input aria-label={`${c.screenName} ${i + 1}`} maxLength={28} value={s.name} onChange={(e) => set({ screens: plan.screens.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)) })} className="efy-input py-1.5 font-semibold" />
                  <textarea aria-label={`${c.screenPurpose} ${i + 1}`} maxLength={160} rows={2} value={s.purpose} onChange={(e) => set({ screens: plan.screens.map((x) => (x.id === s.id ? { ...x, purpose: e.target.value } : x)) })} className="efy-input resize-none py-1.5 text-sm" />
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" checked={s.tab} disabled={!s.tab && tabs >= 5} onChange={(e) => set({ screens: plan.screens.map((x) => (x.id === s.id ? { ...x, tab: e.target.checked } : x)) })} /> {c.tabScreen}
                  </label>
                </div>
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" aria-label={`${c.remove} ${s.name}`} disabled={plan.screens.length <= 2} onClick={() => set({ screens: plan.screens.filter((x) => x.id !== s.id) })}><X className="h-4 w-4" /></Button>
              </li>
            ))}
          </ol>
          {plan.screens.length < 6 && (
            <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); const n = newScreen.trim(); if (!n) return; set({ screens: [...plan.screens, { id: idFrom(n, plan.screens.map((x) => x.id)), name: n.slice(0, 28), purpose: "", tab: tabs < 5 }] }); setNewScreen(""); }}>
              <input aria-label={c.addScreen} placeholder={c.addScreen} maxLength={28} value={newScreen} onChange={(e) => setNewScreen(e.target.value)} className="efy-input min-w-0 flex-1 py-1.5" />
              <Button type="submit" size="sm" variant="secondary" className="rounded-full" disabled={!newScreen.trim()}><Plus className="h-4 w-4" /></Button>
            </form>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.features}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {plan.features.map((f) => (
              <li key={f} className="efy-chip">{f}<button type="button" aria-label={`${c.remove} ${f}`} onClick={() => set({ features: plan.features.filter((x) => x !== f) })}><X className="h-3 w-3" /></button></li>
            ))}
          </ul>
          {plan.features.length < 8 && (
            <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); const f = newFeature.trim(); if (!f || plan.features.includes(f)) return; set({ features: [...plan.features, f.slice(0, 80)] }); setNewFeature(""); }}>
              <input aria-label={c.addFeature} placeholder={c.addFeature} maxLength={80} value={newFeature} onChange={(e) => setNewFeature(e.target.value)} className="efy-input min-w-0 flex-1 py-1.5" />
              <Button type="submit" size="sm" variant="secondary" className="rounded-full" disabled={!newFeature.trim()}><Plus className="h-4 w-4" /></Button>
            </form>
          )}
        </div>
      </div>
      <div className="flex justify-end border-t border-border px-4 py-3">
        <Button type="button" onClick={onBuild} disabled={busy || plan.screens.length < 2 || !plan.name.trim() || plan.screens.some((s) => !s.name.trim())} className="btn-gold h-11 rounded-full px-5"><WandSparkles /> {c.buildApp}</Button>
      </div>
    </div>
  );
}

/** What the phone shows while the visitor is still planning: the app's splash, built from the plan. */
export function PlanSplash({ plan }: { plan: ProtoPlan }) {
  const tabs = plan.screens.filter((s) => s.tab).slice(0, 5);
  return (
    <div className="efy-splash" style={{ ["--p" as string]: plan.primary, ["--a" as string]: plan.accent }}>
      <div className="efy-splash-mid">
        <span className="efy-splash-mark" aria-hidden="true">{plan.name.trim().charAt(0).toUpperCase() || "A"}</span>
        <strong>{plan.name || "…"}</strong>
        {plan.tagline && <span>{plan.tagline}</span>}
      </div>
      <nav className="efy-splash-tabs" aria-hidden="true">
        {tabs.map((s, i) => <span key={s.id} data-on={i === 0 || undefined}><i />{s.name}</span>)}
      </nav>
    </div>
  );
}
