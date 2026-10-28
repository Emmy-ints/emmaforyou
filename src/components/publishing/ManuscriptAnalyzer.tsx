import { useMemo, useState } from "react";
import { Loader2, Sparkles, Upload } from "lucide-react";
import { analyze, easeLabel } from "@/lib/books/analyze";
import { useFlag } from "@/lib/site-settings";
import { track } from "@/lib/analytics";
import { Field, Notice, Panel, PrimaryBtn, SaveBar, ServiceCta, bookAi, inputCls, report, useAccountGate, useBookState } from "./shared";

const GOALS = [["readability", "Readability"], ["clarity", "Clarity"], ["structure", "Structure & pacing"], ["consistency", "Consistency (names, tense, voice)"], ["hook", "Opening hook"], ["dialogue", "Dialogue"]] as const;
interface Notes { overview: string; strengths: string[]; notes: { area: string; quote: string; issue: string; suggestion: string }[]; hook: { assessment: string; suggestion: string } | null; dropped: number }
interface State { title: string; lang: string; text: string; goals: string[]; ai: Notes | null; aiAt: string | null }
const initial = (): State => ({ title: "", lang: "en", text: "", goals: ["readability", "clarity", "hook"], ai: null, aiAt: null });
const MAX_WORDS = 20000;

export default function ManuscriptAnalyzer() {
  const s = useBookState<State>("manuscript-analyzer", "analysis", initial);
  const { state, setState } = s;
  const gate = useAccountGate("manuscript-analyzer");
  const aiOn = useFlag("publishing-ai", true);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const stats = useMemo(() => (state.text.trim().length > 50 ? analyze(state.text, state.lang) : null), [state.text, state.lang]);
  const tooLong = (stats?.words ?? 0) > MAX_WORDS;

  async function onFile(f: File | undefined) {
    if (!f) return; setErr("");
    if (f.size > 15 * 1048576) { setErr("Files up to 15 MB."); return; }
    setBusy("Reading…");
    const t0 = performance.now();
    try {
      let text = "";
      if (/\.docx$/i.test(f.name)) {
        const [{ importDocx }, { chapterToMd }] = await Promise.all([import("@/lib/books/import-docx"), import("@/lib/books/manuscript")]);
        const r = await importDocx(new Uint8Array(await f.arrayBuffer()));
        text = r.chapters.map((c) => `${c.title}\n\n${chapterToMd(c).replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")}`).join("\n\n");
      } else if (/\.(txt|md)$/i.test(f.name)) text = await f.text();
      else throw new Error("Upload a .docx, .txt or .md file, or paste the text.");
      setState((x) => ({ ...x, text, title: x.title || f.name.replace(/\.[^.]+$/, ""), ai: null }));
      report("manuscript-analyzer", "import", true, t0);
    } catch (e) { setErr((e as Error).message); report("manuscript-analyzer", "import", false, t0, (e as Error).message); } finally { setBusy(""); }
  }

  async function runAi() {
    setErr("");
    if (!stats || stats.words < 150) { setErr("Paste at least 150 words."); return; }
    if (tooLong) { setErr(`AI notes work on up to ${MAX_WORDS.toLocaleString()} words at a time. Paste one chapter or a sample.`); return; }
    setBusy("Reading your sample… (up to a minute)");
    try {
      const r = await bookAi<Notes>("analyze", { text: state.text, goals: state.goals }, "manuscript-analyzer");
      setState((x) => ({ ...x, ai: r, aiAt: new Date().toISOString() }));
      track("book_preview_generated", { tool: "manuscript-analyzer" });
    } catch (e) { setErr((e as Error).message); } finally { setBusy(""); }
  }

  if (!s.loaded) return <div className="py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" aria-label="Loading" /></div>;
  return (
    <div className="space-y-6">
      {s.loadError && <Notice tone="error">{s.loadError}</Notice>}
      <Panel title="1. Your text">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <Field label="Name (for your records)"><input className={inputCls} value={state.title} maxLength={160} onChange={(e) => setState((x) => ({ ...x, title: e.target.value }))} placeholder="e.g. Chapter 1 draft 3" /></Field>
          <Field label="Language"><select className={inputCls} value={state.lang} onChange={(e) => setState((x) => ({ ...x, lang: e.target.value }))}><option value="en">English</option><option value="other">Another language</option></select></Field>
          <label className="nav-ghost h-auto cursor-pointer px-4 py-2 text-sm"><Upload className="h-4 w-4" aria-hidden="true" />Upload .docx/.txt<input type="file" accept=".docx,.txt,.md" className="sr-only" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} /></label>
        </div>
        <textarea aria-label="Manuscript text" className={`${inputCls} mt-3 min-h-[220px]`} rows={12} value={state.text} onChange={(e) => setState((x) => ({ ...x, text: e.target.value, ai: null }))} placeholder="Paste a chapter or a sample (up to 20,000 words for AI notes)." />
        <p className="mt-1 text-xs text-muted-foreground">{stats ? `${stats.words.toLocaleString()} words` : "0 words"}{tooLong ? ` — over ${MAX_WORDS.toLocaleString()}: statistics still work; AI notes need a shorter sample.` : ""}. Your text is analysed in your browser; AI notes send it to our server and AI provider for this request only and it isn't stored unless you save the report.</p>
        {busy && <p role="status" className="mt-2 inline-flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{busy}</p>}
        {err && <div className="mt-3"><Notice tone="error">{err}</Notice></div>}
      </Panel>

      {stats && (
        <Panel title="2. Measured statistics">
          <p className="mb-4 text-xs text-muted-foreground">Counted from your text. These describe the writing; they don't grade it — genre and voice matter more than any formula.</p>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat k="Words · reading time" v={`${stats.words.toLocaleString()} · ~${stats.readingMinutes} min`} f="Reading time = words ÷ 238 words per minute" />
            <Stat k="Average sentence" v={`${stats.avgSentence} words`} f={`${stats.words} words ÷ ${stats.sentences} sentences`} />
            <Stat k="Flesch Reading Ease" v={stats.fleschEase == null ? "N/A" : `${stats.fleschEase} — ${easeLabel(stats.fleschEase)}`} f="206.835 − 1.015 × words/sentence − 84.6 × syllables/word (English only; syllables estimated)" />
            <Stat k="Flesch–Kincaid grade" v={stats.fkGrade == null ? "N/A" : `${stats.fkGrade}`} f="0.39 × words/sentence + 11.8 × syllables/word − 15.59 (English only)" />
            <Stat k="Long sentences (35+ words)" v={String(stats.longSentences.length)} f="Sentences over 35 words" />
            <Stat k="Possible passive voice" v={String(stats.passive.count)} f="Pattern: am/is/are/was/were/be/been/being + past participle. Some are fine." />
            <Stat k="-ly adverbs" v={`${stats.adverbs.count} (${stats.adverbs.per1000} per 1,000 words)`} f={stats.adverbs.top.length ? `Most used: ${stats.adverbs.top.slice(0, 5).map(([w, n]) => `${w} ×${n}`).join(", ")}` : "Words ending in -ly (common exceptions excluded)"} />
            <Stat k="Dialogue" v={`${stats.dialogueShare}% of words`} f="Words inside quotation marks ÷ all words" />
          </dl>
          {stats.repeated.length > 0 && <p className="mt-4 text-sm"><strong>Frequently repeated words:</strong> {stats.repeated.map(([w, n]) => `${w} (${n})`).join(", ")}. <span className="text-muted-foreground">Repetition can be deliberate; check the ones you didn't intend.</span></p>}
          {stats.paragraphs_long > 0 && <p className="mt-2 text-sm"><strong>{stats.paragraphs_long}</strong> paragraph{stats.paragraphs_long > 1 ? "s are" : " is"} over 250 words — long blocks are harder to read on phones.</p>}
          <div className="mt-4 rounded-2xl bg-muted/40 p-4 text-sm">
            <p className="font-semibold">Opening</p>
            <p className="mt-1 italic">“{stats.opening.firstSentence}”</p>
            <p className="mt-1 text-muted-foreground">Starts with {stats.opening.startsWith}{stats.opening.question ? ", as a question" : ""}; first paragraph {stats.opening.words} words.</p>
          </div>
          {stats.longSentences.length > 0 && (
            <details className="mt-4"><summary className="cursor-pointer text-sm font-semibold">Show long sentences ({stats.longSentences.length})</summary>
              <ul className="mt-2 space-y-2 text-sm">{stats.longSentences.map((x, i) => <li key={i} className="rounded-xl border border-border p-2"><span className="text-xs text-muted-foreground">{x.words} words · </span>{x.text}</li>)}</ul>
            </details>
          )}
        </Panel>
      )}

      {stats && (
        <Panel title="3. AI-assisted editorial notes">
          <fieldset><legend className="text-sm font-medium">What should the notes focus on?</legend>
            <div className="mt-2 flex flex-wrap gap-2">{GOALS.map(([id, l]) => <label key={id} className="tsh-chip cursor-pointer"><input type="checkbox" className="mr-2" checked={state.goals.includes(id)} onChange={(e) => setState((x) => ({ ...x, goals: e.target.checked ? [...x.goals, id] : x.goals.filter((g) => g !== id) }))} />{l}</label>)}</div>
          </fieldset>
          <PrimaryBtn className="mt-4" disabled={!!busy || !aiOn || tooLong} onClick={() => void runAi()}><Sparkles className="h-4 w-4" aria-hidden="true" />Get editorial notes</PrimaryBtn>
          {!aiOn && <p className="mt-2 text-sm text-muted-foreground">AI notes are switched off on this site right now; the statistics above still work.</p>}
          {state.ai && (
            <div className="mt-5 space-y-4">
              <Notice tone="info">AI-generated editorial assistance, not a professional edit. Every note quotes your text; notes whose quote couldn't be found in your text were removed{state.ai.dropped ? ` (${state.ai.dropped})` : ""}. Use what helps.</Notice>
              <p className="leading-relaxed">{state.ai.overview}</p>
              {state.ai.strengths.length > 0 && <div><p className="text-sm font-semibold">Strengths</p><ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{state.ai.strengths.map((x) => <li key={x}>{x}</li>)}</ul></div>}
              {state.ai.hook && <div className="rounded-2xl border border-border p-4 text-sm"><p className="font-semibold">Opening hook</p><p className="mt-1">{state.ai.hook.assessment}</p><p className="mt-1 text-muted-foreground">Try: {state.ai.hook.suggestion}</p></div>}
              <ul className="space-y-3">{state.ai.notes.map((n, i) => (
                <li key={i} className="rounded-2xl border border-border p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--hue)]">{n.area}</p>
                  <blockquote className="mt-1 border-l-2 border-border pl-3 italic">“{n.quote}”</blockquote>
                  <p className="mt-2">{n.issue}</p>
                  <p className="mt-1 text-muted-foreground">Suggestion: {n.suggestion}</p>
                </li>
              ))}</ul>
            </div>
          )}
          <div className="mt-5 border-t border-border pt-4"><SaveBar kind="analysis" title={state.title || "Manuscript analysis"} data={state} meta={{ words: stats.words, notes: state.ai?.notes.length ?? 0 }} projectId={s.projectId} setProjectId={s.setProjectId} gateRequire={gate.require} /></div>
        </Panel>
      )}
      <ServiceCta service="ebook-formatting-conversion" title="Want a human editor?" body="Tell us what your manuscript needs. We'll say honestly what we can help with — structure, clarity, formatting and launch — and suggest finding a specialist editor where that's the better choice." cta="Ask about editing support" />
      {gate.gate}
    </div>
  );
}

function Stat({ k, v, f }: { k: string; v: string; f: string }) {
  return <div className="rounded-2xl border border-border p-3"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="mt-1 font-semibold">{v}</dd><p className="mt-1 text-[11px] leading-snug text-muted-foreground">{f}</p></div>;
}
