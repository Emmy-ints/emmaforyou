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

/** Structured 90-day framework used when the AI service is unavailable. Built only from the person's answers. */
export function fallbackPlan(p: PlanRequest): GoalPlan {
  const goal = p.goal.replace(/\s+/g, " ").trim().replace(/\.$/, "");
  const obstacle = p.obstacle || "staying consistent";
  const weeks: GoalPlan["weeks"] = [
    ["Clarify the target", ["Write the goal as one measurable sentence with a finish date", "List what 'done' looks like at day 30, 60 and 90", `Block ${p.hours || "your available time"} in your calendar for the next 12 weeks`]],
    ["Map the work", ["Break the goal into 5–8 projects", "Pick the one project that unlocks the others", "Note the people, tools and money each project needs"]],
    ["First visible step", ["Finish one small deliverable for the first project", "Share progress with one person who'll hold you to it", "Set up a simple tracker (sheet or notes) for weekly numbers"]],
    ["Build momentum", ["Complete the first project's main deliverable", "Remove one task that doesn't move the goal", "Review: what took longer than planned, and why"]],
    ["Month 1 review", ["Compare progress with your day-30 picture", "Adjust the plan for month 2", "Celebrate one specific win"]],
    ["Second project", ["Start the next most important project", "Ask for feedback from someone who's done this before", "Batch similar tasks into one session"]],
    ["Systems", ["Turn a repeated task into a checklist or template", "Automate or delegate one recurring job", "Check your weekly numbers trend"]],
    ["Push through the middle", [`Plan around your obstacle (${obstacle}) before the week starts`, "Do the hardest task first in each session", "Finish the second project's main deliverable"]],
    ["Month 2 review", ["Compare progress with your day-60 picture", "Drop or defer anything that won't matter by day 90", "Confirm the final 4 weeks' priorities"]],
    ["Final stretch", ["Work on the remaining highest-impact project", "Fix the biggest gap your numbers show", "Line up anything that needs other people's input"]],
    ["Finish and polish", ["Complete outstanding deliverables", "Test, check or get feedback on the finished work", "Prepare your day-90 summary"]],
    ["Day 90 review", ["Measure the result against your goal sentence", "Write down what worked and what to stop", "Set the next 90-day goal"]],
  ].map(([focus, actions], i) => ({ week: i + 1, focus: focus as string, actions: actions as string[] }));
  return {
    headline: "Your 90-day plan, week by week",
    northStar: `${goal} — measured weekly and reviewed at days 30, 60 and 90.`,
    milestones: [
      { month: 1, outcome: "Plan set, first project delivered, tracker running", measure: "First deliverable finished and weekly numbers recorded" },
      { month: 2, outcome: "Second project delivered and repeat work systemised", measure: "Two projects complete; at least one task automated or delegated" },
      { month: 3, outcome: `Goal reached or clearly measured: ${goal}`, measure: "Day-90 review written with results against the goal" },
    ],
    weeks,
    habits: ["Weekly 20-minute planning session", "Update your tracker every week", "One check-in with an accountability partner", "Protect your scheduled work blocks"],
    risks: [{ risk: obstacle, plan: `If ${obstacle.toLowerCase()} gets in the way, then shrink the week's goal to one task and still complete it.` }],
    checkin: "1) What did I finish this week? 2) What got in the way, and what will I change? 3) What is the one most important task next week?",
  };
}
