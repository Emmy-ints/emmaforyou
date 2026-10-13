import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, Mic, MicOff, Send, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import { speak, stopSpeaking, useSpeechInput, canSpeak } from "@/lib/use-voice";
import { track } from "@/lib/analytics";
import type { SearchHit } from "@/lib/site-search";

type SearchModule = typeof import("@/lib/site-search");
type Msg = { role: "user" | "assistant"; content: string; links?: { label: string; path: string }[] };

const GREETING = "Hi, I'm Emma 👋 I can tell you what EmmaForYou can do for your business, what it costs, or point you to the right free tool. What are you working on?";
const STARTERS = ["I need more customers", "How much is a website?", "Can you build a Web3 app?", "I need accountability coaching"];

/** Floating "Ask Emma AI": an AI sales assistant, with instant answers from the site and voice input. */
export default function VoiceAsk() {
  const [open, setOpen] = useState(false);
  const [mod, setMod] = useState<SearchModule | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: GREETING }]);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [leadSaved, setLeadSaved] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(false);
  const [speakable, setSpeakable] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = useRouterState({ select: (st) => st.location.pathname });

  useEffect(() => { setSpeakable(canSpeak()); }, []);
  useEffect(() => {
    if (!open) { stopSpeaking(); return; }
    if (!mod) import("@/lib/site-search").then(setMod);
    window.setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, mod]);
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("efy-open-ask", onOpen);
    return () => window.removeEventListener("efy-open-ask", onOpen);
  }, []);
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [messages, busy]);

  async function send(text: string, fromVoice = false) {
    const content = text.trim();
    if (!content || busy) return;
    setInput("");
    setError("");
    if (mod) setHits(mod.searchSite(content, 3));
    const history: Msg[] = [...messages, { role: "user", content }];
    setMessages(history);
    setBusy(true);
    track("assistant_message", { voice: fromVoice, page: pathname });
    try {
      const res = await fetch("/api/assistant", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: pathname, leadSaved, messages: history.slice(1).slice(-20).map(({ role, content: c }) => ({ role, content: c.slice(0, 800) })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Emma is unavailable right now.");
      setMessages((m) => [...m, { role: "assistant", content: data.reply, links: data.links }]);
      if (data.newLead) { setLeadSaved(true); track("assistant_lead", { page: pathname }); }
      if (voiceReplies || fromVoice) speak(data.reply);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const voice = useSpeechInput({ onFinal: (t) => send(t, true) });
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/portal")) return null;

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Ask Emma AI a question"
        className="fixed bottom-5 left-5 z-[60] hidden items-center gap-2 rounded-full border border-border bg-card/95 px-4 py-3 text-sm font-semibold text-foreground shadow-[var(--shadow-card-hover)] backdrop-blur transition hover:border-[var(--emma-violet)] md:flex">
        <span className="relative grid h-6 w-6 place-items-center rounded-full bg-[var(--emma-violet)] text-white"><Sparkles className="h-3.5 w-3.5" /></span>
        Ask Emma AI
      </button>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
            <motion.div role="dialog" aria-modal="true" aria-labelledby="ask-title" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
              className="flex h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[24px] border border-border bg-card shadow-2xl sm:h-[620px] sm:rounded-[24px]">
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--emma-violet)] text-white"><Sparkles className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <h2 id="ask-title" className="text-sm font-semibold text-foreground">Emma · EmmaForYou AI assistant</h2>
                  <p className="text-xs text-muted-foreground">Answers in seconds · a person follows up</p>
                </div>
                {speakable && (
                  <button onClick={() => { setVoiceReplies((v) => !v); stopSpeaking(); }} aria-pressed={voiceReplies} aria-label={voiceReplies ? "Turn spoken replies off" : "Read replies aloud"}
                    className={`grid h-8 w-8 place-items-center rounded-full ${voiceReplies ? "bg-[var(--emma-violet)] text-white" : "text-muted-foreground hover:bg-muted"}`}>
                    {voiceReplies ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </button>
                )}
                <button onClick={() => setOpen(false)} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
              </div>

              <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-background/60 px-4 py-4" aria-live="polite">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[85%] space-y-1.5">
                      <div className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "rounded-br-md bg-[var(--emma-violet)] text-white" : "rounded-bl-md border border-border bg-card text-foreground"}`}>{m.content}</div>
                      {m.links && m.links.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {m.links.map((l) => (
                            <Link key={l.path} to={l.path} onClick={() => setOpen(false)} className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-[var(--emma-violet)] hover:border-[var(--emma-violet)]">
                              {l.label} <ArrowRight className="h-3 w-3" />
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {busy && (
                  <div className="flex justify-start"><div className="flex gap-1 rounded-2xl rounded-bl-md border border-border bg-card px-3.5 py-3" aria-label="Emma is typing">
                    {[0, 1, 2].map((d) => <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${d * 0.15}s` }} />)}
                  </div></div>
                )}
                {messages.length === 1 && !busy && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {STARTERS.map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:border-[var(--emma-violet)]">{s}</button>)}
                  </div>
                )}
                {hits.length > 0 && (
                  <div className="rounded-2xl border border-dashed border-border p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Related on this site</p>
                    <ul className="mt-1.5 space-y-1">
                      {hits.map((h) => <li key={h.href + h.title}><a href={h.href} onClick={() => setOpen(false)} className="text-sm text-foreground hover:text-[var(--emma-violet)]">{h.title}</a></li>)}
                    </ul>
                  </div>
                )}
              </div>

              {(error || voice.error) && <p role="alert" className="px-4 pt-2 text-xs text-red-600">{error || voice.error}</p>}
              <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2 border-t border-border p-3">
                {voice.supported && (
                  <button type="button" onClick={() => (voice.listening ? voice.stop() : voice.start())} disabled={busy} aria-pressed={voice.listening} aria-label={voice.listening ? "Stop listening" : "Ask by voice"}
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border transition ${voice.listening ? "animate-pulse border-red-500 bg-red-500 text-white" : "border-border bg-card text-foreground hover:border-[var(--emma-violet)]"}`}>
                    {voice.listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>
                )}
                <label htmlFor="ask-input" className="sr-only">Message Emma</label>
                <input id="ask-input" ref={inputRef} value={voice.listening ? voice.interim || "Listening…" : input} readOnly={voice.listening} onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about services, prices, timelines…" maxLength={800} className="h-11 min-w-0 flex-1 rounded-full border border-input bg-background px-4 text-sm text-foreground outline-none focus:border-[var(--emma-violet)]" />
                <button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--emma-violet)] text-white disabled:opacity-40">
                  {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
