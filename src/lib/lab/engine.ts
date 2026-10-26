/**
 * Innovation Lab engine. A lab item is DATA (a config validated here), never code: each template
 * is a fixed, reviewed renderer in LabRunner, and the only "logic" an owner can write is a
 * calculator formula, which is parsed by a tiny arithmetic evaluator (numbers, field names,
 * + - * / ^ ( ), min/max/round/abs/sqrt) — no eval, no property access, no function calls beyond those.
 */
import { catalog } from "../service-catalog";

export type Template = "assistant" | "recommender" | "calculator" | "assessment" | "proposal" | "onboarding" | "configurator" | "demo";
export interface LabOption { label: string; value: string; weight?: number; price?: number; tags?: string[] }
export interface LabField { id: string; label: string; type: "number" | "choice" | "multi" | "text"; help?: string; min?: number; max?: number; step?: number; default?: number | string; options?: LabOption[] }
export interface LabConfig {
  intro: string;
  fields: LabField[];
  formula?: string; unit?: string; resultLabel?: string; decimals?: number;
  bands?: { min: number; label: string; text: string }[];
  basePrice?: number; currency?: string;
  recommend?: { tag: string; catalogId: string; why: string }[];
  steps?: { title: string; text: string }[];
  assistant?: { topic: string; starters: string[] };
  cta?: { label: string; to: string };
  lead?: boolean;
}

export const TEMPLATES: { id: Template; name: string; does: string }[] = [
  { id: "assistant", name: "AI assistant", does: "Starter questions on a topic, answered by the site's Emma AI assistant." },
  { id: "recommender", name: "Service recommendation tool", does: "Questions whose answers map to real services in the catalogue." },
  { id: "calculator", name: "Calculator", does: "Number inputs and a formula that shows a result." },
  { id: "assessment", name: "Assessment / score", does: "Weighted questions that add up to a score with result bands." },
  { id: "proposal", name: "Interactive proposal builder", does: "Pick scope options, see a price range and send the proposal." },
  { id: "onboarding", name: "Guided onboarding", does: "A short multi-step form that ends in an enquiry to Emmanuel." },
  { id: "configurator", name: "Product / service configurator", does: "Options with prices that add up to a total." },
  { id: "demo", name: "Interactive demonstration", does: "A step-by-step walkthrough with next and back." },
];

const opt = (label: string, value: string, extra: Partial<LabOption> = {}): LabOption => ({ label, value, ...extra });

/** A working starting config for each template (also used by tests). */
export function starterConfig(t: Template, title: string): LabConfig {
  switch (t) {
    case "calculator": return { intro: `Estimate it in seconds: ${title}.`, fields: [{ id: "visitors", label: "Monthly website visitors", type: "number", min: 0, max: 10000000, default: 2000 }, { id: "rate", label: "Enquiry rate (%)", type: "number", min: 0, max: 100, step: 0.1, default: 2 }, { id: "value", label: "Value of one customer", type: "number", min: 0, max: 10000000, default: 150 }], formula: "visitors * rate / 100 * value", resultLabel: "Estimated monthly value", unit: "$", decimals: 0, cta: { label: "Talk it through", to: "/book" } };
    case "assessment": return { intro: "Answer five quick questions to get your score.", fields: ["Do you have a mobile-friendly website?", "Can customers book or buy online?", "Do you reply to enquiries within an hour?", "Do you collect reviews automatically?", "Do you follow up with past customers?"].map((q, i) => ({ id: `q${i + 1}`, label: q, type: "choice" as const, options: [opt("Yes", "yes", { weight: 20 }), opt("Partly", "partly", { weight: 10 }), opt("No", "no", { weight: 0 })] })), bands: [{ min: 0, label: "Getting started", text: "The basics will make the biggest difference first." }, { min: 50, label: "On your way", text: "A few gaps are costing you enquiries." }, { min: 80, label: "Strong", text: "You're ahead; automation is the next step." }], cta: { label: "Get a free audit", to: "/website-audit" } };
    case "recommender": return { intro: "Tell us what you need and we'll point you to the right service.", fields: [{ id: "need", label: "What do you want most?", type: "choice", options: [opt("More enquiries", "leads", { tags: ["leads"] }), opt("Sell online", "store", { tags: ["store"] }), opt("Save time", "time", { tags: ["automation"] }), opt("A better-looking site", "design", { tags: ["design"] })] }], recommend: [{ tag: "leads", catalogId: "svc-website-design", why: "a site built to turn visitors into enquiries" }, { tag: "store", catalogId: "svc-ecommerce", why: "selling online" }, { tag: "automation", catalogId: "svc-ai-automation", why: "replies and follow-ups that run themselves" }, { tag: "design", catalogId: "exp-ui-ux-design", why: "a clearer, more trustworthy design" }], lead: true };
    case "configurator": return { intro: "Build your package and see the total.", fields: [{ id: "pages", label: "Website size", type: "choice", options: [opt("Up to 5 pages", "s", { price: 0 }), opt("Up to 10 pages", "m", { price: 300 }), opt("Up to 20 pages", "l", { price: 700 })] }, { id: "extras", label: "Extras", type: "multi", options: [opt("Online booking", "booking", { price: 150 }), opt("WhatsApp chat button", "wa", { price: 50 }), opt("Blog", "blog", { price: 120 })] }], basePrice: 500, currency: "$", lead: true };
    case "proposal": return { intro: "Choose the scope and get an instant proposal.", fields: [{ id: "type", label: "Project", type: "choice", options: [opt("New website", "site", { price: 800 }), opt("Online store", "store", { price: 1400 }), opt("Automation setup", "auto", { price: 600 })] }, { id: "addons", label: "Add-ons", type: "multi", options: [opt("Copywriting", "copy", { price: 200 }), opt("SEO setup", "seo", { price: 250 }), opt("Monthly care", "care", { price: 99 })] }, { id: "notes", label: "Anything else?", type: "text" }], currency: "$", lead: true };
    case "onboarding": return { intro: "Three quick steps and Emmanuel will take it from there.", fields: [{ id: "business", label: "Business name", type: "text" }, { id: "kind", label: "What kind of business?", type: "choice", options: [opt("Shop / ecommerce", "shop"), opt("Service business", "service"), opt("Clinic / health", "clinic"), opt("Other", "other")] }, { id: "goal", label: "Main goal for the next 90 days", type: "text" }], lead: true };
    case "demo": return { intro: `A quick walkthrough: ${title}.`, fields: [], steps: [{ title: "A customer messages you", text: "At 11pm someone asks about prices on WhatsApp." }, { title: "The assistant replies instantly", text: "It answers from your approved price list and offers a booking time." }, { title: "You wake up to a booking", text: "The appointment is in your calendar with a reminder already sent." }], cta: { label: "Try the AI receptionist", to: "/ai-receptionist" } };
    case "assistant": return { intro: `Ask Emma AI anything about ${title.toLowerCase()}.`, fields: [], assistant: { topic: title, starters: ["Where should I start?", "What does it usually cost?", "How long does it take?"] } };
  }
}

/* ---------------------------------------------------------------- safe formula */
type Tok = { t: "n"; v: number } | { t: "id"; v: string } | { t: "op"; v: string };
const FUNCS: Record<string, (...a: number[]) => number> = { min: Math.min, max: Math.max, round: (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d, abs: Math.abs, sqrt: Math.sqrt };
function lex(src: string): Tok[] {
  const out: Tok[] = []; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    const num = /^\d+(\.\d+)?/.exec(src.slice(i)); if (num) { out.push({ t: "n", v: parseFloat(num[0]) }); i += num[0].length; continue; }
    const id = /^[a-z_][a-z0-9_]*/i.exec(src.slice(i)); if (id) { out.push({ t: "id", v: id[0] }); i += id[0].length; continue; }
    if ("+-*/^(),".includes(c)) { out.push({ t: "op", v: c }); i++; continue; }
    throw new Error(`Unexpected "${c}" in formula`);
  }
  return out;
}
/** Evaluate a formula against named numbers. Throws on anything outside the grammar. */
export function evaluate(src: string, vars: Record<string, number>): number {
  if (src.length > 300) throw new Error("Formula is too long");
  const toks = lex(src); let p = 0;
  const peek = () => toks[p]; const eat = (v?: string) => { const t = toks[p++]; if (!t || (v && t.v !== v)) throw new Error(`Expected ${v ?? "a value"}`); return t; };
  const expr = (): number => { let v = term(); while (peek()?.t === "op" && (peek()!.v === "+" || peek()!.v === "-")) { const o = eat().v; const r = term(); v = o === "+" ? v + r : v - r; } return v; };
  const term = (): number => { let v = pow(); while (peek()?.t === "op" && (peek()!.v === "*" || peek()!.v === "/")) { const o = eat().v; const r = pow(); v = o === "*" ? v * r : r === 0 ? NaN : v / r; } return v; };
  const pow = (): number => { const b = unary(); if (peek()?.t === "op" && peek()!.v === "^") { eat(); return b ** pow(); } return b; };
  const unary = (): number => { if (peek()?.t === "op" && peek()!.v === "-") { eat(); return -unary(); } return atom(); };
  const atom = (): number => {
    const t = eat();
    if (t.t === "n") return t.v;
    if (t.t === "op" && t.v === "(") { const v = expr(); eat(")"); return v; }
    if (t.t === "id") {
      if (peek()?.t === "op" && peek()!.v === "(") {
        const f = Object.prototype.hasOwnProperty.call(FUNCS, t.v) ? FUNCS[t.v] : null; if (!f) throw new Error(`Unknown function ${t.v}`);
        eat("("); const args = [expr()]; while (peek()?.v === ",") { eat(","); args.push(expr()); } eat(")"); return f(...args);
      }
      if (!Object.prototype.hasOwnProperty.call(vars, t.v) || typeof vars[t.v] !== "number") throw new Error(`Unknown field "${t.v}"`);
      return vars[t.v];
    }
    throw new Error("Unexpected symbol");
  };
  const v = expr(); if (p !== toks.length) throw new Error("Unexpected text at the end of the formula");
  return v;
}

/* ---------------------------------------------------------------- validation */
const ID = /^[a-z][a-z0-9_]{0,30}$/;
const TXT = (s: unknown, max: number) => typeof s === "string" && s.length <= max && !/[<>]/.test(s);
const HREF = (s: unknown) => typeof s === "string" && (/^\/[A-Za-z0-9/_.\-#?=&%]*$/.test(s) || /^https:\/\/[A-Za-z0-9.-]+(\/[^\s<>"]*)?$/.test(s));
export function validate(t: Template, c: LabConfig): string[] {
  const e: string[] = [];
  if (!c || typeof c !== "object") return ["Config is missing"];
  if (!TXT(c.intro, 400)) e.push("Intro must be text up to 400 characters, without < or >");
  if (!Array.isArray(c.fields) || c.fields.length > 25) e.push("Fields must be a list of up to 25");
  const ids = new Set<string>();
  for (const f of c.fields ?? []) {
    if (!ID.test(f.id)) e.push(`Field id "${f.id}" must be lowercase letters, numbers or _ (start with a letter)`);
    if (ids.has(f.id)) e.push(`Field id "${f.id}" is used twice`); ids.add(f.id);
    if (!TXT(f.label, 160) || !f.label) e.push(`Field "${f.id}" needs a label`);
    if (!["number", "choice", "multi", "text"].includes(f.type)) e.push(`Field "${f.id}" has an unknown type`);
    if ((f.type === "choice" || f.type === "multi") && (!f.options?.length || f.options.length > 20)) e.push(`Field "${f.id}" needs 1–20 options`);
    for (const o of f.options ?? []) if (!TXT(o.label, 120) || !o.label || !ID.test(o.value)) e.push(`An option in "${f.id}" needs a label and a simple value`);
  }
  if (t === "calculator") { if (!c.formula) e.push("Calculator needs a formula"); else { try { const vars = Object.fromEntries((c.fields ?? []).filter((f) => f.type === "number").map((f) => [f.id, 1])); const v = evaluate(c.formula, vars); if (!Number.isFinite(v)) e.push("Formula doesn't produce a number with sample inputs"); } catch (err) { e.push(`Formula: ${(err as Error).message}`); } } }
  if (t === "assessment" && !(c.bands?.length)) e.push("Assessment needs at least one result band");
  if (t === "recommender") { const known = new Set(catalog().map((i) => i.id)); if (!c.recommend?.length) e.push("Recommender needs at least one tag → service mapping"); for (const r of c.recommend ?? []) if (!known.has(r.catalogId)) e.push(`"${r.catalogId}" isn't a service in the catalogue`); }
  if (t === "demo" && !(c.steps?.length)) e.push("Demo needs at least one step");
  for (const s of c.steps ?? []) if (!TXT(s.title, 120) || !TXT(s.text, 600)) e.push("Each demo step needs a short title and text");
  if (t === "assistant" && !(c.assistant?.starters?.length)) e.push("Assistant needs at least one starter question");
  for (const s of c.assistant?.starters ?? []) if (!TXT(s, 200)) e.push("Starter questions must be short text");
  if (c.cta && (!TXT(c.cta.label, 60) || !HREF(c.cta.to))) e.push("Button needs a label and a link like /book or https://…");
  if (c.currency && !TXT(c.currency, 4)) e.push("Currency symbol is too long");
  return e;
}

/* ---------------------------------------------------------------- running */
export type Answers = Record<string, number | string | string[]>;
export function defaults(c: LabConfig): Answers { return Object.fromEntries(c.fields.map((f) => [f.id, f.type === "multi" ? [] : f.default ?? (f.type === "number" ? 0 : f.type === "choice" ? f.options?.[0]?.value ?? "" : "")])); }
const chosen = (f: LabField, a: Answers) => (f.options ?? []).filter((o) => (f.type === "multi" ? ((a[f.id] as string[]) ?? []).includes(o.value) : a[f.id] === o.value));

export interface LabResult { headline?: string; value?: number; text?: string; items?: { name: string; href: string; why: string }[]; summary: string }
export function run(t: Template, c: LabConfig, a: Answers, title: string): LabResult {
  const lines = c.fields.map((f) => `${f.label}: ${f.type === "multi" || f.type === "choice" ? chosen(f, a).map((o) => o.label).join(", ") || "—" : String(a[f.id] ?? "") || "—"}`);
  const summary = `${title}\n${lines.join("\n")}`;
  if (t === "calculator") {
    const vars = Object.fromEntries(c.fields.filter((f) => f.type === "number").map((f) => [f.id, Number(a[f.id]) || 0]));
    const v = evaluate(c.formula ?? "0", vars);
    const d = c.decimals ?? 0;
    return { value: v, headline: `${c.unit ?? ""}${Number.isFinite(v) ? v.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d }) : "—"}`, text: c.resultLabel, summary: `${summary}\n${c.resultLabel ?? "Result"}: ${c.unit ?? ""}${v}` };
  }
  if (t === "assessment") {
    const max = c.fields.reduce((s, f) => s + Math.max(0, ...(f.options ?? []).map((o) => o.weight ?? 0)), 0) || 1;
    const got = c.fields.reduce((s, f) => s + chosen(f, a).reduce((x, o) => x + (o.weight ?? 0), 0), 0);
    const score = Math.round((got / max) * 100);
    const band = [...(c.bands ?? [])].sort((x, y) => y.min - x.min).find((b) => score >= b.min);
    return { value: score, headline: `${score}/100`, text: band ? `${band.label}: ${band.text}` : "", summary: `${summary}\nScore: ${score}/100 ${band?.label ?? ""}` };
  }
  if (t === "recommender") {
    const tags = new Set(c.fields.flatMap((f) => chosen(f, a).flatMap((o) => o.tags ?? [])));
    const all = new Map(catalog().map((i) => [i.id, i]));
    const items = (c.recommend ?? []).filter((r) => tags.has(r.tag) && all.has(r.catalogId)).map((r) => ({ name: all.get(r.catalogId)!.name, href: all.get(r.catalogId)!.href, why: r.why }));
    const uniq = items.filter((x, i) => items.findIndex((y) => y.href === x.href) === i);
    return { items: uniq, headline: uniq.length ? `${uniq.length} match${uniq.length > 1 ? "es" : ""}` : "No match yet", summary: `${summary}\nRecommended: ${uniq.map((u) => u.name).join(", ")}` };
  }
  if (t === "configurator" || t === "proposal") {
    const total = (c.basePrice ?? 0) + c.fields.reduce((s, f) => s + chosen(f, a).reduce((x, o) => x + (o.price ?? 0), 0), 0);
    const cur = c.currency ?? "$";
    const head = t === "proposal" ? `${cur}${Math.round(total * 0.9).toLocaleString()}–${cur}${Math.round(total * 1.15).toLocaleString()}` : `${cur}${total.toLocaleString()}`;
    return { value: total, headline: head, text: t === "proposal" ? "Indicative range; the fixed quote follows a free call." : "Indicative total.", summary: `${summary}\n${t === "proposal" ? "Indicative range" : "Total"}: ${head}` };
  }
  return { summary };
}
