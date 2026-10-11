import { useState } from "react";
import { Check, CheckCircle2, Loader2, Send } from "lucide-react";
import type { InquiryQuestion } from "@/lib/service-extras";
import { submitIntake, buildWa } from "@/lib/leads";
import { track } from "@/lib/analytics";

/** Inquiry form tailored to one service. Saved to business intakes (which emails the owner). */
export default function ServiceInquiryForm({ serviceName, serviceSlug, questions }: { serviceName: string; serviceSlug: string; questions: InquiryQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(true);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  function toggle(q: InquiryQuestion, opt: string) {
    setAnswers((a) => {
      const cur = a[q.id] ?? [];
      if (!q.multi) return { ...a, [q.id]: [opt] };
      return { ...a, [q.id]: cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt] };
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !business.trim()) return setError("Add your name and business name.");
    if (!whatsapp.trim() && !email.trim()) return setError("Add a WhatsApp number or email so we can reply.");
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) return setError("That email address doesn't look right.");
    if (!consent) return setError("Tick the box so we're allowed to contact you.");
    setError("");
    setState("sending");
    const summary = questions.map((q) => `${q.label} ${(answers[q.id] ?? []).join(", ") || "—"}`).join("\n");
    const start = answers.start?.[0];
    const res = await submitIntake({
      full_name: name.trim(),
      business_name: business.trim(),
      email: email.trim(),
      whatsapp: whatsapp.trim(),
      services_needed: [serviceName],
      primary_goal: `${serviceName} enquiry`,
      start_timeline: start,
      other_notes: [summary, notes.trim() ? `Notes: ${notes.trim()}` : ""].filter(Boolean).join("\n"),
      consent,
      source: `service:${serviceSlug}`,
    });
    if (res.ok) {
      setState("sent");
      track("cta_click", { name: "service_inquiry_sent", service: serviceSlug });
    } else {
      setState("error");
      setError("We couldn't send your enquiry. Please try again, or message us on WhatsApp.");
    }
  }

  if (state === "sent") {
    return (
      <div className="sif flex gap-3">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-[#3dd6f5]" />
        <div>
          <p className="font-display text-lg font-semibold text-white">Enquiry sent</p>
          <p className="mt-1 text-sm text-[#a6abd0]">Thanks, {name.split(" ")[0]}. Emmanuel will look at your answers and reply within one working day with next steps for {serviceName.toLowerCase()}.</p>
          <a href={buildWa(`Hi! I just sent an enquiry about ${serviceName} for ${business}.`)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-sm font-semibold text-[#3dd6f5] underline underline-offset-4">Need it sooner? Message on WhatsApp</a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="sif">
      <div className="space-y-5">
        {questions.map((q) => (
          <fieldset key={q.id}>
            <legend className="mb-2.5 text-sm font-semibold text-white">{q.label}{q.multi && <span className="font-normal text-[#8f94bf]"> · choose any</span>}</legend>
            <div className="flex flex-wrap gap-2">
              {q.options.map((opt) => {
                const on = (answers[q.id] ?? []).includes(opt);
                return (
                  <button key={opt} type="button" role={q.multi ? "checkbox" : "radio"} aria-checked={on} onClick={() => toggle(q, opt)} className={`sif-chip ${on ? "is-on" : ""}`}>
                    {on && <Check className="h-3.5 w-3.5" />}{opt}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
      <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
        <input className="roi-dark-input" placeholder="Your name *" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" aria-label="Your name" />
        <input className="roi-dark-input" placeholder="Business name *" value={business} onChange={(e) => setBusiness(e.target.value)} autoComplete="organization" aria-label="Business name" />
        <input className="roi-dark-input" placeholder="WhatsApp number" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} inputMode="tel" autoComplete="tel" aria-label="WhatsApp number" />
        <input className="roi-dark-input" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-label="Email" />
        <textarea className="roi-dark-input min-h-[90px] sm:col-span-2" placeholder="Anything else we should know? (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} aria-label="Anything else" />
      </div>
      <label className="mt-3 flex items-start gap-2.5 text-xs text-[#a6abd0]">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[#6d5bff]" />
        It's OK to contact me on WhatsApp or email about this enquiry.
      </label>
      {error && <p role="alert" className="mt-3 text-sm text-[#ffb4b4]">{error}</p>}
      <button type="submit" disabled={state === "sending"} className="btn-gold mt-5 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm disabled:opacity-70">
        {state === "sending" ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <><Send className="h-4 w-4" /> Send enquiry</>}
      </button>
    </form>
  );
}
