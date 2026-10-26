/**
 * Every factual claim the site makes about the business that isn't backed by data in this
 * codebase. Nothing here is removed by default: each claim shows as built until the owner records
 * its status in the control room (verified with evidence, a sample, or unverified) and chooses
 * whether visitors see it plainly, with a label, or not at all.
 */
import { useSetting } from "./site-settings";

export type ClaimStatus = "unverified" | "verified" | "sample";
export type ClaimDisplay = "show" | "label" | "hide";
export interface Claim { id: string; text: string; where: string; file: string; kind: "statistic" | "partner" | "credential" | "testimonial" | "urgency" | "result"; note: string }

export const CLAIMS: Claim[] = [
  { id: "stat-testimonials", text: "500+ Testimonials", where: "Homepage numbers band", file: "components/StatsSection.tsx", kind: "statistic", note: "The /testimonials page generates its reviews in code (now labelled Sample)." },
  { id: "stat-cases", text: "100+ Case Studies", where: "Homepage numbers band", file: "components/StatsSection.tsx", kind: "statistic", note: "The case_studies table has 0 rows; /cases is built from code." },
  { id: "stat-niches", text: "50+ Niches Served", where: "Homepage numbers band, social proof bar, hero", file: "components/StatsSection.tsx", kind: "statistic", note: "The site has pages for 50+ business types; whether clients were served in each isn't recorded." },
  { id: "stat-continents", text: "3 Continents", where: "Homepage numbers band, credentials", file: "components/StatsSection.tsx", kind: "statistic", note: "Portfolio lists clients in Nigeria, the USA and Germany." },
  { id: "partners", text: "Meta Business Partner, Google Partner, Shopify Expert, Stripe Verified, Microsoft Partner, WhatsApp Business", where: "Homepage partners & credentials", file: "components/home/TrustBadges.tsx", kind: "partner", note: "No partner IDs or directory listings are recorded in the code." },
  { id: "cred-reviews", text: "500+ Verified Client Reviews", where: "Homepage credentials", file: "components/home/TrustBadges.tsx", kind: "credential", note: "No verified-review source is connected (client_testimonials has 0 rows)." },
  { id: "cred-since", text: "Operating Since 2019", where: "Homepage credentials", file: "components/home/TrustBadges.tsx", kind: "credential", note: "No registration date or founding record in the code." },
  { id: "cred-featured", text: "Featured Digital Agency", where: "Homepage credentials", file: "components/home/TrustBadges.tsx", kind: "credential", note: "No publication or award named." },
  { id: "home-testimonials", text: "12 named testimonials and \"500+ Businesses. Real Results.\"", where: "Homepage testimonials preview", file: "components/TestimonialsPreview.tsx", kind: "testimonial", note: "Names and quotes are hard-coded; no consent or source records in the database." },
  { id: "expertise-line", text: "500+ Businesses Helped · 3 Continents · 6+ Years Experience", where: "Every service/expertise page, about block", file: "components/ExpertiseTemplate.tsx", kind: "statistic", note: "Same figures as the homepage." },
  { id: "countdown", text: "Monthly onboarding spots (e.g. 12 of 20 taken)", where: "Homepage countdown", file: "components/home/CountdownUrgency.tsx", kind: "urgency", note: "Hard-coded numbers; set real figures under Content → Claims." },
  { id: "results-ticker", text: "Client results strip (47 leads, +312% traffic, 86 reviews…)", where: "Homepage results strip", file: "components/home/ResultsTicker.tsx", kind: "result", note: "Lagos (+312%) and Maryland (47 leads) match portfolio records. The portfolio puts 86 new reviews at Wellness Clinic Halle, but the strip says a clinic in Abuja. London, Cape Town, Accra and Port Harcourt results have no matching project record." },
];

/** The owner's decision for a claim; unknown claims show as built. */
export function useClaim(id: string): { status: ClaimStatus; display: ClaimDisplay; evidence?: string } {
  const v = useSetting(`claim:${id}`);
  return { status: (v?.status as ClaimStatus) ?? "unverified", display: (v?.display as ClaimDisplay) ?? "show", evidence: v?.evidence };
}

export const CLAIM_LABEL: Record<ClaimStatus, string> = { unverified: "Unverified", verified: "Verified", sample: "Sample" };
