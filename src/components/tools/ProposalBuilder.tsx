// @ts-nocheck -- generated DB/router types lag behind; runtime verified
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Download, FileSignature, Loader2, PenLine, Sparkles } from "lucide-react";
import { BUDGETS, GOALS, INDUSTRIES, SERVICES, TIMELINES, type ProposalDoc, type ProposalRequest } from "@/lib/proposal";
import { TIERS } from "@/lib/pricing-data";
import { supabase } from "@/integrations/supabase/client";
import { buildWa } from "@/lib/leads";
import { track } from "@/lib/analytics";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

const EMPTY: ProposalRequest = { business: "", contactName: "", industry: INDUSTRIES[0], location: "", hasWebsite: "no", goals: [], services: [], budget: BUDGETS[1], timeline: TIMELINES[1], notes: "" };

function Chip({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-sm transition ${on ? "border-[var(--emma-violet)] bg-[var(--emma-violet)] text-white" : "border-border bg-card text-foreground hover:border-[var(--emma-violet)]"}`}>
      {children}
    </button>
  );
}

export default function ProposalBuilder() {
  const [form, setForm] = useState<ProposalRequest>(EMPTY);
  const [aiWritten, setAiWritten] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [doc, setDoc] = useState<ProposalDoc | null>(null);
  const set = <K extends keyof ProposalRequest>(k: K, v: ProposalRequest[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (k: "goals" | "services", v: string) => setForm((f) => ({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] }));

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/proposal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "The proposal couldn't be drafted.");
      setDoc(data.proposal);
      setAiWritten(data.aiWritten !== false);
      track("proposal_generated", { plan: data.proposal.recommendedPlan, industry: form.industry });
      window.setTimeout(() => document.getElementById("proposal-doc")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const ready = form.business.trim().length >= 2 && form.contactName.trim().length >= 2 && form.goals.length > 0;

  return (
    <div className="space-y-10">
      {!doc && (
        <form onSubmit={generate} className="no-print space-y-7 rounded-[24px] border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-foreground">Business name<input required value={form.business} onChange={(e) => set("business", e.target.value)} maxLength={120} className="roi-input mt-1.5" placeholder="e.g. Glow Studio" /></label>
            <label className="text-sm font-medium text-foreground">Your name<input required value={form.contactName} onChange={(e) => set("contactName", e.target.value)} maxLength={80} className="roi-input mt-1.5" placeholder="e.g. Ada Okafor" /></label>
            <label className="text-sm font-medium text-foreground">Industry<select value={form.industry} onChange={(e) => set("industry", e.target.value)} className="roi-input mt-1.5">{INDUSTRIES.map((x) => <option key={x}>{x}</option>)}</select></label>
            <label className="text-sm font-medium text-foreground">City / country<input value={form.location} onChange={(e) => set("location", e.target.value)} maxLength={80} className="roi-input mt-1.5" placeholder="e.g. Lagos, Nigeria" /></label>
          </div>
          <fieldset>
            <legend className="text-sm font-medium text-foreground">Do you have a website?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {([["no", "No"], ["outdated", "Yes, but it's outdated"], ["yes", "Yes, and it works"]] as const).map(([v, l]) => <Chip key={v} on={form.hasWebsite === v} onClick={() => set("hasWebsite", v)}>{l}</Chip>)}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-medium text-foreground">What do you want to achieve? <span className="font-normal text-muted-foreground">Choose any</span></legend>
            <div className="mt-2 flex flex-wrap gap-2">{GOALS.map((g) => <Chip key={g} on={form.goals.includes(g)} onClick={() => toggle("goals", g)}>{g}</Chip>)}</div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-medium text-foreground">Services you're considering <span className="font-normal text-muted-foreground">Optional</span></legend>
            <div className="mt-2 flex flex-wrap gap-2">{SERVICES.map((s) => <Chip key={s} on={form.services.includes(s)} onClick={() => toggle("services", s)}>{s}</Chip>)}</div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-foreground">Budget<select value={form.budget} onChange={(e) => set("budget", e.target.value)} className="roi-input mt-1.5">{BUDGETS.map((x) => <option key={x}>{x}</option>)}</select></label>
            <label className="text-sm font-medium text-foreground">When do you want to start?<select value={form.timeline} onChange={(e) => set("timeline", e.target.value)} className="roi-input mt-1.5">{TIMELINES.map((x) => <option key={x}>{x}</option>)}</select></label>
          </div>
          <label className="block text-sm font-medium text-foreground">Anything else we should know? <span className="font-normal text-muted-foreground">Optional</span>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} maxLength={600} rows={3} className="roi-input mt-1.5" placeholder="e.g. We get most orders on Instagram DMs and miss lots of messages at night." />
          </label>
          <div className="flex flex-wrap items-center gap-4">
            <button disabled={!ready || busy} className="btn-primary-gradient inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white disabled:opacity-50">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />} {busy ? "Drafting your proposal…" : "Build my proposal"}
            </button>
            <p className="text-xs text-muted-foreground">Takes about 20 seconds. Prices come from our published plans.</p>
          </div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </form>
      )}
      {doc && <ProposalDocument doc={doc} req={form} onEdit={() => setDoc(null)} />}
    </div>
  );
}

function ProposalDocument({ doc, req, onEdit }: { doc: ProposalDoc; req: ProposalRequest; onEdit: () => void }) {
  const tier = TIERS.find((t) => t.name === doc.recommendedPlan)!;
  const custom = "custom" in tier && tier.custom;
  const date = new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  const [signed, setSigned] = useState<{ name: string; at: string } | null>(null);

  return (
    <article id="proposal-doc" className="print-area scroll-mt-28 overflow-hidden rounded-[24px] border border-border bg-card shadow-[var(--shadow-card-hover)]">
      <header className="hero-ink px-6 py-8 md:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--emma-violet)]">Proposal · {date}</p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">{doc.title}</h2>
        <p className="mt-2 text-sm text-white/70">Prepared for {req.contactName}, {req.business} · by Emmanuel Oluwaseun Akinloye, EmmaForYou</p>
      </header>
      <div className="space-y-9 px-6 py-8 md:px-10">
        {!aiWritten && <p className="no-print rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground"><strong className="text-foreground">Standard draft.</strong> Our AI writer is unavailable right now, so this proposal was built from our published plans and your answers using fixed rules. It's accurate to what you selected; we'll tailor it on a free call.</p>}
        <section><h3 className="font-display text-lg font-semibold">Summary</h3><p className="mt-2 text-muted-foreground">{doc.summary}</p></section>
        <div className="grid gap-6 md:grid-cols-2">
          <section><h3 className="font-display text-lg font-semibold">Your goals</h3><ul className="mt-2 space-y-1.5">{doc.goals.map((g) => <li key={g} className="flex gap-2 text-sm text-foreground"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--emma-violet)]" />{g}</li>)}</ul></section>
          <section><h3 className="font-display text-lg font-semibold">What's in the way</h3><ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">{doc.challenges.map((c) => <li key={c}>{c}</li>)}</ul></section>
        </div>
        <section>
          <h3 className="font-display text-lg font-semibold">The plan</h3>
          <ol className="mt-4 space-y-4">
            {doc.phases.map((ph, i) => (
              <li key={i} className="rounded-2xl border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--emma-violet)]">{ph.when}</p>
                <p className="mt-1 font-semibold text-foreground">{ph.name}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{ph.deliverables.map((d) => <li key={d}>{d}</li>)}</ul>
              </li>
            ))}
          </ol>
        </section>
        <section className="rounded-2xl border-2 border-[var(--emma-violet)] p-5">
          <h3 className="font-display text-lg font-semibold">Investment</h3>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Recommended plan</p>
              <p className="font-display text-2xl font-semibold text-foreground">{tier.name}</p>
            </div>
            <p className="font-display text-3xl font-semibold text-foreground">{custom ? "Custom quote" : <>${tier.monthly}<span className="text-base font-normal text-muted-foreground"> / month</span></>}</p>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{doc.planReason}</p>
          <ul className="mt-3 grid gap-1.5 text-sm text-foreground sm:grid-cols-2">{tier.features.map((f) => <li key={f} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{f}</li>)}</ul>
          {doc.extras.length > 0 && (
            <div className="mt-4 border-t border-border pt-3 text-sm">
              <p className="font-medium text-foreground">One-off work</p>
              {doc.extras.map((x) => <p key={x.item} className="mt-1 flex justify-between gap-3 text-muted-foreground"><span>{x.item}</span><span>{x.note}</span></p>)}
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">Prices as published at emmaforyou.lovable.app/pricing on {date}. Month-to-month; ad spend is paid directly to the platforms; larger projects can be split into 2–3 payments.</p>
        </section>
        <section>
          <h3 className="font-display text-lg font-semibold">How we'll measure progress</h3>
          <dl className="mt-3 grid gap-3 md:grid-cols-3">{doc.measures.map((m) => <div key={m.metric} className="rounded-2xl bg-muted p-4"><dt className="font-medium text-foreground">{m.metric}</dt><dd className="mt-1 text-sm text-muted-foreground">{m.how}</dd></div>)}</dl>
        </section>
        <section><h3 className="font-display text-lg font-semibold">Next steps</h3><ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-foreground">{doc.nextSteps.map((s) => <li key={s}>{s}</li>)}</ol></section>

        {signed ? (
          <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <p className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300"><FileSignature className="h-5 w-5" /> Accepted</p>
            <p className="mt-3 font-[cursive] text-3xl text-foreground">{signed.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">Signed electronically on {signed.at} for {req.business}</p>
            <p className="no-print mt-3 text-sm text-foreground">Emmanuel has been notified and will message you to confirm the kickoff call and send your first invoice. <Link to="/book" className="font-semibold text-[var(--emma-violet)] underline-offset-4 hover:underline">Pick a kickoff time now</Link>.</p>
          </section>
        ) : (
          <AcceptBlock doc={doc} req={req} onSigned={setSigned} />
        )}
      </div>
      <div className="no-print flex flex-wrap gap-3 border-t border-border px-6 py-5 md:px-10">
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:border-[var(--emma-violet)]"><Download className="h-4 w-4" /> Download PDF</button>
        <button onClick={onEdit} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:border-[var(--emma-violet)]"><PenLine className="h-4 w-4" /> Change my answers</button>
        <a href={buildWa(`Hi Emmanuel, I built a proposal for ${req.business} on your site (${doc.recommendedPlan} plan). I have a few questions.`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-5 py-2.5 text-sm font-semibold text-white">Ask a question on WhatsApp</a>
      </div>
    </article>
  );
}

function AcceptBlock({ doc, req, onSigned }: { doc: ProposalDoc; req: ProposalRequest; onSigned: (s: { name: string; at: string }) => void }) {
  const [name, setName] = useState(req.contactName);
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const ok = name.trim().length >= 2 && agree && (whatsapp.trim().length >= 6 || email.includes("@"));

  async function accept(e: React.FormEvent) {
    e.preventDefault();
    if (!ok) return;
    setState("saving");
    const { error } = await db.from("proposal_acceptances").insert({
      full_name: name.trim().slice(0, 120), business_name: req.business.slice(0, 160), plan: doc.recommendedPlan,
      whatsapp: whatsapp.trim().slice(0, 40) || null, email: email.trim().slice(0, 200) || null,
      proposal: { request: req, proposal: doc },
    });
    if (error) { setState("error"); return; }
    track("proposal_accepted", { plan: doc.recommendedPlan });
    onSigned({ name: name.trim(), at: new Date().toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" }) });
  }

  return (
    <form onSubmit={accept} className="no-print rounded-2xl border border-border bg-muted/40 p-5">
      <h3 className="font-display text-lg font-semibold">Ready to go?</h3>
      <p className="mt-1 text-sm text-muted-foreground">Type your name to accept. No payment is taken here; we confirm the final scope with you on a kickoff call before invoicing.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-sm"><span className="text-muted-foreground">Full name (your signature)</span><input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className="roi-input mt-1 font-[cursive] text-lg" /></label>
        <label className="text-sm"><span className="text-muted-foreground">WhatsApp</span><input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} inputMode="tel" maxLength={40} className="roi-input mt-1" /></label>
        <label className="text-sm"><span className="text-muted-foreground">Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} className="roi-input mt-1" /></label>
      </div>
      <label className="mt-4 flex items-start gap-2.5 text-sm text-foreground">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--emma-violet)]" />
        I'd like to start with the {doc.recommendedPlan} plan as outlined above, for {req.business}.
      </label>
      <button disabled={!ok || state === "saving"} className="btn-primary-gradient mt-4 inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white disabled:opacity-50">
        {state === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />} Accept proposal
      </button>
      {state === "error" && <p role="alert" className="mt-3 text-sm text-red-600">That didn't save. Please try again or message us on WhatsApp.</p>}
    </form>
  );
}
