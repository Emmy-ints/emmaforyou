import { Loader2, Plus, Trash2 } from "lucide-react";
import { PRESETS, type Scenario, blankScenario, calc, fmt, presetValues } from "@/lib/books/royalty";
import { CHECKED, SOURCES } from "@/lib/books/specs";
import { Field, GhostBtn, Notice, Panel, SaveBar, ServiceCta, inputCls, useAccountGate, useBookState } from "./shared";

interface State { title: string; currency: string; scenarios: (Scenario & { preset: string })[] }
const initial = (): State => ({ title: "", currency: "USD", scenarios: [{ ...blankScenario("eBook at 4.99"), preset: "kdp-ebook-70" }, { ...blankScenario("Paperback at 12.99"), ...presetValues("kdp-paperback-60"), price: 12.99, preset: "kdp-paperback-60" }] });

export default function RoyaltyCalculator() {
  const s = useBookState<State>("royalty-calculator", "royalty", initial);
  const { state, setState } = s;
  const gate = useAccountGate("royalty-calculator");
  const upd = (i: number, patch: Partial<Scenario & { preset: string }>) => setState((x) => ({ ...x, scenarios: x.scenarios.map((sc, j) => (j === i ? { ...sc, ...patch } : sc)) }));
  const applyPreset = (i: number, id: string) => upd(i, { ...presetValues(id), preset: id });
  const results = state.scenarios.map(calc);
  const cur = state.currency;
  if (!s.loaded) return <div className="py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" aria-label="Loading" /></div>;
  return (
    <div className="space-y-6">
      <Notice tone="warn">Estimates only, not a forecast of earnings. Sales numbers are your own assumptions. Platform rates change: presets come from KDP's help pages checked {CHECKED} (<a className="underline" href={SOURCES.ebookRoyalty} target="_blank" rel="noopener noreferrer">eBook royalties</a>, <a className="underline" href={SOURCES.printCost} target="_blank" rel="noopener noreferrer">printing cost &amp; paperback royalty</a>) — confirm them in your dashboard.</Notice>
      <Panel>
        <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
          <Field label="Book (for your records)"><input className={inputCls} value={state.title} maxLength={160} onChange={(e) => setState((x) => ({ ...x, title: e.target.value }))} /></Field>
          <Field label="Currency label" hint="Display only — no conversion."><select className={inputCls} value={state.currency} onChange={(e) => setState((x) => ({ ...x, currency: e.target.value }))}>{["USD", "GBP", "EUR", "NGN", "CAD", "AUD", "ZAR", "GHS", "KES"].map((c) => <option key={c}>{c}</option>)}</select></Field>
        </div>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-3">
        {state.scenarios.map((sc, i) => {
          const r = results[i];
          const P = PRESETS[sc.preset];
          const num = (k: keyof Scenario, label: string, step = 0.01, hint?: string) => <Field label={label} hint={hint}><input type="number" step={step} min={0} className={inputCls} value={sc[k] as number} onChange={(e) => upd(i, { [k]: Math.max(0, Number(e.target.value) || 0) } as Partial<Scenario>)} /></Field>;
          return (
            <Panel key={i} title={undefined}>
              <div className="flex items-center gap-2"><input aria-label="Scenario name" className={`${inputCls} mt-0 font-semibold`} value={sc.name} onChange={(e) => upd(i, { name: e.target.value })} />{state.scenarios.length > 1 && <button type="button" aria-label="Remove scenario" className="text-muted-foreground" onClick={() => setState((x) => ({ ...x, scenarios: x.scenarios.filter((_, j) => j !== i) }))}><Trash2 className="h-4 w-4" /></button>}</div>
              <Field label="Platform & format"><select className={inputCls} value={sc.preset} onChange={(e) => applyPreset(i, e.target.value)}>{Object.entries(PRESETS).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}</select></Field>
              <p className="mt-1 text-xs text-muted-foreground">{P?.note}</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {num("price", `List price (${cur})`)}
                {num("vatPct", "VAT in price %", 0.1, "0 for US sales")}
                {sc.format !== "direct" && num("ratePct", "Royalty rate %", 1)}
                {sc.format === "ebook" && num("sizeMb", "File size (MB)", 0.1)}
                {sc.format === "ebook" && num("deliveryPerMb", `Delivery per MB (${cur})`, 0.01, "70% option only")}
                {sc.format === "paperback" && num("pages", "Pages", 1)}
                {sc.format === "paperback" && num("printFixed", `Printing: fixed (${cur})`)}
                {sc.format === "paperback" && num("printPerPage", `Printing: per page (${cur})`, 0.001)}
                {sc.format === "direct" && num("feePct", "Payment fee %", 0.1)}
                {sc.format === "direct" && num("feeFixed", `Fee per sale (${cur})`)}
                {num("monthlySales", "Copies sold / month (your guess)", 1)}
                {num("oneOffCosts", `One-off costs (${cur})`, 1, "Editing, cover, formatting, ISBN")}
                {num("monthlyCosts", `Monthly costs (${cur})`, 1, "Ads, email tool")}
              </div>
              <div className="mt-4 rounded-2xl bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground">Royalty per copy</p>
                <p className="font-display text-3xl font-semibold tabular-nums">{cur} {fmt(r.perCopy)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{r.formula}</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div><dt className="text-xs text-muted-foreground">Per month</dt><dd className="tabular-nums">{cur} {fmt(r.monthly)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Per year</dt><dd className="tabular-nums">{cur} {fmt(r.yearly)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Monthly after costs</dt><dd className="tabular-nums">{cur} {fmt(r.monthlyProfit)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Break-even</dt><dd className="tabular-nums">{sc.oneOffCosts <= 0 ? "No one-off costs" : r.breakEvenCopies == null ? "Not reached (no royalty per copy)" : `${r.breakEvenCopies.toLocaleString()} copies${r.breakEvenMonths != null ? ` · ~${r.breakEvenMonths} mo` : " · not at this sales rate"}`}</dd></div>
                </dl>
                <p className="mt-2 text-[11px] text-muted-foreground">Break-even copies = one-off costs ÷ royalty per copy; months = one-off costs ÷ (monthly royalty − monthly costs).</p>
                {r.warnings.map((w) => <p key={w} className="mt-2 text-xs text-amber-700 dark:text-amber-300">{w}</p>)}
              </div>
            </Panel>
          );
        })}
        {state.scenarios.length < 3 && <button type="button" onClick={() => setState((x) => ({ ...x, scenarios: [...x.scenarios, { ...blankScenario(`Scenario ${x.scenarios.length + 1}`), preset: "kdp-ebook-35", ratePct: 35, deliveryPerMb: 0 }] }))} className="grid min-h-[200px] place-items-center rounded-3xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-[var(--hue)]"><span className="inline-flex items-center gap-2"><Plus className="h-4 w-4" aria-hidden="true" />Add a scenario to compare</span></button>}
      </div>
      <div className="flex flex-wrap items-center gap-3"><SaveBar kind="royalty" title={state.title || "Royalty estimate"} data={state} meta={{ scenarios: state.scenarios.length }} projectId={s.projectId} setProjectId={s.setProjectId} gateRequire={gate.require} /><GhostBtn onClick={() => s.reset()}>Reset</GhostBtn></div>
      <ServiceCta service="ebook-publishing" title="Not sure which price or platform fits?" body="We'll walk through formats, pricing, platforms and costs for your book and goals in a free call — no obligation." cta="Get publishing guidance" />
      {gate.gate}
    </div>
  );
}
