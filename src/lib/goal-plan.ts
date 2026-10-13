import { z } from "zod";

export const ROLES = ["Business owner", "Freelancer / consultant", "Creator / coach", "Professional / employee", "Student / career changer"];
export const HOURS = ["Under 5 hours a week", "5–10 hours a week", "10–20 hours a week", "20+ hours a week"];
export const OBSTACLES = ["Procrastination", "Too many priorities", "Not enough time", "Unclear next steps", "Losing motivation", "Fear of selling / visibility"];

export const planRequestSchema = z.object({
  role: z.string().max(60),
  goal: z.string().trim().min(8).max(240),
  why: z.string().trim().max(240).optional().default(""),
  now: z.string().trim().max(300).optional().default(""),
  hours: z.string().max(40),
  obstacle: z.string().max(60),
  startDate: z.string().max(20).optional().default(""),
});
export type PlanRequest = z.infer<typeof planRequestSchema>;

export interface GoalPlan {
  headline: string;
  northStar: string;
  milestones: { month: number; outcome: string; measure: string }[];
  weeks: { week: number; focus: string; actions: string[] }[];
  habits: string[];
  risks: { risk: string; plan: string }[];
  checkin: string;
}
