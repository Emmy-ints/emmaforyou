import { z } from "zod";

export const INDUSTRIES = ["Salon & beauty", "Restaurant & food", "Clinic & health", "Real estate", "Fashion & retail", "Ecommerce brand", "Coach & consultant", "Education", "Hotel & travel", "Professional services", "Other"];
export const GOALS = ["Get more enquiries", "Sell online", "Reply to customers instantly", "Look more professional", "Grow on social media", "Run profitable ads", "Rank on Google", "Save time on admin"];
export const SERVICES = ["AI automation & chatbots", "Website design", "Ecommerce store", "Email marketing", "Social media management", "Paid ads (Meta / Google)", "SEO", "Custom app", "UI/UX design", "Conversion optimisation", "Marketing & promotion", "Business consulting", "Accountability coaching"];
export const BUDGETS = ["Under $100 / month", "$100–300 / month", "$300–800 / month", "$800+ / month", "One-off project", "Not sure yet"];
export const TIMELINES = ["As soon as possible", "Within a month", "In 2–3 months", "Just exploring"];

export const proposalRequestSchema = z.object({
  business: z.string().trim().min(2).max(120),
  contactName: z.string().trim().min(2).max(80),
  industry: z.string().max(60),
  location: z.string().trim().max(80).optional().default(""),
  hasWebsite: z.enum(["yes", "no", "outdated"]),
  goals: z.array(z.string().max(60)).min(1).max(8),
  services: z.array(z.string().max(60)).max(13),
  budget: z.string().max(40),
  timeline: z.string().max(40),
  notes: z.string().trim().max(600).optional().default(""),
});
export type ProposalRequest = z.infer<typeof proposalRequestSchema>;

export interface ProposalDoc {
  title: string;
  summary: string;
  goals: string[];
  challenges: string[];
  recommendedPlan: "Starter" | "Growth" | "Pro" | "Enterprise";
  planReason: string;
  phases: { name: string; when: string; deliverables: string[] }[];
  extras: { item: string; note: string }[];
  measures: { metric: string; how: string }[];
  nextSteps: string[];
}

export const PLAN_NAMES = ["Starter", "Growth", "Pro", "Enterprise"] as const;
