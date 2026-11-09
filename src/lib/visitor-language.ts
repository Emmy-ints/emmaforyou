import { AI_LANGUAGES, LANG_FULL, type AiLang } from "./translate";

/**
 * The visitor's language, worked out from their browser (English by default).
 * - Interface text (menus, buttons) switches automatically between en/fr/es/de.
 * - Other languages the AI can translate are offered as a one-tap full-page translation.
 * - AI tools receive the language in the `X-EFY-Lang` header and reply in it.
 * - Voice input and read-aloud use the same language.
 */

export type UiLang = "en" | "fr" | "es" | "de";
const UI: UiLang[] = ["en", "fr", "es", "de"];

const primary = (tag: string) => String(tag || "").trim().toLowerCase().split(/[-_]/)[0];

/** First of the browser's preferred languages that our interface has; English otherwise. */
export function detectUiLang(langs: readonly string[] | undefined | null): UiLang {
  for (const l of langs ?? []) {
    const p = primary(l);
    if ((UI as string[]).includes(p)) return p as UiLang;
  }
  return "en";
}

/**
 * A full-page AI translation to offer, from the visitor's FIRST browser language only (if it's English, offer nothing).
 * Nigerian English locales (en-NG) are English.
 */
export function suggestAiLang(langs: readonly string[] | undefined | null): AiLang | null {
  const first = primary(langs?.[0] ?? "");
  if (!first || first === "en") return null;
  return (AI_LANGUAGES.find((l) => l.code === first)?.code as AiLang | undefined) ?? null;
}

export const aiLanguageLabel = (code: string) => AI_LANGUAGES.find((l) => l.code === code)?.name ?? null;

/** English name of a language code for model instructions ("Portuguese"), or null for English/unknown. */
export function languageForAi(code: string | null | undefined): string | null {
  const c = primary(code ?? "");
  if (!c || c === "en") return null;
  return (LANG_FULL as Record<string, string>)[c] ?? null;
}

/** Instruction appended to visitor-facing AI calls. */
export function languageInstruction(code: string | null | undefined): string {
  const name = languageForAi(code);
  if (!name) return "";
  return `\n\nLANGUAGE: The visitor reads ${name}. Write every piece of visitor-facing text (replies, headings, labels, emails, plans, UI text inside generated pages) in ${name}. If the visitor's own message is clearly written in a different language, use that language instead. Keep JSON keys, code, HTML tags and attributes, URLs, prices, numbers and brand or business names unchanged.`;
}

// Owner/admin tools write site content in English (or their own target language), and a makeover keeps the
// language of the visitor's own site; never switch them.
const KEEP_LANGUAGE = /^\/api\/(translate|site-repair|status|ai-status|intern|indexnow|http-check|makeover)/;

/** Server: add the language instruction to a visitor-facing AI call (header set by installLanguageHeader). */
export function withVisitorLanguage(request: Request, instructions?: string): string | undefined {
  let path = "";
  try { path = new URL(request.url).pathname; } catch { /* no url */ }
  if (KEEP_LANGUAGE.test(path)) return instructions;
  const extra = languageInstruction(request.headers.get("x-efy-lang")?.slice(0, 12));
  return extra ? `${instructions ?? ""}${extra}` : instructions;
}

/** The language currently in effect in this browser: chosen AI page language, then interface language, then browser. */
export function currentVisitorLang(): string {
  if (typeof window === "undefined") return "en";
  try {
    const ai = localStorage.getItem("efy_ai_lang") ?? sessionStorage.getItem("efy_ai_lang");
    if (ai && AI_LANGUAGES.some((l) => l.code === ai)) return ai;
    const ui = localStorage.getItem("emma_lang");
    if (ui && (UI as string[]).includes(ui)) return ui;
  } catch { /* storage blocked */ }
  return detectUiLang(navigator.languages?.length ? navigator.languages : [navigator.language]);
}

/** BCP-47 tag for speech (prefers the browser's own regional variant, e.g. pt-BR). */
export function speechLang(): string {
  if (typeof navigator === "undefined") return "en-US";
  const code = currentVisitorLang();
  const regional = (navigator.languages ?? [navigator.language]).find((l) => primary(l) === code);
  if (regional) return regional;
  return ({ en: "en-US", fr: "fr-FR", es: "es-ES", de: "de-DE", pt: "pt-PT", ar: "ar-SA", sw: "sw-KE", zu: "zu-ZA", yo: "yo-NG", ha: "ha-NG", ig: "ig-NG", pcm: "en-NG" } as Record<string, string>)[code] ?? "en-US";
}

let installed = false;
/** Add X-EFY-Lang to this site's own /api/ calls so AI tools answer in the visitor's language. */
export function installLanguageHeader() {
  if (installed || typeof window === "undefined" || typeof window.fetch !== "function") return;
  installed = true;
  const orig = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const u = new URL(url, window.location.href);
      if (u.origin === window.location.origin && u.pathname.startsWith("/api/")) {
        const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
        if (!headers.has("X-EFY-Lang")) headers.set("X-EFY-Lang", currentVisitorLang());
        return orig(input, { ...init, headers });
      }
    } catch { /* fall through */ }
    return orig(input, init);
  };
}
