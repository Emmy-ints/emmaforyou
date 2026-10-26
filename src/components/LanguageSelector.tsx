import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useI18n, LANGUAGES, type Lang } from "@/lib/i18n";
import { AI_LANGUAGES, type AiLang } from "@/lib/translate";
import { requestTranslation, savedPageLanguage } from "./tools/PageTranslator";

type Choice = "en" | AiLang;
const PRIMARY: Choice[] = ["en", "fr", "es", "de"];

/**
 * One language choice for the whole site. English is the default. Choosing another language
 * switches the hand-translated interface text (FR/ES/DE) and translates the rest of every page
 * with AI through the server (/api/translate, rate-limited; no keys in the browser). The choice is
 * saved in this browser, so it follows the visitor to every page, after reloads and in new tabs.
 */
export default function LanguageSelector() {
  const { setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Choice>("en");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setCurrent(savedPageLanguage() ?? "en"); }, []);
  useEffect(() => {
    const onTr = (e: Event) => setCurrent(((e as CustomEvent<AiLang | null>).detail ?? "en") as Choice);
    window.addEventListener("efy-translate", onTr);
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", onClick);
    // The homepage tools hub can open this menu (only the visible copy reacts).
    const onOpen = () => { if (ref.current && ref.current.offsetParent !== null) { window.scrollTo({ top: 0, behavior: "smooth" }); window.setTimeout(() => setOpen(true), 350); } };
    window.addEventListener("efy-open-lang", onOpen);
    return () => { window.removeEventListener("efy-translate", onTr); document.removeEventListener("click", onClick); window.removeEventListener("efy-open-lang", onOpen); };
  }, []);

  const choose = (code: Choice) => {
    setLang((code in LANGUAGES ? code : "en") as Lang);
    requestTranslation(code === "en" ? null : code);
    setCurrent(code);
    setOpen(false);
  };
  const label = current === "en" ? "EN" : current.toUpperCase().slice(0, 3);
  const nameOf = (c: Choice) => (c === "en" ? "English" : AI_LANGUAGES.find((l) => l.code === c)?.name ?? c);
  const flagOf = (c: Choice) => (c === "en" ? LANGUAGES.en.flag : AI_LANGUAGES.find((l) => l.code === c)?.flag ?? "🌐");
  const others = AI_LANGUAGES.map((l) => l.code).filter((c) => !PRIMARY.includes(c)) as Choice[];

  const Item = ({ code }: { code: Choice }) => (
    <button type="button" role="menuitemradio" aria-checked={current === code} onClick={() => choose(code)}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${current === code ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:bg-muted"}`}>
      <span aria-hidden="true">{flagOf(code)}</span><span className="flex-1">{nameOf(code)}</span>{current === code && <Check className="h-3.5 w-3.5 text-[var(--emma-violet)]" aria-hidden="true" />}
    </button>
  );

  return (
    <div ref={ref} className="relative" data-no-translate>
      <button type="button" onClick={() => setOpen((o) => !o)} onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        className="nav-chip inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold tracking-wide text-foreground"
        aria-label={`Language: ${nameOf(current)}. Change language`} aria-expanded={open} aria-haspopup="menu" data-lang-trigger>
        <svg className="h-[15px] w-[15px] opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" /></svg>
        <span>{label}</span>
        <svg className={`h-3 w-3 opacity-60 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
      </button>
      {open && (
        <div role="menu" className="lg-dialog absolute right-0 top-full z-[130] mt-2 w-[240px] rounded-xl p-1">
          <p className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Site language</p>
          {PRIMARY.map((c) => <Item key={c} code={c} />)}
          <div className="my-1 border-t border-border" />
          <p className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">More languages (AI translation)</p>
          <div className="max-h-48 overflow-y-auto">{others.map((c) => <Item key={c} code={c} />)}</div>
          <p className="px-3 pb-2 pt-1 text-[11px] leading-snug text-muted-foreground">Menus and key text are hand-translated in French, Spanish and German; the rest of each page is translated by AI. Your choice is remembered on every page.</p>
          <div className="my-1 border-t border-border" />
          <Link to="/fr" hrefLang="fr" onClick={() => setOpen(false)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted"><span>🇫🇷</span><span>EmmaForYou en français</span></Link>
          <Link to="/de" hrefLang="de" onClick={() => setOpen(false)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted"><span>🇩🇪</span><span>EmmaForYou auf Deutsch</span></Link>
        </div>
      )}
    </div>
  );
}
