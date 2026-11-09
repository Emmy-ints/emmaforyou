import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, Mic, MicOff, Send, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import { speak, stopSpeaking, useSpeechInput, canSpeak } from "@/lib/use-voice";
import { track } from "@/lib/analytics";
import type { SearchHit } from "@/lib/site-search";
import { QUESTIONS, recommend, profileText, BUSINESSES, type Answers, type Recommendation } from "@/lib/qualify";
import { buildWa } from "@/lib/leads";
import { supabase } from "@/integrations/supabase/client";
import NextCallTimes from "./NextCallTimes";

type SearchModule = typeof import("@/lib/site-search");
type QKey = (typeof QUESTIONS)[number]["key"];
type Msg = { role: "user" | "assistant"; content: string; links?: { label: string; path: string }[]; offline?: boolean; ask?: QKey; rec?: Recommendation };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const leadsDb = supabase as unknown as { from: (t: string) => any };
const QUICK = "Get a recommendation in 4 quick taps";

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
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [asking, setAsking] = useState<QKey | null>(null);
  const [savedName, setSavedName] = useState("");
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
  // Other tools (e.g. the solution finder) can open Ask with a question already filled in.
  useEffect(() => {
    const onOpen = (e: Event) => {
      setOpen(true);
      const q = (e as CustomEvent<unknown>).detail;
      if (typeof q === "string" && q.trim()) window.setTimeout(() => setInput(q.slice(0, 780)), 80);
      // { qualify: true, business?: "salon" } starts the quick recommendation (e.g. from an industry page).
      if (q && typeof q === "object" && (q as { qualify?: boolean }).qualify) {
        const b = (q as { business?: string }).business;
        window.setTimeout(() => startQualify(BUSINESSES.some((x) => x.id === b) ? (b as Answers["business"]) : undefined), 80);
      }
    };
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
        body: JSON.stringify({ page: pathname, leadSaved, profile: profileText(answers) || undefined, messages: history.slice(1).filter((m) => m.content.trim()).slice(-20).map(({ role, content: c }) => ({ role, content: c.slice(0, 800) })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Emma is unavailable right now.");
      setMessages((m) => [...m, { role: "assistant", content: data.reply, links: data.links, offline: !!data.offline }]);
      if (data.newLead) { setLeadSaved(true); track("assistant_lead", { page: pathname }); }
      if (voiceReplies || fromVoice) speak(data.reply);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  /** Quick qualification: one tap per question, then a recommendation from the site's own plans and pages. */
  function startQualify(business?: Answers["business"]) {
    if (asking) return;
    track("assistant_qualify_start", { page: pathname, preset: business ?? "" });
    const start: Partial<Answers> = business ? { business } : {};
    setAnswers(start);
    const first = QUESTIONS.find((q) => !(q.key in start))!;
    setAsking(first.key);
    setMessages((m) => [...m, ...(business ? [] : [{ role: "user" as const, content: QUICK }]), { role: "assistant", content: first.ask, ask: first.key }]);
  }
  function answer(key: QKey, id: string, label: string) {
    const next = { ...answers, [key]: id } as Partial<Answers>;
    setAnswers(next);
    const q = QUESTIONS.find((x) => !(x.key in next));
    if (q) {
      setAsking(q.key);
      setMessages((m) => [...m, { role: "user", content: label }, { role: "assistant", content: q.ask, ask: q.key }]);
      return;
    }
    setAsking(null);
    const rec = recommend(next as Answers);
    track("assistant_qualified", { page: pathname, temperature: rec.temperature, plan: rec.plan ?? "call" });
    setMessages((m) => [...m, { role: "user", content: label }, { role: "assistant", content: rec.message, links: rec.links, rec }]);
  }

  const voice = useSpeechInput({ onFinal: (t) => send(t, true) });
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/portal") || pathname.startsWith("/community") || pathname.startsWith("/p/")) return null;

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
                      {m.offline && <p className="text-[11px] text-muted-foreground">Automatic reply: the AI assistant is offline right now.</p>}
                      {m.ask && asking === m.ask && i === messages.length - 1 && (
                        <div className="flex flex-wrap gap-1.5" role="group" aria-label={m.content} data-qualify={m.ask}>
                          {QUESTIONS.find((q) => q.key === m.ask)!.options.map((o) => (
                            <button key={o.id} type="button" onClick={() => answer(m.ask!, o.id, o.label)} className="rounded-full border border-[var(--emma-violet)]/40 bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-[var(--emma-violet)] hover:bg-[var(--emma-violet)]/5">{o.label}</button>
                          ))}
                        </div>
                      )}
                      {m.rec && <RecNext rec={m.rec} page={pathname} leadSaved={leadSaved} savedName={savedName} onSaved={(n) => { setSavedName(n); setLeadSaved(true); }} />}
                      {m.links && m.links.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {m.links.map((l) => l.path.includes("#") ? (
                            <a key={l.path} href={l.path} onClick={() => setOpen(false)} className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-[var(--emma-violet)] hover:border-[var(--emma-violet)]">
                              {l.label} <ArrowRight className="h-3 w-3" />
                            </a>
                          ) : (
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
                    <button onClick={() => startQualify()} className="rounded-full bg-[var(--emma-violet)] px-3 py-1.5 text-xs font-semibold text-white">{QUICK}</button>
                    {STARTERS.map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:border-[var(--emma-violet)]">{s}</button>)}
                  </div>
                )}
                {messages.length > 2 && !busy && !asking && !answers.timing && messages[messages.length - 1].role === "assistant" && !messages[messages.length - 1].rec && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button onClick={() => startQualify()} className="rounded-full border border-[var(--emma-violet)]/50 bg-card px-3 py-1.5 text-xs font-semibold text-[var(--emma-violet)]">{QUICK}</button>
                    {/* Human handover: the conversation so far goes with them, so they don't repeat themselves. */}
                    <a data-ask-human href={buildWa(`Hi Emmanuel, I was chatting with Emma on your website (${pathname}). My questions:\n${messages.filter((m) => m.role === "user").slice(-3).map((m) => `• ${m.content.slice(0, 160)}`).join("\n")}`)} target="_blank" rel="noopener noreferrer" onClick={() => track("whatsapp_click", { from: "ask_emma_handover" })} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:border-[#25d366]">Talk to a person on WhatsApp</a>
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


/** After the recommendation: real call times, WhatsApp with the answers, or leave a number (saved as a qualified lead). */
function RecNext({ rec, page, leadSaved, savedName, onSaved }: { rec: Recommendation; page: string; leadSaved: boolean; savedName: string; onSaved: (name: string) => void }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const isEmail = contact.includes("@");
  const ok = name.trim() && (isEmail ? /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.trim()) : contact.replace(/\D/g, "").length >= 7) && consent;
  const wa = buildWa(`Hi Emmanuel, Emma (your website assistant) suggested I talk to you.\n${rec.summary.split("\n").filter((l) => !l.startsWith("Lead:")).join("\n")}`);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!ok || state === "saving") return;
    setState("saving");
    const { error } = await leadsDb.from("tool_requests").insert({
      tool: "Ask Emma (qualified)", name: name.trim().slice(0, 120),
      whatsapp: isEmail ? null : contact.trim().slice(0, 40), email: isEmail ? contact.trim().slice(0, 200) : null,
      summary: `${rec.summary}\nPage: ${page}`.slice(0, 3000),
    });
    if (error) { setState("error"); return; }
    setState("done"); onSaved(name.trim().split(" ")[0]);
    track("lead_submitted", { source: "Ask Emma (qualified)", temperature: rec.temperature });
  }
  return (
    <div className="mt-2 space-y-2 rounded-2xl border border-border bg-card p-3" data-rec={rec.temperature}>
      <NextCallTimes source="ask-emma" compact title="Pick a free call time" />
      <a href={wa} target="_blank" rel="noopener noreferrer" onClick={() => track("whatsapp_click", { from: "ask-emma-rec" })} className="flex items-center justify-center gap-2 rounded-full bg-[#25d366] px-4 py-2 text-xs font-semibold text-white">Send this to Emmanuel on WhatsApp</a>
      {leadSaved || state === "done" ? (
        <p className="text-xs text-emerald-700 dark:text-emerald-400">{savedName ? `Thanks ${savedName}! Emmanuel has your answers and will get back to you.` : "Emmanuel already has your details."}</p>
      ) : (
        <form onSubmit={save} className="grid gap-2" aria-label="Leave your details">
          <p className="text-xs text-muted-foreground">Or leave your details and Emmanuel will message you:</p>
          <input aria-label="Your name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className="h-9 rounded-full border border-input bg-background px-3 text-xs" />
          <input aria-label="WhatsApp number or email" placeholder="WhatsApp number (with country code) or email" value={contact} onChange={(e) => setContact(e.target.value)} maxLength={200} className="h-9 rounded-full border border-input bg-background px-3 text-xs" />
          <label className="flex items-start gap-2 text-[11px] text-muted-foreground"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" /> EmmaForYou may contact me about this.</label>
          <button type="submit" disabled={!ok || state === "saving"} className="rounded-full bg-[var(--emma-violet)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">{state === "saving" ? "Sending…" : "Send my details"}</button>
          {state === "error" && <p role="alert" className="text-[11px] text-red-600">That didn't send. Please try WhatsApp instead.</p>}
        </form>
      )}
    </div>
  );
}
