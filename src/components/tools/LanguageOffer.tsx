import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Globe, X } from "lucide-react";
import { requestTranslation, savedPageLanguage } from "./PageTranslator";
import { aiLanguageLabel, suggestAiLang } from "@/lib/visitor-language";
import type { AiLang } from "@/lib/translate";
import { track } from "@/lib/analytics";

const DISMISS = "efy_lang_offer_off";
// The offer is written in the visitor's own language where we have it (English otherwise).
const COPY: Partial<Record<AiLang, { q: string; yes: string; no: string }>> = {
  fr: { q: "Lire ce site en français ?", yes: "Traduire", no: "Non merci" },
  es: { q: "¿Leer este sitio en español?", yes: "Traducir", no: "No, gracias" },
  de: { q: "Diese Website auf Deutsch lesen?", yes: "Übersetzen", no: "Nein danke" },
  pt: { q: "Ler este site em português?", yes: "Traduzir", no: "Não, obrigado" },
  ar: { q: "هل تريد قراءة هذا الموقع بالعربية؟", yes: "ترجمة", no: "لا شكرًا" },
  sw: { q: "Soma tovuti hii kwa Kiswahili?", yes: "Tafsiri", no: "Hapana, asante" },
  yo: { q: "Ṣé ẹ fẹ́ ka ojú-òpó yìí ní Yorùbá?", yes: "Túmọ̀", no: "Rárá o" },
  ha: { q: "Karanta wannan shafin da Hausa?", yes: "Fassara", no: "A'a, na gode" },
  ig: { q: "Gụọ saịtị a n'Igbo?", yes: "Tụgharịa", no: "Mba, daalụ" },
  zu: { q: "Funda le sayithi ngesiZulu?", yes: "Humusha", no: "Cha, ngiyabonga" },
};

/**
 * One-time, one-tap offer to read the whole site in the visitor's browser language (AI translation).
 * Menus and buttons already switch automatically for EN/FR/ES/DE; this covers the page content and other languages.
 */
export default function LanguageOffer() {
  const [code, setCode] = useState<AiLang | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const quiet = /^\/(fr|de)(\/|$)/.test(pathname) || /^\/(dashboard|portal|login|account)/.test(pathname);
  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS) || savedPageLanguage()) return;
      const c = suggestAiLang(navigator.languages?.length ? navigator.languages : [navigator.language]);
      if (c) { const t = window.setTimeout(() => setCode(c), 2500); return () => window.clearTimeout(t); }
    } catch { /* storage blocked: don't nag */ }
  }, []);
  if (!code || quiet) return null;
  const c = COPY[code] ?? { q: `Read this site in ${aiLanguageLabel(code)}?`, yes: "Translate", no: "No thanks" };
  const close = (accepted: boolean) => {
    try { localStorage.setItem(DISMISS, "1"); } catch { /* ignore */ }
    track("language_offer", { lang: code, accepted });
    if (accepted) requestTranslation(code);
    setCode(null);
  };
  return (
    <div data-no-translate data-language-offer={code} dir={code === "ar" ? "rtl" : undefined} role="dialog" aria-label={c.q}
      className="fixed inset-x-3 bottom-24 z-[71] mx-auto flex max-w-md flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-border bg-card/95 px-4 py-3 text-sm text-foreground shadow-[var(--shadow-card-hover)] backdrop-blur sm:inset-x-auto sm:left-1/2 sm:w-max sm:-translate-x-1/2">
      <Globe className="h-4 w-4 shrink-0 text-[var(--emma-violet)]" aria-hidden="true" />
      <span className="min-w-0 flex-1 font-medium">{c.q}</span>
      <span className="flex items-center gap-2">
        <button type="button" onClick={() => close(true)} className="rounded-full bg-[var(--emma-violet)] px-4 py-1.5 text-xs font-semibold text-white">{c.yes}</button>
        <button type="button" onClick={() => close(false)} className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted">{c.no}</button>
        <button type="button" onClick={() => close(false)} aria-label="Close" className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-muted"><X className="h-3.5 w-3.5" /></button>
      </span>
    </div>
  );
}
