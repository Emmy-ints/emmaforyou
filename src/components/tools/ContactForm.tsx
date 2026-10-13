import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };
const TOPICS = ["A new project", "AI automation", "Website or app", "Marketing & ads", "Web3 / smart contracts", "Consulting or coaching", "Something else"];

export default function ContactForm() {
  const [f, setF] = useState({ name: "", whatsapp: "", email: "", topic: TOPICS[0], message: "" });
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const ok = f.name.trim() && f.message.trim().length >= 5 && (f.whatsapp.replace(/\D/g, "").length >= 6 || f.email.includes("@"));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ok) return;
    setState("saving");
    const { error } = await db.from("tool_requests").insert({
      tool: "Contact form", name: f.name.trim().slice(0, 120), whatsapp: f.whatsapp.trim().slice(0, 40) || null, email: f.email.trim().slice(0, 200) || null,
      summary: `Topic: ${f.topic}\n${f.message.trim()}`.slice(0, 3000),
    });
    if (error) { setState("error"); return; }
    track("lead_submitted", { source: "contact" });
    setState("done");
  }

  if (state === "done") return <p className="rounded-[20px] border border-emerald-500/30 bg-emerald-500/10 p-6 text-foreground">Thanks {f.name.split(" ")[0]}, your message is in. Emmanuel will reply on WhatsApp or email.</p>;
  return (
    <form onSubmit={submit} className="space-y-4 rounded-[24px] border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <h2 className="font-display text-xl font-semibold">Send a message</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-muted-foreground">Name<input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={120} className="input mt-1" /></label>
        <label className="text-sm text-muted-foreground">What's it about?<select value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} className="input mt-1">{TOPICS.map((t) => <option key={t}>{t}</option>)}</select></label>
        <label className="text-sm text-muted-foreground">WhatsApp<input value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} inputMode="tel" maxLength={40} className="input mt-1" /></label>
        <label className="text-sm text-muted-foreground">Email<input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} maxLength={200} className="input mt-1" /></label>
      </div>
      <label className="block text-sm text-muted-foreground">Message<textarea required value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} rows={5} maxLength={2500} className="input mt-1" /></label>
      <p className="text-xs text-muted-foreground">Add a WhatsApp number or an email so we can reply.</p>
      <button disabled={!ok || state === "saving"} className="btn-primary-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white disabled:opacity-50">
        {state === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send message
      </button>
      {state === "error" && <p role="alert" className="text-sm text-red-600">That didn't send. Please try WhatsApp instead.</p>}
    </form>
  );
}
