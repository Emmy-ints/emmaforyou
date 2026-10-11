import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Code2, Loader2, Maximize2, Monitor, Pencil, RotateCw, Smartphone, Square, Tablet, WandSparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import BusinessIntakeForm from '../intake/BusinessIntakeForm';
import { useI18n } from '@/lib/i18n';
import { homeExperienceCopy } from '@/lib/home-experience-copy';
import { previewDocument } from '@/lib/prototype';

export default function PrototypeBuilder() {
 const { lang } = useI18n(); const c = homeExperienceCopy[lang];
 const [prompt, setPrompt] = useState(''); const [originalPrompt, setOriginalPrompt] = useState('');
 const [html, setHtml] = useState(''); const [partial, setPartial] = useState('');
 const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [terminal, setTerminal] = useState(false);
 const [stage, setStage] = useState(0); const [device, setDevice] = useState('desktop');
 const [refining, setRefining] = useState(false); const [change, setChange] = useState('');
 const [full, setFull] = useState(false); const [intake, setIntake] = useState(false);
 const abort = useRef<AbortController | null>(null);
 useEffect(() => () => abort.current?.abort(), []);
 useEffect(() => { if (!busy) return; const timer = setInterval(() => setStage(s => Math.min(s + 1, 2)), 6000); return () => clearInterval(timer); }, [busy]);
 async function generate(mode: 'new' | 'refine' | 'regenerate') {
  const idea = mode === 'new' ? prompt : originalPrompt;
  if (busy || terminal || idea.trim().length < 8) return;
  setBusy(true); setError(''); setPartial(''); setStage(0); const controller = new AbortController(); abort.current = controller;
  let accumulated = ''; let completed = false; let failed = false;
  try {
   const response = await fetch('/api/prototype', { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: idea, language: lang, ...(mode === 'refine' ? { html, refinement: change } : {}) }) });
   if (!response.ok) { const value = await response.json(); if ([401, 402, 403, 404].includes(response.status)) setTerminal(true); throw new Error(value.message || 'Generation is unavailable. Please try later.'); }
   if (!response.body) throw new Error('The AI service returned no prototype.');
   const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = '';
   while (true) {
    const chunk = await reader.read(); if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });
    let pos;
    while ((pos = buffer.indexOf('\n')) >= 0) {
     const line = buffer.slice(0, pos); buffer = buffer.slice(pos + 1); if (!line.trim()) continue;
     const event = JSON.parse(line);
     if (event.type === 'text') { accumulated += event.text; setPartial(accumulated); setStage(2); }
     if (event.type === 'done') completed = true;
     if (event.type === 'error') { failed = true; throw new Error(event.message); }
    }
   }
   if (!completed || failed || !accumulated.includes('</html>')) throw new Error('The prototype was interrupted. Please try again later.');
   setHtml(accumulated); setOriginalPrompt(idea); setRefining(false); setChange('');
  } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Generation could not finish. Please try later.'); }
  finally { setBusy(false); setPartial(''); abort.current = null; }
 }
 const doc = html ? previewDocument(html) : '';
 return <section id="prototype" className="prototype-section px-5 py-16 md:px-8 md:py-24">
  <div className="mx-auto max-w-6xl">
   <div className="mb-10 text-center"><span className="text-xs font-bold text-emma-blue">{c.eyebrow}</span><h2 className="mt-4 text-3xl md:text-5xl">{c.title}</h2></div>
   <form className="prototype-prompt" onSubmit={e => { e.preventDefault(); void generate('new'); }}>
    <label htmlFor="prototype-prompt" className="sr-only">{c.placeholder}</label>
    <textarea id="prototype-prompt" placeholder={c.placeholder} maxLength={500} value={prompt} onChange={e => setPrompt(e.target.value)} disabled={busy} className="min-h-28 w-full resize-y bg-transparent p-5 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring" />
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3"><span className="text-xs text-muted-foreground">{prompt.length}/500</span><Button type="submit" disabled={busy || terminal || prompt.trim().length < 8} className="btn-gold h-11"><WandSparkles />{c.generate}</Button></div>
   </form>
   <div className="my-5 flex flex-wrap justify-center gap-2">{c.examples.map(example => <Button key={example} variant="outline" disabled={busy} onClick={() => setPrompt(example)} className="h-auto whitespace-normal rounded-full py-2 text-left text-xs">{example}</Button>)}</div>
   {error && <div role="alert" className="mb-4 rounded-md border border-destructive p-4 text-sm text-foreground">{error}</div>}
   <div className="prototype-browser">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted p-3">
     <div className="flex items-center gap-2"><Code2 className="h-4 w-4 text-emma-blue" /><span className="text-xs font-medium">{c.preview}</span></div>
     <div className="flex flex-wrap items-center gap-1">
      {([{ id: 'desktop', icon: Monitor }, { id: 'tablet', icon: Tablet }, { id: 'mobile', icon: Smartphone }]).map(({ id, icon: Icon }) => <Button key={id} size="icon" variant={device === id ? 'default' : 'ghost'} title={c[id as 'desktop' | 'tablet' | 'mobile']} aria-label={c[id as 'desktop' | 'tablet' | 'mobile']} aria-pressed={device === id} onClick={() => setDevice(id)}><Icon /></Button>)}
      <span className="mx-1 h-5 border-l border-border" />
      <Button size="icon" variant="ghost" title={c.refine} aria-label={c.refine} disabled={!html || busy || terminal} onClick={() => setRefining(s => !s)}><Pencil /></Button>
      <Button size="icon" variant="ghost" title={c.regenerate} aria-label={c.regenerate} disabled={!html || busy || terminal} onClick={() => void generate('regenerate')}><RotateCw /></Button>
      <Button size="icon" variant="ghost" title={c.fullscreen} aria-label={c.fullscreen} disabled={!html} onClick={() => setFull(true)}><Maximize2 /></Button>
     </div>
    </div>
    {refining && <form className="flex flex-wrap gap-2 border-b border-border p-3" onSubmit={e => { e.preventDefault(); void generate('refine'); }}><input aria-label={c.change} placeholder={c.change} maxLength={500} value={change} onChange={e => setChange(e.target.value)} className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" /><Button disabled={busy || !change.trim()}>{c.apply}</Button></form>}
    <div className="prototype-stage">
     {html && !busy ? <iframe title={c.preview} srcDoc={doc} sandbox="allow-scripts allow-forms" className={`prototype-iframe device-${device}`} /> : <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
      {busy ? <><Loader2 className="mb-5 h-9 w-9 animate-spin text-emma-blue" /><p aria-live="polite" className="font-semibold">{[c.sketch, c.code, c.interactions][stage]}</p><p className="mt-3 font-mono text-xs text-muted-foreground">{partial.length ? `${partial.length.toLocaleString()} bytes` : c.generating}</p><Button variant="outline" onClick={() => abort.current?.abort()} className="mt-5"><Square />{c.stop}</Button></> : <><WandSparkles className="mb-5 h-10 w-10 text-emma-gold" /><p className="text-lg font-medium">{c.empty}</p></>}
     </div>}
    </div>
   </div>
   {html && <div className="mt-6 text-center"><Button onClick={() => setIntake(true)} className="btn-gold h-auto whitespace-normal px-6 py-3">{c.hook}<ArrowUpRight /></Button></div>}
  </div>
  <Dialog open={full} onOpenChange={setFull}><DialogContent className="h-[92dvh] w-[96vw] max-w-none p-3"><DialogTitle>{c.preview}</DialogTitle><DialogDescription className="sr-only">{originalPrompt}</DialogDescription><iframe title={`${c.preview} fullscreen`} srcDoc={doc} sandbox="allow-scripts allow-forms" className="h-full min-h-0 w-full rounded-md" /></DialogContent></Dialog>
  <Dialog open={intake} onOpenChange={setIntake}><DialogContent className="max-h-[90dvh] w-[95vw] max-w-3xl overflow-y-auto"><DialogTitle>{c.intake}</DialogTitle><DialogDescription className="sr-only">{originalPrompt}</DialogDescription><BusinessIntakeForm initialDescription={originalPrompt} onClose={() => setIntake(false)} /></DialogContent></Dialog>
 </section>;
}
