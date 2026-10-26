// @ts-nocheck -- generated DB types lag behind; runtime verified
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FlaskConical, Play, Plus, Save, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Btn, Card, check, db, Empty, ErrorText, label, Loading, Pill, useLoad, when } from "@/components/agents-admin/shared";
import LabRunner from "@/components/lab/LabRunner";
import { starterConfig, TEMPLATES, validate, type LabConfig, type LabField, type Template } from "@/lib/lab/engine";
import { draftSpec, runLabTests, type LabTest } from "@/lib/lab/tests";
import { catalog } from "@/lib/service-catalog";
import { useCan, type Row } from "./settings";

const slugify = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "lab-tool";
const TONE = { draft: "muted", testing: "warn", approved: "info", published: "good", archived: "muted" } as const;

export default function LabTab() {
  const can = useCan();
  const items = useLoad<Row[]>(async () => check(await db.from("site_lab_items").select("*").order("updated_at", { ascending: false })));
  const [open, setOpen] = useState<string | null>(null);
  const [title, setTitle] = useState(""); const [idea, setIdea] = useState(""); const [tpl, setTpl] = useState<Template>("calculator"); const [err, setErr] = useState("");
  async function create() {
    setErr("");
    try {
      const { data: u } = await supabase.auth.getUser();
      const t = title.trim(); if (t.length < 2) throw new Error("Give it a title.");
      const row = check(await db.from("site_lab_items").insert({ slug: `${slugify(t)}-${Date.now().toString(36).slice(-4)}`, template: tpl, title: t, idea: idea.trim(), spec: draftSpec(tpl, t, idea), config: starterConfig(tpl, t), status: "draft", created_by: u.user?.id }).select("id").single());
      setTitle(""); setIdea(""); items.reload(); setOpen(row.id);
    } catch (e) { setErr(e.message); }
  }
  const current = items.data?.find((i) => i.id === open);
  return (
    <div className="space-y-4">
      <Card title="Innovation Lab">
        <p className="mb-3 text-sm text-muted-foreground">Describe an idea, pick a template and the lab drafts a specification and a working prototype. Prototypes are only visible here until an admin approves them after their tests pass; then they go live at /lab/&lt;name&gt;. A prototype is configuration for a reviewed template, never generated code, so nothing untested can run on the site.</p>
        {can("lab.use") && <div className="grid gap-2 md:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <input className="input w-full" maxLength={90} placeholder="Title, e.g. Website ROI calculator" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Title" />
            <textarea className="input min-h-[70px] w-full" maxLength={2000} placeholder="The idea: who it's for and what it should help them decide" value={idea} onChange={(e) => setIdea(e.target.value)} aria-label="Idea" />
          </div>
          <div className="space-y-2">
            <select className="input w-full" value={tpl} onChange={(e) => setTpl(e.target.value as Template)} aria-label="Template">{TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
            <p className="max-w-[260px] text-xs text-muted-foreground">{TEMPLATES.find((t) => t.id === tpl)?.does}</p>
            <Btn tone="primary" onClick={create}><Plus className="h-4 w-4" aria-hidden="true" />Create prototype</Btn>
          </div>
        </div>}
        <div className="mt-2"><ErrorText message={err || items.error} /></div>
      </Card>
      <Card title={`Lab items (${items.data?.length ?? 0})`}>
        {items.loading ? <Loading /> : !items.data?.length ? <Empty>No lab items yet.</Empty> : (
          <ul className="divide-y divide-border text-sm">{items.data.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <button type="button" className="text-left" onClick={() => setOpen(open === i.id ? null : i.id)} aria-expanded={open === i.id}><FlaskConical className="mr-1 inline h-4 w-4 text-[var(--emma-violet)]" aria-hidden="true" /><span className="font-medium">{i.title}</span> <span className="text-xs text-muted-foreground">{TEMPLATES.find((t) => t.id === i.template)?.name} · {when(i.updated_at)}</span></button>
              <span className="flex items-center gap-1"><Pill tone={TONE[i.status]}>{label(i.status)}</Pill>{i.status === "published" && <a className="nav-ghost h-7 px-2 text-xs" href={`/lab/${i.slug}`} target="_blank" rel="noopener noreferrer">Live <ExternalLink className="h-3 w-3" aria-hidden="true" /></a>}</span>
            </li>))}</ul>
        )}
      </Card>
      {current && <LabEditor key={current.id} item={current} onDone={items.reload} onClose={() => setOpen(null)} />}
    </div>
  );
}

function LabEditor({ item, onDone, onClose }: { item: Row; onDone: () => void; onClose: () => void }) {
  const can = useCan();
  const [cfg, setCfg] = useState<LabConfig>(item.config);
  const [spec, setSpec] = useState<Row>(item.spec ?? {});
  const [json, setJson] = useState(false); const [raw, setRaw] = useState(JSON.stringify(item.config, null, 2));
  const [tests, setTests] = useState<LabTest[]>(item.tests ?? []);
  const [err, setErr] = useState(""); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const problems = useMemo(() => validate(item.template, cfg), [item.template, cfg]);
  const dirty = JSON.stringify(cfg) !== JSON.stringify(item.config) || JSON.stringify(spec) !== JSON.stringify(item.spec);
  const allPass = tests.length > 0 && tests.every((t) => t.ok) && !dirty;
  const upd = (p: Partial<LabConfig>) => { setCfg((c) => ({ ...c, ...p })); setTests([]); };
  async function save(extra: Row = {}) {
    setBusy(true); setErr(""); setMsg("");
    try { check(await db.from("site_lab_items").update({ config: cfg, spec, ...extra }).eq("id", item.id).select("id").single()); setMsg("Saved."); onDone(); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  }
  async function test() {
    const t = runLabTests(item.template, cfg, item.title); setTests(t);
    await save({ tests: t, status: item.status === "published" ? "published" : "testing" });
    setMsg(t.every((x) => x.ok) ? `All ${t.length} tests passed.` : `${t.filter((x) => !x.ok).length} of ${t.length} tests failed.`);
  }
  async function publish(on: boolean) {
    if (on && !window.confirm(`Publish "${item.title}" at /lab/${item.slug} for every visitor?`)) return;
    setBusy(true); setErr("");
    try { check(await db.rpc("site_lab_publish", { _id: item.id, _publish: on })); setMsg(on ? "Published." : "Unpublished; it's a draft again."); onDone(); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }
  async function remove() { if (!window.confirm("Delete this lab item?")) return; const r = await db.from("site_lab_items").delete().eq("id", item.id); if (r.error) setErr(r.error.message); else { onClose(); onDone(); } }
  const t = item.template as Template;
  return (
    <Card title={<>{item.title} <span className="text-xs font-normal text-muted-foreground">/lab/{item.slug}</span></>} actions={<Btn small onClick={onClose}>Close</Btn>}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <section><h3 className="mb-1 text-sm font-semibold">1. Specification <span className="text-xs font-normal text-muted-foreground">(drafted from the idea; edit freely)</span></h3>
            {["goal", "audience", "inputs", "output", "risks"].map((k) => <label key={k} className="mb-1 block text-xs text-muted-foreground">{label(k)}<textarea className="input mt-0.5 min-h-[40px] w-full text-sm" value={spec[k] ?? ""} onChange={(e) => setSpec((s) => ({ ...s, [k]: e.target.value.slice(0, 600) }))} /></label>)}
            <p className="text-xs text-muted-foreground">Acceptance: {(spec.acceptance ?? []).join(" · ")}</p>
          </section>
          <section><h3 className="mb-1 flex items-center justify-between text-sm font-semibold">2. Configure <button type="button" className="text-xs font-normal underline" onClick={() => { if (json) { try { const c = JSON.parse(raw); setCfg(c); setTests([]); setJson(false); } catch { setErr("That JSON isn't valid."); } } else { setRaw(JSON.stringify(cfg, null, 2)); setJson(true); } }}>{json ? "Apply JSON" : "Edit as JSON"}</button></h3>
            {json ? <textarea className="input min-h-[320px] w-full font-mono text-xs" value={raw} onChange={(e) => setRaw(e.target.value)} aria-label="Config JSON" /> : <ConfigForm t={t} cfg={cfg} upd={upd} />}
            {problems.length > 0 && <ul className="mt-2 list-disc pl-5 text-xs text-red-600">{problems.map((p) => <li key={p}>{p}</li>)}</ul>}
          </section>
        </div>
        <div className="space-y-4">
          <section><h3 className="mb-1 text-sm font-semibold">3. Preview <span className="text-xs font-normal text-muted-foreground">(isolated: enquiry forms are disabled here)</span></h3>
            <div className="rounded-2xl border border-border p-4">{problems.length ? <p className="text-sm text-muted-foreground">Fix the configuration problems to see the preview.</p> : <LabRunner key={JSON.stringify(cfg)} template={t} config={cfg} title={item.title} preview />}</div>
          </section>
          <section><h3 className="mb-1 text-sm font-semibold">4. Test</h3>
            <Btn onClick={test} disabled={busy}><Play className="h-4 w-4" aria-hidden="true" />Run tests</Btn>
            {tests.length > 0 && <ul className="mt-2 space-y-1 text-sm">{tests.map((x) => <li key={x.name}><Pill tone={x.ok ? "good" : "bad"}>{x.ok ? "Pass" : "Fail"}</Pill> {x.name}{!x.ok && <span className="text-xs text-red-600"> — {x.detail}</span>}</li>)}</ul>}
          </section>
          <section><h3 className="mb-1 text-sm font-semibold">5. Approve & publish</h3>
            <div className="flex flex-wrap gap-2">
              <Btn onClick={() => save()} disabled={busy || !dirty}><Save className="h-4 w-4" aria-hidden="true" />Save</Btn>
              {can("lab.publish") && item.status !== "published" && <Btn tone="primary" onClick={() => publish(true)} disabled={busy || !allPass} title={allPass ? "" : "Save and pass all tests first"}><Send className="h-4 w-4" aria-hidden="true" />Approve & publish</Btn>}
              {can("lab.publish") && item.status === "published" && <Btn onClick={() => publish(false)} disabled={busy}>Unpublish</Btn>}
              {can("lab.publish") && item.status !== "published" && <Btn tone="danger" onClick={remove}><Trash2 className="h-4 w-4" aria-hidden="true" />Delete</Btn>}
            </div>
            {!can("lab.publish") && <p className="mt-1 text-xs text-muted-foreground">An admin approves and publishes.</p>}
            {item.status === "published" && dirty && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Visitors still see the published version; publish again after testing to update it.</p>}
            {msg && <p role="status" className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">{msg}</p>}
            <ErrorText message={err} />
          </section>
        </div>
      </div>
    </Card>
  );
}

/** Structured editor for the parts each template uses. Options are one per line: Label | value | number | tags. */
function ConfigForm({ t, cfg, upd }: { t: Template; cfg: LabConfig; upd: (p: Partial<LabConfig>) => void }) {
  const setField = (i: number, p: Partial<LabField>) => upd({ fields: cfg.fields.map((f, j) => (j === i ? { ...f, ...p } : f)) });
  const optText = (f: LabField) => (f.options ?? []).map((o) => [o.label, o.value, o.weight ?? o.price ?? "", (o.tags ?? []).join(" ")].join(" | ")).join("\n");
  const parseOpts = (s: string, priced: boolean) => s.split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((p) => p[0]).map(([lab, val, num, tags]) => ({ label: lab, value: (val || lab).toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "").replace(/^(\d)/, "o$1").slice(0, 30) || "opt", ...(num ? (priced ? { price: Number(num) || 0 } : { weight: Number(num) || 0 }) : {}), ...(tags ? { tags: tags.split(/\s+/).filter(Boolean) } : {}) }));
  const priced = t === "configurator" || t === "proposal";
  const ids = catalog().map((i) => i.id);
  return (
    <div className="space-y-3 text-sm">
      <label className="block text-xs text-muted-foreground">Intro<textarea className="input mt-0.5 min-h-[50px] w-full text-sm" maxLength={400} value={cfg.intro} onChange={(e) => upd({ intro: e.target.value })} /></label>
      {!["demo", "assistant"].includes(t) && <div>
        <p className="text-xs font-semibold text-muted-foreground">Questions / inputs</p>
        {cfg.fields.map((f, i) => (
          <div key={i} className="mt-2 rounded-xl border border-border p-2">
            <div className="grid gap-1.5 sm:grid-cols-[1fr_120px_110px_auto]">
              <input className="input h-8 text-sm" value={f.label} onChange={(e) => setField(i, { label: e.target.value })} aria-label="Question" />
              <input className="input h-8 font-mono text-xs" value={f.id} onChange={(e) => setField(i, { id: e.target.value })} aria-label="Field id" title="Used in formulas" />
              <select className="input h-8 text-xs" value={f.type} onChange={(e) => setField(i, { type: e.target.value as LabField["type"], options: ["choice", "multi"].includes(e.target.value) ? f.options ?? [] : undefined })} aria-label="Type"><option value="number">Number</option><option value="choice">One choice</option><option value="multi">Several choices</option><option value="text">Text</option></select>
              <button type="button" className="text-xs text-red-600" onClick={() => upd({ fields: cfg.fields.filter((_, j) => j !== i) })}>Remove</button>
            </div>
            {f.type === "number" && <div className="mt-1.5 flex gap-1.5"><input className="input h-8 w-24 text-xs" placeholder="Default" value={f.default ?? ""} onChange={(e) => setField(i, { default: e.target.value === "" ? undefined : Number(e.target.value) })} aria-label="Default" /><input className="input h-8 w-24 text-xs" placeholder="Min" value={f.min ?? ""} onChange={(e) => setField(i, { min: e.target.value === "" ? undefined : Number(e.target.value) })} aria-label="Min" /><input className="input h-8 w-24 text-xs" placeholder="Max" value={f.max ?? ""} onChange={(e) => setField(i, { max: e.target.value === "" ? undefined : Number(e.target.value) })} aria-label="Max" /></div>}
            {(f.type === "choice" || f.type === "multi") && <textarea className="input mt-1.5 min-h-[60px] w-full font-mono text-xs" defaultValue={optText(f)} onBlur={(e) => setField(i, { options: parseOpts(e.target.value, priced) })} aria-label="Options" placeholder={`Label | value | ${priced ? "price" : "weight"} | tags`} />}
          </div>
        ))}
        <button type="button" className="mt-2 text-xs font-semibold text-[var(--emma-violet)]" onClick={() => upd({ fields: [...cfg.fields, { id: `q${cfg.fields.length + 1}`, label: "New question", type: "choice", options: [{ label: "Yes", value: "yes" }, { label: "No", value: "no" }] }] })}>+ Add question</button>
      </div>}
      {t === "calculator" && <div className="grid gap-1.5 sm:grid-cols-3"><label className="text-xs text-muted-foreground sm:col-span-3">Formula (use the field ids)<input className="input mt-0.5 w-full font-mono text-sm" value={cfg.formula ?? ""} onChange={(e) => upd({ formula: e.target.value })} /></label><input className="input h-8 text-xs" placeholder="Result label" value={cfg.resultLabel ?? ""} onChange={(e) => upd({ resultLabel: e.target.value })} aria-label="Result label" /><input className="input h-8 text-xs" placeholder="Unit, e.g. $" value={cfg.unit ?? ""} onChange={(e) => upd({ unit: e.target.value.slice(0, 4) })} aria-label="Unit" /><input className="input h-8 text-xs" placeholder="Decimals" value={cfg.decimals ?? 0} onChange={(e) => upd({ decimals: Math.min(4, Number(e.target.value) || 0) })} aria-label="Decimals" /></div>}
      {t === "assessment" && <label className="block text-xs text-muted-foreground">Result bands (one per line: minimum score | label | text)<textarea className="input mt-0.5 min-h-[70px] w-full font-mono text-xs" defaultValue={(cfg.bands ?? []).map((b) => `${b.min} | ${b.label} | ${b.text}`).join("\n")} onBlur={(e) => upd({ bands: e.target.value.split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((p) => p[1]).map(([m, l, x]) => ({ min: Number(m) || 0, label: l, text: x ?? "" })) })} /></label>}
      {t === "recommender" && <label className="block text-xs text-muted-foreground">Tag → service (one per line: tag | service id | why). Service ids: {ids.slice(0, 8).join(", ")}…<textarea className="input mt-0.5 min-h-[70px] w-full font-mono text-xs" defaultValue={(cfg.recommend ?? []).map((r) => `${r.tag} | ${r.catalogId} | ${r.why}`).join("\n")} onBlur={(e) => upd({ recommend: e.target.value.split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((p) => p[1]).map(([tag, id, why]) => ({ tag, catalogId: id, why: why ?? "" })) })} /></label>}
      {priced && <div className="flex gap-1.5"><input className="input h-8 w-28 text-xs" placeholder="Base price" value={cfg.basePrice ?? ""} onChange={(e) => upd({ basePrice: Number(e.target.value) || 0 })} aria-label="Base price" /><input className="input h-8 w-20 text-xs" placeholder="$" value={cfg.currency ?? ""} onChange={(e) => upd({ currency: e.target.value.slice(0, 4) })} aria-label="Currency" /></div>}
      {t === "demo" && <label className="block text-xs text-muted-foreground">Steps (one per line: title | text)<textarea className="input mt-0.5 min-h-[90px] w-full text-xs" defaultValue={(cfg.steps ?? []).map((s) => `${s.title} | ${s.text}`).join("\n")} onBlur={(e) => upd({ steps: e.target.value.split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((p) => p[0]).map(([a, b]) => ({ title: a, text: b ?? "" })) })} /></label>}
      {t === "assistant" && <><input className="input h-8 w-full text-sm" placeholder="Topic" value={cfg.assistant?.topic ?? ""} onChange={(e) => upd({ assistant: { topic: e.target.value, starters: cfg.assistant?.starters ?? [] } })} aria-label="Topic" /><label className="block text-xs text-muted-foreground">Starter questions (one per line)<textarea className="input mt-0.5 min-h-[70px] w-full text-xs" defaultValue={(cfg.assistant?.starters ?? []).join("\n")} onBlur={(e) => upd({ assistant: { topic: cfg.assistant?.topic ?? "", starters: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 6) } })} /></label></>}
      <div className="grid gap-1.5 sm:grid-cols-[1fr_1fr_auto]"><input className="input h-8 text-xs" placeholder="Button label (optional)" value={cfg.cta?.label ?? ""} onChange={(e) => upd({ cta: e.target.value ? { label: e.target.value, to: cfg.cta?.to ?? "/book" } : undefined })} aria-label="Button label" /><input className="input h-8 text-xs" placeholder="/book" value={cfg.cta?.to ?? ""} onChange={(e) => cfg.cta && upd({ cta: { ...cfg.cta, to: e.target.value } })} aria-label="Button link" /><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!cfg.lead} onChange={(e) => upd({ lead: e.target.checked })} />Enquiry form</label></div>
    </div>
  );
}
