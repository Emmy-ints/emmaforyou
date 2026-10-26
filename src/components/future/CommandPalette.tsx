import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowRight, CornerDownLeft, Search, X } from "lucide-react";
import { searchPages, type PageEntry } from "@/lib/page-index";
import { track } from "@/lib/analytics";
import { motionPreference, setMotionPreference } from "@/lib/motion";
import { supabase } from "@/integrations/supabase/client";

type Entry = Omit<PageEntry, "kind"> & { kind: PageEntry["kind"] | "Action" | "Admin" | "Suggested"; run?: () => void };

/** Commands that act rather than navigate. Nothing privileged runs from here: staff entries only open the control room, which checks permissions in the database. */
function actions(): Entry[] {
  const dark = typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark";
  const reduced = motionPreference() === "reduced";
  return [
    { kind: "Action", title: "Ask Emma AI a question", href: "#ask", hint: "Opens the site assistant", keywords: "assistant chat help ai question", run: () => window.dispatchEvent(new CustomEvent("efy-open-ask", { detail: "" })) },
    { kind: "Action", title: "Find the right service for my business", href: "/#solution-finder", hint: "Solution finder: describe the problem, get a matched plan", keywords: "recommend match plan problem finder" },
    { kind: "Action", title: "Explore every service", href: "/#service-explorer", hint: "Interactive map of the full catalogue", keywords: "catalogue all services web3 ux design map" },
    { kind: "Action", title: "Enter the 3D service world", href: "/explore", hint: "Optional immersive map of every service area", keywords: "3d world immersive explore map" },
    { kind: "Action", title: "Book a free strategy call", href: "/book", hint: "Pick a time with Emmanuel", keywords: "consultation meeting calendly call" },
    { kind: "Action", title: dark ? "Switch to light mode" : "Switch to dark mode", href: "#theme", keywords: "theme dark light mode colour", run: () => { const next = dark ? "light" : "dark"; document.documentElement.setAttribute("data-theme", next); try { localStorage.setItem("efyTheme", next); } catch { /* storage blocked */ } } },
    { kind: "Action", title: reduced ? "Turn animations back on" : "Reduce motion", href: "#motion", hint: "Saved for your next visit", keywords: "animation motion accessibility calm still", run: () => setMotionPreference(reduced ? "full" : "reduced") },
    { kind: "Action", title: "Change language", href: "#lang", hint: "English, French, Spanish, German, Yoruba, Hausa, Igbo and more", keywords: "language translate french yoruba spanish german", run: () => Array.from(document.querySelectorAll<HTMLButtonElement>("[data-lang-trigger]")).find((b) => b.offsetParent !== null)?.click() },
  ];
}

const STAFF: Entry[] = [
  { kind: "Admin", title: "Control room: overview", href: "/dashboard/site", keywords: "admin control room staff" },
  { kind: "Admin", title: "Control room: run a site audit", href: "/dashboard/site?tab=audit", keywords: "admin audit broken links images seo" },
  { kind: "Admin", title: "Control room: design lab", href: "/dashboard/site?tab=design", keywords: "admin design theme preset tokens publish" },
  { kind: "Admin", title: "Control room: activity log", href: "/dashboard/site?tab=log", keywords: "admin log history audit trail" },
  { kind: "Admin", title: "Control room: content & SEO", href: "/dashboard/site?tab=content", keywords: "admin content seo services portfolio media claims" },
  { kind: "Admin", title: "Control room: enquiries", href: "/dashboard/site?tab=enquiries", keywords: "admin leads enquiries forms inbox" },
  { kind: "Admin", title: "Control room: redirects", href: "/dashboard/site?tab=redirects", keywords: "admin redirect 301 broken links" },
  { kind: "Admin", title: "Control room: Innovation Lab", href: "/dashboard/site?tab=lab", keywords: "admin lab prototype new tool" },
  { kind: "Admin", title: "Control room: backups", href: "/dashboard/site?tab=backups", keywords: "admin backup checkpoint restore" },
  { kind: "Admin", title: "Analytics dashboard", href: "/dashboard", keywords: "admin analytics leads visits" },
  { kind: "Admin", title: "Agent control center", href: "/dashboard/agents", keywords: "admin agents" },
];

/** What to suggest first for the page the visitor is on. */
function suggestionsFor(path: string): Entry[] {
  const s = (title: string, href: string, hint?: string): Entry => ({ kind: "Suggested", title, href, hint });
  if (path.startsWith("/services") || path.startsWith("/expertise")) return [s("See pricing", "/pricing", "Published plans and what each includes"), s("See client work", "/portfolio"), s("Book a call about this service", "/book")];
  if (path.startsWith("/portfolio")) return [s("Find a service like this for my business", "/#solution-finder"), s("Read client reviews", "/testimonials"), s("Start a project", "/contact")];
  if (path.startsWith("/pricing")) return [s("Compare plans with a free call", "/book"), s("Estimate your return", "/roi-calculator")];
  if (path.startsWith("/blog") || path.startsWith("/guides")) return [s("Get a free website audit", "/audit"), s("All services", "/#service-explorer")];
  if (path === "/") return [s("Find my solution", "/#solution-finder", "Describe your business, get a matched plan"), s("Explore every service", "/#service-explorer")];
  return [];
}

function match(e: Entry, words: string[]) { const t = `${e.title} ${e.hint ?? ""} ${e.keywords ?? ""}`.toLowerCase(); return words.every((w) => t.includes(w)); }

const KIND_TONE: Record<string, string> = {
  Action: "cp-k-action", Admin: "cp-k-admin", Suggested: "cp-k-suggested",
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
  const path = useRouterState({ select: (st) => st.location.pathname });
  const [staff, setStaff] = useState(false);
  useEffect(() => {
    let live = true;
    supabase.auth.getSession().then(({ data }) => { if (!data.session || !live) return; (supabase as unknown as { rpc: (f: string) => Promise<{ data: unknown }> }).rpc("site_permissions").then(({ data: p }) => { if (live) setStaff(Array.isArray(p) && p.length > 0); }); }).catch(() => {});
    return () => { live = false; };
  }, []);
  const hits = useMemo<Entry[]>(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const cmds = [...actions(), ...(staff ? STAFF : [])];
    if (!words.length) return [...suggestionsFor(path), ...cmds.slice(0, 4), ...(staff ? STAFF.slice(0, 2) : []), ...searchPages("", 6)].filter((e, n, a) => a.findIndex((x) => x.href === e.href) === n).slice(0, 14);
    return [...cmds.filter((c) => match(c, words)), ...searchPages(q, 12)].slice(0, 14);
  }, [q, path, staff]);

  useEffect(() => { setI(0); }, [q]);
  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    input.current?.focus();
    return () => { document.body.style.overflow = original; back?.focus?.(); };
  }, []);
  useEffect(() => { list.current?.querySelector<HTMLElement>(`[data-i="${i}"]`)?.scrollIntoView({ block: "nearest" }); }, [i]);

  const go = (e: Entry | undefined) => {
    if (!e) return;
    track("cta_click", { cta: "site_search", href: e.href });
    onClose();
    if (e.run) { window.setTimeout(e.run, 30); return; }
    if (e.href.startsWith("/#")) { if (path === "/") { document.getElementById(e.href.slice(2))?.scrollIntoView({ behavior: "smooth" }); return; } window.location.assign(e.href); return; }
    if (e.href.includes("?")) { window.location.assign(e.href); return; }
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
            ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search or type a command: services, tools, dark mode…"
            role="combobox" aria-expanded="true" aria-controls={`${uid}-list`} aria-autocomplete="list"
            aria-activedescendant={hits[i] ? `${uid}-o-${i}` : undefined} className="cp-input" maxLength={80} autoComplete="off" spellCheck={false}
          />
          <button type="button" onClick={onClose} className="cp-close" aria-label="Close search"><X className="h-4 w-4" aria-hidden="true" /></button>
        </div>
        <ul ref={list} id={`${uid}-list`} role="listbox" aria-label="Results" className="cp-list">
          {hits.map((h, n) => (
            <li key={`${h.kind}-${h.href}-${h.title}`} id={`${uid}-o-${n}`} role="option" aria-selected={n === i} data-i={n}
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
