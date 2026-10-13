import { supabase } from "@/integrations/supabase/client";

/** Owner-written case study details for a portfolio project (edited in /dashboard). */
export interface CaseStudy {
  slug: string;
  published: boolean;
  client_role: string | null;
  challenge: string | null;
  approach: string | null;
  deliverables: string[];
  results: string | null;
  timeline: string | null;
  quote: string | null;
  quote_author: string | null;
  screenshots: string[];
  updated_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

/** Published details for one project, or null. Never throws (the page still renders without it). */
export async function fetchCaseStudy(slug: string): Promise<CaseStudy | null> {
  try {
    const { data, error } = await db.from("case_studies").select("*").eq("slug", slug).eq("published", true).maybeSingle();
    if (error) return null;
    return (data as CaseStudy) ?? null;
  } catch {
    return null;
  }
}
