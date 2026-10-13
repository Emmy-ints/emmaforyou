import { useCallback, useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Globe, Loader2, X } from "lucide-react";
import { AI_LANGUAGES, type AiLang } from "@/lib/translate";
import { track } from "@/lib/analytics";

const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "CODE", "PRE", "SVG", "IFRAME", "OPTION", "KBD"]);
const KEY = "efy_ai_lang";
type Tracked = { orig: string; translated: string };

/** Event other components dispatch to start (lang) or stop (null) AI translation of the page. */
export function requestTranslation(lang: AiLang | null) {
  window.dispatchEvent(new CustomEvent("efy-translate", { detail: lang }));
}

function collect(root: HTMLElement, tracked: WeakMap<Text, Tracked>): Text[] {
  const out: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = node.parentElement;
      if (!p || SKIP.has(p.tagName) || p.closest("[data-no-translate],[contenteditable='true'],svg")) return NodeFilter.FILTER_REJECT;
      const v = node.nodeValue || "";
      if (v.trim().length < 2 || !/\p{L}/u.test(v)) return NodeFilter.FILTER_REJECT;
      const t = tracked.get(node as Text);
      if (t && t.translated === v) return NodeFilter.FILTER_REJECT; // already translated
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  while (walker.nextNode()) out.push(walker.currentNode as Text);
  return out;
}

export default function PageTranslator() {
  const [lang, setLang] = useState<AiLang | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const tracked = useRef(new WeakMap<Text, Tracked>());
  const nodes = useRef<Text[]>([]);
  const runId = useRef(0);
  const failed = useRef(false); // stop automatic retries after an error (e.g. limit reached)
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const restore = useCallback(() => {
    runId.current++;
    for (const n of nodes.current) {
      const t = tracked.current.get(n);
      if (t && n.nodeValue === t.translated) n.nodeValue = t.orig;
    }
    nodes.current = [];
    tracked.current = new WeakMap();
    document.documentElement.lang = "en";
    setProgress(null);
  }, []);

  const translate = useCallback(async (code: AiLang) => {
    const id = ++runId.current;
    setError("");
    const found = collect(document.body, tracked.current);
    if (!found.length) return;
    const unique = Array.from(new Set(found.map((n) => (n.nodeValue || "").trim())));
    const batches: string[][] = [];
    let cur: string[] = [];
    let size = 0;
    for (const s of unique) {
      const text = s.slice(0, 1500);
      if (cur.length >= 60 || size + text.length > 5000) { batches.push(cur); cur = []; size = 0; }
      cur.push(text);
      size += text.length;
    }
    if (cur.length) batches.push(cur);
    const result = new Map<string, string>();
    setProgress(0);
    for (let b = 0; b < batches.length; b++) {
      if (id !== runId.current) return;
      try {
        const res = await fetch("/api/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lang: code, texts: batches[b] }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Translation is unavailable right now.");
        batches[b].forEach((s, i) => result.set(s, data.translations[i]));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Translation stopped.");
        failed.current = true;
        break;
      }
      if (id !== runId.current) return;
      // Apply as each batch arrives so the page changes progressively.
      for (const n of found) {
        const v = n.nodeValue || "";
        const core = v.trim().slice(0, 1500);
        const tr = result.get(core);
        if (!tr || tracked.current.get(n)?.translated === v) continue;
        const lead = v.match(/^\s*/)?.[0] || "";
        const trail = v.match(/\s*$/)?.[0] || "";
        const translated = `${lead}${tr}${trail}`;
        tracked.current.set(n, { orig: v, translated });
        n.nodeValue = translated;
        nodes.current.push(n);
      }
      setProgress(Math.round(((b + 1) / batches.length) * 100));
    }
    document.documentElement.lang = code;
    if (id === runId.current) setProgress(null);
  }, []);

  // Start/stop requests from the language menu.
  useEffect(() => {
    const on = (e: Event) => {
      const code = (e as CustomEvent<AiLang | null>).detail;
      restore();
      failed.current = false;
      setLang(code);
      try { code ? sessionStorage.setItem(KEY, code) : sessionStorage.removeItem(KEY); } catch { /* storage blocked */ }
      if (code) { track("page_translated", { lang: code }); window.setTimeout(() => translate(code), 30); }
    };
    window.addEventListener("efy-translate", on);
    try {
      const saved = sessionStorage.getItem(KEY) as AiLang | null;
      if (saved && AI_LANGUAGES.some((l) => l.code === saved)) { setLang(saved); window.setTimeout(() => translate(saved), 800); }
    } catch { /* storage blocked */ }
    return () => window.removeEventListener("efy-translate", on);
  }, [restore, translate]);

  // New page or new content (chat replies, results): translate what's new.
  useEffect(() => {
    if (!lang) return;
    const t = window.setTimeout(() => { if (!failed.current) translate(lang); }, 700);
    return () => window.clearTimeout(t);
  }, [pathname, lang, translate]);
  useEffect(() => {
    if (!lang) return;
    let timer = 0;
    const obs = new MutationObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { if (progress === null && !failed.current) translate(lang); }, 1500);
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => { obs.disconnect(); window.clearTimeout(timer); };
  }, [lang, translate, progress]);

  if (!lang) return null;
  const name = AI_LANGUAGES.find((l) => l.code === lang)?.name;
  return (
    <div data-no-translate className="fixed bottom-24 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-card/95 px-4 py-2 text-xs text-foreground shadow-[var(--shadow-card-hover)] backdrop-blur" role="status">
      {progress !== null ? <Loader2 className="h-4 w-4 animate-spin text-[var(--emma-violet)]" /> : <Globe className="h-4 w-4 text-[var(--emma-violet)]" />}
      <span>{error ? error : progress !== null ? `Translating to ${name}… ${progress}%` : `Translated to ${name} by AI`}</span>
      <button onClick={() => requestTranslation(null)} className="font-semibold text-[var(--emma-violet)]">Show original</button>
      <button onClick={() => requestTranslation(null)} aria-label="Close translation" className="text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
    </div>
  );
}
