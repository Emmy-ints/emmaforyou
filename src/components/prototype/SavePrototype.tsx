import { useMemo, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarCheck, Check, Copy, Loader2, MessageCircle, QrCode, Smartphone } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";
import { qrSvg } from "@/lib/qr";
import { buildWa } from "@/lib/leads";
import { track } from "@/lib/analytics";
import type { PlanSuggestion, ProtoKind, ProtoPlan } from "@/lib/prototype";
import type { PrototypeCopy } from "@/lib/prototype-copy";

export interface SavePayload {
  kind: ProtoKind;
  prompt: string;
  html: string;
  sig: string;
  plan?: ProtoPlan;
  pages?: string[];
  logo?: string;
  platform?: "ios" | "android";
  business?: string;
}

export function QrCard({ url, label }: { url: string; label: string }) {
  const svg = useMemo(() => qrSvg(url, { dark: "#0b0d24" }), [url]);
  return (
    <figure className="efy-qr">
      <div className="efy-qr-code" role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: svg }} />
      <figcaption className="sr-only">{url}</figcaption>
    </figure>
  );
}

export function CopyLink({ url, c }: { url: string; c: PrototypeCopy }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-full border border-border bg-background py-1 pl-4 pr-1">
      <input readOnly size={1} value={url} aria-label="Prototype link" onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
      <Button type="button" size="sm" variant="secondary" className="shrink-0 rounded-full" onClick={() => {
        navigator.clipboard?.writeText(url).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1600); }, () => {});
      }}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? c.copied : c.copy}
      </Button>
    </div>
  );
}

/** Contact-gated save: the preview is free; saving gives a link + QR to open on the phone, and tells the owner. */
export function SaveDialog({ open, onOpenChange, payload, c, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; payload: SavePayload | null; c: PrototypeCopy; onSaved: (slug: string, suggestion: PlanSuggestion) => void }) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [business, setBusiness] = useState(payload?.business ?? "");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [slug, setSlug] = useState("");
  const url = slug ? `${typeof window !== "undefined" ? window.location.origin : ""}/p/${slug}` : "";

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!payload || busy) return;
    if (!whatsapp.trim() && !email.trim()) { setError(c.contactNeed); return; }
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/prototype-share", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, name: name.trim(), whatsapp: whatsapp.trim(), email: email.trim(), business: business.trim() || undefined, consent }),
      });
      const v = (await res.json().catch(() => ({}))) as { slug?: string; message?: string; suggestion?: PlanSuggestion };
      if (!res.ok || !v.slug) throw new Error(v.message || "We couldn't save your prototype. Please try again.");
      setSlug(v.slug);
      track("prototype_saved", { kind: payload.kind });
      if (v.suggestion) onSaved(v.slug, v.suggestion);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't save your prototype. Please try again.");
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] w-[95vw] max-w-lg overflow-y-auto">
        <DialogTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5 text-[var(--emma-violet)]" aria-hidden="true" /> {slug ? c.saved : c.save}</DialogTitle>
        <DialogDescription>{slug ? c.shareNote : c.saveIntro}</DialogDescription>
        {slug ? (
          <div className="grid gap-4">
            <QrCard url={url} label={c.saved} />
            <CopyLink url={url} c={c} />
            <a href={`/p/${slug}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--emma-violet)]">{c.openLink} <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></a>
          </div>
        ) : (
          <form className="grid gap-3" onSubmit={submit} noValidate>
            <label className="grid gap-1 text-sm font-medium" htmlFor="ps-name">{c.name}
              <input id="ps-name" required maxLength={100} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="efy-input" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-medium" htmlFor="ps-wa">{c.whatsapp}
                <input id="ps-wa" type="tel" inputMode="tel" maxLength={22} autoComplete="tel" placeholder="+234…" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="efy-input" />
              </label>
              <label className="grid gap-1 text-sm font-medium" htmlFor="ps-email">{c.email}
                <input id="ps-email" type="email" maxLength={200} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="efy-input" />
              </label>
            </div>
            <label className="grid gap-1 text-sm font-medium" htmlFor="ps-business">{c.businessName}
              <input id="ps-business" maxLength={120} autoComplete="organization" value={business} onChange={(e) => setBusiness(e.target.value)} className="efy-input" />
            </label>
            <label className="flex items-start gap-2 text-sm" htmlFor="ps-consent">
              <input id="ps-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4" required />
              <span>{c.consent} <Link to="/privacy" className="underline">Privacy</Link></span>
            </label>
            {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">{error}</p>}
            <Button type="submit" disabled={busy || !name.trim() || !consent} className="btn-gold h-11 rounded-full">
              {busy ? <Loader2 className="animate-spin" /> : <QrCode />} {busy ? c.saving : c.saveBtn}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** After the preview: which published plan fits, and the next steps (call, WhatsApp, save to phone). */
export function MakeItReal({ kind, suggestion, c, onSave, slug }: { kind: ProtoKind; suggestion: PlanSuggestion; c: PrototypeCopy; onSave: () => void; slug?: string }) {
  const wa = buildWa(`${c.waMessage.replace("{kind}", kind === "app" ? c.app.toLowerCase() : c.website.toLowerCase())}${slug && typeof window !== "undefined" ? ` ${window.location.origin}/p/${slug}` : ""}`);
  return (
    <section className="efy-real" aria-labelledby="efy-real-title">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{c.makeReal}</p>
        <h3 id="efy-real-title" className="mt-1 font-display text-xl font-bold">
          {c.suggested}: {suggestion.tier} <span className="text-[var(--emma-violet)]">· {suggestion.price}</span>
        </h3>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">{suggestion.why}</p>
        <ul className="mt-3 flex flex-wrap gap-2" aria-label={c.includes}>
          {suggestion.includes.map((f) => <li key={f} className="rounded-full border border-border px-3 py-1 text-xs">{f}</li>)}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">{c.realNote} <Link to="/pricing" className="font-semibold text-[var(--emma-violet)]">{c.seePricing}</Link></p>
      </div>
      <div className="flex flex-col gap-2 sm:min-w-[230px]">
        <Button asChild className="btn-gold h-11 rounded-full"><Link to="/book" search={slug ? { prototype: slug } : {}} onClick={() => track("cta_click", { cta: "prototype_book", kind })}><CalendarCheck /> {c.bookCall}</Link></Button>
        <Button asChild variant="outline" className="h-11 rounded-full"><a href={wa} target="_blank" rel="noopener noreferrer" onClick={() => track("cta_click", { cta: "prototype_whatsapp", kind })}><MessageCircle className="text-[#25d366]" /> {c.whatsappUs}</a></Button>
        <Button type="button" variant="ghost" className="h-11 rounded-full" onClick={onSave}><QrCode /> {c.save}</Button>
      </div>
    </section>
  );
}
