import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Download, Loader2, Lock } from "lucide-react";
import { itemCount, type Checklist } from "@/lib/checklists";
import { submitMagnet } from "@/lib/leads";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = supabase as unknown as { rpc: (fn: string, args: Record<string, unknown>) => any };
const UNLOCK_KEY = "efy_checklists";
const PREVIEW_ITEMS = 3;

function unlocked(): string[] {
  try { return JSON.parse(localStorage.getItem(UNLOCK_KEY) || "[]"); } catch { return []; }
}

export default function ChecklistView({ c }: { c: Checklist }) {
  const [open, setOpen] = useState(false);
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const total = itemCount(c);
  useEffect(() => { setOpen(unlocked().includes(c.slug)); }, [c.slug]);
  useEffect(() => {
    try { setTicked(new Set(JSON.parse(localStorage.getItem(`efy_cl_${c.slug}`) || "[]"))); } catch { /* storage blocked */ }
  }, [c.slug]);
  function toggle(k: string) {
    setTicked((t) => {
      const n = new Set(t); n.has(k) ? n.delete(k) : n.add(k);
      try { localStorage.setItem(`efy_cl_${c.slug}`, JSON.stringify([...n])); } catch { /* storage blocked */ }
      return n;
    });
  }

  return (
    <div className="space-y-8">
      <section className="print-area space-y-6" aria-labelledby="cl-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="cl-title" className="font-display text-2xl font-semibold">{c.title} · {total} checks</h2>
          {open && <p className="no-print text-sm text-muted-foreground">{ticked.size} of {total} done</p>}
        </div>
        {open && <div className="no-print h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-[var(--emma-violet)] transition-all" style={{ width: `${(ticked.size / total) * 100}%` }} /></div>}
        {c.sections.map((s, si) => (
          <div key={s.title} className="rounded-[20px] border border-border bg-card p-5">
            <h3 className="font-display text-lg font-semibold">{s.title} <span className="text-sm font-normal text-muted-foreground">({s.items.length})</span></h3>
            <ul className="mt-3 space-y-2.5">
              {s.items.map(([item, why], ii) => {
                const k = `${si}-${ii}`;
                if (!open && !(si === 0 && ii < PREVIEW_ITEMS)) return null;
                return (
                  <li key={k}>
                    <label className="flex cursor-pointer gap-3">
                      <input type="checkbox" disabled={!open} checked={ticked.has(k)} onChange={() => toggle(k)} className="mt-1 h-4 w-4 shrink-0 accent-[var(--emma-violet)]" />
                      <span><span className={`block text-sm font-medium ${ticked.has(k) ? "text-muted-foreground line-through" : "text-foreground"}`}>{item}</span><span className="block text-xs text-muted-foreground">{why}</span></span>
                    </label>
                  </li>
                );
              })}
              {!open && (
                <li className="no-print flex items-center gap-2 text-sm text-muted-foreground"><Lock className="h-4 w-4" /> {si === 0 ? s.items.length - PREVIEW_ITEMS : s.items.length} more checks unlock below</li>
              )}
            </ul>
          </div>
        ))}
        {open && <p className="text-xs text-muted-foreground">{c.title} by EmmaForYou · emmaforyou.lovable.app/checklists/{c.slug}</p>}
      </section>

      {open ? (
        <div className="no-print flex flex-wrap gap-3">
          <button onClick={() => window.print()} className="btn-primary-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white"><Download className="h-4 w-4" /> Download PDF</button>
          <Link to={c.tool.to} className="inline-flex rounded-full border border-border px-5 py-3 text-sm font-semibold hover:border-[var(--emma-violet)]">{c.tool.label}</Link>
          <Link to={c.related.to} className="inline-flex rounded-full border border-border px-5 py-3 text-sm font-semibold hover:border-[var(--emma-violet)]">Get help: {c.related.label}</Link>
        </div>
      ) : (
        <UnlockForm c={c} onDone={() => setOpen(true)} />
      )}
    </div>
  );
}

function UnlockForm({ c, onDone }: { c: Checklist; onDone: () => void }) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [news, setNews] = useState(true);
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const ok = name.trim() && whatsapp.replace(/\D/g, "").length >= 6;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ok) return;
    setState("saving");
    const res = await submitMagnet({ name: name.trim().slice(0, 120), whatsapp: whatsapp.trim().slice(0, 40), email: email.trim().slice(0, 200) || undefined, resource_slug: c.slug, resource_title: c.title, opted_in_weekly: news });
    if (!res.ok) { setState("error"); return; }
    if (news && email.includes("@")) await rpc.rpc("newsletter_subscribe", { p_email: email.trim(), p_name: name.trim(), p_source: `checklist:${c.slug}`, p_language: "en" });
    try { localStorage.setItem(UNLOCK_KEY, JSON.stringify([...new Set([...unlocked(), c.slug])])); } catch { /* storage blocked */ }
    onDone();
  }

  return (
    <form onSubmit={submit} className="no-print rounded-[24px] border-2 border-[var(--emma-violet)] bg-card p-6 shadow-[var(--shadow-card-hover)]">
      <h2 className="font-display text-xl font-semibold">Get the full checklist, free</h2>
      <p className="mt-1 text-sm text-muted-foreground">Unlock all {itemCount(c)} checks, tick them off as you go, and download it as a PDF.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label><span className="sr-only">Name</span><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={120} className="input" /></label>
        <label><span className="sr-only">WhatsApp</span><input required value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp number" inputMode="tel" maxLength={40} className="input" /></label>
        <label><span className="sr-only">Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" maxLength={200} className="input" /></label>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={news} onChange={(e) => setNews(e.target.checked)} className="h-4 w-4 accent-[var(--emma-violet)]" /> Also send me the monthly newsletter (needs an email)</label>
      <button disabled={!ok || state === "saving"} className="btn-primary-gradient mt-4 inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white disabled:opacity-50">
        {state === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Unlock the checklist
      </button>
      {state === "error" && <p role="alert" className="mt-2 text-sm text-red-600">That didn't go through. Please try again.</p>}
      <p className="mt-3 text-xs text-muted-foreground">We'll only use your number to follow up about this checklist and how we can help.</p>
    </form>
  );
}
