import { useState, useRef, useEffect } from "react";
import { useI18n, LANGUAGES, type Lang } from "@/lib/i18n";

export default function LanguageSelector() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        aria-label="Select language"
      >
        <span>{LANGUAGES[lang].flag}</span>
        <span>{LANGUAGES[lang].label}</span>
        <svg className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 min-w-[140px] rounded-xl border border-border bg-background p-1 shadow-lg">
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
        </div>
      )}
    </div>
  );
}
