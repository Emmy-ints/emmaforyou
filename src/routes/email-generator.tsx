import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toCsv, toText, toWhatsApp, mailtoTest } from "@/lib/email-tools";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { SEQUENCES, pickSequence, GOAL_TO_SEQ, type EmailItem } from "@/lib/email-templates";
import { submitEmailGen, buildWa } from "@/lib/leads";
import { pageHead, breadcrumbLd } from "@/lib/seo";
import { useI18n } from "@/lib/i18n";
import { ShowcaseOptIn, ShowcasePublished, publishToShowcase, useShowcaseChoice } from "../components/showcase/ShowcaseOptIn";

export const Route = createFileRoute("/email-generator")({
  component: EmailGen,
  head: () =>
    pageHead({
      title: "Free Email Sequence Generator — 5 Emails in 60 Seconds",
      description: "Generate a ready-to-use 5-email sequence for your business: welcome, abandoned cart, re-engagement or product launch. Free, no sign-up.",
      path: "/email-generator",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Email sequence generator", path: "/email-generator" }])],
    }),
});

const GOALS = Object.keys(GOAL_TO_SEQ);
const BIZ = ["Restaurant", "Fashion", "Clinic", "Coach", "Ecommerce", "Other"];
const TONES = ["Friendly", "Professional", "Bold", "Warm"];

/** Applies the chosen tone to the built-in templates (used when AI writing is unavailable). */
function applyTone(items: EmailItem[], tone: string): EmailItem[] {
  const greet: Record<string, string> = { Friendly: "Hi friend,", Professional: "Hello,", Bold: "Hey —", Warm: "Dear friend," };
  return items.map((it) => {
    let body = it.body.replace(/^(Hi friend,|Hi gorgeous,|Hi,)/, greet[tone] ?? "Hi friend,");
    let subject = it.subject;
    if (tone === "Professional") { subject = subject.replace(/\s*[\u{1F300}-\u{1FAFF}\u2600-\u27BF]+/gu, "").trim(); body = body.replace(/\s*[\u{1F300}-\u{1FAFF}\u2600-\u27BF]+/gu, ""); }
    if (tone === "Bold") subject = subject.replace(/\.$/, "").replace(/^./, (c) => c.toUpperCase()) + (/[!?⏰]$/.test(subject) ? "" : " →");
    if (tone === "Warm") body = body.replace(/\n\n([^\n]*)$/, "\n\nWith warm wishes,\n$1");
    return { ...it, subject, body };
  });
}

function EmailGen() {
  const [step, setStep] = useState<"form" | "preview">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("Restaurant");
  const [goal, setGoal] = useState("Welcome");
  const [tone, setTone] = useState("Friendly");
  const [offer, setOffer] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiItems, setAiItems] = useState<EmailItem[] | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [error, setError] = useState("");
  const { lang } = useI18n();
  const [view, setView] = useState<"email" | "whatsapp" | "inbox">("email");
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (key: string, text: string) => { try { void navigator.clipboard.writeText(text); setCopied(key); window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800); } catch { /* blocked */ } };
  const download = (name: string, text: string, type: string) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); window.setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
  const [showChoice, setShowChoice] = useShowcaseChoice("emails");
  const [shown, setShown] = useState<string | null>(null);

  const seqKey = pickSequence(goal, businessType);
  const templateItems = applyTone(SEQUENCES[seqKey]?.({ businessName: businessName || "Your Brand", ownerName: name || "Friend" }) || [], tone);
  const items = aiItems ?? templateItems;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setAiItems(null); setSaveFailed(false);
    const [saved, gen] = await Promise.all([
      submitEmailGen({ name, email, whatsapp, business_name: businessName, business_type: businessType, sequence_goal: goal, tone }),
      fetch("/api/email-sequence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessName, ownerName: name, businessType, goal, tone, offer }) })
        .then(async (r) => ({ ok: r.ok, data: await r.json().catch(() => ({})) })).catch(() => ({ ok: false, data: {} as Record<string, unknown> })),
    ]);
    setSaveFailed(!saved.ok);
    if (gen.ok && gen.data.aiWritten && Array.isArray(gen.data.emails)) {
      setAiItems(gen.data.emails as EmailItem[]);
      const sc = gen.data.showcase as { content?: unknown; sig?: string } | undefined;
      setShown(null);
      if (sc?.sig && showChoice.show) void publishToShowcase({ kind: "emails", sig: sc.sig, content: sc.content, business: businessName.trim() || undefined, choice: showChoice }, lang).then((r) => r && setShown(r.slug));
    }
    else if (!gen.ok && typeof gen.data.message === "string" && /used your|busy/i.test(gen.data.message)) setError(gen.data.message);
    setBusy(false);
    setStep("preview");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content" className="pt-32 pb-24">
        <section className="mx-auto max-w-5xl px-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <span className="inline-block rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground">Email Sequence Generator · Free</span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-6xl">Get your <span className="gradient-text">5-email sequence</span> in 60 seconds</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">Tell us about your business. You'll get a ready-to-edit 5-email sequence you can paste into your email tool today.</p>
          </motion.div>

          {step === "form" ? (
            <form onSubmit={submit} className="mx-auto mt-12 max-w-2xl rounded-3xl border border-border bg-card p-8">
              <div className="grid gap-3 md:grid-cols-2">
                <input className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
                <input className="input" placeholder="Business name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
                <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input className="input" placeholder="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required />
                <select className="input" value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
                  {BIZ.map((b) => <option key={b}>{b}</option>)}
                </select>
                <select className="input" value={goal} onChange={(e) => setGoal(e.target.value)} aria-label="Sequence goal">
                  {GOALS.map((g) => <option key={g}>{g}</option>)}
                </select>
                <input className="input md:col-span-2" placeholder="Offer or detail to mention (optional), e.g. 10% off first order" value={offer} onChange={(e) => setOffer(e.target.value)} maxLength={200} aria-label="Offer or detail to mention" />
              </div>
              <div className="mt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Tone</p>
                <div className="flex flex-wrap gap-2">
                  {TONES.map((t) => (
                    <button key={t} type="button" onClick={() => setTone(t)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${tone === t ? "bg-foreground text-background" : "border border-border bg-background text-muted-foreground hover:text-foreground"}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="mt-5"><ShowcaseOptIn kind="emails" choice={showChoice} onChange={setShowChoice} business={businessName} /></div>
              <button disabled={busy} className="btn-primary-gradient mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 font-semibold text-white disabled:opacity-60">
                {busy ? "Writing your emails…" : "Generate my sequence →"}
              </button>
            </form>
          ) : (
            <div className="mt-12">
              <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your 5-email sequence · {goal} · {tone} tone</p>
                <p className="mt-2 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">{aiItems ? "Written by AI for your business. Fill in anything in [square brackets] and check every detail before sending." : "Template version: our AI writer isn't available right now, so this uses our ready-made sequence for your goal with your chosen tone applied. Fill in anything in [square brackets] before sending."}</p>
                {error && <p role="alert" className="mt-2 text-xs text-amber-600">{error}</p>}
                {shown && <div className="mt-2"><ShowcasePublished key={shown} slug={shown} /></div>}
                {saveFailed && <p role="alert" className="mt-2 text-xs text-amber-600">We couldn't save your details, so we won't be able to follow up automatically. Message us on WhatsApp if you'd like help.</p>}
                <h3 className="mt-2 font-display text-2xl font-bold">{businessName || "Your Brand"} · {businessType}</h3>
                <div className="mt-5 flex flex-wrap gap-1 rounded-full border border-border p-1 text-xs sm:w-max" role="tablist" aria-label="How to view the sequence">
                  {([["email", "Emails"], ["whatsapp", "WhatsApp version"], ["inbox", "Inbox preview"]] as const).map(([id, label]) => (
                    <button key={id} type="button" role="tab" aria-selected={view === id} onClick={() => setView(id)} className={`flex-1 rounded-full px-3 py-1.5 font-semibold sm:flex-none ${view === id ? "bg-foreground text-background" : "text-muted-foreground"}`}>{label}</button>
                  ))}
                </div>
                {view === "inbox" ? (
                  <div className="mx-auto mt-6 max-w-sm overflow-hidden rounded-[28px] border-[6px] border-[#0b0d24] bg-white text-[#111] shadow-xl" data-email-inbox>
                    <div className="border-b border-black/10 px-4 py-3 text-sm font-bold">Inbox</div>
                    {items.map((it) => (
                      <div key={it.day} className="border-b border-black/5 px-4 py-3">
                        <div className="flex items-baseline justify-between gap-2"><span className="truncate text-sm font-bold">{businessName || "Your Brand"}</span><span className="shrink-0 text-[11px] text-black/50">Day {it.day}</span></div>
                        <p className="truncate text-[13px] font-semibold">{it.subject}</p>
                        <p className="truncate text-[12px] text-black/55">{it.preview || it.body.slice(0, 90)}</p>
                      </div>
                    ))}
                    <p className="px-4 py-3 text-[11px] text-black/50">How the subject lines and preview text look on a phone. Aim for subjects under ~45 characters.</p>
                  </div>
                ) : (
                <div className="mt-6 space-y-4">
                  {items.map((it) => {
                    const wa = toWhatsApp(it);
                    return (
                    <div key={it.day} className="rounded-2xl border border-border bg-background p-5" data-email-day={it.day}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded-full bg-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-background">Day {it.day}</span>
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          {view === "email" ? `${it.body.split(/\s+/).filter(Boolean).length} words · subject ${it.subject.length} chars` : `${wa.length} characters`}
                          <button type="button" onClick={() => copy(`${view}-${it.day}`, view === "email" ? `Subject: ${it.subject}\n\n${it.body}` : wa)} className="rounded-full border border-border px-2.5 py-1 font-semibold text-foreground hover:border-[var(--emma-violet)]">{copied === `${view}-${it.day}` ? "Copied" : "Copy"}</button>
                          {view === "email" ? <a href={mailtoTest(it)} className="rounded-full border border-border px-2.5 py-1 font-semibold text-foreground hover:border-[var(--emma-violet)]">Test send</a>
                            : <a href={`https://wa.me/?text=${encodeURIComponent(wa)}`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#25d366] px-2.5 py-1 font-semibold text-white">Send on WhatsApp</a>}
                        </span>
                      </div>
                      {view === "email" ? (<>
                        <h4 className="mt-3 font-display text-lg font-bold">{it.subject}</h4>
                        <p className="mt-1 text-xs text-muted-foreground italic">Preview: {it.preview}</p>
                        <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">{it.body}</pre>
                      </>) : (
                        <div className="mt-3 max-w-md rounded-2xl rounded-tl-sm bg-[#dcf8c6] px-3.5 py-2.5 text-sm leading-relaxed text-[#111] dark:bg-[#005c4b] dark:text-white" data-wa-version>
                          <pre className="whitespace-pre-wrap font-sans">{wa.replace(/^\*(.+)\*$/m, "$1")}</pre>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => copy("all", view === "whatsapp" ? items.map((it) => `Day ${it.day}\n${toWhatsApp(it)}`).join("\n\n---\n\n") : toText(items))} className="rounded-full border border-border px-4 py-2 text-sm font-semibold">{copied === "all" ? "Copied" : `Copy all ${items.length}`}</button>
                  <button type="button" onClick={() => download(`${(businessName || "sequence").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${goal.toLowerCase()}-emails.csv`, toCsv(items), "text/csv")} className="rounded-full border border-border px-4 py-2 text-sm font-semibold">Download CSV</button>
                  <button type="button" onClick={() => download(`${(businessName || "sequence").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${goal.toLowerCase()}-emails.txt`, toText(items), "text/plain")} className="rounded-full border border-border px-4 py-2 text-sm font-semibold">Download text</button>
                  <button type="button" onClick={() => setStep("form")} className="rounded-full border border-border px-4 py-2 text-sm font-semibold">Edit answers</button>
                </div>
                <div className="mt-6 rounded-2xl bg-muted/40 p-5 text-center">
                  <p className="font-display text-base font-bold">Want us to set this up + automate it?</p>
                  <a href={buildWa(`Hi! I generated a "${goal}" sequence for ${businessName}. Can you set it up in my email tool?`)} target="_blank" rel="noopener noreferrer" className="btn-primary-gradient mt-3 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white">Talk to a strategist →</a>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}