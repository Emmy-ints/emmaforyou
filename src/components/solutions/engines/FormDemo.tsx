import { useState } from "react";
import { Check, Upload } from "lucide-react";
import { Badge, Btn, ListEditor, Outbox, Panel, SettingsPanel, Toggles, uid, useDemoSetting, type EngineProps, type OutboxItem } from "./ui";

interface F { key: string; label: string; type: "text" | "email" | "select" | "textarea" | "date" | "number" | "file" | "radio"; options?: string[]; required?: boolean; showIf?: [string, string]; optional?: boolean }
interface Cfg { steps: { title: string; fields: F[] }[]; statuses: string[]; submitLabel: string; qualify?: (v: Record<string, string>) => string }

const P: Record<string, Cfg> = {
  intake: { submitLabel: "Submit & book", statuses: ["Received", "Reviewed", "Call booked", "Proposal sent"], steps: [
    { title: "About you", fields: [{ key: "name", label: "Full name", type: "text", required: true }, { key: "email", label: "Email", type: "email", required: true }, { key: "company", label: "Company", type: "text", optional: true }] },
    { title: "Your project", fields: [{ key: "service", label: "What do you need?", type: "select", options: ["Website", "Online store", "AI assistant", "Not sure"], required: true }, { key: "pages", label: "Roughly how many pages?", type: "number", showIf: ["service", "Website"] }, { key: "products", label: "How many products?", type: "number", showIf: ["service", "Online store"] }, { key: "budget", label: "Budget", type: "radio", options: ["Under $1k", "$1k–5k", "$5k+"], required: true }, { key: "brief", label: "Anything else?", type: "textarea", optional: true }] }],
    qualify: (v) => (v.budget === "Under $1k" ? "Suggested: starter package + self-serve resources" : v.budget === "$5k+" ? "Priority lead: book a call this week" : "Good fit: standard discovery call") },
  leave: { submitLabel: "Request leave", statuses: ["Submitted", "Manager approved", "HR recorded"], steps: [
    { title: "Leave request", fields: [{ key: "name", label: "Employee name", type: "text", required: true }, { key: "type", label: "Type", type: "select", options: ["Annual", "Sick", "Compassionate", "Unpaid"], required: true }, { key: "from", label: "From", type: "date", required: true }, { key: "days", label: "Working days", type: "number", required: true }, { key: "note", label: "Doctor's note", type: "file", showIf: ["type", "Sick"] }, { key: "cover", label: "Who covers your work?", type: "text", optional: true }] }] },
  admissions: { submitLabel: "Submit application", statuses: ["Received", "Documents checked", "Interview scheduled", "Offer made"], steps: [
    { title: "Student", fields: [{ key: "name", label: "Student's full name", type: "text", required: true }, { key: "dob", label: "Date of birth", type: "date", required: true }, { key: "grade", label: "Applying for", type: "select", options: ["Nursery", "Primary 1", "JSS 1", "SS 1"], required: true }] },
    { title: "Parent / guardian", fields: [{ key: "parent", label: "Parent name", type: "text", required: true }, { key: "email", label: "Email", type: "email", required: true }, { key: "transfer", label: "Transferring from another school?", type: "radio", options: ["No", "Yes"], required: true }, { key: "report", label: "Last school report", type: "file", showIf: ["transfer", "Yes"] }] }] },
  grant: { submitLabel: "Submit application", statuses: ["Submitted", "Eligibility check", "Under review", "Decision"], steps: [
    { title: "Applicant", fields: [{ key: "org", label: "Organisation name", type: "text", required: true }, { key: "email", label: "Contact email", type: "email", required: true }, { key: "kind", label: "Applicant type", type: "select", options: ["Registered charity", "Community group", "Individual"], required: true }, { key: "reg", label: "Registration number", type: "text", showIf: ["kind", "Registered charity"] }] },
    { title: "Project", fields: [{ key: "amount", label: "Amount requested ($)", type: "number", required: true }, { key: "summary", label: "Project summary", type: "textarea", required: true }, { key: "budget", label: "Budget document", type: "file", optional: true }] }] },
  claim: { submitLabel: "Submit claim", statuses: ["Claim received", "Documents verified", "Assessor review", "Settled"], steps: [
    { title: "Policy", fields: [{ key: "policy", label: "Policy number", type: "text", required: true }, { key: "name", label: "Policyholder name", type: "text", required: true }, { key: "kind", label: "Claim type", type: "select", options: ["Motor", "Health", "Property", "Travel"], required: true }] },
    { title: "Incident", fields: [{ key: "date", label: "Date of incident", type: "date", required: true }, { key: "police", label: "Police report number", type: "text", showIf: ["kind", "Motor"] }, { key: "desc", label: "What happened?", type: "textarea", required: true }, { key: "photos", label: "Photos / receipts", type: "file", required: true }] }] },
};

export default function FormDemo(props: EngineProps) {
  const { preset, brand } = props;
  const base = P[preset] ?? P.intake;
  const [statuses, setStatuses] = useDemoSetting<string[]>(props, "statuses", base.statuses);
  const [hidden, setHidden] = useDemoSetting<string[]>(props, "hidden", []);
  const [mustHave, setMustHave] = useDemoSetting<string[]>(props, "required", []);
  const [notify, setNotify] = useDemoSetting<string[]>(props, "notify", ["confirm", "staff", "status"]);
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const push = (channel: string, to: string, text: string) => setOutbox((o) => [...o, { id: uid(), channel, to, text }].slice(-30));
  // Optional fields can be hidden or made required from the settings.
  const cfg: Cfg = { ...base, statuses, steps: base.steps.map((s) => ({ ...s, fields: s.fields.map((f) => (f.optional && mustHave.includes(f.key) ? { ...f, required: true } : f)) })) };
  const optionalFields = base.steps.flatMap((s) => s.fields).filter((f) => f.optional);
  const [step, setStep] = useState(0);
  const [v, setV] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ref, setRef] = useState<string | null>(null);
  const [status, setStatus] = useState(0);
  const review = step === cfg.steps.length;
  const visible = (f: F) => !hidden.includes(f.key) && (!f.showIf || v[f.showIf[0]] === f.showIf[1]);

  const validate = (fs: F[]) => {
    const e: Record<string, string> = {};
    for (const f of fs.filter(visible)) {
      const val = (v[f.key] ?? "").trim();
      if (f.required && !val) e[f.key] = "Required";
      else if (f.type === "email" && val && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)) e[f.key] = "Enter a valid email";
      else if (f.type === "number" && val && Number(val) < 0) e[f.key] = "Must be positive";
    }
    setErrors(e); return Object.keys(e).length === 0;
  };
  const next = () => { if (validate(cfg.steps[step].fields)) setStep(step + 1); };
  const contact = v.email || v.name || v.parent || v.org || "Applicant";
  const submit = () => {
    const r = `${brand.replace(/\W/g, "").slice(0, 3).toUpperCase() || "REF"}-${Math.floor(100000 + Math.random() * 900000)}`;
    setRef(r); setStatus(0);
    if (notify.includes("confirm")) push("Email", contact, `We've received your ${cfg.submitLabel.toLowerCase().replace("submit ", "")}. Reference ${r}.`);
    if (notify.includes("staff")) push("Email", `${brand} team`, `New submission ${r}${cfg.qualify ? `: ${cfg.qualify(v)}` : ""}.`);
  };
  const reset = () => { setRef(null); setStep(0); setV({}); setErrors({}); };

  const settings = (
    <SettingsPanel summary={`${statuses.length} statuses · ${hidden.length} hidden field${hidden.length === 1 ? "" : "s"}`}>
      {optionalFields.length > 0 && (
        <fieldset><legend className="text-xs font-semibold text-foreground">Optional fields</legend>
          <ul className="mt-1.5 space-y-1 text-sm">{optionalFields.map((f) => (
            <li key={f.key} className="flex flex-wrap items-center gap-3"><span className="w-44">{f.label}</span>
              <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={!hidden.includes(f.key)} onChange={(e) => setHidden((h) => (e.target.checked ? h.filter((x) => x !== f.key) : [...h, f.key]))} className="accent-[var(--demo-accent)]" />Show</label>
              <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" disabled={hidden.includes(f.key)} checked={mustHave.includes(f.key)} onChange={(e) => setMustHave((m) => (e.target.checked ? [...m, f.key] : m.filter((x) => x !== f.key)))} className="accent-[var(--demo-accent)]" />Required</label>
            </li>))}</ul>
        </fieldset>
      )}
      <ListEditor label="Status stages (shown to the applicant)" items={statuses} onChange={setStatuses} min={2} max={7} placeholder="e.g. Awaiting payment" />
      <Toggles label="Notifications" options={[["confirm", "Confirmation to the applicant"], ["staff", "New-submission alert to staff"], ["status", "Status updates to the applicant"]]} value={notify} onChange={setNotify} />
    </SettingsPanel>
  );

  if (ref) return (
    <div className="space-y-4">
    {settings}
    <Panel title="Application status (applicant view)" actions={<Btn variant="ghost" onClick={reset}>New submission</Btn>}>
      <p className="text-sm">Reference <strong>{ref}</strong>.</p>
      {cfg.qualify && <p className="mt-1 text-sm"><Badge tone="accent">Auto-routing</Badge> {cfg.qualify(v)}</p>}
      <ol className="mt-4 flex flex-wrap gap-2">{cfg.statuses.map((s, i) => <li key={`${i}-${s}`} className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${i <= status ? "bg-[var(--demo-accent)] text-white" : "bg-muted text-muted-foreground"}`}>{i < status && <Check className="h-3 w-3" />}{s}</li>)}</ol>
      <div className="mt-4 rounded-xl border border-dashed border-border p-3"><p className="text-xs text-muted-foreground">Staff view</p><Btn className="mt-1" disabled={status >= cfg.statuses.length - 1} onClick={() => { const n = Math.min(cfg.statuses.length - 1, status + 1); setStatus(n); if (notify.includes("status")) push("Email + SMS", contact, `Update on ${ref}: ${cfg.statuses[n]}.`); }}>Move to "{cfg.statuses[Math.min(cfg.statuses.length - 1, status + 1)]}"</Btn><p className="mt-1 text-[11px] text-muted-foreground">Status changes are logged; applicant updates follow your notification settings.</p></div>
    </Panel>
    <Outbox items={outbox} onClear={() => setOutbox([])} />
    </div>
  );

  return (
    <div className="space-y-4">
    {settings}
    <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
      <Panel title={review ? "Review & submit" : `Step ${step + 1} of ${cfg.steps.length}: ${cfg.steps[step].title}`}>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-[var(--demo-accent)] transition-all" style={{ width: `${(step / cfg.steps.length) * 100}%` }} /></div>
        {review ? (
          <>
            <dl className="divide-y divide-border text-sm">{cfg.steps.flatMap((s) => s.fields).filter(visible).map((f) => <div key={f.key} className="flex justify-between gap-3 py-1.5"><dt className="text-muted-foreground">{f.label}</dt><dd className="text-right font-medium">{v[f.key] || "—"}</dd></div>)}</dl>
            <div className="mt-4 flex gap-2"><Btn variant="ghost" onClick={() => setStep(step - 1)}>Back</Btn><Btn onClick={submit}>{cfg.submitLabel}</Btn></div>
          </>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); next(); }} noValidate className="space-y-3">
            {cfg.steps[step].fields.filter(visible).map((f) => (
              <div key={f.key}>
                {f.type === "radio" ? (
                  <fieldset><legend className="text-xs font-medium text-muted-foreground">{f.label}{f.required && " *"}</legend><div className="mt-1 flex flex-wrap gap-1.5">{f.options!.map((o) => <button key={o} type="button" aria-pressed={v[f.key] === o} onClick={() => setV({ ...v, [f.key]: o })} className={`rounded-full border px-3 py-1 text-sm ${v[f.key] === o ? "border-[var(--demo-accent)] bg-[color-mix(in_srgb,var(--demo-accent)_10%,transparent)]" : "border-border"}`}>{o}</button>)}</div></fieldset>
                ) : f.type === "file" ? (
                  <label className="block text-xs font-medium text-muted-foreground">{f.label}{f.required && " *"}<span className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-foreground"><Upload className="h-4 w-4" />{v[f.key] || "Choose a file (stays in your browser)"}<input type="file" className="sr-only" onChange={(e) => setV({ ...v, [f.key]: e.target.files?.[0]?.name ?? "" })} /></span></label>
                ) : (
                  <label className="block text-xs font-medium text-muted-foreground">{f.label}{f.required && " *"}
                    {f.type === "select" ? <select value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} className="mt-1 block w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground"><option value="">Choose…</option>{f.options!.map((o) => <option key={o}>{o}</option>)}</select>
                      : f.type === "textarea" ? <textarea value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} rows={3} maxLength={600} className="mt-1 block w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground" />
                      : <input type={f.type} value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} maxLength={120} aria-invalid={!!errors[f.key]} className={`mt-1 block w-full rounded-lg border bg-background px-2.5 py-1.5 text-sm text-foreground ${errors[f.key] ? "border-red-500" : "border-border"}`} />}
                  </label>
                )}
                {errors[f.key] && <p role="alert" className="mt-0.5 text-xs text-red-600">{errors[f.key]}</p>}
                {f.showIf && <p className="mt-0.5 text-[10px] text-[var(--demo-accent)]">Shown because of your answer above</p>}
              </div>
            ))}
            <div className="flex gap-2">{step > 0 && <Btn variant="ghost" onClick={() => setStep(step - 1)}>Back</Btn>}<Btn type="submit">Continue</Btn></div>
          </form>
        )}
      </Panel>
      <Panel title="How this form behaves">
        <ul className="list-disc space-y-1 pl-4 text-[12px] text-muted-foreground">
          <li>Conditional questions appear only when relevant.</li>
          <li>Required fields and email formats are checked before moving on.</li>
          <li>Show, hide or require optional fields in Demo settings, like an admin would.</li>
          {cfg.qualify && <li>Answers are scored to route the enquiry.</li>}
        </ul>
      </Panel>
    </div>
    </div>
  );
}
