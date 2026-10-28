import { useState } from "react";
import { Copy, Download, Loader2, Sparkles } from "lucide-react";
import { CHECKED, METADATA, SOURCES } from "@/lib/books/specs";
import { lintDescription, lintKeyword } from "@/lib/books/listing";
import { safeFileName } from "@/lib/books/manuscript";
import { useFlag } from "@/lib/site-settings";
import { track } from "@/lib/analytics";
import { Field, GhostBtn, Notice, Panel, PrimaryBtn, SaveBar, ServiceCta, bookAi, downloadBytes, inputCls, useAccountGate, useBookState } from "./shared";

const OUTPUTS = [
  ["description", "Book description & short blurb"], ["taglines", "Taglines / hooks"], ["bio", "Author bio"], ["keywords", "7 keywords"],
  ["categories", "Category ideas"], ["positioning", "Audience & positioning"], ["captions", "Social captions"], ["emails", "Launch emails"],
] as const;
type OutId = (typeof OUTPUTS)[number][0];
interface Drafts {
  description?: string; shortBlurb?: string; taglines?: string[]; bio?: string; keywords?: { k: string; overlap: string[] }[];
  categories?: { path: string; why: string }[]; positioning?: { audience: string; promise: string; differentiator: string; comparables: string };
  captions?: { platform: string; text: string }[]; emails?: { subject: string; body: string }[];
}
interface State { title: string; subtitle: string; author: string; genre: string; audience: string; summary: string; comps: string; tone: string; bioFacts: string; outputs: OutId[]; drafts: Drafts; generatedAt: string | null }
const initial = (): State => ({ title: "", subtitle: "", author: "", genre: "", audience: "", summary: "", comps: "", tone: "warm and confident", bioFacts: "", outputs: ["description", "taglines", "keywords", "categories"], drafts: {}, generatedAt: null });

export default function MarketingAssistant() {
  const s = useBookState<State>("book-marketing", "marketing", initial);
  const { state, setState } = s;
  const gate = useAccountGate("book-marketing");
  const aiOn = useFlag("publishing-ai", true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const set = (k: keyof State, v: unknown) => setState((x) => ({ ...x, [k]: v }));
  const setDraft = (fn: (d: Drafts) => Drafts) => setState((x) => ({ ...x, drafts: fn(x.drafts) }));

  async function generate() {
    setErr(""); setNote("");
    if (!state.title.trim()) { setErr("Add your book's title."); return; }
    if (state.summary.trim().length < 40) { setErr("Write a summary of at least a couple of sentences: what happens or what readers learn, and who it's for."); return; }
    if (!state.outputs.length) { setErr("Choose at least one thing to write."); return; }
    setBusy(true);
    try {
      const r = await bookAi<{ drafts: Drafts; removed: string[] }>("marketing", { title: state.title, subtitle: state.subtitle, author: state.author, genre: state.genre, audience: state.audience, summary: state.summary, comps: state.comps, tone: state.tone, bioFacts: state.bioFacts, outputs: state.outputs }, "book-marketing");
      setState((x) => ({ ...x, drafts: { ...x.drafts, ...r.drafts }, generatedAt: new Date().toISOString() }));
      setNote(r.removed?.length ? `AI drafts below — edit them freely. We removed sentences with claims KDP doesn't allow or that we can't verify (e.g. “bestseller”, “#1”) from: ${r.removed.join(", ")}.` : "AI drafts below — edit them freely before using them.");
      track("book_preview_generated", { tool: "book-marketing" });
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  const d = state.drafts;
  const allText = () => [
    `${state.title}${state.subtitle ? `: ${state.subtitle}` : ""} — ${state.author}`, "",
    d.description && `BOOK DESCRIPTION\n${d.description}\n\nSHORT BLURB\n${d.shortBlurb ?? ""}`,
    d.taglines?.length && `TAGLINES\n${d.taglines.map((t) => `- ${t}`).join("\n")}`,
    d.bio && `AUTHOR BIO\n${d.bio}`,
    d.keywords?.length && `KEYWORDS\n${d.keywords.map((k) => k.k).join("\n")}`,
    d.categories?.length && `CATEGORY IDEAS (choose from the platform's list)\n${d.categories.map((c) => `- ${c.path}: ${c.why}`).join("\n")}`,
    d.positioning && `POSITIONING\nAudience: ${d.positioning.audience}\nPromise: ${d.positioning.promise}\nDifferent because: ${d.positioning.differentiator}\nComparables: ${d.positioning.comparables}`,
    d.captions?.length && `SOCIAL CAPTIONS\n${d.captions.map((c) => `[${c.platform}]\n${c.text}`).join("\n\n")}`,
    d.emails?.length && `LAUNCH EMAILS\n${d.emails.map((e) => `Subject: ${e.subject}\n${e.body}`).join("\n\n---\n\n")}`,
  ].filter(Boolean).join("\n\n");

  if (!s.loaded) return <div className="py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" aria-label="Loading" /></div>;
  const descLint = d.description != null ? lintDescription(d.description) : [];
  const has = Object.keys(d).length > 0;

  return (
    <div className="space-y-6">
      {s.loadError && <Notice tone="error">{s.loadError}</Notice>}
      <Panel title="1. Your book">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Title *"><input className={inputCls} value={state.title} maxLength={200} onChange={(e) => set("title", e.target.value)} /></Field>
          <Field label="Subtitle"><input className={inputCls} value={state.subtitle} maxLength={200} onChange={(e) => set("subtitle", e.target.value)} /></Field>
          <Field label="Author"><input className={inputCls} value={state.author} maxLength={120} onChange={(e) => set("author", e.target.value)} /></Field>
          <Field label="Genre"><input className={inputCls} value={state.genre} maxLength={80} placeholder="e.g. cosy mystery, leadership" onChange={(e) => set("genre", e.target.value)} /></Field>
          <Field label="Audience"><input className={inputCls} value={state.audience} maxLength={300} placeholder="Who is it for?" onChange={(e) => set("audience", e.target.value)} /></Field>
          <Field label="Tone"><select className={inputCls} value={state.tone} onChange={(e) => set("tone", e.target.value)}>{["warm and confident", "dramatic and suspenseful", "playful", "authoritative and practical", "lyrical", "inspirational"].map((t) => <option key={t}>{t}</option>)}</select></Field>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Summary *" hint="What happens or what readers learn, and why it matters. 2–8 sentences."><textarea className={inputCls} rows={5} maxLength={3000} value={state.summary} onChange={(e) => set("summary", e.target.value)} /></Field>
          <div className="space-y-4">
            <Field label="Comparable books or authors (optional)" hint="Only titles you know readers of your book enjoy. Used for positioning, never as keywords."><input className={inputCls} value={state.comps} maxLength={300} onChange={(e) => set("comps", e.target.value)} /></Field>
            <Field label="Facts for your author bio (optional)" hint="Real facts only: where you live, your work, past books. Nothing is invented."><textarea className={inputCls} rows={3} maxLength={800} value={state.bioFacts} onChange={(e) => set("bioFacts", e.target.value)} /></Field>
          </div>
        </div>
        <fieldset className="mt-4">
          <legend className="text-sm font-medium">What should we draft?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {OUTPUTS.map(([id, label]) => (
              <label key={id} className={`tsh-chip cursor-pointer ${state.outputs.includes(id) ? "!border-[var(--hue)]" : ""}`}><input type="checkbox" className="mr-2" checked={state.outputs.includes(id)} onChange={(e) => set("outputs", e.target.checked ? [...state.outputs, id] : state.outputs.filter((x) => x !== id))} />{label}</label>
            ))}
          </div>
        </fieldset>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <PrimaryBtn disabled={busy || !aiOn} onClick={() => void generate()}>{busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}{busy ? "Writing drafts…" : "Draft with AI"}</PrimaryBtn>
          {!aiOn && <span className="text-sm text-muted-foreground">AI drafting is switched off on this site right now. You can still write and check your copy below.</span>}
        </div>
        {err && <div className="mt-3"><Notice tone="error">{err}</Notice></div>}
        {note && <div className="mt-3"><Notice tone="info">{note}</Notice></div>}
      </Panel>

      <Panel title="2. Drafts — edit anything" actions={has && <div className="flex gap-2"><GhostBtn onClick={() => void navigator.clipboard?.writeText(allText())}><Copy className="h-4 w-4" aria-hidden="true" />Copy all</GhostBtn><GhostBtn onClick={() => gate.require("Sign in to download your copy", () => downloadBytes(new TextEncoder().encode(allText()), safeFileName(`${state.title}-listing-copy`, "txt"), "text/plain"))}><Download className="h-4 w-4" aria-hidden="true" />.txt</GhostBtn></div>}>
        <p className="mb-4 text-xs text-muted-foreground">AI-written drafts are a starting point: check facts and tone, and make them yours. Checks below use KDP's published rules (<a className="underline" href={SOURCES.description} target="_blank" rel="noopener noreferrer">description</a>, <a className="underline" href={SOURCES.keywords} target="_blank" rel="noopener noreferrer">keywords</a>; checked {CHECKED}).</p>
        <div className="space-y-5">
          <Field label={`Book description · ${(d.description ?? "").length.toLocaleString()} / ${METADATA.descriptionMax.toLocaleString()} characters`}><textarea className={inputCls} rows={9} value={d.description ?? ""} onChange={(e) => setDraft((x) => ({ ...x, description: e.target.value }))} placeholder="Write or generate your description" /></Field>
          {descLint.map((l) => <Notice key={l} tone="warn">{l}</Notice>)}
          {(d.shortBlurb != null || d.description != null) && <Field label="Short blurb (ads, social bios)"><textarea className={inputCls} rows={2} value={d.shortBlurb ?? ""} onChange={(e) => setDraft((x) => ({ ...x, shortBlurb: e.target.value }))} /></Field>}
          {d.taglines && <ListEdit label="Taglines" items={d.taglines} onChange={(v) => setDraft((x) => ({ ...x, taglines: v }))} />}
          {d.bio != null && <Field label="Author bio"><textarea className={inputCls} rows={4} value={d.bio} onChange={(e) => setDraft((x) => ({ ...x, bio: e.target.value }))} /></Field>}
          {d.keywords && (
            <div>
              <p className="text-sm font-medium">Keywords ({d.keywords.length} / {METADATA.keywordBoxes} boxes)</p>
              <ul className="mt-2 space-y-2">
                {d.keywords.map((k, i) => {
                  const w = lintKeyword(k.k, `${state.title} ${state.subtitle} ${state.author}`);
                  return (
                    <li key={i}>
                      <input aria-label={`Keyword ${i + 1}`} className={inputCls} value={k.k} maxLength={50} onChange={(e) => setDraft((x) => ({ ...x, keywords: x.keywords!.map((y, j) => (j === i ? { ...y, k: e.target.value } : y)) }))} />
                      {w && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{w}</p>}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">Avoid: {METADATA.keywordAvoid.join("; ")}.</p>
            </div>
          )}
          {d.categories && (
            <div>
              <p className="text-sm font-medium">Category ideas</p>
              <ul className="mt-2 space-y-2 text-sm">{d.categories.map((c, i) => <li key={i} className="rounded-xl border border-border p-3"><input aria-label={`Category ${i + 1}`} className={inputCls} value={c.path} onChange={(e) => setDraft((x) => ({ ...x, categories: x.categories!.map((y, j) => (j === i ? { ...y, path: e.target.value } : y)) }))} /><p className="mt-1 text-xs text-muted-foreground">{c.why}</p></li>)}</ul>
              <p className="mt-2 text-xs text-muted-foreground">These are suggestions to look for. Choose real categories from the list in your KDP (or other store) dashboard; names differ by store and change over time.</p>
            </div>
          )}
          {d.positioning && (
            <div className="grid gap-3 md:grid-cols-2">
              {(["audience", "promise", "differentiator", "comparables"] as const).map((k) => <Field key={k} label={{ audience: "Who it's for", promise: "The promise", differentiator: "What makes it different", comparables: "Comparable titles" }[k]}><textarea className={inputCls} rows={3} value={d.positioning![k]} onChange={(e) => setDraft((x) => ({ ...x, positioning: { ...x.positioning!, [k]: e.target.value } }))} /></Field>)}
            </div>
          )}
          {d.captions && d.captions.map((c, i) => <Field key={i} label={`Caption · ${c.platform}`}><textarea className={inputCls} rows={4} value={c.text} onChange={(e) => setDraft((x) => ({ ...x, captions: x.captions!.map((y, j) => (j === i ? { ...y, text: e.target.value } : y)) }))} /></Field>)}
          {d.emails && d.emails.map((m, i) => (
            <div key={i} className="rounded-2xl border border-border p-3">
              <Field label={`Email ${i + 1} · subject`}><input className={inputCls} value={m.subject} onChange={(e) => setDraft((x) => ({ ...x, emails: x.emails!.map((y, j) => (j === i ? { ...y, subject: e.target.value } : y)) }))} /></Field>
              <Field label="Body"><textarea className={inputCls} rows={6} value={m.body} onChange={(e) => setDraft((x) => ({ ...x, emails: x.emails!.map((y, j) => (j === i ? { ...y, body: e.target.value } : y)) }))} /></Field>
            </div>
          ))}
        </div>
        <div className="mt-5 border-t border-border pt-4"><SaveBar kind="marketing" title={state.title || "Listing copy"} data={state} meta={{ outputs: Object.keys(d).length, generatedAt: state.generatedAt }} projectId={s.projectId} setProjectId={s.setProjectId} gateRequire={gate.require} /></div>
      </Panel>
      <ServiceCta service="book-marketing" title="Want a book marketing strategy?" body="We research your positioning, write and test your listing, and plan and run email, social and ad campaigns — reporting what each channel actually delivers." cta="Request a marketing strategy" />
      {gate.gate}
    </div>
  );
}

function ListEdit({ label, items, onChange }: { label: string; items: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <ul className="mt-2 space-y-2">{items.map((t, i) => <li key={i}><input aria-label={`${label} ${i + 1}`} className={inputCls} value={t} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} /></li>)}</ul>
    </div>
  );
}
