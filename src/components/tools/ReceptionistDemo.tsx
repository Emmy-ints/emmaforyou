import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, Loader2, Mic, MicOff, Pencil, RotateCcw, Send, Sparkles, Volume2, VolumeX } from "lucide-react";
import { DEMO_BUSINESSES, customToBusiness, parseLines, parseServices, type CustomBusiness, type DemoBooking, type DemoBusiness } from "@/lib/receptionist-data";
import { LeadCapture } from "./LeadCapture";
import { canSpeak, speak, stopSpeaking, useSpeechInput } from "@/lib/use-voice";
import { track } from "@/lib/analytics";

type Msg = { role: "user" | "assistant"; content: string; booking?: DemoBooking | null; offline?: boolean };

function todayLabel() {
  const d = new Date();
  return `${d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

const MINE_KEY = "efy_rx_mine";
interface MineForm { name: string; kind: string; city: string; hours: string; services: string; faqs: string }
const EMPTY: MineForm = { name: "", kind: "", city: "", hours: "", services: "", faqs: "" };
const toCustom = (f: MineForm): CustomBusiness => ({ name: f.name.trim(), kind: f.kind.trim(), city: f.city.trim(), hours: f.hours.trim(), services: parseServices(f.services), policies: parseLines(f.faqs) });

/** "Try it with my business": the visitor types their own details and chats with their own receptionist. */
function MineEditor({ form, onChange, onStart }: { form: MineForm; onChange: (f: MineForm) => void; onStart: () => void }) {
  const set = (k: keyof MineForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...form, [k]: e.target.value });
  const services = parseServices(form.services);
  return (
    <form className="grid gap-3 p-4 text-sm" data-rx-mine onSubmit={(e) => { e.preventDefault(); if (form.name.trim().length >= 2) onStart(); }}>
      <p className="text-muted-foreground">Type in your own details and chat with <strong className="text-foreground">your</strong> AI receptionist. They stay in this browser and are only used for this demo.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 font-medium">Business name<input required minLength={2} maxLength={60} value={form.name} onChange={set("name")} className="input font-normal" placeholder="e.g. Ada's Kitchen" /></label>
        <label className="grid gap-1 font-medium">What you do<input maxLength={60} value={form.kind} onChange={set("kind")} className="input font-normal" placeholder="e.g. Restaurant and catering" /></label>
        <label className="grid gap-1 font-medium">City<input maxLength={60} value={form.city} onChange={set("city")} className="input font-normal" placeholder="e.g. Ikeja, Lagos" /></label>
        <label className="grid gap-1 font-medium">Opening hours<input maxLength={200} value={form.hours} onChange={set("hours")} className="input font-normal" placeholder="e.g. Mon–Sat 9am–8pm, closed Sunday" /></label>
      </div>
      <label className="grid gap-1 font-medium">Services and prices <span className="font-normal text-muted-foreground">One per line, like "Party jollof tray - ₦45,000"</span>
        <textarea rows={4} maxLength={1500} value={form.services} onChange={set("services")} className="input font-normal" placeholder={"Wash & style - ₦8,000\nSilk press - ₦18,000"} />
      </label>
      {services.length > 0 && <p className="-mt-1 text-xs text-muted-foreground" data-rx-parsed>{services.length} service{services.length === 1 ? "" : "s"} understood{services.some((x) => x.price) ? `, e.g. ${services.find((x) => x.price)!.name}: ${services.find((x) => x.price)!.price}` : ""}</p>}
      <label className="grid gap-1 font-medium">Rules and common questions <span className="font-normal text-muted-foreground">Optional, one per line</span>
        <textarea rows={3} maxLength={2000} value={form.faqs} onChange={set("faqs")} className="input font-normal" placeholder={"Deposit of ₦5,000 to book\nWe deliver within Lagos for ₦2,500"} />
      </label>
      <button disabled={form.name.trim().length < 2} className="btn-primary-gradient inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-semibold text-white disabled:opacity-50"><Sparkles className="h-4 w-4" aria-hidden="true" /> Chat with my receptionist</button>
    </form>
  );
}

export default function ReceptionistDemo({ compact = false }: { compact?: boolean }) {
  const [bizId, setBizId] = useState<DemoBusiness["id"]>("salon");
  const [mine, setMine] = useState<MineForm>(EMPTY);
  const [editing, setEditing] = useState(false);
  useEffect(() => { try { const v = JSON.parse(localStorage.getItem(MINE_KEY) || "null"); if (v && typeof v.name === "string") setMine({ ...EMPTY, ...v }); } catch { /* ignore */ } }, []);
  const mineReady = mine.name.trim().length >= 2;
  const biz = bizId === "custom" ? customToBusiness(toCustom(mineReady ? mine : { ...mine, name: "Your business" })) : DEMO_BUSINESSES.find((b) => b.id === bizId)!;
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: biz.greeting }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [voiceOn, setVoiceOn] = useState(false);
  const [speakable, setSpeakable] = useState(false);
  const [lastReplyMs, setLastReplyMs] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setSpeakable(canSpeak()); }, []);
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [messages, busy]);

  const voice = useSpeechInput({ onFinal: (text) => { track("voice_used", { tool: "receptionist" }); send(text, true); } });

  function switchBusiness(id: DemoBusiness["id"], form: MineForm = mine) {
    if (busy) return;
    const next = id === "custom" ? customToBusiness(toCustom(form.name.trim().length >= 2 ? form : { ...form, name: "Your business" })) : DEMO_BUSINESSES.find((b) => b.id === id)!;
    setBizId(id);
    setEditing(id === "custom" && form.name.trim().length < 2);
    setMessages([{ role: "assistant", content: next.greeting }]);
    setError("");
    setLastReplyMs(null);
    stopSpeaking();
  }

  async function send(text: string, fromVoice = false) {
    const content = text.trim();
    if (!content || busy) return;
    setInput("");
    setError("");
    const history = [...messages, { role: "user" as const, content }];
    setMessages(history);
    setBusy(true);
    const started = performance.now();
    try {
      const res = await fetch("/api/receptionist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business: bizId,
          ...(bizId === "custom" ? { custom: toCustom(mine) } : {}),
          today: todayLabel(),
          // The greeting is local; send the real conversation (last 18 turns).
          messages: history.slice(1).slice(-18).map(({ role, content }) => ({ role, content: content.slice(0, 600) })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "The receptionist is unavailable right now.");
      setLastReplyMs(Math.round(performance.now() - started));
      setMessages((m) => [...m, { role: "assistant", content: data.reply, booking: data.booking, offline: !!data.offline }]);
      track("receptionist_message", { business: bizId, voice: fromVoice });
      if (data.booking) track("receptionist_booking", { business: bizId });
      if (voiceOn || fromVoice) speak(data.reply);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setMessages((m) => m.slice(0, -1));
      setInput(content);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`grid gap-6 ${compact ? "" : "lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]"} lg:items-start`}>
      <div className="overflow-hidden rounded-[24px] border border-border bg-card shadow-[var(--shadow-card-hover)]">
        {/* Business switcher */}
        <div className="flex gap-1.5 overflow-x-auto border-b border-border bg-muted/40 p-2" role="tablist" aria-label="Choose a sample business">
          {DEMO_BUSINESSES.map((b) => (
            <button key={b.id} role="tab" aria-selected={b.id === bizId} onClick={() => switchBusiness(b.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${b.id === bizId ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              <span aria-hidden="true">{b.emoji}</span>{b.name}
            </button>
          ))}
          <button role="tab" aria-selected={bizId === "custom"} onClick={() => switchBusiness("custom")} data-rx-tab="custom"
            className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${bizId === "custom" ? "bg-card text-foreground shadow-sm" : "text-[var(--emma-violet)] hover:text-foreground"}`}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />{mineReady ? mine.name.slice(0, 24) : "Try my business"}
          </button>
        </div>
        {bizId === "custom" && editing ? (
          <MineEditor form={mine} onChange={setMine} onStart={() => {
            try { localStorage.setItem(MINE_KEY, JSON.stringify(mine)); } catch { /* ignore */ }
            track("receptionist_mine", { services: parseServices(mine.services).length });
            switchBusiness("custom", mine);
            setEditing(false);
          }} />
        ) : (<>

        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ background: `linear-gradient(90deg, ${biz.accent}22, transparent)` }}>
          <div className="grid h-10 w-10 place-items-center rounded-full text-lg" style={{ background: `${biz.accent}33` }} aria-hidden="true">{biz.emoji}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{biz.name}</p>
            <p className="truncate text-xs text-muted-foreground">AI receptionist · {biz.kind}, {biz.city}</p>
          </div>
          {speakable && (
            <button onClick={() => { setVoiceOn((v) => !v); stopSpeaking(); }} aria-pressed={voiceOn}
              aria-label={voiceOn ? "Turn spoken replies off" : "Read replies aloud"}
              className={`grid h-9 w-9 place-items-center rounded-full border border-border transition ${voiceOn ? "bg-[var(--emma-violet)] text-white" : "bg-card text-muted-foreground hover:text-foreground"}`}>
              {voiceOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          )}
          {bizId === "custom" && (
            <button onClick={() => setEditing(true)} aria-label="Edit my business details" className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground">
              <Pencil className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => switchBusiness(bizId)} aria-label="Restart conversation" className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div ref={listRef} className={`space-y-3 overflow-y-auto bg-background/60 px-4 py-4 ${compact ? "h-[340px]" : "h-[420px]"}`} aria-live="polite">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%] space-y-2">
                  <div className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "rounded-br-md bg-[var(--emma-violet)] text-white" : "rounded-bl-md border border-border bg-card text-foreground"}`}>
                    {m.content}
                  </div>
                  {m.booking && (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
                      <p className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300"><CalendarCheck className="h-4 w-4" /> Booking captured</p>
                      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-foreground">
                        <dt className="text-muted-foreground">Service</dt><dd>{m.booking.service}</dd>
                        <dt className="text-muted-foreground">When</dt><dd>{m.booking.date}, {m.booking.time}</dd>
                        <dt className="text-muted-foreground">Name</dt><dd>{m.booking.name}{m.booking.guests ? ` · ${m.booking.guests} guests` : ""}</dd>
                      </dl>
                      <p className="mt-2 text-xs text-muted-foreground">Demo only. In a real setup this lands in your calendar and the customer gets a reminder.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {busy && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-border bg-card px-3.5 py-3" aria-label="Typing">
                {[0, 1, 2].map((d) => <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${d * 0.15}s` }} />)}
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {messages.length < 3 && !busy && (
          <div className="flex flex-wrap gap-2 border-t border-border px-4 pt-3">
            {biz.suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:border-[var(--emma-violet)]">{s}</button>
            ))}
          </div>
        )}

        {/* Composer */}
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2 p-3">
          {voice.supported && (
            <button type="button" onClick={() => (voice.listening ? voice.stop() : voice.start())} disabled={busy}
              aria-label={voice.listening ? "Stop listening" : "Speak your message"} aria-pressed={voice.listening}
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border transition ${voice.listening ? "animate-pulse border-red-500 bg-red-500 text-white" : "border-border bg-card text-foreground hover:border-[var(--emma-violet)]"}`}>
              {voice.listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          )}
          <label className="sr-only" htmlFor={`rx-input-${compact ? "c" : "f"}`}>Message {biz.name}</label>
          <input id={`rx-input-${compact ? "c" : "f"}`} value={voice.listening ? voice.interim || "Listening…" : input} onChange={(e) => setInput(e.target.value)}
            readOnly={voice.listening} maxLength={600} placeholder={`Message ${biz.name}…`}
            className="h-11 min-w-0 flex-1 rounded-full border border-input bg-background px-4 text-sm text-foreground outline-none focus:border-[var(--emma-violet)]" />
          <button type="submit" disabled={busy || !input.trim()} aria-label="Send"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--emma-violet)] text-white disabled:opacity-40">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </form>
        {(error || voice.error) && <p role="alert" className="px-4 pb-3 text-xs text-red-600 dark:text-red-400">{error || voice.error}</p>}
        </>)}
      </div>

      {!compact && (
        <aside className="space-y-4">
          <div className="rounded-[20px] border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--emma-violet)]">What you're testing</p>
            <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
              <li>Answers prices, hours and policies from the business's own information.</li>
              <li>Books appointments: it asks for whatever is missing and stays within opening hours.</li>
              <li>Speaks and listens: tap the mic and talk, or turn on spoken replies.</li>
              <li>Handles English, Pidgin, French, Spanish and German.</li>
            </ul>
            {lastReplyMs !== null && (
              <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-xs text-foreground">Last reply took <strong>{(lastReplyMs / 1000).toFixed(1)}s</strong>. A human typically takes minutes to hours.</p>
            )}
          </div>
          <div className="rounded-[20px] border border-border bg-card p-5 text-sm text-muted-foreground shadow-[var(--shadow-card)]">
            <p className="font-semibold text-foreground">For your business</p>
            <p className="mt-2">We train the same assistant on your services, prices and tone, and connect it to WhatsApp, Instagram, your website and your calendar.</p>
            <p className="mt-3 text-xs">These sample businesses and prices are made up for the demo.</p>
            {bizId !== "custom" && <button type="button" onClick={() => switchBusiness("custom")} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--emma-violet)]"><Sparkles className="h-4 w-4" aria-hidden="true" /> Try it with your own business</button>}
          </div>
          {bizId === "custom" && mineReady && messages.length >= 3 && (
            <LeadCapture compact tool="AI receptionist (own business)" title={`Want this for ${mine.name.trim().slice(0, 40)}?`} lead="Leave your WhatsApp and we'll set up this receptionist with your real details, on WhatsApp, Instagram and your website." button="Set it up for me" summary={`Business: ${mine.name.trim()} (${mine.kind.trim() || "type not given"}${mine.city.trim() ? `, ${mine.city.trim()}` : ""}). Services entered: ${parseServices(mine.services).length}. Hours: ${mine.hours.trim() || "not given"}.`} />
          )}
        </aside>
      )}
    </div>
  );
}
