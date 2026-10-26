import { pageIndex } from "../page-index";
import { defaults, run, validate, type Answers, type LabConfig, type Template } from "./engine";

export interface LabTest { name: string; ok: boolean; detail: string; at: string }

/** Automatic checks for a lab item; each one actually runs the prototype's logic. */
export function runLabTests(t: Template, c: LabConfig, title: string): LabTest[] {
  const at = new Date().toISOString();
  const out: LabTest[] = [];
  const add = (name: string, fn: () => string | true) => { try { const r = fn(); out.push({ name, ok: r === true, detail: r === true ? "Passed" : r, at }); } catch (e) { out.push({ name, ok: false, detail: (e as Error).message, at }); } };

  add("Configuration is valid", () => { const e = validate(t, c); return e.length ? e.join("; ") : true; });
  add("Runs with the default answers", () => { const r = run(t, c, defaults(c), title); return r.summary.length > 0 ? true : "No output"; });

  if (t === "calculator") add("Result changes when an input changes", () => {
    const num = c.fields.find((f) => f.type === "number"); if (!num) return "No number inputs";
    const a = defaults(c); const r1 = run(t, c, a, title).value;
    const r2 = run(t, c, { ...a, [num.id]: (Number(a[num.id]) || 0) + 10 }, title).value;
    return r1 !== r2 && Number.isFinite(r2) ? true : `Changing "${num.label}" didn't change the result`;
  });
  if (t === "assessment") add("Best answers score 100 and worst answers land in the lowest band", () => {
    const best: Answers = {}, worst: Answers = {};
    for (const f of c.fields) { const s = [...(f.options ?? [])].sort((x, y) => (y.weight ?? 0) - (x.weight ?? 0)); best[f.id] = s[0]?.value ?? ""; worst[f.id] = s[s.length - 1]?.value ?? ""; }
    const b = run(t, c, best, title).value, w = run(t, c, worst, title);
    const lowest = [...(c.bands ?? [])].sort((x, y) => x.min - y.min)[0];
    return b === 100 && (!lowest || (w.text ?? "").startsWith(lowest.label)) ? true : `Best ${b}, worst "${w.text}"`;
  });
  if (t === "recommender") add("Every recommendation can be reached and links to a real page", () => {
    const reachable = new Set(c.fields.flatMap((f) => (f.options ?? []).flatMap((o) => o.tags ?? [])));
    const dead = (c.recommend ?? []).filter((r) => !reachable.has(r.tag)).map((r) => r.tag);
    const routes = new Set(pageIndex().map((p) => p.href));
    for (const f of c.fields) for (const o of f.options ?? []) { const r = run(t, c, { ...defaults(c), [f.id]: f.type === "multi" ? [o.value] : o.value }, title); for (const it of r.items ?? []) if (!routes.has(it.href)) return `${it.href} isn't a known page`; }
    return dead.length ? `No answer leads to: ${dead.join(", ")}` : true;
  });
  if (t === "configurator" || t === "proposal") add("Choosing a priced option changes the total", () => {
    const f = c.fields.find((x) => (x.options ?? []).some((o) => (o.price ?? 0) > 0)); if (!f) return "No priced options";
    const o = [...(f.options ?? [])].sort((x, y) => (y.price ?? 0) - (x.price ?? 0))[0];
    const base = run(t, c, { ...defaults(c), [f.id]: f.type === "multi" ? [] : (f.options ?? [])[0].value }, title).value ?? 0;
    const more = run(t, c, { ...defaults(c), [f.id]: f.type === "multi" ? [o.value] : o.value }, title).value ?? 0;
    return more > base || (f.type === "choice" && (f.options ?? [])[0].value === o.value) ? true : "Total didn't change";
  });
  if (t === "demo") add("Has steps to walk through", () => ((c.steps?.length ?? 0) > 0 ? true : "No steps"));
  if (t === "assistant") add("Has starter questions for Emma AI", () => ((c.assistant?.starters?.length ?? 0) > 0 ? true : "No starters"));
  if (c.cta) add("Button link goes somewhere real", () => {
    if (/^https:\/\//.test(c.cta!.to)) return true;
    const path = c.cta!.to.split(/[?#]/)[0];
    return pageIndex().some((p) => p.href === path) ? true : `${path} isn't in the page index`;
  });
  return out;
}

/** A plain-language specification drafted from the idea and template (rule-based; edit freely). */
export function draftSpec(t: Template, title: string, idea: string) {
  const goal = idea.trim() || `Help visitors with: ${title}.`;
  const by: Record<Template, { inputs: string; output: string; risk: string }> = {
    assistant: { inputs: "A topic and starter questions", output: "Answers from the site's Emma AI assistant, which uses the site's own information", risk: "AI answers can be wrong; the assistant is labelled AI and offers a human handover" },
    recommender: { inputs: "One to five questions with tagged answers", output: "Matching services from the real catalogue, each with why it fits", risk: "A missing mapping can leave visitors with no match; tests check every recommendation is reachable" },
    calculator: { inputs: "Number fields", output: "A single result from a formula the owner writes", risk: "Results are estimates; the page says so and avoids promising outcomes" },
    assessment: { inputs: "Weighted multiple-choice questions", output: "A score out of 100 with a result band", risk: "Scores are indicative, not a diagnosis" },
    proposal: { inputs: "Scope options with prices", output: "An indicative price range and a proposal summary to send", risk: "Ranges aren't quotes; the fixed quote follows a call" },
    onboarding: { inputs: "Short questions about the business", output: "A summary sent to Emmanuel as an enquiry", risk: "Personal data: only name and contact details are required" },
    configurator: { inputs: "Options with prices", output: "A running total", risk: "Totals are indicative" },
    demo: { inputs: "None", output: "A guided walkthrough with next and back", risk: "Must be labelled as a demonstration with sample data" },
  };
  const s = by[t];
  return {
    goal, audience: "Business owners visiting EmmaForYou", inputs: s.inputs, output: s.output, risks: s.risk,
    acceptance: ["All automatic tests pass", "Works on a phone (390px) and with a keyboard", "Every link and recommendation opens a real page", "Clearly labelled as a beta tool until reviewed"],
  };
}
