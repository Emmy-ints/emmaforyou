import { supabase } from "@/integrations/supabase/client";

export interface LeadPayload {
  source: "analyser_full" | "analyser_teaser" | "waitlist";
  name?: string;
  email?: string;
  whatsapp?: string;
  business_name?: string;
  business_type?: string;
  location?: string;
  revenue?: string;
  years_in_business?: string;
  presence?: string[];
  challenges?: string[];
  team_size?: string;
  budget?: string;
  goal?: string;
  timeline?: string;
  score?: number;
  recommended_services?: string[];
  language?: string;
}

const LOCAL_KEY = "emma_leads_backup";

export async function submitLead(payload: LeadPayload): Promise<{ ok: boolean; error?: string }> {
  // Always save a local backup first so we never lose a lead.
  try {
    if (typeof window !== "undefined") {
      const existing = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
      existing.push({ ...payload, ts: new Date().toISOString() });
      localStorage.setItem(LOCAL_KEY, JSON.stringify(existing.slice(-50)));
    }
  } catch {
    /* ignore */
  }

  try {
    const { error } = await supabase.from("leads").insert(payload);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export function buildWhatsAppLink(score: number, businessName: string): string {
  const text = encodeURIComponent(
    `Hi EmmaForYou! I just completed the business analyser. My business is ${businessName} and my score is ${score}/100. I'd like my full report.`
  );
  return `https://wa.me/message/HHGMMWMRJFYUC1?text=${text}`;
}
