import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, CornerDownLeft, Search, X } from "lucide-react";
import { searchPages, type PageEntry } from "@/lib/page-index";
import { track } from "@/lib/analytics";

const KIND_TONE: Record<PageEntry["kind"], string> = {
  Page: "cp-k-page", Service: "cp-k-service", Expertise: "cp-k-service", Solution: "cp-k-solution", Tool: "cp-k-tool",
  Industry: "cp-k-industry", Work: "cp-k-work", Guide: "cp-k-guide", Account: "cp-k-account",
};

/**
 * Site-wide jump-to search (⌘K / Ctrl K, "/" or the search button in the header). Searches every
 * service, solution, tool, guide, industry and client project by title. Keyboard: ↑ ↓ to move,
 * Enter to open, Esc to close. Focus is trapped inside and returned to where it came from.
 */
export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const hits = useMemo(() => searchPages(q, 12), [q]);

  useEffect(() => { setI(0); }, [q]);
  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    input.current?.focus();
    return () => { document.body.style.overflow = original; back?.focus?.(); };
  }, []);
  useEffect(() => { list.current?.querySelector<HTMLElement>(`[data-i="${i}"]`)?.scrollIntoView({ block: "nearest" }); }, [i]);

  const go = (e: PageEntry | undefined) => {
    if (!e) return;
    track("cta_click", { cta: "site_search", href: e.href });
    onClose();
    if (/^https?:/.test(e.href)) window.open(e.href, "_blank", "noopener,noreferrer");
    else void navigate({ to: e.href });
  };

  const onKey = (ev: React.KeyboardEvent) => {
    if (ev.key === "Escape") { ev.preventDefault(); onClose(); }
    else if (ev.key === "ArrowDown") { ev.preventDefault(); setI((x) => Math.min(hits.length - 1, x + 1)); }
    else if (ev.key === "ArrowUp") { ev.preventDefault(); setI((x) => Math.max(0, x - 1)); }
    else if (ev.key === "Enter") { ev.preventDefault(); go(hits[i]); }
    else if (ev.key === "Tab") {
      const f = Array.from(box.current?.querySelectorAll<HTMLElement>("input, button") ?? []);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    }
  };

  return (
    <div className="cp-root" onKeyDown={onKey}>
      <div className="cp-scrim" onClick={onClose} aria-hidden="true" />
      <div ref={box} role="dialog" aria-modal="true" aria-label="Search the site" className="cp-box lg-dialog">
        <div className="cp-field">
          <Search className="h-5 w-5 shrink-0 text-[var(--emma-violet)]" aria-hidden="true" />
          <input
            ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search services, solutions, tools, guides…"
            role="combobox" aria-expanded="true" aria-controls={`${uid}-list`} aria-autocomplete="list"
            aria-activedescendant={hits[i] ? `${uid}-o-${i}` : undefined} className="cp-input" maxLength={80} autoComplete="off" spellCheck={false}
          />
          <button type="button" onClick={onClose} className="cp-close" aria-label="Close search"><X className="h-4 w-4" aria-hidden="true" /></button>
        </div>
        <ul ref={list} id={`${uid}-list`} role="listbox" aria-label="Results" className="cp-list">
          {hits.map((h, n) => (
            <li key={h.href} id={`${uid}-o-${n}`} role="option" aria-selected={n === i} data-i={n}
              onPointerMove={() => setI(n)} onClick={() => go(h)} className="cp-item">
              <span className={`cp-kind ${KIND_TONE[h.kind]}`}>{h.kind}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.92rem] font-medium text-foreground">{h.title}</span>
                {h.hint && <span className="block truncate text-xs text-muted-foreground">{h.hint}</span>}
              </span>
              {n === i ? <CornerDownLeft className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" /> : <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden="true" />}
            </li>
          ))}
          {!hits.length && (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground" role="presentation">
              Nothing matches “{q}”. Try a service (“website”, “AI”), a tool (“audit”) or an industry (“clinic”).
            </li>
          )}
        </ul>
        <div className="cp-foot" aria-hidden="true">
          <span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
