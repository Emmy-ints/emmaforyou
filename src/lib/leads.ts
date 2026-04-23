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
const INTAKE_KEY = "emma_intake_backup";

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

// ===== Business Intake =====

export interface IntakePayload {
  full_name: string;
  business_name: string;
  business_type?: string;
  business_description?: string;
  years_in_business?: string;
  business_stage?: string;
  country?: string;
  city?: string;
  target_market?: string[];
  customer_age_min?: number;
  customer_age_max?: number;
  customer_gender?: string;
  has_website?: string;
  website_url?: string;
  website_rating?: number;
  social_platforms?: Record<string, string | number>;
  email_list_size?: string;
  runs_ads?: string;
  ad_platforms?: string[];
  ad_spend?: string;
  monthly_revenue?: string;
  revenue_trend?: string;
  revenue_source?: string;
  growth_budget?: string;
  has_marketing_budget?: string;
  services_needed?: string[];
  primary_goal?: string;
  revenue_goal?: string;
  desired_outcomes?: string;
  success_metric?: string;
  timeline?: string;
  engagement_type?: string;
  communication_preference?: string[];
  start_timeline?: string;
  worked_with_agency?: string;
  agency_experience?: string;
  biggest_fear?: string;
  email: string;
  whatsapp: string;
  instagram_handle?: string;
  how_found_us?: string;
  referrer_name?: string;
  uploaded_file_name?: string;
  other_notes?: string;
  consent: boolean;
  language?: string;
}

export async function submitIntake(payload: IntakePayload): Promise<{ ok: boolean; error?: string }> {
  try {
    if (typeof window !== "undefined") {
      const existing = JSON.parse(localStorage.getItem(INTAKE_KEY) || "[]");
      existing.push({ ...payload, ts: new Date().toISOString() });
      localStorage.setItem(INTAKE_KEY, JSON.stringify(existing.slice(-20)));
    }
  } catch { /* ignore */ }

  try {
    const { error } = await supabase.from("business_intakes").insert(payload);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export function buildIntakeWhatsApp(businessName: string, location: string): string {
  const text = encodeURIComponent(
    `Hi EmmaForYou! I just submitted my business profile. Business: ${businessName} in ${location}. Looking forward to our conversation! 🚀`
  );
  return `https://wa.me/message/HHGMMWMRJFYUC1?text=${text}`;
}

// ===== ROI Calculator =====
export interface RoiPayload {
  name?: string;
  whatsapp?: string;
  email?: string;
  niche: string;
  current_revenue: number;
  current_ad_spend: number;
  current_leads: number;
  conversion_rate: number;
  avg_order_value: number;
  budget: string;
  timeline: number;
  projected_revenue: number;
  additional_revenue: number;
  projected_leads: number;
  roi_multiplier: number;
  break_even_days: number;
  language?: string;
}

export async function submitRoi(p: RoiPayload) {
  try {
    const { error } = await supabase.from("roi_calculations").insert(p);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// ===== Lead magnet downloads =====
export interface MagnetPayload {
  name: string;
  whatsapp: string;
  email?: string;
  business_type?: string;
  resource_slug: string;
  resource_title: string;
  opted_in_weekly?: boolean;
  language?: string;
}
export async function submitMagnet(p: MagnetPayload) {
  try {
    const { error } = await supabase.from("lead_magnet_downloads").insert(p);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// ===== Quiz =====
export interface QuizPayload {
  name?: string;
  whatsapp?: string;
  business_type?: string;
  score: number;
  result_bucket: string;
  no_questions: number[];
  language?: string;
}
export async function submitQuiz(p: QuizPayload) {
  try {
    const { error } = await supabase.from("quiz_results").insert(p);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// ===== Email sequence leads =====
export interface EmailGenPayload {
  name?: string;
  whatsapp?: string;
  email?: string;
  business_name?: string;
  business_type?: string;
  sequence_goal?: string;
  tone?: string;
  language?: string;
}
export async function submitEmailGen(p: EmailGenPayload) {
  try {
    const { error } = await supabase.from("email_sequence_leads").insert(p);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// ===== Affiliates =====
export interface AffiliatePayload {
  full_name: string;
  whatsapp: string;
  email: string;
  source?: string;
}
export function generateRefCode(name: string): string {
  const clean = (name || "REF").trim().split(/\s+/)[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 8) || "REF";
  const num = Math.floor(1000 + Math.random() * 8999);
  return `${clean}${num}`;
}
export async function submitAffiliate(p: AffiliatePayload & { referral_code: string }) {
  try {
    const { error } = await supabase.from("affiliates").insert(p);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function logReferralClick(referral_code: string) {
  try {
    await supabase.from("referral_clicks").insert({
      referral_code,
      page: typeof window !== "undefined" ? window.location.pathname : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
  } catch { /* ignore */ }
}

export function buildWa(message: string): string {
  return `https://wa.me/message/HHGMMWMRJFYUC1?text=${encodeURIComponent(message)}`;
}
