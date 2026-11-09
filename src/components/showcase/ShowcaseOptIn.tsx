import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Eye, Loader2, Trash2 } from "lucide-react";
import { DEFAULT_SHOW, KIND_LABEL, forgetItem, myItems, rememberItem, type ShowcaseKind } from "@/lib/showcase";
import { track } from "@/lib/analytics";

export interface ShowcaseChoice { show: boolean; showBusiness: boolean; showSite: boolean }

/** The visitor's choice, remembered per tool (ticked by default for prototypes, plans and emails). */
export function useShowcaseChoice(kind: ShowcaseKind): [ShowcaseChoice, (c: ShowcaseChoice) => void] {
  const key = `efy_showcase_pref_${kind}`;
  const [c, setC] = useState<ShowcaseChoice>({ show: DEFAULT_SHOW[kind], showBusiness: false, showSite: false });
  useEffect(() => { try { const v = JSON.parse(localStorage.getItem(key) || "null"); if (v && typeof v.show === "boolean") setC({ show: v.show, showBusiness: !!v.showBusiness, showSite: false }); } catch { /* ignore */ } }, [key]);
  const set = (v: ShowcaseChoice) => { setC(v); try { localStorage.setItem(key, JSON.stringify({ show: v.show, showBusiness: v.showBusiness })); } catch { /* ignore */ } };
  return [c, set];
}

/** Checkbox shown next to a tool's button: what will be public, in plain words. */
export function ShowcaseOptIn({ kind, choice, onChange, business, compact = false, dark = false }: {
  kind: ShowcaseKind; choice: ShowcaseChoice; onChange: (c: ShowcaseChoice) => void; business?: string; compact?: boolean; dark?: boolean;
}) {
  const muted = dark ? "text-white/70" : "text-muted-foreground";
  const id = `sc-${kind}`;
  return (
    <div className={`grid gap-1.5 text-xs ${muted}`} data-showcase-optin={kind}>
      <label htmlFor={id} className="flex items-start gap-2">
        <input id={id} type="checkbox" checked={choice.show} onChange={(e) => onChange({ ...choice, show: e.target.checked })} className="mt-0.5 h-4 w-4 accent-[var(--emma-violet)]" />
        <span>
          Add the result to our <Link to="/showcase" className="font-semibold underline-offset-2 hover:underline">public showcase</Link>
          {compact ? "" : kind === "audit" ? " (score and top fixes only)" : kind === "makeover" ? " (this shows your redesigned page)" : " (without your name or contact details)"}
          . You can remove it anytime.
        </span>
      </label>
      {choice.show && business?.trim() && (
        <label htmlFor={`${id}-biz`} className="ml-6 flex items-center gap-2">
          <input id={`${id}-biz`} type="checkbox" checked={choice.showBusiness} onChange={(e) => onChange({ ...choice, showBusiness: e.target.checked })} className="h-3.5 w-3.5" />
          Show my business name ({business.trim().slice(0, 40)})
        </label>
      )}
      {choice.show && kind === "audit" && (
        <label htmlFor={`${id}-site`} className="ml-6 flex items-center gap-2">
          <input id={`${id}-site`} type="checkbox" checked={choice.showSite} onChange={(e) => onChange({ ...choice, showSite: e.target.checked })} className="h-3.5 w-3.5" />
          It's my own website: show its address
        </label>
      )}
    </div>
  );
}

export interface PublishInput {
  kind: ShowcaseKind; sig: string; content: unknown; prompt?: string; business?: string; place?: string; choice: ShowcaseChoice;
}

/** Publish (only if the visitor chose to). Remembers the private remove token in this browser. */
export async function publishToShowcase(p: PublishInput, lang = "en"): Promise<{ slug: string; title: string } | null> {
  if (!p.choice.show || !p.sig) return null;
  try {
    const res = await fetch("/api/showcase", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: p.kind, sig: p.sig, content: p.content, prompt: p.prompt, business: p.business || undefined, showBusiness: p.choice.showBusiness, showSite: p.choice.showSite, place: p.place || undefined, lang }),
    });
    const v = (await res.json().catch(() => ({}))) as { slug?: string; token?: string; title?: string };
    if (!res.ok || !v.slug || !v.token) return null;
    rememberItem({ slug: v.slug, token: v.token, title: v.title ?? KIND_LABEL[p.kind].one, kind: p.kind, at: new Date().toISOString() });
    track("showcase_published", { kind: p.kind });
    return { slug: v.slug, title: v.title ?? "" };
  } catch { return null; }
}

export async function removeFromShowcase(slug: string): Promise<boolean> {
  const mine = myItems().find((x) => x.slug === slug);
  if (!mine) return false;
  const res = await fetch("/api/showcase", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, token: mine.token }) }).catch(() => null);
  if (res?.ok || res?.status === 404) { forgetItem(slug); track("showcase_removed", { kind: mine.kind }); return true; }
  return false;
}

/** Small line under a result: "Added to the showcase · View · Remove". */
export function ShowcasePublished({ slug, dark = false }: { slug: string; dark?: boolean }) {
  const [state, setState] = useState<"shown" | "removing" | "removed">("shown");
  if (state === "removed") return <p className={`text-xs ${dark ? "text-white/70" : "text-muted-foreground"}`}>Removed from the showcase.</p>;
  return (
    <p className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${dark ? "text-white/80" : "text-muted-foreground"}`} data-showcase-published={slug}>
      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400"><Check className="h-3.5 w-3.5" aria-hidden="true" /> Added to the public showcase</span>
      <Link to="/showcase/$slug" params={{ slug }} className="inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline"><Eye className="h-3.5 w-3.5" aria-hidden="true" /> View</Link>
      <button type="button" disabled={state === "removing"} onClick={async () => { setState("removing"); setState((await removeFromShowcase(slug)) ? "removed" : "shown"); }} className="inline-flex items-center gap-1 underline-offset-2 hover:underline">
        {state === "removing" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />} Remove
      </button>
    </p>
  );
}
