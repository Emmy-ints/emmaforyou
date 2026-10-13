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
    rec.lang = opts.lang || (typeof navigator !== "undefined" ? navigator.language : "en-US");
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
  if (lang) u.lang = lang;
  u.rate = 1.03;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

export function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}
