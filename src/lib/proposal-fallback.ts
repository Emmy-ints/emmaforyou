/**
 * Rule-based proposal used when the AI service is unavailable. Uses only the published plans
 * and the facts stated in the proposal prompt (no invented prices, results or timelines).
 */
import type { ProposalDoc, ProposalRequest } from "./proposal";

const EXTRA_SERVICES = new Set(["Custom app", "UI/UX design", "Conversion optimisation", "Marketing & promotion", "Business consulting", "Accountability coaching", "Web3 / dApp", "Smart contracts (Solidity)", "Blockchain / crypto project"]);

const SERVICE_DELIVERABLES: Record<string, string[]> = {
  "AI automation & chatbots": ["AI assistant trained on your services, prices and FAQs", "WhatsApp and website chat connected", "Hand-off rules to your team"],
  "Website design": ["Mobile-first website with clear calls to action", "Enquiry, WhatsApp and booking buttons", "Basic SEO and analytics set up"],
  "Ecommerce store": ["Online store with local payment options", "Abandoned-cart and order emails", "Product pages written to convert"],
  "Email marketing": ["Welcome and follow-up email sequences", "Lead capture forms connected to your list"],
  "Social media management": ["Content calendar and branded templates", "Scheduled posts on your chosen platforms"],
  "Paid ads (Meta / Google)": ["Campaign structure and tracking", "Ad creative and audience tests", "Weekly performance notes"],
  SEO: ["Keyword and competitor review", "On-page fixes and Google Business Profile", "Content plan for the next quarter"],
};

const GOAL_CHALLENGES: Record<string, string> = {
  "Get more enquiries": "Visitors arrive but there is no fast, obvious way to enquire.",
  "Sell online": "Buying online needs to be simple on a phone, with payment methods customers trust.",
  "Reply to customers instantly": "Messages that wait hours for a reply often go to a competitor.",
  "Look more professional": "An inconsistent brand and website make it harder to charge what you're worth.",
  "Grow on social media": "Posting without a plan takes time and rarely turns followers into customers.",
  "Run profitable ads": "Ads without tracking make it hard to tell what is actually bringing sales.",
  "Rank on Google": "Customers searching nearby need to find you before competitors.",
  "Save time on admin": "Repeated manual tasks take time away from serving customers.",
};

function planFor(p: ProposalRequest): { plan: ProposalDoc["recommendedPlan"]; reason: string } {
  const heavy = p.services.some((s) => ["Ecommerce store", "Custom app", "Paid ads (Meta / Google)"].includes(s)) || p.goals.length >= 4;
  switch (p.budget) {
    case "Under $100 / month":
      return { plan: "Starter", reason: `Starter fits a budget under $100 a month and covers the essentials first.${heavy ? " Some of what you've asked for needs a larger plan, so we'd start with the basics and grow from there." : ""}` };
    case "$100–300 / month":
      return { plan: heavy ? "Growth" : "Starter", reason: heavy ? "Growth covers automation, lead capture and website care in one plan. At $299 a month it sits at the top of your range, so Starter is the alternative if you'd rather start smaller." : "Starter covers your goals within your budget, and you can move up when you're ready." };
    case "$300–800 / month":
      return { plan: "Growth", reason: "Growth fits your budget and covers automation, lead capture and website care." };
    case "$800+ / month":
      return { plan: "Pro", reason: "Pro includes a custom website, full ad management and an AI chatbot, matching the scope you've described." };
    case "One-off project":
      return { plan: "Starter", reason: "One-off work is quoted after the strategy call. Starter keeps things running afterwards if you'd like ongoing support." };
    default:
      return { plan: "Growth", reason: "Growth is a balanced starting point; we'll confirm the right plan on the strategy call." };
  }
}

export function fallbackProposal(p: ProposalRequest): ProposalDoc {
  const { plan, reason } = planFor(p);
  const planServices = p.services.filter((s) => !EXTRA_SERVICES.has(s));
  const build = (planServices.length ? planServices : ["Website design", "AI automation & chatbots"]).flatMap((s) => SERVICE_DELIVERABLES[s] ?? []).slice(0, 4);
  const websiteNote = p.hasWebsite === "no" ? "Starting without a website" : p.hasWebsite === "outdated" ? "With an outdated website" : "With a website already in place";
  return {
    title: `Growth plan for ${p.business}`,
    summary: `${websiteNote}, ${p.business} wants to ${p.goals.map((g) => g.toLowerCase()).join(", ")}. We'll set up the essentials in the right order, connect them so enquiries are captured and answered quickly, and report on what's working each month. This draft is based on your answers; we'll refine it together on a free strategy call.`,
    goals: p.goals.slice(0, 4),
    challenges: p.goals.map((g) => GOAL_CHALLENGES[g]).filter(Boolean).slice(0, 3),
    recommendedPlan: plan,
    planReason: reason,
    phases: [
      { name: "Discovery & plan", when: "Week 1", deliverables: ["Strategy call and goal review", "Audit of your current channels", "Agreed plan and timeline"] },
      { name: "Build", when: "Weeks 2–3", deliverables: build.length ? build : ["Core setup for your chosen services"] },
      { name: "Launch", when: "Week 4", deliverables: ["Testing on mobile and desktop", "Go live", "Team walkthrough"] },
      { name: "Grow", when: "Monthly", deliverables: ["Monthly report", "Improvements based on results"] },
    ],
    extras: p.services.filter((s) => EXTRA_SERVICES.has(s)).slice(0, 2).map((item) => ({ item, note: "Fixed quote after the strategy call" })),
    measures: [
      { metric: "Enquiries and leads", how: "Counted from forms, WhatsApp and calls, reported monthly" },
      { metric: "Reply time", how: "Average time to first reply across channels" },
      { metric: "Website visits and conversions", how: "Tracked with analytics on your key pages" },
    ],
    nextSteps: ["Book a free strategy call", "Confirm scope and plan", "Onboarding starts within a week of signing"],
  };
}
