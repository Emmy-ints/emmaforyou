import { useCallback, useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Globe, Loader2, X } from "lucide-react";
import { AI_LANGUAGES, type AiLang } from "@/lib/translate";
import { track } from "@/lib/analytics";

const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "CODE", "PRE", "SVG", "IFRAME", "OPTION", "KBD"]);
const KEY = "efy_ai_lang";
const CACHE_PREFIX = "efy_tr_cache_";
const CACHE_MAX = 2500;

/** Saved translations per language, so moving between pages and reloading reuse earlier results. */
function loadCache(code: string): Map<string, string> {
  try { const raw = localStorage.getItem(CACHE_PREFIX + code); if (raw) return new Map(JSON.parse(raw) as [string, string][]); } catch { /* storage blocked or corrupt */ }
  return new Map();
}
function saveCache(code: string, cache: Map<string, string>) {
  try {
    const entries = Array.from(cache.entries());
    localStorage.setItem(CACHE_PREFIX + code, JSON.stringify(entries.slice(Math.max(0, entries.length - CACHE_MAX))));
  } catch { /* quota exceeded: keep the in-memory cache only */ }
}
/** The visitor's chosen page language (persists across pages, reloads and new tabs). */
export function savedPageLanguage(): AiLang | null {
  try {
    const v = (localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY)) as AiLang | null;
    return v && AI_LANGUAGES.some((l) => l.code === v) ? v : null;
  } catch { return null; }
}
type Tracked = { orig: string; translated: string };

/** Event other components dispatch to start (lang) or stop (null) AI translation of the page. */
export function requestTranslation(lang: AiLang | null) {
  window.dispatchEvent(new CustomEvent("efy-translate", { detail: lang }));
}

/** Headings animated word by word are translated as one phrase, not word by word. */
const PHRASE = ".kt, .scrub";
function phrases(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(PHRASE)).filter((el) => !el.closest("[data-no-translate]") && !el.parentElement?.closest(PHRASE) && /\p{L}/u.test(el.textContent || ""));
}
/** Show a translated phrase without touching the React-owned word spans (they're hidden by CSS). */
function setPhrase(el: HTMLElement, text: string | null) {
  let tr = el.querySelector<HTMLElement>(":scope > .tr-phrase");
  if (text === null) { tr?.remove(); el.removeAttribute("data-tr"); return; }
  if (!tr) { tr = document.createElement("span"); tr.className = "tr-phrase"; el.appendChild(tr); }
  tr.textContent = text; el.setAttribute("data-tr", "");
}

function collect(root: HTMLElement, tracked: WeakMap<Text, Tracked>): Text[] {
  const out: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = node.parentElement;
      if (!p || SKIP.has(p.tagName) || p.closest("[data-no-translate],[contenteditable='true'],svg," + PHRASE)) return NodeFilter.FILTER_REJECT;
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
  const failed = useRef(false);
  const busy = useRef(false); // a run is in progress: don't start a second, overlapping one // stop automatic retries after an error (e.g. limit reached)
  const caches = useRef(new Map<string, Map<string, string>>());
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [hidden, setHidden] = useState(false);

  const restore = useCallback(() => {
    runId.current++;
    busy.current = false;
    for (const n of nodes.current) {
      const t = tracked.current.get(n);
      if (t && n.nodeValue === t.translated) n.nodeValue = t.orig;
    }
    nodes.current = [];
    tracked.current = new WeakMap();
    phrases(document.body).forEach((el) => setPhrase(el, null));
    document.documentElement.lang = "en";
    setProgress(null);
  }, []);

  const translate = useCallback(async (code: AiLang) => {
    const id = ++runId.current;
    busy.current = true;
    try { await run(code, id); } finally { if (id === runId.current) busy.current = false; }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (code: AiLang, id: number) => {
    setError("");
    const found = collect(document.body, tracked.current);
    const units = phrases(document.body).filter((el) => !el.hasAttribute("data-tr"));
    const phraseText = (el: HTMLElement) => Array.from(el.childNodes).filter((c) => !(c instanceof HTMLElement && c.classList.contains("tr-phrase"))).map((c) => c.textContent).join("").replace(/\s+/g, " ").trim().slice(0, 1500);
    if (!found.length && !units.length) return;
    const cache = caches.current.get(code) ?? loadCache(code);
    caches.current.set(code, cache);
    const result = new Map<string, string>();
    // Translate in reading order (headings included where they appear), so the top of the page changes first.
    const ordered: { node: Node; text: string }[] = [...found.map((n) => ({ node: n as Node, text: (n.nodeValue || "").trim().slice(0, 1500) })), ...units.map((el) => ({ node: el as Node, text: phraseText(el) }))]
      .sort((a, b) => (a.node === b.node ? 0 : a.node.compareDocumentPosition(b.node) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    const unique = Array.from(new Set(ordered.map((x) => x.text))).filter((s) => {
      const hit = cache.get(s); if (hit) { result.set(s, hit); return false; } return true;
    });
    const apply = () => {
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
      for (const el of units) { const tr = result.get(phraseText(el)); if (tr && el.isConnected) setPhrase(el, tr); }
      if (result.size) document.documentElement.lang = code;
    };
    if (result.size) apply();
    if (!unique.length) { document.documentElement.lang = code; return; }
    const batches: string[][] = [];
    let cur: string[] = [];
    let size = 0;
    for (const s of unique) {
      const text = s.slice(0, 1500);
      if (cur.length >= 25 || size + text.length > 2500) { batches.push(cur); cur = []; size = 0; }
      cur.push(text);
      size += text.length;
    }
    if (cur.length) batches.push(cur);
    setProgress(0);
    let missed = 0; let lastError = "";
    for (let b = 0; b < batches.length; b++) {
      if (id !== runId.current) return;
      try {
        const res = await fetch("/api/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lang: code, texts: batches[b] }) });
        const data = await res.json().catch(() => ({}));
        if (res.status === 429 || res.status === 503) { lastError = data.message || "Translation is paused right now."; missed += batches.slice(b).reduce((n, x) => n + x.length, 0); break; }
        if (!res.ok) throw new Error(data.message || "Translation is unavailable right now.");
        batches[b].forEach((s, i) => { const tr = data.translations?.[i]; if (typeof tr === "string" && tr.trim()) { result.set(s, tr); cache.set(s, tr); } else missed++; });
        saveCache(code, cache);
      } catch (e) {
        // One bad batch shouldn't leave the rest of the page in English: note it and carry on.
        lastError = e instanceof Error ? e.message : "Translation stopped.";
        missed += batches[b].length;
      }
      if (id !== runId.current) return;
      // Apply as each batch arrives so the page changes progressively.
      apply();
      setProgress(Math.round(((b + 1) / batches.length) * 100));
    }
    if (result.size) document.documentElement.lang = code;
    if (missed) { failed.current = true; setError(`${missed} phrase${missed === 1 ? "" : "s"} couldn't be translated and stay in English.${lastError ? ` (${lastError})` : ""}`); }
    if (id === runId.current) setProgress(null);
  };

  // Start/stop requests from the language menu.
  useEffect(() => {
    const on = (e: Event) => {
      const code = (e as CustomEvent<AiLang | null>).detail;
      restore();
      failed.current = false;
      setLang(code);
      try { sessionStorage.removeItem(KEY); code ? localStorage.setItem(KEY, code) : localStorage.removeItem(KEY); } catch { /* storage blocked */ }
      if (code) { track("page_translated", { lang: code }); window.setTimeout(() => translate(code), 30); }
    };
    window.addEventListener("efy-translate", on);
    try {
      const saved = savedPageLanguage();
      if (saved) { setLang(saved); window.setTimeout(() => translate(saved), 500); }
    } catch { /* storage blocked */ }
    return () => window.removeEventListener("efy-translate", on);
  }, [restore, translate]);

  // New page or new content (chat replies, results): translate what's new.
  useEffect(() => {
    if (!lang) return;
    const t = window.setTimeout(() => { if (!failed.current && !busy.current) translate(lang); }, 700);
    return () => window.clearTimeout(t);
  }, [pathname, lang, translate]);
  useEffect(() => {
    if (!lang) return;
    let timer = 0;
    const obs = new MutationObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { if (!busy.current && !failed.current) translate(lang); }, 1500);
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => { obs.disconnect(); window.clearTimeout(timer); };
  }, [lang, translate, progress]);

  if (!lang || (hidden && progress === null && !error)) return null;
  const name = AI_LANGUAGES.find((l) => l.code === lang)?.name;
  return (
    <div data-no-translate className="fixed bottom-24 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-card/95 px-4 py-2 text-xs text-foreground shadow-[var(--shadow-card-hover)] backdrop-blur" role="status">
      {progress !== null ? <Loader2 className="h-4 w-4 animate-spin text-[var(--emma-violet)]" /> : <Globe className="h-4 w-4 text-[var(--emma-violet)]" />}
      <span>{error ? error : progress !== null ? `Translating to ${name}… ${progress}%` : `Translated to ${name} by AI`}</span>
      <button onClick={() => { requestTranslation(null); window.dispatchEvent(new CustomEvent("efy-lang", { detail: "en" })); }} className="font-semibold text-[var(--emma-violet)]">Show English</button>
      <button onClick={() => setHidden(true)} aria-label="Hide this notice (the page stays translated)" className="text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
    </div>
  );
}
