import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

export type ToolName = "Smart contract review" | "Goal planner" | "AI assistant chat" | "Exit offer" | "Contact form" | "App planner" | "Solution enquiry" | "Lab enquiry";

/** Small "talk to a human" form used at the end of a tool. Saves to tool_requests (owner emailed). */
export function LeadCapture({ tool, title, lead, button, summary, compact = false }: { tool: ToolName; title: string; lead: string; button: string; summary: string; compact?: boolean }) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const ok = name.trim().length > 0 && (whatsapp.replace(/\D/g, "").length >= 6 || email.includes("@"));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ok) return;
    setState("saving");
    const { error } = await db.from("tool_requests").insert({
      tool, name: name.trim().slice(0, 120), whatsapp: whatsapp.trim().slice(0, 40) || null, email: email.trim().slice(0, 200) || null, summary: summary.slice(0, 3000),
    });
    if (error) { setState("error"); return; }
    track("lead_submitted", { source: tool });
    setState("done");
  }

  if (state === "done") return <p className="no-print rounded-[20px] border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-foreground">Thanks {name.split(" ")[0]}! Emmanuel has your details and will get back to you shortly.</p>;
  return (
    <form onSubmit={submit} className={`no-print rounded-[24px] border border-border bg-card ${compact ? "p-4" : "p-6 shadow-[var(--shadow-card)]"}`}>
      <h3 className={`font-display font-semibold ${compact ? "text-base" : "text-xl"}`}>{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{lead}</p>
      <div className={`mt-4 grid gap-3 ${compact ? "" : "sm:grid-cols-3"}`}>
        <label><span className="sr-only">Your name</span><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={120} className="input" /></label>
        <label><span className="sr-only">WhatsApp number</span><input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp number" inputMode="tel" maxLength={40} className="input" /></label>
        <label><span className="sr-only">Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" maxLength={200} className="input" /></label>
      </div>
      <button disabled={!ok || state === "saving"} className="btn-primary-gradient mt-4 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">
        {state === "saving" && <Loader2 className="h-4 w-4 animate-spin" />} {button}
      </button>
      {state === "error" && <p role="alert" className="mt-2 text-sm text-red-600">That didn't send. Please try again or message us on WhatsApp.</p>}
    </form>
  );
}
