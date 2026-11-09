import { speechLang } from "./visitor-language";
import { useCallback, useEffect, useRef, useState } from "react";

/* Browser speech APIs (Chrome, Edge, Safari). Nothing is recorded or stored by us: the browser
   turns speech into text and the text is used exactly like typed input. */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecognition = any;

function getRecognitionCtor(): AnyRecognition | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function useSpeechInput(opts: { lang?: string; onFinal: (text: string) => void }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const recRef = useRef<AnyRecognition>(null);
  const onFinalRef = useRef(opts.onFinal);
  onFinalRef.current = opts.onFinal;

  useEffect(() => { setSupported(Boolean(getRecognitionCtor())); }, []);

  const stop = useCallback(() => { try { recRef.current?.stop(); } catch { /* already stopped */ } }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) { setError("Voice input isn't supported in this browser. Try Chrome, Edge or Safari."); return; }
    setError("");
    const rec = new Ctor();
    rec.lang = opts.lang || speechLang();
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let finalText = "";
      let partial = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript; else partial += r[0].transcript;
      }
      setInterim(partial);
      if (finalText.trim()) { setInterim(""); onFinalRef.current(finalText.trim()); }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") setError("Microphone access was blocked. Allow it in your browser to talk.");
      else if (e.error === "no-speech") setError("Didn't catch that. Tap the mic and try again.");
      else if (e.error !== "aborted") setError("Voice input stopped. Try again or type instead.");
    };
    rec.onend = () => { setListening(false); setInterim(""); };
    recRef.current = rec;
    try { rec.start(); setListening(true); } catch { setListening(false); }
  }, [opts.lang]);

  useEffect(() => () => stop(), [stop]);
  return { supported, listening, interim, error, start, stop };
}

/** Read text aloud with the browser's built-in voice. */
export function speak(text: string, lang?: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const clean = text.replace(/[*_#`>]/g, "").replace(/\p{Extended_Pictographic}/gu, "").trim();
  if (!clean) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = lang || speechLang();
  // Prefer an installed voice for that language (browsers otherwise read foreign text with an English voice).
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith(u.lang.toLowerCase().split("-")[0]));
  if (voice) u.voice = voice;
  u.rate = 1.03;
  window.speechSynthesis.speak(u);
}

/** Read a long text aloud (articles): queued sentence chunks, since browsers cut off very long utterances. */
export function speakLong(text: string, onEnd?: () => void): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const clean = text.replace(/```[\s\S]*?```/g, " ").replace(/[*_#`>|]/g, "").replace(/\p{Extended_Pictographic}/gu, "").replace(/\s+/g, " ").trim();
  const parts = clean.match(/[^.!?]+[.!?]*\s*/g)?.reduce<string[]>((acc, s) => { const last = acc[acc.length - 1]; if (last && last.length + s.length < 220) acc[acc.length - 1] = last + s; else acc.push(s); return acc; }, []) ?? [];
  if (!parts.length) return false;
  window.speechSynthesis.cancel();
  const lang = speechLang();
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase().split("-")[0]));
  parts.forEach((p, i) => {
    const u = new SpeechSynthesisUtterance(p.trim());
    u.lang = lang; if (voice) u.voice = voice; u.rate = 1.02;
    if (i === parts.length - 1 && onEnd) u.onend = onEnd;
    window.speechSynthesis.speak(u);
  });
  return true;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

export function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}
