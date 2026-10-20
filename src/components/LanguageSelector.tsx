import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useI18n, LANGUAGES, type Lang } from "@/lib/i18n";
import { AI_LANGUAGES } from "@/lib/translate";
import { requestTranslation } from "./tools/PageTranslator";

export default function LanguageSelector() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    // The homepage tools hub can open this menu (only the visible copy reacts).
    const onOpen = () => { if (ref.current && ref.current.offsetParent !== null) { window.scrollTo({ top: 0, behavior: "smooth" }); window.setTimeout(() => setOpen(true), 350); } };
    window.addEventListener("efy-open-lang", onOpen);
    return () => { document.removeEventListener("click", onClick); window.removeEventListener("efy-open-lang", onOpen); };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        className="nav-chip inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold tracking-wide text-foreground"
        aria-label={`Language: ${LANGUAGES[lang].label}. Change language`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <svg className="h-[15px] w-[15px] opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" /></svg>
        <span>{LANGUAGES[lang].label}</span>
        <svg className={`h-3 w-3 opacity-60 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 min-w-[200px] rounded-xl border border-border bg-background p-1 shadow-lg">
          {(Object.keys(LANGUAGES) as Lang[]).map(code => (
            <button
              key={code}
              onClick={() => { setLang(code); setOpen(false); }}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                lang === code ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <span>{LANGUAGES[code].flag}</span>
              <span>{LANGUAGES[code].name}</span>
            </button>
          ))}
          <div className="my-1 border-t border-border" />
          <Link to="/fr" hrefLang="fr" onClick={() => setOpen(false)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted"><span>🇫🇷</span><span>EmmaForYou en français</span></Link>
          <Link to="/de" hrefLang="de" onClick={() => setOpen(false)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted"><span>🇩🇪</span><span>EmmaForYou auf Deutsch</span></Link>
          <div className="my-1 border-t border-border" />
          <p className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Translate whole page with AI</p>
          <div className="max-h-56 overflow-y-auto">
            {AI_LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => { requestTranslation(l.code); setOpen(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted"
              >
                <span>{l.flag}</span>
                <span>{l.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
