import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, Mic, MicOff, Search, Sparkles, Volume2, X } from "lucide-react";
import { speak, stopSpeaking, useSpeechInput, canSpeak } from "@/lib/use-voice";
import { track } from "@/lib/analytics";
import type { SearchHit } from "@/lib/site-search";

type SearchModule = typeof import("@/lib/site-search");

/** Floating "Ask" button: voice or typed questions answered from the site's own content. */
export default function VoiceAsk() {
  const [open, setOpen] = useState(false);
  const [mod, setMod] = useState<SearchModule | null>(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [speakable, setSpeakable] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setSpeakable(canSpeak()); }, []);
  useEffect(() => {
    if (!open) { stopSpeaking(); return; }
    if (!mod) import("@/lib/site-search").then(setMod);
    window.setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, mod]);
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("efy-open-ask", onOpen);
    return () => window.removeEventListener("efy-open-ask", onOpen);
  }, []);

  function ask(text: string, fromVoice = false) {
    const q = text.trim();
    setQuery(q);
    if (!q || !mod) return;
    const res = mod.searchSite(q);
    setHits(res);
    track("voice_search", { voice: fromVoice, found: res.length > 0 });
    if (fromVoice && res[0]) speak(res[0].answer);
  }

  const voice = useSpeechInput({ onFinal: (t) => ask(t, true) });
  const pathname = useRouterState({ select: (st) => st.location.pathname });
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/portal")) return null;

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Ask a question by voice or text"
        className="fixed bottom-5 left-5 z-[60] flex items-center gap-2 rounded-full border border-border bg-card/95 px-4 py-3 text-sm font-semibold text-foreground shadow-[var(--shadow-card-hover)] backdrop-blur transition hover:border-[var(--emma-violet)]">
        <Mic className="h-4 w-4 text-[var(--emma-violet)]" /> <span className="hidden sm:inline">Ask anything</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-start sm:pt-24" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
            <motion.div role="dialog" aria-modal="true" aria-labelledby="ask-title" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-xl overflow-hidden rounded-[24px] border border-border bg-card shadow-2xl">
              <div className="flex items-center justify-between px-5 pt-4">
                <h2 id="ask-title" className="flex items-center gap-2 text-sm font-semibold text-foreground"><Sparkles className="h-4 w-4 text-[var(--emma-violet)]" /> Ask EmmaForYou</h2>
                <button onClick={() => setOpen(false)} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); ask(query); }} className="flex items-center gap-2 px-5 py-3">
                <div className="flex flex-1 items-center gap-2 rounded-full border border-input bg-background px-4">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <label htmlFor="ask-input" className="sr-only">Your question</label>
                  <input id="ask-input" ref={inputRef} value={voice.listening ? voice.interim || "Listening…" : query} readOnly={voice.listening}
                    onChange={(e) => { setQuery(e.target.value); if (mod && e.target.value.trim().length > 3) setHits(mod.searchSite(e.target.value)); }}
                    placeholder="e.g. How much does a website cost?" maxLength={200} className="h-11 w-full bg-transparent text-sm text-foreground outline-none" />
                </div>
                {voice.supported && (
                  <button type="button" onClick={() => (voice.listening ? voice.stop() : voice.start())} aria-pressed={voice.listening} aria-label={voice.listening ? "Stop listening" : "Ask by voice"}
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition ${voice.listening ? "animate-pulse bg-red-500 text-white" : "bg-[var(--emma-violet)] text-white"}`}>
                    {voice.listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>
                )}
              </form>
              {voice.error && <p role="alert" className="px-5 text-xs text-red-600">{voice.error}</p>}

              <div className="max-h-[55vh] overflow-y-auto px-5 pb-5" aria-live="polite">
                {!mod ? (
                  <div className="grid h-24 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : hits === null ? (
                  <div>
                    <p className="text-xs text-muted-foreground">{voice.supported ? "Tap the mic and ask out loud, or type. Try:" : "Type a question. Try:"}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {mod.SAMPLE_QUESTIONS.map((s) => <button key={s} onClick={() => ask(s)} className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground hover:border-[var(--emma-violet)]">{s}</button>)}
                    </div>
                  </div>
                ) : hits.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No direct answer on the site for that. <a href="https://wa.me/message/HHGMMWMRJFYUC1" target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--emma-violet)]">Ask us on WhatsApp</a> and a person will reply.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-2xl bg-muted p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--emma-violet)]">{hits[0].kind}</p>
                      <p className="mt-1 font-semibold text-foreground">{hits[0].title}</p>
                      <p className="mt-1.5 text-sm text-muted-foreground">{hits[0].answer}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a href={hits[0].href} onClick={() => setOpen(false)} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--emma-violet)]">Open <ArrowRight className="h-3.5 w-3.5" /></a>
                        {speakable && <button onClick={() => speak(hits[0].answer)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><Volume2 className="h-3.5 w-3.5" /> Read aloud</button>}
                      </div>
                    </div>
                    {hits.slice(1).map((h) => (
                      <a key={h.title + h.href} href={h.href} onClick={() => setOpen(false)} className="block rounded-2xl border border-border p-3 hover:border-[var(--emma-violet)]">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h.kind}</p>
                        <p className="text-sm font-medium text-foreground">{h.title}</p>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
