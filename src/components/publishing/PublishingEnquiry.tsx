import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";
import { buildWa } from "@/lib/leads";
import { useAccount } from "@/lib/auth/use-account";
import { Field, Notice, PrimaryBtn, inputCls } from "./shared";

export const PROJECT_TYPES = ["New eBook", "eBook and paperback", "Paperback only", "Existing book (relaunch)", "Series", "Not sure yet"] as const;
export const MS_STATUS = ["Idea or outline", "Draft in progress", "Finished, not edited", "Finished and edited", "Already published"] as const;
export const SERVICE_OPTS = ["Formatting & conversion", "Cover design", "Mockups & graphics", "Description & keywords", "Launch strategy", "Book marketing", "Author website", "Publishing guidance"] as const;
export const BUDGETS = ["Under $300", "$300–$1,000", "$1,000–$3,000", "$3,000+", "Not sure yet"] as const;
const SERVICE_FROM_SLUG: Record<string, (typeof SERVICE_OPTS)[number]> = {
  "ebook-formatting-conversion": "Formatting & conversion", "book-cover-design": "Cover design", "book-mockups-graphics": "Mockups & graphics",
  "book-metadata-positioning": "Description & keywords", "book-launch-strategy": "Launch strategy", "book-marketing": "Book marketing", "ebook-publishing": "Publishing guidance",
};

export default function PublishingEnquiry({ service }: { service?: string }) {
  const acct = useAccount();
  const [f, setF] = useState({ name: "", email: "", whatsapp: "", book_title: "", project_type: "" as string, manuscript_status: "" as string, audience: "", services: [] as string[], launch_date: "", budget: "", details: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => { const s = service && SERVICE_FROM_SLUG[service]; if (s) setF((x) => (x.services.includes(s) ? x : { ...x, services: [...x.services, s] })); }, [service]);
  useEffect(() => { if (acct.email && !f.email) setF((x) => ({ ...x, email: acct.email ?? "" })); }, [acct.email]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: keyof typeof f, v: unknown) => setF((x) => ({ ...x, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (f.website) { setDone(true); return; } // spam trap
    if (!f.name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) { setErr("Add your name and a valid email address."); return; }
    if (!f.project_type || !f.manuscript_status) { setErr("Choose the project type and where the manuscript is."); return; }
    setBusy(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("publishing_enquiries").insert({
      name: f.name.trim().slice(0, 120), email: f.email.trim().toLowerCase().slice(0, 200), whatsapp: f.whatsapp.trim().slice(0, 40) || null,
      book_title: f.book_title.trim().slice(0, 200) || null, project_type: f.project_type, manuscript_status: f.manuscript_status,
      audience: f.audience.trim().slice(0, 500) || null, services: f.services, launch_date: f.launch_date || null, budget: f.budget || null,
      details: f.details.trim().slice(0, 4000) || null, source: (service ? `service:${service}` : "publishing").slice(0, 80),
    });
    setBusy(false);
    if (error) { setErr(/several enquiries/.test(error.message) ? error.message : "Your enquiry couldn't be sent. Please try again, or message us on WhatsApp."); return; }
    track("publishing_enquiry_submitted", { services: f.services.length, type: f.project_type });
    setDone(true);
  }

  if (done) return (
    <div className="lg rounded-3xl border border-border p-6" role="status">
      <CheckCircle2 className="h-7 w-7 text-emerald-500" aria-hidden="true" />
      <h2 className="mt-3 font-display text-xl font-semibold">Thanks — your enquiry was received</h2>
      <p className="mt-2 text-sm text-muted-foreground">It's saved in our enquiries inbox. Emmanuel reads every book enquiry and replies by email{f.whatsapp ? " or WhatsApp" : ""}, usually within one working day.</p>
      <a href={buildWa(`Hi Emmanuel! I just sent a publishing enquiry${f.book_title ? ` about "${f.book_title}"` : ""}.`)} target="_blank" rel="noopener noreferrer" className="nav-ghost mt-4 inline-flex h-auto px-4 py-2 text-sm"><MessageCircle className="h-4 w-4" aria-hidden="true" />Also message on WhatsApp</a>
    </div>
  );
  return (
    <form onSubmit={submit} className="lg space-y-4 rounded-3xl border border-border p-5 md:p-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name *"><input className={inputCls} autoComplete="name" required maxLength={120} value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Email *"><input className={inputCls} type="email" autoComplete="email" required maxLength={200} value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
        <Field label="WhatsApp (optional)"><input className={inputCls} type="tel" autoComplete="tel" maxLength={40} value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></Field>
        <Field label="Book title (or working title)"><input className={inputCls} maxLength={200} value={f.book_title} onChange={(e) => set("book_title", e.target.value)} /></Field>
        <Field label="Project type *"><select className={inputCls} required value={f.project_type} onChange={(e) => set("project_type", e.target.value)}><option value="">Choose…</option>{PROJECT_TYPES.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Where is the manuscript? *"><select className={inputCls} required value={f.manuscript_status} onChange={(e) => set("manuscript_status", e.target.value)}><option value="">Choose…</option>{MS_STATUS.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Target launch date (optional)"><input type="date" className={inputCls} value={f.launch_date} onChange={(e) => set("launch_date", e.target.value)} /></Field>
        <Field label="Budget range (optional)"><select className={inputCls} value={f.budget} onChange={(e) => set("budget", e.target.value)}><option value="">Prefer not to say</option>{BUDGETS.map((x) => <option key={x}>{x}</option>)}</select></Field>
      </div>
      <Field label="Who is the book for?"><input className={inputCls} maxLength={500} value={f.audience} onChange={(e) => set("audience", e.target.value)} /></Field>
      <fieldset><legend className="text-sm font-medium">Services you're interested in</legend>
        <div className="mt-2 flex flex-wrap gap-2">{SERVICE_OPTS.map((x) => <label key={x} className="tsh-chip cursor-pointer"><input type="checkbox" className="mr-2" checked={f.services.includes(x)} onChange={(e) => set("services", e.target.checked ? [...f.services, x] : f.services.filter((y) => y !== x))} />{x}</label>)}</div>
      </fieldset>
      <Field label="Anything else? (genre, length, deadlines, links)"><textarea className={inputCls} rows={4} maxLength={4000} value={f.details} onChange={(e) => set("details", e.target.value)} /></Field>
      <div className="hidden" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set("website", e.target.value)} /></label></div>
      {err && <Notice tone="error">{err}</Notice>}
      <div className="flex flex-wrap items-center gap-3">
        <PrimaryBtn type="submit" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Send my enquiry</PrimaryBtn>
        <p className="text-xs text-muted-foreground">Free and no obligation. We use these details only to reply about your book. Please don't send your manuscript here.</p>
      </div>
    </form>
  );
}
